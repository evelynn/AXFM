#!/usr/bin/env node
/**
 * AXFM 환경 점검 — 관리자 1회 세팅과 사용자 PC 상태를 한 번에 판정한다 (서비스화 계획 1-2).
 * /axfm-guide·/axfm-debug 가 환경 문제 진단 시 호출. 사람이 직접 실행해도 읽히는 출력.
 *
 * 사용법: node check-env.mjs [--web]   (--web: 웹앱 트랙 요건(Node/npm)까지 필수로 판정)
 * 출력: 항목별 OK/주의/실패 + 종료코드 (필수 실패 시 1)
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const wantWeb = process.argv.includes("--web");
let required = 0;
const rows = [];
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: false });
  return r.error || r.status !== 0 ? null : (r.stdout || r.stderr).trim().split(/\r?\n/)[0];
};
const add = (name, ok, detail, need = true) => {
  rows.push([ok ? "OK " : need ? "실패" : "주의", name, detail]);
  if (!ok && need) required++;
};

// Claude Code
const claude = run("claude", ["--version"]) ?? run("claude.cmd", ["--version"]);
add("Claude Code CLI", !!claude, claude ?? "미설치 — https://claude.com/claude-code 안내 필요");

// Python (스크립트 트랙)
const pyCmd = ["py", "python", "python3"].find((c) => run(c, ["--version"]));
const pyVer = pyCmd ? run(pyCmd, ["--version"]) : null;
const pyOk = !!pyVer && Number(pyVer.match(/(\d+)\.(\d+)/)?.[1] ?? 0) * 100 + Number(pyVer.match(/(\d+)\.(\d+)/)?.[2] ?? 0) >= 310;
add("Python 3.10+ (스크립트 트랙)", pyOk, pyVer ?? "미설치 — python.org (Add to PATH 체크)");

// Node/npm (웹앱 트랙)
const nodeVer = run("node", ["--version"]);
const nodeOk = !!nodeVer && Number(nodeVer.match(/v(\d+)/)?.[1] ?? 0) >= 20;
add("Node.js 20+ (웹앱 트랙)", nodeOk, nodeVer ?? "미설치 — winget install OpenJS.NodeJS.LTS", wantWeb);
if (nodeOk) {
  const ping = spawnSync("npm", ["ping"], { encoding: "utf8", shell: true, timeout: 20000 });
  add("npm 레지스트리 접근", ping.status === 0, ping.status === 0 ? "정상" : "차단/실패 — 사내 레지스트리 .npmrc 필요 또는 Python 트랙 사용", wantWeb);
}

// AXFM 마켓플레이스 등록 여부
const mkts = run("claude", ["plugin", "marketplace", "list"]) !== null
  ? spawnSync("claude", ["plugin", "marketplace", "list"], { encoding: "utf8" }).stdout
  : "";
add("AXFM 마켓플레이스(axfm)", /\baxfm\b/.test(mkts), /\baxfm\b/.test(mkts) ? "등록됨" : "미등록 — claude plugin marketplace add evelynn/AXFM");

// 작업 환경 주의 신호 (필수 아님)
const home = homedir();
add("홈 폴더 OneDrive 여부", !/onedrive/i.test(home), /onedrive/i.test(home) ? `홈이 OneDrive 하위(${home}) — 레지스트리 경로 혼선 위험` : "정상", false);
add("~/.axfm 레지스트리", true, existsSync(join(home, ".axfm", "registry.json")) ? "존재" : "아직 없음(첫 솔루션 생성 시 자동)", false);

for (const [st, name, detail] of rows) console.log(`  [${st}] ${name} — ${detail}`);
console.log(required ? `\n필수 항목 ${required}개 실패 — 위 안내대로 조치 후 재실행` : "\n환경 점검 통과");
process.exit(required ? 1 : 0);
