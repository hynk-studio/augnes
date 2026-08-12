import {
  admitGovernedActorLabMemoryCandidateV01,
  buildGovernedActorLabCuratedKnowledgeInputV01,
  buildGovernedActorLabGenerationZeroV01,
  buildGovernedActorLabPopulationTransitionFromFrozenEvaluationV01,
  canonicalizeGovernedActorLabValueV01,
  rebaseGovernedActorLabFixedPopulationV01,
  retrieveGovernedActorLabPrivateMemoryV01,
} from "@/lib/vnext/governed-actor-lab";
import {
  GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01,
  invokeGovernedActorLabModelGatewayV01,
  type GovernedActorLabModelGatewayDependenciesV01,
  type ModelGatewayInteractiveAdmissionV01,
  validateGovernedActorLabModelInputV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
  MODEL_GATEWAY_VERSION_V01,
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  isModelGatewayInvocationErrorV01,
  type GovernedActorLabModelInvocationEnvelopeV01,
  type ModelGatewayFailureCodeV01,
} from "@/lib/vnext/model-gateway/contracts";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01,
  type GovernedActorLabActorSnapshotV01,
  type GovernedActorLabBaselineArmV01,
  type GovernedActorLabExperimentManifestV01,
  type GovernedActorLabIntegrityV01,
  type GovernedActorLabMemoryAdmissionV01,
  type GovernedActorLabMemoryCandidateV01,
  type GovernedActorLabOutcomeVectorV01,
  type GovernedActorLabPrivateMemorySnapshotV01,
  type GovernedActorLabSyntheticSourceV01,
} from "@/types/vnext/governed-actor-lab";
import {
  GOVERNED_ACTOR_LAB_LIVE_AGGREGATE_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_CALL_PLAN_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_COHORT_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_REPORT_VERSION_V01,
  type GovernedActorLabLiveAggregateAccountingV01,
  type GovernedActorLabLiveArmResultV01,
  type GovernedActorLabLiveAuthorityBoundaryV01,
  type GovernedActorLabLiveCallPlanEntryV01,
  type GovernedActorLabLiveCallPlanV01,
  type GovernedActorLabLiveCaseV01,
  type GovernedActorLabLiveCasebookV01,
  type GovernedActorLabLiveCohortManifestV01,
  type GovernedActorLabLiveCohortResultV01,
  type GovernedActorLabLiveComparisonV01,
  type GovernedActorLabLiveCuratedMaterialV01,
  type GovernedActorLabLiveEvaluationV01,
  type GovernedActorLabLiveInvocationBindingV01,
  type GovernedActorLabLiveInvocationStatusV01,
  type GovernedActorLabLiveModelInputV01,
  type GovernedActorLabLiveModelOutputV01,
  type GovernedActorLabLivePeerArtifactV01,
  type GovernedActorLabLivePrivateMemoryMaterialV01,
  type GovernedActorLabLiveReportV01,
  type GovernedActorLabLiveRouteV01,
} from "@/types/vnext/governed-actor-lab-live";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptV02,
} from "@/types/vnext/model-invocation-receipt";

const SHA256 = /^sha256:[0-9a-f]{64}$/u;
const GIT_SHA = /^[0-9a-f]{40}$/u;
const LIVE_ARMS = [...GOVERNED_ACTOR_LAB_BASELINE_ARMS_V01];
const SLOTS = ["slot-0", "slot-1", "slot-2", "slot-3"] as const;

export class GovernedActorLabLiveErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "GovernedActorLabLiveErrorV01";
  }
}

export interface BuildGovernedActorLabLiveCohortInputV01 {
  source_repository_head_sha: string;
  c1_manifest: GovernedActorLabExperimentManifestV01;
  casebook: GovernedActorLabLiveCasebookV01;
  route: GovernedActorLabLiveRouteV01;
}

export interface RunGovernedActorLabLiveCohortInputV01
  extends BuildGovernedActorLabLiveCohortInputV01 {
  admission: ModelGatewayInteractiveAdmissionV01;
  cost_budget?: ModelGatewayCostBudgetV01;
}

export interface RunGovernedActorLabLiveCohortDependenciesV01 {
  invoke_gateway?: typeof invokeGovernedActorLabModelGatewayV01;
  gateway_dependencies?: GovernedActorLabModelGatewayDependenciesV01;
  cancellation_signal?: AbortSignal;
}

interface ArmRuntimeStateV01 {
  arm: GovernedActorLabBaselineArmV01;
  actors: GovernedActorLabActorSnapshotV01[];
  memories: GovernedActorLabPrivateMemorySnapshotV01[];
  invocationBindingRefs: string[];
  evaluations: GovernedActorLabLiveEvaluationV01[];
  memoryAdmissions: GovernedActorLabMemoryAdmissionV01[];
  populationTransitions: GovernedActorLabLiveArmResultV01["population_transitions"];
  memoryRetrieved: number;
  memoryPresented: number;
  memoryUsed: number;
  quarantined: number;
  streamInterference: number;
  frozenForHoldout: boolean;
}

export function createGovernedActorLabLiveAuthorityBoundaryV01(): GovernedActorLabLiveAuthorityBoundaryV01 {
  return {
    gateway_authorization_project_is_lab_experiment_meaning: false,
    lab_reads_product_database_for_actor_cognition: false,
    gateway_identity_selection_reads_allowed: true,
    product_database_writes: 0,
    core_writes: 0,
    task_context_writes: 0,
    episode_delta_proposal_writes: 0,
    review_decision_writes: 0,
    transition_writes: 0,
    personal_perspective_mutations: 0,
    policy_activations: 0,
    git_or_github_runtime_mutations: 0,
    provider_egress_only_through_model_gateway: true,
    model_output_is_evidence: false,
    model_output_is_accepted_claim: false,
    model_output_is_durable_memory: false,
    model_output_is_accepted_strategy: false,
    model_output_is_policy: false,
    model_output_is_decision: false,
    model_output_is_transition: false,
    provider_model_identity_is_lab_actor_identity: false,
    pairwise_better_is_global_winner: false,
    live_cohort_advantage_is_verified_general_benefit: false,
    pareto_non_dominated_is_product_promotion: false,
    promotion_authority: false,
    execution_authority: false,
    semantic_authority: false,
    merge_authority: false,
  };
}

export function buildGovernedActorLabLiveCallPlanV01(
  casebook: GovernedActorLabLiveCasebookV01,
): GovernedActorLabLiveCallPlanV01 {
  assertCasebookV01(casebook);
  const entries: GovernedActorLabLiveCallPlanEntryV01[] = [];
  let callOrder = 0;
  for (let episode = 0; episode < 3; episode += 1) {
    const development = casebook.development_cases[episode]!;
    for (const arm of LIVE_ARMS) {
      for (const slot of SLOTS) {
        entries.push(
          callPlanEntryV01({
            callOrder: callOrder++,
            arm,
            phase: "blind_solve",
            generation: episode as 0 | 1 | 2,
            episodeOrHoldoutIndex: episode,
            actorSlot: slot,
            liveCase: development,
            peerSlot: null,
          }),
        );
      }
      for (const [index, slot] of SLOTS.entries()) {
        entries.push(
          callPlanEntryV01({
            callOrder: callOrder++,
            arm,
            phase: "challenge_synthesis",
            generation: episode as 0 | 1 | 2,
            episodeOrHoldoutIndex: episode,
            actorSlot: slot,
            liveCase: development,
            peerSlot: SLOTS[(index + 1) % SLOTS.length]!,
          }),
        );
      }
    }
  }
  for (const arm of LIVE_ARMS) {
    for (const [index, slot] of SLOTS.entries()) {
      const holdoutIdentity = casebook.hidden_holdout.cases[index]!.actor_visible;
      entries.push(
        callPlanEntryV01({
          callOrder: callOrder++,
          arm,
          phase: "blind_solve",
          generation: "holdout",
          episodeOrHoldoutIndex: index,
          actorSlot: slot,
          liveCase: {
            actor_visible: {
              ...holdoutIdentity,
              task_text: "identity-only-not-materialized",
              evidence_snippets: [],
              claim_candidates: [],
              allowed_result_tokens: [],
              uncertainty_tokens: [],
              success_criteria: [],
            },
            evaluator_only: casebook.hidden_holdout.cases[index]!.evaluator_only,
          },
          peerSlot: null,
        }),
      );
    }
  }
  if (entries.length !== 140 || callOrder !== 140) {
    failV01("governed_actor_lab_live_call_plan_count_invalid");
  }
  const withoutIntegrity = {
    call_plan_version: GOVERNED_ACTOR_LAB_LIVE_CALL_PLAN_VERSION_V01,
    planned_calls: 140 as const,
    calls_per_arm: 28 as const,
    development_calls_per_arm: 24 as const,
    holdout_calls_per_arm: 4 as const,
    retries: 0 as const,
    max_parallel_provider_calls: 1 as const,
    aggregate_provider_call_ceiling: 140 as const,
    entries,
  };
  return sealV01(withoutIntegrity);
}

