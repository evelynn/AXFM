#!/usr/bin/env node
/**
 * AXFM 결정적 스캐폴더 — /axfm-new 스킬이 호출하는 뼈대 생성기.
 *
 * 하는 일 (매번 정확히 동일 — 비결정적 LLM 수행을 대체):
 *   1. templates/<type> + modules/<type> 을 대상 폴더로 병합 복사
 *   2. __AXFM_*__ 플레이스홀더 치환
 *   3. (nextjs) 디자인 토큰 CSS 내보내기
 *   4. ~/.axfm/registry.json 에 원자적 등록
 *   5. 사후 검증: 플레이스홀더 잔존 0, 필수 파일 존재
 *
 * 사용법:
 *   node scaffold.mjs --type nextjs --id lunch-pick --name "점심추천기" \
 *        --desc "점심 메뉴 추천" --owner "홍길동" --dest "E:/work/lunch-pick" [--port 3001]
 *   node scaffold.mjs ... --dry-run     # 복사 없이 계획만 출력
 *
 * 플러그인 루트는 이 스크립트의 상위(../)로 자동 결정.
 */
import {
  cpSync, readdirSync, readFileSync, writeFileSync, statSync, mkdirSync, existsSync,
} from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readRegistrySafe, upsertEntry } from "./lib/registry-io.mjs";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      if (k === "dry-run") a[k] = true;
      else a[k] = argv[++i];
    }
  }
  return a;
}

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fail(msg) {
  console.error(`[scaffold 오류] ${msg}`);
  process.exit(1);
}

function findFreePort(start) {
  // 레지스트리에 이미 쓰인 포트를 피해 결정적으로 배정 (등록 최대+1 성격)
  const used = new Set();
  for (const s of readRegistrySafe().reg.solutions) if (s.port) used.add(Number(s.port));
  let p = start;
  while (used.has(p)) p++;
  return p;
}

/** 대상의 텍스트 파일에서 플레이스홀더 치환 (바이너리 제외) */
function substituteTree(dir, map) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      substituteTree(p, map);
    } else if (/\.(json|ts|tsx|js|mjs|css|md|py|ps1|cmd|txt)$/.test(name)) {
      let text = readFileSync(p, "utf8");
      let changed = false;
      for (const [k, v] of Object.entries(map)) {
        if (text.includes(k)) {
          text = text.split(k).join(v);
          changed = true;
        }
      }
      if (changed) writeFileSync(p, text, "utf8");
    }
  }
}

function assertNoPlaceholders(dir) {
  const leftovers = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(json|ts|tsx|js|mjs|css|md|py|ps1|cmd|txt)$/.test(name)) {
        if (/__AXFM_[A-Z]+__/.test(readFileSync(p, "utf8"))) leftovers.push(relative(dir, p));
      }
    }
  };
  walk(dir);
  return leftovers;
}

// ---- main ----
const args = parseArgs(process.argv.slice(2));
const { type, id, name, desc = "", owner = "" } = args;

if (!type || !["nextjs", "python"].includes(type)) fail("--type 은 nextjs 또는 python");
if (!id || !ID_RE.test(id)) fail(`--id 는 소문자·숫자·하이픈만 (받음: ${id})`);
if (!name) fail("--name 필요");
if (!args.dest) fail("--dest 필요");
const dest = resolve(args.dest);

const templateDir = join(PLUGIN_ROOT, "templates", type);
const moduleDir = join(PLUGIN_ROOT, "modules", type);
if (!existsSync(templateDir)) fail(`템플릿 없음: ${templateDir}`);

const port = type === "nextjs" ? Number(args.port) || findFreePort(3001) : undefined;
const map = {
  __AXFM_ID__: id,
  __AXFM_NAME__: name,
  __AXFM_DESC__: desc,
  __AXFM_OWNER__: owner,
  __AXFM_PORT__: String(port ?? ""),
};

const entry = { id, name, path: dest, type, interface: "axfm/interface.md" };
if (port) entry.port = port;

if (args["dry-run"]) {
  console.log("[dry-run] 계획:");
  console.log(`  템플릿  : ${templateDir}`);
  console.log(`  모듈    : ${moduleDir}`);
  console.log(`  대상    : ${dest}`);
  console.log(`  치환    : ${JSON.stringify(map)}`);
  console.log(`  레지스트리 등록: ${JSON.stringify(entry)}`);
  process.exit(0);
}

