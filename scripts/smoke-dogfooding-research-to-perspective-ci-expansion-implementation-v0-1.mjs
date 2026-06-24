import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts";
const contractTypePath =
  "types/dogfooding-research-to-perspective-ci-expansion-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
const implementationKind =
  "dogfooding_research_to_perspective_ci_expansion_implementation";
const implementationVersion =
  "dogfooding_research_to_perspective_ci_expansion_implementation.v0.1";
const previewVersion =
  "dogfooding_research_to_perspective_ci_expansion_preview.v0.1";
const recommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1";
const nextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "dogfooding_research_to_perspective_ci_expansion_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_closeout_v0_1";
const browserValidationNextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_closeout_v0_1";
const closeoutFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-closeout.sample.v0.1.json";
const closeoutSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs";
const closeoutPackageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-closeout-v0-1";
const closeoutPackageScriptValue =
  "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs";
const closeoutVersion =
  "dogfooding_research_to_perspective_ci_expansion_closeout.v0.1";
const closeoutRecommendationStatus =
  "ready_for_research_to_perspective_foundation_milestone_closeout_v0_1";
const closeoutNextRecommendedSlice =
  "research_to_perspective_foundation_milestone_closeout_v0_1";
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
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json",
  "types/agent-perspective-substrate-feedback-loop-contract.ts",
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts",
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json",
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
  assert.ok(
    existsSync(implementationFixturePath),
    `${implementationFixturePath} must exist`,
  );
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
  buildDogfoodingResearchToPerspectiveCiExpansionImplementationFixture,
  buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle,
  validateDogfoodingResearchToPerspectiveCiExpansionPreviewBundle,
  createDogfoodingResearchToPerspectiveCiExpansionFingerprint,
} = await import(
  "../lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts"
);

const sourceContractRef =
  `${contractFixture.contract_version}:${contractFixturePath}#755`;
const rebuiltImplementationFixture =
  buildDogfoodingResearchToPerspectiveCiExpansionImplementationFixture({
    dogfooding_research_to_perspective_ci_expansion_contract: contractFixture,
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
  fixture.built_dogfooding_research_to_perspective_ci_expansion_preview_bundle,
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
  "rebuilt Dogfooding Research-to-Perspective CI Expansion implementation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke:
        "dogfooding-research-to-perspective-ci-expansion-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      dogfooding_principles_preserved:
        fixture.validated_implementation.dogfooding_principles_preserved,
      dogfooding_section_families_preserved:
        fixture.validated_implementation.dogfooding_section_families_preserved,
      runtime_dogfooding_ingestion_not_implemented:
        fixture.validated_implementation
          .runtime_dogfooding_ingestion_not_implemented,
      ci_runtime_change_not_implemented:
        fixture.validated_implementation.ci_runtime_change_not_implemented,
      github_actions_not_added:
        fixture.validated_implementation.github_actions_not_added,
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
    "#755 Dogfooding Research-to-Perspective CI Expansion contract fixture must not change",
  );
  assert.equal(
    contractTypeSource.trimEnd(),
    readTextFromGit(contractTypePath).trimEnd(),
    "#755 Dogfooding Research-to-Perspective CI Expansion type contract must not change",
  );
}

function assertRequiredExports() {
  for (const exportName of [
    "buildDogfoodingResearchToPerspectiveCiExpansionImplementationFixture",
    "buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle",
    "validateDogfoodingResearchToPerspectiveCiExpansionPreviewBundle",
    "createDogfoodingResearchToPerspectiveCiExpansionFingerprint",
  ]) {
    assert.ok(
      builderSource.includes(`export function ${exportName}`),
      `${builderPath} must export ${exportName}`,
    );
  }
}

