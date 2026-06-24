import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const stateTrajectoryImplementationBuilderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const stateTrajectoryImplementationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json";
const stateTrajectoryImplementationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const stateTrajectoryImplementationContractSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const stateTrajectoryImplementationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-implementation-v0-1";
const stateTrajectoryImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const stateTrajectoryImplementationVersion =
  "durable_perspective_state_trajectory_implementation.v0.1";
const stateTrajectoryImplementationRecommendationStatus =
  "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1";
const stateTrajectoryImplementationNextRecommendedSlice =
  "durable_perspective_state_trajectory_browser_validation_v0_1";
const stateTrajectoryBrowserValidationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json";
const stateTrajectoryBrowserValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const stateTrajectoryBrowserValidationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-browser-validation-v0-1";
const stateTrajectoryBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const stateTrajectoryBrowserValidationVersion =
  "durable_perspective_state_trajectory_browser_validation.v0.1";
const stateTrajectoryBrowserValidationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_contract_v0_1";
const stateTrajectoryBrowserValidationNextRecommendedSlice =
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
const projectLayoutImplementationBuilderPath =
  "lib/research-candidate-review/project-constellation-runtime-layout.ts";
const projectLayoutImplementationFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json";
const projectLayoutImplementationSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs";
const projectLayoutImplementationPackageScriptName =
  "smoke:project-constellation-runtime-layout-implementation-v0-1";
const projectLayoutImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs";
const projectLayoutImplementationVersion =
  "project_constellation_runtime_layout_implementation.v0.1";
const projectLayoutImplementationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_browser_validation_v0_1";
const projectLayoutImplementationNextRecommendedSlice =
  "project_constellation_runtime_layout_browser_validation_v0_1";
const projectLayoutBrowserValidationFixturePath =
  "fixtures/research-candidate-review.project-constellation-runtime-layout-browser-validation.sample.v0.1.json";
const projectLayoutBrowserValidationSmokePath =
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs";
const projectLayoutBrowserValidationPackageScriptName =
  "smoke:project-constellation-runtime-layout-browser-validation-v0-1";
const projectLayoutBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs";
const projectLayoutBrowserValidationVersion =
  "project_constellation_runtime_layout_browser_validation.v0.1";
const projectLayoutBrowserValidationRecommendationStatus =
  "ready_for_perspective_geometry_digest_contract_v0_1";
const projectLayoutBrowserValidationNextRecommendedSlice =
  "perspective_geometry_digest_contract_v0_1";
const perspectiveGeometryDigestTypePath =
  "types/perspective-geometry-digest-contract.ts";
const perspectiveGeometryDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json";
const perspectiveGeometryDigestSmokePath =
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs";
const perspectiveGeometryDigestPackageScriptName =
  "smoke:perspective-geometry-digest-contract-v0-1";
const perspectiveGeometryDigestPackageScriptValue =
  "node scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs";
const perspectiveGeometryDigestContractVersion =
  "perspective_geometry_digest_contract.v0.1";
const perspectiveGeometryDigestRecommendationStatus =
  "ready_for_perspective_geometry_digest_implementation_v0_1";
const perspectiveGeometryDigestNextRecommendedSlice =
  "perspective_geometry_digest_implementation_v0_1";
const perspectiveGeometryDigestImplementationBuilderPath =
  "lib/research-candidate-review/perspective-geometry-digest.ts";
const perspectiveGeometryDigestImplementationFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json";
const perspectiveGeometryDigestImplementationSmokePath =
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs";
const perspectiveGeometryDigestImplementationPackageScriptName =
  "smoke:perspective-geometry-digest-implementation-v0-1";
const perspectiveGeometryDigestImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs";
const perspectiveGeometryDigestImplementationVersion =
  "perspective_geometry_digest_implementation.v0.1";
const perspectiveGeometryDigestImplementationRecommendationStatus =
  "ready_for_perspective_geometry_digest_browser_validation_v0_1";
const perspectiveGeometryDigestImplementationNextRecommendedSlice =
  "perspective_geometry_digest_browser_validation_v0_1";
const perspectiveGeometryDigestBrowserValidationFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest-browser-validation.sample.v0.1.json";
const perspectiveGeometryDigestBrowserValidationSmokePath =
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs";
const perspectiveGeometryDigestBrowserValidationPackageScriptName =
  "smoke:perspective-geometry-digest-browser-validation-v0-1";
const perspectiveGeometryDigestBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs";
const perspectiveGeometryDigestBrowserValidationVersion =
  "perspective_geometry_digest_browser_validation.v0.1";
const perspectiveGeometryDigestBrowserValidationRecommendationStatus =
  "ready_for_ai_context_packet_contract_v0_1";
