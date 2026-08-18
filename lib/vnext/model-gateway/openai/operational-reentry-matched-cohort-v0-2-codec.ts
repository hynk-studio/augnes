import {
  refuseModelEgress,
  serializeModelEgressJson,
} from "@/lib/model-egress/bounded-model-payload";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
  type OperationalReentryMatchedCohortIntegrityV02,
  type OperationalReentryMatchedCohortModelInputV02,
  type OperationalReentryMatchedCohortModelOutputV02,
  type OperationalReentryMatchedCohortProviderContractV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";

const PURPOSE = "operational_reentry_matched_cohort" as const;
const INPUT_KIND = "operational_reentry_matched_cohort_v02" as const;
const SAFE_TOKEN = /^[A-Za-z0-9:._-]{1,160}$/u;
const SHA256 = /^sha256:[0-9a-f]{64}$/u;

export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04 =
  "openai_responses_operational_reentry_matched_cohort_adapter.v0.4" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V03 =
  "operational_reentry_matched_cohort_response_schema.v0.3" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V02 =
  "operational_reentry_matched_cohort_parser.v0.2" as const;

export const OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02 =
  Object.freeze({
    dynamicBytes: 10_240,
    finalRequestBytes: 16_384,
    responseBytes: 4_096,
    maxOutputTokens: 256,
    timeoutMs: 30_000,
    continuationItems: 4,
    arrayItems: 12,
  });

export function validateOperationalReentryMatchedCohortModelInputV02(
  value: unknown,
): OperationalReentryMatchedCohortModelInputV02 {
  if (!isRecordV02(value)) malformedV02();
  exactKeysV02(value, [
    "input_kind",
    "codec_version",
    "invocation_context",
    "task",
    "common_task_evidence",
    "continuation_context",
    "stale_relation",
    "allowed_output",
    "authority_notice",
  ]);
  if (
    value.input_kind !== INPUT_KIND ||
    value.codec_version !== OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03
  ) {
    malformedV02();
  }
  validateInvocationContextV02(value.invocation_context);
  validateTaskV02(value.task);
  validateCommonTaskEvidenceV02(value.common_task_evidence);
  const continuation = validateContinuationContextV02(
    value.continuation_context,
  );
  validateStaleRelationV02(value.stale_relation, continuation.targetToken);
  validateAllowedOutputV02(value.allowed_output, continuation.tokens);
  validateAuthorityNoticeV02(value.authority_notice);
  return structuredClone(
    value,
  ) as unknown as OperationalReentryMatchedCohortModelInputV02;
}

export function projectOperationalReentryMatchedCohortModelMaterialV02(
  input: OperationalReentryMatchedCohortModelInputV02,
) {
  const validated = validateOperationalReentryMatchedCohortModelInputV02(input);
  const material = {
    invocation_context: validated.invocation_context,
    task: validated.task,
    common_task_evidence: validated.common_task_evidence,
    continuation_context: validated.continuation_context,
    stale_relation: validated.stale_relation,
    allowed_output: validated.allowed_output,
    authority_notice: validated.authority_notice,
  };
  serializeModelEgressJson(
    PURPOSE,
    material,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.dynamicBytes,
  );
  return material;
}

export function buildOperationalReentryMatchedCohortSystemPromptV02(): string {
  return [
    "Review only the supplied synthetic public-safe task, common task evidence, and continuation context.",
    "Common task evidence is not continuation context. It remains authoritative for this bounded task even when continuation_context is empty.",
    "Report result_status from common_task_evidence.observed_result_status.",
    "Required-check disposition reports the observed check result contained in common task evidence. Continuation material cannot upgrade, downgrade, or invent the check result. A continuation item proposing verification is not evidence that verification passed.",
    "Do not use the forbidden external-publication action. This output has no execution, semantic, product-state, publication, compatibility-probe, live-cohort, replication, policy, or Stage 7 authority.",
    "Return only the strict JSON object. Do not return prose, rationale, hidden reasoning, commands, paths, credentials, or invented identifiers.",
    "Reference only continuation tokens actually supplied. A missing target cannot be referenced or represented in target-linked structure.",
    "For a stale relation, withheld_stale requires no target reference or target-linked structure; stale_persisted requires observable target persistence.",
  ].join("\n");
}

