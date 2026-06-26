#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const aggregationDocsPath = "docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_V0_1.md";
const controlsDocsPath = "docs/FEEDBACK_CONTROLS_EXPANSION_V0_1.md";
const docsPath = "docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_V0_1.md";
const helperPath =
  "lib/research-candidate-review/feedback-influenced-surfacing-preview.ts";
const panelPath = "components/feedback-influenced-surfacing-preview-panel.tsx";
const fixturePath = "fixtures/feedback-influenced-surfacing-preview.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const previewVersion = "feedback_influenced_surfacing_preview.v0.1";
const inputVersion = "feedback_influenced_surfacing_input.v0.1";
const resultVersion = "feedback_influenced_surfacing_result.v0.1";
const itemVersion = "feedback_influenced_surfacing_item.v0.1";
const fixtureVersion = "feedback_influenced_surfacing_preview.sample.v0.1";
const scope = "project:augnes";
const packageSmokeScript = "smoke:feedback-influenced-surfacing-preview-v0-1";
const packageBrowserScript = "browser:feedback-influenced-surfacing-preview-v0-1";

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Feedback Influenced Surfacing Preview is preview-only.",
  "Feedback influenced surfacing is advisory only.",
  "Surfacing preview is not authority.",
  "Feedback is not truth.",
  "Feedback is not proof.",
  "Feedback is not evidence.",
  "Feedback is not promotion readiness.",
  "Feedback influenced surfacing does not delete candidates.",
  "Feedback influenced surfacing does not hide candidates silently.",
  "Feedback influenced surfacing does not promote candidates.",
  "Feedback influenced surfacing does not mutate rules.",
  "Feedback influenced surfacing does not mutate parser behavior.",
  "Feedback influenced surfacing does not mutate durable Perspective state.",
  "Feedback influenced surfacing does not product-write.",
  "Pin/useful feedback can elevate display hint but cannot promote.",
  "Dismiss/wrong feedback can lower display hint but cannot delete.",
  "Correction/invalidation feedback creates review warning only.",
  "Needs-more-evidence creates review cue only.",
  "Scope-overreach creates rule review cue only.",
  "Rule failure candidates are review aids.",
  "Candidate overlay hints are display hints only.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "roadmap guide is not SSOT",
];

const fixtureForbiddenMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw feedback payload",
  "raw surfacing payload",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = [
  "raw surfacing preview payload blocked by fixture",
  "secret-like surfacing preview input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "feedback_write_now: true",
  "feedback_persistence_now: true",
  "candidate_mutation_now: true",
  "candidate_deletion_now: true",
  "candidate_auto_hide_now: true",
  "rule_mutation_now: true",
  "parser_mutation_now: true",
  "promotion_execution_now: true",
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "db_query_or_write_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
  "feedback_is_truth: true",
  "feedback_is_proof: true",
  "feedback_is_evidence: true",
  "feedback_is_promotion_readiness: true",
  "surfacing_preview_is_authority: true",
  "surfacing_preview_is_ranking_authority: true",
];

const indexForbiddenImplications = [
  "feedback write route was added",
  "feedback persistence was added",
  "DB write was added",
  "candidate mutation was added",
  "candidate deletion was added",
  "promotion was added",
  "rule mutation was added",
  "parser mutation was added",
  "state mutation was added",
  "proof/evidence writes were added",
  "product-write was added",
  "Git Ledger export was added",
  "provider calls were added",
  "retrieval/RAG was added",
  "source fetch was added",
];

