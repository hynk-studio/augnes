#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";

const libPath = "lib/dogfooding/codex-result-report-normalizer.ts";
const docsPath = "docs/CODEX_RESULT_REPORT_INGESTION_V0_1.md";
const fixturePath = "fixtures/codex-result-report-ingestion.sample.v0.1.json";
const smokePath = "scripts/smoke-codex-result-report-ingestion-v0-1.mjs";
const componentPath = "components/codex-result-report-ingestion-panel.tsx";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const authoritySmokePath = "scripts/smoke-authority-boundary-regression-v0-1.mjs";

const fixtureVersion = "codex_result_report_ingestion.sample.v0.1";
const inputVersion = "codex_result_report_input.v0.1";
const recordVersion = "codex_result_report_ingestion_record.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:codex-result-report-ingestion-v0-1";
const packageScriptValue =
  "node scripts/smoke-codex-result-report-ingestion-v0-1.mjs";
const authorityPackageScriptName = "smoke:authority-boundary-regression-v0-1";
const authorityPackageScriptValue =
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs";

const expectedSliceFiles = [
  libPath,
  docsPath,
  fixturePath,
  smokePath,
  componentPath,
  packagePath,
  indexPath,
];

const requiredExports = [
  "normalizeCodexResultReportV01",
  "validateCodexResultReportInputV01",
  "buildCodexResultReportIngestionRecordV01",
  "createCodexResultReportFingerprintV01",
  "createCodexResultReportAuthorityBoundaryV01",
];

const requiredDocsPhrases = [
  "Codex result report is candidate input only.",
  "PR body is not authority.",
  "Changed files are review cues only.",
  "Validation commands are diagnostic only.",
  "CI pass is not truth.",
  "Smoke pass is not truth.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "Codex report is not proof, not evidence, not durable state, and not execution approval.",
  "GitHub branch/commit/PR refs are references only, not authority.",
  "This slice does not execute Codex.",
  "This slice does not call GitHub.",
  "This slice does not create branches, commits, PRs, or merges.",
  "This slice does not run validation commands.",
  "This slice does not read files or write files.",
  "This slice does not query/write DB.",
  "This slice does not add routes.",
  "This slice does not call providers.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not create proof/evidence.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not execute Git Ledger export.",
  "This slice does not product-write or allocate product IDs.",
  "Product-write remains parked by #686.",
  "The roadmap guide is not SSOT.",
  "Smoke/CI pass is not truth.",
  "Authority Boundary Regression CI",
  "Privacy Redaction Runtime Guard",
  "Local Data Export/Import Policy",
];

const authorityAllowedTrueFields = [
  "codex_result_report_ingestion_now",
  "caller_provided_input_only",
  "candidate_only",
  "deterministic_normalization_now",
];

const authorityFalseFields = [
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
  "report_is_truth",
  "report_is_proof",
  "report_is_accepted_evidence",
  "report_is_durable_state",
  "pr_body_is_authority",
  "ci_pass_is_truth",
  "smoke_pass_is_truth",
  "validation_pass_is_approval",
  "validation_failure_is_rejection",
  "github_ref_is_authority",
  "product_write_authority",
];

const allowedSafeMarkers = [
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_TERMINAL_LOG",
  "SAFE_MARKER_RAW_GITHUB_PAYLOAD",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
];

