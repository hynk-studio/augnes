#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const helperPath = "lib/dogfooding/codex-result-to-dogfooding-record.ts";
const normalizerPath = "lib/dogfooding/codex-result-report-normalizer.ts";
const storePath = "lib/dogfooding/dogfooding-record-store.ts";
const typePath = "types/dogfooding-research-record-runtime-contract.ts";
const routePath = "app/api/dogfooding/research-records/route.ts";
const fixturePath = "fixtures/codex-result-to-dogfooding-record.sample.v0.1.json";
const codexFixturePath = "fixtures/codex-result-report-ingestion.sample.v0.1.json";
const researchFixturePath =
  "fixtures/dogfooding-research-record-runtime.sample.v0.1.json";
const researchSmokePath = "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const smokePath = "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const docsPath = "docs/CODEX_RESULT_TO_DOGFOODING_RECORD_BINDING_V0_1.md";
const researchDocsPath = "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const reconciliationDocsPath = "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const conversationHandoffTypePath = "types/conversation-handoff-packet.ts";
const conversationHandoffHelperPath =
  "lib/handoff/build-conversation-handoff-packet.ts";
const conversationHandoffFixturePath =
  "fixtures/conversation-handoff-packet.sample.v0.2.json";
const conversationHandoffSmokePath =
  "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const conversationHandoffDocsPath =
  "docs/CONVERSATION_HANDOFF_PACKET_BUILDER_V0_2.md";
const dogfoodingRecordHandoffHelperPath =
  "lib/handoff/build-handoff-from-dogfooding-record.ts";
const dogfoodingRecordHandoffFixturePath =
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json";
const dogfoodingRecordHandoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const dogfoodingRecordHandoffDocsPath =
  "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md";

const fixtureVersion = "codex_result_to_dogfooding_record.sample.v0.1";
const bindingVersion = "codex_result_report_to_dogfooding_record_binding.v0.1";
const selectedSlice = "codex_result_report_to_dogfooding_record_binding_v0_1";
const nextSlice = "conversation_handoff_packet_builder_v0_2";
const inputVersion = "codex_result_report_input.v0.1";
const normalizedRecordVersion = "codex_result_report_ingestion_record.v0.1";
const dogfoodingInputVersion = "dogfooding_research_record_input.v0.1";
const dogfoodingRecordVersion = "dogfooding_research_record.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:codex-result-to-dogfooding-record-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";

const expectedChangedFiles = new Set([
  helperPath,
  fixturePath,
  smokePath,
  researchSmokePath,
  docsPath,
  packagePath,
  indexPath,
  conversationHandoffTypePath,
  conversationHandoffHelperPath,
  conversationHandoffFixturePath,
  conversationHandoffSmokePath,
  conversationHandoffDocsPath,
  dogfoodingRecordHandoffHelperPath,
  dogfoodingRecordHandoffFixturePath,
  dogfoodingRecordHandoffSmokePath,
  dogfoodingRecordHandoffDocsPath,
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
  "types/runtime-audit-event.ts",
  "lib/runtime-audit/audit-event-store.ts",
  "fixtures/selected-runtime-audit-event-store.sample.v0.1.json",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md",
  "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md",
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json",
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs",
]);

