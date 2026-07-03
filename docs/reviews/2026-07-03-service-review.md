# AXFM 정식 서비스 검토 — 6개 관점 연구원 전체 보고 (2026-07-03)

> 방법: 독립 fresh-context 리뷰어 6트랙 병렬 (비개발자 UX / 아키텍처 / 보안·거버넌스 / 플랫폼 운영 / 제품·서비스화 / 품질·테스트).
> 각 트랙은 저장소 전체를 직접 읽고 구조화 보고(판정·강점·발견)를 제출. 발견 48건 = blocker 15 · major 24 · minor 9.
> 종합 계획: docs/plan/2026-07-03-service-readiness-plan.md

## LENS: 비개발자 UX·온보딩 연구원 (과제 ① 학습 부담 · ② 환경/스킬 세팅)
VERDICT: 소수 파일럿 기준으로는 준비 상태가 좋다 — 위험 단계의 결정적 스크립트화, 행동형 한국어 에러 메시지, "이 화면이 보여야 정상" 확인 포인트가 초보자 실패 표면을 크게 줄였다. 그러나 "수십 명이 헬프데스크 없이 시작"하는 정식 서비스 기준으로는, 기본 셸(PowerShell 5.1)에서 깨지는 복붙 명령이 전 문서에 박혀 있고, 관리자 배포 키트(실제 주소 안내문·Claude Code 설치 가이드·환경 점검 자동화)가 없어 첫 10분 관문 자체가 성립하지 않는다. M3 실측(스톱워치) 전에 최소한 명령 호환·프롬프트 안내·작업 폴더 위치 가이드를 정리해야 실측이 의미 있는 데이터가 된다.
STRENGTHS:
  + 위험 단계(생성·등록·재동기화)를 결정적 스크립트로 옮기고 스킬은 호출만 하게 한 구조 (scripts/scaffold.mjs 사후검증 내장, skills/axfm-new/SKILL.md "직접 복사·치환 금지" 원칙) — 비개발자가 해독 못 할 실패를 원천 차단
  + 에러 메시지가 대부분 한국어·행동형이다 — 예: modules/python/axfm/interop.py read_from의 "상대 프로젝트에서 /axfm-guide 를 한 번 실행하면 등록됩니다", registry-io.mjs의 id 충돌 시 "{owner}-{name} 형식으로 바꾸세요"
  + quickstart·pilot-onboarding에 "이 화면이 보여야 정상" 식 통과 기준이 단계마다 내장돼 있어 초보자가 성공/실패를 스스로 판정 가능
  + /axfm-guide가 마일스톤을 저장값이 아닌 실제 상태로 재계산(skills/axfm-guide/SKILL.md 2단계) — 스킬을 우회해도 여정 게이지가 어긋나지 않음 (과거 리뷰 H11 해소 확인)
  + troubleshooting.md가 증상표 형식으로 cp949 한글 깨짐·PowerShell 실행정책·포트 충돌·OneDrive 등 실제 한국 사무환경 함정을 선반영, CLAUDE.md.template에 비개발자 배려 규칙(전문용어 한 줄 설명·눈으로 확인)이 생성물마다 내장
FINDINGS:
  [BLOCKER/소] 복붙 명령의 `&&` 체인이 기본 셸(Windows PowerShell 5.1)에서 파서 오류 — 첫 10분 관문에서 전원 좌초
    설명: 저장소 스스로 확정한 환경 사실(docs/design/2026-07-03-install-readiness.md §0: 기본 PowerShell = 5.1, 그래서 D1에서 .ps1의 `??`를 제거)과 모순되게, 사용자에게 복붙시키는 명령 전부가 `&&` 체인이다: README.md:14(`cd <작업 폴더> && claude plugin install …` — 설치 명령 자체), docs/quickstart.md:29·31(3단계 실행), skills/axfm-new/SKILL.md:36·38(스킬이 안내하는 첫 실행), skills/axfm-publish/SKILL.md:28(팀원 안내문), docs/overview.html:91·161. Windows 11 기본 터미널(PowerShell 5.1)에서 `&&`는 "토큰 '&&'은(는) 이 버전에서 올바른 문 구분 기호가 아닙니다" 오류다. 비개발자는 설치 1단계 또는 실행 3단계에서 곧바로 막히며, troubleshooting.md에는 이 증상 행이 없다.
    권고: 모든 사용자 노출 명령을 PS 5.1 호환으로 교체(줄 분리 또는 `;` 사용, cmd 병기)하고, .ps1과 동일하게 문서 속 인라인 명령도 test-all의 5.1 호환 게이트 대상에 포함. troubleshooting.md에 `&&` 오류 증상 행 추가.
  [BLOCKER/중] 정식 서비스용 배포 키트 부재 — 주소 placeholder, Claude Code 설치 가이드 없음, 관리자 세팅 수동
    설명: README.md:13, quickstart.md:14, overview.html:72 모두 `<사내 저장소 주소>` placeholder이고, 실제 주소가 박힌 배포용 안내문이 저장소 어디에도 없다(비개발자는 placeholder를 그대로 붙여넣는 실수를 흔히 한다). quickstart 0단계는 "Claude Code 설치·로그인 완료 상태여야 합니다" 한 줄뿐으로 설치·로그인·사내 git 자격증명 절차 문서가 없다. purpose.md 과제2가 스스로 인정하듯 "관리자 1회 세팅의 자동화·체크 스크립트는 없음"이며, docs/pilot-onboarding.md는 소수 파일럿용 수동 체크리스트라 수십 명 규모의 반복 배포(신규 입사자, 팀 단위 확산)를 감당할 수 없다.
    권고: ① 실제 사내 주소를 채워 배포하는 '팀원 배포 안내문' 템플릿(메신저 복붙용, publish 안내문과 동일 형식)을 관리자 문서로 승격 ② Claude Code 설치~로그인~자격증명 스크린샷 가이드 1편 ③ 관리자용 환경 점검 스크립트(check-env: claude CLI 버전·Node/Python·npm 레지스트리 접근·마켓플레이스 등록 여부를 한 번에 판정) 추가.
  [MAJOR/소] 신규 솔루션 폴더에서의 최초 `claude` 실행 흐름(신뢰·플러그인 활성화 프롬프트) 미실측·미안내
    설명: quickstart 4단계는 "같은 폴더에서 claude 실행 후 /axfm-guide"로 매끄럽게 이어진다고 약속하지만, scaffold.mjs(3.6절)가 만드는 솔루션 폴더는 설치 폴더와 다른 새 프로젝트 루트이며 .claude/settings.json의 enabledPlugins만 들어 있다. install-readiness DEC-9 스스로 "v2.1.195+ 는 명시 설치 필요"라 적었고, 검증 기록은 '저장소 폴더 vs 무관 폴더' 교차 확인뿐 — 갓 생성된 솔루션 폴더에서 폴더 신뢰 대화상자·플러그인 설치 프롬프트(영문) 없이 스킬이 즉시 뜨는지의 실측 기록이 없다. 비개발자는 예상 못 한 영문 프롬프트에서 '아니오'를 누르거나 이탈한다.
    권고: 생성 직후 솔루션 폴더에서의 첫 claude 실행을 1회 실측해 기록하고, 프롬프트가 뜨면 quickstart·publish 안내문에 "이런 영문 확인창이 뜨면 Yes/Install을 선택하세요" 한 줄(가능하면 화면 캡처)을 추가.
  [MAJOR/소] 작업 폴더 위치 가이드 부재 — 비개발자 기본 위치(바탕화면·문서 = 한글 경로 + OneDrive)와 충돌
    설명: skills/axfm-new/SKILL.md:26은 "경로는 ASCII 권장(한글 경로는 일부 도구에서 문제)"이라 적었고 troubleshooting.md는 ~/.axfm의 OneDrive 리다이렉트 위험을 경고하지만, quickstart·README 어디에도 작업 폴더를 '어디에' 만들라는 안내가 없다. 개발 경험 없는 사무직의 기본 행동은 바탕 화면·문서 폴더(한국어 Windows에서 한글 경로이며 대개 OneDrive 동기화 대상)에 폴더를 만드는 것이다. 이 경우 npm/도구 호환 문제와 OneDrive 절대경로 오염이 첫 사용에서 겹쳐 터지고, 원인을 비개발자가 진단할 수 없다.
    권고: quickstart 0~1단계에 표준 위치 규칙 한 줄 추가(예: "C:\work 처럼 영문·OneDrive 밖 폴더를 만드세요") + /axfm-new 2단계 환경 점검에 대상 경로의 한글/OneDrive 여부 검사와 경고를 명시. troubleshooting에 증상 행 추가.
  [MAJOR/중] 여정 5단계 '팀 공유'가 비개발자에게 실행 불가능 — 사내 git 저장소 생성·자격증명 절차 공백
    설명: skills/axfm-publish/SKILL.md 2단계는 "사내 git 호스팅 주소는 사용자에게 확인"이라며 원격 저장소가 이미 존재한다고 가정하지만, 사내 git에서 저장소를 만들고 권한을 설정하고 push 자격증명을 통과하는 방법을 다루는 문서가 저장소에 없다. 5단계 여정(guide의 published = git 원격 존재)의 마지막 관문이 프레임워크 확산의 핵심 경로인데, 비개발자는 여기서 반드시 사람의 도움이 필요해져 "헬프데스크 없이" 목표가 깨진다. recommended-skills의 commit-commands는 커밋만 해결한다.
    권고: 사내 git 호스팅 기준의 '저장소 만들기 → 주소 복사 → 최초 push' 스크린샷 가이드를 docs에 추가하고 publish 스킬이 이를 참조하도록 연결. 가능하면 조직/토픽 규약(purpose.md 로드맵의 팀 카탈로그)과 함께 저장소 명명 규칙도 이 문서에 선반영.
  [MAJOR/중] 교육 채널이 텍스트 문서 단일 — 터미널을 처음 보는 직원용 시각 자료 부재
    설명: quickstart.md는 "터미널에서:"로 시작하지만 터미널을 여는 법(폴더 우클릭 → '터미널에서 열기'), `<작업 폴더>` 같은 placeholder를 자기 값으로 바꿔야 한다는 관례, 명령 실행 결과가 정상인지의 화면 예시가 전혀 없다. docs/overview.html은 잘 만든 요약이지만 역시 터미널 문해력을 전제한다. 파일럿(관리자 동석)은 이걸 사람이 메우지만, 정식 서비스에서 수십 명이 각자 시작하려면 최소 1개의 스크린샷 기반(또는 짧은 영상) '따라하기' 자료가 필요하다 — purpose.md 과제①의 대상이 바로 이 계층이다.
    권고: quickstart를 스크린샷 포함 HTML(기존 overview.html 형식 재활용)로 1편 제작: 터미널 열기부터 첫 화면 확인까지 실제 화면 캡처로. M3 파일럿에서 막힌 지점 기록을 그대로 캡처 소재로 재사용하면 비용이 낮다.
  [MINOR/소] quickstart의 포트 3001 하드코딩 — 두 번째 솔루션(연동 시나리오 필수)부터 안내와 실제가 어긋남
    설명: docs/quickstart.md:29는 "http://localhost:3001"을 고정 안내하지만 scaffold.mjs findFreePort는 레지스트리 기반으로 3002, 3003…을 배정한다. 파일럿 5단계 연동 시나리오는 두 번째 솔루션 생성을 요구하므로, quickstart를 다시 따라간 사용자는 3001(첫 솔루션)을 열고 "내 새 솔루션이 안 뜬다" 또는 다른 솔루션 화면을 자기 것으로 오인한다 — 비개발자는 이를 구분할 수단이 없다.
    권고: quickstart 문구를 "생성 결과에 표시된 포트(예: 3001)"로 바꾸고, /axfm-new 마무리 출력에 "브라우저에서 열 주소: http://localhost:<port>"를 항상 명시하도록 SKILL.md 4단계에 이미 있는 <port> 안내를 문서와 일치시킴.
  [MINOR/소] "질문 3개" 약속과 실제 상호작용(4~5회) 불일치 + 비개발자에게 영문 슬러그 발명 요구
    설명: quickstart·overview·axfm-new 설명 모두 "질문 3개(종류/설명/이름)"를 약속하지만, skills/axfm-new/SKILL.md는 owner 이름(환경에 없으면 질문)과 id 슬러그 확인(`{owner}-{간단한영문}` 제안 후 확인)을 추가로 요구한다. 특히 '간단한 영문' 슬러그는 비개발자가 즉석에서 만들기 부담스러운 항목이고, 약속(3개)과 실제(최대 5회 응답)의 어긋남은 "프레임워크가 말한 대로 안 된다"는 첫인상을 남긴다.
    권고: 스킬이 이름에서 슬러그를 자동 제안하고 사용자는 '네/다르게' 한 번만 답하게 명문화(현재도 제안-확인이지만 '영문을 지어내라'로 읽히지 않게 예시 3개 자동 제시). 문서 문구는 "질문 3개 + 확인 1번"으로 정직하게 수정.

