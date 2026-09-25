import type { CodexCurrentContinuityAuthorityBoundaryV01 } from "./codex-current-continuity";
import type { CodexRepositoryResolutionStatusV01 } from "./codex-repository-continuity";
import type { TaskContextPacketSelectedEntryV01 } from "./task-context-packet";
import type { ProjectWorkDefinitionV01 } from "./project-work-initialization";

/** Rebuildable local-client projection, never a persisted record or authority. */
export const CODEX_REPOSITORY_WORK_SOURCES_VERSION_V01 = "codex_repository_work_sources.v0.1" as const;
export const CODEX_REPOSITORY_WORK_SOURCES_ROUTE_MARKER_V01 = "codex-repository-work-sources-v0.1" as const;
export const CODEX_REPOSITORY_WORK_DEFINITION_SOURCES_VERSION_V01 = "codex_repository_work_definition_sources.v0.1" as const;

export interface CodexRepositoryWorkSourcesV01 {
  projection_version: typeof CODEX_REPOSITORY_WORK_SOURCES_VERSION_V01;
  status: "available" | "refresh_required" | "unavailable";
  reason: "current_selected_sources" | "snapshot_changed" | "repository_unresolved" | "current_work_unavailable";
  repository_resolution: Exclude<CodexRepositoryResolutionStatusV01, "companion_unavailable">;
  snapshot_binding: string | null;
  packet_fingerprint: string | null;
  sources: Array<{
    source_binding: string;
    excerpt_text: string;
    source_locator: string | null;
    source_locator_status: "included_export_safe" | "omitted_not_export_safe";
    trust_class: TaskContextPacketSelectedEntryV01["trust_class"];
    review_label: string;
    observed_at: string | null;
    currentness: Pick<TaskContextPacketSelectedEntryV01["currentness"], "status" | "as_of" | "basis">;
  }>;
  source_material_authority: "untrusted_selected_context";
  authority: CodexCurrentContinuityAuthorityBoundaryV01;
}

/** Explicit private read mode; the default source-only DTO remains unchanged. */
export interface CodexRepositoryWorkDefinitionSourcesV01 extends Omit<CodexRepositoryWorkSourcesV01, "projection_version" | "reason"> {
  projection_version: typeof CODEX_REPOSITORY_WORK_DEFINITION_SOURCES_VERSION_V01;
  reason: CodexRepositoryWorkSourcesV01["reason"] | "work_definition_out_of_bounds";
  work_definition: ProjectWorkDefinitionV01 | null;
}

export type CodexRepositoryWorkSourcesReadV01 = CodexRepositoryWorkSourcesV01 | CodexRepositoryWorkDefinitionSourcesV01;
