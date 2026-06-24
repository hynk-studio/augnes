import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const contractTypePath =
  "types/dogfooding-research-to-perspective-ci-expansion-contract.ts";
const builderPath =
  "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-browser-validation.sample.v0.1.json";
const closeoutFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-closeout.sample.v0.1.json";
const contractSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
const implementationSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
const browserValidationSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs";
const closeoutSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:dogfooding-research-to-perspective-ci-expansion-closeout-v0-1";
const packageScriptValue =
  "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs";
const closeoutKind =
  "dogfooding_research_to_perspective_ci_expansion_closeout";
const closeoutVersion =
  "dogfooding_research_to_perspective_ci_expansion_closeout.v0.1";
const recommendationStatus =
  "ready_for_research_to_perspective_foundation_milestone_closeout_v0_1";
const nextRecommendedSlice =
  "research_to_perspective_foundation_milestone_closeout_v0_1";
const milestoneCloseoutFixturePath =
  "fixtures/research-candidate-review.research-to-perspective-foundation-milestone-closeout.sample.v0.1.json";
const milestoneCloseoutSmokePath =
  "scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs";
const milestoneCloseoutPackageScriptName =
  "smoke:research-to-perspective-foundation-milestone-closeout-v0-1";
const milestoneCloseoutPackageScriptValue =
  "node scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs";
const milestoneCloseoutVersion =
  "research_to_perspective_foundation_milestone_closeout.v0.1";
const milestoneCloseoutRecommendationStatus =
  "ready_for_foundation_status_review_and_next_runtime_slice_selection_v0_1";
const milestoneCloseoutNextRecommendedSlice =
  "foundation_status_review_and_next_runtime_slice_selection_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

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
  contractTypePath,
  builderPath,
  contractFixturePath,
  implementationFixturePath,
  browserValidationFixturePath,
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json",
  "lib/db/schema.sql",
];

