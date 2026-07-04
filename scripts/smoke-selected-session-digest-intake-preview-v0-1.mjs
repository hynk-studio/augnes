#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/selected-session-digest-intake-preview.ts";
const helperFile = "lib/intake/selected-session-digest-intake-preview.ts";
const panelFile =
  "components/intake/selected-session-digest-intake-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const smokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const writeContractSmokeFile =
  "scripts/smoke-handoff-context-apply-write-contract-preview-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  smokeFile,
  agentWorkplaneSmokeFile,
  writeContractSmokeFile,
  "scripts/smoke-handoff-context-apply-operator-decision-preview-v0-1.mjs",
  "scripts/smoke-handoff-context-apply-preview-v0-1.mjs",
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs",
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs",
  "scripts/smoke-handoff-context-update-write-v0-1.mjs",
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs",
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs",
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs",
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs",
  packageJsonFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:selected-session-digest-intake-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "selected_session_digest_intake_preview.v0.1",
    "chatgpt_session_digest",
    "codex_session_digest",
    "project_history_digest",
    "research_note_digest",
    "manual_operator_digest",
    "ready_for_operator_review",
    "prepare_separate_digest_ingest_contract_preview",
    "SelectedSessionDigestIntakeCandidate",
    "candidate_kind",
    "rejected_or_review_only",
    "future_ingest_contract_preview",
    "required_no_side_effects_receipt",
    "can_write_db: false",
    "can_create_schema: false",
    "can_create_ingest_record: false",
    "can_write_memory: false",
    "can_mutate_current_working_perspective: false",
    "can_mutate_handoff_context: false",
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
    "buildSelectedSessionDigestIntakePreviewV01",
    "SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH",
    "createSelectedSessionDigestIntakeAuthorityBoundaryV01",
    "raw_text_extraction_is_deterministic_and_not_semantic_summary",
    "raw_text_over_max_length_not_extracted",
    "raw_text_contains_embedded_credential_url_marker",
    "tokenLikeSecretRefPattern",
    "embeddedCredentialUrlRefPattern",
    "structured_digest_contains_secret_or_private_marker",
    "structured_digest_summary_unsafe",
    "safeStructuredFieldStrings",
    "source_kind_unknown",
    "source_ref_missing",
    "operator_ref_missing",
    "session_or_project_ref_missing",
    "candidate_material_missing",
    "ingestable_candidate_material_missing_review_only_material_present",
    "evidence_refs_missing_for_future_ingest_contract",
    "selected_session_digest_ingest_candidate.v0.1",
    "does_not_write_db_rows",
    "does_not_write_memory",
    "does_not_mutate_current_working_perspective",
    "does_not_mutate_handoff_context",
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
    "Selected Session Digest Intake Preview",
    "candidate counts by bucket",
    "extracted preview counts",
    "future ingest contract requirements",
    "privacy review",
    "would not ingest",
    "authority boundary flags",
    "can_create_ingest_record",
    "can_write_selected_refs_to_live_handoff",
    "can_send_handoff",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "SelectedSessionDigestIntakePreviewPanel",
    "buildSelectedSessionDigestIntakePreviewV01",
    "selectedSessionDigestIntakePreview",
    "workbench:selected_session_digest_intake_preview_empty_input",
    "preview={selectedSessionDigestIntakePreview}",
  ],
  { label: agentWorkplaneFile },
);

assertNoForbiddenRuntimeCall(helperFile, helperText);
assertNoForbiddenRuntimeCall(panelFile, panelText);
assertNoForbiddenRuntimeCall(agentWorkplaneFile, agentWorkplaneText);
assertNoWorkbenchDefaultDigestFixture(agentWorkplaneText);
assertNoButtons(panelFile, panelText);
assertNoButtons(agentWorkplaneFile, agentWorkplaneText);
assertNoForbiddenChangedPaths();

const intakeModule = await import(
  "../lib/intake/selected-session-digest-intake-preview.ts"
);
const {
  buildSelectedSessionDigestIntakePreviewV01,
  createSelectedSessionDigestIntakeAuthorityBoundaryV01,
  SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH,
} = intakeModule;

