import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const reportFile =
  "reports/dogfood/2026-06-14-perspective-memory-reuse-packet-dogfood.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(reportFile, "utf8");

assertReportExists();
assertPackageScript();
assertDogfoodReportStructure();
assertDogfoodFindings();
assertBoundary();

console.log("PASS smoke:perspective-memory-reuse-packet-dogfood-report");

function assertReportExists() {
  assert.equal(existsSync(reportFile), true, "dogfood report file must exist");
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-packet-dogfood-report"],
    "node scripts/smoke-perspective-memory-reuse-packet-dogfood-report.mjs",
  );
}

function assertDogfoodReportStructure() {
  assertIncludesAll(reportText, [
    "# Perspective Memory Reuse Packet v0.1 Dogfood",
    "PR #550",
    "Dogfood Perspective Memory Reuse Packet v0.1 and report whether it prevents repeated setup/prepare work, preserves Augnes direction, identifies the next implementation slice, and exposes stale or misleading memory.",
    "Selected fixture memory item IDs:",
    "fixture-memory:setup-prepare-closed",
    "fixture-memory:reuse-return-contract",
    "why_selected",
    "reuse_boundary",
    "Structured packet JSON generated: yes.",
    "Codex Memory Brief generated: yes.",
    "## Changed Files",
    "reports/dogfood/2026-06-14-perspective-memory-reuse-packet-dogfood.md",
    "scripts/smoke-perspective-memory-reuse-packet-dogfood-report.mjs",
    "package.json",
    "## Verification",
    "## Skipped Checks With Concrete Reasons",
    "## Cleanup Status",
    "## Remaining Friction",
    "## Next Recommended PR",
  ]);
}

function assertDogfoodFindings() {
  assertIncludesAll(reportText, [
    "zero persisted memory rows",
    "deterministic fixture memory items",
    "recorded as friction",
    "The brief changed and constrained the work.",
    "It prevented repeating closed setup/prepare work.",
    "It preserved Augnes direction.",
    "It identified the next implementation slice.",
    "It did not expose stale or misleading memory",
    "why_selected is essential",
    "The boundary fields prevented over-application of memory",
    "live-data browser/runtime dogfood",
    "Return Binding",
    "reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up candidate memory",
  ]);
}

function assertBoundary() {
  assertIncludesAll(reportText, [
    "No setup/prepare polish was performed.",
    "runtime authority",
    "DB schema changes",
    "migrations",
    "setup/prepare polish",
    "provider/model calls",
    "OpenAI API calls",
    "Codex SDK execution",
    "MCP tool calls",
    "GitHub mutation from scripts",
    "proof/evidence writes",
    "perspective-memory persistence writes",
    "reuse packet persistence",
    "product boundary creation",
    "automatic synthesis",
    "automatic memory creation",
    "default/user DB writes",
    "hidden background daemons",
    "Augnes state commit/reject authority",
    "MCP tools were not called",
    "Provider/model checks were not run",
    "Default/user DB paths were not used",
    "/tmp/augnes-demo.db",
  ]);
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(text.includes(snippet), `expected report to include ${snippet}`);
  }
}
