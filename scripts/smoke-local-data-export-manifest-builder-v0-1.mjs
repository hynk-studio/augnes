#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const typePath = "types/local-data-export-manifest.ts";
const helperPath = "lib/local-export/build-local-data-export-manifest.ts";
const fixturePath = "fixtures/local-data-export-manifest.sample.v0.1.json";
const smokePath = "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs";
const docsPath = "docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const policyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const policyTypePath = "types/local-data-export.ts";
const policySmokePath = "scripts/smoke-local-data-export-policy-v0-1.mjs";
const privacyGuardPath = "lib/privacy/redaction-guard.ts";
const proposalTypePath = "types/dogfooding-to-review-memory-proposal.ts";
const proposalHelperPath = "lib/dogfooding/build-review-memory-proposal.ts";
const proposalSmokePath =
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs";
const handoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const packetSmokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const proposalDocsPath = "docs/DOGFOODING_TO_REVIEW_MEMORY_PROPOSAL_V0_1.md";
const reconciliationDocsPath =
  "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";

const fixtureVersion = "local_data_export_manifest_builder.sample.v0.1";
const manifestVersion = "local_data_export_manifest_candidate.v0.1";
const builderVersion = "local_data_export_manifest_builder.v0.1";
const selectedSlice = "local_data_export_manifest_builder_v0_1";
const nextSlice = "git_ledger_export_manifest_binding_v0_1";
const scope = "project:augnes";
const packageScriptName = "smoke:local-data-export-manifest-builder-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-local-data-export-manifest-builder-v0-1.mjs";

const expectedChangedFiles = new Set([
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  policySmokePath,
  "lib/git-ledger/build-export-packet-from-local-manifest.ts",
  "fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json",
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs",
  "docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md",
  "types/runtime-audit-event.ts",
  "lib/runtime-audit/audit-event-store.ts",
  "fixtures/selected-runtime-audit-event-store.sample.v0.1.json",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md",
  "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md",
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json",
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs",
]);

const newSliceFiles = [
  "docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md",
  "fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json",
  "scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs",
];

const requiredHelperExports = [
  "buildLocalDataExportManifestCandidateV01",
  "buildLocalDataExportManifestV01",
  "createLocalDataExportManifestAuthorityBoundaryV01",
  "createLocalDataExportManifestFingerprintV01",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "PR #875 provides dogfooding to Review Memory proposal context.",
  "This slice adds no UI, components, route model changes, or API routes.",
  "Local data export manifest is candidate-only.",
  "Local data export manifest is not an export file.",
  "Local data export manifest is not file write approval.",
  "Local data export manifest is not import approval.",
  "Manifest fingerprint is not proof.",
  "Manifest fingerprint is not approval.",
  "Manifest status is not product/release readiness.",
  "Export item summary is not raw data.",
  "Import preview is not import apply.",
  "Review Memory summaries are references only.",
  "Review Memory proposals are candidate-only.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "CI pass is not authority.",
  "Skipped checks are review context, not failure by themselves.",
  "Known warnings are review context, not automatic rejection.",
  "Not-done items are next-task cues, not automatic task creation.",
  "Expected/observed delta is reconciliation context, not approval or rejection.",
  "`git_ledger_export_manifest_binding_v0_1`",
];

const forbiddenHelperSnippets = [
  "from \"openai\"",
  "from 'openai'",
  "fetch(",
  "NextResponse",
  "Database(",
  "PrismaClient",
  "readFile",
  "readFileSync",
  "writeFile",
  "writeFileSync",
  "appendFile",
  "mkdir",
  "execFile",
  "spawn",
  "github_api_call_now: true",
  "provider_openai_call_now: true",
  "retrieval_execution_now: true",
  "source_fetch_now: true",
  "review_memory_write_now: true",
  "proof_or_evidence_record_now: true",
  "promotion_execution_now: true",
  "formation_receipt_write_now: true",
  "durable_state_apply_now: true",
  "product_write_now: true",
  "release_deploy_publish_now: true",
  "local_file_write_now: true",
  "local_file_read_now: true",
  "export_file_written: true",
  "import_apply_executed: true",
];

