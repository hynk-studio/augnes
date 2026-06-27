"use client";

import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";

const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const uiVersion = "research_candidate_review_memory_db_ui_runtime.v0.1";
const scope = "project:augnes";
const defaultDbPath = ".tmp/research-candidate-review-memory/ui/review-memory.sqlite";
const collectionRoutePath = "/api/research-candidate-review/review-records";
const maxTextLength = 700;

const uiAuthorityBoundary = {
  review_memory_db_ui_now: true,
  db_backed_review_memory_routes_primary: true,
  explicit_operator_ui_action_only: true,
  same_origin_route_calls_only: true,
  review_record_save_ui_now: true,
  review_record_list_ui_now: true,
  review_record_detail_ui_now: true,
  review_record_activity_ui_now: true,
  review_record_discard_ui_now: true,
  direct_db_access_from_ui_now: false,
  direct_file_write_from_ui_now: false,
  legacy_json_route_primary_persistence_now: false,
  provider_openai_call_now: false,
  prompt_sent_now: false,
  source_fetch_now: false,
  retrieval_execution_now: false,
  rag_answer_generation_now: false,
  proof_or_evidence_record_now: false,
  claim_or_evidence_write_now: false,
  work_item_write_now: false,
  promotion_execution_now: false,
  durable_state_write_now: false,
  durable_state_apply_now: false,
  formation_receipt_write_now: false,
  product_write_now: false,
  product_write_runtime_now: false,
  product_write_adapter_enabled_now: false,
  product_id_allocation_now: false,
  product_persistence_now: false,
  git_ledger_export_runtime_now: false,
  git_write_now: false,
  github_api_call_now: false,
  github_pr_create_now: false,
  github_merge_now: false,
  repository_file_write_now: false,
  local_file_export_now: false,
  local_file_import_now: false,
  codex_execution_now: false,
  codex_execution_authority: false,
  github_automation_authority: false,
  product_write_authority: false,
  review_memory_is_truth: false,
  review_memory_is_proof: false,
  review_memory_is_accepted_evidence: false,
  review_memory_is_durable_perspective_state: false,
  candidate_is_fact: false,
  candidate_is_proof: false,
  source_ref_is_proof: false,
  discard_is_delete: false,
  smoke_pass_is_truth: false,
  ci_pass_is_truth: false,
} as const;

const boundaryNotes = [
  "Product-write remains parked by #686.",
  "Review memory is not truth, proof, accepted evidence, or durable Perspective state.",
  "Candidate refs are review refs, not facts.",
  "Source refs are lineage pointers, not proof.",
  "Discard is lifecycle transition, not delete.",
  "All persistence goes through DB-backed same-origin review memory routes.",
] as const;

const boundedRouteErrorCodes = [
  "same_origin_required",
  "invalid_db_path",
  "db_missing",
  "schema_missing",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "conflict_existing_record",
  "not_found",
] as const;

type ReviewDecision =
  | "none"
  | "keep_for_review"
  | "discard"
  | "supersede"
  | "needs_more_evidence"
  | "needs_operator_review";

type ReviewAction =
  | "save_review_note"
  | "defer_candidate"
  | "reject_candidate"
  | "request_more_evidence"
  | "mark_duplicate"
  | "mark_superseded"
  | "mark_needs_source_ref"
  | "prepare_promotion_later";

type RouteResponse = {
  route_version?: unknown;
  status?: "ok" | "error";
  action?: unknown;
  error_code?: unknown;
  result?: StoreResult;
  boundary_notes?: unknown;
  authority_boundary?: Record<string, unknown>;
};

type StoreResult = {
  status?: unknown;
  record?: ReviewRecord | null;
  records?: ReviewRecord[];
  activities?: ReviewActivity[];
  error_code?: unknown;
  reason_codes?: unknown;
  authority_boundary?: Record<string, unknown>;
};

type ReviewRecord = {
  review_record_id?: unknown;
  record_kind?: unknown;
  lifecycle_state?: unknown;
  review_decision?: unknown;
  review_action?: unknown;
  candidate_refs?: unknown;
  source_refs?: unknown;
  reviewer_actor?: unknown;
  reviewer_note_summary?: unknown;
  bounded_summary?: unknown;
  reason_codes?: unknown;
  updated_at?: unknown;
  discard_reason?: unknown;
  supersedes_record_ref?: unknown;
  superseded_by_record_ref?: unknown;
};

type ReviewActivity = {
  activity_id?: unknown;
  review_record_id?: unknown;
  activity_kind?: unknown;
  actor_ref?: unknown;
  summary?: unknown;
  created_at?: unknown;
  reason_codes?: unknown;
};

