import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";

const source = relative => readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");
const suite = source("scripts/run-canonical-test-suite.mjs");
const executor = source("scripts/run-local-canonical-verification.mjs");
const owners = JSON.parse(source("scripts/local-canonical-change-owners.v1.json"));
const browser = JSON.parse(source("scripts/browser-verification-owners.v1.json"));
const authorityText = suite.slice(suite.indexOf("  authority: [") + "  authority: ".length, suite.indexOf("\n  operability: ["));
const command = (...args) => ({ command: "/selected/node", args: ["--import", "tsx", ...args], cwd: "/selected/source" });
const authority = JSON.parse(JSON.stringify(runInNewContext(`(${authorityText.trim().replace(/,$/u, "")})`, {
  rootNode: command, nestedNode: command,
  process: { execPath: "/selected/node" }, repoRoot: "/selected/source",
}, { timeout: 1000 })));
const controls = new Map([
  ["local-canonical-selected-git", "scripts/test-local-canonical-selected-git.mjs"],
  ["local-canonical-selected-consumers", "scripts/test-local-canonical-selected-consumers.mjs"],
  ["local-canonical-selected-execution", "scripts/test-local-canonical-selected-execution.mjs"],
  ["local-canonical-selected-evidence", "scripts/test-local-canonical-selected-evidence.mjs"],
  ["local-canonical-input-tree", "scripts/test-local-canonical-input-tree.mjs"],
  ["canonical-child-lifecycle", "scripts/test-canonical-child-lifecycle.mjs"],
  ["local-canonical-selected-registration", "scripts/test-local-canonical-selected-registration.mjs"],
  ["local-canonical-selected-pipeline", "scripts/test-local-canonical-selected-pipeline.mjs"],
]);
const integrity = owners.high_risk_owners.find(owner => owner.id === "local-canonical-integrity");
for (const [id, file] of controls) {
  const children = authority.filter(child => child.id === id || child.args.includes(file));
  assert.equal(children.length, 1, `${file} must have exactly one authority owner`);
  assert.equal(children[0].id, id);
  assert.deepEqual(children[0].args, [file], "MJS controls do not add an unselected Node preload");
  assert.equal(children[0].timeoutMs, 30_000, `${id} keeps its bounded deadline`);
  assert.equal(children[0].requireNaturalExit, true, `${id} cannot accept forced process cleanup as a natural exit`);
  assert(integrity.path_rules.exact_paths.includes(file), `${file} must escalate through the integrity owner`);
  assert.equal(suite.split(file).length - 1, 1, `${file} cannot have a second suite owner`);
}
for (const file of ["scripts/local-canonical-selected-git.mjs", "scripts/local-canonical-selected-execution.mjs",
  "scripts/local-canonical-selected-shell.mjs",
  "scripts/local-canonical-selected-python.mjs",
  "scripts/local-canonical-selected-consumers.mjs", "scripts/local-canonical-selected-consumers.v1.json",
  "scripts/local-canonical-inputs.mjs", "scripts/local-canonical-evidence-retention.mjs",
  "scripts/test-local-canonical-bootstrap-lifecycle.mjs", "scripts/test-owned-sync-child-lifecycle.mjs",
  "scripts/test-local-canonical-controller-settlement.mjs",
  "scripts/fixtures/local-canonical-selected-git-file-operands.mjs",
  "lib/vnext/native-host/codex-configuration-sources.mjs",
  "scripts/test-local-canonical-native-configuration.mjs",
  "scripts/fixtures/local-canonical-native-configuration-reader.mjs",
  "scripts/fixtures/local-canonical-selected-evidence-reader.mjs", "scripts/fixtures/local-canonical-selected-pipeline-reader.mjs"])
  assert(integrity.path_rules.exact_paths.includes(file), `${file} must escalate through the integrity owner`);

