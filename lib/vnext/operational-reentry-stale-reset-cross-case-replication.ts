import {
  buildOperationalReentryStaleResetCrossCaseProviderMaterialV01,
  OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
  readOperationalReentryStaleResetCrossCaseV01,
} from "@/fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import {
  createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01,
  createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01,
  invokeOperationalReentryStaleResetCrossCaseModelGatewayV01,
  projectOperationalReentryStaleResetCrossCaseProviderRequestV01,
  readOperationalReentryStaleResetCrossCaseProviderContractV01,
  type ModelGatewayInteractiveAdmissionV01,
  type OperationalReentryStaleResetCrossCaseModelGatewayDependenciesV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { isModelGatewayInvocationErrorV01 } from "@/lib/vnext/model-gateway/contracts";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_VERSION_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_EVALUATOR_VERSION_V01,
  OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_PLAN_VERSION_V01,
  type OperationalReentryStaleResetCrossCaseArmV01,
  type OperationalReentryStaleResetCrossCaseAuthorizationV01,
  type OperationalReentryStaleResetCrossCaseBlockEvaluationV01,
  type OperationalReentryStaleResetCrossCaseBlockV01,
  type OperationalReentryStaleResetCrossCaseDimensionRelationV01,
  type OperationalReentryStaleResetCrossCaseDispositionV01,
  type OperationalReentryStaleResetCrossCaseIdV01,
  type OperationalReentryStaleResetCrossCaseIntegrityV01,
  type OperationalReentryStaleResetCrossCaseInvocationV01,
  type OperationalReentryStaleResetCrossCaseLayerBV01,
  type OperationalReentryStaleResetCrossCaseLimitationV01,
  type OperationalReentryStaleResetCrossCaseModelOutputV01,
  type OperationalReentryStaleResetCrossCasePairV01,
  type OperationalReentryStaleResetCrossCasePatternStatusV01,
  type OperationalReentryStaleResetCrossCasePresenceV01,
  type OperationalReentryStaleResetCrossCaseRouteV01,
  type OperationalReentryStaleResetCrossCaseTargetRelationV01,
} from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

const MODEL = "gpt-4.1-mini-2025-04-14" as const;
const SHA256 = /^sha256:[0-9a-f]{64}$/u;
const GIT_SHA = /^[0-9a-f]{40}$/u;
const SAFE_ID = /^[A-Za-z0-9:._-]{1,256}$/u;

export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_SEALED_ORDER_V01 =
  Object.freeze([
    Object.freeze(["A", "B", "G", "C"] as const),
    Object.freeze(["B", "C", "A", "G"] as const),
    Object.freeze(["C", "G", "B", "A"] as const),
    Object.freeze(["G", "A", "C", "B"] as const),
  ] as const);

export const OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_DIRECT_PAIRS_V01 =
  Object.freeze([
    Object.freeze(["A", "B"] as const),
    Object.freeze(["A", "C"] as const),
    Object.freeze(["A", "G"] as const),
    Object.freeze(["B", "C"] as const),
    Object.freeze(["B", "G"] as const),
    Object.freeze(["C", "G"] as const),
  ] as const);

export const operationalReentryStaleResetCrossCaseStaticAuthorityV01 =
  Object.freeze({
    prepared_without_provider_egress: true as const,
    new_provider_contract_implemented: true as const,
    zero_egress_shape_conformance: true as const,
    live_compatibility_result: "none" as const,
    live_compatibility_authorizations_created: 0 as const,
    live_compatibility_authorizations_consumed: 0 as const,
    live_compatibility_probe_executed: false as const,
    replication_live_authorizations_created: 0 as const,
    replication_live_authorizations_consumed: 0 as const,
    R1_live_issue_created: false as const,
    R2_live_issue_created: false as const,
    R1_behavioral_result: "none" as const,
    R2_behavioral_result: "none" as const,
    cross_case_disposition: "incomplete" as const,
    real_provider_calls: 0 as const,
    replication_harness_GO: true as const,
    replication_live_GO: false as const,
    product_transfer_GO: false as const,
    policy_GO: false as const,
    stage_7_GO: false as const,
  });

export class OperationalReentryStaleResetCrossCaseErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryStaleResetCrossCaseErrorV01";
  }
}

export function buildOperationalReentryStaleResetCrossCaseInvocationV01(input: {
  case_id: OperationalReentryStaleResetCrossCaseIdV01;
  arm: OperationalReentryStaleResetCrossCaseArmV01;
  cohort_ref: string;
  call_slot_id: string;
  repeat_block: OperationalReentryStaleResetCrossCaseBlockV01;
}): OperationalReentryStaleResetCrossCaseInvocationV01 {
  readOperationalReentryStaleResetCrossCaseV01(input.case_id);
  if (
    !["A", "B", "C", "G"].includes(input.arm) ||
    !SAFE_ID.test(input.cohort_ref) ||
    !SAFE_ID.test(input.call_slot_id) ||
    ![0, 1, 2, 3].includes(input.repeat_block)
  ) fail("cross_case_replication_invocation_invalid");
  return {
    input_kind:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01,
    codec_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V01,
    local_invocation_context: {
      case_id: input.case_id,
      cohort_ref: input.cohort_ref,
      call_slot_id: input.call_slot_id,
      repeat_block: input.repeat_block,
    },
    provider_material:
      buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(
        input.case_id,
        input.arm,
      ),
  };
}

export function buildOperationalReentryStaleResetCrossCaseGateContractV01(
  caseId: OperationalReentryStaleResetCrossCaseIdV01,
) {
  const spec = readOperationalReentryStaleResetCrossCaseV01(caseId);
  const target = {
    context_token: spec.target.context_token,
    material_token: spec.target.material_token,
    role: "target" as const,
  };
  const nonTarget = spec.non_target_continuation;
  return seal("cross_case_gate_contract_without_integrity_fingerprint", {
    gate_version: "operational_reentry_v04_stale_reset_replication_gate.v0.1" as const,
    provenance_version:
      "operational_reentry_v04_stale_reset_replication_provenance.v0.1" as const,
    case_id: caseId,
    case_fingerprint: spec.integrity.fingerprint,
    upstream_target_fingerprint: fingerprint(target),
    upstream_stale_relation_fingerprint: fingerprint(spec.stale_relation),
    non_target_material_fingerprint: fingerprint(nonTarget),
    gate_disposition: "excluded_before_materialization" as const,
    target_excluded: true as const,
    stale_relation_excluded: true as const,
    non_target_material_unchanged: true as const,
    projected_provider_shape: "exact_B" as const,
    local_provenance_provider_visibility: "absent" as const,
    raw_prompt_or_request_persisted: false as const,
    product_or_core_record_created: false as const,
    policy_rank_or_winner_created: false as const,
  });
}

export function buildOperationalReentryStaleResetCrossCaseGatedInvocationV01(
  input: {
    case_id: OperationalReentryStaleResetCrossCaseIdV01;
    cohort_ref: string;
    call_slot_id: string;
    repeat_block: OperationalReentryStaleResetCrossCaseBlockV01;
    declared_case_fingerprint?: string;
    declared_target_fingerprint?: string;
    declared_stale_relation_fingerprint?: string;
    declared_non_target_material_fingerprint?: string;
    gate_version?: string;
  },
) {
  const contract = buildOperationalReentryStaleResetCrossCaseGateContractV01(
    input.case_id,
  );
  const upstreamC = buildOperationalReentryStaleResetCrossCaseInvocationV01({
    ...input,
    arm: "C",
    cohort_ref: opaqueId("ccr_upstream", {
      case_id: input.case_id,
      call_slot_id: input.call_slot_id,
    }),
  });
  const target = upstreamC.provider_material.continuation_context.find(
    (item) => item.role === "target",
  );
  const relation = upstreamC.provider_material.stale_relation;
  const nonTarget = upstreamC.provider_material.continuation_context.filter(
    (item) => item.role === "non_target",
  );
  if (
    !target ||
    !relation ||
    (input.declared_case_fingerprint ?? contract.case_fingerprint) !==
      contract.case_fingerprint ||
    (input.declared_target_fingerprint ?? fingerprint(target)) !==
      contract.upstream_target_fingerprint ||
    fingerprint(target) !== contract.upstream_target_fingerprint ||
    (input.declared_stale_relation_fingerprint ?? fingerprint(relation)) !==
      contract.upstream_stale_relation_fingerprint ||
    fingerprint(relation) !== contract.upstream_stale_relation_fingerprint ||
    (input.declared_non_target_material_fingerprint ?? fingerprint(nonTarget)) !==
      contract.non_target_material_fingerprint ||
    fingerprint(nonTarget) !== contract.non_target_material_fingerprint ||
    (input.gate_version ?? contract.gate_version) !== contract.gate_version
  ) fail("cross_case_replication_gate_provenance_invalid");
  const invocation = buildOperationalReentryStaleResetCrossCaseInvocationV01({
    ...input,
    arm: "G",
  });
  const canonicalB = buildOperationalReentryStaleResetCrossCaseInvocationV01({
    ...input,
    arm: "B",
    cohort_ref: opaqueId("ccr_canonical", input),
    call_slot_id: opaqueId("ccr_slot", input),
  });
  if (
    canonicalizeProtocolValueV01(invocation.provider_material) !==
      canonicalizeProtocolValueV01(canonicalB.provider_material)
  ) fail("cross_case_replication_g_projection_not_exact_b");
  const request =
    projectOperationalReentryStaleResetCrossCaseProviderRequestV01(invocation);
  const provenance = seal(
    "cross_case_gate_provenance_without_integrity_fingerprint",
    {
      provenance_version: contract.provenance_version,
      gate_version: contract.gate_version,
      case_id: input.case_id,
      case_fingerprint: contract.case_fingerprint,
      source_target_fingerprint: contract.upstream_target_fingerprint,
      source_stale_relation_fingerprint:
        contract.upstream_stale_relation_fingerprint,
      non_target_material_fingerprint:
        contract.non_target_material_fingerprint,
      gate_disposition: "excluded_before_materialization" as const,
      target_excluded: true as const,
      stale_relation_excluded: true as const,
      non_target_material_unchanged: true as const,
      projected_provider_material_fingerprint:
        createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01(
          invocation.provider_material,
        ),
      provider_request_fingerprint: request.request_fingerprint,
      source_gate_lineage_fingerprint: fingerprint({
        case_fingerprint: contract.case_fingerprint,
        target: contract.upstream_target_fingerprint,
        relation: contract.upstream_stale_relation_fingerprint,
        non_target: contract.non_target_material_fingerprint,
        block: input.repeat_block,
        call_slot_id: input.call_slot_id,
      }),
      local_provenance_provider_visibility: "absent" as const,
    },
  );
  const requestBody = request.request_body.toLowerCase();
  if (
    requestBody.includes("excluded_before_materialization") ||
    requestBody.includes(provenance.integrity.fingerprint) ||
    requestBody.includes(input.case_id)
  ) fail("cross_case_replication_g_provider_visibility_invalid");
  return { invocation, upstream_c: upstreamC, provenance };
}

