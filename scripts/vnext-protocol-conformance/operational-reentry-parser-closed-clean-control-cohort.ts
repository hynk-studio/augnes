import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01,
  ACGC_E2R2P5H_CASE_FINGERPRINT_V01,
  ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01,
  ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01,
  ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01,
  buildOperationalReentryParserClosedCleanControlCohortPlanV01,
  buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01,
  operationalReentryParserClosedCleanControlCohortHarnessV01,
} from "@/lib/vnext/operational-reentry-parser-closed-clean-control-cohort";
import { MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_INDEX_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_REPORT_VERSION_V01,
  OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
} from "@/types/vnext/operational-reentry-parser-closed-clean-control-cohort";

const EXPECTED_PLAN_FINGERPRINT_V01 =
  "sha256:c5d11a023b3d442bebbc68231e47a3025ba76741a985718dfd7896f46ede0bcb";
const EXPECTED_EVALUATOR_BRIDGE_FINGERPRINT_V01 =
  "sha256:c36707f62d37881cbaf8a94382c478efee7d5061aa8a75b23b2720887277b4b8";

export function runOperationalReentryParserClosedCleanControlCohortConformanceV01() {
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_VERSION_V01,
    "operational_reentry_parser_closed_clean_control_matched_cohort.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_AUTHORIZATION_VERSION_V01,
    "operational_reentry_parser_closed_clean_control_matched_cohort_authorization.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_PLAN_VERSION_V01,
    "operational_reentry_parser_closed_clean_control_matched_cohort_plan.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_MANIFEST_VERSION_V01,
    "operational_reentry_parser_closed_clean_control_matched_cohort_manifest.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_REPORT_VERSION_V01,
    "operational_reentry_parser_closed_clean_control_matched_cohort_report.v0.1",
  );
  assert.equal(
    OPERATIONAL_REENTRY_PARSER_CLOSED_CLEAN_CONTROL_COHORT_ARTIFACT_INDEX_VERSION_V01,
    "operational_reentry_parser_closed_clean_control_matched_cohort_artifact_index.v0.1",
  );
  const plan = buildOperationalReentryParserClosedCleanControlCohortPlanV01();
  const bridge = buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01();
  assert.equal(plan.integrity.fingerprint, EXPECTED_PLAN_FINGERPRINT_V01);
  assert.equal(
    bridge.integrity.fingerprint,
    EXPECTED_EVALUATOR_BRIDGE_FINGERPRINT_V01,
  );
  assert.equal(plan.entries.length, 16);
  assert.deepEqual(plan.entries.map((entry) => entry.arm), [
    "A", "B", "D", "C",
    "B", "C", "A", "D",
    "C", "D", "B", "A",
    "D", "A", "C", "B",
  ]);
  assert.equal(plan.case_fingerprint, ACGC_E2R2P5H_CASE_FINGERPRINT_V01);
  assert.equal(
    plan.common_task_evidence_fingerprint,
    ACGC_E2R2P5H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
  );
  assert.equal(plan.entries[0]!.adapter_request_route_fingerprint, ACGC_E2R2P5H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01);
  assert.equal(MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01.at(-1), "parser_closed_clean_control_cohort");
  assert.equal(ACGC_E2R2P5H_ROUTE_FINGERPRINT_V01, "sha256:4d286f56405ff66236a19d1e0f4529510faa8c53a80e6bba4ecac9c4845930e0");
  assert.equal(ACGC_E2R2P5H_PROVIDER_CONTRACT_FINGERPRINT_V01, "sha256:682905683f083ee67002dc4cf2577ec3ae4302e90fc85e27f43019b8b7978bbb");
  assert.equal(ACGC_E2R2P5H_PER_CALL_WORST_CASE_NANO_USD_V01, 11_699_200);
  assert.equal(ACGC_E2R2P5H_AGGREGATE_WORST_CASE_NANO_USD_V01, 187_187_200);
  assert.equal(ACGC_E2R2P5H_DEFAULT_AUTHORIZATION_CEILING_NANO_USD_V01, 1_000_000_000);
  assert.equal(operationalReentryParserClosedCleanControlCohortHarnessV01.real_provider_calls, 0);
  assert.equal(operationalReentryParserClosedCleanControlCohortHarnessV01.behavioral_cohort_result, "none");
  assert.equal(operationalReentryParserClosedCleanControlCohortHarnessV01.behavioral_cohort_executed, false);

  const core = sourceV01("lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts");
  const types = sourceV01("types/vnext/operational-reentry-parser-closed-clean-control-cohort.ts");
  const artifacts = sourceV01("lib/vnext/operational-reentry-parser-closed-clean-control-cohort-artifact-store.ts");
  const cli = sourceV01("scripts/operational-reentry-parser-closed-clean-control-cohort.ts");
  assert.ok(core.includes("buildOperationalReentryMatchedCohortModelInputV03"));
  assert.ok(core.includes("invokeOperationalReentryMatchedCohortModelGatewayV03"));
  assert.ok(core.includes("evaluateOperationalReentryMatchedCohortBlockV02"));
  assert.equal(core.includes("fetch("), false);
  assert.equal(core.includes("process.env"), false);
  assert.ok(core.includes("prepared.pricing.input_nano_usd_per_token"));
  assert.ok(core.includes("prepared.pricing.cached_input_nano_usd_per_token"));
  assert.ok(core.includes("prepared.pricing.output_nano_usd_per_token"));
  assert.equal(
    core.includes("gateway_cost_budget.authority.input_rate.cost_per_unit"),
    false,
  );
  assert.ok(types.includes("behavioral_cohort_authorized: true"));
  assert.ok(types.includes("missing_exact_usage_or_cost: \"unknown_never_zero\""));
  assert.ok(artifacts.includes(".augnes-lab/operational-reentry-parser-closed-clean-control-cohorts/"));
  assert.ok(artifacts.includes('openSync(target, "wx"'));
  assert.ok(artifacts.includes("authorization_consumption_history_incomplete"));
  assert.ok(cli.includes("--authorization-file"));
  assert.ok(cli.includes("--confirm-parser-closed-clean-control-cohort"));
  assert.equal(
    cli.includes(
      "buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01",
    ),
    false,
  );

  return {
    status:
      "operational_reentry_parser_closed_clean_control_cohort_conformance_passed" as const,
    plan_fingerprint: EXPECTED_PLAN_FINGERPRINT_V01,
    evaluator_bridge_fingerprint: EXPECTED_EVALUATOR_BRIDGE_FINGERPRINT_V01,
    planned_calls: 16,
    repeat_blocks: 4,
    fake_transport_calls: 0,
    real_provider_calls: 0,
    successor_live_authorizations_created: 0,
    successor_live_authorizations_consumed: 0,
    behavioral_cohort_result: "none" as const,
    stage_7_started: false,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
