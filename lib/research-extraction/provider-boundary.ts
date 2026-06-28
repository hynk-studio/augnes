import { createHash } from "node:crypto";

export const PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01 =
  "provider_assisted_extraction_runtime_completion.v0.1" as const;
export const PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_REQUEST_VERSION_V01 =
  "provider_assisted_extraction_runtime_completion_request.v0.1" as const;
export const PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_RESULT_VERSION_V01 =
  "provider_assisted_extraction_runtime_completion_result.v0.1" as const;
export const PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_ROUTE_VERSION_V01 =
  "provider_assisted_extraction_runtime_completion_route.v0.1" as const;

export type ProviderExtractionScopeV01 = "project:augnes";
export type ProviderExtractionModeV01 = "mock_provider" | "configured_provider";
export type ProviderExtractionStatusV01 =
  | "candidate_bundle_created"
  | "provider_unavailable"
  | "provider_missing_key"
  | "provider_refused"
  | "unsupported_extraction"
  | "low_grounding_warning"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";
export type ProviderCandidateFamilyV01 =
  | "claim_candidate"
  | "evidence_candidate"
  | "source_summary_candidate"
  | "tension_candidate"
  | "knowledge_gap_candidate"
  | "unsupported_candidate"
  | "unknown";
export type ProviderConfidenceLabelV01 = "low" | "medium" | "high" | "unknown";

