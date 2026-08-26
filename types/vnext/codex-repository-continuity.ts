import type {
  CodexCurrentContinuityAuthorityBoundaryV01,
  CodexCurrentContinuityV01,
} from "@/types/vnext/codex-current-continuity";
import type { RepositoryRunResumeEligibilityV01 } from "@/types/vnext/repository-run-resume";

export const CODEX_REPOSITORY_CONTINUITY_VERSION_V01 =
  "codex_repository_continuity.v0.1" as const;
export const CODEX_REPOSITORY_CONTINUITY_ROUTE_MARKER_V01 =
  "codex-repository-continuity-v0.1" as const;

export type CodexRepositoryResolutionStatusV01 =
  | "resolved_exact"
  | "project_not_registered"
  | "project_ambiguous"
  | "root_unavailable"
  | "repository_input_invalid"
  | "companion_unavailable";

export interface CodexRepositoryContinuityV01 {
  projection_version: typeof CODEX_REPOSITORY_CONTINUITY_VERSION_V01;
  generated_at: string;
  repository_resolution: {
    status: CodexRepositoryResolutionStatusV01;
    project_key: string | null;
    display_name: string | null;
    message: string;
  };
  continuity: CodexCurrentContinuityV01 | null;
  resume_eligibility: RepositoryRunResumeEligibilityV01 | null;
  current_situation: string;
  next_meaningful_action: {
    label: string;
    reason: string;
    executes: false;
  };
  browser_deep_link: string | null;
  authority: CodexCurrentContinuityAuthorityBoundaryV01;
}
