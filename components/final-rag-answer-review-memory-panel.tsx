"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

const uiVersion = "final_answer_candidate_review_ui_binding.v0.1";
const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const scope = "project:augnes";
const defaultDbPath = ".tmp/research-candidate-review-memory/final-answer-review-ui/review-memory.sqlite";
const collectionRoutePath = "/api/research-candidate-review/review-records";
const maxTextLength = 280;
const maxExcerptLength = 360;

const uiAuthorityBoundary = {
  final_answer_candidate_review_ui_binding_now: true,
  read_display_only_ui_now: true,
  explicit_operator_read_action_only: true,
  same_origin_get_route_calls_only: true,
  db_backed_review_memory_routes_primary: true,
  review_memory_db_read_now: true,
  final_answer_candidate_review_memory_display_now: true,
  bounded_review_memory_record_display_now: true,
  bounded_activity_display_now: true,
  source_refs_lineage_only: true,
  no_truth_language_required: true,
  no_proof_language_required: true,
  post_route_call_now: false,
  review_memory_write_now: false,
  review_record_create_now: false,
  review_record_activity_write_now: false,
  review_record_discard_now: false,
  final_answer_generation_now: false,
  provider_openai_call_now: false,
  prompt_sent_now: false,
  source_fetch_now: false,
  retrieval_execution_now: false,
  retrieval_index_write_now: false,
  proof_or_evidence_record_now: false,
  claim_or_evidence_write_now: false,
  promotion_execution_now: false,
  durable_state_write_now: false,
  durable_state_apply_now: false,
  formation_receipt_write_now: false,
  product_write_now: false,
  accepted_evidence_ref_write_now: false,
  product_write_runtime_now: false,
  product_write_adapter_enabled_now: false,
  product_id_allocation_now: false,
  broad_product_persistence_now: false,
  product_persistence_now: false,
  git_write_now: false,
  github_api_call_now: false,
  repository_file_write_now: false,
  release_execution_now: false,
  codex_execution_now: false,
  codex_execution_authority: false,
  github_automation_authority: false,
  product_write_authority: false,
  review_memory_is_truth: false,
  review_memory_is_proof: false,
  review_memory_is_accepted_evidence: false,
  review_memory_is_durable_perspective_state: false,
  final_answer_candidate_is_truth: false,
  final_answer_candidate_is_proof: false,
  final_answer_candidate_is_accepted_evidence: false,
  final_answer_candidate_is_promotion: false,
  final_answer_candidate_is_product: false,
  source_ref_is_proof: false,
  smoke_pass_is_truth: false,
  ci_pass_is_truth: false,
} as const;

const boundaryNotes = [
  "Review Memory is not truth.",
  "Review Memory is not proof.",
  "Review Memory is not accepted evidence.",
  "Review Memory is not durable Perspective state.",
  "Final answer candidate remains candidate-only.",
  "Source refs are lineage pointers, not proof.",
  "Operator review note is review memory, not authority for promotion or product-write.",
  "This UI is read/display only.",
  "This UI does not create, modify, discard, promote, product-write, or write accepted evidence refs.",
  "Smoke/CI pass is not truth.",
] as const;

const boundedRouteErrorCodes = [
  "same_origin_required",
  "invalid_db_path",
  "db_missing",
  "schema_missing",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "not_found",
  "route_request_failed",
] as const;

const explicitUnsafeDisplayTextMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "http://localhost",
  "https://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1",
  "http://0.0.0.0",
  "https://0.0.0.0",
  "https://private.example",
  "https://internal.example",
  "https://internal.example/path",
  "https://foo.internal.example",
  "https://intranet.example",
  "https://corp.example",
  "https://corp.example/path",
  "https://example.local",
  "github_pat_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "provider_thread_id",
  "provider_run_id",
  "provider_session_id",
  "thread_",
  "run_",
  "session_",
  "connector_id",
  "uploaded_file_id",
  "raw DB row",
  "raw_db_row",
  "raw-db-row",
  "raw db row:",
  "github_payload",
  "GitHub payload",
  "github-payload",
] as const;

const explicitUnsafeDisplayTextPatterns = explicitUnsafeDisplayTextMarkers.map(
  (marker) => new RegExp(escapeRegExp(marker), "i"),
);

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
  boundary_acknowledgements?: unknown;
  reason_codes?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
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

