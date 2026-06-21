export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_VERSION =
  "manual_note_single_claim_product_write_disabled_adapter_contract_tests.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildContractTestsReportInput = {
  disabledAdapterSkeleton: unknown;
  contractTestCases?: unknown;
  staticBoundaryEvidence?: unknown;
  sourceValidationFailureCodes?: unknown;
};

const READY_SKELETON_STATUS = "product_write_disabled_adapter_skeleton_only";
const READY_SKELETON_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_contract_tests";
const READY_SKELETON_NEXT_SLICE =
  "single_claim_product_write_disabled_adapter_contract_tests";
const CONTRACT_SUITE_STATUS =
  "product_write_disabled_adapter_contract_tests_passed";
const BLOCKED_SUITE_STATUS =
  "blocked_before_product_write_disabled_adapter_contract_tests";
const READY_RECOMMENDATION =
  "ready_for_single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const BLOCKED_RECOMMENDATION =
  "blocked_before_product_write_disabled_adapter_dry_run_invocation_harness";
const NEXT_DRY_RUN_INVOCATION_HARNESS =
  "single_claim_product_write_disabled_adapter_dry_run_invocation_harness";
const RECHECK_SLICE =
  "single_claim_product_write_disabled_adapter_contract_tests_recheck";

const AUTHORITY_CONTRACT_IDS = [
  "explicit_operator_decision_contract",
  "selected_temp_claim_identity_contract",
  "product_claim_schema_contract",
  "product_claim_id_allocation_contract",
  "product_idempotency_storage_contract",
  "product_rollback_storage_contract",
  "product_review_audit_storage_contract",
  "product_write_observability_contract",
  "source_verification_authority_contract",
  "proof_evidence_authority_contract",
  "canonical_perspective_authority_contract",
  "enabled_adapter_transition_contract",
  "product_write_route_contract",
  "product_write_transaction_boundary_contract",
  "product_write_static_boundary_contract",
  "product_write_runtime_boundary_contract",
] as const;

const REQUIRED_ADAPTER_INPUTS = [
  "authority_contract_bundle_fingerprint",
  "selected_temp_claim_record_id",
  "source_operation_id",
  "source_temp_intent_id",
  "temp_idempotency_key",
  "operator_decision_contract_reference",
  "product_claim_schema_contract_reference",
  "idempotency_contract_reference",
  "rollback_contract_reference",
  "audit_contract_reference",
  "observability_contract_reference",
] as const;

const FORBIDDEN_ADAPTER_INPUTS = [
  "product_claim_id",
  "proof_id",
  "evidence_id",
  "perspective_id",
  "work_item_id",
  "db_path",
  "sql_text",
  "route_request",
  "ui_action_request",
  "provider_request",
  "source_fetch_request",
  "external_handoff_request",
] as const;

const REFUSAL_REASON_IDS = [
  "adapter_disabled",
  "adapter_invocation_requested",
  "product_write_requested",
  "product_write_authority_not_granted",
  "authority_contracts_not_satisfied",
  "missing_or_malformed_authority_bundle",
  "missing_selected_temp_claim_identity",
  "candidate_kind_mismatch",
  "multiple_selected_temp_claims",
  "product_claim_id_provided",
  "proof_or_evidence_id_provided",
  "perspective_or_canonical_id_provided",
  "work_item_id_provided",
  "raw_manual_note_text_included",
  "db_path_provided",
  "sql_text_provided",
  "transaction_execution_requested",
  "route_requested",
  "ui_action_requested",
  "provider_or_openai_requested",
  "source_fetch_requested",
  "retrieval_or_rag_requested",
  "external_handoff_requested",
  "browser_persistence_requested",
  "upstream_forbidden_surface_true",
  "static_schema_db_sql_change",
  "static_app_router_ui_change",
  "dependency_addition_outside_allowlist",
] as const;

const EXPLICIT_FORBIDDEN_SURFACE_KEYS = [
  "product_db_write",
  "product_id_allocation",
  "product_route",
  "product_write_adapter_enabled",
  "product_write_authority_granted",
  "sql_execution",
  "db_open",
  "schema_or_migration_change",
  "proof_evidence_write",
  "perspective_or_canonical_graph_write",
  "work_item_creation",
  "source_fetch",
  "provider_or_openai_call",
  "retrieval_or_rag",
  "external_handoff",
  "browser_persistence",
  "ui_write_action",
  "transaction_execution",
  "transaction_commit",
  "transaction_rollback_execution",
  "durable_idempotency_write",
  "durable_rollback_write",
  "durable_audit_write",
  "durable_observability_write",
  "adapter_invocation",
  "enabled_adapter_transition",
] as const;

