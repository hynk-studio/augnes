import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const packetTypePath = "types/research-candidate-ai-context-packet.ts";
const packetBuilderPath = "lib/research-candidate-review/ai-context-packet.ts";
const packetFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json";
const manualPacketFixturePath =
  "fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json";
const overlayFixturePath =
  "fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json";
const manualOverlayFixturePath =
  "fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json";
const packetComponentPath =
  "components/research-candidate-ai-context-packet-preview.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const packetSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const overlaySmokePath =
  "scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs";
const parserOutputSmokePath =
  "scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs";
const manualParserSmokePath =
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs";
const cockpitSmokePath =
  "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs";
const typeSmokePath = "scripts/smoke-research-candidate-review-types-v0-1.mjs";
const gateSmokePath =
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs";

for (const filePath of [
  packetTypePath,
  packetBuilderPath,
  packetFixturePath,
  manualPacketFixturePath,
  overlayFixturePath,
  manualOverlayFixturePath,
  packetComponentPath,
  cockpitPath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  packetSmokePath,
  overlaySmokePath,
  parserOutputSmokePath,
  manualParserSmokePath,
  cockpitSmokePath,
  typeSmokePath,
  gateSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const packetType = readFileSync(packetTypePath, "utf8");
const packetBuilder = readFileSync(packetBuilderPath, "utf8");
const packetFixtureText = readFileSync(packetFixturePath, "utf8");
const manualPacketFixtureText = readFileSync(manualPacketFixturePath, "utf8");
const packetFixture = JSON.parse(packetFixtureText);
const manualPacketFixture = JSON.parse(manualPacketFixtureText);
const overlayFixtureText = readFileSync(overlayFixturePath, "utf8");
const manualOverlayFixtureText = readFileSync(manualOverlayFixturePath, "utf8");
const overlayFixture = JSON.parse(overlayFixtureText);
const manualOverlayFixture = JSON.parse(manualOverlayFixtureText);
const packetComponent = readFileSync(packetComponentPath, "utf8");
const cockpit = readFileSync(cockpitPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const packetSmoke = readFileSync(packetSmokePath, "utf8");
const overlaySmoke = readFileSync(overlaySmokePath, "utf8");
const parserOutputSmoke = readFileSync(parserOutputSmokePath, "utf8");
const manualParserSmoke = readFileSync(manualParserSmokePath, "utf8");
const cockpitSmoke = readFileSync(cockpitSmokePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const gateSmoke = readFileSync(gateSmokePath, "utf8");

assertPacketTypeContract();
assertPacketBuilderPurity();
await assertPacketBuilderExecution();
assertPacketFixtures();
assertRelationshipSummaries();
assertPacketIdSafety();
assertDiagnostics();
assertFinalGuardrails();
assertCockpitPacketComponent();
const packetSection = assertCockpitSection();
assertReadOnlyUi(packetSection);
assertDocsPointers();
assertGatePointer();
assertNextStepAlignment();
assertExistingSmokeAlignment();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns(packetSection);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-ai-context-packet-v0-1",
      required_files_present: true,
      packet_type_contract_checked: true,
      packet_builder_purity_checked: true,
      packet_builder_execution_checked: true,
      packet_fixtures_checked: true,
      relationship_summaries_checked: true,
      packet_id_safety_checked: true,
      diagnostics_checked: true,
      final_guardrails_checked: true,
      cockpit_packet_component_checked: true,
      cockpit_section_checked: true,
      read_only_ui_checked: true,
      docs_pointer_checked: true,
      gate_pointer_checked: true,
      next_step_alignment_checked: true,
      existing_smoke_alignment_checked: true,
      index_pointer_checked: true,
      package_script_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertPacketTypeContract() {
  for (const exportName of [
    "ResearchCandidateAIContextPacketVersion",
    "ResearchCandidateAIContextPacketSourceKind",
    "ResearchCandidateAIContextPacketAudience",
    "ResearchCandidateAIContextPacketAuthority",
    "ResearchCandidateAIContextPacketSourceOverlayRef",
    "ResearchCandidateAIContextPacketSourceSummary",
    "ResearchCandidateAIContextPacketClaimSummary",
    "ResearchCandidateAIContextPacketEvidenceSummary",
    "ResearchCandidateAIContextPacketTensionSummary",
    "ResearchCandidateAIContextPacketKnowledgeGapSummary",
    "ResearchCandidateAIContextPacketPerspectiveDeltaSummary",
    "ResearchCandidateAIContextPacketFollowUpSummary",
    "ResearchCandidateAIContextPacketTargetPerspectiveSummary",
    "ResearchCandidateAIContextPacketDiagnostics",
    "ResearchCandidateAIContextPacket",
    "ResearchCandidateAIContextPacketFixture",
  ]) {
    assert.match(
      packetType,
      new RegExp(`export\\s+(type|interface)\\s+${escapeRegExp(exportName)}\\b`),
      `packet type file must export ${exportName}`,
    );
  }

  for (const literal of [
    "research_candidate_ai_context_packet.v0.1",
    "research_candidate_review_overlay",
    "manual_parser_output_overlay",
    "assistant_preview",
    "codex_planning_preview",
    "human_review_preview",
  ]) {
    assert.ok(packetType.includes(`"${literal}"`), `packet type file must include ${literal}`);
  }

  for (const requiredText of [
    "read_only: true",
    "preview_only: true",
    "candidate_only: true",
    "source_of_truth: false",
    "creates_evidence: false",
    "creates_proof: false",
    "commits_state: false",
    "promotes_perspective: false",
    "creates_work_item: false",
    "mutates_runtime: false",
    "executes_agents: false",
    "sends_handoff: false",
    "calls_provider: false",
    "performs_retrieval: false",
    "type-only",
    "non-authoritative",
  ]) {
    assert.ok(packetType.includes(requiredText), `packet type file must include ${requiredText}`);
  }

  for (const regex of [
    /not an API\s+\/\/\s+contract/,
    /not a provider prompt/,
    /not a Codex execution contract/,
    /not\s+\/\/\s+proof\/evidence/,
    /not perspective promotion authority/,
    /not durable memory/,
    /not retrieval\/RAG/,
  ]) {
    assert.match(packetType, regex, `packet type file must include ${regex}`);
  }
}

function assertPacketBuilderPurity() {
  for (const exportName of [
    "buildResearchCandidateAIContextPacket",
    "buildResearchCandidateAIContextPacketSummaries",
    "getResearchCandidateAIContextPacketAuthority",
    "getResearchCandidateAIContextPacketFinalGuardrails",
  ]) {
    assert.match(
      packetBuilder,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `packet builder must export ${exportName}`,
    );
  }

  for (const importPath of [
    "@/types/research-candidate-constellation-overlay",
    "@/types/research-candidate-ai-context-packet",
  ]) {
    assert.match(
      packetBuilder,
      new RegExp(`import\\s+type\\s+\\{[\\s\\S]+?\\}\\s+from\\s+"${escapeRegExp(importPath)}";`),
      `packet builder must import only types from ${importPath}`,
    );
  }
  assert.doesNotMatch(
    packetBuilder,
    /^import\s+(?!type\b)/m,
    "packet builder must not import runtime modules",
  );

  for (const { label, regex } of [
    pattern(["from ", "\"node", ":"]),
    pattern(["from ", "'node", ":"]),
    pattern(["node", ":fs"]),
    pattern(["node", ":http"]),
    pattern(["node", ":https"]),
    pattern(["child", "_process"]),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["process", ".env"], "\\b", "\\b"),
    pattern(["Date", ".now"], "\\b", "\\s*\\("),
    pattern(["Math", ".random"], "\\b", "\\s*\\("),
    pattern(["api", ".open", "ai", ".com"]),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["use", " client"], "\\b", "\\b"),
    pattern(["pri", "sma"], "\\b", "\\b", "i"),
    pattern(["sql", "ite"], "\\b", "\\b", "i"),
    pattern(["driz", "zle"], "\\b", "\\b", "i"),
    pattern(["supa", "base"], "\\b", "\\b", "i"),
    pattern(["embed", "ding", " implementation"], "\\b", "\\b", "i"),
    pattern(["vec", "tor", " search", " implementation"], "\\b", "\\b", "i"),
    pattern(["r", "ag", " implementation"], "\\b", "\\b", "i"),
    pattern(["send", "Handoff"], "\\b", "\\s*\\("),
    pattern(["execute", "Codex"], "\\b", "\\s*\\("),
    pattern(["call", "Provider"], "\\b", "\\s*\\("),
    pattern(["run", "Retrieval"], "\\b", "\\s*\\("),
    pattern(["create", "WorkItem"], "\\b", "\\s*\\("),
    pattern(["promote", "Perspective"], "\\b", "\\s*\\("),
  ]) {
    assert.doesNotMatch(packetBuilder, regex, `packet builder must not include ${label}`);
  }
}

async function assertPacketBuilderExecution() {
  const builderModule = await importPacketBuilderModule();
  const staticPacket = builderModule.buildResearchCandidateAIContextPacket(
    overlayFixture,
    {
      source_kind: "research_candidate_review_overlay",
      overlay_fixture_path: overlayFixturePath,
      audience: "assistant_preview",
    },
  );
  const manualPacket = builderModule.buildResearchCandidateAIContextPacket(
    manualOverlayFixture,
    {
      source_kind: "manual_parser_output_overlay",
      overlay_fixture_path: manualOverlayFixturePath,
      audience: "assistant_preview",
    },
  );

  assert.deepEqual(
    staticPacket,
    packetFixture,
    "builder output for the static overlay must match the expected packet fixture exactly",
  );
  assert.deepEqual(
    manualPacket,
    manualPacketFixture,
    "builder output for the manual parser overlay must match the expected packet fixture exactly",
  );
}

function assertPacketFixtures() {
  assertPacketFixture(
    packetFixture,
    overlayFixture,
    "research_candidate_review_overlay",
    overlayFixturePath,
  );
  assertPacketFixture(
    manualPacketFixture,
    manualOverlayFixture,
    "manual_parser_output_overlay",
    manualOverlayFixturePath,
  );
}

function assertPacketFixture(packet, overlay, expectedSourceKind, expectedOverlayPath) {
  assert.equal(packet.packet_version, "research_candidate_ai_context_packet.v0.1");
  assert.equal(packet.scope, "project:augnes");
  assert.equal(packet.source_kind, expectedSourceKind);
  assert.equal(packet.audience, "assistant_preview");
  assert.equal(packet.source_overlay.overlay_version, overlay.overlay_version);
  assert.equal(packet.source_overlay.source_kind, overlay.source_kind);
  assert.equal(packet.source_overlay.source_fixture_path, overlay.source_fixture_path);
  assert.equal(packet.source_overlay.overlay_fixture_path, expectedOverlayPath);
  assert.equal(packet.source_overlay.node_count, overlay.diagnostics.node_count);
  assert.equal(packet.source_overlay.edge_count, overlay.diagnostics.edge_count);

  for (const [field, expected] of [
    ["read_only", true],
    ["preview_only", true],
    ["candidate_only", true],
    ["source_of_truth", false],
    ["creates_evidence", false],
    ["creates_proof", false],
    ["commits_state", false],
    ["promotes_perspective", false],
    ["creates_work_item", false],
    ["mutates_runtime", false],
    ["executes_agents", false],
    ["sends_handoff", false],
    ["calls_provider", false],
    ["performs_retrieval", false],
  ]) {
    assert.equal(packet.authority[field], expected, `packet authority.${field} must be ${expected}`);
  }

  for (const family of summaryFamilies()) {
    assert.ok(Array.isArray(packet[family]), `${family} must be an array`);
  }

  assert.match(
    packet.non_authority_notice,
    /not source of truth/i,
    "non-authority notice must say not source of truth",
  );
  assert.match(
    packet.non_authority_notice,
    /not proof\/evidence/i,
    "non-authority notice must say not proof/evidence",
  );
  assert.match(
    packet.non_authority_notice,
    /not a work item/i,
    "non-authority notice must say not a work item",
  );
  assert.match(
    packet.non_authority_notice,
    /not a perspective promotion/i,
    "non-authority notice must say not a perspective promotion",
  );
  assert.match(
    packet.non_authority_notice,
    /not a provider call/i,
    "non-authority notice must say not a provider call",
  );
  assert.match(
    packet.non_authority_notice,
    /not retrieval/i,
    "non-authority notice must say not retrieval",
  );
  assert.match(
    packet.non_authority_notice,
    /not Codex execution/i,
    "non-authority notice must say not Codex execution",
  );

  for (const followUp of packet.follow_up_summaries) {
    assert.equal(followUp.is_work_item, false, `${followUp.id} must not be a work item`);
  }

  for (const target of packet.target_perspective_summaries) {
    assert.match(
      target.target_perspective_key,
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
      `${target.anchor_node_id} must use a stable dotted lower-case key`,
    );
  }
}

function assertRelationshipSummaries() {
  assertPacketRelationships(packetFixture, overlayFixture);
  assertPacketRelationships(manualPacketFixture, manualOverlayFixture);
}

function assertPacketRelationships(packet, overlay) {
  for (const summary of packet.claim_summaries) {
    assert.deepEqual(
      summary.supporting_evidence_node_ids,
      outgoingEdges(overlay, summary.node_id, "claim_supported_by_evidence").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} supporting evidence must follow overlay relations`,
    );
    assert.deepEqual(
      summary.contradicting_evidence_node_ids,
      outgoingEdges(overlay, summary.node_id, "claim_contradicted_by_evidence").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} contradicting evidence must follow overlay relations`,
    );
  }

  for (const summary of packet.evidence_summaries) {
    const claimEdges = incomingEdges(overlay, summary.node_id).filter((edge) =>
      edge.relation.startsWith("claim_"),
    );
    assert.deepEqual(
      summary.evidence_relation_labels,
      claimEdges.map((edge) => edge.label),
      `${summary.id} evidence labels must follow overlay relations`,
    );
    assert.deepEqual(
      summary.related_claim_node_ids,
      claimEdges.map((edge) => edge.source_node_id),
      `${summary.id} related claims must follow overlay relations`,
    );
  }

  for (const summary of packet.tension_summaries) {
    assert.deepEqual(
      summary.related_claim_node_ids,
      outgoingEdges(overlay, summary.node_id, "tension_relates_to_claim").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} related claims must follow overlay relations`,
    );
    assert.deepEqual(
      summary.related_evidence_node_ids,
      outgoingEdges(overlay, summary.node_id, "tension_relates_to_evidence").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} related evidence must follow overlay relations`,
    );
    assert.deepEqual(
      summary.preserved_by_delta_node_ids,
      incomingEdges(overlay, summary.node_id)
        .filter((edge) => edge.relation === "delta_preserves_tension")
        .map((edge) => edge.source_node_id),
      `${summary.id} preserving deltas must follow overlay relations`,
    );
  }

  for (const summary of packet.knowledge_gap_summaries) {
    assert.deepEqual(
      summary.related_claim_node_ids,
      outgoingEdges(overlay, summary.node_id, "gap_relates_to_claim").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} related claims must follow overlay relations`,
    );
    assert.deepEqual(
      summary.related_tension_node_ids,
      outgoingEdges(overlay, summary.node_id, "gap_relates_to_tension").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} related tensions must follow overlay relations`,
    );
    assert.deepEqual(
      summary.tracked_by_delta_node_ids,
      incomingEdges(overlay, summary.node_id)
        .filter((edge) => edge.relation === "delta_tracks_gap")
        .map((edge) => edge.source_node_id),
      `${summary.id} tracking deltas must follow overlay relations`,
    );
  }

  for (const summary of packet.perspective_delta_summaries) {
    assert.match(
      summary.target_perspective_key,
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
      `${summary.id} target perspective key must be stable dotted lower-case`,
    );
    assert.deepEqual(
      summary.basis_claim_node_ids,
      outgoingEdges(overlay, summary.node_id, "delta_uses_claim_basis").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} claim basis must follow overlay relations`,
    );
    assert.deepEqual(
      summary.basis_evidence_node_ids,
      outgoingEdges(overlay, summary.node_id, "delta_uses_evidence_basis").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} evidence basis must follow overlay relations`,
    );
    assert.deepEqual(
      summary.related_tension_node_ids,
      outgoingEdges(overlay, summary.node_id, "delta_preserves_tension").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} preserved tensions must follow overlay relations`,
    );
    assert.deepEqual(
      summary.related_gap_node_ids,
      outgoingEdges(overlay, summary.node_id, "delta_tracks_gap").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} tracked gaps must follow overlay relations`,
    );
  }

  for (const summary of packet.target_perspective_summaries) {
    assert.deepEqual(
      summary.delta_node_ids,
      incomingEdges(overlay, summary.anchor_node_id)
        .filter((edge) => edge.relation === "delta_proposes_change_to_perspective")
        .map((edge) => edge.source_node_id),
      `${summary.anchor_node_id} delta IDs must follow overlay relations`,
    );
  }

  for (const summary of packet.follow_up_summaries) {
    assert.deepEqual(
      summary.derived_from_session_node_ids,
      outgoingEdges(overlay, summary.node_id, "follow_up_derived_from_session").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} session derivation must follow overlay relations`,
    );
    assert.deepEqual(
      summary.derived_from_source_node_ids,
      outgoingEdges(overlay, summary.node_id, "follow_up_derived_from_source").map(
        (edge) => edge.target_node_id,
      ),
      `${summary.id} source derivation must follow overlay relations`,
    );
    assert.equal(summary.is_work_item, false, `${summary.id} must not be a work item`);
  }
}

function assertPacketIdSafety() {
  assertPacketIdsSafe(packetFixture, overlayFixture);
  assertPacketIdsSafe(manualPacketFixture, manualOverlayFixture);
}

function assertPacketIdsSafe(packet, overlay) {
  const packetIds = [
    ...packet.source_summaries.map((summary) => summary.id),
    ...packet.claim_summaries.map((summary) => summary.id),
    ...packet.evidence_summaries.map((summary) => summary.id),
    ...packet.tension_summaries.map((summary) => summary.id),
    ...packet.knowledge_gap_summaries.map((summary) => summary.id),
    ...packet.perspective_delta_summaries.map((summary) => summary.id),
    ...packet.follow_up_summaries.map((summary) => summary.id),
  ];
  const unsafeExactValues = overlay.nodes
    .filter((node) => node.kind === "source_reference")
    .flatMap((node) => [node.label, node.summary])
    .filter((value) => typeof value === "string" && value.length > 8);

  for (const packetId of packetIds) {
    for (const rawValue of unsafeExactValues) {
      assert.ok(
        !packetId.includes(rawValue),
        `${packetId} must not include raw source display text`,
      );
    }
    assert.doesNotMatch(
      packetId,
      /https?:\/\/|provider[_-]|thread[_-]|workspace[_-]|run[_-]|session[_-]|demo[_-]/i,
      `${packetId} must not include raw URL/provider/thread/run/session/demo text`,
    );
  }
}

function assertDiagnostics() {
  assertPacketDiagnostics(packetFixture, overlayFixture);
  assertPacketDiagnostics(manualPacketFixture, manualOverlayFixture);
}

function assertPacketDiagnostics(packet, overlay) {
  assert.equal(packet.diagnostics.source_overlay_node_count, overlay.diagnostics.node_count);
  assert.equal(packet.diagnostics.source_overlay_edge_count, overlay.diagnostics.edge_count);
  assert.equal(packet.diagnostics.source_summary_count, packet.source_summaries.length);
  assert.equal(packet.diagnostics.claim_summary_count, packet.claim_summaries.length);
  assert.equal(packet.diagnostics.evidence_summary_count, packet.evidence_summaries.length);
  assert.equal(packet.diagnostics.tension_summary_count, packet.tension_summaries.length);
  assert.equal(
    packet.diagnostics.knowledge_gap_summary_count,
    packet.knowledge_gap_summaries.length,
  );
  assert.equal(
    packet.diagnostics.perspective_delta_summary_count,
    packet.perspective_delta_summaries.length,
  );
  assert.equal(packet.diagnostics.follow_up_summary_count, packet.follow_up_summaries.length);
  assert.equal(
    packet.diagnostics.target_perspective_summary_count,
    packet.target_perspective_summaries.length,
  );
  assert.equal(
    packet.diagnostics.unresolved_tension_count,
    overlay.diagnostics.unresolved_tension_count,
  );
  assert.equal(
    packet.diagnostics.blocked_or_not_ready_delta_count,
    overlay.diagnostics.blocked_or_not_ready_delta_count,
  );
  assert.equal(
    packet.diagnostics.source_ref_coverage_ratio,
    overlay.diagnostics.source_ref_coverage_ratio,
  );
  assert.equal(packet.diagnostics.final_guardrail_count, packet.final_guardrails.length);
}

function assertFinalGuardrails() {
  for (const packet of [packetFixture, manualPacketFixture]) {
    for (const guardrail of [
      "Do not treat candidate claims as facts.",
      "Do not treat evidence candidates as proof/evidence rows.",
      "Preserve unresolved tensions.",
      "Preserve knowledge gaps instead of filling them by inference.",
      "Do not promote perspective deltas.",
      "Do not create work items from follow-up candidates.",
      "Do not use raw source titles, URLs, provider IDs, thread IDs, run IDs, session IDs, arbitrary user strings, episode IDs, or demo refs as canonical labels.",
      "Do not execute Codex or send external handoffs from this preview packet.",
    ]) {
      assert.ok(packet.final_guardrails.includes(guardrail), `packet must include guardrail: ${guardrail}`);
    }
  }
}

function assertCockpitPacketComponent() {
  for (const requiredText of [
    "ResearchCandidateAIContextPacket",
    "packet.diagnostics",
    "Source summaries",
    "Claim summaries",
    "Evidence summaries",
    "Tension summaries",
    "Knowledge gap summaries",
    "Perspective delta summaries",
    "Follow-up summaries",
    "Target perspective summaries",
    "packet.final_guardrails",
    "packet.authority",
    "read-only",
    "candidate-only",
  ]) {
    assert.ok(packetComponent.includes(requiredText), `packet component must include ${requiredText}`);
  }

  for (const regex of [
    /not provider\s+prompt execution/i,
    /not Codex execution/i,
    /not retrieval/i,
    /not durable\s+memory/i,
    /not promotion authority/i,
  ]) {
    assert.match(packetComponent, regex, `packet component must include ${regex}`);
  }

  assertNoActionControls(packetComponent, "packet preview component");
}

function assertCockpitSection() {
  for (const requiredText of [
    "research-candidate-review.ai-context-packet.sample.v0.1.json",
    "research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json",
    "ResearchCandidateAIContextPacketPreview",
    "ResearchCandidateAIContextPacket",
    "RESEARCH_CANDIDATE_REVIEW_AI_CONTEXT_PACKET_FIXTURE_PATH",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_AI_CONTEXT_PACKET_FIXTURE_PATH",
    'id="research-candidate-ai-context-packet-preview"',
    'href="#research-candidate-ai-context-packet-preview"',
    "Research Candidate AI Context Packet",
  ]) {
    assert.ok(cockpit.includes(requiredText), `cockpit must include ${requiredText}`);
  }

  const section = extractBetween(
    cockpit,
    "Research Candidate AI Context Packet Cockpit Preview Start",
    "Research Candidate AI Context Packet Cockpit Preview End",
  );
  assert.equal(
    (section.match(/<ResearchCandidateAIContextPacketPreview\b/g) ?? []).length,
    2,
    "cockpit packet section must render two packet previews",
  );
  assert.doesNotMatch(
    cockpit,
    new RegExp(`import\\s+\\{[^}]*${escapeRegExp(packetBuilderFunctionName())}[^}]*\\}`),
    "cockpit must not import packet builder functions",
  );
  assert.doesNotMatch(
    cockpit,
    new RegExp(`\\b${escapeRegExp(packetBuilderFunctionName())}\\s*\\(`),
    "cockpit must not call packet builder functions",
  );
  return section;
}

function assertReadOnlyUi(packetSection) {
  assertNoActionControls(packetSection, "cockpit packet preview section");
  assertNoActionControls(packetComponent, "packet preview component");
}

function assertDocsPointers() {
  for (const requiredText of [
    packetTypePath,
    packetBuilderPath,
    packetFixturePath,
    manualPacketFixturePath,
    packetComponentPath,
    cockpitPath,
    "smoke:research-candidate-review-ai-context-packet-v0-1",
    "PerspectiveGeometryDigest Builder v0.1",
    "types/perspective-geometry-digest.ts",
    "lib/research-candidate-review/perspective-geometry-digest.ts",
    "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json",
    "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json",
    "agent_perspective_substrate_docs_type_fixture_v0_1",
    "Agent Perspective Substrate v0.1",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "types/agent-perspective-substrate.ts",
    "fixtures/agent-perspective-substrate.sample.v0.1.json",
    "agent_perspective_substrate_preview_builder_v0_1",
    "read-only",
    "handoff packet",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
  }

  for (const regex of [
    /Research Candidate AI Context Packet\s+preview/i,
    /not provider prompt execution|no provider prompt execution/i,
    /not Codex execution|no Codex execution/i,
    /not retrieval|no retrieval/i,
    /not durable memory|no durable memory/i,
    /no runtime\/API\/DB\/provider\/retrieval\/promotion behavior/i,
    /no proof\/evidence write|not proof\/evidence/i,
    /no work item creation|not work item creation/i,
  ]) {
    assert.match(surfaceDoc, regex, `surface doc must include ${regex}`);
  }
}

function assertGatePointer() {
  for (const regex of [
    /Research Candidate AI Context Packet preview preserves canonical promotion\s+gates/i,
    /Packet IDs must not use raw source titles, URLs, provider IDs, raw\s+thread\/run\/session strings, arbitrary user strings, episode IDs, or demo refs/i,
    /Target perspective summaries are read-only and non-authoritative/i,
    /no provider prompt execution, Codex execution, retrieval, durable memory/i,
    /runtime\/API\/DB\/provider\/retrieval, or promotion behavior/i,
    /PerspectiveGeometryDigest Builder v0\.1 preserves canonical promotion\s+gates/i,
    /layout\s+coordinates as truth are explicitly forbidden/i,
    /agent_perspective_substrate_docs_type_fixture_v0_1/i,
    /Agent Perspective Substrate v0\.1 preserves canonical promotion\s+gates/i,
    /agent_perspective_substrate_preview_builder_v0_1/i,
  ]) {
    assert.match(gateDoc, regex, `gate doc must include ${regex}`);
  }
}

function assertNextStepAlignment() {
  const expected = /Cockpit manual pasted note preview UI shell/i;
  assert.match(
    extractSection(surfaceDoc, "## Next Recommended Step"),
    expected,
    "surface doc next step must mention Cockpit manual pasted note preview UI shell",
  );
  assert.match(
    extractSection(gateDoc, "## Next Recommended Step"),
    expected,
    "gate doc next step must mention Cockpit manual pasted note preview UI shell",
  );
}

function assertExistingSmokeAlignment() {
  for (const [label, source] of [
    ["constellation overlay smoke", overlaySmoke],
    ["parser output cockpit smoke", parserOutputSmoke],
    ["manual parser smoke", manualParserSmoke],
    ["cockpit smoke", cockpitSmoke],
    ["type smoke", typeSmoke],
    ["gate smoke", gateSmoke],
  ]) {
    assert.match(
      source,
      /Cockpit manual pasted note preview UI shell/i,
      `${label} must expect Cockpit manual pasted note preview UI shell`,
    );
  }
}

function assertIndexPointer() {
  const pointerStart = index.indexOf("Research Candidate AI Context Packet preview");
  assert.notEqual(pointerStart, -1, "index must mention Research Candidate AI Context Packet preview");
  const pointer = index.slice(pointerStart, pointerStart + 2600);
  for (const requiredText of [
    packetTypePath,
    packetBuilderPath,
    packetFixturePath,
    manualPacketFixturePath,
    packetComponentPath,
    cockpitPath,
    "smoke:research-candidate-review-ai-context-packet-v0-1",
    "read-only handoff packet",
    "no provider prompt execution",
    "no Codex execution",
    "no retrieval",
    "no durable memory",
    "no runtime/API/DB/provider/retrieval/promotion behavior",
    "no proof/evidence write",
    "no work item creation",
  ]) {
    assert.ok(pointer.includes(requiredText), `index packet pointer must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:research-candidate-review-ai-context-packet-v0-1"],
    "node scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
    "package.json must expose the AI context packet smoke",
  );
}

