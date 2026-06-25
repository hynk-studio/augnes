import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const docPath = "docs/RESEARCH_CANDIDATE_CALIBRATION_DIAGNOSTIC_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.calibration-diagnostic.sample.v0.1.json";
const typePath = "types/research-candidate-calibration-diagnostic.ts";
const helperPath = "lib/research-candidate-review/calibration-diagnostic.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-calibration-diagnostic-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-calibration-diagnostic-v0-1.mjs";
const diagnosticVersion = "research_candidate_calibration_diagnostic.v0.1";
const diagnosticStatus = "diagnostic_only";

const families = [
  "claim",
  "evidence",
  "tension",
  "knowledge_gap",
  "perspective_delta",
  "follow_up_work",
];

const readinessLabels = new Set([
  "not_ready",
  "weak_ready",
  "ready_with_tensions",
  "ready",
  "blocked",
]);

const reasonCodes = new Set([
  "source_ref_missing",
  "source_ref_present",
  "source_coverage_boundary_present",
  "evidence_missing",
  "evidence_present",
  "contradiction_present",
  "unresolved_tension_present",
  "knowledge_gap_present",
  "locator_missing",
  "locator_present",
  "lifecycle_blocked",
  "lifecycle_invalidated",
  "lifecycle_operator_corrected",
  "lifecycle_operator_pinned",
  "lifecycle_operator_dismissed",
  "operator_invalidation_present",
  "operator_correction_present",
  "operator_pin_present",
  "operator_dismissal_present",
  "readiness_overclaim_risk",
  "ready_with_unresolved_tensions",
  "diagnostic_only_not_promotion",
]);

const riskFlags = new Set([
  "stale_context",
  "overclaim_risk",
  "missing_source_ref",
  "missing_evidence",
  "missing_locator",
  "operator_invalidated",
  "contradiction_or_tension",
  "knowledge_gap_open",
]);

const forbiddenAuthorityFields = [
  "empirical_calibration_model",
  "confidence_is_truth",
  "readiness_is_promotion",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "execution_authority",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

for (const filePath of [docPath, fixturePath, typePath, helperPath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const typeSource = readFile(typePath);
const helperSource = readFile(helperPath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);

assert.equal(
  fixture.fixture_version,
  "research_candidate_calibration_diagnostic.sample.v0.1",
);
assert.equal(fixture.diagnostic_version, diagnosticVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, diagnosticStatus);
assert.equal(fixture.expected_report.status, diagnosticStatus);

assertTypeContract();
assertHelperBoundary();
assertDiagnosticFixture(fixture.expected_report);
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to calibration diagnostic doc");
assertIndexBoundary();

const helper = await import(pathToFileURL(resolve(helperPath)).href);
const builtReport = helper.buildResearchCandidateCalibrationDiagnosticReport({
  scope: fixture.scope,
  as_of: fixture.as_of,
  source_fixture_refs: fixture.source_fixture_refs,
  ...fixture.input_preview,
});
assert.deepEqual(
  builtReport,
  fixture.expected_report,
  "helper output must match expected fixture diagnostic report",
);
assert.deepEqual(helper.validateResearchCandidateCalibrationDiagnosticReport(builtReport), {
  passed: true,
  failure_codes: [],
});
assert.equal(
  helper.createResearchCandidateCalibrationDiagnosticFingerprint(builtReport),
  builtReport.diagnostic_fingerprint,
  "diagnostic fingerprint must be stable",
);
assertTargetKindAwareFeedbackCollision(helper);
assertDanglingSupportRefsDoNotCountAsSupport(helper);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-calibration-diagnostic-v0-1",
      final_status: "pass",
      diagnostic_version: fixture.diagnostic_version,
      status: fixture.status,
      diagnostics: fixture.expected_report.diagnostics.length,
      diagnostic_fingerprint: fixture.expected_report.diagnostic_fingerprint,
    },
    null,
    2,
  ),
);

