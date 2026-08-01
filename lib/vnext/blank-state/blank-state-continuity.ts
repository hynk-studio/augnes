import { createHash } from "node:crypto";

import {
  ordinaryActionLabelV02,
  publicGuideBriefTextV02,
} from "@/lib/vnext/guide-brief/public-guide-text";
import {
  buildContinuityPinEligibilityV01,
} from "@/lib/vnext/continuity-pins/continuity-pin-target";
import type {
  BlankStateAttentionCategoryV01,
  BlankStateAttentionCountStatusV01,
  BlankStateContinuityItemV01,
  BlankStateContinuityLinkV01,
  BlankStateFocusV01,
  BlankStatePrimaryActionV01,
  BlankStateSourceV01,
} from "@/types/vnext/blank-state";
import type {
  ProjectHomeActivityItemV01,
  ProjectHomePendingAttentionItemV01,
} from "@/types/vnext/project-home";
import type {
  ContinuityPinSupportedOwnerV01,
} from "@/types/vnext/continuity-pins";

const WORKPLANE_HREF = "/workbench/semantic-review";
const MAX_VISIBLE_ITEMS = 5;

interface ContinuityUserJudgmentV01 {
  question: string;
  why: string;
  blocked: string[];
}

interface ContinuityCandidateV01 {
  item: BlankStateContinuityItemV01;
  focus: BlankStateFocusV01;
  heading: string;
  situation: string;
  material_note: string | null;
  guide_action: BlankStatePrimaryActionV01;
  action_reason: string;
  user_judgment: ContinuityUserJudgmentV01 | null;
  sort_class: number;
  source_priority: number;
  currentness: number;
  stable_tie_breaker: string;
}

export interface BlankStateContinuityCompositionV01 {
  focus: BlankStateFocusV01;
  heading: string;
  situation: string;
  material_note: string | null;
  continuity_summary: string;
  known_attention_count: number;
  attention_count_status: BlankStateAttentionCountStatusV01;
  known_continuity_item_count: number;
  locally_omitted_item_count: number;
  source_omitted_attention_count: number | null;
  source_attention_destination: BlankStateContinuityLinkV01 | null;
  highlighted_item: BlankStateContinuityItemV01;
  continuity_items: BlankStateContinuityItemV01[];
  primary_action: BlankStatePrimaryActionV01 | null;
  guide_action: BlankStatePrimaryActionV01;
  action_reason: string;
  project_management_emphasized: boolean;
  user_judgment: ContinuityUserJudgmentV01 | null;
}

export function buildBlankStateContinuityV01(
  source: BlankStateSourceV01,
): BlankStateContinuityCompositionV01 {
  const projectLifecycle = projectLifecycleCompositionV01(source);
  if (projectLifecycle) return projectLifecycle;
  const workInitialization = workInitializationCompositionV01(source);
  if (workInitialization) return workInitialization;

  const projection = source.projection!;
  const candidates: ContinuityCandidateV01[] = [];
  const delegated = source.delegated_work;
  if (delegated && delegated.stage !== "not_started") {
    candidates.push(delegatedCandidateV01(source));
  } else if (projection.run_results.current_run) {
    candidates.push(currentRunCandidateV01(source));
  }

  if (projection.run_results.latest_result && projection.run_results.workbench_entry) {
    candidates.push(savedResultCandidateV01(source));
  }

  for (const attention of projection.attention.items) {
    candidates.push(projectAttentionCandidateV01(source, attention));
  }

  for (const change of projection.recent_activity.items.slice(0, 3)) {
    candidates.push(recentChangeCandidateV01(source, change));
  }

  const hasCurrentResponsibility = candidates.some(
    (candidate) =>
      candidate.item.requires_human_attention ||
      ["delegated_work", "current_run", "saved_result"].includes(
        candidate.item.source_family,
      ),
  );
  if (!hasCurrentResponsibility) candidates.push(continuationCandidateV01(source));

  const ordered = deduplicateCandidatesV01(candidates.sort(compareCandidatesV01));
  const knownAttentionCount = ordered.filter(
    (candidate) => candidate.item.requires_human_attention,
  ).length;
  const sourceAttentionBoundary = sourceAttentionBoundaryV01(source);
  const visible = ordered.slice(0, MAX_VISIBLE_ITEMS);
  const highlighted = visible[0] ?? continuationCandidateV01(source);
  const remaining = visible.slice(1);
  const workContinuing = ordered.some((candidate) =>
    ["delegated_work", "current_run"].includes(candidate.item.source_family),
  );
  const continuitySummary = continuitySummaryV01({
    knownAttentionCount,
    workContinuing,
    sourceStatus: sourceAttentionBoundary.status,
  });

  return {
    focus: highlighted.focus,
    heading: highlighted.heading,
    situation: highlighted.situation,
    material_note: highlighted.material_note,
    continuity_summary: continuitySummary,
    known_attention_count: knownAttentionCount,
    attention_count_status: sourceAttentionBoundary.status,
    known_continuity_item_count: ordered.length,
    locally_omitted_item_count: Math.max(0, ordered.length - MAX_VISIBLE_ITEMS),
    source_omitted_attention_count:
      sourceAttentionBoundary.omittedAttentionCount,
    source_attention_destination:
      sourceAttentionBoundary.status === "complete"
        ? null
        : {
            label: "Review project attention",
            href: WORKPLANE_HREF,
          },
    highlighted_item: highlighted.item,
    continuity_items: remaining.map((candidate) => candidate.item),
    primary_action: highlighted.item.next_action,
    guide_action: highlighted.guide_action,
    action_reason: highlighted.action_reason,
    project_management_emphasized:
      source.route_mode === "project_management",
    user_judgment: highlighted.user_judgment,
  };
}

