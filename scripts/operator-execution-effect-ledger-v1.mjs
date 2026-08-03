import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

export const OPERATOR_EXECUTION_EFFECT_CONTRACT_VERSION_V1 =
  "operator_execution_exact_effect_contract.v1";
export const OPERATOR_EXECUTION_EFFECT_SNAPSHOT_VERSION_V1 =
  "operator_execution_exact_effect_snapshot.v1";
export const OPERATOR_EXECUTION_EFFECT_DIFF_VERSION_V1 =
  "operator_execution_exact_effect_diff.v1";

const NATIVE_APPROVAL_TRACE_EVENT_KINDS_V1 = Object.freeze([
  "fixture_started",
  "received",
  "sent",
  "received",
  "received",
  "sent",
  "received",
  "sent",
  "received",
  "sent",
  "sent",
  "approval_emitted",
  "sent",
  "sent",
  "received",
  "approval_decision_received",
  "sent",
  "browser_release_requested",
  "browser_release_observed",
  "approval_emitted",
  "sent",
  "received",
  "approval_decision_received",
  "sent",
  "browser_release_requested",
  "browser_release_observed",
  "sent",
  "sent",
  "sent",
  "terminal_state_emitted",
  "sent",
  "sent",
  "stdin_closed",
]);

const PROFILE_CONTRACTS = Object.freeze({
  review_control: Object.freeze({
    allowed_tables: Object.freeze([
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
      "vnext_project_automation_controls",
      "vnext_local_operator_sessions",
      "autonomy_runs",
    ]),
    allowed_projects: Object.freeze(["primary", "profile"]),
    core_insert_counts: Object.freeze({
      task_context_packet: 1,
      episode_delta_proposal: 2,
      review_decision: 2,
      semantic_commit_gate: 1,
      semantic_state: 1,
      state_transition_receipt: 1,
    }),
    operator_session_insert_count: 5,
    operator_session_project_counts: Object.freeze({ primary: 3, profile: 2 }),
    operator_session_status_counts: Object.freeze({ active_consumed: 5 }),
    table_operation_counts: Object.freeze({
      inserted: Object.freeze({
        vnext_core_records: 8,
        vnext_local_operator_sessions: 5,
        vnext_project_automation_controls: 1,
        vnext_semantic_state_entries: 1,
        vnext_semantic_target_heads: 1,
      }),
      updated: Object.freeze({ autonomy_runs: 1 }),
      deleted: Object.freeze({}),
    }),
    event_type_counts: Object.freeze({}),
    event_type_status_counts: Object.freeze({}),
    approval_trace_event_kinds: Object.freeze([]),
    allowed_seam_keys: Object.freeze([
      "strategic_fixture_path",
      "strategic_fixture_retired_path",
      "strategic_counter_path",
    ]),
    active_selection_contract: "unchanged",
    project_control_contract: "primary_insert_revision_3",
    run_update_contract: "exact_baseline_completed_run_metadata_revision",
  }),
  native_host_execution: Object.freeze({
    allowed_tables: Object.freeze([
      "vnext_core_records",
      "vnext_active_project_selections",
      "vnext_local_operator_sessions",
      "autonomy_runs",
      "autonomy_run_steps",
      "autonomy_run_events",
      "autonomy_run_delta_batches",
    ]),
    allowed_projects: Object.freeze(["primary", "profile", "automation"]),
    core_insert_counts: Object.freeze({
      automation_work_item: 4,
      capability_grant: 1,
      task_context_packet: 4,
      run_receipt: 4,
      episode_delta_proposal: 4,
      context_use_review: 1,
    }),
    operator_session_insert_count: 4,
    operator_session_project_counts: Object.freeze({
      primary: 1,
      profile: 2,
      automation: 1,
    }),
    operator_session_status_counts: Object.freeze({
      active_consumed: 3,
      revoked: 1,
    }),
    table_operation_counts: Object.freeze({
      inserted: Object.freeze({
        autonomy_run_events: 52,
        autonomy_run_steps: 4,
        autonomy_runs: 4,
        vnext_core_records: 18,
        vnext_local_operator_sessions: 4,
      }),
      updated: Object.freeze({ vnext_active_project_selections: 1 }),
      deleted: Object.freeze({}),
    }),
    event_type_counts: Object.freeze({
      approval_decided: 2,
      approval_requested: 3,
      host_event_observed: 22,
      run_cancelled: 1,
      run_cancelling: 1,
      run_completed: 3,
      run_created: 4,
      run_needs_review: 1,
      run_queued: 3,
      run_started: 1,
      run_starting: 3,
      step_cancelled: 1,
      step_completed: 3,
      step_started: 4,
    }),
    event_type_status_counts: Object.freeze({
      "approval_decided:waiting_for_approval": 2,
      "approval_requested:waiting_for_approval": 3,
      "host_event_observed:cancelling": 2,
      "host_event_observed:running": 12,
      "host_event_observed:starting": 6,
      "host_event_observed:waiting_for_approval": 2,
      "run_cancelled:cancelled": 1,
      "run_cancelling:cancelling": 1,
      "run_completed:completed": 3,
      "run_created:queued": 3,
      "run_created:running": 1,
      "run_needs_review:needs_review": 1,
      "run_queued:queued": 3,
      "run_started:running": 1,
      "run_starting:starting": 3,
      "step_cancelled:cancelled": 1,
      "step_completed:completed": 3,
      "step_started:running": 4,
    }),
    approval_trace_event_kinds: NATIVE_APPROVAL_TRACE_EVENT_KINDS_V1,
    allowed_seam_keys: Object.freeze([
      "approval_trace_path",
      "second_approval_release_path",
      "terminal_release_path",
      "transport_fixture_path",
      "transport_counter_path",
    ]),
    active_selection_contract: "profile_to_automation_revision_plus_4",
    project_control_contract: "unchanged",
    run_update_contract: "no_preexisting_run_update",
  }),
  multi_candidate: Object.freeze({
    allowed_tables: Object.freeze([
      "vnext_core_records",
      "vnext_semantic_state_entries",
      "vnext_semantic_target_heads",
      "vnext_local_operator_sessions",
    ]),
    allowed_projects: Object.freeze(["primary"]),
    core_insert_counts: Object.freeze({
      task_context_packet: 1,
      review_decision: 4,
      semantic_commit_gate: 1,
      semantic_state: 1,
      state_transition_receipt: 1,
    }),
    operator_session_insert_count: 1,
    operator_session_project_counts: Object.freeze({ primary: 1 }),
    operator_session_status_counts: Object.freeze({ active_consumed: 1 }),
    table_operation_counts: Object.freeze({
      inserted: Object.freeze({
        vnext_core_records: 8,
        vnext_local_operator_sessions: 1,
        vnext_semantic_state_entries: 1,
        vnext_semantic_target_heads: 1,
      }),
      updated: Object.freeze({}),
      deleted: Object.freeze({}),
    }),
    event_type_counts: Object.freeze({}),
    event_type_status_counts: Object.freeze({}),
    approval_trace_event_kinds: Object.freeze([]),
    allowed_seam_keys: Object.freeze([]),
    active_selection_contract: "unchanged",
    project_control_contract: "unchanged",
    run_update_contract: "no_preexisting_run_update",
  }),
});

