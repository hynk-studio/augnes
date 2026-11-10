import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { inspectNativeHostPhysicalRootIdentityV01 } from "./project-root-identity";
import { WORKFLOW_COST_VERIFIER_SOURCE } from "../workflow-cost-verifier-identity";
import { WORKFLOW_COST_PROFILE, WORKFLOW_COST_VERIFIER, WORKFLOW_COST_ADAPTER, WORKFLOW_COST_CHECKS, WORKFLOW_COST_LIMITS,
  exactObject, normalizeWorkflowCostInputs, parseWorkflowCostJson, verifyWorkflowCostReport, workflowCostRequire as requireValue,
  WorkflowCostError, type WorkflowCostInputs } from "../workflow-cost-verifier";
import type { NativeHostAdapterV01, NativeHostRootScopeV01, NativeHostResultV01 } from "@/types/vnext/native-host-adapter";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export { WORKFLOW_COST_ADAPTER };
export const WORKFLOW_COST_SELECTION_SOURCE = "augnes:workflow-cost-verification-selection:v1";
export const WORKFLOW_COST_CRITERIA = hash(canonical({ profile: WORKFLOW_COST_PROFILE, checks: WORKFLOW_COST_CHECKS, limits: WORKFLOW_COST_LIMITS,
  equations: "direct=(attempt+verification+(1-direct_success)*repair)/direct_success; inspected=(attempt+verification+inspection+(1-inspected_success)*repair)/inspected_success; p=0 => non_completing/null/not_comparable",
  interpretation: "Arithmetic consistency only; mandatory verification in both branches; empirical probability, stationarity, deadline, causality and semantic acceptance unverified." }));
export interface WorkflowCostSelection {
  profile: typeof WORKFLOW_COST_PROFILE; verifier: typeof WORKFLOW_COST_VERIFIER;
  verifier_source: string; criteria: string; root: string;
  basis: { path: string; digest: string; values: WorkflowCostInputs };
  report: { path: string; digest: string };
}
export function workflowCostPath(value: unknown): string {
  requireValue(typeof value === "string" && value.length <= 160 && value.endsWith(".json") &&
    value.split("/").length <= 8 && value.split("/").every(part => /^[A-Za-z0-9][A-Za-z0-9_.-]*$/u.test(part)), "workflow_cost_path_invalid");
  return value;
}
export function workflowCostSelectionFromPacket(packet: TaskContextPacketV01): WorkflowCostSelection {
  const entries = readSelectedWorkSources(packet).filter(e => e.compatibility_source_ref?.external_id === WORKFLOW_COST_SELECTION_SOURCE);
  requireValue(entries.length === 1, "workflow_cost_selection_required");
  let selection: Record<string, unknown>;
  try { selection = exactObject(JSON.parse(entries[0]!.bounded_summary!), ["profile", "verifier", "verifier_source", "criteria", "root", "basis", "report"]); }
  catch { throw new WorkflowCostError("workflow_cost_selection_invalid"); }
  const basis = exactObject(selection.basis, ["path", "digest", "values"]);
  const report = exactObject(selection.report, ["path", "digest"]);
  requireValue(selection.profile === WORKFLOW_COST_PROFILE && selection.verifier === WORKFLOW_COST_VERIFIER &&
    selection.verifier_source === WORKFLOW_COST_VERIFIER_SOURCE && selection.criteria === WORKFLOW_COST_CRITERIA &&
    [selection.root, basis.digest, report.digest].every(v => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)) &&
    workflowCostPath(basis.path) !== workflowCostPath(report.path) &&
    canonical(normalizeWorkflowCostInputs(basis.values)) === canonical(basis.values), "workflow_cost_selection_stale_or_invalid");
  return selection as unknown as WorkflowCostSelection;
}

