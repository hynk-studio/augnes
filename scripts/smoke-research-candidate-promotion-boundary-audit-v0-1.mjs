import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-promotion-boundary-audit.ts";
const readinessHelperPath =
  "lib/research-candidate-review/manual-note-preview-draft-promotion-readiness.ts";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-promotion-boundary-audit.sample.v0.1.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-promotion-boundary-audit-v0-1.mjs";

const expectedGateIds = [
  "lifecycle_gate",
  "storage_boundary_gate",
  "authority_boundary_gate",
  "parser_warning_gate",
  "source_reference_gate",
  "claim_candidate_gate",
  "evidence_candidate_gate",
  "tension_gap_gate",
  "follow_up_work_gate",
  "label_metadata_gate",
  "activity_metadata_gate",
  "canonical_link_guard_gate",
];

const authorityFlags = {
  readiness_is_not_promotion_authority: true,
  ready_for_promotion_discussion_is_not_write_authority: true,
  actual_promotion_allowed: false,
  dry_run_promotion_allowed_by_this_audit: false,
  proof_or_evidence_writes_allowed: false,
  perspective_or_canonical_writes_allowed: false,
  work_item_creation_allowed: false,
  provider_or_retrieval_allowed: false,
  source_fetching_allowed: false,
  external_handoff_allowed: false,
};

