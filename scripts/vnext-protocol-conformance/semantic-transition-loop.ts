import assert from "node:assert/strict";

import {
  SEMANTIC_TRANSITION_CURRENT_STATE_OBSERVED_AT,
  SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
  buildLaterTaskContextPacketFromReceiptFixtureV01,
  buildSemanticTransitionLoopFixtureV01,
  createSemanticTransitionCurrentStateObservationsV01,
  createSemanticTransitionDecisionInputV01,
  createSemanticTransitionGateEvaluationV01,
  createSemanticTransitionReceiptInputV01,
  semanticTransitionLoopProjectAFixture,
  semanticTransitionLoopProjectBFixture,
  type SemanticTransitionLoopFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  semanticReviewLoopMapperInputFixture,
  semanticReviewLoopTaskContextPacketRefFixture,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { mapCodexSemanticReviewToEpisodeDeltaProposalV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  createStateTransitionReceiptLineageRefV01,
  evaluateReviewDecisionStateTransitionEligibilityV01,
  validateStateTransitionReceiptAgainstEligibilityV01,
  validateTaskContextPacketTransitionRelationV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
  type ReviewDecisionBuilderInputV01,
} from "@/lib/vnext/review-decision";
import {
  buildStateTransitionReceiptV01,
  createStateTransitionReceiptFingerprintV01,
  createStateTransitionReceiptIdempotencyKeyV01,
  deriveStateTransitionEffectIdV01,
  deriveStateTransitionReceiptIdV01,
  validateStateTransitionReceiptV01,
} from "@/lib/vnext/state-transition-receipt";
import {
  buildTaskContextPacketV01,
  canonicalizeTaskContextValueV01,
  createTaskContextPacketFingerprintV01,
  deriveTaskContextPacketIdV01,
  validateTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type {
  StateTransitionCurrentStateObservationV01,
  StateTransitionEligibilityResultV01,
  StateTransitionReceiptBuilderInputV01,
  StateTransitionReceiptV01,
  StateTransitionSemanticCommitGateEvaluationV01,
} from "@/types/vnext/state-transition-receipt";
import type {
  TaskContextPacketSelectedEntryV01,
  TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";

const FIXED_M3A_PACKET_ID =
  "task-context-packet:48744fbc61de66cccc842ce";
const FIXED_M3A_PACKET_FINGERPRINT =
  "sha256:41c48fa7f65307aa7d5252d915a2d02bd598b5b598b15b572291659b48e4dde6";
const FIXED_M3A_RECEIPT_ID = "run-receipt:99832d13d879f2dfc11a5fd7";
const FIXED_M3A_RECEIPT_FINGERPRINT =
  "sha256:e88c7c064ddfc13dcd2745d7cf4b8141a3af573c9445679c1cc9e6b3ce0e13e0";
const FIXED_M3A_PROPOSAL_ID =
  "episode-delta-proposal:a3cd4fbef762c655f67ab1b4";
const FIXED_M3A_PROPOSAL_FINGERPRINT =
  "sha256:910f02d6c28c0e70930682e009fb4afd2c9851ee3584445b6fd81acb4d637376";
const FIXED_M3A_DECISION_ID = "review-decision:88872105d9b9f869cd2b2823";
const FIXED_M3A_DECISION_FINGERPRINT =
  "sha256:8c76c3934d524ff8c14b06c22e391b80e212e1c17cf99046cce995f32d6eec9b";
const FIXED_M3A_CHAIN_FINGERPRINT =
  "sha256:505b78c58fb48f19edccf724349d6a0bd5fdb2b437838530d75f9aee16d2c0cb";

const FIXED_LATER_PACKET_ID =
  "task-context-packet:65e07e2bbd243d741983687";
const FIXED_LATER_PACKET_FINGERPRINT =
  "sha256:8eef8b43e59371aba307b3ba4c0a4f44288ad7333557ca52fea3c2ea21c66365";
const FIXED_M3B_CHAIN_FINGERPRINT =
  "sha256:e900b502561e2de12e936b3e8f8079ed18bc68f396d7bb9486adbcbcd4533ed8";

interface TransitionScenarioV01 {
  run_receipt: RunReceiptV01;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  prior_packet: TaskContextPacketV01;
  current_state_observations: StateTransitionCurrentStateObservationV01[];
  semantic_commit_gate_evaluation: StateTransitionSemanticCommitGateEvaluationV01;
  eligibility: StateTransitionEligibilityResultV01;
  transition_receipt: StateTransitionReceiptV01;
  later_packet: TaskContextPacketV01;
}

interface NamedRelationCaseV01 {
  name: string;
  expected_code: string;
  run(): {
    status: string;
    errors: Array<{ code: string }>;
  };
}

export interface SemanticTransitionLoopConformanceSummaryV01 {
  suite: "semantic-transition-loop-v0.1";
  status: "passed";
  positive_fixture_count: number;
  receipt_relation_negative_fixture_count: number;
  later_packet_relation_negative_fixture_count: number;
  existing_m3a_anchor_count: 9;
  canonical_transition_receipt_id: string;
  canonical_transition_receipt_idempotency_key: string;
  canonical_transition_receipt_fingerprint: string;
  chain_eligibility_precondition_fingerprint: string;
  later_task_context_packet_id: string;
  later_task_context_packet_fingerprint: string;
  full_m3b_chain_fingerprint: string;
  accept_create_checked: true;
  accept_replace_checked: true;
  same_identity_replacement_snapshot_checked: true;
  supersede_checked: true;
  retract_checked: true;
  multi_target_atomic_apply_checked: true;
  exact_later_selected_and_excluded_state_checked: true;
  transition_receipt_lineage_checked: true;
  two_project_isolation_checked: true;
  repeated_execution_deterministic: true;
  unordered_collection_normalization_checked: true;
  builder_input_immutability_checked: true;
  existing_m3a_anchors_unchanged: true;
  no_automatic_next_context_mutation: true;
  fetch_calls: 0;
  database_calls: 0;
  provider_calls: 0;
  network_calls: 0;
  external_side_effects: 0;
}

export function runSemanticTransitionLoopConformanceV01(): SemanticTransitionLoopConformanceSummaryV01 {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("Semantic transition conformance must not call fetch.");
  }) as typeof fetch;
  try {
    const summary = runSemanticTransitionLoopConformanceInternalV01();
    assert.equal(fetchCalls, 0);
    return summary;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function runSemanticTransitionLoopConformanceInternalV01(): SemanticTransitionLoopConformanceSummaryV01 {
  const projectA = buildSemanticTransitionLoopFixtureV01(
    semanticTransitionLoopProjectAFixture,
  );
  const projectB = buildSemanticTransitionLoopFixtureV01(
    semanticTransitionLoopProjectBFixture,
  );

  assertExistingM3AAnchors(projectA);
  assertCanonicalFullChain(projectA);
  assertCanonicalFullChain(projectB);
  assert.notEqual(projectA.project.project_id, projectB.project.project_id);
  assert.equal(projectA.project.workspace_id, projectB.project.workspace_id);

  const repeatedProjectA = buildSemanticTransitionLoopFixtureV01(
    semanticTransitionLoopProjectAFixture,
  );
  assert.deepEqual(repeatedProjectA, projectA);

  const acceptReplace = buildIntegratedPresentScenario(projectA, "accept");
  assertScenarioOperation(acceptReplace, "replace");
  assertSameIdentityReplacementSnapshot(acceptReplace, projectA);

  const supersede = buildIntegratedPresentScenario(
    projectA,
    "supersede",
  );
  assertScenarioOperation(supersede, "supersede");

  const retract = buildIntegratedPresentScenario(projectA, "retract");
  assertScenarioOperation(retract, "retract");
  const retractedState = retract.current_state_observations[0];
  assert.equal(retractedState?.presence, "present");
  assert.ok(
    retract.later_packet.excluded_context.some(
      (entry) =>
        canonicalizeProtocolValueV01(entry.external_ref) ===
          canonicalizeProtocolValueV01(retractedState?.state_ref) &&
        entry.source_ref === retractedState?.state_fingerprint,
    ),
  );

  const multiTargetProposal = createMultiTargetProposal(projectA.proposal);
  const multiTargetDecision = buildReviewDecisionV01(
    createSemanticTransitionDecisionInputV01(
      projectA.project,
      multiTargetProposal,
    ),
  );
  const multiTarget = buildScenario(
    projectA,
    projectA.run_receipt,
    multiTargetProposal,
    multiTargetDecision,
    "absent",
  );
  assert.equal(multiTarget.eligibility.expected_effects.length, 2);
  assert.equal(multiTarget.transition_receipt.effects.length, 2);
  assert.ok(
    multiTarget.transition_receipt.effects.every(
      (effect) => effect.operation === "create",
    ),
  );
  assert.deepEqual(multiTarget.transition_receipt.atomicity, {
    mode: "all_or_nothing",
    all_effects_applied: true,
    partial_application: false,
  });

  assertUnorderedNormalizationAndImmutability(projectA, multiTarget);

  const receiptRelationCases = createReceiptRelationNegativeCases(projectA);
  for (const relationCase of receiptRelationCases) {
    assertBlockedCase(relationCase);
  }

  const laterPacketRelationCases = createLaterPacketRelationNegativeCases({
    projectA,
    projectB,
    acceptReplace,
    supersede,
    retract,
  });
  for (const relationCase of laterPacketRelationCases) {
    assertBlockedCase(relationCase);
  }

  return {
    suite: "semantic-transition-loop-v0.1",
    status: "passed",
    positive_fixture_count: 7,
    receipt_relation_negative_fixture_count: receiptRelationCases.length,
    later_packet_relation_negative_fixture_count:
      laterPacketRelationCases.length,
    existing_m3a_anchor_count: 9,
    canonical_transition_receipt_id:
      projectA.transition_receipt.transition_receipt_id,
    canonical_transition_receipt_idempotency_key:
      projectA.transition_receipt.idempotency_key,
    canonical_transition_receipt_fingerprint:
      projectA.transition_receipt.integrity.fingerprint,
    chain_eligibility_precondition_fingerprint:
      projectA.eligibility.precondition_fingerprint,
    later_task_context_packet_id: projectA.later_packet.packet_id,
    later_task_context_packet_fingerprint:
      projectA.later_packet.integrity.fingerprint,
    full_m3b_chain_fingerprint: projectA.m3b_chain_fingerprint,
    accept_create_checked: true,
    accept_replace_checked: true,
    same_identity_replacement_snapshot_checked: true,
    supersede_checked: true,
    retract_checked: true,
    multi_target_atomic_apply_checked: true,
    exact_later_selected_and_excluded_state_checked: true,
    transition_receipt_lineage_checked: true,
    two_project_isolation_checked: true,
    repeated_execution_deterministic: true,
    unordered_collection_normalization_checked: true,
    builder_input_immutability_checked: true,
    existing_m3a_anchors_unchanged: true,
    no_automatic_next_context_mutation: true,
    fetch_calls: 0,
    database_calls: 0,
    provider_calls: 0,
    network_calls: 0,
    external_side_effects: 0,
  };
}

function assertExistingM3AAnchors(chain: SemanticTransitionLoopFixtureV01) {
  assert.equal(chain.prior_packet.packet_id, FIXED_M3A_PACKET_ID);
  assert.equal(
    chain.prior_packet.integrity.fingerprint,
    FIXED_M3A_PACKET_FINGERPRINT,
  );
  assert.equal(chain.run_receipt.receipt_id, FIXED_M3A_RECEIPT_ID);
  assert.equal(
    chain.run_receipt.integrity.fingerprint,
    FIXED_M3A_RECEIPT_FINGERPRINT,
  );
  assert.equal(chain.proposal.proposal_id, FIXED_M3A_PROPOSAL_ID);
  assert.equal(
    chain.proposal.integrity.fingerprint,
    FIXED_M3A_PROPOSAL_FINGERPRINT,
  );
  assert.equal(chain.decision.decision_id, FIXED_M3A_DECISION_ID);
  assert.equal(
    chain.decision.integrity.fingerprint,
    FIXED_M3A_DECISION_FINGERPRINT,
  );
  assert.equal(chain.m3a_chain_fingerprint, FIXED_M3A_CHAIN_FINGERPRINT);
}

function assertCanonicalFullChain(chain: SemanticTransitionLoopFixtureV01) {
  assert.equal(
    validateEpisodeDeltaProposalV01(chain.proposal).status,
    "valid",
  );
  assert.equal(validateReviewDecisionV01(chain.decision).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      chain.decision,
      chain.proposal,
    ).status,
    "valid",
  );
  assert.equal(chain.eligibility.status, "eligible", format(chain.eligibility));
  const receiptRelation = validateStateTransitionReceiptAgainstEligibilityV01({
    proposal: chain.proposal,
    decision: chain.decision,
    current_state_observations: chain.current_state_observations,
    semantic_commit_gate_evaluation:
      chain.semantic_commit_gate_evaluation,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
    receipt: chain.transition_receipt,
  });
  assert.equal(receiptRelation.status, "valid", format(receiptRelation));
  const packetRelation = validateTaskContextPacketTransitionRelationV01(
    chain.prior_packet,
    chain.transition_receipt,
    chain.later_packet,
  );
  assert.equal(packetRelation.status, "valid", format(packetRelation));
  assert.equal(
    chain.later_packet.authority_summary.grants_semantic_commit_authority,
    false,
  );
  assert.equal(
    chain.transition_receipt.authority_summary
      .represents_applied_durable_semantic_transition,
    true,
  );
  assert.equal(chain.transition_receipt.authority_summary.builder_applies_state, false);
  assert.equal(chain.transition_receipt.authority_summary.validator_applies_state, false);
  assert.equal(
    chain.transition_receipt.authority_summary.grants_future_transition_authority,
    false,
  );
  assert.ok(
    chain.later_packet.compatibility.source_refs.some(
      (ref) =>
        canonicalizeProtocolValueV01(ref) ===
        canonicalizeProtocolValueV01(
          createStateTransitionReceiptLineageRefV01(
            chain.transition_receipt,
          ),
        ),
    ),
  );
  assert.equal(
    chain.later_packet.selected_context.filter(
      (entry) => entry.entry_kind === "accepted_state_ref",
    ).length,
    chain.transition_receipt.effects.filter(
      (effect) => effect.after_state.presence === "present",
    ).length,
  );
  if (chain.project.fixture_id === semanticTransitionLoopProjectAFixture.fixture_id) {
    assert.equal(chain.later_packet.packet_id, FIXED_LATER_PACKET_ID);
    assert.equal(
      chain.later_packet.integrity.fingerprint,
      FIXED_LATER_PACKET_FINGERPRINT,
    );
    assert.equal(chain.m3b_chain_fingerprint, FIXED_M3B_CHAIN_FINGERPRINT);
  }
}

function buildScenario(
  source: SemanticTransitionLoopFixtureV01,
  runReceipt: RunReceiptV01,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  presence: "absent" | "present",
): TransitionScenarioV01 {
  const decisionValidation = validateReviewDecisionV01(decision);
  assert.equal(decisionValidation.status, "valid", format(decisionValidation));
  const decisionRelation =
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal);
  assert.equal(decisionRelation.status, "valid", format(decisionRelation));
  const observations = createSemanticTransitionCurrentStateObservationsV01(
    source.project,
    decision,
    presence,
  );
  const gate = createSemanticTransitionGateEvaluationV01(
    source.project,
    decision,
  );
  const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01({
    proposal,
    decision,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
  });
  assert.equal(eligibility.status, "eligible", format(eligibility));
  const receiptInput = createSemanticTransitionReceiptInputV01(
    source.project,
    proposal,
    decision,
    gate,
    eligibility,
  );
  const receipt = buildStateTransitionReceiptV01(deepFreeze(receiptInput));
  const receiptRelation = validateStateTransitionReceiptAgainstEligibilityV01({
    proposal,
    decision,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
    receipt,
  });
  assert.equal(receiptRelation.status, "valid", format(receiptRelation));
  const priorPacket =
    presence === "present"
      ? addObservedBeforeStatesToPriorPacket(source.prior_packet, observations)
      : source.prior_packet;
  const laterPacket = buildLaterTaskContextPacketFromReceiptFixtureV01(
    priorPacket,
    receipt,
  );
  const packetRelation = validateTaskContextPacketTransitionRelationV01(
    priorPacket,
    receipt,
    laterPacket,
  );
  assert.equal(packetRelation.status, "valid", format(packetRelation));
  return {
    run_receipt: runReceipt,
    proposal,
    decision,
    prior_packet: priorPacket,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    eligibility,
    transition_receipt: receipt,
    later_packet: laterPacket,
  };
}

function buildIntegratedPresentScenario(
  source: SemanticTransitionLoopFixtureV01,
  mode: "accept" | "supersede" | "retract",
): TransitionScenarioV01 {
  const provisionalDecision = buildScenarioDecision(
    source.project,
    source.proposal,
    mode,
    source.decision,
  );
  const provisionalObservations =
    createSemanticTransitionCurrentStateObservationsV01(
      source.project,
      provisionalDecision,
      "present",
    );
  normalizePresentStateRefObservationTimes(
    provisionalObservations,
    source.prior_packet.generated_at,
  );
  const priorPacket = addObservedBeforeStatesToPriorPacket(
    source.prior_packet,
    provisionalObservations,
  );
  const mappingInput = semanticReviewLoopMapperInputFixture(
    source.project,
    priorPacket,
  );
  const mapping = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
    deepFreeze(clone(mappingInput)),
  );
  assert.equal(mapping.status, "mapped", JSON.stringify(mapping, null, 2));
  assert.ok(mapping.receipt);
  assert.ok(mapping.proposal);
  const proposal = mapping.proposal;
  const acceptedPriorDecision = buildReviewDecisionV01(
    createSemanticTransitionDecisionInputV01(source.project, proposal),
  );
  const decision = buildScenarioDecision(
    source.project,
    proposal,
    mode,
    acceptedPriorDecision,
  );
  const observations = createSemanticTransitionCurrentStateObservationsV01(
    source.project,
    decision,
    "present",
  );
  normalizePresentStateRefObservationTimes(
    observations,
    priorPacket.generated_at,
  );
  assert.deepEqual(
    observations.map((item) => item.state_ref),
    provisionalObservations.map((item) => item.state_ref),
  );
  const scenario = buildScenarioFromMaterial(
    source,
    mapping.receipt,
    proposal,
    decision,
    observations,
    priorPacket,
  );
  assertMappedPacketBindings(scenario);
  return scenario;
}

