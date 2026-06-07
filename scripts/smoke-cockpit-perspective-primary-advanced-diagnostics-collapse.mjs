import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageJsonFile = "package.json";
const docFile =
  "docs/PERSPECTIVE_PRIMARY_ADVANCED_DIAGNOSTICS_COLLAPSE_V0_1.md";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-primary-advanced-diagnostics-collapse.md";
const smokeFile =
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs";

const allowedChangedFiles = new Set([
  cockpitFile,
  cssFile,
  packageJsonFile,
  docFile,
  browserReportFile,
  smokeFile,
  "docs/PERSPECTIVE_AUTHORITY_COPY_COLLAPSE_V0_1.md",
  "docs/PERSPECTIVE_EVENT_RAIL_NODE_EDGE_V0_1.md",
  "reports/browser/2026-06-07-perspective-authority-copy-collapse.md",
  "reports/browser/2026-06-07-perspective-event-rail-node-edge.md",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
]);

const forbiddenChangedPrefixes = [
  "app/api/",
  "apps/augnes_apps/",
  "db/",
  "lib/",
  "migrations/",
];

const textByFile = loadTextByFile([
  cockpitFile,
  cssFile,
  packageJsonFile,
  docFile,
  browserReportFile,
  smokeFile,
]);
const cockpit = textByFile.get(cockpitFile);
const css = textByFile.get(cssFile);
const packageJsonText = textByFile.get(packageJsonFile);
const doc = textByFile.get(docFile);
const browserReport = textByFile.get(browserReportFile);
const smoke = textByFile.get(smokeFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:cockpit-perspective-primary-advanced-diagnostics-collapse",
  expectedCommand:
    "node scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs",
});

assertPrimaryObservatoryPreserved();
assertAdvancedDiagnosticsGate();
assertDiagnosticsGroupedAndReachable();
assertNoUnsafeAttributesOrExecutionPatterns();
assertDocCoverage();
assertBrowserReportCoverage();
assertCssHooks();
assertSmokeBoundary();
assertChangedFilesBoundary();

console.log("PASS smoke:cockpit-perspective-primary-advanced-diagnostics-collapse");

function assertPrimaryObservatoryPreserved() {
  assertContainsAll(cockpit, [
    'useState<CockpitTab>("perspective")',
    "Perspective Observatory",
    "Current Perspective Starmap",
    "Observatory Controls",
    "Inspector",
    "Event Rail",
    "Preview Handoff Packet",
    "Open Handoff Packet",
    "Formation Basis · Switch View",
    "Event Rail temporal entry card",
  ]);
}

function assertAdvancedDiagnosticsGate() {
  assertContainsAll(cockpit, [
    "const [advancedDiagnosticsOpen, setAdvancedDiagnosticsOpen] = useState(false)",
    "Advanced Diagnostics",
    "Frame, evidence, tensions, route previews, ingest graph, and read-only debug surfaces",
    'data-augnes-region="advanced-diagnostics"',
    "data-augnes-diagnostics-state",
    'data-augnes-authority="read-only local-only preview-only"',
    'data-augnes-external-calls="false"',
    'data-augnes-persistence="false"',
    'data-augnes-codex-execution="false"',
    'aria-expanded={advancedDiagnosticsOpen}',
    'aria-controls="perspective-advanced-diagnostics-body"',
    "advancedDiagnosticsOpen ? (",
    'id="perspective-advanced-diagnostics-body"',
  ]);

  assertOrdered(cockpit, [
    'data-augnes-region="event-rail"',
    'data-augnes-region="advanced-diagnostics"',
    "advancedDiagnosticsOpen ? (",
    'className="perspective-formation-archive-drawer"',
    'className="perspective-surface-details"',
    'className="perspective-grid perspective-advanced-diagnostics-grid"',
  ]);

  const toggleSource = extractBetween(
    cockpit,
    'className="perspective-advanced-diagnostics-toggle"',
    "advancedDiagnosticsOpen ? (",
  );
  for (const forbidden of [
    "BoundaryNote",
    "Perspective is a read-only interpretation surface",
    "PerspectiveSnapshot is a derived-view-only read model",
    "Current Perspective Frame",
    "Evidence support and challenge",
    "Project Constellation route preview",
  ]) {
    assert.equal(
      toggleSource.includes(forbidden),
      false,
      `collapsed Advanced Diagnostics entry must stay compact: ${forbidden}`,
    );
  }
}

