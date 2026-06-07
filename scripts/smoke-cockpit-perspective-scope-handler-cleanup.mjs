import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_SCOPE_HANDLER_CLEANUP_V0_1.md";
const smokeFile = "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs";

const cockpit = readFileSync(cockpitFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  "docs/PERSPECTIVE_PRIMARY_ADVANCED_DIAGNOSTICS_COLLAPSE_V0_1.md",
  "docs/PERSPECTIVE_AUTHORITY_COPY_COLLAPSE_V0_1.md",
  "docs/PERSPECTIVE_HANDOFF_PACKET_COPY_TO_AGENT_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_HANDOFF_PACKET_STRUCTURE_REVIEW_V0_1.md",
  "docs/PERSPECTIVE_OVERLAY_FOCUS_AGENT_SEMANTICS_V0_1.md",
  "docs/PERSPECTIVE_SCOPE_HANDLER_CLEANUP_V0_1.md",
  "docs/PERSPECTIVE_EVENT_RAIL_NODE_EDGE_V0_1.md",
  "docs/PERSPECTIVE_NODE_COPY_HUMANIZATION_V0_1.md",
  "docs/PERSPECTIVE_WORKBENCH_TEMPORAL_UNDERLAY_V0_1.md",
  "lib/perspective-ingest/episode-to-constellation-packet.ts",
  "lib/perspective-ingest/perspective-unit-preview.ts",
  "package.json",
  "reports/browser/2026-06-07-perspective-primary-advanced-diagnostics-collapse.md",
  "reports/browser/2026-06-07-perspective-authority-copy-collapse.md",
  "reports/browser/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md",
  "reports/browser/2026-06-07-perspective-handoff-packet-structure-review.md",
  "reports/browser/2026-06-07-perspective-overlay-focus-agent-semantics.md",
  "reports/browser/2026-06-07-perspective-scope-handler-cleanup.md",
  "reports/browser/2026-06-07-perspective-event-rail-node-edge.md",
  "reports/browser/2026-06-07-perspective-node-copy-humanization.md",
  "reports/browser/2026-06-07-perspective-workbench-temporal-underlay.md",
  "reports/dogfood/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
  "scripts/smoke-perspective-node-copy-humanization.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-scope-handler-cleanup"],
  "node scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "package.json must register smoke:cockpit-perspective-scope-handler-cleanup",
);

assertContainsAll(cockpit, [
  "type PerspectiveScopeTransitionOptions =",
  "type PerspectiveManualSelectionScopeOptions =",
  "function selectPerspectiveLensOnly(",
  "function handlePerspectiveLensControlClick(",
  "function applyPerspectiveScope(",
  "function selectWholeConstellationScope(",
  "function selectConnectedNodeScope(",
  "function selectPerspectiveNodeScope(",
  "function selectClusterScope(",
  "function selectPerspectiveClusterScope(",
  "function selectManualSelectionScope(",
  "function setPerspectiveHandoffTarget(",
  "function openPerspectiveConstellationHandoffPacket(",
]);

assert.equal(
  cockpit.includes("function selectPerspectiveConstellationLens("),
  false,
  "old mixed Lens handler should be removed instead of remaining primary",
);

const lensOnlySource = getNamedFunctionText(cockpit, "selectPerspectiveLensOnly");
for (const forbidden of [
  "setPerspectiveConstellationSelectionScope(",
  "setSelectedPerspectiveIngestNodeId(",
  "setSelectedPerspectiveIngestClusterId(",
  "setPerspectiveHandoffTarget(",
  "setSelectedPerspectiveIngestPacketTarget(",
]) {
  assert.equal(
    lensOnlySource.includes(forbidden),
    false,
    `selectPerspectiveLensOnly must not mutate scope, selection, or packet target: ${forbidden}`,
  );
}

assertContainsAll(getNamedFunctionText(cockpit, "applyPerspectiveScope"), [
  "setPerspectiveConstellationSelectionScope(scope);",
  "options.nodeId",
  "options.clusterId",
  "options.clearNode",
  "options.clearCluster",
  "options.packetTarget",
  "options.syncLens",
  "options.notice",
]);

