import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const helperPath = path.join(__dirname, "codex-handoff-preflight.mjs");
const packagePath = path.join(__dirname, "..", "package.json");

assert.ok(existsSync(helperPath), "codex handoff preflight helper must exist");
assert.ok(existsSync(packagePath), "package.json must exist");

const helperSource = readFileSync(helperPath, "utf8");
assertNoRuntimeCalls(helperSource);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["codex:handoff-preflight"],
  "node scripts/codex-handoff-preflight.mjs",
  "package.json must expose codex:handoff-preflight",
);
assert.equal(
  packageJson.scripts?.["smoke:codex-handoff-preflight"],
  "node scripts/smoke-codex-handoff-preflight.mjs",
  "package.json must expose smoke:codex-handoff-preflight",
);
assert.deepEqual(
  Object.keys(packageJson.scripts).filter((name) => name.includes("handoff-preflight")).sort(),
  ["codex:handoff-preflight", "smoke:codex-handoff-preflight"],
  "package.json must add only the requested handoff-preflight scripts",
);

const completePacket = `Codex Handoff Preview
This is a preview/copy packet, not an execution action.

Readiness
- Status: ready
  - Required handoff fields are present in the work brief.

Current runtime
- AUGNES_API_BASE_URL: http://localhost:3000
- CODEX_SCOPE: project:augnes
- CODEX_WORK_ID: AG-276

Copyable start command preview
AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-276 npm run codex:read-brief

Work item
- Title: Safe Codex handoff packet preflight
- Status: ready
- Next action: Validate the copied handoff packet locally before Codex starts.
- Task profile: tooling

Authorization
- Evidence recording: not_applicable
- Proof-only closeout: not_applicable
- Browser verification: not_required

Expected scope
- Expected files:
  - scripts/codex-handoff-preflight.mjs
  - scripts/smoke-codex-handoff-preflight.mjs
- Expected checks:
  - npm run smoke:codex-handoff-preflight
  - npm run typecheck
- Related state keys:
  - coordination.work_contract_card

Forbidden actions
  - No Codex execution from this card.
  - No commit/reject state.
  - No approve/publish/retry/replay/external posting.
  - No merge/auto-merge.
  - No proof/evidence recording controls.

Stop conditions
  - codex:read-brief fails.
  - Work ID is missing or unknown.
  - Scope is missing or ambiguous.
  - Expected scope or forbidden surfaces are ambiguous.
  - Evidence or proof recording is requested without explicit user/Core authorization.

Authority boundaries
  - This preview is read-only.
  - This preview cannot execute Codex.
  - This preview cannot record evidence.
  - This preview cannot record proof.
  - This preview cannot commit or reject Augnes state.
  - This preview cannot approve, publish, retry, replay, or externally post.
  - This preview cannot merge or enable auto-merge.
  - Evidence is not approval.
  - Proof is not approval.
  - A PR is not merge authority.
  - Durable approval remains user/Core gated.
  - Raw DB paths are local-dev fallback only and should not be normal user-facing input.
`;

