// Developer-constructed, deterministic fresh consumer. No model or managed run.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = realpathSync(process.argv[2]);
const require = createRequire(path.join(repository, "apps/augnes_apps/package.json"));
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const client = new Client({ name: "result-successor-fresh-consumer", version: "0.1.0" });
const transport = new StdioClientTransport({ command: process.execPath,
  args: [path.join(repository, "plugins/augnes-operator/mcp/companion-proxy.mjs")],
  env: process.env, stderr: "pipe" });

try {
  await client.connect(transport);
  const call = async (name, args) => {
    const response = await client.callTool({ name, arguments: args });
    assert(response.structuredContent && !response.isError, "Normal Companion read refused");
    return response.structuredContent;
  };
  const resumed = await call("augnes_resume_repository", { repositoryRoot: root });
  assert.equal(resumed.continuity.snapshot.status, "exact");
  const saved = await call("augnes_read_repository_work_sources", { repositoryRoot: root,
    expectedSnapshotBinding: resumed.continuity.snapshot.binding, includeWorkDefinition: true });
  assert.equal(saved.status, "available");
  const requirement = saved.sources.find(source => source.excerpt_text.includes('"profile":"result-successor-notice.v0.1"'));
  assert(requirement, "Changed requirement must be recovered from saved selection");
  assert.equal(requirement.trust_class, "user_declaration");
  const spec = JSON.parse(requirement.excerpt_text);
  assert.equal(spec.profile, "result-successor-notice.v0.1");
  assert.equal(spec.input_file, "notice.json"); assert.equal(spec.output_file, "follow-up.md");
  assert(Number.isSafeInteger(spec.capacity) && spec.capacity > 0 && spec.capacity < 100);
  const obligation = saved.sources.find(source => source.excerpt_text === "Organiser approval remains pending. Do not publish, send invitations or book the room.");
  assert(obligation, "Non-execution obligation must survive preparation");
  assert.equal(obligation.trust_class, "user_declaration");
  assert.equal(obligation.currentness.status, "unknown");
  const correction = saved.sources.find(source => source.excerpt_text.includes("Earlier capacity 12 is historical; use the explicitly requested capacity 24."));
  assert(correction, "Correction must remain attributed alongside historical report");
  const report = saved.sources.find(source => source.excerpt_text.startsWith("Recorded execution:"));
  assert(report); assert.equal(report.trust_class, "imported_unverified");
  assert(saved.sources.every(source => !source.excerpt_text.includes("UNSELECTED_PRIVATE_NOTE")));
  const input = readFileSync(path.join(root, spec.input_file));
  assert.equal(createHash("sha256").update(input).digest("hex"), spec.input_sha256);
  const prior = JSON.parse(input);
  assert.equal(prior.title, spec.title); assert.equal(prior.capacity, 12);
  assert(saved.work_definition.goal.includes(String(spec.capacity)), "Complete task definition must agree with selected requirement");
  assert(saved.work_definition.non_goals.includes("Do not publish or book the room"));
  const content = `# ${spec.title}\n\nDate: ${spec.date}\nCapacity: ${spec.capacity}\n\nOrganiser approval: PENDING\nPublication and room booking: NOT AUTHORISED\n`;
  const output = path.join(root, spec.output_file);
  writeFileSync(output, content, { flag: "wx", mode: 0o600 });
  assert.equal(readFileSync(output, "utf8"), content);
  assert(input.equals(readFileSync(path.join(root, spec.input_file))), "Original artifact remains immutable");
  console.log(JSON.stringify({ status: "pass", pid: process.pid, packet_fingerprint: saved.packet_fingerprint,
    task_identity: saved.task_identity, work_definition: saved.work_definition,
    sources: saved.sources, input_sha256: spec.input_sha256,
    artifact: { file: spec.output_file, content, bytes: Buffer.byteLength(content), sha256: createHash("sha256").update(content).digest("hex") },
    saved_context_used: true, non_execution_obligation: "pending", model_calls: 0,
    evidence_kind: "scripted mechanism; developer authored fixture and consumer" }));
} finally { await client.close(); await transport.close(); }
