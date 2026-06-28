#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const docsPath = "docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md";
const fixturePath = "fixtures/product-write-accepted-evidence-ref-runtime.sample.v0.1.json";
const typePath = "types/product-write-accepted-evidence-ref.ts";
const storePath = "lib/product-write/accepted-evidence-ref-store.ts";
const runtimePath = "lib/product-write/accepted-evidence-ref-runtime.ts";
const routePath = "app/api/product-write/accepted-evidence-refs/route.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const promotionStorePath = "lib/perspective/promotion/promotion-decision-store.ts";
const formationStorePath = "lib/perspective/formation-receipt/formation-receipt-store.ts";
const promotionFixturePath = "fixtures/perspective-promotion-decision-store.sample.v0.1.json";
const formationFixturePath = "fixtures/formation-receipt-durable-write.sample.v0.1.json";
const remainingGapDocPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_2.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const reentryDocPath = "docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md";
const targetContractDocPath = "docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md";
const disabledHarnessDocPath = "docs/DISABLED_PRODUCT_WRITE_ADAPTER_REENTRY_HARNESS_V0_1.md";
const privacyGuardDocPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const runtimeAuditPanelDocPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const selectedAuditDocPath =
  "docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_4_PHASE_4_PROMOTION_STATE_V0_1.md";
const smokePath = "scripts/smoke-product-write-accepted-evidence-ref-runtime-v0-1.mjs";

const runtimeVersion = "product_write_accepted_evidence_ref_runtime.v0.1";
const requestVersion = "product_write_accepted_evidence_ref_request.v0.1";
const recordVersion = "product_write_accepted_evidence_ref_record.v0.1";
const storeVersion = "product_write_accepted_evidence_ref_store.v0.1";
const routeVersion = "product_write_accepted_evidence_ref_route.v0.1";
const targetGroup = "accepted_evidence_records";
const scope = "project:augnes";
const packageScriptName = "smoke:product-write-accepted-evidence-ref-runtime-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-product-write-accepted-evidence-ref-runtime-v0-1.mjs";

const dbPath = `.tmp/perspective-promotion-decisions/product-write-accepted-evidence-ref-${process.pid}.sqlite`;
const auditDbPath = `.tmp/runtime-audit/product-write-accepted-evidence-ref-${process.pid}.sqlite`;
const schemaMissingDbPath = `.tmp/product-write-accepted-evidence-refs/schema-missing-${process.pid}.sqlite`;
const noAuditDbPath = `.tmp/runtime-audit/product-write-accepted-evidence-ref-no-audit-${process.pid}.sqlite`;
const noCreateAuditDbPath = `.tmp/runtime-audit/product-write-accepted-evidence-ref-no-create-${process.pid}.sqlite`;
const forbiddenStringNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-forbidden-string-${process.pid}/record.sqlite`;
const forbiddenNumberNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-forbidden-number-${process.pid}/record.sqlite`;
const forbiddenObjectNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-forbidden-object-${process.pid}/record.sqlite`;
const forbiddenEnabledNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-forbidden-enabled-${process.pid}/record.sqlite`;
const forbiddenArrayNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-forbidden-array-${process.pid}/record.sqlite`;
const privateRawNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-private-raw-${process.pid}/record.sqlite`;
const missingPrerequisiteNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-missing-prerequisite-${process.pid}/record.sqlite`;
const invalidPayloadNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-invalid-payload-${process.pid}/record.sqlite`;
const missingLineageNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-missing-lineage-${process.pid}/record.sqlite`;
const crossOriginGetNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-cross-origin-get-${process.pid}/record.sqlite`;
const headerlessNonLocalGetNoCreateDbPath =
  `.tmp/product-write-accepted-evidence-refs/no-create-headerless-get-${process.pid}/record.sqlite`;
const invalidAuditDbPath = "../runtime-audit-product-write-accepted-evidence-ref.sqlite";