const missingDigest = buildSelectedSessionDigestIntakePreviewV01({
  as_of: "2026-07-04T13:15:00.000Z",
  scope: "project:augnes",
});
assert(["no_digest", "insufficient_data"].includes(missingDigest.intake_preview_status));
assert.equal(missingDigest.readiness.ready_for_operator_review, false);
assert.equal(
  missingDigest.readiness.ready_for_future_ingest_contract_preview,
  false,
);
assert.equal(missingDigest.recommended_next_action, "supply_selected_session_digest");
assertAuthorityFalse(missingDigest.authority_boundary);

const emptyRawText = buildSelectedSessionDigestIntakePreviewV01({
  raw_text: " \n\t ",
  as_of: "2026-07-04T13:15:00.000Z",
  scope: "project:augnes",
});
assert(["no_digest", "insufficient_data"].includes(emptyRawText.intake_preview_status));
assert.equal(emptyRawText.input_summary.has_raw_text, false);
assert.equal(emptyRawText.readiness.ready_for_operator_review, false);

const oversizedRawText = buildSelectedSessionDigestIntakePreviewV01({
  raw_text: "a".repeat(SELECTED_SESSION_DIGEST_RAW_TEXT_MAX_LENGTH + 1),
  source_kind: "chatgpt_session_digest",
  source_ref: "source:oversized",
  operator_ref: "operator:reviewer",
  session_ref: "session:oversized",
});
assert.equal(oversizedRawText.source_status.raw_text, "too_large");
assert.equal(oversizedRawText.readiness.ready_for_operator_review, false);
assert(
  oversizedRawText.blocked_reasons.includes("blocked_raw_text_too_large"),
);

let malformedDigest;
assert.doesNotThrow(() => {
  malformedDigest = buildSelectedSessionDigestIntakePreviewV01({
    digest: ["not", "a", "structured", "digest"],
  });
});
assert(["malformed", "insufficient_data"].includes(malformedDigest.intake_preview_status));
assert.equal(malformedDigest.source_status.digest, "malformed");
assert.equal(malformedDigest.readiness.ready_for_operator_review, false);

const structuredDigest = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    title: "Selected handoff spine digest",
    summary: "Operator selected a bounded session digest for review.",
    goals: ["Turn selected digest material into reviewable candidates."],
    decisions: ["Keep intake preview-only."],
    open_questions: ["Which evidence refs should carry forward?"],
    next_actions: ["Review candidate material before durable ingest."],
    evidence_refs: ["evidence:selected-digest-1"],
    source_refs: ["source:selected-digest-1", "source:selected-digest-1"],
    risks: ["Missing privacy review blocks ingest."],
    reusable_context: ["Selected session digest can seed later review."],
    created_at: "2026-07-04T13:15:00.000Z",
    session_ref: "session:selected-digest",
    project_ref: "project:augnes",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:selected-digest-1",
  operator_ref: "operator:reviewer",
});
assert.equal(
  structuredDigest.input_summary.candidate_count >= 8,
  true,
  "structured digest should produce candidate material",
);
assert.equal(
  structuredDigest.candidate_material.user_goal_candidates.length,
  1,
);
assert.equal(structuredDigest.candidate_material.decision_candidates.length, 1);
assert.equal(
  structuredDigest.candidate_material.open_question_candidates.length,
  1,
);
assert.equal(
  structuredDigest.candidate_material.next_action_candidates.length,
  1,
);
assert.deepEqual(
  structuredDigest.evidence_summary.source_refs.filter(
    (ref) => ref === "source:selected-digest-1",
  ),
  ["source:selected-digest-1"],
);
assert.deepEqual(structuredDigest.evidence_summary.evidence_refs, [
  "evidence:selected-digest-1",
]);
assert.equal(structuredDigest.readiness.ready_for_operator_review, true);
assert.equal(
  structuredDigest.readiness.ready_for_future_ingest_contract_preview,
  true,
);
assert.equal(
  structuredDigest.recommended_next_action,
  "prepare_separate_digest_ingest_contract_preview",
);
assertCandidateFlagsFalse([
  ...structuredDigest.candidate_material.session_summary_candidates,
  ...structuredDigest.candidate_material.user_goal_candidates,
  ...structuredDigest.candidate_material.decision_candidates,
]);

