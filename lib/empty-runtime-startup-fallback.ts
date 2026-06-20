export const EMPTY_RUNTIME_OPTIONAL_TABLES = [
  "state_entries",
  "work_items",
  "state_transitions",
  "state_delta_proposals",
] as const;

export const APPROVAL_PUBLICATION_EMPTY_RUNTIME_OPTIONAL_TABLES = [
  "publication_drafts",
  "delivery_ledger",
  "publication_approval_requests",
  "publication_approval_decisions",
  "publication_readiness_checks",
] as const;

export type EmptyRuntimeOptionalTable =
  (typeof EMPTY_RUNTIME_OPTIONAL_TABLES)[number];
export type ApprovalPublicationEmptyRuntimeOptionalTable =
  (typeof APPROVAL_PUBLICATION_EMPTY_RUNTIME_OPTIONAL_TABLES)[number];

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
const APPROVAL_PUBLICATION_OPTIONAL_TABLE_SET = new Set<string>(
  APPROVAL_PUBLICATION_EMPTY_RUNTIME_OPTIONAL_TABLES,
);
const MISSING_TABLE_PATTERN = /\bno such table:\s*(?:main\.)?([A-Za-z0-9_]+)/gi;

export function getMissingEmptyRuntimeOptionalTables(
  error: unknown,
): EmptyRuntimeOptionalTable[] {
  return getMissingOptionalTablesForSet<EmptyRuntimeOptionalTable>(
    error,
    OPTIONAL_TABLE_SET,
  );
}

export function isMissingEmptyRuntimeOptionalTableError(error: unknown) {
  return getMissingEmptyRuntimeOptionalTables(error).length > 0;
}

export function getMissingApprovalPublicationOptionalTables(
  error: unknown,
): ApprovalPublicationEmptyRuntimeOptionalTable[] {
  return getMissingOptionalTablesForSet<ApprovalPublicationEmptyRuntimeOptionalTable>(
    error,
    APPROVAL_PUBLICATION_OPTIONAL_TABLE_SET,
  );
}

export function isMissingApprovalPublicationOptionalTableError(error: unknown) {
  return getMissingApprovalPublicationOptionalTables(error).length > 0;
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

export function buildApprovalPublicationEmptyRuntimeFallbackMetadata({
  route,
  scope,
  missingTables,
}: {
  route: string;
  scope: string;
  missingTables: ApprovalPublicationEmptyRuntimeOptionalTable[];
}) {
  return {
    ok: true,
    empty_runtime: true,
    fallback_reason: "missing_optional_runtime_table",
    missing_tables: missingTables,
    items: [],
    count: 0,
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
      approval_or_publication_workflow_created: false,
      promotion_workflow_created: false,
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
      recognized_optional_runtime_tables:
        APPROVAL_PUBLICATION_EMPTY_RUNTIME_OPTIONAL_TABLES,
      read_route: true,
      controlled_empty_envelope: true,
      missing_table_errors_bounded_to_recognized_optional_runtime_tables: true,
      unexpected_db_errors_rethrown: true,
      schema_mutation_from_read_route: false,
      fake_seed_data_created: false,
      approval_workflow_created: false,
      publication_workflow_created: false,
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

function getMissingOptionalTablesForSet<TableName extends string>(
  error: unknown,
  tableSet: Set<string>,
): TableName[] {
  if (!(error instanceof Error)) {
    return [];
  }

  const missingTables = new Set<TableName>();

  for (const match of error.message.matchAll(MISSING_TABLE_PATTERN)) {
    const tableName = match[1];

    if (tableSet.has(tableName)) {
      missingTables.add(tableName as TableName);
    }
  }

  return [...missingTables];
}