export function buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(
  caseId: OperationalReentryStaleResetCrossCaseIdV01,
) {
  const spec = readOperationalReentryStaleResetCrossCaseV01(caseId);
  return seal(
    "cross_case_replication_evaluator_binding_without_integrity_fingerprint",
    {
      evaluator_version:
        OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_EVALUATOR_VERSION_V01,
      case_id: caseId,
      case_fingerprint: spec.integrity.fingerprint,
      exact_token_mapping: spec.evaluator_binding,
      layer_a_is_treatment_projection_integrity_only: true as const,
      layer_b_independent_dimensions: [
        "selected_or_referenced_target_identity",
        "target_action_or_decision_preparation",
        "target_specific_result_limitation",
      ] as const,
      validation_only_aliases: [
        "continuation_packet_projection",
        "target_disposition",
        "target_abstention_consistency",
        "target_specific_required_check_not_available_under_v04",
      ] as const,
      direct_pairs: ["A-B", "A-C", "A-G", "B-C", "B-G", "C-G"] as const,
      dimension_counting: false as const,
      majority_vote: false as const,
      weighting: false as const,
      scalar_score: false as const,
      rank_or_winner: false as const,
      transitive_pair_inference: false as const,
      runtime_token_name_inference: false as const,
    },
  );
}

export function buildOperationalReentryStaleResetCrossCasePlanV01(
  caseId: OperationalReentryStaleResetCrossCaseIdV01,
  route: OperationalReentryStaleResetCrossCaseRouteV01,
) {
  assertRoute(route);
  const spec = readOperationalReentryStaleResetCrossCaseV01(caseId);
  const gate = buildOperationalReentryStaleResetCrossCaseGateContractV01(caseId);
  const evaluator =
    buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(caseId);
  const contract = readOperationalReentryStaleResetCrossCaseProviderContractV01();
  const namespace = opaqueId("ccr_namespace", {
    case_id: caseId,
    case_fingerprint: spec.integrity.fingerprint,
  });
  const entries: Array<ReturnType<typeof buildPlanEntry>> = [];
  for (const block of [0, 1, 2, 3] as const) {
    for (const position of [0, 1, 2, 3] as const) {
      const arm = OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_SEALED_ORDER_V01[
        block
      ][position];
      const callOrder = block * 4 + position;
      const identityBasis = {
        family: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01,
        case_fingerprint: spec.integrity.fingerprint,
        block,
        position,
        arm,
      };
      const callSlotId = opaqueId("ccr_slot", identityBasis);
      const cohortRef = opaqueId("ccr_cohort", identityBasis);
      const built =
        arm === "G"
          ? buildOperationalReentryStaleResetCrossCaseGatedInvocationV01({
              case_id: caseId,
              cohort_ref: cohortRef,
              call_slot_id: callSlotId,
              repeat_block: block,
            })
          : {
              invocation: buildOperationalReentryStaleResetCrossCaseInvocationV01({
                case_id: caseId,
                arm,
                cohort_ref: cohortRef,
                call_slot_id: callSlotId,
                repeat_block: block,
              }),
              provenance: null,
            };
      entries.push(
        buildPlanEntry({
          caseId,
          arm,
          block,
          position,
          callOrder,
          namespace,
          route,
          invocation: built.invocation,
          gateProvenance: built.provenance,
          caseFingerprint: spec.integrity.fingerprint,
          commonEvidenceFingerprint: spec.common_evidence_fingerprint,
          providerContractFingerprint: contract.integrity.fingerprint,
          requestFamilyKind:
            OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01,
        }),
      );
    }
  }
  const witnesses = ([0, 1, 2, 3] as const).map((block) =>
    buildBgWitness(block, entries),
  );
  return seal("cross_case_replication_plan_without_integrity_fingerprint", {
    plan_version: OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_PLAN_VERSION_V01,
    request_family_kind:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01,
    case_id: caseId,
    case_fingerprint: spec.integrity.fingerprint,
    common_evidence_fingerprint: spec.common_evidence_fingerprint,
    gate_contract_fingerprint: gate.integrity.fingerprint,
    evaluator_binding_fingerprint: evaluator.integrity.fingerprint,
    provider_contract_fingerprint: contract.integrity.fingerprint,
    route_fingerprint: route.integrity_fingerprint,
    call_slot_namespace: namespace,
    planned_calls: 16 as const,
    repeat_blocks: 4 as const,
    calls_per_block: 4 as const,
    calls_per_arm: 4 as const,
    each_arm_once_per_ordinal_position: true as const,
    maximum_parallel_provider_calls: 1 as const,
    retries: 0 as const,
    replacement_calls: 0 as const,
    adaptive_stopping: false as const,
    fresh_stateless_invocation_per_call: true as const,
    conversation_reuse: false as const,
    thread_reuse: false as const,
    previous_response_reuse: false as const,
    sealed_order: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_SEALED_ORDER_V01,
    entries,
    bg_conformance_witnesses: witnesses,
  });
}

function buildPlanEntry(input: {
  caseId: OperationalReentryStaleResetCrossCaseIdV01;
  arm: OperationalReentryStaleResetCrossCaseArmV01;
  block: OperationalReentryStaleResetCrossCaseBlockV01;
  position: 0 | 1 | 2 | 3;
  callOrder: number;
  namespace: string;
  route: OperationalReentryStaleResetCrossCaseRouteV01;
  invocation: OperationalReentryStaleResetCrossCaseInvocationV01;
  gateProvenance: ReturnType<typeof buildOperationalReentryStaleResetCrossCaseGatedInvocationV01>["provenance"] | null;
  caseFingerprint: string;
  commonEvidenceFingerprint: string;
  providerContractFingerprint: string;
  requestFamilyKind:
    | typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01
    | typeof OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01;
}) {
  const request = projectOperationalReentryStaleResetCrossCaseProviderRequestV01(
    input.invocation,
  );
  const providerMaterialFingerprint =
    createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01(
      input.invocation.provider_material,
    );
  const localSourceProvenance = fingerprint({
    case_id: input.caseId,
    case_fingerprint: input.caseFingerprint,
    arm: input.arm,
    upstream_target: input.arm === "B" ? "absent_at_source" : "exact_present",
    upstream_stale_relation:
      input.arm === "C" || input.arm === "G" ? "exact_present" : "absent",
    gate: input.gateProvenance?.integrity.fingerprint ?? null,
  });
  const trace = createDeterministicModelProviderRequestTraceV01({
    request_family_kind:
      input.requestFamilyKind,
    request_family_fingerprint: fingerprint({
      namespace: input.namespace,
      call_order: input.callOrder,
      local_source_provenance: localSourceProvenance,
    }),
  });
  const clientRequestId = createDeterministicModelClientRequestIdV01({
    purpose: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01,
    provider_request_trace_id: trace,
    call_slot_id: input.invocation.local_invocation_context.call_slot_id,
    model: MODEL,
  });
  return {
    call_order: input.callOrder,
    repeat_block: input.block,
    position_in_block: input.position,
    arm: input.arm,
    case_id: input.caseId,
    call_slot_id: input.invocation.local_invocation_context.call_slot_id,
    cohort_ref: input.invocation.local_invocation_context.cohort_ref,
    local_source_provenance_fingerprint: localSourceProvenance,
    local_invocation_identity_fingerprint:
      createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01(
        input.invocation,
      ),
    local_manifest_identity_fingerprint: fingerprint({
      namespace: input.namespace,
      call_order: input.callOrder,
      arm: input.arm,
    }),
    non_intervention_parity_fingerprint: fingerprint({
      case_fingerprint: input.caseFingerprint,
      common_evidence_fingerprint: input.commonEvidenceFingerprint,
      non_target_material:
        input.invocation.provider_material.continuation_context.filter(
          (item) => item.role === "non_target",
        ),
      route_fingerprint: input.route.integrity_fingerprint,
      provider_contract_fingerprint: input.providerContractFingerprint,
      adapter_request_route_fingerprint:
        request.adapter_request_route_fingerprint,
      model: MODEL,
      response_bytes: 1168,
      max_output_tokens: 1168,
      final_request_bytes: 24576,
    }),
    common_evidence_fingerprint: input.commonEvidenceFingerprint,
    provider_material_fingerprint: providerMaterialFingerprint,
    provider_visible_request_fingerprint: request.request_fingerprint,
    schema_fingerprint: request.schema_fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    provider_contract_fingerprint: input.providerContractFingerprint,
    adapter_request_route_fingerprint:
      request.adapter_request_route_fingerprint,
    request_family_kind:
      input.requestFamilyKind,
    request_family_trace_id: trace,
    client_request_id: clientRequestId,
    canonical_request_body: request.request_body,
    model: request.model,
    schema_name: "operational_reentry_stale_reset_cross_case_replication_v01" as const,
    max_output_tokens: 1168 as const,
    store: false as const,
    invocation: input.invocation,
    gate_provenance: input.gateProvenance,
  };
}