const perspectiveGeometryDigestBrowserValidationNextRecommendedSlice =
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
const perspectiveGeometryDigestImplementationDownstreamSmokePaths = [
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

const perspectiveGeometryDigestBrowserValidationDownstreamSmokePaths = [
  ...(typeof perspectiveGeometryDigestSmokePath !== "undefined" ? [perspectiveGeometryDigestSmokePath] : []),
  ...perspectiveGeometryDigestImplementationDownstreamSmokePaths.filter(
    (filePath) =>
      filePath !==
      "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  ),
];
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
const stateTrajectoryImplementationDownstreamSmokePaths = [
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
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
];

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
const agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-closeout-v0-1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopCloseoutVersion =
  "agent_perspective_substrate_feedback_loop_closeout.v0.1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutRecommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutNextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
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



const builderPath =
  "lib/research-candidate-review/formation-receipt-durable-event.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";
const fixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-implementation.sample.v0.1.json";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs";
const browserValidationSmokePath =
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:formation-receipt-durable-event-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:formation-receipt-durable-event-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs";
const recentRehearsalBufferContractPackageScriptName =
  "smoke:recent-rehearsal-buffer-contract-v0-1";
const recentRehearsalBufferContractPackageScriptValue =
  "node scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs";
const recentRehearsalBufferImplementationPackageScriptName =
  "smoke:recent-rehearsal-buffer-implementation-v0-1";
const recentRehearsalBufferImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs";
const implementationKind = "formation_receipt_durable_event_implementation";
const implementationVersion =
  "formation_receipt_durable_event_implementation.v0.1";
const eventVersion = "formation_receipt_durable_event.v0.1";
const recommendationStatus =
  "ready_for_formation_receipt_durable_event_browser_validation_v0_1";
const nextRecommendedSlice =
  "formation_receipt_durable_event_browser_validation_v0_1";
const browserValidationVersion =
  "formation_receipt_durable_event_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_recent_rehearsal_buffer_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "recent_rehearsal_buffer_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");

const expectedChangedFiles = [
  builderPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
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

const recentRehearsalBufferContractChangedFiles = [
  "types/recent-rehearsal-buffer-contract.ts",
  "fixtures/research-candidate-review.recent-rehearsal-buffer-contract.sample.v0.1.json",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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

const recentRehearsalBufferImplementationChangedFiles = [
  "lib/research-candidate-review/recent-rehearsal-buffer.ts",
  "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
const browserValidationChangedFiles = [
  browserValidationFixturePath,
  browserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  contractSmokePath,
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

for (const filePath of [
  builderPath,
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
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const builderSource = readFile(builderPath);
const contractSmokeSource = readFile(contractSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const contractFixture = readJson(contractFixturePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const { buildFormationReceiptDurableEventImplementation } = await import(
  "../lib/research-candidate-review/formation-receipt-durable-event.ts"
);

const rebuiltFixture = buildImplementationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationFixture(fixture);
assertGeneratedReceiptEvent(fixture.generated_receipt_event, contractFixture);
assertSelectedContextSummary(fixture.selected_context_summary);
assertExcludedContextSummary(fixture.excluded_context_summary);
assertUnresolvedTensionSummary(fixture.unresolved_tension_summary);
assertReferenceLinkSummary(fixture.reference_link_summary);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertValidation(fixture.validation);
assertInvalidOverrideSummaryConsistency();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertFormationReceiptDurableEventBrowserValidationDownstreamPointer();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Formation Receipt durable event implementation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "formation-receipt-durable-event-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      generated_event_version: fixture.generated_receipt_event.event_version,
      selected_context_count:
        fixture.selected_context_summary.selected_context_count,
      excluded_context_count:
        fixture.excluded_context_summary.excluded_context_count,
      unresolved_tensions_preserved:
        fixture.validation.unresolved_tensions_preserved,
      durable_event_written_now:
        fixture.authority_boundary.durable_event_written_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      salience_authority: fixture.authority_boundary.salience_authority,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildImplementationFixture() {
  return buildFormationReceiptDurableEventImplementation({
    formation_receipt_durable_event_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
  });
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildFormationReceiptDurableEventImplementation",
    "formation_receipt_durable_event_implementation",
    "formation_receipt_durable_event_implementation.v0.1",
    "source_contract_ref",
    "source_contract_fingerprint",
    "source_feedback_event_aggregation_validation_ref",
    "generated_receipt_event",
    "selected_context_summary",
    "excluded_context_summary",
    "unresolved_tension_summary",
    "reference_link_summary",
    "authority_boundary",
    "validation_policy",
    "recommendation_status",
    "next_recommended_slice",
    "implementation_fingerprint",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
  assert.match(
    builderSource,
    /export function buildFormationReceiptDurableEventImplementation\b/,
    "builder must export buildFormationReceiptDurableEventImplementation",
  );
}

function assertPackageScript() {
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    assertResearchToPerspectiveFoundationMilestoneCloseoutPackageScript();
    return;
  }
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionContractPackageScript();
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopCloseoutPackageScript();
    return;
  }
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
  if (perspectiveGeometryDigestBrowserValidationSliceActive()) {
    assertPerspectiveGeometryDigestBrowserValidationPackageScript();
    return;
  }
  if (perspectiveGeometryDigestImplementationSliceActive()) {
    assertPerspectiveGeometryDigestImplementationPackageScript();
    return;
  }
  if (perspectiveGeometryDigestContractSliceActive()) {
    assertPerspectiveGeometryDigestContractPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutBrowserValidationSliceActive()) {
    assertProjectConstellationRuntimeLayoutBrowserValidationPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutImplementationSliceActive()) {
    assertProjectConstellationRuntimeLayoutImplementationPackageScript();
    return;
  }
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryContractSliceActive()) {
    assertDurablePerspectiveStateTrajectoryContractPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionBrowserValidationPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionImplementationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionImplementationPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionContractSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionContractPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagBrowserValidationSliceActive()) {
    assertNonAuthoritativeRetrievalRagBrowserValidationPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagImplementationSliceActive()) {
    assertNonAuthoritativeRetrievalRagImplementationPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagContractSliceActive()) {
    assertNonAuthoritativeRetrievalRagContractPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationBrowserValidationSliceActive()) {
    assertOperatorSourceCandidateGenerationBrowserValidationPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationImplementationSliceActive()) {
    assertOperatorSourceCandidateGenerationImplementationPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationContractSliceActive()) {
    assertOperatorSourceCandidateGenerationContractPackageScript();
    return;
  }
  if (boundedExternalSourceIntakeBrowserValidationSliceActive()) {
    assertBoundedExternalSourceIntakeBrowserValidationPackageScript();
    return;
  }
  if (boundedExternalSourceIntakeImplementationSliceActive()) {
    assertBoundedExternalSourceIntakeImplementationPackageScript();
    return;
  }
  if (boundedExternalSourceIntakeContractSliceActive()) {
    assertBoundedExternalSourceIntakeContractPackageScript();
    return;
  }
  if (salienceGovernorBrowserValidationSliceActive()) {
    assertSalienceGovernorBrowserValidationPackageScript();
    return;
  }
  if (salienceGovernorImplementationSliceActive()) {
    assertSalienceGovernorImplementationPackageScript();
    return;
  }
  if (salienceGovernorContractSliceActive()) {
    assertSalienceGovernorContractPackageScript();
    return;
  }
  if (recentRehearsalBufferBrowserValidationSliceActive()) {
    assertRecentRehearsalBufferBrowserValidationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  if (recentRehearsalBufferImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[recentRehearsalBufferImplementationPackageScriptName],
      recentRehearsalBufferImplementationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [recentRehearsalBufferImplementationPackageScriptName],
      "package.json must add only the Recent Rehearsal Buffer implementation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  if (recentRehearsalBufferContractSliceActive()) {
    assert.equal(
      packageJson.scripts[recentRehearsalBufferContractPackageScriptName],
      recentRehearsalBufferContractPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [recentRehearsalBufferContractPackageScriptName],
      "package.json must add only the Recent Rehearsal Buffer contract smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  if (browserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [browserValidationPackageScriptName],
      "package.json must add only the Formation Receipt durable event browser validation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  assert.deepEqual(
    addedScripts,
    [packageScriptName],
    "package.json must add only the Formation Receipt durable event implementation smoke script",
  );
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (researchToPerspectiveFoundationMilestoneCloseoutSliceActive()) {
    assertResearchToPerspectiveFoundationMilestoneCloseoutChangedFiles(changedFiles);
    return;
  }
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionContractChangedFiles(changedFiles);
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopCloseoutChangedFiles(changedFiles);
    return;
  }
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
  if (perspectiveGeometryDigestBrowserValidationSliceActive()) {
    assertPerspectiveGeometryDigestBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (perspectiveGeometryDigestImplementationSliceActive()) {
    assertPerspectiveGeometryDigestImplementationChangedFiles(changedFiles);
    return;
  }
  if (perspectiveGeometryDigestContractSliceActive()) {
    assertPerspectiveGeometryDigestContractChangedFiles(changedFiles);
    return;
  }
  if (projectConstellationRuntimeLayoutBrowserValidationSliceActive()) {
    assertProjectConstellationRuntimeLayoutBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (projectConstellationRuntimeLayoutImplementationSliceActive()) {
    assertProjectConstellationRuntimeLayoutImplementationChangedFiles(changedFiles);
    return;
  }
  if (projectConstellationRuntimeLayoutContractSliceActive()) {
    assertProjectConstellationRuntimeLayoutContractChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryContractSliceActive()) {
    assertDurablePerspectiveStateTrajectoryContractChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionImplementationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionImplementationChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionContractSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionContractChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagBrowserValidationSliceActive()) {
    assertNonAuthoritativeRetrievalRagBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagImplementationSliceActive()) {
    assertNonAuthoritativeRetrievalRagImplementationChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagContractSliceActive()) {
    assertNonAuthoritativeRetrievalRagContractChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationBrowserValidationSliceActive()) {
    assertOperatorSourceCandidateGenerationBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationImplementationSliceActive()) {
    assertOperatorSourceCandidateGenerationImplementationChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationContractSliceActive()) {
    assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles);
    return;
  }
  if (boundedExternalSourceIntakeBrowserValidationSliceActive()) {
    assertBoundedExternalSourceIntakeBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (boundedExternalSourceIntakeImplementationSliceActive()) {
    assertBoundedExternalSourceIntakeImplementationChangedFiles(changedFiles);
    return;
  }
  if (boundedExternalSourceIntakeContractSliceActive()) {
    assertBoundedExternalSourceIntakeContractChangedFiles(changedFiles);
    return;
  }
  if (salienceGovernorBrowserValidationSliceActive()) {
    assertSalienceGovernorBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (salienceGovernorImplementationSliceActive()) {
    assertSalienceGovernorImplementationChangedFiles(changedFiles);
    return;
  }
  if (salienceGovernorContractSliceActive()) {
    assertSalienceGovernorContractChangedFiles(changedFiles);
    return;
  }
  if (recentRehearsalBufferBrowserValidationSliceActive()) {
    assertRecentRehearsalBufferBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (recentRehearsalBufferImplementationSliceActive()) {
    for (const expectedFile of recentRehearsalBufferImplementationChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        recentRehearsalBufferImplementationChangedFiles.includes(changedFile),
        `unexpected changed file in Recent Rehearsal Buffer implementation downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }
  if (recentRehearsalBufferContractSliceActive()) {
    for (const expectedFile of recentRehearsalBufferContractChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        recentRehearsalBufferContractChangedFiles.includes(changedFile),
        `unexpected changed file in Recent Rehearsal Buffer contract downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }
  const activeExpectedFiles = browserValidationSliceActive()
    ? browserValidationChangedFiles
    : expectedChangedFiles;
  if (browserValidationSliceActive()) {
    assert.ok(
      !changedFiles.includes(builderPath),
      "browser validation slice must not change the #713 builder",
    );
    assert.ok(
      !changedFiles.includes(fixturePath),
      "browser validation slice must not change the #713 implementation fixture",
    );
  }
  for (const expectedFile of activeExpectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      activeExpectedFiles.includes(changedFile),
      `unexpected changed file in Formation Receipt durable event implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}


function durablePerspectiveStateTrajectoryContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  );
}

function assertDurablePerspectiveStateTrajectoryContractPackageScript() {
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
    packageJson.scripts["smoke:durable-perspective-state-trajectory-contract-v0-1"],
    "node scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:durable-perspective-state-trajectory-contract-v0-1"],
    "package.json must add only the Durable Perspective State / Trajectory contract smoke script",
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

function assertDurablePerspectiveStateTrajectoryContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
];
  const protectedUnchangedPaths = [
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
  ];
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Durable Perspective State / Trajectory contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Durable Perspective State / Trajectory contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  const durablePerspectiveStateTrajectoryContractSmokeSource =
    typeof smokeSource === "string" ? smokeSource : readFileSync(smokePath, "utf8");
  for (const requiredText of [
    "durable_perspective_state_trajectory_contract.v0.1",
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "smoke:durable-perspective-state-trajectory-contract-v0-1",
    "ready_for_durable_perspective_state_trajectory_implementation_v0_1",
    "durable_perspective_state_trajectory_implementation_v0_1",
    "future durable Perspective state shape and trajectory grammar",
    "current thesis has lineage",
    "prior thesis is not overwritten silently",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      durablePerspectiveStateTrajectoryContractSmokeSource.includes(requiredText),
      "smoke must allow Durable Perspective State / Trajectory contract downstream pointer: " + requiredText,
    );
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
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
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

function perspectiveGeometryDigestBrowserValidationSliceActive() {
  return readChangedFiles().includes(perspectiveGeometryDigestBrowserValidationSmokePath);
}

function assertPerspectiveGeometryDigestBrowserValidationPackageScript() {
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
    packageJson.scripts[perspectiveGeometryDigestBrowserValidationPackageScriptName],
    perspectiveGeometryDigestBrowserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [perspectiveGeometryDigestBrowserValidationPackageScriptName],
    "package.json must add only the Perspective Geometry Digest browser validation smoke script",
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

function assertPerspectiveGeometryDigestBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    perspectiveGeometryDigestBrowserValidationFixturePath,
    perspectiveGeometryDigestBrowserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    perspectiveGeometryDigestImplementationSmokePath,
    ...perspectiveGeometryDigestBrowserValidationDownstreamSmokePaths,
  ];
  const protectedFiles = [
    ...(typeof perspectiveGeometryDigestImplementationBuilderPath !== "undefined" ? [perspectiveGeometryDigestImplementationBuilderPath] : []),
    ...(typeof perspectiveGeometryDigestImplementationFixturePath !== "undefined" ? [perspectiveGeometryDigestImplementationFixturePath] : []),
    ...(typeof perspectiveGeometryDigestTypePath !== "undefined" ? [perspectiveGeometryDigestTypePath] : []),
    ...(typeof perspectiveGeometryDigestFixturePath !== "undefined" ? [perspectiveGeometryDigestFixturePath] : []),
    ...(typeof builderPath !== "undefined" ? [builderPath] : []),
    ...(typeof contractTypePath !== "undefined" ? [contractTypePath] : []),
    ...(typeof contractFixturePath !== "undefined" ? [contractFixturePath] : []),
    ...(typeof implementationFixturePath !== "undefined" ? [implementationFixturePath] : []),
    ...(typeof fixturePath !== "undefined" ? [fixturePath] : []),
    "lib/db/schema.sql",
  ];
  for (const unchangedPath of protectedFiles) {
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
      `unexpected changed file in Perspective Geometry Digest browser validation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*constellation/i, "must not add runtime constellation implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*graph/i, "must not add graph DB or graph mutation files");
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertPerspectiveGeometryDigestBrowserValidationDownstreamPointer() {
  const digestSmoke = readFileSync(perspectiveGeometryDigestBrowserValidationSmokePath, "utf8");
  for (const requiredText of [
    perspectiveGeometryDigestBrowserValidationVersion,
    perspectiveGeometryDigestBrowserValidationFixturePath,
    perspectiveGeometryDigestBrowserValidationSmokePath,
    perspectiveGeometryDigestBrowserValidationPackageScriptName,
    perspectiveGeometryDigestBrowserValidationRecommendationStatus,
    perspectiveGeometryDigestBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      digestSmoke.includes(requiredText),
      `Perspective Geometry Digest browser validation smoke must include ${requiredText}`,
    );
  }
}

function perspectiveGeometryDigestImplementationSliceActive() {
  return readChangedFiles().includes(perspectiveGeometryDigestImplementationSmokePath);
}

function perspectiveGeometryDigestContractSliceActive() {
  return readChangedFiles().includes(perspectiveGeometryDigestSmokePath);
}

function assertPerspectiveGeometryDigestContractPackageScript() {
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
    packageJson.scripts[perspectiveGeometryDigestPackageScriptName],
    perspectiveGeometryDigestPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [perspectiveGeometryDigestPackageScriptName],
    "package.json must add only the Perspective Geometry Digest contract smoke script",
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

function assertPerspectiveGeometryDigestContractChangedFiles(changedFiles) {
  const expectedFiles = [
    perspectiveGeometryDigestTypePath,
    perspectiveGeometryDigestFixturePath,
    perspectiveGeometryDigestSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    projectLayoutSmokePath,
    projectLayoutImplementationSmokePath,
    projectLayoutBrowserValidationSmokePath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    projectLayoutTypePath,
    projectLayoutFixturePath,
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutBrowserValidationFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Perspective Geometry Digest contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Perspective Geometry Digest contract downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*geometry.*digest", "i").test(changedFile), false, "must not add runtime geometry digest implementation files");
    assert.equal(new RegExp("^lib/.*layout", "i").test(changedFile), false, "must not add runtime layout implementation files");
    assert.equal(new RegExp("^lib/.*constellation", "i").test(changedFile), false, "must not add runtime constellation implementation files");
    assert.equal(new RegExp("^lib/.*graph", "i").test(changedFile), false, "must not add graph DB or graph mutation files");
    assert.equal(new RegExp("^lib/.*ai.*context", "i").test(changedFile), false, "must not add AI context packet files");
    assert.equal(new RegExp("^lib/.*codex.*handoff", "i").test(changedFile), false, "must not add Codex handoff files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  assertPerspectiveGeometryDigestImplementationDownstreamPointer();
  assertPerspectiveGeometryDigestBrowserValidationDownstreamPointer();
}

function assertPerspectiveGeometryDigestImplementationPackageScript() {
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
    packageJson.scripts[perspectiveGeometryDigestImplementationPackageScriptName],
    perspectiveGeometryDigestImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [perspectiveGeometryDigestImplementationPackageScriptName],
    "package.json must add only the Perspective Geometry Digest implementation smoke script",
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

function assertPerspectiveGeometryDigestImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    perspectiveGeometryDigestImplementationBuilderPath,
    perspectiveGeometryDigestImplementationFixturePath,
    perspectiveGeometryDigestImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    perspectiveGeometryDigestSmokePath,
    smokePath,
    ...perspectiveGeometryDigestImplementationDownstreamSmokePaths,
  ];
  const protectedImplementationFiles = [
    ...(typeof perspectiveGeometryDigestTypePath !== "undefined" ? [perspectiveGeometryDigestTypePath] : []),
    ...(typeof perspectiveGeometryDigestFixturePath !== "undefined" ? [perspectiveGeometryDigestFixturePath] : []),
    ...(typeof builderPath !== "undefined" ? [builderPath] : []),
    ...(typeof contractTypePath !== "undefined" ? [contractTypePath] : []),
    ...(typeof contractFixturePath !== "undefined" ? [contractFixturePath] : []),
    ...(typeof implementationFixturePath !== "undefined" ? [implementationFixturePath] : []),
    ...(typeof fixturePath !== "undefined" ? [fixturePath] : []),
    "lib/db/schema.sql",
  ];
  for (const unchangedPath of protectedImplementationFiles) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Geometry Digest implementation slice must not change ${unchangedPath}`,
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
      `unexpected changed file in Perspective Geometry Digest implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== perspectiveGeometryDigestImplementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*geometry.*digest/i, "must not add runtime geometry digest files outside the deterministic builder");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*ai.*context/i, "must not add AI context packet files");
    assert.doesNotMatch(changedFile, /^lib\/.*codex.*handoff/i, "must not add Codex handoff files");
    assert.doesNotMatch(changedFile, /^lib\/.*layout/i, "must not add runtime layout implementation files");
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
  assertPerspectiveGeometryDigestImplementationDownstreamPointer();
}

function assertPerspectiveGeometryDigestImplementationDownstreamPointer() {
  const digestSmoke = readFileSync(perspectiveGeometryDigestImplementationSmokePath, "utf8");
  for (const requiredText of [
    perspectiveGeometryDigestImplementationVersion,
    perspectiveGeometryDigestImplementationBuilderPath,
    perspectiveGeometryDigestImplementationFixturePath,
    perspectiveGeometryDigestImplementationSmokePath,
    perspectiveGeometryDigestImplementationPackageScriptName,
    perspectiveGeometryDigestImplementationRecommendationStatus,
    perspectiveGeometryDigestImplementationNextRecommendedSlice,
    "deterministic fixture-backed builder/helper for the #739 contract",
    "materializes public-safe Perspective Geometry Digest preview bundles only",
    "invalid_digest_preview_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      digestSmoke.includes(requiredText),
      `downstream smoke must allow Perspective Geometry Digest implementation pointer: ${requiredText}`,
    );
  }
}

function assertPerspectiveGeometryDigestContractDownstreamPointer() {
  const digestSmoke = readFileSync(perspectiveGeometryDigestSmokePath, "utf8");
  for (const requiredText of [
    perspectiveGeometryDigestContractVersion,
    perspectiveGeometryDigestTypePath,
    perspectiveGeometryDigestFixturePath,
    perspectiveGeometryDigestSmokePath,
    perspectiveGeometryDigestPackageScriptName,
    perspectiveGeometryDigestRecommendationStatus,
    perspectiveGeometryDigestNextRecommendedSlice,
    "future AI-readable interpretation layer",
    "PerspectiveGeometryDigest is interpretation, not truth",
    "raw coordinates are not enough",
    "recommended retrieval expansion is advisory and does not execute retrieval",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      digestSmoke.includes(requiredText),
      "downstream smoke must allow Perspective Geometry Digest contract pointer: " + requiredText,
    );
  }
}

function projectConstellationRuntimeLayoutBrowserValidationSliceActive() {
  return readChangedFiles().includes(projectLayoutBrowserValidationSmokePath);
}

function assertProjectConstellationRuntimeLayoutBrowserValidationPackageScript() {
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
    packageJson.scripts[projectLayoutBrowserValidationPackageScriptName],
    projectLayoutBrowserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutBrowserValidationPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout browser validation smoke script",
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

function assertProjectConstellationRuntimeLayoutBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    projectLayoutBrowserValidationFixturePath,
    projectLayoutBrowserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    projectLayoutImplementationSmokePath,
    projectLayoutSmokePath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutTypePath,
    projectLayoutFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Project Constellation Runtime Layout browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Project Constellation Runtime Layout browser validation downstream slice: " + changedFile);
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
  assertProjectConstellationRuntimeLayoutBrowserValidationDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(projectLayoutBrowserValidationSmokePath, "utf8");
  for (const requiredText of [
    projectLayoutBrowserValidationVersion,
    projectLayoutBrowserValidationFixturePath,
    projectLayoutBrowserValidationSmokePath,
    projectLayoutBrowserValidationPackageScriptName,
    projectLayoutBrowserValidationRecommendationStatus,
    projectLayoutBrowserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #737",
    "validates #736 contract boundary and #737 top-level implementation boundary separation",
    "validates built Project Constellation layout preview bundle",
    "validates invalid layout preview override rejection",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      "downstream smoke must allow Project Constellation Runtime Layout browser validation pointer: " + requiredText,
    );
  }
}

function projectConstellationRuntimeLayoutImplementationSliceActive() {
  return readChangedFiles().includes(projectLayoutImplementationSmokePath);
}

function assertProjectConstellationRuntimeLayoutImplementationPackageScript() {
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
    packageJson.scripts[projectLayoutImplementationPackageScriptName],
    projectLayoutImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [projectLayoutImplementationPackageScriptName],
    "package.json must add only the Project Constellation Runtime Layout implementation smoke script",
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

function assertProjectConstellationRuntimeLayoutImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    projectLayoutSmokePath,
    ...projectLayoutContractDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    projectLayoutTypePath,
    projectLayoutFixturePath,
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
    assert.ok(!changedFiles.includes(unchangedPath), "Project Constellation Runtime Layout implementation slice must not change " + unchangedPath);
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Project Constellation Runtime Layout implementation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    if (changedFile !== projectLayoutImplementationBuilderPath) {
      assert.equal(new RegExp("^lib/.*layout", "i").test(changedFile), false, "must not add runtime layout implementation files");
      assert.equal(new RegExp("^lib/.*constellation", "i").test(changedFile), false, "must not add runtime constellation implementation files");
      assert.equal(new RegExp("^lib/.*graph", "i").test(changedFile), false, "must not add graph DB or graph mutation files");
    }
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  assertProjectConstellationRuntimeLayoutImplementationDownstreamPointer();
}

function assertProjectConstellationRuntimeLayoutImplementationDownstreamPointer() {
  const implementationSmoke = readFileSync(projectLayoutImplementationSmokePath, "utf8");
  for (const requiredText of [
    projectLayoutImplementationVersion,
    projectLayoutImplementationBuilderPath,
    projectLayoutImplementationFixturePath,
    projectLayoutImplementationSmokePath,
    projectLayoutImplementationPackageScriptName,
    projectLayoutImplementationRecommendationStatus,
    projectLayoutImplementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "validates and materializes #736 Project Constellation layout preview bundle",
    "layout is interface, not truth",
    "coordinates are display hints, not source of truth",
    "product-write remains parked by #686",
  ]) {
    assert.ok(implementationSmoke.includes(requiredText), "downstream smoke must allow Project Constellation Runtime Layout implementation pointer: " + requiredText);
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
  return readChangedFiles().includes(stateTrajectoryBrowserValidationSmokePath);
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
    packageJson.scripts[stateTrajectoryBrowserValidationPackageScriptName],
    stateTrajectoryBrowserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [stateTrajectoryBrowserValidationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory browser validation smoke script",
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

function assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...stateTrajectoryImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
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
    assert.ok(!changedFiles.includes(unchangedPath), "Durable Perspective State / Trajectory browser validation slice must not change " + unchangedPath);
  }
  for (const expectedFile of [
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Durable Perspective State / Trajectory browser validation downstream slice: " + changedFile);
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
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  const stateTrajectoryImplementationSmokeSource = readFileSync(stateTrajectoryImplementationSmokePath, "utf8");
  for (const requiredText of [
    stateTrajectoryBrowserValidationVersion,
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryBrowserValidationPackageScriptName,
    stateTrajectoryBrowserValidationRecommendationStatus,
    stateTrajectoryBrowserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #734",
    "current thesis has lineage",
    "PerspectiveSnapshot runtime not implemented",
    "product-write remains parked by #686",
  ]) {
    assert.ok(stateTrajectoryImplementationSmokeSource.includes(requiredText), "smoke must allow Durable Perspective State / Trajectory browser validation downstream pointer: " + requiredText);
  }
}

function durablePerspectiveStateTrajectoryImplementationSliceActive() {
  return readChangedFiles().includes(stateTrajectoryImplementationSmokePath);
}

function assertDurablePerspectiveStateTrajectoryImplementationPackageScript() {
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
    packageJson.scripts[stateTrajectoryImplementationPackageScriptName],
    stateTrajectoryImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [stateTrajectoryImplementationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory implementation smoke script",
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

function assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...stateTrajectoryImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
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
    assert.ok(!changedFiles.includes(unchangedPath), "Durable Perspective State / Trajectory implementation slice must not change " + unchangedPath);
  }
  for (const expectedFile of [
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    stateTrajectoryImplementationContractSmokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Durable Perspective State / Trajectory implementation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    if (changedFile !== stateTrajectoryImplementationBuilderPath) {
      assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
      assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
      assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    }
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  const stateTrajectoryImplementationSmokeSource = readFileSync(stateTrajectoryImplementationSmokePath, "utf8");
  for (const requiredText of [
    stateTrajectoryImplementationVersion,
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationPackageScriptName,
    stateTrajectoryImplementationRecommendationStatus,
    stateTrajectoryImplementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "current thesis has lineage",
    "product-write remains parked by #686",
  ]) {
    assert.ok(stateTrajectoryImplementationSmokeSource.includes(requiredText), "smoke must allow Durable Perspective State / Trajectory implementation downstream pointer: " + requiredText);
  }
}

function assertNoForbiddenRuntimePatterns() {
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    return;
  }
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== "types/non-authoritative-retrieval-rag-contract.ts" &&
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser fetch", regex: /\bfetch\s*\(/ },
      { label: "localStorage", regex: /\blocalStorage\b/ },
      { label: "sessionStorage", regex: /\bsessionStorage\b/ },
      { label: "indexedDB", regex: /\bindexedDB\b/ },
      { label: "document.cookie", regex: /document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime SQL", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/ },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bruntimeDbWrite\b|\bproductionDbWrite\b/i },
      { label: "durable event runtime writer", regex: /\b(write|insert|persist)FormationReceipt(Durable)?Event\b/i },
      { label: "feedback write", regex: /\bwriteFeedbackEvent\b|\binsertFeedbackEvent\b|\bmutateFeedbackEvent\b/ },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "proof write", regex: /\bcreateProof\b|\binsertProof\b/ },
      { label: "evidence write", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b/ },
      { label: "Perspective durable state write", regex: /\bwritePerspective\b|\bupsertPerspective\b/ },
      { label: "promotion decision", regex: /\bcreatePromotionDecision\b|\brecordPromotionDecision\b/ },
      { label: "work mutation", regex: /\bcreateWork\b|\bmutateWork\b|\bupdateWork\b/ },
      { label: "salience authority true flag", regex: /\bsalience_authority:\s*true\b/ },
      { label: "salience score", regex: /\bsalience_score\b|\bsalienceScore\b/ },
      { label: "product write", regex: /\bexecuteProductWrite\b|\bproductDbWrite\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(
    value.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(
    value.source_feedback_event_aggregation_validation_ref,
    contractFixture.source_feedback_event_aggregation_validation_ref,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.match(value.implementation_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
}

function assertGeneratedReceiptEvent(event, contract) {
  for (const field of Object.keys(contract.durable_event_fields)) {
    assert.ok(Object.hasOwn(event, field), `generated receipt event must include ${field}`);
  }
  assert.equal(event.event_version, eventVersion);
  assert.ok(event.formation_receipt_event_id.startsWith("formation_receipt_event_contract_sample"));
  assert.ok(Array.isArray(event.selected_context_refs) && event.selected_context_refs.length > 0);
  assert.ok(Array.isArray(event.excluded_context_refs) && event.excluded_context_refs.length > 0);
  assert.ok(Array.isArray(event.unresolved_tension_ids) && event.unresolved_tension_ids.length > 0);
  assert.ok(Array.isArray(event.source_refs) && event.source_refs.length > 0);
  assert.ok(Array.isArray(event.candidate_refs) && event.candidate_refs.length > 0);
  assert.ok(Array.isArray(event.digest_refs) && event.digest_refs.length > 0);
  assert.ok(Array.isArray(event.handoff_refs) && event.handoff_refs.length > 0);
  assert.ok(Array.isArray(event.decision_refs) && event.decision_refs.length > 0);
  assert.ok(Array.isArray(event.result_refs) && event.result_refs.length > 0);
  assert.deepEqual(event.authority_boundary, contract.authority_boundary);
  assert.deepEqual(event.validation, contract.validation_policy);
}

function assertSelectedContextSummary(value) {
  assert.equal(value.selected_context_count, fixture.generated_receipt_event.selected_context_refs.length);
  assert.deepEqual(
    value.selected_context_ref_ids,
    fixture.generated_receipt_event.selected_context_refs.map((ref) => ref.context_ref_id),
  );
  assert.equal(value.selected_context_has_source_refs, true);
  assert.equal(value.provenance_only, true);
  assert.equal(value.not_proof_or_evidence, true);
  assert.equal(value.not_source_of_truth, true);
  assert.equal(value.not_perspective_promotion, true);
  assert.equal(value.not_work_completion, true);
  assert.equal(value.not_product_write, true);
  for (const ref of fixture.generated_receipt_event.selected_context_refs) {
    assert.ok(Array.isArray(ref.source_refs) && ref.source_refs.length > 0);
  }
}

function assertExcludedContextSummary(value) {
  assert.equal(value.excluded_context_count, fixture.generated_receipt_event.excluded_context_refs.length);
  assert.deepEqual(
    value.excluded_context_ref_ids,
    fixture.generated_receipt_event.excluded_context_refs.map((ref) => ref.context_ref_id),
  );
  assert.equal(value.excluded_context_reasons_present, true);
  assert.equal(value.deletes_records, false);
  assert.equal(value.suppresses_future_review, false);
  assert.equal(value.audit_provenance_only, true);
  for (const ref of fixture.generated_receipt_event.excluded_context_refs) {
    assert.ok(typeof ref.reason === "string" && ref.reason.length > 0);
    assert.equal(
      fixture.generated_receipt_event.excluded_context_reasons[ref.context_ref_id],
      ref.reason,
    );
  }
}

function assertUnresolvedTensionSummary(value) {
  assert.equal(value.unresolved_tension_count, fixture.generated_receipt_event.unresolved_tension_ids.length);
  assert.deepEqual(value.unresolved_tension_ids, fixture.generated_receipt_event.unresolved_tension_ids);
  assert.equal(value.unresolved_tensions_preserved, true);
  assert.equal(value.receipt_creation_resolves_tensions, false);
  assert.equal(value.contract_decides_promotion, false);
  assert.equal(value.implementation_decides_promotion, false);
}

function assertReferenceLinkSummary(value) {
  assert.equal(value.digest_refs_count, fixture.generated_receipt_event.digest_refs.length);
  assert.equal(value.handoff_refs_count, fixture.generated_receipt_event.handoff_refs.length);
  assert.equal(value.decision_refs_count, fixture.generated_receipt_event.decision_refs.length);
  assert.equal(value.result_refs_count, fixture.generated_receipt_event.result_refs.length);
  assert.equal(value.references_only, true);
  assert.equal(value.creates_referenced_objects, false);
  assert.equal(value.approves_merge, false);
  assert.equal(value.executes_codex_or_github_automation, false);
  assert.equal(value.mutates_work_status, false);
  for (const ref of [
    ...fixture.generated_receipt_event.digest_refs,
    ...fixture.generated_receipt_event.handoff_refs,
    ...fixture.generated_receipt_event.decision_refs,
    ...fixture.generated_receipt_event.result_refs,
  ]) {
    assert.equal(ref.references_only, true);
  }
}

function assertAuthorityBoundary(value) {
  assert.deepEqual(value, {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_persistence_implemented_now: false,
    durable_event_written_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  });
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
  });
}

function assertValidation(value) {
  assert.equal(value.passed, true);
  assert.deepEqual(value.failure_codes, []);
  assert.equal(value.selected_context_has_source_refs, true);
  assert.equal(value.excluded_context_has_reasons, true);
  assert.equal(value.unresolved_tensions_preserved, true);
  assert.equal(value.reference_links_are_reference_only, true);
  assert.equal(value.authority_boundary_preserved, true);
  assert.equal(value.deterministic_rebuild_matches_fixture, true);
}

function assertInvalidOverrideSummaryConsistency() {
  const invalidOverride = buildFormationReceiptDurableEventImplementation({
    formation_receipt_durable_event_contract: contractFixture,
    selected_context_refs: [
      {
        context_ref_id: "selected_context_ref_missing_source_refs",
        context_kind: "synthetic_invalid_selected_context",
        selection_status: "selected",
        source_refs: [],
        reason: "Synthetic invalid override for summary validation consistency.",
      },
    ],
    excluded_context_refs: [
      {
        context_ref_id: "excluded_context_ref_missing_reason",
        context_kind: "synthetic_invalid_excluded_context",
        selection_status: "excluded",
        source_refs: ["source_ref_feedback_aggregation_validation_711"],
        reason: "",
      },
    ],
  });

  assert.equal(invalidOverride.validation.selected_context_has_source_refs, false);
  assert.ok(
    invalidOverride.validation.failure_codes.includes("selected_context_missing_source_refs"),
  );
  assert.equal(
    invalidOverride.selected_context_summary.selected_context_has_source_refs,
    false,
  );
  assert.equal(invalidOverride.validation.excluded_context_has_reasons, false);
  assert.ok(
    invalidOverride.validation.failure_codes.includes("excluded_context_missing_reason"),
  );
  assert.equal(
    invalidOverride.excluded_context_summary.excluded_context_reasons_present,
    false,
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    "Formation Receipt durable event implementation v0.1",
    builderPath,
    fixturePath,
    smokePath,
    packageScriptName,
    "deterministic fixture-backed implementation",
    "generated receipt event shape from #712 contract",
    "selected/excluded context summary",
    "unresolved tension preservation",
    "reference-only decision/handoff/result links",
    "no runtime persistence",
    "no runtime DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no proof/evidence/Perspective promotion/work mutation",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no salience authority",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Formation Receipt durable event implementation v0\.1/i);
    assert.match(doc, /deterministic/i);
    assert.match(doc, /fixture-backed/i);
    assert.match(doc, /receipt-shaped provenance artifacts|provenance and reference links/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /not Perspective state|durable Perspective promotion/i);
    assert.match(doc, /not work status|work mutation/i);
    assert.match(doc, /not promotion authority|promotion/i);
    assert.match(doc, /not salience authority|salience/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /product write/i);
    assert.match(doc, /no runtime DB|runtime DB/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    builderPath,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "assertFormationReceiptDurableEventImplementationDownstreamPointer",
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `#712 contract smoke must allow implementation downstream pointer: ${requiredText}`,
    );
  }
}

function assertFormationReceiptDurableEventBrowserValidationDownstreamPointer() {
  if (!browserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
    "summary_validation_consistent_for_invalid_overrides",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFile(smokePath).includes(requiredText),
      `#713 implementation smoke must allow browser validation text: ${requiredText}`,
    );
  }
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

function dogfoodingResearchToPerspectiveCiExpansionCloseoutSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionCloseoutPackageScript() {
  const closeoutPackageScriptName =
    "smoke:dogfooding-research-to-perspective-ci-expansion-closeout-v0-1";
  const closeoutPackageScriptValue =
    "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs";
  const dogfoodingBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", mergeBaseRef() + ":" + packagePath]),
        );
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
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, dogfoodingBasePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, dogfoodingBasePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    dogfoodingBasePackageJson.optionalDependencies ?? {},
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionCloseoutChangedFiles(changedFiles) {
  const expected = [
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-closeout.sample.v0.1.json",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "dogfooding closeout slice must include " + filePath);
  }
  for (const protectedPath of [
    "types/dogfooding-research-to-perspective-ci-expansion-contract.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
    "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-browser-validation.sample.v0.1.json",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      "Dogfooding Research-to-Perspective CI Expansion closeout slice must not change " + protectedPath,
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
      "unexpected changed file in Dogfooding Research-to-Perspective CI Expansion closeout slice: " + changedFile,
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

function dogfoodingResearchToPerspectiveCiExpansionBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionBrowserValidationPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionCloseoutSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionCloseoutPackageScript();
    return;
  }
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
  if (dogfoodingResearchToPerspectiveCiExpansionCloseoutSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionCloseoutChangedFiles(changedFiles);
    return;
  }
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
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionContractPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionImplementationPackageScript();
    return;
  }
  const dogfoodingPackageScriptName =
    "smoke:dogfooding-research-to-perspective-ci-expansion-contract-v0-1";
  const dogfoodingPackageScriptValue =
    "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
  const dogfoodingBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", `${mergeBaseRef()}:${packagePath}`]),
        );
  assert.equal(
    packageJson.scripts[dogfoodingPackageScriptName],
    dogfoodingPackageScriptValue,
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
    [dogfoodingPackageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion contract smoke script",
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

function assertDogfoodingResearchToPerspectiveCiExpansionContractChangedFiles(changedFiles) {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionImplementationChangedFiles(changedFiles);
    return;
  }
  const expected = [
    "types/dogfooding-research-to-perspective-ci-expansion-contract.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs",
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "dogfooding contract slice must include " + filePath);
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
      "unexpected changed file in Dogfooding Research-to-Perspective CI Expansion contract slice: " + changedFile,
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

function agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive() {
  const changedFiles = readChangedFiles();
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const packageAddsCloseoutScript = packageAddedLines.some((line) =>
    line.includes(`"${agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName}"`),
  );
  return (
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath) ||
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath) ||
    packageAddsCloseoutScript
  );
}

function assertAgentPerspectiveSubstrateFeedbackLoopCloseoutPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptValue,
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
    [agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop closeout smoke script",
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

function assertAgentPerspectiveSubstrateFeedbackLoopCloseoutChangedFiles(changedFiles) {
  const expectedFiles = [
    agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath,
    agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const unchangedPath of [
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath,
    "types/agent-perspective-substrate-feedback-loop-contract.ts",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop closeout slice must not change " + unchangedPath,
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
        "agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive",
      );
    assert.ok(
      expectedFiles.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Agent Perspective Substrate Feedback Loop closeout slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopCloseoutDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopCloseoutDownstreamPointer() {
  const browserValidationSmoke = readFileSync(
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    "utf8",
  );
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopCloseoutVersion,
    agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath,
    agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath,
    agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptValue,
    agentPerspectiveSubstrateFeedbackLoopCloseoutRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopCloseoutNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath + " must include " + requiredText,
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
  const changed = [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["diff", "--cached", "--name-only"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(changed)].sort();
}

function nonAuthoritativeRetrievalRagBrowserValidationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    )
  );
}

function nonAuthoritativeRetrievalRagImplementationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    !nonAuthoritativeRetrievalRagBrowserValidationSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    )
  );
}

function nonAuthoritativeRetrievalRagContractSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    !nonAuthoritativeRetrievalRagBrowserValidationSliceActive() &&
    !nonAuthoritativeRetrievalRagImplementationSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    )
  );
}



function humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertHumanReviewedDurablePerspectivePromotionBrowserValidationChangedFiles(changedFiles) {
  const browserValidationAllowedSmokePaths = [
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
  const expectedFiles = [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    ...browserValidationAllowedSmokePaths,
  ];
  for (const unchangedPath of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Human-reviewed Durable Perspective Promotion browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_browser_validation.v0.1",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1",
    "ready_for_durable_perspective_state_trajectory_contract_v0_1",
    "durable_perspective_state_trajectory_contract_v0_1",
    "validates deterministic fixture-backed implementation from #731",
    "explicit human review required",
    "source_refs required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync("scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs", "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion browser validation pointer: " + requiredText,
    );
  }
}

function humanReviewedDurablePerspectivePromotionImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionImplementationPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion implementation smoke script",
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

function assertHumanReviewedDurablePerspectivePromotionImplementationChangedFiles(changedFiles) {
  const implementationAllowedSmokePaths = [
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
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
  const implementationBuilderPath =
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts";
  const implementationFixturePath =
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json";
  const implementationSmokePath =
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs";
  const implementationContractSmokePath =
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs";
  const expectedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    implementationContractSmokePath,
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    smokePath,
    ...implementationAllowedSmokePaths,
    ...(typeof downstreamSmokePaths === "undefined" ? [] : downstreamSmokePaths),
  ];
  for (const unchangedPath of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Human-reviewed Durable Perspective Promotion implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    implementationContractSmokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== implementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_implementation.v0.1",
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
    "human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
    "deterministic fixture-backed implementation only",
    "explicit human review required",
    "source_refs required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(implementationSmokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion implementation pointer: " + requiredText,
    );
  }
}

function humanReviewedDurablePerspectivePromotionContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionContractPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-contract-v0-1"],
    "node scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-contract-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion contract smoke script",
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

function assertHumanReviewedDurablePerspectivePromotionContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Human-reviewed Durable Perspective Promotion contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_contract.v0.1",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "smoke:human-reviewed-durable-perspective-promotion-contract-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_implementation_v0_1",
    "human_reviewed_durable_perspective_promotion_implementation_v0_1",
    "future human/Core promotion gate only",
    "explicit human review required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion contract pointer: " + requiredText,
    );
  }
}

function assertNonAuthoritativeRetrievalRagBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-browser-validation-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG browser validation smoke script",
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

function assertNonAuthoritativeRetrievalRagBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Non-authoritative Retrieval/RAG browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "non_authoritative_retrieval_rag_browser_validation.v0.1",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "smoke:non-authoritative-retrieval-rag-browser-validation-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_contract_v0_1",
    "human_reviewed_durable_perspective_promotion_contract_v0_1",
    "validates deterministic fixture-backed implementation from #728",
    "validates #727 contract boundary and #728 top-level implementation boundary separation",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Non-authoritative Retrieval/RAG browser validation pointer: " + requiredText,
    );
  }
}

function assertNonAuthoritativeRetrievalRagImplementationPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-implementation-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertNonAuthoritativeRetrievalRagImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Non-authoritative Retrieval/RAG implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNonAuthoritativeRetrievalRagContractPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-contract-v0-1"],
    "node scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-contract-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertNonAuthoritativeRetrievalRagContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Non-authoritative Retrieval/RAG contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function operatorSourceCandidateGenerationBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationBrowserValidationPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-browser-validation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-browser-validation-v0-1"],
    "package.json must add only the Operator Source Candidate Generation browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function operatorSourceCandidateGenerationImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationImplementationPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-implementation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-implementation-v0-1"],
    "package.json must add only the Operator Source Candidate Generation implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function operatorSourceCandidateGenerationContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationContractPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-contract-v0-1"
    ],
    "node scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-contract-v0-1"],
    "package.json must add only the Operator Source Candidate Generation contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation contract slice must not change " + unchangedPath,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function boundedExternalSourceIntakeBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  );
}

function assertBoundedExternalSourceIntakeBrowserValidationPackageScript() {
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
    packageJson.scripts[
      "smoke:bounded-external-source-intake-browser-validation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-browser-validation-v0-1"],
    "package.json must add only the Bounded External Source Intake browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBoundedExternalSourceIntakeBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.bounded-external-source-intake-browser-validation.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Bounded External Source Intake browser validation slice must not change " + unchangedPath,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Bounded External Source Intake browser validation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function boundedExternalSourceIntakeImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs");
}

function assertBoundedExternalSourceIntakeImplementationPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    "package.json",
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts["smoke:bounded-external-source-intake-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-implementation-v0-1"],
    "package.json must add only the Bounded External Source Intake implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBoundedExternalSourceIntakeImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of [
    "types/bounded-external-source-intake-contract.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function boundedExternalSourceIntakeContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs");
}

function assertBoundedExternalSourceIntakeContractPackageScript() {
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
    packageJson.scripts["smoke:bounded-external-source-intake-contract-v0-1"],
    "node scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-contract-v0-1"],
    "package.json must add only the Bounded External Source Intake contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBoundedExternalSourceIntakeContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/bounded-external-source-intake-contract.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake contract slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}



function recentRehearsalBufferImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs");
}

function recentRehearsalBufferContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs");
}

