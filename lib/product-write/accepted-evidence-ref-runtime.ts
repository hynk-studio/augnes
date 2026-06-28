import { createHash } from "node:crypto";

import {
  acceptedEvidenceRefStoreSchemaExistsV01,
  ensureAcceptedEvidenceRefStoreSchemaV01,
  listAcceptedEvidenceRefRecordsV01,
  readAcceptedEvidenceRefRecordByIdempotencyKeyV01,
  readAcceptedEvidenceRefRecordV01,
  writeAcceptedEvidenceRefRecordV01,
  type ProductWriteAcceptedEvidenceRefDbLike,
} from "./accepted-evidence-ref-store";
import {
  ProductWriteAcceptedEvidenceRefOperatorApprovalPayloadVersion,
  ProductWriteAcceptedEvidenceRefRecordVersion,
  ProductWriteAcceptedEvidenceRefRequestVersion,
  ProductWriteAcceptedEvidenceRefRuntimeSliceRef,
  ProductWriteAcceptedEvidenceRefRuntimeVersion,
  ProductWriteAcceptedEvidenceRefScope,
  ProductWriteAcceptedEvidenceRefStoreVersion,
  ProductWriteAcceptedEvidenceRefTargetGroup,
  type ProductWriteAcceptedEvidenceRefAuthorityBoundary,
  type ProductWriteAcceptedEvidenceRefCreateInput,
  type ProductWriteAcceptedEvidenceRefListFilters,
  type ProductWriteAcceptedEvidenceRefReasonCode,
  type ProductWriteAcceptedEvidenceRefRecord,
  type ProductWriteAcceptedEvidenceRefResult,
  type ProductWriteAcceptedEvidenceRefStatus,
} from "../../types/product-write-accepted-evidence-ref";

export type { ProductWriteAcceptedEvidenceRefDbLike };

interface ValidationResult {
  passed: boolean;
  status: ProductWriteAcceptedEvidenceRefStatus;
  reason_codes: ProductWriteAcceptedEvidenceRefReasonCode[];
}

interface PromotionDecisionLineageRow {
  promotion_decision_id: string;
  scope: string;
  decision_kind: string;
  decision_status: string;
  operator_actor_ref: string;
  explicit_user_action_required: number;
  future_operator_decision_only: number;
  review_record_ref: string;
  promotion_executed: number;
  formation_receipt_written: number;
  durable_state_applied: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  accepted_evidence_refs_json: string;
  discarded_at: string | null;
}

interface FormationReceiptLineageRow {
  receipt_id: string;
  scope: string;
  promotion_decision_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  receipt_status: string;
  formation_receipt_written: number;
  durable_state_applied: number;
  promotion_executed: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  discarded_at: string | null;
}

interface FormationReceiptSourceRow {
  source_ref: string;
}

const safeRouteDbPathPrefixes = [
  "tmp/product-write-accepted-evidence-refs/",
  ".tmp/product-write-accepted-evidence-refs/",
  "tmp/perspective-promotion-decisions/",
  ".tmp/perspective-promotion-decisions/",
  "tmp/perspective-formation-receipts/",
  ".tmp/perspective-formation-receipts/",
] as const;

