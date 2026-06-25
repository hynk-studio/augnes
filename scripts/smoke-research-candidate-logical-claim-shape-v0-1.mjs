import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const docPath = "docs/RESEARCH_CANDIDATE_LOGICAL_CLAIM_SHAPE_V0_1.md";
const fixturePath =
  "fixtures/research-candidate-review.logical-claim-shape.sample.v0.1.json";
const typePath = "types/research-candidate-logical-claim-shape.ts";
const helperPath = "lib/research-candidate-review/logical-claim-shape.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-logical-claim-shape-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-logical-claim-shape-v0-1.mjs";
const shapeVersion = "logical_claim_shape_preview.v0.1";
const shapeStatus = "structure_preview_only";

const logicalStatuses = new Set([
  "well_structured_candidate",
  "missing_premise",
  "missing_conclusion",
  "missing_source_grounding",
  "possible_non_sequitur",
  "contradicted_by_candidate",
  "underspecified",
  "blocked",
]);

const reviewCues = new Set([
  "inspect_source",
  "add_premise",
  "clarify_conclusion",
  "state_missing_assumption",
  "resolve_counterclaim",
  "resolve_contradiction",
  "add_evidence",
  "defer",
  "no_action",
]);

const reasonCodes = new Set([
  "claim_text_present",
  "claim_text_missing",
  "source_ref_present",
  "source_ref_missing",
  "premise_present",
  "premise_missing",
  "conclusion_present",
  "conclusion_missing",
  "evidence_present",
  "evidence_missing",
  "counterclaim_present",
  "contradiction_present",
  "tension_present",
  "knowledge_gap_present",
  "missing_assumption_present",
  "calibration_blocked",
  "calibration_ready_with_tensions",
  "calibration_overclaim_risk",
  "structure_only_not_proof",
]);

const forbiddenAuthorityFields = [
  "proof_check",
  "theorem_proving",
  "formal_verification",
  "source_of_truth",
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

assert.equal(fixture.fixture_version, "logical_claim_shape_preview.sample.v0.1");
assert.equal(fixture.shape_version, shapeVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, shapeStatus);
assert.equal(fixture.expected_report.status, shapeStatus);

assertTypeContract();
assertHelperBoundary();
assertShapeFixture(fixture.expected_report);
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to logical claim shape doc");
assertIndexBoundary();

const helper = await import(pathToFileURL(resolve(helperPath)).href);
const builtReport = helper.buildLogicalClaimShapePreviewReport({
  scope: fixture.scope,
  as_of: fixture.as_of,
  source_fixture_refs: fixture.source_fixture_refs,
  ...fixture.input_preview,
});
assert.deepEqual(
  builtReport,
  fixture.expected_report,
  "helper output must match expected fixture logical claim shape report",
);
assert.deepEqual(helper.validateLogicalClaimShapePreviewReport(builtReport), {
  passed: true,
  failure_codes: [],
});
assert.equal(
  helper.createLogicalClaimShapeFingerprint(builtReport),
  builtReport.shape_fingerprint,
  "shape fingerprint must be stable",
);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-logical-claim-shape-v0-1",
      final_status: "pass",
      shape_version: fixture.shape_version,
      status: fixture.status,
      claim_shapes: fixture.expected_report.claim_shapes.length,
      shape_fingerprint: fixture.expected_report.shape_fingerprint,
    },
    null,
    2,
  ),
);

