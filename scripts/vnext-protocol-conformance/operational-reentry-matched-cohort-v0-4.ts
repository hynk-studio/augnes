import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2_V04_CANONICAL_ORDER,
  buildOperationalReentryMatchedCohortGoldenWireOutputV04,
  buildOperationalReentryMatchedCohortInvocationV04,
  buildOperationalReentryMatchedCohortRepresentativeInvocationsV04,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-4";
import {
  buildOperationalReentryMatchedCohortProviderContractV04,
  buildOperationalReentryMatchedCohortSystemPromptV04,
  operationalReentryMatchedCohortResponseSchemaV04,
  parseOperationalReentryMatchedCohortOutputV04,
  projectOperationalReentryMatchedCohortProviderMaterialV04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import {
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04 } from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

export function runOperationalReentryMatchedCohortConformanceV04() {
  const shapes =
    buildOperationalReentryMatchedCohortRepresentativeInvocationsV04();
  assert.deepEqual(shapes.map(({ arm }) => arm), ACGC_E2_V04_CANONICAL_ORDER);
  for (const { arm, invocation } of shapes) {
    const material = projectOperationalReentryMatchedCohortProviderMaterialV04(
      invocation,
    );
    assert.deepEqual(Object.keys(material).sort(), [
      "allowed_output",
      "authority_notice",
      "common_task_evidence",
      "continuation_context",
      "stale_relation",
      "task",
    ]);
    const schema = operationalReentryMatchedCohortResponseSchemaV04(material);
    assert.doesNotThrow(() => validateOpenAIStrictSchemaSupportedSubsetV01(schema));
    assert.doesNotThrow(() =>
      parseOperationalReentryMatchedCohortOutputV04(
        JSON.stringify(buildOperationalReentryMatchedCohortGoldenWireOutputV04(arm)),
        material,
      ),
    );
  }
  const left = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: "conformance-left",
    call_slot_id: "conformance-left",
    block: 0,
  });
  const right = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: "conformance-right",
    call_slot_id: "conformance-right",
    block: 3,
  });
  const leftRequest =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(left);
  const rightRequest =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(right);
  assert.deepEqual(left.provider_material, right.provider_material);
  assert.equal(leftRequest.request_body, rightRequest.request_body);
  assert.equal(leftRequest.request_fingerprint, rightRequest.request_fingerprint);
  assert.equal(leftRequest.schema_fingerprint, rightRequest.schema_fingerprint);
  assert.equal(
    leftRequest.adapter_request_route_fingerprint,
    rightRequest.adapter_request_route_fingerprint,
  );
  const providerProjectionText = JSON.stringify({
    material: projectOperationalReentryMatchedCohortProviderMaterialV04(left),
    prompt: buildOperationalReentryMatchedCohortSystemPromptV04(),
    schema: operationalReentryMatchedCohortResponseSchemaV04(
      left.provider_material,
    ),
    body: leftRequest.request_body,
  });
  for (const forbidden of [
    "local_invocation_context",
    "cohort_ref",
    "call_slot_id",
    "repeat_block",
    "provider_request_trace_id",
    "client_request_id",
    "gate_notice",
    "experiment_label",
    "comparison_label",
    "outcome_label",
  ]) {
    assert.equal(providerProjectionText.includes(forbidden), false);
  }
  const contract = buildOperationalReentryMatchedCohortProviderContractV04();
  assert.equal(contract.input_codec_version, OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05);
  assert.equal(contract.provider_contract_version, OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04);
  assert.equal(contract.response_schema_version, OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04);
  assert.equal(contract.parser_version, OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04);
  assert.equal(contract.openai_adapter_implementation_version, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06);
  assert.equal(contract.parser_closure_cardinality, OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04);
  assert.equal(contract.prepared_without_provider_egress, true);
  assert.equal(contract.local_invocation_identity_provider_visible, false);
  assert.equal(contract.transport_correlation_experimental_material, false);
  assert.equal(contract.compatibility_result, "none");
  assert.equal(contract.real_provider_calls, 0);
  assert.equal(contract.successor_live_authorizations_created, 0);
  assert.equal(contract.successor_live_authorizations_consumed, 0);
  assert.equal(contract.successor_live_probe_authorized, false);
  assert.equal(contract.behavioral_cohort_authorized, false);
  assert.equal(contract.replication_authorized, false);
  assert.equal(contract.policy_authorized, false);
  assert.equal(contract.stage_7_authorized, false);

  for (const source of [
    "lib/vnext/operational-reentry-matched-cohort-v0-4.ts",
    "lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec.ts",
  ]) {
    const text = readFileSync(path.join(process.cwd(), source), "utf8");
    assert.equal(text.includes("fetch("), false);
    assert.equal(text.includes("process.env"), false);
    assert.equal(text.includes("Authorization"), false);
    assert.equal(text.includes("chain_of_thought"), false);
  }

  return {
    status: "operational_reentry_matched_cohort_v04_conformance_passed" as const,
    shapes: 4,
    parser_closure_cardinality:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04,
    response_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.responseBytes,
    max_output_tokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens,
    final_request_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
    distinct_local_invocations_provider_body_equal: true,
    local_invocation_identity_provider_visible: false,
    transport_correlation_experimental_material: false,
    provider_contract_fingerprint: contract.integrity.fingerprint,
    adapter_request_route_fingerprint:
      leftRequest.adapter_request_route_fingerprint,
    real_provider_calls: 0,
    successor_live_authorizations_created: 0,
    successor_live_authorizations_consumed: 0,
    compatibility_result: "none" as const,
    product_database_writes: 0,
    core_writes: 0,
    policy_authorized: false,
    stage_7_started: false,
  };
}
