# __AXFM_NAME__ — AXFM 파이썬 솔루션
# 이 파일은 여러분의 것입니다. 자유롭게 수정하세요. 첫 기능: Claude Code 에서 /axfm-feature
import sys

# 한국어 Windows 콘솔(cp949)에서도 유니코드가 깨지지 않도록 UTF-8 출력
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import axfm


# ANSI 컬러 (Windows 터미널 지원)
def c(code, s):
    return f"\033[{code}m{s}\033[0m"


def build_daily_report():
    """데모: 오늘의 작업 요약을 만든다. 여러분의 로직으로 교체하세요."""
    return {
        "title": "오늘의 요약",
        "lines": ["처리 12건", "오류 0건", f"생성 시각 {axfm.fmt_datetime()}"],
    }


def main():
    print(c("1;36", f"\n=== __AXFM_NAME__ (AXFM v{axfm.AXFM_PROTOCOL}) ===\n"))

    # 1) 최초 실행 시 레지스트리에 등록 (clone 받았어도 이 한 줄로 이웃이 됨)
    entry = axfm.register_self()
    print(c("32", "OK") + f" 레지스트리에 등록됨: {entry['name']} ({entry['id']})")

    # 2) 이웃 솔루션 확인
    nbrs = axfm.neighbors()
    if nbrs:
        print(c("32", "OK") + f" 이웃 솔루션 {len(nbrs)}개:")
        for n in nbrs:
            iface = axfm.load_interface(n["id"])
            provides = ", ".join(str(f.get("name")) for f in iface["functions"]) if iface else "(문서 없음)"
            print(f"   - {n['name']} ({n['id']}) — 제공: {provides}")
    else:
        print(c("33", "..") + " 아직 이웃이 없습니다. /axfm-new 로 하나 더 만들면 여기 나타납니다.")

    # 3) 내 데이터를 스냅샷으로 내보내기 (다른 솔루션이 read_from 으로 읽어감)
    report = build_daily_report()
    path = axfm.write_shared("daily-report", report)
    print(c("32", "OK") + f" 'daily-report' 스냅샷 저장: {report['title']} → {path}")

    # 4) 연동 데모: 인자로 solution_id 를 주면 그 이웃의 daily-report 를 읽어본다
    if len(sys.argv) > 1:
        target = sys.argv[1]
        try:
            env = axfm.read_from(target, "daily-report")
            tag = c("33", " (오래된 데이터)") if env.get("stale") else ""
            print(c("32", "OK") + f" '{target}' 에게서 받음{tag}: {env['data']}")
        except RuntimeError as e:
            print(c("31", "!!") + f" 연동 실패: {e}")

    print(c("1;36", "\n완료! 다음 할 일이 궁금하면 Claude Code 에서 /axfm-guide 를 입력하세요.\n"))


if __name__ == "__main__":
    main()