const completeJson = {
  schema: "augnes.codex_handoff_preview.v0_1",
  packet_kind: "codex_handoff_preview",
  readiness_status: "ready",
  readiness_reasons: ["Required handoff fields are present in the work brief."],
  task_profile: "tooling",
  runtime: {
    endpoint_label: "http://localhost:3000",
    requires_user_core_confirmation: false,
  },
  work: {
    scope: "project:augnes",
    work_id: "AG-276",
    title: "Safe Codex handoff packet preflight",
    status: "ready",
    next_action: "Validate the copied handoff packet locally before Codex starts.",
    related_state_keys: ["coordination.work_contract_card"],
  },
  authorization: {
    evidence_recording: "not_applicable",
    proof_only_closeout: "not_applicable",
    browser_verification: "not_required",
  },
  expected_scope: {
    files: ["scripts/codex-handoff-preflight.mjs", "scripts/smoke-codex-handoff-preflight.mjs"],
    checks: ["npm run smoke:codex-handoff-preflight", "npm run typecheck"],
  },
  forbidden_actions: [
    "No Codex execution from this card.",
    "No commit/reject state.",
    "No approve/publish/retry/replay/external posting.",
    "No merge/auto-merge.",
    "No proof/evidence recording controls.",
  ],
  stop_conditions: [
    "codex:read-brief fails.",
    "Work ID is missing or unknown.",
    "Scope is missing or ambiguous.",
    "Expected scope or forbidden surfaces are ambiguous.",
    "Evidence or proof recording is requested without explicit user/Core authorization.",
  ],
  authority_boundaries: [
    "This preview is read-only.",
    "This preview cannot execute Codex.",
    "This preview cannot record evidence.",
    "This preview cannot record proof.",
    "This preview cannot commit or reject Augnes state.",
    "This preview cannot approve, publish, retry, replay, or externally post.",
    "This preview cannot merge or enable auto-merge.",
    "Evidence is not approval.",
    "Proof is not approval.",
    "A PR is not merge authority.",
    "Durable approval remains user/Core gated.",
    "Raw DB paths are local-dev fallback only and should not be normal user-facing input.",
  ],
  copy_packet: {
    preview_only: true,
    does_not_execute_codex: true,
    does_not_record_evidence: true,
    does_not_record_proof: true,
    does_not_mutate_state: true,
    does_not_merge: true,
  },
};

const completeJsonPacket = packetWithJson(completeJson);

const completeJsonDefault = runHelper({ packet: completeJsonPacket });
assert.equal(completeJsonDefault.status, 0, completeJsonDefault.stderr);
assert.equal(completeJsonDefault.json.ok, true);
assert.equal(completeJsonDefault.json.summary.input_mode, "json_block");
assert.equal(completeJsonDefault.json.summary.schema, "augnes.codex_handoff_preview.v0_1");
assertCheck(completeJsonDefault.json, "json_block", "pass");
assertCheck(completeJsonDefault.json, "json_schema", "pass");
assertCheck(completeJsonDefault.json, "work_id", "pass");
assertCheck(completeJsonDefault.json, "copy_packet_preview_only", "pass");
assertCheck(completeJsonDefault.json, "copy_packet_no_execute", "pass");
assertCheck(completeJsonDefault.json, "copy_packet_no_evidence", "pass");
assertCheck(completeJsonDefault.json, "copy_packet_no_proof", "pass");
assertCheck(completeJsonDefault.json, "copy_packet_no_mutate", "pass");
assertCheck(completeJsonDefault.json, "copy_packet_no_merge", "pass");

const readOnlyLocalCurlJson = cloneJson(completeJson);
readOnlyLocalCurlJson.expected_scope.checks = [
  'curl -sS "http://localhost:3000/api/work/AG-006?scope=project%3Aaugnes" | jq .',
  'curl "http://127.0.0.1:3000/api/work/AG-006/brief?scope=project%3Aaugnes" | jq .work_id',
];
const readOnlyLocalCurlDefault = runHelper({ packet: packetWithJson(readOnlyLocalCurlJson) });
assert.equal(readOnlyLocalCurlDefault.status, 0, readOnlyLocalCurlDefault.stderr);
assertCheck(readOnlyLocalCurlDefault.json, "write_shell_commands", "pass");

for (const unsafeCurlCheck of [
  'curl -sS -X POST "http://localhost:3000/api/work/AG-006" | jq .',
  'curl --request PATCH "http://localhost:3000/api/work/AG-006"',
  'curl -sS --data \'{"ok":true}\' "http://localhost:3000/api/work/AG-006"',
  'curl -sS -d status=ok "http://localhost:3000/api/work/AG-006"',
  'curl -sS -F file=@packet.txt "http://localhost:3000/api/work/AG-006"',
  'curl -sS "http://localhost:3000/api/work/AG-006" > packet.json',
  'curl -sS "http://localhost:3000/api/work/AG-006" | tee packet.json',
]) {
  const unsafeCurlJson = cloneJson(completeJson);
  unsafeCurlJson.expected_scope.checks = [unsafeCurlCheck];
  const unsafeCurlDefault = runHelper({ packet: packetWithJson(unsafeCurlJson) });
  assert.notEqual(unsafeCurlDefault.status, 0, unsafeCurlCheck);
  assertCheck(unsafeCurlDefault.json, "write_shell_commands", "fail");
}

