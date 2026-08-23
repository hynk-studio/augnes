import { operationalReentryMatchedCohortCaseFixtureV02 } from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
  assertModelGatewayCostBudgetCurrentV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04,
  createOperationalReentryMatchedCohortProviderMaterialFingerprintV04,
  invokeOperationalReentryMatchedCohortModelGatewayV04,
  projectOperationalReentryMatchedCohortProviderRequestV04,
  readOperationalReentryMatchedCohortProviderContractV04,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryMatchedCohortModelGatewayDependenciesV04,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  isModelGatewayInvocationErrorV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  evaluateOperationalReentryMatchedCohortArmV02,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import {
  buildOperationalReentryMatchedCohortInvocationV04,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-4";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryMatchedCohortArmEvaluationV02,
  OperationalReentryMatchedCohortModelInputV02,
  OperationalReentryMatchedCohortObservedArmV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  type OperationalReentryMatchedCohortInvocationV04,
  type OperationalReentryMatchedCohortModelOutputV04,
  type OperationalReentryMatchedCohortProviderMaterialV04,
  type OperationalReentryMatchedCohortRouteV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONFORMANCE_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_GATE_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PROVENANCE_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01,
  type OperationalReentryV04StaleResetIsolationArmV01,
  type OperationalReentryV04StaleResetIsolationAuthorizationV01,
  type OperationalReentryV04StaleResetIsolationBgConformanceWitnessV01,
  type OperationalReentryV04StaleResetIsolationBlockEvaluationV01,
  type OperationalReentryV04StaleResetIsolationBlockV01,
  type OperationalReentryV04StaleResetIsolationCallTerminalV01,
  type OperationalReentryV04StaleResetIsolationDimensionRelationV01,
  type OperationalReentryV04StaleResetIsolationEvaluatorContractV01,
  type OperationalReentryV04StaleResetIsolationExecutionResultV01,
  type OperationalReentryV04StaleResetIsolationGateContractV01,
  type OperationalReentryV04StaleResetIsolationGateProvenanceV01,
  type OperationalReentryV04StaleResetIsolationLayerAV01,
  type OperationalReentryV04StaleResetIsolationLayerBV01,
  type OperationalReentryV04StaleResetIsolationLimitationV01,
  type OperationalReentryV04StaleResetIsolationObservedArmV01,
  type OperationalReentryV04StaleResetIsolationPairEvaluationV01,
  type OperationalReentryV04StaleResetIsolationPlanEntryV01,
  type OperationalReentryV04StaleResetIsolationPlanV01,
  type OperationalReentryV04StaleResetIsolationPresenceV01,
  type OperationalReentryV04StaleResetIsolationPreparedV01,
  type OperationalReentryV04StaleResetIsolationPricingV01,
  type OperationalReentryV04StaleResetIsolationTargetPersistenceRelationV01,
  type OperationalReentryV04StaleResetIsolationTerminalCategoryV01,
} from "@/types/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";

export const ACGC_E2R2P6H_ISSUE_NUMBER_V01 = 237 as const;
const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02 =
  "gpt-4.1-mini-2025-04-14" as const;
export const ACGC_E2R2P6H_AUTHORIZED_BASELINE_SHA_V01 =
  "32cc6e6de753cee84bef5d923fab341503bf22c9" as const;
export const ACGC_E2R2P6H_AUTHORIZED_BASELINE_TREE_V01 =
  "6107abe91b733c708b78a92ab483228690c5da9f" as const;
export const ACGC_E2R2P6H_CASE_FINGERPRINT_V01 =
  "sha256:d702283dae6d9cfe586a3b7fd91893aee2720a3f136a027c321c3ecfa9d7fa4b" as const;
export const ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 =
  "sha256:455cb74df26f63eccd15952a98433cba7f410a9e8b312afe5d35d4ceb235f38d" as const;
export const ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 =
  "sha256:1d53d6d1b8ae9480542284718e662cb164cfb49284d6be20230b233c5d1d625f" as const;
export const ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 =
  "sha256:1ca7da7cf3870de67fdbe36f1a6bf9d67a3a50accbd8f7daf147e424901eda52" as const;
export const ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 =
  "sha256:7418f3ace51f53a8089c33392dc00d697f21ab383a4c4442fc4ffdc39efea0fa" as const;
export const ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 =
  "operational_reentry_v04_stale_reset_isolation_cohort" as const;
export const ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01 =
  250_000_000 as const;
export const ACGC_E2R2P6H_PER_CALL_WORST_CASE_NANO_USD_V01 =
  11_699_200 as const;
export const ACGC_E2R2P6H_AGGREGATE_WORST_CASE_NANO_USD_V01 =
  187_187_200 as const;
export const ACGC_E2R2P6H_SEALED_ORDER_V01 = Object.freeze([
  Object.freeze(["A", "B", "G", "C"] as const),
  Object.freeze(["B", "C", "A", "G"] as const),
  Object.freeze(["C", "G", "B", "A"] as const),
  Object.freeze(["G", "A", "C", "B"] as const),
] as const);
export const ACGC_E2R2P6H_DIRECT_PAIRS_V01 = Object.freeze([
  Object.freeze(["A", "B"] as const),
  Object.freeze(["A", "C"] as const),
  Object.freeze(["A", "G"] as const),
  Object.freeze(["B", "C"] as const),
  Object.freeze(["B", "G"] as const),
  Object.freeze(["C", "G"] as const),
] as const);

export const operationalReentryV04StaleResetIsolationHypothesesV01 =
  Object.freeze({
    H1: "A vs B reproduces fresh-target positive-control conditioning.",
    H2: "C vs B measures downstream metadata-only stale persistence.",
    H3: "G vs B measures downstream target-specific equivalence after valid gating.",
    H4: "G vs C measures a bounded downstream gating-associated persistence difference.",
    H5: "Common compliance and bounded outcome remain independent gates.",
    results: null,
  });

export const operationalReentryV04StaleResetIsolationHarnessAuthorityV01 =
  Object.freeze({
    prepared_without_provider_egress: true as const,
    provider_contract_verdict: "reuse_v04_exact" as const,
    provider_contract_compatibility_source:
      "issue_232_accepted_all_shapes" as const,
    new_compatibility_probe_required: false as const,
    new_compatibility_probe_executed: false as const,
    successor_live_authorizations_created: 0 as const,
    successor_live_authorizations_consumed: 0 as const,
    live_behavioral_cohort_authorized: false as const,
    live_behavioral_cohort_executed: false as const,
    behavioral_result: "none" as const,
    replication_authorized: false as const,
    policy_authorized: false as const,
    stage_7_authorized: false as const,
    real_provider_calls: 0 as const,
  });

const AUTHORIZED_REPOSITORY_SLUG_V01 =
  "hynk-studio/augnes-perspective-lab" as const;
const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes-perspective-lab.git",
  "git@github.com:hynk-studio/augnes-perspective-lab.git",
]);
const SHA256_V01 = /^sha256:[0-9a-f]{64}$/u;
const GIT_SHA_V01 = /^[0-9a-f]{40}$/u;
const SAFE_ID_V01 = /^[A-Za-z0-9:._-]{1,200}$/u;
const TARGET_CONTEXT_TOKEN_V01 =
  operationalReentryMatchedCohortCaseFixtureV02.provider_visible.stale_target
    .context_token;

export class OperationalReentryV04StaleResetIsolationErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryV04StaleResetIsolationErrorV01";
  }
}

export class OperationalReentryV04StaleResetIsolationDriftErrorV01 extends Error {
  constructor(readonly boundary: "source" | "admission" | "route" | "pricing" | "authorization") {
    super(`operational_reentry_v04_stale_reset_isolation_${boundary}_drift`);
    this.name = "OperationalReentryV04StaleResetIsolationDriftErrorV01";
  }
}

export interface BuildOperationalReentryV04StaleResetIsolationGateInputV01 {
  cohort_ref: string;
  call_slot_id: string;
  repeat_block: OperationalReentryV04StaleResetIsolationBlockV01;
  declared_source_case_fingerprint?: string;
  declared_upstream_target_fingerprint?: string;
  declared_upstream_stale_relation_fingerprint?: string;
  declared_non_target_material_fingerprint?: string;
  gate_version?: string;
  gate_disposition?: string;
}

export interface BuildOperationalReentryV04StaleResetIsolationInputV01 {
  authorization: unknown;
  pricing: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryMatchedCohortRouteV04;
  repository_identity: {
    repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V01;
    origin: string;
  };
  evaluated_at: string;
}

export interface RunOperationalReentryV04StaleResetIsolationDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryMatchedCohortModelGatewayV04;
  gateway_dependencies?: OperationalReentryMatchedCohortModelGatewayDependenciesV04;
  cancellation_signal?: AbortSignal;
  assert_execution_state: (
    entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
  ) => void | Promise<void>;
  consume_authorization: (input: {
    authorization: OperationalReentryV04StaleResetIsolationAuthorizationV01;
    cohort_id: string;
  }) => void;
  on_call_terminal?: (
    call: OperationalReentryV04StaleResetIsolationCallTerminalV01,
  ) => void | Promise<void>;
  on_block_evaluation?: (
    block: OperationalReentryV04StaleResetIsolationBlockEvaluationV01,
  ) => void | Promise<void>;
}

