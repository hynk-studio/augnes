import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { Socket } from "node:net";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import {
  DURABLE_LOCAL_LOOP_APPLIED_AT,
  DURABLE_LOCAL_LOOP_CONFIRMED_AT,
  DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
  DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
  DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
  DURABLE_LOCAL_LOOP_FOLLOWUP_CONFIRMED_AT,
  DURABLE_LOCAL_LOOP_FOLLOWUP_CURRENT_STATE_OBSERVED_AT,
  DURABLE_LOCAL_LOOP_FOLLOWUP_ELIGIBILITY_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_FOLLOWUP_GATE_EVALUATED_AT,
  DURABLE_LOCAL_LOOP_FOLLOWUP_PREVIEWED_AT,
  DURABLE_LOCAL_LOOP_PREVIEWED_AT,
  DURABLE_LOCAL_LOOP_RECORDED_AT,
  buildDurableLocalSemanticGateScenariosV01,
  buildDurableLocalSemanticGateScenariosForProjectV01,
  durableLocalClosedLoopProjectBFixture,
  type DurableLocalSemanticGateScenarioV01,
} from "../fixtures/vnext/runtime/durable-local-closed-loop-v0-1";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "../lib/vnext/episode-delta-proposal";
import {
  buildReviewDecisionV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "../lib/vnext/review-decision";
import {
  buildTaskContextPacketV01,
  validateTaskContextPacketV01,
} from "../lib/vnext/task-context-packet";
import {
  countVNextCoreRecordsV01,
  VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
  buildVNextPersistedSemanticStateV01,
  deriveVNextSemanticTargetKeyV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  insertVNextSemanticStateEntryV01,
  insertVNextSemanticTargetHeadV01,
  listVNextSemanticStateEntriesV01,
  readVNextCoreRecordV01,
  readVNextSemanticTargetHeadV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  runLocalContextUseProbeV01,
  validateLocalContextUseProbeRunReceiptV01,
} from "../lib/vnext/adapters/local-context-use-probe";
import {
  commitVNextSemanticTransitionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
  type VNextSemanticCommitAuthorizationResultV01,
  type VNextSemanticCommitGateRecordV01,
  type VNextSemanticCommitPreviewV01,
} from "../lib/vnext/runtime/durable-semantic-transition";
import {
  validateSemanticTransitionFullChainV01,
  validateStateTransitionReceiptAgainstEligibilityV01,
  validateTaskContextPacketTransitionRelationV01,
} from "../lib/vnext/state-transition-eligibility";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
} from "../lib/vnext/run-receipt";
import {
  buildStateTransitionReceiptV01,
  validateStateTransitionReceiptV01,
} from "../lib/vnext/state-transition-receipt";
import { createSemanticTransitionDecisionInputV01 } from "../fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import type { ExternalRefV01 } from "../types/vnext/external-ref";
import type { StateTransitionReceiptV01 } from "../types/vnext/state-transition-receipt";
import type { StateTransitionReceiptBuilderInputV01 } from "../types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { vNextDurableSemanticStoreSchemaSqlV01 } from "./db-migrations.mjs";

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
  "vnext_semantic_target_heads",
] as const;
const legacyStateTables = [
  "state_delta_proposals",
  "state_entries",
  "state_transitions",
] as const;
const DURABLE_LOCAL_LOOP_FOLLOWUP_APPLIED_AT = "2026-07-10T14:13:00.000Z";
const DURABLE_LOCAL_LOOP_FOLLOWUP_RECORDED_AT = "2026-07-10T14:14:00.000Z";
const DURABLE_LOCAL_LOOP_CONFLICT_APPLIED_AT = "2026-07-10T14:13:30.000Z";
const DURABLE_LOCAL_LOOP_CONFLICT_RECORDED_AT = "2026-07-10T14:14:30.000Z";
const DURABLE_LOCAL_LOOP_FOLLOWUP_PACKET_GENERATED_AT =
  "2026-07-10T14:15:00.000Z";
const DURABLE_LOCAL_LOOP_FOLLOWUP_PROBE_RECORDED_AT =
  "2026-07-10T14:16:00.000Z";

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
  assert.equal(
    initialSnapshot.counts.vnext_semantic_target_heads,
    0,
    "isolated durable smoke starts with no transitioned target heads",
  );

  const gateScenarios = buildDurableLocalSemanticGateScenariosV01();
  const prefix = gateScenarios.prefix;
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

  const authorizedApplierIdentity = {
    ref_type: "semantic_transition_applier",
    external_id: `local-core-applier:${prefix.project.project_id}`,
  };
  const preview = prepareVNextSemanticCommitPreviewV01(db, {
    workspace_id: prefix.project.workspace_id,
    project_id: prefix.project.project_id,
    proposal_id: prefix.proposal.proposal_id,
    proposal_fingerprint: prefix.proposal.integrity.fingerprint,
    decision_id: prefix.decision.decision_id,
    decision_fingerprint: prefix.decision.integrity.fingerprint,
    authorized_applier_identity: authorizedApplierIdentity,
    gate_ttl_ms: millisecondsBetween(
      DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
      DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
    ),
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
      DURABLE_LOCAL_LOOP_PREVIEWED_AT,
    ),
  });
  assert.equal(preview.intended_effects.length, 1);
  assert.equal(preview.intended_effects[0]?.operation, "create");
  assert.equal(
    preview.current_state_observations[0]?.observed_at,
    DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
    "preview current-state observation time comes from the injected runtime clock",
  );
  assert.equal(
    preview.previewed_at,
    DURABLE_LOCAL_LOOP_PREVIEWED_AT,
    "preview time comes from the injected runtime clock",
  );
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
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_CONFIRMED_AT,
      DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
      DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
    ),
  });
  assertAcceptedResult(
    authorization,
    ["inserted", "exact_replay"],
    "semantic commit authorization",
  );
  assert.equal(
    authorization.gate_record.confirmed_at,
    DURABLE_LOCAL_LOOP_CONFIRMED_AT,
    "confirmation time comes from the injected runtime clock",
  );
  assert.equal(
    authorization.gate_record.confirmation_observation_ref.observed_at,
    DURABLE_LOCAL_LOOP_CONFIRMED_AT,
    "confirmation observation ref preserves the runtime confirmation time",
  );
  assert.equal(
    authorization.gate_record.confirmation_observation_ref.source_ref,
    preview.confirmation_digest,
    "confirmation observation ref binds the exact operator-confirmed digest",
  );
  assert.equal(
    authorization.gate_record.semantic_commit_gate_evaluation.evaluated_at,
    DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
    "gate evaluation time comes from the injected runtime clock",
  );
  assert.equal(
    authorization.gate_record.semantic_commit_gate_evaluation.expires_at,
    DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
    "gate expiry is derived from the confirmed bounded TTL",
  );
  assert.equal(
    authorization.gate_record.semantic_commit_gate_evaluation.authorized_applier_ref
      .observed_at,
    DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
    "authorized applier ref is created at the runtime gate evaluation time",
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
  assert.equal(
    authorizedSnapshot.counts.vnext_semantic_target_heads,
    0,
    "authorization does not advance semantic target history",
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
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_APPLIED_AT,
      DURABLE_LOCAL_LOOP_RECORDED_AT,
    ),
  };
  const committed = commitVNextSemanticTransitionV01(db, commitInput);
  assert.equal(committed.status, "applied", "single-target accept/create applies");
  assert(committed.transition_receipt, "applied result returns a StateTransitionReceipt");
  assert(committed.semantic_state, "create writes one semantic-state record");
  assert(committed.projection, "create writes one current-state projection");

  const receipt = committed.transition_receipt as StateTransitionReceiptV01;
  assert.equal(receipt.applied_at, DURABLE_LOCAL_LOOP_APPLIED_AT);
  assert.equal(receipt.recorded_at, DURABLE_LOCAL_LOOP_RECORDED_AT);
  assert.deepEqual(
    receipt.applied_by_ref,
    authorization.gate_record.semantic_commit_gate_evaluation
      .authorized_applier_ref,
    "receipt preserves the exact gate-authorized applier",
  );
  for (const effect of receipt.effects) {
    assert.equal(
      effect.after_application_observation_ref.observed_at,
      DURABLE_LOCAL_LOOP_APPLIED_AT,
      "application observation ref uses the writer clock",
    );
    assert.equal(
      effect.durable_record_ref.observed_at,
      DURABLE_LOCAL_LOOP_RECORDED_AT,
      "durable-record ref uses the writer clock",
    );
    assert.equal(
      effect.after_application_observation_ref.source_ref,
      effect.durable_record_ref.source_ref,
      "application and durable-record refs bind the same exact applied result",
    );
  }
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
  assert.equal(
    appliedSnapshot.counts.vnext_semantic_target_heads,
    1,
    "commit creates one monotonic target head",
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
    receipt.workspace_id,
    receipt.project_id,
  );
  assert.equal(persistedReceiptRow.fingerprint, receipt.integrity.fingerprint);
  assert.deepEqual(JSON.parse(persistedReceiptRow.payload_json), receipt);
  assert.equal(db.pragma("integrity_check", { simple: true }), "ok");

  const migrationCoverage = runMigrationCoverage(dirname(dbPath));
  const gateCoverage = runSemanticGateCoverage(
    dirname(dbPath),
    gateScenarios,
  );
  const writerCoverage = runFullWriterCoverage(
    dirname(dbPath),
    gateScenarios,
    buildDurableLocalSemanticGateScenariosForProjectV01(
      durableLocalClosedLoopProjectBFixture,
    ),
  );

  const persistedPriorPacket = persistTaskContextPacketRecordV01(
    db,
    prefix.prior_packet,
  );
  assert.equal(
    persistedPriorPacket.status,
    "inserted",
    "the local context-use path starts from an exact persisted prior packet",
  );
  const beforeContextCompile = readDatabaseSnapshot(db);
  const compiledContext = compileTaskContextPacketFromPersistedSemanticStateV01(
    db,
    {
      workspace_id: prefix.project.workspace_id,
      project_id: prefix.project.project_id,
      prior_packet: prefix.prior_packet,
      transition_receipt_id: receipt.transition_receipt_id,
      transition_receipt_fingerprint: receipt.integrity.fingerprint,
      expiry_policy: { mode: "reuse_prior" },
      clock: fixedClock(DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT),
    },
  );
  assert.equal(compiledContext.status, "inserted");
  assert.equal(
    compiledContext.later_packet.generated_at,
    DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
    "compiler packet generated_at comes from the compiler runtime clock",
  );
  assert.equal(compiledContext.full_chain_relation.status, "valid");
  assertCanonicalCompiledPacket(
    prefix.prior_packet,
    receipt,
    committed.projection!,
    compiledContext.later_packet,
  );
  const compiledPacketValidation = validateTaskContextPacketV01(
    compiledContext.later_packet,
    { evaluated_at: compiledContext.later_packet.generated_at },
  );
  assert.equal(
    compiledPacketValidation.status,
    "valid",
    JSON.stringify(compiledPacketValidation),
  );
  const afterContextCompile = readDatabaseSnapshot(db);
  assert.equal(
    afterContextCompile.counts.vnext_core_records,
    beforeContextCompile.counts.vnext_core_records + 1,
    "validated context compilation persists exactly one later packet",
  );
  assertLegacySnapshotUnchanged(afterContextCompile, legacyBaseline);
  const compiledReplay = compileTaskContextPacketFromPersistedSemanticStateV01(
    db,
    {
      workspace_id: prefix.project.workspace_id,
      project_id: prefix.project.project_id,
      prior_packet: prefix.prior_packet,
      transition_receipt_id: receipt.transition_receipt_id,
      transition_receipt_fingerprint: receipt.integrity.fingerprint,
      expiry_policy: { mode: "reuse_prior" },
      clock: fixedClock(DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT),
    },
  );
  assert.equal(compiledReplay.status, "exact_replay");
  assert.deepEqual(compiledReplay.later_packet, compiledContext.later_packet);
  assert.deepEqual(
    readDatabaseSnapshot(db),
    afterContextCompile,
    "deterministic compiler replay writes no duplicate packet",
  );
  const contextCompilerCoverage = runContextCompilerCoverage(
    dirname(dbPath),
    gateScenarios,
    buildDurableLocalSemanticGateScenariosForProjectV01(
      durableLocalClosedLoopProjectBFixture,
    ),
  );

  const beforeContextUseProbe = readDatabaseSnapshot(db);
  const contextUseProbeInput = localContextUseProbeInput(
    prefix.prior_packet,
    compiledContext.later_packet,
    receipt,
    DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
  );
  const contextUseProbe = runLocalContextUseProbeV01(
    db,
    contextUseProbeInput,
  );
  assert.equal(contextUseProbe.status, "inserted");
  assert.equal(
    contextUseProbe.receipt.recorded_at,
    DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
    "probe receipt recorded_at comes from the probe runtime clock",
  );
  assert(
    contextUseProbe.receipt.observations.every(
      (observation) =>
        observation.observed_at ===
          DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT &&
        observation.event_at ===
          DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
    ),
    "every direct-local probe observation preserves the exact runtime clock time",
  );
  assert.equal(contextUseProbe.relation.status, "valid");
  assert.equal(
    validateRunReceiptV01(contextUseProbe.receipt).status,
    "valid",
    "local context-use RunReceipt validates independently",
  );
  assert.equal(contextUseProbe.receipt.model_invocations.length, 0);
  assert.equal(contextUseProbe.receipt.attestations.length, 0);
  assert(contextUseProbe.receipt.trust_summary.direct_observations > 0);
  assert.equal(
    contextUseProbe.receipt.task_context_packet_ref?.external_id,
    compiledContext.later_packet.packet_id,
  );
  assert.equal(
    contextUseProbe.receipt.task_context_packet_ref?.source_ref,
    compiledContext.later_packet.integrity.fingerprint,
  );
  const afterContextUseProbe = readDatabaseSnapshot(db);
  assert.equal(
    afterContextUseProbe.counts.vnext_core_records,
    beforeContextUseProbe.counts.vnext_core_records + 1,
    "the local context-use probe persists exactly one immutable RunReceipt",
  );
  assertLegacySnapshotUnchanged(afterContextUseProbe, legacyBaseline);
  const contextUseProbeReplay = runLocalContextUseProbeV01(
    db,
    contextUseProbeInput,
  );
  assert.equal(contextUseProbeReplay.status, "exact_replay");
  assert.deepEqual(contextUseProbeReplay.receipt, contextUseProbe.receipt);
  assert.deepEqual(
    readDatabaseSnapshot(db),
    afterContextUseProbe,
    "exact context-use probe replay writes no second receipt",
  );
  const contextUseProbeCoverage = runLocalContextUseProbeCoverage(
    dirname(dbPath),
    gateScenarios,
    buildDurableLocalSemanticGateScenariosForProjectV01(
      durableLocalClosedLoopProjectBFixture,
    ),
  );
  const fullDurableLocalLoopCoverage = runFullDurableLocalLoopCoverage(
    dirname(dbPath),
    gateScenarios,
    buildDurableLocalSemanticGateScenariosForProjectV01(
      durableLocalClosedLoopProjectBFixture,
    ),
  );

  db.pragma("wal_checkpoint(TRUNCATE)");
  db.close();
  db = null;

  db = new Database(dbPath, { readonly: true, fileMustExist: true });
  db.pragma("foreign_keys = ON");
  const reopenedSnapshot = readDatabaseSnapshot(db);
  assert.deepEqual(
    reopenedSnapshot,
    afterContextUseProbe,
    "close/reopen preserves exact transition, compiled packet, and context-use receipt rows and hashes",
  );
  assert.deepEqual(
    JSON.parse(
      requireCoreRecord(
        db,
        "state_transition_receipt",
        receipt.transition_receipt_id,
        receipt.workspace_id,
        receipt.project_id,
      ).payload_json,
    ),
    receipt,
    "close/reopen preserves exact receipt payload",
  );
  assert.deepEqual(
    JSON.parse(
      requireCoreRecord(
        db,
        "task_context_packet",
        compiledContext.later_packet.packet_id,
        compiledContext.later_packet.workspace_id,
        compiledContext.later_packet.project_id,
      ).payload_json,
    ),
    compiledContext.later_packet,
    "close/reopen preserves exact later TaskContextPacket payload",
  );
  assert.deepEqual(
    JSON.parse(
      requireCoreRecord(
        db,
        "run_receipt",
        contextUseProbe.receipt.receipt_id,
        contextUseProbe.receipt.workspace_id,
        contextUseProbe.receipt.project_id,
      ).payload_json,
    ),
    contextUseProbe.receipt,
    "close/reopen preserves the exact local context-use RunReceipt payload",
  );
  assert.equal(db.pragma("integrity_check", { simple: true }), "ok");

  assert.equal(fetchCalls, 0, "durable semantic smoke makes zero fetch calls");
  assert.equal(networkCalls, 0, "durable semantic smoke makes zero runtime network calls");
  summary = {
    smoke: "vnext-durable-semantic-loop-v0-1",
    phase:
      "M3C-A/B/C isolated storage, semantic commit gate, full writer, later context, and local context-use observation",
    status: "pass",
    project_fixture: prefix.project.fixture_id,
    database_mode:
      databaseExistedAtStart && legacyMode === "canonical"
        ? "preinitialized_temp_canonical"
        : "standalone_phase_a",
    positive_cases:
      24 +
      writerCoverage.positive_cases +
      contextCompilerCoverage.positive_cases +
      contextUseProbeCoverage.positive_cases +
      fullDurableLocalLoopCoverage.positive_cases,
    negative_cases:
      12 +
      writerCoverage.negative_cases +
      contextCompilerCoverage.negative_cases +
      contextUseProbeCoverage.negative_cases +
      fullDurableLocalLoopCoverage.negative_cases,
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
      post_context_compile_db_checksum: afterContextCompile.logical_checksum,
      post_context_use_probe_db_checksum:
        afterContextUseProbe.logical_checksum,
      reopened_db_checksum: reopenedSnapshot.logical_checksum,
      local_context_use_run_receipt_id:
        contextUseProbe.receipt.receipt_id,
      local_context_use_run_receipt_idempotency_key:
        contextUseProbe.receipt.idempotency_key,
      local_context_use_run_receipt_fingerprint:
        contextUseProbe.receipt.integrity.fingerprint,
      full_durable_local_loop_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          prior_packet: {
            id: prefix.prior_packet.packet_id,
            fingerprint: prefix.prior_packet.integrity.fingerprint,
          },
          transition_receipt: {
            id: receipt.transition_receipt_id,
            fingerprint: receipt.integrity.fingerprint,
          },
          later_packet: {
            id: compiledContext.later_packet.packet_id,
            fingerprint: compiledContext.later_packet.integrity.fingerprint,
          },
          context_use_receipt: {
            id: contextUseProbe.receipt.receipt_id,
            fingerprint: contextUseProbe.receipt.integrity.fingerprint,
          },
        }),
      ),
      two_project_pre_transition_db_checksum:
        fullDurableLocalLoopCoverage.pre_transition_db_checksum,
      two_project_post_transition_db_checksum:
        fullDurableLocalLoopCoverage.post_transition_db_checksum,
      two_project_restored_db_checksum:
        fullDurableLocalLoopCoverage.restored_db_checksum,
      two_project_full_durable_local_loop_fingerprint:
        fullDurableLocalLoopCoverage.full_loop_fingerprint,
      db_checksum_scope:
        "vnext_core_records_vnext_semantic_state_entries_and_target_heads",
    },
    rows: reopenedSnapshot.counts,
    receipt_validation: receiptValidation.status,
    receipt_relation_validation: receiptRelation.status,
    exact_replay: true,
    conflicting_identity_blocked: true,
    integrity_check: "ok",
    migration_coverage: migrationCoverage,
    semantic_gate_coverage: gateCoverage,
    full_writer_coverage: writerCoverage,
    context_compiler_coverage: contextCompilerCoverage,
    local_context_use_probe_coverage: contextUseProbeCoverage,
    full_durable_local_loop_coverage: fullDurableLocalLoopCoverage,
    later_task_context_packet: {
      packet_id: compiledContext.later_packet.packet_id,
      fingerprint: compiledContext.later_packet.integrity.fingerprint,
      status: compiledContext.status,
      exact_replay: compiledReplay.status === "exact_replay",
      full_chain_relation: compiledContext.full_chain_relation.status,
    },
    local_context_use_run_receipt: {
      receipt_id: contextUseProbe.receipt.receipt_id,
      idempotency_key: contextUseProbe.receipt.idempotency_key,
      fingerprint: contextUseProbe.receipt.integrity.fingerprint,
      status: contextUseProbe.status,
      exact_replay: contextUseProbeReplay.status === "exact_replay",
      relation: contextUseProbe.relation.status,
      direct_local_observations:
        contextUseProbe.receipt.trust_summary.direct_observations,
      outcome_improvement_claimed: false,
    },
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
  const requestedParent = dirname(normalized);
  assert(
    existsSync(requestedParent),
    "AUGNES_DB_PATH parent must be an existing OS-temporary directory",
  );
  const canonicalTempRoot = realpathSync(tmpdir());
  const canonicalParent = realpathSync(requestedParent);
  const relativeToTemp = relative(canonicalTempRoot, canonicalParent);
  assert(
    relativeToTemp === "" ||
      (!relativeToTemp.startsWith(`..${sep}`) && relativeToTemp !== ".."),
    "AUGNES_DB_PATH must remain under the operating system temporary directory",
  );
  if (existsSync(normalized)) {
    const canonicalDatabasePath = realpathSync(normalized);
    const relativeDatabaseToTemp = relative(
      canonicalTempRoot,
      canonicalDatabasePath,
    );
    assert(
      relativeDatabaseToTemp === "" ||
        (!relativeDatabaseToTemp.startsWith(`..${sep}`) &&
          relativeDatabaseToTemp !== ".."),
      "An existing AUGNES_DB_PATH must not resolve outside the operating system temporary directory",
    );
  }
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
        vnext_semantic_target_heads:
          rowsByTable.vnext_semantic_target_heads,
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

