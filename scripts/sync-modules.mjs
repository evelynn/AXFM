#!/usr/bin/env node
/**
 * AXFM 모듈 재동기화 — 프로젝트에 vendored 된 프레임워크 모듈(lib/axfm/ · axfm/*.py)을
 * 플러그인의 최신 modules/<type>/ 로 교체한다. /axfm-guide 가 드리프트 감지 시 호출한다.
 *
 * 안전 규칙:
 *   - modules/<type>/ 에 존재하는 파일만 덮어쓴다. 절대 삭제하지 않는다
 *     (사용자 소유 파일 — 파이썬 axfm/interface.md, 앱 코드 — 는 건드리지 않음).
 *   - CLAUDE.md 의 axfm-module-version 주석을 새 버전으로 갱신한다.
 *
 * 사용법: node sync-modules.mjs --dest <프로젝트 경로> [--dry-run]
 * 성공: JSON { ok: true, type, from, to, files } 출력
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  console.error(`[sync-modules 오류] ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const di = args.indexOf("--dest");
if (di < 0 || !args[di + 1]) fail("--dest <프로젝트 경로> 가 필요합니다");
const dest = resolve(args[di + 1]);
const dryRun = args.includes("--dry-run");

let manifest;
try {
  manifest = JSON.parse(readFileSync(join(dest, "axfm.json"), "utf8").replace(/^﻿/, ""));
} catch (e) {
  fail(`axfm.json 을 읽을 수 없습니다 (${dest}): ${e.message}`);
}
const type = manifest.type;
if (!["nextjs", "python"].includes(type)) fail(`알 수 없는 type: ${type}`);

const moduleDir = join(PLUGIN_ROOT, "modules", type);
if (!existsSync(moduleDir)) fail(`모듈 폴더 없음: ${moduleDir}`);
const toVersion = readFileSync(join(PLUGIN_ROOT, "modules", "VERSION"), "utf8").trim();

// 대상 파일 목록 (모듈 폴더 기준 상대 경로) — 이 목록만 덮어쓴다
const files = [];
(function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(moduleDir, p));
  }
})(moduleDir);

// 기존 버전 감지 (첫 모듈 파일 헤더의 AXFM-MODULE ... vX.Y.Z)
let fromVersion = "unknown";
for (const rel of files) {
  const target = join(dest, rel);
  if (!existsSync(target)) continue;
  const m = readFileSync(target, "utf8").match(/AXFM-MODULE\s+\S+\s+v(\d+\.\d+\.\d+)/);
  if (m) {
    fromVersion = m[1];
    break;
  }
}

if (dryRun) {
  console.log(JSON.stringify({ ok: true, dryRun: true, type, from: fromVersion, to: toVersion, files }, null, 2));
  process.exit(0);
}

for (const rel of files) {
  const target = join(dest, rel);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(moduleDir, rel), target);
}

// CLAUDE.md 의 버전 주석 갱신 (드리프트 감지용)
const claudeMd = join(dest, "CLAUDE.md");
if (existsSync(claudeMd)) {
  const text = readFileSync(claudeMd, "utf8");
  const updated = text.replace(/(axfm-module-version:\s*)[^\s]+/, `$1${toVersion}`);
  if (updated !== text) writeFileSync(claudeMd, updated, "utf8");
}

console.log(JSON.stringify({ ok: true, type, from: fromVersion, to: toVersion, files }, null, 2));
