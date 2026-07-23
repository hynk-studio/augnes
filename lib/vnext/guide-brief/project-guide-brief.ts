import { createHash } from "node:crypto";

import {
  ordinaryActionLabelV02,
  publicGuideBriefTextV02,
} from "@/lib/vnext/guide-brief/public-guide-text";
import type { SemanticWorkbenchEntryV01 } from "@/types/vnext/semantic-workbench";
import {
  BLANK_STATE_VIEW_VERSION_V01,
  type BlankStatePrimaryActionV01,
  type BlankStateSourceV01,
} from "@/types/vnext/blank-state";
import {
  GUIDE_BRIEF_LIMITS_V02,
  GUIDE_BRIEF_REQUEST_SCOPE_V02,
  GUIDE_BRIEF_VERSION_V02,
  type GuideBriefAuthorityBoundaryV02,
  type GuideBriefCodexProjectionV02,
  type GuideBriefInferredItemV02,
  type GuideBriefObservedItemV02,
  type GuideBriefSourceRefV02,
  type GuideBriefSuggestedItemV02,
  type GuideBriefUserJudgmentItemV02,
  type ProjectGuideBriefProjectContextV02,
  type ProjectGuideBriefSourceStatusV02,
  type ProjectGuideBriefV02,
} from "@/types/vnext/guide-brief";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const WORKPLANE_HREF = "/workbench/semantic-review";

export interface BuildProjectGuideBriefInputV02 {
  source: BlankStateSourceV01;
  generated_at: string;
}

interface FocusDecisionV02 {
  focus: ProjectGuideBriefV02["coordinate"]["focus"];
  heading: string;
  situation: string;
  material_note: string | null;
  action: BlankStatePrimaryActionV01;
  action_reason: string;
  project_management_emphasized: boolean;
  user_judgment: null | {
    question: string;
    why: string;
    blocked: string[];
  };
}

