#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const helperPath = "lib/handoff/build-handoff-from-dogfooding-record.ts";
const packetHelperPath = "lib/handoff/build-conversation-handoff-packet.ts";
const packetTypePath = "types/conversation-handoff-packet.ts";
const dogfoodingTypePath = "types/dogfooding-research-record-runtime-contract.ts";
const fixturePath =
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json";
const packetFixturePath = "fixtures/conversation-handoff-packet.sample.v0.2.json";
const smokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const packetSmokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const docsPath = "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md";
const packetDocsPath = "docs/CONVERSATION_HANDOFF_PACKET_BUILDER_V0_2.md";
const dogfoodingDocsPath = "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const codexBindingDocsPath =
  "docs/CODEX_RESULT_TO_DOGFOODING_RECORD_BINDING_V0_1.md";
const reconciliationDocsPath =
  "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const fixtureVersion = "conversation_handoff_from_dogfooding_record.sample.v0.1";
const bindingVersion = "conversation_handoff_from_dogfooding_record.v0.1";
const packetVersion = "conversation_handoff_packet.v0.2";
const builderVersion = "conversation_handoff_packet_builder.v0.2";
const selectedSlice = "conversation_handoff_packet_from_dogfooding_record_v0_1";
const nextSlice = "dogfooding_record_to_review_memory_proposal_v0_1";
const scope = "project:augnes";
const defaultProfile = "codex_implementation";
const packageScriptName =
  "smoke:conversation-handoff-from-dogfooding-record-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";

const expectedChangedFiles = new Set([
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  "types/dogfooding-to-review-memory-proposal.ts",
  "lib/dogfooding/build-review-memory-proposal.ts",
  "fixtures/dogfooding-to-review-memory-proposal.sample.v0.1.json",
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs",
  "docs/DOGFOODING_TO_REVIEW_MEMORY_PROPOSAL_V0_1.md",
  "types/local-data-export-manifest.ts",
  "lib/local-export/build-local-data-export-manifest.ts",
  "fixtures/local-data-export-manifest.sample.v0.1.json",
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs",
  "docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md",
  "scripts/smoke-local-data-export-policy-v0-1.mjs",
  "lib/git-ledger/build-export-packet-from-local-manifest.ts",
  "fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json",
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs",
  "docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md",
]);

const requiredHelperExports = [
  "buildConversationHandoffPacketInputFromDogfoodingRecordV01",
  "buildHandoffFromDogfoodingRecordV01",
  "buildConversationHandoffFromDogfoodingRecordV01",
  "createConversationHandoffFromDogfoodingRecordAuthorityBoundaryV01",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "PR #873 provides the conversation handoff packet builder used by this slice.",
  "This slice adds no UI, components, route model changes, or API routes.",
  "Dogfooding record to handoff packet is not execution approval.",
  "Dogfooding record to handoff packet is not truth.",
  "Dogfooding record to handoff packet is not proof.",
  "Dogfooding record to handoff packet is not accepted evidence.",
  "Dogfooding record to handoff packet is not Review Memory write.",
  "Dogfooding record to handoff packet is not promotion.",
  "Dogfooding record to handoff packet is not Formation Receipt.",
  "Dogfooding record to handoff packet is not durable Perspective state.",
  "Dogfooding record to handoff packet is not product-write.",
  "Handoff packet is candidate-only conversation/workflow guidance.",
  "Dogfooding record is candidate-only review material.",
  "Changed files are not proof.",
  "Observed files are not proof.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "CI pass is not authority.",
  "Skipped checks are review context, not failure by themselves.",
  "Known warnings are review context, not automatic rejection.",
  "Not-done items are next-task cues, not automatic task creation.",
  "Expected/observed delta is reconciliation context, not approval or rejection.",
  "Next recommended slice is not execution approval.",
  "`dogfooding_record_to_review_memory_proposal_v0_1`",
];

const forbiddenHelperSnippets = [
  "from \"openai\"",
  "from 'openai'",
  "fetch(",
  "NextResponse",
  "Database(",
  "PrismaClient",
  "execFile",
  "spawn",
  "github_api_call_now: true",
  "provider_openai_call_now: true",
  "retrieval_execution_now: true",
  "source_fetch_now: true",
  "review_memory_write_now: true",
  "proof_or_evidence_record_now: true",
  "promotion_execution_now: true",
  "formation_receipt_write_now: true",
  "durable_state_apply_now: true",
  "product_write_now: true",
  "release_deploy_publish_now: true",
];

