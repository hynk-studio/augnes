import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/TEMPORAL_HANDOFF_DIAGNOSTIC_SECTIONS_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.temporal-handoff-diagnostic-sections.sample.v0.1.json";
const typePath = "types/temporal-handoff-diagnostic-sections.ts";
const helperPath =
  "lib/research-candidate-review/temporal-handoff-diagnostic-sections.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:temporal-handoff-diagnostic-sections-v0-1";
const packageScriptValue =
  "node scripts/smoke-temporal-handoff-diagnostic-sections-v0-1.mjs";
const sectionsVersion = "temporal_handoff_diagnostic_sections.v0.1";
const reportVersion = "temporal_handoff_diagnostic_report.v0.1";
const status = "diagnostic_preview_only";

const targetKinds = new Set([
  "ai_context_packet",
  "codex_handoff_draft",
  "human_review_packet",
  "dogfooding_review_packet",
  "unknown",
]);

const deltaKinds = new Set([
  "none",
  "omission",
  "unexpected_change",
  "factual_mismatch",
  "sequence_mismatch",
  "action_effect_mismatch",
  "scope_mismatch",
  "user_preference_shift",
  "repo_state_shift",
  "validation_mismatch",
  "authority_boundary_mismatch",
]);

const holdModes = new Set([
  "none",
  "reactive_repair",
  "anticipatory_stop",
  "bounded_continue",
  "operator_decision_required",
]);

const notDoneClassifications = new Set([
  "not_started",
  "partial",
  "blocked",
  "out_of_scope",
  "needs_review",
  "complete",
  "unknown",
]);

const reasonCodes = new Set([
  "expected_files_present",
  "expected_files_missing",
  "observed_files_present",
  "observed_files_missing",
  "expected_checks_present",
  "expected_checks_missing",
  "observed_checks_present",
  "observed_checks_missing",
  "expected_observed_match",
  "expected_observed_mismatch",
  "source_refs_present",
  "source_refs_missing",
  "unresolved_tension_present",
  "knowledge_gap_present",
  "decision_hold_present",
  "not_done_classified",
  "authority_boundary_preserved",
  "diagnostic_preview_not_execution",
]);