const lensControlSource = getNamedFunctionText(
  cockpit,
  "handlePerspectiveLensControlClick",
);
assertContainsAll(lensControlSource, [
  'selectWholeConstellationScope({ syncLens: "whole_constellation" });',
  'selectConnectedNodeScope({ syncLens: "connected_nodes" });',
  'syncLens: "open_tensions"',
  "previous local inspection fallback explicit",
  'syncLens: "next_candidates"',
  "current local preview fallback",
  'selectPerspectiveLensOnly("codex_handoff")',
  'setPerspectiveHandoffTarget("codex_handoff")',
]);

const scopeControlsSource = extractScopeControlsSource(cockpit);
assertContainsAll(scopeControlsSource, [
  "selectWholeConstellationScope",
  "selectConnectedNodeScope",
  "selectClusterScope",
  "selectManualSelectionScope",
]);
for (const forbidden of [
  "selectPerspectiveConstellationLens",
  "previewPerspectiveConstellationUnit",
  "markPerspectiveConstellationNextCandidatePreview",
]) {
  assert.equal(
    scopeControlsSource.includes(forbidden),
    false,
    `Scope controls must not call Lens or action-menu handlers directly: ${forbidden}`,
  );
}

const inspectorActionsSource = extractInspectorActionsSource(cockpit);
assertContainsAll(inspectorActionsSource, [
  "Copy ChatGPT Review Packet",
  "Copy Codex Handoff Packet",
  "Open packet preview",
  "copyPerspectiveConstellationScopedChatGptPacket",
  "copyPerspectiveConstellationScopedCodexHandoffPacket",
  "onClick={openPerspectiveConstellationHandoffPacket}",
]);
for (const oldDefaultActionHandler of [
  "inspectPerspectiveConstellationConnectedNodes",
  "previewPerspectiveConstellationUnit",
  "markPerspectiveConstellationNextCandidatePreview",
]) {
  assert.equal(
    inspectorActionsSource.includes(oldDefaultActionHandler),
    false,
    `default workbench action row should not include old dense action handler: ${oldDefaultActionHandler}`,
  );
}

assertContainsAll(getNamedFunctionText(cockpit, "inspectPerspectiveConstellationConnectedNodes"), [
  'selectConnectedNodeScope({ syncLens: "connected_nodes" });',
]);
assertContainsAll(getNamedFunctionText(cockpit, "previewPerspectiveConstellationUnit"), [
  'selectClusterScope({ packetTarget: "chatgpt_review" });',
]);
assertContainsAll(getNamedFunctionText(cockpit, "markPerspectiveConstellationNextCandidatePreview"), [
  "selectManualSelectionScope({",
  'syncLens: "next_candidates"',
  "Marked as next candidate preview",
]);

const formationApplySource = getNamedFunctionText(
  cockpit,
  "applyPerspectiveFormationBasisSwitch",
);
assertContainsAll(formationApplySource, [
  "Formation Basis controls how the local preview was formed",
  'selectWholeConstellationScope({ syncLens: "whole_constellation" });',
  "selectManualSelectionScope();",
  "writeFormationSwitchAcknowledgementToStorage",
]);
assert.equal(
  formationApplySource.includes("setPerspectiveConstellationSelectionScope("),
  false,
  "Formation Basis apply should delegate scope mutation to named helpers",
);

const handoffOpenSource = getNamedFunctionText(
  cockpit,
  "openPerspectiveConstellationHandoffPacket",
);
assertContainsAll(handoffOpenSource, [
  "setHandoffPacketOpen(true)",
  'setPerspectiveHandoffTarget("codex_handoff")',
]);
assert.equal(
  handoffOpenSource.includes("setPerspectiveConstellationSelectionScope("),
  false,
  "Open Handoff Packet must not mutate graph scope",
);
assert.equal(
  handoffOpenSource.includes("setSelectedPerspectiveConstellationLens("),
  false,
  "Open Handoff Packet must not mutate Lens",
);

assertContainsAll(cockpit, [
  "Formation Basis · Switch View",
  "Apply View",
  "Cancel",
  "Switch to Current View?",
  "Switch to Manual Selection View?",
  "Historical Snapshot is disabled / future behavior",
  "Auto Proposal is disabled / future behavior",
  "Experimental is disabled / future behavior",
  "Event Rail",
  "Archive / Present / Future",
  "Archive Entry Card",
  "Current View Card",
  "Future Candidate Card",
  "Perspective",
  "Local graph preview for reviewing relationships, tensions, and next steps.",
  "workbench-temporal-underlay",
  "Current Perspective Starmap",
  "Observatory Controls",
  "Formation Basis",
  "Lens",
  "Scope",
  "Source",
]);

