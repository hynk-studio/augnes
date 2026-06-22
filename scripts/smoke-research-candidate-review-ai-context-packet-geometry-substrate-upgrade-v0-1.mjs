import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const packetTypePath = "types/research-candidate-ai-context-packet.ts";
const packetBuilderPath = "lib/research-candidate-review/ai-context-packet.ts";
const basePacketFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json";
const manualPacketFixturePath =
  "fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json";
const geometryDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json";
const manualGeometryDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json";
const substrateFixturePath = "fixtures/agent-perspective-substrate.sample.v0.1.json";
const substratePreviewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const formationReceiptFixturePath =
  "fixtures/research-candidate-review.formation-receipt.sample.v0.1.json";
const manualFormationReceiptFixturePath =
  "fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json";
const upgradedFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const basePacketSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const geometryDigestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const formationReceiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs";
const candidateToCodexHandoffDraftTypePath =
  "types/candidate-to-codex-handoff-draft.ts";
const candidateToCodexHandoffDraftBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-draft.ts";
const candidateToCodexHandoffDraftFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json";
const candidateToCodexHandoffDraftSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs";
const candidateToCodexHandoffDraftReviewTypePath =
  "types/candidate-to-codex-handoff-draft-review.ts";
const candidateToCodexHandoffDraftReviewBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts";
const candidateToCodexHandoffDraftReviewFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json";
const candidateToCodexHandoffDraftReviewSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs";
const candidateToCodexHandoffOperatorDecisionTypePath =
  "types/candidate-to-codex-handoff-operator-decision.ts";
const candidateToCodexHandoffOperatorDecisionBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts";
const candidateToCodexHandoffOperatorDecisionFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json";
const candidateToCodexHandoffOperatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
const routeContractTypePath = "types/feedback-event-write-route-contract.ts";
const routeContractBuilderPath =
  "lib/research-candidate-review/feedback-event-write-route-contract.ts";
const routeContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const routeContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const uiImplementationComponentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelComponentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const uiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const listRouteContractTypePath =
  "types/feedback-event-store-list-route-contract.ts";
const listRouteContractBuilderPath =
  "lib/research-candidate-review/feedback-event-store-list-route-contract.ts";
const listRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";

const packageScriptName =
  "smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1";
const packageScriptValue = `node ${smokePath}`;
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
const uiImplementationPackageScriptNames = [
  "smoke:feedback-event-controls-ui-implementation-v0-1",
];
const listRouteContractPackageScriptNames = [
  "smoke:feedback-event-store-list-route-contract-v0-1",
];
const listRouteImplementationPackageScriptNames = [
  "smoke:feedback-event-store-list-route-implementation-v0-1",
];
const listRouteBrowserValidationPackageScriptNames = [
  "smoke:feedback-event-store-list-route-browser-validation-v0-1",
];
const listUiContractPackageScriptNames = [
  "smoke:feedback-event-store-list-ui-contract-v0-1",
];
const nextRecommendedSlice =
  "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";
const downstreamCandidateToCodexHandoffDraftNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_review_v0_1";
const downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice =
  "candidate_to_codex_handoff_operator_decision_v0_1";
const downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice =
  "feedback_event_store_minimal_v0_1";
const routeContractNextRecommendedSlice =
  "feedback_event_write_route_implementation_v0_1";
