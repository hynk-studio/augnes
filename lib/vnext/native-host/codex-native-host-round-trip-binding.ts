import { assertCodexScopedAdapterV01 } from "./codex-app-server-adapter";
import {
  assertCodexAuthoredSuccessorScopeV01,
  assertCodexScopedSnapshotCurrentV01,
  assertCodexScopedSourceCurrentV01,
  bindCodexScopedRequestV01,
  readCodexScopedRequestBindingV01,
  readCodexScopedSnapshotV01,
  type CodexScopedTaskV01,
} from "./codex-scoped-task";
import { assertNativeHostResultV01 } from "./native-host-contract";
import {
  buildNativeHostBoundaryTerminalResultV01,
  type NativeHostInputSnapshotValidationV01,
} from "./native-host-boundary-result";
import type {
  NativeHostAdapterV01,
  NativeHostRequestV01,
  NativeHostResultV01,
  NativeHostRootScopeV01,
} from "@/types/vnext/native-host-adapter";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

/**
 * Fixed local Codex composition. The shared run owner constructs this from its
 * existing source-owned scope; callers cannot substitute validation callbacks.
 * Packet/project admission and canonical receipt construction stay shared.
 */
export function createCodexNativeHostRoundTripBindingV01(scope: CodexScopedTaskV01) {
  return Object.freeze({
    async assertAuthoredSuccessor(
      adapter: NativeHostAdapterV01,
      packet: TaskContextPacketV01,
      root: NativeHostRootScopeV01,
    ): Promise<void> {
      assertCodexScopedAdapterV01(adapter, scope);
      await assertCodexAuthoredSuccessorScopeV01(scope, packet, root);
    },
    async bindRequest(request: NativeHostRequestV01): Promise<void> {
      await bindCodexScopedRequestV01(scope, request);
    },
    async normalizeResult(input: {
      request: NativeHostRequestV01;
      adapter: NativeHostAdapterV01;
      result: NativeHostResultV01;
      now: () => string;
    }): Promise<{
      result: NativeHostResultV01;
      snapshot_validation: NativeHostInputSnapshotValidationV01;
    }> {
      const { request, adapter, now } = input;
      let hostResult = input.result;
      const snapshot = readCodexScopedSnapshotV01(scope);
      let snapshotValid = true, sourceCurrent = true;
      try { await assertCodexScopedSnapshotCurrentV01(scope); } catch { snapshotValid = false; }
      try { await assertCodexScopedSourceCurrentV01(scope, request); } catch { sourceCurrent = false; }
      const nativeOutcome = hostResult.outcome;
      const snapshotValidation = {
        profile: snapshot.profile, fingerprint: snapshot.fingerprint,
        request_binding: readCodexScopedRequestBindingV01(scope, request),
        valid: snapshotValid, source_current: sourceCurrent, native_outcome: nativeOutcome,
      };
      if (!snapshotValid) {
        hostResult = buildNativeHostBoundaryTerminalResultV01({ request, adapter, outcome: "failed",
          reason: "scoped_snapshot_integrity_invalid", prior_result: hostResult, now });
      } else if (!sourceCurrent) {
        // Preserve valid bounded observations about the frozen input, but prevent
        // this result from being accepted as completed/current-source evidence.
        hostResult = { ...hostResult,
          outcome: hostResult.outcome === "completed" ? "blocked" : hostResult.outcome,
          public_stop_reason: "scoped_snapshot_source_changed",
          uncertainty: [...hostResult.uncertainty, "The result concerns the approved input snapshot; original source currentness changed."],
        };
      }
      hostResult = assertNativeHostResultV01(request, { ...hostResult, adapter_extension: {
        ...hostResult.adapter_extension, bounded_metadata: { ...hostResult.adapter_extension.bounded_metadata,
          input_profile: snapshot.profile, input_snapshot_fingerprint: snapshot.fingerprint,
          source_snapshot_request_binding: readCodexScopedRequestBindingV01(scope, request),
          input_snapshot_valid: snapshotValid, original_source_current_at_return: sourceCurrent,
          host_outcome_before_input_validation: nativeOutcome,
        },
      } });
      return { result: hostResult, snapshot_validation: snapshotValidation };
    },
  });
}
