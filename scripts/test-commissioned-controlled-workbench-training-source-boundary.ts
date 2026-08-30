import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

import {
  createCommissionedControlledWorkTrainingOnlyFamilyV01,
} from "@/fixtures/vnext/research/commissioned-controlled-workbench-training-v0-1";
import {
  assertValidCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingCohortPlanV01,
} from "@/lib/vnext/commissioned-controlled-live-training";

const repositoryRoot = realpathSync(process.cwd());
const trainingOwnerPath = path.join(
  repositoryRoot,
  "fixtures/vnext/research/commissioned-controlled-workbench-training-v0-1.ts",
);
const mixedFixturePath = path.join(
  repositoryRoot,
  "fixtures/vnext/research/commissioned-controlled-workbench-v0-1.ts",
);
const commitmentPath = path.join(
  repositoryRoot,
  "fixtures/vnext/research/commissioned-controlled-workbench-holdout-commitment-v0-1.ts",
);
const liveTrainingTestPath = path.join(
  repositoryRoot,
  "scripts/test-commissioned-controlled-live-training.ts",
);

const visited = new Set<string>();
let commitmentTerminalReached = false;

function resolveLocalModule(fromPath: string, specifier: string): string | null {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const basePath = specifier.startsWith("@/")
    ? path.join(repositoryRoot, specifier.slice(2))
    : path.resolve(path.dirname(fromPath), specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mjs`,
    path.join(basePath, "index.ts"),
  ];
  for (const candidate of candidates) {
    const normalizedCandidate = path.normalize(candidate);
    assert.notEqual(
      normalizedCandidate,
      mixedFixturePath,
      "training_source_dependency_reaches_mixed_holdout_fixture",
    );
    if (existsSync(normalizedCandidate) && statSync(normalizedCandidate).isFile()) {
      return normalizedCandidate;
    }
  }
  throw new Error(`training_source_dependency_unresolved:${specifier}`);
}

function inspectPermittedDependency(modulePath: string): void {
  const normalizedPath = path.normalize(modulePath);
  assert.notEqual(
    normalizedPath,
    mixedFixturePath,
    "forbidden_mixed_fixture_must_be_rejected_before_read",
  );
  if (normalizedPath === commitmentPath) {
    commitmentTerminalReached = true;
    return;
  }
  if (visited.has(normalizedPath)) return;
  visited.add(normalizedPath);

  const source = readFileSync(normalizedPath, "utf8");
  const sourceFile = ts.createSourceFile(
    normalizedPath,
    source,
    ts.ScriptTarget.Latest,
    false,
  );
  const specifiers: string[] = [];
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }
  for (const specifier of specifiers) {
    const dependencyPath = resolveLocalModule(normalizedPath, specifier);
    if (dependencyPath) inspectPermittedDependency(dependencyPath);
  }
}

inspectPermittedDependency(trainingOwnerPath);
assert.equal(commitmentTerminalReached, true);
assert.equal(visited.has(mixedFixturePath), false);

const liveTrainingTestSource = readFileSync(liveTrainingTestPath, "utf8");
assert.match(
  liveTrainingTestSource,
  /from "@\/fixtures\/vnext\/research\/commissioned-controlled-workbench-training-v0-1"/,
);
assert.doesNotMatch(
  liveTrainingTestSource,
  /from "@\/fixtures\/vnext\/research\/commissioned-controlled-workbench-v0-1"/,
);
inspectPermittedDependency(liveTrainingTestPath);
assert.equal(visited.has(mixedFixturePath), false);

const trainingFamily = createCommissionedControlledWorkTrainingOnlyFamilyV01();
assert.deepEqual(
  trainingFamily.training_cases.map((source) => source.case_id),
  ["case-amber-17", "case-cobalt-29", "case-cedar-41"],
);
assert.equal(trainingFamily.manifest.holdout_case.case_role, "holdout");
assert.equal(trainingFamily.manifest.holdout_content_in_manifest, false);

const plan = buildCommissionedLiveTrainingCohortPlanV01({
  manifest: trainingFamily.manifest,
  training_cases: trainingFamily.training_cases,
  cohort_id: "cw1-l1-training-source-boundary-test",
  sealed_at: "2026-08-31T00:00:00.000Z",
});
assertValidCommissionedLiveTrainingCohortPlanV01(plan);
assert.equal(plan.slots.filter((slot) => slot.slot_role === "predecessor").length, 3);
assert.equal(plan.slots.filter((slot) => slot.slot_role === "cold_successor").length, 12);
assert.equal(plan.slots.length, 15);
assert.equal(
  plan.schedule_fingerprint,
  "sha256:ff97505d8e1a3ad88420a772f575d4a5eaea805ac31be7fed760145946d62d35",
);
assert.equal(plan.replacement_invocation_limit, 3);
assert.equal(plan.holdout_source_materialized, false);
assert.equal(plan.holdout_execution_authorized, false);
assert.equal(plan.holdout_candidate_freeze_authorized, false);

console.log(JSON.stringify({
  status: "commissioned_controlled_workbench_training_source_boundary_ok",
  permitted_module_count: visited.size,
  holdout_commitment_terminal_reached: commitmentTerminalReached,
  training_case_ids: trainingFamily.training_cases.map((source) => source.case_id),
  schedule_fingerprint: plan.schedule_fingerprint,
}));
