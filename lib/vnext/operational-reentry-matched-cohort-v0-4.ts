import { operationalReentryMatchedCohortCaseFixtureV02 } from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortModelInputV03 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-3";
import type { OperationalReentryMatchedCohortCaseV02 } from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
  type OperationalReentryMatchedCohortArmV04,
  type OperationalReentryMatchedCohortBlockV04,
  type OperationalReentryMatchedCohortInvocationV04,
  type OperationalReentryMatchedCohortModelOutputV04,
  type OperationalReentryMatchedCohortProviderMaterialV04,
  type OperationalReentryMatchedCohortWireOutputV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03 } from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

export const ACGC_E2_V04_CANONICAL_ORDER = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);

export function buildOperationalReentryMatchedCohortInvocationV04(input: {
  arm: OperationalReentryMatchedCohortArmV04;
  cohort_ref: string;
  call_slot_id: string;
  block?: OperationalReentryMatchedCohortBlockV04;
  case_input?: OperationalReentryMatchedCohortCaseV02;
}): OperationalReentryMatchedCohortInvocationV04 {
  if (!ACGC_E2_V04_CANONICAL_ORDER.includes(input.arm)) {
    throw new Error("operational_reentry_v04_arm_invalid");
  }
  const historical = buildOperationalReentryMatchedCohortModelInputV03({
    arm: input.arm,
    call_slot_id: input.call_slot_id,
    block: input.block ?? 0,
    case_input:
      input.case_input ?? operationalReentryMatchedCohortCaseFixtureV02,
  });
  return {
    input_kind: "operational_reentry_matched_cohort_v04",
    codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05,
    local_invocation_context: {
      cohort_ref: input.cohort_ref,
      call_slot_id: input.call_slot_id,
      repeat_block: input.block ?? 0,
    },
    provider_material: {
      task: structuredClone(historical.task),
      common_task_evidence: structuredClone(historical.common_task_evidence),
      continuation_context: structuredClone(historical.continuation_context),
      stale_relation: structuredClone(historical.stale_relation),
      allowed_output: structuredClone(historical.allowed_output),
      authority_notice: structuredClone(historical.authority_notice),
    },
  };
}

export function buildOperationalReentryMatchedCohortRepresentativeInvocationsV04(): Array<{
  arm: OperationalReentryMatchedCohortArmV04;
  invocation: OperationalReentryMatchedCohortInvocationV04;
}> {
  return ACGC_E2_V04_CANONICAL_ORDER.map((arm, order) => ({
    arm,
    invocation: buildOperationalReentryMatchedCohortInvocationV04({
      arm,
      cohort_ref: "acgc-e2r2p6b-v04-contract",
      call_slot_id: `e2r2p6b-v04-shape-${String(order).padStart(2, "0")}`,
      block: order as OperationalReentryMatchedCohortBlockV04,
    }),
  }));
}

export function buildOperationalReentryMatchedCohortGoldenWireOutputV04(
  arm: OperationalReentryMatchedCohortArmV04,
): OperationalReentryMatchedCohortWireOutputV04 {
  const material = buildOperationalReentryMatchedCohortInvocationV04({
    arm,
    cohort_ref: "acgc-e2r2p6b-v04-golden",
    call_slot_id: `e2r2p6b-v04-golden-${arm.toLowerCase()}`,
  }).provider_material;
  const targetToken = material.continuation_context.find(
    (item) => item.role === "target",
  )?.context_token;
  const referenced = Object.fromEntries(
    material.allowed_output.referenced_continuation_tokens.map((token) => [
      token,
      arm === "A" ||
        material.continuation_context.some(
          (item) => item.role === "non_target" && item.context_token === token,
        ),
    ]),
  );
  return {
    result_status: "review_ready",
    required_check_disposition: "passed",
    referenced_continuation_selections:
      material.allowed_output.referenced_continuation_tokens.length === 0
        ? { [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]: false }
        : referenced,
    operation_action_class_selections: selectionObjectV04(
      material.allowed_output.operation_action_class_tokens,
      new Set([
        "bounded_result_review",
        "no_external_action",
        ...(arm === "A" && targetToken
          ? ["target_linked_verification_preparation"]
          : []),
      ]),
    ),
    result_limitation_selections: selectionObjectV04(
      material.allowed_output.result_limitation_tokens,
      new Set(["limitation_non_authoritative"]),
    ),
    abstention: false,
  };
}

export function buildOperationalReentryMatchedCohortMaximalWireOutputV04(
  material: OperationalReentryMatchedCohortProviderMaterialV04,
): OperationalReentryMatchedCohortWireOutputV04 {
  return {
    result_status: "review_blocked",
    required_check_disposition: "blocked",
    referenced_continuation_selections:
      material.allowed_output.referenced_continuation_tokens.length === 0
        ? { [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]: false }
        : selectionObjectV04(
            material.allowed_output.referenced_continuation_tokens,
            new Set(),
          ),
    operation_action_class_selections: selectionObjectV04(
      material.allowed_output.operation_action_class_tokens,
      new Set(),
    ),
    result_limitation_selections: selectionObjectV04(
      material.allowed_output.result_limitation_tokens,
      new Set(),
    ),
    abstention: false,
  };
}

export function deriveOperationalReentryMatchedCohortTargetDispositionV04(
  material: OperationalReentryMatchedCohortProviderMaterialV04,
  output: Pick<
    OperationalReentryMatchedCohortModelOutputV04,
    | "referenced_continuation_tokens"
    | "operation_action_class_tokens"
    | "result_limitation_tokens"
  >,
): OperationalReentryMatchedCohortModelOutputV04["target_disposition"] {
  const target = material.continuation_context.find(
    (item) => item.role === "target",
  )?.context_token;
  if (!target) return "not_available";
  const targetReferenced = output.referenced_continuation_tokens.includes(target);
  const targetStructured =
    output.operation_action_class_tokens.includes(
      "target_linked_verification_preparation",
    ) ||
    output.result_limitation_tokens.includes(
      "limitation_stale_target_persisted",
    );
  if (material.stale_relation) {
    return targetReferenced || targetStructured
      ? "stale_persisted"
      : "withheld_stale";
  }
  if (targetStructured) return "applied_to_structure";
  if (targetReferenced) return "reference_only";
  return "not_referenced";
}

function selectionObjectV04(
  tokens: readonly string[],
  selected: ReadonlySet<string>,
): Record<string, boolean> {
  return Object.fromEntries(tokens.map((token) => [token, selected.has(token)]));
}
