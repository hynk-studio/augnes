"use client";

import { useMemo, useState } from "react";

export type FeedbackControlKind =
  | "dismiss_preview"
  | "pin_preview"
  | "correct_preview"
  | "invalidate_preview"
  | "needs_more_evidence"
  | "scope_overreach"
  | "not_relevant_now"
  | "mark_useful"
  | "mark_wrong";

export type FeedbackControlSurface =
  | "manual_note_parser"
  | "research_candidate_review"
  | "geometry_digest"
  | "ai_context_packet"
  | "codex_handoff_draft"
  | "lifecycle_read_model"
  | "calibration_diagnostic"
  | "constellation_runtime_ui"
  | "manual_anchor_store"
  | "perspective_trajectory"
  | "durable_state_apply"
  | "unknown";

export type FeedbackControlPayload = {
  feedback_control_version: "feedback_controls_expansion.v0.1";
  scope: "project:augnes";
  control_kind: FeedbackControlKind;
  target_surface: FeedbackControlSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  target_source_refs: string[];
  target_review_record_refs: string[];
  operator_actor_ref: string;
  bounded_feedback_summary: string;
  created_at: string;
  public_safe: true;
  advisory_only: true;
  persists_feedback: false;
  mutates_candidate: false;
  deletes_candidate: false;
  promotes_candidate: false;
  mutates_rules: false;
  mutates_parser: false;
  mutates_durable_state: false;
  product_write_executed: false;
  reason_codes: string[];
  authority_boundary: FeedbackControlAuthorityBoundary;
};

export type FeedbackControlAuthorityBoundary = {
  local_ui_intent_only: true;
  callback_emission_only: true;
  feedback_write_now: false;
  feedback_persistence_now: false;
  db_query_or_write_now: false;
  candidate_mutation_now: false;
  candidate_deletion_now: false;
  promotion_execution_now: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  feedback_is_truth: false;
  feedback_is_proof: false;
  feedback_is_evidence: false;
  feedback_is_promotion_readiness: false;
  product_write_authority: false;
};

type FeedbackEventExpandedControlsProps = {
  target_surface: FeedbackControlSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  target_source_refs: string[];
  target_review_record_refs: string[];
  operator_actor_ref: string;
  disabled?: boolean;
  onFeedbackIntent?: (payload: FeedbackControlPayload) => void;
  className?: string;
};

const controlKinds: FeedbackControlKind[] = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
];

const destructiveControlKinds = new Set<FeedbackControlKind>([
  "dismiss_preview",
  "invalidate_preview",
  "mark_wrong",
]);

const controlLabels: Record<FeedbackControlKind, string> = {
  dismiss_preview: "Dismiss preview intent",
  pin_preview: "Pin preview intent",
  correct_preview: "Correct preview intent",
  invalidate_preview: "Invalidate preview intent",
  needs_more_evidence: "Needs more evidence intent",
  scope_overreach: "Scope overreach intent",
  not_relevant_now: "Not relevant now intent",
  mark_useful: "Mark useful intent",
  mark_wrong: "Mark wrong intent",
};

const controlSummaries: Record<FeedbackControlKind, string> = {
  dismiss_preview: "Dismiss preview lowers display priority only.",
  pin_preview: "Pin preview keeps the item visible without promotion.",
  correct_preview: "Correction requires a bounded operator note summary.",
  invalidate_preview: "Invalidate preview requires review follow-up and does not delete.",
  needs_more_evidence: "Needs-more-evidence creates review cue intent only.",
  scope_overreach: "Scope-overreach creates rule failure candidate intent only.",
  not_relevant_now: "Not relevant now lowers display priority only.",
  mark_useful: "Mark useful raises display attention without promotion.",
  mark_wrong: "Mark wrong requires confirmation and does not mutate parser behavior.",
};

