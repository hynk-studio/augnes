import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const root = process.cwd();
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");

assertPackageScript({
  packageJsonText: pkgText,
  scriptName: "smoke:current-working-perspective-route-integration-slice-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
});

const expectedFiles = [
  "types/current-working-perspective-route-integration-read.ts",
  "lib/perspective/current-working-perspective-route-integration-read.ts",
  "lib/perspective/read-current-working-perspective-route-integration-for-web.ts",
  "types/current-working-perspective-route-integration-read-review.ts",
  "lib/workplane/current-working-perspective-route-integration-read-review.ts",
  "components/workplane/current-working-perspective-route-integration-read-panel.tsx",
  "app/api/perspective/current/route.ts",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
  "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  "scripts/smoke-handoff-context-update-contract-v0-1.mjs",
  "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  "types/handoff-context-apply-slice-preview.ts",
  "lib/workplane/handoff-context-apply-preview.ts",
  "components/workplane/handoff-context-apply-preview-panel.tsx",
  "types/handoff-context-apply-slice-decision.ts",
  "lib/workplane/handoff-context-apply-decision.ts",
  "components/workplane/handoff-context-apply-decision-panel.tsx",
  "types/handoff-context-apply-write.ts",
  "lib/workplane/handoff-context-apply-write.ts",
  "app/api/workplane/handoff-context-applies/route.ts",
  "types/handoff-context-apply-record-review.ts",
  "lib/workplane/handoff-context-apply-record-review.ts",
  "lib/workplane/read-handoff-context-apply-record-review-for-web.ts",
  "lib/workplane/read-applied-handoff-context-for-web.ts",
  "components/workplane/handoff-context-apply-record-review-panel.tsx",
  "components/workplane/applied-handoff-context-panel.tsx",
  "scripts/smoke-handoff-context-apply-slice-v0-1.mjs",
  "types/handoff-packet-copy-export-contract-preview.ts",
  "lib/workplane/handoff-packet-copy-export-contract-preview.ts",
  "components/workplane/handoff-packet-copy-export-contract-preview-panel.tsx",
  "types/handoff-packet-copy-export-contract-decision.ts",
  "lib/workplane/handoff-packet-copy-export-contract-decision.ts",
  "components/workplane/handoff-packet-copy-export-contract-decision-panel.tsx",
  "types/handoff-packet-copy-export-contract-write.ts",
  "lib/workplane/handoff-packet-copy-export-contract-write.ts",
  "app/api/workplane/handoff-packet-copy-export-contracts/route.ts",
  "types/handoff-packet-copy-export-contract-record-review.ts",
  "lib/workplane/handoff-packet-copy-export-contract-record-review.ts",
  "lib/workplane/read-handoff-packet-copy-export-contract-record-review-for-web.ts",
  "components/workplane/handoff-packet-copy-export-contract-record-review-panel.tsx",
  "scripts/smoke-handoff-packet-copy-export-contract-v0-1.mjs",
  "types/handoff-packet-copy-export-preview.ts",
  "lib/workplane/handoff-packet-copy-export-preview.ts",
  "components/workplane/handoff-packet-copy-export-preview-panel.tsx",
  "types/handoff-packet-copy-export-decision.ts",
  "lib/workplane/handoff-packet-copy-export-decision.ts",
  "components/workplane/handoff-packet-copy-export-decision-panel.tsx",
  "types/handoff-packet-copy-export-write.ts",
  "lib/workplane/handoff-packet-copy-export-write.ts",
  "app/api/workplane/handoff-packet-copy-exports/route.ts",
  "types/handoff-packet-copy-export-record-review.ts",
  "lib/workplane/handoff-packet-copy-export-record-review.ts",
  "lib/workplane/read-handoff-packet-copy-export-record-review-for-web.ts",
  "lib/workplane/read-exported-handoff-packet-artifact-for-web.ts",
  "components/workplane/handoff-packet-copy-export-record-review-panel.tsx",
  "components/workplane/exported-handoff-packet-artifact-panel.tsx",
  "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
  "scripts/smoke-handoff-send-contract-v0-1.mjs",
  "types/handoff-send-preview.ts",
  "lib/workplane/handoff-send-preview.ts",
  "components/workplane/handoff-send-preview-panel.tsx",
  "types/handoff-send-decision.ts",
  "lib/workplane/handoff-send-decision.ts",
  "components/workplane/handoff-send-decision-panel.tsx",
  "types/handoff-send-write.ts",
  "lib/workplane/handoff-send-write.ts",
  "app/api/workplane/handoff-sends/route.ts",
  "types/handoff-send-record-review.ts",
  "lib/workplane/handoff-send-record-review.ts",
  "lib/workplane/read-handoff-send-record-review-for-web.ts",
  "lib/workplane/read-sent-handoff-for-web.ts",
  "components/workplane/handoff-send-record-review-panel.tsx",
  "components/workplane/sent-handoff-panel.tsx",
  "scripts/smoke-handoff-send-slice-v0-1.mjs",
  "package.json",
];

for (const file of expectedFiles.slice(0, 11)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "current_working_perspective_route_integration_slice_v0_1",
});

