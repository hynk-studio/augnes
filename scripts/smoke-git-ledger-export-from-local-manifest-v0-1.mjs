#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const helperPath = "lib/git-ledger/build-export-packet-from-local-manifest.ts";
const fixturePath = "fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json";
const smokePath = "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs";
const docsPath = "docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const manifestHelperPath = "lib/local-export/build-local-data-export-manifest.ts";
const manifestTypePath = "types/local-data-export-manifest.ts";
const manifestDocsPath = "docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md";
const manifestFixturePath = "fixtures/local-data-export-manifest.sample.v0.1.json";
const manifestSmokePath =
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs";
const policySmokePath = "scripts/smoke-local-data-export-policy-v0-1.mjs";
const proposalSmokePath =
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs";
const handoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const packetSmokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const gitLedgerBuilderPath = "lib/git-ledger/build-export-packet.ts";
const gitLedgerBuilderDocsPath =
  "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const authoritySmokePath = "scripts/smoke-authority-boundary-regression-v0-1.mjs";
const privacyGuardPath = "lib/privacy/redaction-guard.ts";
const reconciliationDocsPath =
  "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";

const fixtureVersion = "git_ledger_export_from_local_manifest.sample.v0.1";
const selectedSlice = "git_ledger_export_manifest_binding_v0_1";
const nextSlice = "selected_runtime_audit_event_store_v0_1";
const builderVersion = "git_ledger_export_manifest_binding.v0.1";
const packetVersion = "git_ledger_packet.v0.1";
const sourceManifestVersion = "local_data_export_manifest_candidate.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:git-ledger-export-from-local-manifest-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs";

const expectedChangedFiles = new Set([
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  manifestSmokePath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  "types/runtime-audit-event.ts",
  "lib/runtime-audit/audit-event-store.ts",
  "fixtures/selected-runtime-audit-event-store.sample.v0.1.json",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md",
]);

const newSliceFiles = [
  "types/runtime-audit-event.ts",
  "lib/runtime-audit/audit-event-store.ts",
  "fixtures/selected-runtime-audit-event-store.sample.v0.1.json",
  "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs",
  "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md",
];

const requiredHelperExports = [
  "buildGitLedgerExportPacketFromLocalManifestV01",
  "buildGitLedgerExportFromLocalManifestV01",
  "createGitLedgerExportFromLocalManifestAuthorityBoundaryV01",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "PR #876 provides local export manifest candidate context.",
  "This slice adds no UI, components, route model changes, or API routes.",
  "Git Ledger export packet is candidate-only.",
  "Git Ledger export packet is not Git commit.",
  "Git Ledger export packet is not Git write approval.",
  "Git Ledger export packet is not GitHub actuation.",
  "Git Ledger export packet is not PR creation.",
  "Suggested commit message is not approval.",
  "Suggested commit intent is not execution approval.",
  "Packet hash is not truth.",
  "Packet hash is not proof.",
  "Packet hash is not approval.",
  "Idempotency key is not approval.",
  "Local data export manifest is candidate-only.",
  "Local data export manifest is not an export file.",
  "Local data export manifest is not import approval.",
  "Manifest fingerprint is not proof.",
  "Manifest status is not product/release readiness.",
  "Import preview is not import apply.",
  "Git refs are references only.",
  "GitHub PR refs are references only.",
  "Validation pass is not approval.",
  "CI pass is not authority.",
  "`selected_runtime_audit_event_store_v0_1`",
];

const forbiddenHelperPatterns = [
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
  /\bexecFile\b|\bspawn\b|\bexecSync\b/,
  /github_api_call_now:\s*true/,
  /git_write_now:\s*true/,
  /branch_created:\s*true/,
  /commit_created:\s*true/,
  /pr_created:\s*true/,
  /release_created:\s*true/,
  /deploy_executed:\s*true/,
  /publish_executed:\s*true/,
  /local_file_written:\s*true/,
  /local_file_read:\s*true/,
  /import_apply_executed:\s*true/,
  /db_read_executed:\s*true/,
  /db_write_executed:\s*true/,
  /provider_called:\s*true/,
  /retrieval_executed:\s*true/,
  /source_fetched:\s*true/,
];

