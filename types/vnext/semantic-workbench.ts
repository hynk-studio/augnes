export const SEMANTIC_WORKBENCH_ENTRY_VERSION_V01 =
  "semantic_workbench_entry.v0.1" as const;

export type SemanticWorkbenchEntryStateV01 =
  | "result_only"
  | "assessment"
  | "pending_proposal"
  | "decided_proposal"
  | "transition_blocked"
  | "transition_applied"
  | "feedback_needed";

export type SemanticWorkbenchEntryOriginV01 =
  | "interactive"
  | "policy_triggered"
  | "cross_host"
  | "unknown";

export interface SemanticWorkbenchEntryV01 {
  entry_version: typeof SEMANTIC_WORKBENCH_ENTRY_VERSION_V01;
  workspace_id: string;
  project_id: string;
  entry_state: SemanticWorkbenchEntryStateV01;
  origin: SemanticWorkbenchEntryOriginV01;
  source:
    | {
        record_kind: "run_receipt";
        record_id: string;
      }
    | {
        record_kind: "episode_delta_proposal";
        record_id: string;
      }
    | {
        record_kind: "project_review";
        record_id: null;
      };
  href: string;
  action_label: string;
  reason: string;
  review_required: boolean;
  server_scope_validation_required: true;
  projection_only: true;
  semantic_authority_granted: false;
}
