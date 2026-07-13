import { Buffer } from "node:buffer";

import {
  ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
  ACTIVE_CONTEXT_ADMISSION_ROLES,
  AXIS_PRESSURE_LABELS,
  SUPPRESSED_ALTERNATIVE_STATUSES,
  TEMPORAL_INTERPRETATION_AXES,
  TRANSITION_RELATIONS,
} from "@/lib/temporal-interpretation/types";

export const OPENAI_OUTBOUND_PAYLOAD_POLICY_VERSION_V01 =
  "openai_outbound_payload_boundary.v0.1" as const;

export const OPENAI_OUTBOUND_PAYLOAD_PURPOSES_V01 = Object.freeze([
  "observe_delta_compile",
  "planner_plan",
  "temporal_interpretation",
] as const);

export type OpenAIOutboundPayloadPurposeV01 =
  (typeof OPENAI_OUTBOUND_PAYLOAD_PURPOSES_V01)[number];

export const OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01 = deepFreezePolicyV01({
  common: {
    max_depth: 8,
    max_keys_per_object: 40,
    max_total_keys: 1_024,
    max_total_nodes: 2_048,
    max_source_item_bytes: 4_096,
    max_issues: 32,
  },
  observe_delta_compile: {
    max_string_bytes: 32_768,
    max_collection_items: 64,
    max_state_items: 64,
    max_dynamic_bytes: 65_536,
    max_final_request_bytes: 98_304,
  },
  planner_plan: {
    max_string_bytes: 8_192,
    max_collection_items: 64,
    max_state_items: 64,
    max_state_bucket_items: 32,
    max_tension_items: 16,
    max_proposal_items: 16,
    max_dynamic_bytes: 65_536,
    max_final_request_bytes: 98_304,
  },
  temporal_interpretation: {
    max_string_bytes: 4_096,
    max_collection_items: 32,
    max_dynamic_bytes: 32_768,
    max_final_request_bytes: 65_536,
  },
} as const);

const ACTIVE_CONTEXT_ADMISSION_CATEGORIES_V01 = deepFreezePolicyV01([
  ...ACTIVE_CONTEXT_ADMISSION_CATEGORIES,
]);
const ACTIVE_CONTEXT_ADMISSION_ROLES_V01 = deepFreezePolicyV01([
  ...ACTIVE_CONTEXT_ADMISSION_ROLES,
]);
const AXIS_PRESSURE_LABELS_V01 = deepFreezePolicyV01([
  ...AXIS_PRESSURE_LABELS,
]);
const SUPPRESSED_ALTERNATIVE_STATUSES_V01 = deepFreezePolicyV01([
  ...SUPPRESSED_ALTERNATIVE_STATUSES,
]);
const TEMPORAL_INTERPRETATION_AXES_V01 = deepFreezePolicyV01([
  ...TEMPORAL_INTERPRETATION_AXES,
]);
const TRANSITION_RELATIONS_V01 = deepFreezePolicyV01([
  ...TRANSITION_RELATIONS,
]);

type JsonScalar = string | number | boolean | null;
export type OpenAIOutboundJsonValueV01 =
  | JsonScalar
  | OpenAIOutboundJsonValueV01[]
  | { [key: string]: OpenAIOutboundJsonValueV01 };

export type OpenAIResponsesProviderPayloadV01 = {
  model: string;
  input: [
    {
      role: "system";
      content: [{ type: "input_text"; text: string }];
    },
    {
      role: "user";
      content: [{ type: "input_text"; text: string }];
    },
  ];
  text: {
    format: {
      type: "json_schema";
      name: string;
      strict: true;
      schema: Record<string, unknown>;
    };
  };
};

export type OpenAIOutboundPayloadReasonCodeV01 =
  | "model_egress_payload_oversize"
  | "model_egress_payload_unsafe"
  | "model_egress_payload_malformed"
  | "model_egress_payload_schema_mismatch";

export type OpenAIOutboundPayloadIssueV01 = {
  reason_code: OpenAIOutboundPayloadReasonCodeV01;
  purpose: OpenAIOutboundPayloadPurposeV01 | "unsupported";
  section: string;
  index?: number;
  measured?: number;
  maximum?: number;
};

export type OpenAIOutboundPayloadAuditV01 = {
  policy_version: typeof OPENAI_OUTBOUND_PAYLOAD_POLICY_VERSION_V01;
  purpose: OpenAIOutboundPayloadPurposeV01 | "unsupported";
  static_bytes: number;
  dynamic_bytes: number;
  final_request_bytes: number;
  total_nodes: number;
  total_keys: number;
  collection_items: number;
  limits: EffectiveLimitsV01;
};

export type OpenAIOutboundPayloadReadyV01 = {
  status: "ready";
  purpose: OpenAIOutboundPayloadPurposeV01;
  provider_payload: OpenAIResponsesProviderPayloadV01;
  audit: OpenAIOutboundPayloadAuditV01;
};

export type OpenAIOutboundPayloadBlockedV01 = {
  status: "blocked";
  purpose: OpenAIOutboundPayloadPurposeV01 | "unsupported";
  reason_codes: OpenAIOutboundPayloadReasonCodeV01[];
  issues: OpenAIOutboundPayloadIssueV01[];
  audit: OpenAIOutboundPayloadAuditV01;
  credential_material_included: false;
  private_material_included: false;
  provider_call_allowed_by_boundary: false;
};

export type OpenAIOutboundPayloadResultV01 =
  | OpenAIOutboundPayloadReadyV01
  | OpenAIOutboundPayloadBlockedV01;

export type OpenAIOutboundTestLimitsV01 = Partial<EffectiveLimitsV01>;

type EffectiveLimitsV01 = {
  max_depth: number;
  max_keys_per_object: number;
  max_total_keys: number;
  max_total_nodes: number;
  max_source_item_bytes: number;
  max_issues: number;
  max_string_bytes: number;
  max_collection_items: number;
  max_dynamic_bytes: number;
  max_final_request_bytes: number;
};

type ValidationContextV01 = {
  purpose: OpenAIOutboundPayloadPurposeV01 | "unsupported";
  limits: EffectiveLimitsV01;
  issues: OpenAIOutboundPayloadIssueV01[];
  total_nodes: number;
  total_keys: number;
  collection_items: number;
  ancestors: WeakSet<object>;
};

type SchemaV01 =
  | { kind: "string"; allow_empty?: boolean; max_bytes?: number }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "nullable"; value: SchemaV01 }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "state_value"; scalar_only?: boolean }
  | {
      kind: "array";
      items: SchemaV01;
      max_items: number;
      source_items?: boolean;
    }
  | {
      kind: "object";
      fields: Record<string, SchemaV01>;
      optional?: readonly string[];
      ignored_fields?: Record<string, SchemaV01>;
    };

const INVALID = Symbol("invalid_openai_outbound_payload");

