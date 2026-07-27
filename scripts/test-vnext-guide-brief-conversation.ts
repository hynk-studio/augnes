import assert from "node:assert/strict";

import {
  appendGuideBriefConversationTurnV01,
  buildGuideBriefConversationPlanV01,
  buildGuideBriefConversationScopeKeyV01,
  createGuideBriefConversationContextV01,
  normalizeGuideBriefConversationQuestionV01,
  scopeGuideBriefConversationContextV01,
  selectVisibleGuideBriefConversationAnswerV01,
} from "../lib/vnext/guide-brief/guide-brief-conversation-plan";
import type {
  GuideBriefConversationIntentV01,
  GuideBriefConversationPlanInputV01,
  GuideBriefConversationSelectedWorkScopeV01,
} from "../types/vnext/guide-brief-conversation";
import type { ProjectGuideBriefV02 } from "../types/vnext/guide-brief";
import type {
  SelectedWorkRelationshipQuestionKeyV01,
  SelectedWorkRelationshipsV01,
} from "../types/vnext/selected-work-relationships";
import type { SelectedWorkTimelineV01 } from "../types/vnext/selected-work-timeline";

const PROJECT_A = "project:11111111-1111-4111-8111-111111111111";
const PROJECT_B = "project:22222222-2222-4222-8222-222222222222";
const WORKSPACE_A = "workspace:conversation-a";
const WORKSPACE_B = "workspace:conversation-b";
const PROPOSAL_A = "episode-delta-proposal:aaaaaaaaaaaaaaaaaaaaaaaa";
const PROPOSAL_B = "episode-delta-proposal:bbbbbbbbbbbbbbbbbbbbbbbb";
const CANDIDATE_A = "proposal-candidate:aaaaaaaaaaaaaaaaaaaaaaaa";
const CANDIDATE_B = "proposal-candidate:bbbbbbbbbbbbbbbbbbbbbbbb";
const FP_A = `sha256:${"a".repeat(64)}`;
const FP_B = `sha256:${"b".repeat(64)}`;
const FP_C = `sha256:${"c".repeat(64)}`;

function guide(overrides: {
  project_id?: string;
  workspace_id?: string;
  active_project_id?: string | null;
  project_context?: "current" | "viewed";
  source_status?: ProjectGuideBriefV02["source_status"];
  source_identity?: string;
  attention_required?: boolean;
  attention_reason?: string | null;
  recent_change?: string | null;
  blocker?: string | null;
  judgment?: string | null;
  primary_label?: string;
  primary_reason?: string;
} = {}): ProjectGuideBriefV02 {
  const projectId = overrides.project_id ?? PROJECT_A;
  const attentionRequired = overrides.attention_required ?? true;
  const blocker = overrides.blocker === undefined
    ? "A current safeguard blocks the saved project update."
    : overrides.blocker;
  const judgment = overrides.judgment === undefined
    ? "Should this exact change be accepted?"
    : overrides.judgment;
  const sourceIdentity = overrides.source_identity ?? "source-a";
  const projectContext = overrides.project_context ?? "current";
  const humanAttention = {
    required: attentionRequired,
    category: attentionRequired ? "pending_review" as const : null,
    blocked_or_awaiting: attentionRequired
      ? overrides.attention_reason ?? "A consequential review is waiting."
      : null,
    recommended_next_step: attentionRequired ? "Review suggested change" : null,
    projection_only: true as const,
    authority_granted: false as const,
  };
  const sourceRef = {
    ref_id: `project-state:${sourceIdentity}`,
    kind: "project_state" as const,
    label: "Current project read model",
    href: "/",
  };
  const observed = [{
    item_id: `observed:${sourceIdentity}`,
    statement: "The selected project has a saved change awaiting review.",
    source_refs: [sourceRef.ref_id],
  }];
  const inferred = [{
    item_id: `inferred:${sourceIdentity}`,
    statement: "Reviewing the selected change is the bounded next step.",
    supporting_observation_ids: [observed[0]!.item_id],
    confidence: "high" as const,
    caveats: ["This is bounded interpretation, not project truth."],
  }];
  const suggested = [{
    item_id: `suggested:${sourceIdentity}`,
    label: overrides.primary_label ?? "Review suggested change",
    reason: overrides.primary_reason ?? "A consequential decision remains unresolved.",
    href: "/workbench/semantic-review/example",
    action_ref: null,
    blockers: judgment ? [judgment] : [],
    source_refs: [sourceRef.ref_id],
    executes: false as const,
  }];
  const needsJudgment = judgment
    ? [{
        item_id: `judgment:${sourceIdentity}`,
        question: judgment,
        why_it_matters: "The project cannot change until the user decides.",
        blocked: ["Saved project update"],
        source_refs: [sourceRef.ref_id],
        resolved: false as const,
      }]
    : [];
  const primaryGuidance = {
    label: overrides.primary_label ?? "Review suggested change",
    reason: overrides.primary_reason ?? "A consequential decision remains unresolved.",
    href: "/workbench/semantic-review/example",
    action_ref: null,
    action: {
      kind: "link" as const,
      label: overrides.primary_label ?? "Review suggested change",
      href: "/workbench/semantic-review/example",
      entry_state: "pending_review",
    },
    requires_user_judgment: Boolean(judgment),
    source_refs: [sourceRef.ref_id],
    executes: false as const,
  };
  const blankProjection = {
    blank_state_view_version: "blank_state_view.v0.1" as const,
    guide_version: "guide_brief.v0.2" as const,
    source_status: overrides.source_status ?? "live_current_project",
    project_context: projectContext,
    focus: attentionRequired ? "attention_required" as const : "ready_to_continue" as const,
    route_mode: projectContext === "viewed" ? "viewed_project" as const : "canonical" as const,
    project_name: "Conversation project",
    project_context_label: projectContext === "viewed" ? "Viewed project" as const : "Current project" as const,
    heading: attentionRequired ? "A decision needs you" : "Ready to continue",
    situation: "The current project has one bounded selected change.",
    material_note: blocker,
    continuity_summary: attentionRequired
      ? "One consequential item needs attention."
      : "No consequential intervention is required.",
    known_attention_count: attentionRequired ? 1 : 0,
    attention_count_status: "complete" as const,
    known_continuity_item_count: 1,
    locally_omitted_item_count: 0,
    source_omitted_attention_count: 0,
    source_attention_destination: null,
    highlighted_item: {
      item_id: "continuity:selected",
      source_family: "project_attention" as const,
      work_name: "Review suggested change",
      meaningful_state: "A bounded suggestion awaits review.",
      requires_human_attention: attentionRequired,
      attention_category: attentionRequired ? "pending_review" as const : null,
      last_meaningful_change: overrides.recent_change === null
        ? null
        : {
            summary: overrides.recent_change ?? "A new source-bound suggestion became available.",
            occurred_at: "2026-07-27T00:00:00.000Z",
          },
      consequential_detail: blocker,
      next_action: attentionRequired ? primaryGuidance.action : null,
      secondary_action: attentionRequired
        ? null
        : { label: "Open AI Workplane", href: "/workbench/semantic-review" },
      verification: null,
      exact_detail_href: "/workbench/inspector",
      projection_only: true as const,
      semantic_authority_granted: false as const,
    },
    continuity_items: [],
    primary_action: attentionRequired ? primaryGuidance.action : null,
    project_management_emphasized: false,
    why_this_is_next: {
      observed: observed.map((item) => item.statement),
      inferred: inferred.map((item) => ({
        statement: item.statement,
        caveats: item.caveats,
      })),
      needs_user_judgment: needsJudgment.map((item) => item.question),
    },
    projection_only: true as const,
    semantic_authority_granted: false as const,
  };
  const coordinate = {
    focus: blankProjection.focus,
    goal: "Keep the project meaning current without bypassing review.",
    work_status: attentionRequired ? "User attention required" : "Ready to continue",
    result_available: true,
    result_summary: "The source work completed; usefulness is not established.",
    verification: { passed: 2, failed: 0, skipped: 1 },
    material_blocker_or_uncertainty: blocker,
    unresolved_user_judgment: judgment,
    recent_meaningful_change: overrides.recent_change === undefined
      ? "A new source-bound suggestion became available."
      : overrides.recent_change,
    human_attention: humanAttention,
    delegated_work: null,
  };
  const aiProjection = {
    status: "available" as const,
    project_name: "Conversation project",
    current_coordinate: blankProjection.heading,
    current_goal: coordinate.goal,
    important_constraints: ["Do not apply a project change without authorization."],
    work_or_result_status: coordinate.work_status,
    material_blocker_or_judgment: judgment ?? blocker,
    unresolved_user_judgments: needsJudgment.map((item) => item.question),
    recommended_review_focus: primaryGuidance.label,
    exact_detail_href: "/workbench/inspector",
    human_attention: humanAttention,
    delegated_work: null,
  };
  const chatgptProjection = {
    project_name: "Conversation project",
    project_context: projectContext,
    source_status: overrides.source_status ?? "live_current_project" as const,
    summary: blankProjection.situation,
    goal: coordinate.goal,
    status: coordinate.work_status,
    constraints: aiProjection.important_constraints,
    required_checks: ["Run focused verification"],
    non_goals: ["Do not create authority"],
    material_blocker_or_uncertainty: blocker,
    unresolved_user_judgment: judgment,
    observed,
    inferred,
    suggested,
    needs_user_judgment: needsJudgment,
    primary_guidance: primaryGuidance,
    source_refs: [sourceRef],
    human_attention: humanAttention,
    delegated_work: null,
  };
  const codexProjection = {
    guide_version: "guide_brief.v0.2" as const,
    projection_version: "guide_brief_codex_projection.v0.2" as const,
    status: "available" as const,
    workspace_id: overrides.workspace_id ?? WORKSPACE_A,
    project_id: projectId,
    project_name: "Conversation project",
    current_goal: coordinate.goal,
    current_coordinate: blankProjection.heading,
    constraints: aiProjection.important_constraints,
    required_checks: chatgptProjection.required_checks,
    non_goals: chatgptProjection.non_goals,
    unresolved_user_judgments: needsJudgment.map((item) => item.question),
    important_risk_or_gap: blocker,
    suggested_next_action: primaryGuidance.label,
    human_attention: humanAttention,
    source_refs: [sourceRef.ref_id],
    packet_binding: null,
    task_context_packet_delivered_separately: true as const,
    guide_does_not_override_packet: true as const,
    suggestions_are_not_commands: true as const,
    authority_remains_with_user_and_core: true as const,
    can_approve: false as const,
    can_execute_codex: false as const,
    can_grant_host_permission: false as const,
    unavailable_reason: null,
  };
  return {
    runtime: "augnes_current_project",
    guide_version: "guide_brief.v0.2",
    generated_at: "2026-07-27T00:00:00.000Z",
    request: {
      scope: "project:augnes",
      route_mode: projectContext === "viewed" ? "viewed_project" : "canonical",
      requested_project_id: projectContext === "viewed" ? projectId : null,
    },
    identity: {
      workspace_id: overrides.workspace_id ?? WORKSPACE_A,
      project_id: projectId,
      project_display_name: "Conversation project",
      project_context: projectContext,
      active_project_id: overrides.active_project_id === undefined
        ? PROJECT_A
        : overrides.active_project_id,
      root_resolution: "available",
    },
    source_status: overrides.source_status ?? "live_current_project",
    gaps: overrides.source_status === "partial" ? ["The bounded source read is incomplete."] : [],
    coordinate,
    observed,
    inferred,
    suggested,
    needs_user_judgment: needsJudgment,
    primary_guidance: primaryGuidance,
    source_refs: [sourceRef],
    projections: {
      blank_state: blankProjection,
      ai_workplane: aiProjection,
      chatgpt: chatgptProjection,
      codex: codexProjection,
    },
    authority: {
      source_of_truth: false,
      can_commit_or_reject_state: false,
      can_record_proof: false,
      can_create_evidence: false,
      can_update_work: false,
      can_mutate_memory: false,
      can_apply_project_perspective: false,
      can_approve: false,
      can_transition: false,
      can_publish_external: false,
      can_merge: false,
      can_retry: false,
      can_call_github: false,
      can_call_openai_or_provider: false,
      can_execute_codex: false,
      can_create_branch_or_pr: false,
      can_send_handoff: false,
      can_launch_autonomy: false,
      can_write_db: false,
      can_create_ui_action: false,
      can_grant_host_permission: false,
      notes: ["GuideBrief is projection-only."],
    },
    safety: {
      contains_private_absolute_paths: false,
      contains_credentials: false,
      contains_raw_provider_output: false,
      contains_hidden_reasoning: false,
      contains_raw_transcripts: false,
      provider_or_network_calls: false,
      persisted: false,
    },
    limits: {
      observed: 8,
      inferred: 4,
      suggested: 3,
      needs_user_judgment: 3,
      source_refs: 16,
      recent_changes: 3,
      text_bytes: 1_024,
      serialized_bytes: 64 * 1_024,
    },
  };
}

