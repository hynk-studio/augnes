import type { HandoffPacketExportedArtifact } from "@/types/handoff-packet-copy-export-preview";
import type { HandoffPacketCopyExportRecord } from "@/types/handoff-packet-copy-export-write";

export type ExportedHandoffPacketArtifactReadStatus =
  | "no_exported_handoff_packet_artifact"
  | "schema_missing"
  | "latest_exported_handoff_packet_artifact_available"
  | "db_missing"
  | "invalid_db_path";

/**
 * Historical read-model shape retained for delivery-spine type compatibility.
 * PR D removes the native-host copy/export producer and its runtime reader.
 */
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
