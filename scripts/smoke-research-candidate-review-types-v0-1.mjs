import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const typePath = "types/research-candidate-review.ts";
const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.sample.v0.1.json";
const smokePath = "scripts/smoke-research-candidate-review-types-v0-1.mjs";
const surfaceSmokePath = "scripts/smoke-research-candidate-review-surface-v0-1.mjs";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [typePath, docPath, fixturePath, smokePath, surfaceSmokePath, indexPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeFile = readFileSync(typePath, "utf8");
const doc = readFileSync(docPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const smoke = readFileSync(smokePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const fixture = JSON.parse(fixtureText);

const exportedNames = [
  "ResearchCandidateReviewFixtureVersion",
  "ResearchCandidateReviewPreviewVersion",
  "ResearchCandidateReviewScope",
  "ResearchCandidateReviewStatus",
  "ResearchCandidateReviewAuthority",
  "ResearchReviewStatus",
  "ResearchEpistemicStatus",
  "PerspectiveDeltaType",
  "PromotionReadiness",
  "EvidenceRole",
  "TensionType",
  "SourceReferencePreview",
  "ResearchSessionPreview",
  "SourceGrounding",
  "CandidateBoundaryFields",
  "EpistemicCandidateFields",
  "ClaimCandidate",
  "EvidenceCandidate",
  "TensionCandidate",
  "KnowledgeGapCandidate",
  "PerspectiveDeltaCandidate",
  "FollowUpWorkCandidate",
  "ResearchCandidateReviewPreviewResponse",
  "ResearchCandidateReviewSampleFixture",
];

const reviewStatusValues = ["candidate_only", "needs_review", "reviewed_reference_only", "rejected", "superseded"];
const epistemicStatusValues = [
  "operator_note",
  "candidate_claim",
  "weakly_supported",
  "supported",
  "contested",
  "contradicted",
  "hypothesis_only",
  "promoted",
  "retired",
];
const perspectiveDeltaValues = ["add", "refine", "weaken", "reverse", "split", "merge", "retire", "reweight", "reactivate"];
const promotionReadinessValues = ["not_ready", "weak_ready", "ready_with_tensions", "ready", "blocked"];
const evidenceRoleValues = ["supports", "contradicts", "contextualizes", "qualifies", "method", "limitation"];
const tensionTypeValues = [
  "contradiction",
  "ambiguity",
  "missing_context",
  "authority_risk",
  "schema_misread_risk",
  "scope_limit",
  "method_limit",
  "implementation_conflict",
];

assertTypeFileContract();
assertFixtureAlignment();
assertDocsPointers();
assertIndexPointers();
assertPackageScript();
assertNoForbiddenImplementationPatterns();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-types-v0-1",
      required_files_present: true,
      exported_type_names_checked: true,
      literal_unions_checked: true,
      authority_type_boundary_checked: true,
      source_grounding_union_checked: true,
      fixture_alignment_checked: true,
      source_ref_integrity_checked: true,
      session_preview_counts_checked: true,
      cross_references_checked: true,
      docs_type_pointer_checked: true,
      package_script_checked: true,
      index_pointer_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertTypeFileContract() {
  for (const name of exportedNames) {
    assert.match(
      typeFile,
      new RegExp(`export\\s+(?:type|interface)\\s+${escapeRegExp(name)}\\b`),
      `type file must export ${name}`,
    );
  }

  for (const value of [
    "research_candidate_review.sample.v0.1",
    "research_candidate_review.v0.1",
    "project:augnes",
    "sample_fixture_only",
    "candidate_preview_only",
    ...reviewStatusValues,
    ...epistemicStatusValues,
    ...perspectiveDeltaValues,
    ...promotionReadinessValues,
    ...evidenceRoleValues,
    ...tensionTypeValues,
  ]) {
    assert.match(typeFile, quotedValuePattern(value), `type file must include literal ${value}`);
  }

  const authorityBlock = extractBlock(typeFile, "export interface ResearchCandidateReviewAuthority");
  for (const [field, literal] of [
    ["candidate_only", "true"],
    ["source_of_truth", "false"],
    ["creates_evidence", "false"],
    ["creates_proof", "false"],
    ["commits_state", "false"],
    ["promotes_perspective", "false"],
    ["creates_work_item", "false"],
  ]) {
    assert.match(authorityBlock, new RegExp(`${field}:\\s*${literal};`), `authority type must require ${field}: ${literal}`);
  }

  assert.match(
    typeFile,
    /export type SourceGrounding\s*=\s*\|\s*\{\s*source_ref_id:\s*string;\s*source_refs\?:\s*string\[\];?\s*\}\s*\|\s*\{\s*source_ref_id\?:\s*string;\s*source_refs:\s*string\[\];?\s*\};/s,
    "SourceGrounding must be a union requiring source_ref_id or source_refs",
  );

  assert.match(typeFile, /type-only, non-SSOT preview contract/, "type file must state type-only non-SSOT boundary");
  assert.match(typeFile, /not a DB schema/, "type file must state it is not a DB schema");
  assert.match(typeFile, /not an API route contract/, "type file must state it is not an API route contract");
  assert.match(typeFile, /not a runtime parser/, "type file must state it is not runtime parsing");
  assert.match(typeFile, /not a provider prompt/, "type file must state it is not a provider prompt");
  assert.match(typeFile, /not a durable memory schema/, "type file must state it is not durable memory");
  assert.match(typeFile, /not a proof\/evidence record/, "type file must state it is not proof/evidence");
  assert.match(typeFile, /not perspective promotion authority/, "type file must state it is not promotion authority");

  for (const forbidden of [
    /import\s/,
    /export\s+const\b/,
    /\bfunction\b/,
    /\bclass\b/,
    new RegExp("\\bnew\\s+" + "Promise\\b"),
    new RegExp("\\bprocess" + "\\.env\\b"),
    /\bawait\b/,
    /\basync\b/,
  ]) {
    assert.doesNotMatch(typeFile, forbidden, `type file must not include ${forbidden}`);
  }
}

function assertFixtureAlignment() {
  assert.equal(fixture.fixture_version, "research_candidate_review.sample.v0.1");
  assert.equal(fixture.scope, "project:augnes");
  assert.equal(fixture.status, "sample_fixture_only");

  for (const [field, expected] of [
    ["candidate_only", true],
    ["source_of_truth", false],
    ["creates_evidence", false],
    ["creates_proof", false],
    ["commits_state", false],
    ["promotes_perspective", false],
    ["creates_work_item", false],
  ]) {
    assert.equal(fixture.authority?.[field], expected, `fixture authority ${field} must be ${expected}`);
  }

  for (const key of [
    "research_session_preview",
    "source_reference_previews",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
  ]) {
    assert.ok(Object.hasOwn(fixture, key), `fixture must include ${key}`);
  }

  const everyPreview = [
    fixture.research_session_preview,
    ...fixture.source_reference_previews,
    ...fixture.claim_candidates,
    ...fixture.evidence_candidates,
    ...fixture.tension_candidates,
    ...fixture.knowledge_gap_candidates,
    ...fixture.perspective_delta_candidates,
    ...fixture.follow_up_work_candidates,
  ];
  for (const item of everyPreview) {
    assert.ok(item.review_status, "every preview/candidate must include review_status");
    assert.ok(item.boundary_notes, "every preview/candidate must include boundary_notes");
  }

  for (const item of groundedCandidates()) {
    assert.ok(item.epistemic_status, `${candidateId(item)} must include epistemic_status`);
    assert.ok(
      typeof item.source_ref_id === "string" || Array.isArray(item.source_refs),
      `${candidateId(item)} must include source_ref_id or source_refs`,
    );
  }

  assertSourceReferenceIntegrity();
  assertSessionPreviewCounts();
  assertCrossReferences();
}

function assertSourceReferenceIntegrity() {
  const sourceRefIds = new Set(fixture.source_reference_previews.map((sourceRef) => sourceRef.source_ref_id));
  assertSourceRefsExist(
    "research_session_preview",
    fixture.research_session_preview?.session_id ?? "research_session_preview",
    fixture.research_session_preview?.source_refs,
    sourceRefIds,
  );

  for (const item of groundedCandidates()) {
    const objectId = candidateId(item);
    if (Object.hasOwn(item, "source_ref_id")) {
      assert.ok(sourceRefIds.has(item.source_ref_id), `${objectId} references missing source_ref_id ${item.source_ref_id}`);
    }
    if (Object.hasOwn(item, "source_refs")) {
      assertSourceRefsExist(objectId, objectId, item.source_refs, sourceRefIds);
    }
  }
}

function assertSessionPreviewCounts() {
  const session = fixture.research_session_preview;
  assert.equal(session.claim_candidate_count, fixture.claim_candidates.length);
  assert.equal(session.evidence_candidate_count, fixture.evidence_candidates.length);
  assert.equal(session.tension_candidate_count, fixture.tension_candidates.length);
  assert.equal(session.knowledge_gap_candidate_count, fixture.knowledge_gap_candidates.length);
  assert.equal(session.perspective_delta_candidate_count, fixture.perspective_delta_candidates.length);
  assert.equal(session.follow_up_work_candidate_count, fixture.follow_up_work_candidates.length);
}

function assertCrossReferences() {
  const claimIds = new Set(fixture.claim_candidates.map((item) => item.claim_candidate_id));
  const evidenceIds = new Set(fixture.evidence_candidates.map((item) => item.evidence_candidate_id));
  const tensionIds = new Set(fixture.tension_candidates.map((item) => item.tension_candidate_id));
  const gapIds = new Set(fixture.knowledge_gap_candidates.map((item) => item.knowledge_gap_candidate_id));

  for (const claim of fixture.claim_candidates) {
    assertRefsExist(claim.supporting_evidence_candidate_ids, evidenceIds, `${claim.claim_candidate_id}.supporting_evidence_candidate_ids`);
    assertRefsExist(
      claim.contradicting_evidence_candidate_ids,
      evidenceIds,
      `${claim.claim_candidate_id}.contradicting_evidence_candidate_ids`,
    );
  }

  for (const evidence of fixture.evidence_candidates) {
    assert.ok(claimIds.has(evidence.claim_candidate_id), `${evidence.evidence_candidate_id} references missing claim ${evidence.claim_candidate_id}`);
  }

  for (const tension of fixture.tension_candidates) {
    assertRefsExist(tension.related_claim_candidate_ids, claimIds, `${tension.tension_candidate_id}.related_claim_candidate_ids`);
    assertRefsExist(
      tension.related_evidence_candidate_ids,
      evidenceIds,
      `${tension.tension_candidate_id}.related_evidence_candidate_ids`,
    );
  }

  for (const gap of fixture.knowledge_gap_candidates) {
    assertRefsExist(gap.related_claim_candidate_ids, claimIds, `${gap.knowledge_gap_candidate_id}.related_claim_candidate_ids`);
    assertRefsExist(gap.related_tension_candidate_ids, tensionIds, `${gap.knowledge_gap_candidate_id}.related_tension_candidate_ids`);
  }

  for (const delta of fixture.perspective_delta_candidates) {
    assertRefsExist(delta.basis_claim_candidate_ids, claimIds, `${delta.perspective_delta_candidate_id}.basis_claim_candidate_ids`);
    assertRefsExist(delta.basis_evidence_candidate_ids, evidenceIds, `${delta.perspective_delta_candidate_id}.basis_evidence_candidate_ids`);
    assertRefsExist(delta.related_tension_candidate_ids, tensionIds, `${delta.perspective_delta_candidate_id}.related_tension_candidate_ids`);
    assertRefsExist(delta.related_gap_candidate_ids, gapIds, `${delta.perspective_delta_candidate_id}.related_gap_candidate_ids`);
  }
}

function assertDocsPointers() {
  assert.match(doc, new RegExp(escapeRegExp(typePath)), "surface doc must mention the type contract");
  assert.match(doc, /candidate-only/, "surface doc must still state candidate-only");
  assert.match(doc, /non-authoritative/, "surface doc must still state non-authoritative");
  assert.match(
    doc,
    /These boundaries apply to this slice\. They do not permanently ban future\s+bounded research lanes\./,
    "surface doc must preserve scoped-boundary wording",
  );

  const nextStep = extractSection(doc, "## Next Recommended Step");
  assert.doesNotMatch(nextStep, /Add a type-only contract/i, "next step must move beyond adding the type contract");
  assert.match(
    nextStep,
    /Research Candidate Review v0\.1 milestone closeout docs/i,
    "next step must point to Research Candidate Review v0.1 milestone closeout docs",
  );
}

function assertIndexPointers() {
  const pointerStart = index.indexOf(docPath);
  assert.notEqual(pointerStart, -1, "index must include the research candidate review pointer");
  const pointer = index.slice(pointerStart, pointerStart + 2400);
  assert.match(pointer, new RegExp(escapeRegExp(typePath)), "index pointer must mention the type file");
  assert.match(pointer, /smoke:research-candidate-review-types-v0-1/, "index pointer must mention the type smoke");
  assert.match(pointer, /type-only/, "index pointer must state type-only");
  assert.match(pointer, /non-authoritative/, "index pointer must state non-authoritative");
  assert.match(pointer, /not a DB schema/, "index pointer must state not a DB schema");
  assert.match(pointer, /not an API route/, "index pointer must state not an API route");
  assert.match(pointer, /not runtime behavior/, "index pointer must state not runtime behavior");
  assert.match(
    pointer,
    /no runtime\/API\/DB\/provider\/retrieval\/promotion behavior in this slice/,
    "index pointer must preserve runtime/API/DB/provider/retrieval/promotion boundary",
  );
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-review-types-v0-1"],
    "node scripts/smoke-research-candidate-review-types-v0-1.mjs",
    "package.json must expose the research candidate review type smoke",
  );
}

function assertNoForbiddenImplementationPatterns() {
  const combinedStaticText = [typeFile, doc, fixtureText, smoke, index].join("\n\n");
  const forbiddenPatterns = [
    pattern(["child", "_process"], "\\b", "\\b"),
    pattern(["spawn"], "\\b", "\\s*\\("),
    pattern(["exec"], "\\b", "\\s*\\("),
    pattern(["exec", "File"], "\\b", "\\s*\\("),
    pattern(["api", ".github", ".com"], "\\b", "\\b"),
    pattern(["api", ".openai", ".com"], "\\b", "\\b"),
    pattern(["GITHUB", "_TOKEN"], "\\b", "\\b"),
    pattern(["OPENAI", "_API", "_KEY"], "\\b", "\\b"),
    pattern(["record", "-proof"], "\\b", "\\b"),
    pattern(["record", "-evidence"], "\\b", "\\b"),
    pattern(["commit", "State", "Update"], "\\b", "\\b"),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["XML", "Http", "Request"], "\\b", "\\b"),
    pattern(["Web", "Socket"], "\\b", "\\b"),
    pattern(["Event", "Source"], "\\b", "\\b"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["use", " client"], "\\b", "\\b"),
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(combinedStaticText, regex, `static type/docs/fixture/smoke/index text must not include ${label}`);
  }
}

function groundedCandidates() {
  return [
    ...fixture.claim_candidates,
    ...fixture.evidence_candidates,
    ...fixture.tension_candidates,
    ...fixture.knowledge_gap_candidates,
    ...fixture.perspective_delta_candidates,
  ];
}

function candidateId(item) {
  return (
    item.claim_candidate_id ??
    item.evidence_candidate_id ??
    item.tension_candidate_id ??
    item.knowledge_gap_candidate_id ??
    item.perspective_delta_candidate_id ??
    "(missing candidate id)"
  );
}

function assertSourceRefsExist(family, objectId, sourceRefs, sourceRefIds) {
  assert.ok(Array.isArray(sourceRefs), `${family} ${objectId} must include source_refs as an array`);
  for (const sourceRef of sourceRefs) {
    assert.ok(sourceRefIds.has(sourceRef), `${family} ${objectId} references missing source ref ${sourceRef}`);
  }
}

function assertRefsExist(refs, idSet, context) {
  assert.ok(Array.isArray(refs), `${context} must be an array`);
  for (const ref of refs) {
    assert.ok(idSet.has(ref), `${context} references missing id ${ref}`);
  }
}

function extractBlock(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing block marker ${marker}`);
  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);
  assert.notEqual(open, -1, `missing open brace for ${marker}`);
  assert.notEqual(close, -1, `missing close brace for ${marker}`);
  return source.slice(open, close + 1);
}

function extractSection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `missing section ${heading}`);
  const rest = source.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

function quotedValuePattern(value) {
  return new RegExp(`"${escapeRegExp(value)}"`);
}

function pattern(parts, prefix, suffix, flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${escapeRegExp(label)}${suffix}`, flags),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
