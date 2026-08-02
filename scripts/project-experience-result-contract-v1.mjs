import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const DEFAULT_MANIFEST_URL = new URL(
  "./browser-verification-owners.v1.json",
  import.meta.url,
);

export function loadProjectExperienceResultContractV1({
  manifest_url = DEFAULT_MANIFEST_URL,
} = {}) {
  const manifest = JSON.parse(readFileSync(manifest_url, "utf8"));
  assert.equal(manifest.schema, "augnes.browser-verification-owners.v1");
  const owner = manifest.owners?.project_experience;
  assert(owner, "project_experience_owner_missing");
  const requiredFieldIds = owner.families.flatMap((family) => family.fields);
  const requiredMarkerIds = owner.families.flatMap((family) => family.markers);
  assert.equal(requiredFieldIds.length, new Set(requiredFieldIds).size);
  assert.equal(requiredMarkerIds.length, new Set(requiredMarkerIds).size);
  const valueContractByField = expandValueContracts(
    owner.value_contracts,
    requiredFieldIds,
  );

  return Object.freeze({
    field_ids: Object.freeze([...requiredFieldIds]),
    marker_ids: Object.freeze([...requiredMarkerIds]),
    value_contract_by_field: Object.freeze(valueContractByField),
    runtime_value_contracts: Object.freeze(owner.value_contracts.matrices),
  });
}

export function createDetailedFieldCompletionOwnerV1(contract) {
  const required = new Set(contract.field_ids);
  const completed = new Set();
  return Object.freeze({
    complete(fieldId) {
      assert.equal(
        required.has(fieldId),
        true,
        `foreign_detailed_field_completion:${String(fieldId)}`,
      );
      assert.equal(
        completed.has(fieldId),
        false,
        `duplicate_detailed_field_completion:${fieldId}`,
      );
      completed.add(fieldId);
    },
    completedIds() {
      return [...completed].sort(compareCodeUnits);
    },
    completedFingerprint() {
      return hashStringSet(completed);
    },
    assertExact() {
      assert.deepEqual(completed, required, "detailed_field_completion_mismatch");
    },
  });
}