function runSemanticGateCoverage(
  parentDirectory: string,
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  const suffix = `${process.pid}`;
  const primaryPath = resolve(parentDirectory, `m3c-gate-primary-${suffix}.db`);
  const supersedePath = resolve(
    parentDirectory,
    `m3c-gate-supersede-${suffix}.db`,
  );
  const forgedPath = resolve(parentDirectory, `m3c-gate-forged-${suffix}.db`);
  const ownedPaths = [primaryPath, supersedePath, forgedPath].flatMap((path) => [
    path,
    `${path}-wal`,
    `${path}-shm`,
  ]);
  for (const path of ownedPaths) {
    assert.equal(existsSync(path), false, `semantic gate coverage owns ${path}`);
  }

  let primary: Database.Database | null = null;
  let supersede: Database.Database | null = null;
  let forged: Database.Database | null = null;
  try {
    primary = new Database(primaryPath);
    primary.pragma("foreign_keys = ON");
    ensureVNextDurableSemanticStoreSchemaV01(primary);
    const createApplied = applyCreateScenario(primary, scenarios.create);
    const replace = prepareAndAuthorizeGateScenario(
      primary,
      scenarios.replace,
      true,
    );
    const retract = prepareAndAuthorizeGateScenario(
      primary,
      scenarios.retract,
      false,
    );
    const multiTarget = prepareAndAuthorizeGateScenario(
      primary,
      scenarios.multi_target,
      false,
    );

    supersede = new Database(supersedePath);
    supersede.pragma("foreign_keys = ON");
    ensureVNextDurableSemanticStoreSchemaV01(supersede);
    applyCreateScenario(supersede, {
      scenario_id: "create",
      proposal: scenarios.supersede.proposal,
      decision: scenarios.supersede_prior_accept_decision,
      expected_operations: ["create"],
      expected_target_count: 1,
    });
    const supersedeGate = prepareAndAuthorizeGateScenario(
      supersede,
      scenarios.supersede,
      false,
    );

    forged = new Database(forgedPath);
    forged.pragma("foreign_keys = ON");
    ensureVNextDurableSemanticStoreSchemaV01(forged);
    persistVNextSemanticReviewMaterialV01(forged, {
      proposal: scenarios.create.proposal,
      decision: scenarios.create.decision,
    });
    const forgedGate = createSelfConsistentForgedGate(
      createApplied.authorization.gate_record,
    );
    insertVNextCoreRecordV01(forged, {
      record_kind: "semantic_commit_gate",
      record_id: forgedGate.gate_record_id,
      workspace_id: forgedGate.workspace_id,
      project_id: forgedGate.project_id,
      fingerprint: forgedGate.integrity.fingerprint,
      idempotency_key: forgedGate.confirmation_digest,
      payload: forgedGate,
      created_at: forgedGate.confirmed_at,
    });
    const beforeForgedCommit = readNamedTablesSnapshot(forged, [
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
    ]);
    assert.throws(
      () =>
        commitVNextSemanticTransitionV01(forged!, {
          workspace_id: forgedGate.workspace_id,
          project_id: forgedGate.project_id,
          proposal_id: forgedGate.proposal_id,
          proposal_fingerprint: forgedGate.proposal_fingerprint,
          decision_id: forgedGate.decision_id,
          decision_fingerprint: forgedGate.decision_fingerprint,
          gate_record_id: forgedGate.gate_record_id,
          gate_record_fingerprint: forgedGate.integrity.fingerprint,
          clock: fixedClock(
            DURABLE_LOCAL_LOOP_APPLIED_AT,
            DURABLE_LOCAL_LOOP_RECORDED_AT,
          ),
        }),
      /operator_actor_mismatch|semantic_commit_gate_relation_invalid|semantic_commit_precondition_mismatch|transition_not_eligible/,
      "fully re-signed forged gate payload fails closed",
    );
    assert.deepEqual(
      readNamedTablesSnapshot(forged, [
        "vnext_core_records",
        "vnext_semantic_state_entries",
        "vnext_semantic_target_heads",
      ]),
      beforeForgedCommit,
      "forged gate refusal writes no state or receipt",
    );

    for (const database of [primary, supersede, forged]) {
      assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    }

    return {
      status: "pass",
      positive_cases: 7,
      negative_cases: 7,
      preview_zero_write_scenarios: [
        "create",
        "replace",
        "supersede",
        "retract",
        "multi_target",
      ],
      gate_only_persistence_scenarios: [
        "create",
        "replace",
        "supersede",
        "retract",
        "multi_target",
      ],
      exact_effect_operations: {
        create: createApplied.preview.intended_effects.map(
          (effect) => effect.operation,
        ),
        replace: replace.preview.intended_effects.map(
          (effect) => effect.operation,
        ),
        supersede: supersedeGate.preview.intended_effects.map(
          (effect) => effect.operation,
        ),
        retract: retract.preview.intended_effects.map(
          (effect) => effect.operation,
        ),
        multi_target: multiTarget.preview.intended_effects.map(
          (effect) => effect.operation,
        ),
      },
      refusal_cases: [
        "operator_actor_mismatch",
        "confirmation_digest_mismatch",
        "caller_future_preview_timestamp",
        "chronology_mismatch",
        "expired_or_invalid_gate_timing",
        "cross_project_binding",
        "fully_resigned_forged_gate_payload",
      ],
      synthetic_operator_trust_class:
        scenarios.create.decision.actor_ref.trust_class,
      human_identity_authenticated: false,
      integrity_check: "ok",
    };
  } finally {
    if (primary?.open) primary.close();
    if (supersede?.open) supersede.close();
    if (forged?.open) forged.close();
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `semantic gate coverage removes ${path}`);
    }
  }
}

function runFullWriterCoverage(
  parentDirectory: string,
  projectAScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
  projectBScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  const suffix = `${process.pid}`;
  const databases = new Map<string, Database.Database>();
  const ownedPaths = new Set<string>();
  const databasePath = (label: string) =>
    resolve(parentDirectory, `m3c-writer-${label}-${suffix}.db`);
  const openDatabase = (label: string) => {
    const path = databasePath(label);
    for (const owned of [path, `${path}-wal`, `${path}-shm`]) {
      assert.equal(existsSync(owned), false, `full writer coverage owns ${owned}`);
      ownedPaths.add(owned);
    }
    const database = new Database(path);
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    ensureVNextDurableSemanticStoreSchemaV01(database);
    const legacyMode = prepareLegacyTables(database);
    const legacyBaseline = readLegacySnapshot(readDatabaseSnapshot(database));
    databases.set(label, database);
    return { database, path, legacyMode, legacyBaseline };
  };

  const operationResults: Record<
    string,
    { receipt_id: string; receipt_fingerprint: string; operations: string[] }
  > = {};
  let reopenedChecksum = "";
  try {
    for (const specification of [
      { label: "create", scenario: projectAScenarios.create, seed: "none" },
      { label: "replace", scenario: projectAScenarios.replace, seed: "prefix" },
      {
        label: "supersede",
        scenario: projectAScenarios.supersede,
        seed: "supersede_prior",
      },
      { label: "retract", scenario: projectAScenarios.retract, seed: "prefix" },
      { label: "multi", scenario: projectAScenarios.multi_target, seed: "prefix" },
    ] as const) {
      const opened = openDatabase(specification.label);
      if (specification.seed === "prefix") {
        applyCreateScenario(opened.database, projectAScenarios.create);
      } else if (specification.seed === "supersede_prior") {
        applyCreateScenario(opened.database, {
          scenario_id: "create",
          proposal: projectAScenarios.supersede.proposal,
          decision: projectAScenarios.supersede_prior_accept_decision,
          expected_operations: ["create"],
          expected_target_count: 1,
        });
      }
      const prepared = prepareAndAuthorizeGateScenario(
        opened.database,
        specification.scenario,
        false,
      );
      const input = writerCommitInput(
        specification.scenario,
        prepared.authorization,
      );
      const committed = commitVNextSemanticTransitionV01(opened.database, input);
      assert.equal(committed.status, "applied", `${specification.label} applies`);
      assertWriterReceiptRelation(specification.scenario, committed);
      assert.deepEqual(
        committed.transition_receipt.effects
          .map((effect) => effect.operation)
          .sort(),
        [...specification.scenario.expected_operations].sort(),
        `${specification.label} receipt records exact operations`,
      );
      assert.equal(
        committed.transition_receipt.effects.length,
        specification.scenario.expected_target_count,
        `${specification.label} receipt preserves the exact atomic target set`,
      );
      const appliedSnapshot = readDatabaseSnapshot(opened.database);
      assertLegacySnapshotUnchanged(appliedSnapshot, opened.legacyBaseline);
      const replay = commitVNextSemanticTransitionV01(opened.database, input);
      assert.equal(replay.status, "exact_replay", `${specification.label} exact replay`);
      assert.deepEqual(
        replay.transition_receipt,
        committed.transition_receipt,
        `${specification.label} exact replay returns the stored receipt`,
      );
      assert.deepEqual(
        readDatabaseSnapshot(opened.database),
        appliedSnapshot,
        `${specification.label} replay creates no row or revision`,
      );
      operationResults[specification.label] = {
        receipt_id: committed.transition_receipt.transition_receipt_id,
        receipt_fingerprint: committed.transition_receipt.integrity.fingerprint,
        operations: committed.transition_receipt.effects.map(
          (effect) => effect.operation,
        ),
      };
      assert.equal(opened.database.pragma("integrity_check", { simple: true }), "ok");

      if (specification.label === "multi") {
        opened.database.pragma("wal_checkpoint(TRUNCATE)");
        opened.database.close();
        databases.delete(specification.label);
        const reopened = new Database(opened.path, {
          readonly: true,
          fileMustExist: true,
        });
        reopened.pragma("foreign_keys = ON");
        assert.deepEqual(
          readDatabaseSnapshot(reopened),
          appliedSnapshot,
          "multi-target writer rows survive DB close/reopen",
        );
        assert.equal(reopened.pragma("integrity_check", { simple: true }), "ok");
        reopenedChecksum = appliedSnapshot.logical_checksum;
        reopened.close();
      }
    }

    runConflictingResultCoverage(openDatabase("conflicting-result"), projectAScenarios.create);
    runTrustedClockWriterCoverage(
      openDatabase("trusted-clock-replay"),
      openDatabase("trusted-clock-expiry"),
      projectAScenarios.create,
    );
    runStalePreconditionCoverage(openDatabase("stale-precondition"), projectAScenarios.create);
    runReplayDriftCoverage(openDatabase("replay-drift"), projectAScenarios.create);
    runCrossProjectWriterCoverage(
      openDatabase("project-isolation"),
      projectAScenarios.create,
      projectBScenarios.create,
    );
    const targetHeadCoverage = runTargetHeadAbaCoverage(
      openDatabase,
      projectAScenarios,
    );
    runProjectionLedgerCoherenceCoverage(openDatabase, projectAScenarios);
    runDuplicateSemanticTargetCoverage(
      openDatabase("duplicate-target-source"),
      openDatabase("duplicate-target-refusal"),
      projectAScenarios.create,
    );
    runWriterFailureInjectionCoverage(openDatabase, projectAScenarios);

    for (const database of databases.values()) {
      assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    }
    return {
      status: "pass",
      positive_cases: 21,
      negative_cases: 22,
      applied_operations: operationResults,
      exact_replay_scenarios: [
        "create",
        "replace",
        "supersede",
        "retract",
        "multi_target",
      ],
      refusal_cases: [
        "conflicting_result",
        "stale_current_state",
        "state_replay_conflict",
        "cross_project_binding",
        "duplicate_semantic_target",
        "absent_state_aba_stale_gate",
        "old_retract_receipt_replay_after_aba",
        "multi_target_aba_atomic_rollback",
        "projection_immutable_state_missing",
        "projection_state_fingerprint_drift",
        "projection_source_receipt_missing",
        "projection_source_receipt_mismatch",
        "new_application_after_gate_expiry",
        "caller_backdated_application_timestamp",
        "after_proposal_record_insert",
        "after_decision_record_insert",
        "after_gate_record_insert",
        "after_first_state_record_insert",
        "after_first_projection_write",
        "before_receipt_insert",
        "after_receipt_insert_before_commit",
        "during_second_target",
      ],
      atomic_multi_target_apply: true,
      monotonic_target_head_coverage: targetHeadCoverage,
      trusted_runtime_clock: {
        exact_replay_after_expiry: true,
        new_application_after_expiry_blocked: true,
        caller_backdating_blocked: true,
        conflicting_result_after_expiry: true,
      },
      project_isolation: true,
      receipt_validation: "valid",
      eligibility_relation_validation: "valid",
      reopened_logical_checksum: reopenedChecksum,
      legacy_table_deltas: {
        state_delta_proposals: 0,
        state_entries: 0,
        state_transitions: 0,
      },
      fetch_calls: fetchCalls,
      provider_calls: 0,
      network_calls: networkCalls,
      integrity_check: "ok",
    };
  } finally {
    for (const database of databases.values()) {
      if (database.open) database.close();
    }
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `full writer coverage removes ${path}`);
    }
  }
}

function writerCommitInput(
  scenario: DurableLocalSemanticGateScenarioV01,
  authorization: VNextSemanticCommitAuthorizationResultV01,
  timestamps?: { applied_at: string; recorded_at: string },
) {
  const times =
    timestamps ??
    (scenario.scenario_id === "create"
      ? {
          applied_at: DURABLE_LOCAL_LOOP_APPLIED_AT,
          recorded_at: DURABLE_LOCAL_LOOP_RECORDED_AT,
        }
      : {
          applied_at: DURABLE_LOCAL_LOOP_FOLLOWUP_APPLIED_AT,
          recorded_at: DURABLE_LOCAL_LOOP_FOLLOWUP_RECORDED_AT,
        });
  return {
    workspace_id: scenario.proposal.workspace_id,
    project_id: scenario.proposal.project_id,
    proposal_id: scenario.proposal.proposal_id,
    proposal_fingerprint: scenario.proposal.integrity.fingerprint,
    decision_id: scenario.decision.decision_id,
    decision_fingerprint: scenario.decision.integrity.fingerprint,
    gate_record_id: authorization.gate_record.gate_record_id,
    gate_record_fingerprint: authorization.gate_record.integrity.fingerprint,
    clock: fixedClock(times.applied_at, times.recorded_at),
  };
}

function assertWriterReceiptRelation(
  scenario: DurableLocalSemanticGateScenarioV01,
  committed: ReturnType<typeof commitVNextSemanticTransitionV01>,
) {
  const standalone = validateStateTransitionReceiptV01(
    committed.transition_receipt,
  );
  assert.equal(
    standalone.status,
    "valid",
    `${scenario.scenario_id} receipt validates: ${JSON.stringify(standalone)}`,
  );
  const relation = validateStateTransitionReceiptAgainstEligibilityV01({
    ...committed.eligibility_input,
    receipt: committed.transition_receipt,
  });
  assert.equal(
    relation.status,
    "valid",
    `${scenario.scenario_id} receipt preserves exact eligibility: ${JSON.stringify(relation)}`,
  );
}

interface WriterCoverageDatabaseV01 {
  database: Database.Database;
  path: string;
  legacyMode: "canonical" | "phase_a_sentinel";
  legacyBaseline: LegacySnapshot;
}

function runConflictingResultCoverage(
  opened: WriterCoverageDatabaseV01,
  scenario: DurableLocalSemanticGateScenarioV01,
) {
  const prepared = prepareAndAuthorizeGateScenario(
    opened.database,
    scenario,
    false,
  );
  const input = writerCommitInput(scenario, prepared.authorization);
  const committed = commitVNextSemanticTransitionV01(opened.database, input);
  const conflictingReceipt = buildConflictingAppliedByReceipt(
    committed.transition_receipt,
  );
  assert.equal(
    conflictingReceipt.idempotency_key,
    committed.transition_receipt.idempotency_key,
  );
  assert.notEqual(
    conflictingReceipt.integrity.fingerprint,
    committed.transition_receipt.integrity.fingerprint,
  );
  opened.database.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
  opened.database
    .prepare(
      `UPDATE vnext_core_records SET
        record_id = ?, fingerprint = ?, payload_json = ?, created_at = ?
       WHERE record_kind = 'state_transition_receipt' AND idempotency_key = ?`,
    )
    .run(
      conflictingReceipt.transition_receipt_id,
      conflictingReceipt.integrity.fingerprint,
      canonicalizeProtocolValueV01(conflictingReceipt),
      conflictingReceipt.recorded_at,
      conflictingReceipt.idempotency_key,
    );
  ensureVNextDurableSemanticStoreSchemaV01(opened.database);
  const baseline = readDatabaseSnapshot(opened.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(opened.database, {
        ...input,
        clock: fixedClock("2026-07-10T15:10:00.000Z"),
      }),
    /conflicting_result/,
    "same idempotency key with a different applied result stays conflicting_result after expiry",
  );
  assert.deepEqual(
    readDatabaseSnapshot(opened.database),
    baseline,
    "conflicting result writes no second state revision or receipt",
  );
  assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
}

