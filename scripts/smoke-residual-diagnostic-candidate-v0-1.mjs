#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  assertChangedFilesWithin,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const root = process.cwd();
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");

assertPackageScript({
  packageJsonText: pkgText,
  scriptName: "smoke:residual-diagnostic-candidate-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-residual-diagnostic-candidate-v0-1.mjs",
});

const expectedFiles = [
  "types/residual-diagnostic-candidate.ts",
  "lib/workplane/residual-diagnostic-candidate.ts",
  "components/workplane/residual-diagnostic-candidate-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "scripts/smoke-residual-diagnostic-candidate-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-spine-consolidation-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  "scripts/smoke-handoff-send-slice-v0-1.mjs",
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "types/external-handoff-delivery-contract.ts",
  "lib/workplane/external-handoff-delivery-contract-preview.ts",
  "lib/workplane/external-handoff-delivery-operator-decision-preview.ts",
  "lib/workplane/external-handoff-delivery-contract-write.ts",
  "lib/workplane/external-handoff-delivery-contract-record-review.ts",
  "lib/workplane/read-external-handoff-delivery-contract-record-review-for-web.ts",
  "components/workplane/external-handoff-delivery-contract-panel.tsx",
  "scripts/smoke-external-handoff-delivery-contract-v0-1.mjs",
  "types/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-preview-contract.ts",
  "lib/workplane/provider-specific-external-delivery-operator-decision-preview.ts",
  "components/workplane/provider-specific-external-delivery-preview-contract-panel.tsx",
  "scripts/smoke-provider-specific-external-delivery-preview-contract-v0-1.mjs",
  "types/provider-specific-delivery-intent-contract.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-operator-decision-preview.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-write.ts",
  "lib/workplane/provider-specific-delivery-intent-contract-record-review.ts",
  "lib/workplane/read-provider-specific-delivery-intent-contract-record-review-for-web.ts",
  "components/workplane/provider-specific-delivery-intent-contract-panel.tsx",
  "scripts/smoke-provider-specific-delivery-intent-contract-v0-1.mjs",
  "types/delivery-spine-loop-closure.ts",
  "lib/workplane/delivery-spine-loop-closure.ts",
  "components/workplane/delivery-spine-loop-closure-panel.tsx",
  "scripts/smoke-delivery-spine-loop-closure-v0-1.mjs",
  "types/provider-specific-delivery-execution-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-execution-contract-preview.ts",
  "lib/workplane/provider-specific-delivery-execution-operator-decision-preview.ts",
  "components/workplane/provider-specific-delivery-execution-contract-preview-panel.tsx",
  "scripts/smoke-provider-specific-delivery-execution-contract-preview-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 5)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "residual_diagnostic_candidate_v0_1",
});

const textByFile = loadTextByFile(expectedFiles);
const typeText = textByFile.get("types/residual-diagnostic-candidate.ts");
const helperText = textByFile.get(
  "lib/workplane/residual-diagnostic-candidate.ts",
);
const panelText = textByFile.get(
  "components/workplane/residual-diagnostic-candidate-panel.tsx",
);
const agentText = textByFile.get("components/workplane/agent-workplane.tsx");
const repoText = [...textByFile.values()].join("\n");