const PRODUCT_ID_KEYS = [
  "product_record_id",
  "product_claim_id",
  "canonical_claim_id",
  "canonical_id",
  "proof_id",
  "evidence_id",
  "perspective_id",
  "work_item_id",
  "product_idempotency_record_id",
  "product_rollback_record_id",
  "product_audit_record_id",
  "product_observability_record_id",
  "audit_record_product_id",
] as const;

export function buildManualNoteSingleClaimProductWriteDisabledAdapterContractTestsReport(
  input: BuildContractTestsReportInput,
): JsonRecord {
  const skeleton = asRecord(input.disabledAdapterSkeleton);
  const testCases = asArray(asRecord(input.contractTestCases).test_cases);
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const skeletonFailureCodes = validateDisabledAdapterSkeletonContract(skeleton);
  const staticBoundary = asRecord(input.staticBoundaryEvidence);
  const staticFailureCodes = validateStaticBoundaryEvidence(staticBoundary);
  const failureCodes = unique([
    ...sourceValidationFailureCodes,
    ...skeletonFailureCodes,
    ...staticFailureCodes,
  ]);
  const finalStatus =
    failureCodes.length === 0 && testCases.length >= 80 ? "pass" : "fail";
  const reportCore = {
    report_kind:
      "manual_note_single_claim_product_write_disabled_adapter_contract_tests_report",
    report_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_DISABLED_ADAPTER_CONTRACT_TESTS_VERSION,
    contract_suite_status:
      finalStatus === "pass" ? CONTRACT_SUITE_STATUS : BLOCKED_SUITE_STATUS,
    final_status: finalStatus,
    total_cases: testCases.length,
    positive_cases: testCases.filter(
      (testCase) => asRecord(testCase).expected_status === "pass",
    ).length,
    expected_negative_cases: testCases.filter(
      (testCase) => asRecord(testCase).expected_status === "fail",
    ).length,
    unexpected_passes: [],
    unexpected_failures: [],
    source_disabled_adapter_skeleton_fingerprint: asString(
      skeleton.disabled_adapter_skeleton_fingerprint,
    ),
    suite_fingerprint: "",
    tested_boundaries: {
      disabled_adapter_contract_tests_only: true,
      product_write_allowed_now: false,
      adapter_invocation_allowed_now: false,
      db_open: false,
      sql_execution: false,
    },
    static_boundary_evidence: staticBoundary,
    recommendation_status:
      finalStatus === "pass" ? READY_RECOMMENDATION : BLOCKED_RECOMMENDATION,
    next_recommended_slice:
      finalStatus === "pass" ? NEXT_DRY_RUN_INVOCATION_HARNESS : RECHECK_SLICE,
    validation: {
      passed: finalStatus === "pass",
      failure_codes: failureCodes,
    },
  };
  return {
    ...reportCore,
    suite_fingerprint:
      createManualNoteSingleClaimProductWriteDisabledAdapterContractTestsFingerprint(
        reportCore,
      ),
  };
}