export function ResearchCandidateReviewMemoryDbPanel() {
  const [dbPath, setDbPath] = useState(defaultDbPath);
  const [recordId, setRecordId] = useState("ui-db-review-record-001");
  const [candidateRef, setCandidateRef] = useState("candidate-ref:ui-db-001");
  const [sourceRef, setSourceRef] = useState("source-ref:ui-db-001");
  const [reviewerActor, setReviewerActor] = useState("operator:review-memory-ui");
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>("keep_for_review");
  const [reviewAction, setReviewAction] = useState<ReviewAction>("save_review_note");
  const [reviewerNoteSummary, setReviewerNoteSummary] = useState(
    "Operator reviewed this candidate and kept bounded review memory only.",
  );
  const [boundedSummary, setBoundedSummary] = useState(
    "DB-backed UI sample saves public-safe review metadata through the review memory routes.",
  );
  const [relatedRecordRefs, setRelatedRecordRefs] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [includeDiscarded, setIncludeDiscarded] = useState(true);
  const [limit, setLimit] = useState("20");
  const [selectedRecordId, setSelectedRecordId] = useState("ui-db-review-record-001");
  const [activitySummary, setActivitySummary] = useState(
    "Operator added a bounded reviewer note summary.",
  );
  const [discardReason, setDiscardReason] = useState(
    "Operator discarded this review memory record as a lifecycle transition.",
  );
  const [lastResponse, setLastResponse] = useState<RouteResponse | null>(null);
  const [listResponse, setListResponse] = useState<RouteResponse | null>(null);
  const [detailResponse, setDetailResponse] = useState<RouteResponse | null>(null);
  const [activityResponse, setActivityResponse] = useState<RouteResponse | null>(null);
  const [uiStatus, setUiStatus] = useState("ready");
  const [packetPreview, setPacketPreview] = useState("");

  const records = useMemo(() => getRecords(listResponse), [listResponse]);
  const detailRecord = detailResponse?.result?.record ?? lastResponse?.result?.record ?? null;
  const activities = useMemo(
    () => getActivities(activityResponse ?? detailResponse ?? lastResponse),
    [activityResponse, detailResponse, lastResponse],
  );
  const routeAuthorityBoundary = lastResponse?.authority_boundary ?? null;
  const storeAuthorityBoundary = lastResponse?.result?.authority_boundary ?? null;
  const routeNotes = getStringList(lastResponse?.boundary_notes);
  const displayedNotes = routeNotes.length > 0 ? routeNotes : [...boundaryNotes];

  async function listReviewRecords() {
    const query = new URLSearchParams({
      route_version: routeVersion,
      scope,
      db_path: dbPath,
      include_discarded: includeDiscarded ? "1" : "0",
    });
    appendQueryIfPresent(query, "lifecycle_state", lifecycleFilter);
    appendQueryIfPresent(query, "review_decision", decisionFilter);
    appendQueryIfPresent(query, "candidate_ref", candidateFilter);
    appendQueryIfPresent(query, "source_ref", sourceFilter);
    appendQueryIfPresent(query, "limit", limit);
    const response = await requestDbRoute(`${collectionRoutePath}?${query.toString()}`, {
      method: "GET",
    });
    setListResponse(response);
  }

  async function saveReviewRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const timestamp = new Date().toISOString();
    const candidateRefs = splitRefs(candidateRef);
    const relatedRefs = splitRefs(relatedRecordRefs);
    if (!recordId.trim() || candidateRefs.length === 0 || !sourceRef.trim()) {
      setUiStatus("blocked_invalid_input");
      return;
    }
    if (
      !allSafeText([
        recordId,
        sourceRef,
        reviewerActor,
        reviewerNoteSummary,
        boundedSummary,
        ...candidateRefs,
        ...relatedRefs,
      ])
    ) {
      setUiStatus("blocked_private_or_raw_payload");
      return;
    }
    const input = {
      contract_version: "research_candidate_review_memory_contract.v0.1",
      scope,
      status: "review_memory_db_record",
      review_record_id: recordId.trim(),
      record_kind: "operator_review_note",
      lifecycle_state: "active",
      review_decision: reviewDecision,
      review_action: reviewAction,
      candidate_ref: candidateRefs[0],
      candidate_refs: candidateRefs,
      source_refs: [
        {
          source_surface: "operator_note",
          source_ref: sourceRef.trim(),
          public_safe: true,
        },
      ],
      related_record_refs: relatedRefs,
      reviewer_actor: reviewerActor.trim(),
      operator_actor_ref: reviewerActor.trim(),
      reviewer_note_summary: reviewerNoteSummary.trim(),
      bounded_summary: boundedSummary.trim(),
      boundary_acknowledgements: [...boundaryNotes],
      privacy_report: buildPublicSafePrivacyReport(),
      reason_codes: [
        "review_record_created",
        "candidate_refs_are_review_refs_not_fact",
        "source_refs_are_lineage_not_proof",
        "review_memory_not_truth",
        "review_memory_not_proof",
        "review_memory_not_accepted_evidence",
        "review_memory_not_durable_state",
        "product_write_denied",
      ],
      created_at: timestamp,
      updated_at: timestamp,
    };
    const response = await requestDbRoute(collectionRoutePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route_version: routeVersion,
        scope,
        action: "create_review_record",
        db_path: dbPath,
        input,
      }),
    });
    if (response.status === "ok") {
      setSelectedRecordId(recordId.trim());
      setDetailResponse(response);
      await listReviewRecords();
    }
  }

  async function openReviewRecord(targetRecordId = selectedRecordId) {
    const safeRecordId = targetRecordId.trim();
    if (!safeRecordId || !isSafeDisplayText(safeRecordId)) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    const query = new URLSearchParams({ route_version: routeVersion, scope, db_path: dbPath });
    const response = await requestDbRoute(
      `${collectionRoutePath}/${encodeURIComponent(safeRecordId)}?${query.toString()}`,
      { method: "GET" },
    );
    setDetailResponse(response);
    await loadActivityHistory(safeRecordId);
  }

  async function loadActivityHistory(targetRecordId = selectedRecordId) {
    const safeRecordId = targetRecordId.trim();
    if (!safeRecordId || !isSafeDisplayText(safeRecordId)) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    const query = new URLSearchParams({ route_version: routeVersion, scope, db_path: dbPath });
    const response = await requestDbRoute(
      `${collectionRoutePath}/${encodeURIComponent(safeRecordId)}/activity?${query.toString()}`,
      { method: "GET" },
    );
    setActivityResponse(response);
  }

  async function appendReviewerNoteSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeRecordId = selectedRecordId.trim();
    if (!safeRecordId || !activitySummary.trim()) {
      setUiStatus("invalid_activity_input");
      return;
    }
    if (!allSafeText([safeRecordId, reviewerActor, activitySummary])) {
      setUiStatus("blocked_private_or_raw_payload");
      return;
    }
    const timestamp = new Date().toISOString();
    const input = {
      activity_id: `${safeRecordId}:activity:ui-note:${compactTimestamp(timestamp)}`,
      review_record_id: safeRecordId,
      activity_kind: "review_record_activity_appended",
      actor_ref: reviewerActor.trim(),
      summary: activitySummary.trim(),
      reason_codes: [
        "review_record_activity_appended",
        "review_memory_not_truth",
        "review_memory_not_proof",
      ],
      created_at: timestamp,
    };
    const response = await requestDbRoute(
      `${collectionRoutePath}/${encodeURIComponent(safeRecordId)}/activity`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_version: routeVersion,
          scope,
          action: "append_review_record_activity",
          db_path: dbPath,
          input,
        }),
      },
    );
    setActivityResponse(response);
    if (response.status === "ok") await loadActivityHistory(safeRecordId);
  }

  async function discardReviewRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeRecordId = selectedRecordId.trim();
    if (!safeRecordId || !discardReason.trim()) {
      setUiStatus("invalid_discard_reason");
      return;
    }
    if (!allSafeText([safeRecordId, discardReason])) {
      setUiStatus("blocked_private_or_raw_payload");
      return;
    }
    const response = await requestDbRoute(
      `${collectionRoutePath}/${encodeURIComponent(safeRecordId)}/discard`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_version: routeVersion,
          scope,
          action: "discard_review_record",
          db_path: dbPath,
          reason: discardReason.trim(),
        }),
      },
    );
    if (response.status === "ok") {
      await openReviewRecord(safeRecordId);
      await listReviewRecords();
    }
  }

  async function requestDbRoute(input: string, init: RequestInit): Promise<RouteResponse> {
    if (!isAllowedDbPath(dbPath)) {
      const response = buildUiErrorResponse("invalid_db_path");
      setLastResponse(response);
      setUiStatus("invalid_db_path");
      return response;
    }
    try {
      const response = await fetch(input, init);
      const body = (await response.json()) as RouteResponse;
      const boundedResponse = {
        ...body,
        status: body.status === "ok" ? "ok" : "error",
      } satisfies RouteResponse;
      setLastResponse(boundedResponse);
      setUiStatus(
        boundedResponse.error_code
          ? safeDisplayText(boundedResponse.error_code)
          : safeDisplayText(boundedResponse.result?.status ?? "ok"),
      );
      return boundedResponse;
    } catch {
      const response = buildUiErrorResponse("route_request_failed");
      setLastResponse(response);
      setUiStatus("route_request_failed");
      return response;
    }
  }

  function handleDbPathChange(value: string) {
    if (value.length > 180 || !isEditableDbPathText(value)) {
      setUiStatus("invalid_db_path");
      return;
    }
    setDbPath(value);
  }

  function handleSafeTextChange(value: string, setter: (nextValue: string) => void) {
    if (value.length > maxTextLength || !isSafeDisplayText(value)) {
      setUiStatus("blocked_private_or_raw_payload");
      return;
    }
    setter(value);
  }

  function copyReviewPacket() {
    const record = detailRecord ?? records[0] ?? null;
    const packet = [
      `ui_version: ${uiVersion}`,
      `db_path: ${defaultDbPath}`,
      `route: ${collectionRoutePath}`,
      `selected_record: ${safeDisplayText(record?.review_record_id ?? selectedRecordId)}`,
      `route_status: ${safeDisplayText(lastResponse?.status ?? "not_loaded")}`,
      `store_status: ${safeDisplayText(lastResponse?.result?.status ?? "not_loaded")}`,
      "review_memory_is_truth: false",
      "source_ref_is_proof: false",
      "candidate_is_fact: false",
      "discard_is_delete: false",
    ].join("\n");
    setPacketPreview(packet);
    void navigator.clipboard?.writeText(packet).catch(() => undefined);
  }

  return (
    <section
      style={surfaceStyle}
      data-augnes-surface="research-candidate-review-memory-db-ui-runtime"
      data-db-backed-review-memory-routes-primary="true"
    >
      <section style={boundaryBandStyle} aria-label="DB review memory boundary">
        {boundaryNotes.map((note) => (
          <span key={note} style={boundaryPillStyle}>
            {note}
          </span>
        ))}
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="DB route controls">
          <h2 style={sectionHeadingStyle}>DB Route Controls</h2>
          <label style={labelStyle} htmlFor="review-memory-db-path">
            local/dev review memory DB path
          </label>
          <input
            id="review-memory-db-path"
            value={dbPath}
            onChange={(event) => handleDbPathChange(event.target.value)}
            style={inputStyle}
            spellCheck={false}
          />
          <p style={hintStyle}>
            Relative SQLite path only. Allowed prefixes:
            tmp/research-candidate-review-memory/ and
            .tmp/research-candidate-review-memory/. This is review memory storage, not product
            storage.
          </p>
          <div style={buttonRowStyle}>
            <button type="button" onClick={listReviewRecords} style={buttonStyle}>
              List review records
            </button>
            <button type="button" onClick={copyReviewPacket} style={secondaryButtonStyle}>
              Copy review packet
            </button>
          </div>
        </section>

        <section style={panelStyle} aria-label="DB route status">
          <h2 style={sectionHeadingStyle}>Route Status</h2>
          <dl style={statusGridStyle}>
            <StatusItem label="ui_version" value={uiVersion} />
            <StatusItem label="route_version" value={routeVersion} />
            <StatusItem label="ui_status" value={uiStatus} />
            <StatusItem label="route_status" value={lastResponse?.status ?? "not_loaded"} />
            <StatusItem label="error_code" value={lastResponse?.error_code ?? "none"} />
            <StatusItem label="store_status" value={lastResponse?.result?.status ?? "not_loaded"} />
          </dl>
          <div style={codeListStyle} aria-label="Bounded route error codes">
            {boundedRouteErrorCodes.map((code) => (
              <code key={code} style={codePillStyle}>
                {code}
              </code>
            ))}
          </div>
        </section>
      </section>

      <form style={panelStyle} onSubmit={saveReviewRecord} aria-label="Save review record">
        <h2 style={sectionHeadingStyle}>Save Review Record</h2>
        <section style={formGridStyle}>
          <Field
            id="review-memory-record-id"
            label="review_record_id"
            value={recordId}
            onChange={setRecordId}
            onSafeChange={handleSafeTextChange}
          />
          <Field
            id="review-memory-candidate-ref"
            label="candidate_refs"
            value={candidateRef}
            onChange={setCandidateRef}
            onSafeChange={handleSafeTextChange}
          />
          <Field
            id="review-memory-source-ref"
            label="source_ref"
            value={sourceRef}
            onChange={setSourceRef}
            onSafeChange={handleSafeTextChange}
          />
          <Field
            id="review-memory-reviewer-actor"
            label="reviewer_actor"
            value={reviewerActor}
            onChange={setReviewerActor}
            onSafeChange={handleSafeTextChange}
          />
          <label style={labelStackStyle} htmlFor="review-memory-review-decision">
            <span style={labelStyle}>review_decision</span>
            <select
              id="review-memory-review-decision"
              value={reviewDecision}
              onChange={(event) => setReviewDecision(event.target.value as ReviewDecision)}
              style={inputStyle}
            >
              {[
                "none",
                "keep_for_review",
                "discard",
                "supersede",
                "needs_more_evidence",
                "needs_operator_review",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStackStyle} htmlFor="review-memory-review-action">
            <span style={labelStyle}>review_action</span>
            <select
              id="review-memory-review-action"
              value={reviewAction}
              onChange={(event) => setReviewAction(event.target.value as ReviewAction)}
              style={inputStyle}
            >
              {[
                "save_review_note",
                "defer_candidate",
                "reject_candidate",
                "request_more_evidence",
                "mark_duplicate",
                "mark_superseded",
                "mark_needs_source_ref",
                "prepare_promotion_later",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </section>
        <label style={labelStackStyle} htmlFor="reviewer-note-summary">
          <span style={labelStyle}>reviewer_note_summary</span>
          <textarea
            id="reviewer-note-summary"
            value={reviewerNoteSummary}
            onChange={(event) =>
              handleSafeTextChange(event.target.value, setReviewerNoteSummary)
            }
            style={smallTextareaStyle}
            spellCheck={false}
          />
        </label>
        <label style={labelStackStyle} htmlFor="bounded-summary">
          <span style={labelStyle}>bounded_summary</span>
          <textarea
            id="bounded-summary"
            value={boundedSummary}
            onChange={(event) => handleSafeTextChange(event.target.value, setBoundedSummary)}
            style={smallTextareaStyle}
            spellCheck={false}
          />
        </label>
        <label style={labelStackStyle} htmlFor="related-record-refs">
          <span style={labelStyle}>related_record_refs</span>
          <input
            id="related-record-refs"
            value={relatedRecordRefs}
            onChange={(event) => handleSafeTextChange(event.target.value, setRelatedRecordRefs)}
            style={inputStyle}
            spellCheck={false}
          />
        </label>
        <button type="submit" style={buttonStyle}>
          Save review record
        </button>
      </form>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Review record filters">
          <h2 style={sectionHeadingStyle}>List Filters</h2>
          <section style={formGridStyle}>
            <Field
              id="lifecycle-filter"
              label="lifecycle_state"
              value={lifecycleFilter}
              onChange={setLifecycleFilter}
              onSafeChange={handleSafeTextChange}
            />
            <Field
              id="decision-filter"
              label="review_decision"
              value={decisionFilter}
              onChange={setDecisionFilter}
              onSafeChange={handleSafeTextChange}
            />
            <Field
              id="candidate-filter"
              label="candidate_ref"
              value={candidateFilter}
              onChange={setCandidateFilter}
              onSafeChange={handleSafeTextChange}
            />
            <Field
              id="source-filter"
              label="source_ref"
              value={sourceFilter}
              onChange={setSourceFilter}
              onSafeChange={handleSafeTextChange}
            />
            <Field
              id="limit-filter"
              label="limit"
              value={limit}
              onChange={setLimit}
              onSafeChange={handleSafeTextChange}
            />
            <label style={checkboxStyle} htmlFor="include-discarded">
              <input
                id="include-discarded"
                type="checkbox"
                checked={includeDiscarded}
                onChange={(event) => setIncludeDiscarded(event.target.checked)}
              />
              include_discarded
            </label>
          </section>
        </section>

        <section style={panelStyle} aria-label="Review memory records">
          <h2 style={sectionHeadingStyle}>Review Records</h2>
          <div style={recordListStyle}>
            {records.length === 0 ? (
              <p style={hintStyle}>No DB-backed review records loaded.</p>
            ) : (
              records.map((record) => {
                const id = safeDisplayText(record.review_record_id);
                return (
                  <button
                    key={id}
                    type="button"
                    style={recordButtonStyle}
                    onClick={() => {
                      setSelectedRecordId(id);
                      void openReviewRecord(id);
                    }}
                  >
                    <span style={recordTitleStyle}>{id}</span>
                    <span>{safeDisplayText(record.lifecycle_state)}</span>
                    <span>{safeDisplayText(record.review_decision)}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Review record detail">
          <h2 style={sectionHeadingStyle}>Record Detail</h2>
          <label style={labelStyle} htmlFor="selected-record-id">
            selected review_record_id
          </label>
          <div style={buttonInputRowStyle}>
            <input
              id="selected-record-id"
              value={selectedRecordId}
              onChange={(event) => handleSafeTextChange(event.target.value, setSelectedRecordId)}
              style={inputStyle}
              spellCheck={false}
            />
            <button type="button" onClick={() => openReviewRecord()} style={buttonStyle}>
              Open detail
            </button>
          </div>
          <RecordDetail record={detailRecord} />
        </section>

        <section style={panelStyle} aria-label="Review record activity">
          <h2 style={sectionHeadingStyle}>Activity History</h2>
          <button type="button" onClick={() => loadActivityHistory()} style={secondaryButtonStyle}>
            Load activity
          </button>
          <ActivityList activities={activities} />
        </section>
      </section>

      <section style={gridStyle}>
        <form
          style={panelStyle}
          onSubmit={appendReviewerNoteSummary}
          aria-label="Add reviewer note summary"
        >
          <h2 style={sectionHeadingStyle}>Add Reviewer Note Summary</h2>
          <textarea
            value={activitySummary}
            onChange={(event) => handleSafeTextChange(event.target.value, setActivitySummary)}
            style={smallTextareaStyle}
            spellCheck={false}
          />
          <button type="submit" style={buttonStyle}>
            Add reviewer note summary
          </button>
        </form>

        <form style={panelStyle} onSubmit={discardReviewRecord} aria-label="Discard with reason">
          <h2 style={sectionHeadingStyle}>Discard With Reason</h2>
          <p style={hintStyle}>Discard is lifecycle transition, not delete.</p>
          <textarea
            value={discardReason}
            onChange={(event) => handleSafeTextChange(event.target.value, setDiscardReason)}
            style={smallTextareaStyle}
            spellCheck={false}
          />
          <button type="submit" style={dangerButtonStyle}>
            Discard with reason
          </button>
        </form>
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Authority boundary">
          <h2 style={sectionHeadingStyle}>Authority Boundary</h2>
          <BoundaryMap title="UI authority" value={uiAuthorityBoundary} />
          <BoundaryMap title="Route authority" value={routeAuthorityBoundary} />
          <BoundaryMap title="Store authority" value={storeAuthorityBoundary} />
        </section>

        <section style={panelStyle} aria-label="Boundary notes and packet">
          <h2 style={sectionHeadingStyle}>Boundary Notes</h2>
          <ul style={listStyle}>
            {displayedNotes.map((note) => (
              <li key={note}>{safeDisplayText(note)}</li>
            ))}
          </ul>
          {packetPreview ? (
            <pre style={packetStyle} aria-label="Copied review packet preview">
              {packetPreview}
            </pre>
          ) : null}
        </section>
      </section>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onSafeChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  onSafeChange: (value: string, setter: (nextValue: string) => void) => void;
}) {
  return (
    <label style={labelStackStyle} htmlFor={id}>
      <span style={labelStyle}>{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onSafeChange(event.target.value, onChange)}
        style={inputStyle}
        spellCheck={false}
      />
    </label>
  );
}

function StatusItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={statusItemStyle}>
      <dt style={statusLabelStyle}>{label}</dt>
      <dd style={statusValueStyle}>{safeDisplayText(value)}</dd>
    </div>
  );
}

function RecordDetail({ record }: { record: ReviewRecord | null }) {
  if (!record) return <p style={hintStyle}>Open a DB-backed review record to inspect detail.</p>;
  return (
    <dl style={detailGridStyle}>
      <StatusItem label="review_record_id" value={record.review_record_id} />
      <StatusItem label="lifecycle_state" value={record.lifecycle_state} />
      <StatusItem label="review_decision" value={record.review_decision} />
      <StatusItem label="review_action" value={record.review_action} />
      <StatusItem label="reviewer_note_summary" value={record.reviewer_note_summary} />
      <StatusItem label="bounded_summary" value={record.bounded_summary} />
      <StatusItem label="discard_reason" value={record.discard_reason} />
      <StatusItem label="supersedes_record_ref" value={record.supersedes_record_ref} />
      <StatusItem label="superseded_by_record_ref" value={record.superseded_by_record_ref} />
      <div style={wideDetailStyle}>
        <h3 style={minorHeadingStyle}>candidate_refs</h3>
        <RefList refs={record.candidate_refs} />
      </div>
      <div style={wideDetailStyle}>
        <h3 style={minorHeadingStyle}>source_refs</h3>
        <SourceRefList refs={record.source_refs} />
      </div>
    </dl>
  );
}

function ActivityList({ activities }: { activities: ReviewActivity[] }) {
  if (activities.length === 0) return <p style={hintStyle}>No activity history loaded.</p>;
  return (
    <ol style={activityListStyle}>
      {activities.map((activity, index) => (
        <li key={`${safeDisplayText(activity.activity_id)}-${index}`} style={activityItemStyle}>
          <strong>{safeDisplayText(activity.activity_kind)}</strong>
          <span>{safeDisplayText(activity.summary)}</span>
          <code style={inlineCodeStyle}>{safeDisplayText(activity.created_at)}</code>
        </li>
      ))}
    </ol>
  );
}

function BoundaryMap({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  const entries = Object.entries(value ?? {}).slice(0, 48);
  return (
    <section style={boundaryMapStyle}>
      <h3 style={minorHeadingStyle}>{title}</h3>
      {entries.length === 0 ? (
        <p style={hintStyle}>not_loaded</p>
      ) : (
        <div style={boundaryFlagGridStyle}>
          {entries.map(([key, boundaryValue]) => (
            <span key={key} style={boundaryFlagStyle}>
              {key}: {safeDisplayText(boundaryValue)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function RefList({ refs }: { refs: unknown }) {
  const values = Array.isArray(refs) ? refs.map((ref) => safeDisplayText(ref)) : [];
  if (values.length === 0) return <p style={hintStyle}>none</p>;
  return (
    <ul style={compactListStyle}>
      {values.map((ref) => (
        <li key={ref}>{ref}</li>
      ))}
    </ul>
  );
}

function SourceRefList({ refs }: { refs: unknown }) {
  const values = Array.isArray(refs) ? refs : [];
  if (values.length === 0) return <p style={hintStyle}>none</p>;
  return (
    <ul style={compactListStyle}>
      {values.map((ref, index) => {
        const source = isObjectRecord(ref) ? ref : {};
        return (
          <li key={`${safeDisplayText(source.source_ref)}-${index}`}>
            {safeDisplayText(source.source_surface)} / {safeDisplayText(source.source_ref)} /
            public_safe={safeDisplayText(source.public_safe)}
          </li>
        );
      })}
    </ul>
  );
}

function buildPublicSafePrivacyReport() {
  return {
    privacy_class: "public_safe",
    public_safe: true,
    raw_conversation_included: false,
    hidden_reasoning_included: false,
    raw_source_body_included: false,
    raw_candidate_payload_included: false,
    raw_provider_output_included: false,
    provider_thread_run_session_ids_included: false,
    private_urls_included: false,
    local_private_paths_included: false,
    secrets_included: false,
    raw_db_rows_included: false,
    raw_browser_dump_included: false,
    blocked_reason_codes: [],
  };
}

function appendQueryIfPresent(query: URLSearchParams, key: string, value: string) {
  if (value.trim()) query.set(key, value.trim());
}

function getRecords(response: RouteResponse | null): ReviewRecord[] {
  return Array.isArray(response?.result?.records) ? response.result.records : [];
}

function getActivities(response: RouteResponse | null): ReviewActivity[] {
  return Array.isArray(response?.result?.activities) ? response.result.activities : [];
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => safeDisplayText(item));
}

function splitRefs(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function compactTimestamp(timestamp: string): string {
  return timestamp.replace(/[^0-9TZ]/g, "").toLowerCase();
}

function allSafeText(values: string[]): boolean {
  return values.every((value) => value.length <= maxTextLength && isSafeDisplayText(value));
}

function isAllowedDbPath(value: string): boolean {
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (!isEditableDbPathText(value)) return false;
  return (
    value.startsWith("tmp/research-candidate-review-memory/") ||
    value.startsWith(".tmp/research-candidate-review-memory/")
  );
}

function isEditableDbPathText(value: string): boolean {
  if (value.includes("\\") || value.includes("..") || value.includes("\0")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("://") || value.includes("//")) return false;
  return isSafeDisplayText(value);
}

function isSafeDisplayText(value: unknown): boolean {
  if (typeof value !== "string") return true;
  if (value.length > 1200) return false;
  return ![
    /SAFE_MARKER_/i,
    /private[_ ]?url/i,
    /local[_ ]?private[_ ]?path/i,
    /raw[_ ]?source[_ ]?body/i,
    /raw[_ ]?provider[_ ]?output/i,
    /raw[_ ]?retrieval[_ ]?output/i,
    /raw[_ ]?conversation/i,
    /hidden[_ ]?reasoning/i,
    /raw[_ ]?db[_ ]?row/i,
    /telemetry[_ ]?dump/i,
    /browser[_ ]?dump/i,
    /\btoken\b/i,
    /\bsecret\b/i,
    /password:/i,
    /sk-[A-Za-z0-9]/i,
    /ghp_[A-Za-z0-9]/i,
  ].some((pattern) => pattern.test(value));
}

function safeDisplayText(value: unknown, fallback = "blocked_unsafe_display_text"): string {
  if (value === undefined || value === null || value === "") return "none";
  const text = typeof value === "string" ? value : String(value);
  return isSafeDisplayText(text) ? text : fallback;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function buildUiErrorResponse(errorCode: string): RouteResponse {
  return {
    route_version: routeVersion,
    status: "error",
    action: "list_review_records",
    error_code: errorCode,
    boundary_notes: [...boundaryNotes],
    authority_boundary: uiAuthorityBoundary,
  };
}

const surfaceStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "grid",
  gap: "16px",
};

const boundaryBandStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "12px",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  background: "#ffffff",
};

const boundaryPillStyle: CSSProperties = {
  padding: "6px 8px",
  borderRadius: "6px",
  background: "#eef3f8",
  color: "#24364f",
  fontSize: "12px",
  fontWeight: 700,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
  gap: "16px",
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  alignContent: "start",
  padding: "16px",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  background: "#ffffff",
  minWidth: 0,
};

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.25,
  letterSpacing: "0",
};

const minorHeadingStyle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: "13px",
  lineHeight: 1.3,
  letterSpacing: "0",
  color: "#40516a",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: "10px",
};

const labelStackStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
};

const labelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#45566e",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #c8d1dc",
  borderRadius: "6px",
  padding: "9px 10px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "13px",
  color: "#18212f",
};

const smallTextareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "84px",
  resize: "vertical",
};

const hintStyle: CSSProperties = {
  margin: 0,
  color: "#56667c",
  fontSize: "13px",
  lineHeight: 1.5,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const buttonStyle: CSSProperties = {
  minHeight: "36px",
  border: "1px solid #274568",
  borderRadius: "6px",
  padding: "8px 12px",
  background: "#274568",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#274568",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonStyle,
  borderColor: "#9a3412",
  background: "#9a3412",
};

const statusGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
  gap: "8px",
  margin: 0,
};

const statusItemStyle: CSSProperties = {
  minWidth: 0,
  padding: "8px",
  border: "1px solid #e0e5ec",
  borderRadius: "6px",
  background: "#f9fbfd",
};

const statusLabelStyle: CSSProperties = {
  margin: "0 0 4px",
  color: "#627086",
  fontSize: "11px",
  fontWeight: 700,
};

const statusValueStyle: CSSProperties = {
  margin: 0,
  overflowWrap: "anywhere",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
};

const codeListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
};

const codePillStyle: CSSProperties = {
  padding: "4px 6px",
  borderRadius: "6px",
  background: "#f1f5f9",
  color: "#31445f",
  fontSize: "11px",
};

const checkboxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#45566e",
  fontSize: "13px",
  fontWeight: 700,
};

const recordListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  maxHeight: "360px",
  overflow: "auto",
};

const recordButtonStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.4fr) auto auto",
  gap: "8px",
  alignItems: "center",
  width: "100%",
  textAlign: "left",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  padding: "10px",
  background: "#ffffff",
  color: "#26384f",
  cursor: "pointer",
};

const recordTitleStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  fontWeight: 700,
};

const buttonInputRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: "8px",
  alignItems: "center",
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
  gap: "8px",
  margin: 0,
};

const wideDetailStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minWidth: 0,
  padding: "8px",
  border: "1px solid #e0e5ec",
  borderRadius: "6px",
  background: "#f9fbfd",
};

const compactListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#334155",
  overflowWrap: "anywhere",
  fontSize: "12px",
};

const activityListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  margin: 0,
  paddingLeft: "18px",
};

const activityItemStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  overflowWrap: "anywhere",
  color: "#334155",
  fontSize: "13px",
};

const inlineCodeStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "11px",
  color: "#56667c",
};

const boundaryMapStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const boundaryFlagGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
};

const boundaryFlagStyle: CSSProperties = {
  padding: "5px 7px",
  border: "1px solid #d7dde6",
  borderRadius: "6px",
  color: "#31445f",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "11px",
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#334155",
  lineHeight: 1.55,
};

const packetStyle: CSSProperties = {
  margin: 0,
  padding: "10px",
  border: "1px solid #d7dde6",
  borderRadius: "6px",
  background: "#f9fbfd",
  overflow: "auto",
  fontSize: "12px",
};