for (const filePath of [
  roadmapPath,
  aggregationDocsPath,
  controlsDocsPath,
  docsPath,
  helperPath,
  panelPath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const aggregationDocsText = readText(aggregationDocsPath);
const controlsDocsText = readText(controlsDocsPath);
const docsText = readText(docsPath);
const helperText = readText(helperPath);
const panelText = readText(panelPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assertIncludes(
  roadmapText,
  "feedback_influenced_surfacing_preview_v0_1",
  "roadmap contains Phase 5.7 slice",
);
assertIncludes(
  aggregationDocsText,
  "Feedback Event Aggregation Runtime is advisory only.",
  aggregationDocsPath,
);
assertIncludes(
  controlsDocsText,
  "Feedback Controls Expansion is local UI intent only.",
  controlsDocsPath,
);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.preview_version, previewVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.item_version, itemVersion);
assert.equal(fixture.scope, scope);
assert.equal(
  packageJson.scripts[packageSmokeScript],
  "node scripts/smoke-feedback-influenced-surfacing-preview-v0-1.mjs",
);
assert.equal(
  packageJson.scripts[packageBrowserScript],
  "node scripts/browser-validate-feedback-influenced-surfacing-preview-v0-1.mjs",
);

assertHelperExportsAndCoverage();
assertHelperBehavior();
assertPanelStaticChecks();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();
assertAuthorityBoundaries();
assertHelperStaticBoundaries();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "feedback-influenced-surfacing-preview-v0-1",
      preview_version: previewVersion,
      items: fixture.expected_result.items.length,
      rejection_cases: Object.keys(fixture.expected_rejection_results).length,
    },
    null,
    2,
  ),
);

function assertHelperExportsAndCoverage() {
  for (const text of [
    "FEEDBACK_INFLUENCED_SURFACING_PREVIEW_VERSION",
    "FEEDBACK_INFLUENCED_SURFACING_INPUT_VERSION",
    "FEEDBACK_INFLUENCED_SURFACING_RESULT_VERSION",
    "FEEDBACK_INFLUENCED_SURFACING_ITEM_VERSION",
    "export type FeedbackInfluencedSurfacingStatus",
    "export type FeedbackInfluencedVisibilityHint",
    "export type FeedbackInfluencedPriorityPreview",
    "export type FeedbackInfluencedReviewAttentionHint",
    "export interface FeedbackInfluencedCandidateInput",
    "export interface FeedbackInfluencedSurfacingInput",
    "export interface FeedbackInfluencedSurfacingItem",
    "export interface FeedbackInfluencedSurfacingResult",
    "export interface FeedbackInfluencedSurfacingValidationResult",
    "buildFeedbackInfluencedSurfacingPreviewV01",
    "validateFeedbackInfluencedSurfacingInputV01",
    "validateFeedbackInfluencedCandidateInputV01",
    "createFeedbackInfluencedSurfacingAuthorityBoundaryV01",
    "createFeedbackInfluencedSurfacingItemIdV01",
  ]) {
    assertIncludes(helperText, text, `helper exports ${text}`);
  }

  assert.deepEqual(fixture.coverage.statuses, [
    "built",
    "empty",
    "blocked_private_or_raw_payload",
    "blocked_invalid_input",
  ]);
  assert.deepEqual(fixture.coverage.priority_previews, [
    "none",
    "lower",
    "normal",
    "elevated",
    "needs_review",
  ]);
  assert.deepEqual(fixture.coverage.visibility_hints, [
    "visible",
    "visible_with_warning",
    "lower_priority",
    "needs_review",
    "blocked_from_auto_hide",
  ]);
  assert.deepEqual(fixture.coverage.review_attention_hints, [
    "none",
    "review_suggested",
    "review_required",
    "evidence_needed",
    "rule_review_needed",
    "stale_context_review_needed",
  ]);
  assert.deepEqual(fixture.coverage.candidate_overlay_hints, [
    "none",
    "show_overlay",
    "show_with_warning",
    "separate_from_durable_graph",
  ]);
}

