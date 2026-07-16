import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

export const STRUCTURED_RUN_RECEIPT_ADMISSION_VERSION_V01 =
  "structured_run_receipt_admission.v0.1" as const;

export class StructuredRunReceiptAdmissionErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "StructuredRunReceiptAdmissionErrorV01";
  }
}

/**
 * The single structured RunReceipt admission boundary. Compatibility callers
 * may parse or map legacy material before this point; automatic callers pass a
 * structured receipt directly. The durable semantic store remains the writer
 * and source of replay/conflict truth.
 */
export function admitStructuredRunReceiptV01(
  db: Database.Database,
  receipt: RunReceiptV01,
): {
  status: "inserted" | "exact_replay";
  receipt: RunReceiptV01;
} {
  assertVNextDurableSemanticStoreSchemaV01(db);
  if (validateRunReceiptV01(receipt).status !== "valid") {
    throw new StructuredRunReceiptAdmissionErrorV01(
      "structured_run_receipt_invalid",
    );
  }
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: receipt.receipt_id,
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
    idempotency_key: receipt.idempotency_key,
    payload: receipt,
    created_at: receipt.recorded_at,
  });
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(write.record, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  if (
    write.record.record_id !== receipt.receipt_id ||
    write.record.idempotency_key !== receipt.idempotency_key ||
    write.record.created_at !== receipt.recorded_at ||
    validateRunReceiptV01(write.record.payload).status !== "valid"
  ) {
    throw new StructuredRunReceiptAdmissionErrorV01(
      "structured_run_receipt_envelope_mismatch",
    );
  }
  return {
    status: write.status,
    receipt: write.record.payload as RunReceiptV01,
  };
}