export function buildGovernedActorLabLiveCohortManifestV01(
  input: BuildGovernedActorLabLiveCohortInputV01,
): { manifest: GovernedActorLabLiveCohortManifestV01; call_plan: GovernedActorLabLiveCallPlanV01 } {
  if (!GIT_SHA.test(input.source_repository_head_sha)) {
    failV01("governed_actor_lab_live_source_head_invalid");
  }
  assertCasebookV01(input.casebook);
  assertRouteV01(input.route);
  if (
    input.c1_manifest.hidden_holdout.holdout_id === input.casebook.hidden_holdout.holdout_id ||
    input.c1_manifest.experiment_kind !== "isolated_deterministic_offline_actor_lab"
  ) {
    failV01("governed_actor_lab_live_c1_binding_invalid");
  }
  const callPlan = buildGovernedActorLabLiveCallPlanV01(input.casebook);
  const initialPopulationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(input.c1_manifest.population.initial_population),
  );
  const cohortBasis = {
    source_repository_head_sha: input.source_repository_head_sha,
    c1_experiment_id: input.c1_manifest.experiment_id,
    c1_experiment_fingerprint: input.c1_manifest.integrity.fingerprint,
    casebook_fingerprint: input.casebook.integrity.fingerprint,
    route_fingerprint: input.route.integrity_fingerprint,
    call_plan_fingerprint: callPlan.integrity.fingerprint,
  };
  const cohortId = `live-cohort:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(cohortBasis),
  ).slice("sha256:".length, "sha256:".length + 32)}`;
  const withoutIntegrity = {
    cohort_version: GOVERNED_ACTOR_LAB_LIVE_COHORT_VERSION_V01,
    cohort_id: cohortId,
    cohort_count: 1 as const,
    source_repository_head_sha: input.source_repository_head_sha,
    c1_experiment_ref: {
      experiment_id: input.c1_manifest.experiment_id,
      experiment_fingerprint: input.c1_manifest.integrity.fingerprint,
    },
    casebook_ref: {
      casebook_id: input.casebook.casebook_id,
      casebook_fingerprint: input.casebook.integrity.fingerprint,
    },
    development_case_sequence: input.casebook.development_cases.map((entry) => ({
      case_id: entry.actor_visible.case_id,
      case_fingerprint: entry.actor_visible.case_fingerprint,
    })),
    hidden_holdout_ref: {
      holdout_id: input.casebook.hidden_holdout.holdout_id,
      holdout_fingerprint: input.casebook.hidden_holdout.holdout_fingerprint,
    },
    exact_initial_population_fingerprint: initialPopulationFingerprint,
    evaluator_version: input.c1_manifest.evaluator.version,
    memory_policy_version: input.c1_manifest.memory_policy.version,
    mutation_policy_version: input.c1_manifest.mutation_policy.version,
    gateway_version: MODEL_GATEWAY_VERSION_V01,
    gateway_purpose: GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
    gateway_codec_version: GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01,
    route: structuredClone(input.route),
    call_plan_ref: {
      call_plan_fingerprint: callPlan.integrity.fingerprint,
      planned_calls: 140 as const,
    },
    limits: {
      max_input_bytes: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      max_output_tokens: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
      timeout_ms: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.timeoutMs,
      aggregate_provider_calls: 140 as const,
      max_parallel_provider_calls: 1 as const,
      retries: 0 as const,
    },
    data_classification: "public_safe" as const,
    provider_egress: "allow" as const,
    retention_class: "none" as const,
    raw_prompt_persisted: false as const,
    raw_response_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    one_provider_model_adapter_route: true as const,
    stochastic_repeatability: "unmeasured_single_cohort" as const,
    authority_boundary: createGovernedActorLabLiveAuthorityBoundaryV01(),
  };
  return { manifest: sealV01(withoutIntegrity), call_plan: callPlan };
}