for (const filePath of [
  docsPath,
  fixturePath,
  typePath,
  storePath,
  runtimePath,
  routePath,
  packagePath,
  indexPath,
  promotionStorePath,
  formationStorePath,
  promotionFixturePath,
  formationFixturePath,
  remainingGapDocPath,
  roadmapPath,
  reentryDocPath,
  targetContractDocPath,
  disabledHarnessDocPath,
  privacyGuardDocPath,
  runtimeAuditPanelDocPath,
  selectedAuditDocPath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} exists`);
}

const docs = readText(docsPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const typeText = readText(typePath);
const storeText = readText(storePath);
const runtimeText = readText(runtimePath);
const routeText = readText(routePath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const remainingGapDocs = readText(remainingGapDocPath);
const normalizedDocs = normalizeWhitespace(docs);

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue, "package script");
assertIncludes(indexText, "Product Write Accepted Evidence Ref Runtime v0.1", "index pointer title");
assertIncludes(indexText, docsPath, "index docs pointer");
assertIncludes(indexText, fixturePath, "index fixture pointer");
assertIncludes(indexText, smokePath, "index smoke pointer");
assertIncludes(remainingGapDocs, "product_write_minimal_runtime_v0_1", "remaining gap gates product-write");
assertIncludes(remainingGapDocs, "product_write_runtime_now", "remaining gap authority boundary");

assert.equal(fixture.fixture_version, "product_write_accepted_evidence_ref_runtime.sample.v0.1");
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.record_version, recordVersion);
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.target_group, targetGroup);
assert.equal(fixture.valid_create_input.idempotency_key, fixture.valid_create_input.idempotency_key);
assert.equal(fixture.expected_record_ref, "accepted-evidence-ref-write:v0.1:43c718cb262772aee0778575");
assertFixturePrivacy(fixtureText);

for (const phrase of [
  "This is the first explicitly approved gated product-write minimal runtime target only",
  "This does not approve broad product-write.",
  "This does not enable a product-write adapter.",
  "This does not allocate product IDs.",
  "The runtime validates existing promotion decision and Formation Receipt rows",
  "Validation order is:",
  "Accepted evidence ref write is not proof.",
  "Accepted evidence ref write is not truth.",
  "Accepted evidence ref write is not durable Perspective state.",
  "Accepted evidence ref write is not product ID allocation.",
  "Accepted evidence ref write is not broad product persistence.",
  "Operator approval is required but is not itself proof.",
  "Preview-to-write diff is required but is not write approval by itself.",
  "Source refs are lineage pointers, not proof.",
  "Promotion decision is a prerequisite, not an automatic execution command.",
  "Formation Receipt is a prerequisite, not product-write authority by itself.",
  "Audit event is not truth, proof, approval, state, or product authority.",
  "POST and GET are same-origin bounded.",
  "Product DB files and directories are not created for invalid, forbidden-authority, private/raw, or missing-prerequisite attempts.",
  "Product DB files and directories are not created when the lineage DB path is missing.",
  "Forbidden authority fields fail closed: only absent, false, null, and undefined are allowed.",
  "Missing `audit_db_path` does not fail the primary route.",
  "Audit write failure does not fail the primary route.",
  "Smoke/CI pass is not truth.",
]) {
  assertIncludes(normalizedDocs, phrase, `docs phrase ${phrase}`);
}

for (const marker of [
  "ProductWriteAcceptedEvidenceRefRuntimeVersion",
  "ProductWriteAcceptedEvidenceRefCreateInput",
  "ProductWriteAcceptedEvidenceRefRecord",
  "ProductWriteAcceptedEvidenceRefAuthorityBoundary",
  "ProductWriteAcceptedEvidenceRefResult",
]) {
  assertIncludes(typeText, marker, `type export ${marker}`);
}

for (const marker of [
  "product_write_accepted_evidence_ref_writes",
  "idempotency_key text not null unique",
  "payload_fingerprint text not null",
  "writeAcceptedEvidenceRefRecordV01",
  "readAcceptedEvidenceRefRecordV01",
  "listAcceptedEvidenceRefRecordsV01",
]) {
  assertIncludes(storeText, marker, `store marker ${marker}`);
}

for (const marker of [
  "product_write_accepted_evidence_ref_writes",
  "idempotency_key text not null unique",
  "payload_fingerprint text not null",
  "operator_approval_payload_json text not null",
]) {
  assertIncludes(storeText, marker, `store schema marker ${marker}`);
}

assertValidationOrder(runtimeText);
assertRouteBoundaries(routeText);
assertIncludes(runtimeText, "isFalseLikeAuthorityValue", "false-like authority helper");
assertIncludes(routeText, "preflightAcceptedEvidenceRefRuntimeV01(inputBody.input)", "route preflight before DB open");
assertIncludes(routeText, "openExistingWriteLocalDb(inputBody.db_path)", "route existing DB open");

const runtimeModule = await import(pathToFileURL(`${process.cwd()}/${runtimePath}`).href);
const promotionStore = await import(pathToFileURL(`${process.cwd()}/${promotionStorePath}`).href);
const formationStore = await import(pathToFileURL(`${process.cwd()}/${formationStorePath}`).href);
const acceptedRoute = await import(pathToFileURL(`${process.cwd()}/${routePath}`).href);

const idempotencyKey = runtimeModule.createAcceptedEvidenceRefIdempotencyKeyV01({
  operator_approval_ref: fixture.valid_create_input.operator_approval_payload.approval_ref,
  promotion_decision_ref: fixture.valid_create_input.promotion_decision_ref,
  formation_receipt_ref: fixture.valid_create_input.formation_receipt_ref,
  preview_to_write_diff_ref: fixture.valid_create_input.preview_to_write_diff_ref,
});
assert.equal(idempotencyKey, fixture.valid_create_input.idempotency_key, "stable idempotency key");
assert.equal(
  runtimeModule.createAcceptedEvidenceRefWriteIdV01(idempotencyKey),
  fixture.expected_record_ref,
  "stable write record ref",
);

rmSync(dbPath, { force: true });
rmSync(auditDbPath, { force: true });
rmSync(schemaMissingDbPath, { force: true });
rmSync(noAuditDbPath, { force: true });
rmSync(noCreateAuditDbPath, { force: true });
for (const path of [
  forbiddenStringNoCreateDbPath,
  forbiddenNumberNoCreateDbPath,
  forbiddenObjectNoCreateDbPath,
  forbiddenEnabledNoCreateDbPath,
  forbiddenArrayNoCreateDbPath,
  privateRawNoCreateDbPath,
  missingPrerequisiteNoCreateDbPath,
  invalidPayloadNoCreateDbPath,
  missingLineageNoCreateDbPath,
  crossOriginGetNoCreateDbPath,
  headerlessNonLocalGetNoCreateDbPath,
]) {
  rmSync(dirname(path), { recursive: true, force: true });
}

await assertRejectedWithoutProductDb(acceptedRoute, {
  dbPath: invalidPayloadNoCreateDbPath,
  auditDbPath: noCreateAuditDbPath,
  input: {
    request_version: "wrong-version",
  },
  expectedHttpStatus: 400,
  expectedStatus: "blocked_invalid_payload",
});

for (const authorityCase of [
  {
    dbPath: forbiddenStringNoCreateDbPath,
    field: "product_id_allocation_now",
    value: "true",
  },
  {
    dbPath: forbiddenNumberNoCreateDbPath,
    field: "broad_product_persistence_now",
    value: 1,
  },
  {
    dbPath: forbiddenObjectNoCreateDbPath,
    field: "github_api_call_now",
    value: { enabled: true },
  },
  {
    dbPath: forbiddenEnabledNoCreateDbPath,
    field: "proof_creation_now",
    value: "enabled",
  },
  {
    dbPath: forbiddenArrayNoCreateDbPath,
    field: "durable_perspective_state_mutation_from_product_write_now",
    value: ["enabled"],
  },
]) {
  await assertRejectedWithoutProductDb(acceptedRoute, {
    dbPath: authorityCase.dbPath,
    auditDbPath: noCreateAuditDbPath,
    input: withAuthorityOverride(fixture.valid_create_input, authorityCase.field, authorityCase.value),
    expectedHttpStatus: 403,
    expectedStatus: "blocked_forbidden_authority",
  });
}

await assertRejectedWithoutProductDb(acceptedRoute, {
  dbPath: privateRawNoCreateDbPath,
  auditDbPath: noCreateAuditDbPath,
  input: {
    ...clone(fixture.valid_create_input),
    preview_to_write_diff_ref: "diff --git marker for no-create blocked fixture runtime check",
  },
  expectedHttpStatus: 400,
  expectedStatus: "blocked_private_or_raw_payload",
});

await assertRejectedWithoutProductDb(acceptedRoute, {
  dbPath: missingPrerequisiteNoCreateDbPath,
  auditDbPath: noCreateAuditDbPath,
  input: withoutKey(fixture.valid_create_input, "promotion_decision_ref"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});

await assertRejectedWithoutProductDb(acceptedRoute, {
  dbPath: missingLineageNoCreateDbPath,
  auditDbPath: noCreateAuditDbPath,
  input: fixture.valid_create_input,
  expectedHttpStatus: 400,
  expectedStatus: "blocked_schema_missing",
});

await assertGetRejectedWithoutProductDb({
  route: acceptedRoute,
  request: crossOriginGetRequest(
    `/api/product-write/accepted-evidence-refs?${queryString({ db_path: crossOriginGetNoCreateDbPath })}`,
  ),
  dbPath: crossOriginGetNoCreateDbPath,
});

await assertGetRejectedWithoutProductDb({
  route: acceptedRoute,
  request: headerlessNonLocalGetRequest(
    `/api/product-write/accepted-evidence-refs?${queryString({ db_path: headerlessNonLocalGetNoCreateDbPath })}`,
  ),
  dbPath: headerlessNonLocalGetNoCreateDbPath,
});

mkdirSync(dirname(dbPath), { recursive: true });

seedPromotionAndFormation({
  dbPath,
  promotionStore,
  formationStore,
  promotionFixture: JSON.parse(readText(promotionFixturePath)),
  formationFixture: JSON.parse(readText(formationFixturePath)),
  seedRefs: fixture.lineage_seed_refs,
});

const firstWrite = await acceptedRoute.POST(
  postRequest("/api/product-write/accepted-evidence-refs", {
    db_path: dbPath,
    audit_db_path: auditDbPath,
    input: fixture.valid_create_input,
  }),
);
assert.equal(firstWrite.status, 201);
const firstWriteBody = await firstWrite.json();
assert.equal(firstWriteBody.route_version, routeVersion);
assert.equal(firstWriteBody.result.status, "written");
assert.equal(firstWriteBody.result.record.accepted_evidence_ref_write_id, fixture.expected_record_ref);
assert.equal(firstWriteBody.result.record.product_id_allocated, false);
assert.equal(firstWriteBody.result.record.proof_created, false);
assert.equal(firstWriteBody.result.record.durable_perspective_state_mutated, false);
assert.equal(firstWriteBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 1);

const replay = await acceptedRoute.POST(
  postRequest("/api/product-write/accepted-evidence-refs", {
    db_path: dbPath,
    audit_db_path: auditDbPath,
    input: fixture.valid_create_input,
  }),
);
assert.equal(replay.status, 200);
const replayBody = await replay.json();
assert.equal(replayBody.result.status, "idempotent_existing");
assert.equal(replayBody.result.idempotent_replay, true);
assert.equal(replayBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 2);

const conflictInput = clone(fixture.valid_create_input);
conflictInput.boundary_notes = [...conflictInput.boundary_notes, "bounded conflict check note"];
const conflict = await acceptedRoute.POST(
  postRequest("/api/product-write/accepted-evidence-refs", {
    db_path: dbPath,
    audit_db_path: auditDbPath,
    input: conflictInput,
  }),
);
assert.equal(conflict.status, 409);
const conflictBody = await conflict.json();
assert.equal(conflictBody.result.status, "conflict_existing_idempotency_key");
assert.equal(conflictBody.audit_event_result.status, "audit_event_created");
assert.equal(countAuditEvents(auditDbPath), 3);

const listNoAudit = await acceptedRoute.GET(
  getRequest(`/api/product-write/accepted-evidence-refs?${queryString({ db_path: dbPath })}`),
);
assert.equal(listNoAudit.status, 200);
const listNoAuditBody = await listNoAudit.json();
assert.equal(listNoAuditBody.result.status, "listed");
assert.equal(listNoAuditBody.result.records.length, 1);
assert.equal(listNoAuditBody.audit_event_result.status, "audit_not_requested");
assert.ok(!existsSync(noAuditDbPath), "missing audit_db_path must not create audit db");
assert.equal(countAuditEvents(auditDbPath), 3);

const readInvalidAudit = await acceptedRoute.GET(
  getRequest(
    `/api/product-write/accepted-evidence-refs?${queryString({
      db_path: dbPath,
      audit_db_path: invalidAuditDbPath,
      accepted_evidence_ref_write_id: fixture.expected_record_ref,
    })}`,
  ),
);
assert.equal(readInvalidAudit.status, 200);
const readInvalidAuditBody = await readInvalidAudit.json();
assert.equal(readInvalidAuditBody.result.status, "read");
assert.equal(readInvalidAuditBody.audit_event_result.status, "audit_skipped_invalid_db_path");
assert.equal(countAuditEvents(auditDbPath), 3);

await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "promotion_decision_ref"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "formation_receipt_ref"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "review_record_ref"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: { ...clone(fixture.valid_create_input), public_safe_source_refs: [] },
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "operator_approval_payload"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "preview_to_write_diff_ref"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "rollback_or_abort_plan_ref"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: withoutKey(fixture.valid_create_input, "idempotency_key"),
  expectedHttpStatus: 400,
  expectedStatus: "blocked_missing_prerequisite",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: {
    ...clone(fixture.valid_create_input),
    authority_boundary: {
      ...fixture.valid_create_input.authority_boundary,
      product_id_allocation_now: true,
    },
  },
  expectedHttpStatus: 403,
  expectedStatus: "blocked_forbidden_authority",
});
await assertRejected(acceptedRoute, {
  dbPath,
  auditDbPath,
  input: {
    ...clone(fixture.valid_create_input),
    preview_to_write_diff_ref: "diff --git marker for blocked fixture runtime check",
  },
  expectedHttpStatus: 400,
  expectedStatus: "blocked_private_or_raw_payload",
});

mkdirSync(dirname(schemaMissingDbPath), { recursive: true });
new Database(schemaMissingDbPath).close();
const schemaMissing = await acceptedRoute.POST(
  postRequest("/api/product-write/accepted-evidence-refs", {
    db_path: schemaMissingDbPath,
    audit_db_path: auditDbPath,
    input: fixture.valid_create_input,
  }),
);
assert.equal(schemaMissing.status, 400);
const schemaMissingBody = await schemaMissing.json();
assert.equal(schemaMissingBody.result.status, "blocked_schema_missing");
assert.equal(schemaMissingBody.audit_event_result.status, "audit_event_created");
assert.equal(tableExists(schemaMissingDbPath, "product_write_accepted_evidence_ref_writes"), false);

const auditEvents = readAuditEvents(auditDbPath);
assert.ok(auditEvents.length >= 6, "success and rejection audit events recorded");
assert.ok(
  auditEvents.filter((event) => event.event_action === "accepted_evidence_ref_write_rejected").length >= 4,
  "bounded rejected audit events recorded",
);
for (const event of auditEvents) {
  assert.equal(event.event_surface, "product_write_gate");
  assert.equal(event.event_kind, "route_response");
  assertIncludes(JSON.stringify(event.reason_codes), "audit_event_is_not_truth", "audit event not truth");
  assert.equal(event.authority_boundary.product_write_now, false);
  assert.equal(event.authority_boundary.product_id_allocation_now, false);
  assertNoUnsafeEcho(JSON.stringify(event), `audit event ${event.audit_event_id}`);
}

rmSync(dbPath, { force: true });
rmSync(auditDbPath, { force: true });
rmSync(schemaMissingDbPath, { force: true });
rmSync(noCreateAuditDbPath, { force: true });
for (const path of [
  forbiddenStringNoCreateDbPath,
  forbiddenNumberNoCreateDbPath,
  forbiddenObjectNoCreateDbPath,
  forbiddenEnabledNoCreateDbPath,
  forbiddenArrayNoCreateDbPath,
  privateRawNoCreateDbPath,
  missingPrerequisiteNoCreateDbPath,
  invalidPayloadNoCreateDbPath,
  missingLineageNoCreateDbPath,
  crossOriginGetNoCreateDbPath,
  headerlessNonLocalGetNoCreateDbPath,
]) {
  rmSync(dirname(path), { recursive: true, force: true });
}

console.log("product_write_accepted_evidence_ref_runtime_v0_1 smoke passed");

function seedPromotionAndFormation(input) {
  const db = new Database(input.dbPath);
  try {
    const promotionInput = clone(input.promotionFixture.valid_create_inputs[0]);
    promotionInput.promotion_decision_id = input.seedRefs.promotion_decision_ref;
    promotionInput.decision_kind = "promote";
    promotionInput.decision_status = "eligible_for_future_operator_decision";
    promotionInput.operator_actor_ref = input.seedRefs.operator_actor_ref;
    promotionInput.review_record_ref = input.seedRefs.review_record_ref;
    promotionInput.accepted_evidence_refs = input.seedRefs.accepted_evidence_refs;
    const promotionBasis = clone(input.promotionFixture.valid_create_inputs[0].basis_refs[0]);
    promotionBasis.basis_id = "basis:accepted-evidence-ref-runtime:v0.1:sample";
    promotionBasis.basis_ref = "basis-ref:accepted-evidence-ref-runtime:v0.1:sample";
    promotionBasis.source_refs = input.seedRefs.public_safe_source_refs;
    promotionBasis.candidate_refs = ["candidate:accepted-evidence-ref-runtime:v0.1:sample"];
    promotionBasis.review_record_refs = [input.seedRefs.review_record_ref];
    promotionBasis.bounded_summary = "Bounded basis for accepted evidence ref runtime smoke.";
    promotionInput.basis_refs = [promotionBasis];
    const promotionResult = input.promotionStore.createPromotionDecisionRecordV01(promotionInput, db);
    assert.equal(promotionResult.status, "stored", "seed promotion decision");

    const formationInput = clone(input.formationFixture.valid_create_inputs[0]);
    formationInput.receipt_id = input.seedRefs.formation_receipt_ref;
    formationInput.promotion_decision_id = input.seedRefs.promotion_decision_ref;
    formationInput.review_record_ref = input.seedRefs.review_record_ref;
    formationInput.operator_actor_ref = input.seedRefs.operator_actor_ref;
    formationInput.selected_source_refs = input.seedRefs.public_safe_source_refs.map((sourceRef) => ({
      source_ref: sourceRef,
      bounded_summary: `Bounded public source ref ${sourceRef}.`,
      reason_codes: ["selected_source_ref_present"],
    }));
    formationInput.selected_candidate_refs = [
      {
        disposition: "selected",
        candidate_kind: "evidence_candidate",
        candidate_ref: "candidate:accepted-evidence-ref-runtime:v0.1:sample",
        bounded_summary: "Bounded selected candidate for accepted evidence ref runtime smoke.",
        source_refs: input.seedRefs.public_safe_source_refs,
        reason_codes: ["selected_candidate_ref_present", "selected_source_ref_present"],
      },
    ];
    formationInput.omitted_candidate_refs = [];
    formationInput.deferred_candidate_refs = [];
    const formationResult = input.formationStore.createFormationReceiptV01(formationInput, db);
    assert.equal(formationResult.status, "written", "seed Formation Receipt");
  } finally {
    db.close();
  }
}

async function assertRejected(route, input) {
  const response = await route.POST(
    postRequest("/api/product-write/accepted-evidence-refs", {
      db_path: input.dbPath,
      audit_db_path: input.auditDbPath,
      input: input.input,
    }),
  );
  assert.equal(response.status, input.expectedHttpStatus);
  const body = await response.json();
  assert.equal(body.result.status, input.expectedStatus);
  assert.ok(
    ["audit_event_created", "idempotent_existing"].includes(body.audit_event_result.status),
    `rejected audit status ${body.audit_event_result.status}`,
  );
  assert.equal(body.accepted_evidence_ref_write_record_written, false);
  assert.equal(body.product_id_allocated, false);
  assert.equal(body.proof_created, false);
}

async function assertRejectedWithoutProductDb(route, input) {
  rmSync(dirname(input.dbPath), { recursive: true, force: true });
  assert.equal(existsSync(input.dbPath), false, `${input.dbPath} starts absent`);
  assert.equal(existsSync(dirname(input.dbPath)), false, `${dirname(input.dbPath)} starts absent`);
  await assertRejected(route, input);
  assert.equal(existsSync(input.dbPath), false, `${input.dbPath} was not created`);
  assert.equal(existsSync(dirname(input.dbPath)), false, `${dirname(input.dbPath)} was not created`);
}

async function assertGetRejectedWithoutProductDb(input) {
  rmSync(dirname(input.dbPath), { recursive: true, force: true });
  assert.equal(existsSync(input.dbPath), false, `${input.dbPath} starts absent`);
  assert.equal(existsSync(dirname(input.dbPath)), false, `${dirname(input.dbPath)} starts absent`);
  const response = await input.route.GET(input.request);
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error_code, "same_origin_required");
  assert.equal(existsSync(input.dbPath), false, `${input.dbPath} was not created`);
  assert.equal(existsSync(dirname(input.dbPath)), false, `${dirname(input.dbPath)} was not created`);
}

function postRequest(path, body) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(body),
  });
}

function getRequest(path) {
  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
  });
}

function crossOriginGetRequest(path) {
  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers: {
      host: "localhost",
      origin: "http://cross-origin.example",
      "sec-fetch-site": "cross-site",
    },
  });
}

function headerlessNonLocalGetRequest(path) {
  return new Request(`http://example.test${path}`, {
    method: "GET",
    headers: {
      host: "example.test",
    },
  });
}

