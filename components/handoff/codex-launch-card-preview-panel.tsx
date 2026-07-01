import type { HandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

type CodexLaunchCardPreviewPanelProps = {
  preview: HandoffCapsulePreviewForWeb;
};

export function CodexLaunchCardPreviewPanel({
  preview,
}: CodexLaunchCardPreviewPanelProps) {
  const launchCard = preview.launch_card;

  return (
    <WorkplanePanelShell
      kicker="Phase 7C preview"
      title="Codex Launch Card preview"
      ariaLabel="Codex Launch Card read-only Web preview"
    >
      <p style={workplaneCopyStyle}>
        This is not Codex execution, not branch creation, not PR creation, not
        a launch action, and not copy/export. No status may mean executed.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Repo" value={launchCard.repo} />
        <WorkplanePanelMetric label="Base" value={launchCard.base_branch} />
        <WorkplanePanelMetric label="Status" value={launchCard.status} />
        <WorkplanePanelMetric
          label="Required checks"
          value={launchCard.required_checks.length}
        />
      </WorkplanePanelMetricGrid>

      <Section
        title="Task"
        description="Task goal and summary are preview context only."
        items={[
          ["task goal", launchCard.task_goal],
          ["task summary", launchCard.task_summary],
          ["expected PR title", launchCard.expected_pr_title],
          ["branch suggestion", launchCard.branch_suggestion],
        ]}
      />

      <Section
        title="Expected files"
        description="Expected files are visible for review; the preview does not authorize edits."
        items={launchCard.expected_files.map((item) => [
          "expected file",
          item,
        ])}
      />

      <Section
        title="Forbidden files"
        description="Forbidden files remain visible so a future scoped task can preserve boundaries."
        items={launchCard.forbidden_files.map((item) => [
          "forbidden file",
          item,
        ])}
      />

      <Section
        title="Required checks"
        description="Required checks must be supplied or confirmed by a future operator-scoped task."
        items={launchCard.required_checks.map((item) => [
          "required check",
          item,
        ])}
      />

      <Section
        title="Optional checks"
        description="Optional checks remain optional and must not be reported as run unless actually run."
        items={launchCard.optional_checks.map((item) => [
          "optional check",
          item,
        ])}
        emptyText="No optional checks materialized for this Launch Card preview."
      />

      <Section
        title="Skipped-check policy"
        description="Skipped-check honesty must be preserved."
        items={launchCard.skipped_check_policy.map((item) => [
          "skipped-check policy",
          item,
        ])}
      />

      <Section
        title="PR body requirements"
        description="Future PR body requirements are review preparation only."
        items={launchCard.pr_body_requirements.map((item) => [
          "PR body requirement",
          item,
        ])}
      />

      <Section
        title="Final report requirements"
        description="Future closeout requirements are visible but do not create proof/evidence writes."
        items={launchCard.final_report_requirements.map((item) => [
          "final report requirement",
          item,
        ])}
      />

      <Section
        title="Suggested for Codex"
        description="Advisory only. Suggestions are not commands."
        items={launchCard.suggestions_for_codex.map((item) => [
          item.title,
          `${item.summary} Active operator prompt required: ${item.active_operator_prompt_required}.`,
        ])}
      />

      <Section
        title="Needs user judgment"
        description="Unresolved user judgment is surfaced separately and is not decided by the Launch Card."
        items={launchCard.unresolved_user_judgment.map((item) => [
          item.urgency,
          item.question,
        ])}
        emptyText="No unresolved user judgment materialized for this Launch Card preview."
      />

      <Section
        title="Proof/evidence boundary"
        description="Validation can be reported later; this panel writes nothing."
        items={launchCard.proof_evidence_boundary.map((item) => [
          "boundary",
          item,
        ])}
      />
    </WorkplanePanelShell>
  );
}

function Section({
  title,
  description,
  items,
  emptyText = "No preview items materialized.",
}: {
  title: string;
  description: string;
  items: Array<[string, string]>;
  emptyText?: string;
}) {
  return (
    <section aria-label={`Codex Launch Card ${title}`} style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <p style={workplaneCopyStyle}>{description}</p>
      <ul style={workplaneListStyle}>
        {items.slice(0, 7).map(([label, value]) => (
          <li key={`${label}:${value}`} style={workplaneItemStyle}>
            <strong>{label}</strong>
            <span style={workplaneCopyStyle}>{value}</span>
          </li>
        ))}
        {items.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
