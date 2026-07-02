// 앱 소유 파일 — 여러분의 것입니다. 자유롭게 수정하세요.
// 데모: "오늘의 메뉴"를 계산해 공통 함수 writeShared 로 스냅샷을 내보냅니다.
// 첫 기능을 만들 때 이 파일을 여러분의 로직으로 교체하세요. (/axfm-feature)
import { pickRotating, fmtDate } from "@/lib/axfm/common";

const MENUS = ["김치찌개", "비빔밥", "냉면", "돈까스", "제육볶음"] as const;

/** 날짜 기반으로 오늘의 메뉴 하나를 고른다 (안정적 — 같은 날 같은 결과) */
export function todayMenu(): { menu: string; date: string } {
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return { menu: pickRotating(MENUS, dayIndex), date: fmtDate(now) };
}
