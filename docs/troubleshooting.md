# 문제 해결

증상별로 찾아보세요. 대부분은 `/axfm-guide` 나 `/axfm-debug` 가 자동으로 진단합니다.

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm install` 이 403/멈춤 | 사내망에서 npm 레지스트리 차단 | 관리자에게 사내 레지스트리 주소를 받아 프로젝트 `.npmrc`에 `registry=<주소>` 설정. 또는 우선 Python 스크립트 솔루션으로 시작 |
| `/axfm-new` 등 명령이 안 뜸 | 플러그인 미설치·미인식 | `/plugin install axfm@hansol-axfm` 확인 후 Claude Code 재시작 |
| `.ps1 실행이 차단됨` | PowerShell 실행 정책 | `.\start.cmd` 사용, 또는 `powershell -ExecutionPolicy Bypass -File .\start.ps1` |
| `.ps1 에서 "Unexpected token '??'" 오류` | 구버전 템플릿(모듈 v2.0.0)의 PS7 전용 문법 — 기본 PowerShell 5.1과 비호환 | `/axfm-guide` 로 모듈·스크립트 재동기화 (v2.0.1에서 수정됨). 당장은 `.\start.cmd` 사용 |
| `Python`/`node` 를 찾을 수 없음 | 미설치 또는 PATH 누락 | Python: python.org 설치(“Add to PATH” 체크). Node: `winget install OpenJS.NodeJS.LTS`. 설치 후 터미널 재시작 |
| 화면에 한글이 깨짐(스크립트) | 콘솔 인코딩(cp949) | 템플릿 main.py는 UTF-8로 자동 설정됨. 직접 만든 스크립트면 맨 앞에 `sys.stdout.reconfigure(encoding="utf-8")` 추가 |
| 포트가 이미 사용 중 | 다른 프로그램이 포트 점유 | `/axfm-new`는 빈 포트를 자동 선택. 기존 솔루션이면 `axfm.json`(웹앱 dev 포트)·package.json 확인 |
| 이웃 솔루션이 안 보임 | 상대가 레지스트리에 미등록 | 상대 폴더에서 한 번 실행(스크립트는 자동 등록) 또는 `/axfm-guide` 실행 |
| "레지스트리 손상" 경고 | `~/.axfm/registry.json` 파손 | `/axfm-guide` 가 복구 안내. 최악의 경우 파일을 지우고 각 솔루션에서 `/axfm-guide` 재실행 |
| 연동 데이터가 안 옴 | 상대가 아직 안 내보냄 / 오래된 스냅샷 | 상대가 해당 데이터를 `writeShared` 했는지, `.axfm/data/<name>.json` 존재하는지 확인 |
| 화면 색상·폰트가 이상함 | 디자인 토큰 미반영 | `node "<플러그인>/scripts/export-design.mjs" app/axfm-design.css` 재생성. `/axfm-guide` 가 드리프트 감지 |
| 모듈이 옛날 동작 | 플러그인 업데이트 후 프로젝트 모듈이 구버전 | `/axfm-guide` 가 버전 드리프트 감지 → 재동기화 제안 |

## OneDrive 사용자 주의
`~/.axfm` 가 OneDrive 로 동기화되면 다른 PC의 절대경로가 섞일 수 있습니다. 홈 폴더가 OneDrive 리다이렉트된 경우 관리자와 상의하세요.

## 그래도 안 되면
`/axfm-debug` 에게 정확한 증상과 에러 메시지 전체를 보여주세요.
