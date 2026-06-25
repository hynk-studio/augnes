export type FoundationLifecycleReviewMemoryReadonlyUiVersion =
  "foundation_lifecycle_review_memory_readonly_ui.v0.1";

export type FoundationLifecycleReviewMemoryReadonlyUiStatus = "readonly_ui_only";

export type FoundationLifecycleReviewMemoryReadonlyUiSectionKind =
  | "foundation_status"
  | "lifecycle_summary"
  | "calibration_summary"
  | "logical_claim_shape_summary"
  | "feedback_to_rule_summary"
  | "temporal_handoff_summary"
  | "target_agent_profile_summary"
  | "review_memory_snapshot_summary"
  | "authority_boundary"
  | "deferred_work";

export interface FoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary {
  readonly_ui_only: true;
  route_get_only: true;
  route_post_now: false;
  automatic_write_on_load: false;
  direct_file_write_now: false;
  direct_store_helper_write_now: false;
  new_api_route_added_now: false;
  db_migration_added_now: false;
  db_query_or_write_now: false;
  provider_openai_call_now: false;
  source_fetch_now: false;
  retrieval_rag_execution_now: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface FoundationLifecycleReviewMemoryReadonlyUiPanelState {
  ui_version: FoundationLifecycleReviewMemoryReadonlyUiVersion;
  status: FoundationLifecycleReviewMemoryReadonlyUiStatus;
  store_file_path: string;
  as_of: string;
  loaded_route_status?: "ok" | "error" | "not_loaded";
  loaded_record_count?: number;
  section_kinds: FoundationLifecycleReviewMemoryReadonlyUiSectionKind[];
  boundary_notes: string[];
  authority_boundary: FoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary;
}

export interface FoundationLifecycleReviewMemoryReadonlySection {
  section_kind: FoundationLifecycleReviewMemoryReadonlyUiSectionKind;
  title: string;
  status: string;
  summary: string;
  metrics: Record<string, number | string>;
  boundary_note: string;
}

const defaultStorePath = "tmp/research-candidate-review-memory/ui-preview-store.json" as const;

const sectionKinds: FoundationLifecycleReviewMemoryReadonlyUiSectionKind[] = [
  "foundation_status",
  "lifecycle_summary",
  "calibration_summary",
  "logical_claim_shape_summary",
  "feedback_to_rule_summary",
  "temporal_handoff_summary",
  "target_agent_profile_summary",
  "review_memory_snapshot_summary",
  "authority_boundary",
  "deferred_work",
];

const boundaryNotes = [
  "Read-only UI.",
  "Product-write remains parked by #686.",
  "Review memory is not truth.",
  "Candidate memory is not Perspective state.",
  "Lifecycle status is derived review context, not source of truth.",
  "Calibration context is diagnostic, not readiness authority.",
  "Logical shape context is structure-only, not proof.",
  "Feedback-to-Rule context is candidate-only, not rule mutation.",
  "Temporal handoff context is diagnostic, not authority.",
  "Target-agent packet profile is advisory, not prompt execution.",
  "Discard is not deletion.",
  "Supersede preserves lineage.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Store paths remain constrained by the #771 route allowlist.",
  "UI is read-only and does not perform automatic background writes.",
] as const;

const readonlySections: FoundationLifecycleReviewMemoryReadonlySection[] = [
  {
    section_kind: "foundation_status",
    title: "Foundation Status",
    status: "foundation_status_review.v0.1",
    summary: "Foundation status identifies completed roadmap rails and keeps product-write parked.",
    metrics: {
      merged_baseline_prs: 12,
      current_phase: "Phase 2 read-only UI consolidation",
      product_write_parked_by: "#686",
    },
    boundary_note: "Foundation status is planning context only.",
  },
  {
    section_kind: "lifecycle_summary",
    title: "Lifecycle Summary",
    status: "derived_read_model_only",
    summary: "Lifecycle summaries group candidate review states without becoming truth.",
    metrics: {
      candidate_summaries: 8,
      needs_review: 3,
      ready_with_tensions: 2,
    },
    boundary_note: "Lifecycle status is derived review context, not source of truth.",
  },
  {
    section_kind: "calibration_summary",
    title: "Calibration Summary",
    status: "diagnostic_only",
    summary: "Calibration diagnostics surface risk cues for operator review.",
    metrics: {
      diagnostics: 11,
      invalidation_cues: 2,
      overclaim_cues: 2,
    },
    boundary_note: "Calibration context is diagnostic, not readiness authority.",
  },
  {
    section_kind: "logical_claim_shape_summary",
    title: "Logical Claim Shape Summary",
    status: "structure_preview_only",
    summary: "Logical shape previews show bounded structure and unresolved relationships.",
    metrics: {
      claim_shapes: 9,
      contradiction_shapes: 2,
      missing_source_shapes: 2,
    },
    boundary_note: "Logical shape context is structure-only, not proof.",
  },
  {
    section_kind: "feedback_to_rule_summary",
    title: "Feedback-to-Rule Summary",
    status: "candidate_contract_only",
    summary: "Feedback-to-Rule candidates summarize repeated feedback without mutating rules.",
    metrics: {
      candidates: 7,
      repeated_feedback_groups: 3,
      rule_mutations_now: 0,
    },
    boundary_note: "Feedback-to-Rule context is candidate-only, not rule mutation.",
  },
  {
    section_kind: "temporal_handoff_summary",
    title: "Temporal Handoff Summary",
    status: "diagnostic_preview_only",
    summary: "Temporal handoff diagnostics summarize handoff completeness and omissions.",
    metrics: {
      sections: 7,
      handoff_profiles: 4,
      authority_grants: 0,
    },
    boundary_note: "Temporal handoff context is diagnostic, not authority.",
  },
  {
    section_kind: "target_agent_profile_summary",
    title: "Target-Agent Packet Profile Summary",
    status: "profile_preview_only",
    summary: "Target-agent profiles summarize packet shape for human, ChatGPT, Codex, and dogfood review.",
    metrics: {
      profiles: 5,
      prompt_execution_now: 0,
      provider_calls_now: 0,
    },
    boundary_note: "Target-agent packet profile is advisory, not prompt execution.",
  },
  {
    section_kind: "review_memory_snapshot_summary",
    title: "Review Memory Snapshot Summary",
    status: "route_get_optional",
    summary: "Review memory rows are bounded metadata summaries loaded through GET only when requested.",
    metrics: {
      sample_records: 3,
      active_rows: 1,
      discarded_rows: 1,
      superseded_rows: 1,
    },
    boundary_note: "Review memory is not truth.",
  },
  {
    section_kind: "authority_boundary",
    title: "Authority Boundary",
    status: "readonly_ui_only",
    summary: "The page displays summaries only and grants no execution, write, promotion, or product authority.",
    metrics: {
      route_get_only: "true",
      route_post_now: "false",
      product_write_authority: "false",
    },
    boundary_note: "UI is read-only and does not perform automatic background writes.",
  },
  {
    section_kind: "deferred_work",
    title: "Deferred Work",
    status: "not_implemented_here",
    summary: "Runtime intake, provider extraction, retrieval, promotion, durable state, Git Ledger, and product-write reentry remain deferred.",
    metrics: {
      deferred_runtime_slices: 14,
      implemented_in_this_pr: 0,
      product_write_reentry_now: 0,
    },
    boundary_note: "Product-write remains parked by #686.",
  },
];

const unsafeDisplayPatterns = [
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
  /raw source body/i,
  /raw provider output/i,
  /raw conversation/i,
  /raw candidate payload/i,
  /hidden reasoning/i,
  /raw db row/i,
  /raw_db_row/i,
  /browser dump/i,
  /sk-/i,
  /ghp_/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
] as const;

export function getFoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary(): FoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary {
  return {
    readonly_ui_only: true,
    route_get_only: true,
    route_post_now: false,
    automatic_write_on_load: false,
    direct_file_write_now: false,
    direct_store_helper_write_now: false,
    new_api_route_added_now: false,
    db_migration_added_now: false,
    db_query_or_write_now: false,
    provider_openai_call_now: false,
    source_fetch_now: false,
    retrieval_rag_execution_now: false,
    source_of_truth: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state: false,
    work_mutation: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    git_ledger_export_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

export function getFoundationLifecycleReviewMemoryReadonlyUiBoundaryNotes(): string[] {
  return [...boundaryNotes];
}

export function getDefaultFoundationLifecycleReviewMemoryStorePath(): string {
  return defaultStorePath;
}

export function isSafeFoundationLifecycleReviewMemoryDisplayText(value: unknown): boolean {
  if (typeof value !== "string") return true;
  return !unsafeDisplayPatterns.some((pattern) => pattern.test(value));
}

export function getFoundationLifecycleReviewMemoryReadonlySections(): FoundationLifecycleReviewMemoryReadonlySection[] {
  return readonlySections.map((section) => ({
    ...section,
    metrics: { ...section.metrics },
  }));
}

export function getFoundationLifecycleReviewMemoryReadonlySectionKinds(): FoundationLifecycleReviewMemoryReadonlyUiSectionKind[] {
  return [...sectionKinds];
}
