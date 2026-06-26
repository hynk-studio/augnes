"use client";

type FeedbackIntentSummary = {
  feedback_control_version?: string;
  control_kind: string;
  target_surface: string;
  target_surface_ref: string;
  target_candidate_ref: string;
  bounded_feedback_summary: string;
  reason_codes?: string[];
  advisory_only?: boolean;
  persists_feedback?: boolean;
  mutates_candidate?: boolean;
  product_write_executed?: boolean;
};

type FeedbackAggregateSummary = {
  aggregate_id: string;
  target_surface: string;
  target_surface_ref: string;
  target_candidate_ref: string;
  pin_count?: number;
  dismiss_count?: number;
  correct_count?: number;
  invalidate_count?: number;
  needs_more_evidence_count?: number;
  scope_overreach_count?: number;
  not_relevant_now_count?: number;
  mark_useful_count?: number;
  mark_wrong_count?: number;
  current_surface_priority_hint?: string;
  reason_codes?: string[];
};

type RuleFailureCandidateSummary = {
  rule_failure_candidate_id: string;
  failure_kind: string;
  target_surface: string;
  target_surface_ref: string;
  target_candidate_refs: string[];
  bounded_summary: string;
  review_status: string;
  reason_codes?: string[];
};

type AgentPerspectiveSubstrateFoldedAuditPanelProps = {
  feedbackIntents?: FeedbackIntentSummary[];
  feedbackAggregates?: FeedbackAggregateSummary[];
  ruleFailureCandidates?: RuleFailureCandidateSummary[];
  authorityBoundary?: Record<string, unknown>;
  className?: string;
};

const defaultAuthorityBoundary = {
  local_ui_intent_only: true,
  advisory_read_model_only: true,
  feedback_write_now: false,
  feedback_persistence_now: false,
  db_query_or_write_now: false,
  candidate_mutation_now: false,
  candidate_deletion_now: false,
  promotion_execution_now: false,
  rule_mutation_now: false,
  parser_mutation_now: false,
  durable_state_write_now: false,
  durable_state_apply_now: false,
  formation_receipt_write_now: false,
  proof_or_evidence_record_now: false,
  claim_or_evidence_write_now: false,
  product_write_now: false,
  product_id_allocation_now: false,
  provider_openai_call_now: false,
  prompt_sent_now: false,
  retrieval_execution_now: false,
  rag_answer_generation_now: false,
  source_fetch_now: false,
  git_ledger_export_now: false,
  codex_execution_authority: false,
  github_automation_authority: false,
  feedback_is_truth: false,
  feedback_is_proof: false,
  feedback_is_evidence: false,
  feedback_is_promotion_readiness: false,
  product_write_authority: false,
};

export function AgentPerspectiveSubstrateFoldedAuditPanel({
  feedbackIntents = [],
  feedbackAggregates = [],
  ruleFailureCandidates = [],
  authorityBoundary = defaultAuthorityBoundary,
  className,
}: AgentPerspectiveSubstrateFoldedAuditPanelProps) {
  return (
    <section
      id="agent-perspective-substrate-folded-audit-panel"
      className={className ?? "perspective-section"}
      aria-label="Agent Perspective Substrate folded audit panel"
      data-audit-panel-authority="read-only advisory no-feedback-persistence no-candidate-mutation no-product-write"
    >
      <header className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Agent Perspective Substrate</p>
          <h2>Audit panel is read-only</h2>
          <p>Aggregation is advisory only</p>
          <p>Rule failure candidates are review aids</p>
          <p>No durable state mutation</p>
          <p>Product-write remains parked</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">props-only</span>
          <span className="status-pill">local display</span>
          <span className="status-pill">no persistence</span>
        </div>
      </header>

      <div className="perspective-workbench-status-row">
        <span>No feedback write route</span>
        <span>No DB write</span>
        <span>No candidate mutation</span>
        <span>No rule mutation</span>
        <span>No parser mutation</span>
      </div>

      <section className="perspective-inspector-section">
        <h3>Feedback intent summaries</h3>
        {feedbackIntents.length > 0 ? (
          <div className="compact-list">
            {feedbackIntents.map((intent, index) => (
              <article key={`${intent.control_kind}-${intent.target_candidate_ref}-${index}`}>
                <strong>{intent.control_kind}</strong>
                <p>{intent.bounded_feedback_summary}</p>
                <small>
                  target <code>{intent.target_surface}</code> / candidate{" "}
                  <code>{intent.target_candidate_ref}</code>
                </small>
                <ReasonCodes reasonCodes={intent.reason_codes} />
              </article>
            ))}
          </div>
        ) : (
          <p>No feedback intents supplied. The panel remains read-only.</p>
        )}
      </section>

      <section className="perspective-inspector-section">
        <h3>Aggregate summaries</h3>
        {feedbackAggregates.length > 0 ? (
          <div className="compact-list">
            {feedbackAggregates.map((aggregate) => (
              <article key={aggregate.aggregate_id}>
                <strong>{aggregate.aggregate_id}</strong>
                <p>
                  priority hint{" "}
                  <code>{aggregate.current_surface_priority_hint ?? "none"}</code>
                </p>
                <small>
                  pin {aggregate.pin_count ?? 0} / dismiss{" "}
                  {aggregate.dismiss_count ?? 0} / correct{" "}
                  {aggregate.correct_count ?? 0} / invalidate{" "}
                  {aggregate.invalidate_count ?? 0} / evidence{" "}
                  {aggregate.needs_more_evidence_count ?? 0} / scope{" "}
                  {aggregate.scope_overreach_count ?? 0}
                </small>
                <ReasonCodes reasonCodes={aggregate.reason_codes} />
              </article>
            ))}
          </div>
        ) : (
          <p>No aggregate summaries supplied. Aggregation remains advisory only.</p>
        )}
      </section>

      <section className="perspective-inspector-section">
        <h3>Rule failure candidates</h3>
        {ruleFailureCandidates.length > 0 ? (
          <div className="compact-list">
            {ruleFailureCandidates.map((candidate) => (
              <article key={candidate.rule_failure_candidate_id}>
                <strong>{candidate.failure_kind}</strong>
                <p>{candidate.bounded_summary}</p>
                <small>
                  review_status <code>{candidate.review_status}</code> / target{" "}
                  <code>{candidate.target_surface_ref}</code>
                </small>
                <ReasonCodes reasonCodes={candidate.reason_codes} />
              </article>
            ))}
          </div>
        ) : (
          <p>No rule failure candidates supplied. Nothing is promoted or mutated.</p>
        )}
      </section>

      <section className="perspective-inspector-section">
        <h3>Authority boundary</h3>
        <dl className="perspective-authority-grid">
          {Object.entries(authorityBoundary)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([field, value]) => (
              <div key={field}>
                <dt>{field}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
      </section>
    </section>
  );
}

function ReasonCodes({ reasonCodes = [] }: { reasonCodes?: string[] }) {
  if (reasonCodes.length === 0) return null;
  return (
    <p>
      reason_codes{" "}
      <code>{[...new Set(reasonCodes)].sort().join(", ")}</code>
    </p>
  );
}
