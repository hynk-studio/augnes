"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

const uiVersion = "foundation_lifecycle_review_memory_db_readonly_ui_completion.v0.1";
const routeVersion = "research_candidate_review_memory_db_routes.v0.1";
const scope = "project:augnes";
const defaultDbPath = ".tmp/research-candidate-review-memory/ui/review-memory.sqlite";
const reviewRecordsRoutePath = "/api/research-candidate-review/review-records";

const authorityBoundary = {
  foundation_lifecycle_review_memory_db_readonly_ui_now: true,
  readonly_ui_only: true,
  db_backed_review_memory_get_routes_primary: true,
  same_origin_route_calls_only: true,
  foundation_status_orientation_now: true,
  lifecycle_summary_review_cue_now: true,
  review_memory_record_read_now: true,
  review_memory_activity_read_now: true,
  product_write_parked_status_visible: true,
  review_memory_write_ui_now: false,
  review_memory_discard_ui_now: false,
  direct_db_access_from_ui_now: false,
  direct_file_write_from_ui_now: false,
  legacy_json_route_primary_persistence_now: false,
  post_route_call_now: false,
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
  foundation_status_is_runtime_completion: false,
  lifecycle_cue_is_execution_authority: false,
  review_memory_is_truth: false,
  review_memory_is_proof: false,
  review_memory_is_accepted_evidence: false,
  review_memory_is_durable_perspective_state: false,
  candidate_is_fact: false,
  candidate_is_proof: false,
  source_ref_is_proof: false,
  smoke_pass_is_truth: false,
  ci_pass_is_truth: false,
} as const;

const boundaryNotes = [
  "Foundation status is orientation, not runtime completion.",
  "Lifecycle is next review cue, not execution authority.",
  "Review memory is explicit user-action record, not truth or proof.",
  "DB-backed review memory is not durable Perspective state.",
  "Candidate refs are not facts.",
  "Source refs are lineage pointers, not proof.",
  "Product-write remains parked by #686.",
] as const;

const boundedErrorCodes = [
  "invalid_db_path",
  "db_missing",
  "schema_missing",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "not_found",
  "same_origin_required",
] as const;

const sectionSummaries = [
  {
    title: "Foundation completion summary",
    status: "orientation_only",
    summary: "Foundation status orients the operator around completed rails and parked boundaries.",
    metrics: [
      ["phase", "Phase 2.5"],
      ["db_ui_completion", "ready_to_read"],
      ["product_write", "parked_by_686"],
    ],
    boundary: "Foundation status is orientation, not runtime completion.",
  },
  {
    title: "Rail status matrix",
    status: "read_model",
    summary: "Rails show contract, store, routes, UI, and read-only consolidation without granting execution.",
    metrics: [
      ["contract", "complete"],
      ["db_store", "runtime_complete"],
      ["db_routes", "runtime_complete"],
      ["db_ui", "runtime_complete"],
    ],
    boundary: "Rail status is planning context only.",
  },
  {
    title: "Runtime readiness matrix",
    status: "review_cue",
    summary: "Readiness rows show bounded runtime surfaces available for operator review.",
    metrics: [
      ["db_get_routes", "available"],
      ["db_write_routes", "not_used_here"],
      ["browser_validation", "tooling_dependent"],
    ],
    boundary: "Readiness is a review cue, not execution authority.",
  },
  {
    title: "Forbidden capability matrix",
    status: "all_false",
    summary: "Forbidden capability flags remain false in this read-only surface.",
    metrics: [
      ["provider_openai_call_now", "false"],
      ["retrieval_execution_now", "false"],
      ["proof_or_evidence_record_now", "false"],
      ["product_write_now", "false"],
    ],
    boundary: "None of these rows are controls.",
  },
  {
    title: "Product-write parked status",
    status: "parked_by_686",
    summary: "Product-write remains parked and no product authority is granted here.",
    metrics: [
      ["product_write_authority", "false"],
      ["product_id_allocation_now", "false"],
      ["product_persistence_now", "false"],
    ],
    boundary: "Product-write remains parked by #686.",
  },
  {
    title: "Next runtime slice pointer",
    status: "deferred",
    summary: "Next runtime work remains separate from this read-only DB visibility completion.",
    metrics: [
      ["source_intake_runtime", "deferred"],
      ["provider_extraction_runtime", "deferred"],
      ["retrieval_rag_runtime", "deferred"],
    ],
    boundary: "A pointer is not implementation authority.",
  },
  {
    title: "Lifecycle summary",
    status: "review_cue_only",
    summary: "Lifecycle cues organize candidate review posture without promotion or mutation.",
    metrics: [
      ["needs_operator_review", "3"],
      ["ready_with_tensions", "2"],
      ["execution_authority", "false"],
    ],
    boundary: "Lifecycle is next review cue, not execution authority.",
  },
] as const;

