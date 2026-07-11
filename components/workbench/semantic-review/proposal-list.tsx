import type {
  SemanticReviewProjectV01,
  SemanticReviewProposalListItemV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function SemanticReviewProposalList({
  project,
  proposals,
}: {
  project: SemanticReviewProjectV01;
  proposals: SemanticReviewProposalListItemV01[];
}) {
  return (
    <section
      className={styles.panel}
      aria-labelledby="vnext-semantic-review-proposal-list-title"
      data-vnext-semantic-review-list="v0.1"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Episode delta proposals</p>
        <h2 id="vnext-semantic-review-proposal-list-title">
          Review project-semantic change candidates
        </h2>
        <p className={styles.copy}>
          Workspace {project.workspace_id}; project {project.project_id}. A proposal is
          review material, not canonical project state, a decision, or an applied
          transition.
        </p>
      </div>

      {proposals.length === 0 ? (
        <p className={styles.empty}>
          No persisted EpisodeDeltaProposal records are available for this configured
          project. No proposal was fabricated by this surface.
        </p>
      ) : (
        <ol className={styles.proposalList}>
          {proposals.map((proposal) => (
            <li
              className={styles.proposalCard}
              data-vnext-proposal-id={proposal.proposal_id}
              key={`${proposal.proposal_id}:${proposal.proposal_fingerprint}`}
            >
              <div className={styles.proposalCardBody}>
                <div className={styles.rowBetween}>
                  <strong>{proposal.bounded_summary}</strong>
                  <span className={styles.badge}>{proposal.status}</span>
                </div>
                <span className={styles.identifier}>{proposal.proposal_id}</span>
                <span className={styles.identifier}>{proposal.proposal_fingerprint}</span>
                <div className={styles.metricGrid}>
                  <div>
                    <span>Candidates</span>
                    <strong>{proposal.candidate_count}</strong>
                  </div>
                  <div>
                    <span>Decisions</span>
                    <strong>{proposal.decision_count}</strong>
                  </div>
                  <div>
                    <span>Current state</span>
                    <strong>{proposal.current_state_status}</strong>
                  </div>
                  <div>
                    <span>Transition</span>
                    <strong>{proposal.transition_status}</strong>
                  </div>
                </div>
                <span className={styles.muted}>
                  Source currentness {proposal.source_currentness}. Open the proposal
                  for exact coverage, basis, and review-required status.
                </span>
                <span className={styles.muted}>Created {proposal.created_at}</span>
              </div>
              <a
                className={styles.linkButton}
                href={`/workbench/semantic-review/${encodeURIComponent(
                  proposal.proposal_id,
                )}`}
              >
                Review proposal
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