for (const requiredPath of [
  helperPath,
  packetHelperPath,
  packetTypePath,
  dogfoodingTypePath,
  fixturePath,
  packetFixturePath,
  smokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  docsPath,
  packetDocsPath,
  dogfoodingDocsPath,
  codexBindingDocsPath,
  reconciliationDocsPath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const helperText = read(helperPath);
const packetHelperText = read(packetHelperPath);
const packetTypeText = read(packetTypePath);
const dogfoodingTypeText = read(dogfoodingTypePath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const docsText = read(docsPath);
const packetDocsText = read(packetDocsPath);
const dogfoodingDocsText = read(dogfoodingDocsPath);
const codexBindingDocsText = read(codexBindingDocsPath);
const reconciliationDocsText = read(reconciliationDocsPath);
const packageJson = JSON.parse(read(packagePath));
const indexText = read(indexPath);
const packetSmokeText = read(packetSmokePath);
const codexBindingSmokeText = read(codexBindingSmokePath);
const dogfoodingSmokeText = read(dogfoodingSmokePath);
const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);

assertFixtureVersions();
assertStaticCoverage();
assertSingleRecordBehavior();
assertMultipleRecordBehavior();
assertSummaryOnlyBehavior();
assertProfileBehavior();
assertBlockedInputBehavior();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "conversation-handoff-from-dogfooding-record-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      profiles_checked: fixture.required_profiles.length,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.binding_version, bindingVersion);
  assert.equal(fixture.packet_version, packetVersion);
  assert.equal(fixture.builder_version, builderVersion);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.default_profile, defaultProfile);
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.deepEqual(fixture.post_868_boundary.frozen_routes, [
    "/",
    "/perspective",
    "/workbench",
  ]);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
  assert.equal(fixture.post_868_boundary.route_in_scope, false);
  assert.equal(fixture.post_868_boundary.db_in_scope, false);
}

function assertStaticCoverage() {
  for (const exportedName of requiredHelperExports) {
    assert.ok(
      helperText.includes(`export function ${exportedName}`),
      `helper must export ${exportedName}`,
    );
    assert.equal(typeof helper[exportedName], "function", `${exportedName} must import`);
  }
  assert.ok(
    helperText.includes("buildConversationHandoffPacketV02"),
    "helper must use the existing #873 conversation handoff packet builder",
  );
  assert.ok(
    helperText.includes("buildPrivacyRedactionRuntimeGuardReportV01"),
    "helper must apply existing privacy guard conventions",
  );
  assert.ok(
    packetHelperText.includes("ConversationHandoffPacketBuilderVersionV02"),
    "packet builder must remain present",
  );
  assert.ok(
    packetTypeText.includes("ConversationHandoffPacketInputV02"),
    "packet input type must remain present",
  );
  assert.ok(
    dogfoodingTypeText.includes("DogfoodingResearchRecord"),
    "dogfooding research record type must remain present",
  );
  assert.ok(
    reconciliationDocsText.includes("Core first") &&
      reconciliationDocsText.includes("Web last"),
    "post-868 reconciliation must preserve Core/Web direction",
  );
  assert.ok(
    packetDocsText.includes("Conversation Handoff Packet Builder v0.2"),
    "packet builder docs must remain present",
  );
  assert.ok(
    dogfoodingDocsText.includes("Dogfooding research record is candidate-only review material."),
    "dogfooding docs must preserve candidate-only boundary",
  );
  assert.ok(
    codexBindingDocsText
      .replace(/\s+/g, " ")
      .includes("Codex reports become candidate-only dogfooding research record input."),
    "codex binding docs must preserve candidate-only boundary",
  );
  for (const phrase of requiredDocsPhrases) {
    assertIncludesNormalized(docsText, phrase, `docs phrase ${phrase}`);
  }
  for (const pointer of [helperPath, fixturePath, smokePath, docsPath]) {
    assert.ok(indexText.includes(pointer), `latest index must include ${pointer}`);
  }
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const forbidden of forbiddenHelperSnippets) {
    assert.ok(!helperText.includes(forbidden), `helper must not include ${forbidden}`);
  }
  for (const source of [
    ["packet smoke", packetSmokeText],
    ["codex binding smoke", codexBindingSmokeText],
    ["dogfooding smoke", dogfoodingSmokeText],
  ]) {
    const expectedChangedFilesBlock = changedFilesBlock(source[1]);
    for (const pointer of [helperPath, fixturePath, smokePath, docsPath]) {
      assert.ok(
        expectedChangedFilesBlock.includes(pointer) ||
          exactPathConstantIsInChangedFilesBlock(
            source[1],
            expectedChangedFilesBlock,
            pointer,
          ),
        `${source[0]} changed-file guard must include exact new slice path ${pointer}`,
      );
    }
    assert.ok(
      !expectedChangedFilesBlock.includes("docs/**") &&
        !expectedChangedFilesBlock.includes("lib/**") &&
        !expectedChangedFilesBlock.includes("scripts/**"),
      `${source[0]} changed-file guard must not become a broad future-slice allowlist`,
    );
  }
}