for (const requiredPath of [
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  manifestHelperPath,
  manifestTypePath,
  manifestDocsPath,
  manifestFixturePath,
  manifestSmokePath,
  policySmokePath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  gitLedgerBuilderPath,
  gitLedgerBuilderDocsPath,
  authoritySmokePath,
  privacyGuardPath,
  reconciliationDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const helperText = read(helperPath);
const docsText = read(docsPath);
const indexText = read(indexPath);
const packageJson = JSON.parse(read(packagePath));
const manifestSmokeText = read(manifestSmokePath);
const proposalSmokeText = read(proposalSmokePath);
const handoffSmokeText = read(handoffSmokePath);
const packetSmokeText = read(packetSmokePath);
const codexBindingSmokeText = read(codexBindingSmokePath);
const dogfoodingSmokeText = read(dogfoodingSmokePath);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);
const manifestHelper = await import(
  pathToFileURL(`${process.cwd()}/${manifestHelperPath}`).href
);

assertFixtureAndStaticCoverage();
const safeManifest = buildManifest(fixture.source_manifest_input);
const safeResult = assertValidBinding(safeManifest);
assertDeterminism(safeManifest, safeResult);
assertRedactedWithWarningsBinding();
assertBlockedManifestStatuses(safeManifest);
assertBlockedPrivateMarkers(safeManifest);
assertBlockedAuthorityClaims(safeManifest);
assertAllowedNegatedAuthorityText(safeManifest);
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "git-ledger-export-from-local-manifest-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      packet_hash: safeResult.packet.packet_hash,
      idempotency_key: safeResult.packet.idempotency_key,
      changed_file_scope_checked: true,
    },
    null,
    2,
  ),
);

function assertFixtureAndStaticCoverage() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.selected_slice, selectedSlice);
  assert.equal(fixture.next_recommended_slice, nextSlice);
  assert.equal(fixture.builder_version, builderVersion);
  assert.equal(fixture.packet_version, packetVersion);
  assert.equal(fixture.source_manifest_version, sourceManifestVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
  assert.equal(fixture.post_868_boundary.git_or_github_actuation_in_scope, false);
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
  for (const pattern of forbiddenHelperPatterns) {
    assert.ok(!pattern.test(helperText), `helper must not include ${pattern}`);
  }
  for (const pointer of newSliceFiles) {
    for (const smokeText of [
      manifestSmokeText,
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
}

function assertValidBinding(manifest) {
  const result = helper.buildGitLedgerExportPacketFromLocalManifestV01(
    manifest,
    fixture.supplemental_packet_text,
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "candidate_only");
  assert.equal(result.error_code, null);
  assert.equal(result.packet.packet_version, packetVersion);
  assert.equal(result.packet.builder_version, builderVersion);
  assert.equal(result.packet.scope, scope);
  assert.equal(result.packet.source_manifest_ref, manifest.manifest_id);
  assert.equal(result.packet.source_manifest_fingerprint, manifest.manifest_fingerprint);
  assert.equal(result.packet.source_manifest_status, "candidate_only");
  assert.equal(result.packet.export_profile, "operator_review_bundle");
  assert.equal(result.packet.git_ledger_packet.status, "packet_candidate_created");
  assert.ok(result.packet.packet_hash.length >= 32);
  assert.ok(result.packet.idempotency_key.startsWith("git-ledger-export-builder:v0.1:"));
  assert.equal(result.packet.suggested_commit_intent, fixture.supplemental_packet_text.suggested_commit_intent);
  assert.equal(result.packet.packet_intent, fixture.supplemental_packet_text.packet_intent);
  assert.ok(result.packet.suggested_commit_message.includes("Git Ledger packet is not a commit"));
  assert.ok(!result.packet.suggested_commit_message.includes("approval"));
  assert.ok(result.packet.manifest_item_refs.length > 0);
  assert.ok(result.packet.manifest_item_summaries.length > 0);
  assert.ok(result.packet.lineage_refs.length > 0);
  assert.ok(result.packet.source_summary_refs.includes("source-summary:dogfooding-chain"));
  assert.equal(result.packet.redaction_report.unsafe_raw_values_included, false);
  assertNoExecutionFlags(result);
  assertPacketBoundary(result.packet);
  assert.equal(result.packet.authority_boundary.packet_hash_is_proof, false);
  assert.equal(result.packet.authority_boundary.packet_hash_is_approval, false);
  assert.equal(result.packet.authority_boundary.idempotency_key_is_approval, false);
  assert.equal(result.packet.authority_boundary.suggested_commit_message_is_approval, false);
  assert.equal(result.packet.authority_boundary.suggested_commit_intent_is_execution_approval, false);
  assert.equal(result.packet.authority_boundary.local_data_export_manifest_is_export_file, false);
  assert.equal(result.packet.authority_boundary.manifest_fingerprint_is_proof, false);
  assert.equal(result.packet.authority_boundary.manifest_status_is_release_readiness, false);
  assert.equal(result.packet.authority_boundary.import_preview_is_import_apply, false);
  return result;
}

function assertDeterminism(manifest, firstResult) {
  const repeated = helper.buildGitLedgerExportPacketFromLocalManifestV01(
    manifest,
    fixture.supplemental_packet_text,
  );
  assert.deepEqual(repeated.packet, firstResult.packet);
  assert.equal(repeated.packet.packet_hash, firstResult.packet.packet_hash);
  assert.equal(repeated.packet.idempotency_key, firstResult.packet.idempotency_key);
  const changedIntent = helper.buildGitLedgerExportPacketFromLocalManifestV01(
    manifest,
    {
      ...fixture.supplemental_packet_text,
      packet_intent:
        "Prepare a different text-only packet intent for deterministic variation.",
    },
  );
  assert.equal(changedIntent.ok, true);
  assert.notEqual(changedIntent.packet.packet_id, firstResult.packet.packet_id);
  assert.notEqual(changedIntent.packet.packet_hash, firstResult.packet.packet_hash);
}

function assertRedactedWithWarningsBinding() {
  const redactedManifest = buildManifest(fixture.redacted_manifest_input);
  assert.equal(redactedManifest.manifest_status, "redacted_with_warnings");
  const result = helper.buildGitLedgerExportPacketFromLocalManifestV01(
    redactedManifest,
    fixture.supplemental_packet_text,
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "redacted_with_warnings");
  assert.equal(result.packet.packet_status, "redacted_with_warnings");
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /SAFE_MARKER_OPAQUE_CONNECTOR_ID/);
  assert.doesNotMatch(serialized, /SAFE_MARKER_UPLOADED_FILE_OPAQUE_ID/);
  assert.equal(result.packet.authority_boundary.git_write_now, false);
  assert.equal(result.packet.git_write_executed, false);
}

function assertBlockedManifestStatuses(manifest) {
  for (const status of fixture.blocked_manifest_status_examples) {
    const blocked = { ...manifest, manifest_status: status };
    const result = helper.buildGitLedgerExportPacketFromLocalManifestV01(
      blocked,
      fixture.supplemental_packet_text,
    );
    assert.equal(result.ok, false);
    assert.equal(result.status, status === "rejected" ? "rejected" : status);
    assert.equal(result.packet, null);
    assertNoExecutionFlags(result);
  }
}

function assertBlockedPrivateMarkers(manifest) {
  for (const marker of fixture.blocked_private_marker_cases) {
    const result = helper.buildGitLedgerExportPacketFromLocalManifestV01(
      {
        ...manifest,
        source_summary_refs: [...manifest.source_summary_refs, marker],
      },
      fixture.supplemental_packet_text,
    );
    assert.equal(result.ok, false, `${marker} must be blocked`);
    assert.equal(result.status, "blocked_private_or_raw_payload");
    assert.equal(result.packet, null);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(marker));
  }
}

function assertBlockedAuthorityClaims(manifest) {
  for (const phrase of fixture.blocked_forbidden_authority_string_claim_cases) {
    const result = helper.buildGitLedgerExportPacketFromLocalManifestV01(
      {
        ...manifest,
        source_summary_refs: [...manifest.source_summary_refs, phrase],
      },
      fixture.supplemental_packet_text,
    );
    assert.equal(result.ok, false, `${phrase} must be blocked`);
    assert.equal(result.status, "blocked_forbidden_authority");
    assert.equal(result.packet, null);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(escapeRegExp(phrase), "i"));
  }
  const structured = helper.buildGitLedgerExportPacketFromLocalManifestV01(
    {
      ...manifest,
      authority_boundary: {
        git_write_executed: true,
      },
    },
    fixture.supplemental_packet_text,
  );
  assert.equal(structured.ok, false);
  assert.equal(structured.status, "blocked_forbidden_authority");
  assert.equal(structured.packet, null);
}

