import {
  admitGovernedActorLabMemoryCandidateV01,
  buildGovernedActorLabCuratedKnowledgeInputV01,
  buildGovernedActorLabGenerationZeroV01,
  buildGovernedActorLabPopulationTransitionFromFrozenEvaluationV01,
  GovernedActorLabErrorV01,
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
  GOVERNED_ACTOR_LAB_LIVE_ATTEMPT_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_CALL_PLAN_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_CHECKPOINT_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_CODEC_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_COHORT_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_EVALUATION_CHECK_CODES_V01,
  GOVERNED_ACTOR_LAB_LIVE_INCOMPLETE_REPORT_VERSION_V01,
  GOVERNED_ACTOR_LAB_LIVE_REPORT_VERSION_V01,
  type GovernedActorLabLiveAggregateAccountingV01,
  type GovernedActorLabLiveArmTerminalV01,
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
  type GovernedActorLabLiveExecutionResultV01,
  type GovernedActorLabLiveCheckpointV01,
  type GovernedActorLabLiveIncompleteResultV01,
  type GovernedActorLabLiveInvocationBindingV01,
  type GovernedActorLabLiveInvocationStatusV01,
  type GovernedActorLabLiveModelInputV01,
  type GovernedActorLabLiveModelOutputV01,
  type GovernedActorLabLivePeerArtifactV01,
  type GovernedActorLabLivePrivateMemoryMaterialV01,
  type GovernedActorLabLiveReportV01,
  type GovernedActorLabLiveRouteV01,
  type GovernedActorLabLiveTerminalAttemptV01,
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
  /** Production passes an already-created append-only attempt journal. */
  on_attempt_prepared?: (input: {
    manifest: GovernedActorLabLiveCohortManifestV01;
    call_plan: GovernedActorLabLiveCallPlanV01;
  }) => void | Promise<void>;
  /** Awaited after sealing a slot and before any later provider slot starts. */
  on_binding_finalized?: (
    binding: GovernedActorLabLiveInvocationBindingV01,
  ) => void | Promise<void>;
  /** Awaited after each actual arm/episode evaluation freeze. */
  on_checkpoint_finalized?: (
    checkpoint: GovernedActorLabLiveCheckpointV01,
  ) => void | Promise<void>;
  /** Test-only boundary hook; production leaves it undefined. */
  before_gateway_entry?: (
    entry: GovernedActorLabLiveCallPlanEntryV01,
  ) => void | Promise<void>;
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
  memoryEligible: number;
  memoryExplicitlyReferenced: number;
  curatedPresented: number;
  curatedExplicitlyReferenced: number;
  quarantined: number;
  streamInterference: number;
  frozenForHoldout: boolean;
  holdoutMaterialized: boolean;
  terminal: GovernedActorLabLiveArmTerminalV01 | null;
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
          phase: "holdout_blind",
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
): Promise<GovernedActorLabLiveExecutionResultV01> {
  const { manifest, call_plan: callPlan } =
    buildGovernedActorLabLiveCohortManifestV01(input);
  assertAdmissionV01(input.admission);
  await dependencies.on_attempt_prepared?.({ manifest, call_plan: callPlan });
  const invokeGateway = dependencies.invoke_gateway ??
    invokeGovernedActorLabModelGatewayV01;
  const externalSignal = dependencies.cancellation_signal ??
    new AbortController().signal;
  const entriesByKey = new Map(
    callPlan.entries.map((entry) => [callKeyV01(entry), entry]),
  );
  const usedEntries = new Set<string>();
  const bindings: GovernedActorLabLiveInvocationBindingV01[] = [];
  const checkpoints: GovernedActorLabLiveCheckpointV01[] = [];
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
      memoryEligible: 0,
      memoryExplicitlyReferenced: 0,
      curatedPresented: 0,
      curatedExplicitlyReferenced: 0,
      quarantined: 0,
      streamInterference: 0,
      frozenForHoldout: false,
      holdoutMaterialized: false,
      terminal: null,
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
  let executionStopReason: string | null = null;
  let executionStopStatus: GovernedActorLabLiveTerminalAttemptV01["status"] | null = null;

  try {
  for (let episode = 0; episode < 3; episode += 1) {
    const liveCase = input.casebook.development_cases[episode]!;
    for (const arm of LIVE_ARMS) {
      if (executionStopReason) break;
      const state = states.get(arm)!;
      if (state.terminal) {
        for (const phase of ["blind_solve", "challenge_synthesis"] as const) {
          for (const slot of SLOTS) {
            const planned = requiredPlanEntryV01(entriesByKey, {
              arm,
              phase,
              generation: episode as 0 | 1 | 2,
              index: episode,
              slot,
            });
            const binding = armTerminalBindingV01(manifest, planned, state.terminal);
            await registerBindingV01(
              state,
              bindings,
              usedEntries,
              planned,
              binding,
              dependencies.on_binding_finalized,
            );
          }
        }
        continue;
      }
      const actorsBySlot = actorsForSlotsV01(state, arm);
      const memoriesBySlot = memoriesForSlotsV01(state, actorsBySlot);
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
        const privateMemory = persistentArmV01(arm)
          ? privateMemoryMaterialV01(
              memory,
              input.c1_manifest.experiment_id,
              liveCase.actor_visible.task_family_key,
              liveDevelopmentSources,
              planned.call_slot_id,
            )
          : [];
        const curatedMaterial = arm === "disposable_curated_knowledge"
          ? curatedMaterialV01(curatedInput, planned.call_slot_id)
          : [];
        registerPresentedMaterialV01(state, privateMemory, curatedMaterial);
        const modelInput = modelInputV01({
          manifest,
          arm,
          generation: episode as 0 | 1 | 2,
          index: episode,
          slot,
          actor,
          liveCase,
          privateMemory,
          curatedMaterial,
          ownBlind: null,
          peer: null,
          phase: "blind_solve",
        });
        const executed = routeChanged
          ? { binding: localBindingV01(
              manifest,
              planned,
              actor,
              memory,
              curatedMaterial,
              null,
              "route_changed",
              [],
              privateMemory.map((item) => item.memory_token),
            ), stop_reason: null, stop_status: null }
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
            beforeGatewayEntry: dependencies.before_gateway_entry,
          });
        const binding = executed.binding;
        if (binding.invocation_status === "route_changed") routeChanged = true;
        await registerBindingV01(
          state,
          bindings,
          usedEntries,
          planned,
          binding,
          dependencies.on_binding_finalized,
        );
        registerExplicitReferencesV01(state, binding);
        blindBySlot.set(slot, binding);
        if (executed.stop_reason) {
          executionStopReason = executed.stop_reason;
          executionStopStatus = executed.stop_status;
          break;
        }
      }
      if (executionStopReason) break;
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
        const privateMemory = persistentArmV01(arm)
          ? privateMemoryMaterialV01(
              memory,
              input.c1_manifest.experiment_id,
              liveCase.actor_visible.task_family_key,
              liveDevelopmentSources,
              planned.call_slot_id,
            )
          : [];
        const curatedMaterial = arm === "disposable_curated_knowledge"
          ? curatedMaterialV01(curatedInput, planned.call_slot_id)
          : [];
        registerPresentedMaterialV01(state, privateMemory, curatedMaterial);
        let executed: Awaited<ReturnType<typeof executeCallV01>>;
        if (routeChanged) {
          executed = { binding: localBindingV01(
            manifest,
            planned,
            actor,
            memory,
            curatedMaterial,
            peerArtifact?.peer_artifact_ref ?? null,
            "route_changed",
            peerArtifact?.claim_candidates.map((claim) => claim.claim_token) ?? [],
            privateMemory.map((item) => item.memory_token),
          ), stop_reason: null, stop_status: null };
        } else if (!ownArtifact || !peerArtifact) {
          executed = { binding: localBindingV01(
            manifest,
            planned,
            actor,
            memory,
            curatedMaterial,
            peerArtifact?.peer_artifact_ref ?? null,
            "dependency_missing",
            peerArtifact?.claim_candidates.map((claim) => claim.claim_token) ?? [],
            privateMemory.map((item) => item.memory_token),
          ), stop_reason: null, stop_status: null };
        } else {
          executed = await executeCallV01({
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
              privateMemory,
              curatedMaterial,
              ownBlind: ownArtifact,
              peer: peerArtifact,
              phase: "challenge_synthesis",
            }),
            costBudget: input.cost_budget,
            invokeGateway,
            gatewayDependencies: dependencies.gateway_dependencies,
            signal: externalSignal,
            beforeGatewayEntry: dependencies.before_gateway_entry,
          });
        }
        const binding = executed.binding;
        if (binding.invocation_status === "route_changed") routeChanged = true;
        await registerBindingV01(
          state,
          bindings,
          usedEntries,
          planned,
          binding,
          dependencies.on_binding_finalized,
        );
        registerExplicitReferencesV01(state, binding);
        synthesisBySlot.set(slot, binding);
        if (executed.stop_reason) {
          executionStopReason = executed.stop_reason;
          executionStopStatus = executed.stop_status;
          break;
        }
      }
      if (executionStopReason) break;

      const episodeEvaluations: GovernedActorLabLiveEvaluationV01[] = [];
      for (const slot of SLOTS) {
        const finalBinding = synthesisBySlot.get(slot)!;
        const evaluation = evaluateGovernedActorLabLiveOutputV01({
          arm,
          generation: episode as 0 | 1 | 2,
          slot,
          liveCase,
          binding: finalBinding,
          peerArtifact: peerArtifactV01(
            SLOTS[(SLOTS.indexOf(slot) + 1) % SLOTS.length]!,
            blindBySlot.get(SLOTS[(SLOTS.indexOf(slot) + 1) % SLOTS.length]!)!,
          ),
        });
        state.evaluations.push(evaluation);
        episodeEvaluations.push(evaluation);
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
      const evaluatedActors = structuredClone(state.actors);
      const postEpisodeMemories = structuredClone(state.memories);
      if (episode < 2) {
        const evaluationRef = frozenSelectionEvaluationV01(
          arm,
          episode,
          actorsBySlot,
          episodeEvaluations,
        );
        if (arm === "persistent_evolutionary_population") {
          try {
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
          } catch (error) {
            if (
              !(error instanceof GovernedActorLabErrorV01) ||
              error.code !== "actor_lab_no_selection_evidence"
            ) {
              throw error;
            }
            state.terminal = buildArmTerminalV01({
              state,
              generation: episode as 0 | 1,
              evaluation: evaluationRef,
              episodeEvaluations,
              actorsBySlot,
            });
          }
        } else if (
          episodeEvaluations.length === SLOTS.length &&
          episodeEvaluations.every(
            (evaluation) => evaluation.hard_gate_failure === true,
          )
        ) {
          state.terminal = buildArmTerminalV01({
            state,
            generation: episode as 0 | 1,
            evaluation: evaluationRef,
            episodeEvaluations,
            actorsBySlot,
          });
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
      const checkpoint = buildCheckpointV01({
        manifest,
        state,
        generation: episode as 0 | 1 | 2,
        episodeEvaluations,
        evaluatedActors,
        postEpisodeMemories,
        journalPrefixLength: bindings.length,
      });
      await dependencies.on_checkpoint_finalized?.(checkpoint);
      checkpoints.push(checkpoint);
    }
    if (executionStopReason) break;
  }

  if (!executionStopReason) {
    for (const state of states.values()) state.frozenForHoldout = true;
  }
  if ([...states.values()].some((state) => !state.frozenForHoldout)) {
    if (!executionStopReason) failV01("governed_actor_lab_live_holdout_freeze_failed");
  }

  // Holdout actor-visible material is first dereferenced only after every arm
  // has frozen G2 actor, mutation, and private-memory state.
  for (const arm of executionStopReason ? [] : LIVE_ARMS) {
    const state = states.get(arm)!;
    if (state.terminal) {
      for (const [index, slot] of SLOTS.entries()) {
        const planned = requiredPlanEntryV01(entriesByKey, {
          arm,
          phase: "holdout_blind",
          generation: "holdout",
          index,
          slot,
        });
        const binding = armTerminalBindingV01(manifest, planned, state.terminal);
        await registerBindingV01(
          state,
          bindings,
          usedEntries,
          planned,
          binding,
          dependencies.on_binding_finalized,
        );
      }
      continue;
    }
    const actorsBySlot = actorsForSlotsV01(state, arm);
    const memoriesBySlot = memoriesForSlotsV01(state, actorsBySlot);
    state.holdoutMaterialized = true;
    for (const [index, slot] of SLOTS.entries()) {
      const liveCase = input.casebook.hidden_holdout.cases[index]!;
      const actor = actorsBySlot.get(slot)!;
      const memory = memoriesBySlot.get(slot)!;
      const planned = requiredPlanEntryV01(entriesByKey, {
        arm,
        phase: "holdout_blind",
        generation: "holdout",
        index,
        slot,
      });
      const privateMemory = persistentArmV01(arm)
        ? privateMemoryMaterialV01(
            memory,
            input.c1_manifest.experiment_id,
            liveCase.actor_visible.task_family_key,
            liveDevelopmentSources,
            planned.call_slot_id,
          )
        : [];
      const curatedMaterial = arm === "disposable_curated_knowledge"
        ? curatedMaterialV01(curatedInput, planned.call_slot_id)
        : [];
      registerPresentedMaterialV01(state, privateMemory, curatedMaterial);
      const executed = routeChanged
        ? { binding: localBindingV01(
            manifest,
            planned,
            actor,
            memory,
            curatedMaterial,
            null,
            "route_changed",
            [],
            privateMemory.map((item) => item.memory_token),
          ), stop_reason: null, stop_status: null }
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
            phase: "holdout_blind",
            }),
            costBudget: input.cost_budget,
            invokeGateway,
            gatewayDependencies: dependencies.gateway_dependencies,
          signal: externalSignal,
          beforeGatewayEntry: dependencies.before_gateway_entry,
        });
      const binding = executed.binding;
      if (binding.invocation_status === "route_changed") routeChanged = true;
      await registerBindingV01(
        state,
        bindings,
        usedEntries,
        planned,
        binding,
        dependencies.on_binding_finalized,
      );
      registerExplicitReferencesV01(state, binding);
      state.evaluations.push(
        evaluateGovernedActorLabLiveOutputV01({
          arm,
          generation: "holdout",
          slot,
          liveCase,
          binding,
          peerArtifact: null,
        }),
      );
      if (executed.stop_reason) {
        executionStopReason = executed.stop_reason;
        executionStopStatus = executed.stop_status;
        break;
      }
    }
    if (executionStopReason) break;
  }
  } catch {
    executionStopReason = "cohort_internal_error";
    executionStopStatus = "cohort_internal_error";
  }

  bindings.sort((left, right) => left.call_order - right.call_order);
  return finalizeExecutionResultV01({
    manifest,
    callPlan,
    casebook: input.casebook,
    bindings,
    checkpoints,
    states,
    stopReason: executionStopReason,
    stopStatus: executionStopStatus,
  });
}

