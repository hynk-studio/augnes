import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const reportFile = "reports/dogfood/2026-06-14-augnes-codex-prepare-dogfood.md";
const packageFile = "package.json";

assert.ok(existsSync(reportFile), `${reportFile} must exist`);
assert.ok(existsSync(packageFile), `${packageFile} must exist`);

const report = readFileSync(reportFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));

assert.equal(
  packageJson.scripts["smoke:augnes-codex-prepare-dogfood-report"],
  "node scripts/smoke-augnes-codex-prepare-dogfood-report.mjs",
  "package.json script must be wired",
);

const requiredSections = [
  "Summary",
  "Environment",
  "Commands run",
  "Commands skipped with concrete reasons",
  "Initial prepare result",
  "Setup dry-run result",
  "Setup --yes result or skipped reason",
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
  "env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000",
  "AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev",
  "npm run augnes:doctor -- --json",
  "curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq '{runtime, scope}'",
  "curl -i 'http://localhost:8787/mcp'",
]);

for (const skipped of [
  "Skipped: MCP tool calls. Reason:",
  "Skipped: provider/model checks. Reason:",
  "Skipped: default/user DB paths. Reason:",
  "Skipped: `~/.codex/config.toml` writes. Reason:",
  "Skipped: perspective-memory items, product persistence boundary records, and",
  "Skipped: Augnes commit/reject state changes. Reason:",
  "Skipped: Codex SDK execution and GitHub API calls from scripts. Reason:",
]) {
  assert.ok(report.includes(skipped), `${reportFile} must record concrete skipped reason for ${skipped}`);
}

assert.match(report, /prepare --yes status: (run|skipped)\./, "report must state whether prepare --yes ran or skipped");
assert.ok(report.includes("prepare --yes status: run."), "dogfood report should record prepare --yes was run");
assert.match(report, /runtime startup status: (run|skipped)\./, "report must state whether runtime started or skipped");
assert.ok(report.includes("runtime startup status: run."), "dogfood report should record runtime was started");
assert.match(
  report,
  /MCP bridge startup status: (run|skipped)\./,
  "report must state whether MCP bridge started or skipped",
);
assert.ok(report.includes("MCP bridge startup status: run."), "dogfood report should record MCP bridge was started");

assertContainsAll([
  "No MCP tools were called.",
  "MCP tool calls. Reason: the task explicitly said not to call MCP",
  "provider/model checks. Reason: the task explicitly forbade",
  "The startup did not require `OPENAI_API_KEY`",
  "the only allowed demo DB path was `/tmp/augnes-demo.db`",
  "default/user DB paths",
  "`/tmp/augnes-demo.db`",
  "HTTP/1.1 406 Not Acceptable",
  "endpoint reachability",
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
  "publish",
  "proof/evidence writes",
  "perspective-memory persistence",
  "product boundary creation",
  "product persistence boundary records",
  "default/user DB writes",
  "`~/.codex/config.toml` writes",
  "MCP tool calls",
  "Augnes state",
]);

console.log(
  JSON.stringify(
    {
      smoke: "augnes-codex-prepare-dogfood-report",
      report_exists: true,
      required_sections_checked: requiredSections.length,
      skipped_reasons_checked: true,
      prepare_yes_status_recorded: true,
      runtime_status_recorded: true,
      bridge_status_recorded: true,
      mcp_tools_not_called: true,
      provider_model_checks_not_run: true,
      tmp_demo_db_only: true,
      ranked_improvements_checked: true,
      authority_boundary_checked: true,
      package_script_wired: true,
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
