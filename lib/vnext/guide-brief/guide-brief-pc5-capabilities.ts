import { buildGuideBriefConversationScopeKeyV01 } from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import { createOpaqueGuideBriefInteractionTargetHandleV01 } from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type {
  BrowserActionCapabilityV01,
  BrowserActionRouteKeyV01,
  BrowserOwnerCurrentFocusCapabilityV01,
  GuideBriefInteractionContextV01,
} from "@/types/vnext/guide-brief-interaction";
import type {
  SelectedWorkRelationshipQuestionKeyV01,
  SelectedWorkRelationshipsV01,
} from "@/types/vnext/selected-work-relationships";
import type { SelectedWorkTimelineV01 } from "@/types/vnext/selected-work-timeline";

export interface SelectedWorkGuideBriefCapabilityInputV01 {
  guide: ProjectGuideBriefV02;
  read: SemanticReviewProposalDetailV01;
  selected: SemanticReviewProposalDetailV01["candidates"][number];
  timeline: SelectedWorkTimelineV01;
  relationships: SelectedWorkRelationshipsV01;
  relationships_by_question: Partial<
    Record<
      SelectedWorkRelationshipQuestionKeyV01,
      SelectedWorkRelationshipsV01
    >
  >;
  relationship_scope_key: string;
  next_decision_candidate:
    | SemanticReviewProposalDetailV01["candidates"][number]
    | null;
  applying_decision: "accept" | "supersede" | "retract";
  decision_eligible: boolean;
  transition_preview_available: boolean;
  decision_current_focus_capability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null;
  transition_current_focus_capability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null;
  owner_busy: boolean;
}

export interface SelectedWorkGuideBriefCapabilitySetV01 {
  context: GuideBriefInteractionContextV01;
  capabilities: BrowserActionCapabilityV01[];
  proposal_inspector_href: string;
}

/**
 * The single descriptor composition owner for the already registered PC5
 * Browser families. It creates no adapter, callback, provider material, or
 * authority. Browser and server admission both use this exact pure owner.
 */