assertContainsAll(doc, [
  "# Perspective Scope Handler Cleanup v0.1",
  "handler-boundary cleanup slice",
  "Formation Basis = how the local preview was formed",
  "Lens = how the current starmap is inspected",
  "Scope = what graph material is selected",
  "Handoff Target = ChatGPT Review or Codex Handoff packet preview target",
  "selectPerspectiveLensOnly",
  "applyPerspectiveScope",
  "open_tensions",
  "next_candidates",
  "No new API routes",
  "No DB schema changes",
  "No persistence changes",
  "No graph DB",
  "No provider, model, or API call",
  "No GitHub mutation",
  "No Codex execution",
  "No Rulecraft exposure",
  "No historical snapshot persistence",
  "No delta engine",
  "npm run smoke:cockpit-perspective-scope-handler-cleanup",
]);

assert.equal(
  /\brulecraft\b/i.test(cockpit),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit source",
);

const handlerSource = extractBetween(
  cockpit,
  "function selectPerspectiveLensOnly(",
  "function applyManualGravityPreview(",
);
for (const forbidden of [
  "api.openai.com",
  "api.github.com",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "Octokit",
  "axios",
  "fetch(",
  "use server",
]) {
  assert.equal(
    handlerSource.includes(forbidden),
    false,
    `scope handler cleanup must not add runtime/provider/GitHub plumbing: ${forbidden}`,
  );
}

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `scope handler cleanup slice changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    !changedFile.startsWith("app/api/") &&
      !changedFile.startsWith("db/") &&
      !changedFile.startsWith("migrations/"),
    `scope handler cleanup must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

console.log("cockpit perspective scope handler cleanup smoke passed");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getNamedFunctionText(sourceText, functionName) {
  const functionText = findNamedFunctionText(sourceText, functionName);
  assert(functionText, `${functionName} helper must exist`);
  return functionText;
}

function findNamedFunctionText(sourceText, functionName) {
  const startIndex = sourceText.indexOf(`function ${functionName}(`);
  if (startIndex < 0) return null;

  const signatureOpenIndex = sourceText.indexOf("(", startIndex);
  assert(signatureOpenIndex >= 0, `${functionName} helper must have a signature`);

  let parenDepth = 0;
  let signatureCloseIndex = -1;
  for (let index = signatureOpenIndex; index < sourceText.length; index += 1) {
    const character = sourceText[index];
    if (character === "(") parenDepth += 1;
    if (character === ")") parenDepth -= 1;
    if (parenDepth === 0) {
      signatureCloseIndex = index;
      break;
    }
  }

  assert(signatureCloseIndex >= 0, `${functionName} helper signature must close`);
  const bodyStartIndex = sourceText.indexOf("{", signatureCloseIndex);
  assert(bodyStartIndex >= 0, `${functionName} helper must have a body`);

  let braceDepth = 0;
  for (let index = bodyStartIndex; index < sourceText.length; index += 1) {
    const character = sourceText[index];
    if (character === "{") braceDepth += 1;
    if (character === "}") braceDepth -= 1;
    if (braceDepth === 0) {
      return sourceText.slice(startIndex, index + 1);
    }
  }

  assert.fail(`${functionName} helper body must be closed`);
}

function extractScopeControlsSource(text) {
  const marker = 'aria-label="Perspective Constellation scope options"';
  const markerIndex = text.indexOf(marker);
  assert.notEqual(markerIndex, -1, "Scope controls marker should exist");
  const start = text.lastIndexOf("<div", markerIndex);
  const end = text.indexOf("</div>", markerIndex);
  assert.notEqual(start, -1, "Scope controls opening div should exist");
  assert.notEqual(end, -1, "Scope controls closing div should exist");
  return text.slice(start, end + "</div>".length);
}

function extractInspectorActionsSource(text) {
  const marker = "perspective-selection-action-menu";
  const markerIndex = text.indexOf(marker);
  assert.notEqual(markerIndex, -1, "Inspector actions marker should exist");
  const start = text.lastIndexOf("<section", markerIndex);
  const end = text.indexOf("</section>", markerIndex);
  assert.notEqual(start, -1, "Inspector actions opening section should exist");
  assert.notEqual(end, -1, "Inspector actions closing section should exist");
  return text.slice(start, end + "</section>".length);
}

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Expected start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected end marker: ${endMarker}`);
  return text.slice(start, end);
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