const completeJsonStrict = runHelper({ packet: completeJsonPacket, args: ["--strict"] });
assert.equal(completeJsonStrict.status, 0, completeJsonStrict.stderr);
assert.equal(completeJsonStrict.json.ok, true);
assert.ok(completeJsonStrict.json.checks.every((check) => check.status === "pass"), "complete strict JSON packet must be all pass");

const placeholderRuntimeJson = cloneJson(completeJson);
placeholderRuntimeJson.runtime.endpoint_label = "provided by current Augnes runtime";
placeholderRuntimeJson.runtime.requires_user_core_confirmation = true;
const placeholderRuntimeDefault = runHelper({ packet: packetWithJson(placeholderRuntimeJson) });
assert.equal(placeholderRuntimeDefault.status, 0, placeholderRuntimeDefault.stderr);
assertCheck(placeholderRuntimeDefault.json, "runtime_reference", "warn");
const placeholderRuntimeStrict = runHelper({ packet: packetWithJson(placeholderRuntimeJson), args: ["--strict"] });
assert.notEqual(placeholderRuntimeStrict.status, 0);
assertCheck(placeholderRuntimeStrict.json, "runtime_reference", "fail");

const malformedJsonBlock = `${completePacket}
BEGIN_AUGNES_CODEX_HANDOFF_JSON
{"schema":
END_AUGNES_CODEX_HANDOFF_JSON
`;
const malformedJsonDefault = runHelper({ packet: malformedJsonBlock });
assert.notEqual(malformedJsonDefault.status, 0);
assertCheck(malformedJsonDefault.json, "json_block", "fail");

const duplicateJsonDefault = runHelper({ packet: `${completeJsonPacket}\n${packetWithJson(completeJson)}` });
assert.notEqual(duplicateJsonDefault.status, 0);
assertCheck(duplicateJsonDefault.json, "json_block", "fail");

const unknownSchemaJson = cloneJson(completeJson);
unknownSchemaJson.schema = "augnes.codex_handoff_preview.v9_9";
const unknownSchemaDefault = runHelper({ packet: packetWithJson(unknownSchemaJson) });
assert.equal(unknownSchemaDefault.status, 0, unknownSchemaDefault.stderr);
assertCheck(unknownSchemaDefault.json, "json_schema", "warn");
const unknownSchemaStrict = runHelper({ packet: packetWithJson(unknownSchemaJson), args: ["--strict"] });
assert.notEqual(unknownSchemaStrict.status, 0);
assertCheck(unknownSchemaStrict.json, "json_schema", "fail");

const missingJsonWorkId = cloneJson(completeJson);
delete missingJsonWorkId.work.work_id;
const missingJsonWorkIdDefault = runHelper({ packet: packetWithJson(missingJsonWorkId) });
assert.equal(missingJsonWorkIdDefault.status, 0, missingJsonWorkIdDefault.stderr);
assertCheck(missingJsonWorkIdDefault.json, "work_id", "warn");
const missingJsonWorkIdStrict = runHelper({ packet: packetWithJson(missingJsonWorkId), args: ["--strict"] });
assert.notEqual(missingJsonWorkIdStrict.status, 0);
assertCheck(missingJsonWorkIdStrict.json, "work_id", "fail");