for (const expected of [
  "residual_diagnostic_candidate_read_model.v0.1",
  "source_ref_lineage_mismatch",
  "route_integration_mode_mismatch",
  "local_fulfillment_upstream_gap",
  "external_delivery_boundary_pressure",
  "authority_boundary_drift",
  "workbench_ia_overload",
  "false_leap_contrast",
  "minimum_verification",
  "recommended_next_hardening_target",
  "read_only: true",
  "advisory_only: true",
  "candidate_layer_only: true",
  "can_write_db: false",
  "can_send_handoff: false",
  "can_call_send_provider: false",
  "can_call_email: false",
  "can_call_slack: false",
  "can_call_webhook: false",
  "can_write_clipboard: false",
  "can_download_file: false",
  "can_write_memory: false",
  "can_render_workbench_action_button: false",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

assert(
  agentText.includes("buildResidualDiagnosticCandidateReadModelV01"),
  "Agent Workplane must build residual diagnostic candidates",
);
assert(
  agentText.includes("<ResidualDiagnosticCandidatePanel"),
  "Agent Workplane must render the residual diagnostic panel",
);
assertNoForbiddenRuntime("helper", helperText);
assertNoForbiddenRuntime("panel", panelText);
assertNoActionButtons("panel", panelText);
assertNoActionButtons("agent wiring", agentResidualSnippet(agentText));
assert(
  !expectedFiles.some((file) => file.startsWith("app/api/")),
  "residual diagnostic candidate layer must not add routes",
);

const { buildWorkbenchSpineConsolidationV01 } = await import(
  "../lib/workplane/workbench-spine-consolidation.ts"
);
const { buildResidualDiagnosticCandidateReadModelV01 } = await import(
  "../lib/workplane/residual-diagnostic-candidate.ts"
);

const empty = buildResidualDiagnosticCandidateReadModelV01({});
assert.equal(empty.dashboard_status, "insufficient_data");
assert.equal(empty.candidate_summary.actionable_candidate_count, 0);
assert.equal(empty.residual_candidates.length, 0);
assert(
  empty.insufficient_data.includes("workbench_residual_source_material_missing"),
  "empty input must be honest insufficient_data",
);

const ordinaryMissingDashboard = buildWorkbenchSpineConsolidationV01({});
const ordinaryMissing = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: ordinaryMissingDashboard,
});
assert(
  ordinaryMissing.ordinary_missing_prerequisites.length > 0,
  "ordinary missing prerequisites should remain visible",
);
assert.equal(ordinaryMissing.candidate_summary.actionable_candidate_count, 0);
assert.equal(
  findCandidate(ordinaryMissing, "source_ref_lineage_mismatch"),
  undefined,
  "ordinary both-sides-missing lineage must not become a residual bottleneck",
);

const happyDashboard = buildWorkbenchSpineConsolidationV01(buildHappyInput());
const happyResidual = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: happyDashboard,
  current_working_perspective_route_integration_read: routeRead(),
});
const externalBoundaryCandidate = mustFindCandidate(
  happyResidual,
  "external_delivery_boundary_pressure",
);
assert.equal(happyDashboard.dashboard_status, "local_fulfillment_available");
assert.equal(happyDashboard.external_delivery.status, "not_configured");
assert.equal(happyDashboard.external_delivery.provider_called, false);
assert.equal(happyDashboard.external_delivery.external_message_sent, false);
assert.equal(
  happyDashboard.external_delivery.local_fulfillment_is_external_delivery,
  false,
);
assert.equal(externalBoundaryCandidate.status, "candidate");
assert(
  externalBoundaryCandidate.false_leap_contrast.includes(
    "Local send fulfillment is not provider delivery",
  ),
);

const mismatchedExportedArtifactInput = buildHappyInput();
mismatchedExportedArtifactInput.exported_handoff_packet_artifact_read = {
  ...mismatchedExportedArtifactInput.exported_handoff_packet_artifact_read,
  summary: {
    ...mismatchedExportedArtifactInput.exported_handoff_packet_artifact_read
      .summary,
    source_applied_handoff_context_snapshot_ref:
      "applied-handoff-context-snapshot:mismatch",
  },
};
const mismatchedLineage = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: buildWorkbenchSpineConsolidationV01(
    mismatchedExportedArtifactInput,
  ),
});
const lineageCandidate = mustFindCandidate(
  mismatchedLineage,
  "source_ref_lineage_mismatch",
);
assert.equal(lineageCandidate.status, "actionable_candidate");
assert(
  lineageCandidate.materialized_inconsistencies.some((item) =>
    item.startsWith("lineage_mismatch:"),
  ),
);
assert(lineageCandidate.false_leap_contrast.length > 0);
assert(lineageCandidate.minimum_verification.length >= 2);

const downstreamWithoutUpstream = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: buildWorkbenchSpineConsolidationV01({
    ...buildHappyInput(),
    applied_handoff_context_read: undefined,
  }),
});
const downstreamCandidate = mustFindCandidate(
  downstreamWithoutUpstream,
  "source_ref_lineage_mismatch",
);
assert(
  downstreamCandidate.materialized_inconsistencies.some((item) =>
    item.startsWith("lineage_downstream_without_upstream:"),
  ),
  "downstream material without upstream source must become materialized inconsistency",
);

