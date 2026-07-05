# AXFM-MODULE python v2.2.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
# 공통 함수 라이브러리 + 연동 함수 문서 로더. 서버 없음 — 비실시간. 명세: docs/protocol.md v2
from __future__ import annotations
import json
import os
import time
from typing import Any, Optional
from .manifest import load_manifest
from .registry import get_entry, list_neighbors, read_registry
from .types import make_envelope, validate_envelope, sanitize_name, assert_valid_name, parse_ts, STALE_AFTER_MS


def _data_dir(root: str) -> str:
    return os.path.join(root, ".axfm", "data")


def write_shared(name: str, data: Any, root: Optional[str] = None) -> str:
    """내 데이터를 .axfm/data/{name}.json 에 표준 봉투로 원자적 저장 (temp+rename)."""
    assert_valid_name(name)
    root = root or os.getcwd()
    sender = load_manifest(root)["id"]
    d = _data_dir(root)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{sanitize_name(name)}.json")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:  # BOM 없는 UTF-8
        json.dump(make_envelope(sender, name, data), f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)  # 쓰는 중 읽기로 인한 깨진 JSON 방지
    return path


def read_shared(name: str, root: Optional[str] = None) -> Optional[dict]:
    """내 스냅샷 읽기. 없으면 None."""
    root = root or os.getcwd()
    return _read_envelope(os.path.join(_data_dir(root), f"{sanitize_name(name)}.json"))


def read_from(solution_id: str, name: str) -> dict:
    """상대 솔루션이 내보낸 스냅샷 읽기 (비실시간 — 상대가 꺼져 있어도 동작).

    반환된 봉투에 'stale'(bool) 키를 추가한다.
    """
    assert_valid_name(name)
    entry = get_entry(solution_id)
    if entry is None:
        raise RuntimeError(
            f"'{solution_id}' 솔루션이 레지스트리에 없습니다. "
            "상대 프로젝트에서 /axfm-guide 를 한 번 실행하면 등록됩니다."
        )
    if not os.path.isdir(entry["path"]):
        raise RuntimeError(
            f"'{entry['name']}'({solution_id})의 폴더가 없습니다 ({entry['path']} — 이동/삭제된 듯). "
            "/axfm-guide 로 레지스트리를 정리하세요."
        )
    env = _read_envelope(os.path.join(entry["path"], ".axfm", "data", f"{sanitize_name(name)}.json"))
    if env is None:
        raise RuntimeError(
            f"'{entry['name']}'({solution_id})가 아직 '{name}'을 내보내지 않았습니다. "
            "상대 솔루션을 한 번 실행하거나 데이터를 생성하도록 요청하세요."
        )
    if env.get("from") != solution_id:
        raise RuntimeError(
            f"경로 불일치: '{name}' 스냅샷의 발신자가 '{env.get('from')}'입니다(기대: {solution_id}). "
            "레지스트리가 오염됐을 수 있습니다 — /axfm-guide 로 확인하세요."
        )
    if env.get("name") != name:
        raise RuntimeError(
            f"이름 불일치: 스냅샷의 이름이 '{env.get('name')}'입니다(기대: {name}). 파일이 잘못 복사됐을 수 있습니다."
        )
    age_ms = (time.time() - parse_ts(env["ts"]).timestamp()) * 1000
    env["stale"] = age_ms > STALE_AFTER_MS
    return env


def neighbors() -> list:
    """이 PC의 다른 솔루션 목록."""
    return list_neighbors(load_manifest()["id"])


def overview() -> list:
    """이 PC 전체 솔루션의 종합 현황 — 현황판/모니터링 화면의 데이터 소스 (protocol §3).

    반환 항목: {id, name, type, path, alive, moduleVersion,
               provides: [{name, ts, stale}], accepts: [...], error?}
    집계는 코드가 하고 화면·요약만 앱이 만든다 (토큰 절약 원칙).
    """
    import re
    out = []
    for entry in read_registry():
        s = {
            "id": entry.get("id"), "name": entry.get("name"), "type": entry.get("type"),
            "path": entry.get("path", ""), "alive": os.path.isdir(entry.get("path", "")),
            "moduleVersion": None, "provides": [], "accepts": [],
        }
        if s["alive"]:
            try:
                with open(os.path.join(s["path"], "axfm.json"), "r", encoding="utf-8-sig") as f:
                    m = json.load(f)
                mod = (os.path.join(s["path"], "lib", "axfm", "types.ts") if s["type"] == "nextjs"
                       else os.path.join(s["path"], "axfm", "types.py"))
                if os.path.isfile(mod):
                    with open(mod, "r", encoding="utf-8-sig") as f:
                        found = re.search(r"AXFM-MODULE \S+ v([\d.]+)", f.read())
                    s["moduleVersion"] = found.group(1) if found else None
                s["accepts"] = m.get("accepts") if isinstance(m.get("accepts"), list) else []
                for name in (m.get("provides") if isinstance(m.get("provides"), list) else []):
                    ts, stale = None, None
                    try:
                        with open(os.path.join(s["path"], ".axfm", "data", f"{sanitize_name(name)}.json"),
                                  "r", encoding="utf-8-sig") as f:
                            env = json.load(f)
                        ts = env.get("ts") if isinstance(env.get("ts"), str) else None
                        if ts:
                            stale = (time.time() - parse_ts(ts).timestamp()) * 1000 > STALE_AFTER_MS
                    except (OSError, ValueError):
                        pass  # 스냅샷 미생성 — ts/stale None 유지
                    s["provides"].append({"name": name, "ts": ts, "stale": stale})
            except (OSError, ValueError) as e:
                s["error"] = str(e)
        out.append(s)
    return out


def load_interface(solution_id: str) -> Optional[dict]:
    """상대 interface.md 프론트매터 파싱 (연동 대상 탐색용). 없으면 None."""
    entry = get_entry(solution_id)
    if entry is None:
        return None
    root = os.path.abspath(entry["path"])
    path = os.path.abspath(os.path.join(root, entry.get("interface") or os.path.join("axfm", "interface.md")))
    if not path.startswith(root + os.sep):  # 레지스트리 오염 방어 — 루트 밖 경로 무시
        return None
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            raw = f.read()
    except OSError:
        return None
    return _parse_interface(raw)


# --- 내부 헬퍼 ---

def _read_envelope(path: str) -> Optional[dict]:
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            parsed = json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        raise RuntimeError(f"데이터 파일이 손상됐습니다: {path}")
    problem = validate_envelope(parsed)
    if problem:
        raise RuntimeError(f"데이터 규약 위반({path}): {problem}")
    return parsed


def _parse_interface(text: str) -> dict:
    """interface.md 의 --- 프론트매터를 최소 파싱 (functions/accepts 목록 + 본문)."""
    doc = {"functions": [], "accepts": [], "body": text}
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return doc
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return doc
    section = None
    current = None
    for line in lines[1:end]:
        top = _match(r"^(id|name):\s*(.+)$", line)
        if top:
            doc[top[0]] = top[1].strip().strip("\"'")
            continue
        if line.strip() == "functions:":
            section = "functions"
            continue
        if line.strip() == "accepts:":
            section = "accepts"
            continue
        item = _match(r"^\s+-\s+name:\s*(.+)$", line)
        if item and section:
            current = {"name": item[0].strip()}
            doc[section].append(current)
            continue
        kv = _match(r"^\s+(\w+):\s*(.+)$", line)
        if kv and current is not None:
            current[kv[0]] = kv[1].strip()
    return doc


def _match(pattern: str, line: str):
    import re
    m = re.match(pattern, line)
    return m.groups() if m else None