function buildScenarioDecision(
  project: SemanticTransitionLoopFixtureV01["project"],
  proposal: EpisodeDeltaProposalV01,
  mode: "accept" | "supersede" | "retract",
  priorAcceptedDecision: ReviewDecisionV01,
): ReviewDecisionV01 {
  if (mode === "accept") {
    return buildReviewDecisionV01(
      createSemanticTransitionDecisionInputV01(project, proposal),
    );
  }
  if (mode === "supersede") {
    return buildReviewDecisionV01(
      createSupersedeDecisionInput(project, proposal),
    );
  }
  return buildReviewDecisionV01(
    createRetractDecisionInput(project, proposal, priorAcceptedDecision),
  );
}

function buildScenarioFromMaterial(
  source: SemanticTransitionLoopFixtureV01,
  runReceipt: RunReceiptV01,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  observations: StateTransitionCurrentStateObservationV01[],
  priorPacket: TaskContextPacketV01,
): TransitionScenarioV01 {
  const decisionValidation = validateReviewDecisionV01(decision);
  assert.equal(decisionValidation.status, "valid", format(decisionValidation));
  const decisionRelation =
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal);
  assert.equal(decisionRelation.status, "valid", format(decisionRelation));
  const gate = createSemanticTransitionGateEvaluationV01(
    source.project,
    decision,
  );
  const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01({
    proposal,
    decision,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
  });
  assert.equal(eligibility.status, "eligible", format(eligibility));
  const receipt = buildStateTransitionReceiptV01(
    deepFreeze(
      createSemanticTransitionReceiptInputV01(
        source.project,
        proposal,
        decision,
        gate,
        eligibility,
      ),
    ),
  );
  const receiptRelation = validateStateTransitionReceiptAgainstEligibilityV01({
    proposal,
    decision,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
    receipt,
  });
  assert.equal(receiptRelation.status, "valid", format(receiptRelation));
  const laterPacket = buildLaterTaskContextPacketFromReceiptFixtureV01(
    priorPacket,
    receipt,
  );
  const packetRelation = validateTaskContextPacketTransitionRelationV01(
    priorPacket,
    receipt,
    laterPacket,
  );
  assert.equal(packetRelation.status, "valid", format(packetRelation));
  return {
    run_receipt: runReceipt,
    proposal,
    decision,
    prior_packet: priorPacket,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    eligibility,
    transition_receipt: receipt,
    later_packet: laterPacket,
  };
}

