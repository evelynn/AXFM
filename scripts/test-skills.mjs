#!/usr/bin/env node
/**
 * AXFM 스킬 린트 — 스킬 지시문(LLM 수행 계층)과 실제 저장소의 정합을 결정적으로 검사한다.
 * (스크립트를 리팩터링하면 스킬이 조용히 깨지는 사고 방지 — 2026-07-03 품질 리뷰 QA-B1)
 *
 * 검사 항목 (플러그인 skills/ + 템플릿 동봉 스킬):
 *   1. 프론트매터: name 이 폴더명과 일치, description 존재
 *   2. 본문이 인용한 scripts/*.mjs 가 실존
 *   3. 인용한 --옵션이 대상 스크립트 소스에 실존 (rename 드리프트 감지)
 *   4. /axfm-* 상호참조가 실존 스킬
 *   5. 인용한 docs/*.md 경로가 실존
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

const skillDirs = readdirSync(join(ROOT, "skills")).filter((d) => statSync(join(ROOT, "skills", d)).isDirectory());
const skillNames = new Set(skillDirs);
// 템플릿 동봉 스킬도 유효한 참조 대상
const templateSkills = [];
for (const t of ["nextjs", "python"]) {
  const dir = join(ROOT, "templates", t, ".claude", "skills");
  if (!existsSync(dir)) continue;
  for (const s of readdirSync(dir)) {
    templateSkills.push({ dir: join(dir, s), name: s, label: `templates/${t}` });
    skillNames.add(s);
  }
}

function lint(skillPath, expectedName, label) {
  const file = join(skillPath, "SKILL.md");
  if (!existsSync(file)) return problems.push(`${label}/${expectedName}: SKILL.md 없음`);
  const text = readFileSync(file, "utf8");

  // 1) 프론트매터
  const nameMatch = text.match(/^---\s*\n(?:[\s\S]*?)name:\s*([\w-]+)/);
  if (!nameMatch || nameMatch[1] !== expectedName)
    problems.push(`${label}/${expectedName}: 프론트매터 name(${nameMatch?.[1] ?? "없음"}) 이 폴더명과 다름`);
  if (!/description:/.test(text)) problems.push(`${label}/${expectedName}: description 없음`);

  // 2) 인용 스크립트 실존
  for (const m of text.matchAll(/scripts\/([\w-]+\.(?:mjs|py))/g)) {
    if (!existsSync(join(ROOT, "scripts", m[1]))) problems.push(`${label}/${expectedName}: 인용한 scripts/${m[1]} 이 없음`);
  }

  // 3) 스크립트 호출 라인의 --옵션이 대상 스크립트 소스에 실존
  for (const line of text.split(/\r?\n/)) {
    const script = line.match(/scripts\/([\w-]+\.mjs)/)?.[1];
    if (!script || !existsSync(join(ROOT, "scripts", script))) continue;
    const src = readFileSync(join(ROOT, "scripts", script), "utf8");
    for (const f of line.matchAll(/--([\w-]+)/g)) {
      if (!src.includes(`--${f[1]}`) && !src.includes(`"${f[1]}"`) && !new RegExp(`\\b${f[1].replace(/-/g, "")}\\b`).test(src))
        problems.push(`${label}/${expectedName}: ${script} 에 없는 옵션 --${f[1]} 을 안내함`);
    }
  }

  // 4) /axfm-* 상호참조 (경로 일부인 /axfm-design.css 등은 제외 — 슬래시 앞이 단어 문자면 스킬 호출이 아님)
  for (const m of text.matchAll(/(^|[^\w/])\/(axfm-[a-z-]+)(?!\.css)/g)) {
    if (!skillNames.has(m[2])) problems.push(`${label}/${expectedName}: 존재하지 않는 스킬 /${m[2]} 참조`);
  }

  // 5) docs 링크 — 플러그인 문서만 검증 (솔루션 내부 경로 docs/idea.md 류는 제외:
  //    존재하면 통과, 없으면 그 줄이 CLAUDE_PLUGIN_ROOT 를 참조할 때만 오류)
  for (const line of text.split(/\r?\n/)) {
    for (const m of line.matchAll(/docs\/([\w/-]+\.md)/g)) {
      if (!existsSync(join(ROOT, "docs", m[1])) && line.includes("CLAUDE_PLUGIN_ROOT"))
        problems.push(`${label}/${expectedName}: 인용한 플러그인 docs/${m[1]} 이 없음`);
    }
  }
}

for (const d of skillDirs) lint(join(ROOT, "skills", d), d, "skills");
for (const t of templateSkills) lint(t.dir, t.name, t.label);

if (problems.length) {
  for (const p of problems) console.error(`[스킬 린트] ${p}`);
  process.exit(1);
}
console.log(`OK — 스킬 ${skillDirs.length + templateSkills.length}개 정합 검사 통과 (스크립트·옵션·상호참조·문서 링크)`);