export function FinalRagAnswerReviewMemoryPanel() {
  const [dbPath, setDbPath] = useState(defaultDbPath);
  const [candidateFilter, setCandidateFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [listResponse, setListResponse] = useState<RouteResponse | null>(null);
  const [detailResponse, setDetailResponse] = useState<RouteResponse | null>(null);
  const [activityResponse, setActivityResponse] = useState<RouteResponse | null>(null);
  const [lastResponse, setLastResponse] = useState<RouteResponse | null>(null);
  const [uiStatus, setUiStatus] = useState("ready");
  const [packetPreview, setPacketPreview] = useState("");

  const records = useMemo(() => getRecords(listResponse), [listResponse]);
  const matchingRecords = useMemo(() => records.filter(isFinalAnswerCandidateReviewMemoryRecord), [records]);
  const detailRecord = detailResponse?.result?.record ?? null;
  const activities = useMemo(() => getActivities(activityResponse), [activityResponse]);
  const displayedRecord = detailRecord ?? matchingRecords[0] ?? null;
  const routeAuthorityBoundary = lastResponse?.authority_boundary ?? null;
  const storeAuthorityBoundary = lastResponse?.result?.authority_boundary ?? null;

  async function listReviewRecords() {
    if (!validateReadInputs()) return;
    const query = new URLSearchParams({
      route_version: routeVersion,
      scope,
      db_path: dbPath,
      include_discarded: "1",
      limit: "50",
    });
    appendQueryIfPresent(query, "candidate_ref", candidateFilter);
    appendQueryIfPresent(query, "source_ref", sourceFilter);
    const response = await requestGetRoute(`${collectionRoutePath}?${query.toString()}`);
    setListResponse(response);
    const loadedRecords = getRecords(response).filter(isFinalAnswerCandidateReviewMemoryRecord);
    if (loadedRecords[0]?.review_record_id) {
      setSelectedRecordId(safeDisplayText(loadedRecords[0].review_record_id));
    }
  }

  async function openSelectedRecord(targetRecordId = selectedRecordId) {
    const reviewRecordId = targetRecordId.trim();
    if (!reviewRecordId || !isSafeDisplayText(reviewRecordId)) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    if (!validateDbPathOnly()) return;
    const query = new URLSearchParams({ route_version: routeVersion, scope, db_path: dbPath });
    const response = await requestGetRoute(
      `${collectionRoutePath}/${encodeURIComponent(reviewRecordId)}?${query.toString()}`,
    );
    setDetailResponse(response);
  }

  async function loadActivityHistory(targetRecordId = selectedRecordId) {
    const reviewRecordId = targetRecordId.trim();
    if (!reviewRecordId || !isSafeDisplayText(reviewRecordId)) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    if (!validateDbPathOnly()) return;
    const query = new URLSearchParams({ route_version: routeVersion, scope, db_path: dbPath });
    const response = await requestGetRoute(
      `${collectionRoutePath}/${encodeURIComponent(reviewRecordId)}/activity?${query.toString()}`,
    );
    setActivityResponse(response);
  }

  async function requestGetRoute(route: string): Promise<RouteResponse> {
    try {
      const response = await fetch(route, { method: "GET" });
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

  function validateReadInputs(): boolean {
    if (!validateDbPathOnly()) return false;
    if (!allSafeText([candidateFilter, sourceFilter])) {
      setUiStatus("blocked_private_or_raw_payload");
      return false;
    }
    return true;
  }

  function validateDbPathOnly(): boolean {
    if (!isAllowedDbPath(dbPath)) {
      setUiStatus("invalid_db_path");
      setLastResponse(buildUiErrorResponse("invalid_db_path"));
      return false;
    }
    return true;
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

  function copyBoundedReviewPacket() {
    const record = displayedRecord;
    const packet = [
      `ui_version: ${uiVersion}`,
      "packet_kind: final_answer_candidate_review_memory_read_only",
      `review_record_id: ${safeDisplayText(record?.review_record_id)}`,
      `record_kind: ${safeDisplayText(record?.record_kind)}`,
      `lifecycle_state: ${safeDisplayText(record?.lifecycle_state)}`,
      `review_decision: ${safeDisplayText(record?.review_decision)}`,
      `answer_candidate_ref: ${firstCandidateRef(record)}`,
      `source_refs: ${getSourceRefValues(record?.source_refs).slice(0, 8).join(", ") || "none"}`,
      `bounded_summary_excerpt: ${safeExcerpt(record?.bounded_summary)}`,
      "review_memory_is_truth: false",
      "review_memory_is_proof: false",
      "review_memory_is_accepted_evidence: false",
      "review_memory_is_durable_perspective_state: false",
      "final_answer_candidate_is_truth: false",
      "final_answer_candidate_is_proof: false",
      "source_ref_is_proof: false",
      "read_display_only_ui_now: true",
      "review_memory_write_now: false",
      "product_write_now: false",
      "accepted_evidence_ref_write_now: false",
    ].join("\n");
    setPacketPreview(packet);
    void navigator.clipboard?.writeText(packet).catch(() => undefined);
  }

  return (
    <section
      style={surfaceStyle}
      data-augnes-surface="final-answer-candidate-review-ui-binding"
      data-read-display-only-ui-now="true"
    >
      <section style={boundaryBandStyle} aria-label="Final answer candidate review memory boundary">
        {boundaryNotes.map((note) => (
          <span key={note} style={boundaryPillStyle}>
            {note}
          </span>
        ))}
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Read controls">
          <h2 style={sectionHeadingStyle}>Read Controls</h2>
          <Field
            id="final-answer-review-memory-db-path"
            label="local/dev Review Memory DB path"
            value={dbPath}
            onChange={handleDbPathChange}
          />
          <section style={formGridStyle}>
            <Field
              id="final-answer-candidate-filter"
              label="candidate_ref filter"
              value={candidateFilter}
              onChange={(value) => handleSafeTextChange(value, setCandidateFilter)}
            />
            <Field
              id="final-answer-source-filter"
              label="source_ref filter"
              value={sourceFilter}
              onChange={(value) => handleSafeTextChange(value, setSourceFilter)}
            />
          </section>
          <div style={buttonRowStyle}>
            <button type="button" onClick={listReviewRecords} style={buttonStyle}>
              List matching records
            </button>
            <button type="button" onClick={copyBoundedReviewPacket} style={secondaryButtonStyle}>
              Copy bounded packet
            </button>
          </div>
          <p style={hintStyle}>
            Reads only from existing Review Memory DB GET routes. Invalid DB paths and
            private/raw filters are blocked before any fetch.
          </p>
        </section>

        <section style={panelStyle} aria-label="Read status">
          <h2 style={sectionHeadingStyle}>Status</h2>
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

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Final answer candidate Review Memory records">
          <h2 style={sectionHeadingStyle}>Final Answer Candidate Review Memory Records</h2>
          <p style={hintStyle}>
            Badge appears when any public-safe marker identifies a final answer candidate Review
            Memory record.
          </p>
          <div style={recordListStyle}>
            {matchingRecords.length === 0 ? (
              <p style={hintStyle}>No matching final answer candidate Review Memory records loaded.</p>
            ) : (
              matchingRecords.map((record) => {
                const id = safeDisplayText(record.review_record_id);
                return (
                  <button
                    key={id}
                    type="button"
                    style={recordButtonStyle}
                    onClick={() => {
                      setSelectedRecordId(id);
                      void openSelectedRecord(id);
                    }}
                  >
                    <span style={recordTitleStyle}>{id}</span>
                    <span style={badgeStyle}>final answer candidate review memory</span>
                    <span>{safeDisplayText(record.lifecycle_state)}</span>
                    <span>{safeDisplayText(record.review_decision)}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section style={panelStyle} aria-label="Selected review record">
          <h2 style={sectionHeadingStyle}>Selected Record</h2>
          <Field
            id="selected-final-answer-review-memory-record"
            label="review_record_id"
            value={selectedRecordId}
            onChange={(value) => handleSafeTextChange(value, setSelectedRecordId)}
          />
          <div style={buttonRowStyle}>
            <button type="button" onClick={() => openSelectedRecord()} style={buttonStyle}>
              Open selected record
            </button>
            <button type="button" onClick={() => loadActivityHistory()} style={secondaryButtonStyle}>
              Load activity history
            </button>
          </div>
          <RecordDetail record={displayedRecord} />
        </section>
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Activity history">
          <h2 style={sectionHeadingStyle}>Activity History</h2>
          <ActivityList activities={activities} />
        </section>

        <section style={panelStyle} aria-label="Authority boundary">
          <h2 style={sectionHeadingStyle}>Authority Boundary</h2>
          <BoundaryMap title="UI authority" value={uiAuthorityBoundary} />
          <BoundaryMap title="Route authority" value={routeAuthorityBoundary} />
          <BoundaryMap title="Store authority" value={storeAuthorityBoundary} />
        </section>
      </section>

      <section style={panelStyle} aria-label="Copied bounded packet">
        <h2 style={sectionHeadingStyle}>Bounded Read-Only Packet</h2>
        {packetPreview ? (
          <pre style={packetStyle}>{packetPreview}</pre>
        ) : (
          <p style={hintStyle}>Copy action creates a bounded, non-authoritative packet preview.</p>
        )}
      </section>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label style={labelStackStyle} htmlFor={id}>
      <span style={labelStyle}>{label}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  if (!record) return <p style={hintStyle}>Open a matching review record to inspect detail.</p>;
  return (
    <dl style={detailGridStyle}>
      <StatusItem label="review_record_id" value={record.review_record_id} />
      <StatusItem label="record_kind" value={record.record_kind} />
      <StatusItem label="lifecycle_state" value={record.lifecycle_state} />
      <StatusItem label="review_decision" value={record.review_decision} />
      <StatusItem label="review_action" value={record.review_action} />
      <StatusItem label="reviewer_actor" value={record.reviewer_actor} />
      <StatusItem label="reviewer_note_summary" value={safeExcerpt(record.reviewer_note_summary)} />
      <StatusItem label="bounded_summary" value={safeExcerpt(record.bounded_summary)} />
      <div style={wideDetailStyle}>
        <h3 style={minorHeadingStyle}>candidate_refs</h3>
        <RefList refs={record.candidate_refs} />
      </div>
      <div style={wideDetailStyle}>
        <h3 style={minorHeadingStyle}>source_refs</h3>
        <SourceRefList refs={record.source_refs} />
      </div>
      <div style={wideDetailStyle}>
        <h3 style={minorHeadingStyle}>boundary_acknowledgements</h3>
        <RefList refs={record.boundary_acknowledgements} />
      </div>
      <div style={wideDetailStyle}>
        <h3 style={minorHeadingStyle}>reason_codes</h3>
        <RefList refs={record.reason_codes} />
      </div>
    </dl>
  );
}

function ActivityList({ activities }: { activities: ReviewActivity[] }) {
  if (activities.length === 0) return <p style={hintStyle}>No activity history loaded.</p>;
  return (
    <ol style={activityListStyle}>
      {activities.slice(0, 20).map((activity, index) => (
        <li key={`${safeDisplayText(activity.activity_id)}-${index}`} style={activityItemStyle}>
          <strong>{safeDisplayText(activity.activity_kind)}</strong>
          <span>{safeExcerpt(activity.summary)}</span>
          <code style={inlineCodeStyle}>{safeDisplayText(activity.created_at)}</code>
        </li>
      ))}
    </ol>
  );
}

function BoundaryMap({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  const entries = Object.entries(value ?? {}).slice(0, 56);
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
  const values = Array.isArray(refs) ? refs.map((ref) => safeDisplayText(ref)).slice(0, 24) : [];
  if (values.length === 0) return <p style={hintStyle}>none</p>;
  return (
    <ul style={compactListStyle}>
      {values.map((ref) => (
        <li key={ref}>{safeExcerpt(ref, 180)}</li>
      ))}
    </ul>
  );
}

function SourceRefList({ refs }: { refs: unknown }) {
  const values = Array.isArray(refs) ? refs.slice(0, 24) : [];
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

function appendQueryIfPresent(query: URLSearchParams, key: string, value: string) {
  if (value.trim()) query.set(key, value.trim());
}

function getRecords(response: RouteResponse | null): ReviewRecord[] {
  return Array.isArray(response?.result?.records) ? response.result.records : [];
}

function getActivities(response: RouteResponse | null): ReviewActivity[] {
  return Array.isArray(response?.result?.activities) ? response.result.activities : [];
}

function isFinalAnswerCandidateReviewMemoryRecord(record: ReviewRecord): boolean {
  const candidateRefs = getStringValues(record.candidate_refs);
  const reasonCodes = getStringValues(record.reason_codes);
  const boundaryAcknowledgements = getStringValues(record.boundary_acknowledgements);
  return (
    record.record_kind === "candidate_review_snapshot" ||
    candidateRefs.some((ref) => ref.startsWith("final-rag-answer-candidate:")) ||
    reasonCodes.includes("final_rag_answer_candidate_review_memory_binding_v0_1") ||
    boundaryAcknowledgements.includes("final_answer_candidate_not_truth") ||
    boundaryAcknowledgements.includes("review_memory_not_truth")
  );
}

function firstCandidateRef(record: ReviewRecord | null): string {
  return getStringValues(record?.candidate_refs).find((ref) => ref) ?? "none";
}

function getStringValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => safeDisplayText(item))
    .filter((item) => item !== "none");
}

function getSourceRefValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isObjectRecord(item) ? item.source_ref : null))
    .filter((item): item is string => typeof item === "string")
    .map((item) => safeDisplayText(item));
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
    ...explicitUnsafeDisplayTextPatterns,
    /SAFE_MARKER_/i,
    /\/Users\//i,
    /\/home\//i,
    /file:\/\//i,
    /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:[/?#]|$)/i,
    /https?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)[^/\s]*/i,
    /github_pat_/i,
    /OPENAI_API_KEY/i,
    /GITHUB_TOKEN/i,
    /private[_ ]?url/i,
    /local[_ ]?private[_ ]?path/i,
    /raw[\s_-]?prompt/i,
    /raw[\s_-]?source[\s_-]?body/i,
    /raw[\s_-]?provider[\s_-]?output/i,
    /raw[\s_-]?retrieval[\s_-]?output/i,
    /raw[\s_-]?candidate[\s_-]?payload/i,
    /raw[\s_-]?conversation/i,
    /hidden[\s_-]?reasoning/i,
    /chain[\s_-]?of[\s_-]?thought/i,
    /raw[\s_-]?db[\s_-]?row:?/i,
    /telemetry[\s_-]?dump/i,
    /raw[\s_-]?diff/i,
    /terminal[\s_-]?log/i,
    /browser[\s_-]?dump/i,
    /github[\s_-]?payload/i,
    /provider[\s_-]?thread[\s_-]?id/i,
    /provider[\s_-]?run[\s_-]?id/i,
    /provider[\s_-]?session[\s_-]?id/i,
    /\bthread_[A-Za-z0-9_-]*/i,
    /\brun_[A-Za-z0-9_-]*/i,
    /\bsession_[A-Za-z0-9_-]*/i,
    /connector[\s_-]?id/i,
    /uploaded[\s_-]?file[\s_-]?id/i,
    /\btoken\b/i,
    /\bsecret\b/i,
    /api[\s_-]?key/i,
    /password/i,
    /private[\s_-]?key/i,
    /sk-[A-Za-z0-9]/i,
    /ghp_[A-Za-z0-9]/i,
  ].some((pattern) => pattern.test(value));
}

function safeDisplayText(value: unknown, fallback = "blocked_unsafe_display_text"): string {
  if (value === undefined || value === null || value === "") return "none";
  const text = typeof value === "string" ? value : String(value);
  return isSafeDisplayText(text) ? text : fallback;
}

function safeExcerpt(value: unknown, maxLength = maxExcerptLength): string {
  const text = safeDisplayText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

const recordListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  maxHeight: "360px",
  overflow: "auto",
};

const recordButtonStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.3fr) auto auto auto",
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

const badgeStyle: CSSProperties = {
  padding: "4px 6px",
  borderRadius: "6px",
  background: "#e7f6ee",
  color: "#1c5b3a",
  fontSize: "11px",
  fontWeight: 700,
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

const packetStyle: CSSProperties = {
  margin: 0,
  padding: "10px",
  border: "1px solid #d7dde6",
  borderRadius: "6px",
  background: "#f9fbfd",
  overflow: "auto",
  fontSize: "12px",
};
