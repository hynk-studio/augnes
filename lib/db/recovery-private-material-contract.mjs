export const RECOVERY_PRIVATE_MATERIAL_CONTRACT =
  "augnes.recovery-private-material.v1";
export const RECOVERY_PRIVATE_MATERIAL_CONTRACT_VERSION = 1;
export const RECOVERY_PRIVATE_MATERIAL_MARKER =
  "augnes.private-material.not-persisted.v1";
export const RECOVERY_PRIVATE_STATE_VALUE_MARKER = JSON.stringify(
  RECOVERY_PRIVATE_MATERIAL_MARKER,
);

export const RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS = Object.freeze([
  "observations.latest_user_message",
  "timeline.deadline_note",
  "implementation.stack",
]);
export const RECOVERY_PRIVATE_OBSERVATION_STATE_KEY =
  RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS[0];
export const RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID =
  "agent:temporal-delta-compiler";
export const RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON =
  "Deterministic no-model Observe proposal.";

export const RECOVERY_PRIVATE_MATERIAL_NORMALIZED_FIELDS = Object.freeze([
  "messages.content",
  "state_delta_proposals.before_value",
  "state_delta_proposals.after_value",
  "state_entries.value",
  "state_transitions.before_value",
  "state_transitions.after_value",
]);

const LINEAGE_COLUMNS = Object.freeze({
  state_delta_proposals: Object.freeze([
    "id",
    "scope",
    "state_key",
    "source_agent_id",
    "reason",
    "before_value",
    "after_value",
  ]),
  state_transitions: Object.freeze([
    "id",
    "scope",
    "state_key",
    "source_agent_id",
    "source_session_id",
    "source_proposal_id",
    "reason",
    "before_value",
    "after_value",
    "temporal_scope",
    "valid_from",
    "valid_until",
    "stability",
    "change_type",
    "committed_at",
  ]),
  state_entries: Object.freeze([
    "id",
    "scope",
    "state_key",
    "source_transition_id",
    "value",
    "created_at",
    "updated_at",
  ]),
});

export function recoveryPrivateMaterialManifestContract() {
  return {
    contract: RECOVERY_PRIVATE_MATERIAL_CONTRACT,
    contract_version: RECOVERY_PRIVATE_MATERIAL_CONTRACT_VERSION,
    legacy_observe_reason: RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON,
    legacy_observe_source_agent_id:
      RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID,
    legacy_observe_state_keys: [
      ...RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS,
    ],
    normalized_fields: [...RECOVERY_PRIVATE_MATERIAL_NORMALIZED_FIELDS],
    normalization_marker: RECOVERY_PRIVATE_MATERIAL_MARKER,
    raw_private_material_persisted: false,
  };
}

export function inspectRecoveryPrivateMaterialBoundary(database) {
  const messageRows = tableHasColumns(database, "messages", ["content"])
    ? Number(
        database
          .prepare(
            `SELECT COUNT(*) AS count
               FROM messages
              WHERE content <> ?`,
          )
          .get(RECOVERY_PRIVATE_MATERIAL_MARKER).count,
      )
    : 0;
  const lineage = readLegacyObservePrivateLineage(database);
  const context = createPrivateLineageContext(database, lineage);
  let stateValues = 0;
  for (const row of lineage.proposals) {
    stateValues += countNonconformingPrivateRowValues(
      "state_delta_proposals",
      row,
      context,
    );
  }
  for (const row of lineage.transitions) {
    stateValues += countNonconformingPrivateRowValues(
      "state_transitions",
      row,
      context,
    );
  }
  for (const row of lineage.entries) {
    stateValues += countNonconformingPrivateRowValues(
      "state_entries",
      row,
      context,
    );
  }

  return {
    contract: RECOVERY_PRIVATE_MATERIAL_CONTRACT,
    contract_version: RECOVERY_PRIVATE_MATERIAL_CONTRACT_VERSION,
    current: messageRows === 0 && stateValues === 0,
    nonconforming_message_rows: messageRows,
    nonconforming_state_value_rows: stateValues,
  };
}

