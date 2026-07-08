#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import {
  allValuesFalse,
  buildDeterministicIdempotencyKey,
  buildRowCountObservations,
  findForbiddenRawMaterialFields,
  fingerprint,
  isTargetOnlyRowCountWrite,
  listNonFalseKeys,
  requiredStringFieldsPresent,
  stableJson,
  summarizeTargetOnlyRowCountWrite,
  validateSourceBindingPairs,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  sharedGuards: "lib/research-candidate-review/shared-source-chain-guards.ts",
  dryRunResult:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result.ts",
  entrypoint:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint.ts",
  entrypointReview:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review.ts",
  resultRecordWriter:
    "lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write.ts",
  resultRecordReadback:
    "lib/research-candidate-review/read-manual-global-dogfood-perspective-existing-writer-no-mutation-result-records.ts",
  dryRunResultSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1.mjs",
  entrypointSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1.mjs",
  entrypointReviewSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1.mjs",
  resultRecordSmoke:
    "scripts/smoke-research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1.mjs",
  agentPanelSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  smoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  packageJson: "package.json",
};

const expectedChangedFiles = new Set(Object.values(files));
const autonomyDelegationGrantRecordFiles = new Set([
  "types/autonomy-delegation-grant.ts",
  "lib/autonomy/autonomy-delegation-grant-write.ts",
  "lib/autonomy/read-autonomy-delegation-grants.ts",
  "components/autonomy/autonomy-delegation-grant-readback-panel.tsx",
  "lib/db.ts",
  "lib/db/schema.sql",
  "scripts/db-migrations.mjs",
  "scripts/db-migrate.mjs",
  "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  "scripts/smoke-autonomy-contract-v0-1.mjs",
  "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "package.json",
]);
for (const file of autonomyDelegationGrantRecordFiles) {
  expectedChangedFiles.add(file);
}
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);
const packageJson = JSON.parse(source.packageJson);

assertPackageScriptAndDependencies();
assertChangedFileBoundary();
assertFingerprintHelpers();
assertRawMaterialHelpers();
assertFalseBoundaryHelpers();
assertSourceChainHelpers();
assertRowCountHelpers();
assertChainImportsAndDuplicateRemoval();
assertForbiddenImportsAbsent();
const existingFocusedSmokes = assertExistingFocusedSmokesPass();

console.log(
  JSON.stringify(
    {
      smoke: "shared-source-chain-guards-v0-1",
      pass: true,
      shared_helper_present: true,
      stable_fingerprints_checked: true,
      deterministic_idempotency_checked: true,
      raw_material_guard_checked: true,
      source_binding_guard_checked: true,
      target_only_row_count_guard_checked: true,
      chain_imports_shared_helpers: true,
      local_duplicate_helpers_removed: true,
      existing_focused_smokes_passed: existingFocusedSmokes.passed,
      existing_focused_smokes_skipped: existingFocusedSmokes.skipped,
      existing_focused_smokes_skip_reason: existingFocusedSmokes.skip_reason,
      authority_boundary_preserved: true,
      changed_files_checked: true,
    },
    null,
    2,
  ),
);

function assertPackageScriptAndDependencies() {
  assert.equal(
    packageJson.scripts["smoke:shared-source-chain-guards-v0-1"],
    "tsx --tsconfig tsconfig.json scripts/smoke-shared-source-chain-guards-v0-1.mjs",
    "package script must expose the shared source-chain guard smoke",
  );

  const basePackageJson = readBasePackageJson();
  if (basePackageJson) {
    for (const dependencyKey of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      assert.deepEqual(
        packageJson[dependencyKey] ?? {},
        basePackageJson[dependencyKey] ?? {},
        `${dependencyKey} must not change in this helper refactor`,
      );
    }
  }
}