export async function runGovernedActorLabLiveCohortV01(
  input: RunGovernedActorLabLiveCohortInputV01,
  dependencies: RunGovernedActorLabLiveCohortDependenciesV01 = {},
): Promise<GovernedActorLabLiveCohortResultV01> {
  const { manifest, call_plan: callPlan } =
    buildGovernedActorLabLiveCohortManifestV01(input);
  assertAdmissionV01(input.admission);
  const invokeGateway = dependencies.invoke_gateway ??
    invokeGovernedActorLabModelGatewayV01;
  const externalSignal = dependencies.cancellation_signal ??
    new AbortController().signal;
  const entriesByKey = new Map(
    callPlan.entries.map((entry) => [callKeyV01(entry), entry]),
  );
  const usedEntries = new Set<string>();
  const bindings: GovernedActorLabLiveInvocationBindingV01[] = [];
  const states = new Map<GovernedActorLabBaselineArmV01, ArmRuntimeStateV01>();
  for (const arm of LIVE_ARMS) {
    const initial = buildGovernedActorLabGenerationZeroV01(input.c1_manifest);
    states.set(arm, {
      arm,
      actors: initial.actors,
      memories: initial.memories,
      invocationBindingRefs: [],
      evaluations: [],
      memoryAdmissions: [],
      populationTransitions: [],
      memoryRetrieved: 0,
      memoryPresented: 0,
      memoryUsed: 0,
      quarantined: 0,
      streamInterference: 0,
      frozenForHoldout: false,
    });
  }
  const curatedInput = buildGovernedActorLabCuratedKnowledgeInputV01(
    input.c1_manifest,
    input.c1_manifest.tool_manifest.allowed_source_refs,
  );
  const liveDevelopmentSources = input.casebook.development_cases.map(
    (liveCase) => liveSyntheticSourceV01(liveCase),
  );
  let routeChanged = false;

  for (let episode = 0; episode < 3; episode += 1) {
    const liveCase = input.casebook.development_cases[episode]!;
    for (const arm of LIVE_ARMS) {
      const state = states.get(arm)!;
      const actorsBySlot = actorsForSlotsV01(state, arm);
      const memoriesBySlot = memoriesForSlotsV01(state, actorsBySlot);
      const privateMemoryBySlot = new Map<string, GovernedActorLabLivePrivateMemoryMaterialV01[]>();
      const curatedMaterial = arm === "disposable_curated_knowledge"
        ? curatedMaterialV01(curatedInput)
        : [];
      for (const slot of SLOTS) {
        const memory = memoriesBySlot.get(slot)!;
        const material = persistentArmV01(arm)
          ? privateMemoryMaterialV01(
              memory,
              input.c1_manifest.experiment_id,
              liveCase.actor_visible.task_family_key,
              liveDevelopmentSources,
            )
          : [];
        privateMemoryBySlot.set(slot, material);
        state.memoryRetrieved += material.length;
        state.memoryPresented += material.length;
      }
      const blindBySlot = new Map<string, GovernedActorLabLiveInvocationBindingV01>();
      for (const slot of SLOTS) {
        const actor = actorsBySlot.get(slot)!;
        const memory = memoriesBySlot.get(slot)!;
        const planned = requiredPlanEntryV01(entriesByKey, {
          arm,
          phase: "blind_solve",
          generation: episode as 0 | 1 | 2,
          index: episode,
          slot,
        });
        const modelInput = modelInputV01({
          manifest,
          arm,
          generation: episode as 0 | 1 | 2,
          index: episode,
          slot,
          actor,
          liveCase,
          privateMemory: privateMemoryBySlot.get(slot)!,
          curatedMaterial,
          ownBlind: null,
          peer: null,
          phase: "blind_solve",
        });
        const binding = routeChanged
          ? localBindingV01(
              manifest,
              planned,
              actor,
              memory,
              curatedMaterial,
              null,
              "route_changed",
            )
          : await executeCallV01({
              manifest,
              planned,
              admission: input.admission,
              actor,
              memory,
              curatedMaterial,
              peerArtifactRef: null,
              modelInput,
              costBudget: input.cost_budget,
              invokeGateway,
              gatewayDependencies: dependencies.gateway_dependencies,
              signal: externalSignal,
            });
        if (binding.invocation_status === "route_changed") routeChanged = true;
        registerBindingV01(state, bindings, usedEntries, planned, binding);
        blindBySlot.set(slot, binding);
      }
      const synthesisBySlot = new Map<string, GovernedActorLabLiveInvocationBindingV01>();
      for (const [slotIndex, slot] of SLOTS.entries()) {
        const peerSlot = SLOTS[(slotIndex + 1) % SLOTS.length]!;
        const actor = actorsBySlot.get(slot)!;
        const memory = memoriesBySlot.get(slot)!;
        const ownBinding = blindBySlot.get(slot)!;
        const peerBinding = blindBySlot.get(peerSlot)!;
        const ownArtifact = peerArtifactV01(slot, ownBinding);
        const peerArtifact = peerArtifactV01(peerSlot, peerBinding);
        const planned = requiredPlanEntryV01(entriesByKey, {
          arm,
          phase: "challenge_synthesis",
          generation: episode as 0 | 1 | 2,
          index: episode,
          slot,
        });
        let binding: GovernedActorLabLiveInvocationBindingV01;
        if (routeChanged) {
          binding = localBindingV01(
            manifest,
            planned,
            actor,
            memory,
            curatedMaterial,
            peerArtifact?.peer_artifact_ref ?? null,
            "route_changed",
          );
        } else if (!ownArtifact || !peerArtifact) {
          binding = localBindingV01(
            manifest,
            planned,
            actor,
            memory,
            curatedMaterial,
            peerArtifact?.peer_artifact_ref ?? null,
            "dependency_missing",
          );
        } else {
          binding = await executeCallV01({
            manifest,
            planned,
            admission: input.admission,
            actor,
            memory,
            curatedMaterial,
            peerArtifactRef: peerArtifact.peer_artifact_ref,
            modelInput: modelInputV01({
              manifest,
              arm,
              generation: episode as 0 | 1 | 2,
              index: episode,
              slot,
              actor,
              liveCase,
              privateMemory: privateMemoryBySlot.get(slot)!,
              curatedMaterial,
              ownBlind: ownArtifact,
              peer: peerArtifact,
              phase: "challenge_synthesis",
            }),
            costBudget: input.cost_budget,
            invokeGateway,
            gatewayDependencies: dependencies.gateway_dependencies,
            signal: externalSignal,
          });
        }
        if (binding.invocation_status === "route_changed") routeChanged = true;
        registerBindingV01(state, bindings, usedEntries, planned, binding);
        synthesisBySlot.set(slot, binding);
      }

      const episodeEvaluations: GovernedActorLabLiveEvaluationV01[] = [];
      for (const slot of SLOTS) {
        const finalBinding = synthesisBySlot.get(slot)!;
        const evaluation = evaluateLiveOutputV01({
          arm,
          generation: episode as 0 | 1 | 2,
          slot,
          liveCase,
          binding: finalBinding,
          challengeRequired: true,
        });
        state.evaluations.push(evaluation);
        episodeEvaluations.push(evaluation);
        const presented = privateMemoryBySlot.get(slot)!;
        if (
          finalBinding.normalized_output &&
          presented.some((memory) =>
            finalBinding.normalized_output!.claim_candidates.some((claim) =>
              memory.bounded_content.includes(claim.claim_token),
            ),
          )
        ) {
          state.memoryUsed += 1;
        }
      }
      if (persistentArmV01(arm)) {
        admitEpisodeMemoryV01({
          c1Manifest: input.c1_manifest,
          state,
          actorsBySlot,
          memoriesBySlot,
          episode,
          liveCase,
          synthesisBySlot,
          evaluations: episodeEvaluations,
          source: liveDevelopmentSources[episode]!,
        });
      }
      if (episode < 2) {
        if (arm === "persistent_evolutionary_population") {
          const evaluationRef = frozenSelectionEvaluationV01(
            arm,
            episode,
            actorsBySlot,
            episodeEvaluations,
          );
          const transition =
            buildGovernedActorLabPopulationTransitionFromFrozenEvaluationV01({
              manifest: input.c1_manifest,
              actors: state.actors,
              memories: state.memories,
              from_generation: episode as 0 | 1,
              to_generation: (episode + 1) as 1 | 2,
              evaluation: evaluationRef,
            });
          state.populationTransitions.push(transition.transition);
          state.actors = transition.actors;
          state.memories = transition.memories;
        } else {
          const rebased = rebaseGovernedActorLabFixedPopulationV01({
            manifest: input.c1_manifest,
            actors: state.actors,
            post_episode_memories: state.memories,
            to_generation: (episode + 1) as 1 | 2,
            persistent: arm === "persistent_population_no_evolution",
          });
          state.actors = rebased.actors;
          state.memories = rebased.memories;
        }
      }
    }
  }

  for (const state of states.values()) state.frozenForHoldout = true;
  if ([...states.values()].some((state) => !state.frozenForHoldout)) {
    failV01("governed_actor_lab_live_holdout_freeze_failed");
  }

  // Holdout actor-visible material is first dereferenced only after every arm
  // has frozen G2 actor, mutation, and private-memory state.
  for (const arm of LIVE_ARMS) {
    const state = states.get(arm)!;
    const actorsBySlot = actorsForSlotsV01(state, arm);
    const memoriesBySlot = memoriesForSlotsV01(state, actorsBySlot);
    const curatedMaterial = arm === "disposable_curated_knowledge"
      ? curatedMaterialV01(curatedInput)
      : [];
    for (const [index, slot] of SLOTS.entries()) {
      const liveCase = input.casebook.hidden_holdout.cases[index]!;
      const actor = actorsBySlot.get(slot)!;
      const memory = memoriesBySlot.get(slot)!;
      const privateMemory = persistentArmV01(arm)
        ? privateMemoryMaterialV01(
            memory,
            input.c1_manifest.experiment_id,
            liveCase.actor_visible.task_family_key,
            liveDevelopmentSources,
          )
        : [];
      state.memoryRetrieved += privateMemory.length;
      state.memoryPresented += privateMemory.length;
      const planned = requiredPlanEntryV01(entriesByKey, {
        arm,
        phase: "blind_solve",
        generation: "holdout",
        index,
        slot,
      });
      const binding = routeChanged
        ? localBindingV01(
            manifest,
            planned,
            actor,
            memory,
            curatedMaterial,
            null,
            "route_changed",
          )
        : await executeCallV01({
            manifest,
            planned,
            admission: input.admission,
            actor,
            memory,
            curatedMaterial,
            peerArtifactRef: null,
            modelInput: modelInputV01({
              manifest,
              arm,
              generation: "holdout",
              index,
              slot,
              actor,
              liveCase,
              privateMemory,
              curatedMaterial,
              ownBlind: null,
              peer: null,
              phase: "blind_solve",
            }),
            costBudget: input.cost_budget,
            invokeGateway,
            gatewayDependencies: dependencies.gateway_dependencies,
            signal: externalSignal,
          });
      if (binding.invocation_status === "route_changed") routeChanged = true;
      registerBindingV01(state, bindings, usedEntries, planned, binding);
      state.evaluations.push(
        evaluateLiveOutputV01({
          arm,
          generation: "holdout",
          slot,
          liveCase,
          binding,
          challengeRequired: false,
        }),
      );
    }
  }

  if (bindings.length !== 140 || usedEntries.size !== 140) {
    failV01("governed_actor_lab_live_execution_plan_incomplete");
  }
  bindings.sort((left, right) => left.call_order - right.call_order);
  const accounting = deriveGovernedActorLabLiveAggregateAccountingV01(
    bindings,
    input.route,
  );
  const armResults = LIVE_ARMS.map((arm) => buildArmResultV01(states.get(arm)!));
  const comparisons = buildComparisonsV01(armResults);
  const nonDominance = deriveNonDominanceV01(armResults);
  const reportWithoutIntegrity = {
    report_version: GOVERNED_ACTOR_LAB_LIVE_REPORT_VERSION_V01,
    report_id: `live-report:${manifest.cohort_id.slice("live-cohort:".length)}`,
    report_kind: "bounded_live_model_governed_actor_lab_single_cohort" as const,
    cohort_ref: {
      cohort_id: manifest.cohort_id,
      cohort_fingerprint: manifest.integrity.fingerprint,
    },
    source_repository_head_sha: manifest.source_repository_head_sha,
    route: structuredClone(manifest.route),
    casebook_ref: {
      casebook_id: input.casebook.casebook_id,
      casebook_fingerprint: input.casebook.integrity.fingerprint,
      hidden_holdout_id: input.casebook.hidden_holdout.holdout_id,
      hidden_holdout_fingerprint: input.casebook.hidden_holdout.holdout_fingerprint,
    },
    accounting,
    arms: armResults,
    comparisons,
    non_dominance: nonDominance,
    hidden_holdout: {
      development_provider_material_contains_holdout: false as const,
      system_material_contains_holdout: false as const,
      challenge_artifacts_contain_holdout: false as const,
      private_memory_contains_holdout: false as const,
      mutation_input_contains_holdout: false as const,
      pre_holdout_reports_contain_holdout: false as const,
      evaluator_answers_sent_to_provider: false as const,
      all_actor_and_mutation_state_frozen_before_materialization: true as const,
      post_holdout_memory_writes: 0 as const,
      post_holdout_mutations: 0 as const,
    },
    stochastic_repeatability: "unmeasured_single_cohort" as const,
    p_value_reported: false as const,
    significance_reported: false as const,
    confidence_interval_reported: false as const,
    verified_general_benefit: false as const,
    global_winner_created: false as const,
    product_promotion_created: false as const,
    promotion_candidates: [] as string[],
    authority_boundary: createGovernedActorLabLiveAuthorityBoundaryV01(),
    limitations: [
      "One live cohort cannot measure stochastic repeatability.",
      "Provider and model identity are provenance, not Lab actor identity.",
      "Live cohort advantage is not verified general benefit.",
      "Pairwise better is not a global winner; non-dominance is not product promotion.",
      "ModelInvocationReceipt is not Evidence and is not task success.",
      "Gateway Authorization Project is not Lab Experiment Project Meaning.",
    ],
  };
  const report = sealV01(reportWithoutIntegrity) as GovernedActorLabLiveReportV01;
  const result = { manifest, call_plan: callPlan, invocation_bindings: bindings, report };
  return validateGovernedActorLabLiveCohortResultV01(result);
}

