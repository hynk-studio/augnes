import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02,
  type RunReceiptModelInvocationEntryV02,
} from "@/types/vnext/run-receipt";

export type ModelInvocationRunReceiptProjectionErrorCodeV02 =
  | "model_invocation_projection_receipt_invalid"
  | "model_invocation_projection_origin_invalid"
  | "model_invocation_projection_scope_mismatch";

export class ModelInvocationRunReceiptProjectionErrorV02 extends Error {
  constructor(readonly code: ModelInvocationRunReceiptProjectionErrorCodeV02) {
    super("Model invocation could not be attached to the run receipt.");
    this.name = "ModelInvocationRunReceiptProjectionErrorV02";
  }
}

export function projectModelInvocationReceiptToRunReceiptEntryV02(input: {
  receipt: unknown;
  workspace_id: string;
  project_id: string;
  work_id: string;
  run_id: string;
}): RunReceiptModelInvocationEntryV02 {
  let receipt;
  try {
    receipt = validateModelInvocationReceiptV02(input.receipt);
  } catch {
    throw new ModelInvocationRunReceiptProjectionErrorV02(
      "model_invocation_projection_receipt_invalid",
    );
  }
  if (receipt.invocation_origin !== "policy_triggered") {
    throw new ModelInvocationRunReceiptProjectionErrorV02(
      "model_invocation_projection_origin_invalid",
    );
  }
  if (
    receipt.workspace_id !== input.workspace_id ||
    receipt.project_id !== input.project_id ||
    receipt.work_id !== input.work_id ||
    receipt.run_id !== input.run_id
  ) {
    throw new ModelInvocationRunReceiptProjectionErrorV02(
      "model_invocation_projection_scope_mismatch",
    );
  }
  const invocationRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "model_invocation",
    external_id: receipt.invocation_id,
    observed_at: receipt.finished_at,
    source_ref: receipt.receipt_version,
    trust_class: "direct_local_observation" as const,
  };
  const workRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "work",
    external_id: input.work_id,
    observed_at: receipt.finished_at,
    trust_class: "direct_local_observation" as const,
  };
  const runRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "automation_run",
    external_id: input.run_id,
    observed_at: receipt.finished_at,
    trust_class: "direct_local_observation" as const,
  };
  return {
    entry_version: RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02,
    invocation_ref: invocationRef,
    work_ref: workRef,
    run_ref: runRef,
    invocation_receipt: receipt,
    retry_count: 0,
    source_refs: uniqueRefs([
      invocationRef,
      workRef,
      runRef,
      receipt.grant_lineage_ref,
      receipt.automation_control_lineage_ref,
      receipt.attempted_provider_ref,
      receipt.attempted_model_ref,
    ]),
  };
}

function uniqueRefs<T>(values: readonly (T | null)[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    if (value === null) continue;
    const key = JSON.stringify(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}
