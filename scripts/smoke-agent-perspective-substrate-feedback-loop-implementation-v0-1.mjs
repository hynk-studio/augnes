import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts";
const contractTypePath =
  "types/agent-perspective-substrate-feedback-loop-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const implementationKind =
  "agent_perspective_substrate_feedback_loop_implementation";
const implementationVersion =
  "agent_perspective_substrate_feedback_loop_implementation.v0.1";
const previewVersion =
  "agent_perspective_substrate_feedback_loop_preview.v0.1";
const recommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
const nextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "agent_perspective_substrate_feedback_loop_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_closeout_v0_1";
const browserValidationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_closeout_v0_1";
const closeoutFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json";
const closeoutSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const closeoutPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-closeout-v0-1";
const closeoutPackageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const closeoutVersion =
  "agent_perspective_substrate_feedback_loop_closeout.v0.1";
const closeoutRecommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const closeoutNextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const expectedChangedFiles = [
  builderPath,
  implementationFixturePath,
  smokePath,
  contractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
];

const protectedUnchangedPaths = [
  contractTypePath,
  contractFixturePath,
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-browser-validation.sample.v0.1.json",
  "types/perspective-packet-receipt-linkage-contract.ts",
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json",
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts",
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
  "lib/research-candidate-review/codex-handoff-draft.ts",
  "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
  "lib/db/schema.sql",
];

for (const filePath of [
  builderPath,
  contractTypePath,
  contractFixturePath,
  smokePath,
  contractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(implementationFixturePath), `${implementationFixturePath} must exist`);
}

