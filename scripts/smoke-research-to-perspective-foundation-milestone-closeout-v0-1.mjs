import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const dogfoodingCloseoutFixturePath =
  "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-closeout.sample.v0.1.json";
const dogfoodingCloseoutSmokePath =
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs";
const closeoutFixturePath =
  "fixtures/research-candidate-review.research-to-perspective-foundation-milestone-closeout.sample.v0.1.json";
const smokePath =
  "scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:research-to-perspective-foundation-milestone-closeout-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs";
const fixtureSmokeLegacyAuditDocPath =
  "docs/RESEARCH_TO_PERSPECTIVE_FIXTURE_SMOKE_LEGACY_AUDIT_V0_1.md";
const fixtureSmokeLegacyAuditFixturePath =
  "fixtures/research-candidate-review.fixture-smoke-legacy-audit.sample.v0.1.json";
const fixtureSmokeLegacyAuditSmokePath =
  "scripts/smoke-research-to-perspective-fixture-smoke-legacy-audit-v0-1.mjs";
const fixtureSmokeLegacyAuditPackageScriptName =
  "smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1";
const fixtureSmokeLegacyAuditPackageScriptValue =
  "node scripts/smoke-research-to-perspective-fixture-smoke-legacy-audit-v0-1.mjs";
const foundationStatusReviewDocPath =
  "docs/RESEARCH_TO_PERSPECTIVE_FOUNDATION_STATUS_REVIEW_V0_1.md";
const foundationStatusReviewFixturePath =
  "fixtures/research-candidate-review.foundation-status-review.sample.v0.1.json";
const foundationStatusReviewSmokePath =
  "scripts/smoke-research-to-perspective-foundation-status-review-v0-1.mjs";
const foundationStatusReviewPackageScriptName =
  "smoke:research-to-perspective-foundation-status-review-v0-1";
const foundationStatusReviewPackageScriptValue =
  "node scripts/smoke-research-to-perspective-foundation-status-review-v0-1.mjs";
const closeoutKind = "research_to_perspective_foundation_milestone_closeout";
const closeoutVersion =
  "research_to_perspective_foundation_milestone_closeout.v0.1";
const recommendationStatus =
  "ready_for_foundation_status_review_and_next_runtime_slice_selection_v0_1";
const nextRecommendedSlice =
  "foundation_status_review_and_next_runtime_slice_selection_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const expectedChangedFiles = [
  closeoutFixturePath,
  smokePath,
  dogfoodingCloseoutSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
];

