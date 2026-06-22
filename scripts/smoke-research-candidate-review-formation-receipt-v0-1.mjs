import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const receiptTypePath = "types/research-candidate-formation-receipt.ts";
const receiptBuilderPath = "lib/research-candidate-review/formation-receipt.ts";
const receiptFixturePath =
  "fixtures/research-candidate-review.formation-receipt.sample.v0.1.json";
const manualReceiptFixturePath =
  "fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json";
const packetFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json";
const manualPacketFixturePath =
  "fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json";
const overlayFixturePath =
  "fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json";
const manualOverlayFixturePath =
  "fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json";
const receiptComponentPath =
  "components/research-candidate-formation-receipt-preview.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const receiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
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
  receiptTypePath,
  receiptBuilderPath,
  receiptFixturePath,
  manualReceiptFixturePath,
  packetFixturePath,
  manualPacketFixturePath,
  overlayFixturePath,
  manualOverlayFixturePath,
  receiptComponentPath,
  cockpitPath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  receiptSmokePath,
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

const receiptType = readFileSync(receiptTypePath, "utf8");
const receiptBuilder = readFileSync(receiptBuilderPath, "utf8");
const receiptFixtureText = readFileSync(receiptFixturePath, "utf8");
const manualReceiptFixtureText = readFileSync(manualReceiptFixturePath, "utf8");
const receiptFixture = JSON.parse(receiptFixtureText);
const manualReceiptFixture = JSON.parse(manualReceiptFixtureText);
const packetFixtureText = readFileSync(packetFixturePath, "utf8");
const manualPacketFixtureText = readFileSync(manualPacketFixturePath, "utf8");
const packetFixture = JSON.parse(packetFixtureText);
const manualPacketFixture = JSON.parse(manualPacketFixtureText);
const overlayFixtureText = readFileSync(overlayFixturePath, "utf8");
const manualOverlayFixtureText = readFileSync(manualOverlayFixturePath, "utf8");
const overlayFixture = JSON.parse(overlayFixtureText);
const manualOverlayFixture = JSON.parse(manualOverlayFixtureText);
const receiptComponent = readFileSync(receiptComponentPath, "utf8");
const cockpit = readFileSync(cockpitPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const receiptSmoke = readFileSync(receiptSmokePath, "utf8");
const packetSmoke = readFileSync(packetSmokePath, "utf8");
const overlaySmoke = readFileSync(overlaySmokePath, "utf8");
const parserOutputSmoke = readFileSync(parserOutputSmokePath, "utf8");
const manualParserSmoke = readFileSync(manualParserSmokePath, "utf8");
const cockpitSmoke = readFileSync(cockpitSmokePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const gateSmoke = readFileSync(gateSmokePath, "utf8");

assertReceiptTypeContract();
assertReceiptBuilderPurity();
await assertReceiptBuilderExecution();
assertReceiptFixtures();
assertContributionMapping();
assertReceiptIdSafety();
assertDiagnostics();
assertCockpitReceiptComponent();
const receiptSection = assertCockpitSection();
assertReadOnlyUi(receiptSection);
assertDocsPointers();
assertGatePointer();
assertNextStepAlignment();
assertExistingSmokeAlignment();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns(receiptSection);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-formation-receipt-v0-1",
      required_files_present: true,
      receipt_type_contract_checked: true,
      receipt_builder_purity_checked: true,
      receipt_builder_execution_checked: true,
      receipt_fixtures_checked: true,
      contribution_mapping_checked: true,
      receipt_id_safety_checked: true,
      diagnostics_checked: true,
      cockpit_receipt_component_checked: true,
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

function assertReceiptTypeContract() {
  for (const exportName of [
    "ResearchCandidateFormationReceiptVersion",
    "ResearchCandidateFormationReceiptSourceKind",
    "ResearchCandidateFormationReceiptArtifactKind",
    "ResearchCandidateFormationReceiptAuthority",
    "ResearchCandidateFormationReceiptSourceRefContribution",
    "ResearchCandidateFormationReceiptNodeContribution",
    "ResearchCandidateFormationReceiptEdgeContribution",
    "ResearchCandidateFormationReceiptPacketSectionContribution",
    "ResearchCandidateFormationReceiptGuardrailContribution",
    "ResearchCandidateFormationReceiptArtifact",
    "ResearchCandidateFormationReceiptDiagnostics",
    "ResearchCandidateFormationReceipt",
    "ResearchCandidateFormationReceiptFixture",
  ]) {
    assert.match(
      receiptType,
      new RegExp(`export\\s+(type|interface)\\s+${escapeRegExp(exportName)}\\b`),
      `receipt type file must export ${exportName}`,
    );
  }

  for (const literal of [
    "research_candidate_formation_receipt.v0.1",
    "research_candidate_review_packet",
    "manual_parser_output_packet",
    "read_only_review_artifact",
    "candidate_handoff_preview",
    "operator_inspection_preview",
  ]) {
    assert.ok(receiptType.includes(`"${literal}"`), `receipt type file must include ${literal}`);
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
    "writes_receipt: false",
    "writes_event_log: false",
    "type-only",
    "non-authoritative",
  ]) {
    assert.ok(receiptType.includes(requiredText), `receipt type file must include ${requiredText}`);
  }

  for (const regex of [
    /not durable\s+\/\/\s+receipt storage/,
    /not an event log/,
    /not proof\/evidence/,
    /not a DB schema/,
    /not a\s+\/\/\s+promotion record/,
    /not a work item/,
    /not a provider prompt/,
    /not Codex\s+\/\/\s+execution/,
    /not external handoff sending/,
  ]) {
    assert.match(receiptType, regex, `receipt type file must include ${regex}`);
  }
}

function assertReceiptBuilderPurity() {
  for (const exportName of [
    "buildResearchCandidateFormationReceipt",
    "buildResearchCandidateFormationReceiptContributions",
    "getResearchCandidateFormationReceiptAuthority",
    "getResearchCandidateFormationReceiptNotice",
  ]) {
    assert.match(
      receiptBuilder,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `receipt builder must export ${exportName}`,
    );
  }

  for (const importPath of [
    "@/types/research-candidate-constellation-overlay",
    "@/types/research-candidate-ai-context-packet",
    "@/types/research-candidate-formation-receipt",
  ]) {
    assert.match(
      receiptBuilder,
      new RegExp(`import\\s+type\\s+\\{[\\s\\S]+?\\}\\s+from\\s+"${escapeRegExp(importPath)}";`),
      `receipt builder must import only types from ${importPath}`,
    );
  }
  assert.doesNotMatch(
    receiptBuilder,
    /^import\s+(?!type\b)/m,
    "receipt builder must not import runtime modules",
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
    pattern(["write", "Receipt"], "\\b", "\\s*\\("),
    pattern(["write", "Event", "Log"], "\\b", "\\s*\\("),
    pattern(["record", "Proof"], "\\b", "\\s*\\("),
    pattern(["record", "Evidence"], "\\b", "\\s*\\("),
    pattern(["send", "Handoff"], "\\b", "\\s*\\("),
    pattern(["execute", "Codex"], "\\b", "\\s*\\("),
    pattern(["call", "Provider"], "\\b", "\\s*\\("),
    pattern(["run", "Retrieval"], "\\b", "\\s*\\("),
    pattern(["create", "WorkItem"], "\\b", "\\s*\\("),
    pattern(["promote", "Perspective"], "\\b", "\\s*\\("),
  ]) {
    assert.doesNotMatch(receiptBuilder, regex, `receipt builder must not include ${label}`);
  }
}