const missingJsonScope = cloneJson(completeJson);
missingJsonScope.expected_scope.files = [];
missingJsonScope.expected_scope.checks = [];
const missingJsonScopeDefault = runHelper({ packet: packetWithJson(missingJsonScope) });
assert.equal(missingJsonScopeDefault.status, 0, missingJsonScopeDefault.stderr);
assertCheck(missingJsonScopeDefault.json, "expected_files", "warn");
assertCheck(missingJsonScopeDefault.json, "expected_checks", "warn");
const missingJsonScopeStrict = runHelper({ packet: packetWithJson(missingJsonScope), args: ["--strict"] });
assert.notEqual(missingJsonScopeStrict.status, 0);
assertCheck(missingJsonScopeStrict.json, "expected_files", "fail");
assertCheck(missingJsonScopeStrict.json, "expected_checks", "fail");

const unsafeJsonLabel = cloneJson(completeJson);
unsafeJsonLabel.forbidden_actions.push("Run Codex");
const unsafeJsonLabelDefault = runHelper({ packet: packetWithJson(unsafeJsonLabel) });
assert.notEqual(unsafeJsonLabelDefault.status, 0);
assertCheck(unsafeJsonLabelDefault.json, "forbidden_labels", "fail");

const demoDbJson = cloneJson(completeJson);
demoDbJson.runtime.endpoint_label = "/tmp/augnes-runtime-dogfood.db";
const demoDbJsonDefault = runHelper({ packet: packetWithJson(demoDbJson) });
assert.notEqual(demoDbJsonDefault.status, 0);
assertCheck(demoDbJsonDefault.json, "demo_db_refs", "fail");

const demoDbFallbackJson = cloneJson(demoDbJson);
demoDbFallbackJson.runtime.local_dev_fallback = true;
const demoDbFallbackDefault = runHelper({ packet: packetWithJson(demoDbFallbackJson) });
assert.notEqual(demoDbFallbackDefault.status, 0);
assertCheck(demoDbFallbackDefault.json, "demo_db_refs", "fail");

const rawDbJson = cloneJson(completeJson);
rawDbJson.runtime.endpoint_label = "/tmp/local-current.db";
const rawDbJsonDefault = runHelper({ packet: packetWithJson(rawDbJson) });
assert.notEqual(rawDbJsonDefault.status, 0);
assertCheck(rawDbJsonDefault.json, "raw_db_refs", "fail");

const fallbackRawDbJson = cloneJson(rawDbJson);
fallbackRawDbJson.runtime.local_dev_fallback = true;
const fallbackRawDbDefault = runHelper({ packet: packetWithJson(fallbackRawDbJson) });
assert.equal(fallbackRawDbDefault.status, 0, fallbackRawDbDefault.stderr);
assertCheck(fallbackRawDbDefault.json, "raw_db_refs", "pass");

const secretLikeJson = cloneJson(completeJson);
secretLikeJson.authorization.note = "GITHUB_TOKEN=ghp_1234567890abcdefghijklmnop";
const secretLikeJsonDefault = runHelper({ packet: packetWithJson(secretLikeJson) });
assert.notEqual(secretLikeJsonDefault.status, 0);
assertCheck(secretLikeJsonDefault.json, "secret_like_values", "fail");

const completeDefault = runHelper({ packet: completePacket });
assert.equal(completeDefault.status, 0, completeDefault.stderr);
assert.equal(completeDefault.json.ok, true);
assert.equal(completeDefault.json.summary.input_mode, "text");
assertCheck(completeDefault.json, "work_id", "pass");
assertCheck(completeDefault.json, "work_title", "pass");
assertCheck(completeDefault.json, "work_status", "pass");
assertCheck(completeDefault.json, "work_next_action", "pass");
assertCheck(completeDefault.json, "evidence_authorization", "pass");
assertCheck(completeDefault.json, "proof_authorization", "pass");
assertCheck(completeDefault.json, "browser_verification", "pass");
assertCheck(completeDefault.json, "forbidden_labels", "pass");

const completeStrict = runHelper({ packet: completePacket, args: ["--strict"] });
assert.equal(completeStrict.status, 0, completeStrict.stderr);
assert.equal(completeStrict.json.ok, true);
assert.ok(completeStrict.json.checks.every((check) => check.status === "pass"), "complete strict packet must be all pass");

