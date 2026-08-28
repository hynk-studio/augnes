import { realpathSync, statSync } from "node:fs";
import path from "node:path";

import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  validateTaskContextPacketV01,
} from "@/lib/vnext/task-context-packet";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import { canonicalizeRepositoryRelativePathV01 } from "@/lib/vnext/repository-relative-path";
import { assertNativeHostResultV01 } from "@/lib/vnext/native-host/native-host-contract";
import {
  CODEX_APP_SERVER_REQUEST_SOURCE_BINDING_VERSION_V01,
  createCodexAppServerRequestSourceBindingV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import { materializeValidatedPacketDeliveryCheckV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostAdapterV01,
  NativeHostLifecycleEventV01,
  NativeHostRequestV01,
  NativeHostResumeBindingV01,
  NativeHostResultV01,
  NativeHostRootScopeV01,
} from "@/types/vnext/native-host-adapter";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  COMMISSIONED_WORK_CANONICALIZATION_V01,
  COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01,
  COMMISSIONED_WORK_CANDIDATE_VERSION_V01,
  COMMISSIONED_WORK_CASE_COMMITMENT_VERSION_V01,
  COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_CONDITIONS_V01,
  COMMISSIONED_WORK_EPISODE_ORIGIN_SOURCE_CHAIN_VERSION_V01,
  COMMISSIONED_WORK_EPISODE_ORIGIN_PROOF_VERSION_V01,
  COMMISSIONED_WORK_EPISODE_VERSION_V01,
  COMMISSIONED_WORK_EPISODE_CHECKPOINT_VERSION_V01,
  COMMISSIONED_WORK_EVALUATION_VERSION_V01,
  COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01,
  COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_EXECUTION_OBSERVATION_VERSION_V01,
  COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
  COMMISSIONED_WORK_FRESH_ORIGIN_OBSERVATION_VERSION_V01,
  COMMISSIONED_WORK_FAMILY_VERSION_V01,
  COMMISSIONED_WORK_HOLDOUT_VERSION_V01,
  COMMISSIONED_WORK_REPORT_VERSION_V01,
  COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01,
  COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01,
  type CommissionedWorkArtifactIndexV01,
  type CommissionedWorkAuthorizationResourceCeilingV01,
  type CommissionedWorkAuthoritySummaryV01,
  type CommissionedWorkCaseCommitmentV01,
  type CommissionedWorkCaseSourceV01,
  type CommissionedWorkConditionV01,
  type CommissionedWorkConsolidationCandidateV01,
  type CommissionedWorkEpisodeArtifactV01,
  type CommissionedWorkEpisodeCheckpointV01,
  type CommissionedWorkEpisodeExecutionBindingV01,
  type CommissionedWorkEpisodeExecutionSourceV01,
  type CommissionedWorkEpisodeOriginProofV01,
  type CommissionedWorkEpisodeOriginSourceChainV01,
  type CommissionedWorkEpisodeOriginV01,
  type CommissionedWorkEpisodePlanSourceV01,
  type CommissionedWorkEpisodeRoleV01,
  type CommissionedWorkExecutionEvidenceClassV01,
  type CommissionedWorkEvaluationVectorV01,
  type CommissionedWorkEvidenceLadderRowV01,
  type CommissionedWorkExecutionObservationV01,
  type CommissionedWorkExecutionResourceBindingV01,
  type CommissionedWorkFamilyManifestV01,
  type CommissionedWorkFinalReportV01,
  type CommissionedWorkFreshOriginObservationV01,
  type CommissionedWorkHardFailureCodeV01,
  type CommissionedWorkHoldoutEvaluationV01,
  type CommissionedWorkHoldoutRelationV01,
  type CommissionedWorkHoldoutVariantV01,
  type CommissionedWorkHostIdentityProvenanceV01,
  type CommissionedWorkIntegrityV01,
  type CommissionedWorkMaterialBoundaryV01,
  type CommissionedWorkNativeHostRefBindingV01,
  type CommissionedWorkObjectiveObservationV01,
  type CommissionedWorkOpaqueMaterialRefV01,
  type CommissionedWorkRecordRefV01,
  type CommissionedWorkResourceVectorV01,
  type CommissionedWorkRoleRefV01,
  type CommissionedWorkRuntimeBindingV01,
  type CommissionedWorkSameRunResumeSourceV01,
  type CommissionedWorkSourceMaterialV01,
  type CommissionedWorkSuccessorPlanSourceV01,
  type CommissionedWorkTrainingResultV01,
} from "@/types/vnext/commissioned-controlled-workbench";

const MAX_CASES_V01 = 4;
const MAX_SUCCESSOR_ARMS_V01 = 4;
const MAX_EPISODES_V01 = 20;
const MAX_REQUIRED_CHECKS_V01 = 8;
const MAX_REPOSITORY_FILES_V01 = 32;
const MAX_REPORT_BYTES_V01 = 8_388_608;
const MAX_STRINGS_V01 = 32_768;
const MAX_STRING_CHARACTERS_V01 = 4_096;
const MAX_COLLECTION_ENTRIES_V01 = 32_768;
const SAFE_CODE_V01 = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u;
const FINGERPRINT_V01 = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_SHA_V01 = /^[a-f0-9]{40}$/u;
const PRIVATE_ABSOLUTE_PATH_V01 =
  /(?:^|[\s"'`(])(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u;
const HARD_FAILURE_CODES_V01 = [
  "objective_oracle_failed",
  "objective_oracle_missing",
  "required_check_failed",
  "required_check_not_performed",
  "repository_diff_incorrect",
  "negative_space_revived",
  "source_currentness_mismatch",
  "project_scope_violation",
  "authority_expansion",
  "outside_root_effect",
  "native_host_failed",
  "native_host_cancelled",
  "native_host_unavailable",
  "transcript_inherited",
  "hidden_reasoning_inherited",
] as const satisfies readonly CommissionedWorkHardFailureCodeV01[];

const REPORT_SAFE_FALSE_INVARIANTS_V01 = new Set([
  "task_or_rubric_mutation_allowed",
  "holdout_content_in_manifest",
  "holdout_used_for_candidate_derivation",
  "source_content_included",
  "is_approval",
  "is_canonical_core_record",
  "is_naturalistic_rw1_evidence",
  "is_accepted_semantic_state",
  "is_policy",
  "is_proposal",
  "is_review_decision",
  "is_transition",
  "creates_production_run",
  "creates_product_execution_grant",
  "creates_active_pointer",
  "writes_product_database",
  "mutates_source_records",
  "mutates_task_context_packet",
  "mutates_semantic_state",
  "activates_policy",
  "authorizes_provider_calls",
  "authorizes_network_use",
  "authorizes_external_effects",
  "authorizes_github_mutation",
  "authorizes_publication",
  "authorizes_merge",
  "creates_scalar_fitness",
  "creates_rank_or_winner",
  "creates_live_cohort",
  "creates_live_authorization",
  "mutates_rw1_or_rw1a_material",
  "claims_rw1_conclusion",
  "claims_general_benefit",
  "claims_stage_7",
  "raw_prompt_included",
  "raw_transcript_included",
  "raw_terminal_output_included",
  "raw_provider_output_included",
  "hidden_reasoning_included",
  "credential_or_secret_included",
  "absolute_local_path_included",
  "production_project_content_included",
  "arbitrary_source_prose_in_report",
  "predecessor_transcript_inherited",
  "hidden_reasoning_inherited",
  "executor_completion_is_outcome_truth",
  "product_execution_grant_created",
  "live_authorization_created",
  "fixture_admission_reused",
  "predecessor_run_reused",
  "holdout_included_in_derivation",
  "repeated_same_origin_counted_as_independent",
  "whole_bundle_credit_applied",
  "accepted_semantic_state_created",
  "active_context_created",
  "policy_created",
  "general_benefit_claimed",
  "general_harm_claimed",
  "policy_fitness_claimed",
  "behavioral_distinction_is_benefit",
  "solution_write_plan_checked_during_result_admission",
  "evidence_supported_procedural_knowledge",
  "independently_learned",
  "validated_for_transfer",
  "independent_support_established",
  "behavioral_benefit_established",
  "outcome_data_used",
  "report_claims_cleanup_completion",
  "raw_prompt_persisted",
  "raw_transcript_persisted",
  "hidden_reasoning_persisted",
  "credential_or_secret_persisted",
  "absolute_local_path_persisted",
  "production_project_content_persisted",
  "writes_outside_cw1_root",
]);

export class CommissionedControlledWorkbenchErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedControlledWorkbenchErrorV01";
  }
}

export interface BuildCommissionedWorkFamilyManifestInputV01 {
  family_id: string;
  workspace_id: string;
  task_family_key: string;
  sealed_at: string;
  construction_cutoff: string;
  evaluator_version: string;
  hypothesis: string;
  task_author_role_id: string;
  outcome_evaluator_role_id: string;
  consolidation_assessor_role_id: string;
  training_cases: [
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
  ];
  holdout_case: CommissionedWorkCaseSourceV01;
}

export interface BuildCommissionedWorkFamilyManifestFromCommitmentsInputV01 {
  family_id: string;
  workspace_id: string;
  task_family_key: string;
  sealed_at: string;
  construction_cutoff: string;
  evaluator_version: string;
  hypothesis_fingerprint: string;
  task_author_role_id: string;
  outcome_evaluator_role_id: string;
  consolidation_assessor_role_id: string;
  training_case_commitments: CommissionedWorkFamilyManifestV01["training_cases"];
  holdout_case_commitment: CommissionedWorkCaseCommitmentV01;
  equal_budget_fingerprint: string;
}

export interface BuildCommissionedWorkObjectiveObservationInputV01
  extends Omit<CommissionedWorkObjectiveObservationV01, "observation_version" | "integrity"> {
  case_commitment: CommissionedWorkCaseCommitmentV01;
}

export interface BuildCommissionedWorkSyntheticExecutionObservationInputV01 {
  packet: TaskContextPacketV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
}

export interface BuildCommissionedWorkCommissionedAgentExecutionObservationInputV01 {
  packet: TaskContextPacketV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  execution_evidence_class:
    | typeof COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01
    | typeof COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01;
  resume_source: CommissionedWorkSameRunResumeSourceV01 | null;
  packet_presentation: CommissionedWorkExecutionObservationV01["packet_presentation"];
  continuation_materials_delivered: number | null;
  candidate_components_delivered: number | null;
  delivered_material_set_fingerprint: string | null;
  first_material_action_at: string | null;
  first_material_action_timing_provenance:
    CommissionedWorkExecutionObservationV01["first_material_action"]["timing_provenance"];
  executor_completion_attestation:
    CommissionedWorkExecutionObservationV01["executor_completion_attestation"];
  resources: CommissionedWorkResourceVectorV01;
  resource_binding: CommissionedWorkExecutionResourceBindingV01;
  unauthorized_effects: CommissionedWorkObjectiveObservationV01["unauthorized_effects"];
}

export interface BuildCommissionedWorkEpisodeArtifactInputV01 {
  manifest: CommissionedWorkFamilyManifestV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  packet: TaskContextPacketV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  receipt: RunReceiptV01;
  observation: CommissionedWorkObjectiveObservationV01;
  execution_observation: CommissionedWorkExecutionObservationV01;
  episode_id: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  predecessor_episode_ref: CommissionedWorkRecordRefV01 | null;
  predecessor_checkpoint: CommissionedWorkEpisodeCheckpointV01 | null;
  episode_origin_source_chain: CommissionedWorkEpisodeOriginSourceChainV01 | null;
  candidate_freeze_fingerprint: string | null;
  repository_state: CommissionedWorkEpisodeArtifactV01["repository_state"];
  candidate_frozen_before_start: boolean | null;
  repository_action_trace_fingerprint: string;
  /**
   * Optional sealed cohort-owned executor identity. The source plan remains
   * authoritative for task/treatment material, while a commissioned cohort
   * may allocate a fresh opaque executor for an individual attempt without
   * cloning or mutating the source plan.
   */
  executor_role_id_override?: string;
}

export function createCommissionedWorkAuthoritySummaryV01(): CommissionedWorkAuthoritySummaryV01 {
  return {
    is_approval: false,
    is_canonical_core_record: false,
    is_naturalistic_rw1_evidence: false,
    is_accepted_semantic_state: false,
    is_policy: false,
    is_proposal: false,
    is_review_decision: false,
    is_transition: false,
    creates_production_run: false,
    creates_product_execution_grant: false,
    creates_active_pointer: false,
    writes_product_database: false,
    mutates_source_records: false,
    mutates_task_context_packet: false,
    mutates_semantic_state: false,
    activates_policy: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_effects: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    creates_scalar_fitness: false,
    creates_rank_or_winner: false,
    creates_live_cohort: false,
    creates_live_authorization: false,
    mutates_rw1_or_rw1a_material: false,
    claims_rw1_conclusion: false,
    claims_general_benefit: false,
    claims_stage_7: false,
  };
}

export function createCommissionedWorkMaterialBoundaryV01(): CommissionedWorkMaterialBoundaryV01 {
  return {
    bounded: true,
    max_cases: MAX_CASES_V01,
    max_successor_arms_per_case: MAX_SUCCESSOR_ARMS_V01,
    max_episode_artifacts: MAX_EPISODES_V01,
    max_required_checks_per_case: MAX_REQUIRED_CHECKS_V01,
    max_repository_files_per_case: MAX_REPOSITORY_FILES_V01,
    max_strings: MAX_STRINGS_V01,
    max_string_characters: MAX_STRING_CHARACTERS_V01,
    max_collection_entries: MAX_COLLECTION_ENTRIES_V01,
    max_report_bytes: MAX_REPORT_BYTES_V01,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
    production_project_content_included: false,
    arbitrary_source_prose_in_report: false,
  };
}

export function createCommissionedWorkRoleRefV01(
  roleKind: CommissionedWorkRoleRefV01["role_kind"],
  roleId: string,
): CommissionedWorkRoleRefV01 {
  requireSafeCodeV01(roleId, "commissioned_work_role_id_invalid");
  return {
    role_kind: roleKind,
    role_id: roleId,
    role_fingerprint: fingerprintV01({ role_kind: roleKind, role_id: roleId }),
  };
}

export function createCommissionedWorkRecordRefV01(input: {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}): CommissionedWorkRecordRefV01 {
  requireSafeCodeV01(input.record_version, "commissioned_work_record_version_invalid");
  requireSafeCodeV01(input.record_id, "commissioned_work_record_id_invalid");
  requireFingerprintV01(input.record_fingerprint, "commissioned_work_record_fingerprint_invalid");
  return { ...input };
}

export function createCommissionedWorkAuthorizationResourceCeilingV01(input: {
  live_authorization_ref: CommissionedWorkRecordRefV01;
  provider_call_limit: number;
  model_call_limit: number;
  external_network_call_limit: number;
}): CommissionedWorkAuthorizationResourceCeilingV01 {
  const liveAuthorizationRef = createCommissionedWorkRecordRefV01(
    input.live_authorization_ref,
  );
  for (const value of [
    input.provider_call_limit,
    input.model_call_limit,
    input.external_network_call_limit,
  ]) {
    if (!Number.isInteger(value) || value < 0 || value > 1_000_000) {
      failV01("commissioned_work_authorization_resource_ceiling_invalid");
    }
  }
  const ceilingWithoutFingerprint = {
    ceiling_version:
      "commissioned_work_authorization_resource_ceiling.v0.1" as const,
    provider_call_limit: input.provider_call_limit,
    model_call_limit: input.model_call_limit,
    external_network_call_limit: input.external_network_call_limit,
  };
  return {
    ...ceilingWithoutFingerprint,
    ceiling_fingerprint: fingerprintV01({
      live_authorization_ref: liveAuthorizationRef,
      ...ceilingWithoutFingerprint,
    }),
  };
}

export function buildCommissionedWorkCaseCommitmentV01(
  source: CommissionedWorkCaseSourceV01,
): CommissionedWorkCaseCommitmentV01 {
  validateCaseSourceV01(source);
  const materials = new Map(
    source.materials.map((material) => [material.material_id, material] as const),
  );
  const commonMaterials = source.materials.filter(
    (material) => material.material_kind === "common_task_evidence",
  );
  const conditionBindings = source.successor_plans.map((plan) => {
    const continuationRefs = plan.selected_material_ids.map((id) =>
      materialRefV01(requireMaterialV01(materials, id)),
    );
    const excludedRefs = plan.excluded_material_ids.map((id) =>
      materialRefV01(requireMaterialV01(materials, id)),
    );
    const staleRef = plan.stale_relation_material_id
      ? materialRefV01(requireMaterialV01(materials, plan.stale_relation_material_id))
      : null;
    const interventionRef = materialRefV01(
      requireMaterialV01(materials, plan.intervention_provenance_material_id),
    );
    const candidateComponentRefs: CommissionedWorkOpaqueMaterialRefV01[] = [];
    const candidateAssignmentFingerprint =
      plan.holdout_variant === null
        ? null
        : fingerprintV01({
            holdout_variant: plan.holdout_variant,
            candidate_intervention_mode: plan.candidate_intervention_mode,
          });
    const bindingWithoutFingerprint = {
      condition: plan.condition,
      holdout_variant: plan.holdout_variant,
      existing_reentry_role: COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01[plan.condition],
      common_evidence_fingerprint: fingerprintV01(
        commonMaterials.map(materialRefV01).sort(compareCanonicalV01),
      ),
      continuation_material_refs: continuationRefs.sort(compareCanonicalV01),
      excluded_material_refs: excludedRefs.sort(compareCanonicalV01),
      stale_relation_ref: staleRef,
      intervention_provenance_ref: interventionRef,
      candidate_intervention_mode: plan.candidate_intervention_mode,
      candidate_component_refs: candidateComponentRefs.sort(compareCanonicalV01),
      candidate_assignment_fingerprint: candidateAssignmentFingerprint,
    };
    return {
      ...bindingWithoutFingerprint,
      binding_fingerprint: fingerprintV01(bindingWithoutFingerprint),
    };
  });
  const requiredCheckIds = source.required_checks
    .map((check) => check.check_id)
    .sort(compareProtocolCodeUnitsV01);
  const commitmentWithoutIntegrity = {
    commitment_version: COMMISSIONED_WORK_CASE_COMMITMENT_VERSION_V01,
    case_id: source.case_id,
    case_role: source.case_role,
    project_id: source.project_id,
    independent_origin_group_id: source.independent_origin_group_id,
    repository_fixture_fingerprint: fingerprintV01(source.repository_fixture),
    initial_source_fingerprint: sourceFingerprintV01(
      source,
      source.repository_fixture,
    ),
    task_fingerprint: fingerprintV01(source.task),
    common_evidence_fingerprint: fingerprintV01(
      commonMaterials.map(materialRefV01).sort(compareCanonicalV01),
    ),
    source_drift_fingerprint: fingerprintV01(source.source_drift_writes),
    expected_current_source_fingerprint: expectedCurrentSourceFingerprintV01(source),
    source_currentness_check_id: source.source_currentness_check_id,
    evaluator_rubric_fingerprint: fingerprintV01({
      evaluator_version: source.evaluator_version,
      required_checks: source.required_checks,
      source_currentness_check_id: source.source_currentness_check_id,
      expected_success_changed_paths: source.expected_success_changed_paths,
      expected_success_writes: source.expected_success_writes,
      negative_space_guards: source.negative_space_guards,
    }),
    objective_oracle_fingerprint: fingerprintV01(
      source.required_checks.map((check) => ({
        check_id: check.check_id,
        oracle_relative_path: check.oracle_relative_path,
      })),
    ),
    expected_success_diff_fingerprint: fingerprintV01(
      source.expected_success_writes
        .map((write) => ({
          repository_relative_path: write.repository_relative_path,
          content_fingerprint: fingerprintV01(write.content),
        }))
        .sort(compareCanonicalV01),
    ),
    hard_failure_set_fingerprint: fingerprintV01(HARD_FAILURE_CODES_V01),
    condition_assignment_fingerprint: fingerprintV01(
      conditionBindings.map((binding) => ({
        condition: binding.condition,
        holdout_variant: binding.holdout_variant,
        binding_fingerprint: binding.binding_fingerprint,
      })),
    ),
    holdout_plan_fingerprint:
      source.case_role === "holdout"
        ? fingerprintV01(
            conditionBindings.map((binding) => ({
              holdout_variant: binding.holdout_variant,
              condition: binding.condition,
              candidate_assignment_fingerprint:
                binding.candidate_assignment_fingerprint,
            })),
          )
        : null,
    repository_path_set_fingerprint: fingerprintV01(
      repositoryPathSetV01(source),
    ),
    operation_shape_fingerprint: fingerprintV01(operationShapeV01(source)),
    episode_plan_set_fingerprint: fingerprintV01({
      predecessor_plan: source.predecessor_plan,
      successor_plans: source.successor_plans,
    }),
    required_check_ids: requiredCheckIds,
    negative_space_guard_refs: source.negative_space_guards
      .map((guard) =>
        opaqueRefV01({
          material_kind: "evaluator_rubric",
          content: guard,
          lifecycle_status: guard.guarded_status,
        }),
      )
      .sort(compareCanonicalV01),
    condition_bindings: conditionBindings,
    source_content_included: false as const,
  };
  return sealV01(
    commitmentWithoutIntegrity,
    "commissioned_work_case_commitment_without_integrity_fingerprint",
  );
}

export function buildCommissionedWorkFamilyManifestV01(
  input: BuildCommissionedWorkFamilyManifestInputV01,
): CommissionedWorkFamilyManifestV01 {
  requireSafeCodeV01(input.family_id, "commissioned_work_family_id_invalid");
  requireSafeCodeV01(input.workspace_id, "commissioned_work_workspace_id_invalid");
  requireSafeCodeV01(input.task_family_key, "commissioned_work_task_family_key_invalid");
  requireSafeCodeV01(input.evaluator_version, "commissioned_work_evaluator_version_invalid");
  requireTimestampV01(input.sealed_at, "commissioned_work_sealed_at_invalid");
  requireTimestampV01(input.construction_cutoff, "commissioned_work_cutoff_invalid");
  if (Date.parse(input.sealed_at) > Date.parse(input.construction_cutoff)) {
    failV01("commissioned_work_seal_after_cutoff");
  }
  if (input.training_cases.some((source) => source.case_role !== "training")) {
    failV01("commissioned_work_training_role_invalid");
  }
  if (input.holdout_case.case_role !== "holdout") {
    failV01("commissioned_work_holdout_role_invalid");
  }
  const allSources = [...input.training_cases, input.holdout_case];
  if (allSources.some((source) => source.evaluator_version !== input.evaluator_version)) {
    failV01("commissioned_work_evaluator_version_mismatch");
  }
  const commitments = allSources.map(buildCommissionedWorkCaseCommitmentV01);
  assertSourceDistinctCasesV01(commitments);
  const budgetFingerprints = allSources.map((source) => fingerprintV01(source.budget));
  if (new Set(budgetFingerprints).size !== 1) {
    failV01("commissioned_work_equal_budget_mismatch");
  }
  const manifest = buildCommissionedWorkFamilyManifestFromCommitmentsV01({
    family_id: input.family_id,
    workspace_id: input.workspace_id,
    task_family_key: input.task_family_key,
    sealed_at: input.sealed_at,
    construction_cutoff: input.construction_cutoff,
    evaluator_version: input.evaluator_version,
    hypothesis_fingerprint: opaqueFingerprintV01(input.hypothesis),
    task_author_role_id: input.task_author_role_id,
    outcome_evaluator_role_id: input.outcome_evaluator_role_id,
    consolidation_assessor_role_id: input.consolidation_assessor_role_id,
    training_case_commitments: commitments.slice(0, 3) as
      CommissionedWorkFamilyManifestV01["training_cases"],
    holdout_case_commitment: commitments[3]!,
    equal_budget_fingerprint: budgetFingerprints[0]!,
  });
  assertCommissionedWorkFamilySourceBindingV01({
    manifest,
    training_cases: input.training_cases,
    holdout_case: input.holdout_case,
  });
  return manifest;
}

/**
 * Seal the host-neutral family from source-authenticated commitments only.
 * Training-only experiment owners use this narrow path so the holdout source
 * itself never needs to be constructed or inspected.
 */
export function buildCommissionedWorkFamilyManifestFromCommitmentsV01(
  input: BuildCommissionedWorkFamilyManifestFromCommitmentsInputV01,
): CommissionedWorkFamilyManifestV01 {
  requireSafeCodeV01(input.family_id, "commissioned_work_family_id_invalid");
  requireSafeCodeV01(input.workspace_id, "commissioned_work_workspace_id_invalid");
  requireSafeCodeV01(input.task_family_key, "commissioned_work_task_family_key_invalid");
  requireSafeCodeV01(input.evaluator_version, "commissioned_work_evaluator_version_invalid");
  requireTimestampV01(input.sealed_at, "commissioned_work_sealed_at_invalid");
  requireTimestampV01(input.construction_cutoff, "commissioned_work_cutoff_invalid");
  if (Date.parse(input.sealed_at) > Date.parse(input.construction_cutoff)) {
    failV01("commissioned_work_seal_after_cutoff");
  }
  const commitments = [
    ...input.training_case_commitments,
    input.holdout_case_commitment,
  ];
  if (
    input.training_case_commitments.length !== 3 ||
    input.training_case_commitments.some((item) => item.case_role !== "training") ||
    input.holdout_case_commitment.case_role !== "holdout"
  ) {
    failV01("commissioned_work_commitment_role_invalid");
  }
  commitments.forEach((commitment) =>
    validateIntegrityV01(
      commitment,
      "commissioned_work_case_commitment_without_integrity_fingerprint",
      "commissioned_work_case_commitment_integrity_invalid",
    ),
  );
  assertSourceDistinctCasesV01(commitments);
  for (const fingerprint of [
    input.hypothesis_fingerprint,
    input.equal_budget_fingerprint,
  ]) {
    if (!/^sha256:[a-f0-9]{64}$/u.test(fingerprint)) {
      failV01("commissioned_work_manifest_source_fingerprint_invalid");
    }
  }
  const taskAuthor = createCommissionedWorkRoleRefV01(
    "task_author",
    input.task_author_role_id,
  );
  const outcomeEvaluator = createCommissionedWorkRoleRefV01(
    "outcome_evaluator",
    input.outcome_evaluator_role_id,
  );
  const consolidationAssessor = createCommissionedWorkRoleRefV01(
    "consolidation_assessor",
    input.consolidation_assessor_role_id,
  );
  if (
    new Set([
      taskAuthor.role_fingerprint,
      outcomeEvaluator.role_fingerprint,
      consolidationAssessor.role_fingerprint,
    ]).size !== 3
  ) {
    failV01("commissioned_work_role_separation_invalid");
  }
  return sealV01(
    {
      family_version: COMMISSIONED_WORK_FAMILY_VERSION_V01,
      family_id: input.family_id,
      experiment_class: COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
      host_neutral_execution_commitment: true as const,
      execution_binding_scope: "cohort_run_episode" as const,
      workspace_id: input.workspace_id,
      task_family_key: input.task_family_key,
      sealed_at: input.sealed_at,
      construction_cutoff: input.construction_cutoff,
      evaluator_version: input.evaluator_version,
      task_author: taskAuthor,
      outcome_evaluator: outcomeEvaluator,
      consolidation_assessor: consolidationAssessor,
      training_cases: input.training_case_commitments,
      holdout_case: input.holdout_case_commitment,
      condition_order: COMMISSIONED_WORK_CONDITIONS_V01,
      equal_budget_fingerprint: input.equal_budget_fingerprint,
      hypothesis_fingerprint: input.hypothesis_fingerprint,
      task_or_rubric_mutation_allowed: false as const,
      holdout_content_in_manifest: false as const,
      holdout_used_for_candidate_derivation: false as const,
      material_boundary: createCommissionedWorkMaterialBoundaryV01(),
      authority_summary: createCommissionedWorkAuthoritySummaryV01(),
    },
    "commissioned_work_family_manifest_without_integrity_fingerprint",
  );
}

export function assertCommissionedWorkFamilySourceBindingV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  training_cases: BuildCommissionedWorkFamilyManifestInputV01["training_cases"];
  holdout_case: CommissionedWorkCaseSourceV01;
}): void {
  const rebuilt = [
    ...input.training_cases.map(buildCommissionedWorkCaseCommitmentV01),
    buildCommissionedWorkCaseCommitmentV01(input.holdout_case),
  ];
  const bound = [...input.manifest.training_cases, input.manifest.holdout_case];
  if (
    rebuilt.length !== bound.length ||
    rebuilt.some(
      (commitment, index) =>
        canonicalizeProtocolValueV01(commitment) !==
        canonicalizeProtocolValueV01(bound[index]),
    )
  ) {
    failV01("commissioned_work_task_or_rubric_mutated_after_seal");
  }
  validateIntegrityV01(
    input.manifest,
    "commissioned_work_family_manifest_without_integrity_fingerprint",
    "commissioned_work_manifest_integrity_invalid",
  );
}

export function buildCommissionedWorkTaskContextPacketV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01 | null;
  expected_candidate_freeze_fingerprint: string | null;
  generated_at: string;
  executor_role_id_override?: string;
}): TaskContextPacketV01 {
  assertExactPlanMembershipV01(input.source, input.plan);
  const commitment = findCaseCommitmentV01(input.manifest, input.source.case_id);
  if (
    canonicalizeProtocolValueV01(buildCommissionedWorkCaseCommitmentV01(input.source)) !==
    canonicalizeProtocolValueV01(commitment)
  ) {
    failV01("commissioned_work_episode_source_binding_invalid");
  }
  const candidateComponentIds = resolveCandidateComponentIdsV01({
    manifest: input.manifest,
    source: input.source,
    plan: input.plan,
    candidate: input.consolidation_candidate,
    expected_candidate_freeze_fingerprint:
      input.expected_candidate_freeze_fingerprint,
  });
  requireTimestampV01(input.generated_at, "commissioned_work_packet_time_invalid");
  const executorRoleId =
    input.executor_role_id_override ?? input.plan.executor_role_id;
  requireSafeCodeV01(
    executorRoleId,
    "commissioned_work_executor_role_id_invalid",
  );
  const materials = new Map(
    input.source.materials.map((material) => [material.material_id, material] as const),
  );
  const common = input.source.materials.filter(
    (material) => material.material_kind === "common_task_evidence",
  );
  const successorPlan = isSuccessorPlanV01(input.plan) ? input.plan : null;
  const selected = [
    ...common,
    ...(successorPlan
      ? successorPlan.selected_material_ids.map((id) => requireMaterialV01(materials, id))
      : []),
  ];
  const candidateEntries = candidateComponentIds.map((componentId) =>
    candidatePacketEntryV01(
      input.consolidation_candidate!,
      componentId,
      input.generated_at,
    ),
  );
  const excluded = successorPlan
    ? successorPlan.excluded_material_ids.map((id) => requireMaterialV01(materials, id))
    : [];
  const packet = buildTaskContextPacketV01({
    workspace_id: input.manifest.workspace_id,
    project_id: input.source.project_id,
    work_ref: localRefV01(
      "commissioned_work",
      `work:${input.source.case_id}`,
      input.generated_at,
      commitment.integrity.fingerprint,
    ),
    generated_at: input.generated_at,
    expires_at: null,
    task: input.source.task,
    current_projection: null,
    selected_context: [
      ...selected.map((material) =>
        selectedPacketEntryV01(material, input.generated_at),
      ),
      ...candidateEntries,
    ],
    excluded_context: excluded.map((material) =>
      excludedPacketEntryV01(material, input.generated_at),
    ),
    tensions: [],
    risks: [],
    gaps: [
      {
        code: "missing_current_projection",
        summary:
          "This bounded experimental packet has no accepted current perspective projection.",
        severity: "low",
        missing_fields: ["current_projection"],
        source_refs: [commitment.integrity.fingerprint],
        external_refs: [],
      },
    ],
    constraints: {
      required_checks: input.source.required_checks.map((check) => check.check_id),
      forbidden_actions: [
        "Do not treat this packet as provider or execution authorization.",
        "Do not use external network access.",
        "Do not write outside the assigned disposable repository root.",
      ],
      data_classification: "local_only",
      context_budget: {
        max_selected_entries: 16,
        max_projection_items: 0,
        max_characters: 50_000,
        max_estimated_tokens: 12_500,
      },
    },
    capability_grant: null,
    return_contract: {
      return_kind: "bounded_result",
      required_fields: ["status", "changed_files", "checks"],
      expected_artifacts: [],
      required_checks: input.source.required_checks.map((check) => check.check_id),
      return_ref: localRefV01(
        "commissioned_work_result_return",
        `return:${input.source.case_id}:${executorRoleId}`,
        input.generated_at,
        commitment.integrity.fingerprint,
      ),
      compatibility_only: false,
    },
    source_status: {
      status: "complete",
      currentness: {
        status: "fresh",
        as_of: input.generated_at,
        basis: "Bound to the sealed source-distinct case commitment.",
        source_ref: localRefV01(
          "commissioned_work_case_commitment",
          commitment.case_id,
          input.generated_at,
          commitment.integrity.fingerprint,
        ),
      },
      source_refs: [commitment.integrity.fingerprint],
      external_refs: [],
      warnings: [],
    },
    compatibility: {
      source_contracts: [
        COMMISSIONED_WORK_FAMILY_VERSION_V01,
        COMMISSIONED_WORK_CASE_COMMITMENT_VERSION_V01,
        ...(candidateComponentIds.length > 0 && input.consolidation_candidate
          ? [input.consolidation_candidate.candidate_version]
          : []),
      ],
      legacy_scope_ref: null,
      source_refs: [],
      unmapped_fields: [],
      warnings: [],
    },
    authority_notes: [
      "This sealed experimental packet is not a live authorization or semantic decision.",
    ],
  });
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: input.generated_at,
  });
  if (validation.status !== "valid") {
    failV01(
      `commissioned_work_packet_invalid:${validation.errors[0]?.code ?? "unknown"}`,
    );
  }
  const packetText = canonicalizeProtocolValueV01(packet);
  if (
    successorPlan &&
    (packetText.includes(successorPlan.intervention_provenance_material_id) ||
      packetText.includes(successorPlan.condition) ||
      (successorPlan.holdout_variant !== null &&
        packetText.includes(successorPlan.holdout_variant)))
  ) {
    failV01("commissioned_work_condition_or_intervention_leak");
  }
  return packet;
}

