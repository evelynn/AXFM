# AXFM-MODULE python v2.0.1 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
from __future__ import annotations
import json
import os
import re
from typing import Optional
from .types import AXFM_PROTOCOL

_ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def validate_manifest(m: dict) -> Optional[str]:
    """axfm.json 검사. 문제 없으면 None, 있으면 사유."""
    if m.get("axfm") != AXFM_PROTOCOL:
        return (
            f"axfm.json 의 버전({m.get('axfm', '없음')})이 이 모듈({AXFM_PROTOCOL})과 다릅니다. "
            "/axfm-guide 로 업데이트하세요."
        )
    mid = m.get("id")
    if not isinstance(mid, str) or not _ID_RE.match(mid):
        return f"id 는 소문자·숫자·하이픈만 가능합니다 (현재: {mid!r})"
    for f in ("name", "description", "type", "owner"):
        if not isinstance(m.get(f), str) or not m.get(f):
            return f"{f} 필드가 비어 있습니다"
    if not isinstance(m.get("provides"), list) or not isinstance(m.get("accepts"), list):
        return "provides/accepts 는 배열이어야 합니다 (빈 배열 가능)"
    return None


def load_manifest(root: Optional[str] = None) -> dict:
    """프로젝트 루트의 axfm.json 을 읽고 검증한다."""
    root = root or os.getcwd()
    path = os.path.join(root, "axfm.json")
    try:
        with open(path, "r", encoding="utf-8-sig") as f:  # BOM 방어
            parsed = json.load(f)
    except FileNotFoundError:
        raise RuntimeError(
            f"axfm.json 을 찾을 수 없습니다 ({path}). 프로젝트 폴더에서 실행 중인지 확인하세요. 막히면 /axfm-guide"
        )
    except json.JSONDecodeError as e:
        raise RuntimeError(f"axfm.json 이 올바른 JSON이 아닙니다: {e}")
    problem = validate_manifest(parsed)
    if problem:
        raise RuntimeError(f"axfm.json 규약 위반: {problem}")
    return parsed