export class OpenAIOutboundPayloadBoundaryErrorV01 extends Error {
  readonly code = "openai_outbound_payload_blocked_v0_1" as const;
  readonly blocked_result: OpenAIOutboundPayloadBlockedV01;

  constructor(result: OpenAIOutboundPayloadBlockedV01) {
    super(
      `${"openai_outbound_payload_blocked_v0_1"}:` +
        `${result.purpose}:` +
        `${result.reason_codes.join(",")}`,
    );
    this.name = "OpenAIOutboundPayloadBoundaryErrorV01";
    this.blocked_result = result;
  }
}

export function isOpenAIOutboundPayloadBoundaryErrorV01(
  value: unknown,
): value is OpenAIOutboundPayloadBoundaryErrorV01 {
  return value instanceof OpenAIOutboundPayloadBoundaryErrorV01;
}

export function buildOpenAIOutboundPayloadV01(
  input: unknown,
  options?: { test_limits?: OpenAIOutboundTestLimitsV01 },
): OpenAIOutboundPayloadResultV01 {
  try {
    return buildOpenAIOutboundPayloadUncheckedV01(input, options);
  } catch {
    const context: ValidationContextV01 = {
      purpose: "unsupported",
      limits: limitsForPurpose("unsupported"),
      issues: [],
      total_nodes: 0,
      total_keys: 0,
      collection_items: 0,
      ancestors: new WeakSet(),
    };
    addIssue(context, {
      reason_code: "model_egress_payload_malformed",
      section: "input",
    });
    return blockedResult(context);
  }
}

function buildOpenAIOutboundPayloadUncheckedV01(
  input: unknown,
  options?: { test_limits?: OpenAIOutboundTestLimitsV01 },
): OpenAIOutboundPayloadResultV01 {
  const purpose = readPurpose(input);
  const productionLimits = limitsForPurpose(purpose);
  const normalizedLimits = applyLowerOnlyTestLimits(
    productionLimits,
    options?.test_limits,
  );
  const context: ValidationContextV01 = {
    purpose,
    limits: normalizedLimits.limits,
    issues: [],
    total_nodes: 0,
    total_keys: 0,
    collection_items: 0,
    ancestors: new WeakSet(),
  };

  if (normalizedLimits.invalid) {
    addIssue(context, {
      reason_code: "model_egress_payload_schema_mismatch",
      section: "test_limits",
    });
  }

  if (purpose === "unsupported") {
    addIssue(context, {
      reason_code: "model_egress_payload_schema_mismatch",
      section: "purpose",
    });
    return blockedResult(context);
  }

  let dynamicProjection: OpenAIOutboundJsonValueV01 | typeof INVALID = INVALID;
  if (purpose === "observe_delta_compile") {
    dynamicProjection = buildObserveProjection(input, context);
  } else if (purpose === "planner_plan") {
    dynamicProjection = buildPlannerProjection(input, context);
  } else if (purpose === "temporal_interpretation") {
    dynamicProjection = buildTemporalProjection(input, context);
  }

  if (dynamicProjection === INVALID || context.issues.length > 0) {
    return blockedResult(context);
  }

  const dynamicText = JSON.stringify(dynamicProjection);
  const dynamicBytes = utf8Bytes(dynamicText);
  if (dynamicBytes > context.limits.max_dynamic_bytes) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section: "dynamic_payload",
      measured: dynamicBytes,
      maximum: context.limits.max_dynamic_bytes,
    });
  }

  const providerPayload = buildProviderPayload(purpose, readModel(input), dynamicText);
  const staticPayload = buildProviderPayload(purpose, readModel(input), "");
  const staticBytes = utf8Bytes(JSON.stringify(staticPayload));
  const finalRequestBytes = utf8Bytes(JSON.stringify(providerPayload));
  if (finalRequestBytes > context.limits.max_final_request_bytes) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section: "final_provider_request",
      measured: finalRequestBytes,
      maximum: context.limits.max_final_request_bytes,
    });
  }

  if (context.issues.length > 0) {
    return blockedResult(context, {
      static_bytes: staticBytes,
      dynamic_bytes: dynamicBytes,
      final_request_bytes: finalRequestBytes,
    });
  }

  return {
    status: "ready",
    purpose,
    provider_payload: providerPayload,
    audit: auditResult(context, {
      static_bytes: staticBytes,
      dynamic_bytes: dynamicBytes,
      final_request_bytes: finalRequestBytes,
    }),
  };
}

function buildObserveProjection(
  input: unknown,
  context: ValidationContextV01,
): OpenAIOutboundJsonValueV01 | typeof INVALID {
  const schema: SchemaV01 = {
    kind: "object",
    fields: {
      purpose: { kind: "enum", values: ["observe_delta_compile"] },
      model: modelSchema,
      scope: scopeSchema,
      message: { kind: "string", max_bytes: 32_768 },
      current_state: {
        kind: "array",
        max_items: OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.observe_delta_compile.max_state_items,
        source_items: true,
        items: observeStateEntrySchema,
      },
    },
  };
  const validated = validateSchema(input, schema, context, "observe", 0, 0);
  if (validated === INVALID || !isJsonRecord(validated)) return INVALID;
  if (!validateModelIdentifier(validated.model, context, "observe_model")) return INVALID;
  if (!validateScopeIdentifier(validated.scope, context, "observe_scope")) return INVALID;
  const currentState = validated.current_state;
  if (!Array.isArray(currentState)) return INVALID;
  if (!validateDuplicateIds(currentState, context, "observe_state")) return INVALID;
  if (!validateDuplicateField(currentState, "state_key", context, "observe_state_key")) {
    return INVALID;
  }
  return {
    scope: validated.scope as string,
    message: validated.message as string,
    current_state: currentState.map((item) => {
      const state = item as Record<string, OpenAIOutboundJsonValueV01>;
      return {
        state_key: state.state_key,
        value: state.value,
        temporal_scope: state.temporal_scope,
        stability: state.stability,
        change_type: state.change_type,
        valid_from: state.valid_from,
        valid_until: state.valid_until,
      };
    }),
  };
}

