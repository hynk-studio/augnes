import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const contractTypePath =
  "types/durable-perspective-state-trajectory-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:durable-perspective-state-trajectory-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const implementationKind =
  "durable_perspective_state_trajectory_implementation";
const implementationVersion =
  "durable_perspective_state_trajectory_implementation.v0.1";
const previewVersion = "durable_perspective_state_trajectory_preview.v0.1";
const recommendationStatus =
  "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1";
const nextRecommendedSlice =
  "durable_perspective_state_trajectory_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "durable_perspective_state_trajectory_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "project_constellation_runtime_layout_contract_v0_1";
const projectLayoutTypePath =
  "types/project-constellation-runtime-layout-contract.ts";
const projectLayoutFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json";
const projectLayoutSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
const projectLayoutSourceValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const projectLayoutPackageScriptName =
  "smoke:project-constellation-runtime-layout-contract-v0-1";
const projectLayoutPackageScriptValue =
  "node scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs";
const projectLayoutContractVersion =
  "project_constellation_runtime_layout_contract.v0.1";
const projectLayoutRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_implementation_v0_1";
const projectLayoutNextRecommendedSlice =
  "project_constellation_runtime_layout_implementation_v0_1";
const projectLayoutContractDownstreamSmokePaths = [
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  "scripts/smoke-salience-governor-implementation-v0-1.mjs",
  "scripts/smoke-salience-governor-contract-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  "scripts/smoke-salience-governor-implementation-v0-1.mjs",
  "scripts/smoke-salience-governor-contract-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

const expectedChangedFiles = [
  builderPath,
  implementationFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
  ...downstreamSmokePaths,
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
  buildDurablePerspectiveStateTrajectoryImplementationFixture,
  buildDurablePerspectiveStateTrajectoryPreviewBundle,
  validateDurablePerspectiveStateTrajectoryPreviewBundle,
  createDurablePerspectiveStateTrajectoryFingerprint,
} = await import(
  "../lib/research-candidate-review/durable-perspective-state-trajectory.ts"
);

const sourceContractRef = `${contractFixture.contract_version}:${contractFixturePath}`;
const rebuiltImplementationFixture =
  buildDurablePerspectiveStateTrajectoryImplementationFixture({
    durable_perspective_state_trajectory_contract: contractFixture,
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
assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assert.deepEqual(
  fixture,
  rebuiltImplementationFixture,
  "rebuilt Durable Perspective State / Trajectory implementation fixture must match committed fixture",
);
assertImplementationFixture(fixture);
assertBuiltStateTrajectoryPreviewBundle(
  fixture.built_state_trajectory_preview_bundle,
);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidation(fixture.validated_implementation);
assertInvalidStatePreviewOverrideCoverage();
assertInvalidTrajectoryEventOverrideCoverage();
assertInvalidSnapshotOverrideCoverage();
assertInvalidAuthorityBoundaryOverrideCoverage();
assertInvalidRefsOverrideCoverage();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "durable-perspective-state-trajectory-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      state_fields_preserved:
        fixture.validated_implementation.state_fields_preserved,
      trajectory_event_families_preserved:
        fixture.validated_implementation.trajectory_event_families_preserved,
      runtime_state_write_implemented_now:
        fixture.authority_boundary.runtime_state_write_implemented_now,
      runtime_state_read_implemented_now:
        fixture.authority_boundary.runtime_state_read_implemented_now,
      durable_perspective_delta_apply_now:
        fixture.authority_boundary.durable_perspective_delta_apply_now,
      perspective_snapshot_runtime_implemented_now:
        fixture.authority_boundary.perspective_snapshot_runtime_implemented_now,
      trajectory_runtime_build_implemented_now:
        fixture.authority_boundary.trajectory_runtime_build_implemented_now,
      proof_or_evidence_record_write_now:
        fixture.authority_boundary.proof_or_evidence_record_write_now,
      accepted_evidence_write_now:
        fixture.authority_boundary.accepted_evidence_write_now,
      formation_receipt_write_now:
        fixture.authority_boundary.formation_receipt_write_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      provider_openai_call_now:
        fixture.authority_boundary.provider_openai_call_now,
      retrieval_rag_authority:
        fixture.authority_boundary.retrieval_rag_authority,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function assertContractArtifactsUnchanged() {
  assert.deepEqual(
    readJsonFromGit(contractFixturePath),
    contractFixture,
    "#733 contract fixture must not change in implementation slice",
  );
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${contractTypePath}`]),
    contractTypeSource.trimEnd(),
    "#733 type contract must not change in implementation slice",
  );
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildDurablePerspectiveStateTrajectoryImplementationFixture",
    "buildDurablePerspectiveStateTrajectoryPreviewBundle",
    "validateDurablePerspectiveStateTrajectoryPreviewBundle",
    "createDurablePerspectiveStateTrajectoryFingerprint",
    implementationKind,
    implementationVersion,
    "source_contract_ref",
    "source_contract_fingerprint",
    "implemented_contract",
    "deterministic_builder",
    "built_state_trajectory_preview_bundle",
    "state_field_summary",
    "trajectory_event_family_summary",
    "lineage_summary",
    "evidence_summary",
    "snapshot_summary",
    "salience_summary",
    "reference_summary",
    "validation",
    "authority_boundary",
    "invalid_state_preview_override_rejected",
    "invalid_trajectory_event_override_rejected",
    "invalid_snapshot_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "invalid_refs_override_rejected",
    "current_thesis_missing_lineage",
    "trajectory_event_missing_family_kind",
    "snapshot_not_derived_view",
    "runtime_state_write_enabled",
    "private_or_unstable_ref_detected",
    "product_id_allocation_enabled",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(
      builderSource.includes(requiredText),
      `${builderPath} must include ${requiredText}`,
    );
  }
  for (const exportedHelper of [
    "buildDurablePerspectiveStateTrajectoryImplementationFixture",
    "buildDurablePerspectiveStateTrajectoryPreviewBundle",
    "validateDurablePerspectiveStateTrajectoryPreviewBundle",
    "createDurablePerspectiveStateTrajectoryFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export function ${exportedHelper}\\b`),
      `${builderPath} must export ${exportedHelper}`,
    );
  }
}

