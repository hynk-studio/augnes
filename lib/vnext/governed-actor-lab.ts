import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import type { ExternalRefTrustClassV01 } from "@/types/vnext/external-ref";
import {
  GOVERNED_ACTOR_LAB_ACTOR_VERSION_V01,
  GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01,
  GOVERNED_ACTOR_LAB_CANONICALIZATION_V01,
  GOVERNED_ACTOR_LAB_EPISODE_VERSION_V01,
  GOVERNED_ACTOR_LAB_EXPERIMENT_VERSION_V01,
  GOVERNED_ACTOR_LAB_FINAL_GENERATION_V01,
  GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01,
  GOVERNED_ACTOR_LAB_MEMORY_VERSION_V01,
  GOVERNED_ACTOR_LAB_PROMOTION_VERSION_V01,
  GOVERNED_ACTOR_LAB_REPORT_VERSION_V01,
  GOVERNED_ACTOR_LAB_ROOT_V01,
  type GovernedActorLabActorEpisodeV01,
  type GovernedActorLabActorProfileV01,
  type GovernedActorLabActorSnapshotReferenceV01,
  type GovernedActorLabActorSnapshotV01,
  type GovernedActorLabAuthoritySummaryV01,
  type GovernedActorLabBaselineArmV01,
  type GovernedActorLabBaselineActorHardGateObservationV01,
  type GovernedActorLabBaselineArmHardGateV01,
  type GovernedActorLabBaselineComputeAccountingV01,
  type GovernedActorLabBaselineObservationV01,
  type GovernedActorLabBudgetEnvelopeV01,
  type GovernedActorLabEpisodeArtifactV01,
  type GovernedActorLabExperimentManifestV01,
  type GovernedActorLabGenerationV01,
  type GovernedActorLabHoldoutFixtureV01,
  type GovernedActorLabInitialPopulationSpecificationV01,
  type GovernedActorLabCuratedKnowledgeInputV01,
  type GovernedActorLabEvaluationReferenceV01,
  type GovernedActorLabHarmObservationReferenceV01,
  type GovernedActorLabIntegrityV01,
  type GovernedActorLabInterventionEvaluationReferenceV01,
  type GovernedActorLabInterventionEvaluationV01,
  type GovernedActorLabItemTraceV01,
  type GovernedActorLabMaterialBoundaryV01,
  type GovernedActorLabMemoryAdmissionV01,
  type GovernedActorLabMemoryCandidateV01,
  type GovernedActorLabMemoryItemV01,
  type GovernedActorLabMemoryOperationV01,
  type GovernedActorLabMemorySnapshotReferenceV01,
  type GovernedActorLabMutationReferenceV01,
  type GovernedActorLabMutationUnitV01,
  type GovernedActorLabMutationV01,
  type GovernedActorLabOutcomeVectorV01,
  type GovernedActorLabPilotResultV01,
  type GovernedActorLabPopulationTransitionV01,
  type GovernedActorLabPrivateMemorySnapshotV01,
  type GovernedActorLabProductEffectLedgerV01,
  type GovernedActorLabPromotionCandidateV01,
  type GovernedActorLabReportV01,
  type GovernedActorLabSyntheticSourceV01,
  type GovernedActorLabToolManifestV01,
} from "@/types/vnext/governed-actor-lab";
import {
  STRATEGY_COMPOSITION_ROLES_V01,
  type StrategyCompositionCaseReferenceV01,
} from "@/types/vnext/strategy-composition-case";

const SAFE_ID_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/u;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const ABSOLUTE_PATH_PATTERN = /(?:^|\s)(?:\/(?:Users|home|var|tmp|private|etc)\/|[A-Za-z]:\\)/u;
const SECRET_PATTERN = /(?:sk-[A-Za-z0-9_-]{16,}|api[_-]?key\s*[:=]|bearer\s+[A-Za-z0-9._-]{16,})/iu;
const DIRECTIVE_PATTERN = /(?:ignore\s+(?:all\s+)?previous|system\s+prompt|developer\s+message|execute\s+(?:shell|command)|curl\s+https?:|reveal\s+(?:secret|credential)|hidden\s+holdout)/iu;
const HIDDEN_HOLDOUT_PATTERN = /(?:hidden[-_\s]?holdout|holdout[-_\s]?(?:case|answer|material|fixture)|held[-_\s]?out[-_\s]?(?:case|answer|material))/iu;
const GLOBAL_GENERALIZATION_PATTERN = /(?:apply\s+(?:this|it)\s+to\s+(?:all|every)\s+(?:task|case|project)|globally\s+applicable|universal(?:ly)?\s+applicable)/iu;
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const MAX_TEXT = 1600;

const authorityFalseKeys = [
  "is_canonical_core_record", "is_product_actor", "is_personal_perspective",
  "is_project_perspective", "is_reviewed_product_memory", "is_evidence",
  "is_claim", "is_accepted_strategy", "is_policy", "is_task_context_packet",
  "is_episode_delta_proposal", "is_review_decision", "is_transition",
  "writes_product_database", "reads_product_database", "mutates_product_state",
  "mutates_task_context", "activates_policy", "authorizes_execution",
  "authorizes_provider_calls", "authorizes_network_use",
  "authorizes_external_actuation", "authorizes_git_or_github_mutation",
  "authorizes_publication", "authorizes_merge",
  "creates_scalar_fitness_or_ranking", "creates_global_winner",
  "promotes_actor_or_component",
] as const;

export interface BuildGovernedActorLabManifestInputV01 {
  workspace_id: string;
  project_id: string;
  case_family_key: string;
  development_sources: GovernedActorLabSyntheticSourceV01[];
  decision_time_cutoff: string;
  hidden_holdout_id: string;
  hidden_holdout_fingerprint: string;
  evaluator: { version: string; fingerprint: string };
  actor_engine: { version: string; fingerprint: string };
  memory_policy: { version: string; fingerprint: string };
  mutation_policy: { version: string; fingerprint: string };
  deterministic_seed: string;
  strategy_recipe_refs: StrategyCompositionCaseReferenceV01[];
  compute: { tool_read_limit: number; step_limit: number };
}

export interface GovernedActorLabValidationResultV01 {
  status: "valid" | "blocked";
  errors: Array<{ code: string; path: string }>;
}

export interface GovernedActorLabEpisodeRunResultV01 {
  episode: GovernedActorLabEpisodeArtifactV01;
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
}

export interface GovernedActorLabTransitionResultV01 {
  transition: GovernedActorLabPopulationTransitionV01;
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
}

export class GovernedActorLabErrorV01 extends Error {
  constructor(readonly code: string, readonly path = "$") {
    super(code);
    this.name = "GovernedActorLabErrorV01";
  }
}

export function canonicalizeGovernedActorLabValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function createGovernedActorLabAuthoritySummaryV01(): GovernedActorLabAuthoritySummaryV01 {
  return {
    is_canonical_core_record: false,
    is_product_actor: false,
    is_personal_perspective: false,
    is_project_perspective: false,
    is_reviewed_product_memory: false,
    is_evidence: false,
    is_claim: false,
    is_accepted_strategy: false,
    is_policy: false,
    is_task_context_packet: false,
    is_episode_delta_proposal: false,
    is_review_decision: false,
    is_transition: false,
    writes_product_database: false,
    reads_product_database: false,
    mutates_product_state: false,
    mutates_task_context: false,
    activates_policy: false,
    authorizes_execution: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_actuation: false,
    authorizes_git_or_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    creates_scalar_fitness_or_ranking: false,
    creates_global_winner: false,
    promotes_actor_or_component: false,
    notes: [
      "Lab mechanics are isolated research output, not product state or authority.",
      "Promotion candidates require a separately authorized existing review path.",
    ],
  };
}

export function createGovernedActorLabMaterialBoundaryV01(): GovernedActorLabMaterialBoundaryV01 {
  return {
    bounded: true,
    max_actors_per_generation: 4,
    max_generations: 3,
    max_memory_items_per_actor: 16,
    max_memory_item_characters: 800,
    max_source_refs_per_item: 8,
    max_challenge_rounds: 1,
    max_text_characters: MAX_TEXT,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
  };
}

export function createGovernedActorLabProductEffectLedgerV01(): GovernedActorLabProductEffectLedgerV01 {
  return {
    core_reads: 0,
    core_writes: 0,
    product_database_reads: 0,
    product_database_writes: 0,
    task_context_writes: 0,
    proposal_writes: 0,
    review_decision_writes: 0,
    transition_writes: 0,
    policy_activations: 0,
    provider_or_model_calls: 0,
    network_calls: 0,
    git_or_github_runtime_mutations: 0,
    external_effects: 0,
  };
}

export function buildGovernedActorLabInitialPopulationSpecificationV01(
  strategyRecipeRefsInput: StrategyCompositionCaseReferenceV01[],
): GovernedActorLabInitialPopulationSpecificationV01 {
  const strategyRecipeRefs = normalizeStrategyRecipeRefsV01(strategyRecipeRefsInput);
  const actorIds = ["actor:a", "actor:b", "actor:c", "actor:d"];
  const profiles: GovernedActorLabActorProfileV01[] = [
    profileV01("verification_first", "support_and_currentness", "strict_source_only", "verify_then_solve", ["verification", "evidence_request"], strategyRecipeRefs),
    profileV01("scope_sentinel", "scope_and_conflict", "revision_preferred", "bound_then_solve", ["scope_narrowing", "abstention"], strategyRecipeRefs),
    profileV01("counterexample_search", "falsifier_and_harm", "quarantine_first", "challenge_then_narrow", ["falsification", "uncertainty_preservation"], strategyRecipeRefs),
    profileV01("bounded_synthesis", "minimal_sufficient_set", "minimal_retention", "synthesize_then_abstain", ["synthesis", "decomposition"], strategyRecipeRefs),
  ];
  const draft: GovernedActorLabInitialPopulationSpecificationV01 = {
    specification_version: "governed_actor_lab_initial_population.v0.1",
    specification_id: "actor-lab-initial-population:pending",
    actors: actorIds.map((labActorId, index) => ({
      lab_actor_id: labActorId,
      profile: profiles[index]!,
    })),
    provider_or_model_identity_bound: false,
    product_actor_identity_created: false,
    integrity: pendingIntegrityV01(),
  };
  const specificationId = deriveIdV01(
    "actor-lab-initial-population",
    draft,
    "specification_id",
  );
  const result = sealObjectV01({ ...draft, specification_id: specificationId });
  assertInitialPopulationSpecificationV01(result);
  return result;
}

export function buildGovernedActorLabManifestV01(
  input: BuildGovernedActorLabManifestInputV01,
): GovernedActorLabExperimentManifestV01 {
  const workspaceId = requiredIdV01(input.workspace_id, "$.workspace_id");
  const projectId = requiredIdV01(input.project_id, "$.project_id");
  const caseFamilyKey = requiredIdV01(input.case_family_key, "$.case_family_key");
  if (parseStrictIsoTimestampV01(input.decision_time_cutoff) === null) {
    failV01("actor_lab_cutoff_invalid", "$.decision_time_cutoff");
  }
  const sources = uniqueByCanonicalV01(input.development_sources).sort(compareSourcesV01);
  if (sources.length === 0 || sources.length > 16) {
    failV01("actor_lab_source_count_invalid", "$.development_sources");
  }
  for (const [index, source] of sources.entries()) {
    validateSyntheticSourceV01(source, `$.development_sources[${index}]`);
    if (source.task_family_key !== caseFamilyKey) {
      failV01("actor_lab_source_family_mismatch", `$.development_sources[${index}].task_family_key`);
    }
    if (Date.parse(source.available_at) > Date.parse(input.decision_time_cutoff)) {
      failV01("actor_lab_hindsight_source_forbidden", `$.development_sources[${index}].available_at`);
    }
  }
  requiredIdV01(input.hidden_holdout_id, "$.hidden_holdout_id");
  requiredFingerprintV01(input.hidden_holdout_fingerprint, "$.hidden_holdout_fingerprint");
  requiredIdV01(input.deterministic_seed, "$.deterministic_seed");
  validateVersionBindingV01(input.evaluator, "$.evaluator");
  validateVersionBindingV01(input.actor_engine, "$.actor_engine");
  validateVersionBindingV01(input.memory_policy, "$.memory_policy");
  validateVersionBindingV01(input.mutation_policy, "$.mutation_policy");
  const toolManifest = buildToolManifestV01(sources);
  const budget = buildBudgetV01(input.compute.tool_read_limit, input.compute.step_limit);
  const initialPopulation = buildGovernedActorLabInitialPopulationSpecificationV01(
    input.strategy_recipe_refs,
  );
  const generationZeroActorIds = initialPopulation.actors.map((actor) => actor.lab_actor_id);
  const draft: GovernedActorLabExperimentManifestV01 = {
    experiment_version: GOVERNED_ACTOR_LAB_EXPERIMENT_VERSION_V01,
    experiment_id: "actor-lab-experiment:pending",
    experiment_kind: "isolated_deterministic_offline_actor_lab",
    experiment_scope: {
      workspace_id: workspaceId,
      project_id: projectId,
      synthetic: true,
      case_family_key: caseFamilyKey,
      development_case_ids: sources.map((source) => source.source_id),
      decision_time_cutoff: input.decision_time_cutoff,
    },
    hidden_holdout: {
      holdout_id: input.hidden_holdout_id,
      holdout_fingerprint: input.hidden_holdout_fingerprint,
      content_in_manifest: false,
      readable_phase: "frozen_generation_two_evaluation_only",
    },
    population: {
      generation_zero_size: GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01,
      final_generation: GOVERNED_ACTOR_LAB_FINAL_GENERATION_V01,
      generation_zero_actor_ids: generationZeroActorIds,
      initial_population: initialPopulation,
      whole_actor_mutation_enabled: false,
      actor_identity_scope: "experiment_local",
    },
    evaluator: { ...input.evaluator },
    actor_engine: { ...input.actor_engine },
    memory_policy: { ...input.memory_policy },
    mutation_policy: { ...input.mutation_policy },
    tool_manifest: toolManifest,
    compute_budget: budget,
    deterministic_seed: input.deterministic_seed,
    lab_root: GOVERNED_ACTOR_LAB_ROOT_V01,
    artifact_scope: "experiment_and_actor_scoped",
    authority_summary: createGovernedActorLabAuthoritySummaryV01(),
    material_boundary: createGovernedActorLabMaterialBoundaryV01(),
    integrity: pendingIntegrityV01(),
  };
  const experimentId = deriveIdV01("actor-lab-experiment", draft, "experiment_id");
  const result = sealObjectV01({ ...draft, experiment_id: experimentId });
  scanForbiddenMaterialV01(result);
  assertValidGovernedActorLabManifestV01(result);
  return result;
}

export function validateGovernedActorLabManifestV01(
  input: unknown,
): GovernedActorLabValidationResultV01 {
  try {
    assertManifestV01(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    return validationFailureV01(error);
  }
}

export function assertValidGovernedActorLabManifestV01(
  input: unknown,
): asserts input is GovernedActorLabExperimentManifestV01 {
  assertManifestV01(input);
}

export function buildGovernedActorLabGenerationZeroV01(
  manifest: GovernedActorLabExperimentManifestV01,
): {
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
} {
  assertValidGovernedActorLabManifestV01(manifest);
  const profiles = manifest.population.initial_population.actors.map((actor) =>
    structuredClone(actor.profile),
  );
  const memories = manifest.population.generation_zero_actor_ids.map((actorId) =>
    buildMemorySnapshotV01({
      experimentId: manifest.experiment_id,
      actorId,
      generation: 0,
      parent: null,
      items: [],
    }),
  );
  const actors = manifest.population.generation_zero_actor_ids.map((actorId, index) =>
    buildActorSnapshotV01({
      manifest,
      actorId,
      generation: 0,
      parent: null,
      profile: profiles[index]!,
      memory: memoryRefV01(memories[index]!),
      mutations: [],
    }),
  );
  return { actors, memories };
}

export function readGovernedActorLabPrivateMemoryV01(
  snapshot: GovernedActorLabPrivateMemorySnapshotV01,
  expected: { experiment_id: string; lab_actor_id: string },
): GovernedActorLabPrivateMemorySnapshotV01 {
  assertMemorySnapshotV01(snapshot);
  if (snapshot.experiment_id !== expected.experiment_id) {
    failV01("actor_lab_cross_experiment_memory_read_refused", "$.experiment_id");
  }
  if (snapshot.lab_actor_id !== expected.lab_actor_id) {
    failV01("actor_lab_cross_actor_memory_read_refused", "$.lab_actor_id");
  }
  return structuredClone(snapshot);
}

export function retrieveGovernedActorLabPrivateMemoryV01(
  snapshot: GovernedActorLabPrivateMemorySnapshotV01,
  request: {
    experiment_id: string;
    lab_actor_id: string;
    task_family_key: string;
    allowed_source_refs: GovernedActorLabSyntheticSourceV01[];
  },
): GovernedActorLabMemoryItemV01[] {
  const memory = readGovernedActorLabPrivateMemoryV01(snapshot, request);
  requiredIdV01(request.task_family_key, "$.task_family_key");
  request.allowed_source_refs.forEach((source, index) =>
    validateSyntheticSourceV01(source, `$.allowed_source_refs[${index}]`),
  );
  const retrieved: GovernedActorLabMemoryItemV01[] = [];
  for (const [index, item] of memory.items.entries()) {
    if (item.task_family_key !== request.task_family_key) continue;
    const reasons = memoryItemMaterialReasonsV01(item, request.allowed_source_refs);
    if (reasons.length > 0) {
      failV01(
        "actor_lab_memory_retrieval_item_refused",
        `$.items[${index}]:${reasons.join(",")}`,
      );
    }
    if (item.status !== "current") continue;
    if (item.quarantine_reasons.length > 0) continue;
    if (item.support_status !== "support_validated") continue;
    retrieved.push(item);
  }
  return structuredClone(retrieved.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id),
  ));
}

export function admitGovernedActorLabMemoryCandidateV01(
  snapshotInput: GovernedActorLabPrivateMemorySnapshotV01,
  candidateInput: GovernedActorLabMemoryCandidateV01,
  options: {
    evaluation_frozen: boolean;
    intervention_evaluations?: GovernedActorLabInterventionEvaluationV01[];
  },
): { admission: GovernedActorLabMemoryAdmissionV01; snapshot: GovernedActorLabPrivateMemorySnapshotV01 } {
  const snapshot = structuredClone(snapshotInput);
  const candidate = structuredClone(candidateInput);
  assertMemorySnapshotV01(snapshot);
  validateMemoryCandidateV01(candidate);
  if (!options.evaluation_frozen) {
    failV01("actor_lab_memory_write_before_evaluation_freeze", "$.evaluation_frozen");
  }
  if (candidate.experiment_id !== snapshot.experiment_id) {
    failV01("actor_lab_cross_experiment_memory_write_refused", "$.candidate.experiment_id");
  }
  if (candidate.lab_actor_id !== snapshot.lab_actor_id) {
    failV01("actor_lab_cross_actor_memory_write_refused", "$.candidate.lab_actor_id");
  }
  const duplicate = snapshot.items.find((item) =>
    item.status === "current" &&
    item.task_family_key === candidate.task_family_key &&
    item.bounded_content === candidate.bounded_content,
  );
  const poisonReasons = memoryPoisonReasonsV01(candidate);
  const interventionEvidenceValid = validateCandidateInterventionEvidenceV01(
    candidate,
    options.intervention_evaluations ?? [],
  );
  const permission = memoryPermissionV01(
    candidate,
    poisonReasons,
    interventionEvidenceValid,
  );
  let operation: GovernedActorLabMemoryOperationV01 = candidate.requested_operation;
  let createdMemoryItemId: string | null = null;
  const affectedMemoryItemIds: string[] = [];
  if (duplicate) operation = "no_change";
  if (permission !== "permitted") operation = "no_change";

  if (operation === "add") {
    if (candidate.target_memory_item_id !== null) {
      failV01("actor_lab_memory_add_target_forbidden", "$.candidate.target_memory_item_id");
    }
    const item = buildMemoryItemV01(candidate, null, null);
    snapshot.items.push(item);
    createdMemoryItemId = item.memory_item_id;
    affectedMemoryItemIds.push(item.memory_item_id);
  } else if (operation === "revise" || operation === "supersede") {
    const target = requiredCurrentTargetV01(snapshot, candidate.target_memory_item_id);
    const item = buildMemoryItemV01(candidate, target.memory_item_id, null);
    target.status = "superseded";
    target.superseded_by_memory_item_id = item.memory_item_id;
    target.memory_item_fingerprint = memoryItemFingerprintV01(target);
    snapshot.items.push(item);
    createdMemoryItemId = item.memory_item_id;
    affectedMemoryItemIds.push(target.memory_item_id, item.memory_item_id);
  } else if (operation === "retract") {
    const target = requiredCurrentTargetV01(snapshot, candidate.target_memory_item_id);
    target.status = "retracted";
    target.retracts_memory_item_id = target.memory_item_id;
    target.memory_item_fingerprint = memoryItemFingerprintV01(target);
    affectedMemoryItemIds.push(target.memory_item_id);
  }

  snapshot.items.sort((left, right) => compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id));
  if (snapshot.items.length > createGovernedActorLabMaterialBoundaryV01().max_memory_items_per_actor) {
    failV01("actor_lab_memory_item_limit_exceeded", "$.snapshot.items");
  }
  const nextSnapshot = operation === "no_change"
    ? structuredClone(snapshotInput)
    : buildMemorySnapshotV01({
        experimentId: snapshot.experiment_id,
        actorId: snapshot.lab_actor_id,
        generation: snapshot.generation,
        parent: memoryRefV01(snapshotInput),
        items: snapshot.items,
      });
  const admissionDraft = {
    candidate_id: candidate.candidate_id,
    experiment_id: candidate.experiment_id,
    lab_actor_id: candidate.lab_actor_id,
    episode_id: candidate.episode_id,
    consulted_memory_snapshot: memoryRefV01(snapshotInput),
    operation,
    permission,
    created_memory_item_id: createdMemoryItemId,
    affected_memory_item_ids: affectedMemoryItemIds.sort(compareProtocolCodeUnitsV01),
    duplicate_detected: Boolean(duplicate),
    quarantine_reasons: poisonReasons,
    evaluation_frozen_before_admission: true as const,
    durable_write_phase: "post_episode_only" as const,
    resulting_memory_snapshot: memoryRefV01(nextSnapshot),
  };
  const admission: GovernedActorLabMemoryAdmissionV01 = {
    admission_id: deriveSimpleIdV01("actor-lab-memory-admission", admissionDraft),
    ...admissionDraft,
  };
  return { admission, snapshot: nextSnapshot };
}

