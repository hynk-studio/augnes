import { createHash } from "node:crypto";

export const RUNTIME_AUDIT_MODEL_BUILDER_VERSION =
  "runtime_audit_model_builder.v0.1" as const;
export const RUNTIME_AUDIT_PANEL_VERSION = "runtime_audit_panel.v0.1" as const;
export const RUNTIME_AUDIT_ITEM_VERSION = "runtime_audit_item.v0.1" as const;
export const RUNTIME_AUDIT_SECTION_VERSION = "runtime_audit_section.v0.1" as const;

const scope = "project:augnes" as const;
const blockedAuditId = "runtime-audit:blocked" as const;

export type RuntimeAuditStatus =
  | "built"
  | "empty"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input";

export const RuntimeAuditSectionKinds = [
  "authority_boundary",
  "route_boundary",
  "store_boundary",
  "state_mutation_boundary",
  "product_write_boundary",
  "provider_retrieval_boundary",
  "dogfooding_boundary",
  "feedback_boundary",
  "perspective_state_boundary",
  "layout_boundary",
  "verification_boundary",
  "privacy_boundary",
  "unknown",
] as const;
export type RuntimeAuditSectionKind = (typeof RuntimeAuditSectionKinds)[number];

export const RuntimeAuditItemSeverities = [
  "info",
  "warning",
  "blocked",
  "critical",
  "unknown",
] as const;
export type RuntimeAuditItemSeverity = (typeof RuntimeAuditItemSeverities)[number];

export const RuntimeAuditReasonCodes = [
  "runtime_audit_panel_read_only",
  "runtime_audit_model_built",
  "audit_is_review_cue_only",
  "audit_is_not_truth",
  "audit_is_not_proof",
  "audit_is_not_authority",
  "verification_is_not_truth",
  "smoke_pass_is_not_truth",
  "ci_pass_is_not_truth",
  "product_write_parked",
  "product_write_denied",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_not_executed",
  "durable_state_not_mutated",
  "candidate_not_mutated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "dogfooding_record_ref_present",
  "dogfooding_review_cue_present",
  "feedback_aggregate_ref_present",
  "surfacing_preview_ref_present",
  "manual_anchor_ref_present",
  "durable_state_apply_ref_present",
  "formation_receipt_ref_present",
  "promotion_decision_ref_present",
  "route_boundary_present",
  "store_boundary_present",
  "authority_boundary_present",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
] as const;
export type RuntimeAuditReasonCode = (typeof RuntimeAuditReasonCodes)[number];

export interface RuntimeAuditAuthorityBoundary {
  runtime_audit_panel_now: true;
  read_only_audit_view_now: true;
  runtime_audit_persistence_now: false;
  audit_write_route_now: false;
  audit_read_route_now: false;
  db_query_or_write_now: false;
  route_call_now: false;
  fetch_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  candidate_mutation_now: false;
  candidate_deletion_now: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  work_mutation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  browser_log_ingestion_now: false;
  session_log_ingestion_now: false;
  raw_conversation_ingestion_now: false;
  telemetry_ingestion_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  audit_is_truth: false;
  audit_is_proof: false;
  audit_is_authority: false;
  verification_is_truth: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
  product_write_authority: false;
}

