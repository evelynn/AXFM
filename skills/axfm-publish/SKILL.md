---
name: axfm-publish
description: >-
  완성한 AXFM 솔루션을 배포 전 점검하고 팀에 공유할 준비를 한다. 사용자가 "팀에 공유", "배포",
  "다른 사람도 쓰게", "공유하고 싶어" 라고 하거나, 공유 직전 "확인해줘", "테스트", "잘 되나 봐줘",
  "점검", "배포 전 체크" 라고 하거나 /axfm-publish 를 입력하면 사용.
---

# 팀 공유 준비

## 0단계: 유출 자동 점검 (필수 — 통과 전에는 공유 진행 금지)
```
node "${CLAUDE_PLUGIN_ROOT}/scripts/publish-check.mjs" --dest "<프로젝트 경로>"
```
- 실패 항목이 있으면 그 사유를 그대로 보여주고 함께 해결한 뒤 재실행한다 (`.axfm/`·`.env`·비밀 패턴 검사).
- git 미초기화면 2단계의 git init 후 이 점검을 다시 실행한다.

## 1단계: 동작·정합 점검 (배포 전 QA — 실제 구동은 기본 `verify`에 위임)
`axfm.json` 의 provides/accepts 로 "핵심 동작" 목록을 만들어 하나씩 확인한다.
- **동작 확인은 기본 `verify`/`run` 스킬로 구동**한다(웹앱 `npm run dev`, 스크립트 `python main.py`, 연동이면 `python main.py <상대id>`). 여기서는 AXFM 고유 정합만 본다:
  - 각 provides: 데이터가 실제로 나오는가 / 연동이면 스냅샷 파일(`.axfm/data/<name>.json`) 이 생기는가. 각 accepts: 받으면 처리되는가.
  - **디자인 토큰**: 화면이 있으면 `${CLAUDE_PLUGIN_ROOT}/design/*.md` 토큰을 따르는지(임의 색상·간격 없는지).
  - **계약 3중 일치**: `axfm.json` ↔ `axfm/interface.md`(sample 포함) ↔ 실제 코드가 서로 맞는지 — 불일치면 `/axfm-feature` 로 동기화.
- 실패 항목은 `/axfm-debug` 로 연결. 전부 통과해야 공유로 넘어간다.

## 2단계: 공유 준비 체크리스트 (0·1단계에서 안 본 것만)
- [ ] README 에 3줄 이상: 무엇을 하는 도구인지 / 실행법 / 필요한 연동 대상
- [ ] `.axfm/` 가 .gitignore 에 있는지 확인 (업무 데이터 커밋 방지 — 없으면 추가)
  (비밀값·`.axfm` 유출은 0단계 `publish-check.mjs` 가 결정적으로 검사하므로 여기서 재확인 불필요.)

## 3단계: git 준비
- git 미초기화면 `git init` + 첫 커밋 안내. 사내 git 호스팅 주소는 사용자에게 확인.
- **커밋 전 확인**: `git status` 에 `.axfm/` 나 비밀 파일이 스테이징되지 않았는지 점검(있으면 제외).

## 4단계: 팀원용 안내문 생성 (복사해서 메신저에 붙일 수 있는 형태)
```
[{이름}] 사용해보세요!
1. git clone <주소>
2. cd {폴더}
3. (최초 1회) claude plugin marketplace add evelynn/AXFM
   → claude plugin install axfm@axfm --scope project   ← 이 폴더에서만 켜집니다
4. (웹앱) npm install 그다음 npm run dev   /   (스크립트) .\start.ps1
5. 같은 폴더에서 claude 실행 → /axfm-guide 입력  ← 자동으로 레지스트리에 등록되고 연동 준비 완료
```
- 솔루션 폴더에는 `.claude/settings.json`(폴더 스코프 활성화)이 이미 커밋돼 있어, 마켓플레이스만 등록되면 Claude Code 가 설치를 안내한다.

## 5단계: 마무리
- progress.json 의 published 를 true 로 → 여정 5단계 완주 축하(3줄 이내, 이모지 최대 1개).
- v1 한계 안내: 원커맨드 자동 설치(`axfm install`)는 아직 없음 — 위 안내문 방식이 공식 경로.