/** Exactly two regular, unaliased selected files. No recursive discovery. */
export async function readWorkflowCostFiles(root: NativeHostRootScopeV01, paths: readonly [string, string], guard: () => Promise<void>) {
  let bytesRead = 0;
  const assertRoot = async () => {
    await guard();
    requireValue(canonical(await inspectNativeHostPhysicalRootIdentityV01(root.canonical_root)) === canonical(root.physical_root_identity), "workflow_cost_root_changed");
  };
  await assertRoot();
  requireValue(paths[0] !== paths[1], "workflow_cost_distinct_files_required");
  const rows = [];
  for (const selected of paths) {
    workflowCostPath(selected); await guard();
    const parts = selected.split("/");
    for (let i = 1; i <= parts.length; i++) {
      await guard();
      const info = await lstat(path.join(root.canonical_root, ...parts.slice(0, i)));
      requireValue(!info.isSymbolicLink() && (i === parts.length || info.isDirectory()), "workflow_cost_file_alias_refused");
    }
    const target = path.join(root.canonical_root, selected);
    requireValue(await realpath(target) === target, "workflow_cost_file_alias_refused");
    const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const before = await handle.stat();
      const remaining = WORKFLOW_COST_LIMITS.input_bytes - bytesRead;
      requireValue(before.isFile() && before.nlink === 1 && before.size > 0 && before.size <= remaining, "workflow_cost_file_bound");
      const bytes = Buffer.alloc(before.size + 1);
      let count = 0;
      while (count < bytes.length) {
        await guard();
        const read = await handle.read(bytes, count, bytes.length - count, count);
        if (!read.bytesRead) break;
        count += read.bytesRead;
      }
      const after = await handle.stat(), named = await lstat(target);
      requireValue(count === before.size && after.size === count && before.ctimeMs === after.ctimeMs && before.mtimeMs === after.mtimeMs &&
        named.isFile() && named.nlink === 1 && named.dev === after.dev && named.ino === after.ino && await realpath(target) === target,
      "workflow_cost_file_changed");
      bytesRead += count;
      const content = bytes.subarray(0, count);
      rows.push({ path: selected, digest: `sha256:${createHash("sha256").update(content).digest("hex")}`,
        text: new TextDecoder("utf-8", { fatal: true }).decode(content) });
    } finally { await handle.close(); }
  }
  await assertRoot();
  return { basis: rows[0]!, report: rows[1]!, bytes_read: bytesRead };
}
export async function prepareWorkflowCostSelection(root: NativeHostRootScopeV01, paths: readonly [string, string], guard: () => Promise<void>): Promise<WorkflowCostSelection> {
  const files = await readWorkflowCostFiles(root, paths, guard);
  return { profile: WORKFLOW_COST_PROFILE, verifier: WORKFLOW_COST_VERIFIER, verifier_source: WORKFLOW_COST_VERIFIER_SOURCE,
    criteria: WORKFLOW_COST_CRITERIA, root: root.root_fingerprint,
    basis: { path: files.basis.path, digest: files.basis.digest, values: normalizeWorkflowCostInputs(parseWorkflowCostJson(files.basis.text)) },
    report: { path: files.report.path, digest: files.report.digest } };
}