export function operationalReentryMatchedCohortResponseSchemaV03(
  input: OperationalReentryMatchedCohortModelInputV02,
) {
  const validated = validateOperationalReentryMatchedCohortModelInputV02(input);
  const array = (values: readonly string[]) => ({
    type: "array" as const,
    maxItems: values.length,
    items:
      values.length > 0
        ? { type: "string" as const, enum: [...values] }
        : { type: "string" as const, enum: ["__no_value_allowed__"] },
  });
  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "result_status",
      "common_task_evidence_fingerprint",
      "required_check",
      "referenced_continuation_tokens",
      "operation_action_class_tokens",
      "result_limitation_tokens",
      "target_disposition",
      "abstention",
    ],
    properties: {
      result_status: {
        type: "string",
        enum: [...validated.allowed_output.result_statuses],
      },
      common_task_evidence_fingerprint: {
        type: "string",
        enum: [commonTaskEvidenceFingerprintV02(validated)],
      },
      required_check: {
        type: "object",
        additionalProperties: false,
        required: ["check_token", "disposition"],
        properties: {
          check_token: {
            type: "string",
            enum: [validated.task.required_check],
          },
          disposition: {
            type: "string",
            enum: [
              ...validated.allowed_output.required_check_dispositions,
            ],
          },
        },
      },
      referenced_continuation_tokens: array(
        validated.allowed_output.referenced_continuation_tokens,
      ),
      operation_action_class_tokens: array(
        validated.allowed_output.operation_action_class_tokens,
      ),
      result_limitation_tokens: array(
        validated.allowed_output.result_limitation_tokens,
      ),
      target_disposition: {
        type: "string",
        enum: [...validated.allowed_output.target_dispositions],
      },
      abstention: { type: "boolean" },
    },
  } as const;
  return schema;
}

export function parseOperationalReentryMatchedCohortOutputV02(
  outputText: string,
  input: OperationalReentryMatchedCohortModelInputV02,
): OperationalReentryMatchedCohortModelOutputV02 {
  const validatedInput =
    validateOperationalReentryMatchedCohortModelInputV02(input);
  let output: unknown;
  try {
    output = JSON.parse(outputText) as unknown;
  } catch {
    invalidOutputV02();
  }
  if (!isRecordV02(output)) invalidOutputV02();
  exactKeysV02(
    output,
    [
      "result_status",
      "common_task_evidence_fingerprint",
      "required_check",
      "referenced_continuation_tokens",
      "operation_action_class_tokens",
      "result_limitation_tokens",
      "target_disposition",
      "abstention",
    ],
    invalidOutputV02,
  );
  if (!isRecordV02(output.required_check)) invalidOutputV02();
  exactKeysV02(
    output.required_check,
    ["check_token", "disposition"],
    invalidOutputV02,
  );
  const allowed = validatedInput.allowed_output;
  const result: OperationalReentryMatchedCohortModelOutputV02 = {
    result_status: allowlistedTokenV02(
      output.result_status,
      allowed.result_statuses,
    ) as OperationalReentryMatchedCohortModelOutputV02["result_status"],
    common_task_evidence_fingerprint: requireFingerprintV02(
      output.common_task_evidence_fingerprint,
    ),
    required_check: {
      check_token: allowlistedTokenV02(output.required_check.check_token, [
        validatedInput.task.required_check,
      ]) as "verify_portable_output",
      disposition: allowlistedTokenV02(
        output.required_check.disposition,
        allowed.required_check_dispositions,
      ) as OperationalReentryMatchedCohortModelOutputV02["required_check"]["disposition"],
    },
    referenced_continuation_tokens: allowlistedArrayV02(
      output.referenced_continuation_tokens,
      allowed.referenced_continuation_tokens,
    ),
    operation_action_class_tokens: allowlistedArrayV02(
      output.operation_action_class_tokens,
      allowed.operation_action_class_tokens,
    ),
    result_limitation_tokens: allowlistedArrayV02(
      output.result_limitation_tokens,
      allowed.result_limitation_tokens,
    ),
    target_disposition: allowlistedTokenV02(
      output.target_disposition,
      allowed.target_dispositions,
    ) as OperationalReentryMatchedCohortModelOutputV02["target_disposition"],
    abstention: output.abstention as boolean,
  };
  if (
    typeof result.abstention !== "boolean" ||
    result.common_task_evidence_fingerprint !==
      commonTaskEvidenceFingerprintV02(validatedInput)
  ) {
    invalidOutputV02();
  }
  validateTargetOutputRelationV02(result, validatedInput);
  return result;
}

