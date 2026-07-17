import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopMaterialFixture,
  semanticReviewLoopProjectAFixture,
  semanticReviewLoopProjectBFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  SEMANTIC_TRANSITION_DECIDED_AT,
  createSemanticTransitionDecisionInputV01,
} from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
  type ReviewDecisionBuilderInputV01,
} from "@/lib/vnext/review-decision";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT =
  "2026-07-10T14:00:00.000Z";
export const DURABLE_LOCAL_LOOP_PREVIEWED_AT =
  "2026-07-10T14:01:00.000Z";
export const DURABLE_LOCAL_LOOP_CONFIRMED_AT =
  "2026-07-10T14:02:00.000Z";
export const DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT =
  "2026-07-10T14:03:00.000Z";
export const DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT =
  "2026-07-10T14:04:00.000Z";
export const DURABLE_LOCAL_LOOP_APPLIED_AT =
  "2026-07-10T14:05:00.000Z";
export const DURABLE_LOCAL_LOOP_RECORDED_AT =
  "2026-07-10T14:06:00.000Z";
export const DURABLE_LOCAL_LOOP_FOLLOWUP_DECIDED_AT =
  "2026-07-10T14:07:00.000Z";
export const DURABLE_LOCAL_LOOP_FOLLOWUP_CURRENT_STATE_OBSERVED_AT =
  "2026-07-10T14:08:00.000Z";
export const DURABLE_LOCAL_LOOP_FOLLOWUP_PREVIEWED_AT =
  "2026-07-10T14:09:00.000Z";
export const DURABLE_LOCAL_LOOP_FOLLOWUP_CONFIRMED_AT =
  "2026-07-10T14:10:00.000Z";
export const DURABLE_LOCAL_LOOP_FOLLOWUP_GATE_EVALUATED_AT =
  "2026-07-10T14:11:00.000Z";
export const DURABLE_LOCAL_LOOP_FOLLOWUP_ELIGIBILITY_EVALUATED_AT =
  "2026-07-10T14:12:00.000Z";
export const DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT =
  "2026-07-10T15:00:00.000Z";
export const DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT =
  "2026-07-10T14:07:00.000Z";
export const DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_STARTED_AT =
  "2026-07-10T14:08:00.000Z";
export const DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_FINISHED_AT =
  "2026-07-10T14:09:00.000Z";
export const DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT =
  "2026-07-10T14:10:00.000Z";
export const DURABLE_LOCAL_LOOP_DECIDED_AT = SEMANTIC_TRANSITION_DECIDED_AT;

export const durableLocalClosedLoopProjectAFixture =
  semanticReviewLoopProjectAFixture;
export const durableLocalClosedLoopProjectBFixture =
  semanticReviewLoopProjectBFixture;

export interface DurableLocalClosedLoopM3APrefixFixtureV01 {
  project: SemanticReviewLoopProjectFixtureV01;
  prior_packet: TaskContextPacketV01;
  run_receipt: RunReceiptV01;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
}

export function buildDurableLocalClosedLoopM3APrefixFixtureV01(
  project: SemanticReviewLoopProjectFixtureV01,
): DurableLocalClosedLoopM3APrefixFixtureV01 {
  const material = buildSemanticReviewLoopMaterialFixture(project);

  const decision = buildReviewDecisionV01(
    deepFreeze(
      createSemanticTransitionDecisionInputV01(project, material.proposal),
    ),
  );
  const decisionValidation = validateReviewDecisionV01(decision);
  if (decisionValidation.status !== "valid") {
    throw new Error(
      `Durable local loop synthetic decision failed validation: ${JSON.stringify(decisionValidation)}`,
    );
  }
  const decisionRelation =
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      decision,
      material.proposal,
    );
  if (decisionRelation.status !== "valid") {
    throw new Error(
      `Durable local loop synthetic decision relation failed: ${JSON.stringify(decisionRelation)}`,
    );
  }

  return {
    project,
    prior_packet: material.prior_packet,
    run_receipt: material.run_receipt,
    proposal: material.proposal,
    decision,
  };
}

export function buildDurableLocalClosedLoopProjectAFixtureV01(): DurableLocalClosedLoopM3APrefixFixtureV01 {
  return buildDurableLocalClosedLoopM3APrefixFixtureV01(
    durableLocalClosedLoopProjectAFixture,
  );
}

export function buildDurableLocalClosedLoopProjectBFixtureV01(): DurableLocalClosedLoopM3APrefixFixtureV01 {
  return buildDurableLocalClosedLoopM3APrefixFixtureV01(
    durableLocalClosedLoopProjectBFixture,
  );
}

