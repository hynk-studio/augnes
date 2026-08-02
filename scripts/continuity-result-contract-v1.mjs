import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const DEFAULT_MANIFEST_URL = new URL(
  "./browser-verification-owners.v1.json",
  import.meta.url,
);

export function loadContinuityResultContractV1({
  manifest_url = DEFAULT_MANIFEST_URL,
} = {}) {
  const manifest = JSON.parse(readFileSync(manifest_url, "utf8"));
  assert.equal(manifest.schema, "augnes.browser-verification-owners.v1");
  const owner = manifest.owners?.continuity;
  assert(owner, "continuity_owner_missing");
  const fieldIds = owner.families.flatMap((family) => family.fields);
  const markerIds = owner.families.flatMap((family) => family.markers);
  assert.equal(fieldIds.length, new Set(fieldIds).size);
  assert.equal(markerIds.length, new Set(markerIds).size);
  assert.deepEqual(new Set(owner.value_contracts.boolean_true), new Set(fieldIds));
  return Object.freeze({
    field_ids: Object.freeze(fieldIds),
    marker_ids: Object.freeze(markerIds),
  });
}

export function createContinuityCompletionOwnerV1(contract) {
  const requiredFields = new Set(contract.field_ids);
  const requiredMarkers = new Set(contract.marker_ids);
  const completedFields = new Set();
  const completedMarkers = new Set();
  return Object.freeze({
    completeField(fieldId) {
      assert.equal(requiredFields.has(fieldId), true, `foreign_continuity_field:${fieldId}`);
      assert.equal(completedFields.has(fieldId), false, `duplicate_continuity_field:${fieldId}`);
      completedFields.add(fieldId);
    },
    recordMarker(markerId) {
      assert.equal(requiredMarkers.has(markerId), true, `foreign_continuity_marker:${markerId}`);
      assert.equal(completedMarkers.has(markerId), false, `duplicate_continuity_marker:${markerId}`);
      completedMarkers.add(markerId);
    },
    fieldIds() {
      return [...completedFields].sort(compareCodeUnits);
    },
    markerIds() {
      return [...completedMarkers].sort(compareCodeUnits);
    },
    fieldFingerprint() {
      return hashStringSet(completedFields);
    },
    markerFingerprint() {
      return hashStringSet(completedMarkers);
    },
    assertExact() {
      assert.deepEqual(completedFields, requiredFields, "continuity_field_completion_mismatch");
      assert.deepEqual(completedMarkers, requiredMarkers, "continuity_marker_completion_mismatch");
    },
  });
}

export function assertContinuityFinalSuccessV1({
  result,
  contract,
  completion_owner,
  functional_execution_succeeded,
}) {
  assert.equal(functional_execution_succeeded, true, "continuity_functional_execution_failed");
  assert.equal(result.ok, false, "continuity_ok_before_final_gate");
  assert.equal(result.failure, null, "continuity_failure_present");
  completion_owner.assertExact();
  assert.deepEqual(result.completed_detailed_field_ids, completion_owner.fieldIds());
  assert.deepEqual(result.semantic_markers, completion_owner.markerIds());
  assert.equal(result.completed_detailed_field_fingerprint, completion_owner.fieldFingerprint());
  assert.equal(result.semantic_marker_fingerprint, completion_owner.markerFingerprint());
  for (const fieldId of contract.field_ids) {
    assert.equal(result[fieldId], true, `${fieldId}:boolean_true`);
  }
  assert.equal(result.unexpected_external_request_count, 0);
  assert.equal(result.unexpected_console_failure_count, 0);
  assert.equal(result.unexpected_page_failure_count, 0);
  assert.equal(result.unexpected_request_failure_count, 0);
  assert.equal(result.credential_private_material_boundary, true);
  assert.equal(result.default_database_isolated, true);
  assert.equal(result.provider_or_external_network_call, false);
  assert.equal(result.cleanup_complete, true);
  assert.equal(result.owned_streams_settled, true);
  assert.equal(result.owned_process_residue_count, 0);
  assert.equal(result.listener_residue_count, 0);
  assert.equal(result.temporary_root_removed, true);
  assert.equal(result.temporary_process_root_removed, true);
  assert.equal(result.temporary_profile_removed, true);
  assert.equal(result.temporary_fixture_removed, true);
  assert.equal(result.temporary_database_removed, true);
  assert.equal(result.temporary_imported_database_removed, true);
  assert.equal(result.runtime_shutdown_complete, true);
  assert.equal(result.chrome_cdp_shutdown_complete, true);
  assert.equal(Number.isInteger(result.total_duration_ms), true);
  assert.equal(result.total_duration_ms >= 0, true);
  assert.equal(result.total_duration_ms < result.acceptance_bound_ms, true);
}

function hashStringSet(values) {
  return createHash("sha256")
    .update(JSON.stringify([...values].sort(compareCodeUnits)))
    .digest("hex");
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
