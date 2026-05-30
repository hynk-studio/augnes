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

const completeDefault = runHelper({ packet: completePacket });
assert.equal(completeDefault.status, 0, completeDefault.stderr);
assert.equal(completeDefault.json.ok, true);
assertCheck(completeDefault.json, "work_id", "pass");
assertCheck(completeDefault.json, "evidence_authorization", "pass");
assertCheck(completeDefault.json, "proof_authorization", "pass");
assertCheck(completeDefault.json, "browser_verification", "pass");
assertCheck(completeDefault.json, "forbidden_labels", "pass");

const completeStrict = runHelper({ packet: completePacket, args: ["--strict"] });
assert.equal(completeStrict.status, 0, completeStrict.stderr);
assert.equal(completeStrict.json.ok, true);
assert.ok(completeStrict.json.checks.every((check) => check.status === "pass"), "complete strict packet must be all pass");

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
  writeFileSync(packetPath, completePacket, "utf8");
  const fileInput = runHelper({ args: ["--file", packetPath] });
  assert.equal(fileInput.status, 0, fileInput.stderr);
  assert.equal(fileInput.json.ok, true);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

const stdinInput = runHelper({ input: completePacket });
assert.equal(stdinInput.status, 0, stdinInput.stderr);
assert.equal(stdinInput.json.ok, true);

const emptyInput = runHelper({ input: "" });
assert.notEqual(emptyInput.status, 0);
assert.equal(emptyInput.json.ok, false);
assertCheck(emptyInput.json, "input", "fail");

console.log(
  JSON.stringify(
    {
      smoke: "codex-handoff-preflight",
      cases: [
        "complete copied handoff packet passes default mode",
        "complete copied handoff packet passes strict mode",
        "missing CODEX_WORK_ID warns by default and fails strict",
        "placeholder CODEX_WORK_ID warns by default and fails strict",
        "missing evidence/proof/browser authorization warns by default and fails strict",
        "missing expected files/checks warns by default and fails strict",
        "forbidden Run Codex label fails",
        "forbidden merge/auto-merge labels fail",
        "demo DB ref used as current runtime fails",
        "local-dev DB path explicitly labeled fallback does not fail default",
        "secret-like token pattern fails",
        "--file input works",
        "stdin input works",
        "empty input fails",
      ],
      helper_runtime_calls_absent: true,
      package_scripts_present: true,
    },
    null,
    2,
  ),
);

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
