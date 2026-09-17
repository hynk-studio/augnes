import type { ExternalRefV01 } from "./external-ref";
import type { ProjectWorkDefinitionV01, ProjectWorkInitializationV01 } from "./project-work-initialization";
import type { TaskContextPacketSelectedEntryV01 } from "./task-context-packet";

/** Adapter contract only: not a Core record or a portable/recovery package. */
export const HOSTED_RESEARCH_PROJECTION_SCHEMA_V02 =
  "augnes.hosted-research-projection.v0.2" as const;

export interface HostedResearchSelectedSourceV02 {
  entry_id: string;
  source_fingerprint: string;
  excerpt_text: string;
  why_included: string;
  trust_class: TaskContextPacketSelectedEntryV01["trust_class"];
  observed_at: string | null;
  source_locator: string | null;
  source_locator_status: "included_export_safe" | "omitted_not_export_safe";
  currentness: TaskContextPacketSelectedEntryV01["currentness"];
  source_text_authority: "untrusted_source_text";
}

export interface HostedResearchProjectionV02 {
  schema: typeof HOSTED_RESEARCH_PROJECTION_SCHEMA_V02;
  envelope_kind: "hosted_projection_export_envelope";
  data_kind: "local_augnes_explicit_export";
  projection_authority: "non_authoritative";
  live_sync: false;
  local_augnes_currentness: "not_verified";
  semantic_authority_granted: false;
  execution_authority_granted: false;
  canonical_import_supported: false;
  captured_at: string;
  project: { workspace_id: string; project_id: string; display_name: string | null };
  work: ProjectWorkDefinitionV01 & { work_ref: string | ExternalRefV01 | null };
  source_binding: {
    initialization_version: ProjectWorkInitializationV01["initialization_version"];
    active_selection_revision: number;
    active_selection_selected_at: string;
    packet_id: string;
    packet_fingerprint: string;
    packet_generated_at: string;
    packet_expires_at: string | null;
    lineage_kind: NonNullable<ProjectWorkInitializationV01["current_packet"]>["lineage_kind"];
    currentness_at_capture: "locally_current_packet";
  };
  selected_source_context: HostedResearchSelectedSourceV02[];
  /** Empty means omitted, not that the project has no unresolved work. */
  unresolved: [];
  unresolved_scope: "not_included";
  limitations: string[];
  integrity: {
    canonicalization: "augnes-json-c14n-v0_1";
    fingerprint_scope: "projection_without_integrity";
    content_fingerprint: string;
  };
}
