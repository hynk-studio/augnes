import type { CandidateToCodexHandoffDraft } from "@/types/candidate-to-codex-handoff-draft";
import type {
  CandidateToCodexHandoffDraftReview,
  CandidateToCodexHandoffDraftReviewAuthorityBoundary,
  CandidateToCodexHandoffDraftReviewChecklistItem,
  CandidateToCodexHandoffDraftReviewFinding,
  CandidateToCodexHandoffDraftReviewInput,
  CandidateToCodexHandoffDraftReviewLineage,
  CandidateToCodexHandoffDraftReviewValidationResult,
} from "@/types/candidate-to-codex-handoff-draft-review";

type JsonRecord = Record<string, unknown>;
type ReviewSection = Record<string, boolean>;

const reviewVersion = "candidate_to_codex_handoff_draft_review.v0.1";
const sourceDraftExpectedNextSlice = "candidate_to_codex_handoff_draft_review_v0_1";
const nextRecommendedSlice = "candidate_to_codex_handoff_operator_decision_v0_1";
const blockedNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_review_recheck";

export function buildCandidateToCodexHandoffDraftReview(
  input: CandidateToCodexHandoffDraftReviewInput,
): CandidateToCodexHandoffDraftReview {
  const draft = input.handoffDraft;
  const sourceHandoffDraftRef = `${draft.draft_version}:${draft.draft_fingerprint}`;
  const sourceSummary = buildSourceSummary(input, sourceHandoffDraftRef);
  const promptReview = buildPromptReview(draft);
  const structuredHandoffReview = buildStructuredHandoffReview(draft);
  const lineage = buildLineage(draft, sourceHandoffDraftRef);
  const lineageReview = buildLineageReview(lineage);
  const manualLineageReview = buildManualLineageReview(draft, lineage);
  const authorityBoundary =
    getCandidateToCodexHandoffDraftReviewAuthorityBoundary();
  const boundaryReview = buildBoundaryReview(draft, authorityBoundary);
  const stopConditionReview = buildStopConditionReview(draft);
  const expectedChangeReview = buildExpectedChangeReview(draft);
  const expectedCheckReview = buildExpectedCheckReview(draft);
  const unresolvedTensionReview = buildUnresolvedTensionReview(draft);
  const sourceRefReview = buildSourceRefReview(draft);
  const reviewFindings = buildReviewFindings({
    draft,
    promptReview,
    structuredHandoffReview,
    lineageReview,
    manualLineageReview,
    boundaryReview,
    stopConditionReview,
    expectedChangeReview,
    expectedCheckReview,
    unresolvedTensionReview,
    sourceRefReview,
  });
  const checklist = buildChecklist({
    draft,
    promptReview,
    manualLineageReview,
    unresolvedTensionReview,
    sourceRefReview,
    boundaryReview,
  });

  const reviewPassed =
    sourceSummary.source_draft_fingerprint_present === true &&
    sourceSummary.source_draft_validation_passed === true &&
    sourceSummary.source_upgraded_ai_context_packet_matches !== false &&
    allReviewSectionsPassed([
      promptReview,
      structuredHandoffReview,
      lineageReview,
      manualLineageReview,
      boundaryReview,
      stopConditionReview,
      expectedChangeReview,
      expectedCheckReview,
      unresolvedTensionReview,
      sourceRefReview,
    ]) &&
    reviewFindings.every((finding) => finding.status !== "blocked") &&
    checklist.every((item) => item.passed);

  const review: CandidateToCodexHandoffDraftReview = {
    review_kind: "candidate_to_codex_handoff_draft_review",
    review_version: reviewVersion,
    scope: input.scope ?? draft.scope,
    as_of:
      input.as_of ??
      "fixture:research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1",
    source_handoff_draft_ref: sourceHandoffDraftRef,
    source_handoff_draft_fingerprint: draft.draft_fingerprint,
    review_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
    review_status: reviewPassed
      ? "candidate_to_codex_handoff_draft_review_passed"
      : "blocked_before_candidate_to_codex_handoff_draft_review",
    recommendation_status: reviewPassed
      ? "ready_for_human_operator_handoff_decision"
      : "blocked_before_human_operator_handoff_decision",
    next_recommended_slice: reviewPassed
      ? nextRecommendedSlice
      : blockedNextRecommendedSlice,
    source_summary: sourceSummary,
    prompt_review: promptReview,
    structured_handoff_review: structuredHandoffReview,
    lineage_review: lineageReview,
    manual_lineage_review: manualLineageReview,
    boundary_review: boundaryReview,
    stop_condition_review: stopConditionReview,
    expected_change_review: expectedChangeReview,
    expected_check_review: expectedCheckReview,
    unresolved_tension_review: unresolvedTensionReview,
    source_ref_review: sourceRefReview,
    review_findings: reviewFindings,
    checklist,
    authority_boundary: authorityBoundary,
    lineage,
    validation: { passed: true, failure_codes: [] },
  };

  review.validation = validateCandidateToCodexHandoffDraftReview(review);
  review.review_fingerprint =
    createCandidateToCodexHandoffDraftReviewFingerprint(review);
  return review;
}

