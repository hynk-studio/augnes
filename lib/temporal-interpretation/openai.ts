import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
  ACTIVE_CONTEXT_ADMISSION_ROLES,
  AXIS_PRESSURE_LABELS,
  SUPPRESSED_ALTERNATIVE_STATUSES,
  TEMPORAL_INTERPRETATION_AXES,
  TRANSITION_RELATIONS,
  type TemporalInterpretationPreview,
  type TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";
import {
  buildOpenAIOutboundPayloadV01,
  OpenAIOutboundPayloadBoundaryErrorV01,
  type OpenAIResponsesProviderPayloadV01,
} from "@/lib/model-egress/openai-outbound-payload-boundary-v0-1";

const DEFAULT_MODEL = "gpt-4.1-mini";

type TemporalOpenAITransportResultV01 = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type TemporalOpenAITransportV01 = (
  payload: OpenAIResponsesProviderPayloadV01,
) => Promise<TemporalOpenAITransportResultV01>;

export async function buildOpenAITemporalPreview({
  context,
  transport = sendTemporalOpenAIRequest,
}: {
  context: TemporalPreviewContext;
  transport?: TemporalOpenAITransportV01;
}): Promise<{ model: string; preview: TemporalInterpretationPreview }> {
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const boundary = buildOpenAIOutboundPayloadV01({
    purpose: "temporal_interpretation",
    model,
    context,
  });
  if (boundary.status === "blocked") {
    throw new OpenAIOutboundPayloadBoundaryErrorV01(boundary);
  }

  const response = await transport(boundary.provider_payload);

  if (!response.ok) {
    throw new Error(`OpenAI temporal preview failed: ${response.status}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  if (!text) {
    throw new Error("OpenAI temporal preview response did not include output text.");
  }

  return { model, preview: validateTemporalPreview(JSON.parse(text)) };
}

async function sendTemporalOpenAIRequest(
  payload: OpenAIResponsesProviderPayloadV01,
): Promise<TemporalOpenAITransportResultV01> {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function validateTemporalPreview(
  value: unknown,
): TemporalInterpretationPreview {
  if (!isRecord(value)) {
    throw new Error("Temporal preview must be an object.");
  }

  return {
    current_interpretation: requireString(value, "current_interpretation"),
    active_prior_context: requireString(value, "active_prior_context"),
    evidence_anchors: requireArray(value, "evidence_anchors").map(
      validateEvidenceAnchor,
    ),
    summary_refs: requireArray(value, "summary_refs").map(validateSummaryRef),
    source_authority_profile: validateAuthorityProfile(
      value.source_authority_profile,
    ),
    counterexamples: requireArray(value, "counterexamples").map(
      validateRefDescription,
    ),
    residual_tensions: requireArray(value, "residual_tensions").map(
      validateRefDescription,
    ),
    transition_relation: requireTransitionRelation(value.transition_relation),
    revision_explanation: requireString(value, "revision_explanation"),
    user_context_vs_factuality: requireString(
      value,
      "user_context_vs_factuality",
    ),
    active_context_admission_rationale: requireArray(
      value,
      "active_context_admission_rationale",
    ).map(validateActiveContextAdmissionRationale),
    active_context_admission: isRecord(value.active_context_admission)
      ? validateActiveContextAdmission(value.active_context_admission)
      : undefined,
    suppressed_alternatives: requireArray(
      value,
      "suppressed_alternatives",
    ).map(validateSuppressedAlternative),
    temporal_hierarchy_view: validateTemporalHierarchyView(
      value.temporal_hierarchy_view,
    ),
    memory_lifecycle_view: validateMemoryLifecycleView(
      value.memory_lifecycle_view,
    ),
    interpretive_drivers: requireArray(value, "interpretive_drivers").map(
      validateInterpretiveDriver,
    ),
    axis_pressures: requireArray(value, "axis_pressures").map(
      validateAxisPressure,
    ),
    safe_next_step: requireString(value, "safe_next_step"),
    non_authority_boundary: requireString(value, "non_authority_boundary"),
    warnings: requireArray(value, "warnings").map((warning) =>
      requireStandaloneString(warning, "warning"),
    ),
  };
}

function extractOutputText(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) {
    return null;
  }

  for (const output of payload.output) {
    if (!isRecord(output) || !Array.isArray(output.content)) {
      continue;
    }

    for (const content of output.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function validateEvidenceAnchor(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Evidence anchor must be an object.");
  }

  const sourceType = value.source_type;
  if (
    sourceType !== "committed_state" &&
    sourceType !== "action_record" &&
    sourceType !== "work_trace" &&
    sourceType !== "doc"
  ) {
    throw new Error("Invalid evidence anchor source_type.");
  }

  return {
    ref: requireString(value, "ref"),
    claim: requireString(value, "claim"),
    source_type: sourceType as
      | "committed_state"
      | "action_record"
      | "work_trace"
      | "doc",
  };
}

function validateSummaryRef(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Summary ref must be an object.");
  }

  return {
    ref: requireString(value, "ref"),
    summary: requireString(value, "summary"),
  };
}

function validateAuthorityProfile(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("source_authority_profile must be an object.");
  }

  return {
    committed_state_authority: requireStringArray(
      value,
      "committed_state_authority",
    ),
    summary_only_refs: requireStringArray(value, "summary_only_refs"),
    allowed_now: requireStringArray(value, "allowed_now"),
    blocked_now: requireStringArray(value, "blocked_now"),
  };
}

function validateRefDescription(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Ref description item must be an object.");
  }

  return {
    ref: requireString(value, "ref"),
    description: requireString(value, "description"),
  };
}

function validateActiveContextAdmissionRationale(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Active context admission rationale must be an object.");
  }

  return {
    context_ref: requireString(value, "context_ref"),
    admission_role: requireActiveContextAdmissionRole(value.admission_role),
    why_admitted: requireString(value, "why_admitted"),
    why_not_merely_summary: requireString(value, "why_not_merely_summary"),
  };
}

function validateActiveContextAdmission(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("active_context_admission must be an object.");
  }

  return {
    decisions: requireArray(value, "decisions").map(
      validateActiveContextAdmissionDecision,
    ),
    note: requireString(value, "note"),
  };
}

function validateActiveContextAdmissionDecision(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Active context admission decision must be an object.");
  }

  return {
    candidate_id: requireString(value, "candidate_id"),
    category: requireActiveContextAdmissionCategory(value.category),
    reason: requireString(value, "reason"),
    source_authority: requireString(value, "source_authority"),
    evidence_refs: requireStringArray(value, "evidence_refs"),
    counterexample_refs: requireStringArray(value, "counterexample_refs"),
    residual_tension_refs: requireStringArray(value, "residual_tension_refs"),
  };
}

function validateSuppressedAlternative(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Suppressed alternative must be an object.");
  }

  return {
    alternative: requireString(value, "alternative"),
    why_deferred: requireString(value, "why_deferred"),
    what_would_change_status: requireString(value, "what_would_change_status"),
    status: requireSuppressedAlternativeStatus(value.status),
  };
}

function validateTemporalHierarchyView(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("temporal_hierarchy_view must be an object.");
  }

  return {
    raw_observation_level: requireString(value, "raw_observation_level"),
    work_or_session_level: requireString(value, "work_or_session_level"),
    project_status_level: requireString(value, "project_status_level"),
    current_interpretive_stance: requireString(
      value,
      "current_interpretive_stance",
    ),
    hierarchy_caution: requireString(value, "hierarchy_caution"),
  };
}

function validateMemoryLifecycleView(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("memory_lifecycle_view must be an object.");
  }

  return {
    active_context: requireStringArray(value, "active_context"),
    retrieved_context: requireStringArray(value, "retrieved_context"),
    summary_or_view: requireStringArray(value, "summary_or_view"),
    stale_or_deferred_context: requireStringArray(
      value,
      "stale_or_deferred_context",
    ),
    lifecycle_caution: requireString(value, "lifecycle_caution"),
  };
}

function validateInterpretiveDriver(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Interpretive driver must be an object.");
  }

  return {
    axis: requireTemporalInterpretationAxis(value.axis),
    driver: requireString(value, "driver"),
    effect: requireString(value, "effect"),
  };
}

function validateAxisPressure(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Axis pressure must be an object.");
  }

  return {
    axis: requireTemporalInterpretationAxis(value.axis),
    pressure: requireAxisPressureLabel(value.pressure),
    reason: requireString(value, "reason"),
  };
}

function requireString(record: Record<string, unknown>, key: string) {
  return requireStandaloneString(record[key], key);
}

function requireStandaloneString(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function requireArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array.`);
  }

  return value;
}