function stripValidationText(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) {
    return cachedMergeBaseRef;
  }
  for (const ref of ["origin/main", "main"]) {
    if (!gitRefExists(ref)) {
      continue;
    }
    const mergeBase = tryGitOutput(["merge-base", "HEAD", ref])?.trim();
    if (mergeBase) {
      cachedMergeBaseRef = mergeBase;
      return cachedMergeBaseRef;
    }
  }
  const parentRef = tryGitOutput(["rev-parse", "--verify", "HEAD^"])?.trim();
  if (parentRef) {
    cachedMergeBaseRef = parentRef;
    return cachedMergeBaseRef;
  }
  throw new Error(
    "Unable to determine a base ref for static changed-file validation. " +
      "Expected origin/main, local main, or HEAD^ to resolve.",
  );
}

function gitRefExists(ref) {
  return tryGitOutput(["rev-parse", "--verify", ref]) !== null;
}

function tryGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function recentRehearsalBufferBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  );
}

function assertRecentRehearsalBufferBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:recent-rehearsal-buffer-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:recent-rehearsal-buffer-browser-validation-v0-1"],
    "package.json must add only the Recent Rehearsal Buffer browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertRecentRehearsalBufferBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.recent-rehearsal-buffer-browser-validation.sample.v0.1.json",
    "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "browser validation slice must not change the #716 builder",
  );
  assert.ok(
    !changedFiles.includes("fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json"),
    "browser validation slice must not change the #716 implementation fixture",
  );
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Recent Rehearsal Buffer browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function salienceGovernorContractSliceActive() {
  return readChangedFiles().includes("scripts/smoke-salience-governor-contract-v0-1.mjs");
}

