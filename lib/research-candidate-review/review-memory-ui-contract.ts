export type ReviewMemoryUiVersion = "research_candidate_review_memory_ui.v0.1";

export type ReviewMemoryUiStatus = "ui_route_client_only";

export type ReviewMemoryUiAction =
  | "load_snapshot"
  | "create_empty_snapshot"
  | "upsert_record"
  | "discard_record"
  | "supersede_record";

export interface ReviewMemoryUiAuthorityBoundary {
  ui_route_client_only: true;
  route_backed_only: true;
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

export interface ReviewMemoryUiPanelState {
  ui_version: ReviewMemoryUiVersion;
  status: ReviewMemoryUiStatus;
  store_file_path: string;
  as_of: string;
  selected_action?: ReviewMemoryUiAction;
  last_error_code?: string;
  last_route_status?: "ok" | "error";
  record_count?: number;
  boundary_notes: string[];
  authority_boundary: ReviewMemoryUiAuthorityBoundary;
}

const defaultStorePath = "tmp/research-candidate-review-memory/ui-preview-store.json" as const;

const boundaryNotes = [
  "Product-write remains parked by #686.",
  "Review memory is not truth.",
  "Candidate memory is not Perspective state.",
  "Discard is not deletion.",
  "Supersede preserves lineage.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Store paths remain constrained by the #771 route allowlist.",
  "UI actions are explicit operator actions, not automatic background writes.",
  "Review Memory UI is ui-route-client-only.",
] as const;

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

export function getReviewMemoryUiAuthorityBoundary(): ReviewMemoryUiAuthorityBoundary {
  return {
    ui_route_client_only: true,
    route_backed_only: true,
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

export function getReviewMemoryUiBoundaryNotes(): string[] {
  return [...boundaryNotes];
}

export function isSafeReviewMemoryUiDisplayText(value: unknown): boolean {
  if (typeof value !== "string") return true;
  return !unsafeDisplayPatterns.some((pattern) => pattern.test(value));
}

export function getDefaultReviewMemoryUiStorePath(): string {
  return defaultStorePath;
}
