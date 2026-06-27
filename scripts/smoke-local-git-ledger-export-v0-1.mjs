#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";

const docsPath = "docs/LOCAL_GIT_LEDGER_EXPORT_V0_1.md";
const libPath = "lib/git-ledger/local-export.ts";
const fixturePath = "fixtures/local-git-ledger-export.sample.v0.1.json";
const smokePath = "scripts/smoke-local-git-ledger-export-v0-1.mjs";
const contractDocsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const contractTypesPath = "types/git-ledger-export-contract.ts";
const contractSmokePath = "scripts/smoke-git-ledger-export-contract-v0-1.mjs";
const builderDocsPath = "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const builderPath = "lib/git-ledger/build-export-packet.ts";
const builderSmokePath = "scripts/smoke-git-ledger-export-builder-v0-1.mjs";
const readonlyDocsPath = "docs/GIT_LEDGER_EXPORT_READONLY_PREVIEW_V0_1.md";
const readonlyComponentPath = "components/git-ledger-export-readonly-preview-panel.tsx";
const readonlySmokePath = "scripts/smoke-git-ledger-export-readonly-preview-v0-1.mjs";
const privacyDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const localDataPolicyDocsPath = "docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md";
const authorityBoundaryDocsPath = "docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const fixtureVersion = "local_git_ledger_export.sample.v0.1";
const requestVersion = "local_git_ledger_export_request.v0.1";
const exportVersion = "local_git_ledger_export.v0.1";
const builderVersion = "git_ledger_export_builder.v0.1";
const contractVersion = "git_ledger_export_contract.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:local-git-ledger-export-v0-1";
const packageScriptValue = "node scripts/smoke-local-git-ledger-export-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  libPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const expectedArtifactNames = [
  "packet.json",
  "summary.md",
  "source-refs.json",
  "evidence-refs.json",
  "candidate-refs.json",
  "privacy-report.json",
  "suggested-commit-message.txt",
  "authority-boundary.json",
  "manifest.json",
];

const requiredExports = [
  "validateLocalGitLedgerExportRequestV01",
  "buildLocalGitLedgerExportManifestV01",
  "writeLocalGitLedgerExportArtifactsV01",
  "createLocalGitLedgerExportManifestHashV01",
  "createLocalGitLedgerExportAuthorityBoundaryV01",
  "isSafeLocalGitLedgerExportOutputDirV01",
];

const authorityAlwaysTrueFields = [
  "local_git_ledger_export_helper_now",
  "caller_provided_packet_only",
  "allowlisted_local_output_dir_only",
  "deterministic_artifact_manifest_now",
];

