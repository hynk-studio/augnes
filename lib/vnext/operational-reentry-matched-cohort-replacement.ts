import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  buildOperationalReentryMatchedCohortCallPlanV01,
  buildOperationalReentryMatchedCohortCallTerminalV01,
  buildOperationalReentryMatchedCohortPricingV01,
  classifyOperationalReentryMatchedCohortTerminalV01,
  deriveOperationalReentryMatchedCohortExactCaseDispositionsV01,
  deriveOperationalReentryMatchedCohortRepeatabilityV01,
  evaluateOperationalReentryMatchedCohortBlockV01,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  validateOperationalReentryProviderCompatibilityProbeArtifactsV01,
  type OperationalReentryProviderCompatibilityProbeArtifactSummaryV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import {
  buildOperationalReentryProviderCompatibilityProbeProviderContractV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe";
import {
  assertModelGatewayCostBudgetCurrentV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  ModelGatewayInvocationErrorV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  invokeOperationalReentryMatchedCohortModelGatewayV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryMatchedCohortModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryMatchedCohortArmV01,
  OperationalReentryMatchedCohortBlockEvaluationV01,
  OperationalReentryMatchedCohortBlockV01,
  OperationalReentryMatchedCohortCallPlanV01,
  OperationalReentryMatchedCohortCallTerminalV01,
  OperationalReentryMatchedCohortIntegrityV01,
  OperationalReentryMatchedCohortPairwiseRelationV01,
  OperationalReentryMatchedCohortRouteV01,
  OperationalReentryMatchedCohortTerminalCategoryV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_PRICING_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_REPORT_VERSION_V01,
  type OperationalReentryMatchedCohortReplacementAuthorizationV01,
  type OperationalReentryMatchedCohortReplacementCompatibilityGateV01,
  type OperationalReentryMatchedCohortReplacementExecutionResultV01,
  type OperationalReentryMatchedCohortReplacementHarnessV01,
  type OperationalReentryMatchedCohortReplacementLineageV01,
  type OperationalReentryMatchedCohortReplacementPreparedV01,
  type OperationalReentryMatchedCohortReplacementPricingV01,
  type OperationalReentryMatchedCohortReplacementReportV01,
} from "@/types/vnext/operational-reentry-matched-cohort-replacement";

export const ACGC_E2R1H_ISSUE_NUMBER_V01 = 197 as const;
export const ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01 =
  250_000_000 as const;
export const ACGC_E2R1_HISTORICAL_HEAD_V01 =
  "123c5e31708a35c68be73b332d595bed9a9eea94" as const;
export const ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01 =
  "838ea69ab61046706ba84643d864c59f4886d688" as const;
export const ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01 =
  "sha256:1ef3f21894272f390fcdacce80226383ae6d921c43712c3736a18843a8b08eb2" as const;
export const ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01 =
  "sha256:19bc10cb3f9cbd6d2a0fb2b4df9fca6728c4bb4e571255e52f3c2d0fd7a6bd76" as const;
export const ACGC_E2R1_REPLACEMENT_ARTIFACT_NAMESPACE_V01 =
  ".augnes-lab/operational-reentry-matched-cohort-replacements/" as const;

const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const SAFE_AUTHORIZATION_ID_V01 = /^[A-Za-z0-9._:-]{1,160}$/u;
const PROBE_NAMESPACE_V01 =
  ".augnes-lab/operational-reentry-provider-probes/" as const;
const PAIRS_V01 = Object.freeze([
  ["A", "B"],
  ["C", "A"],
  ["A", "D"],
  ["B", "D"],
  ["C", "D"],
] as const);

export class OperationalReentryMatchedCohortReplacementErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryMatchedCohortReplacementErrorV01";
  }
}

export interface BuildOperationalReentryMatchedCohortReplacementInputV01 {
  authorization: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV01;
  compatibility_gate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01;
  evaluated_at: string;
}

export interface RunOperationalReentryMatchedCohortReplacementDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV01;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV01;
  cancellation_signal?: AbortSignal;
  assert_source_unchanged: (
    entry: OperationalReentryMatchedCohortCallPlanV01["entries"][number],
  ) => void | Promise<void>;
  on_attempt_prepared?: (
    prepared: OperationalReentryMatchedCohortReplacementPreparedV01,
  ) => void | Promise<void>;
  on_first_egress_attempt: (input: {
    authorization_fingerprint: string;
    replacement_cohort_id: string;
  }) => void;
  on_call_terminal?: (
    call: OperationalReentryMatchedCohortCallTerminalV01,
  ) => void | Promise<void>;
  on_block_evaluation?: (
    block: OperationalReentryMatchedCohortBlockEvaluationV01,
  ) => void | Promise<void>;
}

export function buildOperationalReentryMatchedCohortReplacementHarnessV01(): OperationalReentryMatchedCohortReplacementHarnessV01 {
  const lineage = buildOperationalReentryMatchedCohortReplacementLineageV01();
  const callPlan = buildOperationalReentryMatchedCohortCallPlanV01();
  return sealV01("replacement_harness_without_integrity_fingerprint", {
    harness_version:
      "operational_reentry_matched_cohort_replacement_harness.v0.1" as const,
    issue_number: ACGC_E2R1H_ISSUE_NUMBER_V01,
    zero_provider_egress: true as const,
    replacement_authorizations_created: 0 as const,
    replacement_authorizations_consumed: 0 as const,
    replacement_provider_calls: 0 as const,
    behavioral_result_exists: false as const,
    lineage,
    case_fingerprint:
      operationalReentryMatchedCohortCaseFixtureV01.integrity.fingerprint,
    rubric_fingerprint:
      operationalReentryMatchedCohortRubricFixtureV01.integrity.fingerprint,
    call_plan_fingerprint: callPlan.integrity.fingerprint,
    planned_calls: 16 as const,
  });
}

