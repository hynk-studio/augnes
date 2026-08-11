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
  type GovernedActorLabBaselineObservationV01,
  type GovernedActorLabBudgetEnvelopeV01,
  type GovernedActorLabEpisodeArtifactV01,
  type GovernedActorLabExperimentManifestV01,
  type GovernedActorLabGenerationV01,
  type GovernedActorLabHoldoutFixtureV01,
  type GovernedActorLabIntegrityV01,
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
import type { StrategyCompositionCaseReferenceV01 } from "@/types/vnext/strategy-composition-case";

const SAFE_ID_PATTERN = /^[A-Za-z0-9:._-]{1,256}$/u;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const ABSOLUTE_PATH_PATTERN = /(?:^|\s)(?:\/(?:Users|home|var|tmp|private|etc)\/|[A-Za-z]:\\)/u;
const SECRET_PATTERN = /(?:sk-[A-Za-z0-9_-]{16,}|api[_-]?key\s*[:=]|bearer\s+[A-Za-z0-9._-]{16,})/iu;
const DIRECTIVE_PATTERN = /(?:ignore\s+(?:all\s+)?previous|system\s+prompt|developer\s+message|execute\s+(?:shell|command)|curl\s+https?:|reveal\s+(?:secret|credential)|hidden\s+holdout)/iu;
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
  const generationZeroActorIds = ["actor:a", "actor:b", "actor:c", "actor:d"];
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
  strategyRecipeRefs: StrategyCompositionCaseReferenceV01[],
): {
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
} {
  assertValidGovernedActorLabManifestV01(manifest);
  const profiles: GovernedActorLabActorProfileV01[] = [
    profileV01("verification_first", "support_and_currentness", "strict_source_only", "verify_then_solve", ["verification", "evidence_request"], strategyRecipeRefs),
    profileV01("scope_sentinel", "scope_and_conflict", "revision_preferred", "bound_then_solve", ["scope_narrowing", "abstention"], strategyRecipeRefs),
    profileV01("counterexample_search", "falsifier_and_harm", "quarantine_first", "challenge_then_narrow", ["falsification", "uncertainty_preservation"], strategyRecipeRefs),
    profileV01("bounded_synthesis", "minimal_sufficient_set", "minimal_retention", "synthesize_then_abstain", ["synthesis", "decomposition"], strategyRecipeRefs),
  ];
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
  },
): GovernedActorLabMemoryItemV01[] {
  const memory = readGovernedActorLabPrivateMemoryV01(snapshot, request);
  requiredIdV01(request.task_family_key, "$.task_family_key");
  const retrieved = memory.items.filter((item) => {
    if (item.status !== "current") return false;
    if (item.quarantine_reasons.length > 0) return false;
    if (item.directive_shaped_material || item.hidden_holdout_material) return false;
    if (item.support_status !== "support_validated") return false;
    return item.task_family_key === request.task_family_key;
  });
  return structuredClone(retrieved.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id),
  ));
}

