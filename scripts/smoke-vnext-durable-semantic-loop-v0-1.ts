import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { Socket } from "node:net";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import {
  DURABLE_LOCAL_LOOP_APPLIED_AT,
  DURABLE_LOCAL_LOOP_CONFIRMED_AT,
  DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
  DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  DURABLE_LOCAL_LOOP_PREVIEWED_AT,
  DURABLE_LOCAL_LOOP_RECORDED_AT,
  buildDurableLocalClosedLoopProjectAFixtureV01,
} from "../fixtures/vnext/runtime/durable-local-closed-loop-v0-1";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  deriveVNextSemanticTargetKeyV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  insertVNextSemanticStateEntryV01,
  listVNextSemanticStateEntriesV01,
  readVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  commitVNextSemanticTransitionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  validateStateTransitionReceiptAgainstEligibilityV01,
} from "../lib/vnext/state-transition-eligibility";
import { validateStateTransitionReceiptV01 } from "../lib/vnext/state-transition-receipt";
import type { ExternalRefV01 } from "../types/vnext/external-ref";
import type { StateTransitionReceiptV01 } from "../types/vnext/state-transition-receipt";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = requireIsolatedDatabasePath(process.env.AUGNES_DB_PATH);
const ownedDatabaseFiles = [dbPath, `${dbPath}-wal`, `${dbPath}-shm`];
const databaseExistedAtStart = existsSync(dbPath);
for (const sideFile of ownedDatabaseFiles.slice(1)) {
  assert.equal(
    existsSync(sideFile),
    false,
    `durable semantic smoke will not adopt a database with an existing side file: ${sideFile}`,
  );
}

mkdirSync(dirname(dbPath), { recursive: true });

const providerEnvironmentKeys = [
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GITHUB_TOKEN",
  "OPENAI_API_KEY",
] as const;
const originalProviderEnvironment = new Map(
  providerEnvironmentKeys.map((key) => [key, process.env[key]]),
);
for (const key of providerEnvironmentKeys) delete process.env[key];

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
let networkCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "vNext durable semantic loop smoke must not make fetch/provider/network calls",
  );
};
const originalSocketConnect = Socket.prototype.connect;
Socket.prototype.connect = function blockedNetworkConnect(..._args: unknown[]) {
  networkCalls += 1;
  throw new Error(
    "vNext durable semantic loop smoke must not make runtime network calls",
  );
} as typeof Socket.prototype.connect;

let db: Database.Database | null = null;
let summary: Record<string, unknown> | null = null;
const snapshotTables = [
  "state_delta_proposals",
  "state_entries",
  "state_transitions",
  "vnext_core_records",
  "vnext_semantic_state_entries",
] as const;
const legacyStateTables = [
  "state_delta_proposals",
  "state_entries",
  "state_transitions",
] as const;

