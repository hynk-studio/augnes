import type { CodexCurrentContinuityAuthorityBoundaryV01 } from "./codex-current-continuity";
import type { CodexRepositoryWorkSourcesV01 } from "./codex-repository-work-sources";
import type { RetainedWorkSourceRef } from "./project-work-revision";
import type { RETAINED_WORK_SOURCE_LIMITS } from "@/lib/intake/retained-work-source-recall";

export const CODEX_REPOSITORY_RETAINED_SOURCES_VERSION_V01 = "codex_repository_retained_sources.v0.1" as const;
export const CODEX_REPOSITORY_RETAINED_SOURCES_MARKER_V01 = "codex-repository-retained-sources-v0.1" as const;

/** Explicit local-client disclosure over eligible history, never a Core record. */
export interface CodexRepositoryRetainedSourcesV01 {
  projection_version: typeof CODEX_REPOSITORY_RETAINED_SOURCES_VERSION_V01;
  status: "available" | "refresh_required" | "unavailable" | "ineligible" | "invalid";
  reason: "retained_selected_sources" | "snapshot_changed" | "repository_unresolved" | "current_work_unavailable" |
    "work_revision_not_eligible" | "retained_source_query_invalid" | "retained_sources_invalid";
  repository_resolution: CodexRepositoryWorkSourcesV01["repository_resolution"];
  snapshot_binding: string | null;
  packet_fingerprint: string | null;
  lookup: null | {
    scope: "selected_note_snapshots_in_current_pre_execution_revision_chain";
    cutoff_recorded_at: string;
    limits: typeof RETAINED_WORK_SOURCE_LIMITS;
    scanned_packets: number;
    scanned_entry_occurrences: number;
    unique_entries: number;
    matching_entries: number;
    returned_entries: number;
    omitted_matching_entries: number;
    truncated: boolean;
    /** Bytes of the disclosed result rows only; no withheld-locator sizes. */
    result_utf8_bytes: number;
    results: Array<{
      source: RetainedWorkSourceRef;
      note: CodexRepositoryWorkSourcesV01["sources"][number];
      first_recorded_at: string;
      last_selected_at: string;
      packet_occurrences: number;
      selection: "currently_selected" | "historical_not_selected";
    }>;
    qualifications: string[];
  };
  source_material_authority: "untrusted_selected_context";
  authority: CodexCurrentContinuityAuthorityBoundaryV01;
}