function assertAllowedNegatedAuthorityText(manifest) {
  for (const text of fixture.allowed_negated_authority_examples) {
    const result = helper.buildGitLedgerExportPacketFromLocalManifestV01(
      {
        ...manifest,
        source_summary_refs: [...manifest.source_summary_refs, text],
      },
      fixture.supplemental_packet_text,
    );
    assert.equal(result.ok, true, `negated authority text must be allowed: ${text}`);
  }
}

function assertNoExecutionFlags(result) {
  for (const flag of fixture.required_false_execution_flags) {
    assert.equal(result[flag], false, `result flag ${flag} must be false`);
    if (result.packet) {
      assert.equal(result.packet[flag], false, `packet flag ${flag} must be false`);
    }
  }
}

function assertPacketBoundary(packet) {
  for (const field of fixture.required_authority_boundary_false_fields) {
    assert.equal(packet.authority_boundary[field], false, `${field} must be false`);
  }
  assert.equal(packet.git_ledger_packet.authority_boundary.git_write_now, false);
  assert.equal(packet.git_ledger_packet.authority_boundary.github_api_call_now, false);
  assert.equal(packet.git_ledger_packet.authority_boundary.git_commit_now, false);
  assert.equal(packet.git_ledger_packet.authority_boundary.git_branch_now, false);
  assert.equal(packet.git_ledger_packet.authority_boundary.git_tag_now, false);
  assert.equal(packet.git_ledger_packet.authority_boundary.pull_request_creation_now, false);
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

function buildManifest(input) {
  const result = manifestHelper.buildLocalDataExportManifestCandidateV01(input);
  assert.equal(result.ok, true);
  assert.ok(result.manifest);
  return result.manifest;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
