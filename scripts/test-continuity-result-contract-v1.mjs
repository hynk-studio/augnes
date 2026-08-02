import assert from "node:assert/strict";

import {
  assertContinuityFinalSuccessV1,
  createContinuityCompletionOwnerV1,
  loadContinuityResultContractV1,
} from "./continuity-result-contract-v1.mjs";

const contract = loadContinuityResultContractV1();
assert.equal(contract.field_ids.length, 29);
assert.equal(contract.marker_ids.length, 30);
assert.equal(new Set(contract.field_ids).size, 29);
assert.equal(new Set(contract.marker_ids).size, 30);

const owner = createContinuityCompletionOwnerV1(contract);
for (const fieldId of contract.field_ids) owner.completeField(fieldId);
for (const markerId of contract.marker_ids) owner.recordMarker(markerId);
owner.assertExact();

assert.throws(
  () => owner.completeField(contract.field_ids[0]),
  /duplicate_continuity_field/u,
);
assert.throws(
  () => owner.recordMarker(contract.marker_ids[0]),
  /duplicate_continuity_marker/u,
);
assert.throws(
  () => createContinuityCompletionOwnerV1(contract).completeField("foreign"),
  /foreign_continuity_field/u,
);

const result = {
  ok: false,
  failure: null,
  completed_detailed_field_ids: owner.fieldIds(),
  completed_detailed_field_fingerprint: owner.fieldFingerprint(),
  semantic_markers: owner.markerIds(),
  semantic_marker_fingerprint: owner.markerFingerprint(),
  unexpected_external_request_count: 0,
  unexpected_console_failure_count: 0,
  unexpected_page_failure_count: 0,
  unexpected_request_failure_count: 0,
  credential_private_material_boundary: true,
  default_database_isolated: true,
  provider_or_external_network_call: false,
  cleanup_complete: true,
  owned_streams_settled: true,
  owned_process_residue_count: 0,
  listener_residue_count: 0,
  temporary_root_removed: true,
  temporary_process_root_removed: true,
  temporary_profile_removed: true,
  temporary_fixture_removed: true,
  temporary_database_removed: true,
  temporary_imported_database_removed: true,
  runtime_shutdown_complete: true,
  chrome_cdp_shutdown_complete: true,
  acceptance_bound_ms: 480_000,
  total_duration_ms: 1,
  ...Object.fromEntries(contract.field_ids.map((fieldId) => [fieldId, true])),
};

assertContinuityFinalSuccessV1({
  result,
  contract,
  completion_owner: owner,
  functional_execution_succeeded: true,
});

for (const mutation of [
  { field: contract.field_ids[0], value: false },
  { field: "cleanup_complete", value: false },
  { field: "owned_process_residue_count", value: 1 },
  { field: "listener_residue_count", value: 1 },
  { field: "unexpected_external_request_count", value: 1 },
]) {
  const changed = structuredClone(result);
  changed[mutation.field] = mutation.value;
  assert.throws(() =>
    assertContinuityFinalSuccessV1({
      result: changed,
      contract,
      completion_owner: owner,
      functional_execution_succeeded: true,
    }),
  );
}

process.stdout.write(
  `${JSON.stringify({
    test: "continuity-result-contract-v1",
    status: "pass",
    detailed_fields: contract.field_ids.length,
    semantic_markers: contract.marker_ids.length,
  })}\n`,
);