function assertNoForbiddenImplementationPatterns(packetSection) {
  const typeAndBuilderText = [packetType, packetBuilder].join("\n");
  assert.doesNotMatch(
    typeAndBuilderText,
    pattern(["use", " client"], "\\b", "\\b").regex,
    "type and builder files must not include client component markers",
  );

  const combinedStaticText = [
    packetType,
    packetBuilder,
    packetFixtureText,
    manualPacketFixtureText,
    packetSection,
    packetComponent,
    extractAround(surfaceDoc, "AI Context Packet Preview Pointer", 1800),
    extractAround(gateDoc, "Research Candidate AI Context Packet preview", 1400),
    extractAround(index, "Research Candidate AI Context Packet preview", 2600),
    packetSmoke,
  ].join("\n");

  const forbiddenPatterns = [
    pattern(["child", "_process"]),
    pattern(["spawn"], "\\b", "\\s*\\("),
    pattern(["exec"], "\\b", "\\s*\\("),
    pattern(["exec", "File"], "\\b", "\\s*\\("),
    pattern(["api", ".github", ".com"]),
    pattern(["api", ".open", "ai", ".com"]),
    pattern(["GITHUB", "_TOKEN"]),
    pattern(["OPEN", "AI", "_API", "_KEY"]),
    pattern(["record", "-proof"]),
    pattern(["record", "-evidence"]),
    pattern(["commit", "State", "Update"]),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["XML", "Http", "Request"], "\\b", "\\b"),
    pattern(["Web", "Socket"], "\\b", "\\b"),
    pattern(["Event", "Source"], "\\b", "\\b"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["pri", "sma"], "\\b", "\\b", "i"),
    pattern(["sql", "ite"], "\\b", "\\b", "i"),
    pattern(["driz", "zle"], "\\b", "\\b", "i"),
    pattern(["supa", "base"], "\\b", "\\b", "i"),
    pattern(["open", "ai", " implementation"], "\\b", "\\b", "i"),
    pattern(["embed", "dings", " implementation"], "\\b", "\\b", "i"),
    pattern(["vec", "tor", " search", " implementation"], "\\b", "\\b", "i"),
    pattern(["r", "ag", " implementation"], "\\b", "\\b", "i"),
    pattern(["send", "Handoff", " implementation"], "\\b", "\\b"),
    pattern(["execute", "Codex", " implementation"], "\\b", "\\b"),
    pattern(["call", "Provider", " implementation"], "\\b", "\\b"),
    pattern(["run", "Retrieval", " implementation"], "\\b", "\\b"),
    pattern(["create", "WorkItem", " implementation"], "\\b", "\\b"),
    pattern(["promote", "Perspective", " implementation"], "\\b", "\\b"),
    pattern(["send", "Handoff"], "\\b", "\\s*\\("),
    pattern(["execute", "Codex"], "\\b", "\\s*\\("),
    pattern(["call", "Provider"], "\\b", "\\s*\\("),
    pattern(["run", "Retrieval"], "\\b", "\\s*\\("),
    pattern(["create", "WorkItem"], "\\b", "\\s*\\("),
    pattern(["promote", "Perspective"], "\\b", "\\s*\\("),
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(
      combinedStaticText,
      regex,
      `AI context packet static text must not include ${label}`,
    );
  }
}

