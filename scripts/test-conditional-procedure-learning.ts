import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { LIMITS, ORDER, TurnBudget, assertMemory, memoryVersion, memoryFor, reviseMemory, parseChoice, RECIPES, sha } from "./conditional-procedure-learning/method";
import { CASES, REVIEW } from "./conditional-procedure-learning/cases";
import { executeProbe } from "./conditional-procedure-learning/probe";
import { runProbe, runJobs, runCli } from "./conditional-procedure-learning/commission";
import { nativeTurn } from "./conditional-procedure-learning/native-turn";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources, buildCanonicalChildEnvironment } from "./canonical-test-environment.mjs";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { buildSelectedWorkSourceEntry, normalizeSelectedWorkSources, selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";
import { NATIVE_HOST_RESULT_VERSION_V01 } from "@/types/vnext/native-host-adapter";

const readJSON = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const cleanup = (resource: ReturnType<typeof createCanonicalTestResourceRoot>) => {
  if (existsSync(resource.root)) assert(cleanupCanonicalTestResources([resource]).every((x: { completed: boolean }) => x.completed));
};

async function testEarlySetupFailures() {
  const evidence = createCanonicalTestResourceRoot("ag-c03-");
  try {
    for (const failure of ["archive-read", "archive-integrity", "probe-read", "probe-integrity", "snapshot-directory"]) {
      const directory = path.join(evidence.root, failure); mkdirSync(directory); mkdirSync(path.join(directory, "authored"));
      const archive = "Synthetic archive; this fixture must fail before extraction.";
      const probe = "throw new Error('probe_must_not_start');";
      if (failure !== "archive-read") writeFileSync(path.join(directory, "source.tar"), archive);
      if (failure !== "probe-read") writeFileSync(path.join(directory, "authored/probe.ts"), probe);
      writeFileSync(path.join(directory, "frozen.json"), JSON.stringify({
        archives: { [CASES.T1.ref]: { name: "source.tar", sha256: sha(failure === "archive-integrity" ? "wrong" : archive) } },
        authored: { "probe.ts": sha(failure === "probe-integrity" ? "wrong" : probe) },
      }));
      let resource: ReturnType<typeof createCanonicalTestResourceRoot> | undefined;
      let allocations = 0;
      try {
        await assert.rejects(runProbe(directory, "T1", "validation-count", prefix => {
          allocations++;
          assert.equal(failure, "snapshot-directory", "invalid inputs must fail before allocating or starting a probe");
          resource = createCanonicalTestResourceRoot(prefix); mkdirSync(path.join(resource.root, "source"));
          return resource;
        }), { code: failure.endsWith("read") ? "ENOENT" : failure.endsWith("integrity") ? "ERR_ASSERTION" : "EEXIST" });
        assert.equal(allocations, failure === "snapshot-directory" ? 1 : 0);
        if (resource) assert.equal(existsSync(resource.root), false, "snapshot setup failure must release its exact owner");
      } finally { if (resource) cleanup(resource); }
    }
    for (const failure of ["resource-create", "input-directory", "database-open", "after-database"]) {
      const directory = path.join(evidence.root, failure); mkdirSync(directory);
      let resource: ReturnType<typeof createCanonicalTestResourceRoot> | undefined;
      let database: Database.Database | undefined;
      let starts = 0, databaseOpens = 0;
      const events: string[] = [];
      try {
        await assert.rejects(nativeTurn({ directory,
          files: { [failure === "after-database" ? "../refused.md" : "TASK.md"]: "Synthetic early failure; no host is authorized." },
          beforeStart() { starts++; throw new Error("host_must_not_start"); }, onEvent: kind => events.push(kind),
        }, {
          createResource(prefix) {
            if (failure === "resource-create") throw new Error("synthetic_resource_creation_failure");
            resource = createCanonicalTestResourceRoot(prefix);
            if (failure === "input-directory") writeFileSync(path.join(resource.root, "input"), "blocked");
            if (failure === "database-open") mkdirSync(path.join(resource.root, "study.db"));
            return resource;
          },
          openDatabase(file) { databaseOpens++; database = new Database(file); return database; },
        }), error => failure === "resource-create" ? (error as Error).message === "synthetic_resource_creation_failure"
          : (error as { code: string }).code === ({ "input-directory": "EEXIST", "database-open": "SQLITE_CANTOPEN", "after-database": "ERR_ASSERTION" }[failure]));
        assert.equal(starts, 0); assert.deepEqual(events, []);
        assert.equal(databaseOpens, ["database-open", "after-database"].includes(failure) ? 1 : 0);
        if (database) assert.equal(database.open, false, "acquired database handle must close");
        if (resource) assert.equal(existsSync(resource.root), false, "partial initialization must remove only its owned root");
        const audit = readJSON(path.join(directory, "lifecycle.json"));
        assert.equal(audit.study_initiated, false); assert.equal(audit.adapter_invoked, undefined);
        assert.deepEqual(audit.observations, []);
        assert.deepEqual(audit.cleanup, failure === "resource-create" ? [] : [{ completed: true, failure_count: 0 }]);
      } finally { if (database?.open) database.close(); if (resource) cleanup(resource); }
    }
  } finally { cleanup(evidence); }
}

// Synthetic software fixtures only. Neither branch calls nativeTurn, freeze,
// runtime selection or a probe; their temporary ledgers are not study evidence.
async function cliFixture(directory: string, fatal: boolean) {
  const at = "2026-01-01T00:00:00.000Z", seed = "Synthetic dispatcher fixture.";
  const frozen = { frozen_at: at, frozen_sha256: sha(seed), seed, seed_sha256: sha(seed),
    cases: Object.fromEntries(["T1", "T2", "T3"].map(task => [task, {
      task: "Synthetic control flow only; no behavioral result.", provenance: "zero-model unit fixture",
      source: "Synthetic source", probes: {}, probe_ids: [],
    }])) };
  const dispatches: string[] = [];
  await runCli(["run", directory], target => runJobs(target, frozen, async input => {
    const job = path.basename(input.directory).replace(/-[12]$/, "");
    dispatches.push(job); writeFileSync(path.join(target, "synthetic-dispatches.json"), JSON.stringify(dispatches));
    input.beforeStart();
    if (fatal) throw new Error("synthetic_fatal_execution_failure");
    const summary = ["P1", "P2"].includes(job)
      ? JSON.stringify({ operation: "KEEP", cause: "no_defect", before: "", after: "", reason: "Synthetic unchanged fixture." })
      : job.startsWith("T") && job !== "T1-B"
        ? JSON.stringify({ intended_action: "No probe", assumptions: "Synthetic", memory_use: "None", probe_id: "NONE",
          rationale: "Synthetic control flow", finding_if_no_probe: "No comparative advantage is established." })
        : "Weak compliant text; no superiority is established.";
    return { summary, outcome: "completed", receipt_id: "synthetic-only", public_result: {
      result_version: NATIVE_HOST_RESULT_VERSION_V01, request_id: "synthetic-only", run_id: "synthetic-only", outcome: "completed",
      public_stop_reason: null, started_at: at, finished_at: at, host_refs: [], adapter_version: "synthetic-only",
      capability_version: "synthetic-only", changed_files: [], artifacts: [], observed_actions: [], commands: [], checks: [],
      skipped_checks: [], model_invocation_receipt_refs: [], summary, uncertainty: [], gaps: [], proposed_next_steps: [],
      capability_coverage: [], adapter_extension: { extension_version: "synthetic-only", adapter_kind: "synthetic-only", bounded_metadata: {} },
    } };
  }));
}

async function testCliOutcomes() {
  for (const mode of ["fatal", "completed"]) {
    const resource = createCanonicalTestResourceRoot("ag-c03-");
    try {
      const directory = path.join(resource.root, "synthetic-evidence"); mkdirSync(directory);
      const sink = () => new Writable({ write(_chunk, _encoding, callback) { callback(); } });
      const result = await runCanonicalChild({ suite: "conditional-procedure", label: `synthetic-${mode}-cli`,
        command: process.execPath, args: ["--import", "tsx", fileURLToPath(import.meta.url), "--cli-fixture", mode, directory],
        cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
        env: buildCanonicalChildEnvironment({ temporaryRoot: resource.root, resourceRoot: resource.root }),
        timeoutMs: 30_000, heartbeatMs: 10_000, resourceOwner: resource,
        stdout: sink() as typeof process.stdout, stderr: sink() as typeof process.stderr, log: () => {},
      });
      assert.equal(result.exit_code, mode === "fatal" ? 1 : 0);
      assert.equal(result.timed_out, false); assert.equal(result.signal, null);
      assert.equal(result.exit_observed, true); assert.equal(result.streams_closed, true);
      assert.equal(result.cleanup_completed, true); assert.equal(result.remaining_owned_processes, 0);
      const accounting = readJSON(path.join(directory, "final-accounting.json"));
      const ledger = readFileSync(path.join(directory, "initiated.jsonl"), "utf8").trim().split("\n").map(line => JSON.parse(line));
      const dispatches = readJSON(path.join(directory, "synthetic-dispatches.json"));
      assert.equal(accounting.stopped, mode === "fatal");
      assert.deepEqual(accounting.ledger, ledger.map(({ job, turn }) => ({ job, turn })));
      assert.equal(accounting.initiated_study_turns, ledger.length);
      if (mode === "fatal") {
        assert.equal(ledger.length, 1); assert.deepEqual(dispatches, ["B0"]);
        assert.deepEqual(accounting.disposition.B0, { status: "FAILED", code: "synthetic_fatal_execution_failure" });
        assert.deepEqual(readJSON(path.join(directory, "B0-disposition.json")), accounting.disposition.B0);
        for (const job of ORDER.slice(1)) {
          assert.equal(accounting.disposition[job].status, "NOT_RUN");
          assert.equal(existsSync(path.join(directory, `${job}-1`)), false, "no later dispatch or retry");
        }
      } else {
        assert.equal(ledger.length, ORDER.length); assert.deepEqual(dispatches, ORDER);
        assert.equal(accounting.disposition["T1-B"].status, "COMPLETED_NO_VALID_CHOICE");
        assert.equal(accounting.disposition["T3-A"].selected_probe, "NONE");
        assert.equal(accounting.disposition.P1.change, "unchanged"); assert.equal(accounting.disposition.P2.change, "unchanged");
      }
    } finally { cleanup(resource); }
    assert.equal(existsSync(resource.root), false);
  }
}

async function main() {
  await testEarlySetupFailures();
  await testCliOutcomes();
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
    early_setup_failures: 9, fatal_and_nonfatal_cli_outcomes: true,
    real_local_probe_checks: 6, study_model_turns: 0, behavioral_superiority_tested: false }));
}
void (process.argv[2] === "--cli-fixture" ? cliFixture(process.argv[4]!, process.argv[3] === "fatal") : main())
  .catch(error => { console.error(error); process.exitCode = 1; });
