#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";

const helperPath = "lib/privacy/redaction-guard.ts";
const docsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const fixturePath = "fixtures/privacy-redaction-guard.sample.v0.1.json";
const smokePath = "scripts/smoke-privacy-redaction-guard-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const guardVersion = "privacy_redaction_runtime_guard.v0.1";
const fixtureVersion = "privacy_redaction_runtime_guard.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:privacy-redaction-guard-v0-1";
const packageScriptValue = "node scripts/smoke-privacy-redaction-guard-v0-1.mjs";

const requiredReasonCodes = [
  "provider_internal_id_blocked",
  "provider_thread_id_blocked",
  "provider_run_id_blocked",
  "provider_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "credential_marker_blocked",
  "token_marker_blocked",
  "secret_marker_blocked",
  "cookie_marker_blocked",
  "private_key_marker_blocked",
  "raw_source_body_blocked",
  "raw_note_text_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "raw_db_row_blocked",
  "browser_dump_blocked",
  "hidden_reasoning_blocked",
  "raw_conversation_blocked",
  "opaque_connector_id_reference_only",
  "uploaded_file_opaque_id_reference_only",
  "canonical_label_from_private_identifier_blocked",
  "authority_escalation_blocked",
  "public_safe_summary_only",
  "product_write_denied",
];

const authorityAllowedTrueFields = [
  "privacy_redaction_guard_now",
  "caller_provided_input_only",
  "deterministic_public_safe_report_now",
];