export interface RuntimeAuditInputItem {
  input_item_id: string;
  section_kind: RuntimeAuditSectionKind;
  severity: RuntimeAuditItemSeverity;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  dogfooding_record_refs: string[];
  dogfooding_review_cue_refs: string[];
  feedback_aggregate_refs: string[];
  surfacing_preview_refs: string[];
  manual_anchor_refs: string[];
  durable_state_apply_refs: string[];
  formation_receipt_refs: string[];
  promotion_decision_refs: string[];
  route_refs: string[];
  store_refs: string[];
  verification_refs: string[];
  public_safe: boolean;
  reason_codes: RuntimeAuditReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface RuntimeAuditInput {
  builder_version: typeof RUNTIME_AUDIT_MODEL_BUILDER_VERSION;
  panel_version: typeof RUNTIME_AUDIT_PANEL_VERSION;
  scope: typeof scope;
  audit_id: string;
  as_of: string;
  input_items: RuntimeAuditInputItem[];
  boundary_notes: string[];
  reason_codes: RuntimeAuditReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface RuntimeAuditItem {
  item_version: typeof RUNTIME_AUDIT_ITEM_VERSION;
  scope: typeof scope;
  item_id: string;
  section_kind: RuntimeAuditSectionKind;
  severity: RuntimeAuditItemSeverity;
  bounded_title: string;
  bounded_summary: string;
  source_refs: string[];
  dogfooding_record_refs: string[];
  dogfooding_review_cue_refs: string[];
  feedback_aggregate_refs: string[];
  surfacing_preview_refs: string[];
  manual_anchor_refs: string[];
  durable_state_apply_refs: string[];
  formation_receipt_refs: string[];
  promotion_decision_refs: string[];
  route_refs: string[];
  store_refs: string[];
  verification_refs: string[];
  public_safe: true;
  reason_codes: RuntimeAuditReasonCode[];
  authority_boundary: RuntimeAuditAuthorityBoundary;
}

export interface RuntimeAuditSection {
  section_version: typeof RUNTIME_AUDIT_SECTION_VERSION;
  scope: typeof scope;
  section_id: string;
  section_kind: RuntimeAuditSectionKind;
  bounded_title: string;
  bounded_summary: string;
  items: RuntimeAuditItem[];
  severity_counts: Record<RuntimeAuditItemSeverity, number>;
  reason_codes: RuntimeAuditReasonCode[];
  authority_boundary: RuntimeAuditAuthorityBoundary;
}

export interface RuntimeAuditModel {
  panel_version: typeof RUNTIME_AUDIT_PANEL_VERSION;
  builder_version: typeof RUNTIME_AUDIT_MODEL_BUILDER_VERSION;
  scope: typeof scope;
  audit_id: string;
  status: RuntimeAuditStatus;
  as_of: string;
  sections: RuntimeAuditSection[];
  all_items: RuntimeAuditItem[];
  blocked_item_refs: string[];
  warnings: string[];
  boundary_notes: string[];
  reason_codes: RuntimeAuditReasonCode[];
  authority_boundary: RuntimeAuditAuthorityBoundary;
  audit_fingerprint: string;
}

export interface RuntimeAuditValidationResult {
  passed: boolean;
  failure_codes: string[];
}

const forbiddenFalseAuthorityFields = [
  "runtime_audit_persistence_now",
  "audit_write_route_now",
  "audit_read_route_now",
  "db_query_or_write_now",
  "route_call_now",
  "fetch_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "candidate_mutation_now",
  "candidate_deletion_now",
  "rule_mutation_now",
  "parser_mutation_now",
  "work_mutation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "browser_log_ingestion_now",
  "session_log_ingestion_now",
  "raw_conversation_ingestion_now",
  "telemetry_ingestion_now",
  "embedding_created_now",
  "vector_search_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "audit_is_truth",
  "audit_is_proof",
  "audit_is_authority",
  "verification_is_truth",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
  "product_write_authority",
] as const;

const requiredTrueAuthorityFields = [
  "runtime_audit_panel_now",
  "read_only_audit_view_now",
] as const;

const privateOrRawMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw dogfooding payload",
  "raw audit payload",
  "raw source body",
  "browser dump",
  "raw browser dump",
  "raw DB row",
  "raw_db_row",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
] as const;

const rawConversationMarkers = ["raw conversation"] as const;
const hiddenReasoningMarkers = ["hidden reasoning"] as const;
const telemetryMarkers = ["telemetry dump"] as const;
const privateUrlMarkers = ["http://", "https://"] as const;
const symbolicLocalPathMarkers = ["private-local-path-ref:"] as const;
const secretLikeMarkers = [
  "password:",
  "secret:",
  "private key",
  "secret-like audit input blocked by fixture",
] as const;

type JsonRecord = Record<string, unknown>;

export function createRuntimeAuditAuthorityBoundaryV01():
  RuntimeAuditAuthorityBoundary {
  return {
    runtime_audit_panel_now: true,
    read_only_audit_view_now: true,
    runtime_audit_persistence_now: false,
    audit_write_route_now: false,
    audit_read_route_now: false,
    db_query_or_write_now: false,
    route_call_now: false,
    fetch_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    candidate_mutation_now: false,
    candidate_deletion_now: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    work_mutation_now: false,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    browser_log_ingestion_now: false,
    session_log_ingestion_now: false,
    raw_conversation_ingestion_now: false,
    telemetry_ingestion_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    git_ledger_export_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    audit_is_truth: false,
    audit_is_proof: false,
    audit_is_authority: false,
    verification_is_truth: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
    product_write_authority: false,
  };
}

export function validateRuntimeAuditInputV01(
  input: unknown,
): RuntimeAuditValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<RuntimeAuditInput>;
  const failures: string[] = [];

