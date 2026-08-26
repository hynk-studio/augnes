import {
  refuseModelEgress,
  serializeModelEgressJson,
  utf8ByteLength,
} from "@/lib/model-egress/bounded-model-payload";
import {
  operationalReentryMatchedCohortCaseFixtureV02,
  operationalReentryMatchedCohortCommonTaskEvidenceV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import {
  buildOperationalReentryMatchedCohortMaximalWireOutputV03,
  buildOperationalReentryMatchedCohortModelInputV03,
  buildOperationalReentryMatchedCohortRepresentativeInputsV03,
  deriveOperationalReentryMatchedCohortTargetDispositionV03,
} from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type { ModelProviderResponseInvalidStageV01 } from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import type { OperationalReentryMatchedCohortModelOutputV02 } from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
  type OperationalReentryMatchedCohortArmV03,
  type OperationalReentryMatchedCohortIntegrityV03,
  type OperationalReentryMatchedCohortModelInputV03,
  type OperationalReentryMatchedCohortModelOutputV03,
  type OperationalReentryMatchedCohortProviderContractV03,
  type OperationalReentryMatchedCohortWireOutputV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

const PURPOSE = "operational_reentry_matched_cohort_v03" as const;
const INPUT_KIND = PURPOSE;
const SAFE_TOKEN = /^[A-Za-z0-9:._-]{1,160}$/u;
const RESPONSE_SAFETY_MARGIN_BYTES_V03 = 512;

export class OperationalReentryMatchedCohortOutputInvalidErrorV03 extends Error {
  constructor(readonly stage: ModelProviderResponseInvalidStageV01) {
    super("Operational reentry matched cohort v0.3 output is invalid.");
    this.name = "OperationalReentryMatchedCohortOutputInvalidErrorV03";
  }
}

export function buildOperationalReentryMatchedCohortWireBudgetProofV03() {
  const shapes = buildOperationalReentryMatchedCohortRepresentativeInputsV03().map(
    ({ arm, input }) => {
      const wire = buildOperationalReentryMatchedCohortMaximalWireOutputV03(input);
      const canonical = canonicalizeProtocolValueV01(wire);
      if (!/^[\x20-\x7e]+$/u.test(canonical)) {
        throw new Error("operational_reentry_v03_wire_budget_non_ascii");
      }
      return {
        arm,
        canonical_utf8_bytes: utf8ByteLength(canonical),
      };
    },
  );
  const maximum = Math.max(...shapes.map((shape) => shape.canonical_utf8_bytes));
  const responseBytes = maximum + RESPONSE_SAFETY_MARGIN_BYTES_V03;
  return Object.freeze({
    shapes: Object.freeze(shapes.map((shape) => Object.freeze(shape))),
    maximum_canonical_wire_response_bytes: maximum,
    safety_margin_bytes: RESPONSE_SAFETY_MARGIN_BYTES_V03,
    response_bytes: responseBytes,
    max_output_tokens: responseBytes,
    ascii_bytes_per_token_policy: 1 as const,
  });
}

export const OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03 =
  buildOperationalReentryMatchedCohortWireBudgetProofV03();

export const OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03 =
  Object.freeze({
    dynamicBytes: 10_240,
    finalRequestBytes: 24_576,
    responseBytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.response_bytes,
    maxOutputTokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03.max_output_tokens,
    timeoutMs: 30_000,
    continuationItems: 4,
    selectionProperties: 4,
  });

export function validateOperationalReentryMatchedCohortModelInputV03(
  value: unknown,
): OperationalReentryMatchedCohortModelInputV03 {
  if (!isRecordV03(value)) malformedV03();
  exactKeysV03(value, [
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
    value.codec_version !== OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04 ||
    !isRecordV03(value.invocation_context)
  ) {
    malformedV03();
  }
  exactKeysV03(value.invocation_context, [
    "cohort_ref",
    "call_slot_id",
    "repeat_block",
  ]);
  if (
    !safeTokenV03(value.invocation_context.cohort_ref) ||
    !safeTokenV03(value.invocation_context.call_slot_id) ||
    ![0, 1, 2, 3].includes(value.invocation_context.repeat_block as number)
  ) {
    malformedV03();
  }
  if (
    canonicalizeProtocolValueV01(value.common_task_evidence) !==
      canonicalizeProtocolValueV01(
        operationalReentryMatchedCohortCommonTaskEvidenceV02,
      ) ||
    !matchesOneExactShapeV03(value)
  ) {
    malformedV03();
  }
  return structuredClone(
    value,
  ) as unknown as OperationalReentryMatchedCohortModelInputV03;
}

export function projectOperationalReentryMatchedCohortModelMaterialV03(
  input: OperationalReentryMatchedCohortModelInputV03,
) {
  const validated = validateOperationalReentryMatchedCohortModelInputV03(input);
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
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.dynamicBytes,
  );
  return material;
}

export function buildOperationalReentryMatchedCohortSystemPromptV03(): string {
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
  input: OperationalReentryMatchedCohortModelInputV03,
) {
  const validated = validateOperationalReentryMatchedCohortModelInputV03(input);
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
      referenced_continuation_selections: selectionSchemaV03(continuationKeys),
      operation_action_class_selections: selectionSchemaV03(
        validated.allowed_output.operation_action_class_tokens,
      ),
      result_limitation_selections: selectionSchemaV03(
        validated.allowed_output.result_limitation_tokens,
      ),
      abstention: { type: "boolean" },
    },
  } as const;
}

