import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/candidate-to-codex-handoff-draft-review.ts";
const builderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts";
const sourceDraftFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json";
const sourcePacketFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json";
const reviewFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const sourceDraftSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs";
const sourcePacketSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const geometryDigestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const basePacketSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const formationReceiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs";
const downstreamCandidateToCodexHandoffOperatorDecisionTypePath =
  "types/candidate-to-codex-handoff-operator-decision.ts";
const downstreamCandidateToCodexHandoffOperatorDecisionBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts";
const downstreamCandidateToCodexHandoffOperatorDecisionFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json";
const downstreamCandidateToCodexHandoffOperatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
const routeContractTypePath = "types/feedback-event-write-route-contract.ts";
const routeContractBuilderPath =
  "lib/research-candidate-review/feedback-event-write-route-contract.ts";
const routeContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const routeContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const uiImplementationComponentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelComponentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const uiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const listRouteContractTypePath =
  "types/feedback-event-store-list-route-contract.ts";
const listRouteContractBuilderPath =
  "lib/research-candidate-review/feedback-event-store-list-route-contract.ts";
const listRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";
const listUiImplementationComponentPath =
  "components/feedback-event-store-list-panel.tsx";
const listUiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-implementation.sample.v0.1.json";
const listUiImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";

const packageScriptName =
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1";
const packageScriptValue = `node ${smokePath}`;
const downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1",
];
const routeContractPackageScriptNames = [
  "smoke:feedback-event-write-route-contract-v0-1",
];
const uiImplementationPackageScriptNames = [
  "smoke:feedback-event-controls-ui-implementation-v0-1",
];
const listRouteContractPackageScriptNames = [
  "smoke:feedback-event-store-list-route-contract-v0-1",
];
const listRouteImplementationPackageScriptNames = [
  "smoke:feedback-event-store-list-route-implementation-v0-1",
];
const listRouteBrowserValidationPackageScriptNames = [
  "smoke:feedback-event-store-list-route-browser-validation-v0-1",
];
const listUiContractPackageScriptNames = [
  "smoke:feedback-event-store-list-ui-contract-v0-1",
];
const listUiImplementationPackageScriptNames = [
  "smoke:feedback-event-store-list-ui-implementation-v0-1",
];
const sourceDraftExpectedNextSlice =
  "candidate_to_codex_handoff_draft_review_v0_1";
const nextRecommendedSlice = "candidate_to_codex_handoff_operator_decision_v0_1";
const downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice =
  "feedback_event_store_minimal_v0_1";
const routeContractNextRecommendedSlice =
  "feedback_event_write_route_implementation_v0_1";
