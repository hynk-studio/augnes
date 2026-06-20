export const MANUAL_NOTE_DISABLED_WRITE_ADAPTER_CONTRACT_TEST_VERSION =
  "manual_note_disabled_write_adapter_contract_tests.v0.1" as const;

type ContractTestStatus = "pass" | "fail";

type FixtureKey =
  | "authority_design"
  | "disabled_readiness"
  | "contract_review"
  | "temp_harness"
  | "suite";

type JsonPath = Array<string | number>;

type MutationPatch = {
  target_fixture: FixtureKey;
  set?: Array<{ path: JsonPath; value: unknown }>;
  unset?: JsonPath[];
  replace?: Array<{ path: JsonPath; value: unknown; from?: unknown }>;
};

type ContractTestCase = {
  case_id: string;
  case_kind:
    | "positive_chain"
    | "negative_authority_design"
    | "negative_disabled_readiness"
    | "negative_contract_review"
    | "negative_temp_harness"
    | "fixture_drift";
  mutation_kind: string;
  expected_status: ContractTestStatus;
  expected_failure_codes: string[];
  description: string;
  mutated_fixture_patch?: MutationPatch | null;
};

type ContractTestSuiteInput = {
  authorityDesignFixture: unknown;
  disabledAdapterReadinessFixture: unknown;
  contractReviewFixture: unknown;
  tempHarnessFixture: unknown;
  testCases: ContractTestCase[];
  expectedFixtureChainFingerprint?: string | null;
  expectedCandidateReviewPacketFingerprint?: string | null;
  preservedBoundaries?: unknown;
};

type FixtureChainInput = Omit<ContractTestSuiteInput, "testCases">;

type ContractValidationFailure = {
  code: string;
  message: string;
  path?: string;
};

type ContractValidationResult = {
  status: ContractTestStatus;
  failure_codes: string[];
  failures: ContractValidationFailure[];
  chain_fingerprint: string;
};

type ContractTestCaseResult = {
  case_id: string;
  case_kind: ContractTestCase["case_kind"];
  mutation_kind: string;
  expected_status: ContractTestStatus;
  actual_status: ContractTestStatus;
  failure_codes: string[];
  expected_failure_codes: string[];
  expected_failure_codes_matched: boolean;
  passed: boolean;
  messages: string[];
};

type ContractTestReportInput = ContractTestSuiteInput & {
  suiteKind?: string;
};

const EXPECTED_NEXT_SLICES = {
  authorityDesign: "disabled_by_default_actual_promotion_write_adapter_skeleton",
  disabledReadiness: "disabled_adapter_contract_review_and_temp_execution_harness",
  contractReview: "temp_harness_review_and_fixture_only_write_adapter_contract",
  tempHarness: "fixture_only_disabled_write_adapter_contract_tests",
} as const;

const PRODUCT_ID_KEYS = new Set([
  "product_record_id",
  "canonical_id",
  "canonical_claim_id",
  "canonical_claim_id_created_now",
  "canonical_graph_edge_id",
  "canonical_graph_edge_id_created_now",
  "proof_id",
  "proof_id_created_now",
  "evidence_id",
  "evidence_id_created_now",
  "perspective_id",
  "perspective_id_created_now",
  "work_item_id",
  "work_item_id_created_now",
]);

const REQUIRED_AUTHORITY_DESIGN_SECTIONS = [
  "proposed_write_contract",
  "canonical_target_mapping_design",
  "idempotency_design",
  "rollback_design",
  "review_audit_design",
  "source_evidence_authority_design",
  "execution_boundary",
  "blocking_requirements_before_any_write",
];

const REQUIRED_READINESS_SECTIONS = [
  "source_authority_design",
  "validation_summary",
  "disabled_write_contract",
  "write_target_mapping_skeleton",
  "idempotency_skeleton",
  "rollback_skeleton",
  "review_audit_skeleton",
  "execution_boundary",
  "runtime_boundary",
  "authority",
  "local_copy_packet",
];

const REQUIRED_TEMP_HARNESS_SECTIONS = [
  "simulated_write_intents",
  "idempotency_temp_harness",
  "rollback_temp_harness",
  "review_audit_temp_harness",
  "temp_harness_boundary",
  "local_copy_packet",
];

const REQUIRED_CONTRACT_CHECKS = [
  "disabled_adapter_status_present",
  "write_execution_status_not_executable",
  "normal_product_write_disabled",
  "actual_promotion_false",
  "proof_evidence_write_false",
  "perspective_canonical_write_false",
  "canonical_graph_write_false",
  "work_item_creation_false",
  "provider_retrieval_source_fetch_false",
  "external_handoff_false",
  "persistence_false",
  "idempotency_skeleton_present",
  "rollback_skeleton_present",
  "review_audit_skeleton_present",
  "write_target_mapping_skeleton_present",
];

