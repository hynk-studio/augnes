import type {
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreTargetKind,
} from "@/types/feedback-event-store";
import type {
  FeedbackEventStoreListUiAuthorityBoundary,
  FeedbackEventStoreListUiContract,
  FeedbackEventStoreListUiContractInput,
  FeedbackEventStoreListUiDisplayPolicy,
  FeedbackEventStoreListUiFilterContract,
  FeedbackEventStoreListUiPanelContract,
  FeedbackEventStoreListUiRequestPreview,
  FeedbackEventStoreListUiStatePolicy,
  FeedbackEventStoreListUiValidationResult,
} from "@/types/feedback-event-store-list-ui-contract";
import type { FeedbackEventStoreListRouteAuthorityAcknowledgement } from "@/types/feedback-event-store-list-route-contract";

type JsonRecord = Record<string, unknown>;

const contractVersion = "feedback_event_store_list_ui_contract.v0.1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "GET";
const requestVersion = "feedback_event_store_list_route_request.v0.1";
const recommendationStatus =
  "ready_for_feedback_event_store_list_ui_implementation_v0_1";
const nextRecommendedSlice =
  "feedback_event_store_list_ui_implementation_v0_1";
const defaultListRouteBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-browser-validation.sample.v0.1.json";
const defaultListRouteImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-implementation.sample.v0.1.json";
const defaultListRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const defaultFeedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const defaultFeedbackEventControlsUiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";

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

const requiredPreviewIds = [
  "feedback_event_store_list_ui_request_preview:list_all_feedback_events",
  "feedback_event_store_list_ui_request_preview:list_pin_preview_feedback_events",
  "feedback_event_store_list_ui_request_preview:list_folded_section_source_coverage",
  "feedback_event_store_list_ui_request_preview:list_without_event_json",
];

