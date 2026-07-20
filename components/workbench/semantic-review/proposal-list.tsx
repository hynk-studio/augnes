import type { SemanticReviewProposalListItemV01 } from "./semantic-review-types";
import type { ProjectVerifyReconciliationV01 } from "@/types/vnext/project-verify-reconciliation";
import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import { ProjectVerificationWorkbench } from "./project-verification-workbench";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import styles from "./semantic-review.module.css";

export function SemanticReviewProposalList({
  proposals,
  reconciliation,
  continuity,
}: {
  proposals: SemanticReviewProposalListItemV01[];
  reconciliation: ProjectVerifyReconciliationV01;
  continuity: VNextOperatorPilotProjectContinuityV01;
}) {
  return (
    <div className={styles.workbenchSequence} data-vnext-semantic-review-list="v0.2">
      <section className={styles.panel} aria-labelledby="vnext-semantic-review-proposal-list-title">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Project review queue</p>
          <h2 id="vnext-semantic-review-proposal-list-title">
            Choose one exact semantic candidate review
          </h2>
          <p className={styles.copy}>
            {continuity.pending_proposal_count} proposal(s) await a decision and {continuity.pending_accepted_decision_count} applying decision(s) await Transition closure. Recording order does not select current state.
          </p>
        </div>

        {proposals.length === 0 ? (
          <p className={styles.empty}>
            No persisted EpisodeDeltaProposal is available. Canonical Claim candidates without a proposal remain visible in Verify material below, but no ReviewDecision is fabricated.
          </p>
        ) : (
          <ol className={styles.proposalList}>
            {proposals.map((proposal) => (
              <li
                className={styles.proposalCard}
                key={`${proposal.proposal_id}:${proposal.proposal_fingerprint}`}
              >
                <div className={styles.proposalCardBody}>
                  <div className={styles.rowBetween}>
                    <strong>{proposal.bounded_summary}</strong>
                    <span className={styles.badge}>{proposal.status}</span>
                  </div>
                  <div className={styles.metricGrid}>
                    <div><span>Candidates</span><strong>{proposal.candidate_count}</strong></div>
                    <div><span>Decisions</span><strong>{proposal.decision_count}</strong></div>
                    <div><span>Current-state read</span><strong>{proposal.current_state_status.replaceAll("_", " ")}</strong></div>
                    <div><span>Transition</span><strong>{proposal.transition_status.replaceAll("_", " ")}</strong></div>
                  </div>
                  <span className={styles.muted}>Source {proposal.source_currentness.replaceAll("_", " ")} · created {proposal.created_at}</span>
                </div>
                <div className={styles.buttonRow}>
                  <a className={styles.linkButton} href={semanticReviewProposalHref(proposal.proposal_id)}>
                    Verify and decide
                  </a>
                  <a
                    className={styles.linkButton}
                    href={createSharedInspectorHrefV01({
                      target_kind: "episode_delta_proposal",
                      record_id: proposal.proposal_id,
                      expected_fingerprint: proposal.proposal_fingerprint,
                    })}
                    data-proposal-list-to-shared-inspector="true"
                  >
                    Inspect exact lineage
                  </a>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <ProjectVerificationWorkbench
        reconciliation={reconciliation}
      />
    </div>
  );
}

function semanticReviewProposalHref(proposalId: string): string {
  return /^episode-delta-proposal:[a-f0-9]{24}$/.test(proposalId)
    ? `/workbench/semantic-review/${proposalId.replace(":", "~")}`
    : "/workbench/semantic-review";
}
