import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTIFACT_DIR = "/tmp/augnes-disabled-write-adapter-contract-tests-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const CASE_RESULTS_PATH = path.join(ARTIFACT_DIR, "case-results.json");
const TEST_CASES_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-contract-test-cases.v0.1.json";
const VERSION = "manual_note_disabled_write_adapter_contract_tests.v0.1";
const FINGERPRINT_PATTERN = /^fnv1a32:[0-9a-f]{8}$/;
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

const suiteFixture = await readJson(TEST_CASES_FIXTURE_PATH);
const positiveChain = suiteFixture.positive_fixture_chain;
const fixtures = {
  authorityDesignFixture: await readJson(
    positiveChain.authority_design_fixture_path,
  ),
  disabledAdapterReadinessFixture: await readJson(
    positiveChain.disabled_adapter_readiness_fixture_path,
  ),
  contractReviewFixture: await readJson(positiveChain.contract_review_fixture_path),
  tempHarnessFixture: await readJson(positiveChain.temp_harness_fixture_path),
  expectedFixtureChainFingerprint:
    positiveChain.expected_fixture_chain_fingerprint ?? null,
  expectedCandidateReviewPacketFingerprint:
    positiveChain.expected_candidate_review_packet_fingerprint ?? null,
  preservedBoundaries: suiteFixture.preserved_boundaries,
};

const positiveFixtureChainResult = assertFixtureChain(fixtures);
const caseResults = suiteFixture.test_cases.map((testCase) =>
  runCase(testCase, fixtures),
);
const totalCases = caseResults.length;
const passedCases = caseResults.filter((result) => result.passed).length;
const failedCases = totalCases - passedCases;
const unexpectedPasses = caseResults.filter(
  (result) => result.expected_status === "fail" && result.actual_status === "pass",
);
const unexpectedFailures = caseResults.filter(
  (result) => result.expected_status === "pass" && result.actual_status === "fail",
);
const report = {
  report_kind: "manual_note_disabled_write_adapter_contract_test_report",
  report_version: VERSION,
  suite_fingerprint: fingerprint({
    positive_fixture_chain_fingerprint:
      positiveFixtureChainResult.chain_fingerprint,
    test_case_ids: suiteFixture.test_cases.map((testCase) => testCase.case_id),
    preserved_boundaries: suiteFixture.preserved_boundaries,
  }),
  source_fixture: TEST_CASES_FIXTURE_PATH,
  artifact_dir: ARTIFACT_DIR,
  artifact_paths: {
    report: REPORT_PATH,
    case_results: CASE_RESULTS_PATH,
  },
  total_cases: totalCases,
  passed_cases: passedCases,
  failed_cases: failedCases,
  unexpected_passes: unexpectedPasses,
  unexpected_failures: unexpectedFailures,
  case_results: caseResults,
  positive_fixture_chain_result: positiveFixtureChainResult,
  preserved_boundaries: suiteFixture.preserved_boundaries,
  final_status:
    positiveFixtureChainResult.status === "pass" && failedCases === 0
      ? "pass"
      : "fail",
};

