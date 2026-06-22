import type {
  FeedbackEventStoreListRouteAuthorityAcknowledgement,
  FeedbackEventStoreListRouteAuthorityBoundary,
  FeedbackEventStoreListRouteContract,
  FeedbackEventStoreListRouteContractInput,
  FeedbackEventStoreListRouteFilterContract,
  FeedbackEventStoreListRoutePaginationContract,
  FeedbackEventStoreListRouteRefusal,
  FeedbackEventStoreListRouteRefusalCode,
  FeedbackEventStoreListRouteRequest,
  FeedbackEventStoreListRouteResponse,
  FeedbackEventStoreListRouteValidationResult,
} from "@/types/feedback-event-store-list-route-contract";
import type { FeedbackEventStoreEvent } from "@/types/feedback-event-store";

type JsonRecord = Record<string, unknown>;

const contractVersion = "feedback_event_store_list_route_contract.v0.1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "GET";
const recommendationStatus =
  "ready_for_feedback_event_store_list_route_implementation_v0_1";
const nextRecommendedSlice =
  "feedback_event_store_list_route_implementation_v0_1";
const defaultFeedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const defaultUiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json";
const defaultUiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const defaultWriteRouteBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json";

const requiredAuthorityAcknowledgements: FeedbackEventStoreListRouteAuthorityAcknowledgement[] = [
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
];

const requiredRefusalCodes: FeedbackEventStoreListRouteRefusalCode[] = [
  "route_not_implemented_in_this_slice",
  "missing_authority_acknowledgement",
  "invalid_request_version",
  "invalid_event_type",
  "invalid_target_kind",
  "invalid_limit",
  "invalid_cursor",
  "raw_sql_filter_forbidden",
  "forbidden_authority_requested",
  "product_write_authority_requested",
  "retrieval_rag_execution_requested",
  "provider_openai_call_requested",
  "source_fetch_requested",
  "codex_or_github_automation_requested",
];

