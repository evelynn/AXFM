#!/usr/bin/env node
/**
 * AXFM 디자인 토큰 내보내기
 *
 * design/*.md (DESIGN.md 규격)의 YAML 프론트매터 토큰을 CSS 커스텀 프로퍼티로 변환한다.
 * - 로드 순서: DESIGN.md → 나머지 md 파일명 오름차순 (나중 로드가 같은 토큰을 덮어씀)
 * - 토큰 참조 문법 지원: "{colors.primary}"
 * - 지원 YAML 부분집합: 들여쓰기 중첩 맵 + 스칼라 값 (배열 미지원 — 발견 시 무시하고 경고)
 *
 * 사용법:
 *   node export-design.mjs [출력.css]          # 출력 파일 생략 시 stdout
 *   node export-design.mjs --check             # 검증만 (파싱·참조 오류 시 exit 1)
 *   node export-design.mjs --design-dir <dir>  # design 폴더 지정 (기본: 스크립트 기준 ../design)
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const dirFlag = args.indexOf("--design-dir");
const designDir =
  dirFlag >= 0 ? args[dirFlag + 1] : join(dirname(fileURLToPath(import.meta.url)), "..", "design");
const outFile = args.filter((a, i) => !a.startsWith("--") && (dirFlag < 0 || i !== dirFlag + 1))[0];

const errors = [];
const warnings = [];

/** 파일 맨 앞의 --- ... --- 프론트매터 본문을 추출 */
function extractFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end < 0) return null;
  return lines.slice(1, end);
}

/** 들여쓰기 기반 YAML 부분집합 파서 (중첩 맵 + 스칼라만) */
function parseYamlSubset(lines, file) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (let n = 0; n < lines.length; n++) {
    const raw = lines[n];
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (raw.trim().startsWith("- ")) {
      warnings.push(`${file}:${n + 2} 배열은 지원하지 않아 무시함: ${raw.trim()}`);
      continue;
    }
    const m = raw.match(/^(\s*)([\w.À-￿-]+)\s*:\s*(.*)$/);
    if (!m) {
      errors.push(`${file}:${n + 2} 파싱 불가 라인: ${raw.trim()}`);
      continue;
    }
    const [, ws, key, rest] = m;
    const indent = ws.length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (rest === "") {
      const child = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else {
      let v = rest.trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      parent[key] = v;
    }
  }
  return root;
}

/** 깊은 병합 — 나중 값이 덮어씀 */
function deepMerge(base, over) {
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === "object" && base[k] && typeof base[k] === "object") deepMerge(base[k], v);
    else base[k] = v;
  }
  return base;
}

function lookup(tree, path) {
  return path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), tree);
}

/** "{a.b}" 참조 해석 (중첩 참조 10단계 가드) */
function resolveRefs(tree) {
  const walk = (obj, trail) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === "object") walk(v, `${trail}${k}.`);
      else if (typeof v === "string") {
        let val = v,
          depth = 0;
        while (/^\{[\w.-]+\}$/.test(val) && depth < 10) {
          const target = lookup(tree, val.slice(1, -1));
          if (target === undefined || typeof target === "object") {
            errors.push(`참조 해석 실패: ${trail}${k} → ${val}`);
            break;
          }
          val = target;
          depth++;
        }
        obj[k] = val;
      }
    }
  };
  walk(tree, "");
}

const camelToKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** 맵-값 최상위 키만 CSS 변수로 평탄화 (version/name/description 등 메타 스칼라 제외) */
function flattenToCss(tree) {
  const vars = [];
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const name = `${prefix}-${camelToKebab(k)}`;
      if (v && typeof v === "object") walk(v, name);
      else vars.push(`  ${name}: ${v};`);
    }
  };
  for (const [k, v] of Object.entries(tree)) {
    if (v && typeof v === "object") walk(v, `--axfm-${camelToKebab(k)}`);
  }
  return vars;
}

// ---- main ----
let files;
try {
  files = readdirSync(designDir).filter((f) => f.endsWith(".md") && f !== "README.md");
} catch {
  console.error(`design 폴더를 찾을 수 없습니다: ${designDir}`);
  process.exit(1);
}
files.sort((a, b) => (a === "DESIGN.md" ? -1 : b === "DESIGN.md" ? 1 : a.localeCompare(b)));
if (!files.includes("DESIGN.md")) errors.push("design/DESIGN.md 가 없습니다 (기본 파일 필수)");

const merged = {};
for (const f of files) {
  const fm = extractFrontmatter(readFileSync(join(designDir, f), "utf8"));
  if (!fm) {
    warnings.push(`${f}: YAML 프론트매터 없음 — 토큰 없이 본문만 있는 파일로 취급`);
    continue;
  }
  deepMerge(merged, parseYamlSubset(fm, f));
}
resolveRefs(merged);
if (!lookup(merged, "colors.primary")) errors.push("colors.primary 토큰이 없습니다 (규격상 필수)");

for (const w of warnings) console.error(`[경고] ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`[오류] ${e}`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`OK — ${files.join(", ")} 에서 토큰 ${flattenToCss(merged).length}개 검증 완료`);
  process.exit(0);
}

const css = [
  "/* AUTO-GENERATED by AXFM export-design.mjs — 직접 수정 금지.",
  "   원본: AXFM 플러그인 design/*.md",
  '   재생성: node "<플러그인 경로>/scripts/export-design.mjs" <이 파일 경로> */',
  ":root {",
  ...flattenToCss(merged),
  "}",
  "",
].join("\n");

if (outFile) {
  writeFileSync(outFile, css, "utf8");
  console.log(`생성 완료: ${outFile}`);
} else {
  process.stdout.write(css);
}
