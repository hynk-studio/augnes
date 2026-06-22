"use client";

import type {
  FeedbackEventControlUiBinding,
  FeedbackEventControlUiRequestPreview,
} from "@/types/feedback-event-controls-ui-contract";
import { useMemo, useState } from "react";

type FeedbackEventControlsProps = {
  bindings: FeedbackEventControlUiBinding[];
  requestPreviews: FeedbackEventControlUiRequestPreview[];
  enabledControlKinds?: FeedbackEventControlUiBinding["control_kind"][];
  disabledReason?: string;
  onSubmitted?: (result: FeedbackEventControlSubmissionResult) => void;
};

type FeedbackEventControlSubmissionResult = {
  control_kind: FeedbackEventControlUiBinding["control_kind"];
  accepted: boolean;
  inserted: boolean;
  duplicate: boolean;
  event_id: string | null;
  refusal_code: string | null;
  validation_failure_codes: string[];
};

type FeedbackEventWriteRouteResponse = {
  accepted?: boolean;
  inserted?: boolean;
  duplicate?: boolean;
  event_id?: string | null;
  refusal?: { refusal_code?: string } | null;
  validation?: { failure_codes?: string[] } | null;
};

type ControlStatus = {
  kind: "idle" | "pending" | "success" | "info" | "error";
  message: string;
  refusal_code?: string;
  validation_failure_codes?: string[];
};

const feedbackEventRoutePath = "/api/research-candidate/feedback-events";
const requestVersion = "feedback_event_write_route_request.v0.1";
const requiredAuthorityAcknowledgements = [
  "durable_feedback_event_only",
  "not_proof_or_evidence",
  "not_perspective_promotion",
  "not_work_mutation",
  "not_execution_authority",
  "not_codex_execution",
  "not_github_automation",
  "not_external_handoff",
  "not_provider_openai_call",
  "not_source_fetch",
  "not_retrieval_rag_execution",
  "not_product_write",
  "product_write_lane_parked_by_686",
] satisfies FeedbackEventControlUiRequestPreview["authority_acknowledgements"];
const defaultEnabledControlKinds: FeedbackEventControlUiBinding["control_kind"][] = [
  "dismiss_preview",
  "pin_preview",
];

