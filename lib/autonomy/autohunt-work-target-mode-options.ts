import type { HumanSurfaceCurrentPerspectiveRead } from "@/lib/human-surface/read-current-perspective";
import {
  fingerprint,
  stripFingerprintPrefix,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type { AutohuntDailyLauncherRunReadback } from "@/types/autohunt-daily-launcher-run";
import type { AutohuntResultIntakeReadback } from "@/types/autohunt-result-intake";
import {
  AUTOHUNT_WORK_TARGET_MODES,
  type AutohuntWorkTargetMode,
  type AutohuntWorkTargetModeBranchSuggestion,
  type AutohuntWorkTargetModeOption,
  type AutohuntWorkTargetModeSummary,
  type AutohuntWorkTargetModeSummaryOption,
} from "@/types/autohunt-work-target-mode";

export const AUTOHUNT_WORK_TARGET_MODE_OPTIONS: AutohuntWorkTargetModeOption[] =
  [
    {
      mode: "extend_current_perspective_work",
      title: "Extend current Perspective work",
      short_label: "Extend current work",
      summary:
        "Interpret Daily Autohunt as an extension of the current Perspective work. Results remain preview lifecycle material until separately approved.",
      lifecycle_interpretation:
        "Attach Autohunt results to the current Perspective work as preview episode/event/delta semantics.",
      result_attachment_policy:
        "Attach the result as preview lifecycle material for the current Perspective work timeline; do not create durable work here.",
      branch_policy:
        "If the result suggests a new direction, show a branch suggestion only. Do not promote automatically.",
      default_selected: true,
      requires_explicit_user_choice: false,
      durable_creation_allowed_now: false,
      perspective_mutation_allowed_now: false,
      cwp_mutation_allowed_now: false,
      memory_write_allowed_now: false,
      codex_execution_allowed_now: false,
      github_or_pr_allowed_now: false,
    },
    {
      mode: "create_new_perspective_work_from_autohunt_conditions",
      title: "Create new Perspective work candidate",
      short_label: "New work candidate",
      summary:
        "Interpret Autohunt conditions as the starting point for a new Perspective work candidate. This screen does not create durable work.",
      lifecycle_interpretation:
        "Treat Autohunt conditions and results as initial lifecycle material for a candidate Perspective work timeline.",
      result_attachment_policy:
        "Treat the Autohunt result as initial lifecycle material for a candidate timeline; durable creation requires separate approval.",
      branch_policy:
        "Show a candidate only. Durable creation or promotion requires separate approval.",
      default_selected: false,
      requires_explicit_user_choice: true,
      durable_creation_allowed_now: false,
      perspective_mutation_allowed_now: false,
      cwp_mutation_allowed_now: false,
      memory_write_allowed_now: false,
      codex_execution_allowed_now: false,
      github_or_pr_allowed_now: false,
    },
  ];

export interface BuildAutohuntWorkTargetModeOptionsInput {
  currentPerspectiveRead: HumanSurfaceCurrentPerspectiveRead;
  latestDailyLauncherRunReadback?: AutohuntDailyLauncherRunReadback | null;
  latestResultIntakeReadback?: AutohuntResultIntakeReadback | null;
  selectedMode?: AutohuntWorkTargetMode | string | null;
  as_of?: string;
}

export function buildAutohuntWorkTargetModeOptions({
  currentPerspectiveRead,
  latestDailyLauncherRunReadback = null,
  latestResultIntakeReadback = null,
  selectedMode = null,
  as_of,
}: BuildAutohuntWorkTargetModeOptionsInput): AutohuntWorkTargetModeSummary {
  const asOf = as_of ?? new Date().toISOString();
  const activeWorkIds =
    currentPerspectiveRead.data.current_frame.active_work_ids ?? [];
  const activeGoals = currentPerspectiveRead.data.active_goals ?? [];
  const hasActivePerspectiveWork =
    activeWorkIds.length > 0 || activeGoals.length > 0;
  const recommendedMode: AutohuntWorkTargetMode = hasActivePerspectiveWork
    ? "extend_current_perspective_work"
    : "create_new_perspective_work_from_autohunt_conditions";
  const selected = normalizeAutohuntWorkTargetMode(selectedMode);

  const options = AUTOHUNT_WORK_TARGET_MODE_OPTIONS.map(
    (option): AutohuntWorkTargetModeSummaryOption => ({
      ...option,
      selected: option.mode === selected,
      recommended: option.mode === recommendedMode,
      available: true,
      recommendation_reason:
        option.mode === "extend_current_perspective_work"
          ? hasActivePerspectiveWork
            ? "Current Perspective has active work ids or active goals."
            : "Default remains current-work extension even when no active work is materialized."
          : hasActivePerspectiveWork
            ? "Available for explicit operator choice when the Autohunt condition should seed a separate candidate."
            : "No active work is materialized, so this mode is the recommended interpretation but still requires explicit choice.",
    }),
  );
  const latestLauncherRunSummary = summarizeLauncherRun(
    latestDailyLauncherRunReadback,
  );
  const latestResultIntakeSummary = summarizeResultIntake(
    latestResultIntakeReadback,
  );
  const branchSuggestion = buildBranchSuggestion(latestResultIntakeReadback);
  const summaryWithoutFingerprint = {
    summary_kind: "autohunt_work_target_mode_options" as const,
    summary_version: "autohunt_work_target_mode_options.v0.1" as const,
    as_of: asOf,
    selected_mode: selected,
    recommended_mode: recommendedMode,
    options,
    latest_launcher_run_summary: latestLauncherRunSummary,
    latest_result_intake_summary: latestResultIntakeSummary,
    branch_suggestion: branchSuggestion,
    authority_boundary_all_false: true as const,
    raw_material_persisted: false as const,
  };

  return {
    ...summaryWithoutFingerprint,
    summary_fingerprint: fingerprint(summaryWithoutFingerprint),
  };
}

export function normalizeAutohuntWorkTargetMode(
  mode: AutohuntWorkTargetMode | string | null | undefined,
): AutohuntWorkTargetMode {
  return AUTOHUNT_WORK_TARGET_MODES.includes(mode as AutohuntWorkTargetMode)
    ? (mode as AutohuntWorkTargetMode)
    : "extend_current_perspective_work";
}

export function isAutohuntWorkTargetMode(
  mode: string | null | undefined,
): mode is AutohuntWorkTargetMode {
  return AUTOHUNT_WORK_TARGET_MODES.includes(mode as AutohuntWorkTargetMode);
}

export function getAutohuntWorkTargetModeOption(
  mode: AutohuntWorkTargetMode | string | null | undefined,
): AutohuntWorkTargetModeOption {
  const normalizedMode = normalizeAutohuntWorkTargetMode(mode);
  return (
    AUTOHUNT_WORK_TARGET_MODE_OPTIONS.find(
      (option) => option.mode === normalizedMode,
    ) ?? AUTOHUNT_WORK_TARGET_MODE_OPTIONS[0]
  );
}

function summarizeLauncherRun(
  readback: AutohuntDailyLauncherRunReadback | null,
): AutohuntWorkTargetModeSummary["latest_launcher_run_summary"] {
  const run = readback?.selected_launcher_run ?? readback?.latest_launcher_run;
  if (!run) return null;
  const option = getAutohuntWorkTargetModeOption(
    run.handoff_packet.work_target_mode,
  );
  return {
    launcher_run_id: run.launcher_run_id,
    launcher_run_status: run.launcher_run_status,
    handoff_packet_id: run.handoff_packet.handoff_packet_id,
    linked_result_intake_id:
      run.linked_result_intake?.result_intake_id ?? null,
    work_target_mode: option.mode,
    work_target_mode_label: option.short_label,
  };
}

function summarizeResultIntake(
  readback: AutohuntResultIntakeReadback | null,
): AutohuntWorkTargetModeSummary["latest_result_intake_summary"] {
  const intake =
    readback?.selected_result_intake ?? readback?.latest_recorded_result_intake;
  if (!intake) return null;
  return {
    result_intake_id: intake.result_intake_id,
    result_intake_status: intake.result_intake_status,
    expected_observed_delta_status:
      intake.expected_observed_delta_candidate.delta_status,
    reuse_outcome_helpfulness:
      intake.reuse_outcome_candidate.source_chain_helpfulness,
    residual_category: intake.residual_diagnostic_candidate.residual_category,
    residual_severity: intake.residual_diagnostic_candidate.severity,
    ready_for_next_daily_autohunt_cycle:
      intake.learning_loop_summary.ready_for_next_daily_autohunt_cycle,
  };
}

function buildBranchSuggestion(
  readback: AutohuntResultIntakeReadback | null,
): AutohuntWorkTargetModeBranchSuggestion | null {
  const intake =
    readback?.selected_result_intake ?? readback?.latest_recorded_result_intake;
  if (!intake) return null;

  const residualCategory =
    intake.residual_diagnostic_candidate.residual_category;
  const reuseHelpfulness = intake.reuse_outcome_candidate.source_chain_helpfulness;
  const residualNeedsBranch = [
    "source_chain_gap",
    "result_report_gap",
    "unexpected_blocker",
  ].includes(residualCategory);
  const reuseNeedsBranch = ["missing", "stale", "noisy"].includes(
    reuseHelpfulness,
  );
  if (!residualNeedsBranch && !reuseNeedsBranch) return null;

  const option = getAutohuntWorkTargetModeOption(
    "create_new_perspective_work_from_autohunt_conditions",
  );
  const seed = {
    result_intake_id: intake.result_intake_id,
    residual_category: residualCategory,
    reuse_outcome_helpfulness: reuseHelpfulness,
    residual_fingerprint:
      intake.residual_diagnostic_candidate.residual_fingerprint,
    reuse_outcome_fingerprint:
      intake.reuse_outcome_candidate.outcome_fingerprint,
  };

  return {
    suggestion_id: `autohunt-target-branch-suggestion:${stripFingerprintPrefix(
      fingerprint(seed),
    )}`,
    suggested_mode: "create_new_perspective_work_from_autohunt_conditions",
    priority: residualCategory === "unexpected_blocker" ? "high" : "medium",
    reason: residualNeedsBranch
      ? `Residual category ${residualCategory} suggests reviewing a separate Autohunt-seeded branch.`
      : `Reuse outcome ${reuseHelpfulness} suggests reviewing a separate Autohunt-seeded branch.`,
    lifecycle_interpretation: option.lifecycle_interpretation,
    branch_policy: option.branch_policy,
    auto_promoted: false,
    durable_creation_allowed_now: false,
    perspective_mutation_allowed_now: false,
    cwp_mutation_allowed_now: false,
    memory_write_allowed_now: false,
  };
}
