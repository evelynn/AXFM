---
name: axfm-publish
description: >-
  완성한 AXFM 솔루션을 팀에 공유할 준비를 한다. 사용자가 "팀에 공유", "배포",
  "다른 사람도 쓰게", "공유하고 싶어" 라고 하거나 /axfm-publish 를 입력하면 사용.
---

# 팀 공유 준비

## 1단계: 공유 준비 점검 (체크리스트 출력 후 함께 채움)
- [ ] README 에 3줄 이상: 무엇을 하는 도구인지 / 실행법 / 필요한 연동 대상
- [ ] `axfm.json` 의 description·provides·accepts 가 실제 코드와 일치
- [ ] `axfm/interface.md` 가 최신 (제공/수신 데이터의 sample 포함)
- [ ] 비밀값(.env, 토큰, 비밀번호)이 코드에 하드코딩되지 않았는지 확인
- [ ] `.axfm/` 가 .gitignore 에 있는지 확인 (업무 데이터 커밋 방지 — 없으면 추가)

## 2단계: git 준비
- git 미초기화면 `git init` + 첫 커밋 안내. 사내 git 호스팅 주소는 사용자에게 확인.
- **커밋 전 확인**: `git status` 에 `.axfm/` 나 비밀 파일이 스테이징되지 않았는지 점검(있으면 제외).

## 3단계: 팀원용 안내문 생성 (복사해서 메신저에 붙일 수 있는 형태)
```
[{이름}] 사용해보세요!
1. git clone <주소>
2. cd {폴더}
3. (최초 1회) claude plugin marketplace add <사내 저장소>
   → claude plugin install axfm@hansol-axfm --scope project   ← 이 폴더에서만 켜집니다
4. (웹앱) npm install && npm run dev   /   (스크립트) .\start.ps1
5. 같은 폴더에서 claude 실행 → /axfm-guide 입력  ← 자동으로 레지스트리에 등록되고 연동 준비 완료
```
- 솔루션 폴더에는 `.claude/settings.json`(폴더 스코프 활성화)이 이미 커밋돼 있어, 마켓플레이스만 등록되면 Claude Code 가 설치를 안내한다.

## 4단계: 마무리
- progress.json 의 published 를 true 로 → 여정 5단계 완주 축하(3줄 이내, 이모지 최대 1개).
- v1 한계 안내: 원커맨드 자동 설치(`axfm install`)는 아직 없음 — 위 안내문 방식이 공식 경로.