function buildBgWitness(
  block: OperationalReentryStaleResetCrossCaseBlockV01,
  entries: Array<ReturnType<typeof buildPlanEntry>>,
) {
  const b = entries.find((entry) => entry.repeat_block === block && entry.arm === "B");
  const g = entries.find((entry) => entry.repeat_block === block && entry.arm === "G");
  if (!b || !g || !g.gate_provenance) fail("cross_case_replication_bg_missing");
  const providerEqual =
    canonicalizeProtocolValueV01(b.invocation.provider_material) ===
    canonicalizeProtocolValueV01(g.invocation.provider_material);
  const requestEqual = b.canonical_request_body === g.canonical_request_body;
  const allEqual =
    providerEqual &&
    b.provider_material_fingerprint === g.provider_material_fingerprint &&
    requestEqual &&
    b.provider_visible_request_fingerprint ===
      g.provider_visible_request_fingerprint &&
    b.schema_fingerprint === g.schema_fingerprint &&
    b.route_fingerprint === g.route_fingerprint &&
    b.provider_contract_fingerprint === g.provider_contract_fingerprint &&
    b.adapter_request_route_fingerprint ===
      g.adapter_request_route_fingerprint &&
    b.model === g.model &&
    b.schema_name === g.schema_name &&
    b.max_output_tokens === g.max_output_tokens &&
    b.store === g.store;
  if (
    !allEqual ||
    b.local_source_provenance_fingerprint ===
      g.local_source_provenance_fingerprint ||
    b.local_invocation_identity_fingerprint ===
      g.local_invocation_identity_fingerprint ||
    b.call_slot_id === g.call_slot_id ||
    b.request_family_trace_id === g.request_family_trace_id ||
    b.client_request_id === g.client_request_id ||
    b.local_manifest_identity_fingerprint ===
      g.local_manifest_identity_fingerprint
  ) fail("cross_case_replication_bg_conformance_invalid");
  return seal("cross_case_replication_bg_witness_without_integrity_fingerprint", {
    case_id: b.case_id,
    repeat_block: block,
    left_arm: "B" as const,
    right_arm: "G" as const,
    local_identity_distinct: true as const,
    local_source_provenance_distinct: true as const,
    call_slot_distinct: true as const,
    trace_id_distinct: true as const,
    client_request_id_distinct: true as const,
    manifest_identity_distinct: true as const,
    provider_material_equal: true as const,
    provider_material_fingerprint_equal: true as const,
    system_prompt_equal: true as const,
    dynamic_user_material_equal: true as const,
    strict_response_schema_equal: true as const,
    schema_name_equal: true as const,
    model_equal: true as const,
    max_output_tokens_equal: true as const,
    store_false_equal: true as const,
    canonical_openai_request_body_bytes_equal: true as const,
    provider_visible_request_fingerprint_equal: true as const,
    route_fingerprint_equal: true as const,
    provider_contract_fingerprint_equal: true as const,
    adapter_request_route_fingerprint_equal: true as const,
    request_response_budget_identity_equal: true as const,
    g_provenance_provider_visibility: "absent" as const,
    provider_material_fingerprint: b.provider_material_fingerprint,
    provider_visible_request_fingerprint:
      b.provider_visible_request_fingerprint,
  });
}

export function buildOperationalReentryStaleResetCrossCaseLayerAV01(
  entry: ReturnType<typeof buildPlanEntry>,
) {
  const spec = readOperationalReentryStaleResetCrossCaseV01(entry.case_id);
  const expectedMaterial =
    buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(
      entry.case_id,
      entry.arm,
    );
  const targetPresent = entry.invocation.provider_material.continuation_context.some(
    (item) => item.role === "target" && item.context_token === spec.target.context_token,
  );
  const stalePresent = entry.invocation.provider_material.stale_relation !== null;
  const protocolValid =
    canonicalizeProtocolValueV01(entry.invocation.provider_material) ===
      canonicalizeProtocolValueV01(expectedMaterial) &&
    entry.provider_material_fingerprint ===
      createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01(
        expectedMaterial,
      ) &&
    (entry.arm === "A"
      ? targetPresent && !stalePresent
      : entry.arm === "C"
        ? targetPresent && stalePresent
        : !targetPresent && !stalePresent) &&
    (entry.arm !== "G" ||
      (entry.gate_provenance?.gate_disposition ===
        "excluded_before_materialization" &&
        entry.gate_provenance.local_provenance_provider_visibility === "absent"));
  return seal("cross_case_replication_layer_a_without_integrity_fingerprint", {
    case_id: entry.case_id,
    arm: entry.arm,
    status: protocolValid
      ? entry.arm === "B" || entry.arm === "G"
        ? "valid_target_absent_or_gated" as const
        : "valid_target_present" as const
      : "protocol_invalid" as const,
    upstream_target_identity: protocolValid
      ? entry.arm === "B"
        ? "absent" as const
        : "exact_case_target" as const
      : "protocol_invalid" as const,
    upstream_stale_relation_identity: protocolValid
      ? entry.arm === "C" || entry.arm === "G"
        ? "exact_case_relation" as const
        : "absent" as const
      : "protocol_invalid" as const,
    gate_disposition:
      entry.arm === "G" ? "excluded_before_materialization" as const : "not_applicable" as const,
    source_gate_lineage:
      entry.gate_provenance?.source_gate_lineage_fingerprint ?? "not_applicable",
    provider_projection_shape: protocolValid
      ? (`exact_${entry.arm === "G" ? "B" : entry.arm}` as const)
      : "protocol_invalid" as const,
    provider_target_material: targetPresent ? "present" as const : "absent" as const,
    provider_stale_relation: stalePresent ? "present" as const : "absent" as const,
    provider_material_fingerprint: entry.provider_material_fingerprint,
    provider_request_fingerprint: entry.provider_visible_request_fingerprint,
    local_provenance_provider_visibility:
      entry.arm === "G" ? "absent" as const : "not_applicable" as const,
    establishes_target_persistence: false as const,
    establishes_behavioral_equivalence: false as const,
  });
}

export function buildOperationalReentryStaleResetCrossCaseLayerBV01(
  caseId: OperationalReentryStaleResetCrossCaseIdV01,
  output: OperationalReentryStaleResetCrossCaseModelOutputV01 | null,
): OperationalReentryStaleResetCrossCaseLayerBV01 {
  const spec = readOperationalReentryStaleResetCrossCaseV01(caseId);
  if (!output) {
    return seal("cross_case_replication_layer_b_without_integrity_fingerprint", {
      case_id: caseId,
      selected_or_referenced_target_identity: "unknown" as const,
      target_action_or_decision_preparation: "unknown" as const,
      target_specific_result_limitation: "unknown" as const,
      target_disposition: "unknown" as const,
      target_specific_required_check_relation: "not_available_under_v04" as const,
      target_abstention_relation: "unknown" as const,
      independent_directional_observation_count: 3 as const,
      runtime_token_name_inference: false as const,
      target_neutral_tokens_add_directional_weight: false as const,
      state: "unknown" as const,
    });
  }
  const referenced: OperationalReentryStaleResetCrossCasePresenceV01 =
    output.referenced_continuation_tokens.includes(
      spec.evaluator_binding.target_reference_token,
    )
      ? "present"
      : "absent";
  const action: OperationalReentryStaleResetCrossCasePresenceV01 =
    spec.evaluator_binding.target_action_token !== null &&
    output.operation_action_class_tokens.includes(
      spec.evaluator_binding.target_action_token,
    )
      ? "present"
      : "absent";
  const selectedLimitations = Object.entries(
    spec.evaluator_binding.target_specific_limitations,
  ).filter(([token]) => output.result_limitation_tokens.includes(token));
  const limitation: OperationalReentryStaleResetCrossCaseLimitationV01 =
    selectedLimitations.length > 1
      ? "mixed"
      : selectedLimitations[0]?.[1] ?? "absent";
  const abstention =
    (output.result_status === "review_ready" && output.abstention === false) ||
    (output.result_status === "review_blocked" && output.abstention === true)
      ? "consistent" as const
      : "inconsistent" as const;
  const dispositionValid = targetDispositionConsistent(
    output.target_disposition,
    referenced,
    action,
    limitation,
  );
  const state = !dispositionValid
    ? "protocol_invalid" as const
    : limitation === "mixed" || abstention === "inconsistent"
      ? "not_comparable" as const
      : referenced === "present" ||
          action === "present" ||
          limitation === "stale_persisted"
        ? "bounded_target_persistence_observed" as const
        : "no_target_persistence_observed" as const;
  return seal("cross_case_replication_layer_b_without_integrity_fingerprint", {
    case_id: caseId,
    selected_or_referenced_target_identity: referenced,
    target_action_or_decision_preparation: action,
    target_specific_result_limitation: limitation,
    target_disposition: dispositionValid
      ? output.target_disposition
      : "protocol_invalid" as const,
    target_specific_required_check_relation: "not_available_under_v04" as const,
    target_abstention_relation: abstention,
    independent_directional_observation_count: 3 as const,
    runtime_token_name_inference: false as const,
    target_neutral_tokens_add_directional_weight: false as const,
    state,
  });
}