function buildPlannerProjection(
  input: unknown,
  context: ValidationContextV01,
): OpenAIOutboundJsonValueV01 | typeof INVALID {
  const stateBucketMaximum = Math.min(
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.planner_plan.max_state_bucket_items,
    context.limits.max_collection_items,
  );
  const tensionMaximum = Math.min(
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.planner_plan.max_tension_items,
    context.limits.max_collection_items,
  );
  const proposalMaximum = Math.min(
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.planner_plan.max_proposal_items,
    context.limits.max_collection_items,
  );
  const schema: SchemaV01 = {
    kind: "object",
    fields: {
      purpose: { kind: "enum", values: ["planner_plan"] },
      model: modelSchema,
      scope: scopeSchema,
      message: { kind: "string", max_bytes: 8_192 },
      state: {
        kind: "object",
        fields: {
          active: plannerStateArray(stateBucketMaximum),
          future: plannerStateArray(stateBucketMaximum),
          completed: plannerStateArray(stateBucketMaximum),
          deprecated: plannerStateArray(stateBucketMaximum),
        },
      },
      open_tensions: {
        kind: "array",
        items: plannerTensionSchema,
        max_items: tensionMaximum,
        source_items: true,
      },
      pending_proposals: {
        kind: "array",
        items: plannerProposalSchema,
        max_items: proposalMaximum,
        source_items: true,
      },
    },
  };
  const validated = validateSchema(input, schema, context, "planner", 0, 0);
  if (validated === INVALID || !isJsonRecord(validated)) return INVALID;
  if (!validateModelIdentifier(validated.model, context, "planner_model")) return INVALID;
  if (!validateScopeIdentifier(validated.scope, context, "planner_scope")) return INVALID;
  const state = validated.state;
  const tensions = validated.open_tensions;
  const proposals = validated.pending_proposals;
  if (!isJsonRecord(state) || !Array.isArray(tensions) || !Array.isArray(proposals)) {
    return INVALID;
  }
  const stateBuckets = ["active", "future", "completed", "deprecated"] as const;
  const allStates = stateBuckets.flatMap((key) =>
    Array.isArray(state[key]) ? (state[key] as OpenAIOutboundJsonValueV01[]) : [],
  );
  const stateLimit = Math.min(
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.planner_plan.max_state_items,
    context.limits.max_collection_items,
  );
  if (allStates.length > stateLimit) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section: "planner_state_total",
      measured: allStates.length,
      maximum: stateLimit,
    });
  }
  if (!validateDuplicateIds(allStates, context, "planner_state")) return INVALID;
  if (!validateDuplicateField(allStates, "state_key", context, "planner_state_key")) {
    return INVALID;
  }
  if (!validateDuplicateIds(tensions, context, "planner_tension")) return INVALID;
  if (!validateDuplicateIds(proposals, context, "planner_proposal")) return INVALID;
  if (context.issues.length > 0) return INVALID;
  return {
    message: validated.message as string,
    brief: {
      scope: validated.scope as string,
      active_state: state.active,
      future_state: state.future,
      completed_state: state.completed,
      deprecated_state: state.deprecated,
      open_tensions: tensions,
      pending_proposals: proposals,
    },
  };
}

function buildTemporalProjection(
  input: unknown,
  context: ValidationContextV01,
): OpenAIOutboundJsonValueV01 | typeof INVALID {
  const schema: SchemaV01 = {
    kind: "object",
    fields: {
      purpose: { kind: "enum", values: ["temporal_interpretation"] },
      model: modelSchema,
      context: temporalContextSchema,
    },
  };
  const validated = validateSchema(input, schema, context, "temporal", 0, 0);
  if (validated === INVALID || !isJsonRecord(validated)) return INVALID;
  if (!validateModelIdentifier(validated.model, context, "temporal_model")) return INVALID;
  if (
    !isJsonRecord(validated.context) ||
    !validateScopeIdentifier(
      validated.context.scope,
      context,
      "temporal_context_scope",
    )
  ) {
    return INVALID;
  }
  const temporalContext = validated.context;
  const temporalDuplicateChecks: Array<
    [OpenAIOutboundJsonValueV01 | undefined, string, string]
  > = [
    [temporalContext.evidence_anchors, "ref", "temporal_evidence_ref"],
    [temporalContext.summary_refs, "ref", "temporal_summary_ref"],
    [temporalContext.counterexamples, "ref", "temporal_counterexample_ref"],
    [temporalContext.residual_tensions, "ref", "temporal_tension_ref"],
    [
      temporalContext.active_context_admission_rationale,
      "context_ref",
      "temporal_admission_rationale_ref",
    ],
    [temporalContext.interpretive_drivers, "axis", "temporal_driver_axis"],
    [temporalContext.axis_pressures, "axis", "temporal_pressure_axis"],
  ];
  for (const [items, field, section] of temporalDuplicateChecks) {
    if (
      Array.isArray(items) &&
      !validateDuplicateField(items, field, context, section)
    ) {
      return INVALID;
    }
  }
  const admission = temporalContext.active_context_admission;
  if (
    isJsonRecord(admission) &&
    Array.isArray(admission.decisions) &&
    !validateDuplicateField(
      admission.decisions,
      "candidate_id",
      context,
      "temporal_admission_candidate",
    )
  ) {
    return INVALID;
  }
  return { context: temporalContext };
}

function validateModelIdentifier(
  value: OpenAIOutboundJsonValueV01 | undefined,
  context: ValidationContextV01,
  section: string,
) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
  ) {
    addIssue(context, {
      reason_code: "model_egress_payload_schema_mismatch",
      section,
    });
    return false;
  }
  return true;
}

function validateScopeIdentifier(
  value: OpenAIOutboundJsonValueV01 | undefined,
  context: ValidationContextV01,
  section: string,
) {
  if (
    typeof value !== "string" ||
    !/^[a-z][a-z0-9_-]*:[A-Za-z0-9._-]+$/.test(value)
  ) {
    addIssue(context, {
      reason_code: "model_egress_payload_schema_mismatch",
      section,
    });
    return false;
  }
  return true;
}

function validateSchema(
  value: unknown,
  schema: SchemaV01,
  context: ValidationContextV01,
  section: string,
  index: number,
  depth: number,
): OpenAIOutboundJsonValueV01 | typeof INVALID {
  context.total_nodes += 1;
  if (context.total_nodes > context.limits.max_total_nodes) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section: "total_nodes",
      measured: context.total_nodes,
      maximum: context.limits.max_total_nodes,
    });
    return INVALID;
  }
  if (depth > context.limits.max_depth) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section,
      index,
      measured: depth,
      maximum: context.limits.max_depth,
    });
    return INVALID;
  }

  if (schema.kind === "nullable") {
    return value === null
      ? null
      : validateSchema(value, schema.value, context, section, index, depth);
  }
  if (schema.kind === "null") {
    if (value === null) return null;
    return schemaMismatch(context, section, index);
  }
  if (schema.kind === "string") {
    return validateString(value, context, section, index, schema);
  }
  if (schema.kind === "enum") {
    const validated = validateString(value, context, section, index, {
      kind: "string",
    });
    if (validated === INVALID) return INVALID;
    if (!schema.values.includes(validated)) {
      return schemaMismatch(context, section, index);
    }
    return validated;
  }
  if (schema.kind === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      addIssue(context, {
        reason_code: "model_egress_payload_malformed",
        section,
        index,
      });
      return INVALID;
    }
    return value;
  }
  if (schema.kind === "boolean") {
    if (typeof value !== "boolean") return schemaMismatch(context, section, index);
    return value;
  }
  if (schema.kind === "state_value") {
    return validateStateValue(value, schema.scalar_only === true, context, section, index, depth);
  }
  if (schema.kind === "array") {
    if (!Array.isArray(value)) return schemaMismatch(context, section, index);
    if (context.ancestors.has(value)) return cycleFailure(context, section, index);
    const maximum = Math.min(schema.max_items, context.limits.max_collection_items);
    if (value.length > maximum) {
      addIssue(context, {
        reason_code: "model_egress_payload_oversize",
        section,
        index,
        measured: value.length,
        maximum,
      });
      return INVALID;
    }
    context.collection_items += value.length;
    context.ancestors.add(value);
    const output: OpenAIOutboundJsonValueV01[] = [];
    for (let itemIndex = 0; itemIndex < value.length; itemIndex += 1) {
      const item = validateSchema(
        value[itemIndex],
        schema.items,
        context,
        section,
        itemIndex,
        depth + 1,
      );
      if (item === INVALID) continue;
      if (schema.source_items) {
        const itemBytes = utf8Bytes(JSON.stringify(item));
        if (itemBytes > context.limits.max_source_item_bytes) {
          addIssue(context, {
            reason_code: "model_egress_payload_oversize",
            section,
            index: itemIndex,
            measured: itemBytes,
            maximum: context.limits.max_source_item_bytes,
          });
          continue;
        }
      }
      output.push(item);
    }
    context.ancestors.delete(value);
    return context.issues.length > 0 ? INVALID : output;
  }

  return validateObject(value, schema, context, section, index, depth);
}