try {
  db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  ensureVNextDurableSemanticStoreSchemaV01(db);
  const legacyMode = prepareLegacyTables(db);
  const initialSnapshot = readDatabaseSnapshot(db);
  const legacyBaseline = readLegacySnapshot(initialSnapshot);
  assert.equal(
    initialSnapshot.counts.vnext_core_records,
    0,
    "isolated durable smoke starts with an empty vNext immutable ledger",
  );
  assert.equal(
    initialSnapshot.counts.vnext_semantic_state_entries,
    0,
    "isolated durable smoke starts with an empty vNext state projection",
  );

  const prefix = buildDurableLocalClosedLoopProjectAFixtureV01();
  const persistedReview = persistVNextSemanticReviewMaterialV01(db, {
    proposal: prefix.proposal,
    decision: prefix.decision,
  });
  assert.equal(persistedReview.proposal_record.status, "inserted");
  assert.equal(persistedReview.decision_record.status, "inserted");

  const persistedPrefixSnapshot = readDatabaseSnapshot(db);
  assert.equal(
    persistedPrefixSnapshot.counts.vnext_core_records,
    2,
    "prefix persistence stores exactly proposal and decision records",
  );
  assertLegacySnapshotUnchanged(persistedPrefixSnapshot, legacyBaseline);

  const authorizedApplierRef = directLocalRef(
    "semantic_transition_applier",
    `local-core-applier:${prefix.project.project_id}`,
    DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
    createProtocolSha256V01(
      `local-core-applier|${prefix.project.workspace_id}|${prefix.project.project_id}`,
    ),
  );
  const preview = prepareVNextSemanticCommitPreviewV01(db, {
    workspace_id: prefix.project.workspace_id,
    project_id: prefix.project.project_id,
    proposal_id: prefix.proposal.proposal_id,
    proposal_fingerprint: prefix.proposal.integrity.fingerprint,
    decision_id: prefix.decision.decision_id,
    decision_fingerprint: prefix.decision.integrity.fingerprint,
    current_state_observed_at: DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
    previewed_at: DURABLE_LOCAL_LOOP_PREVIEWED_AT,
  });
  assert.equal(preview.intended_effects.length, 1);
  assert.equal(preview.intended_effects[0]?.operation, "create");
  assert.deepEqual(
    readDatabaseSnapshot(db),
    persistedPrefixSnapshot,
    "semantic commit preview writes zero rows",
  );

  const confirmationDigest = requireString(
    preview,
    ["confirmation_digest"],
    "preview confirmation digest",
  );
  const authorization = recordVNextSemanticCommitAuthorizationV01(db, {
    preview,
    confirmation_digest: confirmationDigest,
    operator_actor_ref: prefix.decision.actor_ref,
    confirmed_at: DURABLE_LOCAL_LOOP_CONFIRMED_AT,
    confirmation_observation_ref: directLocalRef(
      "semantic_commit_confirmation",
      `confirmation:${prefix.project.project_id}:${confirmationDigest}`,
      DURABLE_LOCAL_LOOP_CONFIRMED_AT,
      confirmationDigest,
    ),
    authorized_applier_ref: authorizedApplierRef,
    gate_evaluated_at: DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
    gate_expires_at: DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
    eligibility_evaluated_at: DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
  });
  assertAcceptedResult(
    authorization,
    ["inserted", "exact_replay"],
    "semantic commit authorization",
  );

  const gateRecordId = requireString(
    authorization,
    ["gate_record_id", "record_id", "gate_record.gate_record_id"],
    "gate record id",
  );
  const gateRecordFingerprint = requireString(
    authorization,
    [
      "gate_record_fingerprint",
      "fingerprint",
      "gate_record.integrity.fingerprint",
    ],
    "gate record fingerprint",
  );
  const authorizedSnapshot = readDatabaseSnapshot(db);
  assert.equal(
    authorizedSnapshot.counts.vnext_core_records,
    persistedPrefixSnapshot.counts.vnext_core_records + 1,
    "authorization persists exactly one gate record",
  );
  assert.equal(
    authorizedSnapshot.counts.vnext_semantic_state_entries,
    0,
    "authorization does not write semantic state",
  );
  assertLegacySnapshotUnchanged(authorizedSnapshot, legacyBaseline);

  const commitInput = {
    workspace_id: prefix.project.workspace_id,
    project_id: prefix.project.project_id,
    proposal_id: prefix.proposal.proposal_id,
    proposal_fingerprint: prefix.proposal.integrity.fingerprint,
    decision_id: prefix.decision.decision_id,
    decision_fingerprint: prefix.decision.integrity.fingerprint,
    gate_record_id: gateRecordId,
    gate_record_fingerprint: gateRecordFingerprint,
    applied_at: DURABLE_LOCAL_LOOP_APPLIED_AT,
    recorded_at: DURABLE_LOCAL_LOOP_RECORDED_AT,
  };
  const committed = commitVNextSemanticTransitionV01(db, commitInput);
  assert.equal(committed.status, "applied", "single-target accept/create applies");
  assert(committed.transition_receipt, "applied result returns a StateTransitionReceipt");
  assert(committed.semantic_state, "create writes one semantic-state record");
  assert(committed.projection, "create writes one current-state projection");

  const receipt = committed.transition_receipt as StateTransitionReceiptV01;
  const receiptValidation = validateStateTransitionReceiptV01(receipt);
  assert.equal(receiptValidation.status, "valid", JSON.stringify(receiptValidation));
  const receiptRelation = validateStateTransitionReceiptAgainstEligibilityV01({
    receipt,
    proposal: prefix.proposal,
    decision: prefix.decision,
    current_state_observations:
      authorization.eligibility_input.current_state_observations,
    semantic_commit_gate_evaluation:
      authorization.eligibility_input.semantic_commit_gate_evaluation,
    prior_review_decisions:
      authorization.eligibility_input.prior_review_decisions,
    prior_state_transition_receipts:
      authorization.eligibility_input.prior_state_transition_receipts,
    evaluated_at: authorization.eligibility_input.evaluated_at,
  });
  assert.equal(receiptRelation.status, "valid", JSON.stringify(receiptRelation));

  const appliedSnapshot = readDatabaseSnapshot(db);
  assert.equal(
    appliedSnapshot.counts.vnext_core_records,
    authorizedSnapshot.counts.vnext_core_records + 2,
    "commit stores exactly semantic-state and receipt records",
  );
  assert.equal(
    appliedSnapshot.counts.vnext_semantic_state_entries,
    1,
    "commit creates exactly one current-state projection row",
  );
  assertLegacySnapshotUnchanged(appliedSnapshot, legacyBaseline);

  const replay = commitVNextSemanticTransitionV01(db, commitInput);
  assert.equal(replay.status, "exact_replay", "exact commit replay is recognized");
  assert.deepEqual(replay.transition_receipt, receipt, "exact replay returns the stored receipt");
  assert.deepEqual(
    readDatabaseSnapshot(db),
    appliedSnapshot,
    "exact replay creates no rows and increments no revision",
  );

  const alteredProposal = clone(prefix.proposal);
  alteredProposal.compatibility.warnings = [
    ...alteredProposal.compatibility.warnings,
    "Altered same-identity payload must fail closed.",
  ];
  assertFailsClosed(
    () =>
      persistVNextSemanticReviewMaterialV01(db!, {
        proposal: alteredProposal,
        decision: prefix.decision,
      }),
    "same proposal identity with altered payload",
  );
  assert.deepEqual(
    readDatabaseSnapshot(db),
    appliedSnapshot,
    "conflicting same-identity payload writes nothing",
  );

  const stateRecord = committed.semantic_state;
  const persistedReceiptRow = requireCoreRecord(
    db,
    "state_transition_receipt",
    receipt.transition_receipt_id,
  );
  assert.equal(persistedReceiptRow.fingerprint, receipt.integrity.fingerprint);
  assert.deepEqual(JSON.parse(persistedReceiptRow.payload_json), receipt);
  assert.equal(db.pragma("integrity_check", { simple: true }), "ok");

  const migrationCoverage = runMigrationCoverage(dirname(dbPath));

  db.pragma("wal_checkpoint(TRUNCATE)");
  db.close();
  db = null;

  db = new Database(dbPath, { readonly: true, fileMustExist: true });
  db.pragma("foreign_keys = ON");
  const reopenedSnapshot = readDatabaseSnapshot(db);
  assert.deepEqual(reopenedSnapshot, appliedSnapshot, "close/reopen preserves exact rows and hashes");
  assert.deepEqual(
    JSON.parse(
      requireCoreRecord(
        db,
        "state_transition_receipt",
        receipt.transition_receipt_id,
      ).payload_json,
    ),
    receipt,
    "close/reopen preserves exact receipt payload",
  );
  assert.equal(db.pragma("integrity_check", { simple: true }), "ok");

  assert.equal(fetchCalls, 0, "durable semantic smoke makes zero fetch calls");
  assert.equal(networkCalls, 0, "durable semantic smoke makes zero runtime network calls");
  summary = {
    smoke: "vnext-durable-semantic-loop-v0-1",
    phase: "M3C-A isolated SQLite pilot",
    status: "pass",
    project_fixture: prefix.project.fixture_id,
    database_mode:
      databaseExistedAtStart && legacyMode === "canonical"
        ? "preinitialized_temp_canonical"
        : "standalone_phase_a",
    positive_cases: 14,
    negative_cases: 3,
    fetch_calls: fetchCalls,
    provider_calls: 0,
    network_calls: networkCalls,
    legacy_table_deltas: {
      state_delta_proposals: 0,
      state_entries: 0,
      state_transitions: 0,
    },
    legacy_table_baseline: legacyBaseline,
    anchors: {
      semantic_state_content_fingerprint: requireString(
        stateRecord,
        ["state_content_fingerprint"],
        "semantic-state content fingerprint",
      ),
      semantic_state_record_id: requireString(
        stateRecord,
        ["semantic_state_record_id"],
        "semantic-state record id",
      ),
      semantic_state_record_fingerprint: requireString(
        stateRecord,
        ["integrity.fingerprint"],
        "semantic-state record fingerprint",
      ),
      confirmation_digest: confirmationDigest,
      gate_record_id: gateRecordId,
      gate_record_fingerprint: gateRecordFingerprint,
      transition_receipt_id: receipt.transition_receipt_id,
      transition_idempotency_key: receipt.idempotency_key,
      transition_receipt_fingerprint: receipt.integrity.fingerprint,
      pre_transition_db_checksum: authorizedSnapshot.logical_checksum,
      post_transition_db_checksum: appliedSnapshot.logical_checksum,
      reopened_db_checksum: reopenedSnapshot.logical_checksum,
      db_checksum_scope: "vnext_core_records_and_vnext_semantic_state_entries",
    },
    rows: reopenedSnapshot.counts,
    receipt_validation: receiptValidation.status,
    receipt_relation_validation: receiptRelation.status,
    exact_replay: true,
    conflicting_identity_blocked: true,
    integrity_check: "ok",
    migration_coverage: migrationCoverage,
  };
} finally {
  if (db?.open) db.close();
  globalThis.fetch = originalFetch;
  Socket.prototype.connect = originalSocketConnect;
  for (const [key, value] of originalProviderEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const filePath of ownedDatabaseFiles) rmSync(filePath, { force: true });
}