function runTrustedClockWriterCoverage(
  replayOpened: WriterCoverageDatabaseV01,
  expiryOpened: WriterCoverageDatabaseV01,
  scenario: DurableLocalSemanticGateScenarioV01,
): void {
  const replayPrepared = prepareAndAuthorizeGateScenario(
    replayOpened.database,
    scenario,
    false,
  );
  const initial = commitVNextSemanticTransitionV01(
    replayOpened.database,
    writerCommitInput(scenario, replayPrepared.authorization),
  );
  const replayBaseline = readDatabaseSnapshot(replayOpened.database);
  const afterExpiryReplay = commitVNextSemanticTransitionV01(
    replayOpened.database,
    {
      ...writerCommitInput(scenario, replayPrepared.authorization),
      clock: fixedClock("2026-07-10T15:10:00.000Z"),
    },
  );
  assert.equal(afterExpiryReplay.status, "exact_replay");
  assert.deepEqual(afterExpiryReplay.transition_receipt, initial.transition_receipt);
  assert.deepEqual(readDatabaseSnapshot(replayOpened.database), replayBaseline);

  const expiryPrepared = prepareAndAuthorizeGateScenario(
    expiryOpened.database,
    scenario,
    false,
  );
  const expiryBaseline = readDatabaseSnapshot(expiryOpened.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(expiryOpened.database, {
        ...writerCommitInput(scenario, expiryPrepared.authorization),
        clock: fixedClock("2026-07-10T15:10:00.000Z"),
      }),
    /semantic_commit_gate_expired/,
    "runtime clock after gate expiry blocks a new application",
  );
  assert.deepEqual(readDatabaseSnapshot(expiryOpened.database), expiryBaseline);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(
        expiryOpened.database,
        {
          ...writerCommitInput(scenario, expiryPrepared.authorization),
          applied_at: DURABLE_LOCAL_LOOP_APPLIED_AT,
          clock: fixedClock("2026-07-10T15:10:00.000Z"),
        } as unknown as Parameters<
          typeof commitVNextSemanticTransitionV01
        >[1],
      ),
    /local_runtime_timestamp_input_forbidden/,
    "caller-supplied historical applied_at cannot backdate a new application",
  );
  assert.deepEqual(readDatabaseSnapshot(expiryOpened.database), expiryBaseline);
}

function runStalePreconditionCoverage(
  opened: WriterCoverageDatabaseV01,
  scenario: DurableLocalSemanticGateScenarioV01,
) {
  const prepared = prepareAndAuthorizeGateScenario(
    opened.database,
    scenario,
    false,
  );
  const candidate = scenario.proposal.proposed_deltas.find(
    (item) => item.candidate_id === scenario.decision.candidate.candidate_id,
  );
  assert(candidate, "stale precondition fixture resolves the selected candidate");
  const targetRef = prepared.preview.intended_effects[0]!.target_ref;
  const concurrentState = buildVNextPersistedSemanticStateV01({
    proposal: scenario.proposal,
    candidate_id: candidate.candidate_id,
    target_ref: targetRef,
    source_decision: {
      decision_id: scenario.decision.decision_id,
      decision_fingerprint: scenario.decision.integrity.fingerprint,
    },
    created_at: DURABLE_LOCAL_LOOP_APPLIED_AT,
  });
  insertVNextCoreRecordV01(opened.database, {
    record_kind: "semantic_state",
    record_id: concurrentState.semantic_state_record_id,
    workspace_id: concurrentState.workspace_id,
    project_id: concurrentState.project_id,
    fingerprint: concurrentState.integrity.fingerprint,
    idempotency_key: null,
    payload: concurrentState,
    created_at: concurrentState.created_at,
  });
  insertVNextSemanticStateEntryV01(opened.database, {
    workspace_id: concurrentState.workspace_id,
    project_id: concurrentState.project_id,
    presence: "present",
    target_key: concurrentState.target_key,
    target_ref: concurrentState.target_ref,
    state_ref: concurrentState.state_ref,
    state_fingerprint: concurrentState.state_content_fingerprint,
    bounded_state_summary: concurrentState.bounded_state_summary,
    source_proposal_id: concurrentState.source_proposal_id,
    source_proposal_fingerprint: concurrentState.source_proposal_fingerprint,
    source_candidate_id: concurrentState.source_candidate_id,
    source_candidate_fingerprint: concurrentState.source_candidate_fingerprint,
    source_transition_receipt_id: "state-transition-receipt:concurrent-fixture",
    source_transition_receipt_fingerprint: createProtocolSha256V01(
      "concurrent-fixture-receipt",
    ),
    revision: 1,
    updated_at: DURABLE_LOCAL_LOOP_RECORDED_AT,
  });
  const baseline = readDatabaseSnapshot(opened.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(
        opened.database,
        writerCommitInput(scenario, prepared.authorization),
      ),
    /semantic_commit_stale_current_state|semantic_state_cas_conflict|semantic_state_projection_head_missing/,
    "state changed after confirmation fails the compare-and-swap boundary",
  );
  assert.deepEqual(
    readDatabaseSnapshot(opened.database),
    baseline,
    "stale precondition refusal preserves the concurrently observed state exactly",
  );
  assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
}