const textByFile = loadTextByFile(expectedFiles.filter((file) => existsSync(path.join(root, file))));
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "current_working_perspective_route_integration_read.v0.1",
  "current_working_perspective_route_integration_read_review.v0.1",
  "runtime_primary_with_applied_snapshot_hint",
  "runtime_primary_with_applied_overlay_candidate",
  "applied_snapshot_preferred_with_runtime_fallback",
  "requested_route_integration_mode_unsupported",
  "requested_route_integration_mode_mismatch_with_contract",
  "review_current_working_perspective_route_integration_read",
  "verify_current_working_perspective_route_runtime_fallback",
  "verify_current_working_perspective_route_applied_snapshot_overlay",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const routeText = textByFile.get("app/api/perspective/current/route.ts");
assert(/export\s+function\s+GET\s*\(/.test(routeText), "route must export GET");
for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  assert(
    !new RegExp(`export\\s+function\\s+${method}\\s*\\(`).test(routeText),
    `/api/perspective/current must not export ${method}`,
  );
}
assertContainsAll(routeText, [
  "buildCurrentWorkingPerspectiveRuntimeReadModel",
  "readCurrentWorkingPerspectiveRouteIntegrationForWebV01",
  "ROUTE_INTEGRATION_QUERY_PARAMS",
  "route_integration_contract_db_path",
  "applied_snapshot_db_path",
  "x-augnes-current-working-perspective-route-integration",
]);

const readTypes = await import(
  "../types/current-working-perspective-route-integration-read.ts"
);
const {
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01,
} = await import(
  "../lib/perspective/current-working-perspective-route-integration-read.ts"
);
const {
  readCurrentWorkingPerspectiveRouteIntegrationForWebV01,
  isSafeCurrentWorkingPerspectiveRouteIntegrationReadAppliedSnapshotDbPathV01,
  isSafeCurrentWorkingPerspectiveRouteIntegrationReadContractDbPathV01,
} = await import(
  "../lib/perspective/read-current-working-perspective-route-integration-for-web.ts"
);
const {
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01,
} = await import(
  "../lib/workplane/current-working-perspective-route-integration-read-review.ts"
);
const {
  buildCurrentWorkingPerspectiveRuntimeReadModel,
} = await import("../lib/perspective/current-working-perspective-source.ts");
const {
  createCurrentWorkingPerspectiveApplyWriteAuthorityBoundaryV01,
  CURRENT_WORKING_PERSPECTIVE_APPLY_WRITE_TABLE,
  ensureCurrentWorkingPerspectiveApplyWriteSchemaV01,
} = await import("../lib/workplane/current-working-perspective-apply-write.ts");
const {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_WRITE_TABLE,
  createCurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundaryV01,
  ensureCurrentWorkingPerspectiveRouteIntegrationContractWriteSchemaV01,
} = await import(
  "../lib/workplane/current-working-perspective-route-integration-contract-write.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const currentRoute = await import("../app/api/perspective/current/route.ts");

assert.equal(
  readTypes.CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION,
  "current_working_perspective_route_integration_read.v0.1",
);

const AS_OF = "2026-07-06T00:00:00.000Z";
const runtimeCwp = buildCurrentWorkingPerspectiveRuntimeReadModel({
  scope: "project:augnes",
});
const applyRecordRef = "current-working-perspective-apply:valid";
const updateContractRecordRef =
  "current-working-perspective-update-contract:valid";
const appliedSnapshotRef = "current-working-perspective-applied-snapshot:valid";
const contractRecordRef =
  "current-working-perspective-route-integration-contract:valid";

const contractRecord = buildContractRecord("applied_snapshot_overlay_candidate");
const appliedRead = buildAppliedRead();
const contractStoreResult = buildContractStoreResult(contractRecord);

const defaultRead = readCurrentWorkingPerspectiveRouteIntegrationForWebV01({
  runtime_current_working_perspective_read: runtimeCwp,
});
assert.equal(defaultRead.status, "runtime_only");
assert.equal(defaultRead.response_mode, "runtime_only");
assert.equal(defaultRead.primary_current_working_perspective, runtimeCwp);
assert.equal(defaultRead.applied_current_working_perspective, null);
assert.equal(defaultRead.authority_boundary.can_write_db, false);
assert.equal(defaultRead.authority_boundary.can_modify_api_perspective_current_route, false);
assert.equal(defaultRead.authority_boundary.can_replace_current_working_perspective_route_response, false);

const overlayRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_store_result: contractStoreResult,
  applied_current_working_perspective_read: appliedRead,
  requested_route_integration_mode: "applied_snapshot_overlay_candidate",
  as_of: AS_OF,
  source_refs: ["smoke:route-integration-read"],
});
assert.equal(overlayRead.status, "runtime_with_applied_snapshot_overlay_candidate");
assert.equal(overlayRead.response_mode, "runtime_primary_with_applied_overlay_candidate");
assert.equal(overlayRead.primary_current_working_perspective, runtimeCwp);
assert(overlayRead.applied_current_working_perspective);
assert.equal(overlayRead.applied_snapshot_metadata.overlay_candidate, true);

const hintRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: buildContractRecord(
    "runtime_only_with_applied_snapshot_hint",
  ),
  applied_current_working_perspective_read: appliedRead,
  requested_route_integration_mode: "runtime_only_with_applied_snapshot_hint",
});
assert.equal(hintRead.status, "runtime_with_applied_snapshot_hint");
assert.equal(hintRead.response_mode, "runtime_primary_with_applied_snapshot_hint");
assert.equal(hintRead.applied_current_working_perspective, null);

const preferredRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: buildContractRecord(
    "applied_snapshot_preferred_with_runtime_fallback",
  ),
  applied_current_working_perspective_read: appliedRead,
  requested_route_integration_mode:
    "applied_snapshot_preferred_with_runtime_fallback",
});
assert.equal(preferredRead.status, "applied_snapshot_preferred_with_runtime_fallback");
assert.equal(preferredRead.response_mode, "applied_snapshot_preferred_with_runtime_fallback");
assert.equal(preferredRead.primary_current_working_perspective, appliedRead.latest_applied_snapshot.applied_current_working_perspective);
assert(preferredRead.runtime_current_working_perspective);

const invalidExplicitModeRead =
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
    runtime_current_working_perspective_read: runtimeCwp,
    route_integration_contract_store_result: contractStoreResult,
    applied_current_working_perspective_read: appliedRead,
    requested_route_integration_mode_refusal_reason:
      "requested_route_integration_mode_unsupported",
    as_of: AS_OF,
    source_refs: ["smoke:route-integration-invalid-mode"],
  });
assert.equal(invalidExplicitModeRead.status, "fallback_to_runtime");
assert.equal(invalidExplicitModeRead.response_mode, "runtime_only");
assert.equal(invalidExplicitModeRead.primary_current_working_perspective, runtimeCwp);
assert.equal(invalidExplicitModeRead.applied_current_working_perspective, null);
assert(
  invalidExplicitModeRead.refusal_reasons.includes(
    "requested_route_integration_mode_unsupported",
  ),
);

const mismatchedExplicitModeRead =
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
    runtime_current_working_perspective_read: runtimeCwp,
    route_integration_contract_store_result: contractStoreResult,
    applied_current_working_perspective_read: appliedRead,
    requested_route_integration_mode:
      "applied_snapshot_preferred_with_runtime_fallback",
    as_of: AS_OF,
    source_refs: ["smoke:route-integration-mismatched-mode"],
  });
assert.equal(mismatchedExplicitModeRead.status, "fallback_to_runtime");
assert.equal(mismatchedExplicitModeRead.response_mode, "runtime_only");
assert.equal(mismatchedExplicitModeRead.primary_current_working_perspective, runtimeCwp);
assert.equal(mismatchedExplicitModeRead.applied_current_working_perspective, null);
assert(
  mismatchedExplicitModeRead.blocked_reasons.includes(
    "requested_route_integration_mode_mismatch_with_contract",
  ),
);

const omittedExplicitModeRead =
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
    runtime_current_working_perspective_read: runtimeCwp,
    route_integration_contract_store_result: contractStoreResult,
    applied_current_working_perspective_read: appliedRead,
    as_of: AS_OF,
    source_refs: ["smoke:route-integration-omitted-mode"],
  });
assert.equal(
  omittedExplicitModeRead.status,
  "runtime_with_applied_snapshot_overlay_candidate",
);
assert.equal(
  omittedExplicitModeRead.response_mode,
  "runtime_primary_with_applied_overlay_candidate",
);
assert(omittedExplicitModeRead.applied_current_working_perspective);

const forgedRouteModified = structuredClone(contractRecord);
forgedRouteModified.authority_profile.api_perspective_current_route_modified = true;
const forgedRouteRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: forgedRouteModified,
  applied_current_working_perspective_read: appliedRead,
});
assert.equal(forgedRouteRead.status, "contract_invalid");
assert(forgedRouteRead.blocked_reasons.includes("route_integration_contract_authority_profile_invalid"));
assert.equal(forgedRouteRead.primary_current_working_perspective, runtimeCwp);

const forgedReplacement = structuredClone(contractRecord);
forgedReplacement.authority_profile.current_working_perspective_route_response_replaced = true;
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
    runtime_current_working_perspective_read: runtimeCwp,
    route_integration_contract_record: forgedReplacement,
    applied_current_working_perspective_read: appliedRead,
  }).status,
  "contract_invalid",
);

const badApplyRef = structuredClone(contractRecord);
badApplyRef.source_cwp_apply_record_refs = [
  "current-working-perspective-update-contract:wrong",
];
const badApplyRefRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: badApplyRef,
  applied_current_working_perspective_read: appliedRead,
});
assert.equal(badApplyRefRead.status, "contract_invalid");
assert(badApplyRefRead.blocked_reasons.includes("source_cwp_apply_record_refs_not_apply_records"));

const badSnapshotAuthority = structuredClone(appliedRead);
badSnapshotAuthority.latest_applied_snapshot.authority_boundary.can_replace_current_working_perspective_route_response = true;
const badSnapshotAuthorityRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: contractRecord,
  applied_current_working_perspective_read: badSnapshotAuthority,
});
assert.equal(badSnapshotAuthorityRead.status, "applied_snapshot_invalid");
assert(badSnapshotAuthorityRead.blocked_reasons.includes("applied_snapshot_authority_boundary_invalid"));

const badSnapshotRef = structuredClone(appliedRead);
badSnapshotRef.latest_applied_snapshot.applied_snapshot_ref =
  "current-working-perspective-applied-snapshot:mismatch";
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
    runtime_current_working_perspective_read: runtimeCwp,
    route_integration_contract_record: contractRecord,
    applied_current_working_perspective_read: badSnapshotRef,
  }).status,
  "applied_snapshot_invalid",
);