const readinessOnlyWorkContextPacket = completePacket
  .replace(
    "Readiness\n- Status: ready\n",
    "Readiness\n- Title: Readiness title only\n- Status: ready\n- Next action: Readiness next action only.\n",
  )
  .replace(
    `Work item
- Title: Safe Codex handoff packet preflight
- Status: ready
- Next action: Validate the copied handoff packet locally before Codex starts.
`,
    "Work item\n",
  );
const readinessOnlyWorkContextDefault = runHelper({ packet: readinessOnlyWorkContextPacket });
assert.equal(readinessOnlyWorkContextDefault.status, 0, readinessOnlyWorkContextDefault.stderr);
assertCheck(readinessOnlyWorkContextDefault.json, "work_title", "warn");
assertCheck(readinessOnlyWorkContextDefault.json, "work_status", "warn");
assertCheck(readinessOnlyWorkContextDefault.json, "work_next_action", "warn");
const readinessOnlyWorkContextStrict = runHelper({ packet: readinessOnlyWorkContextPacket, args: ["--strict"] });
assert.notEqual(readinessOnlyWorkContextStrict.status, 0);
assertCheck(readinessOnlyWorkContextStrict.json, "work_title", "fail");
assertCheck(readinessOnlyWorkContextStrict.json, "work_status", "fail");
assertCheck(readinessOnlyWorkContextStrict.json, "work_next_action", "fail");

const explicitWorkFieldsPacket = completePacket
  .replace(
    "\n\nReadiness\n",
    "\n\nWork title: Explicit safe Codex handoff packet preflight\nWork status: ready\nWork next action: Validate explicit work-prefixed fields before Codex starts.\n\nReadiness\n",
  )
  .replace(
    `Work item
- Title: Safe Codex handoff packet preflight
- Status: ready
- Next action: Validate the copied handoff packet locally before Codex starts.
`,
    "Work item\n",
  );
const explicitWorkFieldsDefault = runHelper({ packet: explicitWorkFieldsPacket });
assert.equal(explicitWorkFieldsDefault.status, 0, explicitWorkFieldsDefault.stderr);
assertCheck(explicitWorkFieldsDefault.json, "work_title", "pass");
assertCheck(explicitWorkFieldsDefault.json, "work_status", "pass");
assertCheck(explicitWorkFieldsDefault.json, "work_next_action", "pass");
const explicitWorkFieldsStrict = runHelper({ packet: explicitWorkFieldsPacket, args: ["--strict"] });
assert.equal(explicitWorkFieldsStrict.status, 0, explicitWorkFieldsStrict.stderr);
assertCheck(explicitWorkFieldsStrict.json, "work_title", "pass");
assertCheck(explicitWorkFieldsStrict.json, "work_status", "pass");
assertCheck(explicitWorkFieldsStrict.json, "work_next_action", "pass");

const missingWorkIdPacket = completePacket
  .replace(/- CODEX_WORK_ID: AG-276\n/g, "")
  .replace(/\sCODEX_WORK_ID=AG-276/g, "");
const missingWorkIdDefault = runHelper({ packet: missingWorkIdPacket });
assert.equal(missingWorkIdDefault.status, 0, missingWorkIdDefault.stderr);
assertCheck(missingWorkIdDefault.json, "work_id", "warn");
const missingWorkIdStrict = runHelper({ packet: missingWorkIdPacket, args: ["--strict"] });
assert.notEqual(missingWorkIdStrict.status, 0);
assertCheck(missingWorkIdStrict.json, "work_id", "fail");

const placeholderWorkIdPacket = completePacket.replaceAll("AG-276", "<provided-work-id>");
const placeholderWorkIdDefault = runHelper({ packet: placeholderWorkIdPacket });
assert.equal(placeholderWorkIdDefault.status, 0, placeholderWorkIdDefault.stderr);
assertCheck(placeholderWorkIdDefault.json, "work_id", "warn");
const placeholderWorkIdStrict = runHelper({ packet: placeholderWorkIdPacket, args: ["--strict"] });
assert.notEqual(placeholderWorkIdStrict.status, 0);
assertCheck(placeholderWorkIdStrict.json, "work_id", "fail");