const authorityFalseFields = [
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "github_merge_now",
  "repository_file_write_now",
  "local_file_import_now",
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
  "export_import_runtime_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_now",
  "product_id_allocation_now",
  "product_write_authority",
  "exported_packet_is_commit",
  "exported_packet_is_truth",
  "exported_packet_is_proof",
  "exported_packet_is_accepted_evidence",
  "exported_packet_is_durable_state",
  "exported_packet_is_promotion",
  "exported_packet_is_product_write",
  "suggested_commit_message_is_approval",
  "manifest_hash_is_truth",
  "artifact_hash_is_authority",
  "git_ref_is_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredReasonCodes = [
  "roadmap_file_present",
  "contract_ref_present",
  "builder_ref_present",
  "readonly_preview_ref_present",
  "privacy_guard_required",
  "local_export_request_validated",
  "dry_run_manifest_created",
  "local_export_written",
  "allowlisted_output_dir_confirmed",
  "deterministic_artifact_manifest_created",
  "packet_artifact_written",
  "summary_markdown_artifact_written",
  "source_refs_artifact_written",
  "evidence_refs_artifact_written",
  "candidate_refs_artifact_written",
  "privacy_report_artifact_written",
  "suggested_commit_message_artifact_written",
  "authority_boundary_artifact_written",
  "manifest_artifact_written",
  "public_safe_summary_only",
  "raw_private_payload_blocked",
  "raw_source_body_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "raw_db_row_blocked",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "provider_thread_run_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "raw_diff_blocked",
  "unsafe_output_dir_blocked",
  "git_export_runtime_not_implemented",
  "git_write_not_executed",
  "git_commit_not_created",
  "git_branch_not_created",
  "git_tag_not_created",
  "github_api_not_called",
  "pull_request_not_created",
  "repository_file_not_written",
  "db_write_not_executed",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "local_import_not_executed",
  "codex_not_executed",
  "product_write_denied",
  "product_write_not_executed",
  "product_id_allocation_not_executed",
  "exported_packet_is_not_commit",
  "exported_packet_is_not_truth",
  "exported_packet_is_not_proof",
  "exported_packet_is_not_accepted_evidence",
  "exported_packet_is_not_durable_state",
  "exported_packet_is_not_promotion",
  "exported_packet_is_not_product_write",
  "suggested_commit_message_not_approval",
  "manifest_hash_not_truth",
  "artifact_hash_not_authority",
  "git_ref_not_authority",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Git Ledger Export Contract v0.1",
  "## Relationship to Git Ledger Export Deterministic Builder v0.1",
  "## Relationship to Git Ledger Export Readonly Preview v0.1",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Local Data Export/Import Policy",
  "## Relationship to Authority Boundary Regression CI",
  "## Export Request Contract",
  "## Allowlisted Output Directory Policy",
  "## Artifact Layout",
  "## Dry-Run Policy",
  "## Write Mode Policy",
  "## Deterministic Manifest/Hash Policy",
  "## Suggested Commit Message Artifact Policy",
  "## Privacy/Redaction Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const requiredDocsPhrases = [
  "This slice writes local export artifacts only to allowlisted output directories.",
  "This slice does not execute Git.",
  "This slice does not execute Git Ledger export runtime beyond local artifact writing.",
  "This slice does not create commits, branches, tags, PRs, or merges.",
  "This slice does not call GitHub.",
  "This slice does not write repository source files.",
  "This slice does not export outside `tmp/git-ledger-export/` or `.tmp/git-ledger-export/`.",
  "This slice does not import files.",
  "This slice does not query/write DB.",
  "This slice does not add routes or UI.",
  "This slice does not call providers.",
  "This slice does not send prompts.",
  "This slice does not fetch sources.",
  "This slice does not execute retrieval/RAG.",
  "This slice does not create proof/evidence.",
  "This slice does not write claim/evidence records.",
  "This slice does not promote Perspective.",
  "This slice does not write/apply durable Perspective state.",
  "This slice does not write Formation Receipts.",
  "This slice does not execute Codex.",
  "This slice does not product-write or allocate product IDs.",
  "Symlink output directories are rejected.",
  "Symlink artifact paths are rejected.",
  "Real/canonical paths are checked before writing.",
  "Artifact hashes are actual artifact content hashes.",
  "Suggested commit message artifact is not approval.",
  "Manifest hash is not truth.",
  "Artifact hash is not authority.",
  "Git ref is not authority.",
  "Exported packet is not commit, not proof, not accepted evidence, not durable state, not promotion, and not product-write.",
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const safeFixtureMarkers = [
  "SAFE_MARKER_PRIVATE_URL",
  "SAFE_MARKER_LOCAL_PRIVATE_PATH",
  "SAFE_MARKER_SECRET_TOKEN",
  "SAFE_MARKER_RAW_SOURCE_BODY",
  "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
  "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
  "SAFE_MARKER_RAW_DB_ROW",
  "SAFE_MARKER_PROVIDER_THREAD_ID",
  "SAFE_MARKER_RAW_CONVERSATION",
  "SAFE_MARKER_HIDDEN_REASONING",
  "SAFE_MARKER_RAW_DIFF",
];

const liveLookingPrivatePatterns = [
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /\bghp_[A-Za-z0-9_]{8,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bOPENAI_API_KEY\s*=\s*[^\s]+/,
  /\bGITHUB_TOKEN\s*=\s*[^\s]+/,
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|10\.|172\.(?:1[6-9]|2\d|3[0-1])\.|192\.168\.)/i,
  /\/Users\//,
  /\/home\//,
  /\b(?:thread|run|session|resp|file)_[A-Za-z0-9]{16,}\b/,
];

for (const requiredPath of [
  ...expectedSliceFiles,
  contractDocsPath,
  contractTypesPath,
  contractSmokePath,
  builderDocsPath,
  builderPath,
  builderSmokePath,
  readonlyDocsPath,
  readonlyComponentPath,
  readonlySmokePath,
  privacyDocsPath,
  localDataPolicyDocsPath,
  authorityBoundaryDocsPath,
  roadmapPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docs = read(docsPath);
const libSource = read(libPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const smokeSource = read(smokePath);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);
const builderSource = read(builderPath);
const readonlyDocs = read(readonlyDocsPath);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.export_version, exportVersion);
assert.equal(fixture.builder_version, builderVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, scope);
assert.ok(
  roadmap.includes("local_git_ledger_export_v0_1"),
  "roadmap must contain local_git_ledger_export_v0_1",
);
assert.ok(builderSource.includes("buildGitLedgerExportPacketV01"));
assert.ok(readonlyDocs.includes("Git Ledger Export Readonly Preview v0.1"));
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-builder-v0-1"],
  "node scripts/smoke-git-ledger-export-builder-v0-1.mjs",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-readonly-preview-v0-1"],
  "node scripts/smoke-git-ledger-export-readonly-preview-v0-1.mjs",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-contract-v0-1"],
  "node scripts/smoke-git-ledger-export-contract-v0-1.mjs",
);

for (const pointer of [docsPath, libPath, fixturePath, smokePath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}
assert.ok(index.includes("Product-write remains parked by #686."));

for (const section of requiredDocsSections) {
  assert.ok(docs.includes(section), `docs must include section ${section}`);
}
for (const phrase of requiredDocsPhrases) {
  assert.ok(includesNormalized(docs, phrase), `docs must include phrase: ${phrase}`);
}
assert.ok(docs.includes("Privacy Redaction Runtime Guard v0.1 remains required."));
assert.ok(docs.includes("Local Data Export/Import Policy v0.1 remains"));
assert.ok(docs.includes("Authority Boundary Regression CI v0.1 remains diagnostic only."));

for (const exportedName of requiredExports) {
  assert.ok(
    libSource.includes(`export function ${exportedName}`),
    `library must export ${exportedName}`,
  );
}
for (const reasonCode of requiredReasonCodes) {
  assert.ok(libSource.includes(`"${reasonCode}"`), `library must include ${reasonCode}`);
}

const helper = await importLocalExportHelper();
for (const exportedName of requiredExports) {
  assert.equal(typeof helper[exportedName], "function", `${exportedName} must be callable`);
}

assert.deepEqual(fixture.expected_artifact_names, expectedArtifactNames);
assert.deepEqual(helper.LocalGitLedgerExportArtifactNamesV01, expectedArtifactNames);
assertSafeOutputDirPolicy(helper);

const dryValidation = helper.validateLocalGitLedgerExportRequestV01(
  fixture.safe_dry_run_request_example,
);
const dryManifest = helper.buildLocalGitLedgerExportManifestV01(
  fixture.safe_dry_run_request_example,
);
assert.equal(dryValidation.status, "dry_run_manifest_created");
assert.equal(dryValidation.passed, true);
assert.deepEqual(dryManifest, fixture.safe_dry_run_manifest_example);
assert.equal(
  helper.createLocalGitLedgerExportManifestHashV01(dryManifest),
  dryManifest.manifest_hash,
);
assertAuthorityBoundary(dryManifest.authority_boundary, "dry manifest", "dry_run");

const writeValidation = helper.validateLocalGitLedgerExportRequestV01(
  fixture.safe_write_request_example,
);
const writeManifest = helper.buildLocalGitLedgerExportManifestV01(
  fixture.safe_write_request_example,
);
assert.equal(writeValidation.status, "local_export_written");
assert.equal(writeValidation.passed, true);
assert.deepEqual(writeManifest, fixture.safe_write_manifest_example);
assert.equal(
  helper.createLocalGitLedgerExportManifestHashV01(writeManifest),
  writeManifest.manifest_hash,
);
assertAuthorityBoundary(writeManifest.authority_boundary, "write manifest", "write");
assertAuthorityBoundary(fixture.authority_boundary_sample, "authority sample", "write");

assert.equal(
  helper.buildLocalGitLedgerExportManifestV01(fixture.safe_dry_run_request_example)
    .manifest_hash,
  fixture.deterministic_manifest_hash_repeatability_example.repeated_dry_run_manifest_hash,
);
assert.equal(
  helper.buildLocalGitLedgerExportManifestV01(fixture.safe_write_request_example)
    .manifest_hash,
  fixture.deterministic_manifest_hash_repeatability_example.repeated_write_manifest_hash,
);

assertDryRunDoesNotWrite(helper);
assertWriteModeArtifacts(helper);
const symlinkEscapeProtection = assertSymlinkEscapeProtection(helper);
assertBlockedExample(helper, fixture.blocked_unsafe_output_dir_example, "blocked_unsafe_output_dir");
assertBlockedExample(
  helper,
  fixture.blocked_private_or_raw_payload_example,
  "blocked_private_or_raw_payload",
);
assertBlockedExample(
  helper,
  fixture.blocked_forbidden_authority_example,
  "blocked_forbidden_authority",
);
assertBlockedExample(helper, fixture.blocked_invalid_packet_example, "blocked_invalid_packet");
assertSafeMarkerUse();
assertNoLiveLookingPrivateExamples();
assertNarrowSliceFileScope();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "local-git-ledger-export-v0-1",
      export_version: exportVersion,
      dry_run_manifest_hash: dryManifest.manifest_hash,
      write_manifest_hash: writeManifest.manifest_hash,
      artifact_count: expectedArtifactNames.length,
      symlink_escape_protection: symlinkEscapeProtection,
    },
    null,
    2,
  ),
);