function assertSingleRecordBehavior() {
  const first = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.safe_single_record_input,
  );
  const second = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.safe_single_record_input,
  );
  assert.equal(first.ok, true);
  assert.equal(first.status, fixture.expected.single_record_status);
  assert.deepEqual(first, second, "same input and profile must be deterministic");
  assert.equal(first.profile, defaultProfile);
  assert.ok(first.packet_input, "single record must produce packet input");
  assert.ok(first.packet, "single record must produce packet");
  assert.equal(first.packet.packet_version, packetVersion);
  assert.equal(first.packet.builder_version, builderVersion);
  assert.equal(first.packet.scope, scope);
  assert.equal(first.packet.profile, defaultProfile);
  assert.equal(first.packet.plain_text, second.packet.plain_text);
  assert.equal(first.packet.packet_fingerprint, second.packet.packet_fingerprint);
  assert.deepEqual(first.source_record_refs, [fixture.safe_single_record_input.record_id]);
  assertAllExecutionFlagsFalse(first);
  assertAuthorityBoundaryClosed(first.authority_boundary, "single result boundary");
  assertPacketAuthorityBoundaryClosed(first.packet.authority_boundary, "single packet boundary");
  assertMappings(first.packet_input);
  assertPacketAuthorityText(first.packet.plain_text);
}

function assertMultipleRecordBehavior() {
  const first = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.safe_multiple_records_input,
  );
  const second = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.safe_multiple_records_input,
  );
  assert.equal(first.ok, true);
  assert.equal(first.status, fixture.expected.multiple_record_status);
  assert.deepEqual(first, second, "multiple record build must be deterministic");
  assert.equal(first.profile, "codex_pr_review");
  assert.ok(first.packet_input, "multiple records must produce packet input");
  assert.ok(first.packet, "multiple records must produce packet");
  assert.equal(first.packet.profile, "codex_pr_review");
  assert.ok(
    first.packet_input.observed_files.includes(
      "scripts/smoke-conversation-handoff-packet-v0-2.mjs",
    ),
    "second changed file ref must map to observed_files",
  );
  assert.ok(
    first.packet_input.known_warnings.some((item) =>
      item.includes("warning:privacy-smoke-node-experimental-strip-types"),
    ),
    "known warning refs must be preserved",
  );
  assert.ok(
    first.packet_input.expected_observed_delta.some((item) =>
      item.includes("reconciliation context"),
    ),
    "expected/observed delta refs must remain reconciliation context",
  );
  assert.ok(
    !first.packet_input.observed_checks.some((item) =>
      item.includes("reconciliation context"),
    ),
    "expected/observed delta must stay distinct from validation status",
  );
  assertAllExecutionFlagsFalse(first);
}

function assertSummaryOnlyBehavior() {
  const built = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.safe_summary_input,
  );
  assert.equal(built.ok, true);
  assert.equal(built.status, "built");
  assert.ok(built.packet_input);
  assert.ok(built.packet);
  assert.equal(built.profile, "human_operator_review");
  assert.ok(
    built.packet_input.dogfooding_record_refs.includes(
      "dogfooding-research-record:summary-only:handoff-sample",
    ),
    "summary-only dogfooding refs must be preserved",
  );
  assert.ok(
    built.packet_input.observed_files.includes(
      "lib/handoff/build-handoff-from-dogfooding-record.ts",
    ),
    "summary-only observed files must be preserved",
  );
}

function assertProfileBehavior() {
  const builtByProfile = new Map();
  for (const profile of fixture.required_profiles) {
    const built = helper.buildHandoffFromDogfoodingRecordV01(
      fixture.safe_single_record_input,
      profile,
    );
    assert.equal(built.ok, true, `${profile} must build`);
    assert.ok(built.packet, `${profile} packet must exist`);
    assert.equal(built.profile, profile);
    assert.equal(built.packet.profile, profile);
    assertAllExecutionFlagsFalse(built);
    assertAuthorityBoundaryClosed(built.authority_boundary, `${profile} boundary`);
    assertPacketAuthorityBoundaryClosed(
      built.packet.authority_boundary,
      `${profile} packet boundary`,
    );
    builtByProfile.set(profile, built.packet);
  }
  assert.notEqual(
    builtByProfile.get("chatgpt_strategy").plain_text,
    builtByProfile.get("codex_implementation").plain_text,
    "different profiles should alter packet text",
  );
  assert.notEqual(
    builtByProfile.get("chatgpt_strategy").packet_fingerprint,
    builtByProfile.get("codex_implementation").packet_fingerprint,
    "different profiles should alter packet fingerprints",
  );
}

