import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const overlayTypePath = "types/research-candidate-constellation-overlay.ts";
const overlayBuilderPath = "lib/research-candidate-review/constellation-overlay.ts";
const overlayFixturePath =
  "fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json";
const manualOverlayFixturePath =
  "fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json";
const reviewFixturePath = "fixtures/research-candidate-review.sample.v0.1.json";
const manualParserOutputFixturePath =
  "fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json";
const overlayComponentPath =
  "components/research-candidate-constellation-overlay-preview.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
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
  overlayTypePath,
  overlayBuilderPath,
  overlayFixturePath,
  manualOverlayFixturePath,
  reviewFixturePath,
  manualParserOutputFixturePath,
  overlayComponentPath,
  cockpitPath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  overlaySmokePath,
  parserOutputSmokePath,
  manualParserSmokePath,
  cockpitSmokePath,
  typeSmokePath,
  gateSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const overlayType = readFileSync(overlayTypePath, "utf8");
const overlayBuilder = readFileSync(overlayBuilderPath, "utf8");
const overlayFixtureText = readFileSync(overlayFixturePath, "utf8");
const manualOverlayFixtureText = readFileSync(manualOverlayFixturePath, "utf8");
const overlayFixture = JSON.parse(overlayFixtureText);
const manualOverlayFixture = JSON.parse(manualOverlayFixtureText);
const reviewFixtureText = readFileSync(reviewFixturePath, "utf8");
const reviewFixture = JSON.parse(reviewFixtureText);
const manualParserOutputFixtureText = readFileSync(
  manualParserOutputFixturePath,
  "utf8",
);
const manualParserOutputFixture = JSON.parse(manualParserOutputFixtureText);
const overlayComponent = readFileSync(overlayComponentPath, "utf8");
const cockpit = readFileSync(cockpitPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const overlaySmoke = readFileSync(overlaySmokePath, "utf8");
const parserOutputSmoke = readFileSync(parserOutputSmokePath, "utf8");
const manualParserSmoke = readFileSync(manualParserSmokePath, "utf8");
const cockpitSmoke = readFileSync(cockpitSmokePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const gateSmoke = readFileSync(gateSmokePath, "utf8");

assertOverlayTypeContract();
assertOverlayBuilderPurity();
await assertOverlayBuilderExecution();
assertOverlayFixtures();
assertNodeKindCoverage();
assertEdgeRelationCoverage();
assertNodeEdgeIdSafety();
assertDiagnostics();
assertCockpitOverlayComponent();
const overlaySection = assertCockpitSection();
assertReadOnlyUi(overlaySection);
assertDocsPointers();
assertGatePointer();
assertNextStepAlignment();
assertExistingSmokeAlignment();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns(overlaySection);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-constellation-overlay-v0-1",
      required_files_present: true,
      overlay_type_contract_checked: true,
      overlay_builder_purity_checked: true,
      overlay_builder_execution_checked: true,
      overlay_fixtures_checked: true,
      node_kind_coverage_checked: true,
      edge_relation_coverage_checked: true,
      node_edge_id_safety_checked: true,
      diagnostics_checked: true,
      cockpit_overlay_component_checked: true,
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

function assertOverlayTypeContract() {
  for (const exportName of [
    "ResearchCandidateConstellationOverlayVersion",
    "ResearchCandidateConstellationOverlaySourceKind",
    "ResearchCandidateConstellationNodeKind",
    "ResearchCandidateConstellationEdgeRelation",
    "ResearchCandidateConstellationAuthority",
    "ResearchCandidateConstellationSourceRef",
    "ResearchCandidateConstellationNode",
    "ResearchCandidateConstellationEdge",
    "ResearchCandidateConstellationDiagnostics",
    "ResearchCandidateConstellationOverlay",
    "ResearchCandidateConstellationOverlayFixture",
  ]) {
    assert.match(
      overlayType,
      new RegExp(`export\\s+(type|interface)\\s+${escapeRegExp(exportName)}\\b`),
      `overlay type file must export ${exportName}`,
    );
  }

  for (const literal of [
    "research_candidate_constellation_overlay.v0.1",
    "research_candidate_review_fixture",
    "manual_parser_output_fixture",
    "research_session",
    "source_reference",
    "claim_candidate",
    "evidence_candidate",
    "tension_candidate",
    "knowledge_gap_candidate",
    "perspective_delta_candidate",
    "follow_up_work_candidate",
    "target_perspective_anchor",
    "derived_from_source",
    "session_uses_source",
    "claim_supported_by_evidence",
    "claim_qualified_by_evidence",
    "claim_contradicted_by_evidence",
    "claim_contextualized_by_evidence",
    "claim_limited_by_evidence",
    "tension_relates_to_claim",
    "tension_relates_to_evidence",
    "gap_relates_to_claim",
    "gap_relates_to_tension",
    "delta_proposes_change_to_perspective",
    "delta_uses_claim_basis",
    "delta_uses_evidence_basis",
    "delta_preserves_tension",
    "delta_tracks_gap",
    "follow_up_derived_from_session",
    "follow_up_derived_from_source",
  ]) {
    assert.ok(overlayType.includes(`"${literal}"`), `overlay type file must include ${literal}`);
  }

  for (const requiredText of [
    "read_only: true",
    "candidate_only: true",
    "source_of_truth: false",
    "creates_evidence: false",
    "creates_proof: false",
    "commits_state: false",
    "promotes_perspective: false",
    "creates_work_item: false",
    "mutates_runtime: false",
    "executes_agents: false",
    "type-only",
    "non-authoritative",
  ]) {
    assert.ok(overlayType.includes(requiredText), `overlay type file must include ${requiredText}`);
  }
  assert.match(overlayType, /not a\s+\/\/\s+graph DB schema/, "overlay type file must state not a graph DB schema");
  assert.match(overlayType, /not a layout contract/, "overlay type file must state not a layout contract");
  assert.match(
    overlayType,
    /not perspective\s+\/\/\s+promotion authority/,
    "overlay type file must state not perspective promotion authority",
  );
}

function assertOverlayBuilderPurity() {
  for (const exportName of [
    "buildResearchCandidateConstellationOverlay",
    "buildResearchCandidateConstellationNodes",
    "buildResearchCandidateConstellationEdges",
    "getResearchCandidateConstellationAuthority",
  ]) {
    assert.match(
      overlayBuilder,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `overlay builder must export ${exportName}`,
    );
  }

  const importLines = overlayBuilder.match(/^import\s+.+$/gm) ?? [];
  assert.ok(importLines.length >= 2, "overlay builder must import type contracts");
  for (const importLine of importLines) {
    assert.match(importLine, /^import type\b/, "overlay builder imports must be type-only");
  }
  assert.doesNotMatch(
    overlayBuilder,
    /^import\s+(?!type\b)/m,
    "overlay builder must not import runtime modules",
  );

  for (const { label, regex } of [
    pattern(["node", ":fs"]),
    pattern(["node", ":http"]),
    pattern(["node", ":https"]),
    pattern(["child", "_process"]),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["process", ".env"], "\\b", "\\b"),
    pattern(["Date", ".now"], "\\b", "\\s*\\("),
    pattern(["Math", ".random"], "\\b", "\\s*\\("),
    pattern(["provider"], "\\b", "\\b", "i"),
    pattern(["open", "ai"], "\\b", "\\b", "i"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["embed", "ding"], "\\b", "\\b", "i"),
    pattern(["vec", "tor"], "\\b", "\\b", "i"),
    pattern(["r", "ag"], "\\b", "\\b", "i"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["use", " client"], "\\b", "\\b"),
    pattern(["force", "-directed"], "\\b", "\\b", "i"),
    pattern(["Force", "Atlas"], "\\b", "\\b"),
    pattern(["U", "MAP"], "\\b", "\\b"),
    pattern(["PaC", "MAP"], "\\b", "\\b"),
  ]) {
    assert.doesNotMatch(overlayBuilder, regex, `overlay builder must not include ${label}`);
  }
}

async function assertOverlayBuilderExecution() {
  const builderModule = await importOverlayBuilderModule();
  const staticOverlay = builderModule.buildResearchCandidateConstellationOverlay(
    reviewFixture,
    {
      source_kind: "research_candidate_review_fixture",
      source_fixture_path: reviewFixturePath,
    },
  );
  const manualOverlay = builderModule.buildResearchCandidateConstellationOverlay(
    manualParserOutputFixture.preview,
    {
      source_kind: "manual_parser_output_fixture",
      source_fixture_path: manualParserOutputFixturePath,
    },
  );

  assert.deepEqual(
    staticOverlay,
    overlayFixture,
    "builder output for the static fixture must match the expected overlay fixture exactly",
  );
  assert.deepEqual(
    manualOverlay,
    manualOverlayFixture,
    "builder output for the manual parser fixture must match the expected overlay fixture exactly",
  );
}

function assertOverlayFixtures() {
  assertOverlayFixture(
    overlayFixture,
    "research_candidate_review_fixture",
    overlayFixturePath,
    reviewFixturePath,
    reviewFixture,
  );
  assertOverlayFixture(
    manualOverlayFixture,
    "manual_parser_output_fixture",
    manualOverlayFixturePath,
    manualParserOutputFixturePath,
    manualParserOutputFixture.preview,
  );
}

function assertOverlayFixture(
  overlay,
  expectedSourceKind,
  fixturePath,
  expectedSourceFixturePath,
  preview,
) {
  assert.equal(overlay.overlay_version, "research_candidate_constellation_overlay.v0.1");
  assert.equal(overlay.scope, "project:augnes");
  assert.equal(overlay.source_kind, expectedSourceKind);
  assert.equal(overlay.source_fixture_path, expectedSourceFixturePath);
  assertOverlayAuthority(overlay.authority, `${fixturePath} overlay authority`);

  assert.ok(Array.isArray(overlay.nodes), `${fixturePath} nodes must be an array`);
  assert.ok(Array.isArray(overlay.edges), `${fixturePath} edges must be an array`);
  assert.ok(overlay.nodes.length > 0, `${fixturePath} nodes must be non-empty`);
  assert.ok(overlay.edges.length > 0, `${fixturePath} edges must be non-empty`);

  const nodeIds = new Set(overlay.nodes.map((node) => node.id));
  for (const node of overlay.nodes) {
    for (const field of [
      "id",
      "kind",
      "label",
      "summary",
      "source_family",
      "source_object_id",
      "display_order",
      "authority",
      "source_refs",
    ]) {
      assert.ok(Object.hasOwn(node, field), `${node.id} must include ${field}`);
    }
    assertOverlayAuthority(node.authority, `${node.id} authority`);
    assert.ok(Array.isArray(node.source_refs), `${node.id} source_refs must be an array`);
    if (node.kind === "target_perspective_anchor") {
      assert.match(
        node.target_perspective_key ?? "",
        /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
        `${node.id} target_perspective_key must be a stable dotted lower-case key`,
      );
      assertOverlayAuthority(node.authority, `${node.id} target perspective anchor authority`);
    }
  }

  for (const edge of overlay.edges) {
    for (const field of [
      "id",
      "source_node_id",
      "target_node_id",
      "relation",
      "label",
      "source_object_id",
      "source_refs",
      "authority",
    ]) {
      assert.ok(Object.hasOwn(edge, field), `${edge.id} must include ${field}`);
    }
    assert.ok(nodeIds.has(edge.source_node_id), `${edge.id} source_node_id must resolve`);
    assert.ok(nodeIds.has(edge.target_node_id), `${edge.id} target_node_id must resolve`);
    assertOverlayAuthority(edge.authority, `${edge.id} authority`);
    assert.ok(Array.isArray(edge.source_refs), `${edge.id} source_refs must be an array`);
  }

  assertDiagnosticsForOverlay(overlay, preview, fixturePath);
}

function assertOverlayAuthority(authority, label) {
  for (const [field, expected] of [
    ["read_only", true],
    ["candidate_only", true],
    ["source_of_truth", false],
    ["creates_evidence", false],
    ["creates_proof", false],
    ["commits_state", false],
    ["promotes_perspective", false],
    ["creates_work_item", false],
    ["mutates_runtime", false],
    ["executes_agents", false],
  ]) {
    assert.equal(authority?.[field], expected, `${label} ${field} must be ${expected}`);
  }
}

function assertNodeKindCoverage() {
  for (const [label, overlay] of [
    ["static overlay", overlayFixture],
    ["manual parser overlay", manualOverlayFixture],
  ]) {
    const kinds = new Set(overlay.nodes.map((node) => node.kind));
    for (const kind of [
      "research_session",
      "source_reference",
      "claim_candidate",
      "evidence_candidate",
      "tension_candidate",
      "knowledge_gap_candidate",
      "perspective_delta_candidate",
      "follow_up_work_candidate",
      "target_perspective_anchor",
    ]) {
      assert.ok(kinds.has(kind), `${label} must include ${kind} nodes`);
    }
  }
}

function assertEdgeRelationCoverage() {
  const relations = new Set(
    [...overlayFixture.edges, ...manualOverlayFixture.edges].map(
      (edge) => edge.relation,
    ),
  );
  for (const relation of [
    "session_uses_source",
    "derived_from_source",
    "claim_supported_by_evidence",
    "claim_limited_by_evidence",
    "tension_relates_to_claim",
    "tension_relates_to_evidence",
    "gap_relates_to_claim",
    "gap_relates_to_tension",
    "delta_proposes_change_to_perspective",
    "delta_uses_claim_basis",
    "delta_uses_evidence_basis",
    "delta_preserves_tension",
    "delta_tracks_gap",
    "follow_up_derived_from_session",
  ]) {
    assert.ok(relations.has(relation), `overlays must include ${relation}`);
  }

  if (
    reviewFixture.evidence_candidates.some(
      (evidence) => evidence.evidence_role === "qualifies",
    )
  ) {
    assert.ok(
      relations.has("claim_qualified_by_evidence"),
      "static fixture evidence_role qualifies must create claim_qualified_by_evidence",
    );
  }
}

function assertNodeEdgeIdSafety() {
  assertOverlayIdSafety(overlayFixture, reviewFixture, "static overlay");
  assertOverlayIdSafety(
    manualOverlayFixture,
    manualParserOutputFixture.preview,
    "manual parser overlay",
  );
}

function assertOverlayIdSafety(overlay, preview, label) {
  const rawValues = rawValuesThatMustNotBecomeIds(preview);
  const ids = [
    ...overlay.nodes.map((node) => node.id),
    ...overlay.edges.map((edge) => edge.id),
  ];
  for (const id of ids) {
    for (const rawValue of rawValues) {
      assert.ok(
        !id.includes(rawValue),
        `${label} id ${id} must not include raw value ${rawValue}`,
      );
    }
    for (const { label: patternLabel, regex } of [
      { label: "URL", regex: /https?:\/\//i },
      pattern(["provider", "_"], "\\b", "\\b", "i"),
      pattern(["thread", "_"], "\\b", "\\b", "i"),
      pattern(["run", "_"], "\\b", "\\b", "i"),
      pattern(["workspace", "_"], "\\b", "\\b", "i"),
      pattern(["demo", "_db"], "\\b", "\\b", "i"),
      pattern(["research", "_session", "_sample"], "\\b", "\\b", "i"),
      pattern(["research", "_session", "_manual", "_note"], "\\b", "\\b", "i"),
    ]) {
      assert.doesNotMatch(
        id,
        regex,
        `${label} id ${id} must not include ${patternLabel}`,
      );
    }
  }
}

function rawValuesThatMustNotBecomeIds(preview) {
  return [
    preview.research_session_preview.session_id,
    ...preview.source_reference_previews.flatMap((sourceRef) => [
      sourceRef.title,
      sourceRef.authors_or_origin,
      sourceRef.identifier_or_url,
    ]),
  ].filter((value) => typeof value === "string" && value.length > 3);
}

function assertDiagnostics() {
  assertDiagnosticsForOverlay(overlayFixture, reviewFixture, overlayFixturePath);
  assertDiagnosticsForOverlay(
    manualOverlayFixture,
    manualParserOutputFixture.preview,
    manualOverlayFixturePath,
  );
}

function assertDiagnosticsForOverlay(overlay, preview, label) {
  assert.equal(overlay.diagnostics.node_count, overlay.nodes.length, `${label} node_count must match`);
  assert.equal(overlay.diagnostics.edge_count, overlay.edges.length, `${label} edge_count must match`);
  assert.equal(
    overlay.diagnostics.source_reference_node_count,
    countNodes(overlay, "source_reference"),
    `${label} source_reference_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.claim_node_count,
    countNodes(overlay, "claim_candidate"),
    `${label} claim_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.evidence_node_count,
    countNodes(overlay, "evidence_candidate"),
    `${label} evidence_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.tension_node_count,
    countNodes(overlay, "tension_candidate"),
    `${label} tension_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.knowledge_gap_node_count,
    countNodes(overlay, "knowledge_gap_candidate"),
    `${label} knowledge_gap_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.perspective_delta_node_count,
    countNodes(overlay, "perspective_delta_candidate"),
    `${label} perspective_delta_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.follow_up_work_node_count,
    countNodes(overlay, "follow_up_work_candidate"),
    `${label} follow_up_work_node_count must match`,
  );
  assert.equal(
    overlay.diagnostics.target_perspective_anchor_count,
    countNodes(overlay, "target_perspective_anchor"),
    `${label} target_perspective_anchor_count must match`,
  );
  assert.equal(
    overlay.diagnostics.unresolved_tension_count,
    preview.tension_candidates.filter((tension) => tension.blocks_or_qualifies_promotion).length,
    `${label} unresolved_tension_count must match`,
  );
  assert.equal(
    overlay.diagnostics.promotion_ready_count,
    preview.perspective_delta_candidates.filter(
      (delta) => delta.promotion_readiness === "ready",
    ).length,
    `${label} promotion_ready_count must match`,
  );
  assert.equal(
    overlay.diagnostics.blocked_or_not_ready_delta_count,
    preview.perspective_delta_candidates.filter(
      (delta) =>
        delta.promotion_readiness === "blocked" ||
        delta.promotion_readiness === "not_ready",
    ).length,
    `${label} blocked_or_not_ready_delta_count must match`,
  );
}

function countNodes(overlay, kind) {
  return overlay.nodes.filter((node) => node.kind === kind).length;
}

function assertCockpitOverlayComponent() {
  for (const requiredText of [
    "ResearchCandidateConstellationOverlay",
    "diagnostics",
    "nodes",
    "edges",
    "authority",
    "read-only",
    "candidate-only",
    "not graph DB",
    "not layout",
    "not promotion authority",
  ]) {
    assert.ok(overlayComponent.includes(requiredText), `overlay preview component must include ${requiredText}`);
  }
  assertReadOnlyText(overlayComponent, "overlay preview component");
}

function assertCockpitSection() {
  for (const requiredText of [
    "research-candidate-review.constellation-overlay.sample.v0.1.json",
    "research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json",
    "ResearchCandidateConstellationOverlayPreview",
    "ResearchCandidateConstellationOverlay",
    "RESEARCH_CANDIDATE_REVIEW_CONSTELLATION_OVERLAY_FIXTURE_PATH",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_CONSTELLATION_OVERLAY_FIXTURE_PATH",
    'id="research-candidate-constellation-overlay-preview"',
    'href="#research-candidate-constellation-overlay-preview"',
    "Research Candidate Constellation Overlay Cockpit Preview Start",
    "Research Candidate Constellation Overlay Cockpit Preview End",
  ]) {
    assert.ok(cockpit.includes(requiredText), `Cockpit must include ${requiredText}`);
  }

  assert.doesNotMatch(
    cockpit,
    /import\s+\{[^}]*buildResearchCandidateConstellationOverlay[^}]*\}/,
    "Cockpit must not import runtime overlay builder functions",
  );
  assert.doesNotMatch(
    cockpit,
    /\bbuildResearchCandidateConstellationOverlay\s*\(/,
    "Cockpit must not call the overlay builder",
  );

  const section = extractBetween(
    cockpit,
    "Research Candidate Constellation Overlay Cockpit Preview Start",
    "Research Candidate Constellation Overlay Cockpit Preview End",
  );
  assert.match(section, /Candidate Constellation Overlay/, "overlay section must have visible title");
  assert.match(section, /read-only static overlay preview/i, "overlay section must state read-only static preview");
  assert.match(section, /candidate-only and\s+non-authoritative/i, "overlay section must state candidate-only and non-authoritative");
  assert.match(section, /no graph DB/i, "overlay section must state no graph DB");
  assert.match(section, /no layout\s+algorithm/i, "overlay section must state no layout algorithm");
  assert.match(section, /no embeddings/i, "overlay section must state no embeddings");
  assert.match(
    section,
    /no\s+runtime\/API\/DB\/provider\/retrieval\/promotion behavior/i,
    "overlay section must state no runtime/API/DB/provider/retrieval/promotion behavior",
  );
  assert.ok(
    section.match(/ResearchCandidateConstellationOverlayPreview/g)?.length === 2,
    "overlay section must render ResearchCandidateConstellationOverlayPreview twice",
  );
  assertReadOnlyText(section, "Cockpit overlay section");
  return section;
}

function assertReadOnlyUi(section) {
  assertReadOnlyText(section, "isolated overlay section");
  assertReadOnlyText(overlayComponent, "dedicated overlay component");
}

function assertReadOnlyText(source, label) {
  for (const forbidden of [
    "<button",
    "<form",
    "<input",
    "<textarea",
    "<select",
    "onClick=",
    "onSubmit=",
    ["fetch", "("].join(""),
    "fetchJson",
    'method: "POST"',
    'method: "PUT"',
    'method: "PATCH"',
    'method: "DELETE"',
    "/api/",
    "db/",
    "migrations/",
    "createResearchCandidate",
    "promotePerspective",
    "rejectCandidate",
    "createWorkItem",
    "recordProof",
    "recordEvidence",
    "executeCodex",
    "buildResearchCandidateConstellationOverlay(",
    "launch Codex",
    "merge",
    "publish",
    "retry",
    "replay",
    "deploy",
  ]) {
    assert.ok(!source.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Candidate Constellation Overlay preview",
    overlayTypePath,
    overlayBuilderPath,
    overlayFixturePath,
    manualOverlayFixturePath,
    overlayComponentPath,
    cockpitPath,
    "smoke:research-candidate-review-constellation-overlay-v0-1",
    "read-only",
    "candidate nodes",
    "typed edges",
    "not graph DB",
    "not layout",
    "not embeddings",
    "no runtime/API/DB/provider/retrieval/promotion behavior",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
  }
}

function assertGatePointer() {
  for (const requiredText of [
    "Node IDs and edge IDs must not use raw source titles",
    "provider",
    "thread/run/session",
    "Target perspective anchors are read-only and non-authoritative",
    "no graph DB",
    "layout algorithm",
    "runtime/API/DB/provider/retrieval",
    "promotion behavior",
  ]) {
    assert.ok(gateDoc.includes(requiredText), `gate doc must include ${requiredText}`);
  }
  assert.match(
    gateDoc,
    /Candidate Constellation Overlay preview preserves canonical promotion\s+gates/i,
    "gate doc must say Candidate Constellation Overlay preview preserves canonical promotion gates",
  );
}

function assertNextStepAlignment() {
  const expected = /Research Candidate Review v0\.1 milestone closeout docs/i;
  assert.match(
    extractSection(surfaceDoc, "## Next Recommended Step"),
    expected,
    "surface doc next step must mention Research Candidate Review v0.1 milestone closeout docs",
  );
  assert.match(
    extractSection(gateDoc, "## Next Recommended Step"),
    expected,
    "gate doc next step must mention Research Candidate Review v0.1 milestone closeout docs",
  );
}

function assertExistingSmokeAlignment() {
  for (const [label, source] of [
    ["parser output cockpit smoke", parserOutputSmoke],
    ["manual parser smoke", manualParserSmoke],
    ["cockpit smoke", cockpitSmoke],
    ["type smoke", typeSmoke],
    ["gate smoke", gateSmoke],
  ]) {
    assert.match(
      source,
      /Research Candidate Review v0\.1 milestone closeout docs/i,
      `${label} must expect Research Candidate Review v0.1 milestone closeout docs`,
    );
  }
}

function assertIndexPointer() {
  const pointerStart = index.indexOf("Candidate Constellation Overlay preview");
  assert.notEqual(pointerStart, -1, "index must mention Candidate Constellation Overlay preview");
  const pointer = index.slice(pointerStart, pointerStart + 2600);
  for (const requiredText of [
    overlayTypePath,
    overlayBuilderPath,
    overlayFixturePath,
    manualOverlayFixturePath,
    overlayComponentPath,
    cockpitPath,
    "smoke:research-candidate-review-constellation-overlay-v0-1",
    "read-only candidate nodes",
    "typed edges",
    "no graph DB",
    "no layout algorithm",
    "no embeddings",
    "no runtime/API/DB/provider/retrieval/promotion behavior",
    "no proof/evidence write",
    "no work item creation",
  ]) {
    assert.ok(pointer.includes(requiredText), `index pointer must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-review-constellation-overlay-v0-1"],
    "node scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs",
    "package.json must expose the constellation overlay smoke",
  );
}

function assertNoForbiddenImplementationPatterns(overlaySection) {
  const combinedStaticText = [
    overlayType,
    overlayBuilder,
    overlayFixtureText,
    manualOverlayFixtureText,
    overlaySection,
    overlayComponent,
    extractAround(surfaceDoc, "Candidate Constellation Overlay Pointer", 2600),
    extractAround(gateDoc, "Candidate Constellation Overlay preview", 1400),
    extractAround(index, "Candidate Constellation Overlay preview", 2600),
    overlaySmoke,
  ].join("\n\n");

  const forbiddenPatterns = [
    pattern(["child", "_process"], "\\b", "\\b"),
    pattern(["spawn"], "\\b", "\\s*\\("),
    pattern(["exec"], "\\b", "\\s*\\("),
    pattern(["exec", "File"], "\\b", "\\s*\\("),
    pattern(["api", ".github", ".com"], "\\b", "\\b"),
    pattern(["api", ".open", "ai", ".com"], "\\b", "\\b"),
    pattern(["GITHUB", "_TOKEN"], "\\b", "\\b"),
    pattern(["OPEN", "AI", "_API", "_KEY"], "\\b", "\\b"),
    pattern(["record", "-proof"], "\\b", "\\b"),
    pattern(["record", "-evidence"], "\\b", "\\b"),
    pattern(["commit", "State", "Update"], "\\b", "\\b"),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["XML", "Http", "Request"], "\\b", "\\b"),
    pattern(["Web", "Socket"], "\\b", "\\b"),
    pattern(["Event", "Source"], "\\b", "\\b"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["use", " client"], "\\b", "\\b"),
    pattern(["pris", "ma"], "\\b", "\\b", "i"),
    pattern(["sql", "ite"], "\\b", "\\b", "i"),
    pattern(["driz", "zle"], "\\b", "\\b", "i"),
    pattern(["supa", "base"], "\\b", "\\b", "i"),
    pattern(["embed", "dings", " implementation"], "\\b", "\\b", "i"),
    pattern(["vec", "tor", " search", " implementation"], "\\b", "\\b", "i"),
    pattern(["r", "ag", " implementation"], "\\b", "\\b", "i"),
    pattern(["force", "-directed", " implementation"], "\\b", "\\b", "i"),
    pattern(["layout", " engine", " implementation"], "\\b", "\\b", "i"),
    pattern(["U", "MAP", " implementation"], "\\b", "\\b"),
    pattern(["PaC", "MAP", " implementation"], "\\b", "\\b"),
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(
      combinedStaticText,
      regex,
      `constellation overlay static text must not include ${label}`,
    );
  }
}

async function importOverlayBuilderModule() {
  const transformedSource = stripTypeScriptTypes(overlayBuilder, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
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
  assert.notEqual(start, -1, `missing heading ${heading}`);
  const nextHeading = source.indexOf("\n## ", start + heading.length);
  return nextHeading === -1 ? source.slice(start) : source.slice(start, nextHeading);
}

function extractAround(source, needle, radius) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `missing ${needle}`);
  return source.slice(Math.max(0, index - radius), index + needle.length + radius);
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