const badLatestRecord = structuredClone(appliedRead);
badLatestRecord.latest_record.record_id = "current-working-perspective-apply:other";
const badLatestRecordRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: contractRecord,
  applied_current_working_perspective_read: badLatestRecord,
});
assert.equal(badLatestRecordRead.status, "applied_snapshot_invalid");
assert(badLatestRecordRead.blocked_reasons.includes("applied_snapshot_latest_record_ref_mismatch"));

const preferredInvalidRead = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_record: buildContractRecord(
    "applied_snapshot_preferred_with_runtime_fallback",
  ),
  applied_current_working_perspective_read: badSnapshotRef,
  requested_route_integration_mode:
    "applied_snapshot_preferred_with_runtime_fallback",
});
assert.equal(preferredInvalidRead.status, "applied_snapshot_invalid");
assert.equal(preferredInvalidRead.response_mode, "runtime_only");
assert.equal(preferredInvalidRead.primary_current_working_perspective, runtimeCwp);

assert.equal(
  isSafeCurrentWorkingPerspectiveRouteIntegrationReadContractDbPathV01(
    "tmp/current-working-perspective-route-integration-contracts/a.sqlite",
  ),
  true,
);
assert.equal(
  isSafeCurrentWorkingPerspectiveRouteIntegrationReadContractDbPathV01(
    "/tmp/current-working-perspective-route-integration-contracts/a.sqlite",
  ),
  false,
);
assert.equal(
  isSafeCurrentWorkingPerspectiveRouteIntegrationReadAppliedSnapshotDbPathV01(
    ".tmp/current-working-perspective-applies/a.db",
  ),
  true,
);
assert.equal(
  isSafeCurrentWorkingPerspectiveRouteIntegrationReadAppliedSnapshotDbPathV01(
    ".tmp/current-working-perspective-applies/private-key.db",
  ),
  false,
);

const unsafeRead = readCurrentWorkingPerspectiveRouteIntegrationForWebV01({
  runtime_current_working_perspective_read: runtimeCwp,
  route_integration_contract_db_path: "/tmp/unsafe.sqlite",
});
assert(unsafeRead.refusal_reasons.includes("unsafe_route_integration_contract_db_path"));
assert.equal(unsafeRead.fallback_metadata.used_runtime_fallback, true);

const routeDefault = await currentRoute.GET(
  readRequest("http://localhost/api/perspective/current?scope=project:augnes"),
);
assert.equal(routeDefault.status, 200);
assert.equal(
  routeDefault.headers.get("x-augnes-current-working-perspective-route-integration"),
  null,
);
const routeDefaultBody = await routeDefault.json();
assert.equal(routeDefaultBody.perspective_version, "current_working_perspective.v0.1");
assert.equal(routeDefaultBody.route_integration, undefined);
assert.equal(routeDefaultBody.applied_current_working_perspective, undefined);

const tempDir = path.join(root, ".tmp/current-working-perspective-route-integration-slice");
rmSync(tempDir, { force: true, recursive: true });
mkdirSync(tempDir, { recursive: true });
const {
  contractDbPath: validRouteContractDbPath,
  appliedDbPath: validRouteAppliedDbPath,
} = writeValidRouteIntegrationFixtureDbs();

const routeInvalidMode = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&route_integration_contract_db_path=${encodeURIComponent(
      validRouteContractDbPath,
    )}&applied_snapshot_db_path=${encodeURIComponent(
      validRouteAppliedDbPath,
    )}&route_integration_mode=definitely_not_a_mode`,
  ),
);
assert.equal(routeInvalidMode.status, 200);
const routeInvalidModeBody = await routeInvalidMode.json();
assert.equal(routeInvalidModeBody.route_integration.status, "fallback_to_runtime");
assert.equal(routeInvalidModeBody.route_integration.response_mode, "runtime_only");
assert(
  routeInvalidModeBody.route_integration.refusal_reasons.includes(
    "requested_route_integration_mode_unsupported",
  ),
);
assert.equal(routeInvalidModeBody.applied_current_working_perspective, null);
assert.equal(
  routeInvalidModeBody.route_integration.applied_current_working_perspective,
  null,
);
assert.equal(
  routeInvalidModeBody.primary_current_working_perspective.perspective_version,
  "current_working_perspective.v0.1",
);

const routeMismatchedMode = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&route_integration_contract_db_path=${encodeURIComponent(
      validRouteContractDbPath,
    )}&applied_snapshot_db_path=${encodeURIComponent(
      validRouteAppliedDbPath,
    )}&route_integration_mode=applied_snapshot_preferred_with_runtime_fallback`,
  ),
);
assert.equal(routeMismatchedMode.status, 200);
const routeMismatchedModeBody = await routeMismatchedMode.json();
assert.equal(routeMismatchedModeBody.route_integration.status, "fallback_to_runtime");
assert.equal(routeMismatchedModeBody.route_integration.response_mode, "runtime_only");
assert(
  routeMismatchedModeBody.route_integration.blocked_reasons.includes(
    "requested_route_integration_mode_mismatch_with_contract",
  ),
);
assert.equal(routeMismatchedModeBody.applied_current_working_perspective, null);
assert.equal(
  routeMismatchedModeBody.route_integration.applied_current_working_perspective,
  null,
);