export function buildOperationalReentryMatchedCohortReplacementLineageV01(): OperationalReentryMatchedCohortReplacementLineageV01 {
  return sealV01("replacement_lineage_without_integrity_fingerprint", {
    lineage_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V01,
    authorization_kind:
      "authorized_replacement_after_historical_incomplete" as const,
    request_family_kind: "replacement_cohort" as const,
    historical_issue: 185 as const,
    historical_pr: 186 as const,
    historical_source_head: ACGC_E2R1_HISTORICAL_HEAD_V01,
    historical_result: "terminal_incomplete" as const,
    historical_authorization_consumed: true as const,
    historical_rejection_cause: "unclassified" as const,
    compatibility_probe_issue: 193 as const,
    compatibility_source_head: ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
    compatibility_probe_result: "accepted_all_shapes" as const,
    compatibility_report_fingerprint:
      ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
    compatibility_artifact_index_fingerprint:
      ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
    replacement_count: 1 as const,
    retry_of_historical_cohort: false as const,
    historical_artifacts_rewritten: false as const,
    further_cohort_authorized: false as const,
    second_replacement_authorized: false as const,
    stage_7_authorized: false as const,
  });
}

export function readOperationalReentryMatchedCohortReplacementCompatibilityGateV01(
  input: { repository_root: string; probe_run_root: string },
  dependencies: {
    realpath?: (value: string) => string;
    read_text?: (value: string) => string;
    validate_artifacts?: (input: {
      repository_root: string;
      run_root: string;
    }) => OperationalReentryProviderCompatibilityProbeArtifactSummaryV01;
    fingerprint_text?: (value: string) => string;
  } = {},
): OperationalReentryMatchedCohortReplacementCompatibilityGateV01 {
  const resolveRealpath = dependencies.realpath ?? realpathSync;
  const readText = dependencies.read_text ?? ((value: string) =>
    readFileSync(value, "utf8"));
  const validateArtifacts = dependencies.validate_artifacts ??
    validateOperationalReentryProviderCompatibilityProbeArtifactsV01;
  const fingerprintText = dependencies.fingerprint_text ??
    createProtocolSha256V01;
  const repositoryRoot = resolveRealpath(input.repository_root);
  const probeRunRoot = resolveRealpath(input.probe_run_root);
  const relativeRunRoot = path
    .relative(repositoryRoot, probeRunRoot)
    .split(path.sep)
    .join("/");
  if (
    relativeRunRoot.startsWith("../") ||
    path.isAbsolute(relativeRunRoot) ||
    !relativeRunRoot.startsWith(PROBE_NAMESPACE_V01) ||
    !relativeRunRoot.endsWith("/issue-193") ||
    relativeRunRoot.toLowerCase().includes("replacement")
  ) {
    failV01("operational_reentry_replacement_compatibility_root_invalid");
  }
  const validated = validateArtifacts({
      repository_root: repositoryRoot,
      run_root: probeRunRoot,
    });
  const indexText = readText(
    path.join(probeRunRoot, "artifact-index.json"),
  ).trimEnd();
  const index = JSON.parse(indexText) as Record<string, unknown>;
  const report = JSON.parse(
    readText(path.join(probeRunRoot, "report.json")),
  ) as Record<string, unknown>;
  const authorization = JSON.parse(
    readText(path.join(probeRunRoot, "authorization.json")),
  ) as Record<string, unknown>;
  const counts = report.terminal_category_counts as
    | Record<string, unknown>
    | undefined;
  if (
    validated.relative_run_root !== relativeRunRoot ||
    validated.outcome !== "accepted_all_shapes" ||
    validated.authorization_consumed !== true ||
    validated.report_fingerprint !==
      ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01 ||
    validated.artifact_index_fingerprint !==
      ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01 ||
    fingerprintText(indexText) !==
      ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01 ||
    index.future_live_issue_number !== 193 ||
    index.source_repository_head_sha !==
      ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01 ||
    index.request_family_kind !== "compatibility_probe" ||
    index.outcome !== "accepted_all_shapes" ||
    index.authorization_consumed !== true ||
    report.outcome !== "accepted_all_shapes" ||
    report.planned_shapes !== 4 ||
    report.attempted_provider_calls !== 4 ||
    report.accepted_and_normalized_shapes !== 4 ||
    counts?.accepted_and_normalized !== 4 ||
    authorization.future_live_issue_number !== 193 ||
    authorization.exact_merged_source_head !==
      ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01 ||
    authorization.retries !== 0 ||
    authorization.second_probe_authorized !== false
  ) {
    failV01("operational_reentry_replacement_compatibility_artifact_mismatch");
  }
  return sealV01("compatibility_gate_without_integrity_fingerprint", {
    gate_version:
      "operational_reentry_matched_cohort_replacement_compatibility_gate.v0.1" as const,
    namespace: PROBE_NAMESPACE_V01,
    issue_number: 193 as const,
    source_head: ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
    outcome: "accepted_all_shapes" as const,
    planned_shapes: 4 as const,
    attempted_provider_calls: 4 as const,
    accepted_and_normalized_shapes: 4 as const,
    retries: 0 as const,
    second_probe: 0 as const,
    report_fingerprint: ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
    artifact_index_fingerprint:
      ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
    artifact_validation: "passed" as const,
    normalized_probe_outputs_reused: false as const,
  });
}