function timeline(overrides: {
  candidate_id?: string;
  candidate_fingerprint?: string;
  stage?: SelectedWorkTimelineV01["current_position"]["stage"];
  current_item_id?: string;
  primary_action_owner?: SelectedWorkTimelineV01["current_position"]["primary_action_owner"];
  summary?: string;
  next?: string;
} = {}): SelectedWorkTimelineV01 {
  const stage = overrides.stage ?? "awaiting_application";
  const currentId = overrides.current_item_id ?? `current:${stage}`;
  const candidateId = overrides.candidate_id ?? CANDIDATE_A;
  const candidateFingerprint = overrides.candidate_fingerprint ?? FP_A;
  const sourceKind =
    stage === "project_updated" ||
    stage === "later_outcome_available" ||
    stage === "later_outcome_reviewed"
      ? "project_update" as const
      : stage === "review_focused"
        ? "candidate" as const
        : "decision" as const;
  const owner = overrides.primary_action_owner ??
    (stage === "review_focused"
      ? "decision"
      : stage === "awaiting_application" || stage === "transition_blocked"
        ? "transition"
        : "none");
  return {
    timeline_version: "selected_work_timeline.v0.1",
    selected_work: {
      title: "Keep reviewed project context",
      operation_label: "Add",
      current_meaning: "Preserve the reviewed context for later work.",
      selected_candidate_id: candidateId,
      selected_candidate_fingerprint: candidateFingerprint,
      selected_candidate_scope: true,
    },
    items: [{
      item_id: currentId,
      stage,
      basis: stage === "project_updated"
        ? "authorized_change"
        : stage.startsWith("later_outcome")
          ? "later_outcome"
          : stage === "review_focused"
            ? "bounded_interpretation"
            : "user_decision",
      status: stage === "transition_blocked" ? "blocked" : "current",
      title: stage.replaceAll("_", " "),
      summary: overrides.summary ?? (
        stage === "awaiting_application"
          ? "The decision is saved, but the project has not changed."
          : stage === "decision_recorded"
            ? "An earlier decision is recorded, but current review is required."
            : stage === "transition_blocked"
              ? "The saved decision cannot be applied because a current safeguard reports a conflict."
              : stage === "project_updated"
                ? "An authorized project update is recorded for this exact change."
                : stage.startsWith("later_outcome")
                  ? "Later work used context compiled from the project update."
                  : "The selected suggestion is ready for review."
      ),
      meaning_change: stage === "project_updated"
        ? "Reviewed intent became saved project state through an authorized update."
        : "The selected work moved to its current exact position.",
      occurred_at: "2026-07-27T00:01:00.000Z",
      time_status: "exact",
      order_basis: "source_lineage",
      source_refs: [{
        source_kind: sourceKind,
        record_id: sourceKind === "candidate" ? candidateId : `${sourceKind}:exact`,
        record_fingerprint: sourceKind === "candidate" ? candidateFingerprint : FP_B,
      }],
      destination: owner === "decision"
        ? "#selected-work-decision"
        : owner === "transition"
          ? "#selected-work-transition"
          : null,
      projection_only: true,
      grants_semantic_authority: false,
    }],
    bounded_item_count: 1,
    omitted_item_count: 0,
    current_item_id: currentId,
    current_position: {
      stage,
      title: stage.replaceAll("_", " "),
      summary: overrides.summary ?? (
        stage === "awaiting_application"
          ? "The decision is saved, but the project has not changed."
          : stage === "transition_blocked"
            ? "A current safeguard blocks the project update."
            : "The selected work is at its exact current position."
      ),
      next_meaningful_step: overrides.next ?? (
        owner === "decision"
          ? "Review this exact suggestion."
          : owner === "transition"
            ? "Use the existing project-update controls."
            : "Return to the work list when ready."
      ),
      primary_action_owner: owner,
      destination: owner === "decision"
        ? "#selected-work-decision"
        : owner === "transition"
          ? "#selected-work-transition"
          : null,
    },
    authority: {
      projection_only: true,
      rebuildable: true,
      writes_database: false,
      creates_timeline_record: false,
      creates_decision: false,
      authorizes_transition: false,
      applies_transition: false,
      establishes_truth: false,
      establishes_verified_success: false,
      changes_project_state: false,
      changes_later_context: false,
      calls_model_or_provider: false,
      performs_external_action: false,
    },
  };
}

