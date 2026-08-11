import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  assertValidStrategyCompositionAblationRelationV01,
  assertValidStrategyCompositionCaseV01,
  createStrategyCompositionCaseReferenceV01,
  validateStrategyCompositionHoldoutRelationV01,
} from "@/lib/vnext/strategy-composition-case";
import type {
  StrategyCompositionCaseReferenceV01,
  StrategyCompositionCaseV01,
} from "@/types/vnext/strategy-composition-case";
import {
  STRATEGY_COMPOSITION_BUDGET_VERSION_V01,
  STRATEGY_COMPOSITION_COMPARISON_CANONICALIZATION_V01,
  STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01,
  STRATEGY_COMPOSITION_COMPARISON_VERSION_V01,
  STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01,
  STRATEGY_COMPOSITION_OUTCOME_OBSERVATION_VERSION_V01,
  type StrategyCompositionAblationAssociationV01,
  type StrategyCompositionBudgetEnvelopeV01,
  type StrategyCompositionBudgetReferenceV01,
  type StrategyCompositionComparisonAuthoritySummaryV01,
  type StrategyCompositionComparisonIntegrityV01,
  type StrategyCompositionComparisonV01,
  type StrategyCompositionComparisonVariantV01,
  type StrategyCompositionDimensionDeltaV01,
  type StrategyCompositionEvaluationCaseReferenceV01,
  type StrategyCompositionNegativeTransferObservationV01,
  type StrategyCompositionNonDominanceSummaryV01,
  type StrategyCompositionObservationSubjectV01,
  type StrategyCompositionOutcomeDimensionV01,
  type StrategyCompositionOutcomeObservationV01,
  type StrategyCompositionOutcomeVectorV01,
  type StrategyCompositionPairSummaryRelationV01,
  type StrategyCompositionPairwiseComparisonV01,
  type StrategyCompositionVariantSummaryV01,
} from "@/types/vnext/strategy-composition-comparison";

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const SAFE_ID_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/u;
const ABSOLUTE_PATH_PATTERN = /(?:^|\s)(?:\/(?:Users|home|var|tmp|private|etc)\/|[A-Za-z]:\\)/u;
const FORBIDDEN_FIELD_PATTERN = /(?:^|_)(?:fitness|quality|overall|weighted_sum|global_strategy_score|winner|winning_variant|rank|ranking|ordinal_rank|promotion|accepted_strategy|raw_prompt|prompt|transcript|terminal_output|provider_output|hidden_reasoning|chain_of_thought|secret|credential|api_key|database_path|db_path)(?:_|$)/u;
const PENDING_ID = "strategy-composition-comparison:pending";
const PENDING_BUDGET_ID = "strategy-composition-budget:pending";
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const MAX_COUNT = 1_000_000;
const MAX_LIMIT = 1_000_000_000;

const comparisonRootKeys = [
  "comparison_version", "comparison_id", "comparison_kind", "workspace_id",
  "project_id", "comparison_family_key", "variant_summaries", "structural_parity",
  "evaluation_binding", "equal_budget", "outcome_observations", "pairwise_comparisons",
  "non_dominance", "ablation_association", "negative_transfer", "completeness",
  "limitations", "material_boundary", "authority_summary", "integrity",
] as const;

export interface BuildStrategyCompositionBudgetInputV01 {
  budget_key: string;
  provider_call_limit: number;
  tool_call_limit: number;
  step_limit: number;
  token_limit: number;
  cost_limit_microunits: number;
  latency_limit_ms: number;
}

export interface BuildStrategyCompositionOutcomeObservationInputV01 {
  subject_kind: StrategyCompositionObservationSubjectV01;
  case_ref: StrategyCompositionCaseReferenceV01;
  evaluation_case: StrategyCompositionEvaluationCaseReferenceV01;
  holdout_case: StrategyCompositionCaseReferenceV01;
  budget: StrategyCompositionBudgetReferenceV01;
  source_ref_id: string;
  outcome: StrategyCompositionOutcomeVectorV01;
  limitations: string[];
}

export interface BuildStrategyCompositionComparisonInputV01 {
  workspace_id: string;
  project_id: string;
  comparison_family_key: string;
  cases: Record<StrategyCompositionComparisonVariantV01, StrategyCompositionCaseV01>;
  evaluation_case: StrategyCompositionEvaluationCaseReferenceV01;
  parent_development_case: StrategyCompositionCaseV01;
  holdout_case: StrategyCompositionCaseV01;
  observation_cutoff: string;
  equal_budget: BuildStrategyCompositionBudgetInputV01;
  observations: BuildStrategyCompositionOutcomeObservationInputV01[];
  ablation: {
    parent_case: StrategyCompositionCaseV01;
    child_case: StrategyCompositionCaseV01;
    parent_observation: BuildStrategyCompositionOutcomeObservationInputV01;
    child_observation: BuildStrategyCompositionOutcomeObservationInputV01;
  } | null;
  negative_transfer_case: StrategyCompositionCaseV01 | null;
  limitations: string[];
}

export interface StrategyCompositionComparisonValidationIssueV01 {
  code: string;
  path: string;
}

export interface StrategyCompositionComparisonValidationResultV01 {
  status: "valid" | "blocked";
  errors: StrategyCompositionComparisonValidationIssueV01[];
}

export class StrategyCompositionComparisonErrorV01 extends Error {
  constructor(readonly code: string, readonly path: string = "$") {
    super(code);
    this.name = "StrategyCompositionComparisonErrorV01";
  }
}

export function canonicalizeStrategyCompositionComparisonValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function buildStrategyCompositionBudgetV01(
  input: BuildStrategyCompositionBudgetInputV01,
): StrategyCompositionBudgetEnvelopeV01 {
  assertExactKeysV01(input, ["budget_key", "provider_call_limit", "tool_call_limit", "step_limit", "token_limit", "cost_limit_microunits", "latency_limit_ms"], "$.equal_budget");
  const value: StrategyCompositionBudgetEnvelopeV01 = {
    budget_version: STRATEGY_COMPOSITION_BUDGET_VERSION_V01,
    budget_id: PENDING_BUDGET_ID,
    budget_kind: "exact_equal_ceiling_envelope",
    budget_key: requiredIdV01(input.budget_key, "$.equal_budget.budget_key"),
    provider_call_limit: boundedIntegerV01(input.provider_call_limit, "$.equal_budget.provider_call_limit", MAX_LIMIT),
    tool_call_limit: boundedIntegerV01(input.tool_call_limit, "$.equal_budget.tool_call_limit", MAX_LIMIT),
    step_limit: boundedIntegerV01(input.step_limit, "$.equal_budget.step_limit", MAX_LIMIT),
    token_limit: boundedIntegerV01(input.token_limit, "$.equal_budget.token_limit", MAX_LIMIT),
    cost_limit_microunits: boundedIntegerV01(input.cost_limit_microunits, "$.equal_budget.cost_limit_microunits", MAX_LIMIT),
    latency_limit_ms: boundedIntegerV01(input.latency_limit_ms, "$.equal_budget.latency_limit_ms", MAX_LIMIT),
    equal_for_all_variants: true,
    cost_adjusted_comparison_supported: false,
    integrity: pendingIntegrityV01(),
  };
  value.budget_id = `strategy-composition-budget:${hashSuffixV01(value, "budget_id")}`;
  value.integrity.fingerprint = fingerprintV01(value);
  return value;
}

export function buildStrategyCompositionComparisonV01(
  input: BuildStrategyCompositionComparisonInputV01,
): StrategyCompositionComparisonV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertBuilderInputV01(input);
  const safe = structuredClone(input);
  assertSafeMaterialV01(safe);
  const workspaceId = requiredIdV01(safe.workspace_id, "$.workspace_id");
  const projectId = requiredIdV01(safe.project_id, "$.project_id");
  const family = requiredIdV01(safe.comparison_family_key, "$.comparison_family_key");
  const orderedCases = normalizeAndValidateCasesV01(safe.cases, workspaceId, projectId);
  const summaries = createVariantSummariesV01(orderedCases);
  const structuralParity = assertAndCreateStructuralParityV01(orderedCases, summaries);

  const parent = safe.parent_development_case;
  const holdout = safe.holdout_case;
  assertCaseProjectV01(parent, workspaceId, projectId, "$.parent_development_case");
  assertCaseProjectV01(holdout, workspaceId, projectId, "$.holdout_case");
  if (parent.case_id !== orderedCases.ordered.case_id) failV01("strategy_comparison_holdout_parent_must_be_ordered", "$.parent_development_case");
  const holdoutValidation = validateStrategyCompositionHoldoutRelationV01(parent, holdout);
  if (holdoutValidation.status !== "valid") failV01(holdoutValidation.errors[0]?.code ?? "strategy_comparison_holdout_invalid", "$.holdout_case");
  if (holdout.evaluation_design.case_role !== "holdout") failV01("strategy_comparison_holdout_design_required", "$.holdout_case");
  const frozenCutoff = holdout.evaluation_design.frozen_cutoff;
  const observationCutoff = requiredTimestampV01(safe.observation_cutoff, "$.observation_cutoff");
  if (timestampMsV01(observationCutoff) <= timestampMsV01(frozenCutoff)) failV01("strategy_comparison_observation_cutoff_not_after_holdout", "$.observation_cutoff");
  const evaluationCase = normalizeEvaluationCaseV01(safe.evaluation_case, workspaceId, projectId);
  if (evaluationCase.task_family_key !== holdout.case_binding.task_family_key) failV01("strategy_comparison_evaluation_task_family_mismatch", "$.evaluation_case.task_family_key");
  const budget = buildStrategyCompositionBudgetV01(safe.equal_budget);
  const holdoutRef = createStrategyCompositionCaseReferenceV01(holdout);
  const observations = normalizeVariantObservationsV01(safe.observations, orderedCases, evaluationCase, holdoutRef, budget, holdout, frozenCutoff, observationCutoff);
  const pairs = createPairwiseComparisonsV01(observations, summaries);
  const nonDominance = createNonDominanceV01(observations);
  const ablation = safe.ablation === null ? null : createAblationAssociationV01(safe.ablation, evaluationCase, holdoutRef, budget, holdout, frozenCutoff, observationCutoff, workspaceId, projectId);
  const negativeTransfer = safe.negative_transfer_case === null ? null : createNegativeTransferV01(safe.negative_transfer_case, workspaceId, projectId);
  const missingDimensions = uniqueSortedV01(observations.flatMap((item) => item.missing_dimensions));

  const value: StrategyCompositionComparisonV01 = {
    comparison_version: STRATEGY_COMPOSITION_COMPARISON_VERSION_V01,
    comparison_id: PENDING_ID,
    comparison_kind: "derived_rebuildable_offline_research_comparison",
    workspace_id: workspaceId,
    project_id: projectId,
    comparison_family_key: family,
    variant_summaries: summaries,
    structural_parity: structuralParity,
    evaluation_binding: {
      evaluation_case: evaluationCase,
      parent_development_case: createStrategyCompositionCaseReferenceV01(parent),
      holdout_case: holdoutRef,
      frozen_cutoff: frozenCutoff,
      observation_cutoff: observationCutoff,
      same_holdout_for_all_variants: true,
      holdout_outcome_not_used_for_construction: true,
    },
    equal_budget: budget,
    outcome_observations: observations,
    pairwise_comparisons: pairs,
    non_dominance: nonDominance,
    ablation_association: ablation,
    negative_transfer: negativeTransfer,
    completeness: {
      status: missingDimensions.length === 0 ? "complete" : "partial",
      missing_dimensions: missingDimensions,
      stochastic_aggregation: "unsupported_v0.1",
    },
    limitations: uniqueTextV01(safe.limitations, "$.limitations"),
    material_boundary: createMaterialBoundaryV01(),
    authority_summary: createAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  value.comparison_id = `strategy-composition-comparison:${hashSuffixV01(value, "comparison_id")}`;
  value.integrity.fingerprint = fingerprintV01(value);
  assertValidStrategyCompositionComparisonV01(value);
  if (canonicalizeProtocolValueV01(input) !== before) failV01("strategy_comparison_input_mutated");
  return value;
}

