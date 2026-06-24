import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath = "lib/research-candidate-review/codex-handoff-draft.ts";
const contractTypePath = "types/codex-handoff-draft-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json";
const smokePath = "scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs";
const contractSmokePath = "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName = "smoke:codex-handoff-draft-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs";
const implementationKind = "codex_handoff_draft_implementation";
const implementationVersion = "codex_handoff_draft_implementation.v0.1";
const previewVersion = "codex_handoff_draft_preview.v0.1";
const recommendationStatus =
  "ready_for_codex_handoff_draft_browser_validation_v0_1";
const nextRecommendedSlice =
  "codex_handoff_draft_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:codex-handoff-draft-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "codex_handoff_draft_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "perspective_packet_receipt_linkage_contract_v0_1";
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
const perspectivePacketReceiptLinkageImplementationBuilderPath =
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts";
const perspectivePacketReceiptLinkageImplementationFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json";
const perspectivePacketReceiptLinkageImplementationSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs";
const perspectivePacketReceiptLinkageImplementationPackageScriptName =
  "smoke:perspective-packet-receipt-linkage-implementation-v0-1";
const perspectivePacketReceiptLinkageImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs";
const perspectivePacketReceiptLinkageImplementationVersion =
  "perspective_packet_receipt_linkage_implementation.v0.1";
const perspectivePacketReceiptLinkageImplementationRecommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_browser_validation_v0_1";
const perspectivePacketReceiptLinkageImplementationNextRecommendedSlice =
  "perspective_packet_receipt_linkage_browser_validation_v0_1";
const perspectivePacketReceiptLinkageBrowserValidationFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-browser-validation.sample.v0.1.json";
const perspectivePacketReceiptLinkageBrowserValidationSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs";
const perspectivePacketReceiptLinkageBrowserValidationPackageScriptName =
  "smoke:perspective-packet-receipt-linkage-browser-validation-v0-1";
const perspectivePacketReceiptLinkageBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs";
const perspectivePacketReceiptLinkageBrowserValidationVersion =
  "perspective_packet_receipt_linkage_browser_validation.v0.1";
const perspectivePacketReceiptLinkageBrowserValidationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_contract_v0_1";
const perspectivePacketReceiptLinkageBrowserValidationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_contract_v0_1";
const agentPerspectiveSubstrateFeedbackLoopContractTypePath =
  "types/agent-perspective-substrate-feedback-loop-contract.ts";
const agentPerspectiveSubstrateFeedbackLoopContractFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopContractSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopContractPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-contract-v0-1";
const agentPerspectiveSubstrateFeedbackLoopContractPackageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopContractVersion =
  "agent_perspective_substrate_feedback_loop_contract.v0.1";
const agentPerspectiveSubstrateFeedbackLoopContractRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_implementation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopContractNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_implementation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath =
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts";
const agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-implementation-v0-1";
const agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopImplementationVersion =
  "agent_perspective_substrate_feedback_loop_implementation.v0.1";
const agentPerspectiveSubstrateFeedbackLoopImplementationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopImplementationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-browser-validation-v0-1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationVersion =
  "agent_perspective_substrate_feedback_loop_browser_validation.v0.1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_closeout_v0_1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_closeout_v0_1";
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

const writeFixture = process.argv.includes("--write-fixture");

const downstreamSmokePaths = [
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
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
  "fixtures/research-candidate-review.ai-context-packet-browser-validation.sample.v0.1.json",
  "types/ai-context-packet-contract.ts",
  "fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json",
  "lib/research-candidate-review/ai-context-packet.ts",
  "fixtures/research-candidate-review.ai-context-packet-implementation.sample.v0.1.json",
  "types/perspective-geometry-digest-contract.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json",
  "lib/research-candidate-review/perspective-geometry-digest.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.perspective-geometry-digest-browser-validation.sample.v0.1.json",
  "lib/research-candidate-review/project-constellation-runtime-layout.ts",
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json",
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
  buildCodexHandoffDraftImplementationFixture,
  buildCodexHandoffDraftPreviewBundle,
  validateCodexHandoffDraftPreviewBundle,
  createCodexHandoffDraftFingerprint,
} = await import("../lib/research-candidate-review/codex-handoff-draft.ts");

const sourceContractRef =
  `${contractFixture.contract_version}:${contractFixturePath}`;