function assertHelperBehavior() {
  const validation = helper.validateFeedbackInfluencedSurfacingInputV01(
    fixture.expected_valid_input,
  );
  assert.equal(validation.passed, true, "expected_valid_input must validate");

  const result = helper.buildFeedbackInfluencedSurfacingPreviewV01(
    fixture.expected_valid_input,
  );
  assert.deepEqual(result, fixture.expected_result, "fixture expected_result must match helper");
  assert.deepEqual(
    helper.buildFeedbackInfluencedSurfacingPreviewV01(fixture.expected_valid_input),
    result,
    "repeated build must be deterministic",
  );

  const byRef = new Map(result.items.map((item) => [item.candidate_ref, item]));
  assert.equal(byRef.get("candidate:feedback-surfacing:visible").visibility_hint, "visible");
  assert.equal(byRef.get("candidate:feedback-surfacing:visible").surface_priority_preview, "none");
  assert.equal(
    byRef.get("candidate:feedback-surfacing:elevated").surface_priority_preview,
    "elevated",
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:lower").visibility_hint,
    "lower_priority",
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:correction").visibility_hint,
    "needs_review",
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:correction").correction_warning_hint,
    true,
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:invalidation").invalidation_warning_hint,
    true,
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:evidence").visibility_hint,
    "visible_with_warning",
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:evidence").needs_more_evidence_hint,
    true,
  );
  assert.equal(
    byRef.get("candidate:feedback-surfacing:scope").scope_overreach_hint,
    true,
  );
  assert.equal(byRef.get("candidate:feedback-surfacing:stale").stale_context_hint, true);
  assert.ok(
    [...byRef.values()].some((item) => item.rule_failure_hint === true),
    "fixture must include rule failure hint",
  );
  assert.ok(
    [...byRef.values()].some((item) => item.candidate_overlay_hint === "show_overlay"),
    "fixture must include show_overlay",
  );
  assert.ok(
    [...byRef.values()].some((item) => item.candidate_overlay_hint === "show_with_warning"),
    "fixture must include show_with_warning",
  );
  const wrongOnlyInput = JSON.parse(JSON.stringify(fixture.expected_valid_input));
  const wrongOnlyCandidate = {
    ...JSON.parse(JSON.stringify(fixture.expected_valid_input.candidates[0])),
    candidate_ref: "candidate:feedback-surfacing:wrong-only",
    target_surface: "research_candidate_review",
    target_surface_ref: "surface:surfacing:wrong-only",
    bounded_title: "Wrong-only advisory item",
    bounded_summary: "Wrong feedback lowers display hint without parser mutation.",
    source_refs: ["source-ref:feedback-surfacing:wrong-only"],
    review_record_refs: ["review-record:feedback-surfacing:wrong-only"],
    reason_codes: [
      ...fixture.expected_valid_input.reason_codes,
      "wrong_requires_review_without_parser_mutation",
    ].sort(),
  };
  wrongOnlyInput.preview_id = "feedback-surfacing-preview:fixture:wrong-only";
  wrongOnlyInput.candidates = [wrongOnlyCandidate];
  wrongOnlyInput.feedback_aggregates = [
    {
      aggregate_id: "feedback-aggregate:surfacing:wrong-only",
      target_surface: wrongOnlyCandidate.target_surface,
      target_surface_ref: wrongOnlyCandidate.target_surface_ref,
      target_candidate_ref: wrongOnlyCandidate.candidate_ref,
      feedback_event_refs: ["feedback-event:surfacing:wrong-only:001"],
      pin_count: 0,
      dismiss_count: 0,
      correct_count: 0,
      invalidate_count: 0,
      needs_more_evidence_count: 0,
      scope_overreach_count: 0,
      not_relevant_now_count: 0,
      mark_useful_count: 0,
      mark_wrong_count: 2,
      current_surface_priority_hint: "lower",
      reason_codes: ["wrong_counted", "priority_hint_lowered"],
    },
  ];
  wrongOnlyInput.rule_failure_candidates = [];
  const wrongOnlyResult = helper.buildFeedbackInfluencedSurfacingPreviewV01(wrongOnlyInput);
  assert.equal(wrongOnlyResult.status, "built");
  assert.equal(wrongOnlyResult.items[0].surface_priority_preview, "lower");
  assert.equal(wrongOnlyResult.items[0].review_attention_hint, "review_required");
  assert.equal(wrongOnlyResult.items[0].deletes_candidate, false);
  assert.equal(wrongOnlyResult.items[0].mutates_parser, false);

  assert.deepEqual(
    helper.buildFeedbackInfluencedSurfacingPreviewV01(fixture.invalid_inputs.empty),
    fixture.expected_rejection_results.empty,
  );
  assert.equal(fixture.expected_rejection_results.empty.status, "empty");
  for (const key of [
    "private_or_raw_payload",
    "secret_like_pattern",
    "public_safe_false_candidate",
    "non_string_refs",
    "forbidden_authority",
  ]) {
    assert.deepEqual(
      helper.buildFeedbackInfluencedSurfacingPreviewV01(fixture.invalid_inputs[key]),
      fixture.expected_rejection_results[key],
      `${key} rejection result must match helper`,
    );
  }
  assert.equal(
    fixture.expected_rejection_results.private_or_raw_payload.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.public_safe_false_candidate.status,
    "blocked_invalid_input",
  );
  assert.equal(
    fixture.expected_rejection_results.non_string_refs.status,
    "blocked_invalid_input",
  );
  assert.equal(
    fixture.expected_rejection_results.forbidden_authority.status,
    "blocked_invalid_input",
  );

  for (const key of [
    "negative_aggregate_count",
    "fractional_aggregate_count",
    "string_aggregate_count",
    "aggregate_product_write_true",
    "aggregate_deletes_candidate_true",
    "aggregate_promotes_candidate_true",
    "aggregate_mutates_rules_true",
    "aggregate_mutates_parser_true",
    "aggregate_mutates_durable_state_true",
    "aggregate_advisory_only_false",
    "aggregate_non_string_reason_code",
    "rule_failure_invalid_review_status",
    "rule_failure_mutates_rules_true",
  ]) {
    const rejection = helper.buildFeedbackInfluencedSurfacingPreviewV01(
      fixture.invalid_inputs[key],
    );
    assert.deepEqual(
      rejection,
      fixture.expected_rejection_results[key],
      `${key} rejection result must match helper`,
    );
    assertBlockedResult(rejection, "blocked_invalid_input", key);
  }

  const fixturePrivateReasonCodeRejection =
    helper.buildFeedbackInfluencedSurfacingPreviewV01(
      fixture.invalid_inputs.aggregate_private_reason_code,
    );
  assert.deepEqual(
    fixturePrivateReasonCodeRejection,
    fixture.expected_rejection_results.aggregate_private_reason_code,
    "aggregate_private_reason_code rejection result must match helper",
  );
  assertBlockedResult(
    fixturePrivateReasonCodeRejection,
    "blocked_private_or_raw_payload",
    "aggregate_private_reason_code",
  );

  const privatePathReasonCodeInput = JSON.parse(JSON.stringify(fixture.expected_valid_input));
  privatePathReasonCodeInput.preview_id =
    "feedback-surfacing-preview:fixture:private-path-reason-code";
  privatePathReasonCodeInput.feedback_aggregates[0].reason_codes = ["/Users/private"];
  assertBlockedResult(
    helper.buildFeedbackInfluencedSurfacingPreviewV01(privatePathReasonCodeInput),
    "blocked_private_or_raw_payload",
    "aggregate reason_codes private path",
  );
}