await mkdir(ARTIFACT_DIR, { recursive: true });
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(CASE_RESULTS_PATH, `${JSON.stringify(caseResults, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      contracts: "research-candidate-disabled-write-adapter-contract-tests-v0-1",
      final_status: report.final_status,
      positive_fixture_chain_fingerprint:
        positiveFixtureChainResult.chain_fingerprint,
      artifact_paths: report.artifact_paths,
    },
    null,
    2,
  ),
);

if (report.final_status !== "pass") {
  process.exitCode = 1;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function runCase(testCase, sourceFixtures) {
  const mutated = applyMutation(sourceFixtures, testCase.mutated_fixture_patch);
  const result = assertFixtureChain(mutated);
  const expectedCodes = testCase.expected_failure_codes ?? [];
  const expectedFailureCodesMatched =
    expectedCodes.length === 0
      ? result.failure_codes.length === 0
      : expectedCodes.every((code) => result.failure_codes.includes(code));
  const passed =
    result.status === testCase.expected_status && expectedFailureCodesMatched;
  return {
    case_id: testCase.case_id,
    case_kind: testCase.case_kind,
    mutation_kind: testCase.mutation_kind,
    expected_status: testCase.expected_status,
    actual_status: result.status,
    failure_codes: result.failure_codes,
    expected_failure_codes: expectedCodes,
    expected_failure_codes_matched: expectedFailureCodesMatched,
    passed,
    messages: result.failures.map((failure) => failure.message),
  };
}

function assertFixtureChain(input) {
  const failures = [];
  const authority = record(input.authorityDesignFixture);
  const readiness = record(input.disabledAdapterReadinessFixture);
  const review = record(input.contractReviewFixture);
  const harness = record(input.tempHarnessFixture);

  requireValue(
    authority.packet_kind,
    "manual_note_authority_gated_promotion_design_packet",
    failures,
    "authority_design.packet_kind",
  );
  requireValue(
    authority.packet_version,
    "manual_note_authority_gated_promotion_design_packet.v0.1",
    failures,
    "authority_design.packet_version",
  );
  requireValue(
    readiness.adapter_kind,
    "manual_note_disabled_promotion_write_adapter_readiness",
    failures,
    "disabled_readiness.adapter_kind",
  );
  requireValue(
    readiness.adapter_version,
    "manual_note_disabled_promotion_write_adapter.v0.1",
    failures,
    "disabled_readiness.adapter_version",
  );
  requireValue(
    review.review_kind,
    "manual_note_disabled_adapter_contract_review",
    failures,
    "contract_review.review_kind",
  );
  requireValue(
    review.review_version,
    "manual_note_disabled_adapter_contract_review.v0.1",
    failures,
    "contract_review.review_version",
  );
  requireValue(
    harness.harness_kind,
    "manual_note_disabled_adapter_temp_harness",
    failures,
    "temp_harness.harness_kind",
  );
  requireValue(
    harness.harness_version,
    "manual_note_disabled_adapter_temp_harness.v0.1",
    failures,
    "temp_harness.harness_version",
  );

  validatePreviewDraftIds({ authority, readiness, review, harness }, failures);
  validateFingerprints(
    {
      authority,
      readiness,
      review,
      harness,
      expectedCandidateReviewPacketFingerprint:
        input.expectedCandidateReviewPacketFingerprint,
    },
    failures,
  );
  validateNextSlices({ authority, readiness, review, harness }, failures);
  validateRequiredSections({ authority, readiness, review, harness }, failures);
  validateFalseFlags({ authority, readiness, review, harness }, failures);
  validateNullProductIds({ authority, readiness, review, harness }, failures);
  validateTempIntents(harness, failures);
  validateContractGaps(review, failures);
  validateNoExternalUrlsOrRawText(input, failures);

  const chainFingerprint = fingerprint({
    authority_design_packet_fingerprint: stringAt(authority, [
      "packet_fingerprint",
    ]),
    disabled_readiness_copy_fingerprint: stringAt(readiness, [
      "local_copy_packet",
      "fingerprint",
    ]),
    contract_review_fingerprint: stringAt(review, ["review_fingerprint"]),
    temp_harness_fingerprint: stringAt(harness, ["harness_fingerprint"]),
    preview_draft_id: stringAt(authority, [
      "source_candidate_review_packet",
      "preview_draft_id",
    ]),
    next_recommended_slices: [
      authority.next_recommended_slice,
      readiness.next_recommended_slice,
      review.next_recommended_slice,
      harness.next_recommended_slice,
    ],
  });

  if (
    input.expectedFixtureChainFingerprint &&
    input.expectedFixtureChainFingerprint !== chainFingerprint
  ) {
    failures.push({
      code: "fixture_drift_detected",
      message:
        "Committed positive fixtures do not match the expected fixture chain fingerprint.",
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

function validatePreviewDraftIds({ authority, readiness, review, harness }, failures) {
  const expected = stringAt(authority, [
    "source_candidate_review_packet",
    "preview_draft_id",
  ]);
  for (const [pathName, value] of [
    ["authority_design.source_candidate_review_packet.preview_draft_id", expected],
    ["disabled_readiness.preview_draft_id", readiness.preview_draft_id],
    ["contract_review.preview_draft_id", review.preview_draft_id],
    ["temp_harness.preview_draft_id", harness.preview_draft_id],
  ]) {
    if (!value || value !== expected) {
      failures.push({
        code: "preview_draft_id_mismatch",
        message: `${pathName} does not match the fixture chain preview draft id.`,
        path: pathName,
      });
    }
  }
}

function validateFingerprints(input, failures) {
  const fingerprintPaths = [
    [input.authority, ["packet_fingerprint"], "authority_design.packet_fingerprint"],
    [
      input.authority,
      ["source_candidate_review_packet", "packet_fingerprint"],
      "authority_design.source_candidate_review_packet.packet_fingerprint",
    ],
    [
      input.readiness,
      ["local_copy_packet", "fingerprint"],
      "disabled_readiness.local_copy_packet.fingerprint",
    ],
    [input.review, ["review_fingerprint"], "contract_review.review_fingerprint"],
    [input.harness, ["harness_fingerprint"], "temp_harness.harness_fingerprint"],
  ];
  for (const [fixture, pathSegments, pathName] of fingerprintPaths) {
    const value = valueAt(fixture, pathSegments);
    if (typeof value !== "string" || !FINGERPRINT_PATTERN.test(value)) {
      failures.push({
        code: "fingerprint_mismatch",
        message: `${pathName} must be an fnv1a32 fingerprint.`,
        path: pathName,
      });
    }
  }

  if (
    input.expectedCandidateReviewPacketFingerprint &&
    stringAt(input.authority, [
      "source_candidate_review_packet",
      "packet_fingerprint",
    ]) !== input.expectedCandidateReviewPacketFingerprint
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Authority design source candidate review fingerprint does not match the expected fixture fingerprint.",
      path: "authority_design.source_candidate_review_packet.packet_fingerprint",
    });
  }
  if (
    stringAt(input.readiness, ["source_authority_design", "packet_fingerprint"]) !==
    stringAt(input.authority, ["packet_fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Disabled readiness source authority design fingerprint does not match the authority design fixture.",
      path: "disabled_readiness.source_authority_design.packet_fingerprint",
    });
  }
  if (
    stringAt(input.review, ["source_readiness", "local_copy_fingerprint"]) !==
    stringAt(input.readiness, ["local_copy_packet", "fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Contract review source readiness fingerprint does not match disabled readiness.",
      path: "contract_review.source_readiness.local_copy_fingerprint",
    });
  }
  if (
    stringAt(input.review, [
      "source_readiness",
      "source_authority_design_packet_fingerprint",
    ]) !== stringAt(input.authority, ["packet_fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Contract review source authority design fingerprint does not match authority design.",
      path: "contract_review.source_readiness.source_authority_design_packet_fingerprint",
    });
  }
  if (
    stringAt(input.harness, ["source_contract_review_fingerprint"]) !==
    stringAt(input.review, ["review_fingerprint"])
  ) {
    failures.push({
      code: "fingerprint_mismatch",
      message:
        "Temp harness source contract review fingerprint does not match contract review.",
      path: "temp_harness.source_contract_review_fingerprint",
    });
  }
}

function validateNextSlices({ authority, readiness, review, harness }, failures) {
  for (const [pathName, value, expected] of [
    [
      "authority_design.next_recommended_slice",
      authority.next_recommended_slice,
      "disabled_by_default_actual_promotion_write_adapter_skeleton",
    ],
    [
      "disabled_readiness.next_recommended_slice",
      readiness.next_recommended_slice,
      "disabled_adapter_contract_review_and_temp_execution_harness",
    ],
    [
      "contract_review.next_recommended_slice",
      review.next_recommended_slice,
      "temp_harness_review_and_fixture_only_write_adapter_contract",
    ],
    [
      "temp_harness.next_recommended_slice",
      harness.next_recommended_slice,
      "fixture_only_disabled_write_adapter_contract_tests",
    ],
  ]) {
    if (value !== expected) {
      failures.push({
        code: "missing_required_section",
        message: `${pathName} must be ${expected}.`,
        path: pathName,
      });
    }
  }
}

function validateRequiredSections({ authority, readiness, review, harness }, failures) {
  for (const [fixture, prefix, keys] of [
    [
      authority,
      "authority_design",
      [
        "proposed_write_contract",
        "canonical_target_mapping_design",
        "idempotency_design",
        "rollback_design",
        "review_audit_design",
        "source_evidence_authority_design",
        "execution_boundary",
        "blocking_requirements_before_any_write",
      ],
    ],
    [
      readiness,
      "disabled_readiness",
      [
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
      ],
    ],
    [
      harness,
      "temp_harness",
      [
        "simulated_write_intents",
        "idempotency_temp_harness",
        "rollback_temp_harness",
        "review_audit_temp_harness",
        "temp_harness_boundary",
        "local_copy_packet",
      ],
    ],
  ]) {
    for (const key of keys) {
      if (!(key in fixture) || fixture[key] === null || fixture[key] === undefined) {
        failures.push({
          code: "missing_required_section",
          message: `${prefix}.${key} is required.`,
          path: `${prefix}.${key}`,
        });
      }
    }
  }

  const requiredChecks = [
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
  const checks = record(review.required_contract_checks);
  for (const check of requiredChecks) {
    if (!(check in checks)) {
      failures.push({
        code: "missing_required_section",
        message: `contract_review.required_contract_checks.${check} is required.`,
        path: `contract_review.required_contract_checks.${check}`,
      });
    }
  }
}

function validateFalseFlags({ authority, readiness, review, harness }, failures) {
  const checks = [
    [authority, ["proposed_write_contract", "actual_write_route_added"], "write_flag_enabled", "authority_design.proposed_write_contract.actual_write_route_added"],
    [authority, ["proposed_write_contract", "write_adapter_implemented"], "write_flag_enabled", "authority_design.proposed_write_contract.write_adapter_implemented"],
    [authority, ["proposed_write_contract", "write_execution_enabled"], "write_flag_enabled", "authority_design.proposed_write_contract.write_execution_enabled"],
    [authority, ["execution_boundary", "actual_promotion_allowed"], "actual_promotion_enabled", "authority_design.execution_boundary.actual_promotion_allowed"],
    [authority, ["execution_boundary", "proof_or_evidence_writes"], "write_flag_enabled", "authority_design.execution_boundary.proof_or_evidence_writes"],
    [authority, ["execution_boundary", "perspective_or_canonical_writes"], "write_flag_enabled", "authority_design.execution_boundary.perspective_or_canonical_writes"],
    [authority, ["execution_boundary", "canonical_graph_write"], "write_flag_enabled", "authority_design.execution_boundary.canonical_graph_write"],
    [authority, ["execution_boundary", "work_item_creation"], "write_flag_enabled", "authority_design.execution_boundary.work_item_creation"],
    [authority, ["execution_boundary", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "authority_design.execution_boundary.provider_or_openai_calls"],
    [authority, ["execution_boundary", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "authority_design.execution_boundary.retrieval_or_rag"],
    [authority, ["execution_boundary", "source_fetching"], "forbidden_source_fetching", "authority_design.execution_boundary.source_fetching"],
    [authority, ["execution_boundary", "external_handoff_sent"], "forbidden_external_handoff", "authority_design.execution_boundary.external_handoff_sent"],
    [authority, ["execution_boundary", "design_packet_persisted"], "forbidden_persistence", "authority_design.execution_boundary.design_packet_persisted"],
    [authority, ["execution_boundary", "browser_persistence"], "forbidden_persistence", "authority_design.execution_boundary.browser_persistence"],
    [authority, ["source_evidence_authority_design", "source_fetching_performed_now"], "forbidden_source_fetching", "authority_design.source_evidence_authority_design.source_fetching_performed_now"],
    [authority, ["source_evidence_authority_design", "source_verification_performed_now"], "forbidden_source_fetching", "authority_design.source_evidence_authority_design.source_verification_performed_now"],
    [authority, ["source_evidence_authority_design", "proof_evidence_records_created_now"], "write_flag_enabled", "authority_design.source_evidence_authority_design.proof_evidence_records_created_now"],
    [readiness, ["disabled_write_contract", "actual_write_route_enabled"], "write_flag_enabled", "disabled_readiness.disabled_write_contract.actual_write_route_enabled"],
    [readiness, ["disabled_write_contract", "write_execution_enabled"], "write_flag_enabled", "disabled_readiness.disabled_write_contract.write_execution_enabled"],
    [readiness, ["disabled_write_contract", "normal_product_write_enabled"], "product_write_enabled", "disabled_readiness.disabled_write_contract.normal_product_write_enabled"],
    [readiness, ["execution_boundary", "normal_product_write_enabled"], "product_write_enabled", "disabled_readiness.execution_boundary.normal_product_write_enabled"],
    [readiness, ["execution_boundary", "actual_promotion_performed"], "actual_promotion_enabled", "disabled_readiness.execution_boundary.actual_promotion_performed"],
    [readiness, ["execution_boundary", "proof_or_evidence_writes"], "write_flag_enabled", "disabled_readiness.execution_boundary.proof_or_evidence_writes"],
    [readiness, ["execution_boundary", "perspective_or_canonical_writes"], "write_flag_enabled", "disabled_readiness.execution_boundary.perspective_or_canonical_writes"],
    [readiness, ["execution_boundary", "canonical_graph_write"], "write_flag_enabled", "disabled_readiness.execution_boundary.canonical_graph_write"],
    [readiness, ["execution_boundary", "work_item_creation"], "write_flag_enabled", "disabled_readiness.execution_boundary.work_item_creation"],
    [readiness, ["execution_boundary", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "disabled_readiness.execution_boundary.provider_or_openai_calls"],
    [readiness, ["execution_boundary", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "disabled_readiness.execution_boundary.retrieval_or_rag"],
    [readiness, ["execution_boundary", "source_fetching"], "forbidden_source_fetching", "disabled_readiness.execution_boundary.source_fetching"],
    [readiness, ["execution_boundary", "external_handoff_sent"], "forbidden_external_handoff", "disabled_readiness.execution_boundary.external_handoff_sent"],
    [readiness, ["execution_boundary", "adapter_readiness_persisted"], "forbidden_persistence", "disabled_readiness.execution_boundary.adapter_readiness_persisted"],
    [readiness, ["execution_boundary", "browser_persistence"], "forbidden_persistence", "disabled_readiness.execution_boundary.browser_persistence"],
    [readiness, ["local_copy_packet", "packet_persisted"], "forbidden_persistence", "disabled_readiness.local_copy_packet.packet_persisted"],
    [review, ["preserved_boundaries", "normal_product_write_enabled"], "product_write_enabled", "contract_review.preserved_boundaries.normal_product_write_enabled"],
    [review, ["preserved_boundaries", "actual_promotion_performed"], "actual_promotion_enabled", "contract_review.preserved_boundaries.actual_promotion_performed"],
    [review, ["preserved_boundaries", "proof_or_evidence_writes"], "write_flag_enabled", "contract_review.preserved_boundaries.proof_or_evidence_writes"],
    [review, ["preserved_boundaries", "perspective_or_canonical_writes"], "write_flag_enabled", "contract_review.preserved_boundaries.perspective_or_canonical_writes"],
    [review, ["preserved_boundaries", "canonical_graph_write"], "write_flag_enabled", "contract_review.preserved_boundaries.canonical_graph_write"],
    [review, ["preserved_boundaries", "work_item_creation"], "write_flag_enabled", "contract_review.preserved_boundaries.work_item_creation"],
    [review, ["preserved_boundaries", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "contract_review.preserved_boundaries.provider_or_openai_calls"],
    [review, ["preserved_boundaries", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "contract_review.preserved_boundaries.retrieval_or_rag"],
    [review, ["preserved_boundaries", "source_fetching"], "forbidden_source_fetching", "contract_review.preserved_boundaries.source_fetching"],
    [review, ["preserved_boundaries", "external_handoff_sent"], "forbidden_external_handoff", "contract_review.preserved_boundaries.external_handoff_sent"],
    [review, ["preserved_boundaries", "durable_persistence"], "forbidden_persistence", "contract_review.preserved_boundaries.durable_persistence"],
    [review, ["preserved_boundaries", "browser_persistence"], "forbidden_persistence", "contract_review.preserved_boundaries.browser_persistence"],
    [harness, ["temp_harness_boundary", "normal_product_write_enabled"], "product_write_enabled", "temp_harness.temp_harness_boundary.normal_product_write_enabled"],
    [harness, ["temp_harness_boundary", "product_db_write"], "product_write_enabled", "temp_harness.temp_harness_boundary.product_db_write"],
    [harness, ["temp_harness_boundary", "actual_promotion_performed"], "actual_promotion_enabled", "temp_harness.temp_harness_boundary.actual_promotion_performed"],
    [harness, ["temp_harness_boundary", "proof_or_evidence_writes"], "write_flag_enabled", "temp_harness.temp_harness_boundary.proof_or_evidence_writes"],
    [harness, ["temp_harness_boundary", "perspective_or_canonical_writes"], "write_flag_enabled", "temp_harness.temp_harness_boundary.perspective_or_canonical_writes"],
    [harness, ["temp_harness_boundary", "canonical_graph_write"], "write_flag_enabled", "temp_harness.temp_harness_boundary.canonical_graph_write"],
    [harness, ["temp_harness_boundary", "work_item_creation"], "write_flag_enabled", "temp_harness.temp_harness_boundary.work_item_creation"],
    [harness, ["temp_harness_boundary", "provider_or_openai_calls"], "forbidden_provider_or_retrieval", "temp_harness.temp_harness_boundary.provider_or_openai_calls"],
    [harness, ["temp_harness_boundary", "retrieval_or_rag"], "forbidden_provider_or_retrieval", "temp_harness.temp_harness_boundary.retrieval_or_rag"],
    [harness, ["temp_harness_boundary", "source_fetching"], "forbidden_source_fetching", "temp_harness.temp_harness_boundary.source_fetching"],
    [harness, ["temp_harness_boundary", "external_handoff_sent"], "forbidden_external_handoff", "temp_harness.temp_harness_boundary.external_handoff_sent"],
    [harness, ["temp_harness_boundary", "durable_persistence"], "forbidden_persistence", "temp_harness.temp_harness_boundary.durable_persistence"],
    [harness, ["temp_harness_boundary", "browser_persistence"], "forbidden_persistence", "temp_harness.temp_harness_boundary.browser_persistence"],
    [harness, ["local_copy_packet", "packet_persisted"], "forbidden_persistence", "temp_harness.local_copy_packet.packet_persisted"],
    [harness, ["local_copy_packet", "external_handoff_sent"], "forbidden_external_handoff", "temp_harness.local_copy_packet.external_handoff_sent"],
    [harness, ["local_copy_packet", "actual_promotion_allowed"], "actual_promotion_enabled", "temp_harness.local_copy_packet.actual_promotion_allowed"],
    [harness, ["idempotency_temp_harness", "idempotency_storage_added"], "forbidden_persistence", "temp_harness.idempotency_temp_harness.idempotency_storage_added"],
    [harness, ["idempotency_temp_harness", "product_idempotency_storage_added"], "forbidden_persistence", "temp_harness.idempotency_temp_harness.product_idempotency_storage_added"],
    [harness, ["rollback_temp_harness", "rollback_storage_added"], "forbidden_persistence", "temp_harness.rollback_temp_harness.rollback_storage_added"],
    [harness, ["rollback_temp_harness", "product_rollback_performed"], "write_flag_enabled", "temp_harness.rollback_temp_harness.product_rollback_performed"],
    [harness, ["review_audit_temp_harness", "audit_record_created_now"], "forbidden_persistence", "temp_harness.review_audit_temp_harness.audit_record_created_now"],
    [harness, ["review_audit_temp_harness", "approval_history_created_now"], "forbidden_persistence", "temp_harness.review_audit_temp_harness.approval_history_created_now"],
    [harness, ["review_audit_temp_harness", "product_audit_storage_added"], "forbidden_persistence", "temp_harness.review_audit_temp_harness.product_audit_storage_added"],
  ];
  for (const [fixture, pathSegments, code, pathName] of checks) {
    if (valueAt(fixture, pathSegments) !== false) {
      failures.push({
        code,
        message: `${pathName} must remain false.`,
        path: pathName,
      });
    }
  }
  if (harness.execution_mode !== "temp_non_product_simulation") {
    failures.push({
      code: "invalid_execution_mode",
      message: "temp_harness.execution_mode must be temp_non_product_simulation.",
      path: "temp_harness.execution_mode",
    });
  }
  if (harness.product_write_mode !== "disabled") {
    failures.push({
      code: "invalid_product_write_mode",
      message: "temp_harness.product_write_mode must remain disabled.",
      path: "temp_harness.product_write_mode",
    });
  }
}

function validateNullProductIds(fixtures, failures) {
  walk(fixtures, [], (pathSegments, value) => {
    const key = String(pathSegments[pathSegments.length - 1] ?? "");
    if (PRODUCT_ID_KEYS.has(key) && value !== null) {
      failures.push({
        code: "non_null_product_id",
        message: `${pathSegments.join(".")} must remain null.`,
        path: pathSegments.join("."),
      });
    }
  });
}

function validateTempIntents(harness, failures) {
  const groups = record(harness.simulated_write_intents);
  for (const [groupName, rawGroup] of Object.entries(groups)) {
    if (!Array.isArray(rawGroup)) {
      failures.push({
        code: "missing_required_section",
        message: `temp_harness.simulated_write_intents.${groupName} must be an array.`,
        path: `temp_harness.simulated_write_intents.${groupName}`,
      });
      continue;
    }
    rawGroup.forEach((rawIntent, index) => {
      const intent = record(rawIntent);
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
      if (intent.write_performed_now !== false) {
        failures.push({
          code: "write_flag_enabled",
          message: `${basePath}.write_performed_now must remain false.`,
          path: `${basePath}.write_performed_now`,
        });
      }
      if (intent.product_write_allowed !== false) {
        failures.push({
          code: "product_write_enabled",
          message: `${basePath}.product_write_allowed must remain false.`,
          path: `${basePath}.product_write_allowed`,
        });
      }
      if (intent.temp_harness_only !== true) {
        failures.push({
          code: "missing_required_section",
          message: `${basePath}.temp_harness_only must remain true.`,
          path: `${basePath}.temp_harness_only`,
        });
      }
    });
  }
}

function validateContractGaps(review, failures) {
  const checks = record(review.required_contract_checks);
  const gaps = Array.isArray(review.contract_gaps) ? review.contract_gaps : [];
  const falseChecks = Object.values(checks).filter((value) => value === false);
  if (falseChecks.length > 0 && gaps.length === 0) {
    failures.push({
      code: "missing_contract_gap",
      message: "False contract checks must have contract gaps.",
      path: "contract_review.contract_gaps",
    });
  }
}

function validateNoExternalUrlsOrRawText(input, failures) {
  const serialized = JSON.stringify(input);
  if (/https?:\/\//i.test(serialized)) {
    failures.push({
      code: "forbidden_external_handoff",
      message: "Fixture-only contract inputs must not contain external URLs.",
    });
  }
  if (/raw manual note|manual note raw text|verbatim manual note/i.test(serialized)) {
    failures.push({
      code: "missing_required_section",
      message: "Fixture-only contract inputs must not contain raw manual note text.",
    });
  }
}

function applyMutation(source, patch) {
  const next = JSON.parse(JSON.stringify(source));
  if (!patch) return next;
  const target = mutationTarget(next, patch.target_fixture);
  for (const entry of patch.set ?? []) setAt(target, entry.path, entry.value);
  for (const entry of patch.replace ?? []) setAt(target, entry.path, entry.value);
  for (const pathSegments of patch.unset ?? []) unsetAt(target, pathSegments);
  return next;
}

function mutationTarget(input, targetFixture) {
  if (targetFixture === "authority_design") return input.authorityDesignFixture;
  if (targetFixture === "disabled_readiness") {
    return input.disabledAdapterReadinessFixture;
  }
  if (targetFixture === "contract_review") return input.contractReviewFixture;
  if (targetFixture === "temp_harness") return input.tempHarnessFixture;
  return input;
}

function requireValue(actual, expected, failures, pathName) {
  if (actual !== expected) {
    failures.push({
      code: "missing_required_section",
      message: `${pathName} must be ${expected}.`,
      path: pathName,
    });
  }
}

function valueAt(value, pathSegments) {
  let cursor = value;
  for (const segment of pathSegments) {
    if (cursor === null || cursor === undefined) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

function stringAt(value, pathSegments) {
  const valueAtPath = valueAt(value, pathSegments);
  return typeof valueAtPath === "string" ? valueAtPath : null;
}

function setAt(target, pathSegments, value) {
  let cursor = target;
  for (const segment of pathSegments.slice(0, -1)) {
    if (cursor[segment] === undefined || cursor[segment] === null) {
      cursor[segment] = typeof segment === "number" ? [] : {};
    }
    cursor = cursor[segment];
  }
  cursor[pathSegments[pathSegments.length - 1]] = value;
}

function unsetAt(target, pathSegments) {
  let cursor = target;
  for (const segment of pathSegments.slice(0, -1)) {
    if (cursor[segment] === undefined || cursor[segment] === null) return;
    cursor = cursor[segment];
  }
  Reflect.deleteProperty(cursor, pathSegments[pathSegments.length - 1]);
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function walk(value, pathSegments, visitor) {
  visitor(pathSegments, value);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, [...pathSegments, index], visitor));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      walk(child, [...pathSegments, key], visitor);
    }
  }
}

function fingerprint(value) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}
