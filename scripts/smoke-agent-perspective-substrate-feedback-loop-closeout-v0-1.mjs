import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const contractFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json";
const closeoutFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json";
const contractSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const implementationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const browserValidationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const closeoutSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-closeout-v0-1";
const packageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const closeoutKind = "agent_perspective_substrate_feedback_loop_closeout";
const closeoutVersion =
  "agent_perspective_substrate_feedback_loop_closeout.v0.1";
const recommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const nextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const dogfoodingContractTypePath =
  "types/dogfooding-research-to-perspective-ci-expansion-contract.ts";
const dogfoodingContractFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json";
const dogfoodingContractSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
const dogfoodingContractPackageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-contract-v0-1";
const dogfoodingContractPackageScriptValue =
  "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
const dogfoodingContractVersion =
  "dogfooding_research_to_perspective_ci_expansion_contract.v0.1";
const dogfoodingContractRecommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_implementation_v0_1";
const dogfoodingContractNextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs",
  "scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs",
  "scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs",
  "scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  "scripts/smoke-salience-governor-contract-v0-1.mjs",
  "scripts/smoke-salience-governor-implementation-v0-1.mjs",
];

const expectedChangedFiles = [
  closeoutFixturePath,
  closeoutSmokePath,
  browserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
];

const protectedUnchangedPaths = [
  "types/agent-perspective-substrate-feedback-loop-contract.ts",
  contractFixturePath,
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts",
  implementationFixturePath,
  browserValidationFixturePath,
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-browser-validation.sample.v0.1.json",
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts",
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json",
  "lib/db/schema.sql",
];

for (const filePath of [
  contractFixturePath,
  implementationFixturePath,
  browserValidationFixturePath,
  contractSmokePath,
  implementationSmokePath,
  browserValidationSmokePath,
  closeoutSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(closeoutFixturePath), `${closeoutFixturePath} must exist`);
}