export function runGovernedActorLabEpisodeV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  generation: GovernedActorLabGenerationV01;
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
  case_source: GovernedActorLabSyntheticSourceV01;
}): GovernedActorLabEpisodeRunResultV01 {
  assertValidGovernedActorLabManifestV01(input.manifest);
  validateGenerationPopulationV01(input.generation, input.actors, input.memories, input.manifest);
  validateSyntheticSourceV01(input.case_source, "$.case_source");
  if (!input.manifest.tool_manifest.allowed_source_refs.some((source) => source.source_id === input.case_source.source_id && source.source_fingerprint === input.case_source.source_fingerprint)) {
    failV01("actor_lab_tool_source_outside_manifest", "$.case_source");
  }
  const actors = [...input.actors].sort(compareActorsV01);
  const memoryByActor = new Map(input.memories.map((memory) => [memory.lab_actor_id, memory]));
  const actorEpisodes: GovernedActorLabActorEpisodeV01[] = [];
  const actorOutcomes: GovernedActorLabEpisodeArtifactV01["evaluation"]["actor_outcomes"] = [];
  const episodeBasis = {
    experiment_id: input.manifest.experiment_id,
    generation: input.generation,
    case_id: input.case_source.source_id,
    actors: actors.map(actorRefV01),
  };
  const episodeId = deriveSimpleIdV01("actor-lab-episode", episodeBasis);
  const evaluatorFingerprint = input.manifest.evaluator.fingerprint;
  const evaluationId = deriveSimpleIdV01("actor-lab-evaluation", {
    ...episodeBasis,
    evaluator_fingerprint: evaluatorFingerprint,
  });
  const interventionEvaluations: GovernedActorLabInterventionEvaluationV01[] = [];
  for (const [index, actor] of actors.entries()) {
    const memory = memoryByActor.get(actor.lab_actor_id);
    if (!memory) failV01("actor_lab_actor_memory_missing", `$.actors[${index}]`);
    if (actor.private_memory.memory_snapshot_id !== memory.memory_snapshot_id || actor.private_memory.memory_snapshot_fingerprint !== memory.integrity.fingerprint) {
      failV01("actor_lab_actor_memory_binding_mismatch", `$.actors[${index}].private_memory`);
    }
    const retrieved = retrieveGovernedActorLabPrivateMemoryV01(memory, {
      experiment_id: input.manifest.experiment_id,
      lab_actor_id: actor.lab_actor_id,
      task_family_key: input.case_source.task_family_key,
      allowed_source_refs: input.manifest.tool_manifest.allowed_source_refs,
    });
    const peer = actors[(index + 1) % actors.length]!;
    const actorInterventions = buildInterventionEvaluationsV01({
      manifest: input.manifest,
      actor,
      retrieved,
      caseSource: input.case_source,
      episodeId,
      evaluationId,
    });
    interventionEvaluations.push(...actorInterventions);
    const traces = buildItemTracesV01(
      actor,
      memory,
      retrieved,
      actorInterventions,
      episodeId,
      input.case_source,
    );
    actorEpisodes.push({
      lab_actor_id: actor.lab_actor_id,
      frozen_actor_snapshot: actorRefV01(actor),
      frozen_memory_snapshot: memoryRefV01(memory),
      blind_solve: {
        case_id: input.case_source.source_id,
        peer_solution_visible: false,
        hidden_holdout_visible: false,
        memory_write_count: 0,
        retrieved_memory_item_ids: retrieved.map((item) => item.memory_item_id),
        claim_refs: buildClaimRefsV01(actor, episodeId),
      },
      challenge: {
        round: 1,
        peer_artifact_id: deriveSimpleIdV01("actor-lab-peer-artifact", { episodeId, from: peer.lab_actor_id, to: actor.lab_actor_id }),
        peer_actor_id: peer.lab_actor_id,
        memory_write_count: 0,
      },
      synthesis: {
        synthesis_id: deriveSimpleIdV01("actor-lab-synthesis", { episodeId, actor: actor.lab_actor_id }),
        bounded: true,
        memory_write_count: 0,
        creates_product_decision: false,
        creates_product_transition: false,
      },
      item_traces: traces,
    });
    actorOutcomes.push({
      lab_actor_id: actor.lab_actor_id,
      outcome: developmentOutcomeV01(actor, traces, input.generation),
      complete: true,
    });
  }
  interventionEvaluations.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.intervention_id, right.intervention_id),
  );
  const evaluationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      evaluation_id: evaluationId,
      evaluator_fingerprint: evaluatorFingerprint,
      actor_outcomes: actorOutcomes,
      intervention_evaluations: interventionEvaluations,
    }),
  );
  let nextMemories = structuredClone(input.memories);
  const admissions: GovernedActorLabMemoryAdmissionV01[] = [];
  const actorsWithCurrentMemory = actors
    .filter((actor) =>
      nextMemories
        .find((memory) => memory.lab_actor_id === actor.lab_actor_id)
        ?.items.some((item) => item.status === "current"),
    )
    .map((actor) => actor.lab_actor_id);
  for (const [index, actor] of actors.entries()) {
    const currentIndex = nextMemories.findIndex((memory) => memory.lab_actor_id === actor.lab_actor_id);
    if (currentIndex < 0) failV01("actor_lab_actor_memory_missing");
    const candidate = buildEpisodeMemoryCandidateV01({
      manifest: input.manifest,
      episodeId,
      actor,
      memory: nextMemories[currentIndex]!,
      generation: input.generation,
      source: input.case_source,
      actorIndex: index,
      existingMemoryIndex: actorsWithCurrentMemory.indexOf(actor.lab_actor_id),
      interventionEvaluations,
    });
    const admitted = admitGovernedActorLabMemoryCandidateV01(
      nextMemories[currentIndex]!,
      candidate,
      {
        evaluation_frozen: true,
        intervention_evaluations: interventionEvaluations,
      },
    );
    nextMemories[currentIndex] = admitted.snapshot;
    admissions.push(admitted.admission);
  }
  nextMemories = nextMemories.sort(compareMemoriesV01);
  const draft: GovernedActorLabEpisodeArtifactV01 = {
    episode_version: GOVERNED_ACTOR_LAB_EPISODE_VERSION_V01,
    episode_id: episodeId,
    experiment_id: input.manifest.experiment_id,
    generation: input.generation,
    case_id: input.case_source.source_id,
    phase_order: ["blind_solve", "challenge_round_1", "bounded_synthesis", "evaluation_freeze", "post_episode_memory_admission"],
    memory_snapshots_frozen_at_start: true,
    challenge_round_count: 1,
    actor_episodes: actorEpisodes,
    evaluation: {
      evaluation_id: evaluationId,
      evaluation_fingerprint: evaluationFingerprint,
      evaluator_fingerprint: evaluatorFingerprint,
      frozen: true,
      frozen_before_memory_admission: true,
      actor_outcomes: actorOutcomes,
      intervention_evaluations: interventionEvaluations,
    },
    memory_admissions: admissions,
    product_effects: createGovernedActorLabProductEffectLedgerV01(),
    integrity: pendingIntegrityV01(),
  };
  const episode = sealObjectV01(draft);
  return { episode, memories: nextMemories };
}

export function buildGovernedActorLabPopulationTransitionV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
  episode: GovernedActorLabEpisodeArtifactV01;
  to_generation: 1 | 2;
}): GovernedActorLabTransitionResultV01 {
  const fromGeneration = input.to_generation - 1 as 0 | 1;
  if (input.episode.generation !== fromGeneration) failV01("actor_lab_transition_episode_generation_mismatch");
  validateGenerationPopulationV01(
    fromGeneration,
    input.actors,
    input.memories,
    input.manifest,
    false,
  );
  const actorById = new Map(input.actors.map((actor) => [actor.lab_actor_id, actor]));
  const memoryById = new Map(input.memories.map((memory) => [memory.lab_actor_id, memory]));
  const complete = input.episode.evaluation.actor_outcomes.filter((entry) => entry.complete);
  const incompleteIds = input.episode.evaluation.actor_outcomes.filter((entry) => !entry.complete).map((entry) => entry.lab_actor_id).sort(compareProtocolCodeUnitsV01);
  const excluded = complete.filter((entry) => entry.outcome.verification.hard_gate_failure === true).map((entry) => entry.lab_actor_id).sort(compareProtocolCodeUnitsV01);
  const eligible = complete.filter((entry) => entry.outcome.verification.hard_gate_failure === false);
  const nonDominated = nonDominatedActorsV01(eligible).sort(compareProtocolCodeUnitsV01);
  const conservative = incompleteIds;
  const parentPoolIds = uniqueStringsV01([
    ...nonDominated,
    ...eligible.map((entry) => entry.lab_actor_id),
    ...conservative,
  ]);
  if (parentPoolIds.length === 0) failV01("actor_lab_no_selection_evidence");
  const selectedParentIds = preserveProfileDiversityV01(parentPoolIds, actorById);
  const childActors: GovernedActorLabActorSnapshotV01[] = [];
  const childMemories: GovernedActorLabPrivateMemorySnapshotV01[] = [];
  const mutations: GovernedActorLabMutationV01[] = [];
  const retained = new Set<string>();
  for (let slot = 0; slot < GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01; slot += 1) {
    const parentId = selectedParentIds[slot % selectedParentIds.length]!;
    const parent = actorById.get(parentId);
    const parentMemory = memoryById.get(parentId);
    if (!parent || !parentMemory) failV01("actor_lab_transition_parent_missing");
    const keepIdentity = !retained.has(parentId);
    retained.add(parentId);
    const actorId = keepIdentity
      ? parentId
      : `${parentId}.g${input.to_generation}.b${slot}`;
    const childMemory = buildMemorySnapshotV01({
      experimentId: input.manifest.experiment_id,
      actorId,
      generation: input.to_generation,
      parent: memoryRefV01(parentMemory),
      items: keepIdentity
        ? parentMemory.items
        : inheritAdmissibleMemoryItemsV01(parentMemory, actorId),
    });
    const shouldMutate = slot >= 2 || excluded.length > 0;
    const mutation = shouldMutate
      ? buildMutationV01(input.manifest, parent, input.to_generation, slot)
      : null;
    if (mutation) mutations.push(mutation);
    const profile = mutation ? applyMutationV01(parent.profile, mutation) : structuredClone(parent.profile);
    const actor = buildActorSnapshotV01({
      manifest: input.manifest,
      actorId,
      generation: input.to_generation,
      parent: actorRefV01(parent),
      profile,
      memory: memoryRefV01(childMemory),
      mutations: mutation ? [mutationRefV01(mutation)] : [],
    });
    childMemories.push(childMemory);
    childActors.push(actor);
  }
  childActors.sort(compareActorsV01);
  childMemories.sort(compareMemoriesV01);
  const transitionDraft: GovernedActorLabPopulationTransitionV01 = {
    transition_id: "actor-lab-population-transition:pending",
    experiment_id: input.manifest.experiment_id,
    from_generation: fromGeneration,
    to_generation: input.to_generation,
    hard_gate_excluded_actor_ids: excluded,
    non_dominated_actor_ids: nonDominated,
    conservatively_preserved_actor_ids: conservative,
    diversity_preserved: true,
    deterministic_ties: true,
    ordinal_ranking_created: false,
    global_winner_created: false,
    product_promotion_created: false,
    selection_evaluation_ref: evaluationRefV01(input.episode),
    parent_post_episode_memory_refs: [...input.memories]
      .sort(compareMemoriesV01)
      .map((memory) => ({ lab_actor_id: memory.lab_actor_id, memory: memoryRefV01(memory) })),
    child_start_memory_refs: childMemories.map((memory) => {
      const child = childActors.find((actor) => actor.lab_actor_id === memory.lab_actor_id);
      const parent = input.actors.find(
        (actor) => actor.actor_snapshot_id === child?.parent_actor_ref?.actor_snapshot_id,
      );
      if (!child || !parent) failV01("actor_lab_transition_child_parent_lineage_invalid");
      return {
        lab_actor_id: memory.lab_actor_id,
        parent_lab_actor_id: parent.lab_actor_id,
        memory: memoryRefV01(memory),
      };
    }),
    branch_memory_policy: "inherit_admissible_private_memory",
    branch_memory_reset_intervention: false,
    mutations: mutations.sort((left, right) => compareProtocolCodeUnitsV01(left.mutation_id, right.mutation_id)),
    child_actor_refs: childActors.map(actorRefV01),
    integrity: pendingIntegrityV01(),
  };
  const transitionId = deriveIdV01("actor-lab-population-transition", transitionDraft, "transition_id");
  return {
    transition: sealObjectV01({ ...transitionDraft, transition_id: transitionId }),
    actors: childActors,
    memories: childMemories,
  };
}

/**
 * Applies the merged C1 G0-to-G1-to-G2 selection, diversity, mutation, and
 * admissible-memory inheritance semantics to a separately frozen evaluator
 * projection. The synthetic episode projection is internal and is never
 * persisted as a C1 episode artifact.
 */
export function buildGovernedActorLabPopulationTransitionFromFrozenEvaluationV01(
  input: {
    manifest: GovernedActorLabExperimentManifestV01;
    actors: GovernedActorLabActorSnapshotV01[];
    memories: GovernedActorLabPrivateMemorySnapshotV01[];
    from_generation: 0 | 1;
    to_generation: 1 | 2;
    evaluation: {
      evaluation_id: string;
      evaluation_fingerprint: string;
      actor_outcomes: GovernedActorLabEpisodeArtifactV01["evaluation"]["actor_outcomes"];
    };
  },
): GovernedActorLabTransitionResultV01 {
  requiredIdV01(input.evaluation.evaluation_id, "$.evaluation.evaluation_id");
  if (!SHA256_PATTERN.test(input.evaluation.evaluation_fingerprint)) {
    failV01(
      "actor_lab_evaluation_fingerprint_invalid",
      "$.evaluation.evaluation_fingerprint",
    );
  }
  if (input.to_generation !== input.from_generation + 1) {
    failV01("actor_lab_transition_episode_generation_mismatch");
  }
  const selectionProjection = {
    generation: input.from_generation,
    evaluation: {
      evaluation_id: input.evaluation.evaluation_id,
      evaluation_fingerprint: input.evaluation.evaluation_fingerprint,
      actor_outcomes: structuredClone(input.evaluation.actor_outcomes),
    },
  } as unknown as GovernedActorLabEpisodeArtifactV01;
  return buildGovernedActorLabPopulationTransitionV01({
    manifest: input.manifest,
    actors: input.actors,
    memories: input.memories,
    episode: selectionProjection,
    to_generation: input.to_generation,
  });
}

export function evaluateGovernedActorLabHiddenHoldoutV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  actors: GovernedActorLabActorSnapshotV01[];
  holdout: GovernedActorLabHoldoutFixtureV01;
}): GovernedActorLabOutcomeVectorV01 {
  assertValidGovernedActorLabManifestV01(input.manifest);
  if (
    input.actors.length !== GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01 ||
    new Set(input.actors.map((actor) => actor.lab_actor_id)).size !==
      GOVERNED_ACTOR_LAB_GENERATION_ZERO_SIZE_V01 ||
    input.actors.some((actor) => actor.generation !== 2 || actor.state_frozen !== true)
  ) {
    failV01("actor_lab_holdout_actor_state_not_frozen");
  }
  for (const actor of input.actors) {
    if (actor.experiment_id !== input.manifest.experiment_id) {
      failV01("actor_lab_holdout_actor_scope_mismatch");
    }
    if (
      actor.tool_manifest_fingerprint !==
        input.manifest.tool_manifest.integrity.fingerprint ||
      actor.capability_ceiling_fingerprint !==
        input.manifest.tool_manifest.integrity.fingerprint
    ) {
      failV01("actor_lab_capability_scope_expanded");
    }
    assertAuthorityAllFalseV01(actor.authority_summary);
    assertIntegrityV01(actor, "$.holdout_actor.integrity");
  }
  return evaluateHoldoutProfilesV01(
    input.manifest,
    input.actors.map((actor) => actor.profile),
    input.holdout,
  );
}

function evaluateHoldoutProfilesV01(
  manifest: GovernedActorLabExperimentManifestV01,
  profiles: GovernedActorLabActorProfileV01[],
  holdout: GovernedActorLabHoldoutFixtureV01,
): GovernedActorLabOutcomeVectorV01 {
  if (holdout.holdout_id !== manifest.hidden_holdout.holdout_id || holdout.holdout_fingerprint !== manifest.hidden_holdout.holdout_fingerprint) {
    failV01("actor_lab_holdout_identity_mismatch");
  }
  const computed = createProtocolSha256V01(canonicalizeProtocolValueV01(holdout.content));
  if (computed !== holdout.holdout_fingerprint) {
    failV01("actor_lab_holdout_fingerprint_mismatch");
  }
  let passed = 0;
  let failed = 0;
  let harmful = 0;
  for (const testCase of holdout.content.cases) {
    const matched = profiles.some((profile) => profile.procedural_operator_policy === testCase.required_policy_signal);
    if (matched) passed += 1;
    else failed += 1;
    if (testCase.harmful_transfer_trap && profiles.every((profile) => profile.evidence_retrieval_policy !== "falsifier_and_harm")) harmful += 1;
  }
  return outcomeVectorV01({
    hardGate: false,
    passedChecks: holdout.content.cases.length,
    supportedClaims: passed,
    unsupportedClaims: failed,
    holdoutPassed: passed,
    holdoutFailed: failed,
    eligible: 0,
    retrieved: 0,
    presented: 0,
    cited: 0,
    supportValidated: 0,
    outcomeAssociated: 0,
    causal: 0,
    quarantined: 0,
    harmful,
    poisonRefusals: 0,
    interference: 0,
    challenges: 0,
    syntheses: 0,
    reviews: 0,
    toolReads: manifest.compute_budget.tool_read_limit,
    steps: manifest.compute_budget.step_limit,
  });
}

export function buildGovernedActorLabBaselineObservationsV01(
  input: {
    manifest: GovernedActorLabExperimentManifestV01;
    development_sources: readonly [
      GovernedActorLabSyntheticSourceV01,
      GovernedActorLabSyntheticSourceV01,
      GovernedActorLabSyntheticSourceV01,
    ];
    hidden_holdout: GovernedActorLabHoldoutFixtureV01;
    evolutionary_episodes: GovernedActorLabEpisodeArtifactV01[];
    evolutionary_transitions: GovernedActorLabPopulationTransitionV01[];
    evolutionary_final_actors: GovernedActorLabActorSnapshotV01[];
  },
): GovernedActorLabBaselineObservationV01[] {
  assertValidGovernedActorLabManifestV01(input.manifest);
  const fixedNonpersistent = runFixedBaselinePopulationV01({
    ...input,
    persistent: false,
  });
  const fixedPersistent = runFixedBaselinePopulationV01({
    ...input,
    persistent: true,
  });
  const curated = runCuratedKnowledgeBaselineV01(input);
  const strong = runSingleStrongBaselineV01(input);
  const evolutionary: GovernedActorLabBaselineExecutionV01 = {
    episodes: input.evolutionary_episodes.map(baselineExecutedEpisodeV01),
    finalActors: input.evolutionary_final_actors,
    transitionRefs: input.evolutionary_transitions.map((transition) => ({
      transition_id: transition.transition_id,
      transition_fingerprint: transition.integrity.fingerprint,
    })),
    actorCount: 4,
    memoryResetCount: 0,
    singleActorRepetitions: 0,
    curatedInput: null,
  };
  const executions: Record<GovernedActorLabBaselineArmV01, GovernedActorLabBaselineExecutionV01> = {
    single_strong_actor: strong,
    nonpersistent_compute_matched_ensemble: fixedNonpersistent,
    persistent_population_no_evolution: fixedPersistent,
    persistent_evolutionary_population: evolutionary,
    disposable_curated_knowledge: curated,
  };
  return GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01.map((arm) => {
    const execution = executions[arm];
    const persistent = arm === "persistent_population_no_evolution" || arm === "persistent_evolutionary_population";
    const mutation = arm === "persistent_evolutionary_population";
    const curated = arm === "disposable_curated_knowledge";
    const armSeed = createProtocolSha256V01(canonicalizeProtocolValueV01({
      deterministic_seed: input.manifest.deterministic_seed,
      arm,
    }));
    const actorHardGateObservations = baselineActorHardGateObservationsV01(execution);
    const computeAccounting = deriveGovernedActorLabBaselineComputeAccountingV01(
      actorHardGateObservations,
      input.manifest.compute_budget,
    );
    const armHardGate = deriveGovernedActorLabBaselineArmHardGateV01(
      actorHardGateObservations,
      computeAccounting,
    );
    const outcome = aggregateBaselineExecutionOutcomeV01(
      input.manifest,
      execution,
      input.hidden_holdout,
      armHardGate,
      computeAccounting,
    );
    const comparable = armHardGate.arm_completed && computeAccounting.exact_budget_match;
    const draft: GovernedActorLabBaselineObservationV01 = {
      baseline_version: "governed_actor_lab_baseline_observation.v0.1",
      observation_id: "actor-lab-baseline-observation:pending",
      arm,
      experiment_id: input.manifest.experiment_id,
      manifest_ref: {
        experiment_id: input.manifest.experiment_id,
        experiment_fingerprint: input.manifest.integrity.fingerprint,
      },
      evaluator: structuredClone(input.manifest.evaluator),
      actor_engine: structuredClone(input.manifest.actor_engine),
      development_case_sequence: structuredClone([...input.development_sources]),
      hidden_holdout_ref: {
        holdout_id: input.hidden_holdout.holdout_id,
        holdout_fingerprint: input.hidden_holdout.holdout_fingerprint,
      },
      budget_id: input.manifest.compute_budget.budget_id,
      budget_fingerprint: input.manifest.compute_budget.integrity.fingerprint,
      deterministic_seed: input.manifest.deterministic_seed,
      arm_seed: armSeed,
      exact_budget_match: computeAccounting.exact_budget_match,
      comparable,
      comparison_status: comparable ? "comparable" : "non_comparable",
      non_comparable_reasons: comparable
        ? []
        : uniqueStringsV01([
            ...armHardGate.arm_level_hard_gate_failure_codes,
            ...(computeAccounting.exact_budget_match ? [] : ["exact_budget_mismatch"]),
          ]),
      persistent_memory: persistent,
      mutation_enabled: mutation,
      curated_knowledge: curated,
      execution: {
        episode_count: 3,
        actor_count: execution.actorCount,
        memory_reset_count: execution.memoryResetCount,
        memory_persistence_setting: persistent ? "private_cross_episode" : "none",
        mutation_setting: mutation ? "g0_to_g1_to_g2" : "none",
        curated_input_refs: curated ? structuredClone([...input.development_sources]) : [],
        curated_input: structuredClone(execution.curatedInput),
        single_actor_repetitions: execution.singleActorRepetitions,
        episode_evaluation_refs: execution.episodes.map((episode) => episode.evaluationRef),
        actor_hard_gate_observations: actorHardGateObservations,
        arm_hard_gate: armHardGate,
        compute_accounting: computeAccounting,
        transition_refs: structuredClone(execution.transitionRefs),
      },
      outcome,
      complete: armHardGate.arm_completed,
      mechanics_only: true,
      limitations: baselineLimitationsV01(arm),
      integrity: pendingIntegrityV01(),
    };
    const observationId = deriveIdV01(
      "actor-lab-baseline-observation",
      draft,
      "observation_id",
    );
    return sealObjectV01({ ...draft, observation_id: observationId });
  });
}

