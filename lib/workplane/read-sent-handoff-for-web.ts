import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import {
  handoffSendWriteSchemaExistsV01,
  listHandoffSendRecordsV01,
  type HandoffSendWriteDbLike,
} from "@/lib/workplane/handoff-send-write";
import type {
  HandoffSendRecord,
  HandoffSendStoreResult,
} from "@/types/handoff-send-write";

export type SentHandoffReadStatus =
  | "no_handoff_send_fulfillment"
  | "latest_handoff_send_fulfillment_available"
  | "schema_missing"
  | "invalid_db_path";

export interface SentHandoffReadForWeb {
  read_version: "sent_handoff_read.v0.1";
  scope: "project:augnes";
  status: SentHandoffReadStatus;
  latest_record: HandoffSendRecord | null;
  latest_fulfillment_summary: {
    record_id: string | null;
    fulfillment_status: string | null;
    source_handoff_send_contract_record_ref: string | null;
    source_exported_artifact_ref: string | null;
    requested_send_execution_mode: string | null;
    requested_send_surface: string | null;
    requested_delivery_mode: string | null;
    requested_recipient_ref: string | null;
    payload_hash: string | null;
    payload_type: string | null;
    external_delivery_performed: false;
    provider_called: false;
  };
  authority_boundary: {
    read_only: true;
    can_write_db: false;
    can_create_schema: false;
    can_send_handoff: false;
    can_call_send_provider: false;
    can_call_external_messaging: false;
    can_call_email: false;
    can_call_slack: false;
    can_call_webhook: false;
    can_write_clipboard: false;
    can_download_file: false;
    can_write_arbitrary_file: false;
    can_mutate_memory: false;
    can_call_github: false;
    can_call_provider_openai: false;
  };
}

export function readSentHandoffForWebV01(
  input: {
    store_result?: HandoffSendStoreResult | null;
    records?: unknown[];
    db_path?: string | null;
  } = {},
): SentHandoffReadForWeb {
  if (input.store_result || input.records) {
    return buildRead(selectLatestRecord([
      ...(input.records ?? []),
      ...(input.store_result?.records ?? []),
    ]));
  }
  if (!input.db_path) return buildRead(null);
  if (!isSafeSentHandoffReadDbPathV01(input.db_path)) {
    return buildRead(null, "invalid_db_path");
  }
  const resolvedPath = resolve(process.cwd(), input.db_path);
  if (!existsSync(resolvedPath)) return buildRead(null);
  const db = new Database(resolvedPath, {
    readonly: true,
    fileMustExist: true,
  }) as Database.Database & HandoffSendWriteDbLike;
  try {
    if (!handoffSendWriteSchemaExistsV01(db)) {
      return buildRead(null, "schema_missing");
    }
    const result = listHandoffSendRecordsV01({ db, limit: 1 });
    return buildRead(result.records[0] ?? null);
  } finally {
    db.close();
  }
}

export function isSafeSentHandoffReadDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (
    value.includes("\\") ||
    value.includes("//") ||
    value.includes("..") ||
    value.includes("\0")
  ) {
    return false;
  }
  if (
    ![
      "tmp/handoff-sends/",
      ".tmp/handoff-sends/",
    ].some((prefix) => value.startsWith(prefix))
  ) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}

function selectLatestRecord(records: unknown[]): HandoffSendRecord | null {
  return records
    .filter(isHandoffSendRecord)
    .sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
}

function buildRead(
  record: HandoffSendRecord | null,
  status?: SentHandoffReadStatus,
): SentHandoffReadForWeb {
  return {
    read_version: "sent_handoff_read.v0.1",
    scope: "project:augnes",
    status:
      status ??
      (record
        ? "latest_handoff_send_fulfillment_available"
        : "no_handoff_send_fulfillment"),
    latest_record: record,
    latest_fulfillment_summary: {
      record_id: record?.record_id ?? null,
      fulfillment_status: record?.fulfillment_status ?? null,
      source_handoff_send_contract_record_ref:
        record?.source_handoff_send_contract_record_ref ?? null,
      source_exported_artifact_ref: record?.source_exported_artifact_ref ?? null,
      requested_send_execution_mode:
        record?.requested_send_execution_mode ?? null,
      requested_send_surface: record?.requested_send_surface ?? null,
      requested_delivery_mode: record?.requested_delivery_mode ?? null,
      requested_recipient_ref: record?.requested_recipient_ref ?? null,
      payload_hash: record?.payload_hash ?? null,
      payload_type: record?.payload_type ?? null,
      external_delivery_performed: false,
      provider_called: false,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_send_handoff: false,
      can_call_send_provider: false,
      can_call_external_messaging: false,
      can_call_email: false,
      can_call_slack: false,
      can_call_webhook: false,
      can_write_clipboard: false,
      can_download_file: false,
      can_write_arbitrary_file: false,
      can_mutate_memory: false,
      can_call_github: false,
      can_call_provider_openai: false,
    },
  };
}

function isHandoffSendRecord(value: unknown): value is HandoffSendRecord {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).record_version ===
        "handoff_send_record.v0.1",
  );
}