function assertBlockedInputBehavior() {
  const blockedPrivate = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.blocked_private_or_raw_payload_example,
  );
  assert.equal(blockedPrivate.ok, false);
  assert.equal(blockedPrivate.status, fixture.expected.blocked_private_status);
  assert.equal(blockedPrivate.packet_input, null);
  assert.equal(blockedPrivate.packet, null);
  assertNoUnsafeEcho(blockedPrivate, "private blocked result");
  assertAllExecutionFlagsFalse(blockedPrivate);

  const blockedStructuredAuthority = helper.buildHandoffFromDogfoodingRecordV01(
    fixture.blocked_structured_authority_example,
  );
  assert.equal(blockedStructuredAuthority.ok, false);
  assert.equal(
    blockedStructuredAuthority.status,
    fixture.expected.blocked_authority_status,
  );
  assert.equal(blockedStructuredAuthority.packet_input, null);
  assert.equal(blockedStructuredAuthority.packet, null);
  assertNoUnsafeEcho(blockedStructuredAuthority, "structured authority blocked result");
  assertAllExecutionFlagsFalse(blockedStructuredAuthority);

  for (const testCase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const result = helper.buildHandoffFromDogfoodingRecordV01(
      authorityStringClaimInput(testCase),
    );
    assert.equal(result.ok, false, `${testCase.case_id} must be blocked`);
    assert.equal(
      result.status,
      fixture.expected.blocked_authority_status,
      `${testCase.case_id} status`,
    );
    assert.equal(result.packet_input, null, `${testCase.case_id} packet input`);
    assert.equal(result.packet, null, `${testCase.case_id} packet`);
    assertBlockedPhraseNotEchoed(result, testCase, `${testCase.case_id} result`);
    assertAllExecutionFlagsFalse(result);
  }

  for (const testCase of fixture.allowed_negated_authority_string_cases) {
    const result = helper.buildHandoffFromDogfoodingRecordV01(
      authorityStringClaimInput(testCase),
    );
    assert.equal(result.ok, true, `${testCase.case_id} must remain allowed`);
    assert.equal(result.status, "built", `${testCase.case_id} status`);
    assert.ok(result.packet, `${testCase.case_id} packet`);
  }
}

function assertMappings(packetInput) {
  const expected = fixture.expected.required_packet_input_mappings;
  assert.ok(
    packetInput.observed_files.includes(expected.changed_file_ref),
    "changed_file_refs must map to observed_files",
  );
  assert.ok(
    packetInput.observed_checks.includes(expected.validation_ref),
    "validation_refs must map to observed_checks",
  );
  assert.ok(
    packetInput.validation_commands.includes(
      `candidate-validation-ref:${expected.validation_ref}`,
    ),
    "validation_refs must also map to validation_commands as candidate refs",
  );
  assert.ok(
    packetInput.skipped_checks.includes(expected.skipped_check_ref),
    "skipped_check_refs must map to skipped_checks with context",
  );
  assert.ok(
    packetInput.known_warnings.includes(expected.known_warning_ref),
    "known_warning_refs must map to known_warnings with context",
  );
  assert.ok(
    packetInput.not_done_items.includes(expected.not_done_ref),
    "not_done_refs must map to not_done_items with next-task cue context",
  );
  assert.ok(
    packetInput.expected_observed_delta.includes(expected.expected_observed_delta_ref),
    "expected_observed_delta_refs must map to expected_observed_delta",
  );
  assert.ok(
    packetInput.unresolved_tensions.some((item) =>
      item.includes("review-cue-context:inspect_changed_files"),
    ),
    "review_cues must map to unresolved or review context",
  );
  assert.ok(
    packetInput.not_done_items.some((item) =>
      item.includes("review-cue-not-done-context:preserve_not_done_item"),
    ),
    "not-done review cues must map to not_done context",
  );
  assert.ok(
    !packetInput.observed_checks.includes(expected.expected_observed_delta_ref),
    "expected/observed delta must not become validation approval or rejection",
  );
  assert.ok(
    packetInput.next_recommended_slice === nextSlice,
    "next recommended slice must be the expected cue",
  );
}