function relationship(
  key: SelectedWorkRelationshipQuestionKeyV01,
  overrides: {
    availability?: SelectedWorkRelationshipsV01["answer_availability"];
    support_status?: "exact" | "partial" | "conflicting";
    basis?: SelectedWorkRelationshipsV01["connections"][number]["basis"];
    explanation?: string;
    uncertainty?: string | null;
    exact_refs?: SelectedWorkRelationshipsV01["connections"][number]["exact_refs"];
    stage?: SelectedWorkTimelineV01["current_position"]["stage"];
    current_item_id?: string;
    candidate_id?: string;
    candidate_fingerprint?: string;
  } = {},
): SelectedWorkRelationshipsV01 {
  const availability = overrides.availability ?? "available";
  const exactRefs = overrides.exact_refs ?? [{
    source_kind: "run_receipt",
    record_id: "run-receipt:exact-source",
    record_fingerprint: FP_B,
  }];
  const hasConnection = availability !== "unavailable";
  return {
    relationships_version: "selected_work_relationships.v0.1",
    selected_work_anchor: {
      title: "Keep reviewed project context",
      selected_candidate_id: overrides.candidate_id ?? CANDIDATE_A,
      selected_candidate_fingerprint:
        overrides.candidate_fingerprint ?? FP_A,
      timeline_stage: overrides.stage ?? "awaiting_application",
      timeline_current_item_id:
        overrides.current_item_id ??
        `current:${overrides.stage ?? "awaiting_application"}`,
      timeline_remains_current_position_owner: true,
    },
    questions: [{ question_key: key, label: questionLabel(key), source_supported: true }],
    selected_question_key: key,
    selected_question_label: questionLabel(key),
    answer_availability: availability,
    highlighted_connection_id: hasConnection ? `connection-${key}-1` : null,
    connections: hasConnection ? [{
      connection_id: `connection-${key}-1`,
      relation_kind: key === "support_and_source"
        ? "supported_by"
        : key === "candidate_and_decision"
          ? "decided_by"
          : key === "blocker_and_conflict"
            ? "blocked_by"
            : key === "decision_and_project_change"
              ? "applied_as"
              : "used_by_later_work",
      source_role: key === "candidate_and_decision" ? "selected_suggestion" : "source_work",
      target_role: key === "project_change_and_later_outcome"
        ? "later_work"
        : key === "decision_and_project_change"
          ? "saved_project_state"
          : "selected_suggestion",
      title: questionLabel(key),
      explanation: overrides.explanation ?? (
        key === "support_and_source"
          ? "An exact saved source result is bound to this selected suggestion."
          : key === "candidate_and_decision"
            ? "The exact saved decision is bound to this selected suggestion."
            : key === "blocker_and_conflict"
              ? "A current safeguard reports an unresolved exact conflict."
              : key === "decision_and_project_change"
                ? "The exact decision produced an authorized saved project update."
                : "Later work used context compiled from this exact project update."
      ),
      why_it_matters_now: key === "project_change_and_later_outcome"
        ? "Later use proves a connection, not usefulness or correctness."
        : "This explains the current connection without creating authority.",
      basis: overrides.basis ?? (
        key === "candidate_and_decision"
          ? "user_decision"
          : key === "blocker_and_conflict"
            ? "blocker_or_conflict"
            : key === "decision_and_project_change"
              ? "authorized_project_change"
              : key === "project_change_and_later_outcome"
                ? "later_outcome"
                : "observed_source"
      ),
      support_status: overrides.support_status ?? (
        availability === "partial" ? "partial" : availability === "conflicted" ? "conflicting" : "exact"
      ),
      uncertainty_or_conflict: overrides.uncertainty === undefined
        ? availability === "partial"
          ? "The bounded source read is incomplete."
          : availability === "conflicted"
            ? "An exact conflict remains unresolved."
            : null
        : overrides.uncertainty,
      exact_refs: exactRefs,
      destination: key === "blocker_and_conflict"
        ? "#selected-work-transition"
        : "#selected-work-advanced",
      projection_only: true,
      grants_semantic_authority: false,
    }] : [],
    visible_connection_count: hasConnection ? 1 : 0,
    known_connection_count: hasConnection ? 1 : 0,
    locally_omitted_connection_count: 0,
    completeness: {
      status: availability === "available" ? "complete" : availability,
      upstream_incomplete: availability === "partial" || availability === "unavailable",
      omitted_source_count_known: false,
      omitted_source_count: null,
      summary: availability === "available"
        ? "The known bounded connection is available."
        : availability === "partial"
          ? "Known connections are shown, but the bounded source read is not exhaustive."
          : availability === "conflicted"
            ? "Known connections are shown, and an exact conflict remains unresolved."
            : "No exact source-supported connection is available.",
    },
    suggested_destinations: hasConnection
      ? [{ label: "Open advanced exact review", href: "#selected-work-advanced", secondary_only: true }]
      : [],
    authority: {
      projection_only: true,
      rebuildable: true,
      writes_database: false,
      creates_relation_record: false,
      creates_evidence: false,
      accepts_evidence: false,
      establishes_claim_truth: false,
      creates_decision: false,
      authorizes_transition: false,
      applies_transition: false,
      selects_current_position: false,
      changes_timeline_order: false,
      changes_project_state: false,
      changes_later_context: false,
      calls_model_or_provider: false,
      performs_external_action: false,
    },
  };
}

function questionLabel(key: SelectedWorkRelationshipQuestionKeyV01): string {
  return {
    support_and_source: "What supports this suggestion?",
    candidate_and_decision: "What exact decision is bound to this change?",
    blocker_and_conflict: "Why is the project update blocked?",
    decision_and_project_change: "What project change did this decision produce?",
    project_change_and_later_outcome: "What later work used the resulting context?",
  }[key];
}