export function admitGovernedActorLabMemoryCandidateV01(
  snapshotInput: GovernedActorLabPrivateMemorySnapshotV01,
  candidateInput: GovernedActorLabMemoryCandidateV01,
  options: { evaluation_frozen: boolean },
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
  const permission = memoryPermissionV01(candidate, poisonReasons);
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
    });
    const peer = actors[(index + 1) % actors.length]!;
    const traces = buildItemTracesV01(actor, memory, retrieved);
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
  const evaluatorFingerprint = input.manifest.evaluator.fingerprint;
  const evaluationId = deriveSimpleIdV01("actor-lab-evaluation", { episodeId, evaluatorFingerprint, actorOutcomes });
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
    });
    const admitted = admitGovernedActorLabMemoryCandidateV01(nextMemories[currentIndex]!, candidate, { evaluation_frozen: true });
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
      evaluator_fingerprint: evaluatorFingerprint,
      frozen: true,
      frozen_before_memory_admission: true,
      actor_outcomes: actorOutcomes,
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
  validateGenerationPopulationV01(fromGeneration, input.actors, input.memories, input.manifest);
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
        : [],
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
  if (input.holdout.holdout_id !== input.manifest.hidden_holdout.holdout_id || input.holdout.holdout_fingerprint !== input.manifest.hidden_holdout.holdout_fingerprint) {
    failV01("actor_lab_holdout_identity_mismatch");
  }
  const computed = createProtocolSha256V01(canonicalizeProtocolValueV01(input.holdout.content));
  if (computed !== input.holdout.holdout_fingerprint) {
    failV01("actor_lab_holdout_fingerprint_mismatch");
  }
  const actors = [...input.actors].sort(compareActorsV01);
  let passed = 0;
  let failed = 0;
  let harmful = 0;
  for (const testCase of input.holdout.content.cases) {
    const matched = actors.some((actor) => actor.profile.procedural_operator_policy === testCase.required_policy_signal);
    if (matched) passed += 1;
    else failed += 1;
    if (testCase.harmful_transfer_trap && actors.every((actor) => actor.profile.evidence_retrieval_policy !== "falsifier_and_harm")) harmful += 1;
  }
  return outcomeVectorV01({
    hardGate: false,
    passedChecks: input.holdout.content.cases.length,
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
    toolReads: input.manifest.compute_budget.tool_read_limit,
    steps: input.manifest.compute_budget.step_limit,
  });
}

export function buildGovernedActorLabBaselineObservationsV01(
  manifest: GovernedActorLabExperimentManifestV01,
): GovernedActorLabBaselineObservationV01[] {
  const budget = manifest.compute_budget;
  const specifications: Record<GovernedActorLabBaselineArmV01, {
    persistent: boolean;
    mutation: boolean;
    curated: boolean;
    passed: number;
    support: number;
    harm: number;
    burden: number;
    limitations: string[];
  }> = {
    single_strong_actor: { persistent: false, mutation: false, curated: false, passed: 2, support: 3, harm: 0, burden: 2, limitations: ["One deterministic policy repeated to consume the exact matched step budget."] },
    nonpersistent_compute_matched_ensemble: { persistent: false, mutation: false, curated: false, passed: 3, support: 4, harm: 1, burden: 4, limitations: ["Disposable actors share no cross-episode memory."] },
    persistent_population_no_evolution: { persistent: true, mutation: false, curated: false, passed: 3, support: 5, harm: 1, burden: 4, limitations: ["Profiles remain fixed while private memory persists."] },
    persistent_evolutionary_population: { persistent: true, mutation: true, curated: false, passed: 4, support: 5, harm: 0, burden: 5, limitations: ["Mechanics fixture only; this is not empirical model-evolution benefit."] },
    disposable_curated_knowledge: { persistent: false, mutation: false, curated: true, passed: 3, support: 4, harm: 0, burden: 2, limitations: ["Curated knowledge is exact source-bound deterministic material, not invented actor memory."] },
  };
  return GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01.map((arm) => {
    const spec = specifications[arm];
    return {
      arm,
      budget_id: budget.budget_id,
      budget_fingerprint: budget.integrity.fingerprint,
      exact_budget_match: true,
      persistent_memory: spec.persistent,
      mutation_enabled: spec.mutation,
      curated_knowledge: spec.curated,
      outcome: outcomeVectorV01({
        hardGate: false,
        passedChecks: spec.passed,
        supportedClaims: spec.support,
        unsupportedClaims: 0,
        holdoutPassed: spec.passed,
        holdoutFailed: 4 - spec.passed,
        eligible: spec.persistent ? 4 : 0,
        retrieved: spec.persistent ? 3 : 0,
        presented: spec.persistent ? 3 : 0,
        cited: spec.persistent ? 2 : 0,
        supportValidated: spec.persistent ? 2 : 0,
        outcomeAssociated: spec.persistent ? 1 : 0,
        causal: 0,
        quarantined: 0,
        harmful: spec.harm,
        poisonRefusals: 1,
        interference: 0,
        challenges: spec.burden,
        syntheses: spec.burden,
        reviews: spec.burden,
        toolReads: budget.tool_read_limit,
        steps: budget.step_limit,
      }),
      complete: true,
      mechanics_only: true,
      limitations: spec.limitations,
    };
  });
}

