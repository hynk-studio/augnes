import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLY_DECISION_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveApplyOperatorDecisionPreview,
} from "@/types/current-working-perspective-apply-decision";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLY_PREVIEW_VERSION,
} from "@/types/current-working-perspective-apply-preview";
import type {
  CurrentWorkingPerspectivePatchOperation,
  CurrentWorkingPerspectivePatchTarget,
} from "@/types/current-working-perspective-update-contract-preview";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_RECEIPT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
  CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION,
  type CurrentWorkingPerspectiveAppliedSnapshot,
  type CurrentWorkingPerspectiveApplyAuthorityProfile,
  type CurrentWorkingPerspectiveApplyMutationBoundary,
  type CurrentWorkingPerspectiveApplyNoSideEffects,
  type CurrentWorkingPerspectiveApplyRecord,
  type CurrentWorkingPerspectiveApplyReceipt,
  type CurrentWorkingPerspectiveApplyStoreResult,
  type CurrentWorkingPerspectiveApplyWriteAuthorityBoundary,
  type CurrentWorkingPerspectiveApplyWriteInput,
  type CurrentWorkingPerspectiveApplyWriteValidation,
  type CurrentWorkingPerspectiveApplyWriteStatus,
} from "@/types/current-working-perspective-apply-write";

export const CURRENT_WORKING_PERSPECTIVE_APPLY_WRITE_TABLE =
  "current_working_perspective_apply_records" as const;

export interface CurrentWorkingPerspectiveApplyWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface CurrentWorkingPerspectiveApplyWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface CurrentWorkingPerspectiveApplyWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  record_fingerprint: string;
  applied_snapshot_ref: string;
  record_json: string;
  applied_snapshot_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: CurrentWorkingPerspectiveApplyWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_current_working_perspective_apply_record",
  "can_create_current_working_perspective_apply_receipt",
  "can_create_applied_current_working_perspective_snapshot",
  "can_apply_current_working_perspective_update_to_local_snapshot",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_apply_receipt_written",
  "current_working_perspective_apply_persisted",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_update_applied_to_local_snapshot",
]);

const forbiddenRequestedSideEffectPatterns = [
  /current.*working.*perspective.*(update|mutate|apply|live)|\bcwp\b.*(update|mutate|apply|live)/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay/i,
  /live.*relay/i,
  /handoff/i,
  /memory/i,
  /global.*metric|dogfood.*metrics|update.*metrics/i,
  /metric.*snapshot/i,
  /reuse.*outcome|handoff.*reuse|reuse.*ledger/i,
  /expected.*observed.*delta/i,
  /work.*episode/i,
  /provider|openai/i,
  /github/i,
  /execute.*codex|codex.*execute|codex_executed/i,
  /\bpr\b.*create|\bpr\b.*merge/i,
  /autonomous/i,
  /graph|vector|\brag\b|crawler|browser/i,
] as const;

const sampleDefaultOrSmokeMarkers = [
  "sample",
  "fixture",
  "smoke_fixture",
  "smoke-fixture",
  "fixture:smoke",
  "smoke:fixture",
  "smoke fixture",
  "workbench:default",
  "default_workbench",
  "default-workbench",
  "workbench:",
] as const;

const validPatchTargets = new Set<CurrentWorkingPerspectivePatchTarget>([
  "current_frame",
  "current_thesis",
  "active_goals",
  "accepted_assumptions",
  "rejected_assumptions",
  "open_questions",
  "active_risks",
  "next_candidates",
  "review_queue_hints",
  "staleness_and_gaps",
  "continuity_relay_alignment",
]);

const validPatchOperations = new Set<CurrentWorkingPerspectivePatchOperation>([
  "add",
  "preserve",
  "warn",
  "deprioritize",
  "retire",
  "replace_candidate",
  "align",
]);

export const currentWorkingPerspectiveApplyWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS current_working_perspective_apply_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  applied_snapshot_ref TEXT NOT NULL,
  record_json TEXT NOT NULL,
  applied_snapshot_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_cwp_update_contract_records_scope_created
  ON current_working_perspective_apply_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_cwp_update_contract_records_operator
  ON current_working_perspective_apply_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_cwp_apply_records_snapshot
  ON current_working_perspective_apply_records(scope, applied_snapshot_ref, created_at, record_id);
