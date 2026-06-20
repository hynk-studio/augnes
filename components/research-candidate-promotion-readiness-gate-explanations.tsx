"use client";

import type { ManualNotePreviewDraftPromotionReadinessGateResult } from "@/lib/research-candidate-review/manual-note-runtime-preview";

type PromotionReadinessGateExplanationsProps = {
  focusGates: ManualNotePreviewDraftPromotionReadinessGateResult[];
  passGates: ManualNotePreviewDraftPromotionReadinessGateResult[];
};

export function PromotionReadinessGateExplanations({
  focusGates,
  passGates,
}: PromotionReadinessGateExplanationsProps) {
  const currentLaneGates = focusGates.filter(
    (gate) =>
      gate.gate_explanation.can_be_resolved_in_current_preview_lane === true,
  );
  const separateLaneGates = focusGates.filter(
    (gate) =>
      gate.gate_explanation.can_be_resolved_in_current_preview_lane === false,
  );

  return (
    <section
      className="manual-note-gate-explanations"
      aria-label="Gate explanations"
    >
      <div>
        <h4>Gate explanations</h4>
        <p>
          Gate explanations are operator guidance only. Suggested actions use
          existing preview-only surfaces or require a separate future lane.
        </p>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>No explanation here grants promotion authority.</li>
        <li>
          No proof/evidence, Perspective, work item, provider, retrieval,
          source-fetch, Codex, or handoff action is run.
        </li>
      </ul>
      <div className="manual-note-gate-resolution-summary">
        <span>
          Resolvable in this preview lane{" "}
          <strong>{currentLaneGates.length}</strong>
        </span>
        <span>
          Requires separate future lane or stop/inspect{" "}
          <strong>{separateLaneGates.length}</strong>
        </span>
      </div>
      {focusGates.length === 0 ? (
        <p className="manual-note-runtime-hint">
          No block or warning gates need operator explanation. Pass gate
          explanations remain available for audit.
        </p>
      ) : (
        <div className="manual-note-gate-explanation-list">
          {focusGates.map((gate) => (
            <PromotionReadinessGateExplanationCard
              key={gate.gate_id}
              gate={gate}
            />
          ))}
        </div>
      )}
      <details className="manual-note-gate-pass-explanations">
        <summary>Show pass gate explanations ({passGates.length})</summary>
        {passGates.length === 0 ? (
          <p className="manual-note-runtime-hint">
            No pass gates were returned by the preflight.
          </p>
        ) : (
          <div className="manual-note-gate-explanation-list">
            {passGates.map((gate) => (
              <PromotionReadinessGateExplanationCard
                key={gate.gate_id}
                gate={gate}
              />
            ))}
          </div>
        )}
      </details>
    </section>
  );
}

function PromotionReadinessGateExplanationCard({
  gate,
}: {
  gate: ManualNotePreviewDraftPromotionReadinessGateResult;
}) {
  const explanation = gate.gate_explanation;

  return (
    <article
      className={`cockpit-surface-card manual-note-gate-explanation manual-note-promotion-readiness-gate-${gate.status}`}
    >
      <div className="manual-note-preview-draft-title-row">
        <div>
          <strong>{explanation.explanation_title}</strong>
          <small>
            {gate.label} · {gate.gate_id}
          </small>
        </div>
        <span className="status-pill">{gate.status}</span>
      </div>
      <dl className="manual-note-gate-explanation-grid">
        <div>
          <dt>Operator explanation</dt>
          <dd>{explanation.operator_explanation}</dd>
        </div>
        <div>
          <dt>Why it matters</dt>
          <dd>{explanation.why_it_matters}</dd>
        </div>
        <div>
          <dt>Current signal</dt>
          <dd>{explanation.current_signal}</dd>
        </div>
        <div>
          <dt>Can be resolved in this preview lane</dt>
          <dd>
            {String(explanation.can_be_resolved_in_current_preview_lane)}
          </dd>
        </div>
      </dl>
      <div className="manual-note-gate-explanation-columns">
        <div>
          <h5>Suggested safe actions</h5>
          <ul>
            {explanation.suggested_safe_actions.map((action) => (
              <li
                key={`${gate.gate_id}-${action.action_scope}-${action.safe_action}`}
              >
                <span>{action.safe_action}</span>
                <code>{action.action_scope}</code>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Related UI surfaces</h5>
          <ul>
            {explanation.related_ui_surfaces.map((surface) => (
              <li key={`${gate.gate_id}-${surface}`}>{surface}</li>
            ))}
          </ul>
        </div>
        <div>
          <h5>Related evidence fields</h5>
          <ul>
            {explanation.related_evidence_fields.map((field) => (
              <li key={`${gate.gate_id}-${field}`}>
                <code>{field}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <h5>Resolution boundary</h5>
      <div className="manual-note-gate-resolution-boundary">
        {Object.entries(explanation.resolution_boundary).map(([key, value]) => (
          <span key={`${gate.gate_id}-${key}`}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </article>
  );
}
