import {
  TEMPORAL_INTERPRETATION_AXES,
  TRANSITION_RELATIONS,
  type TemporalInterpretationPreview,
  type TemporalPreviewContext,
  type TemporalPreviewGuardrailResult,
} from "@/lib/temporal-interpretation/types";

export function validateTemporalPreviewGuardrails({
  context,
  preview,
}: {
  context: TemporalPreviewContext;
  preview: TemporalInterpretationPreview;
}): TemporalPreviewGuardrailResult {
  const warnings = [...preview.warnings];

  if (!preview.non_authority_boundary.trim()) {
    warnings.push("non_authority_boundary is required.");
  }

  if (preview.active_context_admission_rationale.length === 0) {
    warnings.push("active_context_admission_rationale is required.");
  }

  const summaryOnlyRefs = new Set([
    ...context.source_authority_profile.summary_only_refs,
    ...preview.summary_refs.map((ref) => ref.ref),
  ]);
  const summaryOnlyEvidence = preview.evidence_anchors.filter(
    (anchor) =>
      summaryOnlyRefs.has(anchor.ref) || anchor.ref.startsWith("summary:"),
  );
  if (summaryOnlyEvidence.length > 0) {
    warnings.push(
      `summary-only support cannot be used as evidence anchors: ${summaryOnlyEvidence
        .map((anchor) => anchor.ref)
        .join(", ")}`,
    );
  }

  const allowedNow = new Set(preview.source_authority_profile.allowed_now);
  const blockedAllowed = preview.source_authority_profile.blocked_now.filter(
    (action) => allowedNow.has(action),
  );
  if (blockedAllowed.length > 0) {
    warnings.push(
      `blocked_now actions cannot be listed as allowed_now: ${blockedAllowed.join(
        ", ",
      )}`,
    );
  }

  if (treatsPreferenceAsFact(preview)) {
    warnings.push(
      "User preference must not be treated as factual readiness or implementation approval.",
    );
  }

  const missingCounterexamples = context.counterexamples.filter(
    (expected) =>
      !preview.counterexamples.some((actual) => actual.ref === expected.ref),
  );
  if (missingCounterexamples.length > 0) {
    warnings.push(
      `counterexamples from context were not preserved: ${missingCounterexamples
        .map((item) => item.ref)
        .join(", ")}`,
    );
  }

  const missingTensions = context.residual_tensions.filter(
    (expected) =>
      !preview.residual_tensions.some((actual) => actual.ref === expected.ref),
  );
  if (missingTensions.length > 0) {
    warnings.push(
      `residual tensions from context were not preserved: ${missingTensions
        .map((item) => item.ref)
        .join(", ")}`,
    );
  }

  if (!TRANSITION_RELATIONS.includes(preview.transition_relation)) {
    warnings.push(
      `transition_relation must be one of: ${TRANSITION_RELATIONS.join(", ")}`,
    );
  }

  const invalidDriverAxes = preview.interpretive_drivers
    .map((driver) => driver.axis)
    .filter((axis) => !TEMPORAL_INTERPRETATION_AXES.includes(axis));
  if (invalidDriverAxes.length > 0) {
    warnings.push(
      `interpretive_drivers axes must use the fixed Axis Bank: ${[
        ...new Set(invalidDriverAxes),
      ].join(", ")}`,
    );
  }

  if (treatsSuppressedAlternativesAsFalse(preview)) {
    warnings.push(
      "suppressed_alternatives must be treated as deferred paths, not false claims or permanent rejections.",
    );
  }

  if (axisPressuresContainNumbers(preview)) {
    warnings.push(
      "axis_pressures must be qualitative labels only and must not include numeric values.",
    );
  }

  if (claimsFullP4Readiness(preview)) {
    warnings.push(
      "Preview must not claim full P4 implementation readiness by default.",
    );
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
}

function treatsPreferenceAsFact(preview: TemporalInterpretationPreview) {
  const text = [
    preview.current_interpretation,
    preview.revision_explanation,
    preview.user_context_vs_factuality,
    preview.safe_next_step,
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("user preference proves") ||
    text.includes("preference proves") ||
    text.includes("preference confirms factual readiness") ||
    text.includes("preference grants implementation approval") ||
    text.includes("preference approves implementation")
  );
}

function claimsFullP4Readiness(preview: TemporalInterpretationPreview) {
  const statements = [
    preview.current_interpretation,
    preview.revision_explanation,
    preview.safe_next_step,
    preview.non_authority_boundary,
  ].map((statement) => statement.toLowerCase());

  return statements.some(
    (statement) =>
      statement.includes("full p4") &&
      !statement.includes("does not claim full p4") &&
      !statement.includes("must not claim full p4") &&
      !statement.includes("not claim full p4") &&
      (statement.includes("ready") ||
        statement.includes("implemented") ||
        statement.includes("complete")),
  );
}

function treatsSuppressedAlternativesAsFalse(
  preview: TemporalInterpretationPreview,
) {
  return preview.suppressed_alternatives.some((alternative) => {
    const text = [
      alternative.alternative,
      alternative.why_deferred,
      alternative.what_would_change_status,
      alternative.status,
    ]
      .join(" ")
      .toLowerCase();

    return (
      text.includes("is false") ||
      text.includes("are false") ||
      text.includes("false claim") ||
      text.includes("permanently rejected") ||
      text.includes("permanent rejection")
    );
  });
}

function axisPressuresContainNumbers(preview: TemporalInterpretationPreview) {
  return preview.axis_pressures.some((pressure) =>
    [pressure.axis, pressure.pressure, pressure.reason].some((value) =>
      /\d/.test(value),
    ),
  );
}
