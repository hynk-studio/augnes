import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  deriveVNextSemanticTargetKeyV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextSemanticStateProjectionEntryV01,
  type VNextSemanticTargetHeadV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { EpisodeDeltaProposalDeltaCandidateV01, EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01 =
  "vnext_operator_pilot_policy.v0.1" as const;

type VNextOperatorPilotProjectScopeV01 = Pick<
  VNextLocalOperatorPilotConfigV01,
  "workspace_id" | "project_id"
>;

export type VNextOperatorPilotCurrentStateStatusV01 =
  | "absent"
  | "present"
  | "mixed"
  | "drifted";

export interface VNextOperatorPilotTargetStateV01 {
  target_ref: ExternalRefV01;
  target_key: string;
  presence: "absent" | "present" | "drifted";
  revision: number;
  state_fingerprint: string | null;
  source_transition_receipt_id: string | null;
  source_transition_receipt_fingerprint: string | null;
}

export interface VNextOperatorPilotCandidateAdmissionV01 {
  policy_version: typeof VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01;
  candidate_id: string;
  candidate_fingerprint: string;
  target_count: number;
  current_state_status: VNextOperatorPilotCurrentStateStatusV01;
  target_states: VNextOperatorPilotTargetStateV01[];
  decision_allowed: {
    accept: boolean;
    reject: true;
    defer: true;
  };
  mapped_operation: "create" | "replace" | "supersede" | "retract" | null;
  accept_operation: "create" | "replace" | "supersede" | "retract" | null;
  blocking_reasons: string[];
  policy_notes: string[];
}

/**
 * Evaluates the deliberately narrow M3D product admission policy. It never
 * creates a decision, gate, transition, or current-state observation.
 */
export function inspectVNextOperatorPilotCandidateAdmissionV01(
  db: Database.Database,
  input: {
    config: VNextOperatorPilotProjectScopeV01;
    proposal: EpisodeDeltaProposalV01;
    candidate: EpisodeDeltaProposalDeltaCandidateV01;
    candidate_fingerprint: string;
  },
): VNextOperatorPilotCandidateAdmissionV01 {
  assertConfiguredProposal(input.config, input.proposal);
  const proposalCandidate = input.proposal.proposed_deltas.find(
    (candidate) => candidate.candidate_id === input.candidate.candidate_id,
  );
  if (
    !proposalCandidate ||
    canonicalizeProtocolValueV01(proposalCandidate) !==
      canonicalizeProtocolValueV01(input.candidate)
  ) {
    throw new Error("operator_pilot_candidate_outside_proposal");
  }
  const candidateFingerprint =
    createEpisodeDeltaCandidateFingerprintV01(proposalCandidate);
  if (candidateFingerprint !== input.candidate_fingerprint) {
    throw new Error("operator_pilot_candidate_fingerprint_mismatch");
  }

  const targetStates = input.candidate.target_refs.map((targetRef) =>
    readTargetState(db, input.config, targetRef),
  );
  const blockingReasons: string[] = [];
  if (
    input.candidate.target_refs.length === 0 ||
    input.candidate.target_refs.length > 64
  ) {
    blockingReasons.push("pilot_accept_target_set_invalid");
  }
  if (targetStates.some((state) => state.presence === "drifted")) {
    blockingReasons.push("pilot_current_state_projection_drifted");
  }
  const currentStateStatus = aggregateCurrentStateStatus(targetStates);
  const acceptOperation = mapCandidateOperation(input.candidate.operation);
  if (!acceptOperation) {
    blockingReasons.push("pilot_candidate_operation_not_transitionable");
  } else if (
    acceptOperation === "create" &&
    targetStates.some((state) => state.presence !== "absent")
  ) {
    blockingReasons.push("pilot_add_requires_observed_absent_state");
  } else if (
    acceptOperation !== "create" &&
    targetStates.some((state) => state.presence !== "present")
  ) {
    blockingReasons.push(
      acceptOperation === "replace"
        ? "pilot_revise_requires_observed_present_state"
        : acceptOperation === "supersede"
          ? "pilot_supersede_requires_observed_present_state"
          : "pilot_retract_requires_observed_present_state",
    );
  }
  const acceptAllowed =
    acceptOperation !== null &&
    input.candidate.target_refs.length > 0 &&
    input.candidate.target_refs.length <= 64 &&
    targetStates.length === input.candidate.target_refs.length &&
    targetStates.every((state) =>
      acceptOperation === "create"
        ? state.presence === "absent"
        : state.presence === "present",
    );

  return {
    policy_version: VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01,
    candidate_id: input.candidate.candidate_id,
    candidate_fingerprint: candidateFingerprint,
    target_count: input.candidate.target_refs.length,
    current_state_status: currentStateStatus,
    target_states: targetStates,
    decision_allowed: {
      accept: acceptAllowed,
      reject: true,
      defer: true,
    },
    mapped_operation: acceptOperation,
    accept_operation: acceptAllowed ? acceptOperation : null,
    blocking_reasons: [...new Set(blockingReasons)].sort(),
    policy_notes: [
      "R6-C admission maps explicit candidate add/revise/supersede/retract-or-remove operations to create/replace/supersede/retract effects.",
      "Unknown and no-change candidates are never transitionable; an immutable operation-aware revision is required before accept.",
      "Reject and defer create no transition intent.",
      "Admission is a read-only policy result, not a decision, gate, or state transition.",
    ],
  };
}

function mapCandidateOperation(
  operation: EpisodeDeltaProposalDeltaCandidateV01["operation"],
): VNextOperatorPilotCandidateAdmissionV01["accept_operation"] {
  switch (operation) {
    case "add":
      return "create";
    case "revise":
      return "replace";
    case "supersede":
      return "supersede";
    case "retract":
    case "remove":
      return "retract";
    case "no_change":
    case "unknown":
      return null;
  }
}

function assertConfiguredProposal(
  config: VNextOperatorPilotProjectScopeV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  if (
    proposal.workspace_id !== config.workspace_id ||
    proposal.project_id !== config.project_id
  ) {
    throw new Error("operator_pilot_proposal_scope_mismatch");
  }
}

function readTargetState(
  db: Database.Database,
  config: VNextOperatorPilotProjectScopeV01,
  targetRef: ExternalRefV01,
): VNextOperatorPilotTargetStateV01 {
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  const projection = readVNextSemanticStateEntryV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    target_key: targetKey,
  });
  const head = readVNextSemanticTargetHeadV01(db, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    target_key: targetKey,
  });
  if (!projection && !head) {
    return {
      target_ref: targetRef,
      target_key: targetKey,
      presence: "absent",
      revision: 0,
      state_fingerprint: null,
      source_transition_receipt_id: null,
      source_transition_receipt_fingerprint: null,
    };
  }
  const durableLineageCoherent = head
    ? hasCoherentDurableTargetLineage(
        db,
        config,
        targetRef,
        targetKey,
        head,
        projection,
      )
    : false;
  if (
    !projection &&
    head?.presence === "absent" &&
    head.current_state_fingerprint === null &&
    durableLineageCoherent
  ) {
    return {
      target_ref: targetRef,
      target_key: targetKey,
      presence: "absent",
      revision: head.revision,
      state_fingerprint: null,
      source_transition_receipt_id: head.source_transition_receipt_id,
      source_transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
    };
  }
  if (
    projection &&
    head?.presence === "present" &&
    projection.target_key === head.target_key &&
    projection.revision === head.revision &&
    projection.state_fingerprint === head.current_state_fingerprint &&
    projection.source_transition_receipt_id ===
      head.source_transition_receipt_id &&
    projection.source_transition_receipt_fingerprint ===
      head.source_transition_receipt_fingerprint &&
    durableLineageCoherent
  ) {
    return {
      target_ref: targetRef,
      target_key: targetKey,
      presence: "present",
      revision: head.revision,
      state_fingerprint: projection.state_fingerprint,
      source_transition_receipt_id: head.source_transition_receipt_id,
      source_transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
    };
  }
  return {
    target_ref: targetRef,
    target_key: targetKey,
    presence: "drifted",
    revision: head?.revision ?? projection?.revision ?? 0,
    state_fingerprint:
      head?.current_state_fingerprint ?? projection?.state_fingerprint ?? null,
    source_transition_receipt_id:
      head?.source_transition_receipt_id ??
      projection?.source_transition_receipt_id ??
      null,
    source_transition_receipt_fingerprint:
      head?.source_transition_receipt_fingerprint ??
      projection?.source_transition_receipt_fingerprint ??
      null,
  };
}

