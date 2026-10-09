// Deterministic, developer-exposed consumer. No provider or managed execution.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Own executor: the fixed Node syntax check cannot run the inspected program. */
async function syntaxCheck(file) {
  const stat = lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 16_000);
  const input = readFileSync(file);
  let stdout = "", stderr = "";
  const result = await runCanonicalChild({ suite: "ordinary-method-outlook", label: "node-syntax-check",
    command: process.execPath, args: ["--check", file], cwd: path.dirname(file),
    env: { PATH: path.dirname(process.execPath) }, timeoutMs: 5_000, heartbeatMs: 0, log: () => {},
    stdout: { write(chunk) { stdout += chunk; } }, stderr: { write(chunk) { stderr += chunk; } },
  });
  // Exit 1 is a useful diagnostic, never a successful program execution claim.
  const settled = { ...result, exit_code: result.exit_code === 1 ? 0 : result.exit_code };
  assert.equal(canonicalChildAcceptanceFailure(settled, { requireNaturalExit: true }), null);
  assert([0, 1].includes(result.exit_code));
  assert(input.equals(readFileSync(file)), "inspection modified input");
  return { diagnostic: "node --check", runtime: process.version, exit_status: result.exit_code,
    syntax_valid: result.exit_code === 0, stdout, stderr: stderr.replaceAll(realpathSync(path.dirname(file)), "<fixture>").replaceAll(path.dirname(file), "<fixture>"),
    input_sha256: `sha256:${createHash("sha256").update(input).digest("hex")}`,
    observed_at: new Date().toISOString(), cleanup_completed: result.cleanup_completed, remaining_owned_processes: result.remaining_owned_processes };
}

/** Caller supplies a normal MCP tool invocation; neither DB nor raw packet access. */
export async function consumeMethodOutlook(call, repositoryRoot, prerequisiteFile, candidateFile) {
  const read = async () => {
    const resumed = await call("augnes_resume_repository", { repositoryRoot });
    assert.equal(resumed.continuity?.snapshot.status, "exact");
    const value = await call("augnes_read_repository_method_outlook", { repositoryRoot, expectedSnapshotBinding: resumed.continuity.snapshot.binding });
    assert.equal(value.status, "available"); assert.equal(value.applicability.status, "conditional");
    return value;
  };
  const before = await read();
  assert(["observe", "inspect"].includes(before.outlook.action), "example requires relevant inspection availability question");
  const premiseSource = before.outlook.sources.find(s => s.role === "inspection");
  const selected = before.sources.find(s => s.source_binding === premiseSource.source_ref);
  const premise = JSON.parse(selected.excerpt_text);
  assert.equal(premise.profile, "augnes.retry-inspection-input.v0.1");
  assert([null, true].includes(premise.available));
  // The caller supplies a known-valid, task-owned module. This actual check
  // establishes local syntax-check availability, not the stipulated success rate.
  const observation = await syntaxCheck(prerequisiteFile);
  assert.equal(observation.exit_status, 0, "prerequisite failed: preserve output and stop; do not invent availability");
  const note = { source: "ordinary harness Node syntax-check prerequisite", text: JSON.stringify(observation),
    observed_at: observation.observed_at, provenance: "imported_unverified", label: "Next check" };
  const args = { repositoryRoot, expectedSnapshotBinding: before.snapshot_binding, changes: { sources: { add: [note] } } };
  const observationPreview = await call("augnes_preview_repository_work_revision", args);
  assert.equal(observationPreview.status, "previewed");
  const reportRef = observationPreview.sources.after.find(s => s.excerpt_text === note.text).source_binding;
  // Explicit authored interpretation, with unchanged stipulated probabilities.
  const revised = { ...premise, available: true, support_refs: [...new Set([...premise.support_refs, reportRef])] };
  // A new attributed interpretation has its own locator; never guess or copy a withheld one.
  args.changes.sources.replace = [{ source_binding: selected.source_binding, note: { source: "note-ref:ordinary-harness-node-availability",
    text: JSON.stringify(revised), observed_at: observation.observed_at, provenance: "derived_interpretation", label: "Next check" } }];
  const preview = await call("augnes_preview_repository_work_revision", args);
  assert.equal(preview.status, "previewed");
  const saved = await call("augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding });
  // An uncertain outcome ends this example. Resume/readback before any separate decision.
  assert.equal(saved.status, "saved");
  const after = await read();
  assert.equal(after.outlook.action, "inspect");
  assert(after.sources.some(s => s.source_binding === reportRef && s.excerpt_text === note.text));
  const recovered = JSON.parse(after.sources.find(s => s.source_binding === after.outlook.sources.find(x => x.role === "inspection").source_ref).excerpt_text);
  assert.deepEqual(recovered.success, premise.success);
  assert.equal(recovered.available, true);
  // This follow-up happens only after the recovered advice supports inspection.
  // A syntax error means decline program execution; mandatory checks are retained.
  const followUp = await syntaxCheck(candidateFile);
  return { evidence: "developer-constructed deterministic mechanism; no independent judgment or measured probability",
    before: { packet: before.packet, judgment: before.outlook.judgment_id, action: before.outlook.action },
    observation, report_ref: reportRef,
    after: { packet: after.packet, judgment: after.outlook.judgment_id, action: after.outlook.action }, follow_up: followUp,
    next_behavior: followUp.syntax_valid ? "Syntax prerequisite passed; retain every other mandatory check before execution" : "Decline execution of the syntax-invalid candidate; repair it before reconsidering",
    program_executed: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [repositoryRoot, prerequisite, candidate] = process.argv.slice(2);
  assert(repositoryRoot && prerequisite && candidate, "usage: companion-method-outlook-consumer.mjs <registered-root> <known-valid-module> <candidate-module>");
  const require = createRequire(path.join(repository, "apps/augnes_apps/package.json"));
  const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
  const client = new Client({ name: "ordinary-method-outlook-example", version: "0.1.0" });
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(repository, "plugins/augnes-operator/mcp/companion-proxy.mjs")], env: process.env, stderr: "pipe" });
  try {
    await client.connect(transport);
    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert(result.structuredContent && !result.isError, "Companion operation refused; no automatic replacement action");
      return result.structuredContent;
    };
    console.log(JSON.stringify(await consumeMethodOutlook(call, path.resolve(repositoryRoot), path.resolve(prerequisite), path.resolve(candidate))));
  } finally { await client.close(); await transport.close(); }
}
