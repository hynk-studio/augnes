import type {
  CodexLaunchCardAuthorityBoundary,
  HandoffCapsuleAuthorityBoundary,
} from "@/types/handoff-capsule";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

type HandoffPreviewBoundaryCardProps = {
  capsuleAuthority: HandoffCapsuleAuthorityBoundary;
  launchCardAuthority: CodexLaunchCardAuthorityBoundary;
  boundaryNotes: string[];
};

const deniedAuthority = [
  "no handoff send",
  "no Codex execution",
  "no GitHub actuation",
  "no branch/PR creation",
  "no provider/OpenAI calls",
  "no DB write",
  "no proof/evidence writes",
  "no memory mutation",
  "no durable Perspective apply",
  "no scheduler/autonomy",
  "no external side effects",
] as const;

export function HandoffPreviewBoundaryCard({
  capsuleAuthority,
  launchCardAuthority,
  boundaryNotes,
}: HandoffPreviewBoundaryCardProps) {
  const deniedCount = [
    capsuleAuthority.can_send_handoff,
    capsuleAuthority.can_execute_codex,
    capsuleAuthority.can_call_github,
    capsuleAuthority.can_create_branch_or_pr,
    capsuleAuthority.can_call_openai_or_provider,
    capsuleAuthority.can_record_proof,
    capsuleAuthority.can_create_evidence,
    capsuleAuthority.can_mutate_memory,
    capsuleAuthority.can_apply_project_perspective,
    capsuleAuthority.can_launch_autonomy,
    launchCardAuthority.can_launch_codex,
    launchCardAuthority.can_create_ui_action,
  ].filter((value) => value === false).length;

  return (
    <WorkplanePanelShell
      kicker="Preview boundary"
      title="Authority boundary"
      ariaLabel="Handoff Capsule and Codex Launch Card authority boundary"
    >
      <p style={workplaneCopyStyle}>
        Handoff Capsule and Codex Launch Card are preview-only transfer packets.
        They prepare context for review; they do not send, launch, execute,
        post, merge, publish, or mutate state. Phase 7F permits local
        clipboard/manual copy preview only; copying is not approval, proof,
        evidence, merge authority, launch authority, or external posting.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Denied flags" value={deniedCount} />
        <WorkplanePanelMetric label="UI actions" value="0" />
        <WorkplanePanelMetric label="Status executes" value="never" />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle} aria-label="Denied authority list">
        {deniedAuthority.map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>denied</span>
            <span style={workplaneCopyStyle}>{item}</span>
          </li>
        ))}
      </ul>

      <ul style={workplaneListStyle} aria-label="Boundary notes">
        {boundaryNotes.slice(0, 8).map((note) => (
          <li key={note} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>boundary</span>
            <span style={workplaneCopyStyle}>{note}</span>
          </li>
        ))}
      </ul>
    </WorkplanePanelShell>
  );
}
