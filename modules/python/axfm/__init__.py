# AXFM-MODULE python v2.2.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
# 공통 함수 라이브러리 + 연동 함수 문서 로더. 서버 없음 — 비실시간 스냅샷/문서 기반.
# 명세: 플러그인 docs/protocol.md v2
"""AXFM 파이썬 연동 라이브러리.

사용 예:
    import axfm
    axfm.register_self()                       # 최초 실행 시 레지스트리에 등록
    axfm.write_shared("today-menu", {"menu": "김치찌개"})
    env = axfm.read_from("other-solution", "today-menu")   # 상대 스냅샷 읽기
    for n in axfm.neighbors():
        print(n["name"])
"""
from .types import AXFM_PROTOCOL, make_envelope, validate_envelope, sanitize_name, assert_valid_name, parse_ts, STALE_AFTER_MS
from .manifest import load_manifest, validate_manifest
from .registry import (
    registry_path,
    read_registry_safe,
    read_registry,
    get_entry,
    list_neighbors,
    register_self,
)
from .interop import write_shared, read_shared, read_from, load_interface, neighbors, overview
from .common import now_iso, fmt_date, fmt_datetime, pick_rotating

__all__ = [
    "AXFM_PROTOCOL",
    "make_envelope",
    "validate_envelope",
    "sanitize_name",
    "assert_valid_name",
    "parse_ts",
    "STALE_AFTER_MS",
    "load_manifest",
    "validate_manifest",
    "registry_path",
    "read_registry_safe",
    "read_registry",
    "get_entry",
    "list_neighbors",
    "register_self",
    "write_shared",
    "read_shared",
    "read_from",
    "load_interface",
    "neighbors",
    "overview",
    "now_iso",
    "fmt_date",
    "fmt_datetime",
    "pick_rotating",
]
