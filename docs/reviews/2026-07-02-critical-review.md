# AXFM 비판적 설계 평가 (2026-07-02)

> 평가 시점: 커밋 d8df127 (T1·T2·T16 완료, T3·T4 구현·검증보류, 스킬 미구현).
> 방법: 독립 fresh-context 리뷰어 3트랙 — Claude 3렌즈(① 아키텍처·프로토콜 ② 초보자 UX·스킬 ③ 운영·보안·배포). codex 교차검증(ANALYZE)은 백그라운드로 착수했으나 이 문서 작성 시점에 결과 미회수 — 회수되면 하단 "codex 추가 소견"에 병합 예정.
> 세 트랙은 상호 독립 실행이며 아래 Critical/High 대부분에서 2~3중 수렴함(반대 의견 없음).

## 종합 판정

현재 구현은 **행복 경로 데모 수준**이다. 프로토콜이 이름을 걸고 보증해야 할 4가지 — **신원(identity) · 원자성(atomicity) · 내구성(durability) · 경계(boundary)** — 가 코드가 아닌 문장으로만 존재한다. Critical 5건은 스킬(T5~) 착수 전에 프로토콜·모듈 레벨에서 먼저 고쳐야 한다: vendoring 구조상 결함이 생성되는 모든 솔루션에 복제된 뒤에야 발견되기 때문.

동시에, **세 리뷰어 모두가 지적한 방향 전환급 이슈 3건**(npm 차단으로 Next.js 템플릿 성립 불가 / 스캐폴딩을 비결정적 LLM에 위임 / localhost 무인증의 브라우저 위협)은 코드 수정이 아니라 사용자 결정을 필요로 한다.

## Critical — 설계 성립 조건을 위협

### C1. 응답자 신원 미검증 × 포트 드리프트 = 무증상 교차 연결 (수렴: A#1, B#6)
`next dev`는 포트 점유 시 에러 없이 다음 포트로 이동한다. A(3001 예정)가 3002에 뜨고 B가 3001에 뜨면 `checkAlive`/`fetchData`는 3001 응답을 A로 믿는다. manifest `id`·봉투 `from`을 기대 id와 대조하는 코드가 없다. 비개발자는 데이터가 뒤바뀐 것을 감지할 수단이 없다.
- 근거: `client.ts` checkAlive(캐스팅만), fetchData(from 미대조), `types.ts` validateEnvelope(from은 문자열 여부만)
- 수정: checkAlive에서 `manifest.id !== entry.id → null`, fetchData에서 `envelope.from !== solutionId → 에러`. 포트는 레지스트리 기반 결정적 배정(등록 최대 포트+1). protocol.md §3에 신원 대조를 필수 규칙으로.

### C2. "경계 = 같은 PC"가 어디서도 강제되지 않음 (수렴: A#2, B#5, C#2)
① `next dev/start` 기본 바인딩은 0.0.0.0 → 사내 LAN 전체가 무인증 API의 신뢰 경계. ② 브라우저 위협: DNS rebinding으로 임의 웹페이지가 same-origin이 되어 `provides` 업무 데이터를 읽고, `Content-Type: text/plain`(preflight 없는 simple request) CSRF로 `inbox`에 파일을 쓰고 핸들러를 실행시킬 수 있다.
- 근거: `templates/nextjs/package.json`(`-H` 없음), `modules/nextjs/app/api/axfm/**`(Origin/Host/Content-Type 검증 0), `docs/protocol.md` §9
- 수정(하드닝, 무논쟁): dev/start에 `--hostname 127.0.0.1`, inbox에 `Content-Type: application/json` 강제, Host 헤더 화이트리스트(localhost/127.0.0.1). **결정 필요**: 로컬 공유 토큰(`~/.axfm/token`, 봉투 `auth` 예약됨)을 v1로 승격할지 vs HTTP를 파일교환 전용으로 축소할지.