export function deriveGovernedActorLabLiveAggregateAccountingV01(
  bindings: GovernedActorLabLiveInvocationBindingV01[],
  route: GovernedActorLabLiveRouteV01,
): GovernedActorLabLiveAggregateAccountingV01 {
  const receipts = bindings.flatMap((binding) =>
    binding.model_invocation_receipt ? [validateModelInvocationReceiptV02(binding.model_invocation_receipt)] : [],
  );
  const attempted = receipts.filter((receipt) => receipt.egress_attempted);
  const usageReceipts = attempted.filter((receipt) => receipt.usage !== null);
  const latencies = attempted.map((receipt) => receipt.latency_ms);
  const count = (status: GovernedActorLabLiveInvocationStatusV01) =>
    bindings.filter((binding) => binding.invocation_status === status).length;
  const pricingAuthorityPresent = bindings.some(
    (binding) => binding.budget.cost_budget !== undefined,
  );
  const withoutIntegrity = {
    aggregate_version: GOVERNED_ACTOR_LAB_LIVE_AGGREGATE_VERSION_V01,
    basis: "recomputed_from_model_invocation_receipts_and_local_refusals" as const,
    planned_calls: 140 as const,
    attempted_provider_calls: attempted.length,
    completed_live_calls: count("completed_live"),
    refused: count("refused"),
    provider_rejected: count("provider_rejected"),
    malformed_response: count("malformed_response"),
    timed_out: count("timed_out"),
    cancelled: count("cancelled"),
    transport_failed: count("transport_failed"),
    source_token_invalid: count("source_token_invalid"),
    route_changed: count("route_changed"),
    dependency_missing: count("dependency_missing"),
    input_bytes: attempted.reduce(
      (sum, receipt) => sum + (receipt.budget.input_bytes_used ?? 0),
      0,
    ),
    input_tokens_provider_reported: usageReceipts.length > 0
      ? usageReceipts.reduce((sum, receipt) => sum + receipt.usage!.input_tokens, 0)
      : null,
    output_tokens_provider_reported: usageReceipts.length > 0
      ? usageReceipts.reduce((sum, receipt) => sum + receipt.usage!.output_tokens, 0)
      : null,
    total_tokens_provider_reported: usageReceipts.length > 0
      ? usageReceipts.reduce((sum, receipt) => sum + receipt.usage!.total_tokens, 0)
      : null,
    usage_receipts_reported: usageReceipts.length,
    latency_ms_total: latencies.reduce((sum, latency) => sum + latency, 0),
    latency_ms_min: latencies.length > 0 ? Math.min(...latencies) : null,
    latency_ms_max: latencies.length > 0 ? Math.max(...latencies) : null,
    provider_model_consistent: receipts.every((receipt) =>
      (receipt.attempted_provider_ref === null && receipt.attempted_model_ref === null) ||
      (canonicalizeProtocolValueV01(receipt.attempted_provider_ref) ===
        canonicalizeProtocolValueV01(route.provider_ref) &&
        canonicalizeProtocolValueV01(receipt.attempted_model_ref) ===
          canonicalizeProtocolValueV01(route.model_ref) &&
        receipt.attempted_implementation_id === route.adapter_implementation_id &&
        receipt.attempted_implementation_version ===
          route.adapter_implementation_version &&
        receipt.final_implementation_id === route.adapter_implementation_id &&
        receipt.final_implementation_version ===
          route.adapter_implementation_version),
    ),
    output_token_ceiling: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
    aggregate_provider_call_ceiling: 140 as const,
    pricing_status: pricingAuthorityPresent
      ? "authority_present_provider_cost_unreported" as const
      : "unpriced_unknown" as const,
    exact_cost: null,
    cost_currency: null,
    planned_ceiling_copied_as_observed_usage: false as const,
  };
  if (attempted.length > 140) failV01("governed_actor_lab_live_call_ceiling_exceeded");
  return sealV01(withoutIntegrity);
}

export function validateGovernedActorLabLiveCohortResultV01(
  input: unknown,
): GovernedActorLabLiveCohortResultV01 {
  if (!isRecordV01(input)) failV01("governed_actor_lab_live_result_invalid");
  const result = input as unknown as GovernedActorLabLiveCohortResultV01;
  if (
    result.manifest.cohort_count !== 1 ||
    result.call_plan.planned_calls !== 140 ||
    result.call_plan.entries.length !== 140 ||
    result.invocation_bindings.length !== 140 ||
    result.report.stochastic_repeatability !== "unmeasured_single_cohort" ||
    result.report.product_promotion_created !== false ||
    result.report.global_winner_created !== false ||
    result.report.authority_boundary.semantic_authority !== false ||
    result.report.authority_boundary.execution_authority !== false ||
    result.report.authority_boundary.merge_authority !== false
  ) {
    failV01("governed_actor_lab_live_result_invalid");
  }
  assertSealedV01(result.manifest);
  assertSealedV01(result.call_plan);
  assertSealedV01(result.report);
  if (
    new Set(result.invocation_bindings.map((binding) => binding.call_slot_id)).size !== 140 ||
    result.invocation_bindings.some((binding, index) => binding.call_order !== index)
  ) {
    failV01("governed_actor_lab_live_lineage_invalid");
  }
  for (const binding of result.invocation_bindings) {
    assertSealedV01(binding);
    if (binding.model_invocation_receipt) {
      const receipt = validateModelInvocationReceiptV02(binding.model_invocation_receipt);
      if (
        receipt.invocation_id !== binding.call_slot_id ||
        receipt.purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 ||
        receipt.raw_prompt_persisted !== false ||
        receipt.raw_response_persisted !== false ||
        receipt.hidden_reasoning_persisted !== false ||
        receipt.receipt_is_semantic_authority !== false ||
        canonicalizeProtocolValueV01(binding.usage) !==
          canonicalizeProtocolValueV01(receipt.usage) ||
        binding.latency_ms !== receipt.latency_ms ||
        binding.model_invocation_receipt_fingerprint !== receiptFingerprintV01(receipt)
      ) {
        failV01("governed_actor_lab_live_receipt_lineage_invalid");
      }
    }
    if (
      (binding.invocation_status === "completed_live" &&
        (!binding.model_invocation_receipt || !binding.normalized_output)) ||
      (binding.normalized_output !== null &&
        binding.invocation_status !== "completed_live") ||
      (binding.model_invocation_receipt === null &&
        binding.model_invocation_receipt_fingerprint !== null)
    ) {
      failV01("governed_actor_lab_live_receipt_lineage_invalid");
    }
  }
  if (
    canonicalizeProtocolValueV01(
      deriveGovernedActorLabLiveAggregateAccountingV01(
        result.invocation_bindings,
        result.manifest.route,
      ),
    ) !== canonicalizeProtocolValueV01(result.report.accounting)
  ) {
    failV01("governed_actor_lab_live_accounting_invalid");
  }
  if (
    canonicalizeProtocolValueV01(buildComparisonsV01(result.report.arms)) !==
      canonicalizeProtocolValueV01(result.report.comparisons) ||
    canonicalizeProtocolValueV01(deriveNonDominanceV01(result.report.arms)) !==
      canonicalizeProtocolValueV01(result.report.non_dominance)
  ) {
    failV01("governed_actor_lab_live_comparison_derivation_invalid");
  }
  const serialized = canonicalizeProtocolValueV01(result);
  if (
    /(?:OPENAI_API_KEY|"Authorization"\s*:|Bearer\s+|\/Users\/|\/home\/|[A-Za-z]:\\)/u.test(serialized)
  ) {
    failV01("governed_actor_lab_live_forbidden_material_persisted");
  }
  return structuredClone(result);
}

function callPlanEntryV01(input: {
  callOrder: number;
  arm: GovernedActorLabBaselineArmV01;
  phase: "blind_solve" | "challenge_synthesis";
  generation: 0 | 1 | 2 | "holdout";
  episodeOrHoldoutIndex: number;
  actorSlot: string;
  liveCase: GovernedActorLabLiveCaseV01;
  peerSlot: string | null;
}): GovernedActorLabLiveCallPlanEntryV01 {
  return {
    call_order: input.callOrder,
    call_slot_id: `live-call:${String(input.callOrder).padStart(3, "0")}:${input.arm}:${input.phase}:${input.actorSlot}`,
    arm: input.arm,
    phase: input.phase,
    generation: input.generation,
    episode_or_holdout_index: input.episodeOrHoldoutIndex,
    actor_slot: input.actorSlot,
    case_id: input.liveCase.actor_visible.case_id,
    case_fingerprint: input.liveCase.actor_visible.case_fingerprint,
    peer_slot: input.peerSlot,
    max_input_bytes: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
    max_output_tokens: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
    timeout_ms: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.timeoutMs,
  };
}

function callKeyV01(entry: Pick<GovernedActorLabLiveCallPlanEntryV01, "arm" | "phase" | "generation" | "episode_or_holdout_index" | "actor_slot">): string {
  return [
    entry.arm,
    entry.phase,
    entry.generation,
    entry.episode_or_holdout_index,
    entry.actor_slot,
  ].join("|");
}

function requiredPlanEntryV01(
  entries: Map<string, GovernedActorLabLiveCallPlanEntryV01>,
  input: {
    arm: GovernedActorLabBaselineArmV01;
    phase: "blind_solve" | "challenge_synthesis";
    generation: 0 | 1 | 2 | "holdout";
    index: number;
    slot: string;
  },
): GovernedActorLabLiveCallPlanEntryV01 {
  const entry = entries.get(
    callKeyV01({
      arm: input.arm,
      phase: input.phase,
      generation: input.generation,
      episode_or_holdout_index: input.index,
      actor_slot: input.slot,
    }),
  );
  if (!entry) failV01("governed_actor_lab_live_unplanned_call_refused");
  return entry;
}