const rawTextPreview = buildSelectedSessionDigestIntakePreviewV01({
  raw_text: [
    "# Selected Session",
    "Summary: operator picked a digest",
    "Decisions: keep preview-only",
    "- [ ] Next review source:session-digest evidence:session-digest-proof",
    "2026-07-04T13:15:00Z",
    "`quoted_id`",
  ].join("\n"),
  source_kind: "manual_operator_digest",
  source_ref: "source:manual-digest",
  operator_ref: "operator:reviewer",
  session_ref: "session:manual-digest",
});
assert.deepEqual(rawTextPreview.extracted_preview.heading_lines, [
  "# Selected Session",
  "Decisions: keep preview-only",
  "Summary: operator picked a digest",
]);
assert.equal(rawTextPreview.extracted_preview.checklist_lines.length, 1);
assert(
  rawTextPreview.extracted_preview.explicit_ref_like_tokens.includes(
    "source:session-digest",
  ),
);
assert(
  rawTextPreview.extracted_preview.explicit_ref_like_tokens.includes(
    "evidence:session-digest-proof",
  ),
);
assert(
  rawTextPreview.extracted_preview.possible_dates.includes(
    "2026-07-04T13:15:00Z",
  ),
);
assert(rawTextPreview.extracted_preview.quoted_identifiers.includes("quoted_id"));
assert.equal(rawTextPreview.candidate_material.session_summary_candidates.length, 3);
assert.equal(rawTextPreview.candidate_material.next_action_candidates.length, 1);
assert.equal(rawTextPreview.candidate_material.source_ref_candidates.length, 1);
assert.equal(rawTextPreview.candidate_material.evidence_ref_candidates.length, 1);
assert(
  rawTextPreview.extracted_preview.review_notes.includes(
    "raw_text_extraction_is_deterministic_and_not_semantic_summary",
  ),
);

const dateOnlyRawText = buildSelectedSessionDigestIntakePreviewV01({
  raw_text: "2026-07-04 `quoted_only`",
  source_kind: "manual_operator_digest",
  source_ref: "source:date-only",
  operator_ref: "operator:reviewer",
  session_ref: "session:date-only",
});
assert.equal(dateOnlyRawText.extracted_preview.possible_dates.length, 1);
assert.equal(dateOnlyRawText.extracted_preview.quoted_identifiers.length, 1);
assert.equal(
  dateOnlyRawText.input_summary.candidate_count,
  0,
  "raw_text dates and quoted ids alone must not fabricate candidates",
);

const unsafeRawText = buildSelectedSessionDigestIntakePreviewV01({
  raw_text:
    "Summary: source:sk-private evidence:https://user:pass@example.com/proof",
  source_kind: "manual_operator_digest",
  source_ref: "source:unsafe-raw-text",
  operator_ref: "operator:reviewer",
  session_ref: "session:unsafe-raw-text",
});
assert.equal(unsafeRawText.source_status.raw_text, "unsafe");
assert.equal(unsafeRawText.readiness.ready_for_operator_review, false);
assert.equal(unsafeRawText.recommended_next_action, "resolve_unsafe_refs");
assert(
  unsafeRawText.unsafe_ref_reasons.includes(
    "raw_text_contains_token_like_secret_marker",
  ),
);
assert(
  unsafeRawText.unsafe_ref_reasons.includes(
    "raw_text_contains_embedded_credential_url_marker",
  ),
);

const unknownSourceKind = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Candidate with unknown source kind.",
    evidence_refs: ["evidence:unknown-source-kind"],
    session_ref: "session:unknown-source-kind",
  },
  source_kind: "unknown",
  source_ref: "source:unknown-source-kind",
  operator_ref: "operator:reviewer",
});
assert.equal(unknownSourceKind.source_status.source_kind, "unknown");
assert.equal(
  unknownSourceKind.readiness.ready_for_future_ingest_contract_preview,
  false,
);