export function validateStrategyCompositionComparisonV01(input: unknown): StrategyCompositionComparisonValidationResultV01 {
  try {
    assertValidStrategyCompositionComparisonV01(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    return { status: "blocked", errors: [{ code: error instanceof StrategyCompositionComparisonErrorV01 ? error.code : "strategy_comparison_invalid", path: error instanceof StrategyCompositionComparisonErrorV01 ? error.path : "$" }] };
  }
}

export function assertValidStrategyCompositionComparisonV01(input: unknown): asserts input is StrategyCompositionComparisonV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_invalid");
  assertSafeMaterialV01(input);
  assertExactKeysV01(input, comparisonRootKeys, "$");
  if (input.comparison_version !== STRATEGY_COMPOSITION_COMPARISON_VERSION_V01 || input.comparison_kind !== "derived_rebuildable_offline_research_comparison") failV01("strategy_comparison_contract_invalid");
  const value = input as unknown as StrategyCompositionComparisonV01;
  requiredIdV01(value.workspace_id, "$.workspace_id");
  requiredIdV01(value.project_id, "$.project_id");
  requiredIdV01(value.comparison_family_key, "$.comparison_family_key");
  if (!Array.isArray(value.variant_summaries) || value.variant_summaries.length !== 4 || value.variant_summaries.some((item, index) => item.variant_kind !== STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01[index])) failV01("strategy_comparison_four_variants_required", "$.variant_summaries");
  if (!Array.isArray(value.outcome_observations) || value.outcome_observations.length !== 4) failV01("strategy_comparison_four_observations_required", "$.outcome_observations");
  if (!Array.isArray(value.pairwise_comparisons) || value.pairwise_comparisons.length !== 4) failV01("strategy_comparison_pairwise_set_invalid", "$.pairwise_comparisons");
  assertAllFalseAuthorityV01(value.authority_summary);
  if (canonicalizeProtocolValueV01(value.material_boundary) !== canonicalizeProtocolValueV01(createMaterialBoundaryV01())) failV01("strategy_comparison_material_boundary_invalid", "$.material_boundary");
  if (!SHA256_PATTERN.test(value.integrity?.fingerprint ?? "") || value.integrity.fingerprint !== fingerprintV01(value)) failV01("strategy_comparison_fingerprint_mismatch", "$.integrity.fingerprint");
  if (value.comparison_id !== `strategy-composition-comparison:${hashSuffixV01(value, "comparison_id")}`) failV01("strategy_comparison_id_mismatch", "$.comparison_id");
  if (value.non_dominance.global_winner_created !== false || value.non_dominance.ordinal_ranking_created !== false || value.non_dominance.product_promotion_created !== false) failV01("strategy_comparison_ranking_or_promotion_forbidden", "$.non_dominance");
  for (const pair of value.pairwise_comparisons) if (pair.pairwise_better_is_global_winner !== false) failV01("strategy_comparison_global_winner_forbidden", "$.pairwise_comparisons");
}

function assertBuilderInputV01(input: unknown): asserts input is BuildStrategyCompositionComparisonInputV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_builder_input_invalid");
  assertExactKeysV01(input, ["workspace_id", "project_id", "comparison_family_key", "cases", "evaluation_case", "parent_development_case", "holdout_case", "observation_cutoff", "equal_budget", "observations", "ablation", "negative_transfer_case", "limitations"], "$input");
  if (!isProtocolRecordV01(input.cases)) failV01("strategy_comparison_cases_invalid", "$.cases");
  assertExactKeysV01(input.cases, STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01, "$.cases");
  if (!Array.isArray(input.observations) || input.observations.length !== 4) failV01("strategy_comparison_four_observations_required", "$.observations");
  if (input.ablation !== null) {
    if (!isProtocolRecordV01(input.ablation)) failV01("strategy_comparison_ablation_input_invalid", "$.ablation");
    assertExactKeysV01(input.ablation, ["parent_case", "child_case", "parent_observation", "child_observation"], "$.ablation");
  }
  if (!Array.isArray(input.limitations)) failV01("strategy_comparison_limitations_invalid", "$.limitations");
}

function normalizeAndValidateCasesV01(input: BuildStrategyCompositionComparisonInputV01["cases"], workspaceId: string, projectId: string): BuildStrategyCompositionComparisonInputV01["cases"] {
  const result = {} as BuildStrategyCompositionComparisonInputV01["cases"];
  for (const variant of STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01) {
    const value = input[variant];
    assertCaseProjectV01(value, workspaceId, projectId, `$.cases.${variant}`);
    result[variant] = value;
  }
  if (result.monolithic.components.length !== 1 || result.monolithic.role_bindings.length !== 0 || result.monolithic.relations.length !== 0) failV01("strategy_comparison_monolithic_structure_invalid", "$.cases.monolithic");
  if (result.unbound.role_bindings.length !== 0 || result.unbound.relations.length !== 0) failV01("strategy_comparison_unbound_structure_invalid", "$.cases.unbound");
  if (result.bound.role_bindings.length === 0 || result.bound.relations.length !== 0) failV01("strategy_comparison_bound_structure_invalid", "$.cases.bound");
  if (result.ordered.role_bindings.length === 0 || result.ordered.relations.length === 0) failV01("strategy_comparison_ordered_structure_invalid", "$.cases.ordered");
  return result;
}

function assertCaseProjectV01(input: unknown, workspaceId: string, projectId: string, path: string): asserts input is StrategyCompositionCaseV01 {
  assertValidStrategyCompositionCaseV01(input);
  if (input.case_binding.workspace_id !== workspaceId || input.case_binding.project_id !== projectId) failV01("strategy_comparison_cross_project_case", path);
}

