import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/perspective-geometry-digest.ts";
const builderPath = "lib/research-candidate-review/perspective-geometry-digest.ts";
const overlayFixturePath =
  "fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json";
const manualOverlayFixturePath =
  "fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json";
const digestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json";
const manualDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const smokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";

const packageScriptName =
  "smoke:research-candidate-review-perspective-geometry-digest-v0-1";
const downstreamAgentPerspectiveSubstratePackageScriptNames = [
  "smoke:agent-perspective-substrate-v0-1",
];
const downstreamAgentPerspectiveSubstratePreviewPackageScriptNames = [
  "smoke:agent-perspective-substrate-preview-builder-v0-1",
];
const downstreamAgentPerspectiveSubstrateFoldedAuditPanelPackageScriptNames = [
  "smoke:agent-perspective-substrate-folded-audit-panel-v0-1",
];
const downstreamAIContextPacketGeometrySubstrateUpgradePackageScriptNames = [
  "smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1",
];
const downstreamCandidateToCodexHandoffDraftPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1",
];
const downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
];
const downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1",
];
const routeContractPackageScriptNames = [
  "smoke:feedback-event-write-route-contract-v0-1",
];
const downstreamFeedbackEventControlsUiImplementationPackageScriptNames = [
  "smoke:feedback-event-controls-ui-implementation-v0-1",
];
const downstreamAgentPerspectiveSubstrateLabel =
  "Agent Perspective Substrate v0.1";
const downstreamAgentPerspectiveSubstrateFoldedAuditPanelLabel =
  "Cockpit Agent Perspective Substrate folded audit panel v0.1";
const downstreamAIContextPacketGeometrySubstrateUpgradeLabel =
  "AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1";
const downstreamCandidateToCodexHandoffDraftLabel =
  "Candidate-to-Codex handoff draft Geometry/Substrate v0.1";
const downstreamCandidateToCodexHandoffDraftReviewLabel =
  "Candidate-to-Codex handoff draft review v0.1";
const downstreamCandidateToCodexHandoffOperatorDecisionLabel =
  "Candidate-to-Codex handoff operator decision preview v0.1";
const nextRecommendedSlice =
  "agent_perspective_substrate_docs_type_fixture_v0_1";
const downstreamNextRecommendedSlice =
  "agent_perspective_substrate_preview_builder_v0_1";
const downstreamPreviewNextRecommendedSlice =
  "cockpit_agent_perspective_substrate_folded_audit_panel_v0_1";
const downstreamFoldedAuditPanelNextRecommendedSlice =
  "ai_context_packet_compiler_geometry_substrate_upgrade_v0_1";
const downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";
const downstreamCandidateToCodexHandoffDraftNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_review_v0_1";
const downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice =
  "candidate_to_codex_handoff_operator_decision_v0_1";
const downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice =
  "feedback_event_store_minimal_v0_1";
const routeContractNextRecommendedSlice =
  "feedback_event_write_route_implementation_v0_1";