export function normalizeRecoveryPrivateMaterial(database) {
  const lineage = readLegacyObservePrivateLineage(database);
  const context = createPrivateLineageContext(database, lineage);
  let normalizedMessageRows = 0;
  let normalizedStateValues = 0;
  let preservedSafePredecessorBeforeValues = 0;

  if (tableHasColumns(database, "messages", ["content"])) {
    normalizedMessageRows = database
      .prepare(
        `UPDATE messages
            SET content = ?
          WHERE content <> ?`,
      )
      .run(
        RECOVERY_PRIVATE_MATERIAL_MARKER,
        RECOVERY_PRIVATE_MATERIAL_MARKER,
      ).changes;
  }

  normalizedStateValues += normalizeLineageRows(
    database,
    "state_delta_proposals",
    lineage.proposals,
    context,
  );
  normalizedStateValues += normalizeLineageRows(
    database,
    "state_transitions",
    lineage.transitions,
    context,
  );
  normalizedStateValues += normalizeLineageRows(
    database,
    "state_entries",
    lineage.entries,
    context,
  );

  preservedSafePredecessorBeforeValues +=
    countPreservedSafePredecessorBeforeValues(
      "state_delta_proposals",
      lineage.proposals,
      context,
    );
  preservedSafePredecessorBeforeValues +=
    countPreservedSafePredecessorBeforeValues(
      "state_transitions",
      lineage.transitions,
      context,
    );

  const inspection = inspectRecoveryPrivateMaterialBoundary(database);
  if (!inspection.current) {
    throw new Error("recovery_private_material_normalization_failed");
  }
  return {
    ...inspection,
    normalized_message_rows: normalizedMessageRows,
    normalized_state_value_rows: normalizedStateValues,
    preserved_safe_predecessor_before_values:
      preservedSafePredecessorBeforeValues,
    private_entries_with_safe_predecessor: lineage.entries.filter((row) =>
      context.entry_predecessors.has(row.id),
    ).length,
    private_entries_without_safe_predecessor: lineage.entries.filter(
      (row) => !context.entry_predecessors.has(row.id),
    ).length,
  };
}

export function createRecoveryPrivateMaterialIdentityContext(database) {
  const lineage = readLegacyObservePrivateLineage(database);
  const context = createPrivateLineageContext(database, lineage);
  return {
    proposal_ids: new Set(lineage.proposals.map((row) => row.id)),
    transition_ids: new Set(lineage.transitions.map((row) => row.id)),
    proposal_safe_before_values: context.proposal_safe_before_values,
    transition_safe_before_values: context.transition_safe_before_values,
  };
}

/**
 * Build the exact set of sanitized legacy Observe rows that must remain in the
 * recovery image for lineage fidelity but must never be consumed as semantic
 * authority. Raw legacy rows are deliberately not classified here: the
 * recovery migration normalizes those rows before this read boundary applies.
 */
/**
 * @param {any} database
 * @param {{scope?: string | null}} [options]
 */
export function createRecoveryPrivateMaterialReadBoundary(
  database,
  { scope = null } = {},
) {
  const lineage = readLegacyObservePrivateLineage(database);
  const context = createPrivateLineageContext(database, lineage);
  const sanitizedLineage = filterSanitizedLegacyObservePrivateLineage(
    lineage,
    context,
    scope,
  );
  const projectedStateEntries = new Map();
  for (const entry of sanitizedLineage.entries) {
    const predecessor = context.entry_predecessors.get(entry.id);
    if (!predecessor) continue;
    projectedStateEntries.set(
      entry.id,
      createProjectedStateEntry(entry, predecessor),
    );
  }
  return {
    contract: RECOVERY_PRIVATE_MATERIAL_CONTRACT,
    contract_version: RECOVERY_PRIVATE_MATERIAL_CONTRACT_VERSION,
    excluded_proposal_ids: new Set(
      sanitizedLineage.proposals.map((row) => row.id),
    ),
    excluded_transition_ids: new Set(
      sanitizedLineage.transitions.map((row) => row.id),
    ),
    excluded_entry_ids: new Set(
      sanitizedLineage.entries.map((row) => row.id),
    ),
    projected_state_entries: projectedStateEntries,
  };
}

/**
 * Replace a sanitized private current entry with a read-only projection of its
 * latest proven non-private predecessor. The persisted entry and transition
 * lineage remain unchanged; callers receive no row when no safe predecessor
 * exists.
 */