const expectedChangedFiles = [
  typePath,
  builderPath,
  reviewFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  sourceDraftSmokePath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  basePacketSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles = [
  downstreamCandidateToCodexHandoffOperatorDecisionTypePath,
  downstreamCandidateToCodexHandoffOperatorDecisionBuilderPath,
  downstreamCandidateToCodexHandoffOperatorDecisionFixturePath,
  downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  sourceDraftSmokePath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
];
const downstreamRouteContractRequiredChangedFiles = [
  routeContractTypePath,
  routeContractBuilderPath,
  routeContractFixturePath,
  routeContractSmokePath,
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamRouteContractAllowedChangedFiles = [
  ...downstreamRouteContractRequiredChangedFiles,
  sourceDraftSmokePath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamListUiImplementationChangedFiles = [
  listUiImplementationComponentPath,
  foldedAuditPanelComponentPath,
  listUiImplementationFixturePath,
  listUiImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  listRouteContractSmokePath,
  uiImplementationSmokePath,
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  routeContractSmokePath,
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
  smokePath,
  sourceDraftSmokePath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const requiredFindingGroups = [
  "source_draft_integrity",
  "copyable_prompt_completeness",
  "structured_handoff_completeness",
  "manual_lineage_preservation",
  "unresolved_tension_preservation",
  "source_ref_discipline",
  "authority_boundary",
  "no_execution",
  "product_write_stopline",
  "next_slice_discipline",
];
const requiredChecklistLabels = [
  "source draft fingerprint present",
  "source draft validation passed",
  "copyable prompt plain text",
  "copyable prompt forbids Codex execution",
  "copyable prompt forbids branch/PR/GitHub automation",
  "copyable prompt forbids external handoff send",
  "copyable prompt forbids provider/OpenAI",
  "copyable prompt forbids retrieval/RAG",
  "copyable prompt forbids DB/SQL/transaction",
  "copyable prompt forbids proof/evidence/work/Perspective write",
  "copyable prompt forbids product write/product IDs",
  "manual lineage preserved",
  "unresolved tensions preserved",
  "source refs preserved",
  "product-write stopline preserved",
  "next slice is operator decision, not execution",
];

for (const filePath of [
  typePath,
  builderPath,
  sourceDraftFixturePath,
  sourcePacketFixturePath,
  reviewFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  sourceDraftSmokePath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  basePacketSmokePath,
  formationReceiptSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const sourceDraftFixture = readJson(sourceDraftFixturePath);
const sourcePacketFixture = readJson(sourcePacketFixturePath);
const reviewFixture = readJson(reviewFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const sourceDraftSmoke = readFileSync(sourceDraftSmokePath, "utf8");
const sourcePacketSmoke = readFileSync(sourcePacketSmokePath, "utf8");
const foldedAuditPanelSmoke = readFileSync(foldedAuditPanelSmokePath, "utf8");
const previewBuilderSmoke = readFileSync(previewBuilderSmokePath, "utf8");
const substrateSmoke = readFileSync(substrateSmokePath, "utf8");
const geometryDigestSmoke = readFileSync(geometryDigestSmokePath, "utf8");
const basePacketSmoke = readFileSync(basePacketSmokePath, "utf8");
const formationReceiptSmoke = readFileSync(formationReceiptSmokePath, "utf8");

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertAdjacentSmokePointers();

const builderModule = await importBuilderModule();
const rebuiltReview = builderModule.buildCandidateToCodexHandoffDraftReview({
  handoffDraft: sourceDraftFixture,
  sourceUpgradedAiContextPacket: sourcePacketFixture,
  scope: "project:augnes",
  as_of:
    "fixture:research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1",
});
const rebuiltReviewAgain = builderModule.buildCandidateToCodexHandoffDraftReview({
  handoffDraft: sourceDraftFixture,
  sourceUpgradedAiContextPacket: sourcePacketFixture,
  scope: "project:augnes",
  as_of:
    "fixture:research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1",
});

assert.deepEqual(
  rebuiltReview,
  reviewFixture,
  "rebuilt Candidate-to-Codex handoff draft review must match committed fixture",
);
assert.equal(
  rebuiltReview.review_fingerprint,
  rebuiltReviewAgain.review_fingerprint,
  "review fingerprint must be stable across repeated builds",
);
assertReview(reviewFixture);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
      final_status: "pass",
      review_fingerprint: reviewFixture.review_fingerprint,
      source_handoff_draft_fingerprint:
        reviewFixture.source_handoff_draft_fingerprint,
      next_recommended_slice: reviewFixture.next_recommended_slice,
      checked_fixture_backed_review: true,
      checked_prompt_structured_lineage_boundaries: true,
      checked_no_codex_github_external_db_provider_retrieval_or_product_write: true,
      checked_product_write_stopline_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "CandidateToCodexHandoffDraftReview",
    "CandidateToCodexHandoffDraftReviewInput",
    "CandidateToCodexHandoffDraftReviewStatus",
    "CandidateToCodexHandoffDraftReviewFinding",
    "CandidateToCodexHandoffDraftReviewFindingSeverity",
    "CandidateToCodexHandoffDraftReviewChecklistItem",
    "CandidateToCodexHandoffDraftReviewAuthorityBoundary",
    "CandidateToCodexHandoffDraftReviewLineage",
    "CandidateToCodexHandoffDraftReviewValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildCandidateToCodexHandoffDraftReview",
    "validateCandidateToCodexHandoffDraftReview",
    "createCandidateToCodexHandoffDraftReviewFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "candidate_to_codex_handoff_draft_review.v0.1",
    "candidate_to_codex_handoff_draft_review_passed",
    "ready_for_human_operator_handoff_decision",
    nextRecommendedSlice,
    "blocked_before_candidate_to_codex_handoff_draft_review",
    "operator_decision_required_before_any_execution",
    "can_execute_codex",
    "can_call_github",
    "can_send_external_handoff",
    "can_execute_product_write",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type source must include ${requiredText}`);
    assert.ok(
      builderSource.includes(requiredText),
      `builder source must include ${requiredText}`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must keep runtime imports out",
  );
}

function assertReview(review) {
  assert.equal(review.review_kind, "candidate_to_codex_handoff_draft_review");
  assert.equal(review.review_version, "candidate_to_codex_handoff_draft_review.v0.1");
  assert.equal(
    review.source_handoff_draft_fingerprint,
    sourceDraftFixture.draft_fingerprint,
  );
  assert.match(review.review_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(review.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    sourceDraftFixture.next_recommended_slice,
    sourceDraftExpectedNextSlice,
  );
  assert.equal(
    review.review_status,
    "candidate_to_codex_handoff_draft_review_passed",
  );
  assert.equal(
    review.recommendation_status,
    "ready_for_human_operator_handoff_decision",
  );
  assert.equal(review.next_recommended_slice, nextRecommendedSlice);
  assert.equal(review.validation.passed, true);
  assert.deepEqual(review.validation.failure_codes, []);

  assertPromptReview(review.prompt_review);
  assertStructuredHandoffReview(review.structured_handoff_review);
  assert.equal(review.lineage_review.passed, true);
  assert.equal(review.manual_lineage_review.passed, true);
  assert.equal(review.manual_lineage_review.manual_lineage_authority_granted, false);
  assert.equal(review.unresolved_tension_review.passed, true);
  assert.equal(review.unresolved_tension_review.unresolved_tension_preserved, true);
  assert.equal(review.source_ref_review.passed, true);
  assert.equal(review.source_ref_review.source_ref_authority_granted, false);
  assert.equal(review.boundary_review.passed, true);
  assertAuthorityBoundary(review.authority_boundary);
  assert.match(review.lineage.product_write_stopline_ref, /pr:686/);
  assert.equal(review.source_summary.product_write_stopline_ref, review.lineage.product_write_stopline_ref);

  const findingGroups = review.review_findings.map((finding) => finding.finding_group).sort();
  assert.deepEqual(findingGroups, [...requiredFindingGroups].sort());
  assert.ok(
    review.review_findings.every((finding) => finding.status !== "blocked"),
    "review findings must not include blocked findings",
  );
  assert.ok(
    review.review_findings.every((finding) => finding.severity !== "blocker"),
    "review findings must not include blocker severity",
  );
  const checklistLabels = review.checklist.map((item) => item.label).sort();
  assert.deepEqual(checklistLabels, [...requiredChecklistLabels].sort());
  assert.ok(
    review.checklist.every((item) => item.passed),
    "checklist must not include failed items",
  );
}

function assertPromptReview(promptReview) {
  for (const key of [
    "prompt_is_plain_text",
    "prompt_not_markdown_fenced",
    "prompt_includes_repo",
    "prompt_includes_checkout",
    "prompt_includes_do_not_touch_path",
    "prompt_includes_source_packet_fingerprint",
    "prompt_includes_task_title",
    "prompt_includes_expected_files",
    "prompt_includes_expected_checks",
    "prompt_includes_source_refs_summary",
    "prompt_includes_unresolved_tensions_summary",
    "prompt_includes_geometry_substrate_folded_audit_summary",
    "prompt_includes_manual_lineage_summary",
    "prompt_includes_hard_boundaries",
    "prompt_includes_stop_conditions",
    "prompt_includes_final_report_requirements",
    "prompt_forbids_codex_execution",
    "prompt_forbids_branch_pr_github_automation",
    "prompt_forbids_external_handoff_send",
    "prompt_forbids_provider_openai_call",
    "prompt_forbids_source_fetch",
    "prompt_forbids_retrieval_rag_execution",
    "prompt_forbids_db_sql_transaction",
    "prompt_forbids_proof_evidence_work_perspective_write",
    "prompt_forbids_product_write_and_product_ids",
    "passed",
  ]) {
    assert.equal(promptReview[key], true, `prompt review ${key} must pass`);
  }
}

function assertStructuredHandoffReview(structuredHandoffReview) {
  for (const key of [
    "mission_brief_present",
    "implementation_intent_present",
    "source_packet_summary_present",
    "geometry_digest_summary_present",
    "agent_substrate_summary_present",
    "folded_audit_summary_present",
    "manual_lineage_summary_present",
    "selected_context_cards_present",
    "forbidden_actions_present",
    "expected_files_present",
    "expected_checks_present",
    "stop_conditions_present",
    "final_report_requirements_present",
    "no_execution_authority_granted",
    "passed",
  ]) {
    assert.equal(
      structuredHandoffReview[key],
      true,
      `structured handoff review ${key} must pass`,
    );
  }
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.preview_only, true);
  assert.equal(boundary.review_only, true);
  assert.equal(boundary.copyable_text_only, true);
  assert.equal(boundary.operator_decision_required_before_any_execution, true);
  assert.equal(boundary.operator_decision_satisfied_now, false);
  for (const forbiddenKey of [
    "source_of_truth",
    "can_execute_codex",
    "can_create_branch",
    "can_open_pr",
    "can_call_github",
    "can_send_external_handoff",
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
    "can_add_route_or_ui",
    "durable_write_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  assert.ok(
    [
      [packageScriptName],
      downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames,
      ["smoke:feedback-event-store-minimal-v0-1"],
      ["smoke:feedback-event-store-review-controls-preview-v0-1"],
      routeContractPackageScriptNames,
      ["smoke:feedback-event-write-route-implementation-v0-1"],
      ["smoke:feedback-event-write-route-browser-validation-v0-1"],
      ["smoke:feedback-event-controls-ui-contract-v0-1"],
      uiImplementationPackageScriptNames,
      ["smoke:feedback-event-controls-ui-browser-validation-v0-1"],
      listRouteContractPackageScriptNames,
      listRouteImplementationPackageScriptNames,
      listRouteBrowserValidationPackageScriptNames,
      listUiContractPackageScriptNames,
      listUiImplementationPackageScriptNames,
    ].some((allowedNames) => arraysEqual(addedScriptNames, [...allowedNames].sort())),
    "package additions must only include the Candidate-to-Codex handoff draft review smoke script or downstream operator decision smoke script",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"dependencies"\s*:/,
    "dependencies must not be added",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"devDependencies"\s*:/,
    "dev dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (feedbackEventStoreListUiImplementationSliceActive(changedFiles)) {
    assertFeedbackEventStoreListUiImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreListRouteBrowserValidationSliceActive(changedFiles)) return;
  if (feedbackEventStoreListRouteImplementationSliceActive(changedFiles)) return;
  if (feedbackEventStoreListRouteContractSliceActive(changedFiles)) {
    assertFeedbackEventStoreListRouteContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiImplementationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiContractSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteImplementationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteContractSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreReviewControlsSliceActive(changedFiles)) {
    assertFeedbackEventStoreReviewControlsChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreSliceActive(changedFiles)) {
    assertFeedbackEventStoreChangedFiles(changedFiles);
    return;
  }
  const downstreamOperatorDecisionSliceActive =
    downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const allowedChangedFiles = downstreamOperatorDecisionSliceActive
    ? downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in handoff draft review slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.doesNotMatch(changedFile, /^lib\/db(?:\.ts|\/)/, "must not change lib/db files");
    assert.doesNotMatch(changedFile, /schema\.sql$/, "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventStoreListUiImplementationSliceActive(changedFiles) {
  return downstreamListUiImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventStoreListUiImplementationChangedFiles(changedFiles) {
  for (const expectedFile of downstreamListUiImplementationChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream list UI implementation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      downstreamListUiImplementationChangedFiles.includes(changedFile),
      `unexpected changed file in downstream list UI implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    if (changedFile.startsWith("components/")) {
      assert.ok(
        [listUiImplementationComponentPath, foldedAuditPanelComponentPath].includes(
          changedFile,
        ),
        `downstream list UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventStoreListRouteContractSliceActive(changedFiles) {
  return [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
  ].every((filePath) => changedFiles.includes(filePath));
}

function feedbackEventStoreListRouteImplementationSliceActive(changedFiles) {
  return changedFiles.includes(
    "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  );
}

function feedbackEventStoreListRouteBrowserValidationSliceActive(changedFiles) {
  return changedFiles.includes(
    "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  );
}

function assertFeedbackEventStoreListRouteContractChangedFiles(changedFiles) {
  const allowedChangedFiles = [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
    sourceDraftSmokePath,
    sourcePacketSmokePath,
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    smokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream list route contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream list route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventControlsUiBrowserValidationSliceActive(changedFiles) {
  return feedbackEventControlsUiBrowserValidationChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiBrowserValidationChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventControlsUiBrowserValidationChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs") {
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
  }
}

function feedbackEventControlsUiBrowserValidationChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventControlsUiImplementationSliceActive(changedFiles) {
  return feedbackEventControlsUiImplementationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventControlsUiImplementationRequiredChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream UI implementation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      requiredChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    if (changedFile.startsWith("components/")) {
      assert.ok(
        [uiImplementationComponentPath, foldedAuditPanelComponentPath].includes(changedFile),
        `downstream UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventControlsUiImplementationRequiredChangedFiles() {
  return [
    uiImplementationComponentPath,
    foldedAuditPanelComponentPath,
    uiImplementationFixturePath,
    uiImplementationSmokePath,
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
    sourceDraftSmokePath,
    sourcePacketSmokePath,
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
  ];
}

function feedbackEventControlsUiContractSliceActive(changedFiles) {
  return feedbackEventControlsUiContractRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiContractChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventControlsUiContractRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventControlsUiContractAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream UI contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventControlsUiContractRequiredChangedFiles() {
  return [
    "types/feedback-event-controls-ui-contract.ts",
    "lib/research-candidate-review/feedback-event-controls-ui-contract.ts",
    "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
  ];
}

function feedbackEventControlsUiContractAllowedChangedFiles() {
  return [
    ...feedbackEventControlsUiContractRequiredChangedFiles(),
    sourceDraftSmokePath,
    sourcePacketSmokePath,
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function feedbackEventStoreSliceActive(changedFiles) {
  return feedbackEventStoreChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventStoreReviewControlsSliceActive(changedFiles) {
  return feedbackEventStoreReviewControlsRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventWriteRouteImplementationSliceActive(changedFiles) {
  return feedbackEventWriteRouteImplementationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles) {
  return feedbackEventWriteRouteBrowserValidationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteBrowserValidationRequiredChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream browser validation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      requiredChangedFiles.includes(changedFile),
      `unexpected changed file in downstream browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteBrowserValidationRequiredChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
    sourceDraftSmokePath,
    sourcePacketSmokePath,
    "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
  ];
}

function assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteImplementationRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventWriteRouteImplementationAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route implementation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route implementation slice: ${changedFile}`,
    );
    if (changedFile !== "app/api/research-candidate/feedback-events/route.ts") {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must only add feedback route file");
    }
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteImplementationRequiredChangedFiles() {
  return [
    "app/api/research-candidate/feedback-events/route.ts",
    "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    routeContractSmokePath,
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    downstreamCandidateToCodexHandoffOperatorDecisionSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
  ];
}

function feedbackEventWriteRouteImplementationAllowedChangedFiles() {
  return [
    ...feedbackEventWriteRouteImplementationRequiredChangedFiles(),
    sourceDraftSmokePath,
    sourcePacketSmokePath,
    foldedAuditPanelSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    geometryDigestSmokePath,
    basePacketSmokePath,
    "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
    "scripts/smoke-research-candidate-review-types-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function feedbackEventWriteRouteContractSliceActive(changedFiles) {
  return downstreamRouteContractRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteContractChangedFiles(changedFiles) {
  for (const expectedFile of downstreamRouteContractRequiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      downstreamRouteContractAllowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function assertFeedbackEventStoreReviewControlsChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventStoreReviewControlsRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventStoreReviewControlsAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream review controls file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream review controls slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
  }
}

function feedbackEventStoreReviewControlsRequiredChangedFiles() {
  return [
    "types/feedback-event-store-review-controls-preview.ts",
    "lib/research-candidate-review/feedback-event-store-review-controls-preview.ts",
    "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventStoreReviewControlsAllowedChangedFiles() {
  return [
    ...feedbackEventStoreReviewControlsRequiredChangedFiles(),
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function assertFeedbackEventStoreChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventStoreChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream feedback event store file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream feedback event store slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "lib/db/schema.sql") {
      assert.doesNotMatch(changedFile, /^lib\/db(?:\.ts|\/)/, "must not change lib/db files");
      assert.doesNotMatch(changedFile, /schema\.sql$/, "must not change schema.sql");
      assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|sql)\b/i, "must not change schema/migration/sql paths");
    }
  }
}

function feedbackEventStoreChangedFiles() {
  return [
    "types/feedback-event-store.ts",
    "lib/research-candidate-review/feedback-event-store.ts",
    "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "lib/db/schema.sql",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}
function assertNoForbiddenImplementationPatterns() {
  const scannedSources = [
    [typePath, typeSource],
    [builderPath, builderSource],
    [smokePath, stripForbiddenPatternDefinitions(smokeSource)],
  ];
  const forbiddenPatterns = [
    pattern(["from ", '"openai"']),
    pattern(["new ", "OpenAI"]),
    pattern(["fetch", "("]),
    pattern(["XMLHttpRequest"]),
    pattern(["WebSocket"]),
    pattern(["EventSource"]),
    pattern(["sendBeacon"]),
    pattern(["localStorage"]),
    pattern(["sessionStorage"]),
    pattern(["indexedDB"]),
    pattern(["document", ".", "cookie"]),
    pattern(["createServer", "("]),
    pattern(["app", ".", "listen", "("]),
    pattern(["next", " ", "dev"]),
    pattern(["api", ".", "github", ".", "com"]),
    pattern(["Octokit"]),
    pattern(["gh", " ", "pr"]),
    pattern(["git", " ", "push"]),
    pattern(["codex", " ", "exec"]),
    pattern(["codex", " ", "run"]),
    pattern(["npm", " ", "run", " ", "codex"]),
    pattern(["executeProductWrite", "("]),
    pattern(["productDbWrite", "("]),
  ];
  for (const [filePath, source] of scannedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Candidate-to-Codex handoff draft review v0.1",
    typePath,
    builderPath,
    reviewFixturePath,
    smokePath,
    packageScriptName,
    "consumes #692 handoff draft as advisory preview input",
    "prompt completeness",
    "manual lineage",
    "unresolved tensions",
    "source refs",
    "authority boundary",
    "expected checks",
    "stop conditions",
    "no Codex execution",
    "no branch/PR/GitHub automation",
    "no external handoff sending",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no DB/proof/evidence/work/Perspective durable write",
    "no product write",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const [entryName, entry] of [
    [
      "#692 draft index entry",
      extractIndexEntry("Candidate-to-Codex handoff draft Geometry/Substrate v0.1"),
    ],
    [
      "#693 review index entry",
      extractIndexEntry("Candidate-to-Codex handoff draft review v0.1"),
    ],
  ]) {
    assert.ok(
      entry.includes("no provider/OpenAI/source-fetch/retrieval/RAG execution"),
      `${entryName} must preserve retrieval/RAG boundary text`,
    );
    assert.ok(
      entry.includes("no Codex execution, no branch/PR/GitHub automation"),
      `${entryName} must preserve Codex and GitHub automation boundary text`,
    );
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Candidate-to-Codex handoff draft review/i);
    assert.match(doc, /#692 draft|#692 handoff draft/i);
    assert.match(doc, /review-only/i);
    assert.match(doc, /copyable-preview-only|copyable preview/i);
    assert.match(doc, /manual-note/i);
    assert.match(doc, /unresolved tensions/i);
    assert.match(doc, /source refs/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no branch\/PR\/GitHub automation/i);
    assert.match(doc, /no external handoff/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval|retrieval\/RAG/i);
    assert.match(doc, /no DB|DB\/SQL/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertAdjacentSmokePointers() {
  assert.match(
    smokeSource,
    new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames[0]),
    "#693 handoff draft review smoke must allow downstream operator decision package script",
  );
  assert.match(
    smokeSource,
    new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice),
    "#693 handoff draft review smoke must allow downstream operator decision next pointer",
  );
  for (const [label, source] of [
    ["#692 handoff draft", sourceDraftSmoke],
    ["#691 AI Context Packet geometry/substrate upgrade", sourcePacketSmoke],
    ["#690 folded audit panel", foldedAuditPanelSmoke],
    ["#689 preview builder", previewBuilderSmoke],
    ["#688 substrate", substrateSmoke],
    ["#687 geometry digest", geometryDigestSmoke],
    ["base AI Context Packet", basePacketSmoke],
    ["Formation Receipt", formationReceiptSmoke],
  ]) {
    assert.match(source, new RegExp(packageScriptName), `${label} smoke package pointer`);
    assert.match(source, new RegExp(nextRecommendedSlice), `${label} smoke next pointer`);
  }
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function readChangedFiles() {
  const baseRef = mergeBaseRef();
  return [
    ...readGitOutput(["diff", "--name-only", baseRef, "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "origin/main", "HEAD"]).trim() || "origin/main";
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function extractIndexEntry(heading) {
  const start = indexDoc.indexOf(`- ${heading}:`);
  assert.notEqual(start, -1, `index entry ${heading} must exist`);
  const end = indexDoc.indexOf("\n- ", start + 1);
  return (end === -1 ? indexDoc.slice(start) : indexDoc.slice(start, end)).replace(/\s+/g, " ");
}

function stripForbiddenPatternDefinitions(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("gh-pr-command"))
    .filter((line) => !line.includes("gh\\s+pr"))
    .filter((line) => !line.includes("gh pr"))
    .filter((line) => !line.includes("pattern(["))
    .join("\n");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