  if (value.builder_version !== RUNTIME_AUDIT_MODEL_BUILDER_VERSION) {
    failures.push("builder_version_invalid");
  }
  if (value.panel_version !== RUNTIME_AUDIT_PANEL_VERSION) {
    failures.push("panel_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.audit_id, "audit_id"));
  failures.push(...validateSafeString(value.as_of, "as_of"));
  failures.push(...validateStringArray(value.boundary_notes, "boundary_notes"));
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.input_items)) {
    failures.push("input_items_invalid");
  } else {
    for (const item of value.input_items) {
      failures.push(...validateRuntimeAuditInputItemV01(item).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateRuntimeAuditInputItemV01(
  item: unknown,
): RuntimeAuditValidationResult {
  if (!isRecord(item)) {
    return { passed: false, failure_codes: ["input_item_invalid_object"] };
  }
  const value = item as Partial<RuntimeAuditInputItem>;
  const failures: string[] = [];

  failures.push(...validateSafeString(value.input_item_id, "input_item_id"));
  if (!RuntimeAuditSectionKinds.includes(value.section_kind as RuntimeAuditSectionKind)) {
    failures.push("section_kind_invalid");
  }
  if (!RuntimeAuditItemSeverities.includes(value.severity as RuntimeAuditItemSeverity)) {
    failures.push("severity_invalid");
  }
  failures.push(...validateSafeString(value.bounded_title, "bounded_title"));
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "source_refs",
    "dogfooding_record_refs",
    "dogfooding_review_cue_refs",
    "feedback_aggregate_refs",
    "surfacing_preview_refs",
    "manual_anchor_refs",
    "durable_state_apply_refs",
    "formation_receipt_refs",
    "promotion_decision_refs",
    "route_refs",
    "store_refs",
    "verification_refs",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  if (value.public_safe !== true) failures.push("public_safe_not_true");
  failures.push(...validateReasonCodes(value.reason_codes, "item_reason_codes"));
  failures.push(
    ...validateAuthorityBoundary(value.authority_boundary, "item_authority_boundary"),
  );

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function buildRuntimeAuditModelV01(input: RuntimeAuditInput): RuntimeAuditModel {
  const validation = validateRuntimeAuditInputV01(input);
  if (!validation.passed) {
    return blockedModel(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      "runtime_audit_panel_read_only",
      "audit_is_review_cue_only",
      "audit_is_not_truth",
      "audit_is_not_proof",
      "audit_is_not_authority",
      "db_write_not_executed",
      "durable_state_not_mutated",
      "candidate_not_mutated",
      "product_write_denied",
      "provider_call_not_executed",
      "retrieval_not_executed",
      "rag_answer_not_generated",
      "source_fetch_not_executed",
      "file_read_not_executed",
    ]);
  }

  if (input.input_items.length === 0) {
    return finalizeModel({
      panel_version: RUNTIME_AUDIT_PANEL_VERSION,
      builder_version: RUNTIME_AUDIT_MODEL_BUILDER_VERSION,
      scope,
      audit_id: input.audit_id,
      status: "empty",
      as_of: input.as_of,
      sections: [],
      all_items: [],
      blocked_item_refs: [],
      warnings: ["No runtime audit items supplied."],
      boundary_notes: uniqueSorted(input.boundary_notes),
      reason_codes: uniqueSorted([
        ...input.reason_codes,
        "runtime_audit_panel_read_only",
        "audit_is_review_cue_only",
        "audit_is_not_truth",
        "audit_is_not_proof",
        "audit_is_not_authority",
        "verification_is_not_truth",
        "product_write_parked",
        "product_write_denied",
        "db_write_not_executed",
        "durable_state_not_mutated",
        "candidate_not_mutated",
        "proof_not_created",
        "evidence_not_created",
        "claim_evidence_not_written",
        "provider_call_not_executed",
        "retrieval_not_executed",
        "rag_answer_not_generated",
        "source_fetch_not_executed",
        "file_read_not_executed",
      ]),
      authority_boundary: createRuntimeAuditAuthorityBoundaryV01(),
    });
  }

  const authorityBoundary = createRuntimeAuditAuthorityBoundaryV01();
  const sortedUniqueInputs = dedupeInputItems(input.input_items);
  const allItems = sortedUniqueInputs.map((item): RuntimeAuditItem => {
    return {
      item_version: RUNTIME_AUDIT_ITEM_VERSION,
      scope,
      item_id: createRuntimeAuditItemIdV01(input.audit_id, item),
      section_kind: item.section_kind,
      severity: item.severity,
      bounded_title: item.bounded_title,
      bounded_summary: item.bounded_summary,
      source_refs: uniqueSorted(item.source_refs),
      dogfooding_record_refs: uniqueSorted(item.dogfooding_record_refs),
      dogfooding_review_cue_refs: uniqueSorted(item.dogfooding_review_cue_refs),
      feedback_aggregate_refs: uniqueSorted(item.feedback_aggregate_refs),
      surfacing_preview_refs: uniqueSorted(item.surfacing_preview_refs),
      manual_anchor_refs: uniqueSorted(item.manual_anchor_refs),
      durable_state_apply_refs: uniqueSorted(item.durable_state_apply_refs),
      formation_receipt_refs: uniqueSorted(item.formation_receipt_refs),
      promotion_decision_refs: uniqueSorted(item.promotion_decision_refs),
      route_refs: uniqueSorted(item.route_refs),
      store_refs: uniqueSorted(item.store_refs),
      verification_refs: uniqueSorted(item.verification_refs),
      public_safe: true,
      reason_codes: uniqueSorted([...item.reason_codes, ...reasonCodesForItem(item)]),
      authority_boundary: authorityBoundary,
    };
  });

  const sections = RuntimeAuditSectionKinds.filter((sectionKind) =>
    allItems.some((item) => item.section_kind === sectionKind),
  ).map((sectionKind): RuntimeAuditSection => {
    const items = allItems.filter((item) => item.section_kind === sectionKind);
    return {
      section_version: RUNTIME_AUDIT_SECTION_VERSION,
      scope,
      section_id: `runtime-audit-section:${sectionKind}`,
      section_kind: sectionKind,
      bounded_title: sectionTitle(sectionKind),
      bounded_summary: sectionSummary(sectionKind),
      items,
      severity_counts: countSeverities(items),
      reason_codes: uniqueSorted([
        "runtime_audit_panel_read_only",
        "audit_is_review_cue_only",
        "audit_is_not_truth",
        "audit_is_not_proof",
        "audit_is_not_authority",
        ...items.flatMap((item) => item.reason_codes),
      ]),
      authority_boundary: authorityBoundary,
    };
  });

  return finalizeModel({
    panel_version: RUNTIME_AUDIT_PANEL_VERSION,
    builder_version: RUNTIME_AUDIT_MODEL_BUILDER_VERSION,
    scope,
    audit_id: input.audit_id,
    status: "built",
    as_of: input.as_of,
    sections,
    all_items: allItems,
    blocked_item_refs: [],
    warnings: [],
    boundary_notes: uniqueSorted(input.boundary_notes),
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      ...allItems.flatMap((item) => item.reason_codes),
      "runtime_audit_model_built",
      "runtime_audit_panel_read_only",
      "audit_is_review_cue_only",
      "audit_is_not_truth",
      "audit_is_not_proof",
      "audit_is_not_authority",
      "verification_is_not_truth",
      "smoke_pass_is_not_truth",
      "ci_pass_is_not_truth",
      "product_write_parked",
      "product_write_denied",
      "provider_call_not_executed",
      "retrieval_not_executed",
      "rag_answer_not_generated",
      "source_fetch_not_executed",
      "file_read_not_executed",
      "db_write_not_executed",
      "durable_state_not_mutated",
      "candidate_not_mutated",
      "proof_not_created",
      "evidence_not_created",
      "claim_evidence_not_written",
    ]),
    authority_boundary: authorityBoundary,
  });
}

export function createRuntimeAuditFingerprintV01(modelWithoutFingerprint: unknown): string {
  return createHash("sha256")
    .update(canonicalJson(modelWithoutFingerprint))
    .digest("hex");
}

function createRuntimeAuditItemIdV01(
  auditId: string,
  item: Pick<RuntimeAuditInputItem, "input_item_id">,
): string {
  return `${auditId}:item:${item.input_item_id}`;
}

function finalizeModel(modelWithoutFingerprint: Omit<RuntimeAuditModel, "audit_fingerprint">):
  RuntimeAuditModel {
  return {
    ...modelWithoutFingerprint,
    audit_fingerprint: createRuntimeAuditFingerprintV01(modelWithoutFingerprint),
  };
}

function blockedModel(
  status: Extract<RuntimeAuditStatus, "blocked_private_or_raw_payload" | "blocked_invalid_input">,
  input: unknown,
  reasonCodes: RuntimeAuditReasonCode[],
): RuntimeAuditModel {
  const auditId =
    isRecord(input) &&
    typeof input.audit_id === "string" &&
    unsafeStringFailureCodes(input.audit_id, "audit_id").length === 0
      ? input.audit_id
      : blockedAuditId;
  const asOf =
    isRecord(input) &&
    typeof input.as_of === "string" &&
    unsafeStringFailureCodes(input.as_of, "as_of").length === 0
      ? input.as_of
      : "blocked";
  return finalizeModel({
    panel_version: RUNTIME_AUDIT_PANEL_VERSION,
    builder_version: RUNTIME_AUDIT_MODEL_BUILDER_VERSION,
    scope,
    audit_id: auditId,
    status,
    as_of: asOf,
    sections: [],
    all_items: [],
    blocked_item_refs: [],
    warnings: ["Runtime audit input was blocked before model build."],
    boundary_notes: [],
    reason_codes: uniqueSorted(reasonCodes),
    authority_boundary: createRuntimeAuditAuthorityBoundaryV01(),
  });
}

function statusForFailures(
  failures: string[],
): Extract<RuntimeAuditStatus, "blocked_private_or_raw_payload" | "blocked_invalid_input"> {
  if (
    failures.some(
      (failure) =>
        failure.includes("private_or_raw") ||
        failure.includes("raw_conversation") ||
        failure.includes("hidden_reasoning") ||
        failure.includes("telemetry_dump") ||
        failure.includes("secret_like_pattern") ||
        failure.includes("local_path") ||
        failure.includes("private_url"),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function reasonCodesForFailures(failures: string[]): RuntimeAuditReasonCode[] {
  const reasonCodes: RuntimeAuditReasonCode[] = [];
  for (const failure of failures) {
    if (failure.includes("raw_conversation")) reasonCodes.push("raw_conversation_blocked");
    if (failure.includes("hidden_reasoning")) reasonCodes.push("hidden_reasoning_blocked");
    if (failure.includes("telemetry_dump")) reasonCodes.push("telemetry_dump_blocked");
    if (failure.includes("secret_like_pattern")) reasonCodes.push("secret_like_pattern_blocked");
    if (failure.includes("local_path")) reasonCodes.push("local_path_blocked");
    if (failure.includes("private_url")) reasonCodes.push("private_url_blocked");
    if (
      failure.includes("private_or_raw") ||
      failure.includes("raw_payload") ||
      failure.includes("secret_like_pattern")
    ) {
      reasonCodes.push("private_or_raw_payload_blocked");
    }
  }
  return uniqueSorted(reasonCodes);
}

function reasonCodesForItem(item: RuntimeAuditInputItem): RuntimeAuditReasonCode[] {
  const reasonCodes: RuntimeAuditReasonCode[] = [
    "runtime_audit_panel_read_only",
    "audit_is_review_cue_only",
    "audit_is_not_truth",
    "audit_is_not_proof",
    "audit_is_not_authority",
    "verification_is_not_truth",
    "product_write_parked",
    "product_write_denied",
    "provider_call_not_executed",
    "retrieval_not_executed",
    "rag_answer_not_generated",
    "source_fetch_not_executed",
    "file_read_not_executed",
    "db_write_not_executed",
    "durable_state_not_mutated",
    "candidate_not_mutated",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
  ];
  if (item.dogfooding_record_refs.length > 0) {
    reasonCodes.push("dogfooding_record_ref_present");
  }
  if (item.dogfooding_review_cue_refs.length > 0) {
    reasonCodes.push("dogfooding_review_cue_present");
  }
  if (item.feedback_aggregate_refs.length > 0) {
    reasonCodes.push("feedback_aggregate_ref_present");
  }
  if (item.surfacing_preview_refs.length > 0) {
    reasonCodes.push("surfacing_preview_ref_present");
  }
  if (item.manual_anchor_refs.length > 0) {
    reasonCodes.push("manual_anchor_ref_present");
  }
  if (item.durable_state_apply_refs.length > 0) {
    reasonCodes.push("durable_state_apply_ref_present");
  }
  if (item.formation_receipt_refs.length > 0) {
    reasonCodes.push("formation_receipt_ref_present");
  }
  if (item.promotion_decision_refs.length > 0) {
    reasonCodes.push("promotion_decision_ref_present");
  }
  if (item.route_refs.length > 0) {
    reasonCodes.push("route_boundary_present");
  }
  if (item.store_refs.length > 0) {
    reasonCodes.push("store_boundary_present");
  }
  if (item.section_kind === "authority_boundary") {
    reasonCodes.push("authority_boundary_present");
  }
  if (item.verification_refs.length > 0) {
    reasonCodes.push("smoke_pass_is_not_truth", "ci_pass_is_not_truth");
  }
  return uniqueSorted(reasonCodes);
}

function dedupeInputItems(items: RuntimeAuditInputItem[]): RuntimeAuditInputItem[] {
  const sorted = items
    .slice()
    .sort((left, right) =>
      compareTuple(
        [left.section_kind, left.severity, left.input_item_id],
        [right.section_kind, right.severity, right.input_item_id],
      ),
    );
  const seen = new Set<string>();
  const unique: RuntimeAuditInputItem[] = [];
  for (const item of sorted) {
    if (seen.has(item.input_item_id)) continue;
    seen.add(item.input_item_id);
    unique.push(item);
  }
  return unique;
}

function countSeverities(items: RuntimeAuditItem[]): Record<RuntimeAuditItemSeverity, number> {
  const counts = Object.fromEntries(
    RuntimeAuditItemSeverities.map((severity) => [severity, 0]),
  ) as Record<RuntimeAuditItemSeverity, number>;
  for (const item of items) {
    counts[item.severity] += 1;
  }
  return counts;
}

function sectionTitle(sectionKind: RuntimeAuditSectionKind): string {
  return sectionKind
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function sectionSummary(sectionKind: RuntimeAuditSectionKind): string {
  const summaries: Record<RuntimeAuditSectionKind, string> = {
    authority_boundary: "Authority boundary facts supplied for read-only review.",
    route_boundary: "Route boundary facts supplied without route calls.",
    store_boundary: "Store boundary facts supplied without DB reads or writes.",
    state_mutation_boundary: "State mutation boundary facts supplied for review.",
    product_write_boundary: "Product-write remains parked and denied.",
    provider_retrieval_boundary: "Provider, retrieval, RAG, source fetch, and file reads remain denied.",
    dogfooding_boundary: "Dogfooding records and review cues are bounded review signals.",
    feedback_boundary: "Feedback aggregation and surfacing preview remain advisory only.",
    perspective_state_boundary: "Perspective state lineage is audit context, not product-write.",
    layout_boundary: "Manual anchors and layout refs are display hints.",
    verification_boundary: "Verification summaries are review cues, not proof or truth.",
    privacy_boundary: "Privacy and redaction facts are bounded and public-safe.",
    unknown: "Unknown audit facts remain bounded review context.",
  };
  return summaries[sectionKind];
}

function validateReasonCodes(value: unknown, field: string): string[] {
  const failures = validateStringArray(value, field);
  if (failures.length > 0 || !Array.isArray(value)) return failures;
  for (const code of value) {
    if (!RuntimeAuditReasonCodes.includes(code as RuntimeAuditReasonCode)) {
      failures.push(`${field}_unknown_reason_code`);
    }
  }
  return failures;
}

function validateStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field}_invalid_array`];
  return value.flatMap((item, index) => validateSafeString(item, `${field}_${index}`));
}

function validateSafeString(value: unknown, field: string): string[] {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [`${field}_invalid_string`];
  }
  return unsafeStringFailureCodes(value, field);
}

function unsafeStringFailureCodes(value: string, field: string): string[] {
  const normalizedValue = value.toLowerCase();
  const failures: string[] = [];
  if (includesMarker(normalizedValue, privateOrRawMarkers)) {
    failures.push(`${field}_private_or_raw_payload`);
  }
  if (includesMarker(normalizedValue, rawConversationMarkers)) {
    failures.push(`${field}_raw_conversation`);
  }
  if (includesMarker(normalizedValue, hiddenReasoningMarkers)) {
    failures.push(`${field}_hidden_reasoning`);
  }
  if (includesMarker(normalizedValue, telemetryMarkers)) {
    failures.push(`${field}_telemetry_dump`);
  }
  if (includesMarker(normalizedValue, privateUrlMarkers)) {
    failures.push(`${field}_private_url`);
  }
  if (includesMarker(normalizedValue, symbolicLocalPathMarkers)) {
    failures.push(`${field}_local_path`);
  }
  if (includesMarker(normalizedValue, secretLikeMarkers)) {
    failures.push(`${field}_secret_like_pattern`);
  }
  return failures;
}

function includesMarker(normalizedValue: string, markers: readonly string[]): boolean {
  return markers.some((marker) => normalizedValue.includes(marker.toLowerCase()));
}

function validateAuthorityBoundary(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return [`${field}_invalid_object`];
  const failures: string[] = [];
  failures.push(...unsafeStringFailureCodes(canonicalJson(value), field));
  for (const key of forbiddenFalseAuthorityFields) {
    if (value[key] !== undefined && value[key] !== false) {
      failures.push(`${field}_${key}_forbidden_authority`);
    }
  }
  for (const key of requiredTrueAuthorityFields) {
    if (value[key] !== undefined && value[key] !== true) {
      failures.push(`${field}_${key}_invalid_authority`);
    }
  }
  return failures;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function compareTuple(left: readonly string[], right: readonly string[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    const result = left[index].localeCompare(right[index]);
    if (result !== 0) return result;
  }
  return left.length - right.length;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
