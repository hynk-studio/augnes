import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_DECISION_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview,
} from "@/types/current-working-perspective-route-integration-contract-decision";
import { CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION } from "@/types/current-working-perspective-route-integration-contract-preview";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECEIPT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION,
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_STORE_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationContractAuthorityProfile,
  type CurrentWorkingPerspectiveRouteIntegrationContractNoRouteChange,
  type CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecord,
  type CurrentWorkingPerspectiveRouteIntegrationContractReceipt,
  type CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
  type CurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundary,
  type CurrentWorkingPerspectiveRouteIntegrationContractWriteInput,
  type CurrentWorkingPerspectiveRouteIntegrationContractWriteStatus,
  type CurrentWorkingPerspectiveRouteIntegrationContractWriteValidation,
} from "@/types/current-working-perspective-route-integration-contract-write";

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_WRITE_TABLE =
  "current_working_perspective_route_integration_contract_records" as const;

export interface CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface CurrentWorkingPerspectiveRouteIntegrationContractWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface CurrentWorkingPerspectiveRouteIntegrationContractWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  record_fingerprint: string;
  route_integration_mode: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: CurrentWorkingPerspectiveRouteIntegrationContractWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_current_working_perspective_route_integration_contract_record",
  "can_create_current_working_perspective_route_integration_contract_receipt",
  "current_working_perspective_route_integration_contract_record_written",
  "current_working_perspective_route_integration_contract_receipt_written",
  "current_working_perspective_route_integration_contract_persisted",
  "current_working_perspective_route_integration_contract_written",
]);

const forbiddenRequestedSideEffectPatterns = [
  /api.*perspective.*current.*(modify|replace|write|mutate|integrate)/i,
  /route.*(modify|replace|mutate|write|apply)/i,
  /current.*working.*perspective.*(source.*table|upstream|live|mutate|update)/i,
  /applied.*snapshot.*write|apply.*record.*write|update.*contract.*record.*write/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay/i,
  /live.*relay/i,
  /handoff/i,
  /memory/i,
  /global.*metric|dogfood.*metrics|update.*metrics/i,
  /metric.*snapshot/i,
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

export const currentWorkingPerspectiveRouteIntegrationContractWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS current_working_perspective_route_integration_contract_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  route_integration_mode TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_cwp_route_integration_contract_records_scope_created
  ON current_working_perspective_route_integration_contract_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_cwp_route_integration_contract_records_operator
  ON current_working_perspective_route_integration_contract_records(scope, operator_ref, created_at, record_id);
`;

export function ensureCurrentWorkingPerspectiveRouteIntegrationContractWriteSchemaV01(
  db: CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike,
): void {
  db.exec(currentWorkingPerspectiveRouteIntegrationContractWriteSchemaSqlV01);
}

export function currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
  db: CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return (
    row?.name ===
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_WRITE_TABLE
  );
}

export function validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
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
    "would_write_current_working_perspective_route_integration_contract_decision_preview",
  );
  const contractPreview = getRecord(decisionMaterial, "contract_preview");
  const recordMaterial = getRecord(
    contractPreview,
    "would_write_current_working_perspective_route_integration_contract_record_preview",
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
        ? (input as unknown as CurrentWorkingPerspectiveRouteIntegrationContractWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
  input: unknown,
  options: { db: CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike },
): CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  const validation =
    validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(input);
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

  ensureCurrentWorkingPerspectiveRouteIntegrationContractWriteSchemaV01(
    options.db,
  );
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: CurrentWorkingPerspectiveRouteIntegrationContractWriteInput;
      idempotency_key: string;
    },
  );
  const existing =
    readCurrentWorkingPerspectiveRouteIntegrationContractRecordByIdempotencyKeyV01(
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
        `INSERT INTO current_working_perspective_route_integration_contract_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          route_integration_mode,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.record_fingerprint,
        record.route_integration_mode,
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

export function refuseCurrentWorkingPerspectiveRouteIntegrationContractWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  const validation =
    validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(input);
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

export function readCurrentWorkingPerspectiveRouteIntegrationContractRecordByIdV01(
  recordId: string,
  options: { db: CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike },
): CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  if (
    !currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
      options.db,
    )
  ) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_route_integration_contract_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(
      recordId,
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
    ) as CurrentWorkingPerspectiveRouteIntegrationContractWriteRow | undefined;
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