const missingAuthorizationPacket = completePacket
  .replace(/- Evidence recording: not_applicable\n/g, "")
  .replace(/- Proof-only closeout: not_applicable\n/g, "")
  .replace(/- Browser verification: not_required\n/g, "");
const missingAuthorizationDefault = runHelper({ packet: missingAuthorizationPacket });
assert.equal(missingAuthorizationDefault.status, 0, missingAuthorizationDefault.stderr);
assertCheck(missingAuthorizationDefault.json, "evidence_authorization", "warn");
assertCheck(missingAuthorizationDefault.json, "proof_authorization", "warn");
assertCheck(missingAuthorizationDefault.json, "browser_verification", "warn");
const missingAuthorizationStrict = runHelper({ packet: missingAuthorizationPacket, args: ["--strict"] });
assert.notEqual(missingAuthorizationStrict.status, 0);
assertCheck(missingAuthorizationStrict.json, "evidence_authorization", "fail");
assertCheck(missingAuthorizationStrict.json, "proof_authorization", "fail");
assertCheck(missingAuthorizationStrict.json, "browser_verification", "fail");

const missingScopePacket = completePacket
  .replace(/  - scripts\/codex-handoff-preflight\.mjs\n  - scripts\/smoke-codex-handoff-preflight\.mjs/g, "  - No expected files are listed in the work brief.")
  .replace(/  - npm run smoke:codex-handoff-preflight\n  - npm run typecheck/g, "  - No expected checks are listed in the work brief.");
const missingScopeDefault = runHelper({ packet: missingScopePacket });
assert.equal(missingScopeDefault.status, 0, missingScopeDefault.stderr);
assertCheck(missingScopeDefault.json, "expected_files", "warn");
assertCheck(missingScopeDefault.json, "expected_checks", "warn");
const missingScopeStrict = runHelper({ packet: missingScopePacket, args: ["--strict"] });
assert.notEqual(missingScopeStrict.status, 0);
assertCheck(missingScopeStrict.json, "expected_files", "fail");
assertCheck(missingScopeStrict.json, "expected_checks", "fail");

const runCodexLabel = runHelper({ packet: `${completePacket}\nRun Codex\n` });
assert.notEqual(runCodexLabel.status, 0);
assertCheck(runCodexLabel.json, "forbidden_labels", "fail");

const mergeLabel = runHelper({ packet: `${completePacket}\nMerge PR\nEnable auto-merge\n` });
assert.notEqual(mergeLabel.status, 0);
assertCheck(mergeLabel.json, "forbidden_labels", "fail");

const demoDbRef = runHelper({
  packet: `${completePacket}\nAUGNES_DB_PATH=/tmp/augnes-runtime-dogfood.db\nCurrent runtime confirmation: use this demo DB as current runtime.\n`,
});
assert.notEqual(demoDbRef.status, 0);
assertCheck(demoDbRef.json, "demo_db_refs", "fail");

const excludedDemoDbRef = runHelper({
  packet: `${completePacket}\nDemo DB refs excluded: /tmp/augnes-runtime-dogfood.db is non-current and must not be mixed with current runtime refs.\n`,
});
assert.equal(excludedDemoDbRef.status, 0, excludedDemoDbRef.stderr);
assertCheck(excludedDemoDbRef.json, "demo_db_refs", "pass");

const localFallbackDb = runHelper({
  packet: `${completePacket}\nRaw DB path fallback only if local operator explicitly supplies it: /tmp/local-current.db\nLocal-current DB path, if explicitly supplied: /tmp/local-current.db\nThis is local-dev fallback only.\n`,
});
assert.equal(localFallbackDb.status, 0, localFallbackDb.stderr);
assertCheck(localFallbackDb.json, "raw_db_refs", "pass");