async function importPacketBuilderModule() {
  const transformedSource = stripTypeScriptTypes(packetBuilder, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function assertNoActionControls(source, label) {
  const forbiddenPatterns = [
    pattern(["<button"], "", "\\b"),
    pattern(["<form"], "", "\\b"),
    pattern(["<input"], "", "\\b"),
    pattern(["<textarea"], "", "\\b"),
    pattern(["<select"], "", "\\b"),
    pattern(["onClick", "="], "\\b", ""),
    pattern(["onSubmit", "="], "\\b", ""),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["fetch", "Json"], "\\b", "\\b"),
    pattern(["method", ": \"POST\""]),
    pattern(["method", ": \"PUT\""]),
    pattern(["method", ": \"PATCH\""]),
    pattern(["method", ": \"DELETE\""]),
    pattern(["/api", "/"]),
    pattern(["db", "/"]),
    pattern(["migrations", "/"]),
    pattern(["create", "ResearchCandidate"], "\\b", "\\b"),
    pattern(["promote", "Perspective"], "\\b", "\\b"),
    pattern(["reject", "Candidate"], "\\b", "\\b"),
    pattern(["create", "WorkItem"], "\\b", "\\b"),
    pattern(["record", "Proof"], "\\b", "\\b"),
    pattern(["record", "Evidence"], "\\b", "\\b"),
    pattern(["execute", "Codex"], "\\b", "\\b"),
    pattern([packetBuilderFunctionName()], "\\b", "\\s*\\("),
    pattern(["send", "Handoff"], "\\b", "\\b"),
    pattern(["call", "Provider"], "\\b", "\\b"),
    pattern(["run", "Retrieval"], "\\b", "\\b"),
    pattern(["launch", " Codex"], "\\b", "\\b", "i"),
    pattern(["merge"], "\\b", "\\b", "i"),
    pattern(["publish"], "\\b", "\\b", "i"),
    pattern(["retry"], "\\b", "\\b", "i"),
    pattern(["replay"], "\\b", "\\b", "i"),
    pattern(["deploy"], "\\b", "\\b", "i"),
  ];

  for (const { label: patternLabel, regex } of forbiddenPatterns) {
    assert.doesNotMatch(source, regex, `${label} must not include ${patternLabel}`);
  }
}

function extractBetween(source, startPattern, endPattern) {
  const start = source.indexOf(startPattern);
  assert.notEqual(start, -1, `missing section start marker ${startPattern}`);
  const end = source.indexOf(endPattern, start);
  assert.notEqual(end, -1, `missing section end marker ${endPattern}`);
  return source.slice(start, end + endPattern.length);
}

function extractSection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `missing section ${heading}`);
  const next = source.indexOf("\n## ", start + heading.length);
  return source.slice(start, next === -1 ? source.length : next);
}

function extractAround(source, marker, radius) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing marker ${marker}`);
  return source.slice(Math.max(0, index - radius), index + marker.length + radius);
}

function outgoingEdges(overlay, nodeId, relation) {
  return overlay.edges.filter(
    (edge) => edge.source_node_id === nodeId && edge.relation === relation,
  );
}

function incomingEdges(overlay, nodeId) {
  return overlay.edges.filter((edge) => edge.target_node_id === nodeId);
}

function summaryFamilies() {
  return [
    "source_summaries",
    "claim_summaries",
    "evidence_summaries",
    "tension_summaries",
    "knowledge_gap_summaries",
    "perspective_delta_summaries",
    "follow_up_summaries",
    "target_perspective_summaries",
  ];
}

function packetBuilderFunctionName() {
  return ["buildResearchCandidate", "AIContextPacket"].join("");
}

function pattern(parts, before = "", after = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${before}${parts.map(escapeRegExp).join("")}${after}`, flags),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