### C3. npm 차단 → Next.js 템플릿 전략 불성립 (수렴: B#2, C#1) — **결정 필요**
이 개발 PC에서 registry.npmjs.org가 403(모든 패키지). 개발 PC에서 안 되면 비개발자 PC에서도 안 된다. 저장소에 `.npmrc`·미러·번들 node_modules 부재. 북극성("10분 데모")의 최대 위협인데 원래 Risks 표에 이 행이 없었다.
- 대안: (a) 사내 레지스트리(Verdaccio/Nexus) + 템플릿 `.npmrc` (b) npmmirror `.npmrc` 내장 (c) **Python-first로 스택 우선순위 역전** — Python 트랙은 stdlib만이라 망 무관, 가장 저비용의 성립 경로.

### C4. 스캐폴딩 전체가 비결정적 LLM 수행에 위임됨 (B#1)
`templates/nextjs`는 `lib/axfm`·`app/api/axfm`가 없는 반제품(모듈에만 존재). `/axfm-new`가 2소스 병합·6파일 플레이스홀더 치환·포트 스캔·레지스트리 JSON 편집·design export를 매번 정확히 해야 한다. 하나라도 누락 시 비개발자가 해독 못 하는 에러. **가장 위험한 단계만 LLM에 맡긴 자기모순** (디자인 토큰은 이미 결정적 스크립트인데).
- 수정: `scripts/scaffold.mjs` 신설(병합·치환·등록·export·사후검증까지 결정적). 스킬은 "질문 3개 + 스크립트 호출 + 결과 안내"로 축소.

### C5. 파일 폴백이 살아있는 서버의 권위 응답을 스테일 데이터로 덮음 (수렴: A#3, C#3)
`httpJson`은 404/500에도 throw → 파일 폴백 진입. 상대가 provides를 삭제하고 서버가 NOT_FOUND를 답해도 과거 `.axfm/out/{name}.json`이 있으면 옛 데이터를 성공으로 반환. (`.axfm/` gitignore 누락분은 이미 수정 완료 — 커밋 d3ab342)
- 수정: 폴백은 네트워크 오류(fetch reject/timeout)일 때만. HTTP 4xx/5xx는 그대로 에러 전달. 폴백 데이터에 `ts` 신선도 표식.

## High — 신뢰성·정합성 (수렴 다수)