for (const filePath of [
  helperPath,
  readinessHelperPath,
  fixturePath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const readinessHelper = readFileSync(readinessHelperPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertFixtureContract();
assertDocsAndPackagePointers();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-promotion-boundary-audit-v0-1",
      helper_exists: true,
      fixture_exists_and_parses: true,
      gate_coverage_checked: expectedGateIds.length,
      authority_statement_checked: true,
      future_boundaries_checked: true,
      static_no_write_patterns_checked: true,
      no_route_or_ui_action_wiring_checked: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_VERSION",
    'MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_VERSION = "v0.1"',
    "MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_KIND",
    'manual_note_promotion_boundary_audit',
    "MANUAL_NOTE_PROMOTION_BOUNDARY_AUDIT_GATE_IDS",
    "buildManualNotePromotionBoundaryAudit",
    "assertManualNotePromotionBoundaryAuditGateCoverage",
    "manual_note_preview_draft_promotion_readiness_preflight",
    "blocked",
    "needs_operator_review",
    "ready_for_promotion_discussion",
    "future_dry_run_minimum_boundary",
    "future_actual_write_minimum_boundary",
    "required_separate_lanes",
    "prohibited_in_this_lane",
    'next_recommended_slice: "selected_preview_draft_dry_run_promotion_plan"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }

  for (const gateId of expectedGateIds) {
    assert.ok(helper.includes(`"${gateId}"`), `helper must include ${gateId}`);
    assert.ok(
      readinessHelper.includes(`gateId: "${gateId}"`) ||
        readinessHelper.includes(`case "${gateId}"`) ||
        readinessHelper.includes(`"${gateId}"`),
      `current readiness helper must still include ${gateId}`,
    );
  }

  for (const [flag, expectedValue] of Object.entries(authorityFlags)) {
    assert.ok(
      helper.includes(`${flag}: ${expectedValue}`),
      `helper authority statement must include ${flag}: ${expectedValue}`,
    );
  }
}

function assertFixtureContract() {
  assert.equal(fixture.audit_kind, "manual_note_promotion_boundary_audit");
  assert.equal(fixture.audit_version, "v0.1");
  assert.equal(
    fixture.source_lane,
    "manual_note_preview_draft_promotion_readiness_preflight",
  );
  assert.deepEqual(fixture.source_preflight_statuses, [
    "blocked",
    "needs_operator_review",
    "ready_for_promotion_discussion",
  ]);
  assert.deepEqual(fixture.source_gate_ids, expectedGateIds);
  assert.equal(
    fixture.next_recommended_slice,
    "selected_preview_draft_dry_run_promotion_plan",
  );

  for (const [flag, expectedValue] of Object.entries(authorityFlags)) {
    assert.equal(
      fixture.authority_statement?.[flag],
      expectedValue,
      `fixture authority statement must include ${flag}: ${expectedValue}`,
    );
  }

  assert.ok(
    Array.isArray(fixture.future_dry_run_minimum_boundary) &&
      fixture.future_dry_run_minimum_boundary.length > 0,
    "fixture must include future_dry_run_minimum_boundary",
  );
  assert.ok(
    Array.isArray(fixture.future_actual_write_minimum_boundary) &&
      fixture.future_actual_write_minimum_boundary.length > 0,
    "fixture must include future_actual_write_minimum_boundary",
  );
  assert.ok(
    Array.isArray(fixture.required_separate_lanes) &&
      fixture.required_separate_lanes.length > 0,
    "fixture must include required_separate_lanes",
  );
  assert.ok(
    Array.isArray(fixture.prohibited_in_this_lane) &&
      fixture.prohibited_in_this_lane.length > 0,
    "fixture must include prohibited_in_this_lane",
  );

  const rowGateIds = fixture.gate_audit_rows.map((row) => row.gate_id);
  assert.deepEqual(rowGateIds, expectedGateIds);
  assert.deepEqual(unique(rowGateIds), expectedGateIds);

  for (const row of fixture.gate_audit_rows) {
    for (const requiredField of [
      "current_gate_purpose",
      "currently_proves",
      "explicitly_does_not_prove",
      "future_dry_run_requirement",
      "future_actual_write_requirement",
      "must_remain_preview_only",
      "forbidden_shortcuts",
    ]) {
      assert.ok(
        Object.hasOwn(row, requiredField),
        `gate row ${row.gate_id} must include ${requiredField}`,
      );
    }
    assert.equal(row.must_remain_preview_only, true);
    assert.ok(row.currently_proves.length > 0);
    assert.ok(row.explicitly_does_not_prove.length > 0);
    assert.ok(row.future_dry_run_requirement.length > 0);
    assert.ok(row.future_actual_write_requirement.length > 0);
    assert.ok(row.forbidden_shortcuts.length > 0);
  }

  for (const forbiddenText of [
    "manual_note_text",
    "raw_manual_note_text",
    "Research Question:",
    "Operator Intent:",
    "Source Title:",
    "AUGNES_DB_PATH",
    "http://",
    "https://",
  ]) {
    assert.ok(
      !fixtureText.includes(forbiddenText),
      `fixture must not include ${forbiddenText}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-promotion-boundary-audit-v0-1"],
    "node scripts/smoke-research-candidate-promotion-boundary-audit-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note promotion boundary audit artifact",
    helperPath,
    fixturePath,
    "npm run smoke:research-candidate-promotion-boundary-audit-v0-1",
    "maps current readiness gates to future dry-run/write authority boundaries",
    "no route",
    "no UI",
    "no write authority",
    "no proof/evidence",
    "no Perspective/canonical graph write",
    "no provider/retrieval/source fetch",
    "no work item",
    "no schema/migration code",
    "no dependency",
    "no CI authority",
    "no product approval authority",
    "no promotion authority",
  ]) {
    assert.ok(
      normalizedIncludes(index, requiredText),
      `index pointer must include ${requiredText}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  const helperImportLines = helper.match(/^import .*$/gm) ?? [];
  assert.equal(helperImportLines.length, 0, "helper must not import runtime/write modules");

  for (const [label, pattern] of [
    ["fetch call", /\bfetch\s*\(/],
    ["openDatabase call", /\bopenDatabase\s*\(/],
    ["INSERT statement", /\bINSERT\b/i],
    ["UPDATE statement", /\bUPDATE\b/i],
    ["DELETE statement", /\bDELETE\b/i],
    ["CREATE TABLE statement", /\bCREATE\s+TABLE\b/i],
    ["ALTER TABLE statement", /\bALTER\s+TABLE\b/i],
    ["DROP TABLE statement", /\bDROP\s+TABLE\b/i],
    ["localStorage", /\blocalStorage\b/],
    ["sessionStorage", /\bsessionStorage\b/],
    ["indexedDB", /\bindexedDB\b/],
    ["document.cookie", /\bdocument\.cookie\b/],
  ]) {
    assert.ok(!pattern.test(helper), `helper must not include ${label}`);
  }

  for (const filePath of listFiles("app/api")) {
    assert.ok(
      !/promotion-boundary-audit|promotion-dry-run|dry-run-promotion/i.test(
        filePath,
      ),
      `no promotion boundary or dry-run route file expected: ${filePath}`,
    );
  }

  for (const filePath of listFiles("components")) {
    if (!/\.(tsx|ts)$/.test(filePath)) continue;
    const componentText = readFileSync(filePath, "utf8");
    assert.ok(
      !componentText.includes("manual_note_promotion_boundary_audit") &&
        !componentText.includes("selected_preview_draft_dry_run_promotion_plan"),
      `no UI wiring for boundary audit expected in ${filePath}`,
    );
  }

  for (const filePath of listFiles(".")) {
    if (!/(migration|migrations|schema)/i.test(filePath)) continue;
    assert.ok(
      !/manual-note-promotion-boundary-audit|promotion-boundary-audit/i.test(
        filePath,
      ),
      `no schema/migration artifact expected for boundary audit: ${filePath}`,
    );
  }
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root)) {
    if (entry === ".git" || entry === "node_modules" || entry === ".next") {
      continue;
    }
    const filePath = path.join(root, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      results.push(...listFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

function unique(values) {
  return [...new Set(values)];
}

function normalizedIncludes(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}