function runReplayDriftCoverage(
  opened: WriterCoverageDatabaseV01,
  scenario: DurableLocalSemanticGateScenarioV01,
) {
  const prepared = prepareAndAuthorizeGateScenario(
    opened.database,
    scenario,
    false,
  );
  const input = writerCommitInput(scenario, prepared.authorization);
  const committed = commitVNextSemanticTransitionV01(opened.database, input);
  const projection = committed.projection_entries[0];
  assert(projection, "replay drift fixture has a current projection");
  opened.database
    .prepare(
      `UPDATE vnext_semantic_state_entries
       SET revision = revision + 1, updated_at = ?
       WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
    )
    .run(
      DURABLE_LOCAL_LOOP_CONFLICT_RECORDED_AT,
      projection.workspace_id,
      projection.project_id,
      projection.target_key,
    );
  const driftedBaseline = readDatabaseSnapshot(opened.database);
  assert.throws(
    () => commitVNextSemanticTransitionV01(opened.database, input),
    /state_replay_conflict/,
    "stored receipt with drifted current state is state_replay_conflict",
  );
  assert.deepEqual(
    readDatabaseSnapshot(opened.database),
    driftedBaseline,
    "state replay conflict creates no new receipt or revision",
  );
  assertLegacySnapshotUnchanged(driftedBaseline, opened.legacyBaseline);
}

function runCrossProjectWriterCoverage(
  opened: WriterCoverageDatabaseV01,
  projectA: DurableLocalSemanticGateScenarioV01,
  projectB: DurableLocalSemanticGateScenarioV01,
) {
  const projectAResult = applyCreateScenario(opened.database, projectA);
  const projectBResult = applyCreateScenario(opened.database, projectB);
  assertWriterReceiptRelation(projectA, projectAResult.committed);
  assertWriterReceiptRelation(projectB, projectBResult.committed);
  const targetA = projectA.decision.requested_transition_intent!.target_refs[0]!;
  const targetB = projectB.decision.requested_transition_intent!.target_refs[0]!;
  assert.equal(
    deriveVNextSemanticTargetKeyV01(targetA),
    deriveVNextSemanticTargetKeyV01(targetB),
    "same repository target identity may be used independently by two projects",
  );
  assert.equal(
    listVNextSemanticStateEntriesV01(opened.database, {
      workspace_id: projectA.proposal.workspace_id,
      project_id: projectA.proposal.project_id,
    }).length,
    1,
  );
  assert.equal(
    listVNextSemanticStateEntriesV01(opened.database, {
      workspace_id: projectB.proposal.workspace_id,
      project_id: projectB.proposal.project_id,
    }).length,
    1,
  );
  assert.equal(
    readVNextCoreRecordV01(opened.database, {
      record_kind: "state_transition_receipt",
      record_id:
        projectAResult.committed.transition_receipt.transition_receipt_id,
      workspace_id: projectB.proposal.workspace_id,
      project_id: projectB.proposal.project_id,
    }),
    null,
    "project A receipt does not resolve through project B scope",
  );
  const headA = readVNextSemanticTargetHeadV01(opened.database, {
    workspace_id: projectA.proposal.workspace_id,
    project_id: projectA.proposal.project_id,
    target_key: deriveVNextSemanticTargetKeyV01(targetA),
  });
  const headB = readVNextSemanticTargetHeadV01(opened.database, {
    workspace_id: projectB.proposal.workspace_id,
    project_id: projectB.proposal.project_id,
    target_key: deriveVNextSemanticTargetKeyV01(targetB),
  });
  assert.equal(headA?.revision, 1);
  assert.equal(headB?.revision, 1);
  assert.notEqual(
    headA?.source_transition_receipt_fingerprint,
    headB?.source_transition_receipt_fingerprint,
    "same target identity has independent project-scoped target heads",
  );
  const baseline = readDatabaseSnapshot(opened.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(opened.database, {
        ...writerCommitInput(projectA, projectAResult.authorization),
        project_id: projectB.proposal.project_id,
      }),
    /persisted_proposal_missing|persisted_decision_missing/,
    "cross-project commit binding fails closed",
  );
  assert.deepEqual(readDatabaseSnapshot(opened.database), baseline);
  assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
}

function runTargetHeadAbaCoverage(
  openDatabase: (label: string) => WriterCoverageDatabaseV01,
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  const opened = openDatabase("target-head-aba");
  const oldAbsentCreateScenario: DurableLocalSemanticGateScenarioV01 = {
    ...scenarios.replace,
    expected_operations: ["create"],
  };
  const oldAbsentGate = prepareAndAuthorizeGateScenarioAt(
    opened.database,
    oldAbsentCreateScenario,
    semanticGateScenarioTimes(scenarios.replace),
  );
  const targetRef = scenarios.create.decision.requested_transition_intent!
    .target_refs[0]!;
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  assert.equal(
    readVNextSemanticTargetHeadV01(opened.database, {
      workspace_id: scenarios.create.proposal.workspace_id,
      project_id: scenarios.create.proposal.project_id,
      target_key: targetKey,
    }),
    null,
    "never-transitioned absence remains generation zero",
  );

  const firstCreate = applyCreateScenario(opened.database, scenarios.create);
  const firstRetractPrepared = prepareAndAuthorizeGateScenario(
    opened.database,
    scenarios.retract,
    false,
  );
  const firstRetractInput = writerCommitInput(
    scenarios.retract,
    firstRetractPrepared.authorization,
  );
  const firstRetract = commitVNextSemanticTransitionV01(
    opened.database,
    firstRetractInput,
  );
  assert.equal(firstCreate.committed.projection?.revision, 1);
  let head = readVNextSemanticTargetHeadV01(opened.database, {
    workspace_id: scenarios.create.proposal.workspace_id,
    project_id: scenarios.create.proposal.project_id,
    target_key: targetKey,
  });
  assert.equal(head?.revision, 2);
  assert.equal(head?.presence, "absent");
  assert.equal(
    head?.source_transition_receipt_id,
    firstRetract.transition_receipt.transition_receipt_id,
  );
  const afterFirstRetract = readDatabaseSnapshot(opened.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(opened.database, {
        ...writerCommitInput(
          oldAbsentCreateScenario,
          oldAbsentGate.authorization,
          {
            applied_at: "2026-07-10T14:20:00.000Z",
            recorded_at: "2026-07-10T14:21:00.000Z",
          },
        ),
      }),
    /semantic_commit_stale_current_state|semantic_commit_precondition_mismatch/,
    "an original generation-zero create gate cannot revive after create/retract ABA",
  );
  assert.deepEqual(readDatabaseSnapshot(opened.database), afterFirstRetract);

  const secondCreateTimes = explicitGateTimes(
    "2026-07-10T14:20:00.000Z",
    "2026-07-10T14:21:00.000Z",
    "2026-07-10T14:22:00.000Z",
    "2026-07-10T14:23:00.000Z",
    "2026-07-10T14:24:00.000Z",
  );
  const secondCreatePrepared = prepareAndAuthorizeGateScenarioAt(
    opened.database,
    oldAbsentCreateScenario,
    secondCreateTimes,
  );
  const secondCreate = commitVNextSemanticTransitionV01(opened.database, {
    ...writerCommitInput(
      oldAbsentCreateScenario,
      secondCreatePrepared.authorization,
      {
        applied_at: "2026-07-10T14:25:00.000Z",
        recorded_at: "2026-07-10T14:26:00.000Z",
      },
    ),
  });
  assert.equal(secondCreate.projection?.revision, 3);

  const secondRetractScenario = buildRetractScenarioForPriorAccept(
    scenarios,
    oldAbsentCreateScenario,
    "aba-second-retract",
    "2026-07-10T14:27:00.000Z",
  );
  const secondRetractTimes = explicitGateTimes(
    "2026-07-10T14:28:00.000Z",
    "2026-07-10T14:29:00.000Z",
    "2026-07-10T14:30:00.000Z",
    "2026-07-10T14:31:00.000Z",
    "2026-07-10T14:32:00.000Z",
  );
  const secondRetractPrepared = prepareAndAuthorizeGateScenarioAt(
    opened.database,
    secondRetractScenario,
    secondRetractTimes,
  );
  const secondRetract = commitVNextSemanticTransitionV01(opened.database, {
    ...writerCommitInput(
      secondRetractScenario,
      secondRetractPrepared.authorization,
      {
        applied_at: "2026-07-10T14:33:00.000Z",
        recorded_at: "2026-07-10T14:34:00.000Z",
      },
    ),
  });
  head = readVNextSemanticTargetHeadV01(opened.database, {
    workspace_id: scenarios.create.proposal.workspace_id,
    project_id: scenarios.create.proposal.project_id,
    target_key: targetKey,
  });
  assert.equal(head?.revision, 4);
  assert.equal(head?.presence, "absent");
  assert.equal(
    head?.source_transition_receipt_id,
    secondRetract.transition_receipt.transition_receipt_id,
  );
  const afterSecondRetract = readDatabaseSnapshot(opened.database);
  assert.throws(
    () => commitVNextSemanticTransitionV01(opened.database, firstRetractInput),
    /state_replay_conflict/,
    "an old retract receipt is not an exact replay after a later create/retract cycle",
  );
  assert.deepEqual(readDatabaseSnapshot(opened.database), afterSecondRetract);

  opened.database.pragma("wal_checkpoint(TRUNCATE)");
  const backupPath = `${opened.path}.target-head-backup`;
  copyFileSync(opened.path, backupPath);
  const restored = new Database(backupPath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const restoredHead = readVNextSemanticTargetHeadV01(restored, {
      workspace_id: scenarios.create.proposal.workspace_id,
      project_id: scenarios.create.proposal.project_id,
      target_key: targetKey,
    });
    assert.deepEqual(restoredHead, head);
    assert.equal(restored.pragma("integrity_check", { simple: true }), "ok");
  } finally {
    restored.close();
    rmSync(backupPath, { force: true });
  }

  runMultiTargetAbaRollbackCoverage(openDatabase, scenarios);
  return {
    generation_zero_absence: true,
    create_retract_create_retract_revisions: [1, 2, 3, 4],
    stale_generation_zero_gate_blocked: true,
    old_retract_replay_conflict: true,
    close_reopen_and_backup_restore_lineage: true,
    multi_target_aba_atomic_rollback: true,
  };
}

function runMultiTargetAbaRollbackCoverage(
  openDatabase: (label: string) => WriterCoverageDatabaseV01,
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
): void {
  const opened = openDatabase("target-head-multi-aba");
  const first = applyCreateScenario(opened.database, scenarios.create);
  assert.equal(first.committed.projection?.revision, 1);
  const staleMultiGate = prepareAndAuthorizeGateScenario(
    opened.database,
    scenarios.multi_target,
    false,
  );
  const secondTarget = scenarios.multi_target.decision.requested_transition_intent!
    .target_refs[1]!;
  const singleTargetAccept = buildSingleTargetAcceptScenario(
    scenarios,
    secondTarget,
    "multi-aba-create",
    "2026-07-10T14:19:00.000Z",
  );
  const createTimes = explicitGateTimes(
    "2026-07-10T14:20:00.000Z",
    "2026-07-10T14:21:00.000Z",
    "2026-07-10T14:22:00.000Z",
    "2026-07-10T14:23:00.000Z",
    "2026-07-10T14:24:00.000Z",
  );
  const createPrepared = prepareAndAuthorizeGateScenarioAt(
    opened.database,
    singleTargetAccept,
    createTimes,
  );
  commitVNextSemanticTransitionV01(opened.database, {
    ...writerCommitInput(singleTargetAccept, createPrepared.authorization, {
      applied_at: "2026-07-10T14:25:00.000Z",
      recorded_at: "2026-07-10T14:26:00.000Z",
    }),
  });
  const retract = buildRetractScenarioForPriorAccept(
    scenarios,
    singleTargetAccept,
    "multi-aba-retract",
    "2026-07-10T14:27:00.000Z",
  );
  const retractTimes = explicitGateTimes(
    "2026-07-10T14:28:00.000Z",
    "2026-07-10T14:29:00.000Z",
    "2026-07-10T14:30:00.000Z",
    "2026-07-10T14:31:00.000Z",
    "2026-07-10T14:32:00.000Z",
  );
  const retractPrepared = prepareAndAuthorizeGateScenarioAt(
    opened.database,
    retract,
    retractTimes,
  );
  commitVNextSemanticTransitionV01(opened.database, {
    ...writerCommitInput(retract, retractPrepared.authorization, {
      applied_at: "2026-07-10T14:33:00.000Z",
      recorded_at: "2026-07-10T14:34:00.000Z",
    }),
  });
  const baseline = readDatabaseSnapshot(opened.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(
        opened.database,
        writerCommitInput(
          scenarios.multi_target,
          staleMultiGate.authorization,
          {
            applied_at: "2026-07-10T14:35:00.000Z",
            recorded_at: "2026-07-10T14:36:00.000Z",
          },
        ),
      ),
    /semantic_commit_stale_current_state|semantic_commit_precondition_mismatch/,
  );
  assert.deepEqual(
    readDatabaseSnapshot(opened.database),
    baseline,
    "one ABA target rolls back the complete multi-target transition",
  );
}

function runProjectionLedgerCoherenceCoverage(
  openDatabase: (label: string) => WriterCoverageDatabaseV01,
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
): void {
  for (const mode of [
    "missing_state_record",
    "state_fingerprint_drift",
    "missing_source_receipt",
    "source_receipt_mismatch",
  ] as const) {
    const opened = openDatabase(`projection-ledger-${mode}`);
    const applied = applyCreateScenario(opened.database, scenarios.create);
    const projection = applied.committed.projection_entries[0]!;
    persistVNextSemanticReviewMaterialV01(opened.database, {
      proposal: scenarios.replace.proposal,
      decision: scenarios.replace.decision,
    });
    if (mode === "missing_state_record") {
      opened.database.exec("DROP TRIGGER trg_vnext_core_records_immutable_delete");
      opened.database
        .prepare(
          `DELETE FROM vnext_core_records
           WHERE record_kind = 'semantic_state' AND record_id = ?`,
        )
        .run(projection.state_ref.external_id);
    } else if (mode === "state_fingerprint_drift") {
      opened.database
        .prepare(
          `UPDATE vnext_semantic_state_entries
           SET current_state_fingerprint = ?
           WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
        )
        .run(
          createProtocolSha256V01("projection-ledger-state-drift"),
          projection.workspace_id,
          projection.project_id,
          projection.target_key,
        );
    } else if (mode === "missing_source_receipt") {
      opened.database.exec("DROP TRIGGER trg_vnext_core_records_immutable_delete");
      opened.database
        .prepare(
          `DELETE FROM vnext_core_records
           WHERE record_kind = 'state_transition_receipt' AND record_id = ?`,
        )
        .run(projection.source_transition_receipt_id);
    } else {
      opened.database
        .prepare(
          `UPDATE vnext_semantic_state_entries
           SET source_transition_receipt_fingerprint = ?
           WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
        )
        .run(
          createProtocolSha256V01("projection-ledger-receipt-drift"),
          projection.workspace_id,
          projection.project_id,
          projection.target_key,
        );
    }
    ensureVNextDurableSemanticStoreSchemaV01(opened.database);
    const baseline = readDatabaseSnapshot(opened.database);
    const times = semanticGateScenarioTimes(scenarios.replace);
    assert.throws(
      () =>
        prepareVNextSemanticCommitPreviewV01(opened.database, {
          workspace_id: scenarios.replace.proposal.workspace_id,
          project_id: scenarios.replace.proposal.project_id,
          proposal_id: scenarios.replace.proposal.proposal_id,
          proposal_fingerprint: scenarios.replace.proposal.integrity.fingerprint,
          decision_id: scenarios.replace.decision.decision_id,
          decision_fingerprint: scenarios.replace.decision.integrity.fingerprint,
          ...previewRuntimeFields(scenarios.replace, times),
        }),
      /semantic_state_projection_record_missing|semantic_target_head_projection_mismatch|semantic_target_head_receipt_missing/,
      `${mode} cannot produce direct-local current-state observation material`,
    );
    assert.deepEqual(readDatabaseSnapshot(opened.database), baseline);
  }
}

function runDuplicateSemanticTargetCoverage(
  source: WriterCoverageDatabaseV01,
  refusal: WriterCoverageDatabaseV01,
  scenario: DurableLocalSemanticGateScenarioV01,
) {
  const prepared = prepareAndAuthorizeGateScenario(
    source.database,
    scenario,
    false,
  );
  persistVNextSemanticReviewMaterialV01(refusal.database, {
    proposal: scenario.proposal,
    decision: scenario.decision,
  });
  const forged = clone(prepared.authorization.gate_record);
  forged.current_state_observations.push(
    clone(forged.current_state_observations[0]!),
  );
  forged.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...forged,
      integrity: { ...forged.integrity, fingerprint: undefined },
    }),
  );
  insertVNextCoreRecordV01(refusal.database, {
    record_kind: "semantic_commit_gate",
    record_id: forged.gate_record_id,
    workspace_id: forged.workspace_id,
    project_id: forged.project_id,
    fingerprint: forged.integrity.fingerprint,
    idempotency_key: forged.confirmation_digest,
    payload: forged,
    created_at: forged.confirmed_at,
  });
  const baseline = readDatabaseSnapshot(refusal.database);
  assert.throws(
    () =>
      commitVNextSemanticTransitionV01(refusal.database, {
        ...writerCommitInput(scenario, prepared.authorization),
        gate_record_fingerprint: forged.integrity.fingerprint,
      }),
    /semantic_commit_gate_duplicate_current_state_target|semantic_commit_gate_relation_invalid/,
    "duplicate semantic target in persisted gate material fails closed",
  );
  assert.deepEqual(readDatabaseSnapshot(refusal.database), baseline);
  assertLegacySnapshotUnchanged(baseline, refusal.legacyBaseline);
}

function runWriterFailureInjectionCoverage(
  openDatabase: (label: string) => WriterCoverageDatabaseV01,
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  for (const checkpoint of [
    "after_proposal_record_insert",
    "after_decision_record_insert",
  ] as const) {
    const opened = openDatabase(`failure-${checkpoint}`);
    const baseline = readDatabaseSnapshot(opened.database);
    assert.throws(
      () =>
        persistVNextSemanticReviewMaterialV01(opened.database, {
          proposal: scenarios.create.proposal,
          decision: scenarios.create.decision,
          test_options: injectedFailure(checkpoint),
        }),
      new RegExp(`writer_test_failure:${checkpoint}`),
      `${checkpoint} rolls back proposal and decision persistence`,
    );
    assert.deepEqual(readDatabaseSnapshot(opened.database), baseline);
  }

  {
    const checkpoint = "after_gate_record_insert" as const;
    const opened = openDatabase(`failure-${checkpoint}`);
    persistVNextSemanticReviewMaterialV01(opened.database, {
      proposal: scenarios.create.proposal,
      decision: scenarios.create.decision,
    });
    const preview = prepareVNextSemanticCommitPreviewV01(opened.database, {
      workspace_id: scenarios.create.proposal.workspace_id,
      project_id: scenarios.create.proposal.project_id,
      proposal_id: scenarios.create.proposal.proposal_id,
      proposal_fingerprint: scenarios.create.proposal.integrity.fingerprint,
      decision_id: scenarios.create.decision.decision_id,
      decision_fingerprint: scenarios.create.decision.integrity.fingerprint,
      ...previewRuntimeFields(
        scenarios.create,
        semanticGateScenarioTimes(scenarios.create),
      ),
    });
    const baseline = readDatabaseSnapshot(opened.database);
    assert.throws(
      () =>
        recordVNextSemanticCommitAuthorizationV01(opened.database, {
          ...authorizationInput(scenarios.create, preview),
          test_options: injectedFailure(checkpoint),
        }),
      new RegExp(`writer_test_failure:${checkpoint}`),
    );
    assert.deepEqual(
      readDatabaseSnapshot(opened.database),
      baseline,
      "gate failure preserves independently persisted proposal and decision only",
    );
  }

  for (const checkpoint of [
    "after_first_state_record_insert",
    "after_first_projection_write",
    "before_receipt_insert",
    "after_receipt_insert_before_commit",
    "during_second_target",
  ] as const) {
    const opened = openDatabase(`failure-${checkpoint}`);
    const scenario =
      checkpoint === "during_second_target"
        ? scenarios.multi_target
        : scenarios.create;
    if (checkpoint === "during_second_target") {
      applyCreateScenario(opened.database, scenarios.create);
    }
    const prepared = prepareAndAuthorizeGateScenario(
      opened.database,
      scenario,
      false,
    );
    const baseline = readDatabaseSnapshot(opened.database);
    assert.throws(
      () =>
        commitVNextSemanticTransitionV01(opened.database, {
          ...writerCommitInput(scenario, prepared.authorization),
          test_options: injectedFailure(checkpoint),
        }),
      new RegExp(`writer_test_failure:${checkpoint}`),
      `${checkpoint} rolls back every transaction-scoped write`,
    );
    assert.deepEqual(
      readDatabaseSnapshot(opened.database),
      baseline,
      `${checkpoint} leaves no partial state or applied receipt`,
    );
    assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
  }
}

function injectedFailure(expected: string) {
  return {
    on_checkpoint(checkpoint: string) {
      if (checkpoint === expected) {
        throw new Error(`writer_test_failure:${checkpoint}`);
      }
    },
  };
}

function assertCanonicalCompiledPacket(
  priorPacket: TaskContextPacketV01,
  receipt: StateTransitionReceiptV01,
  projection: NonNullable<
    ReturnType<typeof commitVNextSemanticTransitionV01>["projection"]
  >,
  laterPacket: TaskContextPacketV01,
) {
  const accepted = laterPacket.selected_context.filter(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  assert.equal(accepted.length, 1, "create compilation selects one accepted state");
  assert.equal(accepted[0]!.source_ref, projection.state_fingerprint);
  assert.deepEqual(accepted[0]!.external_ref, projection.state_ref);
  assert.equal(
    accepted[0]!.compatibility_source_ref?.external_id,
    receipt.transition_receipt_id,
  );
  assert.equal(
    accepted[0]!.compatibility_source_ref?.source_ref,
    receipt.integrity.fingerprint,
  );
  for (const priorEntry of priorPacket.selected_context) {
    assert(
      laterPacket.selected_context.some(
        (entry) =>
          canonicalizeProtocolValueV01(entry) ===
          canonicalizeProtocolValueV01(priorEntry),
      ),
      `unrelated prior context remains unchanged: ${priorEntry.entry_id}`,
    );
  }
  const lowLevel = validateTaskContextPacketTransitionRelationV01(
    priorPacket,
    receipt,
    laterPacket,
  );
  assert.equal(lowLevel.status, "valid", JSON.stringify(lowLevel));
}

function runContextCompilerCoverage(
  parentDirectory: string,
  projectAScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
  projectBScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  const suffix = `${process.pid}`;
  const databases = new Map<string, Database.Database>();
  const ownedPaths = new Set<string>();
  const openDatabase = (label: string): WriterCoverageDatabaseV01 => {
    const path = resolve(
      parentDirectory,
      `m3c-context-compiler-${label}-${suffix}.db`,
    );
    for (const owned of [path, `${path}-wal`, `${path}-shm`]) {
      assert.equal(existsSync(owned), false, `context compiler coverage owns ${owned}`);
      ownedPaths.add(owned);
    }
    const database = new Database(path);
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    ensureVNextDurableSemanticStoreSchemaV01(database);
    const legacyMode = prepareLegacyTables(database);
    const legacyBaseline = readLegacySnapshot(readDatabaseSnapshot(database));
    databases.set(label, database);
    return { database, path, legacyMode, legacyBaseline };
  };

  const operationPackets: Record<
    string,
    { packet_id: string; fingerprint: string }
  > = {};
  try {
    const lookup = openDatabase("lookup-refusals");
    const lookupApplied = applyCreateScenario(
      lookup.database,
      projectAScenarios.create,
    );
    const canonicalInput = compilerInput(
      projectAScenarios.create,
      projectAScenarios.prefix.prior_packet,
      lookupApplied.committed.transition_receipt,
      DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
    );
    const lookupBaseline = readDatabaseSnapshot(lookup.database);
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          {
            ...canonicalInput,
            transition_receipt_id: "state-transition-receipt:missing-fixture",
          },
        ),
      lookupBaseline,
      /persisted_transition_receipt_missing/,
      "missing receipt",
    );
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          {
            ...canonicalInput,
            transition_receipt_fingerprint: createProtocolSha256V01(
              "wrong-compiler-receipt-fingerprint",
            ),
          },
        ),
      lookupBaseline,
      /persisted_transition_receipt_fingerprint_mismatch/,
      "wrong receipt fingerprint",
    );
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          {
            ...canonicalInput,
            project_id: projectBScenarios.prefix.project.project_id,
            prior_packet: projectBScenarios.prefix.prior_packet,
          },
        ),
      lookupBaseline,
      /persisted_transition_receipt_missing/,
      "foreign project receipt",
    );
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          {
            ...canonicalInput,
            generated_at: "malformed-timestamp",
          } as unknown as Parameters<
            typeof compileTaskContextPacketFromPersistedSemanticStateV01
          >[1],
        ),
      lookupBaseline,
      /local_runtime_timestamp_input_forbidden/,
      "caller-provided compiler timestamp is forbidden",
    );
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          {
            ...canonicalInput,
            clock: fixedClock("2026-07-10T14:05:30.000Z"),
          },
        ),
      lookupBaseline,
      /semantic_transition_full_chain_invalid:.*later_packet_precedes_transition_receipt/,
      "composed relation failure",
    );
    const boundedPrior = rebuildPacketV01(
      projectAScenarios.prefix.prior_packet,
      {},
      { max_selected_entries: 1 },
    );
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          { ...canonicalInput, prior_packet: boundedPrior },
        ),
      lookupBaseline,
      /semantic_transition_full_chain_invalid/,
      "bounded packet cannot silently drop required context",
    );
    const staleLocalPrior = rebuildPacketV01(
      projectAScenarios.prefix.prior_packet,
      {
        selected_context: [
          ...projectAScenarios.prefix.prior_packet.selected_context,
          acceptedStateFixtureEntry(
            VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
            "stale-local-selection",
          ),
        ],
      },
    );
    assertCompilerRefusalNoWrite(
      lookup,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          lookup.database,
          { ...canonicalInput, prior_packet: staleLocalPrior },
        ),
      lookupBaseline,
      /prior_packet_stale_local_semantic_state_selection/,
      "unresolved local accepted-state selection",
    );

    const lookupCompiled =
      compileTaskContextPacketFromPersistedSemanticStateV01(
        lookup.database,
        canonicalInput,
      );
    assert.equal(lookupCompiled.status, "inserted");
    const compiledSnapshot = readDatabaseSnapshot(lookup.database);
    const alteredPacket = clone(lookupCompiled.later_packet);
    alteredPacket.compatibility.warnings.push(
      "Altered duplicate packet identity must fail closed.",
    );
    assert.throws(
      () =>
        insertVNextCoreRecordV01(lookup.database, {
          record_kind: "task_context_packet",
          record_id: lookupCompiled.later_packet.packet_id,
          workspace_id: lookupCompiled.later_packet.workspace_id,
          project_id: lookupCompiled.later_packet.project_id,
          fingerprint: lookupCompiled.later_packet.integrity.fingerprint,
          idempotency_key: null,
          payload: alteredPacket,
          created_at: lookupCompiled.later_packet.generated_at,
        }),
      /vnext_core_record_conflict/,
      "duplicate packet identity with altered payload fails closed",
    );
    assert.deepEqual(readDatabaseSnapshot(lookup.database), compiledSnapshot);
    assertLegacySnapshotUnchanged(compiledSnapshot, lookup.legacyBaseline);

    const nonLocal = openDatabase("non-local-accepted-selection");
    const nonLocalApplied = applyCreateScenario(
      nonLocal.database,
      projectAScenarios.create,
    );
    const compatibilityAccepted = acceptedStateFixtureEntry(
      "compatibility.provider.semantic-state.v0.1",
      "non-local-selection",
    );
    const nonLocalPrior = rebuildPacketV01(
      projectAScenarios.prefix.prior_packet,
      {
        selected_context: [
          ...projectAScenarios.prefix.prior_packet.selected_context,
          compatibilityAccepted,
        ],
      },
    );
    const nonLocalCompiled =
      compileTaskContextPacketFromPersistedSemanticStateV01(
        nonLocal.database,
        compilerInput(
          projectAScenarios.create,
          nonLocalPrior,
          nonLocalApplied.committed.transition_receipt,
          DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
        ),
      );
    assert(
      nonLocalCompiled.later_packet.selected_context.some(
        (entry) =>
          canonicalizeProtocolValueV01(entry) ===
          canonicalizeProtocolValueV01(compatibilityAccepted),
      ),
      "non-local compatibility accepted-state selection remains unrelated and preserved",
    );

    for (const operation of ["replace", "supersede", "retract"] as const) {
      const opened = openDatabase(operation);
      const scenario = projectAScenarios[operation];
      const seedScenario: DurableLocalSemanticGateScenarioV01 =
        operation === "supersede"
          ? {
              scenario_id: "create",
              proposal: scenario.proposal,
              decision: projectAScenarios.supersede_prior_accept_decision,
              expected_operations: ["create"],
              expected_target_count: 1,
            }
          : projectAScenarios.create;
      const seed = applyCreateScenario(opened.database, seedScenario);
      const priorCompiled =
        compileTaskContextPacketFromPersistedSemanticStateV01(
          opened.database,
          compilerInput(
            seedScenario,
            projectAScenarios.prefix.prior_packet,
            seed.committed.transition_receipt,
            DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
          ),
        );
      const followupPrepared = prepareAndAuthorizeGateScenario(
        opened.database,
        scenario,
        false,
      );
      const followup = commitVNextSemanticTransitionV01(
        opened.database,
        writerCommitInput(scenario, followupPrepared.authorization),
      );
      const compiled = compileTaskContextPacketFromPersistedSemanticStateV01(
        opened.database,
        compilerInput(
          scenario,
          priorCompiled.later_packet,
          followup.transition_receipt,
          DURABLE_LOCAL_LOOP_FOLLOWUP_PACKET_GENERATED_AT,
        ),
      );
      assert.equal(compiled.status, "inserted");
      assert.equal(compiled.full_chain_relation.status, "valid");
      const priorAccepted = priorCompiled.later_packet.selected_context.find(
        (entry) => entry.entry_kind === "accepted_state_ref",
      );
      assert(priorAccepted, `${operation} prior packet contains applied state`);
      assert.equal(
        compiled.later_packet.selected_context.some(
          (entry) =>
            entry.entry_kind === "accepted_state_ref" &&
            entry.source_ref === priorAccepted.source_ref &&
            canonicalizeProtocolValueV01(entry.external_ref) ===
              canonicalizeProtocolValueV01(priorAccepted.external_ref),
        ),
        false,
        `${operation} compiler excludes the exact retired before-state`,
      );
      const retainedBefore = rebuildPacketV01(compiled.later_packet, {
        selected_context: [
          ...compiled.later_packet.selected_context,
          priorAccepted,
        ],
      });
      const retainedRelation = validateSemanticTransitionFullChainV01({
        ...compiled.full_chain_input,
        later_packet: retainedBefore,
      });
      assert.notEqual(retainedRelation.status, "valid");
      assert(
        retainedRelation.errors.some(
          (issue) => issue.code === "retired_before_state_retained",
        ),
        `${operation} retained before-state fails composed validation`,
      );
      if (operation === "retract") {
        const invented = clone(priorAccepted);
        invented.entry_id = `${invented.entry_id}:invented`;
        invented.source_ref = createProtocolSha256V01(
          "invented-retracted-state",
        );
        if (invented.external_ref) {
          invented.external_ref.external_id = `${invented.external_ref.external_id}:invented`;
          invented.external_ref.source_ref = invented.source_ref;
        }
        const inventedPacket = rebuildPacketV01(compiled.later_packet, {
          selected_context: [
            ...compiled.later_packet.selected_context,
            invented,
          ],
        });
        const inventedRelation = validateSemanticTransitionFullChainV01({
          ...compiled.full_chain_input,
          later_packet: inventedPacket,
        });
        assert.notEqual(
          inventedRelation.status,
          "valid",
          "retract cannot invent a replacement accepted state",
        );
      }
      const snapshot = readDatabaseSnapshot(opened.database);
      assertLegacySnapshotUnchanged(snapshot, opened.legacyBaseline);
      operationPackets[operation] = {
        packet_id: compiled.later_packet.packet_id,
        fingerprint: compiled.later_packet.integrity.fingerprint,
      };
    }

    runProjectionCompilerRefusals(openDatabase, projectAScenarios.create);
    runPriorReceiptEnvelopeRefusals(openDatabase, projectAScenarios);
    for (const database of databases.values()) {
      assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    }
    return {
      status: "pass",
      positive_cases: 6,
      negative_cases: 17,
      operation_packets: operationPackets,
      deterministic_compile_replay: true,
      packet_persisted_after_validation_only: true,
      refusal_cases: [
        "missing_receipt",
        "wrong_receipt_fingerprint",
        "foreign_project_receipt",
        "projection_drift",
        "projection_revision_drift",
        "projection_recorded_at_drift",
        "missing_state_after_create",
        "retained_before_after_replace",
        "retained_before_after_supersede",
        "retained_before_after_retract",
        "invented_state_after_retract",
        "packet_bound_or_validation_failure",
        "composed_relation_failure",
        "duplicate_packet_identity_altered_payload",
        "stale_local_accepted_state_selection",
        "supersede_prior_receipt_envelope_idempotency_mismatch",
        "retract_prior_receipt_envelope_idempotency_mismatch",
      ],
      legacy_table_deltas: {
        state_delta_proposals: 0,
        state_entries: 0,
        state_transitions: 0,
      },
      fetch_calls: fetchCalls,
      provider_calls: 0,
      network_calls: networkCalls,
      integrity_check: "ok",
    };
  } finally {
    for (const database of databases.values()) {
      if (database.open) database.close();
    }
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `context compiler coverage removes ${path}`);
    }
  }
}

function runLocalContextUseProbeCoverage(
  parentDirectory: string,
  projectAScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
  projectBScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  const suffix = `${process.pid}`;
  const databases = new Map<string, Database.Database>();
  const ownedPaths = new Set<string>();
  const openDatabase = (label: string): WriterCoverageDatabaseV01 => {
    const path = resolve(
      parentDirectory,
      `m3c-context-use-probe-${label}-${suffix}.db`,
    );
    for (const owned of [path, `${path}-wal`, `${path}-shm`]) {
      assert.equal(existsSync(owned), false, `context-use coverage owns ${owned}`);
      ownedPaths.add(owned);
    }
    const database = new Database(path);
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    ensureVNextDurableSemanticStoreSchemaV01(database);
    const legacyMode = prepareLegacyTables(database);
    const legacyBaseline = readLegacySnapshot(readDatabaseSnapshot(database));
    databases.set(label, database);
    return { database, path, legacyMode, legacyBaseline };
  };

  try {
    const canonical = openDatabase("canonical");
    const canonicalChain = prepareCreateContextUseProbeChain(
      canonical.database,
      projectAScenarios.create,
      projectAScenarios.prefix.prior_packet,
    );
    const canonicalInput = localContextUseProbeInput(
      projectAScenarios.prefix.prior_packet,
      canonicalChain.compiled.later_packet,
      canonicalChain.applied.committed.transition_receipt,
      DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
    );
    const canonicalProbe = runLocalContextUseProbeV01(
      canonical.database,
      canonicalInput,
    );
    assert.equal(canonicalProbe.status, "inserted");
    assert.equal(canonicalProbe.relation.status, "valid");
    assert.equal(validateRunReceiptV01(canonicalProbe.receipt).status, "valid");
    assert.equal(canonicalProbe.resolved_states.length, 1);
    assert.equal(canonicalProbe.retracted_target_refs.length, 0);
    assert.equal(canonicalProbe.receipt.attestations.length, 0);
    assert.equal(canonicalProbe.receipt.model_invocations.length, 0);
    assert(canonicalProbe.receipt.trust_summary.direct_observations > 0);
    assert.equal(
      countVNextCoreRecordsV01(canonical.database, {
        workspace_id: projectAScenarios.create.proposal.workspace_id,
        project_id: projectAScenarios.create.proposal.project_id,
        record_kind: "run_receipt",
      }),
      1,
    );
    const canonicalSnapshot = readDatabaseSnapshot(canonical.database);
    const canonicalReplay = runLocalContextUseProbeV01(
      canonical.database,
      canonicalInput,
    );
    assert.equal(canonicalReplay.status, "exact_replay");
    assert.deepEqual(canonicalReplay.receipt, canonicalProbe.receipt);
    assert.deepEqual(readDatabaseSnapshot(canonical.database), canonicalSnapshot);

    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(canonical.database, {
          ...canonicalInput,
          later_packet_id: "task-context-packet:missing-probe-fixture",
        }),
      canonicalSnapshot,
      /later_task_context_packet_missing/,
      "missing later packet",
    );
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(canonical.database, {
          ...canonicalInput,
          later_packet_fingerprint: createProtocolSha256V01(
            "wrong-context-use-packet-fingerprint",
          ),
        }),
      canonicalSnapshot,
      /later_task_context_packet_fingerprint_mismatch/,
      "later packet fingerprint mismatch",
    );
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(canonical.database, {
          ...canonicalInput,
          expected_transition_receipt_fingerprint: createProtocolSha256V01(
            "wrong-context-use-receipt-fingerprint",
          ),
        }),
      canonicalSnapshot,
      /persisted_transition_receipt_fingerprint_mismatch/,
      "transition receipt fingerprint mismatch",
    );
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(canonical.database, {
          ...canonicalInput,
          clock: fixedClock("2026-07-10T14:05:30.000Z"),
        }),
      canonicalSnapshot,
      /local_context_observation_before_transition_receipt/,
      "probe observation predates transition receipt",
    );
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(canonical.database, {
          ...canonicalInput,
          clock: fixedClock("2026-07-10T14:06:30.000Z"),
        }),
      canonicalSnapshot,
      /local_context_observation_before_later_packet/,
      "probe observation predates later packet",
    );
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(
          canonical.database,
          {
            ...canonicalInput,
            observed_at: "2099-01-01T00:00:00.000Z",
          } as unknown as Parameters<typeof runLocalContextUseProbeV01>[1],
        ),
      canonicalSnapshot,
      /local_runtime_timestamp_input_forbidden/,
      "caller-provided probe observation timestamp",
    );

    const withoutReceiptLineage = rebuildPacketV01(
      canonicalChain.compiled.later_packet,
      {
        compatibility: {
          ...canonicalChain.compiled.later_packet.compatibility,
          source_refs:
            canonicalChain.compiled.later_packet.compatibility.source_refs.filter(
              (ref) =>
                ref.external_id !==
                canonicalChain.applied.committed.transition_receipt
                  .transition_receipt_id,
            ),
        },
      },
    );
    persistTaskContextPacketRecordV01(canonical.database, withoutReceiptLineage);
    const withoutReceiptLineageSnapshot = readDatabaseSnapshot(
      canonical.database,
    );
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(
          canonical.database,
          localContextUseProbeInput(
            projectAScenarios.prefix.prior_packet,
            withoutReceiptLineage,
            canonicalChain.applied.committed.transition_receipt,
            DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
          ),
        ),
      withoutReceiptLineageSnapshot,
      /local_context_semantic_transition_full_chain_invalid/,
      "later packet missing transition receipt lineage",
    );

    const withoutPriorLineage = rebuildPacketV01(
      canonicalChain.compiled.later_packet,
      {
        compatibility: {
          ...canonicalChain.compiled.later_packet.compatibility,
          source_refs:
            canonicalChain.compiled.later_packet.compatibility.source_refs.filter(
              (ref) =>
                ref.external_id !==
                projectAScenarios.prefix.prior_packet.packet_id,
            ),
        },
      },
    );
    persistTaskContextPacketRecordV01(canonical.database, withoutPriorLineage);
    const withoutPriorLineageSnapshot = readDatabaseSnapshot(canonical.database);
    assertProbeRefusalNoWrite(
      canonical,
      () =>
        runLocalContextUseProbeV01(
          canonical.database,
          localContextUseProbeInput(
            projectAScenarios.prefix.prior_packet,
            withoutPriorLineage,
            canonicalChain.applied.committed.transition_receipt,
            DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
          ),
        ),
      withoutPriorLineageSnapshot,
      /local_context_prior_packet_lineage_mismatch/,
      "later packet missing exact prior packet lineage",
    );

    for (const trustClass of ["imported_unverified", "host_attestation"] as const) {
      const trustUpgrade = clone(canonicalProbe.receipt);
      (
        trustUpgrade.observations[0] as unknown as { trust_class: string }
      ).trust_class = trustClass;
      const relation = validateLocalContextUseProbeRunReceiptV01({
        receipt: trustUpgrade,
        prior_packet: canonicalProbe.prior_packet,
        later_packet: canonicalProbe.later_packet,
        transition_receipt: canonicalProbe.transition_receipt,
        resolved_states: canonicalProbe.resolved_states,
        retracted_target_refs: canonicalProbe.retracted_target_refs,
      });
      assert.equal(
        relation.status,
        "invalid",
        `${trustClass} material cannot be presented as direct local observation`,
      );
    }
    assert.doesNotThrow(() => {
      validateLocalContextUseProbeRunReceiptV01({
        receipt: {},
        prior_packet: canonicalProbe.prior_packet,
        later_packet: canonicalProbe.later_packet,
        transition_receipt: canonicalProbe.transition_receipt,
        resolved_states: canonicalProbe.resolved_states,
        retracted_target_refs: canonicalProbe.retracted_target_refs,
      });
    });
    const malformedRelation = validateLocalContextUseProbeRunReceiptV01({
      receipt: {},
      prior_packet: canonicalProbe.prior_packet,
      later_packet: canonicalProbe.later_packet,
      transition_receipt: canonicalProbe.transition_receipt,
      resolved_states: canonicalProbe.resolved_states,
      retracted_target_refs: canonicalProbe.retracted_target_refs,
    });
    assert.equal(malformedRelation.status, "invalid");
    for (const malformedMaterial of [
      { resolved_states: [{}], retracted_target_refs: [] },
      { resolved_states: [], retracted_target_refs: [{}] },
    ]) {
      let relationStatus: string | null = null;
      assert.doesNotThrow(() => {
        relationStatus = validateLocalContextUseProbeRunReceiptV01({
          receipt: canonicalProbe.receipt,
          prior_packet: canonicalProbe.prior_packet,
          later_packet: canonicalProbe.later_packet,
          transition_receipt: canonicalProbe.transition_receipt,
          ...malformedMaterial,
        }).status;
      });
      assert.equal(relationStatus, "invalid");
    }

    const extraClaimReceipt = rebuildRunReceiptV01(
      canonicalProbe.receipt,
      (builderInput) => {
        builderInput.result_summary.limitations.push(
          "An extra caller-supplied semantic conclusion was not observed by the local probe.",
        );
      },
    );
    assert.equal(validateRunReceiptV01(extraClaimReceipt).status, "valid");
    const extraClaimRelation = validateLocalContextUseProbeRunReceiptV01({
      receipt: extraClaimReceipt,
      prior_packet: canonicalProbe.prior_packet,
      later_packet: canonicalProbe.later_packet,
      transition_receipt: canonicalProbe.transition_receipt,
      resolved_states: canonicalProbe.resolved_states,
      retracted_target_refs: canonicalProbe.retracted_target_refs,
    });
    assert.equal(extraClaimRelation.status, "invalid");
    assert(
      extraClaimRelation.errors.some(
        (issue) => issue.code === "local_context_use_receipt_canonical_mismatch",
      ),
      "exact canonical probe reconstruction rejects extra valid-looking claims",
    );

    const alteredStoredPayload = clone(canonicalProbe.receipt);
    alteredStoredPayload.result_summary.summary =
      "Altered same-identity local context-use receipt payload.";
    assert.throws(
      () =>
        insertVNextCoreRecordV01(canonical.database, {
          record_kind: "run_receipt",
          record_id: canonicalProbe.receipt.receipt_id,
          workspace_id: canonicalProbe.receipt.workspace_id,
          project_id: canonicalProbe.receipt.project_id,
          fingerprint: canonicalProbe.receipt.integrity.fingerprint,
          idempotency_key: canonicalProbe.receipt.idempotency_key,
          payload: alteredStoredPayload,
          created_at: canonicalProbe.receipt.recorded_at,
        }),
      /vnext_core_record_conflict/,
      "duplicate RunReceipt identity with altered payload fails closed",
    );

    for (const mode of [
      "missing",
      "fingerprint_drift",
      "foreign_project",
      "receipt_binding_drift",
      "future_projection",
    ] as const) {
      const opened = openDatabase(`state-${mode}`);
      const chain = prepareCreateContextUseProbeChain(
        opened.database,
        projectAScenarios.create,
        projectAScenarios.prefix.prior_packet,
      );
      const projection = chain.applied.committed.projection_entries[0]!;
      if (mode === "missing") {
        opened.database
          .prepare(
            `DELETE FROM vnext_semantic_state_entries
             WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
          )
          .run(projection.workspace_id, projection.project_id, projection.target_key);
      } else if (mode === "fingerprint_drift") {
        opened.database
          .prepare(
            `UPDATE vnext_semantic_state_entries
             SET current_state_fingerprint = ?
             WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
          )
          .run(
            createProtocolSha256V01("context-use-state-fingerprint-drift"),
            projection.workspace_id,
            projection.project_id,
            projection.target_key,
          );
      } else if (mode === "foreign_project") {
        opened.database
          .prepare(
            `UPDATE vnext_semantic_state_entries
             SET project_id = ?
             WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
          )
          .run(
            projectBScenarios.create.proposal.project_id,
            projection.workspace_id,
            projection.project_id,
            projection.target_key,
          );
      } else if (mode === "receipt_binding_drift") {
        opened.database
          .prepare(
            `UPDATE vnext_semantic_state_entries
             SET source_transition_receipt_id = ?,
                 source_transition_receipt_fingerprint = ?
             WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
          )
          .run(
            "state-transition-receipt:unrelated-probe-fixture",
            createProtocolSha256V01("unrelated-probe-receipt"),
            projection.workspace_id,
            projection.project_id,
            projection.target_key,
          );
      } else {
        opened.database
          .prepare(
            `UPDATE vnext_semantic_state_entries
             SET updated_at = ?
             WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
          )
          .run(
            "2026-07-10T14:20:00.000Z",
            projection.workspace_id,
            projection.project_id,
            projection.target_key,
          );
      }
      const baseline = readDatabaseSnapshot(opened.database);
      assertProbeRefusalNoWrite(
        opened,
        () =>
          runLocalContextUseProbeV01(
            opened.database,
            localContextUseProbeInput(
              projectAScenarios.prefix.prior_packet,
              chain.compiled.later_packet,
              chain.applied.committed.transition_receipt,
              DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
            ),
          ),
        baseline,
        mode === "receipt_binding_drift"
          ? /local_context_affected_projection_receipt_mismatch|local_context_semantic_target_head_drift/
          : mode === "future_projection"
            ? /local_context_observation_before_projection_update|local_context_semantic_target_head_drift/
            : /local_context_selected_state_missing/,
        `current semantic state ${mode}`,
      );
    }

    const retract = openDatabase("retract");
    const seed = applyCreateScenario(
      retract.database,
      projectAScenarios.create,
    );
    const seedPacket = compileTaskContextPacketFromPersistedSemanticStateV01(
      retract.database,
      compilerInput(
        projectAScenarios.create,
        projectAScenarios.prefix.prior_packet,
        seed.committed.transition_receipt,
        DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
      ),
    );
    const retractPrepared = prepareAndAuthorizeGateScenario(
      retract.database,
      projectAScenarios.retract,
      false,
    );
    const retracted = commitVNextSemanticTransitionV01(
      retract.database,
      writerCommitInput(
        projectAScenarios.retract,
        retractPrepared.authorization,
      ),
    );
    const retractedPacket = compileTaskContextPacketFromPersistedSemanticStateV01(
      retract.database,
      compilerInput(
        projectAScenarios.retract,
        seedPacket.later_packet,
        retracted.transition_receipt,
        DURABLE_LOCAL_LOOP_FOLLOWUP_PACKET_GENERATED_AT,
      ),
    );
    const retractInput = localContextUseProbeInput(
      seedPacket.later_packet,
      retractedPacket.later_packet,
      retracted.transition_receipt,
      DURABLE_LOCAL_LOOP_FOLLOWUP_PROBE_RECORDED_AT,
    );
    const retractProbe = runLocalContextUseProbeV01(
      retract.database,
      retractInput,
    );
    assert.equal(retractProbe.status, "inserted");
    assert.equal(retractProbe.relation.status, "valid");
    assert.equal(retractProbe.resolved_states.length, 0);
    assert.equal(retractProbe.retracted_target_refs.length, 1);
    insertVNextSemanticStateEntryV01(
      retract.database,
      seed.committed.projection_entries[0]!,
    );
    const retractedStatePresent = readDatabaseSnapshot(retract.database);
    assertProbeRefusalNoWrite(
      retract,
      () => runLocalContextUseProbeV01(retract.database, retractInput),
      retractedStatePresent,
      /local_context_retracted_state_still_present/,
      "retracted semantic state still present",
    );

    const twoProject = openDatabase("two-project");
    const chainA = prepareCreateContextUseProbeChain(
      twoProject.database,
      projectAScenarios.create,
      projectAScenarios.prefix.prior_packet,
    );
    const chainB = prepareCreateContextUseProbeChain(
      twoProject.database,
      projectBScenarios.create,
      projectBScenarios.prefix.prior_packet,
    );
    const probeA = runLocalContextUseProbeV01(
      twoProject.database,
      localContextUseProbeInput(
        projectAScenarios.prefix.prior_packet,
        chainA.compiled.later_packet,
        chainA.applied.committed.transition_receipt,
        DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
      ),
    );
    const probeB = runLocalContextUseProbeV01(
      twoProject.database,
      localContextUseProbeInput(
        projectBScenarios.prefix.prior_packet,
        chainB.compiled.later_packet,
        chainB.applied.committed.transition_receipt,
        DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
      ),
    );
    assert.notEqual(probeA.receipt.receipt_id, probeB.receipt.receipt_id);
    assert.equal(probeA.receipt.project_id, projectAScenarios.create.proposal.project_id);
    assert.equal(probeB.receipt.project_id, projectBScenarios.create.proposal.project_id);
    assert.equal(
      readVNextCoreRecordV01(twoProject.database, {
        record_kind: "run_receipt",
        record_id: probeA.receipt.receipt_id,
        workspace_id: probeB.receipt.workspace_id,
        project_id: probeB.receipt.project_id,
      }),
      null,
      "project A context-use receipt cannot resolve in project B scope",
    );

    for (const database of databases.values()) {
      assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
    }
    return {
      status: "pass",
      positive_cases: 9,
      negative_cases: 21,
      exact_packet_and_receipt_bindings: true,
      exact_prior_packet_lineage: true,
      exact_state_record_and_projection_resolution: true,
      exact_retracted_absence: true,
      exact_replay: true,
      malformed_relation_non_throwing: true,
      canonical_receipt_reconstruction: true,
      project_isolation: true,
      direct_local_observations_only: true,
      provider_calls: 0,
      fetch_calls: fetchCalls,
      network_calls: networkCalls,
      refusal_cases: [
        "packet_missing",
        "packet_fingerprint_mismatch",
        "transition_receipt_fingerprint_mismatch",
        "observation_before_transition_receipt",
        "observation_before_later_packet",
        "caller_observation_timestamp",
        "transition_receipt_lineage_missing",
        "prior_packet_lineage_missing",
        "imported_material_as_direct_observation",
        "attested_material_as_direct_observation",
        "malformed_probe_receipt",
        "malformed_resolved_state_relation_material",
        "malformed_retracted_target_relation_material",
        "extra_canonical_probe_claim",
        "duplicate_run_receipt_altered_payload",
        "semantic_state_missing",
        "semantic_state_fingerprint_drift",
        "cross_project_semantic_state",
        "affected_projection_receipt_binding_drift",
        "observation_before_projection_update",
        "retracted_state_still_present",
      ],
      integrity_check: "ok",
    };
  } finally {
    for (const database of databases.values()) {
      if (database.open) database.close();
    }
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `context-use coverage removes ${path}`);
    }
  }
}