`;

export function ensureCurrentWorkingPerspectiveApplyWriteSchemaV01(
  db: CurrentWorkingPerspectiveApplyWriteDbLike,
): void {
  db.exec(currentWorkingPerspectiveApplyWriteSchemaSqlV01);
}

export function currentWorkingPerspectiveApplyWriteSchemaExistsV01(
  db: CurrentWorkingPerspectiveApplyWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(CURRENT_WORKING_PERSPECTIVE_APPLY_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === CURRENT_WORKING_PERSPECTIVE_APPLY_WRITE_TABLE;
}

export function validateCurrentWorkingPerspectiveApplyWriteInputV01(
  input: unknown,
): ValidationResult {
  if (!isRecord(input)) {
    return validationResult({
      refusal_reasons: ["input_must_be_object"],
      input: null,
      idempotency_key: null,
    });
  }

  const reasons: string[] = [];
  const idempotencyKey = safeRef(input.idempotency_key);
  if (!idempotencyKey) reasons.push("idempotency_key_missing_or_invalid");
  reasons.push(...validateNotes(input.notes));
  const decisionPreview = getRecord(input, "apply_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const decisionMaterial = getRecord(
    decisionPreview,
    "would_write_current_working_perspective_apply_decision_preview",
  );
  const contractPreview = getRecord(decisionMaterial, "contract_preview");
  const recordMaterial = getRecord(
    contractPreview,
    "would_write_current_working_perspective_apply_record_preview",
  );
  if (
    idempotencyKey &&
    typeof decisionMaterial?.requested_idempotency_key === "string" &&
    decisionMaterial.requested_idempotency_key !== idempotencyKey
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_preview");
  }
  const approval = getRecord(input, "operator_approval");
  reasons.push(...validateApproval({ approval, decisionMaterial }));
  if (recordMaterial) reasons.push(...validateRecordMaterial(recordMaterial));
  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_workbench_material_refused");
  }
  reasons.push(...findRequestedSideEffectRefusals(input.requested_side_effects));

  return validationResult({
    refusal_reasons: uniqueCandidateIngressStringsV01(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as CurrentWorkingPerspectiveApplyWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeCurrentWorkingPerspectiveApplyRecordV01(
  input: unknown,
  options: { db: CurrentWorkingPerspectiveApplyWriteDbLike },
): CurrentWorkingPerspectiveApplyStoreResult {
  const validation =
    validateCurrentWorkingPerspectiveApplyWriteInputV01(input);
  if (!validation.ok || !validation.input || !validation.idempotency_key) {
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        validation,
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: null,
      }),
    );
  }

  ensureCurrentWorkingPerspectiveApplyWriteSchemaV01(options.db);
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: CurrentWorkingPerspectiveApplyWriteInput;
      idempotency_key: string;
    },
  );
  const existing =
    readCurrentWorkingPerspectiveApplyRecordByIdempotencyKeyV01(
      record.idempotency_key,
      { db: options.db },
    ).record;
  if (existing) {
    if (existing.record_fingerprint === record.record_fingerprint) {
      return storeResult(
        "idempotent_existing",
        existing,
        [existing],
        createReceipt({
          validation,
          wrote: false,
          refused: false,
          idempotentReplay: true,
          record: existing,
        }),
      );
    }
    return storeResult(
      "refused",
      existing,
      [existing],
      createReceipt({
        validation: {
          idempotency_key: validation.idempotency_key,
          refusal_reasons: ["idempotency_key_conflict"],
        },
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: existing,
      }),
    );
  }

  const receipt = createReceipt({
    validation,
    wrote: true,
    refused: false,
    idempotentReplay: false,
    record,
  });
  let transactionStarted = false;
  try {
    options.db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    options.db
      .prepare(
        `INSERT INTO current_working_perspective_apply_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          applied_snapshot_ref,
          record_json,
          applied_snapshot_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.record_fingerprint,
        record.applied_snapshot_ref,
        JSON.stringify(record),
        JSON.stringify(record.applied_snapshot),
        JSON.stringify(receipt),
      );
    options.db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult("written", record, [record], receipt);
  } catch {
    if (transactionStarted) {
      try {
        options.db.prepare("ROLLBACK").run();
      } catch {
        // Refusal below covers rollback failure.
      }
    }
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        validation: {
          idempotency_key: validation.idempotency_key,
          refusal_reasons: ["sqlite_insert_failed"],
        },
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: null,
      }),
    );
  }
}