const requiredHelperExports = [
  "buildDogfoodingResearchRecordInputFromCodexResultReportV01",
  "convertNormalizedCodexResultReportToDogfoodingRecordInputV01",
  "convertRawCodexResultReportToDogfoodingRecordInputV01",
  "createCodexResultDogfoodingRecordIdV01",
  "createCodexResultToDogfoodingRecordIdempotencyKeyV01",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "PR #871 provides the dogfooding research record runtime used by this binding.",
  "This slice adds no UI.",
  "Codex reports become candidate-only dogfooding research record input.",
  "Codex report to dogfooding record is not proof.",
  "Codex report to dogfooding record is not accepted evidence.",
  "Codex report to dogfooding record is not Review Memory write.",
  "Codex report to dogfooding record is not promotion.",
  "Codex report to dogfooding record is not Formation Receipt.",
  "Codex report to dogfooding record is not durable Perspective state.",
  "Codex report to dogfooding record is not product-write.",
  "Codex report is not execution approval.",
  "PR body is not truth.",
  "Changed files are not proof.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "Smoke pass is not evidence.",
  "Smoke failure is diagnostic, not automatic rejection.",
  "CI pass is not authority.",
  "CI failure is diagnostic, not automatic rejection.",
  "Git refs and GitHub PR refs are references only.",
  "`conversation_handoff_packet_builder_v0_2`",
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
  normalizerPath,
  storePath,
  typePath,
  routePath,
  fixturePath,
  codexFixturePath,
  researchFixturePath,
  researchSmokePath,
  smokePath,
  docsPath,
  researchDocsPath,
  reconciliationDocsPath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const helperText = read(helperPath);
const normalizerText = read(normalizerPath);
const storeText = read(storePath);
const docsText = read(docsPath);
const researchDocsText = read(researchDocsPath);
const reconciliationDocsText = read(reconciliationDocsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(read(packagePath));
const indexText = read(indexPath);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);
const normalizer = await import(pathToFileURL(`${process.cwd()}/${normalizerPath}`).href);
const store = await import(pathToFileURL(`${process.cwd()}/${storePath}`).href);

assertFixtureVersions();
assertStaticCoverage();
assertConversionBehavior();
assertBlockedInputBehavior();
assertStoreIntegration();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-to-dogfooding-record-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      record_id: fixture.expected_conversion.record_id,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.binding_version, bindingVersion);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.equal(fixture.input_version, inputVersion);
  assert.equal(fixture.normalized_record_version, normalizedRecordVersion);
  assert.equal(fixture.dogfooding_input_version, dogfoodingInputVersion);
  assert.equal(fixture.dogfooding_record_version, dogfoodingRecordVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
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
    helperText.includes("normalizeCodexResultReportV01"),
    "helper must invoke the existing Codex result normalizer",
  );
  assert.ok(
    helperText.includes("createDogfoodingResearchRecordAuthorityBoundaryV01"),
    "helper must reuse the dogfooding research record authority boundary",
  );
  assert.ok(
    normalizerText.includes("createCodexResultReportFingerprintV01"),
    "existing normalizer must preserve report fingerprints",
  );
  assert.ok(
    storeText.includes("buildDogfoodingResearchRecordV01"),
    "existing dogfooding store builder must remain available",
  );
  assert.ok(
    researchDocsText.includes("Dogfooding research record is candidate-only review material."),
    "research record runtime docs must preserve candidate-only boundary",
  );
  assert.ok(
    reconciliationDocsText.includes("dogfooding_record_runtime_store_route_v0_1"),
    "post-868 reconciliation must point to the prerequisite dogfooding slice",
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
  assert.ok(
    !helperText.includes("app/api/dogfooding/research-records"),
    "helper must not add or import route behavior",
  );
}

