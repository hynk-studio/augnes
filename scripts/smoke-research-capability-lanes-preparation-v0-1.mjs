import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md";
const demoSeedPath = "scripts/demo-seed.mjs";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";
const workId = "AG-RESEARCH-CAPABILITY-LANES-001";
const historicalDogfoodWorkId = "AG-DOGFOOD-RESEARCH-001";

for (const filePath of [docPath, demoSeedPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFileSync(docPath, "utf8");
const demoSeed = readFileSync(demoSeedPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const workItemBlock = extractObjectContainingMarker(demoSeed, `workId: "${workId}"`);
const dogfoodWorkItemBlock = extractObjectContainingMarker(demoSeed, `workId: "${historicalDogfoodWorkId}"`);

const expectedFiles = [
  "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md",
  "scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
  "scripts/demo-seed.mjs",
  "scripts/codex-next-work.mjs",
  "scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
  "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
  "package.json",
];

const expectedChecks = [
  "node scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
  "node scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
  "git diff --check",
];

const futureLanes = [
  "manual source intake",
  "bounded operator-provided source fetching",
  "provider-assisted extraction/summary",
  "derived retrieval indexes",
  "durable research candidate memory",
  "human-reviewed perspective promotion",
];

assertDocShape();
assertSeedWorkItem();
assertRunbookPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns(`${doc}\n\n${workItemBlock}\n\n${runbookPointer(runbook)}`);

console.log(
  JSON.stringify(
    {
      smoke: "research-capability-lanes-preparation-v0-1",
      preparation_doc_present: true,
      seed_work_item_present: true,
      historical_dogfood_work_item_preserved: true,
      expected_files_and_checks_checked: true,
      future_lanes_checked: true,
      non_authoritative_authority_model_checked: true,
      first_product_slice_checked: true,
      package_script_checked: true,
      runbook_pointer_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertDocShape() {
  assert.match(
    doc,
    /^# Augnes Research Capability Lanes Preparation v0\.1$/m,
    "preparation doc must have expected title",
  );

  for (const heading of [
    "## Purpose",
    "## Source Work Routing",
    "## Bounded Lane Contract",
    "## Authority Model",
    "## First Recommended Product Slice",
    "## Expected Files And Checks",
    "## Stop Conditions",
    "## What This Preparation Slice Does Not Implement",
    "## Next Recommended Step",
  ]) {
    assert.match(doc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `doc must include ${heading}`);
  }

  assert.match(doc, new RegExp(escapeRegExp(workId)), "doc must name active work item");
  assert.match(doc, new RegExp(escapeRegExp(historicalDogfoodWorkId)), "doc must preserve historical dogfood ID");
  assert.match(
    doc,
    /preparation and contract slice for product-facing Research\s+capability lanes/i,
    "doc must scope itself as preparation/contract work",
  );

  for (const lane of futureLanes) {
    assert.match(doc, new RegExp(escapeRegExp(lane)), `doc must list lane ${lane}`);
  }

  for (const phrase of [
    "candidate inputs",
    "until human review",
    "rebuildable, source-ref based, and",
    "non-authoritative",
    "candidate/review records",
    "Perspective updates remain candidates",
    "No lane mutates perspective memory by itself",
    "cannot create proof/evidence rows",
    "Augnes state commit/reject authority by themselves",
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(phrase)), `doc must include authority phrase ${phrase}`);
  }

  assert.match(
    doc,
    /Start with a user-facing candidate review surface for manually supplied\s+source\/reference\/notes/s,
    "doc must define the first recommended product slice",
  );
  assert.match(doc, /Do not start with crawler\/RAG first/, "doc must defer crawler/RAG");

  for (const expectedFile of expectedFiles) {
    assert.match(doc, new RegExp(escapeRegExp(expectedFile)), `doc must include expected file ${expectedFile}`);
  }
  for (const expectedCheck of expectedChecks) {
    assert.match(doc, new RegExp(escapeRegExp(expectedCheck)), `doc must include expected check ${expectedCheck}`);
  }
}

function assertSeedWorkItem() {
  assert.match(workItemBlock, new RegExp(`workId:\\s*"${escapeRegExp(workId)}"`), "seed must include active work item");
  assert.match(workItemBlock, /status:\s*"in_progress"/, "active work item must be in progress");
  assert.match(workItemBlock, /priority:\s*"normal"/, "active work item must not displace priority-now work");
  assert.match(workItemBlock, /Research capability lane plan/, "active work item must describe capability lane planning");

  for (const stateKey of [
    "research.capability_lanes",
    "research.accumulation.preview",
    "perspective.development",
    "integration.chatgpt_app",
  ]) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(stateKey)), `seed must include state key ${stateKey}`);
  }

  for (const expectedFile of expectedFiles) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(expectedFile)), `seed must include expected file ${expectedFile}`);
  }
  for (const expectedCheck of expectedChecks) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(expectedCheck)), `seed must include expected check ${expectedCheck}`);
  }

  for (const phrase of [
    "no source fetching",
    "no crawler",
    "no provider/OpenAI call",
    "no embeddings/RAG/vector/FTS/index implementation",
    "no DB migration",
    "no durable research writes",
    "no candidate/review record storage",
    "no perspective promotion",
    "no proof/evidence writes",
    "no state commit/reject",
    "no API route changes",
    "no App/MCP tool changes",
    "no automatic Codex execution",
    "no GitHub automation",
  ]) {
    assert.match(workItemBlock, new RegExp(escapeRegExp(phrase)), `seed must include boundary ${phrase}`);
  }

  assert.match(dogfoodWorkItemBlock, /status:\s*"completed"/, "dogfood work item must be historical/completed");
}

function assertRunbookPointer() {
  assert.match(
    runbook,
    /AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1\.md/,
    "runbook must point to the preparation doc",
  );
  assert.match(
    runbook,
    /smoke:research-capability-lanes-preparation-v0-1/,
    "runbook must point to the preparation smoke",
  );
  assert.match(
    runbook,
    /current product-facing research preparation lane/,
    "runbook must label the active preparation lane",
  );
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-capability-lanes-preparation-v0-1"],
    "node scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
    "package.json must expose the preparation smoke",
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
    assert.doesNotMatch(source, pattern, `preparation slice must not include forbidden implementation pattern ${pattern}`);
  }
}

function extractObjectContainingMarker(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} must exist`);
  const objectStart = source.lastIndexOf("{", markerIndex);
  assert.notEqual(objectStart, -1, `${marker} must be inside an object`);
  let depth = 0;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }
  throw new Error(`${marker} object did not terminate`);
}

function runbookPointer(source) {
  const marker = "AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md";
  const markerIndex = source.indexOf(marker);
  return markerIndex === -1 ? "" : source.slice(Math.max(0, markerIndex - 600), markerIndex + 600);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
