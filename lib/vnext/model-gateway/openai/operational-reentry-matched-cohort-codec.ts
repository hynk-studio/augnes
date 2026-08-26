import {
  refuseModelEgress,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import type { OperationalReentryMatchedCohortModelInvocationEnvelopeV01 } from "@/lib/vnext/model-gateway/contracts";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02,
  type OperationalReentryMatchedCohortModelInputV01,
  type OperationalReentryMatchedCohortModelOutputV01,
} from "@/types/vnext/operational-reentry-matched-cohort";

const PURPOSE = "operational_reentry_matched_cohort" as const;
const SAFE_TOKEN = /^[A-Za-z0-9:._-]{1,160}$/u;

export const OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01 =
  Object.freeze({
    dynamicBytes: 8_192,
    finalRequestBytes: 12_288,
    responseBytes: 4_096,
    maxOutputTokens: 256,
    timeoutMs: 30_000,
    contextItems: 4,
    arrayItems: 12,
  });

export function validateOperationalReentryMatchedCohortModelInputV01(
  value: unknown,
): OperationalReentryMatchedCohortModelInputV01 {
  if (!isRecord(value)) malformedV01();
  exactKeysV01(value, [
    "input_kind",
    "codec_version",
    "invocation_context",
    "task",
    "context_material",
    "target_context_token",
    "stale_relation",
    "allowed_output",
    "authority_notice",
  ]);
  if (
    value.input_kind !== PURPOSE ||
    (value.codec_version !== OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V01 &&
      value.codec_version !== OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V02)
  ) malformedV01();
  validateInvocationContextV01(value.invocation_context);
  validateTaskV01(value.task);
  const context = validateContextV01(value.context_material);
  const target = value.target_context_token;
  if (target !== null && (!safeTokenV01(target) || !context.has(target))) malformedV01();
  validateStaleRelationV01(value.stale_relation, target);
  validateAllowedOutputV01(value.allowed_output, context, target, value.stale_relation !== null);
  validateAuthorityNoticeV01(value.authority_notice);
  return structuredClone(value) as unknown as OperationalReentryMatchedCohortModelInputV01;
}

export function projectOperationalReentryMatchedCohortModelMaterialV01(
  input: { canonical_project_id: string } &
    OperationalReentryMatchedCohortModelInvocationEnvelopeV01["input"],
) {
  const { canonical_project_id: _authorizationProjectId, ...candidate } = input;
  const validated = validateOperationalReentryMatchedCohortModelInputV01(candidate);
  const material = {
    invocation_context: validated.invocation_context,
    task: validated.task,
    context_material: validated.context_material,
    target_context_token: validated.target_context_token,
    stale_relation: validated.stale_relation,
    allowed_output: validated.allowed_output,
    authority_notice: validated.authority_notice,
  };
  serializeModelEgressJson(
    PURPOSE,
    material,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.dynamicBytes,
  );
  return material;
}

export function buildOperationalReentryMatchedCohortSystemPromptV01(): string {
  return [
    "Review only the supplied synthetic public-safe task and context material.",
    "Return only the strict JSON object. Do not return prose, rationale, hidden reasoning, commands, paths, or invented identifiers.",
    "Use only tokens present in allowed_output and reference only supplied context tokens.",
    "A missing target cannot be referenced or represented in target-linked structured output.",
    "When a stale relation is supplied, withheld_stale is valid only without target references or target-linked structured output; stale_persisted requires observable target persistence.",
    "The output is non-authoritative research material. It creates no execution, Decision, Transition, policy, product mutation, or publication authority.",
  ].join("\n");
}

export function operationalReentryMatchedCohortResponseSchemaV01(
  input: OperationalReentryMatchedCohortModelInputV01,
) {
  // Historical v0.1 projection retained only for artifact compatibility and
  // local refusal coverage. The live adapter never selects this schema.
  const array = (values: string[]) => ({
    type: "array" as const,
    maxItems: values.length,
    uniqueItems: true,
    items: values.length > 0
      ? { type: "string" as const, enum: [...values] }
      : { type: "string" as const, enum: ["__no_value_allowed__"] },
  });
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "result_token",
      "referenced_context_tokens",
      "required_check_dispositions",
      "operation_action_class_tokens",
      "blocker_warning_gap_tokens",
      "result_limitation_tokens",
      "target_disposition",
      "abstention",
    ],
    properties: {
      result_token: { type: "string", enum: [...input.allowed_output.result_tokens] },
      referenced_context_tokens: array(input.allowed_output.referenced_context_tokens),
      required_check_dispositions: array(
        input.allowed_output.required_check_disposition_tokens,
      ),
      operation_action_class_tokens: array(
        input.allowed_output.operation_action_class_tokens,
      ),
      blocker_warning_gap_tokens: array(
        input.allowed_output.blocker_warning_gap_tokens,
      ),
      result_limitation_tokens: array(
        input.allowed_output.result_limitation_tokens,
      ),
      target_disposition: {
        type: "string",
        enum: [...input.allowed_output.target_dispositions],
      },
      abstention: { type: "boolean" },
    },
  } as const;
}

