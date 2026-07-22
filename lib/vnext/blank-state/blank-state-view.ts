import type { SemanticWorkbenchEntryV01 } from "@/types/vnext/semantic-workbench";
import {
  BLANK_STATE_VIEW_VERSION_V01,
  type BlankStatePrimaryActionV01,
  type BlankStateSourceV01,
  type BlankStateViewV01,
} from "@/types/vnext/blank-state";

const WORKPLANE_HREF = "/workbench/semantic-review";

export function buildBlankStateViewV01(
  source: BlankStateSourceV01,
): BlankStateViewV01 {
  const projection = source.projection;
  const managementEmphasized = source.route_mode === "project_management";

  if (!projection) {
    const recent = source.recent_projects;
    if (recent.length === 0) {
      return view(source, {
        focus: "no_projects",
        heading: "What are you trying to do?",
        situation: "Choose a local project so Augnes can help you start or continue work.",
        material_note: null,
        primary_action: { kind: "choose_folder", label: "Choose a local project" },
        project_management_emphasized: true,
      });
    }

    const activeEntry = source.active_project_id
      ? recent.find((entry) => entry.project.project_id === source.active_project_id)
      : null;
    const firstAvailable = recent.find((entry) => entry.root_availability === "available");
    const first = activeEntry ?? firstAvailable ?? recent[0]!;
    return view(source, {
      focus: "project_choice",
      heading: source.active_project_id
        ? "Reconnect your current project"
        : "Choose where to continue",
      situation: source.active_project_id
        ? "Your current project record is safe, but its saved project view could not be opened. Choose or reconnect a project below."
        : "Continue an existing project or choose another local folder.",
      material_note: source.active_project_id
        ? "No project was switched and no stored project data was changed."
        : null,
      primary_action: first.root_availability === "available"
        ? {
            kind: "open_recent",
            label: `Continue with ${projectName(first.project.display_name)}`,
            project_id: first.project.project_id,
          }
        : {
            kind: "locate_folder",
            label: `Locate ${projectName(first.project.display_name)}`,
            project_id: first.project.project_id,
          },
      project_management_emphasized: true,
    });
  }

  const summary = projection.project_summary;
  const name = projectName(summary.project.display_name);
  const common = {
    project_name: name,
    project_context_label: summary.is_active
      ? "Current project" as const
      : "Viewed project" as const,
  };

  if (summary.root_availability !== "available") {
    return view(source, {
      ...common,
      focus: "project_root_unavailable",
      heading: `Reconnect ${name}`,
      situation: "The project record is safe, but Augnes cannot reach its local folder.",
      material_note: "Locate the folder to reconnect it. Nothing will be changed until you confirm the folder.",
      primary_action: {
        kind: "locate_folder",
        label: "Locate folder",
        project_id: projection.project_id,
      },
      project_management_emphasized: true,
    });
  }

  if (!summary.is_active) {
    return view(source, {
      ...common,
      focus: "viewed_project_inactive",
      heading: `You are viewing ${name}`,
      situation: "Opening this link did not switch your current project.",
      material_note: "Make this project active before changing controls or starting work.",
      primary_action: {
        kind: "make_active",
        label: "Make active",
        project_id: projection.project_id,
      },
      project_management_emphasized: managementEmphasized,
    });
  }

  const currentRun = projection.run_results.current_run;
  if (currentRun?.reconciliation_required) {
    return view(source, {
      ...common,
      focus: "work_requires_attention",
      heading: "Current work needs to be checked",
      situation: "Augnes lost a complete observation of the running work and will not infer a result.",
      material_note: "Review the current work before continuing or accepting any project change.",
      primary_action: workplaneAction("Review current work"),
      project_management_emphasized: managementEmphasized,
    });
  }

  if (currentRun) {
    return view(source, {
      ...common,
      focus: "work_in_progress",
      heading: "Work is in progress",
      situation: taskSituation(projection.coordination.task_frame.goal),
      material_note: "A running host process is not treated as a successful result until its saved result is available.",
      primary_action: workplaneAction("View current work"),
      project_management_emphasized: managementEmphasized,
    });
  }

  const result = projection.run_results.latest_result;
  const resultEntry = projection.run_results.workbench_entry;
  if (result && resultEntry) {
    return view(source, {
      ...common,
      focus: "result_ready",
      heading: "A result is ready",
      situation: publicBlankStateTextV01(result.summary),
      material_note: result.blocker_count > 0 || result.gap_count > 0
        ? `${result.blocker_count} ${plural(result.blocker_count, "blocker", "blockers")} and ${result.gap_count} ${plural(result.gap_count, "open question", "open questions")} remain.`
        : "Verification found no remaining blocker or open question in this result.",
      primary_action: entryAction(resultEntry),
      project_management_emphasized: managementEmphasized,
    });
  }

  const attention = projection.attention.items[0];
  if (attention) {
    return view(source, {
      ...common,
      focus: "attention_required",
      heading: "Your attention is needed",
      situation: publicBlankStateTextV01(attention.summary),
      material_note: publicBlankStateTextV01(attention.reason),
      primary_action: attention.workbench_entry
        ? entryAction(attention.workbench_entry)
        : attention.action_href
          ? {
              kind: "link",
              label: publicBlankStateTextV01(attention.action_label),
              href: attention.action_href,
              entry_state: null,
            }
          : workplaneAction("Review current work"),
      project_management_emphasized: managementEmphasized,
    });
  }

  return view(source, {
    ...common,
    focus: "ready_to_continue",
    heading: projection.coordination.task_frame.goal
      ? "Ready to continue"
      : "What would you like to do next?",
    situation: projection.coordination.task_frame.goal
      ? `Current work: ${publicBlankStateTextV01(projection.coordination.task_frame.goal)}`
      : `${name} is ready for your next piece of work.`,
    material_note: null,
    primary_action: workplaneAction("Continue in AI Workplane"),
    project_management_emphasized: managementEmphasized,
  });
}