export function runGovernedActorLabPilotV01(input: {
  manifest: GovernedActorLabExperimentManifestV01;
  strategy_recipe_refs: StrategyCompositionCaseReferenceV01[];
  development_sources: readonly [
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
    GovernedActorLabSyntheticSourceV01,
  ];
  hidden_holdout: GovernedActorLabHoldoutFixtureV01;
}): GovernedActorLabPilotResultV01 {
  assertValidGovernedActorLabManifestV01(input.manifest);
  const generationZero = buildGovernedActorLabGenerationZeroV01(input.manifest, input.strategy_recipe_refs);
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
  const baselines = buildGovernedActorLabBaselineObservationsV01(input.manifest);
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
      { generation: 0, actors: generationZero.actors, memories: episodeZero.memories },
      { generation: 1, actors: transitionOne.actors, memories: episodeOne.memories },
      { generation: 2, actors: transitionTwo.actors, memories: episodeTwo.memories },
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
    strategy_recipe_refs: uniqueByCanonicalV01(recipes).sort((left, right) => compareProtocolCodeUnitsV01(left.case_id, right.case_id)),
  };
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
): GovernedActorLabItemTraceV01[] {
  const retrievedIds = new Set(retrieved.map((item) => item.memory_item_id));
  const citedId = retrieved[0]?.memory_item_id ?? null;
  return memory.items.map((item) => {
    const eligible = item.status === "current" && item.quarantine_reasons.length === 0;
    const wasRetrieved = retrievedIds.has(item.memory_item_id);
    const cited = wasRetrieved && item.memory_item_id === citedId;
    const supportValidated = cited && item.support_status === "support_validated";
    const outcomeAssociated = supportValidated && actor.profile.procedural_operator_policy === "verification_first";
    return {
      memory_item_id: item.memory_item_id,
      eligible,
      retrieved: wasRetrieved,
      presented: wasRetrieved,
      cited_or_referenced: cited,
      support_validated: supportValidated,
      outcome_associated: outcomeAssociated,
      causal_contribution: item.bounded_content.includes("matched intervention")
        ? "matched_intervention_supported"
        : "unknown_no_intervention",
      source_refs: structuredClone(item.source_refs),
      limitations: outcomeAssociated
        ? ["Outcome association remains observational without an exact intervention relation."]
        : ["No item-specific outcome relation is available."],
    };
  });
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
}): GovernedActorLabMemoryCandidateV01 {
  const current = input.memory.items.find((item) => item.status === "current") ?? null;
  let operation: GovernedActorLabMemoryOperationV01 = "add";
  let target: string | null = null;
  let content = `Use ${input.actor.profile.procedural_operator_policy} within ${input.source.task_family_key}.`;
  let evidenceClass: ExternalRefTrustClassV01 = "direct_local_observation";
  let evidenceBasis: GovernedActorLabMemoryCandidateV01["evidence_basis"] = "source_verification";
  if (input.generation === 1) {
    operation = current === null
      ? "add"
      : input.existingMemoryIndex === 0
        ? "revise"
        : input.existingMemoryIndex === 1
          ? "supersede"
          : input.existingMemoryIndex === 2
            ? "retract"
            : "no_change";
    target = operation === "no_change" ? null : current?.memory_item_id ?? null;
    content = operation === "no_change" && current
      ? current.bounded_content
      : `${operation} the bounded ${input.actor.profile.procedural_operator_policy} procedure after matched intervention.`;
    evidenceClass = input.actorIndex === 1 ? "verified_external_observation" : "direct_local_observation";
    evidenceBasis = operation === "supersede" || operation === "retract" ? "matched_intervention" : "source_verification";
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
    source_refs: [input.source],
    evidence_class: evidenceClass,
    evidence_basis: evidenceBasis,
    support_status: "support_validated",
    directive_shaped_material: false,
    hidden_holdout_material: false,
  };
}