export function buildOperatorExecutionPermittedEffectContractV1(profile) {
  const declared = PROFILE_CONTRACTS[profile];
  assert(declared, `operator_effect_profile_unsupported:${profile}`);
  return structuredClone({
    effect_contract_version: OPERATOR_EXECUTION_EFFECT_CONTRACT_VERSION_V1,
    profile,
    ...declared,
    structural_diff_required: true,
    row_identity_and_content_fingerprints_required: true,
    delete_operations_allowed: false,
    immutable_core_updates_allowed: false,
    memory_or_perspective_mutations_allowed: false,
    provider_calls_allowed: false,
    external_network_calls_allowed: false,
    github_calls_allowed: false,
    deployment_calls_allowed: false,
    publication_calls_allowed: false,
  });
}

export function captureOperatorExecutionEffectSnapshotV1({
  database_path,
  prepared = {},
}) {
  const database = new Database(database_path, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const tableNames = database
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      )
      .all()
      .map((entry) => String(entry.name))
      .filter((name) => /^[A-Za-z_][A-Za-z0-9_]*$/u.test(name));
    const rows = [];
    for (const table of tableNames) {
      const columns = database
        .prepare(`PRAGMA table_info("${table}")`)
        .all()
        .map((entry) => ({
          name: String(entry.name),
          primary_key_order: Number(entry.pk),
        }));
      const primaryKeyColumns = columns
        .filter((entry) => entry.primary_key_order > 0)
        .sort((left, right) => left.primary_key_order - right.primary_key_order)
        .map((entry) => entry.name);
      const rowSource =
        table === "autonomy_run_events"
          ? `SELECT rowid AS __snapshot_rowid__, * FROM "${table}"`
          : `SELECT * FROM "${table}"`;
      for (const row of database.prepare(rowSource).all()) {
        rows.push(
          publicRowSnapshot(
            table,
            row,
            primaryKeyColumns.length > 0
              ? primaryKeyColumns
              : fallbackIdentityColumns(row),
          ),
        );
      }
    }
    rows.sort((left, right) => compareCodeUnits(left.stable_key, right.stable_key));
    const seams = capturePreparedSeams(prepared);
    const material = {
      snapshot_version: OPERATOR_EXECUTION_EFFECT_SNAPSHOT_VERSION_V1,
      rows,
      seams,
    };
    return {
      ...material,
      snapshot_fingerprint: sha256Json(material),
      row_count: rows.length,
      category_counts: countBy(rows, (entry) => entry.category),
    };
  } finally {
    database.close();
  }
}

export function diffOperatorExecutionEffectSnapshotsV1(before, after) {
  assert.equal(
    before.snapshot_version,
    OPERATOR_EXECUTION_EFFECT_SNAPSHOT_VERSION_V1,
  );
  assert.equal(
    after.snapshot_version,
    OPERATOR_EXECUTION_EFFECT_SNAPSHOT_VERSION_V1,
  );
  const beforeRows = new Map(before.rows.map((row) => [row.stable_key, row]));
  const afterRows = new Map(after.rows.map((row) => [row.stable_key, row]));
  const inserted = [];
  const deleted = [];
  const updated = [];
  let unchanged = 0;
  for (const [key, afterRow] of afterRows) {
    const beforeRow = beforeRows.get(key);
    if (!beforeRow) {
      inserted.push(afterRow);
    } else if (beforeRow.row_fingerprint !== afterRow.row_fingerprint) {
      updated.push({
        stable_key: key,
        category: afterRow.category,
        table: afterRow.table,
        identity: afterRow.identity,
        before_fingerprint: beforeRow.row_fingerprint,
        after_fingerprint: afterRow.row_fingerprint,
        before_identity: beforeRow.identity,
        after_identity: afterRow.identity,
      });
    } else {
      unchanged += 1;
    }
  }
  for (const [key, beforeRow] of beforeRows) {
    if (!afterRows.has(key)) deleted.push(beforeRow);
  }
  inserted.sort(rowSort);
  deleted.sort(rowSort);
  updated.sort((left, right) => compareCodeUnits(left.stable_key, right.stable_key));
  const seamDiff = diffSeams(before.seams, after.seams);
  const material = {
    diff_version: OPERATOR_EXECUTION_EFFECT_DIFF_VERSION_V1,
    before_snapshot_fingerprint: before.snapshot_fingerprint,
    after_snapshot_fingerprint: after.snapshot_fingerprint,
    inserted,
    updated,
    deleted,
    unchanged_count: unchanged,
    seam_diff: seamDiff,
  };
  return {
    ...material,
    diff_fingerprint: sha256Json(material),
    operation_counts: {
      inserted: inserted.length,
      updated: updated.length,
      deleted: deleted.length,
      unchanged,
      seam_inserted: seamDiff.inserted.length,
      seam_updated: seamDiff.updated.length,
      seam_deleted: seamDiff.deleted.length,
    },
    operation_counts_by_category: {
      inserted: countBy(inserted, (entry) => entry.category),
      updated: countBy(updated, (entry) => entry.category),
      deleted: countBy(deleted, (entry) => entry.category),
    },
  };
}