export function buildFeedbackEventStoreListUiContract(
  input: FeedbackEventStoreListUiContractInput,
): FeedbackEventStoreListUiContract {
  const sourceListRouteBrowserValidationFixturePath =
    input.source_list_route_browser_validation_fixture_path ??
    defaultListRouteBrowserValidationFixturePath;
  const sourceListRouteImplementationFixturePath =
    input.source_list_route_implementation_fixture_path ??
    defaultListRouteImplementationFixturePath;
  const sourceListRouteContractFixturePath =
    input.source_list_route_contract_fixture_path ??
    defaultListRouteContractFixturePath;
  const sourceFeedbackEventStoreFixturePath =
    input.source_feedback_event_store_fixture_path ??
    defaultFeedbackEventStoreFixturePath;
  const sourceFeedbackEventControlsUiImplementationFixturePath =
    input.source_feedback_event_controls_ui_implementation_fixture_path ??
    defaultFeedbackEventControlsUiImplementationFixturePath;
  const sourceFeedbackEventControlsUiImplementationRef =
    input.feedbackEventControlsUiImplementationFixture
      ? `${input.feedbackEventControlsUiImplementationFixture.implementation_version}:${sourceFeedbackEventControlsUiImplementationFixturePath}`
      : undefined;

  const contract: FeedbackEventStoreListUiContract = {
    contract_kind: "feedback_event_store_list_ui_contract",
    contract_version: contractVersion,
    scope: input.scope ?? "project:augnes",
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.feedback-event-store-list-ui-contract.sample.v0.1",
    source_list_route_browser_validation_ref: `${input.listRouteBrowserValidation.validation_version}:${sourceListRouteBrowserValidationFixturePath}`,
    source_list_route_browser_validation_fixture_path:
      sourceListRouteBrowserValidationFixturePath,
    source_list_route_implementation_ref: `${input.listRouteImplementationFixture.fixture_version}:${sourceListRouteImplementationFixturePath}`,
    source_list_route_implementation_fixture_path:
      sourceListRouteImplementationFixturePath,
    source_list_route_contract_ref: `${input.listRouteContract.contract_version}:${sourceListRouteContractFixturePath}`,
    source_list_route_contract_fixture_path: sourceListRouteContractFixturePath,
    source_list_route_contract_fingerprint:
      input.listRouteContract.contract_fingerprint,
    source_feedback_event_store_ref: `${input.feedbackEventStoreFixture.fixture_version}:${sourceFeedbackEventStoreFixturePath}`,
    source_feedback_event_store_fixture_path: sourceFeedbackEventStoreFixturePath,
    ...(sourceFeedbackEventControlsUiImplementationRef
      ? {
          source_feedback_event_controls_ui_implementation_ref:
            sourceFeedbackEventControlsUiImplementationRef,
          source_feedback_event_controls_ui_implementation_fixture_path:
            sourceFeedbackEventControlsUiImplementationFixturePath,
        }
      : {}),
    route_path: routePath,
    route_method: routeMethod,
    ui_implemented_now: false,
    components_changed_now: false,
    route_changed_now: false,
    browser_request_executed_now: false,
    feedback_events_read_now: false,
    feedback_events_written_now: false,
    panel_contract: buildPanelContract(),
    filter_contract: buildFilterContract(),
    request_previews: buildRequestPreviews(input.feedbackEventStoreFixture.events),
    display_policy: buildDisplayPolicy(),
    state_policy: buildStatePolicy(),
    error_display_policy: buildErrorDisplayPolicy(),
    authority_acknowledgement_policy: buildAuthorityAcknowledgementPolicy(),
    authority_boundary: buildAuthorityBoundary(),
    validation: { passed: true, failure_codes: [] },
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  contract.validation = validateFeedbackEventStoreListUiContract(contract);
  contract.contract_fingerprint =
    createFeedbackEventStoreListUiContractFingerprint(contract);
  return contract;
}

export function validateFeedbackEventStoreListUiContract(
  contract: FeedbackEventStoreListUiContract,
): FeedbackEventStoreListUiValidationResult {
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
  if (contract.ui_implemented_now !== false) {
    failureCodes.push("ui_implemented_now_true");
  }
  if (contract.components_changed_now !== false) {
    failureCodes.push("components_changed_now_true");
  }
  if (contract.route_changed_now !== false) {
    failureCodes.push("route_changed_now_true");
  }
  if (contract.browser_request_executed_now !== false) {
    failureCodes.push("browser_request_executed_now_true");
  }
  if (contract.feedback_events_read_now !== false) {
    failureCodes.push("feedback_events_read_now_true");
  }
  if (contract.feedback_events_written_now !== false) {
    failureCodes.push("feedback_events_written_now_true");
  }
  if (!panelContractIsSafe(contract.panel_contract)) {
    failureCodes.push("panel_contract_invalid");
  }
  if (!filterContractIsSafe(contract.filter_contract)) {
    failureCodes.push("filter_contract_invalid");
  }
  if (!Array.isArray(contract.request_previews) || contract.request_previews.length === 0) {
    failureCodes.push("request_previews_missing");
  }
  for (const requestPreviewId of requiredPreviewIds) {
    if (
      !contract.request_previews.some(
        (preview) => preview.request_preview_id === requestPreviewId,
      )
    ) {
      failureCodes.push(`request_preview_missing:${requestPreviewId}`);
    }
  }
  for (const requestPreview of contract.request_previews) {
    if (requestPreview.request_version !== requestVersion) {
      failureCodes.push(`request_version_invalid:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.route_path !== routePath || requestPreview.route_method !== routeMethod) {
      failureCodes.push(`request_route_invalid:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.request_sent_now !== false) {
      failureCodes.push(`request_sent_now:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.route_response_observed_now !== false) {
      failureCodes.push(
        `route_response_observed_now:${requestPreview.request_preview_id}`,
      );
    }
    if (requestPreview.feedback_events_read_now !== false) {
      failureCodes.push(`feedback_events_read_now:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.request_valid_for_route_contract !== true) {
      failureCodes.push(`request_not_valid_for_route_contract:${requestPreview.request_preview_id}`);
    }
    if (!requestAcknowledgementsComplete(requestPreview)) {
      failureCodes.push(
        `request_authority_acknowledgements_incomplete:${requestPreview.request_preview_id}`,
      );
    }
  }
  if (!displayPolicyIsSafe(contract.display_policy)) {
    failureCodes.push("display_policy_invalid");
  }
  if (!statePolicyIsSafe(contract.state_policy)) {
    failureCodes.push("state_policy_invalid");
  }
  if (
    contract.error_display_policy.future_ui_must_display_refusal_code !== true ||
    contract.error_display_policy.future_ui_must_display_validation_failure_codes !== true ||
    contract.error_display_policy.future_ui_must_not_retry_forbidden_authority_refusals !== true ||
    contract.error_display_policy.no_error_display_component_added_now !== true
  ) {
    failureCodes.push("error_display_policy_invalid");
  }
  if (
    !requiredAuthorityAcknowledgements.every((acknowledgement) =>
      contract.authority_acknowledgement_policy.required_acknowledgements.includes(
        acknowledgement,
      ),
    ) ||
    contract.authority_acknowledgement_policy
      .every_request_preview_requires_all_acknowledgements !== true ||
    contract.authority_acknowledgement_policy.product_write_lane_parked_by_686 !== true
  ) {
    failureCodes.push("authority_acknowledgement_policy_incomplete");
  }
  if (!authorityBoundaryIsSafe(contract.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (
    !contract.source_list_route_browser_validation_ref.includes(
      "feedback_event_store_list_route_browser_validation.v0.1",
    )
  ) {
    failureCodes.push("source_list_route_browser_validation_ref_invalid");
  }
  if (
    !contract.source_list_route_implementation_ref.includes(
      "feedback_event_store_list_route_implementation.v0.1",
    )
  ) {
    failureCodes.push("source_list_route_implementation_ref_invalid");
  }
  if (
    !contract.source_list_route_contract_ref.includes(
      "feedback_event_store_list_route_contract.v0.1",
    )
  ) {
    failureCodes.push("source_list_route_contract_ref_invalid");
  }
  if (
    !contract.source_feedback_event_store_ref.includes("feedback_event_store.v0.1")
  ) {
    failureCodes.push("source_feedback_event_store_ref_invalid");
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

export function createFeedbackEventStoreListUiContractFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildPanelContract(): FeedbackEventStoreListUiPanelContract {
  return {
    panel_id: "feedback-event-store-list-panel",
    intended_location:
      "agent_perspective_substrate_folded_audit_panel.feedback_event_history",
    title: "Feedback event history",
    implemented_now: false,
    component_added_now: false,
    browser_request_sent_now: false,
    durable_feedback_events_read_now: false,
    empty_state_required: true,
    loading_state_required: true,
    refusal_state_required: true,
    duplicate_feedback_display_required: true,
  };
}

function buildFilterContract(): FeedbackEventStoreListUiFilterContract {
  return {
    allowed_ui_filters: [
      "event_type",
      "target_kind",
      "target_id",
      "created_after",
      "created_before",
      "limit",
    ],
    disallowed_ui_filters: [
      "raw SQL",
      "raw where clause",
      "source fetch query",
      "retrieval/RAG query",
      "provider query",
      "product write query",
      "proof/evidence query",
      "Perspective promotion query",
      "work mutation query",
    ],
    raw_sql_filter_allowed: false,
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

function buildRequestPreviews(
  events: FeedbackEventStoreEvent[],
): FeedbackEventStoreListUiRequestPreview[] {
  const pinPreviewEvent = findEvent(
    events,
    "pin_preview",
    "agent_perspective_substrate_folded_section",
    "folded_section:source_coverage",
  );
  return [
    {
      request_preview_id:
        "feedback_event_store_list_ui_request_preview:list_all_feedback_events",
      request_version: requestVersion,
      route_path: routePath,
      route_method: routeMethod,
      query_params: {
        request_version: requestVersion,
        include_event_json: "true",
        limit: "50",
      },
      authority_acknowledgements: [...requiredAuthorityAcknowledgements],
      request_valid_for_route_contract: true,
      request_sent_now: false,
      route_response_observed_now: false,
      feedback_events_read_now: false,
    },
    {
      request_preview_id:
        "feedback_event_store_list_ui_request_preview:list_pin_preview_feedback_events",
      request_version: requestVersion,
      route_path: routePath,
      route_method: routeMethod,
      query_params: {
        request_version: requestVersion,
        include_event_json: "true",
        event_type: "pin_preview",
        limit: "50",
      },
      authority_acknowledgements: [...requiredAuthorityAcknowledgements],
      request_valid_for_route_contract: true,
      request_sent_now: false,
      route_response_observed_now: false,
      feedback_events_read_now: false,
    },
    {
      request_preview_id:
        "feedback_event_store_list_ui_request_preview:list_folded_section_source_coverage",
      request_version: requestVersion,
      route_path: routePath,
      route_method: routeMethod,
      query_params: {
        request_version: requestVersion,
        include_event_json: "true",
        target_kind:
          pinPreviewEvent?.target_kind ??
          "agent_perspective_substrate_folded_section",
        target_id: pinPreviewEvent?.target_id ?? "folded_section:source_coverage",
        limit: "10",
      },
      authority_acknowledgements: [...requiredAuthorityAcknowledgements],
      request_valid_for_route_contract: true,
      request_sent_now: false,
      route_response_observed_now: false,
      feedback_events_read_now: false,
    },
    {
      request_preview_id:
        "feedback_event_store_list_ui_request_preview:list_without_event_json",
      request_version: requestVersion,
      route_path: routePath,
      route_method: routeMethod,
      query_params: {
        request_version: requestVersion,
        include_event_json: "false",
        limit: "50",
      },
      authority_acknowledgements: [...requiredAuthorityAcknowledgements],
      request_valid_for_route_contract: true,
      request_sent_now: false,
      route_response_observed_now: false,
      feedback_events_read_now: false,
    },
  ];
}

function buildDisplayPolicy(): FeedbackEventStoreListUiDisplayPolicy {
  return {
    event_fields_to_display: [
      "event_type",
      "target_kind",
      "target_id",
      "created_at",
      "reason",
      "operator_note",
      "source_ref_ids",
      "authority_boundary",
    ],
    must_label_feedback_as_operator_input_only: true,
    must_not_label_as_proof_or_evidence: true,
    must_not_label_as_perspective_state: true,
    must_not_label_as_work_status: true,
    must_show_product_write_lane_parked: true,
    must_show_retrieval_rag_not_executed: true,
  };
}

function buildStatePolicy(): FeedbackEventStoreListUiStatePolicy {
  return {
    local_component_state_only: true,
    browser_persistence_allowed: false,
    loading_state_required: true,
    empty_state_required: true,
    refusal_state_required: true,
    duplicate_state_display_allowed: true,
    auto_refresh_allowed_now: false,
  };
}

function buildErrorDisplayPolicy(): FeedbackEventStoreListUiContract["error_display_policy"] {
  return {
    future_ui_must_display_refusal_code: true,
    future_ui_must_display_validation_failure_codes: true,
    future_ui_must_not_retry_forbidden_authority_refusals: true,
    no_error_display_component_added_now: true,
  };
}

function buildAuthorityAcknowledgementPolicy(): FeedbackEventStoreListUiContract["authority_acknowledgement_policy"] {
  return {
    required_acknowledgements: [...requiredAuthorityAcknowledgements],
    every_request_preview_requires_all_acknowledgements: true,
    missing_acknowledgement_refusal_code: "missing_authority_acknowledgement",
    product_write_lane_parked_by_686: true,
  };
}

function buildAuthorityBoundary(): FeedbackEventStoreListUiAuthorityBoundary {
  return {
    contract_only: true,
    ui_implemented_now: false,
    components_changed_now: false,
    route_changed_now: false,
    browser_request_executed_now: false,
    feedback_events_read_now: false,
    feedback_events_written_now: false,
    production_db_used_now: false,
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

function findEvent(
  events: FeedbackEventStoreEvent[],
  eventType: FeedbackEventStoreEventType,
  targetKind: FeedbackEventStoreTargetKind,
  targetId: string,
): FeedbackEventStoreEvent | undefined {
  return events.find(
    (event) =>
      event.event_type === eventType &&
      event.target_kind === targetKind &&
      event.target_id === targetId,
  );
}

function panelContractIsSafe(
  panelContract: FeedbackEventStoreListUiPanelContract,
): boolean {
  return (
    panelContract.panel_id === "feedback-event-store-list-panel" &&
    panelContract.intended_location ===
      "agent_perspective_substrate_folded_audit_panel.feedback_event_history" &&
    panelContract.implemented_now === false &&
    panelContract.component_added_now === false &&
    panelContract.browser_request_sent_now === false &&
    panelContract.durable_feedback_events_read_now === false &&
    panelContract.empty_state_required === true &&
    panelContract.loading_state_required === true &&
    panelContract.refusal_state_required === true &&
    panelContract.duplicate_feedback_display_required === true
  );
}

function filterContractIsSafe(
  filterContract: FeedbackEventStoreListUiFilterContract,
): boolean {
  return (
    filterContract.raw_sql_filter_allowed === false &&
    filterContract.raw_where_clause_allowed === false &&
    filterContract.source_fetch_query_allowed === false &&
    filterContract.retrieval_rag_query_allowed === false &&
    filterContract.provider_query_allowed === false &&
    filterContract.product_write_query_allowed === false &&
    filterContract.proof_evidence_query_allowed === false &&
    filterContract.perspective_promotion_query_allowed === false &&
    filterContract.work_mutation_query_allowed === false &&
    filterContract.allowed_ui_filters.includes("event_type") &&
    filterContract.allowed_ui_filters.includes("target_kind") &&
    filterContract.allowed_ui_filters.includes("target_id") &&
    filterContract.allowed_ui_filters.includes("created_after") &&
    filterContract.allowed_ui_filters.includes("created_before") &&
    filterContract.allowed_ui_filters.includes("limit")
  );
}

function requestAcknowledgementsComplete(
  requestPreview: FeedbackEventStoreListUiRequestPreview,
): boolean {
  return requiredAuthorityAcknowledgements.every((acknowledgement) =>
    requestPreview.authority_acknowledgements.includes(acknowledgement),
  );
}

function displayPolicyIsSafe(
  displayPolicy: FeedbackEventStoreListUiDisplayPolicy,
): boolean {
  return (
    displayPolicy.event_fields_to_display.includes("event_type") &&
    displayPolicy.event_fields_to_display.includes("target_kind") &&
    displayPolicy.event_fields_to_display.includes("target_id") &&
    displayPolicy.event_fields_to_display.includes("created_at") &&
    displayPolicy.event_fields_to_display.includes("reason") &&
    displayPolicy.event_fields_to_display.includes("operator_note") &&
    displayPolicy.event_fields_to_display.includes("source_ref_ids") &&
    displayPolicy.event_fields_to_display.includes("authority_boundary") &&
    displayPolicy.must_label_feedback_as_operator_input_only === true &&
    displayPolicy.must_not_label_as_proof_or_evidence === true &&
    displayPolicy.must_not_label_as_perspective_state === true &&
    displayPolicy.must_not_label_as_work_status === true &&
    displayPolicy.must_show_product_write_lane_parked === true &&
    displayPolicy.must_show_retrieval_rag_not_executed === true
  );
}

function statePolicyIsSafe(
  statePolicy: FeedbackEventStoreListUiStatePolicy,
): boolean {
  return (
    statePolicy.local_component_state_only === true &&
    statePolicy.browser_persistence_allowed === false &&
    statePolicy.loading_state_required === true &&
    statePolicy.empty_state_required === true &&
    statePolicy.refusal_state_required === true &&
    statePolicy.duplicate_state_display_allowed === true &&
    statePolicy.auto_refresh_allowed_now === false
  );
}

function authorityBoundaryIsSafe(
  boundary: FeedbackEventStoreListUiAuthorityBoundary,
): boolean {
  if (!boundary || typeof boundary !== "object") return false;
  if (boundary.contract_only !== true) return false;
  if (boundary.product_write_lane_parked_by_686 !== true) return false;
  for (const key of [
    "ui_implemented_now",
    "components_changed_now",
    "route_changed_now",
    "browser_request_executed_now",
    "feedback_events_read_now",
    "feedback_events_written_now",
    "production_db_used_now",
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
