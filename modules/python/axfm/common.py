# AXFM-MODULE python v2.1.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
# 공통 유틸 함수 — 모든 AXFM 솔루션이 같은 함수를 공유해 연동 코드의 형태를 통일한다.
from __future__ import annotations
from datetime import datetime, timezone
from typing import Sequence, TypeVar

T = TypeVar("T")


def now_iso() -> str:
    """ISO-8601 (로컬 타임존 오프셋 포함) 타임스탬프."""
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def fmt_datetime(d: "datetime | None" = None) -> str:
    """사람이 읽는 한국어 날짜/시각."""
    dt = d or datetime.now()
    return dt.strftime("%Y년 %m월 %d일 %H:%M")


def fmt_date(d: "datetime | None" = None) -> str:
    dt = d or datetime.now()
    return dt.strftime("%Y년 %m월 %d일")


def pick_rotating(items: Sequence[T], seed: int) -> T:
    """배열에서 안정적 순환 선택(테스트 가능) — 데모/추천 유틸."""
    if not items:
        raise ValueError("빈 배열에서 선택할 수 없습니다")
    return items[seed % len(items)]