export interface ProviderAssistedExtractionRuntimeAuthorityBoundaryV01 {
  provider_assisted_extraction_runtime_now: true;
  explicit_operator_provider_action_only: true;
  same_origin_post_route_now: true;
  provider_adapter_invocation_now: boolean;
  mock_provider_adapter_now: boolean;
  configured_provider_missing_key_refusal_now: boolean;
  normalized_candidate_bundle_now: true;
  candidate_only_output_now: true;
  source_ref_required: true;
  bounded_source_excerpt_required: true;
  raw_source_body_non_persistent_by_default: true;
  raw_provider_output_non_persistent_by_default: true;
  provider_call_on_load_now: false;
  background_provider_call_now: false;
  hidden_provider_call_now: false;
  raw_prompt_stored_now: false;
  prompt_sent_without_operator_action_now: false;
  hidden_reasoning_stored_now: false;
  chain_of_thought_stored_now: false;
  raw_source_body_stored_now: false;
  raw_provider_output_stored_now: false;
  provider_thread_run_session_id_canonicalized_now: false;
  retrieval_index_write_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  db_query_or_write_now: false;
  route_get_provider_execution_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  provider_output_is_truth: false;
  provider_output_is_proof: false;
  provider_output_is_accepted_evidence: false;
  provider_confidence_is_truth: false;
  provider_confidence_is_promotion_readiness: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  source_ref_is_proof: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ProviderAssistedExtractionRuntimeRequestV01 {
  request_version: typeof PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_REQUEST_VERSION_V01;
  runtime_version: typeof PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01;
  scope: ProviderExtractionScopeV01;
  extraction_request_id: string;
  requested_by: string;
  requested_at: string;
  provider_mode: ProviderExtractionModeV01;
  provider_ref: string;
  model_or_tool_ref: string;
  source_ref_id: string;
  source_locator_ref?: string;
  bounded_source_excerpt?: string;
  bounded_source_summary?: string;
  extraction_goal: string;
  candidate_family_allowlist: ProviderCandidateFamilyV01[];
  max_candidates: number;
  max_source_excerpt_chars: number;
  max_output_chars: number;
  quote_limit_policy?: "bounded_quote_refs_only";
  copyright_boundary?: "bounded_excerpt_only";
  no_chain_of_thought_storage: true;
  raw_source_body_storage_policy: "non_persistent";
  raw_provider_output_storage_policy: "non_persistent";
  authority_boundary?: Record<string, unknown>;
  reason_codes?: string[];
}

export interface ProviderAssistedExtractionRuntimeValidationResultV01 {
  passed: boolean;
  status: ProviderExtractionStatusV01;
  failure_kind: string | null;
  failure_codes: string[];
}

const scope: ProviderExtractionScopeV01 = "project:augnes";
const safeRefPattern = /^[a-z][a-z0-9_-]*:[a-z0-9][a-z0-9._:-]{1,220}$/i;
const safeIdentifierPattern = /^[a-z][a-z0-9._:-]{2,220}$/i;
const maxExtractionGoalChars = 800;
const maxReasonCodeChars = 96;
const maxProviderRefChars = 160;
const hardMaxSourceExcerptChars = 4000;
const hardMaxOutputChars = 12000;
const hardMaxCandidates = 12;

const allowedTrueAuthorityFields = new Set([
  "provider_assisted_extraction_runtime_now",
  "explicit_operator_provider_action_only",
  "same_origin_post_route_now",
  "provider_adapter_invocation_now",
  "mock_provider_adapter_now",
  "configured_provider_missing_key_refusal_now",
  "normalized_candidate_bundle_now",
  "candidate_only_output_now",
  "source_ref_required",
  "bounded_source_excerpt_required",
  "raw_source_body_non_persistent_by_default",
  "raw_provider_output_non_persistent_by_default",
  "no_chain_of_thought_storage",
  "raw_source_body_storage_policy",
  "raw_provider_output_storage_policy",
]);

const forbiddenAuthorityFalseFields = [
  "provider_call_on_load_now",
  "background_provider_call_now",
  "hidden_provider_call_now",
  "raw_prompt_stored_now",
  "prompt_sent_without_operator_action_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
  "raw_source_body_stored_now",
  "raw_provider_output_stored_now",
  "provider_thread_run_session_id_canonicalized_now",
  "retrieval_index_write_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "db_query_or_write_now",
  "route_get_provider_execution_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "provider_output_is_truth",
  "provider_output_is_proof",
  "provider_output_is_accepted_evidence",
  "provider_confidence_is_truth",
  "provider_confidence_is_promotion_readiness",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;

const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFalseFields);
const authorityLikePatterns = [
  /_authority$/i,
  /_write_now$/i,
  /_call_now$/i,
  /_execution_now$/i,
  /_is_truth$/i,
  /_is_proof$/i,
  /_is_accepted_evidence$/i,
  /_is_durable_state$/i,
  /product_write/i,
  /product_id_allocation/i,
  /proof_or_evidence/i,
  /claim_or_evidence/i,
  /promotion_execution/i,
  /durable_state_apply/i,
  /formation_receipt_write/i,
  /github_api_call/i,
  /git_write/i,
  /provider_output/i,
  /provider_confidence/i,
  /chain_of_thought/i,
] as const;

const unsafeTextPatterns = [
  /SAFE_MARKER_/i,
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\])/i,
  /\bhttps?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)\b/i,
  /\bprivate[-_ ]?url\b/i,
  /\blocal[-_ ]?private[-_ ]?path\b/i,
  /\braw[-_ ]?source[-_ ]?body\b/i,
  /\braw[-_ ]?provider[-_ ]?output\b/i,
  /\braw[-_ ]?retrieval[-_ ]?output\b/i,
  /\braw[-_ ]?conversation\b/i,
  /\bhidden[-_ ]?reasoning\b/i,
  /\bchain[-_ ]?of[-_ ]?thought\b/i,
  /\btoken[-_ ]?log\b/i,
  /\braw[-_ ]?db[-_ ]?row\b/i,
  /\braw[-_ ]?diff\b/i,
  /\btelemetry[-_ ]?dump\b/i,
  /\bbrowser[-_ ]?dump\b/i,
  /\bthread_[A-Za-z0-9_-]+/i,
  /\brun_[A-Za-z0-9_-]+/i,
  /\bsession_[A-Za-z0-9_-]+/i,
  /\bprovider[-_ ]?(thread|run|session)[-_ ]?id\b/i,
  /\buploaded[-_ ]?file[-_ ]?id\b/i,
  /\bconnector[-_ ]?id\b/i,
  /sk-[A-Za-z0-9]/i,
  /ghp_[A-Za-z0-9]/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /\btoken\b/i,
  /password:/i,
  /secret:/i,
  /\bsecret\b/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
] as const;

