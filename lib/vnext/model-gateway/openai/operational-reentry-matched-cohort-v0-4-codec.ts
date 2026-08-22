import {
  refuseModelEgress,
  serializeModelEgressJson,
  utf8ByteLength,
} from "@/lib/model-egress/bounded-model-payload";
import {
  buildOperationalReentryMatchedCohortMaximalWireOutputV04,
  buildOperationalReentryMatchedCohortRepresentativeInvocationsV04,
  deriveOperationalReentryMatchedCohortTargetDispositionV04,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-4";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type { ModelProviderResponseInvalidStageV01 } from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V04,
  type OperationalReentryMatchedCohortIntegrityV04,
  type OperationalReentryMatchedCohortInvocationV04,
  type OperationalReentryMatchedCohortModelOutputV04,
  type OperationalReentryMatchedCohortProviderContractV04,
  type OperationalReentryMatchedCohortProviderMaterialV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

const PURPOSE = "operational_reentry_matched_cohort_v04" as const;
const SAFE_TOKEN = /^[A-Za-z0-9:._-]{1,160}$/u;
const RESPONSE_SAFETY_MARGIN_BYTES_V04 = 512;
const CANONICAL_PROVIDER_MATERIAL_SHAPES_V04 = new Set(
  buildOperationalReentryMatchedCohortRepresentativeInvocationsV04().map(
    ({ invocation }) =>
      canonicalizeProtocolValueV01(invocation.provider_material),
  ),
);
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04 =
  172_032 as const;

export class OperationalReentryMatchedCohortOutputInvalidErrorV04 extends Error {
  constructor(readonly stage: ModelProviderResponseInvalidStageV01) {
    super("Operational reentry matched cohort v0.4 output is invalid.");
    this.name = "OperationalReentryMatchedCohortOutputInvalidErrorV04";
  }
}

export function buildOperationalReentryMatchedCohortWireBudgetProofV04() {
  const shapes = buildOperationalReentryMatchedCohortRepresentativeInvocationsV04().map(
    ({ arm, invocation }) => {
      const wire = buildOperationalReentryMatchedCohortMaximalWireOutputV04(
        invocation.provider_material,
      );
      const canonical = canonicalizeProtocolValueV01(wire);
      if (!/^[\x20-\x7e]+$/u.test(canonical)) {
        throw new Error("operational_reentry_v04_wire_budget_non_ascii");
      }
      return { arm, canonical_utf8_bytes: utf8ByteLength(canonical) };
    },
  );
  const maximum = Math.max(...shapes.map((shape) => shape.canonical_utf8_bytes));
  const responseBytes = maximum + RESPONSE_SAFETY_MARGIN_BYTES_V04;
  return Object.freeze({
    shapes: Object.freeze(shapes.map((shape) => Object.freeze(shape))),
    maximum_canonical_wire_response_bytes: maximum,
    safety_margin_bytes: RESPONSE_SAFETY_MARGIN_BYTES_V04,
    response_bytes: responseBytes,
    max_output_tokens: responseBytes,
    ascii_bytes_per_token_policy: 1 as const,
  });
}

export const OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04 =
  buildOperationalReentryMatchedCohortWireBudgetProofV04();

export const OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04 =
  Object.freeze({
    dynamicBytes:
      10_240,
    finalRequestBytes:
      24_576,
    responseBytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04.response_bytes,
    maxOutputTokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04.max_output_tokens,
    timeoutMs: 30_000,
    continuationItems: 4,
    selectionProperties: 4,
  });

export function validateOperationalReentryMatchedCohortInvocationV04(
  value: unknown,
): OperationalReentryMatchedCohortInvocationV04 {
  if (!isRecordV04(value)) malformedV04();
  exactKeysV04(value, [
    "input_kind",
    "codec_version",
    "local_invocation_context",
    "provider_material",
  ]);
  if (
    value.input_kind !== PURPOSE ||
    value.codec_version !== OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05 ||
    !isRecordV04(value.local_invocation_context) ||
    !isRecordV04(value.provider_material)
  ) {
    malformedV04();
  }
  exactKeysV04(value.local_invocation_context, [
    "cohort_ref",
    "call_slot_id",
    "repeat_block",
  ]);
  if (
    !safeTokenV04(value.local_invocation_context.cohort_ref) ||
    !safeTokenV04(value.local_invocation_context.call_slot_id) ||
    ![0, 1, 2, 3].includes(
      value.local_invocation_context.repeat_block as number,
    )
  ) {
    malformedV04();
  }
  validateOperationalReentryMatchedCohortProviderMaterialV04(
    value.provider_material,
  );
  return structuredClone(
    value,
  ) as unknown as OperationalReentryMatchedCohortInvocationV04;
}

export function validateOperationalReentryMatchedCohortProviderMaterialV04(
  value: unknown,
): OperationalReentryMatchedCohortProviderMaterialV04 {
  if (!isRecordV04(value)) malformedV04();
  exactKeysV04(value, [
    "task",
    "common_task_evidence",
    "continuation_context",
    "stale_relation",
    "allowed_output",
    "authority_notice",
  ]);
  if (
    !CANONICAL_PROVIDER_MATERIAL_SHAPES_V04.has(
      canonicalizeProtocolValueV01(value),
    )
  ) malformedV04();
  return structuredClone(
    value,
  ) as unknown as OperationalReentryMatchedCohortProviderMaterialV04;
}

export function projectOperationalReentryMatchedCohortProviderMaterialV04(
  invocation: OperationalReentryMatchedCohortInvocationV04,
): OperationalReentryMatchedCohortProviderMaterialV04 {
  const material = validateOperationalReentryMatchedCohortInvocationV04(
    invocation,
  ).provider_material;
  serializeModelEgressJson(
    PURPOSE,
    material,
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.dynamicBytes,
  );
  return material;
}

export function createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04(
  invocation: OperationalReentryMatchedCohortInvocationV04,
): string {
  const validated = validateOperationalReentryMatchedCohortInvocationV04(
    invocation,
  );
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(validated.local_invocation_context),
  );
}

