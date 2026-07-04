---
axfm: "2"
id: __AXFM_ID__
name: __AXFM_NAME__
functions:
  - name: today-menu
    kind: data
    returns: "{ menu: string, date: string }"
    sample: "{ menu: '김치찌개', date: '2026-07-02' }"
    source: ".axfm/data/today-menu.json"
    desc: 오늘의 추천 메뉴 (데모 — 첫 기능을 만들면 교체하세요)
accepts:
  - name: feedback
    sample: "{ menu: '김치찌개', rating: 5 }"
    desc: 다른 솔루션이 보낸 피드백 (보낸 쪽 폴더에서 수집)
---

# __AXFM_NAME__ 연동 안내

다른 솔루션이 나와 연동할 때 이 문서만 보면 됩니다. (연동은 /axfm-connect 스킬이 도와줍니다.)

## 제공하는 것 (provides)
- **today-menu** (데이터): 내 프로젝트 폴더의 `.axfm/data/today-menu.json`을 읽으세요.
  공통 함수로: `readFrom("__AXFM_ID__", "today-menu")`. 상대가 실행 중이 아니어도 마지막 스냅샷을 읽습니다.

## 받는 것 (accepts)
- **feedback**: 나에게 보내려면 상대가 자기 솔루션에서 `writeShared("feedback", {...})`로 내보내고,
  나는 `readFrom("<상대id>", "feedback")`으로 수집합니다. 실시간이 아니라 스냅샷 교환입니다.

## 규칙
- 이 문서는 데이터/함수를 바꿀 때마다 함께 갱신합니다 (/axfm-feature 가 자동으로 지킵니다).
- 실시간 서버 호출이 아닙니다 — 스냅샷 파일과 공통 함수로 연결합니다.
