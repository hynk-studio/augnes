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
assert.equal(resultKeys.length, 163);
assert.equal(recordNames.length, 41);
assert.equal(
  hashInventory(resultKeys),
  "6b380b7fa6ecf01c78052ae4ee7c7002d9a1e0b83621f909bf3309ab6c5d322d",
);
assert.equal(
  hashInventory(recordNames),
  "729ece764ac96c78c6a3beafb5f030382b8a81200de99770c0d98ab8495d3a10",
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
  /route: "\/projects"[\s\S]*expectedPrimaryZone: "blank-state"[\s\S]*expectedUtilityContext: "project-management"/u,
);
assert.match(
  source,
  /route: "\/workbench\/inspector\?target=run_receipt"[\s\S]*expectedPrimaryZone: "ai-workplane"/u,
);
assert.match(
  source,
  /route: "\/portability"[\s\S]*expectedPrimaryZone: null[\s\S]*expectedUtilityContext: "portability"/u,
);
assert.match(
  source,
  /async function validateProductShellResponsive[\s\S]*for \(const width of \[390, 430\]\)[\s\S]*document_horizontal_overflow: false[\s\S]*primary_link_count: 2/u,
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
  /async function validateProjectToolsKeyboardNavigation[\s\S]*dispatchKeyboardKey\(" ", "Space", 32\)[\s\S]*dispatchKeyboardKey\("Tab"[\s\S]*dispatchKeyboardKey\("Tab", "Tab", 9, 8\)/u,
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
