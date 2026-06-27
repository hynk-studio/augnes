#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const typePath = "types/local-data-export.ts";
const fixturePath = "fixtures/local-data-export.sample.v0.1.json";
const smokePath = "scripts/smoke-local-data-export-policy-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const contractVersion = "local_data_export_contract.v0.1";
const bundleVersion = "local_data_export_bundle.v0.1";
const manifestVersion = "local_data_export_manifest.v0.1";
const sectionVersion = "local_data_export_section.v0.1";
const importPreviewVersion = "local_data_import_preview.v0.1";
const findingVersion = "local_data_import_validation_finding.v0.1";
const fixtureVersion = "local_data_export_policy.sample.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:local-data-export-policy-v0-1";
const packageScriptValue = "node scripts/smoke-local-data-export-policy-v0-1.mjs";

const statusVocabulary = [
  "contract_only",
  "policy_only",
  "candidate_export_manifest_only",
  "ready_for_future_operator_export",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_import_action",
  "blocked_product_write",
  "rejected",
];

const dataClasses = [
  "review_records",
  "source_refs",
  "candidate_bundles",
  "promotion_decisions",
  "formation_receipts",
  "durable_perspective_state",
  "trajectory_events",
  "feedback_events",
  "layout_preferences",
  "dogfooding_records",
  "runtime_audit_events",
  "retrieval_index_metadata",
  "provider_extraction_candidates",
  "git_ledger_export_refs",
  "product_write_parked_refs",
];

const importActions = [
  "preview_only",
  "validate_only",
  "restore_review_memory_candidate",
  "restore_source_ref_metadata",
  "restore_candidate_bundle_candidate",
  "restore_feedback_candidate",
  "restore_layout_preference_candidate",
  "restore_dogfooding_candidate",
  "restore_runtime_audit_reference",
  "blocked_auto_promote",
  "blocked_auto_product_write",
  "blocked_auto_proof_evidence_write",
  "blocked_auto_durable_state_apply",
  "blocked_auto_provider_call",
  "blocked_auto_retrieval_execution",
  "blocked_auto_git_github_execution",
];

const privacyRedactionPolicies = [
  "public_safe_summary_only",
  "symbolic_refs_only",
  "reference_only",
  "redacted",
  "blocked_raw_private_payload",
  "blocked_raw_source_body",
  "blocked_provider_thread_run_session_id",
  "blocked_private_url",
  "blocked_local_private_path",
  "blocked_secret_like_pattern",
];

const reasonCodes = [
  "roadmap_file_present",
  "privacy_guard_required",
  "export_policy_only",
  "import_policy_only",
  "export_manifest_contract_defined",
  "import_preview_contract_defined",
  "public_safe_summary_only",
  "source_refs_are_lineage_not_proof",
  "candidate_is_not_fact",
  "review_record_is_not_durable_state",
  "promotion_decision_required_before_state_apply",
  "formation_receipt_required_before_state_apply",
  "durable_state_import_is_preview_only",
  "feedback_is_not_truth",
  "retrieval_index_is_derived",
  "provider_output_is_candidate_only",
  "git_ledger_is_export_not_authority",
  "product_write_parked",
  "product_write_denied",
  "raw_private_payload_blocked",
  "raw_source_body_blocked",
  "provider_thread_run_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "auto_promote_blocked",
  "auto_product_write_blocked",
  "auto_proof_evidence_write_blocked",
  "auto_durable_state_apply_blocked",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "git_github_not_executed",
  "file_io_not_implemented",
  "db_write_not_executed",
];

const authorityAllowedTrueFields = [
  "local_data_export_import_policy_now",
  "contract_only",
  "caller_provided_policy_only",
  "privacy_guard_required_for_future_runtime",
];

