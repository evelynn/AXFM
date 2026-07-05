---
version: "1.1"
name: AXFM Standard
description: Hansol AXFM 표준 디자인 시스템 (2026-07-03 오너 확정, 2026-07-05 보고서 컴포넌트 승격 — 모든 솔루션의 기준)
colors:
  primary: "#1B4D8B"
  secondary: "#5A6472"
  tertiary: "#E8590C"
  neutral: "#F6F7F9"
  surface: "#FFFFFF"
  text: "#1A1C1E"
  text-muted: "#6C7278"
  success: "#2F9E44"
  danger: "#C92A2A"
  border: "#E2E5E9"
typography:
  h1:
    fontFamily: Pretendard, sans-serif
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  h2:
    fontFamily: Pretendard, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Pretendard, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Pretendard, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "D2Coding, Consolas, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px 20px
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  badge-online:
    backgroundColor: "{colors.success}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
  badge-offline:
    backgroundColor: "{colors.text-muted}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
  kpi-card:
    backgroundColor: "{colors.neutral}"
    borderColor: "{colors.border}"
    valueColor: "{colors.primary}"
    valueSize: 26px
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  callout:
    borderColor: "{colors.primary}"
    backgroundColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  bar-chart:
    trackColor: "{colors.neutral}"
    trackBorder: "{colors.border}"
    fillColor: "{colors.primary}"
    fillGood: "{colors.success}"
    fillWarn: "{colors.tertiary}"
    height: 18px
    rounded: "{rounded.full}"
  table:
    headBorder: "{colors.border}"
    rowBorder: "{colors.border}"
    cellPadding: 9px 12px
---

# AXFM Standard Design System

## Overview

Hansol AXFM 솔루션들의 **확정 표준** 디자인 시스템입니다 (2026-07-03 오너 확정). 업무 도구에 맞는
차분하고 명료한 인상을 목표로 하며, 모든 AXFM 솔루션의 화면은 이 문서의 토큰만 사용합니다.
(추후 브랜드 변경 시 이 파일을 교체하거나 `10-*.md` 오버라이드를 추가 — 코드 변경은 필요 없습니다.)

## Colors

- **Primary**는 주요 액션(버튼, 링크, 활성 상태)에만 사용합니다. 넓은 배경에 쓰지 않습니다.
- **Neutral/Surface**가 화면의 대부분을 차지해야 합니다 — 업무 도구는 콘텐츠가 주인공입니다.
- 상태 표현: 온라인/성공 = success, 오류/위험 = danger. 그 외 상태색을 임의로 만들지 않습니다.

## Typography

- 본문은 body-md(16px)를 기본으로, 표·보조 정보만 body-sm을 씁니다.
- 화면당 h1은 하나. 섹션 제목은 h2.
- 코드·ID·경로 표기는 mono를 씁니다.

## Layout

- 기본 여백 단위는 spacing 토큰만 사용합니다 (임의 px 금지).
- 콘텐츠 최대 폭 960px, 중앙 정렬. 카드 사이 간격은 spacing.md.

## Elevation & Depth

- 그림자는 카드 1단계만: `0 1px 3px rgba(0,0,0,0.08)`. 그 이상의 깊이 표현은 쓰지 않습니다.

## Shapes

- 모서리는 rounded 토큰만 사용. 버튼·입력은 md, 카드류는 lg, 뱃지·아바타는 full.

## Components

- **button-primary**: 화면당 1~2개까지. 나머지 버튼은 테두리형(secondary)으로.
- **card**: 정보 블록의 기본 단위. border 1px + rounded.lg.
- **badge-online / badge-offline**: 솔루션 연결 상태 표시 전용.

### 보고서·대시보드 컴포넌트 (v1.1 — 실측 보고서 디자인을 표준으로 승격)

- **kpi-card**: 핵심 숫자 강조 카드 — 큰 값(valueSize, primary 색) + 아래 한 줄 설명.
  그리드로 나란히 배치(최소 160px). 한 화면에 3~5개가 적정.
- **callout**: 왼쪽 4px primary 테두리의 강조 박스 — 규칙·주의·핵심 문장 1~3줄 전용.
- **bar-chart**: 수평 막대 — track(neutral+border) 위에 fill. 기본 fill 은 primary,
  좋은 값은 fillGood(success), 주의 값은 fillWarn(tertiary). 점수·비율·비교에 사용 (외부 차트 라이브러리 금지).
- **table**: 머리행은 2px 아래 테두리, 행은 1px, 마지막 행 테두리 없음. 셀 여백은 cellPadding.
  넓은 표는 가로 스크롤 컨테이너로 감싼다.

## Do's and Don'ts

- ✅ 토큰만 사용한다 (색상·간격·모서리에 임의 값 금지)
- ✅ 한 화면에 강조는 한 곳만
- ❌ 그라데이션·과한 애니메이션·이모지 남용 금지 (업무 도구의 신뢰감 우선)
- ❌ AI 생성 티가 나는 보라색 그라데이션 히어로 금지
