import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { buildLocalDataExportManifestCandidateV01 } from "../lib/local-export/build-local-data-export-manifest";
import {
  buildLocalGitLedgerExportManifestV01,
  isSafeLocalGitLedgerExportOutputDirV01,
  validateLocalGitLedgerExportRequestV01,
  writeLocalGitLedgerExportArtifactsV01,
} from "../lib/git-ledger/local-export";

type JsonRecord = Record<string, unknown>;

const manifestFixture = JSON.parse(
  readFileSync("fixtures/local-data-export-manifest.sample.v0.1.json", "utf8"),
) as JsonRecord;
const localExportFixture = JSON.parse(
  readFileSync("fixtures/local-git-ledger-export.sample.v0.1.json", "utf8"),
) as JsonRecord;

let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("portable-export tests must not make network calls");
};

try {
  const multiCategoryInput = manifestFixture.safe_multi_category_input as Parameters<
    typeof buildLocalDataExportManifestCandidateV01
  >[0];
  const first = buildLocalDataExportManifestCandidateV01(multiCategoryInput);
  const replay = buildLocalDataExportManifestCandidateV01(multiCategoryInput);

  assert.equal(first.ok, true);
  assert.equal(first.status, "candidate_only");
  assert.deepEqual(replay, first, "portable manifest candidates are deterministic");
  const firstManifest = first.manifest;
  assert.ok(firstManifest, "successful candidate build returns a manifest");
  assert.equal(firstManifest.scope, "project:augnes");
  assert.equal(firstManifest.export_file_written, false);
  assert.equal(firstManifest.import_apply_executed, false);
  assert.equal(firstManifest.authority_boundary.local_data_export_manifest_is_export_file, false);
  assert.equal(firstManifest.authority_boundary.local_data_export_manifest_is_import_approval, false);
  for (const item of firstManifest.export_item_summaries) {
    assert.equal(item.raw_data_included, false);
    assert.equal(item.canonical_source_body_included, false);
    assert.equal(item.proof_or_evidence_created, false);
  }

  const dryRunRequest = localExportFixture.safe_dry_run_request_example as JsonRecord;
  const validation = validateLocalGitLedgerExportRequestV01(dryRunRequest);
  const manifest = buildLocalGitLedgerExportManifestV01(dryRunRequest);
  const repeatedManifest = buildLocalGitLedgerExportManifestV01(dryRunRequest);

  assert.equal(validation.passed, true);
  assert.equal(validation.status, "dry_run_manifest_created");
  assert.deepEqual(repeatedManifest, manifest, "export manifests are deterministic");
  assert.equal(manifest.scope, "project:augnes");
  assert.equal(manifest.authority_boundary.local_file_export_now, false);
  assert.equal(manifest.authority_boundary.dry_run_manifest_only, true);

  const dryRunOutput = ".tmp/git-ledger-export/canonical-portable-dry-run";
  assert.equal(existsSync(dryRunOutput), false);
  const dryRunResult = writeLocalGitLedgerExportArtifactsV01({
    ...dryRunRequest,
    output_dir: dryRunOutput,
    dry_run: true,
  });
  assert.equal(dryRunResult.written, false);
  assert.deepEqual(dryRunResult.artifact_paths, []);
  assert.equal(existsSync(dryRunOutput), false, "dry-run creates no repository artifact");

  const foreignProject = validateLocalGitLedgerExportRequestV01({
    ...dryRunRequest,
    scope: "project:foreign",
  });
  assert.equal(foreignProject.passed, false, "foreign project scope fails closed");
  assert.notEqual(foreignProject.status, "dry_run_manifest_created");

  assert.equal(isSafeLocalGitLedgerExportOutputDirV01("tmp/git-ledger-export/example"), true);
  assert.equal(isSafeLocalGitLedgerExportOutputDirV01("/tmp/escape"), false);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        test: "portable-export-foundations",
        status: "pass",
        deterministic_manifest: true,
        project_scope_refusal: true,
        dry_run_writes: 0,
        network_calls: fetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
}