function workInitializationCompositionV01(
  source: BlankStateSourceV01,
): BlankStateContinuityCompositionV01 | null {
  const initialization = source.work_initialization;
  if (!initialization) return null;
  if (initialization.state === "not_defined") {
    const action = linkActionV01(
      "Define first work",
      `${WORKPLANE_HREF}#first-work`,
      "define_first_work",
    );
    return singleItemCompositionV01({
      source,
      item: itemV01({
        family: "work_initialization",
        stable_basis: `first-work:${initialization.project_id}`,
        work_name: "Define the first project work",
        meaningful_state: "No work has been defined yet",
        consequential_detail:
          "Define the first goal and what success should look like before starting delegated work.",
        next_action: action,
      }),
      focus: "first_work_not_defined",
      heading: "No work has been defined for this project yet",
      situation:
        "Define the first goal and what success should look like before starting delegated work.",
      material_note: null,
      continuity_summary:
        "Project setup is ready. No work or execution has started.",
      guide_action: action,
      action_reason:
        "A bounded first-work definition is required before delegated work can start.",
      project_management_emphasized:
        source.route_mode === "project_management",
    });
  }
  if (initialization.state === "existing_history_without_current_packet") {
    const projection = source.projection;
    const hasOwnedCurrentPresentation = Boolean(
      (source.delegated_work &&
        source.delegated_work.stage !== "not_started") ||
        projection?.run_results.current_run ||
        projection?.run_results.latest_result ||
        projection?.attention.items.length,
    );
    if (hasOwnedCurrentPresentation) return null;
    const action = linkActionV01(
      "Open AI Workplane",
      WORKPLANE_HREF,
      "work_instructions_unavailable",
    );
    return singleItemCompositionV01({
      source,
      item: itemV01({
        family: "work_initialization",
        stable_basis: `work-unavailable:${initialization.project_id}`,
        work_name: "Current work instructions",
        meaningful_state: "Current work instructions need refresh",
        consequential_detail:
          "Existing durable work history prevents creating a new first-work definition.",
        next_action: action,
      }),
      focus: "work_instructions_unavailable",
      heading: "Current work instructions are unavailable",
      situation:
        "This project has durable work history, so Augnes will not replace it with a new first-work definition.",
      material_note:
        "Refresh or recover the current work context before starting delegated work.",
      continuity_summary:
        "Existing work history is preserved while current instructions are recovered.",
      guide_action: action,
      action_reason:
        "Existing project history must remain intact while current work context is recovered.",
      project_management_emphasized:
        source.route_mode === "project_management",
    });
  }
  if (
    initialization.state === "unavailable" &&
    !source.projection?.coordination.task_frame.goal
  ) {
    const action = linkActionV01(
      "Open AI Workplane",
      WORKPLANE_HREF,
      "work_instructions_unavailable",
    );
    return singleItemCompositionV01({
      source,
      item: itemV01({
        family: "work_initialization",
        stable_basis: `work-source-unavailable:${initialization.project_id}`,
        work_name: "Current work instructions",
        meaningful_state: "Current work status could not be verified",
        consequential_detail:
          "Augnes did not infer that this is a new project while durable work sources were unavailable.",
        next_action: action,
      }),
      focus: "work_instructions_unavailable",
      heading: "Current work status is unavailable",
      situation:
        "Augnes cannot safely determine whether this project is new or already has work history.",
      material_note: null,
      continuity_summary:
        "No first-work definition is offered until project history can be verified.",
      guide_action: action,
      action_reason:
        "Failing closed avoids replacing unknown project history.",
      project_management_emphasized:
        source.route_mode === "project_management",
    });
  }
  return null;
}