function runFullDurableLocalLoopCoverage(
  parentDirectory: string,
  projectAScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
  projectBScenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  const suffix = `${process.pid}`;
  const mainPath = resolve(parentDirectory, `m3c-full-loop-${suffix}.db`);
  const preBackupPath = resolve(
    parentDirectory,
    `m3c-full-loop-pre-backup-${suffix}.db`,
  );
  const preRestoredPath = resolve(
    parentDirectory,
    `m3c-full-loop-pre-restored-${suffix}.db`,
  );
  const postBackupPath = resolve(
    parentDirectory,
    `m3c-full-loop-post-backup-${suffix}.db`,
  );
  const postRestoredPath = resolve(
    parentDirectory,
    `m3c-full-loop-post-restored-${suffix}.db`,
  );
  const databasePaths = [
    mainPath,
    preBackupPath,
    preRestoredPath,
    postBackupPath,
    postRestoredPath,
  ];
  const ownedPaths = databasePaths.flatMap((path) => [
    path,
    `${path}-wal`,
    `${path}-shm`,
  ]);
  for (const path of ownedPaths) {
    assert.equal(existsSync(path), false, `full loop coverage owns ${path}`);
  }

  let database: Database.Database | null = null;
  let preRestored: Database.Database | null = null;
  let postRestored: Database.Database | null = null;
  let reopened: Database.Database | null = null;
  try {
    const projectA = projectAScenarios.create;
    const projectB = projectBScenarios.create;
    assert.equal(
      projectA.proposal.workspace_id,
      projectB.proposal.workspace_id,
      "two-project full loop uses one explicit workspace",
    );
    assert.notEqual(
      projectA.proposal.project_id,
      projectB.proposal.project_id,
      "two-project full loop keeps project identities distinct",
    );

    database = new Database(mainPath);
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    ensureVNextDurableSemanticStoreSchemaV01(database);
    prepareLegacyTables(database);
    const legacyBaseline = readLegacySnapshot(readDatabaseSnapshot(database));

    const priorPacketA = persistTaskContextPacketRecordV01(
      database,
      projectAScenarios.prefix.prior_packet,
    );
    const priorPacketB = persistTaskContextPacketRecordV01(
      database,
      projectBScenarios.prefix.prior_packet,
    );
    assert.equal(priorPacketA.status, "inserted");
    assert.equal(priorPacketB.status, "inserted");
    const preparedA = prepareAndAuthorizeGateScenario(database, projectA, false);
    const preparedB = prepareAndAuthorizeGateScenario(database, projectB, false);
    const preTransitionSnapshot = readDatabaseSnapshot(database);
    assertLegacySnapshotUnchanged(preTransitionSnapshot, legacyBaseline);

    database.pragma("wal_checkpoint(TRUNCATE)");
    copyFileSync(mainPath, preBackupPath);
    copyFileSync(preBackupPath, preRestoredPath);
    preRestored = new Database(preRestoredPath, {
      readonly: true,
      fileMustExist: true,
    });
    preRestored.pragma("foreign_keys = ON");
    assert.deepEqual(
      readDatabaseSnapshot(preRestored),
      preTransitionSnapshot,
      "pre-transition backup/restore reproduces exact rows and hashes",
    );
    assert.equal(preRestored.pragma("integrity_check", { simple: true }), "ok");
    preRestored.close();
    preRestored = null;

    const committedA = commitVNextSemanticTransitionV01(database, {
      ...writerCommitInput(projectA, preparedA.authorization),
    });
    const committedB = commitVNextSemanticTransitionV01(database, {
      ...writerCommitInput(projectB, preparedB.authorization),
    });
    assert.equal(committedA.status, "applied");
    assert.equal(committedB.status, "applied");
    assertWriterReceiptRelation(projectA, committedA);
    assertWriterReceiptRelation(projectB, committedB);

    const compiledA = compileTaskContextPacketFromPersistedSemanticStateV01(
      database,
      compilerInput(
        projectA,
        projectAScenarios.prefix.prior_packet,
        committedA.transition_receipt,
        DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
      ),
    );
    const compiledB = compileTaskContextPacketFromPersistedSemanticStateV01(
      database,
      compilerInput(
        projectB,
        projectBScenarios.prefix.prior_packet,
        committedB.transition_receipt,
        DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
      ),
    );
    const probeA = runLocalContextUseProbeV01(
      database,
      localContextUseProbeInput(
        projectAScenarios.prefix.prior_packet,
        compiledA.later_packet,
        committedA.transition_receipt,
        DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
      ),
    );
    const probeB = runLocalContextUseProbeV01(
      database,
      localContextUseProbeInput(
        projectBScenarios.prefix.prior_packet,
        compiledB.later_packet,
        committedB.transition_receipt,
        DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT,
      ),
    );
    assert.equal(probeA.status, "inserted");
    assert.equal(probeB.status, "inserted");
    assert.equal(probeA.relation.status, "valid");
    assert.equal(probeB.relation.status, "valid");

    const targetA = projectA.decision.requested_transition_intent!.target_refs[0]!;
    const targetB = projectB.decision.requested_transition_intent!.target_refs[0]!;
    assert.equal(
      canonicalizeProtocolValueV01(targetA),
      canonicalizeProtocolValueV01(targetB),
      "the same repository ExternalRef may be used independently by two projects",
    );
    assert.equal(
      deriveVNextSemanticTargetKeyV01(targetA),
      deriveVNextSemanticTargetKeyV01(targetB),
    );

    assertPriorLaterSelectionChange(
      projectAScenarios.prefix.prior_packet,
      compiledA.later_packet,
      committedA.projection_entries[0]!,
      probeA.receipt,
      "project A",
    );
    assertPriorLaterSelectionChange(
      projectBScenarios.prefix.prior_packet,
      compiledB.later_packet,
      committedB.projection_entries[0]!,
      probeB.receipt,
      "project B",
    );

    const bindingsA = fullLoopRecordBindings(
      projectA,
      preparedA.authorization,
      committedA,
      projectAScenarios.prefix.prior_packet,
      compiledA.later_packet,
      probeA.receipt,
    );
    const bindingsB = fullLoopRecordBindings(
      projectB,
      preparedB.authorization,
      committedB,
      projectBScenarios.prefix.prior_packet,
      compiledB.later_packet,
      probeB.receipt,
    );
    assertProjectScopedFullLoopRecords(
      database,
      projectA.proposal.workspace_id,
      projectA.proposal.project_id,
      projectB.proposal.project_id,
      bindingsA,
      "project A",
    );
    assertProjectScopedFullLoopRecords(
      database,
      projectB.proposal.workspace_id,
      projectB.proposal.project_id,
      projectA.proposal.project_id,
      bindingsB,
      "project B",
    );

    const projectionsA = listVNextSemanticStateEntriesV01(database, {
      workspace_id: projectA.proposal.workspace_id,
      project_id: projectA.proposal.project_id,
    });
    const projectionsB = listVNextSemanticStateEntriesV01(database, {
      workspace_id: projectB.proposal.workspace_id,
      project_id: projectB.proposal.project_id,
    });
    assert.equal(projectionsA.length, 1);
    assert.equal(projectionsB.length, 1);
    assert.equal(
      projectionsA[0]!.state_fingerprint,
      projectionsB[0]!.state_fingerprint,
      "identical bounded semantic content keeps one content fingerprint across projects",
    );
    assert.notEqual(
      projectionsA[0]!.state_ref.external_id,
      projectionsB[0]!.state_ref.external_id,
      "project-scoped semantic-state records remain independently addressable",
    );

    const postTransitionSnapshot = readDatabaseSnapshot(database);
    assertLegacySnapshotUnchanged(postTransitionSnapshot, legacyBaseline);
    database.pragma("wal_checkpoint(TRUNCATE)");
    copyFileSync(mainPath, postBackupPath);
    copyFileSync(postBackupPath, postRestoredPath);
    postRestored = new Database(postRestoredPath, {
      readonly: true,
      fileMustExist: true,
    });
    postRestored.pragma("foreign_keys = ON");
    const restoredSnapshot = readDatabaseSnapshot(postRestored);
    assert.deepEqual(
      restoredSnapshot,
      postTransitionSnapshot,
      "post-transition backup/restore reproduces exact records and projection",
    );
    assert.deepEqual(
      listVNextSemanticStateEntriesV01(postRestored, {
        workspace_id: projectA.proposal.workspace_id,
        project_id: projectA.proposal.project_id,
      }),
      projectionsA,
    );
    assert.deepEqual(
      listVNextSemanticStateEntriesV01(postRestored, {
        workspace_id: projectB.proposal.workspace_id,
        project_id: projectB.proposal.project_id,
      }),
      projectionsB,
    );
    for (const binding of [...bindingsA, ...bindingsB]) {
      const projectId = bindingsA.includes(binding)
        ? projectA.proposal.project_id
        : projectB.proposal.project_id;
      const record = readVNextCoreRecordV01(postRestored, {
        record_kind: binding.record_kind,
        record_id: binding.record_id,
        workspace_id: projectA.proposal.workspace_id,
        project_id: projectId,
      });
      assert(record, `restored DB retains ${binding.record_kind}:${binding.record_id}`);
      assert.equal(record.fingerprint, binding.fingerprint);
    }
    assert.equal(postRestored.pragma("integrity_check", { simple: true }), "ok");
    postRestored.close();
    postRestored = null;

    database.close();
    database = null;
    reopened = new Database(mainPath, { readonly: true, fileMustExist: true });
    reopened.pragma("foreign_keys = ON");
    assert.deepEqual(
      readDatabaseSnapshot(reopened),
      postTransitionSnapshot,
      "two-project full loop survives close/reopen exactly",
    );
    assert.equal(reopened.pragma("integrity_check", { simple: true }), "ok");

    const fullLoopFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        loop_version: "vnext_durable_local_closed_loop.v0.1",
        workspace_id: projectA.proposal.workspace_id,
        projects: [
          {
            project_id: projectA.proposal.project_id,
            records: bindingsA,
            projection: projectionsA,
          },
          {
            project_id: projectB.proposal.project_id,
            records: bindingsB,
            projection: projectionsB,
          },
        ],
      }),
    );
    return {
      status: "pass",
      positive_cases: 14,
      negative_cases: bindingsA.length + bindingsB.length,
      workspace_id: projectA.proposal.workspace_id,
      project_ids: [projectA.proposal.project_id, projectB.proposal.project_id],
      project_record_binding_count: bindingsA.length + bindingsB.length,
      same_repository_external_ref_isolated: true,
      exact_prior_later_selection_change: true,
      exact_probe_observation: true,
      project_scoped_lookup_refusals: bindingsA.length + bindingsB.length,
      pre_transition_backup_restore: true,
      post_transition_backup_restore: true,
      close_reopen: true,
      prior_failure_injection_coverage_preserved: true,
      legacy_table_deltas: {
        state_delta_proposals: 0,
        state_entries: 0,
        state_transitions: 0,
      },
      fetch_calls: fetchCalls,
      provider_calls: 0,
      network_calls: networkCalls,
      product_db_writes: 0,
      pre_transition_db_checksum: preTransitionSnapshot.logical_checksum,
      post_transition_db_checksum: postTransitionSnapshot.logical_checksum,
      restored_db_checksum: restoredSnapshot.logical_checksum,
      full_loop_fingerprint: fullLoopFingerprint,
      project_records: {
        project_a: bindingsA,
        project_b: bindingsB,
      },
      integrity_check: "ok",
    };
  } finally {
    if (database?.open) database.close();
    if (preRestored?.open) preRestored.close();
    if (postRestored?.open) postRestored.close();
    if (reopened?.open) reopened.close();
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `full loop coverage removes ${path}`);
    }
  }
}

