export const EMPTY_RUNTIME_OPTIONAL_TABLES = [
  "state_entries",
  "work_items",
  "state_transitions",
  "state_delta_proposals",
] as const;

export type EmptyRuntimeOptionalTable =
  (typeof EMPTY_RUNTIME_OPTIONAL_TABLES)[number];

export type EmptyRuntimeStartupFallbackMetadata = {
  ok: true;
  empty_runtime: true;
  fallback_reason: "missing_optional_runtime_table";
  missing_tables: EmptyRuntimeOptionalTable[];
  items: [];
  count: 0;
  summary: {
    returned_count: 0;
    empty_runtime: true;
  };
  no_side_effects: EmptyRuntimeStartupNoSideEffects;
  runtime_boundary: EmptyRuntimeStartupBoundary;
};

type EmptyRuntimeStartupNoSideEffects = {
  read_only_route: true;
  db_writes: false;
  schema_mutation: false;
  fake_seed_data_created: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  work_item_creation: false;
  codex_execution: false;
  external_handoff_sending: false;
  browser_persistence: false;
};

type EmptyRuntimeStartupBoundary = {
  route: string;
  scope: string;
  empty_runtime_fallback: true;
  fallback_reason: "missing_optional_runtime_table";
  missing_tables: EmptyRuntimeOptionalTable[];
  recognized_optional_runtime_tables: readonly EmptyRuntimeOptionalTable[];
  read_route: true;
  controlled_empty_envelope: true;
  missing_table_errors_bounded_to_recognized_optional_runtime_tables: true;
  unexpected_db_errors_rethrown: true;
  schema_mutation_from_read_route: false;
  fake_seed_data_created: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  proof_or_evidence_writes: false;
  perspective_promotion: false;
  canonical_graph_write: false;
  work_item_creation: false;
  codex_execution: false;
  external_handoff_sending: false;
  browser_persistence: false;
};

const OPTIONAL_TABLE_SET = new Set<string>(EMPTY_RUNTIME_OPTIONAL_TABLES);
const MISSING_TABLE_PATTERN = /\bno such table:\s*(?:main\.)?([A-Za-z0-9_]+)/gi;

export function getMissingEmptyRuntimeOptionalTables(
  error: unknown,
): EmptyRuntimeOptionalTable[] {
  if (!(error instanceof Error)) {
    return [];
  }

  const missingTables = new Set<EmptyRuntimeOptionalTable>();

  for (const match of error.message.matchAll(MISSING_TABLE_PATTERN)) {
    const tableName = match[1];

    if (OPTIONAL_TABLE_SET.has(tableName)) {
      missingTables.add(tableName as EmptyRuntimeOptionalTable);
    }
  }

  return [...missingTables];
}

export function isMissingEmptyRuntimeOptionalTableError(error: unknown) {
  return getMissingEmptyRuntimeOptionalTables(error).length > 0;
}

export function buildEmptyRuntimeStartupFallbackMetadata({
  route,
  scope,
  missingTables,
}: {
  route: string;
  scope: string;
  missingTables: EmptyRuntimeOptionalTable[];
}): EmptyRuntimeStartupFallbackMetadata {
  return {
    ok: true,
    empty_runtime: true,
    fallback_reason: "missing_optional_runtime_table",
    missing_tables: missingTables,
    items: [],
    count: 0,
    summary: {
      returned_count: 0,
      empty_runtime: true,
    },
    no_side_effects: {
      read_only_route: true,
      db_writes: false,
      schema_mutation: false,
      fake_seed_data_created: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      work_item_creation: false,
      codex_execution: false,
      external_handoff_sending: false,
      browser_persistence: false,
    },
    runtime_boundary: {
      route,
      scope,
      empty_runtime_fallback: true,
      fallback_reason: "missing_optional_runtime_table",
      missing_tables: missingTables,
      recognized_optional_runtime_tables: EMPTY_RUNTIME_OPTIONAL_TABLES,
      read_route: true,
      controlled_empty_envelope: true,
      missing_table_errors_bounded_to_recognized_optional_runtime_tables: true,
      unexpected_db_errors_rethrown: true,
      schema_mutation_from_read_route: false,
      fake_seed_data_created: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      proof_or_evidence_writes: false,
      perspective_promotion: false,
      canonical_graph_write: false,
      work_item_creation: false,
      codex_execution: false,
      external_handoff_sending: false,
      browser_persistence: false,
    },
  };
}