function validateObject(
  value: unknown,
  schema: Extract<SchemaV01, { kind: "object" }>,
  context: ValidationContextV01,
  section: string,
  index: number,
  depth: number,
): OpenAIOutboundJsonValueV01 | typeof INVALID {
  if (!isPlainRecord(value)) return schemaMismatch(context, section, index);
  if (context.ancestors.has(value)) return cycleFailure(context, section, index);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key === "symbol")) {
    addIssue(context, {
      reason_code: "model_egress_payload_malformed",
      section,
      index,
    });
    return INVALID;
  }
  const keys = ownKeys as string[];
  if (keys.length > context.limits.max_keys_per_object) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section,
      index,
      measured: keys.length,
      maximum: context.limits.max_keys_per_object,
    });
    return INVALID;
  }
  context.total_keys += keys.length;
  if (context.total_keys > context.limits.max_total_keys) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section: "total_keys",
      measured: context.total_keys,
      maximum: context.limits.max_total_keys,
    });
    return INVALID;
  }
  const allowed = new Set([
    ...Object.keys(schema.fields),
    ...Object.keys(schema.ignored_fields ?? {}),
  ]);
  const unknownKeys = keys.filter((key) => !allowed.has(key)).sort(asciiCompare);
  if (unknownKeys.length > 0) {
    addIssue(context, {
      reason_code: "model_egress_payload_schema_mismatch",
      section,
      index,
      measured: unknownKeys.length,
      maximum: 0,
    });
    return INVALID;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (keys.some((key) => !descriptors[key] || descriptors[key]?.get || descriptors[key]?.set)) {
    addIssue(context, {
      reason_code: "model_egress_payload_malformed",
      section,
      index,
    });
    return INVALID;
  }
  const optional = new Set(schema.optional ?? []);
  const missing = Object.keys(schema.fields).filter(
    (key) => !optional.has(key) && !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (missing.length > 0) {
    addIssue(context, {
      reason_code: "model_egress_payload_schema_mismatch",
      section,
      index,
      measured: missing.length,
      maximum: 0,
    });
    return INVALID;
  }

  context.ancestors.add(value);
  const output: Record<string, OpenAIOutboundJsonValueV01> = {};
  for (const key of Object.keys(schema.fields).sort(asciiCompare)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    const child = validateSchema(
      descriptors[key]!.value,
      schema.fields[key]!,
      context,
      section,
      index,
      depth + 1,
    );
    if (child !== INVALID) output[key] = child;
  }
  for (const key of Object.keys(schema.ignored_fields ?? {}).sort(asciiCompare)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    validateSchema(
      descriptors[key]!.value,
      schema.ignored_fields![key]!,
      context,
      section,
      index,
      depth + 1,
    );
  }
  context.ancestors.delete(value);
  return context.issues.length > 0 ? INVALID : output;
}

function validateStateValue(
  value: unknown,
  scalarOnly: boolean,
  context: ValidationContextV01,
  section: string,
  index: number,
  depth: number,
): OpenAIOutboundJsonValueV01 | typeof INVALID {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      addIssue(context, {
        reason_code: "model_egress_payload_malformed",
        section,
        index,
      });
      return INVALID;
    }
    return value;
  }
  if (typeof value === "string") {
    return validateString(value, context, section, index, {
      kind: "string",
      allow_empty: true,
      max_bytes: Math.min(4_096, context.limits.max_string_bytes),
    });
  }
  if (scalarOnly) return schemaMismatch(context, section, index);
  if (Array.isArray(value)) {
    return validateSchema(
      value,
      {
        kind: "array",
        items: { kind: "state_value" },
        max_items: context.limits.max_collection_items,
      },
      context,
      section,
      index,
      depth,
    );
  }
  if (!isPlainRecord(value)) {
    addIssue(context, {
      reason_code: "model_egress_payload_malformed",
      section,
      index,
    });
    return INVALID;
  }
  const fields: Record<string, SchemaV01> = {};
  for (const key of Object.keys(value).sort(asciiCompare)) {
    if (isUnsafeFieldName(key)) {
      addIssue(context, {
        reason_code: "model_egress_payload_unsafe",
        section,
        index,
      });
      return INVALID;
    }
    fields[key] = { kind: "state_value" };
  }
  return validateObject(value, { kind: "object", fields }, context, section, index, depth);
}

function validateString(
  value: unknown,
  context: ValidationContextV01,
  section: string,
  index: number,
  schema: Extract<SchemaV01, { kind: "string" }>,
): string | typeof INVALID {
  if (typeof value !== "string") {
    if (
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
    ) {
      addIssue(context, {
        reason_code: "model_egress_payload_malformed",
        section,
        index,
      });
      return INVALID;
    }
    return schemaMismatch(context, section, index);
  }
  if (schema.allow_empty !== true && value.length === 0) {
    return schemaMismatch(context, section, index);
  }
  const maximum = Math.min(
    schema.max_bytes ?? context.limits.max_string_bytes,
    context.limits.max_string_bytes,
  );
  const bytes = utf8Bytes(value);
  if (bytes > maximum) {
    addIssue(context, {
      reason_code: "model_egress_payload_oversize",
      section,
      index,
      measured: bytes,
      maximum,
    });
    return INVALID;
  }
  if (containsUnsafeMaterial(value)) {
    addIssue(context, {
      reason_code: "model_egress_payload_unsafe",
      section,
      index,
    });
    return INVALID;
  }
  return value;
}