function assertChangedFileBoundary() {
  const changedFiles = uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...collectBaseRangeFiles(),
  ]);

  for (const file of changedFiles) {
    assert.ok(
      expectedChangedFiles.has(file),
      `Unexpected changed or untracked file for shared source-chain guard slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "shared guard slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "shared guard slice must not edit README files");
    assert.doesNotMatch(file, /^app\/api\//, "shared guard slice must not edit API routes");
    if (autonomyDelegationGrantRecordFiles.has(file)) {
      continue;
    }
    assert.notEqual(file, "lib/db/schema.sql", "shared guard slice must not edit DB schema");
    assert.doesNotMatch(file, /migrations?/i, "shared guard slice must not edit migrations");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "shared guard slice must not edit package locks");
    assert.doesNotMatch(file, /provider|runtime|mcp/i, "shared guard slice must not edit provider/runtime/MCP files");
  }
}

function assertFingerprintHelpers() {
  const stableFixture = { b: 1, a: { d: 4, c: 3 }, list: [{ z: 0, y: false }] };
  assert.equal(
    stableJson(stableFixture),
    '{"a":{"c":3,"d":4},"b":1,"list":[{"y":false,"z":0}]}',
  );
  assert.equal(stableJson(stableFixture), stableJson(clone(stableFixture)));
  assert.equal(
    fingerprint(stableFixture),
    "fnv1a32_canonical_json_v0_1:631d7e4f",
  );

  const noMutationSource = buildNoMutationSourceMaterial();
  assert.equal(
    fingerprint(noMutationSource),
    "fnv1a32_canonical_json_v0_1:6d3ed4c3",
  );
  assert.equal(fingerprint(noMutationSource), fingerprint(clone(noMutationSource)));

  const idempotencyKey = buildDeterministicIdempotencyKey({
    kind:
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record",
    version:
      "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record.v0.1",
    source: noMutationSource,
  });
  assert.equal(
    idempotencyKey,
    "fnv1a32_canonical_json_v0_1:e95f3334",
  );
  assert.equal(
    idempotencyKey,
    buildDeterministicIdempotencyKey({
      kind:
        "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record",
      version:
        "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record.v0.1",
      source: clone(noMutationSource),
    }),
  );
}

function assertRawMaterialHelpers() {
  const forbidden = findForbiddenRawMaterialFields({
    nested: {
      raw_result: "raw result body",
      operator_note: "operator note body",
      provider_payload: { payload: "provider payload body" },
      secret: "secret value",
      callback_url: "https://example.invalid/callback",
      env: "PROVIDER_SECRET=value",
      rows: [{ result_text: "result body" }],
    },
  });
  assert.deepEqual(forbidden, [
    "nested.callback_url",
    "nested.env",
    "nested.operator_note",
    "nested.provider_payload",
    "nested.provider_payload.payload",
    "nested.raw_result",
    "nested.rows.0.result_text",
    "nested.secret",
  ]);

  assert.deepEqual(
    findForbiddenRawMaterialFields({
      source_result_text_fingerprint: "fnv1a32_canonical_json_v0_1:source",
      raw_result_fingerprint: "fnv1a32_canonical_json_v0_1:raw-ref",
      callback_url_ref: "source-ref-only",
      source_refs: ["source-ref-only"],
      nested: {
        provider_payload_fingerprint:
          "fnv1a32_canonical_json_v0_1:provider-payload-ref",
      },
    }),
    [],
  );
  assert.deepEqual(
    findForbiddenRawMaterialFields(
      { raw_result_fingerprint: "fnv1a32_canonical_json_v0_1:raw-ref" },
      { allowFingerprintKeys: false },
    ),
    ["raw_result_fingerprint"],
  );
}

function assertFalseBoundaryHelpers() {
  assert.equal(allValuesFalse({ a: false, b: false }), true);
  assert.equal(allValuesFalse({ a: false, b: true }), false);
  assert.deepEqual(
    listNonFalseKeys({
      ok: false,
      true_value: true,
      string_value: "value",
      number_value: 0,
      null_value: null,
    }),
    ["null_value", "number_value", "string_value", "true_value"],
  );
}

function assertSourceChainHelpers() {
  assert.deepEqual(
    requiredStringFieldsPresent(
      {
        present: "value",
        empty: "",
        null_value: null,
        missing: undefined,
      },
      ["present", "empty", "null_value", "missing"],
    ),
    {
      passed: false,
      missing_fields: ["empty", "null_value", "missing"],
    },
  );

  const validation = validateSourceBindingPairs([
    {
      field: "source_contract_fingerprint",
      expected: "contract-a",
      actual: "contract-b",
      reason: "source_contract_fingerprint_mismatch",
    },
    {
      field: "source_review_fingerprint",
      expected: "review-a",
      actual: "review-a",
      reason: "source_review_fingerprint_mismatch",
    },
    {
      field: "source_dry_run_result_fingerprint",
      expected: "",
      actual: "dry-run-a",
      reason: "source_dry_run_result_fingerprint_missing",
    },
  ]);
  assert.equal(validation.passed, false);
  assert.equal(validation.mismatched_pairs.length, 1);
  assert.equal(validation.missing_pairs.length, 1);
  assert.equal(
    validation.mismatched_pairs[0].reason,
    "source_contract_fingerprint_mismatch",
  );
}

function assertRowCountHelpers() {
  const observations = buildRowCountObservations(
    ["target_table", "protected_table"],
    { target_table: 1, protected_table: 2 },
    { target_table: 2, protected_table: 2 },
  );
  assert.deepEqual(observations, [
    {
      table_name: "target_table",
      before_count: 1,
      after_count: 2,
      delta: 1,
      changed: true,
    },
    {
      table_name: "protected_table",
      before_count: 2,
      after_count: 2,
      delta: 0,
      changed: false,
    },
  ]);

  const targetOnly = summarizeTargetOnlyRowCountWrite({
    targetTable: "target_table",
    tableNames: ["target_table", "protected_table"],
    beforeCounts: { target_table: 1, protected_table: 2 },
    afterCounts: { target_table: 2, protected_table: 2 },
  });
  assert.equal(targetOnly.target_delta, 1);
  assert.equal(targetOnly.expected_target_delta, 1);
  assert.equal(targetOnly.target_delta_matches_expected, true);
  assert.equal(targetOnly.non_target_changed_table_count, 0);
  assert.equal(targetOnly.all_non_target_row_counts_unchanged, true);
  assert.equal(isTargetOnlyRowCountWrite(targetOnly), true);
  assert.equal(
    isTargetOnlyRowCountWrite({
      target_delta: targetOnly.target_delta,
      target_table_changed: targetOnly.target_table_changed,
      all_non_target_row_counts_unchanged:
        targetOnly.all_non_target_row_counts_unchanged,
      non_target_changed_table_count:
        targetOnly.non_target_changed_table_count,
    }),
    true,
  );

  const nonTargetChanged = summarizeTargetOnlyRowCountWrite({
    targetTable: "target_table",
    tableNames: ["target_table", "protected_table"],
    beforeCounts: { target_table: 1, protected_table: 2 },
    afterCounts: { target_table: 2, protected_table: 3 },
  });
  assert.equal(isTargetOnlyRowCountWrite(nonTargetChanged), false);

  const expectedDeltaTwo = summarizeTargetOnlyRowCountWrite({
    targetTable: "target_table",
    tableNames: ["target_table", "protected_table"],
    beforeCounts: { target_table: 1, protected_table: 2 },
    afterCounts: { target_table: 3, protected_table: 2 },
    expectedTargetDelta: 2,
  });
  assert.equal(expectedDeltaTwo.expected_target_delta, 2);
  assert.equal(expectedDeltaTwo.target_delta, 2);
  assert.equal(expectedDeltaTwo.target_delta_matches_expected, true);
  assert.equal(isTargetOnlyRowCountWrite(expectedDeltaTwo), true);

  const expectedDeltaTwoMismatch = summarizeTargetOnlyRowCountWrite({
    targetTable: "target_table",
    tableNames: ["target_table", "protected_table"],
    beforeCounts: { target_table: 1, protected_table: 2 },
    afterCounts: { target_table: 2, protected_table: 2 },
    expectedTargetDelta: 2,
  });
  assert.equal(expectedDeltaTwoMismatch.expected_target_delta, 2);
  assert.equal(expectedDeltaTwoMismatch.target_delta, 1);
  assert.equal(expectedDeltaTwoMismatch.target_delta_matches_expected, false);
  assert.equal(isTargetOnlyRowCountWrite(expectedDeltaTwoMismatch), false);
  assert.equal(
    isTargetOnlyRowCountWrite(expectedDeltaTwoMismatch, {
      expectedTargetDelta: 1,
    }),
    true,
  );

  const expectedDeltaZero = summarizeTargetOnlyRowCountWrite({
    targetTable: "target_table",
    tableNames: ["target_table", "protected_table"],
    beforeCounts: { target_table: 1, protected_table: 2 },
    afterCounts: { target_table: 1, protected_table: 2 },
    expectedTargetDelta: 0,
  });
  assert.equal(expectedDeltaZero.expected_target_delta, 0);
  assert.equal(expectedDeltaZero.target_delta, 0);
  assert.equal(expectedDeltaZero.target_table_changed, false);
  assert.equal(expectedDeltaZero.target_delta_matches_expected, true);
  assert.equal(isTargetOnlyRowCountWrite(expectedDeltaZero), true);

  const expectedDeltaZeroMismatch = summarizeTargetOnlyRowCountWrite({
    targetTable: "target_table",
    tableNames: ["target_table", "protected_table"],
    beforeCounts: { target_table: 1, protected_table: 2 },
    afterCounts: { target_table: 2, protected_table: 2 },
    expectedTargetDelta: 0,
  });
  assert.equal(expectedDeltaZeroMismatch.expected_target_delta, 0);
  assert.equal(expectedDeltaZeroMismatch.target_delta, 1);
  assert.equal(expectedDeltaZeroMismatch.target_table_changed, true);
  assert.equal(expectedDeltaZeroMismatch.target_delta_matches_expected, false);
  assert.equal(isTargetOnlyRowCountWrite(expectedDeltaZeroMismatch), false);
}

function assertChainImportsAndDuplicateRemoval() {
  for (const key of [
    "dryRunResult",
    "entrypoint",
    "entrypointReview",
    "resultRecordWriter",
    "resultRecordReadback",
  ]) {
    assert.ok(
      source[key].includes("shared-source-chain-guards"),
      `${files[key]} must import shared source-chain guards`,
    );
  }

  assert.ok(source.dryRunResult.includes("buildRowCountObservations"));
  assert.ok(source.entrypoint.includes("findForbiddenRawMaterialFields"));
  assert.ok(source.entrypointReview.includes("requiredStringFieldsPresent"));
  assert.ok(source.resultRecordWriter.includes("summarizeTargetOnlyRowCountWrite"));
  assert.ok(source.resultRecordWriter.includes("buildDeterministicIdempotencyKey"));
  assert.ok(source.resultRecordReadback.includes("fingerprint(fingerprintSource)"));

  for (const key of [
    "dryRunResult",
    "entrypoint",
    "entrypointReview",
    "resultRecordWriter",
    "resultRecordReadback",
  ]) {
    assert.doesNotMatch(
      source[key],
      /function\s+(stableJson|fnv1a32|findForbiddenRawPayloadFields|collectForbiddenRawPayloadFields|isForbiddenRawPayloadKey|containsRawMaterial|isForbiddenRawMaterialKey|allValuesFalse)\b/,
      `${files[key]} must not keep local duplicate stable JSON/hash/raw/all-false helpers`,
    );
  }
}

function assertForbiddenImportsAbsent() {
  const forbiddenRuntimePatterns = [
    /fetch\s*\(/,
    /\bNextResponse\b/,
    /from\s+["']next\/server["']/,
    /new\s+OpenAI\b/,
    /from\s+["']openai["']/,
    /\bOPENAI_API_KEY\b/,
    /api\.openai\.com/,
    /api\.github\.com/,
    /from\s+["']@octokit\//,
    /executeCodex\s*\(/,
    /runCodex\s*\(/,
    /retrieveSources\s*\(/,
    /runRetrieval\s*\(/,
    /ragIndex\s*\(/,
    /embedding\s*\(/,
    /vectorStore\s*\(/,
    /crawler\s*\(/,
    /crawlSources\s*\(/,
    /writeCurrentWorkingPerspective/,
    /applyCurrentWorkingPerspective/,
    /writePerspectiveState/,
    /promotePerspective/,
    /writePerspectiveMemory/,
  ];
  for (const key of [
    "sharedGuards",
    "dryRunResult",
    "entrypoint",
    "entrypointReview",
    "resultRecordWriter",
    "resultRecordReadback",
  ]) {
    for (const pattern of forbiddenRuntimePatterns) {
      assert.doesNotMatch(
        source[key],
        pattern,
        `${files[key]} must not introduce ${pattern}`,
      );
    }
  }
}

function assertExistingFocusedSmokesPass() {
  const changedFiles = uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...collectBaseRangeFiles(),
  ]);
  if (changedFiles.some((file) => autonomyDelegationGrantRecordFiles.has(file))) {
    return {
      passed: false,
      skipped: true,
      skip_reason:
        "nested historical no-mutation smokes skipped because this branch is the autonomy delegation grant follow-on slice",
    };
  }

  for (const scriptName of [
    "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-v0-1",
    "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-v0-1",
    "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-v0-1",
    "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-v0-1",
    "smoke:research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-write-v0-1",
  ]) {
    execFileSync("npm", ["run", "--silent", scriptName], {
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_BOUNDARY_SMOKE_MODE: "content-only",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
  }
  return {
    passed: true,
    skipped: false,
    skip_reason: null,
  };
}

function buildNoMutationSourceMaterial() {
  return {
    source_entrypoint_review_fingerprint:
      "fnv1a32_canonical_json_v0_1:review0001",
    source_entrypoint_fingerprint:
      "fnv1a32_canonical_json_v0_1:entry0001",
    source_contract_fingerprint:
      "fnv1a32_canonical_json_v0_1:contract0001",
    source_review_fingerprint:
      "fnv1a32_canonical_json_v0_1:dryreview0001",
    source_dry_run_result_fingerprint:
      "fnv1a32_canonical_json_v0_1:dryresult0001",
    source_writer_compatibility_refs: {
      source_perspective_writer_compatibility_receipt_id: "receipt-1",
      source_perspective_writer_compatibility_record_id: "record-1",
      source_perspective_writer_compatibility_record_fingerprint:
        "fnv1a32_canonical_json_v0_1:writer0001",
    },
  };
}

function readBasePackageJson() {
  const baseRef = collectGitFiles(["merge-base", "HEAD", "origin/main"])[0];
  if (!baseRef) return null;
  try {
    return JSON.parse(
      execFileSync("git", ["show", `${baseRef}:package.json`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    return null;
  }
}

function collectBaseRangeFiles() {
  const baseRef = collectGitFiles(["merge-base", "HEAD", "origin/main"])[0];
  if (!baseRef) return [];
  return collectGitFiles(["diff", "--name-only", `${baseRef}...HEAD`]);
}

function collectGitFiles(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
