#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const fixturePath =
  "fixtures/temporal-handoff-usefulness-scenario.sample.v0.1.json";
const smokePath =
  "scripts/smoke-temporal-handoff-usefulness-experiment-plan-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const fixtureVersion = "temporal_handoff_usefulness_scenario.sample.v0.1";
const experimentVersion = "temporal_handoff_usefulness_experiment.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:temporal-handoff-usefulness-experiment-plan-v0-1";
const packageScriptValue =
  "node scripts/smoke-temporal-handoff-usefulness-experiment-plan-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const experimentGroups = [
  "ordinary_codex_prompt",
  "existing_perspective_handoff_capsule",
  "temporal_perspective_enhanced_handoff",
];

const evaluationDimensions = [
  "expected_files_missing_detection",
  "expected_checks_missing_detection",
  "unresolved_tension_preservation",
  "authority_boundary_clarity",
  "source_refs_coverage",
  "not_done_classification_quality",
  "overconfident_narrative_warning_quality",
  "expected_observed_delta_clarity",
  "decision_hold_classification_quality",
  "single_event_baseline_rewrite_prevention",
  "privacy_boundary_preservation",
  "product_write_stopline_clarity",
];

const reasonCodes = [
  "temporal_handoff_experiment_plan_only",
  "comparison_groups_defined",
  "evaluation_dimensions_defined",
  "scoring_rubric_defined",
  "operator_review_required",
  "expected_observed_delta_preserved",
  "not_done_classification_required",
  "decision_hold_classification_required",
  "unresolved_tension_preserved",
  "overconfident_narrative_guard_required",
  "privacy_guard_required",
  "codex_result_report_candidate_only",
  "authority_boundary_regression_compatible",
  "experiment_result_not_truth",
  "handoff_score_not_proof",
  "better_score_not_approval",
  "worse_score_not_rejection",
  "ci_pass_not_truth",
  "smoke_pass_not_truth",
  "pr_body_not_authority",
  "github_ref_not_authority",
  "provider_call_not_executed",
  "codex_not_executed",
  "git_github_not_executed",
  "db_write_not_executed",
  "telemetry_not_ingested",
  "retrieval_not_executed",
  "product_write_denied",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Temporal Handoff Diagnostic Sections",
  "## Relationship to Codex Result Report Ingestion",
  "## Relationship to Authority Boundary Regression CI",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Local Data Export/Import Policy",
  "## Experiment Groups",
  "## Scenario Design",
  "## Evaluation Dimensions",
  "## Scoring Rubric",
  "## Operator Review Protocol",
  "## Expected/Observed Delta Capture Policy",
  "## Not-Done Classification Policy",
  "## Decision Hold Classification Policy",
  "## Privacy/Redaction Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const requiredDocsPhrases = [
  "This slice is experiment-plan-only and fixture-only.",
  "This slice does not execute experiments.",
  "This slice does not call providers.",
  "This slice does not call Codex.",
  "This slice does not call GitHub.",
  "This slice does not create branches, commits, PRs, or merges.",
  "This slice does not run validation commands.",
  "This slice does not read or write files as runtime behavior.",
  "This slice does not query/write DB.",
  "This slice does not add routes or UI.",
  "This slice does not ingest telemetry.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not create proof/evidence.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not execute Git Ledger export.",
  "This slice does not product-write or allocate product IDs.",
  "Experiment result is not truth.",
  "Handoff score is not proof.",
  "Better score is not approval.",
  "Worse score is not rejection.",
  "Codex result report is candidate input only.",
  "PR body is not authority.",
  "CI pass is not truth.",
  "Smoke pass is not truth.",
  "GitHub refs are references only, not authority.",
  "Product-write remains parked by #686.",
  "The roadmap guide is not SSOT.",
  "Codex Result Report Ingestion",
  "Authority Boundary Regression CI",
  "Privacy Redaction Runtime Guard",
  "Local Data Export/Import Policy",
];

const authorityAllowedTrueFields = [
  "temporal_handoff_usefulness_experiment_plan_now",
  "fixture_only",
  "diagnostic_only",
  "future_operator_experiment_only",
  "caller_provided_scenario_only",
];

const authorityFalseFields = [
  "experiment_runtime_execution_now",
  "telemetry_ingestion_now",
  "analytics_db_write_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_api_call_now",
  "github_branch_create_now",
  "github_commit_create_now",
  "github_pr_create_now",
  "github_merge_now",
  "git_write_now",
  "repository_file_write_now",
  "runtime_state_mutation_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "export_import_runtime_now",
  "product_write_now",
  "product_id_allocation_now",
  "experiment_result_is_truth",
  "handoff_score_is_proof",
  "better_score_is_approval",
  "worse_score_is_rejection",
  "pr_body_is_authority",
  "ci_pass_is_truth",
  "smoke_pass_is_truth",
  "github_ref_is_authority",
  "product_write_authority",
];

const liveLookingPrivatePatterns = [
  /\bhttps?:\/\//,
  /\bfile:\/\//,
  /\/Users\//,
  /\/home\//,
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(thread|run|session|resp|file)_[A-Za-z0-9]{16,}\b/,
];

const runtimeFilePatterns = [
  /(^|\/)app\/api\/.*temporal[-_]handoff[-_]usefulness/i,
  /(^|\/)components\/.*temporal[-_]handoff[-_]usefulness/i,
  /(^|\/)(?:db|migrations)\/.*temporal[-_]handoff[-_]usefulness/i,
  /(?:provider|retrieval|git-ledger|codex-execution|product-write|product-id).*temporal[-_]handoff[-_]usefulness/i,
];