export function revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01(
  input: {
    repository_root: string;
    probe_run_root: string;
    prepared: OperationalReentryMatchedCohortReplacementPreparedV01;
  },
  dependencies: Parameters<
    typeof readOperationalReentryMatchedCohortReplacementCompatibilityGateV01
  >[1] = {},
): OperationalReentryMatchedCohortReplacementCompatibilityGateV01 {
  const finalGate =
    readOperationalReentryMatchedCohortReplacementCompatibilityGateV01(
      {
        repository_root: input.repository_root,
        probe_run_root: input.probe_run_root,
      },
      dependencies,
    );
  if (
    canonicalizeProtocolValueV01(finalGate) !==
      canonicalizeProtocolValueV01(input.prepared.compatibility_gate) ||
    finalGate.integrity.fingerprint !==
      input.prepared.authorization.compatibility_gate_fingerprint ||
    finalGate.integrity.fingerprint !==
      input.prepared.manifest.compatibility_gate_fingerprint ||
    finalGate.report_fingerprint !==
      input.prepared.lineage.compatibility_report_fingerprint ||
    finalGate.artifact_index_fingerprint !==
      input.prepared.lineage.compatibility_artifact_index_fingerprint
  ) {
    failV01("operational_reentry_replacement_final_compatibility_gate_changed");
  }
  return finalGate;
}

export function assertOperationalReentryMatchedCohortReplacementAggregateCostWithinCeilingV01(
  input: {
    aggregate_worst_case_cost_nano_usd: number;
    maximum_total_cost_nano_usd: number;
  },
): void {
  if (
    !Number.isSafeInteger(input.aggregate_worst_case_cost_nano_usd) ||
    input.aggregate_worst_case_cost_nano_usd < 0 ||
    !Number.isSafeInteger(input.maximum_total_cost_nano_usd) ||
    input.maximum_total_cost_nano_usd < 0 ||
    input.aggregate_worst_case_cost_nano_usd >
      input.maximum_total_cost_nano_usd ||
    input.maximum_total_cost_nano_usd >
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01
  ) {
    failV01("operational_reentry_replacement_aggregate_cost_exceeded");
  }
}

export function buildOperationalReentryMatchedCohortReplacementPricingV01(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV01;
    evaluated_at: string;
  },
): OperationalReentryMatchedCohortReplacementPricingV01 {
  const basePricing = buildOperationalReentryMatchedCohortPricingV01(input);
  const budget = buildModelGatewayCostBudgetV01({
    authority: basePricing.gateway_cost_budget.authority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
    maximum_output_units:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.timeoutMs,
    maximum_permitted_cost:
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
    evaluated_at: input.evaluated_at,
  });
  assertModelGatewayCostBudgetCurrentV01(budget, input.evaluated_at);
  const aggregateWorstCase = budget.calculated_worst_case_cost * 16;
  assertOperationalReentryMatchedCohortReplacementAggregateCostWithinCeilingV01(
    {
      aggregate_worst_case_cost_nano_usd: aggregateWorstCase,
      maximum_total_cost_nano_usd:
        ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
    },
  );
  return sealV01("replacement_pricing_without_integrity_fingerprint", {
    pricing_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_PRICING_VERSION_V01,
    provider_ref: structuredClone(input.route.provider_ref),
    model_ref: structuredClone(input.route.model_ref),
    input_nano_usd_per_token: 400 as const,
    cached_input_nano_usd_per_token: 100 as const,
    output_nano_usd_per_token: 1600 as const,
    pricing_source: "official_openai_model_page" as const,
    pricing_source_url:
      "https://developers.openai.com/api/docs/models/gpt-4.1-mini" as const,
    pricing_source_version:
      budget.authority.pricing_source_version,
    pricing_effective_at: basePricing.pricing_effective_at,
    pricing_expires_at: basePricing.pricing_expires_at,
    evaluated_at: input.evaluated_at,
    gateway_cost_budget: budget,
    per_call_worst_case_cost_nano_usd: budget.calculated_worst_case_cost,
    aggregate_worst_case_cost_nano_usd: aggregateWorstCase,
    aggregate_ceiling_nano_usd:
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
    missing_usage_or_exact_cost: "unknown_never_zero" as const,
  });
}

