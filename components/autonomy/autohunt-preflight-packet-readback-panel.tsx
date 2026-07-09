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
  AutohuntPreflightPacket,
  AutohuntPreflightPacketReadback,
} from "@/types/autohunt-preflight-packet";

type AutohuntPreflightPacketReadbackPanelProps = {
  readback: AutohuntPreflightPacketReadback;
};

export function AutohuntPreflightPacketReadbackPanel({
  readback,
}: AutohuntPreflightPacketReadbackPanelProps) {
  const packet = readback.selected_preflight_packet;

  return (
    <WorkplanePanelShell
      kicker="Autohunt preflight packet"
      title="Preflight Packet Readback"
      ariaLabel="Autohunt Preflight Packet passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive preflight packet readback. The packet is a dry-run readiness
        artifact for future supervised handoff planning only; this panel starts
        no runner, schedules nothing, executes no Codex task, calls no external
        service, and writes no additional state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Ready packets"
          value={readback.ready_preflight_packets.length}
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

      {packet ? <SelectedPacket packet={packet} /> : <EmptySelection />}
    </WorkplanePanelShell>
  );
}

function SelectedPacket({ packet }: { packet: AutohuntPreflightPacket }) {
  return (
    <>
      <AutonomySection
        title="selected packet"
        description="Packet identity, source grant binding, selected candidate count, and fingerprint are stored as bounded structured material."
      >
        <AutonomyKeyValues
          rows={[
            ["preflight_packet_id", packet.preflight_packet_id],
            ["preflight_status", packet.preflight_status],
            ["source_grant_id", packet.source_grant.grant_id],
            [
              "source_grant_fingerprint",
              packet.source_grant.grant_fingerprint,
            ],
            [
              "selected_candidate_count",
              packet.source_queue_readback.selected_candidate_ids.length,
            ],
            ["preflight_packet_fingerprint", packet.preflight_packet_fingerprint],
          ]}
        />
        <AutonomyList
          itemLabel="candidate id"
          items={packet.source_queue_readback.selected_candidate_ids}
        />
        <AutonomyList
          itemLabel="candidate fingerprint"
          items={packet.source_queue_readback.selected_candidate_fingerprints}
        />
      </AutonomySection>

      <AutonomySection
        title="budget projection"
        description="Aggregate and remaining budget projections are readiness policy only."
      >
        <AutonomyKeyValues
          rows={[
            [
              "aggregate_iterations",
              packet.aggregate_budget_projection.estimated_iterations,
            ],
            [
              "aggregate_tool_calls",
              packet.aggregate_budget_projection.estimated_tool_calls,
            ],
            [
              "aggregate_codex_tasks",
              packet.aggregate_budget_projection.estimated_codex_tasks,
            ],
            [
              "aggregate_file_changes",
              packet.aggregate_budget_projection.estimated_file_changes,
            ],
            [
              "aggregate_draft_prs",
              packet.aggregate_budget_projection.estimated_draft_prs,
            ],
            [
              "remaining_iterations",
              packet.grant_budget_remaining_projection.remaining_iterations,
            ],
            [
              "remaining_tool_calls",
              packet.grant_budget_remaining_projection.remaining_tool_calls,
            ],
            [
              "remaining_codex_tasks",
              packet.grant_budget_remaining_projection.remaining_codex_tasks,
            ],
            [
              "remaining_file_changes",
              packet.grant_budget_remaining_projection.remaining_file_changes,
            ],
            [
              "remaining_draft_prs",
              packet.grant_budget_remaining_projection.remaining_draft_prs,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="preflight checks"
        description="Checks must pass before a future supervised handoff plan can use this packet."
      >
        <AutonomyKeyValues
          rows={[
            [
              "source_grant_active",
              packet.preflight_checks.source_grant_active,
            ],
            [
              "source_grant_fingerprint_verified",
              packet.preflight_checks.source_grant_fingerprint_verified,
            ],
            [
              "candidate_fingerprints_verified",
              packet.preflight_checks.candidate_fingerprints_verified,
            ],
            [
              "candidate_status_all_queued",
              packet.preflight_checks.candidate_status_all_queued,
            ],
            [
              "work_classes_allowed",
              packet.preflight_checks.work_classes_allowed,
            ],
            ["file_scope_allowed", packet.preflight_checks.file_scope_allowed],
            [
              "forbidden_actions_absent",
              packet.preflight_checks.forbidden_actions_absent,
            ],
            [
              "budget_within_grant",
              packet.preflight_checks.budget_within_grant,
            ],
            [
              "required_checks_present",
              packet.preflight_checks.required_checks_present,
            ],
            [
              "stop_conditions_present",
              packet.preflight_checks.stop_conditions_present,
            ],
            ["source_freshness_ok", packet.preflight_checks.source_freshness_ok],
            ["passed", packet.preflight_checks.passed],
          ]}
        />
        <AutonomyList
          itemLabel="blocker"
          items={packet.preflight_checks.blocker_reasons}
          emptyText="No preflight blocker recorded."
        />
        <AutonomyList
          itemLabel="warning"
          items={packet.preflight_checks.warning_reasons}
          emptyText="No preflight warning recorded."
        />
      </AutonomySection>

      <AutonomySection
        title="candidate policy"
        description="Blocked actions, stop conditions, and checks are carried forward as dry-run readiness material."
      >
        <AutonomyList itemLabel="blocked action" items={packet.blocked_actions} />
        <AutonomyList
          itemLabel="stop condition"
          items={packet.stop_conditions}
        />
        <AutonomyList itemLabel="required check" items={packet.required_checks} />
      </AutonomySection>

      <AutonomySection
        title="outputs"
        description="Allowed outputs are planning artifacts; forbidden outputs are execution or durable mutation artifacts."
      >
        <AutonomyList
          itemLabel="next allowed output"
          items={packet.next_allowed_outputs}
        />
        <AutonomyList
          itemLabel="forbidden output"
          items={packet.forbidden_outputs}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="Every dangerous authority flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(packet.authority_boundary).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="Only safe refs, fingerprints, preflight policy, budget projections, checks, and boundaries are persisted."
      >
        <AutonomyKeyValues
          rows={Object.entries(packet.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row-count summary"
        description="The preflight packet write is target-table only."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              packet.row_count_write_summary.target_table_name,
            ],
            ["target_delta", packet.row_count_write_summary.target_delta],
            [
              "non_target_changed_table_count",
              packet.row_count_write_summary.non_target_changed_table_count,
            ],
            [
              "all_non_target_row_counts_unchanged",
              packet.row_count_write_summary
                .all_non_target_row_counts_unchanged,
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
      title="selected packet"
      description="No valid ready preflight packet is available for this readback."
    >
      <AutonomyKeyValues rows={[["selected_preflight_packet", "none"]]} />
    </AutonomySection>
  );
}