export function buildSelectedWorkGuideBriefCapabilitySetV01(
  input: SelectedWorkGuideBriefCapabilityInputV01,
): SelectedWorkGuideBriefCapabilitySetV01 {
  const selectedWorkScope = {
    workspace_id: input.read.proposal.workspace_id,
    project_id: input.read.proposal.project_id,
    proposal_id: input.read.proposal.proposal_id,
    proposal_fingerprint: input.read.proposal.integrity.fingerprint,
    candidate_id: input.selected.candidate.candidate_id,
    candidate_fingerprint: input.selected.candidate_fingerprint,
  };
  const scopeKey = buildGuideBriefConversationScopeKeyV01({
    guide: input.guide,
    question: "",
    selected_work_scope: selectedWorkScope,
    timeline: input.timeline,
    relationships: input.relationships_by_question,
    selected_relationship_question_key:
      input.relationships.selected_question_key,
    conversation_context: null,
  });
  const context: GuideBriefInteractionContextV01 = {
    pc4_scope_key: scopeKey,
    workspace_id: selectedWorkScope.workspace_id,
    project_id: selectedWorkScope.project_id,
    project_context: input.guide.identity.project_context,
    active_project_id: input.guide.identity.active_project_id,
    proposal_id: selectedWorkScope.proposal_id,
    proposal_fingerprint: selectedWorkScope.proposal_fingerprint,
    candidate_id: selectedWorkScope.candidate_id,
    candidate_fingerprint: selectedWorkScope.candidate_fingerprint,
    pc2: {
      current_item_id: input.timeline.current_item_id,
      stage: input.timeline.current_position.stage,
      primary_action_owner:
        input.timeline.current_position.primary_action_owner,
      material_identity: `${scopeKey}:pc2`,
    },
    pc3: {
      selected_question_key: input.relationships.selected_question_key,
      highlighted_connection_id:
        input.relationships.highlighted_connection_id,
      material_identity: `${scopeKey}:pc3`,
    },
    owner_state: {
      busy: input.owner_busy,
      decision_applying_kind:
        input.timeline.current_position.primary_action_owner === "decision"
          ? input.applying_decision
          : null,
      decision_eligible: input.decision_eligible,
      transition_preview_available:
        input.transition_preview_available,
    },
  };
  const capabilities: BrowserActionCapabilityV01[] = [];
  const targetScope = {
    workspace_id: selectedWorkScope.workspace_id,
    project_id: selectedWorkScope.project_id,
    proposal_id: selectedWorkScope.proposal_id,
    proposal_fingerprint: selectedWorkScope.proposal_fingerprint,
    candidate_id: selectedWorkScope.candidate_id,
    candidate_fingerprint: selectedWorkScope.candidate_fingerprint,
  };
  const targetHandle = (
    actionKey: BrowserActionCapabilityV01["action_key"],
    routeKey: BrowserActionRouteKeyV01,
    targetCandidateId = selectedWorkScope.candidate_id,
    targetCandidateFingerprint = selectedWorkScope.candidate_fingerprint,
  ) =>
    createOpaqueGuideBriefInteractionTargetHandleV01([
      scopeKey,
      actionKey,
      routeKey,
      targetCandidateId,
      targetCandidateFingerprint,
    ]);

  if (
    input.timeline.current_position.primary_action_owner ===
      "candidate_selection" &&
    input.next_decision_candidate &&
    !input.owner_busy
  ) {
    const next = input.next_decision_candidate;
    capabilities.push(
      capabilityV01({
        actionKey: "selected_work.select_next_candidate",
        handle: targetHandle(
          "selected_work.select_next_candidate",
          "next_candidate",
          next.candidate.candidate_id,
          next.candidate_fingerprint,
        ),
        label: "Show the next change",
        preview: "Select the exact next unresolved change.",
        owner: "selected_candidate_surface",
        effectClass: "ui_selection",
        routeKey: "next_candidate",
        scopeKey,
        ownerIdentity: [
          "candidate-selection",
          next.candidate.candidate_id,
          next.candidate_fingerprint,
        ].join(":"),
        destination: "#selected-work-next-candidate",
        targetScope: {
          ...targetScope,
          candidate_id: next.candidate.candidate_id,
          candidate_fingerprint: next.candidate_fingerprint,
        },
      }),
    );
  }

  if (!input.owner_busy) {
    for (const question of input.relationships.questions) {
      const routeKey = relationshipRouteKeyV01(question.question_key);
      capabilities.push(
        capabilityV01({
          actionKey: "relationship.select_question",
          handle: targetHandle("relationship.select_question", routeKey),
          label: relationshipCommandLabelV01(question.question_key),
          preview:
            "Show the exact currently advertised relationship question.",
          owner: "pc3_relationship_surface",
          effectClass: "ui_selection",
          routeKey,
          scopeKey,
          ownerIdentity: `${input.relationship_scope_key}:${question.question_key}`,
          destination: "#selected-work-relationships",
          targetScope,
        }),
      );
    }
  }

  const currentActionOwner =
    input.timeline.current_position.primary_action_owner;
  const ownerFocusCapability: BrowserOwnerCurrentFocusCapabilityV01 | null =
    currentActionOwner === "candidate_selection"
      ? {
          available:
            Boolean(input.next_decision_candidate) && !input.owner_busy,
          owner_focus_identity: [
            "candidate-selection-control",
            input.next_decision_candidate?.candidate.candidate_id ??
              "unavailable",
            input.next_decision_candidate?.candidate_fingerprint ??
              "unavailable",
            input.owner_busy ? "busy" : "available",
          ].join(":"),
          unavailable_reason: input.owner_busy
            ? "The candidate-selection control is busy."
            : input.next_decision_candidate
              ? null
              : "No exact next candidate can be focused.",
        }
      : currentActionOwner === "decision"
        ? input.decision_current_focus_capability
        : currentActionOwner === "transition"
          ? input.transition_current_focus_capability
          : null;
  if (ownerFocusCapability?.available && !input.owner_busy) {
    capabilities.push(
      capabilityV01({
        actionKey: "surface.open_current_action",
        handle: targetHandle(
          "surface.open_current_action",
          "current_action",
        ),
        label: "Take me to the current action",
        preview:
          "Focus the existing current action without activating it.",
        owner: "pc2_current_action_surface",
        effectClass: "navigation",
        routeKey: "current_action",
        scopeKey,
        ownerIdentity: [
          input.timeline.current_item_id,
          currentActionOwner,
          input.timeline.current_position.destination ?? "local-owner",
          ownerFocusCapability.owner_focus_identity,
        ].join(":"),
        destination: input.timeline.current_position.destination,
        targetScope,
      }),
    );
  }

  capabilities.push(
    capabilityV01({
      actionKey: "panel.open_advanced_review",
      handle: targetHandle(
        "panel.open_advanced_review",
        "advanced_review",
      ),
      label: "Open advanced review",
      preview: "Open the existing Advanced review disclosure and focus it.",
      owner: "advanced_review_surface",
      effectClass: "navigation",
      routeKey: "advanced_review",
      scopeKey,
      ownerIdentity: `${scopeKey}:advanced-review`,
      destination: "#selected-work-advanced",
      targetScope,
    }),
    capabilityV01({
      actionKey: "inspector.open_selected_work",
      handle: targetHandle(
        "inspector.open_selected_work",
        "selected_work_inspector",
      ),
      label: "Open exact details",
      preview: "Open the exact registered Inspector destination.",
      owner: "inspector_surface",
      effectClass: "navigation",
      routeKey: "selected_work_inspector",
      scopeKey,
      ownerIdentity: createSharedInspectorHrefV01({
        target_kind: "episode_delta_proposal",
        record_id: selectedWorkScope.proposal_id,
        expected_fingerprint: selectedWorkScope.proposal_fingerprint,
      }),
      destination: createSharedInspectorHrefV01({
        target_kind: "episode_delta_proposal",
        record_id: selectedWorkScope.proposal_id,
        expected_fingerprint: selectedWorkScope.proposal_fingerprint,
      }),
      targetScope,
    }),
  );

  if (input.decision_eligible && !input.owner_busy) {
    const routeKey =
      input.applying_decision === "accept"
        ? "decision_accept"
        : input.applying_decision === "supersede"
          ? "decision_supersede"
          : "decision_retract";
    capabilities.push(
      capabilityV01({
        actionKey: "decision.prepare_applying",
        handle: targetHandle("decision.prepare_applying", routeKey),
        label:
          input.applying_decision === "accept"
            ? "Prepare an accept decision"
            : input.applying_decision === "supersede"
              ? "Prepare a replace decision"
              : "Prepare a remove decision",
        preview:
          "Prepare the currently valid applying choice in the existing decision form. Nothing will be saved.",
        owner: "review_decision_form",
        effectClass: "prepare",
        routeKey,
        scopeKey,
        ownerIdentity: [
          selectedWorkScope.candidate_id,
          selectedWorkScope.candidate_fingerprint,
          input.applying_decision,
          "eligible",
        ].join(":"),
        destination: "#selected-work-decision",
        targetScope,
        confirmationPolicy: "owner_preparation_only",
      }),
    );
  }

  if (input.transition_preview_available && !input.owner_busy) {
    capabilities.push(
      capabilityV01({
        actionKey: "transition.prepare_preview",
        handle: targetHandle(
          "transition.prepare_preview",
          "transition_preview",
        ),
        label: "Show what would change before applying",
        preview:
          "Ask the existing project-change owner for one read-only impact preview.",
        owner: "semantic_transition_actions",
        effectClass: "read",
        routeKey: "transition_preview",
        scopeKey,
        ownerIdentity: `${scopeKey}:transition-preview:available`,
        destination: "#selected-work-transition",
        targetScope,
        confirmationPolicy: "read_only_owner_preview",
      }),
    );
  }

  return {
    context,
    capabilities,
    proposal_inspector_href: createSharedInspectorHrefV01({
      target_kind: "episode_delta_proposal",
      record_id: selectedWorkScope.proposal_id,
      expected_fingerprint: selectedWorkScope.proposal_fingerprint,
    }),
  };
}

