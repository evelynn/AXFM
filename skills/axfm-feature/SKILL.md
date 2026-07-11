---
name: axfm-feature
description: >-
  AXFM 솔루션에 새 기능을 추가한다. 사용자가 "기능 넣고 싶어", "버튼 만들어줘",
  "~하게 해줘", "추가해줘" 라고 하거나 /axfm-feature 를 입력하면 사용.
  작게 만들고, 연동 계약(interface.md)을 함께 갱신하고, 눈으로 확인시킨다.
---

# 기능 추가 가이드

기능 구현·검증 자체는 평소대로 한다(크면 쪼개고, 끝나면 기본 `verify`/`run` 으로 눈으로 확인).
이 스킬의 존재 이유는 그 위에 얹는 **AXFM 고유 2가지** — 디자인 토큰 강제와 연동 계약 동기화다. 이걸 빠뜨리면 안 된다.

## 1. 디자인 토큰만 사용 (화면/스타일 작업일 때)
- 먼저 `${CLAUDE_PLUGIN_ROOT}/design/*.md`(DESIGN.md 등)를 읽고 **토큰만** 쓴다. 임의 색상·간격·폰트 금지.
- 웹앱은 `app/axfm-design.css` 의 `--axfm-*` 변수를 쓴다. 공통 유틸은 `lib/axfm/common`(웹앱)·`axfm.common`(파이썬)을 먼저 확인해 재사용.

## 2. 연동 계약 동기화 (가장 중요 — 빠뜨리면 다른 솔루션이 연동 못 함)
데이터/함수를 새로 제공(provides)하거나 수신(accepts)하게 됐다면 **반드시**:
- `axfm.json` 의 `provides`/`accepts` 배열 갱신.
- `axfm/interface.md` 의 프론트매터(functions/accepts)와 본문 갱신 — `sample`(예시)을 반드시 채운다.
- 제공 데이터는 공통 함수로 내보낸다: 웹앱 `writeShared("<name>", data)`, 파이썬 `axfm.write_shared("<name>", data)`.
  데이터 이름은 영문 소문자·숫자·하이픈만(예: daily-report) — 한글 이름은 라이브러리가 거부한다.
- **내보내기 전 점검**: 스냅샷에 개인정보·비밀정보(이름+연락처, 토큰 등)가 들어가면 안 된다 — 있으면 알리고 제외/마스킹한다(스냅샷은 평문 로컬 파일이며 이웃 솔루션이 읽어간다).
- 검증 시 연동 데이터 변경이면 스냅샷 파일(`.axfm/data/<name>.json`)이 갱신됐는지도 확인한다.

## 3. 마무리
- 첫 기능이면 progress.json 의 first_feature 를 true 로 → "첫 기능 완성! 다른 솔루션과 연결해볼까요? /axfm-connect" (2줄 이내, 이모지 최대 1개).