function assertPackageScript() {
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    assertResearchToPerspectiveFoundationMilestoneCloseoutPackageScript();
    return;
  }
  if (closeoutSliceActive()) {
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
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"optionalDependencies"\s*:/,
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    assertResearchToPerspectiveFoundationMilestoneCloseoutChangedFiles(changedFiles);
    return;
  }
  if (closeoutSliceActive()) {
    assertCloseoutChangedFiles(changedFiles);
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const protectedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `Dogfooding Research-to-Perspective CI Expansion implementation slice must not change ${protectedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedChangedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive",
      );
    assert.ok(
      expectedChangedFiles.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Dogfooding Research-to-Perspective CI Expansion implementation slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assertNoForbiddenChangedPath(changedFile);
  }
}

function assertNoForbiddenChangedPath(filePath) {
  assert.doesNotMatch(
    filePath,
    /^\.github\/workflows\//,
    "must not change GitHub Actions workflows",
  );
  assert.doesNotMatch(filePath, /^app\/api\//, "must not change app/api routes");
  assert.doesNotMatch(
    filePath,
    /route\.(?:ts|tsx|js|jsx)$/,
    "must not change route handlers",
  );
  assert.doesNotMatch(filePath, /^components\//, "must not change components");
  assert.notEqual(filePath, "lib/db/schema.sql", "must not change schema.sql");
  assert.doesNotMatch(filePath, /^migrations\//, "must not change migrations");
  assert.doesNotMatch(
    filePath,
    /^lib\/research-retrieval\//,
    "must not add retrieval runtime files",
  );
  assert.doesNotMatch(
    filePath,
    /^lib\/research-rag\//,
    "must not add RAG runtime files",
  );
  if (filePath !== builderPath) {
    assert.doesNotMatch(
      filePath,
      /^lib\//,
      "must not add runtime implementation files outside the deterministic builder",
    );
  }
  assert.doesNotMatch(
    filePath,
    /provider|openai|source-fetch|crawler/i,
    "must not change provider/source-fetch/crawler files",
  );
  assert.doesNotMatch(
    filePath,
    /product.*write|product.*id/i,
    "must not change product write files",
  );
  assert.doesNotMatch(
    filePath,
    /runtime.*dogfooding.*ingest|dogfooding.*runtime.*ingest/i,
    "must not add runtime dogfooding ingestion files",
  );
  assert.doesNotMatch(
    filePath,
    /runtime.*ci.*exec|ci.*runtime.*exec/i,
    "must not add runtime CI execution files",
  );
  assert.doesNotMatch(
    filePath,
    /github.*automation|git.*automation|codex.*execution/i,
    "must not add automation runtime files",
  );
  assert.doesNotMatch(
    filePath,
    /feedback.*(?:write|store)|agent.*substrate.*(?:mutat|exec)|salience.*write|durable.*memory|formation.*receipt.*write/i,
    "must not add feedback/substrate/memory runtime files",
  );
}

function assertNoForbiddenRuntimePatterns() {
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") ||
        filePath.endsWith(".tsx") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".mjs")) &&
      !filePath.startsWith("scripts/smoke-") &&
      filePath === builderPath,
  );
  for (const filePath of changedCodeFiles) {
    const source = stripNonCode(readFile(filePath));
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(
      source,
      /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/,
      `${filePath} must not call browser request APIs`,
    );
    assert.doesNotMatch(
      source,
      /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/,
      `${filePath} must not use browser persistence`,
    );
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*openai[^"']*["']|\bnew\s+OpenAI\b/i,
      `${filePath} must not call providers/OpenAI`,
    );
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*(?:octokit|github)[^"']*["']|\bcreatePullRequest\b|\bgithubAutomation\b/i,
      `${filePath} must not implement GitHub automation`,
    );
    assert.doesNotMatch(
      source,
      /\bcreateBranch\b|\bcreateCommit\b|\bcommitBranch\b|\bswitchBranch\b/i,
      `${filePath} must not implement git branch or commit creation`,
    );
    assert.doesNotMatch(
      source,
      /\bexecuteCodex\b|\bspawnCodex\b|\brunCodex\b/i,
      `${filePath} must not execute Codex`,
    );
    assert.doesNotMatch(
      source,
      /\bcreateDogfoodingRecord\b|\bwriteDogfoodingRecord\b|\bingestDogfooding\b/i,
      `${filePath} must not ingest or write dogfooding records`,
    );
    assert.doesNotMatch(
      source,
      /\bcreateWorkflow\b|\bexecuteCi\b|\brunCi\b|\bciRuntime\b/i,
      `${filePath} must not implement CI runtime`,
    );
    assert.doesNotMatch(
      source,
      /\bwriteFeedbackEvent\b|\bfeedbackEventStore\b|\bmutateFeedbackEvent\b/i,
      `${filePath} must not write or mutate feedback events`,
    );
    assert.doesNotMatch(
      source,
      /\bagentSubstrate.*(?:mutate|execute|run)\b/i,
      `${filePath} must not mutate or execute Agent Substrate`,
    );
    assert.doesNotMatch(
      source,
      /\bsalience.*(?:insert|write|update)\b|\brecentRehearsal.*(?:insert|write|update)\b/i,
      `${filePath} must not write salience or rehearsal buffers`,
    );
    assert.doesNotMatch(
      source,
      /\bcreateEmbedding\b|\bembeddingModel\b|\bvector(?:Db|Store|Index)\b|\bfts\b/i,
      `${filePath} must not implement embedding/vector/FTS behavior`,
    );
    assert.doesNotMatch(
      source,
      /\bdb\.(?:query|insert|update|delete|execute)|\bprisma\.|\bsql`|\bproductionDb\b/i,
      `${filePath} must not query or write DB`,
    );
    assert.doesNotMatch(
      source,
      /\bcreateEvidence\b|\bwriteEvidence\b|\bacceptedEvidence\b/i,
      `${filePath} must not write proof/evidence`,
    );
    assert.doesNotMatch(
      source,
      /\bpromotePerspective\b|\bpromotionDecision\b|\bapplyPerspectiveDelta\b/i,
      `${filePath} must not implement Perspective promotion`,
    );
    assert.doesNotMatch(
      source,
      /\bmutateWork\b|\bupdateWork\b/i,
      `${filePath} must not mutate work`,
    );
    assert.doesNotMatch(
      source,
      /\ballocateProductId\b|\bwriteProduct\b|\bcreateProduct\b/i,
      `${filePath} must not implement product writes or IDs`,
    );
  }
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(value.source_contract_ref, sourceContractRef);
  assert.equal(
    value.source_contract_fingerprint,
    contractFixture.contract_fingerprint,
  );
  assert.equal(
    value.implemented_contract.contract_kind,
    contractFixture.contract_kind,
  );
  assert.equal(
    value.implemented_contract.contract_version,
    contractFixture.contract_version,
  );
  assert.equal(
    value.implemented_contract.contract_fixture_path,
    contractFixturePath,
  );
  assert.equal(value.implemented_contract.type_contract_path, contractTypePath);
  for (const key of [
    "contract_authority_boundary_preserved",
    "contract_validation_policy_preserved",
    "contract_dogfooding_principles_preserved",
    "contract_dogfooding_section_families_preserved",
    "contract_forbidden_actions_policy_preserved",
  ]) {
    assert.equal(value.implemented_contract[key], true, `${key} must be true`);
  }
  assert.equal(value.deterministic_builder.builder_path, builderPath);
  assert.equal(
    value.deterministic_builder.deterministic_fixture_backed_only,
    true,
  );
  for (const [key, flag] of Object.entries(value.deterministic_builder)) {
    if (key === "builder_path" || key === "deterministic_fixture_backed_only") {
      continue;
    }
    assert.equal(flag, false, `deterministic_builder.${key} must be false`);
  }
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    value.implementation_fingerprint,
    createDogfoodingResearchToPerspectiveCiExpansionFingerprint(value),
  );
}

