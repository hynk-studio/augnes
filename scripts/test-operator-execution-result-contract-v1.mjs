#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  assertOperatorRequestFailureEvidenceV1,
  assertOperatorExecutionDetailedValuesV1,
  assertOperatorExecutionFinalSuccessV1,
  createOperatorRequestFailureEvidenceV1,
  createOperatorDetailedFieldCompletionOwnerV1,
  createOperatorResultFieldDefaultsV1,
  createOperatorSemanticMarkerOwnerV1,
  loadOperatorExecutionOwnerContractV1,
} from "./operator-execution-result-contract-v1.mjs";

const requestFailureEvidence = createOperatorRequestFailureEvidenceV1({
  request_id: "321.45",
  method: "get",
  path: "/api/vnext/operator/inspector",
  initiating_phase: "result_review_and_inspector",
  observation_phase: "review_decision_and_transition",
  error_text:
    "request failed at /Users/example/private/project Authorization: Bearer private-token Cookie: session=private OPENAI_API_KEY=secret sk-privatevalue",
  response_status: 409,
  response_classification: "inspector_error",
  error_code: "inspector_source_conflict",
  navigation_epoch: 7,
  delivery_sequence: 3,
  delivery_cardinality: 2,
  request_type: "Fetch",
  private_roots: ["/Users/example/private/project"],
});
assert.doesNotThrow(() =>
  assertOperatorRequestFailureEvidenceV1(requestFailureEvidence),
);
assert.deepEqual(
  {
    request_id: requestFailureEvidence.request_id,
    method: requestFailureEvidence.method,
    path: requestFailureEvidence.path,
    initiating_phase: requestFailureEvidence.initiating_phase,
    observation_phase: requestFailureEvidence.observation_phase,
    response_status: requestFailureEvidence.response_status,
    response_classification: requestFailureEvidence.response_classification,
    error_code: requestFailureEvidence.error_code,
    navigation_epoch: requestFailureEvidence.navigation_epoch,
    delivery_sequence: requestFailureEvidence.delivery_sequence,
    delivery_cardinality: requestFailureEvidence.delivery_cardinality,
    duplicate_delivery_count: requestFailureEvidence.duplicate_delivery_count,
  },
  {
    request_id: "321.45",
    method: "GET",
    path: "/api/vnext/operator/inspector",
    initiating_phase: "result_review_and_inspector",
    observation_phase: "review_decision_and_transition",
    response_status: 409,
    response_classification: "inspector_error",
    error_code: "inspector_source_conflict",
    navigation_epoch: 7,
    delivery_sequence: 3,
    delivery_cardinality: 2,
    duplicate_delivery_count: 1,
  },
);
assert.equal(Object.hasOwn(requestFailureEvidence, "post_data"), false);
assert.equal(Object.hasOwn(requestFailureEvidence, "headers"), false);
assert.equal(Object.hasOwn(requestFailureEvidence, "cookies"), false);
const serializedRequestFailureEvidence = JSON.stringify(requestFailureEvidence);
for (const privateMaterial of [
  "/Users/example/private/project",
  "private-token",
  "session=private",
  "OPENAI_API_KEY",
  "sk-privatevalue",
]) {
  assert.equal(serializedRequestFailureEvidence.includes(privateMaterial), false);
}

