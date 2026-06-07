import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_AUTHORITY_COPY_COLLAPSE_V0_1.md";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-authority-copy-collapse.md";
const smokeFile =
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs";
const handoffPacketStructureSmokeFile =
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");
const handoffPacketStructureSmoke = readFileSync(
  handoffPacketStructureSmokeFile,
  "utf8",
);

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  docFile,
  "docs/PERSPECTIVE_EVENT_RAIL_NODE_EDGE_V0_1.md",
  "docs/PERSPECTIVE_NODE_COPY_HUMANIZATION_V0_1.md",
  browserReportFile,
  "reports/browser/2026-06-07-perspective-event-rail-node-edge.md",
  "reports/browser/2026-06-07-perspective-node-copy-humanization.md",
  "lib/perspective-ingest/episode-to-constellation-packet.ts",
  packageFile,
  smokeFile,
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
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
  "scripts/smoke-perspective-node-copy-humanization.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-authority-copy-collapse"],
  "node scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "package.json must register smoke:cockpit-perspective-authority-copy-collapse",
);

assert.equal(existsSync(docFile), true, "authority copy collapse doc must exist");
assertContainsAll(doc, [
  "# Perspective Authority Copy Collapse v0.1",
  "UI copy and information architecture cleanup, not a new feature",
  "The safety and authority model remains unchanged",
  "Visible boundary copy is consolidated into a compact authority capsule",
  "Full boundary details move behind a details disclosure",
  "The Handoff packet Compact Authority principle is preserved",
  "Event Rail node-edge refactor is explicitly out of scope",
  "Product node label humanization is explicitly out of scope",
  "This PR adds no API route, DB schema, migration, persistence, graph DB behavior, provider/model/API call, GitHub mutation, Codex execution, or proof/evidence/readiness write",
]);

assertContainsAll(cockpit, [
  "function PerspectiveCompactAuthority(",
  'data-augnes-authority-capsule="PerspectiveCompactAuthority"',
  "buildPerspectiveCompactAuthorityItems",
  "perspectiveConstellationCompactAuthorityItems",
  "Constellation-first preview for inspecting evidence, tensions, and handoff packets.",
  "Local read-only preview",
  "Safe preview",
  "Advisory only",
  "Authority details",
  "Authority details are available in the capsule",
]);

assertContainsAll(css, [
  ".perspective-tab details:not([open]) > :not(summary)",
  ".perspective-compact-authority",
  ".perspective-compact-authority-grid",
  ".perspective-compact-authority-notes",
]);

const starmapShell = extractBetween(
  cockpit,
  'aria-label="Current Perspective Starmap"',
  'aria-label="Inspector panel"',
);

for (const removedVisibleCopy of [
  "Read-only starmap · no persistence · no graph DB · no external calls",
  "No DB writes",
  "No persistence",
  "No graph DB",
  "No external calls",
  "No Codex execution",
]) {
  assert.equal(
    starmapShell.includes(removedVisibleCopy),
    false,
    `primary visible starmap shell must not keep repeated copy: ${removedVisibleCopy}`,
  );
}

assertContainsAll(starmapShell, [
  "Current Perspective Starmap",
  "Local read-only starmap",
  "Authority details are available in the capsule",
]);

assertContainsAll(handoffPacketStructureSmoke, [
  "7. Compact Authority",
  "8. Base Packet Text",
]);

assert.equal(
  /\brulecraft\b/i.test(cockpit),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit UI",
);

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
]) {
  assert.equal(
    eventRailSource.includes(forbidden),
    false,
    `Event Rail/passive selected-card source must not add runtime/provider/GitHub plumbing: ${forbidden}`,
  );
}

assertContainsAll(eventRailSource, [
  "Event Rail",
  "Archive / Present / Future",
  "perspective-event-rail-node-edge-shell",
  "perspective-event-rail-node",
  "perspective-event-rail-edge",
  "perspective-event-rail-entry-card",
  "perspective-event-rail-entry-capability-detail-grid",
]);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `authority copy collapse changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    changedFile === "app/globals.css" ||
      (!changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/")),
    `authority copy collapse must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

console.log("cockpit perspective authority copy collapse smoke passed");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
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

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}