export function assertOperatorExecutionEffectDiffV1({
  contract,
  manifest,
  result,
  before,
  after,
  diff,
}) {
  assert.equal(
    contract.effect_contract_version,
    OPERATOR_EXECUTION_EFFECT_CONTRACT_VERSION_V1,
  );
  assert.equal(contract.profile, manifest.profile);
  assert.equal(diff.before_snapshot_fingerprint, before.snapshot_fingerprint);
  assert.equal(diff.after_snapshot_fingerprint, after.snapshot_fingerprint);
  assert.equal(diff.deleted.length, 0, "operator_effect_deletion_forbidden");
  const allowedTables = new Set(contract.allowed_tables);
  const rowOperations = [
    ...diff.inserted.map((entry) => ({ operation: "insert", entry })),
    ...diff.updated.map((entry) => ({ operation: "update", entry })),
  ];
  for (const { operation, entry } of rowOperations) {
    assert.equal(
      allowedTables.has(entry.table),
      true,
      `operator_effect_table_unowned:${operation}:${entry.table}`,
    );
    assert.notEqual(
      entry.category,
      "memory_perspective",
      "operator_effect_memory_perspective_mutation_forbidden",
    );
    assertScopeAllowed(entry, manifest, contract);
  }
  assert.equal(
    diff.updated.some((entry) => entry.table === "vnext_core_records"),
    false,
    "operator_effect_immutable_core_update_forbidden",
  );
  const insertedCore = diff.inserted.filter(
    (entry) => entry.table === "vnext_core_records",
  );
  assert.deepEqual(
    countBy(insertedCore, (entry) => entry.identity.record_kind),
    contract.core_insert_counts,
    "operator_effect_core_kind_set_mismatch",
  );
  for (const row of insertedCore) assertCoreBinding(row, manifest, result);
  assertTransitionBindings(insertedCore, manifest, result);
  const sessions = diff.inserted.filter(
    (entry) => entry.table === "vnext_local_operator_sessions",
  );
  assert.equal(
    sessions.length,
    contract.operator_session_insert_count,
    "operator_effect_session_set_mismatch",
  );
  assert.equal(
    diff.updated.some(
      (entry) => entry.table === "vnext_local_operator_sessions",
    ),
    false,
    "operator_effect_session_replacement_forbidden",
  );
  assertSessionContract(sessions, contract, manifest);
  if (contract.table_operation_counts) {
    assert.deepEqual(
      exactTableOperationCounts(diff),
      contract.table_operation_counts,
      "operator_effect_table_operation_set_mismatch",
    );
  }
  assertProjectControlContract(diff, contract, manifest);
  assertActiveSelectionContract(diff, contract, manifest);
  assertRunAndEventBindings(diff, contract, manifest, before);
  assertSeamContract(diff.seam_diff, contract, manifest);
  const normalized = exactDiffMaterial(diff);
  const permittedDiffFingerprint = sha256Json(normalized);
  assert.equal(permittedDiffFingerprint, diff.diff_fingerprint);
  return {
    effect_contract_version: contract.effect_contract_version,
    before_snapshot_fingerprint: before.snapshot_fingerprint,
    after_snapshot_fingerprint: after.snapshot_fingerprint,
    permitted_diff_fingerprint: permittedDiffFingerprint,
    observed_diff_fingerprint: diff.diff_fingerprint,
    inserted_updated_deleted_counts: {
      inserted: diff.operation_counts.inserted,
      updated: diff.operation_counts.updated,
      deleted: diff.operation_counts.deleted,
    },
    counts_by_category: diff.operation_counts_by_category,
    zero_unowned_effects: true,
    bounded_diff_entries: boundedDiffEntries(diff),
  };
}

export function exactEffectSummaryV1(snapshot) {
  return {
    effect_snapshot_version: snapshot.snapshot_version,
    snapshot_fingerprint: snapshot.snapshot_fingerprint,
    row_count: snapshot.row_count,
    category_counts: snapshot.category_counts,
    seam_count: snapshot.seams.length,
  };
}

export function boundedOperatorExecutionEffectDiffEntriesV1(diff) {
  return boundedDiffEntries(diff);
}

