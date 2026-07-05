import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION,
  type HandoffContextUpdateContractOperatorDecisionPreview,
} from "@/types/handoff-context-update-contract-decision";
import { HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION } from "@/types/handoff-context-update-contract-preview";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_RECEIPT_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_STORE_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
  type HandoffContextUpdateContractAuthorityProfile,
  type HandoffContextUpdateContractNoHandoffApply,
  type HandoffContextUpdateContractNoSideEffects,
  type HandoffContextUpdateContractRecord,
  type HandoffContextUpdateContractReceipt,
  type HandoffContextUpdateContractStoreResult,
  type HandoffContextUpdateContractWriteAuthorityBoundary,
  type HandoffContextUpdateContractWriteInput,
  type HandoffContextUpdateContractWriteStatus,
  type HandoffContextUpdateContractWriteValidation,
} from "@/types/handoff-context-update-contract-write";

export const HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_TABLE =
  "handoff_context_update_contract_records" as const;

export interface HandoffContextUpdateContractWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffContextUpdateContractWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface HandoffContextUpdateContractWriteRow {
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
  input: HandoffContextUpdateContractWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_handoff_context_update_contract_record",
  "can_create_handoff_context_update_contract_receipt",
  "handoff_context_update_contract_record_written",
  "handoff_context_update_contract_receipt_written",
  "handoff_context_update_contract_persisted",
  "handoff_context_update_contract_written",
]);