const builderSource = readFile(builderPath);
const smokeSource = readFile(smokePath);
const contractSmokeSource = readFile(contractSmokePath);
const contractTypeSource = readFile(contractTypePath);
const contractFixture = readJson(contractFixturePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const {
  buildAgentPerspectiveSubstrateFeedbackLoopImplementationFixture,
  buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle,
  validateAgentPerspectiveSubstrateFeedbackLoopPreviewBundle,
  createAgentPerspectiveSubstrateFeedbackLoopFingerprint,
} = await import("../lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts");

const sourceContractRef =
  `${contractFixture.contract_version}:${contractFixturePath}`;
const rebuiltImplementationFixture =
  buildAgentPerspectiveSubstrateFeedbackLoopImplementationFixture({
    agent_perspective_substrate_feedback_loop_contract: contractFixture,
    source_contract_ref: sourceContractRef,
  });

if (writeFixture) {
  writeFileSync(
    implementationFixturePath,
    `${JSON.stringify(rebuiltImplementationFixture, null, 2)}\n`,
  );
  process.exit(0);
}

const fixture = readJson(implementationFixturePath);

assertContractArtifactsUnchanged();
assertRequiredExports();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationFixture(fixture);
assertPreviewBundle(
  fixture.built_agent_perspective_substrate_feedback_loop_preview_bundle,
);
assertValidatedImplementation(fixture.validated_implementation);
assertImplementationAuthorityBoundary(fixture.authority_boundary);
assertInvalidOverrideCoverage();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertBrowserValidationDownstreamPointer();
assertCloseoutDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltImplementationFixture,
  "rebuilt Agent Perspective Substrate Feedback Loop implementation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "agent-perspective-substrate-feedback-loop-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      feedback_principles_preserved:
        fixture.validated_implementation.feedback_principles_preserved,
      feedback_kinds_preserved:
        fixture.validated_implementation.feedback_kinds_preserved,
      feedback_section_families_preserved:
        fixture.validated_implementation.feedback_section_families_preserved,
      runtime_feedback_loop_build_not_implemented:
        fixture.validated_implementation.runtime_feedback_loop_build_not_implemented,
      feedback_event_write_not_implemented:
        fixture.validated_implementation.feedback_event_write_not_implemented,
      agent_substrate_mutation_not_implemented:
        fixture.validated_implementation.agent_substrate_mutation_not_implemented,
      salience_write_not_implemented:
        fixture.validated_implementation.salience_write_not_implemented,
      product_write_not_implemented:
        fixture.validated_implementation.product_write_not_implemented,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function assertContractArtifactsUnchanged() {
  assert.deepEqual(
    contractFixture,
    readJsonFromGit(contractFixturePath),
    "#751 Agent Perspective Substrate Feedback Loop contract fixture must not change",
  );
  assert.equal(
    contractTypeSource.trimEnd(),
    readTextFromGit(contractTypePath).trimEnd(),
    "#751 Agent Perspective Substrate Feedback Loop type contract must not change",
  );
}

function assertRequiredExports() {
  for (const exportName of [
    "buildAgentPerspectiveSubstrateFeedbackLoopImplementationFixture",
    "buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle",
    "validateAgentPerspectiveSubstrateFeedbackLoopPreviewBundle",
    "createAgentPerspectiveSubstrateFeedbackLoopFingerprint",
  ]) {
    assert.ok(
      builderSource.includes(`export function ${exportName}`),
      `${builderPath} must export ${exportName}`,
    );
  }
}

function assertPackageScript() {
  if (agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) {
    assertCloseoutPackageScript();
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationPackageScript();
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
    "package.json must add only the Agent Perspective Substrate Feedback Loop implementation smoke script",
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
  if (agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) {
    assertCloseoutChangedFiles(changedFiles);
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Agent Perspective Substrate Feedback Loop implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedChangedFiles.includes(changedFile) &&
      readFile(changedFile).includes(
        "agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive",
      );
    assert.ok(
      expectedChangedFiles.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Agent Perspective Substrate Feedback Loop implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") || filePath.endsWith(".mjs")) &&
      filePath !== smokePath &&
      filePath !== contractSmokePath &&
      filePath !== browserValidationSmokePath &&
      !filePath.startsWith("scripts/smoke-"),
  );
  for (const filePath of changedCodeFiles) {
    const stripped = stripNonCode(readFile(filePath));
    assert.doesNotMatch(stripped, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(stripped, /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, `${filePath} must not call browser request APIs`);
    assert.doesNotMatch(stripped, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, `${filePath} must not use browser persistence`);
    assert.doesNotMatch(stripped, /\brequestAnimationFrame\s*\(/, `${filePath} must not use requestAnimationFrame`);
    assert.doesNotMatch(stripped, /from\s+["'][^"']*openai[^"']*["']|\bnew\s+OpenAI\b/i, `${filePath} must not import OpenAI`);
    assert.doesNotMatch(stripped, /from\s+["'][^"']*(?:octokit|github)[^"']*["']|\bcreatePullRequest\b|\bgh\s+pr\b/i, `${filePath} must not implement GitHub automation`);
    assert.doesNotMatch(stripped, /\bexecuteCodex\b|\bspawnCodex\b|\brunCodex\b/i, `${filePath} must not execute Codex`);
    assert.doesNotMatch(stripped, /\bgit\s+(?:branch|checkout|switch|commit)\b|\bcreateBranch\b|\bcreateCommit\b/i, `${filePath} must not implement git branch or commit creation`);
    assert.doesNotMatch(stripped, /\brouteAgent\b|\bexecuteAgent\b|\bagentRouter\b/i, `${filePath} must not route or execute agents`);
    assert.doesNotMatch(stripped, /\bwriteFeedbackEvent\b|\bfeedbackEventStore\b|\bmutateFeedbackEvent\b/i, `${filePath} must not write or mutate feedback events`);
    assert.doesNotMatch(stripped, /\bagentSubstrate.*(?:mutate|execute|run)\b/i, `${filePath} must not mutate or execute Agent Substrate`);
    assert.doesNotMatch(stripped, /\bsalience.*(?:insert|write|update)\b|\brecentRehearsal.*(?:insert|write|update)\b/i, `${filePath} must not write salience or rehearsal buffers`);
    assert.doesNotMatch(stripped, /\bwriteLinkageRecord\b|\bdurableAuditLog\b/i, `${filePath} must not implement linkage or audit writes`);
    assert.doesNotMatch(stripped, /\bformationReceipt.*(?:insert|write|mutate|update)\b/i, `${filePath} must not write Formation Receipt`);
    assert.doesNotMatch(stripped, /\bcreateEmbedding\b|\bembeddingModel\b|\bvector(?:Db|Store|Index)\b|\bfts\b/i, `${filePath} must not implement embedding/vector/FTS behavior`);
    assert.doesNotMatch(stripped, /\bdb\.(?:query|insert|update|delete|execute)|\bprisma\.|\bsql`|\bproductionDb\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(stripped, /\bcreateEvidence\b|\bwriteEvidence\b|\bacceptedEvidence\b/i, `${filePath} must not write proof/evidence`);
    assert.doesNotMatch(stripped, /\bpromotePerspective\b|\bpromotionDecision\b/i, `${filePath} must not implement Perspective promotion`);
    assert.doesNotMatch(stripped, /\bproductId\b|\bproduct_id\b|\bwriteProduct\b/i, `${filePath} must not implement product writes or IDs`);
  }
  assert.doesNotMatch(builderSource, /from\s+["'][^"']*(?:openai|octokit|github)[^"']*["']/i);
  assert.doesNotMatch(builderSource, /\bfetch\s*\(/);
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(value.source_contract_ref, sourceContractRef);
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(value.implemented_contract.contract_kind, contractFixture.contract_kind);
  assert.equal(value.implemented_contract.contract_version, contractFixture.contract_version);
  assert.equal(value.implemented_contract.contract_fixture_path, contractFixturePath);
  assert.equal(value.implemented_contract.type_contract_path, contractTypePath);
  for (const key of [
    "contract_authority_boundary_preserved",
    "contract_validation_policy_preserved",
    "contract_feedback_principles_preserved",
    "contract_feedback_kinds_preserved",
    "contract_feedback_target_kinds_preserved",
    "contract_feedback_section_families_preserved",
    "contract_forbidden_actions_policy_preserved",
  ]) {
    assert.equal(value.implemented_contract[key], true, `${key} must be true`);
  }
  assert.equal(value.deterministic_builder.builder_path, builderPath);
  assert.equal(value.deterministic_builder.deterministic_fixture_backed_only, true);
  for (const [key, flag] of Object.entries(value.deterministic_builder)) {
    if (key === "builder_path" || key === "deterministic_fixture_backed_only") continue;
    assert.equal(flag, false, `deterministic_builder.${key} must be false`);
  }
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    value.implementation_fingerprint,
    createAgentPerspectiveSubstrateFeedbackLoopFingerprint(value),
  );
}

function assertPreviewBundle(bundle) {
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.deepEqual(
    bundle.authority_boundary,
    contractFixture.authority_boundary,
    "preview authority_boundary must deep-equal #751 contract authority_boundary",
  );
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(
    bundle.forbidden_actions_policy,
    contractFixture.forbidden_actions_policy,
  );
  assert.equal(bundle.authority_boundary.implementation_added_now, false);
  assert.equal(bundle.authority_boundary.deterministic_builder_added_now, undefined);
  assert.deepEqual(
    bundle.feedback_input_preview,
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_input_preview,
  );
  assert.deepEqual(
    bundle.feedback_preview,
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  assert.equal(
    bundle.feedback_principle_summary.feedback_is_operator_signal_not_truth,
    true,
  );
  assert.equal(
    bundle.feedback_kind_summary.feedback_kind_count,
    contractFixture.feedback_kinds.length,
  );
  assert.equal(
    bundle.feedback_target_kind_summary.feedback_target_kind_count,
    contractFixture.feedback_target_kinds.length,
  );
  assert.equal(
    bundle.feedback_section_family_summary.feedback_section_family_count,
    contractFixture.feedback_section_families.length,
  );
  assert.equal(bundle.forbidden_actions_summary.no_feedback_event_write, true);
  assert.equal(bundle.reference_summary.public_safe_refs_only, true);
  assert.equal(bundle.validation.passed, true);
}

function assertValidatedImplementation(value) {
  const requiredTrueFlags = [
    "preview_bundle_follows_contract",
    "preview_bundle_authority_boundary_matches_contract",
    "preview_bundle_validation_policy_matches_contract",
    "preview_bundle_forbidden_actions_policy_matches_contract",
    "top_level_implementation_boundary_is_separate",
    "feedback_input_fields_preserved",
    "feedback_output_fields_preserved",
    "feedback_principles_preserved",
    "feedback_kinds_preserved",
    "feedback_target_kinds_preserved",
    "feedback_section_families_preserved",
    "forbidden_actions_policy_preserved",
    "feedback_is_operator_signal_not_truth",
    "feedback_is_advisory_input_not_execution_authority",
    "feedback_not_proof_or_evidence",
    "feedback_not_durable_perspective_state",
    "feedback_not_work_status",
    "feedback_not_product_write",
    "feedback_does_not_automatically_promote_candidates",
    "feedback_does_not_automatically_suppress_or_delete_candidates",
    "dismiss_is_not_deletion",
    "pin_is_not_promotion",
    "mark_useful_is_not_truth",
    "mark_wrong_is_not_proof_of_falsity",
    "needs_more_evidence_is_review_cue_not_retrieval_execution",
    "scope_overreach_is_constraint_signal_not_state_mutation",
    "not_relevant_now_is_temporal_context_not_rejection",
    "user_correction_does_not_mutate_core_state_now",
    "source_refs_required_for_grounded_targets",
    "feedback_target_refs_public_safe",
    "target_kind_preserves_candidate_durable_distinction",
    "unresolved_tensions_preserved",
    "knowledge_gaps_preserved",
    "future_surfacing_priority_only",
    "rule_failure_candidate_preview_only",
    "follow_up_candidate_preview_only",
    "agent_substrate_folded_derived_advisory_only",
    "ai_context_packet_context_not_execution_authority",
    "codex_handoff_draft_not_execution_approval",
    "packet_receipt_linkage_provenance_not_completion_proof",
    "runtime_feedback_loop_build_not_implemented",
    "feedback_event_write_not_implemented",
    "feedback_event_mutation_not_implemented",
    "agent_substrate_mutation_not_implemented",
    "agent_substrate_execution_not_implemented",
    "salience_write_not_implemented",
    "durable_salience_write_not_implemented",
    "recent_rehearsal_buffer_write_not_implemented",
    "durable_memory_write_not_implemented",
    "linkage_record_write_not_implemented",
    "formation_receipt_write_not_implemented",
    "codex_execution_now_false",
    "github_automation_now_false",
    "agent_routing_execution_now_false",
    "provider_openai_call_not_implemented",
    "retrieval_rag_execution_not_implemented",
    "runtime_state_read_write_not_implemented",
    "durable_perspective_delta_apply_not_implemented",
    "proof_or_evidence_write_not_implemented",
    "accepted_evidence_write_not_implemented",
    "work_mutation_now_false",
    "runtime_db_write_query_not_implemented",
    "product_write_not_implemented",
    "public_safe_refs_only",
    "no_raw_private_source_body",
    "no_raw_provider_thread_run_session_ids",
    "no_private_urls",
    "no_secrets",
    "no_access_tokens",
    "no_ssh_keys",
    "invalid_feedback_preview_override_rejected",
    "invalid_feedback_kind_override_rejected",
    "invalid_feedback_target_override_rejected",
    "invalid_feedback_section_override_rejected",
    "invalid_forbidden_actions_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "invalid_refs_override_rejected",
  ];
  assert.equal(value.passed, true);
  assert.deepEqual(value.failure_codes, []);
  for (const key of requiredTrueFlags) {
    assert.equal(value[key], true, `validated_implementation.${key} must be true`);
  }
}

function assertImplementationAuthorityBoundary(value) {
  assert.equal(value.implementation_added_now, true);
  assert.equal(value.deterministic_builder_added_now, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "implementation_added_now" ||
      key === "deterministic_builder_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must remain false`);
    }
  }
}

function assertInvalidOverrideCoverage() {
  assertFailureCodes(
    "invalid feedback preview override",
    invalidFeedbackPreviewValidation().failure_codes,
    [
      "feedback_preview_missing_feedback_preview_id",
      "feedback_preview_missing_source_refs",
      "feedback_preview_runtime_write_enabled",
      "feedback_preview_not_public_safe",
      "feedback_preview_missing_authority_boundary",
      "feedback_preview_missing_forbidden_actions",
      "feedback_preview_missing_stop_conditions",
      "feedback_preview_truth_authority_enabled",
      "feedback_preview_promotion_authority_enabled",
      "feedback_preview_feedback_event_write_enabled",
      "feedback_preview_agent_substrate_mutation_enabled",
      "feedback_preview_salience_write_enabled",
    ],
  );
  assertFailureCodes(
    "invalid feedback kind override",
    invalidFeedbackKindValidation().failure_codes,
    [
      "feedback_kind_unknown",
      "feedback_kind_runtime_write_enabled",
      "dismiss_deletion_enabled",
      "pin_promotion_enabled",
      "mark_useful_truth_enabled",
      "mark_wrong_falsity_enabled",
      "needs_more_evidence_retrieval_execution_enabled",
      "scope_overreach_state_mutation_enabled",
      "not_relevant_now_rejection_enabled",
      "correct_core_state_mutation_enabled",
    ],
  );
  assertFailureCodes(
    "invalid feedback target override",
    invalidFeedbackTargetValidation().failure_codes,
    [
      "feedback_target_missing_target_ref",
      "feedback_target_missing_target_kind",
      "feedback_target_private_or_unstable_ref",
      "feedback_target_candidate_durable_distinction_lost",
      "feedback_target_unknown_kind",
      "feedback_target_missing_source_refs_for_grounded_target",
    ],
  );
  assertFailureCodes(
    "invalid feedback section override",
    invalidFeedbackSectionValidation().failure_codes,
    [
      "feedback_section_missing_section_kind",
      "feedback_section_unknown_section_kind",
      "feedback_section_runtime_write_enabled",
      "future_surfacing_effect_truth_enabled",
      "future_surfacing_effect_promotion_authority_enabled",
      "rule_failure_candidate_proof_or_evidence_enabled",
      "rule_failure_candidate_durable_state_enabled",
      "follow_up_candidate_work_item_enabled",
      "follow_up_candidate_retrieval_execution_enabled",
      "authority_boundary_section_execution_enabled",
    ],
  );
  assertFailureCodes(
    "invalid forbidden actions override",
    invalidForbiddenActionsValidation().failure_codes,
    [
      "forbidden_action_missing_no_feedback_event_write",
      "forbidden_action_missing_no_feedback_event_mutation",
      "forbidden_action_missing_no_agent_substrate_mutation",
      "forbidden_action_missing_no_salience_write",
      "forbidden_action_missing_no_durable_memory_write",
      "forbidden_action_missing_no_provider_openai_call",
      "forbidden_action_missing_no_retrieval_rag_execution",
      "forbidden_action_missing_no_db_write_or_query",
      "forbidden_action_missing_no_perspective_promotion",
      "forbidden_action_missing_no_product_write",
    ],
  );
  const authorityCodes = uniqueSorted([
    ...invalidAuthorityBoundaryValidation().failure_codes,
    ...invalidImplementationAuthorityBoundaryValidation()
      .validated_implementation.failure_codes,
  ]);
  assertFailureCodes("invalid authority boundary override", authorityCodes, [
    "feedback_loop_runtime_build_enabled",
    "feedback_event_write_enabled",
    "feedback_event_mutation_enabled",
    "feedback_event_store_write_enabled",
    "agent_substrate_mutation_enabled",
    "agent_substrate_execution_enabled",
    "salience_write_enabled",
    "durable_salience_write_enabled",
    "recent_rehearsal_buffer_write_enabled",
    "durable_memory_write_enabled",
    "linkage_record_write_enabled",
    "formation_receipt_write_enabled",
    "codex_execution_enabled",
    "github_automation_enabled",
    "agent_routing_enabled",
    "agent_execution_enabled",
    "provider_openai_call_enabled",
    "retrieval_rag_execution_enabled",
    "durable_perspective_state_write_enabled",
    "durable_perspective_delta_apply_enabled",
    "proof_or_evidence_record_write_enabled",
    "accepted_evidence_write_enabled",
    "work_mutation_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "feedback_authority_enabled",
    "feedback_truth_authority_enabled",
    "feedback_promotion_authority_enabled",
    "feedback_suppression_authority_enabled",
    "feedback_deletion_authority_enabled",
    "mark_useful_truth_authority_enabled",
    "mark_wrong_falsity_authority_enabled",
    "pin_promotion_authority_enabled",
    "dismiss_deletion_authority_enabled",
    "scope_overreach_state_mutation_authority_enabled",
    "needs_more_evidence_retrieval_authority_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ]);
  assertFailureCodes("invalid refs override", invalidRefsValidation().failure_codes, [
    "feedback_preview_id_missing",
    "private_or_unstable_ref_detected",
    "source_refs_missing",
    "grounded_target_missing_source_refs",
    "raw_private_source_body_detected",
    "raw_provider_thread_run_session_id_detected",
    "access_token_detected",
    "ssh_key_detected",
  ]);
}

function invalidFeedbackPreviewValidation() {
  const feedback = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  delete feedback.feedback_preview_id;
  delete feedback.authority_boundary;
  feedback.source_refs = [];
  feedback.all_runtime_write_now_false = false;
  feedback.all_sections_public_safe = false;
  feedback.forbidden_actions = [];
  feedback.stop_conditions = [];
  feedback.feedback_truth_authority = true;
  feedback.feedback_promotion_authority = true;
  feedback.feedback_event_write_now = true;
  feedback.agent_substrate_mutation_now = true;
  feedback.salience_write_now = true;
  return buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    feedback_preview: feedback,
  }).validation;
}

function invalidFeedbackKindValidation() {
  const feedback = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  feedback.feedback_kind = "unknown_feedback_kind";
  const kinds = contractFixture.feedback_kinds.map((kind) => ({ ...kind }));
  for (const kind of kinds) {
    kind.runtime_write_now = true;
    if (kind.feedback_kind === "dismiss") kind.dismiss_is_not_deletion = false;
    if (kind.feedback_kind === "pin") kind.pin_is_not_promotion = false;
    if (kind.feedback_kind === "mark_useful") kind.mark_useful_is_not_truth = false;
    if (kind.feedback_kind === "mark_wrong") kind.mark_wrong_is_not_proof_of_falsity = false;
    if (kind.feedback_kind === "needs_more_evidence") kind.review_cue_not_retrieval_execution = false;
    if (kind.feedback_kind === "scope_overreach") kind.constraint_signal_not_state_mutation = false;
    if (kind.feedback_kind === "not_relevant_now") kind.temporal_context_not_rejection = false;
    if (kind.feedback_kind === "correct") kind.does_not_mutate_core_state_now = false;
  }
  kinds.push({ feedback_kind: "unexpected", runtime_write_now: true });
  return buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    feedback_preview: feedback,
    feedback_kinds: kinds,
  }).validation;
}

function invalidFeedbackTargetValidation() {
  const validations = [];
  const missing = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  missing.target_ref = "";
  missing.target_kind = "";
  missing.source_refs = [];
  validations.push(
    buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      feedback_preview: missing,
    }).validation,
  );
  const invalid = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  invalid.target_ref = "https://private.example.invalid/target";
  invalid.target_kind = "unknown_target";
  invalid.candidate_durable_distinction_lost = true;
  validations.push(
    buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      feedback_preview: invalid,
      feedback_target_kinds: ["substrate_warning"],
    }).validation,
  );
  return mergeValidations(validations);
}

function invalidFeedbackSectionValidation() {
  const feedback = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  feedback.future_surfacing_effect_preview.not_truth = false;
  feedback.future_surfacing_effect_preview.not_promotion_authority = false;
  feedback.rule_failure_candidate_preview.not_proof_or_evidence = false;
  feedback.rule_failure_candidate_preview.not_durable_state = false;
  feedback.follow_up_candidate_preview.not_work_item = false;
  feedback.follow_up_candidate_preview.not_retrieval_execution = false;
  const families = contractFixture.feedback_section_families.map((family) => ({
    ...family,
  }));
  families.push({ runtime_write_now: true });
  families.push({ section_kind: "unknown_section", runtime_write_now: false });
  for (const family of families) {
    family.runtime_write_now = true;
    if (family.section_kind === "future_surfacing_effect_preview") {
      family.not_truth = false;
      family.not_promotion_authority = false;
    }
    if (family.section_kind === "rule_failure_candidate_preview") {
      family.not_proof_or_evidence = false;
      family.not_durable_state = false;
    }
    if (family.section_kind === "follow_up_candidate_preview") {
      family.not_work_item = false;
      family.not_retrieval_execution = false;
    }
    if (family.section_kind === "authority_boundary") {
      family.execution_authority_false = false;
    }
  }
  return buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    feedback_preview: feedback,
    feedback_section_families: families,
  }).validation;
}