export function createWorkflowCostVerificationAdapter(assertAdmission: () => Promise<void>, revalidateAdmission = assertAdmission,
  now = () => new Date().toISOString()): NativeHostAdapterV01 {
  return { adapter_version: WORKFLOW_COST_ADAPTER, capability_version: WORKFLOW_COST_PROFILE,
    execution_profile: "deterministic_zero_model", provider_egress: "forbidden",
    invoke(request, control) {
      const stop = new AbortController();
      const started = now(), monotonic = performance.now();
      const guard = async () => {
        requireValue(!stop.signal.aborted && !control.cancellation_signal.aborted &&
          performance.now() - monotonic < Math.min(control.timeout_ms, WORKFLOW_COST_LIMITS.timeout_ms), "workflow_cost_cancelled_or_timed_out");
        await assertAdmission();
      };
      const result = (async (): Promise<NativeHostResultV01> => {
        await guard();
        await revalidateAdmission();
        const selection = workflowCostSelectionFromPacket(request.packet);
        requireValue(request.mode === "interactive" && request.policy.commands === "forbidden_in_deterministic_adapter" &&
          request.policy.model === "forbidden_in_deterministic_adapter" && request.policy.network === "forbidden" &&
          selection.root === request.root_scope.root_fingerprint, "workflow_cost_request_conflict");
        const files = await readWorkflowCostFiles(request.root_scope, [selection.basis.path, selection.report.path], guard);
        requireValue(files.basis.digest === selection.basis.digest && files.report.digest === selection.report.digest &&
          canonical(normalizeWorkflowCostInputs(parseWorkflowCostJson(files.basis.text))) === canonical(selection.basis.values), "workflow_cost_sources_changed");
        const verified = verifyWorkflowCostReport(selection.basis.values, files.report.text);
        await revalidateAdmission();
        await guard();
        const finished = now(), binding = hash(canonical(selection));
        const hostRef = { ref_version: "external_ref.v0.1" as const, ref_type: "native_host_adapter", external_id: WORKFLOW_COST_ADAPTER,
          observed_at: finished, source_ref: WORKFLOW_COST_VERIFIER_SOURCE, compatibility_namespace: WORKFLOW_COST_PROFILE, trust_class: "direct_local_observation" as const };
        const checks: Record<string, boolean> = { workflow_cost_source_binding: true, ...verified.checks, workflow_cost_read_only: true };
        const output: NativeHostResultV01 = { result_version: "native_host_result.v0.1", request_id: request.request_id, run_id: request.run_id,
          outcome: "completed", public_stop_reason: null, started_at: started, finished_at: finished, host_refs: [hostRef],
          adapter_version: WORKFLOW_COST_ADAPTER, capability_version: WORKFLOW_COST_PROFILE,
          changed_files: [], commands: [], model_invocation_receipt_refs: [],
          artifacts: [selection.basis, selection.report].map((source, i) => ({ artifact_ref: { ...hostRef,
            ref_type: i === 0 ? "workflow_cost_input_basis" : "workflow_cost_candidate_report", external_id: source.path, source_ref: source.digest },
            summary: i === 0 ? "Explicitly selected authoritative numeric basis, with unverified applicability." : "Selected report checked as inert data." })),
          observed_actions: ["verified_exact_project_root_binding", "independently_recomputed_renewal_values"],
          checks: WORKFLOW_COST_CHECKS.map(check_id => ({ check_id, required: true, status: checks[check_id] ? "passed" : "failed", summary: `${check_id}: ${checks[check_id] ? "consistent" : "rejected"}` })),
          skipped_checks: [], summary: canonical({ profile: WORKFLOW_COST_PROFILE, selection: binding, verifier_source: WORKFLOW_COST_VERIFIER_SOURCE,
            criteria: WORKFLOW_COST_CRITERIA, inputs: verified.inputs, recomputed: verified.recomputed, reported: verified.reported,
            consistent: verified.consistent, bytes_read: files.bytes_read }),
          uncertainty: ["Probabilities are stipulated; empirical support and stationary applicability remain unresolved. Arithmetic consistency establishes no deadline, causal benefit or semantic acceptance. Mandatory verification remains in both alternatives."],
          gaps: Object.entries(checks).filter(([, passed]) => !passed).map(([id]) => id),
          proposed_next_steps: ["Review the source-bound result and unresolved applicability before selecting a successor task."],
          capability_coverage: [{ capability: WORKFLOW_COST_PROFILE, coverage: "enforced", source_ref: hostRef,
            notes: ["Fixed trusted in-process verifier; two bounded data files; no subprocess, commands, file mutation, provider or network operations."] }],
          adapter_extension: { extension_version: "workflow_cost_verification_extension.v1", adapter_kind: "workflow_cost_verification",
            bounded_metadata: { live_host_invoked: true, packet_delivery_initiated: true, local_read_only_operation: true, raw_provider_payload_included: false,
              selection_binding: binding, criteria_binding: WORKFLOW_COST_CRITERIA, verifier_source: WORKFLOW_COST_VERIFIER_SOURCE } } };
        requireValue(Buffer.byteLength(canonical(output)) <= Math.min(WORKFLOW_COST_LIMITS.result_bytes, request.result_return.max_result_bytes), "workflow_cost_result_bound");
        return output;
      })();
      const settled = result.then(() => undefined, () => undefined);
      return { result, settled, request_stop: async () => { stop.abort(); await settled; } };
    } };
}
