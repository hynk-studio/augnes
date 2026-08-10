#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  assertProjectExperienceDetailedValuesV1,
  assertProjectExperienceFinalSuccessV1,
  createDetailedFieldCompletionOwnerV1,
  loadProjectExperienceResultContractV1,
} from "./project-experience-result-contract-v1.mjs";

const contract = loadProjectExperienceResultContractV1();
assert.equal(contract.field_ids.length, 69);
assert.equal(contract.marker_ids.length, 8);
assert.equal(Object.keys(contract.value_contract_by_field).length, 69);

const completionOwner = completedOwner();
const successResult = buildValidResult(completionOwner);
assert.doesNotThrow(() =>
  assertProjectExperienceFinalSuccessV1({
    result: successResult,
    contract,
    completion_owner: completionOwner,
    functional_execution_succeeded: true,
  }),
);

const realProviderOwner = completedOwner();
const realProviderResult = buildValidResult(realProviderOwner);
realProviderResult.validation_mode = "real_provider_acceptance";
realProviderResult.provider_or_external_network_call = true;
realProviderResult.guide_brief_real_provider_acceptance = {
  provider_egress_started: 7,
  provider_egress_completed: 7,
};
assert.doesNotThrow(() =>
  assertProjectExperienceFinalSuccessV1({
    result: realProviderResult,
    contract,
    completion_owner: realProviderOwner,
    functional_execution_succeeded: true,
  }),
);

const duplicateOwner = createDetailedFieldCompletionOwnerV1(contract);
duplicateOwner.complete(contract.field_ids[0]);
assert.throws(
  () => duplicateOwner.complete(contract.field_ids[0]),
  /duplicate_detailed_field_completion/u,
);
assert.throws(
  () => duplicateOwner.complete("operator_session_bootstrap"),
  /foreign_detailed_field_completion/u,
);
assert.throws(
  () => duplicateOwner.assertExact(),
  /detailed_field_completion_mismatch/u,
);

for (const [label, mutate] of [
  ["boolean detailed field", (result) => (result.folder_picker_cancelled_usable = false)],
  ["canonical project route", (result) => (result.folder_onboarding_destination = "/projects/not-canonical")],
  ["unknown project status", (result) => (result.minimum_project_home_unknown_project_status = 404)],
  ["retired route matrix", (result) => delete result.retired_route_statuses.packet_handoff_api],
  ["ProductShell route matrix", (result) => result.product_shell_route_classifications.pop()],
  ["ProductShell responsive matrix", (result) => result.product_shell_responsive_results.pop()],
  ["viewport surface matrix", (result) => result.viewport_results.pop()],
  ["viewport warnings", (result) => result.viewport_warnings.push("warning")],
]) {
  const result = structuredClone(successResult);
  mutate(result);
  assert.throws(
    () => assertProjectExperienceDetailedValuesV1({ result, contract }),
    undefined,
    label,
  );
}

for (const [label, mutate, functionalExecutionSucceeded = true] of [
  ["functional execution", () => {}, false],
  ["semantic marker", (result) => result.semantic_markers.pop()],
  ["external request", (result) => (result.unexpected_external_request_count = 1)],
  ["console failure", (result) => (result.unexpected_console_failure_count = 1)],
  ["page failure", (result) => (result.unexpected_page_failure_count = 1)],
  ["request failure", (result) => (result.unexpected_request_failure_count = 1)],
  ["credential boundary", (result) => (result.credential_private_material_boundary = false)],
  ["authority effect", (result) => (result.semantic_proposal_created = true)],
  ["cleanup incomplete", (result) => (result.cleanup_complete = false)],
  ["stream settlement", (result) => (result.owned_streams_settled = false)],
  ["process residue", (result) => (result.owned_process_residue_count = 1)],
  ["listener residue", (result) => (result.listener_residue_count = 1)],
  ["temporary root residue", (result) => (result.temporary_root_removed = false)],
  ["process root residue", (result) => (result.temporary_process_root_removed = false)],
  ["profile residue", (result) => (result.temporary_profile_removed = false)],
  ["database residue", (result) => (result.temporary_database_removed = false)],
  ["fixture residue", (result) => (result.temporary_fixture_removed = false)],
  ["picker residue", (result) => (result.temporary_picker_sequence_removed = false)],
  ["runtime shutdown", (result) => (result.runtime_shutdown_complete = false)],
  ["Chrome CDP shutdown", (result) => (result.chrome_cdp_shutdown_complete = false)],
  ["duration bound", (result) => (result.total_duration_ms = result.acceptance_bound_ms)],
]) {
  const owner = completedOwner();
  const result = buildValidResult(owner);
  mutate(result);
  assert.throws(
    () =>
      assertProjectExperienceFinalSuccessV1({
        result,
        contract,
        completion_owner: owner,
        functional_execution_succeeded: functionalExecutionSucceeded,
      }),
    undefined,
    label,
  );
}