export function buildOperationalReentryMatchedCohortProviderContractV02(): OperationalReentryMatchedCohortProviderContractV02 {
  return sealV02("clean_control_provider_contract_without_integrity_fingerprint", {
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
    input_codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
    response_schema_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V03,
    parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V02,
    openai_adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    strict_structured_output_supported_subset_required: true as const,
    raw_prompt_persisted: false as const,
    raw_provider_response_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    issue_193_v01_result_is_v02_compatibility: false as const,
    separately_authorized_v02_compatibility_probe_required: true as const,
    real_provider_calls: 0 as const,
  });
}

export function commonTaskEvidenceFingerprintV02(
  input: OperationalReentryMatchedCohortModelInputV02,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(input.common_task_evidence),
  );
}

function validateInvocationContextV02(value: unknown): void {
  if (!isRecordV02(value)) malformedV02();
  exactKeysV02(value, ["cohort_ref", "call_slot_id", "repeat_block"]);
  if (
    !safeTokenV02(value.cohort_ref) ||
    !safeTokenV02(value.call_slot_id) ||
    ![0, 1, 2, 3].includes(value.repeat_block as number)
  ) {
    malformedV02();
  }
}

function validateTaskV02(value: unknown): void {
  if (!isRecordV02(value)) malformedV02();
  exactKeysV02(value, [
    "goal",
    "success_criteria",
    "non_goals",
    "required_check",
    "forbidden_external_action",
  ]);
  if (
    value.goal !== "review_bounded_semantic_result_chain" ||
    value.required_check !== "verify_portable_output" ||
    value.forbidden_external_action !==
      "publish_external_without_authority"
  ) {
    malformedV02();
  }
  validateTokenArrayV02(value.success_criteria, 2, 2);
  validateTokenArrayV02(value.non_goals, 2, 2);
}

function validateCommonTaskEvidenceV02(value: unknown): void {
  if (!isRecordV02(value)) malformedV02();
  exactKeysV02(value, [
    "evidence_version",
    "observed_result_status",
    "observed_required_check",
    "forbidden_external_publication",
    "source_support",
  ]);
  if (
    value.evidence_version !==
      "operational_reentry_common_task_evidence.v0.2" ||
    value.observed_result_status !== "review_ready" ||
    !isRecordV02(value.observed_required_check) ||
    !isRecordV02(value.forbidden_external_publication) ||
    !isRecordV02(value.source_support)
  ) {
    malformedV02();
  }
  exactKeysV02(value.observed_required_check, [
    "check_token",
    "disposition",
    "observation_basis",
  ]);
  if (
    value.observed_required_check.check_token !== "verify_portable_output" ||
    value.observed_required_check.disposition !== "passed" ||
    value.observed_required_check.observation_basis !==
      "completed_check_observation"
  ) {
    malformedV02();
  }
  exactKeysV02(value.forbidden_external_publication, [
    "action_token",
    "permitted",
  ]);
  if (
    value.forbidden_external_publication.action_token !==
      "publish_external_without_authority" ||
    value.forbidden_external_publication.permitted !== false
  ) {
    malformedV02();
  }
  exactKeysV02(value.source_support, [
    "evidence_class",
    "result_observation_present",
    "required_check_observation_present",
    "authority_boundary_observation_present",
  ]);
  if (
    value.source_support.evidence_class !==
      "synthetic_public_safe_observation" ||
    value.source_support.result_observation_present !== true ||
    value.source_support.required_check_observation_present !== true ||
    value.source_support.authority_boundary_observation_present !== true
  ) {
    malformedV02();
  }
}

