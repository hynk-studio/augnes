import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const specPath = "docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md";
const planPath = "docs/COCKPIT_MVP_UI_POLISH_PLAN.md";

assert.equal(existsSync(specPath), true, "six-tab functional map doc should exist");
assert.equal(existsSync(planPath), true, "Cockpit MVP UI polish plan should exist");

const spec = readFileSync(specPath, "utf8");
const plan = readFileSync(planPath, "utf8");

for (const tabName of ["Overview", "Work", "Ledger", "Proof", "Bridge", "Operator"]) {
  assertIncludes(spec, tabName);
  assertTabHasLowFiWireframe(spec, tabName);
}

for (const phrase of [
  "Overview -> Work -> Ledger -> Proof -> Bridge -> Operator",
  "Global Shell Requirements",
  "Current Implementation Mapping",
  "AI work becomes temporal state.",
  "Conversation -> Proposal -> Commit Gate -> Ledger -> Proof",
  "Ledger is the source of truth.",
  "Proof records evidence only.",
  "Bridge is read-first / not external system control.",
  "Bridge is a configured tool surface, not direct external control.",
  "Operator is local runtime only / no publish/merge/retry.",
  "No publish, merge, retry, backup, live exchange, or external execution controls live here.",
  "publish",
  "merge",
  "retry",
  "GitHub token controls",
  "installation token exchange",
  "execute Codex",
  "visual direction, not pixel-perfect",
  "do not authorize backend behavior or new authority controls",
]) {
  assertIncludes(spec, phrase);
}

for (const mapping of [
  "CurrentWorkCard",
  "WorkFocusSection",
  "MailboxSummaryPanel",
  "PublicationSummaryPanel",
  "ApprovalGateStatePanel",
  "SessionTracePanel",
  "TemporalInterpretationPreviewPanel",
  "TemporalReviewArtifactBrowserPanel",
  "EvidencePackPanel",
  "CoordinationEventTimeline",
  "TemporalStateGraph",
  "State Snapshot",
  "Pending State Deltas",
  "Observe textarea",
  "State-Grounded Actions",
  "Tensions",
  "Plan Next",
  "README/Security/Demo Checklist",
]) {
  assertIncludes(spec, mapping);
}

for (const phrase of [
  "Step 1: Six-Tab Functional Map And Wireframe Spec",
  "This PR.",
  "Step 2: Six-Tab Cockpit Shell Implementation From References",
  "Step 3: Fine Visual Polish / Screenshot / Demo Readiness Closeout",
  "Step 4 Future: Core-Gated Write-Control Design",
  "Step 5 Future: RawEpisodeBundle Runtime",
]) {
  assertIncludes(plan, phrase);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(
  packageJson.scripts["smoke:cockpit-six-tab-functional-map"],
  "node scripts/smoke-cockpit-six-tab-functional-map.mjs",
  "package.json should register smoke:cockpit-six-tab-functional-map",
);

const headPackageJson = JSON.parse(
  execFileSync("git", ["show", "HEAD:package.json"], { encoding: "utf8" }),
);
for (const field of [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]) {
  assert.deepEqual(
    packageJson[field] ?? {},
    headPackageJson[field] ?? {},
    `${field} should not change`,
  );
}

const changedFiles = execFileSync("git", ["status", "--short"], {
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.slice(3).trim())
  .filter(Boolean);

const forbiddenRuntimeChanges = changedFiles.filter((file) =>
  file.startsWith("lib/") ||
  file.startsWith("app/api/"),
);

assert.deepEqual(
  forbiddenRuntimeChanges,
  [],
  "six-tab functional map smoke must not observe API or lib runtime changes",
);

const changedLockfiles = changedFiles.filter((file) =>
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/.test(file),
);
assert.deepEqual(changedLockfiles, [], "lockfiles should not change");

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-six-tab-functional-map",
      spec_doc_exists: true,
      polish_plan_exists: true,
      tab_order_defined: true,
      all_tabs_have_low_fi_wireframes: true,
      global_shell_defined: true,
      current_implementation_mapping_defined: true,
      reference_images_non_authority: true,
      api_or_lib_runtime_files_changed: forbiddenRuntimeChanges.length,
      new_dependencies_added: false,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected content to include: ${expected}`,
  );
}

function assertTabHasLowFiWireframe(value, tabName) {
  const start = value.indexOf(`## ${tabName}`);
  assert.notEqual(start, -1, `${tabName} section should exist`);

  const next = value.indexOf("\n## ", start + 1);
  const section = value.slice(start, next === -1 ? value.length : next);
  assertIncludes(section, "### Low-Fi Wireframe");
}
