// AXFM-MODULE nextjs v2.1.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
// 공통 유틸 함수 — 모든 AXFM 솔루션이 같은 함수를 공유해 연동 코드의 형태를 통일한다.
// 앱에서: import { fmtDate, ... } from "@/lib/axfm/common";

import { isoNow } from "./types";

/** ISO-8601 (로컬 타임존 오프셋 포함) 타임스탬프 */
export function nowIso(): string {
  return isoNow();
}

/** 사람이 읽는 한국어 날짜/시각 */
export function fmtDateTime(d: Date | string = new Date()): string {
  return new Date(d).toLocaleString("ko-KR");
}
export function fmtDate(d: Date | string = new Date()): string {
  return new Date(d).toLocaleDateString("ko-KR");
}

/** 배열에서 무작위가 아닌 안정적 순환 선택(테스트 가능) — 데모/추천 유틸 */
export function pickRotating<T>(items: readonly T[], seed: number): T {
  if (items.length === 0) throw new Error("빈 배열에서 선택할 수 없습니다");
  return items[((seed % items.length) + items.length) % items.length];
}

/** 표준 결과 래퍼 — 연동 함수가 실패를 값으로 다루도록(초보자 친화) */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

/** 안전한 JSON 파싱 */
export function parseJsonSafe<T = unknown>(text: string): Result<T> {
  try {
    return ok(JSON.parse(text) as T);
  } catch (e) {
    return err((e as Error).message);
  }
}