export function buildManualNoteDisabledWriteAdapterContractTestSuite(
  input: ContractTestSuiteInput,
) {
  const positiveFixtureChainResult =
    assertManualNoteDisabledWriteAdapterFixtureChain(input);
  const caseResults = input.testCases.map((testCase) =>
    runManualNoteDisabledWriteAdapterContractTestCase(testCase, input),
  );

  return {
    suite_kind: "manual_note_disabled_write_adapter_contract_tests",
    suite_version: MANUAL_NOTE_DISABLED_WRITE_ADAPTER_CONTRACT_TEST_VERSION,
    suite_fingerprint: createManualNoteDisabledWriteAdapterContractTestFingerprint(
      {
        positive_fixture_chain_fingerprint:
          positiveFixtureChainResult.chain_fingerprint,
        test_case_ids: input.testCases.map((testCase) => testCase.case_id),
        preserved_boundaries: input.preservedBoundaries ?? null,
      },
    ),
    positive_fixture_chain_result: positiveFixtureChainResult,
    case_results: caseResults,
  };
}

export function runManualNoteDisabledWriteAdapterContractTestCase(
  testCase: ContractTestCase,
  input?: FixtureChainInput,
): ContractTestCaseResult {
  if (!input) {
    return {
      case_id: testCase.case_id,
      case_kind: testCase.case_kind,
      mutation_kind: testCase.mutation_kind,
      expected_status: testCase.expected_status,
      actual_status: "fail",
      failure_codes: ["missing_required_section"],
      expected_failure_codes: testCase.expected_failure_codes,
      expected_failure_codes_matched: testCase.expected_failure_codes.includes(
        "missing_required_section",
      ),
      passed: testCase.expected_status === "fail",
      messages: ["Fixture chain input is required to run the contract case."],
    };
  }

  const mutatedInput = applyCaseMutation(input, testCase);
  const result = assertManualNoteDisabledWriteAdapterFixtureChain(mutatedInput);
  const expectedFailureCodesMatched =
    testCase.expected_failure_codes.length === 0
      ? result.failure_codes.length === 0
      : testCase.expected_failure_codes.every((code) =>
          result.failure_codes.includes(code),
        );
  const passed =
    result.status === testCase.expected_status && expectedFailureCodesMatched;

  return {
    case_id: testCase.case_id,
    case_kind: testCase.case_kind,
    mutation_kind: testCase.mutation_kind,
    expected_status: testCase.expected_status,
    actual_status: result.status,
    failure_codes: result.failure_codes,
    expected_failure_codes: testCase.expected_failure_codes,
    expected_failure_codes_matched: expectedFailureCodesMatched,
    passed,
    messages: result.failures.map((failure) => failure.message),
  };
}

export function assertManualNoteDisabledWriteAdapterFixtureChain(
  input: FixtureChainInput,
): ContractValidationResult {
  const failures: ContractValidationFailure[] = [];
  const authorityDesign = asRecord(input.authorityDesignFixture);
  const disabledReadiness = asRecord(input.disabledAdapterReadinessFixture);
  const contractReview = asRecord(input.contractReviewFixture);
  const tempHarness = asRecord(input.tempHarnessFixture);

  validateKindsAndVersions(
    { authorityDesign, disabledReadiness, contractReview, tempHarness },
    failures,
  );
  validatePreviewDraftIds(
    { authorityDesign, disabledReadiness, contractReview, tempHarness },
    failures,
  );
  validateFingerprints(
    {
      authorityDesign,
      disabledReadiness,
      contractReview,
      tempHarness,
      expectedCandidateReviewPacketFingerprint:
        input.expectedCandidateReviewPacketFingerprint ?? null,
    },
    failures,
  );
  validateNextSliceSequence(
    { authorityDesign, disabledReadiness, contractReview, tempHarness },
    failures,
  );
  validateRequiredSections(
    { authorityDesign, disabledReadiness, contractReview, tempHarness },
    failures,
  );
  validateNoWriteFlags(
    { authorityDesign, disabledReadiness, contractReview, tempHarness },
    failures,
  );
  validateNoProductIds(
    { authorityDesign, disabledReadiness, contractReview, tempHarness },
    failures,
  );
  validateSimulatedIntents(tempHarness, failures);
  validateContractReviewGaps(contractReview, failures);
  validateNoExternalUrlsOrRawManualNote(input, failures);

  const chainFingerprint = createManualNoteDisabledWriteAdapterContractTestFingerprint(
    {
      authority_design_packet_fingerprint: getString(
        authorityDesign,
        ["packet_fingerprint"],
      ),
      disabled_readiness_copy_fingerprint: getString(disabledReadiness, [
        "local_copy_packet",
        "fingerprint",
      ]),
      contract_review_fingerprint: getString(contractReview, [
        "review_fingerprint",
      ]),
      temp_harness_fingerprint: getString(tempHarness, [
        "harness_fingerprint",
      ]),
      preview_draft_id: getPreviewDraftId(authorityDesign),
      next_recommended_slices: [
        getString(authorityDesign, ["next_recommended_slice"]),
        getString(disabledReadiness, ["next_recommended_slice"]),
        getString(contractReview, ["next_recommended_slice"]),
        getString(tempHarness, ["next_recommended_slice"]),
      ],
    },
  );

  if (
    input.expectedFixtureChainFingerprint &&
    chainFingerprint !== input.expectedFixtureChainFingerprint
  ) {
    failures.push({
      code: "fixture_drift_detected",
      message:
        "Committed positive fixtures no longer match the expected fixture chain fingerprint.",
      path: "positive_fixture_chain.expected_fixture_chain_fingerprint",
    });
  }

  return {
    status: failures.length === 0 ? "pass" : "fail",
    failure_codes: [...new Set(failures.map((failure) => failure.code))],
    failures,
    chain_fingerprint: chainFingerprint,
  };
}

