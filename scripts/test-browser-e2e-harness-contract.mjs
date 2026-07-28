#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./browser-validate-vnext-native-host-result-v0-1.mjs", import.meta.url),
  "utf8",
);
const resultStart = source.indexOf("const result = {");
const resultEnd = source.indexOf("\n};", resultStart);
assert(resultStart >= 0 && resultEnd > resultStart);
const resultKeys = [...source.slice(resultStart, resultEnd).matchAll(/^  ([a-z0-9_]+):/gmu)]
  .map((match) => match[1]);
const recordNames = [...source.matchAll(/record\("([^"]+)"\)/gu)]
  .map((match) => match[1]);
assert.equal(resultKeys.length, new Set(resultKeys).size);
assert.equal(recordNames.length, new Set(recordNames).size);
assert.equal(resultKeys.length, 191);
assert.equal(recordNames.length, 99);
assert.equal(
  hashInventory(resultKeys),
  "78b2f07117876bbbe86c45755fa746acab7352bc13120c9f8990231fa8daea1b",
);
assert.equal(
  hashInventory(recordNames),
  "ea74434806ffb6a3d7adb72756433716acfd89cee8715c2d010db9f202bc4605",
);
for (const marker of [
  "mixed_return_target_captured_from_exact_mutated_proposal",
  "generic_validation_proposal_excluded_as_return_target",
  "mixed_applied_candidate_survives_session_restart",
  "mixed_unapplied_candidate_loses_current_session_actionability",
  "mixed_prior_session_decision_remains_visible",
  "mixed_return_relationships_rebuilt_without_positive_leak",
  "positive_and_mixed_projects_remain_isolated",
  "guidebrief_same_candidate_material_change_clears_stale_answer",
  "guidebrief_relationship_answer_matches_pc3_highlight",
  "guidebrief_decision_preparation_has_zero_submit_and_zero_network",
  "guidebrief_current_action_focus_does_not_activate_owner",
  "guidebrief_candidate_selection_current_action_focus_only",
  "guidebrief_advanced_review_uses_existing_disclosure_owner",
  "guidebrief_partial_utterance_does_not_invoke_supported_owner",
  "guidebrief_unsupported_mutation_command_is_refused",
  "guidebrief_unavailable_relationship_question_is_refused",
  "guidebrief_relationship_selection_reuses_pc3_owner",
  "guidebrief_transition_preview_one_get_zero_post",
  "guidebrief_transition_preview_duplicate_activation_executes_once",
  "guidebrief_host_single_flight_survives_snapshot_change",
  "guidebrief_pre_preview_current_action_focus_only",
  "guidebrief_post_preview_current_action_focuses_owner_prerequisite",
  "guidebrief_post_confirmation_current_action_focus_only",
  "guidebrief_inspector_uses_registered_exact_destination_only",
  "guidebrief_next_candidate_selection_reuses_pc2_owner",
]) {
  assert.equal(source.includes(`record("${marker}")`), true);
}
assert.match(
  source,
  /async function runPhase\(phase, action, options = \{\}\)[\s\S]*options\.terminalRequestQuiet !== false/u,
);
assert.match(
  source,
  /runPhase\("retired_routes"[\s\S]*terminalRequestQuiet: false,[\s\S]*quietProof:/u,
);
const finalQuiet = source.indexOf('timing.milestone("final global request quiet observed")');
const globalAudit = source.indexOf("const isExpectedImportedDestinationSessionRefusal");
assert(finalQuiet >= 0 && finalQuiet < globalAudit);
assert.equal(source.includes("AUGNES_BROWSER_E2E_RUNTIME_MODE"), false);
assert.match(
  source,
  /const runtimeReadiness = waitForHttp[\s\S]*const chromeReadiness = \(async \(\) =>[\s\S]*await Promise\.all\(\[runtimeReadiness, chromeReadiness\]\)/u,
);
assert.equal(
  [...source.matchAll(/startDevServer\(runtimeEnvironment\)/gu)].length,
  3,
);
assert.equal(
  [...source.matchAll(/startDevServer\(positiveRuntimeEnvironment\)/gu)]
    .length,
  1,
);
assert.match(source, /const DEFAULT_TIMEOUT_MS = 45_000;/u);
assert.match(
  source,
  /"paused project automation before retained restart"[\s\S]*await navigate\("about:blank"\)[\s\S]*startDevServer\(runtimeEnvironment\);[\s\S]*await waitForHttp\(`\$\{appOrigin\}\/`, DEFAULT_TIMEOUT_MS\);[\s\S]*timing\.milestone\("retained runtime ready within 45 second bound"\);[\s\S]*"project and control persistence after retained restart"[\s\S]*result\.project_automation_restart_persisted = true;[\s\S]*result\.minimum_project_home_restart_root_resolution = true;[\s\S]*result\.project_controls_restart_persisted = true;[\s\S]*"resumed project automation after retained restart"[\s\S]*"same destination after retained restart"[\s\S]*result\.folder_onboarding_restart_reopen = true;/u,
);
assert.match(
  source,
  /await validateBlankStateViewports\(true, \{[\s\S]*state: "viewed-inactive-project"[\s\S]*attentionCategory: "project_activation"[\s\S]*\}\);[\s\S]*"explicit first-project activation ready"[\s\S]*const activationResponseStart/u,
);
assert.equal(
  [...source.matchAll(/await validateProductShell\(\{/gu)].length,
  6,
);
assert.match(
  source,
  /route: "\/projects"[\s\S]*expectedPrimaryZone: "blank-state"[\s\S]*expectedUtilityContext: null/u,
);
assert.match(
  source,
  /route: "\/workbench\/inspector\?target=run_receipt"[\s\S]*expectedPrimaryZone: "ai-workplane"/u,
);
assert.match(
  source,
  /route: "\/portability"[\s\S]*expectedPrimaryZone: null[\s\S]*expectedUtilityContext: null/u,
);
assert.match(
  source,
  /async function validateProductShellResponsive[\s\S]*for \(const width of \[390, 430\]\)[\s\S]*document_horizontal_overflow: false[\s\S]*primary_link_count: 2[\s\S]*project_tools_count: 0/u,
);
for (const state of [
  "no-project-onboarding",
  "ready-to-continue",
  "viewed-inactive-project",
  "project-root-recovery",
  "genuine-human-attention",
  "normal-work-in-progress",
  "trusted-result-ready",
]) {
  assert.match(source, new RegExp(`state: "${state}"`, "u"));
}
assert.match(
  source,
  /async function validateBlankStateViewports[\s\S]*for \(const width of \[390, 430, 1280, 1440\]\)[\s\S]*highlighted_item_count[\s\S]*human_attention_count[\s\S]*legacy_competing_regions_absent[\s\S]*protocol_vocabulary_absent/u,
);
assert.match(
  source,
  /async function openGuideBriefConversationAndAnswerSuggestedQuestion[\s\S]*guidebrief_conversation_plan\.v0\.1[\s\S]*one active GuideBrief conversation answer/u,
);
assert.match(
  source,
  /async function validateBlankStateViewports[\s\S]*for \(const width of \[390, 430, 1280, 1440\]\)[\s\S]*conversation_suggestion_count[\s\S]*conversation_answer_count[\s\S]*conversation_controls_minimum_size[\s\S]*conversation_no_duplicate_timeline_or_relationship[\s\S]*GuideBrief conversation reload clears ephemeral turns/u,
);
assert.match(
  source,
  /async function validateSemanticReviewViewports[\s\S]*for \(const width of \[390, 430, 768, 1440\]\)[\s\S]*conversation_after_relationship[\s\S]*conversation_before_advanced[\s\S]*conversation_no_duplicate_timeline_or_relationship[\s\S]*conversation_secondary/u,
);
assert.match(
  source,
  /GuideBrief conversation resets immediately for an explicitly viewed project[\s\S]*GuideBrief conversation resets immediately for a different exact candidate scope/u,
);
assert.match(
  source,
  /PC4 visible relationship answer must use the PC3-highlighted connection[\s\S]*GuideBrief conversation clears an answer when same-candidate current material changes/u,
);
assert.match(
  source,
  /async function validateManagementSafetyKeyboardNavigation[\s\S]*details\[data-management-safety\][\s\S]*keyboard-opened Manage and protect[\s\S]*"\/projects#project-management"[\s\S]*visible project-management section/u,
);
assert.match(
  source,
  /data-portability-primary-action="export"[\s\S]*Export current project[\s\S]*portable active-project preview with Personal Perspective excluded[\s\S]*data-portability-primary-action="import"[\s\S]*clean-destination local import control/u,
);
assert.match(
  source,
  /data-recovery-mode="normal"[\s\S]*data-recovery-primary-action[\s\S]*Advanced diagnostics/u,
);
assert.match(
  source,
  /recoveryClassification[\s\S]*Compatibility needs review[\s\S]*Current safety state unavailable[\s\S]*authoritative_recovery_refusal_preserves_confirmed_controls[\s\S]*status-unknown recovery action lock[\s\S]*late acceptance lock must prevent a second mutation POST[\s\S]*failed explicit refresh preserves recovery action lock[\s\S]*successful explicit refresh clears recovery action lock[\s\S]*outcome: "retry_scheduled"[\s\S]*outcome: "restore_scheduled"[\s\S]*must be accepted exactly once/u,
);
assert.match(
  source,
  /data-guide-brief-version="guide_brief\.v0\.2"[\s\S]*data-ai-workplane-guide="guide_brief\.v0\.2"/u,
);
assert.match(
  source,
  /guide_brief_cross_surface_consistency = true/u,
);
assert.match(
  source,
  /guideAfterImpactCount, guideBeforeImpact\.count[\s\S]*guideAfterConfirmationCount, guideBeforeImpact\.count[\s\S]*guideAfterApplication\.count,[\s\S]*guideBeforeImpact\.count \+ 1/u,
);
const continuityScopeStart = source.indexOf(
  "if (RUN_CONTINUITY_SCOPE || RUN_CORE_SCOPE)",
);
const multiCandidateTransitionPhase = source.indexOf(
  'runPhase("multi_candidate_transition_scope"',
);
const exactBindingRecord = source.indexOf(
  'record("ai_workplane_home_binds_completion_to_exact_proposal_and_candidate")',
);
const personalPerspectivePhase = source.indexOf(
  'runPhase("personal_perspective_inspector"',
);
assert(
  continuityScopeStart >= 0 &&
    multiCandidateTransitionPhase > continuityScopeStart,
);
assert.equal(
  [...source.matchAll(/runPhase\("multi_candidate_transition_scope"/gu)]
    .length,
  1,
);
assert(
  continuityScopeStart >= 0 &&
    personalPerspectivePhase > continuityScopeStart,
);
assert.equal(
  [...source.matchAll(/runPhase\("personal_perspective_inspector"/gu)]
    .length,
  1,
);
assert.match(
  source,
  /isExpectedSyntheticSessionRefusal[\s\S]*entry\.phase === "synthetic_session_bootstrap"[\s\S]*entry\.path === "\/api\/vnext\/operator\/session"[\s\S]*response\.method === "GET"[\s\S]*response\.status === 401/u,
);
assert.match(
  source,
  /createExpectedRefusalAccounting,[\s\S]*unexpectedConsoleErrorsForExpectedRefusals,[\s\S]*from "\.\/browser-expected-refusal-accounting\.mjs"/u,
);
assert.equal(
  [...source.matchAll(/registerExpectedSessionRefusal\(\{/gu)].length,
  3,
);
assert.match(
  source,
  /const mixedSessionLogout = await evaluateJson[\s\S]*action: 'logout'[\s\S]*mixedSessionLogout\.body\.status, "revoked"[\s\S]*tokenId: POSITIVE_LOCKED_SESSION_REFUSAL_TOKEN,[\s\S]*status: 401/u,
);
assert.match(
  source,
  /tokenId: STALE_MIXED_SESSION_REFUSAL_TOKEN,[\s\S]*status: 403,[\s\S]*await waitForExpectedRefusalSettlement\([\s\S]*STALE_MIXED_SESSION_REFUSAL_TOKEN/u,
);
assert.match(
  source,
  /typeof logEntry\?\.networkRequestId === "string"[\s\S]*log_network_request_id: logNetworkRequestId/u,
);
assert.match(
  source,
  /isRelevantNetworkError =[\s\S]*Network\.responseReceived[\s\S]*response\?\.status[\s\S]*expectedRefusalAccountingPhases\.has\(currentPhase\)/u,
);
assert.match(
  source,
  /async function waitForExpectedRefusalSettlement[\s\S]*expectedRefusalAccounting\.assertHealthy\(\)[\s\S]*lastObserverActivityAt >= REQUEST_QUIET_MS[\s\S]*expectedRefusalAccounting\.isSettled\(tokenId\)/u,
);
assert.match(
  source,
  /expectedRefusalAccounting\.finalize\(\)[\s\S]*staleRefusal\.refusal\.response_count, 1[\s\S]*staleRefusal\.chrome_log\.expected_count, 1/u,
);
assert.match(
  source,
  /expectedRecoveryRequestIds = new Set[\s\S]*expectedRecoveryRequestIds\.has\(request\.request_id\)[\s\S]*sessionMutationAction\(request\) === "bootstrap"[\s\S]*expectedHarnessMutations = new Set/u,
);
assert.match(
  source,
  /expectedFixtureLogoutRequests = RUN_CORE_SCOPE[\s\S]*sessionMutationAction\(request\) === "logout"[\s\S]*expectedFixtureLogoutRequests\.length, RUN_CORE_SCOPE \? 1 : 0/u,
);
assert.match(
  source,
  /const positiveLaterFeedbackRequestStart = requests\.length[\s\S]*positiveLaterFeedbackRequests\.length, 1[\s\S]*action: "record_context_use_review"[\s\S]*later_run_receipt_id: positiveLaterReceipt\.receipt_id[\s\S]*actually_used: "yes"[\s\S]*assessment: "helpful"[\s\S]*expectedPositiveContextUseReviewRequestId =[\s\S]*positiveLaterFeedbackRequest\.request_id/u,
);
assert.match(
  source,
  /expectedPositiveContextUseReviewRequests = RUN_CORE_SCOPE[\s\S]*request\.request_id ===[\s\S]*expectedPositiveContextUseReviewRequestId[\s\S]*requestJsonBody\(request\)\?\.action ===[\s\S]*"record_context_use_review"[\s\S]*expectedHarnessMutations = new Set/u,
);
assert.match(
  source,
  /unexpectedConsoleErrorsForExpectedRefusals\(\{[\s\S]*rawConsoleErrors: consoleErrors,[\s\S]*accounting: expectedRefusalAccounting[\s\S]*assert\.deepEqual\(unexpectedConsoleErrors, \[\]\)/u,
);
for (const marker of [
  "expected_refusal_accounting_tracks_exact_request_identity",
  "stale_session_refusal_recovers_as_separate_authenticated_request",
  "raw_console_events_preserved_for_global_audit",
]) {
  assert.equal(source.includes(`record("${marker}")`), true);
}
assert.doesNotMatch(
  source,
  /entry\.path === "\/api\/vnext\/operator\/session"[\s\S]{0,240}\/403/u,
);
assert.match(
  source,
  /VALIDATION_SCOPE === "core"[\s\S]*result\.multi_candidate_transition_scope, true[\s\S]*result\.exact_ready_to_complete_navigation, false[\s\S]*result\.personal_perspective_shared_inspector_exact, false[\s\S]*VALIDATION_SCOPE === "continuity"[\s\S]*result\.multi_candidate_transition_scope, true[\s\S]*result\.exact_ready_to_complete_navigation, true[\s\S]*result\.personal_perspective_shared_inspector_exact, true/u,
);
assert(continuityScopeStart >= 0 && exactBindingRecord > continuityScopeStart);
assert.match(
  source,
  /seedExactBindingBrowserProposals[\s\S]*entry\.entry_kind === "accepted_state_ref"[\s\S]*entry\.entry_kind === "memory_ref"[\s\S]*exact-binding non-Personal-Perspective accepted-state packet fixture missing/u,
);
assert.equal(
  [
    ...source.matchAll(
      /record\("ai_workplane_home_binds_completion_to_exact_proposal_and_candidate"\)/gu,
    ),
  ].length,
  1,
);
assert.match(
  source,
  /async function validateManagementSafetyKeyboardNavigation[\s\S]*dispatchKeyboardKey\(" ", "Space", 32\)[\s\S]*dispatchKeyboardKey\("Tab"[\s\S]*dispatchKeyboardKey\("Enter"[\s\S]*visible project-management section/u,
);
assert.match(
  source,
  /async function validateRecoveryCorrectionViewports[\s\S]*for \(const width of \[390, 430\]\)[\s\S]*horizontal_overflow: false[\s\S]*refresh_enabled: true[\s\S]*alert_count: 0/u,
);
assert.match(
  source,
  /async function captureC8ReviewState[\s\S]*for \(const width of \[390, 1440\]\)[\s\S]*primary_action_within_first_scroll[\s\S]*overlapping_control_count[\s\S]*state_badge_count[\s\S]*raw_record_precedes_situation_or_action[\s\S]*risk_has_text/u,
);
assert.match(
  source,
  /async function waitForResponsiveSurface[\s\S]*window\.innerWidth[\s\S]*rect\.left >= -1[\s\S]*rect\.right <= window\.innerWidth \+ 1[\s\S]*documentElement\.scrollWidth <=[\s\S]*documentElement\.clientWidth \+ 1/u,
);
for (const functionName of [
  "validateBlankStateViewports",
  "validateWorkbenchResultViewports",
  "validateDelegatedWorkViewports",
  "validateSharedInspectorViewports",
  "validateSemanticReviewViewports",
  "captureC8ReviewState",
]) {
  const start = source.indexOf(`async function ${functionName}`);
  const end = source.indexOf("\nasync function ", start + 1);
  assert(start >= 0 && end > start);
  assert.equal(source.slice(start, end).includes("await delay(100)"), false);
}
assert.match(
  source,
  /AUGNES_C8_CAPTURE_REVIEW[\s\S]*\.augnes-local-verification[\s\S]*c8-review[\s\S]*augnes\.c8-local-visual-review\.v1[\s\S]*human_review_required: true/u,
);
assert.match(
  source,
  /state: "action-needed-inactive-project"[\s\S]*state: "returning-current-project"[\s\S]*state: "active-work-needs-access"[\s\S]*state: "returned-result"[\s\S]*state: "exact-run-detail"[\s\S]*state: "returned-result-decision"[\s\S]*state: "outcome-unknown-risk"/u,
);
assert.match(
  source,
  /const delegationInteractionCount = 1;[\s\S]*delegationInteractionCount <= 3[\s\S]*data-vnext-default-decision-path-interactions="2"[\s\S]*const resultToDecisionInteractionCount = 2;[\s\S]*resultToDecisionInteractionCount <= 2/u,
);
assert.match(
  source,
  /data-delegated-work-stage="working"[\s\S]*active delegated work without fabricated primary action[\s\S]*data-augnes-primary-action[\s\S]*0,/u,
);
assert.match(
  source,
  /\['change_decision', 'change_applied'\]\.includes\(state[\s\S]*data-ai-workplane-primary-action[\s\S]*AI Workplane settled after project application/u,
);
assert.match(
  source,
  /const actionOwner = review\?\.getAttribute\('data-selected-work-primary-action-owner'\)[\s\S]*const primaryActionRequired =[\s\S]*actionOwner === 'decision'[\s\S]*actionOwner === 'transition'[\s\S]*actionOwner === 'candidate_selection'[\s\S]*metrics\.primary_action_count,[\s\S]*metrics\.primary_action_required \? 1 : 0/u,
);
assert.match(
  source,
  /async function waitForHttp[\s\S]*const waitNumber = waitCount;[\s\S]*String\(waitNumber\)/u,
);
assert.match(
  source,
  /validateExactLaterOutcomeV01 = async \(\) => \{[\s\S]*recording later use of an exact older packet must not replace the newer compiled-packet projection[\s\S]*an older packet-bound receipt must not become latest continuity[\s\S]*record\("older_packet_bound_later_result_is_not_latest_continuity"\)[\s\S]*vnext_bounded_automation_context_compiler\.v0\.1[\s\S]*record\("bounded_automation_packet_excluded_from_workbench_lineage"\)[\s\S]*positive-lineage project confirmation must remain explicit[\s\S]*buildSemanticReviewLoopTaskContextPacketFixture[\s\S]*buildSemanticReviewLoopRunReceiptFixture[\s\S]*buildSemanticReviewLoopProposalFixture[\s\S]*admitStructuredRunReceiptV01[\s\S]*record\("positive_generic_prior_packet_seeded"\)[\s\S]*record\("positive_bootstrap_proposal_admitted"\)[\s\S]*AUGNES_VNEXT_OPERATOR_PROJECT_ID: positiveProjectId[\s\S]*positive bootstrap detail failed[\s\S]*positive bootstrap decision failed[\s\S]*positive bootstrap confirmation failed[\s\S]*prior_packet_id: positivePriorPacket\.packet_id[\s\S]*positive bootstrap application failed[\s\S]*positiveApplyResponse\.body\.packet_compiled, true[\s\S]*vnext_persisted_semantic_context_compiler\.v0\.1[\s\S]*vnext_bounded_automation_context_compiler\.v0\.1[\s\S]*record\("positive_transition_compiled_eligible_packet"\)[\s\S]*positiveLineage\.overall_status, "packet_compiled"[\s\S]*positiveChains\.length,[\s\S]*1,[\s\S]*positiveContinuityBeforeLater\.packet_currentness,[\s\S]*"fresh"[\s\S]*record\("positive_latest_compiled_packet_precondition_passed"\)[\s\S]*record\("positive_proposal_has_one_packet_compiled_chain"\)[\s\S]*positive later result must use the real interactive host path[\s\S]*first real positive host action must not compile another packet[\s\S]*record\("positive_first_real_host_action_used_latest_packet"\)[\s\S]*later-result intake must not create or select another packet[\s\S]*record\("positive_latest_packet_bound_result_recognized"\)[\s\S]*record\("positive_later_outcome_relationship_is_exact"\)[\s\S]*data-selected-work-current-stage="later_outcome_reviewed"[\s\S]*record\("positive_project_active_snapshot_read"\)[\s\S]*record\("mixed_project_open_mutation_succeeded"\)[\s\S]*record\("mixed_project_active_readback_confirmed"\)[\s\S]*record\("mixed_project_detail_reloaded_after_activation"\)[\s\S]*record\("positive_and_mixed_projects_remain_isolated"\)[\s\S]*await validateExactLaterOutcomeV01\(\);/u,
);
assert.match(
  source,
  /const positiveActiveSnapshot = await evaluateJson[\s\S]*positiveActiveEntries\.length,[\s\S]*1,[\s\S]*positiveActiveEntry\.project\.project_id,[\s\S]*positiveProjectId[\s\S]*Number\.isSafeInteger\(positiveActiveRevision\)[\s\S]*record\("positive_project_active_snapshot_read"\)[\s\S]*const mixedOpenResponse = await evaluateJson[\s\S]*action: 'open'[\s\S]*project_id: \$\{JSON\.stringify\(manifest\.project_id\)\}[\s\S]*expected_project_id: \$\{JSON\.stringify\(positiveActiveProjectId\)\}[\s\S]*expected_revision: \$\{JSON\.stringify\(positiveActiveRevision\)\}[\s\S]*mixedOpenResponse\.status,[\s\S]*200[\s\S]*mixedOpenResult\.selection\.selection_revision,[\s\S]*positiveActiveRevision \+ 1[\s\S]*parseStrictIsoTimestampV01[\s\S]*record\("mixed_project_open_mutation_succeeded"\)[\s\S]*const mixedActiveReadback = await evaluateJson[\s\S]*restoredActiveEntries\.length,[\s\S]*1[\s\S]*restoredPositiveEntry\.is_active, false[\s\S]*record\("mixed_project_active_readback_confirmed"\)[\s\S]*await navigate\(`\$\{appOrigin\}\$\{mixedOpenResult\.destination\}`\)[\s\S]*record\("mixed_project_detail_reloaded_after_activation"\)/u,
);
const positivePacketPrecondition = source.indexOf(
  'record("positive_latest_compiled_packet_precondition_passed")',
);
const positiveFirstHostAction = source.indexOf(
  "the positive later result must use the real interactive host path",
);
assert(
  positivePacketPrecondition >= 0 &&
    positiveFirstHostAction > positivePacketPrecondition,
);
assert.doesNotMatch(
  source,
  /the positive source must use the real interactive host path/u,
);
assert.doesNotMatch(
  source,
  /pc3-latest-packet-later-outcome|positiveLaterWriter/u,
);
assert.doesNotMatch(
  source,
  /pc3_exact_later_outcome_fixture_removed_before_shared_automation|DELETE FROM vnext_core_records/u,
);
process.stdout.write(
  `${JSON.stringify({
    test: "browser-e2e-harness-contract",
    status: "pass",
    result_flags: resultKeys.length,
    record_names: recordNames.length,
    final_request_quiet: true,
  })}\n`,
);

function hashInventory(values) {
  return createHash("sha256")
    .update(JSON.stringify([...values].sort()))
    .digest("hex");
}
