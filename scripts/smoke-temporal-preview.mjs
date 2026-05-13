const baseUrl = process.env.AUGNES_API_BASE_URL ?? "http://localhost:3000";
const response = await fetch(`${baseUrl}/api/temporal-interpretation/preview`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ scope: "project:augnes" }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Temporal preview smoke failed: ${response.status} ${body}`);
}

const payload = await response.json();
const preview = payload.preview;
const requiredFields = [
  "current_interpretation",
  "active_prior_context",
  "evidence_anchors",
  "summary_refs",
  "source_authority_profile",
  "counterexamples",
  "residual_tensions",
  "transition_relation",
  "revision_explanation",
  "user_context_vs_factuality",
  "active_context_admission_rationale",
  "active_context_admission",
  "suppressed_alternatives",
  "temporal_hierarchy_view",
  "memory_lifecycle_view",
  "interpretive_drivers",
  "axis_pressures",
  "safe_next_step",
  "non_authority_boundary",
  "warnings",
];

for (const field of requiredFields) {
  if (!(field in preview)) {
    throw new Error(`Temporal preview missing field: ${field}`);
  }
}

if (!preview.active_context_admission || !Array.isArray(preview.active_context_admission.decisions)) {
  throw new Error("Temporal preview active_context_admission decisions are missing.");
}

const allowedAdmissionCategories = new Set([
  "admit_primary_active",
  "admit_boundary_active",
  "admit_tension_active",
  "retain_recallable",
  "exclude_duplicate",
  "exclude_summary_only",
  "exclude_out_of_scope",
  "suspend_pending_evidence",
]);
for (const decision of preview.active_context_admission.decisions) {
  if (!allowedAdmissionCategories.has(decision.category)) {
    throw new Error(`Temporal preview active_context_admission has invalid category: ${decision.category}`);
  }
  for (const field of [
    "candidate_id",
    "category",
    "reason",
    "source_authority",
  ]) {
    if (!decision[field]) {
      throw new Error(`Temporal preview active_context_admission decision missing field: ${field}`);
    }
  }
  for (const field of [
    "evidence_refs",
    "counterexample_refs",
    "residual_tension_refs",
  ]) {
    if (!Array.isArray(decision[field])) {
      throw new Error(`Temporal preview active_context_admission decision ${field} must be an array.`);
    }
  }
}

if (!payload.guardrails || typeof payload.guardrails.passed !== "boolean") {
  throw new Error("Temporal preview missing guardrail result.");
}

if (!preview.non_authority_boundary.includes("non-authoritative")) {
  throw new Error("Temporal preview non-authority boundary is not explicit.");
}

if (
  preview.source_authority_profile.blocked_now.some((action) =>
    preview.source_authority_profile.allowed_now.includes(action),
  )
) {
  throw new Error("Temporal preview allowed_now includes a blocked_now action.");
}

if (!Array.isArray(preview.active_context_admission_rationale)) {
  throw new Error("Temporal preview active_context_admission_rationale must be an array.");
}

if (preview.active_context_admission_rationale.length === 0) {
  throw new Error("Temporal preview active_context_admission_rationale is empty.");
}

const requiredAdmissionFields = [
  "context_ref",
  "admission_role",
  "why_admitted",
  "why_not_merely_summary",
];
for (const item of preview.active_context_admission_rationale) {
  for (const field of requiredAdmissionFields) {
    if (!item[field]) {
      throw new Error(`Temporal preview admission rationale missing field: ${field}`);
    }
  }
}

const allowedAxes = new Set([
  "factuality",
  "continuity",
  "user_context",
  "boundary",
  "exploration",
  "implementation",
  "stability",
  "revision",
]);
for (const driver of preview.interpretive_drivers) {
  if (!allowedAxes.has(driver.axis)) {
    throw new Error(`Temporal preview interpretive driver has invalid axis: ${driver.axis}`);
  }
}

function axisPressureReasonContainsScoringPattern(reason) {
  const text = reason.toLowerCase();

  return (
    /\b(?:score|confidence|weight|numeric_rating|rating)\s*[:=]?\s*\d+(?:\.\d+)?\b/.test(
      text,
    ) ||
    /\b\d+(?:\.\d+)?\s*%/.test(text) ||
    /\b\d+\s*\/\s*\d+\b/.test(text)
  );
}

const allowedAxisPressureIdentifiers = [
  "P4 remains out of scope for this preview.",
  "v0.1 and v0.1.1 are version references, not scores.",
  "PR #100 established the baseline route.",
  "AG-001 is a work trace identifier.",
  "2026 is a calendar year.",
];
for (const reason of allowedAxisPressureIdentifiers) {
  if (axisPressureReasonContainsScoringPattern(reason)) {
    throw new Error(`Axis pressure helper rejected allowed identifier: ${reason}`);
  }
}

const scoringAxisPressureExamples = [
  "score 0.8",
  "confidence 0.9",
  "weight 3",
  "70%",
  "3/5",
  "numeric_rating: 4",
];
for (const reason of scoringAxisPressureExamples) {
  if (!axisPressureReasonContainsScoringPattern(reason)) {
    throw new Error(`Axis pressure helper allowed scoring pattern: ${reason}`);
  }
}

const allowedPressures = new Set([
  "high",
  "medium",
  "low",
  "blocked",
  "needs_review",
]);
for (const pressure of preview.axis_pressures) {
  if (!allowedAxes.has(pressure.axis)) {
    throw new Error(`Temporal preview axis pressure has invalid axis: ${pressure.axis}`);
  }
  if (!allowedPressures.has(pressure.pressure)) {
    throw new Error(
      `Temporal preview axis pressure has invalid label: ${pressure.pressure}`,
    );
  }
  if (axisPressureReasonContainsScoringPattern(pressure.reason)) {
    throw new Error(
      "Temporal preview axis_pressures includes a numeric scoring pattern.",
    );
  }
}

const suppressedAlternativeText = preview.suppressed_alternatives
  .map((item) =>
    [
      item.alternative,
      item.why_deferred,
      item.what_would_change_status,
      item.status,
    ].join(" "),
  )
  .join(" ")
  .toLowerCase();
if (
  suppressedAlternativeText.includes("is false") ||
  suppressedAlternativeText.includes("are false") ||
  suppressedAlternativeText.includes("permanently rejected")
) {
  throw new Error(
    "Temporal preview suppressed_alternatives treats alternatives as false or permanently rejected.",
  );
}

console.log(
  JSON.stringify(
    {
      generator: payload.generator,
      guardrails_passed: payload.guardrails.passed,
      warning_count: payload.guardrails.warnings.length,
      transition_relation: preview.transition_relation,
      admission_rationale_count:
        preview.active_context_admission_rationale.length,
      admission_decision_count:
        preview.active_context_admission.decisions.length,
      suppressed_alternative_count: preview.suppressed_alternatives.length,
      interpretive_driver_count: preview.interpretive_drivers.length,
      axis_pressure_count: preview.axis_pressures.length,
    },
    null,
    2,
  ),
);