async function assertReceiptBuilderExecution() {
  const builderModule = await importReceiptBuilderModule();
  const staticReceipt = builderModule.buildResearchCandidateFormationReceipt(
    packetFixture,
    overlayFixture,
    {
      source_kind: "research_candidate_review_packet",
      source_packet_fixture_path: packetFixturePath,
      source_overlay_fixture_path: overlayFixturePath,
      artifact_kind: "read_only_review_artifact",
    },
  );
  const manualReceipt = builderModule.buildResearchCandidateFormationReceipt(
    manualPacketFixture,
    manualOverlayFixture,
    {
      source_kind: "manual_parser_output_packet",
      source_packet_fixture_path: manualPacketFixturePath,
      source_overlay_fixture_path: manualOverlayFixturePath,
      artifact_kind: "operator_inspection_preview",
    },
  );

  assert.deepEqual(
    staticReceipt,
    receiptFixture,
    "builder output for the static packet must match the expected receipt fixture exactly",
  );
  assert.deepEqual(
    manualReceipt,
    manualReceiptFixture,
    "builder output for the manual packet must match the expected receipt fixture exactly",
  );
}

function assertReceiptFixtures() {
  assertReceiptFixture(
    receiptFixture,
    packetFixture,
    overlayFixture,
    "research_candidate_review_packet",
    packetFixturePath,
    overlayFixturePath,
  );
  assertReceiptFixture(
    manualReceiptFixture,
    manualPacketFixture,
    manualOverlayFixture,
    "manual_parser_output_packet",
    manualPacketFixturePath,
    manualOverlayFixturePath,
  );
}