function capabilityV01(input: {
  actionKey: BrowserActionCapabilityV01["action_key"];
  handle: string;
  label: string;
  preview: string;
  owner: BrowserActionCapabilityV01["owner"];
  effectClass: BrowserActionCapabilityV01["effect_class"];
  routeKey: BrowserActionRouteKeyV01;
  scopeKey: string;
  ownerIdentity: string;
  destination: string | null;
  targetScope: BrowserActionCapabilityV01["target_scope"];
  confirmationPolicy?: BrowserActionCapabilityV01["confirmation_policy"];
}): BrowserActionCapabilityV01 {
  return {
    capability_version: "browser_action_capability.v0.1",
    action_key: input.actionKey,
    target_handle: input.handle,
    public_label: input.label,
    public_effect_preview: input.preview,
    owner: input.owner,
    effect_class: input.effectClass,
    availability: "available",
    unavailable_reason: null,
    interaction_scope_key: input.scopeKey,
    owner_actionability_identity: input.ownerIdentity,
    confirmation_policy:
      input.confirmationPolicy ?? "immediate_current_scope",
    destination: input.destination,
    may_propose: true,
    may_execute_immediately: true,
    route_key: input.routeKey,
    target_scope: input.targetScope,
    authority: {
      projection_only: true,
      durable: false,
      semantic_authority: false,
      transition_authority: false,
      execution_authority: false,
      external_action_authority: false,
    },
  };
}

export function relationshipRouteKeyV01(
  questionKey: SelectedWorkRelationshipQuestionKeyV01,
): BrowserActionRouteKeyV01 {
  return questionKey === "support_and_source"
    ? "relationship_support_and_source"
    : questionKey === "candidate_and_decision"
      ? "relationship_candidate_and_decision"
      : questionKey === "blocker_and_conflict"
        ? "relationship_blocker_and_conflict"
        : questionKey === "decision_and_project_change"
          ? "relationship_decision_and_project_change"
          : "relationship_project_change_and_later_outcome";
}

function relationshipCommandLabelV01(
  questionKey: SelectedWorkRelationshipQuestionKeyV01,
): string {
  return questionKey === "support_and_source"
    ? "Show the source connection"
    : questionKey === "candidate_and_decision"
      ? "Show the decision connection"
      : questionKey === "blocker_and_conflict"
        ? "Show the blocker"
        : questionKey === "decision_and_project_change"
          ? "Show the project change connection"
          : "Show the later outcome";
}