function finalizeExecutionResultV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  callPlan: GovernedActorLabLiveCallPlanV01;
  casebook: GovernedActorLabLiveCasebookV01;
  bindings: GovernedActorLabLiveInvocationBindingV01[];
  checkpoints: GovernedActorLabLiveCheckpointV01[];
  states: Map<GovernedActorLabBaselineArmV01, ArmRuntimeStateV01>;
  stopReason: string | null;
  stopStatus: GovernedActorLabLiveTerminalAttemptV01["status"] | null;
}): GovernedActorLabLiveExecutionResultV01 {
  const accounting = deriveGovernedActorLabLiveAggregateAccountingV01(
    input.bindings,
    input.manifest.route,
  );
  const armResults = LIVE_ARMS.map((arm) =>
    buildArmResultV01(input.states.get(arm)!),
  );
  const terminals = LIVE_ARMS.flatMap((arm) => {
    const terminal = input.states.get(arm)!.terminal;
    return terminal ? [terminal] : [];
  });
  const complete =
    input.stopReason === null &&
    terminals.length === 0 &&
    input.bindings.length === 140 &&
    accounting.attempted_provider_calls_unknown_slots === 0 &&
    armResults.every(
      (arm) => arm.arm_completion_status === "complete" && arm.comparison_eligible,
    );
  if (!complete) {
    const terminalAttempt = buildTerminalAttemptV01({
      manifest: input.manifest,
      status: input.stopStatus ?? "truthful_incomplete",
      terminalReason: input.stopReason ?? (
        terminals.length > 0
          ? "arm_terminal_no_valid_population"
          : "required_live_observations_incomplete"
      ),
      bindings: input.bindings,
      checkpoints: input.checkpoints,
    });
    return buildGovernedActorLabLiveIncompleteResultFromJournalV01({
      manifest: input.manifest,
      call_plan: input.callPlan,
      invocation_bindings: input.bindings,
      checkpoints: input.checkpoints,
      arm_terminals: terminals,
      terminal_attempt: terminalAttempt,
    });
  }
  const comparisons = buildComparisonsV01(armResults);
  const nonDominance = deriveNonDominanceV01(armResults);
  const reportWithoutIntegrity = {
    report_version: GOVERNED_ACTOR_LAB_LIVE_REPORT_VERSION_V01,
    report_id: `live-report:${input.manifest.cohort_id.slice("live-cohort:".length)}`,
    report_kind: "bounded_live_model_governed_actor_lab_single_cohort" as const,
    completion_status: "complete" as const,
    cohort_ref: {
      cohort_id: input.manifest.cohort_id,
      cohort_fingerprint: input.manifest.integrity.fingerprint,
    },
    source_repository_head_sha: input.manifest.source_repository_head_sha,
    route: structuredClone(input.manifest.route),
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
    limitations: liveLimitationsV01(),
  };
  const terminalAttempt = buildTerminalAttemptV01({
    manifest: input.manifest,
    status: "complete",
    terminalReason: "complete_exact_call_plan",
    bindings: input.bindings,
    checkpoints: input.checkpoints,
  });
  const result: GovernedActorLabLiveCohortResultV01 = {
    result_kind: "complete",
    manifest: input.manifest,
    call_plan: input.callPlan,
    invocation_bindings: input.bindings,
    checkpoints: input.checkpoints,
    terminal_attempt: terminalAttempt,
    report: sealV01(reportWithoutIntegrity) as GovernedActorLabLiveReportV01,
  };
  return validateGovernedActorLabLiveCohortResultV01(result);
}