for (const filePath of ownedDatabaseFiles) {
  assert.equal(existsSync(filePath), false, `smoke removes owned database file: ${filePath}`);
}
assert(summary, "durable semantic smoke must produce a summary");
summary.database_files_removed = true;
console.log(JSON.stringify(summary, null, 2));

interface DatabaseSnapshot {
  counts: Record<string, number>;
  table_hashes: Record<string, string>;
  logical_checksum: string;
  full_logical_checksum: string;
}

function requireIsolatedDatabasePath(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("AUGNES_DB_PATH must name an explicit isolated database path");
  }
  const requestedPath = value.trim();
  assert(isAbsolute(requestedPath), "AUGNES_DB_PATH must be absolute");
  const normalized = resolve(requestedPath);
  const relativeToRepo = relative(repoRoot, normalized);
  assert(
    relativeToRepo === ".." || relativeToRepo.startsWith(`..${sep}`),
    "AUGNES_DB_PATH must remain outside the repository and default product database",
  );
  assert.notEqual(normalized, resolve(repoRoot, "data/augnes.db"));
  return normalized;
}

function prepareLegacyTables(
  database: Database.Database,
): "canonical" | "phase_a_sentinel" {
  const existing = legacyStateTables.filter((table) => tableExists(database, table));
  if (existing.length === legacyStateTables.length) return "canonical";
  assert.equal(
    existing.length,
    0,
    "isolated smoke database must have either all canonical legacy state tables or none",
  );
  for (const table of legacyStateTables) {
    database.exec(
      `CREATE TABLE IF NOT EXISTS ${table} (sentinel_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL)`,
    );
    database
      .prepare(
        `INSERT INTO ${table} (sentinel_id, payload_json) VALUES (?, ?) ON CONFLICT(sentinel_id) DO NOTHING`,
      )
      .run(`sentinel:${table}`, JSON.stringify({ table, untouched: true }));
  }
  return "phase_a_sentinel";
}