export function FeedbackEventControls({
  bindings,
  requestPreviews,
  enabledControlKinds = defaultEnabledControlKinds,
  disabledReason = "Disabled in this v0.1 implementation unless this is a substrate dismiss or source-coverage pin control.",
  onSubmitted,
}: FeedbackEventControlsProps) {
  const [statuses, setStatuses] = useState<Record<string, ControlStatus>>({});
  const enabledKinds = useMemo(
    () => new Set<FeedbackEventControlUiBinding["control_kind"]>(enabledControlKinds),
    [enabledControlKinds],
  );
  const controls = useMemo(
    () =>
      bindings.map((binding) => ({
        binding,
        requestPreview: requestPreviews.find(
          (requestPreview) =>
            requestPreview.request_preview_id === binding.request_preview_id,
        ),
      })),
    [bindings, requestPreviews],
  );

  async function submitControl(
    binding: FeedbackEventControlUiBinding,
    requestPreview: FeedbackEventControlUiRequestPreview,
  ) {
    if (!enabledKinds.has(binding.control_kind)) return;
    if (binding.control_kind === "correct_preview" && !requestPreview.correction_text_placeholder) {
      updateStatus(binding.binding_id, {
        kind: "error",
        message: "correction_text is required before correct_preview can be submitted.",
        validation_failure_codes: ["correction_text_required_for_correct_preview"],
      });
      return;
    }

    updateStatus(binding.binding_id, {
      kind: "pending",
      message: "Submitting durable feedback event only.",
    });

    try {
      const response = await fetch(feedbackEventRoutePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildFeedbackEventWriteRequest(binding, requestPreview)),
      });
      const responseBody = (await response.json()) as FeedbackEventWriteRouteResponse;
      const validationFailureCodes = responseBody.validation?.failure_codes ?? [];
      const refusalCode = responseBody.refusal?.refusal_code ?? null;
      const result: FeedbackEventControlSubmissionResult = {
        control_kind: binding.control_kind,
        accepted: responseBody.accepted === true,
        inserted: responseBody.inserted === true,
        duplicate: responseBody.duplicate === true,
        event_id: responseBody.event_id ?? null,
        refusal_code: refusalCode,
        validation_failure_codes: validationFailureCodes,
      };
      onSubmitted?.(result);

      if (result.accepted && result.duplicate) {
        updateStatus(binding.binding_id, {
          kind: "info",
          message: "Duplicate feedback event already exists; no additional row was written.",
        });
        return;
      }
      if (result.accepted && result.inserted) {
        updateStatus(binding.binding_id, {
          kind: "success",
          message: `Feedback event recorded: ${result.event_id ?? "event_id unavailable"}.`,
        });
        return;
      }
      updateStatus(binding.binding_id, {
        kind: "error",
        message: "Feedback event route rejected the request.",
        refusal_code: refusalCode ?? "missing_refusal_code",
        validation_failure_codes: validationFailureCodes,
      });
    } catch {
      updateStatus(binding.binding_id, {
        kind: "error",
        message: "Feedback event route request failed before a response was observed.",
        validation_failure_codes: ["feedback_event_route_request_failed"],
      });
    }
  }

  function updateStatus(bindingId: string, status: ControlStatus) {
    setStatuses((current) => ({ ...current, [bindingId]: status }));
  }

  return (
    <div
      className="feedback-event-controls"
      aria-label="Feedback Event controls"
      data-feedback-event-route={feedbackEventRoutePath}
    >
      <p>
        Feedback writes are durable feedback event only; not proof/evidence, not
        Perspective promotion, not work mutation, not retrieval/RAG, and not
        product write.
      </p>
      <div className="button-row">
        {controls.map(({ binding, requestPreview }) => {
          const status = statuses[binding.binding_id];
          const enabled = Boolean(requestPreview) && enabledKinds.has(binding.control_kind);
          const pending = status?.kind === "pending";
          return (
            <div key={binding.binding_id}>
              <button
                type="button"
                className="secondary-button"
                disabled={!enabled || pending}
                title={enabled ? "Write durable feedback event only." : disabledReason}
                onClick={() => {
                  if (requestPreview) {
                    void submitControl(binding, requestPreview);
                  }
                }}
              >
                {binding.label}
              </button>
              <small>
                <code>{binding.control_kind}</code>{" "}
                {enabled ? "enabled for feedback event write" : "disabled"}
              </small>
              {status ? (
                <p role={status.kind === "error" ? "alert" : "status"}>
                  {status.message}
                  {status.refusal_code ? (
                    <>
                      {" "}
                      refusal_code <code>{status.refusal_code}</code>
                    </>
                  ) : null}
                  {status.validation_failure_codes?.length ? (
                    <>
                      {" "}
                      validation failure codes{" "}
                      <code>{status.validation_failure_codes.join(", ")}</code>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildFeedbackEventWriteRequest(
  binding: FeedbackEventControlUiBinding,
  requestPreview: FeedbackEventControlUiRequestPreview,
) {
  return {
    request_version: requestVersion,
    event_type: requestPreview.event_type,
    target_kind: requestPreview.target_kind,
    target_id: requestPreview.target_id,
    ...(requestPreview.target_fingerprint
      ? { target_fingerprint: requestPreview.target_fingerprint }
      : {}),
    source_ref_ids: requestPreview.source_ref_ids,
    operator_note:
      requestPreview.operator_note_placeholder ||
      `${binding.label} submitted from Agent Perspective Substrate folded audit panel; ` +
        "durable feedback event only, not proof/evidence, not Perspective promotion, " +
        "not work mutation, not retrieval/RAG, not product write.",
    reason:
      requestPreview.reason_placeholder || reasonForControlKind(binding.control_kind),
    client_request_id: `feedback_event_controls_ui_implementation:${binding.request_preview_id}`,
    authority_acknowledgements: requiredAuthorityAcknowledgements.every((acknowledgement) =>
      requestPreview.authority_acknowledgements.includes(acknowledgement),
    )
      ? requestPreview.authority_acknowledgements
      : requiredAuthorityAcknowledgements,
  };
}

function reasonForControlKind(
  controlKind: FeedbackEventControlUiBinding["control_kind"],
): string {
  switch (controlKind) {
    case "dismiss_preview":
      return "preview_card_reviewed_from_folded_audit_panel";
    case "pin_preview":
      return "keep_source_coverage_visible_from_folded_audit_panel";
    case "correct_preview":
      return "correction_requires_future_stable_surface";
    case "invalidate_preview":
      return "invalidation_requires_future_stable_surface";
  }
}
