import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_EVENT_RAIL_NODE_EDGE_V0_1.md";
const smokeFile = "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-event-rail-node-edge.md";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  docFile,
  "docs/PERSPECTIVE_NODE_COPY_HUMANIZATION_V0_1.md",
  "lib/perspective-ingest/episode-to-constellation-packet.ts",
  packageFile,
  smokeFile,
  browserReportFile,
  "reports/browser/2026-06-07-perspective-node-copy-humanization.md",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
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
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
  "scripts/smoke-perspective-node-copy-humanization.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-event-rail-node-edge"],
  "node scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "package.json must register smoke:cockpit-perspective-event-rail-node-edge",
);

assertContainsAll(cockpit, [
  "type PerspectiveEventRailNode",
  "type PerspectiveEventRailEdge",
  "type PerspectiveEventRailLane",
  "perspectiveEventRailNodes",
  "perspectiveEventRailEdges",
  "perspectiveEventRailLanes",
  'data-augnes-region="event-rail"',
  'data-augnes-event-rail-view="node-edge"',
  "data-augnes-rail-node-id={node.id}",
  "data-augnes-rail-node-role={node.temporalRole}",
  "data-augnes-rail-edge-id={edge.id}",
  "data-augnes-rail-edge-type={edge.type}",
  "data-augnes-rail-authority={node.authority}",
  "data-augnes-rail-selected-node-id",
  "Archive flow: Session to Decision to Handoff to Review to Closeout",
  "PR reference node connected from Handoff",
  "Present flow: Closeout forms Current View",
  "Future flow: Current View suggests Next Perspective",
  "Handoff reference",
  "Event Rail temporal entry card",
  "perspective-event-rail-entry-details",
  "Details gated below",
  "PR entries are review pointers for local inspection.",
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
    `Event Rail node id should remain stable: ${nodeId}`,
  );
}

for (const role of ["archive", "present", "future"]) {
  assert(
    cockpit.includes(`id: "${role}"`) || cockpit.includes(`temporalRole: "${role}"`),
    `Event Rail role should remain stable: ${role}`,
  );
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
  assert(
    cockpit.includes(`id: "${edgeId}"`),
    `Event Rail edge id should remain stable: ${edgeId}`,
  );
  assert(
    cockpit.includes(`type: "${edgeType}"`),
    `Event Rail edge type should remain stable: ${edgeId} -> ${edgeType}`,
  );
}

assertContainsAll(cockpit, [
  "reference-only",
  "active-local-preview",
  "advisory-only",
  "referenceNode: event.id === \"pr\"",
  "referenceEdge: true",
]);

assertContainsAll(css, [
  ".perspective-event-rail-node-edge-shell",
  ".perspective-event-rail-lane",
  ".perspective-event-rail-node-row",
  ".perspective-event-rail-reference-row",
  ".perspective-event-rail-node",
  ".perspective-event-rail-node.is-reference",
  ".perspective-event-rail-edge",
  ".perspective-event-rail-edge.is-reference",
]);

assertContainsAll(doc, [
  "# Perspective Event Rail Node-Edge v0.1",
  "node-edge temporal view",
  "Session -> Decision -> Handoff -> Review -> Closeout",
  "`handoff_to_pr_ref` uses `refs`",
  "`data-augnes-event-rail-view=\"node-edge\"`",
  "compact authority copy from PR #444",
  "This PR is Event Rail node-edge only",
  "does not humanize Product node labels",
  "add API routes",
  "edit DB or migrations",
  "add persistence",
  "call providers/models/APIs",
  "call GitHub",
  "execute Codex",
  "write proof/evidence/readiness state",
  "historical snapshot persistence",
  "delta engine",
]);

const selectedCardSource = extractSelectedEventRailCard(cockpit);
for (const forbidden of [
  "<button",
  "onClick=",
  "fetch(",
  "/api/",
  "api.github.com",
  "api.openai.com",
  "process.env",
  "GITHUB_TOKEN",
  "OPENAI_API_KEY",
  "use server",
]) {
  assert.equal(
    selectedCardSource.includes(forbidden),
    false,
    `selected Event Rail card must stay passive and local-only: ${forbidden}`,
  );
}

const eventRailSource = extractBetween(
  cockpit,
  "const perspectiveConstellationEventRail = [",
  'className="perspective-advanced-diagnostics-shell"',
);

for (const forbidden of [
  "fetch(",
  "/api/",
  "api.github.com",
  "api.openai.com",
  "process.env",
  "GITHUB_TOKEN",
  "OPENAI_API_KEY",
  "use server",
  "href=",
  "window.open",
  "Open PR",
  "Create PR",
]) {
  assert.equal(
    eventRailSource.includes(forbidden),
    false,
    `Event Rail node-edge source must not add runtime/provider/GitHub/action plumbing: ${forbidden}`,
  );
}

for (const removedFlatRailHook of [
  "perspective-event-rail-track",
  "perspective-event-rail-item",
]) {
  assert.equal(
    cockpit.includes(removedFlatRailHook) || css.includes(removedFlatRailHook),
    false,
    `Event Rail node-edge slice should remove flat rail hook: ${removedFlatRailHook}`,
  );
}

assert.equal(
  /\brulecraft\b/i.test(cockpit),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit UI",
);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `event rail node-edge slice changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    changedFile === "app/globals.css" ||
      (!changedFile.startsWith("app/") &&
        !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/")),
    `event rail node-edge slice must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

console.log("cockpit perspective event rail node-edge smoke passed");

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

function extractSelectedEventRailCard(text) {
  const marker = "perspective-event-rail-entry-card";
  const markerIndex = text.indexOf(marker);
  assert.notEqual(markerIndex, -1, "selected Event Rail card marker should exist");
  const start = text.lastIndexOf("<aside", markerIndex);
  const end = text.indexOf("</aside>", markerIndex);
  assert.notEqual(start, -1, "selected Event Rail card opening aside should exist");
  assert.notEqual(end, -1, "selected Event Rail card closing aside should exist");
  return text.slice(start, end + "</aside>".length);
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