function assertMappedPacketBindings(scenario: TransitionScenarioV01) {
  const expectedRef = semanticReviewLoopTaskContextPacketRefFixture(
    scenario.prior_packet,
  );
  assert.equal(
    canonicalizeProtocolValueV01(
      scenario.run_receipt.task_context_packet_ref,
    ),
    canonicalizeProtocolValueV01(expectedRef),
  );
  assert.equal(
    canonicalizeProtocolValueV01(
      scenario.proposal.task_context_packet_ref,
    ),
    canonicalizeProtocolValueV01(expectedRef),
  );
  assert.ok(
    scenario.proposal.run_receipt_refs.some(
      (ref) =>
        ref.external_id === scenario.run_receipt.receipt_id &&
        ref.source_ref === scenario.run_receipt.integrity.fingerprint,
    ),
  );
}

function normalizePresentStateRefObservationTimes(
  observations: StateTransitionCurrentStateObservationV01[],
  observedAt: string,
) {
  for (const observation of observations) {
    if (observation.presence === "present" && observation.state_ref) {
      observation.state_ref.observed_at = observedAt;
    }
  }
}

function assertScenarioOperation(
  scenario: TransitionScenarioV01,
  operation: "replace" | "supersede" | "retract",
) {
  assert.ok(scenario.transition_receipt.effects.length > 0);
  assert.ok(
    scenario.transition_receipt.effects.every(
      (effect) => effect.operation === operation,
    ),
  );
  for (const effect of scenario.transition_receipt.effects) {
    assert.equal(effect.before_state.presence, "present");
    const beforeRef = effect.before_state.state_ref;
    assert.ok(beforeRef);
    assert.equal(
      scenario.later_packet.selected_context.some(
        (entry) =>
          canonicalizeProtocolValueV01(entry.external_ref) ===
            canonicalizeProtocolValueV01(beforeRef) &&
          entry.source_ref === effect.before_state.state_fingerprint,
      ),
      false,
    );
    if (effect.after_state.presence === "present") {
      assert.ok(
        scenario.later_packet.selected_context.some(
          (entry) =>
            entry.entry_kind === "accepted_state_ref" &&
            canonicalizeProtocolValueV01(entry.external_ref) ===
              canonicalizeProtocolValueV01(effect.after_state.state_ref) &&
            entry.source_ref === effect.after_state.state_fingerprint,
        ),
      );
    }
  }
}

