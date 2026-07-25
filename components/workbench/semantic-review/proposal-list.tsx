import type { ProjectVerifyReconciliationV01 } from "@/types/vnext/project-verify-reconciliation";
import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { AIWorkplaneHomeViewV01 } from "@/types/vnext/ai-workplane";
import type { AIWorkplaneQueueItemStatusV01 } from "@/types/vnext/ai-workplane";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";

import { ProjectVerificationWorkbench } from "./project-verification-workbench";
import type { SemanticReviewProposalListItemV01 } from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function SemanticReviewProposalList({
  proposals,
  reconciliation,
  continuity,
  view,
  showCurrentFocus = true,
}: {
  proposals: SemanticReviewProposalListItemV01[];
  reconciliation: ProjectVerifyReconciliationV01;
  continuity: VNextOperatorPilotProjectContinuityV01;
  view: AIWorkplaneHomeViewV01;
  showCurrentFocus?: boolean;
}) {
  return (
    <div
      className={styles.workbenchSequence}
      data-vnext-semantic-review-list="v0.2"
      data-ai-workplane-home="v0.1"
      data-ai-workplane-home-state={view.state}
      data-ai-workplane-presentation={view.presentation_version}
      data-ai-workplane-semantic-authority="false"
    >
      {showCurrentFocus ? (
        <section
          className={`${styles.panel} ${styles.workplaneFocus}`}
          aria-labelledby="ai-workplane-current-focus-title"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
        >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Current work</p>
          <h2 id="ai-workplane-current-focus-title">{view.heading}</h2>
          <p className={styles.copy}>{view.situation}</p>
        </div>
        {view.project_name || view.goal ? (
          <div className={styles.workplaneCoordinate}>
            {view.project_name ? (
              <p><span>Current project</span><strong>{view.project_name}</strong></p>
            ) : null}
            {view.goal ? (
              <p><span>Current goal</span><strong>{view.goal}</strong></p>
            ) : null}
          </div>
        ) : null}
        {view.material_note ? (
          <p className={styles.notice}>{view.material_note}</p>
        ) : null}
        {view.primary_action?.href ? (
          <div className={styles.buttonRow}>
            <a
              className={styles.button}
              href={view.primary_action.href}
              data-ai-workplane-primary-action={view.primary_action.kind}
              data-augnes-primary-action={view.primary_action.kind}
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
            >
              {view.primary_action.label}
            </a>
          </div>
        ) : null}
        </section>
      ) : null}

      {view.focused_item ? (
        <section
          className={styles.panel}
          aria-labelledby="ai-workplane-decision-title"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.aiSummary}
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>
              {focusedItemHeading(view.focused_item.status)}
            </p>
            <h2 id="ai-workplane-decision-title">{view.focused_item.title}</h2>
          </div>
          <p className={styles.copy}>{view.focused_item.reason}</p>
          <p className={styles.humanStatus}>{view.focused_item.status_label}</p>
        </section>
      ) : null}

      {view.additional_items.length > 0 ? (
        <section
          className={styles.panel}
          aria-labelledby="ai-workplane-other-review-title"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Other work to review</p>
            <h2 id="ai-workplane-other-review-title">More suggested changes</h2>
          </div>
          <ol className={styles.proposalList}>
            {view.additional_items.map((item) => (
              <li className={styles.proposalCard} key={item.proposal_id}>
                <div className={styles.proposalCardBody}>
                  <div className={styles.rowBetween}>
                    <strong>{item.title}</strong>
                    <span
                      className={styles.badge}
                      data-augnes-state-badge="proposal-status"
                    >
                      {item.status_label}
                    </span>
                  </div>
                  <p className={styles.muted}>{item.reason}</p>
                </div>
                <div className={styles.buttonRow}>
                  <a className={styles.linkButton} href={item.href}>
                    Continue review
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : proposals.length === 0 && view.state === "no_current_decision" ? (
        <section
          className={styles.panel}
          aria-labelledby="ai-workplane-empty-title"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Results and recent outcomes</p>
            <h2 id="ai-workplane-empty-title">Nothing else is waiting for review</h2>
          </div>
          <p className={styles.copy}>
            No suggested project change currently needs a decision.
          </p>
        </section>
      ) : null}

      <details
        className={styles.advancedDisclosure}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
      >
        <summary>Advanced verification</summary>
        <p className={styles.muted}>
          Exact supporting, conflicting, missing, and source-history detail is
          available here for technical review. It is not required for the normal path.
        </p>
        <ProjectVerificationWorkbench reconciliation={reconciliation} />
        <p className={styles.muted}>
          Pending review {continuity.pending_proposal_count} · saved applying decisions {continuity.pending_accepted_decision_count}
        </p>
      </details>
    </div>
  );
}

function focusedItemHeading(
  status: AIWorkplaneQueueItemStatusV01,
): string {
  return status === "needs_decision"
    ? "Needs your decision"
    : status === "ready_to_complete"
      ? "Ready to complete"
      : status === "project_updated"
        ? "Project updated"
        : status === "deferred"
          ? "Review later"
          : status === "rejected"
            ? "Rejected"
            : status === "needs_more_information"
              ? "Needs more information"
              : "Continue review";
}