const forbiddenAuthorityFields = [
  "execution_approval",
  "codex_execution_authority",
  "github_automation_authority",
  "branch_pr_creation_authority",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "provider_openai_authority",
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

const forbiddenOutputTextPattern =
  /execution approved|Codex executed|GitHub PR created|branch created|proof created|evidence record created|Perspective promoted|state committed|product write|\btruth\b/i;

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

assert.equal(fixture.fixture_version, "temporal_handoff_diagnostic_sections.sample.v0.1");
assert.equal(fixture.sections_version, sectionsVersion);
assert.equal(fixture.report_version, reportVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, status);

assertTypeCoverage();

const helperOutput = helper.buildTemporalHandoffDiagnosticReport({
  scope: fixture.scope,
  as_of: fixture.as_of,
  source_fixture_refs: fixture.source_fixture_refs,
  handoff_previews: fixture.input_preview.handoff_previews,
});
assert.deepEqual(helperOutput, fixture.expected_report, "helper output must match fixture");

const validationResult = helper.validateTemporalHandoffDiagnosticReport(
  fixture.expected_report,
);
assert.deepEqual(validationResult, { passed: true, failure_codes: [] });
assert.equal(
  helper.createTemporalHandoffDiagnosticReportFingerprint(fixture.expected_report),
  fixture.expected_report.report_fingerprint,
  "report fingerprint must match helper hash",
);

assertReport(fixture.expected_report);
assertFixtureCoverage();
assertAuthorityBoundaryConfusion();
assertSafeProductWriteDenialDoesNotMismatch();
assertUnsafeProductWriteGrantMismatches();
assertProductRecordDenialDoesNotMismatch();
assertHelperSourceBoundary();
assertOutputTextSafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to temporal handoff doc");
assertIndexBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "temporal-handoff-diagnostic-sections-v0-1",
      final_status: "pass",
      sections_version: fixture.sections_version,
      report_version: fixture.report_version,
      status: fixture.status,
      sections: fixture.expected_report.sections.length,
      report_fingerprint: fixture.expected_report.report_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeCoverage() {
  for (const requiredText of [
    "export type TemporalHandoffDiagnosticSectionsVersion",
    "export type TemporalHandoffDiagnosticReportVersion",
    "export interface TemporalHandoffDiagnosticSections",
    "export interface TemporalHandoffDiagnosticReport",
    "export interface TemporalHandoffDiagnosticBuilderInput",
    "diagnostic_preview_only",
    sectionsVersion,
    reportVersion,
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertReport(report) {
  assert.equal(report.report_version, reportVersion);
  assert.equal(report.scope, "project:augnes");
  assert.equal(report.status, status);
  assert.ok(Array.isArray(report.sections), "sections must be an array");
  assert.ok(report.sections.length > 0, "sections must be non-empty");
  assert.ok(report.report_fingerprint, "report_fingerprint must be non-empty");
  assertAuthorityBoundary(report.authority_boundary, "report");

  const seenSections = new Set();
  for (const section of report.sections) {
    const sectionKey = `${section.target_kind}:${section.target_ref}`;
    assert.ok(!seenSections.has(sectionKey), `${sectionKey} must be unique`);
    seenSections.add(sectionKey);
    assert.equal(section.sections_version, sectionsVersion);
    assert.equal(section.scope, "project:augnes");
    assert.equal(section.status, status);
    assert.ok(targetKinds.has(section.target_kind), `${sectionKey} target_kind controlled`);
    assert.ok(notDoneClassifications.has(section.not_done.classification));
    assert.ok(
      section.reason_codes.includes("diagnostic_preview_not_execution"),
      `${sectionKey} must carry diagnostic_preview_not_execution`,
    );
    assert.ok(
      section.reason_codes.includes("authority_boundary_preserved"),
      `${sectionKey} must carry authority_boundary_preserved`,
    );
    for (const reasonCode of section.reason_codes) {
      assert.ok(reasonCodes.has(reasonCode), `${sectionKey} reason ${reasonCode} controlled`);
    }
    for (const delta of section.expected_observed_deltas) {
      assert.ok(delta.delta_id, `${sectionKey} delta_id must be non-empty`);
      assert.ok(deltaKinds.has(delta.delta_kind), `${sectionKey} delta_kind controlled`);
    }
    for (const holdTrace of section.decision_hold_traces) {
      assert.ok(holdTrace.hold_id, `${sectionKey} hold_id must be non-empty`);
      assert.ok(holdModes.has(holdTrace.hold_mode), `${sectionKey} hold_mode controlled`);
    }
    assertAuthorityBoundary(section.authority_boundary, sectionKey);
    if (section.source_refs.length === 0) {
      assert.ok(
        section.reason_codes.includes("source_refs_missing"),
        `${sectionKey} empty source refs must carry source_refs_missing`,
      );
    }
    if (section.unresolved_tension_refs.length > 0) {
      assert.ok(
        section.reason_codes.includes("unresolved_tension_present"),
        `${sectionKey} unresolved tensions must carry unresolved_tension_present`,
      );
    }
  }
}

function assertFixtureCoverage() {
  const report = fixture.expected_report;
  assertIncludesAll(new Set(report.sections.map((section) => section.target_kind)), [
    "ai_context_packet",
    "codex_handoff_draft",
    "human_review_packet",
    "dogfooding_review_packet",
    "unknown",
  ]);
  assertIncludesAll(
    new Set(
      report.sections.flatMap((section) =>
        section.expected_observed_deltas.map((delta) => delta.delta_kind),
      ),
    ),
    [
      "none",
      "omission",
      "unexpected_change",
      "validation_mismatch",
      "authority_boundary_mismatch",
    ],
  );
  assertIncludesAll(
    new Set(
      report.sections.flatMap((section) =>
        section.decision_hold_traces.map((holdTrace) => holdTrace.hold_mode),
      ),
    ),
    [
      "reactive_repair",
      "anticipatory_stop",
      "bounded_continue",
      "operator_decision_required",
    ],
  );
  const notDoneSet = new Set(
    report.sections.map((section) => section.not_done.classification),
  );
  assertIncludesAll(notDoneSet, ["complete", "partial", "unknown"]);
  assert.ok(
    notDoneSet.has("needs_review") || notDoneSet.has("blocked"),
    "not_done classifications must include needs_review or blocked",
  );
  assertIncludesAll(
    new Set(report.sections.flatMap((section) => section.reason_codes)),
    [
      "expected_files_present",
      "expected_files_missing",
      "observed_files_present",
      "observed_files_missing",
      "expected_checks_present",
      "expected_checks_missing",
      "observed_checks_present",
      "observed_checks_missing",
      "expected_observed_match",
      "expected_observed_mismatch",
      "source_refs_present",
      "source_refs_missing",
      "unresolved_tension_present",
      "knowledge_gap_present",
      "decision_hold_present",
      "not_done_classified",
      "authority_boundary_preserved",
      "diagnostic_preview_not_execution",
    ],
  );
}

function assertAuthorityBoundaryConfusion() {
  const section = fixture.expected_report.sections.find(
    (candidate) => candidate.target_ref === "handoff-authority-confusing-001",
  );
  assert.ok(section, "authority confusing fixture section must exist");
  assert.ok(
    section.expected_observed_deltas.some(
      (delta) => delta.delta_kind === "authority_boundary_mismatch",
    ),
    "authority confusing section must create authority_boundary_mismatch",
  );
  assert.equal(section.authority_boundary.execution_approval, false);
  assert.equal(section.authority_boundary.codex_execution_authority, false);
  assert.equal(section.authority_boundary.github_automation_authority, false);
  assert.equal(section.authority_boundary.branch_pr_creation_authority, false);
}

function assertSafeProductWriteDenialDoesNotMismatch() {
  const report = buildSyntheticAuthorityNoteReport(
    "safe-product-write-denial-001",
    "source:safe-denial",
    [
      "Product-write remains parked by #686.",
      "no product write",
      "product_write_authority: false",
    ],
  );
  const section = report.sections[0];
  assert.deepEqual(
    section.expected_observed_deltas.map((delta) => delta.delta_kind),
    ["none"],
    "safe product-write denial notes must not create authority mismatch",
  );
  assert.equal(section.not_done.classification, "complete");
  assert.ok(
    !section.decision_hold_traces.some(
      (holdTrace) => holdTrace.hold_mode === "reactive_repair",
    ),
    "safe product-write denial notes must not create reactive repair",
  );
  assertAuthorityBoundary(section.authority_boundary, section.target_ref);
  assert.deepEqual(helper.validateTemporalHandoffDiagnosticReport(report), {
    passed: true,
    failure_codes: [],
  });
}

function assertUnsafeProductWriteGrantMismatches() {
  const report = buildSyntheticAuthorityNoteReport(
    "unsafe-product-write-grant-001",
    "source:unsafe-grant",
    ["product write authority granted"],
  );
  const section = report.sections[0];
  assert.ok(
    section.expected_observed_deltas.some(
      (delta) => delta.delta_kind === "authority_boundary_mismatch",
    ),
    "positive product-write grant wording must create authority mismatch",
  );
  assert.ok(
    section.decision_hold_traces.some(
      (holdTrace) => holdTrace.hold_mode === "reactive_repair",
    ),
    "positive product-write grant wording must create reactive repair",
  );
  assertAuthorityBoundary(section.authority_boundary, section.target_ref);
  assert.deepEqual(helper.validateTemporalHandoffDiagnosticReport(report), {
    passed: true,
    failure_codes: [],
  });
}

function assertProductRecordDenialDoesNotMismatch() {
  const report = buildSyntheticAuthorityNoteReport(
    "safe-product-record-denial-001",
    "source:product-record-denial",
    ["does not write product records"],
  );
  const section = report.sections[0];
  assert.ok(
    !section.expected_observed_deltas.some(
      (delta) => delta.delta_kind === "authority_boundary_mismatch",
    ),
    "does not write product records must be treated as safe denial",
  );
  assert.equal(section.not_done.classification, "complete");
  assert.ok(
    !section.decision_hold_traces.some(
      (holdTrace) => holdTrace.hold_mode === "reactive_repair",
    ),
    "does not write product records must not create reactive repair",
  );
  assertAuthorityBoundary(section.authority_boundary, section.target_ref);
  assert.deepEqual(helper.validateTemporalHandoffDiagnosticReport(report), {
    passed: true,
    failure_codes: [],
  });
}

function buildSyntheticAuthorityNoteReport(targetRef, sourceRef, authorityBoundaryNotes) {
  return helper.buildTemporalHandoffDiagnosticReport({
    scope: "project:augnes",
    as_of: fixture.as_of,
    source_fixture_refs: fixture.source_fixture_refs,
    handoff_previews: [
      {
        target_kind: "codex_handoff_draft",
        target_ref: targetRef,
        expected_files: ["file:a.ts"],
        observed_files: ["file:a.ts"],
        expected_checks: ["check:typecheck"],
        observed_checks: ["check:typecheck"],
        source_refs: [sourceRef],
        authority_boundary_notes: authorityBoundaryNotes,
        status_hint: "complete",
      },
    ],
  });
}

function assertHelperSourceBoundary() {
  for (const forbiddenText of forbiddenHelperSourceSnippets) {
    assert.ok(
      !helperSource.includes(forbiddenText),
      `helper source must not contain ${forbiddenText}`,
    );
  }
}

function assertOutputTextSafety() {
  for (const section of fixture.expected_report.sections) {
    const textFields = [
      ...section.expected_observed_deltas.map((delta) => delta.review_note),
      ...section.decision_hold_traces.flatMap((holdTrace) => [
        holdTrace.why_now,
        holdTrace.review_cue,
      ]),
      section.not_done.reason,
    ];
    for (const textField of textFields) {
      assert.ok(
        !forbiddenOutputTextPattern.test(textField),
        `${section.target_ref} text must not contain forbidden authority wording`,
      );
    }
  }
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Product-write remains parked by #686.",
    "Expected/Observed delta is diagnostic, not authority.",
    "Decision hold is review context, not rejection.",
    "Not-done classification is review context, not automatic failure.",
    "Source refs are coverage signals, not proof.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertIndexBoundary() {
  const block = extractIndexBlock(indexDoc, "Temporal Handoff Diagnostic Sections v0.1");
  for (const requiredText of [
    docPath,
    typePath,
    helperPath,
    fixturePath,
    "scripts/smoke-temporal-handoff-diagnostic-sections-v0-1.mjs",
    "integrated roadmap guide v0.2",
    "diagnostic-preview-only",
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
    "does not implement",
    "execution approval",
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
    /\bimplemented\s+execution approval\b/i,
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
  assert.equal(boundary?.diagnostic_preview_only, true, `${label} diagnostic true`);
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
