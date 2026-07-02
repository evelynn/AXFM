"use server";
// 서버 액션 모음 — 클라이언트 컴포넌트가 호출하는 서버 함수는 반드시 이 파일에 둡니다.
// (App Router 규칙: page.tsx 에서 액션을 export 하면 빌드가 실패합니다.)
import { writeShared } from "@/lib/axfm";
import { todayMenu } from "@/lib/demo-menu";

/** 데모: 오늘의 메뉴를 계산해 스냅샷으로 내보낸다 — 다른 솔루션이 readFrom 으로 읽어감 */
export async function exportTodayMenu() {
  const data = todayMenu();
  writeShared("today-menu", data);
  return data;
}
