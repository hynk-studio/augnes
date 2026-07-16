import {
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostInvocationControlV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostTerminalOutcomeV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const DETERMINISTIC_CODEX_ADAPTER_VERSION_V01 =
  "deterministic_codex_adapter.v0.1" as const;
export const DETERMINISTIC_CODEX_CAPABILITY_VERSION_V01 =
  "codex_host_round_trip.v0.1" as const;

export type DeterministicCodexAdapterScenarioV01 =
  | "success"
  | "failure"
  | "unavailable";

export interface DeterministicCodexAdapterObservationV01 {
  adapter_version: typeof DETERMINISTIC_CODEX_ADAPTER_VERSION_V01;
  request: NativeHostRequestV01;
  cancellation_signal: AbortSignal;
  timeout_ms: number;
  stop_settle_timeout_ms: number;
}

export function createDeterministicCodexAdapterV01(
  options: {
    scenario?: DeterministicCodexAdapterScenarioV01;
    now?: () => string;
    observe?: (observation: DeterministicCodexAdapterObservationV01) => void;
  } = {},
): NativeHostAdapterV01 {
  const scenario = options.scenario ?? "success";
  const now = options.now ?? (() => new Date().toISOString());
  return {
    adapter_version: DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
    capability_version: DETERMINISTIC_CODEX_CAPABILITY_VERSION_V01,
    invoke(
      request: NativeHostRequestV01,
      control: NativeHostInvocationControlV01,
    ) {
      options.observe?.({
        adapter_version: DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
        request,
        cancellation_signal: control.cancellation_signal,
        timeout_ms: control.timeout_ms,
        stop_settle_timeout_ms: control.stop_settle_timeout_ms,
      });
      const result = Promise.resolve().then(() => {
        const startedAt = now();
        if (control.cancellation_signal.aborted) {
          return buildResult(request, startedAt, now(), "cancelled");
        }
        if (scenario === "unavailable") {
          return buildResult(request, startedAt, now(), "unavailable");
        }
        if (scenario === "failure") {
          return buildResult(request, startedAt, now(), "failed");
        }
        return buildResult(request, startedAt, now(), "completed");
      });
      const settled = result.then(
        () => undefined,
        () => undefined,
      );
      let stopPromise: Promise<void> | null = null;
      return {
        result,
        settled,
        request_stop(): Promise<void> {
          stopPromise ??= settled;
          return stopPromise;
        },
      };
    },
  };
}

function buildResult(
  request: NativeHostRequestV01,
  startedAt: string,
  finishedAt: string,
  outcome: NativeHostTerminalOutcomeV01,
): NativeHostResultV01 {
  const hostRef = externalRef(
    "native_host_adapter",
    DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
    finishedAt,
  );
  const taskRef = externalRef(
    "host_task",
    `deterministic:${request.request_id}`,
    finishedAt,
  );
  const completed = outcome === "completed";
  return {
    result_version: NATIVE_HOST_RESULT_VERSION_V01,
    request_id: request.request_id,
    run_id: request.run_id,
    outcome,
    public_stop_reason:
      outcome === "unavailable"
        ? "deterministic_codex_capability_unavailable"
        : outcome === "failed"
          ? "deterministic_codex_adapter_failed"
          : outcome === "cancelled"
            ? "host_invocation_cancelled_before_execution"
            : null,
    started_at: startedAt,
    finished_at: finishedAt,
    host_refs: [hostRef, taskRef],
    adapter_version: DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
    capability_version: DETERMINISTIC_CODEX_CAPABILITY_VERSION_V01,
    changed_files: [],
    artifacts: [],
    observed_actions: [
      "received_exact_validated_task_context_packet",
      "returned_versioned_structured_result",
    ],
    commands: [],
    checks: completed
      ? [
          {
            check_id: "deterministic_packet_delivery",
            required: true,
            status: "passed",
            summary:
              "The adapter received the exact validated project, packet, task, lineage, and root scope.",
          },
        ]
      : [],
    skipped_checks: request.packet.constraints.required_checks.map(
      (checkId) => ({
        check_id: checkId,
        required: true,
        reason:
          "PR A's deterministic adapter does not execute repository commands; live host execution is deferred.",
      }),
    ),
    model_invocation_receipt_refs: [],
    summary: completed
      ? "The deterministic Codex-shaped adapter completed one bounded structured host round trip without repository mutation."
      : "The deterministic Codex-shaped adapter returned a bounded terminal result without repository mutation.",
    uncertainty: [],
    gaps: completed
      ? ["Live Codex task lifecycle and repository command execution were not exercised."]
      : ["No live Codex capability or repository command execution was exercised."],
    proposed_next_steps: [
      "Review this operational receipt before deciding whether any later semantic action is appropriate.",
    ],
    capability_coverage: [
      {
        capability: "validated_packet_delivery",
        coverage: "enforced",
        source_ref: request.task_context_packet_ref,
        notes: ["The in-process adapter received the admitted packet object directly."],
      },
      {
        capability: "repository_command_execution",
        coverage: "unsupported",
        source_ref: null,
        notes: ["The deterministic PR A adapter executes no commands."],
      },
      {
        capability: "provider_or_model_egress",
        coverage: "enforced",
        source_ref: hostRef,
        notes: ["The deterministic adapter forbids provider and model egress."],
      },
    ],
    adapter_extension: {
      extension_version: "codex_adapter_result_extension.v0.1",
      adapter_kind: "codex",
      bounded_metadata: {
        execution_kind: "deterministic_local",
        live_host_invoked: false,
        raw_provider_payload_included: false,
      },
    },
  };
}

function externalRef(
  refType: string,
  externalId: string,
  observedAt: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    provider: "codex",
    host: "deterministic_local",
    observed_at: observedAt,
    trust_class: "direct_local_observation",
    compatibility_namespace: DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
  };
}