const digestVersion = "perspective_geometry_digest.v0.1";
const digestMode = "research_candidate_overlay_digest";
const requiredDiagnosticFields = [
  "cluster_balance",
  "source_dominance",
  "manual_gravity_distribution",
  "stale_high_gravity_count",
  "bridge_node_count",
  "coverage_gap_count",
  "contradiction_pair_count",
  "unresolved_tension_count",
  "underrepresented_cluster_count",
  "dominant_cluster_count",
  "coordinates_used_for_truth",
  "coordinates_exported_to_ai_context",
  "digest_is_authority",
  "source_ref_coverage_ratio",
  "candidate_family_coverage",
];
const expectedChangedFiles = [
  typePath,
  builderPath,
  digestFixturePath,
  manualDigestFixturePath,
  smokePath,
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
];
const downstreamAgentPerspectiveSubstrateChangedFiles = [
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "types/agent-perspective-substrate.ts",
  "fixtures/agent-perspective-substrate.sample.v0.1.json",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
];
const downstreamAgentPerspectiveSubstratePreviewChangedFiles = [
  "types/agent-perspective-substrate-preview.ts",
  "lib/research-candidate-review/agent-perspective-substrate-preview.ts",
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
];
const downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles = [
  "components/agent-perspective-substrate-folded-audit-panel.tsx",
  "components/augnes-cockpit.tsx",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles = [
  "types/research-candidate-ai-context-packet.ts",
  "lib/research-candidate-review/ai-context-packet.ts",
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamCandidateToCodexHandoffDraftChangedFiles = [
  "types/candidate-to-codex-handoff-draft.ts",
  "lib/research-candidate-review/candidate-to-codex-handoff-draft.ts",
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
];
const downstreamRouteContractRequiredChangedFiles = [
  "types/feedback-event-write-route-contract.ts",
  "lib/research-candidate-review/feedback-event-write-route-contract.ts",
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
];
const downstreamRouteContractAllowedChangedFiles = [
  ...downstreamRouteContractRequiredChangedFiles,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamCandidateToCodexHandoffDraftReviewChangedFiles = [
  "types/candidate-to-codex-handoff-draft-review.ts",
  "lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts",
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
];
const downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles = [
  "types/candidate-to-codex-handoff-operator-decision.ts",
  "lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts",
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
];
const downstreamFeedbackEventControlsUiImplementationChangedFiles = [
  "components/feedback-event-controls.tsx",
  "components/agent-perspective-substrate-folded-audit-panel.tsx",
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
];

for (const filePath of [
  typePath,
  builderPath,
  overlayFixturePath,
  manualOverlayFixturePath,
  digestFixturePath,
  manualDigestFixturePath,
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const overlayFixture = readJson(overlayFixturePath);
const manualOverlayFixture = readJson(manualOverlayFixturePath);
const digestFixture = readJson(digestFixturePath);
const manualDigestFixture = readJson(manualDigestFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");

assertTypeContract();
assertBuilderSource();
assertPackageScript();
assertDocs();
assertStaticScope();
assertNoForbiddenBehaviorInNewFiles();

const builderModule = await importBuilderModule();
const rebuiltDigest = builderModule.buildPerspectiveGeometryDigest({
  candidateConstellationOverlay: overlayFixture,
  as_of: "fixture:research-candidate-review.constellation-overlay.sample.v0.1",
});
const rebuiltDigestAgain = builderModule.buildPerspectiveGeometryDigest({
  candidateConstellationOverlay: overlayFixture,
  as_of: "fixture:research-candidate-review.constellation-overlay.sample.v0.1",
});
const rebuiltManualDigest = builderModule.buildPerspectiveGeometryDigest({
  candidateConstellationOverlay: manualOverlayFixture,
  as_of:
    "fixture:research-candidate-review.manual-note-constellation-overlay.sample.v0.1",
});

assert.deepEqual(
  rebuiltDigest,
  digestFixture,
  "rebuilt static overlay digest must match committed fixture",
);
assert.deepEqual(
  rebuiltManualDigest,
  manualDigestFixture,
  "rebuilt manual parser overlay digest must match committed fixture",
);
assert.equal(
  rebuiltDigest.digest_fingerprint,
  rebuiltDigestAgain.digest_fingerprint,
  "digest fingerprint must be stable across repeated builds",
);

assertDigest(rebuiltDigest, overlayFixture, digestFixturePath);
assertDigest(rebuiltManualDigest, manualOverlayFixture, manualDigestFixturePath);
assertContradictionsPreserveTensions(rebuiltDigest, overlayFixture);
assertContradictionsPreserveTensions(rebuiltManualDigest, manualOverlayFixture);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-perspective-geometry-digest-v0-1",
      final_status: "pass",
      static_digest_fingerprint: rebuiltDigest.digest_fingerprint,
      manual_digest_fingerprint: rebuiltManualDigest.digest_fingerprint,
      static_node_count: rebuiltDigest.input_overlay_summary.node_count,
      manual_node_count: rebuiltManualDigest.input_overlay_summary.node_count,
      static_bridge_node_count: rebuiltDigest.bridge_nodes.length,
      manual_bridge_node_count: rebuiltManualDigest.bridge_nodes.length,
      next_recommended_slice: rebuiltDigest.next_recommended_slice,
      checked_no_coordinates_as_truth: true,
      checked_advisory_retrieval_only: true,
      checked_no_runtime_or_write_behavior: true,
    },
    null,
    2,
  ),
);

function assertTypeContract() {
  for (const exportName of [
    "PerspectiveGeometryDigest",
    "PerspectiveGeometryDigestInput",
    "PerspectiveClusterDigest",
    "PerspectiveGeometryNodeRef",
    "PerspectiveContradictionPair",
    "PerspectiveGeometryDiagnostics",
    "PerspectiveGeometryAuthorityBoundary",
    "PerspectiveGeometryDigestValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "source_of_truth: false",
    "can_commit_or_reject_state: false",
    "can_record_proof: false",
    "can_create_evidence: false",
    "can_update_work: false",
    "can_execute_agents: false",
    "can_call_external_services: false",
    "can_promote_perspective: false",
    "can_allocate_product_ids: false",
    "can_execute_product_write: false",
    "layout_coordinates_are_truth: false",
    "digest_is_advisory_only: true",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertBuilderSource() {
  for (const exportName of [
    "buildPerspectiveGeometryDigest",
    "validatePerspectiveGeometryDigest",
    "createPerspectiveGeometryDigestFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  const importLines = builderSource.match(/^import\s+.+$/gm) ?? [];
  assert.ok(importLines.length >= 1, "builder should import type contracts");
  for (const importLine of importLines) {
    assert.match(importLine, /^import type\b/, "builder imports must be type-only");
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must not import runtime modules",
  );
  assert.match(
    builderSource,
    /layout_coordinates_consumed:\s*false/,
    "builder must record no coordinate consumption",
  );
  assert.match(
    builderSource,
    /raw_layout_coordinates_exported:\s*false/,
    "builder must record no raw coordinate export",
  );
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts[packageScriptName],
    `node ${smokePath}`,
    "package script must point to digest smoke",
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
  const addedScriptNames = packageAddedLines.map(extractScriptName).filter(Boolean);
  assert.ok(
    [
      [packageScriptName],
      downstreamAgentPerspectiveSubstratePackageScriptNames,
      downstreamAgentPerspectiveSubstratePreviewPackageScriptNames,
      downstreamAgentPerspectiveSubstrateFoldedAuditPanelPackageScriptNames,
      downstreamAIContextPacketGeometrySubstrateUpgradePackageScriptNames,
      downstreamCandidateToCodexHandoffDraftPackageScriptNames,
      downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames,
      downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames,
      ["smoke:feedback-event-store-minimal-v0-1"],
      ["smoke:feedback-event-store-review-controls-preview-v0-1"],
      routeContractPackageScriptNames,
      ["smoke:feedback-event-write-route-implementation-v0-1"],
      ["smoke:feedback-event-write-route-browser-validation-v0-1"],
      ["smoke:feedback-event-controls-ui-contract-v0-1"],
      downstreamFeedbackEventControlsUiImplementationPackageScriptNames,
    ].some((allowedNames) => JSON.stringify(addedScriptNames) === JSON.stringify(allowedNames)),
    `package additions must only include digest or downstream substrate/preview/panel/AI-context-upgrade/handoff-draft/review/operator-decision smoke scripts: ${JSON.stringify(addedScriptNames)}`,
  );
}

function assertDocs() {
  for (const doc of [indexDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /PerspectiveGeometryDigest Builder v0\.1/);
    assert.match(doc, /advisory/i);
    assert.match(doc, /coordinates? as truth|coordinates-as-truth/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
    assert.match(doc, new RegExp(escapeRegExp(downstreamAgentPerspectiveSubstrateLabel)));
    assert.match(doc, new RegExp(downstreamNextRecommendedSlice));
    assert.match(doc, /Agent Perspective Substrate Preview Builder v0\.1/);
    assert.match(doc, new RegExp(downstreamPreviewNextRecommendedSlice));
    assert.match(doc, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
    assert.match(doc, new RegExp(downstreamFoldedAuditPanelNextRecommendedSlice));
    assert.match(
      doc,
      new RegExp(escapeRegExp(downstreamAIContextPacketGeometrySubstrateUpgradeLabel)),
    );
    assert.match(
      doc,
      new RegExp(downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice),
    );
    assert.match(
      doc,
      new RegExp(escapeRegExp(downstreamCandidateToCodexHandoffDraftLabel)),
    );
    assert.match(doc, new RegExp(downstreamCandidateToCodexHandoffDraftNextRecommendedSlice));
    assert.match(
      doc,
      new RegExp(escapeRegExp(downstreamCandidateToCodexHandoffDraftReviewLabel)),
    );
    assert.match(doc, new RegExp(downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice));
    assert.match(
      doc,
      new RegExp(escapeRegExp(downstreamCandidateToCodexHandoffOperatorDecisionLabel)),
    );
    assert.match(doc, new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice));
  }
  assert.match(indexDoc, new RegExp(escapeRegExp(digestFixturePath)));
  assert.match(indexDoc, new RegExp(escapeRegExp(manualDigestFixturePath)));
  assert.match(indexDoc, /Candidate Constellation Overlay/);
}

function assertStaticScope() {
  const changedFiles = readChangedFiles();
  if (feedbackEventControlsUiImplementationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiContractSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteImplementationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteContractSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreReviewControlsSliceActive(changedFiles)) {
    assertFeedbackEventStoreReviewControlsChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreSliceActive(changedFiles)) {
    assertFeedbackEventStoreChangedFiles(changedFiles);
    return;
  }
  const usesDownstreamSubstrateDelta =
    downstreamAgentPerspectiveSubstrateChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamPreviewDelta =
    downstreamAgentPerspectiveSubstratePreviewChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamPanelDelta =
    downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamAIContextUpgradeDelta =
    downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamCandidateToCodexHandoffDraftDelta =
    downstreamCandidateToCodexHandoffDraftChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamCandidateToCodexHandoffDraftReviewDelta =
    downstreamCandidateToCodexHandoffDraftReviewChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamCandidateToCodexHandoffOperatorDecisionDelta =
    downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const expectedFilesForDelta = usesDownstreamCandidateToCodexHandoffOperatorDecisionDelta
    ? downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles
    : usesDownstreamCandidateToCodexHandoffDraftReviewDelta
    ? downstreamCandidateToCodexHandoffDraftReviewChangedFiles
    : usesDownstreamSubstrateDelta
      ? downstreamAgentPerspectiveSubstrateChangedFiles
      : usesDownstreamPreviewDelta
        ? downstreamAgentPerspectiveSubstratePreviewChangedFiles
        : usesDownstreamPanelDelta
          ? downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles
          : usesDownstreamAIContextUpgradeDelta
            ? downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles
            : usesDownstreamCandidateToCodexHandoffDraftDelta
      ? downstreamCandidateToCodexHandoffDraftChangedFiles
    : expectedChangedFiles;
  const allowedDownstreamPanelComponentFiles = new Set([
    "components/agent-perspective-substrate-folded-audit-panel.tsx",
    "components/augnes-cockpit.tsx",
  ]);
  for (const expectedFile of expectedFilesForDelta) {
    assert.ok(changedFiles.includes(expectedFile), `missing changed file ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    if (
      (!usesDownstreamPanelDelta && !usesDownstreamAIContextUpgradeDelta) ||
      !allowedDownstreamPanelComponentFiles.has(changedFile)
    ) {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventControlsUiImplementationSliceActive(changedFiles) {
  return downstreamFeedbackEventControlsUiImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles) {
  for (const expectedFile of downstreamFeedbackEventControlsUiImplementationChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `missing changed file ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      downstreamFeedbackEventControlsUiImplementationChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    if (changedFile.startsWith("components/")) {
      assert.ok(
        [
          "components/feedback-event-controls.tsx",
          "components/agent-perspective-substrate-folded-audit-panel.tsx",
        ].includes(changedFile),
        `downstream UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventStoreSliceActive(changedFiles) {
  return feedbackEventStoreChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventControlsUiContractSliceActive(changedFiles) {
  return feedbackEventControlsUiContractChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiContractChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventControlsUiContractChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventControlsUiContractChangedFiles() {
  return [
    "types/feedback-event-controls-ui-contract.ts",
    "lib/research-candidate-review/feedback-event-controls-ui-contract.ts",
    "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    smokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventStoreReviewControlsSliceActive(changedFiles) {
  return feedbackEventStoreReviewControlsRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventWriteRouteImplementationSliceActive(changedFiles) {
  return feedbackEventWriteRouteImplementationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles) {
  return feedbackEventWriteRouteBrowserValidationChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventWriteRouteBrowserValidationChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream browser validation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteBrowserValidationChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteImplementationRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventWriteRouteImplementationAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route implementation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route implementation slice: ${changedFile}`,
    );
    if (changedFile !== "app/api/research-candidate/feedback-events/route.ts") {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must only add feedback route file");
    }
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteImplementationRequiredChangedFiles() {
  return [
    "app/api/research-candidate/feedback-events/route.ts",
    "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
  ];
}

function feedbackEventWriteRouteImplementationAllowedChangedFiles() {
  return [
    ...feedbackEventWriteRouteImplementationRequiredChangedFiles(),
    "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
    "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
    "scripts/smoke-research-candidate-review-types-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function feedbackEventWriteRouteContractSliceActive(changedFiles) {
  return downstreamRouteContractRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteContractChangedFiles(changedFiles) {
  for (const expectedFile of downstreamRouteContractRequiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      downstreamRouteContractAllowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function assertFeedbackEventStoreReviewControlsChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventStoreReviewControlsRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventStoreReviewControlsAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream review controls file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream review controls slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventStoreReviewControlsRequiredChangedFiles() {
  return [
    "types/feedback-event-store-review-controls-preview.ts",
    "lib/research-candidate-review/feedback-event-store-review-controls-preview.ts",
    "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventStoreReviewControlsAllowedChangedFiles() {
  return [
    ...feedbackEventStoreReviewControlsRequiredChangedFiles(),
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function assertFeedbackEventStoreChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventStoreChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream feedback event store file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream feedback event store slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "lib/db/schema.sql") {
      assert.doesNotMatch(changedFile, /^lib\/db(?:\.ts|\/)/, "must not change lib/db files");
      assert.doesNotMatch(changedFile, /schema\.sql$/, "must not change schema.sql");
      assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|sql)\b/i, "must not change schema/migration/sql paths");
    }
  }
}

function feedbackEventStoreChangedFiles() {
  return [
    "types/feedback-event-store.ts",
    "lib/research-candidate-review/feedback-event-store.ts",
    "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "lib/db/schema.sql",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}
function assertNoForbiddenBehaviorInNewFiles() {
  const coreSource = [typeSource, builderSource].join("\n");
  const smokeCheckedSource = smokeSource;
  for (const { label, regex } of [
    pattern(["node", ":fs"]),
    pattern(["node", ":http"]),
    pattern(["node", ":https"]),
    pattern(["child", "_process"]),
  ]) {
    assert.doesNotMatch(coreSource, regex, `digest type/builder must not include ${label}`);
  }
  for (const { label, regex } of [
    pattern(["openDatabase"], "\\b", "\\s*\\("),
    pattern(["exec", "Sql"], "\\b", "\\s*\\(", "i"),
    pattern(["begin", "Transaction"], "\\b", "\\b", "i"),
    pattern(["commit", "Transaction"], "\\b", "\\b", "i"),
    pattern(["rollback", "Transaction"], "\\b", "\\b", "i"),
    pattern(["fet", "ch"], "\\b", "\\s*\\("),
    pattern(["new", " OpenAI"], "\\b", "\\s*\\("),
    pattern(["provider", "Client"], "\\b", "\\b"),
    pattern(["retrieval", "Client"], "\\b", "\\b"),
    pattern(["rag", "Client"], "\\b", "\\b"),
    pattern(["source", "Fetch"], "\\b", "\\b"),
    pattern(["external", "Handoff"], "\\b", "\\b"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["DROP", " TABLE"], "\\b", "\\b", "i"),
    pattern(["DELETE", " FROM"], "\\b", "\\b", "i"),
    pattern(["local", "Storage"], "\\b", "\\b"),
    pattern(["session", "Storage"], "\\b", "\\b"),
    pattern(["indexed", "DB"], "\\b", "\\b"),
    pattern(["document", ".cookie"], "\\b", "\\b"),
    pattern(["next", " dev"], "\\b", "\\b", "i"),
  ]) {
    assert.doesNotMatch(
      `${coreSource}\n${smokeCheckedSource}`,
      regex,
      `new digest files must not include ${label}`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /can_execute_product_write:\s*true|can_allocate_product_ids:\s*true/,
    "builder must not grant product write authority",
  );
}

function assertDigest(digest, overlay, label) {
  assert.equal(digest.version, digestVersion, `${label} version`);
  assert.match(digest.digest_fingerprint, /^fnv1a32:[0-9a-f]{8}$/, `${label} fingerprint`);
  assert.equal(digest.scope, overlay.scope, `${label} scope`);
  assert.ok(digest.as_of.startsWith("fixture:"), `${label} as_of`);
  assert.equal(digest.digest_mode, digestMode, `${label} digest mode`);
  assert.equal(
    digest.input_overlay_summary.overlay_version,
    overlay.overlay_version,
    `${label} overlay version`,
  );
  assert.equal(
    digest.input_overlay_summary.node_count,
    overlay.nodes.length,
    `${label} node count`,
  );
  assert.equal(
    digest.input_overlay_summary.edge_count,
    overlay.edges.length,
    `${label} edge count`,
  );
  assert.equal(
    digest.input_overlay_summary.source_ref_count,
    collectSourceRefs(overlay).length,
    `${label} source ref count`,
  );
  assert.deepEqual(
    digest.input_overlay_summary.node_kind_counts,
    countBy(overlay.nodes, (node) => node.kind),
    `${label} node kind counts`,
  );
  assert.deepEqual(
    digest.input_overlay_summary.edge_kind_counts,
    countBy(overlay.edges, (edge) => edge.relation),
    `${label} edge kind counts`,
  );
  assert.equal(digest.input_overlay_summary.layout_coordinates_consumed, false);
  assert.equal(digest.input_overlay_summary.raw_layout_coordinates_exported, false);
  assert.ok(digest.dominant_clusters.length > 0, `${label} dominant clusters`);
  assert.ok(
    Array.isArray(digest.underrepresented_clusters),
    `${label} underrepresented clusters`,
  );
  for (const field of requiredDiagnosticFields) {
    assert.ok(field in digest.diagnostics, `${label} missing diagnostic ${field}`);
  }
  for (const field of [
    "cluster_balance",
    "source_dominance",
    "stale_high_gravity_count",
    "bridge_node_count",
    "coverage_gap_count",
    "contradiction_pair_count",
    "unresolved_tension_count",
    "underrepresented_cluster_count",
    "dominant_cluster_count",
    "source_ref_coverage_ratio",
  ]) {
    assert.equal(typeof digest.diagnostics[field], "number", `${label} ${field} numeric`);
  }
  assert.equal(digest.diagnostics.coordinates_used_for_truth, false);
  assert.equal(digest.diagnostics.coordinates_exported_to_ai_context, false);
  assert.equal(digest.diagnostics.digest_is_authority, false);
  assert.deepEqual(
    digest.bridge_nodes,
    digest.bridge_nodes
      .slice()
      .sort((a, b) => b.degree - a.degree || a.node_id.localeCompare(b.node_id)),
    `${label} bridge nodes deterministic order`,
  );
  for (const expansion of digest.recommended_retrieval_expansion) {
    assert.equal(expansion.retrieval_executed_now, false, `${label} advisory retrieval`);
    assert.ok(expansion.reason, `${label} retrieval expansion reason`);
  }
  assertAuthorityBoundary(digest.authority_boundary, label);
  assertNoCoordinateFields(digest, label);
  assertNoProductWriteAuthority(digest, label);
  assert.equal(digest.validation.passed, true, `${label} validation`);
  assert.deepEqual(digest.validation.failure_codes, [], `${label} failure codes`);
  assert.equal(digest.next_recommended_slice, nextRecommendedSlice, `${label} next`);
}

function assertContradictionsPreserveTensions(digest, overlay) {
  const tensionEdgeCount = overlay.edges.filter((edge) =>
    /^tension_relates_to_/.test(edge.relation),
  ).length;
  if (tensionEdgeCount === 0) return;
  assert.ok(digest.contradiction_pairs.length > 0, "tension edges should produce contradiction pairs");
  for (const pair of digest.contradiction_pairs) {
    assert.ok(pair.related_tension_node_ids.length > 0, "pair must keep tension node refs");
    assert.ok(pair.source_refs.length > 0, "pair must keep source refs");
    assert.equal(typeof pair.reason, "string");
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.derived_view_only, true, `${label} derived`);
  assert.equal(boundary.source_of_truth, false, `${label} truth`);
  assert.equal(boundary.can_commit_or_reject_state, false, `${label} state`);
  assert.equal(boundary.can_record_proof, false, `${label} proof`);
  assert.equal(boundary.can_create_evidence, false, `${label} evidence`);
  assert.equal(boundary.can_update_work, false, `${label} work`);
  assert.equal(boundary.can_execute_agents, false, `${label} agents`);
  assert.equal(boundary.can_call_external_services, false, `${label} external`);
  assert.equal(boundary.can_promote_perspective, false, `${label} promote`);
  assert.equal(boundary.can_allocate_product_ids, false, `${label} product IDs`);
  assert.equal(boundary.can_execute_product_write, false, `${label} product write`);
  assert.equal(boundary.layout_coordinates_are_truth, false, `${label} coordinates`);
  assert.equal(boundary.digest_is_advisory_only, true, `${label} advisory`);
}

function assertNoCoordinateFields(value, label) {
  const offenders = [];
  visit(value, [], (pathSegments) => {
    const key = pathSegments.at(-1);
    if (["x", "y", "fx", "fy", "position"].includes(key)) {
      offenders.push(pathSegments.join("."));
    }
  });
  assert.deepEqual(offenders, [], `${label} must not export coordinate fields`);
}

function assertNoProductWriteAuthority(value, label) {
  const offenders = [];
  visit(value, [], (pathSegments, nestedValue) => {
    const key = String(pathSegments.at(-1) ?? "").toLowerCase();
    if (nestedValue === true && /(product_write|product_id|allocate_product)/.test(key)) {
      offenders.push(pathSegments.join("."));
    }
  });
  assert.deepEqual(offenders, [], `${label} must not grant product write authority`);
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function collectSourceRefs(overlay) {
  const ids = new Set();
  for (const item of [...overlay.nodes, ...overlay.edges]) {
    for (const sourceRef of item.source_refs ?? []) {
      if (sourceRef.source_ref_id) ids.add(sourceRef.source_ref_id);
    }
  }
  return [...ids].sort();
}

function countBy(values, getKey) {
  const counts = {};
  for (const value of values) {
    const key = getKey(value) || "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function visit(value, pathSegments, callback) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, [...pathSegments, String(index)], callback));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = [...pathSegments, key];
    callback(nextPath, nestedValue);
    visit(nestedValue, nextPath, callback);
  }
}

function readChangedFiles() {
  const baseRef = mergeBaseRef();
  return [
    ...readGitOutput(["diff", "--name-only", baseRef, "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "origin/main", "HEAD"]).trim() || "origin/main";
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
}
