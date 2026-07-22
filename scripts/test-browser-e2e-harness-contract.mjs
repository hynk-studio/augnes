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
assert.equal(resultKeys.length, 153);
assert.equal(recordNames.length, 40);
assert.equal(
  hashInventory(resultKeys),
  "8bc88c566ec6514531b8e4b92b29a131b453a63a4cd0bbed724b9cda9c5b90c9",
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
  /definitive response rather than a transient[\s\S]*await waitForRequestQuiet\(\);[\s\S]*await validateProjectHomeViewports\(\);[\s\S]*"explicit first-project activation ready"[\s\S]*const activationResponseStart/u,
);
assert.equal(
  [...source.matchAll(/await waitForViewportLayout\(width, '[^']+'\);/gu)].length,
  4,
);
assert.match(
  source,
  /async function waitForViewportLayout\(width, selector\)[\s\S]*window\.innerWidth === \$\{Number\(width\)\}[\s\S]*document\.documentElement\.clientWidth === \$\{Number\(width\)\}[\s\S]*surface\?\.getBoundingClientRect\(\)\.width[\s\S]*requestAnimationFrame/u,
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
