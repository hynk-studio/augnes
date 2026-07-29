import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import {
  continuityPinTargetIdentityV01,
  isRetainedContinuityPinTargetV01,
  isSupportedContinuityPinTargetV01,
} from "@/lib/vnext/continuity-pins/continuity-pin-target";
import {
  resolveContinuityPinTargetV01,
} from "@/lib/vnext/continuity-pins/continuity-pin-resolver";
import {
  readCanonicalProjectIdentityV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { parseStrictIsoTimestampV01 } from "@/lib/vnext/protocol-primitives";
import type {
  BlankStateContinuitySourceFamilyV01,
} from "@/types/vnext/blank-state";
import {
  PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01,
  PROJECT_CONTINUITY_PIN_LIMIT_V01,
  PROJECT_CONTINUITY_PIN_PROJECTION_VERSION_V01,
  type ContinuityPinTargetRefV01,
  type ProjectContinuityPinMutationActionV01,
  type ProjectContinuityPinMutationResultV01,
  type ProjectContinuityPinProjectionV01,
} from "@/types/vnext/continuity-pins";

export const VNEXT_PROJECT_CONTINUITY_PIN_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_continuity_pin_collections (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    collection_version TEXT NOT NULL CHECK (
      collection_version = 'project_continuity_pin_collection.v0.1'
    ),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS vnext_project_continuity_pins (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    target_ref_json TEXT NOT NULL CHECK (
      json_valid(target_ref_json) AND json_type(target_ref_json) = 'object'
    ),
    source_family_snapshot TEXT NOT NULL CHECK (
      source_family_snapshot IN (
        'project_lifecycle',
        'delegated_work',
        'current_run',
        'saved_result',
        'project_attention',
        'recent_change',
        'continuation'
      )
    ),
    source_item_id_snapshot TEXT NOT NULL CHECK (
      length(trim(source_item_id_snapshot)) > 0 AND
      length(source_item_id_snapshot) <= 512
    ),
    label_snapshot TEXT NOT NULL CHECK (
      length(trim(label_snapshot)) > 0 AND length(label_snapshot) <= 1024
    ),
    state_snapshot TEXT NOT NULL CHECK (
      length(trim(state_snapshot)) > 0 AND length(state_snapshot) <= 1024
    ),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    pinned_at TEXT NOT NULL CHECK (length(trim(pinned_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, target_key),
    UNIQUE (workspace_id, project_id, sort_order),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_continuity_pin_collections(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_continuity_pins_project_order
    ON vnext_project_continuity_pins(
      workspace_id, project_id, sort_order, target_key
    );
`;

export type ProjectContinuityPinStoreErrorCodeV01 =
  | "continuity_pin_request_invalid"
  | "continuity_pin_project_not_found"
  | "continuity_pin_project_mismatch"
  | "continuity_pin_stale_write"
  | "continuity_pin_invalid_target"
  | "continuity_pin_target_unavailable"
  | "continuity_pin_collection_full"
  | "continuity_pin_record_invalid";

export class ProjectContinuityPinStoreErrorV01 extends Error {
  constructor(
    readonly code: ProjectContinuityPinStoreErrorCodeV01,
    readonly current_revision: number | null = null,
  ) {
    super(code);
    this.name = "ProjectContinuityPinStoreErrorV01";
  }
}

interface CollectionRowV01 {
  workspace_id: string;
  project_id: string;
  collection_version: string;
  revision: number;
  created_at: string;
  updated_at: string;
}

interface PinRowV01 {
  workspace_id: string;
  project_id: string;
  target_key: string;
  target_ref_json: string;
  source_family_snapshot: string;
  source_item_id_snapshot: string;
  label_snapshot: string;
  state_snapshot: string;
  sort_order: number;
  pinned_at: string;
  updated_at: string;
}

export function ensureVNextProjectContinuityPinSchemaV01(
  db: Database.Database,
): void {
  db.pragma("foreign_keys = ON");
  db.exec(VNEXT_PROJECT_CONTINUITY_PIN_SCHEMA_SQL_V01);
}

export function assertVNextProjectContinuityPinSchemaV01(
  db: Database.Database,
): void {
  for (const artifact of [
    ["table", "vnext_project_continuity_pin_collections"],
    ["table", "vnext_project_continuity_pins"],
    ["index", "idx_vnext_project_continuity_pins_project_order"],
  ]) {
    const found = db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?",
      )
      .get(artifact[0], artifact[1]);
    if (!found) {
      throw new Error(
        `vnext_project_continuity_pin_schema_missing:${artifact[1]}`,
      );
    }
  }
}

export function readProjectContinuityPinProjectionV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): ProjectContinuityPinProjectionV01 {
  requireCanonicalProjectV01(db, scope, false);
  const collection = selectCollectionRowV01(db, scope);
  const rows = selectPinRowsV01(db, scope);
  if (!collection) {
    if (rows.length > 0) failV01("continuity_pin_record_invalid");
    return emptyProjectionV01(scope);
  }
  validateCollectionRowV01(collection, scope);
  if (rows.length > PROJECT_CONTINUITY_PIN_LIMIT_V01) {
    failV01("continuity_pin_record_invalid");
  }
  const pins = rows.map((row, index) => {
    const parsed = parsePinRowV01(row, scope, index);
    const resolution = resolveContinuityPinTargetV01(db, parsed.target);
    return {
      pin_handle: `pin:${row.target_key.slice(7, 31)}`,
      target: parsed.target,
      source_family_snapshot: parsed.source_family,
      source_item_id_snapshot: row.source_item_id_snapshot,
      label: resolution.label ?? row.label_snapshot,
      state_label:
        resolution.status === "resolved"
          ? resolution.state_label
          : resolution.status === "temporarily_unavailable"
            ? "Unavailable in the current projection"
            : "This pinned source is no longer supported",
      resolution_status: resolution.status,
      destination:
        resolution.status === "resolved" ? resolution.destination : null,
      exact_detail_destination:
        resolution.exact_detail_destination,
      sort_order: row.sort_order,
      pinned_at: row.pinned_at,
      updated_at: row.updated_at,
      projection_only: true,
      semantic_authority_granted: false,
      execution_authority_granted: false,
    } as const;
  });
  return {
    projection_version: PROJECT_CONTINUITY_PIN_PROJECTION_VERSION_V01,
    collection_version: PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    revision: collection.revision,
    pins,
    projection_only: true,
    semantic_authority_granted: false,
    execution_authority_granted: false,
  };
}

export function mutateProjectContinuityPinsV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    mutation: ProjectContinuityPinMutationActionV01;
  },
  dependencies: { now?: () => string } = {},
): ProjectContinuityPinMutationResultV01 {
  validateMutationInputV01(input);
  return runImmediateV01(db, () => {
    requireCanonicalProjectV01(db, input, true);
    const collection = selectCollectionRowV01(db, input);
    const rows = selectPinRowsV01(db, input);
    const currentRevision = collection?.revision ?? 0;
    if (collection) validateCollectionRowV01(collection, input);
    rows.forEach((row, index) => parsePinRowV01(row, input, index));

    if (input.mutation.action === "pin") {
      const targetKey = targetKeyV01(input.mutation.target);
      if (rows.some((row) => row.target_key === targetKey)) {
        return {
          status: "already_pinned",
          collection: readProjectContinuityPinProjectionV01(db, input),
        };
      }
      requireExpectedRevisionV01(
        input.mutation.expected_revision,
        currentRevision,
      );
      if (rows.length >= PROJECT_CONTINUITY_PIN_LIMIT_V01) {
        failV01("continuity_pin_collection_full");
      }
      const resolution = resolveContinuityPinTargetV01(
        db,
        input.mutation.target,
      );
      if (resolution.status !== "resolved" || !resolution.destination) {
        failV01("continuity_pin_target_unavailable");
      }
      const now = strictNowV01(dependencies);
      advanceCollectionRevisionV01(
        db,
        input,
        collection,
        currentRevision,
        now,
      );
      db.prepare(
        `INSERT INTO vnext_project_continuity_pins (
          workspace_id, project_id, target_key, target_ref_json,
          source_family_snapshot, source_item_id_snapshot,
          label_snapshot, state_snapshot, sort_order, pinned_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        input.workspace_id,
        input.project_id,
        targetKey,
        JSON.stringify(input.mutation.target),
        input.mutation.source_family,
        input.mutation.source_item_id,
        boundedSnapshotV01(input.mutation.label_snapshot),
        boundedSnapshotV01(input.mutation.state_snapshot),
        rows.length,
        now,
        now,
      );
      return {
        status: "pinned",
        collection: readProjectContinuityPinProjectionV01(db, input),
      };
    }

    if (input.mutation.action === "unpin") {
      const targetKey = targetKeyV01(input.mutation.target);
      if (!rows.some((row) => row.target_key === targetKey)) {
        return {
          status: "already_unpinned",
          collection: readProjectContinuityPinProjectionV01(db, input),
        };
      }
      requireExpectedRevisionV01(
        input.mutation.expected_revision,
        currentRevision,
      );
      const now = strictNowV01(dependencies);
      advanceCollectionRevisionV01(
        db,
        input,
        collection,
        currentRevision,
        now,
      );
      db.prepare(
        `DELETE FROM vnext_project_continuity_pins
         WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
      ).run(input.workspace_id, input.project_id, targetKey);
      normalizeSortOrderV01(db, input, now);
      return {
        status: "unpinned",
        collection: readProjectContinuityPinProjectionV01(db, input),
      };
    }

    const targetKeys = input.mutation.target_order.map(targetKeyV01);
    const currentKeys = rows.map((row) => row.target_key);
    if (
      targetKeys.length !== currentKeys.length ||
      new Set(targetKeys).size !== targetKeys.length ||
      targetKeys.some((targetKey) => !currentKeys.includes(targetKey))
    ) {
      failV01("continuity_pin_invalid_target");
    }
    if (targetKeys.every((targetKey, index) => targetKey === currentKeys[index])) {
      return {
        status: "order_unchanged",
        collection: readProjectContinuityPinProjectionV01(db, input),
      };
    }
    requireExpectedRevisionV01(
      input.mutation.expected_revision,
      currentRevision,
    );
    const now = strictNowV01(dependencies);
    advanceCollectionRevisionV01(
      db,
      input,
      collection,
      currentRevision,
      now,
    );
    writeTargetOrderV01(db, input, targetKeys, now);
    return {
      status: "reordered",
      collection: readProjectContinuityPinProjectionV01(db, input),
    };
  });
}

function emptyProjectionV01(scope: {
  workspace_id: string;
  project_id: string;
}): ProjectContinuityPinProjectionV01 {
  return {
    projection_version: PROJECT_CONTINUITY_PIN_PROJECTION_VERSION_V01,
    collection_version: PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    revision: 0,
    pins: [],
    projection_only: true,
    semantic_authority_granted: false,
    execution_authority_granted: false,
  };
}

function selectCollectionRowV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): CollectionRowV01 | null {
  return (
    (db
      .prepare(
        `SELECT * FROM vnext_project_continuity_pin_collections
         WHERE workspace_id = ? AND project_id = ?`,
      )
      .get(scope.workspace_id, scope.project_id) as
      | CollectionRowV01
      | undefined) ?? null
  );
}

function selectPinRowsV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): PinRowV01[] {
  return db
    .prepare(
      `SELECT * FROM vnext_project_continuity_pins
       WHERE workspace_id = ? AND project_id = ?
       ORDER BY sort_order, target_key`,
    )
    .all(scope.workspace_id, scope.project_id) as PinRowV01[];
}

function validateCollectionRowV01(
  row: CollectionRowV01,
  scope: { workspace_id: string; project_id: string },
): void {
  if (
    row.workspace_id !== scope.workspace_id ||
    row.project_id !== scope.project_id ||
    row.collection_version !==
      PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01 ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1 ||
    parseStrictIsoTimestampV01(row.created_at) === null ||
    parseStrictIsoTimestampV01(row.updated_at) === null ||
    Date.parse(row.updated_at) < Date.parse(row.created_at)
  ) {
    failV01("continuity_pin_record_invalid");
  }
}

function parsePinRowV01(
  row: PinRowV01,
  scope: { workspace_id: string; project_id: string },
  expectedOrder: number,
): {
  target: ContinuityPinTargetRefV01;
  source_family: BlankStateContinuitySourceFamilyV01;
} {
  let target: unknown;
  try {
    target = JSON.parse(row.target_ref_json);
  } catch {
    failV01("continuity_pin_record_invalid");
  }
  if (
    !isRetainedContinuityPinTargetV01(target) ||
    target.workspace_id !== scope.workspace_id ||
    target.project_id !== scope.project_id ||
    row.workspace_id !== scope.workspace_id ||
    row.project_id !== scope.project_id ||
    row.target_key !== targetKeyV01(target) ||
    row.sort_order !== expectedOrder ||
    !isSourceFamilyV01(row.source_family_snapshot) ||
    !boundedStoredTextV01(row.source_item_id_snapshot, 512) ||
    !boundedStoredTextV01(row.label_snapshot, 1024) ||
    !boundedStoredTextV01(row.state_snapshot, 1024) ||
    parseStrictIsoTimestampV01(row.pinned_at) === null ||
    parseStrictIsoTimestampV01(row.updated_at) === null ||
    Date.parse(row.updated_at) < Date.parse(row.pinned_at)
  ) {
    failV01("continuity_pin_record_invalid");
  }
  return {
    target,
    source_family:
      row.source_family_snapshot as BlankStateContinuitySourceFamilyV01,
  };
}

function advanceCollectionRevisionV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  collection: CollectionRowV01 | null,
  currentRevision: number,
  now: string,
): void {
  if (!collection) {
    if (currentRevision !== 0) failV01("continuity_pin_stale_write");
    db.prepare(
      `INSERT INTO vnext_project_continuity_pin_collections (
        workspace_id, project_id, collection_version, revision,
        created_at, updated_at
      ) VALUES (?, ?, ?, 1, ?, ?)`,
    ).run(
      scope.workspace_id,
      scope.project_id,
      PROJECT_CONTINUITY_PIN_COLLECTION_VERSION_V01,
      now,
      now,
    );
    return;
  }
  const write = db.prepare(
    `UPDATE vnext_project_continuity_pin_collections
     SET revision = revision + 1, updated_at = ?
     WHERE workspace_id = ? AND project_id = ? AND revision = ?`,
  ).run(now, scope.workspace_id, scope.project_id, currentRevision);
  if (write.changes !== 1) failV01("continuity_pin_stale_write");
}

function normalizeSortOrderV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  now: string,
): void {
  const keys = selectPinRowsV01(db, scope).map((row) => row.target_key);
  writeTargetOrderV01(db, scope, keys, now);
}

function writeTargetOrderV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  targetKeys: string[],
  now: string,
): void {
  db.prepare(
    `UPDATE vnext_project_continuity_pins
     SET sort_order = sort_order + 1000, updated_at = ?
     WHERE workspace_id = ? AND project_id = ?`,
  ).run(now, scope.workspace_id, scope.project_id);
  const statement = db.prepare(
    `UPDATE vnext_project_continuity_pins
     SET sort_order = ?, updated_at = ?
     WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
  );
  targetKeys.forEach((targetKey, index) => {
    const write = statement.run(
      index,
      now,
      scope.workspace_id,
      scope.project_id,
      targetKey,
    );
    if (write.changes !== 1) failV01("continuity_pin_invalid_target");
  });
}

function requireCanonicalProjectV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
  requireActive: boolean,
): void {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace || workspace.workspace_id !== scope.workspace_id) {
    failV01("continuity_pin_project_mismatch");
  }
  let project;
  try {
    project = readCanonicalProjectIdentityV01(db, scope);
  } catch {
    failV01("continuity_pin_project_not_found");
  }
  if (!project) failV01("continuity_pin_project_not_found");
  if (
    requireActive &&
    readActiveProjectSelectionV01(db, scope.workspace_id)?.project_id !==
      scope.project_id
  ) {
    failV01("continuity_pin_project_mismatch");
  }
}

function validateMutationInputV01(input: {
  workspace_id: string;
  project_id: string;
  mutation: ProjectContinuityPinMutationActionV01;
}): void {
  if (
    !boundedStoredTextV01(input.workspace_id, 256) ||
    !boundedStoredTextV01(input.project_id, 256) ||
    !Number.isSafeInteger(input.mutation.expected_revision) ||
    input.mutation.expected_revision < 0
  ) {
    failV01("continuity_pin_request_invalid");
  }
  const targets =
    input.mutation.action === "reorder"
      ? input.mutation.target_order
      : [input.mutation.target];
  if (
    targets.length > PROJECT_CONTINUITY_PIN_LIMIT_V01 ||
    targets.some(
      (target) =>
        !isRetainedContinuityPinTargetV01(target) ||
        target.workspace_id !== input.workspace_id ||
        target.project_id !== input.project_id,
    )
  ) {
    failV01("continuity_pin_invalid_target");
  }
  if (
    input.mutation.action === "pin" &&
    (!isSupportedContinuityPinTargetV01(input.mutation.target) ||
      !isSourceFamilyV01(input.mutation.source_family) ||
      !boundedStoredTextV01(input.mutation.source_item_id, 512) ||
      !boundedStoredTextV01(input.mutation.label_snapshot, 1024) ||
      !boundedStoredTextV01(input.mutation.state_snapshot, 1024))
  ) {
    failV01("continuity_pin_request_invalid");
  }
}

function requireExpectedRevisionV01(
  expectedRevision: number,
  currentRevision: number,
): void {
  if (expectedRevision !== currentRevision) {
    throw new ProjectContinuityPinStoreErrorV01(
      "continuity_pin_stale_write",
      currentRevision,
    );
  }
}

function targetKeyV01(target: ContinuityPinTargetRefV01): string {
  return `sha256:${createHash("sha256")
    .update(continuityPinTargetIdentityV01(target))
    .digest("hex")}`;
}

function strictNowV01(dependencies: { now?: () => string }): string {
  const value = (dependencies.now ?? (() => new Date().toISOString()))();
  if (parseStrictIsoTimestampV01(value) === null) {
    failV01("continuity_pin_request_invalid");
  }
  return value;
}

function boundedSnapshotV01(value: string): string {
  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  if (!normalized || normalized.length > 1024) {
    failV01("continuity_pin_request_invalid");
  }
  return normalized;
}

function boundedStoredTextV01(value: unknown, limit: number): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length > 0 &&
    value.length <= limit &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}

function isSourceFamilyV01(
  value: unknown,
): value is BlankStateContinuitySourceFamilyV01 {
  return [
    "project_lifecycle",
    "delegated_work",
    "current_run",
    "saved_result",
    "project_attention",
    "recent_change",
    "continuation",
  ].includes(String(value));
}

function runImmediateV01<T>(
  db: Database.Database,
  operation: () => T,
): T {
  return db.inTransaction ? operation() : db.transaction(operation).immediate();
}

function failV01(code: ProjectContinuityPinStoreErrorCodeV01): never {
  throw new ProjectContinuityPinStoreErrorV01(code);
}
