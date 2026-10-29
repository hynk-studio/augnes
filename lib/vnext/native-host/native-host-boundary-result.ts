import { canonicalizeProtocolValueV01, parseStrictIsoTimestampV01 } from "@/lib/vnext/protocol-primitives";
import {
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostTerminalOutcomeV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

// These are the existing round-trip receipt identities, not a new contract.
const DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 = "direct_native_host_round_trip.v0.1";
const HOST_CAPABILITY = "project_scoped_structured_task_round_trip.v0.1";

/** Host-owned input observations consumed by the shared receipt normalizer. */
export interface NativeHostInputSnapshotValidationV01 {
  profile: string;
  fingerprint: string;
  request_binding: string;
  valid: boolean;
  source_current: boolean;
  native_outcome: NativeHostTerminalOutcomeV01;
}

export function buildNativeHostBoundaryTerminalResultV01(input: {
  request: NativeHostRequestV01;
  adapter: NativeHostAdapterV01;
  outcome: Exclude<NativeHostTerminalOutcomeV01, "completed" | "blocked" | "unavailable">;
  reason: string;
  prior_result?: NativeHostResultV01;
  now: () => string;
}): NativeHostResultV01 {
  const observedAt = boundedFinishedAt(
    input.request,
    input.request.packet.generated_at,
    input.now,
  );
  const hostRef = localRef(
    "native_host_adapter",
    input.adapter.adapter_version,
    observedAt,
    null,
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
  );
  return {
    result_version: NATIVE_HOST_RESULT_VERSION_V01,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    outcome: input.outcome,
    public_stop_reason: input.reason,
    started_at: observedAt,
    finished_at: observedAt,
    host_refs: uniqueRefs([...(input.prior_result?.host_refs ?? []), hostRef]),
    adapter_version: input.adapter.adapter_version,
    capability_version: input.adapter.capability_version,
    changed_files: [],
    artifacts: [],
    observed_actions: ["host_boundary_terminal_control_applied"],
    commands: [],
    checks: [],
    skipped_checks: input.request.packet.constraints.required_checks.map(
      (checkId) => ({
        check_id: checkId,
        required: true,
        reason: `Check was not run because ${input.reason}.`,
      }),
    ),
    model_invocation_receipt_refs: [],
    summary: "The native-host boundary returned a bounded failure result.",
    uncertainty: [],
    gaps: ["The requested deterministic host round trip did not complete."],
    proposed_next_steps: ["Review the public stop reason before retrying."],
    capability_coverage: [
      {
        capability: HOST_CAPABILITY,
        coverage: "observed",
        source_ref: hostRef,
        notes: ["The orchestration boundary observed the terminal control outcome."],
      },
      ...(input.adapter.provider_egress === "native_host_managed" &&
      input.prior_result?.adapter_extension.bounded_metadata
        .packet_delivery_initiated === true
        ? [
            {
              capability: "native_host_internal_model_activity",
              coverage: "unsupported" as const,
              source_ref: input.prior_result.host_refs[0] ?? hostRef,
              notes: [
                "Native-host-internal model activity remains outside Augnes-owned R4 Model Gateway coverage.",
              ],
            },
          ]
        : []),
    ],
    adapter_extension: {
      extension_version: "native_host_boundary_extension.v0.1",
      adapter_kind: input.adapter.adapter_version,
      bounded_metadata: {
        live_host_invoked:
          input.prior_result?.adapter_extension.bounded_metadata
            .live_host_invoked === true,
        packet_delivery_initiated:
          input.prior_result?.adapter_extension.bounded_metadata
            .packet_delivery_initiated === true,
        raw_provider_payload_included: false,
      },
    },
  };
}

function localRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string | null,
  namespace: string,
  trustClass: ExternalRefV01["trust_class"] = "direct_local_observation",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: namespace,
    trust_class: trustClass,
  };
}

function uniqueRefs(
  refs: Array<ExternalRefV01 | null | undefined>,
): ExternalRefV01[] {
  const seen = new Set<string>();
  return refs.filter((ref): ref is ExternalRefV01 => {
    if (!ref) return false;
    const key = canonicalizeProtocolValueV01({
      scope: ref.compatibility_namespace
        ? `namespace:${ref.compatibility_namespace}`
        : `provider:${ref.provider ?? ""}|host:${ref.host ?? ""}`,
      ref_type: ref.ref_type,
      external_id: ref.external_id,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function boundedFinishedAt(
  request: NativeHostRequestV01,
  fallback: string,
  now: () => string,
): string {
  const candidate = parseStrictIsoTimestampV01(now());
  if (candidate !== null) return new Date(candidate).toISOString();
  const generated = parseStrictIsoTimestampV01(fallback);
  return new Date(generated ?? 0).toISOString();
}