export function buildCommissionedWorkNativeHostRequestV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01 | null;
  expected_candidate_freeze_fingerprint: string | null;
  packet: TaskContextPacketV01;
  runtime: CommissionedWorkRuntimeBindingV01;
  episode_id: string;
  requested_at: string;
  executor_role_id_override?: string;
}): NativeHostRequestV01 {
  assertExactPlanMembershipV01(input.source, input.plan);
  if (input.runtime.report_included !== false) {
    failV01("commissioned_work_runtime_binding_report_leak");
  }
  requireSafeCodeV01(input.episode_id, "commissioned_work_episode_id_invalid");
  requireTimestampV01(input.requested_at, "commissioned_work_request_time_invalid");
  if (
    input.runtime.workspace_id !== input.manifest.workspace_id ||
    input.runtime.project_id !== input.source.project_id ||
    input.runtime.case_id !== input.source.case_id ||
    input.packet.workspace_id !== input.runtime.workspace_id ||
    input.packet.project_id !== input.runtime.project_id ||
    (isSuccessorPlanV01(input.plan) &&
      (input.runtime.condition !== input.plan.condition ||
        input.runtime.holdout_variant !== input.plan.holdout_variant)) ||
    (!isSuccessorPlanV01(input.plan) &&
      (input.runtime.condition !== null || input.runtime.holdout_variant !== null))
  ) {
    failV01("commissioned_work_cross_project_source_refused");
  }
  const rebuiltPacket = buildCommissionedWorkTaskContextPacketV01({
    manifest: input.manifest,
    source: input.source,
    plan: input.plan,
    consolidation_candidate: input.consolidation_candidate,
    expected_candidate_freeze_fingerprint:
      input.expected_candidate_freeze_fingerprint,
    generated_at: input.packet.generated_at,
    executor_role_id_override: input.executor_role_id_override,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltPacket) !==
    canonicalizeProtocolValueV01(input.packet)
  ) {
    failV01("commissioned_work_request_packet_binding_invalid");
  }
  const rootScope = createRuntimeRootScopeV01(input.runtime.repository_root, input.requested_at);
  const packetRef = packetExternalRefV01(input.packet);
  const workRef = localRefV01(
    "commissioned_work",
    `work:${input.source.case_id}`,
    input.requested_at,
    findCaseCommitmentV01(input.manifest, input.source.case_id).integrity.fingerprint,
  );
  const taskRef = localRefV01(
    "commissioned_work_task",
    `task:${input.source.case_id}`,
    input.requested_at,
    fingerprintV01(input.source.task),
  );
  const firstDefinitionRef = localRefV01(
    "commissioned_work_definition",
    `definition:${input.source.case_id}`,
    input.requested_at,
    fingerprintV01(input.source.task),
  );
  const requestId = `cw1-request:${input.episode_id}`;
  const runId = `cw1-run:${input.episode_id}`;
  const executorRoleFingerprint = createCommissionedWorkRoleRefV01(
    "executor",
    input.executor_role_id_override ?? input.plan.executor_role_id,
  ).role_fingerprint;
  return {
    request_version: "native_host_request.v0.1",
    request_id: requestId,
    run_id: runId,
    idempotency_key: fingerprintV01({
      request_id: requestId,
      packet_fingerprint: input.packet.integrity.fingerprint,
      root_fingerprint: rootScope.root_fingerprint,
    }),
    workspace_id: input.manifest.workspace_id,
    project_id: input.source.project_id,
    work_ref: workRef,
    task_ref: taskRef,
    task_context_packet_ref: packetRef,
    packet: input.packet,
    packet_lineage: {
      lineage_kind: "initial_user_defined",
      first_work_definition_ref: firstDefinitionRef,
      first_work_request_ref: taskRef,
      operator_action_ref: localRefV01(
        "commissioned_work_episode_action",
        `episode-action:${input.episode_id}`,
        input.requested_at,
        fingerprintV01({
          episode_id: input.episode_id,
          request_id: requestId,
          packet_fingerprint: input.packet.integrity.fingerprint,
          executor_role_fingerprint: executorRoleFingerprint,
        }),
      ),
      packet_source_refs: [firstDefinitionRef],
      selected_context_refs: input.packet.selected_context
        .map((entry) => entry.external_ref)
        .filter((ref): ref is ExternalRefV01 => ref !== null),
    },
    mode: "interactive",
    root_scope: rootScope,
    requested_capability: "bounded_commissioned_repository_edit",
    allowed_operation_categories: [
      ...input.plan.operation_contract.allowed_operation_categories,
    ],
    forbidden_operation_categories: [
      "external_network",
      "provider_or_model_without_separate_live_authorization",
      "outside_root_write",
      "github_mutation",
      "semantic_authority",
    ],
    packet_capability_grant: null,
    execution_grant_ref: null,
    automation_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "approval_required",
      model: "native_host_managed",
      host_egress: "explicit_interactive_start",
      max_changed_files: input.plan.operation_contract.max_changed_files,
      max_artifacts: input.plan.operation_contract.max_artifacts,
      max_commands: input.plan.operation_contract.max_commands,
      max_checks: input.source.budget.max_checks + 1,
      timeout_ms: 30_000,
      stop_settle_timeout_ms: 5_000,
      stop_conditions: [
        "Any provider or network attempt.",
        "Any write outside the exact disposable repository root.",
        "Any source or task identity mismatch.",
      ],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 1_048_576,
    },
  };
}

/**
 * Admit one executor-produced result against the sealed live-capable operation
 * contract. This deliberately checks only identity, bounds, and allowed
 * repository paths; expected solution content remains evaluator-only.
 */
export function admitCommissionedWorkExecutorResultV01(input: {
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
}): NativeHostResultV01 {
  assertExactPlanMembershipV01(input.source, input.plan);
  const contract = input.plan.operation_contract;
  if (
    canonicalizeProtocolValueV01(input.request.allowed_operation_categories) !==
      canonicalizeProtocolValueV01(contract.allowed_operation_categories) ||
    input.request.policy.max_changed_files !== contract.max_changed_files ||
    input.request.policy.max_artifacts !== contract.max_artifacts ||
    input.request.policy.max_commands !== contract.max_commands
  ) {
    failV01("commissioned_work_executor_result_operation_contract_invalid");
  }
  const asserted = assertNativeHostResultV01(input.request, input.result);
  if (
    canonicalizeProtocolValueV01(asserted) !==
    canonicalizeProtocolValueV01(input.result)
  ) {
    failV01("commissioned_work_native_host_result_identity_changed");
  }
  const allowedPaths = new Set(contract.allowed_repository_relative_paths);
  const changedPaths = input.result.changed_files.map((changed) =>
    canonicalizeRepositoryRelativePathV01(changed.repository_relative_path),
  );
  if (
    changedPaths.length > contract.max_changed_files ||
    input.result.artifacts.length > contract.max_artifacts ||
    input.result.commands.length > contract.max_commands ||
    new Set(changedPaths).size !== changedPaths.length ||
    changedPaths.some((changedPath) => !allowedPaths.has(changedPath))
  ) {
    failV01("commissioned_work_executor_result_operation_contract_invalid");
  }
  return input.result;
}

export async function invokeCommissionedWorkAdapterV01(input: {
  adapter: NativeHostAdapterV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  request: NativeHostRequestV01;
}): Promise<NativeHostResultV01> {
  if (
    input.adapter.execution_profile !== "deterministic_zero_model" ||
    input.adapter.provider_egress !== "forbidden"
  ) {
    failV01("commissioned_work_adapter_authority_expansion");
  }
  const controller = new AbortController();
  const invocation = input.adapter.invoke(input.request, {
    cancellation_signal: controller.signal,
    timeout_ms: input.request.policy.timeout_ms,
    stop_settle_timeout_ms: input.request.policy.stop_settle_timeout_ms,
  });
  let result: NativeHostResultV01;
  try {
    result = await invocation.result;
    await invocation.settled;
  } catch (error) {
    try {
      await invocation.request_stop({ reason: "cancellation_requested" });
      await invocation.settled;
    } catch {
      // Preserve the first failure; the test harness separately proves cleanup.
    }
    throw error;
  }
  const delivered = materializeValidatedPacketDeliveryCheckV01({
    adapter: input.adapter,
    result,
    adapter_invocation_started: true,
  });
  const normalized = admitCommissionedWorkExecutorResultV01({
    source: input.source,
    plan: input.plan,
    request: input.request,
    result: delivered,
  });
  if (
    normalized.model_invocation_receipt_refs.length !== 0 ||
    normalized.host_refs.length !== 1 ||
    normalized.host_refs[0]?.ref_type !==
      "commissioned_workbench_fixture_host" ||
    !normalized.host_refs[0]?.source_ref ||
    normalized.adapter_extension.bounded_metadata.provider_calls !== 0 ||
    normalized.adapter_extension.bounded_metadata.model_calls !== 0 ||
    normalized.adapter_extension.bounded_metadata.external_network_calls !== 0
  ) {
    failV01("commissioned_work_adapter_authority_expansion");
  }
  return normalized;
}

export function buildCommissionedWorkObjectiveObservationV01(
  input: BuildCommissionedWorkObjectiveObservationInputV01,
): CommissionedWorkObjectiveObservationV01 {
  const { case_commitment: caseCommitment, ...observationInput } = input;
  requireSafeCodeV01(input.evaluator_version, "commissioned_work_observation_evaluator_invalid");
  requireSafeCodeV01(input.case_id, "commissioned_work_observation_case_invalid");
  requireFingerprintV01(input.run_ref_fingerprint, "commissioned_work_observation_run_ref_invalid");
  requireFingerprintV01(
    input.repository_state_fingerprint,
    "commissioned_work_observation_repository_state_invalid",
  );
  requireFingerprintV01(
    input.current_source_fingerprint,
    "commissioned_work_observation_current_source_invalid",
  );
  validateIntegrityV01(
    caseCommitment,
    "commissioned_work_case_commitment_without_integrity_fingerprint",
    "commissioned_work_case_commitment_integrity_invalid",
  );
  if (
    caseCommitment.case_id !== input.case_id ||
    caseCommitment.project_id !== input.project_id
  ) {
    failV01("commissioned_work_observation_case_scope_binding_invalid");
  }
  if (
    input.current_source_fingerprint !==
    (input.episode_role === "predecessor"
      ? caseCommitment.initial_source_fingerprint
      : caseCommitment.expected_current_source_fingerprint)
  ) {
    failV01("commissioned_work_observation_current_source_binding_invalid");
  }
  if (
    canonicalizeProtocolValueV01(
      input.required_checks.map((check) => check.check_id).sort(compareProtocolCodeUnitsV01),
    ) !==
      canonicalizeProtocolValueV01(
        [...caseCommitment.required_check_ids].sort(compareProtocolCodeUnitsV01),
      )
  ) {
    failV01("commissioned_work_observation_rubric_binding_invalid");
  }
  if (input.required_checks.length > MAX_REQUIRED_CHECKS_V01) {
    failV01("commissioned_work_observation_check_bound_exceeded");
  }
  if (
    Object.values(input.unauthorized_effects).some((value) => value !== 0)
  ) {
    failV01("commissioned_work_observation_authority_expansion");
  }
  for (const check of input.required_checks) {
    requireSafeCodeV01(check.check_id, "commissioned_work_observation_check_id_invalid");
    if (check.command_fingerprint !== null) {
      requireFingerprintV01(
        check.command_fingerprint,
        "commissioned_work_observation_command_fingerprint_invalid",
      );
    }
    if (check.disposition === "unknown" || check.disposition === "skipped") {
      if (check.exit_code !== null) {
        failV01("commissioned_work_observation_unperformed_exit_code_invalid");
      }
    }
  }
  const expectedSourceCurrentness = deriveObjectiveSourceCurrentnessV01({
    episode_role: input.episode_role,
    source_currentness_check_id: caseCommitment.source_currentness_check_id,
    required_checks: input.required_checks,
  });
  if (input.source_currentness !== expectedSourceCurrentness) {
    failV01("commissioned_work_observation_source_currentness_relation_invalid");
  }
  const observationWithoutIntegrity = {
    observation_version: "commissioned_work_objective_observation.v0.1" as const,
    ...observationInput,
    changed_path_fingerprints: [...new Set(input.changed_path_fingerprints)].sort(
      compareProtocolCodeUnitsV01,
    ),
    required_checks: [...input.required_checks].sort((left, right) =>
      compareProtocolCodeUnitsV01(left.check_id, right.check_id),
    ),
    negative_space: {
      ...input.negative_space,
      violated_guard_fingerprints: [
        ...new Set(input.negative_space.violated_guard_fingerprints),
      ].sort(compareProtocolCodeUnitsV01),
      guard_observations: [...input.negative_space.guard_observations].sort(
        compareCanonicalV01,
      ),
    },
  };
  return sealV01(
    observationWithoutIntegrity,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
  );
}

export function assertValidCommissionedWorkObjectiveObservationV01(
  observation: CommissionedWorkObjectiveObservationV01,
  caseCommitment: CommissionedWorkCaseCommitmentV01,
): void {
  if (observation.observation_version !== "commissioned_work_objective_observation.v0.1") {
    failV01("commissioned_work_observation_version_invalid");
  }
  const { observation_version: _version, integrity: _integrity, ...input } = observation;
  const rebuilt = buildCommissionedWorkObjectiveObservationV01({
    ...input,
    case_commitment: caseCommitment,
  });
  if (
    canonicalizeProtocolValueV01(rebuilt) !==
    canonicalizeProtocolValueV01(observation)
  ) {
    failV01("commissioned_work_objective_observation_integrity_invalid");
  }
}

function commissionedWorkExternalRefFromRecordV01(
  record: CommissionedWorkRecordRefV01,
  refType: string,
  observedAt: string,
): ExternalRefV01 {
  createCommissionedWorkRecordRefV01(record);
  return localRefV01(
    refType,
    record.record_id,
    observedAt,
    record.record_fingerprint,
  );
}

const COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01 = new Set([
  "host_connection",
  "host_thread",
  "host_session",
  "host_turn",
]);
const COMMISSIONED_WORK_SYNTHETIC_FIXTURE_METADATA_KEYS_V01 = [
  "fixture_admission_fingerprint",
  "fixture_admission_consumed",
  "synthetic_fixture_binding_fingerprint",
  "synthetic_fixture_output_fingerprint",
  "execution_evidence_class",
  "synthetic_fixture_output_applied",
  "solution_write_plan_checked_during_result_admission",
] as const;

function nativeHostRefBindingsV01(
  refs: ExternalRefV01[],
): CommissionedWorkNativeHostRefBindingV01[] {
  return refs
    .map((ref) => ({
      ref_type:
        ref.ref_type as CommissionedWorkNativeHostRefBindingV01["ref_type"],
      exact_ref_fingerprint: fingerprintV01(ref),
    }))
    .sort(compareCanonicalV01);
}

export function createCommissionedWorkCommissionedAgentHostRefBindingsV01(
  refs: ExternalRefV01[],
): CommissionedWorkNativeHostRefBindingV01[] {
  if (refs.length > 4) {
    failV01("commissioned_work_host_ref_set_bound_exceeded");
  }
  const exactRefs = [...refs].sort(compareCanonicalV01);
  if (
    new Set(exactRefs.map((ref) => ref.ref_type)).size !== exactRefs.length ||
    new Set(exactRefs.map((ref) => canonicalizeProtocolValueV01(ref))).size !==
      exactRefs.length
  ) {
    failV01("commissioned_work_host_ref_set_duplicate_or_conflicting");
  }
  exactRefs.forEach(assertCodexAppServerRefV01);
  return nativeHostRefBindingsV01(exactRefs);
}

export function createCommissionedWorkNativeHostRefSetFingerprintV01(
  refs: ExternalRefV01[],
): string {
  return fingerprintV01(nativeHostRefBindingsV01(refs));
}

function assertCodexAppServerRefV01(ref: ExternalRefV01): void {
  if (
    !COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01.has(ref.ref_type) ||
    ref.provider !== "codex" ||
    ref.host !== "app_server" ||
    ref.compatibility_namespace !== "codex_app_server_adapter.v0.1" ||
    ref.trust_class !== "direct_local_observation" ||
    typeof ref.observed_at !== "string" ||
    !Number.isFinite(Date.parse(ref.observed_at))
  ) {
    failV01("commissioned_work_commissioned_agent_host_ref_set_invalid");
  }
}

function sameNativeHostIdentityV01(
  left: ExternalRefV01,
  right: ExternalRefV01,
): boolean {
  return canonicalizeProtocolValueV01({
    ref_version: left.ref_version,
    ref_type: left.ref_type,
    external_id: left.external_id,
    provider: left.provider ?? null,
    host: left.host ?? null,
    source_ref: left.source_ref ?? null,
    compatibility_namespace: left.compatibility_namespace ?? null,
    trust_class: left.trust_class,
  }) === canonicalizeProtocolValueV01({
    ref_version: right.ref_version,
    ref_type: right.ref_type,
    external_id: right.external_id,
    provider: right.provider ?? null,
    host: right.host ?? null,
    source_ref: right.source_ref ?? null,
    compatibility_namespace: right.compatibility_namespace ?? null,
    trust_class: right.trust_class,
  });
}

function refObservedInCurrentInvocationV01(
  ref: ExternalRefV01,
  result: NativeHostResultV01,
): boolean {
  const observedAt = Date.parse(ref.observed_at!);
  return (
    observedAt >= Date.parse(result.started_at) &&
    observedAt <= Date.parse(result.finished_at)
  );
}

function validateSameRunResumeSourceV01(
  source: CommissionedWorkSameRunResumeSourceV01,
): void {
  validateIntegrityV01(
    source,
    "commissioned_work_same_run_resume_source_without_integrity_fingerprint",
    "commissioned_work_same_run_resume_source_integrity_invalid",
  );
  requireSafeCodeV01(
    source.source_id,
    "commissioned_work_same_run_resume_source_id_invalid",
  );
  requireSafeCodeV01(
    source.run_id,
    "commissioned_work_same_run_resume_run_id_invalid",
  );
  requireSafeCodeV01(
    source.request_id,
    "commissioned_work_same_run_resume_request_id_invalid",
  );
  requireSafeCodeV01(
    source.workspace_id,
    "commissioned_work_same_run_resume_workspace_invalid",
  );
  requireSafeCodeV01(
    source.project_id,
    "commissioned_work_same_run_resume_project_invalid",
  );
  requireFingerprintV01(
    source.run_ref_fingerprint,
    "commissioned_work_same_run_resume_run_ref_invalid",
  );
  requireFingerprintV01(
    source.native_host_request_fingerprint,
    "commissioned_work_same_run_resume_request_ref_invalid",
  );
  [
    source.task_context_packet_ref_fingerprint,
    source.task_context_packet_fingerprint,
    source.root_scope_fingerprint,
    source.operation_request_shape_fingerprint,
  ].forEach((fingerprint) =>
    requireFingerprintV01(
      fingerprint,
      "commissioned_work_same_run_resume_request_source_invalid",
    ),
  );
  requireFingerprintV01(
    source.repository_resume_context_fingerprint,
    "commissioned_work_same_run_resume_context_ref_invalid",
  );
  requireFingerprintV01(
    source.resume_binding_fingerprint,
    "commissioned_work_same_run_resume_binding_invalid",
  );
  requireFingerprintV01(
    source.source_host_ref_set_fingerprint,
    "commissioned_work_same_run_resume_host_ref_set_invalid",
  );
  if (
    source.source_version !==
      COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01 ||
    source.run_ref_fingerprint !== fingerprintV01(source.run_id) ||
    source.resume_binding_fingerprint !== fingerprintV01(source.resume_binding) ||
    source.source_host_ref_set_fingerprint !==
      fingerprintV01(source.source_host_ref_set) ||
    !Number.isSafeInteger(source.resume_binding.control_revision) ||
    source.resume_binding.control_revision < 0 ||
    source.source_host_ref_set.length < 2 ||
    source.source_host_ref_set.length > 4 ||
    new Set(source.source_host_ref_set.map((binding) => binding.ref_type)).size !==
      source.source_host_ref_set.length ||
    new Set(
      source.source_host_ref_set.map(
        (binding) => binding.exact_ref_fingerprint,
      ),
    ).size !== source.source_host_ref_set.length ||
    source.source_host_ref_set.some(
      (binding) =>
        !COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01.has(binding.ref_type),
    ) ||
    canonicalizeProtocolValueV01(source.source_host_ref_set) !==
      canonicalizeProtocolValueV01(
        [...source.source_host_ref_set].sort(compareCanonicalV01),
      )
  ) {
    failV01("commissioned_work_same_run_resume_source_invalid");
  }
  const sourceBindingByType = new Map(
    source.source_host_ref_set.map((binding) => [binding.ref_type, binding]),
  );
  const exactBindingRefs = [
    source.resume_binding.host_connection_ref,
    source.resume_binding.host_thread_ref,
    source.resume_binding.host_session_ref,
    source.resume_binding.host_turn_ref,
  ].filter((ref): ref is ExternalRefV01 => ref !== null);
  if (
    exactBindingRefs.some(
      (ref) => {
        if (!COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01.has(ref.ref_type)) {
          return true;
        }
        const refType =
          ref.ref_type as CommissionedWorkNativeHostRefBindingV01["ref_type"];
        const sourceBinding = sourceBindingByType.get(refType);
        return (
          sourceBinding === undefined ||
          sourceBinding.ref_type !== refType ||
          sourceBinding.exact_ref_fingerprint !== fingerprintV01(ref) ||
          !COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01.has(refType)
        );
      },
    ) ||
    source.resume_binding.host_thread_ref.ref_type !== "host_thread" ||
    source.resume_binding.host_turn_ref.ref_type !== "host_turn" ||
    (source.resume_binding.host_connection_ref !== null &&
      source.resume_binding.host_connection_ref.ref_type !== "host_connection") ||
    (source.resume_binding.host_session_ref !== null &&
      source.resume_binding.host_session_ref.ref_type !== "host_session")
  ) {
    failV01("commissioned_work_same_run_resume_source_invalid");
  }
  exactBindingRefs.forEach(assertCodexAppServerRefV01);
  source.source_host_ref_set.forEach((binding) =>
    requireFingerprintV01(
      binding.exact_ref_fingerprint,
      "commissioned_work_same_run_resume_host_ref_invalid",
    ),
  );
}

export function createCommissionedWorkSameRunResumeSourceV01(input: {
  request: NativeHostRequestV01;
  resume_binding: NativeHostResumeBindingV01;
  source_host_refs: ExternalRefV01[];
}): CommissionedWorkSameRunResumeSourceV01 {
  const resumeContext = input.request.repository_resume_context;
  requireSafeCodeV01(
    input.request.run_id,
    "commissioned_work_same_run_resume_run_id_invalid",
  );
  if (
    resumeContext === null ||
    resumeContext === undefined ||
    resumeContext.context_version !==
      "native_host_repository_resume_context.v0.1" ||
    resumeContext.admitted_run_control_revision !==
      input.resume_binding.control_revision
  ) {
    failV01("commissioned_work_same_run_resume_context_invalid");
  }
  const exactRefs = [...input.source_host_refs].sort(compareCanonicalV01);
  if (
    exactRefs.length < 2 ||
    exactRefs.length > 4 ||
    new Set(exactRefs.map((ref) => ref.ref_type)).size !== exactRefs.length ||
    new Set(exactRefs.map((ref) => canonicalizeProtocolValueV01(ref))).size !==
      exactRefs.length
  ) {
    failV01("commissioned_work_same_run_resume_source_invalid");
  }
  exactRefs.forEach(assertCodexAppServerRefV01);
  const sourceHostRefSet = nativeHostRefBindingsV01(exactRefs);
  const resumeBindingFingerprint = fingerprintV01(input.resume_binding);
  const requestSourceBinding =
    createCodexAppServerRequestSourceBindingV01(input.request);
  const sourceWithoutIntegrity = {
    source_version: COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01,
    source_id: `resume-source:${fingerprintV01({
      run_id: input.request.run_id,
      resume_binding: resumeBindingFingerprint,
    }).slice("sha256:".length, "sha256:".length + 32)}`,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    run_ref_fingerprint: fingerprintV01(input.request.run_id),
    workspace_id: input.request.workspace_id,
    project_id: input.request.project_id,
    native_host_request_fingerprint:
      requestSourceBinding.native_host_request_fingerprint,
    task_context_packet_ref_fingerprint:
      requestSourceBinding.task_context_packet_ref_fingerprint,
    task_context_packet_fingerprint:
      requestSourceBinding.task_context_packet_fingerprint,
    root_scope_fingerprint: requestSourceBinding.root_scope_fingerprint,
    operation_request_shape_fingerprint:
      requestSourceBinding.operation_request_shape_fingerprint,
    repository_resume_context_fingerprint: fingerprintV01(resumeContext),
    resume_binding: input.resume_binding,
    resume_binding_fingerprint: resumeBindingFingerprint,
    source_host_ref_set: sourceHostRefSet,
    source_host_ref_set_fingerprint: fingerprintV01(sourceHostRefSet),
  };
  const source = sealV01(
    sourceWithoutIntegrity,
    "commissioned_work_same_run_resume_source_without_integrity_fingerprint",
  );
  validateSameRunResumeSourceV01(source);
  return source;
}

function adapterRequestSourceBindingFromObservationV01(
  observation: CommissionedWorkFreshOriginObservationV01,
) {
  return {
    binding_version: observation.request_binding.binding_version,
    request_id: observation.request_binding.request_id,
    native_host_request_fingerprint:
      observation.request_binding.native_host_request_fingerprint,
    task_context_packet_ref_fingerprint:
      observation.request_binding.native_host_packet_ref_fingerprint,
    task_context_packet_fingerprint:
      observation.request_binding.task_context_packet_fingerprint,
    root_scope_fingerprint:
      observation.request_binding.root_scope_fingerprint,
    operation_request_shape_fingerprint:
      observation.request_binding.operation_request_shape_fingerprint,
  };
}

function freshOriginObservationRefV01(
  observation: CommissionedWorkFreshOriginObservationV01,
): CommissionedWorkRecordRefV01 {
  validateFreshOriginObservationV01(observation);
  return createCommissionedWorkRecordRefV01({
    record_version: observation.observation_version,
    record_id: observation.observation_id,
    record_fingerprint: observation.integrity.fingerprint,
  });
}

function resumeSourceRefV01(
  source: CommissionedWorkSameRunResumeSourceV01,
): CommissionedWorkRecordRefV01 {
  validateSameRunResumeSourceV01(source);
  return createCommissionedWorkRecordRefV01({
    record_version: source.source_version,
    record_id: source.source_id,
    record_fingerprint: source.integrity.fingerprint,
  });
}

function validateFreshOriginObservationV01(
  observation: CommissionedWorkFreshOriginObservationV01,
): void {
  validateIntegrityV01(
    observation,
    "commissioned_work_fresh_origin_observation_without_integrity_fingerprint",
    "commissioned_work_fresh_origin_observation_integrity_invalid",
  );
  requireSafeCodeV01(
    observation.observation_id,
    "commissioned_work_fresh_origin_observation_id_invalid",
  );
  requireSafeCodeV01(
    observation.case_id,
    "commissioned_work_fresh_origin_case_invalid",
  );
  requireSafeCodeV01(
    observation.workspace_id,
    "commissioned_work_fresh_origin_workspace_invalid",
  );
  requireSafeCodeV01(
    observation.project_id,
    "commissioned_work_fresh_origin_project_invalid",
  );
  const requestBinding = observation.request_binding;
  const lifecycleBinding = observation.lifecycle_binding;
  const { binding_fingerprint: requestBindingFingerprint, ...requestMaterial } =
    requestBinding;
  const {
    binding_fingerprint: lifecycleBindingFingerprint,
    ...lifecycleMaterial
  } = lifecycleBinding;
  const adapterSourceBinding =
    adapterRequestSourceBindingFromObservationV01(observation);
  [
    requestBinding.run_ref_fingerprint,
    requestBinding.native_host_request_fingerprint,
    requestBinding.native_host_packet_ref_fingerprint,
    requestBinding.task_context_packet_fingerprint,
    requestBinding.root_scope_fingerprint,
    requestBinding.operation_request_shape_fingerprint,
    requestBinding.operation_contract_fingerprint,
    requestBinding.binding_fingerprint,
    lifecycleBinding.native_host_lifecycle_event_fingerprint,
    lifecycleBinding.request_source_binding_fingerprint,
    lifecycleBinding.admitted_host_ref_set_fingerprint,
    lifecycleBinding.binding_fingerprint,
  ].forEach((fingerprint) =>
    requireFingerprintV01(
      fingerprint,
      "commissioned_work_fresh_origin_fingerprint_invalid",
    ),
  );
  requireTimestampV01(
    lifecycleBinding.observed_at,
    "commissioned_work_fresh_origin_time_invalid",
  );
  createCommissionedWorkRecordRefV01(requestBinding.task_context_packet_ref);
  if (
    observation.observation_version !==
      COMMISSIONED_WORK_FRESH_ORIGIN_OBSERVATION_VERSION_V01 ||
    requestBinding.binding_version !==
      CODEX_APP_SERVER_REQUEST_SOURCE_BINDING_VERSION_V01 ||
    requestBinding.run_ref_fingerprint !== fingerprintV01(requestBinding.run_id) ||
    requestBinding.task_context_packet_ref.record_fingerprint !==
      requestBinding.task_context_packet_fingerprint ||
    requestBinding.workspace_id !== observation.workspace_id ||
    requestBinding.project_id !== observation.project_id ||
    requestBinding.repository_resume_context_absent !== true ||
    requestBinding.execution_grant_absent !== true ||
    requestBinding.packet_capability_grant_absent !== true ||
    requestBindingFingerprint !== fingerprintV01(requestMaterial) ||
    lifecycleBinding.event_kind !== "turn_started" ||
    lifecycleBinding.state !== "running" ||
    lifecycleBinding.coverage !== "observed" ||
    lifecycleBinding.run_id !== requestBinding.run_id ||
    lifecycleBinding.request_source_binding_fingerprint !==
      fingerprintV01(adapterSourceBinding) ||
    lifecycleBinding.admitted_host_ref_set_fingerprint !==
      fingerprintV01(lifecycleBinding.admitted_host_ref_set) ||
    lifecycleBindingFingerprint !== fingerprintV01(lifecycleMaterial) ||
    observation.predecessor_execution_grant_inherited !== false ||
    observation.predecessor_transcript_inherited !== false ||
    observation.hidden_reasoning_inherited !== false ||
    canonicalizeProtocolValueV01(observation.origin_executor_role_ref) !==
      canonicalizeProtocolValueV01(
        createCommissionedWorkRoleRefV01(
          "executor",
          observation.origin_executor_role_ref.role_id,
        ),
      )
  ) {
    failV01("commissioned_work_fresh_origin_observation_invalid");
  }
  const refTypes = new Set(
    lifecycleBinding.admitted_host_ref_set.map((binding) => binding.ref_type),
  );
  if (
    lifecycleBinding.admitted_host_ref_set.length < 3 ||
    lifecycleBinding.admitted_host_ref_set.length > 4 ||
    refTypes.size !== lifecycleBinding.admitted_host_ref_set.length ||
    !refTypes.has("host_connection") ||
    !refTypes.has("host_thread") ||
    !refTypes.has("host_turn") ||
    [...refTypes].some(
      (refType) => !COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01.has(refType),
    ) ||
    new Set(
      lifecycleBinding.admitted_host_ref_set.map(
        (binding) => binding.exact_ref_fingerprint,
      ),
    ).size !== lifecycleBinding.admitted_host_ref_set.length ||
    canonicalizeProtocolValueV01(lifecycleBinding.admitted_host_ref_set) !==
      canonicalizeProtocolValueV01(
        [...lifecycleBinding.admitted_host_ref_set].sort(compareCanonicalV01),
      )
  ) {
    failV01("commissioned_work_fresh_origin_host_ref_set_invalid");
  }
  lifecycleBinding.admitted_host_ref_set.forEach((binding) =>
    requireFingerprintV01(
      binding.exact_ref_fingerprint,
      "commissioned_work_fresh_origin_host_ref_invalid",
    ),
  );
  if (observation.episode_origin_kind === "predecessor_episode") {
    if (
      observation.predecessor_episode_ref !== null ||
      observation.predecessor_checkpoint_ref !== null ||
      observation.predecessor_run_ref_fingerprint !== null ||
      observation.predecessor_executor_role_ref !== null ||
      observation.checkpoint_sealed_at !== null
    ) {
      failV01("commissioned_work_fresh_origin_predecessor_invalid");
    }
    return;
  }
  createCommissionedWorkRecordRefV01(observation.predecessor_episode_ref);
  createCommissionedWorkRecordRefV01(observation.predecessor_checkpoint_ref);
  requireFingerprintV01(
    observation.predecessor_run_ref_fingerprint,
    "commissioned_work_fresh_origin_predecessor_run_invalid",
  );
  requireTimestampV01(
    observation.checkpoint_sealed_at,
    "commissioned_work_fresh_origin_checkpoint_time_invalid",
  );
  if (
    observation.predecessor_run_ref_fingerprint ===
      requestBinding.run_ref_fingerprint ||
    observation.predecessor_executor_role_ref.role_fingerprint ===
      observation.origin_executor_role_ref.role_fingerprint ||
    Date.parse(observation.checkpoint_sealed_at) >
      Date.parse(lifecycleBinding.observed_at)
  ) {
    failV01("commissioned_work_fresh_origin_predecessor_invalid");
  }
}