function assertDiagnosticFixture(report) {
  assert.equal(report.diagnostic_version, diagnosticVersion);
  assert.equal(report.scope, "project:augnes");
  assert.equal(report.status, diagnosticStatus);
  assert.ok(report.diagnostic_fingerprint, "diagnostic_fingerprint must be non-empty");
  assertAuthorityBoundary(report.authority_boundary, "report");

  const familySet = new Set(
    report.diagnostics.map((diagnostic) => diagnostic.candidate_family),
  );
  for (const family of families) {
    assert.ok(familySet.has(family), `diagnostics must include ${family}`);
  }

  const readinessSet = new Set(
    report.diagnostics.map((diagnostic) => diagnostic.readiness_label),
  );
  for (const label of ["blocked", "not_ready", "weak_ready", "ready_with_tensions", "ready"]) {
    assert.ok(readinessSet.has(label), `readiness labels must include ${label}`);
  }

  const riskFlagSet = new Set(report.diagnostics.flatMap((diagnostic) => diagnostic.risk_flags));
  for (const flag of [
    "missing_source_ref",
    "missing_evidence",
    "missing_locator",
    "operator_invalidated",
    "contradiction_or_tension",
    "knowledge_gap_open",
    "overclaim_risk",
  ]) {
    assert.ok(riskFlagSet.has(flag), `risk flags must include ${flag}`);
  }

  const reasonCodeSet = new Set(
    report.diagnostics.flatMap((diagnostic) => diagnostic.readiness_reason_codes),
  );
  for (const reasonCode of [
    "source_ref_missing",
    "source_ref_present",
    "source_coverage_boundary_present",
    "evidence_missing",
    "evidence_present",
    "contradiction_present",
    "unresolved_tension_present",
    "knowledge_gap_present",
    "locator_missing",
    "operator_invalidation_present",
    "operator_correction_present",
    "operator_pin_present",
    "operator_dismissal_present",
    "readiness_overclaim_risk",
    "ready_with_unresolved_tensions",
    "diagnostic_only_not_promotion",
  ]) {
    assert.ok(reasonCodeSet.has(reasonCode), `reason codes must include ${reasonCode}`);
  }

  for (const diagnostic of report.diagnostics) {
    assertAuthorityBoundary(diagnostic.authority_boundary, diagnostic.candidate_id);
    for (const label of [diagnostic.readiness_label]) {
      assert.ok(readinessLabels.has(label), `${diagnostic.candidate_id} label is controlled`);
    }
    for (const reasonCode of diagnostic.readiness_reason_codes) {
      assert.ok(
        reasonCodes.has(reasonCode),
        `${diagnostic.candidate_id} reason code ${reasonCode} is controlled`,
      );
    }
    for (const riskFlag of diagnostic.risk_flags) {
      assert.ok(
        riskFlags.has(riskFlag),
        `${diagnostic.candidate_id} risk flag ${riskFlag} is controlled`,
      );
    }
    if (
      diagnostic.source_refs.length === 0 &&
      !diagnostic.source_coverage_boundary_note
    ) {
      assert.ok(
        diagnostic.readiness_reason_codes.includes("source_ref_missing"),
        `${diagnostic.candidate_id} must carry source_ref_missing`,
      );
    }
    assert.doesNotMatch(
      diagnostic.diagnostic_summary,
      /promoted|proof created|evidence record created|state committed|product write|\btruth\b/i,
      `${diagnostic.candidate_id} summary must avoid authority wording`,
    );
    if (diagnostic.readiness_label === "ready") {
      assert.notEqual(diagnostic.source_ref_coverage_ratio, 0);
      assert.equal(diagnostic.unresolved_tension_count, 0);
      assert.equal(diagnostic.contradiction_count, 0);
      assert.equal(diagnostic.knowledge_gap_count, 0);
      if (["claim", "perspective_delta"].includes(diagnostic.candidate_family)) {
        assert.notEqual(diagnostic.support_count, 0);
      }
    }
  }
}