export function buildManualNoteDisabledWriteAdapterContractTestReport(
  input: ContractTestReportInput,
) {
  const suite = buildManualNoteDisabledWriteAdapterContractTestSuite(input);
  const totalCases = suite.case_results.length;
  const passedCases = suite.case_results.filter((result) => result.passed).length;
  const failedCases = totalCases - passedCases;
  const unexpectedPasses = suite.case_results.filter(
    (result) =>
      result.expected_status === "fail" && result.actual_status === "pass",
  );
  const unexpectedFailures = suite.case_results.filter(
    (result) =>
      result.expected_status === "pass" && result.actual_status === "fail",
  );

  return {
    report_kind: "manual_note_disabled_write_adapter_contract_test_report",
    report_version: MANUAL_NOTE_DISABLED_WRITE_ADAPTER_CONTRACT_TEST_VERSION,
    suite_fingerprint: suite.suite_fingerprint,
    total_cases: totalCases,
    passed_cases: passedCases,
    failed_cases: failedCases,
    unexpected_passes: unexpectedPasses,
    unexpected_failures: unexpectedFailures,
    case_results: suite.case_results,
    positive_fixture_chain_result: suite.positive_fixture_chain_result,
    preserved_boundaries: input.preservedBoundaries ?? null,
    final_status:
      suite.positive_fixture_chain_result.status === "pass" && failedCases === 0
        ? "pass"
        : "fail",
  };
}

export function createManualNoteDisabledWriteAdapterContractTestFingerprint(
  input: unknown,
) {
  return createFingerprint(input);
}

function validateKindsAndVersions(
  fixtures: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
  },
  failures: ContractValidationFailure[],
) {
  expectEqual(
    fixtures.authorityDesign.packet_kind,
    "manual_note_authority_gated_promotion_design_packet",
    "missing_required_section",
    "authority_design.packet_kind",
    failures,
  );
  expectEqual(
    fixtures.authorityDesign.packet_version,
    "manual_note_authority_gated_promotion_design_packet.v0.1",
    "missing_required_section",
    "authority_design.packet_version",
    failures,
  );
  expectEqual(
    fixtures.disabledReadiness.adapter_kind,
    "manual_note_disabled_promotion_write_adapter_readiness",
    "missing_required_section",
    "disabled_readiness.adapter_kind",
    failures,
  );
  expectEqual(
    fixtures.disabledReadiness.adapter_version,
    "manual_note_disabled_promotion_write_adapter.v0.1",
    "missing_required_section",
    "disabled_readiness.adapter_version",
    failures,
  );
  expectEqual(
    fixtures.contractReview.review_kind,
    "manual_note_disabled_adapter_contract_review",
    "missing_required_section",
    "contract_review.review_kind",
    failures,
  );
  expectEqual(
    fixtures.contractReview.review_version,
    "manual_note_disabled_adapter_contract_review.v0.1",
    "missing_required_section",
    "contract_review.review_version",
    failures,
  );
  expectEqual(
    fixtures.tempHarness.harness_kind,
    "manual_note_disabled_adapter_temp_harness",
    "missing_required_section",
    "temp_harness.harness_kind",
    failures,
  );
  expectEqual(
    fixtures.tempHarness.harness_version,
    "manual_note_disabled_adapter_temp_harness.v0.1",
    "missing_required_section",
    "temp_harness.harness_version",
    failures,
  );
}

function validatePreviewDraftIds(
  fixtures: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
  },
  failures: ContractValidationFailure[],
) {
  const ids = [
    ["authority_design.source_candidate_review_packet.preview_draft_id", getPreviewDraftId(fixtures.authorityDesign)],
    ["disabled_readiness.preview_draft_id", getString(fixtures.disabledReadiness, ["preview_draft_id"])],
    ["contract_review.preview_draft_id", getString(fixtures.contractReview, ["preview_draft_id"])],
    ["temp_harness.preview_draft_id", getString(fixtures.tempHarness, ["preview_draft_id"])],
  ] as const;
  const expected = ids[0][1];
  for (const [path, id] of ids) {
    if (!id || id !== expected) {
      failures.push({
        code: "preview_draft_id_mismatch",
        message: `${path} does not match the positive fixture chain preview draft id.`,
        path,
      });
    }
  }
}

