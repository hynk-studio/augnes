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
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import { canonicalizeRepositoryRelativePathV01 } from "@/lib/vnext/repository-relative-path";
import { assertNativeHostResultV01 } from "@/lib/vnext/native-host/native-host-contract";
import { normalizeNativeHostResultResidueV01 } from "@/lib/vnext/native-host/native-host-result-normalization";
import { materializeValidatedPacketDeliveryCheckV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostAdapterV01,
  NativeHostRequestV01,
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
  COMMISSIONED_WORK_EPISODE_VERSION_V01,
  COMMISSIONED_WORK_EVALUATION_VERSION_V01,
  COMMISSIONED_WORK_EVIDENCE_LADDER_STAGES_V01,
  COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
  COMMISSIONED_WORK_FAMILY_VERSION_V01,
  COMMISSIONED_WORK_HOLDOUT_VERSION_V01,
  COMMISSIONED_WORK_REPORT_VERSION_V01,
  COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01,
  type CommissionedWorkArtifactIndexV01,
  type CommissionedWorkAuthoritySummaryV01,
  type CommissionedWorkCaseCommitmentV01,
  type CommissionedWorkCaseSourceV01,
  type CommissionedWorkConditionV01,
  type CommissionedWorkConsolidationCandidateV01,
  type CommissionedWorkEpisodeArtifactV01,
  type CommissionedWorkEpisodeExecutionBindingV01,
  type CommissionedWorkEpisodeExecutionSourceV01,
  type CommissionedWorkEpisodePlanSourceV01,
  type CommissionedWorkEpisodeRoleV01,
  type CommissionedWorkEvaluationVectorV01,
  type CommissionedWorkEvidenceLadderRowV01,
  type CommissionedWorkFamilyManifestV01,
  type CommissionedWorkFinalReportV01,
  type CommissionedWorkHardFailureCodeV01,
  type CommissionedWorkHoldoutEvaluationV01,
  type CommissionedWorkHoldoutRelationV01,
  type CommissionedWorkHoldoutVariantV01,
  type CommissionedWorkIntegrityV01,
  type CommissionedWorkMaterialBoundaryV01,
  type CommissionedWorkObjectiveObservationV01,
  type CommissionedWorkOpaqueMaterialRefV01,
  type CommissionedWorkRecordRefV01,
  type CommissionedWorkResourceVectorV01,
  type CommissionedWorkRoleRefV01,
  type CommissionedWorkRuntimeBindingV01,
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

export interface BuildCommissionedWorkObjectiveObservationInputV01
  extends Omit<CommissionedWorkObjectiveObservationV01, "observation_version" | "integrity"> {
  case_commitment: CommissionedWorkCaseCommitmentV01;
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
  execution_source: CommissionedWorkEpisodeExecutionSourceV01;
  episode_id: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  predecessor_episode_ref: CommissionedWorkRecordRefV01 | null;
  sealed_interruption_ref: CommissionedWorkRecordRefV01 | null;
  candidate_freeze_fingerprint: string | null;
  repository_state: CommissionedWorkEpisodeArtifactV01["repository_state"];
  started_at: string;
  first_material_action_at: string | null;
  finished_at: string;
  candidate_frozen_before_start: boolean | null;
  repository_action_trace_fingerprint: string;
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
  const manifestWithoutIntegrity = {
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
    training_cases: commitments.slice(0, 3) as CommissionedWorkFamilyManifestV01["training_cases"],
    holdout_case: commitments[3]!,
    condition_order: COMMISSIONED_WORK_CONDITIONS_V01,
    equal_budget_fingerprint: budgetFingerprints[0]!,
    hypothesis_fingerprint: opaqueFingerprintV01(input.hypothesis),
    task_or_rubric_mutation_allowed: false as const,
    holdout_content_in_manifest: false as const,
    holdout_used_for_candidate_derivation: false as const,
    material_boundary: createCommissionedWorkMaterialBoundaryV01(),
    authority_summary: createCommissionedWorkAuthoritySummaryV01(),
  };
  const manifest = sealV01(
    manifestWithoutIntegrity,
    "commissioned_work_family_manifest_without_integrity_fingerprint",
  );
  assertCommissionedWorkFamilySourceBindingV01({
    manifest,
    training_cases: input.training_cases,
    holdout_case: input.holdout_case,
  });
  return manifest;
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
        `return:${input.source.case_id}:${input.plan.executor_role_id}`,
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
    input.plan.executor_role_id,
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
        "commissioned_work_fixture_action",
        `fixture-action:${input.episode_id}`,
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
      max_artifacts: 0,
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
    input.request.policy.max_commands !== contract.max_commands
  ) {
    failV01("commissioned_work_executor_result_operation_contract_invalid");
  }
  const asserted = assertNativeHostResultV01(input.request, input.result);
  const normalized = normalizeNativeHostResultResidueV01({
    result: asserted,
    required_check_ids: ["validated_packet_delivery"],
  }).result;
  const allowedPaths = new Set(contract.allowed_repository_relative_paths);
  const changedPaths = normalized.changed_files.map((changed) =>
    canonicalizeRepositoryRelativePathV01(changed.repository_relative_path),
  );
  if (
    changedPaths.length > contract.max_changed_files ||
    normalized.commands.length > contract.max_commands ||
    new Set(changedPaths).size !== changedPaths.length ||
    changedPaths.some((changedPath) => !allowedPaths.has(changedPath))
  ) {
    failV01("commissioned_work_executor_result_operation_contract_invalid");
  }
  return normalized;
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
    Object.values(input.authority_effects).some((value) => value !== 0) ||
    input.resources.provider_calls.provenance !== "observed" ||
    input.resources.provider_calls.value !== 0 ||
    input.resources.model_calls.provenance !== "observed" ||
    input.resources.model_calls.value !== 0 ||
    input.resources.external_network_calls.provenance !== "observed" ||
    input.resources.external_network_calls.value !== 0
  ) {
    failV01("commissioned_work_observation_authority_expansion");
  }
  validateResourceVectorV01(input.resources);
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

