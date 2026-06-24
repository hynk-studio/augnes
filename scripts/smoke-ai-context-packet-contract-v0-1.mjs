import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/ai-context-packet-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json";
const smokePath = "scripts/smoke-ai-context-packet-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName = "smoke:ai-context-packet-contract-v0-1";
const packageScriptValue = "node scripts/smoke-ai-context-packet-contract-v0-1.mjs";
const contractKind = "ai_context_packet_contract";
const contractVersion = "ai_context_packet_contract.v0.1";
const previewVersion = "ai_context_packet_preview.v0.1";
const packetVersion = "ai_context_packet.v0.1";
const recommendationStatus = "ready_for_ai_context_packet_implementation_v0_1";
const nextRecommendedSlice = "ai_context_packet_implementation_v0_1";
const implementationBuilderPath =
  "lib/research-candidate-review/ai-context-packet.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.ai-context-packet-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:ai-context-packet-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ai-context-packet-implementation-v0-1.mjs";
const implementationVersion = "ai_context_packet_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_ai_context_packet_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "ai_context_packet_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.ai-context-packet-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:ai-context-packet-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs";
const browserValidationVersion = "ai_context_packet_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_codex_handoff_draft_contract_v0_1";
const browserValidationNextRecommendedSlice =
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


const aiContextPacketDownstreamSmokePaths = [
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
const implementationDownstreamSmokePaths = [
  smokePath,
  ...aiContextPacketDownstreamSmokePaths,
];

const expectedChangedFiles = [
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  ...aiContextPacketDownstreamSmokePaths,
];

const protectedUnchangedPaths = [
  sourceValidationFixturePath,
  "types/perspective-geometry-digest-contract.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json",
  "lib/research-candidate-review/perspective-geometry-digest.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json",
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
  typePath,
  smokePath,
  sourceValidationFixturePath,
  sourceValidationSmokePath,
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
const sourceValidationFixture = readJson(sourceValidationFixturePath);
const sourceValidationSmoke = readFile(sourceValidationSmokePath);
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
assertSourceValidationUnchanged();
assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertContractScope(fixture.contract_scope);
assertPacketPrinciples(fixture.packet_principles);
assertTargetAgentModes(fixture.target_agent_modes);
assertPacketInputFields(fixture.packet_input_fields);
assertPacketOutputFields(fixture.packet_output_fields);
assertPacketSectionFamilies(fixture.packet_section_families);
assertForbiddenActionsPolicy(fixture.forbidden_actions_policy);
assertSamplePreview(fixture.sample_ai_context_packet_preview);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt AI Context Packet contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "ai-context-packet-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_perspective_geometry_digest_validation_fingerprint:
        fixture.source_perspective_geometry_digest_validation_fingerprint,
      target_agent_mode_count: fixture.target_agent_modes.length,
      packet_section_family_count: fixture.packet_section_families.length,
      ai_context_packet_is_context_not_execution_authority:
        fixture.packet_principles
          .ai_context_packet_is_context_not_execution_authority,
      target_agent_mode_is_scope_not_authority:
        fixture.packet_principles.target_agent_mode_is_scope_not_authority,
      ai_context_packet_runtime_build_implemented_now:
        fixture.authority_boundary
          .ai_context_packet_runtime_build_implemented_now,
      codex_execution_now: fixture.authority_boundary.codex_execution_now,
      github_automation_now: fixture.authority_boundary.github_automation_now,
      agent_execution_now: fixture.authority_boundary.agent_execution_now,
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

function buildContractFixture() {
  const authorityBoundary = buildAuthorityBoundary();
  const validationPolicy = buildValidationPolicy();
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_perspective_geometry_digest_validation_ref:
      `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#741`,
    source_perspective_geometry_digest_validation_fingerprint:
      sourceValidationFixture.validation_fingerprint,
    contract_scope: buildContractScope(),
    packet_principles: buildPacketPrinciples(),
    target_agent_modes: buildTargetAgentModes(),
    packet_input_fields: expectedPacketInputFields(),
    packet_output_fields: expectedPacketOutputFields(),
    packet_section_families: buildPacketSectionFamilies(),
    forbidden_actions_policy: buildForbiddenActionsPolicy(),
    sample_ai_context_packet_preview: buildSamplePreview(
      authorityBoundary,
      validationPolicy,
    ),
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
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
    ai_context_packet_contract_only: true,
    ai_context_packet_runtime_build_now: false,
    ai_context_packet_write_now: false,
    codex_handoff_implementation_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_geometry_digest_build_now: false,
    geometry_digest_write_now: false,
    runtime_layout_execution_now: false,
    graph_mutation_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_now: false,
    proof_evidence_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    schema_migration_now: false,
    route_ui_now: false,
    browser_request_now: false,
    product_write_now: false,
  };
}

function buildPacketPrinciples() {
  return {
    ai_context_packet_is_context_not_execution_authority: true,
    packet_is_folded_derived_advisory_only: true,
    packet_not_source_of_truth: true,
    packet_not_proof_or_evidence: true,
    packet_not_durable_perspective_state: true,
    packet_not_work_status: true,
    packet_not_product_write: true,
    source_refs_required: true,
    unresolved_tensions_preserved: true,
    knowledge_gaps_preserved: true,
    candidate_durable_distinction_preserved: true,
    authority_boundary_required: true,
    forbidden_actions_required: true,
    stop_conditions_required: true,
    final_critical_facts_are_review_cues_not_authority: true,
    target_agent_mode_is_scope_not_authority: true,
    codex_handoff_draft_not_execution_approval: true,
    github_codex_automation_not_authority: true,
    provider_output_not_execution_authority: true,
    retrieval_rag_context_recall_not_authority: true,
    perspective_geometry_digest_interpretation_not_truth: true,
    agent_substrate_advisory_only: true,
  };
}

function buildTargetAgentModes() {
  return [
    {
      mode: "chatgpt_design",
      presentation_scope_only: true,
      execution_authority: false,
      external_call_authority: false,
      state_mutation_authority: false,
    },
    {
      mode: "codex_implementation",
      presentation_scope_only: true,
      execution_authority: false,
      codex_execution_authority_now: false,
      github_automation_authority_now: false,
      state_mutation_authority: false,
    },
    {
      mode: "codex_review",
      presentation_scope_only: true,
      execution_authority: false,
      review_authority_only: true,
      state_mutation_authority: false,
    },
    {
      mode: "mcp_runtime",
      presentation_scope_only: true,
      execution_authority: false,
      tool_widening_now: false,
      external_call_authority: false,
    },
    {
      mode: "cockpit_ui",
      presentation_scope_only: true,
      execution_authority: false,
      ui_rendering_now: false,
      state_mutation_authority: false,
    },
  ];
}

function expectedPacketInputFields() {
  return [
    "packet_scope_ref",
    "mission_brief_ref",
    "current_state_ref",
    "perspective_geometry_digest_ref",
    "selected_research_candidate_refs",
    "selected_perspective_delta_candidate_refs",
    "unresolved_tension_refs",
    "knowledge_gap_refs",
    "source_refs",
    "authority_boundary_ref",
    "forbidden_actions_ref",
    "target_agent_mode",
    "operator_context_ref",
  ];
}

function expectedPacketOutputFields() {
  return [
    "packet_id",
    "packet_version",
    "target_agent_mode",
    "mission_brief",
    "current_state_summary",
    "selected_research_candidates",
    "selected_perspective_delta_candidates",
    "unresolved_tensions",
    "knowledge_gaps",
    "perspective_geometry_digest_summary",
    "source_refs",
    "authority_boundary",
    "forbidden_actions",
    "expected_files",
    "expected_checks",
    "stop_conditions",
    "final_critical_facts",
    "privacy_policy",
    "validation_policy",
  ];
}

function expectedSectionKinds() {
  return [
    "mission_brief",
    "current_state_summary",
    "selected_research_candidates",
    "selected_perspective_delta_candidates",
    "unresolved_tensions",
    "knowledge_gaps",
    "perspective_geometry_digest_summary",
    "authority_boundary",
    "forbidden_actions",
    "expected_files",
    "expected_checks",
    "stop_conditions",
    "final_critical_facts",
  ];
}

function buildPacketSectionFamilies() {
  return [
    {
      section_kind: "mission_brief",
      public_safe_summary_required: true,
      source_refs_required: true,
      not_instruction_to_execute: true,
      runtime_write_now: false,
    },
    {
      section_kind: "current_state_summary",
      derived_summary_only: true,
      not_source_of_truth: true,
      source_refs_required: true,
      runtime_state_read_now: false,
      runtime_write_now: false,
    },
    {
      section_kind: "selected_research_candidates",
      candidate_refs_required: true,
      candidate_only: true,
      not_evidence: true,
      not_proof: true,
      not_durable_state: true,
      source_refs_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "selected_perspective_delta_candidates",
      candidate_refs_required: true,
      delta_candidate_only: true,
      not_durable_perspective_delta: true,
      source_refs_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "unresolved_tensions",
      tension_refs_required: true,
      must_remain_visible: true,
      resolution_not_implied: true,
      source_refs_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "knowledge_gaps",
      knowledge_gap_refs_required: true,
      must_remain_visible: true,
      closure_not_implied: true,
      source_refs_or_gap_reason_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "perspective_geometry_digest_summary",
      digest_ref_required: true,
      interpretation_not_truth: true,
      raw_coordinates_not_source_of_truth: true,
      diagnostics_advisory_only: true,
      runtime_digest_build_now: false,
      runtime_write_now: false,
    },
    {
      section_kind: "authority_boundary",
      authority_boundary_required: true,
      execution_authority_false: true,
      state_mutation_authority_false: true,
      external_call_authority_false: true,
      product_write_authority_false: true,
      runtime_write_now: false,
    },
    {
      section_kind: "forbidden_actions",
      forbidden_actions_required: true,
      must_include_runtime_execution_bans: true,
      must_include_state_mutation_bans: true,
      must_include_provider_retrieval_bans: true,
      must_include_product_write_ban: true,
      runtime_write_now: false,
    },
    {
      section_kind: "expected_files",
      expected_files_are_handoff_hints_only: true,
      not_file_write_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "expected_checks",
      expected_checks_are_validation_hints_only: true,
      not_execution_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "stop_conditions",
      stop_conditions_required: true,
      stop_conditions_are_safety_constraints: true,
      runtime_write_now: false,
    },
    {
      section_kind: "final_critical_facts",
      review_cues_only: true,
      not_truth_source: true,
      source_refs_required: true,
      runtime_write_now: false,
    },
  ];
}

function buildForbiddenActionsPolicy() {
  return {
    no_runtime_execution_from_packet: true,
    no_codex_execution_from_packet: true,
    no_github_automation_from_packet: true,
    no_external_handoff_sending_from_packet: true,
    no_agent_routing_from_packet: true,
    no_agent_execution_from_packet: true,
    no_provider_openai_call_from_packet: true,
    no_retrieval_rag_execution_from_packet: true,
    no_source_fetch_from_packet: true,
    no_crawler_from_packet: true,
    no_db_write_or_query_from_packet: true,
    no_durable_memory_write_from_packet: true,
    no_perspective_promotion_from_packet: true,
    no_durable_perspective_state_write_from_packet: true,
    no_proof_or_evidence_write_from_packet: true,
    no_accepted_evidence_write_from_packet: true,
    no_formation_receipt_write_from_packet: true,
    no_work_mutation_from_packet: true,
    no_product_write_from_packet: true,
  };
}

function buildSamplePreview(authorityBoundary, validationPolicy) {
  const previewAuthorityBoundary = { ...authorityBoundary };
  delete previewAuthorityBoundary.contract_added_now;
  return {
    preview_version: previewVersion,
    operator_context_ref: "operator_context:public:ai_context_packet_contract",
    packet_input_preview: {
      packet_scope_ref: "ai_context_packet_scope_ref:public:example",
      mission_brief_ref: "mission_brief_ref:public:example",
      current_state_ref: "state_summary_ref:public:example",
      perspective_geometry_digest_ref: "geometry_digest_ref:public:contract_preview",
      selected_research_candidate_refs: [
        "candidate_ref:public:selected_claim_candidate",
      ],
      selected_perspective_delta_candidate_refs: [
        "candidate_ref:public:selected_delta_candidate",
      ],
      unresolved_tension_refs: ["tension_ref:public:visible_tension"],
      knowledge_gap_refs: ["knowledge_gap_ref:public:visible_gap"],
      source_refs: [
        "source_ref:public:perspective_geometry_digest_validation",
        "source_ref:public:ai_context_packet_contract",
      ],
      authority_boundary_ref: "authority_boundary_ref:public:ai_context_packet_contract",
      forbidden_actions_ref: "forbidden_actions_ref:public:ai_context_packet_contract",
      target_agent_mode: "codex_implementation",
      operator_context_ref: "operator_context:public:ai_context_packet_contract",
      not_executed_now: true,
    },
    packet_preview: {
      packet_id: "ai_context_packet_ref:public:contract_preview",
      packet_version: packetVersion,
      target_agent_mode: "codex_implementation",
      mission_brief: {
        summary: "Public-safe mission brief preview.",
        source_refs: ["source_ref:public:ai_context_packet_contract"],
        not_instruction_to_execute: true,
      },
      current_state_summary: {
        summary: "Derived current state summary preview.",
        source_refs: [
          "source_ref:public:perspective_geometry_digest_validation",
        ],
        derived_summary_only: true,
        not_source_of_truth: true,
      },
      selected_research_candidates: [
        {
          candidate_ref: "candidate_ref:public:selected_claim_candidate",
          candidate_only: true,
          not_evidence: true,
          not_proof: true,
          not_durable_state: true,
          source_refs: ["source_ref:public:ai_context_packet_contract"],
        },
      ],
      selected_perspective_delta_candidates: [
        {
          candidate_ref: "candidate_ref:public:selected_delta_candidate",
          delta_candidate_only: true,
          not_durable_perspective_delta: true,
          source_refs: ["source_ref:public:ai_context_packet_contract"],
        },
      ],
      unresolved_tensions: [
        {
          tension_ref: "tension_ref:public:visible_tension",
          must_remain_visible: true,
          resolution_not_implied: true,
          source_refs: ["source_ref:public:ai_context_packet_contract"],
        },
      ],
      knowledge_gaps: [
        {
          knowledge_gap_ref: "knowledge_gap_ref:public:visible_gap",
          must_remain_visible: true,
          closure_not_implied: true,
          source_refs_or_gap_reason_required: true,
        },
      ],
      perspective_geometry_digest_summary: {
        digest_ref: "geometry_digest_ref:public:contract_preview",
        interpretation_not_truth: true,
        raw_coordinates_not_source_of_truth: true,
        diagnostics_advisory_only: true,
        runtime_digest_build_now: false,
      },
      source_refs: [
        "source_ref:public:perspective_geometry_digest_validation",
        "source_ref:public:ai_context_packet_contract",
      ],
      authority_boundary: previewAuthorityBoundary,
      forbidden_actions: [
        "no_codex_execution_from_packet",
        "no_github_automation_from_packet",
        "no_provider_openai_call_from_packet",
        "no_retrieval_rag_execution_from_packet",
        "no_perspective_promotion_from_packet",
        "no_product_write_from_packet",
      ],
      expected_files: [
        {
          file_path: "types/example.ts",
          handoff_hint_only: true,
          not_file_write_authority: true,
        },
      ],
      expected_checks: [
        {
          check_ref: "npm run typecheck",
          validation_hint_only: true,
          not_execution_authority: true,
        },
      ],
      stop_conditions: [
        {
          condition_ref: "stop_condition_ref:public:authority_boundary_violation",
          summary: "Stop if runtime authority would be added.",
          safety_constraint: true,
        },
      ],
      final_critical_facts: [
        {
          fact_ref: "critical_fact_ref:public:packet_not_authority",
          summary: "AI Context Packet is not execution authority.",
          review_cue_only: true,
          not_truth_source: true,
          source_refs: ["source_ref:public:ai_context_packet_contract"],
        },
      ],
      all_sections_public_safe: true,
      all_sections_source_ref_backed_or_explicit_gap: true,
      all_runtime_write_now_false: true,
    },
    authority_boundary: previewAuthorityBoundary,
    validation_policy: validationPolicy,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
    browser_validation_added_now: false,
    ai_context_packet_runtime_build_implemented_now: false,
    ai_context_packet_write_now: false,
    codex_handoff_implemented_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_geometry_digest_build_implemented_now: false,
    geometry_digest_write_now: false,
    geometry_calculation_runtime_now: false,
    raw_coordinate_authority: false,
    raw_coordinate_only_digest_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    agent_routing_authority: false,
    agent_execution_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    layout_coordinate_authority: false,
    geometry_digest_authority: false,
    diagnostic_authority: false,
    recommendation_authority: false,
    ai_context_packet_authority: false,
    target_agent_mode_authority: false,
    final_critical_facts_authority: false,
    expected_files_write_authority: false,
    expected_checks_execution_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildValidationPolicy() {
  return {
    ...buildPacketPrinciples(),
    no_runtime_packet_build: true,
    no_ai_context_packet_write: true,
    no_codex_handoff_implementation: true,
    no_codex_execution: true,
    no_github_automation: true,
    no_external_handoff_sending: true,
    no_agent_routing_or_execution: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_source_fetch_or_crawler: true,
    no_runtime_geometry_digest_build: true,
    no_runtime_layout_execution: true,
    no_graph_mutation: true,
    no_runtime_state_read_or_write: true,
    no_durable_perspective_delta_apply: true,
    no_perspective_snapshot_runtime: true,
    no_proof_or_evidence_write: true,
    no_accepted_evidence_write: true,
    no_formation_receipt_write: true,
    no_work_mutation: true,
    no_runtime_db_write_or_query: true,
    no_schema_or_migration: true,
    no_route_or_ui: true,
    no_browser_request: true,
    no_product_write_or_ids: true,
  };
}

function buildPrivacyPolicy() {
  return {
    no_secrets_in_fixture: true,
    no_private_urls: true,
    no_raw_provider_thread_run_session_ids: true,
    no_raw_source_body: true,
    public_safe_packet_refs_only: true,
    public_safe_candidate_refs_only: true,
    public_safe_tension_refs_only: true,
    public_safe_knowledge_gap_refs_only: true,
    public_safe_source_refs_only: true,
    public_safe_digest_refs_only: true,
    public_safe_state_refs_only: true,
    public_safe_stop_condition_refs_only: true,
    public_safe_check_refs_only: true,
    public_safe_file_paths_only: true,
  };
}

function assertRequiredFiles() {
  for (const filePath of [typePath, fixturePath, smokePath]) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
  }
}

function assertSourceValidationUnchanged() {
  assert.deepEqual(
    sourceValidationFixture,
    readJsonFromGit(sourceValidationFixturePath),
    "#741 Perspective Geometry Digest browser validation fixture must not change",
  );
}

function assertTypeContract() {
  for (const requiredText of [
    "AIContextPacketContract",
    "AIContextPacketContractScope",
    "AIContextPacketPrinciples",
    "AIContextPacketTargetAgentMode",
    "AIContextPacketSectionFamily",
    "AIContextPacketForbiddenActionsPolicy",
    "AIContextPacketAuthorityBoundary",
    "AIContextPacketValidationPolicy",
    "AIContextPacketPrivacyPolicy",
    "ai_context_packet_contract.v0.1",
    "packet_not_source_of_truth",
    "codex_execution_now: false",
    "github_automation_now: false",
    "agent_execution_now: false",
    "product_write_lane_parked_by_686: true",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
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
  if (browserValidationSliceActive()) {
    assertBrowserValidationPackageScript();
    return;
  }
  if (implementationSliceActive()) {
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
    "package.json must add only the AI Context Packet implementation smoke script",
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
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (implementationSliceActive()) {
    assertImplementationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `AI Context Packet contract slice must not change ${unchangedPath}`,
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
      `unexpected changed file in AI Context Packet contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add runtime AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
    assert.doesNotMatch(changedFile, /^lib\/.*github/i, "must not add GitHub automation files");
    assert.doesNotMatch(changedFile, /^lib\/.*agent/i, "must not add agent routing or execution files");
    assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout files");
    assert.doesNotMatch(changedFile, /^lib\/.*constellation/i, "must not add runtime constellation UI files");
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

function assertImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...implementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [typePath, fixturePath, ...protectedUnchangedPaths]) {
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
      `unexpected changed file in AI Context Packet implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile.startsWith("lib/")) {
      assert.equal(
        changedFile,
        implementationBuilderPath,
        "implementation slice may only change the deterministic AI Context Packet builder under lib",
      );
    }
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
    browserValidationSmokePath,
    implementationSmokePath,
    smokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    codexHandoffDraftImplementationBuilderPath,
    codexHandoffDraftImplementationFixturePath,
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    typePath,
    fixturePath,
    implementationBuilderPath,
    implementationFixturePath,
    browserValidationFixturePath,
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
    browserValidationSmokePath,
    implementationSmokePath,
    smokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    codexHandoffDraftTypePath,
    codexHandoffDraftFixturePath,
    typePath,
    fixturePath,
    implementationBuilderPath,
    implementationFixturePath,
    browserValidationFixturePath,
    ...protectedUnchangedPaths,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft implementation slice: ${changedFile}`,
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
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
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
    browserValidationSmokePath,
    implementationSmokePath,
    smokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    typePath,
    fixturePath,
    implementationBuilderPath,
    implementationFixturePath,
    browserValidationFixturePath,
    ...protectedUnchangedPaths,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Codex Handoff Draft contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Codex Handoff Draft contract slice: ${changedFile}`,
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
    assert.ok(contractSmoke.includes(requiredText), `Codex Handoff Draft contract smoke must include ${requiredText}`);
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
    "package.json must add only the AI Context Packet browser validation smoke script",
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
    implementationSmokePath,
    smokePath,
    ...aiContextPacketDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    typePath,
    fixturePath,
    implementationBuilderPath,
    implementationFixturePath,
    ...protectedUnchangedPaths,
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
      `unexpected changed file in AI Context Packet browser validation slice: ${changedFile}`,
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
  const browserValidationSmoke = readFileSync(browserValidationSmokePath, "utf8");
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
      `AI Context Packet browser validation smoke must include ${requiredText}`,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedCodeFiles = readChangedFiles().filter((filePath) =>
    (filePath.endsWith(".ts") || filePath.endsWith(".mjs")) &&
    filePath !== smokePath &&
    filePath !== perspectivePacketReceiptLinkageTypePath &&
    filePath !== perspectivePacketReceiptLinkageSmokePath &&
      filePath !== perspectivePacketReceiptLinkageImplementationSmokePath &&
    filePath !== perspectivePacketReceiptLinkageBrowserValidationSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopContractTypePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopContractSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath &&
    filePath !== implementationSmokePath &&
    filePath !== codexHandoffDraftTypePath &&
    filePath !== codexHandoffDraftSmokePath &&

    filePath !== codexHandoffDraftImplementationBuilderPath &&

    filePath !== codexHandoffDraftImplementationSmokePath &&


    filePath !== codexHandoffDraftBrowserValidationSmokePath &&
    filePath !== browserValidationSmokePath &&
    filePath !== sourceValidationSmokePath &&
    !aiContextPacketDownstreamSmokePaths.includes(filePath)
  );
  for (const filePath of changedCodeFiles) {
    const stripped = stripNonCode(readFile(filePath));
    assert.doesNotMatch(stripped, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(stripped, /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, `${filePath} must not call browser request APIs`);
    assert.doesNotMatch(stripped, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, `${filePath} must not use browser persistence`);
    assert.doesNotMatch(stripped, /\brequestAnimationFrame\s*\(/, `${filePath} must not use requestAnimationFrame`);
    assert.doesNotMatch(stripped, /\bOpenAI\b|\bfrom\s+["'][^"']*openai[^"']*["']/i, `${filePath} must not import OpenAI`);
    assert.doesNotMatch(stripped, /\bcreateClient\b|\bdb\.\w+\s*\(|\bquery\s*\(/, `${filePath} must not call DB APIs`);
    assert.doesNotMatch(stripped, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bUPSERT\b/i, `${filePath} must not write DB`);
    assert.doesNotMatch(stripped, /\bembedding\b|\bvector\b|\bfts\b/i, `${filePath} must not implement embedding/vector/FTS`);
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_perspective_geometry_digest_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#741`,
  );
  assert.equal(
    value.source_perspective_geometry_digest_validation_fingerprint,
    sourceValidationFixture.validation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createContractFingerprint(value));
}

function assertContractScope(scope) {
  assert.equal(scope.ai_context_packet_contract_only, true);
  for (const [key, value] of Object.entries(scope)) {
    if (key === "ai_context_packet_contract_only") {
      assert.equal(value, true);
    } else {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function assertPacketPrinciples(principles) {
  for (const [key, value] of Object.entries(buildPacketPrinciples())) {
    assert.equal(principles[key], value, `${key} principle must be preserved`);
  }
}

function assertTargetAgentModes(modes) {
  assert.deepEqual(modes.map((mode) => mode.mode), [
    "chatgpt_design",
    "codex_implementation",
    "codex_review",
    "mcp_runtime",
    "cockpit_ui",
  ]);
  for (const mode of modes) {
    assert.equal(mode.presentation_scope_only, true);
    assert.equal(mode.execution_authority, false);
    assert.notEqual(mode.state_mutation_authority, true);
    assert.notEqual(mode.external_call_authority, true);
    assert.notEqual(mode.codex_execution_authority_now, true);
    assert.notEqual(mode.github_automation_authority_now, true);
    assert.notEqual(mode.tool_widening_now, true);
    assert.notEqual(mode.ui_rendering_now, true);
  }
}

function assertPacketInputFields(fields) {
  assert.deepEqual(fields, expectedPacketInputFields());
}

function assertPacketOutputFields(fields) {
  assert.deepEqual(fields, expectedPacketOutputFields());
}

function assertPacketSectionFamilies(families) {
  assert.deepEqual(families.map((family) => family.section_kind), expectedSectionKinds());
  for (const family of families) {
    assert.equal(family.runtime_write_now, false, `${family.section_kind} runtime write must be false`);
  }
  const byKind = Object.fromEntries(families.map((family) => [family.section_kind, family]));
  assert.equal(byKind.selected_research_candidates.candidate_only, true);
  assert.equal(byKind.selected_research_candidates.not_evidence, true);
  assert.equal(byKind.selected_research_candidates.not_proof, true);
  assert.equal(byKind.selected_research_candidates.not_durable_state, true);
  assert.equal(byKind.selected_perspective_delta_candidates.delta_candidate_only, true);
  assert.equal(byKind.selected_perspective_delta_candidates.not_durable_perspective_delta, true);
  assert.equal(byKind.unresolved_tensions.must_remain_visible, true);
  assert.equal(byKind.unresolved_tensions.resolution_not_implied, true);
  assert.equal(byKind.knowledge_gaps.must_remain_visible, true);
  assert.equal(byKind.knowledge_gaps.closure_not_implied, true);
  assert.equal(byKind.perspective_geometry_digest_summary.interpretation_not_truth, true);
  assert.equal(byKind.perspective_geometry_digest_summary.runtime_digest_build_now, false);
  assert.equal(byKind.authority_boundary.execution_authority_false, true);
  assert.equal(byKind.authority_boundary.state_mutation_authority_false, true);
  assert.equal(byKind.authority_boundary.external_call_authority_false, true);
  assert.equal(byKind.authority_boundary.product_write_authority_false, true);
  assert.equal(byKind.expected_files.not_file_write_authority, true);
  assert.equal(byKind.expected_checks.not_execution_authority, true);
  assert.equal(byKind.final_critical_facts.review_cues_only, true);
  assert.equal(byKind.final_critical_facts.not_truth_source, true);
}

function assertForbiddenActionsPolicy(policy) {
  for (const [key, value] of Object.entries(buildForbiddenActionsPolicy())) {
    assert.equal(policy[key], value, `${key} forbidden action policy must be preserved`);
  }
}

function assertSamplePreview(preview) {
  assert.equal(preview.preview_version, previewVersion);
  assert.equal(preview.packet_input_preview.target_agent_mode, "codex_implementation");
  assert.equal(preview.packet_input_preview.not_executed_now, true);
  const packet = preview.packet_preview;
  assert.equal(packet.packet_id, "ai_context_packet_ref:public:contract_preview");
  assert.equal(packet.packet_version, packetVersion);
  assert.equal(packet.target_agent_mode, "codex_implementation");
  assert.equal(packet.mission_brief.not_instruction_to_execute, true);
  assert.equal(packet.current_state_summary.derived_summary_only, true);
  assert.equal(packet.current_state_summary.not_source_of_truth, true);
  assert.equal(packet.selected_research_candidates[0].candidate_only, true);
  assert.equal(packet.selected_research_candidates[0].not_evidence, true);
  assert.equal(packet.selected_research_candidates[0].not_proof, true);
  assert.equal(packet.selected_research_candidates[0].not_durable_state, true);
  assert.equal(packet.selected_perspective_delta_candidates[0].delta_candidate_only, true);
  assert.equal(packet.unresolved_tensions[0].must_remain_visible, true);
  assert.equal(packet.unresolved_tensions[0].resolution_not_implied, true);
  assert.equal(packet.knowledge_gaps[0].must_remain_visible, true);
  assert.equal(packet.knowledge_gaps[0].closure_not_implied, true);
  assert.equal(packet.perspective_geometry_digest_summary.interpretation_not_truth, true);
  assert.equal(packet.perspective_geometry_digest_summary.runtime_digest_build_now, false);
  for (const requiredAction of [
    "no_codex_execution_from_packet",
    "no_github_automation_from_packet",
    "no_provider_openai_call_from_packet",
    "no_retrieval_rag_execution_from_packet",
    "no_perspective_promotion_from_packet",
    "no_product_write_from_packet",
  ]) {
    assert.ok(packet.forbidden_actions.includes(requiredAction));
  }
  assert.equal(packet.expected_files[0].handoff_hint_only, true);
  assert.equal(packet.expected_files[0].not_file_write_authority, true);
  assert.equal(packet.expected_checks[0].validation_hint_only, true);
  assert.equal(packet.expected_checks[0].not_execution_authority, true);
  assert.equal(packet.stop_conditions[0].safety_constraint, true);
  assert.equal(packet.final_critical_facts[0].review_cue_only, true);
  assert.equal(packet.final_critical_facts[0].not_truth_source, true);
  assert.equal(packet.all_sections_public_safe, true);
  assert.equal(packet.all_sections_source_ref_backed_or_explicit_gap, true);
  assert.equal(packet.all_runtime_write_now_false, true);
  assert.ok(packet.source_refs.length > 0);
  assert.ok(!("contract_added_now" in packet.authority_boundary));
  assert.deepEqual(preview.authority_boundary, packet.authority_boundary);
  assert.deepEqual(preview.validation_policy, buildValidationPolicy());
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
}

function assertDocsPointers() {
  const docExpectations = [
    [
      indexDoc,
      [
        "AI Context Packet contract v0.1",
        typePath,
        fixturePath,
        smokePath,
        "AI Context Packet is context, not execution authority",
        "packet is folded, derived, advisory-only",
        "source_refs required",
        "forbidden_actions required",
        "stop_conditions required",
        "target_agent_mode is scope, not authority",
        "expected files are hints only, not write authority",
        "expected checks are validation hints only, not execution authority",
        "no runtime packet build",
        "no Codex execution",
        "no GitHub automation",
        "no provider/OpenAI call",
        "no retrieval/RAG execution",
        "product-write remains parked by #686",
        nextRecommendedSlice,
      ],
    ],
    [
      substrateDoc,
      [
        "AI Context Packet contract defines future folded AI/Codex context packet grammar only.",
        "AI Context Packet is context, not execution authority.",
        "target_agent_mode is presentation scope only, not authority.",
        "expected_files are handoff hints only and not file write authority.",
        "expected_checks are validation hints only and not execution authority.",
        "final_critical_facts are review cues only and not authority.",
        "Next recommended slice is AI Context Packet implementation v0.1.",
      ],
    ],
    [
      surfaceDoc,
      [
        "AI Context Packet remains separated from candidate preview, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.",
        "Packet-selected candidates remain candidates, not proof/evidence or durable state.",
        "AI Context Packet cannot execute Codex, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.",
      ],
    ],
    [
      gateDoc,
      [
        "AI Context Packet remains separated from candidate preview, digest runtime, layout runtime, durable Perspective state, promotion runtime, and execution.",
        "Packet-selected candidates remain candidates, not proof/evidence or durable state.",
        "AI Context Packet cannot execute Codex, create PRs, call providers, run retrieval/RAG, mutate state/work, or write product data.",
      ],
    ],
  ];
  for (const [doc, requiredTexts] of docExpectations) {
    for (const requiredText of requiredTexts) {
      assert.ok(doc.includes(requiredText), `docs must include ${requiredText}`);
    }
  }
}

function assertSourceValidationDownstreamPointer() {
  for (const requiredText of [
    contractVersion,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      "#741 browser validation smoke must allow AI Context Packet contract downstream pointer",
    );
  }
}

function implementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function assertPortableMergeBaseFallback() {
  assert.ok(smokeSource.includes("origin/main"));
  assert.ok(smokeSource.includes("HEAD^"));
  assert.ok(smokeSource.includes("Unable to determine merge base"));
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
    agentPerspectiveSubstrateFeedbackLoopContractTypePath,
    agentPerspectiveSubstrateFeedbackLoopContractFixturePath,
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
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopContractTypePath) ||
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopContractFixturePath) ||
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
    agentPerspectiveSubstrateFeedbackLoopContractTypePath,
    agentPerspectiveSubstrateFeedbackLoopContractFixturePath,
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
    agentPerspectiveSubstrateFeedbackLoopContractFixturePath,
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
  return Array.from(
    new Set([
      ...readGitOutput(["diff", "--name-only", mergeBaseRef()])
        .split("\n")
        .filter(Boolean),
      ...readGitOutput(["ls-files", "--others", "--exclude-standard"])
        .split("\n")
        .filter(Boolean),
    ]),
  ).sort();
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) return cachedMergeBaseRef;
  for (const candidate of ["origin/main", "main", "HEAD^"]) {
    try {
      execFileSync("git", ["rev-parse", "--verify", candidate], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      if (candidate === "HEAD^") {
        cachedMergeBaseRef = candidate;
      } else {
        cachedMergeBaseRef = readGitOutput(["merge-base", "HEAD", candidate]);
      }
      return cachedMergeBaseRef;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error(
    "Unable to determine merge base for AI Context Packet contract smoke",
  );
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
}

function createContractFingerprint(value) {
  const normalized = clone(value);
  const { contract_fingerprint: _contractFingerprint, ...rest } = normalized;
  return `fnv1a32:${fnv1a32(canonicalJson(rest))}`;
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortKeys(value[key]);
        return accumulator;
      }, {});
  }
  return value;
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
