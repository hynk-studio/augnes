import {
  createManualNoteSingleClaimProductWritePreflightCommandEnvelopeFingerprint,
  validateManualNoteSingleClaimProductWritePreflightCommandEnvelope,
} from "./manual-note-single-claim-product-write-preflight-command-envelope";

export const MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_VERSION =
  "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildInput = {
  preflightCommandEnvelope: unknown;
  preflightCommandEnvelopeReport?: unknown;
  upstreamSourceReports?: unknown;
  staticBoundaryEvidence?: unknown;
  sourceValidationFailureCodes?: unknown;
  contractTestCases?: unknown;
};

type ContractTestCaseFixture = JsonRecord & {
  exactness_contract: JsonRecord;
  required_case_groups: string[];
  test_case_count: number;
  test_cases: JsonRecord[];
};

type ContractCaseResult = JsonRecord & {
  case_id: string;
  case_group: string;
  expected_status: string;
  actual_status: string;
  case_status: string;
  unexpected_failure_codes: string[];
  missing_expected_failure_codes: string[];
};

const READY_ENVELOPE_STATUS = "product_write_preflight_command_envelope_only";
const READY_PREFLIGHT_RECOMMENDATION =
  "ready_for_single_claim_product_write_preflight_command_envelope_contract_tests";
const READY_PREFLIGHT_NEXT_SLICE =
  "single_claim_product_write_preflight_command_envelope_contract_tests";
const CONTRACT_SUITE_STATUS =
  "product_write_preflight_command_envelope_contract_tests_passed";
const BLOCKED_SUITE_STATUS =
  "blocked_before_product_write_preflight_command_envelope_contract_tests";
const READY_RECOMMENDATION = "ready_for_product_write_preflight_stopline";
const BLOCKED_RECOMMENDATION = "blocked_before_product_write_preflight_stopline";
const NEXT_STOPLINE = "single_claim_product_write_preflight_stopline";
const RECHECK_SLICE =
  "single_claim_product_write_preflight_command_envelope_contract_tests_recheck";

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
  "output_product_claim_id",
  "output_proof_id",
  "output_evidence_id",
  "output_perspective_id",
  "output_work_item_id",
  "normalized_product_claim_id",
  "normalized_proof_id",
  "normalized_evidence_id",
  "normalized_perspective_id",
  "normalized_work_item_id",
  "command_envelope_id",
] as const;

const REQUIRED_CASE_GROUPS = [
  "positive",
  "top_level_boundary",
  "command_input",
  "product_claim_draft_preview",
  "storage_previews",
  "source_evidence",
  "optional_traceability",
  "static_boundary",
] as const;

const REQUIRED_PACKAGE_SCRIPT_NAMES = [
  "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
  "contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1",
] as const;

export function buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTests(
  input: BuildInput,
): JsonRecord {
  const preflightCommandEnvelope = asRecord(input.preflightCommandEnvelope);
  const sourceValidationFailureCodes = asArray(
    input.sourceValidationFailureCodes,
  ).map(asString);
  const staticBoundaryEvidence = normalizeStaticBoundaryEvidence(
    input.staticBoundaryEvidence,
  );
  const contractTestCases = normalizeContractTestCases(input.contractTestCases);
  const sourceEvidence = buildSourceEvidenceSummary({
    preflightCommandEnvelope,
    preflightCommandEnvelopeReport: input.preflightCommandEnvelopeReport,
    upstreamSourceReports: input.upstreamSourceReports,
    sourceValidationFailureCodes,
    staticBoundaryEvidence,
  });
  const contractCaseBaseEnvelope = {
    ...preflightCommandEnvelope,
    static_boundary_evidence: staticBoundaryEvidence,
  };
  const contractCaseResults = contractTestCases.test_cases.map((testCase) =>
    runContractCase(testCase, contractCaseBaseEnvelope),
  );
  const unexpectedPasses = contractCaseResults.filter(
    (result) => result.case_status === "unexpected_pass",
  );
  const unexpectedFailures = contractCaseResults.filter(
    (result) => result.case_status === "unexpected_failure",
  );
  const coverageSummary = buildCoverageSummary(
    contractTestCases,
    contractCaseResults,
  );
  const noWriteContractCloseout = buildNoWriteContractCloseout();
  const suiteFailures = unique([
    ...sourceValidationFailureCodes,
    ...validatePreflightCommandEnvelopeForContract(preflightCommandEnvelope),
    ...validateStaticBoundaryEvidence(staticBoundaryEvidence),
    ...validateContractCaseFixture(contractTestCases),
    ...validateCoverageSummary(coverageSummary),
    ...unexpectedPasses.map((result) => `unexpected_pass_${asString(result.case_id)}`),
    ...unexpectedFailures.map((result) =>
      `unexpected_failure_${asString(result.case_id)}`,
    ),
  ]);
  const finalReady = suiteFailures.length === 0;
  const suiteCore = {
    contract_suite_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests",
    contract_suite_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_VERSION,
    suite_fingerprint: "",
    source_preflight_command_envelope_fingerprint: asString(
      preflightCommandEnvelope.preflight_command_envelope_fingerprint,
    ),
    contract_suite_status: finalReady
      ? CONTRACT_SUITE_STATUS
      : BLOCKED_SUITE_STATUS,
    contract_suite: {
      suite_scope:
        "fixture_only_manual_note_single_claim_product_write_preflight_command_envelope_contract_tests",
      fixture_only: true,
      product_write_implemented: false,
      command_envelope_persisted_now: false,
      product_id_allocation_now: false,
      db_open_now: false,
      sql_execution_now: false,
      transaction_execution_now: false,
      adapter_enabled_now: false,
      route_added_now: false,
      ui_write_action_added_now: false,
    },
    source_evidence: sourceEvidence,
    contract_case_results: contractCaseResults,
    coverage_summary: coverageSummary,
    no_write_contract_closeout: noWriteContractCloseout,
    static_boundary_evidence: staticBoundaryEvidence,
    validation: {
      passed: finalReady,
      failure_codes: suiteFailures,
    },
    recommendation_status: finalReady
      ? READY_RECOMMENDATION
      : BLOCKED_RECOMMENDATION,
    next_recommended_slice: finalReady ? NEXT_STOPLINE : RECHECK_SLICE,
  };
  const suiteFingerprint = createFingerprint({
    ...suiteCore,
    suite_fingerprint: "",
  });
  return {
    ...suiteCore,
    suite_fingerprint: suiteFingerprint,
  };
}