export interface OperationalReentryStaleResetCrossCaseObservedArmV01 {
  entry: ReturnType<typeof buildPlanEntry>;
  normalized_output: OperationalReentryStaleResetCrossCaseModelOutputV01 | null;
  layer_a?: ReturnType<typeof buildOperationalReentryStaleResetCrossCaseLayerAV01>;
  layer_b?: OperationalReentryStaleResetCrossCaseLayerBV01;
}

export function deriveOperationalReentryStaleResetCrossCasePairV01(
  left: OperationalReentryStaleResetCrossCaseObservedArmV01,
  right: OperationalReentryStaleResetCrossCaseObservedArmV01,
): OperationalReentryStaleResetCrossCasePairV01 {
  const pairIdentity = pairId(left.entry.arm, right.entry.arm);
  const leftA = left.layer_a ?? buildOperationalReentryStaleResetCrossCaseLayerAV01(left.entry);
  const rightA = right.layer_a ?? buildOperationalReentryStaleResetCrossCaseLayerAV01(right.entry);
  const leftB = left.layer_b ?? buildOperationalReentryStaleResetCrossCaseLayerBV01(left.entry.case_id, left.normalized_output);
  const rightB = right.layer_b ?? buildOperationalReentryStaleResetCrossCaseLayerBV01(right.entry.case_id, right.normalized_output);
  const leftCommon = commonCompliance(left);
  const rightCommon = commonCompliance(right);
  const base = {
    pair_id: pairIdentity,
    direct_evaluation: true as const,
    inferred_transitively: false as const,
    scalar_score_created: false as const,
    rank_or_winner_created: false as const,
  };
  const unavailable = {
    selected_or_referenced_target_identity: "not_comparable" as const,
    target_action_or_decision_preparation: "not_comparable" as const,
    target_specific_result_limitation: "not_comparable" as const,
  };
  if (leftA.status === "protocol_invalid" || rightA.status === "protocol_invalid") {
    return pairResult(base, "protocol_invalid", "protocol_invalid", "unknown", "not_comparable", unavailable);
  }
  if (left.entry.non_intervention_parity_fingerprint !== right.entry.non_intervention_parity_fingerprint) {
    return pairResult(base, "not_comparable", "not_comparable", "unknown", "not_comparable", unavailable);
  }
  if (leftB.state === "protocol_invalid" || rightB.state === "protocol_invalid") {
    return pairResult(base, "protocol_invalid", "protocol_invalid", "unknown", "not_comparable", unavailable);
  }
  if (leftB.state === "not_comparable" || rightB.state === "not_comparable") {
    return pairResult(base, "not_comparable", "not_comparable", "unknown", "not_comparable", unavailable);
  }
  if (leftCommon.status === "invalid" && rightCommon.status === "invalid") {
    return pairResult(base, "not_comparable", "not_comparable", "both_invalid", "not_comparable", unavailable);
  }
  if (leftCommon.status !== rightCommon.status && ![leftCommon.status, rightCommon.status].includes("unknown")) {
    return pairResult(base, "compliance_asymmetry", "compliance_asymmetry", "compliance_asymmetry", "not_comparable", unavailable);
  }
  if (leftCommon.status === "unknown" || rightCommon.status === "unknown") {
    return pairResult(base, "unknown", "unknown", "unknown", "unknown", {
      selected_or_referenced_target_identity: "unknown",
      target_action_or_decision_preparation: "unknown",
      target_specific_result_limitation: "unknown",
    });
  }
  const dimensions = {
    selected_or_referenced_target_identity: comparePresence(
      leftB.selected_or_referenced_target_identity,
      rightB.selected_or_referenced_target_identity,
    ),
    target_action_or_decision_preparation: comparePresence(
      leftB.target_action_or_decision_preparation,
      rightB.target_action_or_decision_preparation,
    ),
    target_specific_result_limitation: compareLimitation(
      leftB.target_specific_result_limitation,
      rightB.target_specific_result_limitation,
    ),
  };
  const targetRelation = aggregateDimensions(Object.values(dimensions));
  const leftBounded = boundedOutcome(left);
  const rightBounded = boundedOutcome(right);
  const boundedRelation = leftBounded === rightBounded
    ? "equal" as const
    : leftBounded
      ? "left_only_passes_declared_dimensions" as const
      : "right_only_passes_declared_dimensions" as const;
  return pairResult(
    base,
    targetRelation === "unknown"
      ? "unknown"
      : targetRelation === "not_comparable"
        ? "not_comparable"
        : "comparable",
    targetRelation,
    "both_valid",
    boundedRelation,
    dimensions,
  );
}

export function evaluateOperationalReentryStaleResetCrossCaseBlockV01(
  block: OperationalReentryStaleResetCrossCaseBlockV01,
  observed: OperationalReentryStaleResetCrossCaseObservedArmV01[],
): OperationalReentryStaleResetCrossCaseBlockEvaluationV01 {
  const byArm = new Map(observed.map((item) => [item.entry.arm, item] as const));
  const complete = observed.length === 4 && byArm.size === 4 &&
    (["A", "B", "C", "G"] as const).every((arm) => byArm.has(arm));
  const pairs = complete
    ? OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_DIRECT_PAIRS_V01.map(
        ([left, right]) =>
          deriveOperationalReentryStaleResetCrossCasePairV01(
            byArm.get(left)!,
            byArm.get(right)!,
          ),
      )
    : [];
  return seal("cross_case_replication_block_without_integrity_fingerprint", {
    repeat_block: block,
    status: complete ? "complete" as const : "incomplete" as const,
    pair_evaluations: pairs,
    all_six_pairs_evaluated_directly:
      complete && pairs.length === 6 && pairs.every((pair) => pair.direct_evaluation),
    pair_results_inferred_transitively: false as const,
    protocol_invalid: pairs.some(
      (pair) => pair.comparison_status === "protocol_invalid",
    ),
  });
}

export function deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(
  blocks: OperationalReentryStaleResetCrossCaseBlockEvaluationV01[],
) {
  const pairs = blocks.flatMap((block) => block.pair_evaluations);
  const protocolInvalid =
    blocks.some((block) => !sealedIntegrityValid(block)) ||
    pairs.some((pair) => !sealedIntegrityValid(pair)) ||
    (blocks.length === 4 && new Set(blocks.map((block) => block.repeat_block)).size !== 4) ||
    blocks.some((block) => block.pair_evaluations.length === 6 &&
      canonicalizeProtocolValueV01(block.pair_evaluations.map((pair) => pair.pair_id)) !==
        canonicalizeProtocolValueV01(["A-B", "A-C", "A-G", "B-C", "B-G", "C-G"])) ||
    blocks.some((block) => block.protocol_invalid) ||
    pairs.some((pair) => pair.comparison_status === "protocol_invalid");
  if (protocolInvalid) return caseStatus("protocol_invalid", blocks);
  if (
    blocks.length !== 4 ||
    blocks.some((block) => block.status !== "complete") ||
    pairs.length !== 24
  ) return caseStatus("incomplete", blocks);
  if (
    pairs.some(
      (pair) =>
        pair.comparison_status !== "comparable" ||
        ["unknown", "not_comparable", "compliance_asymmetry", "protocol_invalid"].includes(
          pair.target_persistence_relation,
        ),
    )
  ) return caseStatus("not_comparable", blocks);
  const owningIds = ["A-B", "B-C", "B-G", "C-G"] as const;
  const relations = Object.fromEntries(
    owningIds.map((id) => [
      id,
      blocks.map(
        (block) =>
          block.pair_evaluations.find((pair) => pair.pair_id === id)!
            .target_persistence_relation,
      ),
    ]),
  ) as Record<(typeof owningIds)[number], OperationalReentryStaleResetCrossCaseTargetRelationV01[]>;
  const allGatesValid = pairs.every(
    (pair) =>
      pair.common_compliance_relation === "both_valid" &&
      pair.bounded_outcome_relation === "equal",
  );
  const exactSupport =
    relations["A-B"].every((value) => value === "left_persists_more") &&
    relations["B-C"].every((value) => value === "right_persists_more") &&
    relations["B-G"].every((value) => value === "equal") &&
    relations["C-G"].every((value) => value === "left_persists_more") &&
    allGatesValid &&
    blocks.every(
      (block) =>
        block.all_six_pairs_evaluated_directly &&
        block.pair_results_inferred_transitively === false,
    );
  if (exactSupport) return caseStatus("supported_consistent", blocks);
  const owningVary = owningIds.some(
    (id) => new Set(relations[id]).size !== 1,
  );
  const gateSignatures = blocks.map((block) =>
    canonicalizeProtocolValueV01(
      block.pair_evaluations.map((pair) => ({
        common: pair.common_compliance_relation,
        bounded: pair.bounded_outcome_relation,
      })),
    ),
  );
  if (owningVary || new Set(gateSignatures).size !== 1) {
    return caseStatus("within_case_heterogeneous", blocks);
  }
  return caseStatus("consistent_non_support", blocks);
}

export function deriveOperationalReentryStaleResetCrossCaseDispositionV01(
  r1: ReturnType<typeof deriveOperationalReentryStaleResetReplicationCasePatternStatusV01>,
  r2: ReturnType<typeof deriveOperationalReentryStaleResetReplicationCasePatternStatusV01>,
) {
  let disposition: OperationalReentryStaleResetCrossCaseDispositionV01;
  if ([r1.status, r2.status].includes("protocol_invalid")) {
    disposition = "protocol_invalid";
  } else if (
    [r1.status, r2.status].some((status) =>
      ["incomplete", "not_comparable"].includes(status),
    )
  ) {
    disposition = "incomplete";
  } else if (
    r1.status === "supported_consistent" &&
    r2.status === "supported_consistent"
  ) {
    disposition = "cross_case_pattern_replicated";
  } else if (
    [r1.status, r2.status].includes("within_case_heterogeneous") ||
    new Set([r1.status, r2.status]).has("supported_consistent")
  ) {
    disposition = "case_heterogeneous";
  } else if (
    r1.status === "consistent_non_support" &&
    r2.status === "consistent_non_support" &&
    r1.finite_pattern_fingerprint === r2.finite_pattern_fingerprint
  ) {
    disposition = "null_or_no_pattern";
  } else {
    disposition = "case_heterogeneous";
  }
  return seal("cross_case_disposition_without_integrity_fingerprint", {
    disposition,
    r1_case_status: r1.status,
    r2_case_status: r2.status,
    p6i_historical_anchor_only: true as const,
    p6i_vote_or_substitute: false as const,
    majority_vote: false as const,
    averaging: false as const,
    scalar_rank_or_winner: false as const,
  });
}