const missingSourceRef = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Candidate missing source ref.",
    evidence_refs: ["evidence:missing-source-ref"],
    session_ref: "session:missing-source-ref",
  },
  source_kind: "chatgpt_session_digest",
  operator_ref: "operator:reviewer",
});
assert.equal(missingSourceRef.readiness.ready_for_operator_review, true);
assert.equal(
  missingSourceRef.readiness.ready_for_future_ingest_contract_preview,
  false,
);
assert.equal(missingSourceRef.recommended_next_action, "supply_source_ref");

const missingOperatorRef = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Candidate missing operator ref.",
    evidence_refs: ["evidence:missing-operator-ref"],
    session_ref: "session:missing-operator-ref",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:missing-operator-ref",
});
assert.equal(missingOperatorRef.readiness.ready_for_operator_review, true);
assert.equal(
  missingOperatorRef.readiness.ready_for_future_ingest_contract_preview,
  false,
);
assert.equal(missingOperatorRef.recommended_next_action, "supply_operator_ref");

for (const [label, input] of [
  ["source_ref", { source_ref: "/Users/private/session" }],
  ["source_ref", { source_ref: "source:sk-private" }],
  ["operator_ref", { operator_ref: "ghp_secret" }],
  ["session_ref", { session_ref: "../private-session" }],
  ["project_ref", { project_ref: "C:\\private\\project" }],
  [
    "evidence_ref",
    { digest: { evidence_refs: ["https://user:pass@example.com/evidence"] } },
  ],
]) {
  const unsafe = buildSelectedSessionDigestIntakePreviewV01({
    digest: {
      summary: `Unsafe ${label} should block.`,
      evidence_refs: ["evidence:baseline-safe"],
      session_ref: "session:safe",
    },
    source_kind: "chatgpt_session_digest",
    source_ref: "source:safe",
    operator_ref: "operator:safe",
    ...input,
  });
  assert.equal(
    unsafe.readiness.ready_for_operator_review,
    false,
    `${label} should block operator review readiness`,
  );
  assert.equal(
    unsafe.recommended_next_action,
    "resolve_unsafe_refs",
    `${label} should recommend unsafe ref resolution`,
  );
  assert(
    unsafe.unsafe_ref_reasons.some((reason) => reason.startsWith(label)),
    `${label} should be named in unsafe_ref_reasons`,
  );
}

const unsafeNamespacedEvidenceRef = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Namespaced token-like evidence ref should block.",
    evidence_refs: ["evidence:ghp_secret"],
    session_ref: "session:namespaced-evidence-secret",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:namespaced-evidence-secret",
  operator_ref: "operator:reviewer",
});
assert.equal(
  unsafeNamespacedEvidenceRef.readiness.ready_for_operator_review,
  false,
);
assert(
  unsafeNamespacedEvidenceRef.unsafe_ref_reasons.includes(
    "evidence_ref_unsafe",
  ),
);

const unsafeNamespacedSourceRefs = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Namespaced credentialed source ref should block.",
    source_refs: ["source:https://user:pass@example.com/evidence"],
    evidence_refs: ["evidence:namespaced-source-credential"],
    session_ref: "session:namespaced-source-credential",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:namespaced-source-credential",
  operator_ref: "operator:reviewer",
});
assert.equal(
  unsafeNamespacedSourceRefs.readiness.ready_for_operator_review,
  false,
);
assert(
  unsafeNamespacedSourceRefs.unsafe_ref_reasons.includes(
    "source_refs_unsafe",
  ),
);

