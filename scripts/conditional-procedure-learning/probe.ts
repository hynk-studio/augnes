// Copied by the trusted coordinator into an exact disposable Git snapshot.
// argv selects an authored probe; it is never evaluated as code or a command.
import assert from "node:assert/strict";
import { Session, type Profiler } from "node:inspector";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { evaluateCriterionAssessmentV01, validateCriterionAssessmentAgainstSourcesV01 } from "@/lib/vnext/criterion-assessment";
import { criterionSpecificRelationsAvailableV01 } from "@/lib/vnext/episode-delta-proposal";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import { observeSupervisorProcesses, compareSupervisorObservations, withSupervisorProcessPreservation } from "../supervisor-process-observation.mjs";
import { installZeroNetworkGuard } from "../test-harness-zero-network-guard.mjs";

const digest = (x: unknown) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
function sourceInput() {
  const packet = buildTaskContextPacketV01(structuredClone(genericCliBuilderInputFixture));
  const input = structuredClone(genericCliDirectObservationInputFixture);
  input.workspace_id = packet.workspace_id; input.project_id = packet.project_id;
  assert(typeof packet.work_ref === "object");
  input.work_ref = structuredClone(packet.work_ref);
  input.task_context_packet_ref = { ref_version: "external_ref.v0.1", ref_type: "task_context_packet",
    external_id: packet.packet_id, source_ref: packet.integrity.fingerprint, observed_at: packet.generated_at,
    trust_class: "direct_local_observation", compatibility_namespace: packet.packet_version };
  const receipt = buildRunReceiptV01(input);
  const assessment = evaluateCriterionAssessmentV01({ packet, receipt });
  return { packet, receipt, assessment };
}
function outcome(fn: () => unknown) {
  try { return { status: "returned", output_sha256: digest(fn()) }; }
  catch (error) { return { status: "refused", code: String((error as { code?: string }).code ?? "unclassified_error") }; }
}
function counted(fn: () => void) {
  const session = new Session(); session.connect();
  let coverage: Profiler.TakePreciseCoverageReturnType | undefined;
  try {
    session.post("Profiler.enable", error => assert.ifError(error));
    session.post("Profiler.startPreciseCoverage", { callCount: true, detailed: false }, error => assert.ifError(error));
    fn();
    session.post("Profiler.takePreciseCoverage", (error, value) => { assert.ifError(error); coverage = value; });
  } finally { session.disconnect(); }
  assert(coverage);
  return Object.fromEntries([
    ["validateCriterionAssessmentAgainstSourcesV01", validateCriterionAssessmentAgainstSourcesV01, "criterion-assessment.ts"],
    ["criterionSpecificRelationsAvailableV01", criterionSpecificRelationsAvailableV01, "episode-delta-proposal.ts"],
  ].map(([name, implementation, file]) => {
    const size = Function.prototype.toString.call(implementation).length;
    const matches = coverage!.result.filter(x => x.url.endsWith(`/lib/vnext/${file}`)).flatMap(x => x.functions)
      .filter(x => x.functionName === name && x.ranges[0]!.endOffset - x.ranges[0]!.startOffset === size);
    assert.equal(matches.length, 1, "count the real implementation, excluding export getters");
    return [name, matches[0]!.ranges[0]!.count];
  }));
}
function retainedWrapper(onOwnerCall: () => void = () => {}) {
  let key: string | undefined;
  let value: ReturnType<typeof materializeRunAssessmentProposalV01> | undefined;
  return (input: ReturnType<typeof sourceInput>) => {
    const next = input.packet.packet_id + ":" + input.receipt.receipt_id;
    if (next !== key) { onOwnerCall(); value = materializeRunAssessmentProposalV01(input); key = next; }
    return value!;
  };
}

// Controlled command results come from actual child exits/stdout. They do not
// replay a historical ps outcome or observe/kill any ambient supervisor.
const COMMAND_CASES = {
  one: 'process.stdout.write("41001 /synthetic/supervisor.mjs\\n")',
  empty: 'process.stdout.write("")',
  nonzero: 'process.exitCode = 7',
} as const;
function commandObservation(kind: keyof typeof COMMAND_CASES) {
  return observeSupervisorProcesses({ supervisorScript: "/synthetic/supervisor.mjs", platform: "darwin", ownPid: 99999,
    runCommand: (() => spawnSync(process.execPath, ["-e", COMMAND_CASES[kind]], {
      encoding: "utf8", timeout: 2000, maxBuffer: 1024,
      env: { PATH: "/usr/bin:/bin", NODE_ENV: "test" },
    })) as unknown as typeof spawnSync });
}