function buildTerminalAttemptV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  status: GovernedActorLabLiveTerminalAttemptV01["status"];
  terminalReason: string;
  bindings: GovernedActorLabLiveInvocationBindingV01[];
  checkpoints: GovernedActorLabLiveCheckpointV01[];
}): GovernedActorLabLiveTerminalAttemptV01 {
  return sealV01({
    attempt_version: GOVERNED_ACTOR_LAB_LIVE_ATTEMPT_VERSION_V01,
    cohort_id: input.manifest.cohort_id,
    status: input.status,
    terminal_reason: input.terminalReason,
    persisted_invocation_prefix: input.bindings.length,
    persisted_checkpoint_count: input.checkpoints.length,
    missing_call_slots: 140 - input.bindings.length,
    provider_attempt_count_unknown: input.bindings.some(
      (binding) => binding.provider_attempt_status === "unknown_receipt_unavailable",
    ),
    retry_authorized: false as const,
    second_cohort_authorized: false as const,
  });
}

export function buildGovernedActorLabLiveIncompleteResultFromJournalV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  call_plan: GovernedActorLabLiveCallPlanV01;
  invocation_bindings: GovernedActorLabLiveInvocationBindingV01[];
  checkpoints: GovernedActorLabLiveCheckpointV01[];
  arm_terminals: GovernedActorLabLiveArmTerminalV01[];
  terminal_attempt?: GovernedActorLabLiveTerminalAttemptV01;
}): GovernedActorLabLiveIncompleteResultV01 {
  const terminalAttempt = input.terminal_attempt ?? buildTerminalAttemptV01({
    manifest: input.manifest,
    status: "truthful_incomplete",
    terminalReason: "journal_prefix_reconstructed_after_interruption",
    bindings: input.invocation_bindings,
    checkpoints: input.checkpoints,
  });
  const report = buildIncompleteReportV01({
    manifest: input.manifest,
    callPlan: input.call_plan,
    bindings: input.invocation_bindings,
    checkpoints: input.checkpoints,
    terminals: input.arm_terminals,
  });
  const result: GovernedActorLabLiveIncompleteResultV01 = {
    result_kind: "truthful_incomplete",
    manifest: structuredClone(input.manifest),
    call_plan: structuredClone(input.call_plan),
    invocation_bindings: structuredClone(input.invocation_bindings),
    checkpoints: structuredClone(input.checkpoints),
    arm_terminals: structuredClone(input.arm_terminals),
    terminal_attempt: structuredClone(terminalAttempt),
    report,
  };
  return validateGovernedActorLabLiveIncompleteResultV01(result);
}

function buildIncompleteReportV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  callPlan: GovernedActorLabLiveCallPlanV01;
  bindings: GovernedActorLabLiveInvocationBindingV01[];
  checkpoints: GovernedActorLabLiveCheckpointV01[];
  terminals: GovernedActorLabLiveArmTerminalV01[];
}) {
  const accounting = deriveGovernedActorLabLiveAggregateAccountingV01(
    input.bindings,
    input.manifest.route,
  );
  const arms = LIVE_ARMS.map((arm) => {
    const bindings = input.bindings.filter((binding) => binding.arm === arm);
    const checkpoints = input.checkpoints.filter(
      (checkpoint) => checkpoint.arm === arm,
    );
    const terminal = input.terminals.find((candidate) => candidate.arm === arm) ?? null;
    const holdoutBindings = bindings.filter(
      (binding) => binding.phase === "holdout_blind",
    );
    const requiredObserved =
      bindings.length === 28 &&
      bindings.every((binding) => binding.invocation_status === "completed_live") &&
      holdoutBindings.length === 4;
    return {
      arm,
      status: terminal
        ? "terminal" as const
        : requiredObserved
          ? "frozen_g2" as const
          : "incomplete" as const,
      terminal_ref: terminal?.integrity.fingerprint ?? null,
      terminal_reason: terminal?.terminal_reason ?? null,
      latest_checkpoint_ref: checkpoints.at(-1)?.integrity.fingerprint ?? null,
      finalized_slots: bindings.length,
      receipt_bearing_attempted_calls: bindings.filter(
        (binding) => binding.model_invocation_receipt?.egress_attempted,
      ).length,
      completed_live_calls: bindings.filter(
        (binding) => binding.invocation_status === "completed_live",
      ).length,
      holdout_materialization: terminal
        ? "not_materialized_arm_terminal" as const
        : holdoutBindings.length > 0
          ? "materialized" as const
          : "not_reached" as const,
    };
  });
  const comparisons = undeterminedComparisonsV01(
    "Incomplete or terminal arm evidence prevents the required comparison.",
  );
  return sealV01({
    report_version: GOVERNED_ACTOR_LAB_LIVE_INCOMPLETE_REPORT_VERSION_V01,
    report_id: `live-incomplete-report:${input.manifest.cohort_id.slice("live-cohort:".length)}`,
    report_kind: "bounded_live_model_governed_actor_lab_truthful_incomplete" as const,
    completion_status: "truthful_incomplete" as const,
    cohort_ref: {
      cohort_id: input.manifest.cohort_id,
      cohort_fingerprint: input.manifest.integrity.fingerprint,
    },
    source_repository_head_sha: input.manifest.source_repository_head_sha,
    route: structuredClone(input.manifest.route),
    accounting,
    arms,
    terminal_arms: input.terminals.map((terminal) => ({
      arm: terminal.arm,
      terminal_ref: terminal.integrity.fingerprint,
      terminal_reason: terminal.terminal_reason,
    })),
    incomplete_arms: arms
      .filter((arm) => arm.status !== "frozen_g2")
      .map((arm) => arm.arm),
    comparisons,
    non_dominance: {
      status: "undetermined" as const,
      non_dominated_arms: [] as [],
      tradeoffs: [
        "Incomplete evidence cannot establish a five-arm non-dominated set.",
      ],
      pairwise_better_is_global_winner: false as const,
    },
    holdout_materialization_complete: arms.every(
      (arm) => arm.holdout_materialization !== "not_reached",
    ),
    stochastic_repeatability: "unmeasured_single_cohort" as const,
    verified_general_benefit: false as const,
    global_winner_created: false as const,
    product_promotion_created: false as const,
    authority_boundary: createGovernedActorLabLiveAuthorityBoundaryV01(),
    limitations: [
      ...liveLimitationsV01(),
      "Missing observations remain missing; no dominance or promotion claim is produced.",
    ],
  });
}

function undeterminedComparisonsV01(reason: string): GovernedActorLabLiveReportV01["comparisons"] {
  return [
    {
      comparison: "persistence-only vs nonpersistent",
      left_arm: "persistent_population_no_evolution",
      right_arm: "nonpersistent_compute_matched_ensemble",
      status: "undetermined",
      basis: [reason],
      global_winner_created: false,
    },
    {
      comparison: "persistence-only vs curated",
      left_arm: "persistent_population_no_evolution",
      right_arm: "disposable_curated_knowledge",
      status: "undetermined",
      basis: [reason],
      global_winner_created: false,
    },
    {
      comparison: "evolutionary vs persistence-only",
      left_arm: "persistent_evolutionary_population",
      right_arm: "persistent_population_no_evolution",
      status: "undetermined",
      basis: [reason],
      global_winner_created: false,
    },
  ];
}

function liveLimitationsV01(): string[] {
  return [
    "One live cohort cannot measure stochastic repeatability.",
    "Provider and model identity are provenance, not Lab actor identity.",
    "Live cohort advantage is not verified general benefit.",
    "Pairwise better is not a global winner; non-dominance is not product promotion.",
    "ModelInvocationReceipt is not Evidence and is not task success.",
    "Gateway Authorization Project is not Lab Experiment Project Meaning.",
    "Presented is not referenced; referenced is not support, outcome, or causal contribution.",
  ];
}