function assertTargetKindAwareFeedbackCollision(helper) {
  const report = helper.buildResearchCandidateCalibrationDiagnosticReport({
    scope: "project:augnes",
    as_of: "2026-06-25T00:00:00.000Z",
    source_fixture_refs: ["synthetic:calibration-target-kind-collision"],
    candidate_review: {
      claim_candidates: [
        {
          claim_candidate_id: "shared-candidate-id",
          review_status: "needs_review",
          source_ref_id: "source:shared-claim",
        },
      ],
      evidence_candidates: [
        {
          evidence_candidate_id: "shared-candidate-id",
          review_status: "needs_review",
          source_ref_id: "source:shared-evidence",
          locator: "section:shared-evidence",
        },
      ],
    },
    lifecycle_read_model: {
      candidate_summaries: [],
    },
    feedback_events: [
      {
        event_id: "feedback-shared-claim-invalidate",
        event_type: "invalidate_preview",
        target_kind: "claim",
        target_id: "shared-candidate-id",
        source_ref_ids: ["feedback-source:claim-only"],
        created_at: "2026-06-25T00:05:00.000Z",
      },
      {
        event_id: "feedback-shared-unknown-kind",
        event_type: "dismiss_preview",
        target_kind: "unknown_candidate_family",
        target_id: "shared-candidate-id",
        source_ref_ids: ["feedback-source:unknown-kind"],
        created_at: "2026-06-25T00:06:00.000Z",
      },
    ],
  });
  const claimDiagnostic = report.diagnostics.find(
    (diagnostic) =>
      diagnostic.candidate_family === "claim" &&
      diagnostic.candidate_id === "shared-candidate-id",
  );
  const evidenceDiagnostic = report.diagnostics.find(
    (diagnostic) =>
      diagnostic.candidate_family === "evidence" &&
      diagnostic.candidate_id === "shared-candidate-id",
  );
  assert.ok(claimDiagnostic, "synthetic collision claim diagnostic must exist");
  assert.ok(evidenceDiagnostic, "synthetic collision evidence diagnostic must exist");
  assert.equal(claimDiagnostic.readiness_label, "not_ready");
  assert.ok(
    claimDiagnostic.readiness_reason_codes.includes("operator_invalidation_present"),
  );
  assert.ok(
    !evidenceDiagnostic.readiness_reason_codes.includes("operator_invalidation_present"),
  );
  assert.equal(evidenceDiagnostic.feedback_signal_counts.invalidate_preview, 0);
  assert.ok(!evidenceDiagnostic.source_refs.includes("feedback-source:claim-only"));
  assert.ok(!claimDiagnostic.source_refs.includes("feedback-source:unknown-kind"));
  assert.ok(!evidenceDiagnostic.source_refs.includes("feedback-source:unknown-kind"));
}