interface GovernedActorLabBaselineExecutionV01 {
  episodes: GovernedActorLabBaselineExecutedEpisodeV01[];
  finalActors: GovernedActorLabActorSnapshotV01[];
  transitionRefs: Array<{
    transition_id: string;
    transition_fingerprint: string;
  }>;
  actorCount: number;
  memoryResetCount: number;
  singleActorRepetitions: number;
  curatedInput: GovernedActorLabCuratedKnowledgeInputV01 | null;
}

interface GovernedActorLabBaselineExecutedEpisodeV01 {
  evaluationRef: GovernedActorLabEvaluationReferenceV01;
  actorOutcomes: GovernedActorLabEpisodeArtifactV01["evaluation"]["actor_outcomes"];
  traces: GovernedActorLabItemTraceV01[];
  challengeCount: number;
  synthesisCount: number;
  reviewOperations: number;
}

function runFixedBaselinePopulationV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  development_sources: readonly [
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
  ];
  persistent: boolean;
}): GovernedActorLabBaselineExecutionV01 {
  let state = buildGovernedActorLabGenerationZeroV01(input.manifest);
  const episodes: GovernedActorLabBaselineExecutedEpisodeV01[] = [];
  for (const [index, source] of input.development_sources.entries()) {
    const generation = index as GovernedActorLabGenerationV01;
    const episode = runGovernedActorLabEpisodeV01({
      manifest: input.manifest,
      generation,
      actors: state.actors,
      memories: state.memories,
      case_source: source,
    });
    episodes.push(baselineExecutedEpisodeV01(episode.episode));
    if (index < input.development_sources.length - 1) {
      state = rebaseFixedBaselinePopulationV01({
        manifest: input.manifest,
        actors: state.actors,
        postEpisodeMemories: episode.memories,
        toGeneration: (index + 1) as 1 | 2,
        persistent: input.persistent,
      });
    }
  }
  return {
    episodes,
    finalActors: state.actors,
    transitionRefs: [],
    actorCount: 4,
    memoryResetCount: input.persistent ? 0 : 8,
    singleActorRepetitions: 0,
    curatedInput: null,
  };
}

function runSingleStrongBaselineV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  development_sources: readonly [
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
  ];
}): GovernedActorLabBaselineExecutionV01 {
  const initial = buildGovernedActorLabGenerationZeroV01(input.manifest);
  let actor = initial.actors[0]!;
  const episodes: GovernedActorLabBaselineExecutedEpisodeV01[] = [];
  const repetitionsPerCase =
    input.manifest.compute_budget.tool_read_limit /
    input.development_sources.length;
  if (!Number.isInteger(repetitionsPerCase) || repetitionsPerCase <= 0) {
    failV01("actor_lab_single_actor_budget_not_divisible");
  }
  for (const [index, source] of input.development_sources.entries()) {
    const generation = index as GovernedActorLabGenerationV01;
    const actorOutcomes = Array.from({ length: repetitionsPerCase }, (_, repetition) => ({
      lab_actor_id: actor.lab_actor_id,
      outcome: developmentOutcomeV01(actor, [], generation),
      complete: true,
      repetition,
    })).map(({ repetition: _repetition, ...entry }) => entry);
    const evaluationId = deriveSimpleIdV01("actor-lab-baseline-evaluation", {
      arm: "single_strong_actor",
      actor: actorRefV01(actor),
      case_source: source,
      evaluator: input.manifest.evaluator,
      repetitions: repetitionsPerCase,
    });
    const evaluationFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({ evaluation_id: evaluationId, actorOutcomes }),
    );
    episodes.push({
      evaluationRef: {
        evaluation_id: evaluationId,
        evaluation_fingerprint: evaluationFingerprint,
      },
      actorOutcomes,
      traces: [],
      challengeCount: repetitionsPerCase,
      synthesisCount: repetitionsPerCase,
      reviewOperations: repetitionsPerCase,
    });
    if (index < input.development_sources.length - 1) {
      const nextMemory = buildMemorySnapshotV01({
        experimentId: input.manifest.experiment_id,
        actorId: actor.lab_actor_id,
        generation: (index + 1) as 1 | 2,
        parent: null,
        items: [],
      });
      actor = buildActorSnapshotV01({
        manifest: input.manifest,
        actorId: actor.lab_actor_id,
        generation: (index + 1) as 1 | 2,
        parent: actorRefV01(actor),
        profile: actor.profile,
        memory: memoryRefV01(nextMemory),
        mutations: [],
      });
    }
  }
  return {
    episodes,
    finalActors: [actor],
    transitionRefs: [],
    actorCount: 1,
    memoryResetCount: 2,
    singleActorRepetitions: input.manifest.compute_budget.tool_read_limit,
    curatedInput: null,
  };
}

export function buildGovernedActorLabCuratedKnowledgeInputV01(
  manifest: GovernedActorLabExperimentManifestV01,
  developmentSources: readonly GovernedActorLabSyntheticSourceV01[],
): GovernedActorLabCuratedKnowledgeInputV01 {
  assertValidGovernedActorLabManifestV01(manifest);
  if (developmentSources.length !== 3) {
    failV01("actor_lab_curated_source_count_invalid", "$.development_sources");
  }
  const proceduralPolicies: GovernedActorLabActorProfileV01["procedural_operator_policy"][] = [
    "verification_first",
    "scope_sentinel",
    "counterexample_search",
  ];
  const retrievalPolicies: GovernedActorLabActorProfileV01["evidence_retrieval_policy"][] = [
    "support_and_currentness",
    "scope_and_conflict",
    "falsifier_and_harm",
  ];
  const items = developmentSources.map((source, index) => {
    validateSyntheticSourceV01(source, `$.development_sources[${index}]`);
    const admitted = manifest.tool_manifest.allowed_source_refs.find(
      (candidate) =>
        canonicalizeProtocolValueV01(candidate) === canonicalizeProtocolValueV01(source),
    );
    if (!admitted) failV01("actor_lab_curated_source_not_admitted", `$.development_sources[${index}]`);
    if (Date.parse(source.available_at) > Date.parse(manifest.experiment_scope.decision_time_cutoff)) {
      failV01("actor_lab_curated_hindsight_source_forbidden", `$.development_sources[${index}]`);
    }
    return {
      source_ref: structuredClone(source),
      procedural_operator_policy: proceduralPolicies[index]!,
      evidence_retrieval_policy: retrievalPolicies[index]!,
    };
  });
  const draft: GovernedActorLabCuratedKnowledgeInputV01 = {
    curated_input_version: "governed_actor_lab_curated_knowledge.v0.1",
    curated_input_id: "actor-lab-curated-knowledge:pending",
    construction: "deterministic_pre_cutoff_source_compilation",
    items,
    persistent_actor_private_memory: false,
    mutation_or_evolution: false,
    hidden_holdout_material_included: false,
    provider_or_model_material_included: false,
    integrity: pendingIntegrityV01(),
  };
  const curatedInputId = deriveIdV01(
    "actor-lab-curated-knowledge",
    draft,
    "curated_input_id",
  );
  const result = sealObjectV01({ ...draft, curated_input_id: curatedInputId });
  assertCuratedKnowledgeInputV01(result, manifest.tool_manifest.allowed_source_refs);
  return result;
}

function runCuratedKnowledgeBaselineV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  development_sources: readonly [
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
  ];
}): GovernedActorLabBaselineExecutionV01 {
  const initial = buildGovernedActorLabGenerationZeroV01(input.manifest);
  const curatedInput = buildGovernedActorLabCuratedKnowledgeInputV01(
    input.manifest,
    input.development_sources,
  );
  const repetitionsPerCase =
    input.manifest.compute_budget.tool_read_limit / input.development_sources.length;
  if (!Number.isInteger(repetitionsPerCase) || repetitionsPerCase <= 0) {
    failV01("actor_lab_curated_budget_not_divisible");
  }
  const episodes: GovernedActorLabBaselineExecutedEpisodeV01[] = [];
  for (const [index, source] of input.development_sources.entries()) {
    const curatedItem = curatedInput.items[index]!;
    if (
      canonicalizeProtocolValueV01(curatedItem.source_ref) !==
      canonicalizeProtocolValueV01(source)
    ) failV01("actor_lab_curated_source_sequence_mismatch");
    const selectedActor = initial.actors.find(
      (actor) =>
        actor.profile.procedural_operator_policy === curatedItem.procedural_operator_policy &&
        actor.profile.evidence_retrieval_policy === curatedItem.evidence_retrieval_policy,
    );
    if (!selectedActor) failV01("actor_lab_curated_policy_actor_missing");
    const generation = index as GovernedActorLabGenerationV01;
    const actorOutcomes = Array.from({ length: repetitionsPerCase }, () => ({
      lab_actor_id: selectedActor.lab_actor_id,
      outcome: developmentOutcomeV01(selectedActor, [], generation),
      complete: true,
    }));
    const evaluationId = deriveSimpleIdV01("actor-lab-baseline-evaluation", {
      arm: "disposable_curated_knowledge",
      curated_input_id: curatedInput.curated_input_id,
      curated_item: curatedItem,
      selected_actor_profile: selectedActor.profile,
      case_source: source,
      evaluator: input.manifest.evaluator,
      repetitions: repetitionsPerCase,
    });
    episodes.push({
      evaluationRef: {
        evaluation_id: evaluationId,
        evaluation_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01({ evaluation_id: evaluationId, actorOutcomes }),
        ),
      },
      actorOutcomes,
      traces: [],
      challengeCount: repetitionsPerCase,
      synthesisCount: repetitionsPerCase,
      reviewOperations: repetitionsPerCase,
    });
  }
  const finalActors = initial.actors.map((actor) => {
    const memory = buildMemorySnapshotV01({
      experimentId: input.manifest.experiment_id,
      actorId: actor.lab_actor_id,
      generation: 2,
      parent: null,
      items: [],
    });
    return buildActorSnapshotV01({
      manifest: input.manifest,
      actorId: actor.lab_actor_id,
      generation: 2,
      parent: null,
      profile: actor.profile,
      memory: memoryRefV01(memory),
      mutations: [],
    });
  });
  return {
    episodes,
    finalActors,
    transitionRefs: [],
    actorCount: 4,
    memoryResetCount: 8,
    singleActorRepetitions: 0,
    curatedInput,
  };
}

function rebaseFixedBaselinePopulationV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  actors: GovernedActorLabActorSnapshotV01[];
  postEpisodeMemories: GovernedActorLabPrivateMemorySnapshotV01[];
  toGeneration: 1 | 2;
  persistent: boolean;
}): {
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
} {
  const postByActor = new Map(
    input.postEpisodeMemories.map((memory) => [memory.lab_actor_id, memory]),
  );
  const memories = [...input.actors].sort(compareActorsV01).map((actor) => {
    const post = postByActor.get(actor.lab_actor_id);
    if (!post) failV01("actor_lab_baseline_post_memory_missing");
    return buildMemorySnapshotV01({
      experimentId: input.manifest.experiment_id,
      actorId: actor.lab_actor_id,
      generation: input.toGeneration,
      parent: input.persistent ? memoryRefV01(post) : null,
      items: input.persistent ? post.items : [],
    });
  });
  const actors = [...input.actors].sort(compareActorsV01).map((actor, index) =>
    buildActorSnapshotV01({
      manifest: input.manifest,
      actorId: actor.lab_actor_id,
      generation: input.toGeneration,
      parent: actorRefV01(actor),
      profile: actor.profile,
      memory: memoryRefV01(memories[index]!),
      mutations: [],
    }),
  );
  return { actors, memories };
}

/** Reuses the merged C1 fixed-population reset/persistence semantics. */
export function rebaseGovernedActorLabFixedPopulationV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  actors: GovernedActorLabActorSnapshotV01[];
  post_episode_memories: GovernedActorLabPrivateMemorySnapshotV01[];
  to_generation: 1 | 2;
  persistent: boolean;
}): {
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
} {
  assertValidGovernedActorLabManifestV01(input.manifest);
  return rebaseFixedBaselinePopulationV01({
    manifest: input.manifest,
    actors: input.actors,
    postEpisodeMemories: input.post_episode_memories,
    toGeneration: input.to_generation,
    persistent: input.persistent,
  });
}

function baselineActorHardGateObservationsV01(
  execution: GovernedActorLabBaselineExecutionV01,
): GovernedActorLabBaselineActorHardGateObservationV01[] {
  return execution.episodes.flatMap((episode) =>
    episode.actorOutcomes.map((entry, observationIndex) => ({
      episode_evaluation_ref: structuredClone(episode.evaluationRef),
      observation_index: observationIndex,
      lab_actor_id: entry.lab_actor_id,
      complete: entry.complete,
      hard_gate_failure: entry.outcome.verification.hard_gate_failure,
      hard_gate_failure_codes: uniqueStringsV01(
        entry.outcome.verification.hard_gate_failure_codes,
      ),
      population_selection_excluded:
        entry.outcome.verification.hard_gate_failure === true,
      observed_compute: structuredClone(entry.outcome.compute),
    })),
  );
}

export function deriveGovernedActorLabBaselineComputeAccountingV01(
  observations: GovernedActorLabBaselineActorHardGateObservationV01[],
  budget: GovernedActorLabBudgetEnvelopeV01,
): GovernedActorLabBaselineComputeAccountingV01 {
  const allRequiredDimensionsObserved = observations.every(
    (observation) =>
      observation.observed_compute.tool_reads !== null &&
      observation.observed_compute.deterministic_steps !== null,
  );
  const toolReads = observations.reduce(
    (sum, observation) => sum + (observation.observed_compute.tool_reads ?? 0),
    0,
  );
  const deterministicSteps = observations.reduce(
    (sum, observation) =>
      sum + (observation.observed_compute.deterministic_steps ?? 0),
    0,
  );
  const providerCalls = observations.reduce(
    (sum, observation) => sum + observation.observed_compute.provider_calls,
    0,
  );
  const networkCalls = observations.reduce(
    (sum, observation) => sum + observation.observed_compute.network_calls,
    0,
  );
  const tokens = observations.reduce(
    (sum, observation) => sum + observation.observed_compute.tokens,
    0,
  );
  const costMicrounits = observations.reduce(
    (sum, observation) => sum + observation.observed_compute.cost_microunits,
    0,
  );
  const externalEffects = observations.reduce(
    (sum, observation) => sum + observation.observed_compute.external_effects,
    0,
  );
  const exactBudgetMatch =
    allRequiredDimensionsObserved &&
    toolReads === budget.tool_read_limit &&
    deterministicSteps === budget.step_limit &&
    providerCalls === 0 &&
    networkCalls === 0 &&
    tokens === 0 &&
    costMicrounits === 0 &&
    externalEffects === 0;
  return {
    accounting_basis: "sum_of_executed_actor_observations",
    all_required_dimensions_observed: allRequiredDimensionsObserved,
    provider_calls: providerCalls as 0,
    network_calls: networkCalls as 0,
    tool_reads: toolReads,
    deterministic_steps: deterministicSteps,
    tokens: tokens as 0,
    cost_microunits: costMicrounits as 0,
    external_effects: externalEffects as 0,
    exact_budget_match: exactBudgetMatch,
  };
}

export function deriveGovernedActorLabBaselineArmHardGateV01(
  observations: GovernedActorLabBaselineActorHardGateObservationV01[],
  compute: GovernedActorLabBaselineComputeAccountingV01,
): GovernedActorLabBaselineArmHardGateV01 {
  const codes: GovernedActorLabBaselineArmHardGateV01["arm_level_hard_gate_failure_codes"] = [];
  if (
    observations.length === 0 ||
    observations.some(
      (observation) =>
        observation.complete !== true || observation.hard_gate_failure === null,
    )
  ) codes.push("required_evaluation_incomplete");
  const byEvaluation = new Map<string, GovernedActorLabBaselineActorHardGateObservationV01[]>();
  for (const observation of observations) {
    const key = canonicalizeProtocolValueV01(observation.episode_evaluation_ref);
    const entries = byEvaluation.get(key) ?? [];
    entries.push(observation);
    byEvaluation.set(key, entries);
  }
  if (
    [...byEvaluation.values()].some(
      (entries) =>
        entries.filter(
          (entry) => entry.complete && entry.hard_gate_failure === false,
        ).length === 0,
    )
  ) codes.push("no_valid_population");
  if (!compute.exact_budget_match) codes.push("exact_budget_mismatch");
  if (
    compute.provider_calls !== 0 ||
    compute.network_calls !== 0 ||
    compute.tokens !== 0 ||
    compute.cost_microunits !== 0 ||
    compute.external_effects !== 0
  ) codes.push("forbidden_product_provider_network_effect");
  const canonicalCodes = uniqueStringsV01(codes) as GovernedActorLabBaselineArmHardGateV01["arm_level_hard_gate_failure_codes"];
  const actorFailureCount = observations.filter(
    (observation) => observation.hard_gate_failure === true,
  ).length;
  const exclusionCount = observations.filter(
    (observation) => observation.population_selection_excluded,
  ).length;
  const armCompleted =
    !canonicalCodes.includes("required_evaluation_incomplete") &&
    !canonicalCodes.includes("no_valid_population");
  return {
    arm_completed: armCompleted,
    arm_level_hard_gate_failure: canonicalCodes.length > 0,
    arm_level_hard_gate_failure_codes: canonicalCodes,
    actor_hard_gate_failure_count: actorFailureCount,
    population_selection_exclusion_count: exclusionCount,
    valid_actor_observation_count: observations.filter(
      (observation) => observation.complete && observation.hard_gate_failure === false,
    ).length,
    basis: "derived_from_serialized_actor_and_compute_observations",
  };
}

function aggregateBaselineExecutionOutcomeV01(
  manifest: GovernedActorLabExperimentManifestV01,
  execution: GovernedActorLabBaselineExecutionV01,
  holdout: GovernedActorLabHoldoutFixtureV01,
  armHardGate: GovernedActorLabBaselineArmHardGateV01,
  compute: GovernedActorLabBaselineComputeAccountingV01,
): GovernedActorLabOutcomeVectorV01 {
  const actorOutcomes = execution.episodes.flatMap(
    (episode) => episode.actorOutcomes,
  );
  const traces = execution.episodes.flatMap((episode) => episode.traces);
  const eligibleActorOutcomes = actorOutcomes.filter(
    (entry) => entry.complete && entry.outcome.verification.hard_gate_failure === false,
  );
  const holdoutOutcome = evaluateHoldoutProfilesV01(
    manifest,
    execution.finalActors.map((actor) => actor.profile),
    holdout,
  );
  return outcomeVectorV01({
    hardGate: armHardGate.arm_level_hard_gate_failure,
    hardGateCodes: armHardGate.arm_level_hard_gate_failure_codes,
    passedChecks: eligibleActorOutcomes.reduce((sum, entry) => sum + (entry.outcome.verification.required_checks_passed ?? 0), 0),
    supportedClaims: eligibleActorOutcomes.reduce((sum, entry) => sum + (entry.outcome.verification.support_validated_claims ?? 0), 0),
    unsupportedClaims: eligibleActorOutcomes.reduce((sum, entry) => sum + (entry.outcome.verification.unsupported_claims ?? 0), 0),
    holdoutPassed: holdoutOutcome.holdout.cases_passed ?? 0,
    holdoutFailed: holdoutOutcome.holdout.cases_failed ?? 0,
    holdoutUnknown: holdoutOutcome.holdout.unknown ?? 0,
    eligible: traces.filter((trace) => trace.eligible).length,
    retrieved: traces.filter((trace) => trace.retrieved).length,
    presented: traces.filter((trace) => trace.presented).length,
    cited: traces.filter((trace) => trace.cited_or_referenced).length,
    supportValidated: traces.filter((trace) => trace.support_validated).length,
    outcomeAssociated: traces.filter((trace) => trace.outcome_associated).length,
    causal: traces.filter((trace) => trace.causal_contribution === "matched_intervention_supported").length,
    quarantined: actorOutcomes.reduce((sum, entry) => sum + (entry.outcome.memory.quarantined ?? 0), 0),
    harmful: holdoutOutcome.harm.harmful_transfer_candidates ?? 0,
    poisonRefusals: actorOutcomes.reduce((sum, entry) => sum + (entry.outcome.harm.poisoning_refusals ?? 0), 0),
    interference: actorOutcomes.reduce((sum, entry) => sum + (entry.outcome.harm.stream_interference_candidates ?? 0), 0),
    challenges: execution.episodes.reduce((sum, episode) => sum + episode.challengeCount, 0),
    syntheses: execution.episodes.reduce((sum, episode) => sum + episode.synthesisCount, 0),
    reviews: execution.episodes.reduce((sum, episode) => sum + episode.reviewOperations, 0),
    toolReads: compute.tool_reads,
    steps: compute.deterministic_steps,
  });
}

function baselineExecutedEpisodeV01(
  episode: GovernedActorLabEpisodeArtifactV01,
): GovernedActorLabBaselineExecutedEpisodeV01 {
  return {
    evaluationRef: evaluationRefV01(episode),
    actorOutcomes: structuredClone(episode.evaluation.actor_outcomes),
    traces: episode.actor_episodes.flatMap((actorEpisode) => structuredClone(actorEpisode.item_traces)),
    challengeCount: episode.actor_episodes.length,
    synthesisCount: episode.actor_episodes.length,
    reviewOperations: episode.memory_admissions.length,
  };
}