function invalidForbiddenActionsValidation() {
  const policy = { ...contractFixture.forbidden_actions_policy };
  for (const key of Object.keys(policy)) {
    policy[key] = false;
  }
  const feedback = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  feedback.forbidden_actions = [];
  return buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    feedback_preview: feedback,
    forbidden_actions_policy: policy,
  }).validation;
}

function invalidAuthorityBoundaryValidation() {
  const contract = clone(contractFixture);
  for (const key of [
    "feedback_loop_runtime_build_implemented_now",
    "feedback_event_write_now",
    "feedback_event_mutation_now",
    "feedback_event_store_write_now",
    "agent_substrate_mutation_now",
    "agent_substrate_execution_now",
    "salience_write_now",
    "durable_salience_write_now",
    "recent_rehearsal_buffer_written_now",
    "durable_memory_write_now",
    "linkage_record_write_now",
    "formation_receipt_write_now",
    "codex_execution_now",
    "github_automation_now",
    "agent_routing_now",
    "agent_execution_now",
    "provider_openai_call_now",
    "retrieval_rag_execution_now",
    "durable_perspective_state_write_now",
    "durable_perspective_delta_apply_now",
    "proof_or_evidence_record_write_now",
    "accepted_evidence_write_now",
    "work_mutation_now",
    "runtime_db_query_now",
    "runtime_db_write_now",
    "feedback_authority",
    "feedback_truth_authority",
    "feedback_promotion_authority",
    "feedback_suppression_authority",
    "feedback_deletion_authority",
    "mark_useful_truth_authority",
    "mark_wrong_falsity_authority",
    "pin_promotion_authority",
    "dismiss_deletion_authority",
    "scope_overreach_state_mutation_authority",
    "needs_more_evidence_retrieval_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    contract.authority_boundary[key] = true;
  }
  return buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
  }).validation;
}