const secretLikeToken = runHelper({ packet: `${completePacket}\nGITHUB_TOKEN=ghp_1234567890abcdefghijklmnop\n` });
assert.notEqual(secretLikeToken.status, 0);
assertCheck(secretLikeToken.json, "secret_like_values", "fail");

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-handoff-preflight-"));
try {
  const packetPath = path.join(tempDir, "packet.txt");
  writeFileSync(packetPath, completeJsonPacket, "utf8");
  const fileInput = runHelper({ args: ["--file", packetPath] });
  assert.equal(fileInput.status, 0, fileInput.stderr);
  assert.equal(fileInput.json.ok, true);
  assert.equal(fileInput.json.summary.input_mode, "json_block");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

const stdinInput = runHelper({ input: completeJsonPacket });
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(stdinInput.json.ok, true);
assert.equal(stdinInput.json.summary.input_mode, "json_block");

const emptyInput = runHelper({ input: "" });
assert.notEqual(emptyInput.status, 0);
assert.equal(emptyInput.json.ok, false);
assertCheck(emptyInput.json, "input", "fail");

console.log(
  JSON.stringify(
    {
      smoke: "codex-handoff-preflight",
      cases: [
        "complete copied handoff packet with JSON block passes default mode",
        "complete copied handoff packet with JSON block passes strict mode",
        "read-only localhost curl GET checks piped to jq are allowed",
        "mutating curl and shell write forms are blocked",
        "JSON block with placeholder runtime warns by default and fails strict",
        "malformed JSON block fails",
        "duplicate JSON blocks fail",
        "unknown JSON schema warns by default and fails strict",
        "missing JSON work.work_id warns by default and fails strict",
        "missing JSON expected files/checks warns by default and fails strict",
        "unsafe forbidden Run Codex label in JSON fails",
        "demo DB ref in JSON fails when used as current runtime",
        "demo DB ref in JSON still fails when local_dev_fallback is true",
        "raw DB path in JSON fails unless explicitly labeled local-dev fallback",
        "secret-like token pattern in JSON fails",
        "--file input works with JSON block",
        "stdin input works with JSON block",
        "text-only copied handoff packet fallback passes default mode",
        "complete copied handoff packet passes default mode",
        "complete copied handoff packet passes strict mode",
        "readiness title/status/next action do not satisfy work item context",
        "explicit top-level Work title/status/next action fields pass",
        "missing CODEX_WORK_ID warns by default and fails strict",
        "placeholder CODEX_WORK_ID warns by default and fails strict",
        "missing evidence/proof/browser authorization warns by default and fails strict",
        "missing expected files/checks warns by default and fails strict",
        "forbidden Run Codex label fails",
        "forbidden merge/auto-merge labels fail",
        "demo DB ref used as current runtime fails",
        "demo DB ref mentioned as explicitly excluded non-current text passes",
        "local-dev DB path explicitly labeled fallback does not fail default",
        "secret-like token pattern fails",
        "empty input fails",
      ],
      helper_runtime_calls_absent: true,
      package_scripts_present: true,
    },
    null,
    2,
  ),
);

function packetWithJson(packetJson, text = completePacket) {
  return `${text}
Structured JSON
BEGIN_AUGNES_CODEX_HANDOFF_JSON
${JSON.stringify(packetJson, null, 2)}
END_AUGNES_CODEX_HANDOFF_JSON
`;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function runHelper({ packet, args = [], input } = {}) {
  const childEnv = { ...process.env };
  delete childEnv.CODEX_HANDOFF_PACKET;

  if (packet !== undefined) {
    childEnv.CODEX_HANDOFF_PACKET = packet;
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
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /from ["']node:https?["']/,
    /from ["']node:net["']/,
    /\bhttps?:\/\/api\./,
    /\/api\/(?:actions|evidence|observe|plan|work|state|publication|delivery)\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `helper must not contain runtime/network/execution calls: ${pattern}`);
  }
}
