"use client";
// 공통 통로 체험 — 실시간 서버 호출이 아니라, 공통 함수(writeShared/readShared)로
// 스냅샷 파일(.axfm/data/today-menu.json)을 쓰고 읽는 것을 눈으로 확인합니다.
// 다른 솔루션은 바로 이 스냅샷을 readFrom("<내 id>","today-menu") 로 읽어 연동합니다.
import { useState } from "react";
import { exportTodayMenu } from "../actions";

export default function DemoPanel({ initial }: { initial: { menu: string; date: string } | null }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function onExport() {
    setBusy(true);
    try {
      const data = await exportTodayMenu();
      setSnapshot(data);
      setLog((l) =>
        [`${new Date().toLocaleTimeString("ko-KR")} — today-menu 스냅샷 저장: ${data.menu}`, ...l].slice(0, 10),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>공통 통로 체험</h2>
      <p className="muted">
        아래 버튼은 다른 솔루션이 나와 연동할 때 읽어갈 데이터를 표준 위치에 저장합니다. (서버 없음 · 스냅샷 파일)
      </p>
      <div className="row">
        <button className="btn-primary" onClick={onExport} disabled={busy}>
          오늘의 메뉴 내보내기
        </button>
        {snapshot && (
          <span className="mono">
            현재 스냅샷: <strong>{snapshot.menu}</strong> ({snapshot.date})
          </span>
        )}
      </div>
      {log.length > 0 && (
        <ul className="plain" style={{ marginTop: "var(--axfm-spacing-md)" }}>
          {log.map((line, i) => (
            <li key={i} className="mono muted">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