function invalidImplementationAuthorityBoundaryValidation() {
  return buildAgentPerspectiveSubstrateFeedbackLoopImplementationFixture({
    agent_perspective_substrate_feedback_loop_contract: contractFixture,
    source_contract_ref: sourceContractRef,
    authority_boundary_overrides: {
      feedback_loop_runtime_build_implemented_now: true,
      feedback_event_write_now: true,
      feedback_event_mutation_now: true,
      feedback_event_store_write_now: true,
      agent_substrate_mutation_now: true,
      agent_substrate_execution_now: true,
      salience_write_now: true,
      durable_salience_write_now: true,
      recent_rehearsal_buffer_write_now: true,
      durable_memory_write_now: true,
      linkage_record_write_now: true,
      formation_receipt_write_now: true,
      codex_execution_now: true,
      github_automation_now: true,
      agent_routing_now: true,
      agent_execution_now: true,
      provider_openai_call_now: true,
      retrieval_rag_execution_now: true,
      durable_perspective_state_write_now: true,
      durable_perspective_delta_apply_now: true,
      proof_or_evidence_record_write_now: true,
      accepted_evidence_write_now: true,
      work_mutation_now: true,
      runtime_db_query_now: true,
      runtime_db_write_now: true,
      feedback_authority: true,
      feedback_truth_authority: true,
      feedback_promotion_authority: true,
      feedback_suppression_authority: true,
      feedback_deletion_authority: true,
      mark_useful_truth_authority: true,
      mark_wrong_falsity_authority: true,
      pin_promotion_authority: true,
      dismiss_deletion_authority: true,
      scope_overreach_state_mutation_authority: true,
      needs_more_evidence_retrieval_authority: true,
      product_write_authority: true,
      product_id_allocation_authority: true,
    },
  });
}