function publicRowSnapshot(table, row, identityColumns) {
  const normalizedRow = normalizeSqliteValue(row);
  const identityMaterial = Object.fromEntries(
    identityColumns.map((column) => [column, normalizedRow[column]]),
  );
  const stableKey = `${table}:${sha256Json(identityMaterial)}`;
  return {
    category: categoryForTable(table),
    table,
    stable_key: stableKey,
    identity: publicIdentity(table, normalizedRow, stableKey),
    row_fingerprint: sha256Json(normalizedRow),
  };
}

function publicIdentity(table, row, stableKey) {
  const identity = {
    stable_identity_fingerprint: stableKey.slice(stableKey.indexOf(":") + 1),
  };
  for (const key of [
    "workspace_id",
    "project_id",
    "record_kind",
    "record_id",
    "run_id",
    "event_id",
    "event_type",
    "step_id",
    "batch_id",
    "scope",
    "autonomy_contract_ref",
    "status",
    "revision",
    "selection_revision",
    "fingerprint",
    "target_key",
    "created_at",
  ]) {
    if (row[key] !== undefined && row[key] !== null) identity[key] = row[key];
  }
  if (table === "vnext_local_operator_sessions") {
    identity.session_id_hash = sha256String(String(row.session_id));
    identity.operator_id = row.operator_id;
    identity.bootstrap_token_hash = row.bootstrap_token_hash;
    identity.session_token_hash = row.session_token_hash;
    identity.issued_at = row.issued_at;
    identity.expires_at = row.expires_at;
    identity.bootstrap_consumed_at = row.bootstrap_consumed_at;
    identity.revoked_at = row.revoked_at;
    identity.action_nonce_hash = row.action_nonce_hash;
    identity.action_nonce_expires_at = row.action_nonce_expires_at;
    identity.session_status =
      row.revoked_at !== null && row.revoked_at !== undefined
        ? "revoked"
        : row.bootstrap_consumed_at !== null &&
            row.bootstrap_consumed_at !== undefined
          ? "active_consumed"
          : "bootstrap_issued";
    delete identity.record_id;
  }
  if (table === "autonomy_run_events") {
    identity.row_order = Number(row.__snapshot_rowid__);
  }
  if (table === "vnext_project_root_bindings") {
    identity.path_flavor = row.path_flavor;
    identity.binding_version = row.binding_version;
    identity.bound_at = row.bound_at;
    identity.normalized_root_hash = sha256String(String(row.normalized_root));
    identity.root_binding_fingerprint = sha256String(
      canonicalizeProtocolValue({
        workspace_id: row.workspace_id,
        project_id: row.project_id,
        local_root: {
          local_root_ref_version: row.local_root_ref_version,
          ref_kind: row.ref_kind,
          path_flavor: row.path_flavor,
          normalized_path: row.normalized_root,
        },
        binding_version: row.binding_version,
        bound_at: row.bound_at,
      }),
    );
  }
  for (const key of [
    "payload_json",
    "metadata_json",
    "policy_json",
    "target_ref_json",
    "state_ref_json",
  ]) {
    if (typeof row[key] === "string") {
      identity[`${key.replace(/_json$/u, "")}_hash`] = sha256CanonicalJsonText(
        row[key],
      );
    }
  }
  if (table === "vnext_core_records" && typeof row.payload_json === "string") {
    identity.semantic_bindings = semanticBindings(JSON.parse(row.payload_json));
  }
  if (table === "autonomy_run_events" && typeof row.payload_json === "string") {
    identity.event_bindings = publicEventBindings(JSON.parse(row.payload_json));
  }
  if (table === "autonomy_runs" && typeof row.metadata_json === "string") {
    identity.metadata_bindings = publicRunBindings(JSON.parse(row.metadata_json));
  }
  return identity;
}

function publicRunBindings(metadata) {
  return Object.fromEntries(
    [
      "packet_id",
      "packet_fingerprint",
      "root_fingerprint",
      "root_physical_identity_fingerprint",
      "request_id",
      "policy_ref_id",
      "capability_grant_ref_id",
      "automation_control_revision",
    ]
      .filter((key) =>
        ["string", "number", "boolean"].includes(typeof metadata?.[key]),
      )
      .map((key) => [key, metadata[key]]),
  );
}

function publicEventBindings(payload) {
  const bindings = {};
  for (const key of [
    "approval_id",
    "approval_index",
    "control_revision",
    "decision",
    "host_event_type",
    "reconciliation_reason",
    "request_id",
  ]) {
    if (
      typeof payload?.[key] === "string" ||
      typeof payload?.[key] === "number" ||
      typeof payload?.[key] === "boolean"
    ) {
      bindings[key] = payload[key];
    }
  }
  return bindings;
}

function semanticBindings(payload) {
  const output = {};
  const visit = (value, path = "") => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    for (const [key, entry] of Object.entries(value)) {
      const nextPath = path ? `${path}.${key}` : key;
      if (
        typeof entry === "string" &&
        /(?:^|_)(?:packet|run|receipt|proposal|candidate|decision|gate|transition|work)_id$/u.test(
          key,
        )
      ) {
        output[nextPath] = entry;
      } else if (
        typeof entry === "string" &&
        /(?:^|_)(?:packet|receipt|proposal|candidate|decision|gate|transition)_fingerprint$/u.test(
          key,
        )
      ) {
        output[nextPath] = entry;
      }
      visit(entry, nextPath);
    }
  };
  visit(payload);
  return Object.fromEntries(
    Object.entries(output).sort(([left], [right]) => compareCodeUnits(left, right)),
  );
}

function assertCoreBinding(row, manifest) {
  assert.equal(row.identity.workspace_id, manifest.workspace_id);
  assert.equal(typeof row.identity.record_id, "string");
  assert.match(row.identity.fingerprint ?? "", /^sha256:[a-f0-9]{64}$/u);
  assert.equal(
    row.identity.semantic_bindings &&
      typeof row.identity.semantic_bindings === "object",
    true,
  );
}