function requireStringArray(record: Record<string, unknown>, key: string) {
  return requireArray(record, key).map((value) =>
    requireStandaloneString(value, key),
  );
}

function requireTransitionRelation(value: unknown) {
  if (
    typeof value === "string" &&
    TRANSITION_RELATIONS.includes(value as (typeof TRANSITION_RELATIONS)[number])
  ) {
    return value as (typeof TRANSITION_RELATIONS)[number];
  }

  throw new Error(
    `transition_relation must be one of: ${TRANSITION_RELATIONS.join(", ")}`,
  );
}

function requireTemporalInterpretationAxis(value: unknown) {
  if (
    typeof value === "string" &&
    TEMPORAL_INTERPRETATION_AXES.includes(
      value as (typeof TEMPORAL_INTERPRETATION_AXES)[number],
    )
  ) {
    return value as (typeof TEMPORAL_INTERPRETATION_AXES)[number];
  }

  throw new Error(
    `axis must be one of: ${TEMPORAL_INTERPRETATION_AXES.join(", ")}`,
  );
}

function requireActiveContextAdmissionRole(value: unknown) {
  if (
    typeof value === "string" &&
    ACTIVE_CONTEXT_ADMISSION_ROLES.includes(
      value as (typeof ACTIVE_CONTEXT_ADMISSION_ROLES)[number],
    )
  ) {
    return value as (typeof ACTIVE_CONTEXT_ADMISSION_ROLES)[number];
  }

  throw new Error(
    `admission_role must be one of: ${ACTIVE_CONTEXT_ADMISSION_ROLES.join(
      ", ",
    )}`,
  );
}

