import {
  TRANSITION_RELATIONS,
  type TemporalInterpretationPreview,
  type TemporalPreviewContext,
} from "@/lib/temporal-interpretation/types";

const DEFAULT_MODEL = "gpt-4.1-mini";

export async function buildOpenAITemporalPreview({
  context,
}: {
  context: TemporalPreviewContext;
}): Promise<{ model: string; preview: TemporalInterpretationPreview }> {
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildSystemPrompt(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({ context }),
            },
          ],
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
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI temporal preview failed: ${response.status} ${details}`);
  }

  const payload = (await response.json()) as unknown;
  const text = extractOutputText(payload);
  if (!text) {
    throw new Error("OpenAI temporal preview response did not include output text.");
  }

  return { model, preview: validateTemporalPreview(JSON.parse(text)) };
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
    "Preserve evidence anchors, summary refs, authority profile, counterexamples, residual tensions, safe next step, and non-authority boundary from context.",
    "Summary-only refs may appear in summary_refs but must not become evidence_anchors.",
    "Blocked actions must remain blocked and must not be listed as allowed_now.",
    "User preferences are context, not factual readiness or implementation approval.",
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
    "safe_next_step",
    "non_authority_boundary",
    "warnings",
  ],
};