function assertTransitionBindings(rows, manifest, result) {
  const byKind = (kind) => rows.filter((row) => row.identity.record_kind === kind);
  const decisions = byKind("review_decision");
  const gates = byKind("semantic_commit_gate");
  const transitions = byKind("state_transition_receipt");
  const packets = byKind("task_context_packet");
  const ids = new Set(rows.map((row) => row.identity.record_id));
  for (const transition of transitions) {
    const bindings = Object.values(transition.identity.semantic_bindings);
    const decision = decisions.find((row) =>
      bindings.includes(row.identity.record_id),
    );
    assert(decision, "operator_effect_transition_decision_binding_missing");
    assert.equal(
      gates.some((row) =>
        Object.values(row.identity.semantic_bindings).includes(
          decision.identity.record_id,
        ),
      ),
      true,
      "operator_effect_gate_transition_decision_binding_missing",
    );
    assert.equal(
      bindings.every(
        (value) =>
          !String(value).startsWith("project:") ||
          [
            manifest.project_id,
            manifest.profile_project_id,
            manifest.automation_project_id,
          ].includes(value),
      ),
      true,
    );
  }
  if (manifest.profile === "multi_candidate" && transitions.length === 1) {
    assertMultiCandidateDecisionBindings(decisions, manifest);
    const bindings = Object.values(transitions[0].identity.semantic_bindings);
    assert.equal(
      bindings.includes(manifest.multi_candidate_fixture.target_proposal_id),
      true,
      "operator_effect_multi_transition_proposal_mismatch",
    );
    assert.equal(
      bindings.includes(
        result.packet_root_run_result_proposal_decision_transition_identity
          .applied_candidate_id,
      ),
      true,
      "operator_effect_multi_transition_candidate_mismatch",
    );
  }
  if (transitions.length > 0) {
    assert.equal(packets.length >= transitions.length, true);
    assert.equal(gates.length, transitions.length);
  }
  assert.equal(ids.size, rows.length, "operator_effect_core_identity_overlap");
}

function assertMultiCandidateDecisionBindings(decisions, manifest) {
  const fixture = manifest.multi_candidate_fixture;
  assert(fixture, "operator_effect_multi_fixture_missing");
  const decisionsByProposal = new Map();
  for (const decision of decisions) {
    const proposalId = bindingBySuffix(
      decision.identity.semantic_bindings,
      "proposal_id",
    );
    const candidateId = bindingBySuffix(
      decision.identity.semantic_bindings,
      "candidate_id",
    );
    assert.equal(typeof proposalId, "string");
    assert.equal(typeof candidateId, "string");
    const candidates = decisionsByProposal.get(proposalId) ?? [];
    candidates.push(candidateId);
    decisionsByProposal.set(proposalId, candidates);
  }
  assert.deepEqual(
    [...decisionsByProposal.keys()].sort(compareCodeUnits),
    [
      fixture.blocked_proposal_id,
      fixture.exact_binding.pending_proposal_id,
      fixture.target_proposal_id,
    ].sort(compareCodeUnits),
  );
  assert.deepEqual(
    [...decisionsByProposal.get(fixture.target_proposal_id)].sort(
      compareCodeUnits,
    ),
    [...fixture.candidate_ids].sort(compareCodeUnits),
  );
  assert.deepEqual(decisionsByProposal.get(fixture.blocked_proposal_id), [
    fixture.candidate_ids[0],
  ]);
  assert.deepEqual(
    decisionsByProposal.get(fixture.exact_binding.pending_proposal_id),
    [fixture.exact_binding.preferred_candidate_id],
  );
}

function bindingBySuffix(bindings, suffix) {
  const matches = Object.entries(bindings).filter(([path]) =>
    path.endsWith(suffix),
  );
  assert.equal(matches.length, 1, `operator_effect_binding_ambiguous:${suffix}`);
  return matches[0][1];
}