export function projectRecoveryPrivateMaterialStateEntryForAuthoritativeRead(
  row,
  boundary,
) {
  if (!row || !boundary || typeof row.id !== "string") return row ?? null;
  if (!boundary.excluded_entry_ids.has(row.id)) return row;
  const replacement = boundary.projected_state_entries.get(row.id);
  return replacement ? { ...row, ...replacement } : null;
}

export function isRecoveryPrivateMaterialExcludedFromAuthoritativeRead(
  tableName,
  row,
  boundary,
) {
  if (!row || !boundary || typeof row.id !== "string") return false;
  if (tableName === "state_delta_proposals") {
    return boundary.excluded_proposal_ids.has(row.id);
  }
  if (tableName === "state_transitions") {
    return boundary.excluded_transition_ids.has(row.id);
  }
  if (tableName === "state_entries") {
    return boundary.excluded_entry_ids.has(row.id);
  }
  return false;
}

export function normalizeRecoveryPrivateMaterialIdentityRow(
  tableName,
  columnNames,
  row,
  context = {
    proposal_ids: new Set(),
    transition_ids: new Set(),
    proposal_safe_before_values: new Map(),
    transition_safe_before_values: new Map(),
  },
) {
  const normalized = [...row];
  if (tableName === "messages") {
    replaceColumnValue(
      normalized,
      columnNames,
      "content",
      RECOVERY_PRIVATE_MATERIAL_MARKER,
    );
    return normalized;
  }

  if (!identityRowBelongsToLegacyObserveLineage(
    tableName,
    columnNames,
    normalized,
    context,
  )) {
    return normalized;
  }
  for (const fieldName of privateValueFieldsForTable(tableName)) {
    const fieldIndex = columnNames.indexOf(fieldName);
    if (fieldIndex < 0) continue;
    const identityRow = Object.fromEntries(
      columnNames.map((columnName, index) => [columnName, normalized[index]]),
    );
    normalized[fieldIndex] = normalizedPrivateFieldValue(
      tableName,
      fieldName,
      identityRow,
      context,
    );
  }
  return normalized;
}

function readLegacyObservePrivateLineage(database) {
  const proposals = readRowsWhenColumnsExist(
    database,
    "state_delta_proposals",
    LINEAGE_COLUMNS.state_delta_proposals,
  ).filter(isLegacyObserveProposal);
  const proposalById = new Map(proposals.map((row) => [row.id, row]));
  const transitions = readRowsWhenColumnsExist(
    database,
    "state_transitions",
    LINEAGE_COLUMNS.state_transitions,
  ).filter((row) => {
    return (
      proposalById.has(row.source_proposal_id) &&
      isLegacyObserveStateKey(row.state_key) &&
      row.source_agent_id ===
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID &&
      row.reason === RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON
    );
  });
  const transitionById = new Map(
    transitions.map((row) => [row.id, row]),
  );
  const entries = readRowsWhenColumnsExist(
    database,
    "state_entries",
    LINEAGE_COLUMNS.state_entries,
  ).filter((row) => {
    return (
      transitionById.has(row.source_transition_id) &&
      isLegacyObserveStateKey(row.state_key)
    );
  });
  return { proposals, transitions, entries };
}

function filterSanitizedLegacyObservePrivateLineage(
  lineage,
  context,
  scope,
) {
  const proposals = lineage.proposals.filter(
    (row) =>
      scopeMatches(row.scope, scope) &&
      privateRowValuesConform(
        "state_delta_proposals",
        row,
        context,
      ),
  );
  const proposalIds = new Set(proposals.map((row) => row.id));
  const proposalById = new Map(proposals.map((row) => [row.id, row]));
  const transitions = lineage.transitions.filter((row) => {
    const proposal = proposalById.get(row.source_proposal_id);
    return (
      proposalIds.has(row.source_proposal_id) &&
      scopeMatches(row.scope, scope) &&
      row.scope === proposal.scope &&
      row.state_key === proposal.state_key &&
      privateRowValuesConform("state_transitions", row, context)
    );
  });
  const transitionById = new Map(
    transitions.map((row) => [row.id, row]),
  );
  const entries = lineage.entries.filter((row) => {
    const transition = transitionById.get(row.source_transition_id);
    return (
      transition &&
      scopeMatches(row.scope, scope) &&
      row.scope === transition.scope &&
      row.state_key === transition.state_key &&
      privateRowValuesConform("state_entries", row, context)
    );
  });
  return { proposals, transitions, entries };
}

