import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { isUtf8 } from "node:buffer";
import { canonicalizeProtocolValueV01 as canonical, containsSecretShapedValueV01, createProtocolSha256V01 as hash } from "@/lib/vnext/protocol-primitives";
import { canonicalizeRepositoryRelativePathV01 } from "@/lib/vnext/repository-relative-path";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { NATIVE_HOST_RESULT_VERSION_V01, PI_FILE_PATCH_CHECKS, type NativeHostAdapterV01, type NativeHostObservedCheckV01,
  type NativeHostResultV01, type NativeHostRootScopeV01 } from "@/types/vnext/native-host-adapter";
import { readBoundedLocalSourceBytes } from "./bounded-source-read";
import { NativeHostReconciliationRequiredErrorV01 } from "./native-host-contract";
import { preparePinnedPiExecutableV01 } from "./pi-rpc-lifecycle-adapter";
import { PI_PATCH_CHECK, PI_PATCH_CHECK_SOURCE, PI_PATCH_EDIT, runPiFilePatchWorker } from "./pi-file-patch-worker";
import { inspectNativeHostPhysicalRootIdentitySynchronouslyV01 } from "./project-root-identity";

const PROFILE = "pi_offline_final_newline.v1";
export const PI_FILE_PATCH_LIMIT = 64 * 1024;
export const PI_FILE_PATCH_TIMEOUT = 20_000;
export class PiFilePatchError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

function digest(bytes: Buffer) { return "sha256:" + createHash("sha256").update(bytes).digest("hex"); }

export function readPiPatchSelection(packet: TaskContextPacketV01, root: NativeHostRootScopeV01, selected: unknown, workBinding: string) {
  if (typeof selected !== "string" || selected.length > 240 || containsSecretShapedValueV01(selected) ||
      !/^[\p{L}\p{N}][\p{L}\p{N} _.-]*(?:\/[\p{L}\p{N}][\p{L}\p{N} _.-]*)*\.(?:txt|md)$/u.test(selected) ||
      canonicalizeRepositoryRelativePathV01(selected) !== selected) throw new PiFilePatchError("pi_patch_text_path_required", 400);
  if (packet.constraints.data_classification === "secret" || packet.constraints.forbidden_actions.length || packet.capability_grant) {
    throw new PiFilePatchError("pi_patch_work_scope_unsupported", 403);
  }
  function assertRegisteredRoot() {
    try {
      const physical = inspectNativeHostPhysicalRootIdentitySynchronouslyV01(root.canonical_root);
      if (canonical(physical) === canonical(root.physical_root_identity)) return;
    } catch { /* A missing root also invalidates the selection. */ }
    throw new PiFilePatchError("pi_patch_root_changed");
  }
  assertRegisteredRoot();
  let bytes: Buffer;
  try { bytes = readBoundedLocalSourceBytes(path.join(root.canonical_root, selected), PI_FILE_PATCH_LIMIT); }
  catch { throw new PiFilePatchError("pi_patch_source_unavailable"); }
  assertRegisteredRoot();
  if (!bytes.length || !isUtf8(bytes) || bytes.includes(0)) throw new PiFilePatchError("pi_patch_text_required");
  if (bytes.at(-1) === 10) throw new PiFilePatchError("pi_patch_already_terminated");
  const selection = { path: selected, before_sha256: digest(bytes), bytes: bytes.length };
  const binding = hash(canonical({ profile: PROFILE, workspace: packet.workspace_id, project: packet.project_id,
    packet: packet.packet_id, fingerprint: packet.integrity.fingerprint, work: workBinding,
    root: root.root_fingerprint, physical: root.physical_root_identity, selection }));
  return { bytes, selection, binding };
}

interface PiFilePatch {
  path: string;
  offset: number;
  append_hex: "0a";
  before_sha256: string;
  after_sha256: string;
}

// Only the controller's settled, independent, byte-for-byte read mints a
// witness. A serialized host check (including an identical check ID) cannot.
const checked = new WeakMap<NativeHostObservedCheckV01, { requestId: string; patch: PiFilePatch }>();
export function readVerifiedPiFilePatch(requestId: string, check: NativeHostObservedCheckV01) {
  const witness = checked.get(check);
  return witness?.requestId === requestId ? witness.patch : null;
}

