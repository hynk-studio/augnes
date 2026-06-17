import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildBootstrapResult } from "./codex-next-work.mjs";

const rootDir = process.cwd();
const bootstrapDocPath = "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md";
const helperPath = "scripts/codex-next-work.mjs";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packageJsonPath = "package.json";
const workId = "AG-DOGFOOD-RESEARCH-001";

const bootstrapDoc = readText(bootstrapDocPath);
const helperSource = readText(helperPath);
const runbook = readText(runbookPath);
const packageJson = JSON.parse(readText(packageJsonPath));

assertIncludes(bootstrapDoc, workId, "bootstrap doc references AG-DOGFOOD-RESEARCH-001");
assertIncludes(
  bootstrapDoc,
  "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
  "bootstrap doc references the research accumulation scenario pack",
);
assertIncludes(
  bootstrapDoc,
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "bootstrap doc references the Codex result report template",
);
assertIncludes(bootstrapDoc, "codexResultText", "bootstrap doc references codexResultText");
assertIncludes(bootstrapDoc, "codexResultPaste", "bootstrap doc references codexResultPaste");
assertIncludes(bootstrapDoc, "Runtime Work Brief retrieval is preferred", "runtime Work Brief preferred path is documented");
assertIncludes(bootstrapDoc, "Repo seed/docs fallback is acceptable only when runtime is unavailable", "repo-backed fallback path is documented");
assertIncludes(bootstrapDoc, "Fallback honesty is required", "fallback honesty is documented");

for (const field of [
  "source",
  "runtime_attempted",
  "runtime_available",
  "fallback_reason",
  "work_id",
  "scope",
  "title",
  "current_task",
  "expected_files",
  "expected_checks",
  "stop_conditions",
  "authority_boundary_summary",
  "result_report_template",
  "next_return_path",
  "codex_worker_next_action",
]) {
  assertIncludes(bootstrapDoc, `\`${field}\``, `bootstrap doc includes expected output field ${field}`);
}

assert.equal(
  packageJson.scripts["codex:next-work"],
  "node scripts/codex-next-work.mjs",
  "package.json exposes codex:next-work",
);
assert.equal(
  packageJson.scripts["smoke:codex-worker-bootstrap-v0-1"],
  "node scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
  "package.json exposes smoke:codex-worker-bootstrap-v0-1",
);

assertIncludes(helperSource, workId, "bootstrap helper contains AG-DOGFOOD fallback support");
assertIncludes(helperSource, "repo_seed_fallback", "bootstrap helper can report repo seed fallback");
assertIncludes(runbook, bootstrapDocPath, "runbook points Codex workers to the bootstrap doc");

const requested = await buildBootstrapResult({
  scope: "project:augnes",
  workId,
  runtimeMode: "never",
});
assertFallbackForResearch(requested, "requested work-id fallback");

const preferred = await buildBootstrapResult({
  scope: "project:augnes",
  preferResearch: true,
  runtimeMode: "never",
});
assertFallbackForResearch(preferred, "prefer-research fallback");

assertNoForbiddenPatterns({
  [bootstrapDocPath]: bootstrapDoc,
  [helperPath]: helperSource,
  [runbookPath]: runbook,
});

console.log(
  JSON.stringify(
    {
      smoke: "codex-worker-bootstrap-v0-1",
      bootstrap_doc_exists: true,
      ag_dogfood_research_reference: true,
      research_scenario_pack_reference: true,
      result_report_template_reference: true,
      codex_result_text_paste_reference: true,
      runtime_work_brief_preferred_path_documented: true,
      repo_backed_fallback_path_documented: true,
      fallback_honesty_documented: true,
      expected_output_shape_fields_documented: true,
      package_codex_next_work_script: true,
      package_smoke_script: true,
      helper_ag_dogfood_fallback_support: true,
      deterministic_requested_fallback_returns_ag_dogfood: true,
      deterministic_prefer_research_returns_ag_dogfood: true,
      forbidden_authority_patterns_found: false,
    },
    null,
    2,
  ),
);

function assertFallbackForResearch(result, label) {
  assert.equal(result.source, "repo_seed_fallback", `${label} reports repo seed fallback`);
  assert.equal(result.runtime_attempted, false, `${label} does not attempt runtime in deterministic mode`);
  assert.equal(result.runtime_available, false, `${label} reports runtime unavailable`);
  assert.equal(result.work_id, workId, `${label} returns AG-DOGFOOD-RESEARCH-001`);
  assert.equal(result.scope, "project:augnes", `${label} preserves scope`);
  assertIncludes(result.title, "Research accumulation scenario pack", `${label} returns research title`);
  assert.ok(
    result.expected_files.includes("docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md"),
    `${label} returns expected scenario pack file`,
  );
  assert.ok(
    result.expected_checks.includes("node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs"),
    `${label} returns expected smoke check`,
  );
  assert.equal(
    result.result_report_template,
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    `${label} returns result report template`,
  );
  assertIncludes(
    result.next_return_path,
    "codexResultText or codexResultPaste",
    `${label} returns result-return path`,
  );
}

function assertNoForbiddenPatterns(files) {
  const forbiddenPatterns = [
    "child_process",
    "spawn(",
    "exec(",
    "execFile(",
    "api.github.com",
    "api.openai.com",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "createPullRequest",
    "createBranch",
    "submitReview",
    "merge(",
    "record-proof",
    "record-evidence",
    "commitStateUpdate",
    "fetch(",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "CREATE TABLE",
    "ALTER TABLE",
    "INSERT INTO",
  ];

  for (const [filePath, contents] of Object.entries(files)) {
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(contents, new RegExp(escapeRegExp(pattern)), `${filePath} must not contain ${pattern}`);
    }
  }
}

function assertIncludes(value, expected, message) {
  assert.ok(value.includes(expected), message);
}

function readText(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  assert.ok(fs.existsSync(absolutePath), `${relativePath} exists`);
  return fs.readFileSync(absolutePath, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