function assertPreviewBundle(bundle) {
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.deepEqual(
    bundle.authority_boundary,
    contractFixture.authority_boundary,
    "preview authority_boundary must deep-equal #755 contract authority_boundary",
  );
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(
    bundle.forbidden_actions_policy,
    contractFixture.forbidden_actions_policy,
  );
  assert.equal(bundle.authority_boundary.implementation_added_now, false);
  assert.equal(bundle.authority_boundary.deterministic_builder_added_now, undefined);
  assert.deepEqual(
    bundle.dogfooding_input_preview,
    contractFixture.sample_dogfooding_ci_expansion_preview
      .dogfooding_input_preview,
  );
  assert.deepEqual(
    bundle.dogfooding_preview,
    contractFixture.sample_dogfooding_ci_expansion_preview.dogfooding_preview,
  );
  assert.equal(
    bundle.dogfooding_principle_summary
      .dogfooding_record_is_candidate_review_context_not_truth,
    true,
  );
  assert.equal(
    bundle.dogfooding_section_family_summary.dogfooding_section_family_count,
    contractFixture.dogfooding_section_families.length,
  );
  assert.equal(bundle.forbidden_actions_summary.no_ci_runtime_change, true);
  assert.equal(bundle.forbidden_actions_summary.no_github_actions_addition, true);
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
    "dogfooding_input_fields_preserved",
    "dogfooding_output_fields_preserved",
    "dogfooding_principles_preserved",
    "dogfooding_section_families_preserved",
    "forbidden_actions_policy_preserved",
    "dogfooding_record_candidate_context_not_truth",
    "ci_signal_not_proof_or_evidence",
    "smoke_pass_not_truth",
    "smoke_fail_diagnostic_not_rejection",
    "codex_result_report_candidate_input_not_execution_proof",
    "pr_body_operator_report_not_authority",
    "merge_status_context_not_product_write",
    "changed_files_review_cues_not_correctness_proof",
    "validation_commands_review_cues_not_execution_authority",
    "warnings_diagnostic_not_failure_unless_policy_says_so",
    "skipped_checks_explicitly_justified",
    "authority_boundary_regression_candidate_alert_not_mutation",
    "dogfooding_candidate_remains_candidate_until_future_gate",
    "product_decision_delta_candidate_later_not_state_now",
    "public_safe_refs_only",
    "runtime_dogfooding_ingestion_not_implemented",
    "dogfooding_record_write_not_implemented",
    "ci_runtime_change_not_implemented",
    "github_actions_not_added",
    "ci_execution_not_implemented",
    "codex_execution_now_false",
    "github_automation_now_false",
    "provider_openai_call_not_implemented",
    "retrieval_rag_execution_not_implemented",
    "runtime_db_write_query_not_implemented",
    "perspective_promotion_not_implemented",
    "proof_or_evidence_write_not_implemented",
    "work_mutation_now_false",
    "product_write_not_implemented",
    "no_raw_private_source_body",
    "no_raw_provider_thread_run_session_ids",
    "no_private_urls",
    "no_secrets",
    "no_access_tokens",
    "no_ssh_keys",
    "invalid_dogfooding_preview_override_rejected",
    "invalid_dogfooding_section_override_rejected",
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
    "invalid dogfooding preview override",
    invalidDogfoodingPreviewValidation().failure_codes,
    [
      "dogfooding_preview_missing_preview_id",
      "dogfooding_preview_missing_source_refs",
      "dogfooding_preview_runtime_write_enabled",
      "dogfooding_preview_not_public_safe",
      "dogfooding_preview_ci_runtime_change_enabled",
      "dogfooding_preview_github_actions_added",
      "dogfooding_preview_ci_execution_enabled",
      "dogfooding_preview_smoke_pass_truth_enabled",
      "dogfooding_preview_smoke_fail_rejection_enabled",
      "dogfooding_preview_codex_execution_proof_enabled",
      "dogfooding_preview_changed_files_correctness_enabled",
      "dogfooding_preview_product_write_enabled",
    ],
  );
  assertFailureCodes(
    "invalid dogfooding section override",
    invalidDogfoodingSectionValidation().failure_codes,
    [
      "dogfooding_section_missing_section_kind",
      "dogfooding_section_unknown_section_kind",
      "dogfooding_section_runtime_write_enabled",
      "source_pr_github_authority_enabled",
      "codex_result_execution_proof_enabled",
      "changed_files_correctness_proof_enabled",
      "validation_matrix_execution_authority_enabled",
      "validation_matrix_smoke_pass_truth_enabled",
      "validation_matrix_smoke_fail_rejection_enabled",
      "warning_treated_as_failure_without_policy",
      "skipped_check_missing_reason",
      "authority_boundary_regression_mutation_enabled",
      "candidate_review_implication_proof_enabled",
      "perspective_delta_candidate_durable_state_enabled",
      "ci_expansion_candidate_github_actions_added",
    ],
  );
  assertFailureCodes(
    "invalid forbidden actions override",
    invalidForbiddenActionsValidation().failure_codes,
    [
      "forbidden_action_missing_no_runtime_dogfooding_ingestion",
      "forbidden_action_missing_no_dogfooding_record_write",
      "forbidden_action_missing_no_ci_runtime_change",
      "forbidden_action_missing_no_github_actions_addition",
      "forbidden_action_missing_no_ci_execution",
      "forbidden_action_missing_no_codex_execution",
      "forbidden_action_missing_no_github_automation",
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
    "runtime_dogfooding_ingestion_enabled",
    "dogfooding_record_write_enabled",
    "ci_runtime_change_enabled",
    "github_actions_added_enabled",
    "ci_execution_enabled",
    "codex_execution_enabled",
    "github_automation_enabled",
    "github_pr_creation_enabled",
    "git_branch_creation_enabled",
    "git_commit_creation_enabled",
    "feedback_event_write_enabled",
    "agent_substrate_mutation_enabled",
    "provider_openai_call_enabled",
    "retrieval_rag_execution_enabled",
    "durable_perspective_state_write_enabled",
    "durable_perspective_delta_apply_enabled",
    "proof_or_evidence_record_write_enabled",
    "accepted_evidence_write_enabled",
    "work_mutation_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "dogfooding_authority_enabled",
    "ci_authority_enabled",
    "github_actions_authority_enabled",
    "validation_pass_truth_authority_enabled",
    "validation_failure_rejection_authority_enabled",
    "codex_result_execution_authority_enabled",
    "pr_body_authority_enabled",
    "changed_files_correctness_authority_enabled",
    "boundary_regression_mutation_authority_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ]);
  assertFailureCodes("invalid refs override", invalidRefsValidation().failure_codes, [
    "dogfooding_preview_id_missing",
    "private_or_unstable_ref_detected",
    "source_refs_missing",
    "pr_ref_missing",
    "codex_result_report_ref_missing",
    "validation_matrix_ref_missing",
    "raw_private_source_body_detected",
    "raw_provider_thread_run_session_id_detected",
    "access_token_detected",
    "ssh_key_detected",
  ]);
}

function invalidDogfoodingPreviewValidation() {
  const dogfoodingPreview = clone(
    contractFixture.sample_dogfooding_ci_expansion_preview.dogfooding_preview,
  );
  delete dogfoodingPreview.dogfooding_preview_id;
  dogfoodingPreview.source_refs = [];
  dogfoodingPreview.all_runtime_write_now_false = false;
  dogfoodingPreview.all_sections_public_safe = false;
  dogfoodingPreview.ci_runtime_change_now = true;
  dogfoodingPreview.github_actions_added_now = true;
  dogfoodingPreview.ci_execution_now = true;
  dogfoodingPreview.product_write_now = true;
  dogfoodingPreview.validation_matrix_summary.smoke_pass_not_truth = false;
  dogfoodingPreview.validation_matrix_summary.smoke_fail_diagnostic_not_rejection =
    false;
  dogfoodingPreview.codex_result_summary.not_execution_proof = false;
  dogfoodingPreview.changed_files_summary.not_correctness_proof = false;
  dogfoodingPreview.ci_expansion_candidate_preview.ci_runtime_change_now = true;
  dogfoodingPreview.ci_expansion_candidate_preview.github_actions_added_now =
    true;
  return buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    dogfooding_preview: dogfoodingPreview,
  }).validation;
}