const runtimeOnlyDashboard = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  current_working_perspective_route_integration_read: routeRead({
    status: "runtime_only",
    includeMetadataRefs: false,
  }),
});
const runtimeOnlyResidual = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: runtimeOnlyDashboard,
  current_working_perspective_route_integration_read: routeRead({
    status: "runtime_only",
    includeMetadataRefs: false,
  }),
});
const runtimeCandidate = mustFindCandidate(
  runtimeOnlyResidual,
  "route_integration_mode_mismatch",
);
assert.notEqual(runtimeOnlyDashboard.dashboard_status, "local_fulfillment_available");
assert.equal(
  stage(runtimeOnlyDashboard, "current_working_perspective_route_integration")
    .status,
  "insufficient_data",
);
assert(
  ["insufficient_data", "actionable_candidate"].includes(runtimeCandidate.status),
);
assert(
  runtimeCandidate.false_leap_contrast.includes(
    "Runtime fallback is diagnostic material",
  ),
);

const localFulfillmentGapDashboard = buildWorkbenchSpineConsolidationV01({
  ...buildHappyInput(),
  applied_current_working_perspective_read: undefined,
});
const localFulfillmentGap = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: localFulfillmentGapDashboard,
});
const localGapCandidate = mustFindCandidate(
  localFulfillmentGap,
  "local_fulfillment_upstream_gap",
);
assert.notEqual(
  localFulfillmentGapDashboard.dashboard_status,
  "local_fulfillment_available",
);
assert.equal(localGapCandidate.status, "actionable_candidate");

const forgedAuthorityDashboard = {
  ...happyDashboard,
  authority_boundary: {
    ...happyDashboard.authority_boundary,
    can_write_db: true,
    can_call_send_provider: true,
  },
};
const forgedAuthority = buildResidualDiagnosticCandidateReadModelV01({
  workbench_spine_consolidation: forgedAuthorityDashboard,
});
const authorityCandidate = mustFindCandidate(
  forgedAuthority,
  "authority_boundary_drift",
);
assert.equal(authorityCandidate.status, "actionable_candidate");
assert.equal(forgedAuthority.authority_boundary.read_only, true);
assert.equal(forgedAuthority.authority_boundary.can_write_db, false);
assert.equal(forgedAuthority.authority_boundary.can_call_send_provider, false);

const workEpisodeResidueAuthority = buildResidualDiagnosticCandidateReadModelV01({
  work_episode_residue_candidate_preview: {
    preview_version: "work_episode_residue_candidate_preview.v0.1",
    source_refs: ["source:work-episode-residue"],
    authority_boundary: readOnlyBoundary({ can_write_memory: true }),
  },
});
const workEpisodeAuthorityCandidate = mustFindCandidate(
  workEpisodeResidueAuthority,
  "authority_boundary_drift",
);
assert(
  workEpisodeAuthorityCandidate.materialized_inconsistencies.includes(
    "work_episode_residue_candidate_preview:authority_boundary_forbidden_true:can_write_memory",
  ),
);
assert.equal(workEpisodeResidueAuthority.authority_boundary.can_write_memory, false);
assert.equal(workEpisodeResidueAuthority.authority_boundary.can_write_db, false);

const nextWorkAuthority = buildResidualDiagnosticCandidateReadModelV01({
  next_work_signal_decision_record_review: {
    review_status: "records_available",
    source_refs: ["source:next-work-signal-authority"],
    authority_boundary: readOnlyBoundary({ can_write_db: true }),
  },
});
const nextWorkAuthorityCandidate = mustFindCandidate(
  nextWorkAuthority,
  "authority_boundary_drift",
);
assert(
  nextWorkAuthorityCandidate.materialized_inconsistencies.includes(
    "next_work_signal_decision_record_review:authority_boundary_forbidden_true:can_write_db",
  ),
);

const perspectiveRelayAuthority = buildResidualDiagnosticCandidateReadModelV01({
  perspective_relay_update_decision_record_review: {
    review_status: "records_available",
    source_refs: ["source:perspective-relay-authority"],
    authority_boundary: readOnlyBoundary({ can_send_handoff: true }),
  },
});
const perspectiveRelayAuthorityCandidate = mustFindCandidate(
  perspectiveRelayAuthority,
  "authority_boundary_drift",
);
assert(
  perspectiveRelayAuthorityCandidate.materialized_inconsistencies.includes(
    "perspective_relay_update_decision_record_review:authority_boundary_forbidden_true:can_send_handoff",
  ),
);

