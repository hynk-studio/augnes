import type {
  FeedbackEventControlUiAuthorityBoundary,
  FeedbackEventControlUiBinding,
  FeedbackEventControlUiDisabledState,
  FeedbackEventControlUiRequestPreview,
  FeedbackEventControlsUiContract,
  FeedbackEventControlsUiContractInput,
  FeedbackEventControlsUiValidationResult,
} from "@/types/feedback-event-controls-ui-contract";
import type { FeedbackEventStoreReviewControl } from "@/types/feedback-event-store-review-controls-preview";
import type { FeedbackEventWriteRouteAuthorityAcknowledgement } from "@/types/feedback-event-write-route-contract";

type JsonRecord = Record<string, unknown>;

const contractVersion = "feedback_event_controls_ui_contract.v0.1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "POST";
const recommendationStatus =
  "ready_for_feedback_event_controls_ui_implementation_v0_1";
const nextRecommendedSlice = "feedback_event_controls_ui_implementation_v0_1";
const defaultReviewControlsPreviewFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const defaultWriteRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const defaultWriteRouteImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json";
const defaultWriteRouteValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json";
const defaultFeedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";

const requiredControlKinds = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
] as const;

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

const repoLocalSourceRefPrefixes = [
  "fixtures/",
  "components/",
  "docs/",
  "types/",
  "lib/",
  "scripts/",
];

const externalLineageSourceRefPrefixes = ["pr:"];