export function readCurrentWorkingPerspectiveRouteIntegrationContractRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike },
): CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  if (
    !currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
      options.db,
    )
  ) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM current_working_perspective_route_integration_contract_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(
      idempotencyKey,
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
    ) as CurrentWorkingPerspectiveRouteIntegrationContractWriteRow | undefined;
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

export function listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01(
  options: { db: CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike } &
    CurrentWorkingPerspectiveRouteIntegrationContractWriteListOptions,
): CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  if (
    !currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
      options.db,
    )
  ) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
  ];
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
      `SELECT * FROM current_working_perspective_route_integration_contract_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as CurrentWorkingPerspectiveRouteIntegrationContractWriteRow[];
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

export function createCurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): CurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundary {
  return {
    durable_local_current_working_perspective_route_integration_contract: true,
    source_of_truth: false,
    local_project_current_working_perspective_route_integration_contract_only:
      true,
    can_write_db: writeNow,
    can_create_current_working_perspective_route_integration_contract_record:
      writeNow,
    can_create_current_working_perspective_route_integration_contract_receipt:
      writeNow,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
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
      "Authority is limited to one scoped local CurrentWorkingPerspective route integration contract record and receipt.",
      "This writer cannot modify /api/perspective/current, replace route responses, mutate upstream CWP source tables, write applied snapshots, apply records, update contract records, handoff, memory, metrics, or external systems.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["operator_decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (preview.scope !== CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE) {
    reasons.push("operator_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_current_working_perspective_route_integration_contract_record_write"
  ) {
    reasons.push(
      "operator_decision_preview_not_ready_for_route_integration_contract_record_write",
    );
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_current_working_perspective_route_integration_contract_record"
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
    "would_write_current_working_perspective_route_integration_contract_decision_preview",
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
  if (!preview) return ["route_integration_contract_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION
  ) {
    reasons.push("route_integration_contract_preview_version_invalid");
  }
  if (
    preview.contract_preview_status !==
    "ready_for_future_current_working_perspective_route_integration_contract_record_write"
  ) {
    reasons.push("route_integration_contract_preview_not_ready");
  }
  const readiness = getRecord(preview, "contract_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("route_integration_contract_preview_readiness_invalid");
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyPreviewAuthority(authority)) {
    reasons.push("route_integration_contract_preview_authority_boundary_invalid");
  }
  const contract = getRecord(
    preview,
    "proposed_current_working_perspective_route_integration_contract",
  );
  if (!contract) {
    reasons.push("proposed_route_integration_contract_missing");
  } else {
    reasons.push(...validateProposedContract(contract));
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_current_working_perspective_route_integration_contract_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("route_integration_contract_record_preview_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  return reasons;
}

function validateRecordMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (
    material.proposed_record_kind !==
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION
  ) {
    reasons.push("proposed_record_kind_invalid");
  }
  if (
    material.proposed_receipt_kind !==
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECEIPT_VERSION
  ) {
    reasons.push("proposed_receipt_kind_invalid");
  }
  if (
    material.proposed_store_kind !==
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_STORE_VERSION
  ) {
    reasons.push("proposed_store_kind_invalid");
  }
  if (material.route_path !== "/api/perspective/current") {
    reasons.push("route_path_invalid");
  }
  if (material.route_family !== "current_working_perspective") {
    reasons.push("route_family_invalid");
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
  const contract = getRecord(material, "proposed_route_integration_contract");
  if (!contract) {
    reasons.push("proposed_route_integration_contract_missing");
  } else {
    reasons.push(...validateProposedContract(contract));
  }
  const mode = material.route_integration_mode;
  if (
    ![
      "runtime_only_with_applied_snapshot_hint",
      "applied_snapshot_overlay_candidate",
      "applied_snapshot_preferred_with_runtime_fallback",
    ].includes(String(mode))
  ) {
    reasons.push("route_integration_mode_invalid");
  }
  const applyRecordRefs = safeStringArray(material.source_cwp_apply_record_refs);
  if (applyRecordRefs.length === 0) {
    reasons.push("source_cwp_apply_record_refs_missing");
  }
  if (applyRecordRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("source_cwp_apply_record_refs_unsafe");
  }
  if (applyRecordRefs.some((ref) => !isCwpApplyRecordRef(ref))) {
    reasons.push("source_cwp_apply_record_refs_not_apply_records");
  }
  if (!safeRef(material.source_applied_snapshot_ref)) {
    reasons.push("source_applied_snapshot_ref_missing_or_invalid");
  }
  return reasons;
}

function validateProposedContract(contract: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (
    contract.contract_kind !==
    "current_working_perspective_route_integration_contract.v0.1"
  ) {
    reasons.push("contract_kind_invalid");
  }
  if (contract.route_path !== "/api/perspective/current") {
    reasons.push("contract_route_path_invalid");
  }
  if (contract.route_family !== "current_working_perspective") {
    reasons.push("contract_route_family_invalid");
  }
  if (contract.route_version_before !== "perspective.current.v0.1") {
    reasons.push("contract_route_version_before_invalid");
  }
  const mode = String(contract.requested_route_integration_mode ?? "");
  if (
    ![
      "runtime_only_with_applied_snapshot_hint",
      "applied_snapshot_overlay_candidate",
      "applied_snapshot_preferred_with_runtime_fallback",
    ].includes(mode)
  ) {
    reasons.push("contract_route_integration_mode_invalid");
  }
  if (!safeRef(contract.current_runtime_cwp_ref)) {
    reasons.push("contract_current_runtime_cwp_ref_missing_or_invalid");
  }
  if (!safeRef(contract.applied_snapshot_ref)) {
    reasons.push("contract_applied_snapshot_ref_missing_or_invalid");
  }
  const contractApplyRecordRef =
    typeof contract.applied_snapshot_source_apply_record_ref === "string"
      ? contract.applied_snapshot_source_apply_record_ref
      : null;
  if (!contractApplyRecordRef || !safeRef(contractApplyRecordRef)) {
    reasons.push("contract_applied_snapshot_source_apply_record_ref_missing_or_invalid");
  } else if (!isCwpApplyRecordRef(contractApplyRecordRef)) {
    reasons.push(
      "contract_applied_snapshot_source_apply_record_ref_not_apply_record",
    );
  }
  const guards = getRecord(contract, "route_integration_guards");
  if (!guards || Object.values(guards).some((value) => value !== true)) {
    reasons.push("contract_route_integration_guards_invalid");
  }
  if (!isRecord(contract.proposed_future_route_behavior)) {
    reasons.push("contract_future_route_behavior_missing");
  }
  if (!isRecord(contract.proposed_response_contract)) {
    reasons.push("contract_response_contract_missing");
  }
  if (safeStringArray(contract.future_implementation_requirements).length === 0) {
    reasons.push("contract_future_implementation_requirements_missing");
  }
  if (safeStringArray(contract.rollback_and_fallback_plan).length === 0) {
    reasons.push("contract_rollback_and_fallback_plan_missing");
  }
  return reasons;
}

function isCwpApplyRecordRef(ref: string): boolean {
  return (
    ref.startsWith("current-working-perspective-apply:") &&
    !ref.includes("cwp-update-contract") &&
    !ref.includes("current-working-perspective-update-contract")
  );
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
    "approve_for_current_working_perspective_route_integration_contract_record"
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
    input: CurrentWorkingPerspectiveRouteIntegrationContractWriteInput;
    idempotency_key: string;
  },
): CurrentWorkingPerspectiveRouteIntegrationContractRecord {
  const decisionPreview = validation.input.operator_decision_preview;
  const decisionMaterial =
    decisionPreview
      .would_write_current_working_perspective_route_integration_contract_decision_preview;
  const contractPreview = decisionMaterial
    .contract_preview as CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview["would_write_current_working_perspective_route_integration_contract_decision_preview"]["contract_preview"] &
    Record<string, any>;
  const recordMaterial =
    contractPreview
      .would_write_current_working_perspective_route_integration_contract_record_preview;
  const contract = recordMaterial.proposed_route_integration_contract as NonNullable<
    typeof recordMaterial.proposed_route_integration_contract
  >;
  const routeIntegrationMode = recordMaterial.route_integration_mode as NonNullable<
    typeof recordMaterial.route_integration_mode
  >;
  const createdAt = validation.input.operator_approval.approved_at;
  const guardKeys = Object.entries(contract.route_integration_guards)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
  const base = {
    record_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: recordMaterial.source_refs,
    evidence_refs: recordMaterial.evidence_refs,
    route_path: "/api/perspective/current" as const,
    route_family: "current_working_perspective" as const,
    source_runtime_current_working_perspective_ref:
      recordMaterial.source_runtime_current_working_perspective_ref,
    source_applied_snapshot_ref: recordMaterial.source_applied_snapshot_ref,
    source_cwp_apply_record_refs:
      recordMaterial.source_cwp_apply_record_refs ?? [],
    source_cwp_update_contract_record_refs:
      recordMaterial.source_cwp_update_contract_record_refs ?? [],
    proposed_current_working_perspective_route_integration_contract: contract,
    route_integration_mode: routeIntegrationMode,
    route_integration_guard_summary: {
      enabled_guard_count: guardKeys.length,
      guard_keys: guardKeys,
    },
    proposed_response_contract: contract.proposed_response_contract,
    future_implementation_requirements:
      contract.future_implementation_requirements,
    rollback_and_fallback_plan: contract.rollback_and_fallback_plan,
    authority_profile: {
      durable_local_current_working_perspective_route_integration_contract:
        true,
      source_of_truth: false,
      local_project_current_working_perspective_route_integration_contract_only:
        true,
      persistence_horizon:
        "local_project_current_working_perspective_route_integration_contract_store",
      current_working_perspective_route_integration_contract_written: true,
      api_perspective_current_route_modified: false,
      current_working_perspective_route_response_replaced: false,
      upstream_current_working_perspective_source_tables_mutated: false,
      applied_current_working_perspective_snapshot_written: false,
      current_working_perspective_apply_record_written: false,
      current_working_perspective_update_contract_record_written: false,
      perspective_unit_write_performed: false,
      next_work_bias_write_performed: false,
      continuity_relay_write_performed: false,
      continuity_relay_update_performed: false,
      handoff_context_mutation_performed: false,
      memory_promotion_performed: false,
      metric_update_performed: false,
    } satisfies CurrentWorkingPerspectiveRouteIntegrationContractAuthorityProfile,
    review_status:
      "recorded_as_scoped_current_working_perspective_route_integration_contract" as const,
    persistence_horizon:
      "local_project_current_working_perspective_route_integration_contract_store" as const,
    no_route_change_performed: createNoRouteChange(),
    write_validation: {
      validation_version:
        "current_working_perspective_route_integration_contract_write_validation.v0.1" as const,
      operator_decision_preview_revalidated: true,
      route_integration_contract_revalidated: true,
      route_guard_summary_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_route_replacement_or_upstream_cwp_mutation: false,
      refused_metric_or_upstream_write: false,
      validation_hash: validationHash(validation.refusal_reasons),
    } satisfies CurrentWorkingPerspectiveRouteIntegrationContractWriteValidation,
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundaryV01(
        { writeNow: true },
      ),
    notes: validation.input.notes ?? [],
  };
  const recordFingerprint = recordFingerprintFor(base);
  return {
    ...base,
    record_id: `current-working-perspective-route-integration-contract:${recordFingerprint.slice(
      0,
      24,
    )}`,
    record_fingerprint: recordFingerprint,
  };
}

function createNoRouteChange():
  CurrentWorkingPerspectiveRouteIntegrationContractNoRouteChange {
  return {
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
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

function createNoSideEffects(
  wrote: boolean,
): CurrentWorkingPerspectiveRouteIntegrationContractNoSideEffects {
  return {
    current_working_perspective_route_integration_contract_record_written:
      wrote,
    current_working_perspective_route_integration_contract_receipt_written:
      wrote,
    current_working_perspective_route_integration_contract_persisted: wrote,
    current_working_perspective_route_integration_contract_written: wrote,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
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
  record: CurrentWorkingPerspectiveRouteIntegrationContractRecord | null;
}): CurrentWorkingPerspectiveRouteIntegrationContractReceipt {
  return {
    receipt_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key:
      validation.idempotency_key ?? record?.idempotency_key ?? null,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: record?.created_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: uniqueCandidateIngressStringsV01(
      validation.refusal_reasons,
    ),
    validation_hash:
      validation.refusal_reasons.length > 0
        ? validationHash(validation.refusal_reasons)
        : record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record
      ? `current-working-perspective-route-integration-contract-store:${record.scope}`
      : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function createRefusedReceipt(
  reasons: string[],
  idempotencyKey: string | null,
): CurrentWorkingPerspectiveRouteIntegrationContractReceipt {
  return createReceipt({
    validation: {
      idempotency_key: idempotencyKey,
      refusal_reasons: reasons,
    },
    wrote: false,
    refused: reasons.length > 0,
    idempotentReplay: false,
    record: null,
  });
}

function storeResult(
  status: CurrentWorkingPerspectiveRouteIntegrationContractWriteStatus,
  record: CurrentWorkingPerspectiveRouteIntegrationContractRecord | null,
  records: CurrentWorkingPerspectiveRouteIntegrationContractRecord[],
  receipt: CurrentWorkingPerspectiveRouteIntegrationContractReceipt,
): CurrentWorkingPerspectiveRouteIntegrationContractStoreResult {
  return {
    store_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_STORE_VERSION,
    scope: CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_SCOPE,
    status,
    ok:
      status === "written" ||
      status === "idempotent_existing" ||
      status === "read" ||
      status === "listed",
    record,
    records,
    receipt,
    error_code:
      status === "refused" ||
      status === "not_found" ||
      status === "schema_missing"
        ? status
        : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: CurrentWorkingPerspectiveRouteIntegrationContractWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  const unique = uniqueCandidateIngressStringsV01(refusal_reasons);
  return {
    ok: unique.length === 0,
    refusal_reasons: unique,
    input,
    idempotency_key,
  };
}

function rowToRecord(
  row: CurrentWorkingPerspectiveRouteIntegrationContractWriteRow,
): CurrentWorkingPerspectiveRouteIntegrationContractRecord {
  return JSON.parse(row.record_json) as CurrentWorkingPerspectiveRouteIntegrationContractRecord;
}

function rowToReceipt(
  row: CurrentWorkingPerspectiveRouteIntegrationContractWriteRow,
): CurrentWorkingPerspectiveRouteIntegrationContractReceipt {
  return JSON.parse(row.receipt_json) as CurrentWorkingPerspectiveRouteIntegrationContractReceipt;
}

function hasReadOnlyDecisionAuthority(authority: Record<string, unknown>): boolean {
  return (
    authority.read_only === true &&
    authority.advisory_only === true &&
    authority.operator_decision_preview_only === true &&
    falseOnlyAuthorityFields.every((field) => authority[field] === false)
  );
}

function hasReadOnlyPreviewAuthority(authority: Record<string, unknown>): boolean {
  return (
    authority.read_only === true &&
    authority.advisory_only === true &&
    authority.contract_material_only === true &&
    falseOnlyAuthorityFields.every((field) => authority[field] === false)
  );
}

const falseOnlyAuthorityFields = [
  "source_of_truth",
  "can_write_db",
  "can_create_current_working_perspective_route_integration_contract_record",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_mutate_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
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
] as const;

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const reasons: string[] = [];
  for (const [key, requested] of Object.entries(value)) {
    if (requested !== true) continue;
    if (allowedRequestedSideEffectKeys.has(key)) continue;
    if (forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))) {
      reasons.push(`forbidden_requested_side_effect:${key}`);
    } else {
      reasons.push(`unsupported_requested_side_effect:${key}`);
    }
  }
  return reasons;
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawOrPrivateMarkers);
  if (typeof value === "string") {
    return (
      containsCandidateIngressUnsafeMarkerV01(value) ||
      /(^|[:=])(token|secret|password|private|credential)\b/i.test(value)
    );
  }
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    if (/raw_text|raw_report|raw_excerpt/i.test(key)) return true;
    if (
      typeof entry === "string" &&
      (containsCandidateIngressUnsafeMarkerV01(entry) ||
        /(^|[:=])(token|secret|password|private|credential)\b/i.test(entry))
    ) {
      return true;
    }
    return containsRawOrPrivateMarkers(entry);
  });
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSampleDefaultOrSmokeMaterial);
  if (!isRecord(value)) {
    return (
      typeof value === "string" &&
      sampleDefaultOrSmokeMarkers.some((marker) =>
        value.toLowerCase().includes(marker),
      )
    );
  }
  return Object.values(value).some(containsSampleDefaultOrSmokeMaterial);
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ["notes_must_be_array"];
  if (value.some((item) => typeof item !== "string")) return ["notes_malformed"];
  if (value.some((item) => containsCandidateIngressUnsafeMarkerV01(item))) {
    return ["notes_unsafe"];
  }
  return [];
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

function getRecord(
  value: unknown,
  key: string,
): Record<string, any> | null {
  if (!isRecord(value)) return null;
  const child = value[key];
  return isRecord(child) ? child : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function recordFingerprintFor(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableJson(value)))
    .digest("hex");
}

function validationHash(reasons: string[]): string {
  return recordFingerprintFor(uniqueCandidateIngressStringsV01(reasons));
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableJson(entry)]),
  );
}