export function ordinaryActionLabel(entryState: string, fallback?: string): string {
  const known: Record<string, string> = {
    project_review: "Open current work",
    result_only: "Review result",
    assessment: "Review result",
    pending_proposal: "Review suggested change",
    decided_proposal: "Review next step",
    transition_blocked: "Resolve next step",
    transition_applied: "See what changed",
    feedback_needed: "Share outcome",
  };
  return known[entryState] ?? publicBlankStateTextV01(fallback ?? "Continue");
}

export function publicBlankStateTextV01(value: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/TaskContextPacket/giu, "work instructions"],
    [/RunReceipt/giu, "result"],
    [/CriterionAssessment/giu, "verification"],
    [/EpisodeDeltaProposal/giu, "suggested change"],
    [/ReviewDecision/giu, "decision"],
    [/StateTransitionReceipt/giu, "change record"],
    [/Decision debt/giu, "pending decisions"],
    [/Accepted state/giu, "saved project state"],
    [/Working projection/giu, "working context"],
    [/Exact coordination/giu, "exact details"],
    [/Inspector lineage/giu, "source history"],
    [/packet fingerprint/giu, "source check"],
    [/\bTransition\b/gu, "project change"],
    [/\blineage\b/giu, "source history"],
    [/\bsemantic gate\b/giu, "review boundary"],
    [/\bcurrent-head\b/giu, "current version"],
    [/\bfingerprint\b/giu, "source check"],
  ];
  return replacements.reduce((text, [pattern, replacement]) =>
    text.replace(pattern, replacement), value);
}

function view(
  source: BlankStateSourceV01,
  values: Omit<
    BlankStateViewV01,
    | "blank_state_view_version"
    | "route_mode"
    | "current_work"
    | "additional_attention"
    | "recent_change"
    | "project_name"
    | "project_context_label"
    | "projection_only"
    | "semantic_authority_granted"
  > & Partial<Pick<BlankStateViewV01, "project_name" | "project_context_label">>,
): BlankStateViewV01 {
  const projection = source.projection;
  const currentRun = projection?.run_results.current_run ?? null;
  const result = projection?.run_results.latest_result ?? null;
  const primaryAttentionId = values.focus === "attention_required"
    ? projection?.attention.items[0]?.attention_id
    : null;
  return {
    blank_state_view_version: BLANK_STATE_VIEW_VERSION_V01,
    route_mode: source.route_mode,
    ...values,
    project_name: values.project_name ?? null,
    project_context_label: values.project_context_label ?? null,
    current_work: projection && (currentRun || result)
      ? {
          status: currentRun
            ? currentRun.reconciliation_required
              ? "Needs observation"
              : "In progress"
            : "Result saved",
          goal: projection.coordination.task_frame.goal
            ? publicBlankStateTextV01(projection.coordination.task_frame.goal)
            : null,
          result_summary: result
            ? publicBlankStateTextV01(result.summary)
            : null,
          verification: result
            ? {
                passed: result.check_counts.passed,
                failed: result.check_counts.failed,
                skipped: result.check_counts.skipped,
              }
            : null,
          exact_detail_href: result?.inspector_href ?? null,
        }
      : null,
    additional_attention: (projection?.attention.items ?? [])
      .filter((item) => item.attention_id !== primaryAttentionId)
      .slice(0, 2)
      .map((item) => ({
        id: item.attention_id,
        summary: publicBlankStateTextV01(item.summary),
        reason: publicBlankStateTextV01(item.reason),
        href: item.workbench_entry?.href ?? item.action_href,
        label: item.workbench_entry
          ? ordinaryActionLabel(item.workbench_entry.entry_state)
          : publicBlankStateTextV01(item.action_label),
      })),
    recent_change: projection?.recent_activity.items[0]
      ? {
          summary: publicBlankStateTextV01(projection.recent_activity.items[0].summary),
          occurred_at: projection.recent_activity.items[0].occurred_at,
        }
      : null,
    projection_only: true,
    semantic_authority_granted: false,
  };
}

function entryAction(entry: SemanticWorkbenchEntryV01): BlankStatePrimaryActionV01 {
  return {
    kind: "link",
    label: ordinaryActionLabel(entry.entry_state, entry.action_label),
    href: entry.href,
    entry_state: entry.entry_state,
  };
}

function workplaneAction(label: string): BlankStatePrimaryActionV01 {
  return { kind: "link", label, href: WORKPLANE_HREF, entry_state: null };
}

function projectName(value: string | null): string {
  return value?.trim() || "Unnamed project";
}

function taskSituation(goal: string | null): string {
  return goal
    ? `Augnes is working on: ${publicBlankStateTextV01(goal)}`
    : "Augnes is observing the current work and waiting for a saved result.";
}

function plural(count: number, singular: string, pluralValue: string): string {
  return count === 1 ? singular : pluralValue;
}
