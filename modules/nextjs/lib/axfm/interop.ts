// AXFM-MODULE nextjs v2.1.0 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
// 공통 함수 라이브러리 + 연동 함수 문서 로더. 서버 없음 — 비실시간 스냅샷/문서 기반. 명세: docs/protocol.md v2
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { loadManifest } from "./manifest";
import { getEntry, listNeighbors } from "./registry";
import { makeEnvelope, validateEnvelope, sanitizeName, assertValidName, STALE_AFTER_MS, type Envelope, type RegistryEntry } from "./types";

const dataDir = (root: string) => join(root, ".axfm", "data");

/** 내 데이터를 .axfm/data/{name}.json 에 표준 봉투로 원자적 저장 (temp+rename) */
export function writeShared<T>(name: string, data: T): string {
  assertValidName(name);
  const self = loadManifest();
  const dir = dataDir(process.cwd());
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${sanitizeName(name)}.json`);
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(makeEnvelope(self.id, name, data), null, 2), "utf8"); // BOM 없는 UTF-8
  renameSync(tmp, file); // 같은 볼륨 원자적 교체 — 쓰는 중 읽기로 인한 깨진 JSON 방지
  return file;
}

/** 내 스냅샷 읽기 */
export function readShared<T = unknown>(name: string): Envelope<T> | null {
  return readEnvelope<T>(join(dataDir(process.cwd()), `${sanitizeName(name)}.json`));
}

/** 상대 솔루션이 내보낸 스냅샷 읽기 (비실시간 — 상대가 꺼져 있어도 동작) */
export function readFrom<T = unknown>(solutionId: string, name: string): Envelope<T> & { stale: boolean } {
  assertValidName(name);
  const entry = getEntry(solutionId);
  if (!entry)
    throw new Error(`'${solutionId}' 솔루션이 레지스트리에 없습니다. 상대 프로젝트에서 /axfm-guide 를 한 번 실행하면 등록됩니다.`);
  if (!existsSync(entry.path))
    throw new Error(`'${entry.name}'(${solutionId})의 폴더가 없습니다 (${entry.path} — 이동/삭제된 듯). /axfm-guide 로 레지스트리를 정리하세요.`);
  const env = readEnvelope<T>(join(entry.path, ".axfm", "data", `${sanitizeName(name)}.json`));
  if (!env)
    throw new Error(`'${entry.name}'(${solutionId})가 아직 '${name}'을 내보내지 않았습니다. 상대 솔루션을 한 번 실행하거나 데이터를 생성하도록 요청하세요.`);
  if (env.from !== solutionId)
    throw new Error(`경로 불일치: '${name}' 스냅샷의 발신자가 '${env.from}'입니다(기대: ${solutionId}). 레지스트리가 오염됐을 수 있습니다 — /axfm-guide 로 확인하세요.`);
  if (env.name !== name)
    throw new Error(`이름 불일치: 스냅샷의 이름이 '${env.name}'입니다(기대: ${name}). 파일이 잘못 복사됐을 수 있습니다.`);
  return { ...env, stale: Date.now() - Date.parse(env.ts) > STALE_AFTER_MS };
}

/** 이 PC의 다른 솔루션 목록 */
export function neighbors(): RegistryEntry[] {
  return listNeighbors(loadManifest().id);
}

/** 상대 interface.md 프론트매터 파싱 (연동 대상 탐색용) */
export interface InterfaceDoc {
  id?: string;
  name?: string;
  functions: Array<Record<string, unknown>>;
  accepts: Array<Record<string, unknown>>;
  body: string;
}
export function loadInterface(solutionId: string): InterfaceDoc | null {
  const entry = getEntry(solutionId);
  if (!entry) return null;
  const file = resolve(entry.path, entry.interface ?? join("axfm", "interface.md"));
  // 레지스트리 오염 방어 — interface 경로가 솔루션 루트를 벗어나면 무시
  if (!file.startsWith(resolve(entry.path) + sep)) return null;
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  return parseInterface(raw);
}

// --- 내부 헬퍼 ---

function readEnvelope<T>(file: string): (Envelope<T>) | null {
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.replace(/^﻿/, ""));
  } catch {
    throw new Error(`데이터 파일이 손상됐습니다: ${file}`);
  }
  const problem = validateEnvelope(parsed);
  if (problem) throw new Error(`데이터 규약 위반(${file}): ${problem}`);
  return parsed as Envelope<T>;
}

/** interface.md 의 --- 프론트매터를 최소 파싱 (functions/accepts 목록 + 본문). 상세 스키마는 원문 참조 */
function parseInterface(text: string): InterfaceDoc {
  const lines = text.split(/\r?\n/);
  const doc: InterfaceDoc = { functions: [], accepts: [], body: text };
  if (lines[0]?.trim() !== "---") return doc;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end < 0) return doc;
  let section: "functions" | "accepts" | null = null;
  let current: Record<string, unknown> | null = null;
  for (const line of lines.slice(1, end)) {
    const top = line.match(/^(id|name):\s*(.+)$/);
    if (top) { doc[top[1] as "id" | "name"] = top[2].trim().replace(/^["']|["']$/g, ""); continue; }
    if (/^functions:\s*$/.test(line)) { section = "functions"; continue; }
    if (/^accepts:\s*$/.test(line)) { section = "accepts"; continue; }
    const item = line.match(/^\s+-\s+name:\s*(.+)$/);
    if (item && section) { current = { name: item[1].trim() }; doc[section].push(current); continue; }
    const kv = line.match(/^\s+(\w+):\s*(.+)$/);
    if (kv && current) current[kv[1]] = kv[2].trim();
  }
  return doc;
}
