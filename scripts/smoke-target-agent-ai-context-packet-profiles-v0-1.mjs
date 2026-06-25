import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/TARGET_AGENT_AI_CONTEXT_PACKET_PROFILES_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.target-agent-ai-context-packet-profiles.sample.v0.1.json";
const typePath = "types/target-agent-ai-context-packet-profiles.ts";
const helperPath =
  "lib/research-candidate-review/target-agent-ai-context-packet-profiles.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:target-agent-ai-context-packet-profiles-v0-1";
const packageScriptValue =
  "node scripts/smoke-target-agent-ai-context-packet-profiles-v0-1.mjs";
const profileVersion = "target_agent_ai_context_packet_profiles.v0.1";
const reportVersion = "target_agent_ai_context_packet_profiles_report.v0.1";
const status = "profile_preview_only";

const targetKinds = new Set([
  "human_review",
  "chatgpt_review",
  "codex_handoff",
  "dogfooding_review",
  "unknown",
]);

const profileModes = new Set(["review", "handoff", "diagnostic", "dogfood", "unknown"]);

const sectionKinds = new Set([
  "scope_summary",
  "source_refs",
  "candidate_lifecycle",
  "calibration_diagnostic",
  "logical_claim_shape",
  "feedback_to_rule",
  "temporal_handoff_diagnostic",
  "unresolved_tensions",
  "knowledge_gaps",
  "review_cues",
  "expected_observed_delta",
  "authority_boundary",
  "deferred_work",
  "omitted_context",
]);

const compressionLevels = new Set(["full", "balanced", "compact", "minimal"]);

const reasonCodes = new Set([
  "target_agent_supported",
  "target_agent_unknown",
  "source_refs_present",
  "source_refs_missing",
  "lifecycle_context_included",
  "calibration_context_included",
  "logical_shape_context_included",
  "feedback_to_rule_context_included",
  "temporal_handoff_context_included",
  "unresolved_tension_present",
  "knowledge_gap_present",
  "authority_boundary_included",
  "execution_authority_denied",
  "codex_handoff_draft_not_execution",
  "provider_call_denied",
  "github_automation_denied",
  "product_write_denied",
  "profile_preview_not_prompt_execution",
]);

