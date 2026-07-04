#!/usr/bin/env node
/**
 * AXFM 문서 게이트 — 사용자 노출 문서·스킬·템플릿의 금지 패턴을 차단한다.
 *   1. 명령 체인 `&&`: Windows 기본 PowerShell 5.1 비호환 (P1 계열 회귀 방지 — 복붙 명령이 파서 오류)
 *   2. `pushData`: v1 잔재 함수 (존재하지 않음 — 규약 오염 방지)
 * 내부 기록(docs/reviews, docs/plan, docs/design)은 검사 대상이 아니다.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// 검사 대상: 사용자가 읽거나 AI 가 지시문으로 소비하는 파일
const targets = [];
const addFile = (p) => targets.push(p);
const addDir = (d, exts) => {
  for (const name of readdirSync(join(ROOT, d))) {
    const p = join(ROOT, d, name);
    if (statSync(p).isDirectory()) continue;
    if (exts.some((e) => name.endsWith(e))) addFile(p);
  }
};
addFile(join(ROOT, "README.md"));
// CHANGELOG 는 제외 — 변경 이력은 제거된 항목을 이름으로 언급하는 것이 정상
addFile(join(ROOT, "assets", "CLAUDE.md.template"));
addDir("docs", [".md", ".html"]);
addDir("docs/recipes", [".md"]);
for (const skill of readdirSync(join(ROOT, "skills"))) addFile(join(ROOT, "skills", skill, "SKILL.md"));
for (const t of ["nextjs", "python"]) {
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (name === "node_modules") continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".md")) addFile(p);
    }
  };
  walk(join(ROOT, "templates", t));
}

// 금지 패턴: 명령어 뒤에 && 가 이어지는 체인 (증상 설명용 `&&` 단독 언급은 허용)
const CHAIN_RE = /(?:^|[\s`(>])(?:cd|npm|npx|claude|python|node|git)\s[^`\n]*&&/;
const problems = [];
for (const file of targets) {
  const text = readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, i) => {
    if (CHAIN_RE.test(line)) problems.push(`${relative(ROOT, file)}:${i + 1} PS5.1 비호환 '&&' 체인: ${line.trim().slice(0, 80)}`);
    if (/pushData/.test(line)) problems.push(`${relative(ROOT, file)}:${i + 1} v1 잔재 'pushData': ${line.trim().slice(0, 80)}`);
  });
}

if (problems.length) {
  for (const p of problems) console.error(`[문서 게이트] ${p}`);
  process.exit(1);
}
console.log(`OK — ${targets.length}개 문서에서 금지 패턴 0건`);