for (const requiredPath of [
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  policyDocsPath,
  policyTypePath,
  policySmokePath,
  privacyGuardPath,
  proposalTypePath,
  proposalHelperPath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  proposalDocsPath,
  reconciliationDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const typeText = read(typePath);
const helperText = read(helperPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const docsText = read(docsPath);
const indexText = read(indexPath);
const packageJson = JSON.parse(read(packagePath));
const proposalSmokeText = read(proposalSmokePath);
const handoffSmokeText = read(handoffSmokePath);
const packetSmokeText = read(packetSmokePath);
const codexBindingSmokeText = read(codexBindingSmokePath);
const dogfoodingSmokeText = read(dogfoodingSmokePath);
const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);

assertFixtureVersions();
assertStaticCoverage();
assertMinimalManifest();
assertMultiCategoryManifest();
assertAllProfiles();
assertRedactedWithWarnings();
assertBlockedPrivateMarkers();
assertBlockedAuthority();
assertAllowedNegatedAuthorityText();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "local-data-export-manifest-builder-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      profiles_checked: fixture.required_export_profiles.length,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.manifest_version, manifestVersion);
  assert.equal(fixture.builder_version, builderVersion);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.equal(fixture.scope, scope);
  assert.deepEqual(fixture.required_export_profiles, [
    "operator_review_bundle",
    "dogfooding_memory_bundle",
    "handoff_context_bundle",
    "review_proposal_bundle",
    "audit_readiness_bundle",
    "release_readiness_bundle",
    "minimal_public_safe_bundle",
  ]);
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
  assert.equal(fixture.post_868_boundary.file_write_in_scope, false);
  assert.equal(fixture.post_868_boundary.file_read_in_scope, false);
  assert.equal(fixture.post_868_boundary.import_apply_in_scope, false);
}

function assertStaticCoverage() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const pointer of [docsPath, fixturePath, smokePath]) {
    assert.ok(indexText.includes(pointer), `latest index must include ${pointer}`);
  }
  for (const phrase of requiredDocsPhrases) {
    assert.ok(
      includesNormalized(docsText, phrase),
      `docs must include required phrase: ${phrase}`,
    );
  }
  for (const exportName of requiredHelperExports) {
    assert.ok(helperText.includes(exportName), `helper must export ${exportName}`);
  }
  for (const profile of fixture.required_export_profiles) {
    assert.ok(typeText.includes(`"${profile}"`), `type contract must include ${profile}`);
  }
  for (const snippet of forbiddenHelperSnippets) {
    assert.ok(!helperText.includes(snippet), `helper must not include ${snippet}`);
  }
  for (const pointer of newSliceFiles) {
    for (const smokeText of [
      proposalSmokeText,
      handoffSmokeText,
      packetSmokeText,
      codexBindingSmokeText,
      dogfoodingSmokeText,
    ]) {
      assert.ok(
        smokeText.includes(pointer),
        `downstream exact changed-file guard must include ${pointer}`,
      );
    }
  }
  for (const oldSmoke of [
    proposalSmokeText,
    handoffSmokeText,
    packetSmokeText,
    codexBindingSmokeText,
    dogfoodingSmokeText,
  ]) {
    assert.doesNotMatch(
      oldSmoke,
      /local-data-export-manifest.*\*\*/i,
      "compatibility guards must not become broad future-slice allowlists",
    );
  }
}

function assertMinimalManifest() {
  const result = helper.buildLocalDataExportManifestCandidateV01(
    fixture.safe_minimal_input,
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "candidate_only");
  assert.equal(result.error_code, null);
  assert.equal(result.export_profile, "minimal_public_safe_bundle");
  assert.equal(result.manifest.manifest_id, "local-data-export-manifest:fixture-minimal");
  assert.equal(result.manifest.manifest_version, manifestVersion);
  assert.equal(result.manifest.builder_version, builderVersion);
  assert.equal(result.manifest.scope, scope);
  assert.equal(result.manifest.export_file_written, false);
  assert.equal(result.manifest.import_apply_executed, false);
  assert.equal(result.manifest.import_preview.preview_only, true);
  assert.equal(result.manifest.import_preview.import_apply_executed, false);
  assert.equal(result.manifest.import_preview.import_approval_granted, false);
  assert.ok(
    result.manifest.dogfooding_record_summary_refs.includes(
      "dogfooding-research-record:proposal-sample-a",
    ),
  );
  assert.ok(
    result.manifest.review_memory_proposal_refs.includes(
      "review-memory-proposal:dogfooding:fixture-multi",
    ),
  );
  assert.ok(
    result.manifest.validation_refs.includes(
      "npm run smoke:local-data-export-manifest-builder-v0-1",
    ),
  );
  assert.ok(
    result.manifest.skipped_check_refs.includes("skipped:none"),
    "skipped checks must be preserved as context",
  );
  assert.ok(
    result.manifest.not_done_refs.includes(
      "not-done:git-ledger-export-manifest-binding-remains-next-slice",
    ),
  );
  assert.ok(
    result.manifest.expected_observed_delta_refs.includes(
      "delta:manifest-builder-only-no-export-file",
    ),
  );
  assert.ok(result.manifest.export_item_summaries.length > 0);
  assertManifestBoundary(result);
}