function createVariantSummariesV01(cases: BuildStrategyCompositionComparisonInputV01["cases"]): StrategyCompositionVariantSummaryV01[] {
  return STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01.map((variant) => {
    const value = cases[variant];
    return {
      variant_kind: variant,
      case_ref: createStrategyCompositionCaseReferenceV01(value),
      component_count: value.components.length,
      role_binding_count: value.role_bindings.length,
      relation_count: value.relations.length,
      component_set_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value.components)),
      source_set_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value.source_refs)),
      construction_material_fingerprint: constructionMaterialFingerprintV01(value),
      role_binding_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value.role_bindings)),
      relation_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value.relations)),
      structurally_valid: true,
    };
  });
}

function constructionMaterialFingerprintV01(value: StrategyCompositionCaseV01): string {
  const material = {
    case_binding: { ...value.case_binding, case_key: "componentized-variant" },
    source_refs: value.source_refs,
    components: value.components,
    evaluation_design: value.evaluation_design,
    limitations: value.limitations,
    missingness: value.missingness,
  };
  return createProtocolSha256V01(canonicalizeProtocolValueV01(material));
}

function assertAndCreateStructuralParityV01(cases: BuildStrategyCompositionComparisonInputV01["cases"], summaries: StrategyCompositionVariantSummaryV01[]): StrategyCompositionComparisonV01["structural_parity"] {
  const componentized = summaries.slice(1);
  const componentFp = componentized[0]!.component_set_fingerprint;
  const sourceFp = componentized[0]!.source_set_fingerprint;
  const constructionFp = componentized[0]!.construction_material_fingerprint;
  if (componentized.some((item) => item.component_set_fingerprint !== componentFp)) failV01("strategy_comparison_component_content_mismatch", "$.cases");
  if (componentized.some((item) => item.source_set_fingerprint !== sourceFp)) failV01("strategy_comparison_source_provenance_mismatch", "$.cases");
  if (componentized.some((item) => item.construction_material_fingerprint !== constructionFp)) failV01("strategy_comparison_construction_material_mismatch", "$.cases");
  if (canonicalizeProtocolValueV01(cases.bound.role_bindings) !== canonicalizeProtocolValueV01(cases.ordered.role_bindings)) failV01("strategy_comparison_binding_mismatch", "$.cases");
  return {
    componentized_components_equal: true,
    componentized_sources_equal: true,
    componentized_construction_material_equal: true,
    bound_and_ordered_role_bindings_equal: true,
    intended_binding_and_order_deltas_only: true,
    common_component_set_fingerprint: componentFp,
    common_source_set_fingerprint: sourceFp,
    common_construction_material_fingerprint: constructionFp,
  };
}

function normalizeEvaluationCaseV01(input: unknown, workspaceId: string, projectId: string): StrategyCompositionEvaluationCaseReferenceV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_evaluation_case_invalid", "$.evaluation_case");
  assertExactKeysV01(input, ["evaluation_case_id", "evaluation_case_fingerprint", "task_family_key"], "$.evaluation_case");
  const result = {
    evaluation_case_id: requiredIdV01(input.evaluation_case_id, "$.evaluation_case.evaluation_case_id"),
    evaluation_case_fingerprint: requiredFingerprintV01(input.evaluation_case_fingerprint, "$.evaluation_case.evaluation_case_fingerprint"),
    task_family_key: requiredIdV01(input.task_family_key, "$.evaluation_case.task_family_key"),
  };
  void workspaceId; void projectId;
  return result;
}

function normalizeVariantObservationsV01(inputs: BuildStrategyCompositionOutcomeObservationInputV01[], cases: BuildStrategyCompositionComparisonInputV01["cases"], evaluation: StrategyCompositionEvaluationCaseReferenceV01, holdoutRef: StrategyCompositionCaseReferenceV01, budget: StrategyCompositionBudgetEnvelopeV01, holdout: StrategyCompositionCaseV01, frozenCutoff: string, observationCutoff: string): StrategyCompositionOutcomeObservationV01[] {
  const bySubject = new Map(inputs.map((item) => [item.subject_kind, item]));
  if (bySubject.size !== 4) failV01("strategy_comparison_duplicate_or_missing_observation", "$.observations");
  return STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01.map((variant) => {
    const item = bySubject.get(variant);
    if (!item) failV01("strategy_comparison_missing_variant_observation", `$.observations.${variant}`);
    return normalizeObservationV01(item, variant, createStrategyCompositionCaseReferenceV01(cases[variant]), evaluation, holdoutRef, budget, holdout, frozenCutoff, observationCutoff);
  });
}

function normalizeObservationV01(input: BuildStrategyCompositionOutcomeObservationInputV01, expectedSubject: StrategyCompositionObservationSubjectV01, expectedCase: StrategyCompositionCaseReferenceV01, evaluation: StrategyCompositionEvaluationCaseReferenceV01, holdoutRef: StrategyCompositionCaseReferenceV01, budget: StrategyCompositionBudgetEnvelopeV01, holdout: StrategyCompositionCaseV01, frozenCutoff: string, observationCutoff: string): StrategyCompositionOutcomeObservationV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_observation_invalid");
  assertExactKeysV01(input, ["subject_kind", "case_ref", "evaluation_case", "holdout_case", "budget", "source_ref_id", "outcome", "limitations"], "$.observations[]");
  if (input.subject_kind !== expectedSubject) failV01("strategy_comparison_observation_subject_mismatch");
  assertCanonicalEqualV01(input.case_ref, expectedCase, "strategy_comparison_observation_case_mismatch");
  assertCanonicalEqualV01(input.evaluation_case, evaluation, "strategy_comparison_evaluation_identity_mismatch");
  assertCanonicalEqualV01(input.holdout_case, holdoutRef, "strategy_comparison_holdout_identity_mismatch");
  const budgetRef = { budget_id: budget.budget_id, budget_fingerprint: budget.integrity.fingerprint };
  assertCanonicalEqualV01(input.budget, budgetRef, "strategy_comparison_budget_mismatch");
  const source = holdout.source_refs.find((item) => item.source_ref_id === input.source_ref_id);
  if (!source || source.source_kind !== "evaluation_outcome" || source.source_use !== "evaluation_outcome") failV01("strategy_comparison_outcome_source_invalid", "$.observations[].source_ref_id");
  if (!holdout.evaluation_design || holdout.evaluation_design.case_role !== "holdout" || !holdout.evaluation_design.evaluation_outcome_source_ref_ids.includes(source.source_ref_id)) failV01("strategy_comparison_outcome_source_not_holdout_bound");
  if (timestampMsV01(source.available_at) <= timestampMsV01(frozenCutoff) || timestampMsV01(source.available_at) > timestampMsV01(observationCutoff)) failV01("strategy_comparison_outcome_source_temporal_invalid");
  const outcome = normalizeOutcomeV01(input.outcome);
  const missing = deriveMissingDimensionsV01(outcome);
  return {
    observation_version: STRATEGY_COMPOSITION_OUTCOME_OBSERVATION_VERSION_V01,
    subject_kind: expectedSubject,
    case_ref: expectedCase,
    evaluation_case: evaluation,
    holdout_case: holdoutRef,
    budget: budgetRef,
    source,
    observation_mode: "deterministic_exact_fixture",
    outcome,
    completeness: missing.length === 0 ? "complete" : "partial",
    missing_dimensions: missing,
    outcome_is_evaluation_truth: false,
    observed_advantage_is_verified_general_benefit: false,
    limitations: uniqueTextV01(input.limitations, "$.observations[].limitations"),
  };
}

