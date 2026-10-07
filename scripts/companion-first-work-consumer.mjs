// Runnable, deterministic developer example. No provider, hosted store or managed run.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";
import { fileManifest } from "../apps/web_planning/src/files.ts";

const file = fileURLToPath(import.meta.url);
const repository = path.resolve(path.dirname(file), "..");
const digest = value => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const requireSdk = createRequire(path.join(repository, "apps/augnes_apps/package.json"));
const { Client } = requireSdk("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = requireSdk("@modelcontextprotocol/sdk/client/stdio.js");

/** Only this fixed example is executable; existing bounded child settlement owns it. */
export async function runFirstWorkExampleChild(mode, args) {
  assert(["start", "continue", "read", "check", "check-role"].includes(mode));
  let output = "", overflow = false;
  const result = await runCanonicalChild({ suite: "companion-first-work", label: mode,
    command: process.execPath, args: ["--import", "tsx", file, mode, ...args], cwd: repository,
    env: process.env, timeoutMs: 20_000, heartbeatMs: 0, log: () => {},
    stdout: { write(chunk) { if (Buffer.byteLength(output) + chunk.length <= 128_000) output += chunk; else overflow = true; } },
    stderr: { write() {} },
  });
  assert(!overflow && !result.timed_out && result.signal === null && result.exit_observed && result.streams_closed &&
    result.cleanup_completed && result.remaining_owned_processes === 0 && result.termination_reason === "natural_exit", "example child did not settle");
  assert([0, 1].includes(result.exit_code));
  const observation = JSON.parse(output);
  return { ...observation, exit_status: result.exit_code, duration_ms: result.duration_ms };
}

function check(inputPath, correctRole) {
  const stat = lstatSync(inputPath);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 16_000, "bounded regular manifest required");
  const bytes = readFileSync(inputPath);
  assert(bytes.length <= 16_000);
  let input = JSON.parse(bytes.toString("utf8"));
  if (correctRole) {
    assert(Array.isArray(input) && input.length === 1, "targeted follow-up requires one file");
    input = [{ ...input[0], role: "report" }];
  }
  const checked = Buffer.from(JSON.stringify(input));
  let code = "compatible";
  try { fileManifest(input); } catch (error) {
    if (typeof error?.code !== "string") throw error;
    code = error.code;
  }
  const observation = { evidence: "scripted developer-exposed compatibility check", check: "Web Planning fileManifest",
    code, observed_at: new Date().toISOString(), input_sha256: digest(checked), original_input_sha256: digest(bytes),
    follow_up: correctRole ? "change only role to report" : null,
    checked_sources: Object.fromEntries(["apps/web_planning/src/files.ts", "apps/web_planning/src/contract.ts", "scripts/companion-first-work-consumer.mjs"]
      .map(name => [name, digest(readFileSync(path.join(repository, name)))])),
  };
  console.log(JSON.stringify(observation));
  process.exitCode = code === "compatible" ? 0 : 1;
}