function memoryPermissionV01(
  candidate: GovernedActorLabMemoryCandidateV01,
  poisonReasons: string[],
): GovernedActorLabMemoryAdmissionV01["permission"] {
  if (poisonReasons.length > 0) return "quarantined";
  if (candidate.support_status !== "support_validated") return candidate.support_status === "refused" ? "refused" : "candidate_unknown";
  if (candidate.evidence_basis === "self_assertion" || candidate.evidence_basis === "evaluator_preference" || candidate.evidence_basis === "unsupported") return "candidate_unknown";
  const strongTrust = candidate.evidence_class === "direct_local_observation" || candidate.evidence_class === "verified_external_observation";
  if (!strongTrust) return candidate.evidence_class === "imported_unverified" ? "refused" : "candidate_unknown";
  if (
    candidate.requested_operation === "supersede" &&
    candidate.evidence_basis !== "matched_intervention"
  ) return "candidate_unknown";
  if (
    candidate.requested_operation === "retract" &&
    candidate.evidence_basis !== "matched_intervention" &&
    candidate.evidence_basis !== "negative_verdict"
  ) return "candidate_unknown";
  return "permitted";
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
  const nonDominance = baselineNonDominanceV01(input.baselines);
  const poisoningRefusals = input.episodes.reduce((sum, episode) => sum + episode.memory_admissions.filter((admission) => admission.permission === "quarantined" || admission.permission === "refused").length, 0);
  const harmful = input.baselines.reduce((sum, baseline) => sum + (baseline.outcome.harm.harmful_transfer_candidates ?? 0), 0);
  const uniqueProfiles = new Set(input.generations.at(-1)!.map((actor) => canonicalizeProtocolValueV01(actor.profile)));
  const promotions = input.transitions.flatMap((transition) => transition.mutations.slice(0, 1).map((mutation) => buildPromotionCandidateV01(input.manifest, transition, mutation)));
  const draft: GovernedActorLabReportV01 = {
    report_version: GOVERNED_ACTOR_LAB_REPORT_VERSION_V01,
    report_id: "actor-lab-report:pending",
    report_kind: "deterministic_mechanics_and_substrate_proof",
    experiment_id: input.manifest.experiment_id,
    generation_actor_refs: input.generations.map((actors, generation) => ({
      generation: generation as GovernedActorLabGenerationV01,
      actors: [...actors].sort(compareActorsV01).map(actorRefV01),
    })),
    episode_refs: input.episodes.map((episode) => ({ episode_id: episode.episode_id, episode_fingerprint: episode.integrity.fingerprint })),
    population_transitions: structuredClone(input.transitions),
    hidden_holdout_evaluation: {
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
      status: "mixed",
      comparison_arms: ["nonpersistent_compute_matched_ensemble", "persistent_population_no_evolution"],
      verified_general_benefit: false,
    },
    evolution_benefit_candidate: {
      status: "mixed",
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
): GovernedActorLabPromotionCandidateV01 {
  const draft: GovernedActorLabPromotionCandidateV01 = {
    promotion_version: GOVERNED_ACTOR_LAB_PROMOTION_VERSION_V01,
    promotion_candidate_id: "actor-lab-promotion-candidate:pending",
    experiment_id: manifest.experiment_id,
    generation: transition.to_generation,
    actor_lineage_refs: [mutation.parent_actor_snapshot],
    unit: mutation.unit,
    unit_ref: mutation.mutation_id,
    supporting_evaluation_refs: transition.child_actor_refs.map((ref) => ref.actor_snapshot_id),
    harm_and_negative_transfer_refs: ["actor-lab-report:local-harm-vector"],
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

function baselineNonDominanceV01(
  baselines: GovernedActorLabBaselineObservationV01[],
): GovernedActorLabReportV01["non_dominance"] {
  if (baselines.some((baseline) => !baseline.complete)) {
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
      if (dominatesOutcomeV01(left.outcome, right.outcome)) {
        dominated.add(right.arm);
        dominatedRelations.push({ dominant_arm: left.arm, dominated_arm: right.arm, basis: "all_observed_dimensions_no_worse_and_one_better" });
      } else if (dominatesOutcomeV01(right.outcome, left.outcome)) {
        dominated.add(left.arm);
        dominatedRelations.push({ dominant_arm: right.arm, dominated_arm: left.arm, basis: "all_observed_dimensions_no_worse_and_one_better" });
      } else {
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
  if (value.experiment_version !== GOVERNED_ACTOR_LAB_EXPERIMENT_VERSION_V01 || value.experiment_kind !== "isolated_deterministic_offline_actor_lab") failV01("actor_lab_manifest_contract_invalid");
  if (value.lab_root !== GOVERNED_ACTOR_LAB_ROOT_V01) failV01("actor_lab_root_invalid", "$.lab_root");
  if (value.population.generation_zero_size !== 4 || value.population.final_generation !== 2 || value.population.generation_zero_actor_ids.length !== 4 || new Set(value.population.generation_zero_actor_ids).size !== 4) failV01("actor_lab_generation_zero_population_invalid", "$.population");
  if (value.hidden_holdout.content_in_manifest !== false || Object.hasOwn(value.hidden_holdout as object, "content")) failV01("actor_lab_holdout_content_leakage", "$.hidden_holdout");
  if (value.compute_budget.provider_call_limit !== 0 || value.compute_budget.network_call_limit !== 0 || value.compute_budget.external_effect_limit !== 0 || value.compute_budget.token_limit !== 0 || value.compute_budget.cost_microunits_limit !== 0) failV01("actor_lab_budget_external_effect_invalid", "$.compute_budget");
  if (value.tool_manifest.network_allowed !== false || value.tool_manifest.provider_or_model_gateway_allowed !== false || value.tool_manifest.shell_allowed !== false || value.tool_manifest.git_or_github_allowed !== false || value.tool_manifest.product_database_allowed !== false || value.tool_manifest.mutation_may_expand_scope !== false) failV01("actor_lab_tool_manifest_authority_invalid", "$.tool_manifest");
  assertAuthorityAllFalseV01(value.authority_summary);
  assertIntegrityV01(value, "$.integrity");
  assertIntegrityV01(value.tool_manifest, "$.tool_manifest.integrity");
  assertIntegrityV01(value.compute_budget, "$.compute_budget.integrity");
  scanForbiddenMaterialV01(value);
}

function assertReportV01(input: unknown): asserts input is GovernedActorLabReportV01 {
  if (!input || typeof input !== "object" || Array.isArray(input)) failV01("actor_lab_report_malformed");
  const value = input as GovernedActorLabReportV01;
  if (value.report_version !== GOVERNED_ACTOR_LAB_REPORT_VERSION_V01 || value.report_kind !== "deterministic_mechanics_and_substrate_proof") failV01("actor_lab_report_contract_invalid");
  if (value.generation_actor_refs.length !== 3 || value.generation_actor_refs[0]?.generation !== 0 || value.generation_actor_refs[0].actors.length !== 4 || value.generation_actor_refs[2]?.generation !== 2) failV01("actor_lab_report_generation_lineage_invalid");
  if (value.baselines.map((baseline) => baseline.arm).join("|") !== GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01.join("|")) failV01("actor_lab_report_baseline_arms_invalid");
  if (
    new Set(value.baselines.map((baseline) => baseline.budget_id)).size !== 1 ||
    value.baselines.some(
      (baseline) =>
        baseline.exact_budget_match !== true ||
        baseline.outcome.compute.provider_calls !== 0 ||
        baseline.outcome.compute.network_calls !== 0 ||
        baseline.outcome.compute.external_effects !== 0,
    )
  ) failV01("actor_lab_report_baseline_budget_mismatch");
  if (value.non_dominance.ordinal_ranking_created !== false || value.non_dominance.global_winner_created !== false) failV01("actor_lab_scalar_or_winner_forbidden");
  if (value.mechanics_proof_only !== true || value.empirical_llm_evolution_benefit_proven !== false) failV01("actor_lab_mechanics_claim_invalid");
  assertProductEffectsZeroV01(value.product_effects);
  assertAuthorityAllFalseV01(value.authority_summary);
  for (const candidate of value.promotion_candidates) {
    if (candidate.whole_actor_profile !== false || candidate.creates_episode_delta_proposal !== false) failV01("actor_lab_promotion_firewall_invalid");
    assertAuthorityAllFalseV01(candidate.authority_summary);
  }
  assertIntegrityV01(value, "$.integrity");
  scanForbiddenMaterialV01(value);
}

function assertMemorySnapshotV01(input: GovernedActorLabPrivateMemorySnapshotV01): void {
  if (input.memory_version !== GOVERNED_ACTOR_LAB_MEMORY_VERSION_V01) failV01("actor_lab_memory_version_invalid");
  if (input.item_count !== input.items.length || input.items.length > 16) failV01("actor_lab_memory_item_count_invalid");
  if (input.cross_actor_read_allowed !== false || input.cross_experiment_read_allowed !== false || input.product_memory_accessed !== false) failV01("actor_lab_memory_isolation_invalid");
  for (const item of input.items) {
    if (item.experiment_id !== input.experiment_id || item.lab_actor_id !== input.lab_actor_id) failV01("actor_lab_memory_item_scope_mismatch");
    if (memoryItemFingerprintV01(item) !== item.memory_item_fingerprint) failV01("actor_lab_memory_item_fingerprint_mismatch");
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
  scanForbiddenMaterialV01({ ...candidate, directive_shaped_material: false, hidden_holdout_material: false });
}

function validateGenerationPopulationV01(
  generation: GovernedActorLabGenerationV01,
  actors: GovernedActorLabActorSnapshotV01[],
  memories: GovernedActorLabPrivateMemorySnapshotV01[],
  manifest: GovernedActorLabExperimentManifestV01,
): void {
  if (actors.length !== 4 || memories.length !== 4) failV01("actor_lab_population_size_invalid");
  if (new Set(actors.map((actor) => actor.lab_actor_id)).size !== 4) failV01("actor_lab_actor_identity_duplicate");
  for (const actor of actors) {
    if (actor.actor_version !== GOVERNED_ACTOR_LAB_ACTOR_VERSION_V01 || actor.generation !== generation || actor.experiment_id !== manifest.experiment_id) failV01("actor_lab_actor_scope_invalid");
    if (actor.tool_manifest_fingerprint !== manifest.tool_manifest.integrity.fingerprint || actor.capability_ceiling_fingerprint !== manifest.tool_manifest.integrity.fingerprint) failV01("actor_lab_capability_scope_expanded");
    assertAuthorityAllFalseV01(actor.authority_summary);
    assertIntegrityV01(actor, "$.actor.integrity");
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

function actorRefV01(actor: GovernedActorLabActorSnapshotV01): GovernedActorLabActorSnapshotReferenceV01 {
  return { actor_snapshot_id: actor.actor_snapshot_id, actor_snapshot_fingerprint: actor.integrity.fingerprint };
}

function memoryRefV01(memory: GovernedActorLabPrivateMemorySnapshotV01): GovernedActorLabMemorySnapshotReferenceV01 {
  return { memory_snapshot_id: memory.memory_snapshot_id, memory_snapshot_fingerprint: memory.integrity.fingerprint };
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