// Accepted main 751be9d supplied these semantic phase/time bounds. Registration
// adds authority controls; it does not substitute or widen the deciding plan.
const expected = [
  ["dependencies-root", 600_000], ["dependencies-nested", 600_000], ["dependencies-web-planning", 600_000],
  ["typecheck", 300_000], ["build", 600_000], ["unit", 3_600_000], ["authority", 2_400_000],
  ["integration", 4_200_000], ["operability", 1_800_000], ["e2e-project-experience", 480_000],
  ["e2e-operator-review-control", 420_000], ["e2e-operator-native-host-execution", 420_000],
  ["e2e-operator-work-expectation", 420_000], ["e2e-operator-multi-candidate", 420_000],
  ["e2e-continuity", 600_000], ["e2e-golden", 420_000],
];
const fullSource = executor.slice(executor.indexOf("function fullPhases("), executor.indexOf("function npmPhase("));
const full = JSON.parse(JSON.stringify(runInNewContext(`${fullSource}\nfullPhases({baseSha:'a'.repeat(40),headSha:'b'.repeat(40),browserPhaseIds})`, {
  process: { platform: "darwin", execPath: "/selected/node" }, browserPhaseIds: browser.canonical_phase_order,
  npmPhase: (id, label, args, timeoutMs, cwdScope = "root") => ({ id, label, args, timeoutMs, cwdScope }),
  phaseDefinition: value => value,
}, { timeout: 1000 })));
assert.deepEqual(full.map(phase => [phase.id, phase.timeoutMs]), expected);
assert.deepEqual(browser.canonical_phase_order, expected.slice(9).map(([id]) => id));
assert(suite.includes("maxConcurrency: projectWorkFocus ? 1 : 2"), "integration concurrency remains its accepted bound");
assert(suite.includes("for (const step of preparedSteps)"), "other suites retain serial child execution");
assert.match(source("scripts/canonical-child-runner.mjs"), /DEFAULT_CANONICAL_CHILD_TIMEOUT_MS = 300_000;/u);

// The real typecheck script nests typegen through npm. Keep that exact command
// in both dispatch paths and the retained-byte parser without allowing any run.
const selectionSource = source("scripts/local-canonical-selected-execution.mjs");
const npmSets = JSON.parse(JSON.stringify(runInNewContext(
  selectionSource.match(/const NPM_ARGUMENT_SETS = (\[[\s\S]*?\]);/u)[1], {}, { timeout: 1000 })));
assert(npmSets.some(args => JSON.stringify(args) === JSON.stringify(["run", "typegen"])));
assert(!npmSets.some(args => args.length === 1 && args[0] === "run"));
const npmGuard = runInNewContext(selectionSource.match(/const NPM_GUARD = ('[^\n]+');/u)[1], {}, { timeout: 1000 });
assert(npmGuard.includes('"run typegen"'));
for (const file of ["scripts/local-canonical-evidence-retention.mjs", "scripts/test-local-canonical-selected-evidence.mjs"]) {
  const retainedGuard = runInNewContext(source(file).match(/const npmGuard = ("[^\n]+");/u)[1], {}, { timeout: 1000 });
  assert.equal(retainedGuard, `#!/bin/sh\n${npmGuard}`, `${file} retains the exact executable npm guard`);
}

