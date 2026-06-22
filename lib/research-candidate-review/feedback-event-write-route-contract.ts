import type {
  FeedbackEventWriteRouteAuthorityAcknowledgement,
  FeedbackEventWriteRouteAuthorityBoundary,
  FeedbackEventWriteRouteContract,
  FeedbackEventWriteRouteContractInput,
  FeedbackEventWriteRouteIdempotencyContract,
  FeedbackEventWriteRouteRefusal,
  FeedbackEventWriteRouteRefusalCode,
  FeedbackEventWriteRouteRequest,
  FeedbackEventWriteRouteResponse,
  FeedbackEventWriteRouteValidationResult,
} from "@/types/feedback-event-write-route-contract";
import type { FeedbackEventStoreReviewControlEventPreview } from "@/types/feedback-event-store-review-controls-preview";

type JsonRecord = Record<string, unknown>;

const contractVersion = "feedback_event_write_route_contract.v0.1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "POST";
const recommendationStatus =
  "ready_for_feedback_event_write_route_implementation_v0_1";
const nextRecommendedSlice = "feedback_event_write_route_implementation_v0_1";
const defaultReviewControlsPreviewFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const defaultFeedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";

const requiredAuthorityAcknowledgements: FeedbackEventWriteRouteAuthorityAcknowledgement[] = [
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
];

const requiredRefusalCodes: FeedbackEventWriteRouteRefusalCode[] = [
  "route_not_implemented_in_this_slice",
  "missing_authority_acknowledgement",
  "invalid_event_type",
  "invalid_target_kind",
  "missing_target_id",
  "missing_source_refs_without_reason",
  "correction_text_required_for_correct_preview",
  "operator_note_secret_like_pattern",
  "forbidden_authority_requested",
  "product_write_authority_requested",
  "retrieval_rag_execution_requested",
  "provider_openai_call_requested",
  "source_fetch_requested",
  "codex_or_github_automation_requested",
];