function assertSafeOutputDirPolicy(helperModule) {
  for (const safePath of [
    "tmp/git-ledger-export/sample-export",
    ".tmp/git-ledger-export/sample-export",
  ]) {
    assert.equal(helperModule.isSafeLocalGitLedgerExportOutputDirV01(safePath), true);
  }
  for (const unsafePath of [
    "/tmp/git-ledger-export/sample-export",
    "tmp/git-ledger-export/../escape",
    "tmp\\git-ledger-export\\sample",
    "docs/git-ledger-export/sample",
    "lib/git-ledger-export/sample",
    "https://example.invalid/export",
    "file:///tmp/git-ledger-export/sample",
  ]) {
    assert.equal(helperModule.isSafeLocalGitLedgerExportOutputDirV01(unsafePath), false);
  }
}

function assertDryRunDoesNotWrite(helperModule) {
  const outputDir = ".tmp/git-ledger-export/smoke-local-git-ledger-export-dry-run";
  rmSync(outputDir, { recursive: true, force: true });
  const request = {
    ...fixture.safe_dry_run_request_example,
    export_id: "local-git-ledger-export:smoke-dry-run",
    output_dir: outputDir,
    dry_run: true,
  };
  const result = helperModule.writeLocalGitLedgerExportArtifactsV01(request);
  assert.equal(result.status, "dry_run_manifest_created");
  assert.equal(result.written, false);
  assert.deepEqual(result.artifact_paths, []);
  assert.equal(existsSync(outputDir), false, "dry-run must not create output dir");
}