export function createCommissionedWorkFreshOriginObservationV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  origin_request: NativeHostRequestV01;
  packet: TaskContextPacketV01;
  admitted_lifecycle_event: NativeHostLifecycleEventV01;
  predecessor_checkpoint: CommissionedWorkEpisodeCheckpointV01 | null;
}): CommissionedWorkFreshOriginObservationV01 {
  assertExactPlanMembershipV01(input.source, input.plan);
  const commitment = findCaseCommitmentV01(input.manifest, input.source.case_id);
  if (
    canonicalizeProtocolValueV01(
      buildCommissionedWorkCaseCommitmentV01(input.source),
    ) !== canonicalizeProtocolValueV01(commitment)
  ) {
    failV01("commissioned_work_fresh_origin_source_binding_invalid");
  }
  const packetValidation = validateTaskContextPacketV01(input.packet, {
    evaluated_at: input.packet.generated_at,
  });
  if (packetValidation.status !== "valid") {
    failV01("commissioned_work_fresh_origin_packet_invalid");
  }
  const expectedPacketRef = packetExternalRefV01(input.packet);
  const expectedRequestSourceBinding =
    createCodexAppServerRequestSourceBindingV01(input.origin_request);
  const lifecycleEvent = input.admitted_lifecycle_event;
  const lifecycleMetadataSourceBinding = {
    binding_version: lifecycleEvent.bounded_metadata.request_source_binding_version,
    request_id: lifecycleEvent.bounded_metadata.request_id,
    native_host_request_fingerprint:
      lifecycleEvent.bounded_metadata.native_host_request_fingerprint,
    task_context_packet_ref_fingerprint:
      lifecycleEvent.bounded_metadata.task_context_packet_ref_fingerprint,
    task_context_packet_fingerprint:
      lifecycleEvent.bounded_metadata.task_context_packet_fingerprint,
    root_scope_fingerprint:
      lifecycleEvent.bounded_metadata.root_scope_fingerprint,
    operation_request_shape_fingerprint:
      lifecycleEvent.bounded_metadata.operation_request_shape_fingerprint,
  };
  const isColdSuccessor = isSuccessorPlanV01(input.plan);
  if (
    (isColdSuccessor && input.predecessor_checkpoint === null) ||
    (!isColdSuccessor && input.predecessor_checkpoint !== null) ||
    input.origin_request.workspace_id !== input.manifest.workspace_id ||
    input.origin_request.project_id !== input.source.project_id ||
    canonicalizeProtocolValueV01(input.origin_request.packet) !==
      canonicalizeProtocolValueV01(input.packet) ||
    canonicalizeProtocolValueV01(input.origin_request.task_context_packet_ref) !==
      canonicalizeProtocolValueV01(expectedPacketRef) ||
    (input.origin_request.repository_resume_context !== null &&
      input.origin_request.repository_resume_context !== undefined) ||
    input.origin_request.execution_grant_ref !== null ||
    input.origin_request.packet_capability_grant !== null ||
    input.origin_request.requested_capability !==
      "bounded_commissioned_repository_edit" ||
    canonicalizeProtocolValueV01(input.origin_request.allowed_operation_categories) !==
      canonicalizeProtocolValueV01(
        input.plan.operation_contract.allowed_operation_categories,
      ) ||
    input.origin_request.policy.max_changed_files !==
      input.plan.operation_contract.max_changed_files ||
    input.origin_request.policy.max_artifacts !==
      input.plan.operation_contract.max_artifacts ||
    input.origin_request.policy.max_commands !==
      input.plan.operation_contract.max_commands ||
    lifecycleEvent.run_id !== input.origin_request.run_id ||
    lifecycleEvent.event_kind !== "turn_started" ||
    lifecycleEvent.state !== "running" ||
    lifecycleEvent.coverage !== "observed" ||
    canonicalizeProtocolValueV01(lifecycleMetadataSourceBinding) !==
      canonicalizeProtocolValueV01(expectedRequestSourceBinding)
  ) {
    failV01("commissioned_work_fresh_origin_source_binding_invalid");
  }
  requireTimestampV01(
    lifecycleEvent.observed_at,
    "commissioned_work_fresh_origin_time_invalid",
  );
  const expectedLifecycleEventId = `native-host-event:${fingerprintV01({
    run_id: lifecycleEvent.run_id,
    event_kind: lifecycleEvent.event_kind,
    state: lifecycleEvent.state,
    host_refs: lifecycleEvent.host_refs,
    bounded_metadata: lifecycleEvent.bounded_metadata,
  }).slice("sha256:".length, "sha256:".length + 24)}`;
  if (lifecycleEvent.event_id !== expectedLifecycleEventId) {
    failV01("commissioned_work_fresh_origin_lifecycle_event_invalid");
  }
  const admittedHostRefSet = nativeHostRefBindingsV01(
    [...lifecycleEvent.host_refs].sort(compareCanonicalV01),
  );
  lifecycleEvent.host_refs.forEach(assertCodexAppServerRefV01);
  const executorRole = createCommissionedWorkRoleRefV01(
    "executor",
    input.plan.executor_role_id,
  );
  let predecessorFields:
    | {
        episode_origin_kind: "predecessor_episode";
        predecessor_episode_ref: null;
        predecessor_checkpoint_ref: null;
        predecessor_run_ref_fingerprint: null;
        predecessor_executor_role_ref: null;
        checkpoint_sealed_at: null;
      }
    | {
        episode_origin_kind: "cold_successor";
        predecessor_episode_ref: CommissionedWorkRecordRefV01;
        predecessor_checkpoint_ref: CommissionedWorkRecordRefV01;
        predecessor_run_ref_fingerprint: string;
        predecessor_executor_role_ref: CommissionedWorkRoleRefV01;
        checkpoint_sealed_at: string;
      };
  if (input.predecessor_checkpoint === null) {
    predecessorFields = {
      episode_origin_kind: "predecessor_episode",
      predecessor_episode_ref: null,
      predecessor_checkpoint_ref: null,
      predecessor_run_ref_fingerprint: null,
      predecessor_executor_role_ref: null,
      checkpoint_sealed_at: null,
    };
  } else {
    const checkpoint = input.predecessor_checkpoint;
    validateIntegrityV01(
      checkpoint,
      "commissioned_work_episode_checkpoint_without_integrity_fingerprint",
      "commissioned_work_episode_checkpoint_integrity_invalid",
    );
    if (
      checkpoint.case_id !== input.source.case_id ||
      checkpoint.workspace_id !== input.manifest.workspace_id ||
      checkpoint.project_id !== input.source.project_id ||
      checkpoint.predecessor_run_ref_fingerprint ===
        fingerprintV01(input.origin_request.run_id) ||
      checkpoint.predecessor_executor_role_ref.role_fingerprint ===
        executorRole.role_fingerprint ||
      Date.parse(checkpoint.sealed_at) > Date.parse(lifecycleEvent.observed_at)
    ) {
      failV01("commissioned_work_fresh_origin_checkpoint_binding_invalid");
    }
    predecessorFields = {
      episode_origin_kind: "cold_successor",
      predecessor_episode_ref: checkpoint.predecessor_episode_ref,
      predecessor_checkpoint_ref: episodeCheckpointRefV01(checkpoint),
      predecessor_run_ref_fingerprint:
        checkpoint.predecessor_run_ref_fingerprint,
      predecessor_executor_role_ref:
        checkpoint.predecessor_executor_role_ref,
      checkpoint_sealed_at: checkpoint.sealed_at,
    };
  }
  const packetRef = createCommissionedWorkRecordRefV01({
    record_version: input.packet.packet_version,
    record_id: input.packet.packet_id,
    record_fingerprint: input.packet.integrity.fingerprint,
  });
  const requestBindingWithoutFingerprint = {
    binding_version: CODEX_APP_SERVER_REQUEST_SOURCE_BINDING_VERSION_V01,
    request_id: input.origin_request.request_id,
    run_id: input.origin_request.run_id,
    run_ref_fingerprint: fingerprintV01(input.origin_request.run_id),
    native_host_request_fingerprint:
      expectedRequestSourceBinding.native_host_request_fingerprint,
    task_context_packet_ref: packetRef,
    native_host_packet_ref_fingerprint:
      expectedRequestSourceBinding.task_context_packet_ref_fingerprint,
    task_context_packet_fingerprint:
      expectedRequestSourceBinding.task_context_packet_fingerprint,
    workspace_id: input.origin_request.workspace_id,
    project_id: input.origin_request.project_id,
    root_scope_fingerprint:
      expectedRequestSourceBinding.root_scope_fingerprint,
    operation_request_shape_fingerprint:
      expectedRequestSourceBinding.operation_request_shape_fingerprint,
    operation_contract_fingerprint: fingerprintV01(input.plan.operation_contract),
    repository_resume_context_absent: true as const,
    execution_grant_absent: true as const,
    packet_capability_grant_absent: true as const,
  };
  const requestBinding = {
    ...requestBindingWithoutFingerprint,
    binding_fingerprint: fingerprintV01(requestBindingWithoutFingerprint),
  };
  const lifecycleBindingWithoutFingerprint = {
    event_id: lifecycleEvent.event_id,
    native_host_lifecycle_event_fingerprint: fingerprintV01(lifecycleEvent),
    event_kind: "turn_started" as const,
    state: "running" as const,
    coverage: "observed" as const,
    run_id: lifecycleEvent.run_id,
    observed_at: lifecycleEvent.observed_at,
    request_source_binding_fingerprint: fingerprintV01(
      expectedRequestSourceBinding,
    ),
    admitted_host_ref_set: admittedHostRefSet,
    admitted_host_ref_set_fingerprint: fingerprintV01(admittedHostRefSet),
  };
  const lifecycleBinding = {
    ...lifecycleBindingWithoutFingerprint,
    binding_fingerprint: fingerprintV01(lifecycleBindingWithoutFingerprint),
  };
  const observationWithoutIntegrity = {
    observation_version: COMMISSIONED_WORK_FRESH_ORIGIN_OBSERVATION_VERSION_V01,
    observation_id: `fresh-origin:${fingerprintV01({
      request_binding: requestBinding,
      lifecycle_binding: lifecycleBinding,
      predecessor_checkpoint_ref: predecessorFields.predecessor_checkpoint_ref,
    }).slice("sha256:".length, "sha256:".length + 32)}`,
    case_id: input.source.case_id,
    workspace_id: input.manifest.workspace_id,
    project_id: input.source.project_id,
    origin_executor_role_ref: executorRole,
    request_binding: requestBinding,
    lifecycle_binding: lifecycleBinding,
    predecessor_execution_grant_inherited: false as const,
    predecessor_transcript_inherited: false as const,
    hidden_reasoning_inherited: false as const,
    ...predecessorFields,
  };
  const observation = sealV01(
    observationWithoutIntegrity,
    "commissioned_work_fresh_origin_observation_without_integrity_fingerprint",
  );
  validateFreshOriginObservationV01(observation);
  return observation;
}

function validateEpisodeOriginProofV01(
  proof: CommissionedWorkEpisodeOriginProofV01,
): void {
  validateIntegrityV01(
    proof,
    "commissioned_work_episode_origin_proof_without_integrity_fingerprint",
    "commissioned_work_episode_origin_proof_integrity_invalid",
  );
  requireSafeCodeV01(
    proof.proof_id,
    "commissioned_work_episode_origin_proof_id_invalid",
  );
  [
    proof.origin_run_ref_fingerprint,
    proof.origin_native_host_request_fingerprint,
    proof.admitted_resume_binding_fingerprint,
  ].forEach((fingerprint) =>
    requireFingerprintV01(
      fingerprint,
      "commissioned_work_episode_origin_proof_fingerprint_invalid",
    ),
  );
  requireTimestampV01(
    proof.origin_started_at,
    "commissioned_work_episode_origin_start_invalid",
  );
  createCommissionedWorkRecordRefV01(proof.fresh_origin_source_ref);
  createCommissionedWorkRecordRefV01(proof.admitted_resume_source_ref);
  if (
    proof.proof_version !== COMMISSIONED_WORK_EPISODE_ORIGIN_PROOF_VERSION_V01 ||
    proof.fresh_origin_source_ref.record_version !==
      COMMISSIONED_WORK_FRESH_ORIGIN_OBSERVATION_VERSION_V01 ||
    proof.admitted_resume_source_ref.record_version !==
      COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01 ||
    canonicalizeProtocolValueV01(proof.origin_executor_role_ref) !==
      canonicalizeProtocolValueV01(
        createCommissionedWorkRoleRefV01(
          "executor",
          proof.origin_executor_role_ref.role_id,
        ),
      ) ||
    proof.predecessor_execution_grant_inherited !== false ||
    proof.predecessor_transcript_inherited !== false ||
    proof.hidden_reasoning_inherited !== false
  ) {
    failV01("commissioned_work_episode_origin_proof_invalid");
  }
  if (proof.episode_origin_kind === "predecessor_episode") {
    if (
      proof.predecessor_episode_ref !== null ||
      proof.predecessor_checkpoint_ref !== null ||
      proof.predecessor_run_ref_fingerprint !== null ||
      proof.predecessor_executor_role_ref !== null ||
      proof.checkpoint_sealed_at !== null
    ) {
      failV01("commissioned_work_episode_origin_proof_invalid");
    }
    return;
  }
  createCommissionedWorkRecordRefV01(proof.predecessor_episode_ref);
  createCommissionedWorkRecordRefV01(proof.predecessor_checkpoint_ref);
  requireFingerprintV01(
    proof.predecessor_run_ref_fingerprint,
    "commissioned_work_episode_origin_predecessor_run_invalid",
  );
  requireTimestampV01(
    proof.checkpoint_sealed_at,
    "commissioned_work_episode_origin_checkpoint_time_invalid",
  );
  if (
    proof.predecessor_run_ref_fingerprint === proof.origin_run_ref_fingerprint ||
    proof.predecessor_executor_role_ref.role_fingerprint ===
      proof.origin_executor_role_ref.role_fingerprint ||
    Date.parse(proof.checkpoint_sealed_at) > Date.parse(proof.origin_started_at)
  ) {
    failV01("commissioned_work_episode_origin_proof_invalid");
  }
}

export function createCommissionedWorkEpisodeOriginProofV01(input: {
  fresh_origin_observation: CommissionedWorkFreshOriginObservationV01;
  resume_source: CommissionedWorkSameRunResumeSourceV01;
}): CommissionedWorkEpisodeOriginProofV01 {
  validateFreshOriginObservationV01(input.fresh_origin_observation);
  validateSameRunResumeSourceV01(input.resume_source);
  const observation = input.fresh_origin_observation;
  if (
    observation.request_binding.run_id !== input.resume_source.run_id ||
    observation.request_binding.request_id !== input.resume_source.request_id ||
    observation.workspace_id !== input.resume_source.workspace_id ||
    observation.project_id !== input.resume_source.project_id ||
    observation.request_binding.native_host_packet_ref_fingerprint !==
      input.resume_source.task_context_packet_ref_fingerprint ||
    observation.request_binding.task_context_packet_fingerprint !==
      input.resume_source.task_context_packet_fingerprint ||
    observation.request_binding.root_scope_fingerprint !==
      input.resume_source.root_scope_fingerprint ||
    observation.request_binding.operation_request_shape_fingerprint !==
      input.resume_source.operation_request_shape_fingerprint ||
    canonicalizeProtocolValueV01(
      observation.lifecycle_binding.admitted_host_ref_set,
    ) !== canonicalizeProtocolValueV01(input.resume_source.source_host_ref_set)
  ) {
    failV01("commissioned_work_episode_origin_resume_source_invalid");
  }
  const freshOriginSourceRef = freshOriginObservationRefV01(observation);
  const resumeSourceRef = resumeSourceRefV01(input.resume_source);
  const commonProof = {
    proof_version: COMMISSIONED_WORK_EPISODE_ORIGIN_PROOF_VERSION_V01,
    proof_id: `origin-proof:${fingerprintV01({
      fresh_origin_source_ref: freshOriginSourceRef,
      resume_source_ref: resumeSourceRef,
    }).slice("sha256:".length, "sha256:".length + 32)}`,
    case_id: observation.case_id,
    workspace_id: observation.workspace_id,
    project_id: observation.project_id,
    origin_run_ref_fingerprint: observation.request_binding.run_ref_fingerprint,
    origin_executor_role_ref: observation.origin_executor_role_ref,
    origin_native_host_request_fingerprint:
      observation.request_binding.native_host_request_fingerprint,
    origin_started_at: observation.lifecycle_binding.observed_at,
    fresh_origin_source_ref: freshOriginSourceRef,
    admitted_resume_source_ref: resumeSourceRef,
    admitted_resume_binding_fingerprint:
      input.resume_source.resume_binding_fingerprint,
    predecessor_execution_grant_inherited: false as const,
    predecessor_transcript_inherited: false as const,
    hidden_reasoning_inherited: false as const,
  };
  const proofWithoutIntegrity =
    observation.episode_origin_kind === "predecessor_episode"
      ? {
          ...commonProof,
          episode_origin_kind: "predecessor_episode" as const,
          predecessor_episode_ref: null,
          predecessor_checkpoint_ref: null,
          predecessor_run_ref_fingerprint: null,
          predecessor_executor_role_ref: null,
          checkpoint_sealed_at: null,
        }
      : {
          ...commonProof,
          episode_origin_kind: "cold_successor" as const,
          predecessor_episode_ref: observation.predecessor_episode_ref,
          predecessor_checkpoint_ref: observation.predecessor_checkpoint_ref,
          predecessor_run_ref_fingerprint:
            observation.predecessor_run_ref_fingerprint,
          predecessor_executor_role_ref:
            observation.predecessor_executor_role_ref,
          checkpoint_sealed_at: observation.checkpoint_sealed_at,
        };
  const proof = sealV01(
    proofWithoutIntegrity,
    "commissioned_work_episode_origin_proof_without_integrity_fingerprint",
  );
  validateEpisodeOriginProofV01(proof);
  return proof;
}

function validateEpisodeOriginSourceChainV01(
  chain: CommissionedWorkEpisodeOriginSourceChainV01,
): void {
  validateIntegrityV01(
    chain,
    "commissioned_work_episode_origin_source_chain_without_integrity_fingerprint",
    "commissioned_work_episode_origin_source_chain_integrity_invalid",
  );
  validateFreshOriginObservationV01(chain.fresh_origin_observation);
  validateSameRunResumeSourceV01(chain.resume_source);
  validateEpisodeOriginProofV01(chain.origin_proof);
  const observation = chain.fresh_origin_observation;
  const proof = chain.origin_proof;
  if (
    chain.chain_version !==
      COMMISSIONED_WORK_EPISODE_ORIGIN_SOURCE_CHAIN_VERSION_V01 ||
    canonicalizeProtocolValueV01(proof.fresh_origin_source_ref) !==
      canonicalizeProtocolValueV01(freshOriginObservationRefV01(observation)) ||
    canonicalizeProtocolValueV01(proof.admitted_resume_source_ref) !==
      canonicalizeProtocolValueV01(resumeSourceRefV01(chain.resume_source)) ||
    proof.origin_run_ref_fingerprint !==
      observation.request_binding.run_ref_fingerprint ||
    proof.origin_native_host_request_fingerprint !==
      observation.request_binding.native_host_request_fingerprint ||
    proof.origin_started_at !== observation.lifecycle_binding.observed_at ||
    proof.admitted_resume_binding_fingerprint !==
      chain.resume_source.resume_binding_fingerprint ||
    chain.resume_source.run_id !== observation.request_binding.run_id ||
    chain.resume_source.request_id !== observation.request_binding.request_id ||
    chain.resume_source.workspace_id !== observation.workspace_id ||
    chain.resume_source.project_id !== observation.project_id ||
    chain.resume_source.task_context_packet_ref_fingerprint !==
      observation.request_binding.native_host_packet_ref_fingerprint ||
    chain.resume_source.task_context_packet_fingerprint !==
      observation.request_binding.task_context_packet_fingerprint ||
    chain.resume_source.root_scope_fingerprint !==
      observation.request_binding.root_scope_fingerprint ||
    chain.resume_source.operation_request_shape_fingerprint !==
      observation.request_binding.operation_request_shape_fingerprint ||
    canonicalizeProtocolValueV01(
      chain.resume_source.source_host_ref_set,
    ) !==
      canonicalizeProtocolValueV01(
        observation.lifecycle_binding.admitted_host_ref_set,
      ) ||
    canonicalizeProtocolValueV01({
      episode_origin_kind: proof.episode_origin_kind,
      predecessor_episode_ref: proof.predecessor_episode_ref,
      predecessor_checkpoint_ref: proof.predecessor_checkpoint_ref,
      predecessor_run_ref_fingerprint: proof.predecessor_run_ref_fingerprint,
      predecessor_executor_role_ref: proof.predecessor_executor_role_ref,
      checkpoint_sealed_at: proof.checkpoint_sealed_at,
    }) !==
      canonicalizeProtocolValueV01({
        episode_origin_kind: observation.episode_origin_kind,
        predecessor_episode_ref: observation.predecessor_episode_ref,
        predecessor_checkpoint_ref: observation.predecessor_checkpoint_ref,
        predecessor_run_ref_fingerprint:
          observation.predecessor_run_ref_fingerprint,
        predecessor_executor_role_ref:
          observation.predecessor_executor_role_ref,
        checkpoint_sealed_at: observation.checkpoint_sealed_at,
      })
  ) {
    failV01("commissioned_work_episode_origin_source_chain_invalid");
  }
}

export function createCommissionedWorkEpisodeOriginSourceChainV01(input: {
  fresh_origin_observation: CommissionedWorkFreshOriginObservationV01;
  resume_source: CommissionedWorkSameRunResumeSourceV01;
  origin_proof: CommissionedWorkEpisodeOriginProofV01;
}): CommissionedWorkEpisodeOriginSourceChainV01 {
  const chain = sealV01(
    {
      chain_version: COMMISSIONED_WORK_EPISODE_ORIGIN_SOURCE_CHAIN_VERSION_V01,
      fresh_origin_observation: input.fresh_origin_observation,
      resume_source: input.resume_source,
      origin_proof: input.origin_proof,
    },
    "commissioned_work_episode_origin_source_chain_without_integrity_fingerprint",
  );
  validateEpisodeOriginSourceChainV01(chain);
  return chain;
}

function episodeOriginProofRefV01(
  proof: CommissionedWorkEpisodeOriginProofV01,
): CommissionedWorkRecordRefV01 {
  validateEpisodeOriginProofV01(proof);
  return createCommissionedWorkRecordRefV01({
    record_version: proof.proof_version,
    record_id: proof.proof_id,
    record_fingerprint: proof.integrity.fingerprint,
  });
}

function exactNativeHostRefSetV01(input: {
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  binding_kind: "synthetic_fixture" | "commissioned_agent";
  resume_source: CommissionedWorkSameRunResumeSourceV01 | null;
  expected_provenance: CommissionedWorkHostIdentityProvenanceV01 | null;
}): {
  external_refs: ExternalRefV01[];
  bindings: CommissionedWorkNativeHostRefBindingV01[];
  set_fingerprint: string;
  receipt_host_ref: ExternalRefV01 | null;
  host_identity_provenance: CommissionedWorkHostIdentityProvenanceV01 | null;
} {
  if (input.result.host_refs.length > 4) {
    failV01("commissioned_work_host_ref_set_bound_exceeded");
  }
  const exactRefs = [...input.result.host_refs].sort((left, right) =>
    compareCanonicalV01(left, right),
  );
  const typeSet = new Set(exactRefs.map((ref) => ref.ref_type));
  const refSet = new Set(exactRefs.map((ref) => canonicalizeProtocolValueV01(ref)));
  if (typeSet.size !== exactRefs.length || refSet.size !== exactRefs.length) {
    failV01("commissioned_work_host_ref_set_duplicate_or_conflicting");
  }
  let hostIdentityProvenance: CommissionedWorkHostIdentityProvenanceV01 | null =
    null;
  if (input.binding_kind === "synthetic_fixture") {
    if (
      input.resume_source !== null ||
      input.expected_provenance !== null ||
      exactRefs.length !== 1 ||
      exactRefs[0]?.ref_type !== "commissioned_workbench_fixture_host" ||
      !exactRefs[0].source_ref
    ) {
      failV01("commissioned_work_synthetic_execution_binding_invalid");
    }
  } else {
    exactRefs.forEach(assertCodexAppServerRefV01);
    if (input.resume_source !== null && input.expected_provenance !== null) {
      failV01("commissioned_work_commissioned_agent_host_ref_set_invalid");
    }
    const completeTurnIdentity =
      typeSet.has("host_connection") &&
      typeSet.has("host_thread") &&
      typeSet.has("host_turn") &&
      (exactRefs.length === 3 ||
        (exactRefs.length === 4 && typeSet.has("host_session")));
    const partialIdentity =
      exactRefs.length === 0 ||
      (exactRefs.length === 1 && typeSet.has("host_connection"));
    if (
      (!completeTurnIdentity && !partialIdentity) ||
      (input.result.outcome === "completed" && !completeTurnIdentity) ||
      (input.result.outcome === "unavailable" && !partialIdentity) ||
      (["cancelled", "timed_out", "blocked"].includes(input.result.outcome) &&
        !completeTurnIdentity) ||
      (partialIdentity &&
        !["failed", "unavailable"].includes(input.result.outcome))
    ) {
      failV01("commissioned_work_commissioned_agent_host_ref_set_invalid");
    }
    const currentConnection = exactRefs.find(
      (ref) => ref.ref_type === "host_connection",
    );
    if (
      currentConnection &&
      !refObservedInCurrentInvocationV01(currentConnection, input.result)
    ) {
      failV01("commissioned_work_commissioned_agent_host_ref_set_invalid");
    }
    if (input.resume_source !== null) {
      validateSameRunResumeSourceV01(input.resume_source);
      if (
        input.resume_source.run_id !== input.result.run_id ||
        input.resume_source.run_id !== input.request.run_id ||
        input.resume_source.native_host_request_fingerprint !==
          fingerprintV01(input.request) ||
        input.request.repository_resume_context === null ||
        input.request.repository_resume_context === undefined ||
        input.resume_source.repository_resume_context_fingerprint !==
          fingerprintV01(input.request.repository_resume_context) ||
        input.request.repository_resume_context.admitted_run_control_revision !==
          input.resume_source.resume_binding.control_revision
      ) {
        failV01("commissioned_work_same_run_resume_scope_invalid");
      }
      const resume = input.resume_source.resume_binding;
      if (
        currentConnection &&
        resume.host_connection_ref !== null &&
        sameNativeHostIdentityV01(
          currentConnection,
          resume.host_connection_ref,
        )
      ) {
        failV01("commissioned_work_same_run_resume_connection_provenance_invalid");
      }
      const inherited = new Set<string>();
      if (completeTurnIdentity) {
        const requireResumeRelation = (
          refType: "host_thread" | "host_session" | "host_turn",
          admitted: ExternalRefV01 | null,
          exactRequired: boolean,
        ): void => {
          const actual = exactRefs.find((ref) => ref.ref_type === refType) ?? null;
          if (admitted === null) {
            if (
              actual !== null &&
              !refObservedInCurrentInvocationV01(actual, input.result)
            ) {
              failV01("commissioned_work_same_run_resume_binding_invalid");
            }
            return;
          }
          if (actual === null || !sameNativeHostIdentityV01(actual, admitted)) {
            failV01("commissioned_work_same_run_resume_binding_invalid");
          }
          if (
            canonicalizeProtocolValueV01(actual) ===
            canonicalizeProtocolValueV01(admitted)
          ) {
            inherited.add(fingerprintV01(actual));
            return;
          }
          if (
            exactRequired ||
            !refObservedInCurrentInvocationV01(actual, input.result)
          ) {
            failV01("commissioned_work_same_run_resume_binding_invalid");
          }
        };
        requireResumeRelation("host_thread", resume.host_thread_ref, false);
        requireResumeRelation("host_session", resume.host_session_ref, false);
        requireResumeRelation("host_turn", resume.host_turn_ref, true);
        if (!inherited.has(fingerprintV01(resume.host_turn_ref))) {
          failV01("commissioned_work_same_run_resume_binding_invalid");
        }
      }
      hostIdentityProvenance = {
        provenance_kind: "same_run_resume",
        identity_coverage: completeTurnIdentity
          ? "complete_turn"
          : exactRefs.length === 1
            ? "connection_only"
            : "absent",
        resume_source_ref: createCommissionedWorkRecordRefV01({
          record_version: input.resume_source.source_version,
          record_id: input.resume_source.source_id,
          record_fingerprint: input.resume_source.integrity.fingerprint,
        }),
        resume_binding_fingerprint:
          input.resume_source.resume_binding_fingerprint,
        resume_control_revision: resume.control_revision,
        inherited_host_ref_fingerprints: [...inherited].sort(
          compareProtocolCodeUnitsV01,
        ),
      };
    } else if (input.expected_provenance?.provenance_kind === "same_run_resume") {
      const expected = input.expected_provenance;
      const inherited = new Set(expected.inherited_host_ref_fingerprints);
      if (
        expected.resume_source_ref.record_version !==
          COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01 ||
        !Number.isSafeInteger(expected.resume_control_revision) ||
        expected.resume_control_revision < 0 ||
        new Set(expected.inherited_host_ref_fingerprints).size !==
          expected.inherited_host_ref_fingerprints.length ||
        canonicalizeProtocolValueV01(
          expected.inherited_host_ref_fingerprints,
        ) !==
          canonicalizeProtocolValueV01(
            [...expected.inherited_host_ref_fingerprints].sort(
              compareProtocolCodeUnitsV01,
            ),
          ) ||
        (completeTurnIdentity &&
          !exactRefs.some(
            (ref) =>
              ref.ref_type === "host_turn" && inherited.has(fingerprintV01(ref)),
          )) ||
        exactRefs.some((ref) => {
          const refFingerprint = fingerprintV01(ref);
          if (ref.ref_type === "host_connection" && inherited.has(refFingerprint)) {
            return true;
          }
          return (
            !inherited.has(refFingerprint) &&
            !refObservedInCurrentInvocationV01(ref, input.result)
          );
        }) ||
        expected.identity_coverage !==
          (completeTurnIdentity
            ? "complete_turn"
            : exactRefs.length === 1
              ? "connection_only"
              : "absent")
      ) {
        failV01("commissioned_work_same_run_resume_provenance_invalid");
      }
      hostIdentityProvenance = expected;
    } else {
      if (
        exactRefs.some(
          (ref) => !refObservedInCurrentInvocationV01(ref, input.result),
        )
      ) {
        failV01("commissioned_work_commissioned_agent_host_ref_set_invalid");
      }
      hostIdentityProvenance = completeTurnIdentity
        ? {
            provenance_kind: "fresh_invocation",
            identity_coverage: "complete_turn",
            resume_source_ref: null,
            resume_binding_fingerprint: null,
            resume_control_revision: null,
            inherited_host_ref_fingerprints: [],
          }
        : {
            provenance_kind: "boundary_partial",
            identity_coverage:
              exactRefs.length === 1 ? "connection_only" : "absent",
            resume_source_ref: null,
            resume_binding_fingerprint: null,
            resume_control_revision: null,
            inherited_host_ref_fingerprints: [],
          };
      if (
        input.expected_provenance !== null &&
        canonicalizeProtocolValueV01(input.expected_provenance) !==
          canonicalizeProtocolValueV01(hostIdentityProvenance)
      ) {
        failV01("commissioned_work_host_identity_provenance_invalid");
      }
    }
  }
  const bindings = nativeHostRefBindingsV01(exactRefs);
  const receiptHostRef =
    input.binding_kind === "synthetic_fixture"
      ? exactRefs[0]!
      : exactRefs.find((ref) => ref.ref_type === "host_turn") ??
        exactRefs.find((ref) => ref.ref_type === "host_connection") ??
        null;
  return {
    external_refs: exactRefs,
    bindings,
    set_fingerprint: fingerprintV01(bindings),
    receipt_host_ref: receiptHostRef,
    host_identity_provenance: hostIdentityProvenance,
  };
}

function executionObservationRefV01(
  observation: CommissionedWorkExecutionObservationV01,
): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: observation.observation_version,
    record_id: observation.observation_id,
    record_fingerprint: observation.integrity.fingerprint,
  });
}

function candidateComponentDeliveryFingerprintsV01(
  packet: TaskContextPacketV01,
): string[] {
  return packet.selected_context
    .filter(
      (entry) =>
        entry.external_ref?.ref_type ===
        "commissioned_work_frozen_candidate_component",
    )
    .map((entry) => entry.source_ref)
    .filter((value): value is string => value !== null)
    .sort(compareProtocolCodeUnitsV01);
}

function firstMaterialActionObservationV01(input: {
  result: NativeHostResultV01;
  observed_at: string | null;
  timing_provenance:
    CommissionedWorkExecutionObservationV01["first_material_action"]["timing_provenance"];
}): CommissionedWorkExecutionObservationV01["first_material_action"] {
  const firstChanged = input.result.changed_files[0] ?? null;
  if (firstChanged === null) {
    if (input.observed_at !== null || input.timing_provenance !== "unknown") {
      failV01("commissioned_work_first_action_observation_invalid");
    }
    return {
      action_kind: "none",
      repository_path_fingerprint: null,
      observed_at: null,
      timing_provenance: "unknown",
    };
  }
  if (
    (input.timing_provenance === "unknown" && input.observed_at !== null) ||
    (input.timing_provenance !== "unknown" && input.observed_at === null)
  ) {
    failV01("commissioned_work_first_action_observation_invalid");
  }
  if (input.observed_at !== null) {
    requireTimestampV01(
      input.observed_at,
      "commissioned_work_first_action_time_invalid",
    );
    if (
      Date.parse(input.observed_at) < Date.parse(input.result.started_at) ||
      Date.parse(input.observed_at) > Date.parse(input.result.finished_at)
    ) {
      failV01("commissioned_work_first_action_order_invalid");
    }
  }
  return {
    action_kind:
      firstChanged.change_kind === "added"
        ? "file_add"
        : firstChanged.change_kind === "deleted"
          ? "file_delete"
          : "file_modify",
    repository_path_fingerprint: fingerprintV01(
      canonicalizeRepositoryRelativePathV01(
        firstChanged.repository_relative_path,
      ),
    ),
    observed_at: input.observed_at,
    timing_provenance: input.timing_provenance,
  };
}

function validateExecutionResourceBindingV01(input: {
  execution_evidence_class: CommissionedWorkExecutionEvidenceClassV01;
  resources: CommissionedWorkResourceVectorV01;
  resource_binding: CommissionedWorkExecutionResourceBindingV01;
}): void {
  validateResourceVectorV01(input.resources);
  const laneBindings = [
    [
      input.resources.provider_calls,
      input.resource_binding.provider_calls_observation_ref,
    ],
    [
      input.resources.model_calls,
      input.resource_binding.model_calls_observation_ref,
    ],
    [
      input.resources.external_network_calls,
      input.resource_binding.external_network_calls_observation_ref,
    ],
  ] as const;
  for (const [lane, sourceRef] of laneBindings) {
    if (
      (lane.provenance === "unknown" && sourceRef !== null) ||
      (lane.provenance === "observed" && sourceRef === null)
    ) {
      failV01("commissioned_work_execution_resource_source_invalid");
    }
    if (sourceRef !== null) createCommissionedWorkRecordRefV01(sourceRef);
  }
  for (const ref of [
    input.resource_binding.live_authorization_ref,
    input.resource_binding.provider_ref,
    input.resource_binding.model_ref,
    input.resource_binding.route_ref,
    input.resource_binding.network_destination_ref,
  ]) {
    if (ref !== null) createCommissionedWorkRecordRefV01(ref);
  }
  const providerCalls = input.resources.provider_calls.value;
  const modelCalls = input.resources.model_calls.value;
  const networkCalls = input.resources.external_network_calls.value;
  const liveAuthorizationRef = input.resource_binding.live_authorization_ref;
  const resourceCeiling = input.resource_binding.authorization_resource_ceiling;
  if (
    (liveAuthorizationRef === null && resourceCeiling !== null) ||
    (liveAuthorizationRef !== null && resourceCeiling === null)
  ) {
    failV01("commissioned_work_authorization_resource_ceiling_missing");
  }
  if (liveAuthorizationRef !== null && resourceCeiling !== null) {
    const expectedCeiling =
      createCommissionedWorkAuthorizationResourceCeilingV01({
        live_authorization_ref: liveAuthorizationRef,
        provider_call_limit: resourceCeiling.provider_call_limit,
        model_call_limit: resourceCeiling.model_call_limit,
        external_network_call_limit:
          resourceCeiling.external_network_call_limit,
      });
    if (
      canonicalizeProtocolValueV01(resourceCeiling) !==
        canonicalizeProtocolValueV01(expectedCeiling) ||
      (providerCalls !== null &&
        providerCalls > resourceCeiling.provider_call_limit) ||
      (modelCalls !== null && modelCalls > resourceCeiling.model_call_limit) ||
      (networkCalls !== null &&
        networkCalls > resourceCeiling.external_network_call_limit)
    ) {
      failV01("commissioned_work_authorization_resource_ceiling_invalid");
    }
  }
  if (
    ((providerCalls ?? 0) > 0 &&
      (input.resource_binding.live_authorization_ref === null ||
        input.resource_binding.provider_ref === null)) ||
    ((modelCalls ?? 0) > 0 &&
      (input.resource_binding.live_authorization_ref === null ||
        input.resource_binding.provider_ref === null ||
        input.resource_binding.model_ref === null ||
        input.resource_binding.route_ref === null)) ||
    ((networkCalls ?? 0) > 0 &&
      (input.resource_binding.live_authorization_ref === null ||
        (input.resource_binding.route_ref === null &&
          input.resource_binding.network_destination_ref === null)))
  ) {
    failV01("commissioned_work_execution_resource_identity_missing");
  }
  if (
    input.execution_evidence_class ===
      COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01 &&
    (input.resource_binding.live_authorization_ref !== null ||
      (providerCalls ?? 0) > 0 ||
      (modelCalls ?? 0) > 0 ||
      (networkCalls ?? 0) > 0)
  ) {
    failV01("commissioned_work_commissioned_agent_conformance_binding_invalid");
  }
  if (
    input.execution_evidence_class ===
      COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01 &&
    input.resource_binding.live_authorization_ref === null
  ) {
    failV01("commissioned_work_commissioned_agent_observation_binding_invalid");
  }
}