const owner = loadOperatorExecutionOwnerContractV1();
for (const contract of owner.children) {
  const fieldOwner = createOperatorDetailedFieldCompletionOwnerV1(contract);
  const markerOwner = createOperatorSemanticMarkerOwnerV1(contract);
  for (const id of contract.field_ids) fieldOwner.complete(id);
  for (const id of contract.marker_ids) markerOwner.complete(id);
  const result = validResult(contract, fieldOwner, markerOwner);
  assert.doesNotThrow(() =>
    assertOperatorExecutionDetailedValuesV1({ result, contract }),
  );
  assert.doesNotThrow(() =>
    assertOperatorExecutionFinalSuccessV1({
      result,
      contract,
      field_owner: fieldOwner,
      marker_owner: markerOwner,
      functional_execution_succeeded: true,
    }),
  );
  for (const [label, mutate] of [
    ["cleanup incomplete", (candidate) => (candidate.cleanup_complete = false)],
    ["streams open", (candidate) => (candidate.owned_streams_settled = false)],
    ["process residue", (candidate) => (candidate.owned_process_residue_count = 1)],
    ["listener residue", (candidate) => (candidate.listener_residue_count = 1)],
    ["runtime not shut down", (candidate) => (candidate.runtime_shutdown_complete = false)],
    ["Chrome not shut down", (candidate) => (candidate.chrome_cdp_shutdown_complete = false)],
    ["external request", (candidate) => (candidate.unexpected_external_request_count = 1)],
    ["unowned effect", (candidate) => (candidate.unowned_effect_count = 1)],
    [
      "fixture timing missing",
      (candidate) => delete candidate.e2e_timing_summary.totals_ms.fixture_construction,
    ],
    ["duration bound", (candidate) => (candidate.total_duration_ms = 300_000)],
  ]) {
    const candidate = structuredClone(result);
    mutate(candidate);
    assert.throws(
      () =>
        assertOperatorExecutionFinalSuccessV1({
          result: candidate,
          contract,
          field_owner: fieldOwner,
          marker_owner: markerOwner,
          functional_execution_succeeded: true,
        }),
      undefined,
      `${contract.child_id}:${label}`,
    );
  }
  const duplicateFieldOwner = createOperatorDetailedFieldCompletionOwnerV1(contract);
  duplicateFieldOwner.complete(contract.field_ids[0]);
  assert.throws(
    () => duplicateFieldOwner.complete(contract.field_ids[0]),
    /duplicate_operator_detailed_field_completion/u,
  );
  assert.throws(
    () => duplicateFieldOwner.complete("foreign_operator_field"),
    /foreign_operator_detailed_field_completion/u,
  );
  assert.throws(
    () => duplicateFieldOwner.assertExact(),
    /operator_detailed_field_completion_mismatch/u,
  );
  const duplicateMarkerOwner = createOperatorSemanticMarkerOwnerV1(contract);
  duplicateMarkerOwner.complete(contract.marker_ids[0]);
  assert.throws(
    () => duplicateMarkerOwner.complete(contract.marker_ids[0]),
    /duplicate_operator_semantic_marker/u,
  );
  assert.throws(
    () => duplicateMarkerOwner.complete("foreign_operator_marker"),
    /foreign_operator_semantic_marker/u,
  );
}

process.stdout.write(
  `${JSON.stringify({
    test: "operator-execution-result-contract-v1",
    status: "pass",
    children: owner.children.length,
    detailed_fields: owner.field_ids.length,
    semantic_markers: owner.marker_ids.length,
    request_failure_evidence_contracts: 1,
    staged_finalization_negatives: owner.children.length * 10,
  })}\n`,
);