## LENS: 소프트웨어 아키텍처 연구원 — 과제 ③ (프로토콜 v2 완결성, vendored 모듈 유지비용, 파서 견고성, 레지스트리·봉투 진화, 30~50개 규모 확장)
VERDICT: v2 피벗 이후 '받기(provides)' 방향은 결정적 스크립트와 크로스 스택 E2E로 견고하게 실증됐으나, '보내기(accepts)' 방향은 명세(protocol.md §2의 존재하지 않는 pushData)·스킬(axfm-connect)·라이브러리(writeShared는 자기 폴더에만 씀) 3자가 서로 모순되어 규약만으로는 성립하지 않는 상태다. 이 1건을 해소하면 파일럿 진입에는 충분하지만, 수십 명·30~50개 솔루션 상시 운영에는 레지스트리 수명주기(이동·삭제·유령 항목), 데이터 스키마 진화, 일괄 버전 전파 도구가 없어 초기 운영 중 필연적으로 보강이 필요하다.
STRENGTHS:
  + 위험 단계의 결정적 스크립트화(scaffold/register/sync-modules + 사후검증 내장)가 일관되게 관철됨 — 과거 리뷰 C4 교훈이 구조로 정착 (scripts/scaffold.mjs 사후검증, scripts/lib/registry-io.mjs 규칙 단일화)
  + 크로스 스택 E2E(scripts/test-cross-stack.mjs)가 격리 HOME에서 nextjs↔python 실데이터 왕복을 상시 검증 — ts 'Z' 계급의 결함을 회귀 게이트로 봉인했고 SKIP을 성공으로 위장하지 않음
  + 파일 교환의 기본기(temp+rename 원자적 쓰기, BOM 방어, 손상 비무음화, from 대조)가 두 스택에 대칭 구현되고 protocol.md §8 구현자 체크리스트로 명문화됨
  + 오류 메시지가 전부 행동 지향(다음 행동 1개 안내)으로 설계되어 비개발자 대상 운영 부담을 구조적으로 줄임 (interop.ts/interop.py의 예외 문구)
  + 경계 정직성 — '같은 PC·비실시간' 한계를 README·protocol §9에 명시하고 스킬이 한계를 그대로 안내하도록 규정해 약속-능력 정합을 유지
