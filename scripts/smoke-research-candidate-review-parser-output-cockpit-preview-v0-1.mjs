import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const componentPath = "components/augnes-cockpit.tsx";
const inputFixturePath =
  "fixtures/research-candidate-review.manual-note.sample.v0.1.txt";
const parserOutputFixturePath =
  "fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json";
const originalFixturePath = "fixtures/research-candidate-review.sample.v0.1.json";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const typePath = "types/research-candidate-review.ts";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const parserOutputCockpitSmokePath =
  "scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs";
const manualParserSmokePath =
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs";
const cockpitSmokePath =
  "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs";
const typeSmokePath = "scripts/smoke-research-candidate-review-types-v0-1.mjs";
const gateSmokePath =
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs";

for (const filePath of [
  componentPath,
  inputFixturePath,
  parserOutputFixturePath,
  originalFixturePath,
  parserPath,
  typePath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  parserOutputCockpitSmokePath,
  manualParserSmokePath,
  cockpitSmokePath,
  typeSmokePath,
  gateSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const component = readFileSync(componentPath, "utf8");
const parserOutputFixtureText = readFileSync(parserOutputFixturePath, "utf8");
const parserOutputFixture = JSON.parse(parserOutputFixtureText);
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const parserOutputCockpitSmoke = readFileSync(
  parserOutputCockpitSmokePath,
  "utf8",
);
const manualParserSmoke = readFileSync(manualParserSmokePath, "utf8");
const cockpitSmoke = readFileSync(cockpitSmokePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const gateSmoke = readFileSync(gateSmokePath, "utf8");

assertParserOutputFixture();
assertCockpitImports();
assertRuntimeParserGuard();
const cockpitSection = extractParserOutputCockpitSection(component);
assertCockpitPreviewContent(cockpitSection);
assertCandidateFamilyRendering(cockpitSection);
assertReadOnlySection(cockpitSection);
assertForbiddenActionControls(cockpitSection);
assertParserOutputFixtureIntegrity(parserOutputFixture.preview);
assertSurfaceDocPointer();
assertGateDocPointer();
assertNextStepAlignment();
assertExistingSmokeAlignment();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns(cockpitSection);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-parser-output-cockpit-preview-v0-1",
      required_files_present: true,
      parser_output_fixture_checked: true,
      cockpit_imports_checked: true,
      runtime_parser_guard_checked: true,
      cockpit_section_markers_checked: true,
      cockpit_preview_content_checked: true,
      candidate_family_rendering_checked: true,
      read_only_section_checked: true,
      forbidden_action_controls_checked: true,
      parser_output_fixture_integrity_checked: true,
      surface_doc_pointer_checked: true,
      gate_doc_pointer_checked: true,
      next_step_alignment_checked: true,
      existing_smoke_alignment_checked: true,
      index_pointer_checked: true,
      package_script_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertParserOutputFixture() {
  assert.equal(
    parserOutputFixture.parser_version,
    "manual_research_note_parser.v0.1",
  );
  assert.equal(parserOutputFixture.input_fixture_path, inputFixturePath);

  for (const [field, expected] of [
    ["preview_only", true],
    ["deterministic_parser_only", true],
    ["provider_calls", false],
    ["retrieval", false],
    ["db_writes", false],
    ["perspective_promotion", false],
    ["proof_or_evidence_writes", false],
  ]) {
    assert.equal(
      parserOutputFixture.authority?.[field],
      expected,
      `parser authority ${field} must be ${expected}`,
    );
  }

  const preview = parserOutputFixture.preview;
  assert.equal(preview.scope, "project:augnes");
  assert.equal(preview.status, "candidate_preview_only");

  for (const [field, expected] of [
    ["candidate_only", true],
    ["source_of_truth", false],
    ["creates_evidence", false],
    ["creates_proof", false],
    ["commits_state", false],
    ["promotes_perspective", false],
    ["creates_work_item", false],
  ]) {
    assert.equal(
      preview.authority?.[field],
      expected,
      `preview authority ${field} must be ${expected}`,
    );
  }
}

function assertCockpitImports() {
  for (const requiredText of [
    "research-candidate-review.manual-note-preview.sample.v0.1.json",
    "research-candidate-review.manual-note.sample.v0.1.txt",
    "ManualResearchNoteParserResult",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_INPUT_FIXTURE_PATH",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_OUTPUT_FIXTURE_PATH",
    "researchCandidateReviewParserOutputPreview",
    'id="research-candidate-review-parser-output-preview"',
    'href="#research-candidate-review-parser-output-preview"',
    "Manual Parser Output Preview",
  ]) {
    assert.ok(component.includes(requiredText), `component must include ${requiredText}`);
  }
}

function assertRuntimeParserGuard() {
  for (const forbiddenName of [
    "parseManualResearchNoteToPreview",
    "parseManualResearchNoteLines",
    "buildManualResearchNotePreview",
  ]) {
    assert.doesNotMatch(
      component,
      new RegExp(`\\b${escapeRegExp(forbiddenName)}\\b`),
      `component must not import or call ${forbiddenName}`,
    );
  }

  assert.match(
    component,
    /import type \{ ManualResearchNoteParserResult \} from "@\/lib\/research-candidate-review\/manual-note-parser";/,
    "component must import ManualResearchNoteParserResult as a type-only import",
  );
}

function extractParserOutputCockpitSection(source) {
  const startMarker =
    "Research Candidate Review Parser Output Cockpit Preview Start";
  const endMarker =
    "Research Candidate Review Parser Output Cockpit Preview End";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  assert.notEqual(start, -1, "parser output cockpit preview start marker must exist");
  assert.notEqual(end, -1, "parser output cockpit preview end marker must exist");
  assert.ok(end > start, "parser output cockpit preview end marker must follow start marker");
  return source.slice(start, end + endMarker.length);
}

function assertCockpitPreviewContent(section) {
  for (const requiredText of [
    "researchCandidateReviewParserOutputPreview",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_INPUT_FIXTURE_PATH",
    "RESEARCH_CANDIDATE_REVIEW_MANUAL_NOTE_OUTPUT_FIXTURE_PATH",
    "parser_version",
    "manual_research_note_parser.v0.1",
    "preview_only",
    "deterministic_parser_only",
    "provider_calls",
    "retrieval",
    "db_writes",
    "perspective_promotion",
    "proof_or_evidence_writes",
    "candidate_preview_only",
    "candidate_only",
    "non-authoritative",
    "research_session_preview",
    "source_reference_previews",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
    "review_status",
    "epistemic_status",
    "source_refs",
    "source_ref_id",
    "target_perspective_key",
    "delta_type",
    "promotion_readiness",
    "warnings",
    "No parser warnings",
    "canonical promotion gate",
    "source title/origin/identifier remain raw/source-bound",
    "stable dotted key",
    "no runtime UI input",
    "no live parser execution",
    "no provider calls",
    "no retrieval",
    "no DB writes",
    "no proof/evidence write",
    "no work item creation",
    "no perspective promotion",
  ]) {
    assert.ok(section.includes(requiredText), `parser output section must include ${requiredText}`);
  }
}

function assertCandidateFamilyRendering(section) {
  for (const family of [
    "source_reference_previews",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
  ]) {
    assert.match(
      section,
      new RegExp(
        `researchCandidateReviewParserOutputPreview\\.preview\\.${family}\\.map\\s*\\(`,
      ),
      `parser output section must render ${family}`,
    );
  }
}

function assertReadOnlySection(section) {
  const forbiddenPatterns = [
    { label: "<button", regex: /<button\b/i },
    { label: "<form", regex: /<form\b/i },
    { label: "<input", regex: /<input\b/i },
    { label: "<textarea", regex: /<textarea\b/i },
    { label: "<select", regex: /<select\b/i },
    { label: "onClick=", regex: /\bonClick=/ },
    { label: "onSubmit=", regex: /\bonSubmit=/ },
    pattern(["fetch"], "\\b", "\\s*\\("),
    { label: "fetchJson", regex: /\bfetchJson\b/ },
    { label: 'method: "POST"', regex: /method:\s*["']POST["']/i },
    { label: 'method: "PUT"', regex: /method:\s*["']PUT["']/i },
    { label: 'method: "PATCH"', regex: /method:\s*["']PATCH["']/i },
    { label: 'method: "DELETE"', regex: /method:\s*["']DELETE["']/i },
    { label: "/api/", regex: /\/api\// },
    { label: "db/", regex: /\bdb\// },
    { label: "migrations/", regex: /\bmigrations\// },
    { label: "createResearchCandidate", regex: /\bcreateResearchCandidate\b/ },
    { label: "promotePerspective", regex: /\bpromotePerspective\b/ },
    { label: "rejectCandidate", regex: /\brejectCandidate\b/ },
    { label: "createWorkItem", regex: /\bcreateWorkItem\b/ },
    { label: "recordProof", regex: /\brecordProof\b/ },
    { label: "recordEvidence", regex: /\brecordEvidence\b/ },
    { label: "executeCodex", regex: /\bexecuteCodex\b/ },
    {
      label: "parseManualResearchNoteToPreview(",
      regex: /\bparseManualResearchNoteToPreview\s*\(/,
    },
    {
      label: "parseManualResearchNoteLines(",
      regex: /\bparseManualResearchNoteLines\s*\(/,
    },
    {
      label: "buildManualResearchNotePreview(",
      regex: /\bbuildManualResearchNotePreview\s*\(/,
    },
    { label: "launch Codex", regex: /\blaunch Codex\b/i },
    { label: "merge", regex: /\bmerge\b/i },
    { label: "publish", regex: /\bpublish\b/i },
    { label: "retry", regex: /\bretry\b/i },
    { label: "replay", regex: /\breplay\b/i },
    { label: "deploy", regex: /\bdeploy\b/i },
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(section, regex, `parser output section must not include ${label}`);
  }
}

function assertForbiddenActionControls(section) {
  const text = section.replace(/<[^>]+>/g, " ").toLowerCase();
  for (const label of [
    "save candidate",
    "save review",
    "parse note",
    "run parser",
    "promote candidate",
    "reject candidate",
    "approve candidate",
    "create work item",
    "execute codex",
    "launch codex",
    "run codex",
    "record proof",
    "record evidence",
    "commit state",
    "merge changes",
    "publish result",
    "retry action",
    "replay action",
    "deploy preview",
  ]) {
    assert.ok(!text.includes(label), `parser output section must not include action-control phrase ${label}`);
  }
}

function assertParserOutputFixtureIntegrity(preview) {
  assertSourceReferenceIntegrity(preview);
  assertSessionPreviewCounts(preview);
  assertCrossReferences(preview);
  assertStableTargetPerspectiveKeys(preview);
}

function assertSurfaceDocPointer() {
  for (const requiredText of [
    "parser output Cockpit/Perspective static preview panel",
    componentPath,
    parserOutputFixturePath,
    inputFixturePath,
    "smoke:research-candidate-review-parser-output-cockpit-preview-v0-1",
    "read-only",
    "static fixture",
    "no runtime UI input",
    "no live parser execution",
    "no provider calls",
    "no retrieval",
    "no DB writes",
    "no promotion behavior",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
  }
}

function assertGateDocPointer() {
  for (const requiredText of [
    "parser output Cockpit/Perspective static preview panel",
    "read-only",
    "static parser output fixture",
    "raw/source-bound",
    "stable dotted key",
    "no runtime/API/DB/provider/retrieval/promotion behavior",
  ]) {
    assert.ok(gateDoc.includes(requiredText), `gate doc must include ${requiredText}`);
  }
}

function assertNextStepAlignment() {
  const expected = /Candidate Constellation Overlay preview/i;
  assert.match(
    extractSection(surfaceDoc, "## Next Recommended Step"),
    expected,
    "surface doc next step must mention Candidate Constellation Overlay preview",
  );
  assert.match(
    extractSection(gateDoc, "## Next Recommended Step"),
    expected,
    "gate doc next step must mention Candidate Constellation Overlay preview",
  );
}

function assertExistingSmokeAlignment() {
  for (const [label, source] of [
    ["manual parser smoke", manualParserSmoke],
    ["cockpit smoke", cockpitSmoke],
    ["type smoke", typeSmoke],
    ["gate smoke", gateSmoke],
  ]) {
    assert.match(
      source,
      /Candidate Constellation Overlay preview/i,
      `${label} must expect Candidate Constellation Overlay preview as next step`,
    );
  }
}

function assertIndexPointer() {
  const pointerStart = index.indexOf("parser output Cockpit/Perspective static preview panel");
  assert.notEqual(pointerStart, -1, "index must mention parser output Cockpit/Perspective static preview panel");
  const pointer = index.slice(pointerStart, pointerStart + 2600);
  for (const requiredText of [
    componentPath,
    parserOutputFixturePath,
    inputFixturePath,
    "smoke:research-candidate-review-parser-output-cockpit-preview-v0-1",
    "read-only",
    "static parser output fixture",
    "no runtime UI input",
    "no live parser execution",
    "no provider calls",
    "no retrieval",
    "no DB writes",
    "no proof/evidence write",
    "no work item creation",
    "no promotion behavior",
    "no runtime/API route",
  ]) {
    assert.ok(pointer.includes(requiredText), `index pointer must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-review-parser-output-cockpit-preview-v0-1"
    ],
    "node scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs",
    "package.json must expose the parser output Cockpit preview smoke",
  );
}

function assertNoForbiddenImplementationPatterns(section) {
  const combinedStaticText = [
    parserOutputCockpitSmoke,
    section,
    extractAround(surfaceDoc, "Parser Output Cockpit Preview Pointer", 2400),
    extractAround(gateDoc, "parser output Cockpit/Perspective static preview panel", 1200),
    extractAround(index, "parser output Cockpit/Perspective static preview panel", 2600),
  ].join("\n\n");
  const forbiddenPatterns = [
    pattern(["child", "_process"], "\\b", "\\b"),
    pattern(["spawn"], "\\b", "\\s*\\("),
    pattern(["exec"], "\\b", "\\s*\\("),
    pattern(["exec", "File"], "\\b", "\\s*\\("),
    pattern(["api", ".github", ".com"], "\\b", "\\b"),
    pattern(["api", ".open", "ai", ".com"], "\\b", "\\b"),
    pattern(["GITHUB", "_TOKEN"], "\\b", "\\b"),
    pattern(["OPEN", "AI", "_API", "_KEY"], "\\b", "\\b"),
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
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(
      combinedStaticText,
      regex,
      `parser output static text must not include ${label}`,
    );
  }
}

function assertSourceReferenceIntegrity(preview) {
  const sourceRefIds = new Set(
    preview.source_reference_previews.map((sourceRef) => sourceRef.source_ref_id),
  );
  assertSourceRefsExist(
    "research_session_preview",
    preview.research_session_preview.session_id,
    preview.research_session_preview.source_refs,
    sourceRefIds,
  );

  for (const item of groundedCandidates(preview)) {
    const id = objectId(item);
    if (Object.hasOwn(item, "source_ref_id")) {
      assert.ok(
        sourceRefIds.has(item.source_ref_id),
        `${id} references missing source_ref_id ${item.source_ref_id}`,
      );
    }
    if (Object.hasOwn(item, "source_refs")) {
      assertSourceRefsExist(id, id, item.source_refs, sourceRefIds);
    }
  }
}

function assertSessionPreviewCounts(preview) {
  const session = preview.research_session_preview;
  assert.equal(session.claim_candidate_count, preview.claim_candidates.length);
  assert.equal(session.evidence_candidate_count, preview.evidence_candidates.length);
  assert.equal(session.tension_candidate_count, preview.tension_candidates.length);
  assert.equal(
    session.knowledge_gap_candidate_count,
    preview.knowledge_gap_candidates.length,
  );
  assert.equal(
    session.perspective_delta_candidate_count,
    preview.perspective_delta_candidates.length,
  );
  assert.equal(
    session.follow_up_work_candidate_count,
    preview.follow_up_work_candidates.length,
  );
}

function assertCrossReferences(preview) {
  const claimIds = new Set(
    preview.claim_candidates.map((item) => item.claim_candidate_id),
  );
  const evidenceIds = new Set(
    preview.evidence_candidates.map((item) => item.evidence_candidate_id),
  );
  const tensionIds = new Set(
    preview.tension_candidates.map((item) => item.tension_candidate_id),
  );
  const gapIds = new Set(
    preview.knowledge_gap_candidates.map(
      (item) => item.knowledge_gap_candidate_id,
    ),
  );

  for (const claim of preview.claim_candidates) {
    assertRefsExist(
      claim.supporting_evidence_candidate_ids,
      evidenceIds,
      `${claim.claim_candidate_id}.supporting_evidence_candidate_ids`,
    );
    assertRefsExist(
      claim.contradicting_evidence_candidate_ids,
      evidenceIds,
      `${claim.claim_candidate_id}.contradicting_evidence_candidate_ids`,
    );
  }

  for (const evidence of preview.evidence_candidates) {
    assert.ok(
      claimIds.has(evidence.claim_candidate_id),
      `${evidence.evidence_candidate_id} references missing claim ${evidence.claim_candidate_id}`,
    );
  }

  for (const tension of preview.tension_candidates) {
    assertRefsExist(
      tension.related_claim_candidate_ids,
      claimIds,
      `${tension.tension_candidate_id}.related_claim_candidate_ids`,
    );
    assertRefsExist(
      tension.related_evidence_candidate_ids,
      evidenceIds,
      `${tension.tension_candidate_id}.related_evidence_candidate_ids`,
    );
  }

  for (const gap of preview.knowledge_gap_candidates) {
    assertRefsExist(
      gap.related_claim_candidate_ids,
      claimIds,
      `${gap.knowledge_gap_candidate_id}.related_claim_candidate_ids`,
    );
    assertRefsExist(
      gap.related_tension_candidate_ids,
      tensionIds,
      `${gap.knowledge_gap_candidate_id}.related_tension_candidate_ids`,
    );
  }

  for (const delta of preview.perspective_delta_candidates) {
    assertRefsExist(
      delta.basis_claim_candidate_ids,
      claimIds,
      `${delta.perspective_delta_candidate_id}.basis_claim_candidate_ids`,
    );
    assertRefsExist(
      delta.basis_evidence_candidate_ids,
      evidenceIds,
      `${delta.perspective_delta_candidate_id}.basis_evidence_candidate_ids`,
    );
    assertRefsExist(
      delta.related_tension_candidate_ids,
      tensionIds,
      `${delta.perspective_delta_candidate_id}.related_tension_candidate_ids`,
    );
    assertRefsExist(
      delta.related_gap_candidate_ids,
      gapIds,
      `${delta.perspective_delta_candidate_id}.related_gap_candidate_ids`,
    );
  }
}

function assertStableTargetPerspectiveKeys(preview) {
  const sourceTitles = new Set(
    preview.source_reference_previews.map((source) => source.title),
  );
  const sourceIdentifiers = new Set(
    preview.source_reference_previews.map((source) => source.identifier_or_url),
  );
  const sourceRefIds = new Set(
    preview.source_reference_previews.map((source) => source.source_ref_id),
  );

  for (const delta of preview.perspective_delta_candidates) {
    const key = delta.target_perspective_key;
    assert.match(
      key,
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
      `${delta.perspective_delta_candidate_id} target_perspective_key must be a stable dotted lower-case key`,
    );
    assert.ok(!sourceTitles.has(key), `${delta.perspective_delta_candidate_id} copied a source title`);
    assert.ok(!sourceIdentifiers.has(key), `${delta.perspective_delta_candidate_id} copied a source identifier`);
    assert.ok(!sourceRefIds.has(key), `${delta.perspective_delta_candidate_id} copied a source_ref_id`);
    assert.doesNotMatch(key, /https?:\/\//, `${delta.perspective_delta_candidate_id} target key must not be a URL`);
    assert.doesNotMatch(
      key,
      /provider|thread|run|workspace|session|demo/i,
      `${delta.perspective_delta_candidate_id} target key must not contain raw trace/demo text`,
    );
  }
}

function groundedCandidates(preview) {
  return [
    ...preview.claim_candidates,
    ...preview.evidence_candidates,
    ...preview.tension_candidates,
    ...preview.knowledge_gap_candidates,
    ...preview.perspective_delta_candidates,
  ];
}

function objectId(item) {
  return (
    item.session_id ??
    item.source_ref_id ??
    item.claim_candidate_id ??
    item.evidence_candidate_id ??
    item.tension_candidate_id ??
    item.knowledge_gap_candidate_id ??
    item.perspective_delta_candidate_id ??
    item.follow_up_work_candidate_id ??
    "(missing object id)"
  );
}

function assertSourceRefsExist(family, objectIdValue, sourceRefs, sourceRefIds) {
  assert.ok(Array.isArray(sourceRefs), `${family} ${objectIdValue} must include source_refs as an array`);
  for (const sourceRef of sourceRefs) {
    assert.ok(sourceRefIds.has(sourceRef), `${family} ${objectIdValue} references missing source ref ${sourceRef}`);
  }
}

function assertRefsExist(refs, idSet, context) {
  assert.ok(Array.isArray(refs), `${context} must be an array`);
  for (const ref of refs) {
    assert.ok(idSet.has(ref), `${context} references missing id ${ref}`);
  }
}

function extractSection(source, heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `missing section ${heading}`);
  const rest = source.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

function extractAround(source, marker, length) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing text marker ${marker}`);
  return source.slice(start, start + length);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${escapeRegExp(label)}${suffix}`, flags),
  };
}