function assertPanelStaticChecks() {
  for (const phrase of [
    "Feedback influenced surfacing is preview-only",
    "Advisory display hints only",
    "No candidate is deleted",
    "No candidate is promoted",
    "No durable state mutation",
    "Product-write remains parked",
  ]) {
    assertIncludes(panelText, phrase, panelPath);
  }
  for (const forbidden of [
    "fetch(",
    "POST",
    "/api/",
    "localStorage",
    "sessionStorage",
    "fs",
    "Database",
    "NextResponse",
    "OpenAI",
    "provider",
    "Product write executed",
    "product_write_executed: true",
    "<button",
    "Apply",
  ]) {
    assertNotIncludes(panelText, forbidden, panelPath);
  }
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) {
    assertIncludes(docsText, phrase, docsPath);
  }
  for (const phrase of [
    "Dogfooding ingestion",
    "Runtime audit panel integration",
    "Git Ledger export",
    "Product write reentry",
    "release_readiness_matrix_v0_1",
  ]) {
    assertIncludes(docsText, phrase, docsPath);
  }
}

function assertIndexCoverage() {
  for (const path of [
    docsPath,
    helperPath,
    panelPath,
    fixturePath,
    "scripts/smoke-feedback-influenced-surfacing-preview-v0-1.mjs",
    "scripts/browser-validate-feedback-influenced-surfacing-preview-v0-1.mjs",
  ]) {
    assertIncludes(indexText, path, indexPath);
  }
  for (const phrase of [
    "preview-only",
    "advisory only",
    "Feedback is not truth",
    "Product-write remains parked by #686.",
  ]) {
    assertIncludes(indexText, phrase, indexPath);
  }
  for (const forbidden of indexForbiddenImplications) {
    assertNotIncludes(indexText, forbidden, indexPath);
  }
}