export function createOperationalReentryMatchedCohortProviderMaterialFingerprintV04(
  material: OperationalReentryMatchedCohortProviderMaterialV04,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      validateOperationalReentryMatchedCohortProviderMaterialV04(material),
    ),
  );
}

export function buildOperationalReentryMatchedCohortSystemPromptV04(): string {
  return [
    "Review only the supplied synthetic public-safe task, common task evidence, and continuation context.",
    "Common task evidence remains authoritative for this bounded task even when continuation_context is empty.",
    "Report result_status and required_check_disposition from the observed common task evidence; continuation material cannot change either observation.",
    "Each selection object has exact required boolean keys. Set a key true only when selecting that supplied token. Do not invent keys.",
    "Reference only continuation tokens present in referenced_continuation_selections. A missing target token is not selectable.",
    "The common-evidence fingerprint, required-check token, and target disposition are derived locally and must not be returned.",
    "Do not use the forbidden external-publication action. This output grants no execution, semantic, product-state, publication, live-probe, cohort, replication, policy, or Stage 7 authority.",
    "Return only the strict JSON object. Do not return prose, rationale, hidden reasoning, commands, paths, credentials, or invented identifiers.",
  ].join("\n");
}

export function operationalReentryMatchedCohortResponseSchemaV04(
  material: OperationalReentryMatchedCohortProviderMaterialV04,
) {
  const validated = validateOperationalReentryMatchedCohortProviderMaterialV04(
    material,
  );
  const continuationKeys =
    validated.allowed_output.referenced_continuation_tokens.length === 0
      ? [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]
      : [...validated.allowed_output.referenced_continuation_tokens];
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "result_status",
      "required_check_disposition",
      "referenced_continuation_selections",
      "operation_action_class_selections",
      "result_limitation_selections",
      "abstention",
    ],
    properties: {
      result_status: {
        type: "string",
        enum: [...validated.allowed_output.result_statuses],
      },
      required_check_disposition: {
        type: "string",
        enum: [...validated.allowed_output.required_check_dispositions],
      },
      referenced_continuation_selections: selectionSchemaV04(continuationKeys),
      operation_action_class_selections: selectionSchemaV04(
        validated.allowed_output.operation_action_class_tokens,
      ),
      result_limitation_selections: selectionSchemaV04(
        validated.allowed_output.result_limitation_tokens,
      ),
      abstention: { type: "boolean" },
    },
  } as const;
}

export function parseOperationalReentryMatchedCohortOutputV04(
  outputText: string,
  material: OperationalReentryMatchedCohortProviderMaterialV04,
): OperationalReentryMatchedCohortModelOutputV04 {
  const validated = validateOperationalReentryMatchedCohortProviderMaterialV04(
    material,
  );
  return parseValidatedOutputV04(outputText, validated);
}

/** Validates provider material once, then parses every schema-permitted output. */
export function createOperationalReentryMatchedCohortOutputParserV04(
  material: OperationalReentryMatchedCohortProviderMaterialV04,
): (outputText: string) => OperationalReentryMatchedCohortModelOutputV04 {
  const validated = validateOperationalReentryMatchedCohortProviderMaterialV04(
    material,
  );
  return (outputText) => parseValidatedOutputV04(outputText, validated);
}