function assertDiagnosticsGroupedAndReachable() {
  assertContainsAll(cockpit, [
    'data-augnes-diagnostics-group="formation-archive"',
    'data-augnes-diagnostics-group="advanced-boundaries"',
    'data-augnes-diagnostics-group="frame-ledger"',
    'data-augnes-diagnostics-group="evidence-tensions"',
    'data-augnes-diagnostics-group="boundary-next"',
    'data-augnes-diagnostics-group="route-preview"',
    'data-augnes-diagnostics-group="ingest-graph"',
    'data-augnes-diagnostics-group="constellation-preview"',
    'data-augnes-diagnostics-group="research-temporal"',
    'id="perspective-frame"',
    'id="perspective-ledger-basis"',
    'id="perspective-evidence"',
    'id="perspective-tensions"',
    'id="perspective-boundary-next"',
    'id="perspective-constellation-route-preview"',
    'id="perspective-ingest-constellation-preview"',
    'id="perspective-constellation-preview"',
    'aria-label="Advanced section links"',
    'href="#perspective-frame"',
    'href="#perspective-ledger-basis"',
    'href="#perspective-evidence"',
    'href="#perspective-tensions"',
    'href="#perspective-boundary-next"',
    'href="#perspective-constellation-route-preview"',
    'href="#perspective-ingest-constellation-preview"',
    'href="#perspective-constellation-preview"',
  ]);

  assertOrdered(cockpit, [
    "advancedDiagnosticsOpen ? (",
    'aria-label="Advanced section links"',
    'id="perspective-frame"',
    'id="perspective-ledger-basis"',
    'id="perspective-evidence"',
    'id="perspective-tensions"',
    'id="perspective-boundary-next"',
    'id="perspective-constellation-route-preview"',
    'id="perspective-ingest-constellation-preview"',
    'id="perspective-constellation-preview"',
  ]);
}

function assertNoUnsafeAttributesOrExecutionPatterns() {
  assert.equal(
    /\brulecraft\b/i.test(cockpit),
    false,
    "Rulecraft must not appear in product-facing Cockpit source",
  );

  for (const forbidden of [
    "data-raw-graph",
    "data-source-text",
    "data-pasted-text",
    "data-packet-text",
    "data-prompt",
    "data-model-output",
    "data-private-history",
    "data-formation-receipt",
    "data-serialized-formation",
  ]) {
    assert.equal(
      cockpit.includes(forbidden),
      false,
      `unsafe raw/private/generated data attribute must not be introduced: ${forbidden}`,
    );
  }

  const changedFiles = collectAllChangedFiles();
  for (const file of changedFiles) {
    assert(
      !forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)),
      `primary/advanced diagnostics collapse must not change runtime/persistence/provider surfaces: ${file}`,
    );
  }
}

function assertDocCoverage() {
  assertContainsAll(doc, [
    "# Perspective Primary Advanced Diagnostics Collapse v0.1",
    "primary/advanced information-architecture cleanup slice",
    "reduces default Perspective scroll",
    "keeping the existing diagnostic content available on demand",
    "The default Perspective view should show",
    "Advanced Diagnostics is a containment surface, not a new feature",
    "does not remove, rewrite, or expand diagnostics",
    "conditionally rendered only when `advancedDiagnosticsOpen` is true",
    "keeps the default DOM, accessibility flow, and browser text extraction focused",
    "stable semantic hooks",
    "does not add a new API route",
    "It intentionally avoids boundary text growth",
    "Handoff packet structure and copy flow remain unchanged",
    "Formation Basis switch overlay behavior remains unchanged",
    "Event Rail behavior remains unchanged",
    "Lens and Scope handler behavior remains unchanged",
    "npm run smoke:cockpit-perspective-primary-advanced-diagnostics-collapse",
  ]);
}

function assertBrowserReportCoverage() {
  assertContainsAll(browserReport, [
    "# Perspective Primary Advanced Diagnostics Collapse Browser Validation",
    "URL: `http://127.0.0.1:3000`",
    "Temp DB: `/tmp/augnes-primary-advanced-diagnostics-collapse.db`",
    "Advanced Diagnostics was collapsed by default",
    "Frame section was not visible until Advanced Diagnostics opened",
    "Opening Advanced Diagnostics revealed the secondary diagnostic sections",
    "Closing Advanced Diagnostics collapsed the sections again",
    "Handoff packet details still worked",
    "Formation Basis overlay still worked",
    "Event Rail cards still worked",
    "Mobile 390px",
    "No horizontal page overflow",
    "No browser console warnings or errors",
    "local app/read GETs only",
    "No external provider, GitHub, Codex, OpenAI, or API-billing traffic",
    "## Skipped Checks",
  ]);
}

function assertCssHooks() {
  assertContainsAll(css, [
    ".perspective-advanced-diagnostics-shell",
    ".perspective-advanced-diagnostics-toggle",
    ".perspective-advanced-diagnostics-badges",
    ".perspective-advanced-diagnostics-indicator",
    ".perspective-advanced-diagnostics-body",
    ".perspective-advanced-diagnostics-grid",
  ]);
}

function assertSmokeBoundary() {
  assertNoRuntimeImports({
    file: smokeFile,
    text: smoke,
    forbiddenImports: [
      "app/",
      "apps/augnes_apps/",
      "components/",
      "db/",
      "lib/",
      "migrations/",
      "@openai/codex-sdk",
    ],
  });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Perspective primary Advanced Diagnostics collapse smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Perspective primary Advanced Diagnostics collapse smoke: ${file}`,
      );
    }
  }
}

function collectAllChangedFiles() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Perspective primary Advanced Diagnostics collapse changed files",
  });
  return uniqueSorted([...result.files, ...collectUntrackedFiles()]);
}

function assertOrdered(text, snippets) {
  let previousIndex = -1;
  for (const snippet of snippets) {
    const index = text.indexOf(snippet);
    assert.notEqual(index, -1, `Expected ordered snippet: ${snippet}`);
    assert(
      index > previousIndex,
      `Expected ${snippet} to appear after the previous ordered snippet`,
    );
    previousIndex = index;
  }
}

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Expected start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected end marker: ${endMarker}`);
  return text.slice(start, end);
}