export function createProviderAssistedExtractionRuntimeAuthorityBoundaryV01(options?: {
  provider_adapter_invocation_now?: boolean;
  mock_provider_adapter_now?: boolean;
  configured_provider_missing_key_refusal_now?: boolean;
}): ProviderAssistedExtractionRuntimeAuthorityBoundaryV01 {
  return {
    provider_assisted_extraction_runtime_now: true,
    explicit_operator_provider_action_only: true,
    same_origin_post_route_now: true,
    provider_adapter_invocation_now: options?.provider_adapter_invocation_now === true,
    mock_provider_adapter_now: options?.mock_provider_adapter_now === true,
    configured_provider_missing_key_refusal_now:
      options?.configured_provider_missing_key_refusal_now === true,
    normalized_candidate_bundle_now: true,
    candidate_only_output_now: true,
    source_ref_required: true,
    bounded_source_excerpt_required: true,
    raw_source_body_non_persistent_by_default: true,
    raw_provider_output_non_persistent_by_default: true,
    provider_call_on_load_now: false,
    background_provider_call_now: false,
    hidden_provider_call_now: false,
    raw_prompt_stored_now: false,
    prompt_sent_without_operator_action_now: false,
    hidden_reasoning_stored_now: false,
    chain_of_thought_stored_now: false,
    raw_source_body_stored_now: false,
    raw_provider_output_stored_now: false,
    provider_thread_run_session_id_canonicalized_now: false,
    retrieval_index_write_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    db_query_or_write_now: false,
    route_get_provider_execution_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    provider_output_is_truth: false,
    provider_output_is_proof: false,
    provider_output_is_accepted_evidence: false,
    provider_confidence_is_truth: false,
    provider_confidence_is_promotion_readiness: false,
    candidate_is_fact: false,
    candidate_is_proof: false,
    candidate_is_accepted_evidence: false,
    source_ref_is_proof: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateProviderAssistedExtractionRuntimeRequestV01(
  input: unknown,
): ProviderAssistedExtractionRuntimeValidationResultV01 {
  const failureCodes: string[] = [];
  if (!isRecord(input)) {
    return validationFailure("blocked_invalid_input", "invalid_input", ["input_not_object"]);
  }

  const authorityFailures = validateRecursiveAuthority(input);
  if (authorityFailures.length > 0) {
    return validationFailure(
      "blocked_forbidden_authority",
      "forbidden_authority",
      authorityFailures,
    );
  }

  if (containsUnsafeProviderRuntimeTextV01(input)) {
    return validationFailure(
      "blocked_private_or_raw_payload",
      "raw_payload_blocked",
      ["private_or_raw_payload_detected"],
    );
  }

  if (input.request_version !== PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_REQUEST_VERSION_V01) {
    failureCodes.push("wrong_request_version");
  }
  if (input.runtime_version !== PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_VERSION_V01) {
    failureCodes.push("wrong_runtime_version");
  }
  if (input.scope !== scope) failureCodes.push("wrong_scope");
  if (!isSafeIdentifier(input.extraction_request_id)) {
    failureCodes.push("extraction_request_id_invalid");
  }
  if (!isSafeIdentifier(input.requested_by)) failureCodes.push("requested_by_invalid");
  if (!isIsoTimestamp(input.requested_at)) failureCodes.push("requested_at_invalid");
  if (!isProviderMode(input.provider_mode)) failureCodes.push("provider_mode_invalid");
  if (!isSafePublicText(input.provider_ref, maxProviderRefChars)) {
    failureCodes.push("provider_ref_invalid");
  }
  if (!isSafePublicText(input.model_or_tool_ref, maxProviderRefChars)) {
    failureCodes.push("model_or_tool_ref_invalid");
  }
  if (!isSafeSymbolicRef(input.source_ref_id) || !String(input.source_ref_id).startsWith("source-ref:")) {
    failureCodes.push("source_ref_id_required");
  }
  if (input.source_locator_ref !== undefined && !isSafeSymbolicRef(input.source_locator_ref)) {
    failureCodes.push("source_locator_ref_invalid");
  }
  if (!isSafePublicText(input.extraction_goal, maxExtractionGoalChars)) {
    failureCodes.push("extraction_goal_invalid");
  }
  failureCodes.push(...validateBoundedSourceInput(input));
  failureCodes.push(...validateCandidateFamilyAllowlist(input.candidate_family_allowlist));
  failureCodes.push(...validateNumberLimit(input.max_candidates, "max_candidates", 1, hardMaxCandidates));
  failureCodes.push(...validateNumberLimit(input.max_source_excerpt_chars, "max_source_excerpt_chars", 1, hardMaxSourceExcerptChars));
  failureCodes.push(...validateNumberLimit(input.max_output_chars, "max_output_chars", 256, hardMaxOutputChars));
  if (
    input.quote_limit_policy !== undefined &&
    input.quote_limit_policy !== "bounded_quote_refs_only"
  ) {
    failureCodes.push("quote_limit_policy_invalid");
  }
  if (
    input.copyright_boundary !== undefined &&
    input.copyright_boundary !== "bounded_excerpt_only"
  ) {
    failureCodes.push("copyright_boundary_invalid");
  }
  if (input.no_chain_of_thought_storage !== true) {
    failureCodes.push("no_chain_of_thought_storage_required");
  }
  if (input.raw_source_body_storage_policy !== "non_persistent") {
    failureCodes.push("raw_source_body_storage_policy_must_be_non_persistent");
  }
  if (input.raw_provider_output_storage_policy !== "non_persistent") {
    failureCodes.push("raw_provider_output_storage_policy_must_be_non_persistent");
  }
  if (!isSafeReasonCodes(input.reason_codes)) failureCodes.push("reason_codes_invalid");

  if (failureCodes.length > 0) {
    return validationFailure("blocked_invalid_input", "invalid_input", failureCodes);
  }
  return {
    passed: true,
    status: "candidate_bundle_created",
    failure_kind: null,
    failure_codes: [],
  };
}

export function isSafeProviderExtractionRouteDbOrConfigValueV01(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" &&
      value.length <= 160 &&
      isSafePublicText(value, 160) &&
      !/[\\/]|https?:\/\//i.test(value))
  );
}

export function redactProviderRuntimeRefV01(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : JSON.stringify(input ?? "unknown");
  const fingerprint = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  if (typeof input === "string" && isSafePublicText(input, maxProviderRefChars)) {
    const prefix = input.split(":").slice(0, 2).join(":");
    return `${prefix || "provider-runtime-ref"}#${fingerprint}`;
  }
  return `provider-runtime-ref:redacted#${fingerprint}`;
}

export function classifyProviderAssistedExtractionFailureV01(resultOrError: unknown): string | null {
  if (isRecord(resultOrError)) {
    if (typeof resultOrError.failure_kind === "string") return resultOrError.failure_kind;
    if (typeof resultOrError.status === "string" && resultOrError.status !== "candidate_bundle_created") {
      return resultOrError.status;
    }
  }
  if (resultOrError instanceof Error) {
    if (/missing.*key|key.*missing/i.test(resultOrError.message)) return "provider_missing_key";
    if (/refused/i.test(resultOrError.message)) return "provider_refused";
    return "provider_unavailable";
  }
  return null;
}

export function isProviderExtractionRequestV01(
  input: unknown,
): input is ProviderAssistedExtractionRuntimeRequestV01 {
  return validateProviderAssistedExtractionRuntimeRequestV01(input).passed && isRecord(input);
}

export function isProviderCandidateFamilyV01(value: unknown): value is ProviderCandidateFamilyV01 {
  return (
    value === "claim_candidate" ||
    value === "evidence_candidate" ||
    value === "source_summary_candidate" ||
    value === "tension_candidate" ||
    value === "knowledge_gap_candidate" ||
    value === "unsupported_candidate" ||
    value === "unknown"
  );
}

export function isProviderConfidenceLabelV01(value: unknown): value is ProviderConfidenceLabelV01 {
  return value === "low" || value === "medium" || value === "high" || value === "unknown";
}

export function isSafeProviderRuntimePublicTextV01(
  value: unknown,
  maxChars = 1200,
): value is string {
  return isSafePublicText(value, maxChars);
}

export function containsUnsafeProviderRuntimeTextV01(value: unknown): boolean {
  if (typeof value === "string") {
    return unsafeTextPatterns.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeProviderRuntimeTextV01(item));
  }
  if (isRecord(value)) {
    return Object.values(value).some((item) => containsUnsafeProviderRuntimeTextV01(item));
  }
  return false;
}