export function createPiFilePatchAdapter(input: {
  executable: string; selectedPath: string; approvedBinding: string; assertCurrent: () => string; now?: () => string;
}): NativeHostAdapterV01 {
  const { executable, selectedPath, approvedBinding, assertCurrent, now = () => new Date().toISOString() } = input;
  // The ordinary run identity includes this binding, so another file or input
  // revision cannot replay an earlier edit as the newly requested one.
  const capability = PROFILE + "." + approvedBinding;
  return {
    adapter_version: PROFILE, capability_version: capability, execution_profile: "offline_file_patch", provider_egress: "forbidden",
    invoke(request, control) {
      const started = now();
      const stop = new AbortController();
      const signal = AbortSignal.any([stop.signal, control.cancellation_signal, AbortSignal.timeout(
        Math.min(control.timeout_ms, PI_FILE_PATCH_TIMEOUT))]);
      const reports: NativeHostResultV01["commands"] = [];
      const checks: NativeHostResultV01["checks"] = [];
      const hostRefs: NativeHostResultV01["host_refs"] = [];
      let delivered = false;
      function terminal(outcome: NativeHostResultV01["outcome"], reason: string | null): NativeHostResultV01 {
        return {
          result_version: NATIVE_HOST_RESULT_VERSION_V01, request_id: request.request_id, run_id: request.run_id,
          adapter_version: PROFILE, capability_version: capability, started_at: started, finished_at: now(), outcome,
          public_stop_reason: reason, host_refs: hostRefs, commands: reports, checks, skipped_checks: [],
          changed_files: [], artifacts: [], observed_actions: [], model_invocation_receipt_refs: [],
          summary: outcome === "completed" ? "Pi edited and checked the selected file copy. The project source was preserved."
            : "A checked file patch was not returned.", gaps: [], uncertainty: [], proposed_next_steps: [], capability_coverage: [],
          adapter_extension: { adapter_kind: "pi_rpc", extension_version: PROFILE,
            bounded_metadata: { packet_delivery_initiated: false, selected_file_delivery_started: delivered } },
        };
      }
      function boundInput() {
        signal.throwIfAborted();
        const workBinding = assertCurrent();
        const material = readPiPatchSelection(request.packet, request.root_scope, selectedPath, workBinding);
        if (material.binding !== approvedBinding) throw new PiFilePatchError("pi_patch_selection_changed");
        return material;
      }
      async function run() {
        if (request.mode !== "interactive" || control.resume_binding || request.repository_delegation_context ||
            request.automation_context || request.policy.commands !== "approved_offline_file_patch" ||
            request.policy.filesystem !== "selected_file_copy_only" || request.policy.host_egress !== "approved_file_to_local_worker" ||
            request.policy.network !== "forbidden" || request.policy.model !== "forbidden" || request.policy.max_changed_files !== 0 ||
            request.policy.max_commands !== 2 || request.policy.max_checks !== PI_FILE_PATCH_CHECKS.length ||
            request.policy.max_artifacts !== 1) return terminal("blocked", "pi_patch_scope_required");
        if (process.platform !== "linux" || process.arch !== "x64") return terminal("unavailable", "pi_patch_linux_x64_required");
        let directory: string | undefined;
        let settled = true;
        try {
          const initial = boundInput();
          directory = await mkdtemp(path.join(tmpdir(), "augnes-pi-file-"));
          if (!await preparePinnedPiExecutableV01(executable, path.join(directory, "pi"), signal).catch(() => false)) {
            signal.throwIfAborted();
            return terminal("unavailable", "pi_patch_pinned_executable_unavailable");
          }
          const staged = path.join(directory, "answer.txt");
          await writeFile(staged, "", { flag: "wx", mode: 0o600 });
          await writeFile(path.join(directory, "check.sh"), PI_PATCH_CHECK_SOURCE, { flag: "wx", mode: 0o400 });
          await runPiFilePatchWorker({ directory, signal, settleMs: control.stop_settle_timeout_ms,
            async deliver(session) {
              const current = boundInput();
              hostRefs.push({ ref_version: "external_ref.v0.1", ref_type: "native_host_session", external_id: session,
                compatibility_namespace: PROFILE, observed_at: now(), trust_class: "host_attestation" });
              delivered = true;
              await writeFile(staged, current.bytes, { flag: "r+", signal });
            },
            record(kind, exitCode) {
              const passed = exitCode === 0;
              reports.push({ command_id: "pi_patch_" + kind, command_fingerprint: hash(kind === "edit" ? PI_PATCH_EDIT : PI_PATCH_CHECK),
                summary: kind === "edit" ? "Append one LF to the staged file." : "Check the staged file for a final LF.",
                started_at: null, finished_at: now(), exit_code: exitCode, status: passed ? "completed" : "failed" });
              if (kind === "check") checks.push({ check_id: "pi_staged_file_check", required: true,
                status: passed ? "passed" : "failed", summary: "Pi reported the exit status of the fixed final-newline check." });
            },
          });
          const output = readBoundedLocalSourceBytes(staged, PI_FILE_PATCH_LIMIT + 1);
          if (!output.equals(Buffer.concat([initial.bytes, Buffer.from([10])]))) {
            return terminal("failed", "pi_patch_output_mismatch");
          }
          await rm(directory, { recursive: true, force: true });
          directory = undefined;
          boundInput();
          const check: NativeHostObservedCheckV01 = Object.freeze({ check_id: "pi_output_bytes", required: true,
            status: "passed", summary: "After Pi exited, Augnes matched every output byte to the approved source plus one LF." });
          checked.set(check, { requestId: request.request_id, patch: Object.freeze({ path: selectedPath, offset: initial.bytes.length,
            append_hex: "0a", before_sha256: initial.selection.before_sha256, after_sha256: digest(output) }) });
          checks.push(check);
          return terminal("completed", null);
        } catch (error) {
          if (error instanceof NativeHostReconciliationRequiredErrorV01) { settled = false; throw error; }
          if (signal.aborted) {
            const timedOut = signal.reason === "timeout" || signal.reason === "native_host_timeout" || signal.reason?.name === "TimeoutError";
            return terminal(timedOut ? "timed_out" : "cancelled", timedOut ? "pi_patch_timeout" : "pi_patch_cancelled");
          }
          return error instanceof PiFilePatchError ? terminal("blocked", error.code) : terminal("failed", "pi_patch_worker_failed");
        } finally {
          if (settled && directory) {
            try { await rm(directory, { recursive: true, force: true }); }
            catch { throw new NativeHostReconciliationRequiredErrorV01("pi_patch_cleanup_unconfirmed"); }
          }
        }
      }
      const result = run();
      const settled = result.then(() => {});
      return { result, settled, request_stop({ reason }) { stop.abort(reason); return settled; } };
    },
  };
}