export function buildProjectGuideBriefV02(
  input: BuildProjectGuideBriefInputV02,
): ProjectGuideBriefV02 {
  const generatedAt = strictTimestamp(input.generated_at);
  const source = input.source;
  const projection = source.projection;
  const decision = decideFocusV02(source);
  const projectContext = projectContextV02(source);
  const sourceStatus = sourceStatusV02(source, projectContext);
  const projectName = projection
    ? displayProjectNameV02(projection.project_summary.project.display_name)
    : recentTargetNameV02(source);
  const workspaceId = projection?.workspace_id ?? null;
  const projectId = projection?.project_id ?? source.requested_project_id ?? source.active_project_id;

  const refs = buildSourceRefsV02(source, decision, projectName);
  const observed = buildObservedV02(source, decision, refs);
  const inferred = buildInferredV02(source, decision, observed);
  const judgments = buildJudgmentsV02(decision, refs);
  const suggested = buildSuggestedV02(decision, refs);
  const result = projection?.run_results.latest_result ?? null;
  const goal = boundedTextV02(projection?.coordination.task_frame.goal ?? null);
  const currentWork = projection?.run_results.current_run ?? null;
  const blocker = boundedTextV02(decision.material_note);
  const primarySourceRefs = refs.slice(0, 4).map((ref) => ref.ref_id);
  const primaryGuidance: ProjectGuideBriefV02["primary_guidance"] = {
    label: decision.action.label,
    reason: boundedTextV02(decision.action_reason) ?? "Continue from the current project state.",
    href: actionHrefV02(decision.action),
    action_ref: actionRefV02(decision.action),
    action: decision.action,
    requires_user_judgment: Boolean(decision.user_judgment),
    source_refs: primarySourceRefs,
    executes: false,
  };
  const recentChange = projection?.recent_activity.items[0] ?? null;
  const coordinate: ProjectGuideBriefV02["coordinate"] = {
    focus: decision.focus,
    goal,
    work_status: workStatusV02(source, decision),
    result_available: Boolean(result),
    result_summary: boundedTextV02(result?.summary ?? null),
    verification: result
      ? {
          passed: result.check_counts.passed,
          failed: result.check_counts.failed,
          skipped: result.check_counts.skipped,
        }
      : null,
    material_blocker_or_uncertainty: blocker,
    unresolved_user_judgment: judgments[0]?.question ?? null,
    recent_meaningful_change: boundedTextV02(recentChange?.summary ?? null),
  };
  const blankState = buildBlankStateProjectionV02({
    source,
    decision,
    sourceStatus,
    projectContext,
    projectName,
    observed,
    inferred,
    judgments,
  });
  const aiWorkplane = {
    status: sourceStatus === "unavailable" ? "unavailable" as const : "available" as const,
    project_name: projectName,
    current_coordinate: decision.heading,
    current_goal: goal,
    work_or_result_status: coordinate.work_status,
    material_blocker_or_judgment:
      coordinate.unresolved_user_judgment ?? coordinate.material_blocker_or_uncertainty,
    recommended_review_focus: primaryGuidance.label,
    exact_detail_href: result?.inspector_href ?? null,
  };
  const codex = buildCodexProjectionV02({
    source,
    status: sourceStatus === "unavailable" ? "unavailable" : "available",
    workspace_id: workspaceId,
    project_id: projectId,
    project_name: projectName,
    coordinate: decision.heading,
    goal,
    judgments,
    primary_label: primaryGuidance.label,
    refs,
    unavailable_reason: sourceStatus === "unavailable"
      ? "Current project guidance is unavailable; use the exact task packet and existing authority gates."
      : null,
  });
  const authority = authorityBoundaryV02();
  const guide: ProjectGuideBriefV02 = {
    runtime: "augnes_current_project",
    guide_version: GUIDE_BRIEF_VERSION_V02,
    generated_at: generatedAt,
    request: {
      scope: GUIDE_BRIEF_REQUEST_SCOPE_V02,
      route_mode: source.route_mode,
      requested_project_id: source.requested_project_id,
    },
    identity: {
      workspace_id: workspaceId,
      project_id: projectId,
      project_display_name: projectName,
      project_context: projectContext,
      active_project_id: source.active_project_id,
      root_resolution: rootResolutionV02(source),
    },
    source_status: sourceStatus,
    gaps: sourceGapsV02(source),
    coordinate,
    observed,
    inferred,
    suggested,
    needs_user_judgment: judgments,
    primary_guidance: primaryGuidance,
    source_refs: refs,
    projections: {
      blank_state: blankState,
      ai_workplane: aiWorkplane,
      chatgpt: {
        project_name: projectName,
        project_context: projectContext,
        source_status: sourceStatus,
        summary: decision.situation,
        goal,
        status: coordinate.work_status,
        constraints: boundedListV02(projection?.coordination.task_frame.forbidden_actions ?? [], 8),
        required_checks: boundedListV02(projection?.coordination.task_frame.required_checks ?? [], 8),
        non_goals: boundedListV02(projection?.coordination.task_frame.non_goals ?? [], 8),
        material_blocker_or_uncertainty: coordinate.material_blocker_or_uncertainty,
        unresolved_user_judgment: coordinate.unresolved_user_judgment,
        observed,
        inferred,
        suggested,
        needs_user_judgment: judgments,
        primary_guidance: primaryGuidance,
        source_refs: refs,
      },
      codex,
    },
    authority,
    safety: {
      contains_private_absolute_paths: false,
      contains_credentials: false,
      contains_raw_provider_output: false,
      contains_hidden_reasoning: false,
      contains_raw_transcripts: false,
      provider_or_network_calls: false,
      persisted: false,
    },
    limits: GUIDE_BRIEF_LIMITS_V02,
  };
  assertGuideBriefBoundsV02(guide);
  return guide;
}

export function bindGuideBriefCodexProjectionToPacketV02(
  projection: GuideBriefCodexProjectionV02,
  packet: TaskContextPacketV01,
): GuideBriefCodexProjectionV02 {
  return {
    ...projection,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    current_goal: boundedTextV02(packet.task.goal) ?? projection.current_goal,
    constraints: boundedListV02(packet.constraints.forbidden_actions, 8),
    required_checks: boundedListV02(packet.constraints.required_checks, 8),
    non_goals: boundedListV02(packet.task.non_goals, 8),
    packet_binding: {
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
    },
  };
}