interface FullLoopRecordBindingV01 {
  record_kind:
    | "episode_delta_proposal"
    | "review_decision"
    | "semantic_commit_gate"
    | "semantic_state"
    | "state_transition_receipt"
    | "task_context_packet"
    | "run_receipt";
  record_id: string;
  fingerprint: string;
}

function fullLoopRecordBindings(
  scenario: DurableLocalSemanticGateScenarioV01,
  authorization: VNextSemanticCommitAuthorizationResultV01,
  committed: ReturnType<typeof commitVNextSemanticTransitionV01>,
  priorPacket: TaskContextPacketV01,
  laterPacket: TaskContextPacketV01,
  probeReceipt: ReturnType<typeof runLocalContextUseProbeV01>["receipt"],
): FullLoopRecordBindingV01[] {
  const projection = committed.projection_entries[0]!;
  return [
    {
      record_kind: "episode_delta_proposal",
      record_id: scenario.proposal.proposal_id,
      fingerprint: scenario.proposal.integrity.fingerprint,
    },
    {
      record_kind: "review_decision",
      record_id: scenario.decision.decision_id,
      fingerprint: scenario.decision.integrity.fingerprint,
    },
    {
      record_kind: "semantic_commit_gate",
      record_id: authorization.gate_record.gate_record_id,
      fingerprint: authorization.gate_record.integrity.fingerprint,
    },
    {
      record_kind: "semantic_state",
      record_id: projection.state_ref.external_id,
      fingerprint: committed.state_records[0]!.integrity.fingerprint,
    },
    {
      record_kind: "state_transition_receipt",
      record_id: committed.transition_receipt.transition_receipt_id,
      fingerprint: committed.transition_receipt.integrity.fingerprint,
    },
    {
      record_kind: "task_context_packet",
      record_id: priorPacket.packet_id,
      fingerprint: priorPacket.integrity.fingerprint,
    },
    {
      record_kind: "task_context_packet",
      record_id: laterPacket.packet_id,
      fingerprint: laterPacket.integrity.fingerprint,
    },
    {
      record_kind: "run_receipt",
      record_id: probeReceipt.receipt_id,
      fingerprint: probeReceipt.integrity.fingerprint,
    },
  ];
}

function assertProjectScopedFullLoopRecords(
  database: Database.Database,
  workspaceId: string,
  projectId: string,
  foreignProjectId: string,
  bindings: FullLoopRecordBindingV01[],
  label: string,
): void {
  for (const binding of bindings) {
    const local = readVNextCoreRecordV01(database, {
      record_kind: binding.record_kind,
      record_id: binding.record_id,
      workspace_id: workspaceId,
      project_id: projectId,
    });
    assert(local, `${label} ${binding.record_kind} resolves in its project`);
    assert.equal(local.fingerprint, binding.fingerprint);
    assert.equal(
      readVNextCoreRecordV01(database, {
        record_kind: binding.record_kind,
        record_id: binding.record_id,
        workspace_id: workspaceId,
        project_id: foreignProjectId,
      }),
      null,
      `${label} ${binding.record_kind} does not leak across projects`,
    );
  }
}

function assertPriorLaterSelectionChange(
  priorPacket: TaskContextPacketV01,
  laterPacket: TaskContextPacketV01,
  projection: ReturnType<typeof commitVNextSemanticTransitionV01>["projection_entries"][number],
  probeReceipt: ReturnType<typeof runLocalContextUseProbeV01>["receipt"],
  label: string,
): void {
  const priorContainsState = priorPacket.selected_context.some(
    (entry) =>
      entry.entry_kind === "accepted_state_ref" &&
      entry.source_ref === projection.state_fingerprint &&
      canonicalizeProtocolValueV01(entry.external_ref) ===
        canonicalizeProtocolValueV01(projection.state_ref),
  );
  const laterContainsState = laterPacket.selected_context.some(
    (entry) =>
      entry.entry_kind === "accepted_state_ref" &&
      entry.source_ref === projection.state_fingerprint &&
      canonicalizeProtocolValueV01(entry.external_ref) ===
        canonicalizeProtocolValueV01(projection.state_ref),
  );
  assert.equal(priorContainsState, false, `${label} Packet A lacks new state`);
  assert.equal(laterContainsState, true, `${label} Packet B includes new state`);
  assert(
    probeReceipt.observations.some(
      (observation) =>
        observation.observation_kind === "local_context_selection_change",
    ),
    `${label} probe observes the exact persisted selection change`,
  );
}

function prepareCreateContextUseProbeChain(
  database: Database.Database,
  scenario: DurableLocalSemanticGateScenarioV01,
  priorPacket: TaskContextPacketV01,
) {
  const applied = applyCreateScenario(database, scenario);
  persistTaskContextPacketRecordV01(database, priorPacket);
  const compiled = compileTaskContextPacketFromPersistedSemanticStateV01(
    database,
    compilerInput(
      scenario,
      priorPacket,
      applied.committed.transition_receipt,
      DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
    ),
  );
  return { applied, compiled, prior_packet: priorPacket };
}

function persistTaskContextPacketRecordV01(
  database: Database.Database,
  packet: TaskContextPacketV01,
) {
  return insertVNextCoreRecordV01(database, {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
    idempotency_key: null,
    payload: packet,
    created_at: packet.generated_at,
  });
}

function localContextUseProbeInput(
  priorPacket: TaskContextPacketV01,
  laterPacket: TaskContextPacketV01,
  receipt: StateTransitionReceiptV01,
  observedAt: string,
) {
  return {
    workspace_id: laterPacket.workspace_id,
    project_id: laterPacket.project_id,
    prior_packet_id: priorPacket.packet_id,
    prior_packet_fingerprint: priorPacket.integrity.fingerprint,
    later_packet_id: laterPacket.packet_id,
    later_packet_fingerprint: laterPacket.integrity.fingerprint,
    expected_transition_receipt_id: receipt.transition_receipt_id,
    expected_transition_receipt_fingerprint: receipt.integrity.fingerprint,
    clock: fixedClock(observedAt),
  };
}

function assertProbeRefusalNoWrite(
  opened: WriterCoverageDatabaseV01,
  action: () => unknown,
  baseline: DatabaseSnapshot,
  error: RegExp,
  label: string,
) {
  assert.throws(action, error, label);
  assert.deepEqual(
    readDatabaseSnapshot(opened.database),
    baseline,
    `${label} persists no local context-use RunReceipt`,
  );
  assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
}

function rebuildRunReceiptV01(
  receipt: ReturnType<typeof runLocalContextUseProbeV01>["receipt"],
  mutate: (
    builderInput: Parameters<typeof buildRunReceiptV01>[0],
  ) => void,
) {
  const mutable = clone(receipt) as unknown as Record<string, unknown>;
  const authority = mutable.authority_summary as { notes: string[] };
  delete mutable.receipt_version;
  delete mutable.receipt_id;
  delete mutable.trust_summary;
  delete mutable.authority_summary;
  delete mutable.idempotency_key;
  delete mutable.integrity;
  mutable.authority_notes = clone(authority.notes);
  const builderInput = mutable as unknown as Parameters<
    typeof buildRunReceiptV01
  >[0];
  mutate(builderInput);
  return buildRunReceiptV01(builderInput);
}

function buildConflictingAppliedByReceipt(
  receipt: StateTransitionReceiptV01,
): StateTransitionReceiptV01 {
  const input = clone(receipt) as unknown as StateTransitionReceiptBuilderInputV01 &
    Record<string, unknown>;
  const authorityNotes = clone(receipt.authority_summary.notes);
  delete input.transition_receipt_version;
  delete input.transition_receipt_id;
  delete input.idempotency_key;
  delete input.transition_scope;
  delete input.receipt_status;
  delete input.atomicity;
  delete input.material_boundary;
  delete input.authority_summary;
  delete input.integrity;
  input.effects = input.effects.map((effect) => {
    const mutable = effect as typeof effect & { effect_id?: string };
    delete mutable.effect_id;
    return mutable;
  });
  const originalAppliedBy = clone(input.applied_by_ref);
  input.applied_by_ref = {
    ...input.applied_by_ref,
    external_id: `${input.applied_by_ref.external_id}:conflicting-result`,
  };
  input.source_refs = input.source_refs.map((ref) =>
    canonicalizeProtocolValueV01(ref) ===
    canonicalizeProtocolValueV01(originalAppliedBy)
      ? clone(input.applied_by_ref)
      : ref,
  );
  input.authority_notes = authorityNotes;
  const rebuilt = buildStateTransitionReceiptV01(input);
  assert.equal(validateStateTransitionReceiptV01(rebuilt).status, "valid");
  return rebuilt;
}

