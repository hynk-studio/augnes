#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const typePath = "types/conversation-handoff-packet.ts";
const helperPath = "lib/handoff/build-conversation-handoff-packet.ts";
const fixturePath = "fixtures/conversation-handoff-packet.sample.v0.2.json";
const smokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const docsPath = "docs/CONVERSATION_HANDOFF_PACKET_BUILDER_V0_2.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingResearchSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const dogfoodingRecordHandoffHelperPath =
  "lib/handoff/build-handoff-from-dogfooding-record.ts";
const dogfoodingRecordHandoffFixturePath =
  "fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json";
const dogfoodingRecordHandoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const dogfoodingRecordHandoffDocsPath =
  "docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md";
const reconciliationDocsPath =
  "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";
const dogfoodingDocsPath = "docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md";
const codexBindingDocsPath =
  "docs/CODEX_RESULT_TO_DOGFOODING_RECORD_BINDING_V0_1.md";

const fixtureVersion = "conversation_handoff_packet.sample.v0.2";
const packetVersion = "conversation_handoff_packet.v0.2";
const builderVersion = "conversation_handoff_packet_builder.v0.2";
const inputVersion = "conversation_handoff_packet_input.v0.2";
const selectedSlice = "conversation_handoff_packet_builder_v0_2";
const nextSlice = "conversation_handoff_packet_from_dogfooding_record_v0_1";
const scope = "project:augnes";
const packageScriptName = "smoke:conversation-handoff-packet-v0-2";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-conversation-handoff-packet-v0-2.mjs";

const expectedChangedFiles = new Set([
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  codexBindingSmokePath,
  dogfoodingResearchSmokePath,
  dogfoodingRecordHandoffHelperPath,
  dogfoodingRecordHandoffFixturePath,
  dogfoodingRecordHandoffSmokePath,
  dogfoodingRecordHandoffDocsPath,
]);

const requiredHelperExports = [
  "buildConversationHandoffPacketV02",
  "createConversationHandoffPacketAuthorityBoundaryV02",
  "createConversationHandoffPacketFingerprintV02",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "`/` is the public Augnes surface, `/perspective` is Perspective detail, and `/workbench` is Cockpit/workbench.",
  "PR #872 provides Codex result to dogfooding record binding context for handoff.",
  "This slice adds no UI and no route model change.",
  "Handoff packet is not execution approval.",
  "Handoff packet is not truth.",
  "Handoff packet is not proof.",
  "Expected files are not write authority.",
  "Observed files are not proof.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "CI pass is not authority.",
  "PR body is not authority.",
  "Codex report is not execution approval.",
  "Dogfooding record is candidate-only review material.",
  "Next recommended slice is not execution approval.",
  "`conversation_handoff_packet_from_dogfooding_record_v0_1`",
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
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  codexBindingSmokePath,
  reconciliationDocsPath,
  dogfoodingDocsPath,
  codexBindingDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const typeText = read(typePath);
const helperText = read(helperPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const docsText = read(docsPath);
const packageJson = JSON.parse(read(packagePath));
const indexText = read(indexPath);
const codexBindingSmokeText = read(codexBindingSmokePath);
const reconciliationDocsText = read(reconciliationDocsPath);
const dogfoodingDocsText = read(dogfoodingDocsPath);
const codexBindingDocsText = read(codexBindingDocsPath);
const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);

assertFixtureVersions();
assertStaticCoverage();
assertPacketBehavior();
assertBlockedInputBehavior();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "conversation-handoff-packet-v0-2",
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
  assert.equal(fixture.packet_version, packetVersion);
  assert.equal(fixture.builder_version, builderVersion);
  assert.equal(fixture.input_version, inputVersion);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.deepEqual(fixture.post_868_boundary.frozen_routes, [
    "/",
    "/perspective",
    "/workbench",
  ]);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
  assert.equal(fixture.post_868_boundary.route_in_scope, false);
}

