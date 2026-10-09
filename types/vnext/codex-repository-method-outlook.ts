import type { CodexRepositoryWorkSourcesV01 } from "./codex-repository-work-sources";
import type { RetryInspectionOutlook } from "@/lib/vnext/retry-inspection-outlook";

export const CODEX_REPOSITORY_METHOD_OUTLOOK_VERSION = "codex_repository_method_outlook.v0.1" as const;
export const CODEX_REPOSITORY_METHOD_OUTLOOK_MARKER = "codex-repository-method-outlook-v0.1" as const;

/** Explicit private projection; no change to Resume or selected-source DTOs. */
export interface CodexRepositoryMethodOutlookV01 {
  projection_version: typeof CODEX_REPOSITORY_METHOD_OUTLOOK_VERSION;
  status: "available" | "absent" | "refresh_required" | "unavailable";
  reason: "frozen_method_outlook" | "no_optional_outlook" | "snapshot_changed" | "repository_unresolved" |
    "current_work_unavailable" | "outlook_unavailable";
  repository_resolution: CodexRepositoryWorkSourcesV01["repository_resolution"];
  snapshot_binding: string | null;
  packet: { packet_id: string; packet_fingerprint: string; packet_version: "task_context_packet.v0.1" } | null;
  outlook: RetryInspectionOutlook | null;
  applicability: {
    status: "conditional" | "reconsideration_required";
    evaluated_at: string;
    reasons: Array<"horizon_expired_or_missing" | "project_direction_changed" | "packet_not_fresh">;
    guidance: string;
  } | null;
  sources: CodexRepositoryWorkSourcesV01["sources"];
  source_material_authority: "untrusted_selected_context";
  authority: CodexRepositoryWorkSourcesV01["authority"];
}