function projectLifecycleCompositionV01(
  source: BlankStateSourceV01,
): BlankStateContinuityCompositionV01 | null {
  const projection = source.projection;
  const management = source.route_mode === "project_management";
  if (!projection) {
    if (source.recent_projects.length === 0) {
      const action = {
        kind: "choose_folder",
        label: "Choose a local project",
      } satisfies BlankStatePrimaryActionV01;
      return singleItemCompositionV01({
        source,
        item: itemV01({
          family: "project_lifecycle",
          stable_basis: "no-project",
          work_name: "Choose a project",
          meaningful_state: "No local project is selected",
          consequential_detail:
            "A project is needed before Augnes can start or resume long-running work.",
          next_action: action,
        }),
        focus: "no_projects",
        heading: "What are you trying to do?",
        situation:
          "Choose a local project so Augnes can help you start or continue work.",
        material_note: null,
        continuity_summary:
          "No project is selected. Choose one to begin or resume work.",
        guide_action: action,
        action_reason: "A local project is needed before work can start.",
        project_management_emphasized: true,
      });
    }
    const active = source.active_project_id
      ? source.recent_projects.find(
          (item) => item.project.project_id === source.active_project_id,
        )
      : null;
    const first =
      active ??
      source.recent_projects.find(
        (item) => item.root_availability === "available",
      ) ??
      source.recent_projects[0]!;
    const name = displayProjectNameV01(first.project.display_name);
    const unavailableCurrent = Boolean(source.active_project_id);
    const recoveryRequired =
      unavailableCurrent || first.root_availability !== "available";
    const action = first.root_availability === "available"
      ? {
          kind: "open_recent",
          label: `Continue with ${name}`,
          project_id: first.project.project_id,
        } satisfies BlankStatePrimaryActionV01
      : {
          kind: "locate_folder",
          label: `Locate ${name}`,
          project_id: first.project.project_id,
        } satisfies BlankStatePrimaryActionV01;
    return singleItemCompositionV01({
      source,
      item: itemV01({
        family: "project_lifecycle",
        stable_basis: `project-choice:${first.project.project_id}`,
        work_name: name,
        meaningful_state: recoveryRequired
          ? "Current project needs reconnection"
          : "Available to continue",
        requires_attention: recoveryRequired,
        attention_category: recoveryRequired ? "project_recovery" : null,
        consequential_detail: recoveryRequired
          ? "The saved project record remains intact, but its usable project view must be recovered."
          : "Opening a saved project makes its existing work current.",
        next_action: action,
      }),
      focus: "project_choice",
      heading: unavailableCurrent
        ? "Reconnect your current project"
        : "Choose where to continue",
      situation: unavailableCurrent
        ? "Your current project record is safe, but its saved project view could not be opened. Choose or reconnect a project below."
        : "Continue an existing project or choose another local folder.",
      material_note: unavailableCurrent
        ? "No project was switched and no stored project data was changed."
        : null,
      continuity_summary: recoveryRequired
        ? "The current project needs a bounded recovery step before work can continue."
        : "No work needs intervention. Choose the project you want to continue.",
      guide_action: action,
      action_reason: recoveryRequired
        ? "The saved project must be usable before its work can continue."
        : "This is the most recent available project.",
      project_management_emphasized: true,
    });
  }

  const name = displayProjectNameV01(
    projection.project_summary.project.display_name,
  );
  if (projection.project_summary.root_availability !== "available") {
    const action = {
      kind: "locate_folder",
      label: "Locate folder",
      project_id: projection.project_id,
    } satisfies BlankStatePrimaryActionV01;
    return singleItemCompositionV01({
      source,
      item: itemV01({
        family: "project_lifecycle",
        stable_basis: `root-unavailable:${projection.project_id}`,
        work_name: name,
        meaningful_state: "Project folder is unavailable",
        requires_attention: true,
        attention_category: "project_recovery",
        consequential_detail:
          "The saved project record is safe, but work cannot continue until its folder is reconnected.",
        next_action: action,
      }),
      focus: "project_root_unavailable",
      heading: `Reconnect ${name}`,
      situation:
        "The project record is safe, but Augnes cannot reach its local folder.",
      material_note:
        "Locate the folder to reconnect it. Nothing will be changed until you confirm the folder.",
      continuity_summary:
        "This project needs one bounded recovery step before work can continue.",
      guide_action: action,
      action_reason:
        "The current project cannot be used until its folder is reconnected.",
      project_management_emphasized: true,
    });
  }
  if (!projection.project_summary.is_active) {
    const action = {
      kind: "make_active",
      label: "Make active",
      project_id: projection.project_id,
    } satisfies BlankStatePrimaryActionV01;
    return singleItemCompositionV01({
      source,
      item: itemV01({
        family: "project_lifecycle",
        stable_basis: `viewed-project:${projection.project_id}`,
        work_name: name,
        meaningful_state: "Viewed without changing the current project",
        requires_attention: true,
        attention_category: "project_activation",
        consequential_detail:
          "Project-changing work remains blocked until you explicitly make this the current project.",
        next_action: action,
      }),
      focus: "viewed_project_inactive",
      heading: `You are viewing ${name}`,
      situation: "Opening this link did not switch your current project.",
      material_note:
        "Make this project active before changing controls or starting work.",
      continuity_summary:
        "This viewed project needs explicit activation before project-changing work can continue.",
      guide_action: action,
      action_reason:
        "Project-changing work must stay bound to the active project.",
      project_management_emphasized: management,
      user_judgment: {
        question: `Should ${name} become the current project?`,
        why: "Changing the active project changes where subsequent work is scoped.",
        blocked: ["Starting or changing project-scoped work"],
      },
    });
  }
  return null;
}