function assertMultiCategoryManifest() {
  const first = helper.buildLocalDataExportManifestCandidateV01(
    fixture.safe_multi_category_input,
  );
  const second = helper.buildLocalDataExportManifestCandidateV01(
    fixture.safe_multi_category_input,
  );
  assert.deepEqual(first, second, "same input and profile must be deterministic");
  assert.equal(first.status, "candidate_only");
  assert.equal(first.manifest.manifest_fingerprint, second.manifest.manifest_fingerprint);
  assert.ok(first.manifest.source_summary_refs.includes("source-summary:dogfooding-chain"));
  assert.ok(first.manifest.review_memory_summary_refs.includes("review-memory-summary:public-safe-a"));
  assert.ok(first.manifest.promotion_decision_refs.includes("promotion-decision-ref:reference-only"));
  assert.ok(first.manifest.formation_receipt_refs.includes("formation-receipt-ref:reference-only"));
  assert.ok(first.manifest.durable_state_summary_refs.includes("durable-state-summary:public-safe"));
  assert.ok(first.manifest.git_ledger_packet_refs.includes("git-ledger-packet-ref:future-binding"));
  assert.ok(
    first.manifest.reason_codes.includes("manifest_fingerprint_not_proof"),
    "manifest fingerprint must not be proof",
  );
  assert.ok(
    first.manifest.reason_codes.includes("manifest_fingerprint_not_approval"),
    "manifest fingerprint must not be approval",
  );
  for (const item of first.manifest.export_item_summaries) {
    assert.equal(item.reference_only, true);
    assert.equal(item.candidate_only, true);
    assert.equal(item.raw_data_included, false);
    assert.equal(item.canonical_source_body_included, false);
    assert.equal(item.proof_or_evidence_created, false);
  }
  assertManifestBoundary(first);
}

function assertAllProfiles() {
  const manifests = fixture.required_export_profiles.map((profile) => {
    const result = helper.buildLocalDataExportManifestCandidateV01(
      fixture.safe_multi_category_input,
      profile,
    );
    assert.equal(result.ok, true, `${profile} should build`);
    assert.equal(result.manifest.export_profile, profile);
    assert.equal(result.manifest.authority_boundary.local_data_export_manifest_is_export_file, false);
    assert.equal(result.manifest.authority_boundary.manifest_status_is_release_readiness, false);
    return result.manifest;
  });
  const fingerprints = new Set(manifests.map((manifest) => manifest.manifest_fingerprint));
  assert.ok(fingerprints.size > 1, "profiles should change deterministic fingerprints");
  const operatorFirst = manifests
    .find((manifest) => manifest.export_profile === "operator_review_bundle")
    .export_item_summaries[0].item_kind;
  const dogfoodingFirst = manifests
    .find((manifest) => manifest.export_profile === "dogfooding_memory_bundle")
    .export_item_summaries[0].item_kind;
  const releaseFirst = manifests
    .find((manifest) => manifest.export_profile === "release_readiness_bundle")
    .export_item_summaries[0].item_kind;
  assert.notEqual(operatorFirst, dogfoodingFirst);
  assert.equal(releaseFirst, "validation_ref");
  const releaseManifest = manifests.find(
    (manifest) => manifest.export_profile === "release_readiness_bundle",
  );
  assert.equal(releaseManifest.import_preview.auto_promote_executed, false);
  assert.equal(releaseManifest.authority_boundary.release_deploy_publish_now, false);
}

function assertRedactedWithWarnings() {
  const result = helper.buildLocalDataExportManifestCandidateV01(
    fixture.redacted_with_warnings_input,
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "redacted_with_warnings");
  assert.equal(result.manifest.manifest_status, "redacted_with_warnings");
  assert.equal(result.manifest.redaction_report.unsafe_raw_values_included, false);
  assert.ok(result.manifest.redaction_report.reference_only_paths.length > 0);
  assert.doesNotMatch(JSON.stringify(result), /SAFE_MARKER_OPAQUE_CONNECTOR_ID/);
  assert.doesNotMatch(JSON.stringify(result), /SAFE_MARKER_UPLOADED_FILE_OPAQUE_ID/);
}

function assertBlockedPrivateMarkers() {
  for (const testCase of fixture.blocked_private_marker_cases) {
    const input = {
      manifest_id: `local-data-export-manifest:blocked-private:${testCase.case_id}`,
      created_at: "2026-06-30T03:40:00.000Z",
      [testCase.field]: [testCase.marker],
    };
    const result = helper.buildLocalDataExportManifestCandidateV01(input);
    assert.equal(result.ok, false, `${testCase.case_id} must be blocked`);
    assert.equal(result.status, "blocked_private_or_raw_payload");
    assert.equal(result.manifest, null);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(testCase.marker));
  }
}