function buildExecutionObservationV01(input: {
  packet: TaskContextPacketV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  execution_source: CommissionedWorkEpisodeExecutionSourceV01;
  resume_source: CommissionedWorkSameRunResumeSourceV01 | null;
  packet_presentation: CommissionedWorkExecutionObservationV01["packet_presentation"];
  continuation_materials_delivered: number | null;
  candidate_components_delivered: number | null;
  delivered_material_set_fingerprint: string | null;
  first_material_action_at: string | null;
  first_material_action_timing_provenance:
    CommissionedWorkExecutionObservationV01["first_material_action"]["timing_provenance"];
  executor_completion_attestation:
    CommissionedWorkExecutionObservationV01["executor_completion_attestation"];
  resources: CommissionedWorkResourceVectorV01;
  resource_binding: CommissionedWorkExecutionResourceBindingV01;
  unauthorized_effects: CommissionedWorkObjectiveObservationV01["unauthorized_effects"];
  synthetic_fixture_fields: null | {
    disposable_fixture_admission_fingerprint: string;
    synthetic_fixture_binding_fingerprint: string;
    synthetic_fixture_output_fingerprint: string;
  };
}): CommissionedWorkExecutionObservationV01 {
  const asserted = assertNativeHostResultV01(input.request, input.result);
  if (
    canonicalizeProtocolValueV01(asserted) !==
    canonicalizeProtocolValueV01(input.result)
  ) {
    failV01("commissioned_work_native_host_result_identity_changed");
  }
  if (
    input.request.request_id !== input.result.request_id ||
    input.request.run_id !== input.result.run_id ||
    input.request.task_context_packet_ref.source_ref !==
      input.packet.integrity.fingerprint
  ) {
    failV01("commissioned_work_execution_observation_source_invalid");
  }
  const isSynthetic = input.execution_source.binding_kind === "synthetic_fixture";
  const hostSet = exactNativeHostRefSetV01({
    request: input.request,
    result: input.result,
    binding_kind: input.execution_source.binding_kind,
    resume_source: input.resume_source,
    expected_provenance: null,
  });
  const candidateFingerprints = candidateComponentDeliveryFingerprintsV01(
    input.packet,
  );
  const expectedContinuationCount = isSuccessorPlanV01(input.plan)
    ? input.plan.selected_material_ids.length
    : 0;
  const packetMaterialFingerprint = packetMaterialSetFingerprintV01(input.packet);
  const deliveryObserved =
    input.packet_presentation.status !== "not_observed";
  if (
    (input.packet_presentation.status === "not_observed" &&
      (input.packet_presentation.observed_at !== null ||
        input.packet_presentation.provenance !== "unknown" ||
        input.delivered_material_set_fingerprint !== null ||
        input.continuation_materials_delivered !== null ||
        input.candidate_components_delivered !== null)) ||
    (deliveryObserved &&
      (input.packet_presentation.observed_at === null ||
        input.packet_presentation.provenance === "unknown" ||
        input.delivered_material_set_fingerprint !== packetMaterialFingerprint ||
        input.continuation_materials_delivered !== expectedContinuationCount ||
        input.candidate_components_delivered !== candidateFingerprints.length ||
        !input.result.checks.some(
          (check) =>
            check.check_id === "validated_packet_delivery" &&
            check.status === "passed",
        )))
  ) {
    failV01("commissioned_work_execution_delivery_observation_invalid");
  }
  if (input.packet_presentation.observed_at !== null) {
    requireTimestampV01(
      input.packet_presentation.observed_at,
      "commissioned_work_packet_presentation_time_invalid",
    );
  }
  const firstAction = firstMaterialActionObservationV01({
    result: input.result,
    observed_at: input.first_material_action_at,
    timing_provenance: input.first_material_action_timing_provenance,
  });
  if (
    input.packet_presentation.status ===
      "presented_before_first_meaningful_action" &&
    (firstAction.observed_at === null ||
      input.packet_presentation.observed_at === null ||
      Date.parse(input.packet_presentation.observed_at) >
        Date.parse(firstAction.observed_at))
  ) {
    failV01("commissioned_work_packet_presentation_order_invalid");
  }
  if (Object.values(input.unauthorized_effects).some((value) => value !== 0)) {
    failV01("commissioned_work_execution_unauthorized_effect");
  }
  validateExecutionResourceBindingV01({
    execution_evidence_class: input.execution_source.execution_evidence_class,
    resources: input.resources,
    resource_binding: input.resource_binding,
  });
  const common = {
    observation_version: COMMISSIONED_WORK_EXECUTION_OBSERVATION_VERSION_V01,
    observation_id: `execution-observation:${fingerprintV01({
      request_id: input.request.request_id,
      result: fingerprintV01(input.result),
      host_ref_set: hostSet.set_fingerprint,
      host_identity_provenance: hostSet.host_identity_provenance,
    }).slice("sha256:".length, "sha256:".length + 32)}`,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    task_context_packet_ref: createCommissionedWorkRecordRefV01({
      record_version: input.packet.packet_version,
      record_id: input.packet.packet_id,
      record_fingerprint: input.packet.integrity.fingerprint,
    }),
    native_host_request_fingerprint: fingerprintV01(input.request),
    native_host_result_fingerprint: fingerprintV01(input.result),
    host_ref_set: hostSet.bindings,
    host_ref_set_fingerprint: hostSet.set_fingerprint,
    packet_presentation: input.packet_presentation,
    packet_material_set_fingerprint: packetMaterialFingerprint,
    delivered_material_set_fingerprint:
      input.delivered_material_set_fingerprint,
    selected_material_count: input.packet.selected_context.length,
    continuation_materials_delivered:
      input.continuation_materials_delivered,
    candidate_components_delivered: input.candidate_components_delivered,
    candidate_component_delivery_fingerprints: candidateFingerprints,
    first_material_action: firstAction,
    executor_completion_attestation: input.executor_completion_attestation,
    resources: input.resources,
    resource_binding: input.resource_binding,
    unauthorized_effects: input.unauthorized_effects,
  };
  if (isSynthetic) {
    if (input.synthetic_fixture_fields === null) {
      failV01("commissioned_work_synthetic_execution_binding_invalid");
    }
    return sealV01(
      {
        ...common,
        binding_kind: "synthetic_fixture" as const,
        execution_evidence_class: COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
        execution_mode: "zero_provider_synthetic_fixture_adapter" as const,
        ...input.synthetic_fixture_fields,
        synthetic_fixture_output_applied: true as const,
      },
      "commissioned_work_execution_observation_without_integrity_fingerprint",
    );
  }
  if (input.synthetic_fixture_fields !== null) {
    failV01("commissioned_work_commissioned_agent_execution_binding_invalid");
  }
  if (input.execution_source.binding_kind !== "commissioned_agent") {
    failV01("commissioned_work_commissioned_agent_execution_binding_invalid");
  }
  return sealV01(
    {
      ...common,
      binding_kind: "commissioned_agent" as const,
      execution_evidence_class: input.execution_source.execution_evidence_class,
      execution_mode: "commissioned_agent_native_host" as const,
      host_identity_provenance:
        hostSet.host_identity_provenance ??
        failV01("commissioned_work_host_identity_provenance_invalid"),
    },
    "commissioned_work_execution_observation_without_integrity_fingerprint",
  );
}

export function buildCommissionedWorkSyntheticExecutionObservationV01(
  input: BuildCommissionedWorkSyntheticExecutionObservationInputV01,
): CommissionedWorkExecutionObservationV01 {
  const resourceObservationRef = createCommissionedWorkRecordRefV01({
    record_version: input.result.result_version,
    record_id: `synthetic-resource:${input.request.request_id}`,
    record_fingerprint: fingerprintV01(input.result),
  });
  return buildExecutionObservationV01({
    ...input,
    execution_source: {
      binding_kind: "synthetic_fixture",
      execution_evidence_class: COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
      execution_mode: "zero_provider_synthetic_fixture_adapter",
    },
    resume_source: null,
    packet_presentation: {
      status: "presented_before_first_meaningful_action",
      observed_at: input.result.started_at,
      provenance: "synthetic_fixture_adapter",
    },
    continuation_materials_delivered: requireResultCountMetadataV01(
      input.result,
      "continuation_materials_delivered",
    ),
    candidate_components_delivered: requireResultCountMetadataV01(
      input.result,
      "candidate_components_delivered",
    ),
    delivered_material_set_fingerprint: requireResultFingerprintMetadataV01(
      input.result,
      "delivered_material_set_fingerprint",
    ),
    first_material_action_at:
      requireResultStringMetadataV01(input.result, "first_material_action_at"),
    first_material_action_timing_provenance: "synthetic_fixture_adapter",
    executor_completion_attestation: {
      provenance: "synthetic_fixture_adapter",
      claimed_complete: requireResultBooleanMetadataV01(
        input.result,
        "executor_claimed_complete",
      ),
    },
    resources: {
      provider_calls: {
        provenance: "observed",
        value: requireResultCountMetadataV01(input.result, "provider_calls"),
      },
      model_calls: {
        provenance: "observed",
        value: requireResultCountMetadataV01(input.result, "model_calls"),
      },
      external_network_calls: {
        provenance: "observed",
        value: requireResultCountMetadataV01(
          input.result,
          "external_network_calls",
        ),
      },
      tool_calls: { provenance: "observed", value: 0 },
      model_usage_units: { provenance: "unknown", value: null },
      cost_microunits: { provenance: "unknown", value: null },
      latency_ms: { provenance: "unknown", value: null },
      human_review_burden: { provenance: "unknown", value: null },
    },
    resource_binding: {
      provider_calls_observation_ref: resourceObservationRef,
      model_calls_observation_ref: resourceObservationRef,
      external_network_calls_observation_ref: resourceObservationRef,
      live_authorization_ref: null,
      authorization_resource_ceiling: null,
      provider_ref: null,
      model_ref: null,
      route_ref: null,
      network_destination_ref: null,
    },
    unauthorized_effects: zeroUnauthorizedEffectsV01(),
    synthetic_fixture_fields: {
      disposable_fixture_admission_fingerprint:
        requireResultFingerprintMetadataV01(
          input.result,
          "fixture_admission_fingerprint",
        ),
      synthetic_fixture_binding_fingerprint:
        requireResultFingerprintMetadataV01(
          input.result,
          "synthetic_fixture_binding_fingerprint",
        ),
      synthetic_fixture_output_fingerprint:
        requireResultFingerprintMetadataV01(
          input.result,
          "synthetic_fixture_output_fingerprint",
        ),
    },
  });
}

export function buildCommissionedWorkCommissionedAgentExecutionObservationV01(
  input: BuildCommissionedWorkCommissionedAgentExecutionObservationInputV01,
): CommissionedWorkExecutionObservationV01 {
  const metadata = input.result.adapter_extension.bounded_metadata;
  if (
    COMMISSIONED_WORK_SYNTHETIC_FIXTURE_METADATA_KEYS_V01.some(
      (key) => key in metadata,
    )
  ) {
    failV01("commissioned_work_commissioned_agent_fixture_metadata_forbidden");
  }
  return buildExecutionObservationV01({
    packet: input.packet,
    request: input.request,
    result: input.result,
    plan: input.plan,
    execution_source: {
      binding_kind: "commissioned_agent",
      execution_evidence_class: input.execution_evidence_class,
      execution_mode: "commissioned_agent_native_host",
      live_authorization_ref: input.resource_binding.live_authorization_ref,
      provider_ref: input.resource_binding.provider_ref,
      model_ref: input.resource_binding.model_ref,
      route_ref: input.resource_binding.route_ref,
      network_destination_ref:
        input.resource_binding.network_destination_ref,
    },
    resume_source: input.resume_source,
    packet_presentation: input.packet_presentation,
    continuation_materials_delivered:
      input.continuation_materials_delivered,
    candidate_components_delivered: input.candidate_components_delivered,
    delivered_material_set_fingerprint:
      input.delivered_material_set_fingerprint,
    first_material_action_at: input.first_material_action_at,
    first_material_action_timing_provenance:
      input.first_material_action_timing_provenance,
    executor_completion_attestation:
      input.executor_completion_attestation,
    resources: input.resources,
    resource_binding: input.resource_binding,
    unauthorized_effects: input.unauthorized_effects,
    synthetic_fixture_fields: null,
  });
}

function validateExecutionObservationResultBindingV01(input: {
  execution_observation: CommissionedWorkExecutionObservationV01;
  request: NativeHostRequestV01;
  packet: TaskContextPacketV01;
  result: NativeHostResultV01;
}): {
  host_external_refs: ExternalRefV01[];
  receipt_host_ref: ExternalRefV01 | null;
  run_ref_type: string;
  runtime_labels: string[];
  observation_kind: string;
  observation_summary: string;
  result_summary: string;
  operation_contract_note: string;
  privacy_note: string;
  model_identity: CommissionedWorkEvaluationVectorV01["model_identity"];
  model_invocations: RunReceiptBuilderInputV01["model_invocations"];
  receipt_limitations: string[];
  data_classification: RunReceiptBuilderInputV01["privacy_egress"]["data_classification"];
  egress_status: RunReceiptBuilderInputV01["privacy_egress"]["egress_status"];
  egress_basis: RunReceiptBuilderInputV01["privacy_egress"]["basis"];
  destination_refs: ExternalRefV01[];
  source_external_refs: ExternalRefV01[];
} {
  validateIntegrityV01(
    input.execution_observation,
    "commissioned_work_execution_observation_without_integrity_fingerprint",
    "commissioned_work_execution_observation_integrity_invalid",
  );
  const hostSet = exactNativeHostRefSetV01({
    request: input.request,
    result: input.result,
    binding_kind: input.execution_observation.binding_kind,
    resume_source: null,
    expected_provenance:
      input.execution_observation.binding_kind === "commissioned_agent"
        ? input.execution_observation.host_identity_provenance
        : null,
  });
  if (
    input.execution_observation.request_id !== input.request.request_id ||
    input.execution_observation.run_id !== input.request.run_id ||
    input.execution_observation.task_context_packet_ref.record_fingerprint !==
      input.packet.integrity.fingerprint ||
    input.execution_observation.native_host_request_fingerprint !==
      fingerprintV01(input.request) ||
    input.execution_observation.native_host_result_fingerprint !==
      fingerprintV01(input.result) ||
    input.execution_observation.host_ref_set_fingerprint !==
      hostSet.set_fingerprint ||
    canonicalizeProtocolValueV01(input.execution_observation.host_ref_set) !==
      canonicalizeProtocolValueV01(hostSet.bindings)
  ) {
    failV01("commissioned_work_execution_observation_source_invalid");
  }
  const executionSourceExternalRef = localRefV01(
    "commissioned_work_execution_observation",
    input.execution_observation.observation_id,
    input.result.finished_at,
    input.execution_observation.integrity.fingerprint,
  );
  const providerCalls = input.execution_observation.resources.provider_calls.value;
  const modelCalls = input.execution_observation.resources.model_calls.value;
  const externalNetworkCalls =
    input.execution_observation.resources.external_network_calls.value;
  if (
    modelCalls !== null &&
    (input.result.model_invocation_receipt_refs.length > modelCalls ||
      (modelCalls === 0 && input.result.model_invocation_receipt_refs.length > 0))
  ) {
    failV01("commissioned_work_execution_model_receipt_binding_invalid");
  }
  if (input.execution_observation.binding_kind === "synthetic_fixture") {
    if (
      input.execution_observation.execution_evidence_class !==
        COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01 ||
      input.execution_observation.execution_mode !==
        "zero_provider_synthetic_fixture_adapter" ||
      providerCalls !== 0 ||
      modelCalls !== 0 ||
      externalNetworkCalls !== 0 ||
      input.result.model_invocation_receipt_refs.length !== 0
    ) {
      failV01("commissioned_work_synthetic_execution_binding_invalid");
    }
    return {
      host_external_refs: hostSet.external_refs,
      receipt_host_ref: hostSet.receipt_host_ref,
      run_ref_type: "commissioned_work_fixture_run",
      runtime_labels: [
        "commissioned_work_experiment",
        "synthetic_deterministic_execution",
        "zero_model",
      ],
      observation_kind: "synthetic_structured_fixture_adapter_result",
      observation_summary:
        "The local orchestrator received one bounded synthetic mechanics result.",
      result_summary:
        "One bounded synthetic commissioned-work mechanics episode was observed.",
      operation_contract_note:
        "The synthetic fixture adapter accepts only output paths allowed by the sealed live-capable operation contract.",
      privacy_note:
        "No provider, model, network, prompt, transcript, hidden reasoning, or absolute root is retained.",
      model_identity: {
        provenance: "unknown",
        provider_ref: null,
        model_ref: null,
        route_ref: null,
      },
      model_invocations: [],
      receipt_limitations: [],
      data_classification: "local_only",
      egress_status: "did_not_occur",
      egress_basis: "observed",
      destination_refs: [],
      source_external_refs: [executionSourceExternalRef],
    };
  }
  if (input.execution_observation.execution_mode !== "commissioned_agent_native_host") {
    failV01("commissioned_work_commissioned_agent_execution_binding_invalid");
  }
  const isConformance =
    input.execution_observation.execution_evidence_class ===
    COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01;
  const resourceBinding = input.execution_observation.resource_binding;
  const providerExternalRef = resourceBinding.provider_ref
    ? commissionedWorkExternalRefFromRecordV01(
        resourceBinding.provider_ref,
        "commissioned_work_provider",
        input.result.finished_at,
      )
    : null;
  const modelExternalRef = resourceBinding.model_ref
    ? commissionedWorkExternalRefFromRecordV01(
        resourceBinding.model_ref,
        "commissioned_work_model",
        input.result.finished_at,
      )
    : null;
  const routeExternalRef = resourceBinding.route_ref
    ? commissionedWorkExternalRefFromRecordV01(
        resourceBinding.route_ref,
        "commissioned_work_route",
        input.result.finished_at,
      )
    : null;
  const networkDestinationExternalRef = resourceBinding.network_destination_ref
    ? commissionedWorkExternalRefFromRecordV01(
        resourceBinding.network_destination_ref,
        "commissioned_work_network_destination",
        input.result.finished_at,
      )
    : null;
  const liveAuthorizationExternalRef = resourceBinding.live_authorization_ref
    ? commissionedWorkExternalRefFromRecordV01(
        resourceBinding.live_authorization_ref,
        "commissioned_work_live_authorization",
        input.result.finished_at,
      )
    : null;
  const destinationRefs = [
    providerExternalRef,
    routeExternalRef,
    networkDestinationExternalRef,
  ].filter(
    (ref): ref is ExternalRefV01 => ref !== null,
  );
  return {
    host_external_refs: hostSet.external_refs,
    receipt_host_ref: hostSet.receipt_host_ref,
    run_ref_type: "commissioned_work_commissioned_agent_run",
    runtime_labels: [
      "commissioned_work_experiment",
      isConformance
        ? "commissioned_agent_protocol_conformance"
        : "commissioned_agent_observation",
    ],
    observation_kind: isConformance
      ? "live_shaped_commissioned_agent_protocol_conformance_result"
      : "commissioned_agent_native_host_result",
    observation_summary: isConformance
      ? "The local orchestrator received one fixture-free live-shaped deterministic result."
      : "The local orchestrator received one separately authorized commissioned-agent result.",
    result_summary: isConformance
      ? "One fixture-free commissioned-agent episode protocol path was mechanically verified."
      : "One bounded commissioned-agent episode was observed.",
    operation_contract_note:
      "The admitted NativeHostResult is evaluated against the sealed task-owned operation contract; no predeclared solution write drives executor action.",
    privacy_note:
      "No raw prompt, transcript, hidden reasoning, provider payload, credential, or absolute root is retained; exact permitted execution refs remain bounded source identity.",
    model_identity: {
      provenance: resourceBinding.model_ref === null ? "unknown" : "observed",
      provider_ref: resourceBinding.provider_ref,
      model_ref: resourceBinding.model_ref,
      route_ref: resourceBinding.route_ref,
    },
    model_invocations: [],
    receipt_limitations: isConformance
      ? []
      : [
          "Exact model invocation source refs and resource lanes are retained; no legacy invocation summary is reconstructed from a reference.",
        ],
    data_classification: isConformance ? "local_only" : "private",
    egress_status:
      externalNetworkCalls === null
        ? "unknown"
        : externalNetworkCalls === 0
          ? "did_not_occur"
          : "occurred",
    egress_basis: externalNetworkCalls === null ? "unknown" : "observed",
    destination_refs: destinationRefs,
    source_external_refs: [
      executionSourceExternalRef,
      liveAuthorizationExternalRef,
      providerExternalRef,
      modelExternalRef,
      routeExternalRef,
      networkDestinationExternalRef,
      ...input.result.model_invocation_receipt_refs,
    ].filter((ref): ref is ExternalRefV01 => ref !== null),
  };
}

export function buildCommissionedWorkRunReceiptV01(input: {
  request: NativeHostRequestV01;
  packet: TaskContextPacketV01;
  result: NativeHostResultV01;
  observation: CommissionedWorkObjectiveObservationV01;
  execution_observation: CommissionedWorkExecutionObservationV01;
}): RunReceiptV01 {
  validateIntegrityV01(
    input.observation,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
    "commissioned_work_observation_integrity_invalid",
  );
  const executionBinding = validateExecutionObservationResultBindingV01({
    execution_observation: input.execution_observation,
    request: input.request,
    packet: input.packet,
    result: input.result,
  });
  if (
    input.request.request_id !== input.result.request_id ||
    input.request.run_id !== input.result.run_id ||
    input.request.task_context_packet_ref.source_ref !==
      input.packet.integrity.fingerprint ||
    input.observation.workspace_id !== input.request.workspace_id ||
    input.observation.project_id !== input.request.project_id ||
    input.observation.run_ref_fingerprint !== fingerprintV01(input.result.run_id)
  ) {
    failV01("commissioned_work_receipt_invocation_binding_invalid");
  }
  const reporterRef = localRefV01(
    "commissioned_work_orchestrator",
    COMMISSIONED_WORK_EVALUATION_VERSION_V01,
    input.result.finished_at,
    input.observation.integrity.fingerprint,
  );
  const evaluatorRef = localRefV01(
    "commissioned_work_outcome_evaluator",
    input.observation.evaluator_role.role_id,
    input.result.finished_at,
    input.observation.evaluator_role.role_fingerprint,
  );
  const executionObservationExternalRef = localRefV01(
    "commissioned_work_execution_observation",
    input.execution_observation.observation_id,
    input.result.finished_at,
    input.execution_observation.integrity.fingerprint,
  );
  const packetRef = packetExternalRefV01(input.packet);
  const runRef = localRefV01(
    executionBinding.run_ref_type,
    input.result.run_id,
    input.result.finished_at,
    input.observation.run_ref_fingerprint,
  );
  const hostRef = executionBinding.receipt_host_ref;
  const artifactRefs = input.result.changed_files.map((changed) =>
    repositoryArtifactRefV01(
      changed.repository_relative_path,
      input.result.finished_at,
      changed.after_hash,
    ),
  );
  const mainObservationId = `observation:executor-result:${input.result.request_id}`;
  const evaluatorObservationId = `observation:objective-evaluator:${input.result.request_id}`;
  const objectiveChecks = input.observation.required_checks.map((check) => ({
    check_id: check.check_id,
    required: true,
    status:
      check.disposition === "passed"
        ? ("passed" as const)
        : check.disposition === "failed"
          ? ("failed" as const)
          : ("unknown" as const),
    basis: "observed" as const,
    summary: "The independent bounded repository oracle recorded this disposition.",
    source_refs: [evaluatorRef],
  }));
  const objectiveGateChecks: RunReceiptBuilderInputV01["checks"] = [
    {
      check_id: "objective_repository_diff",
      required: true,
      status:
        input.observation.repository_diff_correctness === "passed"
          ? "passed"
          : input.observation.repository_diff_correctness === "failed"
            ? "failed"
            : "unknown",
      basis: "observed",
      summary: "The evaluator compared the exact repository diff to the frozen rubric.",
      source_refs: [evaluatorRef],
    },
    {
      check_id: "objective_negative_space",
      required: true,
      status:
        input.observation.negative_space.status === "preserved"
          ? "passed"
          : input.observation.negative_space.status === "revived"
            ? "failed"
            : "unknown",
      basis: "observed",
      summary: "The evaluator checked the sealed negative-space guards.",
      source_refs: [evaluatorRef],
    },
    {
      check_id: "objective_source_currentness",
      required: true,
      status:
        input.observation.source_currentness === "current"
          ? "passed"
          : input.observation.source_currentness === "failed"
            ? "failed"
            : "unknown",
      basis: "observed",
      summary:
        "The evaluator checked the exact repository source/currentness condition against the sealed rubric.",
      source_refs: [evaluatorRef],
    },
    {
      check_id: "objective_project_scope",
      required: true,
      status:
        input.observation.project_scope === "exact"
          ? "passed"
          : input.observation.project_scope === "violated"
            ? "failed"
            : "unknown",
      basis: "observed",
      summary: "The evaluator checked exact workspace and project scope.",
      source_refs: [evaluatorRef],
    },
    {
      check_id: "objective_authority_boundary",
      required: true,
      status: Object.values(input.observation.unauthorized_effects).every(
        (value) => value === 0,
      )
        ? "passed"
        : "failed",
      basis: "observed",
      summary: "The evaluator checked all forbidden authority and effect counters.",
      source_refs: [evaluatorRef],
    },
  ];
  const deliveryObserved =
    input.execution_observation.packet_presentation.status !== "not_observed";
  const deliveryCheck: RunReceiptBuilderInputV01["checks"][number] | null =
    deliveryObserved
      ? {
          check_id: "validated_packet_delivery",
          required: true,
          status: "passed",
          basis: "observed",
          summary:
            "The separate source-bound CW1 observation established exact packet delivery without modifying the native host result.",
          source_refs: [reporterRef],
        }
      : null;
  const allChecks = [
    ...(deliveryCheck ? [deliveryCheck] : []),
    ...objectiveChecks.filter((check) => check.status !== "unknown"),
    ...objectiveGateChecks.filter((check) => check.status !== "unknown"),
  ];
  const skippedChecks = [
    ...(!deliveryCheck
      ? [
          {
            check_id: "validated_packet_delivery",
            required: true,
            reason:
              "The native host did not establish exact packet delivery before its truthful terminal result.",
            basis: "observed" as const,
            source_refs: [reporterRef],
          },
        ]
      : []),
    ...input.observation.required_checks
      .filter(
        (check) =>
          check.disposition === "skipped" || check.disposition === "unknown",
      )
      .map((check) => ({
        check_id: check.check_id,
        required: true,
        reason:
          "The independent objective evaluator could not establish this required check.",
        basis: "observed" as const,
        source_refs: [evaluatorRef],
      })),
    ...objectiveGateChecks
      .filter((check) => check.status === "unknown")
      .map((check) => ({
        check_id: check.check_id,
        required: true,
        reason: "The independent evaluator could not establish this hard gate.",
        basis: "observed" as const,
        source_refs: [evaluatorRef],
      })),
  ];
  const requiredCheckIds = [
    "validated_packet_delivery",
    ...input.observation.required_checks.map((check) => check.check_id),
    ...objectiveGateChecks.map((check) => check.check_id),
  ].sort(compareProtocolCodeUnitsV01);
  const anyFailed = input.observation.required_checks.some(
    (check) => check.disposition === "failed",
  );
  const anyUnperformed = input.observation.required_checks.some(
    (check) => check.disposition === "skipped" || check.disposition === "unknown",
  );
  const deliveryPassed = deliveryCheck?.status === "passed";
  const anyHardGateFailed = objectiveGateChecks.some(
    (check) => check.status === "failed",
  );
  const anyHardGateUnknown = objectiveGateChecks.some(
    (check) => check.status === "unknown",
  );
  const allPassed =
    input.observation.oracle_executed &&
    !anyFailed &&
    !anyUnperformed &&
    !anyHardGateFailed &&
    !anyHardGateUnknown &&
    deliveryPassed &&
    input.observation.required_checks.length > 0;
  const receiptInput: RunReceiptBuilderInputV01 = {
    workspace_id: input.packet.workspace_id,
    project_id: input.packet.project_id,
    run_id: input.result.run_id,
    work_ref:
      typeof input.packet.work_ref === "object" ? input.packet.work_ref : null,
    task_context_packet_ref: packetRef,
    recorded_at: input.result.finished_at,
    started_at: input.result.started_at,
    finished_at: input.result.finished_at,
    execution: {
      status: receiptExecutionStatusV01(input.result.outcome),
      basis: "observed",
      source_refs: [reporterRef],
    },
    verification: {
      status: allPassed
        ? "passed"
        : anyFailed || anyHardGateFailed
          ? "failed"
          : anyUnperformed || anyHardGateUnknown || !deliveryPassed
            ? "partial"
            : "unknown",
      basis: "observed",
      required_check_ids: requiredCheckIds,
      source_refs: [evaluatorRef, reporterRef],
    },
    reporter_ref: reporterRef,
    observer_refs: [reporterRef, evaluatorRef],
    verifier_refs: [evaluatorRef, reporterRef],
    host_ref: hostRef,
    worker_ref: null,
    model_invocations: executionBinding.model_invocations,
    execution_environment: {
      environment_kind: "local",
      host_ref: hostRef,
      worker_ref: null,
      operating_system: null,
      runtime_labels: executionBinding.runtime_labels,
      source_refs: [reporterRef],
    },
    observations: [
      {
        observation_id: mainObservationId,
        observation_kind: executionBinding.observation_kind,
        summary: executionBinding.observation_summary,
        event_at: input.result.finished_at,
        observed_at: input.result.finished_at,
        observer_ref: reporterRef,
        trust_class: "direct_local_observation",
        source_refs: [
          runRef,
          packetRef,
          ...executionBinding.host_external_refs,
          ...executionBinding.source_external_refs,
        ],
        related_command_ids: [],
        related_check_ids: ["validated_packet_delivery"],
        related_artifact_refs: artifactRefs,
      },
      {
        observation_id: evaluatorObservationId,
        observation_kind: "independent_repository_oracle",
        summary: "The independent evaluator observed repository state and exact local checks.",
        event_at: input.result.finished_at,
        observed_at: input.result.finished_at,
        observer_ref: evaluatorRef,
        trust_class: "direct_local_observation",
        source_refs: [runRef, packetRef, ...artifactRefs],
        related_command_ids: input.observation.required_checks.map(
          (check) => `oracle:${check.check_id}`,
        ),
        related_check_ids: input.observation.required_checks.map((check) => check.check_id),
        related_artifact_refs: artifactRefs,
      },
    ],
    attestations: [],
    changed_artifacts: input.result.changed_files.map((changed, index) => ({
      artifact_ref: artifactRefs[index]!,
      change_kind: changed.change_kind,
      before_hash: changed.before_hash,
      after_hash: changed.after_hash,
      basis: "observed",
      related_observation_ids: [mainObservationId, evaluatorObservationId],
      related_attestation_ids: [],
      source_refs: [reporterRef, evaluatorRef],
    })),
    commands: input.observation.required_checks.map((check) => ({
      command_id: `oracle:${check.check_id}`,
      summary: "Execute one sealed local repository oracle.",
      command_fingerprint: check.command_fingerprint,
      started_at: null,
      finished_at: null,
      exit_code: check.exit_code,
      status:
        check.disposition === "passed"
          ? "completed"
          : check.disposition === "failed"
            ? "failed"
            : "unknown",
      basis: "observed",
      source_refs: [evaluatorRef],
      raw_output_included: false,
    })),
    checks: allChecks,
    skipped_checks: skippedChecks,
    host_approvals: [],
    external_refs: [
      packetRef,
      runRef,
      reporterRef,
      evaluatorRef,
      ...executionBinding.host_external_refs,
      ...executionBinding.source_external_refs,
    ],
    result_summary: {
      summary: executionBinding.result_summary,
      outcome: input.result.outcome,
      limitations: [
        "Executor completion is not task success.",
        "This receipt grants no semantic, execution, provider, network, or merge authority.",
        ...executionBinding.receipt_limitations,
      ],
    },
    blockers: [
      ...(input.result.outcome === "completed"
        ? []
        : [
            {
              code: input.result.public_stop_reason ?? "commissioned_work_episode_blocked",
              summary:
                "The native host returned a truthful non-completed terminal outcome.",
              source_refs: [reporterRef],
            },
          ]),
      ...(anyFailed
        ? [
            {
              code: "commissioned_work_objective_check_failed",
              summary: "At least one objective repository check failed.",
              source_refs: [evaluatorRef],
            },
          ]
        : []),
    ],
    warnings: [],
    gaps: anyUnperformed || !deliveryPassed
      ? [
          {
            code: "commissioned_work_objective_check_unperformed",
            summary: "At least one required objective repository check was not established.",
            source_refs: [evaluatorRef],
          },
        ]
      : [],
    privacy_egress: {
      data_classification: executionBinding.data_classification,
      egress_status: executionBinding.egress_status,
      basis: executionBinding.egress_basis,
      destination_refs: executionBinding.destination_refs,
      redaction_status: "not_needed",
      retention_class: "bounded_structured_local_receipt_only",
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [reporterRef],
      notes: [executionBinding.privacy_note],
    },
    cost_usage: {
      cost_basis: "unknown",
      cost_amount: null,
      currency: null,
      usage: {
        basis: "unknown",
        input_units: null,
        output_units: null,
        total_units: null,
        unit: null,
      },
      source_refs: [],
    },
    capability_coverage: [
      {
        capability: "bounded_repository_file_edit",
        coverage_level: "enforced",
        source_ref: reporterRef,
        notes: [
          executionBinding.operation_contract_note,
        ],
      },
      {
        capability: "objective_repository_evaluation",
        coverage_level: "observed",
        source_ref: evaluatorRef,
        notes: ["The independent evaluator owns task-success classification."],
      },
    ],
    source_refs: [packetRef, runRef, reporterRef, evaluatorRef],
    artifact_refs: artifactRefs,
    compatibility: {
      source_contracts: [
        COMMISSIONED_WORK_EPISODE_VERSION_V01,
        input.result.adapter_version,
        input.result.capability_version,
      ],
      unmapped_fields: [],
      warnings: [],
      external_refs: [packetRef],
    },
    authority_notes: [
      "This receipt is experimental observation, not approval, accepted state, or merge authority.",
    ],
  };
  const receipt = buildRunReceiptV01(receiptInput);
  const validation = validateRunReceiptV01(receipt);
  if (validation.status !== "valid") {
    failV01(
      `commissioned_work_receipt_invalid:${validation.errors[0]?.code ?? "unknown"}`,
    );
  }
  return receipt;
}

