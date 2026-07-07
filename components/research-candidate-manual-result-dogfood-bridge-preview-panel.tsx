"use client";

import { buildResearchCandidateManualResultDogfoodBridgePreview } from "@/lib/research-candidate-review/manual-result-dogfood-bridge-preview";
import type {
  ResearchCandidateManualResultReadback,
} from "@/types/research-candidate-manual-result-authorized-record-write";
import type {
  ResearchCandidateManualResultDogfoodBridgeCard,
  ResearchCandidateManualResultDogfoodBridgeOutcomeLabel,
} from "@/types/research-candidate-manual-result-dogfood-bridge-preview";

const outcomeLabels: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel[] = [
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
  "not_reported",
];

export function ResearchCandidateManualResultDogfoodBridgePreviewPanel({
  readback,
}: {
  readback: ResearchCandidateManualResultReadback;
}) {
  const preview = buildResearchCandidateManualResultDogfoodBridgePreview({
    readback,
    limit: 25,
    operator_view: "research_candidate_review_manual_result_readback_panel",
  });

  return (
    <section
      className="perspective-inspector-section manual-note-authorized-record-readback manual-result-dogfood-bridge-preview"
      aria-label="Manual Research Candidate result dogfood bridge alignment preview"
      data-augnes-authority="read-only preview-only no-global-dogfood no-perspective no-proof no-work no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Dogfood Bridge Alignment</p>
          <h3>Manual result dogfood bridge preview</h3>
          <p>
            This preview does not write global dogfood ledger records, dogfood
            metrics, Perspective, proof/evidence, work status, or memory.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{preview.dogfood_bridge_readiness}</span>
          <span className="status-pill">read-only</span>
          <span className="status-pill">preview-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          latest_committed_receipt{" "}
          <code>{preview.latest_committed_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_readback_ref <code>{preview.source_readback_ref}</code>
        </span>
        <span>
          preview_fingerprint{" "}
          <code>{preview.validation.preview_fingerprint}</code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>receipts</span>
          <strong>{preview.receipt_status_summary.total_receipts}</strong>
          <small>
            committed {preview.receipt_status_summary.committed_count};
            superseded {preview.receipt_status_summary.superseded_count};
            rolled_back {preview.receipt_status_summary.rolled_back_count}
          </small>
        </div>
        <div>
          <span>ExpectedObservedDelta</span>
          <strong>
            {
              preview.expected_observed_delta_alignment
                .total_manual_expected_observed_delta_records
            }
          </strong>
          <small>
            observed_present{" "}
            {String(
              preview.expected_observed_delta_alignment.observed_summary_present,
            )}
          </small>
        </div>
        <div>
          <span>Reuse Outcome</span>
          <strong>
            {preview.reuse_outcome_alignment.total_manual_reuse_outcome_records}
          </strong>
          <small>
            source_line_present{" "}
            {String(preview.reuse_outcome_alignment.source_line_present)}
          </small>
        </div>
        <div>
          <span>bridge cards</span>
          <strong>{preview.candidate_bridge_cards.length}</strong>
          <small>{preview.validation.fingerprint_algorithm}</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="cockpit-surface-card">
          <h4>ExpectedObservedDelta alignment</h4>
          <dl>
            <dt>latest_expected_summary</dt>
            <dd>
              {preview.expected_observed_delta_alignment
                .latest_expected_summary ?? "not available"}
            </dd>
            <dt>latest_observed_summary</dt>
            <dd>
              {preview.expected_observed_delta_alignment
                .latest_observed_summary ?? "not available"}
            </dd>
            <dt>latest_mismatch_or_gap_summary</dt>
            <dd>
              {preview.expected_observed_delta_alignment
                .latest_mismatch_or_gap_summary ?? "not available"}
            </dd>
            <dt>handoff_seed_fingerprint_present</dt>
            <dd>
              {String(
                preview.expected_observed_delta_alignment
                  .source_handoff_seed_fingerprint_present,
              )}
            </dd>
            <dt>result_text_fingerprint_present</dt>
            <dd>
              {String(
                preview.expected_observed_delta_alignment
                  .source_result_text_fingerprint_present,
              )}
            </dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Reuse Outcome alignment</h4>
          <dl>
            <dt>latest_outcome_label</dt>
            <dd>{preview.reuse_outcome_alignment.latest_outcome_label}</dd>
            <dt>selected_candidate_context_ref_count</dt>
            <dd>
              {
                preview.reuse_outcome_alignment
                  .selected_candidate_context_ref_count
              }
            </dd>
            <dt>total_selected_candidate_context_ref_count</dt>
            <dd>
              {
                preview.reuse_outcome_alignment
                  .total_selected_candidate_context_ref_count
              }
            </dd>
            <dt>can_become_bridge_candidate</dt>
            <dd>
              {String(
                preview.reuse_outcome_alignment
                  .can_become_broader_reuse_outcome_bridge_candidate,
              )}
            </dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Outcome label counts</h4>
          <dl>
            {outcomeLabels.map((label) => (
              <ReactFragmentRow
                key={label}
                label={label}
                value={String(preview.reuse_outcome_alignment.outcome_label_counts[label])}
              />
            ))}
          </dl>
        </section>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <ReasonList title="Blocked reasons" reasons={preview.blocked_reasons} />
        <ReasonList title="Warning reasons" reasons={preview.warning_reasons} />
        <ReasonList
          title="Required future authorization"
          reasons={preview.required_future_authorization}
        />
      </div>

      <section className="cockpit-surface-card">
        <h4>Candidate bridge cards</h4>
        <div className="perspective-detail-stack">
          {preview.candidate_bridge_cards.length > 0 ? (
            preview.candidate_bridge_cards.map((card) => (
              <CandidateBridgeCard key={card.card_id} card={card} />
            ))
          ) : (
            <p>No candidate bridge cards are available yet.</p>
          )}
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h4>Authority boundary</h4>
        <div className="perspective-workbench-status-row">
          <span>
            writes_global_dogfood_ledger{" "}
            <code>
              {String(preview.authority_boundary.writes_global_dogfood_ledger)}
            </code>
          </span>
          <span>
            writes_dogfood_metrics{" "}
            <code>{String(preview.authority_boundary.writes_dogfood_metrics)}</code>
          </span>
          <span>
            writes_expected_observed_delta_global_record{" "}
            <code>
              {String(
                preview.authority_boundary
                  .writes_expected_observed_delta_global_record,
              )}
            </code>
          </span>
          <span>
            writes_reuse_outcome_global_record{" "}
            <code>
              {String(
                preview.authority_boundary.writes_reuse_outcome_global_record,
              )}
            </code>
          </span>
          <span>
            writes_perspective{" "}
            <code>{String(preview.authority_boundary.writes_perspective)}</code>
          </span>
          <span>
            writes_perspective_memory{" "}
            <code>
              {String(preview.authority_boundary.writes_perspective_memory)}
            </code>
          </span>
          <span>
            writes_proof_or_evidence{" "}
            <code>
              {String(preview.authority_boundary.writes_proof_or_evidence)}
            </code>
          </span>
          <span>
            mutates_work{" "}
            <code>{String(preview.authority_boundary.mutates_work)}</code>
          </span>
          <span>
            can_call_provider_or_openai{" "}
            <code>
              {String(preview.authority_boundary.can_call_provider_or_openai)}
            </code>
          </span>
          <span>
            can_call_github{" "}
            <code>{String(preview.authority_boundary.can_call_github)}</code>
          </span>
          <span>
            can_execute_codex{" "}
            <code>{String(preview.authority_boundary.can_execute_codex)}</code>
          </span>
          <span>
            can_fetch_sources{" "}
            <code>{String(preview.authority_boundary.can_fetch_sources)}</code>
          </span>
          <span>
            can_run_retrieval_rag_embeddings_vector_fts_or_crawler{" "}
            <code>
              {String(
                preview.authority_boundary
                  .can_run_retrieval_rag_embeddings_vector_fts_or_crawler,
              )}
            </code>
          </span>
        </div>
      </section>

      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{preview.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function ReactFragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <section className="cockpit-surface-card">
      <h4>{title}</h4>
      <ul>
        {(reasons.length > 0 ? reasons : ["none"]).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}

function CandidateBridgeCard({
  card,
}: {
  card: ResearchCandidateManualResultDogfoodBridgeCard;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>{card.card_kind}</h5>
      <div className="perspective-workbench-status-row">
        <span>
          card_status <code>{card.card_status}</code>
        </span>
        <span>
          receipt_status <code>{card.receipt_status}</code>
        </span>
        <span>
          writes_ledger <code>{String(card.writes_ledger)}</code>
        </span>
      </div>
      <dl>
        <dt>receipt_id</dt>
        <dd>{card.receipt_id}</dd>
        <dt>record_id</dt>
        <dd>{card.record_id ?? "receipt context only"}</dd>
        <dt>summary</dt>
        <dd>{card.summary}</dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{card.source_handoff_seed_fingerprint ?? "not present"}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{card.source_result_text_fingerprint ?? "not present"}</dd>
        <dt>selected_candidate_context_refs</dt>
        <dd>{card.selected_candidate_context_refs.length}</dd>
        <dt>blockers</dt>
        <dd>{card.blockers.length > 0 ? card.blockers.join(", ") : "none"}</dd>
        <dt>warnings</dt>
        <dd>
          {card.warning_reasons.length > 0
            ? card.warning_reasons.join(", ")
            : "none"}
        </dd>
      </dl>
    </section>
  );
}
