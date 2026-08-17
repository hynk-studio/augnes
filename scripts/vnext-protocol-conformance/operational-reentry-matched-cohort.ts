import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  ACGC_E2_SEALED_ORDER_V01,
  buildOperationalReentryMatchedCohortCallPlanV01,
  buildOperationalReentryMatchedCohortReplacementLineageV02,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  operationalReentryMatchedCohortResponseSchemaV01,
  operationalReentryMatchedCohortResponseSchemaV02,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  OpenAIStrictSchemaSupportedSubsetErrorV01,
  validateOpenAIStrictSchemaSupportedSubsetV01,
} from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03 } from "@/types/vnext/operational-reentry-matched-cohort";

export function runOperationalReentryMatchedCohortConformanceV01() {
  const plan = buildOperationalReentryMatchedCohortCallPlanV01();
  assert.equal(plan.planned_calls, 16);
  assert.equal(plan.entries.length, 16);
  assert.deepEqual(plan.sealed_order, ACGC_E2_SEALED_ORDER_V01);
  assert.equal(plan.max_parallel_provider_calls, 1);
  assert.equal(plan.retries, 0);
  assert.equal(plan.replacement_calls, 0);
  assert.equal(plan.adaptive_stopping, false);
  assert.equal(plan.stateless_invocations, true);
  assert.equal(plan.conversation_reuse, false);
  assert.equal(plan.thread_reuse, false);
  assert.equal(plan.previous_response_reuse, false);
  assert.equal(operationalReentryMatchedCohortCaseFixtureV01.source_material, "synthetic_public_safe");
  assert.equal(operationalReentryMatchedCohortRubricFixtureV01.evaluator_only, true);
  assert.equal(operationalReentryMatchedCohortRubricFixtureV01.provider_visible, false);
  assert.equal(operationalReentryMatchedCohortRubricFixtureV01.model_as_judge_calls, 0);
  for (const entry of plan.entries) {
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(
        operationalReentryMatchedCohortResponseSchemaV02(entry.model_input),
      ),
    );
  }
  assert.throws(
    () =>
      validateOpenAIStrictSchemaSupportedSubsetV01(
        operationalReentryMatchedCohortResponseSchemaV01(
          plan.entries[0]!.model_input,
        ),
      ),
    (error: unknown) =>
      error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01 &&
      error.code === "openai_strict_schema_unsupported_keyword",
  );
  assert.equal(
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    "gpt-4.1-mini-2025-04-14",
  );
  assert.equal(
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.3",
  );
  assert.equal(
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    "operational_reentry_matched_cohort_provider_contract.v0.3",
  );
  const requestFamilyFingerprint = `sha256:${"c".repeat(64)}`;
  const requestTrace = createDeterministicModelProviderRequestTraceV01({
    request_family_kind: "cohort_attempt",
    request_family_fingerprint: requestFamilyFingerprint,
  });
  const clientRequestIds = plan.entries.map((entry) =>
    createDeterministicModelClientRequestIdV01({
      purpose: "operational_reentry_matched_cohort",
      provider_request_trace_id: requestTrace,
      call_slot_id: entry.call_slot_id,
      model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    }),
  );
  assert.equal(new Set(clientRequestIds).size, 16);
  const replacementLineage =
    buildOperationalReentryMatchedCohortReplacementLineageV02();
  assert.equal(replacementLineage.retry_of_historical_cohort, false);
  assert.equal(replacementLineage.historical_artifacts_rewritten, false);
  assert.equal(replacementLineage.replacement_authorization_granted, false);
  assert.equal(replacementLineage.replacement_authorization_consumed, false);

  const core = sourceV01("lib/vnext/operational-reentry-matched-cohort.ts");
  const types = sourceV01("types/vnext/operational-reentry-matched-cohort.ts");
  const codec = sourceV01(
    "lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec.ts",
  );
  const runner = sourceV01("scripts/operational-reentry-matched-cohort.ts");
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.equal(types.includes("GovernedActorLab"), false);
  assert.equal(codec.includes("chain_of_thought"), false);
  assert.ok(codec.includes("additionalProperties: false"));
  assert.ok(codec.includes("withheld_stale"));
  assert.ok(codec.includes("stale_persisted"));
  assert.ok(runner.includes("--confirm-authorized-cohort"));
  assert.ok(runner.includes("--authorization-issue"));
  assert.ok(runner.includes("--max-total-cost-usd"));
  assert.equal(runner.includes("previous_response_id"), false);
  return {
    status: "operational_reentry_matched_cohort_conformance_passed" as const,
    planned_calls: 16,
    repeat_blocks: 4,
    provider_calls: 0,
    model_as_judge_calls: 0,
    retries: 0,
    replacement_calls: 0,
    replacement_authorization_granted: false,
    historical_artifacts_rewritten: false,
    product_database_writes: 0,
    core_writes: 0,
    stage_7_started: false,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