function commissionedWorkRecordRefFromExternalV01(
  externalRef: ExternalRefV01,
): CommissionedWorkRecordRefV01 {
  if (!externalRef.source_ref) {
    failV01("commissioned_work_receipt_host_identity_missing");
  }
  const exactExternalRefFingerprint = fingerprintV01(externalRef);
  return createCommissionedWorkRecordRefV01({
    record_version: externalRef.ref_version,
    record_id: `host:${exactExternalRefFingerprint.slice("sha256:".length, 39)}`,
    record_fingerprint: exactExternalRefFingerprint,
  });
}

function validateExecutionSourceResultBindingV01(input: {
  execution_source: CommissionedWorkEpisodeExecutionSourceV01;
  result: NativeHostResultV01;
  observation: CommissionedWorkObjectiveObservationV01;
}): {
  host_external_ref: ExternalRefV01;
  host_record_ref: CommissionedWorkRecordRefV01;
  run_ref_type: string;
  runtime_labels: string[];
  observation_kind: string;
  observation_summary: string;
  result_summary: string;
  operation_contract_note: string;
  privacy_note: string;
  model_identity: CommissionedWorkEvaluationVectorV01["model_identity"];
  model_invocations: RunReceiptBuilderInputV01["model_invocations"];
  data_classification: RunReceiptBuilderInputV01["privacy_egress"]["data_classification"];
  egress_status: RunReceiptBuilderInputV01["privacy_egress"]["egress_status"];
  egress_basis: RunReceiptBuilderInputV01["privacy_egress"]["basis"];
  destination_refs: ExternalRefV01[];
  source_external_refs: ExternalRefV01[];
} {
  const hostExternalRef = input.result.host_refs[0] ?? null;
  if (hostExternalRef === null || input.result.host_refs.length !== 1) {
    failV01("commissioned_work_receipt_host_identity_missing");
  }
  const hostRecordRef = commissionedWorkRecordRefFromExternalV01(hostExternalRef);
  const executionSourceExternalRef = localRefV01(
    "commissioned_work_execution_source",
    `${input.execution_source.binding_kind}:${input.execution_source.execution_evidence_class}`,
    input.result.finished_at,
    fingerprintV01(input.execution_source),
  );
  const metadata = input.result.adapter_extension.bounded_metadata;
  const fixtureOnlyKeys = [
    "fixture_admission_fingerprint",
    "fixture_admission_consumed",
    "synthetic_fixture_binding_fingerprint",
    "synthetic_fixture_output_fingerprint",
    "execution_evidence_class",
    "synthetic_fixture_output_applied",
    "solution_write_plan_checked_during_result_admission",
  ] as const;
  const resourceCounter = (
    key: "provider_calls" | "model_calls" | "external_network_calls",
  ): number | null => {
    const lane = input.observation.resources[key];
    const value = metadata[key];
    if (
      lane.provenance === "observed" &&
      (value !== lane.value || typeof value !== "number")
    ) {
      failV01("commissioned_work_execution_resource_binding_invalid");
    }
    if (lane.provenance === "unknown" && value !== null) {
      failV01("commissioned_work_execution_resource_binding_invalid");
    }
    return lane.value;
  };
  const providerCalls = resourceCounter("provider_calls");
  const modelCalls = resourceCounter("model_calls");
  const externalNetworkCalls = resourceCounter("external_network_calls");
  if (
    modelCalls !== null &&
    (input.result.model_invocation_receipt_refs.length > modelCalls ||
      (modelCalls === 0 && input.result.model_invocation_receipt_refs.length > 0))
  ) {
    failV01("commissioned_work_execution_model_receipt_binding_invalid");
  }
  if (input.execution_source.binding_kind === "synthetic_fixture") {
    if (
      input.execution_source.execution_evidence_class !==
        COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01 ||
      input.execution_source.execution_mode !==
        "zero_provider_synthetic_fixture_adapter" ||
      hostExternalRef.ref_type !== "commissioned_workbench_fixture_host" ||
      providerCalls !== 0 ||
      modelCalls !== 0 ||
      externalNetworkCalls !== 0 ||
      input.result.model_invocation_receipt_refs.length !== 0 ||
      fixtureOnlyKeys.some((key) => !(key in metadata))
    ) {
      failV01("commissioned_work_synthetic_execution_binding_invalid");
    }
    return {
      host_external_ref: hostExternalRef,
      host_record_ref: hostRecordRef,
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
      data_classification: "local_only",
      egress_status: "did_not_occur",
      egress_basis: "observed",
      destination_refs: [],
      source_external_refs: [executionSourceExternalRef],
    };
  }
  if (
    ![
      COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
      COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
    ].includes(input.execution_source.execution_evidence_class) ||
    input.execution_source.execution_mode !== "commissioned_agent_native_host" ||
    hostExternalRef.ref_type !== "commissioned_workbench_commissioned_agent_host" ||
    fixtureOnlyKeys.some((key) => key in metadata)
  ) {
    failV01("commissioned_work_commissioned_agent_execution_binding_invalid");
  }
  const isConformance =
    input.execution_source.execution_evidence_class ===
    COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01;
  if (
    isConformance &&
    (input.execution_source.live_authorization_ref !== null ||
      input.execution_source.provider_ref !== null ||
      input.execution_source.model_ref !== null ||
      input.execution_source.route_ref !== null ||
      providerCalls !== 0 ||
      modelCalls !== 0 ||
      externalNetworkCalls !== 0 ||
      input.result.model_invocation_receipt_refs.length !== 0)
  ) {
    failV01("commissioned_work_commissioned_agent_conformance_binding_invalid");
  }
  if (
    !isConformance &&
    (input.execution_source.live_authorization_ref === null ||
      modelCalls === null ||
      providerCalls === null ||
      externalNetworkCalls === null ||
      (modelCalls > 0 &&
        (input.execution_source.provider_ref === null ||
          input.execution_source.model_ref === null ||
          input.execution_source.route_ref === null)))
  ) {
    failV01("commissioned_work_commissioned_agent_observation_binding_invalid");
  }
  const providerExternalRef = input.execution_source.provider_ref
    ? commissionedWorkExternalRefFromRecordV01(
        input.execution_source.provider_ref,
        "commissioned_work_provider",
        input.result.finished_at,
      )
    : null;
  const modelExternalRef = input.execution_source.model_ref
    ? commissionedWorkExternalRefFromRecordV01(
        input.execution_source.model_ref,
        "commissioned_work_model",
        input.result.finished_at,
      )
    : null;
  const routeExternalRef = input.execution_source.route_ref
    ? commissionedWorkExternalRefFromRecordV01(
        input.execution_source.route_ref,
        "commissioned_work_route",
        input.result.finished_at,
      )
    : null;
  const liveAuthorizationExternalRef = input.execution_source.live_authorization_ref
    ? commissionedWorkExternalRefFromRecordV01(
        input.execution_source.live_authorization_ref,
        "commissioned_work_live_authorization",
        input.result.finished_at,
      )
    : null;
  const destinationRefs = [providerExternalRef, routeExternalRef].filter(
    (ref): ref is ExternalRefV01 => ref !== null,
  );
  return {
    host_external_ref: hostExternalRef,
    host_record_ref: hostRecordRef,
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
      provenance: input.execution_source.model_ref === null ? "unknown" : "observed",
      provider_ref: input.execution_source.provider_ref,
      model_ref: input.execution_source.model_ref,
      route_ref: input.execution_source.route_ref,
    },
    model_invocations: input.result.model_invocation_receipt_refs.map(
      (invocationRef) => ({
        invocation_ref: invocationRef,
        provider_ref: providerExternalRef,
        model_ref: modelExternalRef,
        started_at: input.result.started_at,
        finished_at: input.result.finished_at,
        input_units: null,
        output_units: null,
        latency_ms: null,
        retry_count: null,
        status: input.result.outcome === "completed" ? "completed" : "unknown",
        retention_class: "bounded_structured_receipt_only",
        egress_status:
          externalNetworkCalls === null
            ? "unknown"
            : externalNetworkCalls === 0
              ? "did_not_occur"
              : "occurred",
        raw_prompt_persisted: false,
        raw_response_persisted: false,
        hidden_reasoning_persisted: false,
        source_refs: [invocationRef, ...destinationRefs],
      }),
    ),
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
      ...input.result.model_invocation_receipt_refs,
    ].filter((ref): ref is ExternalRefV01 => ref !== null),
  };
}

