import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  semanticReviewLoopMapperInputFixture,
  semanticReviewLoopProjectAFixture,
  semanticReviewLoopProjectBFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { mapCodexSemanticReviewToEpisodeDeltaProposalV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  createStateTransitionReceiptLineageRefV01,
  evaluateReviewDecisionStateTransitionEligibilityV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  type ReviewDecisionBuilderInputV01,
} from "@/lib/vnext/review-decision";
import {
  buildStateTransitionReceiptV01,
  createStateTransitionApplicationResultFingerprintV01,
} from "@/lib/vnext/state-transition-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type {
  StateTransitionCurrentStateObservationV01,
  StateTransitionEligibilityResultV01,
  StateTransitionReceiptBuilderInputV01,
  StateTransitionReceiptOperationV01,
  StateTransitionReceiptV01,
  StateTransitionSemanticCommitGateEvaluationV01,
} from "@/types/vnext/state-transition-receipt";
import type {
  TaskContextPacketExcludedEntryV01,
  TaskContextPacketSelectedEntryV01,
  TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";

export const SEMANTIC_TRANSITION_DECIDED_AT =
  "2026-07-10T13:15:00.000Z";
export const SEMANTIC_TRANSITION_CURRENT_STATE_OBSERVED_AT =
  "2026-07-10T13:16:00.000Z";
export const SEMANTIC_TRANSITION_GATE_EVALUATED_AT =
  "2026-07-10T13:17:00.000Z";
export const SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT =
  "2026-07-10T13:18:00.000Z";
export const SEMANTIC_TRANSITION_APPLIED_AT =
  "2026-07-10T13:19:00.000Z";
export const SEMANTIC_TRANSITION_RECORDED_AT =
  "2026-07-10T13:20:00.000Z";
export const SEMANTIC_TRANSITION_LATER_PACKET_GENERATED_AT =
  "2026-07-10T13:21:00.000Z";
export const SEMANTIC_TRANSITION_GATE_EXPIRES_AT =
  "2026-07-10T14:00:00.000Z";

export interface SemanticTransitionLoopFixtureV01 {
  project: SemanticReviewLoopProjectFixtureV01;
  prior_packet: TaskContextPacketV01;
  run_receipt: RunReceiptV01;
  preview_id: string;
  preview_fingerprint: string;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  current_state_observations: StateTransitionCurrentStateObservationV01[];
  semantic_commit_gate_evaluation: StateTransitionSemanticCommitGateEvaluationV01;
  eligibility: StateTransitionEligibilityResultV01;
  transition_receipt: StateTransitionReceiptV01;
  later_packet: TaskContextPacketV01;
  m3a_chain_fingerprint: string;
  m3b_chain_fingerprint: string;
}

export {
  semanticReviewLoopProjectAFixture as semanticTransitionLoopProjectAFixture,
  semanticReviewLoopProjectBFixture as semanticTransitionLoopProjectBFixture,
};

export function buildSemanticTransitionLoopFixtureV01(
  project: SemanticReviewLoopProjectFixtureV01,
): SemanticTransitionLoopFixtureV01 {
  const priorPacket = buildSemanticReviewLoopTaskContextPacketFixture(project);
  const mappingInput = semanticReviewLoopMapperInputFixture(
    project,
    priorPacket,
  );
  const mapping = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
    deepFreeze(clone(mappingInput)),
  );
  if (
    mapping.status !== "mapped" ||
    !mapping.receipt ||
    !mapping.proposal ||
    !mapping.preview_id ||
    !mapping.preview_fingerprint
  ) {
    throw new Error(
      `Synthetic semantic transition fixture mapping failed: ${JSON.stringify(mapping)}`,
    );
  }
  const proposal = mapping.proposal;
  const decision = buildReviewDecisionV01(
    deepFreeze(createSemanticTransitionDecisionInputV01(project, proposal)),
  );
  const currentStateObservations =
    createSemanticTransitionCurrentStateObservationsV01(project, decision);
  const gate = createSemanticTransitionGateEvaluationV01(
    project,
    decision,
    currentStateObservations,
  );
  const eligibilityInput = {
    proposal,
    decision,
    current_state_observations: currentStateObservations,
    semantic_commit_gate_evaluation: gate,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
  };
  const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01(
    deepFreeze(clone(eligibilityInput)),
  );
  if (eligibility.status !== "eligible") {
    throw new Error(
      `Synthetic semantic transition eligibility failed: ${JSON.stringify(eligibility)}`,
    );
  }
  const receipt = buildStateTransitionReceiptV01(
    deepFreeze(
      createSemanticTransitionReceiptInputV01(
        project,
        proposal,
        decision,
        gate,
        eligibility,
      ),
    ),
  );
  const laterPacket = buildLaterTaskContextPacketFromReceiptFixtureV01(
    priorPacket,
    receipt,
  );
  const m3aIdentity = {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    task_context_packet: {
      packet_id: priorPacket.packet_id,
      fingerprint: priorPacket.integrity.fingerprint,
    },
    source_record: {
      report_id: mappingInput.source_record.report_id,
      fingerprint: mappingInput.source_record.report_fingerprint,
    },
    run_receipt: {
      receipt_id: mapping.receipt.receipt_id,
      fingerprint: mapping.receipt.integrity.fingerprint,
    },
    expected_observed_delta_preview: {
      preview_id: mapping.preview_id,
      fingerprint: mapping.preview_fingerprint,
    },
    episode_delta_proposal: {
      proposal_id: proposal.proposal_id,
      fingerprint: proposal.integrity.fingerprint,
    },
    review_decision: {
      decision_id: decision.decision_id,
      fingerprint: decision.integrity.fingerprint,
    },
  };
  const m3bIdentity = {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    prior_task_context_packet: m3aIdentity.task_context_packet,
    run_receipt: m3aIdentity.run_receipt,
    episode_delta_proposal: m3aIdentity.episode_delta_proposal,
    review_decision: m3aIdentity.review_decision,
    eligibility_precondition_fingerprint:
      eligibility.precondition_fingerprint,
    state_transition_receipt: {
      transition_receipt_id: receipt.transition_receipt_id,
      idempotency_key: receipt.idempotency_key,
      fingerprint: receipt.integrity.fingerprint,
    },
    later_task_context_packet: {
      packet_id: laterPacket.packet_id,
      fingerprint: laterPacket.integrity.fingerprint,
    },
  };
  return {
    project,
    prior_packet: priorPacket,
    run_receipt: mapping.receipt,
    preview_id: mapping.preview_id,
    preview_fingerprint: mapping.preview_fingerprint,
    proposal,
    decision,
    current_state_observations: currentStateObservations,
    semantic_commit_gate_evaluation: gate,
    eligibility,
    transition_receipt: receipt,
    later_packet: laterPacket,
    m3a_chain_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(m3aIdentity),
    ),
    m3b_chain_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(m3bIdentity),
    ),
  };
}