export function buildCommissionedWorkEpisodeArtifactV01(
  input: BuildCommissionedWorkEpisodeArtifactInputV01,
): CommissionedWorkEpisodeArtifactV01 {
  const commitment = findCaseCommitmentV01(input.manifest, input.source.case_id);
  if (
    canonicalizeProtocolValueV01(buildCommissionedWorkCaseCommitmentV01(input.source)) !==
    canonicalizeProtocolValueV01(commitment)
  ) {
    failV01("commissioned_work_episode_source_binding_invalid");
  }
  validatePacketResultReceiptObservationBindingV01(input);
  requireSafeCodeV01(input.episode_id, "commissioned_work_episode_id_invalid");
  requireTimestampV01(
    input.result.started_at,
    "commissioned_work_episode_start_invalid",
  );
  requireTimestampV01(
    input.result.finished_at,
    "commissioned_work_episode_finish_invalid",
  );
  if (Date.parse(input.result.finished_at) < Date.parse(input.result.started_at)) {
    failV01("commissioned_work_episode_time_order_invalid");
  }
  const observedFirstActionAt =
    input.execution_observation.first_material_action.observed_at;
  if (observedFirstActionAt !== null) {
    requireTimestampV01(
      observedFirstActionAt,
      "commissioned_work_first_action_time_invalid",
    );
    if (
      Date.parse(observedFirstActionAt) < Date.parse(input.result.started_at) ||
      Date.parse(observedFirstActionAt) > Date.parse(input.result.finished_at) ||
      Date.parse(input.packet.generated_at) > Date.parse(observedFirstActionAt)
    ) {
      failV01("commissioned_work_first_action_order_invalid");
    }
  }
  if (
    input.execution_observation.packet_presentation.status ===
      "presented_before_first_meaningful_action" &&
    (input.execution_observation.packet_presentation.observed_at === null ||
      observedFirstActionAt === null ||
      Date.parse(input.execution_observation.packet_presentation.observed_at) >
        Date.parse(observedFirstActionAt))
  ) {
    failV01("commissioned_work_packet_presentation_order_invalid");
  }
  if (
    input.receipt.started_at !== input.result.started_at ||
    input.receipt.finished_at !== input.result.finished_at ||
    input.receipt.execution.status !== receiptExecutionStatusV01(input.result.outcome)
  ) {
    failV01("commissioned_work_episode_execution_chronology_binding_invalid");
  }
  const successorPlan = isSuccessorPlanV01(input.plan) ? input.plan : null;
  if (
    (input.episode_role === "predecessor" &&
      (successorPlan !== null ||
        input.condition !== null ||
        input.holdout_variant !== null ||
        input.predecessor_episode_ref !== null ||
        input.predecessor_checkpoint !== null)) ||
    (input.episode_role === "successor" &&
      (successorPlan === null ||
        input.condition === null ||
        input.predecessor_episode_ref === null ||
        input.predecessor_checkpoint === null))
  ) {
    failV01("commissioned_work_episode_role_binding_invalid");
  }
  if (
    successorPlan &&
    (successorPlan.condition !== input.condition ||
      successorPlan.holdout_variant !== input.holdout_variant)
  ) {
    failV01("commissioned_work_episode_treatment_binding_invalid");
  }
  const conditionBinding = successorPlan
    ? commitment.condition_bindings.find(
        (binding) =>
          binding.condition === successorPlan.condition &&
          binding.holdout_variant === successorPlan.holdout_variant,
      ) ?? null
    : null;
  if (successorPlan && !conditionBinding) {
    failV01("commissioned_work_episode_treatment_binding_missing");
  }
  if (
    input.source.case_role === "holdout" &&
    (!input.candidate_freeze_fingerprint || input.candidate_frozen_before_start !== true)
  ) {
    failV01("commissioned_work_holdout_before_candidate_freeze");
  }
  if (
    input.source.case_role === "training" &&
    input.candidate_freeze_fingerprint !== null
  ) {
    failV01("commissioned_work_training_candidate_binding_invalid");
  }
  const evaluatorRole = input.manifest.outcome_evaluator;
  const executorRole = createCommissionedWorkRoleRefV01(
    "executor",
    input.executor_role_id_override ?? input.plan.executor_role_id,
  );
  const sameRunResume =
    input.execution_observation.binding_kind === "commissioned_agent" &&
    input.execution_observation.host_identity_provenance.provenance_kind ===
      "same_run_resume";
  if (
    new Set([
      executorRole.role_fingerprint,
      input.manifest.task_author.role_fingerprint,
      evaluatorRole.role_fingerprint,
      input.manifest.consolidation_assessor.role_fingerprint,
    ]).size !== 4
  ) {
    failV01("commissioned_work_episode_role_separation_invalid");
  }
  if (input.predecessor_checkpoint !== null) {
    validateIntegrityV01(
      input.predecessor_checkpoint,
      "commissioned_work_episode_checkpoint_without_integrity_fingerprint",
      "commissioned_work_episode_checkpoint_integrity_invalid",
    );
    if (
      canonicalizeProtocolValueV01(
        input.predecessor_checkpoint.predecessor_episode_ref,
      ) !== canonicalizeProtocolValueV01(input.predecessor_episode_ref) ||
      input.predecessor_checkpoint.case_id !== input.source.case_id ||
      input.predecessor_checkpoint.workspace_id !== input.manifest.workspace_id ||
      input.predecessor_checkpoint.project_id !== input.source.project_id ||
      input.predecessor_checkpoint.predecessor_run_ref_fingerprint ===
        fingerprintV01(input.result.run_id) ||
      input.predecessor_checkpoint.predecessor_executor_role_ref.role_fingerprint ===
        executorRole.role_fingerprint ||
      Date.parse(input.predecessor_checkpoint.sealed_at) >
        Date.parse(input.result.started_at) ||
      input.request.execution_grant_ref !== null ||
      input.request.packet_capability_grant !== null
    ) {
      failV01("commissioned_work_episode_checkpoint_binding_invalid");
    }
  }
  if (sameRunResume !== (input.episode_origin_source_chain !== null)) {
    failV01("commissioned_work_episode_origin_proof_required");
  }
  if (input.episode_origin_source_chain !== null) {
    const chain = input.episode_origin_source_chain;
    validateEpisodeOriginSourceChainV01(chain);
    const proof = chain.origin_proof;
    const freshOrigin = chain.fresh_origin_observation;
    const invocationProvenance =
      input.execution_observation.binding_kind === "commissioned_agent"
        ? input.execution_observation.host_identity_provenance
        : null;
    const resumedRequestSourceBinding =
      createCodexAppServerRequestSourceBindingV01(input.request);
    const packetRef = createCommissionedWorkRecordRefV01({
      record_version: input.packet.packet_version,
      record_id: input.packet.packet_id,
      record_fingerprint: input.packet.integrity.fingerprint,
    });
    if (
      invocationProvenance?.provenance_kind !== "same_run_resume" ||
      proof.case_id !== input.source.case_id ||
      proof.workspace_id !== input.manifest.workspace_id ||
      proof.project_id !== input.source.project_id ||
      proof.episode_origin_kind !==
        (input.episode_role === "successor"
          ? "cold_successor"
          : "predecessor_episode") ||
      proof.origin_run_ref_fingerprint !== fingerprintV01(input.result.run_id) ||
      canonicalizeProtocolValueV01(proof.origin_executor_role_ref) !==
        canonicalizeProtocolValueV01(executorRole) ||
      Date.parse(proof.origin_started_at) > Date.parse(input.result.started_at) ||
      freshOrigin.request_binding.request_id !== input.request.request_id ||
      freshOrigin.request_binding.run_id !== input.request.run_id ||
      canonicalizeProtocolValueV01(
        freshOrigin.request_binding.task_context_packet_ref,
      ) !== canonicalizeProtocolValueV01(packetRef) ||
      freshOrigin.request_binding.task_context_packet_fingerprint !==
        input.packet.integrity.fingerprint ||
      freshOrigin.request_binding.native_host_packet_ref_fingerprint !==
        resumedRequestSourceBinding.task_context_packet_ref_fingerprint ||
      freshOrigin.request_binding.root_scope_fingerprint !==
        resumedRequestSourceBinding.root_scope_fingerprint ||
      freshOrigin.request_binding.operation_request_shape_fingerprint !==
        resumedRequestSourceBinding.operation_request_shape_fingerprint ||
      freshOrigin.request_binding.operation_contract_fingerprint !==
        fingerprintV01(input.plan.operation_contract) ||
      canonicalizeProtocolValueV01(
        freshOrigin.lifecycle_binding.admitted_host_ref_set,
      ) !==
        canonicalizeProtocolValueV01(chain.resume_source.source_host_ref_set) ||
      canonicalizeProtocolValueV01(proof.admitted_resume_source_ref) !==
        canonicalizeProtocolValueV01(invocationProvenance.resume_source_ref) ||
      proof.admitted_resume_binding_fingerprint !==
        invocationProvenance.resume_binding_fingerprint
    ) {
      failV01("commissioned_work_episode_origin_proof_binding_invalid");
    }
    if (
      input.episode_role === "successor" &&
      (input.predecessor_checkpoint === null ||
        canonicalizeProtocolValueV01(proof.predecessor_episode_ref) !==
          canonicalizeProtocolValueV01(input.predecessor_episode_ref) ||
        canonicalizeProtocolValueV01(proof.predecessor_checkpoint_ref) !==
          canonicalizeProtocolValueV01(
            episodeCheckpointRefV01(input.predecessor_checkpoint),
          ) ||
        proof.predecessor_run_ref_fingerprint !==
          input.predecessor_checkpoint.predecessor_run_ref_fingerprint ||
        canonicalizeProtocolValueV01(
          proof.predecessor_executor_role_ref,
        ) !==
          canonicalizeProtocolValueV01(
            input.predecessor_checkpoint.predecessor_executor_role_ref,
          ) ||
        proof.checkpoint_sealed_at !== input.predecessor_checkpoint.sealed_at)
    ) {
      failV01("commissioned_work_episode_origin_checkpoint_binding_invalid");
    }
  }
  const executionSourceBinding = validateExecutionObservationResultBindingV01({
    execution_observation: input.execution_observation,
    request: input.request,
    packet: input.packet,
    result: input.result,
  });
  const executionObservationExternalRef = localRefV01(
    "commissioned_work_execution_observation",
    input.execution_observation.observation_id,
    input.result.finished_at,
    input.execution_observation.integrity.fingerprint,
  );
  const normalizedReceiptHostRef =
    executionSourceBinding.receipt_host_ref === null
      ? null
      : normalizeExternalRefPrimitiveV01(
          executionSourceBinding.receipt_host_ref,
        );
  if (
    canonicalizeProtocolValueV01(input.receipt.host_ref) !==
    canonicalizeProtocolValueV01(normalizedReceiptHostRef)
  ) {
    failV01("commissioned_work_episode_receipt_host_ref_set_invalid");
  }
  const normalizedExecutionObservationExternalRef =
    normalizeExternalRefPrimitiveV01(executionObservationExternalRef);
  if (
    !input.receipt.external_refs.some(
      (externalRef) =>
        canonicalizeProtocolValueV01(externalRef) ===
        canonicalizeProtocolValueV01(
          normalizedExecutionObservationExternalRef,
        ),
    )
  ) {
    failV01("commissioned_work_episode_receipt_observation_ref_missing");
  }
  const evaluation = evaluationVectorV01({
    result: input.result,
    observation: input.observation,
    execution_observation: input.execution_observation,
    executor_role: executorRole,
    model_identity: executionSourceBinding.model_identity,
    synthetic_cross_condition_output_difference: "unknown",
    harmful_transfer: "unknown",
  });
  const packetMaterialSetFingerprint = packetMaterialSetFingerprintV01(
    input.packet,
  );
  const deliveredMaterialSetFingerprint =
    input.execution_observation.delivered_material_set_fingerprint;
  const continuationMaterialsDelivered =
    input.execution_observation.continuation_materials_delivered;
  const candidateComponentsDelivered =
    input.execution_observation.candidate_components_delivered;
  const candidateComponentDeliveryFingerprints =
    candidateComponentDeliveryFingerprintsV01(input.packet);
  if (
    packetMaterialSetFingerprint !==
      input.execution_observation.packet_material_set_fingerprint ||
    input.execution_observation.selected_material_count !==
      input.packet.selected_context.length ||
    (candidateComponentsDelivered !== null &&
      candidateComponentsDelivered !== candidateComponentDeliveryFingerprints.length)
  ) {
    failV01("commissioned_work_executor_delivery_binding_invalid");
  }
  const nativeHostResultRef = createCommissionedWorkRecordRefV01({
    record_version: input.result.result_version,
    record_id: input.result.request_id,
    record_fingerprint: fingerprintV01(input.result),
  });
  let episodeOrigin: CommissionedWorkEpisodeOriginV01;
  if (input.episode_origin_source_chain !== null) {
    const proof = input.episode_origin_source_chain.origin_proof;
    const commonOrigin = {
      origin_run_ref_fingerprint: proof.origin_run_ref_fingerprint,
      origin_executor_role_ref: proof.origin_executor_role_ref,
      origin_started_at: proof.origin_started_at,
      origin_proof_kind: "prior_fresh_invocation" as const,
      origin_proof_ref: episodeOriginProofRefV01(proof),
      fresh_origin_source_ref: proof.fresh_origin_source_ref,
      admitted_resume_source_ref: proof.admitted_resume_source_ref,
    };
    episodeOrigin =
      proof.episode_origin_kind === "predecessor_episode"
        ? {
            ...commonOrigin,
            origin_kind: "predecessor_episode",
            predecessor_episode_ref: null,
            predecessor_checkpoint_ref: null,
            predecessor_run_ref_fingerprint: null,
            predecessor_executor_role_ref: null,
            checkpoint_sealed_at: null,
          }
        : {
            ...commonOrigin,
            origin_kind: "cold_successor",
            predecessor_episode_ref: proof.predecessor_episode_ref,
            predecessor_checkpoint_ref: proof.predecessor_checkpoint_ref,
            predecessor_run_ref_fingerprint:
              proof.predecessor_run_ref_fingerprint,
            predecessor_executor_role_ref:
              proof.predecessor_executor_role_ref,
            checkpoint_sealed_at: proof.checkpoint_sealed_at,
          };
  } else if (input.episode_role === "predecessor") {
    episodeOrigin = {
      origin_kind: "predecessor_episode",
      origin_run_ref_fingerprint: fingerprintV01(input.result.run_id),
      origin_executor_role_ref: executorRole,
      origin_started_at: input.result.started_at,
      origin_proof_kind: "current_invocation",
      origin_proof_ref: nativeHostResultRef,
      fresh_origin_source_ref: null,
      admitted_resume_source_ref: null,
      predecessor_episode_ref: null,
      predecessor_checkpoint_ref: null,
      predecessor_run_ref_fingerprint: null,
      predecessor_executor_role_ref: null,
      checkpoint_sealed_at: null,
    };
  } else {
    const checkpoint = input.predecessor_checkpoint!;
    episodeOrigin = {
      origin_kind: "cold_successor",
      origin_run_ref_fingerprint: fingerprintV01(input.result.run_id),
      origin_executor_role_ref: executorRole,
      origin_started_at: input.result.started_at,
      origin_proof_kind: "current_invocation",
      origin_proof_ref: nativeHostResultRef,
      fresh_origin_source_ref: null,
      admitted_resume_source_ref: null,
      predecessor_episode_ref: checkpoint.predecessor_episode_ref,
      predecessor_checkpoint_ref: episodeCheckpointRefV01(checkpoint),
      predecessor_run_ref_fingerprint:
        checkpoint.predecessor_run_ref_fingerprint,
      predecessor_executor_role_ref: checkpoint.predecessor_executor_role_ref,
      checkpoint_sealed_at: checkpoint.sealed_at,
    };
  }
  const commonExecutionBinding = {
    run_ref_fingerprint: fingerprintV01(input.result.run_id),
    request_id: input.result.request_id,
    native_host_request_fingerprint: fingerprintV01(input.request),
    native_host_result_fingerprint: fingerprintV01(input.result),
    execution_observation_ref: executionObservationRefV01(
      input.execution_observation,
    ),
    host_ref_set: input.execution_observation.host_ref_set,
    host_ref_set_fingerprint:
      input.execution_observation.host_ref_set_fingerprint,
    product_execution_grant_created: false as const,
    solution_write_plan_checked_during_result_admission: false as const,
    new_run_for_cold_episode: episodeOrigin.origin_kind === "cold_successor",
    predecessor_run_reused: false as const,
    predecessor_execution_grant_inherited: false as const,
    predecessor_transcript_inherited: false as const,
    hidden_reasoning_inherited: false as const,
    executor_completion_is_outcome_truth: false as const,
    packet_material_set_fingerprint: packetMaterialSetFingerprint,
    delivered_material_set_fingerprint: deliveredMaterialSetFingerprint,
    continuation_materials_delivered: continuationMaterialsDelivered,
    candidate_components_delivered: candidateComponentsDelivered,
    candidate_component_delivery_fingerprints:
      candidateComponentDeliveryFingerprints,
  };
  const executionBinding: CommissionedWorkEpisodeExecutionBindingV01 =
    input.execution_observation.binding_kind === "synthetic_fixture"
      ? {
          ...commonExecutionBinding,
          binding_kind: "synthetic_fixture",
          execution_evidence_class:
            COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
          execution_mode: "zero_provider_synthetic_fixture_adapter",
          disposable_fixture_admission_fingerprint:
            input.execution_observation
              .disposable_fixture_admission_fingerprint,
          fixture_admission_reused: false,
          synthetic_fixture_binding_fingerprint:
            input.execution_observation.synthetic_fixture_binding_fingerprint,
          synthetic_fixture_output_fingerprint:
            input.execution_observation.synthetic_fixture_output_fingerprint,
          synthetic_fixture_output_applied: true,
        }
      : {
          ...commonExecutionBinding,
          binding_kind: "commissioned_agent",
          execution_evidence_class:
            input.execution_observation.execution_evidence_class,
          execution_mode: "commissioned_agent_native_host",
          host_identity_provenance:
            input.execution_observation.host_identity_provenance,
          resource_binding: input.execution_observation.resource_binding,
        };
  const evidenceLadder = episodeEvidenceLadderV01({
    episode_role: input.episode_role,
    condition: input.condition,
    selected_count: successorPlan?.selected_material_ids.length ?? 0,
    packet_presentation_status:
      input.execution_observation.packet_presentation.status,
    packet_ref: createCommissionedWorkRecordRefV01({
      record_version: input.packet.packet_version,
      record_id: input.packet.packet_id,
      record_fingerprint: input.packet.integrity.fingerprint,
    }),
    observation_ref: createCommissionedWorkRecordRefV01({
      record_version: input.observation.observation_version,
      record_id: `observation:${input.episode_id}`,
      record_fingerprint: input.observation.integrity.fingerprint,
    }),
  });
  const resolvedInterventionFingerprint = conditionBinding
    ? fingerprintV01({
        case_commitment: commitment.integrity.fingerprint,
        condition_binding: conditionBinding.binding_fingerprint,
        packet: input.packet.integrity.fingerprint,
        delivered_material_set: deliveredMaterialSetFingerprint,
      })
    : null;
  const artifactWithoutIntegrity = {
    episode_version: COMMISSIONED_WORK_EPISODE_VERSION_V01,
    episode_id: input.episode_id,
    episode_role: input.episode_role,
    case_id: input.source.case_id,
    case_role: input.source.case_role,
    workspace_id: input.manifest.workspace_id,
    project_id: input.source.project_id,
    independent_origin_group_id: input.source.independent_origin_group_id,
    case_commitment_ref: createCommissionedWorkRecordRefV01({
      record_version: commitment.commitment_version,
      record_id: commitment.case_id,
      record_fingerprint: commitment.integrity.fingerprint,
    }),
    repository_fixture_fingerprint: commitment.repository_fixture_fingerprint,
    evaluator_version: input.manifest.evaluator_version,
    objective_evaluator: evaluatorRole,
    condition: input.condition,
    existing_reentry_role:
      input.condition === null
        ? null
        : COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01[input.condition],
    holdout_variant: input.holdout_variant,
    common_evidence_fingerprint: commitment.common_evidence_fingerprint,
    continuation_binding_fingerprint: conditionBinding?.binding_fingerprint ?? null,
    intervention_provenance_fingerprint:
      conditionBinding?.intervention_provenance_ref.content_fingerprint ?? null,
    resolved_intervention_fingerprint: resolvedInterventionFingerprint,
    candidate_freeze_fingerprint: input.candidate_freeze_fingerprint,
    candidate_intervention_fingerprint:
      input.candidate_freeze_fingerprint === null
        ? null
        : fingerprintV01({
            candidate_freeze_fingerprint: input.candidate_freeze_fingerprint,
            delivered_component_refs: candidateComponentDeliveryFingerprints,
          }),
    predecessor_episode_ref: input.predecessor_episode_ref,
    episode_checkpoint_ref:
      input.predecessor_checkpoint === null
        ? null
        : createCommissionedWorkRecordRefV01({
            record_version: input.predecessor_checkpoint.checkpoint_version,
            record_id: input.predecessor_checkpoint.checkpoint_id,
            record_fingerprint: input.predecessor_checkpoint.integrity.fingerprint,
          }),
    task_context_packet_ref: createCommissionedWorkRecordRefV01({
      record_version: input.packet.packet_version,
      record_id: input.packet.packet_id,
      record_fingerprint: input.packet.integrity.fingerprint,
    }),
    native_host_result_ref: nativeHostResultRef,
    run_receipt_ref: createCommissionedWorkRecordRefV01({
      record_version: input.receipt.receipt_version,
      record_id: input.receipt.receipt_id,
      record_fingerprint: input.receipt.integrity.fingerprint,
    }),
    episode_origin: episodeOrigin,
    episode_origin_source_chain: input.episode_origin_source_chain,
    execution_binding: executionBinding,
    chronology: {
      started_at: input.result.started_at,
      first_material_action_at:
        input.execution_observation.first_material_action.observed_at,
      finished_at: input.result.finished_at,
      candidate_frozen_before_start: input.candidate_frozen_before_start,
    },
    repository_state: input.repository_state,
    executor_completion_attestation:
      input.execution_observation.executor_completion_attestation,
    repository_action_trace_fingerprint: input.repository_action_trace_fingerprint,
    objective_observation_ref: createCommissionedWorkRecordRefV01({
      record_version: input.observation.observation_version,
      record_id: `observation:${input.episode_id}`,
      record_fingerprint: input.observation.integrity.fingerprint,
    }),
    evaluation,
    evidence_ladder: evidenceLadder,
    authority_summary: createCommissionedWorkAuthoritySummaryV01(),
    material_boundary: createCommissionedWorkMaterialBoundaryV01(),
  };
  return sealV01(
    artifactWithoutIntegrity,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
}

export function assertValidCommissionedWorkEpisodeArtifactV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): void {
  validateEpisodeIntegrityV01(episode);
}

export function buildCommissionedWorkEpisodeCheckpointV01(
  predecessor: CommissionedWorkEpisodeArtifactV01,
): CommissionedWorkEpisodeCheckpointV01 {
  validateEpisodeIntegrityV01(predecessor);
  if (
    predecessor.episode_role !== "predecessor" ||
    predecessor.predecessor_episode_ref !== null ||
    predecessor.episode_checkpoint_ref !== null
  ) {
    failV01("commissioned_work_episode_checkpoint_source_invalid");
  }
  return sealV01(
    {
      checkpoint_version: COMMISSIONED_WORK_EPISODE_CHECKPOINT_VERSION_V01,
      checkpoint_id: `checkpoint:${predecessor.case_id}`,
      case_id: predecessor.case_id,
      workspace_id: predecessor.workspace_id,
      project_id: predecessor.project_id,
      predecessor_episode_ref: episodeRefV01(predecessor),
      predecessor_executor_role_ref: predecessor.evaluation.executor_role,
      predecessor_run_ref_fingerprint:
        predecessor.execution_binding.run_ref_fingerprint,
      native_host_result_ref: predecessor.native_host_result_ref,
      run_receipt_ref: predecessor.run_receipt_ref,
      task_context_packet_ref: predecessor.task_context_packet_ref,
      condition_scope_fingerprint: fingerprintV01({
        case_id: predecessor.case_id,
        condition: predecessor.condition,
        holdout_variant: predecessor.holdout_variant,
        packet_ref: predecessor.task_context_packet_ref,
      }),
      repository_state: {
        episode_end_head: predecessor.repository_state.episode_end_head,
        episode_end_tree: predecessor.repository_state.episode_end_tree,
        worktree_fingerprint: predecessor.repository_state.worktree_fingerprint,
      },
      sealed_at: predecessor.chronology.finished_at,
      native_host_outcome_preserved: true as const,
      next_episode_requires_fresh_run: true as const,
      next_episode_requires_fresh_executor: true as const,
      continuation_grant_inheritance_allowed: false as const,
      predecessor_transcript_inheritance_allowed: false as const,
      hidden_reasoning_inheritance_allowed: false as const,
    },
    "commissioned_work_episode_checkpoint_without_integrity_fingerprint",
  );
}

function episodeCheckpointRefV01(
  checkpoint: CommissionedWorkEpisodeCheckpointV01,
): CommissionedWorkRecordRefV01 {
  validateIntegrityV01(
    checkpoint,
    "commissioned_work_episode_checkpoint_without_integrity_fingerprint",
    "commissioned_work_episode_checkpoint_integrity_invalid",
  );
  return createCommissionedWorkRecordRefV01({
    record_version: checkpoint.checkpoint_version,
    record_id: checkpoint.checkpoint_id,
    record_fingerprint: checkpoint.integrity.fingerprint,
  });
}

export function buildCommissionedWorkTrainingResultV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  predecessor_episodes: CommissionedWorkEpisodeArtifactV01[];
  successor_episodes: CommissionedWorkEpisodeArtifactV01[];
}): CommissionedWorkTrainingResultV01 {
  if (input.predecessor_episodes.length !== 3 || input.successor_episodes.length !== 12) {
    failV01("commissioned_work_training_slot_count_invalid");
  }
  const expectedCaseIds = new Set(input.manifest.training_cases.map((item) => item.case_id));
  const uniqueEpisodeIds = new Set<string>();
  const executorFingerprints = new Set<string>();
  for (const episode of [...input.predecessor_episodes, ...input.successor_episodes]) {
    validateEpisodeIntegrityV01(episode);
    const commitment = findCaseCommitmentV01(input.manifest, episode.case_id);
    assertEpisodeManifestBindingV01(episode, commitment, input.manifest);
    if (!expectedCaseIds.has(episode.case_id) || episode.case_role !== "training") {
      failV01("commissioned_work_training_episode_scope_invalid");
    }
    if (uniqueEpisodeIds.has(episode.episode_id)) {
      failV01("commissioned_work_training_episode_duplicate");
    }
    uniqueEpisodeIds.add(episode.episode_id);
    if (executorFingerprints.has(episode.evaluation.executor_role.role_fingerprint)) {
      failV01("commissioned_work_cold_executor_identity_reused");
    }
    executorFingerprints.add(episode.evaluation.executor_role.role_fingerprint);
  }
  for (const commitment of input.manifest.training_cases) {
    const predecessor = input.predecessor_episodes.filter(
      (episode) => episode.case_id === commitment.case_id,
    );
    const successors = input.successor_episodes.filter(
      (episode) => episode.case_id === commitment.case_id,
    );
    const exactCheckpoint =
      predecessor.length === 1
        ? episodeCheckpointRefV01(
            buildCommissionedWorkEpisodeCheckpointV01(predecessor[0]!),
          )
        : null;
    if (
      predecessor.length !== 1 ||
      successors.length !== 4 ||
      canonicalizeProtocolValueV01(
        successors
          .map((episode) => episode.condition)
          .sort((left, right) =>
            compareProtocolCodeUnitsV01(String(left), String(right)),
          ),
      ) !==
        canonicalizeProtocolValueV01(
          [...COMMISSIONED_WORK_CONDITIONS_V01].sort(compareProtocolCodeUnitsV01),
        ) ||
      successors.some((episode) => episode.holdout_variant !== null) ||
      new Set(successors.map((episode) => episode.common_evidence_fingerprint)).size !== 1 ||
      successors.some(
        (episode) =>
          episode.predecessor_episode_ref?.record_fingerprint !==
            predecessor[0]!.integrity.fingerprint ||
          canonicalizeProtocolValueV01(episode.episode_checkpoint_ref) !==
            canonicalizeProtocolValueV01(exactCheckpoint),
      )
    ) {
      failV01("commissioned_work_training_case_slots_invalid");
    }
  }
  const resultWithoutIntegrity = {
    result_version: "commissioned_controlled_work_training_result.v0.1" as const,
    family_ref: familyRefV01(input.manifest),
    predecessor_episodes: [...input.predecessor_episodes].sort(compareCanonicalV01),
    successor_episodes: [...input.successor_episodes].sort(compareCanonicalV01),
    training_complete: true as const,
    all_frozen_training_slots_present: true as const,
    holdout_materialized: false as const,
  };
  return sealV01(
    resultWithoutIntegrity,
    "commissioned_work_training_result_without_integrity_fingerprint",
  );
}

export function buildCommissionedWorkConsolidationCandidateV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  training: CommissionedWorkTrainingResultV01;
  candidate_id: string;
  frozen_at: string;
}): CommissionedWorkConsolidationCandidateV01 {
  requireSafeCodeV01(input.candidate_id, "commissioned_work_candidate_id_invalid");
  requireTimestampV01(input.frozen_at, "commissioned_work_candidate_time_invalid");
  validateIntegrityV01(
    input.training,
    "commissioned_work_training_result_without_integrity_fingerprint",
    "commissioned_work_training_integrity_invalid",
  );
  if (
    input.training.family_ref.record_fingerprint !== input.manifest.integrity.fingerprint ||
    input.training.holdout_materialized !== false
  ) {
    failV01("commissioned_work_candidate_training_binding_invalid");
  }
  if (
    [...input.training.predecessor_episodes, ...input.training.successor_episodes].some(
      (episode) => Date.parse(episode.chronology.finished_at) >= Date.parse(input.frozen_at),
    )
  ) {
    failV01("commissioned_work_candidate_frozen_before_training_complete");
  }
  const exactEpisodes = input.training.successor_episodes.filter(
    (episode) => episode.condition === "exact_current_continuity",
  );
  if (
    exactEpisodes.length !== 3 ||
    exactEpisodes.some(
      (episode) => !episode.evaluation.deterministic_repository_task_success,
    )
  ) {
    failV01("commissioned_work_candidate_mechanics_source_invalid");
  }
  const independentOrigins = new Set(
    exactEpisodes.map((episode) => episode.independent_origin_group_id),
  );
  if (independentOrigins.size !== 3) {
    failV01("commissioned_work_candidate_independent_origin_invalid");
  }
  const contrastingEpisodes = input.training.successor_episodes.filter(
    (episode) => episode.condition !== "exact_current_continuity",
  );
  const componentSources = componentSourcesV01(
    exactEpisodes,
    contrastingEpisodes,
    input.training.predecessor_episodes,
  );
  const sourceEpisodes = uniqueRecordRefsV01(
    componentSources.flatMap((component) => component.source_episode_refs),
  );
  const sourceEvaluations = uniqueRecordRefsV01(
    componentSources.flatMap((component) => component.source_evaluation_refs),
  );
  const candidateWithoutIntegrity = {
    candidate_version: COMMISSIONED_WORK_CANDIDATE_VERSION_V01,
    candidate_id: input.candidate_id,
    candidate_kind: "procedural_component_recipe" as const,
    family_ref: familyRefV01(input.manifest),
    consolidation_assessor: input.manifest.consolidation_assessor,
    frozen_at: input.frozen_at,
    source_episode_refs: sourceEpisodes,
    source_evaluation_refs: sourceEvaluations,
    independent_origin_groups: input.manifest.training_cases.map((commitment) => ({
      independent_origin_group_id: commitment.independent_origin_group_id,
      case_id: commitment.case_id,
      source_episode_refs: sourceEpisodes.filter(
        (ref) =>
          [
            ...input.training.predecessor_episodes,
            ...input.training.successor_episodes,
          ].find(
            (episode) =>
              episode.episode_id === ref.record_id &&
              episode.case_id === commitment.case_id,
          ) !== undefined,
      ),
    })),
    scope: {
      workspace_id: input.manifest.workspace_id,
      task_family_key: input.manifest.task_family_key,
      regime: "sealed_commissioned_repository_work_v0.1" as const,
    },
    minimal_generalized_rule: {
      components: componentSources,
      ordered_components: [...COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01] as CommissionedWorkConsolidationCandidateV01["minimal_generalized_rule"]["ordered_components"],
    },
    mechanics_source_case_ids: exactEpisodes
      .map((episode) => episode.case_id)
      .sort(compareProtocolCodeUnitsV01),
    synthetic_contrast_episode_refs: contrastingEpisodes
      .filter((episode) => episode.evaluation.hard_failures.length > 0)
      .map(episodeRefV01)
      .sort(compareCanonicalV01),
    negative_transfer: {
      status: "unknown" as const,
      source_refs: [],
    },
    expected_downstream_effect:
      "reduce_currentness_negative_space_and_false_success_hard_failures" as const,
    falsifier_codes: [
      "source_currentness_mismatch",
      "negative_space_revived",
      "required_check_not_performed",
      "objective_oracle_failed",
    ] as CommissionedWorkHardFailureCodeV01[],
    uncertainty_codes: [
      "single_deterministic_family",
      "synthetic_output_authored_outside_executor",
      "candidate_not_independently_learned",
    ],
    missing_evidence_codes: [
      "live_provider_episode_unavailable",
      "executor_reference_observation_unavailable",
      "behavioral_conditioning_unestablished",
      "support_validation_unestablished",
      "outcome_association_unestablished",
      "intervention_sensitivity_unestablished",
      "repeatability_unestablished",
      "held_out_transfer_unestablished",
      ...(componentSources.some(
        (component) => component.independent_origin_group_ids.length < 2,
      )
        ? ["component_independent_recurrence_incomplete"]
        : []),
    ],
    applicability: {
      task_family_key: input.manifest.task_family_key,
      requires_source_reobservation: true as const,
      requires_objective_repository_oracle: true as const,
    },
    stale_or_reset_conditions: [
      "source_regime_changed",
      "continuity_source_superseded",
      "objective_oracle_changed",
    ] as CommissionedWorkConsolidationCandidateV01["stale_or_reset_conditions"],
    strongest_simpler_baseline: {
      variant: "strongest_equal_budget_baseline" as const,
      selection_rule_version:
        "commissioned_work_pre_outcome_baseline_selection.v0.1" as const,
      selection_status: "predeclared_designated_comparator" as const,
      strongest_claim_status: "unresolved" as const,
      eligible_no_candidate_variants: [
        "strongest_equal_budget_baseline",
        "stale_or_reset",
      ] as CommissionedWorkConsolidationCandidateV01["strongest_simpler_baseline"]["eligible_no_candidate_variants"],
      selected_before_holdout_outcomes: true as const,
      outcome_data_used: false as const,
      selection_fingerprint: fingerprintV01({
        family: input.manifest.integrity.fingerprint,
        selection_rule_version:
          "commissioned_work_pre_outcome_baseline_selection.v0.1",
        designated_variant: "strongest_equal_budget_baseline",
        eligible_no_candidate_variants: [
          "strongest_equal_budget_baseline",
          "stale_or_reset",
        ],
        selection_basis:
          "equal_budget_maximal_common_evidence_primary_regime_before_outcomes",
        candidate_components_present: [],
        equal_budget: input.manifest.equal_budget_fingerprint,
      }),
      source_episode_refs: input.training.successor_episodes
        .filter((episode) => episode.condition === "exact_current_continuity")
        .map(episodeRefV01)
        .sort(compareCanonicalV01),
    },
    candidate_evidence_class: "synthetic_mechanics_template" as const,
    evidence_supported_procedural_knowledge: false as const,
    independently_learned: false as const,
    validated_for_transfer: false as const,
    holdout_included_in_derivation: false as const,
    repeated_same_origin_counted_as_independent: false as const,
    accepted_semantic_state_created: false as const,
    active_context_created: false as const,
    policy_created: false as const,
  };
  return sealV01(
    candidateWithoutIntegrity,
    "commissioned_work_candidate_without_integrity_fingerprint",
  );
}