function invalidDogfoodingSectionValidation() {
  const dogfoodingPreview = clone(
    contractFixture.sample_dogfooding_ci_expansion_preview.dogfooding_preview,
  );
  dogfoodingPreview.codex_result_summary.not_execution_proof = false;
  dogfoodingPreview.changed_files_summary.not_correctness_proof = false;
  dogfoodingPreview.validation_matrix_summary.not_execution_authority = false;
  dogfoodingPreview.validation_matrix_summary.smoke_pass_not_truth = false;
  dogfoodingPreview.validation_matrix_summary.smoke_fail_diagnostic_not_rejection =
    false;
  dogfoodingPreview.warnings_summary.warning_not_failure_unless_policy_says_so =
    false;
  dogfoodingPreview.skipped_checks_summary.skipped_checks = [
    { skipped_check_ref: "skipped_check_ref:public:missing_reason" },
  ];
  dogfoodingPreview.authority_boundary_summary.regression_is_candidate_alert_not_mutation =
    false;
  dogfoodingPreview.candidate_review_implications.not_proof_or_evidence = false;
  dogfoodingPreview.perspective_delta_candidate_preview.not_durable_perspective_delta =
    false;
  dogfoodingPreview.ci_expansion_candidate_preview.github_actions_added_now =
    true;
  const families = contractFixture.dogfooding_section_families.map((family) => ({
    ...family,
  }));
  families.push({ runtime_write_now: true });
  families.push({ section_kind: "unknown_section", runtime_write_now: false });
  for (const family of families) {
    family.runtime_write_now = true;
    if (family.section_kind === "source_pr") family.not_github_authority = false;
    if (family.section_kind === "codex_result_report") family.not_execution_proof = false;
    if (family.section_kind === "changed_files_summary") family.not_correctness_proof = false;
    if (family.section_kind === "validation_matrix_summary") {
      family.not_execution_authority = false;
      family.smoke_pass_not_truth = false;
      family.smoke_fail_diagnostic_not_rejection = false;
    }
    if (family.section_kind === "warnings_summary") {
      family.warning_not_failure_unless_policy_says_so = false;
    }
    if (family.section_kind === "skipped_checks_summary") {
      family.skipped_checks_require_reason = false;
    }
    if (family.section_kind === "authority_boundary_summary") {
      family.regression_is_candidate_alert_not_mutation = false;
    }
    if (family.section_kind === "candidate_review_implications") {
      family.not_proof_or_evidence = false;
    }
    if (family.section_kind === "perspective_delta_candidate_preview") {
      family.not_durable_perspective_delta = false;
    }
    if (family.section_kind === "ci_expansion_candidate_preview") {
      family.github_actions_added_now = true;
    }
  }
  return buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    dogfooding_preview: dogfoodingPreview,
    dogfooding_section_families: families,
  }).validation;
}