const unsafeStructuredSecretText = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "password: hunter2",
    decisions: ["Keep this out of candidates"],
    evidence_refs: ["evidence:safe-structured-secret"],
    session_ref: "session:safe-structured-secret",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:safe-structured-secret",
  operator_ref: "operator:reviewer",
});
assert.equal(
  unsafeStructuredSecretText.readiness.ready_for_operator_review,
  false,
);
assert.equal(
  unsafeStructuredSecretText.readiness.ready_for_future_ingest_contract_preview,
  false,
);
assert.equal(
  unsafeStructuredSecretText.recommended_next_action,
  "resolve_unsafe_refs",
);
assert(
  unsafeStructuredSecretText.unsafe_ref_reasons.includes(
    "structured_digest_contains_secret_or_private_marker",
  ) ||
    unsafeStructuredSecretText.blocked_reasons.includes(
      "structured_digest_contains_secret_or_private_marker",
    ),
);
assert(
  unsafeStructuredSecretText.unsafe_ref_reasons.includes(
    "structured_digest_summary_unsafe",
  ),
);
assertCandidateMaterialDoesNotLeak(unsafeStructuredSecretText, [
  "hunter2",
  "password:",
]);

const unsafeStructuredNamespacedCredentialUrl =
  buildSelectedSessionDigestIntakePreviewV01({
    digest: {
      summary: "source:https://user:pass@example.com/private",
      evidence_refs: ["evidence:safe-structured-credential-url"],
      session_ref: "session:safe-structured-credential-url",
    },
    source_kind: "chatgpt_session_digest",
    source_ref: "source:safe-structured-credential-url",
    operator_ref: "operator:reviewer",
  });
assert.equal(
  unsafeStructuredNamespacedCredentialUrl.readiness.ready_for_operator_review,
  false,
);
assert.equal(
  unsafeStructuredNamespacedCredentialUrl.readiness
    .ready_for_future_ingest_contract_preview,
  false,
);
assert.equal(
  unsafeStructuredNamespacedCredentialUrl.recommended_next_action,
  "resolve_unsafe_refs",
);
assert(
  unsafeStructuredNamespacedCredentialUrl.unsafe_ref_reasons.includes(
    "structured_digest_contains_secret_or_private_marker",
  ),
);
assert(
  unsafeStructuredNamespacedCredentialUrl.unsafe_ref_reasons.includes(
    "structured_digest_summary_unsafe",
  ),
);
assertCandidateMaterialDoesNotLeak(unsafeStructuredNamespacedCredentialUrl, [
  "user:pass",
  "source:https://user:pass@example.com/private",
]);

const reviewOnly = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    review_only: ["This rejected material should remain review-only."],
    session_ref: "session:review-only",
  },
  source_kind: "manual_operator_digest",
  source_ref: "source:review-only",
  operator_ref: "operator:reviewer",
});
assert.equal(reviewOnly.input_summary.candidate_count, 1);
assert.equal(
  reviewOnly.candidate_material.rejected_or_review_only_candidates.length,
  1,
);
assert.equal(reviewOnly.readiness.ready_for_operator_review, false);
assert.equal(
  reviewOnly.insufficient_data_reasons.includes(
    "ingestable_candidate_material_missing_review_only_material_present",
  ),
  true,
);

assertContainsAll(
  structuredDigest.would_not_ingest.join("\n"),
  [
    "does_not_write_db_rows",
    "does_not_write_memory",
    "does_not_mutate_current_working_perspective",
    "does_not_mutate_perspective_unit",
    "does_not_mutate_handoff_context",
    "does_not_write_selected_refs_to_active_handoff_packet",
    "does_not_send_handoffs",
    "does_not_write_dogfood_metrics",
    "does_not_write_reuse_ledger",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
    "does_not_create_prs",
    "does_not_merge_prs",
    "does_not_run_autonomous_actions",
  ],
  { label: "would_not_ingest" },
);
assertAuthorityFalse(createSelectedSessionDigestIntakeAuthorityBoundaryV01());

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "selected-session-digest-intake-preview-v0-1",
});

