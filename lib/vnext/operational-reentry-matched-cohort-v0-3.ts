import { operationalReentryMatchedCohortCaseFixtureV02 } from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortModelInputV02 } from "@/lib/vnext/operational-reentry-matched-cohort-v0-2";
import type {
  OperationalReentryMatchedCohortCaseV02,
  OperationalReentryMatchedCohortModelOutputV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03,
  type OperationalReentryMatchedCohortArmV03,
  type OperationalReentryMatchedCohortBlockV03,
  type OperationalReentryMatchedCohortModelInputV03,
  type OperationalReentryMatchedCohortWireOutputV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";

export const ACGC_E2_V03_CANONICAL_ORDER = Object.freeze([
  "A",
  "B",
  "C",
  "D",
] as const);

export function buildOperationalReentryMatchedCohortModelInputV03(input: {
  arm: OperationalReentryMatchedCohortArmV03;
  call_slot_id: string;
  block?: OperationalReentryMatchedCohortBlockV03;
  case_input?: OperationalReentryMatchedCohortCaseV02;
}): OperationalReentryMatchedCohortModelInputV03 {
  const historical = buildOperationalReentryMatchedCohortModelInputV02({
    arm: input.arm,
    block: input.block ?? 0,
    call_slot_id: input.call_slot_id,
    case_input:
      input.case_input ?? operationalReentryMatchedCohortCaseFixtureV02,
  });
  return {
    input_kind: "operational_reentry_matched_cohort_v03",
    codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04,
    invocation_context: {
      ...historical.invocation_context,
      cohort_ref: "acgc-e2r2p3h-parser-closed-v03",
    },
    task: structuredClone(historical.task),
    common_task_evidence: structuredClone(historical.common_task_evidence),
    continuation_context: structuredClone(historical.continuation_context),
    stale_relation: structuredClone(historical.stale_relation),
    allowed_output: {
      result_statuses: structuredClone(
        historical.allowed_output.result_statuses,
      ),
      required_check_dispositions: structuredClone(
        historical.allowed_output.required_check_dispositions,
      ),
      referenced_continuation_tokens: historical.continuation_context.map(
        (item) => item.context_token,
      ),
      operation_action_class_tokens: structuredClone(
        historical.allowed_output.operation_action_class_tokens,
      ),
      result_limitation_tokens: structuredClone(
        historical.allowed_output.result_limitation_tokens,
      ),
    },
    authority_notice: structuredClone(historical.authority_notice),
  };
}

export function buildOperationalReentryMatchedCohortRepresentativeInputsV03(): Array<{
  arm: OperationalReentryMatchedCohortArmV03;
  input: OperationalReentryMatchedCohortModelInputV03;
}> {
  return ACGC_E2_V03_CANONICAL_ORDER.map((arm, order) => ({
    arm,
    input: buildOperationalReentryMatchedCohortModelInputV03({
      arm,
      call_slot_id: `e2r2p3h-shape-${String(order).padStart(2, "0")}`,
    }),
  }));
}

export function buildOperationalReentryMatchedCohortGoldenWireOutputV03(
  arm: OperationalReentryMatchedCohortArmV03,
): OperationalReentryMatchedCohortWireOutputV03 {
  const input = buildOperationalReentryMatchedCohortModelInputV03({
    arm,
    call_slot_id: `e2r2p3h-golden-${arm.toLowerCase()}`,
  });
  const targetToken = input.continuation_context.find(
    (item) => item.role === "target",
  )?.context_token;
  const referenced = Object.fromEntries(
    input.allowed_output.referenced_continuation_tokens.map((token) => [
      token,
      arm === "A" ||
        input.continuation_context.some(
          (item) => item.role === "non_target" && item.context_token === token,
        ),
    ]),
  );
  return {
    result_status: "review_ready",
    required_check_disposition: "passed",
    referenced_continuation_selections:
      input.allowed_output.referenced_continuation_tokens.length === 0
        ? { [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]: false }
        : referenced,
    operation_action_class_selections: selectionObjectV03(
      input.allowed_output.operation_action_class_tokens,
      new Set([
        "bounded_result_review",
        "no_external_action",
        ...(arm === "A" && targetToken
          ? ["target_linked_verification_preparation"]
          : []),
      ]),
    ),
    result_limitation_selections: selectionObjectV03(
      input.allowed_output.result_limitation_tokens,
      new Set(["limitation_non_authoritative"]),
    ),
    abstention: false,
  };
}

export function buildOperationalReentryMatchedCohortMaximalWireOutputV03(
  input: OperationalReentryMatchedCohortModelInputV03,
): OperationalReentryMatchedCohortWireOutputV03 {
  return {
    result_status: "review_blocked",
    required_check_disposition: "blocked",
    referenced_continuation_selections:
      input.allowed_output.referenced_continuation_tokens.length === 0
        ? { [OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03]: false }
        : selectionObjectV03(
            input.allowed_output.referenced_continuation_tokens,
            new Set(),
          ),
    operation_action_class_selections: selectionObjectV03(
      input.allowed_output.operation_action_class_tokens,
      new Set(),
    ),
    result_limitation_selections: selectionObjectV03(
      input.allowed_output.result_limitation_tokens,
      new Set(),
    ),
    abstention: false,
  };
}

export function deriveOperationalReentryMatchedCohortTargetDispositionV03(
  input: OperationalReentryMatchedCohortModelInputV03,
  output: Pick<
    OperationalReentryMatchedCohortModelOutputV02,
    | "referenced_continuation_tokens"
    | "operation_action_class_tokens"
    | "result_limitation_tokens"
  >,
): OperationalReentryMatchedCohortModelOutputV02["target_disposition"] {
  const target = input.continuation_context.find(
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
  if (input.stale_relation) {
    return targetReferenced || targetStructured
      ? "stale_persisted"
      : "withheld_stale";
  }
  if (targetStructured) return "applied_to_structure";
  if (targetReferenced) return "reference_only";
  return "not_referenced";
}

function selectionObjectV03(
  tokens: readonly string[],
  selected: ReadonlySet<string>,
): Record<string, boolean> {
  return Object.fromEntries(tokens.map((token) => [token, selected.has(token)]));
}
