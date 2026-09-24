import type { ProjectWorkDefinitionV01 } from "./project-work-initialization";
import type { RetainedWorkSourceRef, SelectedWorkSourceInput } from "./project-work-revision";
import type { CodexRepositoryWorkSourcesV01 } from "./codex-repository-work-sources";
import type { CodexCurrentContinuityAuthorityBoundaryV01 } from "./codex-current-continuity";

export const CODEX_REPOSITORY_WORK_REVISION_VERSION_V01 = "codex_repository_work_revision.v0.1" as const;
export const CODEX_REPOSITORY_WORK_REVISION_MARKER_V01 = "codex-repository-work-revision-v0.1" as const;

/** Request-only patch. Missing fields/notes are preserved by the canonical reader. */
export interface RepositoryWorkChangesV01 {
  goal?: string;
  success_criteria?: string[];
  non_goals?: string[];
  sources?: {
    add?: SelectedWorkSourceInput[];
    /** New-task preparation only: every current note is explicitly kept or omitted. */
    keep?: string[];
    omitted_sources?: Array<{ source_binding: string; reason: string }>;
    replace?: Array<{ source_binding: string; note: SelectedWorkSourceInput }>;
    deselect?: string[];
    retained_source_refs?: RetainedWorkSourceRef[];
  };
}

export interface RepositoryWorkRevisionInputV01 {
  action: "preview" | "save";
  repository_root: string;
  expected_snapshot_binding: string;
  changes: RepositoryWorkChangesV01;
  intent?: "new_task";
  preview_binding?: string;
}

/** Closed, rebuildable projection. No canonical records or authentication values. */
export interface RepositoryWorkRevisionProjectionV01 {
  projection_version: typeof CODEX_REPOSITORY_WORK_REVISION_VERSION_V01;
  status: "previewed" | "saved" | "exact_replay";
  expected_snapshot_binding: string;
  preview_binding: string;
  packet_fingerprint: string;
  definition: { before: ProjectWorkDefinitionV01; after: ProjectWorkDefinitionV01 };
  sources: {
    before: CodexRepositoryWorkSourcesV01["sources"];
    after: CodexRepositoryWorkSourcesV01["sources"];
    retained: string[];
    added: string[];
    deselected: string[];
  };
  effects: { work_revision_created: boolean; authorization_record_created: boolean; work_preparation_created?: boolean };
  preparation?: { prior_work_marked_complete: false; omitted_sources: Array<{ source_binding: string; reason: string }> };
  source_material_authority: "untrusted_selected_context";
  authority: Omit<CodexCurrentContinuityAuthorityBoundaryV01, "writes_database" | "changes_operator_session" | "retries_or_replays"> & {
    writes_database: boolean;
    changes_operator_session: boolean;
    retries_or_replays: boolean;
  };
}