function delegatedCandidateV01(
  source: BlankStateSourceV01,
): ContinuityCandidateV01 {
  const delegated = source.delegated_work!;
  const goal = textV01(
    delegated.current.goal ??
      source.projection?.coordination.task_frame.goal ??
      "Delegated work",
  );
  const secondary = {
    label:
      delegated.stage === "result_ready" ? "Review result" : "View progress",
    href:
      delegated.result?.review_href ??
      delegated.next_action.href ??
      `${WORKPLANE_HREF}#delegated-work`,
  };
  const timestamp =
    delegated.current.last_observed_at ??
    delegated.updated_at ??
    delegated.started_at;
  const change = timestamp
    ? {
        summary: textV01(
          delegated.current.latest_checkpoint ??
            delegated.current.stage_label,
        ),
        occurred_at: timestamp,
      }
    : null;

  if (delegated.stage === "waiting_for_approval") {
    const action = linkActionV01(
      "Review requested access",
      `${WORKPLANE_HREF}#delegated-work-approval`,
      "delegated_work",
    );
    return candidateV01({
      item: itemV01({
        family: "delegated_work",
        stable_basis: `delegated-access:${delegated.run_ref ?? goal}`,
        work_name: goal,
        meaningful_state: "Waiting for a bounded access decision",
        requires_attention: true,
        attention_category: "access_judgment",
        last_change: change,
        consequential_detail:
          delegated.current.material_blocker_or_request ??
          "Delegated work cannot continue until the request is approved or declined.",
        next_action: action,
        secondary_action: delegated.exact_detail_href
          ? { label: "View exact details", href: delegated.exact_detail_href }
          : null,
        exact_detail_href: delegated.exact_detail_href,
        pinning: pinningInputV01(source, delegatedPinOwnerV01(source)),
      }),
      focus: "work_requires_attention",
      heading: "Codex needs your decision",
      situation:
        "Delegated work is waiting for you to review a bounded access request.",
      material_note: delegated.current.material_blocker_or_request,
      guide_action: action,
      action_reason:
        "Codex cannot continue until the bounded request is approved or declined.",
      user_judgment: {
        question: "Should Codex receive this bounded access once?",
        why: "The operational request remains separate from any project decision.",
        blocked: ["Continuing the delegated Codex work"],
      },
      sort_class: 0,
      source_priority: 0,
      timestamp,
    });
  }
  if (delegated.stage === "resume_required") {
    const action = linkActionV01(
      "Resume in AI Workplane",
      `${WORKPLANE_HREF}#delegated-work`,
      "delegated_work",
    );
    return candidateV01({
      item: itemV01({
        family: "delegated_work",
        stable_basis: `delegated-resume:${delegated.run_ref ?? goal}`,
        work_name: goal,
        meaningful_state: "Interrupted; explicit resume required",
        requires_attention: true,
        attention_category: "explicit_resume",
        last_change: change,
        consequential_detail:
          "Runtime ownership was lost. Augnes will not assume that the work continued or retry it automatically.",
        next_action: action,
        exact_detail_href: delegated.exact_detail_href,
        pinning: pinningInputV01(source, delegatedPinOwnerV01(source)),
      }),
      focus: "work_requires_attention",
      heading: "Codex work was interrupted",
      situation:
        "The local runtime lost ownership and will not assume that work continued.",
      material_note:
        "Resume reuses the same admitted run and exact host binding. It is never automatic.",
      guide_action: action,
      action_reason:
        "The interrupted work requires an explicit resume before progress can continue.",
      sort_class: 0,
      source_priority: 5,
      timestamp,
    });
  }
  if (delegated.stage === "result_ready" && delegated.result?.review_href) {
    const action = linkActionV01(
      "Review result",
      delegated.result.review_href,
      "result_ready",
    );
    return candidateV01({
      item: itemV01({
        family: "delegated_work",
        stable_basis: `delegated-result:${delegated.result.receipt_ref}`,
        work_name: goal,
        meaningful_state: "Trusted saved result ready for review",
        requires_attention: true,
        attention_category: "result_review",
        last_change: change,
        consequential_detail:
          "Host completion alone was not treated as a result; this review step is available because a trusted result was saved.",
        next_action: action,
        exact_detail_href: delegated.exact_detail_href,
        pinning: pinningInputV01(source, delegatedPinOwnerV01(source)),
      }),
      focus: "result_ready",
      heading: "A result is ready",
      situation: "The delegated Codex result was saved and is ready to review.",
      material_note:
        "Result readiness comes from the trusted saved result, not host completion alone.",
      guide_action: action,
      action_reason: "A trusted result is available for review.",
      sort_class: 10,
      source_priority: 0,
      timestamp,
    });
  }

  const ordinaryStage = ["preparing", "working", "cancelling"].includes(
    delegated.stage,
  );
  const state = delegated.stage === "preparing"
    ? "Preparing normally"
    : delegated.stage === "working"
      ? "Working normally"
      : delegated.stage === "cancelling"
        ? "Stopping normally"
        : textV01(delegated.current.stage_label);
  const guideAction = linkActionV01(
    ordinaryStage ? "View progress" : "Review current work",
    secondary.href,
    "delegated_work",
  );
  return candidateV01({
    item: itemV01({
      family: "delegated_work",
      stable_basis: `delegated:${delegated.run_ref ?? delegated.stage}:${delegated.stage}`,
      work_name: goal,
      meaningful_state: state,
      last_change: change,
      consequential_detail:
        delegated.current.material_blocker_or_request ??
        (ordinaryStage
          ? "No intervention is required while this lifecycle state continues normally."
          : delegated.gap_notes[0] ?? null),
      secondary_action: { label: guideAction.label, href: guideAction.href },
      exact_detail_href: delegated.exact_detail_href,
      pinning: pinningInputV01(source, delegatedPinOwnerV01(source)),
    }),
    focus: ordinaryStage ? "work_in_progress" : "ready_to_continue",
    heading: delegated.stage === "cancelling"
      ? "Codex is stopping"
      : ordinaryStage
        ? "Codex is working"
        : "Review the latest work state",
    situation: ordinaryStage
      ? `${goal} is continuing without requiring your intervention.`
      : textV01(delegated.current.situation),
    material_note:
      delegated.current.latest_checkpoint ??
      delegated.current.material_blocker_or_request,
    guide_action: guideAction,
    action_reason: ordinaryStage
      ? "Progress remains available without treating normal activity as an alarm or successful result."
      : "The settled or unavailable work state remains visible without creating an approval requirement.",
    sort_class: ordinaryStage ? 20 : 25,
    source_priority: 0,
    timestamp,
  });
}

function currentRunCandidateV01(
  source: BlankStateSourceV01,
): ContinuityCandidateV01 {
  const projection = source.projection!;
  const run = projection.run_results.current_run!;
  const goal = textV01(
    projection.coordination.task_frame.goal ?? "Current work",
  );
  const action = linkActionV01(
    run.reconciliation_required ? "Review current work" : "View progress",
    WORKPLANE_HREF,
    null,
  );
  if (run.reconciliation_required) {
    return candidateV01({
      item: itemV01({
        family: "current_run",
        stable_basis: `run-reconciliation:${run.run_ref}`,
        work_name: goal,
        meaningful_state: "Observation incomplete; reconciliation required",
        requires_attention: true,
        attention_category: "reconciliation",
        last_change: {
          summary: "The latest complete observation was lost.",
          occurred_at: run.updated_at,
        },
        consequential_detail:
          "No result will be inferred until the recorded lifecycle and current observation are reconciled.",
        next_action: action,
        pinning: pinningInputV01(source, {
          kind: "managed_run",
          run_ref: run.run_ref,
        }),
      }),
      focus: "work_requires_attention",
      heading: "Current work needs to be checked",
      situation:
        "Augnes lost a complete observation of the running work and will not infer a result.",
      material_note:
        "Review the current work before continuing or accepting any project change.",
      guide_action: action,
      action_reason:
        "The current work state must be reconciled before its result can be trusted.",
      sort_class: 0,
      source_priority: 10,
      timestamp: run.updated_at,
    });
  }
  return candidateV01({
    item: itemV01({
      family: "current_run",
      stable_basis: `current-run:${run.run_ref}`,
      work_name: goal,
      meaningful_state: "Work is in progress",
      last_change: {
        summary: textV01(run.public_reason ?? "Progress was observed."),
        occurred_at: run.updated_at,
      },
      consequential_detail:
        "The running host process has not produced a trusted saved result and does not require intervention.",
      secondary_action: { label: "View progress", href: WORKPLANE_HREF },
      pinning: pinningInputV01(source, {
        kind: "managed_run",
        run_ref: run.run_ref,
      }),
    }),
    focus: "work_in_progress",
    heading: "Work is in progress",
    situation: `${goal} is continuing without requiring your intervention.`,
    material_note:
      "A running host process is not treated as a successful result until its saved result is available.",
    guide_action: action,
    action_reason:
      "The AI Workplane shows current progress without treating process activity as success.",
    sort_class: 20,
    source_priority: 10,
    timestamp: run.updated_at,
  });
}