function normalizeOutcomeV01(input: unknown): StrategyCompositionOutcomeVectorV01 {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_outcome_invalid");
  assertExactKeysV01(input, ["verification", "review_burden", "cost_operability"], "$.outcome");
  if (!isProtocolRecordV01(input.verification) || !isProtocolRecordV01(input.review_burden) || !isProtocolRecordV01(input.cost_operability)) failV01("strategy_comparison_outcome_invalid");
  assertExactKeysV01(input.verification, ["required_passed", "failed", "blocked", "skipped", "unknown", "hard_gate_failure", "hard_gate_failure_codes"], "$.outcome.verification");
  assertExactKeysV01(input.review_burden, ["correction_count", "intervention_count", "repeated_explanation_count", "missing_critical_context_correction_count"], "$.outcome.review_burden");
  assertExactKeysV01(input.cost_operability, ["provider_call_count", "tool_call_count", "token_count", "cost_microunits", "latency_ms", "cleanup_recovery_count", "egress_observation"], "$.outcome.cost_operability");
  const hardGate = input.verification.hard_gate_failure;
  if (hardGate !== null && typeof hardGate !== "boolean") failV01("strategy_comparison_hard_gate_invalid");
  if (!Array.isArray(input.verification.hard_gate_failure_codes)) failV01("strategy_comparison_hard_gate_codes_invalid");
  const codes = uniqueTextV01(input.verification.hard_gate_failure_codes, "$.outcome.verification.hard_gate_failure_codes");
  if ((hardGate === true) !== (codes.length > 0)) failV01("strategy_comparison_hard_gate_codes_mismatch");
  const egress = input.cost_operability.egress_observation;
  if (egress !== "none_observed" && egress !== "observed" && egress !== "unknown") failV01("strategy_comparison_egress_observation_invalid");
  return {
    verification: {
      required_passed: nullableCountV01(input.verification.required_passed, "required_passed"),
      failed: nullableCountV01(input.verification.failed, "failed"), blocked: nullableCountV01(input.verification.blocked, "blocked"),
      skipped: nullableCountV01(input.verification.skipped, "skipped"), unknown: nullableCountV01(input.verification.unknown, "unknown"),
      hard_gate_failure: hardGate, hard_gate_failure_codes: codes,
    },
    review_burden: {
      correction_count: nullableCountV01(input.review_burden.correction_count, "correction_count"),
      intervention_count: nullableCountV01(input.review_burden.intervention_count, "intervention_count"),
      repeated_explanation_count: nullableCountV01(input.review_burden.repeated_explanation_count, "repeated_explanation_count"),
      missing_critical_context_correction_count: nullableCountV01(input.review_burden.missing_critical_context_correction_count, "missing_critical_context_correction_count"),
    },
    cost_operability: {
      provider_call_count: nullableCountV01(input.cost_operability.provider_call_count, "provider_call_count"), tool_call_count: nullableCountV01(input.cost_operability.tool_call_count, "tool_call_count"),
      token_count: nullableCountV01(input.cost_operability.token_count, "token_count"), cost_microunits: nullableCountV01(input.cost_operability.cost_microunits, "cost_microunits"),
      latency_ms: nullableCountV01(input.cost_operability.latency_ms, "latency_ms"), cleanup_recovery_count: nullableCountV01(input.cost_operability.cleanup_recovery_count, "cleanup_recovery_count"), egress_observation: egress,
    },
  };
}

const dimensionDirections: Record<StrategyCompositionOutcomeDimensionV01, "higher" | "lower" | "required_false"> = {
  "verification.required_passed": "higher",
  "verification.failed": "lower",
  "verification.blocked": "lower",
  "verification.skipped": "lower",
  "verification.unknown": "lower",
  "verification.hard_gate_failure": "required_false",
  "review_burden.correction_count": "lower",
  "review_burden.intervention_count": "lower",
  "review_burden.repeated_explanation_count": "lower",
  "review_burden.missing_critical_context_correction_count": "lower",
  "cost_operability.provider_call_count": "lower",
  "cost_operability.tool_call_count": "lower",
  "cost_operability.token_count": "lower",
  "cost_operability.cost_microunits": "lower",
  "cost_operability.latency_ms": "lower",
  "cost_operability.cleanup_recovery_count": "lower",
  "cost_operability.egress_observation": "lower",
};

function deriveMissingDimensionsV01(outcome: StrategyCompositionOutcomeVectorV01): StrategyCompositionOutcomeDimensionV01[] {
  return STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01.filter((dimension) => dimensionValueV01(outcome, dimension) === null || dimensionValueV01(outcome, dimension) === "unknown");
}

