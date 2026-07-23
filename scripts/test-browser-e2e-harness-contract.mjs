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
assert.equal(resultKeys.length, 159);
assert.equal(recordNames.length, 40);
assert.equal(
  hashInventory(resultKeys),
  "50bed4c303ac4c6c8eb2fbbc17b9816a8ea83c50ae02af6395c5f74a8c4ed846",
);
assert.equal(
  hashInventory(recordNames),
  "c7f1ab4825f4dedc89133ec14fd1bb9207eec7e1ce4db7eefe7bc9474139d193",
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