function savedResultCandidateV01(
  source: BlankStateSourceV01,
): ContinuityCandidateV01 {
  const projection = source.projection!;
  const result = projection.run_results.latest_result!;
  const entry = projection.run_results.workbench_entry!;
  const action = linkActionV01(
    ordinaryActionLabelV02(entry.entry_state, entry.action_label),
    entry.href,
    entry.entry_state,
  );
  const unresolved = result.blocker_count > 0 || result.gap_count > 0;
  return candidateV01({
    item: itemV01({
      family: "saved_result",
      stable_basis: `saved-result:${result.receipt_ref}`,
      work_name: textV01(
        projection.coordination.task_frame.goal ?? "Latest saved result",
      ),
      meaningful_state: "Trusted saved result ready for review",
      requires_attention: true,
      attention_category: "result_review",
      last_change: {
        summary: textV01(result.summary),
        occurred_at: result.recorded_at,
      },
      consequential_detail: unresolved
        ? `${result.blocker_count} ${pluralV01(result.blocker_count, "blocker", "blockers")} and ${result.gap_count} ${pluralV01(result.gap_count, "open question", "open questions")} remain.`
        : "Execution completion is recorded, but verified task success remains a separate review judgment.",
      next_action: action,
      verification: {
        passed: result.check_counts.passed,
        failed: result.check_counts.failed,
        skipped: result.check_counts.skipped,
      },
      exact_detail_href: result.inspector_href,
      pinning: pinningInputV01(source, {
        kind: "managed_run",
        run_ref: result.run_ref,
      }),
    }),
    focus: "result_ready",
    heading: "A result is ready",
    situation: textV01(result.summary),
    material_note: unresolved
      ? `${result.blocker_count} ${pluralV01(result.blocker_count, "blocker", "blockers")} and ${result.gap_count} ${pluralV01(result.gap_count, "open question", "open questions")} remain.`
      : "Execution completion is recorded separately from verified task success.",
    guide_action: action,
    action_reason:
      "A trusted saved result is ready for the existing review step.",
    user_judgment: unresolved
      ? {
          question:
            "How should the remaining blocker or open question be handled?",
          why: "The result cannot settle that judgment on the user's behalf.",
          blocked: ["Accepting a consequential project change"],
        }
      : null,
    sort_class: 10,
    source_priority: 10,
    timestamp: result.recorded_at,
  });
}

function projectAttentionCandidateV01(
  source: BlankStateSourceV01,
  attention: ProjectHomePendingAttentionItemV01,
): ContinuityCandidateV01 {
  const href = attention.workbench_entry?.href ?? attention.action_href;
  const state = attention.workbench_entry?.entry_state ?? null;
  const isReconciliation = attention.attention_id.startsWith(
    "run-reconciliation:",
  ) || attention.attention_id === "automation:reconciliation_required";
  const isResult = attention.attention_id.startsWith("result:");
  const isSettled = state === "transition_applied";
  const automationState = attention.attention_id.startsWith("automation:")
    ? attention.attention_id.slice("automation:".length)
    : null;
  const automationRequiresIntervention =
    automationState === "reconciliation_required" ||
    automationState === "proposal_settlement_failed";
  const signals = attention.signals ?? [];
  const createdAt =
    attention.created_at ?? "1970-01-01T00:00:00.000Z";
  const requiresAttention = Boolean(href) &&
    !isSettled &&
    (automationState === null || automationRequiresIntervention);
  const category: BlankStateAttentionCategoryV01 | null =
    !requiresAttention
      ? null
      : isReconciliation
        ? "reconciliation"
        : isResult
          ? "result_review"
          : "pending_review";
  const blocking =
    isReconciliation ||
    state === "transition_blocked" ||
    signals.includes("conflict") ||
    signals.includes("blocked");
  const action = requiresAttention && href
    ? linkActionV01(
        attention.workbench_entry
          ? ordinaryActionLabelV02(
              attention.workbench_entry.entry_state,
              attention.action_label,
            )
          : textV01(attention.action_label),
        href,
        attention.workbench_entry?.entry_state ?? null,
      )
    : null;
  const guideAction = action ??
    linkActionV01("Review current work", href ?? WORKPLANE_HREF, state);
  return candidateV01({
    item: itemV01({
      family: "project_attention",
      stable_basis: attention.attention_id,
      work_name: textV01(attention.summary),
      meaningful_state: requiresAttention
        ? blocking
          ? "Blocked pending consequential review"
          : "Waiting for consequential review"
        : "Recorded for context; no intervention required",
      requires_attention: requiresAttention,
      attention_category: category,
      last_change: {
        summary: textV01(attention.summary),
        occurred_at: createdAt,
      },
      consequential_detail: textV01(attention.reason),
      next_action: action,
      secondary_action: !action && href
        ? { label: guideAction.label, href }
        : null,
      pinning: pinningInputV01(
        source,
        projectAttentionPinOwnerV01(attention),
        "This attention projection has no stable source owner and cannot be pinned without risking a false retarget.",
      ),
    }),
    focus: requiresAttention
      ? isReconciliation
        ? "work_requires_attention"
        : isResult
          ? "result_ready"
          : "attention_required"
      : "ready_to_continue",
    heading: requiresAttention
      ? isReconciliation
        ? "Current work needs to be checked"
        : isResult
          ? "A result is ready"
          : "Your attention is needed"
      : "Review the latest project context",
    situation: textV01(attention.summary),
    material_note: textV01(attention.reason),
    guide_action: guideAction,
    action_reason: requiresAttention
      ? blocking
        ? "This bounded intervention blocks safe continuation and outranks later review."
        : "This is the highest-priority consequential review currently awaiting the user."
      : "This source state remains visible without creating a false attention requirement.",
    user_judgment: requiresAttention && !isReconciliation
      ? {
          question: textV01(attention.summary),
          why: textV01(attention.reason),
          blocked: ["The next reviewed project step"],
        }
      : null,
    sort_class: requiresAttention ? (blocking ? 0 : 10) : 35,
    source_priority: Number.isFinite(attention.priority)
      ? attention.priority
      : 100,
    timestamp: createdAt,
  });
}