console.log(
  JSON.stringify(
    {
      smoke: "selected-session-digest-intake-preview-v0-1",
      pass: true,
      package_script_checked: true,
      helper_behavior_checked: true,
      raw_text_deterministic_extraction_checked: true,
      public_safe_ref_validation_checked: true,
      workbench_static_boundary_checked: true,
      changed_files_checked: changedFileBoundary.checked,
      changed_files_skipped: changedFileBoundary.skipped,
      changed_files_skip_reason: changedFileBoundary.skip_reason,
      changed_files_observed: changedFileBoundary.files,
      no_api_route_added: true,
      no_db_helper_added: true,
      no_memory_or_perspective_write_path_added: true,
      no_handoff_mutation_or_send_added: true,
      no_provider_github_codex_call_added: true,
      no_autonomous_action_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:selected-session-digest-intake-preview-v0-1");

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

function assertCandidateFlagsFalse(candidates) {
  for (const candidate of candidates) {
    assert.equal(candidate.review_required, true);
    assert.equal(candidate.ingest_preview_only, true);
    assert.equal(candidate.would_write_memory, false);
    assert.equal(candidate.would_mutate_perspective, false);
    assert.equal(candidate.would_mutate_cwp, false);
    assert.equal(candidate.would_create_handoff, false);
  }
}

function assertCandidateMaterialDoesNotLeak(preview, forbiddenFragments) {
  for (const candidate of flattenCandidateMaterial(preview.candidate_material)) {
    for (const field of ["candidate_id", "summary", "raw_excerpt"]) {
      const value = candidate[field] ?? "";
      for (const fragment of forbiddenFragments) {
        assert(
          !value.includes(fragment),
          `${field} must not leak ${fragment}`,
        );
      }
    }
  }
}

function flattenCandidateMaterial(material) {
  return [
    ...material.session_summary_candidates,
    ...material.user_goal_candidates,
    ...material.decision_candidates,
    ...material.open_question_candidates,
    ...material.next_action_candidates,
    ...material.evidence_ref_candidates,
    ...material.source_ref_candidates,
    ...material.risk_or_blocker_candidates,
    ...material.reusable_context_candidates,
    ...material.rejected_or_review_only_candidates,
  ];
}

function assertNoForbiddenRuntimeCall(label, text) {
  for (const forbidden of [
    "app/api/",
    "/api/",
    "fetch(",
    "method: \"POST\"",
    "method: 'POST'",
    "better-sqlite3",
    "new Database",
    "@/lib/db",
    "writeOperatorApprovedHandoffContextUpdateV01",
    "ensureHandoffContextUpdateWriteSchemaV01",
    "writeSelectedRef",
    "sendHandoff(",
    "appendWorkEvent(",
    "appendCoordinationEvent(",
    "createEvidenceRecord(",
    "recordProof(",
    "applyPerspective(",
    "commitStateDeltaProposal(",
    "rejectStateDeltaProposal(",
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
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "setInterval(",
    "setTimeout(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function assertNoWorkbenchDefaultDigestFixture(text) {
  const start = text.indexOf("const selectedSessionDigestIntakePreview");
  const end = text.indexOf("const dogfoodMetricCandidatePreview");
  assert(start !== -1, "Workbench must build selected session intake preview");
  assert(end > start, "Workbench selected session intake preview block must be bounded");
  const snippet = text.slice(start, end);
  assert(!snippet.includes("digest:"), "Workbench default must not pass digest");
  assert(!snippet.includes("raw_text:"), "Workbench default must not pass raw_text");
  assert(!snippet.includes("sample"), "Workbench default must not pass sample material");
  assert(!snippet.includes("fixture"), "Workbench default must not pass fixture material");
}

function assertNoButtons(label, text) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send)/i.test(text),
    `${label} must not render import/write/apply/approve/send buttons`,
  );
}

function assertNoForbiddenChangedPaths() {
  const untrackedFiles = collectUntrackedFiles();
  for (const file of untrackedFiles) {
    assert(
      allowedChangedFiles.includes(file),
      `Unexpected untracked file for selected session digest intake preview: ${file}`,
    );
  }
  for (const file of allowedChangedFiles) {
    assert(!/^app\/api\//.test(file), `No app/api route may be added: ${file}`);
    assert(!/^db\//.test(file), `No DB helper/schema file may be added: ${file}`);
    assert(
      !/(^|\/)(provider|providers|openai|github)(\/|$)/i.test(file),
      `No provider/OpenAI/GitHub runtime path may be changed: ${file}`,
    );
    assert(
      !/(^|\/)(mcp|plugin|plugins|tool|tools)(\/|$)/i.test(file),
      `No App/MCP tool path may be changed: ${file}`,
    );
  }
}