export interface DurableLocalSemanticGateScenarioV01 {
  scenario_id: "create" | "replace" | "supersede" | "retract" | "multi_target";
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  expected_operations: Array<"create" | "replace" | "supersede" | "retract">;
  expected_target_count: number;
}

export interface DurableLocalSemanticGateScenariosV01 {
  prefix: DurableLocalClosedLoopM3APrefixFixtureV01;
  supersede_prior_accept_decision: ReviewDecisionV01;
  create: DurableLocalSemanticGateScenarioV01;
  replace: DurableLocalSemanticGateScenarioV01;
  supersede: DurableLocalSemanticGateScenarioV01;
  retract: DurableLocalSemanticGateScenarioV01;
  multi_target: DurableLocalSemanticGateScenarioV01;
}

export function buildDurableLocalSemanticGateScenariosV01(): DurableLocalSemanticGateScenariosV01 {
  return buildDurableLocalSemanticGateScenariosForProjectV01(
    durableLocalClosedLoopProjectAFixture,
  );
}

export function buildDurableLocalSemanticGateScenariosForProjectV01(
  project: SemanticReviewLoopProjectFixtureV01,
): DurableLocalSemanticGateScenariosV01 {
  const prefix = buildDurableLocalClosedLoopM3APrefixFixtureV01(project);
  const replaceProposal = rebuildProposal(prefix.proposal, (proposal) => {
    const candidate = requireFirstCandidate(proposal);
    candidate.title = "Review a durable same-target replacement";
    candidate.proposed_state_summary =
      "Persist a changed candidate-derived semantic summary over the same target after explicit local confirmation.";
    candidate.uncertainties = [
      "The replacement remains synthetic gate fixture material until the isolated writer applies it.",
    ];
  });
  const replaceDecision = buildValidatedDecision(
    replaceProposal,
    retimeFollowupDecisionInput(
      createSemanticTransitionDecisionInputV01(prefix.project, replaceProposal),
    ),
  );

  const supersedeProposal = rebuildProposal(prefix.proposal, (proposal) => {
    const source = requireFirstCandidate(proposal);
    const replacement = {
      ...clone(source),
      candidate_id: "delta:durable-local-same-target-superseding-candidate",
      title: "Review a same-target durable superseding candidate",
      proposed_state_summary:
        "Persist the exact gate-authorized same-target superseding candidate after applied-lineage validation.",
      uncertainties: [
        "Supersession remains synthetic and operator-gated in this fixture.",
      ],
    };
    proposal.proposed_deltas.push(replacement);
    if (replacement.current_state.knowledge_status === "unknown") {
      const missing = proposal.missing_information.find((item) =>
        item.related_delta_ids.includes(source.candidate_id),
      );
      if (!missing) {
        throw new Error("Durable supersede fixture requires source missing-state lineage.");
      }
      proposal.missing_information.push({
        ...clone(missing),
        missing_id: "missing:durable-local-same-target-superseding-candidate",
        related_delta_ids: [replacement.candidate_id],
      });
    }
  });
  const supersedingCandidate = supersedeProposal.proposed_deltas.find(
    (candidate) =>
      candidate.candidate_id ===
      "delta:durable-local-same-target-superseding-candidate",
  );
  if (!supersedingCandidate) throw new Error("Durable superseding candidate missing.");
  const supersedePriorAcceptDecision = buildValidatedDecision(
    supersedeProposal,
    createSemanticTransitionDecisionInputV01(
      prefix.project,
      supersedeProposal,
    ),
  );
  const supersedeInput = createSemanticTransitionDecisionInputV01(
    prefix.project,
    supersedeProposal,
  );
  supersedeInput.decision = "supersede";
  supersedeInput.decided_at = DURABLE_LOCAL_LOOP_FOLLOWUP_DECIDED_AT;
  supersedeInput.rationale_summary =
    "Synthetic gate fixture selects an exact same-target superseding candidate without authenticating a human actor.";
  supersedeInput.lineage = {
    prior_decisions: [decisionBinding(supersedePriorAcceptDecision)],
    superseding_candidate: {
      candidate_id: supersedingCandidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(supersedingCandidate),
    },
    retracted_decision: null,
  };
  supersedeInput.requested_transition_intent = {
    intent_id: `transition-intent:${prefix.project.fixture_id}:durable-supersede`,
    transition_kind: "semantic_candidate_supersede",
    bounded_summary:
      "Request exact same-target supersession behind a separately persisted local gate.",
    target_refs: clone(supersedingCandidate.target_refs),
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  const supersedeDecision = buildValidatedDecision(
    supersedeProposal,
    supersedeInput,
  );

  const retractInput = createSemanticTransitionDecisionInputV01(
    prefix.project,
    prefix.proposal,
  );
  const priorDecision = decisionBinding(prefix.decision);
  retractInput.decision = "retract";
  retractInput.decided_at = DURABLE_LOCAL_LOOP_FOLLOWUP_DECIDED_AT;
  retractInput.rationale_summary =
    "Synthetic gate fixture retracts only the exact prior applied acceptance lineage.";
  retractInput.lineage = {
    prior_decisions: [priorDecision],
    superseding_candidate: null,
    retracted_decision: priorDecision,
  };
  retractInput.requested_transition_intent = {
    intent_id: `transition-intent:${prefix.project.fixture_id}:durable-retract`,
    transition_kind: "semantic_candidate_retract",
    bounded_summary:
      "Request exact applied-state retraction behind a separately persisted local gate.",
    target_refs: clone(requireFirstCandidate(prefix.proposal).target_refs),
    intent_only: true,
    applied: false,
    state_transition_receipt_ref: null,
  };
  const retractDecision = buildValidatedDecision(
    prefix.proposal,
    retractInput,
  );

  const multiTargetProposal = rebuildProposal(prefix.proposal, (proposal) => {
    const candidate = requireFirstCandidate(proposal);
    const secondTarget = clone(candidate.target_refs[0]!);
    secondTarget.external_id = `${secondTarget.external_id}:durable-second-target`;
    candidate.target_refs.push(secondTarget);
    candidate.title = "Review an atomic two-target durable candidate";
    candidate.proposed_state_summary =
      "Persist the exact candidate-derived semantic summary atomically across two project-scoped targets.";
  });
  const multiTargetDecision = buildValidatedDecision(
    multiTargetProposal,
    retimeFollowupDecisionInput(
      createSemanticTransitionDecisionInputV01(
        prefix.project,
        multiTargetProposal,
      ),
    ),
  );

  return {
    prefix,
    supersede_prior_accept_decision: supersedePriorAcceptDecision,
    create: scenario("create", prefix.proposal, prefix.decision, ["create"]),
    replace: scenario("replace", replaceProposal, replaceDecision, ["replace"]),
    supersede: scenario(
      "supersede",
      supersedeProposal,
      supersedeDecision,
      ["supersede"],
    ),
    retract: scenario("retract", prefix.proposal, retractDecision, ["retract"]),
    multi_target: scenario(
      "multi_target",
      multiTargetProposal,
      multiTargetDecision,
      ["replace", "create"],
    ),
  };
}

function scenario(
  scenarioId: DurableLocalSemanticGateScenarioV01["scenario_id"],
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  expectedOperations: DurableLocalSemanticGateScenarioV01["expected_operations"],
): DurableLocalSemanticGateScenarioV01 {
  return {
    scenario_id: scenarioId,
    proposal,
    decision,
    expected_operations: expectedOperations,
    expected_target_count:
      decision.requested_transition_intent?.target_refs.length ?? 0,
  };
}

function rebuildProposal(
  source: EpisodeDeltaProposalV01,
  mutate: (proposal: EpisodeDeltaProposalV01) => void,
): EpisodeDeltaProposalV01 {
  const proposal = clone(source);
  mutate(proposal);
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(proposal);
  const validation = validateEpisodeDeltaProposalV01(proposal);
  if (validation.status !== "valid") {
    throw new Error(
      `Durable gate proposal fixture failed validation: ${JSON.stringify(validation)}`,
    );
  }
  return proposal;
}

function buildValidatedDecision(
  proposal: EpisodeDeltaProposalV01,
  input: ReviewDecisionBuilderInputV01,
): ReviewDecisionV01 {
  const decision = buildReviewDecisionV01(deepFreeze(clone(input)));
  const validation = validateReviewDecisionV01(decision);
  const relation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    decision,
    proposal,
  );
  if (validation.status !== "valid" || relation.status !== "valid") {
    throw new Error(
      `Durable gate decision fixture failed validation: ${JSON.stringify({ validation, relation })}`,
    );
  }
  return decision;
}

function decisionBinding(decision: ReviewDecisionV01) {
  return {
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };
}

function retimeFollowupDecisionInput(
  input: ReviewDecisionBuilderInputV01,
): ReviewDecisionBuilderInputV01 {
  input.decided_at = DURABLE_LOCAL_LOOP_FOLLOWUP_DECIDED_AT;
  return input;
}

function requireFirstCandidate(proposal: EpisodeDeltaProposalV01) {
  const candidate = proposal.proposed_deltas[0];
  if (!candidate) throw new Error("Durable gate fixture requires a proposal candidate.");
  return candidate;
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
