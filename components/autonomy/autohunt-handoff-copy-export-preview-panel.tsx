import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneCopyStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import type { AutohuntHandoffCopyExportPreview } from "@/types/autohunt-handoff-copy-export-preview";

type AutohuntHandoffCopyExportPreviewPanelProps = {
  preview: AutohuntHandoffCopyExportPreview;
};

export function AutohuntHandoffCopyExportPreviewPanel({
  preview,
}: AutohuntHandoffCopyExportPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Autohunt copy/export preview"
      title="Handoff Copy/Export Preview"
      ariaLabel="Autohunt Handoff Copy Export passive preview"
    >
      <p style={workplaneCopyStyle}>
        Passive structured preview only. This panel renders no copy button, no
        download, no launch control, no clipboard write, no file write, no
        Codex execution, no GitHub call, no branch or PR creation, and no
        Perspective, CWP, work, memory, proof, evidence, product, or delivery
        mutation.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.preview_status}
        />
        <WorkplanePanelMetric
          label="Decision"
          value={preview.source_operator_decision.decision_id ?? "none"}
        />
        <WorkplanePanelMetric
          label="Export ready"
          value={String(preview.export_boundary.export_ready_for_manual_copy)}
        />
        <WorkplanePanelMetric
          label="Fingerprint"
          value={preview.preview_fingerprint}
        />
      </WorkplanePanelMetricGrid>

      <AutonomySection
        title="source decision"
        description="Accepted operator decision material is shown as ids, statuses, scopes, and fingerprints only."
      >
        <AutonomyKeyValues
          rows={[
            ["decision_id", preview.source_operator_decision.decision_id],
            [
              "decision_status",
              preview.source_operator_decision.decision_status,
            ],
            [
              "operator_decision",
              preview.source_operator_decision.operator_decision,
            ],
            [
              "decision_fingerprint",
              preview.source_operator_decision.decision_fingerprint,
            ],
            ["approval_scope", preview.source_operator_decision.approval_scope],
          ]}
        />
      </AutonomySection>

      <AutonomySection
        title="source handoff plan"
        description="Source handoff plan and candidate bindings are preserved as ids and fingerprints."
      >
        <AutonomyKeyValues
          rows={[
            ["handoff_plan_id", preview.source_handoff_plan.handoff_plan_id],
            [
              "handoff_plan_fingerprint",
              preview.source_handoff_plan.handoff_plan_fingerprint,
            ],
            ["prompt_plan_id", preview.source_handoff_plan.prompt_plan_id],
            ["review_packet_id", preview.source_handoff_plan.review_packet_id],
          ]}
        />
        <AutonomyList
          itemLabel="candidate id"
          items={preview.source_handoff_plan.selected_candidate_ids}
        />
        <AutonomyList
          itemLabel="candidate fingerprint"
          items={preview.source_handoff_plan.selected_candidate_fingerprints}
        />
      </AutonomySection>

      <AutonomySection
        title="copy packet"
        description="Copy packet material is structured sections, refs, fingerprints, constraints, checks, and warnings only."
      >
        <AutonomyKeyValues
          rows={[
            ["copy_packet_id", preview.copy_packet.copy_packet_id],
            ["copy_packet_title", preview.copy_packet.copy_packet_title],
            ["goal_summary", preview.copy_packet.goal_summary],
            [
              "copy_packet_fingerprint",
              preview.copy_packet.copy_packet_fingerprint,
            ],
            [
              "raw_copy_text_persisted",
              preview.copy_packet.raw_copy_text_persisted,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="required context ref"
          items={preview.copy_packet.required_context_refs}
        />
        <AutonomyList
          itemLabel="source ref"
          items={preview.copy_packet.source_refs}
        />
        <AutonomyList
          itemLabel="source fingerprint"
          items={preview.copy_packet.source_fingerprints}
        />
        <AutonomyList
          itemLabel="selected candidate ref"
          items={preview.copy_packet.selected_candidate_refs}
        />
      </AutonomySection>

      <AutonomySection
        title="constraints and checks"
        description="A future operator can manually compose a handoff from these bounded sections; no raw prompt text is emitted."
      >
        <AutonomyList
          itemLabel="implementation constraint"
          items={preview.copy_packet.implementation_constraints}
        />
        <AutonomyList
          itemLabel="acceptance criterion"
          items={preview.copy_packet.acceptance_criteria}
        />
        <AutonomyList
          itemLabel="required check"
          items={preview.copy_packet.required_checks}
        />
        <AutonomyList
          itemLabel="result report section"
          items={preview.copy_packet.expected_result_report_sections}
        />
      </AutonomySection>

      <AutonomySection
        title="non-goals and warnings"
        description="Blocked actions and warnings remain visible so copy/export planning is not confused with execution."
      >
        <AutonomyList itemLabel="non-goal" items={preview.copy_packet.non_goals} />
        <AutonomyList
          itemLabel="blocked action"
          items={preview.copy_packet.blocked_actions}
        />
        <AutonomyList
          itemLabel="operator warning"
          items={preview.copy_packet.operator_warnings}
        />
      </AutonomySection>

      <AutonomySection
        title="draft PR plan preview"
        description="Draft PR material is label-only preview data; no raw PR body is stored or rendered."
      >
        <AutonomyKeyValues
          rows={[
            [
              "branch_name_preview",
              preview.draft_pr_plan_preview.branch_name_preview,
            ],
            ["pr_title_preview", preview.draft_pr_plan_preview.pr_title_preview],
            ["max_changed_files", preview.draft_pr_plan_preview.max_changed_files],
            [
              "raw_pr_body_persisted",
              preview.draft_pr_plan_preview.raw_pr_body_persisted,
            ],
          ]}
        />
        <AutonomyList
          itemLabel="PR body section label"
          items={preview.draft_pr_plan_preview.pr_body_section_labels}
        />
        <AutonomyList
          itemLabel="expected changed file glob"
          items={preview.draft_pr_plan_preview.expected_changed_file_globs}
        />
        <AutonomyList
          itemLabel="check to run"
          items={preview.draft_pr_plan_preview.checks_to_run}
        />
        <AutonomyList
          itemLabel="reviewer focus"
          items={preview.draft_pr_plan_preview.reviewer_focus}
        />
      </AutonomySection>

      <AutonomySection
        title="export boundary"
        description="Manual copy readiness is separate from action authority; every action flag remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(preview.export_boundary).map(([key, value]) => [
            key,
            value,
          ])}
        />
      </AutonomySection>

      <AutonomySection
        title="authority boundary"
        description="All runner, external, branch, PR, merge, deploy, source, retrieval, memory, Perspective, CWP, work, proof, evidence, and auto-apply authority remains false."
      >
        <AutonomyKeyValues
          rows={Object.entries(preview.authority_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="material boundary"
        description="The preview persists no raw copy text, raw prompt text, raw PR body, raw operator note, raw source payload, secret, token, URL, or environment value."
      >
        <AutonomyKeyValues
          rows={Object.entries(preview.persisted_material_boundary).map(
            ([key, value]) => [key, value],
          )}
        />
      </AutonomySection>

      <AutonomySection
        title="validation"
        description="Validation explains whether this preview is ready for manual operator copy review."
      >
        <AutonomyKeyValues
          rows={[
            ["passed", preview.validation.passed],
            [
              "source_decision_present",
              preview.validation.source_decision_present,
            ],
            [
              "source_decision_accepted",
              preview.validation.source_decision_accepted,
            ],
            [
              "source_decision_fingerprint_verified",
              preview.validation.source_decision_fingerprint_verified,
            ],
            [
              "source_handoff_plan_binding_present",
              preview.validation.source_handoff_plan_binding_present,
            ],
            ["raw_material_absent", preview.validation.raw_material_absent],
            ["copy_packet_safe", preview.validation.copy_packet_safe],
          ]}
        />
        <AutonomyList
          itemLabel="blocker"
          items={preview.validation.blocker_reasons}
        />
        <AutonomyList
          itemLabel="warning"
          items={preview.validation.warning_reasons}
        />
      </AutonomySection>
    </WorkplanePanelShell>
  );
}