function baselineLimitationsV01(arm: GovernedActorLabBaselineArmV01): string[] {
  if (arm === "single_strong_actor") return ["One fixed strongest profile is repeated through the exact deterministic compute envelope; replicas do not add policy diversity."];
  if (arm === "nonpersistent_compute_matched_ensemble") return ["Actor-private memory is actually reset at both cross-episode boundaries."];
  if (arm === "persistent_population_no_evolution") return ["Private memory persists while profiles and mutation refs remain fixed."];
  if (arm === "persistent_evolutionary_population") return ["The exact pilot G0-to-G1-to-G2 mutation and selection path is reused; mechanics do not prove model-evolution benefit."];
  return ["Frozen source-bound curated inputs are consumed without persistent actor memory."];
}

export function runGovernedActorLabPilotV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  development_sources: readonly [
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
  ];
  hidden_holdout: GovernedActorLabHoldoutFixtureV01;
}): GovernedActorLabPilotResultV01 {
  assertValidGovernedActorLabManifestV01(input.manifest);
  if (
    canonicalizeProtocolValueV01(input.development_sources) !==
    canonicalizeProtocolValueV01(input.manifest.tool_manifest.allowed_source_refs) ||
    canonicalizeProtocolValueV01(input.development_sources.map((source) => source.source_id)) !==
    canonicalizeProtocolValueV01(input.manifest.experiment_scope.development_case_ids)
  ) failV01("actor_lab_development_case_sequence_mismatch", "$.development_sources");
  const generationZero = buildGovernedActorLabGenerationZeroV01(input.manifest);
  const episodeZero = runGovernedActorLabEpisodeV01({
    manifest: input.manifest,
    generation: 0,
    actors: generationZero.actors,
    memories: generationZero.memories,
    case_source: input.development_sources[0],
  });
  const transitionOne = buildGovernedActorLabPopulationTransitionV01({
    manifest: input.manifest,
    actors: generationZero.actors,
    memories: episodeZero.memories,
    episode: episodeZero.episode,
    to_generation: 1,
  });
  const episodeOne = runGovernedActorLabEpisodeV01({
    manifest: input.manifest,
    generation: 1,
    actors: transitionOne.actors,
    memories: transitionOne.memories,
    case_source: input.development_sources[1],
  });
  const transitionTwo = buildGovernedActorLabPopulationTransitionV01({
    manifest: input.manifest,
    actors: transitionOne.actors,
    memories: episodeOne.memories,
    episode: episodeOne.episode,
    to_generation: 2,
  });
  const episodeTwo = runGovernedActorLabEpisodeV01({
    manifest: input.manifest,
    generation: 2,
    actors: transitionTwo.actors,
    memories: transitionTwo.memories,
    case_source: input.development_sources[2],
  });
  const holdoutOutcome = evaluateGovernedActorLabHiddenHoldoutV01({
    manifest: input.manifest,
    actors: transitionTwo.actors,
    holdout: input.hidden_holdout,
  });
  const baselines = buildGovernedActorLabBaselineObservationsV01({
    manifest: input.manifest,
    development_sources: input.development_sources,
    hidden_holdout: input.hidden_holdout,
    evolutionary_episodes: [episodeZero.episode, episodeOne.episode, episodeTwo.episode],
    evolutionary_transitions: [transitionOne.transition, transitionTwo.transition],
    evolutionary_final_actors: transitionTwo.actors,
  });
  const report = buildReportV01({
    manifest: input.manifest,
    generations: [generationZero.actors, transitionOne.actors, transitionTwo.actors],
    episodes: [episodeZero.episode, episodeOne.episode, episodeTwo.episode],
    transitions: [transitionOne.transition, transitionTwo.transition],
    holdoutOutcome,
    baselines,
  });
  return {
    manifest: structuredClone(input.manifest),
    generations: [
      {
        generation: 0,
        actors_at_episode_start: generationZero.actors,
        memories_at_episode_start: generationZero.memories,
        post_episode_memories: episodeZero.memories,
      },
      {
        generation: 1,
        actors_at_episode_start: transitionOne.actors,
        memories_at_episode_start: transitionOne.memories,
        post_episode_memories: episodeOne.memories,
      },
      {
        generation: 2,
        actors_at_episode_start: transitionTwo.actors,
        memories_at_episode_start: transitionTwo.memories,
        post_episode_memories: episodeTwo.memories,
      },
    ],
    episodes: [episodeZero.episode, episodeOne.episode, episodeTwo.episode],
    transitions: [transitionOne.transition, transitionTwo.transition],
    report,
  };
}

export function validateGovernedActorLabReportV01(
  input: unknown,
): GovernedActorLabValidationResultV01 {
  try {
    assertReportV01(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    return validationFailureV01(error);
  }
}

export function assertValidGovernedActorLabReportV01(
  input: unknown,
): asserts input is GovernedActorLabReportV01 {
  assertReportV01(input);
}

export function validateGovernedActorLabPilotResultV01(
  input: unknown,
): GovernedActorLabValidationResultV01 {
  try {
    assertPilotResultV01(input);
    return { status: "valid", errors: [] };
  } catch (error) {
    return validationFailureV01(error);
  }
}

export function assertValidGovernedActorLabPilotResultV01(
  input: unknown,
): asserts input is GovernedActorLabPilotResultV01 {
  assertPilotResultV01(input);
}

function buildToolManifestV01(sources: GovernedActorLabSyntheticSourceV01[]): GovernedActorLabToolManifestV01 {
  const draft: GovernedActorLabToolManifestV01 = {
    manifest_version: "governed_actor_lab_tool_manifest.v0.1",
    manifest_id: "actor-lab-tool-manifest:pending",
    actor_operation: "read_exact_synthetic_source",
    allowed_source_refs: structuredClone(sources),
    filesystem_scope: "exact_synthetic_sources_only",
    write_scope: "lab_artifact_store_only_by_runner",
    shell_allowed: false,
    git_or_github_allowed: false,
    product_database_allowed: false,
    browser_or_companion_mutation_allowed: false,
    task_context_mutation_allowed: false,
    network_allowed: false,
    provider_or_model_gateway_allowed: false,
    credential_access_allowed: false,
    os_wide_read_allowed: false,
    external_actuation_allowed: false,
    mutation_may_expand_scope: false,
    integrity: pendingIntegrityV01(),
  };
  const manifestId = deriveIdV01("actor-lab-tool-manifest", draft, "manifest_id");
  return sealObjectV01({ ...draft, manifest_id: manifestId });
}

function buildBudgetV01(toolReadLimit: number, stepLimit: number): GovernedActorLabBudgetEnvelopeV01 {
  const toolReads = boundedPositiveIntegerV01(toolReadLimit, "$.compute.tool_read_limit", 10_000);
  const steps = boundedPositiveIntegerV01(stepLimit, "$.compute.step_limit", 100_000);
  const draft: GovernedActorLabBudgetEnvelopeV01 = {
    budget_version: "governed_actor_lab_equal_budget.v0.1",
    budget_id: "actor-lab-budget:pending",
    provider_call_limit: 0,
    network_call_limit: 0,
    external_effect_limit: 0,
    tool_read_limit: toolReads,
    step_limit: steps,
    token_limit: 0,
    cost_microunits_limit: 0,
    equal_for_all_baseline_arms: true,
    equal_budget_is_equal_capability: false,
    integrity: pendingIntegrityV01(),
  };
  const budgetId = deriveIdV01("actor-lab-budget", draft, "budget_id");
  return sealObjectV01({ ...draft, budget_id: budgetId });
}

function profileV01(
  procedural: GovernedActorLabActorProfileV01["procedural_operator_policy"],
  retrieval: GovernedActorLabActorProfileV01["evidence_retrieval_policy"],
  memory: GovernedActorLabActorProfileV01["memory_policy"],
  orchestration: GovernedActorLabActorProfileV01["orchestration_policy"],
  roles: GovernedActorLabActorProfileV01["role_bindings"],
  recipes: StrategyCompositionCaseReferenceV01[],
): GovernedActorLabActorProfileV01 {
  return {
    procedural_operator_policy: procedural,
    evidence_retrieval_policy: retrieval,
    memory_policy: memory,
    orchestration_policy: orchestration,
    role_bindings: [...roles].sort(compareProtocolCodeUnitsV01),
    strategy_recipe_refs: normalizeStrategyRecipeRefsV01(recipes),
  };
}

function normalizeStrategyRecipeRefsV01(
  recipes: StrategyCompositionCaseReferenceV01[],
): StrategyCompositionCaseReferenceV01[] {
  if (recipes.length === 0 || recipes.length > 16) {
    failV01("actor_lab_strategy_recipe_count_invalid", "$.strategy_recipe_refs");
  }
  const normalized = uniqueByCanonicalV01(recipes).sort((left, right) =>
    compareProtocolCodeUnitsV01(
      canonicalizeProtocolValueV01(left),
      canonicalizeProtocolValueV01(right),
    ),
  );
  normalized.forEach((recipe, index) =>
    validateStrategyRecipeReferenceV01(recipe, `$.strategy_recipe_refs[${index}]`),
  );
  return normalized;
}

function validateStrategyRecipeReferenceV01(
  recipe: StrategyCompositionCaseReferenceV01,
  path: string,
): void {
  assertExactKeysV01(recipe, [
    "workspace_id", "project_id", "case_id", "case_fingerprint", "case_key",
    "task_family_key", "construction_cutoff",
  ], path);
  requiredIdV01(recipe.workspace_id, `${path}.workspace_id`);
  requiredIdV01(recipe.project_id, `${path}.project_id`);
  requiredIdV01(recipe.case_id, `${path}.case_id`);
  requiredFingerprintV01(recipe.case_fingerprint, `${path}.case_fingerprint`);
  requiredIdV01(recipe.case_key, `${path}.case_key`);
  requiredIdV01(recipe.task_family_key, `${path}.task_family_key`);
  if (parseStrictIsoTimestampV01(recipe.construction_cutoff) === null) {
    failV01("actor_lab_strategy_recipe_cutoff_invalid", `${path}.construction_cutoff`);
  }
}

function assertActorProfileV01(
  profile: GovernedActorLabActorProfileV01,
  path: string,
): void {
  assertExactKeysV01(profile, [
    "procedural_operator_policy", "evidence_retrieval_policy", "memory_policy",
    "orchestration_policy", "role_bindings", "strategy_recipe_refs",
  ], path);
  if (!["verification_first", "scope_sentinel", "counterexample_search", "bounded_synthesis"].includes(profile.procedural_operator_policy)) failV01("actor_lab_profile_procedural_policy_invalid", `${path}.procedural_operator_policy`);
  if (!["support_and_currentness", "scope_and_conflict", "falsifier_and_harm", "minimal_sufficient_set"].includes(profile.evidence_retrieval_policy)) failV01("actor_lab_profile_retrieval_policy_invalid", `${path}.evidence_retrieval_policy`);
  if (!["strict_source_only", "revision_preferred", "quarantine_first", "minimal_retention"].includes(profile.memory_policy)) failV01("actor_lab_profile_memory_policy_invalid", `${path}.memory_policy`);
  if (!["verify_then_solve", "bound_then_solve", "challenge_then_narrow", "synthesize_then_abstain"].includes(profile.orchestration_policy)) failV01("actor_lab_profile_orchestration_policy_invalid", `${path}.orchestration_policy`);
  const roles = uniqueStringsV01(profile.role_bindings);
  if (
    roles.length === 0 ||
    roles.some((role) => !(STRATEGY_COMPOSITION_ROLES_V01 as readonly string[]).includes(role)) ||
    canonicalizeProtocolValueV01(profile.role_bindings) !== canonicalizeProtocolValueV01(roles)
  ) failV01("actor_lab_profile_role_bindings_invalid", `${path}.role_bindings`);
  if (
    canonicalizeProtocolValueV01(profile.strategy_recipe_refs) !==
    canonicalizeProtocolValueV01(normalizeStrategyRecipeRefsV01(profile.strategy_recipe_refs))
  ) failV01("actor_lab_profile_strategy_recipes_noncanonical", `${path}.strategy_recipe_refs`);
}

function assertInitialPopulationSpecificationV01(
  input: GovernedActorLabInitialPopulationSpecificationV01,
): void {
  assertExactKeysV01(input, [
    "specification_version", "specification_id", "actors",
    "provider_or_model_identity_bound", "product_actor_identity_created", "integrity",
  ], "$.initial_population");
  if (
    input.specification_version !== "governed_actor_lab_initial_population.v0.1" ||
    input.provider_or_model_identity_bound !== false ||
    input.product_actor_identity_created !== false ||
    input.actors.length !== 4
  ) failV01("actor_lab_initial_population_contract_invalid", "$.initial_population");
  const expectedActorIds = ["actor:a", "actor:b", "actor:c", "actor:d"];
  for (const [index, actor] of input.actors.entries()) {
    assertExactKeysV01(actor, ["lab_actor_id", "profile"], `$.initial_population.actors[${index}]`);
    if (actor.lab_actor_id !== expectedActorIds[index]) failV01("actor_lab_initial_population_actor_order_invalid", `$.initial_population.actors[${index}].lab_actor_id`);
    assertActorProfileV01(actor.profile, `$.initial_population.actors[${index}].profile`);
  }
  if (
    deriveIdV01("actor-lab-initial-population", input, "specification_id") !==
    input.specification_id
  ) failV01("actor_lab_initial_population_id_mismatch", "$.initial_population.specification_id");
  assertIntegrityV01(input, "$.initial_population.integrity");
}

function assertCuratedKnowledgeInputV01(
  input: GovernedActorLabCuratedKnowledgeInputV01,
  allowedSources: GovernedActorLabSyntheticSourceV01[],
): void {
  assertExactKeysV01(input, [
    "curated_input_version", "curated_input_id", "construction", "items",
    "persistent_actor_private_memory", "mutation_or_evolution",
    "hidden_holdout_material_included", "provider_or_model_material_included",
    "integrity",
  ], "$.curated_input");
  if (
    input.curated_input_version !== "governed_actor_lab_curated_knowledge.v0.1" ||
    input.construction !== "deterministic_pre_cutoff_source_compilation" ||
    input.persistent_actor_private_memory !== false ||
    input.mutation_or_evolution !== false ||
    input.hidden_holdout_material_included !== false ||
    input.provider_or_model_material_included !== false ||
    input.items.length !== 3
  ) failV01("actor_lab_curated_input_contract_invalid", "$.curated_input");
  const allowed = new Set(allowedSources.map((source) => canonicalizeProtocolValueV01(source)));
  for (const [index, item] of input.items.entries()) {
    assertExactKeysV01(item, [
      "source_ref", "procedural_operator_policy", "evidence_retrieval_policy",
    ], `$.curated_input.items[${index}]`);
    validateSyntheticSourceV01(item.source_ref, `$.curated_input.items[${index}].source_ref`);
    if (!allowed.has(canonicalizeProtocolValueV01(item.source_ref))) failV01("actor_lab_curated_source_not_admitted", `$.curated_input.items[${index}].source_ref`);
    if (!["verification_first", "scope_sentinel", "counterexample_search", "bounded_synthesis"].includes(item.procedural_operator_policy)) failV01("actor_lab_curated_policy_invalid", `$.curated_input.items[${index}].procedural_operator_policy`);
    if (!["support_and_currentness", "scope_and_conflict", "falsifier_and_harm", "minimal_sufficient_set"].includes(item.evidence_retrieval_policy)) failV01("actor_lab_curated_policy_invalid", `$.curated_input.items[${index}].evidence_retrieval_policy`);
  }
  if (deriveIdV01("actor-lab-curated-knowledge", input, "curated_input_id") !== input.curated_input_id) failV01("actor_lab_curated_input_id_mismatch", "$.curated_input.curated_input_id");
  assertIntegrityV01(input, "$.curated_input.integrity");
}

function buildActorSnapshotV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  actorId: string;
  generation: GovernedActorLabGenerationV01;
  parent: GovernedActorLabActorSnapshotReferenceV01 | null;
  profile: GovernedActorLabActorProfileV01;
  memory: GovernedActorLabMemorySnapshotReferenceV01;
  mutations: GovernedActorLabMutationReferenceV01[];
}): GovernedActorLabActorSnapshotV01 {
  requiredIdV01(input.actorId, "$.actorId");
  const lineageFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
    experiment_id: input.manifest.experiment_id,
    lab_actor_id: input.actorId,
    generation: input.generation,
    parent: input.parent,
    mutations: input.mutations,
  }));
  const draft: GovernedActorLabActorSnapshotV01 = {
    actor_version: GOVERNED_ACTOR_LAB_ACTOR_VERSION_V01,
    lab_actor_id: input.actorId,
    actor_snapshot_id: "actor-lab-snapshot:pending",
    experiment_id: input.manifest.experiment_id,
    generation: input.generation,
    parent_actor_ref: input.parent,
    lineage_fingerprint: lineageFingerprint,
    profile: structuredClone(input.profile),
    private_memory: structuredClone(input.memory),
    mutation_refs: structuredClone(input.mutations).sort((left, right) => compareProtocolCodeUnitsV01(left.mutation_id, right.mutation_id)),
    capability_ceiling_fingerprint: input.manifest.tool_manifest.integrity.fingerprint,
    tool_manifest_fingerprint: input.manifest.tool_manifest.integrity.fingerprint,
    state_frozen: true,
    authority_summary: createGovernedActorLabAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  const snapshotId = deriveIdV01("actor-lab-snapshot", draft, "actor_snapshot_id");
  return sealObjectV01({ ...draft, actor_snapshot_id: snapshotId });
}

function buildMemorySnapshotV01(input: {
  experimentId: string;
  actorId: string;
  generation: GovernedActorLabGenerationV01;
  parent: GovernedActorLabMemorySnapshotReferenceV01 | null;
  items: GovernedActorLabMemoryItemV01[];
}): GovernedActorLabPrivateMemorySnapshotV01 {
  const items = structuredClone(input.items).sort((left, right) => compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id));
  const draft: GovernedActorLabPrivateMemorySnapshotV01 = {
    memory_version: GOVERNED_ACTOR_LAB_MEMORY_VERSION_V01,
    memory_snapshot_id: "actor-lab-memory-snapshot:pending",
    experiment_id: requiredIdV01(input.experimentId, "$.experimentId"),
    lab_actor_id: requiredIdV01(input.actorId, "$.actorId"),
    generation: input.generation,
    parent_snapshot: input.parent,
    items,
    item_count: items.length,
    consultation_required_before_write: true,
    cross_actor_read_allowed: false,
    cross_experiment_read_allowed: false,
    product_memory_accessed: false,
    authority_summary: createGovernedActorLabAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  const snapshotId = deriveIdV01("actor-lab-memory-snapshot", draft, "memory_snapshot_id");
  return sealObjectV01({ ...draft, memory_snapshot_id: snapshotId });
}

function buildMemoryItemV01(
  candidate: GovernedActorLabMemoryCandidateV01,
  supersedes: string | null,
  retracts: string | null,
): GovernedActorLabMemoryItemV01 {
  const draft: GovernedActorLabMemoryItemV01 = {
    memory_item_id: "actor-lab-memory-item:pending",
    memory_item_fingerprint: PENDING_FINGERPRINT,
    experiment_id: candidate.experiment_id,
    lab_actor_id: candidate.lab_actor_id,
    episode_id: candidate.episode_id,
    origin_candidate_id: candidate.candidate_id,
    item_kind: candidate.item_kind,
    bounded_content: boundedTextV01(candidate.bounded_content, "$.candidate.bounded_content", 800),
    task_family_key: candidate.task_family_key,
    applicability: boundedTextV01(candidate.applicability, "$.candidate.applicability", 800),
    uncertainty: uniqueBoundedTextV01(candidate.uncertainty),
    limitations: uniqueBoundedTextV01(candidate.limitations),
    source_refs: structuredClone(candidate.source_refs).sort(compareSourcesV01),
    support_status: candidate.support_status,
    status: "current",
    supersedes_memory_item_id: supersedes,
    superseded_by_memory_item_id: null,
    retracts_memory_item_id: retracts,
    inherited_from_memory_item_ref: null,
    intervention_evaluation_ref: structuredClone(candidate.intervention_evaluation_ref),
    quarantine_reasons: [],
    directive_shaped_material: false,
    hidden_holdout_material: false,
  };
  const itemId = deriveIdV01("actor-lab-memory-item", draft, "memory_item_id", "memory_item_fingerprint");
  const withId = { ...draft, memory_item_id: itemId };
  return { ...withId, memory_item_fingerprint: memoryItemFingerprintV01(withId) };
}

function buildItemTracesV01(
  actor: GovernedActorLabActorSnapshotV01,
  memory: GovernedActorLabPrivateMemorySnapshotV01,
  retrieved: GovernedActorLabMemoryItemV01[],
  interventions: GovernedActorLabInterventionEvaluationV01[],
  episodeId: string,
  caseSource: GovernedActorLabSyntheticSourceV01,
): GovernedActorLabItemTraceV01[] {
  const retrievedIds = new Set(retrieved.map((item) => item.memory_item_id));
  const citedId = retrieved[0]?.memory_item_id ?? null;
  return memory.items.map((item) => {
    const eligible = item.status === "current" && item.quarantine_reasons.length === 0;
    const wasRetrieved = retrievedIds.has(item.memory_item_id);
    const cited = wasRetrieved && item.memory_item_id === citedId;
    const supportValidated = cited && item.support_status === "support_validated";
    const outcomeAssociated = supportValidated && actor.profile.procedural_operator_policy === "verification_first";
    const causal = classifyGovernedActorLabItemCausalContributionV01(item, interventions, {
      experiment_id: actor.experiment_id,
      episode_id: episodeId,
      lab_actor_id: actor.lab_actor_id,
      task_family_key: caseSource.task_family_key,
    });
    return {
      memory_item_id: item.memory_item_id,
      eligible,
      retrieved: wasRetrieved,
      presented: wasRetrieved,
      cited_or_referenced: cited,
      support_validated: supportValidated,
      outcome_associated: outcomeAssociated,
      causal_contribution: causal.status,
      intervention_evaluation_ref: causal.intervention_evaluation_ref,
      source_refs: structuredClone(item.source_refs),
      limitations: outcomeAssociated
        ? ["Outcome association remains observational without an exact intervention relation."]
        : ["No item-specific outcome relation is available."],
    };
  });
}