function planInput(overrides: Partial<GuideBriefConversationPlanInputV01> = {}): GuideBriefConversationPlanInputV01 {
  const selectedGuide = overrides.guide ?? guide();
  const selectedTimeline = overrides.timeline === undefined
    ? timeline()
    : overrides.timeline;
  const selectedScope =
    overrides.selected_work_scope === undefined
      ? selectedTimeline
        ? {
            workspace_id: selectedGuide.identity.workspace_id!,
            project_id: selectedGuide.identity.project_id!,
            proposal_id: PROPOSAL_A,
            proposal_fingerprint: FP_B,
            candidate_id:
              selectedTimeline.selected_work.selected_candidate_id,
            candidate_fingerprint:
              selectedTimeline.selected_work.selected_candidate_fingerprint,
          } as GuideBriefConversationSelectedWorkScopeV01
        : null
      : overrides.selected_work_scope;
  const relationshipDefaults = selectedTimeline
    ? Object.fromEntries(
        ([
          "support_and_source",
          "candidate_and_decision",
          "blocker_and_conflict",
          "decision_and_project_change",
          "project_change_and_later_outcome",
        ] as SelectedWorkRelationshipQuestionKeyV01[]).map((key) => [
          key,
          relationship(key, {
            availability:
              key === "blocker_and_conflict" ? "conflicted" : "available",
            stage: selectedTimeline.current_position.stage,
            current_item_id: selectedTimeline.current_item_id,
            candidate_id:
              selectedTimeline.selected_work.selected_candidate_id,
            candidate_fingerprint:
              selectedTimeline.selected_work.selected_candidate_fingerprint,
          }),
        ]),
      ) as Partial<
        Record<
          SelectedWorkRelationshipQuestionKeyV01,
          SelectedWorkRelationshipsV01
        >
      >
    : {};
  const selectedRelationships =
    overrides.relationships === undefined
      ? relationshipDefaults
      : overrides.relationships;
  const selectedRelationshipQuestion =
    overrides.selected_relationship_question_key !== undefined
      ? overrides.selected_relationship_question_key
      : selectedRelationships?.support_and_source
        ? "support_and_source"
        : (Object.keys(selectedRelationships ?? {})[0] as
            | SelectedWorkRelationshipQuestionKeyV01
            | undefined) ?? null;
  return {
    guide: selectedGuide,
    question: overrides.question ?? "What is happening now?",
    guide_source_fingerprint:
      overrides.guide_source_fingerprint === undefined
        ? FP_C
        : overrides.guide_source_fingerprint,
    selected_work_scope: selectedScope,
    timeline: selectedTimeline,
    relationships: selectedRelationships,
    selected_relationship_question_key: selectedRelationshipQuestion,
    conversation_context: overrides.conversation_context ?? null,
  };
}

const routingCases: Array<{
  intent: GuideBriefConversationIntentV01;
  questions: string[];
}> = [
  { intent: "current_situation", questions: ["What is happening now?", "Where are things now?"] },
  { intent: "meaningful_change", questions: ["What changed?", "What is the latest meaningful change?"] },
  { intent: "human_attention_reason", questions: ["Why does this need me?", "Why is my attention needed?"] },
  { intent: "source_and_support", questions: ["What supports this suggestion?", "What is the basis for this suggestion?"] },
  { intent: "relationship_explanation", questions: ["How is this connected?", "How is this connected to the source or decision?", "Explain the relationship."] },
  { intent: "uncertainty_and_conflict", questions: ["What remains uncertain or conflicted?", "Why is the project update blocked?"] },
  { intent: "decision_and_authority", questions: ["What still requires my decision?", "Was a decision recorded?"] },
  { intent: "transition_status", questions: ["Has the project update been applied?", "What changed the saved project?"] },
  { intent: "later_outcome", questions: ["Did later work use the resulting context?", "What happened later?"] },
  { intent: "next_meaningful_action", questions: ["What should I do next?", "What is the next meaningful step?"] },
  { intent: "capability_boundary", questions: ["What can Augnes do here?", "Can you apply this?"] },
];

for (const testCase of routingCases) {
  for (const question of testCase.questions) {
    const plan = buildGuideBriefConversationPlanV01(planInput({ question }));
    assert.equal(plan.routing.status, "supported", question);
    assert.equal(plan.routing.intent, testCase.intent, question);
  }
}

assert.equal(
  normalizeGuideBriefConversationQuestionV01("  WHAT...   Changed?!  "),
  "what changed",
);
assert.equal(
  buildGuideBriefConversationPlanV01(planInput({
    question: "  WHAT...   Changed?!  ",
  })).routing.intent,
  "meaningful_change",
);

const unsupported = buildGuideBriefConversationPlanV01(planInput({
  question: "Write a haiku about the repository.",
}));
assert.equal(unsupported.routing.status, "unsupported");
assert.equal(unsupported.availability, "unavailable");
assert.match(unsupported.direct_answer, /ask about the current work/i);

const noBroadFallback = buildGuideBriefConversationPlanV01(planInput({
  question: "Tell me more.",
}));
assert.equal(noBroadFallback.routing.status, "unsupported");
assert.equal(noBroadFallback.routing.intent, null);

const ambiguous = buildGuideBriefConversationPlanV01(planInput({
  question: "What changed and what should I do next?",
}));
assert.equal(ambiguous.routing.status, "ambiguous");
assert.equal(ambiguous.availability, "ambiguous");
assert.deepEqual(
  ambiguous.routing.matched_intents,
  ["meaningful_change", "next_meaningful_action"],
);

const duplicateRefs = [
  { source_kind: "run_receipt" as const, record_id: "b", record_fingerprint: FP_B },
  { source_kind: "run_receipt" as const, record_id: "a", record_fingerprint: FP_A },
  { source_kind: "run_receipt" as const, record_id: "b", record_fingerprint: FP_B },
];
const orderA = buildGuideBriefConversationPlanV01(planInput({
  question: "What supports this suggestion?",
  relationships: {
    support_and_source: relationship("support_and_source", { exact_refs: duplicateRefs }),
  },
}));
const orderB = buildGuideBriefConversationPlanV01(planInput({
  question: "What supports this suggestion?",
  relationships: {
    support_and_source: relationship("support_and_source", {
      exact_refs: [...duplicateRefs].reverse(),
    }),
  },
}));
assert.deepEqual(orderA, orderB);
assert.equal(orderA.internal_source_refs.length, 2);

const baseScopeInput = planInput();
const baseScope = buildGuideBriefConversationScopeKeyV01(baseScopeInput);
assert.equal(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput()),
  "exact replay keeps the same scope key",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    guide: guide({ project_id: PROJECT_B, active_project_id: PROJECT_B }),
  })),
  "project switch",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    guide: guide({ project_id: PROJECT_B, project_context: "viewed", active_project_id: PROJECT_A }),
  })),
  "explicitly viewed non-current project",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    selected_work_scope: {
      ...baseScopeInput.selected_work_scope!,
      proposal_id: PROPOSAL_B,
    },
  })),
  "proposal switch",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    timeline: timeline({ candidate_id: CANDIDATE_B, candidate_fingerprint: FP_B }),
    selected_work_scope: {
      ...baseScopeInput.selected_work_scope!,
      candidate_id: CANDIDATE_B,
      candidate_fingerprint: FP_B,
    },
  })),
  "identical-title candidate switch",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    timeline: timeline({ candidate_fingerprint: FP_C }),
    selected_work_scope: {
      ...baseScopeInput.selected_work_scope!,
      candidate_fingerprint: FP_C,
    },
  })),
  "candidate fingerprint change",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    timeline: timeline({ current_item_id: "current:changed-position", stage: "transition_blocked" }),
  })),
  "PC2 current-position change",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    selected_relationship_question_key: "candidate_and_decision",
  })),
  "PC3 relationship-question change",
);
assert.notEqual(
  baseScope,
  buildGuideBriefConversationScopeKeyV01(planInput({
    guide_source_fingerprint: FP_A,
  })),
  "GuideBrief source fingerprint change",
);

const first = buildGuideBriefConversationPlanV01(planInput({
  question: "What is happening now?",
}));
const firstContext = appendGuideBriefConversationTurnV01(
  createGuideBriefConversationContextV01(first.scope.scope_key),
  first,
);
const why = buildGuideBriefConversationPlanV01(planInput({
  question: "Why?",
  conversation_context: firstContext,
}));
assert.equal(why.routing.status, "supported");
assert.equal(why.routing.intent, "current_situation");
assert.equal(why.follow_up.resolved_from_previous_turn, true);