function invalidForbiddenActionsValidation() {
  const policy = { ...contractFixture.forbidden_actions_policy };
  for (const key of Object.keys(policy)) {
    policy[key] = false;
  }
  return buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    forbidden_actions_policy: policy,
  }).validation;
}

function invalidAuthorityBoundaryValidation() {
  const contract = clone(contractFixture);
  for (const key of [
    "runtime_dogfooding_ingestion_implemented_now",
    "dogfooding_record_write_now",
    "ci_runtime_change_now",
    "github_actions_added_now",
    "ci_execution_now",
    "codex_execution_now",
    "github_automation_now",
    "github_pr_creation_now",
    "git_branch_creation_now",
    "git_commit_creation_now",
    "feedback_event_write_now",
    "agent_substrate_mutation_now",
    "provider_openai_call_now",
    "retrieval_rag_execution_now",
    "durable_perspective_state_write_now",
    "durable_perspective_delta_apply_now",
    "proof_or_evidence_record_write_now",
    "accepted_evidence_write_now",
    "work_mutation_now",
    "runtime_db_query_now",
    "runtime_db_write_now",
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
    contract.authority_boundary[key] = true;
  }
  return buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
    contract,
    source_contract_ref: sourceContractRef,
  }).validation;
}

function invalidImplementationAuthorityBoundaryValidation() {
  return buildDogfoodingResearchToPerspectiveCiExpansionImplementationFixture({
    dogfooding_research_to_perspective_ci_expansion_contract: contractFixture,
    source_contract_ref: sourceContractRef,
    authority_boundary_overrides: {
      runtime_dogfooding_ingestion_implemented_now: true,
      dogfooding_record_write_now: true,
      ci_runtime_change_now: true,
      github_actions_added_now: true,
      ci_execution_now: true,
      codex_execution_now: true,
      github_automation_now: true,
      github_pr_creation_now: true,
      git_branch_creation_now: true,
      git_commit_creation_now: true,
      feedback_event_write_now: true,
      agent_substrate_mutation_now: true,
      provider_openai_call_now: true,
      retrieval_rag_execution_now: true,
      durable_perspective_state_write_now: true,
      durable_perspective_delta_apply_now: true,
      proof_or_evidence_record_write_now: true,
      accepted_evidence_write_now: true,
      work_mutation_now: true,
      runtime_db_query_now: true,
      runtime_db_write_now: true,
      dogfooding_authority: true,
      ci_authority: true,
      github_actions_authority: true,
      validation_pass_truth_authority: true,
      validation_failure_rejection_authority: true,
      codex_result_execution_authority: true,
      pr_body_authority: true,
      changed_files_correctness_authority: true,
      boundary_regression_mutation_authority: true,
      product_write_authority: true,
      product_id_allocation_authority: true,
    },
  });
}

