import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { buildBootstrapResult } from "./codex-next-work.mjs";

const manifestPath = "fixtures/work-items.project-augnes.v0.json";
const helperPath = "scripts/codex-next-work.mjs";
const demoSeedPath = "scripts/demo-seed.mjs";
const bootstrapDocPath = "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md";
const packagePath = "package.json";

const requiredWorkIds = [
  "AG-006",
  "AG-004",
  "AG-TEMPORAL-INTERPRETATION",
  "AG-DOGFOOD-RESEARCH-001",
  "AG-RESEARCH-CAPABILITY-LANES-001",
  "AG-001",
  "AG-000",
];

const requiredFields = [
  "work_id",
  "scope",
  "title",
  "status",
  "priority",
  "summary",
  "next_action",
  "user_attention_required",
  "related_state_keys",
  "links",
  "created_at",
  "updated_at",
];

for (const filePath of [manifestPath, helperPath, demoSeedPath, bootstrapDocPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const helperSource = readFileSync(helperPath, "utf8");
const demoSeedSource = readFileSync(demoSeedPath, "utf8");
const bootstrapDoc = readFileSync(bootstrapDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(manifest.manifest_version, "work-items.project-augnes.v0");
assert.equal(manifest.scope, "project:augnes");
assert.ok(Array.isArray(manifest.work_items), "manifest.work_items must be an array");
assert.deepEqual(
  manifest.work_items.map((item) => item.work_id),
  requiredWorkIds,
  "manifest must preserve seeded work item ordering",
);

for (const item of manifest.work_items) {
  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(item, field), `${item.work_id} must include ${field}`);
  }
  assert.equal(item.scope, "project:augnes", `${item.work_id} must keep project:augnes scope`);
  assert.equal(typeof item.title, "string", `${item.work_id} title must be a string`);
  assert.equal(typeof item.summary, "string", `${item.work_id} summary must be a string`);
  assert.equal(typeof item.next_action, "string", `${item.work_id} next_action must be a string`);
  assert.ok(Array.isArray(item.related_state_keys), `${item.work_id} related_state_keys must be an array`);
  assert.equal(typeof item.links, "object", `${item.work_id} links must be an object`);
}

const firstActiveSeededItem = manifest.work_items.find((item) => !isCompletedWorkStatus(item.status));
assert.equal(firstActiveSeededItem?.work_id, "AG-006", "default scope-only fallback must select AG-006");

const currentResearch = workItem("AG-RESEARCH-CAPABILITY-LANES-001");
const historicalDogfood = workItem("AG-DOGFOOD-RESEARCH-001");
assert.equal(currentResearch.status, "in_progress", "current research item must remain active");
assert.equal(historicalDogfood.status, "completed", "historical dogfood item must remain completed");
assert.notEqual(
  firstActiveSeededItem?.work_id,
  historicalDogfood.work_id,
  "historical dogfood item must not be the default active fallback",
);

for (const expectedFile of [
  "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md",
  "scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
  "scripts/demo-seed.mjs",
  "scripts/codex-next-work.mjs",
  "scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
  "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
  "package.json",
]) {
  assert.ok(
    currentResearch.links.expected_files.includes(expectedFile),
    `current research manifest item must preserve expected file ${expectedFile}`,
  );
}

for (const expectedCheck of [
  "node scripts/smoke-research-capability-lanes-preparation-v0-1.mjs",
  "node scripts/smoke-codex-worker-bootstrap-v0-1.mjs",
  "git diff --check",
]) {
  assert.ok(
    currentResearch.links.expected_checks.includes(expectedCheck),
    `current research manifest item must preserve expected check ${expectedCheck}`,
  );
}

for (const expectedFile of [
  "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
  "scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
  "package.json",
  "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
]) {
  assert.ok(
    historicalDogfood.links.expected_files.includes(expectedFile),
    `historical dogfood manifest item must preserve expected file ${expectedFile}`,
  );
}

for (const expectedCheck of [
  "node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs",
  "git diff --check",
]) {
  assert.ok(
    historicalDogfood.links.expected_checks.includes(expectedCheck),
    `historical dogfood manifest item must preserve expected check ${expectedCheck}`,
  );
}

assert.equal(
  packageJson.scripts?.["smoke:work-item-manifest-v0-1"],
  "node scripts/smoke-work-item-manifest-v0-1.mjs",
  "package.json must expose the manifest smoke",
);

assert.match(
  helperSource,
  /workItemManifestRelativePath\s*=\s*"fixtures\/work-items\.project-augnes\.v0\.json"/,
  "helper must load manifest",
);
assert.doesNotMatch(helperSource, /findSeededWorkBlock|readStringProperty|readArrayProperty|readSeededWorkIds/);
assert.doesNotMatch(helperSource, /workId:\\s\*\\"|\bworkId:\s*"/, "helper must not parse workId blocks");
assert.match(demoSeedSource, /work-items\.project-augnes\.v0\.json/, "demo seed must load manifest");
assert.match(bootstrapDoc, /fixtures\/work-items\.project-augnes\.v0\.json/, "bootstrap doc must name manifest fallback source");

const defaultFallback = await buildBootstrapResult({
  scope: "project:augnes",
  runtimeMode: "never",
});
assert.equal(defaultFallback.source, "repo_seed_fallback");
assert.equal(defaultFallback.work_id, "AG-006");
assert.equal(defaultFallback.repo_fallback_sources[0], manifestPath);
assert.deepEqual(
  defaultFallback.repo_fallback_sources,
  [
    manifestPath,
    "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md",
    "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage",
    "lib/db/schema.sql#coordination_events",
    "lib/coordination-events.ts",
    "app/api/events/route.ts",
  ],
  "default AG-006 fallback sources must preserve current codex:next-work output apart from the explicit manifest source",
);

const preferredResearch = await buildBootstrapResult({
  scope: "project:augnes",
  preferResearch: true,
  runtimeMode: "never",
});
assert.equal(preferredResearch.source, "repo_seed_fallback");
assert.equal(preferredResearch.work_id, "AG-RESEARCH-CAPABILITY-LANES-001");
assert.ok(
  preferredResearch.expected_files.includes("docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md"),
  "prefer-research fallback must preserve research expected files",
);
assert.ok(
  preferredResearch.expected_checks.includes("node scripts/smoke-research-capability-lanes-preparation-v0-1.mjs"),
  "prefer-research fallback must preserve research expected checks",
);

const explicitDogfood = await buildBootstrapResult({
  scope: "project:augnes",
  workId: "AG-DOGFOOD-RESEARCH-001",
  runtimeMode: "never",
});
assert.equal(explicitDogfood.source, "repo_seed_fallback");
assert.equal(explicitDogfood.work_id, "AG-DOGFOOD-RESEARCH-001");
assert.ok(
  explicitDogfood.expected_files.includes("docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md"),
  "explicit dogfood fallback must preserve dogfood expected files",
);
assert.ok(
  explicitDogfood.expected_checks.includes("node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs"),
  "explicit dogfood fallback must preserve dogfood expected checks",
);
assert.match(
  explicitDogfood.codex_worker_next_action,
  /only when that work ID is explicitly requested/,
  "historical dogfood item must remain explicit-only",
);

assertNoForbiddenAuthorityFilesChanged();

console.log(
  JSON.stringify(
    {
      smoke: "work-item-manifest-v0-1",
      manifest_exists_and_valid_json: true,
      required_work_item_ids_present_in_order: true,
      required_fields_present: true,
      default_scope_only_fallback_ag_006: true,
      prefer_research_fallback_capability_lanes: true,
      explicit_dogfood_lookup_preserved: true,
      expected_files_and_checks_preserved: true,
      codex_next_work_uses_manifest_not_demo_seed_parser: true,
      demo_seed_loads_manifest: true,
      forbidden_authority_files_unchanged: true,
    },
    null,
    2,
  ),
);

function workItem(workId) {
  const item = manifest.work_items.find((candidate) => candidate.work_id === workId);
  assert.ok(item, `${workId} must exist`);
  return item;
}

function isCompletedWorkStatus(status) {
  return ["completed", "done", "closed", "cancelled", "canceled"].includes(status);
}

function assertNoForbiddenAuthorityFilesChanged() {
  const changedFiles = uniqueStrings([
    ...gitChangedFiles(["diff", "--name-only", "origin/main...HEAD"]),
    ...gitChangedFiles(["diff", "--name-only", "HEAD"]),
    ...gitChangedFiles(["diff", "--cached", "--name-only"]),
    ...gitChangedFiles(["ls-files", "--others", "--exclude-standard"]),
  ]);

  const forbiddenPathPatterns = [
    /^app\/api\//,
    /^apps\/augnes_apps\/src\/server\.ts$/,
    /^lib\/db\/schema\.sql$/,
    /^migrations\//,
    /^lib\/.*provider/i,
    /^lib\/.*github/i,
    /^lib\/.*evidence/i,
    /^app\/.*route\./,
    /package-lock\.json$/,
  ];

  for (const filePath of changedFiles) {
    for (const pattern of forbiddenPathPatterns) {
      assert.doesNotMatch(filePath, pattern, `forbidden authority file changed: ${filePath}`);
    }
  }
}

function gitChangedFiles(args) {
  try {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    return output ? output.split(/\r?\n/) : [];
  } catch {
    return [];
  }
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}