export function buildOperationalReentryV04StaleResetIsolationGateContractV01(): OperationalReentryV04StaleResetIsolationGateContractV01 {
  assertFrozenCaseV01();
  const c = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "C",
    cohort_ref: "acgc-e2r2p6h-gate-contract",
    call_slot_id: "e2r2p6h-call-gate-contract",
    block: 0,
  });
  const target = c.provider_material.continuation_context.find(
    (item) => item.role === "target",
  );
  if (!target || !c.provider_material.stale_relation) {
    failV01("operational_reentry_v04_stale_reset_gate_source_invalid");
  }
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_gate_contract_without_integrity_fingerprint",
    {
      gate_version: OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_GATE_VERSION_V01,
      provenance_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PROVENANCE_VERSION_V01,
      source_case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
      upstream_target_fingerprint: fingerprintV01(target),
      upstream_stale_relation_fingerprint: fingerprintV01(
        c.provider_material.stale_relation,
      ),
      non_target_material_fingerprint: fingerprintV01(
        c.provider_material.continuation_context.filter(
          (item) => item.role === "non_target",
        ),
      ),
      gate_disposition: "excluded_before_materialization" as const,
      projected_provider_shape: "exact_B" as const,
      local_provenance_provider_visibility: "absent" as const,
      raw_target_text_persisted: false as const,
      core_evidence_created: false as const,
      proposal_review_decision_transition_created: false as const,
      policy_or_rank_winner_created: false as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationGatedInvocationV01(
  input: BuildOperationalReentryV04StaleResetIsolationGateInputV01,
  dependencies: {
    project_provider_request?: typeof projectOperationalReentryMatchedCohortProviderRequestV04;
  } = {},
): {
  invocation: OperationalReentryMatchedCohortInvocationV04;
  provenance: OperationalReentryV04StaleResetIsolationGateProvenanceV01;
} {
  const contract = buildOperationalReentryV04StaleResetIsolationGateContractV01();
  const upstreamC = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "C",
    cohort_ref: `${input.cohort_ref}-upstream`,
    call_slot_id: input.call_slot_id,
    block: input.repeat_block,
  });
  const target = upstreamC.provider_material.continuation_context.find(
    (item) => item.role === "target",
  );
  const relation = upstreamC.provider_material.stale_relation;
  const nonTarget = upstreamC.provider_material.continuation_context.filter(
    (item) => item.role === "non_target",
  );
  const declaredSource =
    input.declared_source_case_fingerprint ??
    ACGC_E2R2P6H_CASE_FINGERPRINT_V01;
  const declaredTarget =
    input.declared_upstream_target_fingerprint ??
    (target ? fingerprintV01(target) : "missing");
  const declaredRelation =
    input.declared_upstream_stale_relation_fingerprint ??
    (relation ? fingerprintV01(relation) : "missing");
  const declaredNonTarget =
    input.declared_non_target_material_fingerprint ?? fingerprintV01(nonTarget);
  if (
    !target ||
    !relation ||
    declaredSource !== contract.source_case_fingerprint ||
    declaredTarget !== contract.upstream_target_fingerprint ||
    declaredTarget !== fingerprintV01(target) ||
    declaredRelation !== contract.upstream_stale_relation_fingerprint ||
    declaredRelation !== fingerprintV01(relation) ||
    declaredNonTarget !== contract.non_target_material_fingerprint ||
    declaredNonTarget !== fingerprintV01(nonTarget) ||
    (input.gate_version ?? contract.gate_version) !== contract.gate_version ||
    (input.gate_disposition ?? contract.gate_disposition) !==
      contract.gate_disposition
  ) {
    failV01("operational_reentry_v04_stale_reset_gate_provenance_invalid");
  }
  const invocation = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: input.cohort_ref,
    call_slot_id: input.call_slot_id,
    block: input.repeat_block,
  });
  const canonicalB = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: `${input.cohort_ref}-canonical`,
    call_slot_id: `${input.call_slot_id}-canonical`,
    block: input.repeat_block,
  });
  assertOperationalReentryV04StaleResetIsolationGProviderProjectionV01({
    gated_invocation: invocation,
    canonical_b_invocation: canonicalB,
    expected_non_target_material_fingerprint: contract.non_target_material_fingerprint,
  });
  const project =
    dependencies.project_provider_request ??
    projectOperationalReentryMatchedCohortProviderRequestV04;
  const request = project(invocation);
  const sourceGateLineage = fingerprintV01({
    provenance_version: contract.provenance_version,
    gate_version: contract.gate_version,
    source_case_fingerprint: contract.source_case_fingerprint,
    upstream_target_fingerprint: contract.upstream_target_fingerprint,
    upstream_stale_relation_fingerprint:
      contract.upstream_stale_relation_fingerprint,
    non_target_material_fingerprint: contract.non_target_material_fingerprint,
    gate_disposition: contract.gate_disposition,
    call_slot_id: input.call_slot_id,
    repeat_block: input.repeat_block,
  });
  const provenance = sealV01(
    "operational_reentry_v04_stale_reset_isolation_provenance_without_integrity_fingerprint",
    {
      provenance_version: contract.provenance_version,
      gate_version: contract.gate_version,
      source_case_fingerprint: contract.source_case_fingerprint,
      upstream_target_fingerprint: contract.upstream_target_fingerprint,
      upstream_stale_relation_fingerprint:
        contract.upstream_stale_relation_fingerprint,
      non_target_material_fingerprint: contract.non_target_material_fingerprint,
      source_gate_lineage_fingerprint: sourceGateLineage,
      gate_disposition: "excluded_before_materialization" as const,
      target_excluded: true as const,
      stale_relation_excluded: true as const,
      non_target_material_unchanged: true as const,
      projected_provider_material_fingerprint:
        createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
          invocation.provider_material,
        ),
      provider_request_fingerprint: request.request_fingerprint,
      local_provenance_provider_visibility: "absent" as const,
    },
  );
  assertGProvenanceProviderInvisibleV01(invocation, request.request_body, provenance);
  return { invocation, provenance };
}

export function assertOperationalReentryV04StaleResetIsolationGProviderProjectionV01(
  input: {
    gated_invocation: OperationalReentryMatchedCohortInvocationV04;
    canonical_b_invocation: OperationalReentryMatchedCohortInvocationV04;
    expected_non_target_material_fingerprint?: string;
  },
): void {
  const gated = input.gated_invocation.provider_material;
  const canonical = input.canonical_b_invocation.provider_material;
  const nonTarget = gated.continuation_context.filter(
    (item) => item.role === "non_target",
  );
  if (
    canonicalizeProtocolValueV01(gated) !==
      canonicalizeProtocolValueV01(canonical) ||
    gated.continuation_context.some((item) => item.role === "target") ||
    gated.stale_relation !== null ||
    (input.expected_non_target_material_fingerprint !== undefined &&
      fingerprintV01(nonTarget) !==
        input.expected_non_target_material_fingerprint)
  ) {
    throw new OperationalReentryV04StaleResetIsolationErrorV01(
      "new_provider_contract_required",
    );
  }
}

