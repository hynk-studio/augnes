import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type {
  AutohuntHandoffPlanPreview,
  AutohuntHandoffPlanPreviewReadback,
} from "@/types/autohunt-handoff-plan-preview";

type AutohuntHandoffPlanPreviewReadbackPanelProps = {
  readback: AutohuntHandoffPlanPreviewReadback;
};

export function AutohuntHandoffPlanPreviewReadbackPanel({
  readback,
}: AutohuntHandoffPlanPreviewReadbackPanelProps) {
  const handoffPlan = readback.selected_handoff_plan;

  return (
    <WorkplanePanelShell
      kicker="Autohunt handoff plan preview"
      title="Handoff Plan Preview Readback"
      ariaLabel="Autohunt Handoff Plan Preview passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive handoff plan preview readback only. This planning packet launches
        no runner, schedules nothing, executes no Codex task, calls no GitHub or
        provider service, creates no branch or PR, and writes no durable state
        beyond the already recorded preview.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Ready plans"
          value={readback.ready_handoff_plans.length}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
        <WorkplanePanelMetric
          label="Candidates"
          value={readback.selected_candidate_summaries.length}
        />
      </WorkplanePanelMetricGrid>

      {handoffPlan ? (
        <SelectedHandoffPlan handoffPlan={handoffPlan} />
      ) : (
        <EmptySelection />
      )}
    </WorkplanePanelShell>
  );
}