function dimensionValueV01(outcome: StrategyCompositionOutcomeVectorV01, dimension: StrategyCompositionOutcomeDimensionV01): number | boolean | string | null {
  const [group, field] = dimension.split(".") as [keyof StrategyCompositionOutcomeVectorV01, string];
  return (outcome[group] as unknown as Record<string, number | boolean | string | null>)[field] ?? null;
}

function compareDimensionV01(left: StrategyCompositionOutcomeVectorV01, right: StrategyCompositionOutcomeVectorV01, dimension: StrategyCompositionOutcomeDimensionV01): StrategyCompositionDimensionDeltaV01 {
  const leftValue = dimensionValueV01(left, dimension);
  const rightValue = dimensionValueV01(right, dimension);
  const direction = dimensionDirections[dimension];
  if (leftValue === null || rightValue === null || leftValue === "unknown" || rightValue === "unknown") {
    return { dimension, relation: "unknown", preferred_direction: direction, left_value: leftValue, right_value: rightValue, exact_delta: null, exact_basis: "One or both exact observations are unavailable." };
  }
  if (leftValue === rightValue) return { dimension, relation: "equal", preferred_direction: direction, left_value: leftValue, right_value: rightValue, exact_delta: typeof leftValue === "number" ? 0 : null, exact_basis: "The exact observed values are equal." };
  let leftBetter: boolean;
  if (direction === "required_false") leftBetter = leftValue === false;
  else if (typeof leftValue === "number" && typeof rightValue === "number") leftBetter = direction === "higher" ? leftValue > rightValue : leftValue < rightValue;
  else if (dimension === "cost_operability.egress_observation") leftBetter = leftValue === "none_observed" && rightValue === "observed";
  else return { dimension, relation: "not_comparable", preferred_direction: direction, left_value: leftValue, right_value: rightValue, exact_delta: null, exact_basis: "The supplied categorical values have no supported v0.1 comparison." };
  return {
    dimension,
    relation: leftBetter ? "better" : "worse",
    preferred_direction: direction,
    left_value: leftValue,
    right_value: rightValue,
    exact_delta: typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : null,
    exact_basis: direction === "required_false" ? "An exact hard-gate failure is non-compensable." : "Compared on this explicit observed dimension only.",
  };
}

const pairDefinitions = [
  ["monolithic_to_unbound", "monolithic", "unbound"],
  ["unbound_to_bound", "unbound", "bound"],
  ["bound_to_ordered", "bound", "ordered"],
  ["monolithic_to_ordered", "monolithic", "ordered"],
] as const;

function createPairwiseComparisonsV01(observations: StrategyCompositionOutcomeObservationV01[], summaries: StrategyCompositionVariantSummaryV01[]): StrategyCompositionPairwiseComparisonV01[] {
  const observationByVariant = new Map(observations.map((item) => [item.subject_kind, item]));
  const summaryByVariant = new Map(summaries.map((item) => [item.variant_kind, item]));
  return pairDefinitions.map(([question, leftVariant, rightVariant]) => {
    const left = observationByVariant.get(leftVariant)!;
    const right = observationByVariant.get(rightVariant)!;
    const deltas = STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01.map((dimension) => compareDimensionV01(left.outcome, right.outcome, dimension));
    const gate = deltas.find((item) => item.dimension === "verification.hard_gate_failure")!;
    let summary: StrategyCompositionPairSummaryRelationV01;
    let hardGate = false;
    if (gate.relation === "better") { summary = "left_better_hard_gate"; hardGate = true; }
    else if (gate.relation === "worse") { summary = "right_better_hard_gate"; hardGate = true; }
    else if (deltas.some((item) => item.relation === "not_comparable")) summary = "not_comparable";
    else {
      const better = deltas.some((item) => item.relation === "better");
      const worse = deltas.some((item) => item.relation === "worse");
      const unknown = deltas.some((item) => item.relation === "unknown");
      summary = better && worse ? "tradeoff" : better ? "left_better" : worse ? "right_better" : unknown ? "unknown" : "equal";
    }
    return {
      pair_id: `strategy-composition-pair:${question}`,
      structural_question: question,
      left_variant: leftVariant,
      right_variant: rightVariant,
      left_case_ref: summaryByVariant.get(leftVariant)!.case_ref,
      right_case_ref: summaryByVariant.get(rightVariant)!.case_ref,
      same_evaluation_case: true,
      same_holdout_case: true,
      same_budget: true,
      dimension_deltas: deltas,
      summary_relation: summary,
      hard_gate_non_compensation_applied: hardGate,
      pairwise_better_is_global_winner: false,
      limitations: ["Pairwise direction is dimension-bound and creates no global winner."],
    };
  });
}

function createNonDominanceV01(observations: StrategyCompositionOutcomeObservationV01[]): StrategyCompositionNonDominanceSummaryV01 {
  const unknownDimensions = uniqueSortedV01(observations.flatMap((item) => item.missing_dimensions));
  if (unknownDimensions.length > 0) {
    return {
      status: "undetermined", non_dominated_variants: [], dominated_relations: [], tradeoff_pairs: [], unknown_dimensions: unknownDimensions,
      ordinal_ranking_created: false, global_winner_created: false, product_promotion_created: false,
      limitations: ["Unknown observed dimensions make complete bounded dominance undetermined."],
    };
  }
  const dominatedRelations: StrategyCompositionNonDominanceSummaryV01["dominated_relations"] = [];
  const tradeoffPairs: string[] = [];
  for (let leftIndex = 0; leftIndex < observations.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < observations.length; rightIndex += 1) {
      const left = observations[leftIndex]!;
      const right = observations[rightIndex]!;
      const leftVariant = left.subject_kind as StrategyCompositionComparisonVariantV01;
      const rightVariant = right.subject_kind as StrategyCompositionComparisonVariantV01;
      const relation = dominanceV01(left.outcome, right.outcome);
      if (relation === "left") dominatedRelations.push({ dominant_variant: leftVariant, dominated_variant: rightVariant, basis: hardGateDifferenceV01(left.outcome, right.outcome) ? "hard_gate_non_compensation" : "all_observed_dimensions_no_worse_and_one_better" });
      else if (relation === "right") dominatedRelations.push({ dominant_variant: rightVariant, dominated_variant: leftVariant, basis: hardGateDifferenceV01(left.outcome, right.outcome) ? "hard_gate_non_compensation" : "all_observed_dimensions_no_worse_and_one_better" });
      else if (relation === "tradeoff") tradeoffPairs.push(`${leftVariant}<->${rightVariant}`);
    }
  }
  const dominated = new Set(dominatedRelations.map((item) => item.dominated_variant));
  return {
    status: "determined",
    non_dominated_variants: STRATEGY_COMPOSITION_COMPARISON_VARIANTS_V01.filter((variant) => !dominated.has(variant)),
    dominated_relations: dominatedRelations,
    tradeoff_pairs: tradeoffPairs.sort(compareProtocolCodeUnitsV01),
    unknown_dimensions: [],
    ordinal_ranking_created: false,
    global_winner_created: false,
    product_promotion_created: false,
    limitations: ["Non-dominance is bounded to the exact observed vector and is not product promotion or strategy acceptance."],
  };
}

