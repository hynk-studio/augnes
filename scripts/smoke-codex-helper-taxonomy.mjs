import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const taxonomyDocPath = "docs/CODEX_HELPER_COMMAND_TAXONOMY.md";
const decisionMemoPath = "docs/DECISION_PROOF_VS_STATE_BOUNDARY_V0_1.md";
const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
const appPackage = JSON.parse(readFileSync("apps/augnes_apps/package.json", "utf8"));

const checkOnlyHelpers = [
  "codex:read-brief",
  "codex:handoff-check",
  "codex:closeout-check",
  "codex:github-comment-readiness",
  "codex:actuation-preview",
];

const proofNativeHelpers = ["codex:record-evidence", "codex:record-completion-proof"];
const proofNativeRequiredPatterns = {
  "codex:record-evidence": /\/api\/evidence\/records/,
  "codex:record-completion-proof": /\/api\/work\/.*\/events/,
};
const compatibilityActionRecordHelpers = ["codex:record-completion", "codex:record-result"];

const checkOnlyForbiddenPatterns = [
  /recordActionResult/,
  /\/api\/actions\/record/,
  /\/api\/evidence\/records/,
  /\/api\/sessions\/bind/,
  /commitStateUpdate/,
  /external\.[a-z0-9_.-]+/,
  /method:\s*["']POST["']/,
  /method:\s*["']PATCH["']/,
  /method:\s*["']PUT["']/,
  /method:\s*["']DELETE["']/,
];

assertFile(taxonomyDocPath);
assertFile(decisionMemoPath);

const taxonomyDoc = readFileSync(taxonomyDocPath, "utf8");
const decisionMemo = readFileSync(decisionMemoPath, "utf8");

assertIncludes(decisionMemo, [
  "Option C is accepted as the product direction",
  "check-only commands must be read-only",
  "proof/evidence recording commands should write proof-native records only",
  "committed state mutation must be explicit",
  "legacy `external.*` entries should be treated as compatibility proof-marker",
]);

assertIncludes(taxonomyDoc, [
  "## Categories",
  "### Check-Only",
  "### Record-Proof",
  "### Commit-State",
  "`codex:handoff-check` is now a read-only state-brief check",
  "`codex:record-evidence`: records `verification_evidence_records` only",
  "`codex:record-completion-proof`: records completion proof",
  "`codex:record-completion`",
  "`codex:record-result`",
  "`external.<action>_recorded` state marker",
  "No Codex commit-state helper is defined yet.",
  "Legacy `external.*` entries remain readable compatibility proof-marker",
]);

assertRootScript("codex:handoff-check");
assertRootScript("smoke:codex-helper-taxonomy");

for (const helper of [...checkOnlyHelpers, ...proofNativeHelpers, ...compatibilityActionRecordHelpers]) {
  assertAppScript(helper);
}

for (const helper of checkOnlyHelpers) {
  const source = readAppScriptSource(helper);
  for (const pattern of checkOnlyForbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${helper} must remain check-only/read-only`);
  }
}

for (const helper of proofNativeHelpers) {
  const source = readAppScriptSource(helper);
  assert.match(source, proofNativeRequiredPatterns[helper], `${helper} should write its documented proof-native record`);
  assert.doesNotMatch(source, /\/api\/actions\/record|recordActionResult|commitStateUpdate|external\./);
}

const actionRecordHelpers = Object.keys(appPackage.scripts)
  .filter((scriptName) => scriptName.startsWith("codex:"))
  .filter((scriptName) => {
    const source = readAppScriptSource(scriptName);
    return /\/api\/actions\/record|recordActionResult/.test(source);
  })
  .sort();

assert.deepEqual(
  actionRecordHelpers,
  [...compatibilityActionRecordHelpers].sort(),
  "Only documented compatibility helpers may use the legacy action-record/external.* path",
);

for (const helper of compatibilityActionRecordHelpers) {
  assert.match(taxonomyDoc, new RegExp(escapeRegExp(`\`${helper}\``)));
}

const committedStateHelpers = Object.keys(appPackage.scripts)
  .filter((scriptName) => scriptName.startsWith("codex:"))
  .filter((scriptName) => {
    const source = readAppScriptSource(scriptName);
    return /commitStateUpdate|commitStateDeltaProposal|rejectStateDeltaProposal|\/api\/state\/[^"']*\/(commit|reject)/.test(source);
  });

for (const helper of committedStateHelpers) {
  assert.match(
    helper,
    /commit-state|state-marker/,
    `${helper} mutates committed state and must use an explicit state-mutation name`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-helper-taxonomy",
      decision_memo_present: true,
      taxonomy_doc_present: true,
      check_only_helpers_read_only: checkOnlyHelpers,
      proof_native_helpers: proofNativeHelpers,
      compatibility_action_record_helpers: compatibilityActionRecordHelpers,
      committed_state_helpers: committedStateHelpers,
    },
    null,
    2,
  ),
);

function assertFile(filePath) {
  if (!existsSync(filePath)) throw new Error(`${filePath} is missing.`);
}

function assertIncludes(content, needles) {
  for (const needle of needles) {
    assert(
      content.includes(needle),
      `Missing required taxonomy text: ${needle}`,
    );
  }
}

function assertRootScript(scriptName) {
  assert(
    rootPackage.scripts && typeof rootPackage.scripts[scriptName] === "string",
    `package.json is missing script: ${scriptName}`,
  );
}

function assertAppScript(scriptName) {
  assert(
    appPackage.scripts && typeof appPackage.scripts[scriptName] === "string",
    `apps/augnes_apps/package.json is missing script: ${scriptName}`,
  );
}

function readAppScriptSource(scriptName) {
  assertAppScript(scriptName);
  const command = appPackage.scripts[scriptName];
  const scriptPath = extractTsxScriptPath(command);
  if (!scriptPath) return "";

  const absolutePath = path.join("apps/augnes_apps", scriptPath);
  assertFile(absolutePath);
  return readFileSync(absolutePath, "utf8");
}

function extractTsxScriptPath(command) {
  const match = command.match(/\btsx\s+([^\s]+)/);
  return match?.[1] ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
