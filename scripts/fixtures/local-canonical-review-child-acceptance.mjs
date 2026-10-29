// Same self-contained driver for exact old/current review-corrections owners.
// Interception affects only this test owner's runner import. Every result comes
// from the real unchanged runCanonicalChild; no acceptance predicate is copied.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const source = path.resolve(process.argv[2]);
const scripts = path.dirname(source);
const { runCanonicalChild } = await import(pathToFileURL(path.join(scripts, "canonical-child-runner.mjs")).href);
const resources = await import(pathToFileURL(path.join(scripts, "canonical-test-environment.mjs")).href);
const { BROWSER_IDENTITY_PREFIX } = await import(pathToFileURL(path.join(scripts, "local-canonical-browser-identity.mjs")).href);
const diagnosticPrefix = "AUGNES_REVIEW_CHILD_RESULT ";
const rows = [];
let regressionFailure = null;
for (const mode of ["normal-zero", "timeout-zero"]) {
  const owner = resources.createCanonicalTestResourceRoot("ag-resource-test-");
  resources.beginCanonicalTestResourceUse(owner);
  let result = null, stdout = "", stderr = "", complete = false;
  try {
    const trace = path.join(owner.root, "actual-results.json");
    const wrapper = path.join(owner.root, "runner-interposer.mjs");
    const loader = path.join(owner.root, "resolve-interposer.mjs");
    const boot = path.join(owner.root, "register-interposer.mjs");
    writeFileSync(wrapper, `
import {runCanonicalChild as actual} from ${JSON.stringify(pathToFileURL(path.join(scripts, "canonical-child-runner.mjs")).href)};
import {writeFileSync} from 'node:fs';
export * from ${JSON.stringify(pathToFileURL(path.join(scripts, "canonical-child-runner.mjs")).href)};
const results=[];
export async function runCanonicalChild(options) {
  if(options.suite !== 'review-corrections') throw new Error('unexpected_interception_scope');
  const first=results.length===0;
  const marker=${JSON.stringify(BROWSER_IDENTITY_PREFIX + '{"synthetic_regression_only":true}\n')};
  const code=first ? (${JSON.stringify(mode)}==='timeout-zero'
    ? "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);process.stdout.write("+JSON.stringify(marker)+");"
    : "process.stdout.write("+JSON.stringify(marker)+");") : 'process.exit(19);';
  const result=await actual({...options,args:['-e',code],timeoutMs:1000});
  results.push(result);writeFileSync(${JSON.stringify(trace)},JSON.stringify(results),{mode:0o600});
  return result;
}
`, { mode: 0o600 });
    writeFileSync(loader, `
export async function resolve(specifier, context, nextResolve) {
  if(context.parentURL===${JSON.stringify(pathToFileURL(source).href)} && specifier==='./canonical-child-runner.mjs')
    return {url:${JSON.stringify(pathToFileURL(wrapper).href)},shortCircuit:true};
  return nextResolve(specifier,context);
}
`, { mode: 0o600 });
    writeFileSync(boot, `import {register} from 'node:module';register(${JSON.stringify(pathToFileURL(loader).href)});\n`, { mode: 0o600 });
    result = await runCanonicalChild({
      suite: "review-owner-acceptance-regression", label: mode,
      command: process.execPath, args: ["--import", boot, source], cwd: owner.root,
      env: resources.buildCanonicalChildEnvironment({ temporaryRoot: owner.root }),
      timeoutMs: 12000, stdout: { write(b) { stdout = (stdout + b).slice(-32000); } },
      stderr: { write(b) { stderr = (stderr + b).slice(-32000); } }, log() {},
    });
    complete = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
    assert(complete, "review owner must settle");
    assert.equal(result.timed_out, false, "outer observer must not time out");
    assert.equal(result.cancelled, false); assert.equal(result.signal, null);
    assert.equal(result.spawn_error_code, null); assert.equal(result.termination_reason, "natural_exit");
    assert.equal(result.exit_code, 1, "target owner stops at an intentional assertion");
    assert(existsSync(trace), "real child result must exist");
    const actual = JSON.parse(readFileSync(trace, "utf8"));
    assert.equal(actual[0].exit_code, 0);
    assert.equal(actual[0].timed_out, mode === "timeout-zero");
    assert.equal(actual[0].termination_reason, mode === "timeout-zero" ? "bounded_timeout" : "natural_exit");
    assert.equal(actual[0].cleanup_completed, true);
    assert.equal(actual[0].remaining_owned_processes, 0);
    assert(!stdout.includes(BROWSER_IDENTITY_PREFIX) && !stderr.includes(BROWSER_IDENTITY_PREFIX), "synthetic Browser records must remain quarantined");
    const diagnostics = stdout.split("\n").filter(line => line.startsWith(diagnosticPrefix)).map(line => JSON.parse(line.slice(diagnosticPrefix.length)));
    const advanced = actual.length > 1;
    const row = { mode, advanced_to_second_child: advanced, actual_results: actual, owner_result: result, lifecycle_diagnostics: diagnostics, synthetic_browser_records_quarantined: true };
    rows.push(row);
    if (mode === "normal-zero") {
      assert(advanced, "normal zero must be accepted by the actual owner");
      assert.equal(actual[1].exit_code, 19);
    } else if (advanced) {
      regressionFailure = "review_owner_accepted_exit_zero_after_timeout";
    } else {
      assert.equal(diagnostics.length, 1, "corrected owner must retain bounded child diagnostic");
      for (const key of ["exit_code", "signal", "timed_out", "cancelled", "spawn_error_code", "duration_ms", "termination_reason", "exit_observed", "streams_closed", "cleanup_started", "cleanup_completed", "remaining_owned_processes"]) {
        assert.deepEqual(diagnostics[0][key], actual[0][key], `returned lifecycle field must be reported: ${key}`);
      }
      assert.equal(typeof diagnostics[0].control_id, "string");
      assert(diagnostics[0].control_id.length <= 64);
      assert(JSON.stringify(diagnostics[0]).length <= 2048, "diagnostic must remain bounded");
    }
    assert(!readdirSync(owner.root).some(name => name.startsWith("ag-resource-test-")), "target owner must remove its disposable root");
  } finally {
    if (complete) resources.settleCanonicalTestResourceUse(owner, result);
    assert(resources.cleanupCanonicalTestResources([owner])[0].completed, "regression owner cleanup");
  }
}
console.log(JSON.stringify({ schema: "augnes.review-owner-child-acceptance-regression.v0.1", status: regressionFailure ? "failure" : "pass", failure: regressionFailure, rows, cleanup_completed: true }));
if (regressionFailure) throw new Error(regressionFailure);