const decisionReviewSourceDrift = buildResidualDiagnosticCandidateReadModelV01({
  next_work_signal_decision_record_review: {
    review_status: "records_invalid",
    source_refs: ["source:next-work-signal-review"],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  },
  perspective_relay_update_decision_record_review: {
    review_status: "selected_record_missing",
    source_refs: ["source:perspective-relay-review"],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  },
});
const decisionReviewDriftCandidate = mustFindCandidate(
  decisionReviewSourceDrift,
  "review_writer_validation_drift",
);
assert(
  decisionReviewDriftCandidate.source_refs.includes(
    "source:next-work-signal-review",
  ),
);
assert(
  decisionReviewDriftCandidate.source_refs.includes(
    "source:perspective-relay-review",
  ),
);

const decisionReceiptProblems = buildResidualDiagnosticCandidateReadModelV01({
  next_work_signal_decision_record_review: {
    review_status: "records_available",
    source_refs: ["source:next-work-signal-receipt"],
    evidence_summary: { has_receipt_side_effect_problem: true },
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  },
  perspective_relay_update_decision_record_review: {
    review_status: "records_available",
    source_refs: ["source:perspective-relay-receipt"],
    input_summary: { receipt_side_effect_problem_count: 1 },
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  },
});
const decisionReceiptCandidate = mustFindCandidate(
  decisionReceiptProblems,
  "no_side_effects_replay_inconsistency",
);
assert(
  decisionReceiptCandidate.observed_signals.some(
    (signal) => signal.summary === "next_work_signal:receipt_side_effect_problem",
  ),
);
assert(
  decisionReceiptCandidate.observed_signals.some((signal) =>
    signal.summary.startsWith(
      "perspective_relay_update:receipt_side_effect_problem_count:",
    ),
  ),
);
assert(
  decisionReceiptCandidate.source_refs.includes(
    "source:next-work-signal-receipt",
  ),
);
assert(
  decisionReceiptCandidate.source_refs.includes(
    "source:perspective-relay-receipt",
  ),
);

const reviewDrift = buildResidualDiagnosticCandidateReadModelV01({
  expected_observed_delta_record_review: {
    review_status: "records_invalid",
    source_refs: ["source:expected-observed"],
    record_material_summary: {
      missing_expectation_count: 1,
      unexpected_observation_count: 1,
    },
    evidence_summary: {
      has_receipt_side_effect_problem: true,
    },
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  },
  reuse_outcome_bridge_ledger_record_review: {
    review_status: "records_available",
    source_refs: ["source:reuse-outcome"],
    aggregate_counts: {
      misleading_ref_count: 1,
      missing_ref_count: 1,
    },
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  },
});
assert(mustFindCandidate(reviewDrift, "expected_observed_mismatch"));
assert(mustFindCandidate(reviewDrift, "review_writer_validation_drift"));
assert(mustFindCandidate(reviewDrift, "no_side_effects_replay_inconsistency"));
assert(mustFindCandidate(reviewDrift, "reuse_outcome_gap"));

const boundary = happyResidual.authority_boundary;
for (const [key, value] of Object.entries(boundary)) {
  if (["read_only", "advisory_only", "candidate_layer_only", "derived_read_model"].includes(key)) {
    assert.equal(value, true, `${key} true`);
  } else if (key !== "notes") {
    assert.equal(value, false, `${key} false`);
  }
}

console.log("smoke-residual-diagnostic-candidate-v0-1: ok");

function buildHappyInput() {
  return {
    applied_current_working_perspective_read: appliedCwpRead(true),
    current_working_perspective_route_integration_read: routeRead(),
    current_working_perspective_apply_record_review: applyRecordReview(),
    handoff_context_apply_record_review: handoffContextApplyReview(),
    applied_handoff_context_read: appliedHandoffRead(true),
    handoff_packet_copy_export_record_review: packetCopyExportReview(),
    exported_handoff_packet_artifact_read: exportedArtifactRead(true),
    handoff_send_contract_record_review: sendContractReview(),
    handoff_send_record_review: sendRecordReview(),
    sent_handoff_read: sentHandoffRead(true),
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    source_refs: ["workbench:residual-diagnostic-smoke"],
  };
}

