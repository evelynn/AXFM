#!/usr/bin/env node
/**
 * AXFM 스크립트 게이트 — register.mjs / sync-modules.mjs 의 규약 행동과 버전 일관성을 검증한다.
 * (2026-07-03 품질 리뷰 QA-M5: "결정적 스크립트"라고 약속한 것들이 게이트 밖이었음)
 *
 *   1. 버전 일관성: modules/VERSION == 모든 AXFM-MODULE 파일 헤더, plugin.json 은 SemVer
 *   2. register: 정상 등록 / 손상 레지스트리 백업 후 복구 / 살아있는 id 충돌 거부 / 폴더 이동 감지 / 버전 불일치 거부
 *   3. sync-modules: 구버전 모듈 갱신 + 사용자 파일(interface.md) 불가침 + CLAUDE.md 버전 주석 갱신
 */
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync, renameSync, copyFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORK = join(PLUGIN_ROOT, ".test-scripts");
const HOME = join(WORK, "home");
let failed = 0;
const pass = (m) => console.log(`  \x1b[32mPASS\x1b[0m ${m}`);
const fail = (m, extra = "") => { failed++; console.error(`  \x1b[31mFAIL\x1b[0m ${m}\n${extra}`); };
const run = (args, env) => spawnSync(process.execPath, args, { encoding: "utf8", env });

// ---- 1) 버전 일관성 ----
const moduleVersion = readFileSync(join(PLUGIN_ROOT, "modules", "VERSION"), "utf8").trim();
let headerCount = 0;
let headerMismatch = [];
for (const stack of [join("nextjs", "lib", "axfm"), join("python", "axfm")]) {
  const dir = join(PLUGIN_ROOT, "modules", stack);
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) continue; // __pycache__ 등
    const m = readFileSync(p, "utf8").match(/AXFM-MODULE \S+ v(\d+\.\d+\.\d+)/);
    if (!m) continue;
    headerCount++;
    if (m[1] !== moduleVersion) headerMismatch.push(`${f}: v${m[1]}`);
  }
}
if (headerMismatch.length) fail(`모듈 헤더 버전 불일치 (VERSION=${moduleVersion})`, headerMismatch.join(", "));
else pass(`버전 일관성: modules/VERSION ${moduleVersion} == 헤더 ${headerCount}개`);
const pluginVer = JSON.parse(readFileSync(join(PLUGIN_ROOT, ".claude-plugin", "plugin.json"), "utf8")).version;
if (/^\d+\.\d+\.\d+$/.test(pluginVer)) pass(`plugin.json SemVer: ${pluginVer}`);
else fail(`plugin.json version 형식 이상: ${pluginVer}`);

// ---- 격리 작업공간 ----
if (existsSync(WORK)) rmSync(WORK, { recursive: true, force: true });
mkdirSync(HOME, { recursive: true });
const env = { ...process.env, USERPROFILE: HOME, HOME };
const registryFile = join(HOME, ".axfm", "registry.json");
const S = join(WORK, "gate-a");

// ---- 2) register ----
let r = run([join(PLUGIN_ROOT, "scripts", "scaffold.mjs"), "--type", "python", "--id", "gate-a", "--name", "게이트A", "--desc", "d", "--owner", "t", "--dest", S], env);
if (r.status !== 0) fail("scaffold gate-a", r.stdout + r.stderr);
else pass("scaffold gate-a");

// 2a. 손상 레지스트리 → 백업 후 복구
writeFileSync(registryFile, "{ not json", "utf8");
r = run([join(PLUGIN_ROOT, "scripts", "register.mjs"), "--dest", S], env);
const backups = readdirSync(join(HOME, ".axfm")).filter((f) => f.includes(".corrupt-"));
if (r.status === 0 && backups.length === 1 && JSON.parse(readFileSync(registryFile, "utf8")).solutions.some((s) => s.id === "gate-a"))
  pass("손상 레지스트리 → .corrupt 백업 + 재등록");
else fail("손상 레지스트리 복구", r.stdout + r.stderr + ` backups=${backups}`);