export function buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01(): OperationalReentryV04StaleResetIsolationEvaluatorContractV01 {
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_evaluator_contract_without_integrity_fingerprint",
    {
      evaluator_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
      layer_a_dimensions: [
        "upstream_target_identity",
        "upstream_stale_relation_identity",
        "substrate_gate_disposition",
        "source_gate_lineage",
        "provider_projection_shape",
        "provider_target_material",
        "provider_stale_relation",
        "provider_material_fingerprint",
        "provider_request_fingerprint",
        "local_provenance_provider_visibility",
      ] as const,
      layer_b_independent_dimensions: [
        "selected_or_referenced_target_identity",
        "target_action_or_decision_preparation",
        "target_specific_result_limitation",
      ] as const,
      direct_pairs: ["A-B", "A-C", "A-G", "B-C", "B-G", "C-G"] as const,
      dimension_counting: false as const,
      majority_vote: false as const,
      weighting: false as const,
      scalar_score: false as const,
      rank_or_winner: false as const,
      transitive_pair_inference: false as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationPlanV01(): OperationalReentryV04StaleResetIsolationPlanV01 {
  assertFrozenV04ContractV01();
  const gateContract =
    buildOperationalReentryV04StaleResetIsolationGateContractV01();
  const nonInterventionParity = fingerprintV01({
    task: operationalReentryMatchedCohortCaseFixtureV02.provider_visible.task,
    common_task_evidence:
      operationalReentryMatchedCohortCaseFixtureV02.provider_visible
        .common_task_evidence,
    non_target_continuation:
      operationalReentryMatchedCohortCaseFixtureV02.provider_visible
        .matched_non_target_continuation,
    allowed_output:
      operationalReentryMatchedCohortCaseFixtureV02.provider_visible.allowed_output,
    authority_notice:
      operationalReentryMatchedCohortCaseFixtureV02.provider_visible
        .authority_notice,
    route_fingerprint: ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
    provider_contract_fingerprint:
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
    adapter_request_route_fingerprint:
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
    model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
    response_bytes: 1168,
    max_output_tokens: 1168,
    final_request_bytes: 24576,
  });
  const entries: OperationalReentryV04StaleResetIsolationPlanEntryV01[] = [];
  for (const block of [0, 1, 2, 3] as const) {
    for (const position of [0, 1, 2, 3] as const) {
      const arm = ACGC_E2R2P6H_SEALED_ORDER_V01[block][position];
      const callOrder = block * 4 + position;
      const callSlotId = `e2r2p6h-call-${String(callOrder).padStart(2, "0")}-${fingerprintV01({
        family: OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
        case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
        call_order: callOrder,
        repeat_block: block,
        position_in_block: position,
        arm,
      }).slice("sha256:".length, "sha256:".length + 12)}`;
      const cohortRef = `acgc-e2r2p6h-${String(block)}-${String(position)}-${arm.toLowerCase()}`;
      let invocation: OperationalReentryMatchedCohortInvocationV04;
      let gateProvenance: OperationalReentryV04StaleResetIsolationGateProvenanceV01 | null = null;
      if (arm === "G") {
        const gated =
          buildOperationalReentryV04StaleResetIsolationGatedInvocationV01({
            cohort_ref: cohortRef,
            call_slot_id: callSlotId,
            repeat_block: block,
          });
        invocation = gated.invocation;
        gateProvenance = gated.provenance;
      } else {
        invocation = buildOperationalReentryMatchedCohortInvocationV04({
          arm,
          cohort_ref: cohortRef,
          call_slot_id: callSlotId,
          block,
        });
      }
      const request =
        projectOperationalReentryMatchedCohortProviderRequestV04(invocation);
      const providerMaterialFingerprint =
        createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
          invocation.provider_material,
        );
      const sourceProvenanceFingerprint =
        gateProvenance?.integrity.fingerprint ??
        fingerprintV01({
          arm,
          case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
          upstream_target:
            arm === "A"
              ? "fresh_exact"
              : arm === "C"
                ? "stale_exact"
                : "absent_at_source",
          stale_relation: arm === "C" ? "exact" : "absent",
        });
      const trace = createDeterministicModelProviderRequestTraceV01({
        request_family_kind: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
        request_family_fingerprint: fingerprintV01({
          family: OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
          case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
          call_order: callOrder,
          local_invocation_identity:
            createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
              invocation,
            ),
        }),
      });
      entries.push({
        call_order: callOrder,
        call_slot_id: callSlotId,
        repeat_block: block,
        position_in_block: position,
        arm,
        cohort_ref: cohortRef,
        local_source_provenance_fingerprint: sourceProvenanceFingerprint,
        local_invocation_identity_fingerprint:
          createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
            invocation,
          ),
        local_manifest_identity_fingerprint: fingerprintV01({
          family: OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
          call_slot_id: callSlotId,
          arm,
        }),
        non_intervention_parity_fingerprint: nonInterventionParity,
        common_task_evidence_fingerprint: fingerprintV01(
          invocation.provider_material.common_task_evidence,
        ),
        provider_material_fingerprint: providerMaterialFingerprint,
        provider_visible_request_fingerprint: request.request_fingerprint,
        schema_fingerprint: request.schema_fingerprint,
        route_fingerprint: ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
        provider_contract_fingerprint:
          ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
        adapter_request_route_fingerprint:
          request.adapter_request_route_fingerprint,
        request_family_trace_id: trace,
        client_request_id: createDeterministicModelClientRequestIdV01({
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
          provider_request_trace_id: trace,
          call_slot_id: callSlotId,
          model: request.model,
        }),
        invocation,
        gate_provenance: gateProvenance,
      });
    }
  }
  validatePlanStructureV01(entries);
  const witnesses = ([0, 1, 2, 3] as const).map((block) =>
    buildBgConformanceWitnessV01(entries, block),
  );
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_plan_without_integrity_fingerprint",
    {
      plan_version: OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01,
      cohort_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
      case_fingerprint: ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
      common_task_evidence_fingerprint:
        ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01,
      gate_contract_fingerprint: gateContract.integrity.fingerprint,
      request_family_kind: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
      planned_calls: 16 as const,
      repeat_blocks: 4 as const,
      calls_per_block: 4 as const,
      calls_per_arm: 4 as const,
      sealed_order: ACGC_E2R2P6H_SEALED_ORDER_V01,
      each_arm_once_per_ordinal_position: true as const,
      maximum_parallel_provider_calls: 1 as const,
      retries: 0 as const,
      replacement_calls: 0 as const,
      adaptive_stopping: false as const,
      fresh_stateless_invocation_per_call: true as const,
      conversation_reuse: false as const,
      thread_reuse: false as const,
      previous_response_reuse: false as const,
      entries,
      bg_conformance_witnesses: witnesses,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationLayerAV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
): OperationalReentryV04StaleResetIsolationLayerAV01 {
  const expectedArm = entry.arm === "G" ? "B" : entry.arm;
  const expected = buildOperationalReentryMatchedCohortInvocationV04({
    arm: expectedArm,
    cohort_ref: `${entry.cohort_ref}-layer-a`,
    call_slot_id: `${entry.call_slot_id}-layer-a`,
    block: entry.repeat_block,
  });
  const providerEqual =
    canonicalizeProtocolValueV01(entry.invocation.provider_material) ===
    canonicalizeProtocolValueV01(expected.provider_material);
  const request = providerEqual
    ? projectOperationalReentryMatchedCohortProviderRequestV04(entry.invocation)
    : null;
  const targetPresent = entry.invocation.provider_material.continuation_context.some(
    (item) => item.role === "target",
  );
  const stalePresent = entry.invocation.provider_material.stale_relation !== null;
  const gValid =
    entry.arm !== "G" ||
    (entry.gate_provenance !== null &&
      entry.gate_provenance.gate_disposition ===
        "excluded_before_materialization" &&
      entry.gate_provenance.target_excluded === true &&
      entry.gate_provenance.stale_relation_excluded === true &&
      entry.gate_provenance.local_provenance_provider_visibility === "absent");
  const protocolValid =
    providerEqual &&
    gValid &&
    request?.request_fingerprint === entry.provider_visible_request_fingerprint &&
    request?.schema_fingerprint === entry.schema_fingerprint &&
    (entry.arm === "A"
      ? targetPresent && !stalePresent
      : entry.arm === "C"
        ? targetPresent && stalePresent
        : !targetPresent && !stalePresent);
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_layer_a_without_integrity_fingerprint",
    {
      layer_version:
        "operational_reentry_v04_stale_reset_isolation_layer_a.v0.1" as const,
      arm: entry.arm,
      status: protocolValid
        ? entry.arm === "B" || entry.arm === "G"
          ? "valid_target_absent_or_gated" as const
          : "valid_target_present" as const
        : "protocol_invalid" as const,
      upstream_target_identity: protocolValid
        ? entry.arm === "B"
          ? "absent" as const
          : "exact_frozen_target" as const
        : "protocol_invalid" as const,
      upstream_stale_relation_identity: protocolValid
        ? entry.arm === "C" || entry.arm === "G"
          ? "exact_frozen_relation" as const
          : "absent" as const
        : "protocol_invalid" as const,
      substrate_gate_disposition: protocolValid
        ? entry.arm === "G"
          ? "excluded_before_materialization" as const
          : "not_applicable" as const
        : "protocol_invalid" as const,
      source_gate_lineage: protocolValid
        ? entry.gate_provenance?.source_gate_lineage_fingerprint ??
          "not_applicable" as const
        : "protocol_invalid" as const,
      provider_projection_shape: protocolValid
        ? (`exact_${expectedArm}` as "exact_A" | "exact_B" | "exact_C")
        : "protocol_invalid" as const,
      provider_target_material: protocolValid
        ? targetPresent
          ? "present" as const
          : "absent" as const
        : "protocol_invalid" as const,
      provider_stale_relation: protocolValid
        ? stalePresent
          ? "present" as const
          : "absent" as const
        : "protocol_invalid" as const,
      provider_material_fingerprint: protocolValid
        ? entry.provider_material_fingerprint
        : "protocol_invalid" as const,
      provider_request_fingerprint: protocolValid
        ? entry.provider_visible_request_fingerprint
        : "protocol_invalid" as const,
      local_provenance_provider_visibility: protocolValid
        ? "absent" as const
        : "present_protocol_invalid" as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationLayerBV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
  output: OperationalReentryMatchedCohortModelOutputV04 | null,
): OperationalReentryV04StaleResetIsolationLayerBV01 {
  if (!output) return unknownLayerBV01(entry.arm);
  const referenced = output.referenced_continuation_tokens.includes(
    TARGET_CONTEXT_TOKEN_V01,
  )
    ? "present" as const
    : "absent" as const;
  const action = output.operation_action_class_tokens.includes(
    "target_linked_verification_preparation",
  )
    ? "present" as const
    : "absent" as const;
  const limitations: Array<
    Exclude<OperationalReentryV04StaleResetIsolationLimitationV01, "absent" | "mixed" | "unknown">
  > = [
    output.result_limitation_tokens.includes("limitation_target_not_available")
      ? "target_not_available"
      : null,
    output.result_limitation_tokens.includes("limitation_stale_target_withheld")
      ? "stale_withheld"
      : null,
    output.result_limitation_tokens.includes("limitation_stale_target_persisted")
      ? "stale_persisted"
      : null,
  ].filter(
    (value): value is Exclude<
      OperationalReentryV04StaleResetIsolationLimitationV01,
      "absent" | "mixed" | "unknown"
    > => value !== null,
  );
  const limitation: OperationalReentryV04StaleResetIsolationLimitationV01 =
    limitations.length > 1
      ? "mixed"
      : limitations[0] ?? "absent";
  const abstention =
    (output.result_status === "review_ready" && output.abstention === false) ||
    (output.result_status === "review_blocked" && output.abstention === true)
      ? "consistent" as const
      : "inconsistent" as const;
  const derivedValid = targetDispositionConsistentV01(
    output.target_disposition,
    referenced,
    action,
    limitation,
  );
  const state = !derivedValid
    ? "protocol_invalid" as const
    : abstention === "inconsistent" || limitation === "mixed"
      ? "not_comparable" as const
      : referenced === "present" ||
          action === "present" ||
          limitation === "stale_persisted"
        ? "bounded_target_persistence_observed" as const
        : "no_target_persistence_observed" as const;
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_layer_b_without_integrity_fingerprint",
    {
      layer_version:
        "operational_reentry_v04_stale_reset_isolation_layer_b.v0.1" as const,
      arm: entry.arm,
      selected_or_referenced_target_identity: referenced,
      target_action_or_decision_preparation: action,
      target_specific_result_limitation: limitation,
      continuation_packet_target_material: referenced,
      target_disposition: output.target_disposition,
      target_specific_required_check_relation:
        "not_available_under_v04" as const,
      target_abstention_relation: abstention,
      independent_directional_observation_count: 3 as const,
      derived_aliases_add_weight: false as const,
      action_and_decision_preparation_counted_once: true as const,
      state,
    },
  );
}

export function validateOperationalReentryV04StaleResetIsolationLayerBV01(
  value: OperationalReentryV04StaleResetIsolationLayerBV01,
): "valid" | "protocol_invalid" | "not_comparable" {
  const { integrity, ...payload } = value;
  if (
    integrity.fingerprint !== fingerprintV01(payload) ||
    value.independent_directional_observation_count !== 3 ||
    value.derived_aliases_add_weight !== false ||
    value.action_and_decision_preparation_counted_once !== true ||
    value.continuation_packet_target_material !==
      value.selected_or_referenced_target_identity ||
    value.target_specific_required_check_relation !==
      "not_available_under_v04" ||
    (value.target_disposition !== "unknown" &&
      value.target_disposition !== "protocol_invalid" &&
      !targetDispositionConsistentV01(
        value.target_disposition,
        value.selected_or_referenced_target_identity,
        value.target_action_or_decision_preparation,
        value.target_specific_result_limitation,
      ))
  ) {
    return "protocol_invalid";
  }
  if (
    value.target_abstention_relation === "inconsistent" ||
    value.target_specific_result_limitation === "mixed" ||
    value.state === "not_comparable"
  ) return "not_comparable";
  if (value.state === "protocol_invalid") return "protocol_invalid";
  return "valid";
}

