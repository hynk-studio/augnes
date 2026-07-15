import {
  readModelEgressArray,
  readModelEgressField,
  refuseModelEgress,
  requireModelEgressRecord,
  requireModelEgressText,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import { validateTemporalInterpretationPreview } from "@/lib/temporal-interpretation/preview-contract";
import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
  ACTIVE_CONTEXT_ADMISSION_ROLES,
  AXIS_PRESSURE_LABELS,
  SUPPRESSED_ALTERNATIVE_STATUSES,
  TEMPORAL_INTERPRETATION_AXES,
  TRANSITION_RELATIONS,
} from "@/lib/temporal-interpretation/types";
import {
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type TemporalModelInvocationEnvelopeV01,
} from "@/lib/vnext/model-gateway/contracts";

export const TEMPORAL_MODEL_EGRESS_LIMITS = Object.freeze({
  stringBytes: 4_096,
  sourceItemBytes: 4_096,
  dynamicBytes: 32_768,
  finalRequestBytes: 65_536,
  responseBytes: 131_072,
});

export function projectTemporalModelMaterial(
  input: { canonical_project_id: string } & TemporalModelInvocationEnvelopeV01["input"],
) {
  const record = requireModelEgressRecord(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    input.context,
  );
  const scope = temporalText(record, "scope", 256);
  if (scope !== input.canonical_project_id) temporalMalformed();

  const context = {
    scope,
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
    residual_tensions: temporalObjectList(
      record,
      "residual_tensions",
      4,
      (item) => ({
        ref: temporalText(item, "ref", 512),
        description: temporalText(item, "description"),
      }),
    ),
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
        why_not_merely_summary: temporalText(item, "why_not_merely_summary"),
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
        what_would_change_status: temporalText(item, "what_would_change_status"),
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
  assertNoForeignProjectIdentity(context, input.canonical_project_id);
  return { project_id: input.canonical_project_id, context };
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
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01, record, key),
  );
}

function temporalText(
  record: Record<string, unknown>,
  key: string,
  maximum: number = TEMPORAL_MODEL_EGRESS_LIMITS.stringBytes,
) {
  return requireModelEgressText(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01, record, key),
    maximum,
  );
}

function temporalTextList(
  record: Record<string, unknown>,
  key: string,
  maximumItems: number,
) {
  return readModelEgressArray(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01, record, key),
    maximumItems,
  ).map((item) =>
    requireModelEgressText(
      TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
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
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    readModelEgressField(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01, record, key),
    maximumItems,
  ).map((item) => {
    const projected = project(
      requireModelEgressRecord(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01, item),
    );
    serializeModelEgressJson(
      TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
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
  const value = readModelEgressField(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    record,
    key,
  );
  if (typeof value !== "string" || !allowed.includes(value)) temporalMalformed();
  return value as T[number];
}

function assertNoForeignProjectIdentity(value: unknown, projectId: string) {
  const serialized = serializeModelEgressJson(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    value,
    TEMPORAL_MODEL_EGRESS_LIMITS.dynamicBytes,
  );
  const matches = serialized.match(
    /project:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
  );
  if (matches?.some((match) => match.toLowerCase() !== projectId.toLowerCase())) {
    temporalMalformed();
  }
}

function temporalMalformed(): never {
  refuseModelEgress(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    "model_egress_payload_malformed",
    1,
    0,
  );
}

export function buildTemporalSystemPrompt() {
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

export function parseTemporalOutput(outputText: string) {
  return validateTemporalInterpretationPreview(JSON.parse(outputText));
}

const stringArraySchema = { type: "array", items: { type: "string" } };
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
  properties: { ref: { type: "string" }, description: { type: "string" } },
  required: ["ref", "description"],
};
const activeContextAdmissionRationaleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    context_ref: { type: "string" },
    admission_role: { type: "string", enum: ACTIVE_CONTEXT_ADMISSION_ROLES },
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
    category: { type: "string", enum: ACTIVE_CONTEXT_ADMISSION_CATEGORIES },
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
    decisions: { type: "array", items: activeContextAdmissionDecisionSchema },
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
    status: { type: "string", enum: SUPPRESSED_ALTERNATIVE_STATUSES },
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
    axis: { type: "string", enum: TEMPORAL_INTERPRETATION_AXES },
    driver: { type: "string" },
    effect: { type: "string" },
  },
  required: ["axis", "driver", "effect"],
};
const axisPressureSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    axis: { type: "string", enum: TEMPORAL_INTERPRETATION_AXES },
    pressure: { type: "string", enum: AXIS_PRESSURE_LABELS },
    reason: { type: "string" },
  },
  required: ["axis", "pressure", "reason"],
};

export const temporalResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    current_interpretation: { type: "string" },
    active_prior_context: { type: "string" },
    evidence_anchors: { type: "array", items: evidenceAnchorSchema },
    summary_refs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { ref: { type: "string" }, summary: { type: "string" } },
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
    counterexamples: { type: "array", items: refDescriptionSchema },
    residual_tensions: { type: "array", items: refDescriptionSchema },
    transition_relation: { type: "string", enum: TRANSITION_RELATIONS },
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
    interpretive_drivers: { type: "array", items: interpretiveDriverSchema },
    axis_pressures: { type: "array", items: axisPressureSchema },
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
