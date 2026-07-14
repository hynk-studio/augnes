import type Database from "better-sqlite3";

import { listWorkItems, type WorkItem } from "@/lib/work";
import {
  LEGACY_AUGNES_PROJECT_SCOPE_V01,
  LEGACY_PROJECT_COMPATIBILITY_IDENTITY_VERSION_V01,
  type LegacyProjectCompatibilityIdentityV01,
} from "@/types/vnext/project-identity";

const LEGACY_COMPATIBILITY_READ_SOURCES = [
  "work_items",
  "state_entries",
  "state_transitions",
] as const;

export interface LegacyProjectWorkItemsCompatibilityReadV01 {
  identity: LegacyProjectCompatibilityIdentityV01;
  work_items: WorkItem[];
}

export function createLegacyProjectCompatibilityIdentityV01(): LegacyProjectCompatibilityIdentityV01 {
  return {
    compatibility_identity_version:
      LEGACY_PROJECT_COMPATIBILITY_IDENTITY_VERSION_V01,
    identity_kind: "legacy_compatibility",
    identity_source: "legacy_scope",
    legacy_scope: LEGACY_AUGNES_PROJECT_SCOPE_V01,
    read_only: true,
  };
}

export function resolveLegacyProjectCompatibilityIdentityV01(
  db: Database.Database,
  input: { legacy_scope: typeof LEGACY_AUGNES_PROJECT_SCOPE_V01 },
): LegacyProjectCompatibilityIdentityV01 | null {
  assertLegacyScope(input.legacy_scope);
  for (const table of LEGACY_COMPATIBILITY_READ_SOURCES) {
    if (!tableExists(db, table)) continue;
    const found = db
      .prepare(`SELECT 1 FROM ${table} WHERE scope = ? LIMIT 1`)
      .get(LEGACY_AUGNES_PROJECT_SCOPE_V01);
    if (found) return createLegacyProjectCompatibilityIdentityV01();
  }
  return null;
}

export function readLegacyProjectWorkItemsCompatibilityV01(input: {
  legacy_scope: typeof LEGACY_AUGNES_PROJECT_SCOPE_V01;
}): LegacyProjectWorkItemsCompatibilityReadV01 | null {
  assertLegacyScope(input.legacy_scope);
  const workItems = listWorkItems(LEGACY_AUGNES_PROJECT_SCOPE_V01);
  if (workItems.length === 0) return null;
  return {
    identity: createLegacyProjectCompatibilityIdentityV01(),
    work_items: workItems,
  };
}

function assertLegacyScope(value: string): void {
  if (value !== LEGACY_AUGNES_PROJECT_SCOPE_V01) {
    throw new Error("legacy_project_scope_unsupported");
  }
}

function tableExists(db: Database.Database, table: string): boolean {
  return Boolean(
    db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
      )
      .get(table),
  );
}
