# AXFM-MODULE python v2.1.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
from __future__ import annotations
import json
import os
from typing import Optional
from .manifest import load_manifest


def registry_path() -> str:
    """로컬 레지스트리 파일 경로 (~/.axfm/registry.json)."""
    return os.path.join(os.path.expanduser("~"), ".axfm", "registry.json")


def read_registry_safe() -> dict:
    """레지스트리 읽기. 파일 없음=빈 목록(정상), 손상=ok False로 구분.

    반환: {"ok": True, "solutions": [...]} 또는 {"ok": False, "reason": "..."}
    """
    path = registry_path()
    if not os.path.exists(path):
        return {"ok": True, "solutions": []}
    try:
        with open(path, "r", encoding="utf-8-sig") as f:  # BOM 방어
            parsed = json.load(f)
        sols = parsed.get("solutions", [])
        return {"ok": True, "solutions": sols if isinstance(sols, list) else []}
    except (json.JSONDecodeError, OSError) as e:
        return {"ok": False, "reason": f"레지스트리 파일이 손상됨({e}). /axfm-guide 로 복구하세요."}


def read_registry() -> list:
    r = read_registry_safe()
    if not r["ok"]:
        raise RuntimeError(r["reason"])
    return r["solutions"]


def get_entry(solution_id: str) -> Optional[dict]:
    for s in read_registry():
        if s.get("id") == solution_id:
            return s
    return None


def list_neighbors(self_id: str) -> list:
    return [s for s in read_registry() if s.get("id") != self_id]


def _norm_path(p: str) -> str:
    """Windows 는 대소문자 무시 파일시스템 — 경로 비교는 정규화해서 한다 (registry-io.mjs 와 동일 규칙)."""
    return os.path.normcase(os.path.abspath(p))


def register_self(root: Optional[str] = None) -> dict:
    """현재 프로젝트를 레지스트리에 등록/갱신한다 (원자적·BOM 없음, registry-io.mjs 와 동일 규칙).

    - 손상: 원본을 .corrupt-<ts> 로 백업 후 재생성 (protocol §6 — 조용히 비우지 않는다).
    - 같은 id·다른 경로: 기존 경로에 axfm.json 이 없으면 '이동'으로 보고 경로 갱신, 살아 있으면 예외.
    """
    root = os.path.abspath(root or os.getcwd())
    m = load_manifest(root)
    entry = {
        "id": m["id"],
        "name": m["name"],
        "path": root,
        "type": m["type"],
        "interface": os.path.join("axfm", "interface.md"),
    }
    r = read_registry_safe()
    sols = r["solutions"]
    if not r["ok"]:
        import time as _t
        backup = registry_path() + ".corrupt-" + _t.strftime("%Y%m%dT%H%M%S")
        try:
            os.replace(registry_path(), backup)
            print(f"[경고] 레지스트리가 손상되어 백업 후 새로 만듭니다 — 백업: {backup}")
        except OSError:
            print("[경고] 레지스트리가 손상되어 새로 만듭니다")
    for s in sols:
        if s.get("id") == entry["id"] and _norm_path(s.get("path", "")) != _norm_path(root):
            if os.path.isfile(os.path.join(s.get("path", ""), "axfm.json")):
                raise RuntimeError(
                    f"id '{entry['id']}' 가 이미 다른 경로({s.get('path')})에 등록돼 있고 그 폴더가 살아 있습니다. "
                    "axfm.json 의 id 를 {owner}-{name} 형식으로 바꾸세요."
                )
            print(f"[안내] '{entry['id']}' 가 이동한 것으로 보입니다: {s.get('path')} → {root} (경로 갱신)")
    sols = [s for s in sols if s.get("id") != entry["id"]] + [entry]
    _write_registry_atomic({"axfm": "2", "solutions": sols})
    return entry


def _write_registry_atomic(obj: dict) -> None:
    import uuid
    path = registry_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp-{os.getpid()}-{uuid.uuid4().hex[:6]}"  # 동시 세션 tmp 충돌 방지
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:  # BOM 없는 UTF-8
        json.dump(obj, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)  # 원자적 교체
