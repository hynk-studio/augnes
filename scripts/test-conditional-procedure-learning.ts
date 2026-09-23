import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { LIMITS, ORDER, TurnBudget, assertMemory, memoryVersion, memoryFor, reviseMemory, parseChoice, RECIPES } from "./conditional-procedure-learning/method";
import { CASES, REVIEW } from "./conditional-procedure-learning/cases";
import { executeProbe } from "./conditional-procedure-learning/probe";
import { runProbe } from "./conditional-procedure-learning/commission";
import { nativeTurn } from "./conditional-procedure-learning/native-turn";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { buildSelectedWorkSourceEntry, normalizeSelectedWorkSources, selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";

async function main() {
  const p0 = memoryVersion("P0", "When inputs are stable, inspect duplicate validation. Preserve refusal.", null, ["seed"]);
  const keep = JSON.stringify({ operation: "KEEP", cause: "no_defect", before: "", after: "", reason: "The actual check found no contradictory result." });
  const p1 = reviseMemory(p0, "P1", keep, ["T1-A"]);
  assert.equal(p1.text, p0.text); assert.equal(p1.parent, p0.sha256); assert.equal(p1.sha256, p0.sha256);
  const replace = { operation: "REPLACE", cause: "changed_conditions", before: "inputs are stable", after: "complete inputs are immutable within one call", reason: "A later call supplied changed material." };
  const p2 = reviseMemory(p1, "P2", JSON.stringify(replace), ["T2-A"]);
  assert.equal(p2.text, "When complete inputs are immutable within one call, inspect duplicate validation. Preserve refusal.");
  assert.equal(p0.text, p1.text); assert.notEqual(p2.sha256, p1.sha256);
  const literal = reviseMemory(p0, "literal", JSON.stringify({ ...replace,
    before: "inputs are stable", after: "$& is a literal example" }), []);
  assert.equal(literal.text, "When $& is a literal example, inspect duplicate validation. Preserve refusal.");
  assert.throws(() => reviseMemory(p1, "P2", JSON.stringify({ ...replace, before: "absent" }), []));
  assert.throws(() => reviseMemory(memoryVersion("x", "word word", null, []), "P2", JSON.stringify({ ...replace, before: "word" }), []));
  assert.throws(() => reviseMemory(p1, "P2", JSON.stringify({ ...replace, after: "x".repeat(901) }), []));
  assert.throws(() => reviseMemory(p1, "P2", JSON.stringify({ ...replace, cause: "proven_superior" }), []));
  assert.throws(() => assertMemory("a".repeat(LIMITS.memoryCharacters + 1)));
  assert.throws(() => assertMemory(" silent trim "));
  const unicode = "🧭".repeat(1800); assertMemory(unicode);
  const scope = { workspace_id: "study-workspace", project_id: "study-project" };
  const entry = buildSelectedWorkSourceEntry(scope, { source: `candidate-method:${p2.sha256}`, text: p2.text,
    label: "New candidate", provenance: "derived_interpretation", observed_at: null });
  assert.equal(selectedWorkSourceInput(normalizeSelectedWorkSources(scope, [entry])[0]!).text, p2.text);
  assert.throws(() => normalizeSelectedWorkSources(scope, [{ ...entry, bounded_summary: p0.text }]));
  const budget = new TurnBudget();
  for (const job of ORDER) { budget.claim(job, 1); if (job.startsWith("T")) budget.claim(job, 2); }
  assert.equal(budget.initiated.length, 24);
  assert.throws(() => budget.claim("T3-A", 3)); assert.throws(() => budget.claim("P0", 1));
  assert.throws(() => new TurnBudget().claim("T1-A", 2));
  for (const task of ["T1", "T2", "T3"] as const) assert.equal(memoryFor(`${task}-F`), "P0");
  assert.equal(memoryFor("T1-A"), memoryFor("T1-F")); assert.equal(memoryFor("T3-A"), "P2");
  assert.equal(memoryFor("B2"), "B1");
  const choice = { intended_action: "Inspect", assumptions: "Unknown", memory_use: "None", probe_id: "$(touch forbidden)", rationale: "Synthetic refusal test", finding_if_no_probe: "" };
  assert.equal(parseChoice(JSON.stringify(choice), ["validation-count"]).supported, false);
  assert.deepEqual(await runProbe("/not-read-for-unsupported-request", "T1", choice.probe_id), { status: "refused", code: "probe_not_allowlisted", executed: false });
  assert.throws(() => parseChoice(JSON.stringify({ ...choice, shell: "arbitrary" }), []));
  assert.equal(new Set(Object.values(CASES).map(x => x.task)).size, 3);
  assert(!Object.values(RECIPES).some(x => x.includes(REVIEW.T1)));
  const prestartEvidence = createCanonicalTestResourceRoot("ag-c03-");
  try {
    await assert.rejects(nativeTurn({ directory: prestartEvidence.root,
      files: { "TASK.md": "Synthetic preparation refusal; no host invocation is authorized." },
      beforeStart() { throw new Error("synthetic_before_start_refusal"); },
    }), { message: "synthetic_before_start_refusal" });
    const audit = JSON.parse(readFileSync(path.join(prestartEvidence.root, "lifecycle.json"), "utf8"));
    assert.equal(audit.study_initiated, false); assert.equal(audit.adapter_invoked, undefined);
    assert.deepEqual(audit.observations, []);
    assert.deepEqual(audit.cleanup, [{ completed: true, failure_count: 0 }]);
  } finally {
    assert(cleanupCanonicalTestResources([prestartEvidence]).every((x: { completed: boolean }) => x.completed));
  }
  const t1 = await executeProbe("T1", "validation-count");
  assert.equal(t1?.counts?.validateCriterionAssessmentAgainstSourcesV01, 30, "current owner, not historical study result");
  assert.equal(t1?.complete_outputs_equal, true); assert.equal(t1?.input_unchanged, true);
  const changed = await executeProbe("T2", "changed-input");
  assert.equal(changed?.wrapper?.status, "returned"); assert.equal(changed?.owner?.status, "refused");
  const steady = await executeProbe("T2", "steady-reuse");
  assert.equal(steady?.wrapper_later_owner_calls, 0); assert.equal(steady?.direct_owner_calls, 10);
  assert.equal(steady?.same_input_outputs_equal, true);
  const mutation = await executeProbe("T2", "caller-mutation");
  assert.equal(mutation?.wrapper_later_matches_original, false); assert.equal(mutation?.owner_later_matches_original, true);
  const observation = await executeProbe("T3", "observation-contract");
  assert.equal(observation?.comparison_empty?.status, "changed"); assert.equal(observation?.comparison_failed?.status, "observation_failed");
  const cleanup = await executeProbe("T3", "cleanup-path");
  assert.equal(cleanup?.cleanup, 1); assert.equal(cleanup?.code, "ambient_supervisor_observation_failed");
  console.log(JSON.stringify({ status: "passed", method_construction_lineage_limits_delivery_refusal_cleanup: true,
    real_local_probe_checks: 6, study_model_turns: 0, behavioral_superiority_tested: false }));
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