export function createSemanticTransitionDecisionInputV01(
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
): ReviewDecisionBuilderInputV01 {
  const candidate = proposal.proposed_deltas[0]!;
  const receiptRef = proposal.run_receipt_refs[0]!;
  return {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
    },
    decision: "accept",
    actor_ref: ref(
      "operator_actor",
      `synthetic-operator:${project.fixture_id}`,
      "user_declaration",
      SEMANTIC_TRANSITION_DECIDED_AT,
      undefined,
      "augnes.semantic-review-loop.conformance.v0.1",
    ),
    authorization_basis_refs: [
      ref(
        "authorization_basis",
        `synthetic-authorization:${project.fixture_id}:a`,
        "user_declaration",
        SEMANTIC_TRANSITION_DECIDED_AT,
        undefined,
        "augnes.semantic-review-loop.conformance.v0.1",
      ),
      ref(
        "authorization_basis",
        `synthetic-authorization:${project.fixture_id}:b`,
        "user_declaration",
        SEMANTIC_TRANSITION_DECIDED_AT,
        undefined,
        "augnes.semantic-review-loop.conformance.v0.1",
      ),
    ],
    decision_basis_material_ids: [...candidate.basis_material_ids],
    decision_basis_refs: [receiptRef],
    rationale_summary:
      "Synthetic conformance acceptance binds one proposal candidate without representing a real user decision or applying state.",
    decided_at: SEMANTIC_TRANSITION_DECIDED_AT,
    revisit: null,
    requested_transition_intent: {
      intent_id: `transition-intent:${project.fixture_id}`,
      transition_kind: "semantic_candidate_apply",
      bounded_summary:
        "Request a future separately authorized semantic transition while keeping this chain non-durable.",
      target_refs: [...candidate.target_refs],
      intent_only: true,
      applied: false,
      state_transition_receipt_ref: null,
    },
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
    compatibility: {
      source_contracts: [proposal.proposal_version],
      unmapped_fields: [],
      warnings: [
        "Synthetic conformance decision is not a real operator authorization.",
        "No StateTransitionReceipt or later TaskContextPacket is generated.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "Full-chain conformance is protocol isolation, not observed use.",
    ],
  };
}

