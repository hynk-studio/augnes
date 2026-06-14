import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const reportFile = "reports/dogfood/2026-06-14-augnes-codex-prepare-setup-summary-dogfood.md";
const packageFile = "package.json";

assert.ok(existsSync(reportFile), `${reportFile} must exist`);
assert.ok(existsSync(packageFile), `${packageFile} must exist`);

const report = readFileSync(reportFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

assert.equal(
  packageJson.scripts["smoke:augnes-codex-prepare-setup-summary-dogfood-report"],
  "node scripts/smoke-augnes-codex-prepare-setup-summary-dogfood-report.mjs",
  "package.json script must be wired",
);

const requiredSections = [
  "Summary",
  "Environment",
  "Commands run",
  "Commands skipped with concrete reasons",
  "Initial prepare result",
  "Setup dry-run summary result",
  "Setup --yes result or skipped reason",
  "Prepare --yes human output result",
  "Prepare --yes JSON output result",
  "Prepare --yes report output result",
  "Delegated setup step outcomes",
  "Setup summary marker parse result",
  "Worktree status before setup",
  "Worktree status after setup",
  "New dirty entries after setup",
  "Pre-existing dirty entries before setup",
  "Lockfile attribution result",
  "Runtime startup result or skipped reason",
  "MCP bridge startup result or skipped reason",
  "Doctor after setup/runtime result",
  "Prepare after setup/runtime result",
  "State brief check result",
  "MCP bridge reachability result",
  "User-facing friction",
  "Codex-worker friction",
  "What worked well",
  "What confused or slowed setup",
  "Suggested improvements ranked P0/P1/P2",
  "Cleanup performed",
  "Authority boundary",
  "Next recommended PR",
];

for (const section of requiredSections) {
  assert.match(
    report,
    new RegExp(`^## ${escapeRegExp(section)}$`, "m"),
    `${reportFile} must include section ${section}`,
  );
}

assertContainsAll([
  "npm run augnes:prepare",
  "npm run augnes:prepare -- --json",
  "npm run augnes:prepare -- --report",
  "npm run augnes:setup-local-demo",
  "npm run augnes:prepare -- --yes",
  "npm run augnes:prepare -- --yes --json",
  "npm run augnes:prepare -- --yes --report",
  "env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
  "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
  "npm run augnes:doctor -- --json",
  "curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq '{runtime, scope}'",
  "curl -i 'http://localhost:8787/mcp'",
]);

for (const skipped of [
  "Skipped: `npm run augnes:setup-local-demo -- --yes`. Reason:",
  "Skipped: MCP tool calls. Reason:",
  "Skipped: provider/model checks. Reason:",
  "Skipped: default/user DB paths. Reason:",
  "Skipped: `~/.codex/config.toml` reads/writes. Reason:",
  "Skipped: perspective-memory items, product persistence boundary records, and",
  "Skipped: Augnes commit/reject state changes. Reason:",
  "Skipped: Codex SDK execution and GitHub API calls from scripts. Reason:",
]) {
  assert.ok(report.includes(skipped), `${reportFile} must record concrete skipped reason for ${skipped}`);
}

assert.match(report, /prepare --yes status: (run|skipped)\./, "report must state whether prepare --yes ran or skipped");
assert.match(
  report,
  /setup-local-demo --yes status: (run|skipped)/,
  "report must state whether setup-local-demo --yes ran or skipped",
);
assert.ok(report.includes("prepare --yes status: run."), "report should state prepare --yes ran");
assert.ok(
  report.includes("setup-local-demo --yes status: skipped direct command."),
  "report should state direct setup-local-demo --yes was skipped",
);

assertContainsAll([
  "setup summary markers parseable: yes.",
  "Setup summary markers were present and parseable.",
  "dry-run summary parse result: PASS",
  "delegated setup summary parse result from prepare --yes: PASS",
]);

assertContainsAll([
  "setup step outcomes visible in human output: yes.",
  "setup step outcomes visible in report output: yes.",
  "setup steps present in JSON output: yes.",
  "Setup steps were present in JSON output: yes.",
  "root dependencies: PASS",
  "Augnes Apps dependencies: PASS",
  "temp demo DB reset: PASS",
  "temp demo DB migration: PASS",
  "temp demo DB seed: PASS",
]);

assertContainsAll([
  "worktree dirty before setup: no.",
  "worktree dirty after setup: yes.",
  "new dirty entries after setup: yes",
  "pre-existing dirty entries before setup: no.",
  "Worktree dirty before setup: no.",
  "Worktree dirty after setup: yes.",
  "New dirty entries after setup: yes.",
  "Pre-existing dirty entries before setup: no.",
]);

assertContainsAll([
  "lockfile attribution result: changed after first setup; already dirty before later repeated setup-mode captures.",
  "Lockfile changed after setup, was already dirty before later repeated setup-mode captures, and churn was not unknown.",
  "setup-generated changes manually restored after inspection: yes",
  "Any setup-generated changes manually restored after inspection: yes",
  "Manually restored `apps/augnes_apps/package-lock.json`",
]);

assert.match(report, /runtime startup status: (run|skipped)\./, "report must state runtime startup status");
assert.match(report, /MCP bridge startup status: (run|skipped)\./, "report must state MCP bridge startup status");
assertContainsAll([
  "runtime startup status: run.",
  "MCP bridge startup status: run.",
  "Runtime process stopped after dogfood: yes.",
  "MCP bridge process stopped after dogfood: yes.",
  "Verified no listeners remained on ports `3000` or `8787`.",
]);

assertContainsAll([
  "No MCP tools were called.",
  "MCP tools were not called unless explicitly scoped: yes, no MCP tools were called.",
  "provider/model checks were not run: yes.",
  "No provider/model checks were run.",
  "The only allowed demo DB path was `/tmp/augnes-demo.db`.",
  "`/tmp/augnes-demo.db` was the only allowed demo DB path: yes.",
  "no default/user DB paths were used: yes.",
  "No default/user DB paths were used.",
  "no secrets or `~/.codex/config.toml` were read/written: yes.",
  "No secrets or `~/.codex/config.toml` were read/written.",
]);

for (const rank of ["P0", "P1", "P2"]) {
  assert.match(report, new RegExp(`^### ${rank}$`, "m"), `report must include ranked ${rank} improvement`);
}

assertContainsAll([
  "This PR adds a dogfood report and smoke only.",
  "does not add runtime authority",
  "DB schema changes",
  "secret handling",
  "provider calls",
  "provider/model checks",
  "Codex SDK execution",
  "GitHub API calls from scripts",
  "merge automation",
  "approval automation",
  "publish automation",
  "proof/evidence writes",
  "perspective-memory persistence",
  "product boundary creation",
  "product persistence boundary records",
  "default/user DB writes",
  "`~/.codex/config.toml` reads or writes",
  "MCP tool calls",
  "Augnes state commit/reject authority",
]);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-codex-prepare-setup-summary-dogfood-report",
      report_exists: true,
      package_script_wired: true,
      required_sections_checked: requiredSections.length,
      skipped_reasons_checked: true,
      prepare_yes_status_recorded: true,
      setup_local_demo_yes_status_recorded: true,
      setup_summary_markers_parseable: true,
      setup_step_outcomes_checked: true,
      worktree_attribution_checked: true,
      lockfile_attribution_checked: true,
      cleanup_checked: true,
      runtime_bridge_cleanup_checked: true,
      boundary_checked: true,
      ranked_improvements_checked: true,
    },
    null,
    2,
  ),
);

function assertContainsAll(expectedValues) {
  for (const expected of expectedValues) {
    assert.ok(report.includes(expected), `${reportFile} must include ${expected}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