const forbiddenAuthorityFields = [
  "prompt_execution_now",
  "provider_openai_call_now",
  "codex_execution_authority",
  "github_automation_authority",
  "branch_pr_creation_authority",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

const forbiddenHelperSourceSnippets = [
  "readFileSync",
  "writeFileSync",
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "new OpenAI",
  "better-sqlite3",
  "sqlite",
  "db.prepare",
  "child_process",
  "exec(",
  "spawn(",
  "createPullRequest",
  "createBranch",
  "git commit",
];

const forbiddenSummaryPattern =
  /prompt executed|provider called|Codex executed|GitHub PR created|branch created|proof created|evidence record created|Perspective promoted|state committed|product write|\btruth\b/i;
const privateMarkerPattern =
  /hidden reasoning|raw source body|private URL|\bsecret\b|\btoken\b/i;

for (const filePath of [docPath, fixturePath, typePath, helperPath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const typeSource = readFile(typePath);
const helperSource = readFile(helperPath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);
const helper = await import(pathToFileURL(helperPath).href);

assert.equal(fixture.fixture_version, "target_agent_ai_context_packet_profiles.sample.v0.1");
assert.equal(fixture.report_version, reportVersion);
assert.equal(fixture.profile_version, profileVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, status);

assertTypeCoverage();

const helperOutput = helper.buildTargetAgentAiContextPacketProfilesReport({
  scope: fixture.scope,
  as_of: fixture.as_of,
  source_fixture_refs: fixture.source_fixture_refs,
  targets: fixture.input_preview.targets,
  artifacts: fixture.input_preview.artifacts,
});
assert.deepEqual(helperOutput, fixture.expected_report, "helper output must match fixture");

const validationResult = helper.validateTargetAgentAiContextPacketProfilesReport(
  fixture.expected_report,
);
assert.deepEqual(validationResult, { passed: true, failure_codes: [] });
assert.equal(
  helper.createTargetAgentAiContextPacketProfilesReportFingerprint(
    fixture.expected_report,
  ),
  fixture.expected_report.report_fingerprint,
  "report fingerprint must match helper hash",
);

assertReport(fixture.expected_report);
assertFixtureCoverage();
assertHelperSourceBoundary();
assertSectionSummarySafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to target-agent profile doc");
assertIndexBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "target-agent-ai-context-packet-profiles-v0-1",
      final_status: "pass",
      report_version: fixture.report_version,
      profile_version: fixture.profile_version,
      status: fixture.status,
      profiles: fixture.expected_report.profiles.length,
      report_fingerprint: fixture.expected_report.report_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeCoverage() {
  for (const requiredText of [
    "export type TargetAgentAiContextPacketProfilesVersion",
    "export type TargetAgentAiContextPacketProfilesReportVersion",
    "export interface TargetAgentAiContextPacketProfile",
    "export interface TargetAgentAiContextPacketProfilesReport",
    "export interface TargetAgentAiContextPacketProfilesBuilderInput",
    "profile_preview_only",
    profileVersion,
    reportVersion,
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertReport(report) {
  assert.equal(report.report_version, reportVersion);
  assert.equal(report.scope, "project:augnes");
  assert.equal(report.status, status);
  assert.ok(Array.isArray(report.profiles), "profiles must be an array");
  assert.ok(report.profiles.length > 0, "profiles must be non-empty");
  assert.ok(report.report_fingerprint, "report_fingerprint must be non-empty");
  assertAuthorityBoundary(report.authority_boundary, "report");

  const seenProfiles = new Set();
  for (const profile of report.profiles) {
    const profileKey = `${profile.target_agent}:${profile.target_ref}`;
    assert.ok(!seenProfiles.has(profileKey), `${profileKey} must be unique`);
    seenProfiles.add(profileKey);
    assert.equal(profile.profile_version, profileVersion);
    assert.equal(profile.scope, "project:augnes");
    assert.equal(profile.status, status);
    assert.ok(targetKinds.has(profile.target_agent), `${profileKey} target controlled`);
    assert.ok(profileModes.has(profile.profile_mode), `${profileKey} mode controlled`);
    assertAuthorityBoundary(profile.authority_boundary, profileKey);
    for (const reasonCode of profile.reason_codes) {
      assert.ok(reasonCodes.has(reasonCode), `${profileKey} reason ${reasonCode} controlled`);
    }
    for (const requiredReason of [
      "authority_boundary_included",
      "execution_authority_denied",
      "provider_call_denied",
      "github_automation_denied",
      "product_write_denied",
      "profile_preview_not_prompt_execution",
    ]) {
      assert.ok(
        profile.reason_codes.includes(requiredReason),
        `${profileKey} must include ${requiredReason}`,
      );
    }
    if (profile.target_agent === "codex_handoff") {
      assert.ok(
        profile.reason_codes.includes("codex_handoff_draft_not_execution"),
        "codex_handoff profile must include codex_handoff_draft_not_execution",
      );
    }
    const allSections = [...profile.included_sections, ...profile.omitted_sections];
    assert.ok(
      allSections.some((section) => section.section_kind === "authority_boundary"),
      `${profileKey} must include authority_boundary section`,
    );
    for (const section of allSections) {
      assert.ok(section.section_id, `${profileKey} section_id must be present`);
      assert.ok(
        sectionKinds.has(section.section_kind),
        `${profileKey} section ${section.section_kind} controlled`,
      );
      assert.ok(
        compressionLevels.has(section.compression_level),
        `${profileKey} compression ${section.compression_level} controlled`,
      );
    }
  }
}

function assertFixtureCoverage() {
  const profiles = fixture.expected_report.profiles;
  assertIncludesAll(new Set(profiles.map((profile) => profile.target_agent)), [
    "human_review",
    "chatgpt_review",
    "codex_handoff",
    "dogfooding_review",
    "unknown",
  ]);
  assertIncludesAll(
    new Set(
      profiles.flatMap((profile) =>
        [...profile.included_sections, ...profile.omitted_sections].map(
          (section) => section.section_kind,
        ),
      ),
    ),
    [
      "source_refs",
      "candidate_lifecycle",
      "calibration_diagnostic",
      "logical_claim_shape",
      "feedback_to_rule",
      "temporal_handoff_diagnostic",
      "unresolved_tensions",
      "knowledge_gaps",
      "review_cues",
      "authority_boundary",
      "omitted_context",
      "deferred_work",
    ],
  );
  assertIncludesAll(
    new Set(
      profiles.flatMap((profile) =>
        [...profile.included_sections, ...profile.omitted_sections].map(
          (section) => section.compression_level,
        ),
      ),
    ),
    ["balanced", "compact", "minimal"],
  );
  assertIncludesAll(new Set(profiles.flatMap((profile) => profile.reason_codes)), [
    "target_agent_supported",
    "target_agent_unknown",
    "source_refs_present",
    "source_refs_missing",
    "lifecycle_context_included",
    "calibration_context_included",
    "logical_shape_context_included",
    "feedback_to_rule_context_included",
    "temporal_handoff_context_included",
    "unresolved_tension_present",
    "knowledge_gap_present",
    "authority_boundary_included",
    "execution_authority_denied",
    "codex_handoff_draft_not_execution",
    "provider_call_denied",
    "github_automation_denied",
    "product_write_denied",
    "profile_preview_not_prompt_execution",
  ]);
}

function assertHelperSourceBoundary() {
  for (const forbiddenText of forbiddenHelperSourceSnippets) {
    assert.ok(
      !helperSource.includes(forbiddenText),
      `helper source must not contain ${forbiddenText}`,
    );
  }
}

function assertSectionSummarySafety() {
  for (const profile of fixture.expected_report.profiles) {
    for (const section of [...profile.included_sections, ...profile.omitted_sections]) {
      assert.ok(
        !forbiddenSummaryPattern.test(section.summary),
        `${section.section_id} summary must not contain forbidden authority wording`,
      );
      assert.ok(
        !privateMarkerPattern.test(section.summary),
        `${section.section_id} summary must not contain private/raw markers`,
      );
    }
  }
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Product-write remains parked by #686.",
    "Context packet profile is advisory, not source of truth.",
    "Codex handoff profile is not execution approval.",
    "Calibration context is diagnostic, not readiness authority.",
    "Logical shape context is structure-only, not proof.",
    "Feedback-to-Rule context is candidate-only, not rule mutation.",
    "Temporal handoff context is diagnostic, not authority.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertIndexBoundary() {
  const block = extractIndexBlock(indexDoc, "Target-Agent AI Context Packet Profiles v0.1");
  for (const requiredText of [
    docPath,
    typePath,
    helperPath,
    fixturePath,
    "scripts/smoke-target-agent-ai-context-packet-profiles-v0-1.mjs",
    "integrated roadmap guide v0.2",
    "Phase 1.6",
    "profile-preview-only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "adds no runtime route",
    "UI",
    "DB query or",
    "write",
    "provider/OpenAI call",
    "retrieval/RAG execution",
    "product ID allocation",
    "does not implement",
    "prompt execution",
    "provider calls",
    "Codex execution",
    "GitHub automation",
    "branch/PR creation",
    "proof/evidence",
    "promotion",
    "Git Ledger",
    "product write",
  ]) {
    assert.ok(
      block.includes(requiredBoundaryText),
      `index block must include ${requiredBoundaryText}`,
    );
  }
  for (const forbiddenPattern of [
    /\badded\s+(a\s+)?runtime route\b/i,
    /\badded\s+(a\s+)?UI\b/i,
    /\bimplemented\s+DB\s+(read|write|query)/i,
    /\bimplemented\s+prompt execution\b/i,
    /\bimplemented\s+Codex execution\b/i,
    /\bimplemented\s+GitHub automation\b/i,
    /\bcreated\s+(a\s+)?branch\b/i,
    /\bcreated\s+(a\s+)?PR\b/i,
    /\bimplemented\s+Git Ledger export\b/i,
    /\bimplemented\s+product write\b/i,
    /\bimplemented\s+product ID allocation\b/i,
  ]) {
    assert.ok(
      !forbiddenPattern.test(block),
      `index block must not imply forbidden behavior: ${forbiddenPattern}`,
    );
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(!source.includes(`${field}: true`), `doc must not grant ${field}`);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.profile_preview_only, true, `${label} profile preview true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertIncludesAll(actualSet, expectedValues) {
  for (const expectedValue of expectedValues) {
    assert.ok(actualSet.has(expectedValue), `expected coverage for ${expectedValue}`);
  }
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}
