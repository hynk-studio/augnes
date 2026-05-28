import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const docPath = "docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md";
const examplePath = "docs/examples/codex-augnes-mcp.example.toml";
const packagePath = "package.json";

assert.ok(existsSync(docPath), `${docPath} must exist`);
assert.ok(existsSync(examplePath), `${examplePath} must exist`);

const doc = readFileSync(docPath, "utf8");
const example = readFileSync(examplePath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.match(doc, /http:\/\/localhost:8787\/mcp/, "docs must mention local bridge URL");

const readTools = [
  "augnes_get_state_brief",
  "augnes_get_work_brief",
  "augnes_get_evidence_pack",
  "augnes_get_session_trace",
  "augnes_get_verification_evidence_records",
  "augnes_get_mailbox_summary",
  "augnes_get_publication_summary",
  "augnes_get_publication_decision_card",
];

const draftReviewProofTools = [
  "augnes_generate_codex_handoff_draft",
  "augnes_review_codex_result_draft",
  "augnes_record_action_result",
  "augnes_record_work_event",
  "augnes_observe",
  "augnes_plan",
  "augnes_list_pending_proposals",
];

for (const tool of [...readTools, ...draftReviewProofTools]) {
  assert.match(doc, new RegExp(`\\b${escapeRegExp(tool)}\\b`), `docs must mention ${tool}`);
}

const requiredBoundaryPatterns = [
  /MCP bridge does not execute Codex/i,
  /ChatGPT does not execute Codex/i,
  /no commit\/reject authority is granted/i,
  /Codex does not merge PRs/i,
  /future Core-gated route and explicit user approval/i,
  /proof is not approval/i,
  /PR is not merge authority/i,
  /durable approval remains user\/Core gated/i,
];

for (const pattern of requiredBoundaryPatterns) {
  assert.match(doc, pattern, `docs must include boundary language ${pattern}`);
}

assert.equal(path.dirname(examplePath), "docs/examples", "example config must live under docs/examples");
assert.match(example, /example-only/i, "example must be clearly marked example-only");
assert.match(example, /not automatically active|inert/i, "example must warn it is not active");
assert.match(example, /http:\/\/localhost:8787\/mcp/, "example must use local bridge URL");
assert.doesNotMatch(example, /https?:\/\/(?!localhost(?::\d+)?(?:\/|$)|127\.0\.0\.1(?::\d+)?(?:\/|$))/i, "example must not include hosted URLs");

const secretPatterns = [
  /(?:token|secret|password|api[_-]?key)\s*=\s*["'][^"']+["']/i,
  /Bearer\s+[A-Za-z0-9._-]+/i,
  /sk-[A-Za-z0-9]{10,}/i,
  /ghp_[A-Za-z0-9_]{10,}/i,
  /github_pat_[A-Za-z0-9_]{10,}/i,
];

for (const pattern of secretPatterns) {
  assert.doesNotMatch(example, pattern, `example must not contain token-like pattern ${pattern}`);
}

const activeMcpConfigPaths = [
  ".codex/config.toml",
  ".codex/hooks.json",
  "plugins/augnes-operator/.mcp.json",
  "plugins/augnes-operator/mcp.json",
];

for (const configPath of activeMcpConfigPaths) {
  assert.equal(existsSync(configPath), false, `${configPath} must not be added`);
}

assert.equal(
  packageJson.scripts?.["smoke:codex-mcp-augnes-bridge-docs"],
  "node scripts/smoke-codex-mcp-augnes-bridge-docs.mjs",
  "package.json must expose the bridge docs smoke script",
);

console.log(
  JSON.stringify(
    {
      smoke: "codex-mcp-augnes-bridge-docs",
      docs_present: true,
      example_present: true,
      bridge_url_documented: true,
      read_tools_documented: readTools.length,
      draft_review_proof_tools_documented: draftReviewProofTools.length,
      active_mcp_config_absent: true,
      example_local_only: true,
      authority_boundaries_documented: true,
    },
    null,
    2,
  ),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