function assertFixturePrivacy() {
  const normalizedFixtureText = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.replaceAll(placeholder, ""),
    fixtureText,
  );
  for (const marker of fixtureForbiddenMarkers) {
    assertNotIncludes(normalizedFixtureText, marker, "fixture");
  }
  for (const placeholder of allowedFixturePlaceholders) {
    assertIncludes(fixtureText, placeholder, "fixture allowed placeholder");
  }
  const serializedOutputs = JSON.stringify({
    expected_result: fixture.expected_result,
    expected_rejection_results: fixture.expected_rejection_results,
  });
  for (const marker of [...fixtureForbiddenMarkers, ...allowedFixturePlaceholders]) {
    assertNotIncludes(serializedOutputs, marker, "fixture outputs");
  }
}

function assertAuthorityBoundaries() {
  assertAuthorityBoundaryFalse(
    fixture.expected_result.authority_boundary,
    "expected_result.authority_boundary",
  );
  for (const item of fixture.expected_result.items) {
    assert.equal(item.advisory_only, true, `${item.candidate_ref}.advisory_only`);
    assert.equal(item.deletes_candidate, false, `${item.candidate_ref}.deletes_candidate`);
    assert.equal(
      item.hides_candidate_silently,
      false,
      `${item.candidate_ref}.hides_candidate_silently`,
    );
    assert.equal(item.promotes_candidate, false, `${item.candidate_ref}.promotes_candidate`);
    assert.equal(item.mutates_rules, false, `${item.candidate_ref}.mutates_rules`);
    assert.equal(item.mutates_parser, false, `${item.candidate_ref}.mutates_parser`);
    assert.equal(
      item.mutates_durable_state,
      false,
      `${item.candidate_ref}.mutates_durable_state`,
    );
    assert.equal(
      item.product_write_executed,
      false,
      `${item.candidate_ref}.product_write_executed`,
    );
    assertAuthorityBoundaryFalse(item.authority_boundary, `${item.candidate_ref}.authority`);
  }
  for (const [source, label] of [
    [docsText, docsPath],
    [indexText, indexPath],
    [panelText, panelPath],
  ]) {
    for (const forbidden of forbiddenPositiveAuthorityGrants) {
      assertNotIncludes(source, forbidden, label);
    }
  }
}

function assertHelperStaticBoundaries() {
  const importLines = helperText
    .split("\n")
    .filter((line) => /^import\s/.test(line.trim()))
    .join("\n");
  for (const forbidden of [
    "node:fs",
    "Database",
    "NextResponse",
    "OpenAI",
    "provider",
    "GitHub",
  ]) {
    assertNotIncludes(importLines, forbidden, "helper imports");
  }
  assert.ok(!/fetch\s*\(/.test(helperText), `${helperPath} must not call fetch`);
}

function assertAuthorityBoundaryFalse(boundary, label) {
  const falseFields = [
    "feedback_write_now",
    "feedback_persistence_now",
    "candidate_mutation_now",
    "candidate_deletion_now",
    "candidate_auto_hide_now",
    "rule_mutation_now",
    "parser_mutation_now",
    "promotion_execution_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
    "promotion_decision_record_write_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "product_write_now",
    "product_id_allocation_now",
    "work_mutation_now",
    "db_query_or_write_now",
    "source_fetch_now",
    "local_file_read_now",
    "repository_file_read_now",
    "uploaded_file_read_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "retrieval_execution_now",
    "rag_answer_generation_now",
    "embedding_created_now",
    "vector_search_now",
    "git_ledger_export_now",
    "codex_execution_authority",
    "github_automation_authority",
    "feedback_is_truth",
    "feedback_is_proof",
    "feedback_is_evidence",
    "feedback_is_promotion_readiness",
    "surfacing_preview_is_authority",
    "surfacing_preview_is_ranking_authority",
    "product_write_authority",
  ];
  for (const field of falseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertBlockedResult(result, expectedStatus, label) {
  assert.equal(result.status, expectedStatus, `${label}.status`);
  assert.deepEqual(result.items, [], `${label}.items`);
  assertAuthorityBoundaryFalse(result.authority_boundary, `${label}.authority_boundary`);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function assertIncludes(haystack, needle, label) {
  assert.ok(haystack.includes(needle), `${label} missing required text: ${needle}`);
}

function assertNotIncludes(haystack, needle, label) {
  assert.ok(!haystack.includes(needle), `${label} unexpectedly includes: ${needle}`);
}
