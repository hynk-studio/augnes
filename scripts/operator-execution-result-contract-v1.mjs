import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const INVENTORY_URL = new URL(
  "./browser-verification-ownership-inventory.v1.json",
  import.meta.url,
);
const EQUIVALENCE_URL = new URL(
  "./operator-execution-equivalence.v1.json",
  import.meta.url,
);

export const OPERATOR_EXECUTION_OWNER_V1 = "operator_execution";

export function loadOperatorExecutionResultContractV1({
  child_id,
  inventory_url = INVENTORY_URL,
  equivalence_url = EQUIVALENCE_URL,
} = {}) {
  const inventory = JSON.parse(readFileSync(inventory_url, "utf8"));
  const equivalenceDocument = JSON.parse(
    readFileSync(equivalence_url, "utf8"),
  );
  const operatorShard = inventory.future_shards.find(
    (entry) => entry.id === OPERATOR_EXECUTION_OWNER_V1,
  );
  assert(operatorShard, "operator_execution_inventory_missing");
  const partition = operatorShard.child_partitions?.find(
    (entry) => entry.id === child_id,
  );
  assert(partition, `operator_execution_child_unknown:${String(child_id)}`);
  const familyById = new Map(
    inventory.coverage_equivalence.map((entry) => [entry.id, entry]),
  );
  const fieldIds = partition.detailed_family_ids.flatMap((familyId) =>
    Object.keys(familyById.get(familyId)?.result_fields ?? {}),
  );
  const markerIds = partition.detailed_family_ids.flatMap(
    (familyId) => familyById.get(familyId)?.record_markers ?? [],
  );
  assert.equal(fieldIds.length, new Set(fieldIds).size);
  assert.equal(markerIds.length, new Set(markerIds).size);
  const equivalence = equivalenceDocument.detailed_fields.filter(
    (entry) => entry.child_id === child_id,
  );
  assert.equal(equivalence.length, fieldIds.length);
  assert.deepEqual(
    new Set(equivalence.map((entry) => entry.detailed_field_id)),
    new Set(fieldIds),
  );
  const markerEquivalence = equivalenceDocument.semantic_markers.filter(
    (entry) => entry.child_id === child_id,
  );
  assert.equal(markerEquivalence.length, markerIds.length);
  assert.deepEqual(
    new Set(markerEquivalence.map((entry) => entry.marker_id)),
    new Set(markerIds),
  );
  return Object.freeze({
    owner: OPERATOR_EXECUTION_OWNER_V1,
    child_id,
    fixture_profile: partition.fixture_profile,
    executable_source: partition.executable_source,
    family_ids: Object.freeze([...partition.detailed_family_ids]),
    field_ids: Object.freeze([...fieldIds]),
    marker_ids: Object.freeze([...markerIds]),
    field_set_fingerprint: hashStringSet(fieldIds),
    marker_set_fingerprint: hashStringSet(markerIds),
    equivalence: Object.freeze(equivalence.map(Object.freeze)),
    marker_equivalence: Object.freeze(markerEquivalence.map(Object.freeze)),
  });
}

export function loadOperatorExecutionOwnerContractV1({
  inventory_url = INVENTORY_URL,
  equivalence_url = EQUIVALENCE_URL,
} = {}) {
  const inventory = JSON.parse(readFileSync(inventory_url, "utf8"));
  const operatorShard = inventory.future_shards.find(
    (entry) => entry.id === OPERATOR_EXECUTION_OWNER_V1,
  );
  assert(operatorShard, "operator_execution_inventory_missing");
  const children = operatorShard.child_partitions.map((entry) =>
    loadOperatorExecutionResultContractV1({
      child_id: entry.id,
      inventory_url,
      equivalence_url,
    }),
  );
  const fields = children.flatMap((entry) => entry.field_ids);
  const markers = children.flatMap((entry) => entry.marker_ids);
  const expectedFields = operatorShard.detailed_family_ids.flatMap((familyId) =>
    Object.keys(
      inventory.coverage_equivalence.find((entry) => entry.id === familyId)
        ?.result_fields ?? {},
    ),
  );
  const expectedMarkers = operatorShard.detailed_family_ids.flatMap(
    (familyId) =>
      inventory.coverage_equivalence.find((entry) => entry.id === familyId)
        ?.record_markers ?? [],
  );
  assert.equal(fields.length, 125);
  assert.equal(markers.length, 63);
  assert.equal(fields.length, new Set(fields).size, "operator_field_overlap");
  assert.equal(markers.length, new Set(markers).size, "operator_marker_overlap");
  assert.deepEqual(new Set(fields), new Set(expectedFields));
  assert.deepEqual(new Set(markers), new Set(expectedMarkers));
  return Object.freeze({
    owner: OPERATOR_EXECUTION_OWNER_V1,
    children: Object.freeze(children),
    field_ids: Object.freeze([...fields]),
    marker_ids: Object.freeze([...markers]),
    field_union_fingerprint: hashStringSet(fields),
    marker_union_fingerprint: hashStringSet(markers),
  });
}