export function parseOperationalReentryMatchedCohortOutputV03(
  outputText: string,
  input: OperationalReentryMatchedCohortModelInputV03,
): OperationalReentryMatchedCohortModelOutputV03 {
  const validated = validateOperationalReentryMatchedCohortModelInputV03(input);
  let output: unknown;
  try {
    output = JSON.parse(outputText) as unknown;
  } catch {
    invalidOutputV03("response_wire_json_invalid");
  }
  if (!isRecordV03(output)) invalidOutputV03("response_wire_shape_invalid");
  exactKeysV03(
    output,
    [
      "result_status",
      "required_check_disposition",
      "referenced_continuation_selections",
      "operation_action_class_selections",
      "result_limitation_selections",
      "abstention",
    ],
    () => invalidOutputV03("response_wire_shape_invalid"),
  );
  if (
    !validated.allowed_output.result_statuses.includes(
      output.result_status as OperationalReentryMatchedCohortModelOutputV03["result_status"],
    ) ||
    !validated.allowed_output.required_check_dispositions.includes(
      output.required_check_disposition as OperationalReentryMatchedCohortModelOutputV03["required_check"]["disposition"],
    ) ||
    typeof output.abstention !== "boolean"
  ) {
    invalidOutputV03("response_wire_value_invalid");
  }
  const referenced = selectedTokensV03(
    output.referenced_continuation_selections,
    validated.allowed_output.referenced_continuation_tokens,
    true,
  );
  const operations = selectedTokensV03(
    output.operation_action_class_selections,
    validated.allowed_output.operation_action_class_tokens,
  );
  const limitations = selectedTokensV03(
    output.result_limitation_selections,
    validated.allowed_output.result_limitation_tokens,
  );
  const derivedBase = {
    referenced_continuation_tokens: referenced,
    operation_action_class_tokens: operations,
    result_limitation_tokens: limitations,
  };
  let targetDisposition: OperationalReentryMatchedCohortModelOutputV03["target_disposition"];
  try {
    targetDisposition = deriveOperationalReentryMatchedCohortTargetDispositionV03(
      validated,
      derivedBase,
    );
  } catch {
    invalidOutputV03("response_local_derivation_invalid");
  }
  return {
    result_status:
      output.result_status as OperationalReentryMatchedCohortModelOutputV03["result_status"],
    common_task_evidence_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(validated.common_task_evidence),
    ),
    required_check: {
      check_token: validated.task.required_check,
      disposition:
        output.required_check_disposition as OperationalReentryMatchedCohortModelOutputV03["required_check"]["disposition"],
    },
    ...derivedBase,
    target_disposition: targetDisposition,
    abstention: output.abstention,
  };
}

