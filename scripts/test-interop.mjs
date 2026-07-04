#!/usr/bin/env node
/**
 * AXFM cross-feature E2E 테스트 (Harness Completion Gate 조건 3).
 * npm 불필요 — Python 트랙만으로 "두 솔루션이 실데이터를 주고받는다"를 검증한다.
 *
 * 시나리오:
 *   1. 격리된 HOME 에 솔루션 A(python), B(python) 를 scaffold.mjs 로 생성 + 레지스트리 등록
 *   2. A 를 실행 → daily-report 스냅샷 내보내기 + 레지스트리에 자기 등록
 *   3. B 를 실행하며 인자로 A 를 지정 → B 가 A 의 daily-report 를 read_from 으로 읽음
 *   4. B 출력에 A 의 데이터가 나타나면 통과 (exit 0)
 */
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// 한글+공백 경로 하위에서 실행 — 대상 사용자의 기본 환경(한글 사용자명·문서 폴더)을 게이트가 대표하도록
const WORK = join(PLUGIN_ROOT, ".test-interop", "한글 경로 검증");
const HOME = join(WORK, "home");

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", ...opts });
  if (r.error) throw r.error;
  return r;
}
function tryRun(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", ...opts });
  return r.error ? { status: 1 } : r; // ENOENT 등은 status 1 로 취급
}
function pass(m) { console.log(`  \x1b[32mPASS\x1b[0m ${m}`); }
function fail(m, extra = "") { console.error(`  \x1b[31mFAIL\x1b[0m ${m}\n${extra}`); process.exit(1); }

const py = ["py", "python", "python3"].find((c) => tryRun(c, ["--version"]).status === 0);
if (!py) fail("Python 을 찾을 수 없습니다");

// 깨끗한 작업공간
if (existsSync(WORK)) rmSync(WORK, { recursive: true, force: true });
mkdirSync(HOME, { recursive: true });
const env = { ...process.env, USERPROFILE: HOME, HOME, PYTHONPATH: undefined };

console.log("AXFM cross-feature E2E (python ↔ python)");

// 1) 두 솔루션 scaffold
for (const [id, name] of [["report-a", "리포트A"], ["report-b", "리포트B"]]) {
  const dest = join(WORK, id);
  const r = run(process.execPath, [
    join(PLUGIN_ROOT, "scripts", "scaffold.mjs"),
    "--type", "python", "--id", id, "--name", name,
    "--desc", `${name} 데모`, "--owner", "tester", "--dest", dest,
  ], { env });
  if (r.status !== 0) fail(`scaffold ${id}`, r.stdout + r.stderr);
  pass(`scaffold ${id}`);
}

// 2) A 실행 → 스냅샷 내보내기 + 등록
const aEnv = { ...env, PYTHONPATH: join(WORK, "report-a") };
const aRun = run(py, ["main.py"], { cwd: join(WORK, "report-a"), env: aEnv });
if (aRun.status !== 0) fail("A 실행", aRun.stdout + aRun.stderr);
if (!/daily-report' 스냅샷 저장/.test(aRun.stdout)) fail("A 스냅샷 저장 로그 없음", aRun.stdout);
pass("A 실행 + daily-report 스냅샷 내보냄");

// 3) B 실행하며 A 를 대상으로 연동 데모
const bEnv = { ...env, PYTHONPATH: join(WORK, "report-b") };
const bRun = run(py, ["main.py", "report-a"], { cwd: join(WORK, "report-b"), env: bEnv });
if (bRun.status !== 0) fail("B 실행", bRun.stdout + bRun.stderr);

// 4) 검증: B 가 A 의 데이터(오늘의 요약)를 받았는지 + 이웃으로 A 를 봤는지
if (!/'report-a' 에게서 받음/.test(bRun.stdout)) fail("B 가 A 데이터 수신 실패", bRun.stdout);
if (!/오늘의 요약/.test(bRun.stdout)) fail("수신 데이터에 A 의 리포트 내용 없음", bRun.stdout);
if (!/이웃 솔루션 1개|리포트A/.test(bRun.stdout)) fail("B 가 A 를 이웃으로 인식 못함", bRun.stdout);
pass("B 가 A 의 daily-report 를 표준 통로로 수신");

console.log(`\n\x1b[32m✓ cross-feature E2E 통과\x1b[0m — 두 솔루션이 실데이터를 주고받음`);
rmSync(WORK, { recursive: true, force: true });
