// Disposable protocol client for the connection/recovery integration fixture.
// A read process receives only a registered folder and normal discovery hints.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCanonicalChild } from "./canonical-child-runner.mjs";

const file = fileURLToPath(import.meta.url);
const repository = path.resolve(path.dirname(file), "..");
const sdk = createRequire(path.join(repository, "apps/augnes_apps/package.json"));
const { Client } = sdk("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = sdk("@modelcontextprotocol/sdk/client/stdio.js");

export async function runConnectionRoundtripChild(mode, root, runtimeRoot) {
  assert(["write", "read", "cancel-preview"].includes(mode));
  const env = { ...process.env, AUGNES_RUNTIME_STATE_DIR: runtimeRoot };
  delete env.AUGNES_COMPANION_TEST_MODE;
  delete env.AUGNES_COMPANION_RUNTIME_MANIFEST;
  let output = "", overflow = false;
  const result = await runCanonicalChild({ suite: "companion-connection", label: mode,
    command: process.execPath, args: [file, mode, root], cwd: repository, env,
    timeoutMs: 20_000, heartbeatMs: 0, log: () => {},
    stdout: { write(chunk) { if (Buffer.byteLength(output) + chunk.length <= 128_000) output += chunk; else overflow = true; } },
    stderr: { write() {} },
  });
  assert(!overflow && result.exit_code === 0 && !result.timed_out && result.exit_observed && result.streams_closed &&
    result.cleanup_completed && result.remaining_owned_processes === 0 && result.termination_reason === "natural_exit",
  "connection client must exit naturally with complete cleanup");
  return JSON.parse(output);
}

async function consume(mode, repositoryRoot) {
  assert(path.isAbsolute(repositoryRoot));
  const client = new Client({ name: "connection-roundtrip-fixture", version: "0.1.0" });
  const transport = new StdioClientTransport({ command: process.execPath,
    args: [path.join(repository, "plugins/augnes-operator/mcp/companion-proxy.mjs")],
    env: process.env, stderr: "pipe" });
  try {
    await client.connect(transport);
    const catalog = await client.listTools();
    const call = (name, args) => {
      assert(catalog.tools.some(tool => tool.name === name));
      return client.callTool({ name, arguments: args });
    };
    const resume = () => call("augnes_resume_repository", { repositoryRoot });
    const first = await resume();
    if (first.isError) return { refused: first };
    const read = async resumed => ({ project: resumed.structuredContent.repository_resolution,
      continuity: resumed.structuredContent.continuity,
      sources: await call("augnes_read_repository_work_sources", { repositoryRoot,
        expectedSnapshotBinding: resumed.structuredContent.continuity.snapshot.binding }) });
    if (mode === "read") return read(first);
    const before = first.structuredContent.continuity;
    if (mode === "cancel-preview") {
      const preview = await call("augnes_preview_repository_work_revision", { repositoryRoot,
        expectedSnapshotBinding: before.snapshot.binding, changes: { goal: "취소한 초안 — 저장하지 않음 🧭" } });
      assert.equal(preview.structuredContent.status, "previewed");
      return { cancelled: true, preview_status: preview.structuredContent.status };
    }
    assert.equal(before.current_work.status, "no_current_work");
    const initial = { repositoryRoot, expectedSnapshotBinding: before.snapshot.binding,
      changes: { goal: "한국어 작업 — café / e\u0301 / 🧭", success_criteria: ["정확한 원문과 revision을 다시 읽는다"],
        non_goals: ["모델 실행·권한 확대 없음"] } };
    const preview = await call("augnes_preview_repository_initial_work", initial);
    assert.equal(preview.structuredContent.status, "previewed");
    const created = await call("augnes_define_repository_initial_work", { ...initial, previewBinding: preview.structuredContent.preview_binding });
    assert.equal(created.structuredContent.status, "saved");
    const current = await resume();
    const sources = await read(current);
    assert.deepEqual(sources.sources.structuredContent.sources, []);
    const revision = { repositoryRoot, expectedSnapshotBinding: current.structuredContent.continuity.snapshot.binding,
      changes: { sources: { add: [{ source: "note-ref:연결-복구", text: "첫 줄: 한글 🧭\n둘째 줄: e\u0301 ≠ é\n탭\t과  두 칸 — 원문 보존.",
        provenance: "user_declaration", observed_at: null, label: "Open question" }] } } };
    const compared = await call("augnes_preview_repository_work_revision", revision);
    assert.equal(compared.structuredContent.status, "previewed");
    // The fixture drops the response after the production writer commits.
    // End the client without a retry; a new read process reconciles the result.
    const save = await call("augnes_save_repository_work_revision", { ...revision, previewBinding: compared.structuredContent.preview_binding });
    return { save, first_packet: created.structuredContent.packet_fingerprint };
  } finally { await client.close(); await transport.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === file) {
  const [mode, root] = process.argv.slice(2);
  assert(["write", "read", "cancel-preview"].includes(mode));
  consume(mode, root).then(value => console.log(JSON.stringify(value))).catch(() => {
    console.error("connection_roundtrip_client_failed"); process.exitCode = 1;
  });
}
