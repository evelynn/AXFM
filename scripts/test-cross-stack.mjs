#!/usr/bin/env node
/**
 * AXFM 크로스 스택 E2E — nextjs(TS 모듈) ↔ python 실데이터 왕복 검증.
 * 어제까지의 사각지대: E2E 가 python↔python 만 검증해 JS 봉투 ts('Z') 를 Python 3.10 이
 * 못 읽는 결함(P3)이 안 잡혔다. 이 테스트가 그 조합을 상시 커버한다.
 *
 * 시나리오 (격리 HOME):
 *   1. scaffold 로 js-a(nextjs), py-b(python) 생성 + 레지스트리 등록
 *   2. js-a 의 vendored TS 모듈을 Node type-stripping 으로 직접 실행 → writeShared("daily-report")
 *   3. py-b 실행(main.py js-a) → A 의 스냅샷을 read_from 으로 수신 (JS→PY)
 *   4. py-b 가 내보낸 daily-report 를 js-a 의 readFrom 으로 수신 (PY→JS)
 *
 * Node < 22.6 (type stripping 불가) 또는 Python 부재 시: 명시적 SKIP (성공으로 위장하지 않음).
 * vendored TS 실행을 위해 테스트 산출물 내 상대 import 에만 .ts 확장자를 부여한다 (원본 불변).
 */
import { mkdirSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORK = join(PLUGIN_ROOT, ".test-cross-stack");
const HOME = join(WORK, "home");

function pass(m) { console.log(`  \x1b[32mPASS\x1b[0m ${m}`); }
function skip(m) { console.log(`\x1b[33mSKIP\x1b[0m ${m}`); process.exit(0); }
function fail(m, extra = "") { console.error(`  \x1b[31mFAIL\x1b[0m ${m}\n${extra}`); process.exit(1); }
function tryRun(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", ...opts });
  return r.error ? { status: 1, stdout: "", stderr: String(r.error) } : r;
}

// 사전 조건
const [maj, min] = process.versions.node.split(".").map(Number);
const canStrip = maj > 22 || (maj === 22 && min >= 6);
if (!canStrip) skip(`Node ${process.versions.node} 는 TS type stripping 미지원(22.6+ 필요) — 크로스 스택 E2E 건너뜀`);
const stripFlags = maj >= 23 ? [] : ["--experimental-strip-types"];
const py = ["py", "python", "python3"].find((c) => tryRun(c, ["--version"]).status === 0);
if (!py) skip("Python 없음 — 크로스 스택 E2E 건너뜀");

if (existsSync(WORK)) rmSync(WORK, { recursive: true, force: true });
mkdirSync(HOME, { recursive: true });
const env = { ...process.env, USERPROFILE: HOME, HOME, PYTHONPATH: undefined };

console.log("AXFM 크로스 스택 E2E (nextjs ↔ python)");

// 1) 두 솔루션 scaffold
const A = join(WORK, "js-a");
const B = join(WORK, "py-b");
for (const [type, id, name, dest] of [["nextjs", "js-a", "JS리포트", A], ["python", "py-b", "PY리포트", B]]) {
  const r = tryRun(process.execPath, [
    join(PLUGIN_ROOT, "scripts", "scaffold.mjs"),
    "--type", type, "--id", id, "--name", name, "--desc", `${name} 데모`, "--owner", "tester", "--dest", dest,
  ], { env });
  if (r.status !== 0) fail(`scaffold ${id}`, r.stdout + r.stderr);
  pass(`scaffold ${id} (${type})`);
}

// 2) js-a 의 vendored TS 모듈에 확장자 부여 (테스트 산출물 한정) 후 직접 실행 준비
const tsDir = join(A, "lib", "axfm");
for (const f of readdirSync(tsDir)) {
  const p = join(tsDir, f);
  const text = readFileSync(p, "utf8").replace(/(from\s+")(\.\/[\w-]+)(")/g, "$1$2.ts$3");
  writeFileSync(p, text, "utf8");
}

// JS 쓰기 하니스: js-a 프로젝트 안에서 writeShared 실행 (봉투 ts 형식 = 실제 모듈 코드 경로)
const harnessWrite = join(WORK, "harness-write.mjs");
writeFileSync(harnessWrite, `
process.chdir(${JSON.stringify(A)});
const axfm = await import(${JSON.stringify(pathToFileURL(join(tsDir, "index.ts")).href)});
axfm.writeShared("daily-report", { title: "JS 요약", lines: ["nextjs 에서 내보냄"] });
console.log("WROTE:" + axfm.readShared("daily-report").ts);
`, "utf8");
const w = tryRun(process.execPath, [...stripFlags, harnessWrite], { env });
if (w.status !== 0 || !/^WROTE:/m.test(w.stdout)) fail("JS writeShared 실행", w.stdout + w.stderr);
pass(`js-a 가 daily-report 스냅샷 내보냄 (ts=${w.stdout.match(/^WROTE:(.+)$/m)[1].trim()})`);

// 3) JS → PY: py-b 가 js-a 의 스냅샷을 표준 통로로 수신
const bEnv = { ...env, PYTHONPATH: B };
const bRun = tryRun(py, ["main.py", "js-a"], { cwd: B, env: bEnv });
if (bRun.status !== 0) fail("py-b 실행", bRun.stdout + bRun.stderr);
if (!/'js-a' 에게서 받음/.test(bRun.stdout)) fail("py-b 가 js-a 데이터 수신 실패 (JS→PY)", bRun.stdout);
if (!/JS 요약/.test(bRun.stdout)) fail("수신 데이터에 JS 내용 없음", bRun.stdout);
pass("python 이 nextjs 스냅샷 수신 (JS→PY — ts 'Z'/오프셋 호환 경로)");

// 4) PY → JS: js-a 의 readFrom 으로 py-b 스냅샷 수신 (py-b 는 3에서 자기 daily-report 를 내보냈음)
const harnessRead = join(WORK, "harness-read.mjs");
writeFileSync(harnessRead, `
process.chdir(${JSON.stringify(A)});
const axfm = await import(${JSON.stringify(pathToFileURL(join(tsDir, "index.ts")).href)});
const env2 = axfm.readFrom("py-b", "daily-report");
if (env2.from !== "py-b" || !env2.data || !env2.data.title) throw new Error("봉투 내용 이상: " + JSON.stringify(env2));
console.log("READ:" + env2.data.title + ":stale=" + env2.stale);
`, "utf8");
const r2 = tryRun(process.execPath, [...stripFlags, harnessRead], { env });
if (r2.status !== 0 || !/^READ:오늘의 요약:stale=false/m.test(r2.stdout)) fail("JS readFrom 수신 실패 (PY→JS)", r2.stdout + r2.stderr);
pass("nextjs 가 python 스냅샷 수신 (PY→JS)");

console.log(`\n\x1b[32m✓ 크로스 스택 E2E 통과\x1b[0m — nextjs ↔ python 실데이터 양방향 왕복 확인`);
rmSync(WORK, { recursive: true, force: true });