function readDatabaseSnapshot(database: Database.Database): DatabaseSnapshot {
  const rowsByTable = Object.fromEntries(
    snapshotTables.map((table) => {
      const rows = database
        .prepare(`SELECT * FROM ${table}`)
        .all()
        .map((row) => canonicalizeProtocolValueV01(row))
        .sort();
      return [table, rows];
    }),
  ) as Record<string, string[]>;
  const counts = Object.fromEntries(
    snapshotTables.map((table) => [table, rowsByTable[table]!.length]),
  );
  const tableHashes = Object.fromEntries(
    snapshotTables.map((table) => [table, sha256(rowsByTable[table]!.join("\n"))]),
  );
  return {
    counts,
    table_hashes: tableHashes,
    logical_checksum: sha256(
      canonicalizeProtocolValueV01({
        vnext_core_records: rowsByTable.vnext_core_records,
        vnext_semantic_state_entries:
          rowsByTable.vnext_semantic_state_entries,
      }),
    ),
    full_logical_checksum: sha256(canonicalizeProtocolValueV01(rowsByTable)),
  };
}

interface LegacySnapshot {
  counts: Record<string, number>;
  table_hashes: Record<string, string>;
}

function readLegacySnapshot(snapshot: DatabaseSnapshot): LegacySnapshot {
  return {
    counts: Object.fromEntries(
      legacyStateTables.map((table) => [table, snapshot.counts[table]!]),
    ),
    table_hashes: Object.fromEntries(
      legacyStateTables.map((table) => [table, snapshot.table_hashes[table]!]),
    ),
  };
}