function createPrivateLineageContext(database, lineage) {
  const privateTransitionIds = new Set(
    lineage.transitions.map((row) => row.id),
  );
  const transitionPredecessors = new Map();
  const allTransitions = readRowsWhenColumnsExist(
    database,
    "state_transitions",
    LINEAGE_COLUMNS.state_transitions,
  );
  for (const transition of lineage.transitions) {
    const predecessor = selectSafePredecessorTransition(
      allTransitions,
      transition,
      privateTransitionIds,
    );
    if (predecessor) {
      transitionPredecessors.set(transition.id, predecessor);
    }
  }

  const transitionSafeBeforeValues = new Map(
    [...transitionPredecessors].map(([transitionId, predecessor]) => [
      transitionId,
      predecessor.after_value,
    ]),
  );
  const proposalSafeBeforeValues = new Map();
  for (const proposal of lineage.proposals) {
    const linkedTransitions = lineage.transitions.filter(
      (transition) => transition.source_proposal_id === proposal.id,
    );
    const linkedValues = linkedTransitions.map((transition) =>
      transitionSafeBeforeValues.get(transition.id),
    );
    if (
      linkedTransitions.length > 0 &&
      linkedTransitions.every((transition) =>
        transitionSafeBeforeValues.has(transition.id),
      ) &&
      linkedValues.every((value) => value === linkedValues[0])
    ) {
      proposalSafeBeforeValues.set(proposal.id, linkedValues[0]);
    }
  }

  const entryPredecessors = new Map();
  for (const entry of lineage.entries) {
    const predecessor = transitionPredecessors.get(
      entry.source_transition_id,
    );
    if (predecessor) entryPredecessors.set(entry.id, predecessor);
  }

  return {
    proposal_safe_before_values: proposalSafeBeforeValues,
    transition_safe_before_values: transitionSafeBeforeValues,
    transition_predecessors: transitionPredecessors,
    entry_predecessors: entryPredecessors,
  };
}

function selectSafePredecessorTransition(
  transitions,
  privateTransition,
  privateTransitionIds,
) {
  const privateTime = parseCommittedTime(privateTransition.committed_at);
  if (privateTime === null) return null;
  const candidates = transitions
    .filter((candidate) => {
      if (privateTransitionIds.has(candidate.id)) return false;
      if (hasLegacyObserveTransitionProvenance(candidate)) return false;
      if (candidate.scope !== privateTransition.scope) return false;
      if (candidate.state_key !== privateTransition.state_key) return false;
      if (candidate.after_value === RECOVERY_PRIVATE_STATE_VALUE_MARKER) {
        return false;
      }
      if (candidate.after_value !== privateTransition.before_value) {
        return false;
      }
      const candidateTime = parseCommittedTime(candidate.committed_at);
      return candidateTime !== null && candidateTime < privateTime;
    })
    .sort((left, right) => {
      const timeDifference =
        parseCommittedTime(right.committed_at) -
        parseCommittedTime(left.committed_at);
      if (timeDifference !== 0) return timeDifference;
      return String(right.id).localeCompare(String(left.id));
    });
  return candidates[0] ?? null;
}

function hasLegacyObserveTransitionProvenance(row) {
  return (
    isLegacyObserveStateKey(row.state_key) &&
    row.source_agent_id ===
      RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID &&
    row.reason === RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON
  );
}