export function buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTestCases(): ContractTestCaseFixture {
  const testCases = buildDefaultContractTestCases();
  return {
    fixture_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_contract_test_cases",
    fixture_version:
      MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_VERSION,
    test_case_count: testCases.length,
    required_case_groups: [...REQUIRED_CASE_GROUPS],
    exactness_contract: {
      actual_status_equals_expected_status: true,
      expected_failure_codes_must_be_present: true,
      unexpected_failure_codes_forbidden_by_default: true,
    },
    test_cases: testCases,
  };
}

export function validatePreflightCommandEnvelopeForContract(value: unknown): string[] {
  const envelope = asRecord(value);
  const source = asRecord(envelope.source_evidence);
  const authority = asRecord(source.authority_contract_bundle);
  const authorityGap = asRecord(authority.authority_gap_summary);
  const failures = [
    ...validateManualNoteSingleClaimProductWritePreflightCommandEnvelope(value),
  ];
  if (asNumber(authorityGap.authority_granted_now_count) !== 0) {
    failures.push("source_evidence_authority_granted_now_count_not_zero");
  }
  if (asNumber(authorityGap.implementation_allowed_now_count) !== 0) {
    failures.push("source_evidence_implementation_allowed_now_count_not_zero");
  }
  return unique(failures);
}

function runContractCase(testCase: unknown, baseEnvelope: JsonRecord): ContractCaseResult {
  const contractCase = asRecord(testCase);
  const draft = cloneJson(baseEnvelope);
  applyMutation(draft, contractCase);
  const actualFailureCodes = validatePreflightCommandEnvelopeForContract(draft);
  const expectedFailureCodes = asArray(
    contractCase.expected_failure_codes,
  ).map(asString);
  const allowedUnexpectedFailureCodes = asArray(
    contractCase.allowed_unexpected_failure_codes,
  ).map(asString);
  const actualStatus = actualFailureCodes.length === 0 ? "pass" : "fail";
  const expectedStatus = asString(contractCase.expected_status) || "fail";
  const missingExpectedFailureCodes = expectedFailureCodes.filter(
    (code) => !actualFailureCodes.includes(code),
  );
  const unexpectedFailureCodes = actualFailureCodes.filter(
    (code) =>
      !expectedFailureCodes.includes(code) &&
      !allowedUnexpectedFailureCodes.includes(code),
  );
  let caseStatus = "passed";
  if (actualStatus === "pass" && expectedStatus === "fail") {
    caseStatus = "unexpected_pass";
  } else if (
    actualStatus !== expectedStatus ||
    missingExpectedFailureCodes.length > 0 ||
    unexpectedFailureCodes.length > 0
  ) {
    caseStatus = "unexpected_failure";
  }
  return {
    case_id: asString(contractCase.case_id),
    case_group: asString(contractCase.case_group),
    mutation_kind: asString(contractCase.mutation_kind),
    mutation_summary: asString(contractCase.mutation_summary),
    expected_status: expectedStatus,
    actual_status: actualStatus,
    expected_failure_codes: expectedFailureCodes,
    actual_failure_codes: actualFailureCodes,
    missing_expected_failure_codes: missingExpectedFailureCodes,
    unexpected_failure_codes: unexpectedFailureCodes,
    allowed_unexpected_failure_codes: allowedUnexpectedFailureCodes,
    case_status: caseStatus,
  };
}

function applyMutation(target: JsonRecord, testCase: JsonRecord): void {
  const mutationKind = asString(testCase.mutation_kind);
  if (mutationKind === "none") return;
  if (mutationKind === "set_path") {
    setPath(target, asArray(testCase.mutation_path).map(asString), testCase.mutation_value);
    return;
  }
  if (mutationKind === "set_paths") {
    for (const entry of asArray(testCase.mutation_entries)) {
      const record = asRecord(entry);
      setPath(target, asArray(record.path).map(asString), record.value);
    }
    return;
  }
  if (mutationKind === "delete_path") {
    deletePath(target, asArray(testCase.mutation_path).map(asString));
    return;
  }
  if (mutationKind === "remove_array_value") {
    const path = asArray(testCase.mutation_path).map(asString);
    const current = getPath(target, path);
    if (Array.isArray(current)) {
      setPath(
        target,
        path,
        current.filter((value) => value !== testCase.mutation_value),
      );
    }
    return;
  }
  if (mutationKind === "source_validation_code") {
    target.source_validation_failure_codes = [asString(testCase.mutation_value)];
  }
}