function validateContinuationContextV02(value: unknown): {
  tokens: Set<string>;
  targetToken: string | null;
} {
  if (
    !Array.isArray(value) ||
    value.length >
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.continuationItems
  ) {
    malformedV02();
  }
  const tokens = new Set<string>();
  let targetToken: string | null = null;
  for (const item of value) {
    if (!isRecordV02(item)) malformedV02();
    exactKeysV02(item, ["context_token", "material_token", "role"]);
    if (
      !safeTokenV02(item.context_token) ||
      !safeTokenV02(item.material_token) ||
      !["non_target", "target"].includes(item.role as string) ||
      tokens.has(item.context_token)
    ) {
      malformedV02();
    }
    tokens.add(item.context_token);
    if (item.role === "target") {
      if (targetToken !== null) malformedV02();
      targetToken = item.context_token;
    }
  }
  return { tokens, targetToken };
}

function validateStaleRelationV02(
  value: unknown,
  targetToken: string | null,
): void {
  if (value === null) return;
  if (!isRecordV02(value) || targetToken === null) malformedV02();
  exactKeysV02(value, [
    "relation_token",
    "target_context_token",
    "source_ref",
    "reason_observed_at",
    "regime_key",
    "applies_before_outcome",
  ]);
  if (
    value.relation_token !== "target_regime_inapplicable_before_outcome" ||
    value.target_context_token !== targetToken ||
    !SHA256.test(value.source_ref as string) ||
    !safeTokenV02(value.reason_observed_at) ||
    !safeTokenV02(value.regime_key) ||
    value.applies_before_outcome !== true
  ) {
    malformedV02();
  }
}

function validateAllowedOutputV02(
  value: unknown,
  continuationTokens: Set<string>,
): void {
  if (!isRecordV02(value)) malformedV02();
  exactKeysV02(value, [
    "result_statuses",
    "required_check_dispositions",
    "referenced_continuation_tokens",
    "operation_action_class_tokens",
    "result_limitation_tokens",
    "target_dispositions",
  ]);
  validateTokenArrayV02(value.result_statuses, 2, 2);
  validateTokenArrayV02(value.required_check_dispositions, 4, 4);
  validateTokenArrayV02(value.referenced_continuation_tokens, 4, 4);
  validateTokenArrayV02(value.operation_action_class_tokens, 4, 4);
  validateTokenArrayV02(value.result_limitation_tokens, 4, 4);
  validateTokenArrayV02(value.target_dispositions, 6, 6);
  for (const token of continuationTokens) {
    if (!(value.referenced_continuation_tokens as string[]).includes(token)) {
      malformedV02();
    }
  }
}

function validateAuthorityNoticeV02(value: unknown): void {
  if (!isRecordV02(value)) malformedV02();
  exactKeysV02(value, [
    "bounded_protocol_validation_only",
    "execution_authority",
    "semantic_authority",
    "product_state_mutation_authority",
    "publication_authority",
    "compatibility_probe_authority",
    "live_cohort_authority",
    "replication_authority",
    "policy_authority",
    "stage_7_authority",
  ]);
  if (
    value.bounded_protocol_validation_only !== true ||
    [
      value.execution_authority,
      value.semantic_authority,
      value.product_state_mutation_authority,
      value.publication_authority,
      value.compatibility_probe_authority,
      value.live_cohort_authority,
      value.replication_authority,
      value.policy_authority,
      value.stage_7_authority,
    ].some((entry) => entry !== false)
  ) {
    malformedV02();
  }
}