function queryString(values) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  return params.toString();
}

function tableExists(path, tableName) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName);
    return row?.name === tableName;
  } finally {
    db.close();
  }
}

function countAuditEvents(path) {
  if (!existsSync(path)) return 0;
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    const row = db.prepare("SELECT count(*) AS count FROM runtime_audit_events").get();
    return row.count;
  } finally {
    db.close();
  }
}

function readAuditEvents(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return db
      .prepare(
        `SELECT
          audit_event_id,
          event_kind,
          event_surface,
          event_action,
          event_status,
          subject_ref,
          bounded_summary,
          authority_boundary_json,
          reason_codes_json
         FROM runtime_audit_events
         ORDER BY created_at ASC, audit_event_id ASC`,
      )
      .all()
      .map((row) => ({
        ...row,
        authority_boundary: JSON.parse(row.authority_boundary_json),
        reason_codes: JSON.parse(row.reason_codes_json),
      }));
  } finally {
    db.close();
  }
}

function assertValidationOrder(text) {
  const markers = [
    "validatePayloadShapeV01(input)",
    "validateForbiddenAuthorityV01(input)",
    "validatePrivateRawPayloadV01(input)",
    "const prerequisiteValidation = validatePrerequisitesV01(",
    "validateDbLineageV01(input, db)",
    "writeAcceptedEvidenceRefRecordV01(record, db)",
  ];
  let previous = -1;
  for (const marker of markers) {
    const current = text.indexOf(marker);
    assert.ok(current > previous, `validation order marker ${marker}`);
    previous = current;
  }
}