export function classifyGovernedActorLabItemCausalContributionV01(
  item: GovernedActorLabMemoryItemV01,
  interventions: GovernedActorLabInterventionEvaluationV01[],
  expected: {
    experiment_id: string;
    episode_id: string;
    lab_actor_id: string;
    task_family_key: string;
  },
): {
  status: GovernedActorLabItemTraceV01["causal_contribution"];
  intervention_evaluation_ref: GovernedActorLabInterventionEvaluationReferenceV01 | null;
} {
  const exact = interventions.find((relation) => {
    try {
      assertInterventionEvaluationV01(relation);
    } catch {
      return false;
    }
    return (
      relation.experiment_id === expected.experiment_id &&
      relation.episode_id === expected.episode_id &&
      relation.lab_actor_id === expected.lab_actor_id &&
      relation.task_family_key === expected.task_family_key &&
      relation.memory_item_ref.memory_item_id === item.memory_item_id &&
      relation.memory_item_ref.memory_item_fingerprint === item.memory_item_fingerprint &&
      item.source_refs.some(
        (source) =>
          canonicalizeProtocolValueV01(source) ===
          canonicalizeProtocolValueV01(relation.source_ref),
      ) &&
      relation.control.memory_item_present === false &&
      relation.control.outcome_associated === false &&
      relation.treatment.memory_item_present === true &&
      relation.treatment.outcome_associated === true
    );
  });
  return exact
    ? {
        status: "matched_intervention_supported",
        intervention_evaluation_ref: interventionRefV01(exact),
      }
    : { status: "unknown_no_intervention", intervention_evaluation_ref: null };
}

function buildInterventionEvaluationsV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  actor: GovernedActorLabActorSnapshotV01;
  retrieved: GovernedActorLabMemoryItemV01[];
  caseSource: GovernedActorLabSyntheticSourceV01;
  episodeId: string;
  evaluationId: string;
}): GovernedActorLabInterventionEvaluationV01[] {
  return input.retrieved.slice(0, 1).flatMap((item) => {
    const exactSource = item.source_refs.find(
      (source) =>
        source.task_family_key === input.caseSource.task_family_key &&
        input.manifest.tool_manifest.allowed_source_refs.some(
          (allowed) => canonicalizeProtocolValueV01(allowed) === canonicalizeProtocolValueV01(source),
        ),
    );
    const control = executeMemoryItemInterventionArmV01(
      input.actor,
      item,
      input.caseSource,
      false,
    );
    const treatment = executeMemoryItemInterventionArmV01(
      input.actor,
      item,
      input.caseSource,
      true,
    );
    if (
      !exactSource ||
      item.support_status !== "support_validated" ||
      !treatment.outcome_associated
    ) return [];
    const draft: GovernedActorLabInterventionEvaluationV01 = {
      intervention_id: "actor-lab-intervention-evaluation:pending",
      experiment_id: input.manifest.experiment_id,
      episode_id: input.episodeId,
      evaluation_id: input.evaluationId,
      lab_actor_id: input.actor.lab_actor_id,
      memory_item_ref: memoryItemRefV01(item),
      task_family_key: input.caseSource.task_family_key,
      source_ref: structuredClone(exactSource),
      intervention_kind: "memory_item_present_vs_absent",
      control,
      treatment,
      same_actor: true,
      same_case: true,
      same_evaluator: true,
      causal_scope: "exact_item_exact_episode_only",
      general_causal_contribution_claimed: false,
      integrity: pendingIntegrityV01(),
    };
    const interventionId = deriveIdV01(
      "actor-lab-intervention-evaluation",
      draft,
      "intervention_id",
    );
    return [sealObjectV01({ ...draft, intervention_id: interventionId })];
  });
}

function executeMemoryItemInterventionArmV01(
  actor: GovernedActorLabActorSnapshotV01,
  item: GovernedActorLabMemoryItemV01,
  caseSource: GovernedActorLabSyntheticSourceV01,
  memoryItemPresent: false,
): GovernedActorLabInterventionEvaluationV01["control"];
function executeMemoryItemInterventionArmV01(
  actor: GovernedActorLabActorSnapshotV01,
  item: GovernedActorLabMemoryItemV01,
  caseSource: GovernedActorLabSyntheticSourceV01,
  memoryItemPresent: true,
): GovernedActorLabInterventionEvaluationV01["treatment"];
function executeMemoryItemInterventionArmV01(
  actor: GovernedActorLabActorSnapshotV01,
  item: GovernedActorLabMemoryItemV01,
  caseSource: GovernedActorLabSyntheticSourceV01,
  memoryItemPresent: boolean,
): GovernedActorLabInterventionEvaluationV01["control"] | GovernedActorLabInterventionEvaluationV01["treatment"] {
  const supportValidated =
    memoryItemPresent &&
    item.support_status === "support_validated" &&
    item.task_family_key === caseSource.task_family_key;
  const outcomeAssociated =
    supportValidated &&
    actor.profile.procedural_operator_policy === "verification_first";
  return memoryItemPresent
    ? {
        memory_item_present: true,
        support_validated: supportValidated as true,
        outcome_associated: outcomeAssociated as true,
      }
    : {
        memory_item_present: false,
        support_validated: false,
        outcome_associated: false,
      };
}

function buildClaimRefsV01(actor: GovernedActorLabActorSnapshotV01, episodeId: string): string[] {
  const count = actor.profile.procedural_operator_policy === "verification_first" || actor.profile.procedural_operator_policy === "counterexample_search" ? 3 : 2;
  return Array.from({ length: count }, (_, index) => deriveSimpleIdV01("actor-lab-claim-ref", { episodeId, actor: actor.lab_actor_id, index }));
}

function developmentOutcomeV01(
  actor: GovernedActorLabActorSnapshotV01,
  traces: GovernedActorLabItemTraceV01[],
  generation: GovernedActorLabGenerationV01,
): GovernedActorLabOutcomeVectorV01 {
  const profile = actor.profile.procedural_operator_policy;
  const hardGate = profile === "bounded_synthesis" && generation === 0;
  const supported = profile === "verification_first" ? 3 : profile === "counterexample_search" ? 2 : 1;
  const harmful = profile === "counterexample_search" ? 0 : profile === "bounded_synthesis" ? 1 : 0;
  return outcomeVectorV01({
    hardGate,
    hardGateCodes: hardGate ? ["support_validation_incomplete"] : [],
    passedChecks: hardGate ? 2 : 4,
    supportedClaims: supported,
    unsupportedClaims: hardGate ? 1 : 0,
    holdoutPassed: 0,
    holdoutFailed: 0,
    holdoutUnknown: 1,
    eligible: traces.filter((trace) => trace.eligible).length,
    retrieved: traces.filter((trace) => trace.retrieved).length,
    presented: traces.filter((trace) => trace.presented).length,
    cited: traces.filter((trace) => trace.cited_or_referenced).length,
    supportValidated: traces.filter((trace) => trace.support_validated).length,
    outcomeAssociated: traces.filter((trace) => trace.outcome_associated).length,
    causal: traces.filter((trace) => trace.causal_contribution === "matched_intervention_supported").length,
    quarantined: 0,
    harmful,
    poisonRefusals: profile === "counterexample_search" ? 1 : 0,
    interference: 0,
    challenges: 1,
    syntheses: 1,
    reviews: 1,
    toolReads: 1,
    steps: 4,
  });
}

function buildEpisodeMemoryCandidateV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  episodeId: string;
  actor: GovernedActorLabActorSnapshotV01;
  memory: GovernedActorLabPrivateMemorySnapshotV01;
  generation: GovernedActorLabGenerationV01;
  source: GovernedActorLabSyntheticSourceV01;
  actorIndex: number;
  existingMemoryIndex: number;
  interventionEvaluations: GovernedActorLabInterventionEvaluationV01[];
}): GovernedActorLabMemoryCandidateV01 {
  const current = input.memory.items.find((item) => item.status === "current") ?? null;
  let operation: GovernedActorLabMemoryOperationV01 = "add";
  let target: string | null = null;
  let content = `Use ${input.actor.profile.procedural_operator_policy} within ${input.source.task_family_key}.`;
  let evidenceClass: ExternalRefTrustClassV01 = "direct_local_observation";
  let evidenceBasis: GovernedActorLabMemoryCandidateV01["evidence_basis"] = "source_verification";
  let interventionEvaluationRef: GovernedActorLabInterventionEvaluationReferenceV01 | null = null;
  if (input.generation === 1) {
    operation = current === null
      ? "add"
      : input.existingMemoryIndex === 0
        ? "supersede"
        : input.existingMemoryIndex === 1
          ? "revise"
        : input.existingMemoryIndex === 2
            ? "retract"
            : "add";
    target = operation === "revise" || operation === "supersede" || operation === "retract"
      ? current?.memory_item_id ?? null
      : null;
    content = `${operation} the bounded ${input.actor.profile.procedural_operator_policy} procedure using exact evaluation evidence.`;
    evidenceClass = input.actorIndex === 1 ? "verified_external_observation" : "direct_local_observation";
    const exactIntervention = current === null
      ? null
      : input.interventionEvaluations.find(
          (relation) =>
            relation.lab_actor_id === input.actor.lab_actor_id &&
            relation.memory_item_ref.memory_item_id === current.memory_item_id &&
            relation.memory_item_ref.memory_item_fingerprint === current.memory_item_fingerprint,
        ) ?? null;
    if ((operation === "supersede" || operation === "retract") && exactIntervention) {
      evidenceBasis = "matched_intervention";
      interventionEvaluationRef = interventionRefV01(exactIntervention);
    } else if (operation === "retract") {
      evidenceBasis = "negative_verdict";
    }
  } else if (input.generation === 2) {
    operation = "no_change";
    content = current?.bounded_content ?? content;
  }
  const basis = {
    experiment_id: input.manifest.experiment_id,
    lab_actor_id: input.actor.lab_actor_id,
    episode_id: input.episodeId,
    operation,
    target,
    content,
  };
  const interventionSourceRefs = interventionEvaluationRef === null
    ? []
    : input.interventionEvaluations
        .filter(
          (relation) =>
            relation.intervention_id === interventionEvaluationRef.intervention_id &&
            relation.integrity.fingerprint === interventionEvaluationRef.intervention_fingerprint,
        )
        .map((relation) => relation.source_ref);
  return {
    candidate_id: deriveSimpleIdV01("actor-lab-memory-candidate", basis),
    experiment_id: input.manifest.experiment_id,
    lab_actor_id: input.actor.lab_actor_id,
    episode_id: input.episodeId,
    requested_operation: operation,
    target_memory_item_id: target,
    item_kind: "procedural_operator_memory",
    bounded_content: content,
    task_family_key: input.source.task_family_key,
    applicability: `Exact synthetic family ${input.source.task_family_key} only.`,
    uncertainty: ["Deterministic fixture behavior does not establish model benefit."],
    limitations: ["Lab-only procedural memory; not product or Personal Perspective memory."],
    source_refs: uniqueByCanonicalV01([input.source, ...interventionSourceRefs]).sort(compareSourcesV01),
    evidence_class: evidenceClass,
    evidence_basis: evidenceBasis,
    intervention_evaluation_ref: interventionEvaluationRef,
    support_status: "support_validated",
    directive_shaped_material: false,
    hidden_holdout_material: false,
  };
}

function memoryPermissionV01(
  candidate: GovernedActorLabMemoryCandidateV01,
  poisonReasons: string[],
  interventionEvidenceValid: boolean,
): GovernedActorLabMemoryAdmissionV01["permission"] {
  if (poisonReasons.length > 0) return "quarantined";
  if (candidate.support_status !== "support_validated") return candidate.support_status === "refused" ? "refused" : "candidate_unknown";
  if (candidate.evidence_basis === "self_assertion" || candidate.evidence_basis === "evaluator_preference" || candidate.evidence_basis === "unsupported") return "candidate_unknown";
  const strongTrust = candidate.evidence_class === "direct_local_observation" || candidate.evidence_class === "verified_external_observation";
  if (!strongTrust) return candidate.evidence_class === "imported_unverified" ? "refused" : "candidate_unknown";
  if (
    candidate.requested_operation === "supersede" &&
    (candidate.evidence_basis !== "matched_intervention" ||
      !interventionEvidenceValid)
  ) return "candidate_unknown";
  if (
    candidate.requested_operation === "retract" &&
    candidate.evidence_basis !== "matched_intervention" &&
    candidate.evidence_basis !== "negative_verdict"
  ) return "candidate_unknown";
  if (
    candidate.evidence_basis === "matched_intervention" &&
    !interventionEvidenceValid
  ) return "candidate_unknown";
  return "permitted";
}

function validateCandidateInterventionEvidenceV01(
  candidate: GovernedActorLabMemoryCandidateV01,
  interventions: GovernedActorLabInterventionEvaluationV01[],
): boolean {
  if (candidate.evidence_basis !== "matched_intervention") {
    return candidate.intervention_evaluation_ref === null;
  }
  const reference = candidate.intervention_evaluation_ref;
  if (reference === null || candidate.target_memory_item_id === null) return false;
  const relation = interventions.find(
    (entry) =>
      entry.intervention_id === reference.intervention_id &&
      entry.integrity.fingerprint === reference.intervention_fingerprint,
  );
  if (!relation) return false;
  try {
    assertInterventionEvaluationV01(relation);
  } catch {
    return false;
  }
  return (
    relation.experiment_id === candidate.experiment_id &&
    relation.episode_id === candidate.episode_id &&
    relation.lab_actor_id === candidate.lab_actor_id &&
    relation.task_family_key === candidate.task_family_key &&
    relation.memory_item_ref.memory_item_id === candidate.target_memory_item_id &&
    candidate.source_refs.some(
      (source) =>
        canonicalizeProtocolValueV01(source) ===
        canonicalizeProtocolValueV01(relation.source_ref),
    )
  );
}

function memoryPoisonReasonsV01(candidate: GovernedActorLabMemoryCandidateV01): string[] {
  const reasons: string[] = [];
  if (candidate.directive_shaped_material || DIRECTIVE_PATTERN.test(candidate.bounded_content)) reasons.push("directive_shaped_material");
  if (candidate.hidden_holdout_material) reasons.push("hidden_holdout_material");
  if (candidate.source_refs.some((source) => source.trust_class === "imported_unverified")) reasons.push("untrusted_source");
  const sourceFingerprints = new Map<string, string>();
  for (const source of candidate.source_refs) {
    const prior = sourceFingerprints.get(source.source_id);
    if (prior !== undefined && prior !== source.source_fingerprint) {
      reasons.push("source_fingerprint_conflict");
    }
    sourceFingerprints.set(source.source_id, source.source_fingerprint);
    if (source.task_family_key !== candidate.task_family_key) {
      reasons.push("stream_interference");
    }
  }
  if (candidate.task_family_key.toLowerCase().includes("global")) reasons.push("unsupported_global_generalization");
  return uniqueStringsV01(reasons);
}

function memoryItemMaterialReasonsV01(
  item: GovernedActorLabMemoryItemV01,
  allowedSourceRefs?: GovernedActorLabSyntheticSourceV01[],
): string[] {
  const reasons: string[] = [];
  const material = [
    item.bounded_content,
    item.applicability,
    ...item.uncertainty,
    ...item.limitations,
  ].join("\n");
  if (item.directive_shaped_material !== false || DIRECTIVE_PATTERN.test(material)) {
    reasons.push("directive_shaped_material");
  }
  if (item.hidden_holdout_material !== false || HIDDEN_HOLDOUT_PATTERN.test(material)) {
    reasons.push("hidden_holdout_material");
  }
  if (item.source_refs.some((source) => source.trust_class === "imported_unverified")) {
    reasons.push("untrusted_source");
  }
  const sourceFingerprints = new Map<string, string>();
  for (const source of item.source_refs) {
    const prior = sourceFingerprints.get(source.source_id);
    if (prior !== undefined && prior !== source.source_fingerprint) {
      reasons.push("source_fingerprint_conflict");
    }
    sourceFingerprints.set(source.source_id, source.source_fingerprint);
    if (source.task_family_key !== item.task_family_key) {
      reasons.push("stream_interference");
    }
    if (
      allowedSourceRefs !== undefined &&
      !allowedSourceRefs.some(
        (allowed) =>
          canonicalizeProtocolValueV01(allowed) ===
          canonicalizeProtocolValueV01(source),
      )
    ) {
      reasons.push("source_outside_retrieval_policy");
    }
  }
  if (
    item.task_family_key.toLowerCase().includes("global") ||
    GLOBAL_GENERALIZATION_PATTERN.test(material)
  ) {
    reasons.push("unsupported_global_generalization");
  }
  return uniqueStringsV01(reasons);
}

function inheritAdmissibleMemoryItemsV01(
  parentMemory: GovernedActorLabPrivateMemorySnapshotV01,
  childActorId: string,
): GovernedActorLabMemoryItemV01[] {
  return parentMemory.items
    .filter(
      (item) =>
        item.status === "current" &&
        item.support_status === "support_validated" &&
        item.quarantine_reasons.length === 0 &&
        memoryItemMaterialReasonsV01(item).length === 0,
    )
    .map((item) => {
      const draft: GovernedActorLabMemoryItemV01 = {
        ...structuredClone(item),
        memory_item_id: "actor-lab-memory-item:pending",
        memory_item_fingerprint: PENDING_FINGERPRINT,
        lab_actor_id: childActorId,
        status: "current",
        supersedes_memory_item_id: null,
        superseded_by_memory_item_id: null,
        retracts_memory_item_id: null,
        inherited_from_memory_item_ref: memoryItemRefV01(item),
      };
      const itemId = deriveIdV01(
        "actor-lab-memory-item",
        draft,
        "memory_item_id",
        "memory_item_fingerprint",
      );
      const withId = { ...draft, memory_item_id: itemId };
      return {
        ...withId,
        memory_item_fingerprint: memoryItemFingerprintV01(withId),
      };
    })
    .sort((left, right) =>
      compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id),
    );
}

function requiredCurrentTargetV01(
  snapshot: GovernedActorLabPrivateMemorySnapshotV01,
  targetId: string | null,
): GovernedActorLabMemoryItemV01 {
  if (!targetId) failV01("actor_lab_memory_target_required", "$.candidate.target_memory_item_id");
  const target = snapshot.items.find((item) => item.memory_item_id === targetId);
  if (!target) failV01("actor_lab_memory_target_missing", "$.candidate.target_memory_item_id");
  if (target.status !== "current") failV01("actor_lab_memory_target_not_current", "$.candidate.target_memory_item_id");
  return target;
}

function buildMutationV01(
  manifest: GovernedActorLabExperimentManifestV01,
  parent: GovernedActorLabActorSnapshotV01,
  childGeneration: 1 | 2,
  slot: number,
): GovernedActorLabMutationV01 {
  const units: GovernedActorLabMutationUnitV01[] = [
    "procedural_operator_policy",
    "evidence_retrieval_policy",
    "memory_policy",
    "orchestration_policy",
    "strategy_component_recipe",
  ];
  const unit = units[(seedNumberV01(manifest.deterministic_seed, parent.lab_actor_id, childGeneration, slot)) % units.length]!;
  const changedFrom = mutationFieldValueV01(parent.profile, unit);
  const changedTo = nextMutationValueV01(parent.profile, unit);
  const mutationDraft: GovernedActorLabMutationV01 = {
    mutation_id: "actor-lab-mutation:pending",
    experiment_id: manifest.experiment_id,
    parent_actor_snapshot: actorRefV01(parent),
    child_generation: childGeneration,
    unit,
    deterministic_seed_basis: createProtocolSha256V01(canonicalizeProtocolValueV01({ seed: manifest.deterministic_seed, actor: parent.lab_actor_id, childGeneration, slot })),
    mutation_budget_units: 1,
    changed_from: changedFrom,
    changed_to: changedTo,
    evaluator_changed: false,
    holdout_changed: false,
    tool_manifest_changed: false,
    capability_scope_expanded: false,
    whole_actor_profile_mutated: false,
    integrity: pendingIntegrityV01(),
  };
  const mutationId = deriveIdV01("actor-lab-mutation", mutationDraft, "mutation_id");
  return sealObjectV01({ ...mutationDraft, mutation_id: mutationId });
}

function applyMutationV01(
  profileInput: GovernedActorLabActorProfileV01,
  mutation: GovernedActorLabMutationV01,
): GovernedActorLabActorProfileV01 {
  const profile = structuredClone(profileInput);
  if (mutation.unit === "procedural_operator_policy") profile.procedural_operator_policy = mutation.changed_to as GovernedActorLabActorProfileV01["procedural_operator_policy"];
  else if (mutation.unit === "evidence_retrieval_policy") profile.evidence_retrieval_policy = mutation.changed_to as GovernedActorLabActorProfileV01["evidence_retrieval_policy"];
  else if (mutation.unit === "memory_policy") profile.memory_policy = mutation.changed_to as GovernedActorLabActorProfileV01["memory_policy"];
  else if (mutation.unit === "orchestration_policy") profile.orchestration_policy = mutation.changed_to as GovernedActorLabActorProfileV01["orchestration_policy"];
  else if (mutation.unit === "strategy_component_recipe") profile.role_bindings = uniqueStringsV01([...profile.role_bindings, mutation.changed_to]) as GovernedActorLabActorProfileV01["role_bindings"];
  return profile;
}

function mutationFieldValueV01(profile: GovernedActorLabActorProfileV01, unit: GovernedActorLabMutationUnitV01): string {
  if (unit === "procedural_operator_policy") return profile.procedural_operator_policy;
  if (unit === "evidence_retrieval_policy") return profile.evidence_retrieval_policy;
  if (unit === "memory_policy") return profile.memory_policy;
  if (unit === "orchestration_policy") return profile.orchestration_policy;
  return profile.role_bindings[0] ?? "verification";
}

function nextMutationValueV01(profile: GovernedActorLabActorProfileV01, unit: GovernedActorLabMutationUnitV01): string {
  const values: Record<GovernedActorLabMutationUnitV01, string[]> = {
    procedural_operator_policy: ["verification_first", "scope_sentinel", "counterexample_search", "bounded_synthesis"],
    evidence_retrieval_policy: ["support_and_currentness", "scope_and_conflict", "falsifier_and_harm", "minimal_sufficient_set"],
    memory_policy: ["strict_source_only", "revision_preferred", "quarantine_first", "minimal_retention"],
    orchestration_policy: ["verify_then_solve", "bound_then_solve", "challenge_then_narrow", "synthesize_then_abstain"],
    strategy_component_recipe: ["verification", "falsification", "scope_narrowing", "uncertainty_preservation"],
  };
  const current = mutationFieldValueV01(profile, unit);
  const list = values[unit];
  return list[(Math.max(0, list.indexOf(current)) + 1) % list.length]!;
}