function assertRunAndEventBindings(diff, contract, manifest, before) {
  const runs = diff.inserted.filter((entry) => entry.table === "autonomy_runs");
  const updatedRuns = diff.updated.filter(
    (entry) => entry.table === "autonomy_runs",
  );
  const events = diff.inserted.filter(
    (entry) => entry.table === "autonomy_run_events",
  );
  if (manifest.profile !== "native_host_execution") {
    assert.equal(runs.length, 0);
    assert.equal(events.length, 0);
    if (
      contract.run_update_contract ===
      "exact_baseline_completed_run_metadata_revision"
    ) {
      assert.equal(updatedRuns.length, 1);
      const updated = updatedRuns[0];
      assert.equal(updated.before_identity.run_id, manifest.baseline_run_id);
      assert.equal(updated.after_identity.run_id, manifest.baseline_run_id);
      assert.equal(updated.before_identity.scope, manifest.project_id);
      assert.equal(updated.after_identity.scope, manifest.project_id);
      assert.equal(updated.before_identity.status, "completed");
      assert.equal(updated.after_identity.status, "completed");
      assert.equal(
        updated.before_identity.autonomy_contract_ref,
        manifest.baseline_run_contract,
      );
      assert.equal(
        updated.after_identity.autonomy_contract_ref,
        manifest.baseline_run_contract,
      );
      assert.notEqual(
        updated.before_identity.metadata_hash,
        updated.after_identity.metadata_hash,
      );
      const proposals = diff.inserted.filter(
        (entry) =>
          entry.table === "vnext_core_records" &&
          entry.identity.record_kind === "episode_delta_proposal",
      );
      assert.equal(
        proposals.some((entry) =>
          Object.values(entry.identity.semantic_bindings).includes(
            manifest.baseline_run_id,
          ),
        ),
        true,
        "operator_effect_run_revision_proposal_binding_missing",
      );
    } else {
      assert.equal(updatedRuns.length, 0);
    }
    return;
  }
  assert.equal(updatedRuns.length, 0);
  assert.equal(runs.length, 4, "operator_effect_native_run_set_mismatch");
  assert.deepEqual(
    countBy(events, (entry) => entry.identity.event_type),
    contract.event_type_counts,
    "operator_effect_native_event_type_counts_mismatch",
  );
  assert.deepEqual(
    countBy(
      events,
      (entry) => `${entry.identity.event_type}:${entry.identity.status}`,
    ),
    contract.event_type_status_counts,
    "operator_effect_native_event_status_counts_mismatch",
  );
  const runIds = new Set(runs.map((entry) => entry.identity.run_id));
  for (const event of events) {
    assert.equal(runIds.has(event.identity.run_id), true);
  }
  assert.equal(
    runs.every((entry) =>
      [
        manifest.project_id,
        manifest.profile_project_id,
        manifest.automation_project_id,
      ].includes(entry.identity.scope),
    ),
    true,
  );
  assert.deepEqual(
    countBy(
      runs,
      (entry) =>
        `${entry.identity.scope}:${entry.identity.status}:${entry.identity.autonomy_contract_ref}`,
    ),
    {
      [`${manifest.automation_project_id}:needs_review:direct_native_host_round_trip.v0.1`]: 1,
      [`${manifest.profile_project_id}:cancelled:direct_native_host_round_trip.v0.1`]: 1,
      [`${manifest.project_id}:completed:direct_native_host_round_trip.v0.1`]: 2,
    },
    "operator_effect_native_run_scope_status_contract_mismatch",
  );
  const rootFingerprintByProject = new Map(
    before.rows
      .filter((entry) => entry.table === "vnext_project_root_bindings")
      .map((entry) => [
        entry.identity.project_id,
        entry.identity.root_binding_fingerprint,
      ]),
  );
  for (const run of runs) {
    assert.equal(
      run.identity.metadata_bindings?.root_fingerprint,
      rootFingerprintByProject.get(run.identity.scope),
      `operator_effect_native_root_binding_mismatch:${run.identity.scope}`,
    );
    const lifecycle = events
      .filter((event) => event.identity.run_id === run.identity.run_id)
      .sort((left, right) =>
        compareCodeUnits(
          `${left.identity.created_at}:${String(left.identity.row_order).padStart(12, "0")}`,
          `${right.identity.created_at}:${String(right.identity.row_order).padStart(12, "0")}`,
        ),
      );
    assert.equal(lifecycle[0]?.identity.event_type, "run_created");
    const terminalType =
      run.identity.status === "completed"
        ? "run_completed"
        : run.identity.status === "cancelled"
          ? "run_cancelled"
          : "run_needs_review";
    assert.equal(
      lifecycle.at(-1)?.identity.event_type,
      terminalType,
      `operator_effect_native_terminal_order_mismatch:${run.identity.status}`,
    );
    if (run.identity.status === "cancelled") {
      assert.deepEqual(
        lifecycle
          .filter((event) =>
            ["run_cancelling", "step_cancelled", "run_cancelled"].includes(
              event.identity.event_type,
            ),
          )
          .map((event) => event.identity.event_type),
        ["run_cancelling", "step_cancelled", "run_cancelled"],
      );
    }
  }
}

function assertSessionContract(sessions, contract, manifest) {
  const roleForProject = new Map(
    [
      [manifest.project_id, "primary"],
      [manifest.profile_project_id, "profile"],
      [manifest.automation_project_id, "automation"],
    ].filter(([projectId]) => typeof projectId === "string"),
  );
  assert.deepEqual(
    countBy(sessions, (entry) => roleForProject.get(entry.identity.project_id)),
    contract.operator_session_project_counts,
    "operator_effect_session_project_scope_mismatch",
  );
  assert.deepEqual(
    countBy(sessions, (entry) => entry.identity.session_status),
    contract.operator_session_status_counts,
    "operator_effect_session_status_mismatch",
  );
  assert.equal(
    sessions.every(
      (entry) =>
        entry.identity.workspace_id === manifest.workspace_id &&
        entry.identity.operator_id === manifest.operator_id &&
        /^sha256:[a-f0-9]{64}$/u.test(entry.identity.bootstrap_token_hash ?? "") &&
        /^sha256:[a-f0-9]{64}$/u.test(entry.identity.session_token_hash ?? "") &&
        /^sha256:[a-f0-9]{64}$/u.test(entry.identity.action_nonce_hash ?? "") &&
        typeof entry.identity.expires_at === "string" &&
        typeof entry.identity.action_nonce_expires_at === "string",
    ),
    true,
    "operator_effect_session_public_state_mismatch",
  );
}

function assertProjectControlContract(diff, contract, manifest) {
  const inserted = diff.inserted.filter(
    (entry) => entry.table === "vnext_project_automation_controls",
  );
  const updated = diff.updated.filter(
    (entry) => entry.table === "vnext_project_automation_controls",
  );
  if (contract.project_control_contract === "unchanged") {
    assert.equal(inserted.length + updated.length, 0);
    return;
  }
  assert.equal(contract.project_control_contract, "primary_insert_revision_3");
  assert.equal(inserted.length, 1);
  assert.equal(updated.length, 0);
  assert.equal(inserted[0].identity.project_id, manifest.project_id);
  assert.equal(inserted[0].identity.revision, 3);
}