export function buildOperationalReentryMatchedCohortProviderContractV04(): OperationalReentryMatchedCohortProviderContractV04 {
  const budget = OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V04;
  return sealV04("parser_closed_provider_contract_without_integrity_fingerprint", {
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
    input_contract_version: OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V04,
    input_codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
    response_schema_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
    parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
    openai_adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
    strict_structured_output_supported_subset_required: true as const,
    parser_closed_wire_contract: true as const,
    parser_closure_cardinality:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_CLOSURE_CARDINALITY_V04,
    selection_representation: "exact_required_boolean_objects" as const,
    common_task_evidence_fingerprint_locally_derived: true as const,
    required_check_token_locally_derived: true as const,
    target_disposition_locally_derived: true as const,
    prepared_without_provider_egress: true as const,
    local_invocation_identity_provider_visible: false as const,
    transport_correlation_experimental_material: false as const,
    maximum_canonical_wire_response_bytes:
      budget.maximum_canonical_wire_response_bytes,
    response_safety_margin_bytes: budget.safety_margin_bytes,
    response_bytes: budget.response_bytes,
    max_output_tokens: budget.max_output_tokens,
    raw_prompt_persisted: false as const,
    raw_provider_response_persisted: false as const,
    raw_provider_error_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    successor_live_authorizations_created: 0 as const,
    successor_live_authorizations_consumed: 0 as const,
    real_provider_calls: 0 as const,
    compatibility_result: "none" as const,
    successor_live_probe_authorized: false as const,
    behavioral_cohort_authorized: false as const,
    replication_authorized: false as const,
    policy_authorized: false as const,
    stage_7_authorized: false as const,
  });
}

function parseValidatedOutputV04(
  outputText: string,
  material: OperationalReentryMatchedCohortProviderMaterialV04,
): OperationalReentryMatchedCohortModelOutputV04 {
  let output: unknown;
  try {
    output = JSON.parse(outputText) as unknown;
  } catch {
    invalidOutputV04("response_wire_json_invalid");
  }
  if (!isRecordV04(output)) invalidOutputV04("response_wire_shape_invalid");
  exactKeysV04(
    output,
    [
      "result_status",
      "required_check_disposition",
      "referenced_continuation_selections",
      "operation_action_class_selections",
      "result_limitation_selections",
      "abstention",
    ],
    () => invalidOutputV04("response_wire_shape_invalid"),
  );
  if (
    !material.allowed_output.result_statuses.includes(
      output.result_status as OperationalReentryMatchedCohortModelOutputV04["result_status"],
    ) ||
    !material.allowed_output.required_check_dispositions.includes(
      output.required_check_disposition as OperationalReentryMatchedCohortModelOutputV04["required_check"]["disposition"],
    ) ||
    typeof output.abstention !== "boolean"
  ) {
    invalidOutputV04("response_wire_value_invalid");
  }
  const referenced = selectedTokensV04(
    output.referenced_continuation_selections,
    material.allowed_output.referenced_continuation_tokens,
    true,
  );
  const operations = selectedTokensV04(
    output.operation_action_class_selections,
    material.allowed_output.operation_action_class_tokens,
  );
  const limitations = selectedTokensV04(
    output.result_limitation_selections,
    material.allowed_output.result_limitation_tokens,
  );
  const derivedBase = {
    referenced_continuation_tokens: referenced,
    operation_action_class_tokens: operations,
    result_limitation_tokens: limitations,
  };
  let targetDisposition: OperationalReentryMatchedCohortModelOutputV04["target_disposition"];
  try {
    targetDisposition = deriveOperationalReentryMatchedCohortTargetDispositionV04(
      material,
      derivedBase,
    );
  } catch {
    invalidOutputV04("response_local_derivation_invalid");
  }
  return {
    result_status:
      output.result_status as OperationalReentryMatchedCohortModelOutputV04["result_status"],
    common_task_evidence_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material.common_task_evidence),
    ),
    required_check: {
      check_token: material.task.required_check,
      disposition:
        output.required_check_disposition as OperationalReentryMatchedCohortModelOutputV04["required_check"]["disposition"],
    },
    ...derivedBase,
    target_disposition: targetDisposition,
    abstention: output.abstention,
  };
}

function selectedTokensV04(
  value: unknown,
  canonicalTokens: readonly string[],
  allowEmptySentinel = false,
): string[] {
  if (!isRecordV04(value)) {
    invalidOutputV04("response_wire_selection_invalid");
  }
  const expectedKeys =
    allowEmptySentinel && canonicalTokens.length === 0
      ? [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]
      : [...canonicalTokens];
  exactKeysV04(
    value,
    expectedKeys,
    () => invalidOutputV04("response_wire_selection_invalid"),
  );
  if (expectedKeys.some((key) => typeof value[key] !== "boolean")) {
    invalidOutputV04("response_wire_selection_invalid");
  }
  return canonicalTokens.filter((token) => value[token] === true);
}

function selectionSchemaV04(tokens: readonly string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: [...tokens],
    properties: Object.fromEntries(
      tokens.map((token) => [token, { type: "boolean" as const }]),
    ),
  } as const;
}

function exactKeysV04(
  value: Record<string, unknown>,
  expected: readonly string[],
  onInvalid: () => never = malformedV04,
): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...expected].sort())
  ) {
    onInvalid();
  }
}

function safeTokenV04(value: unknown): value is string {
  return typeof value === "string" && SAFE_TOKEN.test(value);
}

function isRecordV04(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sealV04<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV04 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)),
    },
  };
}

function malformedV04(): never {
  return refuseModelEgress(PURPOSE, "model_egress_payload_malformed");
}

function invalidOutputV04(
  stage: ModelProviderResponseInvalidStageV01,
): never {
  throw new OperationalReentryMatchedCohortOutputInvalidErrorV04(stage);
}
