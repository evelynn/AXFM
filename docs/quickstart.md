# AXFM 10분 퀵스타트

처음이어도 괜찮습니다. 아래를 순서대로 따라 하면 첫 솔루션이 화면에 뜹니다.

> **터미널이 어렵다면**: 아래 명령들을 Claude Code 채팅창에 붙여넣고 "실행해줘"라고 하세요 — AI가 대신 실행하고 결과를 설명해줍니다.

## 0. 준비 (관리자가 1회 세팅했다면 건너뛰기)
- **Claude Code** 설치·로그인 완료 상태여야 합니다.
- **작업 폴더는 영문 경로 + OneDrive 밖**에 만드세요 (예: `C:\work`). 바탕화면·문서 폴더는 한글 경로/동기화 문제가 생길 수 있어요.
- 만들 종류에 따라: 웹앱이면 **Node.js 20+**, 스크립트면 **Python 3.10+**.
  - Node 없으면: `winget install OpenJS.NodeJS.LTS`
  - Python 없으면: https://www.python.org 에서 설치 (설치 시 "Add to PATH" 체크)

## 1. 플러그인 설치 (터미널 2줄 — 작업 폴더에만 적용)
터미널에서:
```
claude plugin marketplace add evelynn/AXFM
cd <작업 폴더>
claude plugin install axfm@axfm --scope project
```
> 플러그인은 **이 폴더에서만 켜집니다** (다른 프로젝트를 어지럽히지 않아요).
> 이 화면이 보여야 정상: 그 폴더에서 `claude` 실행 후 `/axfm-` 을 입력하면 axfm-new, axfm-guide … 목록이 뜹니다.
> 이후 `/axfm-new`로 만드는 솔루션 폴더에는 활성화 설정이 자동 포함됩니다.

## 2. 첫 솔루션 만들기
```
/axfm-new
```
질문 3개(종류/설명/이름)와 영문 약칭 확인 1번에 답하면 뼈대가 자동 생성됩니다.

## 3. 실행해서 눈으로 확인
- **웹앱** (한 줄씩 입력):
  ```
  cd <폴더>
  npm install
  npm run dev
  ```
  → 브라우저에서 생성 결과에 표시된 주소(예: http://localhost:3001)를 여세요.
  > 이 화면이 보여야 정상: 내 솔루션 이름, "내가 주고받는 것", "이웃 솔루션", "공통 통로 체험" 카드.
- **스크립트**: `cd <폴더>` 입력 후 `.\start.ps1` (막히면 `.\start.cmd`)
  > 이 출력이 보여야 정상: "레지스트리에 등록됨", "daily-report 스냅샷 저장".

## 4. 다음 할 일 안내받기
같은 폴더에서 `claude` 실행 후:
```
/axfm-guide
```
지금 어디까지 왔고 다음에 뭘 하면 되는지 딱 하나 알려줍니다.

## 막히면
- `/axfm-guide` (진단) 또는 `/axfm-debug` (문제 해결)
- [문제 해결 문서](troubleshooting.md)

## 다음 단계
- 기능 추가: `/axfm-feature`
- 다른 솔루션과 연동: `/axfm-connect` → [연동 레시피](recipes/connect-a-to-b.md)
- 팀에 공유: `/axfm-publish`
