import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const helperPath = path.join(__dirname, "ag-work-resume-packet-preflight.mjs");
const packagePath = path.join(rootDir, "package.json");
const designDocPath = path.join(rootDir, "docs", "CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md");
const preflightDocPath = path.join(rootDir, "docs", "AG_WORK_RESUME_PACKET_PREFLIGHT_V0_1.md");

assert.ok(existsSync(helperPath), "AG work resume packet preflight helper must exist");
assert.ok(existsSync(packagePath), "package.json must exist");
assert.ok(existsSync(designDocPath), "cross-local resume design doc must exist");
assert.ok(existsSync(preflightDocPath), "packet preflight doc must exist");

const helperSource = readFileSync(helperPath, "utf8");
assertNoRuntimeCalls(helperSource);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["ag:resume-preflight"],
  "node scripts/ag-work-resume-packet-preflight.mjs",
  "package.json must expose ag:resume-preflight",
);
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-packet-preflight"],
  "node scripts/smoke-ag-work-resume-packet-preflight.mjs",
  "package.json must expose smoke:ag-work-resume-packet-preflight",
);

const designDoc = readFileSync(designDocPath, "utf8");
assert.match(designDoc, /Direct code returns packet data only\./, "docs must say Direct Resume Code is packet retrieval only");
assert.match(designDoc, /not approval/i, "docs must say packet/code is not approval");
assert.match(designDoc, /not Codex execution/i, "docs must say packet/code is not Codex execution");
assert.match(designDoc, /Relay-backed resume code is explicitly not v0\./, "docs must keep relay out of v0");
assert.match(designDoc, /Persistent import\./, "docs must list persistent import as future only");

const completePacket = {
  schema: "augnes.ag_work_resume_packet.v0_2",
  packet_kind: "ag_work_resume_packet",
  packet_id: "resume-packet:ag-123-safe",
  created_at: "2026-05-30T00:00:00.000Z",
  expires_at: null,
  issuer: {
    runtime: "augnes",
    runtime_instance_id: "runtime-instance:local-a",
    source_local_label: "local-a",
    created_by_surface: "cockpit",
    export_event_id: null,
  },
  integrity: {
    canonicalization: "augnes-json-c14n-v0_1",
    payload_hash: "sha256:abc123",
    redaction_report_hash: "sha256:def456",
    signature: null,
  },
  source_work: {
    scope: "project:augnes",
    work_id: "AG-123",
    title: "Cross-local AG resume packet preflight",
    status: "in_progress",
    priority: "now",
    summary: "Add a deterministic packet preflight helper.",
    next_action: "Validate this packet locally before preview.",
    related_state_keys: [],
  },
  git: {
    remote: "https://github.com/hynk-studio/augnes.git",
    base_branch: "main",
    base_commit: "c6f0e9b",
    working_branch: "codex/ag-work-resume-packet-preflight",
    head_commit: "abc123",
    related_pr: null,
    dirty_worktree: false,
  },
  handoff: {
    handoff_id: "handoff:ag-123-safe",
    status: "ready",
    expected_files: [
      "docs/CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md",
      "docs/AG_WORK_RESUME_PACKET_PREFLIGHT_V0_1.md",
      "scripts/ag-work-resume-packet-preflight.mjs",
      "scripts/smoke-ag-work-resume-packet-preflight.mjs",
      "package.json",
    ],
    expected_checks: [
      "npm run typecheck",
      "npm run smoke:ag-work-resume-packet-preflight",
      "git diff --check",
    ],
    expected_execution_surfaces: [],
    forbidden_surfaces: [],
    stop_conditions: [],
    safety_boundaries: [],
  },
  continuity: {
    recent_work_events: [],
    foreign_action_refs: [],
    foreign_evidence_refs: [],
    foreign_session_refs: [],
    foreign_evidence_pack_ref: null,
    proof_marker_note: "state_key:null action records are proof-only",
  },
  target_runtime_policy: {
    preview_only_by_default: true,
    may_map_to_existing_local_work_item: "requires explicit user/Core approval",
    may_create_local_work_item: false,
    may_record_evidence: "requires explicit user/Core approval and known local work_id",
    may_record_proof: "requires explicit user/Core approval and known local work_id",
    may_bind_session: false,
    may_commit_or_reject_state: false,
    may_execute_codex: false,
    may_merge: false,
    may_publish_or_replay: false,
  },
  redaction: {
    raw_db_paths_included: false,
    secrets_included: false,
    tunnel_urls_included: false,
    local_absolute_paths_included: false,
    screenshots_or_media_included: false,
    raw_openai_responses_included: false,
    notes: [],
  },
  bounds: {
    max_recent_work_events: 10,
    max_foreign_evidence_refs: 20,
    summaries_only: true,
    raw_logs_included: false,
  },
};

const completeDefault = runHelper({ packet: completePacket });
assert.equal(completeDefault.status, 0, completeDefault.stderr);
assert.equal(completeDefault.json.ok, true);
assert.equal(completeDefault.json.summary.schema, "augnes.ag_work_resume_packet.v0_2");
assertCheck(completeDefault.json, "schema", "pass");
assertCheck(completeDefault.json, "target_no_execute_codex", "pass");
assertCheck(completeDefault.json, "redaction_no_secrets", "pass");