/**
 * Resolves the exact durable target currently occupying the same protocol
 * identity as a source ref. A later run-assessment proposal carries fresh
 * assessment provenance on its criterion ref, so that ref is deliberately
 * reported as drifted by the ordinary admission projection after an earlier
 * revision has established state. Operation-aware revision may select the
 * canonical persisted target only after this second, full-lineage read proves
 * that the stored projection and head are coherent.
 */
export function readVNextOperatorPilotCanonicalTargetStateV01(
  db: Database.Database,
  input: {
    config: VNextOperatorPilotProjectScopeV01;
    source_target_ref: ExternalRefV01;
  },
): VNextOperatorPilotTargetStateV01 {
  const sourceState = readTargetState(
    db,
    input.config,
    input.source_target_ref,
  );
  if (sourceState.presence !== "drifted") return sourceState;
  const projection = readVNextSemanticStateEntryV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    target_key: sourceState.target_key,
  });
  if (!projection) return sourceState;
  const canonicalState = readTargetState(
    db,
    input.config,
    projection.target_ref,
  );
  return canonicalState.target_key === sourceState.target_key &&
    canonicalState.presence === "present"
    ? canonicalState
    : sourceState;
}

function hasCoherentDurableTargetLineage(
  db: Database.Database,
  config: VNextOperatorPilotProjectScopeV01,
  targetRef: ExternalRefV01,
  targetKey: string,
  head: VNextSemanticTargetHeadV01,
  projection: VNextSemanticStateProjectionEntryV01 | null,
): boolean {
  try {
    const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      transition_receipt_id: head.source_transition_receipt_id,
      transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
    });
    const effect = transition.receipt.effects.find(
      (item) =>
        deriveVNextSemanticTargetKeyV01(item.target_ref) === targetKey,
    );
    const intended = transition.gate_record.intended_effects.find(
      (item) => item.target_key === targetKey,
    );
    if (
      !effect ||
      !intended ||
      head.revision !== intended.expected_revision ||
      head.updated_at !== transition.receipt.recorded_at ||
      head.presence !== effect.after_state.presence ||
      head.current_state_fingerprint !== effect.after_state.state_fingerprint ||
      canonicalizeProtocolValueV01(effect.target_ref) !==
        canonicalizeProtocolValueV01(targetRef)
    ) {
      return false;
    }
    if (head.presence === "absent") {
      return projection === null && effect.after_state.state_ref === null;
    }
    if (
      !projection ||
      effect.after_state.state_ref === null ||
      projection.updated_at !== head.updated_at ||
      canonicalizeProtocolValueV01(projection.target_ref) !==
        canonicalizeProtocolValueV01(targetRef) ||
      canonicalizeProtocolValueV01(projection.state_ref) !==
        canonicalizeProtocolValueV01(effect.after_state.state_ref)
    ) {
      return false;
    }
    const stateRecord = readVNextCoreRecordV01(db, {
      record_kind: "semantic_state",
      record_id: projection.state_ref.external_id,
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    });
    if (!stateRecord) return false;
    const state = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
      workspace_id: state.workspace_id,
      project_id: state.project_id,
      fingerprint: state.integrity.fingerprint,
    });
    return (
      stateRecord.record_id === state.semantic_state_record_id &&
      stateRecord.created_at === state.created_at &&
      stateRecord.idempotency_key === null &&
      state.workspace_id === config.workspace_id &&
      state.project_id === config.project_id &&
      state.target_key === targetKey &&
      canonicalizeProtocolValueV01(state.target_ref) ===
        canonicalizeProtocolValueV01(targetRef) &&
      canonicalizeProtocolValueV01(state.state_ref) ===
        canonicalizeProtocolValueV01(projection.state_ref) &&
      state.state_content_fingerprint === projection.state_fingerprint &&
      state.bounded_state_summary === projection.bounded_state_summary &&
      state.source_proposal_id === projection.source_proposal_id &&
      state.source_proposal_fingerprint ===
        projection.source_proposal_fingerprint &&
      state.source_candidate_id === projection.source_candidate_id &&
      state.source_candidate_fingerprint ===
        projection.source_candidate_fingerprint &&
      state.source_decision_id === transition.decision.decision_id &&
      state.source_decision_fingerprint ===
        transition.decision.integrity.fingerprint
    );
  } catch {
    return false;
  }
}

function aggregateCurrentStateStatus(
  states: VNextOperatorPilotTargetStateV01[],
): VNextOperatorPilotCurrentStateStatusV01 {
  if (states.some((state) => state.presence === "drifted")) return "drifted";
  const presences = new Set(states.map((state) => state.presence));
  if (presences.size > 1) return "mixed";
  return presences.has("present") ? "present" : "absent";
}