function hardGateDifferenceV01(left: StrategyCompositionOutcomeVectorV01, right: StrategyCompositionOutcomeVectorV01): boolean {
  return left.verification.hard_gate_failure !== right.verification.hard_gate_failure;
}

function dominanceV01(left: StrategyCompositionOutcomeVectorV01, right: StrategyCompositionOutcomeVectorV01): "left" | "right" | "tradeoff" | "equal" {
  if (hardGateDifferenceV01(left, right)) return left.verification.hard_gate_failure === false ? "left" : "right";
  let leftBetter = false;
  let rightBetter = false;
  for (const dimension of STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01) {
    if (dimension === "verification.hard_gate_failure") continue;
    const relation = compareDimensionV01(left, right, dimension).relation;
    if (relation === "better") leftBetter = true;
    if (relation === "worse") rightBetter = true;
  }
  return leftBetter && !rightBetter ? "left" : rightBetter && !leftBetter ? "right" : leftBetter && rightBetter ? "tradeoff" : "equal";
}

function createAblationAssociationV01(input: NonNullable<BuildStrategyCompositionComparisonInputV01["ablation"]>, evaluation: StrategyCompositionEvaluationCaseReferenceV01, holdoutRef: StrategyCompositionCaseReferenceV01, budget: StrategyCompositionBudgetEnvelopeV01, holdout: StrategyCompositionCaseV01, frozenCutoff: string, observationCutoff: string, workspaceId: string, projectId: string): StrategyCompositionAblationAssociationV01 {
  assertCaseProjectV01(input.parent_case, workspaceId, projectId, "$.ablation.parent_case");
  assertCaseProjectV01(input.child_case, workspaceId, projectId, "$.ablation.child_case");
  assertValidStrategyCompositionAblationRelationV01(input.parent_case, input.child_case);
  if (input.child_case.evaluation_design.case_role !== "ablation") failV01("strategy_comparison_ablation_design_required");
  const parentObservation = normalizeObservationV01(input.parent_observation, "ordered", createStrategyCompositionCaseReferenceV01(input.parent_case), evaluation, holdoutRef, budget, holdout, frozenCutoff, observationCutoff);
  const childObservation = normalizeObservationV01(input.child_observation, "ablation", createStrategyCompositionCaseReferenceV01(input.child_case), evaluation, holdoutRef, budget, holdout, frozenCutoff, observationCutoff);
  return {
    parent_case_ref: parentObservation.case_ref,
    ablation_case_ref: childObservation.case_ref,
    target: input.child_case.evaluation_design.targets[0]!,
    same_evaluation_case: true,
    same_holdout_case: true,
    same_budget: true,
    dimension_deltas: STRATEGY_COMPOSITION_OUTCOME_DIMENSIONS_V01.map((dimension) => compareDimensionV01(parentObservation.outcome, childObservation.outcome, dimension)),
    association_kind: "bounded_ablation_intervention_association",
    causal_contribution_claimed: false,
    general_causal_contribution_claimed: false,
    limitations: ["The matched delta is an intervention-associated difference, not general causal contribution."],
  };
}

function createNegativeTransferV01(input: StrategyCompositionCaseV01, workspaceId: string, projectId: string): StrategyCompositionNegativeTransferObservationV01 {
  assertCaseProjectV01(input, workspaceId, projectId, "$.negative_transfer_case");
  if (input.evaluation_design.case_role !== "negative_transfer") failV01("strategy_comparison_negative_transfer_design_required");
  const design = input.evaluation_design;
  return {
    case_ref: createStrategyCompositionCaseReferenceV01(input),
    origin_task_family_key: design.origin_task_family_key,
    target_task_family_key: design.target_task_family_key,
    transfer_hypothesis_source_ref_ids: [...design.transfer_hypothesis_source_ref_ids],
    adverse_association_source_ref_ids: [...design.adverse_association_source_ref_ids],
    adverse_association_supplied: design.observed_adverse_association === "supplied",
    signal: "local_negative_transfer_candidate",
    causal_negative_contribution_claimed: false,
    general_harm_claimed: false,
    component_blacklist_created: false,
    promotion_or_depromotion_created: false,
    limitations: ["This local association is neither a causal claim nor general harm."],
  };
}

function createMaterialBoundaryV01(): StrategyCompositionComparisonV01["material_boundary"] {
  return {
    bounded: true, variant_count: 4, max_text_characters: 1600, max_collection_items: 128,
    raw_prompt_included: false, raw_transcript_included: false, raw_terminal_output_included: false,
    raw_provider_output_included: false, hidden_reasoning_included: false, credential_or_secret_included: false,
    absolute_local_path_included: false, stochastic_aggregation_supported: false,
  };
}