function invalidRefsValidation() {
  const validations = [];
  const missingInput = clone(
    contractFixture.sample_dogfooding_ci_expansion_preview
      .dogfooding_input_preview,
  );
  missingInput.source_pr_ref = "";
  missingInput.codex_result_report_ref = "";
  missingInput.validation_matrix_ref = "";
  missingInput.source_refs = [];
  const missingPreview = clone(
    contractFixture.sample_dogfooding_ci_expansion_preview.dogfooding_preview,
  );
  missingPreview.dogfooding_preview_id = "";
  missingPreview.source_refs = [];
  validations.push(
    buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      dogfooding_input_preview: missingInput,
      dogfooding_preview: missingPreview,
    }).validation,
  );
  const privateInput = clone(
    contractFixture.sample_dogfooding_ci_expansion_preview
      .dogfooding_input_preview,
  );
  privateInput.source_pr_ref = "https://private.example.invalid/pr/755";
  privateInput.codex_result_report_ref = "codex_result_report_ref:private:raw";
  privateInput.validation_matrix_ref = "validation_matrix_ref:private:raw";
  const privatePreview = clone(
    contractFixture.sample_dogfooding_ci_expansion_preview.dogfooding_preview,
  );
  privatePreview.source_pr_ref = "github_pr_ref:private:augnes_755";
  privatePreview.raw_private_source_body = "raw private source body";
  privatePreview.provider_thread_id = "thread_abc123456";
  privatePreview.provider_run_id = "run_abc123456";
  privatePreview.access_token = "sk-test-access-token";
  privatePreview.ssh_key = "-----BEGIN OPENSSH PRIVATE KEY-----";
  validations.push(
    buildDogfoodingResearchToPerspectiveCiExpansionPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      dogfooding_input_preview: privateInput,
      dogfooding_preview: privatePreview,
    }).validation,
  );
  return mergeValidations(validations);
}

