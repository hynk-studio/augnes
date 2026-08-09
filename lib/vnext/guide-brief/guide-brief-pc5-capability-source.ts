import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type { GuideBriefInterpretationPc5BindingV01 } from "@/types/vnext/guide-brief-interpretation";
import type { BrowserOwnerCurrentFocusCapabilityV01 } from "@/types/vnext/guide-brief-interaction";
import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";

import {
  buildSelectedWorkRelationshipsV01,
} from "@/lib/vnext/ai-workplane/selected-work-relationships";
import {
  buildSelectedWorkTimelineV01,
  selectNextSelectedWorkCandidateV01,
  selectSelectedCandidateActionableApplyingDecisionV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import { selectAIWorkplaneChangeCandidateV01 } from "@/lib/vnext/ai-workplane/ai-workplane-view";
import { buildBrowserActionCapabilitySnapshotV01 } from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import { buildSelectedWorkGuideBriefCapabilitySetV01 } from "@/lib/vnext/guide-brief/guide-brief-pc5-capabilities";
import {
  authenticateVNextLocalOperatorSessionV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { readVNextLocalRuntimeClockNowV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  readVNextOperatorPilotSemanticReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "@/lib/vnext/runtime/operator-pilot-workbench-lineage";
import { projectVNextOperatorPilotContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  resolveVNextOperatorStrategicCostAvailabilityV01,
} from "@/lib/vnext/runtime/operator-pilot-strategic-advantage-transfer";
import { readDefaultModelGatewayLocalCapabilityV01 } from "@/lib/vnext/model-gateway/model-gateway";
import { readProjectVerifyReconciliationV01 } from "@/lib/vnext/runtime/project-verify-reconciliation";
import { readProjectVerifyLineageV01 } from "@/lib/vnext/runtime/project-verify-lineage";
import type { SelectedWorkRelationshipQuestionKeyV01 } from "@/types/vnext/selected-work-relationships";

export interface CurrentGuideBriefPc5CapabilityBindingV01 {
  snapshot: ReturnType<typeof buildBrowserActionCapabilitySnapshotV01>;
  selected_work_scope: {
    workspace_id: string;
    project_id: string;
    proposal_id: string;
    proposal_fingerprint: string;
    candidate_id: string;
    candidate_fingerprint: string;
  };
  timeline: ReturnType<typeof buildSelectedWorkTimelineV01>;
  relationships_by_question: ReturnType<
    typeof buildSelectedWorkRelationshipsV01
  > extends infer T
    ? Partial<Record<SelectedWorkRelationshipQuestionKeyV01, T>>
    : never;
  selected_relationship_question_key:
    | SelectedWorkRelationshipQuestionKeyV01
    | null;
}

/**
 * Reloads the exact persisted PC5 inputs and uses the shared descriptor owner.
 * Browser IDs are lookup hints only; every identity/fingerprint is matched to
 * the current authenticated local owner before a snapshot is returned.
 */
export function loadCurrentGuideBriefPc5CapabilityBindingV01(input: {
  request: Request;
  guide: ProjectGuideBriefV02;
  workspace_id: string;
  project_id: string;
  binding: GuideBriefInterpretationPc5BindingV01;
}): CurrentGuideBriefPc5CapabilityBindingV01 | null {
  let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | null = null;
  try {
    assertVNextLocalOperatorRequestBoundaryV01(input.request, {
      mutating: false,
    });
    const config = readVNextLocalOperatorPilotConfigV01();
    if (
      config.workspace_id !== input.workspace_id ||
      config.project_id !== input.project_id ||
      input.guide.identity.workspace_id !== input.workspace_id ||
      input.guide.identity.project_id !== input.project_id ||
      input.guide.identity.active_project_id !== input.project_id
    ) {
      return null;
    }
    db = openVNextLocalOperatorDatabaseV01(config);
    const authentication = authenticateVNextLocalOperatorSessionV01(db, {
      config,
      credential: readVNextLocalOperatorCredentialFromRequestV01(
        input.request,
      ),
    });
    const observedAt = readVNextLocalRuntimeClockNowV01(
      undefined,
      "guidebrief_pc5_capability_rebind",
    );
    const base = readVNextOperatorPilotSemanticReviewV01(db, {
      config,
      proposal_id: input.binding.proposal_id,
      authenticated_session_id: authentication.session.session_id,
      model_capability: readDefaultModelGatewayLocalCapabilityV01(),
      strategic_cost_availability:
        resolveVNextOperatorStrategicCostAvailabilityV01({
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          evaluated_at: observedAt,
        }),
    });
    const read: SemanticReviewProposalDetailV01 = {
      ...base,
      projection_observed_at: observedAt,
      durable_lineage:
        readVNextOperatorPilotProposalDurableLineageV01(db, {
          config,
          proposal: base.proposal,
        }),
      project_continuity: projectVNextOperatorPilotContinuityV01(db, {
        config,
      }),
      project_verify_reconciliation: readProjectVerifyReconciliationV01(
        db,
        {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
          observed_at: observedAt,
        },
      ),
      project_verify_lineage: readProjectVerifyLineageV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        observed_at: observedAt,
        lookup: {
          lookup_kind: "proposal",
          proposal_id: base.proposal.proposal_id,
          expected_fingerprint: base.proposal.integrity.fingerprint,
        },
      }),
    };
    if (
      read.proposal.proposal_id !== input.binding.proposal_id ||
      read.proposal.integrity.fingerprint !==
        input.binding.proposal_fingerprint
    ) {
      return null;
    }
    const selected = selectAIWorkplaneChangeCandidateV01(
      read,
      input.binding.candidate_id,
    );
    if (
      !selected ||
      selected.candidate_fingerprint !==
        input.binding.candidate_fingerprint
    ) {
      return null;
    }
    const timeline = buildSelectedWorkTimelineV01({
      read,
      selected_candidate: selected,
    });
    const defaultRelationships = buildSelectedWorkRelationshipsV01({
      read,
      selected_candidate: selected,
      timeline,
      selected_question_key: null,
    });
    const selectedQuestion =
      input.binding.selected_relationship_question_key ??
      defaultRelationships.selected_question_key;
    if (
      selectedQuestion !== null &&
      !defaultRelationships.questions.some(
        (question) => question.question_key === selectedQuestion,
      )
    ) {
      return null;
    }
    const relationships =
      selectedQuestion === defaultRelationships.selected_question_key
        ? defaultRelationships
        : buildSelectedWorkRelationshipsV01({
            read,
            selected_candidate: selected,
            timeline,
            selected_question_key: selectedQuestion,
          });
    const relationshipsByQuestion = Object.fromEntries(
      defaultRelationships.questions.map(({ question_key }) => [
        question_key,
        question_key === relationships.selected_question_key
          ? relationships
          : buildSelectedWorkRelationshipsV01({
              read,
              selected_candidate: selected,
              timeline,
              selected_question_key: question_key,
            }),
      ]),
    ) as CurrentGuideBriefPc5CapabilityBindingV01["relationships_by_question"];
    const nextDecisionCandidate =
      timeline.current_position.primary_action_owner ===
      "candidate_selection"
        ? selectNextSelectedWorkCandidateV01({
            read,
            selected_candidate: selected,
          })
        : null;
    const applyingDecision = selectedApplyingDecisionV01(
      read,
      selected.candidate.candidate_id,
    );
    const strategicActionsAvailable =
      !read.proposal.strategic_advantage_transfer ||
      read.strategic_analysis.status === "available";
    const decisionEligible =
      timeline.current_position.primary_action_owner === "decision" &&
      strategicActionsAvailable &&
      selected.pilot_admission.decision_allowed.accept;
    const decisionFocus = decisionEligible
      ? ({
          available: true,
          owner_focus_identity: [
            "decision-control",
            selected.candidate.candidate_id,
            selected.candidate_fingerprint,
            applyingDecision,
            "available",
          ].join(":"),
          unavailable_reason: null,
        } satisfies BrowserOwnerCurrentFocusCapabilityV01)
      : null;
    const actionableDecision =
      selectSelectedCandidateActionableApplyingDecisionV01({
        read,
        selected_candidate: selected,
      });
    const transitionPreviewAvailable =
      timeline.current_position.primary_action_owner === "transition" &&
      actionableDecision !== null;
    const transitionScope = actionableDecision
      ? [
          read.proposal.proposal_id,
          read.proposal.integrity.fingerprint,
          selected.candidate.candidate_id,
          selected.candidate_fingerprint,
          actionableDecision.decision_id,
          actionableDecision.integrity.fingerprint,
        ].join("|")
      : null;
    const transitionFocus = transitionScope
      ? ({
          available: true,
          owner_focus_identity: [
            "transition-control",
            transitionScope,
            "preview",
          ].join(":"),
          unavailable_reason: null,
        } satisfies BrowserOwnerCurrentFocusCapabilityV01)
      : null;
    const relationshipScopeKey = [
      read.proposal.workspace_id,
      read.proposal.project_id,
      read.proposal.proposal_id,
      read.proposal.integrity.fingerprint,
      selected.candidate.candidate_id,
      selected.candidate_fingerprint,
    ].join("\u0000");
    const descriptorSet = buildSelectedWorkGuideBriefCapabilitySetV01({
      guide: input.guide,
      read,
      selected,
      timeline,
      relationships,
      relationships_by_question: relationshipsByQuestion,
      relationship_scope_key: relationshipScopeKey,
      next_decision_candidate: nextDecisionCandidate,
      applying_decision: applyingDecision,
      decision_eligible: decisionEligible,
      transition_preview_available: transitionPreviewAvailable,
      decision_current_focus_capability: decisionFocus,
      transition_current_focus_capability: transitionFocus,
      owner_busy: false,
    });
    const snapshot = buildBrowserActionCapabilitySnapshotV01({
      context: descriptorSet.context,
      capabilities: descriptorSet.capabilities,
    });
    if (
      snapshot.fingerprint !==
        input.binding.capability_snapshot_fingerprint
    ) {
      return null;
    }
    return {
      snapshot,
      selected_work_scope: {
        workspace_id: read.proposal.workspace_id,
        project_id: read.proposal.project_id,
        proposal_id: read.proposal.proposal_id,
        proposal_fingerprint: read.proposal.integrity.fingerprint,
        candidate_id: selected.candidate.candidate_id,
        candidate_fingerprint: selected.candidate_fingerprint,
      },
      timeline,
      relationships_by_question: relationshipsByQuestion,
      selected_relationship_question_key:
        relationships.selected_question_key,
    };
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

function selectedApplyingDecisionV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
): "accept" | "supersede" | "retract" {
  const binding = read.proposal.project_verify_lifecycle?.lifecycle_binding;
  if (binding?.selected_candidate.candidate_id !== candidateId) {
    return "accept";
  }
  return binding.selected_record_operation_intent === "supersede"
    ? "supersede"
    : binding.selected_record_operation_intent === "retract"
      ? "retract"
      : "accept";
}