function assertPackageScript() {
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript();
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
    "package.json must add only the Durable Perspective State / Trajectory implementation smoke script",
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
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of [
    contractTypePath,
    contractFixturePath,
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Durable Perspective State / Trajectory implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Durable Perspective State / Trajectory implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== builderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
      assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
      assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function projectConstellationRuntimeLayoutContractSliceActive() {
  return readChangedFiles().includes(projectLayoutSmokePath);
}

function assertProjectConstellationRuntimeLayoutContractPackageScript() {
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
  assert.equal(
    packageJson.scripts[projectLayoutPackageScriptName],
    projectLayoutPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles) {
  const expectedFiles = [
    projectLayoutTypePath,
    projectLayoutFixturePath,
    projectLayoutSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json",
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "lib/research-candidate-review/durable-perspective-state-trajectory.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(!changedFiles.includes(unchangedPath), "Project Constellation Runtime Layout contract slice must not change " + unchangedPath);
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Project Constellation Runtime Layout contract downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*layout", "i").test(changedFile), false, "must not add runtime layout implementation files");
    assert.equal(new RegExp("^lib/.*constellation", "i").test(changedFile), false, "must not add runtime constellation implementation files");
    assert.equal(new RegExp("^lib/.*graph", "i").test(changedFile), false, "must not add graph DB or graph mutation files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  assertProjectConstellationRuntimeLayoutContractDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutContractDownstreamPointer() {
  const sourceValidationSmoke = readFileSync(projectLayoutSourceValidationSmokePath, "utf8");
  for (const requiredText of [
    projectLayoutContractVersion,
    projectLayoutTypePath,
    projectLayoutFixturePath,
    projectLayoutSmokePath,
    projectLayoutPackageScriptName,
    projectLayoutRecommendationStatus,
    projectLayoutNextRecommendedSlice,
    "future stable Project Constellation layout grammar",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(sourceValidationSmoke.includes(requiredText), "#735 browser validation smoke must allow Project Constellation Runtime Layout contract downstream pointer: " + requiredText);
  }
}

function durablePerspectiveStateTrajectoryBrowserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}

function assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript() {
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
  assert.equal(
    packageJson.scripts[browserValidationPackageScriptName],
    browserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [browserValidationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory browser validation smoke script",
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

function assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    browserValidationFixturePath,
    browserValidationSmokePath,
    smokePath,
    contractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    contractTypePath,
    contractFixturePath,
    builderPath,
    implementationFixturePath,
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Durable Perspective State / Trajectory browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    browserValidationFixturePath,
    browserValidationSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Durable Perspective State / Trajectory browser validation downstream slice: " + changedFile,
    );
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #734",
    "current thesis has lineage",
    "PerspectiveSnapshot runtime not implemented",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      "smoke must allow Durable Perspective State / Trajectory browser validation downstream pointer: " + requiredText,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== contractTypePath &&
    (filePath.endsWith(".ts") ||
      filePath.endsWith(".tsx") ||
      filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-") &&
    !filePath.startsWith("types/"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser request", regex: /\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon/ },
      { label: "browser persistence", regex: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime DB query", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b/i },
      { label: "production DB read", regex: /\bproductionDb\b|\bAUGNES_DB_PATH\b/i },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "source fetch", regex: /\bfetchSource\b|\bsourceFetch\b|\bfetch\s*\(/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "external HTTP request", regex: /\bhttps?\.request\b|\bXMLHttpRequest\b/ },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "retrieval/RAG execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b|\bexecuteRetrieval\b/i },
      { label: "search runtime execution", regex: /\bsearchIndex\b|\bexecuteSearch\b|\brunSearch\b/i },
      { label: "index build/write", regex: /\bbuildIndex\b|\bwriteIndex\b|\bsourceIndexWrite\b|\bwriteSourceIndex\b/i },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bgenerateEmbedding\b|\bvectorIndex\b|\bvectorDb\b|\bFTS5\b|\bfullTextSearch\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
      { label: "candidate runtime generation", regex: /\brunCandidateGeneration\b|\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
      { label: "candidate record write", regex: /\bwriteCandidateRecord\b|\binsertCandidateRecord\b|\bpersistCandidateRecord\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "proof/evidence write", regex: /\b(write|insert|persist)(Proof|Evidence)\b|\bproof_or_evidence_record_write_now:\s*true\b/i },
      { label: "accepted evidence write", regex: /\bwriteAcceptedEvidence\b|\baccepted_evidence_write_now:\s*true\b/i },
      { label: "runtime promotion", regex: /\bpromotePerspective\b|\brunPerspectivePromotion\b|\bruntime_promotion_implemented_now:\s*true\b/i },
      { label: "durable Perspective state write", regex: /\bwriteDurablePerspective\b|\bapplyDurablePerspectiveDelta\b|\bdurable_perspective_state_write_now:\s*true\b/i },
      { label: "durable Perspective state read", regex: /\breadDurablePerspective\b|\bruntime_state_read_implemented_now:\s*true\b/i },
      { label: "PerspectiveSnapshot runtime", regex: /\bcreatePerspectiveSnapshot\b|\bperspective_snapshot_runtime_implemented_now:\s*true\b/i },
      { label: "trajectory runtime build", regex: /\bbuildRuntimeTrajectory\b|\btrajectory_runtime_build_implemented_now:\s*true\b/i },
      { label: "promotion decision record", regex: /\bpromotionDecisionRecord\b|\bwritePromotionDecision\b|\bpromotion_decision_record_write_now:\s*true\b/i },
      { label: "Formation Receipt write", regex: /\bwriteFormationReceipt\b|\bformation_receipt_write_now:\s*true\b/i },
      { label: "promotion history write", regex: /\bwritePromotionHistory\b|\bpromotion_history_write_now:\s*true\b/i },
      { label: "retirement history write", regex: /\bwriteRetirementHistory\b|\bretirement_history_write_now:\s*true\b/i },
      { label: "work mutation", regex: /\bmutateWork\b|\bupdateWork\b|\bwork_mutation_now:\s*true\b/i },
      { label: "salience authority true", regex: /\bsalience_authority:\s*true\b|\bsalience_score_used_as_authority_now:\s*true\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "product write", regex: /\bproductWrite\b|\bwriteProduct\b|\bproduct_write_authority:\s*true\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b|\bproduct_id_allocation_authority:\s*true\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertImplementationFixture(implementation) {
  assert.equal(implementation.implementation_kind, implementationKind);
  assert.equal(implementation.implementation_version, implementationVersion);
  assert.equal(implementation.source_contract_ref, sourceContractRef);
  assert.equal(
    implementation.source_contract_fingerprint,
    contractFixture.contract_fingerprint,
  );
  assert.deepEqual(implementation.implemented_contract, {
    contract_kind: contractFixture.contract_kind,
    contract_version: contractFixture.contract_version,
    contract_fixture_path: contractFixturePath,
    type_contract_path: contractTypePath,
    contract_authority_boundary_preserved: true,
    contract_validation_policy_preserved: true,
    contract_lineage_policy_preserved: true,
    contract_evidence_policy_preserved: true,
    contract_snapshot_policy_preserved: true,
    contract_salience_policy_preserved: true,
    contract_trajectory_event_families_preserved: true,
  });
  assert.equal(implementation.deterministic_builder.builder_path, builderPath);
  assert.equal(
    implementation.deterministic_builder.deterministic_fixture_backed_only,
    true,
  );
  for (const [key, value] of Object.entries(implementation.deterministic_builder)) {
    if (key === "builder_path" || key === "deterministic_fixture_backed_only") {
      continue;
    }
    assert.equal(value, false, `deterministic_builder.${key} must be false`);
  }
  assert.equal(implementation.recommendation_status, recommendationStatus);
  assert.equal(implementation.next_recommended_slice, nextRecommendedSlice);
  assert.equal(implementation.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    implementation.implementation_fingerprint,
    createDurablePerspectiveStateTrajectoryFingerprint(implementation),
  );
}

function assertBuiltStateTrajectoryPreviewBundle(bundle) {
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.deepEqual(
    bundle.authority_boundary,
    contractFixture.sample_durable_perspective_state_preview.authority_boundary,
  );
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(bundle.lineage_policy, contractFixture.lineage_policy);
  assert.deepEqual(bundle.evidence_policy, contractFixture.evidence_policy);
  assert.deepEqual(bundle.snapshot_policy, contractFixture.snapshot_policy);
  assert.deepEqual(bundle.salience_policy, contractFixture.salience_policy);
  assert.ok(
    !Object.hasOwn(bundle.authority_boundary, "implementation_added_now"),
    "generated preview authority_boundary must not include top-level implementation_added_now",
  );
  assert.ok(
    bundle.validation.passed,
    `preview bundle validation must pass: ${bundle.validation.failure_codes.join(", ")}`,
  );
  assert.deepEqual(
    buildDurablePerspectiveStateTrajectoryPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
    }),
    bundle,
  );
  assert.deepEqual(
    validateDurablePerspectiveStateTrajectoryPreviewBundle(
      withoutKey(bundle, "validation"),
      contractFixture,
    ),
    bundle.validation,
  );
  assert.deepEqual(
    bundle.state_field_summary.state_fields,
    contractFixture.state_fields,
  );
  assert.deepEqual(
    bundle.trajectory_event_family_summary.event_kinds,
    contractFixture.trajectory_event_families.map((family) => family.event_kind),
  );
  assert.equal(bundle.lineage_summary.current_thesis_has_lineage, true);
  assert.equal(bundle.lineage_summary.prior_theses_preserved, true);
  assert.equal(bundle.lineage_summary.retired_claims_remain_auditable, true);
  assert.equal(bundle.lineage_summary.contradicted_evidence_not_deleted, true);
  assert.equal(
    bundle.evidence_summary.supporting_and_contradicting_evidence_refs_distinct,
    true,
  );
  assert.equal(bundle.snapshot_summary.snapshot_is_derived_view, true);
  assert.equal(bundle.snapshot_summary.perspective_snapshot_runtime_now_false, true);
  assert.equal(bundle.snapshot_summary.snapshot_includes_authority_boundary, true);
  assert.equal(bundle.salience_summary.salience_state_not_authority, true);
  assert.equal(bundle.reference_summary.public_safe_refs_only, true);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.implementation_added_now, true);
  assert.equal(boundary.deterministic_builder_added_now, true);
  assert.equal(boundary.contract_changed_now, false);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (
      key === "implementation_added_now" ||
      key === "deterministic_builder_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      continue;
    }
    assert.equal(value, false, `authority_boundary.${key} must remain false`);
  }
}

function assertValidation(validation) {
  assert.equal(
    validation.passed,
    true,
    `implementation validation must pass: ${validation.failure_codes.join(", ")}`,
  );
  for (const requiredFlag of [
    "preview_bundle_follows_contract",
    "preview_bundle_authority_boundary_matches_contract",
    "preview_bundle_validation_policy_matches_contract",
    "preview_bundle_lineage_policy_matches_contract",
    "preview_bundle_evidence_policy_matches_contract",
    "preview_bundle_snapshot_policy_matches_contract",
    "preview_bundle_salience_policy_matches_contract",
    "top_level_implementation_boundary_is_separate",
    "state_fields_preserved",
    "trajectory_event_families_preserved",
    "current_thesis_has_lineage",
    "prior_thesis_not_overwritten_silently",
    "prior_theses_preserved",
    "retired_claims_remain_auditable",
    "contradicted_evidence_not_deleted",
    "open_tensions_preserved_or_explicitly_resolved",
    "knowledge_gaps_preserved_or_explicitly_deferred_or_closed",
    "supporting_and_contradicting_evidence_refs_distinct",
    "candidate_evidence_not_accepted_evidence",
    "accepted_evidence_refs_required_for_accepted_evidence_claims",
    "trajectory_events_source_ref_backed",
    "trajectory_events_promotion_record_ref_backed_later",
    "trajectory_events_runtime_write_now_false",
    "promotion_history_append_only_later",
    "retirement_history_append_only_later",
    "perspective_snapshot_shape_defined",
    "perspective_snapshot_runtime_now_false",
    "snapshot_is_derived_view",
    "snapshot_not_independent_source_of_truth",
    "snapshot_includes_lineage_refs",
    "snapshot_includes_open_tensions_and_knowledge_gaps",
    "salience_state_not_authority",
    "runtime_state_read_write_not_implemented",
    "durable_perspective_delta_apply_not_implemented",
    "proof_or_evidence_write_not_implemented",
    "accepted_evidence_write_not_implemented",
    "formation_receipt_write_not_implemented",
    "work_mutation_now_false",
    "public_safe_refs_only",
    "no_raw_private_source_body",
    "no_raw_provider_thread_run_session_ids",
    "no_private_urls",
    "no_secrets",
    "invalid_state_preview_override_rejected",
    "invalid_trajectory_event_override_rejected",
    "invalid_snapshot_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "invalid_refs_override_rejected",
  ]) {
    assert.equal(validation[requiredFlag], true, `${requiredFlag} must be true`);
  }
}

function assertInvalidStatePreviewOverrideCoverage() {
  const state = clone(
    contractFixture.sample_durable_perspective_state_preview
      .perspective_state_preview,
  );
  state.current_thesis.lineage_refs = [];
  state.current_thesis.promotion_record_refs = [];
  state.prior_theses = [{ ...state.prior_theses[0], preserved_for_audit: false, not_deleted: false }];
  state.active_claims = [
    {
      ...state.active_claims[0],
      supporting_evidence_refs: [],
      contradicting_evidence_refs: [],
    },
  ];
  state.contradicting_evidence_refs = [...state.supporting_evidence_refs];
  state.open_tensions = [];
  state.knowledge_gaps = [];
  state.salience_state.not_authority = false;
  state.promotion_history = [];
  state.retirement_history = [];
  state.current_thesis.not_written_now = false;
  assertInvalidPreview(
    { perspective_state_preview: state },
    [
      "active_claim_missing_supporting_or_contradicting_evidence_refs",
      "current_thesis_missing_lineage",
      "current_thesis_missing_promotion_record_refs",
      "knowledge_gaps_missing",
      "open_tensions_missing",
      "prior_thesis_deleted",
      "prior_thesis_not_preserved_for_audit",
      "promotion_history_missing",
      "retirement_history_missing",
      "salience_state_authority_enabled",
      "state_preview_runtime_write_enabled",
      "supporting_and_contradicting_evidence_refs_not_distinct",
    ],
  );
}

function assertInvalidTrajectoryEventOverrideCoverage() {
  const trajectory = clone(
    contractFixture.sample_durable_perspective_state_preview.trajectory_preview,
  );
  trajectory.trajectory_events = [
    {
      event_kind: "",
      event_ref: "trajectory_event_ref:public:missing_kind",
      source_refs: [],
      promotion_record_refs: [],
      lineage_refs: [],
      runtime_write_now: true,
      public_safe: true,
    },
    {
      event_kind: "unknown_family_kind",
      event_ref: "trajectory_event_ref:private:unknown",
      source_refs: ["source_ref:private:unstable"],
      promotion_record_refs: [],
      lineage_refs: [],
      runtime_write_now: true,
      public_safe: false,
    },
  ];
  trajectory.all_events_public_safe = false;
  trajectory.all_events_runtime_write_now_false = false;
  trajectory.all_events_source_ref_backed = false;
  trajectory.all_events_preserve_lineage = false;
  assertInvalidPreview(
    { trajectory_preview: trajectory },
    [
      "trajectory_event_missing_family_kind",
      "trajectory_event_missing_lineage_refs",
      "trajectory_event_missing_source_refs",
      "trajectory_event_runtime_write_enabled",
      "trajectory_event_unknown_family_kind",
      "trajectory_missing_event_family",
      "trajectory_not_public_safe",
    ],
  );
}

function assertInvalidSnapshotOverrideCoverage() {
  const snapshot = clone(
    contractFixture.sample_durable_perspective_state_preview
      .perspective_snapshot_preview,
  );
  snapshot.snapshot_is_derived_view = false;
  snapshot.snapshot_runtime_now = true;
  snapshot.includes_lineage_refs = false;
  snapshot.includes_current_thesis = false;
  snapshot.includes_prior_theses = false;
  snapshot.includes_active_claims = false;
  snapshot.includes_supporting_and_contradicting_evidence_refs = false;
  snapshot.includes_open_tensions = false;
  snapshot.includes_knowledge_gaps = false;
  snapshot.includes_authority_boundary = false;
  snapshot.snapshot_independent_source_of_truth = true;
  assertInvalidPreview(
    { perspective_snapshot_preview: snapshot },
    [
      "snapshot_independent_source_of_truth_enabled",
      "snapshot_missing_active_claims",
      "snapshot_missing_authority_boundary",
      "snapshot_missing_current_thesis",
      "snapshot_missing_knowledge_gaps",
      "snapshot_missing_lineage_refs",
      "snapshot_missing_open_tensions",
      "snapshot_missing_prior_theses",
      "snapshot_missing_supporting_and_contradicting_evidence_refs",
      "snapshot_not_derived_view",
      "snapshot_runtime_enabled",
    ],
  );
}

function assertInvalidAuthorityBoundaryOverrideCoverage() {
  const invalid = buildDurablePerspectiveStateTrajectoryImplementationFixture({
    durable_perspective_state_trajectory_contract: contractFixture,
    source_contract_ref: sourceContractRef,
    authority_boundary_overrides: {
      runtime_state_write_implemented_now: true,
      runtime_state_read_implemented_now: true,
      durable_perspective_state_write_now: true,
      durable_perspective_delta_apply_now: true,
      perspective_snapshot_runtime_implemented_now: true,
      trajectory_runtime_build_implemented_now: true,
      promotion_history_write_now: true,
      retirement_history_write_now: true,
      proof_or_evidence_record_write_now: true,
      accepted_evidence_write_now: true,
      formation_receipt_write_now: true,
      work_mutation_now: true,
      runtime_db_query_now: true,
      runtime_db_write_now: true,
      provider_openai_call_now: true,
      runtime_retrieval_rag_implemented_now: true,
      source_fetch_now: true,
      crawler_now: true,
      product_write_authority: true,
      product_id_allocation_authority: true,
    },
  });
  assert.equal(invalid.validated_implementation.passed, false);
  assertIncludesAll(invalid.validated_implementation.failure_codes, [
    "accepted_evidence_write_enabled",
    "crawler_enabled",
    "durable_perspective_delta_apply_enabled",
    "durable_perspective_state_write_enabled",
    "formation_receipt_write_enabled",
    "perspective_snapshot_runtime_enabled",
    "product_id_allocation_enabled",
    "product_write_enabled",
    "promotion_history_write_enabled",
    "proof_or_evidence_record_write_enabled",
    "provider_openai_call_enabled",
    "retirement_history_write_enabled",
    "retrieval_rag_execution_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "runtime_state_read_enabled",
    "runtime_state_write_enabled",
    "source_fetch_enabled",
    "trajectory_runtime_build_enabled",
    "work_mutation_enabled",
  ]);
}

function assertInvalidRefsOverrideCoverage() {
  const state = clone(
    contractFixture.sample_durable_perspective_state_preview
      .perspective_state_preview,
  );
  state.perspective_id = "";
  state.current_thesis.source_refs = [];
  state.active_claims[0].source_refs = [];
  state.active_claims[0].supporting_evidence_refs = [
    "candidate_evidence_ref:public:not_accepted",
  ];
  state.supporting_evidence_refs = [
    "candidate_evidence_ref:public:not_accepted",
  ];
  state.current_thesis.summary = "raw_private_source_body should fail closed";
  state.open_tensions[0].source_refs = ["https://example.invalid/private"];
  state.knowledge_gaps[0].source_refs = ["source_ref:private:unstable"];
  state.promotion_history = state.promotion_history.map((record) => ({
    ...record,
    source_refs: [],
  }));
  const trajectory = clone(
    contractFixture.sample_durable_perspective_state_preview.trajectory_preview,
  );
  trajectory.trajectory_events = trajectory.trajectory_events.map((event, index) => ({
    ...event,
    source_refs: index === 0 ? ["thread_private_run_session_1"] : [],
  }));
  assertInvalidPreview(
    {
      perspective_state_preview: state,
      trajectory_preview: trajectory,
    },
    [
      "accepted_evidence_ref_missing_for_supported_claim",
      "candidate_evidence_used_as_accepted_evidence",
      "perspective_id_missing",
      "private_or_unstable_ref_detected",
      "raw_private_source_body_detected",
      "raw_provider_thread_run_session_id_detected",
      "source_refs_missing",
    ],
  );
}

function assertInvalidPreview(overrides, requiredFailureCodes) {
  const invalid = buildDurablePerspectiveStateTrajectoryPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    ...overrides,
  });
  assert.equal(invalid.validation.passed, false);
  assertIncludesAll(invalid.validation.failure_codes, requiredFailureCodes);
}

function assertDocsPointers() {
  for (const [docPath, docText] of [
    [indexPath, indexDoc],
    [substrateDocPath, substrateDoc],
    [surfaceDocPath, surfaceDoc],
    [gateDocPath, gateDoc],
  ]) {
    for (const requiredText of [
      "Durable Perspective State / Trajectory implementation v0.1",
      "deterministic fixture-backed",
      "current thesis has lineage",
      "prior thesis is not overwritten silently",
      "retired claims remain auditable",
      "Contradicted evidence is not deleted",
      "no runtime state read/write",
      "no durable Perspective delta apply",
      "no PerspectiveSnapshot runtime",
      "no trajectory runtime build",
      "no proof/evidence write",
      "no accepted evidence write",
      "no Formation Receipt write",
      "no product write",
      "product-write remains parked by #686",
      nextRecommendedSlice,
    ]) {
      assert.ok(
        docText.includes(requiredText),
        `${docPath} must document ${requiredText}`,
      );
    }
  }
  for (const requiredText of [
    builderPath,
    implementationFixturePath,
    smokePath,
    "validates and materializes #733 durable state/trajectory preview bundle",
  ]) {
    assert.ok(indexDoc.includes(requiredText), `${indexPath} must include ${requiredText}`);
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    builderPath,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "current thesis has lineage",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      "#733 contract smoke must allow Durable Perspective State / Trajectory implementation downstream pointer: " +
        requiredText,
    );
  }
}

function assertPortableMergeBaseFallback() {
  const source = smokeSource;
  assert.match(source, /origin\/main/);
  assert.match(source, /\bmain\b/);
  assert.match(source, /HEAD\^/);
  assert.match(source, /Unable to resolve merge base/);
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]));
}

function readChangedFiles() {
  const diffFiles = readGitOutput([
    "diff",
    "--name-only",
    "--diff-filter=ACMRT",
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
  return [...new Set([...diffFiles, ...untrackedFiles])].sort();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) {
    return cachedMergeBaseRef;
  }
  for (const candidate of ["origin/main", "main", "HEAD^"]) {
    try {
      execFileSync("git", ["rev-parse", "--verify", candidate], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      cachedMergeBaseRef = candidate;
      return cachedMergeBaseRef;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error("Unable to resolve merge base from origin/main, main, or HEAD^");
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

function stripValidationText(source) {
  return source
    .replace(/"[^"]*"/g, "\"\"")
    .replace(/'[^']*'/g, "''")
    .replace(/`[^`]*`/g, "``");
}

function withoutKey(value, keyToDrop) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== keyToDrop),
  );
}

function assertIncludesAll(actual, expected) {
  for (const expectedValue of expected) {
    assert.ok(
      actual.includes(expectedValue),
      `expected failure code ${expectedValue}; got ${actual.join(", ")}`,
    );
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
