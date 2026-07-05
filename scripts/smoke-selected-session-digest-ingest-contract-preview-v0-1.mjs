#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/selected-session-digest-ingest-contract-preview.ts";
const helperFile =
  "lib/intake/selected-session-digest-ingest-contract-preview.ts";
const panelFile =
  "components/intake/selected-session-digest-ingest-contract-preview-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const overviewTypeFile = "types/workbench-dogfood-loop-spine-overview.ts";
const overviewHelperFile =
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts";
const overviewSmokeFile =
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs";
const intakeSmokeFile =
  "scripts/smoke-selected-session-digest-intake-preview-v0-1.mjs";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const operatorDecisionTypeFile =
  "types/selected-session-digest-ingest-operator-decision.ts";
const operatorDecisionHelperFile =
  "lib/intake/selected-session-digest-ingest-operator-decision.ts";
const operatorDecisionPanelFile =
  "components/intake/selected-session-digest-ingest-operator-decision-panel.tsx";
const decisionWriteTypeFile =
  "types/selected-session-digest-ingest-decision-write.ts";
const decisionWriteHelperFile =
  "lib/intake/selected-session-digest-ingest-decision-write.ts";
const decisionWriteRouteFile =
  "app/api/intake/selected-session-digest/ingest-decisions/route.ts";
const operatorDecisionSmokeFile =
  "scripts/smoke-selected-session-digest-ingest-operator-decision-v0-1.mjs";
const smokeFile =
  "scripts/smoke-selected-session-digest-ingest-contract-preview-v0-1.mjs";
const packageJsonFile = "package.json";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  overviewTypeFile,
  overviewHelperFile,
  overviewSmokeFile,
  intakeSmokeFile,
  agentWorkplaneSmokeFile,
  operatorDecisionTypeFile,
  operatorDecisionHelperFile,
  operatorDecisionPanelFile,
  decisionWriteTypeFile,
  decisionWriteHelperFile,
  decisionWriteRouteFile,
  operatorDecisionSmokeFile,
  smokeFile,
  packageJsonFile,
];

