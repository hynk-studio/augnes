import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const componentPath = "components/augnes-cockpit.tsx";
const fixturePath = "fixtures/research-candidate-review.sample.v0.1.json";
const typePath = "types/research-candidate-review.ts";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath = "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const cockpitSmokePath = "scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs";
const typeSmokePath = "scripts/smoke-research-candidate-review-types-v0-1.mjs";
const gateSmokePath = "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs";

for (const filePath of [
  componentPath,
  fixturePath,
  typePath,
  surfaceDocPath,
  gateDocPath,
  indexPath,
  packagePath,
  cockpitSmokePath,
  typeSmokePath,
  gateSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const component = readFileSync(componentPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const typeFile = readFileSync(typePath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const cockpitSmoke = readFileSync(cockpitSmokePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const gateSmoke = readFileSync(gateSmokePath, "utf8");

assertFixtureShape();
assertCockpitImports();
const cockpitSection = extractCockpitPreviewSection(component);
assertPreviewContent(cockpitSection);
assertCandidateFamilyRendering(cockpitSection);
assertReadOnlySection(cockpitSection);
assertForbiddenActionControls(cockpitSection);
assertSurfaceDocPointer();
assertGateDocNextStep();
assertSurfaceDocNextStep();
assertExistingSmokeAlignment();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns(cockpitSection);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-cockpit-preview-v0-1",
      required_files_present: true,
      fixture_shape_checked: true,
      cockpit_imports_checked: true,
      cockpit_section_markers_checked: true,
      cockpit_preview_content_checked: true,
      candidate_family_rendering_checked: true,
      read_only_section_checked: true,
      forbidden_action_controls_checked: true,
      surface_doc_pointer_checked: true,
      gate_doc_next_step_checked: true,
      surface_doc_next_step_checked: true,
      existing_smoke_alignment_checked: true,
      index_pointer_checked: true,
      package_script_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertFixtureShape() {
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
    assert.equal(
      fixture.authority?.[field],
      expected,
      `fixture authority ${field} must be ${expected}`,
    );
  }
}

function assertCockpitImports() {
  assert.match(
    component,
    /research-candidate-review\.sample\.v0\.1\.json/,
    "Cockpit component must mention the Research Candidate Review fixture",
  );
  assert.match(
    component,
    /ResearchCandidateReviewSampleFixture/,
    "Cockpit component must use the ResearchCandidateReviewSampleFixture type",
  );
  assert.match(
    component,
    /RESEARCH_CANDIDATE_REVIEW_SAMPLE_FIXTURE_PATH/,
    "Cockpit component must include the static fixture path constant",
  );
  assert.match(
    component,
    /id="research-candidate-review-preview"/,
    "Cockpit component must include the preview section id",
  );
  assert.match(
    component,
    /href="#research-candidate-review-preview"/,
    "Cockpit component must include a local anchor to the preview section",
  );
  assert.match(
    component,
    /Research Candidate Review/,
    "Cockpit component must include a visible Research Candidate Review title",
  );
}

function extractCockpitPreviewSection(source) {
  const startMarker = "Research Candidate Review Cockpit Preview Start";
  const endMarker = "Research Candidate Review Cockpit Preview End";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  assert.notEqual(start, -1, "Cockpit preview start marker must exist");
  assert.notEqual(end, -1, "Cockpit preview end marker must exist");
  assert.ok(end > start, "Cockpit preview end marker must follow start marker");
  return source.slice(start, end + endMarker.length);
}

function assertPreviewContent(section) {
  for (const requiredText of [
    "researchCandidateReviewPreview",
    "RESEARCH_CANDIDATE_REVIEW_SAMPLE_FIXTURE_PATH",
    "sample_fixture_only",
    "candidate_only",
    "non-authoritative",
    "source_of_truth",
    "creates_evidence",
    "creates_proof",
    "promotes_perspective",
    "creates_work_item",
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
    "canonical promotion gate",
    "no proof/evidence write",
    "no durable research write",
    "no perspective promotion",
    "no work item creation",
    "no Codex execution",
    "no runtime/API/DB/provider/retrieval behavior",
  ]) {
    assert.ok(section.includes(requiredText), `preview section must include ${requiredText}`);
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
      new RegExp(`researchCandidateReviewPreview\\.${family}\\.map\\s*\\(`),
      `preview section must render ${family}`,
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
    { label: ["fetch", "("].join(""), regex: pattern(["fetch"], "\\b", "\\s*\\(").regex },
    { label: "fetchJson", regex: /\bfetchJson\b/ },
    { label: "method POST", regex: /method:\s*["']POST["']/i },
    { label: "method PUT", regex: /method:\s*["']PUT["']/i },
    { label: "method PATCH", regex: /method:\s*["']PATCH["']/i },
    { label: "method DELETE", regex: /method:\s*["']DELETE["']/i },
    { label: "/api/", regex: /\/api\// },
    { label: "db/", regex: /\bdb\// },
    { label: "migrations/", regex: /\bmigrations\//i },
    { label: "createResearchCandidate", regex: /\bcreateResearchCandidate\b/ },
    { label: "promotePerspective", regex: /\bpromotePerspective\b/ },
    { label: "rejectCandidate", regex: /\brejectCandidate\b/ },
    { label: "createWorkItem", regex: /\bcreateWorkItem\b/ },
    { label: "recordProof", regex: /\brecordProof\b/ },
    { label: "recordEvidence", regex: /\brecordEvidence\b/ },
    { label: "executeCodex", regex: /\bexecuteCodex\b/ },
    { label: "launch Codex", regex: /\blaunch Codex\b/i },
    { label: "merge", regex: /\bmerge\b/i },
    { label: "publish", regex: /\bpublish\b/i },
    { label: "retry", regex: /\bretry\b/i },
    { label: "replay", regex: /\breplay\b/i },
    { label: "deploy", regex: /\bdeploy\b/i },
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(section, regex, `preview section must not include ${label}`);
  }
}

function assertForbiddenActionControls(section) {
  const text = stripMarkup(section).toLowerCase();
  const actionControlPhrases = [
    "save candidate",
    "save review",
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
  ];

  for (const phrase of actionControlPhrases) {
    assert.ok(!text.includes(phrase), `preview section must not include action control phrase ${phrase}`);
  }
}

function assertSurfaceDocPointer() {
  assert.match(surfaceDoc, new RegExp(escapeRegExp(typePath)), "surface doc must mention the type contract");
  assert.match(
    surfaceDoc,
    /smoke:research-candidate-review-cockpit-preview-v0-1/,
    "surface doc must mention the Cockpit preview smoke",
  );
  assert.match(surfaceDoc, /read-only/i, "surface doc must state the preview is read-only");
  assert.match(
    surfaceDoc,
    /static fixture only/i,
    "surface doc must state the preview is static fixture only",
  );
}

function assertGateDocNextStep() {
  const nextStep = extractSection(gateDoc, "## Next Recommended Step");
  assert.match(
    nextStep,
    /manual pasted research note parser preview-only/i,
    "gate doc next step must mention Manual pasted research note parser preview-only",
  );
}

function assertSurfaceDocNextStep() {
  const nextStep = extractSection(surfaceDoc, "## Next Recommended Step");
  assert.match(
    nextStep,
    /manual pasted research note parser preview-only/i,
    "surface doc next step must mention Manual pasted research note parser preview-only",
  );
}

function assertExistingSmokeAlignment() {
  assert.match(
    typeSmoke,
    /manual pasted research note parser preview-only/i,
    "type smoke must expect the new parser preview-only next step",
  );
  assert.match(
    gateSmoke,
    /manual pasted research note parser preview-only/i,
    "gate smoke must expect the new parser preview-only next step",
  );
}

function assertIndexPointer() {
  const reviewPointerStart = index.indexOf(surfaceDocPath);
  assert.notEqual(reviewPointerStart, -1, "index must mention the Research Candidate Review surface doc");
  const pointerStart = index.indexOf(componentPath, reviewPointerStart);
  assert.notEqual(pointerStart, -1, "index must mention the read-only Cockpit/Perspective preview");
  const pointer = index.slice(pointerStart, pointerStart + 2600);
  for (const requiredText of [
    componentPath,
    fixturePath,
    typePath,
    "smoke:research-candidate-review-cockpit-preview-v0-1",
    "static fixture only",
    "read-only",
    "non-authoritative",
    "no runtime/API/DB/provider/retrieval/promotion behavior",
    "no parser behavior",
    "no work item creation",
    "no proof/evidence write",
  ]) {
    assert.ok(pointer.includes(requiredText), `index pointer must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-review-cockpit-preview-v0-1"],
    "node scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs",
    "package.json must expose the Research Candidate Review Cockpit preview smoke",
  );
}

function assertNoForbiddenImplementationPatterns(section) {
  const docsPointerText = [
    extractAround(surfaceDoc, "Cockpit Static Preview Pointer", 1800),
    extractAround(gateDoc, "Next Recommended Step", 800),
  ].join("\n\n");
  const indexPointerText = extractAround(index, "Research Candidate Review read-only", 2600);
  const combinedStaticText = [
    cockpitSmoke,
    section,
    docsPointerText,
    indexPointerText,
  ].join("\n\n");
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
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(
      combinedStaticText,
      regex,
      `static Cockpit preview text must not include ${label}`,
    );
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

function stripMarkup(source) {
  return source.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
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
