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
  "safe_next_step",
  "non_authority_boundary",
  "warnings",
];

for (const field of requiredFields) {
  if (!(field in preview)) {
    throw new Error(`Temporal preview missing field: ${field}`);
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

console.log(
  JSON.stringify(
    {
      generator: payload.generator,
      guardrails_passed: payload.guardrails.passed,
      warning_count: payload.guardrails.warnings.length,
      transition_relation: preview.transition_relation,
    },
    null,
    2,
  ),
);