function createAuthoritySummaryV01(): StrategyCompositionComparisonAuthoritySummaryV01 {
  return {
    is_canonical_core_record: false, is_evidence: false, is_evaluation_truth: false, is_accepted_strategy: false,
    is_policy: false, is_execution_plan: false, is_proposal: false, is_review_decision: false, is_transition: false,
    creates_actor_identity: false, writes_database: false, mutates_source_records: false, mutates_semantic_state: false,
    mutates_task_context_packet: false, selects_context: false, activates_policy: false, authorizes_execution: false,
    authorizes_provider_calls: false, authorizes_network_use: false, authorizes_external_actuation: false,
    authorizes_github_mutation: false, authorizes_publication: false, authorizes_merge: false,
    claims_verified_general_benefit: false, claims_general_causal_contribution: false, claims_general_harm: false,
    promotes_or_depromotes_component_or_strategy: false, creates_scalar_fitness_or_quality: false,
    creates_global_winner_or_ranking: false,
    notes: ["Offline comparison creates no Core, evidence, strategy acceptance, policy, decision, Transition, execution, or merge authority."],
  };
}

function assertAllFalseAuthorityV01(input: unknown): void {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_authority_boundary_invalid", "$.authority_summary");
  const expected = createAuthoritySummaryV01();
  if (canonicalizeProtocolValueV01(input) !== canonicalizeProtocolValueV01(expected)) failV01("strategy_comparison_authority_boundary_invalid", "$.authority_summary");
}

function assertSafeMaterialV01(input: unknown, path = "$"): void {
  if (typeof input === "string") {
    if (input.length > 1600) failV01("strategy_comparison_text_bound_exceeded", path);
    if (ABSOLUTE_PATH_PATTERN.test(input)) failV01("strategy_comparison_private_absolute_path_forbidden", path);
    if (/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16})\b/u.test(input)) failV01("strategy_comparison_secret_forbidden", path);
    return;
  }
  if (Array.isArray(input)) {
    if (input.length > 128) failV01("strategy_comparison_collection_bound_exceeded", path);
    input.forEach((item, index) => assertSafeMaterialV01(item, `${path}[${index}]`));
    return;
  }
  if (!isProtocolRecordV01(input)) return;
  for (const [key, value] of Object.entries(input)) {
    const normalized = key.toLowerCase();
    const allowedFalse = value === false;
    if (!allowedFalse && FORBIDDEN_FIELD_PATTERN.test(normalized)) failV01("strategy_comparison_forbidden_semantic_field", `${path}.${key}`);
    assertSafeMaterialV01(value, `${path}.${key}`);
  }
}

function uniqueTextV01(input: unknown[], path: string): string[] {
  if (!Array.isArray(input) || input.length > 128) failV01("strategy_comparison_text_items_invalid", path);
  const values = input.map((value, index) => {
    if (typeof value !== "string") failV01("strategy_comparison_text_invalid", `${path}[${index}]`);
    const normalized = normalizeProtocolTextV01(value);
    if (!normalized || normalized.length > 1600) failV01("strategy_comparison_text_invalid", `${path}[${index}]`);
    return normalized;
  });
  return [...new Set(values)].sort(compareProtocolCodeUnitsV01);
}

function uniqueSortedV01<T extends string>(input: readonly T[]): T[] {
  return [...new Set(input)].sort(compareProtocolCodeUnitsV01);
}

function requiredIdV01(input: unknown, path: string): string {
  if (typeof input !== "string") failV01("strategy_comparison_id_invalid", path);
  const value = normalizeProtocolTextV01(input);
  if (!SAFE_ID_PATTERN.test(value)) failV01("strategy_comparison_id_invalid", path);
  return value;
}

function requiredFingerprintV01(input: unknown, path: string): string {
  if (typeof input !== "string" || !SHA256_PATTERN.test(input)) failV01("strategy_comparison_fingerprint_invalid", path);
  return input;
}

function requiredTimestampV01(input: unknown, path: string): string {
  if (typeof input !== "string" || !parseStrictIsoTimestampV01(input)) failV01("strategy_comparison_timestamp_invalid", path);
  return input;
}

function timestampMsV01(input: string): number {
  const parsed = parseStrictIsoTimestampV01(input);
  if (parsed === null) failV01("strategy_comparison_timestamp_invalid");
  return parsed;
}

function boundedIntegerV01(input: unknown, path: string, maximum: number): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0 || input > maximum) failV01("strategy_comparison_bound_invalid", path);
  return input;
}

function nullableCountV01(input: unknown, field: string): number | null {
  return input === null ? null : boundedIntegerV01(input, `$.outcome.${field}`, MAX_COUNT);
}

function assertExactKeysV01(input: unknown, keys: readonly string[], path: string): void {
  if (!isProtocolRecordV01(input)) failV01("strategy_comparison_object_invalid", path);
  const actual = Object.keys(input).sort(compareProtocolCodeUnitsV01);
  const expected = [...keys].sort(compareProtocolCodeUnitsV01);
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(expected)) failV01("strategy_comparison_unknown_or_missing_field", path);
}

function assertCanonicalEqualV01(left: unknown, right: unknown, code: string): void {
  if (canonicalizeProtocolValueV01(left) !== canonicalizeProtocolValueV01(right)) failV01(code);
}

function pendingIntegrityV01(): StrategyCompositionComparisonIntegrityV01 {
  return { algorithm: "sha256", canonicalization: STRATEGY_COMPOSITION_COMPARISON_CANONICALIZATION_V01, fingerprint_scope: "object_without_integrity_fingerprint", fingerprint: PENDING_FINGERPRINT };
}

function fingerprintV01(input: { integrity: StrategyCompositionComparisonIntegrityV01 }): string {
  const copy = structuredClone(input);
  delete (copy.integrity as Partial<StrategyCompositionComparisonIntegrityV01>).fingerprint;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

function hashSuffixV01(input: unknown, idField: "budget_id" | "comparison_id"): string {
  const copy = structuredClone(input) as Record<string, unknown>;
  copy[idField] = idField === "budget_id" ? PENDING_BUDGET_ID : PENDING_ID;
  if (isProtocolRecordV01(copy.integrity)) delete copy.integrity.fingerprint;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy)).slice("sha256:".length, 39);
}

function failV01(code: string, path = "$"): never {
  throw new StrategyCompositionComparisonErrorV01(code, path);
}