export function operationalReentryMatchedCohortResponseSchemaV02(
  input: OperationalReentryMatchedCohortModelInputV01,
) {
  const array = (values: string[]) => ({
    type: "array" as const,
    maxItems: values.length,
    items: values.length > 0
      ? { type: "string" as const, enum: [...values] }
      : { type: "string" as const, enum: ["__no_value_allowed__"] },
  });
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "result_token",
      "referenced_context_tokens",
      "required_check_dispositions",
      "operation_action_class_tokens",
      "blocker_warning_gap_tokens",
      "result_limitation_tokens",
      "target_disposition",
      "abstention",
    ],
    properties: {
      result_token: { type: "string", enum: [...input.allowed_output.result_tokens] },
      referenced_context_tokens: array(input.allowed_output.referenced_context_tokens),
      required_check_dispositions: array(
        input.allowed_output.required_check_disposition_tokens,
      ),
      operation_action_class_tokens: array(
        input.allowed_output.operation_action_class_tokens,
      ),
      blocker_warning_gap_tokens: array(
        input.allowed_output.blocker_warning_gap_tokens,
      ),
      result_limitation_tokens: array(
        input.allowed_output.result_limitation_tokens,
      ),
      target_disposition: {
        type: "string",
        enum: [...input.allowed_output.target_dispositions],
      },
      abstention: { type: "boolean" },
    },
  } as const;
}

export function parseOperationalReentryMatchedCohortOutputV01(
  outputText: string,
  input: OperationalReentryMatchedCohortModelInputV01,
): OperationalReentryMatchedCohortModelOutputV01 {
  let output: unknown;
  try {
    output = JSON.parse(outputText) as unknown;
  } catch {
    invalidOutputV01();
  }
  if (!isRecord(output)) invalidOutputV01();
  exactKeysV01(output, [
    "result_token",
    "referenced_context_tokens",
    "required_check_dispositions",
    "operation_action_class_tokens",
    "blocker_warning_gap_tokens",
    "result_limitation_tokens",
    "target_disposition",
    "abstention",
  ], invalidOutputV01);
  const allowed = input.allowed_output;
  const result = {
    result_token: allowlistedTokenV01(output.result_token, allowed.result_tokens),
    referenced_context_tokens: allowlistedArrayV01(
      output.referenced_context_tokens,
      allowed.referenced_context_tokens,
    ),
    required_check_dispositions: allowlistedArrayV01(
      output.required_check_dispositions,
      allowed.required_check_disposition_tokens,
    ),
    operation_action_class_tokens: allowlistedArrayV01(
      output.operation_action_class_tokens,
      allowed.operation_action_class_tokens,
    ),
    blocker_warning_gap_tokens: allowlistedArrayV01(
      output.blocker_warning_gap_tokens,
      allowed.blocker_warning_gap_tokens,
    ),
    result_limitation_tokens: allowlistedArrayV01(
      output.result_limitation_tokens,
      allowed.result_limitation_tokens,
    ),
    target_disposition: allowlistedTokenV01(
      output.target_disposition,
      allowed.target_dispositions,
    ) as OperationalReentryMatchedCohortModelOutputV01["target_disposition"],
    abstention: output.abstention as boolean,
  };
  if (typeof result.abstention !== "boolean") invalidOutputV01();
  if (result.required_check_dispositions.length !== 1) invalidOutputV01();
  validateTargetOutputRelationV01(result, input);
  return result;
}

function validateTargetOutputRelationV01(
  output: OperationalReentryMatchedCohortModelOutputV01,
  input: OperationalReentryMatchedCohortModelInputV01,
): void {
  const target = input.target_context_token;
  const targetReferenced = target !== null && output.referenced_context_tokens.includes(target);
  const targetStructured =
    output.operation_action_class_tokens.some((token) => token.startsWith("target_")) ||
    output.result_limitation_tokens.some((token) =>
      token.includes("stale_target"),
    );
  if (target === null) {
    if (output.target_disposition !== "not_available" || targetStructured) invalidOutputV01();
    return;
  }
  if (output.target_disposition === "not_available") invalidOutputV01();
  if (
    output.target_disposition === "withheld_stale" &&
    (targetReferenced || targetStructured)
  ) invalidOutputV01();
  if (
    output.target_disposition === "stale_persisted" &&
    !targetReferenced &&
    !targetStructured
  ) invalidOutputV01();
  if (
    output.target_disposition === "reference_only" &&
    (!targetReferenced || targetStructured)
  ) invalidOutputV01();
  if (
    output.target_disposition === "applied_to_structure" &&
    !targetStructured
  ) invalidOutputV01();
  if (input.stale_relation === null && ["withheld_stale", "stale_persisted"].includes(output.target_disposition)) {
    invalidOutputV01();
  }
}

function validateInvocationContextV01(value: unknown): void {
  if (!isRecord(value)) malformedV01();
  exactKeysV01(value, ["cohort_ref", "call_slot_id", "repeat_block"]);
  if (
    !safeTokenV01(value.cohort_ref) ||
    !safeTokenV01(value.call_slot_id) ||
    ![0, 1, 2, 3].includes(value.repeat_block as number)
  ) malformedV01();
}