export function buildFeedbackEventWriteRouteContract(
  input: FeedbackEventWriteRouteContractInput,
): FeedbackEventWriteRouteContract {
  const reviewControlsFixturePath =
    input.source_review_controls_preview_fixture_path ??
    defaultReviewControlsPreviewFixturePath;
  const feedbackEventStoreFixturePath =
    input.source_feedback_event_store_fixture_path ??
    defaultFeedbackEventStoreFixturePath;
  const requestEventPreview = selectRequestEventPreview(
    input.reviewControlsPreview.event_previews,
  );
  const authorityBoundary = getFeedbackEventWriteRouteAuthorityBoundary();
  const requestContract = buildRequestContract(requestEventPreview);
  const responseContract = buildResponseContract(requestEventPreview, authorityBoundary);
  const contract: FeedbackEventWriteRouteContract = {
    contract_kind: "feedback_event_write_route_contract",
    contract_version: contractVersion,
    scope: input.scope ?? "project:augnes",
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.feedback-event-write-route-contract.sample.v0.1",
    route_path: routePath,
    route_method: routeMethod,
    route_implemented_now: false,
    source_review_controls_preview_ref: `${input.reviewControlsPreview.preview_version}:${reviewControlsFixturePath}`,
    source_review_controls_preview_fixture_path: reviewControlsFixturePath,
    source_review_controls_preview_fingerprint:
      input.reviewControlsPreview.preview_fingerprint,
    source_feedback_event_store_ref: `${input.feedbackEventStoreFixture.fixture_version}:${feedbackEventStoreFixturePath}`,
    source_feedback_event_store_fixture_path: feedbackEventStoreFixturePath,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    request_contract: requestContract,
    response_contract: responseContract,
    refusal_contracts: buildRefusalContracts(),
    idempotency_contract: buildIdempotencyContract(),
    authority_boundary: authorityBoundary,
    validation: { passed: true, failure_codes: [] },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  contract.validation = validateFeedbackEventWriteRouteContract(contract);
  contract.contract_fingerprint =
    createFeedbackEventWriteRouteContractFingerprint(contract);
  return contract;
}

export function validateFeedbackEventWriteRouteContract(
  contract: FeedbackEventWriteRouteContract,
): FeedbackEventWriteRouteValidationResult {
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
  if (!Array.isArray(contract.refusal_contracts) || contract.refusal_contracts.length === 0) {
    failureCodes.push("refusal_contracts_missing");
  }
  if (!contract.idempotency_contract) {
    failureCodes.push("idempotency_contract_missing");
  }
  for (const refusalCode of requiredRefusalCodes) {
    if (!contract.refusal_contracts.some((refusal) => refusal.refusal_code === refusalCode)) {
      failureCodes.push(`refusal_code_missing:${refusalCode}`);
    }
  }
  if (!requestAcknowledgementsComplete(contract.request_contract)) {
    failureCodes.push("request_authority_acknowledgements_incomplete");
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
  if (contract.response_contract.runtime_write_executed_now !== false) {
    failureCodes.push("response_runtime_write_executed_now_true");
  }
  if (contract.response_contract.db_open_now !== false) {
    failureCodes.push("response_db_open_now_true");
  }
  if (contract.response_contract.sql_execution_now !== false) {
    failureCodes.push("response_sql_execution_now_true");
  }
  if (!idempotencyContractIsSafe(contract.idempotency_contract)) {
    failureCodes.push("idempotency_contract_invalid");
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
    contract.source_review_controls_preview_ref &&
    !contract.source_review_controls_preview_ref.includes(
      "feedback_event_store_review_controls_preview.v0.1",
    )
  ) {
    failureCodes.push("source_review_controls_preview_ref_invalid");
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

export function createFeedbackEventWriteRouteContractFingerprint(value: unknown): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

export function getFeedbackEventWriteRouteAuthorityBoundary(): FeedbackEventWriteRouteAuthorityBoundary {
  return {
    contract_only: true,
    route_implemented_now: false,
    durable_feedback_event_written_now: false,
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
  eventPreview: FeedbackEventStoreReviewControlEventPreview,
): FeedbackEventWriteRouteRequest {
  return {
    request_version: "feedback_event_write_route_request.v0.1",
    event_type: eventPreview.event_type,
    target_kind: eventPreview.target_kind,
    target_id: eventPreview.target_id,
    ...(eventPreview.target_fingerprint
      ? { target_fingerprint: eventPreview.target_fingerprint }
      : {}),
    source_ref_ids: [...eventPreview.source_ref_ids],
    operator_note: "Future human operator note supplied by the write route caller.",
    ...(eventPreview.event_type === "correct_preview"
      ? {
          correction_text:
            "Future human correction text supplied by the write route caller.",
        }
      : {}),
    reason: eventPreview.reason_placeholder,
    idempotency_key: eventPreview.idempotency_key_preview,
    client_request_id: `feedback_event_write_route_contract:${eventPreview.event_preview_id}`,
    authority_acknowledgements: [...requiredAuthorityAcknowledgements],
  };
}

function buildResponseContract(
  eventPreview: FeedbackEventStoreReviewControlEventPreview,
  authorityBoundary: FeedbackEventWriteRouteAuthorityBoundary,
): FeedbackEventWriteRouteResponse {
  return {
    response_version: "feedback_event_write_route_response.v0.1",
    accepted: false,
    inserted: false,
    duplicate: false,
    event_id: null,
    idempotency_key: eventPreview.idempotency_key_preview,
    event_preview: eventPreview,
    validation: {
      passed: false,
      failure_codes: ["route_not_implemented_in_this_slice"],
    },
    authority_boundary: authorityBoundary,
    refusal: refusalForCode("route_not_implemented_in_this_slice"),
    route_implemented_now: false,
    runtime_write_executed_now: false,
    db_open_now: false,
    sql_execution_now: false,
  };
}

function buildRefusalContracts(): FeedbackEventWriteRouteRefusal[] {
  return requiredRefusalCodes.map(refusalForCode);
}

function refusalForCode(
  refusalCode: FeedbackEventWriteRouteRefusalCode,
): FeedbackEventWriteRouteRefusal {
  return {
    refusal_code: refusalCode,
    message: messageForRefusalCode(refusalCode),
    retryable: retryableRefusal(refusalCode),
    authority_boundary_notes: [
      "Feedback Event write route contract only; no route handler, server action, runtime DB write, SQL execution, proof/evidence, Perspective promotion, work mutation, execution, retrieval/RAG, source fetch, provider/OpenAI call, GitHub automation, external handoff, or product-write authority exists in this slice.",
    ],
  };
}

function buildIdempotencyContract(): FeedbackEventWriteRouteIdempotencyContract {
  return {
    idempotency_key_optional_in_request: true,
    derives_from_normalized_event_input_when_missing: true,
    duplicate_idempotency_key_returns_duplicate_true: true,
    duplicate_inserted_false: true,
    duplicate_row_created: false,
    db_insert_tested_in_this_slice: false,
    contract_notes: [
      "If idempotency_key is omitted, a future implementation must derive it from normalized feedback event input.",
      "Duplicate idempotency_key must return duplicate true and inserted false.",
      "No duplicate row should be created by a future implementation.",
      "This contract slice does not insert/list feedback events and does not open a DB.",
    ],
  };
}

function selectRequestEventPreview(
  eventPreviews: FeedbackEventStoreReviewControlEventPreview[],
): FeedbackEventStoreReviewControlEventPreview {
  const correctPreview = eventPreviews.find(
    (eventPreview) => eventPreview.event_type === "correct_preview",
  );
  return correctPreview ?? eventPreviews[0];
}

function requestAcknowledgementsComplete(
  request: FeedbackEventWriteRouteRequest,
): boolean {
  if (!request || !Array.isArray(request.authority_acknowledgements)) return false;
  return requiredAuthorityAcknowledgements.every((acknowledgement) =>
    request.authority_acknowledgements.includes(acknowledgement),
  );
}

function authorityBoundaryIsSafe(
  boundary: FeedbackEventWriteRouteAuthorityBoundary,
): boolean {
  if (!boundary || typeof boundary !== "object") return false;
  if (boundary.contract_only !== true) return false;
  if (boundary.product_write_lane_parked_by_686 !== true) return false;
  for (const key of [
    "route_implemented_now",
    "durable_feedback_event_written_now",
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

function idempotencyContractIsSafe(
  idempotencyContract: FeedbackEventWriteRouteIdempotencyContract,
): boolean {
  return (
    idempotencyContract.idempotency_key_optional_in_request === true &&
    idempotencyContract.derives_from_normalized_event_input_when_missing === true &&
    idempotencyContract.duplicate_idempotency_key_returns_duplicate_true === true &&
    idempotencyContract.duplicate_inserted_false === true &&
    idempotencyContract.duplicate_row_created === false &&
    idempotencyContract.db_insert_tested_in_this_slice === false
  );
}

function messageForRefusalCode(refusalCode: FeedbackEventWriteRouteRefusalCode): string {
  switch (refusalCode) {
    case "route_not_implemented_in_this_slice":
      return "The feedback event write route is documented by contract only and is not implemented in this slice.";
    case "missing_authority_acknowledgement":
      return "The request is missing one or more required authority acknowledgements.";
    case "invalid_event_type":
      return "The request event_type is not allowed by Feedback Event Store v0.1.";
    case "invalid_target_kind":
      return "The request target_kind is not allowed by Feedback Event Store v0.1.";
    case "missing_target_id":
      return "The request target_id is required.";
    case "missing_source_refs_without_reason":
      return "The request must include source_ref_ids or an explicit reason for empty source refs.";
    case "correction_text_required_for_correct_preview":
      return "correct_preview requests must include correction_text.";
    case "operator_note_secret_like_pattern":
      return "The request operator_note appears to contain a secret-like pattern.";
    case "forbidden_authority_requested":
      return "The request asks for authority outside durable feedback event write authority.";
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

function retryableRefusal(refusalCode: FeedbackEventWriteRouteRefusalCode): boolean {
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