function validateTargetOutputRelationV02(
  output: OperationalReentryMatchedCohortModelOutputV02,
  input: OperationalReentryMatchedCohortModelInputV02,
): void {
  const available = new Set(
    input.continuation_context.map((item) => item.context_token),
  );
  if (
    output.referenced_continuation_tokens.some(
      (token) => !available.has(token),
    )
  ) {
    invalidOutputV02();
  }
  const target =
    input.continuation_context.find((item) => item.role === "target")
      ?.context_token ?? null;
  const targetReferenced =
    target !== null &&
    output.referenced_continuation_tokens.includes(target);
  const targetStructured =
    output.operation_action_class_tokens.includes(
      "target_linked_verification_preparation",
    ) ||
    output.result_limitation_tokens.includes(
      "limitation_stale_target_persisted",
    );
  if (target === null) {
    if (
      output.target_disposition !== "not_available" ||
      targetStructured
    ) {
      invalidOutputV02();
    }
    return;
  }
  if (input.stale_relation === null) {
    if (
      ["withheld_stale", "stale_persisted", "not_available"].includes(
        output.target_disposition,
      )
    ) {
      invalidOutputV02();
    }
    if (
      output.target_disposition === "reference_only" &&
      (!targetReferenced || targetStructured)
    ) {
      invalidOutputV02();
    }
    if (
      output.target_disposition === "applied_to_structure" &&
      !targetStructured
    ) {
      invalidOutputV02();
    }
    if (
      output.target_disposition === "not_referenced" &&
      (targetReferenced || targetStructured)
    ) {
      invalidOutputV02();
    }
    return;
  }
  if (
    !["withheld_stale", "stale_persisted"].includes(
      output.target_disposition,
    )
  ) {
    invalidOutputV02();
  }
  if (
    output.target_disposition === "withheld_stale" &&
    (targetReferenced || targetStructured)
  ) {
    invalidOutputV02();
  }
  if (
    output.target_disposition === "stale_persisted" &&
    (!targetReferenced && !targetStructured)
  ) {
    invalidOutputV02();
  }
}

function validateTokenArrayV02(
  value: unknown,
  minimum: number,
  maximum: number,
): void {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    value.length > maximum ||
    value.some((entry) => !safeTokenV02(entry)) ||
    new Set(value).size !== value.length
  ) {
    malformedV02();
  }
}

function allowlistedArrayV02(
  value: unknown,
  allowed: readonly string[],
): string[] {
  if (
    !Array.isArray(value) ||
    value.length > allowed.length ||
    value.some(
      (entry) => typeof entry !== "string" || !allowed.includes(entry),
    ) ||
    new Set(value).size !== value.length
  ) {
    invalidOutputV02();
  }
  return [...value] as string[];
}

function allowlistedTokenV02(
  value: unknown,
  allowed: readonly string[],
): string {
  if (typeof value !== "string" || !allowed.includes(value)) {
    invalidOutputV02();
  }
  return value;
}

function requireFingerprintV02(value: unknown): string {
  if (typeof value !== "string" || !SHA256.test(value)) invalidOutputV02();
  return value;
}

function exactKeysV02(
  value: Record<string, unknown>,
  expected: string[],
  onInvalid: () => never = malformedV02,
): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...expected].sort())
  ) {
    onInvalid();
  }
}

function safeTokenV02(value: unknown): value is string {
  return typeof value === "string" && SAFE_TOKEN.test(value);
}

function isRecordV02(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sealV02<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV02 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(value),
      ),
    },
  };
}

function malformedV02(): never {
  return refuseModelEgress(PURPOSE, "model_egress_payload_malformed");
}

function invalidOutputV02(): never {
  throw new Error("operational_reentry_matched_cohort_v02_output_invalid");
}