export function validateCandidateToCodexHandoffDraftReview(
  review: CandidateToCodexHandoffDraftReview,
): CandidateToCodexHandoffDraftReviewValidationResult {
  const failureCodes: string[] = [];
  if (review.review_version !== reviewVersion) {
    failureCodes.push("review_version_invalid");
  }
  if (!review.source_handoff_draft_fingerprint) {
    failureCodes.push("source_handoff_draft_fingerprint_missing");
  }
  if (recordString(review.source_summary, "source_next_recommended_slice") !== sourceDraftExpectedNextSlice) {
    failureCodes.push("source_handoff_draft_next_slice_invalid");
  }
  if (review.source_summary.source_upgraded_ai_context_packet_matches === false) {
    failureCodes.push("source_upgraded_ai_context_packet_fingerprint_mismatch");
  }
  if (review.prompt_review.prompt_is_plain_text !== true) {
    failureCodes.push("prompt_not_plain_text");
  }
  if (review.prompt_review.prompt_not_markdown_fenced !== true) {
    failureCodes.push("prompt_markdown_fenced");
  }
  if (review.prompt_review.prompt_includes_manual_lineage_summary !== true) {
    failureCodes.push("prompt_missing_manual_lineage");
  }
  if (review.prompt_review.prompt_includes_unresolved_tensions_summary !== true) {
    failureCodes.push("prompt_missing_unresolved_tensions");
  }
  if (review.prompt_review.prompt_includes_hard_boundaries !== true) {
    failureCodes.push("prompt_missing_hard_boundaries");
  }
  if (review.prompt_review.prompt_forbids_codex_execution !== true) {
    failureCodes.push("prompt_allows_codex_execution");
  }
  if (review.prompt_review.prompt_forbids_branch_pr_github_automation !== true) {
    failureCodes.push("prompt_allows_branch_pr_github");
  }
  if (review.prompt_review.prompt_forbids_external_handoff_send !== true) {
    failureCodes.push("prompt_allows_external_handoff");
  }
  if (review.prompt_review.prompt_forbids_provider_openai_call !== true) {
    failureCodes.push("prompt_allows_provider_openai");
  }
  if (review.prompt_review.prompt_forbids_retrieval_rag_execution !== true) {
    failureCodes.push("prompt_allows_retrieval_rag");
  }
  if (review.prompt_review.prompt_forbids_db_sql_transaction !== true) {
    failureCodes.push("prompt_allows_db_sql_transaction");
  }
  if (review.prompt_review.prompt_forbids_product_write_and_product_ids !== true) {
    failureCodes.push("prompt_allows_product_write");
  }
  if (review.structured_handoff_review.passed !== true) {
    failureCodes.push("structured_handoff_missing");
  }
  if (review.lineage_review.passed !== true) {
    failureCodes.push("lineage_invalid");
  }
  if (review.manual_lineage_review.passed !== true) {
    failureCodes.push("manual_lineage_missing");
  }
  if (review.boundary_review.passed !== true) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (review.stop_condition_review.passed !== true) {
    failureCodes.push("stop_conditions_missing");
  }
  if (review.expected_change_review.passed !== true) {
    failureCodes.push("expected_changes_invalid");
  }
  if (review.expected_check_review.passed !== true) {
    failureCodes.push("expected_checks_invalid");
  }
  if (review.unresolved_tension_review.passed !== true) {
    failureCodes.push("unresolved_tensions_missing");
  }
  if (review.source_ref_review.passed !== true) {
    failureCodes.push("source_refs_missing");
  }
  if (
    review.review_status === "candidate_to_codex_handoff_draft_review_passed" &&
    !allReviewSectionsPassed([
      review.prompt_review,
      review.structured_handoff_review,
      review.lineage_review,
      review.manual_lineage_review,
      review.boundary_review,
      review.stop_condition_review,
      review.expected_change_review,
      review.expected_check_review,
      review.unresolved_tension_review,
      review.source_ref_review,
    ])
  ) {
    failureCodes.push("review_status_passed_with_failed_review");
  }
  if (review.review_findings.some((finding) => finding.status === "blocked")) {
    failureCodes.push("review_finding_blocked");
  }
  if (review.checklist.some((item) => !item.passed)) {
    failureCodes.push("checklist_item_failed");
  }
  if (!authorityBoundaryIsSafe(review.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (!review.lineage.product_write_stopline_ref?.includes("pr:686")) {
    failureCodes.push("product_write_stopline_missing");
  }
  if (
    review.recommendation_status !==
    "ready_for_human_operator_handoff_decision"
  ) {
    failureCodes.push("recommendation_status_invalid");
  }
  if (review.next_recommended_slice !== nextRecommendedSlice) {
    failureCodes.push("next_recommended_slice_invalid");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createCandidateToCodexHandoffDraftReviewFingerprint(
  value: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(value)))}`;
}

function buildSourceSummary(
  input: CandidateToCodexHandoffDraftReviewInput,
  sourceHandoffDraftRef: string,
): JsonRecord {
  const draft = input.handoffDraft;
  return {
    source_draft_kind: draft.draft_kind,
    source_draft_version: draft.draft_version,
    source_draft_ref: sourceHandoffDraftRef,
    source_draft_fingerprint: draft.draft_fingerprint,
    source_draft_fingerprint_present: Boolean(draft.draft_fingerprint),
    source_draft_validation_passed: draft.validation.passed,
    source_ai_context_packet_ref: draft.source_ai_context_packet_ref,
    source_ai_context_packet_fingerprint:
      draft.source_ai_context_packet_fingerprint,
    source_upgraded_ai_context_packet_fingerprint:
      input.sourceUpgradedAiContextPacket?.packet_fingerprint ?? null,
    source_upgraded_ai_context_packet_matches: input.sourceUpgradedAiContextPacket
      ? input.sourceUpgradedAiContextPacket.packet_fingerprint ===
        draft.source_ai_context_packet_fingerprint
      : true,
    source_next_recommended_slice: draft.next_recommended_slice,
    source_recommendation_status: draft.recommendation_status,
    copyable_prompt_present: typeof draft.copyable_prompt === "string" &&
      draft.copyable_prompt.length > 0,
    structured_handoff_present: Boolean(draft.structured_handoff),
    expected_changes_count: draft.expected_changes.length,
    expected_checks_count: draft.expected_checks.length,
    stop_conditions_count: draft.stop_conditions.length,
    source_ref_count: draft.source_refs.length,
    unresolved_tension_count: draft.unresolved_tensions.length,
    manual_lineage_present:
      draft.manual_lineage_summary.manual_lineage_present === true,
    product_write_stopline_ref: draft.lineage.product_write_stopline_ref,
  };
}

function buildPromptReview(draft: CandidateToCodexHandoffDraft): ReviewSection {
  const prompt = draft.copyable_prompt;
  const review = {
    prompt_is_plain_text: typeof prompt === "string" && prompt.length > 0,
    prompt_not_markdown_fenced: !/```/.test(prompt),
    prompt_includes_repo: prompt.includes("Repo: hynk-studio/augnes"),
    prompt_includes_checkout: prompt.includes("/Users/hynk/code/augnes"),
    prompt_includes_do_not_touch_path: prompt.includes(
      "/Users/hynk/Documents/augnes",
    ),
    prompt_includes_source_packet_fingerprint: prompt.includes(
      draft.source_ai_context_packet_fingerprint,
    ),
    prompt_includes_task_title: prompt.includes("Task title:"),
    prompt_includes_expected_files: prompt.includes("Expected files:"),
    prompt_includes_expected_checks: prompt.includes("Expected checks:"),
    prompt_includes_source_refs_summary: prompt.includes("Source refs summary:"),
    prompt_includes_unresolved_tensions_summary: prompt.includes(
      "Unresolved tensions summary:",
    ),
    prompt_includes_geometry_substrate_folded_audit_summary: prompt.includes(
      "Geometry/Substrate/Folded audit summary:",
    ),
    prompt_includes_manual_lineage_summary: prompt.includes(
      "Manual lineage summary:",
    ),
    prompt_includes_hard_boundaries: prompt.includes("Hard boundaries:"),
    prompt_includes_stop_conditions: prompt.includes("Stop conditions:"),
    prompt_includes_final_report_requirements: prompt.includes(
      "Final report requirements:",
    ),
    prompt_forbids_codex_execution: prompt.includes(
      "Do not execute Codex automatically from this draft.",
    ),
    prompt_forbids_branch_pr_github_automation:
      prompt.includes("Do not create branch/PR") &&
      prompt.includes("Do not call GitHub automation from this draft."),
    prompt_forbids_external_handoff_send: prompt.includes(
      "Do not send external handoff.",
    ),
    prompt_forbids_provider_openai_call: prompt.includes(
      "Do not call providers/OpenAI.",
    ),
    prompt_forbids_source_fetch: prompt.includes("Do not fetch sources."),
    prompt_forbids_retrieval_rag_execution: prompt.includes(
      "Do not run retrieval/RAG.",
    ),
    prompt_forbids_db_sql_transaction: prompt.includes(
      "Do not write DB, open DB, execute SQL, or execute transactions.",
    ),
    prompt_forbids_proof_evidence_work_perspective_write: prompt.includes(
      "Do not create proof/evidence, mutate work, or promote Perspective.",
    ),
    prompt_forbids_product_write_and_product_ids: prompt.includes(
      "Do not allocate product IDs or execute product write.",
    ),
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildStructuredHandoffReview(
  draft: CandidateToCodexHandoffDraft,
): ReviewSection {
  const handoff = draft.structured_handoff;
  const review = {
    mission_brief_present: nonEmptyString(handoff.mission_brief),
    implementation_intent_present: nonEmptyString(handoff.implementation_intent),
    source_packet_summary_present: hasKeys(handoff.source_packet_summary),
    geometry_digest_summary_present: hasKeys(handoff.geometry_digest_summary),
    agent_substrate_summary_present: hasKeys(handoff.agent_substrate_summary),
    folded_audit_summary_present: hasKeys(handoff.folded_audit_summary),
    manual_lineage_summary_present: hasKeys(handoff.manual_lineage_summary),
    selected_context_cards_present: handoff.selected_context_cards.length > 0,
    forbidden_actions_present: handoff.forbidden_actions.length > 0,
    expected_files_present: handoff.expected_files.length > 0,
    expected_checks_present: handoff.expected_checks.length > 0,
    stop_conditions_present: handoff.stop_conditions.length > 0,
    final_report_requirements_present:
      handoff.final_report_requirements.length > 0,
    no_execution_authority_granted:
      draft.authority_boundary.can_execute_codex === false &&
      handoff.forbidden_actions.includes("do not execute Codex"),
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildLineage(
  draft: CandidateToCodexHandoffDraft,
  sourceHandoffDraftRef: string,
): CandidateToCodexHandoffDraftReviewLineage {
  return {
    source_handoff_draft_ref: sourceHandoffDraftRef,
    source_handoff_draft_fingerprint: draft.draft_fingerprint,
    upgraded_ai_context_packet_ref: draft.lineage.upgraded_ai_context_packet_ref,
    upgraded_ai_context_packet_fingerprint:
      draft.lineage.upgraded_ai_context_packet_fingerprint,
    ai_context_packet_base_refs: draft.lineage.ai_context_packet_base_refs,
    manual_ai_context_packet_base_ref:
      draft.lineage.manual_ai_context_packet_base_ref,
    research_candidate_review_refs:
      draft.lineage.research_candidate_review_refs,
    manual_research_candidate_review_refs:
      draft.lineage.manual_research_candidate_review_refs,
    perspective_geometry_digest_refs:
      draft.lineage.perspective_geometry_digest_refs,
    agent_perspective_substrate_ref:
      draft.lineage.agent_perspective_substrate_ref,
    agent_perspective_substrate_preview_ref:
      draft.lineage.agent_perspective_substrate_preview_ref,
    cockpit_folded_audit_panel_ref:
      draft.lineage.cockpit_folded_audit_panel_ref,
    formation_receipt_refs: draft.lineage.formation_receipt_refs,
    manual_formation_receipt_refs:
      draft.lineage.manual_formation_receipt_refs,
    product_write_stopline_ref: draft.lineage.product_write_stopline_ref,
  };
}

function buildLineageReview(
  lineage: CandidateToCodexHandoffDraftReviewLineage,
): ReviewSection {
  const review = {
    upgraded_ai_context_packet_ref_present:
      nonEmptyString(lineage.upgraded_ai_context_packet_ref),
    upgraded_ai_context_packet_fingerprint_present: nonEmptyString(
      lineage.upgraded_ai_context_packet_fingerprint,
    ),
    ai_context_packet_base_refs_non_empty:
      lineage.ai_context_packet_base_refs.length > 0,
    manual_ai_context_packet_base_ref_non_null:
      lineage.manual_ai_context_packet_base_ref !== null &&
      lineage.manual_ai_context_packet_base_ref !== "",
    research_candidate_review_refs_non_empty:
      lineage.research_candidate_review_refs.length > 0,
    manual_research_candidate_review_refs_non_empty:
      lineage.manual_research_candidate_review_refs.length > 0,
    perspective_geometry_digest_refs_non_empty:
      lineage.perspective_geometry_digest_refs.length > 0,
    agent_perspective_substrate_ref_present: nonEmptyString(
      lineage.agent_perspective_substrate_ref,
    ),
    agent_perspective_substrate_preview_ref_present: nonEmptyString(
      lineage.agent_perspective_substrate_preview_ref,
    ),
    cockpit_folded_audit_panel_ref_present: nonEmptyString(
      lineage.cockpit_folded_audit_panel_ref,
    ),
    formation_receipt_refs_non_empty: lineage.formation_receipt_refs.length > 0,
    manual_formation_receipt_refs_non_empty:
      lineage.manual_formation_receipt_refs.length > 0,
    product_write_stopline_ref_present: nonEmptyString(
      lineage.product_write_stopline_ref,
    ),
    product_write_stopline_ref_references_686:
      lineage.product_write_stopline_ref.includes("#686") ||
      lineage.product_write_stopline_ref.includes("pr:686"),
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildManualLineageReview(
  draft: CandidateToCodexHandoffDraft,
  lineage: CandidateToCodexHandoffDraftReviewLineage,
): ReviewSection {
  const structuredText = JSON.stringify(draft.structured_handoff);
  const review = {
    manual_lineage_present: true,
    manual_packet_ref_present: nonEmptyString(
      lineage.manual_ai_context_packet_base_ref,
    ),
    manual_research_candidate_refs_present:
      lineage.manual_research_candidate_review_refs.length > 0,
    manual_formation_receipt_refs_present:
      lineage.manual_formation_receipt_refs.length > 0,
    manual_lineage_in_prompt:
      draft.copyable_prompt.includes("Manual lineage summary:") &&
      Boolean(
        lineage.manual_ai_context_packet_base_ref &&
          draft.copyable_prompt.includes(lineage.manual_ai_context_packet_base_ref),
      ),
    manual_lineage_in_structured_handoff:
      structuredText.includes("manual_lineage_present") &&
      structuredText.includes("manual_research_candidate_review_refs"),
    manual_lineage_authority_granted: false,
  };
  return {
    ...review,
    passed:
      review.manual_lineage_present === true &&
      review.manual_packet_ref_present === true &&
      review.manual_research_candidate_refs_present === true &&
      review.manual_formation_receipt_refs_present === true &&
      review.manual_lineage_in_prompt === true &&
      review.manual_lineage_in_structured_handoff === true &&
      review.manual_lineage_authority_granted === false,
  };
}

function buildBoundaryReview(
  draft: CandidateToCodexHandoffDraft,
  reviewBoundary: CandidateToCodexHandoffDraftReviewAuthorityBoundary,
): ReviewSection {
  const sourceBoundarySafe = sourceAuthorityBoundaryIsSafe(draft.authority_boundary);
  const reviewBoundarySafe = authorityBoundaryIsSafe(reviewBoundary);
  const review = {
    codex_execution_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_execute_codex === false,
    github_automation_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_call_github === false,
    branch_creation_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_create_branch === false,
    pr_creation_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_open_pr === false,
    merge_authority_not_granted: sourceBoundarySafe &&
      reviewBoundary.merge_authority === false,
    external_handoff_sending_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_send_external_handoff === false,
    db_open_not_granted: sourceBoundarySafe && reviewBoundary.can_open_db === false,
    sql_execution_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_execute_sql === false,
    transaction_execution_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_execute_transaction === false,
    provider_openai_call_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_call_providers_or_openai === false,
    source_fetch_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_fetch_sources === false,
    retrieval_rag_execution_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_run_retrieval_or_rag === false,
    proof_evidence_write_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_record_proof === false &&
      reviewBoundary.can_create_evidence === false,
    work_mutation_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_update_work === false,
    perspective_promotion_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_promote_perspective === false,
    agent_execution_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_execute_agents === false,
    agent_routing_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_route_agents === false,
    product_write_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_execute_product_write === false,
    product_id_allocation_not_granted: sourceBoundarySafe &&
      reviewBoundary.can_allocate_product_ids === false,
    review_artifact_boundary_safe: reviewBoundarySafe,
    source_draft_boundary_safe: sourceBoundarySafe,
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildStopConditionReview(
  draft: CandidateToCodexHandoffDraft,
): ReviewSection {
  const stopConditions = draft.stop_conditions.map((item) => item.condition);
  const review = Object.fromEntries(
    requiredStopConditions().map((condition) => [
      `${slug(condition)}_present`,
      includesNormalized(stopConditions, condition),
    ]),
  ) as ReviewSection;
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildExpectedChangeReview(
  draft: CandidateToCodexHandoffDraft,
): ReviewSection {
  const expectedChangesExist = draft.expected_changes.length > 0;
  const expectedFiles = draft.expected_changes.flatMap((change) => change.expected_files);
  const descriptions = draft.expected_changes.map((change) => change.description);
  const review = {
    expected_changes_exist: expectedChangesExist,
    expected_changes_do_not_include_product_write: draft.expected_changes.every(
      (change) =>
        change.product_write_related === false &&
        !/execute product write|allocate product ids/i.test(change.description),
    ),
    expected_changes_do_not_include_db_sql_schema_migration:
      !expectedFiles.some((filePath) => /schema\.sql$|^migrations\//.test(filePath)) &&
      !descriptions.some((description) => /\bDB\b|SQL|schema|migration/i.test(description)),
    expected_changes_do_not_include_route_ui:
      !expectedFiles.some((filePath) => /^app\/api\/|^components\//.test(filePath)) &&
      !descriptions.some((description) => /route|UI behavior|component/i.test(description)),
    expected_changes_point_to_future_review_or_operator_decision_slice:
      draft.expected_changes.every(
        (change) =>
          change.implementation_allowed_now === false &&
          (change.change_kind === "future_handoff_review_slice" ||
            /review|operator decision/i.test(change.description)),
      ),
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildExpectedCheckReview(
  draft: CandidateToCodexHandoffDraft,
): ReviewSection {
  const commands = draft.expected_checks.map((check) => check.command);
  const joinedCommands = commands.join("\n");
  const review = {
    expected_checks_exist: commands.length > 0,
    expected_checks_include_node_check: commands.some((command) =>
      command.includes("node --check"),
    ),
    expected_checks_include_future_review_or_operator_decision_smoke: commands.some(
      (command) =>
        command.includes(
          "npm run smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
        ) || command.includes("candidate-to-codex-handoff-operator-decision"),
    ),
    expected_checks_include_typecheck: commands.includes("npm run typecheck"),
    expected_checks_include_git_diff_check: commands.includes("git diff --check"),
    expected_checks_include_git_diff_cached_check: commands.includes(
      "git diff --cached --check",
    ),
    expected_checks_do_not_include_codex_execution:
      !/\bcodex\s+(exec|run)\b/i.test(joinedCommands),
    expected_checks_do_not_include_github_automation:
      !/\bgh\s+|github|octokit|api\.github\.com/i.test(joinedCommands),
    expected_checks_do_not_include_provider_retrieval_db_execution:
      !/openai|provider|retrieval|rag|sqlite|psql|mysql|postgres|sql\b|transaction|db:/i.test(
        joinedCommands,
      ),
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildUnresolvedTensionReview(
  draft: CandidateToCodexHandoffDraft,
): ReviewSection {
  const structuredText = JSON.stringify(draft.structured_handoff).toLowerCase();
  const unresolvedSummaries = draft.unresolved_tensions
    .map((item) => recordString(item, "summary"))
    .filter((value): value is string => Boolean(value));
  const review = {
    unresolved_tensions_exist: draft.unresolved_tensions.length > 0,
    unresolved_tensions_included_in_copyable_prompt:
      draft.copyable_prompt.includes("Unresolved tensions summary:") &&
      unresolvedSummaries.every((summary) => draft.copyable_prompt.includes(summary)),
    unresolved_tensions_included_in_structured_handoff:
      structuredText.includes("unresolved tension"),
    unresolved_tensions_not_smoothed_away_into_recommendations:
      structuredText.includes("unresolved") &&
      !/(^|[^a-z])(tension resolved|resolved tension|all tensions resolved|no unresolved tensions)/i.test(
        structuredText,
      ),
    unresolved_tension_preserved: true,
  };
  return {
    ...review,
    passed: everyTrue(review),
  };
}

function buildSourceRefReview(draft: CandidateToCodexHandoffDraft): ReviewSection {
  const review = {
    source_refs_exist: draft.source_refs.length > 0,
    source_refs_included_in_copyable_prompt_or_summarized:
      draft.copyable_prompt.includes("Source refs summary:") &&
      draft.source_refs.every((sourceRef) => draft.copyable_prompt.includes(sourceRef)),
    no_source_refs_treated_as_proof_evidence_authority:
      draft.copyable_prompt.includes("Do not treat this packet as source of truth.") &&
      draft.copyable_prompt.includes("Do not create proof/evidence") &&
      draft.authority_boundary.source_of_truth === false,
    source_ref_authority_granted: false,
  };
  return {
    ...review,
    passed:
      review.source_refs_exist === true &&
      review.source_refs_included_in_copyable_prompt_or_summarized === true &&
      review.no_source_refs_treated_as_proof_evidence_authority === true &&
      review.source_ref_authority_granted === false,
  };
}

function buildReviewFindings({
  draft,
  promptReview,
  structuredHandoffReview,
  lineageReview,
  manualLineageReview,
  boundaryReview,
  stopConditionReview,
  expectedChangeReview,
  expectedCheckReview,
  unresolvedTensionReview,
  sourceRefReview,
}: {
  draft: CandidateToCodexHandoffDraft;
  promptReview: ReviewSection;
  structuredHandoffReview: ReviewSection;
  lineageReview: ReviewSection;
  manualLineageReview: ReviewSection;
  boundaryReview: ReviewSection;
  stopConditionReview: ReviewSection;
  expectedChangeReview: ReviewSection;
  expectedCheckReview: ReviewSection;
  unresolvedTensionReview: ReviewSection;
  sourceRefReview: ReviewSection;
}): CandidateToCodexHandoffDraftReviewFinding[] {
  const findingInputs = [
    {
      group: "source_draft_integrity",
      passed:
        Boolean(draft.draft_fingerprint) &&
        draft.validation.passed === true &&
        draft.next_recommended_slice === sourceDraftExpectedNextSlice,
      message:
        "Source #692 Candidate-to-Codex handoff draft fingerprint, validation, and downstream review pointer are intact.",
    },
    {
      group: "copyable_prompt_completeness",
      passed: promptReview.passed === true,
      message:
        "Copyable prompt includes repo, checkout, boundaries, lineage, unresolved tensions, source refs, expected files, and expected checks.",
    },
    {
      group: "structured_handoff_completeness",
      passed: structuredHandoffReview.passed === true,
      message:
        "Structured handoff includes mission, context summaries, manual lineage, forbidden actions, expected files/checks, stop conditions, and final report requirements.",
    },
    {
      group: "manual_lineage_preservation",
      passed: lineageReview.passed === true && manualLineageReview.passed === true,
      message:
        "Static/base and manual-note packet, review, and Formation Receipt lineage are preserved without authority promotion.",
    },
    {
      group: "unresolved_tension_preservation",
      passed: unresolvedTensionReview.passed === true,
      message:
        "Unresolved tensions remain explicit in the prompt and structured handoff review.",
    },
    {
      group: "source_ref_discipline",
      passed: sourceRefReview.passed === true,
      message:
        "Source refs remain preserved as advisory refs and are not treated as proof/evidence authority.",
    },
    {
      group: "authority_boundary",
      passed: boundaryReview.passed === true,
      message:
        "Review and source draft boundaries grant no execution, write, mutation, durable state, route/UI, or external service authority.",
    },
    {
      group: "no_execution",
      passed:
        promptReview.prompt_forbids_codex_execution === true &&
        promptReview.prompt_forbids_branch_pr_github_automation === true &&
        expectedCheckReview.expected_checks_do_not_include_codex_execution === true &&
        expectedCheckReview.expected_checks_do_not_include_github_automation === true,
      message:
        "Review artifact remains non-executing and contains no Codex, branch/PR, or GitHub automation authority.",
    },
    {
      group: "product_write_stopline",
      passed:
        lineageReview.product_write_stopline_ref_references_686 === true &&
        expectedChangeReview.expected_changes_do_not_include_product_write === true,
      message: "Product-write lane remains parked by #686.",
    },
    {
      group: "next_slice_discipline",
      passed:
        stopConditionReview.passed === true &&
        expectedChangeReview.passed === true &&
        expectedCheckReview.passed === true,
      message:
        "Next slice remains a human operator handoff decision, not execution approval.",
    },
  ] as const;

  return findingInputs.map((input, index) => ({
    finding_id: `candidate_to_codex_handoff_draft_review_finding_${String(index + 1).padStart(2, "0")}`,
    finding_group: input.group,
    severity: input.passed ? "notice" : "blocker",
    status: input.passed ? "passed" : "blocked",
    message: input.message,
    source_refs: uniqueSorted([
      draft.source_ai_context_packet_ref,
      draft.draft_fingerprint,
      ...draft.source_refs,
    ]),
    authority_boundary_notes: [
      "Finding is review-only and grants no Codex, GitHub, external handoff, provider, retrieval, DB, proof/evidence, work, Perspective, agent, or product-write authority.",
    ],
  }));
}

function buildChecklist({
  draft,
  promptReview,
  manualLineageReview,
  unresolvedTensionReview,
  sourceRefReview,
  boundaryReview,
}: {
  draft: CandidateToCodexHandoffDraft;
  promptReview: ReviewSection;
  manualLineageReview: ReviewSection;
  unresolvedTensionReview: ReviewSection;
  sourceRefReview: ReviewSection;
  boundaryReview: ReviewSection;
}): CandidateToCodexHandoffDraftReviewChecklistItem[] {
  const checklistInputs = [
    ["source draft fingerprint present", Boolean(draft.draft_fingerprint)],
    ["source draft validation passed", draft.validation.passed === true],
    ["copyable prompt plain text", promptReview.prompt_is_plain_text === true],
    [
      "copyable prompt forbids Codex execution",
      promptReview.prompt_forbids_codex_execution === true,
    ],
    [
      "copyable prompt forbids branch/PR/GitHub automation",
      promptReview.prompt_forbids_branch_pr_github_automation === true,
    ],
    [
      "copyable prompt forbids external handoff send",
      promptReview.prompt_forbids_external_handoff_send === true,
    ],
    [
      "copyable prompt forbids provider/OpenAI",
      promptReview.prompt_forbids_provider_openai_call === true,
    ],
    [
      "copyable prompt forbids retrieval/RAG",
      promptReview.prompt_forbids_retrieval_rag_execution === true,
    ],
    [
      "copyable prompt forbids DB/SQL/transaction",
      promptReview.prompt_forbids_db_sql_transaction === true,
    ],
    [
      "copyable prompt forbids proof/evidence/work/Perspective write",
      promptReview.prompt_forbids_proof_evidence_work_perspective_write === true,
    ],
    [
      "copyable prompt forbids product write/product IDs",
      promptReview.prompt_forbids_product_write_and_product_ids === true,
    ],
    ["manual lineage preserved", manualLineageReview.passed === true],
    [
      "unresolved tensions preserved",
      unresolvedTensionReview.unresolved_tension_preserved === true &&
        unresolvedTensionReview.passed === true,
    ],
    ["source refs preserved", sourceRefReview.passed === true],
    [
      "product-write stopline preserved",
      draft.lineage.product_write_stopline_ref.includes("pr:686"),
    ],
    [
      "next slice is operator decision, not execution",
      boundaryReview.passed === true &&
        draft.next_recommended_slice === sourceDraftExpectedNextSlice,
    ],
  ] as const;

  return checklistInputs.map(([label, passed], index) => ({
    checklist_item_id: `candidate_to_codex_handoff_draft_review_check_${String(index + 1).padStart(2, "0")}`,
    label,
    passed,
    source_refs: [draft.draft_fingerprint],
    authority_boundary_notes: [
      "Checklist is deterministic review output only and grants no execution or durable authority.",
    ],
  }));
}

function getCandidateToCodexHandoffDraftReviewAuthorityBoundary(): CandidateToCodexHandoffDraftReviewAuthorityBoundary {
  return {
    preview_only: true,
    review_only: true,
    copyable_text_only: true,
    source_of_truth: false,
    can_execute_codex: false,
    can_create_branch: false,
    can_open_pr: false,
    can_call_github: false,
    can_send_external_handoff: false,
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_create_work_item: false,
    can_execute_agents: false,
    can_route_agents: false,
    can_call_external_services: false,
    can_call_providers_or_openai: false,
    can_run_retrieval_or_rag: false,
    can_fetch_sources: false,
    can_promote_perspective: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    can_open_db: false,
    can_execute_sql: false,
    can_execute_transaction: false,
    can_add_route_or_ui: false,
    durable_write_authority: false,
    merge_authority: false,
    operator_decision_required_before_any_execution: true,
    operator_decision_satisfied_now: false,
  };
}

function allReviewSectionsPassed(sections: ReviewSection[]): boolean {
  return sections.every((sectionValue) => sectionValue.passed === true);
}

function everyTrue(values: Record<string, boolean>): boolean {
  return Object.values(values).every((value) => value === true);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function hasKeys(value: unknown): boolean {
  return Boolean(value && typeof value === "object" && Object.keys(value).length > 0);
}

function includesNormalized(values: string[], expected: string): boolean {
  const normalizedExpected = normalize(expected);
  return values.some((value) => normalize(value) === normalizedExpected);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function requiredStopConditions(): string[] {
  return [
    "source packet validation fails",
    "missing source refs without source coverage boundary note",
    "unresolved tension omitted from prompt",
    "manual lineage omitted",
    "GeometryDigest treated as authority",
    "Agent Substrate treated as authority",
    "retrieval execution requested",
    "provider/OpenAI call requested",
    "Codex execution requested by this draft",
    "branch/PR/GitHub automation requested by this draft",
    "DB/SQL/transaction requested",
    "proof/evidence/write mutation requested",
    "Perspective promotion requested",
    "product write/product ID allocation requested",
    "external handoff send requested",
  ];
}

function authorityBoundaryIsSafe(
  boundary: CandidateToCodexHandoffDraftReviewAuthorityBoundary,
): boolean {
  if (
    !boundary ||
    boundary.preview_only !== true ||
    boundary.review_only !== true ||
    boundary.copyable_text_only !== true ||
    boundary.operator_decision_required_before_any_execution !== true ||
    boundary.operator_decision_satisfied_now !== false
  ) {
    return false;
  }
  return forbiddenCapabilityKeys().every((key) => boundary[key] === false);
}

function sourceAuthorityBoundaryIsSafe(
  boundary: CandidateToCodexHandoffDraft["authority_boundary"],
): boolean {
  if (!boundary || boundary.preview_only !== true || boundary.copyable_text_only !== true) {
    return false;
  }
  return forbiddenCapabilityKeys().every((key) => {
    if (!(key in boundary)) return true;
    return boundary[key as keyof typeof boundary] === false;
  });
}

function forbiddenCapabilityKeys(): Array<
  keyof CandidateToCodexHandoffDraftReviewAuthorityBoundary
> {
  return [
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
  ];
}

function recordString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const nestedValue = (value as JsonRecord)[key];
  return typeof nestedValue === "string" ? nestedValue : undefined;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripGeneratedFields);
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "review_fingerprint")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
  );
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