export function assertProjectExperienceDetailedValuesV1({
  result,
  contract,
}) {
  const runtimeContracts = contract.runtime_value_contracts;
  for (const fieldId of contract.field_ids) {
    const value = result[fieldId];
    const valueContract = contract.value_contract_by_field[fieldId];
    switch (valueContract) {
      case "boolean_true":
        assert.equal(value, true, `${fieldId}:boolean_true`);
        break;
      case "canonical_project_route":
        assert.equal(typeof value, "string", `${fieldId}:route_type`);
        assert.match(value, /^\/projects\/project(?:%3A|:)[^/?#]+$/u);
        assert.match(
          decodeURIComponent(value.split("/").at(-1)),
          /^project:[^/?#]+$/u,
        );
        break;
      case "minimum_project_home_unknown_status":
        assert.equal(
          runtimeContracts.minimum_project_home_unknown_status.accepted_statuses
            .includes(value),
          true,
          `${fieldId}:status`,
        );
        break;
      case "retired_route_status_matrix":
        assertExactStatusMap(
          value,
          runtimeContracts.retired_route_status_matrix,
          fieldId,
        );
        break;
      case "product_shell_route_matrix":
        assertExactProjectionMatrix(
          value,
          runtimeContracts.product_shell_route_matrix.entries,
          ["route", "primary_zone", "utility_context", "project_context_label"],
          fieldId,
        );
        break;
      case "product_shell_responsive_matrix":
        assertExactProjectionMatrix(
          value,
          runtimeContracts.product_shell_responsive_matrix.entries,
          ["route", "width"],
          fieldId,
        );
        break;
      case "viewport_surface_matrix":
        assertExactProjectionMatrix(
          value,
          runtimeContracts.viewport_surface_matrix.entries,
          ["surface", "width", "height"],
          fieldId,
        );
        break;
      case "empty_array":
        assert.deepEqual(value, [], `${fieldId}:empty_array`);
        break;
      default:
        assert.fail(`unsupported_detailed_value_contract:${valueContract}`);
    }
  }
}

function expandValueContracts(valueContracts, requiredFieldIds) {
  const byField = {};
  for (const [kind, fieldIds] of Object.entries(valueContracts)) {
    if (kind === "matrices") continue;
    assert.equal(Array.isArray(fieldIds), true, `invalid_value_contract:${kind}`);
    for (const fieldId of fieldIds) {
      assert.equal(Object.hasOwn(byField, fieldId), false, `duplicate_value_contract:${fieldId}`);
      byField[fieldId] = kind;
    }
  }
  assert.deepEqual(new Set(Object.keys(byField)), new Set(requiredFieldIds));
  return byField;
}

export function assertProjectExperienceFinalSuccessV1({
  result,
  contract,
  completion_owner,
  functional_execution_succeeded,
}) {
  assert.equal(functional_execution_succeeded, true, "functional_execution_failed");
  assert.equal(result.ok, false, "result_ok_must_be_false_before_final_gate");
  assert.equal(result.failure, null, "functional_or_cleanup_failure_present");
  completion_owner.assertExact();
  assert.deepEqual(
    result.completed_detailed_field_ids,
    completion_owner.completedIds(),
  );
  assert.equal(
    result.completed_detailed_field_fingerprint,
    completion_owner.completedFingerprint(),
  );
  assertProjectExperienceDetailedValuesV1({ result, contract });
  assertExactStringSet(result.semantic_markers, contract.marker_ids, "semantic_markers");
  assert.equal(result.detailed_field_count, contract.field_ids.length);
  assert.equal(result.detailed_marker_count, contract.marker_ids.length);
  assert.equal(result.unexpected_external_request_count, 0);
  assert.equal(result.unexpected_console_failure_count, 0);
  assert.equal(result.unexpected_page_failure_count, 0);
  assert.equal(result.unexpected_request_failure_count, 0);
  assert.equal(result.credential_private_material_boundary, true);
  assert.equal(result.default_database_isolated, true);
  assert.equal(result.provider_or_external_network_call, false);
  assert.equal(result.semantic_proposal_created, false);
  assert.equal(result.review_decision_created, false);
  assert.equal(result.transition_created, false);
  assert.equal(result.work_closure_created, false);
  assert.equal(result.native_host_execution_started, false);
  assert.equal(result.cleanup_complete, true);
  assert.equal(result.owned_streams_settled, true);
  assert.equal(result.owned_process_residue_count, 0);
  assert.equal(result.listener_residue_count, 0);
  assert.equal(result.temporary_root_removed, true);
  assert.equal(result.temporary_process_root_removed, true);
  assert.equal(result.temporary_profile_removed, true);
  assert.equal(result.temporary_database_removed, true);
  assert.equal(result.temporary_fixture_removed, true);
  assert.equal(result.temporary_picker_sequence_removed, true);
  assert.equal(result.runtime_shutdown_complete, true);
  assert.equal(result.chrome_cdp_shutdown_complete, true);
  assert.equal(Number.isInteger(result.total_duration_ms), true);
  assert.equal(result.total_duration_ms >= 0, true);
  assert.equal(result.total_duration_ms < result.acceptance_bound_ms, true);
}

export function hashStringSet(values) {
  return createHash("sha256")
    .update(JSON.stringify([...values].sort(compareCodeUnits)))
    .digest("hex");
}

function assertExactStatusMap(actual, contract, label) {
  assert.equal(actual !== null && typeof actual === "object", true, label);
  assert.equal(Array.isArray(actual), false, label);
  assert.deepEqual(
    Object.keys(actual).sort(compareCodeUnits),
    [...contract.route_ids].sort(compareCodeUnits),
    `${label}:route_ids`,
  );
  for (const routeId of contract.route_ids) {
    assert.equal(
      contract.accepted_statuses.includes(actual[routeId]),
      true,
      `${label}:${routeId}`,
    );
  }
}

function assertExactProjectionMatrix(actual, expected, keys, label) {
  assert.equal(Array.isArray(actual), true, label);
  assert.equal(Array.isArray(expected), true, `${label}:contract`);
  const project = (entry) =>
    Object.fromEntries(keys.map((key) => [key, entry?.[key] ?? null]));
  const actualProjection = actual.map(project).sort(compareJson);
  const expectedProjection = expected.map(project).sort(compareJson);
  assert.deepEqual(actualProjection, expectedProjection, label);
}

function assertExactStringSet(actual, expected, label) {
  assert.equal(Array.isArray(actual), true, label);
  assert.equal(actual.length, new Set(actual).size, `${label}:duplicates`);
  assert.deepEqual(new Set(actual), new Set(expected), label);
}

function compareJson(left, right) {
  return compareCodeUnits(JSON.stringify(left), JSON.stringify(right));
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