const authorityFalseFields = [
  "canonical_label_created_from_private_identifier_now",
  "raw_private_payload_persisted_now",
  "raw_source_body_storage_now",
  "provider_output_stored_now",
  "provider_thread_run_session_id_canonicalized_now",
  "private_url_canonicalized_now",
  "local_private_path_canonicalized_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "product_id_allocation_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const docsPhrases = [
  "The guard is not an export/import implementation.",
  "The guard is not Git Ledger export runtime.",
  "The guard does not create canonical labels.",
  "The guard does not persist raw/private payloads.",
  "The guard does not read files, fetch sources, call providers, execute retrieval/RAG, write DB, write proof/evidence, promote Perspective, write product records, call GitHub, or execute Git.",
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "roadmap guide is not SSOT",
];

const forbiddenHelperPatterns = [
  /from\s+["']node:fs["']/,
  /from\s+["']fs["']/,
  /from\s+["']next\/server["']/,
  /from\s+["']openai["']/i,
  /from\s+["']node:child_process["']/,
  /from\s+["']child_process["']/,
  /\bfetch\s*\(/,
  /NextResponse/,
  /Database\s*\(/,
  /createRouteHandler/i,
  /product-write-adapter-runtime/i,
];

const realLookingSecretPatterns = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bOPENAI_API_KEY\s*=\s*[^\s]+/,
  /\bGITHUB_TOKEN\s*=\s*[^\s]+/,
];

for (const requiredPath of [
  helperPath,
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  roadmapPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const helperSource = read(helperPath);
const docs = read(docsPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.ok(
  roadmap.includes("privacy_redaction_runtime_guard_v0_1"),
  "roadmap must contain privacy_redaction_runtime_guard_v0_1",
);
assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.guard_version, guardVersion);
assert.equal(fixture.scope, scope);
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the privacy redaction guard smoke",
);

for (const pointer of [helperPath, docsPath, fixturePath, smokePath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}

for (const phrase of docsPhrases) {
  assert.ok(docs.includes(phrase), `docs must include required boundary phrase`);
}

for (const exportedName of [
  "detectPrivacyRedactionRuntimeGuardFindingsV01",
  "redactPrivacyRedactionRuntimeGuardValueV01",
  "validatePrivacyRedactionRuntimeGuardInputV01",
  "buildPrivacyRedactionRuntimeGuardReportV01",
  "createPrivacyRedactionRuntimeGuardFingerprintV01",
]) {
  assert.ok(
    helperSource.includes(`export function ${exportedName}`),
    `helper must export ${exportedName}`,
  );
}

for (const reasonCode of requiredReasonCodes) {
  assert.ok(
    helperSource.includes(`"${reasonCode}"`),
    `helper must include required reason code ${reasonCode}`,
  );
}
assert.ok(
  helperSource.includes("runtimeIdentifierPatternCategories"),
  "helper must include synthetic runtime identifier pattern detection",
);
assert.ok(
  helperSource.includes("isExplicitlyFalseOrUnset"),
  "helper must fail closed on non-false forbidden authority values",
);

assertNoForbiddenHelperImports();
assertNoRealLookingSecrets();
assertSliceFileScope();

const helper = await importPrivacyRedactionGuardHelper();
const markerValues = collectSafeMarkers(fixture);
const unsafeEchoValues = collectUnsafeEchoValues(fixture);
assert.ok(markerValues.length >= 20, "fixture must exercise safe placeholder markers");
assert.ok(
  unsafeEchoValues.length >= markerValues.length + 7,
  "fixture must exercise safe markers and synthetic identifier patterns",
);

const safeExample = fixture.examples.safe_passed;
const safeReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(safeExample.input);
assert.equal(safeReport.status, safeExample.expected_status);
assert.equal(
  helper.validatePrivacyRedactionRuntimeGuardInputV01(safeExample.input).passed,
  true,
  "safe fixture must validate cleanly",
);
assert.equal(safeReport.findings.length, 0, "safe fixture must have no findings");
assertReportPublicSafe(safeReport);
assertReportAuthorityClosed(safeReport);

const redactedExample = fixture.examples.redacted_with_warnings;
const redactedReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  redactedExample.input,
);
assert.equal(redactedReport.status, redactedExample.expected_status);
assert.equal(
  helper.validatePrivacyRedactionRuntimeGuardInputV01(redactedExample.input).passed,
  false,
  "redacted fixture must produce validation findings",
);
assert.ok(redactedReport.redacted_paths.length > 0, "redacted fixture must redact paths");
assert.ok(
  redactedReport.findings.some((finding) => finding.action === "reference_only"),
  "redacted fixture must include reference-only findings",
);
assertReportPublicSafe(redactedReport);
assertReportAuthorityClosed(redactedReport);

const blockedPayloadExample = fixture.examples.blocked_private_or_raw_payload;
const blockedPayloadReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  blockedPayloadExample.input,
);
assert.equal(blockedPayloadReport.status, blockedPayloadExample.expected_status);
assert.ok(
  blockedPayloadReport.blocked_paths.includes("input.canonical_label"),
  "canonical label marker must be blocked",
);
assert.ok(
  blockedPayloadReport.reason_codes.includes(
    "canonical_label_from_private_identifier_blocked",
  ),
  "blocked private payload report must include canonical-label reason code",
);
assertReportPublicSafe(blockedPayloadReport);
assertReportAuthorityClosed(blockedPayloadReport);

const syntheticPatternExample = fixture.examples.synthetic_runtime_identifier_patterns;
const syntheticPatternReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  syntheticPatternExample.input,
);
assert.equal(syntheticPatternReport.status, syntheticPatternExample.expected_status);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.provider_internal_ref",
  "provider_internal_id_blocked",
  "redacted",
);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.provider_response_ref",
  "provider_internal_id_blocked",
  "redacted",
);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.provider_thread_ref",
  "provider_thread_id_blocked",
  "redacted",
);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.provider_run_ref",
  "provider_run_id_blocked",
  "redacted",
);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.provider_session_ref",
  "provider_session_id_blocked",
  "redacted",
);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.connector_ref",
  "opaque_connector_id_reference_only",
  "reference_only",
);
assertFinding(
  syntheticPatternReport,
  "input.optional_context.uploaded_file_ref",
  "uploaded_file_opaque_id_reference_only",
  "reference_only",
);
assertReportPublicSafe(syntheticPatternReport);
assertReportAuthorityClosed(syntheticPatternReport);

const syntheticCanonicalExample =
  fixture.examples.synthetic_runtime_identifier_canonical_block;
const syntheticCanonicalReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  syntheticCanonicalExample.input,
);
assert.equal(syntheticCanonicalReport.status, syntheticCanonicalExample.expected_status);
for (const blockedPath of [
  "input.canonical_label",
  "input.canonical_name",
  "input.canonical_title",
]) {
  assert.ok(
    syntheticCanonicalReport.blocked_paths.includes(blockedPath),
    "synthetic identifier in canonical label path must block",
  );
}
assert.ok(
  syntheticCanonicalReport.reason_codes.includes(
    "canonical_label_from_private_identifier_blocked",
  ),
  "synthetic canonical identifier report must include canonical-label reason code",
);
assertReportPublicSafe(syntheticCanonicalReport);
assertReportAuthorityClosed(syntheticCanonicalReport);