for (const filePath of [
  dogfoodingCloseoutFixturePath,
  dogfoodingCloseoutSmokePath,
  smokePath,
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

const dogfoodingCloseoutFixture = readJson(dogfoodingCloseoutFixturePath);
const dogfoodingCloseoutSmokeSource = readFile(dogfoodingCloseoutSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const rebuiltFixture = buildMilestoneCloseoutFixture();

if (writeFixture) {
  writeFileSync(closeoutFixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(closeoutFixturePath);

assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertDogfoodingCloseoutUnchanged();
assertRailSourcesExist(fixture.milestone_rail_sources);
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Research-to-Perspective Foundation Milestone closeout fixture must match committed fixture",
);
assertCloseoutFixture(fixture);
assertClosedMilestone(fixture.closed_milestone);
assertClosedBoundarySummary(fixture.closed_boundary_summary);
assertFoundationAcceptanceSummary(fixture.foundation_acceptance_summary);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertDogfoodingCloseoutSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "research-to-perspective-foundation-milestone-closeout-v0-1",
      final_status: "pass",
      closeout_kind: fixture.closeout_kind,
      closeout_version: fixture.closeout_version,
      source_dogfooding_closeout_fingerprint:
        fixture.source_dogfooding_closeout_fingerprint,
      milestone_name: fixture.closed_milestone.milestone_name,
      grammar_boundary_scaffold_complete:
        fixture.foundation_acceptance_summary.grammar_boundary_scaffold_complete,
      runtime_persistence_not_opened:
        fixture.foundation_acceptance_summary.runtime_persistence_not_opened,
      provider_runtime_not_opened:
        fixture.foundation_acceptance_summary.provider_runtime_not_opened,
      retrieval_rag_runtime_not_opened:
        fixture.foundation_acceptance_summary.retrieval_rag_runtime_not_opened,
      product_write_not_opened:
        fixture.foundation_acceptance_summary.product_write_not_opened,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildMilestoneCloseoutFixture() {
  const closeout = {
    closeout_kind: closeoutKind,
    closeout_version: closeoutVersion,
    source_dogfooding_closeout_ref:
      `${dogfoodingCloseoutFixture.closeout_version}:${dogfoodingCloseoutFixturePath}#758`,
    source_dogfooding_closeout_fingerprint:
      dogfoodingCloseoutFixture.closeout_fingerprint,
    closed_milestone: buildClosedMilestone(),
    milestone_rail_sources: buildMilestoneRailSources(),
    closed_boundary_summary: buildClosedBoundarySummary(),
    foundation_acceptance_summary: buildFoundationAcceptanceSummary(),
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

function buildClosedMilestone() {
  return {
    milestone_name: "Research-to-Perspective Foundation",
    milestone_closeout_summary:
      "Contract/fixture/smoke-based foundation scaffold complete through Dogfooding Research-to-Perspective CI Expansion closeout.",
    dogfooding_ci_expansion_rail_complete: true,
    agent_perspective_substrate_feedback_loop_rail_complete: true,
    perspective_packet_receipt_linkage_rail_complete: true,
    codex_handoff_draft_rail_complete: true,
    ai_context_packet_rail_complete: true,
    perspective_geometry_digest_rail_complete: true,
    project_constellation_layout_rail_complete: true,
    durable_perspective_state_trajectory_rail_complete: true,
    human_reviewed_durable_perspective_promotion_rail_complete: true,
    non_authoritative_retrieval_rag_rail_complete: true,
    operator_source_candidate_generation_rail_complete: true,
    bounded_external_source_intake_rail_complete: true,
    salience_governor_rail_complete: true,
    recent_rehearsal_buffer_rail_complete: true,
    formation_receipt_durable_event_rail_complete: true,
    feedback_event_store_rail_complete: true,
  };
}

function buildMilestoneRailSources() {
  return [
    {
      rail_key: "dogfooding_ci_expansion",
      fixture_paths: [
        "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
        "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json",
        "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-browser-validation.sample.v0.1.json",
        dogfoodingCloseoutFixturePath,
      ],
      smoke_paths: [
        "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
        "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs",
        "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs",
        dogfoodingCloseoutSmokePath,
      ],
    },
    railSource("agent-perspective-substrate-feedback-loop", true),
    railSource("perspective-packet-receipt-linkage"),
    railSource("codex-handoff-draft"),
    railSource("ai-context-packet"),
    railSource("perspective-geometry-digest"),
    railSource("project-constellation-runtime-layout"),
    railSource("durable-perspective-state-trajectory"),
    railSource("human-reviewed-durable-perspective-promotion"),
    railSource("non-authoritative-retrieval-rag"),
    railSource("operator-source-candidate-generation"),
    railSource("bounded-external-source-intake"),
    railSource("salience-governor"),
    railSource("recent-rehearsal-buffer"),
    railSource("formation-receipt-durable-event"),
    feedbackEventStoreRailSource(),
  ];
}

function railSource(baseName, hasCloseout = false) {
  const fixtureBase = baseName.replaceAll("-", "_");
  const fixturePrefix = `fixtures/research-candidate-review.${baseName}`;
  const smokePrefix = `scripts/smoke-${baseName}`;
  const entry = {
    rail_key: fixtureBase,
    fixture_paths: [
      `${fixturePrefix}-contract.sample.v0.1.json`,
      `${fixturePrefix}-implementation.sample.v0.1.json`,
      `${fixturePrefix}-browser-validation.sample.v0.1.json`,
    ],
    smoke_paths: [
      `${smokePrefix}-contract-v0-1.mjs`,
      `${smokePrefix}-implementation-v0-1.mjs`,
      `${smokePrefix}-browser-validation-v0-1.mjs`,
    ],
  };
  if (hasCloseout) {
    entry.fixture_paths.push(`${fixturePrefix}-closeout.sample.v0.1.json`);
    entry.smoke_paths.push(`${smokePrefix}-closeout-v0-1.mjs`);
  }
  return entry;
}

function feedbackEventStoreRailSource() {
  const bases = [
    "feedback-event-write-route",
    "feedback-event-controls-ui",
    "feedback-event-store-list-route",
    "feedback-event-store-list-ui",
    "feedback-event-aggregation-read-model",
  ];
  return {
    rail_key: "feedback_event_store",
    fixture_paths: bases.flatMap((baseName) => {
      const prefix = `fixtures/research-candidate-review.${baseName}`;
      return [
        `${prefix}-contract.sample.v0.1.json`,
        `${prefix}-implementation.sample.v0.1.json`,
        `${prefix}-browser-validation.sample.v0.1.json`,
      ];
    }),
    smoke_paths: [
      ...bases.flatMap((baseName) => {
        const prefix = `scripts/smoke-${baseName}`;
        return [
          `${prefix}-contract-v0-1.mjs`,
          `${prefix}-implementation-v0-1.mjs`,
          `${prefix}-browser-validation-v0-1.mjs`,
        ];
      }),
      "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
      "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    ],
  };
}

function buildClosedBoundarySummary() {
  return {
    candidate_remains_candidate: true,
    evidence_candidate_not_proof_or_evidence_record: true,
    perspective_delta_candidate_not_durable_state: true,
    follow_up_candidate_not_work_item: true,
    retrieval_rag_recall_not_authority: true,
    provider_output_not_authority: true,
    source_ref_reference_only_until_bounded_runtime: true,
    agent_substrate_folded_derived_advisory_only: true,
    ai_context_packet_context_not_execution_authority: true,
    codex_handoff_draft_not_execution_approval: true,
    packet_receipt_linkage_provenance_not_completion_proof: true,
    feedback_operator_signal_not_truth: true,
    dogfooding_record_candidate_context_not_truth: true,
    ci_signal_not_proof_or_evidence: true,
    smoke_pass_not_truth: true,
    smoke_fail_diagnostic_not_rejection: true,
    product_write_lane_parked_by_686: true,
  };
}

function buildFoundationAcceptanceSummary() {
  return {
    grammar_boundary_scaffold_complete: true,
    contract_fixtures_smokes_complete: true,
    deterministic_preview_builders_complete: true,
    browser_static_validations_complete: true,
    rail_closeouts_complete: true,
    runtime_persistence_not_opened: true,
    provider_runtime_not_opened: true,
    retrieval_rag_runtime_not_opened: true,
    product_write_not_opened: true,
    future_runtime_requires_explicit_contract_and_gate: true,
  };
}

function buildAuthorityBoundary() {
  return {
    milestone_closeout_added_now: true,
    dogfooding_closeout_changed_now: false,
    runtime_behavior_added_now: false,
    github_actions_added_now: false,
    ci_runtime_change_now: false,
    ci_execution_now: false,
    runtime_dogfooding_ingestion_now: false,
    dogfooding_record_write_now: false,
    feedback_event_write_now: false,
    agent_substrate_mutation_now: false,
    salience_write_now: false,
    durable_memory_write_now: false,
    linkage_record_write_now: false,
    formation_receipt_write_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    candidate_record_write_now: false,
    candidate_mutation_now: false,
    work_mutation_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    milestone_closeout_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildValidationPolicy() {
  return {
    milestone_closeout_is_summary_not_runtime: true,
    milestone_closeout_not_execution_authority: true,
    milestone_closeout_not_product_write: true,
    milestone_closeout_not_promotion: true,
    milestone_closeout_not_proof_or_evidence: true,
    all_source_fingerprints_present: true,
    all_boundary_flags_preserved: true,
    product_write_lane_parked_by_686: true,
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
  };
}

function assertPackageScript() {
  if (researchToPerspectiveFoundationStatusReviewSliceActive()) {
    assertResearchToPerspectiveFoundationStatusReviewPackageScript();
    return;
  }
  if (researchToPerspectiveFixtureSmokeLegacyAuditSliceActive()) {
    assertResearchToPerspectiveFixtureSmokeLegacyAuditPackageScript();
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

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (researchToPerspectiveFoundationStatusReviewSliceActive()) {
    assertResearchToPerspectiveFoundationStatusReviewChangedFiles(changedFiles);
    return;
  }
  if (researchToPerspectiveFixtureSmokeLegacyAuditSliceActive()) {
    assertResearchToPerspectiveFixtureSmokeLegacyAuditChangedFiles(changedFiles);
    return;
  }
  const protectedFixturePaths = new Set(
    buildMilestoneRailSources()
      .flatMap((source) => source.fixture_paths)
      .filter((filePath) => filePath !== closeoutFixturePath),
  );
  protectedFixturePaths.add(dogfoodingCloseoutFixturePath);
  protectedFixturePaths.add("lib/db/schema.sql");

  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const protectedPath of protectedFixturePaths) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      `Foundation Milestone closeout must not change ${protectedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedChangedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "researchToPerspectiveFoundationMilestoneCloseoutSliceActive",
      );
    assert.ok(
      expectedChangedFiles.includes(changedFile) || allowedDownstreamSmoke,
      `unexpected changed file in Research-to-Perspective Foundation Milestone closeout slice: ${changedFile}`,
    );
    if (allowedDownstreamSmoke) continue;
    assertNoForbiddenChangedPath(changedFile);
  }
}

function researchToPerspectiveFixtureSmokeLegacyAuditSliceActive() {
  return readChangedFiles().includes(fixtureSmokeLegacyAuditSmokePath);
}

function researchToPerspectiveFoundationStatusReviewSliceActive() {
  return readChangedFiles().includes(foundationStatusReviewSmokePath);
}

function assertResearchToPerspectiveFoundationStatusReviewPackageScript() {
  assert.equal(
    packageJson.scripts[foundationStatusReviewPackageScriptName],
    foundationStatusReviewPackageScriptValue,
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
    [foundationStatusReviewPackageScriptName],
    "package.json must add only the Research-to-Perspective foundation status review smoke script",
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

function assertResearchToPerspectiveFoundationStatusReviewChangedFiles(changedFiles) {
  const expected = [
    foundationStatusReviewDocPath,
    foundationStatusReviewFixturePath,
    foundationStatusReviewSmokePath,
    smokePath,
    packagePath,
    indexPath,
  ];
  for (const filePath of expected) {
    assert.ok(
      changedFiles.includes(filePath),
      `foundation status review slice must include ${filePath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expected.includes(changedFile),
      `unexpected changed file in foundation status review slice: ${changedFile}`,
    );
    if (changedFile.startsWith("scripts/smoke-")) continue;
    assertNoForbiddenChangedPath(changedFile);
  }
}

function assertResearchToPerspectiveFixtureSmokeLegacyAuditPackageScript() {
  assert.equal(
    packageJson.scripts[fixtureSmokeLegacyAuditPackageScriptName],
    fixtureSmokeLegacyAuditPackageScriptValue,
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
    [fixtureSmokeLegacyAuditPackageScriptName],
    "package.json must add only the Research-to-Perspective fixture smoke legacy audit smoke script",
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

function assertResearchToPerspectiveFixtureSmokeLegacyAuditChangedFiles(changedFiles) {
  const expected = [
    fixtureSmokeLegacyAuditDocPath,
    fixtureSmokeLegacyAuditFixturePath,
    fixtureSmokeLegacyAuditSmokePath,
    smokePath,
    dogfoodingCloseoutSmokePath,
    "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    packagePath,
    indexPath,
  ];
  for (const filePath of expected) {
    assert.ok(
      changedFiles.includes(filePath),
      `fixture smoke legacy audit slice must include ${filePath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expected.includes(changedFile),
      `unexpected changed file in fixture smoke legacy audit slice: ${changedFile}`,
    );
    if (changedFile.startsWith("scripts/smoke-")) continue;
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
  assert.doesNotMatch(filePath, /runtime.*ci.*exec|ci.*runtime.*exec|github.*actions|github.*automation|git.*automation|codex.*execution/i, "must not add runtime automation files");
  assert.doesNotMatch(filePath, /feedback.*(?:write|store)|agent.*substrate.*(?:mutat|exec)|salience.*write|durable.*memory|formation.*receipt.*write/i, "must not add feedback/substrate/memory runtime files");
}

function assertNoForbiddenRuntimePatterns() {
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") ||
        filePath.endsWith(".tsx") ||
        filePath.endsWith(".js") ||
        filePath.endsWith(".mjs")) &&
      filePath !== smokePath &&
      filePath !== dogfoodingCloseoutSmokePath &&
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
    assert.doesNotMatch(source, /\bcreateEvidence\b|\bwriteEvidence\b|\bacceptedEvidence\b/i, `${filePath} must not write proof/evidence`);
    assert.doesNotMatch(source, /\bpromotePerspective\b|\bpromotionDecision\b|\bapplyPerspectiveDelta\b/i, `${filePath} must not implement Perspective promotion or state mutation`);
    assert.doesNotMatch(source, /\bmutateWork\b|\bupdateWork\b|\bcreateCandidate\b|\bwriteCandidate\b|\bmutateCandidate\b/i, `${filePath} must not mutate work or candidates`);
    assert.doesNotMatch(source, /\bproductId\b|\bproduct_id\b|\bwriteProduct\b|\bcreateProduct\b/i, `${filePath} must not implement product writes or IDs`);
  }
}

function assertDogfoodingCloseoutUnchanged() {
  assert.deepEqual(
    dogfoodingCloseoutFixture,
    readJsonFromGit(dogfoodingCloseoutFixturePath),
    "#758 Dogfooding Research-to-Perspective CI Expansion closeout fixture must not change",
  );
}

function assertRailSourcesExist(sources) {
  assert.deepEqual(sources, buildMilestoneRailSources());
  for (const source of sources) {
    assert.ok(source.rail_key, "rail source must include rail_key");
    for (const filePath of [...source.fixture_paths, ...source.smoke_paths]) {
      assert.ok(existsSync(filePath), `${source.rail_key} source file must exist: ${filePath}`);
    }
  }
}

function assertCloseoutFixture(value) {
  assert.equal(value.closeout_kind, closeoutKind);
  assert.equal(value.closeout_version, closeoutVersion);
  assert.equal(
    value.source_dogfooding_closeout_ref,
    `${dogfoodingCloseoutFixture.closeout_version}:${dogfoodingCloseoutFixturePath}#758`,
  );
  assert.equal(
    value.source_dogfooding_closeout_fingerprint,
    dogfoodingCloseoutFixture.closeout_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32");
  assert.equal(
    value.closeout_fingerprint,
    createFingerprint({ ...value, closeout_fingerprint: "" }),
  );
}

function assertClosedMilestone(value) {
  assert.deepEqual(value, buildClosedMilestone());
  for (const [key, flag] of Object.entries(value)) {
    if (key.endsWith("_rail_complete")) {
      assert.equal(flag, true, `closed_milestone.${key} must be true`);
    }
  }
}

function assertClosedBoundarySummary(value) {
  assert.deepEqual(value, buildClosedBoundarySummary());
}

function assertFoundationAcceptanceSummary(value) {
  assert.deepEqual(value, buildFoundationAcceptanceSummary());
}

function assertAuthorityBoundary(value) {
  assert.equal(value.milestone_closeout_added_now, true);
  assert.equal(value.dogfooding_closeout_changed_now, false);
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (key === "milestone_closeout_added_now" || key === "product_write_lane_parked_by_686") {
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
    "Research-to-Perspective Foundation Milestone closeout v0.1",
    closeoutFixturePath,
    smokePath,
    "foundation scaffold complete through Dogfooding Research-to-Perspective CI Expansion closeout",
    "closeout is summary only, not runtime",
    "candidate remains candidate",
    "evidence candidate is not proof/evidence record",
    "perspective delta candidate is not durable state",
    "retrieval/RAG remains recall, not authority",
    "provider/OpenAI output remains non-authoritative",
    "Agent Substrate remains folded, derived, advisory-only",
    "AI Context Packet remains context, not execution authority",
    "Codex Handoff Draft remains draft, not execution approval",
    "Packet Receipt Linkage remains provenance, not completion proof",
    "Dogfooding record remains candidate/review context, not truth",
    "CI signal remains validation signal, not proof/evidence",
    "smoke pass remains not truth",
    "smoke fail remains diagnostic, not automatic rejection",
    "no runtime persistence opened",
    "no provider runtime opened",
    "no retrieval/RAG runtime opened",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]);
  assertIncludes(substrateDoc, [
    "Research-to-Perspective Foundation Milestone closeout confirms current Agent Substrate related rails remain folded, derived, advisory-only.",
    "Closeout is summary-only and does not add runtime.",
    "No new execution, provider, retrieval/RAG, DB, promotion, proof/evidence, route/UI, or product-write behavior is added.",
    "Next recommended slice is Foundation Status Review and Next Runtime Slice Selection v0.1.",
  ]);
  for (const doc of [surfaceDoc, gateDoc]) {
    assertIncludes(doc, [
      "Foundation milestone closeout summarizes completed candidate/review/provenance/boundary scaffold.",
      "It does not make candidates durable facts.",
      "It does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/dogfooding behavior.",
      "Next work must be selected explicitly after reviewing remaining runtime risk.",
    ]);
  }
}

function assertDogfoodingCloseoutSmokeDownstreamPointer() {
  assertIncludes(dogfoodingCloseoutSmokeSource, [
    "researchToPerspectiveFoundationMilestoneCloseoutSliceActive",
    closeoutVersion,
    closeoutFixturePath,
    smokePath,
    packageScriptName,
    packageScriptValue,
    recommendationStatus,
    nextRecommendedSlice,
  ]);
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of ["origin/main", "main", "HEAD^", "Unable to resolve merge base"]) {
    assert.ok(readFile(smokePath).includes(requiredText), `${smokePath} must include ${requiredText}`);
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
