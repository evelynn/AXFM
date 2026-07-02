// AXFM 데모 대시보드 — 이 화면이 보이면 성공입니다.
// 자유롭게 수정하세요. 첫 기능 만들기: Claude Code 에서 /axfm-feature
import { loadManifest, neighbors, loadInterface, readShared } from "@/lib/axfm";
import type { Manifest, RegistryEntry } from "@/lib/axfm";
import DemoPanel from "./components/DemoPanel";

export const dynamic = "force-dynamic";

export default function Home() {
  let manifest: Manifest | null = null;
  let loadError = "";
  try {
    manifest = loadManifest();
  } catch (e) {
    loadError = (e as Error).message;
  }

  if (!manifest) {
    return (
      <div className="card">
        <h2>설정을 읽지 못했습니다</h2>
        <p>{loadError}</p>
      </div>
    );
  }

  // 이웃 솔루션 + 각자의 연동 함수 문서 요약 (실시간 호출 아님 — 문서/스냅샷 읽기)
  const nbrs: RegistryEntry[] = neighbors();
  const nbrInfo = nbrs.map((n) => ({ entry: n, iface: loadInterface(n.id) }));

  return (
    <>
      <div className="row">
        <h1>{manifest.name}</h1>
        <span className="badge online">AXFM v2</span>
      </div>
      <p className="muted">
        {manifest.description} · 만든 사람: {manifest.owner} ·{" "}
        <span className="mono">{manifest.id}</span>
      </p>

      {/* 내 연동 함수 문서 — 다른 솔루션은 이 정보만 보고 나와 연동합니다 (axfm/interface.md) */}
      <div className="card">
        <h2>내가 주고받는 것</h2>
        <ul className="plain">
          {manifest.provides.map((p) => (
            <li key={`p-${p}`}>
              <span className="badge online">제공</span> <span className="mono">{p}</span>
            </li>
          ))}
          {manifest.accepts.map((a) => (
            <li key={`a-${a}`}>
              <span className="badge offline">수신</span> <span className="mono">{a}</span>
            </li>
          ))}
        </ul>
        <p className="muted">상세 사용법은 axfm/interface.md 에 있습니다. 연동: /axfm-connect</p>
      </div>

      {/* 이웃 솔루션 — 이 PC에 등록된 다른 AXFM 솔루션들 (레지스트리 + interface.md) */}
      <div className="card">
        <h2>이웃 솔루션 ({nbrs.length})</h2>
        {nbrs.length === 0 ? (
          <p className="muted">
            아직 이웃이 없습니다. 팀원의 솔루션을 받아오거나 /axfm-new 로 하나 더 만들면 여기에 나타납니다.
          </p>
        ) : (
          <ul className="plain">
            {nbrInfo.map(({ entry, iface }) => (
              <li key={entry.id} className="row">
                <strong>{entry.name}</strong>
                <span className="mono muted">{entry.id}</span>
                {iface ? (
                  <span className="muted">
                    제공: {iface.functions.map((f) => String(f.name)).join(", ") || "(없음)"}
                  </span>
                ) : (
                  <span className="muted">연동 문서 없음</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 공통 통로 체험 — 서버 없이, 공통 함수로 스냅샷을 쓰고 읽는다 */}
      <DemoPanel initial={readShared<{ menu: string; date: string }>("today-menu")?.data ?? null} />

      <p className="muted">
        다음 할 일이 궁금하면 Claude Code 에서 <span className="mono">/axfm-guide</span> 를 입력하세요.
      </p>
    </>
  );
}
