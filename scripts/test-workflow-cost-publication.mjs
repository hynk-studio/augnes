import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { buildWorkflowCostPublication, checkWorkflowCostPublication, PUBLICATION_DIRECTORY, PUBLICATION_NAMES, sha256 } from "./build-workflow-cost-publication.mjs";
import { buildCanonicalChildEnvironment, createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { registerOwnedChild, waitForOwnedProcessExit, terminateOwnedProcessTree, trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resources = createCanonicalTestResourceRoot("ag-suite-");
const processes = new Set();
const network = installZeroNetworkGuard({ allowLoopback: true });
let server;
let summary;
let requests = 0;
let executionStarts = 0;
try {
  const generated = buildWorkflowCostPublication();
  assert.deepEqual([...generated.files], [...buildWorkflowCostPublication().files], "deterministic_generation");
  const checked = checkWorkflowCostPublication();
  const publication = path.join(resources.root, "publication");
  // Serve shipped files, never synthesize an HTTP answer from the expected result.
  cpSync(path.join(repository, PUBLICATION_DIRECTORY), publication, { recursive: true });
  const published = () => new Map(PUBLICATION_NAMES.map((name) => [name, readFileSync(path.join(publication, name))]));
  const original = published();
  const privateGuard = path.join(resources.root, "private-state-guard");
  writeFileSync(privateGuard, "not-public: private-work-and-session-sentinel");
  const guardHash = sha256(readFileSync(privateGuard));
  const html = original.get("index.html").toString();
  const markdown = original.get("README.md").toString();
  const visible = html.replace(/<[^>]+>/gu, " ").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"');
  for (const section of generated.sections) {
    for (const text of [section.title, ...section.paragraphs, ...(section.code ? [section.code] : [])]) {
      assert.ok(visible.includes(text) && markdown.includes(text), "equivalent_visible_conditions");
    }
  }
  assert.doesNotMatch(html, /<script\b|\ssrc=|<form\b|<iframe\b/iu);
  assert.ok(html.indexOf("Inputs and units") < html.indexOf("source history"));
  for (const [, bytes] of original) assert.doesNotMatch(bytes.toString(), /not-public|private-work-and-session-sentinel|\/Users\/|Bearer |OPENAI_API_KEY\s*=/u);

  const sourceRoot = path.join(resources.root, "source-fixture");
  mkdirSync(path.join(sourceRoot, "scripts/executable-reuse"), { recursive: true });
  for (const name of ["workflow_cost.py", "exact_linear.py"]) writeFileSync(path.join(sourceRoot, "scripts/executable-reuse", name), original.get(name));
  assert.deepEqual(buildWorkflowCostPublication({ sourceRoot }).files, original);
  const fixtureDependency = path.join(sourceRoot, "scripts/executable-reuse/exact_linear.py");
  writeFileSync(fixtureDependency, Buffer.from(original.get("exact_linear.py").toString().replace("MAX_STATES = 8", "MAX_STATES = 7")));
  assert.throws(() => buildWorkflowCostPublication({ sourceRoot }), /release_source_hash_drift/u);
  rmSync(fixtureDependency);
  assert.throws(() => buildWorkflowCostPublication({ sourceRoot }), /ENOENT/u);
  symlinkSync(privateGuard, fixtureDependency);
  assert.throws(() => buildWorkflowCostPublication({ sourceRoot }), /source_symlink_refused/u);
  // Build-only file access is explicitly closed. The shipped output has no
  // application imports, request handler, state store or executable server.
  const bundled = await build({ entryPoints: ["scripts/build-workflow-cost-publication.mjs"], bundle: true,
    platform: "node", format: "esm", write: false, metafile: true, logLevel: "silent" });
  assert.deepEqual(Object.keys(bundled.metafile.inputs), ["scripts/build-workflow-cost-publication.mjs"]);
  assert.deepEqual(bundled.metafile.outputs[Object.keys(bundled.metafile.outputs)[0]].imports.map(x => x.path).sort(),
    ["node:assert/strict", "node:crypto", "node:fs", "node:path", "node:url"].sort());
  assert.doesNotMatch(bundled.outputFiles[0].text, /process\.env|\bfetch\s*\(|node:child_process|better-sqlite3/u);

  // Test-host-only static map; URL strings can never become filesystem paths.
  // No claim is made about another host's POST policy (including Next's old route).
  let served = original;
  server = createServer((request, response) => {
    requests++;
    const url = new URL(request.url, "http://127.0.0.1");
    const name = url.pathname.startsWith("/workflow-cost-v1/") ? url.pathname.slice("/workflow-cost-v1/".length) : "";
    const bytes = served.get(name);
    response.writeHead(bytes ? 200 : 404, { "Content-Type": name.endsWith(".html") ? "text/html; charset=utf-8" :
      name.endsWith(".md") ? "text/markdown; charset=utf-8" : name.endsWith(".json") ? "application/json" : "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" });
    response.end(bytes ?? "Not found\n");
  });
  trackServerConnections(server);
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const entryUrl = `http://127.0.0.1:${server.address().port}/workflow-cost-v1/index.html`;
  const environment = buildCanonicalChildEnvironment({ temporaryRoot: resources.root });
  mkdirSync(environment.HOME, { recursive: true });
  async function consume(label, pass) {
    const directory = path.join(resources.root, label);
    mkdirSync(directory);
    const harness = path.join(directory, "consumer.py");
    cpSync(path.join(repository, "scripts/executable-reuse/test_public_consumer.py"), harness);
    assert.deepEqual(readdirSync(directory), ["consumer.py"]);
    assert.ok(!directory.startsWith(repository + path.sep));
    const child = spawn("python3", ["-E", "-s", "-B", harness, entryUrl], { cwd: directory, env: environment,
      detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
    const record = registerOwnedChild(processes, child, { label: `public-consumer-${label}` });
    let stdout = "", stderr = "";
    child.stdout.on("data", bytes => { stdout += bytes; });
    child.stderr.on("data", bytes => { stderr += bytes; });
    const result = await waitForOwnedProcessExit(record, 20_000);
    await terminateOwnedProcessTree(record);
    assert.equal(result.code, pass ? 0 : 2, `${label}: ${stdout.slice(-2000)} ${stderr.slice(-500)}`);
    const started = stdout.includes("INTEGRITY_VALID_EXECUTION_START");
    assert.equal(started, pass, "integrity_failure_must_prevent_execution");
    if (started) executionStarts++;
    else assert.equal(readdirSync(path.join(directory, "download")).length, 0, "no_partial_local_fallback");
    return JSON.parse(stdout.trim().split("\n").at(-1));
  }
  const consumer = await consume("consumer", true);
  assert.ok(consumer.executed_cli.startsWith(path.join(resources.root, "consumer/download") + path.sep));
  assert.ok(consumer.imports.dependency.startsWith(path.join(resources.root, "consumer/download") + path.sep));
  assert.equal(consumer.content_id, checked.content_id);

  const negatives = [];
  for (const [name, mutate] of [
    ["missing-dependency", map => map.delete("exact_linear.py")],
    ["tampered-dependency", map => map.set("exact_linear.py", Buffer.from("raise RuntimeError('must never execute')\n"))],
    ["mixed-version-dependency", map => map.set("exact_linear.py", Buffer.from(original.get("exact_linear.py").toString().replace("MAX_STATES = 8", "MAX_STATES = 7")))],
    ["tampered-entry", map => map.set("index.html", Buffer.from(map.get("index.html").toString().replace("Mandatory verification", "Optional verification")))],
    ["missing-member", map => {
      const value = JSON.parse(map.get("manifest.json")); value.files.pop();
      const { publication_sha256: _old, ...rest } = value;
      value.publication_sha256 = sha256(`${JSON.stringify(rest, null, 2)}\n`);
      map.set("manifest.json", Buffer.from(JSON.stringify(value)));
    }],
    ["mixed-version-manifest", map => { const value = JSON.parse(map.get("manifest.json")); value.release.version = "2.0.0"; map.set("manifest.json", Buffer.from(JSON.stringify(value))); }],
    ...["../private-state-guard", "/private-state-guard", "https://example.invalid/code.py", "%2e%2e%2fprivate-state-guard", "exact_linear.py/extra"].map((unsafe, i) => [`unsafe-name-${i}`, map => {
      const value = JSON.parse(map.get("manifest.json")); value.files[3].name = unsafe;
      const { publication_sha256: _old, ...rest } = value;
      value.publication_sha256 = sha256(`${JSON.stringify(rest, null, 2)}\n`);
      map.set("manifest.json", Buffer.from(`${JSON.stringify(value, null, 2)}\n`));
    }]),
  ]) {
    served = new Map(original);
    mutate(served);
    negatives.push({ case: name, ...await consume(name, false) });
  }
  served = original;
  for (const name of ["../private-state-guard", "%2e%2e%2fprivate-state-guard", "canonical.db", "__proto__", "workflow_cost.py/extra"]) {
    assert.equal((await fetch(new URL(name, entryUrl), { signal: AbortSignal.timeout(5000) })).status, 404);
  }
  for (const name of PUBLICATION_NAMES) {
    const response = await fetch(new URL(`${name}?private=disposable`, entryUrl), {
      headers: { authorization: "Bearer disposable-only", cookie: "disposable-only" }, signal: AbortSignal.timeout(5000) });
    assert.equal(response.headers.has("set-cookie"), false);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), original.get(name));
  }
  assert.deepEqual([...published()], [...original]);
  assert.equal(sha256(readFileSync(privateGuard)), guardHash);
  assert.deepEqual(network.attempts, []);
  assert.equal(executionStarts, 1);
  summary = { workflow_cost_publication: "pass", ...checked, consumer, integrity_refusals: negatives,
    deterministic: true, source_drift_missing_symlink_refused: true, equivalent_conditions: true,
    requests, external_network_attempts: network.attempts.length, private_state_guard_unchanged: true,
    application_state_imports: 0, server_side_method_execution: false };
} finally {
  if (server) await closeTrackedServer(server);
  for (const record of [...processes]) await terminateOwnedProcessTree(record);
  network.restore();
  assert.equal(processes.size, 0);
  assert.ok(cleanupCanonicalTestResources([resources]).every(result => result.completed));
  assert.equal(existsSync(resources.root), false);
}
console.log(JSON.stringify({ ...summary, cleanup: { completed: true, remaining_owned_processes: 0, temporary_root_removed: true } }));