function validateDuplicateIds(
  items: OpenAIOutboundJsonValueV01[],
  context: ValidationContextV01,
  section: string,
) {
  return validateDuplicateField(items, "id", context, section);
}

function validateDuplicateField(
  items: OpenAIOutboundJsonValueV01[],
  field: string,
  context: ValidationContextV01,
  section: string,
) {
  const byId = new Map<string, string>();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!isJsonRecord(item) || typeof item[field] !== "string") continue;
    const canonical = JSON.stringify(item);
    const semanticId = item[field] as string;
    const prior = byId.get(semanticId);
    if (prior !== undefined) {
      addIssue(context, {
        reason_code: "model_egress_payload_schema_mismatch",
        section,
        index,
        measured: prior === canonical ? 1 : 2,
        maximum: 0,
      });
    } else {
      byId.set(semanticId, canonical);
    }
  }
  return context.issues.length === 0;
}

function buildProviderPayload(
  purpose: OpenAIOutboundPayloadPurposeV01,
  model: string,
  dynamicText: string,
): OpenAIResponsesProviderPayloadV01 {
  const contract = STATIC_CONTRACTS[purpose];
  return {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: contract.system_text }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: dynamicText }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: contract.response_name,
        strict: true,
        schema: structuredClone(contract.response_schema),
      },
    },
  };
}

function blockedResult(
  context: ValidationContextV01,
  measurements?: Partial<
    Pick<
      OpenAIOutboundPayloadAuditV01,
      "static_bytes" | "dynamic_bytes" | "final_request_bytes"
    >
  >,
): OpenAIOutboundPayloadBlockedV01 {
  const issues = [...context.issues]
    .sort(compareIssues)
    .slice(0, context.limits.max_issues);
  const reasonCodes = Array.from(new Set(issues.map((issue) => issue.reason_code))).sort(
    asciiCompare,
  );
  return {
    status: "blocked",
    purpose: context.purpose,
    reason_codes: reasonCodes,
    issues,
    audit: auditResult(context, measurements),
    credential_material_included: false,
    private_material_included: false,
    provider_call_allowed_by_boundary: false,
  };
}

function auditResult(
  context: ValidationContextV01,
  measurements?: Partial<
    Pick<
      OpenAIOutboundPayloadAuditV01,
      "static_bytes" | "dynamic_bytes" | "final_request_bytes"
    >
  >,
): OpenAIOutboundPayloadAuditV01 {
  return {
    policy_version: OPENAI_OUTBOUND_PAYLOAD_POLICY_VERSION_V01,
    purpose: context.purpose,
    static_bytes: measurements?.static_bytes ?? 0,
    dynamic_bytes: measurements?.dynamic_bytes ?? 0,
    final_request_bytes: measurements?.final_request_bytes ?? 0,
    total_nodes: context.total_nodes,
    total_keys: context.total_keys,
    collection_items: context.collection_items,
    limits: { ...context.limits },
  };
}

function addIssue(
  context: ValidationContextV01,
  issue: Omit<OpenAIOutboundPayloadIssueV01, "purpose">,
) {
  if (context.issues.length >= context.limits.max_issues) return;
  context.issues.push({ ...issue, purpose: context.purpose });
}

function schemaMismatch(
  context: ValidationContextV01,
  section: string,
  index: number,
): typeof INVALID {
  addIssue(context, {
    reason_code: "model_egress_payload_schema_mismatch",
    section,
    index,
  });
  return INVALID;
}

function cycleFailure(
  context: ValidationContextV01,
  section: string,
  index: number,
): typeof INVALID {
  addIssue(context, {
    reason_code: "model_egress_payload_malformed",
    section,
    index,
  });
  return INVALID;
}

function readPurpose(
  input: unknown,
): OpenAIOutboundPayloadPurposeV01 | "unsupported" {
  if (!isPlainRecord(input)) return "unsupported";
  const descriptor = Object.getOwnPropertyDescriptor(input, "purpose");
  if (!descriptor || descriptor.get || descriptor.set) return "unsupported";
  const purpose = descriptor.value;
  return typeof purpose === "string" &&
    OPENAI_OUTBOUND_PAYLOAD_PURPOSES_V01.includes(
      purpose as OpenAIOutboundPayloadPurposeV01,
    )
    ? (purpose as OpenAIOutboundPayloadPurposeV01)
    : "unsupported";
}

function readModel(input: unknown) {
  if (!isPlainRecord(input)) return "";
  const descriptor = Object.getOwnPropertyDescriptor(input, "model");
  return descriptor && !descriptor.get && !descriptor.set && typeof descriptor.value === "string"
    ? descriptor.value
    : "";
}

function limitsForPurpose(
  purpose: OpenAIOutboundPayloadPurposeV01 | "unsupported",
): EffectiveLimitsV01 {
  const common = OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.common;
  const selected =
    purpose === "unsupported"
      ? OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.temporal_interpretation
      : OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01[purpose];
  return {
    max_depth: common.max_depth,
    max_keys_per_object: common.max_keys_per_object,
    max_total_keys: common.max_total_keys,
    max_total_nodes: common.max_total_nodes,
    max_source_item_bytes: common.max_source_item_bytes,
    max_issues: common.max_issues,
    max_string_bytes: selected.max_string_bytes,
    max_collection_items: selected.max_collection_items,
    max_dynamic_bytes: selected.max_dynamic_bytes,
    max_final_request_bytes: selected.max_final_request_bytes,
  };
}

function applyLowerOnlyTestLimits(
  production: EffectiveLimitsV01,
  overrides: OpenAIOutboundTestLimitsV01 | undefined,
) {
  if (!overrides) return { limits: { ...production }, invalid: false };
  const limits = { ...production };
  let invalid = false;
  for (const key of Object.keys(overrides).sort(asciiCompare) as Array<
    keyof EffectiveLimitsV01
  >) {
    const value = overrides[key];
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > production[key]
    ) {
      invalid = true;
      continue;
    }
    limits[key] = value;
  }
  return { limits, invalid };
}

function containsUnsafeMaterial(value: string) {
  if (
    /(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY)\s*=/i.test(
      value,
    ) ||
    /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,}|xox[baprs]-[A-Za-z0-9-]{8,}|AKIA[A-Z0-9]{12,})\b/.test(
      value,
    ) ||
    /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/i.test(value) ||
    /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/.test(
      value,
    ) ||
    /BEGIN (?:OPENSSH |RSA |EC |)PRIVATE KEY/i.test(value) ||
    /\b(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|cookie|session[_ -]?token|nonce|credential|secret)\s*[:=]\s*\S{6,}/i.test(
      value,
    )
  ) {
    return true;
  }
  if (
    /(?:^|[\s"'(])(?:file:\/\/|~\/|[A-Za-z]:[\\/]|[A-Za-z]:[^\s\\/][^\s]*|\\\\[^\s\\]+\\[^\s]+)/i.test(
      value,
    ) ||
    containsPrivateAbsolutePath(value)
  ) {
    return true;
  }
  if (
    /\b(?:raw prompt|actual prompt|raw transcript|conversation transcript|hidden reasoning|chain of thought|reasoning trace|terminal dump|raw terminal log|environment dump|raw environment|raw request body|raw response body)\s*[:=]/i.test(
      value,
    ) ||
    /(?:^|\n)\s*(?:User|Assistant|System)\s*:\s*.+(?:\n|$)/i.test(value)
  ) {
    return true;
  }
  return containsPrivateUrl(value) || containsProviderEndpointOverride(value);
}