export function buildOperationalReentryMatchedCohortProviderContractV03(): OperationalReentryMatchedCohortProviderContractV03 {
  const budget = OPERATIONAL_REENTRY_MATCHED_COHORT_WIRE_BUDGET_PROOF_V03;
  return sealV03("parser_closed_provider_contract_without_integrity_fingerprint", {
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    input_codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
    response_schema_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
    parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
    openai_adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
    strict_structured_output_supported_subset_required: true as const,
    parser_closed_wire_contract: true as const,
    selection_representation: "exact_required_boolean_objects" as const,
    common_task_evidence_fingerprint_locally_derived: true as const,
    required_check_token_locally_derived: true as const,
    target_disposition_locally_derived: true as const,
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
    successor_compatibility_result: "none" as const,
    successor_live_probe_authorized: false as const,
    behavioral_cohort_authorized: false as const,
    replication_authorized: false as const,
    policy_authorized: false as const,
    stage_7_authorized: false as const,
  });
}

function matchesOneExactShapeV03(
  value: Record<string, unknown>,
): boolean {
  return (["A", "B", "C", "D"] as const).some((arm) => {
    const expected = buildOperationalReentryMatchedCohortModelInputV03({
      arm,
      call_slot_id: value.invocation_context && isRecordV03(value.invocation_context)
        ? String(value.invocation_context.call_slot_id)
        : "invalid",
      block:
        value.invocation_context && isRecordV03(value.invocation_context)
          ? (value.invocation_context.repeat_block as 0 | 1 | 2 | 3)
          : 0,
    });
    return canonicalizeProtocolValueV01({
      task: value.task,
      common_task_evidence: value.common_task_evidence,
      continuation_context: value.continuation_context,
      stale_relation: value.stale_relation,
      allowed_output: value.allowed_output,
      authority_notice: value.authority_notice,
    }) === canonicalizeProtocolValueV01({
      task: expected.task,
      common_task_evidence: expected.common_task_evidence,
      continuation_context: expected.continuation_context,
      stale_relation: expected.stale_relation,
      allowed_output: expected.allowed_output,
      authority_notice: expected.authority_notice,
    });
  });
}

function selectionSchemaV03(tokens: readonly string[]) {
  return {
    type: "object",
    additionalProperties: false,
    required: [...tokens],
    properties: Object.fromEntries(
      tokens.map((token) => [token, { type: "boolean" as const }]),
    ),
  } as const;
}

function selectedTokensV03(
  value: unknown,
  canonicalTokens: readonly string[],
  allowEmptySentinel = false,
): string[] {
  if (!isRecordV03(value)) {
    invalidOutputV03("response_wire_selection_invalid");
  }
  const expectedKeys =
    allowEmptySentinel && canonicalTokens.length === 0
      ? [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]
      : [...canonicalTokens];
  exactKeysV03(
    value,
    expectedKeys,
    () => invalidOutputV03("response_wire_selection_invalid"),
  );
  if (expectedKeys.some((key) => typeof value[key] !== "boolean")) {
    invalidOutputV03("response_wire_selection_invalid");
  }
  return canonicalTokens.filter((token) => value[token] === true);
}

function exactKeysV03(
  value: Record<string, unknown>,
  expected: readonly string[],
  onInvalid: () => never = malformedV03,
): void {
  if (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) !==
    canonicalizeProtocolValueV01([...expected].sort())
  ) {
    onInvalid();
  }
}

function safeTokenV03(value: unknown): value is string {
  return typeof value === "string" && SAFE_TOKEN.test(value);
}

function isRecordV03(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sealV03<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV03 } {
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

function malformedV03(): never {
  return refuseModelEgress(PURPOSE, "model_egress_payload_malformed");
}

function invalidOutputV03(
  stage: ModelProviderResponseInvalidStageV01,
): never {
  throw new OperationalReentryMatchedCohortOutputInvalidErrorV03(stage);
}