// 2b. 살아있는 id 충돌 → 거부
const U = join(WORK, "gate-a-copy");
mkdirSync(U, { recursive: true });
copyFileSync(join(S, "axfm.json"), join(U, "axfm.json"));
r = run([join(PLUGIN_ROOT, "scripts", "register.mjs"), "--dest", U], env);
if (r.status !== 0 && /살아 있습니다/.test(r.stderr)) pass("살아있는 id 충돌 거부 (행동형 안내)");
else fail("id 충돌 거부", `status=${r.status} ${r.stdout}${r.stderr}`);

// 2c. 폴더 이동 → 경로 갱신
const S2 = join(WORK, "gate-a-moved");
renameSync(S, S2);
r = run([join(PLUGIN_ROOT, "scripts", "register.mjs"), "--dest", S2], env);
const entry = JSON.parse(readFileSync(registryFile, "utf8")).solutions.find((s) => s.id === "gate-a");
if (r.status === 0 && entry && entry.path === S2 && /이동한 것으로 보입니다/.test(r.stderr)) pass("폴더 이동 감지 → 경로 갱신");
else fail("폴더 이동 감지", `status=${r.status} path=${entry?.path}\n${r.stdout}${r.stderr}`);

// 2d. 규약 버전 불일치 → 거부
writeFileSync(join(U, "axfm.json"), JSON.stringify({ axfm: "1", id: "old-one", name: "구버전", type: "python" }), "utf8");
r = run([join(PLUGIN_ROOT, "scripts", "register.mjs"), "--dest", U], env);
if (r.status !== 0 && /버전/.test(r.stderr)) pass("규약 버전 불일치 거부");
else fail("버전 불일치 거부", r.stdout + r.stderr);

// ---- 3) sync-modules ----
// 구버전 위장: 모듈 파일 전체의 헤더를 v2.0.0 으로 (from 감지는 첫 모듈 파일 헤더 기준)
for (const f of readdirSync(join(S2, "axfm"))) {
  const p = join(S2, "axfm", f);
  if (!f.endsWith(".py")) continue;
  writeFileSync(p, readFileSync(p, "utf8").replace(/AXFM-MODULE python v[\d.]+/, "AXFM-MODULE python v2.0.0"), "utf8");
}
const modFile = join(S2, "axfm", "types.py");
const ifaceFile = join(S2, "axfm", "interface.md");
const ifaceBefore = readFileSync(ifaceFile, "utf8") + "\n<!-- 사용자 편집 표식 -->\n";
writeFileSync(ifaceFile, ifaceBefore, "utf8");
r = run([join(PLUGIN_ROOT, "scripts", "sync-modules.mjs"), "--dest", S2], env);
const out = (() => { try { return JSON.parse(r.stdout); } catch { return {}; } })();
const headerAfter = readFileSync(modFile, "utf8").match(/AXFM-MODULE python v([\d.]+)/)?.[1];
const ifaceAfter = readFileSync(ifaceFile, "utf8");
const claudeVer = readFileSync(join(S2, "CLAUDE.md"), "utf8").match(/axfm-module-version:\s*([\d.]+)/)?.[1];
if (r.status === 0 && out.ok && out.from === "2.0.0" && headerAfter === moduleVersion) pass(`sync-modules: v2.0.0 → v${moduleVersion} 갱신`);
else fail("sync-modules 갱신", `status=${r.status} from=${out.from} header=${headerAfter}\n${r.stderr}`);
if (ifaceAfter === ifaceBefore) pass("sync-modules: 사용자 소유 interface.md 불가침");
else fail("interface.md 가 변경됨 (사용자 파일 침범)");
if (claudeVer === moduleVersion) pass(`sync-modules: CLAUDE.md 버전 주석 갱신 (${claudeVer})`);
else fail(`CLAUDE.md 버전 주석 미갱신 (${claudeVer})`);

if (!failed) rmSync(WORK, { recursive: true, force: true });
console.log(failed ? `\n\x1b[31m${failed}개 실패\x1b[0m (작업물 보존: ${WORK})` : "\n\x1b[32m✓ 스크립트 게이트 통과\x1b[0m");
process.exit(failed ? 1 : 0);
