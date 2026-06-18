import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.sample.v0.1.json";
const smokePath = "scripts/smoke-research-candidate-review-surface-v0-1.mjs";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const capabilityLanesDocPath = "docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md";
const scenarioPackDocPath = "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md";

for (const filePath of [
  docPath,
  fixturePath,
  smokePath,
  indexPath,
  packagePath,
  capabilityLanesDocPath,
  scenarioPackDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFileSync(docPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const fixture = JSON.parse(fixtureText);

const requiredHeadings = [
  "# Augnes Research Candidate Review Surface v0.1",
  "## Purpose",
  "## Source Work Routing",
  "## Relationship To Existing Research Capability Lanes",
  "## Preview Contract",
  "## Candidate Object Families",
  "## Perspective Delta Candidate Grammar",
  "## Review Status And Epistemic Status",
  "## Authority Model",
  "## First User-Facing Surface",
  "## Fixture Contract",
  "## Expected Files And Checks",
  "## Scoped Stop Conditions",
  "## What This Slice Implements",
  "## What This Slice Does Not Implement",
  "## Next Recommended Step",
];

const objectFamilies = [
  "research_session_preview",
  "source_reference_preview",
  "claim_candidate",
  "evidence_candidate",
  "tension_candidate",
  "knowledge_gap_candidate",
  "perspective_delta_candidate",
  "follow_up_work_candidate",
];

const deltaTypeValues = [
  "add",
  "refine",
  "weaken",
  "reverse",
  "split",
  "merge",
  "retire",
  "reweight",
  "reactivate",
];

const promotionReadinessValues = [
  "not_ready",
  "weak_ready",
  "ready_with_tensions",
  "ready",
  "blocked",
];

assertDocContract();
assertFixtureContract();
assertPackageScript();
assertIndexPointers();
assertNoForbiddenImplementationPatterns([doc, fixtureText, index].join("\n\n"));

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-surface-v0-1",
      required_files_present: true,
      required_headings_checked: true,
      source_work_routing_checked: true,
      related_docs_checked: true,
      object_families_checked: true,
      delta_type_values_checked: true,
      review_and_epistemic_status_checked: true,
      scoped_boundary_language_checked: true,
      fixture_json_checked: true,
      fixture_counts_checked: true,
      candidate_required_fields_checked: true,
      authority_flags_checked: true,
      package_script_checked: true,
      index_pointer_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertDocContract() {
  for (const heading of requiredHeadings) {
    assert.match(doc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `doc must include ${heading}`);
  }

  assert.match(
    doc,
    /candidate-only review surface for manually supplied\s+source\/reference\/notes/i,
    "doc must define a candidate-only review surface for manual source/reference/notes",
  );
  assert.match(
    doc,
    /does not make papers, notes, or sessions into durable knowledge/i,
    "doc must state that the surface does not create durable knowledge",
  );
  assert.match(doc, /\bAG-RESEARCH-CAPABILITY-LANES-001\b/, "doc must name the capability lanes work ID");
  assert.match(
    doc,
    /npm run codex:next-work -- --scope project:augnes --prefer-research/,
    "doc must include the preferred research fallback command",
  );
  assert.match(
    doc,
    /\bAG-DOGFOOD-RESEARCH-001\b[\s\S]*historical dogfood evidence/i,
    "doc must keep historical dogfood evidence distinct",
  );
  assert.match(
    doc,
    new RegExp(escapeRegExp(capabilityLanesDocPath)),
    "doc must link to the capability lanes preparation doc",
  );
  assert.match(
    doc,
    new RegExp(escapeRegExp(scenarioPackDocPath)),
    "doc must link to the scenario pack doc",
  );
  assert.match(
    doc,
    /This PR advances the first recommended product slice named by the Research\s+Capability Lanes Preparation document\./,
    "doc must state that this PR advances the first recommended product slice",
  );

  for (const family of objectFamilies) {
    assert.match(doc, new RegExp(`^### ${escapeRegExp(family)}$`, "m"), `doc must define ${family}`);
  }

  for (const value of deltaTypeValues) {
    assert.match(doc, new RegExp(`- \`${escapeRegExp(value)}\``), `doc must define delta_type value ${value}`);
  }
  for (const value of promotionReadinessValues) {
    assert.match(doc, new RegExp(`- \`${escapeRegExp(value)}\``), `doc must define promotion_readiness value ${value}`);
  }

  assert.match(doc, /`review_status` describes operator\/reviewer workflow posture/i);
  assert.match(doc, /`epistemic_status` describes the current knowledge posture/i);
  assert.match(doc, /Reviewed does not mean true\./);
  assert.match(doc, /Supported does not mean promoted\./);
  assert.match(doc, /Candidate does not mean evidence\./);
  assert.match(
    doc,
    /These boundaries apply to this slice\. They do not permanently ban future\s+bounded research lanes\./,
    "doc must scope boundaries to this slice without permanently banning future lanes",
  );
  assert.match(
    doc,
    /A perspective delta candidate is not a committed perspective update/,
    "doc must keep perspective deltas candidate-only",
  );
}

function assertFixtureContract() {
  assert.equal(fixture.fixture_version, "research_candidate_review.sample.v0.1");
  assert.equal(fixture.scope, "project:augnes");
  assert.equal(fixture.status, "sample_fixture_only");

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

  assert.ok(Array.isArray(fixture.source_reference_previews), "source_reference_previews must be an array");
  assert.ok(Array.isArray(fixture.claim_candidates), "claim_candidates must be an array");
  assert.ok(Array.isArray(fixture.evidence_candidates), "evidence_candidates must be an array");
  assert.ok(Array.isArray(fixture.tension_candidates), "tension_candidates must be an array");
  assert.ok(Array.isArray(fixture.knowledge_gap_candidates), "knowledge_gap_candidates must be an array");
  assert.ok(Array.isArray(fixture.perspective_delta_candidates), "perspective_delta_candidates must be an array");
  assert.ok(Array.isArray(fixture.follow_up_work_candidates), "follow_up_work_candidates must be an array");

  assert.ok(fixture.source_reference_previews.length >= 1, "fixture must have at least 1 source reference");
  assert.ok(fixture.claim_candidates.length >= 2, "fixture must have at least 2 claim candidates");
  assert.ok(fixture.evidence_candidates.length >= 2, "fixture must have at least 2 evidence candidates");
  assert.ok(fixture.tension_candidates.length >= 1, "fixture must have at least 1 tension candidate");
  assert.ok(fixture.knowledge_gap_candidates.length >= 1, "fixture must have at least 1 knowledge gap candidate");
  assert.ok(fixture.perspective_delta_candidates.length >= 1, "fixture must have at least 1 perspective delta candidate");
  assert.ok(fixture.follow_up_work_candidates.length >= 1, "fixture must have at least 1 follow-up work candidate");

  for (const item of [
    fixture.research_session_preview,
    ...fixture.source_reference_previews,
    ...fixture.claim_candidates,
    ...fixture.evidence_candidates,
    ...fixture.tension_candidates,
    ...fixture.knowledge_gap_candidates,
    ...fixture.perspective_delta_candidates,
    ...fixture.follow_up_work_candidates,
  ]) {
    assert.ok(item.review_status, "every preview/candidate object must include review_status");
    assert.ok(item.boundary_notes, "every preview/candidate object must include boundary_notes");
  }

  for (const item of [
    ...fixture.claim_candidates,
    ...fixture.evidence_candidates,
    ...fixture.tension_candidates,
    ...fixture.knowledge_gap_candidates,
    ...fixture.perspective_delta_candidates,
  ]) {
    assert.ok(item.epistemic_status, "grounded candidates must include epistemic_status");
    assert.ok(
      typeof item.source_ref_id === "string" || Array.isArray(item.source_refs),
      "grounded candidates must include source_ref_id or source_refs",
    );
  }

  assert.equal(fixture.authority?.candidate_only, true, "fixture authority must be candidate_only true");
  assert.equal(fixture.authority?.source_of_truth, false, "fixture authority must be source_of_truth false");
  assert.equal(fixture.authority?.creates_evidence, false, "fixture authority must be creates_evidence false");
  assert.equal(fixture.authority?.creates_proof, false, "fixture authority must be creates_proof false");
  assert.equal(fixture.authority?.commits_state, false, "fixture authority must be commits_state false");
  assert.equal(
    fixture.authority?.promotes_perspective,
    false,
    "fixture authority must be promotes_perspective false",
  );
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-review-surface-v0-1"],
    "node scripts/smoke-research-candidate-review-surface-v0-1.mjs",
    "package.json must expose the research candidate review surface smoke",
  );
}

function assertIndexPointers() {
  const pointerStart = index.indexOf(docPath);
  assert.notEqual(pointerStart, -1, "index must point to the new doc");
  const pointer = index.slice(pointerStart, pointerStart + 1400);
  assert.match(pointer, new RegExp(escapeRegExp(fixturePath)), "index pointer must mention the fixture");
  assert.match(
    pointer,
    /npm run smoke:research-candidate-review-surface-v0-1/,
    "index pointer must mention the package smoke command",
  );
  assert.match(pointer, /candidate-only/, "index pointer must mention candidate-only");
  assert.match(pointer, /non-authoritative/, "index pointer must mention non-authoritative");
  assert.match(
    pointer,
    /no runtime\/API\/DB\/provider\/retrieval\/promotion behavior in this slice/,
    "index pointer must state no runtime/API/DB/provider/retrieval/promotion behavior",
  );
}

function assertNoForbiddenImplementationPatterns(source) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bexecFile\s*\(/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bGITHUB_TOKEN\b/,
    /\bOPENAI_API_KEY\b/,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\bcommitStateUpdate\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bCREATE\s+TABLE\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bINSERT\s+INTO\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `static docs/index/fixture must not include ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