function assertConversionBehavior() {
  const normalized = normalizer.normalizeCodexResultReportV01(
    fixture.raw_codex_result_report_input_example,
  );
  assert.equal(normalized.record_version, normalizedRecordVersion);
  assert.equal(normalized.scope, scope);
  assert.equal(normalized.status, fixture.expected_conversion.normalized_report_status);
  assert.equal(
    normalized.report_fingerprint,
    normalizer.normalizeCodexResultReportV01(
      fixture.raw_codex_result_report_input_example,
    ).report_fingerprint,
    "normalizer fingerprint must be deterministic",
  );

  const fromNormalized =
    helper.convertNormalizedCodexResultReportToDogfoodingRecordInputV01(normalized);
  const fromRaw = helper.convertRawCodexResultReportToDogfoodingRecordInputV01(
    fixture.raw_codex_result_report_input_example,
  );
  assert.equal(fromNormalized.ok, true);
  assert.equal(fromNormalized.status, fixture.expected_conversion.status);
  assert.equal(fromRaw.ok, true);
  assert.equal(fromRaw.status, fixture.expected_conversion.status);
  assert.deepEqual(
    fromRaw.dogfooding_record_input,
    fromNormalized.dogfooding_record_input,
    "raw conversion must pass through normalizer before producing the same dogfooding input",
  );
  assert.equal(fromRaw.idempotency_key, fixture.expected_conversion.idempotency_key);
  assertAllBindingExecutionFlagsFalse(fromRaw);

  const input = fromRaw.dogfooding_record_input;
  assert.ok(input, "valid raw conversion must produce dogfooding input");
  assert.equal(input.input_version, dogfoodingInputVersion);
  assert.equal(input.scope, scope);
  assert.equal(input.record_id, fixture.expected_conversion.record_id);
  assert.equal(input.record_kind, fixture.expected_conversion.record_kind);
  assert.equal(input.operator_actor_ref, normalized.operator_actor_ref);
  assert.deepEqual(input.pr_refs, normalized.pr_refs);
  assert.deepEqual(input.branch_refs, [normalized.branch_ref]);
  assert.deepEqual(input.commit_refs, normalized.commit_refs);
  assert.deepEqual(input.changed_file_refs, normalized.changed_file_refs);
  assert.deepEqual(input.validation_refs, normalized.observed_check_refs);
  assert.deepEqual(input.skipped_check_refs, normalized.skipped_check_refs);
  assert.deepEqual(input.known_warning_refs, normalized.known_warning_refs);
  assert.deepEqual(input.not_done_refs, normalized.not_done_refs);
  assert.deepEqual(
    input.expected_observed_delta_refs,
    normalized.expected_observed_delta_refs,
  );
  assert.ok(input.source_refs.includes(selectedSlice), "source refs must include binding slice");
  assert.ok(
    input.source_refs.includes("codex_result_report_ingestion_v0_1"),
    "source refs must include normalizer ref",
  );
  assert.ok(
    input.source_refs.includes("dogfooding_record_runtime_store_route_v0_1"),
    "source refs must include dogfooding runtime ref",
  );
  assert.ok(
    input.source_refs.some((ref) => ref.startsWith("codex-result-report-fingerprint:")),
    "source refs must preserve report fingerprint",
  );
  assert.ok(
    input.source_refs.some((ref) => ref.startsWith("codex-result-report-reason-code:")),
    "source refs must preserve report reason codes as candidate context",
  );
  assert.ok(
    input.review_cues.some((cue) =>
      String(cue).includes("codex-result-review-cue:inspect_changed_files"),
    ),
    "input review cues must preserve normalizer review cue kinds",
  );
  for (const phrase of [
    "Codex report to dogfooding record is not proof.",
    "Codex report to dogfooding record is not accepted evidence.",
    "Codex report is not execution approval.",
    "PR body is not truth.",
    "Changed files are not proof.",
    "Validation pass is not approval.",
    "Validation failure is not automatic rejection.",
    "Smoke pass is not evidence.",
    "Smoke failure is diagnostic, not automatic rejection.",
    "CI pass is not authority.",
    "CI failure is diagnostic, not automatic rejection.",
  ]) {
    assert.ok(input.boundary_notes.includes(phrase), `input boundary note ${phrase}`);
  }
  for (const deltaRef of fixture.raw_codex_result_report_input_example.expected_observed_delta) {
    assert.ok(
      input.expected_observed_delta_refs.includes(deltaRef),
      `expected/observed delta must stay separate: ${deltaRef}`,
    );
    assert.ok(
      !input.validation_refs.includes(deltaRef),
      `expected/observed delta must not become validation approval/rejection: ${deltaRef}`,
    );
  }
  assertDogfoodingBoundaryClosed(input.authority_boundary, "converted input boundary");
}

