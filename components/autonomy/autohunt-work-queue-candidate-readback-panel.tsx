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
  AutohuntWorkQueueCandidate,
  AutohuntWorkQueueCandidateReadback,
} from "@/types/autohunt-work-queue-candidate";

type AutohuntWorkQueueCandidateReadbackPanelProps = {
  readback: AutohuntWorkQueueCandidateReadback;
};

export function AutohuntWorkQueueCandidateReadbackPanel({
  readback,
}: AutohuntWorkQueueCandidateReadbackPanelProps) {
  const selected = readback.selected_queued_candidates;
  const latest = selected[0] ?? readback.selected_candidate ?? null;

  return (
    <WorkplanePanelShell
      kicker="Autohunt queue candidate"
      title="Work Queue Candidate Readback"
      ariaLabel="Autohunt Work Queue Candidate passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive queue candidate readback. Candidates are future supervised
        preflight input only; this panel starts no runner, schedules nothing,
        executes no Codex task, calls no external service, and writes no
        additional state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Queued"
          value={readback.selected_queued_candidates.length}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
        <WorkplanePanelMetric
          label="Historical"
          value={
            readback.blocked_candidates.length +
            readback.deferred_candidates.length +
            readback.rejected_candidates.length +
            readback.superseded_candidates.length
          }
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="status breakdown"
        description="Queued candidates are selected for future preflight; non-queued records remain visible but unselected."
      >
        <AutonomyKeyValues
          rows={Object.entries(readback.status_breakdown).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>

      {latest ? (
        <SelectedCandidate candidate={latest} />
      ) : (
        <EmptySelection />
      )}
    </WorkplanePanelShell>
  );
}

function SelectedCandidate({
  candidate,
}: {
  candidate: AutohuntWorkQueueCandidate;
}) {
  return (
    <>
      <AutonomySection
        title="selected candidate"
        description="Candidate identity, origin, grant binding, and title summary fingerprint are stored as bounded structured material."
      >
        <AutonomyKeyValues
          rows={[
            ["candidate_id", candidate.candidate_id],
            ["candidate_status", candidate.candidate_status],
            ["candidate_origin", candidate.candidate_origin],
            ["work_class", candidate.work_class],
            ["source_grant_id", candidate.source_grant.grant_id],
            [
              "source_grant_fingerprint",
              candidate.source_grant.grant_fingerprint,
            ],
            [
              "title_summary_fingerprint",
              candidate.title_summary_fingerprint,
            ],
            ["candidate_fingerprint", candidate.candidate_fingerprint],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="budget projection"
        description="Budget projection is bounded by the source grant and does not authorize execution."
      >
        <AutonomyKeyValues
          rows={[
            [
              "estimated_iterations",
              candidate.budget_projection.estimated_iterations,
            ],
            [
              "estimated_tool_calls",
              candidate.budget_projection.estimated_tool_calls,
            ],
            [
              "estimated_codex_tasks",
              candidate.budget_projection.estimated_codex_tasks,
            ],
            [
              "estimated_file_changes",
              candidate.budget_projection.estimated_file_changes,
            ],
            [
              "estimated_draft_prs",
              candidate.budget_projection.estimated_draft_prs,
            ],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="grant fit"
        description="Grant-fit checks block out-of-scope work before any runner exists."
      >
        <AutonomyKeyValues
          rows={[
            ["work_class_allowed", candidate.grant_fit.work_class_allowed],
            ["file_scope_allowed", candidate.grant_fit.file_scope_allowed],
            [
              "forbidden_actions_absent",
              candidate.grant_fit.forbidden_actions_absent,
            ],
            ["budget_within_grant", candidate.grant_fit.budget_within_grant],
            [
              "stop_conditions_present",
              candidate.grant_fit.stop_conditions_present,
            ],
            ["source_freshness_ok", candidate.grant_fit.source_freshness_ok],
            ["passed", candidate.grant_fit.passed],
          ]}
        />
        <AutonomyList
          itemLabel="blocker"
          items={candidate.grant_fit.blocker_reasons}
          emptyText="No grant-fit blocker recorded."
        />
        <AutonomyList
          itemLabel="warning"
          items={candidate.grant_fit.warning_reasons}
          emptyText="No grant-fit warning recorded."
        />
      </AutonomySection>

      <AutonomySection
        title="source binding"
        description="Source refs and fingerprints are persisted without raw source payloads."
      >
        <AutonomyList itemLabel="source ref" items={candidate.source_refs} />
        <AutonomyList
          itemLabel="source fingerprint"
          items={candidate.source_fingerprints}
        />
        <AutonomyList itemLabel="evidence ref" items={candidate.evidence_refs} />
        <AutonomyList
          itemLabel="context ref"
          items={candidate.required_context_refs}
        />
      </AutonomySection>

      <AutonomySection
        title="candidate scope"
        description="Proposed files, expected outputs, checks, blocked actions, and stop conditions are queue policy only."
      >
        <AutonomyList
          itemLabel="proposed file or glob"
          items={candidate.proposed_files_or_globs}
        />
        <AutonomyList
          itemLabel="expected output"
          items={candidate.expected_outputs}
        />
        <AutonomyList
          itemLabel="required check"
          items={candidate.required_checks}
        />
        <AutonomyList
          itemLabel="blocked action"
          items={candidate.blocked_actions}
        />
        <AutonomyList
          itemLabel="stop condition"
          items={candidate.stop_conditions}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="Every dangerous authority flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(candidate.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="Only safe refs, fingerprints, queue policy, budget projection, and boundaries are persisted."
      >
        <AutonomyKeyValues
          rows={Object.entries(candidate.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row-count summary"
        description="The candidate record write is target-table only."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              candidate.row_count_write_summary.target_table_name,
            ],
            ["target_delta", candidate.row_count_write_summary.target_delta],
            [
              "non_target_changed_table_count",
              candidate.row_count_write_summary.non_target_changed_table_count,
            ],
            [
              "all_non_target_row_counts_unchanged",
              candidate.row_count_write_summary
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
      title="selected candidate"
      description="No valid queued candidate is available for this readback."
    >
      <AutonomyKeyValues rows={[["selected_candidate", "none"]]} />
    </AutonomySection>
  );
}