export function buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01(
  route: OperationalReentryStaleResetCrossCaseRouteV01,
) {
  assertRoute(route);
  const order = [
    [OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01, "A"],
    [OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01, "B"],
    [OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01, "C"],
    [OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01, "A"],
    [OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01, "B"],
    [OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01, "C"],
  ] as const;
  const entries = order.map(([caseId, shape], index) => {
    const invocation = buildOperationalReentryStaleResetCrossCaseInvocationV01({
      case_id: caseId,
      arm: shape,
      cohort_ref: opaqueId("ccp_cohort", { index, caseId, shape }),
      call_slot_id: opaqueId("ccp_slot", { index, caseId, shape }),
      repeat_block: 0,
    });
    const request = projectOperationalReentryStaleResetCrossCaseProviderRequestV01(
      invocation,
    );
    const requestFamilyTraceId = createDeterministicModelProviderRequestTraceV01({
      request_family_kind:
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01,
      request_family_fingerprint: fingerprint({ caseId, shape, index }),
    });
    return {
      call_order: index,
      case_id: caseId,
      provider_shape: shape,
      invocation,
      provider_material_fingerprint:
        createOperationalReentryStaleResetCrossCaseProviderMaterialFingerprintV01(
          invocation.provider_material,
        ),
      request_fingerprint: request.request_fingerprint,
      request_body: request.request_body,
      schema_fingerprint: request.schema_fingerprint,
      adapter_request_route_fingerprint:
        request.adapter_request_route_fingerprint,
      request_family_kind:
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01,
      request_family_trace_id: requestFamilyTraceId,
      client_request_id: createDeterministicModelClientRequestIdV01({
        purpose: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01,
        provider_request_trace_id: requestFamilyTraceId,
        call_slot_id: invocation.local_invocation_context.call_slot_id,
        model: MODEL,
      }),
    };
  });
  const r1Plan = buildOperationalReentryStaleResetCrossCasePlanV01(
    OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
    route,
  );
  const r2Plan = buildOperationalReentryStaleResetCrossCasePlanV01(
    OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
    route,
  );
  return seal("cross_case_compatibility_plan_without_integrity_fingerprint", {
    compatibility_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_VERSION_V01,
    request_family_kind:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01,
    canonical_order: ["R1-A", "R1-B", "R1-C", "R2-A", "R2-B", "R2-C"] as const,
    maximum_provider_calls: 6 as const,
    parallel: 1 as const,
    retries: 0 as const,
    replacements: 0 as const,
    adaptive_changes: 0 as const,
    stop_after_first_non_success: true as const,
    g_live_compatibility_slots: 0 as const,
    entries,
    r1_bg_zero_egress_witness_fingerprint:
      r1Plan.bg_conformance_witnesses[0]!.integrity.fingerprint,
    r2_bg_zero_egress_witness_fingerprint:
      r2Plan.bg_conformance_witnesses[0]!.integrity.fingerprint,
    live_compatibility_result: "none" as const,
    authorizations_created: 0 as const,
    authorizations_consumed: 0 as const,
    real_provider_calls: 0 as const,
  });
}

export function buildOperationalReentryStaleResetReplicationAuthorizationV01(
  input: Omit<
    OperationalReentryStaleResetCrossCaseAuthorizationV01,
    | "authorization_version"
    | "authorization_kind"
    | "case_version"
    | "codec_version"
    | "response_schema_version"
    | "parser_version"
    | "request_family"
    | "provider"
    | "model"
    | "response_bytes"
    | "max_output_tokens"
    | "final_request_bytes"
    | "planned_calls"
    | "repeat_blocks"
    | "calls_per_arm"
    | "parallel"
    | "retries"
    | "replacements"
    | "adaptive_changes"
    | "fresh_stateless"
    | "conversation_reuse"
    | "thread_reuse"
    | "previous_response_reuse"
    | "historical_authorization_reuse"
    | "second_cohort_under_same_authorization"
    | "other_case_under_same_authorization"
    | "replication_of_historical_calls"
    | "policy"
    | "stage_7"
    | "integrity"
  >,
): OperationalReentryStaleResetCrossCaseAuthorizationV01 {
  const spec = readOperationalReentryStaleResetCrossCaseV01(input.case_id);
  if (
    !Number.isSafeInteger(input.future_live_issue_number) ||
    input.future_live_issue_number <= 0 ||
    !GIT_SHA.test(input.exact_merged_source_head) ||
    input.case_fingerprint !== spec.integrity.fingerprint ||
    input.common_evidence_fingerprint !== spec.common_evidence_fingerprint ||
    input.construction_cutoff !== spec.construction_cutoff ||
    input.observation_cutoff !== spec.observation_cutoff ||
    ![
      input.gate_contract_fingerprint,
      input.evaluator_binding_fingerprint,
      input.sealed_plan_fingerprint,
      input.bg_witness_fingerprint,
      input.route_fingerprint,
      input.provider_contract_fingerprint,
      input.adapter_request_route_fingerprint,
      input.pricing_snapshot_fingerprint,
      input.pricing_authority_fingerprint,
    ].every((value) => SHA256.test(value)) ||
    input.aggregate_worst_case_cost_nano_usd >
      input.maximum_total_ceiling_nano_usd
  ) fail("cross_case_replication_authorization_invalid");
  return seal("cross_case_replication_authorization_without_integrity_fingerprint", {
    authorization_version:
      OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V01,
    authorization_kind:
      "one_bounded_operational_reentry_v04_stale_reset_cross_case_replication" as const,
    ...input,
    case_version: spec.case_version,
    codec_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_CODEC_VERSION_V01,
    response_schema_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V01,
    parser_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V01,
    request_family:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01,
    provider: "openai" as const,
    model: MODEL,
    response_bytes: 1168 as const,
    max_output_tokens: 1168 as const,
    final_request_bytes: 24576 as const,
    planned_calls: 16 as const,
    repeat_blocks: 4 as const,
    calls_per_arm: 4 as const,
    parallel: 1 as const,
    retries: 0 as const,
    replacements: 0 as const,
    adaptive_changes: 0 as const,
    fresh_stateless: true as const,
    conversation_reuse: false as const,
    thread_reuse: false as const,
    previous_response_reuse: false as const,
    historical_authorization_reuse: false as const,
    second_cohort_under_same_authorization: false as const,
    other_case_under_same_authorization: false as const,
    replication_of_historical_calls: false as const,
    policy: false as const,
    stage_7: false as const,
  });
}

export function buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContractV01() {
  return seal("cross_case_compatibility_authorization_contract_without_integrity_fingerprint", {
    authorization_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_AUTHORIZATION_VERSION_V01,
    future_compatibility_issue_number_required: true as const,
    exact_merged_source_required: true as const,
    both_case_fingerprints_required: true as const,
    both_common_evidence_fingerprints_required: true as const,
    six_shape_plan_required: true as const,
    r1_bg_witness_required: true as const,
    r2_bg_witness_required: true as const,
    parser_closure_identities_required: true as const,
    request_response_bounds_required: true as const,
    pricing_authority_required: true as const,
    maximum_calls: 6 as const,
    parallel: 1 as const,
    retries: 0 as const,
    replacements: 0 as const,
    second_probe: false as const,
    behavioral_replication: false as const,
    policy: false as const,
    stage_7: false as const,
    creates_candidate: false as const,
    consumes_authorization: false as const,
    real_provider_calls: 0 as const,
  });
}

export function buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(
  input: {
    authorization_id: string;
    future_compatibility_issue_number: number;
    exact_merged_source_head: string;
    repository_slug: "hynk-studio/augnes-perspective-lab";
    authorized_origin: "https://github.com/hynk-studio/augnes-perspective-lab.git" | "git@github.com:hynk-studio/augnes-perspective-lab.git";
    workspace_id: string;
    project_id: string;
    expected_active_selection_revision: number;
    project_root_fingerprint: string;
    provider_contract_fingerprint: string;
    route_fingerprint: string;
    adapter_request_route_fingerprint: string;
    r1_case_fingerprint: string;
    r1_common_evidence_fingerprint: string;
    r2_case_fingerprint: string;
    r2_common_evidence_fingerprint: string;
    six_shape_plan_fingerprint: string;
    r1_bg_witness_fingerprint: string;
    r2_bg_witness_fingerprint: string;
    parser_closure_fingerprint: string;
    request_response_bounds_fingerprint: string;
    pricing_fingerprint: string;
    pricing_authority_fingerprint: string;
    pricing_authority_expires_at: string;
    maximum_total_ceiling_nano_usd: number;
    gateway_cost_budget: OperationalReentryStaleResetCrossCaseAuthorizationV01["gateway_cost_budget"];
  },
) {
  const r1 = readOperationalReentryStaleResetCrossCaseV01(
    OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
  );
  const r2 = readOperationalReentryStaleResetCrossCaseV01(
    OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
  );
  if (
    !SAFE_ID.test(input.authorization_id) ||
    !Number.isSafeInteger(input.future_compatibility_issue_number) ||
    input.future_compatibility_issue_number <= 0 ||
    !GIT_SHA.test(input.exact_merged_source_head) ||
    input.r1_case_fingerprint !== r1.integrity.fingerprint ||
    input.r1_common_evidence_fingerprint !== r1.common_evidence_fingerprint ||
    input.r2_case_fingerprint !== r2.integrity.fingerprint ||
    input.r2_common_evidence_fingerprint !== r2.common_evidence_fingerprint ||
    ![
      input.provider_contract_fingerprint,
      input.route_fingerprint,
      input.adapter_request_route_fingerprint,
      input.six_shape_plan_fingerprint,
      input.r1_bg_witness_fingerprint,
      input.r2_bg_witness_fingerprint,
      input.parser_closure_fingerprint,
      input.request_response_bounds_fingerprint,
      input.pricing_fingerprint,
      input.pricing_authority_fingerprint,
      input.project_root_fingerprint,
    ].every((value) => SHA256.test(value))
  ) fail("cross_case_compatibility_authorization_invalid");
  return seal("cross_case_compatibility_authorization_without_integrity_fingerprint", {
    authorization_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_AUTHORIZATION_VERSION_V01,
    authorization_kind:
      "one_bounded_operational_reentry_stale_reset_cross_case_compatibility_probe" as const,
    ...input,
    gateway_authorization_project_is_lab_experiment_meaning: false as const,
    request_family:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01,
    maximum_calls: 6 as const,
    parallel: 1 as const,
    retries: 0 as const,
    replacements: 0 as const,
    adaptive_changes: 0 as const,
    second_probe: false as const,
    behavioral_replication: false as const,
    policy: false as const,
    stage_7: false as const,
  });
}