export function validateDisabledAdapterSkeletonContract(value: unknown): string[] {
  const skeleton = asRecord(value);
  const failures: string[] = [];
  if (skeleton.disabled_adapter_skeleton_status !== READY_SKELETON_STATUS) {
    failures.push("disabled_adapter_skeleton_status_not_ready");
  }
  if (skeleton.recommendation_status !== READY_SKELETON_RECOMMENDATION) {
    failures.push("disabled_adapter_skeleton_recommendation_not_ready");
  }
  if (skeleton.next_recommended_slice !== READY_SKELETON_NEXT_SLICE) {
    failures.push("disabled_adapter_skeleton_next_slice_invalid");
  }
  for (const key of [
    "adapter_enabled",
    "adapter_invocation_allowed_now",
    "product_write_allowed_now",
    "product_write_authority_granted_now",
    "product_write_implementation_allowed_now",
    "transaction_execution_allowed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
  ] as const) {
    if (skeleton[key] !== false) failures.push(`${key}_not_false`);
  }
  failures.push(...validateAdapterInputContract(skeleton.adapter_input_contract));
  failures.push(
    ...validateNormalizedInputPreview(
      skeleton.normalized_adapter_input_preview,
      skeleton,
    ),
  );
  failures.push(...validateAdapterOutputContract(skeleton.adapter_output_contract));
  failures.push(
    ...validateDisabledInvocationResult(skeleton.disabled_invocation_result),
  );
  failures.push(
    ...validateFutureCommandPreview(
      skeleton.future_product_write_command_preview,
    ),
  );
  failures.push(...validateRefusalMatrix(skeleton.adapter_refusal_matrix));
  failures.push(
    ...validateFalseRecord(
      skeleton.explicit_forbidden_surfaces,
      EXPLICIT_FORBIDDEN_SURFACE_KEYS,
      "explicit_forbidden_surface",
    ),
  );
  failures.push(...validateSourceEvidence(asRecord(skeleton.source_evidence)));
  failures.push(...validateStaticBoundaryEvidence(skeleton.static_boundary_evidence));
  if (hasNonNullProductIds(skeleton)) {
    failures.push("non_null_product_or_related_id_present");
  }
  return unique(failures);
}