const forbiddenAuthorityFields: ReadonlySet<string> = new Set([
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "product_object_creation_now",
  "product_profile_creation_now",
  "product_publication_now",
  "product_route_beyond_accepted_evidence_refs_now",
  "product_ui_now",
  "release_execution_now",
  "release_publication_now",
  "github_actuation_now",
  "github_api_call_now",
  "git_write_now",
  "branch_creation_now",
  "commit_creation_now",
  "pull_request_creation_now",
  "repository_file_write_from_runtime_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "final_rag_answer_generation_now",
  "final_rag_answer_automatic_promotion_now",
  "proof_creation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_creation_now",
  "durable_perspective_state_mutation_from_product_write_now",
  "durable_perspective_state_write_now",
  "durable_perspective_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "background_job_now",
  "automatic_crawling_now",
  "automatic_source_fetching_now",
  "hidden_reasoning_storage_now",
  "raw_private_data_persistence_now",
  "accepted_evidence_ref_write_is_truth",
  "accepted_evidence_ref_write_is_proof",
  "accepted_evidence_ref_write_is_durable_perspective_state",
  "accepted_evidence_ref_write_is_product_id_allocation",
  "operator_approval_is_proof",
  "preview_to_write_diff_is_write_approval",
  "source_refs_are_proof",
  "promotion_decision_is_automatic_execution_command",
  "formation_receipt_is_product_write_authority",
  "audit_event_is_truth",
  "audit_event_is_proof",
  "audit_event_is_approval",
  "audit_event_is_durable_state",
  "audit_event_is_product_authority",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority_beyond_accepted_evidence_ref_write",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const);

const rawPayloadKeys: ReadonlySet<string> = new Set([
  "raw_source_body",
  "raw_source_bodies",
  "source_body",
  "raw_provider_output",
  "provider_response",
  "raw_retrieval_output",
  "retrieval_output",
  "raw_db_row",
  "raw_db_rows",
  "db_row",
  "db_rows",
  "raw_conversation",
  "conversation_transcript",
  "hidden_reasoning",
  "chain_of_thought",
  "telemetry_dump",
  "raw_diff",
  "full_diff",
  "raw_request_body",
  "raw_response_body",
] as const);

const unsafeStringPatterns = [
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
  /raw source body/i,
  /raw provider output/i,
  /raw retrieval output/i,
  /raw DB row/i,
  /raw_db_row/i,
  /raw conversation/i,
  /hidden reasoning/i,
  /chain of thought/i,
  /telemetry dump/i,
  /raw diff/i,
  /diff --git/i,
  /^@@\s+-/i,
  /actual prompt:/i,
  /provider response:/i,
  /actual query:/i,
  /embedding vector:/i,
  /vector index dump:/i,
  /SAFE_MARKER_/i,
  /sk-[A-Za-z0-9]/i,
  /ghp_[A-Za-z0-9]/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
  /BEGIN RSA PRIVATE KEY/i,
  /BEGIN OPENSSH PRIVATE KEY/i,
];

export function createAcceptedEvidenceRefRuntimeV01(
  input: ProductWriteAcceptedEvidenceRefCreateInput,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefResult {
  const payloadValidation = validatePayloadShapeV01(input);
  if (!payloadValidation.passed) return blockedResult(payloadValidation.status, payloadValidation.reason_codes);

  const forbiddenAuthorityValidation = validateForbiddenAuthorityV01(input);
  if (!forbiddenAuthorityValidation.passed) {
    return blockedResult(forbiddenAuthorityValidation.status, forbiddenAuthorityValidation.reason_codes);
  }

  const privateRawValidation = validatePrivateRawPayloadV01(input);
  if (!privateRawValidation.passed) {
    return blockedResult(privateRawValidation.status, privateRawValidation.reason_codes);
  }

  const prerequisiteValidation = validatePrerequisitesV01(input);
  if (!prerequisiteValidation.passed) {
    return blockedResult(prerequisiteValidation.status, prerequisiteValidation.reason_codes);
  }

  const dbValidation = validateDbLineageV01(input, db);
  if (!dbValidation.passed) return blockedResult(dbValidation.status, dbValidation.reason_codes);

  ensureAcceptedEvidenceRefStoreSchemaV01(db);
  const now = input.created_at ?? "2026-06-28T00:00:00.000Z";
  const record = normalizeInputToRecord(input, now);
  const writeResult = writeAcceptedEvidenceRefRecordV01(record, db);
  if (writeResult.status === "conflict_existing_idempotency_key") {
    return result(
      "conflict_existing_idempotency_key",
      writeResult.record,
      writeResult.records,
      ["idempotency_conflict", ...writeResult.reason_codes],
      { idempotentReplay: false, writeNow: false, dbNow: true },
    );
  }
  if (writeResult.status === "idempotent_existing") {
    return result(
      "idempotent_existing",
      writeResult.record,
      writeResult.records,
      [
        "idempotent_replay",
        "accepted_evidence_ref_write_is_not_proof",
        "accepted_evidence_ref_write_is_not_truth",
        ...writeResult.reason_codes,
      ],
      { idempotentReplay: true, writeNow: false, dbNow: true },
    );
  }
  if (writeResult.status === "blocked_invalid_input") {
    return blockedResult("blocked_invalid_input", writeResult.reason_codes);
  }
  return result(
    "written",
    writeResult.record,
    writeResult.records,
    [
      ...dbValidation.reason_codes,
      ...writeResult.reason_codes,
      "product_write_minimal_runtime_first_target_only",
      "accepted_evidence_ref_write_is_not_truth",
      "accepted_evidence_ref_write_is_not_proof",
      "accepted_evidence_ref_write_is_not_durable_perspective_state",
      "accepted_evidence_ref_write_is_not_product_id_allocation",
      "operator_approval_is_not_proof",
      "preview_to_write_diff_is_not_write_approval",
      "source_refs_are_lineage_pointers_not_proof",
      "promotion_decision_is_prerequisite_not_command",
      "formation_receipt_is_prerequisite_not_product_write_authority",
      "product_id_allocation_not_executed",
      "broad_product_persistence_not_executed",
      "product_write_adapter_not_enabled",
      "proof_not_created",
      "evidence_not_created",
      "claim_evidence_not_written",
      "durable_state_not_mutated",
    ],
    { idempotentReplay: false, writeNow: true, dbNow: true },
  );
}

export function readAcceptedEvidenceRefRuntimeV01(
  acceptedEvidenceRefWriteId: string,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefResult {
  if (!isSafeString(acceptedEvidenceRefWriteId)) {
    return blockedResult("blocked_private_or_raw_payload", ["private_or_raw_payload_blocked"]);
  }
  if (!acceptedEvidenceRefStoreSchemaExistsV01(db)) {
    return blockedResult("blocked_schema_missing", ["db_schema_missing"]);
  }
  const record = readAcceptedEvidenceRefRecordV01(acceptedEvidenceRefWriteId, db);
  if (!record) return result("not_found", null, [], ["db_schema_checked"], { dbNow: true });
  return result("read", record, [record], ["db_schema_checked"], { dbNow: true });
}

export function readAcceptedEvidenceRefByIdempotencyKeyRuntimeV01(
  idempotencyKey: string,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefResult {
  if (!isSafeString(idempotencyKey)) {
    return blockedResult("blocked_private_or_raw_payload", ["private_or_raw_payload_blocked"]);
  }
  if (!acceptedEvidenceRefStoreSchemaExistsV01(db)) {
    return blockedResult("blocked_schema_missing", ["db_schema_missing"]);
  }
  const record = readAcceptedEvidenceRefRecordByIdempotencyKeyV01(idempotencyKey, db);
  if (!record) return result("not_found", null, [], ["db_schema_checked"], { dbNow: true });
  return result("read", record, [record], ["db_schema_checked"], { dbNow: true });
}

export function listAcceptedEvidenceRefRuntimeV01(
  filters: ProductWriteAcceptedEvidenceRefListFilters,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefResult {
  const unsafeFilter = Object.values(filters).some((value) => {
    if (typeof value !== "string") return false;
    return hasUnsafeString(value);
  });
  if (unsafeFilter) return blockedResult("blocked_private_or_raw_payload", ["private_or_raw_payload_blocked"]);
  if (!acceptedEvidenceRefStoreSchemaExistsV01(db)) {
    return blockedResult("blocked_schema_missing", ["db_schema_missing"]);
  }
  const records = listAcceptedEvidenceRefRecordsV01(filters, db);
  return result("listed", records[0] ?? null, records, ["db_schema_checked"], { dbNow: true });
}

export function createAcceptedEvidenceRefIdempotencyKeyV01(input: {
  operator_approval_ref: string;
  promotion_decision_ref: string;
  formation_receipt_ref: string;
  preview_to_write_diff_ref: string;
}): string {
  const fingerprint = shortHash({
    target_group: ProductWriteAcceptedEvidenceRefTargetGroup,
    operator_approval_ref: input.operator_approval_ref,
    promotion_decision_ref: input.promotion_decision_ref,
    formation_receipt_ref: input.formation_receipt_ref,
    preview_to_write_diff_ref: input.preview_to_write_diff_ref,
  });
  return `product-write-accepted-evidence-ref:v0.1:${ProductWriteAcceptedEvidenceRefTargetGroup}:${fingerprint}`;
}

export function createAcceptedEvidenceRefWriteIdV01(idempotencyKey: string): string {
  return `accepted-evidence-ref-write:v0.1:${shortHash(idempotencyKey)}`;
}

export function createAcceptedEvidenceRefAuthorityBoundaryV01(options: {
  routeNow?: boolean;
  writeNow?: boolean;
  dbNow?: boolean;
} = {}): ProductWriteAcceptedEvidenceRefAuthorityBoundary {
  return {
    product_write_accepted_evidence_ref_runtime_now: true,
    product_write_minimal_runtime_first_target_only: true,
    accepted_evidence_ref_write_now: options.writeNow === true,
    accepted_evidence_records_target_group_only: true,
    caller_injected_db_only: true,
    same_origin_route_now: options.routeNow === true,
    audit_event_optional: true,
    audit_event_failure_fails_primary_route_now: false,
    operator_approval_required: true,
    promotion_decision_required: true,
    formation_receipt_required: true,
    review_record_required: true,
    public_safe_source_refs_required: true,
    preview_to_write_diff_required: true,
    rollback_or_abort_plan_required: true,
    idempotency_key_required: true,
    db_query_or_write_now: options.dbNow === true,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    broad_product_persistence_now: false,
    product_persistence_now: false,
    product_object_creation_now: false,
    product_profile_creation_now: false,
    product_publication_now: false,
    product_route_beyond_accepted_evidence_refs_now: false,
    product_ui_now: false,
    release_execution_now: false,
    release_publication_now: false,
    github_actuation_now: false,
    github_api_call_now: false,
    git_write_now: false,
    branch_creation_now: false,
    commit_creation_now: false,
    pull_request_creation_now: false,
    repository_file_write_from_runtime_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    final_rag_answer_generation_now: false,
    final_rag_answer_automatic_promotion_now: false,
    proof_creation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_creation_now: false,
    durable_perspective_state_mutation_from_product_write_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    background_job_now: false,
    automatic_crawling_now: false,
    automatic_source_fetching_now: false,
    hidden_reasoning_storage_now: false,
    raw_private_data_persistence_now: false,
    accepted_evidence_ref_write_is_truth: false,
    accepted_evidence_ref_write_is_proof: false,
    accepted_evidence_ref_write_is_durable_perspective_state: false,
    accepted_evidence_ref_write_is_product_id_allocation: false,
    operator_approval_is_proof: false,
    preview_to_write_diff_is_write_approval: false,
    source_refs_are_proof: false,
    promotion_decision_is_automatic_execution_command: false,
    formation_receipt_is_product_write_authority: false,
    audit_event_is_truth: false,
    audit_event_is_proof: false,
    audit_event_is_approval: false,
    audit_event_is_durable_state: false,
    audit_event_is_product_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority_beyond_accepted_evidence_ref_write: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function isSafeAcceptedEvidenceRefRouteDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeRouteDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  return !hasUnsafeString(value);
}

function validatePayloadShapeV01(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return validationFailure("blocked_invalid_payload", ["payload_invalid"]);
  }
  const value = input as Partial<ProductWriteAcceptedEvidenceRefCreateInput>;
  const failureCodes: ProductWriteAcceptedEvidenceRefReasonCode[] = [];
  if (value.request_version !== ProductWriteAcceptedEvidenceRefRequestVersion) failureCodes.push("payload_invalid");
  if (value.runtime_version !== ProductWriteAcceptedEvidenceRefRuntimeVersion) failureCodes.push("payload_invalid");
  if (value.scope !== ProductWriteAcceptedEvidenceRefScope) failureCodes.push("payload_invalid");
  if (value.target_group !== ProductWriteAcceptedEvidenceRefTargetGroup) failureCodes.push("payload_invalid");
  if (value.operator_approval_payload !== undefined) {
    if (
      !value.operator_approval_payload ||
      typeof value.operator_approval_payload !== "object" ||
      Array.isArray(value.operator_approval_payload)
    ) {
      failureCodes.push("payload_invalid");
    }
  }
  for (const arrayField of [
    "public_safe_source_refs",
    "accepted_evidence_refs",
    "reason_codes",
    "boundary_notes",
  ] as const) {
    if (value[arrayField] !== undefined && !Array.isArray(value[arrayField])) {
      failureCodes.push("payload_invalid");
    }
  }
  if (value.authority_boundary !== undefined) {
    if (!value.authority_boundary || typeof value.authority_boundary !== "object" || Array.isArray(value.authority_boundary)) {
      failureCodes.push("payload_invalid");
    }
  }
  if (failureCodes.length > 0) return validationFailure("blocked_invalid_payload", failureCodes);
  return validationSuccess(["payload_valid"]);
}

function validateForbiddenAuthorityV01(input: unknown): ValidationResult {
  const blocked = collectForbiddenAuthorityFields(input);
  if (blocked.length > 0) return validationFailure("blocked_forbidden_authority", ["forbidden_authority_blocked"]);
  return validationSuccess(["forbidden_authority_absent"]);
}

function validatePrivateRawPayloadV01(input: unknown): ValidationResult {
  const failureCodes = collectPrivateRawFailureCodes(input);
  if (failureCodes.length > 0) return validationFailure("blocked_private_or_raw_payload", failureCodes);
  return validationSuccess(["private_or_raw_payload_absent"]);
}

function validatePrerequisitesV01(input: ProductWriteAcceptedEvidenceRefCreateInput): ValidationResult {
  const failureCodes: ProductWriteAcceptedEvidenceRefReasonCode[] = [];
  if (!hasNonEmptyString(input.promotion_decision_ref)) failureCodes.push("promotion_decision_ref_missing");
  else failureCodes.push("promotion_decision_ref_present");
  if (!hasNonEmptyString(input.formation_receipt_ref)) failureCodes.push("formation_receipt_ref_missing");
  else failureCodes.push("formation_receipt_ref_present");
  if (!hasNonEmptyString(input.review_record_ref)) failureCodes.push("review_record_ref_missing");
  else failureCodes.push("review_record_ref_present");
  if (!Array.isArray(input.public_safe_source_refs) || input.public_safe_source_refs.length === 0) {
    failureCodes.push("public_safe_source_refs_missing");
  } else {
    failureCodes.push("public_safe_source_refs_present");
  }
  if (!Array.isArray(input.accepted_evidence_refs) || input.accepted_evidence_refs.length === 0) {
    failureCodes.push("accepted_evidence_refs_missing");
  } else {
    failureCodes.push("accepted_evidence_refs_present");
  }
  if (!hasNonEmptyString(input.product_write_reentry_review_ref)) {
    failureCodes.push("product_write_reentry_review_ref_missing");
  } else {
    failureCodes.push("product_write_reentry_review_ref_present");
  }
  if (!hasNonEmptyString(input.product_write_target_contract_ref)) {
    failureCodes.push("product_write_target_contract_ref_missing");
  } else {
    failureCodes.push("product_write_target_contract_ref_present");
  }
  if (!hasNonEmptyString(input.preview_to_write_diff_ref)) {
    failureCodes.push("preview_to_write_diff_ref_missing");
  } else {
    failureCodes.push("preview_to_write_diff_ref_present");
  }
  if (!hasNonEmptyString(input.rollback_or_abort_plan_ref)) {
    failureCodes.push("rollback_or_abort_plan_ref_missing");
  } else {
    failureCodes.push("rollback_or_abort_plan_ref_present");
  }
  if (!hasNonEmptyString(input.idempotency_key)) failureCodes.push("idempotency_key_missing");
  else failureCodes.push("idempotency_key_present");

  const approval = input.operator_approval_payload;
  if (!approval || typeof approval !== "object") {
    failureCodes.push("operator_approval_missing", "operator_approval_payload_missing");
  } else {
    failureCodes.push("operator_approval_payload_present");
    const approvalValid =
      approval.payload_version === ProductWriteAcceptedEvidenceRefOperatorApprovalPayloadVersion &&
      approval.approved === true &&
      approval.approved_target_group === ProductWriteAcceptedEvidenceRefTargetGroup &&
      approval.approved_runtime_slice === ProductWriteAcceptedEvidenceRefRuntimeSliceRef &&
      approval.authority_boundary_acknowledged === true &&
      hasNonEmptyString(approval.approval_ref) &&
      hasNonEmptyString(approval.operator_actor_ref) &&
      hasNonEmptyString(approval.approved_at) &&
      approval.promotion_decision_ref === input.promotion_decision_ref &&
      approval.formation_receipt_ref === input.formation_receipt_ref &&
      approval.preview_to_write_diff_ref === input.preview_to_write_diff_ref &&
      approval.rollback_or_abort_plan_ref === input.rollback_or_abort_plan_ref;
    if (approvalValid) failureCodes.push("operator_approval_present");
    else failureCodes.push("operator_approval_missing", "operator_approval_payload_mismatch");
  }

  if (approval?.approval_ref && input.idempotency_key) {
    const expectedKey = createAcceptedEvidenceRefIdempotencyKeyV01({
      operator_approval_ref: approval.approval_ref,
      promotion_decision_ref: input.promotion_decision_ref,
      formation_receipt_ref: input.formation_receipt_ref,
      preview_to_write_diff_ref: input.preview_to_write_diff_ref,
    });
    if (input.idempotency_key !== expectedKey) failureCodes.push("idempotency_key_scope_mismatch");
  }

  const blockingCodes = failureCodes.filter((code) =>
    [
      "promotion_decision_ref_missing",
      "formation_receipt_ref_missing",
      "review_record_ref_missing",
      "public_safe_source_refs_missing",
      "accepted_evidence_refs_missing",
      "product_write_reentry_review_ref_missing",
      "product_write_target_contract_ref_missing",
      "preview_to_write_diff_ref_missing",
      "rollback_or_abort_plan_ref_missing",
      "idempotency_key_missing",
      "operator_approval_missing",
      "operator_approval_payload_missing",
      "operator_approval_payload_mismatch",
      "idempotency_key_scope_mismatch",
    ].includes(code),
  );
  if (blockingCodes.length > 0) {
    return validationFailure("blocked_missing_prerequisite", uniqueReasonCodes(failureCodes));
  }
  return validationSuccess(uniqueReasonCodes(failureCodes));
}

function validateDbLineageV01(
  input: ProductWriteAcceptedEvidenceRefCreateInput,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ValidationResult {
  if (!lineageTablesExistV01(db)) {
    return validationFailure("blocked_schema_missing", [
      "db_schema_missing",
      "promotion_decision_store_missing",
      "formation_receipt_store_missing",
    ]);
  }

  const promotionRow = db
    .prepare(
      `SELECT
        promotion_decision_id,
        scope,
        decision_kind,
        decision_status,
        operator_actor_ref,
        explicit_user_action_required,
        future_operator_decision_only,
        review_record_ref,
        promotion_executed,
        formation_receipt_written,
        durable_state_applied,
        proof_or_evidence_created,
        claim_or_evidence_written,
        product_write_executed,
        accepted_evidence_refs_json,
        discarded_at
       FROM perspective_promotion_decisions
       WHERE promotion_decision_id = ?`,
    )
    .get(input.promotion_decision_ref) as PromotionDecisionLineageRow | undefined;
  if (!promotionRow || promotionRow.scope !== ProductWriteAcceptedEvidenceRefScope) {
    return validationFailure("blocked_missing_prerequisite", ["promotion_decision_ref_missing"]);
  }

  const approval = input.operator_approval_payload;
  const promotionReasonCodes: ProductWriteAcceptedEvidenceRefReasonCode[] = [
    "promotion_decision_ref_present",
    "promotion_decision_is_prerequisite_not_command",
  ];
  if (promotionRow.discarded_at) promotionReasonCodes.push("promotion_decision_discarded");
  if (promotionRow.decision_kind !== "promote") promotionReasonCodes.push("promotion_decision_not_promote");
  if (promotionRow.decision_status !== "eligible_for_future_operator_decision") {
    promotionReasonCodes.push("promotion_decision_not_eligible");
  }
  if (promotionRow.review_record_ref !== input.review_record_ref) {
    promotionReasonCodes.push("promotion_decision_review_record_mismatch");
  }
  if (promotionRow.operator_actor_ref !== approval.operator_actor_ref) {
    promotionReasonCodes.push("promotion_decision_operator_mismatch");
  }
  if (
    promotionRow.explicit_user_action_required !== 1 ||
    promotionRow.future_operator_decision_only !== 1 ||
    promotionRow.promotion_executed !== 0 ||
    promotionRow.durable_state_applied !== 0 ||
    promotionRow.proof_or_evidence_created !== 0 ||
    promotionRow.claim_or_evidence_written !== 0 ||
    promotionRow.product_write_executed !== 0
  ) {
    promotionReasonCodes.push("promotion_decision_forbidden_authority");
  }
  const promotionAcceptedEvidenceRefs = new Set(parseStringArray(promotionRow.accepted_evidence_refs_json));
  if (!input.accepted_evidence_refs.every((ref) => promotionAcceptedEvidenceRefs.has(ref))) {
    promotionReasonCodes.push("accepted_evidence_ref_not_backed_by_promotion_decision");
  }

  const formationRow = db
    .prepare(
      `SELECT
        receipt_id,
        scope,
        promotion_decision_id,
        review_record_ref,
        operator_actor_ref,
        receipt_status,
        formation_receipt_written,
        durable_state_applied,
        promotion_executed,
        proof_or_evidence_created,
        claim_or_evidence_written,
        product_write_executed,
        discarded_at
       FROM perspective_formation_receipts
       WHERE receipt_id = ?`,
    )
    .get(input.formation_receipt_ref) as FormationReceiptLineageRow | undefined;
  if (!formationRow || formationRow.scope !== ProductWriteAcceptedEvidenceRefScope) {
    return validationFailure("blocked_missing_prerequisite", [
      ...promotionReasonCodes,
      "formation_receipt_ref_missing",
    ]);
  }

  const formationReasonCodes: ProductWriteAcceptedEvidenceRefReasonCode[] = [
    "formation_receipt_ref_present",
    "formation_receipt_is_prerequisite_not_product_write_authority",
  ];
  if (formationRow.discarded_at) formationReasonCodes.push("formation_receipt_discarded");
  if (formationRow.receipt_status !== "written" || formationRow.formation_receipt_written !== 1) {
    formationReasonCodes.push("formation_receipt_not_written");
  }
  if (formationRow.promotion_decision_id !== input.promotion_decision_ref) {
    formationReasonCodes.push("formation_receipt_promotion_decision_mismatch");
  }
  if (formationRow.review_record_ref !== input.review_record_ref) {
    formationReasonCodes.push("formation_receipt_review_record_mismatch");
  }
  if (formationRow.operator_actor_ref !== approval.operator_actor_ref) {
    formationReasonCodes.push("formation_receipt_operator_mismatch");
  }
  if (
    formationRow.durable_state_applied !== 0 ||
    formationRow.promotion_executed !== 0 ||
    formationRow.proof_or_evidence_created !== 0 ||
    formationRow.claim_or_evidence_written !== 0 ||
    formationRow.product_write_executed !== 0
  ) {
    formationReasonCodes.push("formation_receipt_forbidden_authority");
  }
  const formationSourceRefs = readFormationReceiptSourceRefsV01(input.formation_receipt_ref, db);
  if (!input.public_safe_source_refs.every((sourceRef) => formationSourceRefs.has(sourceRef))) {
    formationReasonCodes.push("formation_receipt_source_ref_mismatch");
  }

  const allReasonCodes = uniqueReasonCodes([
    "db_schema_checked",
    ...promotionReasonCodes,
    ...formationReasonCodes,
  ]);
  const forbiddenCodes = allReasonCodes.filter((code) =>
    ["promotion_decision_forbidden_authority", "formation_receipt_forbidden_authority"].includes(code),
  );
  if (forbiddenCodes.length > 0) return validationFailure("blocked_forbidden_authority", allReasonCodes);
  const missingCodes = allReasonCodes.filter((code) =>
    [
      "promotion_decision_discarded",
      "promotion_decision_not_promote",
      "promotion_decision_not_eligible",
      "promotion_decision_review_record_mismatch",
      "promotion_decision_operator_mismatch",
      "accepted_evidence_ref_not_backed_by_promotion_decision",
      "formation_receipt_not_written",
      "formation_receipt_discarded",
      "formation_receipt_promotion_decision_mismatch",
      "formation_receipt_review_record_mismatch",
      "formation_receipt_operator_mismatch",
      "formation_receipt_source_ref_mismatch",
    ].includes(code),
  );
  if (missingCodes.length > 0) return validationFailure("blocked_missing_prerequisite", allReasonCodes);
  return validationSuccess(allReasonCodes);
}

function normalizeInputToRecord(
  input: ProductWriteAcceptedEvidenceRefCreateInput,
  createdAt: string,
): ProductWriteAcceptedEvidenceRefRecord {
  const publicSafeSourceRefs = uniqueSorted(input.public_safe_source_refs);
  const acceptedEvidenceRefs = uniqueSorted(input.accepted_evidence_refs);
  const reasonCodes = uniqueReasonCodes([
    ...input.reason_codes,
    "accepted_evidence_ref_write_record_written",
    "product_write_minimal_runtime_first_target_only",
    "operator_approval_is_not_proof",
    "preview_to_write_diff_is_not_write_approval",
    "source_refs_are_lineage_pointers_not_proof",
    "promotion_decision_is_prerequisite_not_command",
    "formation_receipt_is_prerequisite_not_product_write_authority",
    "product_id_allocation_not_executed",
    "broad_product_persistence_not_executed",
    "product_write_adapter_not_enabled",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "work_item_not_created",
    "promotion_not_executed",
    "formation_receipt_not_written_now",
    "durable_state_not_mutated",
    "provider_call_not_executed",
    "prompt_not_sent",
    "source_fetch_not_executed",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "git_write_not_executed",
    "github_api_not_called",
    "repository_file_not_written",
  ]);
  const normalizedPayload = materialPayloadForFingerprint(input);
  const payloadFingerprint = shortHash(normalizedPayload);
  return {
    record_version: ProductWriteAcceptedEvidenceRefRecordVersion,
    store_version: ProductWriteAcceptedEvidenceRefStoreVersion,
    runtime_version: ProductWriteAcceptedEvidenceRefRuntimeVersion,
    scope: ProductWriteAcceptedEvidenceRefScope,
    target_group: ProductWriteAcceptedEvidenceRefTargetGroup,
    accepted_evidence_ref_write_id: createAcceptedEvidenceRefWriteIdV01(input.idempotency_key),
    idempotency_key: input.idempotency_key,
    payload_fingerprint: payloadFingerprint,
    promotion_decision_ref: input.promotion_decision_ref,
    formation_receipt_ref: input.formation_receipt_ref,
    review_record_ref: input.review_record_ref,
    public_safe_source_refs: publicSafeSourceRefs,
    accepted_evidence_refs: acceptedEvidenceRefs,
    product_write_reentry_review_ref: input.product_write_reentry_review_ref,
    product_write_target_contract_ref: input.product_write_target_contract_ref,
    preview_to_write_diff_ref: input.preview_to_write_diff_ref,
    rollback_or_abort_plan_ref: input.rollback_or_abort_plan_ref,
    operator_approval_ref: input.operator_approval_payload.approval_ref,
    operator_actor_ref: input.operator_approval_payload.operator_actor_ref,
    operator_approval_payload: input.operator_approval_payload,
    accepted_evidence_ref_write_record_written: true,
    product_id_allocated: false,
    broad_product_persistence_executed: false,
    product_write_adapter_enabled: false,
    proof_created: false,
    evidence_created: false,
    claim_evidence_written: false,
    work_item_created: false,
    promotion_executed: false,
    formation_receipt_written_now: false,
    durable_perspective_state_mutated: false,
    accepted_evidence_ref_write_is_truth: false,
    accepted_evidence_ref_write_is_proof: false,
    accepted_evidence_ref_write_is_durable_perspective_state: false,
    accepted_evidence_ref_write_is_product_id_allocation: false,
    operator_approval_is_proof: false,
    preview_to_write_diff_is_write_approval: false,
    source_refs_are_lineage_pointers: true,
    promotion_decision_is_prerequisite_not_command: true,
    formation_receipt_is_prerequisite_not_product_write_authority: true,
    audit_event_is_product_authority: false,
    reason_codes: reasonCodes,
    boundary_notes: uniqueSorted(input.boundary_notes),
    authority_boundary: createAcceptedEvidenceRefAuthorityBoundaryV01({
      writeNow: true,
      dbNow: true,
    }),
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function result(
  status: ProductWriteAcceptedEvidenceRefStatus,
  record: ProductWriteAcceptedEvidenceRefRecord | null,
  records: ProductWriteAcceptedEvidenceRefRecord[],
  reasonCodes: ProductWriteAcceptedEvidenceRefReasonCode[],
  options: {
    idempotentReplay?: boolean;
    writeNow?: boolean;
    dbNow?: boolean;
    routeNow?: boolean;
  } = {},
): ProductWriteAcceptedEvidenceRefResult {
  const errorCode =
    status.startsWith("blocked") || status === "not_found" || status === "conflict_existing_idempotency_key"
      ? status
      : null;
  return {
    store_version: ProductWriteAcceptedEvidenceRefStoreVersion,
    record_version: ProductWriteAcceptedEvidenceRefRecordVersion,
    runtime_version: ProductWriteAcceptedEvidenceRefRuntimeVersion,
    scope: ProductWriteAcceptedEvidenceRefScope,
    target_group: ProductWriteAcceptedEvidenceRefTargetGroup,
    status,
    record,
    records,
    error_code: errorCode,
    reason_codes: uniqueReasonCodes([
      "accepted_evidence_ref_write_is_not_truth",
      "accepted_evidence_ref_write_is_not_proof",
      "operator_approval_is_not_proof",
      "preview_to_write_diff_is_not_write_approval",
      "audit_event_is_not_truth",
      "audit_event_is_not_proof",
      "audit_event_is_not_approval",
      "audit_event_is_not_durable_state",
      "audit_event_is_not_product_authority",
      ...reasonCodes,
    ]),
    accepted_evidence_ref_write_record_written: status === "written",
    idempotent_replay: options.idempotentReplay === true,
    product_id_allocated: false,
    broad_product_persistence_executed: false,
    product_write_adapter_enabled: false,
    proof_created: false,
    evidence_created: false,
    claim_evidence_written: false,
    work_item_created: false,
    promotion_executed: false,
    formation_receipt_written_now: false,
    durable_perspective_state_mutated: false,
    authority_boundary: createAcceptedEvidenceRefAuthorityBoundaryV01({
      routeNow: options.routeNow,
      writeNow: options.writeNow,
      dbNow: options.dbNow,
    }),
  };
}

function blockedResult(
  status: ProductWriteAcceptedEvidenceRefStatus,
  reasonCodes: ProductWriteAcceptedEvidenceRefReasonCode[] = [],
): ProductWriteAcceptedEvidenceRefResult {
  return result(status, null, [], reasonCodes, { writeNow: false, dbNow: false });
}

function validationSuccess(reasonCodes: ProductWriteAcceptedEvidenceRefReasonCode[]): ValidationResult {
  return { passed: true, status: "written", reason_codes: uniqueReasonCodes(reasonCodes) };
}

function validationFailure(
  status: ProductWriteAcceptedEvidenceRefStatus,
  reasonCodes: ProductWriteAcceptedEvidenceRefReasonCode[],
): ValidationResult {
  return { passed: false, status, reason_codes: uniqueReasonCodes(reasonCodes) };
}

function lineageTablesExistV01(db: ProductWriteAcceptedEvidenceRefDbLike): boolean {
  const requiredTables = [
    "perspective_promotion_decisions",
    "perspective_formation_receipts",
    "perspective_formation_receipt_sources",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const names = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => names.has(tableName));
}

function readFormationReceiptSourceRefsV01(
  receiptId: string,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): Set<string> {
  const rows = db
    .prepare(
      `SELECT source_ref
       FROM perspective_formation_receipt_sources
       WHERE receipt_id = ?`,
    )
    .all(receiptId) as FormationReceiptSourceRow[];
  return new Set(rows.map((row) => row.source_ref));
}

function collectForbiddenAuthorityFields(input: unknown): string[] {
  const blocked: string[] = [];
  visitJson(input, (key, value) => {
    if (key && forbiddenAuthorityFields.has(key) && value === true) blocked.push(key);
  });
  return [...new Set(blocked)].sort();
}

function collectPrivateRawFailureCodes(input: unknown): ProductWriteAcceptedEvidenceRefReasonCode[] {
  const failureCodes: ProductWriteAcceptedEvidenceRefReasonCode[] = [];
  visitJson(input, (key, value) => {
    if (key && rawPayloadKeys.has(key)) {
      failureCodes.push(reasonCodeForRawKey(key));
    }
    if (typeof value === "string" && hasUnsafeString(value)) {
      failureCodes.push(reasonCodeForUnsafeString(value));
    }
  });
  return uniqueReasonCodes(failureCodes.length > 0 ? failureCodes : []);
}

function reasonCodeForRawKey(key: string): ProductWriteAcceptedEvidenceRefReasonCode {
  if (key.includes("provider")) return "raw_provider_output_blocked";
  if (key.includes("retrieval")) return "raw_retrieval_output_blocked";
  if (key.includes("db")) return "raw_db_row_blocked";
  if (key.includes("conversation")) return "raw_conversation_blocked";
  if (key.includes("reasoning") || key.includes("chain")) return "hidden_reasoning_blocked";
  if (key.includes("telemetry")) return "telemetry_dump_blocked";
  if (key.includes("diff")) return "raw_diff_blocked";
  return "raw_source_body_blocked";
}

function reasonCodeForUnsafeString(value: string): ProductWriteAcceptedEvidenceRefReasonCode {
  if (/\/Users\//i.test(value) || /\/home\//i.test(value) || /file:\/\//i.test(value)) {
    return "local_path_blocked";
  }
  if (/https?:\/\//i.test(value) || /private URL|private_url/i.test(value)) return "private_url_blocked";
  if (/raw source body/i.test(value)) return "raw_source_body_blocked";
  if (/raw provider output|provider response:/i.test(value)) return "raw_provider_output_blocked";
  if (/raw retrieval output|actual query:|embedding vector:|vector index dump:/i.test(value)) {
    return "raw_retrieval_output_blocked";
  }
  if (/raw DB row|raw_db_row/i.test(value)) return "raw_db_row_blocked";
  if (/raw conversation/i.test(value)) return "raw_conversation_blocked";
  if (/hidden reasoning|chain of thought/i.test(value)) return "hidden_reasoning_blocked";
  if (/telemetry dump/i.test(value)) return "telemetry_dump_blocked";
  if (/raw diff|diff --git|^@@\s+-/i.test(value)) return "raw_diff_blocked";
  return "secret_like_pattern_blocked";
}

function materialPayloadForFingerprint(input: ProductWriteAcceptedEvidenceRefCreateInput): Record<string, unknown> {
  return {
    request_version: input.request_version,
    runtime_version: input.runtime_version,
    scope: input.scope,
    target_group: input.target_group,
    idempotency_key: input.idempotency_key,
    promotion_decision_ref: input.promotion_decision_ref,
    formation_receipt_ref: input.formation_receipt_ref,
    review_record_ref: input.review_record_ref,
    public_safe_source_refs: uniqueSorted(input.public_safe_source_refs),
    accepted_evidence_refs: uniqueSorted(input.accepted_evidence_refs),
    product_write_reentry_review_ref: input.product_write_reentry_review_ref,
    product_write_target_contract_ref: input.product_write_target_contract_ref,
    preview_to_write_diff_ref: input.preview_to_write_diff_ref,
    rollback_or_abort_plan_ref: input.rollback_or_abort_plan_ref,
    operator_approval_payload: sortJson(input.operator_approval_payload),
    reason_codes: uniqueSorted(input.reason_codes),
    boundary_notes: uniqueSorted(input.boundary_notes),
  };
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isSafeString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !hasUnsafeString(value);
}

function hasUnsafeString(value: string): boolean {
  return unsafeStringPatterns.some((pattern) => pattern.test(value));
}

function parseStringArray(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function uniqueReasonCodes(
  values: ProductWriteAcceptedEvidenceRefReasonCode[],
): ProductWriteAcceptedEvidenceRefReasonCode[] {
  return uniqueSorted(values);
}

function shortHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex").slice(0, 24);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortJson(nested)]),
  );
}

function visitJson(
  value: unknown,
  visitor: (key: string | null, value: unknown) => void,
  key: string | null = null,
): void {
  visitor(key, value);
  if (Array.isArray(value)) {
    value.forEach((item) => visitJson(item, visitor, null));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    visitJson(nestedValue, visitor, nestedKey);
  }
}