function assertReceiptFixture(
  receipt,
  packet,
  overlay,
  expectedSourceKind,
  expectedPacketPath,
  expectedOverlayPath,
) {
  assert.equal(receipt.receipt_version, "research_candidate_formation_receipt.v0.1");
  assert.equal(receipt.scope, "project:augnes");
  assert.equal(receipt.source_kind, expectedSourceKind);
  assert.equal(receipt.source_packet_fixture_path, expectedPacketPath);
  assert.equal(receipt.source_overlay_fixture_path, expectedOverlayPath);
  assert.ok(receipt.artifact, "receipt artifact must exist");

  for (const family of [
    "source_refs",
    "candidate_nodes",
    "typed_edges",
    "packet_sections",
    "guardrails",
  ]) {
    assert.ok(Array.isArray(receipt[family]), `${family} must be an array`);
  }
  assert.ok(receipt.diagnostics, "receipt diagnostics must exist");

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
    ["writes_receipt", false],
    ["writes_event_log", false],
  ]) {
    assert.equal(receipt.authority[field], expected, `receipt authority.${field} must be ${expected}`);
  }

  for (const regex of [
    /not durable receipt storage/i,
    /not an event log/i,
    /not proof\/evidence/i,
    /not a work item/i,
    /not a perspective promotion/i,
    /not a provider call/i,
    /not retrieval/i,
    /not Codex execution/i,
    /not an external handoff/i,
  ]) {
    assert.match(receipt.non_authority_notice, regex, `notice must include ${regex}`);
  }

  assert.deepEqual(
    receipt.guardrails.map((guardrail) => guardrail.text),
    packet.final_guardrails,
    "receipt guardrails must correspond to packet final guardrails",
  );

  for (const sectionId of [
    "packet_section_source_summaries",
    "packet_section_claim_summaries",
    "packet_section_evidence_summaries",
    "packet_section_tension_summaries",
    "packet_section_knowledge_gap_summaries",
    "packet_section_perspective_delta_summaries",
    "packet_section_follow_up_summaries",
    "packet_section_target_perspective_summaries",
    "packet_section_final_guardrails",
  ]) {
    assert.ok(
      receipt.packet_sections.some((section) => section.section_id === sectionId),
      `receipt must include packet section ${sectionId}`,
    );
  }

  assert.deepEqual(
    receipt.candidate_nodes.map((node) => node.node_id).sort(),
    overlay.nodes
      .filter((node) => !["source_reference", "research_session", "target_perspective_anchor"].includes(node.kind))
      .map((node) => node.id)
      .sort(),
    "receipt candidate nodes must include every overlay candidate node only",
  );
  assert.deepEqual(
    receipt.typed_edges.map((edge) => edge.edge_id).sort(),
    overlay.edges.map((edge) => edge.id).sort(),
    "receipt typed edges must include every overlay edge",
  );
  assert.deepEqual(
    receipt.source_refs.map((sourceRef) => sourceRef.source_ref_id).sort(),
    collectExpectedSourceRefs(packet, overlay).sort(),
    "receipt source refs must include every packet or overlay source ref",
  );
}

function assertContributionMapping() {
  assertContributionMappingForFixture(receiptFixture, packetFixture, overlayFixture);
  assertContributionMappingForFixture(
    manualReceiptFixture,
    manualPacketFixture,
    manualOverlayFixture,
  );
}