const routeOmittedMode = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&route_integration_contract_db_path=${encodeURIComponent(
      validRouteContractDbPath,
    )}&applied_snapshot_db_path=${encodeURIComponent(validRouteAppliedDbPath)}`,
  ),
);
assert.equal(routeOmittedMode.status, 200);
const routeOmittedModeBody = await routeOmittedMode.json();
assert.equal(
  routeOmittedModeBody.route_integration.status,
  "runtime_with_applied_snapshot_overlay_candidate",
);
assert.equal(
  routeOmittedModeBody.route_integration.response_mode,
  "runtime_primary_with_applied_overlay_candidate",
);
assert(routeOmittedModeBody.applied_current_working_perspective);

const routeMatchingMode = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&route_integration_contract_db_path=${encodeURIComponent(
      validRouteContractDbPath,
    )}&applied_snapshot_db_path=${encodeURIComponent(
      validRouteAppliedDbPath,
    )}&route_integration_mode=applied_snapshot_overlay_candidate`,
  ),
);
assert.equal(routeMatchingMode.status, 200);
const routeMatchingModeBody = await routeMatchingMode.json();
assert.equal(
  routeMatchingModeBody.route_integration.status,
  "runtime_with_applied_snapshot_overlay_candidate",
);
assert.equal(
  routeMatchingModeBody.route_integration.response_mode,
  "runtime_primary_with_applied_overlay_candidate",
);
assert(routeMatchingModeBody.applied_current_working_perspective);
assert.deepEqual(readRouteFixtureDbCounts(validRouteContractDbPath, validRouteAppliedDbPath), {
  contracts: 1,
  applies: 1,
});

const missingContractPath =
  ".tmp/current-working-perspective-route-integration-contracts/missing-route-read.sqlite";
rmSync(path.join(root, missingContractPath), { force: true });
const routeMissingContract = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&route_integration_contract_db_path=${encodeURIComponent(
      missingContractPath,
    )}&route_integration_mode=applied_snapshot_overlay_candidate`,
  ),
);
assert.equal(routeMissingContract.status, 200);
assert.equal(
  routeMissingContract.headers.get("x-augnes-current-working-perspective-route-integration"),
  "current_working_perspective_route_integration_read.v0.1",
);
const routeMissingContractBody = await routeMissingContract.json();
assert.equal(routeMissingContractBody.route_integration.status, "contract_missing");
assert.equal(routeMissingContractBody.route_integration.fallback_metadata.used_runtime_fallback, true);
assert.equal(existsSync(path.join(root, missingContractPath)), false);

const schemaMissingContractPath =
  ".tmp/current-working-perspective-route-integration-contracts/schema-missing-route-read.sqlite";
mkdirSync(path.dirname(path.join(root, schemaMissingContractPath)), {
  recursive: true,
});
new Database(path.join(root, schemaMissingContractPath)).close();
const routeSchemaMissing = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&route_integration_contract_db_path=${encodeURIComponent(
      schemaMissingContractPath,
    )}&route_integration_mode=applied_snapshot_overlay_candidate`,
  ),
);
assert.equal(routeSchemaMissing.status, 200);
const schemaMissingDb = new Database(path.join(root, schemaMissingContractPath), {
  readonly: true,
  fileMustExist: true,
});
assert.equal(
  schemaMissingDb.prepare("select count(*) as count from sqlite_master where type = 'table'").get().count,
  0,
);
schemaMissingDb.close();

const missingAppliedPath =
  ".tmp/current-working-perspective-applies/missing-route-read.sqlite";
rmSync(path.join(root, missingAppliedPath), { force: true });
const routeMissingApplied = await currentRoute.GET(
  readRequest(
    `http://localhost/api/perspective/current?scope=project:augnes&applied_snapshot_db_path=${encodeURIComponent(
      missingAppliedPath,
    )}&route_integration_mode=applied_snapshot_overlay_candidate`,
  ),
);
assert.equal(routeMissingApplied.status, 200);
assert.equal(existsSync(path.join(root, missingAppliedPath)), false);

const overlayReview =
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01({
    route_integration_read: overlayRead,
    selected_contract_record_id: contractRecordRef,
    selected_applied_snapshot_ref: appliedSnapshotRef,
    as_of: AS_OF,
    source_refs: ["smoke:route-integration-read-review"],
  });
assert.equal(overlayReview.review_status, "applied_snapshot_overlay_available");
assert.equal(overlayReview.input_summary.selected_contract_record_found, true);
assert.equal(overlayReview.input_summary.selected_applied_snapshot_found, true);
assert.equal(overlayReview.authority_boundary.can_write_db, false);

const preferredReview =
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01({
    route_integration_read: preferredRead,
  });
assert.equal(preferredReview.review_status, "applied_snapshot_preferred_available");

assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01().review_status,
  "runtime_only",
);
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01({
    route_integration_read: { read_version: "wrong" },
  }).review_status,
  "integration_invalid",
);
const forgedReadAuthority = structuredClone(overlayRead);
forgedReadAuthority.authority_boundary.can_write_db = true;
const forgedReadAuthorityReview =
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01({
    route_integration_read: forgedReadAuthority,
  });
