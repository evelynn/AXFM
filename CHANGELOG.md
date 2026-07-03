# Changelog

모든 사용자용 변경 이력. 버전 규칙: 플러그인(plugin.json) SemVer, 공통 모듈(modules/VERSION)은 별도 표기.

## v0.2.0 — 2026-07-03

첫 공개 릴리스. (공통 모듈 v2.0.1 · 디자인 표준 v1.0)

- **프로토콜 v2**: 서버 없는 비실시간 스냅샷 연동 (같은 PC 범위) — 웹앱↔스크립트 크로스 스택 실데이터 왕복 자동 검증
- **스킬 9종**: /axfm-new · guide · idea · feature · connect · debug · qa · publish · toolbox
- **폴더 스코프 설치 공식화**: `claude plugin install axfm@hansol-axfm --scope project` — 설치한 폴더에서만 활성 (전역 오염 없음)
- **결정적 스크립트**: scaffold(생성) · register(등록) · sync-modules(모듈 재동기화) · export-design(디자인 토큰) + 자동 게이트(test-all: 디자인·PS5.1 파서·E2E 2종·단위 테스트)
- **솔루션 워크스페이스**: CLAUDE.md 폴더 맵 + 동봉 예제 스킬 /solution-help ("폴더에 넣으면 그 폴더에서만 적용")
- **Windows 기본 환경 호환**: PowerShell 5.1, 한국어 콘솔(cp949), 비개발자 친화 한국어 안내
