import assert from "node:assert/strict";

import { ModelInvocationReceiptSchema } from "../src/lib/state-runtime-types.js";

export function assertAppsModelInvocationReceiptSemanticMatrix(input: unknown) {
  const liveSuccess = ModelInvocationReceiptSchema.parse(input);
  const deterministicSuccess = structuredClone(liveSuccess);
  Object.assign(deterministicSuccess, {
    attempted_implementation_id: null,
    attempted_implementation_version: null,
    attempted_provider_ref: null,
    attempted_model_ref: null,
    final_implementation_id: "deterministic.observe",
    final_implementation_version: "deterministic_observe.v0.1",
    requested_mode: "deterministic",
    execution_mode: "deterministic",
    selection_reason: "explicit_deterministic",
    status: "completed",
    outcome: "deterministic_success",
    egress_attempted: false,
    egress_status: "did_not_occur",
    usage: null,
    failure_code: null,
    privacy_decision: "provider_egress_not_used",
    fallback_used: false,
    trust_class: "direct_local_observation",
  });
  Object.assign(deterministicSuccess.budget, {
    decision: "not_used",
    input_bytes_used: null,
    output_tokens_used: null,
    provider_call_limit: 0,
    provider_calls_used: 0,
    timeout_disposition: "completed_within_deadline",
  });

  const providerUnavailable = structuredClone(deterministicSuccess);
  Object.assign(providerUnavailable, {
    attempted_implementation_id: liveSuccess.attempted_implementation_id,
    attempted_implementation_version:
      liveSuccess.attempted_implementation_version,
    requested_mode: "live",
    selection_reason: "provider_unavailable",
  });
  providerUnavailable.budget.provider_call_limit = 1;

  const fallbackSuccess = structuredClone(liveSuccess);
  Object.assign(fallbackSuccess, {
    final_implementation_id: "deterministic.temporal",
    final_implementation_version: "deterministic_temporal.v0.1",
    execution_mode: "deterministic",
    selection_reason: "provider_failure_fallback",
    outcome: "deterministic_fallback_success",
    usage: null,
    failure_code: "model_gateway_provider_rejected",
    fallback_used: true,
    trust_class: "mixed",
  });
  fallbackSuccess.budget.output_tokens_used = null;

  const blockedRefusal = structuredClone(liveSuccess);
  Object.assign(blockedRefusal, {
    status: "blocked",
    outcome: "refused",
    egress_attempted: false,
    egress_status: "blocked",
    usage: null,
    failure_code: "model_gateway_budget_refused",
    privacy_decision: "provider_egress_blocked",
    trust_class: "direct_local_observation",
  });
  Object.assign(blockedRefusal.budget, {
    decision: "refused",
    output_tokens_used: null,
    provider_calls_used: 0,
  });

  const providerFailure = structuredClone(liveSuccess);
  Object.assign(providerFailure, {
    status: "failed",
    outcome: "provider_failure",
    usage: null,
    failure_code: "model_gateway_provider_rejected",
    trust_class: "direct_local_observation",
  });
  providerFailure.budget.output_tokens_used = null;

  const deterministicFailure = structuredClone(deterministicSuccess);
  Object.assign(deterministicFailure, {
    status: "failed",
    outcome: "deterministic_failure",
    failure_code: "model_gateway_deterministic_failed",
  });

  const timeout = structuredClone(liveSuccess);
  Object.assign(timeout, {
    attempted_provider_ref: null,
    attempted_model_ref: null,
    status: "timed_out",
    outcome: "timeout",
    egress_attempted: false,
    egress_status: "did_not_occur",
    usage: null,
    failure_code: "model_gateway_timeout",
    privacy_decision: "provider_egress_not_used",
    trust_class: "direct_local_observation",
  });
  Object.assign(timeout.budget, {
    decision: "not_used",
    input_bytes_used: null,
    output_tokens_used: null,
    provider_calls_used: 0,
    timeout_disposition: "timed_out",
  });

  const cancelled = structuredClone(timeout);
  Object.assign(cancelled, {
    status: "cancelled",
    outcome: "cancelled",
    failure_code: "model_gateway_cancelled",
    cancellation_disposition: "cancelled",
  });
  cancelled.budget.timeout_disposition = "cancelled";

  const fixtures = {
    live_success: liveSuccess,
    deterministic_success: deterministicSuccess,
    provider_unavailable: providerUnavailable,
    fallback_success: fallbackSuccess,
    blocked_refusal: blockedRefusal,
    provider_failure: providerFailure,
    deterministic_failure: deterministicFailure,
    timeout,
    cancelled,
  };
  for (const [name, receipt] of Object.entries(fixtures)) {
    assert.deepEqual(
      ModelInvocationReceiptSchema.parse(receipt),
      receipt,
      `${name} should be a valid Apps semantic receipt baseline`,
    );
  }

  const providerFailureBeforeEgress = structuredClone(providerFailure);
  Object.assign(providerFailureBeforeEgress, {
    attempted_provider_ref: null,
    attempted_model_ref: null,
    egress_attempted: false,
    egress_status: "did_not_occur",
    privacy_decision: "provider_egress_not_used",
  });
  Object.assign(providerFailureBeforeEgress.budget, {
    decision: "not_used",
    input_bytes_used: null,
    provider_calls_used: 0,
  });
  ModelInvocationReceiptSchema.parse(providerFailureBeforeEgress);

  const refusalAfterEgress = structuredClone(blockedRefusal);
  Object.assign(refusalAfterEgress, {
    egress_attempted: true,
    egress_status: "occurred",
    privacy_decision: "provider_egress_approved",
  });
  refusalAfterEgress.budget.provider_calls_used = 1;
  ModelInvocationReceiptSchema.parse(refusalAfterEgress);

  const fallbackDeterministicFailure = structuredClone(fallbackSuccess);
  Object.assign(fallbackDeterministicFailure, {
    status: "failed",
    outcome: "deterministic_failure",
    failure_code: "model_gateway_deterministic_failed",
  });
  ModelInvocationReceiptSchema.parse(fallbackDeterministicFailure);

  const liveWithoutUsage = structuredClone(liveSuccess);
  liveWithoutUsage.usage = null;
  liveWithoutUsage.budget.output_tokens_used = null;
  ModelInvocationReceiptSchema.parse(liveWithoutUsage);

  type FixtureName = keyof typeof fixtures;
  const cases: Array<{
    name: string;
    fixture: FixtureName;
    path: string;
    value: unknown;
  }> = [
    { name: "completed provider failure outcome", fixture: "live_success", path: "outcome", value: "provider_failure" },
    { name: "failed live success outcome", fixture: "provider_failure", path: "outcome", value: "live_success" },
    { name: "completed nonfallback failure code", fixture: "live_success", path: "failure_code", value: "model_gateway_transport_failed" },
    { name: "blocked missing failure code", fixture: "blocked_refusal", path: "failure_code", value: null },
    { name: "failed missing failure code", fixture: "provider_failure", path: "failure_code", value: null },
    { name: "timeout missing failure code", fixture: "timeout", path: "failure_code", value: null },
    { name: "cancelled missing failure code", fixture: "cancelled", path: "failure_code", value: null },
    { name: "live success deterministic request", fixture: "live_success", path: "requested_mode", value: "deterministic" },
    { name: "live success deterministic execution", fixture: "live_success", path: "execution_mode", value: "deterministic" },
    { name: "live success provider unavailable selection", fixture: "live_success", path: "selection_reason", value: "provider_unavailable" },
    { name: "live success fallback flag", fixture: "live_success", path: "fallback_used", value: true },
    { name: "live success no attempted implementation", fixture: "live_success", path: "attempted_implementation_id", value: null },
    { name: "live success no provider ref", fixture: "live_success", path: "attempted_provider_ref", value: null },
    { name: "live success no egress attempt", fixture: "live_success", path: "egress_attempted", value: false },
    { name: "live success zero provider calls", fixture: "live_success", path: "budget.provider_calls_used", value: 0 },
    { name: "live success local trust", fixture: "live_success", path: "trust_class", value: "direct_local_observation" },
    { name: "explicit deterministic attempted implementation", fixture: "deterministic_success", path: "attempted_implementation_id", value: "openai_responses.adapter" },
    { name: "explicit deterministic provider ref", fixture: "deterministic_success", path: "attempted_provider_ref", value: liveSuccess.attempted_provider_ref },
    { name: "explicit deterministic egress", fixture: "deterministic_success", path: "egress_attempted", value: true },
    { name: "explicit deterministic provider usage", fixture: "deterministic_success", path: "usage", value: liveSuccess.usage },
    { name: "explicit deterministic provider trust", fixture: "deterministic_success", path: "trust_class", value: "provider_report" },
    { name: "provider unavailable deterministic request", fixture: "provider_unavailable", path: "requested_mode", value: "deterministic" },
    { name: "provider unavailable missing adapter", fixture: "provider_unavailable", path: "attempted_implementation_id", value: null },
    { name: "provider unavailable provider ref", fixture: "provider_unavailable", path: "attempted_provider_ref", value: liveSuccess.attempted_provider_ref },
    { name: "provider unavailable occurred egress", fixture: "provider_unavailable", path: "egress_status", value: "occurred" },
    { name: "fallback flag absent", fixture: "fallback_success", path: "fallback_used", value: false },
    { name: "fallback wrong selection", fixture: "fallback_success", path: "selection_reason", value: "requested_live" },
    { name: "fallback deterministic request", fixture: "fallback_success", path: "requested_mode", value: "deterministic" },
    { name: "fallback live execution", fixture: "fallback_success", path: "execution_mode", value: "live" },
    { name: "fallback zero calls", fixture: "fallback_success", path: "budget.provider_calls_used", value: 0 },
    { name: "fallback no occurred egress", fixture: "fallback_success", path: "egress_status", value: "did_not_occur" },
    { name: "fallback ineligible failure", fixture: "fallback_success", path: "failure_code", value: "model_gateway_budget_refused" },
    { name: "fallback local trust", fixture: "fallback_success", path: "trust_class", value: "direct_local_observation" },
    { name: "provider failure completed", fixture: "provider_failure", path: "status", value: "completed" },
    { name: "provider failure wrong selection", fixture: "provider_failure", path: "selection_reason", value: "provider_unavailable" },
    { name: "provider failure refusal code", fixture: "provider_failure", path: "failure_code", value: "model_gateway_budget_refused" },
    { name: "provider failure usage", fixture: "provider_failure", path: "usage", value: liveSuccess.usage },
    { name: "deterministic failure completed", fixture: "deterministic_failure", path: "status", value: "completed" },
    { name: "deterministic failure provider code", fixture: "deterministic_failure", path: "failure_code", value: "model_gateway_transport_failed" },
    { name: "refusal failed status", fixture: "blocked_refusal", path: "status", value: "failed" },
    { name: "refusal provider failure code", fixture: "blocked_refusal", path: "failure_code", value: "model_gateway_transport_failed" },
    { name: "refusal nonrefused budget", fixture: "blocked_refusal", path: "budget.decision", value: "not_used" },
    { name: "refusal did not occur egress", fixture: "blocked_refusal", path: "egress_status", value: "did_not_occur" },
    { name: "timeout failed status", fixture: "timeout", path: "status", value: "failed" },
    { name: "timeout transport failure code", fixture: "timeout", path: "failure_code", value: "model_gateway_transport_failed" },
    { name: "timeout completed disposition", fixture: "timeout", path: "budget.timeout_disposition", value: "completed_within_deadline" },
    { name: "timeout cancellation disposition", fixture: "timeout", path: "cancellation_disposition", value: "cancelled" },
    { name: "cancelled failed status", fixture: "cancelled", path: "status", value: "failed" },
    { name: "cancelled timeout failure code", fixture: "cancelled", path: "failure_code", value: "model_gateway_timeout" },
    { name: "cancelled timed out disposition", fixture: "cancelled", path: "budget.timeout_disposition", value: "timed_out" },
    { name: "cancelled not cancelled", fixture: "cancelled", path: "cancellation_disposition", value: "not_cancelled" },
    { name: "occurred egress wrong privacy", fixture: "live_success", path: "privacy_decision", value: "provider_egress_not_used" },
    { name: "blocked egress wrong privacy", fixture: "blocked_refusal", path: "privacy_decision", value: "provider_egress_not_used" },
    { name: "unused egress wrong privacy", fixture: "deterministic_success", path: "privacy_decision", value: "provider_egress_approved" },
    { name: "usage output mismatch", fixture: "live_success", path: "budget.output_tokens_used", value: 1 },
    { name: "success refused budget", fixture: "live_success", path: "budget.decision", value: "refused" },
  ];

  for (const testCase of cases) {
    const contradictory = structuredClone(fixtures[testCase.fixture]);
    setReceiptPath(contradictory, testCase.path, testCase.value);
    assert.throws(
      () => ModelInvocationReceiptSchema.parse(contradictory),
      `${testCase.name} should be rejected by the strict Apps receipt mirror`,
    );
  }
  return cases.length;
}

function setReceiptPath(value: unknown, path: string, replacement: unknown) {
  const segments = path.split(".");
  let cursor = value as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[segments.at(-1)!] = structuredClone(replacement);
}
