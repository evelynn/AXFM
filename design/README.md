# design/ — AXFM 디자인 통일 시스템

AXFM으로 만든 **모든 솔루션이 같은 디자인 언어**를 갖게 하는 폴더입니다.
규격: [Google Labs DESIGN.md](https://github.com/google-labs-code/design.md) (YAML 토큰 + 마크다운 본문).

## 파일 구성과 로드 규칙

| 파일 | 역할 |
|---|---|
| `DESIGN.md` | 기본 디자인 시스템 (항상 가장 먼저 로드) |
| 그 외 `*.md` | 추가 디자인 파일 — **자유롭게 추가/삭제 가능** |

**로드 순서**: `DESIGN.md` → 나머지 md 파일명 오름차순.
**충돌 규칙**: 같은 토큰이 여러 파일에 있으면 **나중에 로드된 파일이 덮어쓴다** (오버라이드).
예: `10-brand.md`에 `colors.primary`를 정의하면 DESIGN.md의 primary를 덮어씀.

## 어떻게 적용되나

1. 스킬(UI 작업)은 항상 이 폴더의 md를 **먼저 읽고** 토큰을 준수합니다 — 프로젝트에 복사되지 않으므로, 여기를 고치면 모든 솔루션의 다음 UI 작업부터 반영됩니다.
2. `/axfm-new`가 솔루션 생성 시 토큰을 CSS 변수 파일(`axfm-design.css`)로 내보냅니다:
   ```
   node "<플러그인 경로>/scripts/export-design.mjs" <출력.css>
   ```
3. 디자인이 바뀌면 `/axfm-guide`가 기존 솔루션의 CSS 변수 재생성을 제안합니다.

## 디자인 파일 관리 (관리자)

- **교체**: 사용자 제공 DESIGN.md가 오면 이 폴더의 `DESIGN.md`를 통째로 교체 — 코드 변경 불필요.
- **추가**: 파일명 앞에 숫자 접두(`10-`, `20-`)로 로드 순서를 제어하는 것을 권장.
- **삭제**: 그냥 지우면 됨. 다음 UI 작업/재생성부터 반영.
- 변경 후 git commit·push → 팀원은 터미널에서 수신 (한 줄씩):
  `claude plugin marketplace update hansol-axfm` → `claude plugin update axfm@hansol-axfm --scope project` (작업 폴더에서) → Claude Code 재시작.

## 검증

```
node scripts/export-design.mjs --check
```
토큰 파싱·참조 해석에 문제가 있으면 종료 코드 1과 함께 어떤 파일·어떤 키인지 출력합니다.