export function unavailableGuideBriefCodexProjectionV02(
  packet: TaskContextPacketV01,
  reason: string,
): GuideBriefCodexProjectionV02 {
  return bindGuideBriefCodexProjectionToPacketV02(
    {
      guide_version: GUIDE_BRIEF_VERSION_V02,
      projection_version: "guide_brief_codex_projection.v0.2",
      status: "unavailable",
      workspace_id: packet.workspace_id,
      project_id: packet.project_id,
      project_name: null,
      current_goal: boundedTextV02(packet.task.goal),
      current_coordinate: "GuideBrief unavailable",
      constraints: [],
      required_checks: [],
      non_goals: [],
      unresolved_user_judgments: [],
      important_risk_or_gap: "Current project guidance could not be derived.",
      suggested_next_action: "Follow only the exact TaskContextPacket and existing authority gates.",
      source_refs: [],
      packet_binding: null,
      task_context_packet_delivered_separately: true,
      guide_does_not_override_packet: true,
      suggestions_are_not_commands: true,
      authority_remains_with_user_and_core: true,
      can_approve: false,
      can_execute_codex: false,
      can_grant_host_permission: false,
      unavailable_reason: boundedTextV02(reason) ?? "guide_brief_unavailable",
    },
    packet,
  );
}

function decideFocusV02(source: BlankStateSourceV01): FocusDecisionV02 {
  const projection = source.projection;
  const management = source.route_mode === "project_management";
  if (!projection) {
    if (source.recent_projects.length === 0) {
      return {
        focus: "no_projects",
        heading: "What are you trying to do?",
        situation: "Choose a local project so Augnes can help you start or continue work.",
        material_note: null,
        action: { kind: "choose_folder", label: "Choose a local project" },
        action_reason: "A local project is needed before work can start.",
        project_management_emphasized: true,
        user_judgment: null,
      };
    }
    const active = source.active_project_id
      ? source.recent_projects.find((item) => item.project.project_id === source.active_project_id)
      : null;
    const first = active ?? source.recent_projects.find((item) => item.root_availability === "available") ?? source.recent_projects[0]!;
    const name = displayProjectNameV02(first.project.display_name);
    const unavailableActive = Boolean(source.active_project_id);
    return {
      focus: "project_choice",
      heading: unavailableActive ? "Reconnect your current project" : "Choose where to continue",
      situation: unavailableActive
        ? "Your current project record is safe, but its saved project view could not be opened. Choose or reconnect a project below."
        : "Continue an existing project or choose another local folder.",
      material_note: unavailableActive
        ? "No project was switched and no stored project data was changed."
        : null,
      action: first.root_availability === "available"
        ? { kind: "open_recent", label: `Continue with ${name}`, project_id: first.project.project_id }
        : { kind: "locate_folder", label: `Locate ${name}`, project_id: first.project.project_id },
      action_reason: first.root_availability === "available"
        ? "This is the most recent available project."
        : "The saved project needs its local folder reconnected.",
      project_management_emphasized: true,
      user_judgment: null,
    };
  }

  const name = displayProjectNameV02(projection.project_summary.project.display_name);
  if (projection.project_summary.root_availability !== "available") {
    return {
      focus: "project_root_unavailable",
      heading: `Reconnect ${name}`,
      situation: "The project record is safe, but Augnes cannot reach its local folder.",
      material_note: "Locate the folder to reconnect it. Nothing will be changed until you confirm the folder.",
      action: { kind: "locate_folder", label: "Locate folder", project_id: projection.project_id },
      action_reason: "The current project cannot be used until its folder is reconnected.",
      project_management_emphasized: true,
      user_judgment: null,
    };
  }
  if (!projection.project_summary.is_active) {
    return {
      focus: "viewed_project_inactive",
      heading: `You are viewing ${name}`,
      situation: "Opening this link did not switch your current project.",
      material_note: "Make this project active before changing controls or starting work.",
      action: { kind: "make_active", label: "Make active", project_id: projection.project_id },
      action_reason: "Project-changing work must stay bound to the active project.",
      project_management_emphasized: management,
      user_judgment: {
        question: `Should ${name} become the current project?`,
        why: "Changing the active project changes where subsequent work is scoped.",
        blocked: ["Starting or changing project-scoped work"],
      },
    };
  }
  const currentRun = projection.run_results.current_run;
  if (currentRun?.reconciliation_required) {
    return {
      focus: "work_requires_attention",
      heading: "Current work needs to be checked",
      situation: "Augnes lost a complete observation of the running work and will not infer a result.",
      material_note: "Review the current work before continuing or accepting any project change.",
      action: workplaneActionV02("Review current work"),
      action_reason: "The current work state must be reconciled before its result can be trusted.",
      project_management_emphasized: management,
      user_judgment: null,
    };
  }
  if (currentRun) {
    return {
      focus: "work_in_progress",
      heading: "Work is in progress",
      situation: projection.coordination.task_frame.goal
        ? `Augnes is working on: ${publicGuideBriefTextV02(projection.coordination.task_frame.goal)}`
        : "Augnes is observing the current work and waiting for a saved result.",
      material_note: "A running host process is not treated as a successful result until its saved result is available.",
      action: workplaneActionV02("View current work"),
      action_reason: "The AI Workplane shows the current work without treating process activity as success.",
      project_management_emphasized: management,
      user_judgment: null,
    };
  }
  const result = projection.run_results.latest_result;
  const entry = projection.run_results.workbench_entry;
  if (result && entry) {
    return {
      focus: "result_ready",
      heading: "A result is ready",
      situation: publicGuideBriefTextV02(result.summary),
      material_note: result.blocker_count > 0 || result.gap_count > 0
        ? `${result.blocker_count} ${pluralV02(result.blocker_count, "blocker", "blockers")} and ${result.gap_count} ${pluralV02(result.gap_count, "open question", "open questions")} remain.`
        : "Verification found no remaining blocker or open question in this result.",
      action: entryActionV02(entry),
      action_reason: "A saved result is ready for the next existing review step.",
      project_management_emphasized: management,
      user_judgment: result.blocker_count > 0 || result.gap_count > 0
        ? {
            question: "How should the remaining blocker or open question be handled?",
            why: "The result cannot settle that judgment on the user's behalf.",
            blocked: ["Accepting a consequential project change"],
          }
        : null,
    };
  }
  const attention = projection.attention.items[0];
  if (attention) {
    return {
      focus: "attention_required",
      heading: "Your attention is needed",
      situation: publicGuideBriefTextV02(attention.summary),
      material_note: publicGuideBriefTextV02(attention.reason),
      action: attention.workbench_entry
        ? entryActionV02(attention.workbench_entry)
        : attention.action_href
          ? { kind: "link", label: publicGuideBriefTextV02(attention.action_label), href: attention.action_href, entry_state: null }
          : workplaneActionV02("Review current work"),
      action_reason: "This is the highest-priority current item that requires attention.",
      project_management_emphasized: management,
      user_judgment: {
        question: publicGuideBriefTextV02(attention.summary),
        why: publicGuideBriefTextV02(attention.reason),
        blocked: ["The next reviewed project step"],
      },
    };
  }
  const goal = projection.coordination.task_frame.goal;
  return {
    focus: "ready_to_continue",
    heading: goal ? "Ready to continue" : "What would you like to do next?",
    situation: goal
      ? `Current work: ${publicGuideBriefTextV02(goal)}`
      : `${name} is ready for your next piece of work.`,
    material_note: null,
    action: workplaneActionV02("Continue in AI Workplane"),
    action_reason: "The project is available and no more urgent state currently takes priority.",
    project_management_emphasized: management,
    user_judgment: null,
  };
}

