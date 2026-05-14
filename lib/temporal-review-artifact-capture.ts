import { createHash } from "node:crypto";
import {
  insertTemporalPreviewReviewArtifactForSmoke,
  TEMPORAL_INTERPRETATION_WORK_ID,
  TemporalPreviewReviewArtifactValidationError,
  type TemporalPreviewReviewArtifact,
  type TemporalPreviewReviewArtifactInput,
} from "@/lib/temporal-review-artifacts";
import type {
  ActiveContextAdmission,
  TemporalInterpretationPreview,
  TemporalPreviewCounterexample,
  TemporalPreviewEvidenceAnchor,
  TemporalPreviewGuardrailResult,
  TemporalPreviewSummaryRef,
  TemporalPreviewTension,
} from "@/lib/temporal-interpretation/types";

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_SOURCE_ROUTE = "/api/temporal-interpretation/preview";
const FORBIDDEN_CAPTURE_FIELD_NAMES = [
  "approval_status",
  "publish_status",
  "replay_status",
  "commit_status",
  "memory_admission_status",
  "durable_perspective_snapshot_id",
  "raw_openai_response",
  "secret_material",
  "cockpit_dom_as_truth",
  "safe_next_step_instruction",
  "user_preference_as_readiness",
  "summary_only_ref_as_evidence",
] as const;