function assertStaticCoverage() {
  for (const exportedName of requiredHelperExports) {
    assert.ok(
      helperText.includes(`export function ${exportedName}`),
      `helper must export ${exportedName}`,
    );
    assert.equal(typeof helper[exportedName], "function", `${exportedName} must import`);
  }
  for (const typeName of [
    "ConversationHandoffPacketInputV02",
    "ConversationHandoffPacketV02",
    "ConversationHandoffPacketBuildResultV02",
    "ConversationHandoffPacketAuthorityBoundaryV02",
  ]) {
    assert.ok(typeText.includes(typeName), `types must include ${typeName}`);
  }
  assert.ok(
    helperText.includes("buildPrivacyRedactionRuntimeGuardReportV01"),
    "helper must apply the existing privacy redaction guard",
  );
  assert.ok(
    helperText.includes("forbiddenAuthorityPhrasePatterns"),
    "helper must include string shortcut blocking",
  );
  assert.ok(
    reconciliationDocsText.includes("Core first") &&
      reconciliationDocsText.includes("Web last"),
    "post-868 reconciliation must preserve Core/Web direction",
  );
  assert.ok(
    dogfoodingDocsText.includes("Dogfooding research record is candidate-only review material."),
    "dogfooding runtime docs must preserve candidate-only boundary",
  );
  assert.ok(
    codexBindingDocsText.includes("PR #872") ||
      codexBindingDocsText.includes("Codex Result To Dogfooding Record Binding"),
    "codex binding docs must exist as prerequisite context",
  );
  for (const phrase of requiredDocsPhrases) {
    assertIncludesNormalized(docsText, phrase, `docs phrase ${phrase}`);
  }
  for (const pointer of [typePath, helperPath, fixturePath, smokePath, docsPath]) {
    assert.ok(indexText.includes(pointer), `latest index must include ${pointer}`);
  }
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const forbidden of forbiddenHelperSnippets) {
    assert.ok(!helperText.includes(forbidden), `helper must not include ${forbidden}`);
  }
  for (const pointer of [typePath, helperPath, fixturePath, smokePath, docsPath]) {
    assert.ok(
      codexBindingSmokeText.includes(pointer),
      `codex binding changed-file guard must include exact new slice path ${pointer}`,
    );
  }
  assert.ok(
    !codexBindingSmokeText.includes("docs/**") &&
      !codexBindingSmokeText.includes("lib/**") &&
      !codexBindingSmokeText.includes("scripts/**"),
    "codex binding changed-file guard must not become a broad future-slice allowlist",
  );
}