export function deriveOperationalReentryV04StaleResetIsolationPairV01(
  left: OperationalReentryV04StaleResetIsolationObservedArmV01,
  right: OperationalReentryV04StaleResetIsolationObservedArmV01,
): OperationalReentryV04StaleResetIsolationPairEvaluationV01 {
  const pairId = pairIdV01(left.entry.arm, right.entry.arm);
  const leftLayerA =
    left.layer_a ??
    buildOperationalReentryV04StaleResetIsolationLayerAV01(left.entry);
  const rightLayerA =
    right.layer_a ??
    buildOperationalReentryV04StaleResetIsolationLayerAV01(right.entry);
  const leftLayerB =
    left.layer_b ??
    buildOperationalReentryV04StaleResetIsolationLayerBV01(
      left.entry,
      left.normalized_output,
    );
  const rightLayerB =
    right.layer_b ??
    buildOperationalReentryV04StaleResetIsolationLayerBV01(
      right.entry,
      right.normalized_output,
    );
  const leftCommon = commonComplianceV01(left);
  const rightCommon = commonComplianceV01(right);
  const base = {
    pair_version:
      "operational_reentry_v04_stale_reset_isolation_pair.v0.1" as const,
    pair_id: pairId,
    direct_evaluation: true as const,
    inferred_transitively: false as const,
    hypothesis_label: hypothesisForPairV01(pairId),
    left_arm: left.entry.arm,
    right_arm: right.entry.arm,
    left_layer_a_status: leftLayerA.status,
    right_layer_a_status: rightLayerA.status,
    left_common_compliance: leftCommon.status,
    right_common_compliance: rightCommon.status,
    scalar_score_created: false as const,
    rank_or_winner_created: false as const,
  };
  const emptyDimensions = {
    selected_or_referenced_target_identity: "not_comparable" as const,
    target_action_or_decision_preparation: "not_comparable" as const,
    target_specific_result_limitation: "not_comparable" as const,
  };
  if (
    [leftLayerA.status, rightLayerA.status].includes("protocol_invalid") ||
    !layerAIntegrityValidV01(leftLayerA) ||
    !layerAIntegrityValidV01(rightLayerA)
  ) {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "protocol_invalid" as const,
      dimension_relations: emptyDimensions,
      target_persistence_relation: "protocol_invalid" as const,
      whole_output_behavioral_relation: "not_comparable" as const,
      common_compliance_relation: "unknown" as const,
      bounded_outcome_relation: "not_comparable" as const,
    });
  }
  if (
    left.entry.non_intervention_parity_fingerprint !==
    right.entry.non_intervention_parity_fingerprint
  ) {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "not_comparable" as const,
      dimension_relations: emptyDimensions,
      target_persistence_relation: "not_comparable" as const,
      whole_output_behavioral_relation: "not_comparable" as const,
      common_compliance_relation: "unknown" as const,
      bounded_outcome_relation: "not_comparable" as const,
    });
  }
  const leftLayerBValidation =
    validateOperationalReentryV04StaleResetIsolationLayerBV01(leftLayerB);
  const rightLayerBValidation =
    validateOperationalReentryV04StaleResetIsolationLayerBV01(rightLayerB);
  if (
    leftLayerBValidation === "protocol_invalid" ||
    rightLayerBValidation === "protocol_invalid"
  ) {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "protocol_invalid" as const,
      dimension_relations: emptyDimensions,
      target_persistence_relation: "protocol_invalid" as const,
      whole_output_behavioral_relation: "not_comparable" as const,
      common_compliance_relation: "unknown" as const,
      bounded_outcome_relation: "not_comparable" as const,
    });
  }
  if (
    leftLayerBValidation === "not_comparable" ||
    rightLayerBValidation === "not_comparable"
  ) {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "not_comparable" as const,
      dimension_relations: emptyDimensions,
      target_persistence_relation: "not_comparable" as const,
      whole_output_behavioral_relation: "not_comparable" as const,
      common_compliance_relation: "unknown" as const,
      bounded_outcome_relation: "not_comparable" as const,
    });
  }
  if (leftCommon.status === "invalid" && rightCommon.status === "invalid") {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "not_comparable" as const,
      dimension_relations: emptyDimensions,
      target_persistence_relation: "not_comparable" as const,
      whole_output_behavioral_relation: "not_comparable" as const,
      common_compliance_relation: "both_invalid" as const,
      bounded_outcome_relation: "not_comparable" as const,
    });
  }
  if (leftCommon.status !== rightCommon.status && ![leftCommon.status, rightCommon.status].includes("unknown")) {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "compliance_asymmetry" as const,
      dimension_relations: emptyDimensions,
      target_persistence_relation: "compliance_asymmetry" as const,
      whole_output_behavioral_relation: "not_comparable" as const,
      common_compliance_relation: "compliance_asymmetry" as const,
      bounded_outcome_relation: "not_comparable" as const,
    });
  }
  if (leftCommon.status === "unknown" || rightCommon.status === "unknown") {
    return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
      ...base,
      comparison_status: "unknown" as const,
      dimension_relations: {
        selected_or_referenced_target_identity: "unknown" as const,
        target_action_or_decision_preparation: "unknown" as const,
        target_specific_result_limitation: "unknown" as const,
      },
      target_persistence_relation: "unknown" as const,
      whole_output_behavioral_relation: "unknown" as const,
      common_compliance_relation: "unknown" as const,
      bounded_outcome_relation: "unknown" as const,
    });
  }
  const dimensionRelations = {
    selected_or_referenced_target_identity: comparePresenceV01(
      leftLayerB.selected_or_referenced_target_identity,
      rightLayerB.selected_or_referenced_target_identity,
    ),
    target_action_or_decision_preparation: comparePresenceV01(
      leftLayerB.target_action_or_decision_preparation,
      rightLayerB.target_action_or_decision_preparation,
    ),
    target_specific_result_limitation: compareLimitationV01(
      leftLayerB.target_specific_result_limitation,
      rightLayerB.target_specific_result_limitation,
    ),
  };
  const targetRelation = aggregateDimensionRelationsV01(
    Object.values(dimensionRelations),
  );
  return sealV01("operational_reentry_v04_stale_reset_isolation_pair_without_integrity_fingerprint", {
    ...base,
    comparison_status:
      targetRelation === "unknown"
        ? "unknown" as const
        : targetRelation === "not_comparable"
          ? "not_comparable" as const
          : "comparable" as const,
    dimension_relations: dimensionRelations,
    target_persistence_relation: targetRelation,
    whole_output_behavioral_relation:
      left.normalized_output && right.normalized_output
        ? canonicalizeProtocolValueV01(left.normalized_output) ===
          canonicalizeProtocolValueV01(right.normalized_output)
          ? "equal" as const
          : "distinct" as const
        : "unknown" as const,
    common_compliance_relation: "both_valid" as const,
    bounded_outcome_relation: boundedOutcomeRelationV01(leftCommon, rightCommon),
  });
}

