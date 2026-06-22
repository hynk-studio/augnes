"use client";

import feedbackEventStoreListUiContractFixture from "@/fixtures/research-candidate-review.feedback-event-store-list-ui-contract.sample.v0.1.json";
import type {
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";
import type {
  FeedbackEventStoreListUiContract,
  FeedbackEventStoreListUiRequestQueryParams,
} from "@/types/feedback-event-store-list-ui-contract";
import { useMemo, useState } from "react";

type FeedbackEventStoreListPanelProps = {
  contract?: FeedbackEventStoreListUiContract;
  initialFilter?: FeedbackEventStoreListPanelFilter;
  disabledReason?: string;
};

type FeedbackEventStoreListPanelFilter = {
  event_type?: FeedbackEventStoreEventType | "";
  target_kind?: FeedbackEventStoreTargetKind | "";
  target_id?: string;
  created_after?: string;
  created_before?: string;
  limit?: number | string;
};

type FeedbackEventStoreListResponse = {
  response_version?: "feedback_event_store_list_route_response.v0.1";
  accepted?: boolean;
  events?: FeedbackEventStoreEvent[];
  count?: number;
  next_cursor?: string | null;
  validation?: { passed?: boolean; failure_codes?: string[] };
  authority_boundary?: Record<string, boolean | string | number | null>;
  refusal?: {
    refusal_code?: string;
    message?: string;
    retryable?: boolean;
    authority_boundary_notes?: string[];
  } | null;
};

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; response: FeedbackEventStoreListResponse }
  | {
      kind: "refusal";
      response: FeedbackEventStoreListResponse;
      refusal_code: string;
      validation_failure_codes: string[];
    }
  | { kind: "error"; message: string; validation_failure_codes: string[] };

const contractFixture =
  feedbackEventStoreListUiContractFixture as unknown as FeedbackEventStoreListUiContract;
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "GET";
const requestVersion = "feedback_event_store_list_route_request.v0.1";
const requiredAuthorityAcknowledgements = [
  "read_feedback_events_only",
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
] satisfies FeedbackEventStoreListUiContract["authority_acknowledgement_policy"]["required_acknowledgements"];
const eventTypeOptions: FeedbackEventStoreEventType[] = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];
const targetKindOptions: FeedbackEventStoreTargetKind[] = [
  "agent_perspective_substrate_surfacing_card",
  "agent_perspective_substrate_folded_section",
  "candidate_to_codex_handoff_draft",
  "candidate_to_codex_handoff_draft_review",
  "candidate_to_codex_handoff_operator_decision_preview",
  "research_candidate_review_object",
  "research_candidate_ai_context_packet",
  "perspective_geometry_digest",
];