function assertLegacySnapshotUnchanged(
  snapshot: DatabaseSnapshot,
  baseline: LegacySnapshot,
) {
  for (const table of legacyStateTables) {
    assert.equal(
      snapshot.counts[table],
      baseline.counts[table],
      `${table} row count remains unchanged`,
    );
    assert.equal(
      snapshot.table_hashes[table],
      baseline.table_hashes[table],
      `${table} logical row hash remains unchanged`,
    );
  }
}

function runMigrationCoverage(parentDirectory: string) {
  const suffix = `${process.pid}`;
  const freshPath = resolve(parentDirectory, `m3c-migration-fresh-${suffix}.db`);
  const legacyPath = resolve(parentDirectory, `m3c-migration-legacy-${suffix}.db`);
  const backupPath = resolve(parentDirectory, `m3c-migration-backup-${suffix}.db`);
  const restoredPath = resolve(parentDirectory, `m3c-migration-restored-${suffix}.db`);
  const ownedPaths = [freshPath, legacyPath, backupPath, restoredPath].flatMap(
    (path) => [path, `${path}-wal`, `${path}-shm`],
  );
  for (const path of ownedPaths) {
    assert.equal(existsSync(path), false, `migration rehearsal owns fresh path ${path}`);
  }

  let fresh: Database.Database | null = null;
  let legacy: Database.Database | null = null;
  let restored: Database.Database | null = null;
  try {
    fresh = new Database(freshPath);
    fresh.pragma("foreign_keys = ON");
    ensureVNextDurableSemanticStoreSchemaV01(fresh);
    assertVNextTablesExistAndEmpty(fresh, "fresh migration");
    const firstSchemaHash = schemaHash(fresh);
    ensureVNextDurableSemanticStoreSchemaV01(fresh);
    assert.equal(schemaHash(fresh), firstSchemaHash, "repeated fresh migration is idempotent");

    assertMalformedJsonConstraints(fresh);
    assertProjectIsolation(fresh);
    assert.equal(fresh.pragma("integrity_check", { simple: true }), "ok");

    legacy = new Database(legacyPath);
    legacy.pragma("foreign_keys = ON");
    createLegacyMigrationFixture(legacy);
    const legacyBefore = readNamedTablesSnapshot(legacy, legacyStateTables);
    ensureVNextDurableSemanticStoreSchemaV01(legacy);
    assertVNextTablesExistAndEmpty(legacy, "legacy-only additive migration");
    ensureVNextDurableSemanticStoreSchemaV01(legacy);
    assert.deepEqual(
      readNamedTablesSnapshot(legacy, legacyStateTables),
      legacyBefore,
      "additive and repeated migrations preserve legacy rows and logical hashes",
    );
    assert.equal(legacy.pragma("integrity_check", { simple: true }), "ok");
    const upgradedLegacySnapshot = readNamedTablesSnapshot(legacy, [
      ...legacyStateTables,
      "vnext_core_records",
      "vnext_semantic_state_entries",
    ]);
    legacy.pragma("wal_checkpoint(TRUNCATE)");
    copyFileSync(legacyPath, backupPath);
    copyFileSync(backupPath, restoredPath);

    restored = new Database(restoredPath, { readonly: true, fileMustExist: true });
    restored.pragma("foreign_keys = ON");
    assert.deepEqual(
      readNamedTablesSnapshot(restored, [
        ...legacyStateTables,
        "vnext_core_records",
        "vnext_semantic_state_entries",
      ]),
      upgradedLegacySnapshot,
      "backup/restore preserves exact legacy and vNext rows and logical hashes",
    );
    assert.equal(restored.pragma("integrity_check", { simple: true }), "ok");

    return {
      status: "pass",
      positive_cases: 7,
      negative_cases: 3,
      fresh_creation: true,
      legacy_only_additive_upgrade: true,
      repeated_migration: true,
      legacy_rows_and_hashes_unchanged: true,
      new_tables_initially_empty: true,
      malformed_json_constraints_blocked: 2,
      invalid_presence_constraints_blocked: 1,
      project_isolation: true,
      backup_restore: true,
      restored_legacy_rows_unchanged: true,
      integrity_check: "ok",
      restored_logical_checksum: upgradedLegacySnapshot.logical_checksum,
    };
  } finally {
    if (fresh?.open) fresh.close();
    if (legacy?.open) legacy.close();
    if (restored?.open) restored.close();
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `migration rehearsal removes ${path}`);
    }
  }
}

