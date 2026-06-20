"use client";

import { PromotionReadinessGateExplanations } from "@/components/research-candidate-promotion-readiness-gate-explanations";
import { ReadinessCopyPacketPanel } from "@/components/research-candidate-readiness-copy-packet-panel";
import type {
  ManualNotePreviewDraftActivityResponse,
  ManualNotePreviewDraftDetailOkResponse,
  ManualNotePreviewDraftPromotionReadinessGateResult,
  ManualNotePreviewDraftPromotionReadinessResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

const PROMOTION_READINESS_STATUS_LABELS = {
  blocked: "Blocked",
  needs_operator_review: "Needs operator review",
  ready_for_promotion_discussion: "Ready for promotion discussion",
} as const;

type PromotionReadinessPreflightReadoutProps = {
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse | null;
  preflightResult: ManualNotePreviewDraftPromotionReadinessResponse | null;
  activityResult: ManualNotePreviewDraftActivityResponse | null;
  isLoadingDraftId: string | null;
  error: string | null;
  onLoad: (previewDraftId: string) => void;
};

export function PromotionReadinessPreflightReadout({
  storedDraftResult,
  preflightResult,
  activityResult,
  isLoadingDraftId,
  error,
  onLoad,
}: PromotionReadinessPreflightReadoutProps) {
  if (!storedDraftResult) return null;

  const previewDraftId = storedDraftResult.draft.preview_draft_id;
  const isLoading = isLoadingDraftId === previewDraftId;
  const isCurrentPreflight =
    preflightResult?.ok === true &&
    preflightResult.preview_draft_id === previewDraftId;
  const gateGroups = isCurrentPreflight
    ? groupPromotionReadinessGates(preflightResult.gate_results)
    : { block: [], warn: [], pass: [] };

  return (
    <section
      className="perspective-inspector-section manual-note-promotion-readiness"
      aria-label="Promotion readiness preflight"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h3>Promotion readiness preflight</h3>
          <p>
            This is a read-only preflight. It does not promote, reject, defer,
            approve, write proof/evidence, create work items, or update
            Perspective state.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => onLoad(previewDraftId)}
        >
          {isLoading
            ? "Running preflight..."
            : isCurrentPreflight
              ? "Refresh preflight"
              : "Run preflight"}
        </button>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>
          This is a read-only preflight. It does not promote, reject, defer,
          approve, write proof/evidence, create work items, or update
          Perspective state.
        </li>
        <li>Ready for promotion discussion is not promotion authority.</li>
        <li>
          No source URLs are fetched, no retrieval is run, and no external
          handoff is sent.
        </li>
      </ul>
      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}
      {isCurrentPreflight ? (
        <>
          <div className="manual-note-promotion-readiness-status">
            <span>
              readiness_status{" "}
              <strong>
                {
                  PROMOTION_READINESS_STATUS_LABELS[
                    preflightResult.readiness_status
                  ]
                }
              </strong>
            </span>
            <span>
              readiness_score <strong>{preflightResult.readiness_score}</strong>
            </span>
            <span>
              lifecycle_status <strong>{preflightResult.lifecycle_status}</strong>
            </span>
          </div>

          <PromotionReadinessTextList
            title="Blockers"
            items={preflightResult.blockers}
            emptyText="No block gates returned by the preflight."
          />
          <PromotionReadinessTextList
            title="Warnings"
            items={preflightResult.warnings}
            emptyText="No warning gates returned by the preflight."
          />
          <PromotionReadinessTextList
            title="Next review steps"
            items={preflightResult.next_review_steps}
            emptyText="No next review steps returned by the preflight."
          />

          <div className="manual-note-promotion-readiness-summary-grid">
            <div>
              <h4>Source summary</h4>
              <span>
                source_ref_count{" "}
                <code>{preflightResult.source_summary.source_ref_count}</code>
              </span>
              <span>
                source_titles{" "}
                <code>
                  {formatList(preflightResult.source_summary.source_titles)}
                </code>
              </span>
              <span>
                source_identifiers{" "}
                <code>
                  {formatList(preflightResult.source_summary.source_identifiers)}
                </code>
              </span>
              <span>
                source_statuses{" "}
                <code>
                  {formatList(preflightResult.source_summary.source_statuses)}
                </code>
              </span>
              <span>
                source_boundary_notes{" "}
                <code>
                  {formatList(
                    preflightResult.source_summary.source_boundary_notes,
                  )}
                </code>
              </span>
            </div>
            <div>
              <h4>Candidate summary</h4>
              <span>
                total <code>{preflightResult.candidate_summary.total}</code>
              </span>
              <span>
                claims <code>{preflightResult.candidate_summary.claims}</code>
              </span>
              <span>
                evidence{" "}
                <code>{preflightResult.candidate_summary.evidence}</code>
              </span>
              <span>
                tensions{" "}
                <code>{preflightResult.candidate_summary.tensions}</code>
              </span>
              <span>
                knowledge_gaps{" "}
                <code>{preflightResult.candidate_summary.knowledge_gaps}</code>
              </span>
              <span>
                perspective_deltas{" "}
                <code>
                  {preflightResult.candidate_summary.perspective_deltas}
                </code>
              </span>
              <span>
                follow_up_work{" "}
                <code>{preflightResult.candidate_summary.follow_up_work}</code>
              </span>
            </div>
            <div>
              <h4>Lifecycle summary</h4>
              <span>
                label_state{" "}
                <code>{preflightResult.lifecycle_summary.label_state}</code>
              </span>
              <span>
                discard_state{" "}
                <code>{preflightResult.lifecycle_summary.discard_state}</code>
              </span>
              <span>
                activity_count{" "}
                <code>{preflightResult.lifecycle_summary.activity_count}</code>
              </span>
              <span>
                last_activity_type{" "}
                <code>
                  {preflightResult.lifecycle_summary.last_activity_type ??
                    "none recorded"}
                </code>
              </span>
              <span>
                last_activity_at{" "}
                <code>
                  {preflightResult.lifecycle_summary.last_activity_at ??
                    "none recorded"}
                </code>
              </span>
            </div>
          </div>

          <PromotionReadinessGateExplanations
            focusGates={[...gateGroups.block, ...gateGroups.warn]}
            passGates={gateGroups.pass}
          />

          <ReadinessCopyPacketPanel
            storedDraftResult={storedDraftResult}
            preflightResult={preflightResult}
            activityResult={activityResult}
            isPreflightRefreshing={isLoading}
          />

          <PromotionReadinessGateGroup
            title="Block gates"
            gates={gateGroups.block}
          />
          <PromotionReadinessGateGroup
            title="Warning gates"
            gates={gateGroups.warn}
          />
          <PromotionReadinessGateGroup
            title="Pass gates"
            gates={gateGroups.pass}
          />

          <div className="perspective-workbench-status-row">
            {Object.entries(preflightResult.runtime_boundary).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
            {Object.entries(preflightResult.no_side_effects).map(
              ([key, value]) => (
                <span key={key}>
                  {key} <code>{String(value)}</code>
                </span>
              ),
            )}
          </div>
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          Run preflight to inspect read-only promotion discussion readiness for
          this stored preview draft. No promotion, proof/evidence write, work
          item, retrieval, or Perspective update is created.
        </p>
      )}
    </section>
  );
}