function SelectedHandoffPlan({
  handoffPlan,
}: {
  handoffPlan: AutohuntHandoffPlanPreview;
}) {
  return (
    <>
      <AutonomySection
        title="selected plan"
        description="Plan identity, source grant, preflight packet, Workbench spine, and fingerprint are safe structured readback."
      >
        <AutonomyKeyValues
          rows={[
            ["handoff_plan_id", handoffPlan.handoff_plan_id],
            ["handoff_plan_status", handoffPlan.handoff_plan_status],
            ["source_grant_id", handoffPlan.source_grant.grant_id],
            [
              "source_grant_fingerprint",
              handoffPlan.source_grant.grant_fingerprint,
            ],
            [
              "source_preflight_packet_id",
              handoffPlan.source_preflight.preflight_packet_id,
            ],
            [
              "source_preflight_packet_fingerprint",
              handoffPlan.source_preflight.preflight_packet_fingerprint,
            ],
            [
              "source_workbench_spine_fingerprint",
              handoffPlan.source_workbench_spine.spine_fingerprint,
            ],
            ["handoff_plan_fingerprint", handoffPlan.handoff_plan_fingerprint],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="selected candidates"
        description="Candidate plan summaries carry ids, fingerprints, expected outputs, checks, and file globs only."
      >
        <AutonomyList
          itemLabel="candidate id"
          items={handoffPlan.source_preflight.selected_candidate_ids}
        />
        <AutonomyList
          itemLabel="candidate fingerprint"
          items={handoffPlan.source_preflight.selected_candidate_fingerprints}
        />
        <AutonomyList
          itemLabel="candidate file glob"
          items={uniqueStrings(
            handoffPlan.selected_candidate_plan_summaries.flatMap(
              (candidate) => candidate.proposed_files_or_globs,
            ),
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="prompt plan"
        description="Prompt material is persisted as refs, summaries, and fingerprints; no raw prompt text is stored."
      >
        <AutonomyKeyValues
          rows={[
            [
              "prompt_plan_id",
              handoffPlan.supervised_codex_prompt_plan.prompt_plan_id,
            ],
            [
              "prompt_title",
              handoffPlan.supervised_codex_prompt_plan.prompt_title,
            ],
            [
              "prompt_goal_summary",
              handoffPlan.supervised_codex_prompt_plan.prompt_goal_summary,
            ],
            [
              "prompt_text_fingerprint",
              handoffPlan.supervised_codex_prompt_plan.prompt_text_fingerprint,
            ],
            [
              "raw_prompt_text_persisted",
              handoffPlan.supervised_codex_prompt_plan
                .raw_prompt_text_persisted,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="required context ref"
          items={handoffPlan.supervised_codex_prompt_plan.required_context_refs}
        />
        <AutonomyList
          itemLabel="acceptance criterion"
          items={handoffPlan.supervised_codex_prompt_plan.acceptance_criteria}
        />
      </AutonomySection>

      <AutonomySection
        title="draft PR plan"
        description="PR material is a preview outline only; no raw PR body is stored."
      >
        <AutonomyKeyValues
          rows={[
            ["branch_name_preview", handoffPlan.draft_pr_plan.branch_name_preview],
            ["pr_title_preview", handoffPlan.draft_pr_plan.pr_title_preview],
            ["max_changed_files", handoffPlan.draft_pr_plan.max_changed_files],
            [
              "raw_pr_body_persisted",
              handoffPlan.draft_pr_plan.raw_pr_body_persisted,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="PR body section"
          items={handoffPlan.draft_pr_plan.pr_body_sections}
        />
        <AutonomyList
          itemLabel="expected changed file glob"
          items={handoffPlan.draft_pr_plan.expected_changed_file_globs}
        />
        <AutonomyList
          itemLabel="reviewer focus"
          items={handoffPlan.draft_pr_plan.reviewer_focus}
        />
      </AutonomySection>

      <AutonomySection
        title="operator review"
        description="The packet requires explicit operator approval before any future execution, branch, PR, merge, or external call."
      >
        <AutonomyKeyValues
          rows={[
            [
              "review_packet_id",
              handoffPlan.operator_review_packet.review_packet_id,
            ],
            ["review_status", handoffPlan.operator_review_packet.review_status],
            [
              "approval_required_before_execution",
              handoffPlan.operator_review_packet
                .approval_required_before_execution,
            ],
            [
              "approval_required_before_branch_or_pr",
              handoffPlan.operator_review_packet
                .approval_required_before_branch_or_pr,
            ],
            [
              "approval_required_before_merge",
              handoffPlan.operator_review_packet.approval_required_before_merge,
            ],
            [
              "approval_required_before_external_call",
              handoffPlan.operator_review_packet
                .approval_required_before_external_call,
            ],
            [
              "raw_operator_note_persisted",
              handoffPlan.operator_review_packet.raw_operator_note_persisted,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="review question"
          items={handoffPlan.operator_review_packet.review_questions}
        />
      </AutonomySection>

      <AutonomySection
        title="budget and checks"
        description="Aggregate budget and required checks are projected readiness material only."
      >
        <AutonomyKeyValues
          rows={[
            [
              "estimated_iterations",
              handoffPlan.aggregate_budget_projection.estimated_iterations,
            ],
            [
              "estimated_tool_calls",
              handoffPlan.aggregate_budget_projection.estimated_tool_calls,
            ],
            [
              "estimated_codex_tasks",
              handoffPlan.aggregate_budget_projection.estimated_codex_tasks,
            ],
            [
              "estimated_file_changes",
              handoffPlan.aggregate_budget_projection.estimated_file_changes,
            ],
            [
              "estimated_draft_prs",
              handoffPlan.aggregate_budget_projection.estimated_draft_prs,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="required check"
          items={handoffPlan.draft_pr_plan.checks_to_run}
        />
      </AutonomySection>

      <AutonomySection
        title="outputs"
        description="Next outputs are previews and review packets; forbidden outputs remain execution or durable mutation artifacts."
      >
        <AutonomyList
          itemLabel="blocked action"
          items={handoffPlan.blocked_actions}
        />
        <AutonomyList
          itemLabel="next allowed output"
          items={handoffPlan.next_allowed_outputs}
        />
        <AutonomyList
          itemLabel="forbidden output"
          items={handoffPlan.forbidden_outputs}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="Every dangerous authority flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(handoffPlan.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="The preview persists safe refs, fingerprints, policy, checks, and boundaries only."
      >
        <AutonomyKeyValues
          rows={Object.entries(handoffPlan.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row counts"
        description="The write summary proves only the handoff plan preview table changed."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              handoffPlan.row_count_write_summary.target_table_name,
            ],
            [
              "target_delta",
              handoffPlan.row_count_write_summary.target_delta,
            ],
            [
              "target_delta_matches_expected",
              handoffPlan.row_count_write_summary
                .target_delta_matches_expected,
            ],
            [
              "all_non_target_row_counts_unchanged",
              handoffPlan.row_count_write_summary
                .all_non_target_row_counts_unchanged,
            ],
            [
              "non_target_changed_table_count",
              handoffPlan.row_count_write_summary
                .non_target_changed_table_count,
            ],
          ]}
        />
      </AutonomySection>
    </>
  );
}

function EmptySelection() {
  return (
    <AutonomySection
      title="empty selection"
      description="No ready handoff plan preview was selected from readback."
    >
      <AutonomyList
        itemLabel="readback"
        items={[]}
        emptyText="No selected handoff plan preview."
      />
    </AutonomySection>
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort();
}
