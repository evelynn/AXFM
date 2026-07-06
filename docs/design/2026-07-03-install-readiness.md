# AXFM v2.0.1 상세 설계 — 설치 가능 구조 완성 (2026-07-03)

> 입력: 2026-07-03 재검토(리뷰 P1~P10). 목표: 북극성("처음 보는 팀원이 개입 없이 설치→생성→연동→확인을 10분 안에")을
> 막는 결함을 제거하고, **설치→생성→실행→연동 전 구간이 자동 검증으로 실증된 상태**를 만든다.
> 원칙: 위험한 단계는 결정적 스크립트로(v2 피벗의 교훈), 약속(문서)과 실제 능력을 일치시킨다.

## 0. 환경 사실 (설계 입력, 2026-07-03 실측)

| 항목 | 값 | 설계 반영 |
|---|---|---|
| 기본 PowerShell | **5.1** (Windows 11 기본) | 템플릿 .ps1은 5.1 문법만 사용 (D1) |
| Node | v24.13.1 | TS 모듈 직접 실행(type stripping) 가능 → 크로스 스택 테스트 (D7) |
| npm 레지스트리 | **접근 가능** (이전 403 해소 확인) | Next.js 템플릿 최초 빌드 실증 (D8). 단 사내망 차단 재발 리스크는 파일럿 체크리스트에 유지 |
| Python | 로컬 3.14 / **규약 최소 3.10** | ts 파싱은 3.10 기준으로 호환 (D3) |
| claude CLI | 2.1.198 | `claude plugin validate` 를 수용 기준에 포함 (D5) |
| git | 저장소 아님 (.git 없음) | 배포 모델(marketplace add)이 git 전제 → 초기화 (D5) |

## 1. 결정 (Decisions)

- **DEC-1 봉투 `ts` 규약 확정**: 송신은 **오프셋 포함 ISO-8601, 초 단위**(예 `2026-07-03T14:00:00+09:00`).
  수신은 관용적으로 `Z` 접미도 허용(과거 스냅샷·타 구현 호환). 근거: Python 3.10 `fromisoformat`은 `Z` 미지원 —
  기존 JS `toISOString()`(`...Z`) 송신은 최소 지원 버전에서 크로스 스택 연동을 깨뜨림(P3). "엄격한 송신, 관용적 수신".
- **DEC-2 위험 단계 스크립트화 확대**: clone 등록(`register.mjs`)과 모듈 재동기화(`sync-modules.mjs`)를 결정적
  스크립트로 만들고 스킬은 호출만 한다(P6·P7). scaffold와 레지스트리 입출력을 공용 모듈로 공유해 규칙(원자적 쓰기,
  BOM 금지, id 충돌 거부)을 한 곳에 둔다.
- **DEC-3 서버 액션 분리**: 서버 액션은 `app/actions.ts`(최상단 `"use server"`)에만 둔다. page.tsx 의 액션
  export 와 클라이언트 컴포넌트의 페이지 import 는 App Router 규칙 위반으로 데모 화면 자체를 깨뜨림(P2).
- **DEC-4 .ps1 호환 게이트**: 템플릿 PowerShell 스크립트는 5.1 파서로 검사하는 회귀 게이트를 test-all 에 추가(P1).
- **DEC-5 연동 경계 약속 명시**: v2 연동의 실효 범위는 **같은 PC**다. README·protocol 에 이 경계와 팀 시나리오
  (팀원 솔루션은 clone 후 각자 PC에서 실행되어 이웃이 됨 — 사람 간 원격 데이터 공유는 범위 밖/로드맵)를 명시(P8).
- **DEC-6 fn 글루 드리프트 규칙**: protocol §5에 "가능하면 `kind: data`(스냅샷)로 설계, `kind: fn` 글루는 로직
  복제이므로 발산 위험" 원칙과 재생성 절차를 명시(P9).
- **DEC-7 스킬 9종 유지**: 축소(9→4~5)는 파일럿 실측 데이터로 판단(v1.1 보류). 이번 릴리스는 설치 성립에 집중(P10).
- **DEC-8 버전·형상**: modules `2.0.0 → 2.0.1`(모듈 코드 변경), plugin `0.1.0 → 0.2.0`. git 저장소 초기화 +
  전체 커밋(배포 모델 성립 조건, P4).