function appliedCwpRead(available) {
  return {
    read_version: "applied_current_working_perspective_read.v0.1",
    status: available
      ? "latest_applied_snapshot_available"
      : "no_applied_snapshot",
    scope: "project:augnes",
    latest_applied_snapshot: available ? {} : null,
    latest_record: available ? {} : null,
    summary: {
      applied_snapshot_ref: available ? "applied-cwp-snapshot:001" : null,
      source_contract_record_ref: "cwp-update-contract:001",
      source_current_working_perspective_ref: "runtime-cwp:001",
      as_of: "2026-07-06T00:00:00.000Z",
      current_frame_summary: "Current frame",
      current_thesis_summary: "Current thesis",
      active_goal_count: 1,
      open_question_count: 0,
      active_risk_count: 0,
      next_candidate_count: 1,
      staleness_status: "fresh",
      applied_patch_count: 3,
    },
    authority_boundary: readOnlyBoundary({
      can_mutate_current_working_perspective: false,
      can_replace_current_working_perspective_route_response: false,
    }),
  };
}

function routeRead({
  status = "runtime_with_applied_snapshot_overlay_candidate",
  includeMetadataRefs = true,
} = {}) {
  return {
    read_version: "current_working_perspective_route_integration_read.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-06T00:00:00.000Z",
    status,
    route_path: "/api/perspective/current",
    route_family: "current_working_perspective",
    response_mode:
      status === "runtime_only"
        ? "runtime_only"
        : "runtime_primary_with_applied_overlay_candidate",
    route_integration_metadata: {
      contract_record_id: includeMetadataRefs
        ? "route-integration-contract:001"
        : null,
      applied_snapshot_ref: includeMetadataRefs
        ? "applied-cwp-snapshot:001"
        : null,
    },
    applied_snapshot_metadata: {
      applied_snapshot_ref: includeMetadataRefs
        ? "applied-cwp-snapshot:001"
        : null,
    },
    blocked_reasons: [],
    warnings: [],
    source_refs: ["source:route"],
    evidence_refs: ["evidence:route"],
    authority_boundary: readOnlyBoundary({
      route_integration_read_only: true,
    }),
  };
}