export function createSemanticTransitionCurrentStateObservationsV01(
  project: SemanticReviewLoopProjectFixtureV01,
  decision: ReviewDecisionV01,
  presence: "absent" | "present" = "absent",
): StateTransitionCurrentStateObservationV01[] {
  const intent = decision.requested_transition_intent;
  if (!intent) throw new Error("Transition fixture decision requires intent.");
  return intent.target_refs.map((target, index) => {
    const observationFingerprint = fingerprint(
      `current-state-observation|${project.project_id}|${index}|${presence}`,
    );
    const observationRef = ref(
      "semantic_state_observation",
      `current-state-observation:${project.project_id}:${index}:${presence}`,
      "direct_local_observation",
      SEMANTIC_TRANSITION_CURRENT_STATE_OBSERVED_AT,
      observationFingerprint,
    );
    const stateFingerprint = fingerprint(
      `before-state|${project.project_id}|${index}`,
    );
    return {
      target_ref: clone(target),
      presence,
      state_ref:
        presence === "present"
          ? ref(
              "accepted_semantic_state",
              `semantic-state:${project.project_id}:${index}:before`,
              "derived_interpretation",
              SEMANTIC_TRANSITION_CURRENT_STATE_OBSERVED_AT,
              stateFingerprint,
            )
          : null,
      state_fingerprint: presence === "present" ? stateFingerprint : null,
      observed_at: SEMANTIC_TRANSITION_CURRENT_STATE_OBSERVED_AT,
      observation_ref: observationRef,
      source_refs: [observationRef],
    };
  });
}

export function createSemanticTransitionGateEvaluationV01(
  project: SemanticReviewLoopProjectFixtureV01,
  decision: ReviewDecisionV01,
  currentStateObservations: StateTransitionCurrentStateObservationV01[],
  stateRefMode: "exact_identity" | "writer_allocated" = "exact_identity",
): StateTransitionSemanticCommitGateEvaluationV01 {
  const intent = decision.requested_transition_intent;
  if (!intent) throw new Error("Transition fixture decision requires intent.");
  const gateFingerprint = fingerprint(
    `semantic-commit-gate|${project.project_id}|${decision.decision_id}`,
  );
  const evaluationRef = ref(
    "semantic_commit_gate_evaluation",
    `gate-evaluation:${project.project_id}:authorized`,
    "direct_local_observation",
    SEMANTIC_TRANSITION_GATE_EVALUATED_AT,
    gateFingerprint,
  );
  const gateActorRef = ref(
    "semantic_commit_gate_actor",
    `gate-actor:${project.project_id}`,
    "direct_local_observation",
    SEMANTIC_TRANSITION_GATE_EVALUATED_AT,
    gateFingerprint,
  );
  const authorizedApplierRef = ref(
    "semantic_transition_actor",
    `transition-actor:${project.project_id}`,
    "user_declaration",
  );
  const observationByTarget = new Map(
    currentStateObservations.map((observation) => [
      canonicalizeProtocolValueV01(observation.target_ref),
      observation,
    ]),
  );
  const authorizedEffects = intent.target_refs.map((target, index) => {
    const observation = observationByTarget.get(
      canonicalizeProtocolValueV01(target),
    );
    if (!observation) {
      throw new Error("Gate fixture requires one current-state observation per target.");
    }
    const operation: StateTransitionReceiptOperationV01 =
      decision.decision === "retract"
        ? "retract"
        : decision.decision === "supersede"
          ? "supersede"
          : observation.presence === "absent"
            ? "create"
            : "replace";
    const afterStateFingerprint = fingerprint(
      `after-state|${project.project_id}|${index}|${operation}`,
    );
    return {
      target_ref: clone(target),
      operation,
      expected_after_state:
        operation === "retract"
          ? ({
              presence: "absent",
              state_fingerprint: null,
              state_ref_rule: null,
            } as const)
          : ({
              presence: "present",
              state_fingerprint: afterStateFingerprint,
              state_ref_rule:
                stateRefMode === "writer_allocated"
                  ? ({
                      mode: "writer_allocated",
                      ref_type: "accepted_semantic_state",
                      compatibility_namespace:
                        "augnes.semantic-transition-loop.conformance.v0.1",
                      trust_class: "direct_local_observation",
                    } as const)
                  : ({
                      mode: "exact_identity",
                      state_ref: ref(
                        "accepted_semantic_state",
                        `semantic-state:${project.project_id}:${index}:after`,
                        "derived_interpretation",
                      ),
                    } as const),
            } as const),
    };
  });
  return {
    status: "authorized",
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    intent_id: intent.intent_id,
    transition_kind: intent.transition_kind,
    target_refs: clone(intent.target_refs),
    decision_actor_ref: clone(decision.actor_ref),
    authorization_basis_refs: clone(decision.authorization_basis_refs),
    gate_actor_ref: gateActorRef,
    authorized_applier_ref: authorizedApplierRef,
    authorized_effects: authorizedEffects,
    evaluation_ref: evaluationRef,
    evaluated_at: SEMANTIC_TRANSITION_GATE_EVALUATED_AT,
    expires_at: SEMANTIC_TRANSITION_GATE_EXPIRES_AT,
    source_refs: [authorizedApplierRef, gateActorRef, evaluationRef],
  };
}

