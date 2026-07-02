---
name: axfm-qa
description: >-
  배포·공유 전에 솔루션이 제대로 도는지 점검한다. 사용자가 "확인해줘", "테스트",
  "잘 되나 봐줘", "점검", "배포 전 체크" 라고 하거나 /axfm-qa 를 입력하면 사용.
---

# 배포 전 점검 (QA)

## 1단계: 체크리스트 생성 (이 솔루션 맞춤)
- `axfm.json` 의 provides/accepts 를 읽어 "핵심 동작" 목록을 만든다.
- 각 provides: 데이터가 실제로 나오는가? 각 accepts: 받으면 처리되는가?
- 웹앱이면 첫 화면이 뜨는가, 버튼이 동작하는가.

## 2단계: 하나씩 눈으로 확인
- 웹앱: `npm run dev` → 브라우저에서 항목별 확인.
- 스크립트: `python main.py` (+ 연동이면 `python main.py <상대id>`) 실행 결과 확인.
- 연동 항목: 스냅샷 파일(`.axfm/data/<name>.json`)이 생기고 상대가 읽는지 확인.

## 3단계: 디자인·규약 점검
- 화면이 있으면 `${CLAUDE_PLUGIN_ROOT}/design/*.md` 토큰을 따르는지(임의 색상·간격 없는지) 확인.
- `axfm.json` ↔ `axfm/interface.md` ↔ 실제 코드가 일치하는지 확인 (불일치 시 /axfm-feature 로 동기화).

## 4단계: 결과 보고
- 통과/실패 항목을 표로. 실패는 /axfm-debug 로 연결.
- 전부 통과면: "공유 준비가 됐어요. /axfm-publish 로 팀에 공유하세요."