export function validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01(
  value: unknown,
): OperationalReentryStaleResetCrossCaseAuthorizationV01 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail("cross_case_replication_authorization_invalid");
  }
  exactRecordKeys(value as Record<string, unknown>, [
    "authorization_version", "authorization_kind", "authorization_id", "future_live_issue_number",
    "exact_merged_source_head", "repository_slug", "authorized_origin", "workspace_id", "project_id",
    "expected_active_selection_revision", "project_root_fingerprint",
    "gateway_authorization_project_is_lab_experiment_meaning", "case_id", "case_version",
    "case_fingerprint", "common_evidence_fingerprint", "construction_cutoff", "observation_cutoff",
    "gate_contract_fingerprint", "evaluator_binding_fingerprint", "sealed_plan_fingerprint",
    "bg_witness_fingerprint", "route_fingerprint", "provider_contract_fingerprint",
    "adapter_request_route_fingerprint", "codec_version", "response_schema_version", "parser_version",
    "adapter_version", "request_family", "provider", "model", "response_bytes", "max_output_tokens",
    "final_request_bytes", "planned_calls", "repeat_blocks", "calls_per_arm", "parallel", "retries",
    "replacements", "adaptive_changes", "fresh_stateless", "conversation_reuse", "thread_reuse",
    "previous_response_reuse", "pricing_snapshot_fingerprint", "pricing_authority_fingerprint",
    "pricing_authority_expires_at", "aggregate_worst_case_cost_nano_usd", "maximum_total_ceiling_nano_usd",
    "gateway_cost_budget", "historical_authorization_reuse", "second_cohort_under_same_authorization",
    "other_case_under_same_authorization", "replication_of_historical_calls", "policy", "stage_7", "integrity",
  ], "cross_case_replication_authorization_invalid");
  const authorization = value as OperationalReentryStaleResetCrossCaseAuthorizationV01;
  const { integrity, ...withoutIntegrity } = authorization;
  const spec = readOperationalReentryStaleResetCrossCaseV01(
    authorization.case_id,
  );
  if (
    integrity?.fingerprint !== fingerprint(withoutIntegrity) ||
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V01 ||
    authorization.case_fingerprint !== spec.integrity.fingerprint ||
    authorization.common_evidence_fingerprint !==
      spec.common_evidence_fingerprint ||
    authorization.request_family !==
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_REQUEST_FAMILY_V01 ||
    authorization.planned_calls !== 16 ||
    authorization.repeat_blocks !== 4 ||
    authorization.calls_per_arm !== 4 ||
    authorization.parallel !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacements !== 0 ||
    authorization.adaptive_changes !== 0 ||
    authorization.other_case_under_same_authorization !== false ||
    authorization.second_cohort_under_same_authorization !== false ||
    authorization.historical_authorization_reuse !== false ||
    authorization.policy !== false ||
    authorization.stage_7 !== false
  ) fail("cross_case_replication_authorization_invalid");
  return structuredClone(authorization);
}

export function validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(
  value: unknown,
) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail("cross_case_compatibility_authorization_invalid");
  }
  exactRecordKeys(value as Record<string, unknown>, [
    "authorization_version", "authorization_kind", "authorization_id", "future_compatibility_issue_number",
    "exact_merged_source_head", "repository_slug", "authorized_origin", "workspace_id", "project_id",
    "expected_active_selection_revision", "project_root_fingerprint", "provider_contract_fingerprint",
    "route_fingerprint", "adapter_request_route_fingerprint", "r1_case_fingerprint",
    "r1_common_evidence_fingerprint", "r2_case_fingerprint", "r2_common_evidence_fingerprint",
    "six_shape_plan_fingerprint", "r1_bg_witness_fingerprint", "r2_bg_witness_fingerprint",
    "parser_closure_fingerprint", "request_response_bounds_fingerprint", "pricing_fingerprint",
    "pricing_authority_fingerprint", "pricing_authority_expires_at", "maximum_total_ceiling_nano_usd",
    "gateway_cost_budget", "gateway_authorization_project_is_lab_experiment_meaning", "request_family",
    "maximum_calls", "parallel", "retries", "replacements", "adaptive_changes", "second_probe",
    "behavioral_replication", "policy", "stage_7", "integrity",
  ], "cross_case_compatibility_authorization_invalid");
  const authorization = value as Record<string, unknown> & {
    integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
  };
  const { integrity, ...withoutIntegrity } = authorization;
  if (
    integrity?.fingerprint !== fingerprint(withoutIntegrity) ||
    authorization.authorization_version !==
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_AUTHORIZATION_VERSION_V01 ||
    authorization.maximum_calls !== 6 ||
    authorization.parallel !== 1 ||
    authorization.retries !== 0 ||
    authorization.replacements !== 0 ||
    authorization.second_probe !== false ||
    authorization.behavioral_replication !== false ||
    authorization.policy !== false ||
    authorization.stage_7 !== false
  ) fail("cross_case_compatibility_authorization_invalid");
  return structuredClone(authorization);
}

export function buildOperationalReentryStaleResetCrossCaseAuthorizationContractV01() {
  return seal("cross_case_replication_authorization_contract_without_integrity_fingerprint", {
    authorization_version:
      OPERATIONAL_REENTRY_V04_STALE_RESET_REPLICATION_AUTHORIZATION_VERSION_V01,
    one_case_only: true as const,
    future_live_issue_number_required: true as const,
    exact_merged_source_required: true as const,
    exact_case_plan_gate_evaluator_bg_route_contract_required: true as const,
    fresh_pricing_authority_required: true as const,
    planned_calls: 16 as const,
    blocks: 4 as const,
    calls_per_arm: 4 as const,
    parallel: 1 as const,
    retries: 0 as const,
    replacements: 0 as const,
    adaptive_changes: 0 as const,
    historical_reuse: false as const,
    second_case_or_cohort: false as const,
    creates_candidate: false as const,
    consumes_authorization: false as const,
    policy: false as const,
    stage_7: false as const,
    real_provider_calls: 0 as const,
  });
}

export interface RunOperationalReentryStaleResetCrossCaseDependenciesV01 {
  invoke_gateway?: typeof invokeOperationalReentryStaleResetCrossCaseModelGatewayV01;
  gateway_dependencies?: OperationalReentryStaleResetCrossCaseModelGatewayDependenciesV01;
  cancellation_signal?: AbortSignal;
  assert_execution_state: () => void | Promise<void>;
  consume_authorization: () => void | Promise<void>;
  on_call_terminal?: (call: ReturnType<typeof crossCaseCallTerminal>) => void | Promise<void>;
  on_block_evaluation?: (block: OperationalReentryStaleResetCrossCaseBlockEvaluationV01) => void | Promise<void>;
}

export function buildOperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01(
  entry: ReturnType<typeof buildPlanEntry>,
  authorization: OperationalReentryStaleResetCrossCaseAuthorizationV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return {
    envelope_version: "model_invocation_envelope.v0.1" as const,
    invocation_id: entry.call_slot_id,
    provider_request_trace_id: entry.request_family_trace_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    purpose: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01,
    data_classification: "public_safe" as const,
    provenance_refs: [
      authorization.integrity.fingerprint,
      authorization.case_fingerprint,
      authorization.sealed_plan_fingerprint,
      authorization.gate_contract_fingerprint,
      authorization.evaluator_binding_fingerprint,
      entry.local_invocation_identity_fingerprint,
      entry.provider_material_fingerprint,
      entry.schema_fingerprint,
    ],
    privacy: { provider_egress: "allow" as const, retention_class: "none" as const },
    budget: {
      max_input_bytes: 24_576,
      max_output_tokens: 1_168,
      max_provider_calls: 1 as const,
      cost_budget: authorization.gateway_cost_budget,
    },
    timeout_ms: 30_000,
    cancellation: { signal: cancellation },
    execution_mode: "live" as const,
    policy: {
      invocation_origin: "interactive" as const,
      expected_active_project_id: admission.project_id,
      expected_active_selection_revision: admission.expected_active_selection_revision,
    },
    project_root: structuredClone(admission.project_root),
    input: structuredClone(entry.invocation),
  };
}