function buildSourceRefsV02(
  source: BlankStateSourceV01,
  decision: FocusDecisionV02,
  projectName: string | null,
): GuideBriefSourceRefV02[] {
  const projection = source.projection;
  const values: GuideBriefSourceRefV02[] = [];
  const add = (value: GuideBriefSourceRefV02) => {
    if (!values.some((item) => item.ref_id === value.ref_id)) values.push(value);
  };
  add({ ref_id: "route:blank-state", kind: "route", label: "Current Blank State route", href: "/" });
  if (projection) {
    add({
      ref_id: stableRefV02("project", projection.project_id),
      kind: "project",
      label: projectName ?? "Current project",
      href: `/projects/${encodeURIComponent(projection.project_id)}`,
    });
    add({ ref_id: stableRefV02("project-state", projection.project_id), kind: "project_state", label: "Current project read model", href: "/" });
    if (projection.coordination.task_frame.goal) {
      add({ ref_id: stableRefV02("task", projection.coordination.task_frame.goal), kind: "task", label: "Current work goal", href: WORKPLANE_HREF });
    }
    const run = projection.run_results.current_run;
    if (run) add({ ref_id: stableRefV02("run", run.run_ref), kind: "run", label: "Current work", href: WORKPLANE_HREF });
    const result = projection.run_results.latest_result;
    if (result) add({ ref_id: stableRefV02("result", result.receipt_ref), kind: "result", label: "Latest saved result", href: result.review_href });
    for (const item of projection.attention.items.slice(0, 3)) {
      add({ ref_id: stableRefV02("attention", item.attention_id), kind: "attention", label: "Current attention item", href: item.workbench_entry?.href ?? item.action_href });
    }
    for (const item of projection.recent_activity.items.slice(0, GUIDE_BRIEF_LIMITS_V02.recent_changes)) {
      add({ ref_id: stableRefV02("change", `${item.occurred_at}:${item.summary}`), kind: "change", label: "Recent meaningful change", href: item.workbench_entry?.href ?? null });
    }
  } else if (source.requested_project_id ?? source.active_project_id) {
    const id = source.requested_project_id ?? source.active_project_id!;
    add({ ref_id: stableRefV02("project", id), kind: "project", label: projectName ?? "Saved project", href: `/projects/${encodeURIComponent(id)}` });
  }
  if (decision.action.kind === "link") {
    add({ ref_id: stableRefV02("route", decision.action.href), kind: "route", label: decision.action.label, href: decision.action.href });
  }
  return values.slice(0, GUIDE_BRIEF_LIMITS_V02.source_refs);
}