function assertContributionMappingForFixture(receipt, packet, overlay) {
  const overlayNodeIds = new Set(overlay.nodes.map((node) => node.id));
  const overlayEdgeIds = new Set(overlay.edges.map((edge) => edge.id));
  for (const sourceRef of receipt.source_refs) {
    assert.ok(
      sourceRef.contributed_to_sections.length > 0,
      `${sourceRef.source_ref_id} must contribute to at least one section`,
    );
  }
  for (const node of receipt.candidate_nodes) {
    assert.ok(
      node.contributed_to_sections.length > 0,
      `${node.node_id} must contribute to at least one section`,
    );
    assert.ok(overlayNodeIds.has(node.node_id), `${node.node_id} must resolve to an overlay node`);
    assert.ok(
      overlay.nodes.some((overlayNode) => overlayNode.source_object_id === node.source_object_id),
      `${node.source_object_id} must resolve to an overlay node source object`,
    );
  }
  for (const edge of receipt.typed_edges) {
    assert.ok(
      edge.contributed_to_sections.length > 0,
      `${edge.edge_id} must contribute to at least one section`,
    );
    assert.ok(overlayEdgeIds.has(edge.edge_id), `${edge.edge_id} must resolve to an overlay edge`);
  }
  for (const section of receipt.packet_sections) {
    assert.equal(
      section.item_count,
      expectedSectionCount(packet, section.section_kind),
      `${section.section_id} item_count must match packet section length`,
    );
  }
  assert.equal(
    receipt.guardrails.length,
    packet.final_guardrails.length,
    "guardrail count must match packet final_guardrails length",
  );
  for (const guardrail of receipt.guardrails) {
    assert.ok(
      guardrail.contributed_to_sections.includes("packet_section_final_guardrails"),
      `${guardrail.guardrail_id} must contribute to packet_section_final_guardrails`,
    );
  }
}

function assertReceiptIdSafety() {
  assertReceiptIdsSafe(receiptFixture, overlayFixture);
  assertReceiptIdsSafe(manualReceiptFixture, manualOverlayFixture);
}

function assertReceiptIdsSafe(receipt, overlay) {
  const receiptIds = [
    receipt.artifact.artifact_id,
    ...receipt.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    ...receipt.candidate_nodes.map((node) => node.node_id),
    ...receipt.typed_edges.map((edge) => edge.edge_id),
    ...receipt.packet_sections.map((section) => section.section_id),
    ...receipt.guardrails.map((guardrail) => guardrail.guardrail_id),
  ];
  const rawDisplayValues = overlay.nodes
    .filter((node) => node.kind === "source_reference")
    .flatMap((node) => [node.label, node.summary])
    .filter((value) => typeof value === "string" && value.length > 8);

  for (const receiptId of receiptIds) {
    for (const rawValue of rawDisplayValues) {
      assert.ok(
        !receiptId.includes(rawValue),
        `${receiptId} must not include raw source display text`,
      );
    }
    assert.doesNotMatch(
      receiptId,
      /https?:\/\/|provider[_-]|thread[_-]|workspace[_-]|run[_-]|raw_session|session_example|demo[_-]/i,
      `${receiptId} must not include raw URL/provider/thread/run/session/demo text`,
    );
  }
}

function assertDiagnostics() {
  assertReceiptDiagnostics(receiptFixture, packetFixture, overlayFixture);
  assertReceiptDiagnostics(manualReceiptFixture, manualPacketFixture, manualOverlayFixture);
}

function assertReceiptDiagnostics(receipt, packet, overlay) {
  assert.equal(receipt.diagnostics.source_ref_contribution_count, receipt.source_refs.length);
  assert.equal(receipt.diagnostics.candidate_node_contribution_count, receipt.candidate_nodes.length);
  assert.equal(receipt.diagnostics.typed_edge_contribution_count, receipt.typed_edges.length);
  assert.equal(receipt.diagnostics.packet_section_contribution_count, receipt.packet_sections.length);
  assert.equal(receipt.diagnostics.guardrail_contribution_count, receipt.guardrails.length);
  assert.equal(receipt.diagnostics.source_packet_summary_count, packetSummaryCount(packet));
  assert.equal(receipt.diagnostics.source_overlay_node_count, overlay.diagnostics.node_count);
  assert.equal(receipt.diagnostics.source_overlay_edge_count, overlay.diagnostics.edge_count);
  assert.equal(receipt.diagnostics.unresolved_tension_count, overlay.diagnostics.unresolved_tension_count);
  assert.equal(receipt.diagnostics.knowledge_gap_count, packet.knowledge_gap_summaries.length);
  assert.equal(receipt.diagnostics.perspective_delta_count, packet.perspective_delta_summaries.length);
  assert.equal(receipt.diagnostics.follow_up_candidate_count, packet.follow_up_summaries.length);
  assert.equal(receipt.diagnostics.authority_guardrail_count, receipt.guardrails.length);
}

function assertCockpitReceiptComponent() {
  for (const requiredText of [
    "ResearchCandidateFormationReceipt",
    "receipt.artifact",
    "receipt.diagnostics",
    "Source ref contributions",
    "Candidate node contributions",
    "Typed edge contributions",
    "Packet section contributions",
    "Guardrail contributions",
    "receipt.authority",
    "read-only",
  ]) {
    assert.ok(receiptComponent.includes(requiredText), `receipt component must include ${requiredText}`);
  }

  for (const regex of [
    /not durable\s+receipt storage/i,
    /not an event log/i,
    /not proof\/evidence/i,
    /not a work\s+item/i,
    /not promotion authority/i,
  ]) {
    assert.match(receiptComponent, regex, `receipt component must include ${regex}`);
  }

  assertNoActionControls(receiptComponent, "receipt preview component");
}

