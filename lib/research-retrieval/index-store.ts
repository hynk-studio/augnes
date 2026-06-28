import type { RebuildableRetrievalIndex } from "./rebuild-index";

export const RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_STORE_VERSION_V01 =
  "research_retrieval_index_runtime_completion_store.v0.1" as const;

export interface ResearchRetrievalIndexDbLikeV01 {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ResearchRetrievalIndexAuthorityBoundaryV01 {
  rebuildable_retrieval_index_runtime_now: true;
  explicit_operator_rebuild_only: true;
  explicit_operator_search_only: true;
  caller_injected_db_only: true;
  db_query_or_write_now: true;
  derived_index_write_now: boolean;
  derived_index_search_now: boolean;
  public_safe_derived_entries_only: true;
  stale_marker_visible: true;
  backrefs_visible: true;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  live_crawling_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  rag_answer_generation_now: false;
  raw_source_body_indexed_now: false;
  raw_provider_output_indexed_now: false;
  raw_retrieval_output_stored_now: false;
  hidden_reasoning_stored_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  retrieval_result_is_evidence: false;
  retrieval_result_is_truth: false;
  retrieval_score_is_truth: false;
  retrieval_score_is_promotion_readiness: false;
  rag_context_is_truth: false;
  source_ref_is_proof: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ResearchRetrievalIndexStoreEntryV01 {
  index_entry_id: string;
  index_version: string;
  scope: string;
  source_surface: string;
  source_record_ref: string;
  source_ref_id: string | null;
  candidate_ref: string | null;
  review_record_ref: string | null;
  promotion_decision_ref: string | null;
  formation_receipt_ref: string | null;
  perspective_id: string | null;
  feedback_ref: string | null;
  provider_extraction_ref: string | null;
  bounded_source_intake_ref: string | null;
  bounded_title: string;
  bounded_summary: string;
  token_terms: string[];
  public_safe: boolean;
  stale_marker: "fresh" | "stale" | "unknown";
  source_updated_at: string;
  indexed_at: string;
  reason_codes: string[];
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
}

export interface ResearchRetrievalIndexReplaceInputV01 {
  rebuild_version: string;
  scope: "project:augnes";
  rebuild_request_id: string;
  requested_by: string;
  requested_at: string;
  db_path?: string;
  index_version: string;
  entries: ResearchRetrievalIndexStoreEntryV01[];
  rebuild_policy?: string;
  stale_policy?: string;
  authority_boundary?: Record<string, unknown>;
  reason_codes?: string[];
}

export interface ResearchRetrievalIndexMetadataV01 {
  store_version: typeof RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_STORE_VERSION_V01;
  schema_exists: boolean;
  scope: "project:augnes";
  index_versions: string[];
  entry_count: number;
  term_count: number;
  rebuild_count: number;
  stale_count: number;
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
}

const researchRetrievalIndexSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS research_retrieval_index_entries (
  index_entry_id TEXT PRIMARY KEY,
  index_version TEXT NOT NULL,
  scope TEXT NOT NULL,
  source_surface TEXT NOT NULL,
  source_record_ref TEXT NOT NULL,
  source_ref_id TEXT,
  candidate_ref TEXT,
  review_record_ref TEXT,
  promotion_decision_ref TEXT,
  formation_receipt_ref TEXT,
  perspective_id TEXT,
  feedback_ref TEXT,
  provider_extraction_ref TEXT,
  bounded_source_intake_ref TEXT,
  bounded_title TEXT NOT NULL,
  bounded_summary TEXT NOT NULL,
  token_terms_json TEXT NOT NULL,
  public_safe INTEGER NOT NULL CHECK (public_safe IN (0, 1)),
  stale_marker TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  indexed_at TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_retrieval_index_entries_scope_version
  ON research_retrieval_index_entries(scope, index_version);

CREATE INDEX IF NOT EXISTS idx_research_retrieval_index_entries_surface
  ON research_retrieval_index_entries(scope, source_surface, source_record_ref);

CREATE INDEX IF NOT EXISTS idx_research_retrieval_index_entries_backrefs
  ON research_retrieval_index_entries(scope, source_ref_id, candidate_ref, review_record_ref, feedback_ref);

CREATE TABLE IF NOT EXISTS research_retrieval_index_terms (
  index_entry_id TEXT NOT NULL,
  index_version TEXT NOT NULL,
  scope TEXT NOT NULL,
  term TEXT NOT NULL,
  term_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (index_entry_id, term),
  FOREIGN KEY (index_entry_id) REFERENCES research_retrieval_index_entries(index_entry_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_research_retrieval_index_terms_lookup
  ON research_retrieval_index_terms(scope, index_version, term);

CREATE TABLE IF NOT EXISTS research_retrieval_index_rebuilds (
  rebuild_request_id TEXT PRIMARY KEY,
  rebuild_version TEXT NOT NULL,
  scope TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  index_version TEXT NOT NULL,
  entry_count INTEGER NOT NULL,
  stale_count INTEGER NOT NULL,
  reason_codes_json TEXT NOT NULL,
  authority_boundary_json TEXT NOT NULL
);
`;

export function createResearchRetrievalIndexAuthorityBoundaryV01(options?: {
  derived_index_write_now?: boolean;
  derived_index_search_now?: boolean;
}): ResearchRetrievalIndexAuthorityBoundaryV01 {
  return {
    rebuildable_retrieval_index_runtime_now: true,
    explicit_operator_rebuild_only: true,
    explicit_operator_search_only: true,
    caller_injected_db_only: true,
    db_query_or_write_now: true,
    derived_index_write_now: options?.derived_index_write_now === true,
    derived_index_search_now: options?.derived_index_search_now === true,
    public_safe_derived_entries_only: true,
    stale_marker_visible: true,
    backrefs_visible: true,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    live_crawling_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    rag_answer_generation_now: false,
    raw_source_body_indexed_now: false,
    raw_provider_output_indexed_now: false,
    raw_retrieval_output_stored_now: false,
    hidden_reasoning_stored_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    retrieval_result_is_evidence: false,
    retrieval_result_is_truth: false,
    retrieval_score_is_truth: false,
    retrieval_score_is_promotion_readiness: false,
    rag_context_is_truth: false,
    source_ref_is_proof: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function ensureResearchRetrievalIndexSchemaV01(
  db: ResearchRetrievalIndexDbLikeV01,
): void {
  db.exec(researchRetrievalIndexSchemaSqlV01);
}

export function researchRetrievalIndexSchemaExistsV01(
  db: ResearchRetrievalIndexDbLikeV01,
): boolean {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table'
       AND name IN (
        'research_retrieval_index_entries',
        'research_retrieval_index_terms',
        'research_retrieval_index_rebuilds'
       )`,
    )
    .all() as Array<{ name: string }>;
  return new Set(tables.map((row) => row.name)).size === 3;
}

export function replaceResearchRetrievalIndexEntriesV01(
  input: ResearchRetrievalIndexReplaceInputV01,
  db: ResearchRetrievalIndexDbLikeV01,
): {
  status: "rebuilt" | "blocked_invalid_input";
  entry_count: number;
  stale_count: number;
  index_version: string;
  authority_boundary: ResearchRetrievalIndexAuthorityBoundaryV01;
  reason_codes: string[];
} {
  const authorityBoundary = createResearchRetrievalIndexAuthorityBoundaryV01({
    derived_index_write_now: true,
  });
  if (
    input.scope !== "project:augnes" ||
    !input.index_version ||
    !Array.isArray(input.entries)
  ) {
    return {
      status: "blocked_invalid_input",
      entry_count: 0,
      stale_count: 0,
      index_version: String(input.index_version ?? ""),
      authority_boundary: authorityBoundary,
      reason_codes: ["blocked_invalid_input"],
    };
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM research_retrieval_index_terms WHERE scope = ? AND index_version = ?").run(
      input.scope,
      input.index_version,
    );
    db.prepare("DELETE FROM research_retrieval_index_entries WHERE scope = ? AND index_version = ?").run(
      input.scope,
      input.index_version,
    );

    const insertEntry = db.prepare(
      `INSERT INTO research_retrieval_index_entries (
        index_entry_id,
        index_version,
        scope,
        source_surface,
        source_record_ref,
        source_ref_id,
        candidate_ref,
        review_record_ref,
        promotion_decision_ref,
        formation_receipt_ref,
        perspective_id,
        feedback_ref,
        provider_extraction_ref,
        bounded_source_intake_ref,
        bounded_title,
        bounded_summary,
        token_terms_json,
        public_safe,
        stale_marker,
        source_updated_at,
        indexed_at,
        reason_codes_json,
        authority_boundary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertTerm = db.prepare(
      `INSERT INTO research_retrieval_index_terms (
        index_entry_id,
        index_version,
        scope,
        term,
        term_count
      ) VALUES (?, ?, ?, ?, ?)`,
    );

    for (const entry of input.entries) {
      insertEntry.run(
        entry.index_entry_id,
        entry.index_version,
        entry.scope,
        entry.source_surface,
        entry.source_record_ref,
        entry.source_ref_id,
        entry.candidate_ref,
        entry.review_record_ref,
        entry.promotion_decision_ref,
        entry.formation_receipt_ref,
        entry.perspective_id,
        entry.feedback_ref,
        entry.provider_extraction_ref,
        entry.bounded_source_intake_ref,
        entry.bounded_title,
        entry.bounded_summary,
        JSON.stringify([...entry.token_terms].sort()),
        entry.public_safe ? 1 : 0,
        entry.stale_marker,
        entry.source_updated_at,
        entry.indexed_at,
        JSON.stringify([...entry.reason_codes].sort()),
        JSON.stringify(entry.authority_boundary),
      );
      const termCounts = new Map<string, number>();
      for (const term of entry.token_terms) {
        termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
      }
      for (const [term, count] of [...termCounts.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      )) {
        insertTerm.run(entry.index_entry_id, entry.index_version, entry.scope, term, count);
      }
    }

    const staleCount = input.entries.filter((entry) => entry.stale_marker === "stale").length;
    db.prepare(
      `INSERT OR REPLACE INTO research_retrieval_index_rebuilds (
        rebuild_request_id,
        rebuild_version,
        scope,
        requested_by,
        requested_at,
        index_version,
        entry_count,
        stale_count,
        reason_codes_json,
        authority_boundary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.rebuild_request_id,
      input.rebuild_version,
      input.scope,
      input.requested_by,
      input.requested_at,
      input.index_version,
      input.entries.length,
      staleCount,
      JSON.stringify([...(input.reason_codes ?? []), "derived_index_write_now"].sort()),
      JSON.stringify(authorityBoundary),
    );
    db.exec("COMMIT");
    return {
      status: "rebuilt",
      entry_count: input.entries.length,
      stale_count: staleCount,
      index_version: input.index_version,
      authority_boundary: authorityBoundary,
      reason_codes: [
        "rebuildable_retrieval_index_runtime_completion",
        "derived_index_write_now",
        "index_is_derived",
        "index_is_rebuildable",
      ],
    };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function readResearchRetrievalIndexMetadataV01(
  db: ResearchRetrievalIndexDbLikeV01,
): ResearchRetrievalIndexMetadataV01 {
  const schemaExists = researchRetrievalIndexSchemaExistsV01(db);
  if (!schemaExists) {
    return {
      store_version: RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_STORE_VERSION_V01,
      schema_exists: false,
      scope: "project:augnes",
      index_versions: [],
      entry_count: 0,
      term_count: 0,
      rebuild_count: 0,
      stale_count: 0,
      authority_boundary: createResearchRetrievalIndexAuthorityBoundaryV01(),
    };
  }
  const entryCount = scalarCount(db, "SELECT COUNT(*) AS count FROM research_retrieval_index_entries");
  const termCount = scalarCount(db, "SELECT COUNT(*) AS count FROM research_retrieval_index_terms");
  const rebuildCount = scalarCount(db, "SELECT COUNT(*) AS count FROM research_retrieval_index_rebuilds");
  const staleCount = scalarCount(
    db,
    "SELECT COUNT(*) AS count FROM research_retrieval_index_entries WHERE stale_marker = 'stale'",
  );
  const indexVersions = db
    .prepare("SELECT DISTINCT index_version FROM research_retrieval_index_entries ORDER BY index_version ASC")
    .all()
    .map((row) => String((row as { index_version: unknown }).index_version));
  return {
    store_version: RESEARCH_RETRIEVAL_INDEX_RUNTIME_COMPLETION_STORE_VERSION_V01,
    schema_exists: true,
    scope: "project:augnes",
    index_versions: indexVersions,
    entry_count: entryCount,
    term_count: termCount,
    rebuild_count: rebuildCount,
    stale_count: staleCount,
    authority_boundary: createResearchRetrievalIndexAuthorityBoundaryV01(),
  };
}

export function isSafeResearchRetrievalDbPathV01(path: unknown): path is string {
  if (typeof path !== "string") return false;
  if (path.length === 0 || path.length > 180) return false;
  if (!(
    path.startsWith("tmp/research-retrieval/") ||
    path.startsWith(".tmp/research-retrieval/")
  )) {
    return false;
  }
  if (!/\.(sqlite|db)$/i.test(path)) return false;
  if (
    path.startsWith("/") ||
    path.includes("..") ||
    path.includes("\\") ||
    path.includes("\0") ||
    /^[a-z]+:\/\//i.test(path) ||
    /\/Users\/|\/home\/|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|token|secret/i.test(path)
  ) {
    return false;
  }
  return true;
}

function scalarCount(db: ResearchRetrievalIndexDbLikeV01, sql: string): number {
  const row = db.prepare(sql).get() as { count?: unknown } | undefined;
  return typeof row?.count === "number" ? row.count : Number(row?.count ?? 0);
}

export interface RebuildableRetrievalIndexStoreMetadata {
  index_id: string;
  built_at: string;
  entry_count: number;
  token_count: number;
  source_refs: string[];
  candidate_refs: string[];
  review_memory_refs: string[];
  durable_summary_refs: string[];
  feedback_refs: string[];
  derived_non_authoritative: true;
  rebuildable: true;
  stale_index_cannot_override_current_state: true;
  index_fingerprint: string;
}

export interface RebuildableRetrievalIndexStoreSnapshot {
  store_version: "rebuildable_retrieval_index_in_memory_store.v0.1";
  scope: "project:augnes";
  storage_kind: "in_memory_derived_cache_only";
  durable_state: false;
  disk_write: false;
  db_write: false;
  file_read_or_write: false;
  automatic_rebuild: false;
  background_job: false;
  indexes: RebuildableRetrievalIndexStoreMetadata[];
  discard_log: Array<{
    index_id: string;
    reason: string;
    discarded_at: string;
    derived_cache_only: true;
    candidate_rejection: false;
    proof_or_evidence_deletion: false;
    product_write: false;
  }>;
}

export interface InMemoryRebuildableRetrievalIndexStoreV01 {
  saveIndex(index: RebuildableRetrievalIndex): RebuildableRetrievalIndexStoreMetadata;
  readIndex(indexId: string): RebuildableRetrievalIndex | null;
  listIndexMetadata(): RebuildableRetrievalIndexStoreMetadata[];
  discardIndex(indexId: string, reason: string): boolean;
}

interface MutableStore extends InMemoryRebuildableRetrievalIndexStoreV01 {
  __readDiscardLog(): RebuildableRetrievalIndexStoreSnapshot["discard_log"];
}

export function createInMemoryRebuildableRetrievalIndexStoreV01(): InMemoryRebuildableRetrievalIndexStoreV01 {
  const indexes = new Map<string, RebuildableRetrievalIndex>();
  const discardLog: RebuildableRetrievalIndexStoreSnapshot["discard_log"] = [];
  const store: MutableStore = {
    saveIndex(index) {
      indexes.set(index.index_id, index);
      return toMetadata(index);
    },
    readIndex(indexId) {
      return indexes.get(indexId) ?? null;
    },
    listIndexMetadata() {
      return [...indexes.values()].map(toMetadata).sort((left, right) =>
        left.index_id.localeCompare(right.index_id),
      );
    },
    discardIndex(indexId, reason) {
      const existed = indexes.delete(indexId);
      if (existed) {
        discardLog.push({
          index_id: indexId,
          reason,
          discarded_at: new Date(0).toISOString(),
          derived_cache_only: true,
          candidate_rejection: false,
          proof_or_evidence_deletion: false,
          product_write: false,
        });
      }
      return existed;
    },
    __readDiscardLog() {
      return [...discardLog];
    },
  };
  return store;
}

export function createReadOnlyRebuildableRetrievalIndexStoreSnapshotV01(
  store: InMemoryRebuildableRetrievalIndexStoreV01,
): RebuildableRetrievalIndexStoreSnapshot {
  const maybeMutable = store as Partial<MutableStore>;
  return {
    store_version: "rebuildable_retrieval_index_in_memory_store.v0.1",
    scope: "project:augnes",
    storage_kind: "in_memory_derived_cache_only",
    durable_state: false,
    disk_write: false,
    db_write: false,
    file_read_or_write: false,
    automatic_rebuild: false,
    background_job: false,
    indexes: store.listIndexMetadata(),
    discard_log: maybeMutable.__readDiscardLog?.() ?? [],
  };
}

export const rebuildableRetrievalIndexRuntimeDerivedStoreV01 =
  createInMemoryRebuildableRetrievalIndexStoreV01();

function toMetadata(index: RebuildableRetrievalIndex): RebuildableRetrievalIndexStoreMetadata {
  return {
    index_id: index.index_id,
    built_at: index.built_at,
    entry_count: index.entries.length,
    token_count: index.token_records.length,
    source_refs: [...index.source_refs].sort(),
    candidate_refs: [...index.candidate_refs].sort(),
    review_memory_refs: [...index.review_memory_refs].sort(),
    durable_summary_refs: [...index.durable_summary_refs].sort(),
    feedback_refs: [...index.feedback_refs].sort(),
    derived_non_authoritative: true,
    rebuildable: true,
    stale_index_cannot_override_current_state: true,
    index_fingerprint: index.index_fingerprint,
  };
}