async function consume(mode, repositoryRoot, inputPath) {
  assert(path.isAbsolute(repositoryRoot), "absolute registered project root required");
  const client = new Client({ name: "companion-first-work-example", version: "0.1.0" });
  const transport = new StdioClientTransport({ command: process.execPath,
    args: [path.join(repository, "plugins/augnes-operator/mcp/companion-proxy.mjs")], env: process.env, stderr: "pipe" });
  try {
    await client.connect(transport);
    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      const value = result.structuredContent;
      // Unknown save outcomes deliberately end this invocation. A separate read
      // command reconciles them; there is no automatic replacement save.
      assert(value && !result.isError, `Companion operation unavailable: ${value?.status ?? "invalid_response"}/${value?.reason ?? "unknown"}`);
      return value;
    };
    const resume = () => call("augnes_resume_repository", { repositoryRoot });
    const read = async () => {
      const resumed = await resume();
      assert.equal(resumed.continuity?.snapshot.status, "exact");
      const sources = resumed.continuity.current_work.status === "no_current_work" ? null
        : await call("augnes_read_repository_work_sources", { repositoryRoot, expectedSnapshotBinding: resumed.continuity.snapshot.binding });
      if (sources) assert.equal(sources.status, "available");
      return { continuity: resumed.continuity, sources };
    };
    let current = await read();
    let bootstrap = null;
    if (mode === "read") return current;
    if (mode === "start") {
      assert.equal(current.continuity.current_work.status, "no_current_work");
      const args = { repositoryRoot, expectedSnapshotBinding: current.continuity.snapshot.binding,
        changes: { goal: "Check Web Planning file-manifest compatibility", success_criteria: ["Retain the observed check result and act on any mismatch"],
          non_goals: ["No managed execution, semantic acceptance, hosted operation or provider call"] } };
      const preview = await call("augnes_preview_repository_initial_work", args);
      bootstrap = await call("augnes_define_repository_initial_work", { ...args, previewBinding: preview.preview_binding });
      assert.equal(bootstrap.status, "saved");
      current = await read();
    }
    assert.equal(current.continuity.current_work.status, "current_work");
    const priorSourceCount = current.sources.sources.length;
    const report = await runFirstWorkExampleChild("check", [inputPath]);
    let followUp = null;
    let interpretation, nextGoal;
    if (report.exit_status === 0 && report.code === "compatible") {
      interpretation = "The supplied manifest satisfies the current API. Stop this check; no additional check is justified by this result.";
      nextGoal = "Stop file-manifest checking: supplied input is compatible";
    } else {
      assert.equal(report.code, "invalid_file_name_or_role", "unrecognized mismatch needs a separately chosen follow-up");
      // The actual mismatch selects this discriminating follow-up; it is not run
      // for a compatible result. Original input/report remain unchanged.
      followUp = await runFirstWorkExampleChild("check-role", [inputPath]);
      interpretation = followUp.exit_status === 0
        ? "The original failed with invalid_file_name_or_role. Changing only role to report passed; unsupported role explains this fixture mismatch. Retain both reports; use the supported role for the next preparation."
        : "Changing only role to report did not resolve the mismatch. Retain the original and follow-up; investigate the name/role boundary before further preparation.";
      nextGoal = followUp.exit_status === 0 ? "Prepare use of the supported report role after the targeted check" : "Investigate the remaining file name/role mismatch";
    }
    const reportNote = observation => ({ source: "developer Web Planning compatibility harness", text: JSON.stringify(observation),
      observed_at: observation.observed_at, provenance: "imported_unverified", label: "Next check" });
    const args = { repositoryRoot, expectedSnapshotBinding: current.continuity.snapshot.binding,
      changes: { goal: nextGoal, sources: { add: [reportNote(report),
        ...(followUp ? [reportNote(followUp)] : []),
        { source: "deterministic developer driver", text: interpretation, observed_at: null,
          provenance: "derived_interpretation", label: "Next check" }] } } };
    const preview = await call("augnes_preview_repository_work_revision", args);
    const saved = await call("augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding });
    assert.equal(saved.status, "saved");
    const readback = await read();
    assert.equal(readback.continuity.current_work.goal, nextGoal);
    assert(readback.sources.sources.some(note => note.excerpt_text === interpretation));
    return { evidence: "scripted developer example, no independent usefulness or transfer claim", bootstrap,
      prior_source_count: priorSourceCount, report, follow_up: followUp, interpretation, next_goal: nextGoal,
      packet_fingerprint: readback.sources.packet_fingerprint, source_count: readback.sources.sources.length };
  } finally { await client.close(); await transport.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === file) {
  const [mode, first, second] = process.argv.slice(2);
  if (["check", "check-role"].includes(mode)) check(first, mode === "check-role");
  else {
    assert(["start", "continue", "read"].includes(mode), "usage: companion-first-work-consumer.mjs start|continue|read <registered-root> [manifest.json]");
    void consume(mode, first, second).then(value => console.log(JSON.stringify(value))).catch(error => {
      console.error(error.message); process.exitCode = 1;
    });
  }
}