function actorsForSlotsV01(
  state: ArmRuntimeStateV01,
  arm: GovernedActorLabBaselineArmV01,
): Map<string, GovernedActorLabActorSnapshotV01> {
  const actors = [...state.actors].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.lab_actor_id, right.lab_actor_id),
  );
  if (actors.length !== 4) failV01("governed_actor_lab_live_population_invalid");
  return new Map(
    SLOTS.map((slot, index) => [
      slot,
      arm === "single_strong_actor" ? actors[0]! : actors[index]!,
    ]),
  );
}

function memoriesForSlotsV01(
  state: ArmRuntimeStateV01,
  actors: Map<string, GovernedActorLabActorSnapshotV01>,
): Map<string, GovernedActorLabPrivateMemorySnapshotV01> {
  const memoryByActor = new Map(state.memories.map((memory) => [memory.lab_actor_id, memory]));
  return new Map(
    [...actors].map(([slot, actor]) => {
      const memory = memoryByActor.get(actor.lab_actor_id);
      if (!memory) failV01("governed_actor_lab_live_memory_missing");
      return [slot, memory];
    }),
  );
}

function privateMemoryMaterialV01(
  memory: GovernedActorLabPrivateMemorySnapshotV01,
  experimentId: string,
  taskFamilyKey: string,
  allowedSources: GovernedActorLabSyntheticSourceV01[],
): GovernedActorLabLivePrivateMemoryMaterialV01[] {
  return retrieveGovernedActorLabPrivateMemoryV01(memory, {
    experiment_id: experimentId,
    lab_actor_id: memory.lab_actor_id,
    task_family_key: taskFamilyKey,
    allowed_source_refs: allowedSources,
  })
    .sort((left, right) => compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id))
    .map((item) => ({
      memory_item_ref: item.memory_item_id,
      bounded_content: item.bounded_content,
      applicability: item.applicability,
      uncertainty: [...item.uncertainty],
      limitations: [...item.limitations],
      support_status: "support_validated" as const,
    }));
}

function curatedMaterialV01(
  curated: ReturnType<typeof buildGovernedActorLabCuratedKnowledgeInputV01>,
): GovernedActorLabLiveCuratedMaterialV01[] {
  return curated.items.map((item, index) => ({
    curated_item_ref: `${curated.curated_input_id}:item-${index}`,
    bounded_content: `Pre-cutoff source-bound operator ${item.procedural_operator_policy} with retrieval ${item.evidence_retrieval_policy}.`,
    source_tokens: [item.source_ref.source_id],
    construction_cutoff_observed: true,
  }));
}

function modelInputV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2 | "holdout";
  index: number;
  slot: string;
  actor: GovernedActorLabActorSnapshotV01;
  liveCase: GovernedActorLabLiveCaseV01;
  privateMemory: GovernedActorLabLivePrivateMemoryMaterialV01[];
  curatedMaterial: GovernedActorLabLiveCuratedMaterialV01[];
  ownBlind: GovernedActorLabLivePeerArtifactV01 | null;
  peer: GovernedActorLabLivePeerArtifactV01 | null;
  phase: "blind_solve" | "challenge_synthesis";
}): GovernedActorLabLiveModelInputV01 {
  return validateGovernedActorLabModelInputV01({
    input_kind: GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
    codec_version: GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01,
    phase: input.phase,
    invocation_context: {
      cohort_ref: input.manifest.cohort_id,
      arm: input.arm,
      generation: input.generation,
      episode_or_holdout_index: input.index,
      actor_slot: input.slot,
      frozen_actor_ref: input.actor.actor_snapshot_id,
    },
    actor_profile: {
      procedural_operator_policy: input.actor.profile.procedural_operator_policy,
      evidence_retrieval_policy: input.actor.profile.evidence_retrieval_policy,
      memory_policy: input.actor.profile.memory_policy,
      orchestration_policy: input.actor.profile.orchestration_policy,
    },
    actor_visible_case: structuredClone(input.liveCase.actor_visible),
    admitted_private_memory: structuredClone(input.privateMemory),
    curated_knowledge: structuredClone(input.curatedMaterial),
    own_blind_artifact: structuredClone(input.ownBlind),
    peer_challenge_artifact: structuredClone(input.peer),
    authority_notice: {
      output_is_candidate_only: true,
      source_tokens_must_be_supplied: true,
      memory_write_authorized: false,
      provider_route_control_authorized: false,
    },
  });
}

async function executeCallV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  planned: GovernedActorLabLiveCallPlanEntryV01;
  admission: ModelGatewayInteractiveAdmissionV01;
  actor: GovernedActorLabActorSnapshotV01;
  memory: GovernedActorLabPrivateMemorySnapshotV01;
  curatedMaterial: GovernedActorLabLiveCuratedMaterialV01[];
  peerArtifactRef: string | null;
  modelInput: GovernedActorLabLiveModelInputV01;
  costBudget?: ModelGatewayCostBudgetV01;
  invokeGateway: typeof invokeGovernedActorLabModelGatewayV01;
  gatewayDependencies?: GovernedActorLabModelGatewayDependenciesV01;
  signal: AbortSignal;
}): Promise<GovernedActorLabLiveInvocationBindingV01> {
  const envelope: GovernedActorLabModelInvocationEnvelopeV01 = {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: input.planned.call_slot_id,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "public_safe",
    provenance_refs: [
      input.manifest.integrity.fingerprint,
      input.planned.case_fingerprint,
      input.manifest.call_plan_ref.call_plan_fingerprint,
    ],
    privacy: { provider_egress: "allow", retention_class: "none" },
    budget: {
      max_input_bytes: input.planned.max_input_bytes,
      max_output_tokens: input.planned.max_output_tokens,
      max_provider_calls: 1,
      ...(input.costBudget ? { cost_budget: input.costBudget } : {}),
    },
    timeout_ms: input.planned.timeout_ms,
    cancellation: { signal: input.signal },
    execution_mode: "live",
    policy: {
      invocation_origin: "interactive",
      expected_active_project_id: input.admission.project_id,
      expected_active_selection_revision:
        input.admission.expected_active_selection_revision,
    },
    project_root: structuredClone(input.admission.project_root),
    input: input.modelInput,
  };
  try {
    const result = await input.invokeGateway(envelope, {
      ...input.gatewayDependencies,
      expected_governed_actor_lab_route: input.manifest.route,
    });
    return bindingV01({
      manifest: input.manifest,
      planned: input.planned,
      actor: input.actor,
      memory: input.memory,
      curatedMaterial: input.curatedMaterial,
      peerArtifactRef: input.peerArtifactRef,
      output: result.output,
      receipt: result.model_invocation_receipt,
      status: "completed_live",
      costBudget: input.costBudget,
    });
  } catch (error) {
    if (!isModelGatewayInvocationErrorV01(error)) {
      return bindingV01({
        manifest: input.manifest,
        planned: input.planned,
        actor: input.actor,
        memory: input.memory,
        curatedMaterial: input.curatedMaterial,
        peerArtifactRef: input.peerArtifactRef,
        output: null,
        receipt: null,
        status: "transport_failed",
        costBudget: input.costBudget,
      });
    }
    const receipt = error.receipt;
    const routeMismatch = receipt !== null &&
      receipt.attempted_provider_ref !== null &&
      (canonicalizeProtocolValueV01(receipt.attempted_provider_ref) !==
        canonicalizeProtocolValueV01(input.manifest.route.provider_ref) ||
        canonicalizeProtocolValueV01(receipt.attempted_model_ref) !==
          canonicalizeProtocolValueV01(input.manifest.route.model_ref) ||
        receipt.attempted_implementation_id !==
          input.manifest.route.adapter_implementation_id ||
        receipt.attempted_implementation_version !==
          input.manifest.route.adapter_implementation_version ||
        receipt.final_implementation_id !==
          input.manifest.route.adapter_implementation_id ||
        receipt.final_implementation_version !==
          input.manifest.route.adapter_implementation_version);
    return bindingV01({
      manifest: input.manifest,
      planned: input.planned,
      actor: input.actor,
      memory: input.memory,
      curatedMaterial: input.curatedMaterial,
      peerArtifactRef: input.peerArtifactRef,
      output: null,
      receipt,
      status: routeMismatch
        ? "route_changed"
        : invocationStatusFromFailureV01(error.code),
      costBudget: input.costBudget,
    });
  }
}

function localBindingV01(
  manifest: GovernedActorLabLiveCohortManifestV01,
  planned: GovernedActorLabLiveCallPlanEntryV01,
  actor: GovernedActorLabActorSnapshotV01,
  memory: GovernedActorLabPrivateMemorySnapshotV01,
  curatedMaterial: GovernedActorLabLiveCuratedMaterialV01[],
  peerArtifactRef: string | null,
  status: "dependency_missing" | "route_changed",
): GovernedActorLabLiveInvocationBindingV01 {
  return bindingV01({
    manifest,
    planned,
    actor,
    memory,
    curatedMaterial,
    peerArtifactRef,
    output: null,
    receipt: null,
    status,
  });
}

