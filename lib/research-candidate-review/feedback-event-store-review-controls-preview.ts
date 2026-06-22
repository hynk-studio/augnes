import type { FeedbackEventStoreEvent } from "@/types/feedback-event-store";
import type {
  FeedbackEventStoreReviewControl,
  FeedbackEventStoreReviewControlEventPreview,
  FeedbackEventStoreReviewControlKind,
  FeedbackEventStoreReviewControlsAuthorityBoundary,
  FeedbackEventStoreReviewControlsPreview,
  FeedbackEventStoreReviewControlsPreviewInput,
  FeedbackEventStoreReviewControlsValidationResult,
  FeedbackEventStoreReviewControlTarget,
} from "@/types/feedback-event-store-review-controls-preview";

type JsonRecord = Record<string, unknown>;

const previewVersion = "feedback_event_store_review_controls_preview.v0.1";
const recommendationStatus = "ready_for_feedback_event_write_route_contract_v0_1";
const nextRecommendedSlice = "feedback_event_write_route_contract_v0_1";
const defaultSourceFeedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const requiredControlKinds: FeedbackEventStoreReviewControlKind[] = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];

export function buildFeedbackEventStoreReviewControlsPreview(
  input: FeedbackEventStoreReviewControlsPreviewInput,
): FeedbackEventStoreReviewControlsPreview {
  const sourceFeedbackFixturePath =
    input.source_feedback_event_store_fixture_path ??
    defaultSourceFeedbackEventStoreFixturePath;
  const sourceEvents = orderEvents(input.sourceFeedbackEventStoreFixture.events ?? []);
  const eventPreviews = sourceEvents.map(buildEventPreview);
  const controls = sourceEvents.map((event) =>
    buildControl(event, eventPreviews.find((preview) => preview.event_type === event.event_type)),
  );
  const preview: FeedbackEventStoreReviewControlsPreview = {
    preview_kind: "feedback_event_store_review_controls_preview",
    preview_version: previewVersion,
    scope: input.scope ?? "project:augnes",
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1",
    source_feedback_event_store_ref: `${input.sourceFeedbackEventStoreFixture.fixture_version}:${sourceFeedbackFixturePath}`,
    source_feedback_event_store_fixture_path: sourceFeedbackFixturePath,
    preview_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    source_surfaces: buildSourceSurfaces(input, sourceFeedbackFixturePath),
    controls,
    event_previews: eventPreviews,
    authority_boundary: getFeedbackEventStoreReviewControlsAuthorityBoundary(),
    validation: { passed: true, failure_codes: [] },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
  preview.validation = validateFeedbackEventStoreReviewControlsPreview(preview);
  preview.preview_fingerprint =
    createFeedbackEventStoreReviewControlsPreviewFingerprint(preview);
  return preview;
}

export function validateFeedbackEventStoreReviewControlsPreview(
  preview: FeedbackEventStoreReviewControlsPreview,
): FeedbackEventStoreReviewControlsValidationResult {
  const failureCodes: string[] = [];
  if (preview.preview_version !== previewVersion) {
    failureCodes.push("preview_version_invalid");
  }
  if (!Array.isArray(preview.controls) || preview.controls.length === 0) {
    failureCodes.push("controls_missing");
  }
  if (!Array.isArray(preview.event_previews) || preview.event_previews.length === 0) {
    failureCodes.push("event_previews_missing");
  }
  const controlKinds = new Set(preview.controls.map((control) => control.control_kind));
  for (const controlKind of requiredControlKinds) {
    if (!controlKinds.has(controlKind)) {
      failureCodes.push(`control_kind_missing:${controlKind}`);
    }
  }
  for (const control of preview.controls) {
    if (control.enabled_now !== false) {
      failureCodes.push(`control_enabled_now:${control.control_id}`);
    }
    if (control.preview_only !== true) {
      failureCodes.push(`control_not_preview_only:${control.control_id}`);
    }
    if (
      control.writes_now !== false ||
      control.route_available_now !== false ||
      control.server_action_available_now !== false ||
      control.db_write_available_now !== false ||
      control.durable_feedback_persisted_now !== false
    ) {
      failureCodes.push(`control_write_or_route_enabled:${control.control_id}`);
    }
    if (!sourceRefsArePresentOrExplained(control.target)) {
      failureCodes.push(`control_source_refs_missing:${control.control_id}`);
    }
  }
  for (const eventPreview of preview.event_previews) {
    if (eventPreview.inserted_now !== false) {
      failureCodes.push(`event_preview_inserted_now:${eventPreview.event_preview_id}`);
    }
    if (eventPreview.persisted_now !== false) {
      failureCodes.push(`event_preview_persisted_now:${eventPreview.event_preview_id}`);
    }
    if (eventPreview.db_write_now !== false) {
      failureCodes.push(`event_preview_db_write_now:${eventPreview.event_preview_id}`);
    }
    if (eventPreview.valid_feedback_event_shape_now !== true) {
      failureCodes.push(`event_preview_invalid_shape:${eventPreview.event_preview_id}`);
    }
    if (
      eventPreview.event_type === "correct_preview" &&
      !nonEmptyString(eventPreview.correction_text_placeholder)
    ) {
      failureCodes.push("correct_preview_missing_correction_text_placeholder");
    }
    if (
      eventPreview.source_ref_ids.length === 0 &&
      !nonEmptyString(eventPreview.reason_placeholder)
    ) {
      failureCodes.push(`event_preview_source_refs_missing:${eventPreview.event_preview_id}`);
    }
  }
  if (!authorityBoundaryIsSafe(preview.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (preview.authority_boundary.product_write_lane_parked_by_686 !== true) {
    failureCodes.push("product_write_lane_not_parked_by_686");
  }
  if (preview.recommendation_status !== recommendationStatus) {
    failureCodes.push("recommendation_status_invalid");
  }
  if (preview.next_recommended_slice !== nextRecommendedSlice) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createFeedbackEventStoreReviewControlsPreviewFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildControl(
  event: FeedbackEventStoreEvent,
  eventPreview: FeedbackEventStoreReviewControlEventPreview | undefined,
): FeedbackEventStoreReviewControl {
  const eventPreviewId =
    eventPreview?.event_preview_id ?? createEventPreviewId(event);
  return {
    control_id: `feedback_review_control:${event.event_type}:${fnv1a32(
      canonicalJson({ target_kind: event.target_kind, target_id: event.target_id }),
    )}`,
    control_kind: event.event_type,
    label: labelForControlKind(event.event_type),
    target: buildTarget(event),
    enabled_now: false,
    preview_only: true,
    would_create_event_type: event.event_type,
    would_create_event_preview_id: eventPreviewId,
    requires_operator_action: true,
    writes_now: false,
    route_available_now: false,
    server_action_available_now: false,
    db_write_available_now: false,
    durable_feedback_persisted_now: false,
    authority_boundary_notes: [
      "Review control preview only; no route, server action, DB write, durable feedback persistence, execution, or product-write authority exists now.",
    ],
  };
}

function buildTarget(event: FeedbackEventStoreEvent): FeedbackEventStoreReviewControlTarget {
  return {
    target_kind: event.target_kind,
    target_id: event.target_id,
    ...(event.target_fingerprint
      ? { target_fingerprint: event.target_fingerprint }
      : {}),
    source_ref_ids: [...event.source_ref_ids],
    source_ref_resolution_status: sourceRefResolutionStatus(event),
    source_ref_resolution_notes: sourceRefResolutionNotes(event),
  };
}

function buildEventPreview(
  event: FeedbackEventStoreEvent,
): FeedbackEventStoreReviewControlEventPreview {
  return {
    event_preview_id: createEventPreviewId(event),
    event_type: event.event_type,
    target_kind: event.target_kind,
    target_id: event.target_id,
    ...(event.target_fingerprint
      ? { target_fingerprint: event.target_fingerprint }
      : {}),
    source_ref_ids: [...event.source_ref_ids],
    operator_note_placeholder: "Future operator note required before any durable feedback event write.",
    ...(event.event_type === "correct_preview"
      ? {
          correction_text_placeholder:
            "Future correction text required before a correct_preview write.",
        }
      : {}),
    reason_placeholder:
      event.reason || "Future operator-selected reason required before any durable write.",
    idempotency_key_preview: event.idempotency_key,
    event_id_preview: event.event_id,
    valid_feedback_event_shape_now: true,
    inserted_now: false,
    persisted_now: false,
    db_write_now: false,
  };
}

function buildSourceSurfaces(
  input: FeedbackEventStoreReviewControlsPreviewInput,
  sourceFeedbackFixturePath: string,
): Record<string, unknown> {
  const substratePreview = input.agentPerspectiveSubstratePreview;
  const handoffReview = input.candidateToCodexHandoffDraftReview;
  const operatorDecision = input.candidateToCodexHandoffOperatorDecisionPreview;
  return {
    feedback_event_store_minimal: {
      fixture_path: sourceFeedbackFixturePath,
      fixture_version: input.sourceFeedbackEventStoreFixture.fixture_version,
      event_count: input.sourceFeedbackEventStoreFixture.events?.length ?? 0,
      product_write_stopline_ref:
        input.sourceFeedbackEventStoreFixture.product_write_stopline_ref ?? null,
      next_recommended_slice:
        input.sourceFeedbackEventStoreFixture.next_recommended_slice ?? null,
    },
    agent_perspective_substrate_preview: {
      fixture_path: "fixtures/agent-perspective-substrate-preview.sample.v0.1.json",
      preview_version: stringFromRecord(substratePreview, "preview_version"),
      fingerprint: stringFromRecord(substratePreview, "fingerprint"),
      folded_section_count: arrayLengthFromRecord(substratePreview, "folded_sections"),
      surfacing_card_count: arrayLengthFromRecord(substratePreview, "surfacing_cards"),
      source_coverage_ref:
        "fixtures/agent-perspective-substrate-preview.sample.v0.1.json#source_coverage",
    },
    candidate_to_codex_handoff_draft_review: {
      fixture_path:
        "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json",
      review_kind: stringFromRecord(handoffReview, "review_kind"),
      review_version: stringFromRecord(handoffReview, "review_version"),
      review_fingerprint: stringFromRecord(handoffReview, "review_fingerprint"),
      review_status: stringFromRecord(handoffReview, "review_status"),
    },
    candidate_to_codex_handoff_operator_decision_preview: {
      fixture_path:
        "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json",
      decision_preview_kind: stringFromRecord(operatorDecision, "decision_preview_kind"),
      decision_preview_version: stringFromRecord(operatorDecision, "decision_preview_version"),
      decision_preview_fingerprint: stringFromRecord(
        operatorDecision,
        "decision_preview_fingerprint",
      ),
      operator_decision_required:
        booleanFromRecord(operatorDecision, "operator_decision_required"),
      operator_decision_satisfied_now:
        booleanFromRecord(operatorDecision, "operator_decision_satisfied_now"),
    },
  };
}

export function getFeedbackEventStoreReviewControlsAuthorityBoundary(): FeedbackEventStoreReviewControlsAuthorityBoundary {
  return {
    preview_only: true,
    durable_feedback_event_written_now: false,
    route_available_now: false,
    server_action_available_now: false,
    db_write_available_now: false,
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

function sourceRefResolutionStatus(
  event: FeedbackEventStoreEvent,
): FeedbackEventStoreReviewControlTarget["source_ref_resolution_status"] {
  if (event.source_ref_ids.length === 0) return "explicit_empty_source_reason";
  if (event.source_ref_ids.every((sourceRefId) => sourceRefId.startsWith("pr:"))) {
    return "external_lineage_allowed";
  }
  return "resolved_repo_local";
}

function sourceRefResolutionNotes(event: FeedbackEventStoreEvent): string[] {
  if (event.source_ref_ids.length === 0) {
    return [
      `No repo-local source refs are attached; explicit reason placeholder is required: ${event.reason ?? "missing"}.`,
    ];
  }
  return event.source_ref_ids.map((sourceRefId) =>
    sourceRefId.startsWith("pr:")
      ? `External lineage token is allowlisted for preview only: ${sourceRefId}.`
      : `Repo-local source ref is expected to resolve in smoke validation: ${sourceRefId}.`,
  );
}

function sourceRefsArePresentOrExplained(
  target: FeedbackEventStoreReviewControlTarget,
): boolean {
  if (target.source_ref_ids.length > 0) return true;
  return target.source_ref_resolution_status === "explicit_empty_source_reason";
}

function authorityBoundaryIsSafe(
  boundary: FeedbackEventStoreReviewControlsAuthorityBoundary,
): boolean {
  if (!boundary || typeof boundary !== "object") return false;
  if (boundary.preview_only !== true) return false;
  if (boundary.product_write_lane_parked_by_686 !== true) return false;
  for (const key of [
    "durable_feedback_event_written_now",
    "route_available_now",
    "server_action_available_now",
    "db_write_available_now",
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

function orderEvents(events: FeedbackEventStoreEvent[]): FeedbackEventStoreEvent[] {
  return requiredControlKinds
    .map((eventType) => events.find((event) => event.event_type === eventType))
    .filter((event): event is FeedbackEventStoreEvent => Boolean(event));
}

function createEventPreviewId(event: FeedbackEventStoreEvent): string {
  return `feedback_event_review_control_preview:fnv1a32:${fnv1a32(
    canonicalJson({
      event_type: event.event_type,
      target_kind: event.target_kind,
      target_id: event.target_id,
      idempotency_key: event.idempotency_key,
    }),
  )}`;
}

function labelForControlKind(eventType: FeedbackEventStoreEvent["event_type"]): string {
  switch (eventType) {
    case "dismiss_preview":
      return "Dismiss preview";
    case "pin_preview":
      return "Pin preview";
    case "correct_preview":
      return "Correct preview";
    case "invalidate_preview":
      return "Invalidate preview";
  }
}

function stringFromRecord(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object") return null;
  const nestedValue = (value as JsonRecord)[key];
  return typeof nestedValue === "string" ? nestedValue : null;
}

function booleanFromRecord(value: unknown, key: string): boolean | null {
  if (!value || typeof value !== "object") return null;
  const nestedValue = (value as JsonRecord)[key];
  return typeof nestedValue === "boolean" ? nestedValue : null;
}

function arrayLengthFromRecord(value: unknown, key: string): number {
  if (!value || typeof value !== "object") return 0;
  const nestedValue = (value as JsonRecord)[key];
  return Array.isArray(nestedValue) ? nestedValue.length : 0;
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
      .filter(([key]) => key !== "preview_fingerprint")
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
