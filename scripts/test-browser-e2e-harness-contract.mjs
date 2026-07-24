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
assert.equal(resultKeys.length, 170);
assert.equal(recordNames.length, 46);
assert.equal(
  hashInventory(resultKeys),
  "2f52e2fd3b06d2b690a52bd6b963ace6119d906f7dd6859377b505b7b047300c",
);
assert.equal(
  hashInventory(recordNames),
  "712cee8616f22226319e4bc05246d48d8bb62c11674a106e454d9352a9ebb128",
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
assert.match(
  source,
  /"paused project automation before retained restart"[\s\S]*await navigate\("about:blank"\)[\s\S]*"project and control persistence after retained restart"[\s\S]*result\.project_automation_restart_persisted = true;[\s\S]*result\.minimum_project_home_restart_root_resolution = true;[\s\S]*result\.project_controls_restart_persisted = true;[\s\S]*"resumed project automation after retained restart"[\s\S]*"same destination after retained restart"[\s\S]*result\.folder_onboarding_restart_reopen = true;/u,
);
assert.match(
  source,
  /await validateBlankStateViewports\(\);[\s\S]*"explicit first-project activation ready"[\s\S]*const activationResponseStart/u,
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