function buildObservedV02(
  source: BlankStateSourceV01,
  decision: FocusDecisionV02,
  refs: GuideBriefSourceRefV02[],
): GuideBriefObservedItemV02[] {
  const projection = source.projection;
  const result: GuideBriefObservedItemV02[] = [];
  const push = (statement: string, sourceRefs: string[]) => {
    result.push({ item_id: stableItemIdV02("observed", statement, sourceRefs), statement: boundedTextV02(statement)!, source_refs: dedupeV02(sourceRefs) });
  };
  const projectRef = refs.find((ref) => ref.kind === "project")?.ref_id ?? "route:blank-state";
  if (!projection) {
    push(
      source.recent_projects.length === 0
        ? "No local project is currently available to continue."
        : `${source.recent_projects.length} saved ${pluralV02(source.recent_projects.length, "project is", "projects are")} available for selection.`,
      [projectRef],
    );
    if (source.active_project_id) push("The saved current project could not be resolved from the current read model.", [projectRef]);
    return result.slice(0, GUIDE_BRIEF_LIMITS_V02.observed);
  }
  push(`${displayProjectNameV02(projection.project_summary.project.display_name)} is ${projection.project_summary.is_active ? "the current project" : "being viewed without changing the current project"}.`, [projectRef]);
  push(
    projection.project_summary.root_availability === "available"
      ? "The project's local folder is available."
      : "The project's local folder is not currently available.",
    [projectRef],
  );
  if (projection.coordination.task_frame.goal) {
    const taskRef = refs.find((ref) => ref.kind === "task")?.ref_id ?? projectRef;
    push(`The current goal is: ${publicGuideBriefTextV02(projection.coordination.task_frame.goal)}`, [taskRef]);
  }
  if (projection.run_results.current_run) {
    const runRef = refs.find((ref) => ref.kind === "run")?.ref_id ?? projectRef;
    push(
      projection.run_results.current_run.reconciliation_required
        ? "The current work requires reconciliation before a result can be trusted."
        : "Current work is still in progress and no terminal result is being inferred.",
      [runRef],
    );
  }
  const savedResult = projection.run_results.latest_result;
  if (savedResult) {
    const resultRef = refs.find((ref) => ref.kind === "result")?.ref_id ?? projectRef;
    push(`A saved result is available: ${publicGuideBriefTextV02(savedResult.summary)}`, [resultRef]);
    push(`Verification reports ${savedResult.check_counts.passed} passed, ${savedResult.check_counts.failed} failed, and ${savedResult.check_counts.skipped} skipped checks.`, [resultRef]);
  }
  if (projection.attention.items[0]) {
    const attentionRef = refs.find((ref) => ref.kind === "attention")?.ref_id ?? projectRef;
    push(`The highest-priority attention item is: ${publicGuideBriefTextV02(projection.attention.items[0].summary)}`, [attentionRef]);
  }
  if (result.length === 0) push(decision.situation, [projectRef]);
  return result.slice(0, GUIDE_BRIEF_LIMITS_V02.observed);
}

