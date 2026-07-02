#!/usr/bin/env node
/** AXFM 전체 자동 검증 러너 — 사람 없이 통과 가능한 게이트를 모두 실행한다. */
import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const py = ["py", "python", "python3"].find((c) => {
  const r = spawnSync(c, ["--version"], { encoding: "utf8" });
  return !r.error && r.status === 0;
});

// 템플릿 .ps1 은 Windows 기본 PowerShell 5.1 파서로 검사한다 (P1 회귀 방지 — '??' 등 PS7 전용 문법 차단)
const ps1Files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith(".ps1")) ps1Files.push(p);
  }
})(join(ROOT, "templates"));
const hasPowershell = process.platform === "win32" && !spawnSync("powershell", ["-NoProfile", "-Command", "exit 0"]).error;
const ps1Check =
  `$bad=0; @(${ps1Files.map((f) => `'${f.replace(/'/g, "''")}'`).join(",")}) | ForEach-Object { ` +
  `$errs=$null; [System.Management.Automation.Language.Parser]::ParseFile($_, [ref]$null, [ref]$errs) | Out-Null; ` +
  `if ($errs) { $errs | ForEach-Object { Write-Output ($_.Extent.File + ': ' + $_.Message) }; $bad=1 } }; exit $bad`;

const steps = [
  ["디자인 토큰 검증", process.execPath, [join(ROOT, "scripts", "export-design.mjs"), "--check"]],
  ...(hasPowershell && ps1Files.length
    ? [["PowerShell 5.1 파서 검사 (템플릿 .ps1)", "powershell", ["-NoProfile", "-Command", ps1Check]]]
    : []),
  ["cross-feature E2E (python↔python)", process.execPath, [join(ROOT, "scripts", "test-interop.mjs")]],
  ["cross-stack E2E (nextjs↔python)", process.execPath, [join(ROOT, "scripts", "test-cross-stack.mjs")]],
  ...(py ? [["python 단위 테스트", py, [join(ROOT, "scripts", "test-python-unit.py")]]] : []),
];

let failed = 0;
for (const [name, cmd, args] of steps) {
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd: ROOT });
  const ok = !r.error && r.status === 0;
  console.log(`${ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"} ${name}`);
  if (!ok) {
    failed++;
    console.log((r.stdout || "") + (r.stderr || r.error?.message || ""));
  }
}
console.log(failed ? `\n\x1b[31m${failed}개 실패\x1b[0m` : `\n\x1b[32m전체 통과\x1b[0m`);
process.exit(failed ? 1 : 0);
