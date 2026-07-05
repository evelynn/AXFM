// AXFM-MODULE nextjs v2.2.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AXFM_PROTOCOL, type Manifest } from "./types";

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** axfm.json 검사. 문제 없으면 null, 있으면 사유 반환 */
export function validateManifest(m: Partial<Manifest>): string | null {
  if (m.axfm !== AXFM_PROTOCOL)
    return `axfm.json 의 버전(${m.axfm ?? "없음"})이 이 모듈(${AXFM_PROTOCOL})과 다릅니다. /axfm-guide 로 업데이트하세요.`;
  if (typeof m.id !== "string" || !ID_RE.test(m.id))
    return `id 는 소문자·숫자·하이픈만 가능합니다 (현재: ${String(m.id)})`;
  for (const f of ["name", "description", "type", "owner"] as const)
    if (typeof m[f] !== "string" || !m[f]) return `${f} 필드가 비어 있습니다`;
  if (!Array.isArray(m.provides) || !Array.isArray(m.accepts))
    return "provides/accepts 는 배열이어야 합니다 (빈 배열 가능)";
  return null;
}

/** 프로젝트 루트의 axfm.json 을 읽고 검증한다. 매 호출마다 다시 읽어 편집이 즉시 반영됨 */
export function loadManifest(): Manifest {
  const file = join(process.cwd(), "axfm.json");
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    throw new Error(`axfm.json 을 찾을 수 없습니다 (${file}). 프로젝트 루트에서 실행 중인지 확인하세요. 막히면 /axfm-guide`);
  }
  let parsed: Manifest;
  try {
    parsed = JSON.parse(raw) as Manifest;
  } catch (e) {
    throw new Error(`axfm.json 이 올바른 JSON이 아닙니다: ${(e as Error).message}`);
  }
  const problem = validateManifest(parsed);
  if (problem) throw new Error(`axfm.json 규약 위반: ${problem}`);
  return parsed;
}