function assertSameIdentityReplacementSnapshot(
  source: TransitionScenarioV01,
  fixture: SemanticTransitionLoopFixtureV01,
) {
  const receiptInput = createSemanticTransitionReceiptInputV01(
    fixture.project,
    source.proposal,
    source.decision,
    source.semantic_commit_gate_evaluation,
    source.eligibility,
  );
  const effect = receiptInput.effects[0];
  if (
    !effect ||
    effect.operation !== "replace" ||
    effect.before_state.presence !== "present" ||
    effect.after_state.presence !== "present"
  ) {
    throw new Error("Same-identity replacement requires present snapshots.");
  }
  const beforeRef = effect.before_state.state_ref;
  const afterRef = effect.after_state.state_ref;
  afterRef.ref_type = beforeRef.ref_type;
  afterRef.external_id = beforeRef.external_id;
  afterRef.compatibility_namespace = beforeRef.compatibility_namespace;
  if (beforeRef.provider) afterRef.provider = beforeRef.provider;
  else delete afterRef.provider;
  if (beforeRef.host) afterRef.host = beforeRef.host;
  else delete afterRef.host;
  assert.notEqual(
    effect.before_state.state_fingerprint,
    effect.after_state.state_fingerprint,
  );
  assert.notEqual(
    canonicalizeProtocolValueV01(beforeRef),
    canonicalizeProtocolValueV01(afterRef),
  );
  const receipt = buildStateTransitionReceiptV01(deepFreeze(receiptInput));
  const receiptRelation = validateStateTransitionReceiptAgainstEligibilityV01({
    proposal: source.proposal,
    decision: source.decision,
    current_state_observations: source.current_state_observations,
    semantic_commit_gate_evaluation:
      source.semantic_commit_gate_evaluation,
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
    receipt,
  });
  assert.equal(receiptRelation.status, "valid", format(receiptRelation));
  const laterPacket = buildLaterTaskContextPacketFromReceiptFixtureV01(
    source.prior_packet,
    receipt,
  );
  const packetRelation = validateTaskContextPacketTransitionRelationV01(
    source.prior_packet,
    receipt,
    laterPacket,
  );
  assert.equal(packetRelation.status, "valid", format(packetRelation));
  assert.ok(
    laterPacket.selected_context.some(
      (entry) =>
        canonicalizeProtocolValueV01(entry.external_ref) ===
          canonicalizeProtocolValueV01(afterRef) &&
        entry.source_ref === effect.after_state.state_fingerprint,
    ),
  );
  assert.equal(
    laterPacket.selected_context.some(
      (entry) =>
        canonicalizeProtocolValueV01(entry.external_ref) ===
          canonicalizeProtocolValueV01(beforeRef) &&
        entry.source_ref === effect.before_state.state_fingerprint,
    ),
    false,
  );
}

