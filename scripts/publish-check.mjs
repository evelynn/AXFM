#!/usr/bin/env node
/**
 * AXFM 공유 전 유출 점검 — /axfm-publish 의 전제 조건 (통과 전에는 공유 진행 금지).
 * 유출 리스크가 가장 큰 단계(git 공유)를 LLM 자율 점검이 아니라 결정적 검사로 만든다 (SEC-B1).
 *
 * 검사 (프로젝트 폴더에서):
 *   1. .gitignore 에 .axfm/ 제외 규칙 존재
 *   2. git 스테이징/추적 대상에 .axfm/·.env·자격증명 파일이 없음
 *   3. 커밋 대상 텍스트 파일에 기본 비밀 패턴(API 키·토큰·password=) 없음
 *
 * 사용법: node publish-check.mjs --dest <프로젝트 경로>
 * 성공: JSON { ok: true, checked } / 실패: 종료코드 1 + [publish-check] 사유 목록
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function fail(msgs) {
  for (const m of msgs) console.error(`[publish-check] ${m}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const di = args.indexOf("--dest");
const dest = resolve(di >= 0 && args[di + 1] ? args[di + 1] : process.cwd());
if (!existsSync(join(dest, "axfm.json"))) fail([`AXFM 솔루션이 아닙니다 (axfm.json 없음): ${dest}`]);

const problems = [];

// 1) .gitignore 에 .axfm/ 제외
const gi = join(dest, ".gitignore");
if (!existsSync(gi) || !/^\s*\.axfm\/?\s*$/m.test(readFileSync(gi, "utf8")))
  problems.push(".gitignore 에 '.axfm/' 제외 규칙이 없습니다 — 업무 데이터가 커밋됩니다. 추가하세요.");

// 2) git 추적/스테이징 대상 검사 (git 미초기화면 이 검사는 통과 — publish 스킬이 git init 후 재실행)
const DANGER = [/^\.axfm\//, /(^|\/)\.env[^/]*$/, /\.(pem|pfx|p12|key)$/i, /(^|\/)id_rsa/];
const ls = spawnSync("git", ["-C", dest, "ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
const files = ls.status === 0 ? ls.stdout.split(/\r?\n/).filter(Boolean) : [];
for (const f of files) {
  if (DANGER.some((re) => re.test(f))) problems.push(`커밋 대상에 위험 파일: ${f} — .gitignore 에 추가하거나 스테이징에서 제외하세요.`);
}

// 3) 기본 비밀 패턴 스캔 (텍스트 파일만, 오탐 최소 패턴)
const SECRET_RES = [
  [/(sk-[A-Za-z0-9]{20,})/, "OpenAI 형 API 키"],
  [/(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/, "GitHub 토큰"],
  [/(AKIA[0-9A-Z]{16})/, "AWS Access Key"],
  [/(password|passwd|비밀번호)\s*[:=]\s*['"][^'"\s]{4,}['"]/i, "하드코딩된 비밀번호"],
  [/Bearer\s+[A-Za-z0-9._-]{20,}/, "Bearer 토큰"],
];
const TEXT_EXT = /\.(ts|tsx|js|mjs|py|json|md|css|txt|ps1|cmd|yml|yaml|html)$/;
let scanned = 0;
for (const f of files) {
  if (!TEXT_EXT.test(f)) continue;
  let text;
  try {
    text = readFileSync(join(dest, f), "utf8");
  } catch {
    continue;
  }
  scanned++;
  for (const [re, label] of SECRET_RES) {
    if (re.test(text)) problems.push(`비밀 의심 패턴(${label}): ${f} — 제거하거나 .env 로 옮기고 .gitignore 처리하세요.`);
  }
}

if (problems.length) fail(problems);
console.log(JSON.stringify({ ok: true, checked: { files: files.length, scanned } }, null, 2));