const textByFile = loadTextByFile([
  typeFile,
  helperFile,
  panelFile,
  agentWorkplaneFile,
  overviewTypeFile,
  overviewHelperFile,
  packageJsonFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const overviewTypeText = textByFile.get(overviewTypeFile);
const overviewHelperText = textByFile.get(overviewHelperFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:selected-session-digest-ingest-contract-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-selected-session-digest-ingest-contract-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "selected_session_digest_ingest_contract_preview.v0.1",
    "selected_session_digest_ingest_record.v0.1",
    "selected_session_digest_ingest_receipt.v0.1",
    "SelectedSessionDigestIngestContractPreviewInput",
    "selected_session_digest_intake_preview?: unknown",
    "selectable_digest_candidate_refs",
    "can_create_ingest_record: false",
    "can_create_ingest_receipt: false",
    "can_call_provider_openai: false",
    "can_execute_codex: false",
  ],
  { label: typeFile },
);
assert(
  !typeText.includes("raw_text?:") && !typeText.includes("digest?:"),
  "ingest contract input must not accept raw digest or raw_text material",
);

assertContainsAll(
  helperText,
  [
    "buildSelectedSessionDigestIngestContractPreviewV01",
    "createSelectedSessionDigestIngestContractAuthorityBoundaryV01",
    "SELECTED_SESSION_DIGEST_INTAKE_PREVIEW_VERSION",
    "rejected_or_review_only_candidates",
    "raw_excerpt",
    "selected_digest_candidate_refs_missing",
    "selected_candidate_refs_not_in_intake_preview",
    "unknown_selected_digest_candidate_ref",
    "privacy_review_confirmation_ref_missing",
    "requested_idempotency_key_missing",
    "candidate_material_contains_secret_or_private_marker",
  ],
  { label: helperFile },
);

assertContainsAll(
  panelText,
  [
    "Selected Session Digest Ingest Contract Preview",
    "future ingest write contract",
    "privacy review",
    "idempotency",
    "would not write",
    "authority boundary",
    "can_create_ingest_record",
    "can_execute_codex",
  ],
  { label: panelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "SelectedSessionDigestIngestContractPreviewPanel",
    "buildSelectedSessionDigestIngestContractPreviewV01",
    "selectedSessionDigestIngestContractPreview",
    "selected_session_digest_intake_preview: selectedSessionDigestIntakePreview",
    "preview={selectedSessionDigestIngestContractPreview}",
    "selected_session_digest_ingest_contract_preview: selectedSessionDigestIngestContractPreview",
  ],
  { label: agentWorkplaneFile },
);

assertContainsAll(
  overviewTypeText,
  [
    "SelectedSessionDigestIngestContractPreview",
    "selected_session_digest_ingest_contract_preview",
    "selected_session_digest_ingest_contract",
    "supply_privacy_review_confirmation",
    "prepare_separate_ingest_write_slice",
  ],
  { label: overviewTypeFile },
);

assertContainsAll(
  overviewHelperText,
  [
    "selectedSessionDigestIngestContractStep",
    "selected_session_digest_ingest_contract",
    "mapSelectedSessionIngestContractStatus",
    "privacy_review_confirmation_ref_missing",
    "requested_idempotency_key_missing",
  ],
  { label: overviewHelperFile },
);

const {
  buildSelectedSessionDigestIngestContractPreviewV01,
  createSelectedSessionDigestIngestContractAuthorityBoundaryV01,
} = await import(
  "../lib/intake/selected-session-digest-ingest-contract-preview.ts"
);
const { buildSelectedSessionDigestIntakePreviewV01 } = await import(
  "../lib/intake/selected-session-digest-intake-preview.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const missingPreview = buildSelectedSessionDigestIngestContractPreviewV01();
assert(
  ["no_intake_preview", "insufficient_data"].includes(
    missingPreview.contract_preview_status,
  ),
  "missing intake preview should fail closed",
);
assert.equal(
  missingPreview.recommended_next_action,
  "supply_selected_session_intake_preview",
);
assert.equal(
  missingPreview.readiness.ready_for_future_ingest_write_scope,
  false,
);

const wrongVersion = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: { preview_version: "wrong.v0" },
});
assert(
  ["blocked", "insufficient_data"].includes(
    wrongVersion.contract_preview_status,
  ),
  "wrong-version intake preview should not throw and should not be ready",
);
assert.equal(
  wrongVersion.readiness.ready_for_future_ingest_write_scope,
  false,
);

const malformed = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: {
    preview_version: "selected_session_digest_intake_preview.v0.1",
  },
});
assert(
  ["blocked", "insufficient_data"].includes(malformed.contract_preview_status),
  "malformed intake preview should not throw and should not be ready",
);

const emptyIntake = buildSelectedSessionDigestIntakePreviewV01();
const emptyContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: emptyIntake,
});
assert(
  ["insufficient_data", "no_intake_preview"].includes(
    emptyContract.contract_preview_status,
  ),
  "empty intake preview should remain insufficient",
);
assert.equal(emptyContract.recommended_next_action, "supply_selected_session_digest");
assert.equal(
  emptyContract.readiness.ready_for_future_ingest_write_scope,
  false,
);

const cleanIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    title: "Reviewable selected session",
    summary: "Operator supplied selected digest summary",
    goals: ["Preserve source-refed continuity"],
    decisions: ["Keep ingest write separate"],
    open_questions: ["Which candidates should be selected"],
    next_actions: ["Review future ingest contract"],
    evidence_refs: ["evidence:selected-digest-clean"],
    source_refs: ["source:selected-digest-clean"],
    reusable_context: ["Current dogfood loop restart point"],
    rejected_or_review_only: ["Review-only note stays out of write material"],
    session_ref: "session:selected-digest-clean",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:selected-digest-clean",
  operator_ref: "operator:selected-digest-reviewer",
  session_ref: "session:selected-digest-clean",
  as_of: "2026-07-05T00:00:00.000Z",
  scope: "project:augnes",
});
assert.equal(
  cleanIntake.readiness.ready_for_future_ingest_contract_preview,
  true,
);

const contractMissingPrivacy =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanIntake,
  });