const rebuiltImplementationFixture =
  buildCodexHandoffDraftImplementationFixture({
    codex_handoff_draft_contract: contractFixture,
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
assert.deepEqual(fixture, rebuiltImplementationFixture);
assertImplementationFixture(fixture);
assertBuiltDraftPreviewBundle(fixture.built_codex_handoff_draft_preview_bundle);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidation(fixture.validated_implementation);
assertInvalidDraftPreviewOverrideCoverage();
assertInvalidDraftSectionOverrideCoverage();
assertInvalidForbiddenActionsOverrideCoverage();
assertInvalidAuthorityBoundaryOverrideCoverage();
assertInvalidRefsOverrideCoverage();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "codex-handoff-draft-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      draft_principles_preserved:
        fixture.validated_implementation.draft_principles_preserved,
      draft_section_families_preserved:
        fixture.validated_implementation.draft_section_families_preserved,
      forbidden_actions_policy_preserved:
        fixture.validated_implementation.forbidden_actions_policy_preserved,
      codex_handoff_draft_runtime_build_implemented_now:
        fixture.authority_boundary
          .codex_handoff_draft_runtime_build_implemented_now,
      codex_execution_now: fixture.authority_boundary.codex_execution_now,
      github_automation_now: fixture.authority_boundary.github_automation_now,
      github_pr_creation_now:
        fixture.authority_boundary.github_pr_creation_now,
      git_branch_creation_now:
        fixture.authority_boundary.git_branch_creation_now,
      git_commit_creation_now:
        fixture.authority_boundary.git_commit_creation_now,
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
    contractFixture,
    readJsonFromGit(contractFixturePath),
    "#745 Codex Handoff Draft contract fixture must not change",
  );
  assert.equal(
    contractTypeSource,
    readTextFromGit(contractTypePath),
    "#745 Codex Handoff Draft type contract must not change",
  );
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildCodexHandoffDraftImplementationFixture",
    "buildCodexHandoffDraftPreviewBundle",
    "validateCodexHandoffDraftPreviewBundle",
    "createCodexHandoffDraftFingerprint",
    "deterministic_fixture_backed_only",
    "codex_handoff_draft_runtime_build_now: false",
    "codex_handoff_draft_write_now: false",
    "codex_execution_now: false",
    "github_automation_now: false",
    "github_pr_creation_now: false",
    "git_branch_creation_now: false",
    "git_commit_creation_now: false",
    "external_handoff_sending_now: false",
    "agent_execution_now: false",
    "provider_openai_call_now: false",
    "retrieval_rag_execution_now: false",
    "durable_memory_write_now: false",
    "product_write_lane_parked_by_686",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
  for (const exportedHelper of [
    "buildCodexHandoffDraftImplementationFixture",
    "buildCodexHandoffDraftPreviewBundle",
    "validateCodexHandoffDraftPreviewBundle",
    "createCodexHandoffDraftFingerprint",
  ]) {
    assert.match(builderSource, new RegExp(`export function ${exportedHelper}\\b`));
  }
  assert.doesNotMatch(builderSource, /from\s+["'][^"']*openai[^"']*["']/i);
  assert.doesNotMatch(builderSource, /from\s+["'][^"']*(?:octokit|github)[^"']*["']/i);
}

function assertPackageScript() {
  if (agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScript();
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopImplementationPackageScript();
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopContractSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopContractPackageScript();
    return;
  }
  if (perspectivePacketReceiptLinkageBrowserValidationSliceActive()) {
    assertPerspectivePacketReceiptLinkageBrowserValidationPackageScript();
    return;
  }
  if (perspectivePacketReceiptLinkageImplementationSliceActive()) {
    assertPerspectivePacketReceiptLinkageImplementationPackageScript();
    return;
  }
  if (perspectivePacketReceiptLinkageContractSliceActive()) {
    assertPerspectivePacketReceiptLinkageContractPackageScript();
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
    "package.json must add only the Codex Handoff Draft implementation smoke script",
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
  if (agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopImplementationChangedFiles(changedFiles);
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopContractSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopContractChangedFiles(changedFiles);
    return;
  }
  if (perspectivePacketReceiptLinkageBrowserValidationSliceActive()) {
    assertPerspectivePacketReceiptLinkageBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (perspectivePacketReceiptLinkageImplementationSliceActive()) {
    assertPerspectivePacketReceiptLinkageImplementationChangedFiles(changedFiles);
    return;
  }
  if (perspectivePacketReceiptLinkageContractSliceActive()) {
    assertPerspectivePacketReceiptLinkageContractChangedFiles(changedFiles);
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== builderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add runtime Codex handoff files outside deterministic builder");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*github/i, "must not add GitHub automation files");
    assert.doesNotMatch(changedFile, /^lib\/.*agent/i, "must not add agent routing or execution files");
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add runtime AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout files");
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
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") || filePath.endsWith(".mjs")) &&
      filePath !== smokePath &&
      filePath !== perspectivePacketReceiptLinkageTypePath &&
      filePath !== perspectivePacketReceiptLinkageSmokePath &&
      filePath !== perspectivePacketReceiptLinkageImplementationSmokePath &&
    filePath !== perspectivePacketReceiptLinkageBrowserValidationSmokePath &&
      filePath !== "types/agent-perspective-substrate-feedback-loop-contract.ts" &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopContractSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath &&
      filePath !== browserValidationSmokePath &&
      filePath !== contractSmokePath &&
      !downstreamSmokePaths.includes(filePath),
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
    assert.doesNotMatch(stripped, /\bdb\.\w+\s*\(|\bprisma\b|\bsql`|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bUPSERT\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(stripped, /\bcreateEmbedding\b|\bupsertVector\b|\bwriteIndex\b|\bbuildIndex\b|\bfts5?\b/i, `${filePath} must not implement index/embedding/vector/FTS behavior`);
    assert.doesNotMatch(stripped, /\bwriteProduct\b|\ballocateProductId\b|\bcreateProduct\b/i, `${filePath} must not implement product write`);
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
    "package.json must add only the Codex Handoff Draft browser validation smoke script",
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
    contractSmokePath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    builderPath,
    contractTypePath,
    contractFixturePath,
    implementationFixturePath,
    ...protectedUnchangedPaths,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertBrowserValidationDownstreamPointer();
}

function assertBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFile(browserValidationSmokePath);
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      `${browserValidationSmokePath} must include ${requiredText}`,
    );
  }
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
  for (const flag of [
    "contract_authority_boundary_preserved",
    "contract_validation_policy_preserved",
    "contract_draft_principles_preserved",
    "contract_draft_section_families_preserved",
    "contract_forbidden_actions_policy_preserved",
  ]) {
    assert.equal(value.implemented_contract[flag], true);
  }
  assert.equal(value.deterministic_builder.builder_path, builderPath);
  assert.equal(value.deterministic_builder.deterministic_fixture_backed_only, true);
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  const withoutFingerprint = { ...value };
  delete withoutFingerprint.implementation_fingerprint;
  assert.equal(
    value.implementation_fingerprint,
    createCodexHandoffDraftFingerprint(withoutFingerprint),
  );
}

function assertBuiltDraftPreviewBundle(bundle) {
  const sample = contractFixture.sample_codex_handoff_draft_preview;
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.equal(bundle.operator_context_ref, sample.operator_context_ref);
  assert.deepEqual(bundle.handoff_input_preview, sample.handoff_input_preview);
  assert.deepEqual(bundle.draft_preview, sample.draft_preview);
  assert.deepEqual(bundle.authority_boundary, contractFixture.authority_boundary);
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(bundle.forbidden_actions_policy, contractFixture.forbidden_actions_policy);
  assert.equal(bundle.authority_boundary.implementation_added_now, false);
  assert.ok(!Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"));
  assert.equal(bundle.validation.passed, true);
  assert.deepEqual(bundle.validation.failure_codes, []);
  assert.deepEqual(
    bundle.draft_section_family_summary.section_kinds,
    contractFixture.draft_section_families.map((family) => family.section_kind),
  );
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
    if (key === "failure_codes") continue;
    assert.equal(value, true, `${key} validation flag must be true`);
  }
}

function assertInvalidDraftPreviewOverrideCoverage() {
  assertFailureCodes(
    buildWithDraftOverride({
      draft_id: "",
      source_refs: [],
      all_runtime_write_now_false: false,
      all_sections_public_safe: false,
      authority_boundary: undefined,
      forbidden_actions: [],
      stop_conditions: [],
      branch_name_git_authority: true,
      pr_title_body_github_authority: true,
      expected_files: [{ file_path: "types/example.ts", not_file_write_authority: false }],
      expected_checks: [{ check_ref: "npm run typecheck", not_execution_authority: false }],
      final_report_template: { not_completion_proof: false },
      codex_execution_now: true,
      github_automation_now: true,
    }).validation,
    [
      "draft_preview_missing_draft_id",
      "draft_preview_missing_source_refs",
      "draft_preview_runtime_write_enabled",
      "draft_preview_not_public_safe",
      "draft_preview_missing_authority_boundary",
      "draft_preview_missing_forbidden_actions",
      "draft_preview_missing_stop_conditions",
      "draft_preview_branch_name_git_authority_enabled",
      "draft_preview_pr_title_github_authority_enabled",
      "draft_preview_expected_files_write_authority_enabled",
      "draft_preview_expected_checks_execution_authority_enabled",
      "draft_preview_final_report_completion_authority_enabled",
      "draft_preview_codex_execution_enabled",
      "draft_preview_github_automation_enabled",
    ],
  );
}

function assertInvalidDraftSectionOverrideCoverage() {
  const families = clone(contractFixture.draft_section_families);
  families[0] = { ...families[0] };
  delete families[0].section_kind;
  families.push({ section_kind: "unknown_section", runtime_write_now: true });
  for (const family of families) {
    if (family.section_kind === "branch_name_hint") family.branch_creation_authority = true;
    if (family.section_kind === "pr_title_hint") family.github_pr_creation_authority = true;
    if (family.section_kind === "implementation_instructions") family.execution_requires_operator_action_later = false;
    if (family.section_kind === "expected_files") family.not_file_write_authority = false;
    if (family.section_kind === "expected_checks") family.not_execution_authority = false;
    if (family.section_kind === "authority_boundary") family.execution_authority_false = false;
    if (family.section_kind === "final_report_template") family.final_report_not_completion_proof = false;
    if (family.section_kind === "source_refs") family.source_refs_public_safe = false;
  }
  assertFailureCodes(
    buildCodexHandoffDraftPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      draft_section_families: families,
      draft_preview: {
        ...clone(contractFixture.sample_codex_handoff_draft_preview.draft_preview),
        implementation_instructions: {
          execution_requires_operator_action_later: false,
        },
        expected_files: [{ file_path: "types/example.ts", not_file_write_authority: false }],
        expected_checks: [{ check_ref: "npm run typecheck", not_execution_authority: false }],
        authority_boundary: { execution_authority: true },
        final_report_template: { not_completion_proof: false },
      },
    }).validation,
    [
      "draft_section_missing_section_kind",
      "draft_section_unknown_section_kind",
      "draft_section_runtime_write_enabled",
      "branch_name_hint_git_authority_enabled",
      "pr_title_hint_github_authority_enabled",
      "implementation_instructions_execution_without_operator",
      "expected_files_write_authority_enabled",
      "expected_checks_execution_authority_enabled",
      "authority_boundary_section_execution_enabled",
      "final_report_template_completion_proof_enabled",
      "source_refs_section_missing_public_safe_refs",
    ],
  );
}

function assertInvalidForbiddenActionsOverrideCoverage() {
  const draft = clone(contractFixture.sample_codex_handoff_draft_preview.draft_preview);
  draft.forbidden_actions = [];
  const policy = clone(contractFixture.forbidden_actions_policy);
  for (const key of Object.keys(policy)) policy[key] = false;
  assertFailureCodes(
    buildCodexHandoffDraftPreviewBundle({
      contract: contractFixture,
      source_contract_ref: sourceContractRef,
      forbidden_actions_policy: policy,
      draft_preview: draft,
    }).validation,
    [
      "forbidden_action_missing_no_codex_execution",
      "forbidden_action_missing_no_github_automation",
      "forbidden_action_missing_no_github_pr_creation",
      "forbidden_action_missing_no_git_branch_creation",
      "forbidden_action_missing_no_git_commit_creation",
      "forbidden_action_missing_no_provider_openai_call",
      "forbidden_action_missing_no_retrieval_rag_execution",
      "forbidden_action_missing_no_db_write_or_query",
      "forbidden_action_missing_no_perspective_promotion",
      "forbidden_action_missing_no_product_write",
    ],
  );
}

function assertInvalidAuthorityBoundaryOverrideCoverage() {
  const override = {
    codex_handoff_draft_runtime_build_implemented_now: true,
    codex_handoff_draft_write_now: true,
    codex_handoff_implemented_now: true,
    codex_execution_now: true,
    github_automation_now: true,
    github_pr_creation_now: true,
    git_branch_creation_now: true,
    git_commit_creation_now: true,
    external_handoff_sending_now: true,
    agent_routing_now: true,
    agent_execution_now: true,
    ai_context_packet_runtime_build_implemented_now: true,
    provider_openai_call_now: true,
    retrieval_rag_execution_now: true,
    runtime_geometry_digest_build_implemented_now: true,
    graph_mutation_now: true,
    durable_perspective_state_read_now: true,
    durable_perspective_state_write_now: true,
    durable_perspective_delta_apply_now: true,
    proof_or_evidence_record_write_now: true,
    accepted_evidence_write_now: true,
    formation_receipt_write_now: true,
    work_mutation_now: true,
    runtime_db_query_now: true,
    runtime_db_write_now: true,
    durable_memory_write_now: true,
    codex_execution_authority: true,
    github_automation_authority: true,
    github_pr_creation_authority: true,
    git_branch_creation_authority: true,
    git_commit_authority: true,
    branch_name_git_authority: true,
    pr_title_body_github_authority: true,
    product_write_authority: true,
    product_id_allocation_authority: true,
  };
  assertFailureCodes(
    buildCodexHandoffDraftImplementationFixture({
      codex_handoff_draft_contract: contractFixture,
      source_contract_ref: sourceContractRef,
      authority_boundary_overrides: override,
    }).validated_implementation,
    [
      "codex_handoff_draft_runtime_build_enabled",
      "codex_handoff_draft_write_enabled",
      "codex_handoff_enabled",
      "codex_execution_enabled",
      "github_automation_enabled",
      "github_pr_creation_enabled",
      "git_branch_creation_enabled",
      "git_commit_creation_enabled",
      "external_handoff_sending_enabled",
      "agent_routing_enabled",
      "agent_execution_enabled",
      "ai_context_packet_runtime_build_enabled",
      "provider_openai_call_enabled",
      "retrieval_rag_execution_enabled",
      "runtime_geometry_digest_build_enabled",
      "graph_mutation_enabled",
      "durable_perspective_state_read_enabled",
      "durable_perspective_state_write_enabled",
      "durable_perspective_delta_apply_enabled",
      "proof_or_evidence_record_write_enabled",
      "accepted_evidence_write_enabled",
      "formation_receipt_write_enabled",
      "work_mutation_enabled",
      "runtime_db_query_enabled",
      "runtime_db_write_enabled",
      "durable_memory_write_enabled",
      "codex_execution_authority_enabled",
      "github_automation_authority_enabled",
      "github_pr_creation_authority_enabled",
      "git_branch_creation_authority_enabled",
      "git_commit_authority_enabled",
      "branch_name_git_authority_enabled",
      "pr_title_body_github_authority_enabled",
      "product_write_enabled",
      "product_id_allocation_enabled",
    ],
  );
}

function assertInvalidRefsOverrideCoverage() {
  assertFailureCodes(
    buildWithDraftOverride({
      draft_id: "",
      target_repository: "",
      canonical_checkout: "",
      source_refs: [],
      expected_files: [
        { file_path: "/Users/hynk/.ssh/id_rsa", not_file_write_authority: true },
      ],
      source_ref: "source_ref:private:not_public",
      raw_source_body: "raw private source body",
      provider_run_ref: "run_private123",
      access_token: "ghp_example",
      ssh_key: "-----BEGIN OPENSSH PRIVATE KEY-----",
    }).validation,
    [
      "draft_id_missing",
      "private_or_unstable_ref_detected",
      "source_refs_missing",
      "target_repository_missing",
      "canonical_checkout_missing",
      "expected_file_path_private_or_unstable",
      "raw_private_source_body_detected",
      "raw_provider_thread_run_session_id_detected",
      "access_token_detected",
      "ssh_key_detected",
    ],
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    "Codex Handoff Draft implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    "deterministic fixture-backed implementation only",
    "validates and materializes #745 Codex Handoff Draft preview bundle",
    "Codex Handoff Draft is draft, not execution approval",
    "draft is operator-reviewed context, not automation authority",
    "draft is not Codex execution",
    "draft is not GitHub automation",
    "draft is not branch creation authority",
    "draft is not commit authority",
    "draft is not PR creation authority",
    "draft is not external handoff sending authority",
    "draft is not source of truth",
    "draft is not proof/evidence",
    "draft is not durable Perspective state",
    "draft is not work status",
    "draft is not product write",
    "source_refs required",
    "authority_boundary required",
    "forbidden_actions required",
    "stop_conditions required",
    "expected_files are hints only, not write authority",
    "expected_checks are validation hints only, not execution authority",
    "branch_name is a suggestion only, not git authority",
    "PR title/body are suggestions only, not GitHub authority",
    "final_report_template is not completion proof",
    "AI Context Packet remains context, not execution authority",
    "Perspective Geometry Digest remains interpretation, not truth",
    "unresolved tensions and knowledge gaps preserved",
    "candidate/durable distinction preserved",
    "no runtime handoff draft build",
    "no Codex handoff draft write",
    "no Codex execution",
    "no GitHub automation",
    "no GitHub PR creation",
    "no git branch/commit creation",
    "no external handoff sending",
    "no agent routing/execution",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no DB write/query",
    "no durable memory write",
    "no perspective promotion",
    "no proof/evidence write",
    "no accepted evidence write",
    "no Formation Receipt write",
    "no work mutation",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `${indexPath} must include ${requiredText}`);
  }
  for (const requiredText of [
    "Codex Handoff Draft implementation is deterministic fixture-backed only.",
    "It materializes preview bundles from the #745 contract.",
    "Agent Substrate remains advisory-only",
    "Codex Handoff Draft is draft, not execution approval.",
    "Branch name, expected files, expected checks, PR title/body, and final report template are hints only and not authority.",
    "AI Context Packet remains context, not execution authority.",
    "This slice does not implement runtime handoff build, Codex handoff write, Codex execution, GitHub automation, branch/commit/PR creation, external handoff sending, agent routing/execution, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, Formation Receipt writes, work mutation, or product write.",
    "Next recommended slice is Codex Handoff Draft browser validation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `${substrateDocPath} must include ${requiredText}`);
  }
  for (const doc of [surfaceDoc, gateDoc]) {
    for (const requiredText of [
      "Codex Handoff Draft implementation remains separated from candidate preview, AI Context Packet runtime, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.",
      "Draft-selected candidates remain candidates, not proof/evidence or durable state.",
      "Unresolved tensions and knowledge gaps must remain visible.",
      "AI Context Packet remains context, not execution authority.",
      "Codex Handoff Draft cannot execute Codex, create branches, create commits, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.",
      "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff behavior.",
    ]) {
      assert.ok(doc.includes(requiredText), `Research Candidate docs must include ${requiredText}`);
    }
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `${contractSmokePath} must include ${requiredText}`,
    );
  }
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of ["origin/main", "main", "HEAD^", "Unable to resolve merge base"]) {
    assert.ok(smokeSource.includes(requiredText), `${smokePath} must include ${requiredText}`);
  }
}

function buildWithDraftOverride(override) {
  return buildCodexHandoffDraftPreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    draft_preview: {
      ...clone(contractFixture.sample_codex_handoff_draft_preview.draft_preview),
      ...override,
    },
  });
}

function assertFailureCodes(validation, expectedCodes) {
  assert.equal(validation.passed, false);
  for (const code of expectedCodes) {
    assert.ok(
      validation.failure_codes.includes(code),
      `expected failure code ${code}; got ${validation.failure_codes.join(", ")}`,
    );
  }
}

function agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive() {
  return readChangedFiles().includes(agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath);
}

function assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptValue,
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
    [agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop browser validation smoke script",
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

function assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const unchangedPath of [
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    "types/agent-perspective-substrate-feedback-loop-contract.ts",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive",
      );
    assert.ok(
      expectedFiles.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Agent Perspective Substrate Feedback Loop browser validation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    "utf8",
  );
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationVersion,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptValue,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath + " must include " + requiredText,
    );
  }
}

function agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive() {
  return readChangedFiles().includes(agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath);
}

function assertAgentPerspectiveSubstrateFeedbackLoopImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptValue,
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
    [agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop implementation smoke script",
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

function assertAgentPerspectiveSubstrateFeedbackLoopImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopContractSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const unchangedPath of [
    "types/agent-perspective-substrate-feedback-loop-contract.ts",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    perspectivePacketReceiptLinkageBrowserValidationFixturePath,
    perspectivePacketReceiptLinkageImplementationBuilderPath,
    perspectivePacketReceiptLinkageImplementationFixturePath,
    perspectivePacketReceiptLinkageTypePath,
    perspectivePacketReceiptLinkageFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive",
      );
    assert.ok(
      expectedFiles.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Agent Perspective Substrate Feedback Loop implementation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile.startsWith("lib/")) {
      assert.equal(
        changedFile,
        agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
        "implementation slice may only add the deterministic feedback-loop builder under lib",
      );
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopImplementationDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopImplementationDownstreamPointer() {
  const implementationSmoke = readFileSync(
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    "utf8",
  );
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopImplementationVersion,
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptValue,
    agentPerspectiveSubstrateFeedbackLoopImplementationRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      implementationSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath + " must include " + requiredText,
    );
  }
}

function agentPerspectiveSubstrateFeedbackLoopContractSliceActive() {
  const changedFiles = readChangedFiles();
  return (
    changedFiles.includes("types/agent-perspective-substrate-feedback-loop-contract.ts") ||
    changedFiles.includes("fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json") ||
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopContractSmokePath)
  );
}

function assertAgentPerspectiveSubstrateFeedbackLoopContractPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopContractPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopContractPackageScriptValue,
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
    [agentPerspectiveSubstrateFeedbackLoopContractPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop contract smoke script",
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

function assertAgentPerspectiveSubstrateFeedbackLoopContractChangedFiles(changedFiles) {
  const expectedFiles = Array.from(new Set([
    "types/agent-perspective-substrate-feedback-loop-contract.ts",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    agentPerspectiveSubstrateFeedbackLoopContractSmokePath,
    perspectivePacketReceiptLinkageBrowserValidationSmokePath,
    perspectivePacketReceiptLinkageImplementationSmokePath,
    perspectivePacketReceiptLinkageSmokePath,
    smokePath,
    ...perspectivePacketReceiptLinkageDownstreamSmokePaths,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]));
  for (const unchangedPath of [
    perspectivePacketReceiptLinkageBrowserValidationFixturePath,
    perspectivePacketReceiptLinkageImplementationBuilderPath,
    perspectivePacketReceiptLinkageImplementationFixturePath,
    perspectivePacketReceiptLinkageTypePath,
    perspectivePacketReceiptLinkageFixturePath,
    "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
    "types/codex-handoff-draft-contract.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    "lib/research-candidate-review/codex-handoff-draft.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Agent Perspective Substrate Feedback Loop contract slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopContractDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopContractDownstreamPointer() {
  const feedbackLoopContractSmoke = readFileSync(agentPerspectiveSubstrateFeedbackLoopContractSmokePath, "utf8");
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopContractVersion,
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    agentPerspectiveSubstrateFeedbackLoopContractSmokePath,
    agentPerspectiveSubstrateFeedbackLoopContractPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopContractRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopContractNextRecommendedSlice,
  ]) {
    assert.ok(
      feedbackLoopContractSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopContractSmokePath + " must include " + requiredText,
    );
  }
}

function perspectivePacketReceiptLinkageBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return (
    changedFiles.includes(perspectivePacketReceiptLinkageBrowserValidationFixturePath) ||
    changedFiles.includes(perspectivePacketReceiptLinkageBrowserValidationSmokePath)
  );
}

function assertPerspectivePacketReceiptLinkageBrowserValidationPackageScript() {
  assert.equal(
    packageJson.scripts[perspectivePacketReceiptLinkageBrowserValidationPackageScriptName],
    perspectivePacketReceiptLinkageBrowserValidationPackageScriptValue,
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
    [perspectivePacketReceiptLinkageBrowserValidationPackageScriptName],
    "package.json must add only the Perspective Packet Receipt Linkage browser validation smoke script",
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

function assertPerspectivePacketReceiptLinkageBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = Array.from(new Set([
    perspectivePacketReceiptLinkageBrowserValidationFixturePath,
    perspectivePacketReceiptLinkageBrowserValidationSmokePath,
    perspectivePacketReceiptLinkageImplementationSmokePath,
    perspectivePacketReceiptLinkageSmokePath,
    ...perspectivePacketReceiptLinkageDownstreamSmokePaths,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]));
  for (const unchangedPath of [
    perspectivePacketReceiptLinkageTypePath,
    perspectivePacketReceiptLinkageFixturePath,
    perspectivePacketReceiptLinkageImplementationBuilderPath,
    perspectivePacketReceiptLinkageImplementationFixturePath,
    "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
    "types/codex-handoff-draft-contract.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    "lib/research-candidate-review/codex-handoff-draft.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Perspective Packet Receipt Linkage browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Perspective Packet Receipt Linkage browser validation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not change runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertPerspectivePacketReceiptLinkageBrowserValidationDownstreamPointer();
}

function assertPerspectivePacketReceiptLinkageBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(perspectivePacketReceiptLinkageBrowserValidationSmokePath, "utf8");
  for (const requiredText of [
    perspectivePacketReceiptLinkageBrowserValidationVersion,
    perspectivePacketReceiptLinkageBrowserValidationFixturePath,
    perspectivePacketReceiptLinkageBrowserValidationSmokePath,
    perspectivePacketReceiptLinkageBrowserValidationPackageScriptName,
    perspectivePacketReceiptLinkageBrowserValidationRecommendationStatus,
    perspectivePacketReceiptLinkageBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      perspectivePacketReceiptLinkageBrowserValidationSmokePath + " must include " + requiredText,
    );
  }
}

function perspectivePacketReceiptLinkageImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return (
    changedFiles.includes(perspectivePacketReceiptLinkageImplementationBuilderPath) ||
    changedFiles.includes(perspectivePacketReceiptLinkageImplementationFixturePath) ||
    changedFiles.includes(perspectivePacketReceiptLinkageImplementationSmokePath)
  );
}

function assertPerspectivePacketReceiptLinkageImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[perspectivePacketReceiptLinkageImplementationPackageScriptName],
    perspectivePacketReceiptLinkageImplementationPackageScriptValue,
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
    [perspectivePacketReceiptLinkageImplementationPackageScriptName],
    "package.json must add only the Perspective Packet Receipt Linkage implementation smoke script",
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

function assertPerspectivePacketReceiptLinkageImplementationChangedFiles(changedFiles) {
  const expectedFiles = Array.from(new Set([
    perspectivePacketReceiptLinkageImplementationBuilderPath,
    perspectivePacketReceiptLinkageImplementationFixturePath,
    perspectivePacketReceiptLinkageImplementationSmokePath,
    perspectivePacketReceiptLinkageSmokePath,
    ...perspectivePacketReceiptLinkageDownstreamSmokePaths,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]));
  for (const unchangedPath of [
    perspectivePacketReceiptLinkageTypePath,
    perspectivePacketReceiptLinkageFixturePath,
    "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
    "types/codex-handoff-draft-contract.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    "lib/research-candidate-review/codex-handoff-draft.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Perspective Packet Receipt Linkage implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Perspective Packet Receipt Linkage implementation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== perspectivePacketReceiptLinkageImplementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files outside deterministic builder");
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertPerspectivePacketReceiptLinkageImplementationDownstreamPointer();
}

function assertPerspectivePacketReceiptLinkageImplementationDownstreamPointer() {
  const linkageImplementationSmoke = readFileSync(perspectivePacketReceiptLinkageImplementationSmokePath, "utf8");
  for (const requiredText of [
    perspectivePacketReceiptLinkageImplementationVersion,
    perspectivePacketReceiptLinkageImplementationBuilderPath,
    perspectivePacketReceiptLinkageImplementationFixturePath,
    perspectivePacketReceiptLinkageImplementationSmokePath,
    perspectivePacketReceiptLinkageImplementationPackageScriptName,
    perspectivePacketReceiptLinkageImplementationRecommendationStatus,
    perspectivePacketReceiptLinkageImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      linkageImplementationSmoke.includes(requiredText),
      perspectivePacketReceiptLinkageImplementationSmokePath + " must include " + requiredText,
    );
  }
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
  const diffFiles = readGitOutput(["diff", "--name-only", mergeBaseRef(), "--"])
    .split("\n")
    .filter(Boolean);
  const untrackedFiles = readGitOutput(["ls-files", "--others", "--exclude-standard"])
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