function assertDocsPointers() {
  assertIncludes(indexDoc, [
    "Dogfooding Research-to-Perspective CI Expansion implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    "deterministic fixture-backed implementation only",
    "validates and materializes #755 Dogfooding Research-to-Perspective CI Expansion preview bundle",
    "dogfooding record is candidate/review context, not source of truth",
    "CI signal is validation signal, not proof/evidence",
    "smoke pass is not truth",
    "smoke fail is diagnostic signal, not automatic rejection",
    "Codex result report is candidate input, not execution proof",
    "PR body is operator report, not authority",
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
    "Dogfooding Research-to-Perspective CI Expansion implementation is deterministic fixture-backed only.",
    "It materializes preview bundles from the #755 contract.",
    "Agent Substrate remains advisory-only and cannot treat smoke pass/fail, PR body, Codex result, or changed files as truth/authority.",
    "This slice does not add GitHub Actions, CI runtime, dogfooding ingestion, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Dogfooding Research-to-Perspective CI Expansion browser validation v0.1.",
  ]);
  for (const doc of [surfaceDoc, gateDoc]) {
    assertIncludes(doc, [
      "Dogfooding CI expansion implementation remains separated from candidate preview, feedback runtime, durable Perspective state, promotion runtime, and execution.",
      "Dogfooding signals remain candidate/review context.",
      "Smoke pass is not truth.",
      "Smoke fail is diagnostic, not automatic rejection.",
      "Changed files are review cues, not correctness proof.",
      "PR body is operator report, not authority.",
      "This slice does not implement runtime CI/browser/provider/source-fetch/retrieval/promotion/state/dogfooding behavior.",
    ]);
  }
}