const completeStrict = runHelper({ packet: completePacket, args: ["--strict"] });
assert.equal(completeStrict.status, 0, completeStrict.stderr);
assert.equal(completeStrict.json.ok, true);
assert.ok(completeStrict.json.checks.every((check) => check.status === "pass"), "complete strict packet must be all pass");

const missingWorkId = clonePacket(completePacket);
delete missingWorkId.source_work.work_id;
const missingWorkIdDefault = runHelper({ packet: missingWorkId });
assert.equal(missingWorkIdDefault.status, 0, missingWorkIdDefault.stderr);
assertCheck(missingWorkIdDefault.json, "source_work_id", "warn");
const missingWorkIdStrict = runHelper({ packet: missingWorkId, args: ["--strict"] });
assert.notEqual(missingWorkIdStrict.status, 0);
assertCheck(missingWorkIdStrict.json, "source_work_id", "fail");

const missingExpectedChecks = clonePacket(completePacket);
missingExpectedChecks.handoff.expected_checks = [];
const missingExpectedChecksDefault = runHelper({ packet: missingExpectedChecks });
assert.equal(missingExpectedChecksDefault.status, 0, missingExpectedChecksDefault.stderr);
assertCheck(missingExpectedChecksDefault.json, "expected_checks", "warn");
const missingExpectedChecksStrict = runHelper({ packet: missingExpectedChecks, args: ["--strict"] });
assert.notEqual(missingExpectedChecksStrict.status, 0);
assertCheck(missingExpectedChecksStrict.json, "expected_checks", "fail");

for (const [field, checkId] of [
  ["may_execute_codex", "target_no_execute_codex"],
  ["may_merge", "target_no_merge"],
  ["may_commit_or_reject_state", "target_no_commit_or_reject"],
  ["may_create_local_work_item", "target_no_create_work_item"],
  ["may_record_evidence", "target_no_record_evidence_auto"],
  ["may_record_proof", "target_no_record_proof_auto"],
]) {
  const unsafeDefaultPacket = clonePacket(completePacket);
  unsafeDefaultPacket.target_runtime_policy[field] = true;
  const unsafeDefault = runHelper({ packet: unsafeDefaultPacket });
  assert.notEqual(unsafeDefault.status, 0);
  assertCheck(unsafeDefault.json, checkId, "fail");
  const unsafeStrict = runHelper({ packet: unsafeDefaultPacket, args: ["--strict"] });
  assert.notEqual(unsafeStrict.status, 0);
  assertCheck(unsafeStrict.json, checkId, "fail");
}

const missingIntegrity = clonePacket(completePacket);
delete missingIntegrity.integrity.payload_hash;
delete missingIntegrity.integrity.redaction_report_hash;
const missingIntegrityStrict = runHelper({ packet: missingIntegrity, args: ["--strict"] });
assert.equal(missingIntegrityStrict.status, 0, missingIntegrityStrict.stderr);
assertCheck(missingIntegrityStrict.json, "integrity_payload_hash", "warn");
assertCheck(missingIntegrityStrict.json, "integrity_redaction_report_hash", "warn");

for (const [field, checkId] of [
  ["secrets_included", "redaction_no_secrets"],
  ["tunnel_urls_included", "redaction_no_tunnel_urls"],
]) {
  const unsafeRedactionPacket = clonePacket(completePacket);
  unsafeRedactionPacket.redaction[field] = true;
  const unsafeRedactionDefault = runHelper({ packet: unsafeRedactionPacket });
  assert.notEqual(unsafeRedactionDefault.status, 0);
  assertCheck(unsafeRedactionDefault.json, checkId, "fail");
  const unsafeRedactionStrict = runHelper({ packet: unsafeRedactionPacket, args: ["--strict"] });
  assert.notEqual(unsafeRedactionStrict.status, 0);
  assertCheck(unsafeRedactionStrict.json, checkId, "fail");
}

const openAiKeyPacket = clonePacket(completePacket);
openAiKeyPacket.redaction.notes.push("OPENAI_API_KEY=sk-test123");
const openAiKey = runHelper({ packet: openAiKeyPacket });
assert.notEqual(openAiKey.status, 0);
assertCheck(openAiKey.json, "unsafe_secret_like_content", "fail");

const githubTokenPacket = clonePacket(completePacket);
githubTokenPacket.redaction.notes.push("GITHUB_TOKEN=ghp_1234567890");
const githubToken = runHelper({ packet: githubTokenPacket });
assert.notEqual(githubToken.status, 0);
assertCheck(githubToken.json, "unsafe_secret_like_content", "fail");

const tunnelPacket = clonePacket(completePacket);
tunnelPacket.redaction.notes.push("https://example.ngrok-free.app/resume");
const tunnel = runHelper({ packet: tunnelPacket });
assert.notEqual(tunnel.status, 0);
assertCheck(tunnel.json, "unsafe_tunnel_urls", "fail");