// Exercise the actual small environment owners without starting a browser or
// runtime. Their authored minimal allowlist must survive capability forwarding.
for (const [file, functionName] of [
  ["scripts/browser-validate-continuity-v1.mjs", "minimalProcessEnvironment"],
  ["scripts/browser-validate-project-experience-v1.mjs", "minimalProcessEnvironment"],
  ["scripts/operator-execution-browser-lifecycle-v1.mjs", "minimalProcessEnvironment"],
  ["scripts/test-operator-browser-navigation-diagnostics-v1.mjs", "focusedEnvironment"],
]) {
  const body = source(file).match(new RegExp(`function ${functionName}\\(\\) \\{[\\s\\S]*?\\n\\}`, "u"))[0];
  const ambient = { PATH: "/selected/bin", HOME: "/fixture/home", SECRET_CONTROL: "not-forwarded" };
  let calls = 0;
  const environment = runInNewContext(`${body}\n${functionName}()`, {
    process: { env: ambient, execPath: "/unselected/bin/node" }, path: { dirname: () => "/unselected/bin", delimiter: ":" },
    inheritSelectedExecutionEnvironment(actualAmbient, child) {
      assert.equal(actualAmbient, ambient); calls++;
      return { ...child, PATH: "/selected/bin", AUGNES_CANONICAL_SELECTED_INPUTS: "/selected/manifest", AUGNES_CANONICAL_CHILD_LEDGER_PATH: "/selected/ledger" };
    },
  }, { timeout: 1000 });
  assert.equal(calls, 1, `${file} must forward the validated selected capability`);
  assert.equal(environment.PATH, "/selected/bin", `${file} preserves selected dispatcher priority`);
  assert.deepEqual(Object.keys(environment).sort(), ["AUGNES_CANONICAL_CHILD_LEDGER_PATH", "AUGNES_CANONICAL_SELECTED_INPUTS", "HOME", "PATH"]);
}
const continuity = source("scripts/browser-validate-continuity-v1.mjs");
const captureBody = continuity.slice(continuity.indexOf("async function runCapture("), continuity.indexOf("\nasync function cleanup()"));
assert(!/\bspawn\(/u.test(captureBody), "fixture export must use the bounded child owner");
let captureOptions;
const capture = runInNewContext(`${captureBody}\nrunCapture`, {
  runCanonicalChild: async options => {
    captureOptions = options;
    options.stdout.write("captured output"); options.stderr.write("captured diagnostic");
    return { exit_code: 7, timed_out: false, spawn_error_code: null, exit_observed: true,
      streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 };
  },
}, { timeout: 1000 });
const captureResult = await capture("/selected/node", ["fixture.mjs"], { cwd: "/fixture", env: { selected: "yes" }, timeoutMs: 1234 });
assert.equal(captureOptions.timeoutMs, 1234, "fixture export retains its authored deadline");
assert.equal(captureOptions.command, "/selected/node");
assert.deepEqual(JSON.parse(JSON.stringify(captureResult)), { code: 7, stdout: "captured output", stderr: "captured diagnostic" },
  "the original caller remains responsible for its exit-code assertion");
const privacy = source("scripts/test-codex-companion-privacy.mjs");
assert.match(privacy, /bridgeRecord = registerOwnedChild\(ownedProcesses, bridge,/u);
assert.match(privacy, /finally \{ await new Promise\(\(resolve\) => ui\.close/u);
const python = source("scripts/local-canonical-selected-python.mjs");
assert.match(python, /sys\.executable = wrapper/u);
assert.match(python, /runCanonicalChild\([\s\S]*?timeoutMs: 30_000/u);
assert.match(python, /requireNaturalExit: true/u);
const pythonInputsBody = selectionSource.match(/export function selectedPythonInputs\(ambient, cwd\) \{[\s\S]*?\n\}/u)[0].replace(/^export /u, "");
const pythonInputs = runInNewContext(`${pythonInputsBody}\nselectedPythonInputs`, {
  readInheritedSelection: () => ({ repository_root: "/source", private_root: "/private", npm_root: "/selected/npm", tools: { python3: "/selected/python3" } }),
  inheritSelectedExecutionEnvironment: (_ambient, child) => child, realpathSync: file => file, path,
  fail: code => { throw new Error(code); },
}, { timeout: 1000 });
assert.deepEqual([...pythonInputs({}, "/selected/npm/node_modules/node-gyp").roots], ["/source", "/private", "/selected/npm"]);
assert.throws(() => pythonInputs({}, "/unowned"), /selected_python_cwd_unclassified/u);
const worktree = source("lib/vnext/repository-execution/worktree-observation.ts");
assert.match(worktree, /pathToFileURL\(path\.resolve\(path\.dirname\(fileURLToPath\(import\.meta\.url\)\)/u);
assert.match(worktree, /import\(\/\* webpackIgnore: true \*\/ \/\* turbopackIgnore: true \*\/ selectedModule\)/u);
assert.match(worktree, /if \(process\.env\.AUGNES_CANONICAL_SELECTED_INPUTS\) \{[\s\S]*?selectedGitExecFile\(root, \[\.\.\.args\], \{[\s\S]*?timeout: 5_000, maxBuffer: MAX_GIT_OUTPUT_BYTES/u);
assert.match(worktree, /await execFileAsync\("git",/u, "unselected product reader keeps its existing implementation");
console.log("selected input registration controls passed: eight bounded authority children; Full 16, Browser 7, existing phase deadlines and concurrency unchanged");