function assertWriteModeArtifacts(helperModule) {
  const outputDir = ".tmp/git-ledger-export/smoke-local-git-ledger-export-v0-1";
  rmSync(outputDir, { recursive: true, force: true });
  try {
    const request = {
      ...fixture.safe_write_request_example,
      export_id: "local-git-ledger-export:smoke-write",
      output_dir: outputDir,
      dry_run: false,
    };
    const first = helperModule.writeLocalGitLedgerExportArtifactsV01(request);
    assert.equal(first.status, "local_export_written");
    assert.equal(first.written, true);
    assertAuthorityBoundary(first.manifest.authority_boundary, "write result", "write");

    const files = readdirSync(outputDir).sort();
    assert.deepEqual(files, [...expectedArtifactNames].sort());
    assert.deepEqual(first.artifact_names, expectedArtifactNames);
    assert.deepEqual(
      first.artifact_paths.sort(),
      expectedArtifactNames.map((name) => path.posix.join(outputDir, name)).sort(),
    );

    const firstContents = readArtifacts(outputDir);
    assert.equal(firstContents["summary.md"], `${request.summary_markdown}\n`);
    assert.equal(
      firstContents["suggested-commit-message.txt"],
      `${request.suggested_commit_message}\n`,
    );
    assert.equal(
      JSON.parse(firstContents["manifest.json"]).manifest_hash,
      first.manifest.manifest_hash,
    );
    for (const artifactName of expectedArtifactNames) {
      assert.ok(firstContents[artifactName].length > 0, `${artifactName} must be non-empty`);
      assert.ok(
        !firstContents[artifactName].includes("SAFE_MARKER_"),
        `${artifactName} must not echo unsafe fixture markers`,
      );
      if (artifactName.endsWith(".json")) {
        JSON.parse(firstContents[artifactName]);
      }
    }
    for (const artifactName of expectedArtifactNames) {
      assert.equal(
        sha256Text(firstContents[artifactName]),
        first.manifest.artifact_hashes[artifactName],
        `${artifactName} hash must match content`,
      );
    }
    const manifestArtifact = JSON.parse(firstContents["manifest.json"]);
    assert.equal(
      manifestArtifact.artifact_hashes["manifest.json"],
      undefined,
      "written manifest artifact omits its own self-hash",
    );
    assert.equal(
      first.manifest.artifact_hashes["manifest.json"],
      sha256Text(firstContents["manifest.json"]),
      "returned manifest hash for manifest.json must match written manifest content",
    );

    const second = helperModule.writeLocalGitLedgerExportArtifactsV01(request);
    const secondContents = readArtifacts(outputDir);
    assert.equal(second.manifest.manifest_hash, first.manifest.manifest_hash);
    assert.deepEqual(second.manifest.artifact_hashes, first.manifest.artifact_hashes);
    assert.deepEqual(secondContents, firstContents);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

function assertSymlinkEscapeProtection(helperModule) {
  const rootDir = ".tmp/git-ledger-export";
  const outsideDir = ".tmp/local-git-ledger-export-symlink-target";
  const outputSymlinkDir = `${rootDir}/smoke-symlink-output-dir`;
  const artifactSymlinkDir = `${rootDir}/smoke-artifact-symlink-dir`;
  const outsideFile = ".tmp/local-git-ledger-export-outside-file.txt";
  rmSync(outputSymlinkDir, { recursive: true, force: true });
  rmSync(artifactSymlinkDir, { recursive: true, force: true });
  rmSync(outsideDir, { recursive: true, force: true });
  rmSync(outsideFile, { force: true });
  mkdirSync(rootDir, { recursive: true });
  mkdirSync(outsideDir, { recursive: true });
  try {
    try {
      symlinkSync("../local-git-ledger-export-symlink-target", outputSymlinkDir, "dir");
    } catch (error) {
      const reason = `symlink creation unavailable: ${String(error?.code ?? error?.name ?? "unknown")}`;
      console.warn(
        JSON.stringify(
          {
            ok: true,
            smoke: "local-git-ledger-export-v0-1",
            symlink_escape_tests_skipped: true,
            reason,
          },
          null,
          2,
        ),
      );
      return `skipped:${reason}`;
    }

    const symlinkOutputResult = helperModule.writeLocalGitLedgerExportArtifactsV01({
      ...fixture.safe_write_request_example,
      export_id: "local-git-ledger-export:smoke-symlink-output-dir",
      output_dir: outputSymlinkDir,
      dry_run: false,
    });
    assert.equal(symlinkOutputResult.status, "blocked_unsafe_output_dir");
    assert.equal(symlinkOutputResult.written, false);
    assert.deepEqual(symlinkOutputResult.artifact_paths, []);
    assert.deepEqual(
      readdirSync(outsideDir),
      [],
      "symlink output target must not receive artifacts",
    );

    mkdirSync(artifactSymlinkDir, { recursive: true });
    writeFileSync(outsideFile, "outside-file-original\n", "utf8");
    try {
      symlinkSync(
        "../../local-git-ledger-export-outside-file.txt",
        path.join(artifactSymlinkDir, "packet.json"),
        "file",
      );
    } catch (error) {
      const reason = `artifact symlink creation unavailable: ${String(error?.code ?? error?.name ?? "unknown")}`;
      console.warn(
        JSON.stringify(
          {
            ok: true,
            smoke: "local-git-ledger-export-v0-1",
            artifact_symlink_escape_test_skipped: true,
            reason,
          },
          null,
          2,
        ),
      );
      return `partial:${reason}`;
    }

    const artifactSymlinkResult = helperModule.writeLocalGitLedgerExportArtifactsV01({
      ...fixture.safe_write_request_example,
      export_id: "local-git-ledger-export:smoke-artifact-symlink",
      output_dir: artifactSymlinkDir,
      dry_run: false,
    });
    assert.equal(artifactSymlinkResult.status, "blocked_unsafe_output_dir");
    assert.equal(artifactSymlinkResult.written, false);
    assert.deepEqual(artifactSymlinkResult.artifact_paths, []);
    assert.equal(
      readFileSync(outsideFile, "utf8"),
      "outside-file-original\n",
      "artifact symlink target must not be modified",
    );
    assert.deepEqual(
      readdirSync(artifactSymlinkDir).sort(),
      ["packet.json"],
      "artifact symlink preflight must block before writing any other artifact",
    );
    return "passed";
  } finally {
    rmSync(outputSymlinkDir, { recursive: true, force: true });
    rmSync(artifactSymlinkDir, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
    rmSync(outsideFile, { force: true });
  }
}

function assertBlockedExample(helperModule, example, expectedStatus) {
  const validation = helperModule.validateLocalGitLedgerExportRequestV01(example.input);
  const manifest = helperModule.buildLocalGitLedgerExportManifestV01(example.input);
  const writeResult = helperModule.writeLocalGitLedgerExportArtifactsV01(example.input);
  assert.equal(example.expected_status, expectedStatus);
  assert.equal(validation.status, expectedStatus);
  assert.equal(validation.passed, false);
  assert.equal(manifest.status, expectedStatus);
  assert.equal(writeResult.status, expectedStatus);
  assert.equal(writeResult.written, false);
  assert.ok(validation.findings.length > 0, `${expectedStatus} must produce findings`);
  assertNoUnsafeEchoInObject(manifest);
  assertNoUnsafeEchoInObject(validation);
}

function assertNoUnsafeEchoInObject(value) {
  const serialized = JSON.stringify(value);
  for (const marker of safeFixtureMarkers) {
    assert.ok(!serialized.includes(marker), `output must not echo ${marker}`);
  }
}

function assertAuthorityBoundary(boundary, label, mode) {
  assert.ok(boundary && typeof boundary === "object", `${label} must be object`);
  for (const field of authorityAlwaysTrueFields) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  assert.equal(boundary.local_file_export_now, mode === "write", `${label}.local_file_export_now`);
  assert.equal(boundary.dry_run_manifest_only, mode === "dry_run", `${label}.dry_run_manifest_only`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertSafeMarkerUse() {
  collectStringPaths(fixture, "$", (value, pathLabel) => {
    const matches = value.match(/\bSAFE_MARKER_[A-Z0-9_]+\b/g) ?? [];
    for (const marker of matches) {
      assert.ok(safeFixtureMarkers.includes(marker), `fixture marker ${marker} must be allowed`);
      assert.ok(
        pathLabel.startsWith(
          "$.blocked_private_or_raw_payload_example.input.blocked_fixture_markers",
        ),
        `safe marker ${marker} must appear only inside blocked private/raw marker input`,
      );
    }
  });
}

function assertNoLiveLookingPrivateExamples() {
  const sources = [
    [docsPath, docs],
    [libPath, libSource],
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

function assertNarrowSliceFileScope() {
  for (const expectedPath of expectedSliceFiles) {
    assert.ok(existsSync(expectedPath), `expected slice file must exist: ${expectedPath}`);
  }
  const unexpected = [];
  for (const filePath of walk(".")) {
    const normalized = filePath.replaceAll(path.sep, "/");
    if (/local[-_]git[-_]ledger[-_]export/i.test(normalized) && !expectedSliceFiles.includes(normalized)) {
      unexpected.push(normalized);
    }
    assert.ok(
      !/(^|\/)app\/api\/.*local[-_]git[-_]ledger[-_]export/i.test(normalized),
      `slice must not add route file ${normalized}`,
    );
    assert.ok(
      !/(^|\/)components\/.*local[-_]git[-_]ledger[-_]export/i.test(normalized),
      `slice must not add UI component ${normalized}`,
    );
    assert.ok(
      !/(^|\/)(?:db|migrations)\/.*local[-_]git[-_]ledger[-_]export/i.test(normalized),
      `slice must not add DB file ${normalized}`,
    );
    assert.ok(
      !/(provider|retrieval|github|codex-execution|product-write|product-id|import).*local[-_]git[-_]ledger[-_]export/i.test(
        normalized,
      ),
      `slice must not add runtime capability file ${normalized}`,
    );
  }
  assert.deepEqual(unexpected.sort(), [], "local Git Ledger export files must stay expected");
}

async function importLocalExportHelper() {
  const stripped = stripTypeScriptTypes(libSource, { mode: "strip" });
  return import(`data:text/javascript;base64,${Buffer.from(stripped).toString("base64")}`);
}

function readArtifacts(outputDir) {
  return Object.fromEntries(
    expectedArtifactNames.map((artifactName) => [
      artifactName,
      readFileSync(path.join(outputDir, artifactName), "utf8"),
    ]),
  );
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
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

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function walk(root) {
  const paths = [];
  for (const entry of readdirSync(root)) {
    const fullPath = path.join(root, entry);
    const normalized = fullPath.replaceAll(path.sep, "/");
    if (
      /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo|tmp|\.tmp)$/.test(
        normalized,
      )
    ) {
      continue;
    }
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      paths.push(...walk(fullPath));
    } else {
      paths.push(normalized.replace(/^\.\//, ""));
    }
  }
  return paths;
}