function bindingV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  planned: GovernedActorLabLiveCallPlanEntryV01;
  actor: GovernedActorLabActorSnapshotV01;
  memory: GovernedActorLabPrivateMemorySnapshotV01;
  curatedMaterial: GovernedActorLabLiveCuratedMaterialV01[];
  peerArtifactRef: string | null;
  output: GovernedActorLabLiveModelOutputV01 | null;
  receipt: ModelInvocationReceiptV02 | null;
  status: GovernedActorLabLiveInvocationStatusV01;
  costBudget?: ModelGatewayCostBudgetV01;
}): GovernedActorLabLiveInvocationBindingV01 {
  const receipt = input.receipt ? validateModelInvocationReceiptV02(input.receipt) : null;
  const outputFingerprint = input.output
    ? createProtocolSha256V01(canonicalizeProtocolValueV01(input.output))
    : null;
  if (
    receipt?.normalized_output_fingerprint !== undefined &&
    receipt.normalized_output_fingerprint !== outputFingerprint
  ) {
    failV01("governed_actor_lab_live_output_receipt_binding_invalid");
  }
  const withoutIntegrity = {
    binding_version: "governed_actor_lab_live_invocation_binding.v0.1" as const,
    call_slot_id: input.planned.call_slot_id,
    call_order: input.planned.call_order,
    cohort_id: input.manifest.cohort_id,
    arm: input.planned.arm,
    generation: input.planned.generation,
    actor_slot: input.planned.actor_slot,
    lab_actor_id: input.actor.lab_actor_id,
    phase: input.planned.phase,
    case_id: input.planned.case_id,
    case_fingerprint: input.planned.case_fingerprint,
    frozen_actor_ref: input.actor.actor_snapshot_id,
    frozen_private_memory_ref: persistentArmV01(input.planned.arm)
      ? input.memory.memory_snapshot_id
      : null,
    curated_material_refs: input.curatedMaterial.map((item) => item.curated_item_ref),
    peer_artifact_ref: input.peerArtifactRef,
    normalized_output: input.output ? structuredClone(input.output) : null,
    normalized_output_fingerprint: outputFingerprint,
    model_invocation_receipt: receipt,
    model_invocation_receipt_fingerprint: receipt ? receiptFingerprintV01(receipt) : null,
    provider_ref: structuredClone(input.manifest.route.provider_ref),
    model_ref: structuredClone(input.manifest.route.model_ref),
    invocation_status: input.status,
    usage: receipt?.usage ?? null,
    latency_ms: receipt?.latency_ms ?? null,
    budget: {
      max_input_bytes: input.planned.max_input_bytes,
      max_output_tokens: input.planned.max_output_tokens,
      max_provider_calls: 1 as const,
      timeout_ms: input.planned.timeout_ms,
      ...(input.costBudget ? { cost_budget: input.costBudget } : {}),
    },
    semantic_authority: false as const,
    product_authority: false as const,
    execution_authority: false as const,
  };
  return sealV01(withoutIntegrity);
}

function peerArtifactV01(
  slot: string,
  binding: GovernedActorLabLiveInvocationBindingV01,
): GovernedActorLabLivePeerArtifactV01 | null {
  if (
    binding.invocation_status !== "completed_live" ||
    !binding.normalized_output ||
    !binding.normalized_output_fingerprint
  ) return null;
  return {
    peer_artifact_ref: `peer:${binding.call_slot_id}`,
    peer_slot: slot,
    result_token: binding.normalized_output.result_token,
    claim_candidates: structuredClone(binding.normalized_output.claim_candidates),
    uncertainties: [...binding.normalized_output.uncertainties],
    abstention: binding.normalized_output.abstention,
    normalized_output_fingerprint: binding.normalized_output_fingerprint,
  };
}

function evaluateLiveOutputV01(input: {
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2 | "holdout";
  slot: string;
  liveCase: GovernedActorLabLiveCaseV01;
  binding: GovernedActorLabLiveInvocationBindingV01;
  challengeRequired: boolean;
}): GovernedActorLabLiveEvaluationV01 {
  const output = input.binding.normalized_output;
  const evaluator = input.liveCase.evaluator_only;
  const evaluationBasis = {
    arm: input.arm,
    generation: input.generation,
    slot: input.slot,
    case_id: input.liveCase.actor_visible.case_id,
    binding_fingerprint: input.binding.integrity.fingerprint,
  };
  const evaluationId = `live-evaluation:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(evaluationBasis),
  ).slice("sha256:".length, "sha256:".length + 32)}`;
  if (!output) {
    return {
      evaluation_id: evaluationId,
      evaluation_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({ ...evaluationBasis, status: "unknown" }),
      ),
      arm: input.arm,
      generation: input.generation,
      actor_slot: input.slot,
      case_id: input.liveCase.actor_visible.case_id,
      status: "unknown",
      hard_gate_failure: null,
      hard_gate_failure_codes: [],
      required_checks_passed: null,
      required_checks_total: evaluator.required_checks.length,
      source_reference_coverage: null,
      support_validation_coverage: null,
      supported_claims: null,
      unsupported_claims: null,
      abstention_observed: null,
      harmful_transfer_candidate: null,
      missingness: [input.binding.invocation_status],
      evaluator_model_calls: 0,
    };
  }
  const outputClaims = new Map(
    output.claim_candidates.map((claim) => [claim.claim_token, claim.source_tokens]),
  );
  const relationPasses = evaluator.required_support_relations.map((relation) => {
    const supplied = outputClaims.get(relation.claim_token) ?? [];
    return relation.required_source_tokens.every((source) => supplied.includes(source));
  });
  const forbidden = evaluator.forbidden_claim_tokens.filter((claim) => outputClaims.has(claim));
  const gates: string[] = [];
  const resultToken = input.challengeRequired ? output.synthesis_token : output.result_token;
  if (resultToken !== evaluator.expected_result_token) gates.push("expected_result_mismatch");
  if (relationPasses.some((passed) => !passed)) gates.push("required_support_missing");
  if (forbidden.length > 0) gates.push("forbidden_unsupported_claim");
  if (output.abstention !== evaluator.abstention_required) gates.push("abstention_mismatch");
  if (
    input.challengeRequired &&
    input.binding.peer_artifact_ref !== null &&
    output.challenge_response.peer_claim_tokens_considered.length === 0
  ) gates.push("peer_challenge_not_considered");
  const supportedClaims = relationPasses.filter(Boolean).length;
  const claimsWithSources = output.claim_candidates.filter((claim) => claim.source_tokens.length > 0).length;
  const requiredChecksPassed = Math.max(
    0,
    evaluator.required_checks.length - Math.min(evaluator.required_checks.length, gates.length),
  );
  const evaluationWithoutFingerprint = {
    evaluation_id: evaluationId,
    arm: input.arm,
    generation: input.generation,
    actor_slot: input.slot,
    case_id: input.liveCase.actor_visible.case_id,
    status: gates.length === 0 ? "pass" as const : "fail" as const,
    hard_gate_failure: gates.length > 0,
    hard_gate_failure_codes: gates.sort(compareProtocolCodeUnitsV01),
    required_checks_passed: requiredChecksPassed,
    required_checks_total: evaluator.required_checks.length,
    source_reference_coverage: output.claim_candidates.length === 0
      ? 1
      : claimsWithSources / output.claim_candidates.length,
    support_validation_coverage: relationPasses.length === 0
      ? 1
      : supportedClaims / relationPasses.length,
    supported_claims: supportedClaims,
    unsupported_claims: forbidden.length,
    abstention_observed: output.abstention,
    harmful_transfer_candidate:
      evaluator.harmful_transfer_trap && forbidden.length > 0,
    missingness: [] as string[],
    evaluator_model_calls: 0 as const,
  };
  return {
    ...evaluationWithoutFingerprint,
    evaluation_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(evaluationWithoutFingerprint),
    ),
  };
}