function assertSalienceGovernorContractPackageScript() {
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
    packageJson.scripts["smoke:salience-governor-contract-v0-1"],
    "node scripts/smoke-salience-governor-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:salience-governor-contract-v0-1"],
    "package.json must add only the Salience Governor contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorContractChangedFiles(changedFiles) {
  const expectedFiles =   [
      "types/salience-governor-contract.ts",
      "fixtures/research-candidate-review.salience-governor-contract.sample.v0.1.json",
      "scripts/smoke-salience-governor-contract-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
      "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
      "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor contract slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor contract slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor contract downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function salienceGovernorImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-salience-governor-implementation-v0-1.mjs");
}

function assertSalienceGovernorImplementationPackageScript() {
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
    packageJson.scripts["smoke:salience-governor-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-salience-governor-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:salience-governor-implementation-v0-1"],
    "package.json must add only the Salience Governor implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorImplementationChangedFiles(changedFiles) {
  const expectedFiles =   [
      "lib/research-candidate-review/salience-governor.ts",
      "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
      "scripts/smoke-salience-governor-implementation-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
      "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
      "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor implementation slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor implementation slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function salienceGovernorBrowserValidationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-salience-governor-browser-validation-v0-1.mjs");
}

function assertSalienceGovernorBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:salience-governor-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:salience-governor-browser-validation-v0-1"],
    "package.json must add only the Salience Governor browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles =   [
      "fixtures/research-candidate-review.salience-governor-browser-validation.sample.v0.1.json",
      "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
      "package.json",
      "docs/00_INDEX_LATEST.md",
      "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
      "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
      "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
  ];
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/salience-governor.ts"),
    "Salience Governor browser validation slice must not change the #719 builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    ),
    "Salience Governor browser validation slice must not change the #719 implementation fixture",
  );
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor browser validation slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor browser validation slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor browser validation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}
