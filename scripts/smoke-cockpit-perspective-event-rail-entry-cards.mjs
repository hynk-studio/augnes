import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_EVENT_RAIL_ENTRY_CARDS_V0_1.md";
const smokeFile = "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  "docs/PERSPECTIVE_PRIMARY_ADVANCED_DIAGNOSTICS_COLLAPSE_V0_1.md",
  "docs/PERSPECTIVE_AUTHORITY_COPY_COLLAPSE_V0_1.md",
  "docs/PERSPECTIVE_FORMATION_SWITCH_OVERLAY_V0_1.md",
  "docs/PERSPECTIVE_HANDOFF_PACKET_COPY_TO_AGENT_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_HANDOFF_PACKET_STRUCTURE_REVIEW_V0_1.md",
  "docs/PERSPECTIVE_OVERLAY_FOCUS_AGENT_SEMANTICS_V0_1.md",
  "docs/PERSPECTIVE_SCOPE_HANDLER_CLEANUP_V0_1.md",
  "docs/PERSPECTIVE_EVENT_RAIL_ENTRY_CARDS_V0_1.md",
  "docs/PERSPECTIVE_EVENT_RAIL_NODE_EDGE_V0_1.md",
  "lib/perspective-ingest/perspective-unit-preview.ts",
  "lib/perspective-ingest/formation-switch-acknowledgement.ts",
  "package.json",
  "reports/browser/2026-06-07-perspective-primary-advanced-diagnostics-collapse.md",
  "reports/browser/2026-06-07-perspective-authority-copy-collapse.md",
  "reports/browser/2026-06-07-perspective-formation-switch-overlay.md",
  "reports/browser/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md",
  "reports/browser/2026-06-07-perspective-handoff-packet-structure-review.md",
  "reports/browser/2026-06-07-perspective-overlay-focus-agent-semantics.md",
  "reports/browser/2026-06-07-perspective-scope-handler-cleanup.md",
  "reports/browser/2026-06-07-perspective-event-rail-entry-cards.md",
  "reports/browser/2026-06-07-perspective-event-rail-node-edge.md",
  "reports/dogfood/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-event-rail-entry-cards"],
  "node scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "package.json must register smoke:cockpit-perspective-event-rail-entry-cards",
);

assertContainsAll(cockpit, [
  "Event Rail",
  "Archive / Present / Future",
  "Event Rail temporal entry card",
  "Past",
  "Archive / reference",
  "Event Rail node-edge temporal view",
  "Archive flow: Session to Decision to Handoff to Review to Closeout",
  "Present",
  "Active local preview",
  "Future",
  "Advisory candidate",
  "Archive Entry Card",
  "Current View Card",
  "Future Candidate Card",
  "reference-only",
  "advisory-only",
  "Archive cards can",
  "Archive cards cannot",
  "Current View card can",
  "Current View card cannot",
  "Future Candidate card can",
  "Future Candidate card cannot",
  "Snapshot Archive Card v0",
  "Frozen snapshot: not stored",
  "Compare to Current: not implemented",
  "Use as Reference: informational only",
  "PerspectiveUnitPreview / FormationReceiptV0",
  "No Codex execution",
  "No GitHub call",
  "Call providers, models, APIs, or trigger API billing",
  "Generate Auto Proposal output or mutate Augnes state",
  "Source refs / related refs",
  "+{selectedPerspectiveEventRailHiddenRefCount} more in",
  "Full set visible",
]);

assertContainsAll(css, [
  ".perspective-event-rail-node-edge-shell",
  ".perspective-event-rail-lane-heading",
  ".perspective-event-rail-node",
  ".perspective-event-rail-edge",
  ".perspective-event-rail-entry-role-badge",
  ".perspective-event-rail-entry-capability-grid",
  ".perspective-event-rail-entry-ref-preview",
  ".perspective-event-rail-entry-ref-heading",
]);

assertContainsAll(doc, [
  "# Perspective Event Rail Entry Cards v0.1",
  "temporal entry card polish slice",
  "Past = Archive/reference",
  "Present = Active local preview",
  "Future = Advisory candidate",
  "Archive cards can",
  "Archive cards cannot",
  "Current View card can",
  "Current View card cannot",
  "Future Candidate card can",
  "Future Candidate card cannot",
  "No frozen snapshot persistence",
  "No delta view",
  "No provider/model/API billing",
  "No GitHub mutation",
  "No Codex execution",
  "No Rulecraft exposure",
  "npm run smoke:cockpit-perspective-event-rail-entry-cards",
]);

assert.equal(
  /\brulecraft\b/i.test(cockpit),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit UI",
);

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
  "Octokit",
  "axios",
  "api.github.com",
  "api.openai.com",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "process.env",
  "use server",
]) {
  assert.equal(
    eventRailSource.includes(forbidden),
    false,
    `Event Rail source must not add runtime/provider/GitHub plumbing: ${forbidden}`,
  );
}

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `event rail entry-card slice changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    changedFile === "app/globals.css" ||
      (!changedFile.startsWith("app/") &&
        !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/")),
    `event rail entry-card slice must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

console.log("cockpit perspective event rail entry cards smoke passed");

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