function invalidRefsValidation() {
  const validations = [];
  const missing = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  missing.feedback_preview_id = "";
  missing.source_refs = [];
  validations.push(
    buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      feedback_preview: missing,
    }).validation,
  );
  const privateRefs = clone(
    contractFixture.sample_agent_perspective_substrate_feedback_loop_preview.feedback_preview,
  );
  privateRefs.target_ref = "https://internal.example.invalid/private";
  privateRefs.raw_private_source_body = "private source body";
  privateRefs.provider_thread_id = "thread_abc123";
  privateRefs.access_token = "sk-test-access-token";
  privateRefs.ssh_key = "-----BEGIN OPENSSH PRIVATE KEY-----";
  validations.push(
    buildAgentPerspectiveSubstrateFeedbackLoopPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      feedback_preview: privateRefs,
    }).validation,
  );
  return mergeValidations(validations);
}

function assertDocsPointers() {
  assertIncludes(indexDoc, [
    "Agent Perspective Substrate Feedback Loop implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    "deterministic fixture-backed implementation only",
    "validates and materializes #751 Agent Perspective Substrate Feedback Loop preview bundle",
    "feedback is operator signal, not truth",
    "feedback is advisory input, not execution authority",
    "feedback is not proof/evidence",
    "feedback is not durable Perspective state",
    "feedback is not work status",
    "feedback is not product write",
    "feedback does not automatically promote candidates",
    "feedback does not automatically suppress or delete candidates",
    "dismiss is not deletion",
    "pin is not promotion",
    "mark_useful is not truth",
    "mark_wrong is not proof of falsity",
    "needs_more_evidence is review cue, not retrieval execution",
    "scope_overreach is constraint signal, not state mutation",
    "not_relevant_now is temporal context, not rejection",
    "user correction does not mutate Core state now",
    "source_refs required for grounded targets",
    "target refs public-safe",
    "target kind preserves candidate/durable distinction",
    "future surfacing effect preview is display-priority only",
    "rule failure candidate preview is candidate-only",
    "follow-up candidate preview is candidate-only, not work item or retrieval execution",
    "no runtime feedback loop build",
    "no feedback event write",
    "no feedback event mutation",
    "no Agent Substrate mutation/execution",
    "no salience write",
    "no durable salience write",
    "no recent rehearsal buffer write",
    "no durable memory write",
    "no linkage record write",
    "no Formation Receipt write",
    "no Codex/GitHub automation",
    "no agent routing/execution",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no DB write/query",
    "no perspective promotion",
    "no proof/evidence write",
    "no accepted evidence write",
    "no work mutation",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]);
  assertIncludes(substrateDoc, [
    "Agent Perspective Substrate Feedback Loop implementation is deterministic fixture-backed only.",
    "It materializes preview bundles from the #751 contract.",
    "Agent Substrate remains folded, derived, advisory-only.",
    "Feedback is operator signal, not truth or execution authority.",
    "Future surfacing effect preview is display-priority only.",
    "Rule failure and follow-up previews remain candidate-only.",
    "Next recommended slice is Agent Perspective Substrate Feedback Loop browser validation v0.1.",
  ]);
  for (const doc of [surfaceDoc, gateDoc]) {
    assertIncludes(doc, [
      "Agent Perspective Substrate Feedback Loop implementation remains separated from candidate preview, AI Context Packet runtime, Codex Handoff runtime, digest runtime, layout runtime, linkage runtime, durable Perspective state, promotion runtime, Formation Receipt write, and execution.",
      "Feedback-selected targets remain refs/signals, not proof/evidence or durable state.",
      "Dismiss is not deletion.",
      "Pin is not promotion.",
      "mark_useful is not truth.",
      "mark_wrong is not proof of falsity.",
      "needs_more_evidence does not execute retrieval.",
      "scope_overreach does not mutate state.",
      "not_relevant_now is not rejection.",
      "Corrections do not mutate Core state in this slice.",
      "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff/linkage/feedback behavior.",
    ]);
  }
}