function assertBlockedAuthority() {
  const structured = helper.buildLocalDataExportManifestCandidateV01(
    fixture.blocked_structured_authority_example,
  );
  assert.equal(structured.ok, false);
  assert.equal(structured.status, "blocked_forbidden_authority");
  assert.equal(structured.manifest, null);

  for (const testCase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const phrase = testCase.phrase_parts.join(" ");
    const input = {
      manifest_id: `local-data-export-manifest:blocked-authority:${testCase.case_id}`,
      created_at: "2026-06-30T03:45:00.000Z",
      source_summary_refs: ["source-summary:blocked-authority"],
      validation_refs: ["npm run smoke:local-data-export-manifest-builder-v0-1"],
      [testCase.field]: [phrase],
    };
    const result = helper.buildLocalDataExportManifestCandidateV01(input);
    assert.equal(result.ok, false, `${testCase.case_id} must be blocked`);
    assert.equal(result.status, "blocked_forbidden_authority");
    assert.equal(result.manifest, null);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(escapeRegExp(phrase), "i"));
    assert.ok(result.reason_codes.includes("forbidden_authority_blocked"));
  }
}

function assertAllowedNegatedAuthorityText() {
  for (const text of fixture.allowed_negated_authority_examples) {
    const result = helper.buildLocalDataExportManifestCandidateV01({
      manifest_id: `local-data-export-manifest:allowed:${slug(text)}`,
      created_at: "2026-06-30T03:50:00.000Z",
      source_summary_refs: [
        {
          ref: `source-summary:allowed:${slug(text)}`,
          public_safe_summary: text,
        },
      ],
      validation_refs: ["npm run smoke:local-data-export-manifest-builder-v0-1"],
    });
    assert.equal(result.ok, true, `negated boundary text must be accepted: ${text}`);
  }
}

function assertManifestBoundary(result) {
  for (const flag of fixture.required_false_execution_flags) {
    assert.equal(result[flag], false, `result flag ${flag} must be false`);
  }
  const manifest = result.manifest;
  assert.equal(manifest.export_file_written, false);
  assert.equal(manifest.import_apply_executed, false);
  assert.equal(manifest.import_preview.preview_only, true);
  assert.equal(manifest.import_preview.import_apply_executed, false);
  assert.equal(manifest.import_preview.auto_promote_executed, false);
  assert.equal(manifest.import_preview.auto_product_write_executed, false);
  for (const field of fixture.required_authority_boundary_false_fields) {
    assert.equal(manifest.authority_boundary[field], false, `${field} must remain false`);
  }
  assert.equal(manifest.authority_boundary.local_data_export_manifest_is_export_file, false);
  assert.equal(manifest.authority_boundary.local_data_export_manifest_is_import_approval, false);
  assert.equal(manifest.authority_boundary.export_item_summary_is_raw_data, false);
  assert.equal(manifest.authority_boundary.import_preview_is_import_apply, false);
  assert.equal(manifest.authority_boundary.manifest_fingerprint_is_proof, false);
  assert.equal(manifest.authority_boundary.manifest_fingerprint_is_approval, false);
  assert.equal(manifest.authority_boundary.manifest_status_is_product_readiness, false);
  assert.equal(manifest.authority_boundary.manifest_status_is_release_readiness, false);
  assert.equal(manifest.authority_boundary.validation_pass_is_approval, false);
  assert.equal(manifest.authority_boundary.validation_failure_is_rejection, false);
  assert.equal(manifest.authority_boundary.ci_pass_is_authority, false);
  assert.equal(manifest.authority_boundary.skipped_checks_are_automatic_failure, false);
  assert.equal(manifest.authority_boundary.known_warnings_are_automatic_rejection, false);
  assert.equal(manifest.authority_boundary.not_done_items_are_automatic_task_creation, false);
}

function assertChangedFileScope() {
  const changedFiles = getChangedFiles();
  assert.ok(changedFiles.length > 0, "changed-file scope must inspect a non-empty delta");
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.ok(!filePath.startsWith("components/"), `No component files allowed: ${filePath}`);
    assert.ok(!filePath.startsWith("app/"), `No app/route files allowed: ${filePath}`);
    assert.ok(!filePath.includes("/migrations/"), `No DB migration files allowed: ${filePath}`);
  }
  for (const requiredPath of newSliceFiles) {
    assert.ok(changedFiles.includes(requiredPath), `changed files must include ${requiredPath}`);
  }
}

function getChangedFiles() {
  const candidates = new Set();
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    const output = execFileSync("git", args, { encoding: "utf8" }).trim();
    for (const filePath of output.split("\n").filter(Boolean)) {
      candidates.add(filePath);
    }
  }
  return Array.from(candidates).sort();
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