export function buildOperationalReentryMatchedCohortReplacementAuthorizationExpectationsV01(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV01;
    compatibility_gate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01;
    evaluated_at: string;
  },
) {
  assertSealedV01(input.compatibility_gate);
  const lineage = buildOperationalReentryMatchedCohortReplacementLineageV01();
  const callPlan = buildOperationalReentryMatchedCohortCallPlanV01();
  const providerContract =
    buildOperationalReentryProviderCompatibilityProbeProviderContractV01(
      input.route,
    );
  const pricing = buildOperationalReentryMatchedCohortReplacementPricingV01(
    input,
  );
  return {
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    expected_active_selection_revision:
      input.admission.expected_active_selection_revision,
    project_root_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.admission.project_root),
    ),
    lineage_fingerprint: lineage.integrity.fingerprint,
    compatibility_gate_fingerprint:
      input.compatibility_gate.integrity.fingerprint,
    case_fingerprint:
      operationalReentryMatchedCohortCaseFixtureV01.integrity.fingerprint,
    rubric_fingerprint:
      operationalReentryMatchedCohortRubricFixtureV01.integrity.fingerprint,
    call_plan_fingerprint: callPlan.integrity.fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    provider_contract_fingerprint:
      providerContract.integrity.fingerprint,
    pricing_fingerprint: pricing.integrity.fingerprint,
    pricing_snapshot_evaluated_at: pricing.evaluated_at,
    pricing_authority_fingerprint:
      pricing.gateway_cost_budget.authority.pricing_fingerprint,
    pricing_expires_at: pricing.pricing_expires_at,
    aggregate_worst_case_cost_nano_usd:
      pricing.aggregate_worst_case_cost_nano_usd,
  };
}

export function validateOperationalReentryMatchedCohortReplacementAuthorizationV01(
  value: unknown,
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV01;
    compatibility_gate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01;
    evaluated_at: string;
  },
): OperationalReentryMatchedCohortReplacementAuthorizationV01 {
  if (!isRecordV01(value)) {
    failV01("operational_reentry_replacement_authorization_missing_or_malformed");
  }
  exactKeysV01(value, [
    "authorization_version",
    "authorization_id",
    "authorization_kind",
    "request_family_kind",
    "future_live_issue_number",
    "exact_merged_source_head",
    "issued_at",
    "expires_at",
    "workspace_id",
    "project_id",
    "expected_active_selection_revision",
    "project_root_fingerprint",
    "gateway_authorization_project_is_lab_experiment_meaning",
    "lineage_fingerprint",
    "compatibility_gate_fingerprint",
    "case_fingerprint",
    "rubric_fingerprint",
    "call_plan_fingerprint",
    "route_fingerprint",
    "provider_contract_fingerprint",
    "pricing_fingerprint",
    "pricing_snapshot_evaluated_at",
    "pricing_authority_fingerprint",
    "planned_calls",
    "repeat_blocks",
    "calls_per_arm",
    "maximum_parallel_calls",
    "retries",
    "replacement_calls",
    "adaptive_stopping",
    "fresh_stateless_request_per_call",
    "conversation_reuse",
    "thread_reuse",
    "previous_response_reuse",
    "replacement_count",
    "retry_of_historical_cohort",
    "historical_artifacts_rewritten",
    "further_cohort_authorized",
    "second_replacement_authorized",
    "stage_7_authorized",
    "maximum_total_cost_nano_usd",
    "integrity",
  ]);
  const authorization = structuredClone(
    value,
  ) as unknown as OperationalReentryMatchedCohortReplacementAuthorizationV01;
  assertSealedV01(authorization);
  const pricingSnapshotEvaluatedAt = timestampV01(
    authorization.pricing_snapshot_evaluated_at,
  );
  const expectations =
    buildOperationalReentryMatchedCohortReplacementAuthorizationExpectationsV01(
      {
        ...input,
        evaluated_at: authorization.pricing_snapshot_evaluated_at,
      },
    );
  const currentPricing =
    buildOperationalReentryMatchedCohortReplacementPricingV01(input);
  const issuedAt = timestampV01(authorization.issued_at);
  const expiresAt = timestampV01(authorization.expires_at);
  const evaluatedAt = timestampV01(input.evaluated_at);
  const pricingExpiresAt = timestampV01(expectations.pricing_expires_at);
  if (
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01 ||
    !SAFE_AUTHORIZATION_ID_V01.test(authorization.authorization_id) ||
    authorization.authorization_kind !==
      "authorized_replacement_after_historical_incomplete" ||
    authorization.request_family_kind !== "replacement_cohort" ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= ACGC_E2R1H_ISSUE_NUMBER_V01 ||
    !GIT_SHA_V01.test(authorization.exact_merged_source_head) ||
    authorization.exact_merged_source_head ===
      ACGC_E2R1_HISTORICAL_HEAD_V01 ||
    authorization.exact_merged_source_head ===
      ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01 ||
    authorization.workspace_id !== expectations.workspace_id ||
    authorization.project_id !== expectations.project_id ||
    authorization.expected_active_selection_revision !==
      expectations.expected_active_selection_revision ||
    authorization.project_root_fingerprint !==
      expectations.project_root_fingerprint ||
    authorization.gateway_authorization_project_is_lab_experiment_meaning !==
      false ||
    authorization.lineage_fingerprint !== expectations.lineage_fingerprint ||
    authorization.compatibility_gate_fingerprint !==
      expectations.compatibility_gate_fingerprint ||
    authorization.case_fingerprint !== expectations.case_fingerprint ||
    authorization.rubric_fingerprint !== expectations.rubric_fingerprint ||
    authorization.call_plan_fingerprint !==
      expectations.call_plan_fingerprint ||
    authorization.route_fingerprint !== expectations.route_fingerprint ||
    authorization.provider_contract_fingerprint !==
      expectations.provider_contract_fingerprint ||
    authorization.pricing_fingerprint !== expectations.pricing_fingerprint ||
    authorization.pricing_snapshot_evaluated_at !==
      expectations.pricing_snapshot_evaluated_at ||
    authorization.pricing_authority_fingerprint !==
      expectations.pricing_authority_fingerprint ||
    authorization.pricing_authority_fingerprint !==
      currentPricing.gateway_cost_budget.authority.pricing_fingerprint ||
    authorization.planned_calls !== 16 ||
    authorization.repeat_blocks !== 4 ||
    authorization.calls_per_arm !== 4 ||
    authorization.maximum_parallel_calls !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacement_calls !== 0 ||
    authorization.adaptive_stopping !== false ||
    authorization.fresh_stateless_request_per_call !== true ||
    authorization.conversation_reuse !== false ||
    authorization.thread_reuse !== false ||
    authorization.previous_response_reuse !== false ||
    authorization.replacement_count !== 1 ||
    authorization.retry_of_historical_cohort !== false ||
    authorization.historical_artifacts_rewritten !== false ||
    authorization.further_cohort_authorized !== false ||
    authorization.second_replacement_authorized !== false ||
    authorization.stage_7_authorized !== false ||
    authorization.maximum_total_cost_nano_usd !==
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01 ||
    pricingSnapshotEvaluatedAt > issuedAt ||
    issuedAt >= expiresAt ||
    expiresAt - issuedAt > 2 * 60 * 60 * 1000 ||
    evaluatedAt < issuedAt ||
    evaluatedAt >= expiresAt ||
    expiresAt > pricingExpiresAt
  ) {
    failV01("operational_reentry_replacement_authorization_mismatched");
  }
  assertOperationalReentryMatchedCohortReplacementAggregateCostWithinCeilingV01(
    {
      aggregate_worst_case_cost_nano_usd:
        expectations.aggregate_worst_case_cost_nano_usd,
      maximum_total_cost_nano_usd:
        authorization.maximum_total_cost_nano_usd,
    },
  );
  assertOperationalReentryMatchedCohortReplacementAggregateCostWithinCeilingV01(
    {
      aggregate_worst_case_cost_nano_usd:
        currentPricing.aggregate_worst_case_cost_nano_usd,
      maximum_total_cost_nano_usd:
        authorization.maximum_total_cost_nano_usd,
    },
  );
  return authorization;
}