export function buildFeedbackEventStoreListRouteContract(
  input: FeedbackEventStoreListRouteContractInput,
): FeedbackEventStoreListRouteContract {
  const sourceFeedbackEventStoreFixturePath =
    input.source_feedback_event_store_fixture_path ??
    defaultFeedbackEventStoreFixturePath;
  const sourceUiBrowserValidationFixturePath =
    input.source_feedback_event_controls_ui_browser_validation_fixture_path ??
    defaultUiBrowserValidationFixturePath;
  const sourceUiImplementationFixturePath =
    input.source_feedback_event_controls_ui_implementation_fixture_path ??
    defaultUiImplementationFixturePath;
  const sourceWriteRouteBrowserValidationFixturePath =
    input.source_feedback_event_write_route_browser_validation_fixture_path ??
    defaultWriteRouteBrowserValidationFixturePath;
  const sampleEvent = selectSampleEvent(input.feedbackEventStoreFixture.events);
  const authorityBoundary = getFeedbackEventStoreListRouteAuthorityBoundary();
  const requestContract = buildRequestContract(sampleEvent);
  const responseContract = buildResponseContract(authorityBoundary);
  const contract: FeedbackEventStoreListRouteContract = {
    contract_kind: "feedback_event_store_list_route_contract",
    contract_version: contractVersion,
    scope: input.scope ?? "project:augnes",
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1",
    route_path: routePath,
    route_method: routeMethod,
    route_implemented_now: false,
    source_feedback_event_store_ref: `${input.feedbackEventStoreFixture.fixture_version}:${sourceFeedbackEventStoreFixturePath}`,
    source_feedback_event_store_fixture_path: sourceFeedbackEventStoreFixturePath,
    source_feedback_event_controls_ui_browser_validation_ref: `${input.feedbackEventControlsUiBrowserValidation.validation_version}:${sourceUiBrowserValidationFixturePath}`,
    source_feedback_event_controls_ui_browser_validation_fixture_path:
      sourceUiBrowserValidationFixturePath,
    ...(input.feedbackEventControlsUiImplementationFixture
      ? {
          source_feedback_event_controls_ui_implementation_ref: `${input.feedbackEventControlsUiImplementationFixture.implementation_version ?? input.feedbackEventControlsUiImplementationFixture.fixture_version}:${sourceUiImplementationFixturePath}`,
          source_feedback_event_controls_ui_implementation_fixture_path:
            sourceUiImplementationFixturePath,
        }
      : {}),
    ...(input.feedbackEventWriteRouteBrowserValidation
      ? {
          source_feedback_event_write_route_browser_validation_ref: `${input.feedbackEventWriteRouteBrowserValidation.validation_version}:${sourceWriteRouteBrowserValidationFixturePath}`,
          source_feedback_event_write_route_browser_validation_fixture_path:
            sourceWriteRouteBrowserValidationFixturePath,
        }
      : {}),
    request_contract: requestContract,
    response_contract: responseContract,
    refusal_contracts: buildRefusalContracts(),
    filter_contract: buildFilterContract(),
    pagination_contract: buildPaginationContract(),
    authority_boundary: authorityBoundary,
    validation: { passed: true, failure_codes: [] },
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  contract.validation = validateFeedbackEventStoreListRouteContract(contract);
  contract.contract_fingerprint =
    createFeedbackEventStoreListRouteContractFingerprint(contract);
  return contract;
}

export function validateFeedbackEventStoreListRouteContract(
  contract: FeedbackEventStoreListRouteContract,
): FeedbackEventStoreListRouteValidationResult {
  const failureCodes: string[] = [];
  if (contract.contract_version !== contractVersion) {
    failureCodes.push("contract_version_invalid");
  }
  if (contract.route_path !== routePath) {
    failureCodes.push("route_path_invalid");
  }
  if (contract.route_method !== routeMethod) {
    failureCodes.push("route_method_invalid");
  }
  if (contract.route_implemented_now !== false) {
    failureCodes.push("route_implemented_now_true");
  }
  if (!contract.request_contract) {
    failureCodes.push("request_contract_missing");
  }
  if (!contract.response_contract) {
    failureCodes.push("response_contract_missing");
  }
  if (!contract.filter_contract) {
    failureCodes.push("filter_contract_missing");
  }
  if (!contract.pagination_contract) {
    failureCodes.push("pagination_contract_missing");
  }
  if (!Array.isArray(contract.refusal_contracts) || contract.refusal_contracts.length === 0) {
    failureCodes.push("refusal_contracts_missing");
  }
  for (const refusalCode of requiredRefusalCodes) {
    if (!contract.refusal_contracts.some((refusal) => refusal.refusal_code === refusalCode)) {
      failureCodes.push(`refusal_code_missing:${refusalCode}`);
    }
  }
  if (!requestAcknowledgementsComplete(contract.request_contract)) {
    failureCodes.push("request_authority_acknowledgements_incomplete");
  }
  if (!filterContractIsSafe(contract.filter_contract)) {
    failureCodes.push("filter_contract_invalid");
  }
  if (!paginationContractIsSafe(contract.pagination_contract)) {
    failureCodes.push("pagination_contract_invalid");
  }
  if (!authorityBoundaryIsSafe(contract.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (!authorityBoundaryIsSafe(contract.response_contract.authority_boundary)) {
    failureCodes.push("response_authority_boundary_forbidden_capability_enabled");
  }
  if (contract.response_contract.route_implemented_now !== false) {
    failureCodes.push("response_route_implemented_now_true");
  }
  if (contract.response_contract.runtime_read_executed_now !== false) {
    failureCodes.push("response_runtime_read_executed_now_true");
  }
  if (contract.response_contract.db_open_now !== false) {
    failureCodes.push("response_db_open_now_true");
  }
  if (contract.response_contract.sql_execution_now !== false) {
    failureCodes.push("response_sql_execution_now_true");
  }
  if (contract.response_contract.events.length !== 0) {
    failureCodes.push("response_events_read_now");
  }
  if (contract.response_contract.count !== 0) {
    failureCodes.push("response_count_nonzero_before_implementation");
  }
  if (contract.authority_boundary.product_write_lane_parked_by_686 !== true) {
    failureCodes.push("product_write_lane_not_parked_by_686");
  }
  if (
    contract.source_feedback_event_store_ref &&
    !contract.source_feedback_event_store_ref.includes("feedback_event_store.v0.1")
  ) {
    failureCodes.push("source_feedback_event_store_ref_invalid");
  }
  if (
    contract.source_feedback_event_controls_ui_browser_validation_ref &&
    !contract.source_feedback_event_controls_ui_browser_validation_ref.includes(
      "feedback_event_controls_ui_browser_validation.v0.1",
    )
  ) {
    failureCodes.push(
      "source_feedback_event_controls_ui_browser_validation_ref_invalid",
    );
  }
  if (contract.recommendation_status !== recommendationStatus) {
    failureCodes.push("recommendation_status_invalid");
  }
  if (contract.next_recommended_slice !== nextRecommendedSlice) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createFeedbackEventStoreListRouteContractFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

export function getFeedbackEventStoreListRouteAuthorityBoundary(): FeedbackEventStoreListRouteAuthorityBoundary {
  return {
    contract_only: true,
    route_implemented_now: false,
    durable_feedback_event_read_now: false,
    durable_feedback_event_written_now: false,
    runtime_read_executed_now: false,
    runtime_write_executed_now: false,
    db_open_now: false,
    sql_execution_now: false,
    server_action_available_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildRequestContract(
  sampleEvent: FeedbackEventStoreEvent,
): FeedbackEventStoreListRouteRequest {
  return {
    request_version: "feedback_event_store_list_route_request.v0.1",
    event_type: sampleEvent.event_type,
    target_kind: sampleEvent.target_kind,
    target_id: sampleEvent.target_id,
    created_after: "2026-06-22T00:00:00.000Z",
    created_before: "2026-06-22T23:59:59.999Z",
    limit: 50,
    cursor: "opaque_cursor_contract_value_not_implemented",
    include_event_json: true,
    authority_acknowledgements: [...requiredAuthorityAcknowledgements],
  };
}

function buildResponseContract(
  authorityBoundary: FeedbackEventStoreListRouteAuthorityBoundary,
): FeedbackEventStoreListRouteResponse {
  return {
    response_version: "feedback_event_store_list_route_response.v0.1",
    accepted: false,
    events: [],
    count: 0,
    next_cursor: null,
    validation: {
      passed: false,
      failure_codes: ["route_not_implemented_in_this_slice"],
    },
    authority_boundary: authorityBoundary,
    refusal: refusalForCode("route_not_implemented_in_this_slice"),
    route_implemented_now: false,
    runtime_read_executed_now: false,
    db_open_now: false,
    sql_execution_now: false,
  };
}

function buildRefusalContracts(): FeedbackEventStoreListRouteRefusal[] {
  return requiredRefusalCodes.map(refusalForCode);
}

function buildFilterContract(): FeedbackEventStoreListRouteFilterContract {
  return {
    allowed_filters: [
      "event_type",
      "target_kind",
      "target_id",
      "created_after",
      "created_before",
      "limit",
      "cursor",
    ],
    disallowed_filters: [
      "arbitrary SQL",
      "raw where clause",
      "source fetch query",
      "retrieval/RAG query",
      "provider query",
      "product write query",
      "proof/evidence query",
      "Perspective promotion query",
      "work mutation query",
    ],
    arbitrary_sql_allowed: false,
    raw_where_clause_allowed: false,
    source_fetch_query_allowed: false,
    retrieval_rag_query_allowed: false,
    provider_query_allowed: false,
    product_write_query_allowed: false,
    proof_evidence_query_allowed: false,
    perspective_promotion_query_allowed: false,
    work_mutation_query_allowed: false,
  };
}

function buildPaginationContract(): FeedbackEventStoreListRoutePaginationContract {
  return {
    default_limit: 50,
    max_limit: 100,
    deterministic_order: ["created_at DESC", "event_id DESC"],
    cursor_is_opaque_contract_value: true,
    cursor_implemented_now: false,
    exposes_raw_sql_cursor_internals: false,
    implementation_notes: [
      "A future implementation must apply default limit 50 and max limit 100.",
      "A future implementation must order deterministically by created_at DESC and event_id DESC.",
      "The cursor is an opaque contract value; this slice does not implement cursor encoding or expose raw SQL cursor internals.",
    ],
  };
}

function refusalForCode(
  refusalCode: FeedbackEventStoreListRouteRefusalCode,
): FeedbackEventStoreListRouteRefusal {
  return {
    refusal_code: refusalCode,
    message: messageForRefusalCode(refusalCode),
    retryable: retryableRefusal(refusalCode),
    authority_boundary_notes: [
      "Feedback Event Store list route contract only; no route handler, server action, runtime DB read/write, SQL execution, proof/evidence, Perspective promotion, work mutation, execution, retrieval/RAG, source fetch, provider/OpenAI call, GitHub automation, external handoff, or product-write authority exists in this slice.",
    ],
  };
}

function requestAcknowledgementsComplete(
  request: FeedbackEventStoreListRouteRequest,
): boolean {
  if (!request || !Array.isArray(request.authority_acknowledgements)) return false;
  return requiredAuthorityAcknowledgements.every((acknowledgement) =>
    request.authority_acknowledgements.includes(acknowledgement),
  );
}

function filterContractIsSafe(
  filterContract: FeedbackEventStoreListRouteFilterContract,
): boolean {
  return (
    filterContract.arbitrary_sql_allowed === false &&
    filterContract.raw_where_clause_allowed === false &&
    filterContract.source_fetch_query_allowed === false &&
    filterContract.retrieval_rag_query_allowed === false &&
    filterContract.provider_query_allowed === false &&
    filterContract.product_write_query_allowed === false &&
    filterContract.proof_evidence_query_allowed === false &&
    filterContract.perspective_promotion_query_allowed === false &&
    filterContract.work_mutation_query_allowed === false &&
    filterContract.allowed_filters.includes("event_type") &&
    filterContract.allowed_filters.includes("target_kind") &&
    filterContract.allowed_filters.includes("target_id") &&
    filterContract.allowed_filters.includes("created_after") &&
    filterContract.allowed_filters.includes("created_before") &&
    filterContract.allowed_filters.includes("limit") &&
    filterContract.allowed_filters.includes("cursor")
  );
}

function paginationContractIsSafe(
  paginationContract: FeedbackEventStoreListRoutePaginationContract,
): boolean {
  return (
    paginationContract.default_limit === 50 &&
    paginationContract.max_limit === 100 &&
    paginationContract.cursor_is_opaque_contract_value === true &&
    paginationContract.cursor_implemented_now === false &&
    paginationContract.exposes_raw_sql_cursor_internals === false &&
    paginationContract.deterministic_order[0] === "created_at DESC" &&
    paginationContract.deterministic_order[1] === "event_id DESC"
  );
}

function authorityBoundaryIsSafe(
  boundary: FeedbackEventStoreListRouteAuthorityBoundary,
): boolean {
  if (!boundary || typeof boundary !== "object") return false;
  if (boundary.contract_only !== true) return false;
  if (boundary.product_write_lane_parked_by_686 !== true) return false;
  for (const key of [
    "route_implemented_now",
    "durable_feedback_event_read_now",
    "durable_feedback_event_written_now",
    "runtime_read_executed_now",
    "runtime_write_executed_now",
    "db_open_now",
    "sql_execution_now",
    "server_action_available_now",
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "execution_authority",
    "codex_execution_authority",
    "github_automation_authority",
    "external_handoff_authority",
    "provider_openai_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ] as const) {
    if (boundary[key] !== false) return false;
  }
  return true;
}

function selectSampleEvent(events: FeedbackEventStoreEvent[]): FeedbackEventStoreEvent {
  const pinPreview = events.find((event) => event.event_type === "pin_preview");
  return pinPreview ?? events[0];
}

function messageForRefusalCode(
  refusalCode: FeedbackEventStoreListRouteRefusalCode,
): string {
  switch (refusalCode) {
    case "route_not_implemented_in_this_slice":
      return "The Feedback Event Store list route is documented by contract only and is not implemented in this slice.";
    case "missing_authority_acknowledgement":
      return "The request is missing one or more required authority acknowledgements.";
    case "invalid_request_version":
      return "The request_version must be feedback_event_store_list_route_request.v0.1.";
    case "invalid_event_type":
      return "The request event_type is not allowed by Feedback Event Store v0.1.";
    case "invalid_target_kind":
      return "The request target_kind is not allowed by Feedback Event Store v0.1.";
    case "invalid_limit":
      return "The request limit must be within the list route pagination contract.";
    case "invalid_cursor":
      return "The request cursor must be an opaque list route cursor value.";
    case "raw_sql_filter_forbidden":
      return "Raw SQL and raw where-clause filters are forbidden.";
    case "forbidden_authority_requested":
      return "The request asks for authority outside feedback event read/list authority.";
    case "product_write_authority_requested":
      return "The request asks for product-write authority, which remains parked by #686.";
    case "retrieval_rag_execution_requested":
      return "The request asks for retrieval/RAG execution, which is forbidden.";
    case "provider_openai_call_requested":
      return "The request asks for provider/OpenAI calls, which are forbidden.";
    case "source_fetch_requested":
      return "The request asks for source fetch, which is forbidden.";
    case "codex_or_github_automation_requested":
      return "The request asks for Codex or GitHub automation, which is forbidden.";
  }
}

function retryableRefusal(
  refusalCode: FeedbackEventStoreListRouteRefusalCode,
): boolean {
  return refusalCode !== "route_not_implemented_in_this_slice";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "contract_fingerprint")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
