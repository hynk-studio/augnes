import { createHash } from "node:crypto";
import { constants, createWriteStream } from "node:fs";
import { mkdtemp, open, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { NATIVE_HOST_RESULT_VERSION_V01, type NativeHostAdapterV01, type NativeHostResultV01 } from "@/types/vnext/native-host-adapter";
import { NativeHostReconciliationRequiredErrorV01, observedNativeHostTransportCoverageV01 } from "./native-host-contract";
import { PiRpcProtocolError, runPiRpcQueueLifecycleV01 } from "./pi-rpc-lifecycle";

const VERSION = "pi_rpc_lifecycle_1.5.2.v0.1";
const CAPABILITY = "pi_offline_queue_lifecycle.v0.1";
// Executable members of the official earendil-works/pi v1.5.2 release archives.
const PINS: Readonly<Record<string, { size: number; sha256: string }>> = {
  "linux-x64": { size: 122902704, sha256: "6a2ac1c5b0d08b91ce6095591c1960b469d0665c7fc5f32812960a4a17ca0c57" },
  "darwin-arm64": { size: 103046498, sha256: "a9e9d1f07b9a36f40948e67cd242952d0dea40a625167996b72b13db810b4cdc" },
};
let occupied = false;

async function prepareExecutable(source: string, destination: string, signal: AbortSignal): Promise<boolean> {
  const pin = PINS[process.platform + "-" + process.arch];
  if (!pin || !path.isAbsolute(source)) return false;
  const file = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size !== pin.size) return false;
    const hash = createHash("sha256");
    const bytes = file.createReadStream({ start: 0, end: pin.size - 1 });
    bytes.on("data", chunk => hash.update(chunk));
    await pipeline(bytes, createWriteStream(destination, { flags: "wx", mode: 0o500 }), { signal });
    return hash.digest("hex") === pin.sha256;
  } finally { await file.close(); }
}

/** Trusted server-side composition via the existing adapter_factory. The
 * candidate has no runtime selector, provider settings or task-delivery path. */
export function createPiRpcLifecycleAdapterV01(input: { executable: string; now?: () => string }): NativeHostAdapterV01 {
  const { executable, now = () => new Date().toISOString() } = input;
  return {
    adapter_version: VERSION, capability_version: CAPABILITY,
    execution_profile: "native_host_managed_model", provider_egress: "native_host_managed",
    invoke(request, control) {
      const started = now();
      const stop = new AbortController();
      const deadline = setTimeout(() => stop.abort("timeout"), Math.min(control.timeout_ms, 15_000));
      const signal = AbortSignal.any([control.cancellation_signal, stop.signal]);
      type Probe = Awaited<ReturnType<typeof runPiRpcQueueLifecycleV01>>;
      function terminal(outcome: NativeHostResultV01["outcome"], reason: string, probe?: Probe): NativeHostResultV01 {
        const finished = now();
        const host = probe ? {
          ref_version: "external_ref.v0.1" as const, ref_type: "native_host_session", external_id: probe.session,
          observed_at: finished, compatibility_namespace: VERSION, trust_class: "host_attestation" as const,
        } : null;
        return {
          result_version: NATIVE_HOST_RESULT_VERSION_V01, request_id: request.request_id, run_id: request.run_id,
          outcome, public_stop_reason: reason, started_at: started, finished_at: finished,
          adapter_version: VERSION, capability_version: CAPABILITY, host_refs: host ? [host] : [],
          changed_files: [], artifacts: [], observed_actions: [], commands: [], checks: [], skipped_checks: [],
          model_invocation_receipt_refs: [], summary: "The Pi lifecycle candidate did not execute the project task.",
          uncertainty: [], gaps: ["Project editing and test execution require a separately admitted worker profile."],
          proposed_next_steps: [],
          capability_coverage: probe ? [observedNativeHostTransportCoverageV01(request.request_id, {
            capability: CAPABILITY, source_ref: host,
            notes: ["The correlated control exchange ended with an idle, empty session and a settled process group."],
          })] : [],
          adapter_extension: {
            extension_version: "pi_rpc_lifecycle_extension.v0.1", adapter_kind: "pi_rpc",
            bounded_metadata: { packet_delivery_initiated: false, queue_recovery_observed: probe?.queued === true },
          },
        };
      }
      function stopped(probe?: Probe) {
        return signal.reason === "timeout" || signal.reason === "native_host_timeout"
          ? terminal("timed_out", "pi_rpc_timeout", probe) : terminal("cancelled", "pi_rpc_cancelled", probe);
      }
      async function run() {
        if (signal.aborted) return stopped();
        if (request.mode !== "interactive" || control.resume_binding) return terminal("unavailable", "pi_rpc_profile_unsupported");
        if (occupied) return terminal("unavailable", "pi_rpc_worker_busy");
        occupied = true;
        let directory: string | undefined;
        let cleanupConfirmed = true;
        try {
          directory = await mkdtemp(path.join(tmpdir(), "augnes-pi-rpc-"));
          const binary = path.join(directory, "pi");
          let verified = false;
          try { verified = await prepareExecutable(executable, binary, signal); }
          catch { /* Missing, unreadable and cancelled preparation never launch a worker. */ }
          if (signal.aborted) return stopped();
          if (!verified) return terminal("unavailable", "pi_rpc_pinned_executable_unavailable");
          const probe = await runPiRpcQueueLifecycleV01({
            executable: binary, directory, signal, stopSettleMs: control.stop_settle_timeout_ms,
            onQueued: async () => {
              await control.lifecycle_sink?.report_event({
                event_id: "native-host-event:" + request.run_id + ":pi-queue", run_id: request.run_id, observed_at: now(),
                state: "running", event_kind: "thread_status_changed", coverage: "observed", host_refs: [],
                bounded_metadata: { lifecycle_marker_queued: true, task_packet_sent: false },
              });
            },
          });
          if (signal.aborted) return stopped(probe);
          return terminal("blocked", "pi_rpc_project_task_not_dispatched", probe);
        } catch (error) {
          if (error instanceof NativeHostReconciliationRequiredErrorV01) {
            cleanupConfirmed = false;
            throw error;
          }
          if (signal.aborted) return stopped();
          return terminal("failed", error instanceof PiRpcProtocolError ? error.message : "pi_rpc_lifecycle_failed");
        } finally {
          if (cleanupConfirmed) {
            if (directory) {
              try { await rm(directory, { recursive: true, force: true }); }
              catch { throw new NativeHostReconciliationRequiredErrorV01("pi_rpc_cleanup_unconfirmed"); }
            }
            occupied = false;
          }
        }
      }
      const result = run().finally(() => clearTimeout(deadline));
      const settled = result.then(() => {});
      return { result, settled, request_stop({ reason }) { stop.abort(reason); return settled; } };
    },
  };
}