export function buildOperationalReentryMatchedCohortReplacementV01(
  input: BuildOperationalReentryMatchedCohortReplacementInputV01,
): OperationalReentryMatchedCohortReplacementPreparedV01 {
  const authorization =
    validateOperationalReentryMatchedCohortReplacementAuthorizationV01(
      input.authorization,
      input,
    );
  const lineage = buildOperationalReentryMatchedCohortReplacementLineageV01();
  const compatibilityGate = structuredClone(input.compatibility_gate);
  assertSealedV01(compatibilityGate);
  const caseValue = structuredClone(
    operationalReentryMatchedCohortCaseFixtureV01,
  );
  const rubric = structuredClone(
    operationalReentryMatchedCohortRubricFixtureV01,
  );
  const callPlan = buildOperationalReentryMatchedCohortCallPlanV01(caseValue);
  const providerContract =
    buildOperationalReentryProviderCompatibilityProbeProviderContractV01(
      input.route,
    );
  const pricing = buildOperationalReentryMatchedCohortReplacementPricingV01(
    {
      admission: input.admission,
      route: input.route,
      evaluated_at: authorization.pricing_snapshot_evaluated_at,
    },
  );
  const replacementCohortId =
    `operational-reentry-replacement-cohort:${createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        authorization_fingerprint: authorization.integrity.fingerprint,
        lineage_fingerprint: lineage.integrity.fingerprint,
        compatibility_gate_fingerprint:
          compatibilityGate.integrity.fingerprint,
        call_plan_fingerprint: callPlan.integrity.fingerprint,
      }),
    ).slice("sha256:".length, "sha256:".length + 32)}`;
  const requestFamilyTraceId =
    createDeterministicModelProviderRequestTraceV01({
      request_family_kind: "replacement_cohort",
      request_family_fingerprint: authorization.integrity.fingerprint,
    });
  const manifest = sealV01(
    "replacement_manifest_without_integrity_fingerprint",
    {
      manifest_version:
        OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_MANIFEST_VERSION_V01,
      replacement_cohort_id: replacementCohortId,
      future_live_issue_number: authorization.future_live_issue_number,
      source_repository_head_sha: authorization.exact_merged_source_head,
      authorization_fingerprint: authorization.integrity.fingerprint,
      lineage_fingerprint: lineage.integrity.fingerprint,
      compatibility_gate_fingerprint:
        compatibilityGate.integrity.fingerprint,
      case_fingerprint: caseValue.integrity.fingerprint,
      rubric_fingerprint: rubric.integrity.fingerprint,
      call_plan_fingerprint: callPlan.integrity.fingerprint,
      route: structuredClone(input.route),
      pricing_fingerprint: pricing.integrity.fingerprint,
      provider_contract_fingerprint:
        providerContract.integrity.fingerprint,
      request_family_kind: "replacement_cohort" as const,
      request_family_trace_id: requestFamilyTraceId,
      provider_egress:
        "allow_only_with_supplied_future_authorization" as const,
      execution_mode: "live" as const,
      data_classification: "public_safe" as const,
      retention_class: "none" as const,
      raw_prompt_persisted: false as const,
      raw_request_body_persisted: false as const,
      raw_provider_response_persisted: false as const,
      raw_provider_error_persisted: false as const,
      hidden_reasoning_persisted: false as const,
      credentials_or_full_headers_persisted: false as const,
      manual_retries: 0 as const,
      replacement_calls: 0 as const,
    },
  );
  const prepared = {
    authorization,
    lineage,
    compatibility_gate: compatibilityGate,
    manifest,
    case: caseValue,
    rubric,
    call_plan: callPlan,
    provider_contract: providerContract,
    pricing,
  };
  validatePreparedV01(prepared);
  return prepared;
}