assert(
  ["contract_candidates_available", "ready_for_operator_review"].includes(
    contractMissingPrivacy.contract_preview_status,
  ),
  "ready intake should produce reviewable contract candidates, not write authority",
);
assert.equal(
  contractMissingPrivacy.readiness.ready_for_future_ingest_write_scope,
  false,
);
assert.equal(
  contractMissingPrivacy.would_ingest_material_preview
    .selected_digest_candidate_refs.length,
  0,
  "selected refs should not fall back to all candidate refs",
);
assert(
  contractMissingPrivacy.would_ingest_material_preview
    .selectable_digest_candidate_refs.length > 0,
  "selectable refs may be shown separately from operator-selected refs",
);
assert(
  contractMissingPrivacy.insufficient_data_reasons.includes(
    "privacy_review_confirmation_ref_missing",
  ),
  "missing privacy review confirmation should be surfaced",
);
assert.equal(
  contractMissingPrivacy.authority_boundary.can_create_ingest_record,
  false,
);

const firstCandidateRef =
  contractMissingPrivacy.would_ingest_material_preview.candidate_summaries[0]
    .candidate_ref;
const contractMissingSelectedRefs =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanIntake,
    privacy_review_confirmation_ref: "privacy:selected-digest-clean",
  });
assert(
  contractMissingSelectedRefs.insufficient_data_reasons.includes(
    "selected_digest_candidate_refs_missing",
  ),
  "missing selected candidate refs should be surfaced",
);

const contractMissingIdempotency =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanIntake,
    privacy_review_confirmation_ref: "privacy:selected-digest-clean",
    selected_candidate_refs: [firstCandidateRef],
  });
assert(
  contractMissingIdempotency.insufficient_data_reasons.includes(
    "requested_idempotency_key_missing",
  ),
  "missing requested idempotency key should be surfaced",
);

const readyContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  privacy_review_confirmation_ref: "privacy:selected-digest-clean",
  selected_candidate_refs: [firstCandidateRef],
  requested_idempotency_key: "idempotency:selected-digest-clean",
});
assert.equal(
  readyContract.contract_preview_status,
  "ready_for_future_ingest_write_scope",
);
assert.equal(
  readyContract.recommended_next_action,
  "prepare_separate_ingest_write_slice",
);
assert.equal(readyContract.authority_boundary.can_write_db, false);
assert.equal(readyContract.authority_boundary.can_write_memory, false);

const unknownSelectedRefContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: cleanIntake,
    privacy_review_confirmation_ref: "privacy:selected-digest-clean",
    selected_candidate_refs: ["candidate:not-from-this-intake"],
    requested_idempotency_key: "idempotency:selected-digest-clean",
  });
assert.notEqual(
  unknownSelectedRefContract.contract_preview_status,
  "ready_for_future_ingest_write_scope",
);
assert.equal(
  unknownSelectedRefContract.readiness.ready_for_future_ingest_write_scope,
  false,
);
assert(
  [
    ...unknownSelectedRefContract.blocked_reasons,
    ...unknownSelectedRefContract.refusal_reasons,
    ...unknownSelectedRefContract.insufficient_data_reasons,
    ...unknownSelectedRefContract.readiness.current_blockers,
    ...unknownSelectedRefContract.readiness.current_refusal_reasons,
  ].some((reason) =>
    [
      "selected_candidate_refs_not_in_intake_preview",
      "unknown_selected_digest_candidate_ref",
    ].includes(reason),
  ),
  "unknown selected candidate refs must be surfaced as blockers/refusals",
);
assert.equal(
  unknownSelectedRefContract.would_ingest_material_preview
    .selected_digest_candidate_refs.length,
  0,
  "unknown selected refs must not be treated as operator-selected intake refs",
);

const missingSourceRefIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Missing source ref digest",
    evidence_refs: ["evidence:missing-source-ref"],
    session_ref: "session:missing-source-ref",
  },
  source_kind: "chatgpt_session_digest",
  operator_ref: "operator:missing-source-ref",
  session_ref: "session:missing-source-ref",
});
const missingSourceRefContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: missingSourceRefIntake,
  });
assert(
  missingSourceRefContract.insufficient_data_reasons.includes(
    "source_ref_missing_for_future_ingest_write_contract",
  ) ||
    missingSourceRefContract.insufficient_data_reasons.includes(
      "intake_preview_not_ready_for_future_ingest_contract_preview",
    ),
  "missing source ref should be surfaced",
);

const missingOperatorIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Missing operator ref digest",
    evidence_refs: ["evidence:missing-operator-ref"],
    session_ref: "session:missing-operator-ref",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:missing-operator-ref",
  session_ref: "session:missing-operator-ref",
});
const missingOperatorContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: missingOperatorIntake,
  });
assert(
  missingOperatorContract.insufficient_data_reasons.includes(
    "operator_ref_missing_for_future_ingest_write_contract",
  ) ||
    missingOperatorContract.insufficient_data_reasons.includes(
      "intake_preview_not_ready_for_future_ingest_contract_preview",
    ),
  "missing operator ref should be surfaced",
);

const missingSessionProjectIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Missing session project ref digest",
    evidence_refs: ["evidence:missing-session-project-ref"],
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:missing-session-project-ref",
  operator_ref: "operator:missing-session-project-ref",
});
const missingSessionProjectContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: missingSessionProjectIntake,
  });
assert(
  missingSessionProjectContract.insufficient_data_reasons.includes(
    "session_or_project_ref_missing_for_future_ingest_write_contract",
  ) ||
    missingSessionProjectContract.insufficient_data_reasons.includes(
      "intake_preview_not_ready_for_future_ingest_contract_preview",
    ),
  "missing session/project ref should be surfaced",
);

const missingEvidenceIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Missing evidence digest",
    session_ref: "session:missing-evidence-ref",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:missing-evidence-ref",
  operator_ref: "operator:missing-evidence-ref",
  session_ref: "session:missing-evidence-ref",
});
const missingEvidenceContract =
  buildSelectedSessionDigestIngestContractPreviewV01({
    selected_session_digest_intake_preview: missingEvidenceIntake,
  });
assert(
  missingEvidenceContract.missing_evidence.includes(
    "evidence_refs_missing_for_future_ingest_write_contract",
  ),
  "missing evidence refs should be surfaced",
);

const unsafeIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "Unsafe ref digest",
    evidence_refs: ["evidence:safe-unsafe-contract"],
    session_ref: "session:safe-unsafe-contract",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:sk-private",
  operator_ref: "operator:safe-unsafe-contract",
  session_ref: "session:safe-unsafe-contract",
});
const unsafeContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: unsafeIntake,
});
assert.equal(unsafeContract.contract_preview_status, "blocked");
assert.equal(
  unsafeContract.recommended_next_action,
  "resolve_intake_blockers_or_unsafe_refs",
);

assert.equal(
  contractMissingPrivacy.carry_forward_review_only_material
    .rejected_or_review_only_count,
  1,
);
assert(
  !JSON.stringify(
    contractMissingPrivacy.would_ingest_material_preview,
  ).includes("Review-only note stays out of write material"),
  "review-only material must not appear in would-ingest material",
);

const secretIntake = buildSelectedSessionDigestIntakePreviewV01({
  digest: {
    summary: "password: hunter2",
    evidence_refs: ["evidence:secret-contract"],
    session_ref: "session:secret-contract",
  },
  source_kind: "chatgpt_session_digest",
  source_ref: "source:secret-contract",
  operator_ref: "operator:secret-contract",
  session_ref: "session:secret-contract",
});
const secretContract = buildSelectedSessionDigestIngestContractPreviewV01({
  selected_session_digest_intake_preview: secretIntake,
});
const wouldIngestJson = JSON.stringify(
  secretContract.would_ingest_material_preview,
);
assert(!wouldIngestJson.includes("raw_excerpt"));
assert(!wouldIngestJson.includes("hunter2"));
assert(!wouldIngestJson.includes("password:"));
assert(!wouldIngestJson.includes("sk-"));
assert(!wouldIngestJson.includes("https://user:pass@"));

assertAuthorityFalse(
  createSelectedSessionDigestIngestContractAuthorityBoundaryV01(),
);

const overviewDefault = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: emptyIntake,
  selected_session_digest_ingest_contract_preview: emptyContract,
});
assert(
  ["no_current_material", "insufficient_data"].includes(
    overviewDefault.overview_status,
  ),
  "default overview must remain no-current-material/insufficient",
);
assert.equal(
  overviewDefault.recommended_next_operator_action,
  "supply_selected_session_digest",
);