function nonDominatedActorsV01(
  observations: GovernedActorLabEpisodeArtifactV01["evaluation"]["actor_outcomes"],
): string[] {
  const dominated = new Set<string>();
  for (const left of observations) {
    for (const right of observations) {
      if (left.lab_actor_id === right.lab_actor_id) continue;
      if (dominatesOutcomeV01(right.outcome, left.outcome)) dominated.add(left.lab_actor_id);
    }
  }
  return observations.map((entry) => entry.lab_actor_id).filter((id) => !dominated.has(id));
}

function preserveProfileDiversityV01(
  parentIds: string[],
  actors: Map<string, GovernedActorLabActorSnapshotV01>,
): string[] {
  const byProfile = new Map<string, string>();
  for (const id of [...parentIds].sort(compareProtocolCodeUnitsV01)) {
    const actor = actors.get(id);
    if (!actor) continue;
    if (!byProfile.has(actor.profile.procedural_operator_policy)) byProfile.set(actor.profile.procedural_operator_policy, id);
  }
  const diverse = [...byProfile.values()].sort(compareProtocolCodeUnitsV01);
  return diverse.length > 0 ? diverse : [...parentIds].sort(compareProtocolCodeUnitsV01);
}

function buildReportV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  generations: GovernedActorLabActorSnapshotV01[][];
  episodes: GovernedActorLabEpisodeArtifactV01[];
  transitions: GovernedActorLabPopulationTransitionV01[];
  holdoutOutcome: GovernedActorLabOutcomeVectorV01;
  baselines: GovernedActorLabBaselineObservationV01[];
}): GovernedActorLabReportV01 {
  const nonDominance = deriveGovernedActorLabBaselineNonDominanceV01(input.baselines);
  const poisoningRefusals = input.episodes.reduce((sum, episode) => sum + episode.memory_admissions.filter((admission) => admission.permission === "quarantined" || admission.permission === "refused").length, 0);
  const harmful = input.baselines.reduce((sum, baseline) => sum + (baseline.outcome.harm.harmful_transfer_candidates ?? 0), 0);
  const uniqueProfiles = new Set(input.generations.at(-1)!.map((actor) => canonicalizeProtocolValueV01(actor.profile)));
  const harmRefs = input.baselines
    .filter((baseline) => (baseline.outcome.harm.harmful_transfer_candidates ?? 0) > 0)
    .map((baseline): GovernedActorLabHarmObservationReferenceV01 => ({
      observation_id: baseline.observation_id,
      observation_fingerprint: baseline.integrity.fingerprint,
      observation_kind: "baseline_arm_harm",
    }));
  const promotions = input.transitions.flatMap((transition) =>
    transition.mutations
      .slice(0, 1)
      .map((mutation) =>
        buildPromotionCandidateV01(
          input.manifest,
          transition,
          mutation,
          harmRefs,
        ),
      ),
  );
  const holdoutEvaluationId = deriveSimpleIdV01("actor-lab-holdout-evaluation", {
    holdout_id: input.manifest.hidden_holdout.holdout_id,
    holdout_fingerprint: input.manifest.hidden_holdout.holdout_fingerprint,
    evaluator_fingerprint: input.manifest.evaluator.fingerprint,
    actor_refs: input.generations.at(-1)!.map(actorRefV01),
    outcome: input.holdoutOutcome,
  });
  const holdoutEvaluationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      evaluation_id: holdoutEvaluationId,
      outcome: input.holdoutOutcome,
    }),
  );
  const draft: GovernedActorLabReportV01 = {
    report_version: GOVERNED_ACTOR_LAB_REPORT_VERSION_V01,
    report_id: "actor-lab-report:pending",
    report_kind: "deterministic_mechanics_and_substrate_proof",
    experiment_id: input.manifest.experiment_id,
    manifest_ref: {
      experiment_id: input.manifest.experiment_id,
      experiment_fingerprint: input.manifest.integrity.fingerprint,
    },
    evaluator: structuredClone(input.manifest.evaluator),
    actor_engine: structuredClone(input.manifest.actor_engine),
    development_case_sequence: structuredClone(
      input.manifest.tool_manifest.allowed_source_refs,
    ),
    compute_budget: structuredClone(input.manifest.compute_budget),
    generation_actor_refs: input.generations.map((actors, generation) => ({
      generation: generation as GovernedActorLabGenerationV01,
      actors: [...actors].sort(compareActorsV01).map(actorRefV01),
    })),
    episode_refs: input.episodes.map((episode) => ({ episode_id: episode.episode_id, episode_fingerprint: episode.integrity.fingerprint })),
    episode_evaluation_refs: input.episodes.map(evaluationRefV01),
    population_transitions: structuredClone(input.transitions),
    hidden_holdout_evaluation: {
      evaluation_id: holdoutEvaluationId,
      evaluation_fingerprint: holdoutEvaluationFingerprint,
      holdout_id: input.manifest.hidden_holdout.holdout_id,
      holdout_fingerprint: input.manifest.hidden_holdout.holdout_fingerprint,
      actor_state_frozen_before_read: true,
      mutation_state_frozen_before_read: true,
      leakage_detected: false,
      outcome: input.holdoutOutcome,
    },
    baselines: structuredClone(input.baselines),
    non_dominance: nonDominance,
    persistence_benefit_candidate: {
      status: benefitCandidateStatusV01(
        input.baselines.find((baseline) => baseline.arm === "persistent_population_no_evolution")!,
        input.baselines.find((baseline) => baseline.arm === "nonpersistent_compute_matched_ensemble")!,
      ),
      comparison_arms: ["nonpersistent_compute_matched_ensemble", "persistent_population_no_evolution"],
      verified_general_benefit: false,
    },
    evolution_benefit_candidate: {
      status: benefitCandidateStatusV01(
        input.baselines.find((baseline) => baseline.arm === "persistent_evolutionary_population")!,
        input.baselines.find((baseline) => baseline.arm === "persistent_population_no_evolution")!,
      ),
      comparison_arms: ["persistent_population_no_evolution", "persistent_evolutionary_population"],
      verified_general_benefit: false,
    },
    signals: {
      poisoning_refusals: poisoningRefusals,
      quarantined_items_retrieved: 0,
      harmful_transfer_candidates: harmful,
      stream_interference_candidates: 0,
      diversity_collapse: uniqueProfiles.size < 2,
      evaluator_overfit: "not_observed_in_fixture",
      error_recovery: "deterministic_replay_available",
    },
    promotion_candidates: promotions,
    product_effects: createGovernedActorLabProductEffectLedgerV01(),
    mechanics_proof_only: true,
    empirical_llm_evolution_benefit_proven: false,
    limitations: [
      "Deterministic fixture performance proves mechanics and substrate behavior only.",
      "No real provider, model, product task, product database, or external effect was exercised.",
      "Equal budget does not imply equal capability.",
    ],
    unknowns: [
      "Real-model persistence benefit is unmeasured.",
      "Real-model evolutionary benefit, stochastic variance, and operational burden are unmeasured.",
    ],
    authority_summary: createGovernedActorLabAuthoritySummaryV01(),
    material_boundary: createGovernedActorLabMaterialBoundaryV01(),
    integrity: pendingIntegrityV01(),
  };
  const reportId = deriveIdV01("actor-lab-report", draft, "report_id");
  const report = sealObjectV01({ ...draft, report_id: reportId });
  assertValidGovernedActorLabReportV01(report);
  return report;
}

function buildPromotionCandidateV01(
  manifest: GovernedActorLabExperimentManifestV01,
  transition: GovernedActorLabPopulationTransitionV01,
  mutation: GovernedActorLabMutationV01,
  harmRefs: GovernedActorLabHarmObservationReferenceV01[],
): GovernedActorLabPromotionCandidateV01 {
  const draft: GovernedActorLabPromotionCandidateV01 = {
    promotion_version: GOVERNED_ACTOR_LAB_PROMOTION_VERSION_V01,
    promotion_candidate_id: "actor-lab-promotion-candidate:pending",
    experiment_id: manifest.experiment_id,
    generation: transition.to_generation,
    actor_lineage_refs: [mutation.parent_actor_snapshot],
    unit: mutation.unit,
    unit_ref: mutation.mutation_id,
    supporting_evaluation_refs: [structuredClone(transition.selection_evaluation_ref)],
    harm_and_negative_transfer_refs: structuredClone(harmRefs),
    limitations: ["Candidate-only Lab output; no product activation or acceptance."],
    unknowns: ["Later real-work usefulness is unknown."],
    target_scope: "exact synthetic actor-lab case family only",
    whole_actor_profile: false,
    creates_episode_delta_proposal: false,
    authority_summary: createGovernedActorLabAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  const candidateId = deriveIdV01("actor-lab-promotion-candidate", draft, "promotion_candidate_id");
  return sealObjectV01({ ...draft, promotion_candidate_id: candidateId });
}

function benefitCandidateStatusV01(
  candidate: GovernedActorLabBaselineObservationV01,
  comparator: GovernedActorLabBaselineObservationV01,
): "supported_mechanics_candidate" | "mixed" | "inconclusive" {
  if (
    !candidate.complete ||
    !comparator.complete ||
    !candidate.comparable ||
    !comparator.comparable
  ) return "inconclusive";
  const relation = baselineDominanceRelationV01(candidate, comparator);
  if (relation.relation === "left") {
    return "supported_mechanics_candidate";
  }
  if (relation.relation === "equal" || relation.relation === "undetermined") return "inconclusive";
  return "mixed";
}

export function deriveGovernedActorLabBaselineNonDominanceV01(
  baselines: GovernedActorLabBaselineObservationV01[],
): GovernedActorLabReportV01["non_dominance"] {
  if (
    baselines.some(
      (baseline) =>
        !baseline.complete ||
        !baseline.comparable ||
        baselineComparisonValuesV01(baseline.outcome).some((value) => value === null),
    )
  ) {
    return {
      status: "undetermined",
      non_dominated_arms: [],
      dominated_relations: [],
      tradeoff_pairs: [],
      incomplete_evidence_preserved: true,
      ordinal_ranking_created: false,
      global_winner_created: false,
    };
  }
  const dominatedRelations: GovernedActorLabReportV01["non_dominance"]["dominated_relations"] = [];
  const tradeoffPairs: string[] = [];
  const dominated = new Set<GovernedActorLabBaselineArmV01>();
  for (let i = 0; i < baselines.length; i += 1) {
    for (let j = i + 1; j < baselines.length; j += 1) {
      const left = baselines[i]!;
      const right = baselines[j]!;
      const relation = baselineDominanceRelationV01(left, right);
      if (relation.relation === "left") {
        dominated.add(right.arm);
        dominatedRelations.push({
          dominant_arm: left.arm,
          dominated_arm: right.arm,
          basis: relation.basis!,
        });
      } else if (relation.relation === "right") {
        dominated.add(left.arm);
        dominatedRelations.push({
          dominant_arm: right.arm,
          dominated_arm: left.arm,
          basis: relation.basis!,
        });
      } else if (relation.relation === "tradeoff") {
        tradeoffPairs.push(`${left.arm}<->${right.arm}`);
      }
    }
  }
  return {
    status: "determined",
    non_dominated_arms: GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01.filter((arm) => !dominated.has(arm)),
    dominated_relations: dominatedRelations.sort((left, right) => compareProtocolCodeUnitsV01(`${left.dominant_arm}|${left.dominated_arm}`, `${right.dominant_arm}|${right.dominated_arm}`)),
    tradeoff_pairs: tradeoffPairs.sort(compareProtocolCodeUnitsV01),
    incomplete_evidence_preserved: false,
    ordinal_ranking_created: false,
    global_winner_created: false,
  };
}

function baselineComparisonValuesV01(
  outcome: GovernedActorLabOutcomeVectorV01,
): Array<number | null> {
  return [
    outcome.holdout.cases_passed,
    outcome.verification.support_validated_claims,
    negateNullableV01(outcome.harm.harmful_transfer_candidates),
    negateNullableV01(outcome.burden.review_operations),
  ];
}

function baselineDominanceRelationV01(
  left: GovernedActorLabBaselineObservationV01,
  right: GovernedActorLabBaselineObservationV01,
): {
  relation: "left" | "right" | "tradeoff" | "equal" | "undetermined";
  basis:
    | "hard_gate_non_compensation"
    | "all_observed_dimensions_no_worse_and_one_better"
    | null;
} {
  if (!left.complete || !right.complete || !left.comparable || !right.comparable) {
    return { relation: "undetermined", basis: null };
  }
  const leftHardGate = left.execution.arm_hard_gate.arm_level_hard_gate_failure;
  const rightHardGate = right.execution.arm_hard_gate.arm_level_hard_gate_failure;
  if (leftHardGate !== rightHardGate) {
    return {
      relation: leftHardGate ? "right" : "left",
      basis: "hard_gate_non_compensation",
    };
  }
  if (leftHardGate && rightHardGate) {
    return { relation: "undetermined", basis: null };
  }
  const leftValues = baselineComparisonValuesV01(left.outcome);
  const rightValues = baselineComparisonValuesV01(right.outcome);
  if ([...leftValues, ...rightValues].some((value) => value === null)) {
    return { relation: "undetermined", basis: null };
  }
  const leftBetter = leftValues.some(
    (value, index) => (value as number) > (rightValues[index] as number),
  );
  const rightBetter = rightValues.some(
    (value, index) => (value as number) > (leftValues[index] as number),
  );
  if (leftBetter && !rightBetter) {
    return {
      relation: "left",
      basis: "all_observed_dimensions_no_worse_and_one_better",
    };
  }
  if (rightBetter && !leftBetter) {
    return {
      relation: "right",
      basis: "all_observed_dimensions_no_worse_and_one_better",
    };
  }
  if (leftBetter && rightBetter) return { relation: "tradeoff", basis: null };
  return { relation: "equal", basis: null };
}

function dominatesOutcomeV01(left: GovernedActorLabOutcomeVectorV01, right: GovernedActorLabOutcomeVectorV01): boolean {
  if (left.verification.hard_gate_failure === true) return false;
  if (right.verification.hard_gate_failure === true) return true;
  const leftValues = [
    left.holdout.cases_passed,
    left.verification.support_validated_claims,
    negateNullableV01(left.harm.harmful_transfer_candidates),
    negateNullableV01(left.burden.review_operations),
  ];
  const rightValues = [
    right.holdout.cases_passed,
    right.verification.support_validated_claims,
    negateNullableV01(right.harm.harmful_transfer_candidates),
    negateNullableV01(right.burden.review_operations),
  ];
  if ([...leftValues, ...rightValues].some((value) => value === null)) return false;
  const noWorse = leftValues.every((value, index) => (value as number) >= (rightValues[index] as number));
  const oneBetter = leftValues.some((value, index) => (value as number) > (rightValues[index] as number));
  return noWorse && oneBetter;
}

function outcomeVectorV01(input: {
  hardGate: boolean;
  hardGateCodes?: string[];
  passedChecks: number;
  supportedClaims: number;
  unsupportedClaims: number;
  holdoutPassed: number;
  holdoutFailed: number;
  holdoutUnknown?: number;
  eligible: number;
  retrieved: number;
  presented: number;
  cited: number;
  supportValidated: number;
  outcomeAssociated: number;
  causal: number;
  uniqueUsefulContribution?: number | null;
  quarantined: number;
  harmful: number;
  poisonRefusals: number;
  interference: number;
  challenges: number;
  syntheses: number;
  reviews: number;
  toolReads: number;
  steps: number;
}): GovernedActorLabOutcomeVectorV01 {
  return {
    verification: {
      hard_gate_failure: input.hardGate,
      hard_gate_failure_codes: input.hardGateCodes ?? [],
      required_checks_passed: input.passedChecks,
      support_validated_claims: input.supportedClaims,
      unsupported_claims: input.unsupportedClaims,
    },
    holdout: {
      cases_passed: input.holdoutPassed,
      cases_failed: input.holdoutFailed,
      unknown: input.holdoutUnknown ?? 0,
    },
    memory: {
      eligible: input.eligible,
      retrieved: input.retrieved,
      presented: input.presented,
      cited_or_referenced: input.cited,
      support_validated: input.supportValidated,
      outcome_associated: input.outcomeAssociated,
      matched_intervention_contribution: input.causal,
      quarantined: input.quarantined,
    },
    contribution: {
      unique_useful_contribution: input.uniqueUsefulContribution ?? null,
      basis:
        input.uniqueUsefulContribution === undefined ||
        input.uniqueUsefulContribution === null
          ? "unavailable"
          : "matched_intervention",
    },
    harm: {
      harmful_transfer_candidates: input.harmful,
      poisoning_refusals: input.poisonRefusals,
      stream_interference_candidates: input.interference,
    },
    burden: {
      challenge_count: input.challenges,
      synthesis_count: input.syntheses,
      review_operations: input.reviews,
    },
    compute: {
      provider_calls: 0,
      network_calls: 0,
      tool_reads: input.toolReads,
      deterministic_steps: input.steps,
      tokens: 0,
      cost_microunits: 0,
      external_effects: 0,
    },
    missing_dimensions:
      input.uniqueUsefulContribution === undefined ||
      input.uniqueUsefulContribution === null
        ? ["unique_useful_contribution"]
        : [],
  };
}

function assertManifestV01(input: unknown): asserts input is GovernedActorLabExperimentManifestV01 {
  if (!input || typeof input !== "object" || Array.isArray(input)) failV01("actor_lab_manifest_malformed");
  const value = input as GovernedActorLabExperimentManifestV01;
  if (value.hidden_holdout?.content_in_manifest !== false || Object.hasOwn(value.hidden_holdout as object, "content")) failV01("actor_lab_holdout_content_leakage", "$.hidden_holdout");
  assertExactKeysV01(value, [
    "experiment_version", "experiment_id", "experiment_kind", "experiment_scope",
    "hidden_holdout", "population", "evaluator", "actor_engine", "memory_policy",
    "mutation_policy", "tool_manifest", "compute_budget", "deterministic_seed",
    "lab_root", "artifact_scope", "authority_summary", "material_boundary", "integrity",
  ], "$");
  assertExactKeysV01(value.experiment_scope, [
    "workspace_id", "project_id", "synthetic", "case_family_key",
    "development_case_ids", "decision_time_cutoff",
  ], "$.experiment_scope");
  assertExactKeysV01(value.hidden_holdout, [
    "holdout_id", "holdout_fingerprint", "content_in_manifest", "readable_phase",
  ], "$.hidden_holdout");
  assertExactKeysV01(value.population, [
    "generation_zero_size", "final_generation", "generation_zero_actor_ids",
    "initial_population", "whole_actor_mutation_enabled", "actor_identity_scope",
  ], "$.population");
  assertExactKeysV01(value.tool_manifest, [
    "manifest_version", "manifest_id", "actor_operation", "allowed_source_refs",
    "filesystem_scope", "write_scope", "shell_allowed", "git_or_github_allowed",
    "product_database_allowed", "browser_or_companion_mutation_allowed",
    "task_context_mutation_allowed", "network_allowed",
    "provider_or_model_gateway_allowed", "credential_access_allowed",
    "os_wide_read_allowed", "external_actuation_allowed", "mutation_may_expand_scope",
    "integrity",
  ], "$.tool_manifest");
  assertExactKeysV01(value.compute_budget, [
    "budget_version", "budget_id", "provider_call_limit", "network_call_limit",
    "external_effect_limit", "tool_read_limit", "step_limit", "token_limit",
    "cost_microunits_limit", "equal_for_all_baseline_arms",
    "equal_budget_is_equal_capability", "integrity",
  ], "$.compute_budget");
  if (value.experiment_version !== GOVERNED_ACTOR_LAB_EXPERIMENT_VERSION_V01 || value.experiment_kind !== "isolated_deterministic_offline_actor_lab") failV01("actor_lab_manifest_contract_invalid");
  if (value.lab_root !== GOVERNED_ACTOR_LAB_ROOT_V01) failV01("actor_lab_root_invalid", "$.lab_root");
  if (value.population.generation_zero_size !== 4 || value.population.final_generation !== 2 || value.population.generation_zero_actor_ids.length !== 4 || new Set(value.population.generation_zero_actor_ids).size !== 4) failV01("actor_lab_generation_zero_population_invalid", "$.population");
  assertInitialPopulationSpecificationV01(value.population.initial_population);
  if (
    canonicalizeProtocolValueV01(value.population.generation_zero_actor_ids) !==
    canonicalizeProtocolValueV01(
      value.population.initial_population.actors.map((actor) => actor.lab_actor_id),
    )
  ) failV01("actor_lab_initial_population_actor_binding_mismatch", "$.population");
  if (value.population.whole_actor_mutation_enabled !== false || value.population.actor_identity_scope !== "experiment_local") failV01("actor_lab_population_authority_invalid", "$.population");
  if (value.compute_budget.provider_call_limit !== 0 || value.compute_budget.network_call_limit !== 0 || value.compute_budget.external_effect_limit !== 0 || value.compute_budget.token_limit !== 0 || value.compute_budget.cost_microunits_limit !== 0) failV01("actor_lab_budget_external_effect_invalid", "$.compute_budget");
  if (value.tool_manifest.network_allowed !== false || value.tool_manifest.provider_or_model_gateway_allowed !== false || value.tool_manifest.shell_allowed !== false || value.tool_manifest.git_or_github_allowed !== false || value.tool_manifest.product_database_allowed !== false || value.tool_manifest.mutation_may_expand_scope !== false) failV01("actor_lab_tool_manifest_authority_invalid", "$.tool_manifest");
  value.tool_manifest.allowed_source_refs.forEach((source, index) => {
    validateSyntheticSourceV01(source, `$.tool_manifest.allowed_source_refs[${index}]`);
    if (source.task_family_key !== value.experiment_scope.case_family_key) failV01("actor_lab_source_family_mismatch", `$.tool_manifest.allowed_source_refs[${index}]`);
  });
  assertAuthorityAllFalseV01(value.authority_summary);
  assertIntegrityV01(value, "$.integrity");
  assertIntegrityV01(value.tool_manifest, "$.tool_manifest.integrity");
  assertIntegrityV01(value.compute_budget, "$.compute_budget.integrity");
  if (deriveIdV01("actor-lab-experiment", value, "experiment_id") !== value.experiment_id) failV01("actor_lab_experiment_id_mismatch", "$.experiment_id");
  scanForbiddenMaterialV01(value);
}

function assertPilotResultV01(input: unknown): asserts input is GovernedActorLabPilotResultV01 {
  if (!input || typeof input !== "object" || Array.isArray(input)) failV01("actor_lab_pilot_result_malformed");
  const value = input as GovernedActorLabPilotResultV01;
  assertExactKeysV01(value, ["manifest", "generations", "episodes", "transitions", "report"], "$");
  assertManifestV01(value.manifest);
  if (value.generations.length !== 3 || value.episodes.length !== 3 || value.transitions.length !== 2) failV01("actor_lab_pilot_cardinality_invalid");
  for (const [index, generation] of value.generations.entries()) {
    if (generation.generation !== index) failV01("actor_lab_pilot_generation_order_invalid");
    validateGenerationPopulationV01(
      generation.generation,
      generation.actors_at_episode_start,
      generation.memories_at_episode_start,
      value.manifest,
    );
    if (generation.post_episode_memories.length !== 4) failV01("actor_lab_post_episode_memory_cardinality_invalid");
    for (const memory of generation.post_episode_memories) {
      if (memory.generation !== generation.generation) failV01("actor_lab_post_episode_memory_generation_invalid");
      assertMemorySnapshotV01(memory);
      for (const item of memory.items) {
        if (memoryItemMaterialReasonsV01(item).length > 0) failV01("actor_lab_post_episode_memory_material_invalid");
      }
    }
    const episode = value.episodes[index]!;
    if (episode.generation !== generation.generation || episode.experiment_id !== value.manifest.experiment_id) failV01("actor_lab_episode_scope_invalid");
    assertIntegrityV01(episode, "$.episode.integrity");
    const startActorRefs = new Set(generation.actors_at_episode_start.map((actor) => canonicalizeProtocolValueV01(actorRefV01(actor))));
    const startMemoryRefs = new Set(generation.memories_at_episode_start.map((memory) => canonicalizeProtocolValueV01(memoryRefV01(memory))));
    for (const actorEpisode of episode.actor_episodes) {
      if (!startActorRefs.has(canonicalizeProtocolValueV01(actorEpisode.frozen_actor_snapshot))) failV01("actor_lab_episode_actor_start_ref_invalid");
      if (!startMemoryRefs.has(canonicalizeProtocolValueV01(actorEpisode.frozen_memory_snapshot))) failV01("actor_lab_episode_memory_start_ref_invalid");
    }
    const postMemoryRefs = new Set(generation.post_episode_memories.map((memory) => canonicalizeProtocolValueV01(memoryRefV01(memory))));
    if (episode.memory_admissions.some((admission) => !postMemoryRefs.has(canonicalizeProtocolValueV01(admission.resulting_memory_snapshot)))) failV01("actor_lab_episode_post_memory_ref_invalid");
    for (const relation of episode.evaluation.intervention_evaluations) {
      assertInterventionEvaluationV01(relation);
      if (relation.experiment_id !== value.manifest.experiment_id || relation.episode_id !== episode.episode_id || relation.evaluation_id !== episode.evaluation.evaluation_id) failV01("actor_lab_intervention_relation_scope_mismatch");
      const relationMemory = generation.memories_at_episode_start.find((memory) => memory.lab_actor_id === relation.lab_actor_id);
      const relationItem = relationMemory?.items.find((item) => item.memory_item_id === relation.memory_item_ref.memory_item_id);
      if (!relationItem || canonicalizeProtocolValueV01(memoryItemRefV01(relationItem)) !== canonicalizeProtocolValueV01(relation.memory_item_ref)) failV01("actor_lab_intervention_memory_item_ref_invalid");
    }
    const expectedEvaluationFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
      evaluation_id: episode.evaluation.evaluation_id,
      evaluator_fingerprint: episode.evaluation.evaluator_fingerprint,
      actor_outcomes: episode.evaluation.actor_outcomes,
      intervention_evaluations: episode.evaluation.intervention_evaluations,
    }));
    if (expectedEvaluationFingerprint !== episode.evaluation.evaluation_fingerprint) failV01("actor_lab_episode_evaluation_fingerprint_mismatch");
  }
  for (const [index, transition] of value.transitions.entries()) {
    const prior = value.generations[index]!;
    const next = value.generations[index + 1]!;
    if (transition.from_generation !== index || transition.to_generation !== index + 1) failV01("actor_lab_transition_generation_invalid");
    if (transition.branch_memory_policy !== "inherit_admissible_private_memory" || transition.branch_memory_reset_intervention !== false) failV01("actor_lab_transition_branch_memory_policy_invalid");
    if (canonicalizeProtocolValueV01(transition.selection_evaluation_ref) !== canonicalizeProtocolValueV01(evaluationRefV01(value.episodes[index]!))) failV01("actor_lab_transition_evaluation_ref_invalid");
    const priorPostRefs = new Set(prior.post_episode_memories.map((memory) => canonicalizeProtocolValueV01(memoryRefV01(memory))));
    if (transition.parent_post_episode_memory_refs.length !== 4 || transition.parent_post_episode_memory_refs.some((entry) => !priorPostRefs.has(canonicalizeProtocolValueV01(entry.memory)))) failV01("actor_lab_transition_parent_memory_lineage_invalid");
    const nextStartRefs = new Set(next.memories_at_episode_start.map((memory) => canonicalizeProtocolValueV01(memoryRefV01(memory))));
    if (transition.child_start_memory_refs.length !== 4 || transition.child_start_memory_refs.some((entry) => !nextStartRefs.has(canonicalizeProtocolValueV01(entry.memory)))) failV01("actor_lab_transition_child_memory_lineage_invalid");
    const priorActorBySnapshot = new Map(
      prior.actors_at_episode_start.map((actor) => [actor.actor_snapshot_id, actor]),
    );
    for (const entry of transition.child_start_memory_refs) {
      const child = next.actors_at_episode_start.find((actor) => actor.lab_actor_id === entry.lab_actor_id);
      const parent = child?.parent_actor_ref === null || child?.parent_actor_ref === undefined
        ? null
        : priorActorBySnapshot.get(child.parent_actor_ref.actor_snapshot_id) ?? null;
      if (!child || !parent || parent.lab_actor_id !== entry.parent_lab_actor_id) failV01("actor_lab_transition_child_parent_lineage_invalid");
      const parentPost = prior.post_episode_memories.find((memory) => memory.lab_actor_id === parent.lab_actor_id);
      const childStartMemory = next.memories_at_episode_start.find((memory) => memory.lab_actor_id === child.lab_actor_id);
      if (!parentPost || !childStartMemory || canonicalizeProtocolValueV01(childStartMemory.parent_snapshot) !== canonicalizeProtocolValueV01(memoryRefV01(parentPost))) failV01("actor_lab_transition_parent_memory_lineage_invalid");
      if (child.lab_actor_id !== parent.lab_actor_id) {
        for (const item of childStartMemory.items) {
          if (item.inherited_from_memory_item_ref === null || !parentPost.items.some((parentItem) => canonicalizeProtocolValueV01(memoryItemRefV01(parentItem)) === canonicalizeProtocolValueV01(item.inherited_from_memory_item_ref))) failV01("actor_lab_branch_memory_inheritance_invalid");
        }
      }
    }
    const nextActorRefs = new Set(next.actors_at_episode_start.map((actor) => canonicalizeProtocolValueV01(actorRefV01(actor))));
    if (transition.child_actor_refs.length !== 4 || transition.child_actor_refs.some((ref) => !nextActorRefs.has(canonicalizeProtocolValueV01(ref)))) failV01("actor_lab_transition_child_actor_lineage_invalid");
    for (const memory of next.memories_at_episode_start) {
      if (memory.parent_snapshot === null || !priorPostRefs.has(canonicalizeProtocolValueV01(memory.parent_snapshot))) failV01("actor_lab_transition_parent_memory_lineage_invalid");
    }
    for (const mutation of transition.mutations) {
      if (mutation.capability_scope_expanded !== false || mutation.tool_manifest_changed !== false || mutation.evaluator_changed !== false || mutation.holdout_changed !== false || mutation.mutation_budget_units !== 1) failV01("actor_lab_mutation_capability_ceiling_invalid");
      assertIntegrityV01(mutation, "$.mutation.integrity");
    }
    assertIntegrityV01(transition, "$.transition.integrity");
  }
  const interventionRefs = new Set(
    value.episodes.flatMap((episode) =>
      episode.evaluation.intervention_evaluations.map((relation) =>
        canonicalizeProtocolValueV01(interventionRefV01(relation)),
      ),
    ),
  );
  for (const memory of value.generations.flatMap((generation) => [
    ...generation.memories_at_episode_start,
    ...generation.post_episode_memories,
  ])) {
    for (const item of memory.items) {
      if (item.intervention_evaluation_ref !== null && !interventionRefs.has(canonicalizeProtocolValueV01(item.intervention_evaluation_ref))) failV01("actor_lab_memory_intervention_ref_invalid");
    }
  }
  assertReportV01(value.report);
  if (value.report.experiment_id !== value.manifest.experiment_id || value.report.manifest_ref.experiment_fingerprint !== value.manifest.integrity.fingerprint || canonicalizeProtocolValueV01(value.report.compute_budget) !== canonicalizeProtocolValueV01(value.manifest.compute_budget)) failV01("actor_lab_report_manifest_binding_mismatch");
  if (canonicalizeProtocolValueV01(value.report.population_transitions) !== canonicalizeProtocolValueV01(value.transitions)) failV01("actor_lab_report_transition_binding_mismatch");
  const expectedEpisodeRefs = value.episodes.map((episode) => ({ episode_id: episode.episode_id, episode_fingerprint: episode.integrity.fingerprint }));
  if (canonicalizeProtocolValueV01(value.report.episode_refs) !== canonicalizeProtocolValueV01(expectedEpisodeRefs)) failV01("actor_lab_report_episode_binding_mismatch");
  if (canonicalizeProtocolValueV01(value.report.episode_evaluation_refs) !== canonicalizeProtocolValueV01(value.episodes.map(evaluationRefV01))) failV01("actor_lab_report_evaluation_binding_mismatch");
  const expectedGenerationRefs = value.generations.map((generation) => ({
    generation: generation.generation,
    actors: [...generation.actors_at_episode_start].sort(compareActorsV01).map(actorRefV01),
  }));
  if (canonicalizeProtocolValueV01(value.report.generation_actor_refs) !== canonicalizeProtocolValueV01(expectedGenerationRefs)) failV01("actor_lab_report_generation_lineage_invalid");
}

