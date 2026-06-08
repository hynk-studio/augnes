import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_WORKBENCH_TEMPORAL_UNDERLAY_V0_1.md";
const smokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-workbench-temporal-underlay.md";
const projectionMapFile =
  "lib/perspective-ingest/perspective-temporal-spatial-map.ts";
const workbenchProjectionFile =
  "lib/perspective-ingest/perspective-workbench-projection.ts";
const agentBriefFile = "lib/perspective-ingest/perspective-agent-brief.ts";
const projectionDocFile =
  "docs/PERSPECTIVE_TEMPORAL_SPATIAL_PROJECTION_BUILDERS_V0_1.md";
const packetStructureSmokeFile =
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");
const packetStructureSmoke = readFileSync(packetStructureSmokeFile, "utf8");

const allowedChangedFiles = new Set([
  cockpitFile,
  cssFile,
  docFile,
  smokeFile,
  packageFile,
  browserReportFile,
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
  "scripts/smoke-perspective-node-copy-humanization.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
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
  "lib/perspective-ingest/perspective-agent-brief.ts",
  "docs/PERSPECTIVE_INGRESS_ADMISSION_OBSERVATORY_SUMMARY_V0_1.md",
  "reports/browser/2026-06-07-perspective-ingress-admission-observatory-summary.md",
  "scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs",
  "docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-manual-ingress-context.md",
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs",
  "lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts",
  "docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_HANDOFF_DOGFOOD_V0_1.md",
  "reports/2026-06-07-perspective-manual-agent-brief-handoff-dogfood.md",
  "scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-workbench-temporal-underlay"],
  "node scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
  "package.json must register smoke:cockpit-perspective-workbench-temporal-underlay",
);