export function FeedbackEventExpandedControls({
  target_surface,
  target_surface_ref,
  target_candidate_ref,
  target_source_refs,
  target_review_record_refs,
  operator_actor_ref,
  disabled = false,
  onFeedbackIntent,
  className,
}: FeedbackEventExpandedControlsProps) {
  const [pendingConfirmation, setPendingConfirmation] =
    useState<FeedbackControlKind | null>(null);
  const [correctionNoteSummary, setCorrectionNoteSummary] = useState("");
  const [lastIntentKind, setLastIntentKind] = useState<FeedbackControlKind | null>(null);

  const normalizedSourceRefs = useMemo(
    () => uniquePublicRefs(target_source_refs),
    [target_source_refs],
  );
  const normalizedReviewRefs = useMemo(
    () => uniquePublicRefs(target_review_record_refs),
    [target_review_record_refs],
  );

  function handleControlIntent(controlKind: FeedbackControlKind) {
    if (disabled) return;
    if (destructiveControlKinds.has(controlKind) && pendingConfirmation !== controlKind) {
      setPendingConfirmation(controlKind);
      return;
    }
    if (controlKind === "correct_preview" && correctionNoteSummary.trim().length === 0) {
      setPendingConfirmation("correct_preview");
      return;
    }
    const payload = createFeedbackControlPayload({
      controlKind,
      target_surface,
      target_surface_ref,
      target_candidate_ref,
      target_source_refs: normalizedSourceRefs,
      target_review_record_refs: normalizedReviewRefs,
      operator_actor_ref,
      correctionNoteSummary,
    });
    setPendingConfirmation(null);
    setLastIntentKind(controlKind);
    onFeedbackIntent?.(payload);
  }

  return (
    <section
      className={className ?? "feedback-controls-expanded"}
      aria-label="Feedback controls expansion"
      data-feedback-controls-version="feedback_controls_expansion.v0.1"
      data-feedback-controls-authority="local-intent-only no-persistence no-candidate-mutation no-product-write"
    >
      <header>
        <p className="panel-eyebrow">Feedback Controls Expansion</p>
        <h2>Feedback controls are local intent only</h2>
        <p>No feedback is persisted</p>
        <p>Feedback is not truth</p>
        <p>No candidate mutation</p>
        <p>Product-write remains parked</p>
      </header>

      <div className="perspective-workbench-status-row">
        <span>Callback-only feedback intent emission</span>
        <span>No route calls</span>
        <span>No DB writes</span>
        <span>No durable state mutation</span>
      </div>

      <label className="feedback-control-note">
        <span>Bounded correction note summary</span>
        <textarea
          value={correctionNoteSummary}
          onChange={(event) => setCorrectionNoteSummary(event.currentTarget.value.slice(0, 240))}
          placeholder="Bounded operator note summary required for correction intent"
          disabled={disabled}
          aria-label="Bounded operator note summary"
        />
      </label>

      <div className="button-row" aria-label="Expanded feedback intent controls">
        {controlKinds.map((controlKind) => {
          const requiresConfirmation = destructiveControlKinds.has(controlKind);
          const awaitingConfirmation = pendingConfirmation === controlKind;
          const correctionBlocked =
            controlKind === "correct_preview" && correctionNoteSummary.trim().length === 0;
          return (
            <button
              key={controlKind}
              type="button"
              className="secondary-button"
              disabled={disabled}
              data-control-kind={controlKind}
              data-intent-only="true"
              data-persists-feedback="false"
              data-mutates-candidate="false"
              data-deletes-candidate="false"
              data-promotes-candidate="false"
              data-mutates-rules="false"
              data-mutates-parser="false"
              data-mutates-durable-state="false"
              data-product-write-executed="false"
              aria-describedby={`${controlKind}-summary`}
              onClick={() => handleControlIntent(controlKind)}
            >
              {awaitingConfirmation
                ? `Confirm ${controlKind} intent`
                : controlLabels[controlKind]}
              {requiresConfirmation ? " - confirmation required" : ""}
              {correctionBlocked ? " - note required" : ""}
            </button>
          );
        })}
      </div>

      <div className="compact-list">
        {controlKinds.map((controlKind) => (
          <p key={controlKind} id={`${controlKind}-summary`}>
            <code>{controlKind}</code>: {controlSummaries[controlKind]} Intent only / no persistence.
          </p>
        ))}
      </div>

      <footer className="perspective-workbench-status-row">
        <span>
          target_surface <code>{target_surface}</code>
        </span>
        <span>
          target_candidate_ref <code>{target_candidate_ref}</code>
        </span>
        <span>
          last_intent <code>{lastIntentKind ?? "none"}</code>
        </span>
      </footer>
    </section>
  );
}

function createFeedbackControlPayload(args: {
  controlKind: FeedbackControlKind;
  target_surface: FeedbackControlSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  target_source_refs: string[];
  target_review_record_refs: string[];
  operator_actor_ref: string;
  correctionNoteSummary: string;
}): FeedbackControlPayload {
  return {
    feedback_control_version: "feedback_controls_expansion.v0.1",
    scope: "project:augnes",
    control_kind: args.controlKind,
    target_surface: args.target_surface,
    target_surface_ref: args.target_surface_ref,
    target_candidate_ref: args.target_candidate_ref,
    target_source_refs: args.target_source_refs,
    target_review_record_refs: args.target_review_record_refs,
    operator_actor_ref: args.operator_actor_ref,
    bounded_feedback_summary: boundedSummaryForControl(
      args.controlKind,
      args.correctionNoteSummary,
    ),
    created_at: new Date().toISOString(),
    public_safe: true,
    advisory_only: true,
    persists_feedback: false,
    mutates_candidate: false,
    deletes_candidate: false,
    promotes_candidate: false,
    mutates_rules: false,
    mutates_parser: false,
    mutates_durable_state: false,
    product_write_executed: false,
    reason_codes: reasonCodesForControl(args.controlKind),
    authority_boundary: createFeedbackControlAuthorityBoundary(),
  };
}

function boundedSummaryForControl(
  controlKind: FeedbackControlKind,
  correctionNoteSummary: string,
) {
  if (controlKind === "correct_preview") {
    return `Correction intent: ${correctionNoteSummary.trim().slice(0, 240)}`;
  }
  return controlSummaries[controlKind];
}

function reasonCodesForControl(controlKind: FeedbackControlKind): string[] {
  const base = [
    "feedback_controls_local_intent_only",
    "feedback_is_not_truth",
    "feedback_is_not_proof",
    "feedback_is_not_evidence",
    "feedback_is_not_promotion_readiness",
    "feedback_persistence_not_executed",
    "candidate_not_mutated",
    "product_write_denied",
  ];
  if (destructiveControlKinds.has(controlKind)) {
    base.push("destructive_action_local_confirmation_required");
  }
  if (controlKind === "correct_preview") {
    base.push("bounded_operator_note_summary_required");
  }
  if (controlKind === "needs_more_evidence") {
    base.push("review_cue_intent_only");
  }
  if (controlKind === "scope_overreach") {
    base.push("rule_failure_candidate_intent_only");
  }
  return [...new Set(base)].sort();
}

function createFeedbackControlAuthorityBoundary(): FeedbackControlAuthorityBoundary {
  return {
    local_ui_intent_only: true,
    callback_emission_only: true,
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
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    git_ledger_export_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    feedback_is_truth: false,
    feedback_is_proof: false,
    feedback_is_evidence: false,
    feedback_is_promotion_readiness: false,
    product_write_authority: false,
  };
}

function uniquePublicRefs(values: string[]) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))].sort();
}