export function refuseCurrentWorkingPerspectiveApplyWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): CurrentWorkingPerspectiveApplyStoreResult {
  const validation =
    validateCurrentWorkingPerspectiveApplyWriteInputV01(input);
  return storeResult(
    "refused",
    null,
    [],
    createReceipt({
      validation: {
        idempotency_key: validation.idempotency_key,
        refusal_reasons: uniqueCandidateIngressStringsV01([
          ...validation.refusal_reasons,
          ...extraReasons,
        ]),
      },
      wrote: false,
      refused: true,
      idempotentReplay: false,
      record: null,
    }),
  );
}

export function readCurrentWorkingPerspectiveApplyRecordByIdV01(
  recordId: string,
  options: { db: CurrentWorkingPerspectiveApplyWriteDbLike },
): CurrentWorkingPerspectiveApplyStoreResult {
  if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_apply_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE) as
    | CurrentWorkingPerspectiveApplyWriteRow
    | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["record_not_found"], null),
    );
  }
  return storeResult("read", rowToRecord(row), [rowToRecord(row)], rowToReceipt(row));
}

export function readCurrentWorkingPerspectiveApplyRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: CurrentWorkingPerspectiveApplyWriteDbLike },
): CurrentWorkingPerspectiveApplyStoreResult {
  if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_apply_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(
      idempotencyKey,
      CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    ) as CurrentWorkingPerspectiveApplyWriteRow | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["record_not_found"], idempotencyKey),
    );
  }
  return storeResult("read", rowToRecord(row), [rowToRecord(row)], rowToReceipt(row));
}

export function readCurrentWorkingPerspectiveApplyRecordByAppliedSnapshotRefV01(
  appliedSnapshotRef: string,
  options: { db: CurrentWorkingPerspectiveApplyWriteDbLike },
): CurrentWorkingPerspectiveApplyStoreResult {
  if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_apply_records
       WHERE applied_snapshot_ref = ? AND scope = ?`,
    )
    .get(
      appliedSnapshotRef,
      CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    ) as CurrentWorkingPerspectiveApplyWriteRow | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["applied_snapshot_not_found"], null),
    );
  }
  return storeResult("read", rowToRecord(row), [rowToRecord(row)], rowToReceipt(row));
}

export function readLatestAppliedCurrentWorkingPerspectiveSnapshotV01(
  options: { db: CurrentWorkingPerspectiveApplyWriteDbLike },
): CurrentWorkingPerspectiveApplyStoreResult {
  if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_apply_records
       WHERE scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT 1`,
    )
    .get(
      CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    ) as CurrentWorkingPerspectiveApplyWriteRow | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["applied_snapshot_not_found"], null),
    );
  }
  return storeResult("read", rowToRecord(row), [rowToRecord(row)], rowToReceipt(row));
}

