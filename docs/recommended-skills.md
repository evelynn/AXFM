# 추천 외부 스킬·플러그인 (큐레이션)

> 검증일: **2026-07-02** (웹 리서치 기반). 슬러그·유지보수 상태는 바뀔 수 있으니 설치 전 `/plugin` Discover 탭에서 최종 확인하세요.
> **원칙: 5~7개 집중 설치가 전부 설치보다 낫다** — 플러그인마다 컨텍스트 비용이 듭니다. 분기 1회 재검증 권장.

## 공통 기본 (모든 트랙)
| 이름 | 무엇을 | 설치 | 초보 유용도 |
|---|---|---|---|
| **context7** | 최신 라이브러리 문서를 실시간 조회 → 구버전 API 환각 차단 | `/plugin install context7@claude-plugins-official` | 상 (초보 실패 최대 원인 해소) |
| **commit-commands** | git 몰라도 `/commit` 한 번으로 이력 저장 | `/plugin install commit-commands@claude-plugins-official` | 상 (비개발자 안전망) |

## 웹앱(Next.js) 트랙
| 이름 | 무엇을 | 설치 | 초보 유용도 |
|---|---|---|---|
| **frontend-design** (Anthropic 공식) | "AI 티 나는" UI 방지, 자동 발동 | `/plugin install frontend-design@claude-plugins-official` | 상 (무설정·98만 설치) |
| **Vercel agent-skills** | Next.js 제작사 베스트 프랙티스 자동 적용 | `npx skills add vercel-labs/agent-skills` | 상 (28.6k★) |
| **playwright** (Microsoft 공식) | 만든 화면을 Claude가 직접 브라우저로 확인 | `/plugin install playwright@claude-plugins-official` | 상 (Python 불필요) |

## 스크립트(Python) 트랙
| 이름 | 무엇을 | 설치 | 초보 유용도 |
|---|---|---|---|
| **document-skills** (docx/xlsx/pptx/pdf) | 엑셀·워드·PDF·PPT 생성 — 사무 자동화 핵심 | `/plugin marketplace add anthropics/skills` → `/plugin install document-skills@anthropic-agent-skills` | 상 (공식·설정0) |
| **pyright-lsp** | 타입·임포트 오류 즉시 감지 | `/plugin install pyright-lsp@claude-plugins-official` (+ `npm i -g pyright` 1회) | 상 |

## 선택 (상황별, 기본 미설치)
- **security-guidance** — 위험 코드 패턴 자동 경고. `/plugin install security-guidance@claude-plugins-official`
- **typescript-lsp** — TS 정확도 향상. `/plugin install typescript-lsp@claude-plugins-official`
- **shadcn/ui 공식 스킬** — 템플릿이 shadcn 채택 시. `npx skills add shadcn/ui`
- **explanatory-output-style** — Claude가 구현 선택을 설명(학습용). 단, 모든 응답에 토큰 비용 추가 트레이드오프. `/plugin install explanatory-output-style@claude-plugins-official`
- **skill-creator** — 반복 업무를 내 스킬로. `/plugin install example-skills@anthropic-agent-skills`

## 검토 후 제외 (추천하지 않음 — 큐레이션 신뢰성 근거)
- **Superpowers** — 품질·인기 최상위지만 Windows 11 프리즈([#31])·업데이트 시 스킬 소실([#1082]) 이슈 문서화됨. Git Bash 안정 환경의 숙련자만 조건부.
- **SuperClaude** — ~8k 토큰 상시 오버헤드(공식 이슈 #286).
- **wshobson/agents · claude-code-templates** — 범위 과다(135+/400+)로 초보자 혼란.
- **claude-md-management** — AXFM 자체 CLAUDE.md 생성과 충돌 소지.
- **claude-scientific-skills** — Windows WSL2 필수.

## 참고 (설치형 아님, 탐색용)
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills), [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code), [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community)