function assertShapeFixture(report) {
  assert.equal(report.shape_version, shapeVersion);
  assert.equal(report.scope, "project:augnes");
  assert.equal(report.status, shapeStatus);
  assert.ok(report.shape_fingerprint, "shape_fingerprint must be non-empty");
  assert.ok(report.claim_shapes.length > 0, "claim_shapes must be non-empty");
  assertAuthorityBoundary(report.authority_boundary, "report");

  const statusSet = new Set(report.claim_shapes.map((shape) => shape.logical_status));
  for (const status of [
    "well_structured_candidate",
    "missing_premise",
    "missing_conclusion",
    "contradicted_by_candidate",
    "underspecified",
    "blocked",
  ]) {
    assert.ok(statusSet.has(status), `logical statuses must include ${status}`);
  }

  const cueSet = new Set(report.claim_shapes.flatMap((shape) => shape.review_cues));
  for (const cue of [
    "inspect_source",
    "add_premise",
    "clarify_conclusion",
    "state_missing_assumption",
    "resolve_contradiction",
    "add_evidence",
    "no_action",
  ]) {
    assert.ok(cueSet.has(cue), `review cues must include ${cue}`);
  }

  const reasonSet = new Set(report.claim_shapes.flatMap((shape) => shape.reason_codes));
  for (const reasonCode of [
    "claim_text_present",
    "claim_text_missing",
    "source_ref_present",
    "source_ref_missing",
    "premise_present",
    "premise_missing",
    "conclusion_present",
    "conclusion_missing",
    "evidence_present",
    "evidence_missing",
    "contradiction_present",
    "tension_present",
    "knowledge_gap_present",
    "missing_assumption_present",
    "calibration_ready_with_tensions",
    "calibration_overclaim_risk",
    "structure_only_not_proof",
  ]) {
    assert.ok(reasonSet.has(reasonCode), `reason codes must include ${reasonCode}`);
  }

  for (const shape of report.claim_shapes) {
    assertAuthorityBoundary(shape.authority_boundary, shape.claim_candidate_id);
    assert.ok(
      logicalStatuses.has(shape.logical_status),
      `${shape.claim_candidate_id} logical_status is controlled`,
    );
    for (const cue of shape.review_cues) {
      assert.ok(reviewCues.has(cue), `${shape.claim_candidate_id} review cue is controlled`);
    }
    for (const reasonCode of shape.reason_codes) {
      assert.ok(
        reasonCodes.has(reasonCode),
        `${shape.claim_candidate_id} reason code ${reasonCode} is controlled`,
      );
    }
    if (shape.logical_status === "well_structured_candidate") {
      assert.ok(
        shape.reason_codes.includes("premise_present"),
        `${shape.claim_candidate_id} well-structured shape must have premise_present`,
      );
      assert.ok(
        shape.reason_codes.includes("conclusion_present"),
        `${shape.claim_candidate_id} well-structured shape must have conclusion_present`,
      );
      assert.ok(
        !shape.reason_codes.includes("contradiction_present"),
        `${shape.claim_candidate_id} well-structured shape must not have contradiction_present`,
      );
    }
    assert.doesNotMatch(
      shape.shape_summary,
      /proof|proven|theorem|verified truth|promoted|evidence record created|state committed|product write|\btruth\b/i,
      `${shape.claim_candidate_id} summary must avoid authority wording`,
    );
  }

  const blockedShape = report.claim_shapes.find(
    (shape) => shape.claim_candidate_id === "claim-blocked-001",
  );
  assert.ok(blockedShape, "blocked claim shape must exist");
  assert.equal(blockedShape.logical_status, "blocked");
  assert.deepEqual(blockedShape.source_refs, []);
  assert.ok(blockedShape.reason_codes.includes("source_ref_missing"));

  const boundaryShape = report.claim_shapes.find(
    (shape) => shape.claim_candidate_id === "claim-boundary-001",
  );
  assert.ok(boundaryShape, "source-boundary claim shape must exist");
  assert.deepEqual(boundaryShape.source_refs, []);
  assert.equal(typeof boundaryShape.source_coverage_boundary_note, "string");
  assert.notEqual(boundaryShape.logical_status, "blocked");

  const overclaimShape = report.claim_shapes.find((shape) =>
    shape.reason_codes.includes("calibration_overclaim_risk"),
  );
  assert.ok(overclaimShape, "calibration overclaim shape must exist");
  assert.ok(
    overclaimShape.review_cues.includes("add_evidence") ||
      overclaimShape.review_cues.includes("state_missing_assumption"),
  );

  const contradictedShape = report.claim_shapes.find(
    (shape) => shape.claim_candidate_id === "claim-contradicted-001",
  );
  assert.ok(contradictedShape, "contradiction/tension claim shape must exist");
  assert.equal(contradictedShape.logical_status, "contradicted_by_candidate");
  assert.ok(contradictedShape.review_cues.includes("resolve_contradiction"));
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.structure_preview_only, true, `${label} must be structure only`);
  assert.equal(boundary.proof_check, false, `${label}.proof_check must be false`);
  assert.equal(boundary.theorem_proving, false, `${label}.theorem_proving must be false`);
  assert.equal(
    boundary.formal_verification,
    false,
    `${label}.formal_verification must be false`,
  );
  assert.equal(boundary.source_of_truth, false, `${label}.source_of_truth must be false`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertTypeContract() {
  for (const requiredText of [
    "export type ResearchCandidateLogicalClaimShapeVersion",
    "\"logical_claim_shape_preview.v0.1\"",
    "export type ResearchCandidateLogicalClaimShapeScope",
    "\"project:augnes\"",
    "export type ResearchCandidateLogicalClaimShapeStatus",
    "\"structure_preview_only\"",
    "export type LogicalClaimInferenceType",
    "export type LogicalClaimStatus",
    "export type LogicalClaimReviewCue",
    "export type LogicalClaimShapeReasonCode",
    "export interface LogicalClaimShapeAuthorityBoundary",
    "export interface LogicalClaimShapePreview",
    "export interface LogicalClaimShapePreviewReport",
    "export interface LogicalClaimShapeValidationResult",
    "export interface LogicalClaimShapePreviewBuilderInput",
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
    /\bchild_process\b|\bspawn\s*\(|\bexecFile\s*\(|\bexec\s*\(/,
  ]) {
    assert.doesNotMatch(helperSource, forbiddenPattern);
  }
  for (const requiredText of [
    "buildLogicalClaimShapePreviewReport",
    "validateLogicalClaimShapePreviewReport",
    "createLogicalClaimShapeFingerprint",
    "getLogicalClaimShapeAuthorityBoundary",
    "sha256",
    "canonicalJson",
  ]) {
    assert.ok(helperSource.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertDocCoverage() {
  for (const requiredText of [
    "Logical Claim Shape Preview is structure-only.",
    "It implements Phase 1.3 from the integrated development roadmap guide v0.2.",
    "It does not prove claims.",
    "It does not run theorem proving.",
    "It does not run formal verification.",
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
    "Calibration Diagnostic is input signal, not truth.",
    "Missing premise is a review cue, not rejection.",
    "Contradiction is preserved as tension, not deletion.",
    "Logical status is not proof status.",
    "Review cues are not execution authority.",
    "Shape summary is explanation, not authority.",
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
      indexDoc.includes("structure-preview-only"),
    "index must mention roadmap guide v0.2 and structure-preview-only boundary",
  );
  for (const forbiddenPattern of [
    /runtime DB write was added/i,
    /route was added/i,
    /UI was added/i,
    /provider runtime was added/i,
    /retrieval runtime was added/i,
    /promotion was added/i,
    /theorem proving was added/i,
    /formal verification was added/i,
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
