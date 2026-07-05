# AXFM 연동 규약 v2 — 문서·함수 중심 (비실시간)

> 이 문서는 AXFM 솔루션 간 "공통 통로"의 유일한 명세입니다.
> **핵심 전환(2026-07-02):** AXFM은 상시 구동 서버가 없다. 솔루션끼리 라이브 HTTP로 실시간 통신하지 않는다.
> 연동은 **① 연동 함수 문서(interface.md) ② 공통 함수 라이브러리 ③ 연동 글루 코드 생성**으로 이뤄진다.
> 규약 버전: `2`

## 0. 개요 — 무엇이 "공통 통로"인가

| 기둥 | 실체 | 역할 |
|---|---|---|
| **연동 함수 문서** | 각 솔루션의 `axfm/interface.md` | "내 데이터·함수는 이렇게 쓴다"를 항상 문서화 — 연동의 계약서 |
| **공통 함수 라이브러리** | 각 솔루션에 vendored된 `lib/axfm/`(JS) · `axfm/`(Py) | 표준 유틸 + 데이터 읽기/쓰기 표준 함수. 모든 솔루션이 같은 함수를 공유 |
| **연동 글루 코드** | `/axfm-connect`가 생성하는 `connectors/<상대id>.*` | 상대 interface.md를 읽고 내 솔루션에 연결 코드를 **바이브 코딩으로 생성** |
| 로컬 레지스트리 | `~/.axfm/registry.json` | 이 PC에 어떤 솔루션이 어디 있는지 (스킬이 유지) |

**비실시간 원칙**: A가 B의 데이터를 쓰려면 B가 표준 위치에 내보낸 스냅샷을 읽거나, B의 문서화된 함수를 글루 코드로 재현/호출한다. 서버 포트도, 상시 프로세스도, 무인증 API도 없다 → 브라우저발 보안 위협(CSRF·DNS rebinding) 자체가 성립하지 않는다.

## 1. Manifest — `axfm.json` (솔루션 정체성)

솔루션 루트. 정체성과 능력 목록의 최상위 요약. 상세 사용법은 interface.md가 담당.

```json
{
  "axfm": "2",
  "id": "lunch-pick",
  "name": "점심추천기",
  "description": "점심 메뉴를 추천해주는 도구",
  "type": "nextjs",
  "owner": "홍길동",
  "provides": ["today-menu"],
  "accepts": ["feedback"]
}
```

| 필드 | 필수 | 규칙 |
|---|---|---|
| `axfm` | O | 규약 major. 문자열 `"2"` |
| `id` | O | kebab-case ASCII, 유일. 권장 형식 `{owner}-{name}` (팀 전파 시 충돌 방지). **생성 후 변경 금지** |
| `name`/`description`/`type`/`owner` | O | type: `nextjs` \| `python` |
| `provides` | O(빈 배열 가능) | 내가 제공하는 능력 이름 목록 (상세는 interface.md) |
| `accepts` | O(빈 배열 가능) | 내가 받아줄 수 있는 데이터 이름 목록 |

`baseUrl`·엔드포인트·포트 필드는 v2에서 제거(서버 없음).

## 2. 연동 함수 문서 — `axfm/interface.md` (연동의 심장)

각 솔루션이 **항상 유지**하는, 사람과 스킬이 함께 읽는 계약서. YAML 프론트매터(기계 판독) + 마크다운 본문(사람 판독)의 이중 구조.

```markdown
---
axfm: "2"
id: lunch-pick
name: 점심추천기
functions:
  - name: today-menu
    kind: data           # data(스냅샷 제공) | fn(함수 호출)
    returns: { menu: string, date: string }
    sample: { menu: "김치찌개", date: "2026-07-02" }
    source: ".axfm/data/today-menu.json"   # kind=data: 스냅샷 위치
    desc: 오늘의 추천 메뉴
  - name: pick-menu
    kind: fn
    params: { count: number }
    returns: { menus: string[] }
    sample_call: "pickMenu({ count: 3 }) → { menus: ['김치찌개','비빔밥','냉면'] }"
    entry: "lib/menu.ts#pickMenu"           # kind=fn: 함수 위치(글루 생성 참조)
    desc: 메뉴 N개 추천
accepts:
  - name: feedback
    sample: { menu: "김치찌개", rating: 5 }
    desc: 메뉴 피드백 수신 — 보내는 쪽이 자기 폴더에 feedback 으로 내보내면 내가 수집
---

# 점심추천기 연동 안내

## 제공하는 것
- **today-menu** (데이터): `.axfm/data/today-menu.json`을 읽으세요. 하루 1회 갱신됩니다.
- **pick-menu** (함수): `lib/menu.ts`의 `pickMenu`를 참고해 연결하세요.

## 받는 것
- **feedback**: 보내는 쪽이 자기 솔루션에서 `writeShared("feedback", {...})`로 내보내면,
  점심추천기가 이웃들을 `readFrom(<보낸이 id>, "feedback")`으로 수집합니다.
```