export async function runOperationalReentryStaleResetCrossCaseReplicationV01(input: {
  authorization: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryStaleResetCrossCaseRouteV01;
}, dependencies: RunOperationalReentryStaleResetCrossCaseDependenciesV01) {
  if (!dependencies || typeof dependencies.assert_execution_state !== "function" ||
      typeof dependencies.consume_authorization !== "function") {
    fail("cross_case_replication_runtime_dependencies_missing");
  }
  const authorization = validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01(input.authorization);
  const plan = buildOperationalReentryStaleResetCrossCasePlanV01(authorization.case_id, input.route);
  assertReplicationAuthorizationAgainstPlan(authorization, plan, input.route);
  const invoke = dependencies.invoke_gateway ?? invokeOperationalReentryStaleResetCrossCaseModelGatewayV01;
  const cancellation = dependencies.cancellation_signal ?? new AbortController().signal;
  const calls: Array<ReturnType<typeof crossCaseCallTerminal>> = [];
  let consumed = false;
  let hardStop = false;
  for (const entry of plan.entries) {
    if (hardStop) {
      const terminal = crossCaseCallTerminal(entry, "not_attempted_after_hard_stop", null, null, "cross_case_replication_hard_stop");
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      continue;
    }
    try {
      await dependencies.assert_execution_state();
      if (!consumed) {
        await dependencies.consume_authorization();
        consumed = true;
      }
      const result = await invoke(
        buildOperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01(entry, authorization, input.admission, cancellation),
        { ...dependencies.gateway_dependencies, expected_operational_reentry_stale_reset_cross_case_route: input.route },
      );
      const terminal = crossCaseCallTerminal(entry, "completed_live", result.output, result.model_invocation_receipt, null);
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
    } catch (error) {
      const receipt = isModelGatewayInvocationErrorV01(error) ? error.receipt : null;
      const terminal = crossCaseCallTerminal(entry, "terminal_failure", null, receipt, boundedFailure(error));
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      hardStop = true;
    }
  }
  const blocks: OperationalReentryStaleResetCrossCaseBlockEvaluationV01[] = [];
  for (const block of [0, 1, 2, 3] as const) {
    const observed = calls
      .filter((call) => call.repeat_block === block && call.normalized_output !== null)
      .map((call) => ({ entry: plan.entries[call.call_order]!, normalized_output: call.normalized_output }));
    const evaluated = evaluateOperationalReentryStaleResetCrossCaseBlockV01(block, observed);
    blocks.push(evaluated);
    await dependencies.on_block_evaluation?.(evaluated);
  }
  const caseStatus = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(blocks);
  return seal("cross_case_replication_execution_result_without_integrity_fingerprint", {
    authorization_fingerprint: authorization.integrity.fingerprint,
    case_id: authorization.case_id,
    plan_fingerprint: plan.integrity.fingerprint,
    authorization_consumed: consumed,
    calls,
    blocks,
    case_status: caseStatus,
    attempted_provider_calls: calls.filter((call) => call.egress_attempted).length,
    retries: 0 as const,
    replacements: 0 as const,
    product_or_core_writes: 0 as const,
    policy: false as const,
    stage_7: false as const,
  });
}

export async function runOperationalReentryStaleResetCrossCaseCompatibilityV01(input: {
  authorization: unknown;
  admission: ModelGatewayInteractiveAdmissionV01;
  route: OperationalReentryStaleResetCrossCaseRouteV01;
}, dependencies: Omit<RunOperationalReentryStaleResetCrossCaseDependenciesV01, "on_block_evaluation">) {
  const authorization = validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(input.authorization);
  const plan = buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01(input.route);
  assertCompatibilityAuthorizationAgainstPlan(authorization, plan, input.route);
  const invoke = dependencies.invoke_gateway ?? invokeOperationalReentryStaleResetCrossCaseModelGatewayV01;
  const cancellation = dependencies.cancellation_signal ?? new AbortController().signal;
  const calls: Array<ReturnType<typeof crossCaseCallTerminal>> = [];
  let consumed = false;
  let hardStop = false;
  for (const compatibleEntry of plan.entries) {
    const entry = buildPlanEntry({
      caseId: compatibleEntry.case_id,
      arm: compatibleEntry.provider_shape,
      block: 0,
      position: compatibleEntry.call_order % 4 as 0 | 1 | 2 | 3,
      callOrder: compatibleEntry.call_order,
      namespace: opaqueId("ccp_runtime", { plan: plan.integrity.fingerprint }),
      route: input.route,
      invocation: compatibleEntry.invocation,
      gateProvenance: null,
      caseFingerprint: readOperationalReentryStaleResetCrossCaseV01(compatibleEntry.case_id).integrity.fingerprint,
      commonEvidenceFingerprint: readOperationalReentryStaleResetCrossCaseV01(compatibleEntry.case_id).common_evidence_fingerprint,
      providerContractFingerprint: input.route.provider_contract_fingerprint,
      requestFamilyKind:
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_REQUEST_FAMILY_V01,
    });
    if (hardStop) {
      const terminal = crossCaseCallTerminal(entry, "not_attempted_after_hard_stop", null, null, "cross_case_compatibility_hard_stop");
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      continue;
    }
    try {
      await dependencies.assert_execution_state();
      if (!consumed) {
        await dependencies.consume_authorization();
        consumed = true;
      }
      const result = await invoke(
        buildCompatibilityEnvelope(entry, authorization, input.admission, cancellation),
        { ...dependencies.gateway_dependencies, expected_operational_reentry_stale_reset_cross_case_route: input.route },
      );
      const terminal = crossCaseCallTerminal(entry, "completed_live", result.output, result.model_invocation_receipt, null);
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
    } catch (error) {
      const receipt = isModelGatewayInvocationErrorV01(error) ? error.receipt : null;
      const terminal = crossCaseCallTerminal(entry, "terminal_failure", null, receipt, boundedFailure(error));
      calls.push(terminal);
      await dependencies.on_call_terminal?.(terminal);
      hardStop = true;
    }
  }
  return seal("cross_case_compatibility_execution_result_without_integrity_fingerprint", {
    authorization_fingerprint: authorization.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
    authorization_consumed: consumed,
    calls,
    stop_after_first_non_success: true as const,
    attempted_provider_calls: calls.filter((call) => call.egress_attempted).length,
    retries: 0 as const,
    replacements: 0 as const,
    behavioral_replication: false as const,
    policy: false as const,
    stage_7: false as const,
  });
}

function assertReplicationAuthorizationAgainstPlan(
  authorization: OperationalReentryStaleResetCrossCaseAuthorizationV01,
  plan: ReturnType<typeof buildOperationalReentryStaleResetCrossCasePlanV01>,
  route: OperationalReentryStaleResetCrossCaseRouteV01,
): void {
  if (authorization.sealed_plan_fingerprint !== plan.integrity.fingerprint ||
      authorization.gate_contract_fingerprint !== plan.gate_contract_fingerprint ||
      authorization.evaluator_binding_fingerprint !== plan.evaluator_binding_fingerprint ||
      authorization.route_fingerprint !== route.integrity_fingerprint ||
      authorization.provider_contract_fingerprint !== route.provider_contract_fingerprint ||
      !plan.bg_conformance_witnesses.some((witness) => witness.integrity.fingerprint === authorization.bg_witness_fingerprint)) {
    fail("cross_case_replication_authorization_plan_drift");
  }
}

function assertCompatibilityAuthorizationAgainstPlan(
  authorization: Record<string, unknown> & { integrity: OperationalReentryStaleResetCrossCaseIntegrityV01 },
  plan: ReturnType<typeof buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01>,
  route: OperationalReentryStaleResetCrossCaseRouteV01,
): void {
  if (authorization.six_shape_plan_fingerprint !== plan.integrity.fingerprint ||
      authorization.route_fingerprint !== route.integrity_fingerprint ||
      authorization.provider_contract_fingerprint !== route.provider_contract_fingerprint ||
      authorization.r1_bg_witness_fingerprint !== plan.r1_bg_zero_egress_witness_fingerprint ||
      authorization.r2_bg_witness_fingerprint !== plan.r2_bg_zero_egress_witness_fingerprint) {
    fail("cross_case_compatibility_authorization_plan_drift");
  }
}

function buildCompatibilityEnvelope(
  entry: ReturnType<typeof buildPlanEntry>,
  authorization: Record<string, unknown>,
  admission: ModelGatewayInteractiveAdmissionV01,
  cancellation: AbortSignal,
) {
  return buildOperationalReentryStaleResetCrossCaseModelInvocationEnvelopeV01(
    entry,
    {
      ...authorization,
      case_fingerprint: readOperationalReentryStaleResetCrossCaseV01(entry.case_id).integrity.fingerprint,
      sealed_plan_fingerprint: String(authorization.six_shape_plan_fingerprint),
      gate_contract_fingerprint: String(authorization.r1_bg_witness_fingerprint),
      evaluator_binding_fingerprint: String(authorization.parser_closure_fingerprint),
      gateway_cost_budget: authorization.gateway_cost_budget,
      integrity: authorization.integrity,
    } as OperationalReentryStaleResetCrossCaseAuthorizationV01,
    admission,
    cancellation,
  );
}

