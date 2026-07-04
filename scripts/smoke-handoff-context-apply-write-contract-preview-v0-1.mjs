#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/handoff-context-apply-write-contract-preview.ts";
const helperFile =
  "lib/handoff/handoff-context-apply-write-contract-preview.ts";
const panelFile =
  "components/handoff/handoff-context-apply-write-contract-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs";
const applyDecisionTypeFile =
  "types/handoff-context-apply-operator-decision-preview.ts";
const applyDecisionHelperFile =
  "lib/handoff/handoff-context-apply-operator-decision-preview.ts";
const applyDecisionPanelFile =
  "components/handoff/handoff-context-apply-operator-decision-preview-panel.tsx";
const applyDecisionSmokeFile =
  "scripts/smoke-handoff-context-apply-operator-decision-preview-v0-1.mjs";
const applyPreviewSmokeFile =
  "scripts/smoke-handoff-context-apply-preview-v0-1.mjs";
const recordReviewDbReadSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const recordReviewSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const writeSmokeFile =
  "scripts/smoke-handoff-context-update-write-v0-1.mjs";
const updateDecisionSmokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const updatePreviewSmokeFile =
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const metricAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const agentWorkplaneSmokeFile =
  "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const selectedSessionDigestIntakeTypeFile =
  "types/selected-session-digest-intake-preview.ts";
const selectedSessionDigestIntakeHelperFile =
  "lib/intake/selected-session-digest-intake-preview.ts";
const selectedSessionDigestIntakePanelFile =
  "components/intake/selected-session-digest-intake-preview-panel.tsx";
const selectedSessionDigestIntakeSmokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  applyDecisionSmokeFile,
  applyPreviewSmokeFile,
  recordReviewDbReadSmokeFile,
  recordReviewSmokeFile,
  writeSmokeFile,
  updateDecisionSmokeFile,
  updatePreviewSmokeFile,
  metricAdjustmentSmokeFile,
  handoffRationaleSmokeFile,
  agentWorkplaneSmokeFile,
  selectedSessionDigestIntakeTypeFile,
  selectedSessionDigestIntakeHelperFile,
  selectedSessionDigestIntakePanelFile,
  selectedSessionDigestIntakeSmokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  applyDecisionTypeFile,
  applyDecisionHelperFile,
  applyDecisionPanelFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-apply-write-contract-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_context_apply_write_contract_preview.v0.1",
    "ready_for_future_write_scope",
    "prepare_separate_apply_write_slice",
    "future_write_contract",
    "would_write_material_preview",
    "carry_forward_review_only_material",
    "can_persist_decision: false",
    "can_write_db: false",
    "can_create_schema: false",
    "can_create_apply_write_contract_record: false",
    "can_create_apply_write_receipt: false",
    "can_mutate_live_handoff_context: false",
    "can_write_selected_refs_to_live_handoff: false",
    "can_send_handoff: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildHandoffContextApplyWriteContractPreviewV01",
    "createHandoffContextApplyWriteContractAuthorityBoundaryV01",
    "apply_operator_decision_preview_missing",
    "apply_operator_decision_preview_wrong_version",
    "apply_operator_decision_preview_malformed",
    "current_handoff_packet_fingerprint_missing",
    "current_handoff_context_ref_missing",
    "requested_operator_ref_missing",
    "requested_idempotency_key_missing",
    "current_handoff_packet_fingerprint_unsafe",
    "requested_idempotency_key_unsafe",
    "handoff_context_apply_write_contract.v0.1",
    "handoff_context_apply_write_contract_receipt.v0.1",
    "does_not_write_db_rows",
    "does_not_create_schema",
    "does_not_mutate_live_handoff_context",
    "does_not_write_selected_refs_to_active_handoff_packet",
    "does_not_send_handoffs",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Handoff Context Apply Write Contract Preview",
    "Future write scope",
    "would-write material",
    "carry forward",
    "future contract",
    "would not write",
    "can_create_apply_write_contract_record",
    "can_write_selected_refs_to_live_handoff",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "HandoffContextApplyWriteContractPreviewPanel",
    "buildHandoffContextApplyWriteContractPreviewV01",
    "workbench:handoff_context_apply_write_contract_preview",
    "HandoffContextApplyOperatorDecisionPreviewPanel",
  ],
  { label: agentWorkplaneFile },
);

