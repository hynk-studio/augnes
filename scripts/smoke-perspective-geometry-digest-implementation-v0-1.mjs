import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/perspective-geometry-digest.ts";
const contractTypePath = "types/perspective-geometry-digest-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:perspective-geometry-digest-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs";
const implementationKind = "perspective_geometry_digest_implementation";
const implementationVersion = "perspective_geometry_digest_implementation.v0.1";
const previewVersion = "perspective_geometry_digest_preview.v0.1";
const recommendationStatus =
  "ready_for_perspective_geometry_digest_browser_validation_v0_1";
const nextRecommendedSlice =
  "perspective_geometry_digest_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:perspective-geometry-digest-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs";
const browserValidationKind = "perspective_geometry_digest_browser_validation";
const browserValidationVersion =
  "perspective_geometry_digest_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_ai_context_packet_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "ai_context_packet_contract_v0_1";
const aiContextPacketTypePath = "types/ai-context-packet-contract.ts";
const aiContextPacketFixturePath =
  "fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json";
const aiContextPacketSmokePath =
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs";
const aiContextPacketPackageScriptName =
  "smoke:ai-context-packet-contract-v0-1";
const aiContextPacketPackageScriptValue =
  "node scripts/smoke-ai-context-packet-contract-v0-1.mjs";
const aiContextPacketContractVersion = "ai_context_packet_contract.v0.1";
const aiContextPacketRecommendationStatus =
  "ready_for_ai_context_packet_implementation_v0_1";
const aiContextPacketNextRecommendedSlice =
  "ai_context_packet_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;
const perspectivePacketReceiptLinkageTypePath =
  "types/perspective-packet-receipt-linkage-contract.ts";
const perspectivePacketReceiptLinkageFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json";
const perspectivePacketReceiptLinkageSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs";
const perspectivePacketReceiptLinkageSourceValidationSmokePath =
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs";
const perspectivePacketReceiptLinkagePackageScriptName =
  "smoke:perspective-packet-receipt-linkage-contract-v0-1";
const perspectivePacketReceiptLinkagePackageScriptValue =
  "node scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs";
const perspectivePacketReceiptLinkageVersion =
  "perspective_packet_receipt_linkage_contract.v0.1";
const perspectivePacketReceiptLinkageRecommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_implementation_v0_1";
const perspectivePacketReceiptLinkageNextRecommendedSlice =
  "perspective_packet_receipt_linkage_implementation_v0_1";