const overviewContractMissingMaterial = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_session_digest_ingest_contract_preview: contractMissingPrivacy,
});
assert(
  overviewContractMissingMaterial.spine_steps.some(
    (step) => step.step_id === "selected_session_digest_ingest_contract",
  ),
  "overview should include selected digest ingest contract step",
);
assert.equal(
  overviewContractMissingMaterial.recommended_next_operator_action,
  "supply_privacy_review_confirmation",
);
assert(
  overviewContractMissingMaterial.current_material_gaps.some((gap) =>
    gap.includes("privacy_review_confirmation_ref_missing"),
  ),
  "overview should surface ingest contract material gaps",
);

const overviewUnknownSelectedRef = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: cleanIntake,
  selected_session_digest_ingest_contract_preview: unknownSelectedRefContract,
});
assert.notEqual(
  overviewUnknownSelectedRef.recommended_next_operator_action,
  "prepare_separate_ingest_write_slice",
);
assert(
  overviewUnknownSelectedRef.top_blockers.some(
    (blocker) =>
      blocker.includes("selected_candidate_refs_not_in_intake_preview") ||
      blocker.includes("unknown_selected_digest_candidate_ref"),
  ),
  "overview should surface unknown selected candidate ref blockers",
);

assertNoButtons(panelText, panelFile);
assert(
  !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Execute|Merge|Retry)/i.test(
    agentWorkplaneText,
  ),
  "AgentWorkplane must not render ingest contract action buttons",
);

assertNoForbiddenRuntimeStrings({
  files: [helperFile, panelFile, agentWorkplaneFile],
  textByFile,
});

assertNoForbiddenPathChanges();

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "selected-session-digest-ingest-contract-preview-v0-1",
});

console.log(
  JSON.stringify(
    {
      smoke: "selected-session-digest-ingest-contract-preview-v0-1",
      pass: true,
      package_script_checked: true,
      helper_behavior_checked: true,
      workbench_static_boundary_checked: true,
      overview_integration_checked: true,
      authority_boundary_checked: true,
      changed_files_checked: changedFileBoundary.checked,
      changed_files_skipped: changedFileBoundary.skipped,
      changed_files_skip_reason: changedFileBoundary.skip_reason,
      changed_files_observed: changedFileBoundary.files,
      no_unscoped_api_route_added: true,
      no_db_helper_added: true,
      no_provider_github_codex_runtime_path_added: true,
      no_mcp_plugin_tool_path_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:selected-session-digest-ingest-contract-preview-v0-1");

function assertAuthorityFalse(boundary) {
  for (const [key, value] of Object.entries(boundary)) {
    if (["read_only", "advisory_only", "derived_read_model"].includes(key)) {
      assert.equal(value, true, `${key} must be true`);
      continue;
    }
    if (key === "notes") continue;
    assert.equal(value, false, `${key} must be false`);
  }
}

function assertNoButtons(text, label) {
  assert(!text.includes("<button"), `${label} must not render buttons`);
  assert(
    !/<button[^>]*>[^<]*(Import|Write|Apply|Approve|Send|Launch|Run|Execute|Merge|Retry)/i.test(
      text,
    ),
    `${label} must not render action buttons`,
  );
}

function assertNoForbiddenRuntimeStrings({ files, textByFile }) {
  const forbiddenStrings = [
    "app/api/",
    "/api/",
    "fetch(",
    'method: "POST"',
    "method: 'POST'",
    "better-sqlite3",
    "new Database",
    '"@/lib/db"',
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
  ];
  for (const file of files) {
    const text = textByFile.get(file);
    for (const forbidden of forbiddenStrings) {
      assert(
        !text.includes(forbidden),
        `${file} must not include forbidden runtime string: ${forbidden}`,
      );
    }
  }
}

function assertNoForbiddenPathChanges() {
  const changed = collectUntrackedFiles();
  for (const file of changed) {
    if (allowedChangedFiles.includes(file)) continue;
    assert(
      !file.startsWith("app/api/"),
      `No app route may be added or changed: ${file}`,
    );
    assert(
      !/(^|\/)(db|storage|provider|providers|openai|github|mcp|plugin|plugins)(\/|$)/i.test(
        file,
      ),
      `No DB/provider/GitHub/MCP/plugin runtime path may be changed: ${file}`,
    );
  }
}