export async function executeProbe(task: string, probe: string) {
  const guard = installZeroNetworkGuard();
  try {
    if (task === "T1" && ["validation-count", "repeat-parity"].includes(probe)) {
      const input = sourceInput(), before = digest(input), first = materializeRunAssessmentProposalV01(input);
      const results: unknown[] = [];
      const counts = probe === "validation-count" ? counted(() => {
        for (let i = 0; i < 10; i++) results.push(materializeRunAssessmentProposalV01(input));
      }) : null;
      if (!counts) for (let i = 0; i < 3; i++) results.push(materializeRunAssessmentProposalV01(structuredClone(input)));
      const changed = structuredClone(input); changed.receipt.result_summary.summary += " Changed after sealing.";
      const invalid = outcome(() => materializeRunAssessmentProposalV01(changed));
      const returned = materializeRunAssessmentProposalV01(input);
      returned.proposal.source_assessment!.assessment.criteria[0]!.uncertainty.push("caller-local mutation");
      return { task, probe, calls: results.length, counts, complete_outputs_equal: results.every(x => digest(x) === digest(first)),
        input_unchanged: digest(input) === before, caller_mutation_isolated: digest(materializeRunAssessmentProposalV01(input)) === digest(first), invalid_receipt: invalid };
    }
    if (task === "T2" && ["steady-reuse", "changed-input", "caller-mutation"].includes(probe)) {
      let wrapperCalls = 0;
      const input = sourceInput(), retained = retainedWrapper(() => { wrapperCalls++; }), first = retained(input);
      if (probe === "steady-reuse") {
        const primingCalls = wrapperCalls;
        const results: unknown[] = [], direct: unknown[] = [];
        for (let i = 0; i < 10; i++) { results.push(retained(input)); direct.push(materializeRunAssessmentProposalV01(input)); }
        return { task, probe, calls: 10, priming_owner_calls: primingCalls,
          wrapper_later_owner_calls: wrapperCalls - primingCalls, direct_owner_calls: direct.length,
          same_input_outputs_equal: [...results, ...direct].every(x => digest(x) === digest(first)), changed_input_exercised: false };
      }
      if (probe === "changed-input") {
        const changed = structuredClone(input); changed.receipt.result_summary.summary += " Changed after sealing.";
        return { task, probe, same_packet_id: changed.packet.packet_id === input.packet.packet_id,
          same_receipt_id: changed.receipt.receipt_id === input.receipt.receipt_id,
          complete_input_changed: digest(changed) !== digest(input), wrapper: outcome(() => retained(changed)),
          owner: outcome(() => materializeRunAssessmentProposalV01(changed)), prior_output_sha256: digest(first) };
      }
      const original = digest(first);
      first.proposal.source_assessment!.assessment.criteria[0]!.uncertainty.push("caller-local mutation");
      return { task, probe, wrapper_later_matches_original: digest(retained(input)) === original,
        owner_later_matches_original: digest(materializeRunAssessmentProposalV01(input)) === original };
    }
    if (task === "T3" && probe === "observation-contract") {
      const before = commandObservation("one"), empty = commandObservation("empty"), failed = commandObservation("nonzero");
      return { task, probe, before, empty, failed,
        comparison_empty: compareSupervisorObservations(before, empty),
        comparison_failed: compareSupervisorObservations(before, failed),
        lossy_display_empty: empty.pids?.length ?? 0, lossy_display_failed: failed.pids?.length ?? 0 };
    }
    if (task === "T3" && probe === "cleanup-path") {
      let work = 0, cleanup = 0, commands = 0;
      try {
        await withSupervisorProcessPreservation({ observationOptions: {
          supervisorScript: "/synthetic/supervisor.mjs", platform: "darwin", ownPid: 99999,
          runCommand: () => spawnSync(process.execPath, ["-e", COMMAND_CASES[commands++ === 0 ? "one" : "nonzero"]],
            { encoding: "utf8", timeout: 2000, maxBuffer: 1024, env: { PATH: "/usr/bin:/bin", NODE_ENV: "test" } }),
        }, run: async () => { work++; }, cleanup: async () => { cleanup++; } });
        return { task, probe, work, cleanup, commands, status: "returned" };
      } catch (error) { return { task, probe, work, cleanup, commands, status: "refused", code: (error as { code?: string }).code }; }
    }
    throw new Error("probe_not_allowlisted");
  } finally { guard.restore(); }
}

if (process.argv[1]?.endsWith("p46-probe.ts")) {
  executeProbe(process.argv[2]!, process.argv[3]!).then(value => console.log(JSON.stringify(value)))
    .catch(() => { console.log(JSON.stringify({ status: "probe_failed" })); process.exitCode = 1; });
}
