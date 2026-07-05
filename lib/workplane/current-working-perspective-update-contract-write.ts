import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview,
} from "@/types/current-working-perspective-update-contract-decision";
import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_PREVIEW_VERSION,
  type CurrentWorkingPerspectivePatchEntry,
  type CurrentWorkingPerspectivePatchOperation,
  type CurrentWorkingPerspectivePatchTarget,
} from "@/types/current-working-perspective-update-contract-preview";
import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECEIPT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE,
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_STORE_VERSION,
  type CurrentWorkingPerspectiveUpdateContractAuthorityProfile,
  type CurrentWorkingPerspectiveUpdateContractNoSideEffects,
  type CurrentWorkingPerspectiveUpdateContractRecord,
  type CurrentWorkingPerspectiveUpdateContractReceipt,
  type CurrentWorkingPerspectiveUpdateContractStoreResult,
  type CurrentWorkingPerspectiveUpdateContractWriteAuthorityBoundary,
  type CurrentWorkingPerspectiveUpdateContractWriteInput,
  type CurrentWorkingPerspectiveUpdateContractWriteValidation,
  type CurrentWorkingPerspectiveUpdateContractWriteStatus,
} from "@/types/current-working-perspective-update-contract-write";

export const CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_WRITE_TABLE =
  "current_working_perspective_update_contract_records" as const;

export interface CurrentWorkingPerspectiveUpdateContractWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface CurrentWorkingPerspectiveUpdateContractWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface CurrentWorkingPerspectiveUpdateContractWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: CurrentWorkingPerspectiveUpdateContractWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_current_working_perspective_update_contract_record",
  "can_create_current_working_perspective_update_contract_receipt",
  "can_write_current_working_perspective_update_contract",
  "current_working_perspective_update_contract_record_written",
  "current_working_perspective_update_contract_receipt_written",
  "current_working_perspective_update_contract_persisted",
  "current_working_perspective_update_contract_written",
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

export const currentWorkingPerspectiveUpdateContractWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS current_working_perspective_update_contract_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_cwp_update_contract_records_scope_created
  ON current_working_perspective_update_contract_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_cwp_update_contract_records_operator
  ON current_working_perspective_update_contract_records(scope, operator_ref, created_at, record_id);
`;

export function ensureCurrentWorkingPerspectiveUpdateContractWriteSchemaV01(
  db: CurrentWorkingPerspectiveUpdateContractWriteDbLike,
): void {
  db.exec(currentWorkingPerspectiveUpdateContractWriteSchemaSqlV01);
}

export function currentWorkingPerspectiveUpdateContractWriteSchemaExistsV01(
  db: CurrentWorkingPerspectiveUpdateContractWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_WRITE_TABLE;
}

export function validateCurrentWorkingPerspectiveUpdateContractWriteInputV01(
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
  const decisionPreview = getRecord(input, "operator_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const decisionMaterial = getRecord(
    decisionPreview,
    "would_write_current_working_perspective_update_contract_decision_preview",
  );
  const contractPreview = getRecord(decisionMaterial, "contract_preview");
  const recordMaterial = getRecord(
    contractPreview,
    "would_write_current_working_perspective_update_contract_record_preview",
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
        ? (input as unknown as CurrentWorkingPerspectiveUpdateContractWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeCurrentWorkingPerspectiveUpdateContractRecordV01(
  input: unknown,
  options: { db: CurrentWorkingPerspectiveUpdateContractWriteDbLike },
): CurrentWorkingPerspectiveUpdateContractStoreResult {
  const validation =
    validateCurrentWorkingPerspectiveUpdateContractWriteInputV01(input);
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

  ensureCurrentWorkingPerspectiveUpdateContractWriteSchemaV01(options.db);
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: CurrentWorkingPerspectiveUpdateContractWriteInput;
      idempotency_key: string;
    },
  );
  const existing =
    readCurrentWorkingPerspectiveUpdateContractRecordByIdempotencyKeyV01(
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
        `INSERT INTO current_working_perspective_update_contract_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.record_fingerprint,
        JSON.stringify(record),
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