function validateTaskV01(value: unknown): void {
  if (!isRecord(value)) malformedV01();
  exactKeysV01(value, [
    "goal_token",
    "success_criterion_tokens",
    "non_goal_tokens",
    "required_check_tokens",
    "forbidden_action_tokens",
    "task_family_token",
  ]);
  if (!safeTokenV01(value.goal_token) || !safeTokenV01(value.task_family_token)) malformedV01();
  for (const key of [
    "success_criterion_tokens",
    "non_goal_tokens",
    "required_check_tokens",
    "forbidden_action_tokens",
  ]) validateTokenArrayV01(value[key], 1, 8);
}

function validateContextV01(value: unknown): Set<string> {
  if (!Array.isArray(value) || value.length > 4) malformedV01();
  const tokens = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) malformedV01();
    exactKeysV01(item, ["context_token", "material_token"]);
    if (
      !safeTokenV01(item.context_token) ||
      !safeTokenV01(item.material_token) ||
      tokens.has(item.context_token)
    ) malformedV01();
    tokens.add(item.context_token);
  }
  return tokens;
}

function validateStaleRelationV01(value: unknown, target: unknown): void {
  if (value === null) return;
  if (!isRecord(value)) malformedV01();
  exactKeysV01(value, [
    "relation_token",
    "target_context_token",
    "source_ref",
    "reason_observed_at",
    "regime_key",
    "applies_before_outcome",
  ]);
  if (
    !safeTokenV01(value.relation_token) ||
    value.target_context_token !== target ||
    !safeTokenV01(value.source_ref) ||
    !safeTokenV01(value.reason_observed_at) ||
    !safeTokenV01(value.regime_key) ||
    value.applies_before_outcome !== true
  ) malformedV01();
}

function validateAllowedOutputV01(
  value: unknown,
  context: Set<string>,
  target: unknown,
  stale: boolean,
): void {
  if (!isRecord(value)) malformedV01();
  exactKeysV01(value, [
    "result_tokens",
    "referenced_context_tokens",
    "required_check_disposition_tokens",
    "operation_action_class_tokens",
    "blocker_warning_gap_tokens",
    "result_limitation_tokens",
    "target_dispositions",
  ]);
  validateTokenArrayV01(value.result_tokens, 1, 4);
  validateTokenArrayV01(value.referenced_context_tokens, 0, 4);
  validateTokenArrayV01(value.required_check_disposition_tokens, 1, 8);
  validateTokenArrayV01(value.operation_action_class_tokens, 1, 8);
  validateTokenArrayV01(value.blocker_warning_gap_tokens, 0, 8);
  validateTokenArrayV01(value.result_limitation_tokens, 1, 8);
  validateTokenArrayV01(value.target_dispositions, 1, 4);
  const refs = value.referenced_context_tokens as string[];
  if (refs.length !== context.size || refs.some((token) => !context.has(token))) malformedV01();
  const dispositions = value.target_dispositions as string[];
  if (target === null && (dispositions.length !== 1 || dispositions[0] !== "not_available")) malformedV01();
  if (target !== null && dispositions.includes("not_available")) malformedV01();
  if (stale !== dispositions.some((entry) => entry === "withheld_stale" || entry === "stale_persisted")) malformedV01();
}

function validateAuthorityNoticeV01(value: unknown): void {
  if (!isRecord(value)) malformedV01();
  exactKeysV01(value, [
    "bounded_research_candidate_only",
    "execution_authority",
    "semantic_authority",
    "product_state_mutation_authority",
    "publication_authority",
  ]);
  if (
    value.bounded_research_candidate_only !== true ||
    value.execution_authority !== false ||
    value.semantic_authority !== false ||
    value.product_state_mutation_authority !== false ||
    value.publication_authority !== false
  ) malformedV01();
}

function validateTokenArrayV01(value: unknown, minimum: number, maximum: number): void {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    value.length > maximum ||
    value.some((entry) => !safeTokenV01(entry)) ||
    new Set(value).size !== value.length
  ) malformedV01();
}

function allowlistedArrayV01(value: unknown, allowed: readonly string[]): string[] {
  if (
    !Array.isArray(value) ||
    value.length > allowed.length ||
    value.some((entry) => typeof entry !== "string" || !allowed.includes(entry)) ||
    new Set(value).size !== value.length
  ) invalidOutputV01();
  return [...value] as string[];
}

function allowlistedTokenV01(value: unknown, allowed: readonly string[]): string {
  if (typeof value !== "string" || !allowed.includes(value)) invalidOutputV01();
  return value;
}

function exactKeysV01(
  value: Record<string, unknown>,
  expected: string[],
  onInvalid: () => never = malformedV01,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) onInvalid();
}

function safeTokenV01(value: unknown): value is string {
  return typeof value === "string" && SAFE_TOKEN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function malformedV01(): never {
  return refuseModelEgress(PURPOSE, "model_egress_payload_malformed");
}

function invalidOutputV01(): never {
  throw new Error("operational_reentry_matched_cohort_output_invalid");
}