for (const file of [
  docFile,
  smokeFile,
  projectionMapFile,
  workbenchProjectionFile,
  agentBriefFile,
  projectionDocFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(doc, [
  "# Perspective Workbench Temporal Underlay v0.1",
  "wires the Perspective projection builders into the default Perspective UI",
  "Human Workbench",
  "Agent Brief",
  "Research Substrate",
  "Temporal Underlay is the default temporal counterpart to the Starmap",
  "Full Event Rail node-edge remains available behind Temporal details",
  "Formation Basis, Lens, Scope, and source controls move behind View settings",
  "FormationReceipt, formation identity, authority fields, full refs",
  "Manual Gravity Preview",
  "The packet textarea is not rendered by default",
  "hides edge labels and edge summaries by default",
  "graph topology",
  "node ids",
  "node types",
  "edge ids",
  "edge types",
  "Handoff packet section order",
  "adds no API routes",
  "DB schema",
  "migrations",
  "persistence",
  "graph DB behavior",
  "provider/model/API calls",
  "GitHub mutation",
  "Codex execution",
  "proof/evidence/readiness writes",
  "OAuth/API source ingress",
  "ChatGPT Apps/Codex plugin integration",
  "Add Perspective Agent Brief read surface",
]);

assertContainsAll(cockpit, [
  "buildPerspectiveWorkbenchProjection",
  "const perspectiveWorkbenchProjection =",
  "perspectiveWorkbenchProjection?.source.query",
  "perspectiveWorkbenchProjection?.status.scope_label",
  "perspectiveWorkbenchProjection?.selected.title",
  "perspectiveWorkbenchProjection?.selected.summary",
  "perspectiveWorkbenchProjection?.tensions.map",
  "perspectiveWorkbenchProjection?.next_actions.map",
  "copy_chatgpt_review_available",
  "copy_codex_handoff_available",
  "open_packet_preview_available",
  "perspectiveWorkbenchProjection?.temporal_underlay",
]);

assertContainsAll(cockpit, [
  'data-augnes-region="perspective-primary-workbench"',
  'data-augnes-perspective-view="workbench-temporal-underlay"',
  'data-augnes-default-density="minimal"',
  'data-augnes-region="perspective-temporal-underlay"',
  'data-augnes-temporal-underlay-version="perspective_temporal_underlay.v0.1"',
  'data-augnes-temporal-underlay-density="compact"',
  "data-augnes-temporal-underlay-item-id={item.id}",
  "data-augnes-temporal-underlay-highlighted",
  "data-augnes-temporal-underlay-role={item.role}",
]);

assertContainsAll(cockpit, [
  "Perspective",
  "Local graph preview for reviewing relationships, tensions, and next steps.",
  "Current Perspective Starmap",
  "Selected material",
  "Tensions",
  "Next steps",
  "Copy ChatGPT Review Packet",
  "Copy Codex Handoff Packet",
  "Open packet preview",
  "Temporal Underlay",
  "Session - Decision - Handoff - Current View - Next Perspective",
  "Handoff satellites",
]);

assertContainsAll(cockpit, [
  'data-augnes-region="event-rail"',
  'data-augnes-event-rail-view="node-edge"',
  "data-augnes-rail-node-id={node.id}",
  "data-augnes-rail-edge-id={edge.id}",
  "PR reference node connected from Handoff",
  "referenceNode: event.id === \"pr\"",
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
    cockpit.includes(`"${nodeId}"`),
    `Event Rail node id must remain in Cockpit source: ${nodeId}`,
  );
}

for (const edgeId of [
  "session_to_decision",
  "decision_to_handoff",
  "handoff_to_review",
  "handoff_to_pr_ref",
  "review_to_closeout",
  "closeout_to_current",
  "current_to_next",
]) {
  assert(
    cockpit.includes(`"${edgeId}"`),
    `Event Rail edge id must remain in Cockpit source: ${edgeId}`,
  );
}

assertContainsAll(cockpit, [
  'open={perspectiveViewSettingsOpen}',
  'open={perspectiveTemporalDetailsOpen}',
  'open={perspectiveObservatoryDetailsOpen}',
  'open={perspectiveFullRefsDetailsOpen}',
  'open={perspectiveAdvancedPreviewControlsOpen}',
  'open={handoffPacketOpen}',
  "perspectiveTemporalDetailsOpen ? (",
  "perspectiveObservatoryDetailsOpen ? (",
  "perspectiveFullRefsDetailsOpen ? (",
  "perspectiveAdvancedPreviewControlsOpen ? (",
  "handoffPacketOpen ? (",
  "advancedDiagnosticsOpen ? (",
  "setPerspectiveObservatoryDetailsOpen(event.currentTarget.open)",
  "setPerspectiveFullRefsDetailsOpen(event.currentTarget.open)",
]);

assertOrder(
  cockpit,
  ["perspectiveTemporalDetailsOpen ? (", 'data-augnes-region="event-rail"'],
  "Full Event Rail must render only after Temporal details opens",
);
assertOrder(
  cockpit,
  ["perspectiveAdvancedPreviewControlsOpen ? (", "Manual Gravity Preview"],
  "Manual Gravity must render only after Advanced preview controls opens",
);
assertOrder(
  cockpit,
  ["handoffPacketOpen ? (", "<textarea"],
  "packet textarea must render only after packet preview opens",
);
assertOrder(
  cockpit,
  ["perspectiveObservatoryDetailsOpen ? (", "Formation receipt details"],
  "FormationReceipt details must render only after Observatory details opens",
);
assertOrder(
  cockpit,
  ["perspectiveFullRefsDetailsOpen ? (", "Evidence pointers"],
  "Full refs details must render only after Full refs details opens",
);

const observatoryDetailsSource = extractBetween(
  cockpit,
  'className="perspective-workbench-detail-panel perspective-observatory-details"',
  '<div className="perspective-constellation-workspace-grid perspective-workbench-layout">',
);
assert.equal(
  observatoryDetailsSource.includes("perspectiveFullRefsDetailsOpen"),
  false,
  "top Observatory details must not depend on Full refs details state",
);
const fullRefsDetailsSource = extractBetween(
  cockpit,
  'className="perspective-inspector-section perspective-inspector-details perspective-inspector-evidence-next"',
  '<section className="perspective-inspector-section perspective-selection-action-menu">',
);
assert.equal(
  fullRefsDetailsSource.includes("perspectiveObservatoryDetailsOpen"),
  false,
  "inspector Full refs details must not depend on Observatory details state",
);

assertContainsAll(cockpit, [
  "const showEdgeLabels =",
  "!workspace && shouldShowPerspectiveIngestGraphEdgeLabels(nodes, edges)",
  'surface="workspace"',
  "formatPerspectiveIngestGraphNodeLabel",
  'source: "Sample record"',
  'user_intent: "User goal"',
  'product_concept: "Preview concept"',
  'decision: "Fixture decision"',
  'unresolved_tension: "Limitation"',
  'next_move: "Next step"',
  'packet: "Review packets"',
]);

assertContainsAll(css, [
  "perspective-primary-workbench",
  "perspective-workbench-status-row",
  "perspective-workbench-layout",
  "perspective-workbench-starmap-panel",
  "perspective-workbench-selected-panel",
  "perspective-workbench-action-row",
  "perspective-temporal-underlay",
  "perspective-temporal-underlay-primary",
  "perspective-temporal-underlay-item",
  "perspective-temporal-underlay-satellite",
  "perspective-workbench-details-stack",
]);

for (const header of [
  "1. Purpose",
  "2. Selected Perspective Material",
  "3. Evidence",
  "4. Unresolved Tensions",
  "5. Next Action Candidates",
  "6. Suggested Use",
  "7. Compact Authority",
  "8. Base Packet Text",
]) {
  assert(
    packetStructureSmoke.includes(header),
    `packet section order smoke must still cover: ${header}`,
  );
}

for (const file of collectChangedFiles()) {
  const isPerspectiveAgentBriefReadRoute =
    file === "app/api/augnes/read/perspective-agent-brief/route.ts";
  const isExistingLocalPreviewRoute =
    file === "app/api/augnes/read/perspective-ingest-local-preview/route.ts";
  assert(
    allowedChangedFiles.has(file),
    `workbench temporal underlay slice changed an out-of-scope file: ${file}`,
  );
  assert(
    (!file.startsWith("app/api/") ||
      isPerspectiveAgentBriefReadRoute ||
      isExistingLocalPreviewRoute) &&
      !file.startsWith("db/") &&
      !file.startsWith("migrations/"),
    `slice must not add API routes, DB changes, or migrations: ${file}`,
  );
}

const perspectiveWorkbenchSource = extractBetween(
  cockpit,
  '<PageHeader\n        eyebrow="AUGNES / Perspective"',
  "function LedgerTab",
);

for (const forbidden of [
  "fetch(",
  "api.github.com",
  "api.openai.com",
  "process.env",
  "GITHUB_TOKEN",
  "OPENAI_API_KEY",
  "use server",
]) {
  assert.equal(
    perspectiveWorkbenchSource.includes(forbidden),
    false,
    `Perspective workbench slice must not add runtime/provider/GitHub plumbing: ${forbidden}`,
  );
}

assert.equal(
  /\brulecraft\b/i.test(perspectiveWorkbenchSource),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit UI",
);

console.log("cockpit perspective workbench temporal underlay smoke passed");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function assertOrder(text, snippets, message) {
  let cursor = -1;
  for (const snippet of snippets) {
    const next = text.indexOf(snippet, cursor + 1);
    assert(next > cursor, `${message}: expected ordered snippet ${snippet}`);
    cursor = next;
  }
}

function extractBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  assert.notEqual(startIndex, -1, `Expected start marker: ${start}`);
  const endIndex = text.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `Expected end marker after ${start}: ${end}`);
  return text.slice(startIndex, endIndex);
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  return Array.from(new Set([...workingTreeFiles, ...branchFiles])).filter(Boolean);
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
