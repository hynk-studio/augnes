import assert from "node:assert/strict";
import { mkdirSync, readFileSync, statSync, truncateSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import Database from "better-sqlite3";
import { createPiRpcLifecycleAdapterV01 } from "../lib/vnext/native-host/pi-rpc-lifecycle-adapter";
import { runPiRpcQueueLifecycleV01 } from "../lib/vnext/native-host/pi-rpc-lifecycle";
import { LiveNativeHostRunServiceV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import type { VNextLocalOperatorPilotConfigV01, VNextLocalOperatorSessionCredentialV01 } from "../lib/vnext/runtime/local-operator-session";
import { readProjectRunResultDetailV01, readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import type { NativeHostAdapterV01, NativeHostResultV01 } from "../types/vnext/native-host-adapter";

function assertGone(pid: number) {
  assert.throws(() => process.kill(pid, 0), (error: NodeJS.ErrnoException) => error.code === "ESRCH");
}

export async function assertPiRpcScriptedTransportV01(root: string) {
  if (process.platform !== "linux" && process.platform !== "darwin") return;
  const source = readFileSync(path.join(__dirname, "fixtures/pi-rpc-lifecycle.cjs"), "utf8");
  for (const scenario of ["cancel", "handled", "wrong-id", "wrong-queue", "lost-reply", "unexpected-run", "stalled-stop"]) {
    const directory = path.join(root, scenario);
    mkdirSync(directory);
    const executable = path.join(directory, "scripted-worker");
    writeFileSync(executable, "#!" + process.execPath + "\n" + source, { mode: 0o700 });
    writeFileSync(path.join(directory, "scenario"), scenario);
    const stop = new AbortController();
    const run = runPiRpcQueueLifecycleV01({ executable, directory, stopSettleMs: scenario === "stalled-stop" ? 600 : 3_000,
      signal: AbortSignal.any([stop.signal, AbortSignal.timeout(5_000)]),
      onQueued: async () => { if (scenario === "cancel" || scenario === "stalled-stop") stop.abort(); } });
    if (scenario === "cancel") {
      assert.equal((await run).queued, true);
      assert.deepEqual(readFileSync(path.join(directory, "commands"), "utf8").trim().split("\n"),
        ["get_state", "follow_up", "get_state", "clear_queue", "abort", "get_state"]);
      assertGone(Number(readFileSync(path.join(directory, "descendant"), "utf8")));
    } else if (scenario === "stalled-stop") {
      await assert.rejects(run);
      assert.equal(readFileSync(path.join(directory, "commands"), "utf8").trim().split("\n").at(-1), "clear_queue");
    } else {
      await assert.rejects(run, /pi_rpc_(response_(invalid|missing)|queue_(recovery_failed|not_confirmed))/);
    }
    const leader = Number(readFileSync(path.join(directory, "leader"), "utf8"));
    assertGone(leader);
    assertGone(-leader);
  }
}

export async function assertPiRpcLifecycleV01(input: {
  root: string;
  config: VNextLocalOperatorPilotConfigV01;
  credential: VNextLocalOperatorSessionCredentialV01;
  readCredential: (cookie: string) => VNextLocalOperatorSessionCredentialV01;
  pinnedExecutable?: string;
  scenario: "unpinned" | "probe" | "cancel";
}) {
  const { root, config, credential, readCredential, pinnedExecutable, scenario } = input;
  const cancelAtQueue = scenario === "cancel";
  const executable = scenario === "unpinned" ? path.join(root, "wrong-release") : pinnedExecutable!;
  if (scenario === "unpinned") {
    writeFileSync(executable, "untrusted executable", { mode: 0o700 });
    // With a release prepared, reject the wrong bytes even at the exact pinned length.
    if (pinnedExecutable) truncateSync(executable, statSync(pinnedExecutable).size);
  }
  const now = () => "2026-08-01T00:00:05.000Z";
  const candidate = createPiRpcLifecycleAdapterV01({ executable, now });
  let queued = false;
  let cancelSent = false;
  let workerResult: Promise<NativeHostResultV01> | undefined;
  const gate = Promise.withResolvers<void>();
  // Only hold the existing lifecycle notification. The real binary, RPC
  // transport, service cancellation, settlement and receipt writer stay in use.
  const adapter: NativeHostAdapterV01 = !cancelAtQueue ? candidate : {
    ...candidate, invoke(request, control) {
      const sink = control.lifecycle_sink!;
      const invocation = candidate.invoke(request, { ...control, lifecycle_sink: {
        request_approval: value => sink.request_approval(value),
        async report_event(event) {
          await sink.report_event(event);
          if (event.bounded_metadata.lifecycle_marker_queued) {
            queued = true;
            await gate.promise;
          }
        },
      } });
      workerResult = invocation.result;
      return invocation;
    },
  };
  const service = new LiveNativeHostRunServiceV01({ adapter_factory: () => adapter, now,
    timeout_ms: 15_000, stop_settle_timeout_ms: 3_000 });
  try {
    const start = await service.start({ config, mode: "interactive", operator_mutation: { credential, clock: { now } } });
    let projection = start.projection;
    const deadline = performance.now() + 18_000;
    while (!projection.receipt) {
      assert(!projection.reconciliation_required && performance.now() < deadline, "Pi invocation must settle with a receipt");
      if (queued && !cancelSent) {
        const active = service.read(config);
        await service.cancel({ config, run_ref: active.run_ref!, control_revision: active.control_revision,
          credential: readCredential(start.session_admission!.cookie_value), clock: { now } });
        cancelSent = true;
        gate.resolve();
      }
      await delay(15);
      projection = service.read(config);
    }
    const fresh = new Database(config.database_path, { readonly: true });
    try {
      const selection = { ...config, receipt_id: projection.receipt.receipt_ref };
      const { receipt } = readProjectRunResultSourceBindingV01(fresh, selection);
      const detail = readProjectRunResultDetailV01(fresh, selection);
      assert.equal(detail.identity.adapter_ref?.external_id, adapter.adapter_version);
      const expected = { unpinned: "unavailable", probe: "blocked", cancel: "cancelled" }[scenario];
      assert.equal(receipt.result_summary.outcome, expected,
        JSON.stringify(receipt.blockers.map(blocker => blocker.code)));
      if (cancelAtQueue) {
        assert(cancelSent && workerResult);
        const result = await workerResult;
        assert.equal(result.outcome, "cancelled");
        assert.equal(result.adapter_extension.bounded_metadata.queue_recovery_observed, true);
      } else {
        assert(receipt.blockers.some(b => b.code === (scenario === "probe"
          ? "pi_rpc_project_task_not_dispatched" : "pi_rpc_pinned_executable_unavailable")));
        assert.equal(receipt.capability_coverage.some(c => c.capability === adapter.capability_version &&
          c.coverage_level === "observed"), scenario === "probe");
      }
      assert.equal(receipt.privacy_egress.egress_status, "did_not_occur");
      assert.deepEqual(detail.commands, []);
      assert.deepEqual(detail.artifacts, []);
      assert(detail.skipped_checks.some(c => c.check_id === "validated_packet_delivery"));
      assert(!JSON.stringify(receipt).includes("Augnes offline queue check"));
      console.log(JSON.stringify({ test: "pi-rpc-lifecycle", real_pi: scenario !== "unpinned",
        outcome: receipt.result_summary.outcome, task_commands: detail.commands.length,
        project_egress: receipt.privacy_egress.egress_status, fresh_readback: true }));
    } finally { fresh.close(); }
  } finally { gate.resolve(); await service.shutdown(); }
}
