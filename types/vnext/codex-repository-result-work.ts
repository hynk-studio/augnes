import type { ProjectWorkDefinitionV01 } from "./project-work-initialization";
import type { SelectedWorkSourceInput } from "./project-work-revision";
import type { CodexRepositoryWorkSourcesV01 } from "./codex-repository-work-sources";
import type { RepositoryWorkRevisionProjectionV01 } from "./codex-repository-work-revision";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const CODEX_REPOSITORY_RESULT_WORK_VERSION_V01 = "codex_repository_result_work.v0.1" as const;
export const CODEX_REPOSITORY_RESULT_WORK_MARKER_V01 = "codex-repository-result-work-v0.1" as const;

export interface RepositoryResultWorkSourcesV01 {
  keep: string[];
  add: SelectedWorkSourceInput[];
  include_result: boolean;
  include_reviewed_outcome: boolean;
  omitted_sources: Array<{ source_binding: string; reason: string }>;
}
export interface RepositoryResultWorkInputV01 {
  action: "read" | "compare" | "preview" | "save";
  repository_root: string;
  expected_snapshot_binding: string;
  preparation_binding?: string;
  sources?: RepositoryResultWorkSourcesV01;
  definition?: ProjectWorkDefinitionV01;
  expected_source_comparison?: string;
  preview_binding?: string;
}

type Source = CodexRepositoryWorkSourcesV01["sources"][number];
type Currentness = Source["currentness"];
export interface RepositoryResultWorkPacketPreviewV01 {
  current_projection: null | {
    bounded_summary: string; as_of: string | null; currentness: Currentness; warnings: string[];
    items: Array<{ item_kind: string; summary: string; currentness: Currentness }>;
  };
  tensions: Array<{ summary: string; severity: string; currentness: Currentness }>;
  risks: Array<{ summary: string; severity: string; currentness: Currentness }>;
  gaps: Array<{ code: string; summary: string; severity: string; missing_fields: string[] }>;
  criterion_verification_plan: null;
  selected_context: Array<{
    entry_kind: string; source_binding: string | null; text: string | null;
    content_status: "included" | "withheld_authorship_material";
    reason: string; trust_class: string; currentness: Currentness;
  }>;
  excluded_context: Array<{ source_binding: string | null; reason: string; currentness: Currentness }>;
  constraints: TaskContextPacketV01["constraints"];
  return_contract: TaskContextPacketV01["return_contract"];
  source_status: { status: string; currentness: Currentness; warnings: string[] };
  capability_grant: null;
}
export interface RepositoryResultWorkProjectionV01 {
  projection_version: typeof CODEX_REPOSITORY_RESULT_WORK_VERSION_V01;
  status: "read" | "compared" | "previewed" | "saved";
  expected_snapshot_binding: string;
  preparation_binding: string;
  expected_source_comparison: string | null;
  preview_binding: string | null;
  packet_fingerprint: string | null;
  result: { execution_status: string; verification_status: string; recorded_at: string;
    report_source_status: "available" | "whole_note_unavailable" };
  definition: { before: ProjectWorkDefinitionV01; after: ProjectWorkDefinitionV01 | null };
  sources: {
    before: Source[]; after: Source[]; result: Source | null;
    reviewed_outcome: Source[]; reviewed_outcome_status: string;
    omitted_sources: Array<{ source_binding: string; reason: string }>;
    comparison: Array<{ source_binding: string; comparison: string; user_correction: boolean }>;
    unselected_previous: string[];
  };
  packet_preview: RepositoryResultWorkPacketPreviewV01 | null;
  effects: { successor_work_created: boolean; authorization_record_created: boolean };
  source_material_authority: "untrusted_selected_context";
  authority: RepositoryWorkRevisionProjectionV01["authority"];
}