- **규약: 데이터/함수를 추가·변경하면 interface.md를 반드시 함께 갱신한다.** (다른 솔루션은 이 문서만 보고 연동한다.) `/axfm-feature`가 자동으로 지킨다.
- `sample`/`sample_call`이 스키마 역할 — 초보자에게 JSON Schema보다 예시가 강력.
- `functions[].name`은 solution 내에서 유일, kebab-case.

## 3. 공통 함수 라이브러리 (vendored)

모든 솔루션에 복사되는 표준 함수. 스택별 동일 표면.

| 함수 | 역할 |
|---|---|
| `readShared(name)` | 내 `.axfm/data/{name}.json` 스냅샷을 표준 봉투에서 꺼내 반환 |
| `writeShared(name, data)` | 내 데이터를 `.axfm/data/{name}.json`에 표준 봉투로 **원자적** 저장(temp+rename) |
| `readFrom(solutionId, name)` | 레지스트리에서 상대 경로를 찾아 상대의 `.axfm/data/{name}.json`을 읽음 (비실시간 스냅샷) |
| `loadInterface(solutionId)` | 상대 interface.md의 프론트매터를 파싱해 반환 (연동 대상 탐색용) |
| `neighbors()` | 레지스트리의 다른 솔루션 목록 |
| `overview()` | **이 PC 전체 솔루션의 종합 현황** — 생존 여부·모듈 버전·스냅샷 신선도·provides/accepts 를 한 번에 반환. 현황판·시스템 모니터링 솔루션의 표준 데이터 소스 (집계는 코드가, 화면·요약만 앱이) |
| 기타 유틸 | 표준 봉투 생성/검증, ISO 타임스탬프, 안전 파일명 등 |

- **데이터 이름 규칙**: `^[a-z0-9]+(-[a-z0-9]+)*$` (최대 64자, 예: daily-report). 위반은 무음 축약이 아니라
  **행동형 오류로 거부**한다 (서로 다른 한글 이름이 같은 파일로 수렴하는 사고 방지).
- `readFrom`은 상대가 실행 중이 아니어도 동작(스냅샷 파일 읽기) — 비실시간의 핵심.
- 스냅샷이 없으면 "상대가 아직 '{name}'을 내보내지 않았습니다. 상대 솔루션을 한 번 실행하거나 데이터를 생성하세요"라는 행동형 메시지.

## 4. 표준 봉투 (Envelope)

`.axfm/data/*.json` 스냅샷의 공통 포장.

```json
{ "axfm": "2", "from": "lunch-pick", "name": "today-menu", "ts": "2026-07-02T12:34:56+09:00", "data": { "menu": "김치찌개", "date": "2026-07-02" } }
```

- 미지 필드 무시(호환성). `readFrom`은 반환된 봉투의 `from`이 요청한 solutionId와 다르면 경고(잘못된 경로/레지스트리 오염 감지). `ts`가 오래되면(기본 24h) "오래된 데이터" 표식.
- **`ts` 형식 규칙 (엄격한 송신, 관용적 수신)**: 생성 시에는 **오프셋 포함 ISO-8601, 초 단위**(예 `2026-07-03T14:00:00+09:00`)로 쓴다 — `Z` 접미는 Python 3.10 `fromisoformat`이 파싱하지 못하므로 송신에 쓰지 않는다. 수신(검증·파싱) 시에는 `Z` 접미도 허용한다(과거 스냅샷·타 구현 호환).

## 5. 연동 글루 코드 생성 (`/axfm-connect`)

1. `/axfm-connect`가 `neighbors()`로 대상 후보를 보여줌.
2. 대상의 interface.md(`loadInterface`)에서 functions/accepts 계약 확인.
3. 내 솔루션에 `connectors/<상대id>.ts`(또는 `.py`) 생성:
   - `kind: data` → `readFrom("<상대id>","<name>")`를 감싼 타입 있는 함수
   - `kind: fn` → 상대 `entry` 함수의 시그니처를 참고해, 스냅샷 기반 재현 또는 공유 로직 호출 글루 (케이스별 바이브 코딩)
   - 상대에게 데이터를 보낼 때(상대의 accepts) → **보내기도 받아가기다**: 나는 내 폴더에
     `writeShared("<name>", data)`로 내보내고, 상대는 `readFrom("<내id>","<name>")`으로 수집한다
     (수집 코드는 상대 쪽 커넥터 — 타인 소유면 복사용 블록으로 출력). 발신자별 데이터가 각자 폴더에
     남으므로 여러 발신자가 같은 accepts 로 보내도 충돌하지 않는다.
4. E2E 확인: 양쪽 실행 후 데이터가 흐르는지 눈으로 확인.