const prematureOkOwner = completedOwner();
const prematureOk = buildValidResult(prematureOkOwner);
prematureOk.ok = true;
assert.throws(
  () =>
    assertProjectExperienceFinalSuccessV1({
      result: prematureOk,
      contract,
      completion_owner: prematureOkOwner,
      functional_execution_succeeded: true,
    }),
  /result_ok_must_be_false_before_final_gate/u,
);

process.stdout.write(
  `${JSON.stringify({
    test: "project-experience-result-contract-v1",
    status: "pass",
    detailed_fields: contract.field_ids.length,
    semantic_markers: contract.marker_ids.length,
    exact_value_contracts: new Set(Object.values(contract.value_contract_by_field)).size,
    keyed_duplicate_foreign_and_missing_refusal: true,
    staged_cleanup_and_duration_gate: true,
  })}\n`,
);

function completedOwner() {
  const owner = createDetailedFieldCompletionOwnerV1(contract);
  for (const fieldId of contract.field_ids) owner.complete(fieldId);
  return owner;
}

function buildValidResult(owner) {
  const result = {
    ok: false,
    failure: null,
    detailed_field_count: contract.field_ids.length,
    detailed_marker_count: contract.marker_ids.length,
    semantic_markers: [...contract.marker_ids],
    completed_detailed_field_ids: owner.completedIds(),
    completed_detailed_field_fingerprint: owner.completedFingerprint(),
    unexpected_external_request_count: 0,
    unexpected_console_failure_count: 0,
    unexpected_page_failure_count: 0,
    unexpected_request_failure_count: 0,
    credential_private_material_boundary: true,
    default_database_isolated: true,
    validation_mode: "canonical_no_provider",
    provider_or_external_network_call: false,
    guide_brief_real_provider_acceptance: null,
    semantic_proposal_created: false,
    review_decision_created: false,
    transition_created: false,
    work_closure_created: false,
    native_host_execution_started: false,
    cleanup_complete: true,
    owned_streams_settled: true,
    owned_process_residue_count: 0,
    listener_residue_count: 0,
    temporary_root_removed: true,
    temporary_process_root_removed: true,
    temporary_profile_removed: true,
    temporary_database_removed: true,
    temporary_fixture_removed: true,
    temporary_picker_sequence_removed: true,
    runtime_shutdown_complete: true,
    chrome_cdp_shutdown_complete: true,
    total_duration_ms: 100_000,
    acceptance_bound_ms: 360_000,
  };
  for (const fieldId of contract.field_ids) {
    const runtimeContracts = contract.runtime_value_contracts;
    const valueContract = contract.value_contract_by_field[fieldId];
    switch (valueContract) {
      case "boolean_true":
        result[fieldId] = true;
        break;
      case "canonical_project_route":
        result[fieldId] = "/projects/project%3Atest-project";
        break;
      case "minimum_project_home_unknown_status":
        result[fieldId] =
          runtimeContracts.minimum_project_home_unknown_status.accepted_statuses[0];
        break;
      case "retired_route_status_matrix":
        result[fieldId] = Object.fromEntries(
          runtimeContracts.retired_route_status_matrix.route_ids.map((routeId) => [
            routeId,
            runtimeContracts.retired_route_status_matrix.accepted_statuses[0],
          ]),
        );
        break;
      case "product_shell_route_matrix":
      case "product_shell_responsive_matrix":
      case "viewport_surface_matrix":
        result[fieldId] = structuredClone(
          runtimeContracts[valueContract].entries,
        );
        break;
      case "empty_array":
        result[fieldId] = [];
        break;
      default:
        assert.fail(`unsupported_test_value_contract:${valueContract}`);
    }
  }
  return result;
}