function assertDanglingSupportRefsDoNotCountAsSupport(helper) {
  const report = helper.buildResearchCandidateCalibrationDiagnosticReport({
    scope: "project:augnes",
    as_of: "2026-06-25T00:00:00.000Z",
    source_fixture_refs: ["synthetic:calibration-dangling-support-refs"],
    candidate_review: {
      claim_candidates: [
        {
          claim_candidate_id: "claim-dangling-support-001",
          source_ref_id: "source:claim-dangling-support",
          supporting_evidence_candidate_ids: ["missing-evidence-001"],
          review_status: "needs_review",
          epistemic_status: "candidate_only",
        },
      ],
      perspective_delta_candidates: [
        {
          perspective_delta_candidate_id: "delta-dangling-basis-001",
          source_ref_id: "source:delta-dangling-basis",
          basis_evidence_candidate_ids: ["missing-evidence-002"],
          promotion_readiness: "ready",
          review_status: "needs_review",
          epistemic_status: "candidate_only",
        },
      ],
    },
    lifecycle_read_model: {
      candidate_summaries: [],
    },
    feedback_events: [],
  });
  assert.deepEqual(helper.validateResearchCandidateCalibrationDiagnosticReport(report), {
    passed: true,
    failure_codes: [],
  });

  const claimDiagnostic = report.diagnostics.find(
    (diagnostic) =>
      diagnostic.candidate_family === "claim" &&
      diagnostic.candidate_id === "claim-dangling-support-001",
  );
  const deltaDiagnostic = report.diagnostics.find(
    (diagnostic) =>
      diagnostic.candidate_family === "perspective_delta" &&
      diagnostic.candidate_id === "delta-dangling-basis-001",
  );
  assert.ok(claimDiagnostic, "dangling-support claim diagnostic must exist");
  assert.equal(claimDiagnostic.support_count, 0);
  assert.notEqual(claimDiagnostic.readiness_label, "ready");
  assert.ok(claimDiagnostic.readiness_reason_codes.includes("evidence_missing"));
  assert.ok(claimDiagnostic.risk_flags.includes("missing_evidence"));
  assert.doesNotMatch(
    claimDiagnostic.diagnostic_summary,
    /promoted|proof created|evidence record created|state committed|product write|\btruth\b|\bpromotion\b/i,
  );

  assert.ok(deltaDiagnostic, "dangling-basis perspective delta diagnostic must exist");
  assert.equal(deltaDiagnostic.support_count, 0);
  assert.notEqual(deltaDiagnostic.readiness_label, "ready");
  assert.ok(deltaDiagnostic.readiness_reason_codes.includes("evidence_missing"));
  assert.ok(deltaDiagnostic.risk_flags.includes("missing_evidence"));
  assert.ok(deltaDiagnostic.risk_flags.includes("overclaim_risk"));
  assert.doesNotMatch(
    deltaDiagnostic.diagnostic_summary,
    /promoted|proof created|evidence record created|state committed|product write|\btruth\b|\bpromotion\b/i,
  );
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.diagnostic_only, true, `${label} must be diagnostic only`);
  assert.equal(boundary.empirical_calibration_model, false);
  assert.equal(boundary.confidence_is_truth, false);
  assert.equal(boundary.readiness_is_promotion, false);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertTypeContract() {
  for (const requiredText of [
    "export type ResearchCandidateCalibrationDiagnosticVersion",
    "\"research_candidate_calibration_diagnostic.v0.1\"",
    "export type ResearchCandidateCalibrationDiagnosticScope",
    "\"project:augnes\"",
    "export type ResearchCandidateCalibrationDiagnosticStatus",
    "\"diagnostic_only\"",
    "export type ResearchCandidateCalibrationCandidateFamily",
    "export type ResearchCandidateCalibrationReadinessLabel",
    "export type ResearchCandidateCalibrationReasonCode",
    "export type ResearchCandidateCalibrationRiskFlag",
    "export interface ResearchCandidateCalibrationAuthorityBoundary",
    "export interface ResearchCandidateCalibrationDiagnostic",
    "export interface ResearchCandidateCalibrationDiagnosticReport",
    "export interface ResearchCandidateCalibrationValidationResult",
    "export interface ResearchCandidateCalibrationDiagnosticBuilderInput",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertHelperBoundary() {
  for (const forbiddenPattern of [
    /\breadFile(?:Sync)?\b/,
    /\bwriteFile(?:Sync)?\b/,
    /\bDate\.now\s*\(/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/,
    /\bnew\s+OpenAI\b|from\s+["'][^"']*openai[^"']*["']/i,
    /\brunRetrieval\b|\brunRag\b|\bembed(?:ding)?\b|\bvectorDb\b/i,
    /\bsqlite\b|\bbetter-sqlite3\b|\bdb\.(?:query|prepare|run)\b/i,
  ]) {
    assert.doesNotMatch(helperSource, forbiddenPattern);
  }
  for (const requiredText of [
    "buildResearchCandidateCalibrationDiagnosticReport",
    "validateResearchCandidateCalibrationDiagnosticReport",
    "createResearchCandidateCalibrationDiagnosticFingerprint",
    "getResearchCandidateCalibrationAuthorityBoundary",
    "sha256",
    "canonicalJson",
    "feedbackEventTargetsCandidate",
    "normalizeFeedbackTargetFamily",
  ]) {
    assert.ok(helperSource.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertDocCoverage() {
  for (const requiredText of [
    "Calibration Diagnostic is diagnostic-only.",
    "It implements Phase 1.2 from the integrated development roadmap guide v0.2.",
    "It does not train an empirical calibration model.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not call provider/OpenAI.",
    "It does not fetch sources.",
    "It does not execute retrieval/RAG.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Feedback is operator signal, not truth.",
    "Confidence is not truth.",
    "Readiness is not promotion.",
    "Ready means ready for review, not ready to promote.",
    "ready_with_tensions preserves unresolved tensions.",
    "blocked is a review stop, not rejection.",
    "diagnostic_summary is explanation, not authority.",
    "support_count counts verified existing support records, not dangling candidate-local string refs.",
    "dangling support ids are treated as missing evidence for diagnostic purposes.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredText), `doc must include ${requiredText}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(
      !source.includes(`${field}: true`),
      `doc must not include positive authority grant ${field}: true`,
    );
  }
}

function assertIndexBoundary() {
  assert.ok(
    indexDoc.includes("integrated roadmap guide v0.2") &&
      indexDoc.includes("diagnostic-only"),
    "index must mention roadmap guide v0.2 and diagnostic-only boundary",
  );
  for (const forbiddenPattern of [
    /runtime DB write was added/i,
    /route was added/i,
    /UI was added/i,
    /provider runtime was added/i,
    /retrieval runtime was added/i,
    /promotion was added/i,
    /Git Ledger export was added/i,
    /product write was added/i,
    /product ID allocation was added/i,
  ]) {
    assert.doesNotMatch(indexDoc, forbiddenPattern);
  }
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
