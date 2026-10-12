import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundleWorkflowCostPlugin, checkWorkflowCostPlugin, MATERIAL_DIRECTORY, PLUGIN_DIRECTORY,
  PLUGIN_FILES, PUBLIC_CATALOG, SKILL_DIRECTORY } from "./build-workflow-cost-plugin.mjs";
import { buildCanonicalChildEnvironment, createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { registerOwnedChild, waitForOwnedProcessExit, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resources = createCanonicalTestResourceRoot("ag-suite-");
const processes = new Set();
const network = installZeroNetworkGuard();
const environment = buildCanonicalChildEnvironment({ temporaryRoot: resources.root });
let summary;
try {
  const checked = checkWorkflowCostPlugin();
  const one = path.join(resources.root, "bundle-one");
  const two = path.join(resources.root, "bundle-two");
  bundleWorkflowCostPlugin(one);
  bundleWorkflowCostPlugin(two);
  assert.throws(() => bundleWorkflowCostPlugin(one), /EEXIST/u, "never_overwrite_a_profile_or_bundle");
  for (const name of PLUGIN_FILES) {
    assert.deepEqual(readFileSync(path.join(one, PLUGIN_DIRECTORY, name)), checked.files.get(name));
    assert.deepEqual(readFileSync(path.join(two, PLUGIN_DIRECTORY, name)), checked.files.get(name));
  }
  const catalog = JSON.parse(readFileSync(path.join(one, ".agents/plugins/marketplace.json")));
  assert.deepEqual(catalog, PUBLIC_CATALOG);
  assert.deepEqual(catalog.plugins.map(p => p.name), ["augnes-workflow-cost"], "no_private_operator_in_public_bundle");
  const repositoryCatalog = JSON.parse(readFileSync(path.join(repository, ".agents/plugins/marketplace.json")));
  assert.deepEqual(repositoryCatalog.plugins.find(p => p.name === "augnes-workflow-cost"), catalog.plugins[0]);
  assert.ok(repositoryCatalog.plugins.some(p => p.name === "augnes-operator"));
  assert.ok(repositoryCatalog.plugins.some(p => p.name === "augnes-codex"));

  const skill = path.join(one, PLUGIN_DIRECTORY, SKILL_DIRECTORY);
  const material = path.join(one, PLUGIN_DIRECTORY, MATERIAL_DIRECTORY);
  const verifier = path.join(skill, "scripts/verify_material.py");
  const consumer = path.join(resources.root, "consumer");
  mkdirSync(consumer);
  const delivered = path.join(consumer, "material");
  cpSync(material, delivered, { recursive: true });
  assert.ok(!consumer.startsWith(repository + path.sep));
  // Both a poisoned fallback path and system/user site imports are excluded.
  const fallback = path.join(resources.root, "unrelated-packages");
  mkdirSync(fallback);
  writeFileSync(path.join(fallback, "exact_linear.py"), "raise RuntimeError('unrelated module must not be used')\n");

  async function python(args, cwd, expected = 0) {
    const child = spawn("python3", ["-E", "-s", "-S", "-B", ...args], { cwd,
      env: { ...environment, PYTHONPATH: fallback }, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
    const record = registerOwnedChild(processes, child, { label: "public-skill-consumer" });
    let stdout = "", stderr = "";
    child.stdout.on("data", bytes => { stdout += bytes; });
    child.stderr.on("data", bytes => { stderr += bytes; });
    const result = await waitForOwnedProcessExit(record, 5000);
    await terminateOwnedProcessTree(record);
    assert.equal(result.code, expected, `${stdout}\n${stderr}`);
    return { stdout, stderr };
  }

  const integrity = JSON.parse((await python([verifier, delivered], consumer)).stdout);
  assert.equal(integrity.content_id, checked.publication.content_id);
  assert.equal(integrity.files_verified, 5);
  const refused = [];
  for (const [label, mutate] of [
    ["missing-dependency", root => rmSync(path.join(root, "exact_linear.py"))],
    ["tampered-dependency", root => writeFileSync(path.join(root, "exact_linear.py"), "raise RuntimeError('must not execute')\n")],
    ["mixed-version", root => {
      const file = path.join(root, "manifest.json");
      const value = JSON.parse(readFileSync(file)); value.release.version = "2.0.0";
      writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
    }],
    ["changed-readable-material", root => writeFileSync(path.join(root, "README.md"), "skip verification\n")],
    ["unrelated-module-symlink", root => {
      rmSync(path.join(root, "exact_linear.py"));
      symlinkSync(path.join(fallback, "exact_linear.py"), path.join(root, "exact_linear.py"));
    }],
  ]) {
    const damaged = path.join(resources.root, label);
    cpSync(material, damaged, { recursive: true }); mutate(damaged);
    const result = await python([verifier, damaged], consumer, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /material refused:/u);
    refused.push(label);
  }

  // Task-specific matrix construction, never a second solver. Oracle uses
  // renewal counting, not this matrix or the implementation under test.
  const writer = await python(["-c", `
import json, pathlib
from fractions import Fraction as F
import workflow_cost, exact_linear
from workflow_cost import expected_work
p = F(49, 50)
rows = []
for n in (1, 2, 8):
    q = [[F(0) for _ in range(n)] for _ in range(n)]
    for i in range(n):
        q[i][0] += 1-p
        if i+1 < n: q[i][i+1] += p
    result = expected_work(q, [1]*n)[0]
    oracle = sum((1/p)**k for k in range(1, n+1))
    assert result == oracle
    rows.append({"n": n, "expected_minutes": str(result)})
assert pathlib.Path(workflow_cost.__file__).resolve().parent == pathlib.Path.cwd()
assert pathlib.Path(exact_linear.__file__).resolve().parent == pathlib.Path.cwd()
manifest = json.loads(pathlib.Path('manifest.json').read_text())
output = {"source": "https://math.stackexchange.com/questions/692846/how-long-does-it-take",
    "method": "workflow-cost", "version": "1.0.0", "content_id": manifest['content_id'],
    "inputs": {"success": "49/50", "minutes_per_visit": "1", "status": "stipulated public question"},
    "rows": rows, "basis": "fixed probabilities, serial restart, all step work included in one minute",
    "limits": "1-8 transient states; expectation is not a deadline percentile; additional verification unpriced",
    "reconsider": "changed rates, verification cost, state count or deadline requirement",
    "current_review": "https://github.com/hynk-studio/augnes/issues/1447"}
pathlib.Path('../answer.json').write_text(json.dumps(output, indent=2)+'\\n')
print(json.dumps(output))
`], delivered);
  const answer = JSON.parse(writer.stdout);
  assert.equal(answer.rows[1].expected_minutes, "4950/2401");
  const invalid = await python(["workflow_cost.py", "--direct-success", "2"], delivered, 2);
  assert.equal(invalid.stdout, ""); assert.match(invalid.stderr, /error:/u);
  await python(["-c", `
from workflow_cost import expected_work, NonCompletingWorkflow
try: expected_work([[0]*9 for _ in range(9)], [1]*9)
except ValueError: pass
else: raise AssertionError('state bound must refuse')
try: expected_work([[1]], [0])
except NonCompletingWorkflow: pass
else: raise AssertionError('closed zero-cost loop must refuse')
`], delivered);

  // Fresh artifact consumer has only the ordinary first output. Its useful
  // decision is a deadline promise, outside the calculator's result domain.
  const later = path.join(resources.root, "later"); mkdirSync(later);
  cpSync(path.join(consumer, "answer.json"), path.join(later, "answer.json"));
  const laterResult = await python(["-c", `
import itertools, json, pathlib
from fractions import Fraction as F
inherited = json.loads(pathlib.Path('answer.json').read_text())
p = F(inherited['inputs']['success'])
# Independent finite enumeration for this small deadline question.
probability = F(0)
for history in itertools.product((0, 1), repeat=10):
    if '1'*9 in ''.join(map(str, history)):
        successes = sum(history)
        probability += p**successes * (1-p)**(10-successes)
assert probability == p**9*(2-p)
assert probability < F(95, 100)
print(json.dumps({"inherited_content_id": inherited['content_id'], "inherited_result": inherited['rows'],
    "calculator": "NOT_USED", "decision": "decline_95_percent_promise",
    "probability_within_ten_minutes": str(probability), "basis": inherited['basis'],
    "reason": "deadline probability and nine states exceed the inherited calculation scope",
    "network_recheck": "not_needed_for_fixed_question; current corrections not observed"}))
`], later);
  assert.equal(JSON.parse(laterResult.stdout).inherited_content_id, integrity.content_id);
  assert.deepEqual(network.attempts, []);
  summary = { workflow_cost_plugin: "pass", copied_files: PLUGIN_FILES.length, reproducible: true,
    integrity, refused, actual_calculation: answer.rows, later_consumer: JSON.parse(laterResult.stdout),
    fallback_imports: 0, external_network_attempts: 0, model_use: "NOT_RUN_by_this_deterministic_test" };
} finally {
  for (const record of [...processes]) await terminateOwnedProcessTree(record);
  network.restore();
  assert.equal(processes.size, 0);
  assert.ok(cleanupCanonicalTestResources([resources]).every(result => result.completed));
  assert.equal(existsSync(resources.root), false);
}
console.log(JSON.stringify({ ...summary, cleanup: { completed: true, remaining_owned_processes: 0 } }));
