# Changelog

모든 사용자용 변경 이력. 버전 규칙: 플러그인(plugin.json) SemVer, 공통 모듈(modules/VERSION)은 별도 표기.

## v0.3.0 — 2026-07-04

정식 서비스 준비 1차 보완. (공통 모듈 v2.1.0)

- **보내기 모델 확정 — "보내기도 받아가기"**: 발신자는 자기 폴더에 `writeShared`, 수신자가 `readFrom`으로 수집.
  규약·템플릿·스킬·레시피 통일, v1 잔재(`pushData`) 제거. 다중 발신 충돌 없음
- **스킬 8종으로 정리**: /axfm-toolbox 제거 (추천 도구 안내는 /axfm-guide 가 흡수)
- **데이터 이름 규칙 엄격화**: 소문자 kebab-case 만 허용 — 위반은 무음 축약 대신 행동형 오류로 거부
  (서로 다른 한글 이름이 같은 파일로 수렴하는 사고 방지)
- **레지스트리 견고화**: 손상 시 `.corrupt-<ts>` 백업 후 재생성, 폴더 이동 자동 감지(경로 갱신),
  동시 세션 tmp 충돌 방지, 유령 항목(삭제된 솔루션) 오류 메시지 구분
- **보안 보강**: interface 경로를 솔루션 루트로 제한(레지스트리 오염 방어), connect 스킬에 지시문 주입 방어 규칙,
  feature 스킬에 민감정보 내보내기 점검, Python 템플릿 `.gitignore` 에 `.env*` 추가
- **명령 호환**: 사용자 안내 명령의 `&&` 체인 전량 제거(기본 PowerShell 5.1 비호환) + 문서 게이트 신설
- 문구 정직화: "질문 3개 + 확인 1번", 포트 배정 설명, 실행정책 우회 안내 강등

## v0.2.0 — 2026-07-03

첫 공개 릴리스. (공통 모듈 v2.0.1 · 디자인 표준 v1.0)

- **프로토콜 v2**: 서버 없는 비실시간 스냅샷 연동 (같은 PC 범위) — 웹앱↔스크립트 크로스 스택 실데이터 왕복 자동 검증
- **스킬 9종**: /axfm-new · guide · idea · feature · connect · debug · qa · publish · toolbox
- **폴더 스코프 설치 공식화**: `claude plugin install axfm@hansol-axfm --scope project` — 설치한 폴더에서만 활성 (전역 오염 없음)
- **결정적 스크립트**: scaffold(생성) · register(등록) · sync-modules(모듈 재동기화) · export-design(디자인 토큰) + 자동 게이트(test-all: 디자인·PS5.1 파서·E2E 2종·단위 테스트)
- **솔루션 워크스페이스**: CLAUDE.md 폴더 맵 + 동봉 예제 스킬 /solution-help ("폴더에 넣으면 그 폴더에서만 적용")
- **Windows 기본 환경 호환**: PowerShell 5.1, 한국어 콘솔(cp949), 비개발자 친화 한국어 안내
