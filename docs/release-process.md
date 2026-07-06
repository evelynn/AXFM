# 릴리스 절차 (관리자용)

> 배포 채널: **github.com/evelynn/AXFM** (marketplace `axfm`). 사용자는 풀 방식으로 수신하므로
> 릴리스는 "태그 + 공지"까지가 한 세트다. 아래 순서를 건너뛰지 않는다.

## 1. 버전 3축 올리기 (일관성 필수 — 게이트가 검사함)

| 축 | 파일 | 언제 올리나 |
|---|---|---|
| 플러그인 | `.claude-plugin/plugin.json` `version` | 모든 릴리스 |
| 공통 모듈 | `modules/VERSION` + **모든 모듈 파일 헤더** `AXFM-MODULE ... vX.Y.Z` | `modules/` 코드가 바뀐 릴리스만 |
| 규약 major | `axfm` 프로토콜 버전 (types.ts/py 의 `AXFM_PROTOCOL`) | 봉투/manifest 의미가 깨질 때만 (신중히) |

`CHANGELOG.md` 맨 위에 사용자용 한 줄 요약 목록을 추가한다.

## 2. 게이트 통과 (전부 필수)

```
node scripts/test-all.mjs        ← 자동 게이트 8종 (버전 일관성 검사 포함)
node scripts/release-check.mjs   ← Next.js 재현 빌드 실증 (네트워크 필요)
claude plugin validate .
```

의존성(package.json)을 바꿨다면 lockfile 재생성: 스캐폴드 산출물에서 `npm install --package-lock-only` 후
`axfmlockgen → __AXFM_ID__` 치환하여 `templates/nextjs/package-lock.json` 갱신 (release-check 가 정합을 검증).

## 3. 커밋 → 태그 → 푸시

```
git add -A
git commit -m "vX.Y.Z — <요약>"
git tag vX.Y.Z -m "AXFM vX.Y.Z"
git push
git push origin vX.Y.Z
```

## 4. 공지 (사내 메신저 — 복붙 양식)

```
[AXFM vX.Y.Z 배포] <한 줄 요약>
업데이트 (터미널에서 한 줄씩):
  claude plugin marketplace update axfm
  claude plugin update axfm@axfm --scope project   ← 작업 폴더에서
  Claude Code 재시작
그다음 각 솔루션 폴더에서 /axfm-guide 실행 → 모듈 업데이트가 있으면 재동기화를 안내합니다.
변경 내역: CHANGELOG.md 참조
```

## 5. 긴급 롤백 (잘못된 릴리스)

사용자에게 직전 태그로 재설치를 공지한다:

```
claude plugin marketplace remove axfm
claude plugin marketplace add evelynn/AXFM@v<직전태그>   ← 태그 고정 add 가 안 되는 CC 버전이면: 저장소를 revert 커밋 후 재태그
claude plugin install axfm@axfm --scope project
```

저장소 쪽 표준 대응은 **revert 커밋 + 새 패치 태그**(이력 보존, force-push 금지).

## 원칙

- main 직접 작업 최소화 — 릴리스는 항상 이 문서의 절차로만.
- 스킬(SKILL.md) 변경분은 배포 전 보안 관점 리뷰 1회 (모든 사용자의 AI 에 주입되는 지시문이다).
- 게이트를 건너뛴 핫픽스 금지 — 게이트가 30초면 도는 이유가 이것이다.