function createSupersedeDecisionInput(
  project: SemanticTransitionLoopFixtureV01["project"],
  proposal: EpisodeDeltaProposalV01,
): ReviewDecisionBuilderInputV01 {
  const input = createSemanticTransitionDecisionInputV01(
    project,
    proposal,
  );
  const replacement = proposal.proposed_deltas[1];
  if (!replacement) throw new Error("Supersede fixture requires two candidates.");
  input.decision = "supersede";
  input.rationale_summary =
    "Synthetic supersession selects a second review-required candidate without applying state.";
  input.lineage.superseding_candidate = {
    candidate_id: replacement.candidate_id,
    candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(replacement),
  };
  input.requested_transition_intent = {
    intent_id: `transition-intent:${project.fixture_id}:supersede`,
    transition_kind: "semantic_candidate_supersede",
    bounded_summary:
      "Request a separately gated synthetic supersession transition.",
    target_refs: clone(replacement.target_refs),
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  return input;
}

function createRetractDecisionInput(
  project: SemanticTransitionLoopFixtureV01["project"],
  proposal: EpisodeDeltaProposalV01,
  acceptedPriorDecision: ReviewDecisionV01,
): ReviewDecisionBuilderInputV01 {
  const input = createSemanticTransitionDecisionInputV01(
    project,
    proposal,
  );
  const priorDecision = {
    decision_id: acceptedPriorDecision.decision_id,
    decision_fingerprint: acceptedPriorDecision.integrity.fingerprint,
  };
  input.decision = "retract";
  input.rationale_summary =
    "Synthetic retraction preserves prior decision lineage without applying state.";
  input.lineage = {
    prior_decisions: [priorDecision],
    superseding_candidate: null,
    retracted_decision: priorDecision,
  };
  input.requested_transition_intent = {
    intent_id: `transition-intent:${project.fixture_id}:retract`,
    transition_kind: "semantic_candidate_retract",
    bounded_summary:
      "Request a separately gated synthetic retraction transition.",
    target_refs: clone(
      proposal.proposed_deltas[0]?.target_refs ?? [],
    ),
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  return input;
}

function createMultiTargetProposal(
  source: EpisodeDeltaProposalV01,
): EpisodeDeltaProposalV01 {
  const proposal = clone(source);
  const candidate = proposal.proposed_deltas[0];
  const secondTarget = proposal.proposed_deltas[1]?.target_refs[0];
  if (!candidate || !secondTarget) {
    throw new Error("Multi-target fixture requires two source candidates.");
  }
  candidate.target_refs.push(clone(secondTarget));
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(proposal);
  const validation = validateEpisodeDeltaProposalV01(proposal);
  assert.equal(validation.status, "valid", format(validation));
  return proposal;
}

function addObservedBeforeStatesToPriorPacket(
  source: TaskContextPacketV01,
  observations: StateTransitionCurrentStateObservationV01[],
): TaskContextPacketV01 {
  return rebuildPacket(source, (input) => {
    input.selected_context.push(
      ...observations.map((observation, index) =>
        createBeforeStateSelection(observation, index),
      ),
    );
  });
}

function createBeforeStateSelection(
  observation: StateTransitionCurrentStateObservationV01,
  index: number,
): TaskContextPacketSelectedEntryV01 {
  if (
    observation.presence !== "present" ||
    !observation.state_ref ||
    !observation.state_fingerprint
  ) {
    throw new Error("Prior selection requires observed present state.");
  }
  return {
    entry_id: `accepted-before-state:${index}:${observation.state_ref.external_id}`,
    entry_kind: "accepted_state_ref",
    source_ref: observation.state_fingerprint,
    external_ref: clone(observation.state_ref),
    why_included:
      "Explicit synthetic prior packet selection preserves the observed before-state.",
    currentness: {
      status: "fresh",
      as_of: observation.state_ref.observed_at ?? null,
      basis: "Bound to a direct synthetic observation at prior packet generation.",
      source_ref: {
        ...clone(observation.observation_ref),
        external_id: `${observation.observation_ref.external_id}:prior-packet`,
        observed_at: observation.state_ref.observed_at,
      },
    },
    trust_class: observation.state_ref.trust_class,
    compatibility_source_ref: {
      ...clone(observation.observation_ref),
      external_id: `${observation.observation_ref.external_id}:prior-packet`,
      observed_at: observation.state_ref.observed_at,
    },
    bounded_summary: "Observed accepted semantic state before transition.",
  };
}

function assertUnorderedNormalizationAndImmutability(
  source: SemanticTransitionLoopFixtureV01,
  multiTarget: TransitionScenarioV01,
) {
  const receiptInput = createSemanticTransitionReceiptInputV01(
    source.project,
    multiTarget.proposal,
    multiTarget.decision,
    multiTarget.semantic_commit_gate_evaluation,
    multiTarget.eligibility,
  );
  const frozenInput = deepFreeze(clone(receiptInput));
  const before = canonicalizeProtocolValueV01(frozenInput);
  const normalized = buildStateTransitionReceiptV01(frozenInput);
  assert.equal(canonicalizeProtocolValueV01(frozenInput), before);
  const reorderedInput = clone(receiptInput);
  reverseAllArrays(reorderedInput);
  const reordered = buildStateTransitionReceiptV01(
    deepFreeze(reorderedInput),
  );
  assert.deepEqual(reordered, normalized);

  const reorderedEligibilityInput = {
    proposal: multiTarget.proposal,
    decision: multiTarget.decision,
    current_state_observations: clone(
      multiTarget.current_state_observations,
    ).reverse(),
    semantic_commit_gate_evaluation: clone(
      multiTarget.semantic_commit_gate_evaluation,
    ),
    evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
  };
  reorderedEligibilityInput.semantic_commit_gate_evaluation.target_refs.reverse();
  reorderedEligibilityInput.semantic_commit_gate_evaluation.authorization_basis_refs.reverse();
  reorderedEligibilityInput.semantic_commit_gate_evaluation.source_refs.reverse();
  const reorderedEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(
      deepFreeze(reorderedEligibilityInput),
    );
  assert.deepEqual(reorderedEligibility, multiTarget.eligibility);
}

function createReceiptRelationNegativeCases(
  source: SemanticTransitionLoopFixtureV01,
): NamedRelationCaseV01[] {
  const cases: NamedRelationCaseV01[] = [];
  const add = (
    name: string,
    expectedCode: string,
    mutate: (receipt: StateTransitionReceiptV01) => void,
  ) => {
    const receipt = clone(source.transition_receipt);
    mutate(receipt);
    resignReceipt(receipt);
    cases.push({
      name,
      expected_code: expectedCode,
      run: () =>
        validateStateTransitionReceiptAgainstEligibilityV01({
          proposal: source.proposal,
          decision: source.decision,
          current_state_observations: source.current_state_observations,
          semantic_commit_gate_evaluation:
            source.semantic_commit_gate_evaluation,
          evaluated_at: SEMANTIC_TRANSITION_ELIGIBILITY_EVALUATED_AT,
          receipt,
        }),
    });
  };
  add("workspace_mismatch", "workspace_mismatch", (receipt) => {
    receipt.workspace_id = "workspace-semantic-transition-other";
  });
  add("project_mismatch", "project_mismatch", (receipt) => {
    receipt.project_id = "project-semantic-transition-other";
  });
  add("proposal_id_mismatch", "proposal_id_mismatch", (receipt) => {
    receipt.source_proposal.proposal_id = "episode-delta-proposal:other";
  });
  add(
    "proposal_fingerprint_mismatch",
    "proposal_fingerprint_mismatch",
    (receipt) => {
      receipt.source_proposal.proposal_fingerprint = syntheticFingerprint(
        "other-proposal",
      );
    },
  );
  add("decision_id_mismatch", "decision_id_mismatch", (receipt) => {
    receipt.source_decision.decision_id = "review-decision:other";
  });
  add(
    "decision_fingerprint_mismatch",
    "decision_fingerprint_mismatch",
    (receipt) => {
      receipt.source_decision.decision_fingerprint = syntheticFingerprint(
        "other-decision",
      );
    },
  );
  add("candidate_id_mismatch", "candidate_id_mismatch", (receipt) => {
    receipt.source_candidate.candidate_id = "delta:other-candidate";
  });
  add(
    "candidate_fingerprint_mismatch",
    "candidate_fingerprint_mismatch",
    (receipt) => {
      receipt.source_candidate.candidate_fingerprint = syntheticFingerprint(
        "other-candidate",
      );
    },
  );
  add("intent_id_mismatch", "intent_id_mismatch", (receipt) => {
    receipt.requested_transition_intent.intent_id = "transition-intent:other";
  });
  add(
    "transition_kind_mismatch",
    "transition_kind_mismatch",
    (receipt) => {
      receipt.requested_transition_intent.transition_kind =
        "semantic_candidate_supersede";
    },
  );
  add("transition_target_mismatch", "transition_target_mismatch", (receipt) => {
    const target = {
      ...clone(receipt.effects[0]!.target_ref),
      external_id: "candidate:outside-decision-target",
    };
    receipt.requested_transition_intent.target_refs = [clone(target)];
    receipt.effects[0]!.target_ref = target;
  });
  add(
    "gate_evaluation_ref_mismatch",
    "gate_evaluation_ref_mismatch",
    (receipt) => {
      receipt.semantic_commit_gate.evaluation_ref = {
        ...clone(receipt.semantic_commit_gate.evaluation_ref),
        external_id: "gate-evaluation:other-authorized",
      };
    },
  );
  add(
    "gate_evaluated_at_mismatch",
    "gate_evaluated_at_mismatch",
    (receipt) => {
      const priorRef = clone(receipt.semantic_commit_gate.evaluation_ref);
      const replacement = {
        ...clone(priorRef),
        observed_at: "2026-07-10T13:17:30.000Z",
      };
      receipt.semantic_commit_gate.evaluated_at =
        "2026-07-10T13:17:30.000Z";
      receipt.semantic_commit_gate.evaluation_ref = replacement;
      receipt.source_refs = replaceExactRef(
        receipt.source_refs,
        priorRef,
        replacement,
      );
    },
  );
  add(
    "gate_expires_at_mismatch",
    "gate_expires_at_mismatch",
    (receipt) => {
      receipt.semantic_commit_gate.expires_at =
        "2026-07-10T13:59:00.000Z";
    },
  );
  return cases;
}

function createLaterPacketRelationNegativeCases(input: {
  projectA: SemanticTransitionLoopFixtureV01;
  projectB: SemanticTransitionLoopFixtureV01;
  acceptReplace: TransitionScenarioV01;
  supersede: TransitionScenarioV01;
  retract: TransitionScenarioV01;
}): NamedRelationCaseV01[] {
  const { projectA, projectB, acceptReplace, supersede, retract } = input;
  const cases: NamedRelationCaseV01[] = [];
  const add = (
    name: string,
    expectedCode: string,
    priorPacket: TaskContextPacketV01,
    receipt: StateTransitionReceiptV01,
    laterPacket: TaskContextPacketV01,
  ) => {
    cases.push({
      name,
      expected_code: expectedCode,
      run: () =>
        validateTaskContextPacketTransitionRelationV01(
          priorPacket,
          receipt,
          laterPacket,
        ),
    });
  };

  const missingLineage = rebuildPacket(projectA.later_packet, (packet) => {
    packet.compatibility.source_refs = packet.compatibility.source_refs.filter(
      (ref) => ref.ref_type !== "state_transition_receipt",
    );
  });
  add(
    "transition_receipt_lineage_missing",
    "transition_receipt_lineage_missing",
    projectA.prior_packet,
    projectA.transition_receipt,
    missingLineage,
  );

  const alteredLineage = rebuildPacket(projectA.later_packet, (packet) => {
    replaceReceiptLineageRefs(
      packet,
      syntheticFingerprint("altered-transition-lineage"),
    );
  });
  add(
    "transition_receipt_lineage_provenance_mismatch",
    "transition_receipt_lineage_provenance_mismatch",
    projectA.prior_packet,
    projectA.transition_receipt,
    alteredLineage,
  );

  const missingAfterState = rebuildPacket(projectA.later_packet, (packet) => {
    packet.selected_context = packet.selected_context.filter(
      (entry) => entry.entry_kind !== "accepted_state_ref",
    );
  });
  add(
    "applied_after_state_missing",
    "applied_after_state_missing",
    projectA.prior_packet,
    projectA.transition_receipt,
    missingAfterState,
  );

  const alteredAfterState = rebuildPacket(projectA.later_packet, (packet) => {
    const selected = packet.selected_context.find(
      (entry) => entry.entry_kind === "accepted_state_ref",
    );
    if (!selected) throw new Error("Expected applied state selection.");
    selected.source_ref = syntheticFingerprint("other-after-state");
  });
  add(
    "applied_after_state_provenance_mismatch",
    "applied_after_state_provenance_mismatch",
    projectA.prior_packet,
    projectA.transition_receipt,
    alteredAfterState,
  );

  const alteredAfterStateTime = rebuildPacket(
    projectA.later_packet,
    (packet) => {
      const selected = packet.selected_context.find(
        (entry) => entry.entry_kind === "accepted_state_ref",
      );
      if (!selected) throw new Error("Expected applied state selection.");
      selected.currentness.as_of = projectA.prior_packet.generated_at;
    },
  );
  add(
    "applied_after_state_time_provenance_mismatch",
    "applied_after_state_provenance_mismatch",
    projectA.prior_packet,
    projectA.transition_receipt,
    alteredAfterStateTime,
  );

  for (const [name, scenario] of [
    ["replaced_before_state_retained", acceptReplace],
    ["superseded_before_state_retained", supersede],
    ["retracted_before_state_retained", retract],
  ] as const) {
    const retained = rebuildPacket(scenario.later_packet, (packet) => {
      const before = scenario.prior_packet.selected_context.find(
        (entry) => entry.entry_kind === "accepted_state_ref",
      );
      if (!before) throw new Error("Expected prior accepted state.");
      packet.selected_context.push(clone(before));
    });
    add(
      name,
      "retired_before_state_retained",
      scenario.prior_packet,
      scenario.transition_receipt,
      retained,
    );
  }

  const missingRetractionExclusion = rebuildPacket(
    retract.later_packet,
    (packet) => {
      packet.excluded_context = (packet.excluded_context ?? []).filter(
        (entry) => !entry.entry_id.startsWith("retracted-state:"),
      );
    },
  );
  add(
    "retracted_before_state_exclusion_missing",
    "retracted_before_state_exclusion_missing",
    retract.prior_packet,
    retract.transition_receipt,
    missingRetractionExclusion,
  );

  const alteredRetractionExclusionTime = rebuildPacket(
    retract.later_packet,
    (packet) => {
      const exclusion = (packet.excluded_context ?? []).find((entry) =>
        entry.entry_id.startsWith("retracted-state:"),
      );
      if (!exclusion) throw new Error("Expected retraction exclusion.");
      exclusion.currentness.as_of = retract.prior_packet.generated_at;
    },
  );
  add(
    "retracted_before_state_time_provenance_mismatch",
    "retracted_before_state_exclusion_provenance_mismatch",
    retract.prior_packet,
    retract.transition_receipt,
    alteredRetractionExclusionTime,
  );

  add(
    "cross_project_packet_receipt",
    "project_mismatch",
    projectB.prior_packet,
    projectA.transition_receipt,
    projectB.later_packet,
  );

  const foreignState = rebuildPacket(projectA.later_packet, (packet) => {
    const foreign = projectB.later_packet.selected_context.find(
      (entry) => entry.entry_kind === "accepted_state_ref",
    );
    if (!foreign) throw new Error("Expected foreign applied state.");
    packet.selected_context.push(clone(foreign));
  });
  add(
    "foreign_project_state_mixed",
    "unrelated_selected_context_changed",
    projectA.prior_packet,
    projectA.transition_receipt,
    foreignState,
  );

  const packetBeforeReceipt = rebuildPacket(projectA.later_packet, (packet) => {
    packet.generated_at = "2026-07-10T13:19:59.000Z";
  });
  add(
    "later_packet_precedes_transition_receipt",
    "later_packet_precedes_transition_receipt",
    projectA.prior_packet,
    projectA.transition_receipt,
    packetBeforeReceipt,
  );

  const unrelatedChanged = rebuildPacket(projectA.later_packet, (packet) => {
    packet.selected_context = packet.selected_context.filter(
      (entry) => entry.entry_kind === "accepted_state_ref",
    );
  });
  add(
    "unrelated_selected_context_changed",
    "unrelated_selected_context_changed",
    projectA.prior_packet,
    projectA.transition_receipt,
    unrelatedChanged,
  );

  const inventedCreateExclusion = rebuildPacket(
    projectA.later_packet,
    (packet) => {
      const effect = projectA.transition_receipt.effects[0]!;
      const receiptRef = createStateTransitionReceiptLineageRefV01(
        projectA.transition_receipt,
      );
      packet.excluded_context = packet.excluded_context ?? [];
      packet.excluded_context.push({
        entry_id: `invented:${effect.effect_id}`,
        source_ref: effect.target_ref.source_ref ?? effect.effect_id,
        external_ref: clone(effect.target_ref),
        why_excluded: "Synthetic invalid absent-state exclusion.",
        currentness: {
          status: "fresh",
          as_of: projectA.transition_receipt.recorded_at,
          basis: "Invalidly invents an absent before-state exclusion.",
          source_ref: receiptRef,
        },
      });
    },
  );
  add(
    "create_before_state_exclusion_invented",
    "create_before_state_exclusion_invented",
    projectA.prior_packet,
    projectA.transition_receipt,
    inventedCreateExclusion,
  );

  const authorityClaim = clone(projectA.later_packet);
  authorityClaim.authority_summary.grants_semantic_commit_authority =
    true as false;
  resignPacket(authorityClaim);
  add(
    "later_packet_transition_authority_claim",
    "later_packet_invalid",
    projectA.prior_packet,
    projectA.transition_receipt,
    authorityClaim,
  );

  cases.push({
    name: "malformed_record_objects_fail_closed",
    expected_code: "prior_packet_invalid",
    run: () => validateTaskContextPacketTransitionRelationV01({}, {}, {}),
  });

  return cases;
}

function assertBlockedCase(value: NamedRelationCaseV01) {
  const result = value.run();
  assert.equal(
    result.status,
    "blocked",
    `${value.name}: ${JSON.stringify(result, null, 2)}`,
  );
  assert.ok(
    result.errors.some((issue) => issue.code === value.expected_code),
    `${value.name} must report ${value.expected_code}: ${JSON.stringify(result, null, 2)}`,
  );
}

function replaceReceiptLineageRefs(
  packet: TaskContextPacketBuilderInputV01,
  sourceRef: string,
) {
  const mutate = (ref: ExternalRefV01 | null): ExternalRefV01 | null =>
    ref?.ref_type === "state_transition_receipt"
      ? { ...ref, source_ref: sourceRef }
      : ref;
  packet.compatibility.source_refs = packet.compatibility.source_refs.map(
    (ref) => mutate(ref)!,
  );
  packet.source_status.external_refs = packet.source_status.external_refs.map(
    (ref) => mutate(ref)!,
  );
  packet.selected_context = packet.selected_context.map((entry) => ({
    ...entry,
    compatibility_source_ref: mutate(entry.compatibility_source_ref),
  }));
  packet.excluded_context = (packet.excluded_context ?? []).map((entry) => ({
    ...entry,
    currentness: {
      ...entry.currentness,
      source_ref: mutate(entry.currentness.source_ref),
    },
  }));
}

function replaceExactRef(
  refs: ExternalRefV01[],
  expected: ExternalRefV01,
  replacement: ExternalRefV01,
): ExternalRefV01[] {
  const expectedCanonical = canonicalizeProtocolValueV01(expected);
  return refs.map((ref) =>
    canonicalizeProtocolValueV01(ref) === expectedCanonical
      ? clone(replacement)
      : ref,
  );
}

function rebuildPacket(
  source: TaskContextPacketV01,
  mutate: (input: TaskContextPacketBuilderInputV01) => void,
): TaskContextPacketV01 {
  const input: TaskContextPacketBuilderInputV01 = {
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    work_ref: clone(source.work_ref),
    generated_at: source.generated_at,
    expires_at: source.expires_at,
    task: clone(source.task),
    current_projection: clone(source.current_projection),
    selected_context: clone(source.selected_context),
    excluded_context: clone(source.excluded_context),
    tensions: clone(source.tensions),
    risks: clone(source.risks),
    gaps: clone(source.gaps),
    constraints: {
      required_checks: clone(source.constraints.required_checks),
      forbidden_actions: clone(source.constraints.forbidden_actions),
      data_classification: source.constraints.data_classification,
      context_budget: clone(source.constraints.context_budget),
    },
    capability_grant: clone(source.capability_grant),
    return_contract: clone(source.return_contract),
    source_status: clone(source.source_status),
    compatibility: clone(source.compatibility),
    authority_notes: clone(source.authority_summary.notes),
  };
  mutate(input);
  return buildTaskContextPacketV01(deepFreeze(input));
}

function resignReceipt(receipt: StateTransitionReceiptV01) {
  for (const effect of receipt.effects) {
    effect.effect_id = deriveStateTransitionEffectIdV01(effect);
  }
  receipt.idempotency_key =
    createStateTransitionReceiptIdempotencyKeyV01(receipt);
  receipt.transition_receipt_id = deriveStateTransitionReceiptIdV01(receipt);
  receipt.integrity.fingerprint =
    createStateTransitionReceiptFingerprintV01(receipt);
  const validation = validateStateTransitionReceiptV01(receipt);
  assert.equal(
    validation.errors.some((issue) =>
      [
        "effect_identity_mismatch",
        "idempotency_key_mismatch",
        "transition_receipt_identity_mismatch",
        "fingerprint_mismatch",
      ].includes(issue.code),
    ),
    false,
    format(validation),
  );
}

function resignPacket(packet: TaskContextPacketV01) {
  const pendingMaterial = clone(packet);
  pendingMaterial.packet_id = "task-context-packet:pending";
  pendingMaterial.constraints.context_budget.estimated_tokens = null;
  const { fingerprint: _fingerprint, ...integrity } = pendingMaterial.integrity;
  const estimatedMaterial = { ...pendingMaterial, integrity };
  packet.constraints.context_budget.estimated_tokens = Math.max(
    1,
    Math.ceil(canonicalizeTaskContextValueV01(estimatedMaterial).length / 4),
  );
  packet.packet_id = deriveTaskContextPacketIdV01(packet);
  packet.integrity.fingerprint = createTaskContextPacketFingerprintV01(packet);
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: packet.generated_at,
  });
  assert.equal(
    validation.errors.some((issue) =>
      [
        "estimated_token_count_mismatch",
        "packet_identity_mismatch",
        "fingerprint_mismatch",
      ].includes(issue.code),
    ),
    false,
    format(validation),
  );
}

function syntheticFingerprint(seed: string): string {
  return createProtocolSha256V01(`semantic-transition-conformance|${seed}`);
}

function reverseAllArrays(value: unknown) {
  if (Array.isArray(value)) {
    value.reverse();
    value.forEach(reverseAllArrays);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value as Record<string, unknown>).forEach(reverseAllArrays);
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

function format(value: {
  status: string;
  errors: Array<{ code: string; path?: string | null; message?: string }>;
  warnings: Array<{ code: string; path?: string | null; message?: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