function assertReportV01(input: unknown): asserts input is GovernedActorLabReportV01 {
  if (!input || typeof input !== "object" || Array.isArray(input)) failV01("actor_lab_report_malformed");
  const value = input as GovernedActorLabReportV01;
  if (value.report_version !== GOVERNED_ACTOR_LAB_REPORT_VERSION_V01 || value.report_kind !== "deterministic_mechanics_and_substrate_proof") failV01("actor_lab_report_contract_invalid");
  requiredIdV01(value.manifest_ref.experiment_id, "$.manifest_ref.experiment_id");
  requiredFingerprintV01(value.manifest_ref.experiment_fingerprint, "$.manifest_ref.experiment_fingerprint");
  if (value.manifest_ref.experiment_id !== value.experiment_id) failV01("actor_lab_report_manifest_binding_mismatch");
  validateVersionBindingV01(value.evaluator, "$.evaluator");
  validateVersionBindingV01(value.actor_engine, "$.actor_engine");
  assertIntegrityV01(value.compute_budget, "$.compute_budget.integrity");
  if (value.generation_actor_refs.length !== 3 || value.generation_actor_refs[0]?.generation !== 0 || value.generation_actor_refs[0].actors.length !== 4 || value.generation_actor_refs[2]?.generation !== 2) failV01("actor_lab_report_generation_lineage_invalid");
  if (value.baselines.map((baseline) => baseline.arm).join("|") !== GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01.join("|")) failV01("actor_lab_report_baseline_arms_invalid");
  for (const [baselineIndex, baseline] of value.baselines.entries()) {
    assertExactKeysV01(baseline, [
      "baseline_version", "observation_id", "arm", "experiment_id", "manifest_ref",
      "evaluator", "actor_engine", "development_case_sequence", "hidden_holdout_ref",
      "budget_id", "budget_fingerprint", "deterministic_seed", "arm_seed",
      "exact_budget_match", "comparable", "comparison_status",
      "non_comparable_reasons", "persistent_memory", "mutation_enabled",
      "curated_knowledge", "execution", "outcome", "complete", "mechanics_only",
      "limitations", "integrity",
    ], `$.baselines[${baselineIndex}]`);
    assertExactKeysV01(baseline.execution, [
      "episode_count", "actor_count", "memory_reset_count",
      "memory_persistence_setting", "mutation_setting", "curated_input_refs",
      "curated_input", "single_actor_repetitions", "episode_evaluation_refs",
      "actor_hard_gate_observations", "arm_hard_gate", "compute_accounting",
      "transition_refs",
    ], `$.baselines[${baselineIndex}].execution`);
    assertExactKeysV01(baseline.execution.arm_hard_gate, [
      "arm_completed", "arm_level_hard_gate_failure",
      "arm_level_hard_gate_failure_codes", "actor_hard_gate_failure_count",
      "population_selection_exclusion_count", "valid_actor_observation_count", "basis",
    ], `$.baselines[${baselineIndex}].execution.arm_hard_gate`);
    assertExactKeysV01(baseline.execution.compute_accounting, [
      "accounting_basis", "all_required_dimensions_observed", "provider_calls",
      "network_calls", "tool_reads", "deterministic_steps", "tokens",
      "cost_microunits", "external_effects", "exact_budget_match",
    ], `$.baselines[${baselineIndex}].execution.compute_accounting`);
    for (const [observationIndex, observation] of baseline.execution.actor_hard_gate_observations.entries()) {
      assertExactKeysV01(observation, [
        "episode_evaluation_ref", "observation_index", "lab_actor_id", "complete",
        "hard_gate_failure", "hard_gate_failure_codes",
        "population_selection_excluded", "observed_compute",
      ], `$.baselines[${baselineIndex}].execution.actor_hard_gate_observations[${observationIndex}]`);
      assertExactKeysV01(observation.observed_compute, [
        "provider_calls", "network_calls", "tool_reads", "deterministic_steps",
        "tokens", "cost_microunits", "external_effects",
      ], `$.baselines[${baselineIndex}].execution.actor_hard_gate_observations[${observationIndex}].observed_compute`);
    }
  }
  if (
    new Set(value.baselines.map((baseline) => baseline.budget_id)).size !== 1 ||
    value.baselines.some((baseline) => {
      if (baseline.baseline_version !== "governed_actor_lab_baseline_observation.v0.1") return true;
      if (deriveIdV01("actor-lab-baseline-observation", baseline, "observation_id") !== baseline.observation_id) return true;
      if (baseline.experiment_id !== value.experiment_id) return true;
      if (canonicalizeProtocolValueV01(baseline.manifest_ref) !== canonicalizeProtocolValueV01(value.manifest_ref)) return true;
      if (canonicalizeProtocolValueV01(baseline.evaluator) !== canonicalizeProtocolValueV01(value.evaluator)) return true;
      if (canonicalizeProtocolValueV01(baseline.actor_engine) !== canonicalizeProtocolValueV01(value.actor_engine)) return true;
      if (canonicalizeProtocolValueV01(baseline.development_case_sequence) !== canonicalizeProtocolValueV01(value.development_case_sequence)) return true;
      if (canonicalizeProtocolValueV01(baseline.hidden_holdout_ref) !== canonicalizeProtocolValueV01({ holdout_id: value.hidden_holdout_evaluation.holdout_id, holdout_fingerprint: value.hidden_holdout_evaluation.holdout_fingerprint })) return true;
      if (baseline.budget_id !== value.compute_budget.budget_id || baseline.budget_fingerprint !== value.compute_budget.integrity.fingerprint) return true;
      if (baseline.arm_seed !== createProtocolSha256V01(canonicalizeProtocolValueV01({ deterministic_seed: baseline.deterministic_seed, arm: baseline.arm }))) return true;
      if (baseline.execution.episode_count !== 3 || baseline.execution.episode_evaluation_refs.length !== 3) return true;
      const persistent = baseline.arm === "persistent_population_no_evolution" || baseline.arm === "persistent_evolutionary_population";
      const mutation = baseline.arm === "persistent_evolutionary_population";
      const curated = baseline.arm === "disposable_curated_knowledge";
      if (baseline.persistent_memory !== persistent || baseline.mutation_enabled !== mutation || baseline.curated_knowledge !== curated) return true;
      if (baseline.execution.memory_persistence_setting !== (persistent ? "private_cross_episode" : "none")) return true;
      if (baseline.execution.mutation_setting !== (mutation ? "g0_to_g1_to_g2" : "none")) return true;
      if (mutation && baseline.execution.transition_refs.length !== 2) return true;
      if (!mutation && baseline.execution.transition_refs.length !== 0) return true;
      if (curated && canonicalizeProtocolValueV01(baseline.execution.curated_input_refs) !== canonicalizeProtocolValueV01(value.development_case_sequence)) return true;
      if (!curated && baseline.execution.curated_input_refs.length !== 0) return true;
      if (curated) {
        if (baseline.execution.curated_input === null) return true;
        try {
          assertCuratedKnowledgeInputV01(
            baseline.execution.curated_input,
            value.development_case_sequence,
          );
        } catch {
          return true;
        }
        if (
          canonicalizeProtocolValueV01(
            baseline.execution.curated_input.items.map((item) => item.source_ref),
          ) !== canonicalizeProtocolValueV01(value.development_case_sequence) ||
          baseline.execution.memory_persistence_setting !== "none" ||
          baseline.execution.mutation_setting !== "none"
        ) return true;
      } else if (baseline.execution.curated_input !== null) return true;
      if (baseline.arm === "single_strong_actor" && (baseline.execution.actor_count !== 1 || baseline.execution.single_actor_repetitions !== value.compute_budget.tool_read_limit)) return true;
      if (baseline.arm === "nonpersistent_compute_matched_ensemble" && baseline.execution.memory_reset_count <= 0) return true;
      if (persistent && baseline.execution.memory_reset_count !== 0) return true;
      const compute = baseline.execution.compute_accounting;
      const rebuiltCompute = deriveGovernedActorLabBaselineComputeAccountingV01(
        baseline.execution.actor_hard_gate_observations,
        value.compute_budget,
      );
      if (
        canonicalizeProtocolValueV01(compute) !==
          canonicalizeProtocolValueV01(rebuiltCompute) ||
        compute.accounting_basis !== "sum_of_executed_actor_observations" ||
        compute.provider_calls !== 0 ||
        compute.network_calls !== 0 ||
        compute.tokens !== 0 ||
        compute.cost_microunits !== 0 ||
        compute.external_effects !== 0 ||
        baseline.outcome.compute.provider_calls !== compute.provider_calls ||
        baseline.outcome.compute.network_calls !== compute.network_calls ||
        baseline.outcome.compute.tool_reads !== compute.tool_reads ||
        baseline.outcome.compute.deterministic_steps !== compute.deterministic_steps ||
        baseline.outcome.compute.tokens !== compute.tokens ||
        baseline.outcome.compute.cost_microunits !== compute.cost_microunits ||
        baseline.outcome.compute.external_effects !== compute.external_effects
      ) return true;
      const exactBudgetMatch = rebuiltCompute.exact_budget_match;
      if (
        compute.exact_budget_match !== exactBudgetMatch ||
        baseline.exact_budget_match !== exactBudgetMatch
      ) return true;
      for (const [index, observation] of baseline.execution.actor_hard_gate_observations.entries()) {
        if (
          observation.observation_index < 0 ||
          !Number.isInteger(observation.observation_index) ||
          observation.population_selection_excluded !==
            (observation.hard_gate_failure === true) ||
          !baseline.execution.episode_evaluation_refs.some(
            (reference) =>
              canonicalizeProtocolValueV01(reference) ===
              canonicalizeProtocolValueV01(observation.episode_evaluation_ref),
          )
        ) return true;
        requiredIdV01(observation.lab_actor_id, `$.baselines.actor_hard_gate_observations[${index}].lab_actor_id`);
      }
      const rebuiltArmHardGate = deriveGovernedActorLabBaselineArmHardGateV01(
        baseline.execution.actor_hard_gate_observations,
        compute,
      );
      if (
        canonicalizeProtocolValueV01(baseline.execution.arm_hard_gate) !==
        canonicalizeProtocolValueV01(rebuiltArmHardGate) ||
        baseline.outcome.verification.hard_gate_failure !==
          rebuiltArmHardGate.arm_level_hard_gate_failure ||
        canonicalizeProtocolValueV01(baseline.outcome.verification.hard_gate_failure_codes) !==
          canonicalizeProtocolValueV01(rebuiltArmHardGate.arm_level_hard_gate_failure_codes) ||
        baseline.complete !== rebuiltArmHardGate.arm_completed
      ) return true;
      const comparable = rebuiltArmHardGate.arm_completed && exactBudgetMatch;
      const nonComparableReasons = comparable
        ? []
        : uniqueStringsV01([
            ...rebuiltArmHardGate.arm_level_hard_gate_failure_codes,
            ...(exactBudgetMatch ? [] : ["exact_budget_mismatch"]),
          ]);
      if (
        baseline.comparable !== comparable ||
        baseline.comparison_status !== (comparable ? "comparable" : "non_comparable") ||
        canonicalizeProtocolValueV01(baseline.non_comparable_reasons) !==
          canonicalizeProtocolValueV01(nonComparableReasons)
      ) return true;
      try { assertIntegrityV01(baseline, "$.baseline.integrity"); } catch { return true; }
      return false;
    })
  ) failV01("actor_lab_report_baseline_budget_mismatch");
  if (
    canonicalizeProtocolValueV01(value.non_dominance) !==
    canonicalizeProtocolValueV01(deriveGovernedActorLabBaselineNonDominanceV01(value.baselines))
  ) failV01("actor_lab_report_non_dominance_projection_invalid");
  const expectedPersistenceStatus = benefitCandidateStatusV01(
    value.baselines.find((baseline) => baseline.arm === "persistent_population_no_evolution")!,
    value.baselines.find((baseline) => baseline.arm === "nonpersistent_compute_matched_ensemble")!,
  );
  if (
    value.persistence_benefit_candidate.status !== expectedPersistenceStatus ||
    canonicalizeProtocolValueV01(value.persistence_benefit_candidate.comparison_arms) !==
      canonicalizeProtocolValueV01(["nonpersistent_compute_matched_ensemble", "persistent_population_no_evolution"]) ||
    value.persistence_benefit_candidate.verified_general_benefit !== false
  ) failV01("actor_lab_report_persistence_projection_invalid");
  const expectedEvolutionStatus = benefitCandidateStatusV01(
    value.baselines.find((baseline) => baseline.arm === "persistent_evolutionary_population")!,
    value.baselines.find((baseline) => baseline.arm === "persistent_population_no_evolution")!,
  );
  if (
    value.evolution_benefit_candidate.status !== expectedEvolutionStatus ||
    canonicalizeProtocolValueV01(value.evolution_benefit_candidate.comparison_arms) !==
      canonicalizeProtocolValueV01(["persistent_population_no_evolution", "persistent_evolutionary_population"]) ||
    value.evolution_benefit_candidate.verified_general_benefit !== false
  ) failV01("actor_lab_report_evolution_projection_invalid");
  if (value.non_dominance.ordinal_ranking_created !== false || value.non_dominance.global_winner_created !== false) failV01("actor_lab_scalar_or_winner_forbidden");
  if (value.mechanics_proof_only !== true || value.empirical_llm_evolution_benefit_proven !== false) failV01("actor_lab_mechanics_claim_invalid");
  assertProductEffectsZeroV01(value.product_effects);
  assertAuthorityAllFalseV01(value.authority_summary);
  const evaluationRefs = new Set(value.episode_evaluation_refs.map((ref) => canonicalizeProtocolValueV01(ref)));
  const harmRefs = new Set<string>();
  for (const baseline of value.baselines) {
    if ((baseline.outcome.harm.harmful_transfer_candidates ?? 0) > 0) {
      harmRefs.add(canonicalizeProtocolValueV01({
        observation_id: baseline.observation_id,
        observation_fingerprint: baseline.integrity.fingerprint,
        observation_kind: "baseline_arm_harm",
      }));
    }
  }
  if ((value.hidden_holdout_evaluation.outcome.harm.harmful_transfer_candidates ?? 0) > 0) {
    harmRefs.add(canonicalizeProtocolValueV01({
      observation_id: value.hidden_holdout_evaluation.evaluation_id,
      observation_fingerprint: value.hidden_holdout_evaluation.evaluation_fingerprint,
      observation_kind: "hidden_holdout_harm",
    }));
  }
  for (const candidate of value.promotion_candidates) {
    if (candidate.whole_actor_profile !== false || candidate.creates_episode_delta_proposal !== false) failV01("actor_lab_promotion_firewall_invalid");
    if (candidate.supporting_evaluation_refs.length === 0 || candidate.supporting_evaluation_refs.some((ref) => !evaluationRefs.has(canonicalizeProtocolValueV01(ref)))) failV01("actor_lab_promotion_evaluation_ref_invalid");
    if (candidate.harm_and_negative_transfer_refs.some((ref) => !harmRefs.has(canonicalizeProtocolValueV01(ref)))) failV01("actor_lab_promotion_harm_ref_invalid");
    assertAuthorityAllFalseV01(candidate.authority_summary);
    assertIntegrityV01(candidate, "$.promotion_candidate.integrity");
  }
  if (deriveIdV01("actor-lab-report", value, "report_id") !== value.report_id) failV01("actor_lab_report_id_mismatch", "$.report_id");
  assertIntegrityV01(value, "$.integrity");
  scanForbiddenMaterialV01(value);
}