function assertContractSmokeDownstreamPointer() {
  assertIncludes(contractSmokeSource, [
    "dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive",
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
  if (closeoutSliceActive()) return;
  if (!browserValidationSliceActive()) return;
  assert.ok(existsSync(browserValidationFixturePath));
  assert.ok(existsSync(browserValidationSmokePath));
  assert.equal(
    packageJson.scripts[browserValidationPackageScriptName],
    browserValidationPackageScriptValue,
  );
  const validationFixture = readJson(browserValidationFixturePath);
  assert.equal(validationFixture.validation_version, browserValidationVersion);
  assert.equal(
    validationFixture.recommendation_status,
    browserValidationRecommendationStatus,
  );
  assert.equal(
    validationFixture.next_recommended_slice,
    browserValidationNextRecommendedSlice,
  );
}

function assertCloseoutDownstreamPointer() {
  if (!closeoutSliceActive()) return;
  assert.ok(existsSync(closeoutFixturePath));
  assert.ok(existsSync(closeoutSmokePath));
  assert.equal(
    packageJson.scripts[closeoutPackageScriptName],
    closeoutPackageScriptValue,
  );
  const closeoutFixture = readJson(closeoutFixturePath);
  assert.equal(closeoutFixture.closeout_version, closeoutVersion);
  assert.equal(
    closeoutFixture.recommendation_status,
    closeoutRecommendationStatus,
  );
  assert.equal(
    closeoutFixture.next_recommended_slice,
    closeoutNextRecommendedSlice,
  );
}

function assertBrowserValidationPackageScript() {
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
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"optionalDependencies"\s*:/,
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertCloseoutPackageScript() {
  assert.equal(
    packageJson.scripts[closeoutPackageScriptName],
    closeoutPackageScriptValue,
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
    [closeoutPackageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion closeout smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"optionalDependencies"\s*:/,
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
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
    assert.ok(
      !changedFiles.includes(protectedPath),
      `browser validation slice must not change ${protectedPath}`,
    );
  }
}

function assertCloseoutChangedFiles(changedFiles) {
  const expected = [
    closeoutFixturePath,
    closeoutSmokePath,
    browserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), `closeout slice must include ${filePath}`);
  }
  for (const protectedPath of [
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
    browserValidationFixturePath,
  ]) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `closeout slice must not change ${protectedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionCloseoutSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Dogfooding Research-to-Perspective CI Expansion closeout slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.(?:ts|tsx|js|jsx)$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}

function researchToPerspectiveFoundationMilestoneCloseoutSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs",
  );
}

function assertResearchToPerspectiveFoundationMilestoneCloseoutPackageScript() {
  const milestonePackageScriptName =
    "smoke:research-to-perspective-foundation-milestone-closeout-v0-1";
  const milestonePackageScriptValue =
    "node scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs";
  const milestoneBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", mergeBaseRef() + ":" + packagePath]),
        );
  assert.equal(
    packageJson.scripts[milestonePackageScriptName],
    milestonePackageScriptValue,
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
    [milestonePackageScriptName],
    "package.json must add only the Research-to-Perspective Foundation Milestone closeout smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, milestoneBasePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, milestoneBasePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    milestoneBasePackageJson.optionalDependencies ?? {},
  );
}

function assertResearchToPerspectiveFoundationMilestoneCloseoutChangedFiles(changedFiles) {
  const expected = [
    "fixtures/research-candidate-review.research-to-perspective-foundation-milestone-closeout.sample.v0.1.json",
    "scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "foundation milestone closeout slice must include " + filePath);
  }
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-closeout.sample.v0.1.json",
    ),
    "foundation milestone closeout slice must not change the #758 dogfooding closeout fixture",
  );
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "researchToPerspectiveFoundationMilestoneCloseoutSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Research-to-Perspective Foundation Milestone closeout slice: " + changedFile,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.(?:ts|tsx|js|jsx)$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write|product.*id/i, "must not change product write files");
  }
}

function closeoutSliceActive() {
  return readChangedFiles().includes(closeoutSmokePath);
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of [
    "origin/main",
    "main",
    "HEAD^",
    "Unable to resolve merge base",
  ]) {
    assert.ok(smokeSource.includes(requiredText), `${smokePath} must include ${requiredText}`);
  }
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

function mergeValidations(validations) {
  return {
    passed: validations.every((validation) => validation.passed),
    failure_codes: uniqueSorted(
      validations.flatMap((validation) => validation.failure_codes),
    ),
  };
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}