export function deriveGovernedActorLabLiveAggregateAccountingV01(
  bindings: GovernedActorLabLiveInvocationBindingV01[],
  route: GovernedActorLabLiveRouteV01,
): GovernedActorLabLiveAggregateAccountingV01 {
  const receipts = bindings.flatMap((binding) =>
    binding.model_invocation_receipt ? [validateModelInvocationReceiptV02(binding.model_invocation_receipt)] : [],
  );
  const attempted = receipts.filter((receipt) => receipt.egress_attempted);
  const unknownAttemptSlots = bindings.filter(
    (binding) => binding.provider_attempt_status === "unknown_receipt_unavailable",
  ).length;
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
    attempted_provider_calls: unknownAttemptSlots > 0 ? null : attempted.length,
    receipt_bearing_attempted_calls: attempted.length,
    attempted_provider_calls_unknown_slots: unknownAttemptSlots,
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
    not_attempted_arm_terminal: count("not_attempted_arm_terminal"),
    cohort_internal_error_receipt_unavailable: count(
      "cohort_internal_error_receipt_unavailable",
    ),
    journaled_slot_count: bindings.length,
    missing_call_slots: 140 - bindings.length,
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
    provider_model_consistent:
      unknownAttemptSlots === 0 &&
      !bindings.some((binding) => binding.invocation_status === "route_changed") &&
      receipts.every((receipt) =>
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
  if (attempted.length > 140 || bindings.length > 140) {
    failV01("governed_actor_lab_live_call_ceiling_exceeded");
  }
  return sealV01(withoutIntegrity);
}

export function validateGovernedActorLabLiveCohortResultV01(
  input: unknown,
): GovernedActorLabLiveCohortResultV01 {
  if (!isRecordV01(input)) failV01("governed_actor_lab_live_result_invalid");
  const result = input as unknown as GovernedActorLabLiveCohortResultV01;
  if (
    result.result_kind !== "complete" ||
    result.manifest.cohort_count !== 1 ||
    result.call_plan.planned_calls !== 140 ||
    result.call_plan.entries.length !== 140 ||
    result.invocation_bindings.length !== 140 ||
    result.terminal_attempt.status !== "complete" ||
    result.terminal_attempt.persisted_invocation_prefix !== 140 ||
    result.report.completion_status !== "complete" ||
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
  assertSealedV01(result.terminal_attempt);
  result.checkpoints.forEach(assertSealedV01);
  validateManifestPlanBindingV01(result.manifest, result.call_plan);
  if (
    new Set(result.invocation_bindings.map((binding) => binding.call_slot_id)).size !== 140 ||
    result.invocation_bindings.some((binding, index) => binding.call_order !== index)
  ) {
    failV01("governed_actor_lab_live_lineage_invalid");
  }
  for (const [index, binding] of result.invocation_bindings.entries()) {
    const planned = result.call_plan.entries[index]!;
    validateBindingAgainstPlanEntryV01(binding, planned, result.manifest.route);
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
  validateCompleteArmProjectionsV01(result);
  if (
    canonicalizeProtocolValueV01(buildComparisonsV01(result.report.arms)) !==
      canonicalizeProtocolValueV01(result.report.comparisons) ||
    canonicalizeProtocolValueV01(deriveNonDominanceV01(result.report.arms)) !==
      canonicalizeProtocolValueV01(result.report.non_dominance)
  ) {
    failV01("governed_actor_lab_live_comparison_derivation_invalid");
  }
  validateCheckpointPrefixV01(result.checkpoints, 140);
  scanForbiddenPersistedMaterialV01(result);
  return structuredClone(result);
}

function validateCompleteArmProjectionsV01(
  result: GovernedActorLabLiveCohortResultV01,
): void {
  if (
    result.report.arms.length !== LIVE_ARMS.length ||
    new Set(result.report.arms.map((arm) => arm.arm)).size !== LIVE_ARMS.length ||
    LIVE_ARMS.some((arm) => !result.report.arms.some((entry) => entry.arm === arm))
  ) {
    failV01("governed_actor_lab_live_arm_projection_invalid");
  }
  for (const arm of result.report.arms) {
    const bindings = result.invocation_bindings.filter(
      (binding) => binding.arm === arm.arm,
    );
    const expectedBindingRefs = bindings.map(
      (binding) => binding.integrity.fingerprint,
    );
    const holdoutBindings = bindings.filter(
      (binding) => binding.phase === "holdout_blind",
    );
    const holdoutEvaluations = arm.evaluations.filter(
      (evaluation) => evaluation.generation === "holdout",
    );
    const transitionExclusions = arm.population_transitions.reduce(
      (sum, transition) => sum + transition.hard_gate_excluded_actor_ids.length,
      0,
    );
    if (
      bindings.length !== 28 ||
      holdoutBindings.length !== 4 ||
      holdoutEvaluations.length !== 4 ||
      arm.evaluations.length !== 16 ||
      arm.terminal !== null ||
      arm.arm_completion_status !== "complete" ||
      arm.arm_level_hard_gate.failed ||
      arm.arm_level_hard_gate.codes.length !== 0 ||
      !arm.comparable ||
      !arm.comparison_eligible ||
      canonicalizeProtocolValueV01(arm.invocation_binding_refs) !==
        canonicalizeProtocolValueV01(expectedBindingRefs) ||
      arm.actor_evaluation_failures !== arm.evaluations.filter(
        (evaluation) => evaluation.status === "fail",
      ).length ||
      arm.actor_unknowns !== arm.evaluations.filter(
        (evaluation) => evaluation.status === "unknown",
      ).length ||
      arm.actor_selection_hard_gate_exclusions !== transitionExclusions ||
      arm.holdout.materialized !== true ||
      arm.holdout.passed !== holdoutEvaluations.filter(
        (evaluation) => evaluation.status === "pass",
      ).length ||
      arm.holdout.failed !== holdoutEvaluations.filter(
        (evaluation) => evaluation.status === "fail",
      ).length ||
      arm.holdout.unknown !== holdoutEvaluations.filter(
        (evaluation) => evaluation.status === "unknown",
      ).length ||
      arm.metrics.actor_memory_presented !== bindings.reduce(
        (sum, binding) => sum + binding.presented_memory_tokens.length,
        0,
      ) ||
      arm.metrics.actor_memory_retrieved !== arm.metrics.actor_memory_presented ||
      arm.metrics.actor_memory_eligible !== arm.metrics.actor_memory_presented ||
      arm.metrics.actor_memory_explicitly_referenced !== bindings.reduce(
        (sum, binding) =>
          sum + (binding.normalized_output?.referenced_memory_tokens.length ?? 0),
        0,
      ) ||
      arm.metrics.actor_memory_actual_use !== null ||
      arm.metrics.curated_material_presented !== bindings.reduce(
        (sum, binding) => sum + binding.presented_curated_tokens.length,
        0,
      ) ||
      arm.metrics.curated_material_explicitly_referenced !== bindings.reduce(
        (sum, binding) =>
          sum + (binding.normalized_output?.referenced_curated_tokens.length ?? 0),
        0,
      ) ||
      arm.metrics.curated_material_actual_use !== null
    ) {
      failV01("governed_actor_lab_live_arm_projection_invalid");
    }
    arm.evaluations.forEach(validateSerializedEvaluationV01);
  }
}

function validateSerializedEvaluationV01(
  evaluation: GovernedActorLabLiveEvaluationV01,
): void {
  const { evaluation_fingerprint: fingerprint, ...withoutFingerprint } = evaluation;
  const failed = evaluation.checks.filter((check) => check.result === "fail");
  const hardFailed = failed.filter(
    (check) => check.severity === "selection_disqualifying_hard_gate",
  );
  const unknown = evaluation.checks.some((check) => check.result === "unknown");
  if (
    fingerprint !== createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ) ||
    evaluation.checks.length !== evaluation.required_checks_total ||
    evaluation.checks.some(
      (check) =>
        !GOVERNED_ACTOR_LAB_LIVE_EVALUATION_CHECK_CODES_V01.includes(
          check.check_code,
        ),
    ) ||
    new Set(evaluation.checks.map((check) => check.check_code)).size !==
      evaluation.checks.length ||
    canonicalizeProtocolValueV01(evaluation.evaluation_failure_codes) !==
      canonicalizeProtocolValueV01(
        failed.map((check) => check.check_code).sort(compareProtocolCodeUnitsV01),
      ) ||
    canonicalizeProtocolValueV01(evaluation.hard_gate_failure_codes) !==
      canonicalizeProtocolValueV01(
        hardFailed.map((check) => check.check_code).sort(compareProtocolCodeUnitsV01),
      ) ||
    evaluation.required_checks_passed !== (
      unknown
        ? null
        : evaluation.checks.filter((check) => check.result === "pass").length
    ) ||
    evaluation.status !== (
      unknown ? "unknown" : failed.length > 0 ? "fail" : "pass"
    ) ||
    evaluation.hard_gate_failure !== (
      unknown ? null : hardFailed.length > 0
    )
  ) {
    failV01("governed_actor_lab_live_evaluation_projection_invalid");
  }
}

export function validateGovernedActorLabLiveIncompleteResultV01(
  input: unknown,
): GovernedActorLabLiveIncompleteResultV01 {
  if (!isRecordV01(input)) failV01("governed_actor_lab_live_incomplete_result_invalid");
  const result = input as unknown as GovernedActorLabLiveIncompleteResultV01;
  if (
    result.result_kind !== "truthful_incomplete" ||
    result.report.completion_status !== "truthful_incomplete" ||
    result.report.non_dominance.status !== "undetermined" ||
    result.report.non_dominance.non_dominated_arms.length !== 0 ||
    result.report.comparisons.some((comparison) => comparison.status !== "undetermined") ||
    result.report.verified_general_benefit !== false ||
    result.report.global_winner_created !== false ||
    result.report.product_promotion_created !== false
  ) {
    failV01("governed_actor_lab_live_incomplete_result_invalid");
  }
  assertSealedV01(result.manifest);
  assertSealedV01(result.call_plan);
  assertSealedV01(result.report);
  assertSealedV01(result.terminal_attempt);
  result.checkpoints.forEach(assertSealedV01);
  result.arm_terminals.forEach(assertSealedV01);
  validateManifestPlanBindingV01(result.manifest, result.call_plan);
  if (
    result.invocation_bindings.length !== result.terminal_attempt.persisted_invocation_prefix ||
    result.checkpoints.length !== result.terminal_attempt.persisted_checkpoint_count ||
    result.terminal_attempt.missing_call_slots !== 140 - result.invocation_bindings.length ||
    result.invocation_bindings.some((binding, index) => binding.call_order !== index) ||
    new Set(result.invocation_bindings.map((binding) => binding.call_slot_id)).size !==
      result.invocation_bindings.length
  ) {
    failV01("governed_actor_lab_live_incomplete_prefix_invalid");
  }
  for (const [index, binding] of result.invocation_bindings.entries()) {
    validateBindingAgainstPlanEntryV01(
      binding,
      result.call_plan.entries[index]!,
      result.manifest.route,
    );
  }
  validateCheckpointPrefixV01(result.checkpoints, result.invocation_bindings.length);
  validateTerminalBindingLineageV01(
    result.invocation_bindings,
    result.arm_terminals,
  );
  const rebuiltReport = buildIncompleteReportV01({
    manifest: result.manifest,
    callPlan: result.call_plan,
    bindings: result.invocation_bindings,
    checkpoints: result.checkpoints,
    terminals: result.arm_terminals,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltReport) !==
      canonicalizeProtocolValueV01(result.report)
  ) {
    failV01("governed_actor_lab_live_incomplete_projection_invalid");
  }
  scanForbiddenPersistedMaterialV01(result);
  return structuredClone(result);
}

function validateManifestPlanBindingV01(
  manifest: GovernedActorLabLiveCohortManifestV01,
  callPlan: GovernedActorLabLiveCallPlanV01,
): void {
  if (
    manifest.call_plan_ref.call_plan_fingerprint !== callPlan.integrity.fingerprint ||
    manifest.call_plan_ref.planned_calls !== callPlan.planned_calls ||
    callPlan.entries.length !== 140 ||
    callPlan.entries.some((entry, index) => entry.call_order !== index) ||
    new Set(callPlan.entries.map((entry) => entry.call_slot_id)).size !== 140
  ) {
    failV01("governed_actor_lab_live_manifest_plan_invalid");
  }
}

function validateCheckpointPrefixV01(
  checkpoints: GovernedActorLabLiveCheckpointV01[],
  maximumPrefix: number,
): void {
  let priorPrefix = -1;
  const seen = new Set<string>();
  for (const checkpoint of checkpoints) {
    if (
      seen.has(checkpoint.checkpoint_id) ||
      checkpoint.journal_prefix_length < priorPrefix ||
      checkpoint.journal_prefix_length > maximumPrefix ||
      checkpoint.holdout_content_included !== false
    ) {
      failV01("governed_actor_lab_live_checkpoint_invalid");
    }
    seen.add(checkpoint.checkpoint_id);
    priorPrefix = checkpoint.journal_prefix_length;
  }
}

function validateTerminalBindingLineageV01(
  bindings: GovernedActorLabLiveInvocationBindingV01[],
  terminals: GovernedActorLabLiveArmTerminalV01[],
): void {
  const terminalByRef = new Map(
    terminals.map((terminal) => [terminal.integrity.fingerprint, terminal]),
  );
  for (const binding of bindings.filter(
    (candidate) => candidate.invocation_status === "not_attempted_arm_terminal",
  )) {
    const terminal = terminalByRef.get(binding.arm_terminal_ref!);
    if (
      !terminal ||
      terminal.arm !== binding.arm ||
      terminal.terminal_reason !== binding.no_egress_disposition?.arm_terminal_reason ||
      terminal.last_terminal_state_ref !== binding.last_terminal_state_ref
    ) {
      failV01("governed_actor_lab_live_arm_terminal_lineage_invalid");
    }
  }
}

function scanForbiddenPersistedMaterialV01(value: unknown): void {
  const serialized = canonicalizeProtocolValueV01(value);
  if (
    /(?:OPENAI_API_KEY|"Authorization"\s*:|Bearer\s+|\/Users\/|\/home\/|[A-Za-z]:\\)/u.test(serialized)
  ) {
    failV01("governed_actor_lab_live_forbidden_material_persisted");
  }
}

function callPlanEntryV01(input: {
  callOrder: number;
  arm: GovernedActorLabBaselineArmV01;
  phase: "blind_solve" | "challenge_synthesis" | "holdout_blind";
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
    phase: "blind_solve" | "challenge_synthesis" | "holdout_blind";
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
  invocationTokenBasis: string,
): GovernedActorLabLivePrivateMemoryMaterialV01[] {
  return retrieveGovernedActorLabPrivateMemoryV01(memory, {
    experiment_id: experimentId,
    lab_actor_id: memory.lab_actor_id,
    task_family_key: taskFamilyKey,
    allowed_source_refs: allowedSources,
  })
    .sort((left, right) => compareProtocolCodeUnitsV01(left.memory_item_id, right.memory_item_id))
    .map((item) => ({
      memory_token: opaqueMaterialTokenV01(
        "memory",
        invocationTokenBasis,
        item.memory_item_id,
      ),
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
  invocationTokenBasis: string,
): GovernedActorLabLiveCuratedMaterialV01[] {
  return curated.items.map((item, index) => ({
    curated_token: opaqueMaterialTokenV01(
      "curated",
      invocationTokenBasis,
      `${curated.curated_input_id}:item-${index}`,
    ),
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
  privateMemoryTokens?: string[];
  ownBlind: GovernedActorLabLivePeerArtifactV01 | null;
  peer: GovernedActorLabLivePeerArtifactV01 | null;
  phase: "blind_solve" | "challenge_synthesis" | "holdout_blind";
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
  beforeGatewayEntry?: (
    entry: GovernedActorLabLiveCallPlanEntryV01,
  ) => void | Promise<void>;
}): Promise<{
  binding: GovernedActorLabLiveInvocationBindingV01;
  stop_reason: string | null;
  stop_status: GovernedActorLabLiveTerminalAttemptV01["status"] | null;
}> {
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
    await input.beforeGatewayEntry?.(input.planned);
  } catch {
    return {
      binding: internalErrorBindingV01({
        manifest: input.manifest,
        planned: input.planned,
        actor: input.actor,
        memory: input.memory,
        curatedMaterial: input.curatedMaterial,
        peerArtifactRef: input.peerArtifactRef,
        peerClaimTokens:
          input.modelInput.peer_challenge_artifact?.claim_candidates.map(
            (claim) => claim.claim_token,
          ) ?? [],
        privateMemoryTokens: input.modelInput.admitted_private_memory.map(
          (item) => item.memory_token,
        ),
        costBudget: input.costBudget,
        providerAttemptStatus: "known_not_attempted_local",
      }),
      stop_reason: "cohort_internal_error_before_gateway_entry",
      stop_status: "cohort_internal_error",
    };
  }
  try {
    const result = await input.invokeGateway(envelope, {
      ...input.gatewayDependencies,
      expected_governed_actor_lab_route: input.manifest.route,
    });
    return {
      binding: bindingV01({
        manifest: input.manifest,
        planned: input.planned,
        actor: input.actor,
        memory: input.memory,
        curatedMaterial: input.curatedMaterial,
        peerArtifactRef: input.peerArtifactRef,
        peerClaimTokens:
          input.modelInput.peer_challenge_artifact?.claim_candidates.map(
            (claim) => claim.claim_token,
          ) ?? [],
        privateMemoryTokens: input.modelInput.admitted_private_memory.map(
          (item) => item.memory_token,
        ),
        output: result.output,
        receipt: result.model_invocation_receipt,
        status: "completed_live",
        costBudget: input.costBudget,
      }),
      stop_reason: null,
      stop_status: null,
    };
  } catch (error) {
    if (!isModelGatewayInvocationErrorV01(error)) {
      return {
        binding: internalErrorBindingV01({
          manifest: input.manifest,
          planned: input.planned,
          actor: input.actor,
          memory: input.memory,
          curatedMaterial: input.curatedMaterial,
          peerArtifactRef: input.peerArtifactRef,
          peerClaimTokens:
            input.modelInput.peer_challenge_artifact?.claim_candidates.map(
              (claim) => claim.claim_token,
            ) ?? [],
          privateMemoryTokens: input.modelInput.admitted_private_memory.map(
            (item) => item.memory_token,
          ),
          costBudget: input.costBudget,
          providerAttemptStatus: "unknown_receipt_unavailable",
        }),
        stop_reason: "cohort_internal_error_receipt_unavailable",
        stop_status: "cohort_internal_error",
      };
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
    const status = routeMismatch
      ? "route_changed"
      : invocationStatusFromFailureV01(error.code);
    return {
      binding: bindingV01({
        manifest: input.manifest,
        planned: input.planned,
        actor: input.actor,
        memory: input.memory,
        curatedMaterial: input.curatedMaterial,
        peerArtifactRef: input.peerArtifactRef,
        peerClaimTokens:
          input.modelInput.peer_challenge_artifact?.claim_candidates.map(
            (claim) => claim.claim_token,
          ) ?? [],
        privateMemoryTokens: input.modelInput.admitted_private_memory.map(
          (item) => item.memory_token,
        ),
        output: null,
        receipt,
        status,
        costBudget: input.costBudget,
        noEgressDisposition: status === "route_changed" && receipt === null
          ? {
              code: "route_changed",
              arm_terminal_ref: null,
              arm_terminal_reason: null,
            }
          : null,
      }),
      stop_reason: status === "cancelled" ? "cohort_cancelled" : null,
      stop_status: status === "cancelled" ? "cancelled" : null,
    };
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
  peerClaimTokens: string[] = [],
  privateMemoryTokens: string[] = [],
): GovernedActorLabLiveInvocationBindingV01 {
  return bindingV01({
    manifest,
    planned,
    actor,
    memory,
    curatedMaterial,
    peerArtifactRef,
    peerClaimTokens,
    privateMemoryTokens,
    output: null,
    receipt: null,
    status,
    providerAttemptStatus: "known_not_attempted_local",
    noEgressDisposition: {
      code: status,
      arm_terminal_ref: null,
      arm_terminal_reason: null,
    },
  });
}

function armTerminalBindingV01(
  manifest: GovernedActorLabLiveCohortManifestV01,
  planned: GovernedActorLabLiveCallPlanEntryV01,
  terminal: GovernedActorLabLiveArmTerminalV01,
): GovernedActorLabLiveInvocationBindingV01 {
  return bindingV01({
    manifest,
    planned,
    actor: null,
    memory: null,
    curatedMaterial: [],
    peerArtifactRef: null,
    peerClaimTokens: [],
    output: null,
    receipt: null,
    status: "not_attempted_arm_terminal",
    providerAttemptStatus: "known_not_attempted_local",
    lastTerminalStateRef: terminal.last_terminal_state_ref,
    armTerminalRef: terminal.integrity.fingerprint,
    noEgressDisposition: {
      code: "not_attempted_arm_terminal",
      arm_terminal_ref: terminal.integrity.fingerprint,
      arm_terminal_reason: terminal.terminal_reason,
    },
  });
}

function internalErrorBindingV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  planned: GovernedActorLabLiveCallPlanEntryV01;
  actor: GovernedActorLabActorSnapshotV01;
  memory: GovernedActorLabPrivateMemorySnapshotV01;
  curatedMaterial: GovernedActorLabLiveCuratedMaterialV01[];
  peerArtifactRef: string | null;
  peerClaimTokens: string[];
  privateMemoryTokens: string[];
  costBudget?: ModelGatewayCostBudgetV01;
  providerAttemptStatus:
    | "known_not_attempted_local"
    | "unknown_receipt_unavailable";
}): GovernedActorLabLiveInvocationBindingV01 {
  return bindingV01({
    ...input,
    output: null,
    receipt: null,
    status: "cohort_internal_error_receipt_unavailable",
    noEgressDisposition: {
      code: "cohort_internal_error_receipt_unavailable",
      arm_terminal_ref: null,
      arm_terminal_reason: null,
    },
  });
}

function bindingV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  planned: GovernedActorLabLiveCallPlanEntryV01;
  actor: GovernedActorLabActorSnapshotV01 | null;
  memory: GovernedActorLabPrivateMemorySnapshotV01 | null;
  curatedMaterial: GovernedActorLabLiveCuratedMaterialV01[];
  peerArtifactRef: string | null;
  peerClaimTokens: string[];
  privateMemoryTokens?: string[];
  output: GovernedActorLabLiveModelOutputV01 | null;
  receipt: ModelInvocationReceiptV02 | null;
  status: GovernedActorLabLiveInvocationStatusV01;
  costBudget?: ModelGatewayCostBudgetV01;
  providerAttemptStatus?: GovernedActorLabLiveInvocationBindingV01["provider_attempt_status"];
  noEgressDisposition?: GovernedActorLabLiveInvocationBindingV01["no_egress_disposition"];
  lastTerminalStateRef?: string | null;
  armTerminalRef?: string | null;
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
    episode_or_holdout_index: input.planned.episode_or_holdout_index,
    actor_slot: input.planned.actor_slot,
    peer_slot: input.planned.peer_slot,
    lab_actor_id: input.actor?.lab_actor_id ?? null,
    phase: input.planned.phase,
    case_id: input.planned.case_id,
    case_fingerprint: input.planned.case_fingerprint,
    frozen_actor_ref: input.actor?.actor_snapshot_id ?? null,
    frozen_private_memory_ref: persistentArmV01(input.planned.arm) && input.memory
      ? input.memory.memory_snapshot_id
      : null,
    last_terminal_state_ref: input.lastTerminalStateRef ?? null,
    arm_terminal_ref: input.armTerminalRef ?? null,
    curated_material_refs: input.curatedMaterial.map((item) => item.curated_item_ref),
    presented_memory_tokens: input.privateMemoryTokens ?? [],
    presented_curated_tokens: input.curatedMaterial.map((item) => item.curated_token),
    peer_artifact_ref: input.peerArtifactRef,
    peer_claim_tokens_supplied: uniqueStringsV01(input.peerClaimTokens),
    normalized_output: input.output ? structuredClone(input.output) : null,
    normalized_output_fingerprint: outputFingerprint,
    model_invocation_receipt: receipt,
    model_invocation_receipt_fingerprint: receipt ? receiptFingerprintV01(receipt) : null,
    provider_ref: structuredClone(input.manifest.route.provider_ref),
    model_ref: structuredClone(input.manifest.route.model_ref),
    invocation_status: input.status,
    provider_attempt_status: input.providerAttemptStatus ?? (
      receipt?.egress_attempted
        ? "receipt_attempted"
        : receipt
          ? "receipt_not_attempted"
          : "known_not_attempted_local"
    ),
    no_egress_disposition: input.noEgressDisposition ?? null,
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

function opaqueMaterialTokenV01(
  kind: "memory" | "curated",
  invocationTokenBasis: string,
  materialRef: string,
): string {
  return `${kind}:${createProtocolSha256V01(
    canonicalizeProtocolValueV01({ invocationTokenBasis, materialRef }),
  ).slice("sha256:".length, "sha256:".length + 32)}`;
}

function registerPresentedMaterialV01(
  state: ArmRuntimeStateV01,
  memory: GovernedActorLabLivePrivateMemoryMaterialV01[],
  curated: GovernedActorLabLiveCuratedMaterialV01[],
): void {
  state.memoryEligible += memory.length;
  state.memoryRetrieved += memory.length;
  state.memoryPresented += memory.length;
  state.curatedPresented += curated.length;
}

function registerExplicitReferencesV01(
  state: ArmRuntimeStateV01,
  binding: GovernedActorLabLiveInvocationBindingV01,
): void {
  if (!binding.normalized_output) return;
  state.memoryExplicitlyReferenced +=
    binding.normalized_output.referenced_memory_tokens.length;
  state.curatedExplicitlyReferenced +=
    binding.normalized_output.referenced_curated_tokens.length;
}

function buildArmTerminalV01(input: {
  state: ArmRuntimeStateV01;
  generation: 0 | 1;
  evaluation: ReturnType<typeof frozenSelectionEvaluationV01>;
  episodeEvaluations: GovernedActorLabLiveEvaluationV01[];
  actorsBySlot: Map<string, GovernedActorLabActorSnapshotV01>;
}): GovernedActorLabLiveArmTerminalV01 {
  const actorEvaluationRefs = SLOTS.map((slot) => {
    const actor = input.actorsBySlot.get(slot)!;
    const evaluation = input.episodeEvaluations.find(
      (entry) => entry.actor_slot === slot,
    )!;
    return {
      lab_actor_id: actor.lab_actor_id,
      evaluation_id: evaluation.evaluation_id,
      evaluation_fingerprint: evaluation.evaluation_fingerprint,
    };
  }).sort((left, right) =>
    compareProtocolCodeUnitsV01(left.lab_actor_id, right.lab_actor_id),
  );
  const actorHardGateExclusions = actorEvaluationRefs.flatMap((ref) => {
    const evaluation = input.episodeEvaluations.find(
      (entry) => entry.evaluation_id === ref.evaluation_id,
    )!;
    return evaluation.hard_gate_failure === true
      ? [{
          lab_actor_id: ref.lab_actor_id,
          evaluation_id: ref.evaluation_id,
          hard_gate_failure_codes: [...evaluation.hard_gate_failure_codes],
        }]
      : [];
  });
  const lastTerminalStateRef = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      actors: input.state.actors.map((actor) => ({
        lab_actor_id: actor.lab_actor_id,
        actor_snapshot_id: actor.actor_snapshot_id,
        actor_snapshot_fingerprint: actor.integrity.fingerprint,
      })),
      memories: input.state.memories.map((memory) => ({
        lab_actor_id: memory.lab_actor_id,
        memory_snapshot_id: memory.memory_snapshot_id,
        memory_snapshot_fingerprint: memory.integrity.fingerprint,
      })),
    }),
  );
  const terminalBasis = {
    arm: input.state.arm,
    terminal_generation: input.generation,
    terminal_reason: "no_valid_population" as const,
    selection_evaluation_ref: {
      evaluation_id: input.evaluation.evaluation_id,
      evaluation_fingerprint: input.evaluation.evaluation_fingerprint,
    },
    actor_evaluation_refs: actorEvaluationRefs,
    actor_hard_gate_exclusions: actorHardGateExclusions,
    last_terminal_state_ref: lastTerminalStateRef,
  };
  const withoutIntegrity = {
    terminal_version: "governed_actor_lab_live_arm_terminal.v0.1" as const,
    terminal_id: `live-arm-terminal:${createProtocolSha256V01(
      canonicalizeProtocolValueV01(terminalBasis),
    ).slice("sha256:".length, "sha256:".length + 32)}`,
    ...terminalBasis,
    arm_state_frozen: true as const,
    excluded_actors_revived: false as const,
    mutation_applied: false as const,
    product_authority: false as const,
    promotion_authority: false as const,
  };
  return sealV01(withoutIntegrity);
}

function buildCheckpointV01(input: {
  manifest: GovernedActorLabLiveCohortManifestV01;
  state: ArmRuntimeStateV01;
  generation: 0 | 1 | 2;
  episodeEvaluations: GovernedActorLabLiveEvaluationV01[];
  evaluatedActors: GovernedActorLabActorSnapshotV01[];
  postEpisodeMemories: GovernedActorLabPrivateMemorySnapshotV01[];
  journalPrefixLength: number;
}): GovernedActorLabLiveCheckpointV01 {
  const transition = input.state.populationTransitions.find(
    (candidate) => candidate.from_generation === input.generation,
  ) ?? null;
  const checkpointBasis = {
    cohort_id: input.manifest.cohort_id,
    arm: input.state.arm,
    generation: input.generation,
    journal_prefix_length: input.journalPrefixLength,
  };
  const withoutIntegrity = {
    checkpoint_version: GOVERNED_ACTOR_LAB_LIVE_CHECKPOINT_VERSION_V01,
    checkpoint_id: `live-checkpoint:${createProtocolSha256V01(
      canonicalizeProtocolValueV01(checkpointBasis),
    ).slice("sha256:".length, "sha256:".length + 32)}`,
    cohort_id: input.manifest.cohort_id,
    arm: input.state.arm,
    generation: input.generation,
    actor_refs: [...input.evaluatedActors]
      .sort((left, right) => compareProtocolCodeUnitsV01(left.lab_actor_id, right.lab_actor_id))
      .map((actor) => ({
        lab_actor_id: actor.lab_actor_id,
        actor_snapshot_id: actor.actor_snapshot_id,
        actor_snapshot_fingerprint: actor.integrity.fingerprint,
      })),
    memory_refs: [...input.postEpisodeMemories]
      .sort((left, right) => compareProtocolCodeUnitsV01(left.lab_actor_id, right.lab_actor_id))
      .map((memory) => ({
        lab_actor_id: memory.lab_actor_id,
        memory_snapshot_id: memory.memory_snapshot_id,
        memory_snapshot_fingerprint: memory.integrity.fingerprint,
      })),
    evaluation_refs: input.episodeEvaluations
      .map((evaluation) => ({
        evaluation_id: evaluation.evaluation_id,
        evaluation_fingerprint: evaluation.evaluation_fingerprint,
      }))
      .sort((left, right) => compareProtocolCodeUnitsV01(left.evaluation_id, right.evaluation_id)),
    memory_admission_refs: input.state.memoryAdmissions
      .filter((admission) => admission.episode_id.endsWith(`g${input.generation}`))
      .map((admission) => ({
        admission_id: admission.admission_id,
        candidate_id: admission.candidate_id,
        resulting_memory_snapshot_id:
          admission.resulting_memory_snapshot.memory_snapshot_id,
        resulting_memory_snapshot_fingerprint:
          admission.resulting_memory_snapshot.memory_snapshot_fingerprint,
      }))
      .sort((left, right) => compareProtocolCodeUnitsV01(left.admission_id, right.admission_id)),
    transition_ref: transition
      ? {
          transition_id: transition.transition_id,
          transition_fingerprint: transition.integrity.fingerprint,
        }
      : null,
    terminal_ref: input.state.terminal
      ? {
          terminal_id: input.state.terminal.terminal_id,
          terminal_fingerprint: input.state.terminal.integrity.fingerprint,
        }
      : null,
    holdout_content_included: false as const,
    journal_prefix_length: input.journalPrefixLength,
  };
  return sealV01(withoutIntegrity);
}

function validateBindingAgainstPlanEntryV01(
  binding: GovernedActorLabLiveInvocationBindingV01,
  planned: GovernedActorLabLiveCallPlanEntryV01,
  route?: GovernedActorLabLiveRouteV01,
): void {
  assertSealedV01(binding);
  const receipt = binding.model_invocation_receipt;
  const recomputedOutputFingerprint = binding.normalized_output === null
    ? null
    : createProtocolSha256V01(
        canonicalizeProtocolValueV01(binding.normalized_output),
      );
  if (
    binding.call_slot_id !== planned.call_slot_id ||
    binding.call_order !== planned.call_order ||
    binding.arm !== planned.arm ||
    binding.phase !== planned.phase ||
    binding.generation !== planned.generation ||
    binding.episode_or_holdout_index !== planned.episode_or_holdout_index ||
    binding.actor_slot !== planned.actor_slot ||
    binding.peer_slot !== planned.peer_slot ||
    binding.case_id !== planned.case_id ||
    binding.case_fingerprint !== planned.case_fingerprint ||
    binding.budget.max_input_bytes !== planned.max_input_bytes ||
    binding.budget.max_output_tokens !== planned.max_output_tokens ||
    binding.budget.timeout_ms !== planned.timeout_ms ||
    binding.budget.max_provider_calls !== 1 ||
    binding.normalized_output_fingerprint !== recomputedOutputFingerprint ||
    (receipt === null &&
      (binding.model_invocation_receipt_fingerprint !== null ||
        binding.usage !== null ||
        binding.latency_ms !== null)) ||
    (receipt !== null &&
      (binding.model_invocation_receipt_fingerprint !== receiptFingerprintV01(receipt) ||
        canonicalizeProtocolValueV01(binding.usage) !==
          canonicalizeProtocolValueV01(receipt.usage) ||
        binding.latency_ms !== receipt.latency_ms))
  ) {
    failV01("governed_actor_lab_live_plan_binding_mismatch");
  }
  if (
    route &&
    (canonicalizeProtocolValueV01(binding.provider_ref) !==
      canonicalizeProtocolValueV01(route.provider_ref) ||
      canonicalizeProtocolValueV01(binding.model_ref) !==
        canonicalizeProtocolValueV01(route.model_ref))
  ) {
    failV01("governed_actor_lab_live_route_binding_invalid");
  }
  if (receipt) {
    validateModelInvocationReceiptV02(receipt);
    if (
      receipt.invocation_id !== binding.call_slot_id ||
      receipt.purpose !== GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01 ||
      (receipt.normalized_output_fingerprint ?? null) !==
        recomputedOutputFingerprint ||
      (route &&
        binding.invocation_status !== "route_changed" &&
        (receipt.final_implementation_id !== route.adapter_implementation_id ||
          receipt.final_implementation_version !== route.adapter_implementation_version ||
          (receipt.egress_attempted &&
            (canonicalizeProtocolValueV01(receipt.attempted_provider_ref) !==
              canonicalizeProtocolValueV01(route.provider_ref) ||
              canonicalizeProtocolValueV01(receipt.attempted_model_ref) !==
                canonicalizeProtocolValueV01(route.model_ref) ||
              receipt.attempted_implementation_id !== route.adapter_implementation_id ||
              receipt.attempted_implementation_version !==
                route.adapter_implementation_version))))
    ) {
      failV01("governed_actor_lab_live_receipt_lineage_invalid");
    }
  }
  if (
    (binding.provider_attempt_status === "receipt_attempted" &&
      (!receipt || !receipt.egress_attempted)) ||
    (binding.provider_attempt_status === "receipt_not_attempted" &&
      (!receipt || receipt.egress_attempted)) ||
    (binding.provider_attempt_status === "known_not_attempted_local" && receipt !== null) ||
    (binding.provider_attempt_status === "unknown_receipt_unavailable" && receipt !== null)
  ) {
    failV01("governed_actor_lab_live_attempt_semantics_invalid");
  }
  const expectedFailureCode = binding.invocation_status === "provider_rejected"
    ? "model_gateway_provider_rejected"
    : binding.invocation_status === "malformed_response" ||
        binding.invocation_status === "source_token_invalid"
      ? "model_gateway_provider_response_invalid"
      : binding.invocation_status === "timed_out"
        ? "model_gateway_timeout"
        : binding.invocation_status === "cancelled"
          ? "model_gateway_cancelled"
          : binding.invocation_status === "transport_failed"
            ? "model_gateway_transport_failed"
            : null;
  const receiptForbidden = new Set<GovernedActorLabLiveInvocationStatusV01>([
    "dependency_missing",
    "not_attempted_arm_terminal",
    "cohort_internal_error_receipt_unavailable",
  ]).has(binding.invocation_status);
  if (
    (binding.invocation_status === "completed_live" &&
      (!receipt ||
        !receipt.egress_attempted ||
        receipt.status !== "completed" ||
        receipt.outcome !== "live_success" ||
        receipt.failure_code !== null ||
        binding.normalized_output === null)) ||
    (binding.invocation_status !== "completed_live" &&
      binding.normalized_output !== null) ||
    (expectedFailureCode !== null &&
      (!receipt || receipt.failure_code !== expectedFailureCode)) ||
    (receiptForbidden && receipt !== null)
  ) {
    failV01("governed_actor_lab_live_invocation_status_invalid");
  }
  if (
    new Set(binding.presented_memory_tokens).size !== binding.presented_memory_tokens.length ||
    new Set(binding.presented_curated_tokens).size !== binding.presented_curated_tokens.length ||
    binding.normalized_output?.referenced_memory_tokens.some(
      (token) => !binding.presented_memory_tokens.includes(token),
    ) ||
    binding.normalized_output?.referenced_curated_tokens.some(
      (token) => !binding.presented_curated_tokens.includes(token),
    )
  ) {
    failV01("governed_actor_lab_live_material_reference_invalid");
  }
  if (
    binding.invocation_status === "transport_failed" &&
    (!receipt || receipt.failure_code !== "model_gateway_transport_failed")
  ) {
    failV01("governed_actor_lab_live_transport_receipt_required");
  }
  if (binding.invocation_status === "not_attempted_arm_terminal") {
    if (
      binding.lab_actor_id !== null ||
      binding.frozen_actor_ref !== null ||
      binding.frozen_private_memory_ref !== null ||
      binding.last_terminal_state_ref === null ||
      binding.arm_terminal_ref === null ||
      binding.no_egress_disposition?.code !== "not_attempted_arm_terminal" ||
      binding.no_egress_disposition.arm_terminal_ref !== binding.arm_terminal_ref ||
      binding.no_egress_disposition.arm_terminal_reason !== "no_valid_population"
    ) {
      failV01("governed_actor_lab_live_arm_terminal_binding_invalid");
    }
  } else if (!binding.frozen_actor_ref || !binding.lab_actor_id) {
    failV01("governed_actor_lab_live_actor_binding_invalid");
  }
}

export function validateGovernedActorLabLiveInvocationBindingV01(
  binding: GovernedActorLabLiveInvocationBindingV01,
  planned: GovernedActorLabLiveCallPlanEntryV01,
  route: GovernedActorLabLiveRouteV01,
): GovernedActorLabLiveInvocationBindingV01 {
  validateBindingAgainstPlanEntryV01(binding, planned, route);
  scanForbiddenPersistedMaterialV01(binding);
  return structuredClone(binding);
}

export function validateGovernedActorLabLiveCheckpointV01(
  checkpoint: GovernedActorLabLiveCheckpointV01,
  maximumJournalPrefix: number,
): GovernedActorLabLiveCheckpointV01 {
  assertSealedV01(checkpoint);
  validateCheckpointPrefixV01([checkpoint], maximumJournalPrefix);
  scanForbiddenPersistedMaterialV01(checkpoint);
  return structuredClone(checkpoint);
}

export function evaluateGovernedActorLabLiveOutputV01(input: {
  arm: GovernedActorLabBaselineArmV01;
  generation: 0 | 1 | 2 | "holdout";
  slot: string;
  liveCase: GovernedActorLabLiveCaseV01;
  binding: GovernedActorLabLiveInvocationBindingV01;
  peerArtifact: GovernedActorLabLivePeerArtifactV01 | null;
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
    const checks = evaluator.required_checks.map((rule) => ({
      ...structuredClone(rule),
      result: "unknown" as const,
      basis: "provider_output_unavailable" as const,
    }));
    const evaluationWithoutFingerprint = {
      evaluation_id: evaluationId,
      arm: input.arm,
      generation: input.generation,
      actor_slot: input.slot,
      case_id: input.liveCase.actor_visible.case_id,
      status: "unknown" as const,
      checks,
      evaluation_failure_codes: [],
      hard_gate_failure: null,
      hard_gate_failure_codes: [],
      required_checks_passed: null,
      required_checks_total: checks.length,
      source_reference_coverage: null,
      support_validation_coverage: null,
      supported_claims: null,
      unsupported_claims: null,
      abstention_observed: null,
      harmful_transfer_candidate: null,
      missingness: [input.binding.invocation_status],
      evaluator_model_calls: 0 as const,
    };
    return {
      ...evaluationWithoutFingerprint,
      evaluation_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(evaluationWithoutFingerprint),
      ),
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
  const resultToken = input.binding.phase === "challenge_synthesis"
    ? output.synthesis_token
    : output.result_token;
  const peerClaimTokens = input.peerArtifact?.claim_candidates.map(
    (claim) => claim.claim_token,
  ) ?? [];
  const checks = evaluator.required_checks.map((rule) => {
    let passed: boolean;
    let basis: "deterministic_predicate" | "no_addressable_peer_claim" =
      "deterministic_predicate";
    if (rule.predicate === "expected_result_matches") {
      passed = resultToken === evaluator.expected_result_token;
    } else if (rule.predicate === "all_required_support_relations_present") {
      passed = relationPasses.every(Boolean);
    } else if (rule.predicate === "no_forbidden_claim_present") {
      passed = forbidden.length === 0;
    } else if (rule.predicate === "abstention_matches") {
      passed = output.abstention === evaluator.abstention_required;
    } else {
      if (peerClaimTokens.length === 0) {
        passed = true;
        basis = "no_addressable_peer_claim";
      } else {
        passed = output.challenge_response.peer_claim_tokens_considered.some(
          (token) => peerClaimTokens.includes(token),
        );
      }
    }
    return {
      ...structuredClone(rule),
      result: passed ? "pass" as const : "fail" as const,
      basis,
    };
  });
  const failedChecks = checks.filter((check) => check.result === "fail");
  const hardGateFailures = failedChecks.filter(
    (check) => check.severity === "selection_disqualifying_hard_gate",
  );
  const supportedClaims = relationPasses.filter(Boolean).length;
  const claimsWithSources = output.claim_candidates.filter((claim) => claim.source_tokens.length > 0).length;
  const evaluationWithoutFingerprint = {
    evaluation_id: evaluationId,
    arm: input.arm,
    generation: input.generation,
    actor_slot: input.slot,
    case_id: input.liveCase.actor_visible.case_id,
    status: failedChecks.length === 0 ? "pass" as const : "fail" as const,
    checks,
    evaluation_failure_codes: failedChecks
      .map((check) => check.check_code)
      .sort(compareProtocolCodeUnitsV01),
    hard_gate_failure: hardGateFailures.length > 0,
    hard_gate_failure_codes: hardGateFailures
      .map((check) => check.check_code)
      .sort(compareProtocolCodeUnitsV01),
    required_checks_passed: checks.filter((check) => check.result === "pass").length,
    required_checks_total: checks.length,
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

async function registerBindingV01(
  state: ArmRuntimeStateV01,
  all: GovernedActorLabLiveInvocationBindingV01[],
  used: Set<string>,
  planned: GovernedActorLabLiveCallPlanEntryV01,
  binding: GovernedActorLabLiveInvocationBindingV01,
  onBindingFinalized?: (
    binding: GovernedActorLabLiveInvocationBindingV01,
  ) => void | Promise<void>,
): Promise<void> {
  if (used.has(planned.call_slot_id) || binding.call_slot_id !== planned.call_slot_id) {
    failV01("governed_actor_lab_live_call_replay_refused");
  }
  if (planned.call_order !== all.length) {
    failV01("governed_actor_lab_live_journal_order_invalid");
  }
  validateBindingAgainstPlanEntryV01(binding, planned);
  await onBindingFinalized?.(structuredClone(binding));
  used.add(planned.call_slot_id);
  all.push(binding);
  state.invocationBindingRefs.push(binding.integrity.fingerprint);
}

function buildArmResultV01(
  state: ArmRuntimeStateV01,
): GovernedActorLabLiveArmResultV01 {
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
  const armGateCodes: GovernedActorLabLiveArmResultV01["arm_level_hard_gate"]["codes"] = [];
  if (state.terminal) armGateCodes.push("no_valid_population");
  if (missingness.includes("route_changed")) armGateCodes.push("route_model_inconsistency");
  if (missingness.includes("cohort_internal_error_receipt_unavailable")) {
    armGateCodes.push("cohort_internal_error");
  }
  if (holdout.length !== 4 || holdout.some((evaluation) => evaluation.status === "unknown")) {
    armGateCodes.push("required_arm_evaluation_incomplete");
  }
  if (holdout.some((evaluation) => evaluation.hard_gate_failure === true)) {
    armGateCodes.push("required_arm_evaluation_incomplete");
  }
  for (const generation of [0, 1, 2] as const) {
    const generationEvaluations = state.evaluations.filter(
      (evaluation) => evaluation.generation === generation,
    );
    if (
      generationEvaluations.length > 0 &&
      generationEvaluations.every(
        (evaluation) =>
          evaluation.status === "unknown" || evaluation.hard_gate_failure === true,
      )
    ) {
      armGateCodes.push("insufficient_required_observations");
    }
  }
  const canonicalArmGateCodes = uniqueStringsV01(armGateCodes) as typeof armGateCodes;
  const comparable = canonicalArmGateCodes.length === 0 && missingness.length === 0;
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
    terminal: structuredClone(state.terminal),
    actor_evaluation_failures: state.evaluations.filter(
      (evaluation) => evaluation.status === "fail",
    ).length,
    actor_selection_hard_gate_exclusions:
      state.populationTransitions.reduce(
        (sum, transition) => sum + transition.hard_gate_excluded_actor_ids.length,
        0,
      ) + (state.terminal?.actor_hard_gate_exclusions.length ?? 0),
    actor_unknowns: state.evaluations.filter(
      (evaluation) => evaluation.status === "unknown",
    ).length,
    arm_completion_status: state.terminal
      ? "terminal"
      : state.invocationBindingRefs.length === 28 && holdout.length === 4
        ? "complete"
        : "incomplete",
    arm_level_hard_gate: {
      failed: canonicalArmGateCodes.length > 0,
      codes: canonicalArmGateCodes,
    },
    holdout: {
      passed: holdout.filter((evaluation) => evaluation.status === "pass").length,
      failed: holdout.filter((evaluation) => evaluation.status === "fail").length,
      unknown: holdout.filter((evaluation) => evaluation.status === "unknown").length,
      state_frozen_before_materialization: true,
      memory_writes_after_holdout: 0,
      mutations_after_holdout: 0,
      materialized: state.holdoutMaterialized,
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
      actor_memory_eligible: state.memoryEligible,
      actor_memory_explicitly_referenced: state.memoryExplicitlyReferenced,
      actor_memory_actual_use: null,
      curated_material_presented: state.curatedPresented,
      curated_material_explicitly_referenced: state.curatedExplicitlyReferenced,
      curated_material_actual_use: null,
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
    comparison_eligible: comparable,
    non_comparable_reasons: comparable ? [] : uniqueStringsV01([
      ...missingness,
      ...(holdout.length !== 4 ? ["holdout_count_incomplete"] : []),
      ...canonicalArmGateCodes,
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
