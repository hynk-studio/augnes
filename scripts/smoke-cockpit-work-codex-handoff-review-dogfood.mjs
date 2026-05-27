import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";
const docPath = "docs/WORK_CODEX_HANDOFF_REVIEW_DOGFOOD_2026_05_27.md";

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
  "WorkCodexHandoffReview",
  "Codex Handoff Review",
  "Review the local task brief, constraints, and suggested verification before copying this handoff",
  "Task brief",
  "Constraints",
  "Suggested verification",
  "Work event template",
  "No constraints recorded",
  "No suggested verification recorded",
  "Read-only handoff review",
  "Copying text does not execute Codex",
  "call providers",
  "post to GitHub",
  "approve",
  "merge",
  "publish",
  "mutate Augnes",
  "commit/reject state",
]) {
  assertIncludes(cockpit, snippet, "Cockpit source");
}

assertIncludes(cockpit, "Copy Codex handoff", "Cockpit source");
assertIncludes(cockpit, "Copy work event template", "Cockpit source");
assertIncludes(cockpit, "Selected Work Handoff Snapshot", "Cockpit source");
assertIncludes(cockpit, "Operator Handoff Snapshot", "Cockpit source");
assertTopLevelTabs(cockpit);
assert.equal(cockpit.includes('label: "Ledger"'), false, "Ledger top-level tab label must not be reintroduced");
assert.equal(cockpit.includes('label: "Proof"'), false, "Proof top-level tab label must not be reintroduced");

const reviewSource = extractFunctionSource(
  cockpit,
  "function WorkCodexHandoffReview",
  "function SelectedWorkHandoffSnapshot",
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
  assert.equal(reviewSource.includes(forbidden), false, `Review source must not include ${forbidden}`);
}

const baseCockpit = execFileSync("git", ["show", "origin/main:components/augnes-cockpit.tsx"], {
  encoding: "utf8",
});
assert.equal(
  countOccurrences(cockpit, "fetch("),
  countOccurrences(baseCockpit, "fetch("),
  "Cockpit source must not add fetch calls",
);
assert.equal(
  countOccurrences(cockpit, "/api/"),
  countOccurrences(baseCockpit, "/api/"),
  "Cockpit source must not add API route references",
);

for (const snippet of [
  ".work-codex-handoff-review",
  ".work-codex-handoff-grid",
  ".work-codex-handoff-list",
  "overflow-wrap: anywhere",
  "white-space: normal",
]) {
  assertIncludes(css, snippet, "CSS");
}
const responsiveBlock = extractResponsiveBlock(css);
assertIncludes(responsiveBlock, ".work-codex-handoff-grid", "responsive CSS block");

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
assertNoForbiddenOverclaims(reviewSource, "review source");
assertOnlyNegativeBoundaryMentions(doc, "dogfood doc");
assertOnlyNegativeBoundaryMentions(reviewSource, "review source");

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-work-codex-handoff-review-dogfood",
      source_review_component_present: true,
      source_review_copy_present: true,
      copy_buttons_preserved: true,
      selected_work_snapshot_preserved: true,
      operator_handoff_snapshot_preserved: true,
      five_tab_ia_preserved: true,
      old_top_level_ledger_proof_absent: true,
      review_component_buttonless: true,
      review_component_no_fetch_or_api_reference: true,
      cockpit_fetch_count_unchanged: true,
      cockpit_api_reference_count_unchanged: true,
      css_review_classes_present: true,
      css_wrapping_helpers_present: true,
      css_responsive_stacking_checked: true,
      dogfood_doc_sections_checked: true,
      dogfood_samples_checked: ["A", "B", "C", "D"],
      dogfood_operator_and_worker_usefulness_checked: true,
      boundary_mentions_checked: true,
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
    const matches = [...normalized.matchAll(new RegExp(escapeRegExp(phrase), "gi"))];
    for (const match of matches) {
      const sentenceStart = normalized.lastIndexOf(".", match.index);
      const prefix = normalized.slice(sentenceStart === -1 ? 0 : sentenceStart + 1, match.index);
      assert.match(
        prefix,
        /(no|not|without|did not|does not|should not|must not|do not|grant)\b/i,
        `${label} must mention ${phrase} only as a boundary`,
      );
    }
  }
}

function countOccurrences(value, needle) {
  return value.split(needle).length - 1;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