// 1) 병합 복사 (템플릿 → 모듈 순, 모듈이 lib/axfm 등 프레임워크 파일 제공)
if (existsSync(dest) && readdirSync(dest).length > 0) fail(`대상 폴더가 비어있지 않습니다: ${dest}`);
mkdirSync(dest, { recursive: true });
cpSync(templateDir, dest, { recursive: true });
if (existsSync(moduleDir)) cpSync(moduleDir, dest, { recursive: true });

// 2) 플레이스홀더 치환
substituteTree(dest, map);

// package.json name 은 npm 규칙(선행 밑줄 불가)이라 id 그대로 사용됨 — 치환으로 이미 해결

// 3) 디자인 토큰 CSS (nextjs)
if (type === "nextjs") {
  const out = join(dest, "app", "axfm-design.css");
  const r = spawnSync(process.execPath, [join(PLUGIN_ROOT, "scripts", "export-design.mjs"), out], {
    encoding: "utf8",
  });
  if (r.status !== 0) fail(`디자인 토큰 내보내기 실패: ${r.stderr || r.stdout}`);
}

// 3.5) CLAUDE.md 렌더 + progress.json 생성
const claudeTpl = join(PLUGIN_ROOT, "assets", "CLAUDE.md.template");
if (existsSync(claudeTpl)) {
  const moduleVersion = existsSync(join(PLUGIN_ROOT, "modules", "VERSION"))
    ? readFileSync(join(PLUGIN_ROOT, "modules", "VERSION"), "utf8").trim()
    : "unknown";
  const runCmd = type === "nextjs" ? `npm install && npm run dev  (http://localhost:${port})` : ".\\start.ps1  (막히면 .\\start.cmd)";
  let claude = readFileSync(claudeTpl, "utf8")
    .split("__AXFM_NAME__").join(name)
    .split("__AXFM_TYPE__").join(type)
    .split("__AXFM_RUN__").join(runCmd)
    .split("__AXFM_MODULE_VERSION__").join(moduleVersion);
  writeFileSync(join(dest, "CLAUDE.md"), claude, "utf8");
}
const progressDir = join(dest, ".axfm");
mkdirSync(progressDir, { recursive: true });
writeFileSync(
  join(progressDir, "progress.json"),
  JSON.stringify({ milestones: { created: true } }, null, 2),
  "utf8",
);

// 3.6) 폴더 스코프 플러그인 활성화 — axfm 스킬은 이 솔루션 폴더 안에서만 켜진다 (전역 오염 없음).
//      팀원이 clone 하면 Claude Code 가 이 파일을 보고 설치를 안내한다 (마켓플레이스는 publish 안내문 참조).
const claudeDir = join(dest, ".claude");
mkdirSync(claudeDir, { recursive: true });
writeFileSync(
  join(claudeDir, "settings.json"),
  JSON.stringify({ enabledPlugins: { "axfm@hansol-axfm": true } }, null, 2),
  "utf8",
);

// 4) 레지스트리 등록 (원자적 — 규칙은 lib/registry-io.mjs 한 곳에)
try {
  upsertEntry(entry);
} catch (e) {
  fail(e.message);
}

// 5) 사후 검증
const leftovers = assertNoPlaceholders(dest);
if (leftovers.length) fail(`치환 안 된 플레이스홀더 잔존: ${leftovers.join(", ")}`);
const mustExist = type === "nextjs"
  ? ["axfm.json", "axfm/interface.md", "lib/axfm/index.ts", "app/page.tsx", "app/actions.ts", "app/axfm-design.css", ".claude/settings.json", ".claude/skills/solution-help/SKILL.md"]
  : ["axfm.json", "axfm/interface.md", "axfm/__init__.py", "main.py", ".claude/settings.json", ".claude/skills/solution-help/SKILL.md"];
for (const f of mustExist) if (!existsSync(join(dest, f))) fail(`필수 파일 누락: ${f}`);

console.log(JSON.stringify({ ok: true, id, name, type, dest, port, registered: true }, null, 2));
