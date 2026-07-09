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
  AutohuntHandoffPlanOperatorReviewDecision,
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
} from "@/types/autohunt-handoff-plan-operator-review-decision";

type AutohuntHandoffPlanOperatorReviewDecisionReadbackPanelProps = {
  readback: AutohuntHandoffPlanOperatorReviewDecisionReadback;
};

export function AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel({
  readback,
}: AutohuntHandoffPlanOperatorReviewDecisionReadbackPanelProps) {
  const decision = readback.selected_decision;

  return (
    <WorkplanePanelShell
      kicker="Autohunt operator decision"
      title="Handoff Plan Operator Decision Readback"
      ariaLabel="Autohunt Handoff Plan Operator Review Decision passive readback"
    >
      <p style={workplaneCopyStyle}>
        Passive operator decision readback only. Acceptance here is limited to
        future supervised handoff copy/export planning; it starts no runner,
        executes no Codex task, calls no GitHub or provider service, creates no
        branch or PR, and performs no merge, deploy, source fetch, retrieval,
        memory, Perspective, CWP, work, proof, evidence, product, or delivery
        mutation.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Selection"
          value={readback.selection_status}
        />
        <WorkplanePanelMetric
          label="Accepted"
          value={readback.accepted_decisions.length}
        />
        <WorkplanePanelMetric
          label="Deferred"
          value={readback.deferred_decisions.length}
        />
        <WorkplanePanelMetric
          label="Rejected"
          value={readback.rejected_decisions.length}
        />
        <WorkplanePanelMetric
          label="Invalid rows"
          value={readback.invalid_record_count}
        />
      </WorkplanePanelMetricGrid>

      {decision ? (
        <SelectedDecision decision={decision} />
      ) : (
        <EmptySelection />
      )}
    </WorkplanePanelShell>
  );
}

function SelectedDecision({
  decision,
}: {
  decision: AutohuntHandoffPlanOperatorReviewDecision;
}) {
  return (
    <>
      <AutonomySection
        title="selected decision"
        description="Decision identity and operator choice are durable readback only."
      >
        <AutonomyKeyValues
          rows={[
            ["decision_id", decision.decision_id],
            ["decision_status", decision.decision_status],
            ["operator_decision", decision.operator_decision],
            ["decision_fingerprint", decision.decision_fingerprint],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="source handoff plan"
        description="Source handoff plan, grant, preflight, spine, and candidate bindings are preserved as ids and fingerprints."
      >
        <AutonomyKeyValues
          rows={[
            [
              "source_handoff_plan_id",
              decision.source_handoff_plan.handoff_plan_id,
            ],
            [
              "source_handoff_plan_fingerprint",
              decision.source_handoff_plan.handoff_plan_fingerprint,
            ],
            [
              "source_grant_id",
              decision.source_handoff_plan.source_grant_id,
            ],
            [
              "source_grant_fingerprint",
              decision.source_handoff_plan.source_grant_fingerprint,
            ],
            [
              "source_preflight_packet_id",
              decision.source_handoff_plan.source_preflight_packet_id,
            ],
            [
              "source_preflight_packet_fingerprint",
              decision.source_handoff_plan
                .source_preflight_packet_fingerprint,
            ],
            [
              "source_workbench_spine_fingerprint",
              decision.source_handoff_plan.source_workbench_spine_fingerprint,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="candidate id"
          items={decision.source_handoff_plan.selected_candidate_ids}
        />
        <AutonomyList
          itemLabel="candidate fingerprint"
          items={decision.source_handoff_plan.selected_candidate_fingerprints}
        />
      </AutonomySection>

      <AutonomySection
        title="review basis"
        description="Review basis is persisted as refs and fingerprints; no raw review note is stored."
      >
        <AutonomyKeyValues
          rows={[
            ["review_basis_ref", decision.review_basis.review_basis_ref],
            ["reviewed_by", decision.review_basis.reviewed_by ?? "not_supplied"],
            ["reviewed_at", decision.review_basis.reviewed_at ?? "not_supplied"],
            [
              "review_basis_fingerprint",
              decision.review_basis.review_basis_fingerprint,
            ],
            [
              "raw_review_note_persisted",
              decision.review_basis.raw_review_note_persisted,
            ],
          ]}
        />
      </AutonomySection>

      {decision.accepted_summary ? (
        <AutonomySection
          title="accepted summary"
          description="Accepted scope is future supervised handoff copy/export planning only."
        >
          <AutonomyKeyValues
            rows={[
              ["prompt_plan_id", decision.accepted_summary.prompt_plan_id],
              ["review_packet_id", decision.accepted_summary.review_packet_id],
              [
                "selected_candidate_count",
                decision.accepted_summary.selected_candidate_count,
              ],
              ["max_changed_files", decision.accepted_summary.max_changed_files],
              ["approval_scope", decision.accepted_summary.approval_scope],
            ]}
          />
          <AutonomyList
            itemLabel="required check"
            items={decision.accepted_summary.required_checks}
          />
          <AutonomyList
            itemLabel="expected changed file glob"
            items={decision.accepted_summary.expected_changed_file_globs}
          />
        </AutonomySection>
      ) : null}

      {decision.defer_or_reject_summary ? (
        <AutonomySection
          title="defer or reject summary"
          description="Reason material is persisted as a code and fingerprint only."
        >
          <AutonomyKeyValues
            rows={[
              [
                "reason_code",
                decision.defer_or_reject_summary.reason_code,
              ],
              [
                "reason_fingerprint",
                decision.defer_or_reject_summary.reason_fingerprint,
              ],
              [
                "raw_reason_text_persisted",
                decision.defer_or_reject_summary.raw_reason_text_persisted,
              ],
            ]}
          />
        </AutonomySection>
      ) : null}

      <AutonomySection
        title="source chain validation"
        description="Validation records whether source plan readiness, fingerprints, and bindings passed."
      >
        <AutonomyKeyValues
          rows={Object.entries(decision.source_chain_validation).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="outputs and blocks"
        description="Allowed outputs are readback or future supervised preview artifacts; forbidden outputs remain execution and durable mutation artifacts."
      >
        <AutonomyList
          itemLabel="blocked action"
          items={decision.blocked_actions}
        />
        <AutonomyList
          itemLabel="next allowed output"
          items={decision.next_allowed_outputs}
        />
        <AutonomyList
          itemLabel="forbidden output"
          items={decision.forbidden_outputs}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="Every dangerous authority flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(decision.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="The decision persists source fingerprints, operator decision, policy, and boundaries only."
      >
        <AutonomyKeyValues
          rows={Object.entries(decision.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="row counts"
        description="The write summary proves only the operator decision table changed."
      >
        <AutonomyKeyValues
          rows={[
            [
              "target_table_name",
              decision.row_count_write_summary.target_table_name,
            ],
            ["target_delta", decision.row_count_write_summary.target_delta],
            [
              "target_delta_matches_expected",
              decision.row_count_write_summary.target_delta_matches_expected,
            ],
            [
              "all_non_target_row_counts_unchanged",
              decision.row_count_write_summary
                .all_non_target_row_counts_unchanged,
            ],
            [
              "non_target_changed_table_count",
              decision.row_count_write_summary.non_target_changed_table_count,
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
      title="no selected decision"
      description="No accepted operator decision is selected. This empty state does not fabricate acceptance or create any write path."
    >
      <AutonomyKeyValues
        rows={[
          ["auto_acceptance", false],
          ["runner_started", false],
          ["codex_executed", false],
          ["github_called", false],
          ["branch_or_pr_created", false],
        ]}
      />
    </AutonomySection>
  );
}