const contractFixture = readJson(contractFixturePath);
const implementationFixture = readJson(implementationFixturePath);
const browserValidationFixture = readJson(browserValidationFixturePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const browserValidationSmokeSource = readFile(browserValidationSmokePath);

const rebuiltFixture = buildCloseoutFixture();

if (writeFixture) {
  writeFileSync(closeoutFixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(closeoutFixturePath);

assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertSourceArtifactsUnchanged();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Agent Perspective Substrate Feedback Loop closeout fixture must match committed fixture",
);
assertCloseoutFixture(fixture);
assertClosedRail(fixture.closed_rail);
assertClosedBoundarySummary(fixture.closed_boundary_summary);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertBrowserValidationSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "agent-perspective-substrate-feedback-loop-closeout-v0-1",
      final_status: "pass",
      closeout_kind: fixture.closeout_kind,
      closeout_version: fixture.closeout_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      source_implementation_fingerprint: fixture.source_implementation_fingerprint,
      source_browser_validation_fingerprint:
        fixture.source_browser_validation_fingerprint,
      contract_slice_complete: fixture.closed_rail.contract_slice_complete,
      implementation_slice_complete:
        fixture.closed_rail.implementation_slice_complete,
      browser_validation_slice_complete:
        fixture.closed_rail.browser_validation_slice_complete,
      closeout_is_summary_not_runtime:
        fixture.validation_policy.closeout_is_summary_not_runtime,
      feedback_event_write_now: fixture.authority_boundary.feedback_event_write_now,
      agent_substrate_mutation_now:
        fixture.authority_boundary.agent_substrate_mutation_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildCloseoutFixture() {
  const sourceContractRef =
    `${contractFixture.contract_version}:${contractFixturePath}#751`;
  const sourceImplementationRef =
    `${implementationFixture.implementation_version}:${implementationFixturePath}#752`;
  const sourceBrowserValidationRef =
    `${browserValidationFixture.validation_version}:${browserValidationFixturePath}#753`;
  const closeout = {
    closeout_kind: closeoutKind,
    closeout_version: closeoutVersion,
    source_contract_ref: sourceContractRef,
    source_contract_fingerprint: contractFixture.contract_fingerprint,
    source_implementation_ref: sourceImplementationRef,
    source_implementation_fingerprint:
      implementationFixture.implementation_fingerprint,
    source_browser_validation_ref: sourceBrowserValidationRef,
    source_browser_validation_fingerprint:
      browserValidationFixture.validation_fingerprint,
    closed_rail: {
      contract_slice_complete: true,
      implementation_slice_complete: true,
      browser_validation_slice_complete: true,
      contract_fixture_path: contractFixturePath,
      implementation_fixture_path: implementationFixturePath,
      browser_validation_fixture_path: browserValidationFixturePath,
      contract_smoke_path: contractSmokePath,
      implementation_smoke_path: implementationSmokePath,
      browser_validation_smoke_path: browserValidationSmokePath,
    },
    closed_boundary_summary: buildClosedBoundarySummary(),
    authority_boundary: buildAuthorityBoundary(),
    validation_policy: buildValidationPolicy(),
    privacy_policy: buildPrivacyPolicy(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    closeout_fingerprint: "",
    fingerprint_algorithm: "fnv1a32",
  };
  closeout.closeout_fingerprint = createFingerprint({
    ...closeout,
    closeout_fingerprint: "",
  });
  return closeout;
}

function buildClosedBoundarySummary() {
  return {
    feedback_is_operator_signal_not_truth: true,
    feedback_is_advisory_input_not_execution_authority: true,
    feedback_not_proof_or_evidence: true,
    feedback_not_durable_perspective_state: true,
    feedback_not_work_status: true,
    feedback_not_product_write: true,
    feedback_does_not_automatically_promote_candidates: true,
    feedback_does_not_automatically_suppress_or_delete_candidates: true,
    dismiss_is_not_deletion: true,
    pin_is_not_promotion: true,
    mark_useful_is_not_truth: true,
    mark_wrong_is_not_proof_of_falsity: true,
    needs_more_evidence_is_review_cue_not_retrieval_execution: true,
    scope_overreach_is_constraint_signal_not_state_mutation: true,
    not_relevant_now_is_temporal_context_not_rejection: true,
    user_correction_does_not_mutate_core_state_now: true,
    future_surfacing_effect_preview_display_priority_only: true,
    rule_failure_candidate_preview_candidate_only: true,
    follow_up_candidate_preview_candidate_only: true,
    agent_substrate_folded_derived_advisory_only: true,
    ai_context_packet_context_not_execution_authority: true,
    codex_handoff_draft_not_execution_approval: true,
    packet_receipt_linkage_provenance_not_completion_proof: true,
  };
}

function buildAuthorityBoundary() {
  return {
    closeout_added_now: true,
    contract_changed_now: false,
    implementation_changed_now: false,
    browser_validation_changed_now: false,
    feedback_loop_runtime_build_implemented_now: false,
    feedback_event_write_now: false,
    feedback_event_mutation_now: false,
    feedback_event_store_write_now: false,
    agent_substrate_mutation_now: false,
    agent_substrate_execution_now: false,
    salience_write_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_write_now: false,
    durable_memory_write_now: false,
    linkage_record_write_now: false,
    formation_receipt_write_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
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
    feedback_authority: false,
    feedback_truth_authority: false,
    feedback_promotion_authority: false,
    feedback_suppression_authority: false,
    feedback_deletion_authority: false,
    mark_useful_truth_authority: false,
    mark_wrong_falsity_authority: false,
    pin_promotion_authority: false,
    dismiss_deletion_authority: false,
    scope_overreach_state_mutation_authority: false,
    needs_more_evidence_retrieval_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    salience_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildValidationPolicy() {
  return {
    closeout_is_summary_not_runtime: true,
    closeout_not_execution_authority: true,
    closeout_not_feedback_event_write: true,
    closeout_not_feedback_mutation: true,
    closeout_not_agent_substrate_mutation: true,
    closeout_not_salience_write: true,
    closeout_not_durable_memory_write: true,
    closeout_not_perspective_promotion: true,
    closeout_not_proof_or_evidence: true,
    closeout_not_product_write: true,
    contract_implementation_validation_chain_preserved: true,
    all_source_fingerprints_present: true,
    all_boundary_flags_preserved: true,
  };
}

function buildPrivacyPolicy() {
  return {
    no_secrets_in_fixture: true,
    no_private_urls: true,
    no_raw_provider_thread_run_session_ids: true,
    no_raw_source_body: true,
    no_access_tokens: true,
    no_ssh_keys: true,
    public_safe_refs_only: true,
  };
}

function assertPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    assertDogfoodingContractPackageScript();
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
    "package.json must add only the Agent Perspective Substrate Feedback Loop closeout smoke script",
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
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    assertDogfoodingContractChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const protectedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `Agent Perspective Substrate Feedback Loop closeout must not change ${protectedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedChangedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive",
      );
    assert.ok(
      expectedChangedFiles.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Agent Perspective Substrate Feedback Loop closeout slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function dogfoodingResearchToPerspectiveCiExpansionBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionBrowserValidationPackageScript() {
  const browserValidationPackageScriptName =
    "smoke:dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1";
  const browserValidationPackageScriptValue =
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs";
  const dogfoodingBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", mergeBaseRef() + ":" + packagePath]),
        );
  assert.equal(
    packageJson.scripts[browserValidationPackageScriptName],
    browserValidationPackageScriptValue,
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
    [browserValidationPackageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, dogfoodingBasePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, dogfoodingBasePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    dogfoodingBasePackageJson.optionalDependencies ?? {},
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionBrowserValidationChangedFiles(changedFiles) {
  const expected = [
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-browser-validation.sample.v0.1.json",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "dogfooding browser validation slice must include " + filePath);
  }
  for (const protectedPath of [
    "types/dogfooding-research-to-perspective-ci-expansion-contract.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
    "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      "Dogfooding Research-to-Perspective CI Expansion browser validation slice must not change " + protectedPath,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionBrowserValidationSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Dogfooding Research-to-Perspective CI Expansion browser validation slice: " + changedFile,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionImplementationPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionBrowserValidationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionBrowserValidationPackageScript();
    return;
  }
  const implementationPackageScriptName =
    "smoke:dogfooding-research-to-perspective-ci-expansion-implementation-v0-1";
  const implementationPackageScriptValue =
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
  const dogfoodingBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", `${mergeBaseRef()}:${packagePath}`]),
        );
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
  assert.deepEqual(packageJson.dependencies, dogfoodingBasePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, dogfoodingBasePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    dogfoodingBasePackageJson.optionalDependencies ?? {},
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionImplementationChangedFiles(changedFiles) {
  if (dogfoodingResearchToPerspectiveCiExpansionBrowserValidationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionBrowserValidationChangedFiles(changedFiles);
    return;
  }
  const expected = [
    "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "dogfooding implementation slice must include " + filePath);
  }
  for (const protectedPath of [
    "types/dogfooding-research-to-perspective-ci-expansion-contract.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      "Dogfooding Research-to-Perspective CI Expansion implementation slice must not change " + protectedPath,
    );
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
      "unexpected changed file in Dogfooding Research-to-Perspective CI Expansion implementation slice: " + changedFile,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts") {
      assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files outside the deterministic builder");
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function dogfoodingResearchToPerspectiveCiExpansionContractSliceActive() {
  return readChangedFiles().includes(dogfoodingContractSmokePath);
}

function assertDogfoodingContractPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionImplementationPackageScript();
    return;
  }
  assert.equal(
    packageJson.scripts[dogfoodingContractPackageScriptName],
    dogfoodingContractPackageScriptValue,
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
    [dogfoodingContractPackageScriptName],
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

function assertDogfoodingContractChangedFiles(changedFiles) {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionImplementationChangedFiles(changedFiles);
    return;
  }
  const expected = [
    dogfoodingContractTypePath,
    dogfoodingContractFixturePath,
    dogfoodingContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    closeoutSmokePath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), `dogfooding contract slice must include ${filePath}`);
  }
  for (const unchangedPath of [
    closeoutFixturePath,
    contractFixturePath,
    implementationFixturePath,
    browserValidationFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Dogfooding contract slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionContractSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Dogfooding Research-to-Perspective CI Expansion contract slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertDogfoodingContractDownstreamPointer();
}

function assertDogfoodingContractDownstreamPointer() {
  const dogfoodingContractSmokeSource = readFile(dogfoodingContractSmokePath);
  for (const requiredText of [
    dogfoodingContractVersion,
    dogfoodingContractFixturePath,
    dogfoodingContractSmokePath,
    dogfoodingContractPackageScriptName,
    dogfoodingContractPackageScriptValue,
    dogfoodingContractRecommendationStatus,
    dogfoodingContractNextRecommendedSlice,
  ]) {
    assert.ok(
      dogfoodingContractSmokeSource.includes(requiredText),
      `${dogfoodingContractSmokePath} must include ${requiredText}`,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    return;
  }
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
      !filePath.startsWith("scripts/smoke-"),
  );
  for (const filePath of changedCodeFiles) {
    const source = stripNonCode(readFile(filePath));
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(source, /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, `${filePath} must not call browser request APIs`);
    assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, `${filePath} must not use browser persistence`);
    assert.doesNotMatch(source, /\brequestAnimationFrame\s*\(/, `${filePath} must not use requestAnimationFrame`);
    assert.doesNotMatch(source, /\bOpenAI\b|from\s+["'][^"']*openai[^"']*["']/i, `${filePath} must not import OpenAI`);
    assert.doesNotMatch(source, /\bdb\.\w+\s*\(|\bprisma\b|\bsql`|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bUPSERT\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(source, /\bwriteFeedbackEvent\b|\bmutateFeedbackEvent\b|\bfeedbackEventStore.*write\b/i, `${filePath} must not write feedback events`);
    assert.doesNotMatch(source, /\bagentSubstrate.*(?:mutate|execute|run)\b/i, `${filePath} must not mutate or execute Agent Substrate`);
    assert.doesNotMatch(source, /\bsalience.*(?:insert|write|update)\b|\brecentRehearsal.*(?:insert|write|update)\b/i, `${filePath} must not write salience or rehearsal buffers`);
    assert.doesNotMatch(source, /\bwriteFormationReceipt\b|\bformationReceipt.*write/i, `${filePath} must not write Formation Receipt`);
    assert.doesNotMatch(source, /\bwriteLinkage\b|\blinkageRecord.*write/i, `${filePath} must not write linkage records`);
    assert.doesNotMatch(source, /\brouteAgent\b|\bexecuteAgent\b|\bagentRouter\b/i, `${filePath} must not route or execute agents`);
    assert.doesNotMatch(source, /\brunRetrieval\b|\brunRag\b|\brunRAG\b/i, `${filePath} must not execute retrieval/RAG`);
    assert.doesNotMatch(source, /\bcreateProof\b|\binsertProof\b|\bcreateEvidence\b|\binsertEvidence\b/i, `${filePath} must not write proof/evidence`);
    assert.doesNotMatch(source, /\bpromotePerspective\b|\bapplyPerspectiveDelta\b/i, `${filePath} must not promote or mutate Perspective state`);
    assert.doesNotMatch(source, /\bmutateWork\b|\bupdateWork\b/i, `${filePath} must not mutate work`);
    assert.doesNotMatch(source, /\bwriteProduct\b|\bcreateProduct\b|\ballocateProductId\b/i, `${filePath} must not implement product write`);
  }
}

function assertSourceArtifactsUnchanged() {
  assert.deepEqual(
    contractFixture,
    readJsonFromGit(contractFixturePath),
    "#751 contract fixture must not change",
  );
  assert.deepEqual(
    implementationFixture,
    readJsonFromGit(implementationFixturePath),
    "#752 implementation fixture must not change",
  );
  assert.deepEqual(
    browserValidationFixture,
    readJsonFromGit(browserValidationFixturePath),
    "#753 browser validation fixture must not change",
  );
}

function assertCloseoutFixture(value) {
  assert.equal(value.closeout_kind, closeoutKind);
  assert.equal(value.closeout_version, closeoutVersion);
  assert.equal(value.source_contract_ref, `${contractFixture.contract_version}:${contractFixturePath}#751`);
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(value.source_implementation_ref, `${implementationFixture.implementation_version}:${implementationFixturePath}#752`);
  assert.equal(
    value.source_implementation_fingerprint,
    implementationFixture.implementation_fingerprint,
  );
  assert.equal(value.source_browser_validation_ref, `${browserValidationFixture.validation_version}:${browserValidationFixturePath}#753`);
  assert.equal(
    value.source_browser_validation_fingerprint,
    browserValidationFixture.validation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32");
  assert.equal(
    value.closeout_fingerprint,
    createFingerprint({ ...value, closeout_fingerprint: "" }),
  );
}

function assertClosedRail(value) {
  assert.equal(value.contract_slice_complete, true);
  assert.equal(value.implementation_slice_complete, true);
  assert.equal(value.browser_validation_slice_complete, true);
  assert.equal(value.contract_fixture_path, contractFixturePath);
  assert.equal(value.implementation_fixture_path, implementationFixturePath);
  assert.equal(value.browser_validation_fixture_path, browserValidationFixturePath);
  assert.equal(value.contract_smoke_path, contractSmokePath);
  assert.equal(value.implementation_smoke_path, implementationSmokePath);
  assert.equal(value.browser_validation_smoke_path, browserValidationSmokePath);
}

function assertClosedBoundarySummary(value) {
  for (const [key, flag] of Object.entries(buildClosedBoundarySummary())) {
    assert.equal(value[key], flag, `closed_boundary_summary.${key} must be ${flag}`);
  }
}

function assertAuthorityBoundary(value) {
  assert.equal(value.closeout_added_now, true);
  assert.equal(value.contract_changed_now, false);
  assert.equal(value.implementation_changed_now, false);
  assert.equal(value.browser_validation_changed_now, false);
  for (const [key, flag] of Object.entries(value)) {
    if (key === "closeout_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(flag, true, `authority_boundary.${key} must be true`);
    } else {
      assert.equal(flag, false, `authority_boundary.${key} must remain false`);
    }
  }
}

function assertValidationPolicy(value) {
  for (const [key, flag] of Object.entries(buildValidationPolicy())) {
    assert.equal(value[key], flag, `validation_policy.${key} must be ${flag}`);
  }
}

function assertPrivacyPolicy(value) {
  for (const [key, flag] of Object.entries(buildPrivacyPolicy())) {
    assert.equal(value[key], flag, `privacy_policy.${key} must be ${flag}`);
  }
  const fixtureText = JSON.stringify(fixture);
  assert.doesNotMatch(
    fixtureText,
    /sk-[A-Za-z0-9_-]{10,}|["']access_token["']\s*:|BEGIN OPENSSH PRIVATE KEY|https?:\/\/(?:localhost|127\.0\.0\.1|internal|private)/i,
  );
}

function assertDocsPointers() {
  assertIncludes(indexDoc, [
    "Agent Perspective Substrate Feedback Loop closeout v0.1",
    closeoutFixturePath,
    closeoutSmokePath,
    "contract -> implementation -> browser validation rail complete",
    "closeout is summary only, not runtime",
    "feedback remains operator signal, not truth",
    "feedback remains advisory input, not execution authority",
    "dismiss is not deletion",
    "pin is not promotion",
    "mark_useful is not truth",
    "mark_wrong is not proof of falsity",
    "needs_more_evidence is review cue, not retrieval execution",
    "scope_overreach is constraint signal, not state mutation",
    "no runtime feedback loop build",
    "no feedback event write/mutation/store",
    "no Agent Substrate mutation/execution",
    "no salience write",
    "no durable salience write",
    "no recent rehearsal buffer write",
    "no durable memory write",
    "no linkage record write",
    "no Formation Receipt write",
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
    "Agent Perspective Substrate Feedback Loop rail is closed through contract, implementation, and browser validation.",
    "Closeout is summary-only and does not add runtime.",
    "Agent Substrate remains folded, derived, advisory-only.",
    "Feedback remains operator signal, not truth or execution authority.",
    "This slice does not implement feedback writes, Agent Substrate mutation/execution, salience writes, recent rehearsal writes, durable memory writes, linkage/receipt writes, Codex/GitHub automation, agent routing/execution, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Dogfooding Research-to-Perspective CI Expansion contract v0.1.",
  ]);
  for (const doc of [surfaceDoc, gateDoc]) {
    assertIncludes(doc, [
      "Agent Perspective Substrate Feedback Loop is closed as preview-only grammar.",
      "Feedback-selected targets remain refs/signals, not proof/evidence or durable state.",
      "Feedback does not mutate Core state in this rail.",
      "This closeout does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff/linkage/feedback behavior.",
    ]);
  }
}

function assertBrowserValidationSmokeDownstreamPointer() {
  assertIncludes(browserValidationSmokeSource, [
    "agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive",
    closeoutVersion,
    closeoutFixturePath,
    closeoutSmokePath,
    packageScriptName,
    packageScriptValue,
    recommendationStatus,
    nextRecommendedSlice,
  ]);
}

function assertPortableMergeBaseFallback() {
  assert.equal(typeof mergeBaseRef(), "string");
}

function assertIncludes(source, snippets) {
  for (const snippet of snippets) {
    assert.ok(source.includes(snippet), `expected text not found: ${snippet}`);
  }
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
  return readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]);
}

function readChangedFiles() {
  const trackedFiles = readGitOutput(["diff", "--name-only", mergeBaseRef()])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const untrackedFiles = readGitOutput(["ls-files", "--others", "--exclude-standard"])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set([...trackedFiles, ...untrackedFiles])].sort();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) return cachedMergeBaseRef;
  for (const candidate of ["origin/main", "main", "HEAD^"]) {
    try {
      readGitOutput(["rev-parse", "--verify", candidate]);
      cachedMergeBaseRef = candidate;
      return candidate;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error("Unable to resolve merge base ref from origin/main, main, or HEAD^");
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/gs, "\"\"");
}

function createFingerprint(value) {
  let hash = 0x811c9dc5;
  const input = stableStringify(value);
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}
