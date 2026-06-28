"use client";

import { useMemo, useState } from "react";
import type {
  FeedbackInfluencedSurfacingPreviewRuntimeCompletionResultV01,
  FeedbackInfluencedSurfacingItem,
  FeedbackInfluencedSurfacingResult,
} from "@/lib/research-candidate-review/feedback-influenced-surfacing-preview";

export type FeedbackInfluencedSurfacingPreviewPanelProps = {
  result: FeedbackInfluencedSurfacingResult;
  runtimeCompletionResult?: FeedbackInfluencedSurfacingPreviewRuntimeCompletionResultV01;
  selectedCandidateRef?: string;
  onSelectedCandidateRefChange?: (candidateRef: string) => void;
  className?: string;
};

const warningLabels: Array<{
  key: keyof Pick<
    FeedbackInfluencedSurfacingItem,
    | "correction_warning_hint"
    | "invalidation_warning_hint"
    | "needs_more_evidence_hint"
    | "scope_overreach_hint"
    | "stale_context_hint"
    | "rule_failure_hint"
  >;
  label: string;
}> = [
  { key: "correction_warning_hint", label: "Correction warning" },
  { key: "invalidation_warning_hint", label: "Invalidation warning" },
  { key: "needs_more_evidence_hint", label: "Needs more evidence" },
  { key: "scope_overreach_hint", label: "Scope overreach" },
  { key: "stale_context_hint", label: "Stale context" },
  { key: "rule_failure_hint", label: "Rule failure review aid" },
];