FINDINGS:
  [BLOCKER/중] accepts(보내기) 방향이 규약·라이브러리·스킬 3자 불일치로 성립하지 않음
    설명: protocol.md:83은 존재하지 않는 함수 `pushData("lunch-pick","feedback",{...})`를 안내한다(v1 잔재 — modules 전체 grep에서 미검출). §5와 skills/axfm-connect/SKILL.md 3단계는 '내가 writeShared로 내보내고 상대가 readShared로 읽는다'고 하는데, writeShared는 발신자 자신의 .axfm/data/에만 쓰고(interop.ts:12-21) readShared는 수신자 자신의 폴더만 읽으므로(interop.ts:24-26) 이 흐름으로는 데이터가 절대 도달하지 않는다. 실제로는 수신자가 readFrom(발신자id, name)을 해야 하는데 그러면 interface.md accepts의 `writes: ".axfm/data/feedback.json"` 선언과 '쌓입니다'(누적) 약속이 거짓이 된다(스냅샷은 name당 1건 덮어쓰기, §9). 다중 발신자가 같은 accepts로 보내는 경우의 충돌 규칙도 없다. 제3 스택 구현자는 protocol.md만으로 보내기 방향을 구현할 수 없고, LLM 글루가 케이스마다 다른 방식을 임기응변으로 만들어 연동 방식이 파편화된다.
    권고: 보내기 방향을 하나로 확정: (a) '수신자가 발신자별 readFrom 폴링' 모델로 확정하고 accepts의 writes 필드·pushData 예시·connect 스킬·recipe 문서를 일괄 정정하거나, (b) writeTo(상대id, name, data) 프리미티브를 양 스택에 추가하고 수신자 폴더에 발신자별 파일(예: .axfm/inbox/<from>--<name>.json)로 저장해 다중 발신자 충돌을 파일명 차원에서 제거. 어느 쪽이든 §8 체크리스트에 반영하고 test-cross-stack에 보내기 방향 E2E를 추가.
  [MAJOR/중] interface.md 프론트매터 문법이 미정의 — 미니 파서의 무음 손상과 구현 간 발산
    설명: protocol.md §2 예시는 YAML flow map(`returns: { menu: string, date: string }`)을 쓰고 templates/nextjs/axfm/interface.md는 따옴표 문자열(`returns: "{ menu: string, date: string }"`)을 쓰는데, 실제 파서(interop.ts:88-107, interop.py:99-130)는 모든 값을 평면 문자열로만 취급한다. 파서는 각 항목의 첫 키가 반드시 `- name:`이어야 하고(아니면 항목 무음 소실), 중첩 블록(예: params: 아래 들여쓴 키)은 값 없는 키 줄을 건너뛴 뒤 하위 키를 현재 함수 항목에 평면 흡수해 계약을 조용히 오염시킨다. /axfm-feature가 LLM으로 이 파일을 갱신하므로 현실적 YAML 변형이 반드시 유입되는데, 경고·검증 게이트가 전혀 없다. §8은 'YAML 부분집합 파서'를 요구하지만 부분집합의 문법을 정의하지 않아 제3 스택(진짜 YAML 라이브러리 사용 시)과 참조 구현이 서로 다른 데이터 구조를 얻는다.
    권고: protocol.md §2에 허용 문법을 명문화(권장: '값은 한 줄 스칼라만, 각 항목 첫 키는 name, 중첩 금지'). 결정적 validate 스크립트(interface.md 파싱 + name 규칙 + source 경로 존재 검사)를 신설해 /axfm-feature·/axfm-qa·/axfm-publish가 호출하게 하고, 제3 스택용 golden fixture(정상/경계/오류 케이스 입력·기대 출력 세트)를 저장소에 포함.
  [MAJOR/중] 레지스트리 수명주기 관리 부재 — 폴더 이동·삭제 시 부패가 누적되고 복구 경로가 오안내
    설명: 솔루션 폴더를 이동/이름변경하면 upsertEntry(scripts/lib/registry-io.mjs:49-53)와 register_self(registry.py:68-72)가 '같은 id·다른 경로'로 등록을 거부하며 'id를 {owner}-{name}으로 바꾸세요'라는 잘못된 처방을 내린다(올바른 처방은 경로 갱신 — 게다가 id 변경은 규약상 금지이고 이웃 커넥터를 파손시킴). 삭제된 솔루션의 유령 항목은 영구 잔존하고, 유령 대상 readFrom은 '아직 내보내지 않았습니다. 상대를 실행하세요'라는 오진 메시지를 낸다(interop.ts:34-35 — 폴더 자체가 없는데 실행하라고 안내). 등록 해제·경로 이전·유령 정리 스크립트가 없고 /axfm-guide 스킬에도 프루닝 절차가 없다. 30~50개 솔루션이 수개월 운영되면 레지스트리 부패는 필연이다. 부수적으로 파일 잠금 없는 read-modify-write라 동시 세션 간 항목 소실 가능(재등록으로 자가치유되나 무음).
    권고: 같은 id 충돌 시 기존 경로의 axfm.json 존재 여부를 확인해 '이동'(기존 경로 사망 → 경로 갱신 허용)과 '진짜 충돌'(양쪽 생존 → id 안내)을 구분. unregister/prune 기능(경로 부재 항목 정리)을 register.mjs 또는 신설 status.mjs에 넣고 /axfm-guide 1단계에 통합. readFrom의 오류 메시지를 '상대 폴더 자체가 없음'과 '스냅샷 미생성'으로 분리.
  [MAJOR/중] vendored 모듈 버전 전파의 운영 비용 — N개 개별 방문 + major 승격 시 flag-day
    설명: 모듈 업데이트는 각 솔루션 폴더에서 /axfm-guide를 열어 sync-modules.mjs를 개별 실행해야만 전파된다(일괄 도구 없음 — status.mjs는 승인 대기). 솔루션 30~50개면 업데이트 1회당 30~50회의 세션 방문이 들고, 방치된 구버전은 드리프트 감지도 그 폴더를 열기 전엔 발동하지 않는다. 프로토콜 major가 '3'으로 오르는 순간 validateEnvelope(types.ts:61-62, types.py:26-30)가 정확 일치를 요구하므로 PC 내 전 솔루션이 재동기화될 때까지 연동이 전면 중단된다(공존 창·이행 규칙 없음). 또한 등록 로직이 scripts/lib/registry-io.mjs와 modules/python/axfm/registry.py에 이중 구현되어 이미 규칙 드리프트가 실재한다(JS는 win32 경로 대소문자 정규화 normPath 수행, Python register_self는 미수행 — install-readiness §4에서 보류로 인정됨). sync-modules의 '삭제 없음' 정책은 향후 모듈 파일 rename 시 구파일 잔존을 낳고, 버전 감지가 '첫 파일 헤더'만 읽어(sync-modules.mjs:54-64) 부분 동기화 상태를 오판할 수 있다.
    권고: 정식 서비스 전제: 레지스트리 순회 일괄 점검·동기화(status.mjs + sync-all 모드)를 v0.3에서 확정 구현. major 승격 시 이행 규칙(수신은 N-1 허용 등)을 §7에 사전 정의. Python register_self를 제거하거나 register.mjs 규칙(경로 정규화 포함)과 단일 소스로 정렬. 모듈 rename 시 잔존물 목록을 sync 보고에 포함.
  [MAJOR/중] 데이터 payload 스키마 진화가 무방비 — sample 변경 = 소비자 무음 파손
    설명: 봉투(§4)에는 프로토콜 major(axfm)만 있고 capability(functions[].name)별 스키마 버전이 없다. 유일한 계약인 interface.md의 sample을 생산자가 /axfm-feature로 바꾸면(필드 rename, 타입 변경) 소비자의 기존 글루 커넥터는 컴파일/실행 오류조차 없이 undefined를 읽거나 오독한다. fn 글루 드리프트는 §5에 주석·재생성 절차로 대응했지만, 더 흔한 data 스냅샷 형태 드리프트에는 어떤 감지·경고 장치도 없다(스냅샷 실데이터와 interface.md sample의 정합 검사 부재). LLM이 글루를 생성하는 구조상 30~50개 규모에서는 '조용히 틀린 데이터'가 최대 장기 리스크다.
    권고: interface.md functions[]에 정수 version 필드를 추가하고 봉투에 선택 필드(예: ver)로 동봉 — 커넥터 생성 시 기대 버전을 기록하고 readFrom 수신 시 불일치면 경고(파괴적 거부는 불필요). 최소 대안: /axfm-qa·validate 스크립트에 '스냅샷 실데이터 최상위 키 vs interface.md sample 키' 대조 검사를 추가.
  [MAJOR/소] id·name 네임스페이스 거버넌스 부재 — 사내 규모에서 충돌·무음 축약이 필연
    설명: ① id: {owner}-{name} 권장이 스캐폴더에서 강제되지 않아(scaffold.mjs:98은 형식만 검사) 'dashboard' 같은 일반명 id가 팀 간 충돌한다. 충돌 시 처방이 'id 변경'인데 규약은 'id 생성 후 변경 금지'(protocol.md §1)이고, 변경하면 이웃들의 connectors/<상대id>.*가 하드코딩한 id 참조가 전부 파손된다 — 마이그레이션 절차 부재. 팀 카탈로그(누가 어떤 id를 썼나)는 로드맵으로만 존재. ② name: sanitizeName(types.ts:70-72, types.py:41-44)이 비허용 문자를 무음 제거해 한글 데이터명은 전부 'unknown.json'으로 수렴한다 — 비개발자가 write_shared("주간보고",...)를 만들면 서로 다른 두 한글 이름이 같은 파일을 덮어쓰고, readFrom은 봉투의 name과 요청 name을 대조하지 않아(from만 대조, interop.ts:36-37) 잘못된 데이터를 정상 반환한다.
    권고: scaffold에서 owner prefix를 기본 강제(미포함 시 자동 부착 제안). id 변경이 불가피할 때의 이웃 커넥터 마이그레이션 절차를 protocol §6에 문서화. sanitizeName은 '축약 후 원본과 다르면 거부(행동형 오류)'로 변경하고 §8에 strip이 아닌 reject 규칙으로 명문화, readFrom에 env.name 대조 1줄 추가.
  [MINOR/소] §8 '이 문서만으로 제3 스택 구현' 주장의 잔여 암묵지와 명세-구현 자기 불일치
    설명: 과거 리뷰 H9로 §8 체크리스트가 신설됐지만 잔여 암묵지가 남아 있다: sanitizeName의 정확한 알고리즘(strip vs reject, 64자 절단)·registry solutions 외 필드 처리·interface 필드 기본값 해석이 코드에만 있고, 검증 수단(golden fixture·conformance 러너)이 없어 '문서만으로 구현 가능'이 여전히 미검증 주장이다. 또한 §8-6은 '레지스트리 등록/갱신'을 모든 스택 모듈의 필수로 요구하는데 참조 구현인 nextjs 모듈 자체가 이를 구현하지 않는다(registry.ts는 읽기 전용 — 등록은 플러그인 스크립트 의존이라 플러그인 없는 PC에서 clone된 nextjs 솔루션은 자가 등록 경로가 없음, python은 register_self 보유로 비대칭).
    권고: §8에 sanitize·절단·거부 규칙을 의사코드로 명시하고, C# 목업 검증 대신 스택 불문 conformance fixture 디렉터리(입력 interface.md/봉투/레지스트리 → 기대 출력 JSON)를 제공. §8-6의 요구 수준을 실제와 정합시키거나(스크립트 위임 허용 명시) nextjs 모듈에 registerSelf를 추가.
  [MINOR/소] 레지스트리 항목에 모듈 버전 부재 — purpose.md의 관리(과제 ⑤) 주장과 불일치, status.mjs 선행 조건
    설명: purpose.md 과제 5는 '로컬 레지스트리(이 PC의 솔루션 목록·경로·버전)'라고 커버를 주장하지만 RegistryEntry(types.ts:29-35, protocol.md §6)에는 버전 필드가 없다 — 모듈 버전은 각 프로젝트 파일 헤더에만 있어, 승인 대기 중인 status.mjs(전체 현황판)는 매번 전 프로젝트 폴더를 순회·파싱해야 하고 폴더가 죽은 항목에선 판단 불가다. 또한 scaffold.mjs:107·116이 기록하는 port 필드는 v1(서버) 잔재로 §6 스키마에 없는 비공식 필드다(findFreePort 참고용이라지만 명세 밖 필드가 스크립트 간 암묵 계약으로 존재).
    권고: RegistryEntry에 moduleVersion(등록·sync 시 갱신)을 정식 필드로 추가해 status.mjs가 순회 없이 드리프트 일람을 만들 수 있게 하고, port는 §6에 선택 필드로 명문화하거나 제거해 명세와 실파일을 일치시킨다.

## LENS: 보안·데이터 거버넌스 (유출 경로 · publish 실효성 · 레지스트리/경로 조작 · 공급망 · 생성 코드 보안)
VERDICT: v2 서버리스 전환으로 네트워크 공격면(무인증 API·CSRF·DNS rebinding)이 구조적으로 제거됐고 .axfm/ git 커밋 금지·원자적 레지스트리 쓰기 등 과거 리뷰 지적이 코드로 반영된 점은 견고하다. 그러나 "수십 명 상시 사용" 기준에서는 코드 결함보다 거버넌스 공백이 크다: 스냅샷 데이터 분류 정책 부재, 유출 방지의 유일한 관문(publish)이 전부 수동 LLM 체크(게다가 Python 템플릿은 .env 조차 gitignore 미포함), 플러그인 저장소 자체의 변경 통제 부재 — 이 3가지는 사내 정보보호 심사를 통과하지 못할 blocker다. 다행히 대부분 소~중 규모의 스크립트/문서/프로세스 보완으로 해소 가능하며 아키텍처 재설계는 불필요하다.
STRENGTHS:
  + 서버 없음(v2) 결정으로 무인증 HTTP·CSRF·DNS rebinding 등 과거 Critical(C2) 계열 위협이 코드가 아니라 구조로 제거됨 — docs/protocol.md §0·§9
  + 업무 데이터 유출 1차 방어선이 문서가 아닌 강제 장치로 존재: 템플릿 .gitignore 의 .axfm/ 제외 + protocol §9 커밋 금지 규약 + publish 스킬의 git status 재확인 (2026-07-02 리뷰 지적 반영 확인)
  + 위험 단계의 결정적 스크립트화(scaffold/register/sync-modules + registry-io.mjs 원자적 쓰기·BOM 금지·id 충돌 거부)가 LLM 비결정성에 의한 레지스트리 오염·파손을 크게 줄임
  + 사고성 오염 감지가 코드로 구현됨: readFrom 의 봉투 from↔요청 id 대조(modules/nextjs/lib/axfm/interop.ts L36-38, interop.py 동일), 레지스트리 손상 시 무음 빈 목록 대신 명시적 오류, sanitizeName 경로 탈출 방지 양 스택 일관
  + .axfm/data 는 name 당 최신 1건 덮어쓰기(protocol §9) — 데이터 최소화가 기본값이라 유출 시 노출 범위가 제한됨
