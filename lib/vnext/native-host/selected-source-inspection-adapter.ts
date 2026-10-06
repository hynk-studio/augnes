import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical } from "../protocol-primitives";
import { inspectNativeHostPhysicalRootIdentityV01 } from "./project-root-identity";
import { readAgendaInput, SELECTED_SOURCE_INSPECTION, type Observation } from "../prospective-agenda";
import type { NativeHostAdapterV01, NativeHostRequestV01, NativeHostInvocationControlV01, NativeHostResultV01 } from "@/types/vnext/native-host-adapter";

export const SELECTED_SOURCE_ADAPTER = "selected_source_inspection_adapter.v0.1";
export const SELECTED_SOURCE_RESULT = "selected_source_inspection_result.v0.1";
export const INSPECTION_BYTE_LIMIT = 65_536;
export interface InspectionResult {
  version: typeof SELECTED_SOURCE_RESULT; agenda_ref: string; observations: Observation[];
  bytes_read: number; model_calls: 0;
}

export function createSelectedSourceInspectionAdapter(now = () => new Date().toISOString(), assertAdmission: () => void = () => {}): NativeHostAdapterV01 {
  return { adapter_version: SELECTED_SOURCE_ADAPTER, capability_version: SELECTED_SOURCE_INSPECTION,
    execution_profile: "deterministic_zero_model", provider_egress: "forbidden",
    invoke(request, control) {
      const result = inspect(request, control, now, assertAdmission);
      const settled = result.then(() => undefined, () => undefined);
      return { result, settled, request_stop: () => settled };
    } };
}

async function inspect(request: NativeHostRequestV01, control: NativeHostInvocationControlV01, now: () => string, assertAdmission: () => void): Promise<NativeHostResultV01> {
  const started = now();
  const startedMonotonic = performance.now();
  assertAdmission();
  const input = readAgendaInput(readSelectedWorkSources(request.packet), started);
  if (!input || !request.packet.compatibility.source_contracts.includes(SELECTED_SOURCE_INSPECTION) ||
    request.automation_context?.bounded_cycle?.grant.work_operation_profile !== SELECTED_SOURCE_INSPECTION ||
    request.automation_context.bounded_cycle.grant.host_adapter_version !== SELECTED_SOURCE_ADAPTER) throw new Error("prospective_inspection_admission_required");
  const root = request.root_scope.canonical_root;
  if (canonical(await inspectNativeHostPhysicalRootIdentityV01(root)) !== canonical(request.root_scope.physical_root_identity)) throw new Error("prospective_root_changed");
  let bytesRead = 0;
  const observations: Observation[] = [];
  for (const source of input.agenda.inspections) {
    assertAdmission();
    if (control.cancellation_signal.aborted || performance.now() - startedMonotonic > control.timeout_ms) throw new Error("prospective_inspection_cancelled");
    let availability: Observation["availability"] = "channel_unavailable", value: boolean | null = null;
    let reason = "selected_channel_unavailable", sourceRef = source.digest;
    try {
      // Refuse aliases and symlinked parents. No glob, traversal, commands or
      // hidden-file access. Only explicitly selected text-file bytes are read.
      const parts = source.path.split("/");
      for (let i = 1; i <= parts.length; i++) {
        const p = path.join(root, ...parts.slice(0, i));
        const info = await lstat(p);
        if (info.isSymbolicLink() || i < parts.length && !info.isDirectory()) throw new Error("unsafe_source");
      }
      const target = path.join(root, source.path);
      if (await realpath(target) !== target) throw new Error("unsafe_source");
      const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      try {
        const before = await handle.stat();
        if (!before.isFile() || before.nlink !== 1 || before.size > INSPECTION_BYTE_LIMIT - bytesRead) throw new Error("source_bound");
        const bytes = Buffer.alloc(Math.min(before.size + 1, INSPECTION_BYTE_LIMIT - bytesRead));
        let count = 0;
        while (count < bytes.length) {
          if (control.cancellation_signal.aborted) throw new Error("cancelled");
          const read = await handle.read(bytes, count, bytes.length - count, count);
          if (!read.bytesRead) break;
          count += read.bytesRead;
        }
        bytesRead += count;
        const after = await handle.stat();
        const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, count));
        sourceRef = `sha256:${createHash("sha256").update(bytes.subarray(0, count)).digest("hex")}`;
        if (before.size !== count || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || sourceRef !== source.digest) {
          availability = "conflicting"; reason = "selected_source_revision_changed";
        } else {
          value = content.includes(source.contains);
          availability = value ? "observed" : "checked_absent";
          reason = value ? "literal_present_in_exact_selected_version" : "literal_absent_in_exact_selected_version";
        }
      } finally { await handle.close(); }
    } catch {
      // ENOENT is unavailable for an expected content version. It is not proof
      // that a forecasted event failed or that a literal was checked and absent.
    }
    observations.push({ key: source.key, availability, value, reason, source_ref: sourceRef, observed_at: now() });
  }
  assertAdmission();
  if (control.cancellation_signal.aborted || canonical(await inspectNativeHostPhysicalRootIdentityV01(root)) !== canonical(request.root_scope.physical_root_identity)) throw new Error("prospective_inspection_cancelled_or_root_changed");
  const finished = now();
  const report: InspectionResult = { version: SELECTED_SOURCE_RESULT, agenda_ref: input.source_ref, observations, bytes_read: bytesRead, model_calls: 0 };
  const hostRef = { ref_version: "external_ref.v0.1" as const, ref_type: "native_host_adapter", external_id: SELECTED_SOURCE_ADAPTER,
    observed_at: finished, compatibility_namespace: SELECTED_SOURCE_ADAPTER, trust_class: "direct_local_observation" as const };
  return { result_version: "native_host_result.v0.1", request_id: request.request_id, run_id: request.run_id,
    outcome: "completed", public_stop_reason: null, started_at: started, finished_at: finished,
    host_refs: [hostRef], adapter_version: SELECTED_SOURCE_ADAPTER, capability_version: SELECTED_SOURCE_INSPECTION,
    changed_files: [], artifacts: [], commands: [], model_invocation_receipt_refs: [],
    observed_actions: ["received_exact_validated_task_context_packet", "inspected_bounded_selected_source_bundle"],
    checks: [{ check_id: "selected_source_bundle_inspected", required: true, status: "passed", summary: "Returned bounded source observations with explicit channel availability; completion does not prove a decision or event." }],
    skipped_checks: [], summary: canonical(report), uncertainty: ["Literal inspection establishes only what was observed in those exact files."],
    gaps: observations.filter(o => o.availability === "channel_unavailable" || o.availability === "conflicting").map(o => `${o.key}: ${o.reason}`),
    proposed_next_steps: ["Reconsider the agenda using the source-bound observations; semantic acceptance requires its existing owner."],
    capability_coverage: [{ capability: "selected_source_inspection", coverage: "enforced", source_ref: hostRef, notes: ["At most two selected files and 65536 bytes; no commands, source mutation, network or model calls."] }],
    adapter_extension: { extension_version: "selected_source_inspection_extension.v0.1", adapter_kind: "selected_source_inspection",
      bounded_metadata: { live_host_invoked: true, packet_delivery_initiated: true, local_read_only_operation: true, raw_provider_payload_included: false } } };
}