export function evaluateOperationalReentryV04StaleResetIsolationBlockV01(
  block: OperationalReentryV04StaleResetIsolationBlockV01,
  observed: OperationalReentryV04StaleResetIsolationObservedArmV01[],
): OperationalReentryV04StaleResetIsolationBlockEvaluationV01 {
  const byArm = new Map(observed.map((item) => [item.entry.arm, item] as const));
  const complete =
    observed.length === 4 &&
    byArm.size === 4 &&
    (["A", "B", "C", "G"] as const).every((arm) => byArm.has(arm));
  const ordered = complete
    ? (["A", "B", "C", "G"] as const).map((arm) => byArm.get(arm)!)
    : observed;
  const layerA = ordered.map(
    (item) =>
      item.layer_a ??
      buildOperationalReentryV04StaleResetIsolationLayerAV01(item.entry),
  );
  const layerB = ordered.map(
    (item) =>
      item.layer_b ??
      buildOperationalReentryV04StaleResetIsolationLayerBV01(
        item.entry,
        item.normalized_output,
      ),
  );
  const pairEvaluations = complete
    ? ACGC_E2R2P6H_DIRECT_PAIRS_V01.map(([left, right]) =>
        deriveOperationalReentryV04StaleResetIsolationPairV01(
          byArm.get(left)!,
          byArm.get(right)!,
        ),
      )
    : [];
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_block_evaluation_without_integrity_fingerprint",
    {
      evaluator_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
      repeat_block: block,
      status: complete ? "complete" as const : "incomplete" as const,
      layer_a: layerA,
      layer_b: layerB,
      pair_evaluations: pairEvaluations,
      all_six_pairs_evaluated_directly:
        complete &&
        pairEvaluations.length === 6 &&
        pairEvaluations.every(
          (pair) => pair.direct_evaluation && !pair.inferred_transitively,
        ),
      pair_results_inferred_transitively: false as const,
      deterministic_no_score_aggregation: true as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationPricingV01(
  input: {
    admission: ModelGatewayInteractiveAdmissionV01;
    route: OperationalReentryMatchedCohortRouteV04;
    evaluated_at: string;
    pricing_source_version: string;
    pricing_effective_at: string;
    pricing_expires_at: string;
    input_nano_usd_per_token: number;
    cached_input_nano_usd_per_token: number;
    output_nano_usd_per_token: number;
  },
): OperationalReentryV04StaleResetIsolationPricingV01 {
  assertExactRouteV01(input.route);
  if (
    !SAFE_ID_V01.test(input.pricing_source_version) ||
    !nonnegativeSafeIntegerV01(input.input_nano_usd_per_token) ||
    !nonnegativeSafeIntegerV01(input.cached_input_nano_usd_per_token) ||
    !nonnegativeSafeIntegerV01(input.output_nano_usd_per_token)
  ) failV01("operational_reentry_v04_stale_reset_pricing_invalid");
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    cost_unit: "nano_usd",
    input_rate: {
      unit: "utf8_byte",
      cost_per_unit: input.input_nano_usd_per_token,
    },
    output_rate: {
      unit: "token",
      cost_per_unit: input.output_nano_usd_per_token,
    },
    pricing_source_version: input.pricing_source_version,
    pricing_effective_at: input.pricing_effective_at,
    pricing_expires_at: input.pricing_expires_at,
    project_model_policy_fingerprint: input.route.integrity_fingerprint,
  });
  const budget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units: 24_576,
    maximum_output_units: 1_168,
    timeout_ms: 30_000,
    maximum_permitted_cost: ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01,
    evaluated_at: input.evaluated_at,
  });
  assertModelGatewayCostBudgetCurrentV01(budget, input.evaluated_at);
  const aggregate = budget.calculated_worst_case_cost * 16;
  if (
    budget.calculated_worst_case_cost !==
      ACGC_E2R2P6H_PER_CALL_WORST_CASE_NANO_USD_V01 ||
    aggregate !== ACGC_E2R2P6H_AGGREGATE_WORST_CASE_NANO_USD_V01 ||
    aggregate > ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01
  ) failV01("operational_reentry_v04_stale_reset_cost_ceiling_exceeded");
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_pricing_without_integrity_fingerprint",
    {
      pricing_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01,
      pricing_snapshot_authority:
        "future_live_issue_must_refresh_official_pricing" as const,
      pricing_source_version: input.pricing_source_version,
      pricing_snapshot_evaluated_at: input.evaluated_at,
      pricing_authority_expires_at: input.pricing_expires_at,
      pricing_authority_fingerprint: authority.pricing_fingerprint,
      input_nano_usd_per_token: input.input_nano_usd_per_token,
      cached_input_nano_usd_per_token:
        input.cached_input_nano_usd_per_token,
      output_nano_usd_per_token: input.output_nano_usd_per_token,
      exact_cost_basis: "validated_provider_reported_token_usage" as const,
      missing_exact_usage_or_cost: "unknown_never_zero" as const,
      gateway_cost_budget: budget,
      per_call_conservative_worst_case_nano_usd:
        budget.calculated_worst_case_cost,
      aggregate_conservative_worst_case_nano_usd: aggregate,
      maximum_total_cost_nano_usd:
        ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01,
      static_harness_is_live_pricing_authority: false as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationAuthorizationContractV01() {
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_authorization_contract_without_integrity_fingerprint",
    {
      authorization_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
      authorization_kind:
        "one_bounded_operational_reentry_v04_stale_reset_isolation_cohort" as const,
      future_live_issue_number_required_as_gate_a_input: true as const,
      implementation_issue_number_forbidden: ACGC_E2R2P6H_ISSUE_NUMBER_V01,
      exact_future_merged_source_head_required: true as const,
      exact_gateway_admission_required: true as const,
      current_pricing_authority_required: true as const,
      bound_identity_fields: [
        "repository_slug",
        "authorized_origin",
        "workspace_id",
        "project_id",
        "expected_active_selection_revision",
        "project_root_fingerprint",
        "case_fingerprint",
        "common_task_evidence_fingerprint",
        "g_gate_provenance_contract_fingerprint",
        "sealed_plan_fingerprint",
        "evaluator_fingerprint",
        "bg_static_conformance_witness_fingerprint",
        "route_fingerprint",
        "provider_contract_fingerprint",
        "adapter_request_route_fingerprint",
        "codec_version",
        "response_schema_version",
        "parser_version",
        "adapter_implementation_id",
        "adapter_implementation_version",
        "model",
        "response_bytes",
        "max_output_tokens",
        "final_request_bytes",
        "request_family",
        "pricing_snapshot_fingerprint",
        "pricing_authority_fingerprint",
        "aggregate_worst_case_cost_nano_usd",
      ] as const,
      planned_calls: 16 as const,
      repeat_blocks: 4 as const,
      calls_per_arm: 4 as const,
      maximum_parallel_provider_calls: 1 as const,
      retries: 0 as const,
      replacements: 0 as const,
      adaptive_changes: 0 as const,
      fresh_stateless_invocation_per_call: true as const,
      conversation_reuse: false as const,
      thread_reuse: false as const,
      previous_response_reuse: false as const,
      maximum_total_cost_nano_usd:
        ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01,
      historical_authorization_reuse: false as const,
      second_cohort_under_same_authorization: false as const,
      replication: false as const,
      policy: false as const,
      stage_7: false as const,
      constructing_or_validating_contract_creates_live_authorization:
        false as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationAuthorizationV01(
  input: Omit<
    OperationalReentryV04StaleResetIsolationAuthorizationV01,
    | "authorization_version"
    | "authorization_kind"
    | "request_family_kind"
    | "request_family"
    | "integrity"
  >,
): OperationalReentryV04StaleResetIsolationAuthorizationV01 {
  const authorization = sealV01(
    "operational_reentry_v04_stale_reset_isolation_authorization_without_integrity_fingerprint",
    {
      authorization_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
      authorization_kind:
        "one_bounded_operational_reentry_v04_stale_reset_isolation_cohort" as const,
      request_family_kind: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
      request_family: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
      ...structuredClone(input),
    },
  );
  validateAuthorizationShapeV01(authorization);
  return authorization;
}

export function buildOperationalReentryV04StaleResetIsolationHarnessContractV01() {
  const gate = buildOperationalReentryV04StaleResetIsolationGateContractV01();
  const evaluator =
    buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01();
  const plan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const authorizationContract =
    buildOperationalReentryV04StaleResetIsolationAuthorizationContractV01();
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_harness_contract_without_integrity_fingerprint",
    {
      cohort_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
      plan_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PLAN_VERSION_V01,
      evaluator_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_EVALUATOR_VERSION_V01,
      authorization_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01,
      pricing_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01,
      manifest_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
      report_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01,
      artifact_index_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_ARTIFACT_INDEX_VERSION_V01,
      request_family_kind: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
      gate_contract_fingerprint: gate.integrity.fingerprint,
      evaluator_fingerprint: evaluator.integrity.fingerprint,
      authorization_contract_fingerprint:
        authorizationContract.integrity.fingerprint,
      plan_fingerprint: plan.integrity.fingerprint,
      bg_static_conformance_witness_fingerprint:
        bgWitnessAggregateFingerprintV01(plan),
      provider_contract_verdict: "reuse_v04_exact" as const,
      prepared_without_provider_egress: true as const,
      live_behavioral_result: "none" as const,
      real_provider_calls: 0 as const,
    },
  );
}

export function buildOperationalReentryV04StaleResetIsolationCohortV01(
  input: BuildOperationalReentryV04StaleResetIsolationInputV01,
): OperationalReentryV04StaleResetIsolationPreparedV01 {
  assertExactRouteV01(input.route);
  const plan = buildOperationalReentryV04StaleResetIsolationPlanV01();
  const gate = buildOperationalReentryV04StaleResetIsolationGateContractV01();
  const evaluator =
    buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01();
  const pricing = validatePricingV01(input.pricing, input.evaluated_at);
  const authorization = validateAuthorizationV01(input.authorization, {
    input,
    plan,
    gate,
    evaluator,
    pricing,
  });
  const cohortId = `operational-reentry-v04-stale-reset-isolation_${fingerprintV01({
    authorization_fingerprint: authorization.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
  }).slice("sha256:".length, "sha256:".length + 32)}`;
  const manifest = sealV01(
    "operational_reentry_v04_stale_reset_isolation_manifest_without_integrity_fingerprint",
    {
      manifest_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_MANIFEST_VERSION_V01,
      cohort_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_COHORT_VERSION_V01,
      cohort_id: cohortId,
      future_live_issue_number: authorization.future_live_issue_number,
      source_repository_head_sha: authorization.exact_merged_source_head,
      authorization_fingerprint: authorization.integrity.fingerprint,
      case_fingerprint: plan.case_fingerprint,
      common_task_evidence_fingerprint:
        plan.common_task_evidence_fingerprint,
      gate_contract_fingerprint: gate.integrity.fingerprint,
      plan_fingerprint: plan.integrity.fingerprint,
      evaluator_fingerprint: evaluator.integrity.fingerprint,
      bg_static_conformance_witness_fingerprint:
        bgWitnessAggregateFingerprintV01(plan),
      route: structuredClone(input.route),
      provider_contract_fingerprint:
        ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
      adapter_request_route_fingerprint:
        ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
      pricing_fingerprint: pricing.integrity.fingerprint,
      request_family_kind: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
      provider_egress:
        "allow_only_with_supplied_future_authorization" as const,
      data_classification: "public_safe" as const,
      retention_class: "none" as const,
      raw_prompt_persisted: false as const,
      raw_request_body_persisted: false as const,
      raw_provider_response_persisted: false as const,
      raw_provider_error_persisted: false as const,
      hidden_reasoning_persisted: false as const,
      credentials_or_full_headers_persisted: false as const,
    },
  );
  return { authorization, pricing, gate_contract: gate, evaluator_contract: evaluator, plan, manifest };
}

export function buildOperationalReentryV04StaleResetIsolationModelInvocationEnvelopeV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
  prepared: OperationalReentryV04StaleResetIsolationPreparedV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: "model_invocation_envelope.v0.1" as const,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id: entry.request_family_trace_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      prepared.plan.case_fingerprint,
      prepared.plan.integrity.fingerprint,
      prepared.gate_contract.integrity.fingerprint,
      prepared.evaluator_contract.integrity.fingerprint,
      entry.local_invocation_identity_fingerprint,
      entry.provider_material_fingerprint,
      entry.schema_fingerprint,
    ],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
    budget: {
      max_input_bytes: 24_576,
      max_output_tokens: 1_168,
      max_provider_calls: 1 as const,
      cost_budget: prepared.pricing.gateway_cost_budget,
    },
    timeout_ms: 30_000,
    cancellation: { signal: cancellation },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision:
        admission.expected_active_selection_revision,
    },
    project_root: structuredClone(admission.project_root),
    input: structuredClone(entry.invocation),
  };
}

