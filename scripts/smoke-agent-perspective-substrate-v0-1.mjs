import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const typePath = "types/agent-perspective-substrate.ts";
const fixturePath = "fixtures/agent-perspective-substrate.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const digestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const aiContextSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const formationReceiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
const smokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";

const packageScriptName = "smoke:agent-perspective-substrate-v0-1";
const packageScriptValue = `node ${smokePath}`;
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
const substrateVersion = "agent_perspective_substrate.v0.1";
const nextRecommendedSlice =
  "agent_perspective_substrate_preview_builder_v0_1";
const downstreamNextRecommendedSlice =
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
const sourceCoverageBoundaryPattern = /source coverage boundary note/i;

const requiredTypeExports = [
  "AgentPerspectiveSubstrateSnapshot",
  "AgentPerspectiveSubstrateInput",
  "AgentPerspectiveSourceSnapshotRef",
  "AgentPerspectiveNode",
  "AgentPerspectiveEdge",
  "AgentPerspectiveRuleFire",
  "AgentPerspectiveSurfacingCandidate",
  "AgentPerspectiveAuthorityBoundary",
  "AgentPerspectiveDiagnostics",
  "AgentPerspectiveValidationResult",
  "AgentPerspectiveSubstrateRuleName",
  "AgentPerspectiveSurfacingType",
];
const requiredNodeKinds = [
  "geometry_cluster",
  "bridge_node",
  "unresolved_tension",
  "knowledge_gap",
  "perspective_delta",
  "handoff_constraint",
  "stale_context",
  "source_ref",
  "retrieval_hint",
  "product_write_stopline",
];
const requiredEdgeKinds = [
  "derived_from",
  "warns_about",
  "connects_to",
  "qualifies",
  "preserves_tension",
  "blocks_promotion",
  "suggests_handoff_improvement",
  "references_stopline",
];
const requiredRuleNames = [
  "source_refs_missing_blocks_grounded_claim",
  "evidence_missing_blocks_perspective_delta_promotion",
  "unresolved_tension_missing_from_handoff_warns",
  "local_constraint_globalized_warns_scope_overreach",
  "forbidden_action_missing_from_handoff_warns",
  "repeated_dismissed_warning_without_new_source_downgrades",
  "stale_high_gravity_node_warns_context_distortion",
  "retrieval_hint_without_execution_only",
  "coordinates_as_truth_forbidden",
  "product_write_lane_parked",
];
const expectedChangedFiles = [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamAgentPerspectiveSubstratePreviewChangedFiles = [
  "types/agent-perspective-substrate-preview.ts",
  "lib/research-candidate-review/agent-perspective-substrate-preview.ts",
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  packagePath,
  indexPath,
  docsPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles = [
  "components/agent-perspective-substrate-folded-audit-panel.tsx",
  "components/augnes-cockpit.tsx",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  packagePath,
  indexPath,
  docsPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  smokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles = [
  "types/research-candidate-ai-context-packet.ts",
  "lib/research-candidate-review/ai-context-packet.ts",
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  packagePath,
  indexPath,
  docsPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  smokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamCandidateToCodexHandoffDraftChangedFiles = [
  "types/candidate-to-codex-handoff-draft.ts",
  "lib/research-candidate-review/candidate-to-codex-handoff-draft.ts",
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  packagePath,
  indexPath,
  docsPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  smokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffDraftReviewChangedFiles = [
  "types/candidate-to-codex-handoff-draft-review.ts",
  "lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts",
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  packagePath,
  indexPath,
  docsPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  smokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles = [
  "types/candidate-to-codex-handoff-operator-decision.ts",
  "lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts",
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  packagePath,
  indexPath,
  docsPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  smokePath,
  digestSmokePath,
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
];

for (const filePath of [
  docsPath,
  typePath,
  fixturePath,
  packagePath,
  indexPath,
  surfaceDocPath,
  gateDocPath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = readFileSync(docsPath, "utf8");
const typeSource = readFileSync(typePath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const digestSmoke = readFileSync(digestSmokePath, "utf8");
const aiContextSmoke = readFileSync(aiContextSmokePath, "utf8");
const formationReceiptSmoke = readFileSync(formationReceiptSmokePath, "utf8");

assertDocs();
assertTypeExports();
assertFixtureShape();
assertSourceDiscipline();
assertAuthorityBoundary();
assertDiagnostics();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertAdjacentPointers();

console.log(
  JSON.stringify(
    {
      smoke: "agent-perspective-substrate-v0-1",
      final_status: "pass",
      substrate_version: fixture.substrate_version,
      node_count: fixture.nodes.length,
      edge_count: fixture.edges.length,
      rule_fire_count: fixture.rules_fired.length,
      surfacing_candidate_count: fixture.surfacing_candidates.length,
      next_recommended_slice: fixture.next_recommended_slice,
      checked_advisory_only_boundary: true,
      checked_no_runtime_route_db_provider_retrieval_agent_or_product_write:
        true,
    },
    null,
    2,
  ),
);

function assertDocs() {
  for (const requiredText of [
    "docs/type/fixture/smoke only",
    "advisory-only",
    "non-SSOT",
    "non-authoritative",
    "no runtime behavior",
    "no DB/API/provider/",
    "no proof/evidence creation",
    "no Perspective promotion",
    "no work mutation",
    "no agent execution or routing",
    "no product write",
    "AI-native folded advisory projection",
    "PerspectiveGeometryDigest",
    "Candidate Constellation Overlay",
    "AI Context Packet previews",
    "Formation Receipt previews",
    "never source of truth",
    nextRecommendedSlice,
  ]) {
    assert.ok(docs.includes(requiredText), `docs must include ${requiredText}`);
  }
  for (const allowedCapability of [
    "retrieve references conceptually",
    "rank advisory surfacing candidates",
    "compress derived context",
    "warn about unresolved tensions",
    "compare candidate structures",
    "suggest handoff improvements",
    "prepare capsule/handoff context previews",
    "improve future AI context packet selection",
    "identify stale or risky context",
  ]) {
    assert.ok(
      docs.includes(allowedCapability),
      `docs must list allowed capability ${allowedCapability}`,
    );
  }
  for (const forbiddenCapability of [
    "commit or reject state",
    "create proof",
    "create evidence",
    "mutate work",
    "create work items",
    "call external services",
    "route agents",
    "execute agents",
    "call providers/OpenAI",
    "run retrieval/RAG",
    "fetch sources",
    "write DB",
    "update Perspective state",
    "promote candidates",
    "allocate product IDs",
    "execute product write",
  ]) {
    assert.ok(
      docs.includes(forbiddenCapability),
      `docs must list forbidden capability ${forbiddenCapability}`,
    );
  }
  for (const ruleName of requiredRuleNames) {
    assert.ok(docs.includes(ruleName), `docs must define rule ${ruleName}`);
  }
  assert.match(docs, /#687 added PerspectiveGeometryDigest Builder v0\.1/);
  assert.match(docs, /Product-write lane is parked|parked the product-write/i);
}

function assertTypeExports() {
  for (const exportName of requiredTypeExports) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "epistemic_status: string",
    "review_status: string",
    "can_commit_or_reject_state: false",
    "can_record_proof: false",
    "can_create_evidence: false",
    "can_update_work: false",
    "can_create_work_item: false",
    "can_execute_agents: false",
    "can_route_agents: false",
    "can_call_external_services: false",
    "can_call_providers_or_openai: false",
    "can_run_retrieval_or_rag: false",
    "can_fetch_sources: false",
    "can_promote_perspective: false",
    "can_allocate_product_ids: false",
    "can_execute_product_write: false",
    "can_open_db: false",
    "can_execute_sql: false",
    "can_execute_transaction: false",
    "advisory_only: true",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
  assert.match(
    typeSource,
    /export interface AgentPerspectiveSurfacingCandidate \{[\s\S]*epistemic_status: string;[\s\S]*review_status: string;/,
    "surfacing candidate type must carry direct epistemic_status and review_status",
  );
}

function assertFixtureShape() {
  assert.equal(fixture.runtime, "augnes");
  assert.equal(fixture.substrate_version, substrateVersion);
  assert.equal(fixture.scope, "project:augnes");
  assert.ok(fixture.as_of.startsWith("fixture:"), "fixture as_of must be deterministic");
  assert.equal(fixture.next_recommended_slice, nextRecommendedSlice);
  assert.equal(fixture.validation?.passed, true, "fixture validation must pass");
  assert.deepEqual(fixture.validation?.failure_codes, [], "fixture validation codes");

  assert.equal(typeof fixture.source_snapshot_ref?.snapshot_version, "string");
  assert.equal(typeof fixture.source_snapshot_ref?.scope, "string");
  assert.equal(typeof fixture.source_snapshot_ref?.as_of, "string");
  assert.ok(
    Array.isArray(fixture.source_snapshot_ref?.source_refs) &&
      fixture.source_snapshot_ref.source_refs.length > 0,
    "source snapshot refs must be present",
  );
  for (const sourceKey of [
    "perspective_geometry_digest_refs",
    "research_candidate_review_refs",
    "constellation_overlay_refs",
    "ai_context_packet_refs",
    "formation_receipt_refs",
  ]) {
    assert.ok(
      Array.isArray(fixture.source_inputs?.[sourceKey]) &&
        fixture.source_inputs[sourceKey].length > 0,
      `source_inputs.${sourceKey} must be populated`,
    );
  }
  for (const requiredRef of [
    "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json",
    "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json",
  ]) {
    assert.ok(
      fixture.source_inputs.perspective_geometry_digest_refs.includes(requiredRef),
      `fixture must reference ${requiredRef}`,
    );
  }

  assert.ok(fixture.nodes.length >= 8, "fixture must include at least 8 nodes");
  assert.ok(fixture.edges.length >= 8, "fixture must include at least 8 edges");
  assert.ok(fixture.rules_fired.length >= 7, "fixture must include at least 7 rule fires");
  assert.ok(
    fixture.surfacing_candidates.length >= 6,
    "fixture must include at least 6 surfacing candidates",
  );
  const nodeKinds = new Set(fixture.nodes.map((node) => node.node_kind));
  for (const nodeKind of requiredNodeKinds) {
    assert.ok(nodeKinds.has(nodeKind), `fixture must include node kind ${nodeKind}`);
  }
  const edgeKinds = new Set(fixture.edges.map((edge) => edge.edge_kind));
  for (const edgeKind of requiredEdgeKinds) {
    assert.ok(edgeKinds.has(edgeKind), `fixture must include edge kind ${edgeKind}`);
  }
  const ruleNames = new Set(fixture.rules_fired.map((rule) => rule.rule_name));
  for (const ruleName of requiredRuleNames) {
    assert.ok(ruleNames.has(ruleName), `fixture must include rule ${ruleName}`);
  }

  assert.ok(
    fixture.surfacing_candidates.some(
      (candidate) => candidate.surface_type === "unresolved_tension_warning",
    ),
    "fixture must include unresolved tension warning candidate",
  );
  assert.ok(
    fixture.surfacing_candidates.some(
      (candidate) => candidate.surface_type === "grounded_claim_boundary_blocker",
    ),
    "fixture must include missing source refs blocker candidate",
  );
  assert.ok(
    fixture.surfacing_candidates.some(
      (candidate) => candidate.surface_type === "handoff_improvement_suggestion",
    ),
    "fixture must include handoff improvement suggestion candidate",
  );
  assert.ok(
    fixture.surfacing_candidates.some(
      (candidate) => candidate.surface_type === "stale_context_notice",
    ),
    "fixture must include stale context notice candidate",
  );
  const retrievalCandidate = fixture.surfacing_candidates.find(
    (candidate) => candidate.surface_type === "retrieval_hint",
  );
  assert.ok(retrievalCandidate, "fixture must include retrieval hint candidate");
  assert.ok(
    retrievalCandidate.retrieval_executed_now === false ||
      retrievalCandidate.retrieval_executed_now === undefined,
    "retrieval hint candidate must not execute retrieval",
  );
  assert.ok(
    fixture.surfacing_candidates.some(
      (candidate) => candidate.surface_type === "product_write_stopline_reminder",
    ),
    "fixture must include product write stopline reminder candidate",
  );
}

function assertSourceDiscipline() {
  for (const candidate of fixture.surfacing_candidates) {
    assert.ok(candidate.why_now, `${candidate.surfacing_candidate_id} must include why_now`);
    assert.equal(
      typeof candidate.epistemic_status,
      "string",
      `${candidate.surfacing_candidate_id} epistemic_status type`,
    );
    assert.ok(
      candidate.epistemic_status.trim().length > 0,
      `${candidate.surfacing_candidate_id} must include epistemic_status`,
    );
    assert.equal(
      typeof candidate.review_status,
      "string",
      `${candidate.surfacing_candidate_id} review_status type`,
    );
    assert.ok(
      candidate.review_status.trim().length > 0,
      `${candidate.surfacing_candidate_id} must include review_status`,
    );
    assert.ok(
      Array.isArray(candidate.authority_boundary_notes) &&
        candidate.authority_boundary_notes.length > 0,
      `${candidate.surfacing_candidate_id} must include authority boundary notes`,
    );
    assert.equal(
      candidate.execution_authority,
      false,
      `${candidate.surfacing_candidate_id} execution authority`,
    );
    assert.equal(
      candidate.durable_write_authority,
      false,
      `${candidate.surfacing_candidate_id} durable write authority`,
    );
    assert.ok(
      hasSourceRefs(candidate) || hasSourceCoverageBoundaryNote(candidate),
      `${candidate.surfacing_candidate_id} must include source refs or explicit boundary note`,
    );
  }
}

function assertAuthorityBoundary() {
  const boundary = fixture.authority_boundaries;
  assert.equal(boundary.derived_view_only, true);
  assert.equal(boundary.source_of_truth, false);
  for (const forbiddenKey of [
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
  assert.equal(boundary.advisory_only, true);
}

function assertDiagnostics() {
  for (const key of [
    "graph_density",
    "unresolved_high_impact_tension_count",
    "stale_belief_count",
    "source_ref_coverage_ratio",
    "invalidated_belief_reuse_count",
    "surfacing_candidate_count",
    "blocker_count",
    "warning_count",
    "source_refs_missing_count",
  ]) {
    assert.equal(typeof fixture.diagnostics[key], "number", `${key} must be numeric`);
    assert.ok(Number.isFinite(fixture.diagnostics[key]), `${key} must be finite`);
  }
  assert.equal(fixture.diagnostics.product_write_stopline_respected, true);
  assert.equal(fixture.diagnostics.geometry_digest_consumed_as_advisory, true);
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
  const addedScriptNames = packageAddedLines.map(extractScriptName).filter(Boolean);
  assert.ok(
    [
      [packageScriptName],
      downstreamAgentPerspectiveSubstratePreviewPackageScriptNames,
      downstreamAgentPerspectiveSubstrateFoldedAuditPanelPackageScriptNames,
      downstreamAIContextPacketGeometrySubstrateUpgradePackageScriptNames,
      downstreamCandidateToCodexHandoffDraftPackageScriptNames,
      downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames,
      downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames,
      ["smoke:feedback-event-store-minimal-v0-1"],
      ["smoke:feedback-event-store-review-controls-preview-v0-1"],
      ["smoke:feedback-event-write-route-contract-v0-1"],
      ["smoke:feedback-event-write-route-implementation-v0-1"],
      ["smoke:feedback-event-write-route-browser-validation-v0-1"],
    ].some((scriptNames) => JSON.stringify(addedScriptNames) === JSON.stringify(scriptNames)),
    `package additions must only include substrate or downstream preview/panel/AI-context-upgrade/handoff-draft/review/operator-decision smoke scripts: ${JSON.stringify(addedScriptNames)}`,
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /dependencies|devDependencies|optionalDependencies/,
    "package dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
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
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
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
    digestSmokePath,
    aiContextSmokePath,
    "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
    "scripts/smoke-research-candidate-review-types-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function feedbackEventWriteRouteContractSliceActive(changedFiles) {
  return feedbackEventWriteRouteContractRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteContractChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteContractRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventWriteRouteContractAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventWriteRouteContractRequiredChangedFiles() {
  return [
    "types/feedback-event-write-route-contract.ts",
    "lib/research-candidate-review/feedback-event-write-route-contract.ts",
    "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventWriteRouteContractAllowedChangedFiles() {
  return [
    ...feedbackEventWriteRouteContractRequiredChangedFiles(),
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
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
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
function assertNoForbiddenRuntimePatterns() {
  const combinedNewFileSource = [
    docs,
    typeSource,
    fixtureText,
    readFileSync(smokePath, "utf8"),
  ].join("\n");
  for (const { label, regex } of [
    pattern(["from ", "\"", "@/app"], "", "", "i"),
    pattern(["from ", "\"", "@/components"], "", "", "i"),
    pattern(["from ", "\"", "@/lib/db"], "", "", "i"),
    pattern(["from ", "\"", "better-sqlite3"], "", "", "i"),
    pattern(["from ", "\"", "sqlite3"], "", "", "i"),
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
    pattern(["product", "Write", "Handler"], "\\b", "\\b"),
  ]) {
    assert.doesNotMatch(
      combinedNewFileSource,
      regex,
      `new substrate files must not include ${label}`,
    );
  }
  assertNoTrueAuthority(
    fixture,
    /can_execute_product_write|can_allocate_product_ids|execution_authority|durable_write_authority|can_open_db|can_execute_sql|can_execute_transaction|can_execute_agents|can_route_agents|can_call_providers_or_openai|can_run_retrieval_or_rag|can_fetch_sources/,
  );
}

function assertAdjacentPointers() {
  for (const doc of [indexDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Agent Perspective Substrate v0\.1/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
    assert.match(doc, /advisory/i);
    assert.match(doc, /not source of truth|non-SSOT/i);
    assert.match(doc, /PerspectiveGeometryDigest/i);
  }
  for (const requiredText of [
    docsPath,
    typePath,
    fixturePath,
    packageScriptName,
    nextRecommendedSlice,
    "Agent Perspective Substrate Preview Builder v0.1",
    "types/agent-perspective-substrate-preview.ts",
    "lib/research-candidate-review/agent-perspective-substrate-preview.ts",
    "fixtures/agent-perspective-substrate-preview.sample.v0.1.json",
    "smoke:agent-perspective-substrate-preview-builder-v0-1",
    downstreamNextRecommendedSlice,
    "Cockpit Agent Perspective Substrate folded audit panel v0.1",
    "components/agent-perspective-substrate-folded-audit-panel.tsx",
    "smoke:agent-perspective-substrate-folded-audit-panel-v0-1",
    downstreamFoldedAuditPanelNextRecommendedSlice,
    "AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1",
    "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json",
    "smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1",
    downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice,
    "Candidate-to-Codex handoff draft Geometry/Substrate v0.1",
    "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json",
    "smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1",
    downstreamCandidateToCodexHandoffDraftNextRecommendedSlice,
    "Candidate-to-Codex handoff draft review v0.1",
    "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json",
    "smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
    downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice,
    "source_refs",
    "why_now",
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const source of [digestSmoke, aiContextSmoke, formationReceiptSmoke]) {
    assert.match(source, /Agent Perspective Substrate v0\.1/);
    assert.match(source, new RegExp(nextRecommendedSlice));
    assert.match(source, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
    assert.match(source, new RegExp(downstreamFoldedAuditPanelNextRecommendedSlice));
    assert.match(source, /AI Context Packet compiler GeometryDigest\/Substrate upgrade v0\.1/);
    assert.match(
      source,
      new RegExp(downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice),
    );
    assert.match(source, /Candidate-to-Codex handoff draft/i);
    assert.match(source, new RegExp(downstreamCandidateToCodexHandoffDraftNextRecommendedSlice));
    assert.match(source, new RegExp(downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice));
  }
  assert.match(
    digestSmoke,
    /downstreamAgentPerspectiveSubstratePackageScriptNames/,
    "#687 digest smoke must include downstream substrate package-script allowance",
  );
}

function hasSourceRefs(value) {
  return Array.isArray(value.source_refs) && value.source_refs.length > 0;
}

function hasSourceCoverageBoundaryNote(value) {
  return (
    Array.isArray(value.authority_boundary_notes) &&
    value.authority_boundary_notes.some((note) =>
      sourceCoverageBoundaryPattern.test(String(note)),
    )
  );
}

function assertNoTrueAuthority(value, forbiddenKeyPattern, pathSegments = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoTrueAuthority(item, forbiddenKeyPattern, [...pathSegments, String(index)]),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = [...pathSegments, key];
    if (forbiddenKeyPattern.test(key)) {
      assert.equal(nestedValue, false, `${nextPath.join(".")} must be false`);
    }
    assertNoTrueAuthority(nestedValue, forbiddenKeyPattern, nextPath);
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
