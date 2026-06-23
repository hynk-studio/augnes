import type { FeedbackEventStoreEvent } from "@/types/feedback-event-store";
import type {
  FeedbackEventAggregationReadModelContract,
  FeedbackEventAggregationReadModelView,
  FeedbackEventAggregationReadModelViewAuthorityBoundary,
  FeedbackEventAggregationReadModelViewId,
} from "@/types/feedback-event-aggregation-read-model-contract";

type JsonRecord = Record<string, unknown>;

export interface FeedbackEventAggregationReadModelImplementationInput {
  feedback_events: FeedbackEventStoreEvent[];
  aggregation_read_model_contract: FeedbackEventAggregationReadModelContract;
  source_contract_ref: string;
  source_feedback_event_store_ref: string;
}

export interface FeedbackEventAggregationReadModelImplementationView {
  view_id: FeedbackEventAggregationReadModelViewId;
  view_version: `${FeedbackEventAggregationReadModelViewId}.v0.1`;
  source_contract_view_version: `${FeedbackEventAggregationReadModelViewId}.v0.1`;
  grouping_keys: string[];
  output_fields: string[];
  row_count: number;
  rows: JsonRecord[];
  authority_boundary: FeedbackEventAggregationReadModelViewAuthorityBoundary;
}

export interface FeedbackEventAggregationDuplicateFeedbackSummary {
  duplicate_detection_keys: ["event_type", "target_kind", "target_id"];
  idempotency_key_duplicates_grouped_separately: true;
  duplicate_groups: JsonRecord[];
  idempotency_key_duplicate_groups: JsonRecord[];
  display_read_model_indicators_only: true;
  delete_feedback_events: false;
  rewrite_feedback_events: false;
  suppress_feedback_events: false;
  mutate_feedback_events: false;
  decides_promotion: false;
  decides_proof_or_evidence: false;
  decides_work_status: false;
  decides_product_write: false;
}

export interface FeedbackEventAggregationRecentWindowPreview {
  grouping_keys: ["created_at_day"];
  output_fields: [
    "created_at_day",
    "event_count",
    "event_ids",
    "event_types",
    "target_kinds",
    "target_ids",
    "latest_created_at",
    "read_model_only",
  ];
  rows: JsonRecord[];
  read_model_only: true;
  not_source_of_truth: true;
}

export interface FeedbackEventAggregationReadModelImplementationAuthorityBoundary {
  implementation_added_now: true;
  contract_followed_now: true;
  fixture_backed_only: true;
  runtime_read_model_implemented_now: false;
  runtime_db_query_now: false;
  production_db_used_now: false;
  route_changed_now: false;
  component_changed_now: false;
  browser_request_now: false;
  feedback_events_read_from_fixture_now: true;
  feedback_events_read_from_runtime_db_now: false;
  feedback_events_written_now: false;
  feedback_events_mutated_now: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state_write: false;
  promotion_decision_record: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  external_handoff_authority: false;
  provider_openai_authority: false;
  retrieval_rag_authority: false;
  source_fetch_authority: false;
  salience_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
  product_write_lane_parked_by_686: true;
}

export interface FeedbackEventAggregationReadModelImplementationValidationPolicy {
  static_source_validation_only: true;
  fixture_backed_only: true;
  app_server_started_now: false;
  production_db_used_now: false;
  runtime_browser_request_now: false;
  runtime_db_query_now: false;
}

export interface FeedbackEventAggregationReadModelImplementationValidation {
  passed: boolean;
  failure_codes: string[];
  implemented_view_count: number;
  contract_view_count: number;
  fixture_event_count: number;
  recent_window_rows_match_created_at_days: boolean;
}

export interface FeedbackEventAggregationReadModelImplementation {
  implementation_kind: "feedback_event_aggregation_read_model_implementation";
  implementation_version: "feedback_event_aggregation_read_model_implementation.v0.1";
  source_contract_ref: string;
  source_contract_fingerprint: string;
  source_feedback_event_store_ref: string;
  read_model_views: FeedbackEventAggregationReadModelImplementationView[];
  duplicate_feedback_summary: FeedbackEventAggregationDuplicateFeedbackSummary;
  recent_feedback_event_window_preview: FeedbackEventAggregationRecentWindowPreview;
  authority_boundary: FeedbackEventAggregationReadModelImplementationAuthorityBoundary;
  validation_policy: FeedbackEventAggregationReadModelImplementationValidationPolicy;
  validation: FeedbackEventAggregationReadModelImplementationValidation;
  recommendation_status:
    "ready_for_feedback_event_aggregation_read_model_browser_validation_v0_1";
  next_recommended_slice:
    "feedback_event_aggregation_read_model_browser_validation_v0_1";
  implementation_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json";
}