function recentChangeCandidateV01(
  source: BlankStateSourceV01,
  change: NonNullable<
    BlankStateSourceV01["projection"]
  >["recent_activity"]["items"][number],
): ContinuityCandidateV01 {
  const href = change.workbench_entry?.href ?? null;
  const action = href
    ? linkActionV01(
        ordinaryActionLabelV02(
          change.workbench_entry!.entry_state,
          change.workbench_entry?.action_label,
        ),
        href,
        change.workbench_entry?.entry_state ?? null,
      )
    : linkActionV01("Continue in AI Workplane", WORKPLANE_HREF, null);
  return candidateV01({
    item: itemV01({
      family: "recent_change",
      stable_basis: `${change.occurred_at}:${change.summary}`,
      work_name: textV01(
        source.projection?.coordination.task_frame.goal ??
          "Recent project change",
      ),
      meaningful_state: "Meaningfully changed since the last review",
      last_change: {
        summary: textV01(change.summary),
        occurred_at: change.occurred_at,
      },
      consequential_detail:
        "This change is visible for continuity and does not create an approval requirement.",
      secondary_action: href ? { label: action.label, href } : null,
      pinning: pinningInputV01(
        source,
        recentChangePinOwnerV01(change),
        "This recent-change projection has no stable lineage owner and cannot be pinned safely.",
      ),
    }),
    focus: "ready_to_continue",
    heading: "Ready to continue",
    situation: textV01(change.summary),
    material_note: null,
    guide_action: action,
    action_reason:
      "The recent change remains visible without being promoted to human attention.",
    sort_class: 40,
    source_priority: 0,
    timestamp: change.occurred_at,
  });
}

function continuationCandidateV01(
  source: BlankStateSourceV01,
): ContinuityCandidateV01 {
  const projection = source.projection!;
  const goal = textV01(
    projection.coordination.task_frame.goal ??
      `${displayProjectNameV01(projection.project_summary.project.display_name)} is ready for the next piece of work`,
  );
  const action = linkActionV01(
    "Continue in AI Workplane",
    WORKPLANE_HREF,
    null,
  );
  return candidateV01({
    item: itemV01({
      family: "continuation",
      stable_basis: `continue:${projection.project_id}:${goal}`,
      work_name: goal,
      meaningful_state: "Ready to continue",
      consequential_detail:
        "No consequential intervention is currently blocking the next work.",
      next_action: action,
    }),
    focus: "ready_to_continue",
    heading: projection.coordination.task_frame.goal
      ? "Ready to continue"
      : "What would you like to do next?",
    situation: projection.coordination.task_frame.goal
      ? `Current work: ${goal}`
      : `${displayProjectNameV01(projection.project_summary.project.display_name)} is ready for your next piece of work.`,
    material_note: null,
    guide_action: action,
    action_reason:
      "The project is available and no more urgent state currently takes priority.",
    sort_class: 30,
    source_priority: 0,
    timestamp: null,
  });
}

function singleItemCompositionV01(input: {
  source: BlankStateSourceV01;
  item: BlankStateContinuityItemV01;
  focus: BlankStateFocusV01;
  heading: string;
  situation: string;
  material_note: string | null;
  continuity_summary: string;
  guide_action: BlankStatePrimaryActionV01;
  action_reason: string;
  project_management_emphasized: boolean;
  user_judgment?: ContinuityUserJudgmentV01 | null;
}): BlankStateContinuityCompositionV01 {
  const sourceAttentionBoundary = sourceAttentionBoundaryV01(input.source);
  const boundedSourceNote =
    sourceAttentionBoundary.status === "lower_bound"
      ? " Additional project attention exists outside this view."
      : sourceAttentionBoundary.status === "source_incomplete"
        ? " The complete project attention count is unavailable."
        : "";
  return {
    focus: input.focus,
    heading: input.heading,
    situation: input.situation,
    material_note: input.material_note,
    continuity_summary: `${input.continuity_summary}${boundedSourceNote}`,
    known_attention_count: input.item.requires_human_attention ? 1 : 0,
    attention_count_status: sourceAttentionBoundary.status,
    known_continuity_item_count: 1,
    locally_omitted_item_count: 0,
    source_omitted_attention_count:
      sourceAttentionBoundary.omittedAttentionCount,
    source_attention_destination:
      sourceAttentionBoundary.status === "complete"
        ? null
        : {
            label: "Review project attention",
            href: WORKPLANE_HREF,
          },
    highlighted_item: input.item,
    continuity_items: [],
    primary_action: input.item.next_action,
    guide_action: input.guide_action,
    action_reason: input.action_reason,
    project_management_emphasized: input.project_management_emphasized,
    user_judgment: input.user_judgment ?? null,
  };
}

function sourceAttentionBoundaryV01(source: BlankStateSourceV01): {
  status: BlankStateAttentionCountStatusV01;
  omittedAttentionCount: number | null;
} {
  const attention = source.projection?.attention;
  if (!attention) {
    return {
      status: "complete",
      omittedAttentionCount: 0,
    };
  }
  const totalCount = attention.total_count;
  const returnedCount = attention.items.length;
  if (
    !Number.isSafeInteger(totalCount) ||
    totalCount < 0 ||
    totalCount < returnedCount
  ) {
    return {
      status: "source_incomplete",
      omittedAttentionCount: null,
    };
  }
  const omittedAttentionCount = totalCount - returnedCount;
  if (!attention.state || attention.state.status === "error") {
    return {
      status: "source_incomplete",
      omittedAttentionCount,
    };
  }
  return {
    status: omittedAttentionCount > 0 ? "lower_bound" : "complete",
    omittedAttentionCount,
  };
}