for (const [label, text] of [
  [helperFile, helperText],
  [panelFile, panelText],
]) {
  assertNoForbiddenContractRuntimeCall(label, text);
}
assertNoForbiddenWorkbenchRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assert(!panelText.includes("<button"), "contract preview panel must not add buttons");
assert(
  !/<button[^>]*>[^<]*(Write|Apply|Approve|Send)/i.test(agentWorkplaneText),
  "Workbench must not render write/apply/approve/send buttons",
);

const contractModule = await import(
  "../lib/handoff/handoff-context-apply-write-contract-preview.ts"
);
const {
  buildHandoffContextApplyWriteContractPreviewV01,
  createHandoffContextApplyWriteContractAuthorityBoundaryV01,
} = contractModule;

const missingDecision =
  buildHandoffContextApplyWriteContractPreviewV01({
    as_of: "2026-07-04T12:30:00.000Z",
    scope: "project:augnes",
  });
assert.equal(missingDecision.contract_preview_status, "insufficient_data");
assert.equal(missingDecision.readiness.ready_for_future_write_scope, false);
assert.equal(missingDecision.recommended_next_action, "supply_apply_decision_preview");
assert(
  missingDecision.insufficient_data_reasons.includes(
    "apply_operator_decision_preview_missing",
  ),
);
assertAuthorityFalse(missingDecision.authority_boundary);

let wrongVersionDecision;
assert.doesNotThrow(() => {
  wrongVersionDecision = contractFor({
    apply_operator_decision_preview: {
      preview_version: "handoff_context_apply_operator_decision_preview.v9.9",
    },
  });
});
assert.equal(wrongVersionDecision.readiness.ready_for_future_write_scope, false);
assert(
  ["insufficient_data", "blocked"].includes(
    wrongVersionDecision.contract_preview_status,
  ),
);

let malformedDecision;
assert.doesNotThrow(() => {
  malformedDecision = contractFor({
    apply_operator_decision_preview: {
      preview_version: "handoff_context_apply_operator_decision_preview.v0.1",
    },
  });
});
assert.equal(malformedDecision.readiness.ready_for_future_write_scope, false);
assert(
  malformedDecision.insufficient_data_reasons.includes(
    "apply_operator_decision_preview_malformed",
  ) ||
    malformedDecision.blocked_reasons.includes(
      "blocked_malformed_apply_operator_decision_preview",
    ),
);

const insufficientSource = contractFor({
  apply_operator_decision_preview: decisionPreview({
    decision_preview_status: "insufficient_data",
    recommended_operator_decision: "defer_until_record_material_supplied",
    ready_for_future_apply_write: false,
    insufficient_data_reasons: ["selected_full_record_material_missing"],
  }),
});
assert.equal(insufficientSource.readiness.ready_for_future_write_scope, false);

const blockedSource = contractFor({
  apply_operator_decision_preview: decisionPreview({
    decision_preview_status: "blocked",
    recommended_operator_decision: "defer_until_blockers_resolved",
    ready_for_future_apply_write: false,
    blocking_reasons: ["blocked_duplicate_selected_ref_adds"],
  }),
});
assert.equal(blockedSource.contract_preview_status, "blocked");
assert.equal(blockedSource.recommended_next_action, "resolve_apply_decision_blockers");

