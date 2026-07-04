# 파일럿 온보딩 절차 (M3 최종 수용 기준)

> 이 절차는 **사람이 직접 실측**해야 합니다 (needs-manual). 아래는 관리자가 파일럿을 진행하는 체크리스트입니다.
> 목표(북극성): 처음 보는 팀원이 개입 없이 **설치 → 솔루션 생성 → 연동 → 확인**을 10분 안에.

## 관리자 1회 사전 세팅 (팀원 온보딩 전)
"10분"은 아래가 갖춰진 PC에서만 성립합니다. 파일럿 전 확인:
- [ ] Claude Code 설치·로그인 완료
- [ ] Node.js 20+ (웹앱 트랙 시) / Python 3.10+ (스크립트 트랙 시)
- [ ] **npm 조달 경로 확정** — 사내망에서 `npm install` 이 되는지. 안 되면 사내 레지스트리 `.npmrc` 배포 또는 Python 트랙으로 파일럿
- [ ] git 저장소 접근(자격증명) 설정 — `claude plugin marketplace add` 첫 관문
- [x] 플러그인 공식 저장소 확정: **github.com/evelynn/AXFM** (2026-07-04 공개) — 안내문의 주소는 `evelynn/AXFM`

## 팀원 실측 시나리오 (스톱워치)
| 단계 | 명령 | 통과 기준 |
|---|---|---|
| 1. 플러그인 설치 | `claude plugin marketplace add evelynn/AXFM` → 작업 폴더에서 `claude plugin install axfm@hansol-axfm --scope project` | 그 폴더의 `claude` 에서 `/axfm-` 입력 시 스킬 목록 표시 (**다른 폴더에서는 안 보여야 정상**) |
| 2. 솔루션 생성 | `/axfm-new` (질문 3개 + 확인 1번) | `ok: true` + 폴더 생성 |
| 3. 실행·확인 | 웹앱 `npm run dev` / 스크립트 `.\start.ps1` | 화면/출력 확인 |
| 4. 가이드 | `/axfm-guide` | 여정 게이지 + 다음 행동 1개 |
| 5. 연동(2인) | 두 번째 솔루션 생성 → `/axfm-connect` | 상대 데이터 수신 확인 |
| 6. **clone 연동** | 팀원 솔루션 `git clone` → `/axfm-guide`(등록) → `/axfm-connect` | clone 받은 솔루션의 데이터 수신 확인 (서비스 핵심 경로) |

## 표본 (오너 확정 전 제안값)
- 참가자 8~10명 (비개발자 5명 이상), 2개 팀 이상. 한글 사용자명 PC 1대 이상 포함.

## 기록 항목 (막힌 지점 → 개선 반영)
각 참가자에 대해:
- 단계별 실제 소요 시간
- 막힌 지점과 에러 메시지 (그대로)
- 스스로 해결했는지 / 개입 필요했는지
- **스킬별 사용 횟수** (idea·qa 통합 여부 판단 자료 — DEC-7)

## 2주 추적 (파일럿 후)
- 생존율: 14일 후에도 솔루션을 실행/수정한 참가자 비율
- 데모를 넘어 실제 업무 기능 1개 이상 추가한 참가자 수
- 만족도 5점 척도 + "동료에게 권하겠는가"

## 판정 (GA 게이트 — 정량 기준)
- **통과**: ① 80% 이상이 개입 없이 1~5단계 완주 ② 소요 시간 중위값 ≤ 10분 ③ 발견된 막힘 전부 troubleshooting/스킬 반영
- **미달**: 막힘 원인 반영 → 재실측 (기준 미달 상태로 확산 단계 진입 금지)
- 막힌 지점은 `docs/reviews/` 에 파일럿 기록으로 남긴다.

## 현재 자동 검증으로 대체된 부분 (사람 없이 이미 통과)
전체 실행: `node scripts/test-all.mjs`
- 크로스 솔루션 실데이터 왕복: `test-interop.mjs` (python↔python) ✓
- **크로스 스택 실데이터 왕복: `test-cross-stack.mjs` (nextjs↔python 양방향)** ✓
- **템플릿 .ps1 의 PowerShell 5.1 파서 검사** (기본 Windows 환경 호환) ✓
- 모듈 정확성: `test-python-unit.py` ✓
- 결정적 생성/등록/재동기화: `scaffold.mjs` · `register.mjs` · `sync-modules.mjs` (사후검증 내장) ✓
- 디자인 토큰: `export-design.mjs --check` ✓
- 플러그인 규격: `claude plugin validate .` ✓
- Next.js 재현 빌드(릴리스 게이트 — 네트워크 의존): `node scripts/release-check.mjs` — scaffold→npm ci(lockfile)→tsc→build→화면 스모크를 명령 1개로 (2026-07-05 실증)

남은 것은 **실제 사람의 10분 실측**뿐이며, 이는 파일럿에서만 확인 가능합니다.