export async function runOperationalReentryV04StaleResetIsolationCohortV01(
  input: BuildOperationalReentryV04StaleResetIsolationInputV01,
  dependencies: RunOperationalReentryV04StaleResetIsolationDependenciesV01,
): Promise<OperationalReentryV04StaleResetIsolationExecutionResultV01> {
  if (
    !dependencies ||
    typeof dependencies.assert_execution_state !== "function" ||
    typeof dependencies.consume_authorization !== "function"
  ) failV01("operational_reentry_v04_stale_reset_runtime_dependencies_missing");
  const prepared = buildOperationalReentryV04StaleResetIsolationCohortV01(input);
  const invoke =
    dependencies.invoke_gateway ??
    invokeOperationalReentryMatchedCohortModelGatewayV04;
  const cancellation =
    dependencies.cancellation_signal ?? new AbortController().signal;
  const calls: OperationalReentryV04StaleResetIsolationCallTerminalV01[] = [];
  let consumed = false;
  let hardStop = false;
  for (const entry of prepared.plan.entries) {
    if (hardStop) {
      const terminal = terminalV01(
        entry,
        "not_attempted_after_hard_stop",
        null,
        null,
        "operational_reentry_v04_stale_reset_hard_stop",
        prepared,
      );
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      continue;
    }
    try {
      await dependencies.assert_execution_state(entry);
      if (!consumed) {
        dependencies.consume_authorization({
          authorization: prepared.authorization,
          cohort_id: prepared.manifest.cohort_id,
        });
        consumed = true;
      }
      const result = await invoke(
        buildOperationalReentryV04StaleResetIsolationModelInvocationEnvelopeV01(
          entry,
          prepared,
          input.admission,
          cancellation,
        ),
        {
          ...dependencies.gateway_dependencies,
          expected_operational_reentry_matched_cohort_v04_route: input.route,
        },
      );
      const terminal = terminalV01(
        entry,
        "completed_live",
        result.output,
        result.model_invocation_receipt,
        null,
        prepared,
      );
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
    } catch (error) {
      const receipt = isModelGatewayInvocationErrorV01(error)
        ? error.receipt
        : null;
      const terminal = terminalV01(
        entry,
        classifyRuntimeFailureV01(error),
        null,
        receipt,
        boundedFailureCodeV01(error),
        prepared,
      );
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      hardStop = true;
    }
  }
  const blocks: OperationalReentryV04StaleResetIsolationBlockEvaluationV01[] = [];
  for (const block of [0, 1, 2, 3] as const) {
    const observed = calls
      .filter(
        (call) => call.repeat_block === block && call.normalized_output !== null,
      )
      .map((call) => ({
        entry: prepared.plan.entries[call.call_order]!,
        normalized_output: call.normalized_output,
      }));
    const evaluation =
      evaluateOperationalReentryV04StaleResetIsolationBlockV01(
        block,
        observed,
      );
    blocks.push(evaluation);
    await dependencies.on_block_evaluation?.(evaluation);
  }
  const completeBlocks = blocks.filter((block) => block.status === "complete").length;
  const attempted = calls.filter((call) => call.egress_attempted).length;
  const report = sealV01(
    "operational_reentry_v04_stale_reset_isolation_report_without_integrity_fingerprint",
    {
      report_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_REPORT_VERSION_V01,
      cohort_id: prepared.manifest.cohort_id,
      completion_status:
        completeBlocks === 4 ? "complete" as const : "incomplete" as const,
      planned_calls: 16 as const,
      terminal_call_records: 16 as const,
      attempted_provider_calls: attempted,
      complete_blocks: completeBlocks,
      all_six_pair_records: blocks.reduce(
        (total, block) => total + block.pair_evaluations.length,
        0,
      ),
      authorization_consumed: consumed,
      behavioral_result:
        completeBlocks === 4
          ? "bounded_structured_observations_only" as const
          : "none" as const,
      real_provider_calls: attempted,
      retries: 0 as const,
      replacement_calls: 0 as const,
      replication_authorized: false as const,
      policy_authorized: false as const,
      stage_7_authorized: false as const,
      product_database_writes: 0 as const,
      core_writes: 0 as const,
    },
  );
  return { ...prepared, calls, blocks, report };
}

export function projectOperationalReentryV04StaleResetIsolationPlanForArtifactV01(
  plan: OperationalReentryV04StaleResetIsolationPlanV01,
) {
  return {
    ...structuredClone(plan),
    entries: plan.entries.map(
      ({ invocation: _invocation, gate_provenance, ...entry }) => ({
        ...structuredClone(entry),
        gate_provenance_fingerprint:
          gate_provenance?.integrity.fingerprint ?? null,
        provider_visible_input_persisted: false as const,
        raw_request_body_persisted: false as const,
      }),
    ),
  };
}

function buildBgConformanceWitnessV01(
  entries: OperationalReentryV04StaleResetIsolationPlanEntryV01[],
  block: OperationalReentryV04StaleResetIsolationBlockV01,
): OperationalReentryV04StaleResetIsolationBgConformanceWitnessV01 {
  const b = entries.find(
    (entry) => entry.repeat_block === block && entry.arm === "B",
  );
  const g = entries.find(
    (entry) => entry.repeat_block === block && entry.arm === "G",
  );
  if (!b || !g || !g.gate_provenance) {
    failV01("operational_reentry_v04_stale_reset_bg_witness_missing");
  }
  const bRequest = projectOperationalReentryMatchedCohortProviderRequestV04(
    b.invocation,
  );
  const gRequest = projectOperationalReentryMatchedCohortProviderRequestV04(
    g.invocation,
  );
  const bBody = JSON.parse(bRequest.request_body) as Record<string, any>;
  const gBody = JSON.parse(gRequest.request_body) as Record<string, any>;
  const distinct =
    b.arm !== g.arm &&
    b.local_source_provenance_fingerprint !==
      g.local_source_provenance_fingerprint &&
    b.cohort_ref !== g.cohort_ref &&
    b.call_slot_id !== g.call_slot_id &&
    b.local_invocation_identity_fingerprint !==
      g.local_invocation_identity_fingerprint &&
    b.request_family_trace_id !== g.request_family_trace_id &&
    b.client_request_id !== g.client_request_id &&
    b.local_manifest_identity_fingerprint !==
      g.local_manifest_identity_fingerprint;
  const equal =
    canonicalizeProtocolValueV01(b.invocation.provider_material) ===
      canonicalizeProtocolValueV01(g.invocation.provider_material) &&
    b.provider_material_fingerprint === g.provider_material_fingerprint &&
    bRequest.request_body === gRequest.request_body &&
    bRequest.request_fingerprint === gRequest.request_fingerprint &&
    bRequest.schema_fingerprint === gRequest.schema_fingerprint &&
    bRequest.adapter_request_route_fingerprint ===
      gRequest.adapter_request_route_fingerprint &&
    bRequest.provider === gRequest.provider &&
    bRequest.model === gRequest.model &&
    bRequest.adapter_implementation_id === gRequest.adapter_implementation_id &&
    bRequest.adapter_implementation_version ===
      gRequest.adapter_implementation_version &&
    bRequest.provider_contract_version ===
      gRequest.provider_contract_version &&
    bRequest.response_schema_version === gRequest.response_schema_version &&
    bRequest.parser_version === gRequest.parser_version &&
    b.route_fingerprint === g.route_fingerprint &&
    b.route_fingerprint === ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 &&
    b.provider_contract_fingerprint === g.provider_contract_fingerprint &&
    b.provider_contract_fingerprint ===
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 &&
    canonicalizeProtocolValueV01(bBody.input?.[0]) ===
      canonicalizeProtocolValueV01(gBody.input?.[0]) &&
    canonicalizeProtocolValueV01(bBody.input?.[1]) ===
      canonicalizeProtocolValueV01(gBody.input?.[1]) &&
    canonicalizeProtocolValueV01(bBody.text?.format?.schema) ===
      canonicalizeProtocolValueV01(gBody.text?.format?.schema) &&
    bBody.text?.format?.name === gBody.text?.format?.name &&
    bBody.model === gBody.model &&
    bBody.max_output_tokens === gBody.max_output_tokens &&
    bBody.max_output_tokens === 1168 &&
    bBody.store === false &&
    gBody.store === false;
  assertGProvenanceProviderInvisibleV01(
    g.invocation,
    gRequest.request_body,
    g.gate_provenance,
  );
  if (!distinct || !equal) {
    failV01("operational_reentry_v04_stale_reset_bg_witness_invalid");
  }
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_bg_conformance_without_integrity_fingerprint",
    {
      conformance_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_CONFORMANCE_VERSION_V01,
      repeat_block: block,
      left_arm: "B" as const,
      right_arm: "G" as const,
      experimental_arms_distinct: true as const,
      local_source_provenance_distinct: true as const,
      local_cohort_refs_distinct: true as const,
      local_call_slot_ids_distinct: true as const,
      local_invocation_identities_distinct: true as const,
      request_family_trace_ids_distinct: true as const,
      client_request_ids_distinct: true as const,
      local_manifest_identities_distinct: true as const,
      provider_material_equal: true as const,
      provider_material_fingerprint_equal: true as const,
      endpoint_equal: true as const,
      http_method_equal: true as const,
      model_equal: true as const,
      system_prompt_equal: true as const,
      dynamic_user_material_equal: true as const,
      strict_response_schema_equal: true as const,
      schema_name_equal: true as const,
      max_output_tokens_equal: true as const,
      store_false_equal: true as const,
      openai_json_request_body_bytes_equal: true as const,
      provider_visible_request_fingerprint_equal: true as const,
      schema_fingerprint_equal: true as const,
      provider_contract_identity_equal: true as const,
      route_fingerprint_equal: true as const,
      adapter_request_route_fingerprint_equal: true as const,
      request_response_budget_identity_equal: true as const,
      g_provenance_provider_visibility: "absent" as const,
      provider_material_fingerprint: b.provider_material_fingerprint,
      provider_visible_request_fingerprint:
        b.provider_visible_request_fingerprint,
    },
  );
}

function validatePlanStructureV01(
  entries: OperationalReentryV04StaleResetIsolationPlanEntryV01[],
): void {
  if (
    entries.length !== 16 ||
    new Set(entries.map((entry) => entry.call_slot_id)).size !== 16 ||
    new Set(entries.map((entry) => entry.request_family_trace_id)).size !== 16 ||
    new Set(entries.map((entry) => entry.client_request_id)).size !== 16 ||
    entries.some(
      (entry, index) =>
        entry.call_order !== index ||
        entry.repeat_block !== Math.floor(index / 4) ||
        entry.position_in_block !== index % 4 ||
        entry.arm !==
          ACGC_E2R2P6H_SEALED_ORDER_V01[entry.repeat_block][
            entry.position_in_block
          ] ||
        entry.common_task_evidence_fingerprint !==
          ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01 ||
        entry.adapter_request_route_fingerprint !==
          ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
        entry.route_fingerprint !== ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 ||
        entry.provider_contract_fingerprint !==
          ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
    )
  ) failV01("operational_reentry_v04_stale_reset_plan_invalid");
  for (const arm of ["A", "B", "C", "G"] as const) {
    const armEntries = entries.filter((entry) => entry.arm === arm);
    if (
      armEntries.length !== 4 ||
      new Set(armEntries.map((entry) => entry.position_in_block)).size !== 4
    ) failV01("operational_reentry_v04_stale_reset_plan_balance_invalid");
  }
}

function layerAIntegrityValidV01(
  value: OperationalReentryV04StaleResetIsolationLayerAV01,
): boolean {
  const { integrity, ...payload } = value;
  return (
    integrity.fingerprint === fingerprintV01(payload) &&
    value.status !== "protocol_invalid" &&
    value.local_provenance_provider_visibility === "absent"
  );
}