export function buildCommissionedWorkHoldoutEvaluationV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  candidate: CommissionedWorkConsolidationCandidateV01;
  holdout_id: string;
  holdout_materialized_at: string;
  holdout_started_at: string;
  predecessor_episode: CommissionedWorkEpisodeArtifactV01;
  arms: [
    CommissionedWorkEpisodeArtifactV01,
    CommissionedWorkEpisodeArtifactV01,
    CommissionedWorkEpisodeArtifactV01,
    CommissionedWorkEpisodeArtifactV01,
  ];
}): CommissionedWorkHoldoutEvaluationV01 {
  requireSafeCodeV01(input.holdout_id, "commissioned_work_holdout_id_invalid");
  requireTimestampV01(
    input.holdout_materialized_at,
    "commissioned_work_holdout_materialized_at_invalid",
  );
  requireTimestampV01(
    input.holdout_started_at,
    "commissioned_work_holdout_started_at_invalid",
  );
  validateIntegrityV01(
    input.candidate,
    "commissioned_work_candidate_without_integrity_fingerprint",
    "commissioned_work_candidate_freeze_invalid",
  );
  if (
    input.candidate.family_ref.record_fingerprint !==
      input.manifest.integrity.fingerprint ||
    input.candidate.strongest_simpler_baseline.selection_rule_version !==
      "commissioned_work_pre_outcome_baseline_selection.v0.1" ||
    input.candidate.strongest_simpler_baseline.selection_status !==
      "predeclared_designated_comparator" ||
    input.candidate.strongest_simpler_baseline.strongest_claim_status !==
      "unresolved" ||
    input.candidate.strongest_simpler_baseline.selected_before_holdout_outcomes !==
      true ||
    input.candidate.strongest_simpler_baseline.outcome_data_used !== false ||
    Date.parse(input.candidate.frozen_at) >= Date.parse(input.holdout_materialized_at) ||
    Date.parse(input.holdout_materialized_at) > Date.parse(input.holdout_started_at)
  ) {
    failV01("commissioned_work_holdout_freeze_order_invalid");
  }
  validateEpisodeIntegrityV01(input.predecessor_episode);
  assertEpisodeManifestBindingV01(
    input.predecessor_episode,
    input.manifest.holdout_case,
    input.manifest,
  );
  if (
    input.predecessor_episode.case_id !== input.manifest.holdout_case.case_id ||
    input.predecessor_episode.case_role !== "holdout" ||
    input.predecessor_episode.episode_role !== "predecessor" ||
    input.predecessor_episode.candidate_freeze_fingerprint !==
      input.candidate.integrity.fingerprint ||
    input.predecessor_episode.chronology.candidate_frozen_before_start !== true ||
    Date.parse(input.predecessor_episode.chronology.started_at) <
      Date.parse(input.holdout_materialized_at)
  ) {
    failV01("commissioned_work_holdout_predecessor_invalid");
  }
  const variants = new Map<
    CommissionedWorkHoldoutVariantV01,
    CommissionedWorkEpisodeArtifactV01
  >();
  const executorFingerprints = new Set<string>([
    input.predecessor_episode.evaluation.executor_role.role_fingerprint,
  ]);
  const exactCheckpoint = episodeCheckpointRefV01(
    buildCommissionedWorkEpisodeCheckpointV01(input.predecessor_episode),
  );
  for (const arm of input.arms) {
    validateEpisodeIntegrityV01(arm);
    assertEpisodeManifestBindingV01(
      arm,
      input.manifest.holdout_case,
      input.manifest,
    );
    if (
      arm.case_id !== input.manifest.holdout_case.case_id ||
      arm.case_role !== "holdout" ||
      arm.episode_role !== "successor" ||
      arm.holdout_variant === null ||
      arm.candidate_freeze_fingerprint !== input.candidate.integrity.fingerprint ||
      arm.chronology.candidate_frozen_before_start !== true ||
      Date.parse(arm.chronology.started_at) <=
        Date.parse(input.predecessor_episode.chronology.finished_at) ||
      arm.predecessor_episode_ref?.record_fingerprint !==
        input.predecessor_episode.integrity.fingerprint ||
      canonicalizeProtocolValueV01(arm.episode_checkpoint_ref) !==
        canonicalizeProtocolValueV01(exactCheckpoint)
    ) {
      failV01("commissioned_work_holdout_arm_binding_invalid");
    }
    if (
      variants.has(arm.holdout_variant) ||
      executorFingerprints.has(arm.evaluation.executor_role.role_fingerprint)
    ) {
      failV01("commissioned_work_holdout_slot_or_executor_duplicate");
    }
    variants.set(arm.holdout_variant, arm);
    executorFingerprints.add(arm.evaluation.executor_role.role_fingerprint);
  }
  const baseline = requireHoldoutVariantV01(
    variants,
    "strongest_equal_budget_baseline",
  );
  const present = requireHoldoutVariantV01(variants, "candidate_present");
  const ablation = requireHoldoutVariantV01(
    variants,
    "candidate_component_ablation",
  );
  const staleReset = requireHoldoutVariantV01(variants, "stale_or_reset");
  if (
    baseline.condition !== "exact_current_continuity" ||
    present.condition !== "exact_current_continuity" ||
    ablation.condition !== "exact_current_continuity" ||
    staleReset.condition !== "stale_or_regime_shift_continuity" ||
    new Set([
      baseline.common_evidence_fingerprint,
      present.common_evidence_fingerprint,
      ablation.common_evidence_fingerprint,
      staleReset.common_evidence_fingerprint,
    ]).size !== 1 ||
    baseline.candidate_intervention_fingerprint ===
      present.candidate_intervention_fingerprint ||
    present.candidate_intervention_fingerprint ===
      ablation.candidate_intervention_fingerprint
  ) {
    failV01("commissioned_work_holdout_intervention_isolation_invalid");
  }
  const holdoutBindings = new Map(
    input.manifest.holdout_case.condition_bindings.map((binding) => [
      binding.holdout_variant,
      binding,
    ]),
  );
  const baselineBinding = holdoutBindings.get("strongest_equal_budget_baseline");
  const presentBinding = holdoutBindings.get("candidate_present");
  const ablationBinding = holdoutBindings.get("candidate_component_ablation");
  const staleResetBinding = holdoutBindings.get("stale_or_reset");
  const componentRefByFingerprint = new Map(
    input.candidate.minimal_generalized_rule.components.map((component) => [
      component.component_ref.content_fingerprint,
      component.component_ref,
    ]),
  );
  const orderedComponentDeliveryFingerprints =
    input.candidate.minimal_generalized_rule.ordered_components.map((componentId) => {
      const component_ref = componentRefByFingerprint.get(
        candidateComponentRefV01(componentId).content_fingerprint,
      );
      if (!component_ref) {
        failV01("commissioned_work_holdout_candidate_component_missing");
      }
      return fingerprintV01({
        candidate_fingerprint: input.candidate.integrity.fingerprint,
        component_ref,
      });
    });
  const expectedComponentDeliveryFingerprints = [
    ...orderedComponentDeliveryFingerprints,
  ].sort(compareProtocolCodeUnitsV01);
  const expectedAblatedComponentDeliveryFingerprints =
    orderedComponentDeliveryFingerprints
      .slice(0, -1)
      .sort(compareProtocolCodeUnitsV01);
  const expectedCandidateInterventionFingerprint = (refs: string[]) =>
    fingerprintV01({
      candidate_freeze_fingerprint: input.candidate.integrity.fingerprint,
      delivered_component_refs: refs,
    });
  if (
    !baselineBinding ||
    !presentBinding ||
    !ablationBinding ||
    !staleResetBinding ||
    baselineBinding.candidate_intervention_mode !== "no_candidate" ||
    presentBinding.candidate_intervention_mode !==
      "all_frozen_candidate_components" ||
    ablationBinding.candidate_intervention_mode !==
      "frozen_candidate_minus_last_component" ||
    staleResetBinding.candidate_intervention_mode !== "no_candidate" ||
    canonicalizeProtocolValueV01(baselineBinding.continuation_material_refs) !==
      canonicalizeProtocolValueV01(presentBinding.continuation_material_refs) ||
    canonicalizeProtocolValueV01(baselineBinding.continuation_material_refs) !==
      canonicalizeProtocolValueV01(ablationBinding.continuation_material_refs) ||
    canonicalizeProtocolValueV01(baselineBinding.excluded_material_refs) !==
      canonicalizeProtocolValueV01(presentBinding.excluded_material_refs) ||
    canonicalizeProtocolValueV01(baselineBinding.excluded_material_refs) !==
      canonicalizeProtocolValueV01(ablationBinding.excluded_material_refs) ||
    baseline.execution_binding.continuation_materials_delivered !==
      present.execution_binding.continuation_materials_delivered ||
    baseline.execution_binding.continuation_materials_delivered !==
      ablation.execution_binding.continuation_materials_delivered ||
    baseline.execution_binding.candidate_components_delivered !== 0 ||
    present.execution_binding.candidate_components_delivered !==
      expectedComponentDeliveryFingerprints.length ||
    ablation.execution_binding.candidate_components_delivered !==
      expectedComponentDeliveryFingerprints.length - 1 ||
    staleReset.execution_binding.candidate_components_delivered !== 0 ||
    canonicalizeProtocolValueV01(
      present.execution_binding.candidate_component_delivery_fingerprints,
    ) !== canonicalizeProtocolValueV01(expectedComponentDeliveryFingerprints) ||
    canonicalizeProtocolValueV01(
      ablation.execution_binding.candidate_component_delivery_fingerprints,
    ) !==
      canonicalizeProtocolValueV01(
        expectedAblatedComponentDeliveryFingerprints,
      ) ||
    baseline.candidate_intervention_fingerprint !==
      expectedCandidateInterventionFingerprint([]) ||
    present.candidate_intervention_fingerprint !==
      expectedCandidateInterventionFingerprint(
        expectedComponentDeliveryFingerprints,
      ) ||
    ablation.candidate_intervention_fingerprint !==
      expectedCandidateInterventionFingerprint(
        expectedAblatedComponentDeliveryFingerprints,
      ) ||
    staleReset.candidate_intervention_fingerprint !==
      expectedCandidateInterventionFingerprint([])
  ) {
    failV01("commissioned_work_holdout_candidate_freeze_binding_invalid");
  }
  const comparisons = [
    holdoutComparisonV01(baseline, present),
    holdoutComparisonV01(present, ablation),
    holdoutComparisonV01(present, staleReset),
  ];
  const designatedBaselineRelation = holdoutRelationV01(baseline, present);
  const componentAblationRelation = holdoutRelationV01(ablation, present);
  const staleResetRelation = holdoutRelationV01(staleReset, present);
  const noCandidateArmRelations = [
    {
      variant: "strongest_equal_budget_baseline" as const,
      relation_to_candidate_present: designatedBaselineRelation,
    },
    {
      variant: "stale_or_reset" as const,
      relation_to_candidate_present: staleResetRelation,
    },
  ];
  const comparableNoCandidateEqual = noCandidateArmRelations.some(
    (comparison) => comparison.relation_to_candidate_present === "equal",
  );
  const hardFailureOrUnknownLanesPresent =
    [baseline, present, ablation, staleReset].some(
      (episode) => episode.evaluation.hard_failures.length > 0,
    ) ||
    comparisons.some(
      (comparison) =>
        comparison.relation === "incomplete" ||
        comparison.relation === "non_comparable",
    );
  const holdoutWithoutIntegrity = {
    holdout_version: COMMISSIONED_WORK_HOLDOUT_VERSION_V01,
    holdout_id: input.holdout_id,
    family_ref: familyRefV01(input.manifest),
    candidate_ref: candidateRefV01(input.candidate),
    candidate_frozen_at: input.candidate.frozen_at,
    holdout_materialized_at: input.holdout_materialized_at,
    holdout_started_at: input.holdout_started_at,
    candidate_frozen_before_holdout_materialization: true as const,
    candidate_frozen_before_holdout_execution: true as const,
    predecessor_episode: input.predecessor_episode,
    arms: [baseline, present, ablation, staleReset] as CommissionedWorkHoldoutEvaluationV01["arms"],
    comparisons,
    candidate_specific_transfer_conclusion: {
      status: "not_established" as const,
      designated_baseline_relation: designatedBaselineRelation,
      component_ablation_relation: componentAblationRelation,
      no_candidate_arm_relations: noCandidateArmRelations,
      comparable_no_candidate_equal: comparableNoCandidateEqual,
      strongest_no_candidate_selection: "unresolved" as const,
      hard_failure_or_unknown_lanes_present:
        hardFailureOrUnknownLanesPresent,
      behavioral_benefit_established: false as const,
      execution_evidence_class:
        COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
    },
    general_benefit_claimed: false as const,
    general_harm_claimed: false as const,
    policy_fitness_claimed: false as const,
  };
  return sealV01(
    holdoutWithoutIntegrity,
    "commissioned_work_holdout_without_integrity_fingerprint",
  );
}

export function buildCommissionedWorkFinalReportV01(input: {
  report_id: string;
  family: CommissionedWorkFamilyManifestV01;
  training: CommissionedWorkTrainingResultV01;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01;
  holdout: CommissionedWorkHoldoutEvaluationV01;
  limitations: string[];
}): CommissionedWorkFinalReportV01 {
  requireSafeCodeV01(input.report_id, "commissioned_work_report_id_invalid");
  input.limitations.forEach((code) =>
    requireSafeCodeV01(code, "commissioned_work_limitation_code_invalid"),
  );
  if (new Set(input.limitations).size !== input.limitations.length) {
    failV01("commissioned_work_limitation_code_duplicate");
  }
  validateIntegrityV01(
    input.family,
    "commissioned_work_family_manifest_without_integrity_fingerprint",
    "commissioned_work_manifest_integrity_invalid",
  );
  validateIntegrityV01(
    input.training,
    "commissioned_work_training_result_without_integrity_fingerprint",
    "commissioned_work_training_integrity_invalid",
  );
  validateIntegrityV01(
    input.consolidation_candidate,
    "commissioned_work_candidate_without_integrity_fingerprint",
    "commissioned_work_candidate_freeze_invalid",
  );
  validateIntegrityV01(
    input.holdout,
    "commissioned_work_holdout_without_integrity_fingerprint",
    "commissioned_work_holdout_integrity_invalid",
  );
  const rebuiltCandidate = buildCommissionedWorkConsolidationCandidateV01({
    manifest: input.family,
    training: input.training,
    candidate_id: input.consolidation_candidate.candidate_id,
    frozen_at: input.consolidation_candidate.frozen_at,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltCandidate) !==
    canonicalizeProtocolValueV01(input.consolidation_candidate)
  ) {
    failV01("commissioned_work_candidate_training_derivation_invalid");
  }
  if (
    input.training.family_ref.record_fingerprint !== input.family.integrity.fingerprint ||
    input.consolidation_candidate.family_ref.record_fingerprint !==
      input.family.integrity.fingerprint ||
    input.holdout.family_ref.record_fingerprint !== input.family.integrity.fingerprint ||
    input.holdout.candidate_ref.record_fingerprint !==
      input.consolidation_candidate.integrity.fingerprint
  ) {
    failV01("commissioned_work_report_source_binding_invalid");
  }
  const reportWithoutIntegrity = {
    report_version: COMMISSIONED_WORK_REPORT_VERSION_V01,
    report_id: input.report_id,
    experiment_class: COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
    execution_evidence_class:
      COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
    family: input.family,
    training: input.training,
    consolidation_candidate: input.consolidation_candidate,
    holdout: input.holdout,
    evidence_ladder_stages: COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01,
    family_evidence_ladder: familyEvidenceLadderV01(input),
    counts: {
      training_cases: 3 as const,
      holdout_cases: 1 as const,
      predecessor_episodes: 4 as const,
      successor_episodes: 16 as const,
      total_episode_artifacts: 20 as const,
      independent_training_origins: 3 as const,
      real_provider_calls: 0 as const,
      model_calls: 0 as const,
      external_network_calls: 0 as const,
    },
    cleanup: {
      requested: true as const,
      report_claims_cleanup_completion: false as const,
    },
    limitations: [...input.limitations].sort(compareProtocolCodeUnitsV01),
    material_boundary: createCommissionedWorkMaterialBoundaryV01(),
    authority_summary: createCommissionedWorkAuthoritySummaryV01(),
  };
  const report = sealV01(
    reportWithoutIntegrity,
    "commissioned_work_report_without_integrity_fingerprint",
  );
  assertValidCommissionedWorkFinalReportV01(report);
  return report;
}

export function assertValidCommissionedWorkFinalReportV01(
  report: CommissionedWorkFinalReportV01,
): void {
  validateIntegrityV01(
    report,
    "commissioned_work_report_without_integrity_fingerprint",
    "commissioned_work_report_integrity_invalid",
  );
  validateIntegrityV01(
    report.family,
    "commissioned_work_family_manifest_without_integrity_fingerprint",
    "commissioned_work_manifest_integrity_invalid",
  );
  if (
    report.report_version !== COMMISSIONED_WORK_REPORT_VERSION_V01 ||
    report.experiment_class !== COMMISSIONED_WORK_EXPERIMENT_CLASS_V01 ||
    report.execution_evidence_class !==
      COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01 ||
    report.family.experiment_class !== COMMISSIONED_WORK_EXPERIMENT_CLASS_V01 ||
    report.family.host_neutral_execution_commitment !== true ||
    report.family.execution_binding_scope !== "cohort_run_episode" ||
    report.family.training_cases.length !== 3 ||
    report.family.condition_order.length !== 4 ||
    report.training.predecessor_episodes.length !== 3 ||
    report.training.successor_episodes.length !== 12 ||
    report.holdout.arms.length !== 4 ||
    report.family_evidence_ladder.length !==
      COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01.length ||
    canonicalizeProtocolValueV01(
      report.family_evidence_ladder.map((row) => row.stage),
    ) !== canonicalizeProtocolValueV01(COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01)
  ) {
    failV01("commissioned_work_report_shape_invalid");
  }
  if (
    canonicalizeProtocolValueV01(report.counts) !==
      canonicalizeProtocolValueV01({
        training_cases: 3,
        holdout_cases: 1,
        predecessor_episodes: 4,
        successor_episodes: 16,
        total_episode_artifacts: 20,
        independent_training_origins: 3,
        real_provider_calls: 0,
        model_calls: 0,
        external_network_calls: 0,
      }) ||
    canonicalizeProtocolValueV01(report.cleanup) !==
      canonicalizeProtocolValueV01({
        requested: true,
        report_claims_cleanup_completion: false,
      }) ||
    canonicalizeProtocolValueV01(report.evidence_ladder_stages) !==
      canonicalizeProtocolValueV01(
        COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01,
      )
  ) {
    failV01("commissioned_work_report_counts_or_cleanup_invalid");
  }
  const allEpisodes = [
    ...report.training.predecessor_episodes,
    ...report.training.successor_episodes,
    report.holdout.predecessor_episode,
    ...report.holdout.arms,
  ];
  if (
    allEpisodes.length !== MAX_EPISODES_V01 ||
    new Set(allEpisodes.map((episode) => episode.episode_id)).size !==
      MAX_EPISODES_V01 ||
    allEpisodes.some(
      (episode) => episode.execution_binding.binding_kind !== "synthetic_fixture",
    )
  ) {
    failV01("commissioned_work_report_episode_slots_invalid");
  }
  allEpisodes.forEach(validateEpisodeIntegrityV01);
  if (
    new Set(
      allEpisodes.map(
        (episode) => episode.evaluation.executor_role.role_fingerprint,
      ),
    ).size !== MAX_EPISODES_V01
  ) {
    failV01("commissioned_work_report_executor_identity_reused");
  }
  for (const episode of allEpisodes) {
    assertEpisodeManifestBindingV01(
      episode,
      findCaseCommitmentV01(report.family, episode.case_id),
      report.family,
    );
  }
  const rebuiltTraining = buildCommissionedWorkTrainingResultV01({
    manifest: report.family,
    predecessor_episodes: report.training.predecessor_episodes,
    successor_episodes: report.training.successor_episodes,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltTraining) !==
    canonicalizeProtocolValueV01(report.training)
  ) {
    failV01("commissioned_work_report_training_binding_invalid");
  }
  const rebuiltCandidate = buildCommissionedWorkConsolidationCandidateV01({
    manifest: report.family,
    training: report.training,
    candidate_id: report.consolidation_candidate.candidate_id,
    frozen_at: report.consolidation_candidate.frozen_at,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltCandidate) !==
    canonicalizeProtocolValueV01(report.consolidation_candidate)
  ) {
    failV01("commissioned_work_report_candidate_binding_invalid");
  }
  const rebuiltHoldout = buildCommissionedWorkHoldoutEvaluationV01({
    manifest: report.family,
    candidate: report.consolidation_candidate,
    holdout_id: report.holdout.holdout_id,
    holdout_materialized_at: report.holdout.holdout_materialized_at,
    holdout_started_at: report.holdout.holdout_started_at,
    predecessor_episode: report.holdout.predecessor_episode,
    arms: report.holdout.arms,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltHoldout) !==
    canonicalizeProtocolValueV01(report.holdout)
  ) {
    failV01("commissioned_work_report_holdout_binding_invalid");
  }
  if (
    report.consolidation_candidate.candidate_evidence_class !==
      "synthetic_mechanics_template" ||
    report.consolidation_candidate.evidence_supported_procedural_knowledge !==
      false ||
    report.consolidation_candidate.independently_learned !== false ||
    report.consolidation_candidate.validated_for_transfer !== false ||
    report.consolidation_candidate.minimal_generalized_rule.components.some(
      (component) => component.independent_support_established !== false,
    ) ||
    report.holdout.candidate_specific_transfer_conclusion.status !==
      "not_established" ||
    report.holdout.candidate_specific_transfer_conclusion
      .behavioral_benefit_established !== false ||
    report.holdout.candidate_specific_transfer_conclusion
      .strongest_no_candidate_selection !== "unresolved"
  ) {
    failV01("commissioned_work_behavioral_evidence_classification_invalid");
  }
  if (
    report.consolidation_candidate.holdout_included_in_derivation !== false ||
    report.consolidation_candidate.source_episode_refs.some((ref) =>
      report.holdout.arms.some((episode) => episode.episode_id === ref.record_id),
    )
  ) {
    failV01("commissioned_work_holdout_in_candidate_derivation");
  }
  const knownTrainingOrigins = new Set(
    report.family.training_cases.map((item) => item.independent_origin_group_id),
  );
  if (
    report.consolidation_candidate.independent_origin_groups.length !== 3 ||
    new Set(
      report.consolidation_candidate.independent_origin_groups.map(
        (item) => item.independent_origin_group_id,
      ),
    ).size !== 3 ||
    report.consolidation_candidate.independent_origin_groups.some(
      (item) => !knownTrainingOrigins.has(item.independent_origin_group_id),
    )
  ) {
    failV01("commissioned_work_repeated_origin_counted_as_independent");
  }
  if (
    canonicalizeProtocolValueV01(report.authority_summary) !==
      canonicalizeProtocolValueV01(createCommissionedWorkAuthoritySummaryV01()) ||
    canonicalizeProtocolValueV01(report.material_boundary) !==
      canonicalizeProtocolValueV01(createCommissionedWorkMaterialBoundaryV01())
  ) {
    failV01("commissioned_work_report_authority_or_material_boundary_invalid");
  }
  assertSafeCommissionedWorkOutputV01(report);
}

export function createCommissionedWorkIntegrityV01(
  valueWithoutIntegrity: unknown,
  fingerprintScope: string,
): CommissionedWorkIntegrityV01 {
  requireSafeCodeV01(
    fingerprintScope,
    "commissioned_work_integrity_scope_invalid",
  );
  return {
    algorithm: "sha256",
    canonicalization: COMMISSIONED_WORK_CANONICALIZATION_V01,
    fingerprint_scope: fingerprintScope,
    fingerprint: fingerprintV01(valueWithoutIntegrity),
  };
}

export function assertSafeCommissionedWorkOutputV01(value: unknown): void {
  const serialized = canonicalizeProtocolValueV01(value);
  if (Buffer.byteLength(serialized, "utf8") > MAX_REPORT_BYTES_V01) {
    failV01("commissioned_work_safe_output_byte_bound_exceeded");
  }
  const issues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => issues.add(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in commissioned-work output.",
      provider_specific_field_message:
        "Provider-specific identity is forbidden in commissioned-work output.",
      allowed_false_invariant_fields: REPORT_SAFE_FALSE_INVARIANTS_V01,
    },
  );
  let stringCount = 0;
  let collectionEntries = 0;
  walkValueV01(value, (candidate) => {
    if (typeof candidate === "string") {
      stringCount += 1;
      if (
        candidate.length > MAX_STRING_CHARACTERS_V01 ||
        PRIVATE_ABSOLUTE_PATH_V01.test(candidate)
      ) {
        issues.add("unsafe_or_oversized_string");
      }
    }
    if (Array.isArray(candidate)) collectionEntries += candidate.length;
    else if (candidate && typeof candidate === "object") {
      collectionEntries += Object.keys(candidate).length;
    }
  });
  if (stringCount > MAX_STRINGS_V01) issues.add("string_collection_bound");
  if (collectionEntries > MAX_COLLECTION_ENTRIES_V01) {
    issues.add("collection_entry_bound");
  }
  if (issues.size > 0) {
    failV01(
      `commissioned_work_safe_output_invalid:${[...issues].sort().join(",")}`,
    );
  }
}

function validateCaseSourceV01(source: CommissionedWorkCaseSourceV01): void {
  assertExactCaseSourceShapeV01(source);
  requireSafeCodeV01(source.case_id, "commissioned_work_case_id_invalid");
  requireSafeCodeV01(source.project_id, "commissioned_work_case_project_id_invalid");
  requireSafeCodeV01(
    source.independent_origin_group_id,
    "commissioned_work_origin_group_id_invalid",
  );
  requireSafeCodeV01(
    source.evaluator_version,
    "commissioned_work_case_evaluator_version_invalid",
  );
  if (
    source.repository_fixture.length === 0 ||
    source.repository_fixture.length > MAX_REPOSITORY_FILES_V01 ||
    source.required_checks.length === 0 ||
    source.required_checks.length > MAX_REQUIRED_CHECKS_V01 ||
    source.expected_success_writes.length === 0 ||
    source.expected_success_writes.length > MAX_REPOSITORY_FILES_V01 ||
    source.successor_plans.length !== MAX_SUCCESSOR_ARMS_V01 ||
    source.budget.provider_calls_authorized_by_family_manifest !== false ||
    source.budget.external_network_call_limit !== 0 ||
    source.budget.max_changed_files < 1 ||
    source.budget.max_changed_files > MAX_REPOSITORY_FILES_V01 ||
    source.budget.max_checks < source.required_checks.length ||
    source.budget.max_checks > MAX_REQUIRED_CHECKS_V01 ||
    source.budget.max_processes < 1 ||
    source.budget.max_processes > 8
  ) {
    failV01("commissioned_work_case_bound_invalid");
  }
  const scanIssues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    source,
    "$source",
    {
      error: (code) => scanIssues.add(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in commissioned-work source fixtures.",
      provider_specific_field_message:
        "Provider-specific identity is forbidden in commissioned-work source fixtures.",
    },
  );
  walkValueV01(source, (candidate) => {
    if (typeof candidate === "string" && PRIVATE_ABSOLUTE_PATH_V01.test(candidate)) {
      scanIssues.add("private_absolute_path");
    }
  });
  if (scanIssues.size > 0) {
    failV01("commissioned_work_case_source_material_forbidden");
  }
  for (const text of [
    source.task.goal,
    ...source.task.success_criteria,
    ...source.task.non_goals,
  ]) {
    requireBoundedTextV01(text, "commissioned_work_task_text_invalid");
  }
  const allPaths = [
    ...source.repository_fixture.map((item) => item.repository_relative_path),
    ...source.source_drift_writes.map((item) => item.repository_relative_path),
    ...source.predecessor_plan.operation_contract.allowed_repository_relative_paths,
    ...source.successor_plans.flatMap((plan) =>
      plan.operation_contract.allowed_repository_relative_paths,
    ),
    ...source.current_source_relative_paths,
    ...source.required_checks.map((check) => check.oracle_relative_path),
    ...source.expected_success_changed_paths,
    ...source.expected_success_writes.map(
      (write) => write.repository_relative_path,
    ),
    ...source.negative_space_guards.map((guard) => guard.repository_relative_path),
  ];
  allPaths.forEach(requireCanonicalRepositoryPathV01);
  if (
    new Set(source.repository_fixture.map((item) => item.repository_relative_path)).size !==
      source.repository_fixture.length ||
    new Set(source.required_checks.map((check) => check.check_id)).size !==
      source.required_checks.length ||
    new Set(source.expected_success_changed_paths).size !==
      source.expected_success_changed_paths.length ||
    new Set(
      source.expected_success_writes.map(
        (write) => write.repository_relative_path,
      ),
    ).size !== source.expected_success_writes.length
  ) {
    failV01("commissioned_work_case_duplicate_identity");
  }
  const finalSourcePaths = new Set(
    [...source.repository_fixture, ...source.source_drift_writes].map(
      (item) => item.repository_relative_path,
    ),
  );
  if (
    source.current_source_relative_paths.length === 0 ||
    source.current_source_relative_paths.some((item) => !finalSourcePaths.has(item)) ||
    source.required_checks.some((check) => !finalSourcePaths.has(check.oracle_relative_path))
  ) {
    failV01("commissioned_work_current_source_or_oracle_missing");
  }
  for (const check of source.required_checks) {
    requireSafeCodeV01(check.check_id, "commissioned_work_check_id_invalid");
  }
  requireSafeCodeV01(
    source.source_currentness_check_id,
    "commissioned_work_source_currentness_check_id_invalid",
  );
  if (
    !source.required_checks.some(
      (check) => check.check_id === source.source_currentness_check_id,
    ) ||
    canonicalizeProtocolValueV01(
      [...source.expected_success_changed_paths].sort(
        compareProtocolCodeUnitsV01,
      ),
    ) !==
      canonicalizeProtocolValueV01(
        source.expected_success_writes
          .map((write) => write.repository_relative_path)
          .sort(compareProtocolCodeUnitsV01),
      )
  ) {
    failV01("commissioned_work_objective_diff_or_currentness_rubric_invalid");
  }
  for (const guard of source.negative_space_guards) {
    requireSafeCodeV01(guard.guard_id, "commissioned_work_guard_id_invalid");
    requireBoundedTextV01(
      guard.forbidden_fragment,
      "commissioned_work_guard_fragment_invalid",
    );
  }
  const materialIds = new Set<string>();
  for (const material of source.materials) {
    requireSafeCodeV01(material.material_id, "commissioned_work_material_id_invalid");
    requireBoundedTextV01(material.content, "commissioned_work_material_content_invalid");
    if (materialIds.has(material.material_id)) {
      failV01("commissioned_work_material_id_duplicate");
    }
    materialIds.add(material.material_id);
  }
  const commonMaterials = source.materials.filter(
    (material) => material.material_kind === "common_task_evidence",
  );
  if (commonMaterials.length === 0) {
    failV01("commissioned_work_common_evidence_missing");
  }
  const commonTaskText = canonicalizeProtocolValueV01({
    task: source.task,
    common: commonMaterials.map((item) => item.content),
  });
  if (
    [...COMMISSIONED_WORK_CONDITIONS_V01].some((value) =>
      commonTaskText.includes(value),
    ) ||
    [
      "strongest_equal_budget_baseline",
      "candidate_present",
      "candidate_component_ablation",
      "stale_or_reset",
    ].some((value) => commonTaskText.includes(value))
  ) {
    failV01("commissioned_work_condition_common_evidence_leak");
  }
  const executorIds = [
    source.predecessor_plan.executor_role_id,
    ...source.successor_plans.map((plan) => plan.executor_role_id),
  ];
  executorIds.forEach((id) =>
    requireSafeCodeV01(id, "commissioned_work_executor_role_id_invalid"),
  );
  if (new Set(executorIds).size !== executorIds.length) {
    failV01("commissioned_work_cold_executor_identity_reused");
  }
  validateEpisodePlanV01(source, source.predecessor_plan, materialIds);
  source.successor_plans.forEach((plan) =>
    validateEpisodePlanV01(source, plan, materialIds),
  );
  validateTreatmentPlanV01(source);
}

function assertExactCaseSourceShapeV01(
  source: CommissionedWorkCaseSourceV01,
): void {
  const exactKeys = (
    value: unknown,
    expected: readonly string[],
    code: string,
  ): void => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
        canonicalizeProtocolValueV01([...expected].sort())
    ) {
      failV01(code);
    }
  };
  exactKeys(source, [
    "case_id",
    "case_role",
    "project_id",
    "independent_origin_group_id",
    "task",
    "repository_fixture",
    "predecessor_plan",
    "source_drift_writes",
    "successor_plans",
    "current_source_relative_paths",
    "required_checks",
    "source_currentness_check_id",
    "expected_success_changed_paths",
    "expected_success_writes",
    "negative_space_guards",
    "materials",
    "evaluator_version",
    "budget",
  ], "commissioned_work_case_source_schema_invalid");
  exactKeys(source.task, ["goal", "success_criteria", "non_goals"],
    "commissioned_work_case_task_schema_invalid");
  const operationContractKeys = [
    "allowed_operation_categories",
    "allowed_repository_relative_paths",
    "max_changed_files",
    "max_artifacts",
    "max_commands",
    "provider_authority_source",
    "provider_calls_authorized_by_operation_contract",
    "external_network_call_limit",
    "outside_root_write_allowed",
    "github_mutation_allowed",
    "semantic_authority_allowed",
  ] as const;
  const planKeys = ["executor_role_id", "operation_contract"] as const;
  exactKeys(source.predecessor_plan, planKeys,
    "commissioned_work_predecessor_plan_schema_invalid");
  exactKeys(source.predecessor_plan.operation_contract, operationContractKeys,
    "commissioned_work_operation_contract_schema_invalid");
  source.successor_plans.forEach((plan) => {
    exactKeys(plan, [
      "executor_role_id",
      "operation_contract",
      "condition",
      "holdout_variant",
      "candidate_intervention_mode",
      "selected_material_ids",
      "excluded_material_ids",
      "stale_relation_material_id",
      "intervention_provenance_material_id",
    ], "commissioned_work_successor_plan_schema_invalid");
    exactKeys(plan.operation_contract, operationContractKeys,
      "commissioned_work_operation_contract_schema_invalid");
  });
  for (const file of [
    ...source.repository_fixture,
    ...source.source_drift_writes,
    ...source.expected_success_writes,
  ]) {
    exactKeys(file, ["repository_relative_path", "content"],
      "commissioned_work_repository_material_schema_invalid");
  }
  source.required_checks.forEach((check) =>
    exactKeys(check, ["check_id", "oracle_relative_path"],
      "commissioned_work_required_check_schema_invalid"));
  source.negative_space_guards.forEach((guard) =>
    exactKeys(guard, [
      "guard_id",
      "repository_relative_path",
      "forbidden_fragment",
      "guarded_status",
    ], "commissioned_work_negative_space_guard_schema_invalid"));
  source.materials.forEach((material) =>
    exactKeys(material, [
      "material_id",
      "material_kind",
      "lifecycle_status",
      "content",
    ], "commissioned_work_source_material_schema_invalid"));
  exactKeys(source.budget, [
    "max_changed_files",
    "max_checks",
    "max_processes",
    "provider_calls_authorized_by_family_manifest",
    "external_network_call_limit",
  ], "commissioned_work_case_budget_schema_invalid");
}