const decision = buildGuideBriefConversationPlanV01(planInput({
  question: "Was a decision recorded?",
}));
const decisionContext = appendGuideBriefConversationTurnV01(
  createGuideBriefConversationContextV01(decision.scope.scope_key),
  decision,
);
const appliedFollowUp = buildGuideBriefConversationPlanV01(planInput({
  question: "Was it applied?",
  conversation_context: decisionContext,
}));
assert.equal(appliedFollowUp.routing.intent, "transition_status");
assert.equal(appliedFollowUp.follow_up.resolved_from_previous_turn, true);

const nextFollowUp = buildGuideBriefConversationPlanV01(planInput({
  question: "What should I do next?",
  conversation_context: decisionContext,
}));
assert.equal(nextFollowUp.routing.intent, "next_meaningful_action");

const ambiguousPronoun = buildGuideBriefConversationPlanV01(planInput({
  question: "Why?",
  conversation_context: createGuideBriefConversationContextV01(baseScope),
}));
assert.equal(ambiguousPronoun.routing.status, "ambiguous");
assert.equal(
  buildGuideBriefConversationPlanV01(planInput({
    question: "Was it applied?",
  })).routing.status,
  "ambiguous",
);

const switchedGuide = guide({ project_id: PROJECT_B, active_project_id: PROJECT_B });
const staleFollowUp = buildGuideBriefConversationPlanV01(planInput({
  guide: switchedGuide,
  question: "Why?",
  conversation_context: firstContext,
}));
assert.equal(staleFollowUp.context_reset, true);
assert.equal(staleFollowUp.routing.status, "ambiguous");
assert.notEqual(staleFollowUp.scope.scope_key, first.scope.scope_key);

let boundedContext = createGuideBriefConversationContextV01(first.scope.scope_key);
for (let index = 0; index < 6; index += 1) {
  boundedContext = appendGuideBriefConversationTurnV01(
    boundedContext,
    buildGuideBriefConversationPlanV01(planInput({
      question: index % 2 === 0 ? "What is happening now?" : "What changed?",
      conversation_context: boundedContext,
    })),
  );
}
assert.equal(boundedContext.turns.length, 4);
assert.deepEqual(
  createGuideBriefConversationContextV01(first.scope.scope_key),
  createGuideBriefConversationContextV01(first.scope.scope_key),
  "a remount or reload starts with no transcript state",
);
assert.equal(createGuideBriefConversationContextV01(first.scope.scope_key).turns.length, 0);

const current = buildGuideBriefConversationPlanV01(planInput({
  question: "What is happening now?",
}));
assert.equal(current.availability, "available");
assert.match(current.direct_answer, /current project|selected change/i);

const changed = buildGuideBriefConversationPlanV01(planInput({
  question: "What changed?",
}));
assert.equal(changed.availability, "available");
assert.match(changed.direct_answer, /current exact position/i);

const needsMe = buildGuideBriefConversationPlanV01(planInput({
  question: "Why does this need me?",
}));
assert.equal(needsMe.availability, "available");
assert.match(needsMe.direct_answer, /consequential review|decision/i);

const falseAttention = buildGuideBriefConversationPlanV01(planInput({
  guide: guide({
    attention_required: false,
    attention_reason: null,
    blocker: null,
    judgment: null,
  }),
  question: "Why does this need me?",
}));
assert.equal(falseAttention.availability, "available");
assert.match(falseAttention.direct_answer, /does not require|nothing.*requires/i);
assert.doesNotMatch(falseAttention.direct_answer, /urgent|blocked.*you/i);

const projectChoiceGuide = guide({
  source_status: "project_choice",
  attention_required: false,
  attention_reason: null,
  blocker: null,
  judgment: null,
  primary_label: "Choose a local project",
  primary_reason: "A local project is needed before work can start.",
});
const projectChoiceCurrent = buildGuideBriefConversationPlanV01(planInput({
  guide: projectChoiceGuide,
  timeline: null,
  selected_work_scope: null,
  relationships: {},
  selected_relationship_question_key: null,
  question: "What is happening now?",
}));
assert.match(
  projectChoiceCurrent.sections.human_attention_meaning ?? "",
  /choose a local project.*no consequential review or project decision is pending/i,
);
assert.doesNotMatch(
  projectChoiceCurrent.sections.human_attention_meaning ?? "",
  /does not require human intervention/i,
);
const projectChoiceAttention = buildGuideBriefConversationPlanV01(planInput({
  guide: projectChoiceGuide,
  timeline: null,
  selected_work_scope: null,
  relationships: {},
  selected_relationship_question_key: null,
  question: "Why does this need me?",
}));
assert.match(
  projectChoiceAttention.direct_answer,
  /choose a local project.*no consequential review or project decision is pending/i,
);
assert.match(
  projectChoiceAttention.sections.observed_or_exact_basis ?? "",
  /cannot start or resume project work until you choose one/i,
);

const exactSupport = buildGuideBriefConversationPlanV01(planInput({
  question: "What supports this suggestion?",
}));
assert.equal(exactSupport.availability, "available");
assert.equal(exactSupport.source_completeness.status, "complete");
assert.match(exactSupport.sections.observed_or_exact_basis ?? "", /exact saved source result/i);
assert.match(
  exactSupport.sections.uncertainty_conflict_or_limitation ?? "",
  /preserves lineage.*does not.*authenticate|does not.*prove/i,
);

const partialSupport = buildGuideBriefConversationPlanV01(planInput({
  question: "What supports this suggestion?",
  relationships: {
    support_and_source: relationship("support_and_source", {
      availability: "partial",
      support_status: "partial",
    }),
  },
}));
assert.equal(partialSupport.availability, "partial");
assert.equal(partialSupport.source_completeness.status, "partial");
assert.match(partialSupport.sections.uncertainty_conflict_or_limitation ?? "", /incomplete/i);

const interpretedRelation = buildGuideBriefConversationPlanV01(planInput({
  question: "How is this connected?",
  relationships: {
    support_and_source: relationship("support_and_source", {
      basis: "bounded_interpretation",
      explanation: "Bounded interpretation connects the source to the suggestion.",
    }),
  },
}));
assert.match(interpretedRelation.sections.bounded_interpretation ?? "", /bounded interpretation/i);
assert.notEqual(
  interpretedRelation.sections.observed_or_exact_basis,
  interpretedRelation.sections.bounded_interpretation,
);

const blocked = buildGuideBriefConversationPlanV01(planInput({
  timeline: timeline({ stage: "transition_blocked" }),
  question: "Why is the project update blocked?",
}));
assert.equal(blocked.availability, "partial");
assert.match(blocked.direct_answer, /safeguard|conflict|blocked/i);
assert.ok(blocked.sections.uncertainty_conflict_or_limitation);

const priorDecision = buildGuideBriefConversationPlanV01(planInput({
  timeline: timeline({
    stage: "decision_recorded",
    primary_action_owner: "decision",
    summary: "An earlier decision remains recorded, but current review is required.",
  }),
  question: "Was a decision recorded?",
  relationships: {
    candidate_and_decision: relationship("candidate_and_decision", {
      uncertainty: "Current-session application authority is not present.",
      explanation: "An exact earlier decision is recorded for this candidate.",
      stage: "decision_recorded",
    }),
  },
}));
assert.match(priorDecision.direct_answer, /earlier decision|recorded/i);
assert.match(
  priorDecision.sections.uncertainty_conflict_or_limitation ?? "",
  /current-session|current review/i,
);

const awaitingApplication = buildGuideBriefConversationPlanV01(planInput({
  timeline: timeline({ stage: "awaiting_application" }),
  question: "Has the project update been applied?",
}));
assert.match(awaitingApplication.direct_answer, /not changed|not.*applied|awaiting/i);