assert.equal(forgedReadAuthorityReview.review_status, "integration_invalid");
assert(
  forgedReadAuthorityReview.blocked_reasons.includes(
    "current_working_perspective_route_integration_read_authority_boundary_invalid",
  ),
);
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01({
    route_integration_read: { ...overlayRead, raw_text: "nope" },
  }).review_status,
  "integration_invalid",
);

const panelText = textByFile.get(
  "components/workplane/current-working-perspective-route-integration-read-panel.tsx",
);
assert(!/<button\b/i.test(panelText), "route integration read panel must not render a button");
for (const forbiddenHandler of [
  "onClick",
  "import",
  "apply",
  "approve",
  "send",
  "launch",
  "run",
  "execute",
  "merge",
  "write",
]) {
  assert(
    !new RegExp(`onClick[\\s\\S]{0,80}${forbiddenHandler}`, "i").test(panelText),
    `panel must not include ${forbiddenHandler} click handlers`,
  );
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  current_working_perspective_route_integration_read: overlayRead,
  current_working_perspective_route_integration_read_review: overlayReview,
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: ["smoke:route-integration-spine"],
});
assert(
  overview.spine_steps.some(
    (step) => step.step_id === "current_working_perspective_route_integration_read",
  ),
);
assert(
  overview.spine_steps.some(
    (step) => step.step_id === "current_working_perspective_route_integration_review",
  ),
);
assert(
  [
    "verify_current_working_perspective_route_applied_snapshot_overlay",
    "review_current_working_perspective_route_integration_read",
  ].includes(overview.recommended_next_operator_action),
);
for (const forbidden of [
  "route_write",
  "upstream_current_working_perspective_source_tables_mutation",
  "applied_snapshot_write",
  "current_working_perspective_apply_record_write",
  "current_working_perspective_update_contract_record_write",
  "handoff_sent",
  "memory_written",
  "provider_called",
  "github_called",
  "codex_executed",
]) {
  assert.notEqual(overview.recommended_next_operator_action, forbidden);
}

assertContainsAll(
  textByFile.get("lib/workplane/workbench-dogfood-loop-spine-overview.ts"),
  [
    "current_working_perspective_route_integration_read",
    "current_working_perspective_route_integration_review",
    "verify_current_working_perspective_route_runtime_fallback",
    "verify_current_working_perspective_route_applied_snapshot_overlay",
    "resolve_current_working_perspective_route_integration_read_blockers",
  ],
);

rmSync(".tmp/current-working-perspective-route-integration-contracts", {
  recursive: true,
  force: true,
});
rmSync(".tmp/current-working-perspective-applies", {
  recursive: true,
  force: true,
});

console.log("smoke-current-working-perspective-route-integration-slice-v0-1 passed");