const rawDbPacket = clonePacket(completePacket);
rawDbPacket.redaction.notes.push("/tmp/augnes-local.db");
const rawDb = runHelper({ packet: rawDbPacket });
assert.notEqual(rawDb.status, 0);
assertCheck(rawDb.json, "unsafe_raw_db_paths", "fail");

const absolutePathPacket = clonePacket(completePacket);
absolutePathPacket.redaction.notes.push("/Users/alice/dev/augnes");
const absolutePath = runHelper({ packet: absolutePathPacket });
assert.notEqual(absolutePath.status, 0);
assertCheck(absolutePath.json, "unsafe_local_absolute_paths", "fail");

const invalidJson = runHelper({ input: "{not-json" });
assert.notEqual(invalidJson.status, 0);
assertCheck(invalidJson.json, "valid_json", "fail");

const unknownSchema = clonePacket(completePacket);
unknownSchema.schema = "augnes.ag_work_resume_packet.v9_9";
const unknownSchemaDefault = runHelper({ packet: unknownSchema });
assert.equal(unknownSchemaDefault.status, 0, unknownSchemaDefault.stderr);
assertCheck(unknownSchemaDefault.json, "schema", "warn");
const unknownSchemaStrict = runHelper({ packet: unknownSchema, args: ["--strict"] });
assert.notEqual(unknownSchemaStrict.status, 0);
assertCheck(unknownSchemaStrict.json, "schema", "fail");

const stdinInput = runHelper({ input: JSON.stringify(completePacket) });
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(stdinInput.json.ok, true);
assert.equal(stdinInput.json.summary.input_mode, "stdin");

const envInput = runHelper({ packet: completePacket });
assert.equal(envInput.status, 0, envInput.stderr);
assert.equal(envInput.json.ok, true);
assert.equal(envInput.json.summary.input_mode, "json");

const tempDir = mkdtempSync(path.join(tmpdir(), "ag-resume-preflight-"));
try {
  const packetPath = path.join(tempDir, "packet.json");
  writeFileSync(packetPath, JSON.stringify(completePacket, null, 2), "utf8");
  const fileInput = runHelper({ args: ["--file", packetPath] });
  assert.equal(fileInput.status, 0, fileInput.stderr);
  assert.equal(fileInput.json.ok, true);
  assert.equal(fileInput.json.summary.input_mode, "file");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-packet-preflight",
      cases: [
        "complete v0.2 packet passes default mode",
        "complete v0.2 packet passes strict mode",
        "missing work ID warns default and fails strict",
        "missing expected checks warns default and fails strict",
        "target policy may_execute_codex true fails both modes",
        "target policy may_merge true fails both modes",
        "target policy may_commit_or_reject_state true fails both modes",
        "target policy may_create_local_work_item true fails both modes",
        "target policy may_record_evidence true fails both modes",
        "target policy may_record_proof true fails both modes",
        "missing optional integrity hashes warn even in strict mode",
        "redaction secrets_included true fails both modes",
        "redaction tunnel_urls_included true fails both modes",
        "packet containing OPENAI_API_KEY=sk-... fails",
        "packet containing GITHUB_TOKEN=ghp_... fails",
        "packet containing a tunnel URL fails",
        "packet containing raw DB path fails",
        "packet containing local absolute path fails",
        "invalid JSON fails",
        "unknown schema warns default and fails strict",
        "stdin input works",
        "AG_WORK_RESUME_PACKET env input works",
        "--file input works",
        "helper source has no network/runtime calls",
        "package script names are present",
        "docs mention Direct Resume Code is retrieval only, not authority",
        "docs explicitly keep relay and persistent import out of v0",
      ],
      helper_runtime_calls_absent: true,
      package_scripts_present: true,
      docs_guardrails_present: true,
    },
    null,
    2,
  ),
);

function runHelper({ packet, args = [], input } = {}) {
  const childEnv = { ...process.env };
  delete childEnv.AG_WORK_RESUME_PACKET;

  if (packet !== undefined) {
    childEnv.AG_WORK_RESUME_PACKET = JSON.stringify(packet);
  }

  const result = spawnSync(process.execPath, [helperPath, ...args], {
    env: childEnv,
    input,
    encoding: "utf8",
  });

  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Helper did not print JSON.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}\n${error}`);
  }

  return { ...result, json };
}

function clonePacket(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertCheck(output, id, status) {
  assert.equal(findCheck(output, id).status, status, `${id} should be ${status}`);
}

function findCheck(output, id) {
  const check = output.checks.find((entry) => entry.id === id);
  assert.ok(check, `missing check ${id}`);
  return check;
}

function assertNoRuntimeCalls(source) {
  const forbiddenPatterns = [
    /from ["']node:child_process["']/,
    /\bspawnSync\s*\(/,
    /\bexecFileSync\s*\(/,
    /\bexecSync\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /from ["']node:https?["']/,
    /from ["']node:net["']/,
    /\bhttps?:\/\/api\./,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `helper must not contain runtime/network/execution calls: ${pattern}`);
  }
}