export type TemporalReviewArtifactCaptureMetadata = {
  artifact_id?: string | null;
  scope?: string | null;
  work_id?: string | null;
  source_route?: string | null;
  source_surface: string;
  source_ref?: string | null;
  generator?: string | null;
  model?: string | null;
  as_of?: string | null;
  capture_mode?: string | null;
  preview_hash?: string | null;
  reviewer_verdict: string;
  reviewer_notes?: string | null;
  manual_review_report_path?: string | null;
  linked_evidence_record_ids?: unknown[] | string | null;
  linked_session_id?: string | null;
  linked_pr_url?: string | null;
  redaction_status?: string | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TemporalReviewArtifactRouteCaptureMetadata = Omit<
  TemporalReviewArtifactCaptureMetadata,
  "source_route" | "capture_mode"
> & {
  source_route?: string | null;
  capture_mode?: string | null;
};

type NormalizedPreviewCapture = {
  scope: string | null;
  as_of: string | null;
  generator: string | null;
  model: string | null;
  preview: TemporalInterpretationPreview;
  guardrails: TemporalPreviewGuardrailResult;
};

export function buildTemporalPreviewReviewArtifactInputFromPreview(
  previewResponseOrPayload: unknown,
  metadata: TemporalReviewArtifactCaptureMetadata,
): TemporalPreviewReviewArtifactInput {
  rejectForbiddenCaptureFieldsDeep(previewResponseOrPayload, "preview_response");
  rejectForbiddenCaptureFieldsDeep(metadata, "metadata");

  const capture = normalizePreviewCapture(previewResponseOrPayload);
  const boundedPreview = buildBoundedPreviewJson(capture);
  const evidenceAnchorRefs = capture.preview.evidence_anchors.map((anchor) =>
    requireRef(anchor.ref, "preview.evidence_anchors.ref"),
  );
  const summaryRefs = capture.preview.summary_refs.map((summary) =>
    requireRef(summary.ref, "preview.summary_refs.ref"),
  );
  const counterexampleRefs = capture.preview.counterexamples.map((counterexample) =>
    requireRef(counterexample.ref, "preview.counterexamples.ref"),
  );
  const residualTensionRefs = capture.preview.residual_tensions.map((tension) =>
    requireRef(tension.ref, "preview.residual_tensions.ref"),
  );
  const sourceRefs = uniqueStrings([
    ...evidenceAnchorRefs,
    ...summaryRefs,
    ...counterexampleRefs,
    ...residualTensionRefs,
  ]);
  const previewHash =
    cleanNullableString(metadata.preview_hash) ?? computeBoundedPreviewHash(boundedPreview);

  return {
    artifact_id: metadata.artifact_id,
    scope: metadata.scope ?? capture.scope ?? DEFAULT_SCOPE,
    work_id: metadata.work_id ?? TEMPORAL_INTERPRETATION_WORK_ID,
    source_route: metadata.source_route ?? DEFAULT_SOURCE_ROUTE,
    source_surface: metadata.source_surface,
    source_ref: metadata.source_ref,
    generator:
      cleanNullableString(metadata.generator) ??
      capture.generator ??
      inferGeneratorFromCaptureMode(metadata.capture_mode),
    model: metadata.model ?? capture.model,
    as_of: metadata.as_of ?? capture.as_of ?? new Date().toISOString(),
    capture_mode: metadata.capture_mode ?? "route_capture",
    preview_excerpt: buildPreviewExcerpt(capture.preview.current_interpretation),
    bounded_preview_json: boundedPreview,
    preview_hash: previewHash,
    source_refs: sourceRefs,
    evidence_anchor_refs: evidenceAnchorRefs,
    summary_refs: summaryRefs,
    counterexample_refs: counterexampleRefs,
    residual_tension_refs: residualTensionRefs,
    admission_decisions_json: capture.preview.active_context_admission?.decisions ?? [],
    guardrail_passed: capture.guardrails.passed,
    guardrail_warnings_json: capture.guardrails.warnings,
    reviewer_verdict: metadata.reviewer_verdict,
    reviewer_notes: metadata.reviewer_notes,
    manual_review_report_path: metadata.manual_review_report_path,
    linked_evidence_record_ids: metadata.linked_evidence_record_ids,
    linked_session_id: metadata.linked_session_id,
    linked_pr_url: metadata.linked_pr_url,
    redaction_status: metadata.redaction_status ?? "bounded",
    created_by: metadata.created_by,
    created_at: metadata.created_at,
    updated_at: metadata.updated_at,
  };
}

export function buildTemporalPreviewReviewArtifactInputFromRouteCapture(
  previewResponseOrPayload: unknown,
  metadata: TemporalReviewArtifactRouteCaptureMetadata,
): TemporalPreviewReviewArtifactInput {
  return buildTemporalPreviewReviewArtifactInputFromPreview(previewResponseOrPayload, {
    ...metadata,
    source_route: metadata.source_route ?? DEFAULT_SOURCE_ROUTE,
    capture_mode: metadata.capture_mode ?? "route_capture",
  });
}

export function captureTemporalPreviewReviewArtifactForSmoke(
  previewResponseOrPayload: unknown,
  metadata: TemporalReviewArtifactCaptureMetadata,
): TemporalPreviewReviewArtifact {
  return insertTemporalPreviewReviewArtifactForSmoke(
    buildTemporalPreviewReviewArtifactInputFromPreview(
      previewResponseOrPayload,
      metadata,
    ),
  );
}

function normalizePreviewCapture(value: unknown): NormalizedPreviewCapture {
  const record = requireRecord(value, "preview_response");
  const previewValue = isRecord(record.preview) ? record.preview : record;
  const preview = requirePreviewPayload(previewValue);
  const guardrails = normalizeGuardrails(record.guardrails, preview);

  return {
    scope: cleanNullableString(record.scope),
    as_of: cleanNullableString(record.as_of),
    generator: cleanNullableString(record.generator),
    model: cleanNullableString(record.model),
    preview,
    guardrails,
  };
}

function requirePreviewPayload(value: unknown): TemporalInterpretationPreview {
  const preview = requireRecord(value, "preview");
  return {
    current_interpretation: requireString(
      preview.current_interpretation,
      "preview.current_interpretation",
    ),
    active_prior_context: requireString(
      preview.active_prior_context,
      "preview.active_prior_context",
    ),
    evidence_anchors: requireArray(
      preview.evidence_anchors,
      "preview.evidence_anchors",
    ) as TemporalPreviewEvidenceAnchor[],
    summary_refs: requireArray(
      preview.summary_refs,
      "preview.summary_refs",
    ) as TemporalPreviewSummaryRef[],
    source_authority_profile: requireRecord(
      preview.source_authority_profile,
      "preview.source_authority_profile",
    ) as TemporalInterpretationPreview["source_authority_profile"],
    counterexamples: requireArray(
      preview.counterexamples,
      "preview.counterexamples",
    ) as TemporalPreviewCounterexample[],
    residual_tensions: requireArray(
      preview.residual_tensions,
      "preview.residual_tensions",
    ) as TemporalPreviewTension[],
    transition_relation: requireString(
      preview.transition_relation,
      "preview.transition_relation",
    ) as TemporalInterpretationPreview["transition_relation"],
    revision_explanation: requireString(
      preview.revision_explanation,
      "preview.revision_explanation",
    ),
    user_context_vs_factuality: requireString(
      preview.user_context_vs_factuality,
      "preview.user_context_vs_factuality",
    ),
    active_context_admission_rationale: requireArray(
      preview.active_context_admission_rationale,
      "preview.active_context_admission_rationale",
    ) as TemporalInterpretationPreview["active_context_admission_rationale"],
    active_context_admission: isRecord(preview.active_context_admission)
      ? (preview.active_context_admission as ActiveContextAdmission)
      : undefined,
    suppressed_alternatives: requireArray(
      preview.suppressed_alternatives,
      "preview.suppressed_alternatives",
    ) as TemporalInterpretationPreview["suppressed_alternatives"],
    temporal_hierarchy_view: requireRecord(
      preview.temporal_hierarchy_view,
      "preview.temporal_hierarchy_view",
    ) as TemporalInterpretationPreview["temporal_hierarchy_view"],
    memory_lifecycle_view: requireRecord(
      preview.memory_lifecycle_view,
      "preview.memory_lifecycle_view",
    ) as TemporalInterpretationPreview["memory_lifecycle_view"],
    interpretive_drivers: requireArray(
      preview.interpretive_drivers,
      "preview.interpretive_drivers",
    ) as TemporalInterpretationPreview["interpretive_drivers"],
    axis_pressures: requireArray(
      preview.axis_pressures,
      "preview.axis_pressures",
    ) as TemporalInterpretationPreview["axis_pressures"],
    safe_next_step: requireString(preview.safe_next_step, "preview.safe_next_step"),
    non_authority_boundary: requireString(
      preview.non_authority_boundary,
      "preview.non_authority_boundary",
    ),
    warnings: normalizeStringArray(preview.warnings, "preview.warnings"),
  };
}

function normalizeGuardrails(
  value: unknown,
  preview: TemporalInterpretationPreview,
): TemporalPreviewGuardrailResult {
  if (!value) {
    return {
      passed: preview.warnings.length === 0,
      warnings: preview.warnings,
    };
  }

  const guardrails = requireRecord(value, "guardrails");
  if (typeof guardrails.passed !== "boolean") {
    throw new TemporalPreviewReviewArtifactValidationError(
      "guardrails.passed must be boolean.",
    );
  }

  return {
    passed: guardrails.passed,
    warnings: normalizeStringArray(guardrails.warnings, "guardrails.warnings"),
  };
}

function buildBoundedPreviewJson(capture: NormalizedPreviewCapture) {
  return {
    current_interpretation: capture.preview.current_interpretation,
    transition_relation: capture.preview.transition_relation,
    safe_next_step: capture.preview.safe_next_step,
    non_authority_boundary: capture.preview.non_authority_boundary,
    evidence_anchors: capture.preview.evidence_anchors,
    summary_refs: capture.preview.summary_refs,
    counterexamples: capture.preview.counterexamples,
    residual_tensions: capture.preview.residual_tensions,
    active_context_admission: capture.preview.active_context_admission,
    guardrails: capture.guardrails,
  };
}

function buildPreviewExcerpt(currentInterpretation: string) {
  return currentInterpretation.length > 280
    ? `${currentInterpretation.slice(0, 277)}...`
    : currentInterpretation;
}

function computeBoundedPreviewHash(value: unknown) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")}`;
}