export function safeBoundedProviderTextV01(value: unknown, maxChars: number): string | null {
  if (!isSafePublicText(value, maxChars)) return null;
  return value.trim().slice(0, maxChars);
}

export function uniqueSortedProviderRuntimeValuesV01(values: unknown[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))).sort();
}

export function canonicalProviderRuntimeJsonV01(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function validateBoundedSourceInput(input: Record<string, unknown>): string[] {
  const failureCodes: string[] = [];
  const excerpt = input.bounded_source_excerpt;
  const summary = input.bounded_source_summary;
  const maxExcerptChars =
    typeof input.max_source_excerpt_chars === "number" ? input.max_source_excerpt_chars : hardMaxSourceExcerptChars;

  if (!isSafePublicText(excerpt, maxExcerptChars) && !isSafePublicText(summary, 1200)) {
    failureCodes.push("bounded_source_excerpt_or_summary_required");
  }
  if (excerpt !== undefined) {
    if (!isSafePublicText(excerpt, maxExcerptChars)) {
      failureCodes.push("bounded_source_excerpt_invalid");
    } else if (excerpt.trim().length > maxExcerptChars) {
      failureCodes.push("bounded_source_excerpt_too_long");
    }
  }
  if (summary !== undefined && !isSafePublicText(summary, 1200)) {
    failureCodes.push("bounded_source_summary_invalid");
  }
  return failureCodes;
}

function validateCandidateFamilyAllowlist(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) return ["candidate_family_allowlist_invalid"];
  if (value.length > hardMaxCandidates) return ["candidate_family_allowlist_too_large"];
  const failures: string[] = [];
  for (const item of value) {
    if (!isProviderCandidateFamilyV01(item) || item === "unknown") {
      failures.push("candidate_family_invalid");
    }
  }
  return failures;
}