const falseAuthorityExample = fixture.examples.forbidden_authority_false_allowed;
const falseAuthorityReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  falseAuthorityExample.input,
);
assert.equal(falseAuthorityReport.status, falseAuthorityExample.expected_status);
assert.equal(
  falseAuthorityReport.findings.length,
  0,
  "false forbidden authority fields must remain allowed",
);
assertReportPublicSafe(falseAuthorityReport);
assertReportAuthorityClosed(falseAuthorityReport);

const nonFalseAuthorityExample =
  fixture.examples.blocked_forbidden_authority_non_false_values;
const nonFalseAuthorityReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  nonFalseAuthorityExample.input,
);
assert.equal(nonFalseAuthorityReport.status, nonFalseAuthorityExample.expected_status);
for (const blockedPath of [
  "input.authority_boundary.ci_pass_is_truth",
  "input.authority_boundary.github_api_call_now",
  "input.authority_boundary.product_write_authority",
  "input.authority_boundary.provider_openai_call_now",
  "input.authority_boundary.route_now",
  "input.authority_boundary.smoke_pass_is_truth",
  "input.authority_boundary.ui_now",
  "input.future_runtime_claim.future_call_now",
  "input.future_runtime_claim.future_execution_now",
  "input.future_runtime_claim.future_is_truth",
  "input.future_runtime_claim.future_write_now",
]) {
  assert.ok(
    nonFalseAuthorityReport.blocked_paths.includes(blockedPath),
    "non-false forbidden authority claim must block",
  );
}
for (const forbiddenEcho of ['"enabled"', '"yes"', '"true"']) {
  assert.equal(
    JSON.stringify(nonFalseAuthorityReport).includes(forbiddenEcho),
    false,
    "non-false authority string value must not be echoed",
  );
}
assertReportPublicSafe(nonFalseAuthorityReport);
assertReportAuthorityClosed(nonFalseAuthorityReport);

const forbiddenAuthorityExample = fixture.examples.blocked_forbidden_authority;
const forbiddenAuthorityReport = helper.buildPrivacyRedactionRuntimeGuardReportV01(
  forbiddenAuthorityExample.input,
);
assert.equal(forbiddenAuthorityReport.status, forbiddenAuthorityExample.expected_status);
assert.ok(
  forbiddenAuthorityReport.reason_codes.includes("authority_escalation_blocked"),
  "forbidden authority report must include authority escalation reason code",
);
assert.ok(
  forbiddenAuthorityReport.reason_codes.includes("product_write_denied"),
  "forbidden authority report must include product-write denial",
);
assertReportPublicSafe(forbiddenAuthorityReport);
assertReportAuthorityClosed(forbiddenAuthorityReport);

const invalidReport = helper.buildPrivacyRedactionRuntimeGuardReportV01({});
assert.equal(invalidReport.status, "blocked_invalid_input");
assert.equal(invalidReport.blocked_paths.includes("input"), true);
assertReportPublicSafe(invalidReport);
assertReportAuthorityClosed(invalidReport);

const observedReasonCodes = new Set();
for (const report of [
  safeReport,
  redactedReport,
  blockedPayloadReport,
  syntheticPatternReport,
  syntheticCanonicalReport,
  falseAuthorityReport,
  nonFalseAuthorityReport,
  forbiddenAuthorityReport,
  invalidReport,
]) {
  for (const reasonCode of report.reason_codes) {
    observedReasonCodes.add(reasonCode);
  }
}
for (const reasonCode of requiredReasonCodes) {
  assert.ok(observedReasonCodes.has(reasonCode), `fixture reports must cover reason code`);
}