function writeValidRouteIntegrationFixtureDbs() {
  const contractDbPath =
    ".tmp/current-working-perspective-route-integration-contracts/mode-authority-route.sqlite";
  const appliedDbPath =
    ".tmp/current-working-perspective-applies/mode-authority-route.sqlite";
  const contractDbAbs = path.join(root, contractDbPath);
  const appliedDbAbs = path.join(root, appliedDbPath);
  rmSync(contractDbAbs, { force: true });
  rmSync(appliedDbAbs, { force: true });
  mkdirSync(path.dirname(contractDbAbs), { recursive: true });
  mkdirSync(path.dirname(appliedDbAbs), { recursive: true });

  const routeContractRecord = buildContractRecord(
    "applied_snapshot_overlay_candidate",
  );
  const routeContractReceipt =
    buildContractStoreResult(routeContractRecord).receipt;
  const contractDb = new Database(contractDbAbs);
  try {
    ensureCurrentWorkingPerspectiveRouteIntegrationContractWriteSchemaV01(
      contractDb,
    );
    contractDb
      .prepare(
        `INSERT INTO ${CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_WRITE_TABLE} (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          route_integration_mode,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        routeContractRecord.record_id,
        routeContractRecord.idempotency_key,
        routeContractRecord.created_at,
        routeContractRecord.scope,
        routeContractRecord.operator_ref,
        routeContractRecord.record_fingerprint,
        routeContractRecord.route_integration_mode,
        JSON.stringify(routeContractRecord),
        JSON.stringify(routeContractReceipt),
      );
  } finally {
    contractDb.close();
  }

  const applied = buildAppliedRead();
  const applyRecord = applied.latest_record;
  const appliedSnapshot = applied.latest_applied_snapshot;
  const applyDb = new Database(appliedDbAbs);
  try {
    ensureCurrentWorkingPerspectiveApplyWriteSchemaV01(applyDb);
    applyDb
      .prepare(
        `INSERT INTO ${CURRENT_WORKING_PERSPECTIVE_APPLY_WRITE_TABLE} (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          applied_snapshot_ref,
          record_json,
          applied_snapshot_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        applyRecord.record_id,
        "idempotency:cwp-route-integration-read-apply",
        AS_OF,
        "project:augnes",
        "operator:cwp-route-integration-read",
        "fingerprint:cwp-route-integration-read-apply",
        appliedSnapshot.applied_snapshot_ref,
        JSON.stringify(applyRecord),
        JSON.stringify(appliedSnapshot),
        JSON.stringify({
          receipt_version: "current_working_perspective_apply_receipt.v0.1",
          record_id: applyRecord.record_id,
          idempotency_key: "idempotency:cwp-route-integration-read-apply",
          wrote: true,
          idempotent_replay: false,
          no_side_effects: {
            current_working_perspective_apply_record_written: true,
            current_working_perspective_apply_receipt_written: true,
            current_working_perspective_apply_persisted: true,
            applied_current_working_perspective_snapshot_written: true,
            current_working_perspective_update_applied_to_local_snapshot: true,
          },
        }),
      );
  } finally {
    applyDb.close();
  }

  return { contractDbPath, appliedDbPath };
}

function readRouteFixtureDbCounts(contractDbPath, appliedDbPath) {
  const contractDb = new Database(path.join(root, contractDbPath), {
    readonly: true,
    fileMustExist: true,
  });
  const applyDb = new Database(path.join(root, appliedDbPath), {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return {
      contracts: contractDb
        .prepare(
          `SELECT count(*) AS count FROM ${CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_WRITE_TABLE}`,
        )
        .get().count,
      applies: applyDb
        .prepare(
          `SELECT count(*) AS count FROM ${CURRENT_WORKING_PERSPECTIVE_APPLY_WRITE_TABLE}`,
        )
        .get().count,
    };
  } finally {
    contractDb.close();
    applyDb.close();
  }
}

function buildAppliedRead() {
  const snapshot = {
    snapshot_version: "current_working_perspective_applied_snapshot.v0.1",
    applied_snapshot_ref: appliedSnapshotRef,
    scope: "project:augnes",
    as_of: AS_OF,
    source_contract_record_ref: updateContractRecordRef,
    source_current_working_perspective_ref: `current-working-perspective:project:augnes:${runtimeCwp.as_of}`,
    applied_current_working_perspective: {
      ...runtimeCwp,
      as_of: AS_OF,
      next_phase_notes: [
        ...runtimeCwp.next_phase_notes,
        "Applied local CWP snapshot for route integration smoke.",
      ],
    },
    applied_patch_refs: ["cwp-patch:route-integration-smoke"],
    applied_patch_count: 1,
    source_refs: ["source:applied-cwp-snapshot"],
    evidence_refs: ["evidence:applied-cwp-snapshot"],
    authority_boundary:
      createCurrentWorkingPerspectiveApplyWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
  };
  return {
    read_version: "applied_current_working_perspective_read.v0.1",
    status: "latest_applied_snapshot_available",
    scope: "project:augnes",
    latest_applied_snapshot: snapshot,
    latest_record: {
      record_version: "current_working_perspective_apply_record.v0.1",
      record_id: applyRecordRef,
      scope: "project:augnes",
      applied_snapshot_ref: appliedSnapshotRef,
      applied_snapshot: snapshot,
    },
    summary: {
      applied_snapshot_ref: appliedSnapshotRef,
      source_contract_record_ref: updateContractRecordRef,
      source_current_working_perspective_ref:
        snapshot.source_current_working_perspective_ref,
      as_of: AS_OF,
      current_frame_summary:
        snapshot.applied_current_working_perspective.current_frame.summary,
      current_thesis_summary:
        snapshot.applied_current_working_perspective.current_thesis.summary,
      active_goal_count:
        snapshot.applied_current_working_perspective.active_goals.length,
      open_question_count:
        snapshot.applied_current_working_perspective.open_questions.length,
      active_risk_count:
        snapshot.applied_current_working_perspective.active_risks.length,
      next_candidate_count:
        snapshot.applied_current_working_perspective.next_candidates.length,
      staleness_status:
        snapshot.applied_current_working_perspective.staleness.status,
      applied_patch_count: 1,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_mutate_current_working_perspective: false,
      can_replace_current_working_perspective_route_response: false,
    },
  };
}

function readRequest(url) {
  return new Request(url, {
    headers: {
      "x-augnes-local-readonly": "current-working-perspective-v0.1",
    },
  });
}

function buildContractRecord(mode) {
  const contract = {
    contract_kind: "current_working_perspective_route_integration_contract.v0.1",
    route_family: "current_working_perspective",
    route_path: "/api/perspective/current",
    route_version_before: "perspective.current.v0.1",
    current_runtime_cwp_ref: `current-working-perspective:project:augnes:${runtimeCwp.as_of}`,
    applied_snapshot_ref: appliedSnapshotRef,
    applied_snapshot_source_contract_record_ref: updateContractRecordRef,
    applied_snapshot_source_apply_record_ref: applyRecordRef,
    requested_route_integration_mode: mode,
    proposed_future_route_behavior: {
      default_mode: mode,
      runtime_fallback_behavior: "preserve_runtime_cwp_fallback",
      applied_snapshot_participation: mode,
      freshness_policy: "require_latest_valid_applied_snapshot",
      staleness_policy: "fallback_to_runtime_when_stale_or_invalid",
      error_policy: "never_throw_away_runtime_cwp",
      local_read_auth_policy: "explicit_safe_local_read_only_paths",
      cache_policy: "no-store",
      response_metadata_policy: "include_route_integration_metadata",
      audit_receipt_policy: "approved_contract_record_required",
    },
    proposed_response_contract: {
      response_version: "perspective.current.route_integration_candidate.v0.1",
      includes_runtime_cwp: true,
      includes_applied_snapshot_metadata: true,
      includes_route_integration_metadata: true,
      includes_authority_boundary: true,
      does_not_include_raw_private_material: true,
    },
    route_integration_guards: {
      require_local_read_marker: true,
      require_project_augnes_scope: true,
      require_safe_applied_snapshot_db_path: true,
      require_schema_existing_for_applied_snapshot_reads: true,
      refuse_private_paths: true,
      refuse_route_replacement_without_approved_record: true,
      preserve_runtime_fallback: true,
      never_write_on_get: true,
    },
    blocked_live_mutations: [
      "api_perspective_current_route_write_on_get",
      "upstream_current_working_perspective_source_table_mutation",
    ],
    future_implementation_requirements: [
      "read_route_integration_contract_store_readonly",
      "read_applied_snapshot_store_readonly",
      "preserve_runtime_fallback",
    ],
    rollback_and_fallback_plan: ["fallback_to_runtime_current_working_perspective"],
    operator_acceptance_criteria: [
      "route_get_remains_read_only",
      "applied_snapshot_participates_only_with_approved_contract",
    ],
  };
  return {
    record_version:
      "current_working_perspective_route_integration_contract_record.v0.1",
    record_id: contractRecordRef,
    idempotency_key: "idempotency:cwp-route-integration-read",
    created_at: AS_OF,
    scope: "project:augnes",
    operator_ref: "operator:cwp-route-integration-read",
    source_refs: ["source:cwp-route-integration-contract"],
    evidence_refs: ["evidence:cwp-route-integration-contract"],
    route_path: "/api/perspective/current",
    route_family: "current_working_perspective",
    source_runtime_current_working_perspective_ref:
      contract.current_runtime_cwp_ref,
    source_applied_snapshot_ref: appliedSnapshotRef,
    source_cwp_apply_record_refs: [applyRecordRef],
    source_cwp_update_contract_record_refs: [updateContractRecordRef],
    proposed_current_working_perspective_route_integration_contract: contract,
    route_integration_mode: mode,
    route_integration_guard_summary: {
      enabled_guard_count: 8,
      guard_keys: Object.keys(contract.route_integration_guards),
    },
    proposed_response_contract: contract.proposed_response_contract,
    future_implementation_requirements:
      contract.future_implementation_requirements,
    rollback_and_fallback_plan: contract.rollback_and_fallback_plan,
    authority_profile: {
      durable_local_current_working_perspective_route_integration_contract: true,
      source_of_truth: false,
      local_project_current_working_perspective_route_integration_contract_only:
        true,
      persistence_horizon:
        "local_project_current_working_perspective_route_integration_contract_store",
      current_working_perspective_route_integration_contract_written: true,
      api_perspective_current_route_modified: false,
      current_working_perspective_route_response_replaced: false,
      upstream_current_working_perspective_source_tables_mutated: false,
      applied_current_working_perspective_snapshot_written: false,
      current_working_perspective_apply_record_written: false,
      current_working_perspective_update_contract_record_written: false,
      perspective_unit_write_performed: false,
      next_work_bias_write_performed: false,
      continuity_relay_write_performed: false,
      continuity_relay_update_performed: false,
      handoff_context_mutation_performed: false,
      memory_promotion_performed: false,
      metric_update_performed: false,
    },
    review_status:
      "recorded_as_scoped_current_working_perspective_route_integration_contract",
    persistence_horizon:
      "local_project_current_working_perspective_route_integration_contract_store",
    no_route_change_performed: noRouteChange(),
    write_validation: {
      validation_version:
        "current_working_perspective_route_integration_contract_write_validation.v0.1",
      operator_decision_preview_revalidated: true,
      route_integration_contract_revalidated: true,
      route_guard_summary_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_route_replacement_or_upstream_cwp_mutation: false,
      refused_metric_or_upstream_write: false,
      validation_hash: "hash:cwp-route-integration-read",
    },
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationContractWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: ["note:route-integration-read-smoke"],
    record_fingerprint: "fingerprint:cwp-route-integration-read",
  };
}

function buildContractStoreResult(record) {
  const noSideEffects = contractNoSideEffects(true);
  return {
    store_version:
      "current_working_perspective_route_integration_contract_store.v0.1",
    scope: "project:augnes",
    status: "written",
    ok: true,
    record,
    records: [record],
    receipt: {
      receipt_version:
        "current_working_perspective_route_integration_contract_receipt.v0.1",
      record_id: record.record_id,
      idempotency_key: record.idempotency_key,
      wrote: true,
      idempotent_replay: false,
      created_at: AS_OF,
      refused: false,
      refusal_reasons: [],
      validation_hash: "hash:cwp-route-integration-read",
      record_fingerprint: record.record_fingerprint,
      store_ref:
        "current_working_perspective_route_integration_contract_store.v0.1:smoke",
      source_refs: record.source_refs,
      no_side_effects: noSideEffects,
    },
    error_code: null,
    no_side_effects: noSideEffects,
  };
}

function noRouteChange() {
  return {
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
  };
}

function contractNoSideEffects(wrote) {
  return {
    current_working_perspective_route_integration_contract_record_written: wrote,
    current_working_perspective_route_integration_contract_receipt_written: wrote,
    current_working_perspective_route_integration_contract_persisted: wrote,
    current_working_perspective_route_integration_contract_written: wrote,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
  };
}