function validateNumberLimit(
  value: unknown,
  field: string,
  min: number,
  max: number,
): string[] {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return [`${field}_invalid`];
  }
  return [];
}

function validateRecursiveAuthority(value: unknown, path = "$"): string[] {
  const failures: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      failures.push(...validateRecursiveAuthority(item, `${path}[${index}]`));
    });
    return failures;
  }
  if (!isRecord(value)) return failures;
  for (const [key, nested] of Object.entries(value)) {
    if (hasForbiddenAuthorityGrant(key, nested)) {
      failures.push(`forbidden_authority:${path}.${key}`);
    }
    failures.push(...validateRecursiveAuthority(nested, `${path}.${key}`));
  }
  return failures;
}

function hasForbiddenAuthorityGrant(key: string, value: unknown): boolean {
  if (allowedTrueAuthorityFields.has(key)) return false;
  if (forbiddenAuthorityFieldSet.has(key)) return !isFalseLikeAuthorityValue(value);
  if (authorityLikePatterns.some((pattern) => pattern.test(key))) {
    return !isFalseLikeAuthorityValue(value);
  }
  return false;
}

function isFalseLikeAuthorityValue(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function validationFailure(
  status: ProviderExtractionStatusV01,
  failureKind: string,
  failureCodes: string[],
): ProviderAssistedExtractionRuntimeValidationResultV01 {
  return {
    passed: false,
    status,
    failure_kind: failureKind,
    failure_codes: Array.from(new Set(failureCodes.filter(Boolean))).sort(),
  };
}

function isProviderMode(value: unknown): value is ProviderExtractionModeV01 {
  return value === "mock_provider" || value === "configured_provider";
}

function isSafeIdentifier(value: unknown): boolean {
  return typeof value === "string" && safeIdentifierPattern.test(value) && isSafePublicText(value, 240);
}

function isSafeSymbolicRef(value: unknown): value is string {
  return typeof value === "string" && safeRefPattern.test(value) && isSafePublicText(value, 240);
}

function isSafeReasonCodes(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every(
    (reason) =>
      typeof reason === "string" &&
      /^[a-z][a-z0-9_:-]{1,95}$/.test(reason) &&
      reason.length <= maxReasonCodeChars &&
      isSafePublicText(reason, maxReasonCodeChars),
  );
}

function isIsoTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && value.includes("T");
}

function isSafePublicText(value: unknown, maxChars: number): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (text.length === 0 || text.length > maxChars) return false;
  if (text.includes("\0")) return false;
  return !unsafeTextPatterns.some((pattern) => pattern.test(text));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  }
  return value;
}