export function buildFeedbackEventControlsUiContract(
  input: FeedbackEventControlsUiContractInput,
): FeedbackEventControlsUiContract {
  const sourceReviewControlsPreviewFixturePath =
    input.source_review_controls_preview_fixture_path ??
    defaultReviewControlsPreviewFixturePath;
  const sourceWriteRouteContractFixturePath =
    input.source_write_route_contract_fixture_path ??
    defaultWriteRouteContractFixturePath;
  const sourceWriteRouteImplementationFixturePath =
    input.source_write_route_implementation_fixture_path ??
    defaultWriteRouteImplementationFixturePath;
  const sourceWriteRouteValidationFixturePath =
    input.source_write_route_validation_fixture_path ??
    defaultWriteRouteValidationFixturePath;
  const sourceFeedbackEventStoreFixturePath =
    input.source_feedback_event_store_fixture_path ??
    defaultFeedbackEventStoreFixturePath;
  const controlBindings = orderControls(input.reviewControlsPreview.controls).map(
    buildControlBinding,
  );
  const requestPreviews = controlBindings.map((binding) =>
    buildRequestPreview(input, binding),
  );
  const contract: FeedbackEventControlsUiContract = {
    contract_kind: "feedback_event_controls_ui_contract",
    contract_version: contractVersion,
    scope: input.scope ?? "project:augnes",
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1",
    source_review_controls_preview_ref: `${input.reviewControlsPreview.preview_version}:${sourceReviewControlsPreviewFixturePath}`,
    source_review_controls_preview_fixture_path:
      sourceReviewControlsPreviewFixturePath,
    source_review_controls_preview_fingerprint:
      input.reviewControlsPreview.preview_fingerprint,
    source_write_route_contract_ref: `${input.writeRouteContract.contract_version}:${sourceWriteRouteContractFixturePath}`,
    source_write_route_contract_fixture_path: sourceWriteRouteContractFixturePath,
    source_write_route_contract_fingerprint:
      input.writeRouteContract.contract_fingerprint,
    source_write_route_implementation_ref: `${input.writeRouteImplementationFixture.fixture_version}:${sourceWriteRouteImplementationFixturePath}`,
    source_write_route_implementation_fixture_path:
      sourceWriteRouteImplementationFixturePath,
    source_write_route_validation_ref: `${input.writeRouteBrowserValidation.validation_version}:${sourceWriteRouteValidationFixturePath}`,
    source_write_route_validation_fixture_path:
      sourceWriteRouteValidationFixturePath,
    source_feedback_event_store_ref: `${input.feedbackEventStoreFixture.fixture_version}:${sourceFeedbackEventStoreFixturePath}`,
    source_feedback_event_store_fixture_path: sourceFeedbackEventStoreFixturePath,
    route_path: routePath,
    route_method: routeMethod,
    ui_implemented_now: false,
    components_changed_now: false,
    route_changed_now: false,
    browser_request_executed_now: false,
    feedback_event_persisted_now: false,
    control_bindings: controlBindings,
    request_previews: requestPreviews,
    disabled_state_policy: getDisabledStatePolicy(),
    authority_acknowledgement_policy: getAuthorityAcknowledgementPolicy(),
    error_display_policy: getErrorDisplayPolicy(),
    source_ref_policy: getSourceRefPolicy(),
    authority_boundary: getFeedbackEventControlsUiAuthorityBoundary(),
    validation: { passed: true, failure_codes: [] },
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  contract.validation = validateFeedbackEventControlsUiContract(contract);
  contract.contract_fingerprint =
    createFeedbackEventControlsUiContractFingerprint(contract);
  return contract;
}

export function validateFeedbackEventControlsUiContract(
  contract: FeedbackEventControlsUiContract,
): FeedbackEventControlsUiValidationResult {
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
  if (contract.feedback_event_persisted_now !== false) {
    failureCodes.push("feedback_event_persisted_now_true");
  }
  if (!Array.isArray(contract.control_bindings) || contract.control_bindings.length === 0) {
    failureCodes.push("control_bindings_missing");
  }
  if (!Array.isArray(contract.request_previews) || contract.request_previews.length === 0) {
    failureCodes.push("request_previews_missing");
  }
  const bindingKinds = new Set(
    contract.control_bindings.map((binding) => binding.control_kind),
  );
  for (const controlKind of requiredControlKinds) {
    if (!bindingKinds.has(controlKind)) {
      failureCodes.push(`control_binding_kind_missing:${controlKind}`);
    }
  }
  for (const binding of contract.control_bindings) {
    if (binding.disabled_now !== true) {
      failureCodes.push(`control_not_disabled:${binding.binding_id}`);
    }
    if (binding.preview_only_now !== true) {
      failureCodes.push(`control_not_preview_only:${binding.binding_id}`);
    }
    if (
      binding.ui_component_added_now !== false ||
      binding.browser_request_sent_now !== false ||
      binding.feedback_event_persisted_now !== false
    ) {
      failureCodes.push(`control_runtime_action_enabled:${binding.binding_id}`);
    }
    if (binding.route_path !== routePath || binding.route_method !== routeMethod) {
      failureCodes.push(`control_route_invalid:${binding.binding_id}`);
    }
    if (!contract.request_previews.some((preview) => preview.request_preview_id === binding.request_preview_id)) {
      failureCodes.push(`control_request_preview_missing:${binding.binding_id}`);
    }
  }
  for (const requestPreview of contract.request_previews) {
    if (requestPreview.request_version !== "feedback_event_write_route_request.v0.1") {
      failureCodes.push(`request_version_invalid:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.request_sent_now !== false) {
      failureCodes.push(`request_sent_now:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.route_response_observed_now !== false) {
      failureCodes.push(
        `request_route_response_observed_now:${requestPreview.request_preview_id}`,
      );
    }
    if (requestPreview.feedback_event_written_now !== false) {
      failureCodes.push(`request_feedback_event_written_now:${requestPreview.request_preview_id}`);
    }
    if (requestPreview.request_valid_for_route_contract !== true) {
      failureCodes.push(`request_not_valid_for_route_contract:${requestPreview.request_preview_id}`);
    }
    if (!requestAcknowledgementsComplete(requestPreview)) {
      failureCodes.push(
        `request_authority_acknowledgements_incomplete:${requestPreview.request_preview_id}`,
      );
    }
    if (
      requestPreview.event_type === "correct_preview" &&
      !nonEmptyString(requestPreview.correction_text_placeholder)
    ) {
      failureCodes.push("correct_preview_missing_correction_text_placeholder");
    }
    if (
      requestPreview.source_ref_ids.length === 0 &&
      !nonEmptyString(requestPreview.reason_placeholder)
    ) {
      failureCodes.push(`request_source_refs_missing:${requestPreview.request_preview_id}`);
    }
  }
  if (
    contract.disabled_state_policy.all_controls_disabled_now !== true ||
    contract.disabled_state_policy.reason !== "contract_only_no_ui_implementation"
  ) {
    failureCodes.push("disabled_state_policy_invalid");
  }
  if (
    !requestAcknowledgementsPolicyComplete(
      contract.authority_acknowledgement_policy.required_acknowledgements,
    )
  ) {
    failureCodes.push("authority_acknowledgement_policy_incomplete");
  }
  if (!authorityBoundaryIsSafe(contract.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (contract.authority_boundary.product_write_lane_parked_by_686 !== true) {
    failureCodes.push("product_write_lane_not_parked_by_686");
  }
  if (!contract.source_review_controls_preview_ref.includes("feedback_event_store_review_controls_preview.v0.1")) {
    failureCodes.push("source_review_controls_preview_ref_invalid");
  }
  if (!contract.source_write_route_contract_ref.includes("feedback_event_write_route_contract.v0.1")) {
    failureCodes.push("source_write_route_contract_ref_invalid");
  }
  if (!contract.source_write_route_implementation_ref.includes("feedback_event_write_route_implementation.v0.1")) {
    failureCodes.push("source_write_route_implementation_ref_invalid");
  }
  if (!contract.source_write_route_validation_ref.includes("feedback_event_write_route_browser_validation.v0.1")) {
    failureCodes.push("source_write_route_validation_ref_invalid");
  }
  if (!contract.source_feedback_event_store_ref.includes("feedback_event_store.v0.1")) {
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

export function createFeedbackEventControlsUiContractFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

export function getFeedbackEventControlsUiAuthorityBoundary(): FeedbackEventControlUiAuthorityBoundary {
  return {
    contract_only: true,
    ui_implemented_now: false,
    components_changed_now: false,
    route_changed_now: false,
    browser_request_executed_now: false,
    feedback_event_persisted_now: false,
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

function buildControlBinding(
  control: FeedbackEventStoreReviewControl,
): FeedbackEventControlUiBinding {
  const requestPreviewId = createRequestPreviewId(control);
  return {
    binding_id: `feedback_event_controls_ui_binding:${control.control_kind}:${fnv1a32(
      canonicalJson({ control_id: control.control_id }),
    )}`,
    control_kind: control.control_kind,
    target_kind: control.target.target_kind,
    target_id: control.target.target_id,
    ...(control.target.target_fingerprint
      ? { target_fingerprint: control.target.target_fingerprint }
      : {}),
    source_control_id: control.control_id,
    label: control.label,
    render_location_preview: renderLocationForControl(control),
    route_path: routePath,
    route_method: routeMethod,
    request_preview_id: requestPreviewId,
    disabled_now: true,
    preview_only_now: true,
    ui_component_added_now: false,
    browser_request_sent_now: false,
    feedback_event_persisted_now: false,
    requires_operator_click: true,
    requires_authority_acknowledgements: true,
    authority_boundary_notes: [
      "Controls UI contract only; no component, route change, browser request, DB write, durable feedback persistence, proof/evidence, Perspective promotion, work mutation, execution, retrieval/RAG, source fetch, provider/OpenAI call, GitHub automation, external handoff, or product-write authority exists now.",
    ],
  };
}

function buildRequestPreview(
  input: FeedbackEventControlsUiContractInput,
  binding: FeedbackEventControlUiBinding,
): FeedbackEventControlUiRequestPreview {
  const eventPreview = input.reviewControlsPreview.event_previews.find(
    (preview) =>
      preview.event_type === binding.control_kind &&
      preview.target_kind === binding.target_kind &&
      preview.target_id === binding.target_id,
  );
  return {
    request_preview_id: binding.request_preview_id,
    request_version: "feedback_event_write_route_request.v0.1",
    event_type: eventPreview?.event_type ?? binding.control_kind,
    target_kind: binding.target_kind,
    target_id: binding.target_id,
    ...(binding.target_fingerprint
      ? { target_fingerprint: binding.target_fingerprint }
      : {}),
    source_ref_ids: [...(eventPreview?.source_ref_ids ?? [])],
    operator_note_placeholder:
      eventPreview?.operator_note_placeholder ??
      "Future operator note supplied by a human before any feedback event write.",
    ...(binding.control_kind === "correct_preview"
      ? {
          correction_text_placeholder:
            eventPreview?.correction_text_placeholder ??
            "Future correction text required before a correct_preview write.",
        }
      : {}),
    reason_placeholder:
      eventPreview?.reason_placeholder ??
      "Future operator-selected reason required before any feedback event write.",
    ...(eventPreview?.idempotency_key_preview
      ? { idempotency_key_preview: eventPreview.idempotency_key_preview }
      : {}),
    client_request_id_preview: `feedback_event_controls_ui_contract:${binding.request_preview_id}`,
    authority_acknowledgements: [...requiredAuthorityAcknowledgements],
    request_valid_for_route_contract: true,
    request_sent_now: false,
    route_response_observed_now: false,
    feedback_event_written_now: false,
  };
}

function getDisabledStatePolicy(): FeedbackEventControlUiDisabledState {
  return {
    all_controls_disabled_now: true,
    reason: "contract_only_no_ui_implementation",
    future_enablement_requires: [
      "feedback_event_controls_ui_implementation_v0_1",
      "route_validation_passed",
      "explicit_operator_click",
      "no_forbidden_authority_requested",
    ],
  };
}

function getAuthorityAcknowledgementPolicy(): FeedbackEventControlsUiContract["authority_acknowledgement_policy"] {
  return {
    required_acknowledgements: [...requiredAuthorityAcknowledgements],
    every_request_preview_requires_all_acknowledgements: true,
    missing_acknowledgement_refusal_code: "missing_authority_acknowledgement",
    product_write_lane_parked_by_686: true,
  };
}

function getErrorDisplayPolicy(): FeedbackEventControlsUiContract["error_display_policy"] {
  return {
    future_ui_must_display_refusal_code: true,
    future_ui_must_display_validation_failure_codes: true,
    future_ui_must_not_retry_forbidden_authority_refusals: true,
    no_error_display_component_added_now: true,
  };
}

function getSourceRefPolicy(): FeedbackEventControlsUiContract["source_ref_policy"] {
  return {
    repo_local_source_refs_required_or_explicitly_justified: true,
    source_ref_resolution_performed_in_smoke_only: true,
    allowed_repo_local_prefixes: [...repoLocalSourceRefPrefixes],
    allowed_external_lineage_prefixes: [...externalLineageSourceRefPrefixes],
  };
}

function orderControls(
  controls: FeedbackEventStoreReviewControl[],
): FeedbackEventStoreReviewControl[] {
  return requiredControlKinds
    .map((controlKind) =>
      controls.find((control) => control.control_kind === controlKind),
    )
    .filter((control): control is FeedbackEventStoreReviewControl => Boolean(control));
}

function createRequestPreviewId(control: FeedbackEventStoreReviewControl): string {
  return `feedback_event_controls_ui_request_preview:${control.control_kind}:${fnv1a32(
    canonicalJson({
      control_id: control.control_id,
      target_kind: control.target.target_kind,
      target_id: control.target.target_id,
    }),
  )}`;
}

function renderLocationForControl(control: FeedbackEventStoreReviewControl): string {
  switch (control.control_kind) {
    case "dismiss_preview":
      return "agent_perspective_substrate_surfacing_card.preview_feedback_controls";
    case "pin_preview":
      return "agent_perspective_substrate_folded_audit_panel.source_coverage_controls";
    case "correct_preview":
      return "candidate_to_codex_handoff_draft_review.feedback_controls";
    case "invalidate_preview":
      return "candidate_to_codex_handoff_operator_decision_preview.feedback_controls";
  }
}

function requestAcknowledgementsComplete(
  requestPreview: FeedbackEventControlUiRequestPreview,
): boolean {
  return requestAcknowledgementsPolicyComplete(
    requestPreview.authority_acknowledgements,
  );
}

function requestAcknowledgementsPolicyComplete(
  acknowledgements: FeedbackEventWriteRouteAuthorityAcknowledgement[],
): boolean {
  return requiredAuthorityAcknowledgements.every((acknowledgement) =>
    acknowledgements.includes(acknowledgement),
  );
}

function authorityBoundaryIsSafe(
  boundary: FeedbackEventControlUiAuthorityBoundary,
): boolean {
  if (!boundary || typeof boundary !== "object") return false;
  if (boundary.contract_only !== true) return false;
  if (boundary.product_write_lane_parked_by_686 !== true) return false;
  for (const key of [
    "ui_implemented_now",
    "components_changed_now",
    "route_changed_now",
    "browser_request_executed_now",
    "feedback_event_persisted_now",
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

function nonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
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