function commonComplianceV01(
  observed: OperationalReentryV04StaleResetIsolationObservedArmV01,
): {
  status: "valid" | "invalid" | "unknown";
  evaluation: OperationalReentryMatchedCohortArmEvaluationV02 | null;
} {
  if (!observed.normalized_output) return { status: "unknown", evaluation: null };
  const modelInput: OperationalReentryMatchedCohortModelInputV02 = {
    input_kind: "operational_reentry_matched_cohort_v02",
    codec_version: "operational_reentry_matched_cohort_codec.v0.3",
    invocation_context: {
      cohort_ref: observed.entry.cohort_ref,
      call_slot_id: observed.entry.call_slot_id,
      repeat_block: observed.entry.repeat_block,
    },
    ...structuredClone(observed.entry.invocation.provider_material),
    allowed_output: {
      ...structuredClone(observed.entry.invocation.provider_material.allowed_output),
      target_dispositions:
        operationalReentryMatchedCohortCaseFixtureV02.provider_visible
          .allowed_output.target_dispositions,
    },
  };
  const evaluation = evaluateOperationalReentryMatchedCohortArmV02({
    arm: observed.entry.arm === "G" ? "B" : observed.entry.arm,
    call_slot_id: observed.entry.call_slot_id,
    model_input: modelInput,
    normalized_output: observed.normalized_output,
  } satisfies OperationalReentryMatchedCohortObservedArmV02);
  return { status: evaluation.common_compliance, evaluation };
}

function boundedOutcomeRelationV01(
  left: ReturnType<typeof commonComplianceV01>,
  right: ReturnType<typeof commonComplianceV01>,
): OperationalReentryV04StaleResetIsolationPairEvaluationV01["bounded_outcome_relation"] {
  if (!left.evaluation || !right.evaluation) return "unknown";
  const leftPass =
    left.evaluation.bounded_outcome_dimensions[0]?.result === "pass";
  const rightPass =
    right.evaluation.bounded_outcome_dimensions[0]?.result === "pass";
  if (leftPass === rightPass) return "equal";
  return leftPass
    ? "left_only_passes_declared_dimensions"
    : "right_only_passes_declared_dimensions";
}

function comparePresenceV01(
  left: OperationalReentryV04StaleResetIsolationPresenceV01,
  right: OperationalReentryV04StaleResetIsolationPresenceV01,
): OperationalReentryV04StaleResetIsolationDimensionRelationV01 {
  if (left === "protocol_invalid" || right === "protocol_invalid") {
    return "not_comparable";
  }
  if (left === "unknown" || right === "unknown") return "unknown";
  if (left === right) return "equal";
  return left === "present" ? "left_more_persistent" : "right_more_persistent";
}

function compareLimitationV01(
  left: OperationalReentryV04StaleResetIsolationLimitationV01,
  right: OperationalReentryV04StaleResetIsolationLimitationV01,
): OperationalReentryV04StaleResetIsolationDimensionRelationV01 {
  if ([left, right].includes("mixed") || [left, right].includes("protocol_invalid")) {
    return "not_comparable";
  }
  if ([left, right].includes("unknown")) return "unknown";
  const persists = (value: OperationalReentryV04StaleResetIsolationLimitationV01) =>
    value === "stale_persisted";
  if (persists(left) === persists(right)) return "equal";
  return persists(left) ? "left_more_persistent" : "right_more_persistent";
}

function aggregateDimensionRelationsV01(
  relations: OperationalReentryV04StaleResetIsolationDimensionRelationV01[],
): OperationalReentryV04StaleResetIsolationTargetPersistenceRelationV01 {
  if (relations.includes("not_comparable")) return "not_comparable";
  if (relations.includes("unknown")) return "unknown";
  const left = relations.includes("left_more_persistent");
  const right = relations.includes("right_more_persistent");
  if (left && right) return "mixed";
  if (left) return "left_persists_more";
  if (right) return "right_persists_more";
  return "equal";
}

function targetDispositionConsistentV01(
  disposition: OperationalReentryMatchedCohortModelOutputV04["target_disposition"],
  reference: OperationalReentryV04StaleResetIsolationPresenceV01,
  action: OperationalReentryV04StaleResetIsolationPresenceV01,
  limitation: OperationalReentryV04StaleResetIsolationLimitationV01,
): boolean {
  if (
    [reference, action].includes("unknown") ||
    [reference, action].includes("protocol_invalid") ||
    [limitation].includes("unknown") ||
    [limitation].includes("protocol_invalid")
  ) return false;
  switch (disposition) {
    case "not_available":
    case "not_referenced":
      return reference === "absent" && action === "absent" && limitation !== "stale_persisted";
    case "reference_only":
      return reference === "present" && action === "absent";
    case "applied_to_structure":
      return action === "present";
    case "withheld_stale":
      return reference === "absent" && action === "absent" && limitation !== "stale_persisted";
    case "stale_persisted":
      return reference === "present" || action === "present" || limitation === "stale_persisted";
  }
}

function unknownLayerBV01(
  arm: OperationalReentryV04StaleResetIsolationArmV01,
): OperationalReentryV04StaleResetIsolationLayerBV01 {
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_layer_b_without_integrity_fingerprint",
    {
      layer_version:
        "operational_reentry_v04_stale_reset_isolation_layer_b.v0.1" as const,
      arm,
      selected_or_referenced_target_identity: "unknown" as const,
      target_action_or_decision_preparation: "unknown" as const,
      target_specific_result_limitation: "unknown" as const,
      continuation_packet_target_material: "unknown" as const,
      target_disposition: "unknown" as const,
      target_specific_required_check_relation:
        "not_available_under_v04" as const,
      target_abstention_relation: "unknown" as const,
      independent_directional_observation_count: 3 as const,
      derived_aliases_add_weight: false as const,
      action_and_decision_preparation_counted_once: true as const,
      state: "unknown" as const,
    },
  );
}

function pairIdV01(
  left: OperationalReentryV04StaleResetIsolationArmV01,
  right: OperationalReentryV04StaleResetIsolationArmV01,
): OperationalReentryV04StaleResetIsolationPairEvaluationV01["pair_id"] {
  const direct = ACGC_E2R2P6H_DIRECT_PAIRS_V01.find(
    ([a, b]) => (a === left && b === right) || (a === right && b === left),
  );
  if (!direct) failV01("operational_reentry_v04_stale_reset_pair_invalid");
  return `${direct[0]}-${direct[1]}` as OperationalReentryV04StaleResetIsolationPairEvaluationV01["pair_id"];
}

function hypothesisForPairV01(
  pair: OperationalReentryV04StaleResetIsolationPairEvaluationV01["pair_id"],
): OperationalReentryV04StaleResetIsolationPairEvaluationV01["hypothesis_label"] {
  if (pair === "A-B") return "H1";
  if (pair === "B-C") return "H2";
  if (pair === "B-G") return "H3";
  if (pair === "C-G") return "H4";
  return "H5_context";
}

function assertGProvenanceProviderInvisibleV01(
  invocation: OperationalReentryMatchedCohortInvocationV04,
  requestBody: string,
  provenance: OperationalReentryV04StaleResetIsolationGateProvenanceV01,
): void {
  const material = canonicalizeProtocolValueV01(invocation.provider_material);
  const forbidden = [
    provenance.provenance_version,
    provenance.gate_version,
    provenance.source_gate_lineage_fingerprint,
    provenance.integrity.fingerprint,
    "gate_disposition",
    "source_gate_lineage_fingerprint",
    "local_provenance_provider_visibility",
  ];
  if (forbidden.some((token) => material.includes(token) || requestBody.includes(token))) {
    throw new OperationalReentryV04StaleResetIsolationErrorV01(
      "new_provider_contract_required",
    );
  }
}

function bgWitnessAggregateFingerprintV01(
  plan: OperationalReentryV04StaleResetIsolationPlanV01,
): string {
  return fingerprintV01(
    plan.bg_conformance_witnesses.map((witness) => witness.integrity.fingerprint),
  );
}

function assertFrozenCaseV01(): void {
  if (
    operationalReentryMatchedCohortCaseFixtureV02.integrity.fingerprint !==
      ACGC_E2R2P6H_CASE_FINGERPRINT_V01 ||
    fingerprintV01(
      operationalReentryMatchedCohortCaseFixtureV02.provider_visible
        .common_task_evidence,
    ) !== ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01
  ) failV01("operational_reentry_v04_stale_reset_frozen_case_changed");
}

function assertFrozenV04ContractV01(): void {
  assertFrozenCaseV01();
  const contract = readOperationalReentryMatchedCohortProviderContractV04();
  const sample = buildOperationalReentryMatchedCohortInvocationV04({
    arm: "B",
    cohort_ref: "acgc-e2r2p6h-contract-audit",
    call_slot_id: "e2r2p6h-call-contract-audit",
    block: 0,
  });
  const request = projectOperationalReentryMatchedCohortProviderRequestV04(sample);
  if (
    contract.integrity.fingerprint !==
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    contract.provider_contract_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04 ||
    contract.input_codec_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05 ||
    contract.response_schema_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04 ||
    contract.parser_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04 ||
    contract.openai_adapter_implementation_version !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06 ||
    contract.response_bytes !== 1168 ||
    contract.max_output_tokens !== 1168 ||
    contract.parser_closure_cardinality !== 172032 ||
    request.adapter_request_route_fingerprint !==
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
    request.model !== OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02
  ) failV01("new_provider_contract_required");
}

function assertExactRouteV01(route: OperationalReentryMatchedCohortRouteV04): void {
  assertFrozenV04ContractV01();
  const { integrity_fingerprint: _integrity, ...payload } = route;
  if (
    route.integrity_fingerprint !== ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 ||
    route.integrity_fingerprint !== fingerprintV01(payload) ||
    route.provider_ref.external_id !== "openai" ||
    route.model_ref.external_id !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02 ||
    route.provider_contract_fingerprint !==
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    route.adapter_implementation_id !==
      "openai_responses.operational_reentry_matched_cohort" ||
    route.adapter_implementation_version !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06 ||
    route.response_bytes !== 1168 ||
    route.max_output_tokens !== 1168 ||
    route.prepared_without_provider_egress !== true
  ) failV01("operational_reentry_v04_stale_reset_route_changed");
}