- **DEC-9 폴더 스코프 설치가 공식 경로** (2026-07-03 추가, 사용자 요구): 플러그인은 전역(user)이 아니라
  **작업 폴더에만 적용**되도록 설치한다 — `claude plugin install axfm@axfm --scope project`
  (프로젝트의 `.claude/settings.json` 에 `enabledPlugins` 기록, 팀 공유 가능. 개인 한정은 `--scope local`).
  스코프 우선순위는 local > project > user. `/axfm-new` 스캐폴더가 새 솔루션 폴더에
  `.claude/settings.json`(폴더 스코프 활성화)을 자동 생성하며, 이 파일은 git 에 커밋되어 팀원 clone 시
  Claude Code 가 설치를 안내한다(v2.1.195+ 는 명시 설치 필요). 검증: 저장소 폴더에서 `claude plugin list`
  → `Scope: project / enabled`, 무관한 폴더에서 → `disabled` 교차 확인 완료. README·quickstart·publish·
  troubleshooting·pilot 문서를 이 경로로 통일.

## 2. 작업 항목 (파일 단위)

### D1. `start.ps1` PowerShell 5.1 호환 (P1, Critical)
- `templates/python/start.ps1`: `??`(PS7 전용) 제거 → `if` 분기. 종료 코드 전달(`exit $LASTEXITCODE`) 추가.
- `docs/troubleshooting.md`: 구버전(모듈 v2.0.0) start.ps1 의 `??` 파싱 오류 증상 행 추가(재동기화 안내).

### D2. Next.js 서버 액션 구조 준수 (P2, Critical)
- 신규 `templates/nextjs/app/actions.ts`: `"use server"` + `exportTodayMenu()` (demo-menu 계산 → `writeShared`).
- `app/page.tsx`: 액션 export 제거(페이지는 default export 만). `app/components/DemoPanel.tsx`: `../actions` 에서 import.
- `scripts/scaffold.mjs` 사후검증 필수 파일에 `app/actions.ts` 추가.
- 실증: 스캐폴드 산출물에서 `npm install` → `tsc --noEmit` → `next build` 성공 (최초 빌드 검증, D8).

### D3. 봉투 ts 크로스 스택 정합 (P3, Critical) — DEC-1 구현
- `modules/nextjs/lib/axfm/types.ts`: `isoNow()` 신설(오프셋 포함·초 단위) → `makeEnvelope` 가 사용.
- `modules/nextjs/lib/axfm/common.ts`: `nowIso()` 를 `isoNow` 위임으로 수정(기존 주석-동작 불일치 해소).
- `modules/python/axfm/types.py`: `parse_ts()` 신설(`Z` → `+00:00` 치환 후 `fromisoformat`, 3.10 호환).
  `_is_iso` 와 `interop.read_from` 의 신선도 계산이 이를 사용.
- `docs/protocol.md` §4: ts 형식 규칙 명문화. §8 구현자 체크리스트에 "송신 오프셋 형식·수신 Z 허용" 추가.
- 테스트: `test-python-unit.py` 에 `Z` 접미 봉투 수용 케이스 추가. 크로스 스택 E2E(D7)로 실데이터 왕복 검증.

### D4. 결정적 등록·재동기화 스크립트 (P6·P7) — DEC-2 구현
- 신규 `scripts/lib/registry-io.mjs`: 레지스트리 경로/읽기/원자적 쓰기/충돌 검사 공용화. `scaffold.mjs` 가 이를 사용하도록 정리.
- 신규 `scripts/register.mjs --dest <path>`: 대상의 axfm.json 검증 → id 충돌 검사 → 원자적 등록.
  (웹앱 clone 등록의 LLM 수작업 제거. 파이썬은 기존 `register_self()` 병행 유지.)
  웹앱이면 package.json 의 `--port N` 을 읽어 port 필드 유지.
- 신규 `scripts/sync-modules.mjs --dest <path>`: 대상 type 판별 → `modules/<type>/` 파일 목록만 덮어쓰기
  (**삭제 없음** — 파이썬 `axfm/interface.md` 유실 위험 제거) → CLAUDE.md 의 `axfm-module-version` 주석 갱신 → 변경 파일 보고.
- `skills/axfm-guide/SKILL.md`: 1단계 clone 등록과 6단계 재동기화를 스크립트 호출로 교체.
- `assets/CLAUDE.md.template`: 파이썬 소유권 명확화 — `axfm/*.py` 는 프레임워크 소유, `axfm/interface.md` 는 사용자 소유(항상 갱신).

### D5. 설치 경로·형상 (P4)
- `claude plugin validate .` 통과 확인.
- git 저장소 초기화 + 전체 초기 커밋. `.claude-plugin/plugin.json` version `0.2.0`.
- `modules/VERSION` `2.0.1`, 모든 모듈 파일 헤더 `v2.0.1` (guide 드리프트 감지 정합).

