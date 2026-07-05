# Hansol AXFM

바이브 코딩을 위한 Claude Code 플러그인 프레임워크입니다. 개발이 처음이어도 괜찮습니다.

> **이 프로젝트의 성격**: 완성형 제품이 아니라, 회사·그룹에서 **여러 명이 바이브 코딩할 때
> 솔루션 간 연결(연동)과 디자인 통일을 위한 기본 프레임워크(베이스)**입니다.
> 각자 만든 도구가 따로 놀지 않도록 공통 규약·공통 디자인·공통 함수의 틀만 제공하며,
> 그 위의 솔루션은 각자 자유롭게 만듭니다. 팀에 맞게 고쳐 쓰는 것을 전제로 합니다
> (디자인 교체: `design/`, 규약: `docs/protocol.md`).

- **만들기**: `/axfm-new` 한 번으로 동작하는 솔루션 뼈대가 생깁니다.
- **연동하기**: AXFM으로 만든 솔루션끼리는 공통 규약으로 쉽게 데이터를 주고받습니다.
  (연동 범위는 **같은 PC** — 팀원 솔루션은 clone 받아 내 PC에서 실행하면 이웃이 됩니다. 실시간 서버 없음.)
- **배우기**: `/axfm-guide`가 지금 할 일을 딱 하나씩 알려줍니다.

## 설치 (터미널 — **작업 폴더에만 적용**)

```
claude plugin marketplace add evelynn/AXFM
cd <작업 폴더>
claude plugin install axfm@hansol-axfm --scope project
```

플러그인은 **설치한 폴더에서만 활성화**됩니다(전역 오염 없음). 다른 프로젝트에는 스킬이 나타나지 않습니다.
`/axfm-new`로 만든 솔루션 폴더에는 활성화 설정(`.claude/settings.json`)이 자동 포함됩니다.

## 시작하기

설치 후 Claude Code에서 `/axfm-new` 를 입력하세요. 10분 안에 첫 솔루션이 화면에 뜹니다.
자세한 안내: [docs/quickstart.md](docs/quickstart.md)

## 문서

- [10분 퀵스타트](docs/quickstart.md)
- [연동 규약 명세 (v2 — 문서·함수 중심, 비실시간)](docs/protocol.md)
- [연동 레시피: A솔루션 → B솔루션 데이터 보내기](docs/recipes/connect-a-to-b.md)
- [추천 외부 스킬](docs/recommended-skills.md)
- [문제 해결](docs/troubleshooting.md)

## 디자인 통일

모든 AXFM 솔루션은 [design/](design/) 폴더의 디자인 시스템(DESIGN.md 규격)을 따릅니다.
디자인 md 파일은 추가/삭제할 수 있으며, 변경하면 모든 솔루션의 다음 UI 작업부터 반영됩니다.