function assertPacketAuthorityText(plainText) {
  for (const line of fixture.expected.required_authority_boundary_lines) {
    assert.ok(
      plainText.includes(line),
      `packet plain text must include authority line ${line}`,
    );
  }
}

function assertChangedFileScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.doesNotMatch(filePath, /^components\//, "no component files may change");
    assert.doesNotMatch(filePath, /^app\//, "no route or API files may change");
    assert.doesNotMatch(filePath, /^lib\/db\//, "no DB schema files may change");
    assert.doesNotMatch(filePath, /migrations/i, "no migration files may change");
    assert.doesNotMatch(
      filePath,
      /provider|retrieval|source-fetch/i,
      "no provider/retrieval/source-fetch files may change",
    );
  }
}

function authorityStringClaimInput(testCase) {
  const input = clone(fixture.safe_single_record_input);
  input.record_id = `dogfooding-research-record:${testCase.case_id}`;
  input.normalized_summary = "Authority string test case.";
  input.review_cues = [];
  const phrase = phraseForCase(testCase);
  if (testCase.target === "review_cues") {
    input.review_cues = [
      {
        cue_kind: "check_authority_boundary",
        public_safe_summary: phrase,
        candidate_only: true,
      },
    ];
  } else {
    input.normalized_summary = phrase;
  }
  return input;
}

function phraseForCase(testCase) {
  if (Array.isArray(testCase.phrase_parts)) return testCase.phrase_parts.join(" ");
  return testCase.phrase;
}

function assertAllExecutionFlagsFalse(value) {
  for (const key of fixture.expected.forbidden_execution_flags_false) {
    assert.equal(value[key], false, `${key} must stay false`);
  }
}

function assertAuthorityBoundaryClosed(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must exist`);
  for (const flag of fixture.expected.forbidden_authority_flags_false) {
    assert.equal(boundary[flag], false, `${label} ${flag} must stay false`);
  }
}

function assertPacketAuthorityBoundaryClosed(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must exist`);
  for (const flag of [
    "ui_now",
    "component_now",
    "provider_openai_call_now",
    "source_fetch_now",
    "retrieval_execution_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "review_memory_write_now",
    "promotion_execution_now",
    "formation_receipt_write_now",
    "durable_state_apply_now",
    "product_write_now",
    "github_api_call_now",
    "git_write_now",
    "github_git_actuation_now",
    "release_deploy_publish_now",
    "handoff_packet_is_execution_approval",
    "observed_files_are_proof",
    "validation_pass_is_approval",
    "validation_failure_is_rejection",
    "ci_pass_is_authority",
    "ci_failure_is_rejection",
    "next_recommended_slice_is_execution_approval",
  ]) {
    assert.equal(boundary[flag], false, `${label} ${flag} must stay false`);
  }
}

function collectChangedFiles() {
  const outputs = [
    execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }),
    execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
    }),
  ];
  return [...new Set(outputs.flatMap((output) => output.split(/\r?\n/).filter(Boolean)))].sort();
}

function assertNoUnsafeEcho(value, label) {
  const text = JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_HIDDEN_REASONING",
    "SAFE_MARKER_PRIVATE_URL",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "SAFE_MARKER_SECRET_TOKEN",
  ]) {
    assert.ok(!text.includes(marker), `${label} must not echo ${marker}`);
  }
  assert.ok(!text.includes("\"enabled\""), `${label} must not echo blocked value`);
}

function assertBlockedPhraseNotEchoed(value, testCase, label) {
  const phrase = phraseForCase(testCase);
  assert.ok(!JSON.stringify(value).includes(phrase), `${label} must not echo blocked phrase`);
}

function assertIncludesNormalized(source, phrase, label) {
  assert.ok(
    source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " ")),
    `${label} must be present`,
  );
}

function changedFilesBlock(source) {
  const start = source.indexOf("const expectedChangedFiles = new Set([");
  assert.notEqual(start, -1, "expectedChangedFiles block must exist");
  const end = source.indexOf("]);", start);
  assert.notEqual(end, -1, "expectedChangedFiles block must terminate");
  return source.slice(start, end);
}

function exactPathConstantIsInChangedFilesBlock(source, block, pointer) {
  const escaped = pointer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`const\\s+([A-Za-z0-9_]+)\\s*=\\s*["']${escaped}["']`),
  );
  return Boolean(match && block.includes(match[1]));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}
