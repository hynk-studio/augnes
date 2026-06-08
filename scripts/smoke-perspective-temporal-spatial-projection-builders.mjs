import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const mapFile = "lib/perspective-ingest/perspective-temporal-spatial-map.ts";
const workbenchFile =
  "lib/perspective-ingest/perspective-workbench-projection.ts";
const agentBriefFile = "lib/perspective-ingest/perspective-agent-brief.ts";
const docFile =
  "docs/PERSPECTIVE_TEMPORAL_SPATIAL_PROJECTION_BUILDERS_V0_1.md";
const smokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const reportFile =
  "reports/2026-06-07-perspective-temporal-spatial-projection-builders.md";
const unitPreviewBuilderFile =
  "lib/perspective-ingest/perspective-unit-preview.ts";
const packetBuilderFile =
  "lib/perspective-ingest/episode-to-constellation-packet.ts";
const cockpitFile = "components/augnes-cockpit.tsx";
const chatGptFixtureFile =
  "fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const mapText = readFileSync(mapFile, "utf8");
const workbenchText = readFileSync(workbenchFile, "utf8");
const agentBriefText = readFileSync(agentBriefFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const unitPreviewBuilderText = readFileSync(unitPreviewBuilderFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const {
  buildPerspectiveTemporalUnderlayProjection,
  getPerspectiveSurfacesForTemporalNode,
  getPerspectiveTemporalNodesForSpatialNodeId,
  getPerspectiveTemporalUnderlayPrimaryPath,
  getPerspectiveTemporalUnderlaySatellites,
} = await import("../lib/perspective-ingest/perspective-temporal-spatial-map.ts");
const {
  buildPerspectiveWorkbenchProjection,
  getPerspectiveWorkbenchSelectedMaterial,
  getPerspectiveWorkbenchVisibleNextActions,
  getPerspectiveWorkbenchVisibleTensions,
} = await import("../lib/perspective-ingest/perspective-workbench-projection.ts");
const { buildPerspectiveAgentBrief } = await import(
  "../lib/perspective-ingest/perspective-agent-brief.ts"
);
const { buildPerspectiveIngestConstellationPreviewResponse } = await import(
  "../lib/perspective-ingest/episode-to-constellation-packet.ts"
);
const { buildManualPastedTextSessionEpisode } = await import(
  "../lib/perspective-ingest/manual-pasted-text-adapter.ts"
);

const allowedChangedFiles = new Set([
  mapFile,
  workbenchFile,
  agentBriefFile,
  docFile,
  smokeFile,
  packageFile,
  reportFile,
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  "docs/PERSPECTIVE_WORKBENCH_TEMPORAL_UNDERLAY_V0_1.md",
  "reports/browser/2026-06-07-perspective-workbench-temporal-underlay.md",
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
  "scripts/smoke-perspective-node-copy-humanization.mjs",
  "types/perspective-agent-brief.ts",
  "lib/readonly-api/perspective-agent-brief.ts",
  "app/api/augnes/read/perspective-agent-brief/route.ts",
  "docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-read-surface.md",
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-readonly-api-route-access-guard.mjs",
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs",
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs",
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs",
  "types/perspective-ingress-admission.ts",
  "lib/perspective-ingest/perspective-ingress-admission-model.ts",
  "docs/PERSPECTIVE_INGRESS_ADMISSION_MODEL_V0_1.md",
  "reports/2026-06-07-perspective-ingress-admission-model.md",
  "scripts/smoke-perspective-ingress-admission-model.mjs",
  "types/perspective-ingest-constellation-preview.ts",
  "lib/readonly-api/perspective-ingest-local-preview.ts",
  "app/api/augnes/read/perspective-ingest-local-preview/route.ts",
  "docs/PERSPECTIVE_LOCAL_MANUAL_INGRESS_ADMISSION_PREVIEW_V0_1.md",
  "reports/2026-06-07-perspective-local-manual-ingress-admission-preview.md",
  "scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs",
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
  "docs/PERSPECTIVE_INGRESS_ADMISSION_OBSERVATORY_SUMMARY_V0_1.md",
  "reports/browser/2026-06-07-perspective-ingress-admission-observatory-summary.md",
  "scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs",
  "docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-manual-ingress-context.md",
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:perspective-temporal-spatial-projection-builders"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
  "package.json must register smoke:perspective-temporal-spatial-projection-builders",
);

for (const file of [
  mapFile,
  workbenchFile,
  agentBriefFile,
  docFile,
  smokeFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Temporal-Spatial Projection Builders v0.1",
  "Purpose and Scope",
  "Human / Agent / Research Projection Model",
  "Why Builders Before UI Redesign",
  "Temporal Underlay Model",
  "Full Event Rail Preservation",
  "Spatial Node to Temporal Node Mapping",
  "Temporal Node to Cockpit Surface Mapping",
  "Human Workbench Projection Shape",
  "Agent Brief Projection Shape",
  "External API, OAuth, import, and export sources are future ingress providers",
  "ChatGPT Apps, Codex plugins, and agents are future consumption or handoff surfaces",
  "Augnes internal formation remains responsible for constellation construction, Event Rail structure, temporal placement, research perspective, and projection generation",
  "They are not implemented here",
  "prepare future ingress and consumption surfaces without coupling them",
  "Authority and Runtime Boundaries",
  "Out of Scope",
  "Simplify Perspective workbench with Temporal Underlay projection",
]);

for (const nodeId of [
  "session",
  "decision",
  "handoff",
  "pr",
  "review",
  "closeout",
  "current_view",
  "next_perspective",
]) {
  assert(
    mapText.includes(`"${nodeId}"`),
    `temporal map must contain temporal node id: ${nodeId}`,
  );
}

assert.deepEqual(getPerspectiveTemporalUnderlayPrimaryPath(), [
  "session",
  "decision",
  "handoff",
  "current_view",
  "next_perspective",
]);
assert.deepEqual(getPerspectiveTemporalUnderlaySatellites(), {
  parent: "handoff",
  items: ["pr", "review", "closeout"],
});

assertMapping("node.sample_chatgpt.source", undefined, ["session"]);
assertMapping("node.sample_chatgpt.user_intent", undefined, [
  "session",
  "decision",
]);
assertMapping("node.sample_chatgpt.product_concept", undefined, [
  "decision",
  "current_view",
]);
assertMapping("node.sample_chatgpt.decision", undefined, [
  "decision",
  "closeout",
]);
assertMapping("node.sample_chatgpt.unresolved_tension", undefined, [
  "decision",
  "next_perspective",
]);
assertMapping("node.sample_chatgpt.next_move", undefined, [
  "next_perspective",
]);
assertMapping("node.sample_chatgpt.packet", undefined, [
  "handoff",
  "review",
  "pr",
]);

for (const [nodeType, expectedTemporalNodes] of [
  ["source", ["session"]],
  ["user_intent", ["session", "decision"]],
  ["product_concept", ["decision", "current_view"]],
  ["decision", ["decision", "closeout"]],
  ["unresolved_tension", ["decision", "next_perspective"]],
  ["next_move", ["next_perspective"]],
  ["packet", ["handoff", "review", "pr"]],
  ["work_unit", ["decision", "closeout"]],
  ["work_context", ["decision", "closeout"]],
  ["changed_files", ["closeout"]],
  ["validation", ["review", "closeout"]],
  ["validation_report", ["review", "closeout"]],
  ["final_report", ["review", "closeout"]],
  ["blocker_risk", ["decision", "next_perspective"]],
]) {
  assertMapping(`node.future.${nodeType}`, nodeType, expectedTemporalNodes);
}

for (const temporalNodeId of [
  "session",
  "decision",
  "handoff",
  "pr",
  "review",
  "closeout",
  "current_view",
  "next_perspective",
]) {
  const surfaces = getPerspectiveSurfacesForTemporalNode(temporalNodeId);
  assert(
    surfaces.length > 0,
    `${temporalNodeId} must map to at least one Cockpit surface`,
  );
}
for (const surfaceId of ["overview", "work", "perspective", "bridge", "operator"]) {
  assert(
    mapText.includes(`"${surfaceId}"`),
    `temporal surface map must contain Cockpit surface id: ${surfaceId}`,
  );
}

const chatGptPreview = buildPerspectiveIngestConstellationPreviewResponse({
  episodes: [
    normalizeFixture(JSON.parse(readFileSync(chatGptFixtureFile, "utf8"))),
  ],
  source: "sample:chatgpt",
});

assert.equal(
  chatGptPreview.constellation.nodes.length,
  7,
  "sample ChatGPT preview must keep 7 nodes",
);
assert.equal(
  chatGptPreview.constellation.edges.length,
  8,
  "sample ChatGPT preview must keep 8 edges",
);
assert.equal(
  chatGptPreview.unresolved_tensions.length,
  2,
  "sample ChatGPT preview must keep 2 tensions",
);

const workbenchProjection = buildPerspectiveWorkbenchProjection({
  preview: chatGptPreview,
  selected_node_id: "node.sample_chatgpt.packet",
});
assert.equal(
  workbenchProjection.projection_version,
  "perspective_workbench_projection.v0.1",
);
assert.equal(workbenchProjection.source.query, "sample:chatgpt");
assert.equal(workbenchProjection.status.node_count, 7);
assert.equal(workbenchProjection.status.edge_count, 8);
assert.equal(workbenchProjection.status.tension_count, 2);
assert.equal(workbenchProjection.selected.title, "Review / Codex packets");
assert.deepEqual(workbenchProjection.selected.node_ids, [
  "node.sample_chatgpt.packet",
]);
assert(workbenchProjection.selected.edge_ids.length > 0);
assert(
  workbenchProjection.tensions.length <= 2,
  "workbench tensions must be capped at 2 by default",
);
assert(
  workbenchProjection.next_actions.length <= 2,
  "workbench next actions must be capped at 2 by default",
);
assert.equal(
  workbenchProjection.temporal_underlay.primary_path[0].id,
  "session",
);
assert.deepEqual(workbenchProjection.temporal_underlay.satellites.items.map((item) => item.id), [
  "pr",
  "review",
  "closeout",
]);
assert.deepEqual(workbenchProjection.authority, {
  mode: "advisory_local_preview",
  external_calls: false,
  persistence: false,
  codex_execution: false,
});
assert.equal(workbenchProjection.actions.copy_chatgpt_review_available, true);
assert.equal(workbenchProjection.actions.copy_codex_handoff_available, true);
assertNoPacketOrRawText("workbench projection", workbenchProjection, chatGptPreview);

assert.equal(
  getPerspectiveWorkbenchSelectedMaterial({
    preview: chatGptPreview,
    selected_node_id: "node.sample_chatgpt.user_intent",
  }).type,
  "user_intent",
);
assert(
  getPerspectiveWorkbenchVisibleTensions({ preview: chatGptPreview }).length <= 2,
  "visible workbench tensions helper must cap by default",
);
assert(
  getPerspectiveWorkbenchVisibleNextActions({ preview: chatGptPreview }).length <=
    2,
  "visible workbench next actions helper must cap by default",
);

const agentBrief = buildPerspectiveAgentBrief({
  preview: chatGptPreview,
  selected_node_id: "node.sample_chatgpt.packet",
});
assert.equal(agentBrief.brief_version, "perspective_brief.v0.1");
assert.equal(agentBrief.selected.id, "node.sample_chatgpt.packet");
assert.equal(agentBrief.spatial_context.node_count, 7);
assert.equal(agentBrief.spatial_context.edge_count, 8);
assert.deepEqual(agentBrief.temporal_context.primary_spine, [
  "session",
  "decision",
  "handoff",
  "current_view",
  "next_perspective",
]);
assert.deepEqual(agentBrief.temporal_context.satellites, {
  parent: "handoff",
  items: ["pr", "review", "closeout"],
});
assert(agentBrief.surface_context.related_surfaces.includes("bridge"));
assert(Array.isArray(agentBrief.tensions));
assert(Array.isArray(agentBrief.next_actions));
assert.equal(agentBrief.handoff.chatgpt_review_available, true);
assert.equal(agentBrief.handoff.codex_handoff_available, true);
assert.deepEqual(agentBrief.authority, {
  mode: "advisory_local_preview",
  external_calls: false,
  persistence: false,
  codex_execution: false,
});
assert.equal(agentBrief.refs.full_refs_available, true);
assert.equal(typeof agentBrief.refs.evidence_pointer_count, "number");
assertNoPacketOrRawText("agent brief", agentBrief, chatGptPreview);

const underlayProjection = buildPerspectiveTemporalUnderlayProjection({
  nodes: chatGptPreview.constellation.nodes,
  selected_node_id: "node.sample_chatgpt.packet",
});
assert.deepEqual(underlayProjection.highlighted_item_ids, [
  "handoff",
  "review",
  "pr",
]);

const manualPreview = buildPerspectiveIngestConstellationPreviewResponse({
  episodes: [
    buildManualPastedTextSessionEpisode({
      generatedAt: "2026-06-08T00:00:00.000Z",
      request: {
        input_kind: "manual:pasted_text",
        source_label: "Manual projection smoke",
        input_text: [
          "Intent: Review the manual temporal projection path.",
          "Concept: Manual pasted text should preserve work and validation context.",
          "Decision: Keep this projection builder local and read-only.",
          "Work: Add fallback mappings for manual work context.",
          "Changed: lib/perspective-ingest/perspective-temporal-spatial-map.ts",
          "Validation: npm run smoke:perspective-temporal-spatial-projection-builders",
          "Report: Manual work and validation nodes should highlight temporal items.",
          "Tension: Manual context must not imply proof writes.",
          "Next: Wire the projection in a later UI PR.",
        ].join("\n"),
      },
    }),
  ],
  routeId: "augnes.read.perspective-ingest-local-preview.v0.1",
  source: "manual:pasted_text",
});
assertManualTemporalProjection({
  expectedTemporalNodes: ["decision", "closeout"],
  nodeId: "node.manual_pasted_text.work_context",
  preview: manualPreview,
});
assertManualTemporalProjection({
  expectedTemporalNodes: ["review", "closeout"],
  nodeId: "node.manual_pasted_text.validation_report",
  preview: manualPreview,
});

assertContainsAll(cockpitText, [
  "perspectiveEventRailNodes",
  "perspectiveEventRailEdges",
  "perspectiveEventRailLanes",
  'data-augnes-event-rail-view="node-edge"',
  "data-augnes-rail-node-id={node.id}",
  "data-augnes-rail-edge-id={edge.id}",
]);
for (const nodeId of [
  "session",
  "decision",
  "handoff",
  "pr",
  "review",
  "closeout",
  "current_view",
  "next_perspective",
]) {
  assert(cockpitText.includes(`"${nodeId}"`), `Event Rail node id remains: ${nodeId}`);
}
for (const [edgeId, edgeType] of [
  ["session_to_decision", "informs"],
  ["decision_to_handoff", "packages"],
  ["handoff_to_review", "reviews"],
  ["handoff_to_pr_ref", "refs"],
  ["review_to_closeout", "closes"],
  ["closeout_to_current", "forms"],
  ["current_to_next", "suggests"],
]) {
  assert(cockpitText.includes(`id: "${edgeId}"`), `Event Rail edge id remains: ${edgeId}`);
  assert(cockpitText.includes(`type: "${edgeType}"`), `Event Rail edge type remains: ${edgeType}`);
}
assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

assertContainsAll(unitPreviewBuilderText, [
  "1. Purpose",
  "2. Selected Perspective Material",
  "3. Evidence",
  "4. Unresolved Tensions",
  "5. Next Action Candidates",
  "6. Suggested Use",
  "7. Compact Authority",
  "8. Base Packet Text",
]);
assertOrdered(unitPreviewBuilderText, [
  "1. Purpose",
  "2. Selected Perspective Material",
  "3. Evidence",
  "4. Unresolved Tensions",
  "5. Next Action Candidates",
  "6. Suggested Use",
  "7. Compact Authority",
  "8. Base Packet Text",
]);

for (const changedFile of collectChangedFiles()) {
  const isPerspectiveAgentBriefReadRoute =
    changedFile === "app/api/augnes/read/perspective-agent-brief/route.ts";
  const isExistingLocalPreviewRoute =
    changedFile ===
    "app/api/augnes/read/perspective-ingest-local-preview/route.ts";
  assert(
    allowedChangedFiles.has(changedFile),
    `projection-builder slice changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    (!changedFile.startsWith("app/api/") ||
      isPerspectiveAgentBriefReadRoute ||
      isExistingLocalPreviewRoute) &&
      !changedFile.startsWith("db/") &&
      !changedFile.startsWith("migrations/"),
    `projection-builder slice must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

for (const [file, text] of [
  [mapFile, mapText],
  [workbenchFile, workbenchText],
  [agentBriefFile, agentBriefText],
  [docFile, docText],
]) {
  for (const { label, test } of [
    { label: "fetch(", test: (value) => value.includes("fetch(") },
    { label: "api.github.com", test: (value) => value.includes("api.github.com") },
    { label: "api.openai.com", test: (value) => value.includes("api.openai.com") },
    { label: "process.env", test: (value) => value.includes("process.env") },
    { label: "GITHUB_TOKEN", test: (value) => value.includes("GITHUB_TOKEN") },
    { label: "OPENAI_API_KEY", test: (value) => value.includes("OPENAI_API_KEY") },
    { label: "use server", test: (value) => value.includes("use server") },
  ]) {
    assert.equal(
      test(text),
      false,
      `${file} must not add runtime/provider/GitHub plumbing: ${label}`,
    );
  }
}

for (const text of [mapText, workbenchText, agentBriefText]) {
  assert.equal(text.includes("JSON.stringify"), false, "builders must not add raw JSON dumps");
}

console.log("perspective temporal-spatial projection builders smoke passed");

function assertMapping(nodeId, nodeType, expectedTemporalNodes) {
  assert.deepEqual(
    getPerspectiveTemporalNodesForSpatialNodeId(nodeId, nodeType),
    expectedTemporalNodes,
    `${nodeId} should map to ${expectedTemporalNodes.join(", ")}`,
  );
}

function normalizeFixture(record) {
  return {
    episode_id: record.episode_id,
    source_kind: record.source_kind,
    source_ref: record.source_ref,
    source_label: record.source_label,
    title: record.title,
    summary: record.summary,
    synthetic_timestamp: record.synthetic_timestamp,
    actors: [...record.actors],
    public_safety: {
      synthetic: true,
      public_safe: true,
      sample_fixture_only: true,
      not_raw_private_history: true,
      no_credentials_or_secrets: true,
      no_proof_evidence_readiness_write: true,
      no_external_call: true,
      no_codex_execution_authority: true,
      boundary_notes: record.public_safety.boundary_notes,
    },
    user_intents: [...(record.user_intents ?? [])],
    product_concepts: [...(record.product_concepts ?? [])],
    decisions: [...(record.decisions ?? [])],
    work_units: [...(record.work_units ?? [])],
    changed_files: [...(record.changed_files ?? [])],
    validations: [...(record.validations ?? [])],
    final_report_points: [...(record.final_report_points ?? [])],
    evidence_refs: [...(record.evidence_refs ?? [])],
    unresolved_tensions: [...(record.unresolved_tensions ?? [])],
    next_actions: [...(record.next_actions ?? [])],
  };
}

function assertNoPacketOrRawText(label, projection, preview) {
  const serialized = JSON.stringify(projection);
  assert.equal(
    serialized.includes(preview.chatgpt_rendering_packet.packet_text),
    false,
    `${label} must not include full ChatGPT packet text`,
  );
  assert.equal(
    serialized.includes(preview.codex_handoff_packet.packet_text),
    false,
    `${label} must not include full Codex handoff packet text`,
  );
  assert.equal(
    serialized.includes("packet_text"),
    false,
    `${label} must not include packet_text fields`,
  );
  assert.equal(
    serialized.includes("source_refs"),
    false,
    `${label} must not include full source refs`,
  );
  assert.equal(
    serialized.includes("formation_receipt"),
    false,
    `${label} must not include FormationReceipt details`,
  );
}

function assertManualTemporalProjection({
  expectedTemporalNodes,
  nodeId,
  preview,
}) {
  const node = preview.constellation.nodes.find((item) => item.id === nodeId);
  assert(node, `manual preview must include ${nodeId}`);
  assert.deepEqual(
    getPerspectiveTemporalNodesForSpatialNodeId(node.id, node.type),
    expectedTemporalNodes,
    `${nodeId} must map through fallback node type`,
  );

  const workbench = buildPerspectiveWorkbenchProjection({
    preview,
    selected_node_id: nodeId,
  });
  assert.deepEqual(
    workbench.temporal_underlay.highlighted_item_ids,
    expectedTemporalNodes,
    `${nodeId} workbench projection must highlight temporal underlay items`,
  );

  const brief = buildPerspectiveAgentBrief({
    preview,
    selected_node_id: nodeId,
  });
  assert.deepEqual(
    brief.temporal_context.related_temporal_nodes,
    expectedTemporalNodes,
    `${nodeId} agent brief must include related temporal nodes`,
  );
  assert(
    brief.temporal_context.related_temporal_nodes.length > 0,
    `${nodeId} agent brief temporal highlights must be non-empty`,
  );
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function assertOrdered(text, snippets) {
  let cursor = -1;
  for (const snippet of snippets) {
    const nextIndex = text.indexOf(snippet, cursor + 1);
    assert.notEqual(nextIndex, -1, `Expected ordered snippet: ${snippet}`);
    assert(nextIndex > cursor, `Expected ${snippet} after previous section`);
    cursor = nextIndex;
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