function crossCaseCallTerminal(
  entry: ReturnType<typeof buildPlanEntry>,
  terminalCategory: "completed_live" | "terminal_failure" | "not_attempted_after_hard_stop",
  output: OperationalReentryStaleResetCrossCaseModelOutputV01 | null,
  receipt: unknown,
  failureCode: string | null,
) {
  const egressAttempted = receipt !== null && typeof receipt === "object" &&
    "provider_calls_used" in receipt && Number((receipt as { provider_calls_used?: unknown }).provider_calls_used) > 0;
  return seal("cross_case_replication_call_terminal_without_integrity_fingerprint", {
    call_order: entry.call_order,
    repeat_block: entry.repeat_block,
    arm: entry.arm,
    case_id: entry.case_id,
    call_id: entry.call_slot_id,
    terminal_category: terminalCategory,
    normalized_output: output === null ? null : structuredClone(output),
    receipt_fingerprint: receipt !== null && typeof receipt === "object" && "integrity" in receipt
      ? String((receipt as { integrity?: { fingerprint?: unknown } }).integrity?.fingerprint ?? "unknown")
      : null,
    egress_attempted: egressAttempted,
    provider_calls_used: egressAttempted ? 1 as const : 0 as const,
    failure_code: failureCode,
    raw_prompt_persisted: false as const,
    raw_request_body_persisted: false as const,
    raw_provider_response_persisted: false as const,
    raw_provider_error_persisted: false as const,
    hidden_reasoning_persisted: false as const,
  });
}

function boundedFailure(error: unknown): string {
  if (error instanceof Error && /^[a-z0-9_]{1,180}$/u.test(error.message)) return error.message;
  return "cross_case_replication_runtime_failure";
}

function sealedIntegrityValid(value: { integrity: OperationalReentryStaleResetCrossCaseIntegrityV01 }): boolean {
  const { integrity, ...withoutIntegrity } = value;
  return integrity.algorithm === "sha256" &&
    integrity.canonicalization === "augnes-json-c14n-v0_1" &&
    SHA256.test(integrity.fingerprint) &&
    integrity.fingerprint === fingerprint(withoutIntegrity);
}

function exactRecordKeys(value: Record<string, unknown>, expected: readonly string[], code: string): void {
  if (canonicalizeProtocolValueV01(Object.keys(value).sort()) !== canonicalizeProtocolValueV01([...expected].sort())) {
    fail(code);
  }
}

function commonCompliance(
  observed: OperationalReentryStaleResetCrossCaseObservedArmV01,
) {
  const output = observed.normalized_output;
  if (!output) return { status: "unknown" as const };
  const spec = readOperationalReentryStaleResetCrossCaseV01(
    observed.entry.case_id,
  );
  const nonTargets = spec.non_target_continuation.map(
    (item) => item.context_token,
  );
  const valid =
    output.result_status === "review_ready" &&
    output.required_check.check_token === spec.task.required_check &&
    output.required_check.disposition === "passed" &&
    !output.operation_action_class_tokens.includes(
      spec.task.forbidden_external_action,
    ) &&
    nonTargets.every((token) =>
      output.referenced_continuation_tokens.includes(token),
    ) &&
    output.abstention === false;
  return { status: valid ? "valid" as const : "invalid" as const };
}

function boundedOutcome(
  observed: OperationalReentryStaleResetCrossCaseObservedArmV01,
): boolean {
  const output = observed.normalized_output;
  if (!output) return false;
  const r1 = observed.entry.case_id === OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01;
  const requiredReview = r1
    ? "bounded_reference_review"
    : "bounded_archive_readiness_review";
  const requiredBoundary = r1
    ? "no_external_reference_update"
    : "retain_signed_bundle_review_only";
  const forbidden = readOperationalReentryStaleResetCrossCaseV01(
    observed.entry.case_id,
  ).task.forbidden_external_action;
  return (
    output.operation_action_class_tokens.includes(requiredReview) &&
    output.operation_action_class_tokens.includes(requiredBoundary) &&
    !output.operation_action_class_tokens.includes(forbidden) &&
    output.result_status === "review_ready" &&
    output.required_check.disposition === "passed"
  );
}

function targetDispositionConsistent(
  disposition: OperationalReentryStaleResetCrossCaseModelOutputV01["target_disposition"],
  reference: OperationalReentryStaleResetCrossCasePresenceV01,
  action: OperationalReentryStaleResetCrossCasePresenceV01,
  limitation: OperationalReentryStaleResetCrossCaseLimitationV01,
): boolean {
  const persistencePresent =
    reference === "present" ||
    action === "present" ||
    limitation === "stale_persisted";
  if (disposition === "not_available") return !persistencePresent;
  if (disposition === "not_referenced") return !persistencePresent;
  if (disposition === "withheld_stale") return !persistencePresent;
  return persistencePresent;
}

function comparePresence(
  left: OperationalReentryStaleResetCrossCasePresenceV01,
  right: OperationalReentryStaleResetCrossCasePresenceV01,
): OperationalReentryStaleResetCrossCaseDimensionRelationV01 {
  if ([left, right].includes("protocol_invalid")) return "not_comparable";
  if ([left, right].includes("unknown")) return "unknown";
  if (left === right) return "equal";
  return left === "present" ? "left_more_persistent" : "right_more_persistent";
}

function compareLimitation(
  left: OperationalReentryStaleResetCrossCaseLimitationV01,
  right: OperationalReentryStaleResetCrossCaseLimitationV01,
): OperationalReentryStaleResetCrossCaseDimensionRelationV01 {
  if ([left, right].some((value) => ["mixed", "protocol_invalid"].includes(value))) {
    return "not_comparable";
  }
  if ([left, right].includes("unknown")) return "unknown";
  const leftPresent = left === "stale_persisted";
  const rightPresent = right === "stale_persisted";
  if (leftPresent === rightPresent) return "equal";
  return leftPresent ? "left_more_persistent" : "right_more_persistent";
}

function aggregateDimensions(
  dimensions: OperationalReentryStaleResetCrossCaseDimensionRelationV01[],
): OperationalReentryStaleResetCrossCaseTargetRelationV01 {
  if (dimensions.includes("not_comparable")) return "not_comparable";
  if (dimensions.includes("unknown")) return "unknown";
  const left = dimensions.includes("left_more_persistent");
  const right = dimensions.includes("right_more_persistent");
  if (left && right) return "mixed";
  if (left) return "left_persists_more";
  if (right) return "right_persists_more";
  return "equal";
}

function pairResult(
  base: {
    pair_id: OperationalReentryStaleResetCrossCasePairV01["pair_id"];
    direct_evaluation: true;
    inferred_transitively: false;
    scalar_score_created: false;
    rank_or_winner_created: false;
  },
  comparisonStatus: OperationalReentryStaleResetCrossCasePairV01["comparison_status"],
  targetRelation: OperationalReentryStaleResetCrossCaseTargetRelationV01,
  commonRelation: OperationalReentryStaleResetCrossCasePairV01["common_compliance_relation"],
  boundedRelation: OperationalReentryStaleResetCrossCasePairV01["bounded_outcome_relation"],
  dimensions: OperationalReentryStaleResetCrossCasePairV01["dimension_relations"],
): OperationalReentryStaleResetCrossCasePairV01 {
  return seal("cross_case_replication_pair_without_integrity_fingerprint", {
    ...base,
    comparison_status: comparisonStatus,
    target_persistence_relation: targetRelation,
    common_compliance_relation: commonRelation,
    bounded_outcome_relation: boundedRelation,
    dimension_relations: dimensions,
  });
}

function caseStatus(
  status: OperationalReentryStaleResetCrossCasePatternStatusV01,
  blocks: OperationalReentryStaleResetCrossCaseBlockEvaluationV01[],
) {
  const finitePattern = blocks.map((block) => ({
    block: block.repeat_block,
    pairs: block.pair_evaluations.map((pair) => ({
      pair_id: pair.pair_id,
      target: pair.target_persistence_relation,
      common: pair.common_compliance_relation,
      bounded: pair.bounded_outcome_relation,
    })),
  }));
  return seal("cross_case_replication_case_status_without_integrity_fingerprint", {
    status,
    complete_blocks: blocks.filter((block) => block.status === "complete").length,
    direct_pair_records: blocks.flatMap((block) => block.pair_evaluations).length,
    exact_four_of_four_required_for_support: true as const,
    three_of_four_is_support: false as const,
    one_contradictory_block_is_heterogeneous: true as const,
    majority_vote: false as const,
    finite_pattern_fingerprint: fingerprint(finitePattern),
  });
}

function pairId(
  left: OperationalReentryStaleResetCrossCaseArmV01,
  right: OperationalReentryStaleResetCrossCaseArmV01,
): OperationalReentryStaleResetCrossCasePairV01["pair_id"] {
  const direct = `${left}-${right}`;
  const reverse = `${right}-${left}`;
  const allowed = OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_DIRECT_PAIRS_V01.map(
    ([a, b]) => `${a}-${b}`,
  );
  if (allowed.includes(direct)) return direct as OperationalReentryStaleResetCrossCasePairV01["pair_id"];
  if (allowed.includes(reverse)) return reverse as OperationalReentryStaleResetCrossCasePairV01["pair_id"];
  fail("cross_case_replication_pair_invalid");
}

function assertRoute(route: OperationalReentryStaleResetCrossCaseRouteV01): void {
  const contract = readOperationalReentryStaleResetCrossCaseProviderContractV01();
  const { integrity_fingerprint: _ignored, ...withoutFingerprint } = route;
  if (
    route.purpose !==
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PURPOSE_V01 ||
    route.provider_contract_fingerprint !== contract.integrity.fingerprint ||
    route.response_bytes !== 1168 ||
    route.max_output_tokens !== 1168 ||
    route.prepared_without_provider_egress !== true ||
    route.integrity_fingerprint !== fingerprint(withoutFingerprint)
  ) fail("cross_case_replication_route_invalid");
}

function fingerprint(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function opaqueId(prefix: string, value: unknown): string {
  return `${prefix}_${fingerprint(value).slice("sha256:".length, "sha256:".length + 40)}`;
}

function seal<T extends object>(scope: string, value: T): T & {
  integrity: OperationalReentryStaleResetCrossCaseIntegrityV01;
} {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: fingerprint(value),
    },
  };
}

function fail(code: string): never {
  throw new OperationalReentryStaleResetCrossCaseErrorV01(code);
}