export function createManualNoteSingleClaimProductWriteDisabledAdapterContractTestsFingerprint(
  value: unknown,
): string {
  const json = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function validateAdapterInputContract(value: unknown): string[] {
  const contract = asRecord(value);
  const failures: string[] = [];
  const requiredInputs = asArray(contract.required_inputs).map(asString);
  const forbiddenInputs = asArray(contract.forbidden_inputs).map(asString);
  for (const inputName of REQUIRED_ADAPTER_INPUTS) {
    if (!requiredInputs.includes(inputName)) {
      failures.push(`adapter_input_contract_missing_required_${inputName}`);
    }
  }
  for (const inputName of FORBIDDEN_ADAPTER_INPUTS) {
    if (!forbiddenInputs.includes(inputName)) {
      failures.push(`adapter_input_contract_missing_forbidden_${inputName}`);
    }
  }
  return failures;
}

function validateNormalizedInputPreview(
  value: unknown,
  skeleton: JsonRecord,
): string[] {
  const preview = asRecord(value);
  const failures: string[] = [];
  if (preview.candidate_kind !== "manual_note_single_claim") {
    failures.push("normalized_candidate_kind_invalid");
  }
  for (const inputName of [
    "authority_contract_bundle_fingerprint",
    "selected_temp_claim_record_id",
    "source_operation_id",
    "source_temp_intent_id",
    "temp_idempotency_key",
  ] as const) {
    if (!asString(preview[inputName])) {
      failures.push(`normalized_${inputName}_missing`);
    }
  }
  const expectedFingerprint = asString(
    asRecord(asRecord(skeleton.source_evidence).authority_contract_bundle)
      .authority_contract_bundle_fingerprint,
  );
  if (
    expectedFingerprint &&
    preview.authority_contract_bundle_fingerprint !== expectedFingerprint
  ) {
    failures.push("normalized_authority_bundle_fingerprint_mismatch");
  }
  for (const idKey of [
    "product_claim_id",
    "proof_id",
    "evidence_id",
    "perspective_id",
    "work_item_id",
  ] as const) {
    if (preview[idKey] !== null) failures.push(`normalized_${idKey}_not_null`);
  }
  if (preview.raw_manual_note_text_included !== false) {
    failures.push("normalized_raw_manual_note_text_included_not_false");
  }
  if (preview.normalization_executed_now !== true) {
    failures.push("normalization_executed_now_not_true");
  }
  if (preview.normalization_persisted_now !== false) {
    failures.push("normalization_persisted_now_not_false");
  }
  if (preview.normalization_storage_target !== "local_artifact_only") {
    failures.push("normalization_storage_target_invalid");
  }
  if (preview.multiple_selected_temp_claims === true) {
    failures.push("normalized_multiple_selected_temp_claims_present");
  }
  for (const inputName of FORBIDDEN_ADAPTER_INPUTS) {
    if (
      inputName in preview &&
      preview[inputName] !== null &&
      preview[inputName] !== undefined &&
      preview[inputName] !== false
    ) {
      failures.push(`normalized_forbidden_${inputName}_present`);
    }
  }
  return failures;
}

function validateAdapterOutputContract(value: unknown): string[] {
  const contract = asRecord(value);
  const failures: string[] = [];
  const statuses = asArray(contract.possible_result_statuses).map(asString);
  for (const status of [
    "rejected_disabled_adapter",
    "blocked_missing_authority_contract",
    "blocked_forbidden_input",
    "blocked_product_write_not_allowed",
    "dry_noop_preview",
  ]) {
    if (!statuses.includes(status)) {
      failures.push(`adapter_output_contract_missing_status_${status}`);
    }
  }
  if (contract.default_result_status !== "rejected_disabled_adapter") {
    failures.push("adapter_output_default_status_invalid");
  }
  for (const [key, expected] of [
    ["product_write_result", null],
    ["product_claim_id", null],
    ["durable_records_created_now", false],
    ["product_db_write", false],
    ["product_id_allocation", false],
    ["db_open", false],
    ["sql_execution", false],
    ["transaction_execution", false],
  ] as const) {
    if (contract[key] !== expected) failures.push(`adapter_output_${key}_invalid`);
  }
  return failures;
}

function validateDisabledInvocationResult(value: unknown): string[] {
  const result = asRecord(value);
  const failures: string[] = [];
  for (const key of [
    "invocation_attempted_now",
    "adapter_invocation_allowed_now",
    "adapter_enabled",
    "product_write_executed_now",
    "transaction_executed_now",
    "product_db_write",
    "product_id_allocation",
    "db_open",
    "sql_execution",
    "route_added",
    "ui_write_action_added",
    "durable_records_created_now",
  ] as const) {
    if (result[key] !== false) {
      failures.push(`disabled_invocation_${key}_not_false`);
    }
  }
  if (result.result_status !== "rejected_disabled_adapter") {
    failures.push("disabled_invocation_result_status_invalid");
  }
  const reasons = asArray(result.refusal_reasons).map(asString);
  for (const reason of [
    "adapter_disabled",
    "product_write_authority_not_granted",
    "authority_contracts_defined_but_not_satisfied",
    "product_write_implementation_not_allowed",
  ]) {
    if (!reasons.includes(reason)) {
      failures.push(`disabled_invocation_missing_refusal_${reason}`);
    }
  }
  return failures;
}

function validateFutureCommandPreview(value: unknown): string[] {
  const preview = asRecord(value);
  const failures: string[] = [];
  if (preview.executable_now !== false) failures.push("future_command_executable_now_not_false");
  if (preview.product_claim_id !== null) failures.push("future_command_product_claim_id_not_null");
  if (!asString(preview.target_table_or_interface)) failures.push("future_command_target_missing");
  if (asNumber(preview.write_operation_count) !== 0) failures.push("future_command_write_operation_count_not_zero");
  if (asNumber(preview.sql_statement_count) !== 0) failures.push("future_command_sql_statement_count_not_zero");
  if (preview.command_rejected_now !== true) failures.push("future_command_rejected_now_not_true");
  if (preview.rejection_reason !== "disabled_adapter_skeleton_only") {
    failures.push("future_command_rejection_reason_invalid");
  }
  const requiredContracts = asArray(preview.would_require_contracts).map(asString);
  for (const contractId of AUTHORITY_CONTRACT_IDS) {
    if (!requiredContracts.includes(contractId)) {
      failures.push(`future_command_missing_required_contract_${contractId}`);
    }
  }
  if (asString(preview.product_write_implementation_hint)) {
    failures.push("future_command_product_write_implementation_hint_present");
  }
  return failures;
}

function validateRefusalMatrix(value: unknown): string[] {
  const matrix = asArray(value).map(asRecord);
  const failures: string[] = [];
  const reasonIds = matrix.map((entry) => asString(entry.reason_id));
  for (const reasonId of REFUSAL_REASON_IDS) {
    if (!reasonIds.includes(reasonId)) {
      failures.push(`refusal_matrix_missing_${reasonId}`);
    }
  }
  for (const entry of matrix) {
    const reasonId = asString(entry.reason_id) || "unknown";
    if (entry.requested_now !== false) failures.push(`refusal_matrix_${reasonId}_requested_now_not_false`);
    if (entry.refusal_required_now !== true) failures.push(`refusal_matrix_${reasonId}_refusal_required_now_not_true`);
    if (entry.blocks_adapter_invocation_now !== true) failures.push(`refusal_matrix_${reasonId}_blocks_adapter_invocation_now_not_true`);
    if (entry.blocks_product_write_now !== true) failures.push(`refusal_matrix_${reasonId}_blocks_product_write_now_not_true`);
  }
  return failures;
}

function validateSourceEvidence(sourceEvidence: JsonRecord): string[] {
  const failures: string[] = [];
  const authorityBundle = asRecord(sourceEvidence.authority_contract_bundle);
  if (
    authorityBundle.authority_contract_bundle_status !==
    "product_write_authority_contracts_defined_only"
  ) {
    failures.push("source_authority_bundle_status_not_ready");
  }
  if (
    authorityBundle.recommendation_status !==
    "ready_for_single_claim_product_write_disabled_adapter_skeleton"
  ) {
    failures.push("source_authority_bundle_recommendation_not_ready");
  }
  if (authorityBundle.validation_passed !== true) {
    failures.push("source_authority_bundle_validation_not_passed");
  }
  const gapSummary = asRecord(authorityBundle.authority_gap_summary);
  if (
    gapSummary.total_required_contracts !== AUTHORITY_CONTRACT_IDS.length ||
    gapSummary.satisfied_now_count !== 0 ||
    gapSummary.authority_granted_now_count !== 0 ||
    gapSummary.implementation_allowed_now_count !== 0 ||
    gapSummary.blocked_contract_count !== AUTHORITY_CONTRACT_IDS.length
  ) {
    failures.push("source_authority_gap_summary_invalid");
  }
  const harness = asRecord(sourceEvidence.dry_run_transaction_harness);
  if (
    harness.dry_run_transaction_harness_status !==
    "disabled_dry_run_transaction_harness_only"
  ) {
    failures.push("source_harness_status_not_ready");
  }
  const plan = asRecord(sourceEvidence.dry_run_transaction_plan);
  if (plan.dry_run_transaction_plan_status !== "disabled_dry_run_transaction_plan_only") {
    failures.push("source_plan_status_not_ready");
  }
  const contractTests = asRecord(
    sourceEvidence.disabled_bridge_skeleton_contract_tests,
  );
  if (contractTests.final_status !== "pass") {
    failures.push("source_disabled_bridge_skeleton_contract_tests_not_passed");
  }
  const bridgeSkeleton = asRecord(sourceEvidence.disabled_bridge_skeleton);
  if (
    bridgeSkeleton.disabled_bridge_skeleton_status !==
    "single_claim_disabled_bridge_skeleton_only"
  ) {
    failures.push("source_disabled_bridge_skeleton_not_ready");
  }
  for (const key of [
    "bridge_adapter_enabled",
    "bridge_execution_allowed_now",
    "product_write_allowed_now",
  ] as const) {
    if (bridgeSkeleton[key] !== false) {
      failures.push(`source_disabled_bridge_skeleton_${key}_not_false`);
    }
  }
  const bridgeDesign = asRecord(sourceEvidence.temp_to_product_bridge_design);
  if (bridgeDesign.bridge_design_status !== "single_claim_bridge_design_only") {
    failures.push("source_bridge_design_not_ready");
  }
  const gateDesign = asRecord(sourceEvidence.product_write_gate_design);
  if (gateDesign.gate_design_status !== "product_write_gate_design_only") {
    failures.push("source_gate_design_not_ready");
  }
  if (gateDesign.recommendation_status !== "ready_for_single_claim_bridge_design") {
    failures.push("source_gate_design_recommendation_not_ready");
  }
  return failures;
}

function validateStaticBoundaryEvidence(value: unknown): string[] {
  const evidence = asRecord(value);
  const failures: string[] = [];
  const changedFiles = asArray(
    evidence.static_boundary_changed_files_inspected ??
      evidence.changed_files_inspected,
  ).map(asString);
  const packageLines = asArray(
    evidence.static_boundary_package_added_lines_inspected ??
      evidence.package_added_lines_inspected,
  ).map(asString);
  if (changedFiles.length === 0) failures.push("static_boundary_changed_file_delta_empty");
  if (asArray(evidence.expected_changed_files).some((filePath) => !changedFiles.includes(asString(filePath)))) {
    failures.push("static_boundary_expected_files_missing");
  }
  if (packageLines.length === 0) failures.push("static_boundary_package_added_lines_empty");
  if (changedFiles.some(isSchemaDbSqlPath)) failures.push("static_boundary_schema_db_sql_changed");
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) failures.push("static_boundary_app_api_route_changed");
  if (changedFiles.some(isUiFilePath)) failures.push("static_boundary_ui_changed");
  const allowedScripts =
    asArray(evidence.allowed_package_script_names).map(asString).filter(Boolean)
      .length > 0
      ? asArray(evidence.allowed_package_script_names).map(asString)
      : [
          "smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
          "contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1",
        ];
  for (const line of packageLines) {
    if (!allowedScripts.some((scriptName) => line.includes(`"${scriptName}"`))) {
      failures.push("static_boundary_package_addition_outside_allowlist");
    }
  }
  const probeText = asString(evidence.static_boundary_probe_text);
  if (probeText) {
    if (executableSqlPattern().test(probeText)) failures.push("static_boundary_executable_sql_string_present");
    if (forbiddenImportPattern().test(probeText)) failures.push("static_boundary_forbidden_import_present");
    if (networkOrExternalCallPattern().test(probeText)) failures.push("static_boundary_network_or_external_call_present");
    if (browserPersistencePattern().test(probeText)) failures.push("static_boundary_browser_persistence_present");
    if (appServerStartupPattern().test(probeText)) failures.push("static_boundary_app_server_startup_present");
  }
  return unique(failures);
}