export async function runOperationalReentryMatchedCohortReplacementV01(
  input: BuildOperationalReentryMatchedCohortReplacementInputV01,
  dependencies: RunOperationalReentryMatchedCohortReplacementDependenciesV01,
): Promise<OperationalReentryMatchedCohortReplacementExecutionResultV01> {
  const prepared = buildOperationalReentryMatchedCohortReplacementV01(input);
  await dependencies.on_attempt_prepared?.(prepared);
  const invokeGateway =
    dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV01;
  const cancellation =
    dependencies.cancellation_signal ?? new AbortController().signal;
  const calls: OperationalReentryMatchedCohortCallTerminalV01[] = [];
  const blocks: OperationalReentryMatchedCohortBlockEvaluationV01[] = [];
  let firstEgressConsumed = false;

  for (const entry of prepared.call_plan.entries) {
    try {
      await dependencies.assert_source_unchanged(entry);
    } catch {
      const terminal =
        buildOperationalReentryMatchedCohortCallTerminalV01({
          entry,
          route: prepared.manifest.route,
          pricing: prepared.pricing,
          category: "cohort_internal_failure",
          receipt: null,
          output: null,
          failureCode: "tracked_source_changed_after_replacement_start",
        });
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      break;
    }
    let terminal: OperationalReentryMatchedCohortCallTerminalV01;
    try {
      const result = await invokeGateway(
        buildEnvelopeV01(entry, prepared, input.admission, cancellation),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_route:
            prepared.manifest.route,
          on_provider_egress_attempt() {
            if (!firstEgressConsumed) {
              dependencies.on_first_egress_attempt({
                authorization_fingerprint:
                  prepared.authorization.integrity.fingerprint,
                replacement_cohort_id:
                  prepared.manifest.replacement_cohort_id,
              });
              firstEgressConsumed = true;
            }
          },
        },
      );
      terminal = buildOperationalReentryMatchedCohortCallTerminalV01({
        entry,
        route: prepared.manifest.route,
        pricing: prepared.pricing,
        category: "completed_live",
        receipt: result.model_invocation_receipt,
        output: result.output,
        failureCode: null,
      });
    } catch (error) {
      const receipt =
        error instanceof ModelGatewayInvocationErrorV01 ? error.receipt : null;
      terminal = buildOperationalReentryMatchedCohortCallTerminalV01({
        entry,
        route: prepared.manifest.route,
        pricing: prepared.pricing,
        category: classifyOperationalReentryMatchedCohortTerminalV01(error),
        receipt,
        output: null,
        failureCode:
          error instanceof ModelGatewayInvocationErrorV01
            ? error.code
            : "replacement_internal_error_receipt_unavailable",
        providerRejectionObservation:
          error instanceof ModelGatewayInvocationErrorV01
            ? error.provider_rejection_observation
            : null,
      });
    }
    calls.push(terminal);
    await dependencies.on_call_terminal?.(terminal);
    if (calls.length % 4 === 0) {
      const block = evaluateOperationalReentryMatchedCohortBlockV01(
        (calls.length / 4 - 1) as OperationalReentryMatchedCohortBlockV01,
        calls.slice(calls.length - 4),
        prepared.rubric,
      );
      blocks.push(block);
      await dependencies.on_block_evaluation?.(block);
    }
  }
  let sourceUnchangedAtTerminal = true;
  try {
    await dependencies.assert_source_unchanged(
      prepared.call_plan.entries[prepared.call_plan.entries.length - 1]!,
    );
  } catch {
    sourceUnchangedAtTerminal = false;
  }
  const report = buildReplacementReportV01(
    prepared,
    calls,
    blocks,
    sourceUnchangedAtTerminal,
  );
  return validateOperationalReentryMatchedCohortReplacementExecutionResultV01(
    {
      result_kind: report.completion_status,
      ...prepared,
      calls,
      block_evaluations: blocks,
      report,
    },
  );
}

export function validateOperationalReentryMatchedCohortReplacementExecutionResultV01(
  result: OperationalReentryMatchedCohortReplacementExecutionResultV01,
): OperationalReentryMatchedCohortReplacementExecutionResultV01 {
  validatePreparedV01(result);
  assertSealedV01(result.report);
  result.calls.forEach(assertSealedV01);
  result.block_evaluations.forEach(assertSealedV01);
  if (
    result.calls.some((call, index) => call.call_order !== index) ||
    result.calls.some(
      (call) =>
        call.route_fingerprint !== result.manifest.route.integrity_fingerprint ||
        call.pricing_fingerprint !== result.pricing.integrity.fingerprint ||
        call.operator_intervention.manual_retries !== 0 ||
        call.operator_intervention.replacement_calls !== 0,
    ) ||
    result.result_kind !== result.report.completion_status ||
    canonicalizeProtocolValueV01(
      buildReplacementReportV01(
        result,
        result.calls,
        result.block_evaluations,
        result.report.source_head_and_tracked_worktree_unchanged_at_terminal,
      ),
    ) !== canonicalizeProtocolValueV01(result.report)
  ) {
    failV01("operational_reentry_replacement_result_invalid");
  }
  scanForbiddenPersistedMaterialV01(result);
  return structuredClone(result);
}