function assertContractSmokeDownstreamPointer() {
  assertIncludes(contractSmokeSource, [
    "agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive",
    builderPath,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    packageScriptValue,
    implementationVersion,
    recommendationStatus,
    nextRecommendedSlice,
  ]);
}

function assertBrowserValidationDownstreamPointer() {
  if (!browserValidationSliceActive()) return;
  assert.ok(existsSync(browserValidationFixturePath));
  assert.ok(existsSync(browserValidationSmokePath));
  assert.equal(packageJson.scripts[browserValidationPackageScriptName], browserValidationPackageScriptValue);
  const validationFixture = readJson(browserValidationFixturePath);
  assert.equal(validationFixture.validation_version, browserValidationVersion);
  assert.equal(validationFixture.recommendation_status, browserValidationRecommendationStatus);
  assert.equal(validationFixture.next_recommended_slice, browserValidationNextRecommendedSlice);
}

function assertCloseoutDownstreamPointer() {
  if (!agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) return;
  assert.ok(existsSync(closeoutFixturePath));
  assert.ok(existsSync(closeoutSmokePath));
  assert.equal(packageJson.scripts[closeoutPackageScriptName], closeoutPackageScriptValue);
  const closeoutFixture = readJson(closeoutFixturePath);
  assert.equal(closeoutFixture.closeout_version, closeoutVersion);
  assert.equal(closeoutFixture.recommendation_status, closeoutRecommendationStatus);
  assert.equal(closeoutFixture.next_recommended_slice, closeoutNextRecommendedSlice);
}

