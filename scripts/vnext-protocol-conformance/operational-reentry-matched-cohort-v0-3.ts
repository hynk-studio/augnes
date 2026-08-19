import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2_V03_CANONICAL_ORDER,
  buildOperationalReentryMatchedCohortGoldenWireOutputV03,
  buildOperationalReentryMatchedCohortRepresentativeInputsV03,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import {
  buildOperationalReentryMatchedCohortProviderContractV03,
  operationalReentryMatchedCohortResponseSchemaV04,
  parseOperationalReentryMatchedCohortOutputV03,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import { projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03 } from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

export function runOperationalReentryMatchedCohortConformanceV03() {
  const shapes = buildOperationalReentryMatchedCohortRepresentativeInputsV03();
  assert.deepEqual(shapes.map(({ arm }) => arm), ACGC_E2_V03_CANONICAL_ORDER);
  for (const { arm, input } of shapes) {
    const schema = operationalReentryMatchedCohortResponseSchemaV04(input);
    assert.doesNotThrow(() => validateOpenAIStrictSchemaSupportedSubsetV01(schema));
    assert.equal(JSON.stringify(schema).includes("uniqueItems"), false);
    assert.doesNotThrow(() =>
      parseOperationalReentryMatchedCohortOutputV03(
        JSON.stringify(buildOperationalReentryMatchedCohortGoldenWireOutputV03(arm)),
        input,
      ),
    );
    const request = projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03(input);
    assert.equal(request.adapter_implementation_version, OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05);
    assert.equal(request.provider_contract_version, OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03);
    assert.equal(request.response_schema_version, OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04);
    assert.equal(request.parser_version, OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03);
    assert.equal(request.real_provider_calls, 0);
    assert.equal(request.successor_live_authorizations_created, 0);
    assert.equal(request.successor_live_authorizations_consumed, 0);
    assert.equal(request.compatibility_result, "none");
  }
  const contract = buildOperationalReentryMatchedCohortProviderContractV03();
  assert.equal(contract.input_codec_version, OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04);
  assert.equal(contract.parser_closed_wire_contract, true);
  assert.equal(contract.successor_live_probe_authorized, false);
  assert.equal(contract.behavioral_cohort_authorized, false);
  assert.equal(contract.replication_authorized, false);
  assert.equal(contract.policy_authorized, false);
  assert.equal(contract.stage_7_authorized, false);

  for (const source of [
    "lib/vnext/operational-reentry-matched-cohort-v0-3.ts",
    "lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec.ts",
    "lib/vnext/model-gateway/provider-response-invalid-observation.ts",
  ]) {
    const text = readFileSync(path.join(process.cwd(), source), "utf8");
    assert.equal(text.includes("fetch("), false);
    assert.equal(text.includes("process.env"), false);
    assert.equal(text.includes("Authorization"), false);
    assert.equal(text.includes("chain_of_thought"), false);
  }

  return {
    status: "operational_reentry_matched_cohort_v03_conformance_passed" as const,
    shapes: 4,
    parser_closed_wire_contract: true,
    real_provider_calls: 0,
    fake_transport_calls: 0,
    successor_live_authorizations_created: 0,
    successor_live_authorizations_consumed: 0,
    successor_compatibility_result: "none" as const,
    model_as_judge_calls: 0,
    product_database_writes: 0,
    core_writes: 0,
    policy_authorized: false,
    stage_7_started: false,
  };
}
