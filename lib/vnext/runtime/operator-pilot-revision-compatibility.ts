import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01,
  type EpisodeDeltaProposalDeltaCandidateV01,
  type EpisodeDeltaProposalDeltaTypeV01,
  type EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01 =
  "operator_pilot_revision_delta_target_incompatible" as const;

export type VNextOperatorPilotRevisionDeltaTargetCompatibilityV01 =
  | {
      status: "compatible";
      policy: "run_assessment_criterion_validation_lane";
      server_selected_delta_type: "validation_delta";
      target_kind: "criterion_assessment_item";
    }
  | {
      status: "compatible";
      policy: "strategic_agent_plan_lane";
      server_selected_delta_type: "agent_plan_delta";
      target_kind: "accepted_agent_plan_state";
    }
  | {
      status: "compatible";
      policy: "generic_existing_behavior";
      server_selected_delta_type: null;
      target_kind: null;
    }
  | {
      status: "incompatible";
      code: typeof OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01;
      policy: "run_assessment_criterion_validation_lane";
      server_selected_delta_type: "validation_delta";
      target_kind: "criterion_assessment_item";
    }
  | {
      status: "incompatible";
      code: typeof OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01;
      policy: "strategic_agent_plan_lane";
      server_selected_delta_type: "agent_plan_delta";
      target_kind: "accepted_agent_plan_state";
    }
  | {
      status: "incompatible";
      code: typeof OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01;
      policy: "strategic_no_transfer_review_only";
      server_selected_delta_type: null;
      target_kind: "accepted_agent_plan_state";
    }
  | {
      status: "incompatible";
      code: typeof OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01;
      policy: "project_verify_lifecycle_exact_record";
      server_selected_delta_type: "validation_delta";
      target_kind: "project_verify_family";
    };

/**
 * Narrow server-owned R6-C compatibility policy. It does not infer targets or
 * define a general target ontology. Historical and non-run-assessment proposal
 * families retain their existing behavior until an explicit policy applies.
 */
export function evaluateVNextOperatorPilotRevisionDeltaTargetCompatibilityV01(input: {
  source_proposal: EpisodeDeltaProposalV01;
  source_candidate: EpisodeDeltaProposalDeltaCandidateV01;
  revised_delta_type: EpisodeDeltaProposalDeltaTypeV01;
  revised_target_refs: ExternalRefV01[];
}): VNextOperatorPilotRevisionDeltaTargetCompatibilityV01 {
  if (input.source_proposal.project_verify_lifecycle) {
    return {
      status: "incompatible",
      code: OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
      policy: "project_verify_lifecycle_exact_record",
      server_selected_delta_type: "validation_delta",
      target_kind: "project_verify_family",
    };
  }
  const isRunAssessmentCriterionValidation =
    input.source_proposal.source_assessment?.admission_profile ===
      RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01 &&
    input.source_candidate.delta_type === "validation_delta" &&
    input.source_candidate.target_refs.length > 0 &&
    input.source_candidate.target_refs.every(
      (ref) => ref.ref_type === "criterion_assessment_item",
    );

  const strategicProfile = input.source_proposal.strategic_advantage_transfer;
  const isMappedStrategicTransferCandidate =
    strategicProfile?.transfer_items.some(
      (transfer) =>
        input.source_candidate.candidate_id ===
        `strategic-candidate:${transfer.transfer_id.slice(
          "strategic-transfer:".length,
        )}`,
    ) === true;
  const isStrategicAgentPlanTarget =
    isMappedStrategicTransferCandidate &&
    input.source_candidate.operation === "unknown" &&
    input.source_candidate.target_refs.length === 1 &&
    canonicalizeProtocolValueV01(input.source_candidate.target_refs[0]) ===
      canonicalizeProtocolValueV01(strategicProfile!.base_strategy.target_ref);

  if (strategicProfile && !isMappedStrategicTransferCandidate) {
    return {
      status: "incompatible",
      code: OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
      policy: "strategic_no_transfer_review_only",
      server_selected_delta_type: null,
      target_kind: "accepted_agent_plan_state",
    };
  }

  if (isStrategicAgentPlanTarget) {
    const exactTargetsPreserved =
      input.revised_target_refs.length === 1 &&
      canonicalizeProtocolValueV01(input.revised_target_refs[0]) ===
        canonicalizeProtocolValueV01(
          strategicProfile!.base_strategy.target_ref,
        );
    if (
      input.revised_delta_type !== "agent_plan_delta" ||
      !exactTargetsPreserved
    ) {
      return {
        status: "incompatible",
        code: OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
        policy: "strategic_agent_plan_lane",
        server_selected_delta_type: "agent_plan_delta",
        target_kind: "accepted_agent_plan_state",
      };
    }
    return {
      status: "compatible",
      policy: "strategic_agent_plan_lane",
      server_selected_delta_type: "agent_plan_delta",
      target_kind: "accepted_agent_plan_state",
    };
  }

  if (!isRunAssessmentCriterionValidation) {
    return {
      status: "compatible",
      policy: "generic_existing_behavior",
      server_selected_delta_type: null,
      target_kind: null,
    };
  }

  const targetIdentities = (refs: ExternalRefV01[]) =>
    refs
      .map((ref) =>
        canonicalizeProtocolValueV01({
          ref_type: ref.ref_type,
          external_id: ref.external_id,
        }),
      )
      .sort();
  const exactTargetsPreserved =
    canonicalizeProtocolValueV01(
      targetIdentities(input.revised_target_refs),
    ) ===
    canonicalizeProtocolValueV01(
      targetIdentities(input.source_candidate.target_refs),
    );
  if (
    input.revised_delta_type !== "validation_delta" ||
    !exactTargetsPreserved ||
    !input.revised_target_refs.every(
      (ref) => ref.ref_type === "criterion_assessment_item",
    )
  ) {
    return {
      status: "incompatible",
      code: OPERATOR_PILOT_REVISION_DELTA_TARGET_INCOMPATIBLE_V01,
      policy: "run_assessment_criterion_validation_lane",
      server_selected_delta_type: "validation_delta",
      target_kind: "criterion_assessment_item",
    };
  }

  return {
    status: "compatible",
    policy: "run_assessment_criterion_validation_lane",
    server_selected_delta_type: "validation_delta",
    target_kind: "criterion_assessment_item",
  };
}