function inferGeneratorFromCaptureMode(captureMode?: string | null) {
  const mode = cleanNullableString(captureMode);
  if (mode === "mock" || mode === "openai" || mode === "mock_fallback") {
    return mode;
  }

  return "mock";
}

function rejectForbiddenCaptureFieldsDeep(value: unknown, path: string) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectForbiddenCaptureFieldsDeep(item, `${path}[${index}]`),
    );
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      FORBIDDEN_CAPTURE_FIELD_NAMES.includes(
        key as (typeof FORBIDDEN_CAPTURE_FIELD_NAMES)[number],
      )
    ) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `${key} is forbidden on TemporalPreviewReviewArtifact capture input.`,
      );
    }
    rejectForbiddenCaptureFieldsDeep(nestedValue, `${path}.${key}`);
  }
}

function requireRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be an object.`,
    );
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be an array.`,
    );
  }

  return value;
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  return requireArray(value ?? [], fieldName).map((item) =>
    requireString(item, fieldName),
  );
}

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be a non-empty string.`,
    );
  }

  return value.trim();
}

function requireRef(value: unknown, fieldName: string): string {
  return requireString(value, fieldName);
}

function cleanNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new TemporalPreviewReviewArtifactValidationError(
      "Expected a string value.",
    );
  }

  return value.trim() || null;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}
