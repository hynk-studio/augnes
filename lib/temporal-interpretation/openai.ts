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
  type BoundedModelTransport,
  readModelEgressArray,
  readModelEgressField,
  requireModelEgressRecord,
  requireModelEgressText,
  serializeModelEgressJson,
  refuseModelEgress,
} from "@/lib/model-egress/bounded-model-payload";

const DEFAULT_MODEL = "gpt-4.1-mini";
const TEMPORAL_EGRESS_PURPOSE = "temporal_interpretation" as const;

export const TEMPORAL_MODEL_EGRESS_LIMITS = Object.freeze({
  stringBytes: 4_096,
  sourceItemBytes: 4_096,
  dynamicBytes: 32_768,
  finalRequestBytes: 65_536,
});

export type TemporalModelTransport = BoundedModelTransport;

export async function buildOpenAITemporalPreview({
  context,
}: {
  context: TemporalPreviewContext;
}): Promise<{ model: string; preview: TemporalInterpretationPreview }> {
  return buildOpenAITemporalPreviewWithTransport(
    context,
    sendTemporalModelRequest,
  );
}

export function buildOpenAITemporalPreviewForTest(
  context: TemporalPreviewContext,
  transport: TemporalModelTransport,
) {
  return buildOpenAITemporalPreviewWithTransport(context, transport);
}

async function buildOpenAITemporalPreviewWithTransport(
  context: TemporalPreviewContext,
  transport: TemporalModelTransport,
): Promise<{ model: string; preview: TemporalInterpretationPreview }> {
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const dynamicText = serializeModelEgressJson(
    TEMPORAL_EGRESS_PURPOSE,
    { context: projectTemporalModelContext(context) },
    TEMPORAL_MODEL_EGRESS_LIMITS.dynamicBytes,
  );
  const requestBody = serializeModelEgressJson(
    TEMPORAL_EGRESS_PURPOSE,
    {
      model: requireModelEgressText(
        TEMPORAL_EGRESS_PURPOSE,
        model,
        128,
      ),
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: buildSystemPrompt() }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: dynamicText }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "temporal_interpretation_preview",
          strict: true,
          schema: temporalPreviewSchema,
        },
      },
    },
    TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes,
  );
  const response = await transport(requestBody);

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

async function sendTemporalModelRequest(requestBody: string) {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: requestBody,
  });
}

function projectTemporalModelContext(value: unknown) {
  const record = requireModelEgressRecord(TEMPORAL_EGRESS_PURPOSE, value);
  return {
    scope: temporalText(record, "scope", 160),
    as_of: temporalText(record, "as_of", 128),
    current_interpretation: temporalText(record, "current_interpretation"),
    active_prior_context: temporalText(record, "active_prior_context"),
    evidence_anchors: temporalObjectList(record, "evidence_anchors", 8, (item) => ({
      ref: temporalText(item, "ref", 512),
      claim: temporalText(item, "claim"),
      source_type: temporalEnum(item, "source_type", [
        "committed_state",
        "action_record",
        "work_trace",
        "doc",
      ] as const),
    })),
    summary_refs: temporalObjectList(record, "summary_refs", 2, (item) => ({
      ref: temporalText(item, "ref", 512),
      summary: temporalText(item, "summary"),
    })),
    source_authority_profile: projectTemporalAuthorityProfile(
      temporalRecord(record, "source_authority_profile"),
    ),
    counterexamples: temporalObjectList(record, "counterexamples", 3, (item) => ({
      ref: temporalText(item, "ref", 512),
      description: temporalText(item, "description"),
    })),
    residual_tensions: temporalObjectList(record, "residual_tensions", 4, (item) => ({
      ref: temporalText(item, "ref", 512),
      description: temporalText(item, "description"),
    })),
    user_preferences: temporalTextList(record, "user_preferences", 2),
    safe_next_step: temporalText(record, "safe_next_step"),
    non_authority_boundary: temporalText(record, "non_authority_boundary"),
    active_context_admission_rationale: temporalObjectList(
      record,
      "active_context_admission_rationale",
      4,
      (item) => ({
        context_ref: temporalText(item, "context_ref", 512),
        admission_role: temporalEnum(
          item,
          "admission_role",
          ACTIVE_CONTEXT_ADMISSION_ROLES,
        ),
        why_admitted: temporalText(item, "why_admitted"),
        why_not_merely_summary: temporalText(
          item,
          "why_not_merely_summary",
        ),
      }),
    ),
    active_context_admission: projectTemporalAdmission(
      temporalRecord(record, "active_context_admission"),
    ),
    suppressed_alternatives: temporalObjectList(
      record,
      "suppressed_alternatives",
      3,
      (item) => ({
        alternative: temporalText(item, "alternative"),
        why_deferred: temporalText(item, "why_deferred"),
        what_would_change_status: temporalText(
          item,
          "what_would_change_status",
        ),
        status: temporalEnum(
          item,
          "status",
          SUPPRESSED_ALTERNATIVE_STATUSES,
        ),
      }),
    ),
    temporal_hierarchy_view: projectTemporalHierarchy(
      temporalRecord(record, "temporal_hierarchy_view"),
    ),
    memory_lifecycle_view: projectTemporalMemoryLifecycle(
      temporalRecord(record, "memory_lifecycle_view"),
    ),
    interpretive_drivers: temporalObjectList(
      record,
      "interpretive_drivers",
      4,
      (item) => ({
        axis: temporalEnum(item, "axis", TEMPORAL_INTERPRETATION_AXES),
        driver: temporalText(item, "driver"),
        effect: temporalText(item, "effect"),
      }),
    ),
    axis_pressures: temporalObjectList(record, "axis_pressures", 4, (item) => ({
      axis: temporalEnum(item, "axis", TEMPORAL_INTERPRETATION_AXES),
      pressure: temporalEnum(item, "pressure", AXIS_PRESSURE_LABELS),
      reason: temporalText(item, "reason"),
    })),
  };
}

