// AXFM-MODULE nextjs v2.1.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
// 연동 규약 명세: 플러그인 docs/protocol.md (v2 — 문서·함수 중심, 비실시간)

/** 규약 major 버전 — 봉투/manifest/interface의 axfm 필드와 비교 */
export const AXFM_PROTOCOL = "2";

/** 표준 봉투 — .axfm/data/*.json 스냅샷의 공통 포장 */
export interface Envelope<T = unknown> {
  axfm: string;
  from: string; // 발신 솔루션 id
  name: string; // 데이터 이름
  ts: string;   // ISO-8601
  data: T;
}

/** 솔루션 루트 axfm.json (정체성 + 능력 요약) */
export interface Manifest {
  axfm: string;
  id: string;
  name: string;
  description: string;
  type: string;
  owner: string;
  provides: string[];
  accepts: string[];
}

/** ~/.axfm/registry.json 의 솔루션 항목 */
export interface RegistryEntry {
  id: string;
  name: string;
  path: string;
  type: string;
  interface?: string; // interface.md 상대 경로 (기본 axfm/interface.md)
}

/**
 * 오프셋 포함 ISO-8601, 초 단위 (예: 2026-07-03T14:00:00+09:00).
 * 'Z' 접미를 쓰지 않는 이유: Python 3.10 fromisoformat 이 'Z'를 파싱하지 못함 — 송신은 엄격하게, 수신은 관용적으로.
 */
export function isoNow(d: Date = new Date()): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  );
}

/** 표준 봉투 생성 */
export function makeEnvelope<T>(from: string, name: string, data: T): Envelope<T> {
  return { axfm: AXFM_PROTOCOL, from, name, ts: isoNow(), data };
}

/** 봉투 형태·버전 검사. 문제 없으면 null, 있으면 사람이 읽을 사유 반환 */
export function validateEnvelope(body: unknown): string | null {
  if (!body || typeof body !== "object") return "데이터가 JSON 객체가 아닙니다";
  const e = body as Partial<Envelope>;
  if (e.axfm !== AXFM_PROTOCOL)
    return `상대 솔루션의 AXFM 버전(${e.axfm ?? "없음"})이 다릅니다. 양쪽 /axfm-guide 로 업데이트하세요.`;
  if (typeof e.from !== "string" || typeof e.name !== "string") return "from/name 필드가 없습니다";
  if (typeof e.ts !== "string" || Number.isNaN(Date.parse(e.ts))) return "ts가 올바른 ISO-8601이 아닙니다";
  if (e.data === undefined) return "data 필드가 없습니다";
  return null;
}

/** 파일명 안전화 — 경로 탈출 방지 */
export function sanitizeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) || "unknown";
}

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** 데이터 이름 규칙 검사 — 무음 축약 대신 행동형 거부 (한글 이름이 전부 unknown.json 으로 수렴하는 사고 방지) */
export function assertValidName(name: string): string {
  if (!NAME_RE.test(name) || name.length > 64)
    throw new Error(`데이터 이름은 영문 소문자·숫자·하이픈만 가능합니다 (예: daily-report). 받은 값: '${name}'`);
  return name;
}

/** 스냅샷 신선도(ms). 초과 시 "오래된 데이터" 표식 권장 */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