const applied = buildGuideBriefConversationPlanV01(planInput({
  timeline: timeline({ stage: "project_updated" }),
  question: "Has the project update been applied?",
}));
assert.match(applied.direct_answer, /authorized project update|project update is recorded/i);
assert.doesNotMatch(applied.direct_answer, /useful|correct decision/i);

const later = buildGuideBriefConversationPlanV01(planInput({
  timeline: timeline({ stage: "later_outcome_available" }),
  question: "Did later work use the resulting context?",
}));
assert.equal(later.availability, "available");
assert.match(later.direct_answer, /later work used context/i);
assert.match(later.sections.uncertainty_conflict_or_limitation ?? "", /not usefulness|not.*correct/i);

const laterMismatch = buildGuideBriefConversationPlanV01(planInput({
  timeline: timeline({ stage: "later_outcome_available" }),
  relationships: {},
  question: "Did later work use the resulting context?",
}));
assert.equal(laterMismatch.availability, "unavailable");
assert.doesNotMatch(laterMismatch.direct_answer, /later work used context compiled/i);

const next = buildGuideBriefConversationPlanV01(planInput({
  question: "What should I do next?",
}));
assert.equal(next.next_action.owner, "pc2_timeline");
assert.equal(next.next_action.is_action, false);
assert.match(next.sections.next_meaningful_action ?? "", /existing|review|project-update/i);

const capability = buildGuideBriefConversationPlanV01(planInput({
  question: "Can you apply this?",
}));
assert.equal(capability.availability, "available");
assert.match(capability.direct_answer, /explain|cannot.*apply|existing.*controls/i);
assert.equal(capability.next_action.is_action, false);

const missingRelationship = buildGuideBriefConversationPlanV01(planInput({
  relationships: {},
  question: "What supports this suggestion?",
}));
assert.equal(missingRelationship.availability, "unavailable");
assert.match(missingRelationship.direct_answer, /source.*unavailable|cannot answer/i);
assert.equal(
  buildGuideBriefConversationPlanV01(planInput({
    relationships: {},
    question: "What still requires my decision?",
  })).availability,
  "unavailable",
);
assert.equal(
  buildGuideBriefConversationPlanV01(planInput({
    relationships: {},
    question: "Why is the project update blocked?",
  })).availability,
  "unavailable",
);
assert.throws(
  () => buildGuideBriefConversationPlanV01(planInput({
    timeline: null,
    selected_work_scope: baseScopeInput.selected_work_scope,
    relationships: {},
    selected_relationship_question_key: null,
    question: "What changed?",
  })),
  /guidebrief_conversation_binding_timeline_required/u,
);
assert.throws(
  () => buildGuideBriefConversationPlanV01(planInput({
    timeline: null,
    selected_work_scope: baseScopeInput.selected_work_scope,
    relationships: {},
    selected_relationship_question_key: null,
    question: "What should I do next?",
  })),
  /guidebrief_conversation_binding_timeline_required/u,
);

const publicText = [
  exactSupport.direct_answer,
  ...Object.values(exactSupport.sections).filter(
    (value): value is string => typeof value === "string",
  ),
].join(" ");
assert.ok(Buffer.byteLength(publicText, "utf8") <= 1_600);
assert.doesNotMatch(publicText, /sha256:|proposal-candidate:|episode-delta-proposal:/i);
assert.doesNotMatch(
  publicText,
  /TaskContextPacket|ReviewDecision|StateTransitionReceipt|semantic gate|nonce|TTL|database path/i,
);
assert.ok(exactSupport.internal_source_refs.some((ref) => ref.record_fingerprint === FP_B));
assert.deepEqual(Object.keys(exactSupport.sections), [
  "observed_or_exact_basis",
  "bounded_interpretation",
  "uncertainty_conflict_or_limitation",
  "human_attention_meaning",
  "next_meaningful_action",
]);
assert.equal(exactSupport.authority.projection_only, true);
assert.equal(exactSupport.authority.rebuildable, true);
for (const [key, value] of Object.entries(exactSupport.authority)) {
  if (key === "projection_only" || key === "rebuildable") continue;
  assert.equal(value, false, `authority.${key}`);
}
assert.equal(exactSupport.owners.attention, "pc1");
assert.equal(exactSupport.owners.current_position, "pc2");
assert.equal(exactSupport.owners.relationships, "pc3");
assert.equal(exactSupport.owners.conversation_composition, "pc4");
assert.equal(exactSupport.next_action.is_action, false);
assert.ok(["guide_brief", "pc2_timeline"].includes(exactSupport.next_action.owner));
assert.equal(exactSupport.side_effects.database, false);
assert.equal(exactSupport.side_effects.provider, false);
assert.equal(exactSupport.side_effects.external_action, false);
assert.equal(exactSupport.suggested_questions.length >= 3, true);
assert.equal(exactSupport.suggested_questions.length <= 5, true);
for (const suggestion of exactSupport.suggested_questions) {
  const routed = buildGuideBriefConversationPlanV01(planInput({
    question: suggestion.question,
  }));
  assert.equal(routed.routing.status, "supported");
  assert.equal(routed.routing.intent, suggestion.intent);
  assert.notEqual(routed.availability, "unavailable");
}

const allSurfaceGuide = guide();
const surfacePlan = buildGuideBriefConversationPlanV01(planInput({
  guide: allSurfaceGuide,
  question: "What is happening now?",
}));
assert.equal(surfacePlan.scope.project_id, allSurfaceGuide.identity.project_id);
assert.equal(
  surfacePlan.scope.project_id,
  allSurfaceGuide.projections.codex.project_id,
);
assert.equal(
  surfacePlan.scope.project_context,
  allSurfaceGuide.projections.chatgpt.project_context,
);
assert.equal(
  surfacePlan.facts.current_situation,
  allSurfaceGuide.projections.chatgpt.summary,
);
assert.equal(
  surfacePlan.facts.human_attention.required,
  allSurfaceGuide.projections.ai_workplane.human_attention.required,
);
assert.equal(
  surfacePlan.facts.human_attention.required,
  allSurfaceGuide.projections.codex.human_attention.required,
);
assert.equal(
  surfacePlan.facts.next_action_label,
  allSurfaceGuide.projections.codex.suggested_next_action,
);
assert.equal(surfacePlan.facts.authority.can_decide, false);
assert.equal(surfacePlan.facts.authority.can_transition, false);
assert.equal(surfacePlan.facts.authority.can_execute, false);
assert.ok(
  surfacePlan.internal_source_refs.some(
    (ref) => ref.record_id === allSurfaceGuide.source_refs[0]!.ref_id,
  ),
);

const remediationFailures: Array<{ name: string; error: unknown }> = [];
function remediationCheck(name: string, check: () => void): void {
  try {
    check();
  } catch (error) {
    remediationFailures.push({ name, error });
  }
}

function expectContractError(
  input: GuideBriefConversationPlanInputV01,
  code: string,
): void {
  assert.throws(
    () => buildGuideBriefConversationPlanV01(input),
    (error: unknown) =>
      error instanceof Error && error.message === code,
    code,
  );
}

function clonedPlanInput(): GuideBriefConversationPlanInputV01 {
  return structuredClone(planInput());
}

function assertMaterialScopeChanges(
  name: string,
  mutate: (input: GuideBriefConversationPlanInputV01) => void,
): void {
  const before = planInput();
  const after = clonedPlanInput();
  mutate(after);
  assert.notEqual(
    buildGuideBriefConversationScopeKeyV01(before),
    buildGuideBriefConversationScopeKeyV01(after),
    name,
  );
}

remediationCheck("binding rejects GuideBrief project A with selected work project B", () => {
  const input = planInput();
  input.selected_work_scope = {
    ...input.selected_work_scope!,
    workspace_id: WORKSPACE_B,
    project_id: PROJECT_B,
  };
  expectContractError(
    input,
    "guidebrief_conversation_binding_selected_work_workspace_mismatch",
  );
});