function assertActiveSelectionContract(diff, contract, manifest) {
  const inserted = diff.inserted.filter(
    (entry) => entry.table === "vnext_active_project_selections",
  );
  const updated = diff.updated.filter(
    (entry) => entry.table === "vnext_active_project_selections",
  );
  assert.equal(inserted.length, 0);
  if (contract.active_selection_contract === "unchanged") {
    assert.equal(updated.length, 0, "operator_effect_active_selection_changed");
    return;
  }
  assert.equal(updated.length, 1);
  assert.equal(
    contract.active_selection_contract,
    "profile_to_automation_revision_plus_4",
  );
  assert.equal(updated[0].before_identity.project_id, manifest.profile_project_id);
  assert.equal(updated[0].after_identity.project_id, manifest.automation_project_id);
  assert.equal(
    updated[0].after_identity.selection_revision,
    updated[0].before_identity.selection_revision + 4,
  );
}

function assertScopeAllowed(entry, manifest, contract) {
  const allowedProjects = new Set(
    contract.allowed_projects
      .map((role) =>
        role === "primary"
          ? manifest.project_id
          : role === "profile"
            ? manifest.profile_project_id
            : manifest.automation_project_id,
      )
      .filter(Boolean),
  );
  const projectId = entry.identity.project_id;
  if (typeof projectId === "string") {
    assert.equal(
      allowedProjects.has(projectId),
      true,
      `operator_effect_wrong_project:${entry.table}:${projectId}`,
    );
  }
  const workspaceId = entry.identity.workspace_id;
  if (typeof workspaceId === "string") {
    assert.equal(workspaceId, manifest.workspace_id);
  }
}

function assertSeamContract(seamDiff, contract, manifest) {
  const allowed = new Set(contract.allowed_seam_keys);
  for (const entry of [
    ...seamDiff.inserted,
    ...seamDiff.updated,
    ...seamDiff.deleted,
  ]) {
    assert.equal(
      allowed.has(entry.key),
      true,
      `operator_effect_seam_unowned:${entry.key}`,
    );
  }
  if (contract.profile === "multi_candidate") {
    assert.deepEqual(seamDiff, { inserted: [], updated: [], deleted: [] });
    return;
  }
  if (contract.profile === "review_control") {
    assert.equal(seamDiff.updated.length, 0);
    assert.deepEqual(
      seamDiff.inserted.map((entry) => entry.key).sort(compareCodeUnits),
      ["strategic_counter_path", "strategic_fixture_retired_path"],
    );
    assert.deepEqual(
      seamDiff.deleted.map((entry) => entry.key),
      ["strategic_fixture_path"],
    );
    const retired = seamDiff.inserted.find(
      (entry) => entry.key === "strategic_fixture_retired_path",
    );
    const original = seamDiff.deleted[0];
    assert.equal(retired.content_sha256, original.content_sha256);
    assert.deepEqual(retired.public_bindings, {
      fixture_version: "strategic_model_transport_fixture.v0.1",
      project_id: manifest.project_id,
      source_catalog_fingerprint: manifest.strategic_source_catalog_fingerprint,
      working_frame_fingerprint: manifest.strategic_working_frame_fingerprint,
      workspace_id: manifest.workspace_id,
    });
    const counter = seamDiff.inserted.find(
      (entry) => entry.key === "strategic_counter_path",
    );
    assert.equal(counter.transport_calls, 1);
    assert.deepEqual(counter.public_bindings, {
      source_catalog_fingerprint: manifest.strategic_source_catalog_fingerprint,
      transport_calls: 1,
      working_frame_fingerprint: manifest.strategic_working_frame_fingerprint,
    });
    return;
  }
  assert.equal(contract.profile, "native_host_execution");
  assert.equal(seamDiff.updated.length, 0);
  assert.equal(seamDiff.deleted.length, 0);
  assert.deepEqual(
    seamDiff.inserted.map((entry) => entry.key).sort(compareCodeUnits),
    [
      "approval_trace_path",
      "second_approval_release_path",
      "terminal_release_path",
    ],
  );
  const trace = seamDiff.inserted.find(
    (entry) => entry.key === "approval_trace_path",
  );
  assert.deepEqual(
    trace?.public_event_kinds,
    contract.approval_trace_event_kinds,
  );
  for (const key of [
    "second_approval_release_path",
    "terminal_release_path",
  ]) {
    assert.equal(
      seamDiff.inserted.find((entry) => entry.key === key)?.content_sha256,
      "sha256:fdc935e6a3f33abdcfb4f5d7a335d408b2b988e7a5f8411d9f73349d1fab39be",
    );
  }
}

function capturePreparedSeams(prepared) {
  return Object.entries(prepared)
    .filter(
      ([key, value]) =>
        key.endsWith("_path") && typeof value === "string" && value.length > 0,
    )
    .map(([key, value]) => {
      if (!existsSync(value)) return { key, presence: "absent" };
      const bytes = readFileSync(value);
      const summary = {
        key,
        presence: "present",
        content_sha256: sha256Buffer(bytes),
        byte_count: bytes.length,
      };
      if (bytes.length <= 1024 * 1024) {
        const text = bytes.toString("utf8");
        const jsonLines = text
          .split(/\r?\n/u)
          .filter(Boolean)
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        summary.public_event_kinds = jsonLines
          .map(
            (entry) =>
              entry.kind ?? entry.event ?? entry.method ?? entry.status ?? null,
          )
          .filter((entry) => typeof entry === "string");
        if (jsonLines.length === 1 && Number.isSafeInteger(jsonLines[0].transport_calls)) {
          summary.transport_calls = jsonLines[0].transport_calls;
        }
        if (jsonLines.length === 1) {
          summary.public_bindings = Object.fromEntries(
            [
              "fixture_version",
              "workspace_id",
              "project_id",
              "working_frame_fingerprint",
              "source_catalog_fingerprint",
              "transport_calls",
            ]
              .filter((key) =>
                ["string", "number", "boolean"].includes(
                  typeof jsonLines[0][key],
                ),
              )
              .sort(compareCodeUnits)
              .map((key) => [key, jsonLines[0][key]]),
          );
        }
      }
      return summary;
    })
    .sort((left, right) => compareCodeUnits(left.key, right.key));
}