function validateFalseRecord(
  value: unknown,
  keys: readonly string[],
  prefix: string,
): string[] {
  const record = asRecord(value);
  const failures: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${prefix}_record_missing`);
  }
  if (Object.keys(record).length === 0) failures.push(`${prefix}_record_empty`);
  for (const key of keys) {
    if (record[key] !== false) failures.push(`${prefix}_${key}_not_false`);
  }
  return failures;
}

function hasNonNullProductIds(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => hasNonNullProductIds(item));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nestedValue]) => {
    if ((PRODUCT_ID_KEYS as readonly string[]).includes(key)) {
      return nestedValue !== null && nestedValue !== undefined;
    }
    return hasNonNullProductIds(nestedValue);
  });
}

function isUiFilePath(filePath: string): boolean {
  return /^components\//.test(filePath) || /^app\/.*\.(tsx|jsx)$/.test(filePath);
}

function isSchemaDbSqlPath(filePath: string): boolean {
  return (
    /(^|\/)(migrations?|schema|prisma|drizzle|supabase|db|sql)(\/|\.)/i.test(
      filePath,
    ) || /^lib\/db(\.ts|\/)/.test(filePath)
  );
}

function executableSqlPattern(): RegExp {
  return /\b(CREATE\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE)\b/i;
}

function forbiddenImportPattern(): RegExp {
  return /from\s+["'][^"']*(lib\/db|better-sqlite3|sqlite3|app\/|openai|provider|retrieval|rag|source-fetch|proof|evidence|work-item|perspective-write|canonical-write)[^"']*["']/i;
}

function networkOrExternalCallPattern(): RegExp {
  return /\b(fetch\s*\(|new\s+OpenAI|webhook\s*\(|sendEmail\s*\(|slack\s*\(|providerClient\s*\(|retrievalClient\s*\(|ragClient\s*\()/i;
}

function browserPersistencePattern(): RegExp {
  return new RegExp(
    `\\b(${[
      ["local", "Storage"].join(""),
      ["session", "Storage"].join(""),
      ["indexed", "DB"].join(""),
      ["document", "cookie"].join("\\."),
    ].join("|")})\\b`,
  );
}

function appServerStartupPattern(): RegExp {
  return new RegExp(
    `\\b(${[
      ["next", "dev"].join("\\s+"),
      ["npm", "run", "dev"].join("\\s+"),
      ["create", "Server"].join(""),
      "listen\\s*\\(",
    ].join("|")})`,
    "i",
  );
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonRecord)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