function validateFingerprints(
  input: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
    expectedCandidateReviewPacketFingerprint: string | null;
  },
  failures: ContractValidationFailure[],
) {
  const fingerprintPaths: JsonPath[] = [
    ["packet_fingerprint"],
    ["source_candidate_review_packet", "packet_fingerprint"],
  ];
  for (const path of fingerprintPaths) {
    expectFingerprint(getValue(input.authorityDesign, path), pathToString([
      "authority_design",
      ...path,
    ]), failures);
  }
  expectFingerprint(
    getValue(input.disabledReadiness, ["local_copy_packet", "fingerprint"]),
    "disabled_readiness.local_copy_packet.fingerprint",
    failures,
  );
  expectFingerprint(
    getValue(input.contractReview, ["review_fingerprint"]),
    "contract_review.review_fingerprint",
    failures,
  );
  expectFingerprint(
    getValue(input.tempHarness, ["harness_fingerprint"]),
    "temp_harness.harness_fingerprint",
    failures,
  );

  if (
    input.expectedCandidateReviewPacketFingerprint &&
    getString(input.authorityDesign, [
      "source_candidate_review_packet",
      "packet_fingerprint",
    ]) !== input.expectedCandidateReviewPacketFingerprint
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Authority design source candidate review packet fingerprint does not match the expected positive fixture fingerprint.",
      path: "authority_design.source_candidate_review_packet.packet_fingerprint",
    });
  }

  if (
    getString(input.disabledReadiness, [
      "source_authority_design",
      "packet_fingerprint",
    ]) !== getString(input.authorityDesign, ["packet_fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Disabled readiness source authority design fingerprint does not match the authority design fixture.",
      path: "disabled_readiness.source_authority_design.packet_fingerprint",
    });
  }

  if (
    getString(input.contractReview, [
      "source_readiness",
      "local_copy_fingerprint",
    ]) !== getString(input.disabledReadiness, ["local_copy_packet", "fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Contract review source readiness local copy fingerprint does not match disabled readiness.",
      path: "contract_review.source_readiness.local_copy_fingerprint",
    });
  }

  if (
    getString(input.contractReview, [
      "source_readiness",
      "source_authority_design_packet_fingerprint",
    ]) !== getString(input.authorityDesign, ["packet_fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Contract review source authority design fingerprint does not match authority design.",
      path: "contract_review.source_readiness.source_authority_design_packet_fingerprint",
    });
  }

  if (
    getString(input.tempHarness, ["source_contract_review_fingerprint"]) !==
    getString(input.contractReview, ["review_fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Temp harness source contract review fingerprint does not match contract review.",
      path: "temp_harness.source_contract_review_fingerprint",
    });
  }
}

function validateNextSliceSequence(
  fixtures: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
  },
  failures: ContractValidationFailure[],
) {
  const expected = [
    [
      "authority_design.next_recommended_slice",
      fixtures.authorityDesign.next_recommended_slice,
      EXPECTED_NEXT_SLICES.authorityDesign,
    ],
    [
      "disabled_readiness.next_recommended_slice",
      fixtures.disabledReadiness.next_recommended_slice,
      EXPECTED_NEXT_SLICES.disabledReadiness,
    ],
    [
      "contract_review.next_recommended_slice",
      fixtures.contractReview.next_recommended_slice,
      EXPECTED_NEXT_SLICES.contractReview,
    ],
    [
      "temp_harness.next_recommended_slice",
      fixtures.tempHarness.next_recommended_slice,
      EXPECTED_NEXT_SLICES.tempHarness,
    ],
  ] as const;
  for (const [path, actual, wanted] of expected) {
    if (actual !== wanted) {
      failures.push({
        code: "missing_required_section",
        message: `${path} must be ${wanted}.`,
        path,
      });
    }
  }
}

function validateRequiredSections(
  fixtures: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
  },
  failures: ContractValidationFailure[],
) {
  for (const key of REQUIRED_AUTHORITY_DESIGN_SECTIONS) {
    expectSection(fixtures.authorityDesign, key, `authority_design.${key}`, failures);
  }
  for (const key of REQUIRED_READINESS_SECTIONS) {
    expectSection(fixtures.disabledReadiness, key, `disabled_readiness.${key}`, failures);
  }
  for (const key of REQUIRED_TEMP_HARNESS_SECTIONS) {
    expectSection(fixtures.tempHarness, key, `temp_harness.${key}`, failures);
  }
  const checks = asRecord(fixtures.contractReview.required_contract_checks);
  for (const check of REQUIRED_CONTRACT_CHECKS) {
    if (!(check in checks)) {
      failures.push({
        code: "missing_required_section",
        message: `contract_review.required_contract_checks.${check} is missing.`,
        path: `contract_review.required_contract_checks.${check}`,
      });
    }
  }
}

