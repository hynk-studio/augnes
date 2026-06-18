import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const inputFixturePath =
  "fixtures/research-candidate-review.manual-note.sample.v0.1.txt";
const outputFixturePath =
  "fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json";
const typePath = "types/research-candidate-review.ts";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const manualParserSmokePath =
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs";
const cockpitSmokePath =
  "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs";
const typeSmokePath = "scripts/smoke-research-candidate-review-types-v0-1.mjs";
const gateSmokePath =
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs";

for (const filePath of [
  parserPath,
  inputFixturePath,
  outputFixturePath,
  typePath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  manualParserSmokePath,
  cockpitSmokePath,
  typeSmokePath,
  gateSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const parserSource = readFileSync(parserPath, "utf8");
const inputFixture = readFileSync(inputFixturePath, "utf8");
const outputFixtureText = readFileSync(outputFixturePath, "utf8");
const outputFixture = JSON.parse(outputFixtureText);
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const manualParserSmoke = readFileSync(manualParserSmokePath, "utf8");
const cockpitSmoke = readFileSync(cockpitSmokePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const gateSmoke = readFileSync(gateSmokePath, "utf8");

assertParserExports();
assertParserPurity();
assertPrefixGrammar();
assertInputFixture();
assertExpectedOutputFixture();
await assertParserExecution();
assertDocsPointers();
assertExistingSmokeAlignment();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-manual-parser-v0-1",
      required_files_present: true,
      parser_exports_checked: true,
      parser_purity_checked: true,
      prefix_grammar_checked: true,
      input_fixture_checked: true,
      expected_output_fixture_checked: true,
      parser_execution_checked: true,
      source_ref_integrity_checked: true,
      session_preview_counts_checked: true,
      cross_references_checked: true,
      canonical_gate_alignment_checked: true,
      docs_pointer_checked: true,
      existing_smoke_alignment_checked: true,
      index_pointer_checked: true,
      package_script_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertParserExports() {
  for (const exportName of [
    "ManualResearchNoteParserVersion",
    "ManualResearchNoteParserOptions",
    "ManualResearchNoteParserWarning",
    "ManualResearchNoteParserResult",
  ]) {
    assert.match(
      parserSource,
      new RegExp(`export\\s+type\\s+${escapeRegExp(exportName)}\\b`),
      `parser source must export ${exportName}`,
    );
  }

  for (const exportName of [
    "parseManualResearchNoteToPreview",
    "parseManualResearchNoteLines",
    "buildManualResearchNotePreview",
  ]) {
    assert.match(
      parserSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `parser source must export ${exportName}`,
    );
  }

  assert.match(
    parserSource,
    /manual_research_note_parser\.v0\.1/,
    "parser source must mention manual_research_note_parser.v0.1",
  );
}

function assertParserPurity() {
  assert.match(
    parserSource,
    /import type \{[\s\S]+?\} from "@\/types\/research-candidate-review";/,
    "parser must import only types from research-candidate-review",
  );
  assert.doesNotMatch(
    parserSource,
    /^import\s+(?!type\b)/m,
    "parser must not import runtime modules",
  );

  for (const { label, regex } of [
    pattern(["node", ":fs"]),
    pattern(["node", ":http"]),
    pattern(["node", ":https"]),
    pattern(["child", "_process"]),
    pattern(["fetch"], "\\b", "\\s*\\("),
    pattern(["process", ".env"], "\\b", "\\b"),
    pattern(["Date", ".now"], "\\b", "\\s*\\("),
    pattern(["Math", ".random"], "\\b", "\\s*\\("),
    pattern(["api", ".open", "ai", ".com"]),
    pattern(["provider", "SDK"], "\\b", "\\b", "i"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["Next", "Response"], "\\b", "\\b"),
    pattern(["route", ".ts"], "\\b", "\\b"),
    pattern(["use", " client"], "\\b", "\\b"),
  ]) {
    assert.doesNotMatch(parserSource, regex, `parser source must not include ${label}`);
  }
}

function assertPrefixGrammar() {
  for (const prefix of [
    "Research Question:",
    "Operator Intent:",
    "Source Title:",
    "Source Origin:",
    "Source Identifier:",
    "Claim:",
    "Evidence:",
    "Tension:",
    "Gap:",
    "Perspective Delta:",
    "Next:",
    "연구질문:",
    "의도:",
    "출처제목:",
    "출처:",
    "식별자:",
    "주장:",
    "근거:",
    "긴장:",
    "공백:",
    "관점변화:",
    "다음:",
  ]) {
    assert.ok(parserSource.includes(prefix), `parser source must include prefix ${prefix}`);
  }
}

function assertInputFixture() {
  for (const prefix of [
    "Research Question:",
    "Claim:",
    "Evidence:",
    "Tension:",
    "Gap:",
    "Perspective Delta:",
    "Next:",
  ]) {
    assert.ok(inputFixture.includes(prefix), `input fixture must include ${prefix}`);
  }

  for (const { label, regex } of [
    { label: "http://", regex: /http:\/\// },
    { label: "https://", regex: /https:\/\// },
    pattern(["provider", "_run"]),
    pattern(["thread", "_"]),
    pattern(["workspace", "_"]),
    pattern(["OPEN", "AI", "_API", "_KEY"]),
    pattern(["GITHUB", "_TOKEN"]),
    { label: "email address", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  ]) {
    assert.doesNotMatch(inputFixture, regex, `input fixture must not include ${label}`);
  }
}

function assertExpectedOutputFixture() {
  assert.equal(outputFixture.parser_version, "manual_research_note_parser.v0.1");
  assert.equal(outputFixture.input_fixture_path, inputFixturePath);

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
      outputFixture.authority?.[field],
      expected,
      `parser fixture authority ${field} must be ${expected}`,
    );
  }

  const preview = outputFixture.preview;
  assert.equal(preview.preview_version, "research_candidate_review.v0.1");
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

  for (const family of requiredPreviewFamilies()) {
    assert.ok(Object.hasOwn(preview, family), `preview must include ${family}`);
  }

  assert.ok(preview.source_reference_previews.length === 1, "preview must contain one source reference");
  assert.ok(preview.claim_candidates.length >= 1, "preview must contain claim candidates");
  assert.ok(preview.evidence_candidates.length >= 2, "preview must contain evidence candidates");
  assert.ok(preview.tension_candidates.length >= 1, "preview must contain tension candidates");
  assert.ok(preview.knowledge_gap_candidates.length >= 1, "preview must contain knowledge gap candidates");
  assert.ok(preview.perspective_delta_candidates.length >= 1, "preview must contain perspective delta candidates");
  assert.ok(preview.follow_up_work_candidates.length >= 1, "preview must contain follow-up work candidates");

  for (const item of everyPreviewObject(preview)) {
    assert.ok(item.review_status, `${objectId(item)} must include review_status`);
    assert.ok(item.boundary_notes, `${objectId(item)} must include boundary_notes`);
  }

  for (const item of groundedCandidates(preview)) {
    assert.ok(item.epistemic_status, `${objectId(item)} must include epistemic_status`);
    assert.ok(
      typeof item.source_ref_id === "string" || Array.isArray(item.source_refs),
      `${objectId(item)} must include source_ref_id or source_refs`,
    );
  }

  assertSourceReferenceIntegrity(preview);
  assertSessionPreviewCounts(preview);
  assertCrossReferences(preview);
  assertCanonicalGateAlignment(preview);
}

async function assertParserExecution() {
  const parserModule = await importParserModule();
  const result = parserModule.parseManualResearchNoteToPreview(inputFixture);
  assert.deepEqual(
    result,
    {
      parser_version: outputFixture.parser_version,
      preview: outputFixture.preview,
      warnings: outputFixture.warnings,
      authority: outputFixture.authority,
    },
    "parser output must match expected output fixture exactly",
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    parserPath,
    inputFixturePath,
    outputFixturePath,
    "smoke:research-candidate-review-manual-parser-v0-1",
    "preview-only",
    "deterministic parser",
    "no provider calls",
    "no retrieval",
    "no DB writes",
    "no promotion behavior",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
  }

  assert.match(
    gateDoc,
    /manual parser preserves canonical promotion gates/i,
    "gate doc must mention manual parser canonical gate preservation",
  );
  assert.match(
    gateDoc,
    /raw source strings remain raw\/source-bound/i,
    "gate doc must keep raw source strings raw/source-bound",
  );
  assert.match(
    gateDoc,
    /no runtime\/API\/DB\/provider\/retrieval\/promotion behavior/i,
    "gate doc must preserve no runtime/API/DB/provider/retrieval/promotion boundary",
  );

  const expectedNextStep = /Research Candidate Review v0\.1 milestone closeout docs/i;
  assert.match(
    extractSection(surfaceDoc, "## Next Recommended Step"),
    expectedNextStep,
    "surface doc next step must point to Research Candidate Review v0.1 milestone closeout docs",
  );
  assert.match(
    extractSection(gateDoc, "## Next Recommended Step"),
    expectedNextStep,
    "gate doc next step must point to Research Candidate Review v0.1 milestone closeout docs",
  );
}

function assertExistingSmokeAlignment() {
  for (const [label, source] of [
    ["cockpit smoke", cockpitSmoke],
    ["type smoke", typeSmoke],
    ["gate smoke", gateSmoke],
  ]) {
    assert.match(
      source,
      /Research Candidate Review v0\.1 milestone closeout docs/i,
      `${label} must expect the Research Candidate Review v0.1 milestone closeout docs next step`,
    );
  }
}

function assertIndexPointer() {
  const pointerStart = index.indexOf(parserPath);
  assert.notEqual(pointerStart, -1, "index must mention the manual parser helper");
  const pointer = index.slice(pointerStart, pointerStart + 2600);
  for (const requiredText of [
    parserPath,
    inputFixturePath,
    outputFixturePath,
    "smoke:research-candidate-review-manual-parser-v0-1",
    "preview-only deterministic parser",
    "no provider calls",
    "no retrieval",
    "no DB writes",
    "no runtime/API route",
    "no UI input behavior",
    "no proof/evidence write",
    "no work item creation",
    "no promotion behavior",
  ]) {
    assert.ok(pointer.includes(requiredText), `index pointer must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-review-manual-parser-v0-1"],
    "node scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
    "package.json must expose the manual parser smoke",
  );
}

function assertNoForbiddenImplementationPatterns() {
  const combinedStaticText = [
    parserSource,
    inputFixture,
    outputFixtureText,
    extractAround(surfaceDoc, "Manual Parser Preview Pointer", 2200),
    extractSection(gateDoc, "## Static Audit Scope"),
    extractAround(index, parserPath, 2600),
    manualParserSmoke,
  ].join("\n\n");
  assert.doesNotMatch(
    [parserSource, inputFixture, outputFixtureText, manualParserSmoke].join("\n\n"),
    pattern(["open", "ai"], "\\b", "\\b", "i").regex,
    "manual parser source, fixtures, and smoke must not include provider implementation text",
  );
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
    pattern(["use", " client"], "\\b", "\\b"),
    pattern(["pris", "ma"], "\\b", "\\b", "i"),
    pattern(["sql", "ite"], "\\b", "\\b", "i"),
    pattern(["driz", "zle"], "\\b", "\\b", "i"),
    pattern(["supa", "base"], "\\b", "\\b", "i"),
    pattern(["embed", "dings"], "\\b", "\\b", "i"),
    pattern(["vec", "tor"], "\\b", "\\b", "i"),
    pattern(["r", "ag"], "\\b", "\\b", "i"),
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(
      combinedStaticText,
      regex,
      `manual parser static text must not include ${label}`,
    );
  }
}

async function importParserModule() {
  const transformedSource = stripTypeScriptTypes(parserSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
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

function assertCanonicalGateAlignment(preview) {
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

function requiredPreviewFamilies() {
  return [
    "research_session_preview",
    "source_reference_previews",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
  ];
}

function everyPreviewObject(preview) {
  return [
    preview.research_session_preview,
    ...preview.source_reference_previews,
    ...preview.claim_candidates,
    ...preview.evidence_candidates,
    ...preview.tension_candidates,
    ...preview.knowledge_gap_candidates,
    ...preview.perspective_delta_candidates,
    ...preview.follow_up_work_candidates,
  ];
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