for (const filePath of [
  contractTypePath,
  builderPath,
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

const contractTypeSource = readFile(contractTypePath);
const builderSource = readFile(builderPath);
const contractFixture = readJson(contractFixturePath);
const implementationFixture = readJson(implementationFixturePath);
const browserValidationFixture = readJson(browserValidationFixturePath);
const browserValidationSmokeSource = readFile(browserValidationSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

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
  "rebuilt Dogfooding Research-to-Perspective CI Expansion closeout fixture must match committed fixture",
);
assertCloseoutFixture(fixture);
assertClosedRail(fixture.closed_rail);
assertClosedBoundarySummary(fixture.closed_boundary_summary);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertBrowserValidationSmokeDownstreamPointer();
assertMilestoneCloseoutDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "dogfooding-research-to-perspective-ci-expansion-closeout-v0-1",
      final_status: "pass",
      closeout_kind: fixture.closeout_kind,
      closeout_version: fixture.closeout_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      source_implementation_fingerprint:
        fixture.source_implementation_fingerprint,
      source_browser_validation_fingerprint:
        fixture.source_browser_validation_fingerprint,
      contract_slice_complete: fixture.closed_rail.contract_slice_complete,
      implementation_slice_complete:
        fixture.closed_rail.implementation_slice_complete,
      browser_validation_slice_complete:
        fixture.closed_rail.browser_validation_slice_complete,
      closeout_is_summary_not_runtime:
        fixture.validation_policy.closeout_is_summary_not_runtime,
      dogfooding_record_write_now:
        fixture.authority_boundary.dogfooding_record_write_now,
      ci_runtime_change_now: fixture.authority_boundary.ci_runtime_change_now,
      github_actions_added_now:
        fixture.authority_boundary.github_actions_added_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildCloseoutFixture() {
  const closeout = {
    closeout_kind: closeoutKind,
    closeout_version: closeoutVersion,
    source_contract_ref:
      `${contractFixture.contract_version}:${contractFixturePath}#755`,
    source_contract_fingerprint: contractFixture.contract_fingerprint,
    source_implementation_ref:
      `${implementationFixture.implementation_version}:${implementationFixturePath}#756`,
    source_implementation_fingerprint:
      implementationFixture.implementation_fingerprint,
    source_browser_validation_ref:
      `${browserValidationFixture.validation_version}:${browserValidationFixturePath}#757`,
    source_browser_validation_fingerprint:
      browserValidationFixture.validation_fingerprint,
    closed_rail: buildClosedRail(),
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

function buildClosedRail() {
  return {
    contract_slice_complete: true,
    implementation_slice_complete: true,
    browser_validation_slice_complete: true,
    contract_fixture_path: contractFixturePath,
    implementation_fixture_path: implementationFixturePath,
    browser_validation_fixture_path: browserValidationFixturePath,
    contract_smoke_path: contractSmokePath,
    implementation_smoke_path: implementationSmokePath,
    browser_validation_smoke_path: browserValidationSmokePath,
  };
}

function buildClosedBoundarySummary() {
  return {
    dogfooding_record_candidate_context_not_truth: true,
    ci_signal_not_proof_or_evidence: true,
    smoke_pass_not_truth: true,
    smoke_fail_diagnostic_not_rejection: true,
    codex_result_report_candidate_input_not_execution_proof: true,
    pr_body_operator_report_not_authority: true,
    merge_status_context_not_product_write: true,
    changed_files_review_cues_not_correctness_proof: true,
    validation_commands_review_cues_not_execution_authority: true,
    warnings_diagnostic_not_failure_unless_policy_says_so: true,
    skipped_checks_explicitly_justified: true,
    authority_boundary_regression_candidate_alert_not_mutation: true,
    dogfooding_candidate_remains_candidate_until_future_gate: true,
    product_decision_delta_candidate_later_not_state_now: true,
    source_refs_required: true,
    pr_refs_public_safe: true,
    no_github_actions_addition: true,
    no_ci_runtime_change: true,
    no_ci_execution: true,
    no_runtime_dogfooding_ingestion: true,
    no_dogfooding_record_write: true,
    no_codex_execution: true,
    no_github_automation: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_db_write_or_query: true,
    no_perspective_promotion: true,
    no_proof_or_evidence_write: true,
    no_work_mutation: true,
    no_product_write_or_ids: true,
  };
}

function buildAuthorityBoundary() {
  return {
    closeout_added_now: true,
    contract_changed_now: false,
    implementation_changed_now: false,
    browser_validation_changed_now: false,
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
    provider_extraction_now: false,
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

function buildValidationPolicy() {
  return {
    closeout_is_summary_not_runtime: true,
    closeout_not_execution_authority: true,
    closeout_not_ci_runtime_change: true,
    closeout_not_github_actions_addition: true,
    closeout_not_ci_execution: true,
    closeout_not_dogfooding_record_write: true,
    closeout_not_codex_execution: true,
    closeout_not_github_automation: true,
    closeout_not_provider_openai_call: true,
    closeout_not_retrieval_rag_execution: true,
    closeout_not_db_write_or_query: true,
    closeout_not_perspective_promotion: true,
    closeout_not_proof_or_evidence_write: true,
    closeout_not_work_mutation: true,
    closeout_not_product_write: true,
    contract_implementation_validation_chain_preserved: true,
    all_source_fingerprints_present: true,
    all_boundary_flags_preserved: true,
    dogfooding_record_candidate_context_not_truth: true,
    smoke_pass_not_truth: true,
    smoke_fail_diagnostic_not_rejection: true,
    codex_result_report_candidate_input_not_execution_proof: true,
    pr_body_operator_report_not_authority: true,
    changed_files_review_cues_not_correctness_proof: true,
    validation_commands_review_cues_not_execution_authority: true,
    authority_boundary_regression_candidate_alert_not_mutation: true,
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
    public_safe_refs_only: true,
    public_safe_pr_refs_only: true,
    public_safe_source_refs_only: true,
    public_safe_warning_refs_only: true,
  };
}

function assertPackageScript() {
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    assertMilestoneCloseoutPackageScript();
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
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion closeout smoke script",
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
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    assertMilestoneCloseoutChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const protectedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `Dogfooding Research-to-Perspective CI Expansion closeout must not change ${protectedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedChangedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionCloseoutSliceActive",
      );
    assert.ok(
      expectedChangedFiles.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Dogfooding Research-to-Perspective CI Expansion closeout slice: ${changedFile}`,
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
  assert.doesNotMatch(filePath, /github.*actions|github.*automation|git.*automation|codex.*execution/i, "must not add automation runtime files");
  assert.doesNotMatch(filePath, /feedback.*(?:write|store)|agent.*substrate.*(?:mutat|exec)|salience.*write|durable.*memory|formation.*receipt.*write/i, "must not add feedback/substrate/memory runtime files");
}

function assertNoForbiddenRuntimePatterns() {
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") ||
        filePath.endsWith(".tsx") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".mjs")) &&
      filePath !== closeoutSmokePath &&
      filePath !== browserValidationSmokePath &&
      !filePath.startsWith("scripts/smoke-"),
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
  assert.doesNotMatch(
    stripNonCode(contractTypeSource),
    /\bfetch\s*\(|\bOpenAI\b|from\s+["'][^"']*openai[^"']*["']/i,
  );
  assert.doesNotMatch(
    stripNonCode(builderSource),
    /\bfetch\s*\(|from\s+["'][^"']*(?:openai|octokit|github)[^"']*["']/i,
  );
}

function assertSourceArtifactsUnchanged() {
  assert.deepEqual(
    contractFixture,
    readJsonFromGit(contractFixturePath),
    "#755 contract fixture must not change",
  );
  assert.deepEqual(
    implementationFixture,
    readJsonFromGit(implementationFixturePath),
    "#756 implementation fixture must not change",
  );
  assert.deepEqual(
    browserValidationFixture,
    readJsonFromGit(browserValidationFixturePath),
    "#757 browser validation fixture must not change",
  );
  assert.equal(
    contractTypeSource.trimEnd(),
    readTextFromGit(contractTypePath).trimEnd(),
    "#755 type contract must not change",
  );
  assert.equal(
    builderSource.trimEnd(),
    readTextFromGit(builderPath).trimEnd(),
    "#756 deterministic builder must not change",
  );
}

function assertCloseoutFixture(value) {
  assert.equal(value.closeout_kind, closeoutKind);
  assert.equal(value.closeout_version, closeoutVersion);
  assert.equal(value.source_contract_ref, `${contractFixture.contract_version}:${contractFixturePath}#755`);
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(value.source_implementation_ref, `${implementationFixture.implementation_version}:${implementationFixturePath}#756`);
  assert.equal(
    value.source_implementation_fingerprint,
    implementationFixture.implementation_fingerprint,
  );
  assert.equal(value.source_browser_validation_ref, `${browserValidationFixture.validation_version}:${browserValidationFixturePath}#757`);
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
  assert.deepEqual(value, buildClosedRail());
}

function assertClosedBoundarySummary(value) {
  assert.deepEqual(value, buildClosedBoundarySummary());
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
  assert.deepEqual(value, buildValidationPolicy());
}

function assertPrivacyPolicy(value) {
  assert.deepEqual(value, buildPrivacyPolicy());
  const fixtureText = JSON.stringify(fixture);
  assert.doesNotMatch(
    fixtureText,
    /sk-[A-Za-z0-9_-]{10,}|["']access_token["']\s*:|BEGIN OPENSSH PRIVATE KEY|"(?:thread|run)_[^"]+"|https?:\/\/(?:localhost|127\.0\.0\.1|internal|private)/i,
  );
}

function assertDocsPointers() {
  assertIncludes(indexDoc, [
    "Dogfooding Research-to-Perspective CI Expansion closeout v0.1",
    closeoutFixturePath,
    closeoutSmokePath,
    "contract -> implementation -> browser validation rail complete",
    "closeout is summary only, not runtime",
    "dogfooding record remains candidate/review context, not source of truth",
    "CI signal remains validation signal, not proof/evidence",
    "smoke pass remains not truth",
    "smoke fail remains diagnostic, not automatic rejection",
    "Codex result report remains candidate input, not execution proof",
    "PR body remains operator report, not authority",
    "changed files remain review cues, not proof of correctness",
    "validation commands remain review cues, not execution authority",
    "warnings remain diagnostic, not failure unless policy says so",
    "skipped checks must remain explicit and justified",
    "authority boundary regression remains candidate alert, not automatic mutation",
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
    "Dogfooding Research-to-Perspective CI Expansion rail is closed through contract, implementation, and browser validation.",
    "Closeout is summary-only and does not add runtime.",
    "Agent Substrate remains advisory-only and cannot treat smoke pass/fail, PR body, Codex result, or changed files as truth/authority.",
    "This slice does not add GitHub Actions, CI runtime, dogfooding ingestion, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Research-to-Perspective Foundation Milestone closeout v0.1.",
  ]);
  for (const doc of [surfaceDoc, gateDoc]) {
    assertIncludes(doc, [
      "Dogfooding CI expansion is closed as preview-only grammar.",
      "Dogfooding signals remain candidate/review context.",
      "Smoke pass is not truth.",
      "Smoke fail is diagnostic, not automatic rejection.",
      "Changed files are review cues, not correctness proof.",
      "PR body is operator report, not authority.",
      "This closeout does not implement runtime CI/browser/provider/source-fetch/retrieval/promotion/state/dogfooding behavior.",
    ]);
  }
}

function assertBrowserValidationSmokeDownstreamPointer() {
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    return;
  }
  assertIncludes(browserValidationSmokeSource, [
    "dogfoodingResearchToPerspectiveCiExpansionCloseoutSliceActive",
    closeoutVersion,
    closeoutFixturePath,
    closeoutSmokePath,
    packageScriptName,
    packageScriptValue,
    recommendationStatus,
    nextRecommendedSlice,
  ]);
}

function assertMilestoneCloseoutDownstreamPointer() {
  if (!researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    return;
  }
  assert.ok(existsSync(milestoneCloseoutFixturePath), `${milestoneCloseoutFixturePath} must exist`);
  assert.ok(existsSync(milestoneCloseoutSmokePath), `${milestoneCloseoutSmokePath} must exist`);
  assert.equal(
    packageJson.scripts[milestoneCloseoutPackageScriptName],
    milestoneCloseoutPackageScriptValue,
  );
  const milestoneCloseoutFixture = readJson(milestoneCloseoutFixturePath);
  assert.equal(milestoneCloseoutFixture.closeout_version, milestoneCloseoutVersion);
  assert.equal(
    milestoneCloseoutFixture.recommendation_status,
    milestoneCloseoutRecommendationStatus,
  );
  assert.equal(
    milestoneCloseoutFixture.next_recommended_slice,
    milestoneCloseoutNextRecommendedSlice,
  );
}

function assertMilestoneCloseoutPackageScript() {
  assert.equal(
    packageJson.scripts[milestoneCloseoutPackageScriptName],
    milestoneCloseoutPackageScriptValue,
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
    [milestoneCloseoutPackageScriptName],
    "package.json must add only the Research-to-Perspective Foundation Milestone closeout smoke script",
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

function assertMilestoneCloseoutChangedFiles(changedFiles) {
  const expected = [
    milestoneCloseoutFixturePath,
    milestoneCloseoutSmokePath,
    closeoutSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), `milestone closeout slice must include ${filePath}`);
  }
  for (const protectedPath of [
    closeoutFixturePath,
    contractTypePath,
    builderPath,
    contractFixturePath,
    implementationFixturePath,
    browserValidationFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `milestone closeout slice must not change ${protectedPath}`,
    );
  }
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
      `unexpected changed file in Research-to-Perspective Foundation Milestone closeout slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assertNoForbiddenChangedPath(changedFile);
  }
}

function researchToPerspectiveFoundationMilestoneCloseoutSliceActive() {
  return readChangedFiles().includes(milestoneCloseoutSmokePath);
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of ["origin/main", "main", "HEAD^", "Unable to resolve merge base"]) {
    assert.ok(readFile(closeoutSmokePath).includes(requiredText), `${closeoutSmokePath} must include ${requiredText}`);
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