const operatorDecisionQueue = [
  {
    queue_ref: "decision-queue:review-memory-db-readonly-001",
    cue: "Inspect DB-backed review memory rows with missing source lineage.",
    layer: "review_memory",
    authority: "operator_review_only",
  },
  {
    queue_ref: "decision-queue:lifecycle-cue-001",
    cue: "Review active candidates with needs_more_evidence decisions.",
    layer: "lifecycle",
    authority: "review_cue_only",
  },
  {
    queue_ref: "decision-queue:foundation-boundary-001",
    cue: "Keep product-write parked until a separate approved reentry slice.",
    layer: "foundation",
    authority: "orientation_only",
  },
] as const;

const knownWarningsAndSkippedChecks = [
  {
    item: "MODULE_TYPELESS_PACKAGE_JSON",
    status: "known_warning_when_ts_import_smokes_pass",
  },
  {
    item: "stripTypeScriptTypes",
    status: "known_experimental_warning_when_smokes_pass",
  },
  {
    item: "browser_validation",
    status: "runs_only_when_browser_tooling_is_available",
  },
] as const;

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
  reviewer_note_summary?: unknown;
  bounded_summary?: unknown;
  updated_at?: unknown;
  discard_reason?: unknown;
};

type ReviewActivity = {
  activity_id?: unknown;
  activity_kind?: unknown;
  actor_ref?: unknown;
  summary?: unknown;
  created_at?: unknown;
};