function diffSeams(before, after) {
  const beforeMap = new Map(before.map((entry) => [entry.key, entry]));
  const afterMap = new Map(after.map((entry) => [entry.key, entry]));
  const inserted = [];
  const updated = [];
  const deleted = [];
  for (const [key, entry] of afterMap) {
    const prior = beforeMap.get(key);
    if (!prior || prior.presence === "absent") {
      if (entry.presence === "present") inserted.push(entry);
    } else if (entry.presence === "absent") {
      deleted.push(prior);
    } else if (sha256Json(prior) !== sha256Json(entry)) {
      updated.push({ key, before: prior, after: entry });
    }
  }
  for (const [key, entry] of beforeMap) {
    if (!afterMap.has(key) && entry.presence === "present") deleted.push(entry);
  }
  return { inserted, updated, deleted };
}

function exactDiffMaterial(diff) {
  return {
    diff_version: diff.diff_version,
    before_snapshot_fingerprint: diff.before_snapshot_fingerprint,
    after_snapshot_fingerprint: diff.after_snapshot_fingerprint,
    inserted: diff.inserted,
    updated: diff.updated,
    deleted: diff.deleted,
    unchanged_count: diff.unchanged_count,
    seam_diff: diff.seam_diff,
  };
}

function exactTableOperationCounts(diff) {
  return {
    inserted: countBy(diff.inserted, (entry) => entry.table),
    updated: countBy(diff.updated, (entry) => entry.table),
    deleted: countBy(diff.deleted, (entry) => entry.table),
  };
}

function boundedDiffEntries(diff) {
  return [
    ...diff.updated.map((entry) => ({
      operation: "update",
      category: entry.category,
      table: entry.table,
      identity: entry.identity,
      before_identity: entry.before_identity,
      after_identity: entry.after_identity,
      before_fingerprint: entry.before_fingerprint,
      after_fingerprint: entry.after_fingerprint,
    })),
    ...diff.inserted.map((entry) => ({
      operation: "insert",
      category: entry.category,
      table: entry.table,
      identity: entry.identity,
      row_fingerprint: entry.row_fingerprint,
    })),
    ...diff.deleted.map((entry) => ({
      operation: "delete",
      category: entry.category,
      table: entry.table,
      identity: entry.identity,
      row_fingerprint: entry.row_fingerprint,
    })),
  ].slice(0, 32);
}

function categoryForTable(table) {
  if (table === "vnext_core_records") return "durable_semantic_record";
  if (
    table === "vnext_semantic_state_entries" ||
    table === "vnext_semantic_target_heads"
  ) {
    return "semantic_project_state";
  }
  if (
    table === "vnext_project_identities" ||
    table === "vnext_project_root_bindings" ||
    table === "vnext_active_project_selections" ||
    table === "vnext_recent_projects" ||
    table === "vnext_project_automation_controls" ||
    table === "vnext_project_personal_perspective_scopes"
  ) {
    return "project_state";
  }
  if (table === "autonomy_runs") return "run";
  if (table === "autonomy_run_events") return "run_event";
  if (table.startsWith("autonomy_run_")) return "run_auxiliary";
  if (table === "vnext_local_operator_sessions") return "local_operator_state";
  if (/memory|perspective/iu.test(table)) return "memory_perspective";
  return "other_durable_state";
}

function fallbackIdentityColumns(row) {
  const candidates = Object.keys(row).filter((key) => /(?:^|_)id$/u.test(key));
  return candidates.length > 0 ? candidates.sort(compareCodeUnits) : Object.keys(row).sort(compareCodeUnits);
}

function normalizeSqliteValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return `base64:${value.toString("base64")}`;
  if (Array.isArray(value)) return value.map(normalizeSqliteValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareCodeUnits(left, right))
        .map(([key, entry]) => [key, normalizeSqliteValue(entry)]),
    );
  }
  return String(value);
}

function countBy(entries, keyOwner) {
  return Object.fromEntries(
    [...entries.reduce((counts, entry) => {
      const key = keyOwner(entry);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return counts;
    }, new Map())]
      .sort(([left], [right]) => compareCodeUnits(String(left), String(right)))
      .map(([key, count]) => [key, count]),
  );
}

function sha256CanonicalJsonText(text) {
  try {
    return sha256Json(JSON.parse(text));
  } catch {
    return sha256String(text);
  }
}

function canonicalizeProtocolValue(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? JSON.stringify(value) : "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeProtocolValue).join(",")}]`;
  }
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort(compareCodeUnits)
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalizeProtocolValue(value[key])}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function sha256Json(value) {
  return sha256String(JSON.stringify(normalizeSqliteValue(value)));
}

function sha256String(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sha256Buffer(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function rowSort(left, right) {
  return compareCodeUnits(left.stable_key, right.stable_key);
}
