import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type { AutohuntWorkbenchReadbackSpine } from "@/types/autohunt-workbench-readback-spine";

type AutohuntWorkbenchReadbackSpinePanelProps = {
  spine: AutohuntWorkbenchReadbackSpine;
};

export function AutohuntWorkbenchReadbackSpinePanel({
  spine,
}: AutohuntWorkbenchReadbackSpinePanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Autohunt readback spine"
      title="Workbench Autohunt Readiness"
      ariaLabel="Autohunt Workbench passive readback spine"
    >
      <p style={workplaneCopyStyle}>
        Readback only. This spine starts no runner, starts no scheduler,
        executes no Codex task, calls no GitHub or provider, creates no branch
        or PR, merges nothing, deploys nothing, publishes nothing, fetches no
        source, runs no retrieval, and mutates no Perspective, CWP, work,
        memory, proof, evidence, product, or delivery state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Status" value={spine.spine_status} />
        <WorkplanePanelMetric
          label="Queued candidates"
          value={spine.queued_candidate_summary.queued_candidate_count}
        />
        <WorkplanePanelMetric
          label="Selected candidates"
          value={spine.ready_preflight_summary.selected_candidate_count}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={
            spine.latest_active_grant_summary.invalid_grant_count +
            spine.queued_candidate_summary.invalid_candidate_count +
            spine.ready_preflight_summary.invalid_packet_count
          }
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="grant"
        description="Latest active delegation grant summary for this Workbench readback."
      >
        <AutonomyKeyValues
          rows={[
            ["grant_id", spine.latest_active_grant_summary.grant_id],
            [
              "grant_fingerprint",
              spine.latest_active_grant_summary.grant_fingerprint,
            ],
            ["grant_status", spine.latest_active_grant_summary.grant_status],
            ["grant_mode", spine.latest_active_grant_summary.grant_mode],
            ["approval_ref", spine.latest_active_grant_summary.approval_ref],
            [
              "approval_text_fingerprint",
              spine.latest_active_grant_summary.approval_text_fingerprint,
            ],
            [
              "invalid_grant_count",
              spine.latest_active_grant_summary.invalid_grant_count,
            ],
          ]}
        />
        <AutonomyKeyValues rows={budgetRows(spine)} />
      </AutonomySection>

      <AutonomySection
        title="queue"
        description="Queued candidate count, latest candidate, origins, work classes, and fit notes."
      >
        <AutonomyKeyValues
          rows={[
            [
              "queued_candidate_count",
              spine.queued_candidate_summary.queued_candidate_count,
            ],
            [
              "latest_candidate_id",
              spine.queued_candidate_summary.latest_candidate_id,
            ],
            [
              "latest_candidate_fingerprint",
              spine.queued_candidate_summary.latest_candidate_fingerprint,
            ],
            [
              "invalid_candidate_count",
              spine.queued_candidate_summary.invalid_candidate_count,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="origin"
          items={spine.queued_candidate_summary.origins}
          emptyText="No queued candidate origin."
        />
        <AutonomyList
          itemLabel="work class"
          items={spine.queued_candidate_summary.work_classes}
          emptyText="No queued candidate work class."
        />
        <AutonomyList
          itemLabel="queue blocker"
          items={spine.queued_candidate_summary.blocker_reasons}
          emptyText="No queue blocker surfaced."
        />
        <AutonomyList
          itemLabel="queue warning"
          items={spine.queued_candidate_summary.warning_reasons}
          emptyText="No queue warning surfaced."
        />
      </AutonomySection>

      <AutonomySection
        title="preflight"
        description="Latest ready preflight packet summary and carried blockers or warnings."
      >
        <AutonomyKeyValues
          rows={[
            [
              "preflight_packet_id",
              spine.ready_preflight_summary.preflight_packet_id,
            ],
            [
              "preflight_packet_fingerprint",
              spine.ready_preflight_summary.preflight_packet_fingerprint,
            ],
            [
              "preflight_status",
              spine.ready_preflight_summary.preflight_status,
            ],
            [
              "selected_candidate_count",
              spine.ready_preflight_summary.selected_candidate_count,
            ],
            [
              "invalid_packet_count",
              spine.ready_preflight_summary.invalid_packet_count,
            ],
            [
              "aggregate_iterations",
              spine.ready_preflight_summary.aggregate_budget_projection
                ?.estimated_iterations ?? null,
            ],
            [
              "aggregate_tool_calls",
              spine.ready_preflight_summary.aggregate_budget_projection
                ?.estimated_tool_calls ?? null,
            ],
            [
              "aggregate_codex_tasks",
              spine.ready_preflight_summary.aggregate_budget_projection
                ?.estimated_codex_tasks ?? null,
            ],
            [
              "aggregate_file_changes",
              spine.ready_preflight_summary.aggregate_budget_projection
                ?.estimated_file_changes ?? null,
            ],
            [
              "aggregate_draft_prs",
              spine.ready_preflight_summary.aggregate_budget_projection
                ?.estimated_draft_prs ?? null,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="preflight blocker"
          items={spine.ready_preflight_summary.blocker_reasons}
          emptyText="No preflight blocker surfaced."
        />
        <AutonomyList
          itemLabel="preflight warning"
          items={spine.ready_preflight_summary.warning_reasons}
          emptyText="No preflight warning surfaced."
        />
      </AutonomySection>

      <AutonomySection
        title="binding"
        description="Grant, candidate, and preflight fingerprints must bind before future supervised handoff planning."
      >
        <AutonomyKeyValues
          rows={[
            [
              "grant_to_candidates_bound",
              spine.chain_binding.grant_to_candidates_bound,
            ],
            [
              "candidates_to_preflight_bound",
              spine.chain_binding.candidates_to_preflight_bound,
            ],
            [
              "grant_fingerprint_matches",
              spine.chain_binding.grant_fingerprint_matches,
            ],
            [
              "candidate_fingerprints_match",
              spine.chain_binding.candidate_fingerprints_match,
            ],
            ["raw_material_persisted", spine.raw_material_persisted],
            ["spine_fingerprint", spine.spine_fingerprint],
          ]}
        />
        <AutonomyList
          itemLabel="selected candidate id"
          items={spine.chain_binding.selected_candidate_ids}
          emptyText="No selected candidate id."
        />
        <AutonomyList
          itemLabel="selected candidate fingerprint"
          items={spine.chain_binding.selected_candidate_fingerprints}
          emptyText="No selected candidate fingerprint."
        />
      </AutonomySection>

      <AutonomySection
        title="outputs"
        description="Next outputs remain planning and review artifacts only."
      >
        <AutonomyList
          itemLabel="next allowed output"
          items={spine.next_allowed_outputs}
        />
        <AutonomyList
          itemLabel="blocked action"
          items={spine.blocked_actions}
        />
      </AutonomySection>

      <AutonomySection
        title="authority"
        description="Every dangerous authority flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(spine.authority_boundary).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}

function budgetRows(
  spine: AutohuntWorkbenchReadbackSpine,
): Array<[string, string | number | boolean | null]> {
  const budget = spine.latest_active_grant_summary.budget_summary;
  return [
    ["time_limit_minutes", budget?.time_limit_minutes ?? null],
    ["max_iterations", budget?.max_iterations ?? null],
    ["max_tool_calls", budget?.max_tool_calls ?? null],
    ["max_codex_tasks", budget?.max_codex_tasks ?? null],
    ["max_draft_prs", budget?.max_draft_prs ?? null],
    ["max_file_changes", budget?.max_file_changes ?? null],
    ["max_changed_files_per_pr", budget?.max_changed_files_per_pr ?? null],
  ];
}
