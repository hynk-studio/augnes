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
assert.equal(resultKeys.length, 173);
assert.equal(recordNames.length, 47);
assert.equal(
  hashInventory(resultKeys),
  "40549da6610335d0c6dbcba5e845d659586cd7746d26102364ed228db23e93fb",
);
assert.equal(
  hashInventory(recordNames),
  "c2ac43411f6cc0702be13eb1b9ddda32bcd70039cc64a48884daf9b3fa0acfd7",
);
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
  2,
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
  /async function validateBlankStateViewports[\s\S]*for \(const width of \[390, 430, 1440\]\)[\s\S]*highlighted_item_count[\s\S]*human_attention_count[\s\S]*legacy_competing_regions_absent[\s\S]*protocol_vocabulary_absent/u,
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
const continuityScopeStart = source.indexOf("if (RUN_CONTINUITY_SCOPE)");
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
  /VALIDATION_SCOPE === "core"[\s\S]*result\.multi_candidate_transition_scope, false[\s\S]*result\.exact_ready_to_complete_navigation, false[\s\S]*result\.personal_perspective_shared_inspector_exact, false[\s\S]*VALIDATION_SCOPE === "continuity"[\s\S]*result\.multi_candidate_transition_scope, true[\s\S]*result\.exact_ready_to_complete_navigation, true[\s\S]*result\.personal_perspective_shared_inspector_exact, true/u,
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