function projectTemporalAuthorityProfile(record: Record<string, unknown>) {
  return {
    committed_state_authority: temporalTextList(
      record,
      "committed_state_authority",
      8,
    ),
    summary_only_refs: temporalTextList(record, "summary_only_refs", 2),
    allowed_now: temporalTextList(record, "allowed_now", 3),
    blocked_now: temporalTextList(record, "blocked_now", 4),
  };
}

function projectTemporalAdmission(record: Record<string, unknown>) {
  return {
    decisions: temporalObjectList(record, "decisions", 10, (item) => ({
      candidate_id: temporalText(item, "candidate_id", 512),
      category: temporalEnum(
        item,
        "category",
        ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
      ),
      reason: temporalText(item, "reason"),
      source_authority: temporalText(item, "source_authority", 512),
      evidence_refs: temporalTextList(item, "evidence_refs", 1),
      counterexample_refs: temporalTextList(item, "counterexample_refs", 3),
      residual_tension_refs: temporalTextList(
        item,
        "residual_tension_refs",
        1,
      ),
    })),
    note: temporalText(record, "note"),
  };
}

function projectTemporalHierarchy(record: Record<string, unknown>) {
  return {
    raw_observation_level: temporalText(record, "raw_observation_level"),
    work_or_session_level: temporalText(record, "work_or_session_level"),
    project_status_level: temporalText(record, "project_status_level"),
    current_interpretive_stance: temporalText(
      record,
      "current_interpretive_stance",
    ),
    hierarchy_caution: temporalText(record, "hierarchy_caution"),
  };
}

function projectTemporalMemoryLifecycle(record: Record<string, unknown>) {
  return {
    active_context: temporalTextList(record, "active_context", 5),
    retrieved_context: temporalTextList(record, "retrieved_context", 3),
    summary_or_view: temporalTextList(record, "summary_or_view", 2),
    stale_or_deferred_context: temporalTextList(
      record,
      "stale_or_deferred_context",
      5,
    ),
    lifecycle_caution: temporalText(record, "lifecycle_caution"),
  };
}

function temporalRecord(record: Record<string, unknown>, key: string) {
  return requireModelEgressRecord(
    TEMPORAL_EGRESS_PURPOSE,
    readModelEgressField(TEMPORAL_EGRESS_PURPOSE, record, key),
  );
}

function temporalText(
  record: Record<string, unknown>,
  key: string,
  maximum: number = TEMPORAL_MODEL_EGRESS_LIMITS.stringBytes,
) {
  return requireModelEgressText(
    TEMPORAL_EGRESS_PURPOSE,
    readModelEgressField(TEMPORAL_EGRESS_PURPOSE, record, key),
    maximum,
  );
}