export function createSemanticTransitionReceiptInputV01(
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  gate: StateTransitionSemanticCommitGateEvaluationV01,
  eligibility: StateTransitionEligibilityResultV01,
): StateTransitionReceiptBuilderInputV01 {
  const intent = decision.requested_transition_intent;
  if (!intent || eligibility.status !== "eligible") {
    throw new Error("Receipt fixture requires eligible transition intent.");
  }
  const proposalRef = ref(
    "episode_delta_proposal",
    proposal.proposal_id,
    "derived_interpretation",
    proposal.created_at,
    proposal.integrity.fingerprint,
  );
  const decisionRef = ref(
    "review_decision",
    decision.decision_id,
    "user_declaration",
    decision.decided_at,
    decision.integrity.fingerprint,
  );
  const effects = eligibility.expected_effects.map((expected, index) => {
    const expectedAfterState = expected.expected_after_state;
    const afterState =
      expectedAfterState.presence === "absent"
        ? ({
            presence: "absent",
            state_ref: null,
            state_fingerprint: null,
          } as const)
        : ({
            presence: "present",
            state_ref:
              expectedAfterState.state_ref_rule.mode === "exact_identity"
                ? ({
                    ...clone(
                      expectedAfterState.state_ref_rule.state_ref,
                    ),
                    observed_at: SEMANTIC_TRANSITION_APPLIED_AT,
                    source_ref: expectedAfterState.state_fingerprint,
                  } as ExternalRefV01)
                : ref(
                    expectedAfterState.state_ref_rule.ref_type,
                    `allocated-state:${project.project_id}:${index}:after`,
                    expectedAfterState.state_ref_rule.trust_class,
                    SEMANTIC_TRANSITION_APPLIED_AT,
                    expectedAfterState.state_fingerprint,
                    expectedAfterState.state_ref_rule.compatibility_namespace,
                  ),
            state_fingerprint: expectedAfterState.state_fingerprint,
          } as const);
    const applicationResultFingerprint =
      createStateTransitionApplicationResultFingerprintV01(
        {
          target_ref: expected.target_ref,
          operation: expected.operation,
          before_state: expected.before_state,
          after_state: afterState,
        },
        SEMANTIC_TRANSITION_APPLIED_AT,
      );
    const afterObservationRef = ref(
      "semantic_state_application_observation",
      `application-observation:${project.project_id}:${index}`,
      "direct_local_observation",
      SEMANTIC_TRANSITION_APPLIED_AT,
      applicationResultFingerprint,
    );
    const durableRecordRef = ref(
      "durable_semantic_state_record",
      `durable-record:${project.project_id}:${index}`,
      "direct_local_observation",
      SEMANTIC_TRANSITION_RECORDED_AT,
      applicationResultFingerprint,
    );
    return {
      target_ref: clone(expected.target_ref),
      operation: expected.operation,
      before_state: clone(expected.before_state),
      after_state: afterState,
      before_state_observation_ref: clone(
        expected.before_state_observation_ref,
      ),
      after_application_observation_ref: afterObservationRef,
      durable_record_ref: durableRecordRef,
      source_refs: [
        proposalRef,
        decisionRef,
        clone(expected.before_state_observation_ref),
        afterObservationRef,
        durableRecordRef,
      ],
    };
  });
  const appliedByRef = clone(gate.authorized_applier_ref);
  return {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    source_decision: {
      decision_version: decision.decision_version,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
    },
    source_candidate: clone(decision.candidate),
    requested_transition_intent: {
      intent_id: intent.intent_id,
      transition_kind: intent.transition_kind,
      target_refs: clone(intent.target_refs),
    },
    effects,
    applied_at: SEMANTIC_TRANSITION_APPLIED_AT,
    recorded_at: SEMANTIC_TRANSITION_RECORDED_AT,
    applied_by_ref: appliedByRef,
    semantic_commit_gate: {
      status: "authorized",
      evaluation_ref: clone(gate.evaluation_ref),
      evaluated_at: gate.evaluated_at,
      expires_at: gate.expires_at,
    },
    eligibility_precondition_fingerprint:
      eligibility.precondition_fingerprint,
    source_refs: [
      proposalRef,
      decisionRef,
      appliedByRef,
      clone(gate.evaluation_ref),
      ...effects.flatMap((effect) => effect.source_refs),
    ],
    compatibility: {
      source_contracts: [
        proposal.proposal_version,
        decision.decision_version,
      ],
      unmapped_fields: [],
      warnings: [
        "Synthetic receipt and observation refs are conformance material, not proof of a real transition.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "Synthetic M3B fixture represents protocol relations only; no builder applies state.",
    ],
  };
}

export function buildLaterTaskContextPacketFromReceiptFixtureV01(
  priorPacket: TaskContextPacketV01,
  receipt: StateTransitionReceiptV01,
): TaskContextPacketV01 {
  const receiptRef = createStateTransitionReceiptLineageRefV01(receipt);
  const retiredBeforeSnapshots = new Set(
    receipt.effects.flatMap((effect) =>
      effect.before_state.presence === "present"
        ? [
            stateSnapshotKey(
              effect.before_state.state_ref,
              effect.before_state.state_fingerprint,
            ),
          ]
        : [],
    ),
  );
  const retainedSelected = priorPacket.selected_context.filter(
    (entry) => !retiredBeforeSnapshots.has(selectedEntrySnapshotKey(entry)),
  );
  const appliedSelections = receipt.effects.flatMap((effect, index) =>
    effect.after_state.presence === "present"
      ? [
          createAppliedStateSelectedEntryV01(
            effect.after_state.state_ref,
            effect.after_state.state_fingerprint,
            effect.after_application_observation_ref,
            receiptRef,
            index,
          ),
        ]
      : [],
  );
  const retractedExclusions = receipt.effects.flatMap((effect, index) =>
    effect.operation === "retract" &&
    effect.before_state.presence === "present"
      ? [
          createRetiredStateExcludedEntryV01(
            effect.before_state.state_ref,
            effect.before_state.state_fingerprint,
            receiptRef,
            index,
          ),
        ]
      : [],
  );
  const input: TaskContextPacketBuilderInputV01 = {
    workspace_id: priorPacket.workspace_id,
    project_id: priorPacket.project_id,
    work_ref: clone(priorPacket.work_ref),
    generated_at: SEMANTIC_TRANSITION_LATER_PACKET_GENERATED_AT,
    expires_at: priorPacket.expires_at,
    task: clone(priorPacket.task),
    current_projection: clone(priorPacket.current_projection),
    selected_context: [...clone(retainedSelected), ...appliedSelections],
    excluded_context: [
      ...clone(priorPacket.excluded_context),
      ...retractedExclusions,
    ],
    tensions: clone(priorPacket.tensions),
    risks: clone(priorPacket.risks),
    gaps: clone(priorPacket.gaps),
    constraints: {
      required_checks: clone(priorPacket.constraints.required_checks),
      forbidden_actions: clone(priorPacket.constraints.forbidden_actions),
      data_classification: priorPacket.constraints.data_classification,
      context_budget: clone(priorPacket.constraints.context_budget),
    },
    capability_grant: clone(priorPacket.capability_grant),
    return_contract: clone(priorPacket.return_contract),
    source_status: clone(priorPacket.source_status),
    compatibility: {
      ...clone(priorPacket.compatibility),
      source_contracts: [
        ...priorPacket.compatibility.source_contracts,
        receipt.transition_receipt_version,
      ],
      source_refs: [
        ...clone(priorPacket.compatibility.source_refs),
        receiptRef,
      ],
      warnings: [
        ...priorPacket.compatibility.warnings,
        "Synthetic later packet selection is explicit fixture input, not automatic context mutation.",
      ],
    },
    authority_notes: [
      "Synthetic later context records exact receipt lineage without granting transition authority.",
    ],
  };
  return buildTaskContextPacketV01(deepFreeze(input));
}

export function createAppliedStateSelectedEntryV01(
  stateRef: ExternalRefV01,
  stateFingerprint: string,
  applicationObservationRef: ExternalRefV01,
  receiptRef: ExternalRefV01,
  index: number,
): TaskContextPacketSelectedEntryV01 {
  return {
    entry_id: `accepted-state:${index}:${stateRef.external_id}`,
    entry_kind: "accepted_state_ref",
    source_ref: stateFingerprint,
    external_ref: clone(stateRef),
    why_included:
      "Explicit synthetic later packet selection binds an applied semantic state to its receipt.",
    currentness: {
      status: "fresh",
      as_of: applicationObservationRef.observed_at ?? null,
      basis: "Bound to the synthetic after-application observation.",
      source_ref: clone(applicationObservationRef),
    },
    trust_class: stateRef.trust_class,
    compatibility_source_ref: clone(receiptRef),
    bounded_summary:
      "Applied semantic state selected by explicit synthetic conformance input.",
  };
}

export function createRetiredStateExcludedEntryV01(
  stateRef: ExternalRefV01,
  stateFingerprint: string,
  receiptRef: ExternalRefV01,
  index: number,
): TaskContextPacketExcludedEntryV01 {
  return {
    entry_id: `retracted-state:${index}:${stateRef.external_id}`,
    source_ref: stateFingerprint,
    external_ref: clone(stateRef),
    why_excluded:
      "Retracted semantic state excluded by explicit synthetic conformance input.",
    currentness: {
      status: "fresh",
      as_of: receiptRef.observed_at ?? null,
      basis: "Bound to the synthetic StateTransitionReceipt lineage.",
      source_ref: clone(receiptRef),
    },
  };
}

function ref(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"],
  observedAt?: string,
  sourceRef?: string,
  compatibilityNamespace =
    "augnes.semantic-transition-loop.conformance.v0.1",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    ...(observedAt ? { observed_at: observedAt } : {}),
    ...(sourceRef ? { source_ref: sourceRef } : {}),
    compatibility_namespace: compatibilityNamespace,
  };
}

function fingerprint(value: string): string {
  return createProtocolSha256V01(value);
}

function stateSnapshotKey(
  stateRef: ExternalRefV01,
  stateFingerprint: string,
): string {
  return `${canonicalizeProtocolValueV01(stateRef)}|${stateFingerprint}`;
}

function selectedEntrySnapshotKey(
  entry: TaskContextPacketSelectedEntryV01,
): string {
  return entry.external_ref && entry.source_ref
    ? stateSnapshotKey(entry.external_ref, entry.source_ref)
    : "";
}

function requireFingerprint(
  value: string | null | undefined,
  message: string,
): string {
  if (!value) throw new Error(message);
  return value;
}

function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}