const forbiddenRequestedSideEffectPatterns = [
  /handoff.*(apply|send|mutate|update|live|selected.*refs)/i,
  /selected.*refs.*live.*handoff/i,
  /api.*perspective.*current|route.*(modify|replace|mutate|write)/i,
  /current.*working.*perspective.*(source.*table|upstream|snapshot.*write|apply.*record|update.*contract|route.*integration)/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay|live.*relay/i,
  /memory/i,
  /global.*metric|dogfood.*metrics|update.*metrics|metric.*snapshot/i,
  /reuse.*outcome|reuse.*ledger/i,
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

export const handoffContextUpdateContractWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_context_update_contract_records (
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

CREATE INDEX IF NOT EXISTS idx_handoff_context_update_contract_records_scope_created
  ON handoff_context_update_contract_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_context_update_contract_records_operator
  ON handoff_context_update_contract_records(scope, operator_ref, created_at, record_id);
`;

export function ensureHandoffContextUpdateContractWriteSchemaV01(
  db: HandoffContextUpdateContractWriteDbLike,
): void {
  db.exec(handoffContextUpdateContractWriteSchemaSqlV01);
}

export function handoffContextUpdateContractWriteSchemaExistsV01(
  db: HandoffContextUpdateContractWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_TABLE;
}

export function validateHandoffContextUpdateContractWriteInputV01(
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
    "would_write_handoff_context_update_contract_decision_preview",
  );
  const contractPreview = getRecord(decisionMaterial, "contract_preview");
  const recordMaterial = getRecord(
    contractPreview,
    "would_write_handoff_context_update_contract_record_preview",
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
        ? (input as unknown as HandoffContextUpdateContractWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeHandoffContextUpdateContractRecordV01(
  input: unknown,
  options: { db: HandoffContextUpdateContractWriteDbLike },
): HandoffContextUpdateContractStoreResult {
  const validation = validateHandoffContextUpdateContractWriteInputV01(input);
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

  ensureHandoffContextUpdateContractWriteSchemaV01(options.db);
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: HandoffContextUpdateContractWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readHandoffContextUpdateContractRecordByIdempotencyKeyV01(
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
        `INSERT INTO handoff_context_update_contract_records (
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

export function refuseHandoffContextUpdateContractWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): HandoffContextUpdateContractStoreResult {
  const validation = validateHandoffContextUpdateContractWriteInputV01(input);
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

export function readHandoffContextUpdateContractRecordByIdV01(
  recordId: string,
  options: { db: HandoffContextUpdateContractWriteDbLike },
): HandoffContextUpdateContractStoreResult {
  if (!handoffContextUpdateContractWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_update_contract_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE) as
    | HandoffContextUpdateContractWriteRow
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

export function readHandoffContextUpdateContractRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: HandoffContextUpdateContractWriteDbLike },
): HandoffContextUpdateContractStoreResult {
  if (!handoffContextUpdateContractWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_update_contract_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE) as
    | HandoffContextUpdateContractWriteRow
    | undefined;
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

export function listHandoffContextUpdateContractRecordsV01(
  options: { db: HandoffContextUpdateContractWriteDbLike } &
    HandoffContextUpdateContractWriteListOptions,
): HandoffContextUpdateContractStoreResult {
  if (!handoffContextUpdateContractWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE];
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
      `SELECT * FROM handoff_context_update_contract_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as HandoffContextUpdateContractWriteRow[];
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

export function createHandoffContextUpdateContractWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): HandoffContextUpdateContractWriteAuthorityBoundary {
  return {
    durable_local_handoff_context_update_contract: true,
    source_of_truth: false,
    local_project_handoff_context_update_contract_only: true,
    can_write_db: writeNow,
    can_create_handoff_context_update_contract_record: writeNow,
    can_create_handoff_context_update_contract_receipt: writeNow,
    can_apply_handoff_context_update: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
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
      "Authority is limited to one scoped local Handoff Context update contract record and receipt.",
      "This writer cannot apply or send handoff, write selected refs to live handoff, mutate CWP route state, write scoped CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["operator_decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    HANDOFF_CONTEXT_UPDATE_CONTRACT_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (preview.scope !== HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE) {
    reasons.push("operator_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_handoff_context_update_contract_record_write"
  ) {
    reasons.push("operator_decision_preview_not_ready_for_handoff_context_update_contract_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_handoff_context_update_contract_record"
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
    "would_write_handoff_context_update_contract_decision_preview",
  );
  if (!decisionMaterial) {
    reasons.push("operator_decision_preview_write_material_missing");
  } else {
    const contractPreview = getRecord(decisionMaterial, "contract_preview");
    reasons.push(...validateContractPreview(contractPreview));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyDecisionAuthority(authority)) {
    reasons.push("operator_decision_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateContractPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["handoff_context_update_contract_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION) {
    reasons.push("handoff_context_update_contract_preview_version_invalid");
  }
  if (
    preview.contract_preview_status !==
    "ready_for_future_handoff_context_update_contract_record_write"
  ) {
    reasons.push("handoff_context_update_contract_preview_not_ready");
  }
  const readiness = getRecord(preview, "contract_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("handoff_context_update_contract_preview_readiness_invalid");
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_context_update_contract_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("handoff_context_update_contract_record_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyContractPreviewAuthority(authority)) {
    reasons.push("handoff_context_update_contract_preview_authority_boundary_invalid");
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
    "approve_for_handoff_context_update_contract_record"
  ) {
    reasons.push("operator_approval_decision_invalid");
  }
  for (const key of [
    "approved_by",
    "operator_ref",
    "approved_at",
    "approval_statement",
  ]) {
    if (!safeRef(approval[key])) reasons.push(`operator_approval_${key}_invalid`);
  }
  if (
    typeof decisionMaterial?.requested_operator_ref === "string" &&
    approval.operator_ref !== decisionMaterial.requested_operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }
  if (
    !Array.isArray(approval.checklist_confirmations) ||
    approval.checklist_confirmations.length === 0 ||
    !approval.checklist_confirmations.every((entry) => safeRef(entry))
  ) {
    reasons.push("operator_approval_checklist_confirmations_invalid");
  }
  return reasons;
}

function validateRecordMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const sourceRefs = safeStringArray(material.source_refs);
  const evidenceRefs = safeStringArray(material.evidence_refs);
  const contract = getRecord(material, "proposed_handoff_context_update_contract");
  const entries = Array.isArray(material.proposed_handoff_context_entries)
    ? material.proposed_handoff_context_entries
    : [];
  if (material.record_version !== HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION) {
    reasons.push("handoff_context_update_contract_record_version_invalid");
  }
  if (material.scope !== HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE) {
    reasons.push("handoff_context_update_contract_record_scope_invalid");
  }
  if (!safeRef(material.requested_operator_ref)) {
    reasons.push("handoff_context_update_contract_operator_ref_invalid");
  }
  if (!safeRef(material.requested_idempotency_key)) {
    reasons.push("handoff_context_update_contract_idempotency_key_invalid");
  }
  if (!safeRef(material.review_confirmation_ref)) {
    reasons.push("handoff_context_update_contract_review_confirmation_invalid");
  }
  if (sourceRefs.length === 0 || sourceRefs.some((ref) => !safeRef(ref))) {
    reasons.push("handoff_context_update_contract_source_refs_invalid");
  }
  if (evidenceRefs.length === 0 || evidenceRefs.some((ref) => !safeRef(ref))) {
    reasons.push("handoff_context_update_contract_evidence_refs_invalid");
  }
  if (!contract || contract.contract_kind !== "handoff_context_update_contract.v0.1") {
    reasons.push("handoff_context_update_contract_material_invalid");
  }
  if (
    !contract ||
    !Array.isArray(contract.proposed_handoff_context_entries) ||
    contract.proposed_handoff_context_entries.length === 0
  ) {
    reasons.push("handoff_context_update_contract_entries_missing");
  }
  if (
    entries.length === 0 ||
    entries.some((entry) => !isValidHandoffEntry(entry))
  ) {
    reasons.push("handoff_context_update_contract_entries_invalid");
  }
  if (!safeRef(material.source_route_integration_read_ref)) {
    reasons.push("source_route_integration_read_ref_missing");
  }
  if (!safeRef(material.source_runtime_current_working_perspective_ref)) {
    reasons.push("source_runtime_current_working_perspective_ref_missing");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildRecord(
  validation: ValidationResult & {
    ok: true;
    input: HandoffContextUpdateContractWriteInput;
    idempotency_key: string;
  },
): HandoffContextUpdateContractRecord {
  const decision = validation.input.operator_decision_preview;
  const decisionMaterial =
    decision.would_write_handoff_context_update_contract_decision_preview;
  const preview = decisionMaterial.contract_preview;
  if (!preview) {
    throw new Error("handoff context update contract preview missing after validation");
  }
  const material =
    preview.would_write_handoff_context_update_contract_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const recordSeed = {
    version: HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    operator_ref: validation.input.operator_approval.operator_ref,
    material,
    notes: validation.input.notes ?? [],
  };
  const recordFingerprint = hashStable(recordSeed);
  const recordId = `handoff-context-update-contract:${recordFingerprint.slice(0, 24)}`;
  const proposedContract = material.proposed_handoff_context_update_contract;
  const proposedEntries = material.proposed_handoff_context_entries;
  if (!proposedContract) {
    throw new Error("handoff context update contract material missing after validation");
  }
  return {
    record_version: HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_route_integration_read_ref: material.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      material.source_runtime_current_working_perspective_ref,
    source_applied_snapshot_ref: material.source_applied_snapshot_ref,
    source_route_integration_contract_record_refs:
      material.source_route_integration_contract_record_refs,
    source_cwp_apply_record_refs: material.source_cwp_apply_record_refs,
    source_continuity_relay_record_refs:
      material.source_continuity_relay_record_refs,
    source_perspective_unit_record_refs:
      material.source_perspective_unit_record_refs,
    source_next_work_bias_record_refs: material.source_next_work_bias_record_refs,
    proposed_handoff_context_update_contract: proposedContract,
    proposed_handoff_context_entries: proposedEntries,
    proposed_handoff_context_entry_count: proposedEntries.length,
    proposed_handoff_section_counts: countBy(
      proposedEntries.map((entry) => entry.handoff_section),
    ),
    authority_profile: createAuthorityProfile(),
    review_status: "recorded_as_scoped_handoff_context_update_contract",
    persistence_horizon: "local_project_handoff_context_update_contract_store",
    no_handoff_apply_performed: createNoHandoffApply(),
    write_validation: createWriteValidation(recordFingerprint),
    authority_boundary:
      createHandoffContextUpdateContractWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: validation.input.notes ?? [],
    record_fingerprint: recordFingerprint,
  };
}

function createReceipt({
  validation,
  wrote,
  refused,
  idempotentReplay,
  record,
}: {
  validation: Pick<ValidationResult, "idempotency_key" | "refusal_reasons">;
  wrote: boolean;
  refused: boolean;
  idempotentReplay: boolean;
  record: HandoffContextUpdateContractRecord | null;
}): HandoffContextUpdateContractReceipt {
  const validationHash =
    validation.refusal_reasons.length > 0
      ? null
      : hashStable({
          idempotency_key: validation.idempotency_key,
          record_fingerprint: record?.record_fingerprint ?? null,
        });
  return {
    receipt_version: HANDOFF_CONTEXT_UPDATE_CONTRACT_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key ?? null,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: new Date().toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: validationHash,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? `handoff-context-update-contract-store:${record.record_id}` : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function storeResult(
  status: HandoffContextUpdateContractWriteStatus,
  record: HandoffContextUpdateContractRecord | null,
  records: HandoffContextUpdateContractRecord[],
  receipt: HandoffContextUpdateContractReceipt,
): HandoffContextUpdateContractStoreResult {
  return {
    store_version: HANDOFF_CONTEXT_UPDATE_CONTRACT_STORE_VERSION,
    scope: HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
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

function createRefusedReceipt(
  reasons: string[],
  idempotencyKey: string | null,
): HandoffContextUpdateContractReceipt {
  return createReceipt({
    validation: { idempotency_key: idempotencyKey, refusal_reasons: reasons },
    wrote: false,
    refused: reasons.length > 0,
    idempotentReplay: false,
    record: null,
  });
}

function createAuthorityProfile(): HandoffContextUpdateContractAuthorityProfile {
  return {
    durable_local_handoff_context_update_contract: true,
    source_of_truth: false,
    local_project_handoff_context_update_contract_only: true,
    persistence_horizon: "local_project_handoff_context_update_contract_store",
    handoff_context_update_contract_written: true,
    handoff_context_update_applied: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    current_working_perspective_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  };
}

function createNoHandoffApply(): HandoffContextUpdateContractNoHandoffApply {
  return {
    handoff_context_updated: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
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

function createNoSideEffects(wrote: boolean): HandoffContextUpdateContractNoSideEffects {
  return {
    ...createNoHandoffApply(),
    handoff_context_update_contract_record_written: wrote,
    handoff_context_update_contract_receipt_written: wrote,
    handoff_context_update_contract_persisted: wrote,
    handoff_context_update_contract_written: wrote,
  };
}

function createWriteValidation(
  recordFingerprint: string,
): HandoffContextUpdateContractWriteValidation {
  return {
    validation_version: "handoff_context_update_contract_write_validation.v0.1",
    operator_decision_preview_revalidated: true,
    handoff_context_update_contract_revalidated: true,
    handoff_context_entries_revalidated: true,
    refused_sample_fixture_default_or_smoke_material: false,
    refused_unrequested_side_effects: false,
    refused_handoff_apply_or_send: false,
    refused_metric_or_upstream_write: false,
    validation_hash: hashStable({
      record_fingerprint: recordFingerprint,
      scope: HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
    }),
  };
}

function rowToRecord(
  row: HandoffContextUpdateContractWriteRow,
): HandoffContextUpdateContractRecord {
  return JSON.parse(row.record_json) as HandoffContextUpdateContractRecord;
}

function rowToReceipt(
  row: HandoffContextUpdateContractWriteRow,
): HandoffContextUpdateContractReceipt {
  return JSON.parse(row.receipt_json) as HandoffContextUpdateContractReceipt;
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: HandoffContextUpdateContractWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  const uniqueReasons = uniqueCandidateIngressStringsV01(refusal_reasons);
  return {
    ok: uniqueReasons.length === 0,
    refusal_reasons: uniqueReasons,
    input,
    idempotency_key,
  };
}

function hasReadOnlyDecisionAuthority(value: Record<string, unknown>): boolean {
  return expectedFalseAuthority(value, [
    "can_write_db",
    "can_create_handoff_context_update_contract_record",
    "can_apply_handoff_context_update",
    "can_mutate_handoff_context",
    "can_send_handoff",
    "can_write_selected_refs_to_live_handoff",
    "can_modify_api_perspective_current_route",
    "can_replace_current_working_perspective_route_response",
    "can_update_upstream_current_working_perspective_source_tables",
    "can_write_applied_current_working_perspective_snapshot",
    "can_write_current_working_perspective_apply_record",
    "can_write_current_working_perspective_update_contract_record",
    "can_write_route_integration_contract_record",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_write_continuity_relay",
    "can_update_continuity_relay",
    "can_apply_live_relay_state",
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
  ]);
}

function hasReadOnlyContractPreviewAuthority(value: Record<string, unknown>): boolean {
  return (
    value.read_only === true &&
    value.advisory_only === true &&
    value.contract_material_only === true &&
    value.source_of_truth === false &&
    hasReadOnlyDecisionAuthority(value)
  );
}

function expectedFalseAuthority(
  value: Record<string, unknown>,
  keys: string[],
): boolean {
  return keys.every((key) => value[key] === false);
}

function isValidHandoffEntry(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    safeRef(value.entry_ref) !== null &&
    typeof value.handoff_section === "string" &&
    typeof value.entry_kind === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.source_record_refs) &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    value.authority_required === "future_handoff_context_apply" &&
    value.persistence_horizon === "handoff_context_update_contract_record"
  );
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, requested] of Object.entries(value)) {
    if (!allowedRequestedSideEffectKeys.has(key)) {
      reasons.push(`forbidden_requested_side_effect:${key}`);
    }
    if (
      requested === true &&
      forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))
    ) {
      reasons.push(`forbidden_requested_side_effect:${key}`);
    }
  }
  return reasons;
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || !safeRef(entry))
  ) {
    return ["notes_invalid"];
  }
  return [];
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  const haystack = stableStringify(value).toLowerCase();
  return sampleDefaultOrSmokeMarkers.some((marker) => haystack.includes(marker));
}

function containsRawOrPrivateMarkers(
  value: unknown,
  seen = new Set<unknown>(),
): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return containsCandidateIngressUnsafeMarkerV01(value);
  }
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsRawOrPrivateMarkers(entry, seen));
  }
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => {
    const normalized = key.toLowerCase();
    return (
      ["raw_text", "raw_report", "raw_excerpt"].includes(normalized) ||
      normalized.includes("private") ||
      normalized.includes("secret") ||
      normalized.includes("token") ||
      normalized.includes("password") ||
      containsRawOrPrivateMarkers(nested, seen)
    );
  });
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.length > 0 &&
    isCandidateIngressPublicSafeRefV01(value)
    ? value
    : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function getRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