const reviewReadySource = contractFor({
  apply_operator_decision_preview: decisionPreview({
    decision_preview_status: "ready_for_operator_review",
    recommended_operator_decision: "review_for_future_apply_write",
    ready_for_future_apply_write: false,
    keep_unknown: [candidate("unknown", "keep_unknown")],
  }),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.equal(reviewReadySource.readiness.ready_for_future_write_scope, false);

const readinessBlockerSource = contractFor({
  apply_operator_decision_preview: decisionPreview({
    decision_preview_status: "ready_for_future_apply_write",
    recommended_operator_decision: "approve_for_future_apply_write",
    ready_for_future_apply_write: true,
    blocking_reasons: [],
    missing_evidence: [],
    current_blockers: ["blocked-in-readiness"],
  }),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.equal(
  readinessBlockerSource.readiness.ready_for_future_write_scope,
  false,
);
assert(
  ["blocked", "insufficient_data"].includes(
    readinessBlockerSource.contract_preview_status,
  ),
);
assert(
  readinessBlockerSource.blocked_reasons.includes(
    "source_decision_current_blockers_present",
  ) ||
    readinessBlockerSource.readiness.current_blockers.includes(
      "blocked-in-readiness",
    ),
);

const readinessMissingEvidenceSource = contractFor({
  apply_operator_decision_preview: decisionPreview({
    decision_preview_status: "ready_for_future_apply_write",
    recommended_operator_decision: "approve_for_future_apply_write",
    ready_for_future_apply_write: true,
    blocking_reasons: [],
    missing_evidence: [],
    current_missing_evidence: ["missing-in-readiness"],
  }),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.equal(
  readinessMissingEvidenceSource.readiness.ready_for_future_write_scope,
  false,
);
assert(
  readinessMissingEvidenceSource.missing_evidence.includes(
    "missing-in-readiness",
  ) ||
    readinessMissingEvidenceSource.insufficient_data_reasons.includes(
      "source_decision_current_missing_evidence_present",
    ),
);

const missingFingerprint = contractFor({
  apply_operator_decision_preview: readyDecisionPreview(),
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.equal(missingFingerprint.readiness.ready_for_future_write_scope, false);
assert.equal(
  missingFingerprint.recommended_next_action,
  "supply_current_handoff_packet_fingerprint",
);
assert(
  missingFingerprint.insufficient_data_reasons.includes(
    "current_handoff_packet_fingerprint_missing",
  ),
);

for (const [label, overrides, reason] of [
  [
    "missing context ref",
    {
      current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
      requested_operator_ref: "operator:durable-contract",
      requested_idempotency_key: "idempotency:durable-contract",
    },
    "current_handoff_context_ref_missing",
  ],
  [
    "missing operator ref",
    {
      current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
      current_handoff_context_ref: "handoff-context:durable-contract",
      requested_idempotency_key: "idempotency:durable-contract",
    },
    "requested_operator_ref_missing",
  ],
  [
    "missing idempotency",
    {
      current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
      current_handoff_context_ref: "handoff-context:durable-contract",
      requested_operator_ref: "operator:durable-contract",
    },
    "requested_idempotency_key_missing",
  ],
]) {
  const preview = contractFor({
    apply_operator_decision_preview: readyDecisionPreview(),
    ...overrides,
  });
  assert.equal(preview.readiness.ready_for_future_write_scope, false, label);
  assert(preview.insufficient_data_reasons.includes(reason), label);
}

for (const [label, overrides, reason] of [
  [
    "unsafe fingerprint",
    {
      current_handoff_packet_fingerprint: "/Users/hynk/private",
      current_handoff_context_ref: "handoff-context:durable-contract",
      requested_operator_ref: "operator:durable-contract",
      requested_idempotency_key: "idempotency:durable-contract",
    },
    "current_handoff_packet_fingerprint_unsafe",
  ],
  [
    "unsafe context ref",
    {
      current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
      current_handoff_context_ref: "../private-context",
      requested_operator_ref: "operator:durable-contract",
      requested_idempotency_key: "idempotency:durable-contract",
    },
    "current_handoff_context_ref_unsafe",
  ],
  [
    "unsafe operator ref",
    {
      current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
      current_handoff_context_ref: "handoff-context:durable-contract",
      requested_operator_ref: "ghp_private",
      requested_idempotency_key: "idempotency:durable-contract",
    },
    "requested_operator_ref_unsafe",
  ],
  [
    "unsafe idempotency",
    {
      current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
      current_handoff_context_ref: "handoff-context:durable-contract",
      requested_operator_ref: "operator:durable-contract",
      requested_idempotency_key: "sk-private",
    },
    "requested_idempotency_key_unsafe",
  ],
]) {
  const preview = contractFor({
    apply_operator_decision_preview: readyDecisionPreview(),
    ...overrides,
  });
  assert.equal(preview.readiness.ready_for_future_write_scope, false, label);
  assert(preview.refusal_reasons.includes(reason), label);
  assert.equal(preview.recommended_next_action, "reject_apply_write_candidate");
}

const readyContract = contractFor({
  apply_operator_decision_preview: readyDecisionPreview(),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.equal(
  readyContract.contract_preview_status,
  "ready_for_future_write_scope",
);
assert.equal(readyContract.recommended_next_action, "prepare_separate_apply_write_slice");
assert.equal(readyContract.readiness.ready_for_future_write_scope, true);
assert.equal(readyContract.would_write_material_preview.selected_refs_to_add.length, 1);
assert.equal(
  readyContract.would_write_material_preview.selected_refs_to_reinforce.length,
  1,
);
assert.equal(
  readyContract.would_write_material_preview.warnings_to_add_or_strengthen.length,
  1,
);
assert.equal(
  readyContract.would_write_material_preview.context_refs_to_deprioritize.length,
  1,
);
assert.equal(readyContract.would_write_material_preview.context_refs_to_exclude.length, 1);
assert.equal(
  readyContract.would_write_material_preview.expected_return_signal_updates.length,
  1,
);
assert.equal(readyContract.evidence_summary.has_source_refs, true);
assert.equal(readyContract.evidence_summary.has_evidence_refs, true);
const readyApplyDecisionPreviewRef =
  readyContract.would_write_material_preview.apply_decision_preview_ref;
assert.notEqual(
  readyApplyDecisionPreviewRef,
  "handoff_context_apply_operator_decision_preview.v0.1",
);
assert(
  readyApplyDecisionPreviewRef.includes(
    "handoff_context_apply_operator_decision_preview.v0.1",
  ),
);
assert(readyApplyDecisionPreviewRef.includes("2026-07-04T12:31:00.000Z"));
assert(
  readyApplyDecisionPreviewRef.includes("hcu-record:durable-apply-contract"),
);
assert(
  readyContract.future_write_contract.required_apply_decision_preview_ref.includes(
    readyApplyDecisionPreviewRef,
  ),
);
const alternateAsOfContract = contractFor({
  apply_operator_decision_preview: readyDecisionPreview({
    as_of: "2026-07-04T12:32:00.000Z",
  }),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
const alternateSelectedRecordContract = contractFor({
  apply_operator_decision_preview: readyDecisionPreview({
    selected_record_ref: "hcu-record:durable-apply-contract-alt",
  }),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.notEqual(
  readyApplyDecisionPreviewRef,
  alternateAsOfContract.would_write_material_preview.apply_decision_preview_ref,
);
assert.notEqual(
  readyApplyDecisionPreviewRef,
  alternateSelectedRecordContract.would_write_material_preview
    .apply_decision_preview_ref,
);
assertAuthorityFalse(readyContract.authority_boundary);

const reviewOnlyCarryForward = contractFor({
  apply_operator_decision_preview: decisionPreview({
    decision_preview_status: "ready_for_operator_review",
    recommended_operator_decision: "review_for_future_apply_write",
    ready_for_future_apply_write: false,
    keep_unknown: [candidate("unknown", "keep_unknown")],
    stop_if_missing: [candidate("stop", "stop_if_missing_carry_forward")],
    rejected: [candidate("rejected", "rejected_or_excluded_review_note")],
    carry_forward_overrides: {
      duplicate_selected_refs: ["context-ref:durable-duplicate"],
      unknown_selected_ref_attempts: ["candidate:durable-unknown"],
      stale_or_noisy_candidates: ["candidate:durable-noisy"],
      missing_evidence_candidates: ["candidate:durable-missing-evidence"],
      unresolved_blockers: ["blocked:durable-carry-forward"],
    },
  }),
  current_handoff_packet_fingerprint: "packet-fingerprint:durable-contract",
  current_handoff_context_ref: "handoff-context:durable-contract",
  requested_operator_ref: "operator:durable-contract",
  requested_idempotency_key: "idempotency:durable-contract",
});
assert.equal(
  reviewOnlyCarryForward.would_write_material_preview.selected_refs_to_add.some(
    (item) => item.candidate_kind === "keep_unknown",
  ),
  false,
);
assert.equal(
  reviewOnlyCarryForward.would_write_material_preview.selected_refs_to_add.some(
    (item) => item.candidate_kind === "stop_if_missing_carry_forward",
  ),
  false,
);
assert.equal(
  reviewOnlyCarryForward.would_write_material_preview.selected_refs_to_add.some(
    (item) => item.candidate_kind === "rejected_or_excluded_review_note",
  ),
  false,
);
assert.equal(
  reviewOnlyCarryForward.carry_forward_review_only_material
    .keep_unknown_as_review_only.length,
  1,
);
assert.equal(
  reviewOnlyCarryForward.carry_forward_review_only_material
    .carry_forward_stop_if_missing.length,
  1,
);
assert.equal(
  reviewOnlyCarryForward.carry_forward_review_only_material
    .rejected_or_excluded_review_notes.length,
  1,
);
assert.equal(
  reviewOnlyCarryForward.carry_forward_review_only_material
    .duplicate_selected_refs.length,
  1,
);

for (const expectedBoundary of [
  "does_not_write_db_rows",
  "does_not_create_schema",
  "does_not_mutate_live_handoff_context",
  "does_not_write_selected_refs_to_active_handoff_packet",
  "does_not_send_handoffs",
  "does_not_call_provider_openai",
  "does_not_call_github",
  "does_not_execute_codex",
]) {
  assert(
    readyContract.would_not_write.includes(expectedBoundary),
    `would_not_write must include ${expectedBoundary}`,
  );
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-apply-write-contract-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context apply write contract preview file: ${file}`,
  );
}
const appRouteFiles = changedAndUntrackedFiles.filter((file) =>
  /^app\/api\/.*\/route\.ts$/.test(file),
);
assert.deepEqual(
  appRouteFiles,
  [],
  "handoff context apply write contract preview must not add or modify app route files",
);

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-apply-write-contract-preview-v0-1",
      pass: true,
      missing_decision_preview_checked: true,
      wrong_version_checked: true,
      malformed_correct_version_checked: true,
      source_not_ready_checked: true,
      missing_guard_material_checked: true,
      unsafe_public_refs_checked: true,
      ready_future_write_scope_checked: true,
      review_only_carry_forward_checked: true,
      workbench_panel_marker_checked: true,
      no_route_changed: true,
      authority_boundary_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-context-apply-write-contract-preview-v0-1");

function contractFor(input) {
  return buildHandoffContextApplyWriteContractPreviewV01({
    scope: "project:augnes",
    as_of: "2026-07-04T12:31:00.000Z",
    source_refs: ["contract-preview-source:durable-apply-write-contract"],
    ...input,
  });
}

function readyDecisionPreview(overrides = {}) {
  return decisionPreview({
    decision_preview_status: "ready_for_future_apply_write",
    recommended_operator_decision: "approve_for_future_apply_write",
    ready_for_future_apply_write: true,
    ...overrides,
  });
}

function decisionPreview({
  decision_preview_status,
  recommended_operator_decision,
  ready_for_future_apply_write,
  live_candidates = [
    candidate("add"),
    candidate("reinforce", "selected_ref_reinforce"),
    candidate("warning", "warning_add"),
    candidate("deprioritize", "context_deprioritize"),
    candidate("exclude", "context_exclude"),
    candidate("expected", "expected_return_update"),
  ],
  keep_unknown = [],
  stop_if_missing = [],
  rejected = [],
  blocking_reasons = [],
  insufficient_data_reasons = [],
  missing_evidence = [],
  current_blockers,
  current_missing_evidence,
  as_of = "2026-07-04T12:31:00.000Z",
  selected_record_ref = "hcu-record:durable-apply-contract",
  carry_forward_overrides = {},
  authority_overrides = {},
}) {
  const readinessCurrentBlockers = current_blockers ?? blocking_reasons;
  const readinessCurrentMissingEvidence =
    current_missing_evidence ?? missing_evidence;
  const wouldApplyPreview = {
    proposed_record_kind:
      live_candidates.length > 0
        ? "handoff_context_apply_write_candidate.v0.1"
        : null,
    selected_refs_to_add: live_candidates.filter(
      (item) => item.candidate_kind === "selected_ref_add",
    ),
    selected_refs_to_reinforce: live_candidates.filter(
      (item) => item.candidate_kind === "selected_ref_reinforce",
    ),
    warnings_to_add_or_strengthen: live_candidates.filter((item) =>
      ["warning_add", "warning_strengthen"].includes(item.candidate_kind),
    ),
    context_refs_to_deprioritize: live_candidates.filter(
      (item) => item.candidate_kind === "context_deprioritize",
    ),
    context_refs_to_exclude: live_candidates.filter(
      (item) => item.candidate_kind === "context_exclude",
    ),
    expected_return_signal_updates: live_candidates.filter(
      (item) => item.candidate_kind === "expected_return_update",
    ),
    source_refs: ["source-ref:durable-apply-contract"],
    evidence_refs: ["evidence-ref:durable-apply-contract"],
    selected_record_ref,
    review_summary: "Synthetic decision preview for write contract smoke.",
  };
  return {
    preview_version: "handoff_context_apply_operator_decision_preview.v0.1",
    scope: "project:augnes",
    as_of,
    source_refs: ["decision-preview-source:durable-apply-contract"],
    decision_preview_status,
    recommended_operator_decision,
    available_operator_decisions: [
      "defer_until_record_material_supplied",
      "defer_until_blockers_resolved",
      "review_for_future_apply_write",
      "approve_for_future_apply_write",
      "keep_preview_only",
      "reject_apply_candidate",
    ],
    input_summary: {
      has_apply_preview: true,
      apply_preview_status: "apply_candidates_available",
      selected_record_ref,
      selected_full_record_supplied: true,
      apply_candidate_count: live_candidates.length,
      selected_ref_add_count: wouldApplyPreview.selected_refs_to_add.length,
      selected_ref_reinforce_count:
        wouldApplyPreview.selected_refs_to_reinforce.length,
      warning_update_count:
        wouldApplyPreview.warnings_to_add_or_strengthen.length,
      context_deprioritize_count:
        wouldApplyPreview.context_refs_to_deprioritize.length,
      context_exclude_count: wouldApplyPreview.context_refs_to_exclude.length,
      keep_unknown_count: keep_unknown.length,
      expected_return_update_count:
        wouldApplyPreview.expected_return_signal_updates.length,
      carry_forward_stop_count: stop_if_missing.length,
      rejected_or_excluded_note_count: rejected.length,
      blocker_count: blocking_reasons.length,
      insufficient_data_count: insufficient_data_reasons.length,
      conflict_count: 0,
      missing_evidence_count: missing_evidence.length,
    },
    source_status: {
      apply_preview: "supplied",
      apply_preview_status: "apply_candidates_available",
      authority_boundary: "valid_read_only",
      apply_preview_write_authority: "all_false",
    },
    readiness: {
      ready_for_operator_review:
        decision_preview_status === "ready_for_operator_review",
      ready_for_future_apply_write,
      requires_apply_preview: true,
      requires_full_record_material: true,
      requires_apply_candidates: true,
      requires_no_blockers: true,
      requires_no_missing_evidence: true,
      requires_no_unknown_selected_refs: true,
      requires_no_duplicate_selected_ref_adds: true,
      requires_no_selected_ref_missing_evidence: true,
      requires_no_problem_records: true,
      requires_read_only_apply_preview: true,
      requires_operator_confirmation: true,
      current_blockers: readinessCurrentBlockers,
      current_missing_evidence: readinessCurrentMissingEvidence,
    },
    approval_requirements: [
      "operator confirms separate apply write scope is required",
    ],
    blocking_reasons,
    insufficient_data_reasons,
    missing_evidence,
    conflict_summary: {
      duplicate_selected_refs: [],
      unknown_selected_ref_attempts: [],
      missing_evidence_candidates: [],
      stale_or_noisy_candidates: [],
      conflicting_candidate_ids: [],
      blocked_apply_reasons: [],
    },
    evidence_summary: {
      has_apply_preview: true,
      apply_preview_version_valid: true,
      has_selected_record: true,
      has_full_record_material: true,
      has_apply_candidates: live_candidates.length > 0,
      has_source_refs: true,
      has_evidence_refs: true,
      has_missing_evidence: missing_evidence.length > 0,
      has_conflicts: false,
      has_problem_records: false,
      all_apply_candidates_evidence_backed: true,
      no_live_handoff_mutation_confirmed: true,
      no_handoff_send_confirmed: true,
      no_provider_github_codex_confirmed: true,
      authority_boundary_valid: true,
      source_refs: ["source-ref:durable-apply-contract"],
      evidence_refs: ["evidence-ref:durable-apply-contract"],
      missing_evidence,
      problem_record_ids: [],
    },
    would_apply_preview: wouldApplyPreview,
    would_not_apply: ["does_not_write_db_rows"],
    candidate_carry_forward: {
      keep_unknown_as_review_only: keep_unknown,
      carry_forward_stop_if_missing: stop_if_missing,
      rejected_or_excluded_review_notes: rejected,
      duplicate_selected_refs: [],
      unknown_selected_ref_attempts: [],
      stale_or_noisy_candidates: [],
      missing_evidence_candidates: [],
      unresolved_blockers: [],
      ...carry_forward_overrides,
    },
    review_checklist: ["Review future apply write contract."],
    non_goals: ["no live handoff context mutation"],
    authority_boundary: {
      ...createDecisionPreviewAuthorityBoundary(),
      ...authority_overrides,
    },
  };
}

function candidate(suffix, kind = "selected_ref_add") {
  return {
    candidate_id: `candidate:durable-${suffix}`,
    candidate_kind: kind,
    ref_id: `context-ref:durable-${suffix}`,
    label: `Durable ${suffix}`,
    summary: `Durable ${suffix} apply write candidate`,
    source_record_id: "hcu-record:durable-apply-contract",
    source_candidate_id: `source-candidate:durable-${suffix}`,
    source_bucket: "helpful",
    evidence_refs: [`evidence-ref:durable-${suffix}`],
    source_refs: [`source-ref:durable-${suffix}`],
    existing_handoff_ref_ids: [],
    apply_preview_only: true,
    would_mutate_live_handoff: false,
    review_note: "Contract preview material only.",
  };
}

function createDecisionPreviewAuthorityBoundary() {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_handoff_context_update_record: false,
    can_write_operator_approved_handoff_context_update_record: false,
    can_mutate_live_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_dogfood_ledger: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: ["Synthetic read-only decision preview authority."],
  };
}

function assertAuthorityFalse(authority) {
  for (const [field, value] of Object.entries(authority)) {
    if (["read_only", "advisory_only", "derived_read_model"].includes(field)) {
      assert.equal(value, true, `${field} should be true`);
      continue;
    }
    if (field === "notes") continue;
    assert.equal(value, false, `${field} should be false`);
  }
}

function assertNoForbiddenContractRuntimeCall(label, text) {
  for (const forbidden of [
    "buildHandoffContextApplyOperatorDecisionPreviewV01(",
    "buildHandoffContextApplyPreviewV01(",
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "readHandoffContextUpdateRecordReviewForWebV01",
    "better-sqlite3",
    "new Database",
    "/api/handoff/context-updates",
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "Octokit",
    "@octokit",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "sendHandoff(",
    "writeSelectedRef",
    "applyPerspective(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoForbiddenWorkbenchRuntimeCall(label, text) {
  for (const forbidden of [
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "/api/handoff/context-updates",
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "Octokit",
    "@octokit",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "sendHandoff(",
    "writeSelectedRef",
    "applyPerspective(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}
