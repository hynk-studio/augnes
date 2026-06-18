import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const gateDocPath = "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const gateFixturePath = "fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json";
const reviewDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const reviewFixturePath = "fixtures/research-candidate-review.sample.v0.1.json";
const typePath = "types/research-candidate-review.ts";
const typeSmokePath = "scripts/smoke-research-candidate-review-types-v0-1.mjs";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  gateDocPath,
  gateFixturePath,
  reviewDocPath,
  reviewFixturePath,
  typePath,
  typeSmokePath,
  indexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const gateDoc = readFileSync(gateDocPath, "utf8");
const gateFixtureText = readFileSync(gateFixturePath, "utf8");
const gateSmoke = readFileSync("scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs", "utf8");
const reviewDoc = readFileSync(reviewDocPath, "utf8");
const reviewFixtureText = readFileSync(reviewFixturePath, "utf8");
const typeFile = readFileSync(typePath, "utf8");
const typeSmoke = readFileSync(typeSmokePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const gateFixture = JSON.parse(gateFixtureText);
const reviewFixture = JSON.parse(reviewFixtureText);

const requiredHeadings = [
  "# Augnes Research Candidate Canonical Promotion Gates v0.1",
  "## Purpose",
  "## Source Work Routing",
  "## Relationship To Research Candidate Review Surface",
  "## Threat Model",
  "## Gate Vocabulary",
  "## Blocked Promotion Targets",
  "## Allowed Pointer And Candidate Uses",
  "## Allowed Low-Cardinality Vocabulary",
  "## Gate Rules",
  "## Sample Fixture Contract",
  "## Static Audit Scope",
  "## Expected Files And Checks",
  "## Scoped Stop Conditions",
  "## What This Slice Implements",
  "## What This Slice Does Not Implement",
  "## Next Recommended Step",
];

const unstableInputClasses = [
  "source_title",
  "source_url",
  "doi_or_identifier",
  "provider_id",
  "workspace_id",
  "thread_id",
  "run_id",
  "raw_session_id",
  "arbitrary_user_string",
  "episode_id",
  "demo_db_ref",
];

const inputClassValues = [
  ...unstableInputClasses,
  "source_ref_id",
  "candidate_id",
  "repo_path",
  "work_id",
  "low_cardinality_enum",
];

const proposedUsageValues = [
  "raw_display",
  "source_pointer",
  "local_candidate_id",
  "local_preview_id",
  "review_label",
  "canonical_state_label",
  "dashboard_group_key",
  "task_schema_id",
  "evidence_metadata_promoted_key",
  "operational_tag",
  "type_union_literal",
];

const blockedPromotionTargets = [
  "canonical_state_label",
  "dashboard_group_key",
  "task_schema_id",
  "evidence_metadata_promoted_key",
  "operational_tag",
];

const dispositionValues = [
  "blocked_canonical_promotion",
  "raw_only",
  "source_pointer_only",
  "candidate_id_only",
  "allowed_repo_path_pointer",
  "allowed_work_id_pointer",
  "allowed_low_cardinality_enum",
];

const allowedPointerDispositions = [
  "source_pointer_only",
  "candidate_id_only",
  "allowed_repo_path_pointer",
  "allowed_work_id_pointer",
  "raw_only",
];

assertDocGateContract();
assertFixtureShape();
assertBlockedSamples();
assertAllowedPointerSamples();
assertAllowedLowCardinalitySamples();
assertTypeContractAlignment();
assertExistingFixtureTargetKeys();
assertIndexPointer();
assertPackageScript();
assertNoForbiddenImplementationPatterns();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-canonical-promotion-gates-v0-1",
      required_files_present: true,
      doc_gate_contract_checked: true,
      blocked_promotion_targets_checked: true,
      gate_rules_checked: true,
      fixture_shape_checked: true,
      blocked_samples_checked: true,
      allowed_pointer_samples_checked: true,
      allowed_low_cardinality_samples_checked: true,
      type_contract_alignment_checked: true,
      existing_fixture_target_key_checked: true,
      index_pointer_checked: true,
      package_script_checked: true,
      forbidden_implementation_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertDocGateContract() {
  for (const heading of requiredHeadings) {
    assert.match(gateDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `gate doc must include ${heading}`);
  }

  for (const value of inputClassValues) {
    assert.match(gateDoc, tickedValuePattern(value), `gate doc must define input_class ${value}`);
  }
  for (const value of proposedUsageValues) {
    assert.match(gateDoc, tickedValuePattern(value), `gate doc must define proposed_usage ${value}`);
  }
  for (const value of dispositionValues) {
    assert.match(gateDoc, tickedValuePattern(value), `gate doc must define disposition ${value}`);
  }
  for (const target of blockedPromotionTargets) {
    assert.match(gateDoc, tickedValuePattern(target), `gate doc must list blocked target ${target}`);
  }

  for (let gateNumber = 1; gateNumber <= 8; gateNumber += 1) {
    const gateId = `RCR-GATE-${String(gateNumber).padStart(3, "0")}`;
    assert.match(gateDoc, new RegExp(escapeRegExp(gateId)), `gate doc must include ${gateId}`);
  }

  assert.match(gateDoc, /static audit only/i, "gate doc must state static audit only");
  assert.match(
    gateDoc,
    /does not permanently ban future bounded research lanes/i,
    "gate doc must preserve future bounded research lane boundary",
  );
  assert.match(
    gateDoc,
    /no runtime\/API\/DB\/provider\/retrieval\/persistence behavior/i,
    "gate doc must state no runtime/API/DB/provider/retrieval/persistence behavior",
  );
  assert.match(
    gateDoc,
    /Research Candidate Review v0\.1 milestone closeout docs/i,
    "gate doc next step must point to Research Candidate Review v0.1 milestone closeout docs",
  );
}

function assertFixtureShape() {
  assert.equal(gateFixture.gate_fixture_version, "research_candidate_canonical_promotion_gates.sample.v0.1");
  assert.equal(gateFixture.scope, "project:augnes");
  assert.equal(gateFixture.status, "sample_fixture_only");

  for (const [field, expected] of [
    ["static_audit_only", true],
    ["source_of_truth", false],
    ["creates_evidence", false],
    ["creates_proof", false],
    ["commits_state", false],
    ["promotes_perspective", false],
    ["creates_work_item", false],
    ["mutates_runtime", false],
  ]) {
    assert.equal(gateFixture.authority?.[field], expected, `fixture authority ${field} must be ${expected}`);
  }

  assert.ok(Array.isArray(gateFixture.blocked_promotion_samples), "blocked_promotion_samples must be an array");
  assert.ok(Array.isArray(gateFixture.allowed_pointer_samples), "allowed_pointer_samples must be an array");
  assert.ok(Array.isArray(gateFixture.allowed_low_cardinality_samples), "allowed_low_cardinality_samples must be an array");
  assert.ok(Array.isArray(gateFixture.audit_surface_files), "audit_surface_files must be an array");

  for (const filePath of [
    gateDocPath,
    gateFixturePath,
    reviewFixturePath,
    typePath,
    typeSmokePath,
  ]) {
    assert.ok(gateFixture.audit_surface_files.includes(filePath), `audit_surface_files must include ${filePath}`);
  }

  for (const sample of allSamples()) {
    for (const field of ["sample_id", "input_class", "raw_value", "proposed_usage", "disposition", "allowed", "reason", "boundary_notes"]) {
      assert.ok(Object.hasOwn(sample, field), `${sample.sample_id ?? "(missing sample_id)"} must include ${field}`);
    }
  }
}

function assertBlockedSamples() {
  const blockedClasses = new Set(gateFixture.blocked_promotion_samples.map((sample) => sample.input_class));
  for (const inputClass of unstableInputClasses) {
    assert.ok(blockedClasses.has(inputClass), `blocked samples must include ${inputClass}`);
  }

  for (const sample of gateFixture.blocked_promotion_samples) {
    assert.equal(sample.allowed, false, `${sample.sample_id} must be blocked`);
    assert.equal(
      sample.disposition,
      "blocked_canonical_promotion",
      `${sample.sample_id} must use blocked_canonical_promotion`,
    );
    assert.ok(
      blockedPromotionTargets.includes(sample.proposed_usage),
      `${sample.sample_id} proposed_usage must be a blocked promotion target`,
    );
    assert.ok(sample.reason, `${sample.sample_id} must include reason`);
    assert.ok(sample.boundary_notes, `${sample.sample_id} must include boundary_notes`);
  }
}

function assertAllowedPointerSamples() {
  const expectedPairs = [
    ["source_ref_id", "source_pointer"],
    ["candidate_id", "local_candidate_id"],
    ["repo_path", "source_pointer"],
    ["work_id", "source_pointer"],
    ["source_title", "raw_display"],
    ["source_url", "raw_display"],
  ];
  for (const [inputClass, proposedUsage] of expectedPairs) {
    assert.ok(
      gateFixture.allowed_pointer_samples.some(
        (sample) => sample.input_class === inputClass && sample.proposed_usage === proposedUsage,
      ),
      `allowed pointer samples must include ${inputClass} as ${proposedUsage}`,
    );
  }

  for (const sample of gateFixture.allowed_pointer_samples) {
    assert.equal(sample.allowed, true, `${sample.sample_id} must be allowed`);
    assert.ok(
      allowedPointerDispositions.includes(sample.disposition),
      `${sample.sample_id} must use an allowed pointer disposition`,
    );
  }
}

function assertAllowedLowCardinalitySamples() {
  const expectedValues = [
    ["review_status", "candidate_only"],
    ["epistemic_status", "weakly_supported"],
    ["delta_type", "refine"],
    ["promotion_readiness", "not_ready"],
    ["evidence_role", "supports"],
    ["tension_type", "schema_misread_risk"],
  ];

  for (const [label, rawValue] of expectedValues) {
    assert.ok(
      gateFixture.allowed_low_cardinality_samples.some((sample) => sample.raw_value === rawValue),
      `low-cardinality samples must include ${label} ${rawValue}`,
    );
  }

  for (const sample of gateFixture.allowed_low_cardinality_samples) {
    assert.equal(sample.allowed, true, `${sample.sample_id} must be allowed`);
    assert.equal(
      sample.disposition,
      "allowed_low_cardinality_enum",
      `${sample.sample_id} must use allowed_low_cardinality_enum`,
    );
  }
}

function assertTypeContractAlignment() {
  for (const sample of gateFixture.allowed_low_cardinality_samples) {
    assert.match(typeFile, quotedValuePattern(sample.raw_value), `${sample.raw_value} must exist in the type contract`);
  }

  for (const sample of gateFixture.blocked_promotion_samples) {
    assert.doesNotMatch(
      typeFile,
      quotedValuePattern(sample.raw_value),
      `${sample.raw_value} must not appear as a type union literal`,
    );
  }
}

function assertExistingFixtureTargetKeys() {
  const sourceTitles = new Set(gateFixtureSafeArray(reviewFixture.source_reference_previews).map((source) => source.title));
  const sourceIdentifiers = new Set(
    gateFixtureSafeArray(reviewFixture.source_reference_previews).map((source) => source.identifier_or_url),
  );
  const sourceRefIds = new Set(gateFixtureSafeArray(reviewFixture.source_reference_previews).map((source) => source.source_ref_id));

  for (const delta of gateFixtureSafeArray(reviewFixture.perspective_delta_candidates)) {
    const key = delta.target_perspective_key;
    assert.ok(!sourceTitles.has(key), `${delta.perspective_delta_candidate_id} target_perspective_key copied a source title`);
    assert.ok(
      !sourceIdentifiers.has(key),
      `${delta.perspective_delta_candidate_id} target_perspective_key copied a source identifier/url`,
    );
    assert.ok(!sourceRefIds.has(key), `${delta.perspective_delta_candidate_id} target_perspective_key copied a source_ref_id`);
    assert.doesNotMatch(key, /https?:\/\//, `${delta.perspective_delta_candidate_id} target_perspective_key must not contain URL text`);
    assert.doesNotMatch(
      key,
      /provider|run|thread|workspace|session|demo/i,
      `${delta.perspective_delta_candidate_id} target_perspective_key must not contain raw trace/demo patterns`,
    );
    assert.match(
      key,
      /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
      `${delta.perspective_delta_candidate_id} target_perspective_key must be a stable dotted lower-case key`,
    );
  }
}

function assertIndexPointer() {
  const pointerStart = index.indexOf(gateDocPath);
  assert.notEqual(pointerStart, -1, "index must mention the gate doc");
  const pointer = index.slice(pointerStart, pointerStart + 1800);
  assert.match(pointer, new RegExp(escapeRegExp(gateFixturePath)), "index pointer must mention gate fixture");
  assert.match(
    pointer,
    /smoke:research-candidate-canonical-promotion-gates-v0-1/,
    "index pointer must mention gate smoke",
  );
  assert.match(pointer, /static audit only/, "index pointer must state static audit only");
  assert.match(pointer, /non-authoritative/, "index pointer must state non-authoritative");
  assert.match(
    pointer,
    /prevents raw source titles, URLs, provider\s+IDs, raw thread\/run\/session IDs, arbitrary user strings, episode IDs, and\s+demo refs from becoming canonical state labels or operational tags/s,
    "index pointer must describe the raw-string promotion gate",
  );
  assert.match(
    pointer,
    /no runtime\/API\/DB\/provider\/retrieval\/promotion behavior/,
    "index pointer must preserve runtime/API/DB/provider/retrieval/promotion boundary",
  );
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-canonical-promotion-gates-v0-1"],
    "node scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
    "package.json must expose the canonical promotion gate smoke",
  );
}

function assertNoForbiddenImplementationPatterns() {
  const combinedStaticText = [gateDoc, gateFixtureText, index, gateSmoke].join("\n\n");
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
    assert.doesNotMatch(combinedStaticText, regex, `static gate text must not include ${label}`);
  }
}

function allSamples() {
  return [
    ...gateFixture.blocked_promotion_samples,
    ...gateFixture.allowed_pointer_samples,
    ...gateFixture.allowed_low_cardinality_samples,
  ];
}

function gateFixtureSafeArray(value) {
  assert.ok(Array.isArray(value), "expected fixture value to be an array");
  return value;
}

function tickedValuePattern(value) {
  return new RegExp(`- \`${escapeRegExp(value)}\``);
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