function buildInferredV02(
  source: BlankStateSourceV01,
  decision: FocusDecisionV02,
  observed: GuideBriefObservedItemV02[],
): GuideBriefInferredItemV02[] {
  const support = observed.map((item) => item.item_id).slice(0, 3);
  if (support.length === 0) return [];
  const caveats = source.project_resolution === "resolved"
    ? ["This interpretation is derived from bounded current read models and is not project truth."]
    : ["Current project sources are incomplete or unavailable."];
  const item: GuideBriefInferredItemV02 = {
    item_id: stableItemIdV02("inferred", decision.action_reason, support),
    statement: decision.action_reason,
    supporting_observation_ids: support,
    confidence: source.project_resolution === "resolved" ? "high" : "low",
    caveats,
  };
  return [item].slice(0, GUIDE_BRIEF_LIMITS_V02.inferred);
}

function buildSuggestedV02(
  decision: FocusDecisionV02,
  refs: GuideBriefSourceRefV02[],
): GuideBriefSuggestedItemV02[] {
  return [{
    item_id: stableItemIdV02("suggested", decision.action.label, refs.map((ref) => ref.ref_id).slice(0, 4)),
    label: decision.action.label,
    reason: decision.action_reason,
    href: actionHrefV02(decision.action),
    action_ref: actionRefV02(decision.action),
    blockers: decision.user_judgment?.blocked ?? [],
    source_refs: refs.map((ref) => ref.ref_id).slice(0, 4),
    executes: false,
  }];
}

function buildJudgmentsV02(
  decision: FocusDecisionV02,
  refs: GuideBriefSourceRefV02[],
): GuideBriefUserJudgmentItemV02[] {
  if (!decision.user_judgment) return [];
  const sourceRefs = refs.map((ref) => ref.ref_id).slice(0, 4);
  return [{
    item_id: stableItemIdV02("judgment", decision.user_judgment.question, sourceRefs),
    question: boundedTextV02(decision.user_judgment.question)!,
    why_it_matters: boundedTextV02(decision.user_judgment.why)!,
    blocked: boundedListV02(decision.user_judgment.blocked, 4),
    source_refs: sourceRefs,
    resolved: false,
  }];
}

function buildBlankStateProjectionV02(input: {
  source: BlankStateSourceV01;
  decision: FocusDecisionV02;
  sourceStatus: ProjectGuideBriefSourceStatusV02;
  projectContext: ProjectGuideBriefProjectContextV02;
  projectName: string | null;
  observed: GuideBriefObservedItemV02[];
  inferred: GuideBriefInferredItemV02[];
  judgments: GuideBriefUserJudgmentItemV02[];
}): ProjectGuideBriefV02["projections"]["blank_state"] {
  const projection = input.source.projection;
  const run = projection?.run_results.current_run ?? null;
  const result = projection?.run_results.latest_result ?? null;
  const primaryAttentionId = input.decision.focus === "attention_required"
    ? projection?.attention.items[0]?.attention_id
    : null;
  return {
    blank_state_view_version: BLANK_STATE_VIEW_VERSION_V01,
    guide_version: GUIDE_BRIEF_VERSION_V02,
    source_status: input.sourceStatus,
    project_context: input.projectContext,
    focus: input.decision.focus,
    route_mode: input.source.route_mode,
    project_name: input.projectName,
    project_context_label: input.projectContext === "current"
      ? "Current project"
      : input.projectContext === "viewed"
        ? "Viewed project"
        : null,
    heading: input.decision.heading,
    situation: input.decision.situation,
    material_note: input.decision.material_note,
    primary_action: input.decision.action,
    project_management_emphasized: input.decision.project_management_emphasized,
    current_work: projection && (run || result)
      ? {
          status: run ? run.reconciliation_required ? "Needs observation" : "In progress" : "Result saved",
          goal: boundedTextV02(projection.coordination.task_frame.goal),
          result_summary: boundedTextV02(result?.summary ?? null),
          verification: result ? { passed: result.check_counts.passed, failed: result.check_counts.failed, skipped: result.check_counts.skipped } : null,
          exact_detail_href: result?.inspector_href ?? null,
        }
      : null,
    additional_attention: (projection?.attention.items ?? [])
      .filter((item) => item.attention_id !== primaryAttentionId)
      .slice(0, 2)
      .map((item) => ({
        id: stableItemIdV02("attention", item.attention_id, []),
        summary: publicGuideBriefTextV02(item.summary),
        reason: publicGuideBriefTextV02(item.reason),
        href: item.workbench_entry?.href ?? item.action_href,
        label: item.workbench_entry ? ordinaryActionLabelV02(item.workbench_entry.entry_state) : publicGuideBriefTextV02(item.action_label),
      })),
    recent_change: projection?.recent_activity.items[0]
      ? { summary: publicGuideBriefTextV02(projection.recent_activity.items[0].summary), occurred_at: projection.recent_activity.items[0].occurred_at }
      : null,
    why_this_is_next: {
      observed: input.observed.slice(0, 3).map((item) => item.statement),
      inferred: input.inferred.slice(0, 2).map((item) => ({ statement: item.statement, caveats: item.caveats })),
      needs_user_judgment: input.judgments.slice(0, 2).map((item) => item.question),
    },
    projection_only: true,
    semantic_authority_granted: false,
  };
}