export function FeedbackEventStoreListPanel({
  contract = contractFixture,
  initialFilter,
  disabledReason,
}: FeedbackEventStoreListPanelProps) {
  const defaultLimit = getContractDefaultLimit(contract);
  const [filter, setFilter] = useState<FeedbackEventStoreListPanelFilter>({
    event_type: initialFilter?.event_type ?? "",
    target_kind: initialFilter?.target_kind ?? "",
    target_id: initialFilter?.target_id ?? "",
    created_after: initialFilter?.created_after ?? "",
    created_before: initialFilter?.created_before ?? "",
    limit: initialFilter?.limit ?? defaultLimit,
  });
  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });
  const events = loadState.kind === "success" ? loadState.response.events ?? [] : [];
  const duplicateIndicators = useMemo(
    () => buildDuplicateIndicators(events),
    [events],
  );
  const disabled = Boolean(disabledReason);

  async function loadFeedbackEvents() {
    if (disabled) return;
    setLoadState({ kind: "loading" });
    try {
      const response = await fetch(`${routePath}?${buildQueryParams(filter)}`, {
        method: routeMethod,
      });
      const responseBody = (await response.json()) as FeedbackEventStoreListResponse;
      const validationFailureCodes = responseBody.validation?.failure_codes ?? [];
      const refusalCode =
        responseBody.refusal?.refusal_code ??
        (response.ok && responseBody.accepted !== false ? null : "missing_refusal_code");
      if (!response.ok || responseBody.accepted !== true || refusalCode) {
        setLoadState({
          kind: "refusal",
          response: responseBody,
          refusal_code: refusalCode ?? "feedback_event_list_rejected",
          validation_failure_codes: validationFailureCodes,
        });
        return;
      }
      setLoadState({ kind: "success", response: responseBody });
    } catch {
      setLoadState({
        kind: "error",
        message: "Feedback event list request failed before a response was observed.",
        validation_failure_codes: ["feedback_event_list_request_failed"],
      });
    }
  }

  return (
    <section
      id="feedback-event-store-list-panel"
      className="perspective-inspector-section"
      aria-label="Feedback event history"
      data-feedback-event-route={routePath}
      data-feedback-event-route-method={routeMethod}
      data-feedback-event-list-panel="read-only"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <h3>Feedback event history</h3>
          <p>
            Read-only feedback event history panel. Feedback events are operator
            input only, not proof/evidence, not Perspective state, not work
            status, not retrieval/RAG result, and not product write.
          </p>
          <p>
            Browser request is available only as <code>GET</code>{" "}
            <code>{routePath}</code>. No feedback write, mutation control,
            persistent browser storage, auto refresh, provider/OpenAI call,
            source fetch, retrieval/RAG execution, Codex/GitHub automation,
            external handoff, Perspective promotion, work mutation, product
            write, or product ID allocation is available here. Product-write
            lane remains parked by #686.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">read-only</span>
          <span className="status-pill">GET-only</span>
          <span className="status-pill">local state only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          contract <code>{contract.contract_version}</code>
        </span>
        <span>
          request_version <code>{requestVersion}</code>
        </span>
        <span>
          route <code>{routePath}</code>
        </span>
        <span>
          route_method <code>{routeMethod}</code>
        </span>
        <span>
          next <code>{contract.next_recommended_slice}</code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid" aria-label="Feedback event list filters">
        <label>
          <span>event_type</span>
          <select
            value={filter.event_type ?? ""}
            onChange={(event) =>
              updateFilter("event_type", event.target.value as FeedbackEventStoreEventType | "")
            }
          >
            <option value="">all</option>
            {eventTypeOptions.map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>target_kind</span>
          <select
            value={filter.target_kind ?? ""}
            onChange={(event) =>
              updateFilter("target_kind", event.target.value as FeedbackEventStoreTargetKind | "")
            }
          >
            <option value="">all</option>
            {targetKindOptions.map((targetKind) => (
              <option key={targetKind} value={targetKind}>
                {targetKind}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>target_id</span>
          <input
            value={filter.target_id ?? ""}
            onChange={(event) => updateFilter("target_id", event.target.value)}
            placeholder="optional target id"
          />
        </label>
        <label>
          <span>created_after</span>
          <input
            value={filter.created_after ?? ""}
            onChange={(event) => updateFilter("created_after", event.target.value)}
            placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
          />
        </label>
        <label>
          <span>created_before</span>
          <input
            value={filter.created_before ?? ""}
            onChange={(event) => updateFilter("created_before", event.target.value)}
            placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
          />
        </label>
        <label>
          <span>limit</span>
          <input
            inputMode="numeric"
            value={String(filter.limit ?? defaultLimit)}
            onChange={(event) => updateFilter("limit", event.target.value)}
          />
        </label>
      </div>

      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          disabled={disabled || loadState.kind === "loading"}
          title={disabled ? disabledReason : "Read durable feedback events only."}
          onClick={() => {
            void loadFeedbackEvents();
          }}
        >
          Load feedback events
        </button>
        <small>
          Uses <code>{routeMethod}</code> with required read authority
          acknowledgements and <code>include_event_json=true</code>.
        </small>
      </div>
      {disabledReason ? <p>{disabledReason}</p> : null}

      <FeedbackEventListStatus loadState={loadState} />

      {loadState.kind === "success" ? (
        events.length > 0 ? (
          <div className="compact-list" aria-label="Feedback event history results">
            {events.map((event) => (
              <FeedbackEventRow
                key={event.event_id}
                event={event}
                duplicateNote={duplicateIndicators[event.event_id] ?? null}
              />
            ))}
          </div>
        ) : (
          <p>No feedback events match the selected read-only filters.</p>
        )
      ) : null}
    </section>
  );

  function updateFilter<Key extends keyof FeedbackEventStoreListPanelFilter>(
    key: Key,
    value: FeedbackEventStoreListPanelFilter[Key],
  ) {
    setFilter((current) => ({ ...current, [key]: value }));
  }
}

function FeedbackEventListStatus({ loadState }: { loadState: LoadState }) {
  if (loadState.kind === "idle") {
    return (
      <p>
        Feedback event history has not been loaded. Use the read-only load
        action to request durable feedback events.
      </p>
    );
  }
  if (loadState.kind === "loading") {
    return <p role="status">Loading feedback event history.</p>;
  }
  if (loadState.kind === "error") {
    return (
      <p role="alert">
        {loadState.message} validation failure codes{" "}
        <code>{loadState.validation_failure_codes.join(", ")}</code>
      </p>
    );
  }
  if (loadState.kind === "refusal") {
    return (
      <div role="alert">
        <p>
          Feedback event list route refused the request. refusal_code{" "}
          <code>{loadState.refusal_code}</code>
        </p>
        <p>
          validation failure codes{" "}
          <code>
            {loadState.validation_failure_codes.length > 0
              ? loadState.validation_failure_codes.join(", ")
              : "none"}
          </code>
        </p>
        {loadState.response.refusal?.message ? (
          <p>{loadState.response.refusal.message}</p>
        ) : null}
      </div>
    );
  }
  return (
    <p role="status">
      Loaded <code>{String(loadState.response.count ?? loadState.response.events?.length ?? 0)}</code>{" "}
      feedback events. Results remain local React state only.
    </p>
  );
}

function FeedbackEventRow({
  event,
  duplicateNote,
}: {
  event: FeedbackEventStoreEvent;
  duplicateNote: string | null;
}) {
  return (
    <article className="cockpit-surface-card">
      <div className="meta-row">
        <span>
          event_type <code>{event.event_type}</code>
        </span>
        <span>
          target_kind <code>{event.target_kind}</code>
        </span>
        <span>
          created_at <code>{event.created_at}</code>
        </span>
      </div>
      <h4>{event.target_id}</h4>
      <p>
        reason <code>{event.reason ?? "none"}</code>
      </p>
      <p>
        operator_note <code>{event.operator_note ?? "none"}</code>
      </p>
      {duplicateNote ? (
        <p>
          duplicate feedback indication <code>{duplicateNote}</code>
        </p>
      ) : null}
      <ListBlock title="source_ref_ids" values={event.source_ref_ids} />
      <div>
        <strong>authority_boundary summary</strong>
        <div className="perspective-workbench-status-row">
          {Object.entries(event.authority_boundary).map(([key, value]) => (
            <span key={key}>
              {key} <code>{String(value)}</code>
            </span>
          ))}
        </div>
      </div>
      <p>
        This row is operator input only; it is not proof/evidence, not
        Perspective state, not work status, not retrieval/RAG result, and not
        product write.
      </p>
    </article>
  );
}

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <strong>{title}</strong>
      {values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>
              <code>{value}</code>
            </li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
    </div>
  );
}

function buildQueryParams(filter: FeedbackEventStoreListPanelFilter) {
  const params = new URLSearchParams();
  params.set("request_version", requestVersion);
  params.set("include_event_json", "true");
  params.set("limit", String(clampLimit(filter.limit)));
  for (const acknowledgement of requiredAuthorityAcknowledgements) {
    params.append("authority_acknowledgements", acknowledgement);
  }
  assignQueryParam(params, "event_type", filter.event_type);
  assignQueryParam(params, "target_kind", filter.target_kind);
  assignQueryParam(params, "target_id", filter.target_id);
  assignQueryParam(params, "created_after", filter.created_after);
  assignQueryParam(params, "created_before", filter.created_before);
  return params.toString();
}

function assignQueryParam(
  params: URLSearchParams,
  key: keyof FeedbackEventStoreListUiRequestQueryParams,
  value: string | undefined,
) {
  const normalized = value?.trim();
  if (normalized) params.set(key, normalized);
}

function getContractDefaultLimit(contract: FeedbackEventStoreListUiContract) {
  const defaultLimit = contract.request_previews.find(
    (requestPreview) =>
      requestPreview.request_preview_id ===
      "feedback_event_store_list_ui_request_preview:list_all_feedback_events",
  )?.query_params.limit;
  return clampLimit(defaultLimit ?? "50");
}

function clampLimit(value: number | string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

function buildDuplicateIndicators(events: FeedbackEventStoreEvent[]) {
  const targetCounts = new Map<string, number>();
  const idempotencyCounts = new Map<string, number>();
  for (const event of events) {
    const targetKey = `${event.event_type}:${event.target_kind}:${event.target_id}`;
    targetCounts.set(targetKey, (targetCounts.get(targetKey) ?? 0) + 1);
    if (event.idempotency_key) {
      idempotencyCounts.set(
        event.idempotency_key,
        (idempotencyCounts.get(event.idempotency_key) ?? 0) + 1,
      );
    }
  }
  return events.reduce<Record<string, string>>((indicators, event) => {
    const targetKey = `${event.event_type}:${event.target_kind}:${event.target_id}`;
    if ((targetCounts.get(targetKey) ?? 0) > 1) {
      indicators[event.event_id] = "same event_type target_kind target_id appears multiple times";
      return indicators;
    }
    if (event.idempotency_key && (idempotencyCounts.get(event.idempotency_key) ?? 0) > 1) {
      indicators[event.event_id] = "same idempotency key appears multiple times";
      return indicators;
    }
    if (event.idempotency_key?.startsWith("feedback_event_store_idempotency:")) {
      indicators[event.event_id] = "feedback event idempotency key pattern observed";
    }
    return indicators;
  }, {});
}