const perspectivePacketReceiptLinkageDownstreamSmokePaths = [
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs",
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
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


const downstreamSmokePaths = [
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
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
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
];
const browserValidationDownstreamSmokePaths = [
  contractSmokePath,
  ...downstreamSmokePaths.filter(
    (filePath) =>
      filePath !==
      "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  ),
];
const aiContextPacketImplementationBuilderPath =
  "lib/research-candidate-review/ai-context-packet.ts";
const aiContextPacketImplementationFixturePath =
  "fixtures/research-candidate-review.ai-context-packet-implementation.sample.v0.1.json";
const aiContextPacketImplementationSmokePath =
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs";
const aiContextPacketImplementationPackageScriptName =
  "smoke:ai-context-packet-implementation-v0-1";
const aiContextPacketImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ai-context-packet-implementation-v0-1.mjs";
const aiContextPacketImplementationVersion =
  "ai_context_packet_implementation.v0.1";
const aiContextPacketImplementationRecommendationStatus =
  "ready_for_ai_context_packet_browser_validation_v0_1";
const aiContextPacketImplementationNextRecommendedSlice =
  "ai_context_packet_browser_validation_v0_1";
const aiContextPacketBrowserValidationFixturePath =
  "fixtures/research-candidate-review.ai-context-packet-browser-validation.sample.v0.1.json";
const aiContextPacketBrowserValidationSmokePath =
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs";
const aiContextPacketBrowserValidationPackageScriptName =
  "smoke:ai-context-packet-browser-validation-v0-1";
const aiContextPacketBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs";
const aiContextPacketBrowserValidationVersion =
  "ai_context_packet_browser_validation.v0.1";
const aiContextPacketBrowserValidationRecommendationStatus =
  "ready_for_codex_handoff_draft_contract_v0_1";
const aiContextPacketBrowserValidationNextRecommendedSlice =
  "codex_handoff_draft_contract_v0_1";
const codexHandoffDraftTypePath = "types/codex-handoff-draft-contract.ts";
const codexHandoffDraftFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json";
const codexHandoffDraftSmokePath =
  "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs";
const codexHandoffDraftPackageScriptName =
  "smoke:codex-handoff-draft-contract-v0-1";
const codexHandoffDraftPackageScriptValue =
  "node scripts/smoke-codex-handoff-draft-contract-v0-1.mjs";
const codexHandoffDraftContractVersion =
  "codex_handoff_draft_contract.v0.1";
const codexHandoffDraftRecommendationStatus =
  "ready_for_codex_handoff_draft_implementation_v0_1";
const codexHandoffDraftNextRecommendedSlice =
  "codex_handoff_draft_implementation_v0_1";
const codexHandoffDraftImplementationBuilderPath =
  "lib/research-candidate-review/codex-handoff-draft.ts";
const codexHandoffDraftImplementationFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json";
const codexHandoffDraftImplementationSmokePath =
  "scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs";
const codexHandoffDraftContractSmokePath =
  "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs";
const codexHandoffDraftImplementationPackageScriptName =
  "smoke:codex-handoff-draft-implementation-v0-1";
const codexHandoffDraftImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs";
const codexHandoffDraftImplementationVersion =
  "codex_handoff_draft_implementation.v0.1";
const codexHandoffDraftImplementationRecommendationStatus =
  "ready_for_codex_handoff_draft_browser_validation_v0_1";
const codexHandoffDraftImplementationNextRecommendedSlice =
  "codex_handoff_draft_browser_validation_v0_1";
const codexHandoffDraftBrowserValidationFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json";
const codexHandoffDraftBrowserValidationSmokePath =
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs";
const codexHandoffDraftBrowserValidationPackageScriptName =
  "smoke:codex-handoff-draft-browser-validation-v0-1";
const codexHandoffDraftBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs";
const codexHandoffDraftBrowserValidationVersion =
  "codex_handoff_draft_browser_validation.v0.1";
const codexHandoffDraftBrowserValidationRecommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_contract_v0_1";
const codexHandoffDraftBrowserValidationNextRecommendedSlice =
  "perspective_packet_receipt_linkage_contract_v0_1";

const aiContextPacketDownstreamSmokePaths = [
  smokePath,
  contractSmokePath,
  browserValidationSmokePath,
  ...downstreamSmokePaths.filter(
    (filePath) =>
      filePath !==
      "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  ),
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

const protectedUnchangedPaths = [
  contractTypePath,
  contractFixturePath,
  "fixtures/research-candidate-review.project-constellation-runtime-layout-browser-validation.sample.v0.1.json",
  "types/project-constellation-runtime-layout-contract.ts",
  "fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json",
  "lib/research-candidate-review/project-constellation-runtime-layout.ts",
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json",
  "types/durable-perspective-state-trajectory-contract.ts",
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts",
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json",
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
  buildPerspectiveGeometryDigestImplementationFixture,
  buildPerspectiveGeometryDigestPreviewBundle,
  validatePerspectiveGeometryDigestPreviewBundle,
  createPerspectiveGeometryDigestFingerprint,
} = await import(
  "../lib/research-candidate-review/perspective-geometry-digest.ts"
);

const sourceContractRef = `${contractFixture.contract_version}:${contractFixturePath}`;
const rebuiltImplementationFixture =
  buildPerspectiveGeometryDigestImplementationFixture({
    perspective_geometry_digest_contract: contractFixture,
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
  "rebuilt Perspective Geometry Digest implementation fixture must match committed fixture",
);
assertImplementationFixture(fixture);
assertBuiltDigestPreviewBundle(
  fixture.built_perspective_geometry_digest_preview_bundle,
);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidation(fixture.validated_implementation);
assertInvalidDigestPreviewOverrideCoverage();
assertInvalidClusterDigestOverrideCoverage();
assertInvalidNodeDigestOverrideCoverage();
assertInvalidRelationshipDigestOverrideCoverage();
assertInvalidDiagnosticOverrideCoverage();
assertInvalidAuthorityBoundaryOverrideCoverage();
assertInvalidRefsOverrideCoverage();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-geometry-digest-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      digest_principles_preserved:
        fixture.validated_implementation.digest_principles_preserved,
      cluster_digest_families_preserved:
        fixture.validated_implementation.cluster_digest_families_preserved,
      node_digest_families_preserved:
        fixture.validated_implementation.node_digest_families_preserved,
      relationship_digest_families_preserved:
        fixture.validated_implementation.relationship_digest_families_preserved,
      diagnostic_families_preserved:
        fixture.validated_implementation.diagnostic_families_preserved,
      geometry_digest_runtime_build_implemented_now:
        fixture.authority_boundary.geometry_digest_runtime_build_implemented_now,
      geometry_digest_write_now:
        fixture.authority_boundary.geometry_digest_write_now,
      runtime_layout_execution_now:
        fixture.authority_boundary.runtime_layout_execution_now,
      graph_mutation_now: fixture.authority_boundary.graph_mutation_now,
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
    "#739 contract fixture must not change in implementation slice",
  );
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${contractTypePath}`]),
    contractTypeSource.trimEnd(),
    "#739 type contract must not change in implementation slice",
  );
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildPerspectiveGeometryDigestImplementationFixture",
    "buildPerspectiveGeometryDigestPreviewBundle",
    "validatePerspectiveGeometryDigestPreviewBundle",
    "createPerspectiveGeometryDigestFingerprint",
    "deterministic_fixture_backed_only",
    "geometry_digest_runtime_build_now: false",
    "geometry_digest_write_now: false",
    "geometry_calculation_runtime_now: false",
    "raw_coordinate_only_digest_now: false",
    "ai_context_packet_now: false",
    "codex_handoff_now: false",
    "provider_openai_call_now: false",
    "retrieval_rag_execution_now: false",
    "product_write_lane_parked_by_686",
    "invalidDigestPreviewOverrideRejected",
    "invalidClusterDigestOverrideRejected",
    "invalidNodeDigestOverrideRejected",
    "invalidRelationshipDigestOverrideRejected",
    "invalidDiagnosticOverrideRejected",
    "invalidAuthorityBoundaryOverrideRejected",
    "invalidRefsOverrideRejected",
  ]) {
    assert.ok(
      builderSource.includes(requiredText),
      `${builderPath} must include ${requiredText}`,
    );
  }
}

function assertPackageScript() {
  if (perspectivePacketReceiptLinkageContractSliceActive()) {
    assertPerspectivePacketReceiptLinkageContractPackageScript();
    return;
  }
  if (codexHandoffDraftBrowserValidationSliceActive()) {
    assertCodexHandoffDraftBrowserValidationPackageScript();
    return;
  }
  if (codexHandoffDraftImplementationSliceActive()) {
    assertCodexHandoffDraftImplementationPackageScript();
    return;
  }
  if (codexHandoffDraftContractSliceActive()) {
    assertCodexHandoffDraftContractPackageScript();
    return;
  }
  if (aiContextPacketBrowserValidationSliceActive()) {
    assertAIContextPacketBrowserValidationPackageScript();
    return;
  }
  if (aiContextPacketImplementationSliceActive()) {
    assertAIContextPacketImplementationPackageScript();
    return;
  }
  if (aiContextPacketContractSliceActive()) {
    assertAIContextPacketContractPackageScript();
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
    "package.json must add only the Perspective Geometry Digest implementation smoke script",
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
  if (perspectivePacketReceiptLinkageContractSliceActive()) {
    assertPerspectivePacketReceiptLinkageContractChangedFiles(changedFiles);
    return;
  }
  if (codexHandoffDraftBrowserValidationSliceActive()) {
    assertCodexHandoffDraftBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (codexHandoffDraftImplementationSliceActive()) {
    assertCodexHandoffDraftImplementationChangedFiles(changedFiles);
    return;
  }
  if (codexHandoffDraftContractSliceActive()) {
    assertCodexHandoffDraftContractChangedFiles(changedFiles);
    return;
  }
  if (aiContextPacketBrowserValidationSliceActive()) {
    assertAIContextPacketBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (aiContextPacketImplementationSliceActive()) {
    assertAIContextPacketImplementationChangedFiles(changedFiles);
    return;
  }
  if (aiContextPacketContractSliceActive()) {
    assertAIContextPacketContractChangedFiles(changedFiles);
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Geometry Digest implementation slice must not change ${unchangedPath}`,
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
      `unexpected changed file in Perspective Geometry Digest implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== builderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest files outside the deterministic builder");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout files");
    assert.doesNotMatch(changedFile, /^lib\/.*constellation/i, "must not add runtime constellation implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*graph/i, "must not add graph DB or graph mutation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}


function codexHandoffDraftBrowserValidationSliceActive() {
  return readChangedFiles().includes(codexHandoffDraftBrowserValidationSmokePath);
}

function assertCodexHandoffDraftBrowserValidationPackageScript() {
  assert.equal(
    packageJson.scripts[codexHandoffDraftBrowserValidationPackageScriptName],
    codexHandoffDraftBrowserValidationPackageScriptValue,
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
    [codexHandoffDraftBrowserValidationPackageScriptName],
    "package.json must add only the Codex Handoff Draft browser validation smoke script",
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

function assertCodexHandoffDraftBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    codexHandoffDraftBrowserValidationFixturePath,
    codexHandoffDraftBrowserValidationSmokePath,
    codexHandoffDraftImplementationSmokePath,
    codexHandoffDraftContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    aiContextPacketBrowserValidationSmokePath,
    aiContextPacketImplementationSmokePath,
    aiContextPacketSmokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    codexHandoffDraftImplementationBuilderPath,
    codexHandoffDraftImplementationFixturePath,
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    aiContextPacketBrowserValidationFixturePath,
    aiContextPacketImplementationBuilderPath,
    aiContextPacketImplementationFixturePath,
    aiContextPacketTypePath,
    aiContextPacketFixturePath,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertCodexHandoffDraftBrowserValidationDownstreamPointer();
}

function assertCodexHandoffDraftBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(codexHandoffDraftBrowserValidationSmokePath, "utf8");
  for (const requiredText of [
    codexHandoffDraftBrowserValidationVersion,
    codexHandoffDraftBrowserValidationFixturePath,
    codexHandoffDraftBrowserValidationSmokePath,
    codexHandoffDraftBrowserValidationPackageScriptName,
    codexHandoffDraftBrowserValidationRecommendationStatus,
    codexHandoffDraftBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      codexHandoffDraftBrowserValidationSmokePath + " must include " + requiredText,
    );
  }
}

function codexHandoffDraftImplementationSliceActive() {
  return readChangedFiles().includes(codexHandoffDraftImplementationSmokePath);
}

function assertCodexHandoffDraftImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[codexHandoffDraftImplementationPackageScriptName],
    codexHandoffDraftImplementationPackageScriptValue,
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
    [codexHandoffDraftImplementationPackageScriptName],
    "package.json must add only the Codex Handoff Draft implementation smoke script",
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

function assertCodexHandoffDraftImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    codexHandoffDraftImplementationBuilderPath,
    codexHandoffDraftImplementationFixturePath,
    codexHandoffDraftImplementationSmokePath,
    codexHandoffDraftSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    aiContextPacketBrowserValidationSmokePath,
    aiContextPacketImplementationSmokePath,
    aiContextPacketSmokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    aiContextPacketBrowserValidationFixturePath,
    aiContextPacketImplementationBuilderPath,
    aiContextPacketImplementationFixturePath,
    aiContextPacketTypePath,
    aiContextPacketFixturePath,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== codexHandoffDraftImplementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files outside deterministic builder");
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertCodexHandoffDraftImplementationDownstreamPointer();
}

function assertCodexHandoffDraftImplementationDownstreamPointer() {
  const implementationSmoke = readFileSync(codexHandoffDraftImplementationSmokePath, "utf8");
  for (const requiredText of [
    codexHandoffDraftImplementationVersion,
    codexHandoffDraftImplementationFixturePath,
    codexHandoffDraftImplementationSmokePath,
    codexHandoffDraftImplementationPackageScriptName,
    codexHandoffDraftImplementationRecommendationStatus,
    codexHandoffDraftImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      implementationSmoke.includes(requiredText),
      codexHandoffDraftImplementationSmokePath + " must include " + requiredText,
    );
  }
}

function codexHandoffDraftContractSliceActive() {
  return readChangedFiles().includes(codexHandoffDraftSmokePath);
}

function assertCodexHandoffDraftContractPackageScript() {
  assert.equal(
    packageJson.scripts[codexHandoffDraftPackageScriptName],
    codexHandoffDraftPackageScriptValue,
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
    [codexHandoffDraftPackageScriptName],
    "package.json must add only the Codex Handoff Draft contract smoke script",
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

function assertCodexHandoffDraftContractChangedFiles(changedFiles) {
  const expectedFiles = [
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    codexHandoffDraftSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    aiContextPacketBrowserValidationSmokePath,
    aiContextPacketImplementationSmokePath,
    aiContextPacketSmokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    aiContextPacketBrowserValidationFixturePath,
    aiContextPacketImplementationBuilderPath,
    aiContextPacketImplementationFixturePath,
    aiContextPacketTypePath,
    aiContextPacketFixturePath,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertCodexHandoffDraftContractDownstreamPointer();
}

function assertCodexHandoffDraftContractDownstreamPointer() {
  const contractSmoke = readFileSync(codexHandoffDraftSmokePath, "utf8");
  for (const requiredText of [
    codexHandoffDraftContractVersion,
    codexHandoffDraftFixturePath,
    codexHandoffDraftSmokePath,
    codexHandoffDraftPackageScriptName,
    codexHandoffDraftRecommendationStatus,
    codexHandoffDraftNextRecommendedSlice,
  ]) {
    assert.ok(
      contractSmoke.includes(requiredText),
      `Codex Handoff Draft contract smoke must include ${requiredText}`,
    );
  }
}
function aiContextPacketBrowserValidationSliceActive() {
  return readChangedFiles().includes(aiContextPacketBrowserValidationSmokePath);
}

function assertAIContextPacketBrowserValidationPackageScript() {
  assert.equal(
    packageJson.scripts[aiContextPacketBrowserValidationPackageScriptName],
    aiContextPacketBrowserValidationPackageScriptValue,
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
    [aiContextPacketBrowserValidationPackageScriptName],
    "package.json must add only the AI Context Packet browser validation smoke script",
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

function assertAIContextPacketBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    aiContextPacketBrowserValidationFixturePath,
    aiContextPacketBrowserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    aiContextPacketImplementationSmokePath,
    aiContextPacketSmokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    aiContextPacketTypePath,
    aiContextPacketFixturePath,
    aiContextPacketImplementationBuilderPath,
    aiContextPacketImplementationFixturePath,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `AI Context Packet browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in AI Context Packet browser validation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAIContextPacketBrowserValidationDownstreamPointer();
}

function assertAIContextPacketBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(aiContextPacketBrowserValidationSmokePath, "utf8");
  for (const requiredText of [
    aiContextPacketBrowserValidationVersion,
    aiContextPacketBrowserValidationFixturePath,
    aiContextPacketBrowserValidationSmokePath,
    aiContextPacketBrowserValidationPackageScriptName,
    aiContextPacketBrowserValidationRecommendationStatus,
    aiContextPacketBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      `AI Context Packet browser validation smoke must include ${requiredText}`,
    );
  }
}
function aiContextPacketImplementationSliceActive() {
  return readChangedFiles().includes(aiContextPacketImplementationSmokePath);
}

function assertAIContextPacketImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[aiContextPacketImplementationPackageScriptName],
    aiContextPacketImplementationPackageScriptValue,
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
    [aiContextPacketImplementationPackageScriptName],
    "package.json must add only the AI Context Packet implementation smoke script",
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

function assertAIContextPacketImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    aiContextPacketImplementationBuilderPath,
    aiContextPacketImplementationFixturePath,
    aiContextPacketImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    aiContextPacketSmokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [aiContextPacketTypePath, aiContextPacketFixturePath]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `AI Context Packet implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in AI Context Packet implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile.startsWith("lib/")) {
      assert.equal(
        changedFile,
        aiContextPacketImplementationBuilderPath,
        "implementation slice may only change the deterministic AI Context Packet builder under lib",
      );
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAIContextPacketImplementationDownstreamPointer();
}

function assertAIContextPacketImplementationDownstreamPointer() {
  const implementationSmoke = readFileSync(aiContextPacketImplementationSmokePath, "utf8");
  for (const requiredText of [
    aiContextPacketImplementationVersion,
    aiContextPacketImplementationFixturePath,
    aiContextPacketImplementationSmokePath,
    aiContextPacketImplementationPackageScriptName,
    aiContextPacketImplementationRecommendationStatus,
    aiContextPacketImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      implementationSmoke.includes(requiredText),
      `AI Context Packet implementation smoke must include ${requiredText}`,
    );
  }
}
function aiContextPacketContractSliceActive() {
  return readChangedFiles().includes(aiContextPacketSmokePath);
}

function assertAIContextPacketContractPackageScript() {
  assert.equal(
    packageJson.scripts[aiContextPacketPackageScriptName],
    aiContextPacketPackageScriptValue,
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
    [aiContextPacketPackageScriptName],
    "package.json must add only the AI Context Packet contract smoke script",
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

function assertAIContextPacketContractChangedFiles(changedFiles) {
  const expectedFiles = [
    aiContextPacketTypePath,
    aiContextPacketFixturePath,
    aiContextPacketSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in AI Context Packet contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAIContextPacketContractDownstreamPointer();
}

function assertAIContextPacketContractDownstreamPointer() {
  const contractSmoke = readFileSync(aiContextPacketSmokePath, "utf8");
  for (const requiredText of [
    aiContextPacketContractVersion,
    aiContextPacketFixturePath,
    aiContextPacketSmokePath,
    aiContextPacketPackageScriptName,
    aiContextPacketRecommendationStatus,
    aiContextPacketNextRecommendedSlice,
  ]) {
    assert.ok(
      contractSmoke.includes(requiredText),
      `AI Context Packet contract smoke must include ${requiredText}`,
    );
  }
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
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
    "package.json must add only the Perspective Geometry Digest browser validation smoke script",
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

function assertBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    browserValidationFixturePath,
    browserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    ...browserValidationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Geometry Digest browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Perspective Geometry Digest browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest files");
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout files");
    assert.doesNotMatch(changedFile, /^lib\/.*constellation/i, "must not add runtime constellation implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*graph/i, "must not add graph DB or graph mutation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  const strippedBuilder = stripNonCode(builderSource);
  const forbiddenBuilderPatterns = [
    [/import\s+.*\breact\b/i, "must not import React"],
    [/from\s+["'][^"']*(d3|react-flow|reactflow)[^"']*["']/i, "must not import D3 or React Flow"],
    [/\bOpenAI\b|\bfrom\s+["'][^"']*openai[^"']*["']/i, "must not import OpenAI"],
    [/\bfetch\s*\(/, "must not call fetch"],
    [/\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, "must not call browser request APIs"],
    [/\brequestAnimationFrame\s*\(/, "must not schedule animation frames"],
    [/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, "must not use browser persistence"],
    [/\bcreateClient\b|\bdb\.\w+\s*\(|\bquery\s*\(/, "must not call DB APIs"],
    [/\bcanvas\b|\bWebGL\b|\bReactFlow\b|\bforceSimulation\b/, "must not implement layout UI or graph runtime"],
  ];
  for (const [pattern, message] of forbiddenBuilderPatterns) {
    assert.doesNotMatch(strippedBuilder, pattern, `${builderPath} ${message}`);
  }
  for (const filePath of readChangedFiles()) {
    if (!filePath.endsWith(".mjs") && !filePath.endsWith(".ts")) {
      continue;
    }
    if (filePath.startsWith("scripts/smoke-") || filePath.startsWith("types/")) {
      continue;
    }
    const source = stripValidationText(stripNonCode(readFile(filePath)));
    for (const { label, regex } of [
      { label: "runtime geometry digest build", regex: /\bgeometry_digest_runtime_build_implemented_now:\s*true\b/i },
      { label: "geometry digest write", regex: /\bgeometry_digest_write_now:\s*true\b/i },
      { label: "raw-coordinate-only digest", regex: /\braw_coordinate_only_digest_now:\s*true\b/i },
      { label: "runtime layout execution", regex: /\bruntime_layout_execution_now:\s*true\b/i },
      { label: "graph mutation", regex: /\bgraph_mutation_now:\s*true\b/i },
      { label: "AI Context Packet", regex: /\bai_context_packet_implemented_now:\s*true\b/i },
      { label: "Codex handoff", regex: /\bcodex_handoff_implemented_now:\s*true\b/i },
      { label: "provider/OpenAI call", regex: /\bprovider_openai_call_now:\s*true\b/i },
      { label: "retrieval/RAG execution", regex: /\bretrieval_rag_execution_now:\s*true\b|\bretrieval_rag_authority:\s*true\b/i },
      { label: "source fetch", regex: /\bsource_fetch_now:\s*true\b|\bcrawler_now:\s*true\b/i },
      { label: "runtime DB", regex: /\bruntime_db_(query|write)_now:\s*true\b/i },
      { label: "product write", regex: /\bproduct_write_authority:\s*true\b|\bproduct_id_allocation_authority:\s*true\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not contain ${label}`);
    }
  }
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(value.source_contract_ref, sourceContractRef);
  assert.equal(
    value.source_contract_fingerprint,
    createPerspectiveGeometryDigestFingerprint(contractFixture),
  );
  assert.equal(value.implemented_contract.contract_kind, contractFixture.contract_kind);
  assert.equal(value.implemented_contract.contract_version, contractFixture.contract_version);
  assert.equal(value.implemented_contract.contract_fixture_path, contractFixturePath);
  assert.equal(value.implemented_contract.type_contract_path, contractTypePath);
  for (const flag of [
    "contract_authority_boundary_preserved",
    "contract_validation_policy_preserved",
    "contract_digest_principles_preserved",
    "contract_recommendation_policy_preserved",
    "contract_cluster_digest_families_preserved",
    "contract_node_digest_families_preserved",
    "contract_relationship_digest_families_preserved",
    "contract_diagnostic_families_preserved",
  ]) {
    assert.equal(value.implemented_contract[flag], true);
  }
  assert.equal(value.deterministic_builder.builder_path, builderPath);
  assert.equal(value.deterministic_builder.deterministic_fixture_backed_only, true);
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  const valueWithoutImplementationFingerprint = { ...value };
  delete valueWithoutImplementationFingerprint.implementation_fingerprint;
  assert.equal(
    value.implementation_fingerprint,
    createPerspectiveGeometryDigestFingerprint(valueWithoutImplementationFingerprint),
  );
}

