// AXFM-MODULE nextjs v2.0.1 — framework 소유 (직접 수정하지 마세요. 업데이트: /axfm-guide)
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { RegistryEntry } from "./types";

/** 로컬 레지스트리 파일 경로 (~/.axfm/registry.json) */
export function registryPath(): string {
  return join(homedir(), ".axfm", "registry.json");
}

export type RegistryResult =
  | { ok: true; solutions: RegistryEntry[] }
  | { ok: false; reason: string };

/**
 * 레지스트리 읽기. 파일이 없으면 빈 목록(정상), 손상이면 ok:false로 구분해 반환.
 * (손상을 조용히 빈 목록으로 만들지 않는다 — 이웃이 이유 없이 사라지는 것을 방지)
 */
export function readRegistrySafe(): RegistryResult {
  let raw: string;
  try {
    raw = readFileSync(registryPath(), "utf8");
  } catch {
    return { ok: true, solutions: [] }; // 아직 아무것도 등록 안 됨
  }
  try {
    const parsed = JSON.parse(raw.replace(/^﻿/, "")); // BOM 방어
    const solutions = Array.isArray(parsed.solutions) ? (parsed.solutions as RegistryEntry[]) : [];
    return { ok: true, solutions };
  } catch (e) {
    return { ok: false, reason: `레지스트리 파일이 손상됨(${(e as Error).message}). /axfm-guide 로 복구하세요.` };
  }
}

/** 편의: 손상 시 예외를 던지는 버전 */
export function readRegistry(): RegistryEntry[] {
  const r = readRegistrySafe();
  if (!r.ok) throw new Error(r.reason);
  return r.solutions;
}

export function getEntry(id: string): RegistryEntry | undefined {
  return readRegistry().find((s) => s.id === id);
}

export function listNeighbors(selfId: string): RegistryEntry[] {
  return readRegistry().filter((s) => s.id !== selfId);
}