function buildEnvelopeV01(
  entry: OperationalReentryMatchedCohortCallPlanV01["entries"][number],
  prepared: OperationalReentryMatchedCohortReplacementPreparedV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id: prepared.manifest.request_family_trace_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      prepared.case.source_ref.source_fingerprint,
      prepared.case.integrity.fingerprint,
      prepared.rubric.integrity.fingerprint,
      prepared.call_plan.integrity.fingerprint,
      prepared.lineage.integrity.fingerprint,
      prepared.compatibility_gate.integrity.fingerprint,
    ],
    privacy: {
      provider_egress: "allow" as const,
      retention_class: "none" as const,
    },
    budget: {
      max_input_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      max_output_tokens:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
      max_provider_calls: 1 as const,
      cost_budget: prepared.pricing.gateway_cost_budget,
    },
    timeout_ms:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.timeoutMs,
    cancellation: { signal: cancellation },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision:
        admission.expected_active_selection_revision,
    },
    project_root: structuredClone(admission.project_root),
    input: structuredClone(entry.model_input),
  };
}

function buildReplacementReportV01(
  prepared: OperationalReentryMatchedCohortReplacementPreparedV01,
  calls: OperationalReentryMatchedCohortCallTerminalV01[],
  blocks: OperationalReentryMatchedCohortBlockEvaluationV01[],
  sourceUnchangedAtTerminal: boolean,
): OperationalReentryMatchedCohortReplacementReportV01 {
  const categoryCounts = Object.fromEntries(
    ([
      "completed_live",
      "provider_rejected",
      "provider_response_invalid",
      "transport_failed",
      "timed_out",
      "cancelled",
      "blocked_before_egress",
      "cohort_internal_failure",
    ] as const).map((category) => [
      category,
      calls.filter((call) => call.terminal_category === category).length,
    ]),
  ) as Record<OperationalReentryMatchedCohortTerminalCategoryV01, number>;
  const complete =
    sourceUnchangedAtTerminal &&
    calls.length === 16 &&
    blocks.length === 4 &&
    blocks.every((block) => block.status === "complete");
  const repeatability = PAIRS_V01.map(([left, right]) => {
    const relations = blocks.map(
      (block) =>
        block.pairwise_relations.find(
          (entry) => entry.left_arm === left && entry.right_arm === right,
        )?.relation ?? "not_comparable",
    );
    return {
      left_arm: left,
      right_arm: right,
      disposition: deriveOperationalReentryMatchedCohortRepeatabilityV01(
        relations,
        complete,
      ),
      observed_relations: relations,
    };
  });
  const usages = calls
    .map((call) => call.usage)
    .filter((usage) => usage !== null);
  const allUsageKnown =
    calls.length === 16 && calls.every((call) => call.usage !== null);
  const allCachedUsageKnown =
    allUsageKnown && usages.every((usage) => usage.cached_input_tokens !== undefined);
  const allExactCostsKnown =
    calls.length === 16 &&
    calls.every((call) => call.exact_cost.status === "calculated");
  const exactCosts = calls
    .map((call) => call.exact_cost.total_nano_usd)
    .filter((value): value is number => value !== null);
  const latencies = calls
    .map((call) => call.latency_ms)
    .filter((value): value is number => value !== null);
  const failureCodes = calls
    .map((call) => call.terminal_failure_code)
    .filter((value): value is string => value !== null);
  const reportWithoutIntegrity = {
    report_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_REPORT_VERSION_V01,
    replacement_cohort_id: prepared.manifest.replacement_cohort_id,
    completion_status: complete ? ("complete" as const) : ("incomplete" as const),
    planned_calls: 16 as const,
    terminal_calls: calls.length,
    source_head_and_tracked_worktree_unchanged_at_terminal:
      sourceUnchangedAtTerminal,
    terminal_category_counts: categoryCounts,
    terminal_failure_code_counts: countStringsV01(failureCodes),
    first_provider_rejection:
      calls.find((call) => call.provider_rejection_observation)
        ?.provider_rejection_observation ?? null,
    block_evaluations: structuredClone(blocks),
    repeatability,
    exact_case_dispositions:
      deriveOperationalReentryMatchedCohortExactCaseDispositionsV01(
        blocks,
        complete,
      ),
    accounting: {
      attempted_provider_calls: calls.filter((call) => call.egress_attempted)
        .length,
      completed_live_calls: categoryCounts.completed_live,
      failed_or_blocked_calls: calls.length - categoryCounts.completed_live,
      missing_call_slots: 16 - calls.length,
      provider_reported_input_tokens: allUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.input_tokens, 0)
        : null,
      provider_reported_cached_input_tokens: allCachedUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.cached_input_tokens!, 0)
        : null,
      provider_reported_output_tokens: allUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.output_tokens, 0)
        : null,
      provider_reported_total_tokens: allUsageKnown
        ? usages.reduce((sum, usage) => sum + usage.total_tokens, 0)
        : null,
      exact_cost_status: allExactCostsKnown
        ? ("calculated" as const)
        : ("unknown" as const),
      calculated_exact_cost_nano_usd: allExactCostsKnown
        ? exactCosts.reduce((sum, value) => sum + value, 0)
        : null,
      aggregate_worst_case_cost_nano_usd:
        prepared.pricing.aggregate_worst_case_cost_nano_usd,
      aggregate_ceiling_nano_usd:
        ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
      latency_ms: {
        minimum: latencies.length > 0 ? Math.min(...latencies) : null,
        maximum: latencies.length > 0 ? Math.max(...latencies) : null,
        total:
          latencies.length === calls.length
            ? latencies.reduce((sum, value) => sum + value, 0)
            : null,
      },
      operator_intervention: {
        retries: 0 as const,
        replacement_calls: 0 as const,
        manual_normalized_output_edits: 0 as const,
      },
    },
    limitations: [
      "Any repeated A/B difference is exact-case behavioral intervention sensitivity only.",
      "This replacement cohort cannot establish hidden actual use, general causality, general benefit or harm, provider or model superiority, policy fitness, actor fitness, or Stage 7 readiness.",
      "Historical Stage 5 attribution remains unknown and the historical provider rejection cause remains unclassified.",
      "Missing usage or exact cost remains unknown and is never imputed as zero.",
    ],
    authority_ledger: {
      behavioral_result_is_exact_case_only: true as const,
      claims_hidden_actual_use: false as const,
      claims_general_causality: false as const,
      claims_general_benefit_or_harm: false as const,
      claims_model_or_provider_superiority: false as const,
      creates_scalar_rank_or_winner: false as const,
      authorizes_policy: false as const,
      authorizes_actor_or_population_promotion: false as const,
      authorizes_further_cohort: false as const,
      authorizes_stage_7: false as const,
      authorizes_publication: false as const,
      authorizes_ready_merge_or_auto_merge: false as const,
      writes_product_database: 0 as const,
      writes_core: 0 as const,
    },
  };
  return sealV01(
    "replacement_report_without_integrity_fingerprint",
    reportWithoutIntegrity,
  );
}