for (const [caseName, example] of Object.entries(fixture.examples)) {
  const first = helper.buildPrivacyRedactionRuntimeGuardReportV01(example.input);
  const second = helper.buildPrivacyRedactionRuntimeGuardReportV01(example.input);
  assert.equal(first.guard_fingerprint, second.guard_fingerprint);
  assert.equal(
    helper.createPrivacyRedactionRuntimeGuardFingerprintV01(first),
    first.guard_fingerprint,
    `${caseName} fingerprint must be reproducible from report`,
  );
  assertNoUnsafeEcho(first);
}

assert.ok(
  safeReport.boundary_notes.includes("Product-write remains parked by #686."),
  "report boundary notes must preserve product-write parked wording",
);
assert.ok(
  docs.includes("Product-write remains parked by #686.") &&
    index.includes("Product-write remains parked by #686"),
  "docs and index must preserve product-write parked wording",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "privacy-redaction-guard-v0-1",
      verified: {
        safe_status: safeReport.status,
        redacted_status: redactedReport.status,
        blocked_private_or_raw_payload_status: blockedPayloadReport.status,
        synthetic_pattern_status: syntheticPatternReport.status,
        synthetic_canonical_status: syntheticCanonicalReport.status,
        non_false_authority_status: nonFalseAuthorityReport.status,
        blocked_forbidden_authority_status: forbiddenAuthorityReport.status,
        fingerprints: [
          safeReport.guard_fingerprint,
          redactedReport.guard_fingerprint,
          blockedPayloadReport.guard_fingerprint,
          syntheticPatternReport.guard_fingerprint,
          syntheticCanonicalReport.guard_fingerprint,
          nonFalseAuthorityReport.guard_fingerprint,
          forbiddenAuthorityReport.guard_fingerprint,
        ],
      },
    },
    null,
    2,
  ),
);

function assertReportPublicSafe(report) {
  assert.equal(report.guard_version, guardVersion);
  assert.equal(report.scope, scope);
  for (const finding of report.findings) {
    assert.equal(finding.original_value_included, false);
    assert.equal(typeof finding.path, "string");
    assert.equal(typeof finding.public_safe_summary, "string");
    assert.ok(
      ["blocked", "redacted", "reference_only", "allowed"].includes(finding.action),
      "finding action must be in vocabulary",
    );
  }
  assertNoUnsafeEcho(report);
}

