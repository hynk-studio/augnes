import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md";
const sourceScenarioPath = "docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md";
const sourceObservationPath =
  "docs/AUGNES_CORE_HANDOFF_CURRENT_TASK_USAGE_STATUS_DOGFOOD_OBSERVATION_V0_1.md";
const manifestPath = "fixtures/work-items.project-augnes.v0.json";
const demoSeedPath = "scripts/demo-seed.mjs";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [
  docPath,
  sourceScenarioPath,
  sourceObservationPath,
  manifestPath,
  demoSeedPath,
  runbookPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFileSync(docPath, "utf8");
const sourceScenario = readFileSync(sourceScenarioPath, "utf8");
const sourceObservation = readFileSync(sourceObservationPath, "utf8");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const demoSeed = readFileSync(demoSeedPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const workItemBlock = JSON.stringify(manifestWorkItem("AG-DOGFOOD-RESEARCH-001"), null, 2);

const expectedFiles = [
  "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
  "scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
  "package.json",
  "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
];

const expectedChecks = [
  "node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
  "git diff --check",
];

const previewShapes = [
  "research_session_preview",
  "paper_reference_preview",
  "claim_candidate",
  "evidence_candidate",
  "tension_candidate",
  "knowledge_gap_candidate",
  "perspective_update_candidate",
  "follow_up_work_candidate",
];

const boundaryPhrases = [
  "no unscoped automatic research ingestion",
  "no unscoped paper or source fetching",
  "no unscoped crawlers",
  "no unscoped provider/OpenAI calls",
  "no unscoped embeddings",
  "no unscoped RAG",
  "no unscoped vector search",
  "no unscoped indexing",
  "no database schema or migration in this preview pack",
  "no durable research candidate memory writes",
  "no proof/evidence writes",
  "no event creation/mutation",
  "no work close/status mutation",
  "no state commit/reject",
  "no perspective update commits",
  "no automatic work item creation",
  "no automatic Codex execution",
  "no shell execution from App/MCP",
  "no automatic GitHub fetch/review/merge/publish controls",
  "no branch or PR creation from App/MCP code",
  "no PR review submission",
  "no merge/publish/retry/replay/deploy controls",
  "no new user-facing App/MCP tools",
  "no widening of the `work_loop_readonly` Developer Mode tool surface",
];

const futureCapabilityLanePhrases = [
  "manual source intake",
  "bounded source fetching for operator-provided sources",
  "provider-assisted extraction or summary",
  "derived retrieval indexes",
  "durable research candidate memory",
  "human-reviewed perspective promotion",
];

assertDocShape();
assertSourceWorkRouting();
assertPackageScript();
assertRunbookPointer();
assertNoForbiddenImplementationPatterns(`${doc}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "research-accumulation-scenario-pack-v0-1",
      scenario_pack_doc_present: true,
      source_work_routing_checked: true,
      preview_shapes_checked: true,
      expected_files_and_checks_checked: true,
      preview_scope_stop_conditions_checked: true,
      future_authorized_capability_lanes_checked: true,
      package_script_checked: true,
      runbook_pointer_checked: true,
      preview_only_authority_boundaries_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertDocShape() {
  assert.match(
    doc,
    /^# Augnes Research Accumulation Scenario Pack v0\.1$/m,
    "scenario pack doc must have the expected title",
  );

  for (const heading of [
    "## Purpose",
    "## Source Work Routing",
    "## Preview Shapes Only",
    "## Preview-scope Stop Conditions, Not Permanent Product Bans",
    "## Shape Catalog",
    "## Scenario Flow",
    "## Expected Files And Checks",
    "## Authority Boundaries",
    "## Stop Conditions",
    "## Result Return Contract",
    "## What This Pack Does Not Implement",
    "## Next Recommended Step",
  ]) {
    assert.match(doc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `doc must include ${heading}`);
  }

  assert.match(doc, /\bAG-DOGFOOD-RESEARCH-001\b/, "doc must name the source work item");
  assert.match(doc, /\bproject:augnes\b/, "doc must name the source scope");
  assert.match(
    doc,
    /Research \/ Paper \/ Knowledge Accumulation/,
    "doc must describe the research accumulation direction",
  );
  assert.match(doc, /not database\s+schemas/i, "doc must state that preview shapes are not database schemas");
  assert.match(doc, /candidate status and human-review status/i, "doc must keep candidate review status explicit");
  assert.match(
    doc,
    /current preview implementation status, not a permanent product ban/i,
    "doc must scope current omissions as implementation status",
  );
  assert.match(
    doc,
    /fresh Work Brief or Core Handoff/i,
    "doc must require a fresh Work Brief or Core Handoff for future lanes",
  );
  assert.match(
    doc,
    /rebuildable,\s+non-authoritative,\s+and source-ref based/i,
    "doc must keep derived retrieval indexes rebuildable and non-authoritative",
  );
  assert.match(
    doc,
    /candidate or review records first/i,
    "doc must route durable research writes to candidate or review records first",
  );
  assert.match(
    doc,
    /Perspective update candidates remain candidates/i,
    "doc must keep perspective update candidates pending review gates",
  );

  for (const shapeName of previewShapes) {
    assert.match(doc, new RegExp(`^### ${escapeRegExp(shapeName)}$`, "m"), `doc must define ${shapeName}`);
  }

  for (const fieldName of [
    "research_question",
    "paper_reference_id",
    "claim_text",
    "evidence_summary",
    "tension_type",
    "why_it_matters",
    "target_state_key",
    "suggested_expected_checks",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(fieldName)), `doc must include field ${fieldName}`);
  }

  for (const expectedFile of expectedFiles) {
    assert.match(doc, new RegExp(escapeRegExp(expectedFile)), `doc must include expected file ${expectedFile}`);
  }

  for (const expectedCheck of expectedChecks) {
    assert.match(doc, new RegExp(escapeRegExp(expectedCheck)), `doc must include expected check ${expectedCheck}`);
  }

  for (const boundary of boundaryPhrases) {
    assert.match(doc, new RegExp(escapeRegExp(boundary)), `doc must include boundary ${boundary}`);
  }

  for (const lane of futureCapabilityLanePhrases) {
    assert.match(doc, new RegExp(escapeRegExp(lane)), `doc must include future lane ${lane}`);
  }

  assert.match(
    doc,
    /Paste this report through codexResultText or codexResultPaste for Augnes preview review\./,
    "doc must include the result-return path",
  );
}