for (const requiredPath of [...expectedSliceFiles, roadmapPath]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docs = read(docsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const smokeSource = read(smokePath);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.experiment_version, experimentVersion);
assert.equal(fixture.scope, scope);
assert.ok(
  roadmap.includes("temporal_handoff_usefulness_experiment_v0_1"),
  "roadmap must contain temporal_handoff_usefulness_experiment_v0_1",
);
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the temporal handoff usefulness smoke",
);

for (const pointer of [docsPath, fixturePath, smokePath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}
assert.ok(
  index.includes("Product-write remains parked by #686."),
  "latest index must preserve product-write parked wording",
);

for (const section of requiredDocsSections) {
  assert.ok(docs.includes(section), `docs must include section ${section}`);
}
for (const phrase of requiredDocsPhrases) {
  assert.ok(
    includesNormalized(docs, phrase),
    `docs must include required phrase: ${phrase}`,
  );
}

assert.deepEqual(
  fixture.experiment_groups.map((group) => group.group_id).sort(),
  [...experimentGroups].sort(),
  "fixture must contain all experiment groups",
);
assert.deepEqual(
  [...fixture.evaluation_dimensions].sort(),
  [...evaluationDimensions].sort(),
  "fixture must contain all required evaluation dimensions",
);
assertFixtureCollections();
assertAuthorityBoundaryClosed(fixture.authority_boundary, "fixture.authority_boundary");
for (const reasonCode of reasonCodes) {
  assert.ok(
    fixture.reason_codes.includes(reasonCode),
    `fixture must include reason code ${reasonCode}`,
  );
}
assertPublicSafeFixture();
assertNoLiveLookingPrivateExamples();
assertNoRuntimeFiles();

console.log("temporal_handoff_usefulness_experiment_v0_1 smoke passed");

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function assertFixtureCollections() {
  assert.ok(
    Array.isArray(fixture.expected_observed_delta_examples) &&
      fixture.expected_observed_delta_examples.length >= 2,
    "fixture must contain expected/observed delta examples",
  );
  assert.ok(
    Array.isArray(fixture.not_done_classification_examples) &&
      fixture.not_done_classification_examples.length >= 2,
    "fixture must contain not-done classification examples",
  );
  assert.ok(
    Array.isArray(fixture.decision_hold_classification_examples) &&
      fixture.decision_hold_classification_examples.length >= 2,
    "fixture must contain decision-hold classification examples",
  );
  assert.ok(
    Array.isArray(fixture.unresolved_tension_examples) &&
      fixture.unresolved_tension_examples.length >= 2,
    "fixture must contain unresolved tension examples",
  );
  assert.ok(
    Array.isArray(fixture.overconfident_narrative_warning_examples) &&
      fixture.overconfident_narrative_warning_examples.length >= 2,
    "fixture must contain overconfident narrative warning examples",
  );
  assert.ok(
    Array.isArray(fixture.scoring_rubric) &&
      fixture.scoring_rubric.length >= 5,
    "fixture must contain scoring rubric",
  );
  assert.ok(
    fixture.operator_review_packet &&
      Array.isArray(fixture.operator_review_packet.review_questions),
    "fixture must contain operator review packet",
  );
  for (const group of experimentGroups) {
    assert.ok(
      fixture.expected_outputs_by_group.some((entry) => entry.group_id === group),
      `fixture must include expected output entry for ${group}`,
    );
  }
}

function assertAuthorityBoundaryClosed(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must exist`);
  for (const allowedField of authorityAllowedTrueFields) {
    assert.equal(
      boundary[allowedField],
      true,
      `${label} allowed field must be true: ${allowedField}`,
    );
  }
  for (const falseField of authorityFalseFields) {
    assert.equal(
      boundary[falseField],
      false,
      `${label} forbidden field must be false: ${falseField}`,
    );
  }
}

function assertPublicSafeFixture() {
  const strings = [];
  collectStrings(fixture, "fixture", strings);
  for (const { value, pathLabel } of strings) {
    assert.ok(
      !/\bSAFE_MARKER_[A-Z0-9_]+\b/.test(value),
      `fixture must not include safe marker placeholders in this plan-only sample at ${pathLabel}`,
    );
    assert.ok(
      !value.startsWith("/"),
      `fixture string must not be an absolute local path at ${pathLabel}`,
    );
    if (/_ref$|_refs$|refs\[|ref:|source-ref:|pr-ref:/.test(pathLabel + value)) {
      assert.ok(
        !/\s{2,}/.test(value),
        `fixture symbolic refs should stay compact at ${pathLabel}`,
      );
    }
  }
}

function assertNoLiveLookingPrivateExamples() {
  const sources = [
    [docsPath, docs],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
  ];
  for (const [filePath, source] of sources) {
    for (const pattern of liveLookingPrivatePatterns) {
      assert.ok(
        !pattern.test(source),
        `${filePath} must not include live-looking private/provider/secret examples: ${pattern}`,
      );
    }
  }
}

function assertNoRuntimeFiles() {
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (
      /temporal[-_]handoff[-_]usefulness/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
    for (const pattern of runtimeFilePatterns) {
      assert.ok(
        !pattern.test(normalized),
        `slice must not add route/UI/runtime file ${normalized}`,
      );
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "temporal handoff usefulness files must stay in expected file set",
  );
}

function collectStrings(value, pathLabel, output) {
  if (typeof value === "string") {
    output.push({ value, pathLabel });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${pathLabel}[${index}]`, output));
    return;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value).sort()) {
      collectStrings(value[key], `${pathLabel}.${key}`, output);
    }
  }
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const normalized = fullPath.replaceAll(path.sep, "/");
    if (
      /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo)$/.test(
        normalized,
      )
    ) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
      continue;
    }
    paths.push(normalized);
  }
  return paths;
}