const expectedViewIds: FeedbackEventAggregationReadModelViewId[] = [
  "feedback_event_counts_by_event_type",
  "feedback_event_counts_by_target_kind",
  "feedback_event_counts_by_target",
  "duplicate_feedback_groups",
  "recent_feedback_event_window_preview",
  "pinned_or_dismissed_target_summary",
  "operator_note_presence_summary",
  "source_ref_feedback_summary",
  "authority_boundary_summary",
];

export function buildFeedbackEventAggregationReadModelImplementation(
  input: FeedbackEventAggregationReadModelImplementationInput,
): FeedbackEventAggregationReadModelImplementation {
  const contract = input.aggregation_read_model_contract;
  const events = [...input.feedback_events].sort(compareEventsAsc);
  const rowsByViewId = buildRowsByViewId(events);
  const readModelViews = contract.read_model_views.map((contractView) =>
    buildImplementationView(contractView, rowsByViewId.get(contractView.view_id) ?? []),
  );
  const recentRows =
    rowsByViewId.get("recent_feedback_event_window_preview") ?? [];
  const failureCodes = validateImplementation(contract, readModelViews, events, recentRows);

  const implementation: FeedbackEventAggregationReadModelImplementation = {
    implementation_kind: "feedback_event_aggregation_read_model_implementation",
    implementation_version: "feedback_event_aggregation_read_model_implementation.v0.1",
    source_contract_ref: input.source_contract_ref,
    source_contract_fingerprint: contract.contract_fingerprint,
    source_feedback_event_store_ref: input.source_feedback_event_store_ref,
    read_model_views: readModelViews,
    duplicate_feedback_summary: buildDuplicateFeedbackSummary(events, rowsByViewId),
    recent_feedback_event_window_preview: {
      grouping_keys: ["created_at_day"],
      output_fields: [
        "created_at_day",
        "event_count",
        "event_ids",
        "event_types",
        "target_kinds",
        "target_ids",
        "latest_created_at",
        "read_model_only",
      ],
      rows: recentRows,
      read_model_only: true,
      not_source_of_truth: true,
    },
    authority_boundary: getImplementationAuthorityBoundary(),
    validation_policy: {
      static_source_validation_only: true,
      fixture_backed_only: true,
      app_server_started_now: false,
      production_db_used_now: false,
      runtime_browser_request_now: false,
      runtime_db_query_now: false,
    },
    validation: {
      passed: failureCodes.length === 0,
      failure_codes: uniqueSorted(failureCodes),
      implemented_view_count: readModelViews.length,
      contract_view_count: contract.read_model_views.length,
      fixture_event_count: events.length,
      recent_window_rows_match_created_at_days:
        recentRows.length === uniqueSorted(events.map(createdAtDay)).length,
    },
    recommendation_status:
      "ready_for_feedback_event_aggregation_read_model_browser_validation_v0_1",
    next_recommended_slice:
      "feedback_event_aggregation_read_model_browser_validation_v0_1",
    implementation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  implementation.implementation_fingerprint =
    createFeedbackEventAggregationReadModelImplementationFingerprint(implementation);
  return implementation;
}

export function createFeedbackEventAggregationReadModelImplementationFingerprint(
  implementation: FeedbackEventAggregationReadModelImplementation,
): string {
  const normalized = JSON.parse(JSON.stringify(implementation)) as JsonRecord;
  delete normalized.implementation_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

function buildRowsByViewId(
  events: FeedbackEventStoreEvent[],
): Map<FeedbackEventAggregationReadModelViewId, JsonRecord[]> {
  return new Map<FeedbackEventAggregationReadModelViewId, JsonRecord[]>([
    [
      "feedback_event_counts_by_event_type",
      countBy(events, ["event_type"]).map((row) => ({
        event_type: row.event_type,
        event_count: row.event_count,
        latest_created_at: row.latest_created_at,
      })),
    ],
    [
      "feedback_event_counts_by_target_kind",
      countBy(events, ["target_kind"]).map((row) => ({
        target_kind: row.target_kind,
        event_count: row.event_count,
        latest_created_at: row.latest_created_at,
      })),
    ],
    [
      "feedback_event_counts_by_target",
      countBy(events, ["target_kind", "target_id"]).map((row) => ({
        target_kind: row.target_kind,
        target_id: row.target_id,
        event_count: row.event_count,
        event_types: row.event_types,
        latest_created_at: row.latest_created_at,
      })),
    ],
    ["duplicate_feedback_groups", duplicateFeedbackGroups(events)],
    ["recent_feedback_event_window_preview", recentFeedbackEventWindowPreview(events)],
    ["pinned_or_dismissed_target_summary", pinnedOrDismissedTargetSummary(events)],
    [
      "operator_note_presence_summary",
      countByPresence(events, "operator_note", "operator_note_presence"),
    ],
    ["source_ref_feedback_summary", sourceRefFeedbackSummary(events)],
    [
      "authority_boundary_summary",
      [
        {
          event_count: events.length,
          forbidden_authority_flags_true_count: 0,
          read_model_only: true,
          product_write_lane_parked_by_686: true,
        },
      ],
    ],
  ]);
}

function buildImplementationView(
  contractView: FeedbackEventAggregationReadModelView,
  rows: JsonRecord[],
): FeedbackEventAggregationReadModelImplementationView {
  return {
    view_id: contractView.view_id,
    view_version: contractView.view_version,
    source_contract_view_version: contractView.view_version,
    grouping_keys: contractView.grouping_keys,
    output_fields: contractView.output_fields,
    row_count: rows.length,
    rows,
    authority_boundary: contractView.authority_boundary,
  };
}

function buildDuplicateFeedbackSummary(
  events: FeedbackEventStoreEvent[],
  rowsByViewId: Map<FeedbackEventAggregationReadModelViewId, JsonRecord[]>,
): FeedbackEventAggregationDuplicateFeedbackSummary {
  return {
    duplicate_detection_keys: ["event_type", "target_kind", "target_id"],
    idempotency_key_duplicates_grouped_separately: true,
    duplicate_groups: rowsByViewId.get("duplicate_feedback_groups") ?? [],
    idempotency_key_duplicate_groups: countBy(events, ["idempotency_key"]).map((row) => ({
      idempotency_key: row.idempotency_key,
      event_count: row.event_count,
      duplicate_detected: numberValue(row.event_count) > 1,
      display_indicator_only: true,
      mutates_feedback_events: false,
    })),
    display_read_model_indicators_only: true,
    delete_feedback_events: false,
    rewrite_feedback_events: false,
    suppress_feedback_events: false,
    mutate_feedback_events: false,
    decides_promotion: false,
    decides_proof_or_evidence: false,
    decides_work_status: false,
    decides_product_write: false,
  };
}

function validateImplementation(
  contract: FeedbackEventAggregationReadModelContract,
  views: FeedbackEventAggregationReadModelImplementationView[],
  events: FeedbackEventStoreEvent[],
  recentRows: JsonRecord[],
): string[] {
  const failureCodes: string[] = [];
  const contractViewIds = contract.read_model_views.map((view) => view.view_id);
  if (JSON.stringify(contractViewIds) !== JSON.stringify(expectedViewIds)) {
    failureCodes.push("contract_view_ids_mismatch");
  }
  if (JSON.stringify(views.map((view) => view.view_id)) !== JSON.stringify(contractViewIds)) {
    failureCodes.push("implemented_view_ids_mismatch");
  }
  if (recentRows.length !== uniqueSorted(events.map(createdAtDay)).length) {
    failureCodes.push("recent_window_not_one_row_per_created_at_day");
  }
  for (const view of views) {
    if (!view.authority_boundary.read_model_only) {
      failureCodes.push(`${view.view_id}_not_read_model_only`);
    }
    if (!view.authority_boundary.not_source_of_truth) {
      failureCodes.push(`${view.view_id}_source_of_truth_boundary_missing`);
    }
    if (
      !view.authority_boundary.not_proof_or_evidence ||
      !view.authority_boundary.not_perspective_state ||
      !view.authority_boundary.not_work_status ||
      !view.authority_boundary.not_promotion_decision ||
      !view.authority_boundary.not_retrieval_rag_result ||
      !view.authority_boundary.not_product_write
    ) {
      failureCodes.push(`${view.view_id}_authority_boundary_missing`);
    }
  }
  return failureCodes;
}

function duplicateFeedbackGroups(events: FeedbackEventStoreEvent[]): JsonRecord[] {
  return countBy(events, ["event_type", "target_kind", "target_id"]).map((row) => ({
    duplicate_group: `${row.event_type}:${row.target_kind}:${row.target_id}`,
    event_type: row.event_type,
    target_kind: row.target_kind,
    target_id: row.target_id,
    event_count: row.event_count,
    duplicate_detected: numberValue(row.event_count) > 1,
    display_indicator_only: true,
    mutates_feedback_events: false,
  }));
}

function recentFeedbackEventWindowPreview(events: FeedbackEventStoreEvent[]): JsonRecord[] {
  const rows = new Map<string, JsonRecord>();
  for (const event of events) {
    const created_at_day = createdAtDay(event);
    const current = rows.get(created_at_day) ?? {
      created_at_day,
      event_count: 0,
      event_ids: [],
      event_types: [],
      target_kinds: [],
      target_ids: [],
      latest_created_at: null,
      read_model_only: true,
    };
    current.event_count = numberValue(current.event_count) + 1;
    current.event_ids = uniqueSorted([...arrayValue(current.event_ids), event.event_id]);
    current.event_types = uniqueSorted([...arrayValue(current.event_types), event.event_type]);
    current.target_kinds = uniqueSorted([...arrayValue(current.target_kinds), event.target_kind]);
    current.target_ids = uniqueSorted([...arrayValue(current.target_ids), event.target_id]);
    current.latest_created_at = latestDate(current.latest_created_at, event.created_at);
    rows.set(created_at_day, current);
  }
  return [...rows.values()].sort((a, b) =>
    String(b.created_at_day).localeCompare(String(a.created_at_day)),
  );
}

function pinnedOrDismissedTargetSummary(events: FeedbackEventStoreEvent[]): JsonRecord[] {
  const rows = new Map<string, JsonRecord>();
  for (const event of events) {
    if (!["pin_preview", "dismiss_preview"].includes(event.event_type)) {
      continue;
    }
    const key = `${event.target_kind}\u0000${event.target_id}`;
    const current = rows.get(key) ?? {
      target_kind: event.target_kind,
      target_id: event.target_id,
      pin_count: 0,
      dismiss_count: 0,
    };
    if (event.event_type === "pin_preview") {
      current.pin_count = numberValue(current.pin_count) + 1;
    }
    if (event.event_type === "dismiss_preview") {
      current.dismiss_count = numberValue(current.dismiss_count) + 1;
    }
    rows.set(key, current);
  }
  return [...rows.values()].sort(compareObjectsByFields(["target_kind", "target_id"]));
}

function sourceRefFeedbackSummary(events: FeedbackEventStoreEvent[]): JsonRecord[] {
  const rows = new Map<string, JsonRecord>();
  for (const event of events) {
    for (const source_ref_id of event.source_ref_ids) {
      const current = rows.get(source_ref_id) ?? {
        source_ref_id,
        event_count: 0,
        event_types: [],
      };
      current.event_count = numberValue(current.event_count) + 1;
      current.event_types = uniqueSorted([...arrayValue(current.event_types), event.event_type]);
      rows.set(source_ref_id, current);
    }
  }
  return [...rows.values()].sort((a, b) => {
    const countDiff = numberValue(b.event_count) - numberValue(a.event_count);
    if (countDiff !== 0) return countDiff;
    return String(a.source_ref_id).localeCompare(String(b.source_ref_id));
  });
}

function countBy(events: FeedbackEventStoreEvent[], keys: string[]): JsonRecord[] {
  const groups = new Map<string, JsonRecord>();
  for (const event of events) {
    const eventRecord = event as unknown as JsonRecord;
    const key = keys.map((field) => String(eventRecord[field])).join("\u0000");
    const current =
      groups.get(key) ??
      Object.fromEntries(keys.map((field) => [field, eventRecord[field]]));
    current.event_count = numberValue(current.event_count) + 1;
    current.latest_created_at = latestDate(current.latest_created_at, event.created_at);
    current.event_types = uniqueSorted([...arrayValue(current.event_types), event.event_type]);
    groups.set(key, current);
  }
  return [...groups.values()].sort(compareObjectsByFields(keys));
}

function countByPresence(
  events: FeedbackEventStoreEvent[],
  field: keyof FeedbackEventStoreEvent,
  outputField: string,
): JsonRecord[] {
  const rows = new Map<boolean, JsonRecord>();
  for (const event of events) {
    const value = Boolean(event[field]);
    const current = rows.get(value) ?? { [outputField]: value, event_count: 0 };
    current.event_count = numberValue(current.event_count) + 1;
    rows.set(value, current);
  }
  return [...rows.values()].sort((a, b) =>
    Number(b[outputField]) - Number(a[outputField]),
  );
}

function getImplementationAuthorityBoundary(): FeedbackEventAggregationReadModelImplementationAuthorityBoundary {
  return {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    runtime_read_model_implemented_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    feedback_events_read_from_fixture_now: true,
    feedback_events_read_from_runtime_db_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function compareEventsAsc(a: FeedbackEventStoreEvent, b: FeedbackEventStoreEvent): number {
  return (
    String(a.created_at).localeCompare(String(b.created_at)) ||
    String(a.event_id).localeCompare(String(b.event_id))
  );
}

function compareObjectsByFields(fields: string[]) {
  return (a: JsonRecord, b: JsonRecord): number => {
    for (const field of fields) {
      const compared = String(a[field]).localeCompare(String(b[field]));
      if (compared !== 0) return compared;
    }
    return 0;
  };
}

function createdAtDay(event: FeedbackEventStoreEvent): string {
  return String(event.created_at).slice(0, 10);
}

function latestDate(current: unknown, candidate: string): string {
  if (!current || String(candidate) > String(current)) {
    return candidate;
  }
  return String(current);
}

function uniqueSorted(values: unknown[]): string[] {
  return [...new Set(values.map(String))].sort();
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonRecord)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
