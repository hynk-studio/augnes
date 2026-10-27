import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Run the actual forwarding owner and suite finally block against a failing
// child and a slow pipe reader. No Browser, production attempt or log-cap change.
export async function assertCanonicalSuiteFailureOutput(sourcePath = "scripts/run-canonical-test-suite.mjs") {
  const root = process.cwd();
  const { registerOwnedChild, cleanupOwnedProcesses } = await import(pathToFileURL(path.join(root, "scripts/test-harness-process-lifecycle.mjs")));
  const { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } = await import(pathToFileURL(path.join(root, "scripts/canonical-test-environment.mjs")));
  const source = readFileSync(sourcePath, "utf8");
  const offset = source.lastIndexOf("  const failures = suiteFailure ? [suiteFailure] : [];");
  assert(offset > 0);
  const resource = createCanonicalTestResourceRoot("ag-suite-"), owner = new Set();
  const first = '{"first_failure":"controlled_boundary","actual_count":1,"expected_count":0}\n';
  const payload = "x".repeat(262144), terminal = '\n{"terminal_result":"failure","cleanup_complete":true}\n';
  const inner = `process.stdout.write(${JSON.stringify(first) + ");process.stdout.write('x'.repeat(262144));process.stdout.write(" + JSON.stringify(terminal)});process.stderr.write('controlled child failure\\n');process.exitCode=7;`;
  const intermediary = path.join(resource.root, "intermediary.mjs");
  writeFileSync(intermediary, `import {runCanonicalChild} from ${JSON.stringify(pathToFileURL(path.join(root, "scripts/canonical-child-runner.mjs")).href)};
import {createCanonicalTestResourceRoot,cleanupCanonicalTestResources} from ${JSON.stringify(pathToFileURL(path.join(root, "scripts/canonical-test-environment.mjs")).href)};
const result=await runCanonicalChild({suite:'output-control',label:'failing child',command:process.execPath,args:['--eval',${JSON.stringify(inner)}],cwd:${JSON.stringify(root)},env:process.env,timeoutMs:2000,heartbeatMs:0});
const suiteName='output-control',repoRoot=${JSON.stringify(root)},serviceMaintenance=null,serviceMaintenanceRelease=null,ownedResourceRoots=[],temporaryOwner=createCanonicalTestResourceRoot('ag-suite-');let summary;const suiteFailure=new Error('child failed with '+result.exit_code);try {}finally {
${source.slice(offset)}`);
  let out = "", err = "", limit = false, timedOut = false, closed, cleanup;
  const child = spawn(process.execPath, [intermediary], { cwd: root, env: process.env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
  const record = registerOwnedChild(owner, child, { label: "suite failure output" });
  child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
  child.stdout.on("data", b => { out += b; if (out.length > 1048576) limit = true; });
  child.stderr.on("data", b => { err += b; if (err.length > 32768) limit = true; });
  child.stdout.pause(); const resume = setTimeout(() => child.stdout.resume(), 300);
  const deadline = setTimeout(() => { timedOut = true; child.kill("SIGTERM"); }, 3000);
  try { closed = await record.closePromise; }
  finally { clearTimeout(resume); clearTimeout(deadline); await cleanupOwnedProcesses(owner); cleanup = cleanupCanonicalTestResources([resource]); }
  const result = { exit_code: closed.code, timed_out: timedOut, output_limit_exceeded: limit,
    full_payload: out.includes(first + payload + terminal), child_terminal: out.includes('child_result label="failing child"'),
    cleanup_terminal: out.includes('"resource_cleanup"'), failure_terminal: err.includes("canonical suite execution or cleanup failed"),
    cleanup_complete: owner.size === 0 && cleanup.every(x => x.completed) };
  console.log(JSON.stringify({ test: "canonical-suite-failure-output", ...result }));
  assert.equal(result.exit_code, 1); assert.equal(timedOut, false); assert.equal(limit, false);
  assert(result.cleanup_complete);
  assert(result.full_payload && result.child_terminal && result.cleanup_terminal && result.failure_terminal, "forwarded output and terminal failure must drain");
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await assertCanonicalSuiteFailureOutput(process.argv[2]);