function validateAuthorizationShapeV01(
  authorization: OperationalReentryV04StaleResetIsolationAuthorizationV01,
): void {
  const { integrity, ...payload } = authorization;
  if (
    integrity.fingerprint !== fingerprintV01(payload) ||
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_AUTHORIZATION_VERSION_V01 ||
    !SAFE_ID_V01.test(authorization.authorization_id) ||
    authorization.authorization_kind !==
      "one_bounded_operational_reentry_v04_stale_reset_isolation_cohort" ||
    authorization.request_family_kind !==
      ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 ||
    authorization.request_family !== ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01 ||
    !Number.isSafeInteger(authorization.future_live_issue_number) ||
    authorization.future_live_issue_number <= ACGC_E2R2P6H_ISSUE_NUMBER_V01 ||
    !GIT_SHA_V01.test(authorization.exact_merged_source_head) ||
    authorization.exact_merged_source_head ===
      ACGC_E2R2P6H_AUTHORIZED_BASELINE_SHA_V01 ||
    authorization.repository_slug !== AUTHORIZED_REPOSITORY_SLUG_V01 ||
    !AUTHORIZED_ORIGINS_V01.has(authorization.authorized_origin) ||
    !SHA256_V01.test(authorization.project_root_fingerprint) ||
    authorization.gateway_authorization_project_is_lab_experiment_meaning !== false ||
    authorization.codec_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05 ||
    authorization.response_schema_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04 ||
    authorization.parser_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04 ||
    authorization.adapter_implementation_id !==
      "openai_responses.operational_reentry_matched_cohort" ||
    authorization.adapter_implementation_version !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06 ||
    authorization.model !==
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02 ||
    authorization.response_bytes !== 1168 ||
    authorization.max_output_tokens !== 1168 ||
    authorization.final_request_bytes !== 24576 ||
    authorization.planned_calls !== 16 ||
    authorization.repeat_blocks !== 4 ||
    authorization.calls_per_arm !== 4 ||
    authorization.maximum_parallel_provider_calls !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacements !== 0 ||
    authorization.adaptive_changes !== 0 ||
    authorization.fresh_stateless_invocation_per_call !== true ||
    authorization.conversation_reuse !== false ||
    authorization.thread_reuse !== false ||
    authorization.previous_response_reuse !== false ||
    authorization.maximum_total_cost_nano_usd !==
      ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01 ||
    authorization.aggregate_worst_case_cost_nano_usd >
      authorization.maximum_total_cost_nano_usd ||
    authorization.historical_authorization_reuse !== false ||
    authorization.second_cohort_under_same_authorization !== false ||
    authorization.replication !== false ||
    authorization.policy !== false ||
    authorization.stage_7 !== false ||
    timestampV01(authorization.issued_at) >= timestampV01(authorization.expires_at)
  ) failV01("operational_reentry_v04_stale_reset_authorization_invalid");
}

function validateAuthorizationV01(
  value: unknown,
  context: {
    input: BuildOperationalReentryV04StaleResetIsolationInputV01;
    plan: OperationalReentryV04StaleResetIsolationPlanV01;
    gate: OperationalReentryV04StaleResetIsolationGateContractV01;
    evaluator: OperationalReentryV04StaleResetIsolationEvaluatorContractV01;
    pricing: OperationalReentryV04StaleResetIsolationPricingV01;
  },
): OperationalReentryV04StaleResetIsolationAuthorizationV01 {
  const authorization = structuredClone(
    value,
  ) as OperationalReentryV04StaleResetIsolationAuthorizationV01;
  validateAuthorizationShapeV01(authorization);
  if (
    authorization.repository_slug !==
      context.input.repository_identity.repository_slug ||
    authorization.authorized_origin !== context.input.repository_identity.origin ||
    authorization.workspace_id !== context.input.admission.workspace_id ||
    authorization.project_id !== context.input.admission.project_id ||
    authorization.expected_active_selection_revision !==
      context.input.admission.expected_active_selection_revision ||
    authorization.project_root_fingerprint !==
      fingerprintV01(context.input.admission.project_root) ||
    authorization.case_fingerprint !== context.plan.case_fingerprint ||
    authorization.common_task_evidence_fingerprint !==
      context.plan.common_task_evidence_fingerprint ||
    authorization.g_gate_provenance_contract_fingerprint !==
      context.gate.integrity.fingerprint ||
    authorization.sealed_plan_fingerprint !==
      context.plan.integrity.fingerprint ||
    authorization.evaluator_fingerprint !==
      context.evaluator.integrity.fingerprint ||
    authorization.bg_static_conformance_witness_fingerprint !==
      bgWitnessAggregateFingerprintV01(context.plan) ||
    authorization.route_fingerprint !== context.input.route.integrity_fingerprint ||
    authorization.provider_contract_fingerprint !==
      ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 ||
    authorization.adapter_request_route_fingerprint !==
      ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 ||
    authorization.pricing_snapshot_fingerprint !==
      context.pricing.integrity.fingerprint ||
    authorization.pricing_snapshot_evaluated_at !==
      context.pricing.pricing_snapshot_evaluated_at ||
    authorization.pricing_authority_fingerprint !==
      context.pricing.pricing_authority_fingerprint ||
    authorization.pricing_authority_expires_at !==
      context.pricing.pricing_authority_expires_at ||
    authorization.aggregate_worst_case_cost_nano_usd !==
      context.pricing.aggregate_conservative_worst_case_nano_usd ||
    timestampV01(context.input.evaluated_at) < timestampV01(authorization.issued_at) ||
    timestampV01(context.input.evaluated_at) >= timestampV01(authorization.expires_at) ||
    timestampV01(authorization.expires_at) >
      timestampV01(authorization.pricing_authority_expires_at)
  ) failV01("operational_reentry_v04_stale_reset_authorization_mismatched");
  return authorization;
}

function validatePricingV01(
  value: unknown,
  evaluatedAt: string,
): OperationalReentryV04StaleResetIsolationPricingV01 {
  const pricing = structuredClone(
    value,
  ) as OperationalReentryV04StaleResetIsolationPricingV01;
  if (!pricing || typeof pricing !== "object" || !pricing.integrity) {
    failV01("operational_reentry_v04_stale_reset_pricing_invalid");
  }
  const { integrity, ...payload } = pricing;
  if (
    integrity.fingerprint !== fingerprintV01(payload) ||
    pricing.pricing_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_ISOLATION_PRICING_VERSION_V01 ||
    pricing.pricing_snapshot_authority !==
      "future_live_issue_must_refresh_official_pricing" ||
    pricing.pricing_authority_fingerprint !==
      pricing.gateway_cost_budget.authority.pricing_fingerprint ||
    pricing.per_call_conservative_worst_case_nano_usd !==
      ACGC_E2R2P6H_PER_CALL_WORST_CASE_NANO_USD_V01 ||
    pricing.aggregate_conservative_worst_case_nano_usd !==
      ACGC_E2R2P6H_AGGREGATE_WORST_CASE_NANO_USD_V01 ||
    pricing.maximum_total_cost_nano_usd !==
      ACGC_E2R2P6H_MAXIMUM_TOTAL_COST_NANO_USD_V01 ||
    pricing.static_harness_is_live_pricing_authority !== false ||
    pricing.missing_exact_usage_or_cost !== "unknown_never_zero"
  ) failV01("operational_reentry_v04_stale_reset_pricing_invalid");
  assertModelGatewayCostBudgetCurrentV01(
    pricing.gateway_cost_budget,
    evaluatedAt,
  );
  return pricing;
}

function terminalV01(
  entry: OperationalReentryV04StaleResetIsolationPlanEntryV01,
  category: OperationalReentryV04StaleResetIsolationTerminalCategoryV01,
  output: OperationalReentryMatchedCohortModelOutputV04 | null,
  receipt: OperationalReentryV04StaleResetIsolationCallTerminalV01["receipt"],
  failureCode: string | null,
  prepared: OperationalReentryV04StaleResetIsolationPreparedV01,
): OperationalReentryV04StaleResetIsolationCallTerminalV01 {
  const usage = receipt?.usage ?? null;
  const exactCost =
    usage?.cached_input_tokens !== undefined
      ? (usage.input_tokens - usage.cached_input_tokens) *
          prepared.pricing.input_nano_usd_per_token +
        usage.cached_input_tokens *
          prepared.pricing.cached_input_nano_usd_per_token +
        usage.output_tokens * prepared.pricing.output_nano_usd_per_token
      : "unknown" as const;
  return sealV01(
    "operational_reentry_v04_stale_reset_isolation_call_terminal_without_integrity_fingerprint",
    {
      call_order: entry.call_order,
      call_slot_id: entry.call_slot_id,
      repeat_block: entry.repeat_block,
      position_in_block: entry.position_in_block,
      arm: entry.arm,
      terminal_category: category,
      egress_attempted: receipt?.egress_attempted ?? false,
      request_family_kind: ACGC_E2R2P6H_REQUEST_FAMILY_KIND_V01,
      request_family_trace_id: entry.request_family_trace_id,
      client_request_id: entry.client_request_id,
      local_invocation_identity_fingerprint:
        entry.local_invocation_identity_fingerprint,
      provider_material_fingerprint: entry.provider_material_fingerprint,
      provider_visible_request_fingerprint:
        entry.provider_visible_request_fingerprint,
      normalized_output: output ? structuredClone(output) : null,
      normalized_output_fingerprint: output ? fingerprintV01(output) : null,
      receipt,
      exact_cost_nano_usd: exactCost,
      failure_code: failureCode,
      retries: 0 as const,
      replacement_calls: 0 as const,
    },
  );
}

function classifyRuntimeFailureV01(
  error: unknown,
): OperationalReentryV04StaleResetIsolationTerminalCategoryV01 {
  const code = boundedFailureCodeV01(error);
  if (code.includes("provider_rejected")) return "provider_rejected";
  if (code.includes("provider_response_invalid")) return "provider_response_invalid";
  if (code.includes("transport_failed")) return "transport_failed";
  if (code.includes("timeout")) return "timed_out";
  if (code.includes("cancel")) return "cancelled";
  if (code.includes("drift")) return "authority_or_source_route_drift";
  return "blocked_before_egress";
}

function boundedFailureCodeV01(error: unknown): string {
  if (isModelGatewayInvocationErrorV01(error)) return error.code;
  if (
    error instanceof Error &&
    /^[a-z0-9_]{1,200}$/u.test(error.message)
  ) return error.message;
  return "operational_reentry_v04_stale_reset_internal_failure";
}

function timestampV01(value: string): number {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) failV01("operational_reentry_v04_stale_reset_timestamp_invalid");
  return parsed;
}

function nonnegativeSafeIntegerV01(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function sealV01<T extends object>(
  scope: string,
  value: T,
): T & { integrity: { algorithm: "sha256"; canonicalization: "augnes-json-c14n-v0_1"; fingerprint_scope: string; fingerprint: string } } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: fingerprintV01(value),
    },
  };
}

function failV01(code: string): never {
  throw new OperationalReentryV04StaleResetIsolationErrorV01(code);
}