function continuitySummaryV01(input: {
  knownAttentionCount: number;
  workContinuing: boolean;
  sourceStatus: BlankStateAttentionCountStatusV01;
}): string {
  const continuing = input.workContinuing ? "Work is continuing, and " : "";
  if (input.sourceStatus === "lower_bound") {
    return input.knownAttentionCount > 0
      ? `${continuing}at least ${input.knownAttentionCount} known ${pluralV01(input.knownAttentionCount, "item genuinely needs", "items genuinely need")} you. Additional project attention exists outside this view.`
      : `${input.workContinuing ? "Work is continuing. " : ""}Additional project attention needs review outside this view.`;
  }
  if (input.sourceStatus === "source_incomplete") {
    return input.knownAttentionCount > 0
      ? `${continuing}${input.knownAttentionCount} known ${pluralV01(input.knownAttentionCount, "item genuinely needs", "items genuinely need")} you. The complete project attention count is unavailable.`
      : `${input.workContinuing ? "Work is continuing. " : ""}The complete project attention count is unavailable.`;
  }
  if (input.knownAttentionCount > 0) {
    return `${continuing}${input.knownAttentionCount} ${pluralV01(input.knownAttentionCount, "item genuinely needs", "items genuinely need")} you.`;
  }
  return input.workContinuing
    ? "Work is continuing. Nothing currently requires your intervention."
    : "Nothing currently requires your intervention. Continue from the current project when you are ready.";
}

function itemV01(input: {
  family: BlankStateContinuityItemV01["source_family"];
  stable_basis: string;
  work_name: string;
  meaningful_state: string;
  requires_attention?: boolean;
  attention_category?: BlankStateAttentionCategoryV01 | null;
  last_change?: BlankStateContinuityItemV01["last_meaningful_change"];
  consequential_detail: string | null;
  next_action?: BlankStatePrimaryActionV01 | null;
  secondary_action?: BlankStateContinuityItemV01["secondary_action"];
  verification?: BlankStateContinuityItemV01["verification"];
  exact_detail_href?: string | null;
  pinning?: {
    workspace_id: string | null;
    project_id: string | null;
    owner: ContinuityPinSupportedOwnerV01 | null;
    unsupported_reason?: string;
  };
}): BlankStateContinuityItemV01 {
  const itemId = stableItemIdV01(input.family, input.stable_basis);
  return {
    item_id: itemId,
    source_family: input.family,
    work_name: textV01(input.work_name),
    meaningful_state: textV01(input.meaningful_state),
    requires_human_attention: input.requires_attention ?? false,
    attention_category: input.attention_category ?? null,
    last_meaningful_change: input.last_change ?? null,
    consequential_detail: input.consequential_detail
      ? textV01(input.consequential_detail)
      : null,
    next_action: input.next_action ?? null,
    secondary_action: input.secondary_action ?? null,
    verification: input.verification ?? null,
    exact_detail_href: input.exact_detail_href ?? null,
    pinning: buildContinuityPinEligibilityV01({
      workspace_id: input.pinning?.workspace_id ?? null,
      project_id: input.pinning?.project_id ?? null,
      owner: input.pinning?.owner ?? null,
      source_item_id: itemId,
      unsupported_reason:
        input.pinning?.unsupported_reason ??
        "This is a transient project projection rather than a durable continuity owner.",
    }),
    projection_only: true,
    semantic_authority_granted: false,
  };
}

function pinningInputV01(
  source: BlankStateSourceV01,
  owner: ContinuityPinSupportedOwnerV01 | null,
  unsupportedReason?: string,
): {
  workspace_id: string | null;
  project_id: string | null;
  owner: ContinuityPinSupportedOwnerV01 | null;
  unsupported_reason?: string;
} {
  const projection = source.projection;
  if (!projection?.project_summary.is_active) {
    return {
      workspace_id: null,
      project_id: null,
      owner: null,
      unsupported_reason:
        "Only continuities from the current project can be pinned.",
    };
  }
  return {
    workspace_id: projection.workspace_id,
    project_id: projection.project_id,
    owner,
    unsupported_reason: unsupportedReason,
  };
}

function delegatedPinOwnerV01(
  source: BlankStateSourceV01,
): ContinuityPinSupportedOwnerV01 | null {
  const delegated = source.delegated_work;
  if (!delegated) return null;
  if (delegated.run_ref) {
    return { kind: "managed_run", run_ref: delegated.run_ref };
  }
  if (delegated.result?.receipt_ref) {
    return {
      kind: "core_record",
      record_kind: "run_receipt",
      record_id: delegated.result.receipt_ref,
    };
  }
  return null;
}

function projectAttentionPinOwnerV01(
  attention: ProjectHomePendingAttentionItemV01,
): ContinuityPinSupportedOwnerV01 | null {
  const workbenchSource = attention.workbench_entry?.source;
  if (
    workbenchSource?.record_id &&
    ["episode_delta_proposal", "run_receipt"].includes(
      workbenchSource.record_kind,
    )
  ) {
    return {
      kind: "core_record",
      record_kind: workbenchSource.record_kind,
      record_id: workbenchSource.record_id,
    };
  }
  if (attention.proposal_id) {
    return {
      kind: "core_record",
      record_kind: "episode_delta_proposal",
      record_id: attention.proposal_id,
    };
  }
  if (attention.attention_id.startsWith("result:")) {
    const recordId = attention.attention_id.slice("result:".length);
    return recordId
      ? {
          kind: "core_record",
          record_kind: "run_receipt",
          record_id: recordId,
        }
      : null;
  }
  if (attention.attention_id.startsWith("run-reconciliation:")) {
    const runRef = attention.attention_id.slice(
      "run-reconciliation:".length,
    );
    return runRef ? { kind: "managed_run", run_ref: runRef } : null;
  }
  return pinOwnerFromLineageV01(attention.lineage ?? []);
}

