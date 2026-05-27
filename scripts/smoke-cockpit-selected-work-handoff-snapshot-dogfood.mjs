import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";
const docPath = "docs/SELECTED_WORK_HANDOFF_SNAPSHOT_DOGFOOD_2026_05_27.md";

const forbiddenOverclaimPhrases = [
  "production-ready",
  "ready_to_execute",
  "execution_ready",
  "evaluates PR quality",
  "detects drift at runtime",
  "repairs context automatically",
  "selects next tasks autonomously",
  "autonomous research agent",
  "benchmark result",
  "quality score",
  "KPI",
  "proof of quality",
  "readiness authority",
];

const cockpit = await readFile(cockpitPath, "utf8");
const css = await readFile(cssPath, "utf8");
const doc = await readFile(docPath, "utf8");

for (const snippet of [
  "Selected Work Handoff Snapshot",
  "Local handoff view for the selected work item",
  "No selected work",
  "Select a work item to see local handoff context",
  "Selected work",
  "Status",
  "Priority",
  "Needs attention",
  "Next action",
  "Related state keys",
  "Recent events",
  "Codex handoff",
  "Suggested verification",
  "Safe next step",
  "Read-only snapshot",
  "No Codex execution",
  "GitHub posting",
  "PR review creation",
  "approval",
  "merge",
  "publication",
  "provider call",
  "Augnes mutation",
  "state commit/reject",
]) {
  assertIncludes(cockpit, snippet, "Cockpit source");
}

assertIncludes(cockpit, "function SelectedWorkHandoffSnapshot", "Cockpit source");
const snapshotSource = extractFunctionSource(
  cockpit,
  "function SelectedWorkHandoffSnapshot",
  "function ProofList",
);
for (const forbidden of [
  "<button",
  "fetch(",
  "/api/",
  "Octokit",
  "axios",
  "api.github.com",
  "api.openai.com",
  "process.env.GITHUB_TOKEN",
  "process.env.OPENAI_API_KEY",
  "use server",
]) {
  assert.equal(snapshotSource.includes(forbidden), false, `Snapshot source must not include ${forbidden}`);
}

assertIncludes(cockpit, "function WorkFocusSection", "Cockpit source");
assertIncludes(cockpit, "Copy Codex handoff", "Cockpit source");
assertIncludes(cockpit, "Operator Handoff Snapshot", "Cockpit source");
assertTopLevelTabs(cockpit);
assert.equal(cockpit.includes('label: "Ledger"'), false, "Ledger top-level tab label must not be reintroduced");
assert.equal(cockpit.includes('label: "Proof"'), false, "Proof top-level tab label must not be reintroduced");

for (const snippet of [
  ".selected-work-handoff-snapshot",
  ".selected-work-handoff-grid",
  ".selected-work-handoff-next",
]) {
  assertIncludes(css, snippet, "CSS");
}
const responsiveBlock = extractResponsiveBlock(css);
for (const selector of [".selected-work-handoff-grid", ".selected-work-handoff-next"]) {
  assertIncludes(responsiveBlock, selector, "responsive CSS block");
}

for (const section of [
  "Summary",
  "Scope boundary",
  "Dogfood samples",
  "Cross-sample findings",
  "Human operator usefulness observations",
  "Delegated agent worker usefulness observations",
  "Development feedback",
  "UI/UX implications",
  "Sidecar e_t / perspective research implications",
  "Recommended next decision",
]) {
  assert.match(doc, new RegExp(`^## ${escapeRegExp(section)}$`, "m"), section);
}
for (const sample of ["Sample A", "Sample B", "Sample C", "Sample D"]) {
  assertIncludes(doc, sample, "dogfood doc");
}
for (const phrase of ["human operator usefulness", "delegated agent worker usefulness"]) {
  assertIncludes(doc, phrase, "dogfood doc");
}

assertNoForbiddenOverclaims(doc, "dogfood doc");
assertNoForbiddenOverclaims(snapshotSource, "snapshot source");
assertOnlyNegativeBoundaryMentions(doc, "dogfood doc");
assertOnlyNegativeBoundaryMentions(snapshotSource, "snapshot source");

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-selected-work-handoff-snapshot-dogfood",
      source_snapshot_present: true,
      source_boundary_copy_present: true,
      snapshot_buttonless: true,
      snapshot_no_new_fetch_or_api_reference: true,
      work_focus_section_preserved: true,
      codex_handoff_copy_preserved: true,
      operator_handoff_snapshot_preserved: true,
      five_tab_ia_preserved: true,
      old_top_level_ledger_proof_absent: true,
      css_snapshot_classes_present: true,
      css_responsive_stacking_checked: true,
      dogfood_doc_sections_checked: true,
      dogfood_samples_checked: ["A", "B", "C", "D"],
      dogfood_operator_and_worker_usefulness_checked: true,
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

function extractFunctionSource(value, startMarker, endMarker) {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Expected function start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected function end marker: ${endMarker}`);
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

function assertOnlyNegativeBoundaryMentions(text, label) {
  const normalized = text.replace(/\s+/g, " ");
  for (const phrase of [
    "posting permission",
    "approval permission",
    "merge permission",
    "publication permission",
    "external execution",
    "provider call",
    "runtime mutation",
    "state commit/reject",
    "Codex execution permission",
  ]) {
    if (!new RegExp(escapeRegExp(phrase), "i").test(normalized)) continue;
    assert.match(
      normalized,
      new RegExp(`(no|not|without|did not|does not|should not|must not)[^.]*${escapeRegExp(phrase)}`, "i"),
      `${label} must mention ${phrase} only as a boundary`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