function assertCockpitSection() {
  for (const requiredText of [
    "research-candidate-review.formation-receipt.sample.v0.1.json",
    "research-candidate-review.manual-note-formation-receipt.sample.v0.1.json",
    "ResearchCandidateFormationReceiptPreview",
    "ResearchCandidateFormationReceipt",
    "RESEARCH_CANDIDATE_REVIEW_FORMATION_RECEIPT_FIXTURE_PATH",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_FORMATION_RECEIPT_FIXTURE_PATH",
    'id="research-candidate-formation-receipt-preview"',
    'href="#research-candidate-formation-receipt-preview"',
    "Research Candidate Formation Receipt",
  ]) {
    assert.ok(cockpit.includes(requiredText), `cockpit must include ${requiredText}`);
  }

  const section = extractBetween(
    cockpit,
    "Research Candidate Formation Receipt Cockpit Preview Start",
    "Research Candidate Formation Receipt Cockpit Preview End",
  );
  assert.equal(
    (section.match(/<ResearchCandidateFormationReceiptPreview\b/g) ?? []).length,
    2,
    "cockpit receipt section must render two receipt previews",
  );
  assert.doesNotMatch(
    cockpit,
    new RegExp(`import\\s+\\{[^}]*${escapeRegExp(receiptBuilderFunctionName())}[^}]*\\}`),
    "cockpit must not import receipt builder functions",
  );
  assert.doesNotMatch(
    cockpit,
    new RegExp(`\\b${escapeRegExp(receiptBuilderFunctionName())}\\s*\\(`),
    "cockpit must not call receipt builder functions",
  );
  return section;
}

function assertReadOnlyUi(receiptSection) {
  assertNoActionControls(receiptSection, "cockpit receipt preview section");
  assertNoActionControls(receiptComponent, "receipt preview component");
}