function assertReportAuthorityClosed(report) {
  const boundary = report.authority_boundary;
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${field} must be true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${field} must stay false`);
  }
  for (const [key, value] of Object.entries(boundary)) {
    if (value === true) {
      assert.ok(
        authorityAllowedTrueFields.includes(key),
        "authority boundary must not introduce extra true flags",
      );
    }
  }
}

function assertFinding(report, findingPath, reasonCode, action) {
  const finding = report.findings.find((item) => item.path === findingPath);
  assert.ok(finding, "expected finding path must be present");
  assert.ok(
    finding.reason_codes.includes(reasonCode),
    "expected finding reason code must be present",
  );
  assert.equal(finding.action, action, "expected finding action must match");
  assert.equal(finding.original_value_included, false);
}

function assertNoUnsafeEcho(report) {
  const output = JSON.stringify(report);
  for (const unsafeValue of unsafeEchoValues) {
    assert.equal(output.includes(unsafeValue), false, "report must not echo unsafe fixture input");
  }
  for (const pattern of realLookingSecretPatterns) {
    assert.equal(pattern.test(output), false, "report must not echo real-looking secret");
  }
}

function assertNoForbiddenHelperImports() {
  for (const pattern of forbiddenHelperPatterns) {
    assert.equal(pattern.test(helperSource), false, `helper must not match ${pattern}`);
  }
}

function assertNoRealLookingSecrets() {
  for (const filePath of [helperPath, docsPath, fixturePath, smokePath, indexPath, packagePath]) {
    const source = read(filePath);
    for (const pattern of realLookingSecretPatterns) {
      assert.equal(pattern.test(source), false, `${filePath} must not contain a live-looking secret`);
    }
  }
}

function assertSliceFileScope() {
  const expectedSliceFiles = new Set([helperPath, docsPath, fixturePath, smokePath]);
  const sliceNamedFiles = listFiles(["app", "components", "lib", "scripts", "docs", "fixtures", "types"])
    .filter((filePath) => {
      const lower = filePath.toLowerCase();
      return (
        lower.includes("privacy-redaction") ||
        lower.includes("privacy_redaction") ||
        lower.includes("redaction-guard") ||
        filePath === helperPath
      );
    })
    .sort();

  for (const filePath of expectedSliceFiles) {
    assert.ok(sliceNamedFiles.includes(filePath), `slice file scope must include ${filePath}`);
  }
  for (const filePath of sliceNamedFiles) {
    assert.ok(expectedSliceFiles.has(filePath), `unexpected slice-named file path`);
    assert.equal(
      /^app\//.test(filePath) ||
        /^components\//.test(filePath) ||
        /^lib\/db\//.test(filePath) ||
        /^lib\/product-write\//.test(filePath) ||
        /^lib\/research-retrieval\//.test(filePath) ||
        /^pages\//.test(filePath),
      false,
      "slice must not add route/UI/DB/retrieval/product-write files",
    );
  }
}

function collectSafeMarkers(value) {
  const markers = new Set();
  visit(value);
  return [...markers].sort();

  function visit(item) {
    if (typeof item === "string" && item.startsWith("SAFE_MARKER_")) {
      markers.add(item);
      return;
    }
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    if (item && typeof item === "object") {
      for (const child of Object.values(item)) visit(child);
    }
  }
}

function collectUnsafeEchoValues(value) {
  const values = new Set();
  visit(value);
  return [...values].sort();

  function visit(item) {
    if (typeof item === "string") {
      if (item.startsWith("SAFE_MARKER_") || isSyntheticIdentifierFixtureValue(item)) {
        values.add(item);
      }
      return;
    }
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    if (item && typeof item === "object") {
      for (const child of Object.values(item)) visit(child);
    }
  }
}

function isSyntheticIdentifierFixtureValue(value) {
  return [
    /\b(?:resp|response|msg|message|asst|assistant|cmpl|chatcmpl)_[A-Za-z0-9][A-Za-z0-9_-]{8,}\b/i,
    /\b(?:thread|thr)_[A-Za-z0-9][A-Za-z0-9_-]{8,}\b/i,
    /\brun_[A-Za-z0-9][A-Za-z0-9_-]{8,}\b/i,
    /\b(?:sess|session)_[A-Za-z0-9][A-Za-z0-9_-]{8,}\b/i,
    /\b(?:connector|conn)_[A-Za-z0-9][A-Za-z0-9_-]{8,}\b/i,
    /\b(?:file|upload|uploaded_file)_[A-Za-z0-9][A-Za-z0-9_-]{8,}\b/i,
    /\bsynthetic[-_:]provider[-_:]internal[-_:]ref[-_:][A-Za-z0-9][A-Za-z0-9_-]{7,}\b/i,
  ].some((pattern) => pattern.test(value));
}

async function importPrivacyRedactionGuardHelper() {
  const stripped = stripTypeScriptTypes(helperSource, { mode: "strip" });
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
}

function listFiles(roots) {
  const files = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    walk(root);
  }
  return files.sort();

  function walk(currentPath) {
    const stats = statSync(currentPath);
    if (stats.isDirectory()) {
      const base = path.basename(currentPath);
      if ([".git", ".next", "node_modules", "dist", "coverage"].includes(base)) {
        return;
      }
      for (const entry of readdirSync(currentPath).sort()) {
        walk(path.join(currentPath, entry));
      }
      return;
    }
    if (stats.isFile()) {
      files.push(currentPath);
    }
  }
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}