function assertSourceWorkRouting() {
  assert.match(sourceScenario, /\bAG-DOGFOOD-RESEARCH-001\b/, "source scenario must name the work item");
  assert.match(sourceObservation, /Selected next PR candidate:\s+Add preview-only Research Accumulation Scenario Pack\s+doc\/smoke\./);
  assert.match(workItemBlock, /"work_id":\s*"AG-DOGFOOD-RESEARCH-001"/, "manifest must include the work item");
  assert.match(workItemBlock, /"status":\s*"completed"/, "seeded dogfood work item must be preserved as historical/completed");
  assert.match(workItemBlock, /"priority":\s*"normal"/, "seeded dogfood work item must not displace priority-now work");
  assert.match(demoSeed, /work-items\.project-augnes\.v0\.json/, "demo seed must load manifest work items");

  for (const expectedFile of expectedFiles) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(expectedFile)), `seed must include ${expectedFile}`);
  }

  for (const expectedCheck of expectedChecks) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(expectedCheck)), `seed must include ${expectedCheck}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-accumulation-scenario-pack-v0-1"],
    "node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
    "package.json must expose the research accumulation scenario pack smoke",
  );
}

function assertRunbookPointer() {
  assert.match(
    runbook,
    /AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1\.md/,
    "runbook must point to the scenario pack",
  );
  assert.match(
    runbook,
    /smoke:research-accumulation-scenario-pack-v0-1/,
    "runbook must point to the smoke script",
  );
}

function assertNoForbiddenImplementationPatterns(source) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile\s*\(/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bGITHUB_TOKEN\b/,
    /\bOPENAI_API_KEY\b/,
    /\bcreatePullRequest\b/i,
    /\bcreateBranch\b/i,
    /\bsubmitReview\b/i,
    /\bmerge\s*\(/i,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\bcommitStateUpdate\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bINSERT\s+INTO\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `pack must not include forbidden implementation pattern ${pattern}`);
  }
}

function manifestWorkItem(workId) {
  const item = manifest.work_items.find((candidate) => candidate.work_id === workId);
  assert.ok(item, `${workId} must exist in manifest`);
  return item;
}

function runbookPointer(source) {
  const marker = "AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 600), markerIndex + 600);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