function parseCommittedTime(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createProjectedStateEntry(entry, predecessor) {
  return {
    id: entry.id,
    scope: entry.scope,
    state_key: entry.state_key,
    value: predecessor.after_value,
    temporal_scope: predecessor.temporal_scope,
    valid_from: predecessor.valid_from,
    valid_until: predecessor.valid_until,
    stability: predecessor.stability,
    change_type: predecessor.change_type,
    source_agent_id: predecessor.source_agent_id,
    source_session_id: predecessor.source_session_id,
    source_transition_id: predecessor.id,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };
}

function scopeMatches(rowScope, requestedScope) {
  return requestedScope === null || rowScope === requestedScope;
}

function readRowsWhenColumnsExist(database, tableName, columns) {
  if (!tableHasColumns(database, tableName, columns)) return [];
  return database
    .prepare(`SELECT ${columns.join(", ")} FROM ${tableName}`)
    .all();
}

function isLegacyObserveProposal(row) {
  return (
    isLegacyObserveStateKey(row.state_key) &&
    row.source_agent_id === RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID &&
    row.reason === RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON
  );
}

function isLegacyObserveStateKey(value) {
  return RECOVERY_PRIVATE_LEGACY_OBSERVE_STATE_KEYS.includes(value);
}

function normalizeLineageRows(database, tableName, rows, context) {
  let normalizedValues = 0;
  for (const row of rows) {
    for (const fieldName of privateValueFieldsForTable(tableName)) {
      const normalizedValue = normalizedPrivateFieldValue(
        tableName,
        fieldName,
        row,
        context,
      );
      if (row[fieldName] === normalizedValue) continue;
      normalizedValues += database
        .prepare(`UPDATE ${tableName} SET ${fieldName} = ? WHERE id = ?`)
        .run(normalizedValue, row.id).changes;
      row[fieldName] = normalizedValue;
    }
  }
  return normalizedValues;
}

function countNonconformingPrivateRowValues(tableName, row, context) {
  return privateValueFieldsForTable(tableName).filter(
    (fieldName) =>
      row[fieldName] !==
      normalizedPrivateFieldValue(tableName, fieldName, row, context),
  ).length;
}

function privateRowValuesConform(tableName, row, context) {
  return countNonconformingPrivateRowValues(tableName, row, context) === 0;
}

function privateValueFieldsForTable(tableName) {
  if (
    tableName === "state_delta_proposals" ||
    tableName === "state_transitions"
  ) {
    return ["before_value", "after_value"];
  }
  if (tableName === "state_entries") return ["value"];
  return [];
}

function normalizedPrivateFieldValue(tableName, fieldName, row, context) {
  if (fieldName !== "before_value") {
    return RECOVERY_PRIVATE_STATE_VALUE_MARKER;
  }
  const safeValues =
    tableName === "state_delta_proposals"
      ? context.proposal_safe_before_values
      : context.transition_safe_before_values;
  if (safeValues?.has(row.id)) {
    const safeValue = safeValues.get(row.id);
    if (row.before_value === safeValue) return safeValue;
  }
  return RECOVERY_PRIVATE_STATE_VALUE_MARKER;
}

function countPreservedSafePredecessorBeforeValues(
  tableName,
  rows,
  context,
) {
  const safeValues =
    tableName === "state_delta_proposals"
      ? context.proposal_safe_before_values
      : context.transition_safe_before_values;
  return rows.filter(
    (row) =>
      safeValues.has(row.id) && row.before_value === safeValues.get(row.id),
  ).length;
}

function identityRowBelongsToLegacyObserveLineage(
  tableName,
  columnNames,
  row,
  context,
) {
  const value = (columnName) => {
    const index = columnNames.indexOf(columnName);
    return index < 0 ? undefined : row[index];
  };
  if (tableName === "state_delta_proposals") {
    return (
      isLegacyObserveStateKey(value("state_key")) &&
      value("source_agent_id") ===
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID &&
      value("reason") === RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON &&
      context.proposal_ids.has(value("id"))
    );
  }
  if (tableName === "state_transitions") {
    return (
      isLegacyObserveStateKey(value("state_key")) &&
      value("source_agent_id") ===
        RECOVERY_PRIVATE_LEGACY_OBSERVE_SOURCE_AGENT_ID &&
      value("reason") === RECOVERY_PRIVATE_LEGACY_OBSERVE_REASON &&
      context.proposal_ids.has(value("source_proposal_id")) &&
      context.transition_ids.has(value("id"))
    );
  }
  if (tableName === "state_entries") {
    return (
      isLegacyObserveStateKey(value("state_key")) &&
      context.transition_ids.has(value("source_transition_id"))
    );
  }
  return false;
}

function replaceColumnValue(row, columnNames, columnName, value) {
  const index = columnNames.indexOf(columnName);
  if (index >= 0) row[index] = value;
}

function tableExists(database, tableName) {
  return Boolean(
    database
      .prepare(
        "SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?",
      )
      .get(tableName),
  );
}

function tableHasColumns(database, tableName, requiredColumns) {
  if (!tableExists(database, tableName)) return false;
  const columns = new Set(
    database
      .prepare("SELECT name FROM pragma_table_info(?)")
      .all(tableName)
      .map((column) => column.name),
  );
  return requiredColumns.every((columnName) => columns.has(columnName));
}