FINDINGS:
  [BLOCKER/소] 공유(publish) 단계의 유출 방지가 전부 수동 — Python 템플릿은 .env 조차 gitignore 에 없음
    설명: templates/python/.gitignore 에 .env* 패턴이 없다(nextjs 에는 있음). Python 솔루션 사용자가 토큰을 .env 에 넣고 /axfm-publish 로 사내 git 에 올리면 그대로 커밋된다. 또한 skills/axfm-publish/SKILL.md 의 비밀값·.axfm 점검(1·2단계)은 전부 LLM 의 자율 체크리스트로, 결정적 도구가 없다 — 이 프로젝트 스스로 확립한 원칙 "위험한 단계는 결정적 스크립트로"(v2 피벗 교훈, install-readiness 문서)와 정면 모순이다. 유출 리스크가 가장 큰 단계(사내 git 공개)만 비결정적 수행에 남아 있다.
    권고: ① templates/python/.gitignore 에 .env* 추가(즉시). ② scripts/publish-check.mjs 신설: git 스테이징에 .axfm/·.env·인증서 파일 존재 검사 + 커밋 대상 텍스트에 대한 기본 비밀 패턴 스캔(API key·password= 정규식) 을 결정적으로 수행하고, axfm-publish 스킬은 이 스크립트 통과를 전제 조건으로만 진행하게 수정. ③ 기존 배포된 솔루션에는 sync-modules 류 경로로 .gitignore 보정 안내.
  [BLOCKER/중] 스냅샷(.axfm/data) 데이터 분류·개인정보 취급 정책이 어디에도 없음
    설명: envelope(protocol §4)에 데이터 등급 개념이 없고, 스킬 9종·CLAUDE.md.template 전체에서 개인정보/민감정보 언급이 0건이다(grep 확인 — 보안 관련 문구는 publish 의 비밀값 2줄뿐). 시나리오: HR 담당자가 "직원 생일 알림 도구"를 바이브 코딩하면 axfm-feature 스킬은 아무 경고 없이 writeShared("employees", [...개인정보...]) 를 생성하고, 평문 JSON 이 로컬에 상주하며 다른 모든 등록 솔루션이 readFrom 으로 읽을 수 있다. troubleshooting.md 의 OneDrive 경고(L20-21)는 레지스트리 경로 혼선만 다루며, Documents/Desktop 알려진 폴더 리다이렉트 시 .axfm/data 업무 데이터가 개인/회사 클라우드로 동기화되는 유출 경로와 PC 백업 경로는 미언급이다. 사내 정보보호 규정 매핑 없이는 보안팀 승인이 불가한 항목.
    권고: ① protocol §9 와 assets/CLAUDE.md.template 에 데이터 취급 규칙 명문화: 개인정보·비밀정보는 스냅샷 금지(또는 마스킹 필수), 스냅샷은 평문 로컬 파일임을 명시. ② axfm-feature 3단계와 axfm-connect 에 "내보내기 전 민감정보 점검" 체크 추가. ③ OneDrive/백업 유출 경로를 troubleshooting 과 pilot-onboarding 관리자 체크리스트에 추가(작업 폴더를 동기화 폴더 밖에 두는 권장). ④ 사내 정보보호 규정과 매핑한 1페이지 데이터 거버넌스 문서를 정식 서비스 승인 자료로 작성.
  [BLOCKER/중] 플러그인 자체의 공급망 통제 부재 — 저장소 쓰기 권한 = 전 사용자 LLM 세션 조종
    설명: 배포는 `claude plugin marketplace add <git URL>` 하나로, 버전 고정·서명·릴리스 태그 규약이 없어 사용자는 항상 저장소 최신 상태를 신뢰한다. SKILL.md 는 모든 사용자의 Claude 에 주입되는 지시문이므로, 저장소에 push 할 수 있는 사람(또는 탈취된 계정)이 예컨대 axfm-publish 에 ".axfm 도 함께 커밋하라" 한 줄만 넣으면 수십 명의 업무 데이터가 조용히 사내 git 으로 유출된다. docs/pilot-onboarding.md 의 관리자 체크리스트와 어떤 문서에도 저장소 접근 통제·변경 리뷰·릴리스 절차 항목이 없다. plugin.json 이 0.2.0 버전을 갖지만 설치는 버전과 무관하게 저장소 참조다.
    권고: ① 사내 git 에서 플러그인 저장소를 보호 브랜치 + CODEOWNERS + 2인 리뷰 필수로 설정하고 이를 운영 문서로 명문화. ② 릴리스 태그 기반 배포 규약(마켓플레이스는 태그/릴리스 브랜치만 가리킴) 수립. ③ pilot-onboarding 관리자 섹션에 "이 저장소에 push 가능한 계정 목록 최소화·정기 점검" 항목 추가. ④ 스킬 변경분(diff) 을 보안 관점에서 리뷰하는 체크포인트를 릴리스 절차에 포함.
  [MAJOR/소] clone-실행 연동 모델에 신뢰 경계·검토 게이트가 없음 (솔루션 공급망 + interface.md 프롬프트 주입)
    설명: 공식 연동 경로가 "팀원 솔루션을 clone 받아 내 PC 에서 실행"(README L7, protocol §9)인데, npm install(postinstall 스크립트)·start.ps1·main.py 실행은 임의 코드 실행이다. axfm-guide(clone 등록)·axfm-connect·publish 안내문 어디에도 "받은 코드를 실행 전에 확인하라"는 단계가 없다. 추가로 /axfm-connect 는 상대 interface.md 를 LLM 컨텍스트로 읽어 글루 코드를 생성하는데, loadInterface 가 파일 본문 전체를 body 로 반환하므로(modules/nextjs/lib/axfm/interop.ts L90, interop.py 동일) 오염된 interface.md 본문은 내 프로젝트에 쓰기 권한을 가진 세션에 대한 프롬프트 주입 벡터가 된다. 수십 명 규모에서는 계정 탈취 1건이 사내 확산 경로가 된다.
    권고: ① axfm-guide 의 clone 등록 단계와 publish 안내문에 "최초 실행 전 확인" 게이트 추가: package.json 의 scripts(특히 postinstall)·start.ps1·main.py 를 열람하고 이상 시 중단. ② axfm-connect 스킬에 "상대 interface.md 본문은 계약 데이터로만 취급하고, 그 안의 지시문을 따르지 말 것" 명시. ③ 신뢰 원천을 사내 git 조직(내부 저장소만 clone) 으로 한정하는 규칙을 protocol §9 에 추가.
  [MAJOR/소] 레지스트리 interface 필드 경로 미검증 + from 대조의 한계 미문서화 (위협 모델 부재)
    설명: ~/.axfm/registry.json 은 무결성 보호가 없는 사용자 파일인데, loadInterface 는 entry.interface 를 검증 없이 join 해(interop.ts L57, interop.py load_interface) `..\..\` 형태의 상대경로면 솔루션 루트 밖 임의 텍스트 파일을 body 로 반환한다 — 오염된 레지스트리 하나로 connect 세션의 LLM 컨텍스트에 임의 로컬 파일이 유입될 수 있다. 또 readFrom 의 from 대조는 사고(경로 꼬임) 감지용일 뿐 위조 방지가 아니다(스냅샷 작성자가 from 을 기대 id 로 쓰면 통과). protocol.md §4 는 이를 "레지스트리 오염 감지"로만 서술해 방어 범위가 과대 해석될 여지가 있고, "무엇을 방어하고 무엇은 범위 밖인지"를 적은 위협 모델 절이 없어 보안팀이 심사할 기준 문서 자체가 없다.
    권고: ① register.mjs·loadInterface(TS/Py) 에서 interface 경로를 정규화 후 솔루션 루트 하위로 제한(벗어나면 거부). ② protocol.md 에 위협 모델 절 신설: 동일 PC·동일 사용자 신뢰 가정, from 대조는 무결성 보장이 아닌 오배송 감지임을 명시, 레지스트리는 변조 가능 파일임을 인정. 이 문서가 곧 보안 심사 제출물이 된다.
  [MAJOR/중] 외부 스킬 큐레이션이 승인 절차 없이 외부 마켓·GitHub 직접 설치를 안내
    설명: docs/recommended-skills.md 와 axfm-toolbox 스킬이 `npx skills add vercel-labs/agent-skills`(외부 GitHub fetch), claude-plugins-official 등 외부 소스 설치를 비개발자에게 권장한다. 문서 스스로 "슬러그가 바뀔 수 있음"(스쿼팅 위험)을 인정하면서 통제는 "Discover 탭에서 이름 확인" 수준이고, 재검증은 "분기 1회 권장" 문구뿐 소유자·절차가 없다. 설치된 외부 스킬 역시 LLM 지시문이므로 검증되지 않은 외부 지시문이 업무 데이터가 있는 세션에 주입된다. 사내 소프트웨어 도입 심사 규정이 있는 조직이라면 이 문서 자체가 미승인 소프트웨어 설치 유도로 지적된다.
    권고: ① 정식 서비스 시점에는 사내 승인 플러그인 allowlist 로 전환하고 심사 기준(요구 권한·네트워크 접근·유지보수 상태)과 재검증 주기의 담당자를 명시. ② axfm-toolbox 에 "승인 목록 밖 플러그인은 보안팀 확인 후 설치" 규칙 추가. ③ `npx skills add` 처럼 외부 저장소를 직접 당겨오는 항목은 사내 미러 경유로 대체 검토.
  [MINOR/소] Next.js 템플릿에 lockfile 부재 — 의존성 트리 재현·감사 불가
    설명: templates/nextjs/package.json 이 캐럿 범위(^15.3.0 등)만 갖고 package-lock.json 이 템플릿에 없어, 사용자마다·시점마다 npm install 결과가 달라진다. 수십 명이 각자 설치하면 배포된 의존성 트리를 아무도 알 수 없어 취약점 공지 대응(예: next 특정 버전 취약점) 시 영향 파악이 불가능하고, 사내 레지스트리/미러 정책과도 결합이 어렵다.
    권고: 검증된 package-lock.json 을 템플릿에 포함해 scaffold 가 함께 복사하고(D8 빌드 실증 시점의 lockfile 사용), 릴리스 수동 게이트에서 lockfile 갱신을 함께 수행. 사내 레지스트리 확정 시 .npmrc 표준화와 함께 관리.
  [MINOR/소] ExecutionPolicy Bypass 를 표준 해법으로 안내
    설명: templates/python/start.ps1 헤더 주석, docs/troubleshooting.md L9, axfm-debug 스킬 2단계가 모두 `powershell -ExecutionPolicy Bypass` 를 비개발자에게 1차 우회책으로 가르친다. 실행 정책이 조직 GPO 로 관리되는 환경이라면 정책 우회 습관화는 보안팀 지적 사항이며, 우회가 왜 필요한지·언제 쓰면 안 되는지 설명이 없다.
    권고: start.cmd 를 1순위 안내로 통일하고 Bypass 는 최후 수단으로 강등 + "조직 정책으로 막혀 있으면 관리자 문의" 문구 추가. 정식 서비스 시 사내 코드서명 인증서로 start.ps1 서명 배포를 검토(관리자 1회 세팅 항목).

## LENS: 플랫폼 운영·배포 (과제 ⑤ — 배포 채널, 업데이트 전파, 드리프트 관리, 지원 프로세스, 계측, CI, 백업·복구)
VERDICT: 기술 코어(결정적 스크립트 3종, 원자적 레지스트리 IO, 실데이터 왕복 회귀 게이트)는 파일럿 수준으로 탄탄하지만, "운영 주체가 있는 정식 서비스"의 실체 — 표준 배포 원격·릴리스 규칙, 업데이트 전파 경로, 문의 대응 주체, 사용 현황 계측 — 는 사실상 전부 부재하다. 현재는 '잘 만들어진 로컬 프로토타입 + 배포 모델 선언' 단계이며, 남은 작업의 무게중심은 코드가 아니라 운영 체계 구축이다. blocker 3건(배포 채널, 업데이트 전파, 운영 주체)은 대부분 문서·규약 수준의 저비용 작업이라 승격 전 해소가 충분히 현실적이다.
STRENGTHS:
  + 위험 단계(생성·등록·재동기화)를 결정적 스크립트로 강제하고 스킬은 호출만 하게 한 구조 — 수십 명 운영 시 지원 비용을 줄이는 올바른 설계 (scripts/scaffold.mjs, register.mjs, sync-modules.mjs, 각 스킬의 "직접 편집 금지" 규칙)
  + 레지스트리 손상 시나리오가 규약(protocol.md §6)과 구현(scripts/lib/registry-io.mjs: temp+rename, BOM 방어, id 충돌 거부, 손상 무음 처리 금지)에서 일치함
  + 자동 회귀 게이트의 폭 — 크로스 스택 실데이터 왕복 E2E, PowerShell 5.1 파서 검사, 디자인 토큰 검증까지 test-all.mjs 한 번으로 실행 가능
  + 과거 리뷰(2026-07-02) → 설계서(2026-07-03) → 실증 기록으로 이어지는 자기교정 이력이 문서로 남아 있어 운영 이관 시 맥락 손실이 적음
  + troubleshooting 증상표·pilot-onboarding 체크리스트 등 지원 문서의 골격이 이미 존재하고, 막힘 사례를 문서에 환류하는 절차가 파일럿 범위에서는 정의됨
FINDINGS:
  [BLOCKER/소] 배포 채널이 실존하지 않음 — git 원격·태그·CHANGELOG·릴리스 절차 전무
    설명: 저장소에 원격이 없고(git remote 결과 0건), 태그 0개, 브랜치 main 하나(커밋 5개), CHANGELOG 부재. README.md:13은 설치 1행을 "<이 저장소 git URL 또는 로컬 경로>"로 안내하지만 표준 URL이 확정되지 않았고, 로컬 경로 설치를 허용하면 PC마다 다른 스냅샷에서 포크되어 업데이트 의미론이 무너진다. 버전 변경 이력은 설계 문서(docs/design/*.md)에만 산재하고, 사용자용 변경 요약이 없다. 시나리오: 운영자가 v0.3.0을 만들어도 배포할 곳이 없고, 사용자는 무엇이 바뀌었는지 알 방법이 없다.
    권고: 사내 git 원격을 단일 표준 주소로 확정하고 README·publish 안내문의 플레이스홀더를 실제 주소로 교체. 릴리스마다 태그(v0.2.0 소급) + CHANGELOG.md(사용자용 한 줄 요약) 의무화, main 직접 push 금지 등 최소 브랜치 규칙과 릴리스 절차(버전 3축 갱신 → test-all → plugin validate → 수동 빌드 게이트 → 태그) 문서를 docs/에 신설. 로컬 경로 설치는 "플러그인 개발용"으로만 명시.
  [BLOCKER/중] 업데이트 전파 체계 부재 — 사용자가 update를 안 하면(그리고 방법을 모르면) 영원히 구버전
    설명: 전파는 2단계(① 플러그인 자체 업데이트 per 폴더/PC ② sync-modules per 솔루션)인데 두 단계 모두 강제 장치도, 안내조차도 없다. 저장소 전체에서 `claude plugin marketplace update`나 플러그인 업데이트 명령 언급 0건(grep 확인) — troubleshooting.md:18은 "플러그인 업데이트 후" 드리프트만 다루고 업데이트 방법은 어디에도 없다. 더구나 /axfm-guide의 드리프트 감지(skills/axfm-guide/SKILL.md 1단계)는 로컬 플러그인의 modules/VERSION과 비교하므로, 플러그인 자체가 구버전이면 드리프트가 "없음"으로 나온다(둘 다 구버전). 시나리오: 봉투 파싱 버그 픽스를 배포해도 수십 명 중 아무도 받지 못하고, 운영자는 누가 구버전인지도 모른다.
    권고: ① quickstart·troubleshooting에 업데이트 절차(marketplace update → plugin update → 각 솔루션에서 /axfm-guide 재동기화) 명시. ② /axfm-guide 1단계에 "플러그인 자체 최신 여부" 점검 추가(사내 git 원격의 modules/VERSION 또는 태그 대조 — 실패 시 무시). ③ 릴리스 공지 채널(사내 메신저) 규약을 릴리스 절차에 포함. ④ 레지스트리 엔트리에 모듈 버전 필드를 추가해 PC 단위 구버전 파악의 기초를 마련.
  [BLOCKER/소] 운영 주체·문의 대응 프로세스 부재 — 정식 서비스의 정의 자체가 미충족
    설명: plugin.json author는 "Hansol AXFM Team"으로 연락처가 없고, 문의 채널·이슈 접수처·대응 책임자가 어느 문서에도 없다. troubleshooting.md의 최종 에스컬레이션은 "/axfm-debug 에게 보여주세요"(AI)로 끝난다. 막힘 사례 환류 절차(docs/reviews 기록 → troubleshooting 반영)는 pilot-onboarding.md에 파일럿 한정으로만 정의됨. 시나리오: 파일럿 이후 어떤 팀원이 레지스트리 손상+모듈 드리프트가 겹친 문제를 만나면, AI 진단이 실패했을 때 갈 곳이 없고 사례는 어디에도 축적되지 않는다.
    권고: 운영 담당자(백업 포함)를 지정하고 plugin.json·README에 문의 채널(사내 메신저 방 또는 사내 git issues) 명시. "AI 진단 실패 → 채널 접수 → troubleshooting/스킬 반영 → 릴리스" 환류 루프를 파일럿 한정이 아닌 상설 절차로 문서화. 접수 시 필수 첨부(에러 전문, axfm.json, 모듈 버전) 양식 1장 추가.
  [MAJOR/중] vendored 드리프트 관리 공백 — 템플릿 소생 파일은 전파 경로가 없고, troubleshooting이 이행 불가한 해결책을 약속
    설명: sync-modules.mjs는 modules/<type>/ 파일만 복사하는데, v2.0.1의 핵심 수정인 start.ps1 PS5.1 호환은 templates/python/start.ps1에 있다. 따라서 troubleshooting.md:10의 "/axfm-guide 로 모듈·스크립트 재동기화 (v2.0.1에서 수정됨)" 약속은 결정적 스크립트로는 이행 불가 — v2.0.0으로 만든 솔루션이 재동기화해도 start.ps1은 깨진 채 남고, 이후 드리프트 감지는 "최신"이라 보고한다(모듈 헤더는 2.0.1이 됐으므로). 부수 문제: sync는 삭제를 안 하므로 향후 모듈 파일 개명 시 구파일이 잔존해 사용자 코드가 계속 import 가능하고, 로컬 __pycache__/*.pyc(추적 제외지만 작업트리에 존재)까지 walk에 포함되어 솔루션으로 복사된다.
    권고: start.ps1·start.cmd 같은 부트스트랩 파일을 modules/python/으로 이동하거나 sync-modules에 "프레임워크 소유 템플릿 파일 목록"을 추가해 전파 대상에 포함. walk에서 __pycache__ 제외. troubleshooting.md:10 문구를 실제 능력에 맞게 수정(재동기화 범위 명시). 모듈 파일 개명 시 잔존 파일 처리 규칙(manifest 기반 정리 목록)을 sync에 추가.
  [MAJOR/중] 모듈 업데이트 롤백 수단 부재 — 잘못된 릴리스 1번이 수십 솔루션을 비가역적으로 파손 가능
    설명: scaffold.mjs는 git init을 하지 않고(git은 /axfm-publish 5단계에서야 등장), sync-modules.mjs는 덮어쓰기 전 백업이 없다. 즉 publish 이전 솔루션(파일럿 초기의 대부분)에서 모듈 재동기화는 비가역 작업이다. 시나리오: 회귀가 섞인 modules 2.1.0을 배포 → 수십 명이 /axfm-guide 안내대로 재동기화 → 전 솔루션 동시 파손, 이전 버전으로 되돌릴 방법이 없음(플러그인은 최신만 배포, 버전 고정 설치 규약 없음).
    권고: ① scaffold 마지막 단계에 git init + 초기 커밋 추가(롤백 지점 상시 확보 — publish 단계도 단순해짐). ② sync-modules에 덮어쓰기 전 대상 파일을 .axfm/backup/<from버전>/ 에 보존하고 --rollback 옵션 제공. ③ 릴리스 절차에 "구버전 태그로 재설치하는 긴급 절차"를 명시.
  [MAJOR/중] 지속적 검증의 주체·시점 미정 — CI 부재, 릴리스 게이트는 관행에 의존
    설명: test-all.mjs(PS5.1 파서 검사, 크로스 스택 E2E 포함)는 훌륭하지만 실행 주체·시점 규정이 없고 CI 설정(.github/workflows 등)도, git hook도 없다. Next.js 빌드 실증은 "릴리스 수동 게이트"로 문서화됐을 뿐(docs/design/2026-07-03-install-readiness.md D8) 체크리스트로 강제되지 않는다. ps1 파서 검사는 win32 한정이라 CI 러너도 Windows여야 한다. 시나리오: 운영자가 바뀌거나 급한 핫픽스를 내는 날, test-all을 건너뛴 커밋이 그대로 수십 명의 marketplace update 대상이 된다.
    권고: 사내 CI(Windows 러너)에서 push/태그 시 test-all + claude plugin validate 자동 실행. CI 도입 전 과도기에는 릴리스 절차 문서에 "test-all 출력 첨부 의무" + pre-push 훅이라도 배치. 수동 게이트(next build)는 태그 릴리스 시에만 요구되는 체크박스로 명문화.
  [MAJOR/중] 사용 현황 계측 0 — 운영자가 보급률·막힘 지점을 알 수단이 없음
    설명: 레지스트리는 PC 로컬(~/.axfm/registry.json)이라 운영자는 설치 PC 수, 생성 솔루션 수, 모듈 버전 분포, 막힘 빈도를 전혀 알 수 없다. purpose.md 과제 5가 이 갭을 자인하며 status.mjs(PC 단위 일람)는 승인 대기, 팀 카탈로그는 로드맵이다. 시나리오: 스킬 9종 축소 판단(로드맵 1순위)도, 구버전 방치 솔루션 파악(finding 2)도 데이터 없이는 불가능 — "파일럿 실측 후 재검토"라는 확정 결정 자체가 계측 수단을 전제로 한다.
    권고: ① status.mjs(레지스트리 순회 일람: id·경로·모듈 버전·스냅샷 신선도)를 우선 구현 — finding 2·4의 진단 도구를 겸함. ② /axfm-publish 규약에 사내 git 조직/토픽(예: topic=axfm) 부여를 추가해 운영자가 조직 스캔만으로 팀 카탈로그를 집계 가능하게. ③ 문의 접수 양식에 status.mjs 출력 첨부를 포함해 막힘 데이터가 자동 축적되게.
  [MINOR/소] 레지스트리 재구축·PC 이관 시나리오 공백
    설명: 레지스트리 파손 복구는 "파일 삭제 후 각 솔루션에서 /axfm-guide 재실행"(troubleshooting.md:15)인데, 사용자가 자기 솔루션 폴더 위치를 전부 기억해야 성립한다 — 디스크 스캔 재구축 도구가 없다. PC 교체·이관(사내 PC 교체 주기는 일상) 절차는 어느 문서에도 없다: 솔루션 폴더 복사 후 레지스트리의 절대경로(protocol.md §6 예시처럼 path가 절대경로)는 전부 무효가 되고, 솔루션 개수만큼 수동 재등록이 필요하다. OneDrive 경고(troubleshooting.md:21)만 존재.
    권고: 지정 루트를 스캔해 axfm.json을 찾아 일괄 register하는 rebuild 스크립트(register.mjs 재사용, 비용 낮음)를 추가하고, troubleshooting에 "PC 교체 시: 폴더 복사 → rebuild 1회" 절차를 문서화. 레지스트리 쓰기 시 직전 파일을 registry.json.bak로 1세대 보존.

## LENS: 제품·서비스화 연구원 — 파일럿 설계·KPI·교육/확산·지원 채널·정식 서비스 요건
VERDICT: v0.2.0은 기술 성립(설치→생성→연동의 자동 검증)을 실증한 "파일럿 착수 준비 완료" 상태이지, 정식 서비스 준비 상태는 아니다. 파일럿 계획이 최초 10분 온보딩 실측에만 국한되어 표본 수·지속 사용·업무 가치를 측정하지 못하고, 서버 없음 구조에서 KPI를 수집할 대체 경로·지원 채널·업데이트 배포 거버넌스·정식 선언 요건이 전부 미설계다. purpose.md 로드맵은 기능 로드맵으로는 타당하나(파일럿 실측 1순위, status.mjs 2순위 적절) 서비스 전환에 필요한 운영 항목이 로드맵에 아예 없어, 파일럿을 "온보딩 실측"에서 "서비스 전환 실험"으로 재설계하는 것이 최우선 과제다.
STRENGTHS:
  + 온보딩 전 구간의 기술 리스크가 자동 검증으로 실증됨 — scripts/test-all.mjs가 크로스 스택 E2E(nextjs↔python)·PowerShell 5.1 파서 검사·python 단위 테스트를 상시 게이트로 돌리고, Next.js 빌드는 docs/design/2026-07-03-install-readiness.md §5에 수동 실증 기록까지 남김
  + 과거 리뷰(docs/reviews/2026-07-02-critical-review.md)의 Critical/High를 v2 피벗과 v0.2.0에서 체계적으로 해소하고 DEC-1~9로 결정 근거를 문서화 — 의사결정 추적성이 서비스 운영 문화의 좋은 기반
  + docs/overview.html이 자사 디자인 표준 v1.0 토큰을 그대로 준수하며 설치→스킬 9종→연동→팀 공유→막힘 대응까지 단일 문서로 커버 — 교육자료의 뼈대로 손색 없음
  + 파일럿 피드백 루프가 절차에 내장됨 — pilot-onboarding.md가 막힌 지점을 docs/reviews/ 기록→troubleshooting 반영→재실측으로 연결하는 개선 사이클을 명시
  + purpose.md가 5대 과제 대비 커버리지와 갭(과제2 관리자 세팅 자동화 부재, 과제5 전체 현황판 부재)을 자기 인식적으로 관리 — 목적-기능 정렬이 명확
FINDINGS:
  [BLOCKER/소] "정식 서비스 선언" 요건 미정의 + 파일럿 통과 기준이 사실상 실패 불가능한 동어반복
    설명: pilot-onboarding.md 판정(29~31행)은 "통과: 막힘 0건, 또는 발견된 막힘이 전부 troubleshooting.md에 반영됨" — 어떤 막힘이 나와도 문서에 반영만 하면 통과이므로 게이트로 기능하지 못한다. 10분 초과 시 판정 규칙도 없다(기록만 요구). purpose.md 로드맵 어디에도 "무엇이 갖춰지면 정식 서비스인가"(정량 기준 + 운영 요건)가 정의돼 있지 않아, 파일럿이 끝나도 승격 여부를 판단할 근거가 없다.
    권고: GA 게이트 문서 신설: ① 파일럿 정량 기준(예: 참가자 N명 중 80% 이상 무개입 완주, 소요 시간 중위값 ≤10분, 개입 건수 상한) ② 운영 요건(지원 채널 지정, 담당자, 릴리스 절차, canonical 저장소 확정) ③ 미충족 시 재파일럿 조건. pilot-onboarding.md의 판정 절을 이 기준으로 교체.
  [BLOCKER/중] 파일럿 설계가 최초 10분 온보딩에만 국한 — 표본·지속 사용·업무 가치·clone 시나리오 미측정
    설명: pilot-onboarding.md에 참가자 수·팀 수·비개발자 비율이 미정이고, 기록 항목이 단계별 소요/막힌 지점/개입 여부뿐이다. 2주 후에도 계속 쓰는지(생존율), 데모(today-menu/daily-report)를 넘어 실제 업무 솔루션을 만들었는지, 만족도·재사용 의향이 전혀 측정되지 않는다. 또 5단계 "연동(2인)"은 같은 PC에 두 번째 솔루션을 만드는 방식인데, 실사용 팀 시나리오는 팀원 솔루션 clone→register.mjs 등록→연동(README.md 7행, protocol.md §9)이라 publish→clone 트랙이 무실측으로 남는다 — 정작 서비스 가치의 핵심 경로가 파일럿 밖에 있다.
    권고: 파일럿 설계 보강: 최소 표본 확정(비개발자 5명 포함 8~10명, 2개 팀 이상), 실측 시나리오에 "팀원 솔루션 clone 후 연동" 단계 추가, 2주 추적 항목(생존율, 데모 외 실업무 솔루션 1개 완성, 5점 만족도) 신설. 스킬 9→? 축소 판단(DEC-7)도 이 데이터에 걸려 있으므로 스킬별 사용 빈도 기록 포함.
  [BLOCKER/중] KPI 데이터 소스 부재 — 도입률·생존율·연동 수를 알 방법이 없음 (서버 없음 결정의 관리 리스크)
    설명: 레지스트리는 ~/.axfm/registry.json(각 PC 로컬, scripts/lib/registry-io.mjs), progress.json도 솔루션 폴더 로컬이라 관리자가 볼 수 있는 사용 데이터가 0이다. purpose.md 과제5가 "전체 현황을 한눈에 보는 수단이 없다"고 자인하지만, 계획된 status.mjs조차 "이 PC" 범위 + 오너 승인 대기 상태다. 수십 명 상시 사용 시 도입률(설치 PC 수), 활성도, 연동 수(connectors/ 파일 수)를 집계할 경로가 없어 정식 서비스 판단도, 운영 중 이상 감지(버전 파편화·방치 솔루션)도 불가능하다.
    권고: 서버 없음 결정과 양립하는 최소 수집 설계: ① KPI 정의서(도입률=설치 PC/대상 인원, 생존율=D14 활성 솔루션, 연동 수=connectors 파일 수) ② status.mjs를 KPI 출력 포맷으로 확장하고 파일럿 참가자가 주 1회 결과를 제출(수동) ③ 확산 단계에선 사내 git 조직/토픽 스캔 스크립트로 카탈로그·집계 자동화.
  [BLOCKER/소] 사람 지원 채널·운영 주체 미정의 — 에스컬레이션의 끝이 AI 스킬
    설명: troubleshooting.md의 최종 안내가 "/axfm-debug에게 보여주세요"(24행)이고, OneDrive 이슈는 "관리자와 상의하세요"(21행)라고 하지만 그 관리자가 누구인지 어디에도 없다. plugin.json author는 "Hansol AXFM Team"뿐 연락처 없음. 버그 리포트·개선 요청 경로(이슈 트래커, 메신저 채널)가 전 문서에 부재하다. npm 사내망 차단·자격증명 같은 환경 이슈는 AI 셀프서비스로 해결 불가한 대표 사례인데, 수십 명 규모에서 이런 문의가 개인 메신저로 산발 유입되면 운영자가 소진된다.
    권고: 지원 모델 문서화: 1차 /axfm-debug + troubleshooting.md → 2차 사내 메신저 지원 채널 → 3차 플러그인 저장소 이슈. 담당자(주·부)와 응답 목표를 정하고 overview.html·troubleshooting.md·publish 안내문에 채널을 명기. 파일럿 기간에 유입 문의를 분류해 정식 운영 부하를 추정.
  [MAJOR/중] 업데이트 배포 거버넌스 부재 — CHANGELOG 없음, 수동 풀 업데이트 + 솔루션별 재동기화의 전파 계획 없음, canonical 저장소 미확정
    설명: 업데이트 경로가 design/README.md 31행의 "팀원은 /plugin marketplace update 후 /plugin update axfm"(사용자 풀 방식)뿐이고, 그 후에도 솔루션마다 /axfm-guide 드리프트 감지→sync-modules.mjs 실행이 필요하다(사용자 수 × 솔루션 수의 수동 작업). CHANGELOG 파일이 저장소에 없고(plugin 0.2.0/modules 2.0.1 이원 버전인데 릴리스 노트 0), 저장소 주소는 전 문서가 placeholder다(README.md "<이 저장소 git URL 또는 로컬 경로>", overview.html 72행은 로컬 경로 F:\AI_MAKE\hansol-axfm이 예시로 박제). 이미 troubleshooting.md 10행에 구버전 모듈(v2.0.0 ?? 문법) 증상 행이 생겼듯, 규모 확대 시 버전 파편화가 지원 부담의 주범이 된다.
    권고: ① CHANGELOG.md와 릴리스 절차(버전 규칙, 공지 채널, 마이그레이션 노트) 신설 ② 사내 canonical git 저장소 주소를 확정하고 문서의 placeholder 일괄 치환 ③ status.mjs에 모듈 버전 파편화 감지를 포함해 업데이트 캠페인(공지→일정 내 재동기화 확인)을 운영 절차로 정의.
  [MAJOR/중] 교육·확산 전략이 overview.html 1장 의존 — 실습 세션 설계와 단계적 확산(1팀→부서→전사) 게이트 없음
    설명: docs/overview.html은 잘 만들어졌으나 발견 경로가 미정(docs 폴더 내 파일 — 신규 사용자가 어떻게 받아 보나)이고 스크린샷·실화면 예시가 없다. 파일럿 절차는 스톱워치 실측이지 교육이 아니며, 실습 세션 커리큘럼이 없다. 확산 단계별 계획(각 단계 진입 기준, 대상 팀 선정, 관리자 세팅의 스케일링)이 어느 문서에도 없고, 특히 "관리자 1회 사전 세팅"(pilot-onboarding.md 7~12행: npm 조달, git 자격증명, Node/Python)은 수동 체크리스트라 전사 확산 시 PC당 병목이 된다 — purpose.md 과제2가 "자동화·체크 스크립트 없음"이라 자인한 그 갭이다.
    권고: 확산 플레이북 작성: ① 90분 실습 세션 커리큘럼(설치→생성→기능 1개→2인 연동 실습, 파일럿 실측과 겸행) ② overview.html을 사내 포털/위키에 게시하고 스크린샷 추가 ③ 파일럿→부서→전사 단계별 진입 게이트 정의 ④ 관리자 세팅 자동 점검 스크립트(check-env.mjs: Node/Python/npm 레지스트리/git 접근)를 로드맵 상위로.
  [MAJOR/소] 전사 규모 id·카탈로그 거버넌스 부족 — owner 프리픽스는 권장일 뿐, "누가 뭘 만들었나"를 알 수 없음
    설명: id 충돌은 같은 PC의 레지스트리에서만 거부되고(scripts/lib/registry-io.mjs upsertEntry), scaffold.mjs의 ID_RE는 형식(소문자·숫자·하이픈)만 검사한다 — protocol.md §1의 {owner}-{name}은 권장이며 skills/axfm-new/SKILL.md도 "제안해 확인받는다" 수준이라 강제가 없다. 수십 명이 "lunch-pick" 같은 일반 id를 쓰면 충돌이 clone 시점(가장 늦고 비개발자가 대처하기 어려운 시점)에 발견된다. 또 팀 카탈로그 부재(purpose.md 과제5 갭)로 중복 개발 방지·연동 대상 발견이 불가능해, 확산될수록 과제 3·5의 가치가 실현되지 않는다.
    권고: ① scaffold.mjs에서 owner 프리픽스를 기본 강제(--no-owner-prefix 옵트아웃) ② purpose.md에 언급된 사내 git 조직/토픽 규약을 파일럿 단계부터 시행하고, 토픽 스캔으로 주간 카탈로그(누가·무엇을·provides/accepts)를 생성해 연동 발견 채널로 활용.
  [MINOR/소] 외부 추천 스킬 큐레이션의 재검증 운영 부재
    설명: docs/recommended-skills.md는 "분기 1회 재검증 권장"(4행)이라고만 하고 책임자·절차가 없다. 외부 마켓 슬러그·유지보수 상태 변동 시 /axfm-toolbox의 추천이 깨진 설치 명령을 안내하게 된다("Discover 탭에서 최종 확인" 방어는 있으나 초보자에겐 추가 막힘 지점). 검증일이 2026-07-02 1회뿐이라 정식 서비스에서는 신선도 관리가 필요하다.
    권고: 재검증을 릴리스 절차(F5 권고)의 체크 항목으로 편입하고 문서 상단에 "차기 재검증 예정일"과 담당자를 명기. 파일럿 중 실제 설치 성공률을 기록해 목록을 축소·정예화.

## LENS: 품질·테스트 연구원 — 자동 검증 게이트(test-all.mjs) 커버리지 갭
VERDICT: 스크립트 계층(scaffold/register/sync + E2E 2종 + Python 단위)은 결정적 설계와 실데이터 왕복 검증으로 "소수 파일럿" 수준에는 도달했다. 그러나 사용자가 실제로 접촉하는 두 표면 — 스킬 지시문(LLM 수행 계층)과 Next.js 템플릿 앱 코드 — 이 자동 게이트 밖에 있고, 잠금파일 부재로 유일한 수동 빌드 실증(2026-07-03)도 시간이 지나면 무효가 된다. 스킬 정합성 린트와 release-check 스크립트화, 파서·레지스트리·동기화 게이트 편입이 이뤄지기 전에는 수십 명 상시 사용의 "정식 서비스" 승격은 이르다.
STRENGTHS:
  + 위험 단계의 결정적 스크립트화(scaffold/register/sync-modules)에 사후검증(플레이스홀더 잔존 0, 필수 파일 존재)을 내장해 LLM 비결정성을 게이트 가능한 표면으로 축소한 설계가 일관됨 (scripts/scaffold.mjs 188~194행)
  + E2E가 격리 HOME에서 실데이터 왕복을 검증(python↔python, nextjs↔python 양방향) — 과거 P3(ts 'Z' 비호환) 같은 크로스 스택 결함의 재발을 상시 차단 (scripts/test-cross-stack.mjs)
  + PowerShell 5.1 파서 게이트는 실제 사고(P1, '??' 문법)에서 도출된 회귀 방지이며 대상 환경(한국 기업 Windows 기본 PS 5.1)에 정확히 조준됨 (scripts/test-all.mjs 14~27행)
  + 실패 메시지가 행동형 한국어로 일관 — readFrom의 '아직 내보내지 않았습니다…실행하세요', 레지스트리 손상의 '/axfm-guide로 복구' 등 비개발자 오류 UX의 기초가 잡혀 있음
  + 게이트가 SKIP을 성공으로 위장하지 않음(test-cross-stack의 명시적 SKIP 출력) + Python 단위 테스트가 BOM·원자성·손상 구분 같은 규약 핵심을 커버 (scripts/test-python-unit.py)
FINDINGS:
  [BLOCKER/중] 스킬 9종(LLM 수행 계층)에 대한 검증이 0 — 정적 정합성 검사조차 없음
    설명: test-all.mjs의 5개 게이트는 전부 스크립트·모듈 검증이며, 사용자가 실제로 접촉하는 skills/*/SKILL.md 9종은 어떤 자동 검사도 없다. 이 계층의 드리프트 사고는 이미 실재했다(2026-07-02 리뷰 H1: 설계서 /axfm:new vs 구현 /axfm-new 이원화). 구체 시나리오: scaffold.mjs의 플래그를 리팩터링(예: --desc → --description)하면 skills/axfm-new/SKILL.md 30행의 호출 예시는 그대로 남고 test-all은 녹색인데, 모든 신규 사용자의 /axfm-new가 '알 수 없는 인자'로 실패한다. 스킬이 인용하는 스크립트 경로·플래그·스킬 상호참조(/axfm-*)·문서 링크의 실존 여부를 아무도 검사하지 않는다.
    권고: 2단 접근. (a) 결정적 스킬 린트 test-skills.mjs 신설 후 test-all 편입: 9개 SKILL.md의 프론트매터(name/description) 검증, 본문이 참조하는 scripts/*.mjs 실존, 인용된 플래그가 각 스크립트 parseArgs 수용 집합과 일치, /axfm-* 상호참조가 실존 스킬인지, docs/ 링크 유효성. (b) LLM 수행 품질: claude -p 비대화형 실행 기반 골든 시나리오 3종(new/guide/connect — 예: 빈 폴더에서 guide가 '/axfm-new 안내'로 종료하는지)을 릴리스 수동 게이트로 명문화하고, claude plugin eval 류 공식 평가 도구가 제공되면 자동화 전환을 검토. 파일럿 M3 실측과 별개로 '지시문-스크립트 정합'은 사람 없이 상시 보증 가능해진다.
  [BLOCKER/중] Next.js 트랙 릴리스 게이트가 '1회 수동 실증 + 체크리스트 문구'뿐 — 잠금파일 부재로 실증 자체가 시효성 있는 증명이 아님
    설명: test-all은 lib/axfm을 type-stripping 실행으로만 검사(타입 검사 아님)하고, app/ 전체(page.tsx·actions.ts·DemoPanel.tsx·layout.tsx)는 어떤 게이트도 통과하지 않는다. docs/design/2026-07-03-install-readiness.md §5가 스스로 증명한다: 최초 tsc 실행에서 실오류 2건 발견('템플릿이 한 번도 컴파일된 적 없었다'). 더 근본적으로 templates/nextjs/package.json은 next ^15.3.0 등 캐럿 범위인데 package-lock.json이 없다 — 2026-07-03의 npm install 실증은 그날의 레지스트리 상태에 대한 증명일 뿐이며, 다음 달 신규 사용자는 다른 의존성 트리를 받는다. 수십 명 상시 사용 시 Next minor 릴리스 하나로 신규 생성이 일제히 깨져도 test-all은 녹색이다.
    권고: ① 템플릿에 package-lock.json 동봉 + 안내를 npm ci로 전환(재현 가능 빌드, 사내망 미러 주소는 .npmrc로 분리) ② scripts/release-check.mjs 신설: scaffold → npm ci → tsc --noEmit → next build → next start HTTP 200 스모크를 명령 1개로 — '네트워크 의존 수동 게이트'를 체크리스트 문장이 아니라 실행 가능한 스크립트로 만들고 릴리스 절차에 필수로 명기 ③ 네트워크 없이도 최소 tsc 검사가 가능하도록 typescript 동봉(또는 사내 캐시) 검토.
  [MAJOR/중] interface.md 파서(연동의 심장)가 양 스택 모두 단위 테스트 0 — 엣지케이스 3건 실측 확인
    설명: 이 리뷰에서 modules/python/axfm/interop.py의 _parse_interface를 직접 실행해 확인: ① 항목 name이 따옴표로 감싸이면 따옴표가 값에 포함됨('"today-menu"' ≠ 'today-menu') — 최상위 id/name만 strip하고 항목 name은 안 함. JS(modules/nextjs/lib/axfm/interop.ts 101~102행)도 동일 결함. 연동 대상 매칭이 조용히 실패한다. ② returns: 하위에 중첩 들여쓰기 맵을 쓰면 하위 키들이 항목에 평탄 병합돼 계약 구조가 무경고 왜곡됨. ③ 하이픈 포함 키(sample-call:)는 \w+ 정규식에 안 걸려 무단 폐기. interface.md는 LLM(/axfm-feature)이 생성·갱신하는 파일이라 '규격 예시 그대로'가 보장되지 않고 관용 입력이 상시 유입되는데, test-python-unit.py에 파서 케이스가 0개이고 JS는 단위 테스트 파일 자체가 없다. E2E는 loadInterface를 데모 경로로 한 번 스칠 뿐이다.
    권고: 표 기반 골든 케이스(정상/따옴표 name/중첩 맵/하이픈 키/CRLF/BOM/프론트매터 없음/--- 미종결)를 두 스택에 동일 적용: Python은 test-python-unit.py 확장, JS는 node --test + type stripping 기반 단위 러너 신설 후 test-all 편입. 파서가 이해 못 한 라인은 무시하지 말고 경고로 수집해 /axfm-connect가 사용자에게 노출하도록 규약화(export-design.mjs의 경고 수집 패턴 재사용).
  [MAJOR/중] 레지스트리 손상 시 scaffold 경로가 경고 한 줄 후 기존 등록 전체를 파괴 — 규약 §6 위반 + 스택 간 동작 불일치 + 동시 쓰기 게이트 부재
    설명: scripts/lib/registry-io.mjs upsertEntry(46~48행): 손상(ok:false) 시 stderr 경고만 내고 빈 목록에서 재생성 → 손상 파일 안의 복구 가능한 기존 등록을 백업 없이 증거 인멸한다. protocol.md §6('조용히 빈 목록으로 만들지 않는다')과 상충하며, stderr 경고는 스킬(LLM) 출력에서 유실되기 쉽다. 반면 Python register_self(modules/python/axfm/registry.py 63~65행)는 같은 상황에서 예외로 중단 — 스택 간 의미 불일치. 동시성: 잠금 없는 read-modify-write에 고정 tmp 파일명(registry.json.tmp)을 JS·Python이 공유 — 두 Claude 세션이 동시에 /axfm-new(또는 두 솔루션 start.ps1 동시 실행) 시 항목 소실·tmp 교차 오염 가능, Windows rename EPERM(백신·OneDrive 스캔) 재시도도 없음. 이 시나리오를 검증하는 테스트가 0개다.
    권고: ① 손상 시 동작 통일: 원본을 registry.json.corrupt-<ts>로 백업 후 재생성(또는 Python처럼 중단) — 한쪽으로 정하고 protocol §6에 명문화 ② tmp 파일명에 pid+난수 접미 ③ 동시 upsert 스트레스 게이트를 test-all에 추가: 자식 프로세스 10개가 동시에 서로 다른 id 등록 → 최종 레지스트리에 10개 전원 존재 검증(현 구조에서 실패하면 재시도 루프나 잠금 파일 도입).
  [MAJOR/중] 게이트의 환경 대표성 부족 — 전 테스트가 ASCII 경로 가정, 대상 사용자의 기본 환경(한글 사용자명·공백 경로·OneDrive)이 미커버
    설명: test-interop/test-cross-stack의 격리 HOME은 플러그인 루트 하위 ASCII 경로다. 실제 파일럿 PC는 C:\Users\홍길동 같은 한글 %USERPROFILE%가 표준이며(레지스트리 경로·PYTHONPATH·PS 5.1 cp949 콘솔 조합), 솔루션 폴더가 OneDrive 동기화 폴더(문서)에 놓이면 os.replace/renameSync가 동기화 중 간헐 PermissionError를 낸다 — 재시도 로직 없음, troubleshooting.md OneDrive 항목은 경로 혼입 주의뿐이고 이 증상은 없다. skills/axfm-new는 '경로는 ASCII 권장'이라 말하지만 scaffold.mjs는 한글 dest를 검증도 경고도 하지 않아 권고와 집행이 불일치한다. 즉 대상 사용자의 '기본' 환경이 게이트에서는 '엣지'로 취급되고 있다.
    권고: ① test-all에 '한글+공백 경로' 변형 1개 추가: 격리 HOME과 dest를 '한 글 test' 하위로 두고 E2E 1회(python 트랙이면 네트워크 불필요) ② 스냅샷·레지스트리 파일 교체에 짧은 재시도(예: 50ms×3) 추가 ③ 스킬/스크립트가 dest 경로에 OneDrive 포함 시 1줄 경고 ④ 파일럿 체크리스트에 '한글 사용자명 PC 1대 포함'을 명기.
  [MAJOR/소] register.mjs·sync-modules.mjs가 게이트 미편입인데 pilot-onboarding.md는 '자동 검증으로 대체됨 ✓'로 표기 — 약속과 게이트의 불일치
    설명: docs/pilot-onboarding.md 39행은 '결정적 생성/등록/재동기화: scaffold.mjs · register.mjs · sync-modules.mjs (사후검증 내장) ✓'라 하지만, test-all.mjs의 어떤 단계도 register/sync를 실행하지 않는다(scaffold만 E2E 경유). sync-modules의 버전 감지 정규식·CLAUDE.md 갱신·'삭제 없음' 보장(사용자 소유 interface.md 보존)은 전부 무검증이다. 구체 시나리오: 모듈 파일 하나를 개명하는 리팩터링 → sync가 옛 파일을 남겨 이중 정의가 생기는데, 드리프트 감지는 '첫 모듈 파일 헤더'만 보므로(sync-modules.mjs 54~64행) 계속 최신이라 보고한다. clone 등록(register.mjs)은 파일럿 5단계(2인 연동)의 전제인데 회귀 게이트가 0이다.
    권고: test-scripts.mjs 신설 후 test-all 편입: ① scaffold 산출물의 모듈 헤더를 v2.0.0으로 위장 → sync-modules 실행 → 전 모듈 파일 갱신 + 사용자 파일(axfm/interface.md, main.py) 바이트 불변 + CLAUDE.md 버전 주석 갱신 검증 ② register.mjs로 미등록 폴더 등록 성공/같은 id·다른 경로 거부/axfm 버전 불일치 거부 검증. pilot-onboarding.md 문구를 실제 게이트 범위와 일치시킬 것.
  [MAJOR/중] 릴리스 파이프라인 부재 — 게이트가 오너 PC 수동 실행에 의존하고 '릴리스 전 필수 통과 목록'이 문서에 산재
    설명: 저장소에 CI 설정(.github 등)·git hook·릴리스 절차 문서가 없고, 통과 기준이 install-readiness.md 수용 기준과 pilot-onboarding.md 자동 검증 목록에 나뉘어 있다. test-all 자체도 환경 의존 분기가 있다(win32 아니면 ps1 게이트 생략, Node<22.6이면 크로스 스택 SKIP) — 오너 PC 1대의 녹색이 '전 조합 녹색'을 의미하지 않는다. 버전 일관성(plugin.json 0.2.0 ↔ modules/VERSION 2.0.1 ↔ 파일 헤더 v2.0.1)도 현재 사람 눈으로 맞추는 규칙이라, 모듈만 올리고 헤더를 빠뜨리면 /axfm-guide 드리프트 감지가 오작동해도 잡을 게이트가 없다.
    권고: 사내 git의 Windows 러너 1개로 커밋/태그마다 test-all 강제 + '릴리스 전 반드시 통과 목록'을 한 문서로 명문화: ① test-all(디자인 토큰·ps1 파서·E2E 2종·py 단위) ② 스킬 린트(신설, finding 1) ③ 파서 골든·레지스트리 동시성·register/sync 게이트(신설, finding 3·4·6) ④ claude plugin validate . ⑤ release-check.mjs(nextjs 빌드 스모크, finding 2 — 네트워크 필요 시 수동이되 스크립트 1개) ⑥ 한글 경로 변형 E2E(finding 5) ⑦ 버전 일관성 검사 스크립트(plugin.json↔modules/VERSION↔모든 모듈 헤더 — 결정적이라 자동화 비용 소).
  [MINOR/소] 실패 메시지·능력의 잔여 불일치 — 포트 '자동 선택' 과대 표기, 한글 데이터명 무음 충돌
    설명: docs/troubleshooting.md 13행은 '/axfm-new는 빈 포트를 자동 선택'이라 하지만 scaffold.mjs findFreePort(48~55행)는 레지스트리에 등록된 포트만 회피하고 실제 점유 여부는 확인하지 않는다 — 다른 프로그램이 3001을 쓰면 그대로 배정되고 next dev는 3002로 조용히 이동해 안내 URL과 실제 포트가 어긋난다(초보자의 첫 실행 실패 시나리오). 또 sanitize_name/sanitizeName은 한글 데이터명을 무경고로 'unknown'으로 접어(types.py 41~44행), 서로 다른 두 한글 이름의 writeShared가 같은 unknown.json에 충돌한다(마지막 쓰기 승리, 무경고) — 비개발자가 한글 이름을 쓸 개연성은 높다.
    권고: ① findFreePort에 실점유 검사(net.createServer 바인딩 시도) 추가 또는 troubleshooting 문구를 실제 능력('등록된 포트 회피')으로 수정 ② writeShared/write_shared에서 sanitize 결과가 원본과 다르면 행동형 에러('데이터 이름은 영문 소문자·숫자·하이픈만: 예 daily-report')로 거부하고, 이 규칙을 protocol.md §3에 명문화 + 단위 테스트 추가.