const authorityFalseFields = [
  "local_export_runtime_now",
  "local_import_runtime_now",
  "file_write_now",
  "file_read_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "source_fetch_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "product_id_allocation_authority",
  "import_auto_promote_now",
  "import_auto_product_write_now",
  "import_auto_proof_evidence_write_now",
  "import_auto_durable_state_apply_now",
  "export_contains_raw_private_payload",
  "export_contains_raw_source_body",
  "export_contains_provider_thread_run_session_id",
  "export_contains_private_url",
  "export_contains_local_private_path",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Privacy Redaction Runtime Guard v0.1",
  "## Relationship to Review Memory, Promotion Decision, Formation Receipt, Durable Perspective State, Trajectory, Feedback, Layout, Dogfooding, Runtime Audit, Retrieval, Provider Extraction, Git Ledger, and Product Write",
  "## Export Scope",
  "## Import Preview Policy",
  "## Privacy/Redaction Policy",
  "## Authority Boundary",
  "## Data Class Matrix",
  "## Import Action Matrix",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const docsExactPhrases = [
  "This slice is policy-only and contract-only.",
  "This slice does not implement export/import runtime.",
  "It does not write files.",
  "It does not read files as export/import input.",
  "It does not query or write DB.",
  "It does not add routes or UI.",
  "It does not call providers.",
  "It does not execute retrieval/RAG.",
  "It does not create proof/evidence.",
  "It does not promote Perspective.",
  "It does not write or apply durable Perspective state.",
  "It does not write Formation Receipts.",
  "It does not execute Git Ledger export runtime.",
  "It does not call GitHub or execute Git.",
  "It does not execute Codex.",
  "It does not allocate product IDs or write products.",
  "Product-write remains parked by #686.",
  "Privacy Redaction Runtime Guard v0.1 is required before any future export/import runtime.",
  "Imports are preview/validate only unless a future explicit operator-gated runtime slice is approved.",
  "Import must never auto-promote, auto-write product state, auto-create proof/evidence, auto-apply durable state, auto-call provider, auto-run retrieval, or auto-run Git/GitHub.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const requiredTypeExports = [
  "LocalDataExportContractVersion",
  "LocalDataExportBundleVersion",
  "LocalDataExportImportPolicyScope",
  "LocalDataExportImportStatuses",
  "LocalDataExportDataClasses",
  "LocalDataImportActions",
  "LocalDataPrivacyRedactionPolicies",
  "LocalDataExportImportReasonCodes",
  "LocalDataExportImportAuthorityBoundary",
  "LocalDataExportBundle",
  "LocalDataExportManifest",
  "LocalDataExportSection",
  "LocalDataImportPreview",
  "LocalDataImportValidationFinding",
];

const allowedSafeMarkers = [
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_RAW_DB_ROW",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
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

for (const requiredPath of [
  docsPath,
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  roadmapPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docs = read(docsPath);
const typeSource = read(typePath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.ok(
  roadmap.includes("local_data_export_import_policy_v0_1"),
  "roadmap must contain local_data_export_import_policy_v0_1",
);
assert.ok(
  docs.includes("privacy_redaction_runtime_guard_v0_1") ||
    docs.includes("Privacy Redaction Runtime Guard v0.1"),
  "docs must mention the privacy redaction runtime guard dependency",
);

assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the local data export/import policy smoke",
);

for (const pointer of [docsPath, typePath, fixturePath, smokePath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}
assertNear(
  index,
  "Local Data Export/Import Policy v0.1",
  "Product-write remains parked by #686.",
);
assertNear(
  index,
  "Local Data Export/Import Policy v0.1",
  "Privacy Redaction Runtime Guard v0.1 is required",
);
assertNear(
  index,
  "Local Data Export/Import Policy v0.1",
  "Smoke/CI pass is not truth.",
);

for (const section of requiredDocsSections) {
  assert.ok(docs.includes(section), `docs must include section ${section}`);
}
for (const phrase of docsExactPhrases) {
  assert.ok(
    includesNormalized(docs, phrase),
    `docs must include required phrase: ${phrase}`,
  );
}

for (const exportedName of requiredTypeExports) {
  assert.ok(
    typeSource.includes(exportedName),
    `type contract must include ${exportedName}`,
  );
}
for (const value of [
  contractVersion,
  bundleVersion,
  manifestVersion,
  sectionVersion,
  importPreviewVersion,
  findingVersion,
  scope,
  ...statusVocabulary,
  ...dataClasses,
  ...importActions,
  ...privacyRedactionPolicies,
  ...reasonCodes,
  ...authorityAllowedTrueFields,
  ...authorityFalseFields,
]) {
  assert.ok(typeSource.includes(`"${value}"`) || typeSource.includes(`${value}:`), `type contract must include ${value}`);
}
assertNoRuntimeImplementationInType();

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.manifest_version, manifestVersion);
assert.equal(fixture.section_version, sectionVersion);
assert.equal(fixture.import_preview_version, importPreviewVersion);
assert.equal(fixture.finding_version, findingVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.privacy_guard_ref, "privacy_redaction_runtime_guard_v0_1");

assert.ok(
  fixture.safe_export_manifest_example,
  "fixture must contain a safe export manifest example",
);
assert.ok(
  fixture.import_preview_example,
  "fixture must contain an import preview example",
);
assert.ok(
  fixture.safe_export_bundle_example,
  "fixture must contain a safe export bundle example",
);
assert.ok(
  fixture.blocked_raw_private_example,
  "fixture must contain a blocked raw/private example",
);
assert.ok(
  fixture.blocked_auto_action_example,
  "fixture must contain a blocked auto-action example",
);
assert.ok(
  fixture.product_write_parked_example,
  "fixture must contain a product-write parked example",
);

assert.equal(fixture.safe_export_manifest_example.contract_version, contractVersion);
assert.equal(fixture.safe_export_manifest_example.scope, scope);
assert.equal(fixture.import_preview_example.contract_version, contractVersion);
assert.equal(fixture.import_preview_example.scope, scope);
assert.equal(fixture.safe_export_bundle_example.bundle_version, bundleVersion);
assert.equal(fixture.safe_export_bundle_example.contract_version, contractVersion);
assert.equal(fixture.safe_export_bundle_example.scope, scope);
assert.equal(fixture.safe_export_bundle_example.privacy_guard_ref, "privacy_redaction_runtime_guard_v0_1");
assert.equal(
  fixture.safe_export_bundle_example.roadmap_ref,
  "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
);

assert.equal(
  fixtureText.includes("authority_boundary_ref"),
  false,
  "fixture must not use authority_boundary_ref aliases",
);

const manifestDataClasses = new Set(
  fixture.safe_export_manifest_example.sections.map((section) => section.data_class),
);
for (const dataClass of dataClasses) {
  assert.ok(
    manifestDataClasses.has(dataClass),
    `safe export manifest must include data class ${dataClass}`,
  );
}

for (const importAction of importActions) {
  const requested = fixture.import_preview_example.requested_actions.includes(importAction);
  const blocked = fixture.import_preview_example.blocked_actions.includes(importAction);
  assert.ok(
    requested || blocked,
    `import preview must cover import action ${importAction}`,
  );
}

assertAuthorityBoundaryClosed(
  fixture.authority_boundary_sample,
  "fixture.authority_boundary_sample",
);
assertAuthorityBoundaryClosed(
  fixture.safe_export_manifest_example.authority_boundary,
  "fixture.safe_export_manifest_example.authority_boundary",
);
for (const [index, section] of fixture.safe_export_manifest_example.sections.entries()) {
  assertAuthorityBoundaryClosed(
    section.authority_boundary,
    `fixture.safe_export_manifest_example.sections.${index}.authority_boundary`,
  );
}
assertAuthorityBoundaryClosed(
  fixture.import_preview_example.authority_boundary,
  "fixture.import_preview_example.authority_boundary",
);
assertAuthorityBoundaryClosed(
  fixture.safe_export_bundle_example.authority_boundary,
  "fixture.safe_export_bundle_example.authority_boundary",
);
assertAuthorityBoundaryClosed(
  fixture.safe_export_bundle_example.export_manifest.authority_boundary,
  "fixture.safe_export_bundle_example.export_manifest.authority_boundary",
);
for (const [index, section] of fixture.safe_export_bundle_example.export_manifest.sections.entries()) {
  assertAuthorityBoundaryClosed(
    section.authority_boundary,
    `fixture.safe_export_bundle_example.export_manifest.sections.${index}.authority_boundary`,
  );
}
assertAuthorityBoundaryClosed(
  fixture.safe_export_bundle_example.import_preview.authority_boundary,
  "fixture.safe_export_bundle_example.import_preview.authority_boundary",
);

const safeMarkers = collectSafeMarkers(fixture);
assert.deepEqual(
  [...new Set(safeMarkers.map((entry) => entry.value))].sort(),
  [...allowedSafeMarkers].sort(),
  "fixture must use only the approved safe placeholder markers",
);
for (const marker of safeMarkers) {
  assert.ok(
    marker.path.startsWith("fixture.blocked_raw_private_example.blocked_fixture_markers"),
    `safe marker must appear only in blocked fixture markers: ${marker.path}`,
  );
}

for (const pattern of liveLookingPrivatePatterns) {
  assert.ok(
    !pattern.test(fixtureText),
    `fixture must not include live-looking secret/private/provider pattern: ${pattern}`,
  );
  assert.ok(
    !pattern.test(docs),
    `docs must not include live-looking secret/private/provider pattern: ${pattern}`,
  );
  assert.ok(
    !pattern.test(typeSource),
    `types must not include live-looking secret/private/provider pattern: ${pattern}`,
  );
}

assert.equal(
  fixture.product_write_parked_example.status,
  "blocked_product_write",
  "product-write fixture example must stay blocked",
);
assert.ok(
  fixture.product_write_parked_example.public_safe_summary.includes(
    "Product-write remains parked by #686",
  ),
  "product-write parked example must cite #686",
);
assert.ok(
  docs.includes("Product-write remains parked by #686."),
  "docs must keep product-write parked wording",
);

assertNoForbiddenRuntimeFiles();

console.log("local_data_export_import_policy_v0_1 smoke passed");

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function assertNear(source, anchor, phrase) {
  const indexOfAnchor = source.indexOf(anchor);
  assert.notEqual(indexOfAnchor, -1, `anchor must exist: ${anchor}`);
  const excerpt = source.slice(indexOfAnchor, indexOfAnchor + 3500);
  assert.ok(
    includesNormalized(excerpt, phrase),
    `expected phrase near ${anchor}: ${phrase}`,
  );
}

function collectSafeMarkers(value, prefix = "fixture") {
  const markers = [];
  visit(value, prefix);
  return markers;

  function visit(current, currentPath) {
    if (typeof current === "string") {
      if (current.startsWith("SAFE_MARKER_")) {
        markers.push({ path: currentPath, value: current });
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${currentPath}.${index}`));
      return;
    }
    if (current && typeof current === "object") {
      for (const [key, nested] of Object.entries(current)) {
        visit(nested, `${currentPath}.${key}`);
      }
    }
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

function assertNoRuntimeImplementationInType() {
  const forbiddenTypePatterns = [
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
    /from\s+["']next\/server["']/,
    /from\s+["']openai["']/i,
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /\breadFile(?:Sync)?\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bcreateReadStream\s*\(/,
    /\bcreateWriteStream\s*\(/,
    /\bfetch\s*\(/,
    /\bDatabase\s*\(/,
    /\bNextResponse\b/,
  ];
  for (const pattern of forbiddenTypePatterns) {
    assert.ok(
      !pattern.test(typeSource),
      `type contract must not implement runtime behavior: ${pattern}`,
    );
  }
}

function assertNoForbiddenRuntimeFiles() {
  const runtimeDirs = ["app", "components", "lib"];
  const suspiciousPathPattern =
    /local[-_]data[-_]export|export[-_]import[-_]policy/i;
  const forbiddenRuntimeHits = [];
  for (const runtimeDir of runtimeDirs) {
    if (!existsSync(runtimeDir)) {
      continue;
    }
    for (const filePath of walk(runtimeDir)) {
      if (suspiciousPathPattern.test(filePath)) {
        forbiddenRuntimeHits.push(filePath);
      }
    }
  }
  assert.deepEqual(
    forbiddenRuntimeHits,
    [],
    "slice must not add route/UI/DB/provider/retrieval/GitHub/Git/product-write runtime files",
  );

  const expectedSliceFiles = [
    docsPath,
    typePath,
    fixturePath,
    smokePath,
    packagePath,
    indexPath,
  ];
  for (const expectedFile of expectedSliceFiles) {
    assert.ok(
      existsSync(expectedFile),
      `expected narrow-scope slice file must exist: ${expectedFile}`,
    );
  }
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") {
        continue;
      }
      paths.push(...walk(fullPath));
      continue;
    }
    paths.push(fullPath);
  }
  return paths;
}