remediationCheck("binding independently rejects selected-work project mismatch", () => {
  const input = planInput();
  input.selected_work_scope = {
    ...input.selected_work_scope!,
    project_id: PROJECT_B,
  };
  expectContractError(
    input,
    "guidebrief_conversation_binding_selected_work_project_mismatch",
  );
});

remediationCheck("binding rejects selected scope candidate A with timeline candidate B", () => {
  const input = planInput();
  input.timeline = timeline({
    candidate_id: CANDIDATE_B,
    candidate_fingerprint: FP_B,
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_timeline_candidate_id_mismatch",
  );
});

remediationCheck("binding rejects correct candidate ID with wrong fingerprint", () => {
  const input = planInput();
  input.timeline = timeline({ candidate_fingerprint: FP_B });
  expectContractError(
    input,
    "guidebrief_conversation_binding_timeline_candidate_fingerprint_mismatch",
  );
});

remediationCheck("binding rejects relationship candidate anchor mismatch", () => {
  const input = planInput({
    relationships: {
      support_and_source: relationship("support_and_source", {
        candidate_id: CANDIDATE_B,
      }),
    },
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_relationship_candidate_id_mismatch",
  );
});

remediationCheck("binding rejects relationship candidate fingerprint mismatch", () => {
  const input = planInput({
    relationships: {
      support_and_source: relationship("support_and_source", {
        candidate_fingerprint: FP_B,
      }),
    },
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_relationship_candidate_fingerprint_mismatch",
  );
});

remediationCheck("binding rejects relationship timeline stage mismatch", () => {
  const input = planInput({
    relationships: {
      support_and_source: relationship("support_and_source", {
        stage: "transition_blocked",
      }),
    },
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_relationship_timeline_stage_mismatch",
  );
});

remediationCheck("binding rejects relationship current item mismatch", () => {
  const input = planInput({
    relationships: {
      support_and_source: relationship("support_and_source", {
        current_item_id: "current:foreign",
      }),
    },
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_relationship_current_item_mismatch",
  );
});

remediationCheck("binding rejects relationship map key mismatch", () => {
  const input = planInput({
    relationships: {
      support_and_source: relationship("candidate_and_decision"),
    },
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_relationship_map_key_mismatch",
  );
});

remediationCheck("binding rejects selected relationship question missing from map", () => {
  const input = planInput({
    relationships: {},
    selected_relationship_question_key: "support_and_source",
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_selected_relationship_missing",
  );
});

remediationCheck("binding rejects selected-work material without exact scope", () => {
  const input = planInput({ selected_work_scope: null });
  expectContractError(
    input,
    "guidebrief_conversation_binding_selected_work_scope_required",
  );
});

remediationCheck("binding rejects selected scope without timeline", () => {
  const input = planInput({
    timeline: null,
    selected_work_scope: planInput().selected_work_scope,
    relationships: {},
    selected_relationship_question_key: null,
  });
  expectContractError(
    input,
    "guidebrief_conversation_binding_timeline_required",
  );
});

remediationCheck("exact coherent bindings continue to pass", () => {
  assert.doesNotThrow(() =>
    buildGuideBriefConversationPlanV01(planInput())
  );
});

remediationCheck("same-title candidates remain isolated by exact identity", () => {
  const candidateBTimeline = timeline({
    candidate_id: CANDIDATE_B,
    candidate_fingerprint: FP_B,
  });
  const candidateBInput = planInput({
    timeline: candidateBTimeline,
    selected_work_scope: {
      workspace_id: WORKSPACE_A,
      project_id: PROJECT_A,
      proposal_id: PROPOSAL_A,
      proposal_fingerprint: FP_B,
      candidate_id: CANDIDATE_B,
      candidate_fingerprint: FP_B,
    },
    relationships: {
      support_and_source: relationship("support_and_source", {
        candidate_id: CANDIDATE_B,
        candidate_fingerprint: FP_B,
      }),
    },
  });
  assert.notEqual(
    buildGuideBriefConversationScopeKeyV01(planInput()),
    buildGuideBriefConversationScopeKeyV01(candidateBInput),
  );
});

const materialCases: Array<{
  name: string;
  mutate: (input: GuideBriefConversationPlanInputV01) => void;
}> = [
  {
    name: "GuideBrief ChatGPT summary",
    mutate: (input) => {
      input.guide.projections.chatgpt.summary = "A refreshed current summary.";
    },
  },
  {
    name: "first observed statement",
    mutate: (input) => {
      input.guide.observed[0]!.statement = "A refreshed observation.";
    },
  },
  {
    name: "inferred statement or caveat",
    mutate: (input) => {
      input.guide.inferred[0]!.caveats = ["A refreshed caveat."];
    },
  },
  {
    name: "user judgment",
    mutate: (input) => {
      input.guide.coordinate.unresolved_user_judgment =
        "Should the refreshed exact change be accepted?";
    },
  },
  {
    name: "primary guidance reason or destination",
    mutate: (input) => {
      input.guide.primary_guidance.reason = "A refreshed guidance reason.";
      input.guide.primary_guidance.href = "/workbench/semantic-review/refreshed";
    },
  },
  {
    name: "timeline current summary",
    mutate: (input) => {
      input.timeline!.current_position.summary =
        "A refreshed exact current-position summary.";
    },
  },
  {
    name: "timeline next meaningful step",
    mutate: (input) => {
      input.timeline!.current_position.next_meaningful_step =
        "Use the refreshed exact next step.";
    },
  },
  {
    name: "timeline meaning change",
    mutate: (input) => {
      input.timeline!.items[0]!.meaning_change =
        "The refreshed exact meaning changed.";
    },
  },
  {
    name: "timeline source ref or destination",
    mutate: (input) => {
      input.timeline!.items[0]!.source_refs[0]!.record_id =
        "decision:refreshed";
      input.timeline!.items[0]!.destination = "#refreshed-timeline";
    },
  },
  {
    name: "relationship highlighted connection",
    mutate: (input) => {
      const relationshipInput = input.relationships!.support_and_source!;
      const alternate = {
        ...structuredClone(relationshipInput.connections[0]!),
        connection_id: "connection-support_and_source-alternate",
        explanation: "The alternate exact connection is highlighted.",
      };
      relationshipInput.connections.push(alternate);
      relationshipInput.highlighted_connection_id = alternate.connection_id;
    },
  },
  {
    name: "relationship explanation",
    mutate: (input) => {
      input.relationships!.support_and_source!.connections[0]!.explanation =
        "A refreshed exact relationship explanation.";
    },
  },
  {
    name: "relationship uncertainty",
    mutate: (input) => {
      input.relationships!.support_and_source!.connections[0]!
        .uncertainty_or_conflict = "A refreshed exact uncertainty.";
    },
  },
  {
    name: "relationship destination",
    mutate: (input) => {
      input.relationships!.support_and_source!.connections[0]!.destination =
        "#refreshed-relationship";
    },
  },
  {
    name: "suggested destination",
    mutate: (input) => {
      input.relationships!.support_and_source!.suggested_destinations[0]!.href =
        "#refreshed-destination";
    },
  },
  {
    name: "supplied upstream fingerprint",
    mutate: (input) => {
      input.guide_source_fingerprint = FP_A;
    },
  },
  {
    name: "projection material while supplied fingerprint stays unchanged",
    mutate: (input) => {
      input.guide.projections.ai_workplane.recommended_review_focus =
        "Review the refreshed exact material.";
      input.guide_source_fingerprint = FP_C;
    },
  },
];

for (const materialCase of materialCases) {
  remediationCheck(
    `scope changes for ${materialCase.name}`,
    () => assertMaterialScopeChanges(materialCase.name, materialCase.mutate),
  );
}

remediationCheck("GuideBrief read timestamp alone preserves material scope", () => {
  const left = clonedPlanInput();
  const right = structuredClone(left);
  right.guide.generated_at = "2026-07-27T08:00:00.000Z";
  assert.equal(
    buildGuideBriefConversationScopeKeyV01(left),
    buildGuideBriefConversationScopeKeyV01(right),
  );
});

remediationCheck("reordered semantically unordered exact refs keep the same scope", () => {
  const left = clonedPlanInput();
  const right = clonedPlanInput();
  const refs = [
    {
      source_kind: "run_receipt" as const,
      record_id: "run-receipt:b",
      record_fingerprint: FP_B,
    },
    {
      source_kind: "run_receipt" as const,
      record_id: "run-receipt:a",
      record_fingerprint: FP_A,
    },
  ];
  left.relationships!.support_and_source!.connections[0]!.exact_refs = refs;
  right.relationships!.support_and_source!.connections[0]!.exact_refs =
    [...refs].reverse();
  assert.equal(
    buildGuideBriefConversationScopeKeyV01(left),
    buildGuideBriefConversationScopeKeyV01(right),
  );
});

remediationCheck("PC2 timeline order remains semantically distinguishable", () => {
  const left = clonedPlanInput();
  const historical = {
    ...structuredClone(left.timeline!.items[0]!),
    item_id: "historical:before-current",
    status: "completed" as const,
    summary: "A prior exact timeline item.",
  };
  left.timeline!.items = [historical, left.timeline!.items[0]!];
  left.timeline!.bounded_item_count = 2;
  const right = structuredClone(left);
  right.timeline!.items.reverse();
  assert.notEqual(
    buildGuideBriefConversationScopeKeyV01(left),
    buildGuideBriefConversationScopeKeyV01(right),
  );
});

remediationCheck("component visibility guard removes a same-identity stale answer", () => {
  const beforeInput = planInput({ question: "What is happening now?" });
  const priorAnswer = buildGuideBriefConversationPlanV01(beforeInput);
  const afterInput = structuredClone(beforeInput);
  afterInput.guide.projections.chatgpt.summary =
    "The same project and candidate now have refreshed current meaning.";
  const nextScope = buildGuideBriefConversationScopeKeyV01(afterInput);
  const visibleAnswer =
    selectVisibleGuideBriefConversationAnswerV01(priorAnswer, nextScope);
  const staleContext = appendGuideBriefConversationTurnV01(
    createGuideBriefConversationContextV01(priorAnswer.scope.scope_key),
    priorAnswer,
  );
  const currentContext = scopeGuideBriefConversationContextV01(
    staleContext,
    nextScope,
  );
  assert.equal(visibleAnswer, null);
  assert.equal(currentContext.scope_key, nextScope);
  assert.equal(currentContext.turns.length, 0);
});

remediationCheck("PC3 highlighted connection owns the answer even when second", () => {
  const exactRelationship = relationship("support_and_source");
  const highlighted = exactRelationship.connections[0]!;
  const firstButNotHighlighted = {
    ...structuredClone(highlighted),
    connection_id: "connection-support_and_source-first",
    explanation: "This first connection must not own the PC4 answer.",
    exact_refs: [{
      source_kind: "run_receipt" as const,
      record_id: "run-receipt:not-highlighted",
      record_fingerprint: FP_A,
    }],
  };
  exactRelationship.connections = [firstButNotHighlighted, highlighted];
  exactRelationship.visible_connection_count = 2;
  exactRelationship.known_connection_count = 2;
  const plan = buildGuideBriefConversationPlanV01(planInput({
    question: "What supports this suggestion?",
    relationships: { support_and_source: exactRelationship },
  }));
  assert.equal(plan.direct_answer, highlighted.explanation);
  assert.equal(plan.facts.selected_relationship_meaning, highlighted.explanation);
  assert.ok(
    plan.internal_source_refs.some(
      (ref) => ref.record_id === highlighted.exact_refs[0]!.record_id,
    ),
  );
  assert.ok(
    plan.internal_source_refs.every(
      (ref) => ref.record_id !== firstButNotHighlighted.exact_refs[0]!.record_id,
    ),
  );
});

remediationCheck("reversing connection order preserves the highlighted answer", () => {
  const exactRelationship = relationship("support_and_source");
  const highlighted = exactRelationship.connections[0]!;
  const other = {
    ...structuredClone(highlighted),
    connection_id: "connection-support_and_source-other",
    explanation: "A non-highlighted connection.",
  };
  exactRelationship.connections = [other, highlighted];
  exactRelationship.visible_connection_count = 2;
  exactRelationship.known_connection_count = 2;
  const reversed = structuredClone(exactRelationship);
  reversed.connections.reverse();
  const left = buildGuideBriefConversationPlanV01(planInput({
    question: "What supports this suggestion?",
    relationships: { support_and_source: exactRelationship },
  }));
  const right = buildGuideBriefConversationPlanV01(planInput({
    question: "What supports this suggestion?",
    relationships: { support_and_source: reversed },
  }));
  assert.deepEqual(left, right);
});

remediationCheck("missing highlighted connection fails closed", () => {
  const malformed = relationship("support_and_source");
  malformed.highlighted_connection_id = "connection:missing";
  expectContractError(
    planInput({ relationships: { support_and_source: malformed } }),
    "guidebrief_conversation_binding_highlighted_connection_missing",
  );
});

remediationCheck("null highlight on answerable relationship fails closed", () => {
  const malformed = relationship("support_and_source");
  malformed.highlighted_connection_id = null;
  expectContractError(
    planInput({ relationships: { support_and_source: malformed } }),
    "guidebrief_conversation_binding_highlighted_connection_required",
  );
});

remediationCheck("duplicate highlighted connection identity fails closed", () => {
  const malformed = relationship("support_and_source");
  malformed.connections.push(structuredClone(malformed.connections[0]!));
  expectContractError(
    planInput({ relationships: { support_and_source: malformed } }),
    "guidebrief_conversation_binding_highlighted_connection_ambiguous",
  );
});

remediationCheck("unavailable relationship with no highlight remains unavailable", () => {
  const unavailable = relationship("support_and_source", {
    availability: "unavailable",
  });
  const plan = buildGuideBriefConversationPlanV01(planInput({
    question: "What supports this suggestion?",
    relationships: { support_and_source: unavailable },
  }));
  assert.equal(plan.availability, "unavailable");
  assert.equal(plan.facts.selected_relationship_meaning, null);
});

remediationCheck("unavailable relationship cannot retain fabricated connections", () => {
  const malformed = relationship("support_and_source", {
    availability: "unavailable",
  });
  malformed.connections = [
    relationship("support_and_source").connections[0]!,
  ];
  expectContractError(
    planInput({ relationships: { support_and_source: malformed } }),
    "guidebrief_conversation_binding_unavailable_relationship_invalid",
  );
});

remediationCheck("raw question length is enforced by the pure owner", () => {
  expectContractError(
    planInput({ question: "x".repeat(241) }),
    "guidebrief_conversation_question_too_long",
  );
});

remediationCheck("externally supplied contexts over four turns fail closed", () => {
  const seed = buildGuideBriefConversationPlanV01(planInput({
    question: "What is happening now?",
  }));
  const turn = appendGuideBriefConversationTurnV01(
    createGuideBriefConversationContextV01(seed.scope.scope_key),
    seed,
  ).turns[0]!;
  expectContractError(
    planInput({
      question: "Why?",
      conversation_context: {
        scope_key: seed.scope.scope_key,
        turns: [turn, turn, turn, turn, turn],
      },
    }),
    "guidebrief_conversation_context_turn_limit_exceeded",
  );
});

if (remediationFailures.length > 0) {
  for (const failure of remediationFailures) {
    const detail =
      failure.error instanceof Error
        ? `${failure.error.name}: ${failure.error.message}`
        : String(failure.error);
    console.error(`[pc4-remediation-red] ${failure.name}: ${detail}`);
  }
  throw new Error(
    `PC4 remediation regressions failed: ${remediationFailures.length}`,
  );
}

console.log("vNext GuideBrief conversation plan contract tests passed.");
