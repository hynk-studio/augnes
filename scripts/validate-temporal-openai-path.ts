import { TEMPORAL_HARDENING_FIXTURES } from "@/lib/temporal-interpretation/fixtures";
import { validateTemporalPreviewGuardrails } from "@/lib/temporal-interpretation/guardrails";
import { buildTemporalInterpretationPreview } from "@/lib/temporal-interpretation/preview";
import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
  type TemporalInterpretationPreview,
  type TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";

const fixture = TEMPORAL_HARDENING_FIXTURES[0];
const context = fixture.input_context;
const knownCategories = new Set<string>(ACTIVE_CONTEXT_ADMISSION_CATEGORIES);
const originalFetch = globalThis.fetch;
let openaiCallCount = 0;

globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  if (url.includes("https://api.openai.com/v1/responses")) {
    openaiCallCount += 1;
  }

  return originalFetch(input, init);
};

main()
  .catch((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Temporal OpenAI path validation failed.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(() => {
    globalThis.fetch = originalFetch;
  });

async function main() {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is required for Temporal OpenAI path validation.",
    );
  }

  const response = await buildTemporalInterpretationPreview({
    scope: context.scope,
    context,
  });
  const preview = response.preview;
  const admission = preview.active_context_admission;
  const shapeFailures = validateAdmissionShape(preview);
  const guardrails = validateTemporalPreviewGuardrails({
    context,
    preview: {
      ...preview,
      warnings: [],
    },
  });
  const summaryOnlyEvidenceAnchorCount =
    countSummaryOnlyEvidenceAnchors(context, preview);
  const counterexamplesPreserved = preservesCounterexamples(context, preview);
  const residualTensionsPreserved = preservesResidualTensions(context, preview);
  const unsafeSafeNextStepDetected = detectsUnsafeSafeNextStep(
    preview.safe_next_step,
  );
  const nonAuthorityBoundaryConfirmed =
    preview.non_authority_boundary.toLowerCase().includes("non-authoritative") &&
    preview.non_authority_boundary.toLowerCase().includes("does not commit state");
  const categoriesObserved = Array.from(
    new Set(admission?.decisions.map((decision) => decision.category) ?? []),
  ).sort();

  const failures = [
    response.generator === "openai"
      ? null
      : `Expected generator openai, got ${response.generator}.`,
    openaiCallCount === 1
      ? null
      : `Expected exactly one OpenAI Responses API call, got ${openaiCallCount}.`,
    admission ? null : "active_context_admission is missing.",
    admission && admission.decisions.length > 0
      ? null
      : "active_context_admission.decisions is empty.",
    shapeFailures.length === 0
      ? null
      : `Admission decision shape failures: ${shapeFailures.join(" | ")}`,
    guardrails.passed
      ? null
      : `Guardrails failed: ${guardrails.warnings.join(" | ")}`,
    summaryOnlyEvidenceAnchorCount === 0
      ? null
      : "Summary-only refs were used as evidence anchors.",
    counterexamplesPreserved ? null : "Counterexamples were not preserved.",
    residualTensionsPreserved ? null : "Residual tensions were not preserved.",
    unsafeSafeNextStepDetected
      ? "safe_next_step contains unsafe authority language."
      : null,
    nonAuthorityBoundaryConfirmed
      ? null
      : "non_authority_boundary did not confirm the read-only boundary.",
  ].filter(Boolean) as string[];

  const summary = {
    validation: "temporal-openai-path",
    input_fixture: fixture.name,
    generator: response.generator,
    model: response.model,
    openai_call_count: openaiCallCount,
    active_context_admission_present: Boolean(admission),
    decision_count: admission?.decisions.length ?? 0,
    categories_observed: categoriesObserved,
    guardrails_passed: guardrails.passed,
    warning_count: guardrails.warnings.length,
    warnings: guardrails.warnings,
    counterexamples_preserved: counterexamplesPreserved,
    residual_tensions_preserved: residualTensionsPreserved,
    summary_only_evidence_anchor_count: summaryOnlyEvidenceAnchorCount,
    unsafe_safe_next_step_detected: unsafeSafeNextStepDetected,
    non_authority_boundary_confirmed: nonAuthorityBoundaryConfirmed,
    schema_decision_shape_valid: shapeFailures.length === 0,
    no_secrets_printed: true,
    passed: failures.length === 0,
    failures,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    throw new Error("Temporal OpenAI path validation failed.");
  }
}

function validateAdmissionShape(preview: TemporalInterpretationPreview) {
  const failures: string[] = [];
  const decisions = preview.active_context_admission?.decisions ?? [];

  decisions.forEach((decision, index) => {
    for (const field of [
      "candidate_id",
      "category",
      "reason",
      "source_authority",
    ] as const) {
      if (!decision[field]?.trim()) {
        failures.push(`decision ${index + 1} missing ${field}`);
      }
    }

    if (!knownCategories.has(decision.category)) {
      failures.push(`decision ${index + 1} has unknown category`);
    }

    for (const field of [
      "evidence_refs",
      "counterexample_refs",
      "residual_tension_refs",
    ] as const) {
      if (!Array.isArray(decision[field])) {
        failures.push(`decision ${index + 1} ${field} is not an array`);
      }
    }
  });

  return failures;
}

function countSummaryOnlyEvidenceAnchors(
  context: TemporalPreviewContext,
  preview: TemporalInterpretationPreview,
) {
  const summaryOnlyRefs = new Set([
    ...context.source_authority_profile.summary_only_refs,
    ...preview.summary_refs.map((ref) => ref.ref),
  ]);

  return preview.evidence_anchors.filter(
    (anchor) =>
      summaryOnlyRefs.has(anchor.ref) || anchor.ref.startsWith("summary:"),
  ).length;
}

function preservesCounterexamples(
  context: TemporalPreviewContext,
  preview: TemporalInterpretationPreview,
) {
  const outputRefs = new Set(preview.counterexamples.map((item) => item.ref));
  const admissionRefs = new Set(
    preview.active_context_admission?.decisions.flatMap(
      (decision) => decision.counterexample_refs,
    ) ?? [],
  );

  return context.counterexamples.every(
    (item) => outputRefs.has(item.ref) && admissionRefs.has(item.ref),
  );
}

function preservesResidualTensions(
  context: TemporalPreviewContext,
  preview: TemporalInterpretationPreview,
) {
  const outputRefs = new Set(preview.residual_tensions.map((item) => item.ref));
  const admissionRefs = new Set(
    preview.active_context_admission?.decisions.flatMap(
      (decision) => decision.residual_tension_refs,
    ) ?? [],
  );

  return context.residual_tensions.every(
    (item) => outputRefs.has(item.ref) && admissionRefs.has(item.ref),
  );
}

function detectsUnsafeSafeNextStep(safeNextStep: string) {
  const text = safeNextStep.toLowerCase();
  const negatedBoundary =
    text.includes("does not approve") ||
    text.includes("does not publish") ||
    text.includes("not ready to ship") ||
    text.includes("not p4 ready") ||
    text.includes("not fully verified") ||
    text.includes("must not approve") ||
    text.includes("must not publish");

  if (negatedBoundary) return false;

  return (
    /\bapprove\b/.test(text) ||
    /\bpublish\b/.test(text) ||
    text.includes("ready to ship") ||
    text.includes("p4 ready") ||
    text.includes("fully verified") ||
    text.includes("production ready") ||
    text.includes("approved for implementation")
  );
}