export function FoundationLifecycleReviewMemoryDbReadonlyPanel() {
  const [dbPath, setDbPath] = useState(defaultDbPath);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [listResponse, setListResponse] = useState<RouteResponse | null>(null);
  const [detailResponse, setDetailResponse] = useState<RouteResponse | null>(null);
  const [activityResponse, setActivityResponse] = useState<RouteResponse | null>(null);
  const [lastResponse, setLastResponse] = useState<RouteResponse | null>(null);
  const [uiStatus, setUiStatus] = useState("not_loaded");

  const records = useMemo(() => getRecords(listResponse), [listResponse]);
  const detailRecord = detailResponse?.result?.record ?? null;
  const activities = useMemo(() => getActivities(activityResponse), [activityResponse]);
  const routeAuthority = lastResponse?.authority_boundary ?? null;
  const storeAuthority = lastResponse?.result?.authority_boundary ?? null;
  const routeNotes = getStringList(lastResponse?.boundary_notes);
  const displayedNotes = routeNotes.length > 0 ? routeNotes : [...boundaryNotes];

  async function loadReviewRecords() {
    const query = new URLSearchParams({
      route_version: routeVersion,
      scope,
      db_path: dbPath,
      include_discarded: "1",
      limit: "25",
    });
    const response = await requestGetRoute(`${reviewRecordsRoutePath}?${query.toString()}`);
    setListResponse(response);
    const firstRecordId = getRecords(response)[0]?.review_record_id;
    if (typeof firstRecordId === "string") {
      setSelectedRecordId(firstRecordId);
    }
  }

  async function openReviewRecord(targetRecordId = selectedRecordId) {
    const safeRecordId = targetRecordId.trim();
    if (!safeRecordId || !isSafeDisplayText(safeRecordId)) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    const query = new URLSearchParams({ route_version: routeVersion, scope, db_path: dbPath });
    const response = await requestGetRoute(
      `${reviewRecordsRoutePath}/${encodeURIComponent(safeRecordId)}?${query.toString()}`,
    );
    setDetailResponse(response);
  }

  async function loadActivityHistory(targetRecordId = selectedRecordId) {
    const safeRecordId = targetRecordId.trim();
    if (!safeRecordId || !isSafeDisplayText(safeRecordId)) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    const query = new URLSearchParams({ route_version: routeVersion, scope, db_path: dbPath });
    const response = await requestGetRoute(
      `${reviewRecordsRoutePath}/${encodeURIComponent(safeRecordId)}/activity?${query.toString()}`,
    );
    setActivityResponse(response);
  }

  async function requestGetRoute(input: string): Promise<RouteResponse> {
    if (!isAllowedDbPath(dbPath)) {
      const response = buildUiErrorResponse("invalid_db_path");
      setLastResponse(response);
      setUiStatus("invalid_db_path");
      return response;
    }
    try {
      const response = await fetch(input, { method: "GET" });
      const body = (await response.json()) as RouteResponse;
      const boundedResponse: RouteResponse = {
        ...body,
        status: body.status === "ok" ? "ok" : "error",
      };
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

  function handleSelectedRecordChange(value: string) {
    if (!isSafeDisplayText(value) || value.length > 240) {
      setUiStatus("invalid_review_record_id");
      return;
    }
    setSelectedRecordId(value);
  }

  return (
    <section
      style={surfaceStyle}
      data-augnes-surface="foundation-lifecycle-review-memory-db-readonly-ui"
      data-db-backed-review-memory-get-routes-primary="true"
      data-readonly-ui-only="true"
    >
      <section style={boundaryBandStyle} aria-label="Layer separation boundary">
        {boundaryNotes.map((note) => (
          <span key={note} style={boundaryPillStyle}>
            {note}
          </span>
        ))}
      </section>

      <section style={panelStyle} aria-label="DB-backed read-only route controls">
        <div>
          <h2 style={sectionHeadingStyle}>DB-backed Review Memory Reads</h2>
          <p style={hintStyle}>
            Read-only same-origin GET routes load bounded review memory visibility. GET routes do
            not create DB files or schema.
          </p>
        </div>
        <label style={labelStackStyle} htmlFor="foundation-review-memory-db-path">
          <span style={labelStyle}>local/dev review memory DB path</span>
          <input
            id="foundation-review-memory-db-path"
            value={dbPath}
            onChange={(event) => handleDbPathChange(event.target.value)}
            style={inputStyle}
            spellCheck={false}
          />
        </label>
        <div style={buttonRowStyle}>
          <button type="button" onClick={loadReviewRecords} style={buttonStyle}>
            Load DB-backed review records
          </button>
          <button type="button" onClick={() => openReviewRecord()} style={secondaryButtonStyle}>
            Open selected detail
          </button>
          <button type="button" onClick={() => loadActivityHistory()} style={secondaryButtonStyle}>
            Load selected activity
          </button>
        </div>
        <dl style={statusGridStyle}>
          <StatusItem label="ui_version" value={uiVersion} />
          <StatusItem label="route_version" value={routeVersion} />
          <StatusItem label="ui_status" value={uiStatus} />
          <StatusItem label="record_count" value={String(records.length)} />
          <StatusItem label="route_error_code" value={lastResponse?.error_code ?? "none"} />
        </dl>
        <div style={codeListStyle} aria-label="Bounded route error codes">
          {boundedErrorCodes.map((code) => (
            <code key={code} style={codePillStyle}>
              {code}
            </code>
          ))}
        </div>
      </section>

      <section style={sectionsGridStyle} aria-label="Foundation and lifecycle read-only sections">
        {sectionSummaries.map((section) => (
          <article key={section.title} style={summaryPanelStyle}>
            <h2 style={sectionHeadingStyle}>{section.title}</h2>
            <p style={statusTextStyle}>{section.status}</p>
            <p style={summaryTextStyle}>{section.summary}</p>
            <dl style={metricGridStyle}>
              {section.metrics.map(([label, value]) => (
                <StatusItem key={label} label={label} value={value} />
              ))}
            </dl>
            <p style={boundaryTextStyle}>{section.boundary}</p>
          </article>
        ))}
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Review records list">
          <h2 style={sectionHeadingStyle}>Review records list</h2>
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
                    <strong style={recordTitleStyle}>{id}</strong>
                    <span>{safeDisplayText(record.lifecycle_state)}</span>
                    <span>{safeDisplayText(record.review_decision)}</span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section style={panelStyle} aria-label="Review record detail">
          <h2 style={sectionHeadingStyle}>Review record detail</h2>
          <label style={labelStackStyle} htmlFor="foundation-selected-record-id">
            <span style={labelStyle}>selected review_record_id</span>
            <input
              id="foundation-selected-record-id"
              value={selectedRecordId}
              onChange={(event) => handleSelectedRecordChange(event.target.value)}
              style={inputStyle}
              spellCheck={false}
            />
          </label>
          <RecordDetail record={detailRecord} />
        </section>
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Activity history">
          <h2 style={sectionHeadingStyle}>Activity history</h2>
          <ActivityList activities={activities} />
        </section>

        <section style={panelStyle} aria-label="Operator decision queue">
          <h2 style={sectionHeadingStyle}>Operator decision queue</h2>
          <ul style={listStyle}>
            {operatorDecisionQueue.map((item) => (
              <li key={item.queue_ref}>
                <strong>{item.queue_ref}</strong>: {item.cue} [{item.layer}; {item.authority}]
              </li>
            ))}
          </ul>
        </section>
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Known warnings and skipped checks">
          <h2 style={sectionHeadingStyle}>Known warnings/skipped checks</h2>
          <ul style={listStyle}>
            {knownWarningsAndSkippedChecks.map((item) => (
              <li key={item.item}>
                <strong>{item.item}</strong>: {item.status}
              </li>
            ))}
          </ul>
        </section>

        <section style={panelStyle} aria-label="Authority boundary">
          <h2 style={sectionHeadingStyle}>Authority boundary</h2>
          <BoundaryMap title="UI authority" value={authorityBoundary} />
          <BoundaryMap title="Route authority" value={routeAuthority} />
          <BoundaryMap title="Store authority" value={storeAuthority} />
          <ul style={listStyle}>
            {displayedNotes.map((note) => (
              <li key={note}>{safeDisplayText(note)}</li>
            ))}
          </ul>
        </section>
      </section>
    </section>
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
  if (!record) return <p style={hintStyle}>Open a DB-backed review memory record to inspect detail.</p>;
  return (
    <dl style={detailGridStyle}>
      <StatusItem label="review_record_id" value={record.review_record_id} />
      <StatusItem label="record_kind" value={record.record_kind} />
      <StatusItem label="lifecycle_state" value={record.lifecycle_state} />
      <StatusItem label="review_decision" value={record.review_decision} />
      <StatusItem label="review_action" value={record.review_action} />
      <StatusItem label="updated_at" value={record.updated_at} />
      <StatusItem label="reviewer_note_summary" value={record.reviewer_note_summary} />
      <StatusItem label="bounded_summary" value={record.bounded_summary} />
      <StatusItem label="discard_reason" value={record.discard_reason} />
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
  const entries = Object.entries(value ?? {}).slice(0, 60);
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
    authority_boundary: authorityBoundary,
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

const sectionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: "16px",
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  alignContent: "start",
  padding: "16px",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  background: "#ffffff",
  minWidth: 0,
};

const summaryPanelStyle: CSSProperties = {
  ...panelStyle,
  minHeight: "210px",
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

const hintStyle: CSSProperties = {
  margin: 0,
  color: "#56667c",
  fontSize: "13px",
  lineHeight: 1.5,
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
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
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

const statusTextStyle: CSSProperties = {
  margin: 0,
  color: "#526073",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
};

const summaryTextStyle: CSSProperties = {
  margin: 0,
  color: "#243447",
  fontSize: "13px",
  lineHeight: 1.5,
};

const boundaryTextStyle: CSSProperties = {
  margin: 0,
  color: "#45566e",
  fontSize: "12px",
  fontWeight: 700,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 130px), 1fr))",
  gap: "8px",
  margin: 0,
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
  overflowWrap: "anywhere",
};