export function listCurrentWorkingPerspectiveApplyRecordsV01(
  options: { db: CurrentWorkingPerspectiveApplyWriteDbLike } &
    CurrentWorkingPerspectiveApplyWriteListOptions,
): CurrentWorkingPerspectiveApplyStoreResult {
  if (!currentWorkingPerspectiveApplyWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_apply_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as CurrentWorkingPerspectiveApplyWriteRow[];
  const records = rows.map(rowToRecord);
  return storeResult(
    "listed",
    records[0] ?? null,
    records,
    rows[0]?.receipt_json
      ? rowToReceipt(rows[0])
      : createRefusedReceipt([], options.idempotency_key ?? null),
  );
}

export function createCurrentWorkingPerspectiveApplyWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): CurrentWorkingPerspectiveApplyWriteAuthorityBoundary {
  return {
    durable_local_current_working_perspective_apply_record: true,
    durable_local_applied_current_working_perspective_snapshot: true,
    source_of_truth: false,
    local_project_current_working_perspective_apply_only: true,
    can_write_db: writeNow,
    can_create_current_working_perspective_apply_record: writeNow,
    can_create_current_working_perspective_apply_receipt: writeNow,
    can_create_applied_current_working_perspective_snapshot: writeNow,
    can_apply_current_working_perspective_update_to_local_snapshot: writeNow,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_replace_current_working_perspective_route_response: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: [
      "Authority is limited to one scoped local CurrentWorkingPerspective apply record, receipt, and applied snapshot.",
      "Applying here means persisting a local applied snapshot only; it does not mutate upstream CWP source tables or replace /api/perspective/current.",
      "This writer cannot write PerspectiveUnit, NextWorkBias, ContinuityRelay, live relay state, handoff, memory, metrics, upstream ledgers, provider/GitHub/Codex, PRs, autonomous actions, graph/vector/RAG/crawler/browser, or Workbench action state.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["operator_decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    CURRENT_WORKING_PERSPECTIVE_APPLY_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (preview.scope !== CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE) {
    reasons.push("operator_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_current_working_perspective_apply_record_write"
  ) {
    reasons.push("operator_decision_preview_not_ready_for_apply_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_current_working_perspective_apply_record"
  ) {
    reasons.push("operator_decision_preview_recommended_decision_not_approve");
  }
  const writeReadiness = getRecord(preview, "write_readiness");
  if (
    !writeReadiness ||
    writeReadiness.write_ready !== true ||
    arrayLength(writeReadiness.current_blockers) > 0 ||
    arrayLength(writeReadiness.current_missing_evidence) > 0 ||
    arrayLength(writeReadiness.current_refusal_reasons) > 0 ||
    arrayLength(writeReadiness.current_insufficient_data) > 0
  ) {
    reasons.push("operator_decision_preview_write_readiness_invalid");
  }
  const decisionMaterial = getRecord(
    preview,
    "would_write_current_working_perspective_apply_decision_preview",
  );
  if (!decisionMaterial) {
    reasons.push("operator_decision_preview_write_material_missing");
  } else {
    const contractPreview = getRecord(decisionMaterial, "contract_preview");
    reasons.push(...validateContractPreview(contractPreview));
  }
  const authority = getRecord(preview, "authority_boundary");
  const falseOnlyAuthorityFields = [
    "source_of_truth",
    "can_write_db",
    "can_create_current_working_perspective_apply_record",
    "can_update_current_working_perspective",
    "can_mutate_current_working_perspective",
    "can_write_current_working_perspective_live_state",
    "can_apply_current_working_perspective_update",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_write_continuity_relay",
    "can_update_continuity_relay",
    "can_apply_live_relay_state",
    "can_mutate_handoff_context",
    "can_apply_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_send_handoff",
    "can_write_memory",
    "can_mutate_memory",
    "can_promote_memory",
    "can_update_global_dogfood_metrics",
    "can_write_dogfood_metrics",
    "can_write_dogfood_metric_snapshot",
    "can_write_reuse_outcome_ledger",
    "can_write_expected_observed_delta",
    "can_write_work_episode",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_create_pr",
    "can_merge_pr",
    "can_run_autonomous_action",
    "can_create_graph_or_vector_store",
    "can_create_rag_stack",
    "can_crawl_or_observe_browser",
    "can_render_workbench_action_button",
  ];
  if (
    !authority ||
    authority.read_only !== true ||
    authority.advisory_only !== true ||
    authority.operator_decision_preview_only !== true ||
    falseOnlyAuthorityFields.some((field) => authority[field] !== false)
  ) {
    reasons.push("operator_decision_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateContractPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["apply_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== CURRENT_WORKING_PERSPECTIVE_APPLY_PREVIEW_VERSION) {
    reasons.push("apply_preview_version_invalid");
  }
  if (
    preview.apply_preview_status !==
    "ready_for_future_current_working_perspective_apply_record_write"
  ) {
    reasons.push("apply_preview_not_ready");
  }
  const readiness = getRecord(preview, "apply_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("apply_preview_readiness_invalid");
  }
  const authority = getRecord(preview, "authority_boundary");
  const falseOnlyAuthorityFields = [
    "source_of_truth",
    "can_write_db",
    "can_create_current_working_perspective_apply_record",
    "can_create_applied_current_working_perspective_snapshot",
    "can_update_current_working_perspective",
    "can_mutate_current_working_perspective",
    "can_write_current_working_perspective_live_state",
    "can_apply_current_working_perspective_update",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_write_continuity_relay",
    "can_update_continuity_relay",
    "can_apply_live_relay_state",
    "can_mutate_handoff_context",
    "can_apply_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_send_handoff",
    "can_write_memory",
    "can_mutate_memory",
    "can_promote_memory",
    "can_update_global_dogfood_metrics",
    "can_write_dogfood_metrics",
    "can_write_dogfood_metric_snapshot",
    "can_write_reuse_outcome_ledger",
    "can_write_expected_observed_delta",
    "can_write_work_episode",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_create_pr",
    "can_merge_pr",
    "can_run_autonomous_action",
    "can_create_graph_or_vector_store",
    "can_create_rag_stack",
    "can_crawl_or_observe_browser",
    "can_render_workbench_action_button",
  ];
  if (
    !authority ||
    authority.read_only !== true ||
    authority.advisory_only !== true ||
    authority.apply_preview_only !== true ||
    falseOnlyAuthorityFields.some((field) => authority[field] !== false)
  ) {
    reasons.push("apply_preview_authority_boundary_invalid");
  }
  const proposedAppliedCwp = getRecord(
    preview,
    "proposed_applied_current_working_perspective",
  );
  if (!proposedAppliedCwp) {
    reasons.push("proposed_applied_current_working_perspective_missing");
  } else if (!isCurrentWorkingPerspectiveLike(proposedAppliedCwp)) {
    reasons.push("proposed_applied_current_working_perspective_malformed");
  }
  const patchSummary = getRecord(
    preview,
    "proposed_patch_application_summary",
  );
  if (!patchSummary) {
    reasons.push("patch_application_summary_missing");
  } else {
    reasons.push(...validatePatchApplicationSummary(patchSummary));
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_current_working_perspective_apply_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("contract_record_preview_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  return reasons;
}

function validatePatchApplicationSummary(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (Number(material.applied_patch_count ?? 0) <= 0) {
    reasons.push("applied_patch_count_missing");
  }
  if (safeStringArray(material.applied_patch_refs).length === 0) {
    reasons.push("applied_patch_refs_missing");
  }
  if (!safeRef(material.source_contract_record_ref)) {
    reasons.push("source_contract_record_ref_missing_or_invalid");
  }
  return reasons;
}

function isCurrentWorkingPerspectiveLike(value: Record<string, unknown>): boolean {
  const authority = getRecord(value, "authority_boundary");
  return (
    value.perspective_version === "current_working_perspective.v0.1" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE &&
    isRecord(value.current_frame) &&
    isRecord(value.current_thesis) &&
    Array.isArray(value.active_goals) &&
    Array.isArray(value.open_questions) &&
    Array.isArray(value.active_risks) &&
    Array.isArray(value.next_candidates) &&
    isRecord(value.source_refs) &&
    isRecord(value.staleness) &&
    Array.isArray(value.gaps) &&
    authority?.derived_view_only === true &&
    authority?.can_write_db === false
  );
}

function validateRecordMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (
    material.proposed_record_kind !==
    CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION
  ) {
    reasons.push("proposed_record_kind_invalid");
  }
  if (!safeRef(material.requested_operator_ref)) {
    reasons.push("requested_operator_ref_missing_or_invalid");
  }
  if (!safeRef(material.requested_idempotency_key)) {
    reasons.push("requested_idempotency_key_missing_or_invalid");
  }
  if (!safeRef(material.review_confirmation_ref)) {
    reasons.push("review_confirmation_ref_missing_or_invalid");
  }
  const sourceRefs = safeStringArray(material.source_refs);
  const evidenceRefs = safeStringArray(material.evidence_refs);
  if (sourceRefs.length === 0) reasons.push("source_refs_missing");
  if (evidenceRefs.length === 0) reasons.push("evidence_refs_missing");
  if (sourceRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("source_refs_unsafe");
  }
  if (evidenceRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("evidence_refs_unsafe");
  }
  if (material.proposed_receipt_kind !== CURRENT_WORKING_PERSPECTIVE_APPLY_RECEIPT_VERSION) {
    reasons.push("proposed_receipt_kind_invalid");
  }
  if (material.proposed_store_kind !== CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION) {
    reasons.push("proposed_store_kind_invalid");
  }
  if (
    material.proposed_applied_snapshot_kind !==
    CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION
  ) {
    reasons.push("proposed_applied_snapshot_kind_invalid");
  }
  if (!safeRef(material.source_current_working_perspective_update_contract_record_ref)) {
    reasons.push("source_contract_record_ref_missing_or_invalid");
  }
  if (!safeRef(material.applied_snapshot_ref)) {
    reasons.push("applied_snapshot_ref_missing_or_invalid");
  }
  const appliedCwp = getRecord(
    material,
    "applied_current_working_perspective",
  );
  if (!appliedCwp || !isCurrentWorkingPerspectiveLike(appliedCwp)) {
    reasons.push("applied_current_working_perspective_malformed");
  }
  const patchSummary = getRecord(material, "patch_application_summary");
  if (!patchSummary) {
    reasons.push("patch_application_summary_missing");
  } else {
    reasons.push(...validatePatchApplicationSummary(patchSummary));
  }
  const appliedPatchRefs = safeStringArray(material.applied_patch_refs);
  if (appliedPatchRefs.length === 0) reasons.push("applied_patch_refs_missing");
  if (appliedPatchRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("applied_patch_refs_unsafe");
  }
  return reasons;
}

function validatePatchEntry(entry: unknown, index: number): string[] {
  if (!isRecord(entry)) return [`proposed_patch_entry_${index}_malformed`];
  const reasons: string[] = [];
  if (!safeRef(entry.patch_ref)) reasons.push("proposed_patch_entry_ref_invalid");
  if (
    typeof entry.patch_target !== "string" ||
    !validPatchTargets.has(entry.patch_target as CurrentWorkingPerspectivePatchTarget)
  ) {
    reasons.push("proposed_patch_entry_target_invalid");
  }
  if (
    typeof entry.patch_operation !== "string" ||
    !validPatchOperations.has(entry.patch_operation as CurrentWorkingPerspectivePatchOperation)
  ) {
    reasons.push("proposed_patch_entry_operation_invalid");
  }
  if (typeof entry.summary !== "string" || !entry.summary.trim()) {
    reasons.push("proposed_patch_entry_summary_missing");
  }
  if (entry.authority_required !== "future_current_working_perspective_apply") {
    reasons.push("proposed_patch_entry_authority_required_invalid");
  }
  if (
    entry.persistence_horizon !==
    "current_working_perspective_apply_record"
  ) {
    reasons.push("proposed_patch_entry_persistence_horizon_invalid");
  }
  for (const [field, value] of [
    ["source_record_refs", entry.source_record_refs],
    ["source_refs", entry.source_refs],
    ["evidence_refs", entry.evidence_refs],
  ] as const) {
    const refs = safeStringArray(value);
    if (refs.length === 0) reasons.push(`proposed_patch_entry_${field}_missing`);
    if (refs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
      reasons.push(`proposed_patch_entry_${field}_unsafe`);
    }
  }
  return reasons;
}

function validateApproval({
  approval,
  decisionMaterial,
}: {
  approval: Record<string, unknown> | null;
  decisionMaterial: Record<string, unknown> | null;
}): string[] {
  if (!approval) return ["operator_approval_missing"];
  const reasons: string[] = [];
  if (
    approval.operator_decision !==
    "approve_for_current_working_perspective_apply_record"
  ) {
    reasons.push("operator_approval_decision_invalid");
  }
  if (!safeRef(approval.approved_by)) reasons.push("approved_by_missing_or_invalid");
  if (!safeRef(approval.operator_ref)) reasons.push("operator_ref_missing_or_invalid");
  if (
    decisionMaterial &&
    typeof decisionMaterial.requested_operator_ref === "string" &&
    approval.operator_ref !== decisionMaterial.requested_operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }
  if (typeof approval.approved_at !== "string" || !approval.approved_at.trim()) {
    reasons.push("approved_at_missing");
  }
  if (
    typeof approval.approval_statement !== "string" ||
    !approval.approval_statement.trim() ||
    containsCandidateIngressUnsafeMarkerV01(approval.approval_statement)
  ) {
    reasons.push("approval_statement_missing_or_unsafe");
  }
  const checklist = safeStringArray(approval.checklist_confirmations);
  if (checklist.length === 0) reasons.push("checklist_confirmations_missing");
  if (checklist.some((item) => !isCandidateIngressPublicSafeRefV01(item))) {
    reasons.push("checklist_confirmations_unsafe");
  }
  return reasons;
}

function buildRecord(
  validation: ValidationResult & {
    ok: true;
    input: CurrentWorkingPerspectiveApplyWriteInput;
    idempotency_key: string;
  },
): CurrentWorkingPerspectiveApplyRecord {
  const decisionPreview = validation.input.apply_decision_preview;
  const decisionMaterial =
    decisionPreview
      .would_write_current_working_perspective_apply_decision_preview;
  const applyPreview = decisionMaterial
    .contract_preview as CurrentWorkingPerspectiveApplyOperatorDecisionPreview["would_write_current_working_perspective_apply_decision_preview"]["contract_preview"] &
    Record<string, any>;
  const recordMaterial =
    applyPreview.would_write_current_working_perspective_apply_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const appliedCurrentWorkingPerspective =
    recordMaterial.applied_current_working_perspective as NonNullable<
      typeof recordMaterial.applied_current_working_perspective
    >;
  const sourceContractRecordRef =
    recordMaterial.source_current_working_perspective_update_contract_record_ref as string;
  const appliedSnapshotRef = recordMaterial.applied_snapshot_ref as string;
  const patchApplicationSummary = recordMaterial.patch_application_summary;
  const appliedPatchRefs = safeStringArray(recordMaterial.applied_patch_refs);
  const appliedCwpFingerprint = recordFingerprintFor(
    appliedCurrentWorkingPerspective,
  );
  const base = {
    record_version: CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: recordMaterial.source_refs,
    evidence_refs: recordMaterial.evidence_refs,
    source_current_working_perspective_ref:
      recordMaterial.source_current_working_perspective_ref,
    source_current_working_perspective_update_contract_record_ref:
      sourceContractRecordRef,
    source_current_working_perspective_update_contract_record_fingerprint:
      recordMaterial
        .source_current_working_perspective_update_contract_record_fingerprint,
    applied_snapshot_version: CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION,
    applied_snapshot_ref: appliedSnapshotRef,
    applied_current_working_perspective: appliedCurrentWorkingPerspective,
    applied_current_working_perspective_fingerprint: appliedCwpFingerprint,
    patch_application_summary: patchApplicationSummary,
    applied_patch_refs: appliedPatchRefs,
    applied_patch_count: appliedPatchRefs.length,
    preserved_existing_cwp_ref:
      patchApplicationSummary.preserved_existing_cwp_ref ?? null,
    authority_profile: {
      durable_local_current_working_perspective_apply_record: true,
      durable_local_applied_current_working_perspective_snapshot: true,
      source_of_truth: false,
      local_project_current_working_perspective_apply_only: true,
      persistence_horizon:
        "local_project_current_working_perspective_apply_store",
      current_working_perspective_apply_record_written: true,
      applied_current_working_perspective_snapshot_written: true,
      current_working_perspective_update_applied_to_local_snapshot: true,
      upstream_current_working_perspective_source_tables_mutated: false,
      perspective_unit_write_performed: false,
      next_work_bias_write_performed: false,
      continuity_relay_write_performed: false,
      continuity_relay_update_performed: false,
      handoff_context_mutation_performed: false,
      memory_promotion_performed: false,
      metric_update_performed: false,
    } satisfies CurrentWorkingPerspectiveApplyAuthorityProfile,
    review_status:
      "applied_as_scoped_current_working_perspective_snapshot" as const,
    persistence_horizon:
      "local_project_current_working_perspective_apply_store" as const,
    mutation_boundary: createMutationBoundary(),
    write_validation: {
      validation_version:
        "current_working_perspective_apply_write_validation.v0.1" as const,
      operator_decision_preview_revalidated: true,
      applied_snapshot_revalidated: true,
      patch_application_summary_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_upstream_cwp_relay_handoff_memory_promotion: false,
      refused_metric_or_upstream_write: false,
      validation_hash: validationHash(validation.refusal_reasons),
    } satisfies CurrentWorkingPerspectiveApplyWriteValidation,
    authority_boundary:
      createCurrentWorkingPerspectiveApplyWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: validation.input.notes ?? [],
  };
  const appliedSnapshot: CurrentWorkingPerspectiveAppliedSnapshot = {
    snapshot_version: CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION,
    applied_snapshot_ref: appliedSnapshotRef,
    scope: CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    as_of: appliedCurrentWorkingPerspective.as_of,
    source_contract_record_ref:
      sourceContractRecordRef,
    source_current_working_perspective_ref:
      recordMaterial.source_current_working_perspective_ref,
    applied_current_working_perspective: appliedCurrentWorkingPerspective,
    applied_patch_refs: appliedPatchRefs,
    applied_patch_count: appliedPatchRefs.length,
    source_refs: recordMaterial.source_refs,
    evidence_refs: recordMaterial.evidence_refs,
    authority_boundary:
      createCurrentWorkingPerspectiveApplyWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
  };
  const recordFingerprint = recordFingerprintFor(base);
  return {
    ...base,
    applied_snapshot: appliedSnapshot,
    record_id: `current-working-perspective-apply:${recordFingerprint.slice(
      0,
      24,
    )}`,
    record_fingerprint: recordFingerprint,
  };
}

function createMutationBoundary(): CurrentWorkingPerspectiveApplyMutationBoundary {
  return {
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    current_working_perspective_route_response_replaced: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
  };
}

function createReceipt({
  validation,
  wrote,
  refused,
  idempotentReplay,
  record,
}: {
  validation:
    | ValidationResult
    | { idempotency_key: string | null; refusal_reasons: string[] };
  wrote: boolean;
  refused: boolean;
  idempotentReplay: boolean;
  record: CurrentWorkingPerspectiveApplyRecord | null;
}): CurrentWorkingPerspectiveApplyReceipt {
  return {
    receipt_version: CURRENT_WORKING_PERSPECTIVE_APPLY_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: record?.created_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: validationHash(validation.refusal_reasons),
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record
      ? `${CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION}:${record.record_id}`
      : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function createNoSideEffects(written: boolean): CurrentWorkingPerspectiveApplyNoSideEffects {
  return {
    current_working_perspective_apply_record_written: written,
    current_working_perspective_apply_receipt_written: written,
    current_working_perspective_apply_persisted: written,
    applied_current_working_perspective_snapshot_written: written,
    current_working_perspective_update_applied_to_local_snapshot: written,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    current_working_perspective_route_response_replaced: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
  };
}

function storeResult(
  status: CurrentWorkingPerspectiveApplyWriteStatus,
  record: CurrentWorkingPerspectiveApplyRecord | null,
  records: CurrentWorkingPerspectiveApplyRecord[],
  receipt: CurrentWorkingPerspectiveApplyReceipt,
): CurrentWorkingPerspectiveApplyStoreResult {
  return {
    store_version: CURRENT_WORKING_PERSPECTIVE_APPLY_STORE_VERSION,
    scope: CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
    status,
    ok: ["written", "idempotent_existing", "read", "listed"].includes(status),
    record,
    records,
    applied_snapshot: record?.applied_snapshot ?? null,
    applied_snapshots: records.map((item) => item.applied_snapshot),
    receipt,
    error_code: ["refused", "not_found", "schema_missing"].includes(status)
      ? status
      : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function rowToRecord(
  row: CurrentWorkingPerspectiveApplyWriteRow,
): CurrentWorkingPerspectiveApplyRecord {
  return JSON.parse(row.record_json) as CurrentWorkingPerspectiveApplyRecord;
}

function rowToReceipt(
  row: CurrentWorkingPerspectiveApplyWriteRow,
): CurrentWorkingPerspectiveApplyReceipt {
  return JSON.parse(row.receipt_json) as CurrentWorkingPerspectiveApplyReceipt;
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): CurrentWorkingPerspectiveApplyReceipt {
  return createReceipt({
    validation: {
      idempotency_key: idempotencyKey,
      refusal_reasons: refusalReasons,
    },
    wrote: false,
    refused: true,
    idempotentReplay: false,
    record: null,
  });
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: CurrentWorkingPerspectiveApplyWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    idempotency_key,
  };
}

function recordFingerprintFor(value: unknown): string {
  return hashText(JSON.stringify(value));
}

function validationHash(reasons: string[]): string {
  return hashText(JSON.stringify(uniqueCandidateIngressStringsV01(reasons)));
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  const notes = safeStringArray(value);
  if (!Array.isArray(value)) return ["notes_must_be_string_array"];
  if (notes.length !== value.length) return ["notes_must_be_string_array"];
  if (notes.some((note) => containsCandidateIngressUnsafeMarkerV01(note))) {
    return ["notes_contain_private_or_unsafe_marker"];
  }
  return [];
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, sideEffectValue] of Object.entries(value)) {
    if (allowedRequestedSideEffectKeys.has(key)) continue;
    if (sideEffectValue === true) {
      reasons.push("requested_side_effect_not_allowed");
      continue;
    }
    if (forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))) {
      reasons.push("requested_side_effect_not_allowed");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  if (typeof value === "string") {
    return containsCandidateIngressUnsafeMarkerV01(value);
  }
  if (Array.isArray(value)) return value.some(containsRawOrPrivateMarkers);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, nested]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawOrPrivateMarkers(nested),
  );
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return sampleDefaultOrSmokeMarkers.some((marker) =>
      normalized.includes(marker),
    );
  }
  if (Array.isArray(value)) return value.some(containsSampleDefaultOrSmokeMaterial);
  if (!isRecord(value)) return false;
  return Object.values(value).some(containsSampleDefaultOrSmokeMaterial);
}

function getRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