function buildCodexProjectionV02(input: {
  source: BlankStateSourceV01;
  status: "available" | "unavailable";
  workspace_id: string | null;
  project_id: string | null;
  project_name: string | null;
  coordinate: string;
  goal: string | null;
  judgments: GuideBriefUserJudgmentItemV02[];
  primary_label: string;
  refs: GuideBriefSourceRefV02[];
  unavailable_reason: string | null;
}): GuideBriefCodexProjectionV02 {
  const frame = input.source.projection?.coordination.task_frame;
  return {
    guide_version: GUIDE_BRIEF_VERSION_V02,
    projection_version: "guide_brief_codex_projection.v0.2",
    status: input.status,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    project_name: input.project_name,
    current_goal: input.goal,
    current_coordinate: input.coordinate,
    constraints: boundedListV02(frame?.forbidden_actions ?? [], 8),
    required_checks: boundedListV02(frame?.required_checks ?? [], 8),
    non_goals: boundedListV02(frame?.non_goals ?? [], 8),
    unresolved_user_judgments: input.judgments.map((item) => item.question),
    important_risk_or_gap: boundedTextV02(frame?.risks?.[0] ?? frame?.gaps?.[0] ?? null),
    suggested_next_action: input.primary_label,
    source_refs: input.refs.map((ref) => ref.ref_id).slice(0, GUIDE_BRIEF_LIMITS_V02.source_refs),
    packet_binding: null,
    task_context_packet_delivered_separately: true,
    guide_does_not_override_packet: true,
    suggestions_are_not_commands: true,
    authority_remains_with_user_and_core: true,
    can_approve: false,
    can_execute_codex: false,
    can_grant_host_permission: false,
    unavailable_reason: input.unavailable_reason,
  };
}

function authorityBoundaryV02(): GuideBriefAuthorityBoundaryV02 {
  return {
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
    notes: [
      "GuideBrief is a View, not a source of truth.",
      "TaskContextPacket remains the exact execution contract and is delivered separately.",
      "User and Core authority remain separate from this projection.",
      "Suggestions are not instructions, proof, or Evidence.",
    ],
  };
}

function sourceStatusV02(
  source: BlankStateSourceV01,
  context: ProjectGuideBriefProjectContextV02,
): ProjectGuideBriefSourceStatusV02 {
  if (source.project_resolution === "not_found" || source.project_resolution === "unavailable") return "unavailable";
  if (!source.projection) return "project_choice";
  if (source.projection.project_summary.root_availability !== "available") return "partial";
  return context === "viewed" ? "viewed_project" : "live_current_project";
}

function projectContextV02(source: BlankStateSourceV01): ProjectGuideBriefProjectContextV02 {
  if (!source.projection) return "none";
  return source.projection.project_summary.is_active ? "current" : "viewed";
}

function rootResolutionV02(source: BlankStateSourceV01): ProjectGuideBriefV02["identity"]["root_resolution"] {
  if (source.project_resolution === "not_found") return "not_found";
  if (source.project_resolution === "unavailable") return "unavailable";
  if (!source.projection) return "none";
  return source.projection.project_summary.root_availability === "available" ? "available" : "unavailable";
}

function sourceGapsV02(source: BlankStateSourceV01): string[] {
  const gaps: string[] = [];
  if (!source.projection && source.project_resolution !== "none") gaps.push("Current project detail could not be resolved.");
  if (source.projection?.project_summary.root_availability !== undefined && source.projection.project_summary.root_availability !== "available") gaps.push("The local project folder is unavailable.");
  if (!source.projection?.coordination.task_frame.goal && source.projection) gaps.push("No current work goal is available.");
  return boundedListV02(gaps, 4);
}

