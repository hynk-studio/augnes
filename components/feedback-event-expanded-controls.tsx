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

export type FeedbackControlWriteKind =
  | "dismiss"
  | "pin"
  | "correct"
  | "invalidate"
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

export type FeedbackControlsRouteBackedAuthorityBoundary = {
  feedback_controls_runtime_completion_now: true;
  explicit_operator_feedback_action_only: true;
  same_origin_post_route_now: true;
  caller_injected_db_only: true;
  feedback_event_write_now: true;
  feedback_event_persistence_now: true;
  advisory_signal_only: true;
  callback_compatibility_preserved: true;
  automatic_feedback_write_on_load_now: false;
  hidden_feedback_write_now: false;
  feedback_is_truth: false;
  pin_is_promotion: false;
  dismiss_is_delete: false;
  invalidate_is_source_suppression: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  prompt_mutation_now: false;
  ranking_mutation_now: false;
  surfacing_mutation_now: false;
  source_suppression_now: false;
  candidate_delete_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  rag_answer_generation_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
};

export type FeedbackControlsRuntimeRouteStatus = {
  status: "idle" | "pending" | "ok" | "error";
  route_status_code: string;
  feedback_event_ref: string;
  authority_boundary: FeedbackControlsRouteBackedAuthorityBoundary | null;
};

type FeedbackEventExpandedControlsProps = {
  target_surface: FeedbackControlSurface;
  target_surface_ref: string;
  target_candidate_ref: string;
  target_source_refs: string[];
  target_review_record_refs: string[];
  operator_actor_ref: string;
  persistenceMode?: "callback_only" | "route_backed";
  dbPath?: string;
  target_kind?: string;
  target_layer?:
    | "candidate"
    | "review_memory"
    | "durable_perspective_state"
    | "source_ref"
    | "provider_candidate"
    | "retrieval_context"
    | "layout_surface"
    | "unknown";
  disabled?: boolean;
  onFeedbackIntent?: (payload: FeedbackControlPayload) => void;
  className?: string;
};

const runtimeCompletionRouteVersion =
  "feedback_controls_expansion_runtime_completion_route.v0.1";
const runtimeCompletionRequestVersion = "feedback_event_write_runtime_request.v0.1";
const runtimeCompletionEventVersion = "feedback_event_write_runtime_event.v0.1";
const runtimeCompletionUiVersion = "feedback_controls_expansion_runtime_completion.v0.1";
const defaultRouteBackedDbPath =
  ".tmp/feedback-event-aggregation/ui/feedback-events.sqlite";
