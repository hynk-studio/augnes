import type Database from "better-sqlite3";

import {
  deriveVNextSemanticTargetKeyV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { EpisodeDeltaProposalDeltaCandidateV01, EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const VNEXT_OPERATOR_PILOT_POLICY_VERSION_V01 =
  "vnext_operator_pilot_policy.v0.1" as const;

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
  accept_operation: "create" | null;
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
    config: VNextLocalOperatorPilotConfigV01;
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
  if (input.candidate.target_refs.length !== 1) {
    blockingReasons.push("pilot_accept_requires_one_target");
  }
  if (targetStates.some((state) => state.presence === "drifted")) {
    blockingReasons.push("pilot_current_state_projection_drifted");
  }
  if (targetStates.some((state) => state.presence === "present")) {
    blockingReasons.push("pilot_accept_requires_observed_absent_state");
  }
  const currentStateStatus = aggregateCurrentStateStatus(targetStates);
  const acceptAllowed =
    input.candidate.target_refs.length === 1 &&
    targetStates.length === 1 &&
    targetStates[0]?.presence === "absent";

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
    accept_operation: acceptAllowed ? "create" : null,
    blocking_reasons: [...new Set(blockingReasons)].sort(),
    policy_notes: [
      "M3D product admission allows one selected candidate and one absent target for accept/create only.",
      "Reject and defer create no transition intent.",
      "Admission is a read-only policy result, not a decision, gate, or state transition.",
    ],
  };
}

function assertConfiguredProposal(
  config: VNextLocalOperatorPilotConfigV01,
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
  config: VNextLocalOperatorPilotConfigV01,
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
  if (
    !projection &&
    head?.presence === "absent" &&
    head.current_state_fingerprint === null
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
      head.source_transition_receipt_fingerprint
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

function aggregateCurrentStateStatus(
  states: VNextOperatorPilotTargetStateV01[],
): VNextOperatorPilotCurrentStateStatusV01 {
  if (states.some((state) => state.presence === "drifted")) return "drifted";
  const presences = new Set(states.map((state) => state.presence));
  if (presences.size > 1) return "mixed";
  return presences.has("present") ? "present" : "absent";
}