function workStatusV02(source: BlankStateSourceV01, decision: FocusDecisionV02): string {
  const projection = source.projection;
  if (!projection) return source.recent_projects.length === 0 ? "No project selected" : "Project selection needed";
  if (projection.project_summary.root_availability !== "available") return "Project folder needs reconnection";
  if (!projection.project_summary.is_active) return "Viewed project is not active";
  if (projection.run_results.current_run?.reconciliation_required) return "Current work needs reconciliation";
  if (projection.run_results.current_run) return "Work in progress";
  if (projection.run_results.latest_result) return "Result ready for review";
  if (projection.attention.items.length > 0) return "User attention required";
  return decision.focus === "ready_to_continue" ? "Ready to continue" : decision.heading;
}

function actionHrefV02(action: BlankStatePrimaryActionV01): string | null {
  if (action.kind === "link") return action.href;
  if (action.kind === "choose_folder") return "/projects#choose-project";
  return `/projects/${encodeURIComponent(action.project_id)}`;
}

function actionRefV02(action: BlankStatePrimaryActionV01): string | null {
  return action.kind === "link" ? null : action.kind;
}

function entryActionV02(entry: SemanticWorkbenchEntryV01): BlankStatePrimaryActionV01 {
  return { kind: "link", label: ordinaryActionLabelV02(entry.entry_state, entry.action_label), href: entry.href, entry_state: entry.entry_state };
}

function workplaneActionV02(label: string): BlankStatePrimaryActionV01 {
  return { kind: "link", label, href: WORKPLANE_HREF, entry_state: null };
}

function recentTargetNameV02(source: BlankStateSourceV01): string | null {
  const id = source.requested_project_id ?? source.active_project_id;
  const entry = id ? source.recent_projects.find((item) => item.project.project_id === id) : null;
  return entry ? displayProjectNameV02(entry.project.display_name) : null;
}

function displayProjectNameV02(value: string | null): string {
  return boundedTextV02(value?.trim() || "Unnamed project")!;
}

function boundedTextV02(value: string | null): string | null {
  if (value === null) return null;
  const safe = publicGuideBriefTextV02(value.trim()).replace(/[\u0000-\u001f\u007f]/gu, " ").replace(/\s+/gu, " ");
  if (Buffer.byteLength(safe, "utf8") <= GUIDE_BRIEF_LIMITS_V02.text_bytes) return safe;
  let result = safe;
  while (Buffer.byteLength(`${result}…`, "utf8") > GUIDE_BRIEF_LIMITS_V02.text_bytes) result = result.slice(0, -1);
  return `${result}…`;
}

function boundedListV02(values: string[], limit: number): string[] {
  return dedupeV02(values.map((value) => boundedTextV02(value)).filter((value): value is string => Boolean(value))).slice(0, limit);
}

function dedupeV02(values: string[]): string[] {
  return [...new Set(values)];
}

function stableItemIdV02(kind: string, value: string, refs: string[]): string {
  return `${kind}:${createHash("sha256").update(JSON.stringify([value, ...refs])).digest("hex").slice(0, 24)}`;
}

function stableRefV02(kind: string, value: string): string {
  return `${kind}:${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function strictTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) throw new Error("guide_brief_generated_at_invalid");
  return value;
}

function pluralV02(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function assertGuideBriefBoundsV02(guide: ProjectGuideBriefV02): void {
  if (
    guide.observed.length > GUIDE_BRIEF_LIMITS_V02.observed ||
    guide.inferred.length > GUIDE_BRIEF_LIMITS_V02.inferred ||
    guide.suggested.length > GUIDE_BRIEF_LIMITS_V02.suggested ||
    guide.needs_user_judgment.length > GUIDE_BRIEF_LIMITS_V02.needs_user_judgment ||
    guide.source_refs.length > GUIDE_BRIEF_LIMITS_V02.source_refs
  ) throw new Error("guide_brief_collection_bound_exceeded");
  if (Buffer.byteLength(JSON.stringify(guide), "utf8") > GUIDE_BRIEF_LIMITS_V02.serialized_bytes) throw new Error("guide_brief_serialized_bound_exceeded");
}