function validateEpisodePlanV01(
  source: CommissionedWorkCaseSourceV01,
  plan: CommissionedWorkEpisodePlanSourceV01,
  materialIds: Set<string>,
): void {
  const contract = plan.operation_contract;
  if (
    canonicalizeProtocolValueV01(contract.allowed_operation_categories) !==
      canonicalizeProtocolValueV01(["repository_file_edit"]) ||
    contract.allowed_repository_relative_paths.length === 0 ||
    contract.allowed_repository_relative_paths.length > MAX_REPOSITORY_FILES_V01 ||
    new Set(contract.allowed_repository_relative_paths).size !==
      contract.allowed_repository_relative_paths.length ||
    contract.max_changed_files < 1 ||
    contract.max_changed_files >
      contract.allowed_repository_relative_paths.length ||
    contract.max_changed_files > source.budget.max_changed_files ||
    contract.max_artifacts < 0 ||
    contract.max_artifacts > 8 ||
    contract.max_commands < 0 ||
    contract.max_commands > 32 ||
    contract.provider_authority_source !==
      "separate_live_authorization_required" ||
    contract.provider_calls_authorized_by_operation_contract !== false ||
    contract.external_network_call_limit !== 0 ||
    contract.outside_root_write_allowed !== false ||
    contract.github_mutation_allowed !== false ||
    contract.semantic_authority_allowed !== false
  ) {
    failV01("commissioned_work_episode_operation_contract_invalid");
  }
  contract.allowed_repository_relative_paths.forEach(
    requireCanonicalRepositoryPathV01,
  );
  if (isSuccessorPlanV01(plan)) {
    const selected = new Set(plan.selected_material_ids);
    const excluded = new Set(plan.excluded_material_ids);
    if (
      [...selected, ...excluded].some((id) => !materialIds.has(id)) ||
      [...selected].some((id) => excluded.has(id)) ||
      selected.has(plan.intervention_provenance_material_id) ||
      !materialIds.has(plan.intervention_provenance_material_id) ||
      (plan.stale_relation_material_id !== null &&
        !materialIds.has(plan.stale_relation_material_id))
    ) {
      failV01("commissioned_work_treatment_material_binding_invalid");
    }
  }
}

function validateTreatmentPlanV01(source: CommissionedWorkCaseSourceV01): void {
  const materials = new Map(
    source.materials.map((material) => [material.material_id, material] as const),
  );
  const byCondition = new Map(
    source.successor_plans.map((plan) => [plan.condition, plan] as const),
  );
  const zero = byCondition.get("zero_continuation_control");
  const exact = byCondition.get("exact_current_continuity");
  const ablationByCondition = byCondition.get("matched_ablation");
  const staleByCondition = byCondition.get("stale_or_regime_shift_continuity");
  if (
    zero &&
    (zero.selected_material_ids.length !== 0 ||
      zero.stale_relation_material_id !== null)
  ) {
    failV01("commissioned_work_zero_control_continuation_invalid");
  }
  if (
    exact &&
    exact.selected_material_ids.some(
      (id) => materials.get(id)?.material_kind === "stale_relation",
    )
  ) {
    failV01("commissioned_work_exact_current_stale_material_invalid");
  }
  if (exact && ablationByCondition) {
    const exactSelected = new Set(exact.selected_material_ids);
    const ablatedSelected = new Set(ablationByCondition.selected_material_ids);
    const removed = [...exactSelected].filter((id) => !ablatedSelected.has(id));
    if (
      removed.length !== 1 ||
      [...ablatedSelected].some((id) => !exactSelected.has(id))
    ) {
      failV01("commissioned_work_matched_ablation_relation_invalid");
    }
  }
  if (staleByCondition) {
    const staleId = staleByCondition.stale_relation_material_id;
    if (
      staleId === null ||
      !staleByCondition.selected_material_ids.includes(staleId) ||
      materials.get(staleId)?.material_kind !== "stale_relation"
    ) {
      failV01("commissioned_work_stale_relation_binding_invalid");
    }
  }
  const byVariant = new Map<
    CommissionedWorkHoldoutVariantV01,
    CommissionedWorkSuccessorPlanSourceV01
  >();
  if (source.case_role === "training") {
    if (
      source.successor_plans.some(
        (plan) =>
          plan.holdout_variant !== null ||
          plan.candidate_intervention_mode !== "not_applicable",
      ) ||
      new Set(source.successor_plans.map((plan) => plan.condition)).size !== 4 ||
      COMMISSIONED_WORK_CONDITIONS_V01.some(
        (condition) =>
          !source.successor_plans.some((plan) => plan.condition === condition),
      )
    ) {
      failV01("commissioned_work_training_condition_assignment_invalid");
    }
    return;
  }
  for (const plan of source.successor_plans) {
    if (plan.holdout_variant === null || byVariant.has(plan.holdout_variant)) {
      failV01("commissioned_work_holdout_variant_assignment_invalid");
    }
    byVariant.set(plan.holdout_variant, plan);
  }
  const baseline = requireSourceHoldoutPlanV01(
    byVariant,
    "strongest_equal_budget_baseline",
  );
  const present = requireSourceHoldoutPlanV01(byVariant, "candidate_present");
  const ablation = requireSourceHoldoutPlanV01(
    byVariant,
    "candidate_component_ablation",
  );
  const staleReset = requireSourceHoldoutPlanV01(byVariant, "stale_or_reset");
  if (
    baseline.condition !== "exact_current_continuity" ||
    present.condition !== "exact_current_continuity" ||
    ablation.condition !== "exact_current_continuity" ||
    staleReset.condition !== "stale_or_regime_shift_continuity" ||
    baseline.candidate_intervention_mode !== "no_candidate" ||
    present.candidate_intervention_mode !==
      "all_frozen_candidate_components" ||
    ablation.candidate_intervention_mode !==
      "frozen_candidate_minus_last_component" ||
    staleReset.candidate_intervention_mode !== "no_candidate" ||
    canonicalizeProtocolValueV01(baseline.selected_material_ids) !==
      canonicalizeProtocolValueV01(present.selected_material_ids) ||
    canonicalizeProtocolValueV01(baseline.selected_material_ids) !==
      canonicalizeProtocolValueV01(ablation.selected_material_ids) ||
    canonicalizeProtocolValueV01(baseline.excluded_material_ids) !==
      canonicalizeProtocolValueV01(present.excluded_material_ids) ||
    canonicalizeProtocolValueV01(baseline.excluded_material_ids) !==
      canonicalizeProtocolValueV01(ablation.excluded_material_ids)
  ) {
    failV01("commissioned_work_holdout_candidate_intervention_invalid");
  }
}

function assertSourceDistinctCasesV01(
  commitments: CommissionedWorkCaseCommitmentV01[],
): void {
  const identityFields: Array<keyof CommissionedWorkCaseCommitmentV01> = [
    "case_id",
    "project_id",
    "independent_origin_group_id",
    "repository_fixture_fingerprint",
    "task_fingerprint",
    "source_drift_fingerprint",
    "evaluator_rubric_fingerprint",
    "repository_path_set_fingerprint",
    "operation_shape_fingerprint",
  ];
  for (const field of identityFields) {
    if (new Set(commitments.map((commitment) => String(commitment[field]))).size !== 4) {
      failV01(`commissioned_work_case_source_distinction_invalid:${String(field)}`);
    }
  }
}

function expectedCurrentSourceFingerprintV01(
  source: CommissionedWorkCaseSourceV01,
): string {
  const files = new Map(
    source.repository_fixture.map((item) => [item.repository_relative_path, item.content]),
  );
  for (const write of source.source_drift_writes) {
    files.set(write.repository_relative_path, write.content);
  }
  return fingerprintV01(
    [...source.current_source_relative_paths]
      .sort(compareProtocolCodeUnitsV01)
      .map((repository_relative_path) => ({
        repository_relative_path,
        content_fingerprint: fingerprintV01(files.get(repository_relative_path) ?? null),
      })),
  );
}

function repositoryPathSetV01(source: CommissionedWorkCaseSourceV01): string[] {
  return [
    ...new Set([
      ...source.repository_fixture.map((item) => item.repository_relative_path),
      ...source.source_drift_writes.map((item) => item.repository_relative_path),
      ...source.predecessor_plan.operation_contract.allowed_repository_relative_paths,
      ...source.successor_plans.flatMap((plan) =>
        plan.operation_contract.allowed_repository_relative_paths,
      ),
      ...source.current_source_relative_paths,
      ...source.required_checks.map((check) => check.oracle_relative_path),
      ...source.expected_success_changed_paths,
      ...source.negative_space_guards.map((guard) => guard.repository_relative_path),
    ]),
  ].sort(compareProtocolCodeUnitsV01);
}

function operationShapeV01(source: CommissionedWorkCaseSourceV01): unknown {
  return {
    predecessor: source.predecessor_plan.operation_contract,
    drift: source.source_drift_writes.map((write) => ({
      repository_relative_path: write.repository_relative_path,
      content_bytes: Buffer.byteLength(write.content, "utf8"),
    })),
    successors: source.successor_plans.map((plan) => ({
      condition: plan.condition,
      holdout_variant: plan.holdout_variant,
      operation_contract: plan.operation_contract,
    })),
  };
}

function materialRefV01(
  material: CommissionedWorkSourceMaterialV01,
): CommissionedWorkOpaqueMaterialRefV01 {
  return opaqueRefV01({
    material_kind: material.material_kind,
    content: {
      material_kind: material.material_kind,
      lifecycle_status: material.lifecycle_status,
      content: material.content,
    },
    lifecycle_status: material.lifecycle_status,
  });
}

function candidateComponentRefV01(
  componentId: string,
): CommissionedWorkOpaqueMaterialRefV01 {
  if (
    !COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01.includes(
      componentId as never,
    )
  ) {
    failV01("commissioned_work_candidate_component_invalid");
  }
  return opaqueRefV01({
    material_kind: "candidate_component",
    content: componentId,
    lifecycle_status: null,
  });
}

function packetMaterialSetFingerprintV01(packet: TaskContextPacketV01): string {
  return fingerprintV01({
    selected: packet.selected_context
      .map((entry) => ({
        source_ref: entry.source_ref,
        ref_type: entry.external_ref?.ref_type ?? null,
      }))
      .sort(compareCanonicalV01),
    excluded: packet.excluded_context
      .map((entry) => ({
        source_ref: entry.source_ref,
        ref_type: entry.external_ref?.ref_type ?? null,
      }))
      .sort(compareCanonicalV01),
  });
}

export function createCommissionedWorkPacketMaterialSetFingerprintV01(
  packet: TaskContextPacketV01,
): string {
  return packetMaterialSetFingerprintV01(packet);
}

function requireResultFingerprintMetadataV01(
  result: NativeHostResultV01,
  key: string,
): string {
  const value = result.adapter_extension.bounded_metadata[key];
  if (typeof value !== "string" || !FINGERPRINT_V01.test(value)) {
    failV01("commissioned_work_executor_delivery_metadata_invalid");
  }
  return value;
}

function requireResultStringMetadataV01(
  result: NativeHostResultV01,
  key: string,
): string {
  const value = result.adapter_extension.bounded_metadata[key];
  if (typeof value !== "string") {
    failV01("commissioned_work_executor_delivery_metadata_invalid");
  }
  return value;
}

function requireResultCountMetadataV01(
  result: NativeHostResultV01,
  key: string,
): number {
  const value = result.adapter_extension.bounded_metadata[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    failV01("commissioned_work_executor_delivery_metadata_invalid");
  }
  return value;
}

function requireResultBooleanMetadataV01(
  result: NativeHostResultV01,
  key: string,
): boolean {
  const value = result.adapter_extension.bounded_metadata[key];
  if (typeof value !== "boolean") {
    failV01("commissioned_work_executor_delivery_metadata_invalid");
  }
  return value;
}

function zeroUnauthorizedEffectsV01(): CommissionedWorkObjectiveObservationV01["unauthorized_effects"] {
  return {
    provider_calls_outside_authorization: 0,
    model_calls_outside_authorization: 0,
    network_calls_outside_authorization: 0,
    outside_root_writes: 0,
    product_database_writes: 0,
    core_writes: 0,
    proposal_writes: 0,
    review_decision_writes: 0,
    transition_writes: 0,
    policy_activations: 0,
    active_pointer_writes: 0,
    github_writes: 0,
  };
}

function candidatePacketEntryV01(
  candidate: CommissionedWorkConsolidationCandidateV01,
  componentId: string,
  observedAt: string,
): TaskContextPacketV01["selected_context"][number] {
  const componentRef = candidateComponentRefV01(componentId);
  const exactComponent = candidate.minimal_generalized_rule.components.find(
    (component) =>
      component.component_ref.content_fingerprint ===
      componentRef.content_fingerprint,
  );
  if (!exactComponent) {
    failV01("commissioned_work_candidate_component_source_missing");
  }
  const deliveryFingerprint = fingerprintV01({
    candidate_fingerprint: candidate.integrity.fingerprint,
    component_ref: exactComponent.component_ref,
  });
  const externalRef = localRefV01(
    "commissioned_work_frozen_candidate_component",
    `candidate-component:${componentId}`,
    observedAt,
    deliveryFingerprint,
  );
  return {
    entry_id: externalRef.external_id,
    entry_kind: "source_ref",
    source_ref: deliveryFingerprint,
    external_ref: externalRef,
    why_included:
      "Selected from the exact frozen consolidation candidate before holdout execution.",
    currentness: {
      status: "fresh",
      as_of: candidate.frozen_at,
      basis: "Bound to the exact frozen candidate and component fingerprints.",
      source_ref: localRefV01(
        "commissioned_work_frozen_candidate",
        candidate.candidate_id,
        candidate.frozen_at,
        candidate.integrity.fingerprint,
      ),
    },
    trust_class: "direct_local_observation",
    compatibility_source_ref: externalRef,
    bounded_summary: "Opaque frozen procedural component.",
  };
}

function resolveCandidateComponentIdsV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  candidate: CommissionedWorkConsolidationCandidateV01 | null;
  expected_candidate_freeze_fingerprint: string | null;
}): string[] {
  if (input.source.case_role === "training") {
    if (
      input.candidate !== null ||
      input.expected_candidate_freeze_fingerprint !== null
    ) {
      failV01("commissioned_work_training_candidate_binding_invalid");
    }
    return [];
  }
  if (input.candidate === null) {
    failV01("commissioned_work_holdout_candidate_missing");
  }
  validateIntegrityV01(
    input.candidate,
    "commissioned_work_candidate_without_integrity_fingerprint",
    "commissioned_work_candidate_freeze_invalid",
  );
  if (
    input.expected_candidate_freeze_fingerprint === null ||
    input.candidate.integrity.fingerprint !==
      input.expected_candidate_freeze_fingerprint
  ) {
    failV01("commissioned_work_candidate_freeze_anchor_invalid");
  }
  if (
    input.candidate.family_ref.record_fingerprint !==
      input.manifest.integrity.fingerprint ||
    input.candidate.scope.workspace_id !== input.manifest.workspace_id ||
    input.candidate.scope.task_family_key !== input.manifest.task_family_key
  ) {
    failV01("commissioned_work_holdout_candidate_source_binding_invalid");
  }
  if (!isSuccessorPlanV01(input.plan)) return [];
  switch (input.plan.candidate_intervention_mode) {
    case "no_candidate":
      return [];
    case "all_frozen_candidate_components":
      return [...input.candidate.minimal_generalized_rule.ordered_components];
    case "frozen_candidate_minus_last_component":
      return input.candidate.minimal_generalized_rule.ordered_components.slice(0, -1);
    case "not_applicable":
      failV01("commissioned_work_holdout_candidate_mode_invalid");
  }
}

function assertExactPlanMembershipV01(
  source: CommissionedWorkCaseSourceV01,
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01,
): void {
  const candidates = [source.predecessor_plan, ...source.successor_plans];
  const exact = canonicalizeProtocolValueV01(plan);
  if (
    candidates.filter(
      (candidate) => canonicalizeProtocolValueV01(candidate) === exact,
    ).length !== 1
  ) {
    failV01("commissioned_work_episode_plan_not_sealed");
  }
}

function opaqueRefV01(input: {
  material_kind: CommissionedWorkOpaqueMaterialRefV01["material_kind"];
  content: unknown;
  lifecycle_status: CommissionedWorkOpaqueMaterialRefV01["lifecycle_status"];
}): CommissionedWorkOpaqueMaterialRefV01 {
  const contentFingerprint = fingerprintV01(input.content);
  return {
    material_kind: input.material_kind,
    opaque_id: `opaque:${contentFingerprint.slice("sha256:".length, "sha256:".length + 32)}`,
    content_fingerprint: contentFingerprint,
    lifecycle_status: input.lifecycle_status,
  };
}

function requireMaterialV01(
  materials: Map<string, CommissionedWorkSourceMaterialV01>,
  materialId: string,
): CommissionedWorkSourceMaterialV01 {
  const material = materials.get(materialId);
  if (!material) failV01("commissioned_work_material_ref_missing");
  return material;
}

function materialKindIsCommonV01(
  source: CommissionedWorkCaseSourceV01 | CommissionedWorkEpisodePlanSourceV01,
  materialId: string,
): boolean {
  return (
    "materials" in source &&
    source.materials.some(
      (item) =>
        item.material_id === materialId &&
        item.material_kind === "common_task_evidence",
    )
  );
}

function selectedPacketEntryV01(
  material: CommissionedWorkSourceMaterialV01,
  observedAt: string,
): TaskContextPacketV01["selected_context"][number] {
  const ref = materialRefV01(material);
  const externalRef = localRefV01(
    "commissioned_work_opaque_material",
    ref.opaque_id,
    observedAt,
    ref.content_fingerprint,
  );
  return {
    entry_id: ref.opaque_id,
    entry_kind: "source_ref",
    source_ref: ref.content_fingerprint,
    external_ref: externalRef,
    why_included: "Selected by the sealed treatment assignment before execution.",
    currentness: packetCurrentnessV01(material, observedAt, externalRef),
    trust_class: "direct_local_observation",
    compatibility_source_ref: externalRef,
    bounded_summary: `Opaque ${material.lifecycle_status} continuity material.`,
  };
}

function excludedPacketEntryV01(
  material: CommissionedWorkSourceMaterialV01,
  observedAt: string,
): TaskContextPacketV01["excluded_context"][number] {
  const ref = materialRefV01(material);
  const externalRef = localRefV01(
    "commissioned_work_opaque_material",
    ref.opaque_id,
    observedAt,
    ref.content_fingerprint,
  );
  return {
    entry_id: ref.opaque_id,
    source_ref: ref.content_fingerprint,
    external_ref: externalRef,
    why_excluded: "Excluded by the sealed treatment assignment.",
    currentness: packetCurrentnessV01(material, observedAt, externalRef),
  };
}

function packetCurrentnessV01(
  material: CommissionedWorkSourceMaterialV01,
  observedAt: string,
  sourceRef: ExternalRefV01,
): TaskContextPacketV01["selected_context"][number]["currentness"] {
  return {
    status:
      material.lifecycle_status === "current"
        ? "fresh"
        : ["incomplete", "execution_only"].includes(material.lifecycle_status)
          ? "partial"
          : "stale",
    as_of: observedAt,
    basis: "The sealed case source assigns this exact lifecycle classification.",
    source_ref: sourceRef,
  };
}

function createRuntimeRootScopeV01(
  repositoryRootInput: string,
  observedAt: string,
): NativeHostRootScopeV01 {
  if (!path.isAbsolute(repositoryRootInput)) {
    failV01("commissioned_work_runtime_root_must_be_absolute");
  }
  const canonicalRoot = realpathSync(repositoryRootInput);
  const stat = statSync(canonicalRoot);
  if (!stat.isDirectory()) failV01("commissioned_work_runtime_root_not_directory");
  const physicalFingerprint = fingerprintV01({
    canonical_realpath: canonicalRoot,
    device: String(stat.dev),
    inode: String(stat.ino),
  });
  const rootFingerprint = fingerprintV01({
    physical_identity: physicalFingerprint,
    root_kind: "git_repository",
  });
  return {
    canonical_root: canonicalRoot,
    path_flavor: "posix",
    root_kind: "git_repository",
    root_fingerprint: rootFingerprint,
    physical_root_identity: {
      identity_version: "native_host_physical_root_identity.v0.1",
      canonical_realpath_fingerprint: physicalFingerprint,
      device: String(stat.dev),
      inode: String(stat.ino),
    },
    root_scope_ref: localRefV01(
      "project_root_scope",
      rootFingerprint,
      observedAt,
      rootFingerprint,
    ),
    repository_ref: localRefV01(
      "git_repository",
      fingerprintV01(canonicalRoot),
      observedAt,
      rootFingerprint,
    ),
    selected_worktree_ref: null,
  };
}

function packetExternalRefV01(packet: TaskContextPacketV01): ExternalRefV01 {
  return localRefV01(
    "task_context_packet",
    packet.packet_id,
    packet.generated_at,
    packet.integrity.fingerprint,
  );
}

function repositoryArtifactRefV01(
  relativePath: string,
  observedAt: string,
  sourceFingerprint: string | null,
): ExternalRefV01 {
  const canonicalPath = canonicalizeRepositoryRelativePathV01(relativePath);
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "repository_relative_artifact",
    external_id: canonicalPath,
    observed_at: observedAt,
    source_ref: sourceFingerprint ?? fingerprintV01(canonicalPath),
    compatibility_namespace: COMMISSIONED_WORK_EPISODE_VERSION_V01,
    trust_class: "direct_local_observation",
  };
}

function localRefV01(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string | null,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: COMMISSIONED_WORK_FAMILY_VERSION_V01,
    trust_class: "direct_local_observation",
  };
}

function receiptExecutionStatusV01(
  outcome: NativeHostResultV01["outcome"],
): RunReceiptV01["execution"]["status"] {
  switch (outcome) {
    case "completed":
      return "completed";
    case "blocked":
      return "blocked";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "timed_out":
      return "partial";
    case "unavailable":
      return "unknown";
  }
}

function validatePacketResultReceiptObservationBindingV01(
  input: BuildCommissionedWorkEpisodeArtifactInputV01,
): void {
  const packetValidation = validateTaskContextPacketV01(input.packet, {
    evaluated_at: input.packet.generated_at,
  });
  const receiptValidation = validateRunReceiptV01(input.receipt);
  validateIntegrityV01(
    input.observation,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
    "commissioned_work_observation_integrity_invalid",
  );
  const commitment = findCaseCommitmentV01(input.manifest, input.source.case_id);
  if (
    packetValidation.status !== "valid" ||
    receiptValidation.status !== "valid" ||
    input.packet.workspace_id !== input.manifest.workspace_id ||
    input.packet.project_id !== input.source.project_id ||
    input.request.workspace_id !== input.manifest.workspace_id ||
    input.request.project_id !== input.source.project_id ||
    input.request.request_id !== input.result.request_id ||
    input.request.run_id !== input.result.run_id ||
    input.request.task_context_packet_ref.source_ref !==
      input.packet.integrity.fingerprint ||
    input.result.request_id !== `cw1-request:${input.episode_id}` ||
    input.receipt.run_id !== input.result.run_id ||
    input.receipt.task_context_packet_ref?.external_id !== input.packet.packet_id ||
    input.receipt.task_context_packet_ref.source_ref !==
      input.packet.integrity.fingerprint ||
    input.observation.workspace_id !== input.manifest.workspace_id ||
    input.observation.project_id !== input.source.project_id ||
    input.observation.case_id !== input.source.case_id ||
    input.observation.evaluator_version !== input.manifest.evaluator_version ||
    input.observation.evaluator_role.role_fingerprint !==
      input.manifest.outcome_evaluator.role_fingerprint ||
    input.observation.run_ref_fingerprint !== fingerprintV01(input.result.run_id) ||
    input.observation.current_source_fingerprint !==
      (input.episode_role === "predecessor"
        ? commitment.initial_source_fingerprint
        : commitment.expected_current_source_fingerprint)
  ) {
    failV01("commissioned_work_episode_exact_source_binding_invalid");
  }
  const expectedCheckIds = [...commitment.required_check_ids].sort(
    compareProtocolCodeUnitsV01,
  );
  const observedCheckIds = input.observation.required_checks
    .map((check) => check.check_id)
    .sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(expectedCheckIds) !==
    canonicalizeProtocolValueV01(observedCheckIds)
  ) {
    failV01("commissioned_work_episode_evaluator_rubric_binding_invalid");
  }
  if (
    input.observation.source_currentness !==
    deriveObjectiveSourceCurrentnessV01({
      episode_role: input.episode_role,
      source_currentness_check_id: commitment.source_currentness_check_id,
      required_checks: input.observation.required_checks,
    })
  ) {
    failV01("commissioned_work_observation_source_currentness_relation_invalid");
  }
  if (
    canonicalizeProtocolValueV01(
      input.observation.negative_space.guard_observations
        .map((guard) => guard.guard_ref)
        .sort(compareCanonicalV01),
    ) !==
    canonicalizeProtocolValueV01(
      [...commitment.negative_space_guard_refs].sort(compareCanonicalV01),
    )
  ) {
    failV01("commissioned_work_episode_negative_space_binding_invalid");
  }
  validateRepositoryStateV01(input.repository_state);
}

function deriveObjectiveSourceCurrentnessV01(input: {
  episode_role: CommissionedWorkEpisodeRoleV01;
  source_currentness_check_id: string;
  required_checks: CommissionedWorkObjectiveObservationV01["required_checks"];
}): CommissionedWorkObjectiveObservationV01["source_currentness"] {
  const sourceCurrentnessCheck = input.required_checks.find(
    (check) => check.check_id === input.source_currentness_check_id,
  );
  if (!sourceCurrentnessCheck) {
    failV01("commissioned_work_observation_source_currentness_check_missing");
  }
  if (input.episode_role === "predecessor") return "unknown";
  if (sourceCurrentnessCheck.disposition === "passed") return "current";
  if (sourceCurrentnessCheck.disposition === "failed") return "failed";
  return "unknown";
}

function evaluationVectorV01(input: {
  result: NativeHostResultV01;
  observation: CommissionedWorkObjectiveObservationV01;
  execution_observation: CommissionedWorkExecutionObservationV01;
  executor_role: CommissionedWorkRoleRefV01;
  model_identity: CommissionedWorkEvaluationVectorV01["model_identity"];
  synthetic_cross_condition_output_difference:
    | "observed"
    | "not_observed"
    | "unknown";
  harmful_transfer: "observed" | "not_observed" | "unknown";
}): CommissionedWorkEvaluationVectorV01 {
  const hardFailures = new Set<CommissionedWorkHardFailureCodeV01>();
  if (!input.observation.oracle_executed) {
    hardFailures.add("objective_oracle_missing");
  }
  if (
    input.observation.oracle_executed &&
    input.observation.required_checks.some((check) => check.disposition === "failed")
  ) {
    hardFailures.add("objective_oracle_failed");
  }
  if (input.observation.required_checks.some((check) => check.disposition === "failed")) {
    hardFailures.add("required_check_failed");
  }
  if (
    input.observation.required_checks.some(
      (check) => check.disposition === "skipped" || check.disposition === "unknown",
    )
  ) {
    hardFailures.add("required_check_not_performed");
  }
  if (input.observation.repository_diff_correctness === "failed") {
    hardFailures.add("repository_diff_incorrect");
  }
  if (input.observation.negative_space.status === "revived") {
    hardFailures.add("negative_space_revived");
  }
  if (input.observation.source_currentness === "failed") {
    hardFailures.add("source_currentness_mismatch");
  }
  if (input.observation.project_scope === "violated") {
    hardFailures.add("project_scope_violation");
  }
  if (
    Object.values(input.observation.unauthorized_effects).some(
      (value) => value !== 0,
    ) ||
    Object.values(input.execution_observation.unauthorized_effects).some(
      (value) => value !== 0,
    )
  ) {
    hardFailures.add("authority_expansion");
  }
  if (input.result.outcome === "failed") hardFailures.add("native_host_failed");
  if (input.result.outcome === "cancelled" || input.result.outcome === "timed_out") {
    hardFailures.add("native_host_cancelled");
  }
  if (input.result.outcome === "unavailable") {
    hardFailures.add("native_host_unavailable");
  }
  const success =
    input.result.outcome === "completed" &&
    input.observation.oracle_executed &&
    input.observation.required_checks.length > 0 &&
    input.observation.required_checks.every((check) => check.disposition === "passed") &&
    input.observation.repository_diff_correctness === "passed" &&
    input.observation.verification_completeness === "complete" &&
    input.observation.negative_space.status === "preserved" &&
    input.observation.source_currentness === "current" &&
    input.observation.project_scope === "exact" &&
    hardFailures.size === 0;
  const completionAttestation =
    input.execution_observation.executor_completion_attestation;
  return {
    deterministic_repository_task_success: success,
    required_check_dispositions: input.observation.required_checks,
    repository_diff_correctness: input.observation.repository_diff_correctness,
    verification_completeness: input.observation.verification_completeness,
    false_success_behavior:
      completionAttestation.claimed_complete === null
        ? "unknown"
        : completionAttestation.claimed_complete && !success
          ? "observed"
          : "not_observed",
    negative_space_status: input.observation.negative_space.status,
    first_material_repository_action: {
      action_kind: input.execution_observation.first_material_action.action_kind,
      repository_path_fingerprint:
        input.execution_observation.first_material_action
          .repository_path_fingerprint,
    },
    synthetic_cross_condition_output_difference:
      input.synthetic_cross_condition_output_difference,
    harmful_transfer: input.harmful_transfer,
    source_currentness_failure:
      input.observation.source_currentness === "unknown"
        ? null
        : input.observation.source_currentness === "failed",
    authority_violation:
      Object.values(input.observation.unauthorized_effects).some(
        (value) => value !== 0,
      ) ||
      Object.values(input.execution_observation.unauthorized_effects).some(
        (value) => value !== 0,
      ),
    project_scope_violation:
      input.observation.project_scope === "unknown"
        ? null
        : input.observation.project_scope === "violated",
    executor_role: input.executor_role,
    host_ref_set_fingerprint:
      input.execution_observation.host_ref_set_fingerprint,
    model_identity: input.model_identity,
    resources: input.execution_observation.resources,
    hard_failures: [...hardFailures].sort(compareProtocolCodeUnitsV01),
    hard_failures_non_compensable: true,
    scalar_fitness_created: false,
  };
}

function episodeEvidenceLadderV01(input: {
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  selected_count: number;
  packet_presentation_status: CommissionedWorkExecutionObservationV01["packet_presentation"]["status"];
  packet_ref: CommissionedWorkRecordRefV01;
  observation_ref: CommissionedWorkRecordRefV01;
}): CommissionedWorkEvidenceLadderRowV01[] {
  const continuationApplicable = input.episode_role === "successor";
  const continuationAvailable =
    continuationApplicable && input.condition !== "zero_continuation_control";
  const directRefs = [input.packet_ref];
  const outcomeRefs = [input.observation_ref];
  return [
    ladderRowV01(
      "available",
      !continuationApplicable
        ? "not_applicable"
        : continuationAvailable
          ? "established"
          : "not_established",
      !continuationApplicable
        ? "not_applicable"
        : continuationAvailable
          ? "exact_packet_delivery"
          : "explicit_absence",
      directRefs,
    ),
    ladderRowV01(
      "selected",
      !continuationApplicable
        ? "not_applicable"
        : input.selected_count > 0
          ? "established"
          : "not_established",
      !continuationApplicable
        ? "not_applicable"
        : input.selected_count > 0
          ? "exact_packet_delivery"
          : "explicit_absence",
      directRefs,
    ),
    ladderRowV01(
      "presented_before_first_meaningful_action",
      !continuationApplicable
        ? "not_applicable"
        : input.selected_count === 0
          ? "not_established"
          : input.packet_presentation_status ===
              "presented_before_first_meaningful_action"
          ? "established"
          : "unknown",
      !continuationApplicable
        ? "not_applicable"
        : input.selected_count === 0
          ? "explicit_absence"
          : input.packet_presentation_status ===
              "presented_before_first_meaningful_action"
          ? "exact_packet_delivery"
          : "instrumentation_unavailable",
      directRefs,
    ),
    ladderRowV01(
      "referenced",
      !continuationApplicable
        ? "not_applicable"
        : input.selected_count === 0
          ? "not_established"
          : "unknown",
      !continuationApplicable
        ? "not_applicable"
        : input.selected_count === 0
          ? "explicit_absence"
          : "instrumentation_unavailable",
      directRefs,
    ),
    ladderRowV01(
      "behaviorally_conditioned",
      continuationApplicable ? "unknown" : "not_applicable",
      continuationApplicable ? "instrumentation_unavailable" : "not_applicable",
      outcomeRefs,
    ),
    ladderRowV01(
      "support_validated",
      continuationApplicable ? "unknown" : "not_applicable",
      continuationApplicable ? "instrumentation_unavailable" : "not_applicable",
      outcomeRefs,
    ),
    ladderRowV01(
      "outcome_associated",
      continuationApplicable ? "unknown" : "not_applicable",
      continuationApplicable ? "instrumentation_unavailable" : "not_applicable",
      outcomeRefs,
    ),
    ladderRowV01(
      "intervention_sensitive",
      continuationApplicable ? "unknown" : "not_applicable",
      continuationApplicable ? "instrumentation_unavailable" : "not_applicable",
      outcomeRefs,
    ),
    ladderRowV01(
      "repeatable",
      continuationApplicable ? "unknown" : "not_applicable",
      continuationApplicable ? "instrumentation_unavailable" : "not_applicable",
      outcomeRefs,
    ),
    ladderRowV01(
      "held_out_transfer",
      continuationApplicable ? "unknown" : "not_applicable",
      continuationApplicable ? "instrumentation_unavailable" : "not_applicable",
      outcomeRefs,
    ),
  ];
}