function assertDocsPointers() {
  for (const requiredText of [
    "Formation Receipt preview",
    receiptTypePath,
    receiptBuilderPath,
    receiptFixturePath,
    manualReceiptFixturePath,
    receiptComponentPath,
    cockpitPath,
    "smoke:research-candidate-review-formation-receipt-v0-1",
    "read-only",
    "source refs",
    "candidate nodes",
    "typed edges",
    "PerspectiveGeometryDigest Builder v0.1",
    "types/perspective-geometry-digest.ts",
    "lib/research-candidate-review/perspective-geometry-digest.ts",
    "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json",
    "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json",
    "agent_perspective_substrate_docs_type_fixture_v0_1",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
  }

  for (const regex of [
    /AI context packet\s+sections/i,
    /no durable receipt storage|not durable receipt storage/i,
    /no event log|not an event log/i,
    /no proof\/evidence write|not proof\/evidence write/i,
    /no work item creation|not work item creation/i,
    /no perspective promotion|not perspective promotion/i,
    /no\s+runtime\/API\/DB\/provider\/retrieval\s+behavior/i,
  ]) {
    assert.match(surfaceDoc, regex, `surface doc must include ${regex}`);
  }
}

function assertGatePointer() {
  for (const regex of [
    /Formation Receipt preview preserves canonical promotion gates/i,
    /Receipt IDs\s+must not use raw source titles, URLs, provider IDs, raw thread\/run\/session\s+strings, arbitrary user strings, episode IDs, or demo refs/i,
    /Receipt\s+contributions are read-only and non-authoritative/i,
    /no\s+durable receipt storage, event log, runtime\/API\/DB\/provider\/retrieval, or\s+promotion behavior/i,
    /PerspectiveGeometryDigest Builder v0\.1 preserves canonical promotion\s+gates/i,
    /layout\s+coordinates as truth are explicitly forbidden/i,
    /agent_perspective_substrate_docs_type_fixture_v0_1/i,
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
    ["AI context packet smoke", packetSmoke],
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
  const pointerStart = index.indexOf("Formation Receipt preview");
  assert.notEqual(pointerStart, -1, "index must mention Formation Receipt preview");
  const pointer = index.slice(pointerStart, pointerStart + 2600);
  for (const requiredText of [
    receiptTypePath,
    receiptBuilderPath,
    receiptFixturePath,
    manualReceiptFixturePath,
    receiptComponentPath,
    cockpitPath,
    "smoke:research-candidate-review-formation-receipt-v0-1",
    "read-only receipt preview",
    "no durable receipt storage",
    "no event log",
    "no proof/evidence write",
    "no work item creation",
    "no perspective promotion",
    "no runtime/API/DB/provider/retrieval behavior",
  ]) {
    assert.ok(pointer.includes(requiredText), `index receipt pointer must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:research-candidate-review-formation-receipt-v0-1"],
    "node scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs",
    "package.json must expose the Formation Receipt smoke",
  );
}

function assertNoForbiddenImplementationPatterns(receiptSection) {
  const typeAndBuilderText = [receiptType, receiptBuilder].join("\n");
  assert.doesNotMatch(
    typeAndBuilderText,
    pattern(["use", " client"], "\\b", "\\b").regex,
    "type and builder files must not include client component markers",
  );

  const combinedStaticText = [
    receiptType,
    receiptBuilder,
    receiptFixtureText,
    manualReceiptFixtureText,
    receiptSection,
    receiptComponent,
    extractAround(surfaceDoc, "Formation Receipt Preview Pointer", 1800),
    extractAround(gateDoc, "Formation Receipt preview", 1400),
    extractAround(index, "Formation Receipt preview", 2600),
    receiptSmoke,
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
    pattern(["write", "Receipt", " implementation"], "\\b", "\\b"),
    pattern(["write", "Event", "Log", " implementation"], "\\b", "\\b"),
    pattern(["send", "Handoff", " implementation"], "\\b", "\\b"),
    pattern(["execute", "Codex", " implementation"], "\\b", "\\b"),
    pattern(["call", "Provider", " implementation"], "\\b", "\\b"),
    pattern(["run", "Retrieval", " implementation"], "\\b", "\\b"),
    pattern(["create", "WorkItem", " implementation"], "\\b", "\\b"),
    pattern(["promote", "Perspective", " implementation"], "\\b", "\\b"),
    pattern(["write", "Receipt"], "\\b", "\\s*\\("),
    pattern(["write", "Event", "Log"], "\\b", "\\s*\\("),
    pattern(["record", "Proof"], "\\b", "\\s*\\("),
    pattern(["record", "Evidence"], "\\b", "\\s*\\("),
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
      `Formation Receipt static text must not include ${label}`,
    );
  }
}

async function importReceiptBuilderModule() {
  const transformedSource = stripTypeScriptTypes(receiptBuilder, {
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
    pattern([receiptBuilderFunctionName()], "\\b", "\\s*\\("),
    pattern(["write", "Receipt"], "\\b", "\\b"),
    pattern(["write", "Event", "Log"], "\\b", "\\b"),
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

function collectExpectedSourceRefs(packet, overlay) {
  return uniqueSorted([
    ...packet.source_summaries.flatMap((summary) => summary.source_refs),
    ...packet.claim_summaries.flatMap((summary) => summary.source_refs),
    ...packet.evidence_summaries.flatMap((summary) => summary.source_refs),
    ...packet.tension_summaries.flatMap((summary) => summary.source_refs),
    ...packet.knowledge_gap_summaries.flatMap((summary) => summary.source_refs),
    ...packet.perspective_delta_summaries.flatMap((summary) => summary.source_refs),
    ...packet.follow_up_summaries.flatMap((summary) => summary.source_refs),
    ...overlay.nodes.flatMap((node) =>
      node.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    ),
    ...overlay.edges.flatMap((edge) =>
      edge.source_refs.map((sourceRef) => sourceRef.source_ref_id),
    ),
  ]);
}

function expectedSectionCount(packet, sectionKind) {
  if (sectionKind === "final_guardrails") {
    return packet.final_guardrails.length;
  }
  assert.ok(Array.isArray(packet[sectionKind]), `${sectionKind} must exist on packet`);
  return packet[sectionKind].length;
}

function packetSummaryCount(packet) {
  return [
    packet.source_summaries,
    packet.claim_summaries,
    packet.evidence_summaries,
    packet.tension_summaries,
    packet.knowledge_gap_summaries,
    packet.perspective_delta_summaries,
    packet.follow_up_summaries,
    packet.target_perspective_summaries,
  ].reduce((total, summaries) => total + summaries.length, 0);
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

function receiptBuilderFunctionName() {
  return ["buildResearchCandidate", "FormationReceipt"].join("");
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
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