function compilerInput(
  scenario: DurableLocalSemanticGateScenarioV01,
  priorPacket: TaskContextPacketV01,
  receipt: StateTransitionReceiptV01,
  generatedAt: string,
) {
  return {
    workspace_id: scenario.proposal.workspace_id,
    project_id: scenario.proposal.project_id,
    prior_packet: priorPacket,
    transition_receipt_id: receipt.transition_receipt_id,
    transition_receipt_fingerprint: receipt.integrity.fingerprint,
    expiry_policy: { mode: "reuse_prior" as const },
    clock: fixedClock(generatedAt),
  };
}

function assertCompilerRefusalNoWrite(
  opened: WriterCoverageDatabaseV01,
  action: () => unknown,
  baseline: DatabaseSnapshot,
  error: RegExp,
  label: string,
) {
  assert.throws(action, error, label);
  assert.deepEqual(
    readDatabaseSnapshot(opened.database),
    baseline,
    `${label} creates no TaskContextPacket record`,
  );
  assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
}

function runProjectionCompilerRefusals(
  openDatabase: (label: string) => WriterCoverageDatabaseV01,
  scenario: DurableLocalSemanticGateScenarioV01,
) {
  for (const mode of [
    "drift",
    "revision_drift",
    "recorded_at_drift",
    "missing",
  ] as const) {
    const opened = openDatabase(`projection-${mode}`);
    const applied = applyCreateScenario(opened.database, scenario);
    const projection = applied.committed.projection_entries[0]!;
    if (mode === "drift") {
      opened.database
        .prepare(
          `UPDATE vnext_semantic_state_entries
           SET current_state_fingerprint = ?
           WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
        )
        .run(
          createProtocolSha256V01("compiler-projection-drift"),
          projection.workspace_id,
          projection.project_id,
          projection.target_key,
        );
    } else if (mode === "revision_drift") {
      opened.database
        .prepare(
          `UPDATE vnext_semantic_state_entries
           SET revision = revision + 1
           WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
        )
        .run(
          projection.workspace_id,
          projection.project_id,
          projection.target_key,
        );
    } else if (mode === "recorded_at_drift") {
      opened.database
        .prepare(
          `UPDATE vnext_semantic_state_entries
           SET updated_at = ?
           WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
        )
        .run(
          DURABLE_LOCAL_LOOP_APPLIED_AT,
          projection.workspace_id,
          projection.project_id,
          projection.target_key,
        );
    } else {
      opened.database
        .prepare(
          `DELETE FROM vnext_semantic_state_entries
           WHERE workspace_id = ? AND project_id = ? AND target_key = ?`,
        )
        .run(
          projection.workspace_id,
          projection.project_id,
          projection.target_key,
        );
    }
    const baseline = readDatabaseSnapshot(opened.database);
    assertCompilerRefusalNoWrite(
      opened,
      () =>
        compileTaskContextPacketFromPersistedSemanticStateV01(
          opened.database,
          compilerInput(
            scenario,
            buildDurableLocalSemanticGateScenariosV01().prefix.prior_packet,
            applied.committed.transition_receipt,
            DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT,
          ),
        ),
      baseline,
      mode !== "missing"
        ? /applied_semantic_state_projection_drift/
        : /applied_semantic_state_projection_missing/,
      `semantic-state projection ${mode}`,
    );
  }
}

function runPriorReceiptEnvelopeRefusals(
  openDatabase: (label: string) => WriterCoverageDatabaseV01,
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
) {
  for (const operation of ["supersede", "retract"] as const) {
    const opened = openDatabase(`lineage-envelope-${operation}`);
    const scenario = scenarios[operation];
    const seedScenario: DurableLocalSemanticGateScenarioV01 =
      operation === "supersede"
        ? {
            scenario_id: "create",
            proposal: scenario.proposal,
            decision: scenarios.supersede_prior_accept_decision,
            expected_operations: ["create"],
            expected_target_count: 1,
          }
        : scenarios.create;
    const seed = applyCreateScenario(opened.database, seedScenario);
    opened.database.exec(
      "DROP TRIGGER trg_vnext_core_records_immutable_update",
    );
    opened.database
      .prepare(
        `UPDATE vnext_core_records
         SET idempotency_key = ?
         WHERE record_kind = 'state_transition_receipt' AND record_id = ?`,
      )
      .run(
        createProtocolSha256V01(`wrong-envelope-idempotency:${operation}`),
        seed.committed.transition_receipt.transition_receipt_id,
      );
    ensureVNextDurableSemanticStoreSchemaV01(opened.database);
    persistVNextSemanticReviewMaterialV01(opened.database, {
      proposal: scenario.proposal,
      decision: scenario.decision,
    });
    const baseline = readDatabaseSnapshot(opened.database);
    const times = semanticGateScenarioTimes(scenario);
    assert.throws(
      () =>
        prepareVNextSemanticCommitPreviewV01(opened.database, {
          workspace_id: scenario.proposal.workspace_id,
          project_id: scenario.proposal.project_id,
          proposal_id: scenario.proposal.proposal_id,
          proposal_fingerprint: scenario.proposal.integrity.fingerprint,
          decision_id: scenario.decision.decision_id,
          decision_fingerprint: scenario.decision.integrity.fingerprint,
          ...previewRuntimeFields(scenario, times),
        }),
      /semantic_commit_prior_receipt_identity_mismatch|semantic_target_head_receipt_mismatch/,
      `${operation} lineage rejects a valid receipt payload under a wrong envelope idempotency key`,
    );
    assert.deepEqual(
      readDatabaseSnapshot(opened.database),
      baseline,
      `${operation} wrong lineage envelope writes no preview, gate, state, packet, or receipt`,
    );
    assertLegacySnapshotUnchanged(baseline, opened.legacyBaseline);
  }
}

function acceptedStateFixtureEntry(
  compatibilityNamespace: string,
  label: string,
): TaskContextPacketV01["selected_context"][number] {
  const fingerprint = createProtocolSha256V01(
    `accepted-state-fixture:${compatibilityNamespace}:${label}`,
  );
  const stateRef: ExternalRefV01 = {
    ref_version: "external_ref.v0.1",
    ref_type: "accepted_semantic_state",
    external_id: `semantic-state:${label}`,
    trust_class: "direct_local_observation",
    observed_at: "2026-07-10T00:00:00.000Z",
    source_ref: fingerprint,
    compatibility_namespace: compatibilityNamespace,
  };
  return {
    entry_id: `accepted-state-fixture:${label}`,
    entry_kind: "accepted_state_ref",
    source_ref: fingerprint,
    external_ref: stateRef,
    why_included: "Compatibility accepted-state fixture for compiler isolation coverage.",
    currentness: {
      status: "fresh",
      as_of: "2026-07-10T00:00:00.000Z",
      basis: "Bounded fixture state currentness.",
      source_ref: stateRef,
    },
    trust_class: stateRef.trust_class,
    compatibility_source_ref: stateRef,
    bounded_summary: "Compatibility accepted-state fixture.",
  };
}

function rebuildPacketV01(
  packet: TaskContextPacketV01,
  overrides: {
    selected_context?: TaskContextPacketV01["selected_context"];
    excluded_context?: TaskContextPacketV01["excluded_context"];
    compatibility?: TaskContextPacketV01["compatibility"];
  },
  budgetOverrides: Partial<
    TaskContextPacketV01["constraints"]["context_budget"]
  > = {},
): TaskContextPacketV01 {
  return buildTaskContextPacketV01({
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: packet.work_ref,
    generated_at: packet.generated_at,
    expires_at: packet.expires_at,
    task: packet.task,
    current_projection: packet.current_projection,
    selected_context: overrides.selected_context ?? packet.selected_context,
    excluded_context: overrides.excluded_context ?? packet.excluded_context,
    tensions: packet.tensions,
    risks: packet.risks,
    gaps: packet.gaps,
    constraints: {
      ...packet.constraints,
      context_budget: {
        ...packet.constraints.context_budget,
        ...budgetOverrides,
      },
    },
    capability_grant: packet.capability_grant,
    return_contract: packet.return_contract,
    source_status: packet.source_status,
    compatibility: overrides.compatibility ?? packet.compatibility,
    authority_notes: packet.authority_summary.notes,
  });
}

function applyCreateScenario(
  database: Database.Database,
  scenario: DurableLocalSemanticGateScenarioV01,
) {
  const prepared = prepareAndAuthorizeGateScenario(database, scenario, false);
  const committed = commitVNextSemanticTransitionV01(database, {
    workspace_id: scenario.proposal.workspace_id,
    project_id: scenario.proposal.project_id,
    proposal_id: scenario.proposal.proposal_id,
    proposal_fingerprint: scenario.proposal.integrity.fingerprint,
    decision_id: scenario.decision.decision_id,
    decision_fingerprint: scenario.decision.integrity.fingerprint,
    gate_record_id: prepared.authorization.gate_record.gate_record_id,
    gate_record_fingerprint:
      prepared.authorization.gate_record.integrity.fingerprint,
    clock: fixedClock(
      DURABLE_LOCAL_LOOP_APPLIED_AT,
      DURABLE_LOCAL_LOOP_RECORDED_AT,
    ),
  });
  assert.equal(committed.status, "applied", `${scenario.scenario_id} seed applies`);
  return { ...prepared, committed };
}

function prepareAndAuthorizeGateScenario(
  database: Database.Database,
  scenario: DurableLocalSemanticGateScenarioV01,
  runRefusalCases: boolean,
): {
  preview: VNextSemanticCommitPreviewV01;
  authorization: VNextSemanticCommitAuthorizationResultV01;
} {
  const persisted = persistVNextSemanticReviewMaterialV01(database, {
    proposal: scenario.proposal,
    decision: scenario.decision,
  });
  assert(
    ["inserted", "exact_replay"].includes(persisted.proposal_record.status),
  );
  assert(
    ["inserted", "exact_replay"].includes(persisted.decision_record.status),
  );
  const beforePreview = readNamedTablesSnapshot(database, [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ]);
  const times = semanticGateScenarioTimes(scenario);
  const preview = prepareVNextSemanticCommitPreviewV01(database, {
    workspace_id: scenario.proposal.workspace_id,
    project_id: scenario.proposal.project_id,
    proposal_id: scenario.proposal.proposal_id,
    proposal_fingerprint: scenario.proposal.integrity.fingerprint,
    decision_id: scenario.decision.decision_id,
    decision_fingerprint: scenario.decision.integrity.fingerprint,
    ...previewRuntimeFields(scenario, times),
  });
  assert.deepEqual(
    readNamedTablesSnapshot(database, [
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
    ]),
    beforePreview,
    `${scenario.scenario_id} preview writes zero rows`,
  );
  assertPreviewMatchesScenario(scenario, preview);
  if (runRefusalCases) {
    assertAuthorizationRefusals(database, scenario, preview, beforePreview);
  }

  const beforeAuthorization = readNamedTablesSnapshot(database, [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ]);
  const authorization = recordVNextSemanticCommitAuthorizationV01(
    database,
    authorizationInput(scenario, preview),
  );
  assert.equal(authorization.status, "inserted");
  assert.equal(authorization.eligibility.status, "eligible");
  const afterAuthorization = readNamedTablesSnapshot(database, [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ]);
  assert.equal(
    afterAuthorization.counts.vnext_core_records,
    beforeAuthorization.counts.vnext_core_records + 1,
    `${scenario.scenario_id} confirmation persists one gate record only`,
  );
  assert.equal(
    afterAuthorization.table_hashes.vnext_semantic_state_entries,
    beforeAuthorization.table_hashes.vnext_semantic_state_entries,
    `${scenario.scenario_id} confirmation does not mutate current state`,
  );
  assert.equal(
    afterAuthorization.table_hashes.vnext_semantic_target_heads,
    beforeAuthorization.table_hashes.vnext_semantic_target_heads,
    `${scenario.scenario_id} confirmation does not advance target heads`,
  );
  assert.equal(
    scenario.decision.actor_ref.trust_class,
    "user_declaration",
    "synthetic operator binding remains a declaration, not authentication",
  );
  return { preview, authorization };
}

function assertPreviewMatchesScenario(
  scenario: DurableLocalSemanticGateScenarioV01,
  preview: VNextSemanticCommitPreviewV01,
) {
  assert.equal(preview.intended_effects.length, scenario.expected_target_count);
  assert.deepEqual(
    preview.intended_effects.map((effect) => effect.operation).sort(),
    [...scenario.expected_operations].sort(),
    `${scenario.scenario_id} derives exact operations`,
  );
  assert.deepEqual(
    canonicalRefSet(preview.intended_effects.map((effect) => effect.target_ref)),
    canonicalRefSet(
      scenario.decision.requested_transition_intent?.target_refs ?? [],
    ),
    `${scenario.scenario_id} preserves the exact target set`,
  );
  const stateMaterialCandidate =
    scenario.decision.decision === "supersede"
      ? scenario.proposal.proposed_deltas.find(
          (candidate) =>
            candidate.candidate_id ===
            scenario.decision.lineage.superseding_candidate?.candidate_id,
        )
      : scenario.decision.decision === "retract"
        ? null
        : scenario.proposal.proposed_deltas.find(
            (candidate) =>
              candidate.candidate_id === scenario.decision.candidate.candidate_id,
          );
  for (const effect of preview.intended_effects) {
    assert.equal(
      Number.isSafeInteger(effect.expected_revision) &&
        effect.expected_revision >= 1,
      true,
      `${scenario.scenario_id} derives a bounded monotonic expected revision`,
    );
    if (!stateMaterialCandidate) {
      assert.equal(effect.expected_after_state_fingerprint, null);
      continue;
    }
    const expectedState = buildVNextPersistedSemanticStateV01({
      proposal: scenario.proposal,
      candidate_id: stateMaterialCandidate.candidate_id,
      target_ref: effect.target_ref,
      source_decision: {
        decision_id: scenario.decision.decision_id,
        decision_fingerprint: scenario.decision.integrity.fingerprint,
      },
      created_at: semanticGateScenarioTimes(scenario).previewed_at,
    });
    assert.equal(
      effect.expected_after_state_fingerprint,
      expectedState.state_content_fingerprint,
      `${scenario.scenario_id} authorizes exact candidate-derived state content`,
    );
  }
}

function assertAuthorizationRefusals(
  database: Database.Database,
  scenario: DurableLocalSemanticGateScenarioV01,
  preview: VNextSemanticCommitPreviewV01,
  baseline: ReturnType<typeof readNamedTablesSnapshot>,
) {
  const alternateApplierPreview = prepareVNextSemanticCommitPreviewV01(
    database,
    {
      workspace_id: scenario.proposal.workspace_id,
      project_id: scenario.proposal.project_id,
      proposal_id: scenario.proposal.proposal_id,
      proposal_fingerprint: scenario.proposal.integrity.fingerprint,
      decision_id: scenario.decision.decision_id,
      decision_fingerprint: scenario.decision.integrity.fingerprint,
      authorized_applier_identity: {
        ...preview.authorized_applier_identity,
        external_id: `${preview.authorized_applier_identity.external_id}:alternate`,
      },
      gate_ttl_ms: preview.gate_ttl_ms,
      clock: fixedClock(
        preview.current_state_observations[0]!.observed_at,
        preview.previewed_at,
      ),
    },
  );
  assert.notEqual(
    alternateApplierPreview.confirmation_digest,
    preview.confirmation_digest,
    "authorized applier identity is bound into the confirmation digest",
  );
  const alternateTtlPreview = prepareVNextSemanticCommitPreviewV01(database, {
    workspace_id: scenario.proposal.workspace_id,
    project_id: scenario.proposal.project_id,
    proposal_id: scenario.proposal.proposal_id,
    proposal_fingerprint: scenario.proposal.integrity.fingerprint,
    decision_id: scenario.decision.decision_id,
    decision_fingerprint: scenario.decision.integrity.fingerprint,
    authorized_applier_identity: preview.authorized_applier_identity,
    gate_ttl_ms: preview.gate_ttl_ms - 1,
    clock: fixedClock(
      preview.current_state_observations[0]!.observed_at,
      preview.previewed_at,
    ),
  });
  assert.notEqual(
    alternateTtlPreview.confirmation_digest,
    preview.confirmation_digest,
    "bounded gate TTL is bound into the confirmation digest",
  );
  assert.deepEqual(
    readNamedTablesSnapshot(database, [
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
    ]),
    baseline,
    "confirmation authority digest variants remain read-only previews",
  );

  const mismatchedActor = clone(scenario.decision.actor_ref);
  mismatchedActor.external_id = `${mismatchedActor.external_id}:mismatch`;
  assertGateRefusalNoWrite(
    database,
    () =>
      recordVNextSemanticCommitAuthorizationV01(database, {
        ...authorizationInput(scenario, preview),
        operator_actor_ref: mismatchedActor,
      }),
    baseline,
    /operator_actor_mismatch/,
    "operator actor mismatch",
  );

  const mismatchedDigest = createProtocolSha256V01(
    `${preview.confirmation_digest}|mismatch`,
  );
  assertGateRefusalNoWrite(
    database,
    () =>
      recordVNextSemanticCommitAuthorizationV01(database, {
        ...authorizationInput(scenario, preview),
        confirmation_digest: mismatchedDigest,
      }),
    baseline,
    /semantic_commit_confirmation_digest_mismatch/,
    "confirmation digest mismatch",
  );

  const previewValue = Date.parse(preview.previewed_at);
  assertGateRefusalNoWrite(
    database,
    () =>
      prepareVNextSemanticCommitPreviewV01(
        database,
        {
          workspace_id: scenario.proposal.workspace_id,
          project_id: scenario.proposal.project_id,
          proposal_id: scenario.proposal.proposal_id,
          proposal_fingerprint: scenario.proposal.integrity.fingerprint,
          decision_id: scenario.decision.decision_id,
          decision_fingerprint: scenario.decision.integrity.fingerprint,
          ...previewRuntimeFields(
            scenario,
            semanticGateScenarioTimes(scenario),
          ),
          previewed_at: "2099-01-01T00:00:00.000Z",
        } as unknown as Parameters<
          typeof prepareVNextSemanticCommitPreviewV01
        >[1],
      ),
    baseline,
    /local_runtime_timestamp_input_forbidden/,
    "caller-provided future preview timestamp",
  );

  const earlyConfirmation = new Date(previewValue - 1_000).toISOString();
  assertGateRefusalNoWrite(
    database,
    () =>
      recordVNextSemanticCommitAuthorizationV01(database, {
        ...authorizationInput(scenario, preview),
        clock: fixedClock(
          earlyConfirmation,
          new Date(previewValue + 1_000).toISOString(),
          new Date(previewValue + 2_000).toISOString(),
        ),
      }),
    baseline,
    /semantic_commit_confirmation_precedes_preview/,
    "confirmation chronology mismatch",
  );

  assertGateRefusalNoWrite(
    database,
    () =>
      recordVNextSemanticCommitAuthorizationV01(database, {
        ...authorizationInput(scenario, preview),
        clock: fixedClock(
          new Date(previewValue + 16 * 60 * 1000).toISOString(),
          new Date(previewValue + 16 * 60 * 1000 + 1_000).toISOString(),
          new Date(previewValue + 16 * 60 * 1000 + 2_000).toISOString(),
        ),
      }),
    baseline,
    /semantic_commit_preview_confirmation_window_expired/,
    "preview-to-confirmation policy window exceeded",
  );

  assertGateRefusalNoWrite(
    database,
    () =>
      prepareVNextSemanticCommitPreviewV01(database, {
        workspace_id: scenario.proposal.workspace_id,
        project_id: scenario.proposal.project_id,
        proposal_id: scenario.proposal.proposal_id,
        proposal_fingerprint: scenario.proposal.integrity.fingerprint,
        decision_id: scenario.decision.decision_id,
        decision_fingerprint: scenario.decision.integrity.fingerprint,
        authorized_applier_identity: preview.authorized_applier_identity,
        gate_ttl_ms: 60 * 60 * 1000 + 1,
        clock: fixedClock(
          preview.current_state_observations[0]!.observed_at,
          preview.previewed_at,
        ),
      }),
    baseline,
    /semantic_commit_gate_ttl_invalid/,
    "maximum gate TTL exceeded",
  );

  assertGateRefusalNoWrite(
    database,
    () =>
      prepareVNextSemanticCommitPreviewV01(database, {
        workspace_id: durableLocalClosedLoopProjectBFixture.workspace_id,
        project_id: durableLocalClosedLoopProjectBFixture.project_id,
        proposal_id: scenario.proposal.proposal_id,
        proposal_fingerprint: scenario.proposal.integrity.fingerprint,
        decision_id: scenario.decision.decision_id,
        decision_fingerprint: scenario.decision.integrity.fingerprint,
        ...previewRuntimeFields(
          scenario,
          semanticGateScenarioTimes(scenario),
        ),
      }),
    baseline,
    /persisted_proposal_missing|persisted_decision_missing/,
    "cross-project binding",
  );
}

function prepareAndAuthorizeGateScenarioAt(
  database: Database.Database,
  scenario: DurableLocalSemanticGateScenarioV01,
  times: SemanticGateScenarioTimesV01,
) {
  persistVNextSemanticReviewMaterialV01(database, {
    proposal: scenario.proposal,
    decision: scenario.decision,
  });
  const preview = prepareVNextSemanticCommitPreviewV01(database, {
    workspace_id: scenario.proposal.workspace_id,
    project_id: scenario.proposal.project_id,
    proposal_id: scenario.proposal.proposal_id,
    proposal_fingerprint: scenario.proposal.integrity.fingerprint,
    decision_id: scenario.decision.decision_id,
    decision_fingerprint: scenario.decision.integrity.fingerprint,
    ...previewRuntimeFields(scenario, times),
  });
  const authorization = recordVNextSemanticCommitAuthorizationV01(
    database,
    authorizationInput(scenario, preview, times),
  );
  assert.equal(authorization.eligibility.status, "eligible");
  return { preview, authorization };
}

function explicitGateTimes(
  currentStateObservedAt: string,
  previewedAt: string,
  confirmedAt: string,
  gateEvaluatedAt: string,
  eligibilityEvaluatedAt: string,
): SemanticGateScenarioTimesV01 {
  return {
    current_state_observed_at: currentStateObservedAt,
    previewed_at: previewedAt,
    confirmed_at: confirmedAt,
    gate_evaluated_at: gateEvaluatedAt,
    eligibility_evaluated_at: eligibilityEvaluatedAt,
    gate_expires_at: DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  };
}

function buildSingleTargetAcceptScenario(
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
  targetRef: ExternalRefV01,
  suffix: string,
  decidedAt: string,
): DurableLocalSemanticGateScenarioV01 {
  const proposal = clone(scenarios.multi_target.proposal);
  const candidate = proposal.proposed_deltas.find(
    (item) =>
      item.candidate_id === scenarios.multi_target.decision.candidate.candidate_id,
  );
  assert(candidate, "single-target ABA fixture candidate exists");
  candidate.target_refs = [clone(targetRef)];
  candidate.title = `Review isolated ${suffix} semantic target`;
  candidate.proposed_state_summary =
    `Persist isolated candidate-derived state for ${suffix} under an explicit synthetic gate.`;
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(proposal);
  assert.equal(validateEpisodeDeltaProposalV01(proposal).status, "valid");
  const decisionInput = createSemanticTransitionDecisionInputV01(
    scenarios.prefix.project,
    proposal,
  );
  decisionInput.decided_at = decidedAt;
  decisionInput.requested_transition_intent!.intent_id =
    `transition-intent:${scenarios.prefix.project.fixture_id}:${suffix}`;
  const decision = buildReviewDecisionV01(decisionInput);
  assert.equal(validateReviewDecisionV01(decision).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal)
      .status,
    "valid",
  );
  return {
    scenario_id: "create",
    proposal,
    decision,
    expected_operations: ["create"],
    expected_target_count: 1,
  };
}

function buildRetractScenarioForPriorAccept(
  scenarios: ReturnType<typeof buildDurableLocalSemanticGateScenariosV01>,
  prior: DurableLocalSemanticGateScenarioV01,
  suffix: string,
  decidedAt: string,
): DurableLocalSemanticGateScenarioV01 {
  const input = createSemanticTransitionDecisionInputV01(
    scenarios.prefix.project,
    prior.proposal,
  );
  const binding = {
    decision_id: prior.decision.decision_id,
    decision_fingerprint: prior.decision.integrity.fingerprint,
  };
  input.decision = "retract";
  input.decided_at = decidedAt;
  input.rationale_summary =
    `Synthetic ${suffix} fixture retracts only the exact prior applied acceptance lineage.`;
  input.lineage = {
    prior_decisions: [binding],
    superseding_candidate: null,
    retracted_decision: binding,
  };
  input.requested_transition_intent = {
    intent_id: `transition-intent:${scenarios.prefix.project.fixture_id}:${suffix}`,
    transition_kind: "semantic_candidate_retract",
    bounded_summary:
      `Request exact ${suffix} retraction behind a separately persisted local gate.`,
    target_refs: clone(
      prior.decision.requested_transition_intent?.target_refs ?? [],
    ),
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  const decision = buildReviewDecisionV01(input);
  assert.equal(validateReviewDecisionV01(decision).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      decision,
      prior.proposal,
    ).status,
    "valid",
  );
  return {
    scenario_id: "retract",
    proposal: prior.proposal,
    decision,
    expected_operations: ["retract"],
    expected_target_count: 1,
  };
}

function authorizationInput(
  scenario: DurableLocalSemanticGateScenarioV01,
  preview: VNextSemanticCommitPreviewV01,
  timeOverride?: SemanticGateScenarioTimesV01,
) {
  const times = timeOverride ?? semanticGateScenarioTimes(scenario);
  return {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: scenario.decision.actor_ref,
    clock: fixedClock(
      times.confirmed_at,
      times.gate_evaluated_at,
      times.eligibility_evaluated_at,
    ),
  };
}

function previewRuntimeFields(
  scenario: DurableLocalSemanticGateScenarioV01,
  times: SemanticGateScenarioTimesV01,
) {
  return {
    authorized_applier_identity: {
      ref_type: "semantic_transition_applier",
      external_id:
        `local-core-applier:${scenario.scenario_id}:${scenario.proposal.project_id}`,
    },
    gate_ttl_ms: millisecondsBetween(
      times.gate_evaluated_at,
      times.gate_expires_at,
    ),
    clock: fixedClock(
      times.current_state_observed_at,
      times.previewed_at,
    ),
  };
}

function fixedClock(...timestamps: string[]) {
  assert(timestamps.length > 0, "fixed runtime clock requires a timestamp");
  let index = 0;
  return {
    now() {
      const value = timestamps[Math.min(index, timestamps.length - 1)]!;
      if (index < timestamps.length - 1) index += 1;
      return value;
    },
  };
}

function millisecondsBetween(left: string, right: string): number {
  const leftValue = Date.parse(left);
  const rightValue = Date.parse(right);
  assert(Number.isFinite(leftValue) && Number.isFinite(rightValue));
  return rightValue - leftValue;
}

interface SemanticGateScenarioTimesV01 {
  current_state_observed_at: string;
  previewed_at: string;
  confirmed_at: string;
  gate_evaluated_at: string;
  eligibility_evaluated_at: string;
  gate_expires_at: string;
}

function semanticGateScenarioTimes(
  scenario: DurableLocalSemanticGateScenarioV01,
): SemanticGateScenarioTimesV01 {
  if (scenario.scenario_id === "create") {
    return {
      current_state_observed_at: DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT,
      previewed_at: DURABLE_LOCAL_LOOP_PREVIEWED_AT,
      confirmed_at: DURABLE_LOCAL_LOOP_CONFIRMED_AT,
      gate_evaluated_at: DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT,
      eligibility_evaluated_at:
        DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT,
      gate_expires_at: DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
    };
  }
  return {
    current_state_observed_at:
      DURABLE_LOCAL_LOOP_FOLLOWUP_CURRENT_STATE_OBSERVED_AT,
    previewed_at: DURABLE_LOCAL_LOOP_FOLLOWUP_PREVIEWED_AT,
    confirmed_at: DURABLE_LOCAL_LOOP_FOLLOWUP_CONFIRMED_AT,
    gate_evaluated_at: DURABLE_LOCAL_LOOP_FOLLOWUP_GATE_EVALUATED_AT,
    eligibility_evaluated_at:
      DURABLE_LOCAL_LOOP_FOLLOWUP_ELIGIBILITY_EVALUATED_AT,
    gate_expires_at: DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT,
  };
}

function assertGateRefusalNoWrite(
  database: Database.Database,
  action: () => unknown,
  baseline: ReturnType<typeof readNamedTablesSnapshot>,
  expectedError: RegExp,
  label: string,
) {
  assert.throws(action, expectedError, label);
  assert.deepEqual(
    readNamedTablesSnapshot(database, [
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
    ]),
    baseline,
    `${label} writes nothing`,
  );
}

function createSelfConsistentForgedGate(
  source: VNextSemanticCommitGateRecordV01,
): VNextSemanticCommitGateRecordV01 {
  const gate = clone(source);
  const forgedActor = clone(gate.operator_actor_ref);
  forgedActor.external_id = `${forgedActor.external_id}:forged`;
  gate.operator_actor_ref = forgedActor;
  gate.semantic_commit_gate_evaluation.decision_actor_ref = clone(forgedActor);
  gate.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...gate,
      integrity: { ...gate.integrity, fingerprint: undefined },
    }),
  );
  return gate;
}

function canonicalRefSet(refs: ExternalRefV01[]): string[] {
  return refs.map((ref) => canonicalizeProtocolValueV01(ref)).sort();
}

function runMigrationCoverage(parentDirectory: string) {
  const suffix = `${process.pid}`;
  const uninitializedPath = resolve(
    parentDirectory,
    `m3c-migration-uninitialized-${suffix}.db`,
  );
  const freshPath = resolve(parentDirectory, `m3c-migration-fresh-${suffix}.db`);
  const legacyPath = resolve(parentDirectory, `m3c-migration-legacy-${suffix}.db`);
  const backupPath = resolve(parentDirectory, `m3c-migration-backup-${suffix}.db`);
  const restoredPath = resolve(parentDirectory, `m3c-migration-restored-${suffix}.db`);
  const ownedPaths = [
    uninitializedPath,
    freshPath,
    legacyPath,
    backupPath,
    restoredPath,
  ].flatMap((path) => [path, `${path}-wal`, `${path}-shm`]);
  for (const path of ownedPaths) {
    assert.equal(existsSync(path), false, `migration rehearsal owns fresh path ${path}`);
  }

  let fresh: Database.Database | null = null;
  let uninitialized: Database.Database | null = null;
  let legacy: Database.Database | null = null;
  let restored: Database.Database | null = null;
  try {
    uninitialized = new Database(uninitializedPath);
    uninitialized.pragma("foreign_keys = ON");
    assert.throws(
      () =>
        prepareVNextSemanticCommitPreviewV01(uninitialized!, {
          workspace_id: "workspace:uninitialized",
          project_id: "project:uninitialized",
          proposal_id: "episode-delta-proposal:uninitialized",
          proposal_fingerprint: createProtocolSha256V01(
            "uninitialized-proposal",
          ),
          decision_id: "review-decision:uninitialized",
          decision_fingerprint: createProtocolSha256V01(
            "uninitialized-decision",
          ),
          authorized_applier_identity: {
            ref_type: "semantic_transition_applier",
            external_id: "local-core-applier:uninitialized",
          },
          gate_ttl_ms: 60_000,
          clock: fixedClock("2026-07-10T00:00:00.000Z"),
        }),
      /vnext_durable_semantic_store_schema_uninitialized/,
      "durable runtime fails clearly until explicit schema initialization",
    );
    assert.equal(
      (
        uninitialized
          .prepare("SELECT COUNT(*) AS count FROM sqlite_master")
          .get() as { count: number }
      ).count,
      0,
      "runtime schema readiness check performs no implicit migration",
    );

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
      "vnext_semantic_target_heads",
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
        "vnext_semantic_target_heads",
      ]),
      upgradedLegacySnapshot,
      "backup/restore preserves exact legacy and vNext rows and logical hashes",
    );
    assert.equal(restored.pragma("integrity_check", { simple: true }), "ok");

    assertVNextSemanticStoreSchemaDriftFree();
    return {
      status: "pass",
      positive_cases: 8,
      negative_cases: 7,
      fresh_creation: true,
      legacy_only_additive_upgrade: true,
      repeated_migration: true,
      legacy_rows_and_hashes_unchanged: true,
      new_tables_initially_empty: true,
      malformed_json_constraints_blocked: 2,
      invalid_presence_constraints_blocked: 1,
      target_head_constraints_blocked: 3,
      project_isolation: true,
      backup_restore: true,
      runtime_migration_canonical_schema_drift_free: true,
      runtime_requires_explicit_schema_initialization: true,
      restored_legacy_rows_unchanged: true,
      integrity_check: "ok",
      restored_logical_checksum: upgradedLegacySnapshot.logical_checksum,
    };
  } finally {
    if (uninitialized?.open) uninitialized.close();
    if (fresh?.open) fresh.close();
    if (legacy?.open) legacy.close();
    if (restored?.open) restored.close();
    for (const path of ownedPaths) rmSync(path, { force: true });
    for (const path of ownedPaths) {
      assert.equal(existsSync(path), false, `migration rehearsal removes ${path}`);
    }
  }
}

function assertVNextSemanticStoreSchemaDriftFree(): void {
  const canonicalSchemaSql = readFileSync(
    resolve(repoRoot, "lib/db/schema.sql"),
    "utf8",
  );
  const signatures: Record<string, unknown> = {};
  for (const [source, initialize] of [
    [
      "runtime",
      (database: Database.Database) =>
        ensureVNextDurableSemanticStoreSchemaV01(database),
    ],
    [
      "migration",
      (database: Database.Database) =>
        database.exec(vNextDurableSemanticStoreSchemaSqlV01),
    ],
    [
      "canonical",
      (database: Database.Database) => database.exec(canonicalSchemaSql),
    ],
  ] as const) {
    const database = new Database(":memory:");
    try {
      database.pragma("foreign_keys = ON");
      initialize(database);
      signatures[source] = vNextSchemaSignature(database);
    } finally {
      database.close();
    }
  }
  assert.deepEqual(
    signatures.runtime,
    signatures.migration,
    "runtime and additive migration vNext schema definitions must not drift",
  );
  assert.deepEqual(
    signatures.runtime,
    signatures.canonical,
    "runtime and canonical schema.sql vNext definitions must not drift",
  );
}

function vNextSchemaSignature(database: Database.Database) {
  const artifactNames = [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
    "idx_vnext_core_records_project_idempotency",
    "idx_vnext_core_records_project_kind_created",
    "idx_vnext_semantic_state_entries_project_updated",
    "idx_vnext_semantic_target_heads_project_updated",
    "trg_vnext_core_records_immutable_update",
    "trg_vnext_core_records_immutable_delete",
  ];
  const placeholders = artifactNames.map(() => "?").join(", ");
  return database
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name IN (${placeholders})
       ORDER BY type, name`,
    )
    .all(...artifactNames)
    .map((row) => {
      const typed = row as {
        type: string;
        name: string;
        tbl_name: string;
        sql: string | null;
      };
      return {
        type: typed.type,
        name: typed.name,
        table_name: typed.tbl_name,
        sql: typed.sql
          ?.replace(/\bIF\s+NOT\s+EXISTS\b/gi, "")
          .replace(/\s+/g, " ")
          .trim(),
      };
    });
}

function assertVNextTablesExistAndEmpty(
  database: Database.Database,
  label: string,
) {
  for (const table of [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ]) {
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
  const insertHead = database.prepare(
    `INSERT INTO vnext_semantic_target_heads (
      workspace_id, project_id, target_key, revision, presence,
      current_state_fingerprint, source_transition_receipt_id,
      source_transition_receipt_fingerprint, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  assert.throws(
    () =>
      insertHead.run(
        "workspace:migration",
        "project:migration",
        createProtocolSha256V01("invalid-absent-head"),
        1,
        "absent",
        fingerprint,
        "receipt:invalid-absent-head",
        fingerprint,
        DURABLE_LOCAL_LOOP_RECORDED_AT,
      ),
    /CHECK constraint failed/,
    "absent target head rejects a present-state fingerprint",
  );
  assert.throws(
    () =>
      insertHead.run(
        "workspace:migration",
        "project:migration",
        createProtocolSha256V01("invalid-present-head"),
        1,
        "present",
        null,
        "receipt:invalid-present-head",
        fingerprint,
        DURABLE_LOCAL_LOOP_RECORDED_AT,
      ),
    /CHECK constraint failed/,
    "present target head requires a state fingerprint",
  );
  assert.throws(
    () =>
      insertHead.run(
        "workspace:migration",
        "project:migration",
        createProtocolSha256V01("invalid-generation-head"),
        0,
        "absent",
        null,
        "receipt:invalid-generation-head",
        fingerprint,
        DURABLE_LOCAL_LOOP_RECORDED_AT,
      ),
    /CHECK constraint failed/,
    "persisted target heads begin at revision one",
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
    insertVNextSemanticTargetHeadV01(database, {
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: targetKey,
      revision: 1,
      presence: "present",
      current_state_fingerprint: stateFingerprint,
      source_transition_receipt_id: `receipt:${projectId}`,
      source_transition_receipt_fingerprint: createProtocolSha256V01(
        `receipt|${projectId}`,
      ),
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
  assert.equal(
    readVNextSemanticTargetHeadV01(database, {
      workspace_id: workspaceId,
      project_id: projectIds[0],
      target_key: targetKey,
    })?.revision,
    1,
  );
  assert.equal(
    readVNextSemanticTargetHeadV01(database, {
      workspace_id: workspaceId,
      project_id: "project:migration-foreign",
      target_key: targetKey,
    }),
    null,
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
  workspaceId: string,
  projectId: string,
): { fingerprint: string; payload_json: string } {
  const row = database
    .prepare(
      `SELECT fingerprint, payload_json FROM vnext_core_records
       WHERE record_kind = ? AND record_id = ? AND workspace_id = ? AND project_id = ?`,
    )
    .get(recordKind, recordId, workspaceId, projectId) as
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