function assertBlockedInputBehavior() {
  const privateResult = helper.convertRawCodexResultReportToDogfoodingRecordInputV01(
    fixture.blocked_private_or_raw_report_example.input,
  );
  assert.equal(privateResult.ok, false);
  assert.equal(privateResult.status, fixture.blocked_private_or_raw_report_example.expected_status);
  assert.equal(privateResult.dogfooding_record_input, null);
  assertNoUnsafeEcho(privateResult, "private binding result");
  assertAllBindingExecutionFlagsFalse(privateResult);

  const structuredAuthorityResult =
    helper.convertRawCodexResultReportToDogfoodingRecordInputV01(
      fixture.blocked_structured_authority_report_example.input,
    );
  assert.equal(structuredAuthorityResult.ok, false);
  assert.equal(
    structuredAuthorityResult.status,
    fixture.blocked_structured_authority_report_example.expected_status,
  );
  assert.equal(structuredAuthorityResult.dogfooding_record_input, null);
  assertNoUnsafeEcho(structuredAuthorityResult, "structured authority binding result");
  assertAllBindingExecutionFlagsFalse(structuredAuthorityResult);

  for (const testCase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const rawInput = authorityStringClaimReportInput(testCase);
    const conversion = helper.convertRawCodexResultReportToDogfoodingRecordInputV01(rawInput);
    assert.equal(conversion.ok, true, `${testCase.case_id} conversion can produce candidate input`);
    const built = store.buildDogfoodingResearchRecordV01(
      conversion.dogfooding_record_input,
    );
    assert.equal(built.ok, false, `${testCase.case_id} dogfooding build must be blocked`);
    assert.equal(built.status, "blocked_forbidden_authority");
    assert.ok(
      built.privacy_report.findings.some(
        (finding) => finding.finding_kind === "forbidden_authority_phrase",
      ),
      `${testCase.case_id} must include forbidden authority phrase finding`,
    );
    assertBlockedPhraseNotEchoed(built, testCase, `${testCase.case_id} blocked result`);
  }

  for (const testCase of fixture.allowed_negated_authority_string_cases) {
    const rawInput = authorityStringClaimReportInput(testCase);
    const conversion = helper.convertRawCodexResultReportToDogfoodingRecordInputV01(rawInput);
    assert.equal(conversion.ok, true, `${testCase.case_id} conversion must remain allowed`);
    const built = store.buildDogfoodingResearchRecordV01(
      conversion.dogfooding_record_input,
    );
    assert.equal(built.ok, true, `${testCase.case_id} dogfooding build must remain allowed`);
    assert.equal(built.status, "created");
  }
}

function assertStoreIntegration() {
  const conversion = helper.convertRawCodexResultReportToDogfoodingRecordInputV01(
    fixture.raw_codex_result_report_input_example,
  );
  const built = store.buildDogfoodingResearchRecordV01(conversion.dogfooding_record_input);
  assert.equal(built.ok, true);
  assert.equal(built.status, "created");
  assert.ok(built.record, "dogfooding builder must return record");
  const record = built.record;
  assert.equal(record.record_version, dogfoodingRecordVersion);
  assert.equal(record.record_id, fixture.expected_conversion.record_id);
  assert.equal(record.record_kind, fixture.expected_conversion.record_kind);
  assert.deepEqual(
    record.review_cues.map((cue) => cue.cue_kind),
    fixture.expected_conversion.expected_review_cue_kinds,
  );
  for (const reasonCode of fixture.expected_conversion.expected_reason_codes) {
    assert.ok(record.reason_codes.includes(reasonCode), `record reason ${reasonCode}`);
  }
  assertDogfoodingBoundaryClosed(record.authority_boundary, "built record boundary");

  const db = new Database(":memory:");
  try {
    store.ensureDogfoodingResearchRecordStoreSchemaV01(db);
    const created = store.createDogfoodingResearchRecordFromRecordV01(record, db);
    assert.equal(created.ok, true);
    assert.equal(created.status, "created");
    assertAllDogfoodingExecutionFlagsFalse(created);

    const duplicate = store.createDogfoodingResearchRecordFromRecordV01(record, db);
    assert.equal(duplicate.ok, true);
    assert.equal(duplicate.status, "duplicate_record");
    assert.equal(duplicate.idempotent_replay, true);

    const read = store.readDogfoodingResearchRecordV01(record.record_id, db);
    assert.equal(read.ok, true);
    assert.equal(read.status, "read");
    assert.deepEqual(read.record, record);
  } finally {
    db.close();
  }
}

