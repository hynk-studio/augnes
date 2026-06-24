import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath =
  "types/dogfooding-research-to-perspective-ci-expansion-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
const feedbackLoopCloseoutFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json";
const feedbackLoopCloseoutSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
const contractKind =
  "dogfooding_research_to_perspective_ci_expansion_contract";
const contractVersion =
  "dogfooding_research_to_perspective_ci_expansion_contract.v0.1";
const previewVersion =
  "dogfooding_research_to_perspective_ci_expansion_preview.v0.1";
const dogfoodingVersion =
  "dogfooding_research_to_perspective_ci_expansion.v0.1";
const recommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_implementation_v0_1";
const nextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_implementation_v0_1";
const implementationBuilderPath =
  "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
const implementationVersion =
  "dogfooding_research_to_perspective_ci_expansion_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const expectedChangedFiles = [
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  feedbackLoopCloseoutSmokePath,
];

const protectedUnchangedPaths = [
  feedbackLoopCloseoutFixturePath,
  "types/agent-perspective-substrate-feedback-loop-contract.ts",
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts",
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json",
  "lib/db/schema.sql",
];

for (const filePath of [
  typePath,
  smokePath,
  feedbackLoopCloseoutFixturePath,
  feedbackLoopCloseoutSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const typeSource = readFile(typePath);
const smokeSource = readFile(smokePath);
const feedbackLoopCloseoutFixture = readJson(feedbackLoopCloseoutFixturePath);
const feedbackLoopCloseoutSmokeSource = readFile(feedbackLoopCloseoutSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const rebuiltFixture = buildContractFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertRequiredFiles();
assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertSourceFeedbackLoopCloseoutUnchanged();
assertContractShape(fixture);
assertContractScope(fixture.contract_scope);
assertDogfoodingPrinciples(fixture.dogfooding_principles);
assertInputFields(fixture.dogfooding_input_fields);
assertOutputFields(fixture.dogfooding_output_fields);
assertSectionFamilies(fixture.dogfooding_section_families);
assertForbiddenActionsPolicy(fixture.forbidden_actions_policy);
assertSamplePreview(fixture.sample_dogfooding_ci_expansion_preview);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertFeedbackLoopCloseoutSmokeDownstreamPointer();
assertImplementationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Dogfooding Research-to-Perspective CI Expansion contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "dogfooding-research-to-perspective-ci-expansion-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_feedback_loop_closeout_fingerprint:
        fixture.source_feedback_loop_closeout_fingerprint,
      dogfooding_record_is_candidate_review_context_not_truth:
        fixture.dogfooding_principles
          .dogfooding_record_is_candidate_review_context_not_truth,
      ci_signal_not_proof_or_evidence:
        fixture.dogfooding_principles.ci_signal_not_proof_or_evidence,
      smoke_pass_not_truth: fixture.dogfooding_principles.smoke_pass_not_truth,
      smoke_fail_diagnostic_not_automatic_rejection:
        fixture.dogfooding_principles
          .smoke_fail_diagnostic_not_automatic_rejection,
      github_actions_added_now:
        fixture.authority_boundary.github_actions_added_now,
      ci_runtime_change_now: fixture.authority_boundary.ci_runtime_change_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_feedback_loop_closeout_ref:
      `${feedbackLoopCloseoutFixture.closeout_version}:${feedbackLoopCloseoutFixturePath}#754`,
    source_feedback_loop_closeout_fingerprint:
      feedbackLoopCloseoutFixture.closeout_fingerprint,
    contract_scope: buildContractScope(),
    dogfooding_principles: buildDogfoodingPrinciples(),
    dogfooding_input_fields: expectedInputFields(),
    dogfooding_output_fields: expectedOutputFields(),
    dogfooding_section_families: buildSectionFamilies(),
    forbidden_actions_policy: buildForbiddenActionsPolicy(),
    sample_dogfooding_ci_expansion_preview: buildSamplePreview(),
    authority_boundary: buildAuthorityBoundary(),
    validation_policy: buildValidationPolicy(),
    privacy_policy: buildPrivacyPolicy(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  contract.contract_fingerprint = createContractFingerprint(contract);
  return contract;
}

function buildContractScope() {
  return {
    dogfooding_ci_expansion_contract_only: true,
    runtime_dogfooding_ingestion_now: false,
    dogfooding_record_write_now: false,
    ci_runtime_change_now: false,
    github_actions_added_now: false,
    ci_execution_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    feedback_event_write_now: false,
    agent_substrate_mutation_now: false,
    salience_write_now: false,
    durable_memory_write_now: false,
    linkage_record_write_now: false,
    formation_receipt_write_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    proof_evidence_write_now: false,
    accepted_evidence_write_now: false,
    work_mutation_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    schema_migration_now: false,
    route_ui_now: false,
    browser_request_now: false,
    product_write_now: false,
  };
}

function buildDogfoodingPrinciples() {
  return {
    dogfooding_record_is_candidate_review_context_not_truth: true,
    ci_expansion_contract_only_not_runtime_ci: true,
    ci_signal_not_proof_or_evidence: true,
    smoke_pass_not_truth: true,
    smoke_fail_diagnostic_not_automatic_rejection: true,
    codex_result_report_candidate_input_not_execution_proof: true,
    pr_body_operator_report_not_authority: true,
    merge_status_repo_event_context_not_product_write: true,
    changed_files_review_cues_not_correctness_proof: true,
    validation_commands_review_cues_not_execution_authority: true,
    warnings_diagnostic_not_failure_unless_policy_says_so: true,
    skipped_checks_explicitly_justified: true,
    authority_boundary_regression_candidate_alert_not_mutation: true,
    dogfooding_candidate_remains_candidate_until_future_gate: true,
    product_decision_can_create_delta_candidate_later_not_state_now: true,
    source_refs_required: true,
    pr_refs_public_safe: true,
    product_write_lane_parked_by_686: true,
  };
}

function expectedInputFields() {
  return [
    "dogfooding_scope_ref",
    "source_pr_ref",
    "codex_result_report_ref",
    "changed_files_ref",
    "validation_matrix_ref",
    "warning_refs",
    "skipped_check_refs",
    "authority_boundary_ref",
    "source_refs",
    "operator_context_ref",
  ];
}

function expectedOutputFields() {
  return [
    "dogfooding_preview_id",
    "dogfooding_version",
    "source_pr_ref",
    "codex_result_summary",
    "changed_files_summary",
    "validation_matrix_summary",
    "warnings_summary",
    "skipped_checks_summary",
    "authority_boundary_summary",
    "candidate_review_implications",
    "perspective_delta_candidate_preview",
    "ci_expansion_candidate_preview",
    "source_refs",
    "validation_policy",
    "privacy_policy",
  ];
}

function buildSectionFamilies() {
  return [
    {
      section_kind: "source_pr",
      pr_ref_required: true,
      pr_ref_public_safe: true,
      not_github_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "codex_result_report",
      report_ref_required: true,
      candidate_input_only: true,
      not_execution_proof: true,
      runtime_write_now: false,
    },
    {
      section_kind: "changed_files_summary",
      changed_files_are_review_cues_only: true,
      not_correctness_proof: true,
      runtime_write_now: false,
    },
    {
      section_kind: "validation_matrix_summary",
      validation_commands_are_review_cues_only: true,
      not_execution_authority: true,
      smoke_pass_not_truth: true,
      smoke_fail_diagnostic_not_rejection: true,
      runtime_write_now: false,
    },
    {
      section_kind: "warnings_summary",
      warnings_are_diagnostic_only: true,
      warning_not_failure_unless_policy_says_so: true,
      runtime_write_now: false,
    },
    {
      section_kind: "skipped_checks_summary",
      skipped_checks_require_reason: true,
      skipped_checks_not_silent: true,
      runtime_write_now: false,
    },
    {
      section_kind: "authority_boundary_summary",
      authority_boundary_required: true,
      regression_is_candidate_alert_not_mutation: true,
      runtime_write_now: false,
    },
    {
      section_kind: "candidate_review_implications",
      candidate_only: true,
      not_proof_or_evidence: true,
      not_durable_state: true,
      runtime_write_now: false,
    },
    {
      section_kind: "perspective_delta_candidate_preview",
      candidate_only: true,
      not_durable_perspective_delta: true,
      future_human_gate_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "ci_expansion_candidate_preview",
      candidate_only: true,
      github_actions_added_now: false,
      ci_runtime_change_now: false,
      runtime_write_now: false,
    },
    {
      section_kind: "source_refs",
      source_refs_required: true,
      public_safe_refs_only: true,
      runtime_write_now: false,
    },
  ];
}

function buildForbiddenActionsPolicy() {
  return {
    no_runtime_dogfooding_ingestion: true,
    no_dogfooding_record_write: true,
    no_ci_runtime_change: true,
    no_github_actions_addition: true,
    no_ci_execution: true,
    no_codex_execution: true,
    no_github_automation: true,
    no_pr_creation: true,
    no_branch_or_commit_creation: true,
    no_feedback_event_write: true,
    no_agent_substrate_mutation: true,
    no_salience_write: true,
    no_durable_memory_write: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_db_write_or_query: true,
    no_perspective_promotion: true,
    no_durable_perspective_state_write: true,
    no_proof_or_evidence_write: true,
    no_accepted_evidence_write: true,
    no_work_mutation: true,
    no_product_write: true,
  };
}

function buildSamplePreview() {
  return {
    preview_version: previewVersion,
    operator_context_ref:
      "operator_context:public:dogfooding_research_to_perspective_ci_expansion_contract",
    dogfooding_input_preview: {
      dogfooding_scope_ref: "dogfooding_scope_ref:public:example",
      source_pr_ref: "github_pr_ref:public:augnes_754",
      codex_result_report_ref:
        "codex_result_report_ref:public:closeout_report",
      changed_files_ref: "changed_files_ref:public:closeout_files",
      validation_matrix_ref: "validation_matrix_ref:public:closeout_validation",
      warning_refs: ["warning_ref:public:existing_node_strip_typescript"],
      skipped_check_refs: [],
      authority_boundary_ref:
        "authority_boundary_ref:public:dogfooding_contract",
      source_refs: [
        "source_ref:public:agent_feedback_loop_closeout",
        "source_ref:public:dogfooding_contract",
      ],
      operator_context_ref:
        "operator_context:public:dogfooding_research_to_perspective_ci_expansion_contract",
      not_executed_now: true,
      not_written_now: true,
    },
    dogfooding_preview: {
      dogfooding_preview_id: "dogfooding_preview_ref:public:contract_preview",
      dogfooding_version: dogfoodingVersion,
      source_pr_ref: "github_pr_ref:public:augnes_754",
      codex_result_summary: {
        candidate_input_only: true,
        not_execution_proof: true,
      },
      changed_files_summary: {
        changed_files_are_review_cues_only: true,
        not_correctness_proof: true,
      },
      validation_matrix_summary: {
        validation_commands_are_review_cues_only: true,
        not_execution_authority: true,
        smoke_pass_not_truth: true,
        smoke_fail_diagnostic_not_rejection: true,
      },
      warnings_summary: {
        warnings_are_diagnostic_only: true,
        warning_not_failure_unless_policy_says_so: true,
      },
      skipped_checks_summary: {
        skipped_checks: [],
        skipped_checks_not_silent: true,
      },
      authority_boundary_summary: {
        regression_is_candidate_alert_not_mutation: true,
        runtime_write_now: false,
      },
      candidate_review_implications: {
        candidate_only: true,
        not_proof_or_evidence: true,
        not_durable_state: true,
      },
      perspective_delta_candidate_preview: {
        candidate_only: true,
        not_durable_perspective_delta: true,
        future_human_gate_required: true,
      },
      ci_expansion_candidate_preview: {
        candidate_only: true,
        github_actions_added_now: false,
        ci_runtime_change_now: false,
      },
      source_refs: [
        "source_ref:public:agent_feedback_loop_closeout",
        "source_ref:public:dogfooding_contract",
      ],
      validation_policy: buildValidationPolicy(),
      privacy_policy: buildPrivacyPolicy(),
      all_sections_public_safe: true,
      all_runtime_write_now_false: true,
    },
    authority_boundary: previewAuthorityBoundary(),
    validation_policy: buildValidationPolicy(),
    privacy_policy: buildPrivacyPolicy(),
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
    browser_validation_added_now: false,
    closeout_added_now: false,
    runtime_dogfooding_ingestion_implemented_now: false,
    dogfooding_record_write_now: false,
    ci_runtime_change_now: false,
    github_actions_added_now: false,
    ci_execution_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    feedback_event_write_now: false,
    agent_substrate_mutation_now: false,
    salience_write_now: false,
    durable_memory_write_now: false,
    linkage_record_write_now: false,
    formation_receipt_write_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    work_mutation_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    dogfooding_authority: false,
    ci_authority: false,
    github_actions_authority: false,
    validation_pass_truth_authority: false,
    validation_failure_rejection_authority: false,
    codex_result_execution_authority: false,
    pr_body_authority: false,
    changed_files_correctness_authority: false,
    boundary_regression_mutation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function previewAuthorityBoundary() {
  const {
    contract_added_now: _contractAddedNow,
    implementation_added_now: _implementationAddedNow,
    browser_validation_added_now: _browserValidationAddedNow,
    closeout_added_now: _closeoutAddedNow,
    ...previewBoundary
  } = buildAuthorityBoundary();
  return previewBoundary;
}

function buildValidationPolicy() {
  return {
    dogfooding_contract_only: true,
    dogfooding_not_source_of_truth: true,
    dogfooding_not_proof_or_evidence: true,
    dogfooding_not_runtime_ci: true,
    ci_signal_not_proof_or_evidence: true,
    smoke_pass_not_truth: true,
    smoke_fail_diagnostic_not_rejection: true,
    codex_result_report_candidate_input_only: true,
    pr_body_not_authority: true,
    changed_files_not_correctness_proof: true,
    validation_commands_not_execution_authority: true,
    authority_boundary_regression_candidate_alert_not_mutation: true,
    no_github_actions_addition: true,
    no_ci_runtime_change: true,
    no_runtime_dogfooding_ingestion: true,
    no_dogfooding_record_write: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_db_write_or_query: true,
    no_perspective_promotion: true,
    no_proof_or_evidence_write: true,
    no_work_mutation: true,
    no_product_write_or_ids: true,
  };
}

function buildPrivacyPolicy() {
  return {
    no_secrets_in_fixture: true,
    no_private_urls: true,
    no_access_tokens: true,
    no_ssh_keys: true,
    no_raw_provider_thread_run_session_ids: true,
    no_raw_source_body: true,
    public_safe_pr_refs_only: true,
    public_safe_source_refs_only: true,
    public_safe_warning_refs_only: true,
  };
}

function assertRequiredFiles() {
  for (const filePath of expectedChangedFiles) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
  }
  assert.ok(
    existsSync(feedbackLoopCloseoutFixturePath),
    "#754 closeout fixture must exist",
  );
}

function assertTypeContract() {
  for (const requiredText of [
    "DogfoodingResearchToPerspectiveCiExpansionContractKind",
    "DogfoodingResearchToPerspectiveCiExpansionContractScope",
    "DogfoodingResearchToPerspectiveCiExpansionPrinciples",
    "DogfoodingResearchToPerspectiveCiExpansionAuthorityBoundary",
    "DogfoodingResearchToPerspectiveCiExpansionValidationPolicy",
    contractKind,
    contractVersion,
    "dogfooding_record_is_candidate_review_context_not_truth",
    "ci_expansion_contract_only_not_runtime_ci",
    "smoke_pass_not_truth",
    "smoke_fail_diagnostic_not_automatic_rejection",
    "codex_result_report_candidate_input_not_execution_proof",
    "pr_body_operator_report_not_authority",
    "product_write_lane_parked_by_686",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
  assert.doesNotMatch(typeSource, /\bimport\b|\bexport\s+function\b/);
}

function assertPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertImplementationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [packageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertImplementationChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const protectedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `Dogfooding contract slice must not change ${protectedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedChangedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionContractSliceActive",
      );
    assert.ok(
      expectedChangedFiles.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Dogfooding Research-to-Perspective CI Expansion contract slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assertNoForbiddenChangedPath(changedFile);
  }
}

function assertNoForbiddenChangedPath(filePath) {
  assert.doesNotMatch(filePath, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
  assert.doesNotMatch(filePath, /^app\/api\//, "must not change app/api routes");
  assert.doesNotMatch(filePath, /route\.(?:ts|tsx|js|jsx)$/, "must not change route handlers");
  assert.doesNotMatch(filePath, /^components\//, "must not change components");
  assert.notEqual(filePath, "lib/db/schema.sql", "must not change schema.sql");
  assert.doesNotMatch(filePath, /^migrations\//, "must not change migrations");
  assert.doesNotMatch(filePath, /^lib\/research-retrieval\//, "must not add retrieval runtime files");
  assert.doesNotMatch(filePath, /^lib\/research-rag\//, "must not add RAG runtime files");
  assert.doesNotMatch(filePath, /^lib\//, "must not add runtime implementation files");
  assert.doesNotMatch(filePath, /provider|openai|source-fetch|crawler/i, "must not change provider/source-fetch/crawler files");
  assert.doesNotMatch(filePath, /product.*write|product.*id/i, "must not change product write files");
  assert.doesNotMatch(filePath, /runtime.*dogfooding.*ingest|dogfooding.*runtime.*ingest/i, "must not add runtime dogfooding ingestion files");
  assert.doesNotMatch(filePath, /runtime.*ci.*exec|ci.*runtime.*exec/i, "must not add runtime CI execution files");
  assert.doesNotMatch(filePath, /github.*automation|git.*automation|codex.*execution/i, "must not add automation runtime files");
  assert.doesNotMatch(filePath, /feedback.*(?:write|store)|agent.*substrate.*(?:mutat|exec)|salience.*write|durable.*memory|formation.*receipt.*write/i, "must not add feedback/substrate/memory runtime files");
}

function assertNoForbiddenRuntimePatterns() {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    return;
  }
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") ||
        filePath.endsWith(".tsx") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".mjs")) &&
      !filePath.startsWith("scripts/smoke-") &&
      filePath !== typePath &&
      filePath !== smokePath &&
      filePath !== feedbackLoopCloseoutSmokePath,
  );
  for (const filePath of changedCodeFiles) {
    const source = stripNonCode(readFile(filePath));
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(source, /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, `${filePath} must not call browser request APIs`);
    assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, `${filePath} must not use browser persistence`);
    assert.doesNotMatch(source, /from\s+["'][^"']*openai[^"']*["']|\bnew\s+OpenAI\b/i, `${filePath} must not call providers/OpenAI`);
    assert.doesNotMatch(source, /\bfetchSource\b|\bcrawl\b|\bcrawler\b|\bsourceFetch\b/i, `${filePath} must not fetch or crawl sources`);
    assert.doesNotMatch(source, /\brunRetrieval\b|\brunRag\b|\brunRAG\b|\bembed(?:ding)?\b|\bvectorDb\b|\bfts\b/i, `${filePath} must not execute retrieval/RAG/indexing`);
    assert.doesNotMatch(source, /\bdb\.(?:query|insert|update|delete|execute)|\bprisma\.|\bsql`|\bproductionDb\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(source, /\bcreateDogfoodingRecord\b|\bwriteDogfoodingRecord\b|\bingestDogfooding\b/i, `${filePath} must not ingest dogfooding records`);
    assert.doesNotMatch(source, /\bcreateWorkflow\b|\bgithubActions\b|\bexecuteCi\b|\brunCi\b|\bciRuntime\b/i, `${filePath} must not implement CI runtime`);
    assert.doesNotMatch(source, /\bcreatePullRequest\b|\bgh\s+pr\b|\boctokit\b|\bgithubAutomation\b/i, `${filePath} must not implement GitHub automation`);
    assert.doesNotMatch(source, /\bgit\s+(?:branch|checkout|switch|commit)\b|\bcreateBranch\b|\bcreateCommit\b/i, `${filePath} must not implement git branch or commit creation`);
    assert.doesNotMatch(source, /\bexecuteCodex\b|\bspawnCodex\b|\brunCodex\b/i, `${filePath} must not execute Codex`);
    assert.doesNotMatch(source, /\bfeedback.*(?:insert|write|mutate|store)|\bwriteFeedback\b/i, `${filePath} must not write feedback events`);
    assert.doesNotMatch(source, /\bagentSubstrate.*(?:mutate|execute)|\bmutateAgentSubstrate\b/i, `${filePath} must not mutate or execute Agent Substrate`);
    assert.doesNotMatch(source, /\bsalience.*(?:insert|write|mutate)\b|\brecentRehearsal.*write\b/i, `${filePath} must not write salience or rehearsal buffers`);
    assert.doesNotMatch(source, /\bformationReceipt.*(?:insert|write|mutate|update)\b/i, `${filePath} must not write Formation Receipt`);
    assert.doesNotMatch(source, /\bcreateEvidence\b|\bwriteEvidence\b|\bacceptedEvidence\b/i, `${filePath} must not write proof/evidence`);
    assert.doesNotMatch(source, /\bpromotePerspective\b|\bpromotionDecision\b|\bapplyPerspectiveDelta\b/i, `${filePath} must not implement Perspective promotion or state mutation`);
    assert.doesNotMatch(source, /\bmutateWork\b|\bupdateWork\b/i, `${filePath} must not mutate work`);
    assert.doesNotMatch(source, /\bproductId\b|\bproduct_id\b|\bwriteProduct\b|\bcreateProduct\b/i, `${filePath} must not implement product writes or IDs`);
  }
}

function assertSourceFeedbackLoopCloseoutUnchanged() {
  assert.deepEqual(
    feedbackLoopCloseoutFixture,
    readJsonFromGit(feedbackLoopCloseoutFixturePath),
    "#754 closeout fixture must not change",
  );
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_feedback_loop_closeout_ref,
    `${feedbackLoopCloseoutFixture.closeout_version}:${feedbackLoopCloseoutFixturePath}#754`,
  );
  assert.equal(
    value.source_feedback_loop_closeout_fingerprint,
    feedbackLoopCloseoutFixture.closeout_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createContractFingerprint(value));
}

function assertContractScope(scope) {
  assert.equal(scope.dogfooding_ci_expansion_contract_only, true);
  for (const [key, value] of Object.entries(scope)) {
    if (key === "dogfooding_ci_expansion_contract_only") {
      assert.equal(value, true);
    } else {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function assertDogfoodingPrinciples(principles) {
  for (const [key, value] of Object.entries(buildDogfoodingPrinciples())) {
    assert.equal(principles[key], value, `${key} principle must be preserved`);
  }
}

function assertInputFields(fields) {
  assert.deepEqual(fields, expectedInputFields());
}

function assertOutputFields(fields) {
  assert.deepEqual(fields, expectedOutputFields());
}

function assertSectionFamilies(families) {
  assert.deepEqual(
    families.map((family) => family.section_kind),
    [
      "source_pr",
      "codex_result_report",
      "changed_files_summary",
      "validation_matrix_summary",
      "warnings_summary",
      "skipped_checks_summary",
      "authority_boundary_summary",
      "candidate_review_implications",
      "perspective_delta_candidate_preview",
      "ci_expansion_candidate_preview",
      "source_refs",
    ],
  );
  for (const family of families) {
    assert.equal(family.runtime_write_now, false, `${family.section_kind} must not write now`);
  }
  const byKind = Object.fromEntries(families.map((family) => [family.section_kind, family]));
  assert.equal(byKind.source_pr.pr_ref_required, true);
  assert.equal(byKind.source_pr.pr_ref_public_safe, true);
  assert.equal(byKind.source_pr.not_github_authority, true);
  assert.equal(byKind.codex_result_report.candidate_input_only, true);
  assert.equal(byKind.codex_result_report.not_execution_proof, true);
  assert.equal(byKind.changed_files_summary.changed_files_are_review_cues_only, true);
  assert.equal(byKind.changed_files_summary.not_correctness_proof, true);
  assert.equal(byKind.validation_matrix_summary.validation_commands_are_review_cues_only, true);
  assert.equal(byKind.validation_matrix_summary.not_execution_authority, true);
  assert.equal(byKind.validation_matrix_summary.smoke_pass_not_truth, true);
  assert.equal(byKind.validation_matrix_summary.smoke_fail_diagnostic_not_rejection, true);
  assert.equal(byKind.warnings_summary.warnings_are_diagnostic_only, true);
  assert.equal(byKind.warnings_summary.warning_not_failure_unless_policy_says_so, true);
  assert.equal(byKind.skipped_checks_summary.skipped_checks_require_reason, true);
  assert.equal(byKind.skipped_checks_summary.skipped_checks_not_silent, true);
  assert.equal(byKind.authority_boundary_summary.authority_boundary_required, true);
  assert.equal(byKind.authority_boundary_summary.regression_is_candidate_alert_not_mutation, true);
  assert.equal(byKind.candidate_review_implications.candidate_only, true);
  assert.equal(byKind.candidate_review_implications.not_proof_or_evidence, true);
  assert.equal(byKind.candidate_review_implications.not_durable_state, true);
  assert.equal(byKind.perspective_delta_candidate_preview.candidate_only, true);
  assert.equal(byKind.perspective_delta_candidate_preview.not_durable_perspective_delta, true);
  assert.equal(byKind.perspective_delta_candidate_preview.future_human_gate_required, true);
  assert.equal(byKind.ci_expansion_candidate_preview.candidate_only, true);
  assert.equal(byKind.ci_expansion_candidate_preview.github_actions_added_now, false);
  assert.equal(byKind.ci_expansion_candidate_preview.ci_runtime_change_now, false);
  assert.equal(byKind.source_refs.source_refs_required, true);
  assert.equal(byKind.source_refs.public_safe_refs_only, true);
}

function assertForbiddenActionsPolicy(policy) {
  for (const [key, value] of Object.entries(buildForbiddenActionsPolicy())) {
    assert.equal(policy[key], value, `${key} forbidden action policy must be preserved`);
  }
}

function assertSamplePreview(preview) {
  assert.equal(preview.preview_version, previewVersion);
  assert.equal(
    preview.operator_context_ref,
    "operator_context:public:dogfooding_research_to_perspective_ci_expansion_contract",
  );
  assert.equal(preview.dogfooding_input_preview.not_executed_now, true);
  assert.equal(preview.dogfooding_input_preview.not_written_now, true);
  assert.equal(preview.dogfooding_input_preview.source_pr_ref, "github_pr_ref:public:augnes_754");
  assert.ok(
    preview.dogfooding_input_preview.source_refs.includes(
      "source_ref:public:agent_feedback_loop_closeout",
    ),
  );
  assert.equal(preview.dogfooding_preview.dogfooding_preview_id, "dogfooding_preview_ref:public:contract_preview");
  assert.equal(preview.dogfooding_preview.dogfooding_version, dogfoodingVersion);
  assert.equal(preview.dogfooding_preview.codex_result_summary.candidate_input_only, true);
  assert.equal(preview.dogfooding_preview.codex_result_summary.not_execution_proof, true);
  assert.equal(preview.dogfooding_preview.changed_files_summary.changed_files_are_review_cues_only, true);
  assert.equal(preview.dogfooding_preview.changed_files_summary.not_correctness_proof, true);
  assert.equal(preview.dogfooding_preview.validation_matrix_summary.validation_commands_are_review_cues_only, true);
  assert.equal(preview.dogfooding_preview.validation_matrix_summary.not_execution_authority, true);
  assert.equal(preview.dogfooding_preview.validation_matrix_summary.smoke_pass_not_truth, true);
  assert.equal(preview.dogfooding_preview.validation_matrix_summary.smoke_fail_diagnostic_not_rejection, true);
  assert.equal(preview.dogfooding_preview.warnings_summary.warnings_are_diagnostic_only, true);
  assert.equal(preview.dogfooding_preview.warnings_summary.warning_not_failure_unless_policy_says_so, true);
  assert.deepEqual(preview.dogfooding_preview.skipped_checks_summary.skipped_checks, []);
  assert.equal(preview.dogfooding_preview.skipped_checks_summary.skipped_checks_not_silent, true);
  assert.equal(preview.dogfooding_preview.authority_boundary_summary.regression_is_candidate_alert_not_mutation, true);
  assert.equal(preview.dogfooding_preview.authority_boundary_summary.runtime_write_now, false);
  assert.equal(preview.dogfooding_preview.candidate_review_implications.candidate_only, true);
  assert.equal(preview.dogfooding_preview.candidate_review_implications.not_proof_or_evidence, true);
  assert.equal(preview.dogfooding_preview.candidate_review_implications.not_durable_state, true);
  assert.equal(preview.dogfooding_preview.perspective_delta_candidate_preview.candidate_only, true);
  assert.equal(preview.dogfooding_preview.perspective_delta_candidate_preview.not_durable_perspective_delta, true);
  assert.equal(preview.dogfooding_preview.perspective_delta_candidate_preview.future_human_gate_required, true);
  assert.equal(preview.dogfooding_preview.ci_expansion_candidate_preview.candidate_only, true);
  assert.equal(preview.dogfooding_preview.ci_expansion_candidate_preview.github_actions_added_now, false);
  assert.equal(preview.dogfooding_preview.ci_expansion_candidate_preview.ci_runtime_change_now, false);
  assert.deepEqual(preview.dogfooding_preview.validation_policy, buildValidationPolicy());
  assert.deepEqual(preview.dogfooding_preview.privacy_policy, buildPrivacyPolicy());
  assert.equal(preview.dogfooding_preview.all_sections_public_safe, true);
  assert.equal(preview.dogfooding_preview.all_runtime_write_now_false, true);
  assert.ok(!("contract_added_now" in preview.authority_boundary));
  assert.ok(!("implementation_added_now" in preview.authority_boundary));
  assert.ok(!("browser_validation_added_now" in preview.authority_boundary));
  assert.ok(!("closeout_added_now" in preview.authority_boundary));
  assert.equal(preview.authority_boundary.dogfooding_authority, false);
  assert.equal(preview.authority_boundary.ci_authority, false);
  assert.deepEqual(preview.validation_policy, buildValidationPolicy());
  assert.deepEqual(preview.privacy_policy, buildPrivacyPolicy());
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.contract_added_now, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
  for (const authorityFlag of [
    "dogfooding_authority",
    "ci_authority",
    "github_actions_authority",
    "validation_pass_truth_authority",
    "validation_failure_rejection_authority",
    "codex_result_execution_authority",
    "pr_body_authority",
    "changed_files_correctness_authority",
    "boundary_regression_mutation_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    assert.equal(boundary[authorityFlag], false, `${authorityFlag} must remain false`);
  }
}

function assertValidationPolicy(policy) {
  for (const [key, value] of Object.entries(buildValidationPolicy())) {
    assert.equal(policy[key], value, `${key} validation policy must be preserved`);
  }
}

function assertPrivacyPolicy(policy) {
  for (const [key, value] of Object.entries(buildPrivacyPolicy())) {
    assert.equal(policy[key], value, `${key} privacy policy must be preserved`);
  }
  const fixtureText = JSON.stringify(fixture);
  assert.doesNotMatch(
    fixtureText,
    /(sk-[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9_]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|thread_[A-Za-z0-9]{8,}|run_[A-Za-z0-9]{8,}|sess_[A-Za-z0-9]{8,})/,
    "fixture must not contain secrets, access tokens, SSH keys, or raw provider thread/run/session IDs",
  );
}

function assertDocsPointers() {
  assertIncludes(indexDoc, [
    "Dogfooding Research-to-Perspective CI Expansion contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    "contract-only, fixture-only, smoke-only",
    "defines future dogfooding grammar for applying Research-to-Perspective rails to Augnes repo development",
    "dogfooding record is candidate/review context, not source of truth",
    "CI expansion contract is not runtime CI implementation",
    "CI signal is validation signal, not proof/evidence",
    "smoke pass is not truth",
    "smoke fail is diagnostic signal, not automatic rejection",
    "Codex result report is candidate input, not execution proof",
    "PR body is operator report, not authority",
    "merge status is repo event context, not product write",
    "changed files are review cues, not proof of correctness",
    "validation command list is review cue, not execution authority",
    "warning is diagnostic, not failure unless policy says so",
    "skipped checks must be explicit and justified",
    "authority boundary regression is candidate alert, not automatic mutation",
    "dogfooding candidate remains candidate until future gate",
    "product decision can create perspective delta candidate later, not durable state now",
    "no GitHub Actions addition",
    "no CI runtime change",
    "no CI execution",
    "no runtime dogfooding ingestion",
    "no dogfooding record write",
    "no Codex execution",
    "no GitHub automation",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no DB write/query",
    "no perspective promotion",
    "no proof/evidence write",
    "no work mutation",
    "no route/UI/schema/browser request",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]);
  assertIncludes(substrateDoc, [
    "Dogfooding Research-to-Perspective CI Expansion contract is contract-only.",
    "Agent Substrate remains advisory-only and cannot treat smoke pass/fail, PR body, Codex result, or changed files as truth/authority.",
    "This slice does not add GitHub Actions, CI runtime, dogfooding ingestion, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Dogfooding Research-to-Perspective CI Expansion implementation v0.1.",
  ]);
  for (const doc of [surfaceDoc, gateDoc]) {
    assertIncludes(doc, [
      "Dogfooding CI expansion remains separated from candidate preview, feedback runtime, durable Perspective state, promotion runtime, and execution.",
      "Dogfooding signals remain candidate/review context.",
      "Smoke pass is not truth.",
      "Smoke fail is diagnostic, not automatic rejection.",
      "Changed files are review cues, not correctness proof.",
      "PR body is operator report, not authority.",
      "This slice does not implement runtime CI/browser/provider/source-fetch/retrieval/promotion/state/dogfooding behavior.",
    ]);
  }
}

function assertFeedbackLoopCloseoutSmokeDownstreamPointer() {
  assertIncludes(feedbackLoopCloseoutSmokeSource, [
    "dogfoodingResearchToPerspectiveCiExpansionContractSliceActive",
    contractVersion,
    fixturePath,
    smokePath,
    packageScriptName,
    packageScriptValue,
    recommendationStatus,
    nextRecommendedSlice,
  ]);
}

function assertImplementationDownstreamPointer() {
  if (!dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    return;
  }
  assert.ok(existsSync(implementationBuilderPath), `${implementationBuilderPath} must exist`);
  assert.ok(existsSync(implementationFixturePath), `${implementationFixturePath} must exist`);
  assert.ok(existsSync(implementationSmokePath), `${implementationSmokePath} must exist`);
  assertIncludes(smokeSource, [
    "dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive",
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationPackageScriptValue,
    implementationVersion,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
  ]);
}

function dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function assertImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[implementationPackageScriptName],
    implementationPackageScriptValue,
  );
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [implementationPackageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertImplementationChangedFiles(changedFiles) {
  const expected = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), `implementation slice must include ${filePath}`);
  }
  for (const protectedPath of [
    typePath,
    fixturePath,
    feedbackLoopCloseoutFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(!changedFiles.includes(protectedPath), `implementation slice must not change ${protectedPath}`);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Dogfooding Research-to-Perspective CI Expansion implementation slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== implementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files outside the deterministic builder");
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of ["origin/main", "main", "HEAD^", "Unable to resolve merge base"]) {
    assert.ok(smokeSource.includes(requiredText), `${smokePath} must include ${requiredText}`);
  }
}

function assertIncludes(source, snippets) {
  for (const snippet of snippets) {
    assert.ok(source.includes(snippet), `expected text not found: ${snippet}`);
  }
}

function readChangedFiles() {
  const diffFiles = readGitOutput([
    "diff",
    "--name-only",
    mergeBaseRef(),
    "--",
  ])
    .split("\n")
    .filter(Boolean);
  const untrackedFiles = readGitOutput([
    "ls-files",
    "--others",
    "--exclude-standard",
  ])
    .split("\n")
    .filter(Boolean);
  return Array.from(new Set([...diffFiles, ...untrackedFiles])).sort();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) return cachedMergeBaseRef;
  for (const ref of ["origin/main", "main", "HEAD^"]) {
    try {
      readGitOutput(["rev-parse", "--verify", ref]);
      cachedMergeBaseRef = ref;
      return cachedMergeBaseRef;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error("Unable to resolve merge base ref from origin/main, main, or HEAD^");
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readTextFromGit(filePath));
}

function readTextFromGit(filePath) {
  return execFileSync("git", ["show", `${mergeBaseRef()}:${filePath}`], {
    encoding: "utf8",
  });
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/`(?:\\.|[^`])*`/g, "\"\"")
    .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function createContractFingerprint(value) {
  return `fnv1a32:${fnv1a32(canonicalJson({ ...value, contract_fingerprint: "" }))}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