function assertBuiltDigestPreviewBundle(bundle) {
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.equal(bundle.operator_context_ref, contractFixture.sample_perspective_geometry_digest_preview.operator_context_ref);
  assert.deepEqual(bundle.digest_input_preview, contractFixture.sample_perspective_geometry_digest_preview.digest_input_preview);
  assert.deepEqual(bundle.geometry_digest_preview, contractFixture.sample_perspective_geometry_digest_preview.geometry_digest_preview);
  assert.deepEqual(bundle.authority_boundary, contractFixture.sample_perspective_geometry_digest_preview.authority_boundary);
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(bundle.recommendation_policy, contractFixture.recommendation_policy);
  assert.equal(bundle.authority_boundary.implementation_added_now, false);
  assert.ok(!Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"));
  assert.equal(bundle.validation.passed, true);
  assert.deepEqual(bundle.validation.failure_codes, []);
  assert.deepEqual(bundle.cluster_digest_family_summary.cluster_kinds.sort(), contractFixture.cluster_digest_families.map((family) => family.cluster_kind).sort());
  assert.deepEqual(bundle.node_digest_family_summary.node_digest_kinds.sort(), contractFixture.node_digest_families.map((family) => family.node_digest_kind).sort());
  assert.deepEqual(bundle.relationship_digest_family_summary.relationship_kinds.sort(), contractFixture.relationship_digest_families.map((family) => family.relationship_kind).sort());
  assert.deepEqual(bundle.diagnostic_family_summary.diagnostic_kinds.sort(), contractFixture.diagnostic_families.map((family) => family.diagnostic_kind).sort());
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
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function assertValidation(validation) {
  assert.equal(validation.passed, true);
  assert.deepEqual(validation.failure_codes, []);
  for (const [key, value] of Object.entries(validation)) {
    if (key === "passed") {
      assert.equal(value, true);
    } else if (key === "failure_codes") {
      assert.deepEqual(value, []);
    } else {
      assert.equal(value, true, `${key} must be true`);
    }
  }
}

function assertInvalidDigestPreviewOverrideCoverage() {
  assertInvalidOverride("digest preview", [
    "digest_preview_missing_digest_id",
    "digest_preview_missing_source_refs",
    "digest_preview_raw_coordinates_used_as_truth",
    "digest_preview_raw_coordinate_only_digest_enabled",
    "digest_preview_runtime_write_enabled",
    "digest_preview_not_public_safe",
    "digest_preview_missing_contradiction_pairs",
    "digest_preview_missing_coverage_gaps",
    "digest_preview_missing_recommended_retrieval_expansion",
    "digest_preview_retrieval_execution_enabled",
  ]);
}

function assertInvalidClusterDigestOverrideCoverage() {
  assertInvalidOverride("cluster digest", [
    "cluster_digest_missing_cluster_ref",
    "cluster_digest_missing_source_refs",
    "cluster_digest_not_interpretation_only",
    "cluster_digest_truth_enabled",
    "cluster_digest_runtime_write_enabled",
    "underrepresented_cluster_missing_reason",
    "stale_influential_cluster_missing_stale_marker",
  ]);
}

function assertInvalidNodeDigestOverrideCoverage() {
  assertInvalidOverride("node digest", [
    "node_digest_missing_node_ref",
    "node_digest_missing_source_refs",
    "bridge_node_digest_not_navigation_hint",
    "stale_high_gravity_node_authority_enabled",
    "tension_node_resolution_implied",
    "knowledge_gap_node_closure_implied",
    "candidate_overlay_node_not_candidate_only",
    "candidate_overlay_node_durable_graph_ref_enabled",
    "source_reference_node_raw_body_enabled",
    "node_digest_runtime_write_enabled",
  ]);
}

function assertInvalidRelationshipDigestOverrideCoverage() {
  assertInvalidOverride("relationship digest", [
    "relationship_digest_missing_relationship_kind",
    "relationship_digest_unknown_family_kind",
    "contradiction_pair_missing_source_refs",
    "contradiction_pair_resolution_enabled",
    "evidence_chain_proof_write_enabled",
    "evidence_chain_missing_refs",
    "coverage_gap_inferred_fact_enabled",
    "retrieval_expansion_not_advisory",
    "retrieval_expansion_execution_enabled",
    "relationship_digest_runtime_write_enabled",
  ]);
}

function assertInvalidDiagnosticOverrideCoverage() {
  assertInvalidOverride("diagnostic", [
    "diagnostic_unknown_family_kind",
    "diagnostic_not_advisory",
    "diagnostic_truth_enabled",
    "diagnostic_promotion_authority_enabled",
    "manual_gravity_distribution_authority_enabled",
    "coverage_gap_count_fact_enabled",
    "contradiction_pair_count_resolution_enabled",
  ]);
}

function assertInvalidAuthorityBoundaryOverrideCoverage() {
  assertInvalidOverride("authority boundary", [
    "geometry_digest_runtime_build_enabled",
    "geometry_digest_write_enabled",
    "geometry_calculation_runtime_enabled",
    "raw_coordinate_authority_enabled",
    "raw_coordinate_only_digest_enabled",
    "runtime_layout_enabled",
    "graph_db_enabled",
    "graph_mutation_enabled",
    "component_changed_enabled",
    "route_changed_enabled",
    "browser_request_enabled",
    "browser_persistence_enabled",
    "request_animation_frame_enabled",
    "durable_perspective_state_read_enabled",
    "durable_perspective_state_write_enabled",
    "durable_perspective_delta_apply_enabled",
    "ai_context_packet_enabled",
    "codex_handoff_enabled",
    "proof_or_evidence_record_write_enabled",
    "accepted_evidence_write_enabled",
    "formation_receipt_write_enabled",
    "work_mutation_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "provider_openai_call_enabled",
    "retrieval_rag_execution_enabled",
    "source_fetch_enabled",
    "crawler_enabled",
    "geometry_digest_authority_enabled",
    "diagnostic_authority_enabled",
    "recommendation_authority_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ]);
}

function assertInvalidRefsOverrideCoverage() {
  assertInvalidOverride("refs", [
    "digest_id_missing",
    "private_or_unstable_ref_detected",
    "source_refs_missing",
    "raw_private_source_body_detected",
    "raw_provider_thread_run_session_id_detected",
    "contradiction_pair_missing_source_refs",
    "evidence_chain_missing_evidence_refs",
    "coverage_gap_missing_gap_reason",
    "recommended_retrieval_expansion_missing_reason",
  ]);
}

function assertInvalidOverride(label, requiredCodes) {
  const bundle =
    buildPerspectiveGeometryDigestPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
    });
  let invalidBundle = JSON.parse(JSON.stringify(bundle));
  if (label === "digest preview") {
    Object.assign(invalidBundle.geometry_digest_preview, {
      digest_id: "",
      source_refs: [],
      raw_coordinates_used_as_truth: true,
      raw_coordinate_only_digest: true,
      runtime_write_now: true,
      all_items_public_safe: false,
      contradiction_pairs: [],
      coverage_gaps: [],
      recommended_retrieval_expansion: [],
      retrieval_execution_now: true,
    });
  } else if (label === "cluster digest") {
    invalidBundle.geometry_digest_preview.dominant_clusters = [
      {
        cluster_ref: "",
        cluster_kind: "dominant_cluster",
        source_refs: [],
        interpretation_only: false,
        not_truth: false,
        runtime_write_now: true,
      },
    ];
    invalidBundle.geometry_digest_preview.underrepresented_clusters = [
      {
        cluster_ref: "cluster_ref:public:bad_underrepresented",
        cluster_kind: "underrepresented_cluster",
        source_refs: ["source_ref:public:bad_underrepresented"],
        interpretation_only: true,
        not_truth: true,
        runtime_write_now: false,
      },
    ];
    invalidBundle.geometry_digest_preview.stale_influential_clusters = [
      {
        cluster_ref: "cluster_ref:public:bad_stale",
        cluster_kind: "stale_influential_cluster",
        source_refs: ["source_ref:public:bad_stale"],
        interpretation_only: true,
        not_truth: true,
        runtime_write_now: false,
      },
    ];
  } else if (label === "node digest") {
    invalidBundle.geometry_digest_preview.node_digests = [
      {
        node_ref: "",
        node_digest_kind: "bridge_node_digest",
        source_refs: [],
        navigation_hint_only: false,
        runtime_write_now: false,
      },
      {
        node_ref: "node_ref:public:bad_stale",
        node_digest_kind: "stale_high_gravity_node_digest",
        source_refs: ["source_ref:public:bad_stale"],
        not_authority: false,
        runtime_write_now: false,
      },
      {
        tension_ref: "tension_ref:public:bad_tension",
        node_digest_kind: "tension_node_digest",
        source_refs: ["source_ref:public:bad_tension"],
        resolution_not_implied: false,
        runtime_write_now: false,
      },
      {
        knowledge_gap_ref: "knowledge_gap_ref:public:bad_gap",
        node_digest_kind: "knowledge_gap_node_digest",
        source_refs: ["source_ref:public:bad_gap"],
        closure_not_implied: false,
        runtime_write_now: false,
      },
      {
        node_ref: "node_ref:public:bad_candidate",
        node_digest_kind: "candidate_overlay_node_digest",
        source_refs: ["source_ref:public:bad_candidate"],
        candidate_only: false,
        durable_graph_ref_forbidden: false,
        runtime_write_now: false,
      },
      {
        node_digest_kind: "source_reference_node_digest",
        source_ref: "source_ref:public:bad_source",
        raw_source_body_forbidden: false,
        runtime_write_now: true,
      },
    ];
  } else if (label === "relationship digest") {
    invalidBundle.geometry_digest_preview.relationship_digests = [
      {
        relationship_ref: "relationship_ref:public:missing_kind",
        runtime_write_now: false,
      },
      {
        relationship_ref: "relationship_ref:public:unknown_kind",
        relationship_kind: "unknown_family_kind",
        runtime_write_now: false,
      },
      {
        relationship_ref: "relationship_ref:public:bad_contradiction",
        relationship_kind: "contradiction_pair",
        source_refs: [],
        not_resolution: false,
        runtime_write_now: false,
      },
      {
        relationship_ref: "relationship_ref:public:bad_evidence",
        relationship_kind: "evidence_chain",
        evidence_refs: [],
        claim_refs: [],
        proof_write_now: true,
        runtime_write_now: false,
      },
      {
        relationship_ref: "relationship_ref:public:bad_gap",
        relationship_kind: "coverage_gap",
        not_inferred_fact: false,
        runtime_write_now: false,
      },
      {
        relationship_ref: "relationship_ref:public:bad_retrieval",
        relationship_kind: "retrieval_expansion_hint",
        advisory_only: false,
        retrieval_execution_now: true,
        runtime_write_now: true,
      },
    ];
  } else if (label === "diagnostic") {
    invalidBundle.geometry_digest_preview.diagnostics = {
      unknown: { diagnostic_kind: "unknown_family_kind", advisory_only: true },
      cluster_balance: {
        diagnostic_kind: "cluster_balance",
        advisory_only: false,
        not_truth: false,
        not_promotion_authority: false,
      },
      manual_gravity_distribution: {
        diagnostic_kind: "manual_gravity_distribution",
        advisory_only: true,
        manual_gravity_not_authority: false,
      },
      coverage_gap_count: {
        diagnostic_kind: "coverage_gap_count",
        advisory_only: true,
        gap_not_fact: false,
      },
      contradiction_pair_count: {
        diagnostic_kind: "contradiction_pair_count",
        advisory_only: true,
        contradiction_not_resolution: false,
      },
    };
  } else if (label === "authority boundary") {
    Object.assign(invalidBundle.authority_boundary, {
      geometry_digest_runtime_build_implemented_now: true,
      geometry_digest_write_now: true,
      geometry_calculation_runtime_now: true,
      raw_coordinate_authority: true,
      raw_coordinate_only_digest_now: true,
      runtime_layout_execution_now: true,
      graph_db_implemented_now: true,
      graph_mutation_now: true,
      component_changed_now: true,
      route_changed_now: true,
      browser_request_now: true,
      browser_persistence_now: true,
      request_animation_frame_now: true,
      durable_perspective_state_read_now: true,
      durable_perspective_state_write_now: true,
      durable_perspective_delta_apply_now: true,
      ai_context_packet_implemented_now: true,
      codex_handoff_implemented_now: true,
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
      geometry_digest_authority: true,
      diagnostic_authority: true,
      recommendation_authority: true,
      product_write_authority: true,
      product_id_allocation_authority: true,
    });
  } else if (label === "refs") {
    Object.assign(invalidBundle.geometry_digest_preview, {
      digest_id: "",
      source_refs: [],
      raw_private_source_body: "private body",
      provider_thread_run_session_id: "thread_123_run_456",
      private_url: "https://private.example.invalid/source",
      contradiction_pairs: [
        {
          relationship_ref: "relationship_ref:public:bad_contradiction_ref",
          relationship_kind: "contradiction_pair",
          node_refs: ["node_ref:public:a", "node_ref:public:b"],
          source_refs: [],
          not_resolution: true,
          runtime_write_now: false,
        },
      ],
      evidence_chains: [
        {
          relationship_ref: "relationship_ref:public:bad_evidence_ref",
          relationship_kind: "evidence_chain",
          evidence_refs: [],
          claim_refs: ["claim_ref:public:claim"],
          source_refs: ["source_ref:public:evidence_chain"],
          refs_only_not_proof: true,
          proof_write_now: false,
          runtime_write_now: false,
        },
      ],
      coverage_gaps: [
        {
          relationship_ref: "relationship_ref:public:bad_gap_ref",
          relationship_kind: "coverage_gap",
          knowledge_gap_ref: "knowledge_gap_ref:public:gap",
          source_refs_or_gap_reason_required: true,
          not_inferred_fact: true,
          runtime_write_now: false,
        },
      ],
      recommended_retrieval_expansion: [
        {
          relationship_ref: "relationship_ref:public:bad_expansion_ref",
          relationship_kind: "retrieval_expansion_hint",
          source_refs_or_gap_reason_required: true,
          advisory_only: true,
          retrieval_execution_now: false,
          runtime_write_now: false,
        },
      ],
    });
  }
  const { validation: _validation, ...bundleWithoutValidation } = invalidBundle;
  const validation = validatePerspectiveGeometryDigestPreviewBundle(
    bundleWithoutValidation,
    contractFixture,
  );
  assert.equal(validation.passed, false, `${label} invalid override must fail`);
  for (const code of requiredCodes) {
    assert.ok(
      validation.failure_codes.includes(code),
      `${label} invalid override must include ${code}; saw ${validation.failure_codes.join(", ")}`,
    );
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Perspective Geometry Digest implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    "deterministic fixture-backed implementation only",
    "validates and materializes #739 Perspective Geometry Digest preview bundle",
    "PerspectiveGeometryDigest is interpretation, not truth",
    "raw coordinates are not enough",
    "raw coordinates are display hints only and not source of truth",
    "digest is derived view, not independent source of truth",
    "diagnostics are advisory-only",
    "cluster balance is not truth",
    "source dominance warning is not promotion authority",
    "manual gravity distribution is not authority",
    "coverage gaps are not inferred facts",
    "recommended retrieval expansion is advisory and does not execute retrieval",
    "no runtime geometry digest build",
    "no geometry digest write",
    "no geometry calculation runtime",
    "no raw-coordinate-only digest",
    "no AI Context Packet implementation",
    "no Codex handoff implementation",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `${indexPath} must include ${requiredText}`);
  }
  for (const requiredText of [
    "Perspective Geometry Digest implementation is deterministic fixture-backed only.",
    "It materializes preview bundles from the #739 contract.",
    "Agent Substrate remains advisory-only and cannot build the digest as runtime",
    "Recommended retrieval expansion is advisory recall context, not retrieval execution.",
    "Next recommended slice is Perspective Geometry Digest browser validation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `${substrateDocPath} must include ${requiredText}`);
  }
  for (const doc of [surfaceDoc, gateDoc]) {
    for (const requiredText of [
      "Perspective Geometry Digest implementation remains separated from candidate preview, layout runtime, durable Perspective state, promotion runtime, and AI context execution.",
      "Raw coordinates are display hints, not truth.",
      "Digest clusters, diagnostics, and recommendations are advisory-only.",
      "Candidate overlay remains distinct from durable graph.",
      "Evidence chains and evidence rays are refs, not proof/evidence records.",
      "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest behavior.",
    ]) {
      assert.ok(doc.includes(requiredText), `research candidate docs must include ${requiredText}`);
    }
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
    "deterministic fixture-backed builder/helper for the #739 contract",
    "materializes public-safe Perspective Geometry Digest preview bundles only",
    "invalid_digest_preview_override_rejected",
    "invalid_authority_boundary_override_rejected",
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      "#739 contract smoke must allow Perspective Geometry Digest implementation downstream pointer",
    );
  }
}

function assertPortableMergeBaseFallback() {
  assert.ok(smokeSource.includes("origin/main"));
  assert.ok(smokeSource.includes("main"));
  assert.ok(smokeSource.includes("HEAD^"));
  assert.ok(smokeSource.includes("Unable to determine merge base"));
}

function readFile(path) {
  return readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(readFile(path));
}

function readJsonFromGit(path) {
  return JSON.parse(readGitOutput(["show", `${mergeBaseRef()}:${path}`]));
}

function readGitOutput(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

function perspectivePacketReceiptLinkageContractSliceActive() {
  return readChangedFiles().includes(perspectivePacketReceiptLinkageSmokePath);
}

function assertPerspectivePacketReceiptLinkageContractPackageScript() {
  assert.equal(
    packageJson.scripts[perspectivePacketReceiptLinkagePackageScriptName],
    perspectivePacketReceiptLinkagePackageScriptValue,
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
    [perspectivePacketReceiptLinkagePackageScriptName],
    "package.json must add only the Perspective Packet Receipt Linkage contract smoke script",
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

function assertPerspectivePacketReceiptLinkageContractChangedFiles(changedFiles) {
  const expectedFiles = Array.from(new Set([
    perspectivePacketReceiptLinkageTypePath,
    perspectivePacketReceiptLinkageFixturePath,
    perspectivePacketReceiptLinkageSmokePath,
    perspectivePacketReceiptLinkageSourceValidationSmokePath,
    ...perspectivePacketReceiptLinkageDownstreamSmokePaths,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]));
  for (const unchangedPath of [
    "types/codex-handoff-draft-contract.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    "lib/research-candidate-review/codex-handoff-draft.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Packet Receipt Linkage contract slice must not change ` + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ` + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Perspective Packet Receipt Linkage contract slice: ` + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertPerspectivePacketReceiptLinkageContractDownstreamPointer();
}

function assertPerspectivePacketReceiptLinkageContractDownstreamPointer() {
  const linkageSmoke = readFileSync(perspectivePacketReceiptLinkageSmokePath, "utf8");
  for (const requiredText of [
    perspectivePacketReceiptLinkageVersion,
    perspectivePacketReceiptLinkageFixturePath,
    perspectivePacketReceiptLinkageSmokePath,
    perspectivePacketReceiptLinkagePackageScriptName,
    perspectivePacketReceiptLinkageRecommendationStatus,
    perspectivePacketReceiptLinkageNextRecommendedSlice,
  ]) {
    assert.ok(
      linkageSmoke.includes(requiredText),
      perspectivePacketReceiptLinkageSmokePath + " must include " + requiredText,
    );
  }
}

function readChangedFiles() {
  const refs = [mergeBaseRef(), "HEAD"];
  const committed = execFileSync("git", ["diff", "--name-only", ...refs], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const working = execFileSync("git", ["diff", "--name-only"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  return [...new Set([...committed, ...working, ...staged, ...untracked])].sort();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) {
    return cachedMergeBaseRef;
  }
  for (const candidate of ["origin/main", "main", "HEAD^"]) {
    try {
      execFileSync("git", ["rev-parse", "--verify", candidate], {
        stdio: "ignore",
      });
      cachedMergeBaseRef = candidate;
      return candidate;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error(
    "Unable to determine merge base for Perspective Geometry Digest implementation smoke",
  );
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function stripValidationText(source) {
  return source
    .replace(/assert\.[a-zA-Z]+[\s\S]*?\);/g, "")
    .replace(/console\.log[\s\S]*?\);/g, "");
}