export function buildCommissionedWorkRunReceiptV01(input: {
  request: NativeHostRequestV01;
  packet: TaskContextPacketV01;
  result: NativeHostResultV01;
  observation: CommissionedWorkObjectiveObservationV01;
  execution_source: CommissionedWorkEpisodeExecutionSourceV01;
}): RunReceiptV01 {
  validateIntegrityV01(
    input.observation,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
    "commissioned_work_observation_integrity_invalid",
  );
  const executionBinding = validateExecutionSourceResultBindingV01({
    execution_source: input.execution_source,
    result: input.result,
    observation: input.observation,
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
  const packetRef = packetExternalRefV01(input.packet);
  const runRef = localRefV01(
    executionBinding.run_ref_type,
    input.result.run_id,
    input.result.finished_at,
    input.observation.run_ref_fingerprint,
  );
  const hostRef = executionBinding.host_external_ref;
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
      summary: "The evaluator checked the executor's recorded source-use relation.",
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
      status: Object.values(input.observation.authority_effects).every(
        (value) => value === 0,
      )
        ? "passed"
        : "failed",
      basis: "observed",
      summary: "The evaluator checked all forbidden authority and effect counters.",
      source_refs: [evaluatorRef],
    },
  ];
  const deliveryCheck = input.result.checks.find(
    (check) => check.check_id === "validated_packet_delivery",
  );
  if (!deliveryCheck || deliveryCheck.status !== "passed") {
    failV01("commissioned_work_packet_delivery_missing");
  }
  const allChecks = [
    {
      ...deliveryCheck,
      basis: "observed" as const,
      source_refs: [reporterRef],
    },
    ...objectiveChecks.filter((check) => check.status !== "unknown"),
    ...objectiveGateChecks.filter((check) => check.status !== "unknown"),
  ];
  const skippedChecks = [
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
          : anyUnperformed || anyHardGateUnknown
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
        source_refs: [runRef, packetRef, ...executionBinding.source_external_refs],
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
      hostRef,
      ...executionBinding.source_external_refs,
    ],
    result_summary: {
      summary: executionBinding.result_summary,
      outcome: input.result.outcome,
      limitations: [
        "Executor completion is not task success.",
        "This receipt grants no semantic, execution, provider, network, or merge authority.",
      ],
    },
    blockers: [
      ...(input.result.outcome === "completed"
        ? []
        : [
            {
              code: input.result.public_stop_reason ?? "commissioned_work_episode_blocked",
              summary:
                "The bounded predecessor stopped at its sealed interruption point.",
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
    gaps: anyUnperformed
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
  requireTimestampV01(input.started_at, "commissioned_work_episode_start_invalid");
  requireTimestampV01(input.finished_at, "commissioned_work_episode_finish_invalid");
  if (Date.parse(input.finished_at) < Date.parse(input.started_at)) {
    failV01("commissioned_work_episode_time_order_invalid");
  }
  if (input.first_material_action_at !== null) {
    requireTimestampV01(
      input.first_material_action_at,
      "commissioned_work_first_action_time_invalid",
    );
    if (
      Date.parse(input.first_material_action_at) < Date.parse(input.started_at) ||
      Date.parse(input.first_material_action_at) > Date.parse(input.finished_at) ||
      Date.parse(input.packet.generated_at) >
        Date.parse(input.first_material_action_at)
    ) {
      failV01("commissioned_work_first_action_order_invalid");
    }
  }
  const adapterFirstMaterialActionAt =
    input.result.adapter_extension.bounded_metadata.first_material_action_at;
  if (
    typeof adapterFirstMaterialActionAt !== "string" ||
    input.first_material_action_at !== adapterFirstMaterialActionAt ||
    input.started_at !== input.result.started_at ||
    input.finished_at !== input.result.finished_at ||
    input.receipt.started_at !== input.result.started_at ||
    input.receipt.finished_at !== input.result.finished_at
  ) {
    failV01("commissioned_work_episode_execution_chronology_binding_invalid");
  }
  const successorPlan = isSuccessorPlanV01(input.plan) ? input.plan : null;
  if (
    (input.episode_role === "predecessor" &&
      (successorPlan !== null ||
        input.condition !== null ||
        input.holdout_variant !== null ||
        input.predecessor_episode_ref !== null)) ||
    (input.episode_role === "successor" &&
      (successorPlan === null ||
        input.condition === null ||
        input.predecessor_episode_ref === null ||
        input.sealed_interruption_ref === null))
  ) {
    failV01("commissioned_work_episode_role_binding_invalid");
  }
  if (
    (input.episode_role === "predecessor" &&
      (input.result.outcome !== "blocked" ||
        input.result.public_stop_reason !== "sealed_interruption" ||
        input.receipt.execution.status !== "blocked")) ||
    (input.episode_role === "successor" &&
      (input.result.outcome !== "completed" ||
        input.result.public_stop_reason !== null ||
        input.receipt.execution.status !== "completed"))
  ) {
    failV01("commissioned_work_episode_terminal_boundary_invalid");
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
    input.plan.executor_role_id,
  );
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
  const executionSourceBinding = validateExecutionSourceResultBindingV01({
    execution_source: input.execution_source,
    result: input.result,
    observation: input.observation,
  });
  if (
    input.receipt.host_ref?.ref_type !==
      executionSourceBinding.host_external_ref.ref_type ||
    input.receipt.host_ref.external_id !==
      executionSourceBinding.host_external_ref.external_id ||
    input.receipt.host_ref.source_ref !==
      executionSourceBinding.host_external_ref.source_ref ||
    !input.receipt.external_refs.some(
      (externalRef) =>
        externalRef.ref_type === "commissioned_work_execution_source" &&
        externalRef.source_ref === fingerprintV01(input.execution_source),
    )
  ) {
    failV01("commissioned_work_episode_receipt_execution_source_invalid");
  }
  const evaluation = evaluationVectorV01({
    result: input.result,
    observation: input.observation,
    executor_role: executorRole,
    executor_claimed_complete: requireResultBooleanMetadataV01(
      input.result,
      "executor_claimed_complete",
    ),
    model_identity: executionSourceBinding.model_identity,
    synthetic_cross_condition_output_difference: "unknown",
    harmful_transfer: "unknown",
  });
  const packetMaterialSetFingerprint = packetMaterialSetFingerprintV01(input.packet);
  const deliveredMaterialSetFingerprint = requireResultFingerprintMetadataV01(
    input.result,
    "delivered_material_set_fingerprint",
  );
  const reportedPacketMaterialSetFingerprint = requireResultFingerprintMetadataV01(
    input.result,
    "packet_material_set_fingerprint",
  );
  const continuationMaterialsDelivered = requireResultCountMetadataV01(
    input.result,
    "continuation_materials_delivered",
  );
  const candidateComponentsDelivered = requireResultCountMetadataV01(
    input.result,
    "candidate_components_delivered",
  );
  const candidateComponentDeliveryFingerprints = input.packet.selected_context
    .filter(
      (entry) =>
        entry.external_ref?.ref_type ===
        "commissioned_work_frozen_candidate_component",
    )
    .map((entry) => entry.source_ref)
    .filter((value): value is string => value !== null)
    .sort(compareProtocolCodeUnitsV01);
  if (
    packetMaterialSetFingerprint !== reportedPacketMaterialSetFingerprint ||
    packetMaterialSetFingerprint !== deliveredMaterialSetFingerprint ||
    candidateComponentsDelivered !== candidateComponentDeliveryFingerprints.length
  ) {
    failV01("commissioned_work_executor_delivery_binding_invalid");
  }
  const commonExecutionBinding = {
    run_ref_fingerprint: fingerprintV01(input.result.run_id),
    request_id: input.result.request_id,
    native_host_request_fingerprint: fingerprintV01(input.request),
    native_host_result_fingerprint: fingerprintV01(input.result),
    host_ref: executionSourceBinding.host_record_ref,
    live_authorization_created: false as const,
    product_execution_grant_created: false as const,
    solution_write_plan_checked_during_result_admission: false as const,
    new_run_for_cold_episode: true as const,
    predecessor_run_reused: false as const,
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
    input.execution_source.binding_kind === "synthetic_fixture"
      ? {
          ...commonExecutionBinding,
          binding_kind: "synthetic_fixture",
          execution_evidence_class:
            COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
          execution_mode: "zero_provider_synthetic_fixture_adapter",
          disposable_fixture_admission_fingerprint:
            requireResultFingerprintMetadataV01(
              input.result,
              "fixture_admission_fingerprint",
            ),
          fixture_admission_reused: false,
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
          synthetic_fixture_output_applied: true,
        }
      : {
          ...commonExecutionBinding,
          binding_kind: "commissioned_agent",
          execution_evidence_class:
            input.execution_source.execution_evidence_class,
          execution_mode: "commissioned_agent_native_host",
          live_authorization_ref: input.execution_source.live_authorization_ref,
          provider_ref: input.execution_source.provider_ref,
          model_ref: input.execution_source.model_ref,
          route_ref: input.execution_source.route_ref,
        };
  const evidenceLadder = episodeEvidenceLadderV01({
    episode_role: input.episode_role,
    condition: input.condition,
    selected_count: successorPlan?.selected_material_ids.length ?? 0,
    delivery_before_action:
      input.first_material_action_at !== null &&
      input.result.checks.some(
        (check) =>
          check.check_id === "validated_packet_delivery" &&
          check.status === "passed",
      ),
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
    sealed_interruption_ref: input.sealed_interruption_ref,
    task_context_packet_ref: createCommissionedWorkRecordRefV01({
      record_version: input.packet.packet_version,
      record_id: input.packet.packet_id,
      record_fingerprint: input.packet.integrity.fingerprint,
    }),
    native_host_result_ref: createCommissionedWorkRecordRefV01({
      record_version: input.result.result_version,
      record_id: input.result.request_id,
      record_fingerprint: fingerprintV01(input.result),
    }),
    run_receipt_ref: createCommissionedWorkRecordRefV01({
      record_version: input.receipt.receipt_version,
      record_id: input.receipt.receipt_id,
      record_fingerprint: input.receipt.integrity.fingerprint,
    }),
    execution_binding: executionBinding,
    chronology: {
      started_at: input.started_at,
      first_material_action_at: input.first_material_action_at,
      finished_at: input.finished_at,
      candidate_frozen_before_start: input.candidate_frozen_before_start,
    },
    repository_state: input.repository_state,
    executor_claimed_complete: requireResultBooleanMetadataV01(
      input.result,
      "executor_claimed_complete",
    ),
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

export function createCommissionedWorkSealedInterruptionRefV01(
  predecessor: CommissionedWorkEpisodeArtifactV01,
): CommissionedWorkRecordRefV01 {
  validateEpisodeIntegrityV01(predecessor);
  if (
    predecessor.episode_role !== "predecessor" ||
    predecessor.predecessor_episode_ref !== null ||
    predecessor.sealed_interruption_ref !== null
  ) {
    failV01("commissioned_work_sealed_interruption_source_invalid");
  }
  return createCommissionedWorkRecordRefV01({
    record_version: "commissioned_work_sealed_interruption.v0.1",
    record_id: `interruption:${predecessor.case_id}`,
    record_fingerprint: fingerprintV01({
      predecessor_episode_ref: episodeRefV01(predecessor),
      native_host_result_ref: predecessor.native_host_result_ref,
      run_receipt_ref: predecessor.run_receipt_ref,
      repository_state: predecessor.repository_state,
      terminal_boundary: "blocked_sealed_interruption",
    }),
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
    const exactInterruption =
      predecessor.length === 1
        ? createCommissionedWorkSealedInterruptionRefV01(predecessor[0]!)
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
          canonicalizeProtocolValueV01(episode.sealed_interruption_ref) !==
            canonicalizeProtocolValueV01(exactInterruption),
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
  const exactInterruption = createCommissionedWorkSealedInterruptionRefV01(
    input.predecessor_episode,
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
      canonicalizeProtocolValueV01(arm.sealed_interruption_ref) !==
        canonicalizeProtocolValueV01(exactInterruption)
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
  executor_role: CommissionedWorkRoleRefV01;
  executor_claimed_complete: boolean;
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
  if (Object.values(input.observation.authority_effects).some((value) => value !== 0)) {
    hardFailures.add("authority_expansion");
  }
  const success =
    input.observation.oracle_executed &&
    input.observation.required_checks.length > 0 &&
    input.observation.required_checks.every((check) => check.disposition === "passed") &&
    input.observation.repository_diff_correctness === "passed" &&
    input.observation.verification_completeness === "complete" &&
    input.observation.negative_space.status === "preserved" &&
    input.observation.source_currentness === "current" &&
    input.observation.project_scope === "exact" &&
    hardFailures.size === 0;
  const firstChanged = input.result.changed_files[0] ?? null;
  const firstActionPathFingerprint =
    input.result.adapter_extension.bounded_metadata.first_action_path_fingerprint;
  if (
    (firstChanged !== null && firstActionPathFingerprint === null) ||
    (firstActionPathFingerprint !== null &&
      (typeof firstActionPathFingerprint !== "string" ||
        !FINGERPRINT_V01.test(firstActionPathFingerprint)))
  ) {
    failV01("commissioned_work_first_action_metadata_invalid");
  }
  return {
    deterministic_repository_task_success: success,
    required_check_dispositions: input.observation.required_checks,
    repository_diff_correctness: input.observation.repository_diff_correctness,
    verification_completeness: input.observation.verification_completeness,
    false_success_behavior:
      input.executor_claimed_complete && !success ? "observed" : "not_observed",
    negative_space_status: input.observation.negative_space.status,
    first_material_repository_action: firstChanged
      ? {
          action_kind:
            firstChanged.change_kind === "added"
              ? "file_add"
              : firstChanged.change_kind === "deleted"
                ? "file_delete"
                : "file_modify",
          repository_path_fingerprint: firstActionPathFingerprint,
        }
      : { action_kind: "none", repository_path_fingerprint: null },
    synthetic_cross_condition_output_difference:
      input.synthetic_cross_condition_output_difference,
    harmful_transfer: input.harmful_transfer,
    source_currentness_failure:
      input.observation.source_currentness === "unknown"
        ? null
        : input.observation.source_currentness === "failed",
    authority_violation: Object.values(input.observation.authority_effects).some(
      (value) => value !== 0,
    ),
    project_scope_violation:
      input.observation.project_scope === "unknown"
        ? null
        : input.observation.project_scope === "violated",
    executor_role: input.executor_role,
    host_identity_fingerprint:
      input.result.host_refs[0]?.source_ref ??
      failV01("commissioned_work_host_identity_missing"),
    model_identity: input.model_identity,
    resources: input.observation.resources,
    hard_failures: [...hardFailures].sort(compareProtocolCodeUnitsV01),
    hard_failures_non_compensable: true,
    scalar_fitness_created: false,
  };
}

function episodeEvidenceLadderV01(input: {
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  selected_count: number;
  delivery_before_action: boolean;
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
        : input.delivery_before_action && input.selected_count > 0
          ? "established"
          : "not_established",
      !continuationApplicable
        ? "not_applicable"
        : input.delivery_before_action && input.selected_count > 0
          ? "exact_packet_delivery"
          : "explicit_absence",
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
    (episode) => episode.execution_binding.continuation_materials_delivered > 0,
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
          predecessor?.executor_claimed_complete === true &&
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

function validateEpisodeIntegrityV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): void {
  validateIntegrityV01(
    episode,
    "commissioned_work_episode_without_integrity_fingerprint",
    "commissioned_work_episode_integrity_invalid",
  );
  if (
    canonicalizeProtocolValueV01(episode.authority_summary) !==
      canonicalizeProtocolValueV01(createCommissionedWorkAuthoritySummaryV01()) ||
    canonicalizeProtocolValueV01(episode.material_boundary) !==
      canonicalizeProtocolValueV01(createCommissionedWorkMaterialBoundaryV01()) ||
    episode.execution_binding.live_authorization_created !== false ||
    episode.execution_binding.product_execution_grant_created !== false ||
    episode.execution_binding.predecessor_transcript_inherited !== false ||
    episode.execution_binding.hidden_reasoning_inherited !== false ||
    episode.execution_binding.predecessor_run_reused !== false ||
    episode.execution_binding.new_run_for_cold_episode !== true ||
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
    episode.execution_binding.host_ref.record_fingerprint,
    "commissioned_work_episode_host_fingerprint_invalid",
  );
  validateResourceVectorV01(episode.evaluation.resources);
  if (episode.execution_binding.binding_kind === "synthetic_fixture") {
    if (
      episode.execution_binding.execution_evidence_class !==
        COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01 ||
      episode.execution_binding.execution_mode !==
        "zero_provider_synthetic_fixture_adapter" ||
      episode.execution_binding.fixture_admission_reused !== false ||
      episode.execution_binding.synthetic_fixture_output_applied !== true ||
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
          episode.execution_binding.model_ref === null ? "unknown" : "observed",
        provider_ref: episode.execution_binding.provider_ref,
        model_ref: episode.execution_binding.model_ref,
        route_ref: episode.execution_binding.route_ref,
      })
  ) {
    failV01("commissioned_work_commissioned_agent_episode_binding_invalid");
  }
  if (
    episode.execution_binding.execution_evidence_class ===
      COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01 &&
    (episode.execution_binding.live_authorization_ref !== null ||
      episode.execution_binding.provider_ref !== null ||
      episode.execution_binding.model_ref !== null ||
      episode.execution_binding.route_ref !== null ||
      !resourceLaneIsObservedZeroV01(
        episode.evaluation.resources.provider_calls,
      ) ||
      !resourceLaneIsObservedZeroV01(episode.evaluation.resources.model_calls) ||
      !resourceLaneIsObservedZeroV01(
        episode.evaluation.resources.external_network_calls,
      ))
  ) {
    failV01("commissioned_work_commissioned_agent_conformance_episode_invalid");
  }
  if (
    episode.execution_binding.execution_evidence_class ===
      COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01 &&
    episode.execution_binding.live_authorization_ref === null
  ) {
    failV01("commissioned_work_commissioned_agent_live_authorization_missing");
  }
  for (const recordRef of [
    episode.execution_binding.live_authorization_ref,
    episode.execution_binding.provider_ref,
    episode.execution_binding.model_ref,
    episode.execution_binding.route_ref,
  ]) {
    if (recordRef !== null) createCommissionedWorkRecordRefV01(recordRef);
  }
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