export function createExactStringCompletionOwnerV1({
  required_ids,
  foreign_code,
  duplicate_code,
  mismatch_code,
}) {
  const required = new Set(required_ids);
  const completed = new Set();
  return Object.freeze({
    complete(id) {
      assert.equal(required.has(id), true, `${foreign_code}:${String(id)}`);
      assert.equal(completed.has(id), false, `${duplicate_code}:${String(id)}`);
      completed.add(id);
    },
    ids() {
      return [...completed].sort(compareCodeUnits);
    },
    fingerprint() {
      return hashStringSet(completed);
    },
    assertExact() {
      assert.deepEqual(completed, required, mismatch_code);
    },
  });
}

export function createOperatorDetailedFieldCompletionOwnerV1(contract) {
  return createExactStringCompletionOwnerV1({
    required_ids: contract.field_ids,
    foreign_code: "foreign_operator_detailed_field_completion",
    duplicate_code: "duplicate_operator_detailed_field_completion",
    mismatch_code: "operator_detailed_field_completion_mismatch",
  });
}

export function createOperatorSemanticMarkerOwnerV1(contract) {
  return createExactStringCompletionOwnerV1({
    required_ids: contract.marker_ids,
    foreign_code: "foreign_operator_semantic_marker",
    duplicate_code: "duplicate_operator_semantic_marker",
    mismatch_code: "operator_semantic_marker_mismatch",
  });
}

export function assertOperatorExecutionDetailedValuesV1({ result, contract }) {
  for (const entry of contract.equivalence) {
    const id = entry.detailed_field_id;
    const value = result[id];
    const valueContract = entry.runtime_value_contract;
    switch (valueContract.kind) {
      case "boolean_true":
        assert.equal(value, true, `${id}:boolean_true`);
        break;
      case "boolean_false":
        assert.equal(value, false, `${id}:boolean_false`);
        break;
      case "exact_integer":
        assert.equal(value, valueContract.value, `${id}:exact_integer`);
        break;
      case "exact_string":
        assert.equal(value, valueContract.value, `${id}:exact_string`);
        break;
      case "nonempty_string":
        assert.equal(typeof value, "string", `${id}:string`);
        assert.equal(value.length > 0, true, `${id}:nonempty`);
        break;
      case "nonempty_array":
        assert.equal(Array.isArray(value), true, `${id}:array`);
        assert.equal(value.length > 0, true, `${id}:nonempty`);
        break;
      case "bounded_object":
        assert.equal(value !== null && typeof value === "object", true, id);
        assert.equal(Array.isArray(value), false, id);
        assert.equal(JSON.stringify(value).length <= valueContract.max_bytes, true, id);
        break;
      case "exact_json":
        assert.deepEqual(value, valueContract.value, `${id}:exact_json`);
        break;
      case "guide_brief_transition_request_counts":
        assert.deepEqual(Object.keys(value ?? {}).sort(compareCodeUnits), [
          "after_application",
          "after_confirmation",
          "after_impact",
          "application_delta",
          "before_impact",
        ]);
        assert.equal(Number.isSafeInteger(value.before_impact), true);
        assert.equal(value.after_impact, value.before_impact);
        assert.equal(value.after_confirmation, value.before_impact);
        assert.equal(value.after_application, value.before_impact + 1);
        assert.equal(value.application_delta, 1);
        break;
      case "expected_refusal_accounting_summary": {
        assert.deepEqual(Object.keys(value ?? {}).sort(compareCodeUnits), [
          "duplicate_deliveries",
          "raw_console_events_preserved",
          "tokens",
        ]);
        assert.equal(value.raw_console_events_preserved, true);
        assert.deepEqual(value.duplicate_deliveries, []);
        assert.equal(value.tokens.length, 1);
        const token = value.tokens[0];
        assert.deepEqual(Object.keys(token).sort(compareCodeUnits), [
          "authenticated_recovery_response_count",
          "authenticated_request_id",
          "refusal_log_count",
          "refusal_request_id",
          "refusal_response_count",
          "refusal_status",
          "token_id",
        ]);
        assert.equal(token.token_id, "operator-review-control-stale-session");
        assert.equal(token.refusal_status, 403);
        assert.equal(token.refusal_response_count, 1);
        assert.equal(token.refusal_log_count, 1);
        assert.equal(token.authenticated_recovery_response_count, 1);
        assert.equal(typeof token.refusal_request_id, "string");
        assert.equal(typeof token.authenticated_request_id, "string");
        assert.notEqual(token.refusal_request_id, token.authenticated_request_id);
        break;
      }
      case "approval_barrier_timing": {
        assert.equal(value?.timing_version, "browser_approval_barriers.v0.1");
        assert.equal(Array.isArray(value.events), true);
        assert.equal(
          value.events.filter((entry) => entry.event === "approval_emitted")
            .length,
          2,
        );
        assert.equal(
          value.events.filter(
            (entry) => entry.event === "approval_decision_received",
          ).length,
          2,
        );
        assert.equal(
          value.events.filter(
            (entry) => entry.event === "browser_release_observed",
          ).length,
          2,
        );
        assert.equal(
          value.events.filter(
            (entry) => entry.event === "terminal_state_emitted",
          ).length,
          1,
        );
        assert.equal(
          value.events.every(
            (entry) =>
              Number.isSafeInteger(entry.elapsed_ms) &&
              entry.elapsed_ms >= 0,
          ),
          true,
        );
        break;
      }
      default:
        assert.fail(`unsupported_operator_runtime_value_contract:${String(valueContract?.kind)}`);
    }
  }
}