function buildDefaultContractTestCases(): JsonRecord[] {
  const cases: JsonRecord[] = [];
  const addCase = (
    caseId: string,
    caseGroup: string,
    mutationKind: string,
    mutationSummary: string,
    expectedFailureCodes: string[],
    config: JsonRecord = {},
  ) => {
    cases.push({
      case_id: caseId,
      case_group: caseGroup,
      mutation_kind: mutationKind,
      mutation_summary: mutationSummary,
      expected_status: expectedFailureCodes.length === 0 ? "pass" : "fail",
      expected_failure_codes: expectedFailureCodes,
      allowed_unexpected_failure_codes: [],
      ...config,
    });
  };
  const addSetPath = (
    caseId: string,
    caseGroup: string,
    mutationSummary: string,
    mutationPath: string[],
    mutationValue: unknown,
    expectedFailureCodes: string[],
  ) => {
    addCase(caseId, caseGroup, "set_path", mutationSummary, expectedFailureCodes, {
      mutation_path: mutationPath,
      mutation_value: mutationValue,
    });
  };
  const addSetPaths = (
    caseId: string,
    caseGroup: string,
    mutationSummary: string,
    mutationEntries: Array<{ path: string[]; value: unknown }>,
    expectedFailureCodes: string[],
  ) => {
    addCase(caseId, caseGroup, "set_paths", mutationSummary, expectedFailureCodes, {
      mutation_entries: mutationEntries,
    });
  };
  const addSourceValidation = (
    caseId: string,
    mutationSummary: string,
    failureCode: string,
  ) => {
    addCase(
      caseId,
      "optional_traceability",
      "source_validation_code",
      mutationSummary,
      [failureCode],
      { mutation_value: failureCode },
    );
  };

  for (const [caseId, summary] of [
    ["positive_committed_684_fixture_passes", "committed #684 preflight command envelope fixture passes"],
    ["positive_fixture_mode_runner_output_passes", "fixture-mode runner output is represented by the committed fixture"],
    ["positive_optional_684_matching_report_passes", "optional #684 report with matching payload passes"],
    ["positive_stale_optional_upstream_ignored_in_fixture_mode", "stale optional upstream reports are ignored in fixture mode"],
    ["positive_non_fixture_static_boundary_uses_committed_delta", "non-fixture static boundary uses a non-empty committed delta"],
    ["positive_next_slice_is_stopline_not_implementation", "contract suite advances to the stopline, not implementation"],
  ]) {
    addCase(caseId, "positive", "none", summary, []);
  }

  for (const [caseId, path, value, codes] of [
    ["preflight_status_not_ready_blocks", ["preflight_command_envelope_status"], "blocked", ["preflight_command_envelope_status_not_ready"]],
    ["recommendation_wrong_blocks", ["recommendation_status"], "ready_for_product_write_implementation", ["recommendation_status_not_ready"]],
    ["next_slice_product_write_implementation_blocks", ["next_recommended_slice"], "single_claim_product_write_implementation", ["next_recommended_slice_invalid", "product_write_implementation_recommended"]],
    ["command_envelope_created_now_false_blocks", ["command_envelope_created_now"], false, ["command_envelope_created_now_not_true"]],
    ["command_envelope_persisted_now_true_blocks", ["command_envelope_persisted_now"], true, ["preflight_command_envelope_persisted_now_not_false"]],
    ["command_envelope_executable_now_true_blocks", ["command_envelope_executable_now"], true, ["preflight_command_envelope_executable_now_not_false"]],
    ["product_write_allowed_now_true_blocks", ["product_write_allowed_now"], true, ["preflight_product_write_allowed_now_not_false"]],
    ["product_write_authority_granted_now_true_blocks", ["product_write_authority_granted_now"], true, ["preflight_product_write_authority_granted_now_not_false"]],
    ["product_write_implementation_allowed_now_true_blocks", ["product_write_implementation_allowed_now"], true, ["preflight_product_write_implementation_allowed_now_not_false"]],
    ["product_claim_id_non_null_blocks", ["product_claim_id"], "blocked-non-null", ["preflight_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["command_envelope_id_non_null_blocks", ["command_envelope_id"], "blocked-non-null", ["non_null_product_or_related_id_present"]],
    ["product_id_allocation_true_blocks", ["product_id_allocation"], true, ["preflight_product_id_allocation_not_false"]],
    ["product_db_write_true_blocks", ["product_db_write"], true, ["preflight_product_db_write_not_false"]],
    ["db_open_true_blocks", ["db_open"], true, ["preflight_db_open_not_false"]],
    ["sql_execution_true_blocks", ["sql_execution"], true, ["preflight_sql_execution_not_false"]],
    ["transaction_execution_now_true_blocks", ["transaction_execution_now"], true, ["preflight_transaction_execution_now_not_false"]],
    ["adapter_runtime_invocation_now_true_blocks", ["adapter_runtime_invocation_now"], true, ["preflight_adapter_runtime_invocation_now_not_false"]],
    ["route_added_true_blocks", ["route_added"], true, ["preflight_route_added_not_false"]],
    ["ui_write_action_added_true_blocks", ["ui_write_action_added"], true, ["preflight_ui_write_action_added_not_false"]],
    ["nested_transaction_execution_now_true_blocks", ["preflight_command_envelope", "transaction_execution_now"], true, ["nested_preflight_transaction_execution_now_not_false"]],
    ["nested_command_envelope_id_non_null_blocks", ["preflight_command_envelope", "command_envelope_id"], "blocked-non-null", ["nested_preflight_command_envelope_id_not_null", "non_null_product_or_related_id_present"]],
  ] as Array<[string, string[], unknown, string[]]>) {
    addSetPath(caseId, "top_level_boundary", `${caseId} mutates ${path.join(".")}`, path, value, codes);
  }
  for (const surface of [
    "transaction_commit",
    "transaction_rollback_execution",
    "enabled_adapter_transition",
    "schema_or_migration_change",
    "proof_evidence_write",
    "perspective_or_canonical_graph_write",
    "work_item_creation",
    "source_fetch",
    "provider_or_openai_call",
    "retrieval_or_rag",
    "external_handoff",
    "browser_persistence",
    "product_write_implementation",
    "product_write_adapter_enabled",
    "command_envelope_persistence",
  ]) {
    addSetPath(
      `explicit_forbidden_surface_${surface}_true_blocks`,
      "top_level_boundary",
      `explicit forbidden surface ${surface} true blocks`,
      ["explicit_forbidden_surfaces", surface],
      true,
      [`explicit_forbidden_surface_${surface}_not_false`],
    );
  }

  for (const [caseId, path, value, codes] of [
    ["command_input_raw_manual_note_text_included_true_blocks", ["command_envelope_input", "raw_manual_note_text_included"], true, ["command_envelope_input_raw_manual_note_text_included_not_false"]],
    ["command_input_product_claim_id_non_null_blocks", ["command_envelope_input", "product_claim_id"], "blocked-non-null", ["command_envelope_input_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["command_input_db_path_non_null_blocks", ["command_envelope_input", "db_path"], "/tmp/not-used.db", ["command_envelope_input_db_path_not_null"]],
    ["command_input_sql_text_non_null_blocks", ["command_envelope_input", "sql_text"], "select 1", ["command_envelope_input_sql_text_not_null"]],
    ["command_input_route_request_non_null_blocks", ["command_envelope_input", "route_request"], { requested: true }, ["command_envelope_input_route_request_not_null"]],
    ["command_input_ui_action_request_non_null_blocks", ["command_envelope_input", "ui_action_request"], { requested: true }, ["command_envelope_input_ui_action_request_not_null"]],
    ["command_input_operator_decision_required_false_blocks", ["command_envelope_input", "operator_decision_required"], false, ["command_envelope_input_operator_decision_required_not_true"]],
    ["command_input_operator_decision_satisfied_now_true_blocks", ["command_envelope_input", "operator_decision_satisfied_now"], true, ["command_envelope_input_operator_decision_satisfied_now"]],
    ["command_input_operator_decision_reference_non_null_blocks", ["command_envelope_input", "operator_decision_reference"], "operator-review-not-accepted", ["command_envelope_input_operator_decision_reference_not_null"]],
    ["command_input_noop_fingerprint_missing_blocks", ["command_envelope_input", "noop_invocation_report_fingerprint"], "", ["command_envelope_input_noop_invocation_report_fingerprint_missing"]],
    ["command_input_dry_run_fingerprint_missing_blocks", ["command_envelope_input", "dry_run_invocation_harness_fingerprint"], "", ["command_envelope_input_dry_run_invocation_harness_fingerprint_missing"]],
    ["command_input_authority_fingerprint_missing_blocks", ["command_envelope_input", "authority_contract_bundle_fingerprint"], "", ["command_envelope_input_authority_contract_bundle_fingerprint_missing"]],
    ["command_input_selected_temp_claim_identity_missing_blocks", ["command_envelope_input", "selected_temp_claim_record_id"], "", ["command_envelope_input_selected_temp_claim_record_id_missing"]],
    ["command_input_source_operation_identity_missing_blocks", ["command_envelope_input", "source_operation_id"], "", ["command_envelope_input_source_operation_id_missing"]],
    ["command_input_temp_idempotency_key_missing_blocks", ["command_envelope_input", "temp_idempotency_key"], "", ["command_envelope_input_temp_idempotency_key_missing"]],
  ] as Array<[string, string[], unknown, string[]]>) {
    addSetPath(caseId, "command_input", `${caseId} mutates ${path.join(".")}`, path, value, codes);
  }

  for (const [caseId, path, value, codes] of [
    ["draft_product_claim_id_non_null_blocks", ["product_claim_draft_preview", "product_claim_id"], "blocked-non-null", ["product_claim_draft_preview_product_claim_id_not_null", "non_null_product_or_related_id_present"]],
    ["draft_schema_satisfied_now_true_blocks", ["product_claim_draft_preview", "schema_satisfied_now"], true, ["product_claim_draft_preview_schema_satisfied_now"]],
    ["draft_raw_manual_note_text_included_true_blocks", ["product_claim_draft_preview", "raw_manual_note_text_included"], true, ["product_claim_draft_preview_raw_manual_note_text_included"]],
    ["draft_write_operation_count_positive_blocks", ["product_claim_draft_preview", "write_operation_count_now"], 1, ["product_claim_draft_preview_write_operation_count_now_not_zero"]],
    ["draft_db_write_count_positive_blocks", ["product_claim_draft_preview", "db_write_count_now"], 1, ["product_claim_draft_preview_db_write_count_now_not_zero"]],
    ["draft_sql_statement_count_positive_blocks", ["product_claim_draft_preview", "sql_statement_count_now"], 1, ["product_claim_draft_preview_sql_statement_count_now_not_zero"]],
    ["draft_related_ids_non_null_anywhere_blocks", ["product_claim_draft_preview", "nullability_preview", "proof_id"], "blocked-non-null", ["non_null_product_or_related_id_present"]],
  ] as Array<[string, string[], unknown, string[]]>) {
    addSetPath(caseId, "product_claim_draft_preview", `${caseId} mutates ${path.join(".")}`, path, value, codes);
  }

  for (const previewName of [
    "idempotency_preview",
    "rollback_preview",
    "audit_preview",
    "observability_preview",
  ]) {
    const label = previewName.replace("_preview", "");
    addSetPaths(
      `${label}_preview_execution_and_write_flags_true_block`,
      "storage_previews",
      `${label} preview persisted/executed/durable/DB/SQL/transaction/product/proof/Perspective/work flags true block`,
      [
        "preview_persisted_now",
        "preview_executed_now",
        "durable_write_now",
        "db_open_now",
        "sql_execution_now",
        "transaction_execution_now",
        "product_id_allocation_now",
        "product_db_write_now",
        "proof_evidence_write_now",
        "perspective_or_canonical_graph_write_now",
        "work_item_creation_now",
      ].map((key) => ({ path: [previewName, key], value: true })),
      [
        "preview_persisted_now",
        "preview_executed_now",
        "durable_write_now",
        "db_open_now",
        "sql_execution_now",
        "transaction_execution_now",
        "product_id_allocation_now",
        "product_db_write_now",
        "proof_evidence_write_now",
        "perspective_or_canonical_graph_write_now",
        "work_item_creation_now",
      ].map((key) => `${label}_preview_${key}_not_false`),
    );
    addSetPaths(
      `${label}_preview_record_ids_non_null_block`,
      "storage_previews",
      `${label} preview product/proof/evidence/Perspective/work record IDs non-null block`,
      [
        "product_claim_id",
        "product_idempotency_record_id",
        "product_rollback_record_id",
        "product_audit_record_id",
        "product_observability_record_id",
        "proof_id",
        "evidence_id",
        "perspective_id",
        "work_item_id",
      ].map((key) => ({ path: [previewName, key], value: "blocked-non-null" })),
      [
        "product_claim_id",
        "product_idempotency_record_id",
        "product_rollback_record_id",
        "product_audit_record_id",
        "product_observability_record_id",
        "proof_id",
        "evidence_id",
        "perspective_id",
        "work_item_id",
      ].map((key) => `${label}_preview_${key}_not_null`).concat([
        "non_null_product_or_related_id_present",
      ]),
    );
    addSetPaths(
      `${label}_preview_storage_contract_flags_invalid_block`,
      "storage_previews",
      `${label} preview storage contract required false and satisfied true block`,
      [
        { path: [previewName, "storage_contract_required"], value: false },
        { path: [previewName, "storage_contract_satisfied_now"], value: true },
      ],
      [
        `${label}_preview_storage_contract_not_required`,
        `${label}_preview_storage_contract_satisfied_now`,
      ],
    );
  }

  for (const [caseId, path, value, codes] of [
    ["source_noop_final_status_fail_blocks", ["source_evidence", "noop_invocation_report", "final_status"], "fail", ["source_evidence_noop_final_status_not_passed"]],
    ["source_noop_status_wrong_blocks", ["source_evidence", "noop_invocation_report", "noop_invocation_report_status"], "blocked", ["source_evidence_noop_status_not_ready"]],
    ["source_noop_recommendation_wrong_blocks", ["source_evidence", "noop_invocation_report", "recommendation_status"], "wrong", ["source_evidence_noop_recommendation_not_ready"]],
    ["source_noop_next_slice_wrong_blocks", ["source_evidence", "noop_invocation_report", "next_recommended_slice"], "wrong", ["source_evidence_noop_next_slice_invalid"]],
    ["source_noop_validation_false_blocks", ["source_evidence", "noop_invocation_report", "validation_passed"], false, ["source_evidence_noop_validation_not_passed"]],
    ["source_operator_decision_required_false_blocks", ["source_evidence", "operator_review_packet", "operator_decision_required_before_product_write"], false, ["source_evidence_operator_decision_requirement_missing"]],
    ["source_operator_decision_satisfied_true_blocks", ["source_evidence", "operator_review_packet", "operator_decision_satisfied_now"], true, ["source_evidence_operator_decision_satisfied_now"]],
    ["source_operator_may_approve_product_write_true_blocks", ["source_evidence", "operator_review_packet", "operator_may_approve_product_write_now"], true, ["source_evidence_operator_may_approve_product_write_now"]],
    ["source_no_write_closeout_product_db_write_true_blocks", ["source_evidence", "no_write_closeout", "product_db_write_now"], true, ["source_evidence_no_write_closeout_product_db_write_now_not_false"]],
    ["source_no_write_closeout_db_open_true_blocks", ["source_evidence", "no_write_closeout", "db_open_now"], true, ["source_evidence_no_write_closeout_db_open_now_not_false"]],
    ["source_no_write_closeout_sql_execution_true_blocks", ["source_evidence", "no_write_closeout", "sql_execution_now"], true, ["source_evidence_no_write_closeout_sql_execution_now_not_false"]],
    ["source_no_write_closeout_transaction_execution_true_blocks", ["source_evidence", "no_write_closeout", "transaction_execution_now"], true, ["source_evidence_no_write_closeout_transaction_execution_now_not_false"]],
    ["source_invocation_result_not_rejected_blocks", ["source_evidence", "invocation_closeout_summary", "dry_run_invocation_result_status"], "executed", ["source_evidence_invocation_result_status_invalid"]],
    ["source_invocation_failed_probe_count_positive_blocks", ["source_evidence", "invocation_closeout_summary", "failed_probe_count"], 1, ["source_evidence_invocation_failed_probe_count_not_zero"]],
    ["source_noop_preflight_preview_executable_true_blocks", ["source_evidence", "noop_preflight_command_envelope_preview", "executable_now"], true, ["source_evidence_noop_preview_executable_now"]],
    ["source_noop_preflight_preview_persisted_true_blocks", ["source_evidence", "noop_preflight_command_envelope_preview", "persisted_now"], true, ["source_evidence_noop_preview_persisted_now"]],
    ["source_noop_preflight_preview_product_write_allowed_true_blocks", ["source_evidence", "noop_preflight_command_envelope_preview", "product_write_allowed_now"], true, ["source_evidence_noop_preview_product_write_allowed_now"]],
    ["source_disabled_adapter_skeleton_adapter_enabled_true_blocks", ["source_evidence", "disabled_adapter_skeleton", "adapter_enabled"], true, ["source_evidence_disabled_adapter_skeleton_enabled"]],
    ["source_authority_granted_now_count_positive_blocks", ["source_evidence", "authority_contract_bundle", "authority_gap_summary", "authority_granted_now_count"], 1, ["source_evidence_authority_granted_now_count_not_zero"]],
    ["source_authority_implementation_allowed_now_count_positive_blocks", ["source_evidence", "authority_contract_bundle", "authority_gap_summary", "implementation_allowed_now_count"], 1, ["source_evidence_implementation_allowed_now_count_not_zero"]],
    ["source_product_write_gate_design_status_not_design_only_blocks", ["source_evidence", "product_write_gate_design", "gate_design_status"], "product_write_allowed", ["source_evidence_product_write_gate_design_status_not_ready"]],
  ] as Array<[string, string[], unknown, string[]]>) {
    addSetPath(caseId, "source_evidence", `${caseId} mutates ${path.join(".")}`, path, value, codes);
  }

  for (const [caseId, summary, code] of [
    ["optional_684_report_final_status_fail_blocks", "optional #684 report final_status fail blocks", "optional_preflight_command_envelope_report_not_passed"],
    ["optional_684_report_pass_missing_payload_blocks", "optional #684 pass report missing preflight command envelope payload blocks", "optional_preflight_command_envelope_report_missing_payload"],
    ["optional_684_report_pass_payload_fingerprint_mismatch_blocks", "optional #684 pass report payload fingerprint mismatch blocks", "optional_preflight_command_envelope_traceability_mismatch"],
    ["optional_upstream_dry_run_fingerprint_mismatch_blocks", "optional upstream dry-run fingerprint mismatch blocks", "optional_dry_run_invocation_harness_traceability_mismatch"],
    ["optional_upstream_contract_tests_suite_fingerprint_mismatch_blocks", "optional upstream disabled adapter contract-test suite fingerprint mismatch blocks", "optional_disabled_adapter_contract_tests_traceability_mismatch"],
    ["optional_upstream_contract_tests_total_cases_mismatch_blocks", "optional upstream disabled adapter contract-test total cases mismatch blocks", "optional_disabled_adapter_contract_tests_traceability_mismatch"],
    ["optional_upstream_skeleton_fingerprint_mismatch_blocks", "optional upstream disabled adapter skeleton fingerprint mismatch blocks", "optional_disabled_adapter_skeleton_traceability_mismatch"],
    ["optional_upstream_skeleton_adapter_enabled_true_blocks", "optional upstream disabled adapter skeleton enabled blocks", "optional_disabled_adapter_skeleton_traceability_mismatch"],
    ["optional_upstream_authority_fingerprint_mismatch_blocks", "optional upstream authority bundle fingerprint mismatch blocks", "optional_authority_contract_bundle_traceability_mismatch"],
    ["optional_upstream_authority_granted_now_count_positive_blocks", "optional upstream authority granted count blocks", "optional_authority_contract_bundle_traceability_mismatch"],
    ["optional_upstream_gate_design_fingerprint_mismatch_blocks", "optional upstream product write gate design fingerprint mismatch blocks", "optional_product_write_gate_design_traceability_mismatch"],
    ["optional_upstream_gate_design_product_write_allowed_blocks", "optional upstream product write gate status product_write_allowed blocks", "optional_product_write_gate_design_traceability_mismatch"],
  ]) {
    addSourceValidation(caseId, summary, code);
  }

  const expectedFilesMissing = "static_boundary_expected_files_missing";
  addSetPath(
    "static_boundary_empty_changed_file_delta_blocks",
    "static_boundary",
    "empty changed-file delta blocks",
    ["static_boundary_evidence", "static_boundary_changed_files_inspected"],
    [],
    ["static_boundary_changed_file_delta_empty", expectedFilesMissing],
  );
  addSetPath(
    "static_boundary_missing_expected_files_blocks",
    "static_boundary",
    "missing expected files blocks",
    ["static_boundary_evidence", "static_boundary_changed_files_inspected"],
    ["package.json"],
    [expectedFilesMissing],
  );
  addSetPath(
    "static_boundary_package_addition_outside_allowlist_blocks",
    "static_boundary",
    "package addition outside allowlist blocks",
    ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"],
    ['+    "product-write-implementation": "node scripts/run-product-write.mjs",'],
    [
      "static_boundary_package_addition_outside_allowlist",
      "static_boundary_expected_package_script_missing",
    ],
  );
  addSetPath(
    "static_boundary_missing_expected_package_scripts_blocks",
    "static_boundary",
    "missing expected package scripts blocks",
    ["static_boundary_evidence", "static_boundary_package_added_lines_inspected"],
    [
      '+    "smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1": "node scripts/smoke-research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1.mjs",',
    ],
    ["static_boundary_expected_package_script_missing"],
  );
  for (const [caseId, changedFile, code] of [
    ["static_boundary_app_api_route_path_blocks", "app/api/product-write/route.ts", "static_boundary_app_api_route_changed"],
    ["static_boundary_components_ui_path_blocks", "components/ProductWriteButton.tsx", "static_boundary_ui_changed"],
    ["static_boundary_app_router_page_ui_path_blocks", "app/product-write/page.tsx", "static_boundary_ui_changed"],
    ["static_boundary_schema_migration_db_sql_path_blocks", "db/product-write.sql", "static_boundary_schema_db_sql_changed"],
  ]) {
    addSetPath(
      caseId,
      "static_boundary",
      `${changedFile} in changed-file delta blocks`,
      ["static_boundary_evidence", "static_boundary_changed_files_inspected"],
      [changedFile],
      [code, expectedFilesMissing],
    );
  }
  for (const [caseId, probe, code] of [
    ["static_boundary_executable_sql_string_blocks", `${["INSERT", "INTO"].join(" ")} product_claims`, "static_boundary_executable_sql_string_present"],
    ["static_boundary_forbidden_import_blocks", `import { db } from "./lib/${["d", "b"].join("")}/client"`, "static_boundary_forbidden_import_present"],
    ["static_boundary_network_external_call_pattern_blocks", `${["fet", "ch"].join("")}("https://example.com")`, "static_boundary_network_or_external_call_present"],
    ["static_boundary_browser_persistence_pattern_blocks", ["local", "Storage"].join(""), "static_boundary_browser_persistence_present"],
    ["static_boundary_app_server_startup_pattern_blocks", ["npm", "run", "dev"].join(" "), "static_boundary_app_server_startup_present"],
  ]) {
    addSetPath(
      caseId,
      "static_boundary",
      `${caseId} probe text blocks`,
      ["static_boundary_evidence", "static_boundary_probe_text"],
      probe,
      [code],
    );
  }

  return cases;
}

function normalizeContractTestCases(value: unknown): ContractTestCaseFixture {
  if (value === undefined || value === null) {
    return buildManualNoteSingleClaimProductWritePreflightCommandEnvelopeContractTestCases();
  }
  const record = asRecord(value);
  return {
    fixture_kind: asString(record.fixture_kind),
    fixture_version: asString(record.fixture_version),
    test_case_count:
      typeof record.test_case_count === "number" ? record.test_case_count : 0,
    required_case_groups: asArray(record.required_case_groups).map(asString),
    exactness_contract: asRecord(record.exactness_contract),
    test_cases: asArray(record.test_cases).map(asRecord),
  };
}

function validateContractCaseFixture(fixture: ContractTestCaseFixture): string[] {
  const failures: string[] = [];
  const testCases = asArray(fixture.test_cases).map(asRecord);
  if (
    fixture.fixture_kind !==
    "manual_note_single_claim_product_write_preflight_command_envelope_contract_test_cases"
  ) {
    failures.push("contract_cases_fixture_kind_invalid");
  }
  if (
    fixture.fixture_version !==
    MANUAL_NOTE_SINGLE_CLAIM_PRODUCT_WRITE_PREFLIGHT_COMMAND_ENVELOPE_CONTRACT_TESTS_VERSION
  ) {
    failures.push("contract_cases_fixture_version_invalid");
  }
  if (testCases.length === 0) {
    failures.push("contract_cases_fixture_test_cases_missing");
  }
  if (testCases.length < 90 || testCases.length > 130) {
    failures.push("contract_cases_fixture_count_out_of_range");
  }
  if (asNumber(fixture.test_case_count) !== testCases.length) {
    failures.push("contract_cases_fixture_count_mismatch");
  }
  const exactnessContract = asRecord(fixture.exactness_contract);
  if (Object.keys(exactnessContract).length === 0) {
    failures.push("contract_cases_fixture_exactness_contract_missing");
  }
  if (
    exactnessContract.actual_status_equals_expected_status !== true ||
    exactnessContract.expected_failure_codes_must_be_present !== true ||
    exactnessContract.unexpected_failure_codes_forbidden_by_default !== true
  ) {
    failures.push("contract_cases_fixture_exactness_contract_invalid");
  }
  const groups = new Set(testCases.map((testCase) => asString(testCase.case_group)));
  let missingRequiredGroup = false;
  for (const group of REQUIRED_CASE_GROUPS) {
    if (!groups.has(group)) {
      failures.push(`contract_cases_fixture_group_${group}_missing`);
      missingRequiredGroup = true;
    }
  }
  if (missingRequiredGroup) {
    failures.push("contract_cases_fixture_required_case_group_missing");
  }
  for (const testCase of testCases) {
    const caseId = asString(testCase.case_id);
    const caseGroup = asString(testCase.case_group);
    const expectedStatus = asString(testCase.expected_status);
    const expectedFailureCodesIsArray = Array.isArray(
      testCase.expected_failure_codes,
    );
    const allowedUnexpectedFailureCodesIsArray = Array.isArray(
      testCase.allowed_unexpected_failure_codes,
    );
    const expectedFailureCodes = asArray(testCase.expected_failure_codes).map(
      asString,
    );
    if (!caseId) failures.push("contract_cases_fixture_case_id_missing");
    if (!caseGroup) failures.push("contract_cases_fixture_case_group_missing");
    if (expectedStatus !== "pass" && expectedStatus !== "fail") {
      failures.push("contract_cases_fixture_expected_status_invalid");
    }
    if (!expectedFailureCodesIsArray) {
      failures.push("contract_cases_fixture_expected_failure_codes_invalid");
    }
    if (!allowedUnexpectedFailureCodesIsArray) {
      failures.push("contract_cases_fixture_allowed_unexpected_failure_codes_invalid");
    }
    if (
      expectedStatus === "fail" &&
      expectedFailureCodesIsArray &&
      expectedFailureCodes.length === 0
    ) {
      failures.push("contract_cases_fixture_fail_case_missing_expected_failure_codes");
    }
    if (
      expectedStatus === "pass" &&
      expectedFailureCodesIsArray &&
      expectedFailureCodes.length > 0
    ) {
      failures.push("contract_cases_fixture_pass_case_has_expected_failure_codes");
    }
  }
  return unique(failures);
}

function buildSourceEvidenceSummary({
  preflightCommandEnvelope,
  preflightCommandEnvelopeReport,
  upstreamSourceReports,
  sourceValidationFailureCodes,
  staticBoundaryEvidence,
}: {
  preflightCommandEnvelope: JsonRecord;
  preflightCommandEnvelopeReport: unknown;
  upstreamSourceReports: unknown;
  sourceValidationFailureCodes: string[];
  staticBoundaryEvidence: JsonRecord;
}): JsonRecord {
  const report = asRecord(preflightCommandEnvelopeReport);
  const upstream = asArray(upstreamSourceReports).map(asRecord);
  return {
    preflight_command_envelope: {
      preflight_command_envelope_fingerprint: asString(
        preflightCommandEnvelope.preflight_command_envelope_fingerprint,
      ),
      preflight_command_envelope_status: asString(
        preflightCommandEnvelope.preflight_command_envelope_status,
      ),
      recommendation_status: asString(preflightCommandEnvelope.recommendation_status),
      next_recommended_slice: asString(preflightCommandEnvelope.next_recommended_slice),
      validation_passed:
        asRecord(preflightCommandEnvelope.validation).passed === true,
      command_envelope_persisted_now:
        preflightCommandEnvelope.command_envelope_persisted_now === true,
      command_envelope_executable_now:
        preflightCommandEnvelope.command_envelope_executable_now === true,
      product_write_allowed_now:
        preflightCommandEnvelope.product_write_allowed_now === true,
      product_claim_id: preflightCommandEnvelope.product_claim_id ?? null,
    },
    preflight_command_envelope_report: {
      final_status: asString(report.final_status),
      preflight_command_envelope_status: asString(
        report.preflight_command_envelope_status,
      ),
      recommendation_status: asString(report.recommendation_status),
      next_recommended_slice: asString(report.next_recommended_slice),
      payload_fingerprint: asString(
        asRecord(report.preflight_command_envelope)
          .preflight_command_envelope_fingerprint,
      ),
    },
    upstream_source_reports: upstream.map((entry) => ({
      source_label: asString(entry.source_label),
      final_status: asString(entry.final_status),
      traceability_status: asString(entry.traceability_status),
      traceability_failure_code: entry.traceability_failure_code ?? null,
      compared_fields: asArray(entry.compared_fields).map(asString),
    })),
    source_validation_failure_codes: sourceValidationFailureCodes,
    static_boundary_summary: {
      static_boundary_base_ref: asString(staticBoundaryEvidence.static_boundary_base_ref),
      static_boundary_base_mode: asString(
        staticBoundaryEvidence.static_boundary_base_mode,
      ),
      changed_file_count: asArray(
        staticBoundaryEvidence.static_boundary_changed_files_inspected,
      ).length,
      package_added_line_count: asArray(
        staticBoundaryEvidence.static_boundary_package_added_lines_inspected,
      ).length,
      used_fallback_allowlist:
        staticBoundaryEvidence.static_boundary_used_fallback_allowlist === true,
    },
  };
}

function buildCoverageSummary(
  fixture: ContractTestCaseFixture,
  caseResults: ContractCaseResult[],
): JsonRecord {
  const groups = [...new Set(caseResults.map((result) => asString(result.case_group)))];
  const failedExactnessCases = caseResults.filter(
    (result) => asString(result.case_status) !== "passed",
  );
  return {
    total_cases: caseResults.length,
    positive_cases: caseResults.filter(
      (result) => asString(result.expected_status) === "pass",
    ).length,
    expected_negative_cases: caseResults.filter(
      (result) => asString(result.expected_status) === "fail",
    ).length,
    case_groups: groups,
    required_case_groups: REQUIRED_CASE_GROUPS,
    all_required_groups_covered: REQUIRED_CASE_GROUPS.every((group) =>
      groups.includes(group),
    ),
    exactness_fields_recorded: caseResults.every(
      (result) =>
        Array.isArray(result.unexpected_failure_codes) &&
        Array.isArray(result.missing_expected_failure_codes) &&
        typeof result.actual_status === "string" &&
        typeof result.expected_status === "string" &&
        typeof result.case_status === "string",
    ),
    unexpected_pass_count: caseResults.filter(
      (result) => asString(result.case_status) === "unexpected_pass",
    ).length,
    unexpected_failure_count: caseResults.filter(
      (result) => asString(result.case_status) === "unexpected_failure",
    ).length,
    failed_exactness_case_ids: failedExactnessCases.map((result) =>
      asString(result.case_id),
    ),
    source_fixture_case_count: asNumber(fixture.test_case_count),
  };
}

function validateCoverageSummary(summary: JsonRecord): string[] {
  const failures: string[] = [];
  if (asNumber(summary.total_cases) < 90 || asNumber(summary.total_cases) > 130) {
    failures.push("coverage_summary_case_count_out_of_range");
  }
  if (summary.all_required_groups_covered !== true) {
    failures.push("coverage_summary_required_group_missing");
  }
  if (summary.exactness_fields_recorded !== true) {
    failures.push("coverage_summary_exactness_fields_missing");
  }
  if (asNumber(summary.unexpected_pass_count) !== 0) {
    failures.push("coverage_summary_unexpected_passes_present");
  }
  if (asNumber(summary.unexpected_failure_count) !== 0) {
    failures.push("coverage_summary_unexpected_failures_present");
  }
  return failures;
}

function buildNoWriteContractCloseout(): JsonRecord {
  return {
    closeout_kind:
      "manual_note_single_claim_product_write_preflight_command_envelope_contract_tests_no_write_closeout",
    closeout_status: "contract_tests_fixture_only",
    product_write_implemented: false,
    product_write_allowed_now: false,
    product_write_executed_now: false,
    command_envelope_persisted_now: false,
    command_envelope_executable_now: false,
    product_db_write_now: false,
    product_id_allocation_now: false,
    product_claim_id: null,
    command_envelope_id: null,
    db_open_now: false,
    sql_execution_now: false,
    transaction_execution_now: false,
    transaction_commit_now: false,
    transaction_rollback_execution_now: false,
    adapter_enabled_now: false,
    adapter_runtime_invocation_now: false,
    enabled_adapter_transition_now: false,
    route_added_now: false,
    ui_write_action_added_now: false,
    schema_or_migration_change_now: false,
    proof_evidence_write_now: false,
    perspective_or_canonical_graph_write_now: false,
    work_item_creation_now: false,
    source_fetch_now: false,
    provider_or_openai_call_now: false,
    retrieval_or_rag_now: false,
    external_handoff_now: false,
    browser_persistence_now: false,
    local_app_server_startup_now: false,
    db_backed_dry_run_now: false,
  };
}

function validateStaticBoundaryEvidence(value: unknown): string[] {
  const evidence = normalizeStaticBoundaryEvidence(value);
  const failures: string[] = [];
  const changedFiles = asArray(
    evidence.static_boundary_changed_files_inspected,
  ).map(asString);
  const packageLines = asArray(
    evidence.static_boundary_package_added_lines_inspected,
  ).map(asString);
  const expectedFiles = asArray(evidence.expected_changed_files).map(asString);
  const allowedScripts = asArray(evidence.allowed_package_script_names).map(asString);
  if (changedFiles.length === 0) failures.push("static_boundary_changed_file_delta_empty");
  if (expectedFiles.some((filePath) => !changedFiles.includes(filePath))) {
    failures.push("static_boundary_expected_files_missing");
  }
  if (packageLines.length === 0) failures.push("static_boundary_package_added_lines_empty");
  if (changedFiles.some(isSchemaDbSqlPath)) failures.push("static_boundary_schema_db_sql_changed");
  if (changedFiles.some((filePath) => /^app\/api\//.test(filePath))) failures.push("static_boundary_app_api_route_changed");
  if (changedFiles.some(isUiFilePath)) failures.push("static_boundary_ui_changed");
  for (const line of packageLines) {
    if (!allowedScripts.some((scriptName) => line.includes(`"${scriptName}"`))) {
      failures.push("static_boundary_package_addition_outside_allowlist");
    }
  }
  if (
    allowedScripts.some(
      (scriptName) => !packageLines.some((line) => line.includes(`"${scriptName}"`)),
    )
  ) {
    failures.push("static_boundary_expected_package_script_missing");
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

function normalizeStaticBoundaryEvidence(value: unknown): JsonRecord {
  const evidence = asRecord(value);
  return {
    static_boundary_base_ref: asString(evidence.static_boundary_base_ref),
    static_boundary_base_mode: asString(evidence.static_boundary_base_mode),
    static_boundary_base_commit: evidence.static_boundary_base_commit ?? null,
    static_boundary_compare_ref: asString(evidence.static_boundary_compare_ref),
    static_boundary_changed_files_inspected: asArray(
      evidence.static_boundary_changed_files_inspected ??
        evidence.changed_files_inspected,
    ).map(asString),
    static_boundary_package_added_lines_inspected: asArray(
      evidence.static_boundary_package_added_lines_inspected ??
        evidence.package_added_lines_inspected,
    ).map(asString),
    static_boundary_used_fallback_allowlist:
      evidence.static_boundary_used_fallback_allowlist === true ||
      evidence.used_fallback_allowlist === true,
    expected_changed_files: asArray(evidence.expected_changed_files).map(asString),
    allowed_package_script_names: asArray(
      evidence.allowed_package_script_names,
    ).map(asString),
    static_boundary_probe_text: asString(evidence.static_boundary_probe_text),
  };
}

function createFingerprint(value: unknown): string {
  return createManualNoteSingleClaimProductWritePreflightCommandEnvelopeFingerprint(
    value,
  );
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

function setPath(target: JsonRecord, path: string[], value: unknown): void {
  if (path.length === 0) return;
  let cursor: JsonRecord = target;
  for (const segment of path.slice(0, -1)) {
    const current = cursor[segment];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as JsonRecord;
  }
  cursor[path[path.length - 1]] = value;
}

function deletePath(target: JsonRecord, path: string[]): void {
  if (path.length === 0) return;
  let cursor: JsonRecord = target;
  for (const segment of path.slice(0, -1)) {
    const next = cursor[segment];
    if (!next || typeof next !== "object" || Array.isArray(next)) return;
    cursor = next as JsonRecord;
  }
  delete cursor[path[path.length - 1]];
}

function getPath(value: unknown, path: string[]): unknown {
  let cursor = value;
  for (const segment of path) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as JsonRecord)[segment];
  }
  return cursor;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function executableSqlPattern(): RegExp {
  return new RegExp(
    `\\b(${[
      ["CREATE", "TABLE"].join("\\s+"),
      ["INSERT", "INTO"].join("\\s+"),
      ["ALTER", "TABLE"].join("\\s+"),
      ["DROP", "TABLE"].join("\\s+"),
      "UPDATE\\s+\\w+",
      "DELETE\\s+FROM",
    ].join("|")})\\b`,
    "i",
  );
}

function forbiddenImportPattern(): RegExp {
  const forbidden = [
    ["lib", "db"].join("\\/"),
    "better-sqlite3",
    "sqlite3",
    ["app", ""].join("\\/"),
    "openai",
    "provider",
    "retrieval",
    "rag",
    "source-fetch",
    "proof",
    "evidence",
    "work-item",
    "perspective-write",
    "canonical-write",
  ].join("|");
  return new RegExp(`from\\s+["'][^"']*(${forbidden})[^"']*["']`, "i");
}

function networkOrExternalCallPattern(): RegExp {
  const probes = [
    ["fet", "ch"].join(""),
    ["new", "OpenAI"].join("\\s+"),
    "webhook",
    "sendEmail",
    "slack",
    "providerClient",
    "retrievalClient",
    "ragClient",
  ];
  const callProbes = probes.map((probe) =>
    probe.includes("\\s+") ? probe : `${probe}\\s*\\(`,
  );
  return new RegExp(`(?:\\b${callProbes.join("|\\b")})`, "i");
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
  return [...new Set(values.filter(Boolean))];
}
