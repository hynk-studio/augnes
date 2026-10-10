import assert from "node:assert/strict";
import { chmodSync, mkdirSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  RESEARCH_REGISTRATION_PATH, RESEARCH_SOURCE_PATHS, RESEARCH_OWNER_ID,
  parseResearchRegistration, validateResearchRegistration, assertAdditiveResearchRegistration,
  loadResearchTestSteps,
} from "./canonical-research-registration.mjs";
import { planCanonicalChange } from "./canonical-change-planner.mjs";
import { buildPhasePlan } from "./run-local-canonical-verification.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

const encode = ids => JSON.stringify({ schema: "augnes.canonical-research-tests.v1", test_ids: ids }, null, 2) + "\n";
const active = encode([RESEARCH_OWNER_ID]);
const owner = createCanonicalTestResourceRoot("ag-c28-");
const results = [];
function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", timeout: 30_000 });
  assert.equal(r.status, 0, `${args[0]}: ${r.stderr}`);
  return r.stdout.trim();
}
function write(root, file, contents) {
  const target = path.join(root, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}
function commit(root) { git(root, "add", "--all"); git(root, "commit", "--quiet", "-m", "fixture"); return git(root, "rev-parse", "HEAD"); }
function family(root) {
  for (const file of RESEARCH_SOURCE_PATHS) write(root, file, file.endsWith(".json") ? "{}\n" : "// research fixture\n");
  write(root, RESEARCH_REGISTRATION_PATH, active);
}
function check(name, expected, mutate, seed = () => {}) {
  const root = path.join(owner.root, name); mkdirSync(root);
  git(root, "init", "--quiet"); git(root, "config", "user.email", "fixture@example.invalid"); git(root, "config", "user.name", "Fixture");
  write(root, "README.md", "# Fixture\n");
  write(root, RESEARCH_REGISTRATION_PATH, encode([])); seed(root);
  const baseSha = commit(root); mutate(root); const headSha = commit(root);
  const plan = planCanonicalChange({ cwd: root, eventName: "pull_request", baseSha, headSha });
  assert.equal(plan.plan, expected, `${name}: ${plan.full_reasons}`);
  if (expected === "owner-targeted") {
    assert.deepEqual(plan.targeted_phase_ids, ["targeted-change-validator", "dependencies-root", "dependencies-nested", "dependencies-web-planning", "typecheck", "unit", "authority"]);
    assert.deepEqual(plan.browser_phase_ids, []);
    assert.deepEqual(buildPhasePlan({ mode: "changed", selectedPlan: plan.plan, baseSha, headSha,
      targetedPhaseIds: plan.targeted_phase_ids }).map(x => x.id), plan.targeted_phase_ids);
  }
  results.push(name);
}
try {
  assert.deepEqual(parseResearchRegistration(active), [RESEARCH_OWNER_ID]);
  for (const invalid of [encode([RESEARCH_OWNER_ID, RESEARCH_OWNER_ID]), encode(["unreviewed"]),
    active.replace('"test_ids":', '"command": "true", "test_ids":'),
    active.replace('"test_ids":', '"phase": "unit", "test_ids":'),
    active.replace('"test_ids":', '"test_ids": [], "test_ids":'), "{}\n", "null\n", "{"]) {
    assert.throws(() => parseResearchRegistration(invalid), /research_registration_/);
  }
  assert.throws(() => assertAdditiveResearchRegistration([RESEARCH_OWNER_ID], []), /removal_or_replacement/);
  assert.throws(() => validateResearchRegistration(encode([]), () => "100644"), /missing_test/);
  assert.throws(() => validateResearchRegistration(active, file => file.endsWith("check.mjs") ? null : "100644"), /incomplete_or_unsafe_family/);
  check("real-family-shape-addition", "owner-targeted", family);
  check("existing-family-source-edit", "owner-targeted", root => write(root, RESEARCH_SOURCE_PATHS[1], "// changed research computation\n"), family);
  check("existing-family-test-edit", "owner-targeted", root => write(root, RESEARCH_SOURCE_PATHS.at(-1), "// new regression assertion\n"), family);
  check("missing-registration", "full-canonical", root => { family(root); write(root, RESEARCH_REGISTRATION_PATH, encode([])); });
  check("missing-required-check", "full-canonical", root => { family(root); unlinkSync(path.join(root, RESEARCH_SOURCE_PATHS.at(-1))); });
  check("registration-deletion", "full-canonical", root => unlinkSync(path.join(root, RESEARCH_REGISTRATION_PATH)), family);
  check("registration-omission", "full-canonical", root => write(root, RESEARCH_REGISTRATION_PATH, encode([])), family);
  check("registration-replacement", "full-canonical", root => write(root, RESEARCH_REGISTRATION_PATH, encode(["replacement"])), family);
  check("duplicate-ids", "full-canonical", root => { family(root); write(root, RESEARCH_REGISTRATION_PATH, encode([RESEARCH_OWNER_ID, RESEARCH_OWNER_ID])); });
  check("arbitrary-command", "full-canonical", root => { family(root); write(root, RESEARCH_REGISTRATION_PATH, active.replace('"test_ids":', '"command": "true", "test_ids":')); });
  check("arbitrary-phase", "full-canonical", root => { family(root); write(root, RESEARCH_REGISTRATION_PATH, active.replace('"test_ids":', '"phase_ids": [], "test_ids":')); });
  check("missing-base-registration", "full-canonical", family, root => unlinkSync(path.join(root, RESEARCH_REGISTRATION_PATH)));
  check("altered-base-registration", "full-canonical", family, root => write(root, RESEARCH_REGISTRATION_PATH, "{}\n"));
  check("source-deletion", "full-canonical", root => unlinkSync(path.join(root, RESEARCH_SOURCE_PATHS[1])), family);
  check("executable-mode", "full-canonical", root => { family(root); chmodSync(path.join(root, RESEARCH_SOURCE_PATHS[1]), 0o755); });
  check("symlink-source", "full-canonical", root => { family(root); unlinkSync(path.join(root, RESEARCH_SOURCE_PATHS[1])); symlinkSync("io.mjs", path.join(root, RESEARCH_SOURCE_PATHS[1])); });
  check("unknown-family-helper", "full-canonical", root => { family(root); write(root, "scripts/hypothesis-cache-study/new-helper.mjs", "export {};\n"); });
  for (const file of ["scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-verification-contract.mjs",
    "scripts/canonical-research-registration.mjs", "scripts/canonical-change-planner.mjs", "scripts/local-canonical-change-owners.v1.json",
    "scripts/canonical-test-environment.mjs", "lib/vnext/persistence/durable-semantic-store.ts", "data/migrations/999.sql",
    "lib/vnext/native-host/credential-store.ts", "package.json", "lib/new-consumer.ts"]) {
    check(`shared-${results.length}`, "full-canonical", root => { family(root); write(root, file, "// shared responsibility change\n"); });
  }
  const root = path.join(owner.root, "runtime"); mkdirSync(root); family(root);
  const [step] = loadResearchTestSteps(root);
  assert.throws(() => loadResearchTestSteps(root, [RESEARCH_OWNER_ID]), /conflicting_id/);
  assert.equal(step.id, RESEARCH_OWNER_ID); assert.equal(step.command, process.execPath);
  assert.deepEqual(step.args, ["scripts/test-hypothesis-cache-study.mjs"]);
  assert.equal(step.timeoutMs, 10_000); assert.equal(step.requireNaturalExit, true);
  assert.deepEqual(step.requirements, ["filesystem", "immutable-fixture-input"]);
  unlinkSync(path.join(root, RESEARCH_SOURCE_PATHS.at(-1)));
  assert.throws(() => loadResearchTestSteps(root), /incomplete_or_unsafe_family/);
  family(root); write(root, RESEARCH_REGISTRATION_PATH, encode([]));
  assert.throws(() => loadResearchTestSteps(root), /missing_test/);
  family(root); unlinkSync(path.join(root, "scripts/hypothesis-cache-study/README.md"));
  symlinkSync("fixtures.json", path.join(root, "scripts/hypothesis-cache-study/README.md"));
  assert.throws(() => loadResearchTestSteps(root), /incomplete_or_unsafe_family/);
  console.log(JSON.stringify({ status: "pass", cases: results, runtime_inventory: "fixed commands, required test, unsafe and omitted inputs refused" }, null, 2));
} finally {
  const cleanup = cleanupCanonicalTestResources([owner]);
  assert(cleanup.every(x => x.completed));
}