function assertVNextTablesExistAndEmpty(
  database: Database.Database,
  label: string,
) {
  for (const table of ["vnext_core_records", "vnext_semantic_state_entries"]) {
    assert.equal(tableExists(database, table), true, `${label} creates ${table}`);
    const count = database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
      count: number;
    };
    assert.equal(count.count, 0, `${label} leaves ${table} empty`);
  }
}

function assertMalformedJsonConstraints(database: Database.Database) {
  const fingerprint = createProtocolSha256V01("malformed-json-constraint");
  assert.throws(
    () =>
      database
        .prepare(
          `INSERT INTO vnext_core_records (
            record_kind, record_id, workspace_id, project_id, fingerprint,
            idempotency_key, payload_json, created_at
          ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
        )
        .run(
          "run_receipt",
          "run-receipt:malformed-json",
          "workspace:migration",
          "project:migration",
          fingerprint,
          "{",
          DURABLE_LOCAL_LOOP_RECORDED_AT,
        ),
    /CHECK constraint failed/,
    "immutable ledger rejects malformed JSON",
  );
  assert.throws(
    () =>
      database
        .prepare(
          `INSERT INTO vnext_semantic_state_entries (
            workspace_id, project_id, presence, target_key, target_ref_json, state_ref_json,
            current_state_fingerprint, bounded_state_summary,
            source_proposal_id, source_proposal_fingerprint,
            source_candidate_id, source_candidate_fingerprint,
            source_transition_receipt_id, source_transition_receipt_fingerprint,
            revision, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "workspace:migration",
          "project:migration",
          "present",
          fingerprint,
          "{",
          "{}",
          fingerprint,
          "Malformed JSON must be rejected.",
          "proposal:migration",
          fingerprint,
          "candidate:migration",
          fingerprint,
          "receipt:migration",
          fingerprint,
          1,
          DURABLE_LOCAL_LOOP_RECORDED_AT,
        ),
    /CHECK constraint failed/,
    "current-state projection rejects malformed JSON",
  );
  assert.throws(
    () =>
      database
        .prepare(
          `INSERT INTO vnext_semantic_state_entries (
            workspace_id, project_id, presence, target_key, target_ref_json, state_ref_json,
            current_state_fingerprint, bounded_state_summary,
            source_proposal_id, source_proposal_fingerprint,
            source_candidate_id, source_candidate_fingerprint,
            source_transition_receipt_id, source_transition_receipt_fingerprint,
            revision, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "workspace:migration",
          "project:migration",
          "absent",
          fingerprint,
          "{}",
          "{}",
          fingerprint,
          "Absent state must not be stored as a projection row.",
          "proposal:migration",
          fingerprint,
          "candidate:migration",
          fingerprint,
          "receipt:migration",
          fingerprint,
          1,
          DURABLE_LOCAL_LOOP_RECORDED_AT,
        ),
    /CHECK constraint failed/,
    "current-state projection rejects absent presence rows",
  );
}

function assertProjectIsolation(database: Database.Database) {
  const workspaceId = "workspace:migration-isolation";
  const projectIds = ["project:migration-a", "project:migration-b"] as const;
  for (const projectId of projectIds) {
    const payload = { fixture: "migration-project-isolation", project_id: projectId };
    const fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(payload),
    );
    insertVNextCoreRecordV01(database, {
      record_kind: "run_receipt",
      record_id: `run-receipt:${projectId}`,
      workspace_id: workspaceId,
      project_id: projectId,
      fingerprint,
      idempotency_key: null,
      payload,
      created_at: DURABLE_LOCAL_LOOP_RECORDED_AT,
    });
  }
  const recordA = readVNextCoreRecordV01(database, {
    record_kind: "run_receipt",
    record_id: "run-receipt:project:migration-a",
    workspace_id: workspaceId,
    project_id: projectIds[0],
  });
  assert(recordA, "project A record resolves in project A");
  assert.equal(
    readVNextCoreRecordV01(database, {
      record_kind: "run_receipt",
      record_id: recordA.record_id,
      workspace_id: workspaceId,
      project_id: projectIds[1],
    }),
    null,
    "project A record does not resolve in project B",
  );

  const targetRef = directLocalRef(
    "migration_target",
    "shared-repository-target",
    DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
    createProtocolSha256V01("shared-repository-target"),
  );
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  for (const projectId of projectIds) {
    const stateFingerprint = createProtocolSha256V01(`state|${projectId}`);
    insertVNextSemanticStateEntryV01(database, {
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: targetKey,
      presence: "present",
      target_ref: targetRef,
      state_ref: directLocalRef(
        "accepted_semantic_state",
        `semantic-state:${projectId}`,
        DURABLE_LOCAL_LOOP_RECORDED_AT,
        stateFingerprint,
      ),
      state_fingerprint: stateFingerprint,
      bounded_state_summary: `Project-isolated state for ${projectId}.`,
      source_proposal_id: `proposal:${projectId}`,
      source_proposal_fingerprint: createProtocolSha256V01(`proposal|${projectId}`),
      source_candidate_id: `candidate:${projectId}`,
      source_candidate_fingerprint: createProtocolSha256V01(`candidate|${projectId}`),
      source_transition_receipt_id: `receipt:${projectId}`,
      source_transition_receipt_fingerprint: createProtocolSha256V01(
        `receipt|${projectId}`,
      ),
      revision: 1,
      updated_at: DURABLE_LOCAL_LOOP_RECORDED_AT,
    });
  }
  assert.equal(
    listVNextSemanticStateEntriesV01(database, {
      workspace_id: workspaceId,
      project_id: projectIds[0],
    }).length,
    1,
  );
  assert.equal(
    listVNextSemanticStateEntriesV01(database, {
      workspace_id: workspaceId,
      project_id: projectIds[1],
    }).length,
    1,
  );
  assert.equal(
    listVNextSemanticStateEntriesV01(database, {
      workspace_id: workspaceId,
      project_id: "project:migration-foreign",
    }).length,
    0,
  );
}

function createLegacyMigrationFixture(database: Database.Database) {
  for (const table of legacyStateTables) {
    database.exec(
      `CREATE TABLE ${table} (legacy_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL)`,
    );
    database
      .prepare(`INSERT INTO ${table} (legacy_id, payload_json) VALUES (?, ?)`)
      .run(`legacy:${table}`, JSON.stringify({ table, preserved: true }));
  }
}

function readNamedTablesSnapshot(
  database: Database.Database,
  tables: readonly string[],
) {
  const rowsByTable = Object.fromEntries(
    tables.map((table) => {
      const rows = database
        .prepare(`SELECT * FROM ${table}`)
        .all()
        .map((row) => canonicalizeProtocolValueV01(row))
        .sort();
      return [table, rows];
    }),
  );
  return {
    counts: Object.fromEntries(
      tables.map((table) => [
        table,
        (rowsByTable[table] as string[]).length,
      ]),
    ),
    table_hashes: Object.fromEntries(
      tables.map((table) => [
        table,
        sha256((rowsByTable[table] as string[]).join("\n")),
      ]),
    ),
    logical_checksum: sha256(canonicalizeProtocolValueV01(rowsByTable)),
  };
}

function schemaHash(database: Database.Database): string {
  const rows = database
    .prepare(
      `SELECT type, name, tbl_name, sql FROM sqlite_master
       WHERE name LIKE 'vnext_%' OR name LIKE 'idx_vnext_%' OR name LIKE 'trg_vnext_%'
       ORDER BY type, name`,
    )
    .all();
  return sha256(canonicalizeProtocolValueV01(rows));
}

function tableExists(database: Database.Database, table: string): boolean {
  return Boolean(
    database
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table),
  );
}

function directLocalRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: "direct_local_observation",
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: "augnes.vnext.durable-local-loop.smoke.v0.1",
  };
}

function requireCoreRecord(
  database: Database.Database,
  recordKind: string,
  recordId: string,
): { fingerprint: string; payload_json: string } {
  const row = database
    .prepare(
      `SELECT fingerprint, payload_json FROM vnext_core_records WHERE record_kind = ? AND record_id = ?`,
    )
    .get(recordKind, recordId) as
    | { fingerprint: string; payload_json: string }
    | undefined;
  assert(row, `missing persisted ${recordKind} record ${recordId}`);
  return row;
}

function assertAcceptedResult(
  value: unknown,
  acceptedStatuses: readonly string[],
  label: string,
) {
  assert(value && typeof value === "object", `${label} returns an object`);
  const status = (value as Record<string, unknown>).status;
  if (typeof status === "string") {
    assert(
      acceptedStatuses.includes(status),
      `${label} status ${status} must be one of ${acceptedStatuses.join(", ")}`,
    );
  }
}

function assertFailsClosed(action: () => unknown, label: string) {
  let threw = false;
  let result: unknown;
  try {
    result = action();
  } catch {
    threw = true;
  }
  if (threw) return;
  assert(result && typeof result === "object", `${label} must throw or return a blocked result`);
  const status = (result as Record<string, unknown>).status;
  assert(
    typeof status === "string" &&
      ["blocked", "conflict", "conflicting_identity", "invalid"].includes(status),
    `${label} must fail closed, got ${String(status)}`,
  );
}

function requireString(
  value: unknown,
  paths: readonly string[],
  label: string,
): string {
  for (const path of paths) {
    const candidate = atPath(value, path);
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }
  throw new Error(`${label} missing at ${paths.join(" or ")}`);
}

function atPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