function applyRecordReview() {
  return {
    review_version: "current_working_perspective_apply_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function appliedHandoffRead(available) {
  return {
    read_version: "applied_handoff_context_read.v0.1",
    status: available
      ? "latest_applied_handoff_context_snapshot_available"
      : "no_applied_handoff_context_snapshot",
    scope: "project:augnes",
    latest_applied_snapshot: available ? {} : null,
    latest_record: available ? {} : null,
    summary: {
      applied_handoff_context_snapshot_ref: available
        ? "applied-handoff-context-snapshot:001"
        : null,
      source_contract_record_ref: "handoff-context-contract:001",
      source_route_integration_read_ref: "route-integration-contract:001",
      as_of: "2026-07-06T00:00:00.000Z",
      section_counts: { summary: 1 },
      entry_count: 2,
      previous_context_used: false,
      copy_export_still_pending: true,
      send_still_pending: true,
    },
    authority_boundary: readOnlyBoundary({
      can_apply_handoff_context_update_live: false,
      can_send_handoff: false,
      can_copy_export_handoff_packet: false,
      can_mutate_memory: false,
    }),
  };
}

function handoffContextApplyReview() {
  return {
    review_version: "handoff_context_apply_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function packetCopyExportReview() {
  return {
    review_version: "handoff_packet_copy_export_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function exportedArtifactRead(available) {
  return {
    read_version: "exported_handoff_packet_artifact_read.v0.1",
    status: available
      ? "latest_exported_handoff_packet_artifact_available"
      : "no_exported_handoff_packet_artifact",
    scope: "project:augnes",
    latest_exported_artifact: available ? {} : null,
    latest_record: available ? {} : null,
    summary: {
      exported_artifact_ref: available ? "exported-artifact:001" : null,
      source_copy_export_contract_record_ref: "packet-copy-export-contract:001",
      source_applied_handoff_context_snapshot_ref:
        "applied-handoff-context-snapshot:001",
      packet_format: "operator_handoff_packet_markdown",
      copy_export_target: "operator_copy_surface_candidate",
      as_of: "2026-07-06T00:00:00.000Z",
      packet_entry_count: 3,
      packet_section_counts: { summary: 1 },
      has_markdown_payload: true,
      has_json_payload: false,
      has_capsule_payload: false,
      clipboard_write_still_pending: false,
      download_or_file_write_still_pending: false,
      send_still_pending: true,
    },
    authority_boundary: readOnlyBoundary({
      can_write_clipboard: false,
      can_download_file: false,
      can_write_arbitrary_file: false,
      can_send_handoff: false,
      can_mutate_memory: false,
    }),
  };
}

function sendContractReview() {
  return {
    review_version: "handoff_send_contract_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    source_refs: ["source:send-contract"],
    latest_record_summary: {
      record_id: "handoff-send-contract-record:001",
      source_exported_artifact_ref: "exported-artifact:001",
      payload_hash: "payload-hash:001",
    },
    selected_record_summary: null,
    input_summary: { valid_record_count: 1 },
    evidence_summary: { evidence_refs: ["evidence:send-contract"] },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ read_only_record_review: true }),
  };
}

function sendRecordReview() {
  return {
    review_version: "handoff_send_record_review.v0.1",
    scope: "project:augnes",
    review_status: "records_available",
    source_refs: ["source:send-record"],
    latest_record_summary: {
      record_id: "handoff-send-record:001",
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:001",
      payload_hash: "payload-hash:001",
    },
    selected_record_summary: null,
    input_summary: { valid_record_count: 1 },
    evidence_summary: { payload_hashes: ["payload-hash:001"] },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    authority_boundary: readOnlyBoundary({ review_only: true }),
  };
}

function sentHandoffRead(available) {
  return {
    read_version: "sent_handoff_read.v0.1",
    status: available
      ? "latest_handoff_send_fulfillment_available"
      : "no_handoff_send_fulfillment",
    scope: "project:augnes",
    latest_record: available ? {} : null,
    latest_fulfillment_summary: {
      record_id: available ? "handoff-send-record:001" : null,
      fulfillment_status: available
        ? "locally_fulfilled_manual_operator_send"
        : null,
      source_handoff_send_contract_record_ref:
        "handoff-send-contract-record:001",
      source_exported_artifact_ref: "exported-artifact:001",
      requested_send_execution_mode: "manual_operator_send_fulfillment",
      requested_send_surface: "operator_manual_send_candidate",
      requested_delivery_mode: "manual_operator_delivery",
      requested_recipient_ref: "recipient:operator",
      payload_hash: "payload-hash:001",
      payload_type: "markdown_payload",
      external_delivery_performed: false,
      provider_called: false,
    },
    authority_boundary: readOnlyBoundary({
      can_send_handoff: false,
      can_call_send_provider: false,
      can_call_external_messaging: false,
      can_call_email: false,
      can_call_slack: false,
      can_call_webhook: false,
    }),
  };
}

function readOnlyBoundary(extra = {}) {
  return {
    read_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_call_browser_or_crawler: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_write_dogfood_metrics: false,
    can_update_global_dogfood_metrics: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_create_graph_or_vector_store: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    ...extra,
  };
}

function stage(dashboard, stageId) {
  return dashboard.stage_summaries.find((item) => item.stage_id === stageId);
}

function findCandidate(readModel, category) {
  return readModel.residual_candidates.find(
    (candidate) => candidate.category === category,
  );
}

function mustFindCandidate(readModel, category) {
  const candidate = findCandidate(readModel, category);
  assert(candidate, `missing residual candidate ${category}`);
  return candidate;
}

function assertNoForbiddenRuntime(label, text) {
  for (const forbidden of [
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "better-sqlite3",
    "new Database",
    "@/lib/db",
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "@openai",
    "OpenAI",
    "Octokit",
    "@octokit",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
    "send_provider_called: true",
    "external_message_sent: true",
    "provider_called: true",
    "can_write_db: true",
    "can_send_handoff: true",
    "can_call_send_provider: true",
    "can_write_memory: true",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoActionButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(!text.includes("onClick"), `${label} must not include onClick handlers`);
  for (const action of [
    "approve",
    "write",
    "apply",
    "send",
    "copy",
    "export",
    "download",
    "clipboard",
    "email",
    "slack",
    "webhook",
    "provider",
    "network",
  ]) {
    assert(
      !new RegExp(`on[A-Z][A-Za-z]+\\s*=\\s*\\{[^}]*${action}`, "i").test(text),
      `${label} must not bind ${action} handlers`,
    );
  }
}

function agentResidualSnippet(text) {
  const start = text.indexOf("buildResidualDiagnosticCandidateReadModelV01");
  const end = text.indexOf("<ResidualDiagnosticCandidatePanel");
  assert(start >= 0, "missing residual builder snippet");
  assert(end >= 0, "missing residual panel snippet");
  return text.slice(start, end + 240);
}
