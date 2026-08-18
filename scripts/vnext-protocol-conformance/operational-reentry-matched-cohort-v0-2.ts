import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  operationalReentryMatchedCohortCaseFixtureV02,
  operationalReentryMatchedCohortRubricFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  buildOperationalReentryMatchedCohortCallPlanV02,
  buildOperationalReentryMatchedCohortGoldenOutputV02,
  buildOperationalReentryMatchedCohortHarnessReportV02,
  evaluateOperationalReentryMatchedCohortBlockV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import {
  buildOperationalReentryMatchedCohortProviderContractV02,
  operationalReentryMatchedCohortResponseSchemaV03,
  parseOperationalReentryMatchedCohortOutputV02,
  validateOperationalReentryMatchedCohortModelInputV02,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import {
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { validateOpenAIStrictSchemaSupportedSubsetV01 } from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";

export function runOperationalReentryMatchedCohortConformanceV02() {
  const plan = buildOperationalReentryMatchedCohortCallPlanV02();
  assert.equal(plan.planned_calls, 16);
  assert.equal(plan.calls_per_arm, 4);
  assert.equal(plan.zero_provider_egress_harness, true);
  assert.equal(
    new Set(
      plan.entries.map((entry) => entry.common_task_evidence_fingerprint),
    ).size,
    1,
  );
  assert.equal(
    plan.entries[0]!.common_task_evidence_fingerprint,
    OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
  );
  for (const entry of plan.entries) {
    assert.equal(
      validateOperationalReentryMatchedCohortModelInputV02(entry.model_input)
        .codec_version,
      OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
    );
    const schema = operationalReentryMatchedCohortResponseSchemaV03(
      entry.model_input,
    );
    assert.doesNotThrow(() =>
      validateOpenAIStrictSchemaSupportedSubsetV01(schema),
    );
    assert.equal(JSON.stringify(schema).includes("uniqueItems"), false);
  }
  const observed = plan.entries
    .filter((entry) => entry.repeat_block === 0)
    .map((entry) => ({
      arm: entry.arm,
      call_slot_id: entry.call_slot_id,
      model_input: entry.model_input,
      normalized_output: parseOperationalReentryMatchedCohortOutputV02(
        JSON.stringify(
          buildOperationalReentryMatchedCohortGoldenOutputV02(entry.arm),
        ),
        entry.model_input,
      ),
    }));
  const block = evaluateOperationalReentryMatchedCohortBlockV02(0, observed);
  assert.equal(block.status, "complete");
  assert.deepEqual(block.universal_common_hard_failure_dimensions, []);
  assert.equal(block.clean_control_admission.arm_b_invariant_hard_failures, 0);
  assert.equal(block.clean_control_admission.arm_d_invariant_hard_failures, 0);
  assert.equal(block.clean_control_admission.protocol_validation_only, true);
  assert.equal(block.clean_control_admission.behavioral_evidence_created, false);
  const report = buildOperationalReentryMatchedCohortHarnessReportV02({
    blocks: ([0, 1, 2, 3] as const).map((repeatBlock) =>
      evaluateOperationalReentryMatchedCohortBlockV02(
        repeatBlock,
        plan.entries
          .filter((entry) => entry.repeat_block === repeatBlock)
          .map((entry) => ({
            arm: entry.arm,
            call_slot_id: entry.call_slot_id,
            model_input: entry.model_input,
            normalized_output:
              parseOperationalReentryMatchedCohortOutputV02(
                JSON.stringify(
                  buildOperationalReentryMatchedCohortGoldenOutputV02(
                    entry.arm,
                  ),
                ),
                entry.model_input,
              ),
          })),
      ),
    ),
  });
  assert.equal(report.completion_status, "complete");
  assert.equal(report.target_invariant_compliance.evaluated_arm_rows, 16);
  assert.equal(
    report.target_invariant_compliance.all_evaluated_arms_valid,
    true,
  );
  assert.deepEqual(
    report.target_invariant_compliance.universal_hard_failure_dimensions,
    [],
  );
  assert.equal(report.clean_control_admission.arm_a_hard_failures, 0);
  assert.equal(report.clean_control_admission.arm_b_hard_failures, 0);
  assert.equal(report.clean_control_admission.arm_c_hard_failures, 0);
  assert.equal(report.clean_control_admission.arm_d_hard_failures, 0);
  assert.equal(
    report.bounded_outcome_quality.general_benefit_or_harm,
    "not_established",
  );
  const request =
    projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02(
      plan.entries[0]!.model_input,
    );
  assert.equal(request.real_provider_calls, 0);
  assert.equal(request.compatibility_established, false);
  assert.equal(
    request.adapter_implementation_version,
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
  );
  const contract = buildOperationalReentryMatchedCohortProviderContractV02();
  assert.equal(
    contract.provider_contract_version,
    OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
  );
  assert.equal(contract.issue_193_v01_result_is_v02_compatibility, false);
  assert.equal(
    contract.separately_authorized_v02_compatibility_probe_required,
    true,
  );
  assert.equal(contract.real_provider_calls, 0);
  assert.equal(
    operationalReentryMatchedCohortCaseFixtureV02.source_material,
    "synthetic_public_safe",
  );
  assert.equal(
    operationalReentryMatchedCohortRubricFixtureV02.provider_visible,
    false,
  );

  const core = sourceV02(
    "lib/vnext/operational-reentry-matched-cohort-v0-2.ts",
  );
  const codec = sourceV02(
    "lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec.ts",
  );
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.equal(codec.includes("fetch("), false);
  assert.equal(codec.includes("process.env"), false);
  assert.equal(codec.includes("Authorization"), false);
  assert.equal(codec.includes("chain_of_thought"), false);
  assert.equal(codec.includes("uniqueItems"), false);

  return {
    status:
      "operational_reentry_matched_cohort_v02_conformance_passed" as const,
    planned_calls: 16,
    common_task_evidence_fingerprint:
      OPERATIONAL_REENTRY_MATCHED_COHORT_COMMON_TASK_EVIDENCE_FINGERPRINT_V02,
    report_fingerprint: report.integrity.fingerprint,
    clean_control_b_hard_failures: 0,
    clean_control_d_hard_failures: 0,
    universal_common_hard_failure_dimensions: [],
    issue_193_establishes_v02_compatibility: false,
    compatibility_probe_authorized: false,
    live_cohort_authorized: false,
    provider_calls: 0,
    model_as_judge_calls: 0,
    product_database_writes: 0,
    core_writes: 0,
    policy_authorized: false,
    stage_7_started: false,
  };
}

function sourceV02(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