export function assertOperatorExecutionFinalSuccessV1({
  result,
  contract,
  field_owner,
  marker_owner,
  functional_execution_succeeded,
}) {
  assert.equal(functional_execution_succeeded, true);
  assert.equal(result.ok, false, "result_ok_must_remain_false_before_final_gate");
  assert.equal(result.failure, null, "operator_failure_present");
  field_owner.assertExact();
  marker_owner.assertExact();
  assert.deepEqual(result.completed_detailed_field_ids, field_owner.ids());
  assert.equal(
    result.completed_detailed_field_fingerprint,
    field_owner.fingerprint(),
  );
  assert.deepEqual(result.semantic_marker_ids, marker_owner.ids());
  assert.equal(result.semantic_marker_fingerprint, marker_owner.fingerprint());
  assert.equal(result.detailed_field_set_fingerprint, contract.field_set_fingerprint);
  assert.equal(result.semantic_marker_set_fingerprint, contract.marker_set_fingerprint);
  assertOperatorExecutionDetailedValuesV1({ result, contract });
  assert.deepEqual(result.observed_effect_delta, result.permitted_effect_delta);
  assert.equal(result.unowned_effect_count, 0);
  assert.equal(result.unexpected_external_request_count, 0);
  assert.equal(result.unexpected_console_failure_count, 0);
  assert.equal(result.unexpected_page_failure_count, 0);
  assert.equal(result.unexpected_request_failure_count, 0);
  assert.equal(result.unexpected_refusal_accounting_failure_count, 0);
  assert.equal(result.credential_private_material_boundary, true);
  assert.equal(result.cleanup_complete, true);
  assert.equal(result.owned_streams_settled, true);
  assert.equal(result.owned_process_residue_count, 0);
  assert.equal(result.listener_residue_count, 0);
  assert.equal(result.temporary_root_removed, true);
  assert.equal(result.temporary_process_root_removed, true);
  assert.equal(result.temporary_profile_removed, true);
  assert.equal(result.temporary_database_removed, true);
  assert.equal(result.temporary_fixture_removed, true);
  assert.equal(result.temporary_signal_removed, true);
  assert.equal(result.temporary_transport_removed, true);
  assert.equal(result.runtime_shutdown_complete, true);
  assert.equal(result.chrome_cdp_shutdown_complete, true);
  assert.equal(result.e2e_timing_summary?.timing_version, "browser_e2e_timing.v0.1");
  assert.equal(result.e2e_timing_summary?.scope, contract.child_id);
  assert.equal(Number.isSafeInteger(result.e2e_timing_summary?.event_count), true);
  for (const requiredTimingKind of [
    "fixture_construction",
    "runtime_startup",
    "chrome_startup",
    "phase",
    "navigation",
    "request_quiet",
    "runtime_shutdown",
    "chrome_cdp_shutdown",
    "global_cleanup",
    "stream_settlement",
  ]) {
    assert.equal(
      Number.isSafeInteger(
        result.e2e_timing_summary?.totals_ms?.[requiredTimingKind],
      ),
      true,
      `operator_timing_kind_missing:${requiredTimingKind}`,
    );
  }
  assert.equal(result.total_duration_ms < result.acceptance_bound_ms, true);
  assert.equal(result.total_duration_ms < 300_000, true);
  assert.equal(result.reference_headroom_ms >= 180_000, true);
}

export function createOperatorResultFieldDefaultsV1(contract) {
  return Object.fromEntries(
    contract.equivalence.map((entry) => {
      const kind = entry.runtime_value_contract.kind;
      if (kind === "boolean_true" || kind === "boolean_false") {
        return [entry.detailed_field_id, false];
      }
      if (kind === "exact_integer") return [entry.detailed_field_id, 0];
      if (kind === "exact_string" || kind === "nonempty_string") {
        return [entry.detailed_field_id, null];
      }
      if (kind === "nonempty_array") return [entry.detailed_field_id, []];
      if (
        kind === "bounded_object" ||
        kind === "exact_json" ||
        kind === "approval_barrier_timing" ||
        kind === "guide_brief_transition_request_counts" ||
        kind === "expected_refusal_accounting_summary"
      ) {
        return [entry.detailed_field_id, null];
      }
      assert.fail(`unsupported_operator_result_default:${kind}`);
    }),
  );
}

export function hashStringSet(values) {
  return createHash("sha256")
    .update(JSON.stringify([...values].sort(compareCodeUnits)))
    .digest("hex");
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