function validatePreparedV01(
  prepared: OperationalReentryMatchedCohortReplacementPreparedV01,
): void {
  [
    prepared.authorization,
    prepared.lineage,
    prepared.compatibility_gate,
    prepared.manifest,
    prepared.case,
    prepared.rubric,
    prepared.call_plan,
    prepared.provider_contract,
    prepared.pricing,
  ].forEach(assertSealedV01);
  if (
    prepared.manifest.authorization_fingerprint !==
      prepared.authorization.integrity.fingerprint ||
    prepared.manifest.lineage_fingerprint !==
      prepared.lineage.integrity.fingerprint ||
    prepared.manifest.compatibility_gate_fingerprint !==
      prepared.compatibility_gate.integrity.fingerprint ||
    prepared.manifest.case_fingerprint !== prepared.case.integrity.fingerprint ||
    prepared.manifest.rubric_fingerprint !==
      prepared.rubric.integrity.fingerprint ||
    prepared.manifest.call_plan_fingerprint !==
      prepared.call_plan.integrity.fingerprint ||
    prepared.manifest.pricing_fingerprint !==
      prepared.pricing.integrity.fingerprint ||
    prepared.authorization.pricing_fingerprint !==
      prepared.pricing.integrity.fingerprint ||
    prepared.authorization.pricing_snapshot_evaluated_at !==
      prepared.pricing.evaluated_at ||
    prepared.authorization.pricing_authority_fingerprint !==
      prepared.pricing.gateway_cost_budget.authority.pricing_fingerprint ||
    prepared.manifest.provider_contract_fingerprint !==
      prepared.provider_contract.integrity.fingerprint ||
    prepared.manifest.request_family_kind !== "replacement_cohort" ||
    prepared.call_plan.planned_calls !== 16 ||
    prepared.call_plan.entries.length !== 16 ||
    prepared.call_plan.max_parallel_provider_calls !== 1 ||
    prepared.call_plan.retries !== 0 ||
    prepared.call_plan.replacement_calls !== 0 ||
    prepared.call_plan.adaptive_stopping !== false ||
    prepared.call_plan.stateless_invocations !== true ||
    prepared.call_plan.conversation_reuse !== false ||
    prepared.call_plan.thread_reuse !== false ||
    prepared.call_plan.previous_response_reuse !== false ||
    prepared.pricing.aggregate_worst_case_cost_nano_usd >
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01
  ) {
    failV01("operational_reentry_replacement_prepared_identity_invalid");
  }
}

function countStringsV01(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) =>
      left.localeCompare(right, "en"),
    ),
  );
}

function exactKeysV01(
  value: Record<string, unknown>,
  expected: string[],
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(wanted)) {
    failV01("operational_reentry_replacement_authorization_shape_invalid");
  }
}

function timestampV01(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) {
    failV01("operational_reentry_replacement_timestamp_invalid");
  }
  return parsed;
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSealedV01(value: {
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}): void {
  const { integrity, ...withoutIntegrity } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    integrity.fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(withoutIntegrity))
  ) {
    failV01("operational_reentry_replacement_fingerprint_invalid");
  }
}

function sealV01<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV01 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(value),
      ),
    },
  };
}

function scanForbiddenPersistedMaterialV01(value: unknown): void {
  const text = canonicalizeProtocolValueV01(value).toLowerCase();
  for (const forbidden of [
    "chain_of_thought",
    "authorization: bearer",
    "openai_api_key",
    "/users/",
    "/home/",
  ]) {
    if (text.includes(forbidden)) {
      failV01("operational_reentry_replacement_forbidden_material");
    }
  }
}

function failV01(code: string): never {
  throw new OperationalReentryMatchedCohortReplacementErrorV01(code);
}
