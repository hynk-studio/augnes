#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync,
  realpathSync, statSync, symlinkSync, writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPreparationNode, parseConnectionOptions } from "./prepare-llama-connection.mjs";
import {
  beginCanonicalTestResourceUse, buildCanonicalChildEnvironment, cleanupCanonicalTestResources,
  createCanonicalTestResourceRoot, settleCanonicalTestResourceUse,
} from "./canonical-test-environment.mjs";
import {
  cleanupOwnedProcesses, registerOwnedChild, terminateOwnedProcessTree, waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resource = createCanonicalTestResourceRoot("ag-suite-");
const root = resource.root;
const environment = buildCanonicalChildEnvironment({ temporaryRoot: root });
const owned = new Set(), records = [];
const fixtureRoot = path.join(root, "checkout space 'quote' $literal");
const script = path.join(fixtureRoot, "scripts/prepare-llama-connection.mjs");
const marker = path.join(root, "adapter-must-not-run");
const secret = "fixture-secret-must-not-be-copied";
const origin = "https://augnes.example.test";
const scope = {
  workspace_id: "10000000-0000-4000-8000-000000000001",
  project_id: "20000000-0000-4000-8000-000000000002",
  work_id: "30000000-0000-4000-8000-000000000003",
};
let count = 0, report;

async function capture({ command = process.execPath, args, cwd = root, env = environment, input = "", label }) {
  const child = spawn(command, args, { cwd, env, detached: process.platform !== "win32",
    windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  const record = registerOwnedChild(owned, child, { label });
  records.push(record);
  let stdout = "", stderr = "", overflow = false, inputError;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => {
    if (Buffer.byteLength(stdout) + Buffer.byteLength(chunk) > 256 * 1024) overflow = true;
    else stdout += chunk;
  });
  child.stderr.on("data", chunk => {
    if (Buffer.byteLength(stderr) + Buffer.byteLength(chunk) > 256 * 1024) overflow = true;
    else stderr += chunk;
  });
  child.stdin.on("error", error => { inputError = error; });
  try {
    child.stdin.end(input);
    const result = await waitForOwnedProcessExit(record, 5000);
    assert.equal(record.spawnErrorCode, null);
    assert.equal(result.signal, null);
    assert.equal(overflow, false);
    assert.equal(inputError, undefined);
    return { status: result.code, stdout, stderr };
  } finally {
    await terminateOwnedProcessTree(record);
    assert.equal(record.closed, true);
  }
}

async function run(args, expected = 0, entry = script) {
  const result = await capture({ args: [entry, ...args], label: "llama-offline-preparation",
    env: { ...environment, AUGNES_TEST_SECRET: secret, AUGNES_WEB_ORIGIN: "https://ignored-environment.example.test" } });
  assert.equal(result.status, expected, result.stderr);
  assert.equal(existsSync(marker), false, "preparation must not execute an adapter");
  assert.equal((result.stdout + result.stderr).includes(secret), false);
  return expected === 0 ? JSON.parse(result.stdout) : JSON.parse(result.stderr);
}

function setup(name, patch = {}) {
  const filename = path.join(root, name);
  writeFileSync(filename, JSON.stringify({ format: "augnes_web_file_task.v1", origin, ...scope, ...patch }));
  return filename;
}

function webArgs(input, output, approvedOrigin = origin) {
  return ["--mode", "web", "--setup", input, "--origin", approvedOrigin, "--output", output];
}

function inspectOutput(output, expected) {
  assert.deepEqual(readdirSync(output).sort(), ["README.md", "mcp.json"]);
  const config = JSON.parse(readFileSync(path.join(output, "mcp.json"), "utf8"));
  assert.deepEqual(config, expected);
  for (const filename of ["mcp.json", "README.md"]) {
    const contents = readFileSync(path.join(output, filename), "utf8");
    assert.equal(contents.includes(secret), false);
    if (process.platform !== "win32") assert.equal(statSync(path.join(output, filename)).mode & 0o777, 0o600);
  }
  if (process.platform !== "win32") assert.equal(statSync(output).mode & 0o777, 0o700);
  return readFileSync(path.join(output, "README.md"), "utf8");
}

function guideArguments(guide) {
  return [...guide.matchAll(/```json\n([\s\S]*?)\n```/gu)].map(match => JSON.parse(match[1]));
}

beginCanonicalTestResourceUse(resource);
try {
  mkdirSync(path.dirname(script), { recursive: true });
  mkdirSync(path.join(fixtureRoot, "plugins/augnes-operator/mcp"), { recursive: true });
  mkdirSync(path.join(fixtureRoot, "apps/augnes_apps/scripts"), { recursive: true });
  copyFileSync(path.join(sourceRoot, "scripts/prepare-llama-connection.mjs"), script);
  copyFileSync(path.join(sourceRoot, "plugins/augnes-operator/mcp/node-runtime-policy.mjs"), path.join(fixtureRoot, "plugins/augnes-operator/mcp/node-runtime-policy.mjs"));
  const adapterBody = `import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(marker)}, 'unexpected'); throw Error('adapter executed');\n`;
  const localAdapter = path.join(fixtureRoot, "scripts/llama-companion-stdio.mjs");
  const webAdapter = path.join(fixtureRoot, "apps/augnes_apps/scripts/file-review-stdio.mjs");
  writeFileSync(localAdapter, adapterBody);
  writeFileSync(webAdapter, adapterBody);

  const project = path.join(root, "project space \"double\" 'quote' $literal");
  mkdirSync(project);
  const localOutput = path.join(root, "local output space");
  const local = await run(["--mode", "local", "--project-root", path.relative(root, project), "--output", path.relative(root, localOutput)]);
  assert.equal(local.status, "prepared_not_connected");
  assert.equal(local.mode, "local");
  assert.deepEqual(local.files, [path.join(localOutput, "mcp.json"), path.join(localOutput, "README.md")]);
  const localGuide = inspectOutput(localOutput, { mcpServers: { augnes: {
    command: realpathSync(process.execPath), args: [localAdapter], cwd: fixtureRoot,
  } } });
  // Validate usable command/tool arguments, not explanatory prose wording.
  assert.deepEqual(guideArguments(localGuide), [
    ["llama", "serve", "-m", "/absolute/model.gguf", "--host", "127.0.0.1", "--mcp-servers-config", path.join(localOutput, "mcp.json")],
    { tool: "augnes_augnes_companion_lifecycle_status", arguments: { repositoryRoot: fixtureRoot } },
    { tool: "augnes_augnes_resume_repository", arguments: { repositoryRoot: project } },
  ]);
  count += 1;

  const input = setup("task space 'quote' $literal.json", {
    token: secret, command: "untrusted-command", args: ["untrusted-arg"], env: { TOKEN: secret },
  });
  const original = readFileSync(input);
  const webOutput = path.join(root, "web output");
  assert.equal((await run(webArgs(path.relative(root, input), webOutput))).status, "prepared_not_connected");
  inspectOutput(webOutput, { mcpServers: { augnes: {
    command: realpathSync(process.execPath), args: [webAdapter, input], cwd: fixtureRoot,
    env: { AUGNES_WEB_ORIGIN: origin },
  } } });
  assert.deepEqual(readFileSync(input), original, "setup bytes must not change");
  assert.equal(existsSync(path.join(fixtureRoot, "apps/augnes_apps/node_modules")), false, "dependencies must not be installed");
  count += 1;

  const participant = setup("participant.json", {
    format: "augnes_web_participation.v1", grant_id: "40000000-0000-4000-8000-000000000004",
    request: { work_id: scope.work_id, revision: 7, fingerprint: "sha256:" + "a".repeat(64) },
  });
  const participantOutput = path.join(root, "participant output");
  await run(webArgs(participant, participantOutput));
  const participantGuide = inspectOutput(participantOutput, { mcpServers: { augnes: {
    command: realpathSync(process.execPath), args: [webAdapter, participant], cwd: fixtureRoot,
    env: { AUGNES_WEB_ORIGIN: origin },
  } } });
  assert.deepEqual(guideArguments(participantGuide)[1], { tool: "augnes_list_file_requests", arguments: {} });
  count += 1;

  const invalidCases = [
    ["foreign-origin", { origin: "https://foreign.example.test" }, origin, "origin_mismatch"],
    ["http-origin", { origin: "http://127.0.0.1:3000" }, "http://127.0.0.1:3000", "invalid_origin"],
    ["origin-path", { origin: origin + "/path" }, origin + "/path", "invalid_origin"],
    ["origin-slash", { origin: origin + "/" }, origin + "/", "invalid_origin"],
    ["origin-credential", { origin: "https://private:password@augnes.example.test" }, "https://private:password@augnes.example.test", "invalid_origin"],
    ["origin-query", { origin: origin + "?token=private" }, origin + "?token=private", "invalid_origin"],
    ["continuation", { format: "augnes_web_continuation.v1" }, origin, "unsupported_setup"],
    ["native-review", { format: "review-connection.v1" }, origin, "unsupported_setup"],
    ["scope", { project_id: "not-an-id" }, origin, "invalid_setup_scope"],
    ["request-work", { format: "augnes_web_participation.v1", grant_id: "40000000-0000-4000-8000-000000000004", request: { work_id: scope.project_id, revision: 1, fingerprint: "sha256:" + "a".repeat(64) } }, origin, "invalid_participant_setup"],
    ["request-revision", { format: "augnes_web_participation.v1", grant_id: "40000000-0000-4000-8000-000000000004", request: { work_id: scope.work_id, revision: 0, fingerprint: "sha256:" + "a".repeat(64) } }, origin, "invalid_participant_setup"],
    ["request-digest", { format: "augnes_web_participation.v1", grant_id: "40000000-0000-4000-8000-000000000004", request: { work_id: scope.work_id, revision: 1, fingerprint: "bad" } }, origin, "invalid_participant_setup"],
  ];
  for (const [name, patch, approvedOrigin, reason] of invalidCases) {
    const output = path.join(root, name + "-output");
    const result = await run(webArgs(setup(name + ".json", patch), output, approvedOrigin), 1);
    assert.equal(result.reason, reason);
    assert.equal(existsSync(output), false);
    count += 1;
  }

  const badJson = path.join(root, "invalid.json");
  writeFileSync(badJson, '{"secret":"' + secret);
  assert.equal((await run(webArgs(badJson, path.join(root, "bad-json-output")), 1)).reason, "invalid_setup");
  assert.equal((await run(webArgs(path.join(root, "missing.json"), path.join(root, "missing-output")), 1)).reason, "setup_unavailable");
  const prior = readFileSync(path.join(webOutput, "mcp.json"));
  assert.equal((await run(webArgs(input, webOutput), 1)).reason, "output_exists");
  assert.deepEqual(readFileSync(path.join(webOutput, "mcp.json")), prior);
  const existingFile = path.join(root, "existing-file");
  writeFileSync(existingFile, "preserve");
  assert.equal((await run(webArgs(input, existingFile), 1)).reason, "output_exists");
  assert.equal(readFileSync(existingFile, "utf8"), "preserve");
  if (process.platform !== "win32") {
    const alias = path.join(root, "existing-link");
    symlinkSync(webOutput, alias);
    assert.equal((await run(webArgs(input, alias), 1)).reason, "output_exists");
    assert.deepEqual(readFileSync(path.join(webOutput, "mcp.json")), prior);
  }
  assert.equal((await run(webArgs(input, path.join(root, "absent-parent/output")), 1)).reason, "output_parent_unavailable");
  assert.equal((await run(["--mode", "local", "--project-root", path.join(root, "missing-project"), "--output", path.join(root, "missing-project-output")], 1)).reason, "project_root_unavailable");
  count += 1;

  for (const args of [[], ["--mode", "web"], ["--mode", "local", "--mode", "web"],
    ["--mode", "local", "--project-root", project, "--output", "x", "--origin", origin],
    [...webArgs(input, "x"), "--project-root", project], [...webArgs(input, "x"), "--command", "untrusted"],
    ["--mode", "local", "--project-root", project, "--output"]]) {
    assert.throws(() => parseConnectionOptions(args), error => error.code === "invalid_arguments");
  }
  for (const version of ["22.23.4", "22.24.0", "24.22.1", "24.23.0"]) assert.doesNotThrow(() => assertPreparationNode(version));
  for (const version of ["22.23.3", "24.22.0", "20.99.0", "23.0.0", "26.0.0", "v24.22.1", "24.22.1-rc.1"]) {
    assert.throws(() => assertPreparationNode(version), error => error.code === "unsupported_node");
  }
  count += 1;

  // Exercise the generated argv/cwd against the installed locked SDK. Only
  // initialize/list run: tool handlers, HTTP, Access login and writes do not.
  for (const [name, selected, expectedTools] of [
    ["owner", input, ["list_file_requests", "read_exchange_text", "return_text_edit"]],
    ["participant", participant, ["list_file_requests", "read_exchange_text", "return_text_edit", "read_participant_feedback"]],
  ]) {
    const protocolOutput = path.join(root, name + "-protocol-config");
    await run(webArgs(selected, protocolOutput), 0, path.join(sourceRoot, "scripts/prepare-llama-connection.mjs"));
    const config = JSON.parse(readFileSync(path.join(protocolOutput, "mcp.json"), "utf8")).mcpServers.augnes;
    const before = readdirSync(root).sort();
    const result = await capture({ command: config.command, args: config.args, cwd: config.cwd,
      env: { ...environment, ...config.env }, label: "llama-web-protocol-only",
      input: [
        { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "llama-v1-setup-fixture", version: "1" } } },
        { jsonrpc: "2.0", method: "notifications/initialized" },
        { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      ].map(message => JSON.stringify(message) + "\n").join(""),
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    const responses = result.stdout.trimEnd().split("\n").map(line => JSON.parse(line));
    assert.equal(responses.length, 2);
    assert.equal(responses.find(response => response.id === 1)?.result.protocolVersion, "2024-11-05");
    const catalog = responses.find(response => response.id === 2)?.result;
    assert.deepEqual(catalog.tools.map(tool => tool.name).sort(), expectedTools.sort());
    assert.equal(catalog.nextCursor, undefined);
    assert.equal(catalog.tools.find(tool => tool.name === "return_text_edit").annotations.readOnlyHint, false);
    assert.deepEqual(readdirSync(root).sort(), before, "discovery must not create login, runtime or recovery state");
    assert.deepEqual(readFileSync(input), original);
    count += 1;
  }

  report = { status: "pass", scenarios: count, real_model_calls: 0, live_web_calls: 0,
    preparation_adapters_started: 0, protocol_only_adapters: 2, credentials_copied: false, input_setup_unchanged: true };
} finally {
  await cleanupOwnedProcesses(owned);
  settleCanonicalTestResourceUse(resource, {
    exit_observed: records.every(record => record.exited),
    streams_closed: records.every(record => record.stdoutClosed && record.stderrClosed),
    cleanup_completed: records.every(record => record.closed), remaining_owned_processes: owned.size,
  });
  const cleaned = cleanupCanonicalTestResources([resource]);
  assert(cleaned.every(result => result.completed), JSON.stringify(cleaned));
}
console.log(JSON.stringify(report, null, 2));