const forbiddenSourcePatterns = [
  /from\s+["']node:fs["']/,
  /from\s+["']fs["']/,
  /from\s+["']next\/server["']/,
  /from\s+["']openai["']/i,
  /from\s+["']node:child_process["']/,
  /from\s+["']child_process["']/,
  /\bfetch\s*\(/,
  /NextResponse/,
  /Database\s*\(/,
  /PrismaClient/,
  /\bexec(?:File|Sync)?\s*\(/,
  /\bspawn(?:Sync)?\s*\(/,
  /\bgh\s+pr\b/i,
  /\bgit\s+(?:push|commit|merge|tag)\b/i,
  /product-write-adapter-runtime/i,
];

const forbiddenComponentPatterns = [
  /\bfetch\s*\(/,
  /<button\b/i,
  /<form\b/i,
  /\bonClick=/,
  /\bonSubmit=/,
  /useEffect/,
  /router\./,
  /github api/i,
  /execute codex/i,
  /create pr/i,
  /run validation/i,
  /product-write\s+(?:enabled|available|allowed)/i,
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

for (const requiredPath of expectedSliceFiles.concat([roadmapPath, authoritySmokePath])) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const libSource = read(libPath);
const docs = read(docsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const smokeSource = read(smokePath);
const componentSource = read(componentPath);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.scope, scope);
assert.ok(
  roadmap.includes("codex_result_report_ingestion_v0_1"),
  "roadmap must contain codex_result_report_ingestion_v0_1",
);
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the Codex result report ingestion smoke",
);
assert.equal(
  packageJson.scripts?.[authorityPackageScriptName],
  authorityPackageScriptValue,
  "authority boundary regression smoke package script must remain present",
);

for (const pointer of [libPath, docsPath, fixturePath, smokePath, componentPath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}
assert.ok(
  index.includes("Product-write remains parked by #686."),
  "latest index must preserve product-write parked wording",
);

for (const phrase of requiredDocsPhrases) {
  assert.ok(
    includesNormalized(docs, phrase),
    `docs must include required phrase: ${phrase}`,
  );
}

for (const exportedName of requiredExports) {
  assert.ok(
    libSource.includes(`export function ${exportedName}`),
    `library must export ${exportedName}`,
  );
}

for (const pattern of forbiddenSourcePatterns) {
  assert.ok(!pattern.test(libSource), `library must not include runtime IO pattern ${pattern}`);
}

assertSafeMarkerPlacement();
assertNoLiveLookingPrivateExamples();
assertAuthorityBoundaryClosed(fixture.authority_boundary_sample, "fixture.authority_boundary_sample");
assertAuthorityBoundaryClosed(
  fixture.safe_input_example.authority_boundary,
  "fixture.safe_input_example.authority_boundary",
);

const helper = await importNormalizer();
assert.equal(typeof helper.normalizeCodexResultReportV01, "function");
assert.equal(typeof helper.validateCodexResultReportInputV01, "function");
assert.equal(typeof helper.buildCodexResultReportIngestionRecordV01, "function");
assert.equal(typeof helper.createCodexResultReportFingerprintV01, "function");
assert.equal(typeof helper.createCodexResultReportAuthorityBoundaryV01, "function");

const boundary = helper.createCodexResultReportAuthorityBoundaryV01();
assertAuthorityBoundaryClosed(boundary, "generated authority boundary");

const firstSafeRecord = helper.normalizeCodexResultReportV01(fixture.safe_input_example);
const secondSafeRecord = helper.normalizeCodexResultReportV01(fixture.safe_input_example);
assert.equal(firstSafeRecord.record_version, recordVersion);
assert.equal(firstSafeRecord.scope, scope);
assert.equal(firstSafeRecord.status, fixture.normalized_record_example.status);
assert.equal(firstSafeRecord.report_id, fixture.normalized_record_example.report_id);
assert.equal(firstSafeRecord.report_fingerprint, secondSafeRecord.report_fingerprint);
assert.equal(
  firstSafeRecord.report_fingerprint,
  fixture.normalized_record_example.report_fingerprint,
  "fixture normalized record fingerprint must match deterministic helper output",
);
assert.equal(
  firstSafeRecord.report_fingerprint,
  helper.createCodexResultReportFingerprintV01(firstSafeRecord),
  "same normalized record must produce the same fingerprint",
);
assert.deepEqual(
  firstSafeRecord.review_cues.map((cue) => cue.cue_kind),
  fixture.normalized_record_example.review_cue_kinds,
  "safe normalized record must expose expected review cues",
);
assertAuthorityBoundaryClosed(firstSafeRecord.authority_boundary, "safe record authority boundary");
assertNoUnsafeEcho(firstSafeRecord);

const safeValidation = helper.validateCodexResultReportInputV01(fixture.safe_input_example);
assert.equal(safeValidation.passed, true, "safe input must validate without blockers");
const explicitUnknownKindValidation = helper.validateCodexResultReportInputV01({
  ...fixture.safe_input_example,
  report_id: "codex-result-report:explicit-unknown-kind",
  report_kind: "unknown",
});
assert.equal(
  explicitUnknownKindValidation.passed,
  true,
  "explicit unknown report_kind must validate as an allowed explicit kind",
);

assert.ok(
  Array.isArray(fixture.malformed_public_safe_examples),
  "fixture must include malformed public-safe validation examples",
);
assert.equal(
  fixture.malformed_public_safe_examples.length,
  4,
  "fixture must cover the required malformed public-safe input cases",
);
for (const malformedExample of fixture.malformed_public_safe_examples) {
  const validation = helper.validateCodexResultReportInputV01(malformedExample.input);
  const record = helper.buildCodexResultReportIngestionRecordV01(malformedExample.input);
  assert.equal(
    validation.passed,
    false,
    `malformed public-safe input must fail validation: ${malformedExample.example_id}`,
  );
  assert.equal(
    validation.status,
    malformedExample.expected_status,
    `validation must reject malformed public-safe input: ${malformedExample.example_id}`,
  );
  assert.equal(
    record.status,
    malformedExample.expected_status,
    `builder must reject malformed public-safe input: ${malformedExample.example_id}`,
  );
  assert.equal(
    validation.status,
    record.status,
    `validation and builder status must agree: ${malformedExample.example_id}`,
  );
  for (const expectedPath of malformedExample.expected_blocked_paths) {
    assert.ok(
      validation.blocked_paths.includes(expectedPath),
      `validation blocked_paths must include ${expectedPath} for ${malformedExample.example_id}`,
    );
  }
  assertAuthorityBoundaryClosed(
    record.authority_boundary,
    `malformed public-safe record authority boundary: ${malformedExample.example_id}`,
  );
  assertNoUnsafeEcho(record);
}

const blockedPrivateRecord = helper.buildCodexResultReportIngestionRecordV01(
  fixture.blocked_private_or_raw_payload_example.input,
);
assert.equal(
  blockedPrivateRecord.status,
  fixture.blocked_private_or_raw_payload_example.expected_status,
);
assert.ok(
  blockedPrivateRecord.privacy_report.blocked_paths.length > 0,
  "blocked private/raw example must produce blocked paths",
);
assertNoUnsafeEcho(blockedPrivateRecord);

const blockedAuthorityRecord = helper.buildCodexResultReportIngestionRecordV01(
  fixture.blocked_forbidden_authority_example.input,
);
assert.equal(
  blockedAuthorityRecord.status,
  fixture.blocked_forbidden_authority_example.expected_status,
);
assert.ok(
  blockedAuthorityRecord.privacy_report.blocked_paths.some((entry) =>
    entry.includes("authority_boundary"),
  ),
  "blocked forbidden authority example must block authority boundary paths",
);
assertAuthorityBoundaryClosed(
  blockedAuthorityRecord.authority_boundary,
  "blocked authority generated boundary",
);
assertNoUnsafeEcho(blockedAuthorityRecord);

assertReadOnlyComponentBoundary();
assertNarrowSliceFileScope();

console.log("codex_result_report_ingestion_v0_1 smoke passed");

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

async function importNormalizer() {
  const stripped = stripTypeScriptTypes(libSource, { mode: "strip" });
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
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

function assertSafeMarkerPlacement() {
  const markerPaths = [];
  collectStringPaths(fixture, "fixture", (value, valuePath) => {
    for (const marker of allowedSafeMarkers) {
      if (value.includes(marker)) {
        markerPaths.push(valuePath);
      }
    }
    const safeMarkerMatch = value.match(/SAFE_MARKER_[A-Z0-9_]+/g);
    if (safeMarkerMatch) {
      for (const marker of safeMarkerMatch) {
        assert.ok(
          allowedSafeMarkers.includes(marker),
          `fixture must not include unexpected safe marker ${marker}`,
        );
      }
    }
  });
  assert.ok(markerPaths.length >= allowedSafeMarkers.length, "fixture must include blocked markers");
  for (const markerPath of markerPaths) {
    assert.ok(
      markerPath.startsWith(
        "fixture.blocked_private_or_raw_payload_example.input.blocked_fixture_markers",
      ),
      `safe marker must appear only in blocked private/raw fixture marker list: ${markerPath}`,
    );
  }
}

function assertNoLiveLookingPrivateExamples() {
  const sources = [
    [libPath, libSource],
    [docsPath, docs],
    [fixturePath, fixtureText],
    [smokePath, smokeSource],
    [componentPath, componentSource],
  ];
  for (const [filePath, source] of sources) {
    for (const pattern of liveLookingPrivatePatterns) {
      assert.ok(
        !pattern.test(source),
        `${filePath} must not include live-looking secret/private/provider examples: ${pattern}`,
      );
    }
  }
}

function assertNoUnsafeEcho(record) {
  const serialized = JSON.stringify(record);
  for (const marker of allowedSafeMarkers) {
    assert.ok(!serialized.includes(marker), `record must not echo unsafe marker ${marker}`);
  }
  assert.ok(
    !/"enabled"/.test(serialized),
    "record must not echo forbidden authority string values",
  );
}

function assertReadOnlyComponentBoundary() {
  assert.ok(
    componentSource.includes("Product-write remains parked by #686."),
    "component must include product-write parked wording",
  );
  assert.ok(
    componentSource.includes("review cues only"),
    "component must state report material is review-only cue material",
  );
  for (const pattern of forbiddenComponentPatterns) {
    assert.ok(!pattern.test(componentSource), `component must remain read-only: ${pattern}`);
  }
}

function assertNarrowSliceFileScope() {
  for (const expectedPath of expectedSliceFiles) {
    assert.ok(existsSync(expectedPath), `expected slice file must exist: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (
      /codex[-_]result[-_]report[-_]ingestion/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "Codex result report ingestion slice files must stay in expected file set",
  );
  for (const routeRoot of ["app/api", "pages/api"]) {
    if (!existsSync(routeRoot)) {
      continue;
    }
    const matchingRoutes = walk(routeRoot).filter((filePath) =>
      /codex[-_]result[-_]report[-_]ingestion/i.test(filePath),
    );
    assert.deepEqual(matchingRoutes, [], "slice must not add API routes");
  }
}

function collectStringPaths(value, pathLabel, visitor) {
  if (typeof value === "string") {
    visitor(value, pathLabel);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStringPaths(item, `${pathLabel}[${index}]`, visitor));
    return;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value).sort()) {
      collectStringPaths(value[key], `${pathLabel}.${key}`, visitor);
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