function validResult(contract, fieldOwner, markerOwner) {
  const result = {
    ok: false,
    failure: null,
    ...createOperatorResultFieldDefaultsV1(contract),
    completed_detailed_field_ids: fieldOwner.ids(),
    completed_detailed_field_fingerprint: fieldOwner.fingerprint(),
    semantic_marker_ids: markerOwner.ids(),
    semantic_marker_fingerprint: markerOwner.fingerprint(),
    detailed_field_set_fingerprint: contract.field_set_fingerprint,
    semantic_marker_set_fingerprint: contract.marker_set_fingerprint,
    effect_contract_version: "operator_execution_exact_effect_contract.v1",
    effect_diff_version: "operator_execution_exact_effect_diff.v1",
    before_effect_snapshot: {
      effect_snapshot_version: "operator_execution_exact_effect_snapshot.v1",
      snapshot_fingerprint: `sha256:${"1".repeat(64)}`,
      row_count: 1,
      category_counts: {},
      seam_count: 0,
    },
    after_effect_snapshot: {
      effect_snapshot_version: "operator_execution_exact_effect_snapshot.v1",
      snapshot_fingerprint: `sha256:${"2".repeat(64)}`,
      row_count: 2,
      category_counts: {},
      seam_count: 0,
    },
    permitted_effect_diff_fingerprint: `sha256:${"3".repeat(64)}`,
    observed_effect_diff_fingerprint: `sha256:${"3".repeat(64)}`,
    effect_operation_counts: {
      inserted: 1,
      updated: 0,
      deleted: 0,
      unchanged: 1,
      seam_inserted: 0,
      seam_updated: 0,
      seam_deleted: 0,
    },
    effect_operation_counts_by_category: {
      inserted: {},
      updated: {},
      deleted: {},
    },
    forbidden_effect_zero_evidence: {
      provider_calls: 0,
      external_network_calls: 0,
      github_calls: 0,
      deployment_calls: 0,
      publication_calls: 0,
      memory_perspective_mutations: 0,
    },
    effect_mismatch_material: null,
    unowned_effect_count: 0,
    unexpected_external_request_count: 0,
    unexpected_console_failure_count: 0,
    unexpected_page_failure_count: 0,
    unexpected_request_failure_count: 0,
    unexpected_refusal_accounting_failure_count: 0,
    credential_private_material_boundary: true,
    cleanup_complete: true,
    owned_streams_settled: true,
    owned_process_residue_count: 0,
    listener_residue_count: 0,
    temporary_root_removed: true,
    temporary_process_root_removed: true,
    temporary_profile_removed: true,
    temporary_database_removed: true,
    temporary_fixture_removed: true,
    temporary_signal_removed: true,
    temporary_transport_removed: true,
    runtime_shutdown_complete: true,
    chrome_cdp_shutdown_complete: true,
    total_duration_ms: 1_000,
    acceptance_bound_ms: 360_000,
    reference_headroom_ms: 479_000,
    e2e_timing_summary: {
      timing_version: "browser_e2e_timing.v0.1",
      scope: contract.child_id,
      total_elapsed_ms: 900,
      event_count: 10,
      totals_ms: Object.fromEntries(
        [
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
        ].map((kind) => [kind, 1]),
      ),
      events: [],
    },
  };
  for (const fieldId of contract.field_ids) {
    const valueContract = contract.runtime_value_contract_by_field[fieldId];
    if (valueContract.kind === "boolean_true") {
      result[fieldId] = true;
    } else if (valueContract.kind === "boolean_false") {
      result[fieldId] = false;
    } else if (valueContract.kind === "exact_integer") {
      result[fieldId] = valueContract.value;
    } else if (valueContract.kind === "exact_string") {
      result[fieldId] = valueContract.value;
    } else if (valueContract.kind === "nonempty_string") {
      result[fieldId] = "public-safe-value";
    } else if (valueContract.kind === "nonempty_array") {
      result[fieldId] = ["public-safe-value"];
    } else if (valueContract.kind === "bounded_object") {
      result[fieldId] = { status: "public-safe" };
    } else if (valueContract.kind === "exact_json") {
      result[fieldId] = structuredClone(valueContract.value);
    } else if (valueContract.kind === "approval_barrier_timing") {
      result[fieldId] = {
        timing_version: "browser_approval_barriers.v0.1",
        events: [
          "approval_emitted",
          "approval_emitted",
          "approval_decision_received",
          "approval_decision_received",
          "browser_release_observed",
          "browser_release_observed",
          "terminal_state_emitted",
        ].map((event, index) => ({
          event,
          elapsed_ms: index,
          approval_index: null,
          label: null,
          observation: null,
        })),
      };
    } else if (
      valueContract.kind === "guide_brief_transition_request_counts"
    ) {
      result[fieldId] = {
        before_impact: 2,
        after_impact: 2,
        after_confirmation: 2,
        after_application: 3,
        application_delta: 1,
      };
    } else if (
      valueContract.kind === "expected_refusal_accounting_summary"
    ) {
      result[fieldId] = {
        raw_console_events_preserved: true,
        tokens: [
          {
            token_id: "operator-review-control-stale-session",
            refusal_status: 403,
            refusal_request_id: "request-refused",
            refusal_response_count: 1,
            refusal_log_count: 1,
            authenticated_request_id: "request-authenticated",
            authenticated_recovery_response_count: 1,
          },
        ],
        duplicate_deliveries: [],
      };
    }
  }
  return result;
}