export function refuseCurrentWorkingPerspectiveUpdateContractWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): CurrentWorkingPerspectiveUpdateContractStoreResult {
  const validation =
    validateCurrentWorkingPerspectiveUpdateContractWriteInputV01(input);
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

export function readCurrentWorkingPerspectiveUpdateContractRecordByIdV01(
  recordId: string,
  options: { db: CurrentWorkingPerspectiveUpdateContractWriteDbLike },
): CurrentWorkingPerspectiveUpdateContractStoreResult {
  if (!currentWorkingPerspectiveUpdateContractWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_update_contract_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE) as
    | CurrentWorkingPerspectiveUpdateContractWriteRow
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

export function readCurrentWorkingPerspectiveUpdateContractRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: CurrentWorkingPerspectiveUpdateContractWriteDbLike },
): CurrentWorkingPerspectiveUpdateContractStoreResult {
  if (!currentWorkingPerspectiveUpdateContractWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_update_contract_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(
      idempotencyKey,
      CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE,
    ) as CurrentWorkingPerspectiveUpdateContractWriteRow | undefined;
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

export function listCurrentWorkingPerspectiveUpdateContractRecordsV01(
  options: { db: CurrentWorkingPerspectiveUpdateContractWriteDbLike } &
    CurrentWorkingPerspectiveUpdateContractWriteListOptions,
): CurrentWorkingPerspectiveUpdateContractStoreResult {
  if (!currentWorkingPerspectiveUpdateContractWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE];
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
      `SELECT * FROM current_working_perspective_update_contract_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as CurrentWorkingPerspectiveUpdateContractWriteRow[];
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

export function createCurrentWorkingPerspectiveUpdateContractWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): CurrentWorkingPerspectiveUpdateContractWriteAuthorityBoundary {
  return {
    durable_local_current_working_perspective_update_contract: true,
    source_of_truth: false,
    local_project_current_working_perspective_update_contract_only: true,
    can_write_db: writeNow,
    can_create_current_working_perspective_update_contract_record: writeNow,
    can_create_current_working_perspective_update_contract_receipt: writeNow,
    can_write_current_working_perspective_update_contract: writeNow,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_write_current_working_perspective_live_state: false,
    can_apply_current_working_perspective_update: false,
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
      "Authority is limited to one scoped local CurrentWorkingPerspective update contract record and receipt.",
      "The contract record prepares a future apply slice but does not mutate live CurrentWorkingPerspective.",
      "This writer cannot write PerspectiveUnit, NextWorkBias, ContinuityRelay, live relay state, handoff, memory, metrics, upstream ledgers, provider/GitHub/Codex, PRs, autonomous actions, graph/vector/RAG/crawler/browser, or Workbench action state.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["operator_decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (preview.scope !== CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE) {
    reasons.push("operator_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_current_working_perspective_update_contract_record_write"
  ) {
    reasons.push("operator_decision_preview_not_ready_for_contract_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_current_working_perspective_update_contract_record"
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
    "would_write_current_working_perspective_update_contract_decision_preview",
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
    "can_create_current_working_perspective_update_contract_record",
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
  if (!preview) return ["contract_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_PREVIEW_VERSION) {
    reasons.push("contract_preview_version_invalid");
  }
  if (
    preview.contract_preview_status !==
    "ready_for_future_current_working_perspective_update_contract_record_write"
  ) {
    reasons.push("contract_preview_not_ready");
  }
  const readiness = getRecord(preview, "contract_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("contract_preview_readiness_invalid");
  }
  const authority = getRecord(preview, "authority_boundary");
  const falseOnlyAuthorityFields = [
    "source_of_truth",
    "can_write_db",
    "can_create_current_working_perspective_update_contract_record",
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
    authority.contract_material_only !== true ||
    falseOnlyAuthorityFields.some((field) => authority[field] !== false)
  ) {
    reasons.push("contract_preview_authority_boundary_invalid");
  }
  const proposedContract = getRecord(
    preview,
    "proposed_current_working_perspective_update_contract",
  );
  if (!proposedContract) {
    reasons.push("proposed_current_working_perspective_update_contract_missing");
  } else {
    reasons.push(...validateProposedContractMaterial(proposedContract));
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_current_working_perspective_update_contract_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("contract_record_preview_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  return reasons;
}

function validateProposedContractMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (
    material.contract_kind !==
    "current_working_perspective_update_contract.v0.1"
  ) {
    reasons.push("proposed_contract_kind_invalid");
  }
  const entries = Array.isArray(material.proposed_patch_entries)
    ? material.proposed_patch_entries
    : [];
  if (entries.length === 0) reasons.push("proposed_patch_entries_missing");
  entries.forEach((entry, index) => {
    reasons.push(...validatePatchEntry(entry, index));
  });
  return reasons;
}

function validateRecordMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (
    material.proposed_record_kind !==
    CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION
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
  const entries = Array.isArray(material.proposed_patch_entries)
    ? material.proposed_patch_entries
    : [];
  if (entries.length === 0) reasons.push("proposed_patch_entries_missing");
  entries.forEach((entry, index) => {
    reasons.push(...validatePatchEntry(entry, index));
  });
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
    "current_working_perspective_update_contract_record"
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
    "approve_for_current_working_perspective_update_contract_record"
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
    input: CurrentWorkingPerspectiveUpdateContractWriteInput;
    idempotency_key: string;
  },
): CurrentWorkingPerspectiveUpdateContractRecord {
  const decisionPreview = validation.input.operator_decision_preview;
  const decisionMaterial =
    decisionPreview
      .would_write_current_working_perspective_update_contract_decision_preview;
  const contractPreview = decisionMaterial
    .contract_preview as CurrentWorkingPerspectiveUpdateContractOperatorDecisionPreview["would_write_current_working_perspective_update_contract_decision_preview"]["contract_preview"] &
    Record<string, any>;
  const recordMaterial =
    contractPreview.would_write_current_working_perspective_update_contract_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const proposedContract =
    contractPreview.proposed_current_working_perspective_update_contract;
  const proposedPatchEntries =
    proposedContract.proposed_patch_entries as CurrentWorkingPerspectivePatchEntry[];
  const base = {
    record_version: CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: recordMaterial.source_refs,
    evidence_refs: recordMaterial.evidence_refs,
    source_current_working_perspective_ref: recordMaterial.current_cwp_ref,
    source_perspective_unit_record_refs:
      recordMaterial.contributing_record_refs.perspective_unit_record_refs,
    source_next_work_bias_record_refs:
      recordMaterial.contributing_record_refs.next_work_bias_record_refs,
    source_continuity_relay_record_refs:
      recordMaterial.contributing_record_refs.continuity_relay_record_refs,
    source_perspective_relay_update_decision_record_refs:
      recordMaterial.contributing_record_refs
        .perspective_relay_update_decision_record_refs,
    source_perspective_relay_update_write_contract_preview_ref:
      recordMaterial.contributing_record_refs
        .perspective_relay_update_write_contract_preview_ref,
    proposed_current_working_perspective_update_contract: proposedContract,
    proposed_patch_entries: proposedPatchEntries,
    proposed_patch_entry_count: proposedPatchEntries.length,
    authority_profile: {
      durable_local_current_working_perspective_update_contract: true,
      source_of_truth: false,
      local_project_current_working_perspective_update_contract_only: true,
      persistence_horizon:
        "local_project_current_working_perspective_update_contract_record",
      current_working_perspective_update_contract_written: true,
      current_working_perspective_update_performed: false,
      current_working_perspective_mutation_performed: false,
      perspective_unit_write_performed: false,
      next_work_bias_write_performed: false,
      continuity_relay_write_performed: false,
      continuity_relay_update_performed: false,
      handoff_context_mutation_performed: false,
      memory_promotion_performed: false,
      metric_update_performed: false,
    } satisfies CurrentWorkingPerspectiveUpdateContractAuthorityProfile,
    review_status:
      "recorded_as_scoped_current_working_perspective_update_contract" as const,
    persistence_horizon:
      "local_project_current_working_perspective_update_contract_record" as const,
    no_mutation_performed: createNoMutationPerformed(),
    write_validation: {
      validation_version:
        "current_working_perspective_update_contract_write_validation.v0.1" as const,
      operator_decision_preview_revalidated: true,
      proposed_contract_revalidated: true,
      proposed_patch_entries_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_live_cwp_relay_handoff_memory_promotion: false,
      refused_metric_or_upstream_write: false,
      validation_hash: validationHash(validation.refusal_reasons),
    } satisfies CurrentWorkingPerspectiveUpdateContractWriteValidation,
    authority_boundary:
      createCurrentWorkingPerspectiveUpdateContractWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: validation.input.notes ?? [],
  };
  const recordFingerprint = recordFingerprintFor(base);
  return {
    ...base,
    record_id: `current-working-perspective-update-contract:${recordFingerprint.slice(
      0,
      24,
    )}`,
    record_fingerprint: recordFingerprint,
  };
}

function createNoMutationPerformed(): CurrentWorkingPerspectiveUpdateContractRecord["no_mutation_performed"] {
  return {
    current_working_perspective_updated: false,
    current_working_perspective_mutated: false,
    current_working_perspective_live_state_written: false,
    current_working_perspective_update_applied: false,
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
  record: CurrentWorkingPerspectiveUpdateContractRecord | null;
}): CurrentWorkingPerspectiveUpdateContractReceipt {
  return {
    receipt_version: CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECEIPT_VERSION,
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
      ? `${CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_STORE_VERSION}:${record.record_id}`
      : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function createNoSideEffects(written: boolean): CurrentWorkingPerspectiveUpdateContractNoSideEffects {
  return {
    current_working_perspective_update_contract_record_written: written,
    current_working_perspective_update_contract_receipt_written: written,
    current_working_perspective_update_contract_persisted: written,
    current_working_perspective_update_contract_written: written,
    current_working_perspective_updated: false,
    current_working_perspective_mutated: false,
    current_working_perspective_live_state_written: false,
    current_working_perspective_update_applied: false,
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
  status: CurrentWorkingPerspectiveUpdateContractWriteStatus,
  record: CurrentWorkingPerspectiveUpdateContractRecord | null,
  records: CurrentWorkingPerspectiveUpdateContractRecord[],
  receipt: CurrentWorkingPerspectiveUpdateContractReceipt,
): CurrentWorkingPerspectiveUpdateContractStoreResult {
  return {
    store_version: CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_STORE_VERSION,
    scope: CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_SCOPE,
    status,
    ok: ["written", "idempotent_existing", "read", "listed"].includes(status),
    record,
    records,
    receipt,
    error_code: ["refused", "not_found", "schema_missing"].includes(status)
      ? status
      : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function rowToRecord(
  row: CurrentWorkingPerspectiveUpdateContractWriteRow,
): CurrentWorkingPerspectiveUpdateContractRecord {
  return JSON.parse(row.record_json) as CurrentWorkingPerspectiveUpdateContractRecord;
}

function rowToReceipt(
  row: CurrentWorkingPerspectiveUpdateContractWriteRow,
): CurrentWorkingPerspectiveUpdateContractReceipt {
  return JSON.parse(row.receipt_json) as CurrentWorkingPerspectiveUpdateContractReceipt;
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): CurrentWorkingPerspectiveUpdateContractReceipt {
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
  input: CurrentWorkingPerspectiveUpdateContractWriteInput | null;
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