function admitEpisodeMemoryV01(input: {
  c1Manifest: GovernedActorLabExperimentManifestV01;
  state: ArmRuntimeStateV01;
  actorsBySlot: Map<string, GovernedActorLabActorSnapshotV01>;
  memoriesBySlot: Map<string, GovernedActorLabPrivateMemorySnapshotV01>;
  episode: number;
  liveCase: GovernedActorLabLiveCaseV01;
  synthesisBySlot: Map<string, GovernedActorLabLiveInvocationBindingV01>;
  evaluations: GovernedActorLabLiveEvaluationV01[];
  source: GovernedActorLabSyntheticSourceV01;
}): void {
  const nextByActor = new Map(input.state.memories.map((memory) => [memory.lab_actor_id, memory]));
  for (const slot of SLOTS) {
    const evaluation = input.evaluations.find((candidate) => candidate.actor_slot === slot)!;
    const binding = input.synthesisBySlot.get(slot)!;
    const actor = input.actorsBySlot.get(slot)!;
    const memory = nextByActor.get(actor.lab_actor_id) ?? input.memoriesBySlot.get(slot)!;
    if (evaluation.status !== "pass" || !binding.normalized_output) continue;
    const supportedRelation = input.liveCase.evaluator_only.required_support_relations.find((relation) =>
      binding.normalized_output!.claim_candidates.some(
        (claim) =>
          claim.claim_token === relation.claim_token &&
          relation.required_source_tokens.every((source) => claim.source_tokens.includes(source)),
      ),
    );
    if (!supportedRelation) continue;
    const source = input.source;
    const episodeId = `live-episode:${input.state.arm}:g${input.episode}`;
    const basis = {
      experiment_id: input.c1Manifest.experiment_id,
      actor_id: actor.lab_actor_id,
      episode_id: episodeId,
      claim_token: supportedRelation.claim_token,
      evaluation_fingerprint: evaluation.evaluation_fingerprint,
    };
    const candidate: GovernedActorLabMemoryCandidateV01 = {
      candidate_id: `live-memory-candidate:${createProtocolSha256V01(
        canonicalizeProtocolValueV01(basis),
      ).slice("sha256:".length, "sha256:".length + 32)}`,
      experiment_id: input.c1Manifest.experiment_id,
      lab_actor_id: actor.lab_actor_id,
      episode_id: episodeId,
      requested_operation: "add",
      target_memory_item_id: null,
      item_kind: "procedural_operator_memory",
      bounded_content: `Supported bounded claim ${supportedRelation.claim_token} for this synthetic task family.`,
      task_family_key: source.task_family_key,
      applicability: `Exact synthetic family ${source.task_family_key} only.`,
      uncertainty: ["Single-cohort association does not establish general benefit."],
      limitations: ["Lab actor-private memory only; not product or Personal Perspective memory."],
      source_refs: [structuredClone(source)],
      evidence_class: "direct_local_observation",
      evidence_basis: "source_verification",
      intervention_evaluation_ref: null,
      support_status: "support_validated",
      directive_shaped_material: false,
      hidden_holdout_material: false,
    };
    const admitted = admitGovernedActorLabMemoryCandidateV01(memory, candidate, {
      evaluation_frozen: true,
    });
    nextByActor.set(actor.lab_actor_id, admitted.snapshot);
    input.state.memoryAdmissions.push(admitted.admission);
    input.state.quarantined += admitted.admission.quarantine_reasons.length > 0 ? 1 : 0;
    input.state.streamInterference += admitted.admission.quarantine_reasons.includes("stream_interference") ? 1 : 0;
  }
  input.state.memories = input.state.memories.map(
    (memory) => nextByActor.get(memory.lab_actor_id) ?? memory,
  );
}

function liveSyntheticSourceV01(
  liveCase: GovernedActorLabLiveCaseV01,
): GovernedActorLabSyntheticSourceV01 {
  const observed = liveCase.actor_visible.evidence_snippets
    .map((snippet) => snippet.observed_at)
    .sort(compareProtocolCodeUnitsV01)
    .at(-1);
  if (!observed) failV01("governed_actor_lab_live_memory_source_missing");
  return {
    source_id: liveCase.actor_visible.case_id,
    source_fingerprint: liveCase.actor_visible.case_fingerprint,
    task_family_key: liveCase.actor_visible.task_family_key,
    available_at: observed,
    trust_class: "direct_local_observation",
  };
}

function frozenSelectionEvaluationV01(
  arm: GovernedActorLabBaselineArmV01,
  generation: number,
  actorsBySlot: Map<string, GovernedActorLabActorSnapshotV01>,
  evaluations: GovernedActorLabLiveEvaluationV01[],
) {
  const actorOutcomes = SLOTS.map((slot) => {
    const evaluation = evaluations.find((entry) => entry.actor_slot === slot)!;
    const actor = actorsBySlot.get(slot)!;
    return {
      lab_actor_id: actor.lab_actor_id,
      outcome: c1SelectionOutcomeV01(evaluation),
      complete: evaluation.status !== "unknown",
    };
  });
  const evaluationId = `live-selection:${arm}:g${generation}`;
  return {
    evaluation_id: evaluationId,
    evaluation_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({ evaluation_id: evaluationId, actor_outcomes: actorOutcomes }),
    ),
    actor_outcomes: actorOutcomes,
  };
}

function c1SelectionOutcomeV01(
  evaluation: GovernedActorLabLiveEvaluationV01,
): GovernedActorLabOutcomeVectorV01 {
  return {
    verification: {
      hard_gate_failure: evaluation.hard_gate_failure,
      hard_gate_failure_codes: [...evaluation.hard_gate_failure_codes],
      required_checks_passed: evaluation.required_checks_passed,
      support_validated_claims: evaluation.supported_claims,
      unsupported_claims: evaluation.unsupported_claims,
    },
    holdout: { cases_passed: 0, cases_failed: 0, unknown: evaluation.status === "unknown" ? 1 : 0 },
    memory: {
      eligible: 0,
      retrieved: 0,
      presented: 0,
      cited_or_referenced: 0,
      support_validated: 0,
      outcome_associated: 0,
      matched_intervention_contribution: 0,
      quarantined: 0,
    },
    contribution: { unique_useful_contribution: null, basis: "unavailable" },
    harm: {
      harmful_transfer_candidates: evaluation.harmful_transfer_candidate === null
        ? null
        : evaluation.harmful_transfer_candidate ? 1 : 0,
      poisoning_refusals: 0,
      stream_interference_candidates: 0,
    },
    burden: { challenge_count: 1, synthesis_count: 1, review_operations: 1 },
    compute: {
      provider_calls: 0,
      network_calls: 0,
      tool_reads: 0,
      deterministic_steps: 1,
      tokens: 0,
      cost_microunits: 0,
      external_effects: 0,
    },
    missing_dimensions: evaluation.status === "unknown" ? [...evaluation.missingness] : [],
  };
}

function registerBindingV01(
  state: ArmRuntimeStateV01,
  all: GovernedActorLabLiveInvocationBindingV01[],
  used: Set<string>,
  planned: GovernedActorLabLiveCallPlanEntryV01,
  binding: GovernedActorLabLiveInvocationBindingV01,
): void {
  if (used.has(planned.call_slot_id) || binding.call_slot_id !== planned.call_slot_id) {
    failV01("governed_actor_lab_live_call_replay_refused");
  }
  used.add(planned.call_slot_id);
  all.push(binding);
  state.invocationBindingRefs.push(binding.integrity.fingerprint);
}

function buildArmResultV01(state: ArmRuntimeStateV01): GovernedActorLabLiveArmResultV01 {
  const holdout = state.evaluations.filter((evaluation) => evaluation.generation === "holdout");
  const known = state.evaluations.filter((evaluation) => evaluation.status !== "unknown");
  const sumNullable = (values: Array<number | null>) =>
    values.some((value) => value === null)
      ? null
      : values.reduce<number>((sum, value) => sum + Number(value), 0);
  const averageNullable = (values: Array<number | null>) => {
    const sum = sumNullable(values);
    return sum === null || values.length === 0 ? null : sum / values.length;
  };
  const missingness = uniqueStringsV01(
    state.evaluations.flatMap((evaluation) => evaluation.missingness),
  );
  const hardFailures = state.evaluations.filter((evaluation) => evaluation.hard_gate_failure === true);
  const comparable =
    missingness.length === 0 &&
    holdout.length === 4 &&
    hardFailures.length === 0;
  const finalProfiles = new Set(
    state.actors.map((actor) => canonicalizeProtocolValueV01(actor.profile)),
  );
  const development = state.evaluations.filter((evaluation) => evaluation.generation !== "holdout");
  const devPassRate = development.length > 0
    ? development.filter((evaluation) => evaluation.status === "pass").length / development.length
    : null;
  const holdoutPassRate = holdout.length > 0
    ? holdout.filter((evaluation) => evaluation.status === "pass").length / holdout.length
    : null;
  return {
    arm: state.arm,
    persistent_memory: persistentArmV01(state.arm),
    mutation_enabled: state.arm === "persistent_evolutionary_population",
    curated_knowledge: state.arm === "disposable_curated_knowledge",
    invocation_binding_refs: [...state.invocationBindingRefs],
    evaluations: structuredClone(state.evaluations),
    memory_admissions: structuredClone(state.memoryAdmissions),
    population_transitions: structuredClone(state.populationTransitions),
    holdout: {
      passed: holdout.filter((evaluation) => evaluation.status === "pass").length,
      failed: holdout.filter((evaluation) => evaluation.status === "fail").length,
      unknown: holdout.filter((evaluation) => evaluation.status === "unknown").length,
      state_frozen_before_materialization: true,
      memory_writes_after_holdout: 0,
      mutations_after_holdout: 0,
    },
    metrics: {
      required_checks_passed: sumNullable(known.map((evaluation) => evaluation.required_checks_passed)),
      source_reference_coverage: averageNullable(known.map((evaluation) => evaluation.source_reference_coverage)),
      support_validation_coverage: averageNullable(known.map((evaluation) => evaluation.support_validation_coverage)),
      unsupported_claims: sumNullable(known.map((evaluation) => evaluation.unsupported_claims)),
      abstentions: known.length > 0
        ? known.filter((evaluation) => evaluation.abstention_observed === true).length
        : null,
      actor_memory_retrieved: state.memoryRetrieved,
      actor_memory_presented: state.memoryPresented,
      actor_memory_used: state.memoryUsed,
      contamination_quarantined: state.quarantined,
      poisoning_refusals: state.memoryAdmissions.filter(
        (admission) =>
          admission.permission === "refused" ||
          admission.permission === "quarantined",
      ).length,
      harmful_transfer_candidates: sumNullable(known.map((evaluation) =>
        evaluation.harmful_transfer_candidate === null
          ? null
          : evaluation.harmful_transfer_candidate ? 1 : 0)),
      stream_interference_candidates: state.streamInterference,
      diversity_collapse_candidate:
        state.arm === "persistent_evolutionary_population"
          ? finalProfiles.size < 2
          : null,
      evaluator_overfit_candidate:
        devPassRate === null || holdoutPassRate === null
          ? null
          : devPassRate >= 0.75 && holdoutPassRate < 0.5,
      challenge_count: state.evaluations.filter(
        (evaluation) => evaluation.generation !== "holdout" && evaluation.status !== "unknown",
      ).length,
      synthesis_count: state.evaluations.filter(
        (evaluation) => evaluation.generation !== "holdout" && evaluation.status !== "unknown",
      ).length,
      missingness,
    },
    comparable,
    non_comparable_reasons: comparable ? [] : uniqueStringsV01([
      ...missingness,
      ...(holdout.length !== 4 ? ["holdout_count_incomplete"] : []),
      ...(hardFailures.length > 0 ? ["hard_gate_failure"] : []),
    ]),
  };
}