const foldedAuditPanelAnchorId = "agent-perspective-substrate-folded-audit-panel";
const requiredForbiddenActions = [
  "do not treat packet as source of truth",
  "do not create proof/evidence",
  "do not mutate work",
  "do not promote Perspective",
  "do not call providers/OpenAI",
  "do not run retrieval/RAG",
  "do not fetch sources",
  "do not route/execute agents",
  "do not execute Codex",
  "do not create branch/PR",
  "do not send external handoff",
  "do not write DB",
  "do not allocate product IDs",
  "do not execute product write",
];
const expectedChangedFiles = [
  packetTypePath,
  packetBuilderPath,
  upgradedFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  basePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  formationReceiptSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamCandidateToCodexHandoffDraftChangedFiles = [
  candidateToCodexHandoffDraftTypePath,
  candidateToCodexHandoffDraftBuilderPath,
  candidateToCodexHandoffDraftFixturePath,
  candidateToCodexHandoffDraftSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  basePacketSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffDraftReviewChangedFiles = [
  candidateToCodexHandoffDraftReviewTypePath,
  candidateToCodexHandoffDraftReviewBuilderPath,
  candidateToCodexHandoffDraftReviewFixturePath,
  candidateToCodexHandoffDraftReviewSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  candidateToCodexHandoffDraftSmokePath,
  smokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  basePacketSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles = [
  candidateToCodexHandoffOperatorDecisionTypePath,
  candidateToCodexHandoffOperatorDecisionBuilderPath,
  candidateToCodexHandoffOperatorDecisionFixturePath,
  candidateToCodexHandoffOperatorDecisionSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  candidateToCodexHandoffDraftReviewSmokePath,
  candidateToCodexHandoffDraftSmokePath,
  smokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
];
const downstreamRouteContractRequiredChangedFiles = [
  routeContractTypePath,
  routeContractBuilderPath,
  routeContractFixturePath,
  routeContractSmokePath,
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  candidateToCodexHandoffOperatorDecisionSmokePath,
  candidateToCodexHandoffDraftReviewSmokePath,
  candidateToCodexHandoffDraftSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamRouteContractAllowedChangedFiles = [
  ...downstreamRouteContractRequiredChangedFiles,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];

for (const filePath of [
  packetTypePath,
  packetBuilderPath,
  basePacketFixturePath,
  manualPacketFixturePath,
  geometryDigestFixturePath,
  manualGeometryDigestFixturePath,
  substrateFixturePath,
  substratePreviewFixturePath,
  formationReceiptFixturePath,
  manualFormationReceiptFixturePath,
  upgradedFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  basePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  formationReceiptSmokePath,
  candidateToCodexHandoffDraftTypePath,
  candidateToCodexHandoffDraftBuilderPath,
  candidateToCodexHandoffDraftFixturePath,
  candidateToCodexHandoffDraftSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const packetType = readFileSync(packetTypePath, "utf8");
const packetBuilder = readFileSync(packetBuilderPath, "utf8");
const basePacketFixture = readJson(basePacketFixturePath);
const manualPacketFixture = readJson(manualPacketFixturePath);
const geometryDigestFixture = readJson(geometryDigestFixturePath);
const manualGeometryDigestFixture = readJson(manualGeometryDigestFixturePath);
const substrateFixture = readJson(substrateFixturePath);
const substratePreviewFixture = readJson(substratePreviewFixturePath);
const formationReceiptFixture = readJson(formationReceiptFixturePath);
const manualFormationReceiptFixture = readJson(manualFormationReceiptFixturePath);
const upgradedFixture = readJson(upgradedFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const basePacketSmoke = readFileSync(basePacketSmokePath, "utf8");
const foldedAuditPanelSmoke = readFileSync(foldedAuditPanelSmokePath, "utf8");
const previewBuilderSmoke = readFileSync(previewBuilderSmokePath, "utf8");
const substrateSmoke = readFileSync(substrateSmokePath, "utf8");
const geometryDigestSmoke = readFileSync(geometryDigestSmokePath, "utf8");
const formationReceiptSmoke = readFileSync(formationReceiptSmokePath, "utf8");

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertAdjacentSmokePointers();

const builderModule = await importBuilderModule();
const rebuiltPacket =
  builderModule.buildResearchCandidateAIContextPacketGeometrySubstrateUpgrade({
    baseAiContextPacket: basePacketFixture,
    manualBaseAiContextPacket: manualPacketFixture,
    perspectiveGeometryDigest: geometryDigestFixture,
    manualPerspectiveGeometryDigest: manualGeometryDigestFixture,
    agentPerspectiveSubstrate: substrateFixture,
    agentPerspectiveSubstratePreview: substratePreviewFixture,
    formationReceiptPreview: formationReceiptFixture,
    manualFormationReceiptPreview: manualFormationReceiptFixture,
    target_agent: "codex_implementation",
    mode: "geometry_substrate_advisory_preview",
    token_budget: 12000,
    as_of:
      "fixture:research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1",
    scope: "project:augnes",
  });
const rebuiltPacketAgain =
  builderModule.buildResearchCandidateAIContextPacketGeometrySubstrateUpgrade({
    baseAiContextPacket: basePacketFixture,
    manualBaseAiContextPacket: manualPacketFixture,
    perspectiveGeometryDigest: geometryDigestFixture,
    manualPerspectiveGeometryDigest: manualGeometryDigestFixture,
    agentPerspectiveSubstrate: substrateFixture,
    agentPerspectiveSubstratePreview: substratePreviewFixture,
    formationReceiptPreview: formationReceiptFixture,
    manualFormationReceiptPreview: manualFormationReceiptFixture,
    target_agent: "codex_implementation",
    mode: "geometry_substrate_advisory_preview",
    token_budget: 12000,
    as_of:
      "fixture:research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1",
    scope: "project:augnes",
  });

assert.deepEqual(
  rebuiltPacket,
  upgradedFixture,
  "rebuilt geometry/substrate packet must match committed fixture",
);
assert.equal(
  rebuiltPacket.packet_fingerprint,
  rebuiltPacketAgain.packet_fingerprint,
  "upgraded packet fingerprint must be stable across repeated builds",
);
assertUpgradedPacket(upgradedFixture);
assertManualLineage(upgradedFixture);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1",
      final_status: "pass",
      packet_fingerprint: upgradedFixture.packet_fingerprint,
      geometry_digest_ref_count:
        upgradedFixture.geometry_context.geometry_digest_refs.length,
      surfaced_card_count:
        upgradedFixture.folded_audit_context.surfacing_card_count,
      next_recommended_slice: upgradedFixture.next_recommended_slice,
      checked_no_execution_or_write_authority: true,
      checked_product_write_stopline_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "ResearchCandidateAIContextPacketGeometrySubstrateUpgrade",
    "ResearchCandidateAIContextPacketGeometrySubstrateUpgradeInput",
    "ResearchCandidateAIContextPacketGeometryContext",
    "ResearchCandidateAIContextPacketAgentSubstrateContext",
    "ResearchCandidateAIContextPacketFoldedAuditContext",
    "ResearchCandidateAIContextPacketTargetAgentContext",
    "ResearchCandidateAIContextPacketGeometrySubstrateAuthorityBoundary",
    "ResearchCandidateAIContextPacketGeometrySubstrateLineage",
  ]) {
    assert.match(
      packetType,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `packet type must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildResearchCandidateAIContextPacketGeometrySubstrateUpgrade",
    "validateResearchCandidateAIContextPacketGeometrySubstrateUpgrade",
    "createResearchCandidateAIContextPacketGeometrySubstrateUpgradeFingerprint",
  ]) {
    assert.match(
      packetBuilder,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `packet builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "chatgpt_design",
    "codex_implementation",
    "codex_review",
    "mcp_runtime",
    "cockpit_ui",
    "geometry_context",
    "agent_substrate_context",
    "folded_audit_context",
    "target_agent_context",
    "authority_boundary",
    "lineage",
    "manualBaseAiContextPacket",
    "manualFormationReceiptPreview",
    "ai_context_packet_base_refs",
    "manual_ai_context_packet_base_ref",
    "manual_research_candidate_review_refs",
    "manual_formation_receipt_refs",
    nextRecommendedSlice,
  ]) {
    assert.ok(packetType.includes(requiredText), `packet type must include ${requiredText}`);
    assert.ok(
      packetBuilder.includes(requiredText),
      `packet builder must include ${requiredText}`,
    );
  }
  for (const failureCode of [
    "lineage_missing",
    "lineage_ai_context_packet_base_refs_missing",
    "lineage_primary_packet_ref_missing",
    "lineage_manual_packet_ref_missing",
    "lineage_manual_research_candidate_review_refs_missing",
    "lineage_manual_formation_receipt_refs_missing",
  ]) {
    assert.ok(
      packetBuilder.includes(failureCode),
      `packet builder must validate ${failureCode}`,
    );
  }
  assert.doesNotMatch(
    packetBuilder,
    /^import\s+(?!type\b)/m,
    "packet builder must keep runtime imports out",
  );
}

function assertUpgradedPacket(packet) {
  assert.equal(packet.packet_version, "research_candidate_ai_context_packet.v0.1");
  assert.equal(
    packet.packet_upgrade_version,
    "research_candidate_ai_context_packet.geometry_substrate_upgrade.v0.1",
  );
  assert.match(packet.packet_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(packet.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(packet.validation.passed, true);
  assert.deepEqual(packet.validation.failure_codes, []);
  assert.equal(packet.next_recommended_slice, nextRecommendedSlice);

  for (const baseField of [
    "source_summaries",
    "claim_summaries",
    "evidence_summaries",
    "tension_summaries",
    "knowledge_gap_summaries",
    "perspective_delta_summaries",
    "follow_up_summaries",
    "target_perspective_summaries",
    "diagnostics",
    "final_guardrails",
    "authority",
  ]) {
    assert.ok(baseField in packet, `base packet field ${baseField} must remain`);
  }

  assert.ok(packet.geometry_context, "geometry_context exists");
  assert.ok(packet.agent_substrate_context, "agent_substrate_context exists");
  assert.ok(packet.folded_audit_context, "folded_audit_context exists");
  assert.ok(packet.target_agent_context, "target_agent_context exists");
  assert.ok(packet.lineage, "lineage exists");

  assert.equal(packet.geometry_context.layout_coordinates_consumed, false);
  assert.equal(packet.geometry_context.raw_layout_coordinates_exported, false);
  assert.equal(packet.geometry_context.geometry_digest_is_authority, false);
  assert.ok(packet.geometry_context.geometry_digest_refs.length >= 2);
  assert.ok(packet.geometry_context.dominant_clusters.length > 0);
  assert.ok(packet.geometry_context.bridge_nodes.length > 0);
  for (const expansion of packet.geometry_context.recommended_retrieval_expansion) {
    assert.equal(expansion.retrieval_executed_now, false);
  }
  assertNoCoordinateFields(packet);

  assert.equal(packet.agent_substrate_context.substrate_is_authority, false);
  assert.equal(packet.agent_substrate_context.preview_is_authority, false);
  assert.ok(packet.agent_substrate_context.surfaced_blockers.length > 0);
  assert.ok(packet.agent_substrate_context.surfaced_warnings.length > 0);
  assert.ok(packet.agent_substrate_context.retrieval_hints.length > 0);
  assert.ok(packet.agent_substrate_context.handoff_improvements.length > 0);
  assert.ok(packet.agent_substrate_context.product_write_stopline_reminders.length > 0);
  for (const card of surfacedItems(packet)) {
    assert.ok(
      hasSourceRefs(card) || Boolean(card.source_coverage_boundary_note),
      `${card.card_id} must have source refs or source coverage boundary note`,
    );
    assert.ok(card.epistemic_status, `${card.card_id} epistemic_status`);
    assert.ok(card.review_status, `${card.card_id} review_status`);
    assert.ok(card.why_now, `${card.card_id} why_now`);
    assert.ok(
      Array.isArray(card.authority_boundary_notes) &&
        card.authority_boundary_notes.length > 0,
      `${card.card_id} authority_boundary_notes`,
    );
    assert.equal(card.execution_authority, false, `${card.card_id} execution`);
    assert.equal(card.durable_write_authority, false, `${card.card_id} durable write`);
    assert.equal(card.route_action_available, false, `${card.card_id} route`);
    assert.equal(card.db_write_available, false, `${card.card_id} DB`);
    assert.equal(card.external_call_available, false, `${card.card_id} external`);
    assert.equal(card.agent_execution_available, false, `${card.card_id} agent`);
    assert.equal(card.product_write_available, false, `${card.card_id} product write`);
  }
  for (const card of packet.agent_substrate_context.retrieval_hints) {
    assert.ok(
      card.retrieval_executed_now === false ||
        card.retrieval_executed_now === undefined,
      `${card.card_id} retrieval execution`,
    );
  }

  assert.equal(packet.folded_audit_context.folded_panel_available, true);
  assert.equal(
    packet.folded_audit_context.folded_panel_anchor_id,
    foldedAuditPanelAnchorId,
  );
  assert.equal(packet.folded_audit_context.local_ui_state_only, true);
  assert.equal(
    packet.folded_audit_context.durable_feedback_persistence_available,
    false,
  );
  assert.equal(packet.folded_audit_context.route_or_api_available, false);

  assertAuthorityBoundary(packet.authority_boundary);
  for (const action of requiredForbiddenActions) {
    assert.ok(
      packet.target_agent_context.forbidden_actions.includes(action),
      `missing target-agent forbidden action ${action}`,
    );
  }
  assert.equal(
    packet.target_agent_context.target_agent,
    "codex_implementation",
  );
  assert.equal(
    packet.lineage.cockpit_folded_audit_panel_ref,
    `components/agent-perspective-substrate-folded-audit-panel.tsx#${foldedAuditPanelAnchorId}`,
  );
  assert.match(packet.lineage.product_write_stopline_ref, /pr:686/);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.preview_only, true);
  for (const forbiddenKey of [
    "source_of_truth",
    "creates_evidence",
    "creates_proof",
    "commits_state",
    "promotes_perspective",
    "creates_work_item",
    "mutates_runtime",
    "executes_agents",
    "sends_handoff",
    "calls_provider",
    "performs_retrieval",
    "proof_or_evidence_record",
    "durable_perspective_state",
    "retrieval_executed_now",
    "provider_called_now",
    "source_fetch_executed_now",
    "external_handoff_sent_now",
    "codex_execution_authorized_now",
    "agent_execution_authorized_now",
    "product_write_authorized_now",
    "product_write_available",
    "db_write_available",
    "route_or_ui_mutation_available",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function assertManualLineage(packet) {
  assert.equal(manualPacketFixture.packet_version, basePacketFixture.packet_version);
  assert.equal(
    manualGeometryDigestFixture.version,
    geometryDigestFixture.version,
    "manual geometry digest must share digest version",
  );
  assert.equal(
    manualFormationReceiptFixture.receipt_version,
    formationReceiptFixture.receipt_version,
    "manual formation receipt must share receipt version",
  );
  const basePacketRef = packetRef(basePacketFixture);
  const manualPacketRef = packetRef(manualPacketFixture);
  const manualFormationReceiptRef = formationReceiptRef(
    manualFormationReceiptFixture,
  );
  assert.ok(
    packet.lineage.ai_context_packet_base_refs.includes(basePacketRef),
    "lineage.ai_context_packet_base_refs must include base packet ref",
  );
  assert.ok(
    packet.lineage.ai_context_packet_base_refs.includes(manualPacketRef),
    "lineage.ai_context_packet_base_refs must include manual packet ref",
  );
  assert.equal(
    packet.lineage.manual_ai_context_packet_base_ref,
    manualPacketRef,
    "lineage.manual_ai_context_packet_base_ref must be populated",
  );
  assert.ok(
    packet.lineage.manual_research_candidate_review_refs.includes(
      manualPacketFixture.source_overlay.source_fixture_path,
    ),
    "manual research candidate refs must include manual source fixture",
  );
  assert.ok(
    packet.lineage.manual_research_candidate_review_refs.includes(
      manualPacketFixture.source_overlay.overlay_fixture_path,
    ),
    "manual research candidate refs must include manual overlay fixture",
  );
  assert.ok(
    packet.lineage.manual_formation_receipt_refs.includes(
      manualFormationReceiptRef,
    ),
    "manual formation receipt refs must include manual receipt ref",
  );
}

function assertPackageScript() {
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
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  assert.ok(
    [
      downstreamCandidateToCodexHandoffDraftPackageScriptNames,
      downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames,
      downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames,
      ["smoke:feedback-event-store-minimal-v0-1"],
      ["smoke:feedback-event-store-review-controls-preview-v0-1"],
      routeContractPackageScriptNames,
      ["smoke:feedback-event-write-route-implementation-v0-1"],
      ["smoke:feedback-event-write-route-browser-validation-v0-1"],
      ["smoke:feedback-event-controls-ui-contract-v0-1"],
      uiImplementationPackageScriptNames,
      ["smoke:feedback-event-controls-ui-browser-validation-v0-1"],
      listRouteContractPackageScriptNames,
      listRouteImplementationPackageScriptNames,
      listRouteBrowserValidationPackageScriptNames,
      listUiContractPackageScriptNames,
    ].some((allowedNames) => arraysEqual(addedScriptNames, [...allowedNames].sort())),
    "package additions must only include the downstream Candidate-to-Codex handoff draft/review/operator decision smoke script",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /dependencies|devDependencies|optionalDependencies/,
    "package dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (feedbackEventStoreListRouteBrowserValidationSliceActive(changedFiles)) return;
  if (feedbackEventStoreListRouteImplementationSliceActive(changedFiles)) return;
  if (feedbackEventStoreListRouteContractSliceActive(changedFiles)) {
    assertFeedbackEventStoreListRouteContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiImplementationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiContractSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteImplementationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles);
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
    : usesDownstreamCandidateToCodexHandoffDraftDelta
      ? downstreamCandidateToCodexHandoffDraftChangedFiles
      : expectedChangedFiles;
  for (const expectedFile of expectedFilesForDelta) {
    assert.ok(changedFiles.includes(expectedFile), `missing changed file ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventStoreListRouteContractSliceActive(changedFiles) {
  return [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
  ].every((filePath) => changedFiles.includes(filePath));
}

function feedbackEventStoreListRouteImplementationSliceActive(changedFiles) {
  return changedFiles.includes(
    "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  );
}

function feedbackEventStoreListRouteBrowserValidationSliceActive(changedFiles) {
  return changedFiles.includes(
    "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  );
}

function assertFeedbackEventStoreListRouteContractChangedFiles(changedFiles) {
  const allowedChangedFiles = [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream list route contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream list route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventControlsUiBrowserValidationSliceActive(changedFiles) {
  return feedbackEventControlsUiBrowserValidationChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiBrowserValidationChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventControlsUiBrowserValidationChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs") {
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
  }
}

function feedbackEventControlsUiBrowserValidationChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
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
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventControlsUiImplementationSliceActive(changedFiles) {
  return feedbackEventControlsUiImplementationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventControlsUiImplementationRequiredChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream UI implementation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      requiredChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    if (changedFile.startsWith("components/")) {
      assert.ok(
        [uiImplementationComponentPath, foldedAuditPanelComponentPath].includes(changedFile),
        `downstream UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventControlsUiImplementationRequiredChangedFiles() {
  return [
    uiImplementationComponentPath,
    foldedAuditPanelComponentPath,
    uiImplementationFixturePath,
    uiImplementationSmokePath,
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
  ];
}

function feedbackEventControlsUiContractSliceActive(changedFiles) {
  return feedbackEventControlsUiContractRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiContractChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventControlsUiContractRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventControlsUiContractAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream UI contract file: ${expectedFile}`,
    );
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
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventControlsUiContractRequiredChangedFiles() {
  return [
    "types/feedback-event-controls-ui-contract.ts",
    "lib/research-candidate-review/feedback-event-controls-ui-contract.ts",
    "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
  ];
}

function feedbackEventControlsUiContractAllowedChangedFiles() {
  return [
    ...feedbackEventControlsUiContractRequiredChangedFiles(),
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function feedbackEventStoreSliceActive(changedFiles) {
  return feedbackEventStoreChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
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
  return feedbackEventWriteRouteBrowserValidationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteBrowserValidationRequiredChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream browser validation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      requiredChangedFiles.includes(changedFile),
      `unexpected changed file in downstream browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteBrowserValidationRequiredChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
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
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
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
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    basePacketSmokePath,
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
function assertNoForbiddenImplementationPatterns() {
  const checkedSource = [
    packetType,
    packetBuilder,
    stripForbiddenPatternDefinitions(readFileSync(smokePath, "utf8")),
  ].join("\n");
  for (const { label, regex } of [
    pattern(["from ", "\"", "@/app"], "", "", "i"),
    pattern(["from ", "\"", "@/components"], "", "", "i"),
    pattern(["from ", "\"", "@/lib/db"], "", "", "i"),
    pattern(["from ", "\"", "openai"], "", "", "i"),
    pattern(["openDatabase"], "\\b", "\\s*\\("),
    pattern(["exec", "Sql"], "\\b", "\\s*\\(", "i"),
    pattern(["execute", "Sql"], "\\b", "\\s*\\(", "i"),
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
    pattern(["local", "Storage"], "\\b", "\\b"),
    pattern(["session", "Storage"], "\\b", "\\b"),
    pattern(["indexed", "DB"], "\\b", "\\b"),
    pattern(["document", ".cookie"], "\\b", "\\b"),
    pattern(["app", ".listen"], "\\b", "\\s*\\("),
    pattern(["next", " dev"], "\\b", "\\b", "i"),
    pattern(["execute", "Codex"], "\\b", "\\s*\\("),
    pattern(["create", "Pull", "Request"], "\\b", "\\s*\\("),
  ]) {
    assert.doesNotMatch(
      checkedSource,
      regex,
      `geometry/substrate upgrade source must not include ${label}`,
    );
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1",
    packetTypePath,
    packetBuilderPath,
    upgradedFixturePath,
    smokePath,
    packageScriptName,
    "PerspectiveGeometryDigest",
    "Agent Perspective Substrate",
    "Cockpit Agent Perspective Substrate folded audit panel v0.1",
    "no provider/OpenAI",
    "no source fetch",
    "no retrieval execution",
    "no Codex execution",
    "no external handoff sending",
    "no DB/proof/evidence/work/Perspective durable write",
    "no product write",
    "Manual-note AI Context Packet",
    "manual-note Formation Receipt",
    nextRecommendedSlice,
    "Candidate-to-Codex handoff draft Geometry/Substrate v0.1",
    candidateToCodexHandoffDraftTypePath,
    candidateToCodexHandoffDraftBuilderPath,
    candidateToCodexHandoffDraftFixturePath,
    candidateToCodexHandoffDraftSmokePath,
    downstreamCandidateToCodexHandoffDraftPackageScriptNames[0],
    downstreamCandidateToCodexHandoffDraftNextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /AI Context Packet compiler GeometryDigest\/Substrate upgrade v0\.1/);
    assert.match(doc, /manual-note AI Context\s+Packet/i);
    assert.match(doc, /manual-note Formation\s+Receipt/i);
    assert.match(doc, /non-authoritative|not source of truth/i);
    assert.match(doc, /no retrieval execution/i);
    assert.match(doc, /no agent/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no external handoff/i);
    assert.match(doc, /no DB|no DB\/SQL/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertAdjacentSmokePointers() {
  for (const [label, source] of [
    ["base AI context packet", basePacketSmoke],
    ["#690 folded audit panel", foldedAuditPanelSmoke],
    ["#689 preview builder", previewBuilderSmoke],
    ["#688 substrate", substrateSmoke],
    ["#687 geometry digest", geometryDigestSmoke],
    ["formation receipt", formationReceiptSmoke],
  ]) {
    assert.match(source, new RegExp(packageScriptName), `${label} smoke package pointer`);
    assert.match(source, new RegExp(nextRecommendedSlice), `${label} smoke next pointer`);
  }
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftPackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftNextRecommendedSlice),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice),
  );
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(packetBuilder, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function surfacedItems(packet) {
  const cards = [
    ...packet.agent_substrate_context.surfaced_blockers,
    ...packet.agent_substrate_context.surfaced_warnings,
    ...packet.agent_substrate_context.surfaced_notices,
    ...packet.agent_substrate_context.retrieval_hints,
    ...packet.agent_substrate_context.handoff_improvements,
    ...packet.agent_substrate_context.stale_context_notices,
    ...packet.agent_substrate_context.product_write_stopline_reminders,
  ];
  return [...new Map(cards.map((card) => [card.card_id, card])).values()];
}

function hasSourceRefs(card) {
  return Array.isArray(card.source_refs) && card.source_refs.length > 0;
}

function assertNoCoordinateFields(value) {
  const offenders = [];
  visit(value, [], (pathSegments) => {
    const key = pathSegments.at(-1);
    if (["x", "y", "fx", "fy", "position"].includes(key)) {
      offenders.push(pathSegments.join("."));
    }
  });
  assert.deepEqual(offenders, [], "upgraded AI packet must not export coordinate fields");
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

function packetRef(packet) {
  return `${packet.packet_version}:${packet.source_kind}:${packet.source_overlay.overlay_fixture_path}`;
}

function formationReceiptRef(receipt) {
  return `${receipt.receipt_version}:${receipt.source_kind}:${receipt.source_packet_fixture_path}`;
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function stripForbiddenPatternDefinitions(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("gh-pr-command"))
    .filter((line) => !line.includes("gh\\s+pr"))
    .filter((line) => !line.includes("gh pr"))
    .filter((line) => !line.includes("pattern(["))
    .join("\n");
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