function PromotionReadinessTextList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="manual-note-promotion-readiness-list">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PromotionReadinessGateGroup({
  title,
  gates,
}: {
  title: string;
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[];
}) {
  return (
    <div className="manual-note-promotion-readiness-gates">
      <h4>{title}</h4>
      {gates.length === 0 ? (
        <p className="manual-note-runtime-hint">No gates in this group.</p>
      ) : (
        <div className="manual-note-promotion-readiness-gate-list">
          {gates.map((gate) => (
            <article
              key={gate.gate_id}
              className={`cockpit-surface-card manual-note-promotion-readiness-gate manual-note-promotion-readiness-gate-${gate.status}`}
            >
              <div className="manual-note-preview-draft-title-row">
                <div>
                  <strong>{gate.label}</strong>
                  <small>{gate.gate_id}</small>
                </div>
                <span className="status-pill">{gate.status}</span>
              </div>
              <p>{gate.summary}</p>
              <p className="manual-note-runtime-hint">{gate.detail}</p>
              <div className="manual-note-preview-draft-badges">
                {gate.evidence_fields.map((field) => (
                  <span key={field}>{field}</span>
                ))}
                <span>no_side_effects {String(gate.no_side_effects)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function groupPromotionReadinessGates(
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[],
) {
  return {
    block: gates.filter((gate) => gate.status === "block"),
    warn: gates.filter((gate) => gate.status === "warn"),
    pass: gates.filter((gate) => gate.status === "pass"),
  };
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