function assertPacketBehavior() {
  const builtByProfile = new Map();
  for (const profile of fixture.required_profiles) {
    const input = withProfile(fixture.safe_input_example, profile);
    const first = helper.buildConversationHandoffPacketV02(input);
    const second = helper.buildConversationHandoffPacketV02(input);
    assert.equal(first.ok, true, `${profile} must build`);
    assert.equal(first.status, "built", `${profile} status`);
    assert.deepEqual(first, second, `${profile} build must be deterministic`);
    assert.ok(first.packet, `${profile} packet must exist`);
    assert.equal(first.packet.packet_version, packetVersion);
    assert.equal(first.packet.builder_version, builderVersion);
    assert.equal(first.packet.scope, scope);
    assert.equal(first.packet.profile, profile);
    assert.equal(first.packet.packet_fingerprint, second.packet.packet_fingerprint);
    assert.equal(first.packet.plain_text, second.packet.plain_text);
    assertAllExecutionFlagsFalse(first);
    assertAuthorityBoundaryClosed(first.packet.authority_boundary, `${profile} packet`);
    assertAuthorityBoundaryClosed(first.authority_boundary, `${profile} result`);
    for (const line of fixture.expected.required_authority_boundary_lines) {
      assert.ok(
        first.packet.plain_text.includes(line),
        `${profile} plain text must include authority line ${line}`,
      );
    }
    assert.ok(
      first.packet.forbidden_capabilities.length >=
        fixture.safe_input_example.forbidden_capabilities.length,
      `${profile} must preserve default forbidden capabilities`,
    );
    builtByProfile.set(profile, first.packet);
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

  assertSections(
    builtByProfile.get("codex_implementation"),
    fixture.expected.required_codex_implementation_sections,
  );
  assertSections(
    builtByProfile.get("codex_pr_review"),
    fixture.expected.required_codex_pr_review_sections,
  );
  assertSections(
    builtByProfile.get("human_operator_review"),
    fixture.expected.required_human_operator_review_sections,
  );
  assertSections(
    builtByProfile.get("handoff_minimal"),
    fixture.expected.required_minimal_sections,
  );
  assert.ok(
    builtByProfile.get("handoff_minimal").sections.length <
      builtByProfile.get("codex_implementation").sections.length,
    "minimal handoff should be compact",
  );
  assert.ok(
    builtByProfile
      .get("release_readiness_review")
      .plain_text.includes("No release, deploy, or publish behavior."),
    "release readiness review must preserve release boundary",
  );
  assert.ok(
    !builtByProfile
      .get("release_readiness_review")
      .plain_text.includes("release_deploy_publish_now: true"),
    "release readiness review must not imply release execution",
  );

  const reviewPacket = builtByProfile.get("codex_pr_review");
  const deltaSection = sectionBody(reviewPacket, "expected_observed_delta");
  assert.ok(
    deltaSection.includes("Expected checks are listed separately from observed check status."),
    "expected/observed delta must remain distinct",
  );
  assert.ok(
    !sectionBody(reviewPacket, "observed_checks").includes(
      "Expected checks are listed separately from observed check status.",
    ),
    "expected/observed delta must not become validation approval/rejection",
  );
  assert.ok(
    builtByProfile
      .get("codex_implementation")
      .plain_text.includes(`${nextSlice} remains a cue, not execution approval.`),
    "next recommended slice must stay a cue",
  );
}

function assertBlockedInputBehavior() {
  const blockedPrivate = helper.buildConversationHandoffPacketV02(
    fixture.blocked_private_or_raw_payload_example,
  );
  assert.equal(blockedPrivate.ok, false);
  assert.equal(blockedPrivate.status, fixture.expected.blocked_private_status);
  assert.equal(blockedPrivate.packet, null);
  assertNoUnsafeEcho(blockedPrivate, "private blocked result");
  assertAllExecutionFlagsFalse(blockedPrivate);

  const blockedStructuredAuthority = helper.buildConversationHandoffPacketV02(
    fixture.blocked_structured_authority_example,
  );
  assert.equal(blockedStructuredAuthority.ok, false);
  assert.equal(blockedStructuredAuthority.status, fixture.expected.blocked_authority_status);
  assert.equal(blockedStructuredAuthority.packet, null);
  assertNoUnsafeEcho(blockedStructuredAuthority, "structured authority blocked result");
  assertAllExecutionFlagsFalse(blockedStructuredAuthority);

  for (const testCase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const input = authorityStringClaimInput(testCase);
    const result = helper.buildConversationHandoffPacketV02(input);
    assert.equal(result.ok, false, `${testCase.case_id} must be blocked`);
    assert.equal(
      result.status,
      fixture.expected.blocked_authority_status,
      `${testCase.case_id} status`,
    );
    assert.equal(result.packet, null, `${testCase.case_id} must not build packet`);
    assert.ok(
      result.privacy_report.findings.some(
        (finding) => finding.finding_kind === "forbidden_authority_phrase",
      ),
      `${testCase.case_id} must include forbidden phrase finding`,
    );
    assertBlockedPhraseNotEchoed(result, testCase, `${testCase.case_id} result`);
    assertAllExecutionFlagsFalse(result);
  }

  for (const testCase of fixture.allowed_negated_authority_string_cases) {
    const input = authorityStringClaimInput(testCase);
    const result = helper.buildConversationHandoffPacketV02(input);
    assert.equal(result.ok, true, `${testCase.case_id} must remain allowed`);
    assert.equal(result.status, "built", `${testCase.case_id} status`);
    assert.ok(result.packet, `${testCase.case_id} must build packet`);
  }
}

function assertChangedFileScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.doesNotMatch(filePath, /^components\//, "no component files may change");
    assert.doesNotMatch(
      filePath,
      /^app\//,
      "no route or API files may change for this helper-only slice",
    );
    assert.doesNotMatch(filePath, /^lib\/db\//, "no DB schema files may change");
    assert.doesNotMatch(filePath, /migrations/i, "no migration files may change");
    assert.doesNotMatch(
      filePath,
      /provider|retrieval|source-fetch/i,
      "no provider/retrieval/source-fetch files may change",
    );
  }
}

function withProfile(input, profile) {
  return {
    ...clone(input),
    profile,
  };
}

function authorityStringClaimInput(testCase) {
  const input = withProfile(fixture.safe_input_example, "codex_implementation");
  input.packet_id = `conversation-handoff-packet:${testCase.case_id}`;
  input.current_task = ["Authority string claim packet test case."];
  input.unresolved_tensions = [];
  const phrase = phraseForCase(testCase);
  if (testCase.target === "unresolved_tensions") {
    input.unresolved_tensions = [phrase];
  } else {
    input.current_task = [phrase];
  }
  return input;
}

function phraseForCase(testCase) {
  if (Array.isArray(testCase.phrase_parts)) return testCase.phrase_parts.join(" ");
  return testCase.phrase;
}

function assertSections(packet, expectedSectionIds) {
  const sectionIds = packet.sections.map((section) => section.section_id);
  for (const sectionId of expectedSectionIds) {
    assert.ok(sectionIds.includes(sectionId), `packet must include section ${sectionId}`);
  }
}

function sectionBody(packet, sectionId) {
  return (
    packet.sections
      .find((section) => section.section_id === sectionId)
      ?.body_lines.join("\n") ?? ""
  );
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}
