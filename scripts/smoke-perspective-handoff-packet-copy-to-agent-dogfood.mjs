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

const packageJsonFile = "package.json";
const docFile = "docs/PERSPECTIVE_HANDOFF_PACKET_COPY_TO_AGENT_DOGFOOD_V0_1.md";
const dogfoodReportFile =
  "reports/dogfood/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md";
const smokeFile =
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs";
const primaryAdvancedDiagnosticsDocFile =
  "docs/PERSPECTIVE_PRIMARY_ADVANCED_DIAGNOSTICS_COLLAPSE_V0_1.md";
const primaryAdvancedDiagnosticsBrowserReportFile =
  "reports/browser/2026-06-07-perspective-primary-advanced-diagnostics-collapse.md";
const primaryAdvancedDiagnosticsSmokeFile =
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs";
const authorityCopyCollapseDocFile =
  "docs/PERSPECTIVE_AUTHORITY_COPY_COLLAPSE_V0_1.md";
const authorityCopyCollapseBrowserReportFile =
  "reports/browser/2026-06-07-perspective-authority-copy-collapse.md";
const authorityCopyCollapseSmokeFile =
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs";
const eventRailNodeEdgeDocFile =
  "docs/PERSPECTIVE_EVENT_RAIL_NODE_EDGE_V0_1.md";
const eventRailNodeEdgeBrowserReportFile =
  "reports/browser/2026-06-07-perspective-event-rail-node-edge.md";
const eventRailNodeEdgeSmokeFile =
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs";
const nodeCopyHumanizationDocFile =
  "docs/PERSPECTIVE_NODE_COPY_HUMANIZATION_V0_1.md";
const nodeCopyHumanizationBrowserReportFile =
  "reports/browser/2026-06-07-perspective-node-copy-humanization.md";
const nodeCopyHumanizationSmokeFile =
  "scripts/smoke-perspective-node-copy-humanization.mjs";

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  "lib/perspective-ingest/episode-to-constellation-packet.ts",
  docFile,
  dogfoodReportFile,
  browserReportFile,
  packageJsonFile,
  smokeFile,
  primaryAdvancedDiagnosticsDocFile,
  primaryAdvancedDiagnosticsBrowserReportFile,
  primaryAdvancedDiagnosticsSmokeFile,
  authorityCopyCollapseDocFile,
  authorityCopyCollapseBrowserReportFile,
  authorityCopyCollapseSmokeFile,
  eventRailNodeEdgeDocFile,
  eventRailNodeEdgeBrowserReportFile,
  eventRailNodeEdgeSmokeFile,
  nodeCopyHumanizationDocFile,
  nodeCopyHumanizationBrowserReportFile,
  nodeCopyHumanizationSmokeFile,
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
]);

const forbiddenChangedPrefixes = [
  "app/api/",
  "apps/augnes_apps/",
  "db/",
  "lib/",
  "migrations/",
];
const allowedRuntimeSurfaceFiles = new Set([
  "lib/perspective-ingest/episode-to-constellation-packet.ts",
]);

const inspectedFiles = [
  packageJsonFile,
  docFile,
  dogfoodReportFile,
  browserReportFile,
  smokeFile,
];

const textByFile = loadTextByFile(inspectedFiles);
const packageJsonText = textByFile.get(packageJsonFile);
const doc = textByFile.get(docFile);
const dogfoodReport = textByFile.get(dogfoodReportFile);
const browserReport = textByFile.get(browserReportFile);
const smoke = textByFile.get(smokeFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:perspective-handoff-packet-copy-to-agent-dogfood",
  expectedCommand:
    "node scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
});

assertDocCoverage();
assertDogfoodReportCoverage();
assertBrowserReportCoverage();
assertSmokeBoundary();
assertChangedFilesBoundary();

console.log("PASS smoke:perspective-handoff-packet-copy-to-agent-dogfood");

function assertDocCoverage() {
  assertContainsAll(doc, [
    "# Perspective Handoff Packet Copy-to-Agent Dogfood v0.1",
    "dogfood/report slice",
    "does not add a new capability, authority model, execution path, or UI panel",
    "packet clarity",
    "stable section order",
    "Evidence / Tensions / Next separation",
    "target-specific Purpose and Suggested Use",
    "Compact Authority appearing once",
    "Base Packet Text length and duplication risk",
    "human readability",
    "AI-agent readability",
    "anti-bureaucracy behavior",
    "No external AI calls are made",
    "hidden JSON dump",
    "raw graph/source/prompt/model/private payload",
    "Verdict: Good as-is",
    "Recommendation: no code change in this slice",
    "npm run smoke:perspective-handoff-packet-copy-to-agent-dogfood",
  ]);
}

function assertDogfoodReportCoverage() {
  assertContainsAll(dogfoodReport, [
    "# Perspective Handoff Packet Copy-to-Agent Dogfood",
    "Verdict: Good as-is",
    "No packets were sent to external AI services, providers, GitHub, Codex, or background workers",
    "Whole Constellation / ChatGPT Review",
    "Whole Constellation / Codex Handoff",
    "Manual Selection / ChatGPT Review",
    "Manual Selection / Codex Handoff",
    "Cluster / ChatGPT Review",
    "Cluster / Codex Handoff",
    "The report uses compact excerpts rather than full packets",
    "Purpose clarity",
    "Evidence / Tensions / Next separation",
    "Compact Authority once",
    "Human readability",
    "AI-agent readability",
    "No boundary wall",
    "Base Packet Text",
    "No code change for this slice",
    "Do not add a new visible boundary wall",
    "Do not add a new permission framework",
    "Next suggested slice: Stop here and review current UI with human eyes before adding more",
  ]);

  assert.equal(
    countMatches(dogfoodReport, /^### .+ \/ (ChatGPT Review|Codex Handoff)$/gm),
    6,
    "dogfood report must include exactly six inspected variant finding sections",
  );
}

function assertBrowserReportCoverage() {
  assertContainsAll(browserReport, [
    "# Perspective Handoff Packet Copy-to-Agent Dogfood Browser Validation",
    "Branch: `codex/perspective-handoff-packet-copy-to-agent-dogfood-v0-1`",
    "URL: `http://127.0.0.1:3000`",
    "Temp DB: `/tmp/augnes-handoff-packet-copy-to-agent-dogfood.db`",
    "Perspective opens as the default Cockpit tab",
    "`Preview Handoff Packet` remains details-gated before opening",
    "`Open Handoff Packet` opens the details disclosure",
    "ChatGPT/Codex target toggle works",
    "Copy buttons copied packet text to the local clipboard",
    "No new always-visible packet panel appeared",
    "No new boundary wall appeared",
    "Stable section order is present",
    "Evidence / Tensions / Next Actions remain separate",
    "Compact Authority appears once",
    "Desktop: no browser warnings or errors",
    "Mobile: no browser warnings or errors",
    "No horizontal page overflow",
    "local app/read GETs only",
    "No external provider, GitHub, Codex, OpenAI, or API-billing traffic was observed",
    "## Skipped Browser Checks",
    "None",
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
    label: "Perspective handoff packet copy-to-agent dogfood smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Perspective handoff packet copy-to-agent dogfood smoke: ${file}`,
      );
    }
  }

  for (const file of uniqueSorted([...result.files, ...untrackedFiles])) {
    if (allowedRuntimeSurfaceFiles.has(file)) continue;

    assert(
      !forbiddenChangedPrefixes.some((prefix) => file.startsWith(prefix)),
      `dogfood smoke companion boundary must not change runtime/persistence/provider surfaces: ${file}`,
    );
  }
}

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
}
