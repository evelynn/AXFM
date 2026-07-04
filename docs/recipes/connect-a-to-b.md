# 연동 레시피: A솔루션 → B솔루션 데이터 보내기

두 솔루션이 데이터를 주고받는 전체 과정입니다. **실시간 통신이 아니라** 표준 스냅샷 파일 + 연동 함수 문서로 연결합니다. `/axfm-connect` 스킬이 이 절차를 그대로 도와줍니다.

## 예시 상황
- **점심추천기**(`hong-lunch`, 웹앱): 오늘의 메뉴(`today-menu`)를 제공.
- **알림봇**(`kim-noti`, 스크립트): 점심추천기의 메뉴를 받아 알림.

## 1. 제공하는 쪽(점심추천기)이 데이터를 내보낸다
`today-menu`가 이미 `provides`에 있고 `interface.md`에 문서화돼 있습니다. 코드에서 스냅샷을 내보냅니다:
```ts
// 웹앱
import { writeShared } from "@/lib/axfm";
writeShared("today-menu", { menu: "김치찌개", date: "2026-07-03" });
```
→ `hong-lunch/.axfm/data/today-menu.json` (표준 봉투)에 저장됩니다.

## 2. 받는 쪽(알림봇)에서 연동
알림봇 폴더에서 `claude` 실행 후 `/axfm-connect`:
1. 스킬이 이웃 목록에서 `hong-lunch`를 보여줍니다.
2. "점심추천기의 today-menu를 받기"를 선택.
3. 스킬이 `hong-lunch`의 `interface.md`에서 `today-menu`의 `sample`(스키마)을 확인.
4. `connectors/hong-lunch.py` 를 생성:
```python
import axfm
def get_today_menu():
    return axfm.read_from("hong-lunch", "today-menu")["data"]
```

## 3. 사용
```python
from connectors.hong_lunch import get_today_menu
menu = get_today_menu()   # {"menu": "김치찌개", "date": "2026-07-03"}
print(f"오늘 점심은 {menu['menu']} 입니다")
```
- 점심추천기가 실행 중이 아니어도, 마지막으로 내보낸 스냅샷을 읽습니다 (비실시간).
- 24시간 넘은 데이터는 `stale` 표식이 붙습니다.

## 4. 반대 방향(보내기 = 상대의 accepts) — 보내기도 받아가기입니다
알림봇이 점심추천기에 피드백을 보내려면, 점심추천기의 `accepts`에 `feedback`이 있어야 합니다.
- 보내는 쪽(알림봇)은 **자기 폴더**에 `write_shared("feedback", {...})`로 내보내고,
  받는 쪽(점심추천기)이 `readFrom("kim-noti", "feedback")`으로 수집합니다.
  발신자별 데이터가 각자 폴더에 남아 여러 발신자가 있어도 충돌하지 않습니다.
- 상대가 **내 소유**면 `/axfm-connect`가 양쪽을 함께 수정합니다. **타인 소유**면 상대에 붙일 수집 코드를 복사용 블록으로 줍니다.

## 확인 (E2E)
- 양쪽 실행 → 제공쪽이 내보냄 → 받는쪽에서 값이 나오는지 확인.
- 파이썬 데모: `python main.py hong-lunch` 실행 결과에 상대 데이터가 보이면 성공.

## 규칙
- 제공/수신 데이터를 바꾸면 `axfm.json`과 `interface.md`를 **함께 갱신**합니다 (다른 솔루션은 interface.md만 보고 연동).