function assertMemorySnapshotV01(input: GovernedActorLabPrivateMemorySnapshotV01): void {
  assertExactKeysV01(input, [
    "memory_version", "memory_snapshot_id", "experiment_id", "lab_actor_id",
    "generation", "parent_snapshot", "items", "item_count",
    "consultation_required_before_write", "cross_actor_read_allowed",
    "cross_experiment_read_allowed", "product_memory_accessed",
    "authority_summary", "integrity",
  ], "$.memory");
  if (input.memory_version !== GOVERNED_ACTOR_LAB_MEMORY_VERSION_V01) failV01("actor_lab_memory_version_invalid");
  if (input.item_count !== input.items.length || input.items.length > 16) failV01("actor_lab_memory_item_count_invalid");
  if (input.cross_actor_read_allowed !== false || input.cross_experiment_read_allowed !== false || input.product_memory_accessed !== false) failV01("actor_lab_memory_isolation_invalid");
  if (input.parent_snapshot !== null) {
    requiredIdV01(input.parent_snapshot.memory_snapshot_id, "$.parent_snapshot.memory_snapshot_id");
    requiredFingerprintV01(input.parent_snapshot.memory_snapshot_fingerprint, "$.parent_snapshot.memory_snapshot_fingerprint");
  }
  for (const [index, item] of input.items.entries()) {
    assertExactKeysV01(item, [
      "memory_item_id", "memory_item_fingerprint", "experiment_id", "lab_actor_id",
      "episode_id", "origin_candidate_id", "item_kind", "bounded_content",
      "task_family_key", "applicability", "uncertainty", "limitations",
      "source_refs", "support_status", "status", "supersedes_memory_item_id",
      "superseded_by_memory_item_id", "retracts_memory_item_id",
      "inherited_from_memory_item_ref", "intervention_evaluation_ref",
      "quarantine_reasons", "directive_shaped_material", "hidden_holdout_material",
    ], `$.items[${index}]`);
    requiredIdV01(item.memory_item_id, `$.items[${index}].memory_item_id`);
    requiredIdV01(item.episode_id, `$.items[${index}].episode_id`);
    requiredIdV01(item.origin_candidate_id, `$.items[${index}].origin_candidate_id`);
    requiredIdV01(item.task_family_key, `$.items[${index}].task_family_key`);
    boundedTextV01(item.bounded_content, `$.items[${index}].bounded_content`, 800);
    boundedTextV01(item.applicability, `$.items[${index}].applicability`, 800);
    if (item.item_kind !== "procedural_operator_memory" && item.item_kind !== "evidence_retrieval_memory") failV01("actor_lab_memory_item_kind_invalid", `$.items[${index}].item_kind`);
    if (item.support_status !== "support_validated" && item.support_status !== "unknown" && item.support_status !== "refused") failV01("actor_lab_memory_item_support_status_invalid", `$.items[${index}].support_status`);
    if (item.status !== "current" && item.status !== "superseded" && item.status !== "retracted" && item.status !== "quarantined") failV01("actor_lab_memory_item_status_invalid", `$.items[${index}].status`);
    if (item.source_refs.length === 0 || item.source_refs.length > 8) failV01("actor_lab_memory_item_sources_invalid", `$.items[${index}].source_refs`);
    item.source_refs.forEach((source, sourceIndex) =>
      validateSyntheticSourceV01(source, `$.items[${index}].source_refs[${sourceIndex}]`),
    );
    if (item.experiment_id !== input.experiment_id || item.lab_actor_id !== input.lab_actor_id) failV01("actor_lab_memory_item_scope_mismatch");
    if (memoryItemFingerprintV01(item) !== item.memory_item_fingerprint) failV01("actor_lab_memory_item_fingerprint_mismatch");
    if (item.inherited_from_memory_item_ref !== null) {
      requiredIdV01(item.inherited_from_memory_item_ref.memory_item_id, `$.items[${index}].inherited_from_memory_item_ref.memory_item_id`);
      requiredFingerprintV01(item.inherited_from_memory_item_ref.memory_item_fingerprint, `$.items[${index}].inherited_from_memory_item_ref.memory_item_fingerprint`);
    }
    if (item.intervention_evaluation_ref !== null) {
      requiredIdV01(item.intervention_evaluation_ref.intervention_id, `$.items[${index}].intervention_evaluation_ref.intervention_id`);
      requiredFingerprintV01(item.intervention_evaluation_ref.intervention_fingerprint, `$.items[${index}].intervention_evaluation_ref.intervention_fingerprint`);
    }
  }
  assertAuthorityAllFalseV01(input.authority_summary);
  assertIntegrityV01(input, "$.integrity");
}

function validateMemoryCandidateV01(candidate: GovernedActorLabMemoryCandidateV01): void {
  requiredIdV01(candidate.candidate_id, "$.candidate_id");
  requiredIdV01(candidate.experiment_id, "$.experiment_id");
  requiredIdV01(candidate.lab_actor_id, "$.lab_actor_id");
  requiredIdV01(candidate.episode_id, "$.episode_id");
  requiredIdV01(candidate.task_family_key, "$.task_family_key");
  boundedTextV01(candidate.bounded_content, "$.bounded_content", 800);
  if (candidate.source_refs.length === 0 || candidate.source_refs.length > 8) failV01("actor_lab_memory_candidate_sources_invalid");
  candidate.source_refs.forEach((source, index) =>
    validateSyntheticSourceV01(source, `$.source_refs[${index}]`),
  );
  if (candidate.intervention_evaluation_ref !== null) {
    requiredIdV01(candidate.intervention_evaluation_ref.intervention_id, "$.intervention_evaluation_ref.intervention_id");
    requiredFingerprintV01(candidate.intervention_evaluation_ref.intervention_fingerprint, "$.intervention_evaluation_ref.intervention_fingerprint");
  }
  scanForbiddenMaterialV01({ ...candidate, directive_shaped_material: false, hidden_holdout_material: false });
}

function assertInterventionEvaluationV01(
  input: GovernedActorLabInterventionEvaluationV01,
): void {
  assertExactKeysV01(input, [
    "intervention_id", "experiment_id", "episode_id", "evaluation_id",
    "lab_actor_id", "memory_item_ref", "task_family_key", "source_ref",
    "intervention_kind", "control", "treatment", "same_actor", "same_case",
    "same_evaluator", "causal_scope", "general_causal_contribution_claimed",
    "integrity",
  ], "$.intervention_evaluation");
  requiredIdV01(input.intervention_id, "$.intervention_id");
  requiredIdV01(input.experiment_id, "$.experiment_id");
  requiredIdV01(input.episode_id, "$.episode_id");
  requiredIdV01(input.evaluation_id, "$.evaluation_id");
  requiredIdV01(input.lab_actor_id, "$.lab_actor_id");
  requiredIdV01(input.memory_item_ref.memory_item_id, "$.memory_item_ref.memory_item_id");
  requiredFingerprintV01(input.memory_item_ref.memory_item_fingerprint, "$.memory_item_ref.memory_item_fingerprint");
  validateSyntheticSourceV01(input.source_ref, "$.source_ref");
  if (
    input.intervention_kind !== "memory_item_present_vs_absent" ||
    input.control.memory_item_present !== false ||
    input.control.support_validated !== false ||
    input.control.outcome_associated !== false ||
    input.treatment.memory_item_present !== true ||
    input.treatment.support_validated !== true ||
    input.treatment.outcome_associated !== true ||
    input.same_actor !== true ||
    input.same_case !== true ||
    input.same_evaluator !== true ||
    input.causal_scope !== "exact_item_exact_episode_only" ||
    input.general_causal_contribution_claimed !== false
  ) failV01("actor_lab_intervention_relation_invalid");
  assertIntegrityV01(input, "$.intervention_evaluation.integrity");
}

function validateGenerationPopulationV01(
  generation: GovernedActorLabGenerationV01,
  actors: GovernedActorLabActorSnapshotV01[],
  memories: GovernedActorLabPrivateMemorySnapshotV01[],
  manifest: GovernedActorLabExperimentManifestV01,
  requireExactActorMemoryBinding = true,
): void {
  if (actors.length !== 4 || memories.length !== 4) failV01("actor_lab_population_size_invalid");
  if (new Set(actors.map((actor) => actor.lab_actor_id)).size !== 4) failV01("actor_lab_actor_identity_duplicate");
  const memoryByActor = new Map(memories.map((memory) => [memory.lab_actor_id, memory]));
  for (const actor of actors) {
    if (actor.actor_version !== GOVERNED_ACTOR_LAB_ACTOR_VERSION_V01 || actor.generation !== generation || actor.experiment_id !== manifest.experiment_id) failV01("actor_lab_actor_scope_invalid");
    if (actor.tool_manifest_fingerprint !== manifest.tool_manifest.integrity.fingerprint || actor.capability_ceiling_fingerprint !== manifest.tool_manifest.integrity.fingerprint) failV01("actor_lab_capability_scope_expanded");
    assertAuthorityAllFalseV01(actor.authority_summary);
    assertIntegrityV01(actor, "$.actor.integrity");
    const memory = memoryByActor.get(actor.lab_actor_id);
    if (!memory || (requireExactActorMemoryBinding && canonicalizeProtocolValueV01(actor.private_memory) !== canonicalizeProtocolValueV01(memoryRefV01(memory)))) failV01("actor_lab_actor_memory_binding_mismatch");
    if (generation === 0) {
      const initial = manifest.population.initial_population.actors.find(
        (entry) => entry.lab_actor_id === actor.lab_actor_id,
      );
      if (
        !initial ||
        canonicalizeProtocolValueV01(actor.profile) !==
          canonicalizeProtocolValueV01(initial.profile)
      ) failV01("actor_lab_initial_population_execution_mismatch");
    }
  }
  for (const memory of memories) {
    if (memory.generation !== generation) failV01("actor_lab_memory_generation_invalid");
    assertMemorySnapshotV01(memory);
  }
}

function assertAuthorityAllFalseV01(summary: GovernedActorLabAuthoritySummaryV01): void {
  for (const key of authorityFalseKeys) if (summary[key] !== false) failV01("actor_lab_authority_boundary_invalid", `$.authority_summary.${key}`);
}

function assertProductEffectsZeroV01(effects: GovernedActorLabProductEffectLedgerV01): void {
  for (const [key, value] of Object.entries(effects)) if (value !== 0) failV01("actor_lab_product_effect_nonzero", `$.product_effects.${key}`);
}

function validateSyntheticSourceV01(source: GovernedActorLabSyntheticSourceV01, path: string): void {
  requiredIdV01(source.source_id, `${path}.source_id`);
  requiredFingerprintV01(source.source_fingerprint, `${path}.source_fingerprint`);
  requiredIdV01(source.task_family_key, `${path}.task_family_key`);
  if (parseStrictIsoTimestampV01(source.available_at) === null) failV01("actor_lab_source_timestamp_invalid", `${path}.available_at`);
}

function validateVersionBindingV01(binding: { version: string; fingerprint: string }, path: string): void {
  requiredIdV01(binding.version, `${path}.version`);
  requiredFingerprintV01(binding.fingerprint, `${path}.fingerprint`);
}

function pendingIntegrityV01(): GovernedActorLabIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: GOVERNED_ACTOR_LAB_CANONICALIZATION_V01,
    fingerprint_scope: "object_without_integrity_fingerprint",
    fingerprint: PENDING_FINGERPRINT,
  };
}

function sealObjectV01<T extends { integrity: GovernedActorLabIntegrityV01 }>(input: T): T {
  const value = structuredClone(input);
  value.integrity.fingerprint = PENDING_FINGERPRINT;
  value.integrity.fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(value));
  return value;
}

function assertIntegrityV01(input: { integrity: GovernedActorLabIntegrityV01 }, path: string): void {
  if (input.integrity.algorithm !== "sha256" || input.integrity.canonicalization !== GOVERNED_ACTOR_LAB_CANONICALIZATION_V01 || input.integrity.fingerprint_scope !== "object_without_integrity_fingerprint") failV01("actor_lab_integrity_contract_invalid", path);
  const copy = structuredClone(input);
  copy.integrity.fingerprint = PENDING_FINGERPRINT;
  const expected = createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
  if (expected !== input.integrity.fingerprint) failV01("actor_lab_fingerprint_mismatch", path);
}

function deriveIdV01(prefix: string, input: unknown, idField: string, fingerprintField?: string): string {
  const copy = structuredClone(input) as Record<string, unknown>;
  copy[idField] = `${prefix}:pending`;
  if (fingerprintField) copy[fingerprintField] = PENDING_FINGERPRINT;
  if (copy.integrity && typeof copy.integrity === "object") (copy.integrity as Record<string, unknown>).fingerprint = PENDING_FINGERPRINT;
  return `${prefix}:${createProtocolSha256V01(canonicalizeProtocolValueV01(copy)).slice("sha256:".length)}`;
}

function deriveSimpleIdV01(prefix: string, input: unknown): string {
  return `${prefix}:${createProtocolSha256V01(canonicalizeProtocolValueV01(input)).slice("sha256:".length)}`;
}

function memoryItemFingerprintV01(item: GovernedActorLabMemoryItemV01): string {
  const copy = structuredClone(item);
  copy.memory_item_fingerprint = PENDING_FINGERPRINT;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

function memoryItemRefV01(
  item: GovernedActorLabMemoryItemV01,
): { memory_item_id: string; memory_item_fingerprint: string } {
  return {
    memory_item_id: item.memory_item_id,
    memory_item_fingerprint: item.memory_item_fingerprint,
  };
}

function actorRefV01(actor: GovernedActorLabActorSnapshotV01): GovernedActorLabActorSnapshotReferenceV01 {
  return { actor_snapshot_id: actor.actor_snapshot_id, actor_snapshot_fingerprint: actor.integrity.fingerprint };
}

function memoryRefV01(memory: GovernedActorLabPrivateMemorySnapshotV01): GovernedActorLabMemorySnapshotReferenceV01 {
  return { memory_snapshot_id: memory.memory_snapshot_id, memory_snapshot_fingerprint: memory.integrity.fingerprint };
}

function evaluationRefV01(
  episode: GovernedActorLabEpisodeArtifactV01,
): GovernedActorLabEvaluationReferenceV01 {
  return {
    evaluation_id: episode.evaluation.evaluation_id,
    evaluation_fingerprint: episode.evaluation.evaluation_fingerprint,
  };
}

function interventionRefV01(
  intervention: GovernedActorLabInterventionEvaluationV01,
): GovernedActorLabInterventionEvaluationReferenceV01 {
  return {
    intervention_id: intervention.intervention_id,
    intervention_fingerprint: intervention.integrity.fingerprint,
  };
}

function mutationRefV01(mutation: GovernedActorLabMutationV01): GovernedActorLabMutationReferenceV01 {
  return { mutation_id: mutation.mutation_id, mutation_fingerprint: mutation.integrity.fingerprint, unit: mutation.unit };
}

function compareActorsV01(left: GovernedActorLabActorSnapshotV01, right: GovernedActorLabActorSnapshotV01): number {
  return compareProtocolCodeUnitsV01(left.lab_actor_id, right.lab_actor_id);
}

function compareMemoriesV01(left: GovernedActorLabPrivateMemorySnapshotV01, right: GovernedActorLabPrivateMemorySnapshotV01): number {
  return compareProtocolCodeUnitsV01(left.lab_actor_id, right.lab_actor_id);
}

function compareSourcesV01(left: GovernedActorLabSyntheticSourceV01, right: GovernedActorLabSyntheticSourceV01): number {
  return compareProtocolCodeUnitsV01(left.source_id, right.source_id);
}

function seedNumberV01(...parts: Array<string | number>): number {
  const digest = createProtocolSha256V01(canonicalizeProtocolValueV01(parts)).slice("sha256:".length, "sha256:".length + 8);
  return Number.parseInt(digest, 16);
}

function requiredIdV01(value: unknown, path: string): string {
  if (typeof value !== "string" || !SAFE_ID_PATTERN.test(value)) failV01("actor_lab_id_invalid", path);
  return value;
}

function requiredFingerprintV01(value: unknown, path: string): string {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) failV01("actor_lab_fingerprint_invalid", path);
  return value;
}

function boundedPositiveIntegerV01(value: unknown, path: string, max: number): number {
  if (!Number.isInteger(value) || (value as number) <= 0 || (value as number) > max) failV01("actor_lab_budget_invalid", path);
  return value as number;
}

function boundedTextV01(value: unknown, path: string, max = MAX_TEXT): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > max) failV01("actor_lab_text_invalid", path);
  if (ABSOLUTE_PATH_PATTERN.test(value)) failV01("actor_lab_absolute_path_forbidden", path);
  if (SECRET_PATTERN.test(value)) failV01("actor_lab_secret_forbidden", path);
  return value.trim();
}

function uniqueBoundedTextV01(values: string[]): string[] {
  return uniqueStringsV01(values.map((value, index) => boundedTextV01(value, `$.text[${index}]`)));
}

function uniqueStringsV01(values: string[]): string[] {
  return [...new Set(values)].sort(compareProtocolCodeUnitsV01);
}

function uniqueByCanonicalV01<T>(values: T[]): T[] {
  const map = new Map<string, T>();
  for (const value of values) map.set(canonicalizeProtocolValueV01(value), structuredClone(value));
  return [...map.values()];
}

function assertExactKeysV01(
  input: object,
  expectedKeys: string[],
  path: string,
): void {
  const actual = Object.keys(input).sort(compareProtocolCodeUnitsV01);
  const expected = [...expectedKeys].sort(compareProtocolCodeUnitsV01);
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(expected)) {
    failV01("actor_lab_serialized_shape_invalid", path);
  }
}

function scanForbiddenMaterialV01(value: unknown, path = "$"): void {
  if (typeof value === "string") {
    if (SECRET_PATTERN.test(value)) failV01("actor_lab_secret_forbidden", path);
    if (ABSOLUTE_PATH_PATTERN.test(value)) failV01("actor_lab_absolute_path_forbidden", path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenMaterialV01(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (child !== false && /(?:^|_)(?:raw_prompt|prompt|transcript|terminal_output|provider_output|hidden_reasoning|chain_of_thought|credential|secret|api_key)(?:_|$)/iu.test(key)) failV01("actor_lab_forbidden_material_field", `${path}.${key}`);
    scanForbiddenMaterialV01(child, `${path}.${key}`);
  }
}

function validationFailureV01(error: unknown): GovernedActorLabValidationResultV01 {
  if (error instanceof GovernedActorLabErrorV01) return { status: "blocked", errors: [{ code: error.code, path: error.path }] };
  return { status: "blocked", errors: [{ code: "actor_lab_invalid", path: "$" }] };
}

function negateNullableV01(value: number | null): number | null {
  return value === null ? null : -value;
}

function failV01(code: string, path = "$"): never {
  throw new GovernedActorLabErrorV01(code, path);
}
