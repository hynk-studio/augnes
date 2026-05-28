import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";

const forbiddenOverclaimPhrases = [
  "production-ready",
  "ready_to_execute",
  "execution_ready",
  "readiness authority",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "autonomous research agent",
  "benchmark result",
  "quality score",
  "KPI",
  "proof of quality",
];

const cockpit = await readFile(cockpitPath, "utf8");
const css = await readFile(cssPath, "utf8");

for (const snippet of [
  "Perspective Evidence Handoff Snapshot",
  "Read-only evidence and continuity orientation for the current perspective frame",
  "This does not create proof, call providers, execute Codex, publish, or mutate state",
  "Evidence Pack",
  "Evidence records",
  "Temporal Review Artifacts",
  "Session Trace",
  "Loaded evidence gaps",
  "Evidence anchor refs",
  "Summary refs",
  "Selected temporal review artifact",
  "Safe next step",
  "Review evidence pack, session trace, and temporal review artifacts before treating a frame as grounded",
  "Boundary: Read-only snapshot",
  "No proof creation",
  "provider call",
  "Codex execution",
  "GitHub posting",
  "approval",
  "merge",
  "publication",
  "Augnes mutation",
  "state commit/reject",
]) {
  assertIncludes(cockpit, snippet, "Cockpit source");
}

assert.equal(
  cockpit.includes("function PerspectiveEvidenceHandoffSnapshot"),
  false,
  "Perspective Evidence Handoff Snapshot must stay inline and not add a helper component",
);

const snapshotSource = extractBetween(
  cockpit,
  'className="cockpit-surface-card perspective-evidence-handoff-snapshot"',
  '<div className="perspective-evidence-grid">',
);

for (const forbidden of [
  "<button",
  "fetch(",
  "/api/",
  "Octokit",
  "axios",
  "api.github.com",
  "api.openai.com",
  "process.env",
  "GITHUB_TOKEN",
  "OPENAI_API_KEY",
  "use server",
]) {
  assert.equal(
    snapshotSource.includes(forbidden),
    false,
    `Perspective Evidence Handoff Snapshot source must not include ${forbidden}`,
  );
}

for (const snippet of [
  "Evidence Pack details",
  "Temporal Review Artifact details",
  "Session Trace details",
  "Temporal Interpretation Preview details",
  "PerspectiveSnapshot evidence_basis details",
  "PerspectiveSnapshot work_trace_basis.active and action_trace_basis.recent details",
]) {
  assertIncludes(cockpit, snippet, "Cockpit source");
}

assertIncludes(cockpit, "Selected Work Handoff Snapshot", "Cockpit source");
assertIncludes(cockpit, "Operator Handoff Snapshot", "Cockpit source");
assertTopLevelTabs(cockpit);
assert.equal(
  cockpit.includes('label: "Ledger"'),
  false,
  "Ledger top-level tab label must not be reintroduced",
);
assert.equal(
  cockpit.includes('label: "Proof"'),
  false,
  "Proof top-level tab label must not be reintroduced",
);

for (const snippet of [
  ".perspective-evidence-handoff-snapshot",
  ".perspective-evidence-handoff-grid",
  ".perspective-evidence-handoff-next",
]) {
  assertIncludes(css, snippet, "CSS");
}

const responsiveBlock = extractResponsiveBlock(css);
for (const selector of [
  ".perspective-evidence-handoff-grid",
  ".perspective-evidence-handoff-next",
]) {
  assertIncludes(responsiveBlock, selector, "responsive CSS block");
}

assertNoForbiddenOverclaims(snapshotSource, "Perspective Evidence Handoff Snapshot");
assertNoForbiddenOverclaims(cockpit, "Cockpit source");

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-perspective-evidence-handoff-snapshot",
      source_snapshot_present: true,
      source_boundary_copy_present: true,
      snapshot_buttonless: true,
      snapshot_no_fetch_api_provider_or_token_reference: true,
      perspective_detail_panels_preserved: true,
      selected_work_snapshot_preserved: true,
      operator_handoff_snapshot_preserved: true,
      five_tab_ia_preserved: true,
      old_top_level_ledger_proof_absent: true,
      css_snapshot_classes_present: true,
      css_responsive_stacking_checked: true,
      forbidden_overclaims_checked: true,
      dev_server_started: false,
      fetch_calls: 0,
      github_calls: 0,
      openai_calls: 0,
      provider_calls: 0,
      augnes_runtime_calls: 0,
      mutation_routes_called: 0,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected, label) {
  assert.equal(value.includes(expected), true, `${label} should include: ${expected}`);
}

function extractBetween(value, startMarker, endMarker) {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Expected start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected end marker: ${endMarker}`);
  return value.slice(start, end);
}

function assertTopLevelTabs(value) {
  const match = value.match(/const COCKPIT_TABS:[\s\S]*?\];/);
  assert.notEqual(match, null, "COCKPIT_TABS should be present");
  const labels = [...match[0].matchAll(/label: "([^"]+)"/g)].map(([, label]) => label);
  assert.deepEqual(labels, ["Overview", "Work", "Perspective", "Bridge", "Operator"]);
}

function extractResponsiveBlock(value) {
  const marker = "@media (max-width: 1180px)";
  const start = value.indexOf(marker);
  const end = value.indexOf("@media (max-width: 760px)", start + marker.length);
  assert.notEqual(start, -1, "responsive block should exist");
  assert.notEqual(end, -1, "responsive block end should exist");
  return value.slice(start, end);
}

function assertNoForbiddenOverclaims(text, label) {
  for (const phrase of forbiddenOverclaimPhrases) {
    const pattern =
      phrase === "KPI"
        ? /(^|[^A-Za-z0-9_])KPI([^A-Za-z0-9_]|$)/i
        : new RegExp(escapeRegExp(phrase), "i");
    assert.doesNotMatch(text, pattern, `${label}: ${phrase}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