**남의 프로젝트 규칙**: 상대가 타인 소유면 상대 쪽 코드는 "복사용 블록"으로 출력. 같은 PC·같은 레지스트리의 내 소유 프로젝트면 확인 후 양쪽 직접 수정 허용.

**data 우선 원칙 (fn 글루 드리프트 경고)**: 연동은 가능하면 `kind: data`(스냅샷)로 설계한다. `kind: fn` 글루는 상대 로직을 내 프로젝트에 **복제**하는 것이라, 상대가 원본 함수를 바꿔도 내 커넥터는 조용히 옛 동작을 유지한다(발산). fn 글루를 만들 때는 ① 커넥터 파일 머리에 "원본: <상대id> <entry> — 원본 변경 시 /axfm-connect 로 재생성" 주석을 남기고, ② 상대는 함수 변경 시 interface.md 갱신과 함께 연동 중인 이웃에게 재생성을 안내한다.

## 6. 로컬 레지스트리 — `~/.axfm/registry.json`

```json
{
  "axfm": "2",
  "solutions": [
    { "id": "lunch-pick", "name": "점심추천기", "path": "E:\\work\\lunch-pick", "type": "nextjs", "interface": "axfm/interface.md" }
  ]
}
```

- 등록: `/axfm-new`가 생성 시 추가(스크립트가 결정적으로 수행). clone 받은 프로젝트는 `/axfm-guide` 첫 실행 시 자동 추가.
- **쓰기 규약**: UTF-8 **BOM 없음**, temp+rename 원자적 저장, 쓰기 직전 재읽기(동시 세션 소실 방지).
- **손상 시**: 파싱 실패를 조용히 빈 목록으로 만들지 않는다 — 읽기 경로는 "레지스트리 손상 — /axfm-guide로 복구"를
  노출하고, 쓰기 경로(등록)는 원본을 `registry.json.corrupt-<ts>` 로 **백업한 뒤** 재생성한다(증거 인멸 금지).
- id 충돌(같은 id·다른 path): 기존 경로에 axfm.json 이 **살아 있으면** 등록 거부 + id 변경 안내(권장 `{owner}-{name}`).
  기존 폴더가 사라졌으면 **이동**으로 간주해 경로를 갱신한다(폴더 이동/이름변경의 정상 복구 경로).

## 7. 버전 규칙
- `axfm` = major만. 현재 `"2"`. 필드 추가=minor(미지 필드 무시), 의미 변경·제거=major.
- major 불일치 봉투/interface 발견 시: `"상대 솔루션의 AXFM 버전이 다릅니다. 양쪽 /axfm-guide로 업데이트하세요."` 후 중단.

## 8. 구현자 체크리스트 (새 스택 = 이 문서만으로 구현)
새 언어(C# 등) 모듈을 만들 때 반드시 구현:
1. `readShared`/`writeShared` — `.axfm/data/{name}.json`, 표준 봉투, **temp+rename 원자적 쓰기**, **BOM 없는 UTF-8**.
2. `readFrom`/`loadInterface` — 레지스트리에서 경로 조회 → 상대 파일 읽기, `from` 대조.
3. interface.md 프론트매터 파서(YAML 부분집합) + manifest 로더/검증(id 정규식·필수 필드·major).
4. 데이터 이름: 소문자 kebab-case 만 허용 — 위반은 축약(strip)이 아니라 **거부(reject)** (§3 규칙).
   파일명 안전화(영숫자·하이픈, 경로 탈출 방지)는 방어선으로 별도 유지.
5. `ts`: 송신은 오프셋 포함 ISO-8601(초 단위), 수신은 `Z` 접미도 허용 (§4 규칙).
6. 레지스트리 등록/갱신(원자적·BOM 없음·손상 백업·이동 감지 — §6 규칙).

## 9. 데이터 거버넌스·경계
- `.axfm/`는 **절대 git 커밋 금지**(업무 데이터·상태 유출 방지) — 템플릿 .gitignore로 강제.
- 서버가 없으므로 네트워크 노출·인증 이슈 없음. 데이터는 로컬 파일. 공유는 명시적 내보내기(writeShared) + 상대의 명시적 읽기(readFrom)로만.
- **연동의 실효 범위는 "같은 PC"다.** 팀원과의 연동은 상대 솔루션을 clone 받아 내 PC에서 실행(=스냅샷 생성)하는 방식이다 — 코드가 이동하고, 데이터는 각자 PC에서 다시 만들어진다. **사람 간 원격 데이터 공유(팀원 A의 실데이터를 B가 받아보기)는 v2 범위 밖**이며 로드맵 후보(공유 폴더·사내 git 동기화)로 남긴다. 이 경계를 넘는 요구가 나오면 스킬은 한계를 정직하게 안내한다.
- 스냅샷 보존: `.axfm/data/`는 name당 최신 1건(덮어씀). 누적 이력이 필요하면 솔루션이 자체 DB로 관리.