function validateNoWriteFlags(
  fixtures: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
  },
  failures: ContractValidationFailure[],
) {
  const falseFlagPaths: Array<[Record<string, unknown>, JsonPath, string, string]> = [
    [fixtures.authorityDesign, ["proposed_write_contract", "actual_write_route_added"], "write_flag_enabled", "authority_design.proposed_write_contract.actual_write_route_added"],
    [fixtures.authorityDesign, ["proposed_write_contract", "write_adapter_implemented"], "write_flag_enabled", "authority_design.proposed_write_contract.write_adapter_implemented"],
    [fixtures.authorityDesign, ["proposed_write_contract", "write_execution_enabled"], "write_flag_enabled", "authority_design.proposed_write_contract.write_execution_enabled"],
    [fixtures.authorityDesign, ["execution_boundary", "actual_promotion_allowed"], "actual_promotion_enabled", "authority_design.execution_boundary.actual_promotion_allowed"],
    [fixtures.authorityDesign, ["execution_boundary", "actual_write_route_added"], "write_flag_enabled", "authority_design.execution_boundary.actual_write_route_added"],
    [fixtures.authorityDesign, ["execution_boundary", "write_adapter_implemented"], "write_flag_enabled", "authority_design.execution_boundary.write_adapter_implemented"],
    [fixtures.authorityDesign, ["execution_boundary", "proof_or_evidence_writes"], "write_flag_enabled", "authority_design.execution_boundary.proof_or_evidence_writes"],
    [fixtures.authorityDesign, ["execution_boundary", "perspective_or_canonical_writes"], "write_flag_enabled", "authority_design.execution_boundary.perspective_or_canonical_writes"],
    [fixtures.authorityDesign, ["execution_boundary", "canonical_graph_write"], "write_flag_enabled", "authority_design.execution_boundary.canonical_graph_write"],
    [fixtures.authorityDesign, ["execution_boundary", "work_item_creation"], "write_flag_enabled", "authority_design.execution_boundary.work_item_creation"],
    [fixtures.authorityDesign, ["execution_boundary", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "authority_design.execution_boundary.provider_or_openai_calls"],
    [fixtures.authorityDesign, ["execution_boundary", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "authority_design.execution_boundary.retrieval_or_rag"],
    [fixtures.authorityDesign, ["execution_boundary", "source_fetching"], "forbidden_source_fetching", "authority_design.execution_boundary.source_fetching"],
    [fixtures.authorityDesign, ["execution_boundary", "external_handoff_sent"], "forbidden_external_handoff", "authority_design.execution_boundary.external_handoff_sent"],
    [fixtures.authorityDesign, ["execution_boundary", "design_packet_persisted"], "forbidden_persistence", "authority_design.execution_boundary.design_packet_persisted"],
    [fixtures.authorityDesign, ["execution_boundary", "browser_persistence"], "forbidden_persistence", "authority_design.execution_boundary.browser_persistence"],
    [fixtures.authorityDesign, ["source_evidence_authority_design", "source_fetching_performed_now"], "forbidden_source_fetching", "authority_design.source_evidence_authority_design.source_fetching_performed_now"],
    [fixtures.authorityDesign, ["source_evidence_authority_design", "source_verification_performed_now"], "forbidden_source_fetching", "authority_design.source_evidence_authority_design.source_verification_performed_now"],
    [fixtures.authorityDesign, ["source_evidence_authority_design", "proof_evidence_records_created_now"], "write_flag_enabled", "authority_design.source_evidence_authority_design.proof_evidence_records_created_now"],
    [fixtures.disabledReadiness, ["disabled_write_contract", "actual_write_route_enabled"], "write_flag_enabled", "disabled_readiness.disabled_write_contract.actual_write_route_enabled"],
    [fixtures.disabledReadiness, ["disabled_write_contract", "write_execution_enabled"], "write_flag_enabled", "disabled_readiness.disabled_write_contract.write_execution_enabled"],
    [fixtures.disabledReadiness, ["disabled_write_contract", "normal_product_write_enabled"], "product_write_enabled", "disabled_readiness.disabled_write_contract.normal_product_write_enabled"],
    [fixtures.disabledReadiness, ["execution_boundary", "normal_product_write_enabled"], "product_write_enabled", "disabled_readiness.execution_boundary.normal_product_write_enabled"],
    [fixtures.disabledReadiness, ["execution_boundary", "actual_promotion_performed"], "actual_promotion_enabled", "disabled_readiness.execution_boundary.actual_promotion_performed"],
    [fixtures.disabledReadiness, ["execution_boundary", "proof_or_evidence_writes"], "write_flag_enabled", "disabled_readiness.execution_boundary.proof_or_evidence_writes"],
    [fixtures.disabledReadiness, ["execution_boundary", "perspective_or_canonical_writes"], "write_flag_enabled", "disabled_readiness.execution_boundary.perspective_or_canonical_writes"],
    [fixtures.disabledReadiness, ["execution_boundary", "canonical_graph_write"], "write_flag_enabled", "disabled_readiness.execution_boundary.canonical_graph_write"],
    [fixtures.disabledReadiness, ["execution_boundary", "work_item_creation"], "write_flag_enabled", "disabled_readiness.execution_boundary.work_item_creation"],
    [fixtures.disabledReadiness, ["execution_boundary", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "disabled_readiness.execution_boundary.provider_or_openai_calls"],
    [fixtures.disabledReadiness, ["execution_boundary", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "disabled_readiness.execution_boundary.retrieval_or_rag"],
    [fixtures.disabledReadiness, ["execution_boundary", "source_fetching"], "forbidden_source_fetching", "disabled_readiness.execution_boundary.source_fetching"],
    [fixtures.disabledReadiness, ["execution_boundary", "external_handoff_sent"], "forbidden_external_handoff", "disabled_readiness.execution_boundary.external_handoff_sent"],
    [fixtures.disabledReadiness, ["execution_boundary", "adapter_readiness_persisted"], "forbidden_persistence", "disabled_readiness.execution_boundary.adapter_readiness_persisted"],
    [fixtures.disabledReadiness, ["execution_boundary", "browser_persistence"], "forbidden_persistence", "disabled_readiness.execution_boundary.browser_persistence"],
    [fixtures.disabledReadiness, ["local_copy_packet", "packet_persisted"], "forbidden_persistence", "disabled_readiness.local_copy_packet.packet_persisted"],
    [fixtures.contractReview, ["preserved_boundaries", "normal_product_write_enabled"], "product_write_enabled", "contract_review.preserved_boundaries.normal_product_write_enabled"],
    [fixtures.contractReview, ["preserved_boundaries", "actual_promotion_performed"], "actual_promotion_enabled", "contract_review.preserved_boundaries.actual_promotion_performed"],
    [fixtures.contractReview, ["preserved_boundaries", "proof_or_evidence_writes"], "write_flag_enabled", "contract_review.preserved_boundaries.proof_or_evidence_writes"],
    [fixtures.contractReview, ["preserved_boundaries", "perspective_or_canonical_writes"], "write_flag_enabled", "contract_review.preserved_boundaries.perspective_or_canonical_writes"],
    [fixtures.contractReview, ["preserved_boundaries", "canonical_graph_write"], "write_flag_enabled", "contract_review.preserved_boundaries.canonical_graph_write"],
    [fixtures.contractReview, ["preserved_boundaries", "work_item_creation"], "write_flag_enabled", "contract_review.preserved_boundaries.work_item_creation"],
    [fixtures.contractReview, ["preserved_boundaries", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "contract_review.preserved_boundaries.provider_or_openai_calls"],
    [fixtures.contractReview, ["preserved_boundaries", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "contract_review.preserved_boundaries.retrieval_or_rag"],
    [fixtures.contractReview, ["preserved_boundaries", "source_fetching"], "forbidden_source_fetching", "contract_review.preserved_boundaries.source_fetching"],
    [fixtures.contractReview, ["preserved_boundaries", "external_handoff_sent"], "forbidden_external_handoff", "contract_review.preserved_boundaries.external_handoff_sent"],
    [fixtures.contractReview, ["preserved_boundaries", "durable_persistence"], "forbidden_persistence", "contract_review.preserved_boundaries.durable_persistence"],
    [fixtures.contractReview, ["preserved_boundaries", "browser_persistence"], "forbidden_persistence", "contract_review.preserved_boundaries.browser_persistence"],
    [fixtures.tempHarness, ["temp_harness_boundary", "normal_product_write_enabled"], "product_write_enabled", "temp_harness.temp_harness_boundary.normal_product_write_enabled"],
    [fixtures.tempHarness, ["temp_harness_boundary", "product_db_write"], "product_write_enabled", "temp_harness.temp_harness_boundary.product_db_write"],
    [fixtures.tempHarness, ["temp_harness_boundary", "actual_promotion_performed"], "actual_promotion_enabled", "temp_harness.temp_harness_boundary.actual_promotion_performed"],
    [fixtures.tempHarness, ["temp_harness_boundary", "proof_or_evidence_writes"], "write_flag_enabled", "temp_harness.temp_harness_boundary.proof_or_evidence_writes"],
    [fixtures.tempHarness, ["temp_harness_boundary", "perspective_or_canonical_writes"], "write_flag_enabled", "temp_harness.temp_harness_boundary.perspective_or_canonical_writes"],
    [fixtures.tempHarness, ["temp_harness_boundary", "canonical_graph_write"], "write_flag_enabled", "temp_harness.temp_harness_boundary.canonical_graph_write"],
    [fixtures.tempHarness, ["temp_harness_boundary", "work_item_creation"], "write_flag_enabled", "temp_harness.temp_harness_boundary.work_item_creation"],
    [fixtures.tempHarness, ["temp_harness_boundary", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "temp_harness.temp_harness_boundary.provider_or_openai_calls"],
    [fixtures.tempHarness, ["temp_harness_boundary", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "temp_harness.temp_harness_boundary.retrieval_or_rag"],
    [fixtures.tempHarness, ["temp_harness_boundary", "source_fetching"], "forbidden_source_fetching", "temp_harness.temp_harness_boundary.source_fetching"],
    [fixtures.tempHarness, ["temp_harness_boundary", "external_handoff_sent"], "forbidden_external_handoff", "temp_harness.temp_harness_boundary.external_handoff_sent"],
    [fixtures.tempHarness, ["temp_harness_boundary", "durable_persistence"], "forbidden_persistence", "temp_harness.temp_harness_boundary.durable_persistence"],
    [fixtures.tempHarness, ["temp_harness_boundary", "browser_persistence"], "forbidden_persistence", "temp_harness.temp_harness_boundary.browser_persistence"],
    [fixtures.tempHarness, ["local_copy_packet", "packet_persisted"], "forbidden_persistence", "temp_harness.local_copy_packet.packet_persisted"],
    [fixtures.tempHarness, ["local_copy_packet", "external_handoff_sent"], "forbidden_external_handoff", "temp_harness.local_copy_packet.external_handoff_sent"],
    [fixtures.tempHarness, ["local_copy_packet", "actual_promotion_allowed"], "actual_promotion_enabled", "temp_harness.local_copy_packet.actual_promotion_allowed"],
    [fixtures.tempHarness, ["idempotency_temp_harness", "idempotency_storage_added"], "forbidden_persistence", "temp_harness.idempotency_temp_harness.idempotency_storage_added"],
    [fixtures.tempHarness, ["idempotency_temp_harness", "product_idempotency_storage_added"], "forbidden_persistence", "temp_harness.idempotency_temp_harness.product_idempotency_storage_added"],
    [fixtures.tempHarness, ["rollback_temp_harness", "rollback_storage_added"], "forbidden_persistence", "temp_harness.rollback_temp_harness.rollback_storage_added"],
    [fixtures.tempHarness, ["rollback_temp_harness", "product_rollback_performed"], "write_flag_enabled", "temp_harness.rollback_temp_harness.product_rollback_performed"],
    [fixtures.tempHarness, ["review_audit_temp_harness", "audit_record_created_now"], "forbidden_persistence", "temp_harness.review_audit_temp_harness.audit_record_created_now"],
    [fixtures.tempHarness, ["review_audit_temp_harness", "approval_history_created_now"], "forbidden_persistence", "temp_harness.review_audit_temp_harness.approval_history_created_now"],
    [fixtures.tempHarness, ["review_audit_temp_harness", "product_audit_storage_added"], "forbidden_persistence", "temp_harness.review_audit_temp_harness.product_audit_storage_added"],
  ];

  for (const [fixture, path, code, displayPath] of falseFlagPaths) {
    if (getValue(fixture, path) !== false) {
      failures.push({
        code,
        message: `${displayPath} must remain false in fixture-only contract tests.`,
        path: displayPath,
      });
    }
  }

  if (fixtures.tempHarness.execution_mode !== "temp_non_product_simulation") {
    failures.push({
      code: "invalid_execution_mode",
      message: "temp_harness.execution_mode must be temp_non_product_simulation.",
      path: "temp_harness.execution_mode",
    });
  }
  if (fixtures.tempHarness.product_write_mode !== "disabled") {
    failures.push({
      code: "invalid_product_write_mode",
      message: "temp_harness.product_write_mode must remain disabled.",
      path: "temp_harness.product_write_mode",
    });
  }
}

function validateNoProductIds(
  fixtures: {
    authorityDesign: Record<string, unknown>;
    disabledReadiness: Record<string, unknown>;
    contractReview: Record<string, unknown>;
    tempHarness: Record<string, unknown>;
  },
  failures: ContractValidationFailure[],
) {
  walkJson(
    {
      authority_design: fixtures.authorityDesign,
      disabled_readiness: fixtures.disabledReadiness,
      contract_review: fixtures.contractReview,
      temp_harness: fixtures.tempHarness,
    },
    (path, value) => {
      const key = String(path[path.length - 1] ?? "");
      if (PRODUCT_ID_KEYS.has(key) && value !== null) {
        failures.push({
          code: "non_null_product_id",
          message: `${path.join(".")} must be null in fixture-only tests.`,
          path: path.join("."),
        });
      }
    },
  );
}

function validateSimulatedIntents(
  tempHarness: Record<string, unknown>,
  failures: ContractValidationFailure[],
) {
  const groups = asRecord(tempHarness.simulated_write_intents);
  for (const [groupName, rawGroup] of Object.entries(groups)) {
    if (!Array.isArray(rawGroup)) {
      failures.push({
        code: "missing_required_section",
        message: `temp_harness.simulated_write_intents.${groupName} must be an array.`,
        path: `temp_harness.simulated_write_intents.${groupName}`,
      });
      continue;
    }
    for (const [index, rawIntent] of rawGroup.entries()) {
      const intent = asRecord(rawIntent);
      const basePath = `temp_harness.simulated_write_intents.${groupName}.${index}`;
      if (
        typeof intent.simulated_intent_id !== "string" ||
        !intent.simulated_intent_id.startsWith("temp-intent:")
      ) {
        failures.push({
          code: "invalid_temp_intent_id",
          message: `${basePath}.simulated_intent_id must start with temp-intent:.`,
          path: `${basePath}.simulated_intent_id`,
        });
      }
      for (const [key, expected] of [
        ["write_performed_now", false],
        ["product_write_allowed", false],
        ["temp_harness_only", true],
      ] as const) {
        if (intent[key] !== expected) {
          failures.push({
            code: key === "temp_harness_only" ? "missing_required_section" : "write_flag_enabled",
            message: `${basePath}.${key} must be ${String(expected)}.`,
            path: `${basePath}.${key}`,
          });
        }
      }
    }
  }
}

function validateContractReviewGaps(
  contractReview: Record<string, unknown>,
  failures: ContractValidationFailure[],
) {
  const checks = asRecord(contractReview.required_contract_checks);
  const gaps = Array.isArray(contractReview.contract_gaps)
    ? contractReview.contract_gaps
    : [];
  const falseChecks = Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => key);

  if (falseChecks.length > 0 && gaps.length === 0) {
    failures.push({
      code: "missing_contract_gap",
      message:
        "contract_review.contract_gaps must include blockers when a required contract check is false.",
      path: "contract_review.contract_gaps",
    });
  }

  if (contractReview.contract_status === "ready_for_temp_harness" && gaps.length > 0) {
    failures.push({
      code: "missing_contract_gap",
      message:
        "contract_review.contract_status cannot be ready_for_temp_harness when contract gaps exist.",
      path: "contract_review.contract_status",
    });
  }
}

function validateNoExternalUrlsOrRawManualNote(
  input: FixtureChainInput,
  failures: ContractValidationFailure[],
) {
  const serialized = JSON.stringify({
    authority_design: input.authorityDesignFixture,
    disabled_readiness: input.disabledAdapterReadinessFixture,
    contract_review: input.contractReviewFixture,
    temp_harness: input.tempHarnessFixture,
  });
  if (/https?:\/\//i.test(serialized)) {
    failures.push({
      code: "forbidden_external_handoff",
      message: "Fixture chain must not contain external URLs.",
    });
  }
  if (/raw manual note|manual note raw text|verbatim manual note/i.test(serialized)) {
    failures.push({
      code: "missing_required_section",
      message: "Fixture chain must not contain raw manual note text.",
    });
  }
}

function applyCaseMutation(
  input: FixtureChainInput,
  testCase: ContractTestCase,
): FixtureChainInput {
  const clone = {
    authorityDesignFixture: deepClone(input.authorityDesignFixture),
    disabledAdapterReadinessFixture: deepClone(input.disabledAdapterReadinessFixture),
    contractReviewFixture: deepClone(input.contractReviewFixture),
    tempHarnessFixture: deepClone(input.tempHarnessFixture),
    expectedFixtureChainFingerprint: input.expectedFixtureChainFingerprint ?? null,
    expectedCandidateReviewPacketFingerprint:
      input.expectedCandidateReviewPacketFingerprint ?? null,
    preservedBoundaries: deepClone(input.preservedBoundaries ?? null),
  };
  const patch = testCase.mutated_fixture_patch;
  if (!patch) return clone;

  const target = getPatchTarget(clone, patch.target_fixture);
  for (const entry of patch.set ?? []) {
    setValue(target, entry.path, deepClone(entry.value));
  }
  for (const entry of patch.replace ?? []) {
    setValue(target, entry.path, deepClone(entry.value));
  }
  for (const path of patch.unset ?? []) {
    unsetValue(target, path);
  }
  return clone;
}

function getPatchTarget(input: FixtureChainInput, target: FixtureKey): unknown {
  if (target === "authority_design") return input.authorityDesignFixture;
  if (target === "disabled_readiness") return input.disabledAdapterReadinessFixture;
  if (target === "contract_review") return input.contractReviewFixture;
  if (target === "temp_harness") return input.tempHarnessFixture;
  return input;
}

function expectEqual(
  actual: unknown,
  expected: unknown,
  code: string,
  path: string,
  failures: ContractValidationFailure[],
) {
  if (actual !== expected) {
    failures.push({
      code,
      message: `${path} must be ${String(expected)}.`,
      path,
    });
  }
}

function expectSection(
  fixture: Record<string, unknown>,
  key: string,
  path: string,
  failures: ContractValidationFailure[],
) {
  if (!(key in fixture) || fixture[key] === null || fixture[key] === undefined) {
    failures.push({
      code: "missing_required_section",
      message: `${path} is required.`,
      path,
    });
  }
}

function expectFingerprint(
  value: unknown,
  path: string,
  failures: ContractValidationFailure[],
) {
  if (typeof value !== "string" || !/^fnv1a32:[0-9a-f]{8}$/.test(value)) {
    failures.push({
      code: "fingerprint_mismatch",
      message: `${path} must be an fnv1a32 fingerprint.`,
      path,
    });
  }
}

function getPreviewDraftId(authorityDesign: Record<string, unknown>) {
  return getString(authorityDesign, [
    "source_candidate_review_packet",
    "preview_draft_id",
  ]);
}

function getString(fixture: Record<string, unknown>, path: JsonPath) {
  const value = getValue(fixture, path);
  return typeof value === "string" ? value : null;
}

function getValue(value: unknown, path: JsonPath): unknown {
  let cursor = value;
  for (const segment of path) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof segment === "number") {
      cursor = Array.isArray(cursor) ? cursor[segment] : undefined;
      continue;
    }
    cursor = asRecord(cursor)[segment];
  }
  return cursor;
}

function setValue(target: unknown, path: JsonPath, value: unknown) {
  if (path.length === 0) return;
  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const nextSegment = path[index + 1];
    const record = cursor as Record<string | number, unknown>;
    if (record[segment] === undefined || record[segment] === null) {
      record[segment] = typeof nextSegment === "number" ? [] : {};
    }
    cursor = record[segment];
  }
  (cursor as Record<string | number, unknown>)[path[path.length - 1]] = value;
}

function unsetValue(target: unknown, path: JsonPath) {
  if (path.length === 0) return;
  let cursor = target;
  for (const segment of path.slice(0, -1)) {
    cursor = (cursor as Record<string | number, unknown>)[segment];
    if (cursor === null || cursor === undefined) return;
  }
  Reflect.deleteProperty(
    cursor as Record<string | number, unknown>,
    path[path.length - 1],
  );
}

function pathToString(path: JsonPath) {
  return path.map(String).join(".");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function walkJson(value: unknown, visitor: (path: JsonPath, value: unknown) => void) {
  visit(value, []);

  function visit(item: unknown, path: JsonPath) {
    visitor(path, item);
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, [...path, index]));
      return;
    }
    if (item && typeof item === "object") {
      for (const [key, child] of Object.entries(item)) {
        visit(child, [...path, key]);
      }
    }
  }
}

function createFingerprint(value: unknown) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}