function containsPrivateUrl(value: string) {
  const matches = value.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
  return matches.some((candidate) => {
    try {
      const url = new URL(candidate);
      const host = url.hostname.toLowerCase();
      if (url.username || url.password) return true;
      if (
        host === "localhost" ||
        host === "0.0.0.0" ||
        host === "::1" ||
        host === "[::1]" ||
        host === "::" ||
        host === "[::]" ||
        host.endsWith(".local") ||
        host.endsWith(".localhost") ||
        host.endsWith(".internal") ||
        host.endsWith(".corp") ||
        host.endsWith(".lan") ||
        !host.includes(".")
      ) {
        return true;
      }
      if (
        /^10\./.test(host) ||
        /^127\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^\[?(?:fc|fd|fe[89ab])[0-9a-f:]*\]?$/i.test(host)
      ) {
        return true;
      }
      const match172 = /^172\.(\d{1,3})\./.exec(host);
      return Boolean(match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31);
    } catch {
      return true;
    }
  });
}

function containsPrivateAbsolutePath(value: string) {
  const candidates = Array.from(
    value.matchAll(/(?:^|[\s"'(])(\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*)/g),
    (match) => match[1]!,
  );
  const reviewedPublicRoutes = new Set([
    "/api/observe",
    "/api/plan",
    "/api/temporal-interpretation/preview",
  ]);
  return candidates.some((candidate) => !reviewedPublicRoutes.has(candidate));
}

function containsProviderEndpointOverride(value: string) {
  return /https?:\/\/(?:api\.openai\.com|api\.anthropic\.com|[^\s/]+\.googleapis\.com)\//i.test(
    value,
  );
}

function isUnsafeFieldName(value: string) {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
  return (
    /^(?:raw_)?(?:prompt|prompt_text|system_prompt|system_message|developer_message|messages|transcript|chat_history|conversation|conversation_history|reasoning|thinking|thoughts|cot|hidden_reasoning|chain_of_thought|reasoning_trace|terminal_dump|terminal_log|stdout|stderr|environment|environment_dump|env_dump|private_key|api_key|access_token|refresh_token|auth_token|token|password|authorization|credentials|secret|secret_value|secret_payload|client_secret|cookie|session_token|nonce|endpoint|endpoint_url|base_url|model|model_id|model_identifier|instructions|tools|tool_choice|parallel_tool_calls|functions|function_call|response_format|temperature|top_p|max_tokens|max_output_tokens|stop|seed|reasoning_effort|service_tier)$/.test(
      normalized,
    ) ||
    /(?:^|_)(?:api_key|access_token|refresh_token|auth_token|token|private_key|client_secret|secret|password|authorization|credentials|cookie|session_token|nonce)$/.test(
      normalized,
    )
  );
}

function compareIssues(
  left: OpenAIOutboundPayloadIssueV01,
  right: OpenAIOutboundPayloadIssueV01,
) {
  return (
    asciiCompare(left.reason_code, right.reason_code) ||
    asciiCompare(left.section, right.section) ||
    (left.index ?? -1) - (right.index ?? -1) ||
    (left.measured ?? -1) - (right.measured ?? -1) ||
    (left.maximum ?? -1) - (right.maximum ?? -1)
  );
}

function asciiCompare(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function utf8Bytes(value: string) {
  return Buffer.byteLength(value, "utf8");
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isJsonRecord(
  value: unknown,
): value is Record<string, OpenAIOutboundJsonValueV01> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const modelSchema: SchemaV01 = { kind: "string", max_bytes: 128 };
const scopeSchema: SchemaV01 = { kind: "string", max_bytes: 160 };
const nullableStringSchema: SchemaV01 = {
  kind: "nullable",
  value: { kind: "string", allow_empty: true, max_bytes: 1_024 },
};

const ignoredNullableIdentifierSchema: SchemaV01 = {
  kind: "nullable",
  value: { kind: "string", max_bytes: 512 },
};
const ignoredTimestampSchema: SchemaV01 = { kind: "string", max_bytes: 128 };
const stateEntryIgnoredFields: Record<string, SchemaV01> = {
  source_agent_id: ignoredNullableIdentifierSchema,
  source_session_id: ignoredNullableIdentifierSchema,
  source_transition_id: ignoredNullableIdentifierSchema,
  created_at: ignoredTimestampSchema,
  updated_at: ignoredTimestampSchema,
};

const observeStateEntrySchema: SchemaV01 = {
  kind: "object",
  fields: {
    id: { kind: "string", max_bytes: 256 },
    scope: scopeSchema,
    state_key: { kind: "string", max_bytes: 512 },
    value: { kind: "state_value", scalar_only: true },
    temporal_scope: { kind: "string", max_bytes: 128 },
    valid_from: nullableStringSchema,
    valid_until: nullableStringSchema,
    stability: { kind: "string", max_bytes: 128 },
    change_type: { kind: "string", max_bytes: 128 },
  },
  ignored_fields: stateEntryIgnoredFields,
};

const plannerStateEntrySchema: SchemaV01 = {
  kind: "object",
  fields: {
    id: { kind: "string", max_bytes: 256 },
    state_key: { kind: "string", max_bytes: 512 },
    value: { kind: "state_value" },
    temporal_scope: { kind: "string", max_bytes: 128 },
    valid_from: nullableStringSchema,
    valid_until: nullableStringSchema,
    stability: { kind: "string", max_bytes: 128 },
    change_type: { kind: "string", max_bytes: 128 },
  },
  ignored_fields: { scope: scopeSchema, ...stateEntryIgnoredFields },
};

function plannerStateArray(maxItems: number): SchemaV01 {
  return {
    kind: "array",
    items: plannerStateEntrySchema,
    max_items: maxItems,
    source_items: true,
  };
}

const plannerTensionSchema: SchemaV01 = {
  kind: "object",
  fields: {
    id: { kind: "string", max_bytes: 256 },
    state_key: nullableStringSchema,
    title: { kind: "string", max_bytes: 1_024 },
    description: { kind: "string", max_bytes: 4_096 },
    status: { kind: "string", max_bytes: 128 },
    severity: { kind: "string", max_bytes: 128 },
  },
  ignored_fields: {
    scope: scopeSchema,
    source_agent_id: ignoredNullableIdentifierSchema,
    source_session_id: ignoredNullableIdentifierSchema,
    created_at: ignoredTimestampSchema,
    resolved_at: { kind: "nullable", value: ignoredTimestampSchema },
  },
};

const plannerProposalSchema: SchemaV01 = {
  kind: "object",
  fields: {
    id: { kind: "string", max_bytes: 256 },
    state_key: { kind: "string", max_bytes: 512 },
    before_value: { kind: "state_value" },
    after_value: { kind: "state_value" },
    operation: { kind: "string", max_bytes: 128 },
    temporal_scope: { kind: "string", max_bytes: 128 },
    valid_from: nullableStringSchema,
    valid_until: nullableStringSchema,
    stability: { kind: "string", max_bytes: 128 },
    change_type: { kind: "string", max_bytes: 128 },
    reason: nullableStringSchema,
    status: { kind: "enum", values: ["pending", "committed", "rejected"] },
  },
  ignored_fields: {
    scope: scopeSchema,
    source_agent_id: ignoredNullableIdentifierSchema,
    source_session_id: ignoredNullableIdentifierSchema,
    proposed_at: ignoredTimestampSchema,
    decided_at: { kind: "nullable", value: ignoredTimestampSchema },
    prediction_error_score: { kind: "number" },
    salience_score: { kind: "number" },
    evidence_score: { kind: "number" },
    conflict_score: { kind: "number" },
    self_impact_score: { kind: "number" },
    consolidation_status: { kind: "string", max_bytes: 128 },
    reinforcement_count: { kind: "number" },
    expires_at: { kind: "nullable", value: ignoredTimestampSchema },
    last_evaluated_at: { kind: "nullable", value: ignoredTimestampSchema },
    scoring_version: { kind: "string", max_bytes: 256 },
    scoring_reason: nullableStringSchema,
    score_breakdown: { kind: "state_value" },
  },
};

const temporalString = (maxBytes = 4_096): SchemaV01 => ({
  kind: "string",
  max_bytes: maxBytes,
});
const temporalStringArray = (maxItems: number): SchemaV01 => ({
  kind: "array",
  max_items: maxItems,
  items: temporalString(),
});

const temporalContextSchema: SchemaV01 = {
  kind: "object",
  fields: {
    scope: scopeSchema,
    as_of: temporalString(128),
    current_interpretation: temporalString(),
    active_prior_context: temporalString(),
    evidence_anchors: objectArray(
      8,
      {
        ref: temporalString(512),
        claim: temporalString(),
        source_type: {
          kind: "enum",
          values: ["committed_state", "action_record", "work_trace", "doc"],
        },
      },
    ),
    summary_refs: objectArray(2, {
      ref: temporalString(512),
      summary: temporalString(),
    }),
    source_authority_profile: {
      kind: "object",
      fields: {
        committed_state_authority: temporalStringArray(8),
        summary_only_refs: temporalStringArray(2),
        allowed_now: temporalStringArray(3),
        blocked_now: temporalStringArray(4),
      },
    },
    counterexamples: objectArray(3, {
      ref: temporalString(512),
      description: temporalString(),
    }),
    residual_tensions: objectArray(4, {
      ref: temporalString(512),
      description: temporalString(),
    }),
    user_preferences: temporalStringArray(2),
    safe_next_step: temporalString(),
    non_authority_boundary: temporalString(),
    active_context_admission_rationale: objectArray(4, {
      context_ref: temporalString(512),
          admission_role: { kind: "enum", values: ACTIVE_CONTEXT_ADMISSION_ROLES_V01 },
      why_admitted: temporalString(),
      why_not_merely_summary: temporalString(),
    }),
    active_context_admission: {
      kind: "object",
      fields: {
        decisions: objectArray(10, {
          candidate_id: temporalString(512),
          category: { kind: "enum", values: ACTIVE_CONTEXT_ADMISSION_CATEGORIES_V01 },
          reason: temporalString(),
          source_authority: temporalString(512),
          evidence_refs: temporalStringArray(1),
          counterexample_refs: temporalStringArray(3),
          residual_tension_refs: temporalStringArray(1),
        }),
        note: temporalString(),
      },
    },
    suppressed_alternatives: objectArray(3, {
      alternative: temporalString(),
      why_deferred: temporalString(),
      what_would_change_status: temporalString(),
      status: { kind: "enum", values: SUPPRESSED_ALTERNATIVE_STATUSES_V01 },
    }),
    temporal_hierarchy_view: {
      kind: "object",
      fields: {
        raw_observation_level: temporalString(),
        work_or_session_level: temporalString(),
        project_status_level: temporalString(),
        current_interpretive_stance: temporalString(),
        hierarchy_caution: temporalString(),
      },
    },
    memory_lifecycle_view: {
      kind: "object",
      fields: {
        active_context: temporalStringArray(5),
        retrieved_context: temporalStringArray(3),
        summary_or_view: temporalStringArray(2),
        stale_or_deferred_context: temporalStringArray(5),
        lifecycle_caution: temporalString(),
      },
    },
    interpretive_drivers: objectArray(4, {
      axis: { kind: "enum", values: TEMPORAL_INTERPRETATION_AXES_V01 },
      driver: temporalString(),
      effect: temporalString(),
    }),
    axis_pressures: objectArray(4, {
      axis: { kind: "enum", values: TEMPORAL_INTERPRETATION_AXES_V01 },
      pressure: { kind: "enum", values: AXIS_PRESSURE_LABELS_V01 },
      reason: temporalString(),
    }),
  },
};

function objectArray(
  maxItems: number,
  fields: Record<string, SchemaV01>,
): SchemaV01 {
  return {
    kind: "array",
    max_items: maxItems,
    source_items: true,
    items: { kind: "object", fields },
  };
}

const observeSystemText = [
  "You are the Augnes temporal delta compiler.",
  "The model proposes typed temporal state delta proposals. The runtime owns state.",
  "Never mark proposals committed, accepted, or rejected.",
  "Do not output numeric scores, consolidation status, scoring reasons, or score breakdowns.",
  "Infer only state deltas supported by the message and current committed state.",
  "Prefer dot-separated state_key names like product.name or security.no_api_keys_in_repo.",
  "Use null before_value when no committed state exists for the key.",
  "temporal_scope must be one of: current_session, current_task, current_project, until_deadline, future_phase, historical_note, global_preference.",
  "stability must be one of: temporary, tentative, active, stable, deprecated, completed.",
  "change_type must be one of: new_state, refinement, override, reversal, completion, deprecation, future_intent.",
  "operation must be one of: set, update, deprecate, complete, supersede.",
].join("\n");

const plannerSystemText = [
  "You are the Augnes state-grounded planner.",
  "Recommend next actions from committed temporal state only.",
  "Pending proposals are suggestions, not committed truth.",
  "Prefer local tools when they directly satisfy demo readiness.",
].join("\n");

const temporalSystemText = [
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

const scalarOrNullSchema = {
  anyOf: [
    { type: "string" },
    { type: "number" },
    { type: "boolean" },
    { type: "null" },
  ],
};
const nullableDateResponseSchema = {
  anyOf: [{ type: "string" }, { type: "null" }],
};
const responseStringArraySchema = { type: "array", items: { type: "string" } };

const observeResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    proposals: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          state_key: { type: "string" },
          before_value: scalarOrNullSchema,
          after_value: scalarOrNullSchema,
          operation: {
            type: "string",
            enum: ["set", "update", "deprecate", "complete", "supersede"],
          },
          temporal_scope: {
            type: "string",
            enum: [
              "current_session",
              "current_task",
              "current_project",
              "until_deadline",
              "future_phase",
              "historical_note",
              "global_preference",
            ],
          },
          valid_from: nullableDateResponseSchema,
          valid_until: nullableDateResponseSchema,
          stability: {
            type: "string",
            enum: ["temporary", "tentative", "active", "stable", "deprecated", "completed"],
          },
          change_type: {
            type: "string",
            enum: [
              "new_state",
              "refinement",
              "override",
              "reversal",
              "completion",
              "deprecation",
              "future_intent",
            ],
          },
          reason: { type: "string" },
        },
        required: [
          "state_key",
          "before_value",
          "after_value",
          "operation",
          "temporal_scope",
          "valid_from",
          "valid_until",
          "stability",
          "change_type",
          "reason",
        ],
      },
    },
  },
  required: ["proposals"],
};

const plannerResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    recommendations: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          tool_name: {
            anyOf: [
              {
                type: "string",
                enum: [
                  "create_readme_checklist",
                  "create_security_checklist",
                  "create_demo_script",
                ],
              },
              { type: "null" },
            ],
          },
          priority: { type: "string", enum: ["now", "next", "later"] },
          grounded_state_keys: responseStringArraySchema,
        },
        required: ["title", "rationale", "tool_name", "priority", "grounded_state_keys"],
      },
    },
  },
  required: ["recommendations"],
};

const temporalResponseSchema = buildTemporalResponseSchema();

const STATIC_CONTRACTS: Record<
  OpenAIOutboundPayloadPurposeV01,
  { system_text: string; response_name: string; response_schema: Record<string, unknown> }
> = {
  observe_delta_compile: {
    system_text: observeSystemText,
    response_name: "temporal_delta_proposals",
    response_schema: observeResponseSchema,
  },
  planner_plan: {
    system_text: plannerSystemText,
    response_name: "augnes_plan",
    response_schema: plannerResponseSchema,
  },
  temporal_interpretation: {
    system_text: temporalSystemText,
    response_name: "temporal_interpretation_preview",
    response_schema: temporalResponseSchema,
  },
};

function buildTemporalResponseSchema(): Record<string, unknown> {
  const refDescription = {
    type: "object",
    additionalProperties: false,
    properties: { ref: { type: "string" }, description: { type: "string" } },
    required: ["ref", "description"],
  };
  const rationale = {
    type: "object",
    additionalProperties: false,
    properties: {
      context_ref: { type: "string" },
      admission_role: { type: "string", enum: ACTIVE_CONTEXT_ADMISSION_ROLES_V01 },
      why_admitted: { type: "string" },
      why_not_merely_summary: { type: "string" },
    },
    required: ["context_ref", "admission_role", "why_admitted", "why_not_merely_summary"],
  };
  const admissionDecision = {
    type: "object",
    additionalProperties: false,
    properties: {
      candidate_id: { type: "string" },
      category: { type: "string", enum: ACTIVE_CONTEXT_ADMISSION_CATEGORIES_V01 },
      reason: { type: "string" },
      source_authority: { type: "string" },
      evidence_refs: responseStringArraySchema,
      counterexample_refs: responseStringArraySchema,
      residual_tension_refs: responseStringArraySchema,
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
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      current_interpretation: { type: "string" },
      active_prior_context: { type: "string" },
      evidence_anchors: {
        type: "array",
        items: {
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
        },
      },
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
          committed_state_authority: responseStringArraySchema,
          summary_only_refs: responseStringArraySchema,
          allowed_now: responseStringArraySchema,
          blocked_now: responseStringArraySchema,
        },
        required: [
          "committed_state_authority",
          "summary_only_refs",
          "allowed_now",
          "blocked_now",
        ],
      },
      counterexamples: { type: "array", items: refDescription },
      residual_tensions: { type: "array", items: refDescription },
      transition_relation: { type: "string", enum: TRANSITION_RELATIONS_V01 },
      revision_explanation: { type: "string" },
      user_context_vs_factuality: { type: "string" },
      active_context_admission_rationale: { type: "array", items: rationale },
      active_context_admission: {
        type: "object",
        additionalProperties: false,
        properties: {
          decisions: { type: "array", items: admissionDecision },
          note: { type: "string" },
        },
        required: ["decisions", "note"],
      },
      suppressed_alternatives: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            alternative: { type: "string" },
            why_deferred: { type: "string" },
            what_would_change_status: { type: "string" },
            status: { type: "string", enum: SUPPRESSED_ALTERNATIVE_STATUSES_V01 },
          },
          required: ["alternative", "why_deferred", "what_would_change_status", "status"],
        },
      },
      temporal_hierarchy_view: responseObjectSchema([
        "raw_observation_level",
        "work_or_session_level",
        "project_status_level",
        "current_interpretive_stance",
        "hierarchy_caution",
      ]),
      memory_lifecycle_view: {
        type: "object",
        additionalProperties: false,
        properties: {
          active_context: responseStringArraySchema,
          retrieved_context: responseStringArraySchema,
          summary_or_view: responseStringArraySchema,
          stale_or_deferred_context: responseStringArraySchema,
          lifecycle_caution: { type: "string" },
        },
        required: [
          "active_context",
          "retrieved_context",
          "summary_or_view",
          "stale_or_deferred_context",
          "lifecycle_caution",
        ],
      },
      interpretive_drivers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            axis: { type: "string", enum: TEMPORAL_INTERPRETATION_AXES_V01 },
            driver: { type: "string" },
            effect: { type: "string" },
          },
          required: ["axis", "driver", "effect"],
        },
      },
      axis_pressures: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            axis: { type: "string", enum: TEMPORAL_INTERPRETATION_AXES_V01 },
            pressure: { type: "string", enum: AXIS_PRESSURE_LABELS_V01 },
            reason: { type: "string" },
          },
          required: ["axis", "pressure", "reason"],
        },
      },
      safe_next_step: { type: "string" },
      non_authority_boundary: { type: "string" },
      warnings: responseStringArraySchema,
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
}

function responseObjectSchema(keys: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(keys.map((key) => [key, { type: "string" }])),
    required: keys,
  };
}

function deepFreezePolicyV01<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) {
    deepFreezePolicyV01(child);
  }
  return Object.freeze(value);
}
