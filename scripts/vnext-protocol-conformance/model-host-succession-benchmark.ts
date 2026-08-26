import assert from "node:assert/strict";

import {
  buildModelHostSuccessionRouteProfileV01,
  validateModelHostSuccessionRouteProfileV01,
} from "@/lib/vnext/model-host-succession-benchmark";

export function runModelHostSuccessionBenchmarkConformanceV01() {
  const input = {
    route_role: "zero_model_fallback" as const,
    provider_ref: null,
    model_ref: null,
    host_ref: {
      ref_version: "external_ref.v0.1" as const,
      ref_type: "native_host",
      external_id: "deterministic_local_conformance",
      observed_at: "2026-07-18T15:02:00.000Z",
      trust_class: "direct_local_observation" as const,
      compatibility_namespace: "model_host_succession_benchmark.v0.1",
    },
    adapter_implementation_id: "deterministic_codex_adapter",
    adapter_implementation_version: "deterministic_codex_adapter.v0.1",
    native_host_adapter_version: "deterministic_codex_adapter.v0.1",
    capability_version: "codex_host_round_trip.v0.1",
    execution_profile: "deterministic_zero_model" as const,
    provider_egress_policy: "forbidden" as const,
    session_continuity_mode: "fresh_session_no_reuse" as const,
    evidence_class: "observed_deterministic_execution" as const,
    supported_operation_classes: ["validated_packet_delivery"],
    unsupported_operation_classes: ["provider_or_model_egress"],
    capability_coverage: [
      {
        operation_class: "validated_packet_delivery",
        coverage: "supported" as const,
        basis: "Exact in-memory packet delivery is observed.",
      },
      {
        operation_class: "provider_or_model_egress",
        coverage: "unsupported" as const,
        basis: "The deterministic adapter forbids provider and model egress.",
      },
    ],
    predecessor_route_ref: null,
    fallback_target_ref: null,
  };
  const profile = buildModelHostSuccessionRouteProfileV01(input);
  assert.equal(validateModelHostSuccessionRouteProfileV01(profile).status, "valid");
  assert.deepEqual(buildModelHostSuccessionRouteProfileV01(input), profile);
  assert.equal(profile.provider_ref, null);
  assert.equal(profile.model_ref, null);
  assert.equal(profile.authority.activation_authorized, false);
  assert.equal(profile.authority.automatic_fallback_authorized, false);
  assert.throws(
    () =>
      buildModelHostSuccessionRouteProfileV01({
        ...input,
        evidence_class: "observed_live_provider",
      }),
    /model_host_live_provider_evidence_refused/u,
  );
  const conflict = structuredClone(profile);
  conflict.capability_version = "conflicting_reseal.v0.1";
  assert.equal(
    validateModelHostSuccessionRouteProfileV01(conflict).status,
    "blocked",
  );
  return {
    suite: "model-host-succession-benchmark-v0.1",
    status: "passed",
    route_profile_id: profile.route_profile_id,
    route_profile_fingerprint: profile.integrity.fingerprint,
    live_provider_evidence_refused: true,
    zero_model_provider_calls: 0,
    operational_policy_activated: false,
  };
}
