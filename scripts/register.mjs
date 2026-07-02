#!/usr/bin/env node
/**
 * AXFM 결정적 등록기 — clone 받은(또는 미등록) 솔루션을 ~/.axfm/registry.json 에 등록한다.
 * /axfm-guide 가 호출한다 — LLM 이 레지스트리 JSON 을 직접 편집하지 않는다 (C4 교훈).
 *
 * 사용법: node register.mjs --dest <프로젝트 경로>
 * 성공: JSON { ok: true, entry } 출력 / 실패: 종료코드 1 + [register 오류] 메시지
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { upsertEntry } from "./lib/registry-io.mjs";

function fail(msg) {
  console.error(`[register 오류] ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const di = args.indexOf("--dest");
if (di < 0 || !args[di + 1]) fail("--dest <프로젝트 경로> 가 필요합니다");
const dest = resolve(args[di + 1]);

let manifest;
try {
  manifest = JSON.parse(readFileSync(join(dest, "axfm.json"), "utf8").replace(/^﻿/, ""));
} catch (e) {
  fail(`axfm.json 을 읽을 수 없습니다 (${dest}): ${e.message}`);
}

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
if (manifest.axfm !== "2") fail(`axfm.json 버전(${manifest.axfm ?? "없음"})이 규약(2)과 다릅니다. /axfm-guide 로 업데이트하세요.`);
if (typeof manifest.id !== "string" || !ID_RE.test(manifest.id)) fail(`id 는 소문자·숫자·하이픈만 가능합니다 (현재: ${manifest.id})`);
if (!["nextjs", "python"].includes(manifest.type)) fail(`type 은 nextjs 또는 python 이어야 합니다 (현재: ${manifest.type})`);
if (!manifest.name) fail("name 필드가 비어 있습니다");

const entry = {
  id: manifest.id,
  name: manifest.name,
  path: dest,
  type: manifest.type,
  interface: "axfm/interface.md",
};

// 웹앱이면 package.json dev 스크립트의 --port 를 유지 (findFreePort 참고용 — 연동에는 사용하지 않음)
if (manifest.type === "nextjs") {
  try {
    const pkg = JSON.parse(readFileSync(join(dest, "package.json"), "utf8").replace(/^﻿/, ""));
    const m = String(pkg.scripts?.dev ?? "").match(/--port\s+(\d+)/);
    if (m) entry.port = Number(m[1]);
  } catch {
    /* package.json 없어도 등록은 진행 */
  }
}

try {
  upsertEntry(entry);
} catch (e) {
  fail(e.message);
}
console.log(JSON.stringify({ ok: true, entry }, null, 2));