function buildComparisonsV01(
  arms: GovernedActorLabLiveArmResultV01[],
): GovernedActorLabLiveReportV01["comparisons"] {
  const byArm = new Map(arms.map((arm) => [arm.arm, arm]));
  return [
    compareArmsV01(
      "persistence-only vs nonpersistent",
      byArm.get("persistent_population_no_evolution")!,
      byArm.get("nonpersistent_compute_matched_ensemble")!,
    ),
    compareArmsV01(
      "persistence-only vs curated",
      byArm.get("persistent_population_no_evolution")!,
      byArm.get("disposable_curated_knowledge")!,
    ),
    compareArmsV01(
      "evolutionary vs persistence-only",
      byArm.get("persistent_evolutionary_population")!,
      byArm.get("persistent_population_no_evolution")!,
    ),
  ];
}

function compareArmsV01(
  comparison: string,
  left: GovernedActorLabLiveArmResultV01,
  right: GovernedActorLabLiveArmResultV01,
): GovernedActorLabLiveComparisonV01 {
  if (!left.comparable || !right.comparable) {
    return {
      comparison,
      left_arm: left.arm,
      right_arm: right.arm,
      status: "undetermined",
      basis: uniqueStringsV01([
        ...left.non_comparable_reasons,
        ...right.non_comparable_reasons,
      ]),
      global_winner_created: false,
    };
  }
  const dimensions = comparisonDimensionsV01;
  const leftValues = dimensions(left);
  const rightValues = dimensions(right);
  const leftNoWorse = leftValues.every((value, index) => value >= rightValues[index]!);
  const rightNoWorse = rightValues.every((value, index) => value >= leftValues[index]!);
  const leftBetter = leftValues.some((value, index) => value > rightValues[index]!);
  const rightBetter = rightValues.some((value, index) => value > leftValues[index]!);
  const status = leftNoWorse && leftBetter
    ? "left_better"
    : rightNoWorse && rightBetter
      ? "right_better"
      : leftBetter && rightBetter
        ? "tradeoff"
        : "equal";
  return {
    comparison,
    left_arm: left.arm,
    right_arm: right.arm,
    status,
    basis: [
      "holdout_passes",
      "required_checks",
      "support_validation",
      "unsupported_claims_noncompensating",
      "harmful_transfer_noncompensating",
    ],
    global_winner_created: false,
  };
}

function deriveNonDominanceV01(arms: GovernedActorLabLiveArmResultV01[]) {
  if (arms.some((arm) => !arm.comparable)) {
    return {
      status: "undetermined" as const,
      non_dominated_arms: [] as GovernedActorLabBaselineArmV01[],
      tradeoffs: ["Provider missingness or hard-gate failure prevents complete five-arm comparison."],
      pairwise_better_is_global_winner: false as const,
    };
  }
  const dominated = new Set<GovernedActorLabBaselineArmV01>();
  const tradeoffs: string[] = [];
  for (const left of arms) {
    for (const right of arms) {
      if (left.arm === right.arm) continue;
      const relation = compareArmsV01("five-arm", left, right).status;
      if (relation === "right_better") dominated.add(left.arm);
      if (relation === "tradeoff" && left.arm < right.arm) {
        tradeoffs.push(`${left.arm} vs ${right.arm}`);
      }
    }
  }
  return {
    status: "determined" as const,
    non_dominated_arms: arms
      .map((arm) => arm.arm)
      .filter((arm) => !dominated.has(arm))
      .sort(compareProtocolCodeUnitsV01),
    tradeoffs: uniqueStringsV01(tradeoffs),
    pairwise_better_is_global_winner: false as const,
  };
}

function comparisonDimensionsV01(arm: GovernedActorLabLiveArmResultV01): number[] {
  return [
    arm.holdout.passed,
    arm.metrics.required_checks_passed ?? Number.NEGATIVE_INFINITY,
    arm.metrics.support_validation_coverage ?? Number.NEGATIVE_INFINITY,
    -(arm.metrics.unsupported_claims ?? Number.POSITIVE_INFINITY),
    -(arm.metrics.harmful_transfer_candidates ?? Number.POSITIVE_INFINITY),
  ];
}

function invocationStatusFromFailureV01(
  code: ModelGatewayFailureCodeV01,
): GovernedActorLabLiveInvocationStatusV01 {
  if (code === "model_gateway_provider_rejected") return "provider_rejected";
  if (code === "model_gateway_provider_response_invalid") return "malformed_response";
  if (code === "model_gateway_timeout") return "timed_out";
  if (code === "model_gateway_cancelled") return "cancelled";
  if (code === "model_gateway_transport_failed" || code === "model_gateway_deterministic_failed") {
    return "transport_failed";
  }
  return "refused";
}

function receiptFingerprintV01(receipt: ModelInvocationReceiptV02): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(receipt));
}

function persistentArmV01(arm: GovernedActorLabBaselineArmV01): boolean {
  return arm === "persistent_population_no_evolution" ||
    arm === "persistent_evolutionary_population";
}

function assertAdmissionV01(admission: ModelGatewayInteractiveAdmissionV01): void {
  if (
    admission.gateway_authorization_project_is_lab_experiment_meaning !== false ||
    admission.expected_active_selection_revision < 1 ||
    !admission.workspace_id.startsWith("workspace:") ||
    !admission.project_id.startsWith("project:") ||
    admission.project_root.normalized_path.length === 0
  ) failV01("governed_actor_lab_live_gateway_admission_invalid");
}

function assertRouteV01(route: GovernedActorLabLiveRouteV01): void {
  const { integrity_fingerprint: fingerprint, ...withoutFingerprint } = route;
  if (
    route.gateway_version !== MODEL_GATEWAY_VERSION_V01 ||
    route.purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 ||
    route.prepared_without_provider_egress !== true ||
    fingerprint !== createProtocolSha256V01(canonicalizeProtocolValueV01(withoutFingerprint))
  ) failV01("governed_actor_lab_live_route_invalid");
}

function assertCasebookV01(casebook: GovernedActorLabLiveCasebookV01): void {
  assertSealedV01(casebook);
  if (
    casebook.source_material !== "synthetic_public_safe" ||
    casebook.development_cases.length !== 3 ||
    casebook.hidden_holdout.cases.length !== 4 ||
    casebook.hidden_holdout.evaluator_answers_provider_visible !== false ||
    casebook.real_user_or_project_data_included !== false ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(
      casebook.hidden_holdout.cases.map((entry) => ({
        case_id: entry.actor_visible.case_id,
        actor_visible_fingerprint: entry.actor_visible.case_fingerprint,
        evaluator_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(entry.evaluator_only),
        ),
      })),
    )) !== casebook.hidden_holdout.holdout_fingerprint
  ) failV01("governed_actor_lab_live_casebook_invalid");
  for (const liveCase of [
    ...casebook.development_cases,
    ...casebook.hidden_holdout.cases,
  ]) {
    const { case_fingerprint: fingerprint, ...withoutFingerprint } = liveCase.actor_visible;
    if (
      fingerprint !== createProtocolSha256V01(canonicalizeProtocolValueV01(withoutFingerprint)) ||
      liveCase.evaluator_only.evaluator_answer_material_never_provider_visible !== true
    ) failV01("governed_actor_lab_live_case_invalid");
  }
}

function assertSealedV01(value: { integrity: GovernedActorLabIntegrityV01 }): void {
  const { integrity, ...withoutIntegrity } = value;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    integrity.fingerprint_scope !== "object_without_integrity_fingerprint" ||
    !SHA256.test(integrity.fingerprint) ||
    integrity.fingerprint !== createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutIntegrity),
    )
  ) failV01("governed_actor_lab_live_integrity_invalid");
}

function sealV01<T extends object>(value: T): T & { integrity: GovernedActorLabIntegrityV01 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: "object_without_integrity_fingerprint",
      fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)),
    },
  };
}

function uniqueStringsV01(values: string[]): string[] {
  return [...new Set(values)].sort(compareProtocolCodeUnitsV01);
}

function isRecordV01(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function failV01(code: string): never {
  throw new GovernedActorLabLiveErrorV01(code);
}
