---
name: axfm-guide
description: >-
  AXFM 솔루션 개발의 단계별 길잡이. 사용자가 "뭘 해야 하지", "다음 단계", "시작하는 법",
  "막혔어", "어떻게 해" 라고 하거나 /axfm-guide 를 입력하면 사용. 프로젝트 상태를 직접
  진단해 지금 할 일 딱 하나를 제안한다. 늘 이 스킬이 진입점이다.
---

# AXFM 개발 가이드

늘 이 스킬이 진입점이다. 사용자가 무엇을 해야 할지 모르면 여기서 시작한다.

## 1단계: 상태를 직접 확인 (질문하지 말고 파일을 읽어라)
- `axfm.json` 읽기 → 없으면 "이 폴더는 AXFM 솔루션이 아닙니다. /axfm-new 로 만들거나 솔루션 폴더로 이동하세요." 후 종료.
- clone 받아 레지스트리에 없으면 결정적 스크립트로 등록 (레지스트리 JSON을 직접 편집하지 말 것):
  ```
  node "${CLAUDE_PLUGIN_ROOT}/scripts/register.mjs" --dest "<프로젝트 경로>"
  ```
  (파이썬 솔루션은 `.\start.ps1` 첫 실행 시 `register_self()`로도 자동 등록됨 — 둘 다 같은 규칙.)
- `.axfm/progress.json` 읽기 (없으면 `{"milestones":{"created":true}}` 생성).
- 실행 여부/환경: 결정적 스크립트로 점검 — `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-env.mjs"` (웹앱이면 `--web` 추가). 실패 항목의 안내를 그대로 전달한다.
- **모듈 버전 드리프트**: 프로젝트의 `lib/axfm/`(또는 `axfm/`) 파일 헤더 `AXFM-MODULE ... vX.Y.Z` 와 플러그인 `${CLAUDE_PLUGIN_ROOT}/modules/VERSION` 비교. 다르면 재동기화 제안(아래 6단계).

## 2단계: 진행도 요약 (형식 고정)
마일스톤은 저장값을 신뢰하기 전에 **실제 상태로 재확인**한다(스킬 우회 대비):
- created = axfm.json 존재
- demo_seen = 한 번이라도 실행됨(웹앱 .next 존재 / 스크립트 .axfm/data 존재) 또는 progress 기록
- first_feature = provides 에 데모(hello/today-menu/daily-report) 외 항목 존재
- first_connect = `connectors/` 폴더에 파일 존재, 또는 다른 솔루션발 데이터 수신 흔적
- published = git 원격 존재

```
── {이름} 개발 여정 ─────────────
[✓] 1. 만들기      [ ] 2. 데모 확인 ← 지금 여기
[ ] 3. 첫 기능     [ ] 4. 연동      [ ] 5. 팀 공유
────────────────────────────
```

## 3단계: "지금 여기"의 다음 행동 딱 하나
- 환경 문제(Node/Python 없음, npm 막힘, 포트 충돌) 발견 → 그 해결을 먼저 안내(직접 고치려 들지 말고 명령 제시).
- 2단계(데모): "실행해서 화면/출력을 확인해보세요" + 정확한 실행 명령.
- 3단계(첫 기능): "어떤 기능을 넣고 싶은지 한 문장으로 말해주세요 — /axfm-feature 로 같이 만들어요."
- 4단계(연동): `axfm.neighbors()` 결과(또는 레지스트리)를 보여주고 후보 제시 → /axfm-connect 안내.
- 5단계(공유): /axfm-publish 안내.

## 4단계: 규칙
- 비개발자 배려: 전문용어 한 줄 설명. 한 번에 한 단계만. 여러 단계 나열 금지.
- 마일스톤 달성 확인 시 progress.json 갱신 + 축하 1~2줄(이모지 최대 1개) + 다음 행동 1개.
- 추천 외부 도구 문의("뭐 깔면 좋아?")를 받으면 `${CLAUDE_PLUGIN_ROOT}/docs/recommended-skills.md`를 읽어
  상황에 맞는 것 3개만 안내한다(전부 설치 금지, 설치 전 `/plugin` Discover 탭에서 이름 확인 안내).

## 5단계: npm 막힘 진단 (사내망 대비)
- `npm ping` 또는 레지스트리 접근 실패 시: 사내 레지스트리/미러 설정 필요. `docs/troubleshooting.md` 안내.
- 웹앱이 막히면 "우선 Python 스크립트 솔루션으로 시작"도 대안으로 제시.

## 6단계: 모듈 재동기화 (드리프트 감지 시)
- 플러그인 버전이 더 높으면 사용자 확인 후 결정적 스크립트로 동기화 (직접 파일을 복사하지 말 것):
  ```
  node "${CLAUDE_PLUGIN_ROOT}/scripts/sync-modules.mjs" --dest "<프로젝트 경로>"
  ```
  스크립트는 프레임워크 파일만 덮어쓰고 절대 삭제하지 않는다 — 사용자 소유 파일(page.tsx, main.py, axfm.json, `axfm/interface.md`)은 안전하다. `--dry-run`으로 계획만 볼 수 있다.
