#!/usr/bin/env node
/**
 * AXFM 릴리스 체크 — Next.js 트랙의 재현 가능 빌드를 명령 하나로 실증한다 (네트워크 필요 — 릴리스 시 실행).
 * "체크리스트 문장"이 아니라 실행 가능한 게이트 (QA-B2): scaffold → npm ci → tsc → next build → next start 스모크.
 *
 * 사용법: node release-check.mjs   (test-all 과 별개 — 태그 릴리스 전 필수, docs/release-process.md 참조)
 */
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, spawn } from "node:child_process";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORK = join(PLUGIN_ROOT, ".test-release");
const HOME = join(WORK, "home");
const S = join(WORK, "rel-check");
const PORT = 3979;

const pass = (m) => console.log(`  \x1b[32mPASS\x1b[0m ${m}`);
const fail = (m, extra = "") => { console.error(`  \x1b[31mFAIL\x1b[0m ${m}\n${extra}`); process.exit(1); };
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", shell: process.platform === "win32", ...opts });

if (existsSync(WORK)) rmSync(WORK, { recursive: true, force: true });
mkdirSync(HOME, { recursive: true });
const env = { ...process.env, USERPROFILE: HOME, HOME };

console.log("AXFM 릴리스 체크 (Next.js 트랙 재현 빌드)");

// 1) scaffold
let r = spawnSync(process.execPath, [join(PLUGIN_ROOT, "scripts", "scaffold.mjs"),
  "--type", "nextjs", "--id", "rel-check", "--name", "릴리스체크", "--desc", "d", "--owner", "t", "--dest", S, "--port", String(PORT)],
  { encoding: "utf8", env });
if (r.status !== 0) fail("scaffold", r.stdout + r.stderr);
pass("scaffold (lockfile 동봉 확인: " + (existsSync(join(S, "package-lock.json")) ? "있음" : "없음") + ")");
if (!existsSync(join(S, "package-lock.json"))) fail("템플릿에 package-lock.json 없음");

// 2) npm ci — lockfile 과 package.json 정합까지 함께 검증됨
r = sh("npm", ["ci", "--no-audit", "--no-fund"], { cwd: S, env });
if (r.status !== 0) fail("npm ci (lockfile 재현 설치)", (r.stdout + r.stderr).slice(-2000));
pass("npm ci — 잠금된 의존성 재현 설치");

// 3) 타입 검사
r = sh("npx", ["tsc", "--noEmit"], { cwd: S, env });
if (r.status !== 0) fail("tsc --noEmit", r.stdout + r.stderr);
pass("tsc --noEmit");

// 4) 프로덕션 빌드
r = sh("npx", ["next", "build"], { cwd: S, env });
if (r.status !== 0) fail("next build", (r.stdout + r.stderr).slice(-2000));
pass("next build");

// 5) next start 스모크 — 첫 화면 렌더링
const server = process.platform === "win32"
  ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx next start --port ${PORT}`], { cwd: S, env, stdio: "ignore" })
  : spawn("npx", ["next", "start", "--port", String(PORT)], { cwd: S, env, stdio: "ignore" });
const deadline = Date.now() + 30000;
let html = null;
while (Date.now() < deadline) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/`);
    if (res.ok) { html = await res.text(); break; }
  } catch { /* 서버 기동 대기 */ }
  await new Promise((ok) => setTimeout(ok, 500));
}
// Windows 는 kill() 이 프로세스 트리를 못 죽임 — taskkill /T 로 자식(next 서버)까지 종료
if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { encoding: "utf8" });
else server.kill();
if (!html) fail("next start 스모크 — 30초 내 응답 없음");
for (const marker of ["릴리스체크", "내가 주고받는 것", "공통 통로 체험"]) {
  if (!html.includes(marker)) fail(`첫 화면에 '${marker}' 카드 없음`);
}
pass("next start 스모크 — 첫 화면 3개 카드 렌더링");

// 정리 — 파일 잠금 해제를 기다리며 재시도, 실패해도 검사 결과는 유효 (경고만)
let cleaned = false;
for (let i = 0; i < 10 && !cleaned; i++) {
  try {
    rmSync(WORK, { recursive: true, force: true });
    cleaned = true;
  } catch {
    await new Promise((ok) => setTimeout(ok, 500));
  }
}
if (!cleaned) console.error(`[경고] 작업 폴더 정리 실패 (파일 잠금) — 수동 삭제: ${WORK}`);
console.log("\n\x1b[32m✓ 릴리스 체크 통과\x1b[0m — Next.js 트랙 재현 빌드 실증");