### D6. 약속-능력 정합 (P5·P8·P9) — DEC-5·6 구현
- `README.md`: "연동하기" 항목에 같은-PC 경계 1줄 명시.
- `docs/protocol.md` §0/§9: 경계·팀 시나리오·로드맵(사람 간 공유는 v2 밖) 명시. §5: fn 글루 드리프트 경고.
- `docs/pilot-onboarding.md`: 자동 검증 목록 갱신(크로스 스택 E2E, ps1 파서 게이트, Next.js 빌드 실증).

### D7. 회귀 게이트 확장
- 신규 `scripts/test-cross-stack.mjs`: 격리 HOME 에 nextjs·python 솔루션 스캐폴드 →
  ① JS 모듈(`writeShared`, Node type-stripping 으로 vendored TS 직접 실행)이 쓴 스냅샷을 Python `main.py <id>` 가 수신
  ② Python 이 쓴 스냅샷을 JS `readFrom` 이 수신 — 양방향 실데이터 왕복. Node < 22.6 이면 명시적 SKIP(통과 아님을 출력).
  (vendored TS 는 테스트 산출물 내에서 상대 import 에 `.ts` 확장자를 부여해 실행 — 원본 소스 변경 없음.)
- `scripts/test-all.mjs` 단계 추가: templates `.ps1` PS5.1 파서 검사(win32 한정), 크로스 스택 E2E.
- `scripts/test-python-unit.py`: `Z` 접미 ts 수용, `parse_ts` 왕복 케이스 추가.

### D8. Next.js 트랙 최초 실증 (P5 해소 확인)
- 스크래치 폴더에 scaffold → `npm install` → `npx tsc --noEmit` → `npx next build` 를 1회 실증하고 결과를 본 문서에 기록.
- 이 실증은 CI 게이트가 아니라 릴리스 수동 게이트(네트워크 의존) — 파일럿 체크리스트에 유지.

## 3. 수용 기준 (완료 정의)

1. `node scripts/test-all.mjs` 전체 통과 — 신규 게이트(ps1 파서, 크로스 스택 E2E) 포함.
2. Next.js 템플릿: scaffold 산출물이 `npm install`·`tsc --noEmit`·`next build` 성공 (최초 실증).
3. `start.ps1` 이 PowerShell 5.1 파서에서 오류 0.
4. 크로스 스택: JS 스냅샷 → Python 수신 OK, Python 스냅샷 → JS 수신 OK (ts `Z`/오프셋 모두 허용 수신).
5. `claude plugin validate .` 통과.
6. git 저장소 + 초기 커밋 존재. 버전 일관(plugin 0.2.0 / modules 2.0.1 / 헤더 v2.0.1).
7. README·protocol 의 연동 약속이 실제 능력(같은 PC·비실시간)과 일치.

## 4. 범위 밖 (명시적 보류)

- 스킬 9→4~5 축소 (파일럿 데이터로 결정, DEC-7)
- 사람 간(원격) 데이터 공유 메커니즘 (로드맵 후보: 공유 폴더/사내 git 동기화)
- Pretendard/D2Coding 폰트 번들, `register_self` 경로 대소문자 정규화(minor)
- 파일럿 M3 실측 (사람 필요 — `docs/pilot-onboarding.md` 절차 유지)

## 5. 실증 기록 (2026-07-03)

- [x] **test-all 전체 통과** — 디자인 토큰 ✓ / PowerShell 5.1 파서 검사(.ps1) ✓ / python↔python E2E ✓ /
  **nextjs↔python 크로스 스택 E2E ✓ (신규 — JS 스냅샷을 Python 이, Python 스냅샷을 JS 가 양방향 수신)** / python 단위 테스트 ✓
- [x] **Next.js 템플릿 최초 빌드 실증** — scaffold → `npm install`(26 pkgs) → `tsc --noEmit` exit 0 → `next build` exit 0.
  주의: 최초 typecheck 에서 실오류 2건 발견·수정(page.tsx DemoPanel initial 타입, interop.ts parseInterface 캐스팅) —
  "템플릿이 한 번도 컴파일된 적 없었다"는 리스크가 실제였음. 이후 `next start` 스모크: HTTP 200 +
  데모 화면 4개 카드(제목/주고받는 것/이웃/공통 통로 체험) 렌더링 확인.
- [x] **`claude plugin validate .` 통과** (CLI 2.1.198)
- [x] git 저장소 초기화 + 초기 커밋 (해시는 git log 참조)