export function FeedbackInfluencedSurfacingPreviewPanel({
  result,
  runtimeCompletionResult,
  selectedCandidateRef,
  onSelectedCandidateRefChange,
  className,
}: FeedbackInfluencedSurfacingPreviewPanelProps) {
  const [localSelectedCandidateRef, setLocalSelectedCandidateRef] = useState<string | undefined>(
    result.items[0]?.candidate_ref,
  );
  const activeCandidateRef = selectedCandidateRef ?? localSelectedCandidateRef;

  const selectedItem = useMemo(() => {
    return (
      result.items.find((item) => item.candidate_ref === activeCandidateRef) ??
      result.items[0]
    );
  }, [activeCandidateRef, result.items]);

  function handleCandidateSelection(candidateRef: string) {
    setLocalSelectedCandidateRef(candidateRef);
    onSelectedCandidateRefChange?.(candidateRef);
  }

  return (
    <section
      className={className ?? "perspective-inspector-section"}
      aria-label="Feedback influenced surfacing preview"
      data-feedback-influenced-surfacing-preview="preview-only advisory-only no-candidate-deletion no-product-write"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Feedback Influenced Surfacing Preview</p>
          <h3>Feedback influenced surfacing is preview-only</h3>
          <p>Advisory display hints only</p>
          <p>No candidate is deleted</p>
          <p>No candidate is promoted</p>
          <p>No durable state mutation</p>
          <p>Product-write remains parked</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{result.status}</span>
          <span className="status-pill">props-only</span>
          <span className="status-pill">read-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>Preview items {result.items.length}</span>
        {runtimeCompletionResult ? (
          <span>DB-backed preview {runtimeCompletionResult.status}</span>
        ) : null}
        <span>No candidate mutation</span>
        <span>No rule mutation</span>
        <span>No parser mutation</span>
        <span>No product write</span>
      </div>

      {result.items.length === 0 ? (
        <section className="perspective-inspector-section">
          <h4>Bounded empty state</h4>
          <p>No preview items supplied. Surfacing preview remains advisory only.</p>
          <Warnings warnings={result.warnings} />
        </section>
      ) : (
        <>
          <label className="feedback-control-note">
            <span>Selected preview item</span>
            <select
              value={selectedItem?.candidate_ref ?? ""}
              onChange={(event) => handleCandidateSelection(event.currentTarget.value)}
              aria-label="Selected feedback influenced surfacing candidate"
            >
              {result.items.map((item) => (
                <option key={item.item_id} value={item.candidate_ref}>
                  {item.bounded_title}
                </option>
              ))}
            </select>
          </label>

          <section className="perspective-inspector-section">
            <h4>Preview items</h4>
            <div className="compact-list">
              {result.items.map((item) => (
                <article
                  key={item.item_id}
                  data-selected={item.candidate_ref === selectedItem?.candidate_ref}
                >
                  <strong>{item.bounded_title}</strong>
                  <p>{item.bounded_summary}</p>
                  <small>
                    target <code>{item.target_surface}</code> / candidate{" "}
                    <code>{item.candidate_ref}</code>
                  </small>
                  <div className="perspective-workbench-status-row">
                    <span>
                      priority <code>{item.surface_priority_preview}</code>
                    </span>
                    <span>
                      visibility <code>{item.visibility_hint}</code>
                    </span>
                    <span>
                      review <code>{item.review_attention_hint}</code>
                    </span>
                    <span>
                      overlay <code>{item.candidate_overlay_hint}</code>
                    </span>
                  </div>
                  <ItemWarnings item={item} />
                  <ReasonCodes reasonCodes={item.reason_codes} />
                </article>
              ))}
            </div>
          </section>

          {selectedItem ? (
            <section className="perspective-inspector-section">
              <h4>Selected advisory hints</h4>
              <dl className="perspective-authority-grid">
                <div>
                  <dt>surface_priority_preview</dt>
                  <dd>{selectedItem.surface_priority_preview}</dd>
                </div>
                <div>
                  <dt>visibility_hint</dt>
                  <dd>{selectedItem.visibility_hint}</dd>
                </div>
                <div>
                  <dt>review_attention_hint</dt>
                  <dd>{selectedItem.review_attention_hint}</dd>
                </div>
                <div>
                  <dt>rule_failure_hint</dt>
                  <dd>{String(selectedItem.rule_failure_hint)}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </>
      )}

      {runtimeCompletionResult ? (
        <section className="perspective-inspector-section">
          <h4>DB-backed aggregation surfacing preview</h4>
          <p>Advisory surfacing preview only</p>
          <p>Priority hint is not ranking mutation</p>
          <p>Surfacing preview is not surfacing mutation</p>
          <p>Invalidate is not source suppression</p>
          <p>Dismiss is not delete</p>
          <p>Pin is not promotion</p>
          <div className="perspective-workbench-status-row">
            <span>status {runtimeCompletionResult.status}</span>
            <span>aggregation {runtimeCompletionResult.aggregation_status}</span>
            <span>items {runtimeCompletionResult.surfaced_items.length}</span>
          </div>
          <div className="compact-list">
            {runtimeCompletionResult.surfaced_items.map((item) => (
              <article key={item.surfaced_item_ref}>
                <strong>{item.target_ref}</strong>
                <p>
                  bucket <code>{item.preview_rank_bucket}</code> / priority{" "}
                  <code>{item.current_surface_priority_hint}</code>
                </p>
                <p>
                  target <code>{item.target_layer}</code> / source visibility preserved{" "}
                  <code>{String(item.source_visibility_preserved)}</code>
                </p>
                <ReasonCodes reasonCodes={item.reason_codes} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="perspective-inspector-section">
        <h4>Authority boundary</h4>
        <dl className="perspective-authority-grid">
          {Object.entries(result.authority_boundary)
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

function ItemWarnings({ item }: { item: FeedbackInfluencedSurfacingItem }) {
  const activeWarnings = warningLabels.filter(({ key }) => item[key]);
  if (activeWarnings.length === 0) {
    return <p>No warning labels for this preview item.</p>;
  }
  return (
    <div className="perspective-workbench-status-row" aria-label="Warning labels">
      {activeWarnings.map(({ key, label }) => (
        <span key={key}>{label}</span>
      ))}
    </div>
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="compact-list">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

function ReasonCodes({ reasonCodes }: { reasonCodes: string[] }) {
  if (reasonCodes.length === 0) return null;
  return (
    <p>
      reason_codes <code>{[...new Set(reasonCodes)].sort().join(", ")}</code>
    </p>
  );
}