- **H1. 명령어 표기 이원화**: 설계서 `/axfm:new`(콜론) vs 구현물 전부 `/axfm-new`(하이픈). vendored 문자열에 박제되면 이미 생성된 모든 솔루션이 없는 명령을 안내. (A#12, B#4, C#6) → T5 착수 전 실제 설치로 호출명 1회 검증 후 전 파일 통일. **본 저장소는 하이픈으로 통일 진행**(코드 다수가 이미 하이픈).
- **H2. inbox 파일명 초 단위 충돌**: `ts` 숫자 17자리 파일명 → 같은 초 2건 = 덮어쓰기(무손실 착각). `ts`는 발신자 통제값이라 고의 덮어쓰기·스푸핑도 가능. (A#4) → 수신시각+단조 카운터/UUID, validateEnvelope에 ISO-8601 파싱.
- **H3. exportFile 비원자적 쓰기**: 쓰는 중 읽기 = 깨진 JSON → 오진 메시지. (A#5) → temp+rename. protocol.md §5에 원자성 규약화(C#/Python 구현자 필수 암묵지).
- **H4. 봉투 1MB 상한 미집행**: 명세만 있고 코드 0. `req.json()`이 500MB도 버퍼링. (A#6, C#9) → inbox에 Content-Length/실측 413.
- **H5. 솔루션 id 충돌 규칙 부재**: git 전파로 두 팀원이 같은 id → clone PC 충돌. `getNeighbor`는 find로 첫 항목 조용히 승리. "id 불변"과 "충돌 시 변경"이 모순. (A#7) → `{owner}-{name}` 권장 슬러그 + 등록 충돌 절차.
- **H6. 레지스트리 동시성·손상 무음**: 두 세션 동시 쓰기 소실. PowerShell BOM UTF-8 → parse throw → readRegistry가 빈 배열 반환 → 모든 이웃 실종(무음). (A#8, B#11, C#10) → temp+rename, BOM 금지 규약, 손상은 화면에 노출.
- **H7. push는 at-most-once·무재시도·무큐인데 매트릭스는 "웹(꺼짐)←push=파일교환"이라 약속**: inbox 방향 파일 폴백은 코드·규약에 없음. 유실 의미론을 Risks가 인정 안 함. (A#9) → 매트릭스 정정 또는 수신측 out/ 스캔(pull inbox) 추가.
- **H8. checkAlive 1.5초 타임아웃**: Next dev 온디맨드 컴파일 첫 요청이 초과 → 실행 중 이웃이 "꺼짐" 오탐(첫인상 = 프레임워크가 거짓말) + 스테일 폴백. (A#10) → 5초+재시도, 타임아웃은 offline이 아닌 unknown.
- **H9. "protocol.md만으로 C# 구현" 불성립**: 파일명·sanitize·폴백순서·인코딩(BOM)·미지 type 등록절차가 TS 코드에만 존재. (A#11) → "구현자 체크리스트" 섹션 신설, M2에서 문서만으로 제3스택 목업 검증.
- **H10. connect 스킬 내부 모순**: "남의 프로젝트 수정 금지"와 "양쪽 manifest 갱신"이 상충. v1은 대부분 같은 사용자 소유인데 수동 붙여넣기 강요. (B#8) → 같은 PC/레지스트리면 확인 후 양쪽 직접 수정 허용, 복사블록은 타인 협업 폴백.
- **H11. 여정 progress.json이 초보자 행동모델과 어긋남**: 스킬 우회 시 영구 미갱신, demo_seen은 관측 불가 자기신고, gitignore 누락으로 clone 상속(수정됨). (B#7) → 마일스톤을 저장값이 아닌 파생 신호로 매번 재계산.

## Medium/Low (요약)
manifest 무검증 로드(A#14) · "드리프트 0" 주장 모순(A#16, B#16, C#5) · 템플릿 단독 빌드 불가·조립 검증 스크립트 부재(A#17) · YAML 파서 배열 미지원 vs 규격은 배열 사용(A#18) · envelope.name↔경로 불일치 허용(A#19) · from 스푸핑 미인정(A#20) · inbox 무한 누적·보존정책 부재(A#22, C#9) · 수신측 비가시로 데모 미완결(B#12) · CORS 트랩(B#13) · provider 무인자 스냅샷 한계(B#15) · 폰트 미번들로 타이포 토큰 무력(B#16) · PowerShell 실행정책(C#8, B#17) · strict-ssl=false 공급망(C#7) · CRLF(C#12) · badge offline 토큰 미사용(A#23, B#22) · plugin version 부재(수정됨) · README 데드링크(수정됨) · .karin 배포 포함(수정됨).

## 과설계 (Karpathy Simplicity 위반)
1. **커스텀 YAML 파서 + deep-merge + 10단계 참조 가드** (~175줄): 현존 디자인 파일 1개뿐인데 아직 없는 사용처용 유연성 + 규격(배열)과 어긋나는 버그 표면. v1은 "단일 DESIGN.md → 평탄화"면 충분.
2. **components.* 토큰 전면 CSS 수출**: 생성만 되고 안 쓰이는 변수 양산(badge offline이 그 증거).
3. **provides `kind:"file"`**: 선언만 있고 구분 처리 코드 0 — 단일 사용처 없는 추상화.
4. **§7 버전 협상 반쪽 구현**: v2 없는데 협상 규칙 절반만. "major 불일치 시 에러" 한 문장 + 전 경로 일관 적용이 나음.
5. **스킬 9종**: 초보자에게 과다. → 핵심 4종(new/guide/connect/feature) + guide가 나머지 흡수 권장.

## 지금 결정해야 할 3가지 (방향 전환)
1. **npm 조달 전략**: 사내 레지스트리 / npmmirror 내장 / **Python-first 역전**. 미결 시 M1 게이트(10분 실측) 실행 불가.
2. **localhost 보안 모델**: 토큰+Host+Origin을 v1 필수로 승격 / HTTP를 파일교환 전용 축소. "v1 무인증"은 브라우저 위협 앞에서 수용 불가.
3. **스캐폴딩 결정성 + 스킬 수**: scaffold.mjs로 위험 단계 결정화 + 스킬 9→4~5 축소 여부.

## 이미 반영 완료 (커밋 d3ab342)
`.axfm/`·`.karin/` gitignore, plugin.json version, README 데드링크 정리.

## codex 추가 소견
(백그라운드 task-mr3jbw36-fpjwp1 회수 시 병합)