const feedbackEventWriteRoutePath = "/api/research-candidate/feedback-events";

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
  persistenceMode = "callback_only",
  dbPath = defaultRouteBackedDbPath,
  target_kind,
  target_layer,
  disabled = false,
  onFeedbackIntent,
  className,
}: FeedbackEventExpandedControlsProps) {
  const [pendingConfirmation, setPendingConfirmation] =
    useState<FeedbackControlKind | null>(null);
  const [correctionNoteSummary, setCorrectionNoteSummary] = useState("");
  const [feedbackReasonSummary, setFeedbackReasonSummary] = useState("");
  const [runtimeDbPath, setRuntimeDbPath] = useState(dbPath);
  const [lastIntentKind, setLastIntentKind] = useState<FeedbackControlKind | null>(null);
  const [routeStatus, setRouteStatus] = useState<FeedbackControlsRuntimeRouteStatus>({
    status: "idle",
    route_status_code: "not_started",
    feedback_event_ref: "none",
    authority_boundary: null,
  });

  const normalizedSourceRefs = useMemo(
    () => uniquePublicRefs(target_source_refs),
    [target_source_refs],
  );
  const normalizedReviewRefs = useMemo(
    () => uniquePublicRefs(target_review_record_refs),
    [target_review_record_refs],
  );
  const routeBackedMode = persistenceMode === "route_backed";

  async function handleControlIntent(controlKind: FeedbackControlKind) {
    if (disabled) return;
    if (destructiveControlKinds.has(controlKind) && pendingConfirmation !== controlKind) {
      setPendingConfirmation(controlKind);
      return;
    }
    if (
      (controlKind === "correct_preview" || controlKind === "mark_wrong") &&
      correctionNoteSummary.trim().length === 0
    ) {
      setPendingConfirmation(controlKind);
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
    if (!routeBackedMode) {
      onFeedbackIntent?.(payload);
      return;
    }
    await persistFeedbackEvent(controlKind, payload);
  }

  async function persistFeedbackEvent(
    controlKind: FeedbackControlKind,
    payload: FeedbackControlPayload,
  ) {
    const feedbackKind = feedbackWriteKindForControl(controlKind);
    const createdAt = new Date().toISOString();
    const eventId = createRuntimeFeedbackEventId({
      controlKind,
      targetRef: target_candidate_ref || target_surface_ref,
      createdAt,
    });
    setRouteStatus({
      status: "pending",
      route_status_code: "pending",
      feedback_event_ref: "pending",
      authority_boundary: null,
    });
    try {
      const response = await fetch(feedbackEventWriteRoutePath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          route_version: runtimeCompletionRouteVersion,
          scope: "project:augnes",
          action: "create_feedback_event",
          db_path: runtimeDbPath,
          input: {
            request_version: runtimeCompletionRequestVersion,
            event_version: runtimeCompletionEventVersion,
            scope: "project:augnes",
            feedback_event_id: eventId,
            feedback_kind: feedbackKind,
            target_ref: target_candidate_ref || target_surface_ref,
            target_kind: target_kind ?? target_surface,
            target_layer: target_layer ?? targetLayerForSurface(target_surface),
            target_fingerprint: target_surface_ref,
            source_refs: normalizedSourceRefs,
            candidate_ref: target_candidate_ref || undefined,
            durable_ref: undefined,
            feedback_summary: boundedRuntimeFeedbackSummary(
              feedbackKind,
              payload.bounded_feedback_summary,
              feedbackReasonSummary,
            ),
            correction_text: correctionTextForFeedbackKind(
              feedbackKind,
              correctionNoteSummary,
            ),
            reason: reasonForFeedbackKind(feedbackKind, feedbackReasonSummary),
            created_by: operator_actor_ref,
            created_at: createdAt,
            idempotency_key: `feedback-event-ui:${eventId}`,
            authority_boundary: createRouteBackedFeedbackControlsAuthorityBoundary(),
            reason_codes: [
              "feedback_controls_runtime_completion",
              "explicit_operator_feedback_action",
              "route_backed_feedback_event_write",
              "feedback_is_not_truth",
              "pin_is_not_promotion",
              "dismiss_is_not_delete",
              "invalidate_is_not_source_suppression",
              "product_write_denied",
            ],
          },
        }),
      });
      const body = (await response.json()) as {
        status?: "ok" | "error";
        error_code?: string | null;
        result?: {
          status?: string;
          feedback_event_ref?: string | null;
          authority_boundary?: FeedbackControlsRouteBackedAuthorityBoundary;
        } | null;
        authority_boundary?: FeedbackControlsRouteBackedAuthorityBoundary;
      };
      setRouteStatus({
        status: body.status === "ok" ? "ok" : "error",
        route_status_code:
          body.result?.status ?? body.error_code ?? String(response.status),
        feedback_event_ref: body.result?.feedback_event_ref ?? "none",
        authority_boundary:
          body.result?.authority_boundary ?? body.authority_boundary ?? null,
      });
    } catch {
      setRouteStatus({
        status: "error",
        route_status_code: "blocked_invalid_input",
        feedback_event_ref: "none",
        authority_boundary: createRouteBackedFeedbackControlsAuthorityBoundary(),
      });
    }
  }

  return (
    <section
      className={className ?? "feedback-controls-expanded"}
      aria-label="Feedback controls expansion"
      data-feedback-controls-version="feedback_controls_expansion.v0.1"
      data-feedback-controls-runtime-completion={runtimeCompletionUiVersion}
      data-feedback-controls-route-mode={routeBackedMode ? "route-backed" : "callback-only"}
      data-feedback-events-route={feedbackEventWriteRoutePath}
      data-feedback-controls-authority={
        routeBackedMode
          ? "route-backed explicit-operator-feedback-write no-mutation no-product-write"
          : "local-intent-only no-persistence no-candidate-mutation no-product-write"
      }
    >
      <header>
        <p className="panel-eyebrow">Feedback Controls Expansion</p>
        <h2>
          {routeBackedMode
            ? "Feedback controls write bounded review signals"
            : "Feedback controls are local intent only"}
        </h2>
        <p>
          {routeBackedMode
            ? "Feedback events persist only after explicit operator action"
            : "No feedback is persisted"}
        </p>
        <p>Feedback is not truth</p>
        <p>No candidate mutation</p>
        <p>Product-write remains parked by #686</p>
      </header>

      <div className="perspective-workbench-status-row">
        <span>Callback-only feedback intent emission</span>
        <span>No route calls in callback compatibility mode</span>
        <span>No DB writes in callback compatibility mode</span>
        <span>No durable state mutation</span>
      </div>

      {routeBackedMode ? (
        <div className="perspective-workbench-status-row">
          <span>Route-backed mode</span>
          <span>
            POST <code>{feedbackEventWriteRoutePath}</code>
          </span>
          <span>Advisory signal only</span>
          <span>No aggregation write side effect</span>
        </div>
      ) : null}

      {routeBackedMode ? (
        <label className="feedback-control-note">
          <span>Local/dev feedback event DB path</span>
          <input
            value={runtimeDbPath}
            onChange={(event) => setRuntimeDbPath(event.currentTarget.value.slice(0, 180))}
            disabled={disabled}
            aria-label="Local/dev feedback event DB path"
          />
        </label>
      ) : null}

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

      {routeBackedMode ? (
        <label className="feedback-control-note">
          <span>Bounded feedback summary or reason</span>
          <textarea
            value={feedbackReasonSummary}
            onChange={(event) => setFeedbackReasonSummary(event.currentTarget.value.slice(0, 240))}
            placeholder="Bounded reason for dismiss, invalidate, needs more evidence, scope overreach, or review note"
            disabled={disabled}
            aria-label="Bounded feedback summary or reason"
          />
        </label>
      ) : null}

      <div className="button-row" aria-label="Expanded feedback intent controls">
        {controlKinds.map((controlKind) => {
          const requiresConfirmation = destructiveControlKinds.has(controlKind);
          const awaitingConfirmation = pendingConfirmation === controlKind;
          const correctionBlocked =
            (controlKind === "correct_preview" || controlKind === "mark_wrong") &&
            correctionNoteSummary.trim().length === 0;
          return (
            <button
              key={controlKind}
              type="button"
              className="secondary-button"
              disabled={disabled}
              data-control-kind={controlKind}
              data-feedback-write-kind={feedbackWriteKindForControl(controlKind)}
              data-intent-only="true"
              data-route-backed-mode={routeBackedMode ? "true" : "false"}
              data-persists-feedback={routeBackedMode ? "true" : "false"}
              data-mutates-candidate="false"
              data-deletes-candidate="false"
              data-promotes-candidate="false"
              data-mutates-rules="false"
              data-mutates-parser="false"
              data-mutates-durable-state="false"
              data-product-write-executed="false"
              aria-describedby={`${controlKind}-summary`}
              onClick={() => {
                void handleControlIntent(controlKind);
              }}
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

      {routeBackedMode ? (
        <div className="compact-list" aria-label="Route-backed feedback event status">
          <p>
            route_status <code>{routeStatus.route_status_code}</code>
          </p>
          <p>
            persisted_feedback_event_ref <code>{routeStatus.feedback_event_ref}</code>
          </p>
          <p>Feedback is not truth; pin is not promotion; dismiss is not delete.</p>
          <p>Invalidate is not source suppression; correct does not mutate parser or rules.</p>
          <p>Scope-overreach and needs-more-evidence create review signals only.</p>
          <p>No source suppression, candidate deletion, proof/evidence, promotion, or product-write.</p>
          <pre aria-label="Feedback controls route authority boundary">
            {JSON.stringify(
              routeStatus.authority_boundary ??
                createRouteBackedFeedbackControlsAuthorityBoundary(),
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}

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

function feedbackWriteKindForControl(controlKind: FeedbackControlKind): FeedbackControlWriteKind {
  if (controlKind === "dismiss_preview") return "dismiss";
  if (controlKind === "pin_preview") return "pin";
  if (controlKind === "correct_preview") return "correct";
  if (controlKind === "invalidate_preview") return "invalidate";
  return controlKind;
}

function targetLayerForSurface(
  targetSurface: FeedbackControlSurface,
): NonNullable<FeedbackEventExpandedControlsProps["target_layer"]> {
  if (targetSurface === "research_candidate_review") return "review_memory";
  if (targetSurface === "geometry_digest" || targetSurface === "constellation_runtime_ui") {
    return "layout_surface";
  }
  if (targetSurface === "durable_state_apply") return "durable_perspective_state";
  if (targetSurface === "lifecycle_read_model") return "candidate";
  return "unknown";
}

function boundedRuntimeFeedbackSummary(
  feedbackKind: FeedbackControlWriteKind,
  fallbackSummary: string,
  feedbackReasonSummary: string,
) {
  const reason = feedbackReasonSummary.trim();
  if (reason.length > 0) return reason.slice(0, 240);
  if (
    feedbackKind === "dismiss" ||
    feedbackKind === "invalidate" ||
    feedbackKind === "needs_more_evidence" ||
    feedbackKind === "scope_overreach" ||
    feedbackKind === "not_relevant_now"
  ) {
    return `${feedbackKind} operator review signal`;
  }
  return fallbackSummary.trim().slice(0, 240);
}

function correctionTextForFeedbackKind(
  feedbackKind: FeedbackControlWriteKind,
  correctionNoteSummary: string,
) {
  if (feedbackKind === "correct" || feedbackKind === "mark_wrong") {
    return correctionNoteSummary.trim().slice(0, 240) || undefined;
  }
  return undefined;
}

function reasonForFeedbackKind(
  feedbackKind: FeedbackControlWriteKind,
  feedbackReasonSummary: string,
) {
  if (
    feedbackKind === "dismiss" ||
    feedbackKind === "invalidate" ||
    feedbackKind === "needs_more_evidence" ||
    feedbackKind === "scope_overreach" ||
    feedbackKind === "not_relevant_now"
  ) {
    return feedbackReasonSummary.trim().slice(0, 240) || `${feedbackKind} operator review signal`;
  }
  return feedbackReasonSummary.trim().slice(0, 240) || undefined;
}

function createRuntimeFeedbackEventId(args: {
  controlKind: FeedbackControlKind;
  targetRef: string;
  createdAt: string;
}) {
  const stableTarget = args.targetRef.replace(/[^A-Za-z0-9:_./-]+/g, "-").slice(0, 80);
  return `feedback-event:ui:${args.controlKind}:${stableTarget}:${args.createdAt.replace(/[^A-Za-z0-9]+/g, "")}`;
}

function createRouteBackedFeedbackControlsAuthorityBoundary(): FeedbackControlsRouteBackedAuthorityBoundary {
  return {
    feedback_controls_runtime_completion_now: true,
    explicit_operator_feedback_action_only: true,
    same_origin_post_route_now: true,
    caller_injected_db_only: true,
    feedback_event_write_now: true,
    feedback_event_persistence_now: true,
    advisory_signal_only: true,
    callback_compatibility_preserved: true,
    automatic_feedback_write_on_load_now: false,
    hidden_feedback_write_now: false,
    feedback_is_truth: false,
    pin_is_promotion: false,
    dismiss_is_delete: false,
    invalidate_is_source_suppression: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    prompt_mutation_now: false,
    ranking_mutation_now: false,
    surfacing_mutation_now: false,
    source_suppression_now: false,
    candidate_delete_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    rag_answer_generation_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
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
