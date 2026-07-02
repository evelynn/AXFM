#!/usr/bin/env python
"""AXFM 파이썬 모듈 단위 테스트 (stdlib only, npm 불필요).

검증: 봉투 생성/검증, manifest 검증, 원자적 쓰기, 레지스트리 손상 구분, 안전 파일명, 신선도.
"""
import json
import os
import sys
import tempfile

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "modules", "python"))

import axfm  # noqa: E402
from axfm import types, manifest, registry, interop  # noqa: E402

passed = 0
failed = 0


def check(name, cond, extra=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS {name}")
    else:
        failed += 1
        print(f"  FAIL {name} {extra}")


# 봉투
env = types.make_envelope("sol-a", "greeting", {"msg": "hi"})
check("make_envelope 필수 필드", env["axfm"] == "2" and env["from"] == "sol-a" and "ts" in env)
check("validate_envelope 정상", types.validate_envelope(env) is None)
check("validate_envelope 버전 불일치", types.validate_envelope({**env, "axfm": "9"}) is not None)
check("validate_envelope ts 손상", types.validate_envelope({**env, "ts": "not-a-date"}) is not None)

# ts 관용 수신 — 'Z' 접미(구버전 JS 모듈·타 구현)도 허용해야 크로스 스택이 성립 (Python 3.10 호환 경로)
check("validate_envelope 'Z' 접미 ts 허용", types.validate_envelope({**env, "ts": "2026-07-03T05:00:00.000Z"}) is None)
check("parse_ts 'Z' 접미", types.parse_ts("2026-07-03T05:00:00Z").tzinfo is not None)
check("parse_ts 오프셋 형식", types.parse_ts("2026-07-03T14:00:00+09:00").tzinfo is not None)
check("make_envelope ts 왕복 파싱", types.parse_ts(env["ts"]) is not None)

# 안전 파일명 (경로 탈출 방지)
check("sanitize_name 경로탈출 차단", types.sanitize_name("../../etc/passwd") == "etcpasswd")
check("sanitize_name 빈값 폴백", types.sanitize_name("###") == "unknown")

# manifest 검증
good = {"axfm": "2", "id": "sol-a", "name": "A", "description": "d", "type": "python", "owner": "o", "provides": [], "accepts": []}
check("validate_manifest 정상", manifest.validate_manifest(good) is None)
check("validate_manifest id 형식", manifest.validate_manifest({**good, "id": "Bad_ID"}) is not None)
check("validate_manifest 필수 누락", manifest.validate_manifest({**good, "name": ""}) is not None)

with tempfile.TemporaryDirectory() as home, tempfile.TemporaryDirectory() as proj:
    os.environ["USERPROFILE"] = home
    os.environ["HOME"] = home
    # axfm.json 배치
    with open(os.path.join(proj, "axfm.json"), "w", encoding="utf-8") as f:
        json.dump(good, f)

    # 원자적 쓰기 + 읽기 (temp 파일이 남지 않아야 함)
    interop.write_shared("greeting", {"msg": "안녕"}, root=proj)
    data_dir = os.path.join(proj, ".axfm", "data")
    files = os.listdir(data_dir)
    check("write_shared 결과 파일", "greeting.json" in files)
    check("write_shared temp 미잔존", not any(x.endswith(".tmp") for x in files), extra=str(files))
    got = interop.read_shared("greeting", root=proj)
    check("read_shared 왕복", got and got["data"]["msg"] == "안녕")

    # BOM 없는 UTF-8 인지 확인
    with open(os.path.join(data_dir, "greeting.json"), "rb") as f:
        head = f.read(3)
    check("BOM 없는 UTF-8", head != b"\xef\xbb\xbf", extra=repr(head))

    # 레지스트리 손상 구분
    reg_path = registry.registry_path()
    os.makedirs(os.path.dirname(reg_path), exist_ok=True)
    with open(reg_path, "w", encoding="utf-8") as f:
        f.write("{ this is not json")
    r = registry.read_registry_safe()
    check("레지스트리 손상 구분(무음 아님)", r["ok"] is False and "손상" in r["reason"])

print(f"\n{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