function assertBrowserValidationPackageScript() {
  assert.equal(packageJson.scripts[browserValidationPackageScriptName], browserValidationPackageScriptValue);
}

function assertCloseoutPackageScript() {
  assert.equal(packageJson.scripts[closeoutPackageScriptName], closeoutPackageScriptValue);
}

function assertCloseoutChangedFiles(changedFiles) {
  const expectedChanged = [
    browserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  const expectedPresent = [closeoutFixturePath, closeoutSmokePath];
  for (const filePath of expectedChanged) {
    assert.ok(changedFiles.includes(filePath), `closeout slice must include ${filePath}`);
  }
  for (const filePath of expectedPresent) {
    assert.ok(existsSync(filePath), `closeout slice must include ${filePath}`);
  }
  for (const protectedPath of [
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
    browserValidationFixturePath,
  ]) {
    assert.ok(!changedFiles.includes(protectedPath), `closeout slice must not change ${protectedPath}`);
  }
}

function assertBrowserValidationChangedFiles(changedFiles) {
  const expected = [
    browserValidationFixturePath,
    browserValidationSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), `browser validation slice must include ${filePath}`);
  }
  for (const protectedPath of [
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
  ]) {
    assert.ok(!changedFiles.includes(protectedPath), `browser validation slice must not change ${protectedPath}`);
  }
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}

function agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive() {
  return (
    readChangedFiles().includes(closeoutSmokePath) ||
    (
      readChangedFiles().includes(browserValidationSmokePath) &&
      packageJson.scripts[closeoutPackageScriptName] === closeoutPackageScriptValue &&
      basePackageJson.scripts?.[closeoutPackageScriptName] !== closeoutPackageScriptValue
    )
  );
}

function assertPortableMergeBaseFallback() {
  assert.equal(typeof mergeBaseRef(), "string");
}

function mergeValidations(validations) {
  return {
    passed: validations.every((validation) => validation.passed),
    failure_codes: uniqueSorted(validations.flatMap((validation) => validation.failure_codes)),
  };
}

function assertFailureCodes(label, actualCodes, expectedCodes) {
  assert.ok(actualCodes.length > 0, `${label} must fail validation`);
  for (const expectedCode of expectedCodes) {
    assert.ok(
      actualCodes.includes(expectedCode),
      `${label} must include failure code ${expectedCode}; actual=${actualCodes.join(",")}`,
    );
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

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJsonFromGit(filePath) {
  return JSON.parse(readTextFromGit(filePath));
}

function readTextFromGit(filePath) {
  return readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]);
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, '""');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}
