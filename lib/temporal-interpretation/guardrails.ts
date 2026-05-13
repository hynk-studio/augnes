import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
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

  const admissionWarnings = validateActiveContextAdmissionSection({
    context,
    preview,
  });
  warnings.push(...admissionWarnings);

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

  if (axisPressuresContainScoringPattern(preview)) {
    warnings.push(
      "axis_pressures must be qualitative labels only and must not include numeric scoring patterns.",
    );
  }

  if (claimsFullP4Readiness(preview)) {
    warnings.push(
      "Preview must not claim full P4 implementation readiness by default.",
    );
  }

  if (impliesApprovalPublishOrReadinessAuthority(preview)) {
    warnings.push(
      "current_interpretation and safe_next_step must not imply approval, publish, ready-to-ship, P4-ready, or fully verified authority without bounded evidence.",
    );
  }

  if (omitsKnownResidualTensionByClaimingNone({ context, preview })) {
    warnings.push(
      "Preview must not claim there are no residual tensions while context still contains residual_tensions.",
    );
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
}

function validateActiveContextAdmissionSection({
  context,
  preview,
}: {
  context: TemporalPreviewContext;
  preview: TemporalInterpretationPreview;
}) {
  const warnings: string[] = [];
  const section = preview.active_context_admission;

  if (!section) {
    warnings.push("active_context_admission decisions are required for v0.2 review hardening.");
    return warnings;
  }

  if (!section.note.trim()) {
    warnings.push("active_context_admission.note is required.");
  }

  const knownCategories = new Set(ACTIVE_CONTEXT_ADMISSION_CATEGORIES);
  const summaryOnlyRefs = new Set([
    ...context.source_authority_profile.summary_only_refs,
    ...preview.summary_refs.map((ref) => ref.ref),
  ]);

  const preservedCounterexampleRefs = new Set(
    section.decisions.flatMap((decision) => decision.counterexample_refs),
  );
  const missingAdmissionCounterexamples = context.counterexamples.filter(
    (counterexample) => !preservedCounterexampleRefs.has(counterexample.ref),
  );
  if (missingAdmissionCounterexamples.length > 0) {
    warnings.push(
      `active_context_admission omitted counterexample_refs: ${missingAdmissionCounterexamples
        .map((item) => item.ref)
        .join(", ")}`,
    );
  }

  for (const decision of section.decisions) {
    if (!knownCategories.has(decision.category)) {
      warnings.push(
        `active_context_admission category is unknown: ${decision.category}`,
      );
    }

    if (
      decision.category.startsWith("admit_") &&
      decision.source_authority.trim().length === 0
    ) {
      warnings.push(
        `admitted active context is missing source_authority: ${decision.candidate_id}`,
      );
    }

    if (
      decision.category === "admit_primary_active" &&
      (decision.source_authority === "summary_only" ||
        summaryOnlyRefs.has(decision.candidate_id))
    ) {
      warnings.push(
        `summary-only candidate cannot be admitted as primary evidence: ${decision.candidate_id}`,
      );
    }

    if (
      decision.category.startsWith("admit_") &&
      ["stale_readiness", "pending_evidence", "summary_only"].includes(
        decision.source_authority,
      )
    ) {
      warnings.push(
        `non-authoritative or stale candidate cannot be admitted as active authority: ${decision.candidate_id}`,
      );
    }
  }

  return warnings;
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

function impliesApprovalPublishOrReadinessAuthority(
  preview: TemporalInterpretationPreview,
) {
  const statements = [
    preview.current_interpretation,
    preview.safe_next_step,
  ].map((statement) => statement.toLowerCase());

  return statements.some((statement) => {
    const negatedBoundary =
      statement.includes("does not approve") ||
      statement.includes("does not publish") ||
      statement.includes("not ready to ship") ||
      statement.includes("not p4 ready") ||
      statement.includes("not fully verified") ||
      statement.includes("must not approve") ||
      statement.includes("must not publish");

    if (negatedBoundary) return false;

    return (
      /\bapprove\b/.test(statement) ||
      /\bpublish\b/.test(statement) ||
      statement.includes("ready to ship") ||
      statement.includes("p4 ready") ||
      statement.includes("fully verified") ||
      statement.includes("production ready") ||
      statement.includes("approved for implementation")
    );
  });
}

function omitsKnownResidualTensionByClaimingNone({
  context,
  preview,
}: {
  context: TemporalPreviewContext;
  preview: TemporalInterpretationPreview;
}) {
  if (context.residual_tensions.length === 0) return false;

  const text = [
    preview.current_interpretation,
    preview.revision_explanation,
    preview.safe_next_step,
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("no residual tension") ||
    text.includes("no residual tensions") ||
    text.includes("no active tension") ||
    text.includes("no active tensions") ||
    text.includes("tension-free")
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

function axisPressuresContainScoringPattern(
  preview: TemporalInterpretationPreview,
) {
  return preview.axis_pressures.some((pressure) =>
    axisPressureReasonContainsScoringPattern(pressure.reason),
  );
}

function axisPressureReasonContainsScoringPattern(reason: string) {
  const text = reason.toLowerCase();

  return (
    /\b(?:score|confidence|weight|numeric_rating|rating)\s*[:=]?\s*\d+(?:\.\d+)?\b/.test(
      text,
    ) ||
    /\b\d+(?:\.\d+)?\s*%/.test(text) ||
    /\b\d+\s*\/\s*\d+\b/.test(text)
  );
}