function assertRouteBoundaries(text) {
  for (const marker of [
    "requestHasSameOriginBoundary",
    "maybeWriteRuntimeRouteAuditEventV01",
    "audit_event_result",
    "accepted_evidence_ref_write_rejected",
    "accepted_evidence_ref_write_created",
    "accepted_evidence_ref_writes_listed",
    "product_id_allocated: false",
    "proof_created: false",
    "durable_perspective_state_mutated: false",
  ]) {
    assertIncludes(text, marker, `route marker ${marker}`);
  }
  for (const forbidden of [
    "fetch(",
    "OpenAI",
    "embeddings.create",
    "createPullRequest",
    "github.",
    "git commit",
    "allocateProduct",
    "publishProduct",
    "createProof",
    "final RAG answer generation implementation",
  ]) {
    assertNotIncludes(text, forbidden, `route forbidden ${forbidden}`);
  }
}

function assertFixturePrivacy(text) {
  for (const forbidden of [
    "/Users/",
    "/home/",
    "file://",
    "https://",
    "http://",
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "password:",
    "secret:",
    "private key",
    "provider response:",
    "actual query:",
    "embedding vector:",
    "vector index dump:",
    "diff --git",
  ]) {
    assertNotIncludes(text, forbidden, `fixture forbidden ${forbidden}`);
  }
}

function assertNoUnsafeEcho(text, label) {
  for (const forbidden of [
    "/Users/",
    "/home/",
    "file://",
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "password:",
    "secret:",
    "private key",
    "diff --git",
  ]) {
    assertNotIncludes(text, forbidden, `${label} unsafe echo ${forbidden}`);
  }
}

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), label);
}

function assertNotIncludes(text, needle, label) {
  assert.ok(!text.includes(needle), label);
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withoutKey(value, key) {
  const cloned = clone(value);
  delete cloned[key];
  return cloned;
}

function withAuthorityOverride(value, key, authorityValue) {
  const cloned = clone(value);
  cloned.authority_boundary = {
    ...(cloned.authority_boundary ?? {}),
    [key]: authorityValue,
  };
  return cloned;
}