function temporalTextList(
  record: Record<string, unknown>,
  key: string,
  maximumItems: number,
) {
  return readModelEgressArray(
    TEMPORAL_EGRESS_PURPOSE,
    readModelEgressField(TEMPORAL_EGRESS_PURPOSE, record, key),
    maximumItems,
  ).map((item) =>
    requireModelEgressText(
      TEMPORAL_EGRESS_PURPOSE,
      item,
      TEMPORAL_MODEL_EGRESS_LIMITS.stringBytes,
    ),
  );
}

function temporalObjectList<T>(
  record: Record<string, unknown>,
  key: string,
  maximumItems: number,
  project: (item: Record<string, unknown>) => T,
) {
  return readModelEgressArray(
    TEMPORAL_EGRESS_PURPOSE,
    readModelEgressField(TEMPORAL_EGRESS_PURPOSE, record, key),
    maximumItems,
  ).map((item) => {
    const projected = project(
      requireModelEgressRecord(TEMPORAL_EGRESS_PURPOSE, item),
    );
    serializeModelEgressJson(
      TEMPORAL_EGRESS_PURPOSE,
      projected,
      TEMPORAL_MODEL_EGRESS_LIMITS.sourceItemBytes,
    );
    return projected;
  });
}

function temporalEnum<T extends readonly string[]>(
  record: Record<string, unknown>,
  key: string,
  allowed: T,
) {
  const value = readModelEgressField(TEMPORAL_EGRESS_PURPOSE, record, key);
  if (typeof value !== "string" || !allowed.includes(value)) {
    refuseModelEgress(
      TEMPORAL_EGRESS_PURPOSE,
      "model_egress_payload_malformed",
      1,
      0,
    );
  }
  return value as T[number];
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

function buildSystemPrompt() {
  return [
    "You are the Augnes Temporal Interpretation Preview generator.",
    "Generate a PerspectiveSnapshot-like preview, but do not claim full P4 implementation.",
    "Preserve evidence anchors, summary refs, authority profile, counterexamples, residual tensions, active context admission rationale, suppressed alternatives, hierarchy view, memory lifecycle view, interpretive drivers, axis pressures, safe next step, and non-authority boundary from context.",
    "When active_context_admission is present in context, preserve its decisions and note. Do not invent evidence refs, hide counterexamples, or turn admission decisions into authority.",
    "For current_interpretation, lead with the interpretive implication before listing counts: emphasize read-only demo meaning, committed state as evidence, summaries as guidance only, active API-key handling tension if present, and implementation still bounded by review.",
    "For safe_next_step, keep the wording action-oriented for challenge demo use while preserving read-only, non-authoritative, no durable PerspectiveSnapshot, and no implementation approval boundaries.",
    "Summary-only refs may appear in summary_refs but must not become evidence_anchors.",
    "Blocked actions must remain blocked and must not be listed as allowed_now.",
    "User preferences are context, not factual readiness or implementation approval.",
    "Suppressed alternatives are plausible deferred paths, not false claims or permanent rejections.",
    "Interpretive driver axes must use only: factuality, continuity, user_context, boundary, exploration, implementation, stability, revision.",
    "Axis pressures are qualitative reviewer-visible diagnostics only; use labels high, medium, low, blocked, or needs_review and never numbers.",
    "The preview is read-only and non-authoritative.",
  ].join("\n");
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

const stringArraySchema = {
  type: "array",
  items: { type: "string" },
};

const evidenceAnchorSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ref: { type: "string" },
    claim: { type: "string" },
    source_type: {
      type: "string",
      enum: ["committed_state", "action_record", "work_trace", "doc"],
    },
  },
  required: ["ref", "claim", "source_type"],
};

const refDescriptionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ref: { type: "string" },
    description: { type: "string" },
  },
  required: ["ref", "description"],
};

const activeContextAdmissionRationaleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    context_ref: { type: "string" },
    admission_role: {
      type: "string",
      enum: ACTIVE_CONTEXT_ADMISSION_ROLES,
    },
    why_admitted: { type: "string" },
    why_not_merely_summary: { type: "string" },
  },
  required: [
    "context_ref",
    "admission_role",
    "why_admitted",
    "why_not_merely_summary",
  ],
};

const activeContextAdmissionDecisionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidate_id: { type: "string" },
    category: {
      type: "string",
      enum: ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
    },
    reason: { type: "string" },
    source_authority: { type: "string" },
    evidence_refs: stringArraySchema,
    counterexample_refs: stringArraySchema,
    residual_tension_refs: stringArraySchema,
  },
  required: [
    "candidate_id",
    "category",
    "reason",
    "source_authority",
    "evidence_refs",
    "counterexample_refs",
    "residual_tension_refs",
  ],
};

const activeContextAdmissionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    decisions: {
      type: "array",
      items: activeContextAdmissionDecisionSchema,
    },
    note: { type: "string" },
  },
  required: ["decisions", "note"],
};

const suppressedAlternativeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    alternative: { type: "string" },
    why_deferred: { type: "string" },
    what_would_change_status: { type: "string" },
    status: {
      type: "string",
      enum: SUPPRESSED_ALTERNATIVE_STATUSES,
    },
  },
  required: [
    "alternative",
    "why_deferred",
    "what_would_change_status",
    "status",
  ],
};

const temporalHierarchyViewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    raw_observation_level: { type: "string" },
    work_or_session_level: { type: "string" },
    project_status_level: { type: "string" },
    current_interpretive_stance: { type: "string" },
    hierarchy_caution: { type: "string" },
  },
  required: [
    "raw_observation_level",
    "work_or_session_level",
    "project_status_level",
    "current_interpretive_stance",
    "hierarchy_caution",
  ],
};

const memoryLifecycleViewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    active_context: stringArraySchema,
    retrieved_context: stringArraySchema,
    summary_or_view: stringArraySchema,
    stale_or_deferred_context: stringArraySchema,
    lifecycle_caution: { type: "string" },
  },
  required: [
    "active_context",
    "retrieved_context",
    "summary_or_view",
    "stale_or_deferred_context",
    "lifecycle_caution",
  ],
};

const interpretiveDriverSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    axis: {
      type: "string",
      enum: TEMPORAL_INTERPRETATION_AXES,
    },
    driver: { type: "string" },
    effect: { type: "string" },
  },
  required: ["axis", "driver", "effect"],
};

const axisPressureSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    axis: {
      type: "string",
      enum: TEMPORAL_INTERPRETATION_AXES,
    },
    pressure: {
      type: "string",
      enum: AXIS_PRESSURE_LABELS,
    },
    reason: { type: "string" },
  },
  required: ["axis", "pressure", "reason"],
};

const temporalPreviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    current_interpretation: { type: "string" },
    active_prior_context: { type: "string" },
    evidence_anchors: {
      type: "array",
      items: evidenceAnchorSchema,
    },
    summary_refs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          ref: { type: "string" },
          summary: { type: "string" },
        },
        required: ["ref", "summary"],
      },
    },
    source_authority_profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        committed_state_authority: stringArraySchema,
        summary_only_refs: stringArraySchema,
        allowed_now: stringArraySchema,
        blocked_now: stringArraySchema,
      },
      required: [
        "committed_state_authority",
        "summary_only_refs",
        "allowed_now",
        "blocked_now",
      ],
    },
    counterexamples: {
      type: "array",
      items: refDescriptionSchema,
    },
    residual_tensions: {
      type: "array",
      items: refDescriptionSchema,
    },
    transition_relation: {
      type: "string",
      enum: TRANSITION_RELATIONS,
    },
    revision_explanation: { type: "string" },
    user_context_vs_factuality: { type: "string" },
    active_context_admission_rationale: {
      type: "array",
      items: activeContextAdmissionRationaleSchema,
    },
    active_context_admission: activeContextAdmissionSchema,
    suppressed_alternatives: {
      type: "array",
      items: suppressedAlternativeSchema,
    },
    temporal_hierarchy_view: temporalHierarchyViewSchema,
    memory_lifecycle_view: memoryLifecycleViewSchema,
    interpretive_drivers: {
      type: "array",
      items: interpretiveDriverSchema,
    },
    axis_pressures: {
      type: "array",
      items: axisPressureSchema,
    },
    safe_next_step: { type: "string" },
    non_authority_boundary: { type: "string" },
    warnings: stringArraySchema,
  },
  required: [
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
  ],
};
