import assert from "node:assert/strict";
import { readFileSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { calculateWorkflowCost, normalizeWorkflowCostInputs, parseWorkflowCostJson, verifyWorkflowCostReport } from "../lib/vnext/workflow-cost-verifier";
import { WORKFLOW_COST_VERIFIER_SOURCE } from "../lib/vnext/workflow-cost-verifier-identity";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

async function main() {
  const repo = process.cwd();
  assert.equal(WORKFLOW_COST_VERIFIER_SOURCE, `sha256:${createHash("sha256").update(readFileSync(path.join(repo, "lib/vnext/workflow-cost-verifier.ts"))).digest("hex")}`);
  const base = { attempt: "10", verification: "2", repair: "4", direct_success: "2/5", inspection: "1", inspected_success: "4/5" };
  const report = { inputs: base, evidence: "constructed development calculation; probabilities and costs are stipulated",
    workflows: { direct: { status: "finite", expected_work: "36" }, inspected: { status: "finite", expected_work: "69/4" } },
    inspection_minus_direct: "-75/4", comparison: "inspection_reduces_work" };
  let cases = 0;
  const verify = (r: unknown, expected: boolean) => { assert.equal(verifyWorkflowCostReport(base, JSON.stringify(r)).consistent, expected); cases++; };
  verify(report, true);
  verify({ ...report, inputs: { ...base, inspection: "20" } }, false);
  verify({ ...report, inspection_minus_direct: "0" }, false);
  verify({ ...report, comparison: "equal_work" }, false);
  verify({ ...report, success: true }, false);
  verify({ ...report, checks: [] }, false);
  verify({ ...report, evidence: "empirically proven benefit" }, false);
  verify({ ...report, workflows: { ...report.workflows, direct: { status: "finite", expected_work: "0" } } }, false);
  for (const key of Object.keys(report)) { const r = { ...report } as Record<string, unknown>; delete r[key]; verify(r, false); }
  for (const key of ["status", "expected_work"]) { const r = structuredClone(report); delete (r.workflows.direct as Record<string, unknown>)[key]; verify(r, false); }
  for (const invalid of ['{"a":"1","a":"2"}', '{"a":"1","\\u0061":"2"}', '{"a":1}', '{"a":true}', '{"a":[]}', '{"a":{"b":{"c":{"d":{"e":null}}}}}', '{"a":null} trailing']) {
    assert.throws(() => parseWorkflowCostJson(invalid)); cases++;
  }
  for (const value of ["1/0", "2.5", "1e2", "-1", "1".repeat(21), "18446744073709551616"]) {
    assert.throws(() => normalizeWorkflowCostInputs({ ...base, attempt: value })); cases++;
  }
  assert.throws(() => normalizeWorkflowCostInputs({ ...base, direct_success: "3/2" })); cases++;
  const tie = calculateWorkflowCost({ ...base, inspection: "0", inspected_success: "2/5" });
  assert.equal(tie.comparison, "equal_work"); assert.equal(tie.inspection_minus_direct, "0"); cases++;
  const exact = calculateWorkflowCost({ attempt: "1/3", verification: "1/7", repair: "2/9", direct_success: "2/3", inspection: "1/5", inspected_success: "2/3" });
  assert.equal(exact.direct.expected_work, "52/63"); assert.equal(exact.inspection_minus_direct, "3/10"); cases++;
  for (const zeros of [false, true]) {
    const inputs = zeros ? { attempt: "0", verification: "0", repair: "0", direct_success: "0", inspection: "0", inspected_success: "0" } : { ...base, direct_success: "0" };
    const v = calculateWorkflowCost(inputs); assert.equal(v.direct.status, "non_completing"); assert.equal(v.direct.expected_work, null); assert.equal(v.comparison, "not_comparable");
    const r = { ...report, inputs, workflows: { direct: v.direct, inspected: v.inspected }, inspection_minus_direct: v.inspection_minus_direct, comparison: v.comparison };
    assert.equal(verifyWorkflowCostReport(inputs, JSON.stringify(r)).consistent, true); cases++;
    r.workflows.direct = { status: "finite", expected_work: "0" }; assert.equal(verifyWorkflowCostReport(inputs, JSON.stringify(r)).consistent, false); cases++;
  }
  const owner = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
  const root = owner.root;
  const owners = [owner];
  const evidenceRoots = [{ root, name: "continuation" }];
  const children: unknown[] = [];
  let completed = false;
  let consumersSettled = true;
  beginCanonicalTestResourceUse(owner);
  try {
    for (const dir of ["home", "bin"]) mkdirSync(path.join(root, dir));
    // Compile trusted application code before entering the isolated observation
    // process; the product verifier never starts a compiler or installs packages.
    for (const [source, target] of [["workflow-cost-verification-fixture.ts", "producer.cjs"], ["workflow-cost-successor-consumer.ts", "consumer.cjs"]]) {
      await build({ entryPoints: [path.join(repo, "scripts", source!)], outfile: path.join(root, target!), bundle: true, platform: "node", format: "cjs", packages: "external",
        plugins: [{ name: "preserve-source-locations", setup(b) { b.onLoad({ filter: /\.(?:mjs|ts)$/ }, async args => ({
          contents: readFileSync(args.path, "utf8").replaceAll("import.meta.url", JSON.stringify(pathToFileURL(args.path).href)), loader: args.path.endsWith(".ts") ? "ts" : "js" })); } }] });
    }
    const environment = (temporaryRoot: string) => ({ ...buildCanonicalChildEnvironment({ temporaryRoot }), PATH: path.join(temporaryRoot, "bin"), NODE_PATH: path.join(repo, "node_modules"),
      AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: "workspace:11111111-1111-4111-8111-111111111111",
      AUGNES_VNEXT_OPERATOR_PROJECT_ID: "project:22222222-2222-4222-8222-222222222222", AUGNES_VNEXT_OPERATOR_ID: "operator:workflow-cost" });
    const env = environment(root);
    const child = async (label: string, args: string[], childEnv = env, interrupt = false) => {
      consumersSettled = false;
      const abort = new AbortController(); let marker = false, output = "";
      const result = await runCanonicalChild({ suite: "workflow-cost", label, command: process.execPath, args, cwd: repo, env: childEnv,
        timeoutMs: 30_000, resourceOwner: undefined,
        // The JavaScript owner's optional signal defaults to undefined.
        signal: abort.signal as never,
        stdout: { write(chunk: string | Buffer) { process.stdout.write(chunk); output += String(chunk);
          if (interrupt && output.includes(`interrupt_boundary:${label}`)) { marker = true; abort.abort(); } return true; } } as typeof process.stdout });
      consumersSettled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
      children.push(result);
      if (interrupt) { assert(marker); assert.equal(result.cancelled, true); assert.equal(consumersSettled, true); }
      else assert.equal(canonicalChildAcceptanceFailure(result, { suite: "workflow-cost", timeoutMs: 30_000, requireNaturalExit: true }), null);
    };
    const producer = async (mode: string) => child(mode, [path.join(root, "producer.cjs"), mode]);
    const consume = async (name: string) => child(name, [path.join(root, "consumer.cjs"), path.join(root, "session.cookie"), path.join(root, `${name}.md`)]);
    const artifact = (name: string) => JSON.parse(readFileSync(path.join(root, `${name}.md`), "utf8").split("```json\n")[1]!.split("\n```")[0]!);
    await producer("seed"); await consume("rejected-claim"); assert.equal(artifact("rejected-claim").decision, "defer_unverified_or_changed_basis");
    await producer("replay");
    await producer("correct-report"); await consume("corrected-report"); assert.equal(artifact("corrected-report").decision, "optional_inspection");
    await producer("correct-input"); await consume("corrected-input"); const corrected = artifact("corrected-input"); assert.equal(corrected.decision, "direct");
    assert.equal(corrected.recomputed.inspected.expected_work, "41");
    assert(corrected.history.some((r: { failed_checks: string[] }) => r.failed_checks.includes("workflow_cost_difference")));
    assert(corrected.selected_notes.some((n: { source: string }) => n.source === "synthetic-applicability"));
    await producer("unrelated"); await consume("unrelated-change"); const unrelated = artifact("unrelated-change");
    assert.equal(unrelated.decision, corrected.decision); assert.equal(unrelated.latest_receipt_fingerprint, corrected.latest_receipt_fingerprint);
    assert.deepEqual(unrelated.selected_notes.find((n: { source: string }) => n.source === "independent-checklist"), corrected.selected_notes.find((n: { source: string }) => n.source === "independent-checklist"));
    await producer("refusals");
    for (const mode of ["interrupt-execution", "interrupt-storage", "interrupt-delivery", "cancel-execution", "timeout-execution", "revoke-execution", "missing-check"]) {
      const scenario = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
      owners.push(scenario); beginCanonicalTestResourceUse(scenario); evidenceRoots.push({ root: scenario.root, name: mode });
      for (const dir of ["home", "bin"]) mkdirSync(path.join(scenario.root, dir));
      const childEnv = environment(scenario.root);
      await child(`prepare-${mode}`, [path.join(root, "producer.cjs"), "prepare"], childEnv);
      await child(mode, [path.join(root, "producer.cjs"), mode], childEnv, mode.startsWith("interrupt"));
      if (mode.startsWith("interrupt")) await child(`recover-${mode}`, [path.join(root, "producer.cjs"), mode === "interrupt-delivery" ? "recover-delivery" : "recover"], childEnv);
      if (mode === "missing-check") {
        await child("missing-check-consumer", [path.join(root, "consumer.cjs"), path.join(scenario.root, "session.cookie"), path.join(scenario.root, "rejected-claim.md")], childEnv);
        assert(readFileSync(path.join(scenario.root, "rejected-claim.md"), "utf8").includes('"decision": "defer_unverified_or_changed_basis"'));
      }
    }
    completed = true;
    console.log(JSON.stringify({ status: "passed", pure_cases: cases, fresh_processes: children.length, real_successor_artifacts: 4, model_use: "NOT_RUN", comparative_usefulness: "NOT_RUN" }));
  } finally {
    const evidenceIndex = process.argv.indexOf("--evidence-dir");
    if (evidenceIndex >= 0) {
      const destination = path.resolve(process.argv[evidenceIndex + 1]!);
      assert(destination.startsWith(path.join(repo, ".augnes-local-verification") + path.sep));
      mkdirSync(destination, { recursive: true });
      // Explicit allowlist: no cookie, DB, raw config, bundle or production material.
      for (const source of evidenceRoots) {
        const target = path.join(destination, source.name); mkdirSync(target, { recursive: true });
        for (const name of readdirSync(source.root).filter(n => /^(?:result-|readback-|selection-|isolation-|refusals|recovery|verify-request|rejected-claim|corrected-report|corrected-input|unrelated-change).*\.(?:json|md)$/u.test(n))) copyFileSync(path.join(source.root, name), path.join(target, name));
      }
      writeFileSync(path.join(destination, "children.json"), JSON.stringify({ completed, cases, children }, null, 2));
    }
    if (consumersSettled) for (const resource of owners) settleCanonicalTestResourceUse(resource, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources(owners); console.log(JSON.stringify({ cleanup })); assert(cleanup.every((c: { completed: boolean }) => c.completed));
  }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
