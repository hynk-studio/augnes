import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import {
  handoffPacketCopyExportWriteSchemaExistsV01,
  readLatestExportedHandoffPacketArtifactV01,
  type HandoffPacketCopyExportWriteDbLike,
} from "@/lib/workplane/handoff-packet-copy-export-write";
import type { HandoffPacketExportedArtifact } from "@/types/handoff-packet-copy-export-preview";
import type {
  HandoffPacketCopyExportRecord,
  HandoffPacketCopyExportStoreResult,
} from "@/types/handoff-packet-copy-export-write";

export type ExportedHandoffPacketArtifactReadStatus =
  | "no_exported_handoff_packet_artifact"
  | "schema_missing"
  | "latest_exported_handoff_packet_artifact_available"
  | "db_missing"
  | "invalid_db_path";

export interface ExportedHandoffPacketArtifactRead {
  read_version: "exported_handoff_packet_artifact_read.v0.1";
  status: ExportedHandoffPacketArtifactReadStatus;
  scope: "project:augnes";
  latest_exported_artifact: HandoffPacketExportedArtifact | null;
  latest_record: HandoffPacketCopyExportRecord | null;
  summary: {
    exported_artifact_ref: string | null;
    source_copy_export_contract_record_ref: string | null;
    source_applied_handoff_context_snapshot_ref: string | null;
    packet_format: string | null;
    copy_export_target: string | null;
    as_of: string | null;
    packet_entry_count: number;
    packet_section_counts: Record<string, number>;
    has_markdown_payload: boolean;
    has_json_payload: boolean;
    has_capsule_payload: boolean;
    clipboard_write_still_pending: boolean;
    download_or_file_write_still_pending: boolean;
    send_still_pending: boolean;
  };
  authority_boundary: {
    read_only: true;
    can_write_db: false;
    can_create_schema: false;
    can_write_clipboard: false;
    can_download_file: false;
    can_write_arbitrary_file: false;
    can_send_handoff: false;
    can_mutate_memory: false;
    can_call_github: false;
    can_call_provider_openai: false;
  };
}

export function readExportedHandoffPacketArtifactForWebV01(
  input: {
    store_result?: HandoffPacketCopyExportStoreResult | null;
    records?: HandoffPacketCopyExportRecord[];
    db_path?: string | null;
  } = {},
): ExportedHandoffPacketArtifactRead {
  const fromStore =
    input.store_result?.exported_artifact ??
    input.store_result?.exported_artifacts?.[0] ??
    input.records?.[0]?.exported_packet_artifact ??
    null;
  const record =
    input.store_result?.record ??
    input.store_result?.records?.[0] ??
    input.records?.[0] ??
    null;
  if (fromStore) {
    return readResult(
      "latest_exported_handoff_packet_artifact_available",
      fromStore,
      record,
    );
  }
  if (input.db_path) {
    if (!isSafeExportedHandoffPacketArtifactReadDbPathV01(input.db_path)) {
      return readResult("invalid_db_path", null, null);
    }
    const resolvedPath = resolve(process.cwd(), input.db_path);
    if (!existsSync(resolvedPath)) return readResult("db_missing", null, null);
    const db = new Database(resolvedPath, {
      readonly: true,
      fileMustExist: true,
    }) as Database.Database & HandoffPacketCopyExportWriteDbLike;
    try {
      if (!handoffPacketCopyExportWriteSchemaExistsV01(db)) {
        return readResult("schema_missing", null, null);
      }
      const latest = readLatestExportedHandoffPacketArtifactV01({ db });
      return latest.exported_artifact
        ? readResult(
            "latest_exported_handoff_packet_artifact_available",
            latest.exported_artifact,
            latest.record,
          )
        : readResult("no_exported_handoff_packet_artifact", null, null);
    } finally {
      db.close();
    }
  }
  return readResult("no_exported_handoff_packet_artifact", null, null);
}

export function isSafeExportedHandoffPacketArtifactReadDbPathV01(
  value: unknown,
): value is string {
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
      "tmp/handoff-packet-copy-exports/",
      ".tmp/handoff-packet-copy-exports/",
    ].some((prefix) => value.startsWith(prefix))
  ) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}

function readResult(
  status: ExportedHandoffPacketArtifactReadStatus,
  artifact: HandoffPacketExportedArtifact | null,
  record: HandoffPacketCopyExportRecord | null,
): ExportedHandoffPacketArtifactRead {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    status,
    scope: "project:augnes",
    latest_exported_artifact: artifact,
    latest_record: record,
    summary: {
      exported_artifact_ref: artifact?.artifact_ref ?? null,
      source_copy_export_contract_record_ref:
        artifact?.source_copy_export_contract_record_ref ?? null,
      source_applied_handoff_context_snapshot_ref:
        artifact?.source_applied_handoff_context_snapshot_ref ?? null,
      packet_format: artifact?.packet_format ?? null,
      copy_export_target: artifact?.copy_export_target ?? null,
      as_of: artifact?.as_of ?? null,
      packet_entry_count: artifact?.packet_entry_count ?? 0,
      packet_section_counts: artifact?.packet_section_counts ?? {},
      has_markdown_payload: Boolean(artifact?.markdown_payload),
      has_json_payload: Boolean(artifact?.json_payload),
      has_capsule_payload: Boolean(artifact?.capsule_payload),
      clipboard_write_still_pending:
        artifact?.artifact_metadata.future_user_surface_copy_export_required ?? false,
      download_or_file_write_still_pending:
        artifact?.artifact_metadata.future_user_surface_copy_export_required ?? false,
      send_still_pending:
        artifact?.artifact_metadata.future_handoff_send_contract_required ?? false,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_write_clipboard: false,
      can_download_file: false,
      can_write_arbitrary_file: false,
      can_send_handoff: false,
      can_mutate_memory: false,
      can_call_github: false,
      can_call_provider_openai: false,
    },
  };
}
