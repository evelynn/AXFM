# AXFM-MODULE python v2.0.1 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
from __future__ import annotations
import re
from datetime import datetime, timezone
from typing import Any, Optional

AXFM_PROTOCOL = "2"
STALE_AFTER_MS = 24 * 60 * 60 * 1000


def make_envelope(sender: str, name: str, data: Any) -> dict:
    """표준 봉투 생성 (로컬 타임존 오프셋 포함 ISO-8601)."""
    return {
        "axfm": AXFM_PROTOCOL,
        "from": sender,
        "name": name,
        "ts": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "data": data,
    }


def validate_envelope(body: Any) -> Optional[str]:
    """봉투 형태·버전 검사. 문제 없으면 None, 있으면 사람이 읽을 사유."""
    if not isinstance(body, dict):
        return "데이터가 JSON 객체가 아닙니다"
    if body.get("axfm") != AXFM_PROTOCOL:
        return (
            f"상대 솔루션의 AXFM 버전({body.get('axfm', '없음')})이 다릅니다. "
            "양쪽 /axfm-guide 로 업데이트하세요."
        )
    if not isinstance(body.get("from"), str) or not isinstance(body.get("name"), str):
        return "from/name 필드가 없습니다"
    ts = body.get("ts")
    if not isinstance(ts, str) or not _is_iso(ts):
        return "ts가 올바른 ISO-8601이 아닙니다"
    if "data" not in body:
        return "data 필드가 없습니다"
    return None


def sanitize_name(s: str) -> str:
    """파일명 안전화 — 경로 탈출 방지."""
    cleaned = re.sub(r"[^a-zA-Z0-9-]", "", s)[:64]
    return cleaned or "unknown"


def parse_ts(ts: str) -> datetime:
    """봉투 ts 파싱 — 관용적 수신: 'Z' 접미도 허용 (Python 3.10 fromisoformat 호환)."""
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _is_iso(ts: str) -> bool:
    try:
        parse_ts(ts)
        return True
    except ValueError:
        return False