function requireActiveContextAdmissionCategory(value: unknown) {
  if (
    typeof value === "string" &&
    ACTIVE_CONTEXT_ADMISSION_CATEGORIES.includes(
      value as (typeof ACTIVE_CONTEXT_ADMISSION_CATEGORIES)[number],
    )
  ) {
    return value as (typeof ACTIVE_CONTEXT_ADMISSION_CATEGORIES)[number];
  }

  throw new Error(
    `active context admission category must be one of: ${ACTIVE_CONTEXT_ADMISSION_CATEGORIES.join(
      ", ",
    )}`,
  );
}

function requireSuppressedAlternativeStatus(value: unknown) {
  if (
    typeof value === "string" &&
    SUPPRESSED_ALTERNATIVE_STATUSES.includes(
      value as (typeof SUPPRESSED_ALTERNATIVE_STATUSES)[number],
    )
  ) {
    return value as (typeof SUPPRESSED_ALTERNATIVE_STATUSES)[number];
  }

  throw new Error(
    `suppressed alternative status must be one of: ${SUPPRESSED_ALTERNATIVE_STATUSES.join(
      ", ",
    )}`,
  );
}

function requireAxisPressureLabel(value: unknown) {
  if (
    typeof value === "string" &&
    AXIS_PRESSURE_LABELS.includes(value as (typeof AXIS_PRESSURE_LABELS)[number])
  ) {
    return value as (typeof AXIS_PRESSURE_LABELS)[number];
  }

  throw new Error(
    `axis pressure must be one of: ${AXIS_PRESSURE_LABELS.join(", ")}`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
