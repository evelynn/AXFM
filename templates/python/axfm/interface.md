---
axfm: "2"
id: __AXFM_ID__
name: __AXFM_NAME__
functions:
  - name: daily-report
    kind: data
    returns: "{ title: string, lines: string[] }"
    sample: "{ title: '오늘의 요약', lines: ['처리 12건', '오류 0건'] }"
    source: ".axfm/data/daily-report.json"
    desc: 오늘의 작업 요약 (데모 — 첫 기능을 만들면 교체하세요)
accepts:
  - name: task
    writes: ".axfm/data/task.json"
    sample: "{ title: '메뉴 집계', due: '2026-07-03' }"
    desc: 다른 솔루션이 맡긴 작업
---

# __AXFM_NAME__ 연동 안내

이 솔루션은 화면 없는 자동화 도구입니다. 다른 솔루션과는 스냅샷 파일로 연동합니다 (실시간 아님).

## 제공하는 것 (provides)
- **daily-report** (데이터): `.axfm/data/daily-report.json`을 읽으세요.
  파이썬: `axfm.read_from("__AXFM_ID__", "daily-report")`

## 받는 것 (accepts)
- **task**: 나에게 작업을 맡기려면 상대가 스냅샷으로 내보내고, 나는 `axfm.read_shared("task")`로 읽습니다.

## 규칙
- 데이터/함수를 바꾸면 이 문서를 함께 갱신합니다 (/axfm-feature 가 자동으로 지킵니다).