function authorityStringClaimReportInput(testCase) {
  const input = clone(fixture.raw_codex_result_report_input_example);
  input.report_id = `codex-result-report:binding-${testCase.case_id}`;
  input.expected_files = [];
  input.observed_files = [];
  input.expected_checks = [];
  input.observed_checks = [];
  input.validation_commands = [];
  input.skipped_checks = [];
  input.known_warnings = [];
  input.changed_files_summary = [];
  input.not_done_items = [];
  input.expected_observed_delta = [];
  input.boundary_notes = ["Authority string claim binding test case."];
  const phrase = phraseForCase(testCase);
  if (testCase.target === "boundary_notes") {
    input.codex_claimed_summary = "Boundary note authority string claim test.";
    input.boundary_notes = [phrase];
  } else {
    input.codex_claimed_summary = phrase;
  }
  return input;
}

function phraseForCase(testCase) {
  if (Array.isArray(testCase.phrase_parts)) return testCase.phrase_parts.join(" ");
  return testCase.phrase;
}

function assertAllBindingExecutionFlagsFalse(value) {
  for (const flag of fixture.expected.forbidden_execution_flags_false) {
    assert.equal(value[flag], false, `${flag} must stay false`);
  }
}

function assertAllDogfoodingExecutionFlagsFalse(value) {
  for (const key of [
    "review_memory_written",
    "proof_or_evidence_created",
    "claim_or_evidence_written",
    "promotion_executed",
    "formation_receipt_written",
    "durable_state_mutated",
    "product_write_executed",
    "github_git_actuated",
    "provider_called",
    "retrieval_executed",
    "source_fetched",
    "release_deploy_publish_executed",
  ]) {
    assert.equal(value[key], false, `${key} must stay false`);
  }
  assertDogfoodingBoundaryClosed(value.authority_boundary, "store result boundary");
}

function assertDogfoodingBoundaryClosed(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must exist`);
  for (const flag of fixture.expected.dogfooding_forbidden_authority_flags_false) {
    assert.equal(boundary[flag], false, `${label} ${flag} must stay false`);
  }
}

function assertChangedFileScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.doesNotMatch(filePath, /^components\//, "no component files may change");
    assert.doesNotMatch(filePath, /^app\/(?:page|perspective|workbench)/, "no public route model files may change");
    assert.doesNotMatch(filePath, /^app\/api\//, "no new API route files may change");
    assert.doesNotMatch(filePath, /^lib\/db\//, "no DB schema files may change");
    assert.doesNotMatch(filePath, /migrations/i, "no migration files may change");
    assert.doesNotMatch(filePath, /provider|retrieval|source-fetch/i, "no provider/retrieval/source-fetch files may change");
  }
}

function collectChangedFiles() {
  const outputs = [
    execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }),
    execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" }),
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
  assert.ok(!text.includes("\"enabled\""), `${label} must not echo blocked authority value`);
}

function assertBlockedPhraseNotEchoed(value, testCase, label) {
  const phrase = phraseForCase(testCase);
  assert.ok(!JSON.stringify(value).includes(phrase), `${label} must not echo blocked phrase`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertIncludesNormalized(source, needle, label) {
  assert.ok(
    source.replace(/\s+/g, " ").includes(needle.replace(/\s+/g, " ")),
    `${label} must include ${needle}`,
  );
}