function recentChangePinOwnerV01(
  change: ProjectHomeActivityItemV01,
): ContinuityPinSupportedOwnerV01 | null {
  const desiredKind =
    change.activity_kind === "accepted_transition"
      ? "state_transition_receipt"
      : change.activity_kind === "review_decision"
        ? "review_decision"
        : "run_receipt";
  const lineage = change.lineage ?? [];
  const exact = lineage.find(
    (anchor) => anchor.record_kind === desiredKind,
  );
  return exact
    ? {
        kind: "core_record",
        record_kind: desiredKind,
        record_id: exact.record_id,
      }
    : pinOwnerFromLineageV01(lineage);
}

function pinOwnerFromLineageV01(
  lineage: ProjectHomePendingAttentionItemV01["lineage"],
): ContinuityPinSupportedOwnerV01 | null {
  for (const recordKind of [
    "state_transition_receipt",
    "review_decision",
    "run_receipt",
    "episode_delta_proposal",
  ] as const) {
    const anchor = lineage.find(
      (candidate) => candidate.record_kind === recordKind,
    );
    if (anchor) {
      return {
        kind: "core_record",
        record_kind: recordKind,
        record_id: anchor.record_id,
      };
    }
  }
  return null;
}

function candidateV01(input: {
  item: BlankStateContinuityItemV01;
  focus: BlankStateFocusV01;
  heading: string;
  situation: string;
  material_note: string | null;
  guide_action: BlankStatePrimaryActionV01;
  action_reason: string;
  user_judgment?: ContinuityUserJudgmentV01 | null;
  sort_class: number;
  source_priority: number;
  timestamp: string | null;
}): ContinuityCandidateV01 {
  return {
    item: input.item,
    focus: input.focus,
    heading: input.heading,
    situation: input.situation,
    material_note: input.material_note,
    guide_action: input.guide_action,
    action_reason: input.action_reason,
    user_judgment: input.user_judgment ?? null,
    sort_class: input.sort_class,
    source_priority: input.source_priority,
    currentness: timestampValueV01(input.timestamp),
    stable_tie_breaker: input.item.item_id,
  };
}

function compareCandidatesV01(
  left: ContinuityCandidateV01,
  right: ContinuityCandidateV01,
): number {
  return (
    left.sort_class - right.sort_class ||
    left.source_priority - right.source_priority ||
    right.currentness - left.currentness ||
    left.stable_tie_breaker.localeCompare(right.stable_tie_breaker)
  );
}

function deduplicateCandidatesV01(
  candidates: ContinuityCandidateV01[],
): ContinuityCandidateV01[] {
  const result: ContinuityCandidateV01[] = [];
  const byKey = new Map<string, number>();
  for (const candidate of candidates) {
    const key = deduplicationKeyV01(candidate.item);
    const existingIndex = byKey.get(key);
    if (existingIndex === undefined) {
      byKey.set(key, result.length);
      result.push(candidate);
      continue;
    }
    const existing = result[existingIndex]!;
    const savedResultChange =
      existing.item.source_family === "saved_result"
        ? existing.item.last_meaningful_change
        : candidate.item.source_family === "saved_result"
          ? candidate.item.last_meaningful_change
          : null;
    result[existingIndex] = {
      ...existing,
      item: {
        ...existing.item,
        verification:
          existing.item.verification ?? candidate.item.verification,
        exact_detail_href:
          existing.item.exact_detail_href ?? candidate.item.exact_detail_href,
        last_meaningful_change:
          savedResultChange ??
          newerChangeV01(
            existing.item.last_meaningful_change,
            candidate.item.last_meaningful_change,
          ),
      },
    };
  }
  return result;
}

function deduplicationKeyV01(item: BlankStateContinuityItemV01): string {
  const destination =
    actionHrefV01(item.next_action) ??
    item.secondary_action?.href ??
    item.exact_detail_href;
  if (destination) return `destination:${destination}`;
  return `meaning:${item.attention_category ?? "ordinary"}:${normalizeV01(item.work_name)}:${normalizeV01(item.meaningful_state)}`;
}

function newerChangeV01(
  left: BlankStateContinuityItemV01["last_meaningful_change"],
  right: BlankStateContinuityItemV01["last_meaningful_change"],
): BlankStateContinuityItemV01["last_meaningful_change"] {
  if (!left) return right;
  if (!right) return left;
  return timestampValueV01(right.occurred_at) > timestampValueV01(left.occurred_at)
    ? right
    : left;
}

function linkActionV01(
  label: string,
  href: string,
  entryState: string | null,
): Extract<BlankStatePrimaryActionV01, { kind: "link" }> {
  return {
    kind: "link",
    label: textV01(label),
    href,
    entry_state: entryState,
  };
}

function actionHrefV01(
  action: BlankStatePrimaryActionV01 | null,
): string | null {
  if (!action) return null;
  if (action.kind === "link") return action.href;
  if (action.kind === "choose_folder") return "/projects#choose-project";
  return `/projects/${encodeURIComponent(action.project_id)}`;
}

function textV01(value: string): string {
  const safe = publicGuideBriefTextV02(value)
    .replace(/[\u0000-\u001f\u007f]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return safe.length <= 1_024 ? safe : `${safe.slice(0, 1_023)}…`;
}

function displayProjectNameV01(value: string | null): string {
  return textV01(value?.trim() || "Unnamed project");
}

function timestampValueV01(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableItemIdV01(family: string, basis: string): string {
  return `continuity:${family}:${createHash("sha256")
    .update(basis)
    .digest("hex")
    .slice(0, 20)}`;
}

function normalizeV01(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/gu, " ").trim();
}

function pluralV01(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}
