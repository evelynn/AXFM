// AXFM 레지스트리 입출력 공용 모듈 — scaffold/register/sync 스크립트가 공유한다.
// 규칙(protocol.md §6): BOM 없는 UTF-8, temp+rename 원자적 쓰기, 같은 id·다른 경로는 등록 거부.
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { homedir } from "node:os";

export function registryPath() {
  return join(homedir(), ".axfm", "registry.json");
}

/** Windows 는 대소문자 무시 파일시스템 — 경로 비교는 정규화해서 한다 */
export function normPath(p) {
  const r = resolve(p);
  return process.platform === "win32" ? r.toLowerCase() : r;
}

/**
 * 레지스트리 읽기. 파일 없음 = 빈 목록(정상). 손상 = ok:false + 빈 목록(쓰기 경로의 복구용 —
 * 호출자는 reason 을 사용자에게 노출할 것. 조용히 삼키지 않는다).
 */
export function readRegistrySafe() {
  let raw;
  try {
    raw = readFileSync(registryPath(), "utf8");
  } catch {
    return { ok: true, reg: { axfm: "2", solutions: [] } };
  }
  try {
    const parsed = JSON.parse(raw.replace(/^﻿/, "")); // BOM 방어
    if (!Array.isArray(parsed.solutions)) parsed.solutions = [];
    return { ok: true, reg: parsed };
  } catch (e) {
    return { ok: false, reg: { axfm: "2", solutions: [] }, reason: e.message };
  }
}

export function writeRegistryAtomic(obj) {
  const path = registryPath();
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`; // 동시 세션 tmp 충돌 방지
  writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8"); // BOM 없는 UTF-8
  renameSync(tmp, path); // 원자적 교체
}

/**
 * 항목 등록/갱신 (쓰기 직전 재읽기 — 동시 세션 소실 최소화).
 * - 손상: 원본을 .corrupt-<ts> 로 백업(증거 인멸 금지, protocol §6) 후 재생성.
 * - 같은 id·다른 경로: 기존 경로에 axfm.json 이 없으면 "이동"으로 보고 경로 갱신, 살아 있으면 진짜 충돌 → Error.
 */
export function upsertEntry(entry) {
  const { ok, reg, reason } = readRegistrySafe();
  if (!ok) {
    const backup = `${registryPath()}.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    try {
      renameSync(registryPath(), backup);
      console.error(`[경고] 레지스트리가 손상되어 백업 후 새로 만듭니다 (${reason}) — 백업: ${backup}`);
    } catch {
      console.error(`[경고] 레지스트리가 손상되어 새로 만듭니다 (${reason})`);
    }
  }
  const clash = reg.solutions.find((s) => s.id === entry.id && normPath(s.path || "") !== normPath(entry.path));
  if (clash && existsSync(join(clash.path, "axfm.json")))
    throw new Error(
      `id '${entry.id}' 가 이미 다른 경로(${clash.path})에 등록돼 있고 그 폴더가 살아 있습니다. axfm.json 의 id 를 {owner}-{name} 형식으로 바꾸세요.`,
    );
  if (clash) console.error(`[안내] '${entry.id}' 가 이동한 것으로 보입니다: ${clash.path} → ${entry.path} (경로 갱신)`);
  reg.axfm = "2";
  reg.solutions = reg.solutions.filter((s) => s.id !== entry.id).concat(entry);
  writeRegistryAtomic(reg);
  return entry;
}