function familyEvidenceLadderV01(input: {
  family: CommissionedWorkFamilyManifestV01;
  training: CommissionedWorkTrainingResultV01;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01;
  holdout: CommissionedWorkHoldoutEvaluationV01;
}): CommissionedWorkEvidenceLadderRowV01[] {
  const familyRef = familyRefV01(input.family);
  const exactEpisodeRefs = input.training.successor_episodes
    .filter((episode) => episode.condition === "exact_current_continuity")
    .map(episodeRefV01);
  const candidateRef = candidateRefV01(input.consolidation_candidate);
  const holdoutRef = createCommissionedWorkRecordRefV01({
    record_version: input.holdout.holdout_version,
    record_id: input.holdout.holdout_id,
    record_fingerprint: input.holdout.integrity.fingerprint,
  });
  const exactEpisodes = input.training.successor_episodes.filter(
    (episode) => episode.condition === "exact_current_continuity",
  );
  const stageEstablished = (
    episode: CommissionedWorkEpisodeArtifactV01,
    stage: CommissionedWorkEvidenceLadderRowV01["stage"],
  ) =>
    episode.evidence_ladder.find((row) => row.stage === stage)?.status ===
    "established";
  const availableEstablished = exactEpisodes.some(
    (episode) =>
      (episode.execution_binding.continuation_materials_delivered ?? 0) > 0,
  );
  const selectedEstablished = exactEpisodes.every((episode) =>
    stageEstablished(episode, "selected"),
  );
  const presentedEstablished = exactEpisodes.every((episode) =>
    stageEstablished(episode, "presented_before_first_meaningful_action"),
  );
  return [
    ladderRowV01(
      "available",
      availableEstablished ? "established" : "not_established",
      availableEstablished ? "exact_packet_delivery" : "explicit_absence",
      [familyRef],
    ),
    ladderRowV01(
      "selected",
      selectedEstablished ? "established" : "not_established",
      selectedEstablished ? "exact_packet_delivery" : "explicit_absence",
      exactEpisodeRefs,
    ),
    ladderRowV01(
      "presented_before_first_meaningful_action",
      presentedEstablished ? "established" : "not_established",
      presentedEstablished ? "exact_packet_delivery" : "instrumentation_unavailable",
      exactEpisodeRefs,
    ),
    ladderRowV01(
      "referenced",
      "unknown",
      "instrumentation_unavailable",
      exactEpisodeRefs,
    ),
    ladderRowV01(
      "behaviorally_conditioned",
      "unknown",
      "instrumentation_unavailable",
      exactEpisodeRefs,
    ),
    ladderRowV01(
      "support_validated",
      "unknown",
      "instrumentation_unavailable",
      [candidateRef],
    ),
    ladderRowV01(
      "outcome_associated",
      "unknown",
      "instrumentation_unavailable",
      exactEpisodeRefs,
    ),
    ladderRowV01(
      "intervention_sensitive",
      "unknown",
      "instrumentation_unavailable",
      [holdoutRef],
    ),
    ladderRowV01(
      "repeatable",
      "unknown",
      "instrumentation_unavailable",
      [candidateRef],
    ),
    ladderRowV01(
      "held_out_transfer",
      "not_established",
      "instrumentation_unavailable",
      [holdoutRef],
    ),
  ];
}

function ladderRowV01(
  stage: CommissionedWorkEvidenceLadderRowV01["stage"],
  status: CommissionedWorkEvidenceLadderRowV01["status"],
  basis: CommissionedWorkEvidenceLadderRowV01["basis"],
  sourceRefs: CommissionedWorkRecordRefV01[],
): CommissionedWorkEvidenceLadderRowV01 {
  return {
    stage,
    status,
    basis,
    source_refs: uniqueRecordRefsV01(sourceRefs),
  };
}

function componentSourcesV01(
  exactEpisodesInput: CommissionedWorkEpisodeArtifactV01[],
  contrastingEpisodes: CommissionedWorkEpisodeArtifactV01[],
  predecessorEpisodes: CommissionedWorkEpisodeArtifactV01[],
): CommissionedWorkConsolidationCandidateV01["minimal_generalized_rule"]["components"] {
  const exactEpisodes = [...exactEpisodesInput].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.case_id, right.case_id),
  );
  const selections: Array<{
    component: (typeof COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01)[number];
    opposing_codes: CommissionedWorkHardFailureCodeV01[];
    sources: CommissionedWorkEpisodeArtifactV01[];
  }> = [
    {
      component: "reobserve_current_source_before_action",
      opposing_codes: ["source_currentness_mismatch"],
      sources: exactEpisodes.filter(
        (exact) =>
          exact.evaluation.deterministic_repository_task_success &&
          contrastingEpisodes.some(
            (contrast) =>
              contrast.case_id === exact.case_id &&
              contrast.evaluation.hard_failures.includes(
                "source_currentness_mismatch",
              ),
          ),
      ),
    },
    {
      component: "preserve_negative_status_without_new_support",
      opposing_codes: ["negative_space_revived"],
      sources: exactEpisodes.filter(
        (exact) =>
          exact.evaluation.negative_space_status === "preserved" &&
          contrastingEpisodes.some(
            (contrast) =>
              contrast.case_id === exact.case_id &&
              contrast.evaluation.negative_space_status === "revived",
          ),
      ),
    },
    {
      component: "separate_execution_completion_from_verified_success",
      opposing_codes: [
        "required_check_failed",
        "required_check_not_performed",
        "objective_oracle_failed",
      ],
      sources: exactEpisodes.filter((exact) => {
        const predecessor = predecessorEpisodes.find(
          (episode) => episode.case_id === exact.case_id,
        );
        return (
          predecessor?.executor_completion_attestation.claimed_complete === true &&
          predecessor.evaluation.verification_completeness === "incomplete" &&
          predecessor.evaluation.false_success_behavior === "observed" &&
          exact.evaluation.deterministic_repository_task_success &&
          exact.evaluation.verification_completeness === "complete"
        );
      }),
    },
  ];
  return selections.map((selection) => {
    const sources = selection.sources;
    if (sources.length === 0) {
      failV01("commissioned_work_component_mechanics_source_missing");
    }
    const verificationPredecessors =
      selection.component ===
      "separate_execution_completion_from_verified_success"
        ? predecessorEpisodes.filter((predecessor) =>
            sources.some((source) => source.case_id === predecessor.case_id),
          )
        : [];
    const allSources = [...verificationPredecessors, ...sources];
    return {
      component_ref: candidateComponentRefV01(selection.component),
      source_episode_refs: allSources.map(episodeRefV01),
      source_evaluation_refs: allSources.map(
        (episode) => episode.objective_observation_ref,
      ),
      independent_origin_group_ids: [
        ...new Set(
          sources.map((episode) => episode.independent_origin_group_id),
        ),
      ]
        .sort(compareProtocolCodeUnitsV01),
      independent_support_established: false as const,
      synthetic_contrast_episode_refs: contrastingEpisodes
        .filter(
          (episode) =>
            sources.some((source) => source.case_id === episode.case_id) &&
            episode.evaluation.hard_failures.some((code) =>
              selection.opposing_codes.includes(code),
            ),
        )
        .map(episodeRefV01)
        .sort(compareCanonicalV01),
      whole_bundle_credit_applied: false,
    };
  });
}

function holdoutComparisonV01(
  left: CommissionedWorkEpisodeArtifactV01,
  right: CommissionedWorkEpisodeArtifactV01,
): CommissionedWorkHoldoutEvaluationV01["comparisons"][number] {
  if (left.holdout_variant === null || right.holdout_variant === null) {
    failV01("commissioned_work_holdout_comparison_variant_missing");
  }
  const relation = holdoutRelationV01(left, right);
  return {
    comparison_id: `comparison:${left.holdout_variant}:to:${right.holdout_variant}`,
    left_variant: left.holdout_variant,
    right_variant: right.holdout_variant,
    relation,
    objective_basis_only: true,
    synthetic_output_distinct:
      left.repository_action_trace_fingerprint ===
      right.repository_action_trace_fingerprint
        ? false
        : true,
    behavioral_distinction_is_benefit: false,
    hard_failure_non_compensation_applied:
      left.evaluation.hard_failures.length > 0 ||
      right.evaluation.hard_failures.length > 0,
    execution_evidence_class:
      COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
  };
}

function holdoutRelationV01(
  left: CommissionedWorkEpisodeArtifactV01,
  right: CommissionedWorkEpisodeArtifactV01,
): CommissionedWorkHoldoutRelationV01 {
  const leftUnknown =
    !left.evaluation.required_check_dispositions.length ||
    left.evaluation.verification_completeness === "unknown" ||
    left.evaluation.required_check_dispositions.some(
      (check) => check.disposition === "unknown" || check.disposition === "skipped",
    );
  const rightUnknown =
    !right.evaluation.required_check_dispositions.length ||
    right.evaluation.verification_completeness === "unknown" ||
    right.evaluation.required_check_dispositions.some(
      (check) => check.disposition === "unknown" || check.disposition === "skipped",
    );
  if (leftUnknown || rightUnknown) return "incomplete";
  if (
    left.common_evidence_fingerprint !== right.common_evidence_fingerprint ||
    canonicalizeProtocolValueV01(left.evaluation.resources) !==
      canonicalizeProtocolValueV01(right.evaluation.resources)
  ) {
    return "non_comparable";
  }
  const leftHard = left.evaluation.hard_failures.length > 0;
  const rightHard = right.evaluation.hard_failures.length > 0;
  if (leftHard && !rightHard) return "improved";
  if (!leftHard && rightHard) return "harmed";
  if (
    left.evaluation.deterministic_repository_task_success ===
      right.evaluation.deterministic_repository_task_success &&
    canonicalizeProtocolValueV01(left.evaluation.hard_failures) ===
      canonicalizeProtocolValueV01(right.evaluation.hard_failures)
  ) {
    return "equal";
  }
  return "non_comparable";
}

function requireHoldoutVariantV01(
  variants: Map<
    CommissionedWorkHoldoutVariantV01,
    CommissionedWorkEpisodeArtifactV01
  >,
  variant: CommissionedWorkHoldoutVariantV01,
): CommissionedWorkEpisodeArtifactV01 {
  const episode = variants.get(variant);
  if (!episode) failV01("commissioned_work_holdout_variant_missing");
  return episode;
}

function requireSourceHoldoutPlanV01(
  variants: Map<
    CommissionedWorkHoldoutVariantV01,
    CommissionedWorkSuccessorPlanSourceV01
  >,
  variant: CommissionedWorkHoldoutVariantV01,
): CommissionedWorkSuccessorPlanSourceV01 {
  const plan = variants.get(variant);
  if (!plan) failV01("commissioned_work_holdout_variant_missing");
  return plan;
}

function familyRefV01(
  manifest: CommissionedWorkFamilyManifestV01,
): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: manifest.family_version,
    record_id: manifest.family_id,
    record_fingerprint: manifest.integrity.fingerprint,
  });
}

function episodeRefV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: episode.episode_version,
    record_id: episode.episode_id,
    record_fingerprint: episode.integrity.fingerprint,
  });
}

function candidateRefV01(
  candidate: CommissionedWorkConsolidationCandidateV01,
): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: candidate.candidate_version,
    record_id: candidate.candidate_id,
    record_fingerprint: candidate.integrity.fingerprint,
  });
}

function uniqueRecordRefsV01(
  refs: CommissionedWorkRecordRefV01[],
): CommissionedWorkRecordRefV01[] {
  const byFingerprint = new Map<string, CommissionedWorkRecordRefV01>();
  for (const ref of refs) {
    const key = canonicalizeProtocolValueV01(ref);
    if (!byFingerprint.has(key)) byFingerprint.set(key, ref);
  }
  return [...byFingerprint.values()].sort(compareCanonicalV01);
}

function findCaseCommitmentV01(
  manifest: CommissionedWorkFamilyManifestV01,
  caseId: string,
): CommissionedWorkCaseCommitmentV01 {
  const matches = [...manifest.training_cases, manifest.holdout_case].filter(
    (commitment) => commitment.case_id === caseId,
  );
  if (matches.length !== 1) failV01("commissioned_work_case_commitment_missing");
  return matches[0]!;
}

function isSuccessorPlanV01(
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01,
): plan is CommissionedWorkSuccessorPlanSourceV01 {
  return "condition" in plan;
}

function validateEpisodeOriginV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): void {
  const origin = episode.episode_origin;
  requireFingerprintV01(
    origin.origin_run_ref_fingerprint,
    "commissioned_work_episode_origin_run_invalid",
  );
  requireTimestampV01(
    origin.origin_started_at,
    "commissioned_work_episode_origin_start_invalid",
  );
  createCommissionedWorkRecordRefV01(origin.origin_proof_ref);
  if (origin.fresh_origin_source_ref !== null) {
    createCommissionedWorkRecordRefV01(origin.fresh_origin_source_ref);
  }
  if (
    origin.origin_run_ref_fingerprint !==
      episode.execution_binding.run_ref_fingerprint ||
    canonicalizeProtocolValueV01(origin.origin_executor_role_ref) !==
      canonicalizeProtocolValueV01(episode.evaluation.executor_role) ||
    canonicalizeProtocolValueV01(origin.origin_executor_role_ref) !==
      canonicalizeProtocolValueV01(
        createCommissionedWorkRoleRefV01(
          "executor",
          origin.origin_executor_role_ref.role_id,
        ),
      ) ||
    Date.parse(origin.origin_started_at) >
      Date.parse(episode.chronology.started_at) ||
    episode.execution_binding.predecessor_run_reused !== false ||
    episode.execution_binding.predecessor_execution_grant_inherited !== false
  ) {
    failV01("commissioned_work_episode_origin_invalid");
  }
  if (origin.origin_kind === "predecessor_episode") {
    if (
      episode.episode_role !== "predecessor" ||
      episode.predecessor_episode_ref !== null ||
      episode.episode_checkpoint_ref !== null ||
      episode.execution_binding.new_run_for_cold_episode !== false ||
      origin.predecessor_episode_ref !== null ||
      origin.predecessor_checkpoint_ref !== null ||
      origin.predecessor_run_ref_fingerprint !== null ||
      origin.predecessor_executor_role_ref !== null ||
      origin.checkpoint_sealed_at !== null
    ) {
      failV01("commissioned_work_episode_origin_invalid");
    }
  } else {
    createCommissionedWorkRecordRefV01(origin.predecessor_episode_ref);
    createCommissionedWorkRecordRefV01(origin.predecessor_checkpoint_ref);
    requireFingerprintV01(
      origin.predecessor_run_ref_fingerprint,
      "commissioned_work_episode_origin_predecessor_run_invalid",
    );
    requireTimestampV01(
      origin.checkpoint_sealed_at,
      "commissioned_work_episode_origin_checkpoint_time_invalid",
    );
    if (
      episode.episode_role !== "successor" ||
      episode.execution_binding.new_run_for_cold_episode !== true ||
      canonicalizeProtocolValueV01(origin.predecessor_episode_ref) !==
        canonicalizeProtocolValueV01(episode.predecessor_episode_ref) ||
      canonicalizeProtocolValueV01(origin.predecessor_checkpoint_ref) !==
        canonicalizeProtocolValueV01(episode.episode_checkpoint_ref) ||
      origin.predecessor_run_ref_fingerprint ===
        origin.origin_run_ref_fingerprint ||
      origin.predecessor_executor_role_ref.role_fingerprint ===
        origin.origin_executor_role_ref.role_fingerprint ||
      Date.parse(origin.checkpoint_sealed_at) >
        Date.parse(origin.origin_started_at)
    ) {
      failV01("commissioned_work_episode_origin_invalid");
    }
  }
  const sameRunResume =
    episode.execution_binding.binding_kind === "commissioned_agent" &&
    episode.execution_binding.host_identity_provenance.provenance_kind ===
      "same_run_resume";
  if (origin.origin_proof_kind === "current_invocation") {
    if (
      sameRunResume ||
      episode.episode_origin_source_chain !== null ||
      origin.fresh_origin_source_ref !== null ||
      origin.admitted_resume_source_ref !== null ||
      origin.origin_started_at !== episode.chronology.started_at ||
      canonicalizeProtocolValueV01(origin.origin_proof_ref) !==
        canonicalizeProtocolValueV01(episode.native_host_result_ref)
    ) {
      failV01("commissioned_work_episode_origin_proof_binding_invalid");
    }
    return;
  }
  const sourceChain = episode.episode_origin_source_chain;
  if (
    !sameRunResume ||
    sourceChain === null ||
    origin.origin_proof_ref.record_version !==
      COMMISSIONED_WORK_EPISODE_ORIGIN_PROOF_VERSION_V01 ||
    origin.fresh_origin_source_ref === null ||
    origin.fresh_origin_source_ref.record_version !==
      COMMISSIONED_WORK_FRESH_ORIGIN_OBSERVATION_VERSION_V01 ||
    origin.admitted_resume_source_ref === null ||
    origin.admitted_resume_source_ref.record_version !==
      COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01 ||
    canonicalizeProtocolValueV01(origin.admitted_resume_source_ref) !==
      canonicalizeProtocolValueV01(
        episode.execution_binding.binding_kind === "commissioned_agent"
          ? episode.execution_binding.host_identity_provenance.resume_source_ref
          : null,
      )
  ) {
    failV01("commissioned_work_episode_origin_proof_binding_invalid");
  }
  validateEpisodeOriginSourceChainV01(sourceChain);
  const observation = sourceChain.fresh_origin_observation;
  const proof = sourceChain.origin_proof;
  const resumeSource = sourceChain.resume_source;
  if (
    canonicalizeProtocolValueV01(origin.origin_proof_ref) !==
      canonicalizeProtocolValueV01(episodeOriginProofRefV01(proof)) ||
    canonicalizeProtocolValueV01(origin.fresh_origin_source_ref) !==
      canonicalizeProtocolValueV01(freshOriginObservationRefV01(observation)) ||
    canonicalizeProtocolValueV01(origin.admitted_resume_source_ref) !==
      canonicalizeProtocolValueV01(resumeSourceRefV01(resumeSource)) ||
    origin.origin_run_ref_fingerprint !== proof.origin_run_ref_fingerprint ||
    origin.origin_started_at !== observation.lifecycle_binding.observed_at ||
    resumeSource.native_host_request_fingerprint !==
      episode.execution_binding.native_host_request_fingerprint ||
    resumeSource.request_id !== episode.execution_binding.request_id ||
    resumeSource.run_ref_fingerprint !==
      episode.execution_binding.run_ref_fingerprint ||
    canonicalizeProtocolValueV01(
      observation.request_binding.task_context_packet_ref,
    ) !== canonicalizeProtocolValueV01(episode.task_context_packet_ref)
  ) {
    failV01("commissioned_work_episode_origin_source_chain_binding_invalid");
  }
}

function validateEpisodeIntegrityV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): void {
  validateIntegrityV01(
    episode,
    "commissioned_work_episode_without_integrity_fingerprint",
    "commissioned_work_episode_integrity_invalid",
  );
  validateEpisodeOriginV01(episode);
  if (
    canonicalizeProtocolValueV01(episode.authority_summary) !==
      canonicalizeProtocolValueV01(createCommissionedWorkAuthoritySummaryV01()) ||
    canonicalizeProtocolValueV01(episode.material_boundary) !==
      canonicalizeProtocolValueV01(createCommissionedWorkMaterialBoundaryV01()) ||
    episode.execution_binding.product_execution_grant_created !== false ||
    episode.execution_binding.predecessor_execution_grant_inherited !== false ||
    episode.execution_binding.predecessor_transcript_inherited !== false ||
    episode.execution_binding.hidden_reasoning_inherited !== false ||
    episode.execution_binding.solution_write_plan_checked_during_result_admission !==
      false ||
    episode.evaluation.scalar_fitness_created !== false ||
    episode.evaluation.hard_failures_non_compensable !== true
  ) {
    failV01("commissioned_work_episode_authority_or_cold_boundary_invalid");
  }
  requireFingerprintV01(
    episode.execution_binding.run_ref_fingerprint,
    "commissioned_work_episode_run_fingerprint_invalid",
  );
  requireFingerprintV01(
    episode.execution_binding.native_host_request_fingerprint,
    "commissioned_work_episode_request_fingerprint_invalid",
  );
  requireFingerprintV01(
    episode.execution_binding.native_host_result_fingerprint,
    "commissioned_work_episode_result_fingerprint_invalid",
  );
  requireFingerprintV01(
    episode.execution_binding.execution_observation_ref.record_fingerprint,
    "commissioned_work_episode_execution_observation_fingerprint_invalid",
  );
  requireFingerprintV01(
    episode.execution_binding.host_ref_set_fingerprint,
    "commissioned_work_episode_host_ref_set_fingerprint_invalid",
  );
  if (
    episode.execution_binding.host_ref_set.length > 4 ||
    new Set(
      episode.execution_binding.host_ref_set.map((binding) => binding.ref_type),
    ).size !== episode.execution_binding.host_ref_set.length ||
    canonicalizeProtocolValueV01(episode.execution_binding.host_ref_set) !==
      canonicalizeProtocolValueV01(
        [...episode.execution_binding.host_ref_set].sort(compareCanonicalV01),
      ) ||
    fingerprintV01(episode.execution_binding.host_ref_set) !==
      episode.execution_binding.host_ref_set_fingerprint
  ) {
    failV01("commissioned_work_episode_host_ref_set_invalid");
  }
  episode.execution_binding.host_ref_set.forEach((binding) =>
    requireFingerprintV01(
      binding.exact_ref_fingerprint,
      "commissioned_work_episode_host_ref_fingerprint_invalid",
    ),
  );
  if (episode.episode_checkpoint_ref !== null) {
    requireFingerprintV01(
      episode.episode_checkpoint_ref.record_fingerprint,
      "commissioned_work_episode_checkpoint_fingerprint_invalid",
    );
  }
  validateResourceVectorV01(episode.evaluation.resources);
  if (episode.execution_binding.binding_kind === "synthetic_fixture") {
    if (
      episode.execution_binding.execution_evidence_class !==
        COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01 ||
      episode.execution_binding.execution_mode !==
        "zero_provider_synthetic_fixture_adapter" ||
      episode.execution_binding.fixture_admission_reused !== false ||
      episode.execution_binding.synthetic_fixture_output_applied !== true ||
      episode.execution_binding.host_ref_set.length !== 1 ||
      episode.execution_binding.host_ref_set[0]?.ref_type !==
        "commissioned_workbench_fixture_host" ||
      episode.evaluation.model_identity.provenance !== "unknown" ||
      episode.evaluation.model_identity.provider_ref !== null ||
      episode.evaluation.model_identity.model_ref !== null ||
      episode.evaluation.model_identity.route_ref !== null ||
      !resourceLaneIsObservedZeroV01(
        episode.evaluation.resources.provider_calls,
      ) ||
      !resourceLaneIsObservedZeroV01(episode.evaluation.resources.model_calls) ||
      !resourceLaneIsObservedZeroV01(
        episode.evaluation.resources.external_network_calls,
      )
    ) {
      failV01("commissioned_work_synthetic_episode_binding_invalid");
    }
    requireFingerprintV01(
      episode.execution_binding.disposable_fixture_admission_fingerprint,
      "commissioned_work_fixture_admission_fingerprint_invalid",
    );
    requireFingerprintV01(
      episode.execution_binding.synthetic_fixture_binding_fingerprint,
      "commissioned_work_synthetic_fixture_binding_fingerprint_invalid",
    );
    requireFingerprintV01(
      episode.execution_binding.synthetic_fixture_output_fingerprint,
      "commissioned_work_synthetic_fixture_output_fingerprint_invalid",
    );
    return;
  }
  if (
    episode.execution_binding.execution_mode !==
      "commissioned_agent_native_host" ||
    ![
      COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
      COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
    ].includes(episode.execution_binding.execution_evidence_class) ||
    canonicalizeProtocolValueV01(episode.evaluation.model_identity) !==
      canonicalizeProtocolValueV01({
        provenance:
          episode.execution_binding.resource_binding.model_ref === null
            ? "unknown"
            : "observed",
        provider_ref: episode.execution_binding.resource_binding.provider_ref,
        model_ref: episode.execution_binding.resource_binding.model_ref,
        route_ref: episode.execution_binding.resource_binding.route_ref,
      }) ||
    episode.execution_binding.host_ref_set.some(
      (binding) =>
        !COMMISSIONED_WORK_NATIVE_HOST_REF_TYPES_V01.has(binding.ref_type),
    )
  ) {
    failV01("commissioned_work_commissioned_agent_episode_binding_invalid");
  }
  const provenance = episode.execution_binding.host_identity_provenance;
  const hostBindingTypes = new Set(
    episode.execution_binding.host_ref_set.map((binding) => binding.ref_type),
  );
  const completeTurnIdentity =
    hostBindingTypes.has("host_connection") &&
    hostBindingTypes.has("host_thread") &&
    hostBindingTypes.has("host_turn") &&
    (episode.execution_binding.host_ref_set.length === 3 ||
      (episode.execution_binding.host_ref_set.length === 4 &&
        hostBindingTypes.has("host_session")));
  const partialIdentity =
    episode.execution_binding.host_ref_set.length === 0 ||
    (episode.execution_binding.host_ref_set.length === 1 &&
      hostBindingTypes.has("host_connection"));
  if (!completeTurnIdentity && !partialIdentity) {
    failV01("commissioned_work_commissioned_agent_episode_binding_invalid");
  }
  if (provenance.provenance_kind === "fresh_invocation") {
    if (!completeTurnIdentity || provenance.identity_coverage !== "complete_turn") {
      failV01("commissioned_work_host_identity_provenance_invalid");
    }
  } else if (provenance.provenance_kind === "boundary_partial") {
    if (
      !partialIdentity ||
      provenance.identity_coverage !==
        (episode.execution_binding.host_ref_set.length === 1
          ? "connection_only"
          : "absent") ||
      !episode.evaluation.hard_failures.some((failure) =>
        ["native_host_failed", "native_host_unavailable"].includes(failure),
      )
    ) {
      failV01("commissioned_work_host_identity_provenance_invalid");
    }
  } else {
    createCommissionedWorkRecordRefV01(provenance.resume_source_ref);
    requireFingerprintV01(
      provenance.resume_binding_fingerprint,
      "commissioned_work_same_run_resume_binding_invalid",
    );
    if (
      provenance.resume_source_ref.record_version !==
        COMMISSIONED_WORK_SAME_RUN_RESUME_SOURCE_VERSION_V01 ||
      !Number.isSafeInteger(provenance.resume_control_revision) ||
      provenance.resume_control_revision < 0 ||
      provenance.identity_coverage !==
        (completeTurnIdentity
          ? "complete_turn"
          : episode.execution_binding.host_ref_set.length === 1
            ? "connection_only"
            : "absent") ||
      new Set(provenance.inherited_host_ref_fingerprints).size !==
        provenance.inherited_host_ref_fingerprints.length ||
      canonicalizeProtocolValueV01(
        provenance.inherited_host_ref_fingerprints,
      ) !==
        canonicalizeProtocolValueV01(
          [...provenance.inherited_host_ref_fingerprints].sort(
            compareProtocolCodeUnitsV01,
          ),
        )
    ) {
      failV01("commissioned_work_same_run_resume_provenance_invalid");
    }
    const inherited = new Set(provenance.inherited_host_ref_fingerprints);
    const hostFingerprints = new Set(
      episode.execution_binding.host_ref_set.map(
        (binding) => binding.exact_ref_fingerprint,
      ),
    );
    const connectionFingerprint = episode.execution_binding.host_ref_set.find(
      (binding) => binding.ref_type === "host_connection",
    )?.exact_ref_fingerprint;
    const turnFingerprint = episode.execution_binding.host_ref_set.find(
      (binding) => binding.ref_type === "host_turn",
    )?.exact_ref_fingerprint;
    if (
      provenance.inherited_host_ref_fingerprints.some(
        (fingerprint) => !hostFingerprints.has(fingerprint),
      ) ||
      (connectionFingerprint !== undefined &&
        inherited.has(connectionFingerprint)) ||
      (completeTurnIdentity &&
        (turnFingerprint === undefined || !inherited.has(turnFingerprint))) ||
      (partialIdentity &&
        provenance.inherited_host_ref_fingerprints.length !== 0)
    ) {
      failV01("commissioned_work_same_run_resume_provenance_invalid");
    }
  }
  validateExecutionResourceBindingV01({
    execution_evidence_class:
      episode.execution_binding.execution_evidence_class,
    resources: episode.evaluation.resources,
    resource_binding: episode.execution_binding.resource_binding,
  });
}

function resourceLaneIsObservedZeroV01(
  lane: CommissionedWorkResourceVectorV01[keyof CommissionedWorkResourceVectorV01],
): boolean {
  return lane.provenance === "observed" && lane.value === 0;
}

function assertEpisodeManifestBindingV01(
  episode: CommissionedWorkEpisodeArtifactV01,
  commitment: CommissionedWorkCaseCommitmentV01,
  manifest: CommissionedWorkFamilyManifestV01,
): void {
  const treatmentBinding =
    episode.condition === null
      ? null
      : commitment.condition_bindings.find(
          (binding) =>
            binding.condition === episode.condition &&
            binding.holdout_variant === episode.holdout_variant,
        ) ?? null;
  if (
    episode.case_id !== commitment.case_id ||
    episode.project_id !== commitment.project_id ||
    episode.workspace_id !== manifest.workspace_id ||
    episode.independent_origin_group_id !==
      commitment.independent_origin_group_id ||
    episode.case_commitment_ref.record_version !==
      commitment.commitment_version ||
    episode.case_commitment_ref.record_id !== commitment.case_id ||
    episode.case_commitment_ref.record_fingerprint !==
      commitment.integrity.fingerprint ||
    episode.repository_fixture_fingerprint !==
      commitment.repository_fixture_fingerprint ||
    episode.evaluator_version !== manifest.evaluator_version ||
    episode.objective_evaluator.role_fingerprint !==
      manifest.outcome_evaluator.role_fingerprint ||
    episode.common_evidence_fingerprint !==
      commitment.common_evidence_fingerprint ||
    (episode.condition === null &&
      (episode.existing_reentry_role !== null ||
        episode.continuation_binding_fingerprint !== null ||
        episode.intervention_provenance_fingerprint !== null ||
        episode.execution_binding.continuation_materials_delivered !== 0)) ||
    (episode.condition !== null &&
      (!treatmentBinding ||
        episode.existing_reentry_role !==
          treatmentBinding.existing_reentry_role ||
        episode.continuation_binding_fingerprint !==
          treatmentBinding.binding_fingerprint ||
        episode.intervention_provenance_fingerprint !==
          treatmentBinding.intervention_provenance_ref.content_fingerprint ||
        episode.execution_binding.continuation_materials_delivered !==
          treatmentBinding.continuation_material_refs.length))
  ) {
    failV01("commissioned_work_episode_manifest_binding_invalid");
  }
}

function validateRepositoryStateV01(
  state: CommissionedWorkEpisodeArtifactV01["repository_state"],
): void {
  for (const sha of [
    state.initial_commit,
    state.initial_tree,
    state.episode_start_commit,
    state.episode_start_tree,
    state.episode_end_head,
    state.episode_end_tree,
  ]) {
    if (!COMMIT_SHA_V01.test(sha)) {
      failV01("commissioned_work_repository_state_identity_invalid");
    }
  }
  requireFingerprintV01(
    state.worktree_fingerprint,
    "commissioned_work_worktree_fingerprint_invalid",
  );
}

function validateResourceVectorV01(resources: CommissionedWorkResourceVectorV01): void {
  for (const lane of Object.values(resources)) {
    if (
      (lane.provenance === "unknown" && lane.value !== null) ||
      (lane.provenance === "observed" &&
        (typeof lane.value !== "number" ||
          !Number.isFinite(lane.value) ||
          lane.value < 0))
    ) {
      failV01("commissioned_work_resource_unknown_or_value_invalid");
    }
  }
}

function sourceFingerprintV01(
  source: CommissionedWorkCaseSourceV01,
  fileSources: Array<{ repository_relative_path: string; content: string }>,
): string {
  const files = new Map(
    fileSources.map((item) => [item.repository_relative_path, item.content]),
  );
  return fingerprintV01(
    [...source.current_source_relative_paths]
      .sort(compareProtocolCodeUnitsV01)
      .map((repository_relative_path) => ({
        repository_relative_path,
        content_fingerprint: fingerprintV01(files.get(repository_relative_path) ?? null),
      })),
  );
}

function sealV01<T extends object>(
  valueWithoutIntegrity: T,
  fingerprintScope: string,
): T & { integrity: CommissionedWorkIntegrityV01 } {
  return {
    ...valueWithoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(
      valueWithoutIntegrity,
      fingerprintScope,
    ),
  };
}

function validateIntegrityV01<T extends { integrity: CommissionedWorkIntegrityV01 }>(
  value: T,
  expectedScope: string,
  errorCode: string,
): void {
  const { integrity, ...withoutIntegrity } = value as T & Record<string, unknown>;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== COMMISSIONED_WORK_CANONICALIZATION_V01 ||
    integrity.fingerprint_scope !== expectedScope ||
    integrity.fingerprint !== fingerprintV01(withoutIntegrity)
  ) {
    failV01(errorCode);
  }
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function opaqueFingerprintV01(value: string): string {
  requireBoundedTextV01(value, "commissioned_work_opaque_source_text_invalid");
  if (PRIVATE_ABSOLUTE_PATH_V01.test(value)) {
    failV01("commissioned_work_opaque_source_path_forbidden");
  }
  const issues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    value,
    "$opaque",
    {
      error: (code) => issues.add(code),
      warning: () => {},
    },
    {
      secret_material_message: "Secret-shaped material is forbidden.",
      provider_specific_field_message: "Provider-specific identity is forbidden.",
    },
  );
  if (issues.size > 0) failV01("commissioned_work_opaque_source_material_forbidden");
  return fingerprintV01(value);
}

function compareCanonicalV01(left: unknown, right: unknown): number {
  return compareProtocolCodeUnitsV01(
    canonicalizeProtocolValueV01(left),
    canonicalizeProtocolValueV01(right),
  );
}

function requireSafeCodeV01(value: string, code: string): void {
  if (typeof value !== "string" || !SAFE_CODE_V01.test(value)) failV01(code);
}

function requireBoundedTextV01(value: string, code: string): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > MAX_STRING_CHARACTERS_V01
  ) {
    failV01(code);
  }
}

function requireFingerprintV01(value: string, code: string): void {
  if (!FINGERPRINT_V01.test(value)) failV01(code);
}

function requireTimestampV01(value: string, code: string): void {
  if (
    typeof value !== "string" ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    failV01(code);
  }
}

function requireCanonicalRepositoryPathV01(value: string): void {
  let canonical: string;
  try {
    canonical = canonicalizeRepositoryRelativePathV01(value);
  } catch {
    failV01("commissioned_work_repository_path_invalid");
  }
  if (canonical !== value) failV01("commissioned_work_repository_path_not_canonical");
}

function walkValueV01(
  value: unknown,
  visitor: (value: unknown) => void,
): void {
  visitor(value);
  if (Array.isArray(value)) {
    value.forEach((item) => walkValueV01(item, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value).forEach((item) => walkValueV01(item, visitor));
}

function failV01(code: string): never {
  throw new CommissionedControlledWorkbenchErrorV01(code);
}
