#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

const typePath = "types/runtime-audit-event.ts";
const helperPath = "lib/runtime-audit/audit-event-store.ts";
const fixturePath = "fixtures/selected-runtime-audit-event-store.sample.v0.1.json";
const smokePath = "scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs";
const docsPath = "docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const gitLedgerSmokePath =
  "scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs";
const manifestSmokePath =
  "scripts/smoke-local-data-export-manifest-builder-v0-1.mjs";
const proposalSmokePath =
  "scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs";
const handoffSmokePath =
  "scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs";
const packetSmokePath = "scripts/smoke-conversation-handoff-packet-v0-2.mjs";
const codexBindingSmokePath =
  "scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs";
const dogfoodingSmokePath =
  "scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs";
const privacyGuardPath = "lib/privacy/redaction-guard.ts";
const reconciliationDocsPath =
  "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";
const gitLedgerDocsPath =
  "docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md";
const localExportDocsPath =
  "docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md";
const reviewProposalDocsPath =
  "docs/DOGFOODING_TO_REVIEW_MEMORY_PROPOSAL_V0_1.md";

const fixtureVersion = "selected_runtime_audit_event_store.sample.v0.1";
const selectedSlice = "selected_runtime_audit_event_store_v0_1";
const nextSlice = "release_readiness_matrix_post_868_non_ui_v0_1";
const eventVersion = "selected_runtime_audit_event.v0.1";
const storeVersion = "selected_runtime_audit_event_store.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:selected-runtime-audit-event-store-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs";

const expectedChangedFiles = new Set([
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  gitLedgerSmokePath,
  manifestSmokePath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
]);

const newSliceFiles = [typePath, helperPath, fixturePath, smokePath, docsPath];

const requiredHelperExports = [
  "ensureSelectedRuntimeAuditEventSchemaV01",
  "selectedRuntimeAuditEventSchemaExistsV01",
  "buildSelectedRuntimeAuditEventV01",
  "buildRuntimeAuditEventFromSelectedSurfaceV01",
  "createSelectedRuntimeAuditEventV01",
  "createBuiltSelectedRuntimeAuditEventV01",
  "readSelectedRuntimeAuditEventV01",
  "listSelectedRuntimeAuditEventsV01",
  "createSelectedRuntimeAuditEventFingerprintV01",
  "createSelectedRuntimeAuditEventAuthorityBoundaryV01",
];

const requiredDocsPhrases = [
  "PR #868 is treated as the frozen web baseline.",
  "PR #877 provides Git Ledger packet candidate context.",
  "This slice adds no UI, components, route model changes, or API routes.",
  "This slice adds no broad all-route instrumentation.",
  "Audit event is not proof.",
  "Audit event is not approval.",
  "Audit event fingerprint is not proof.",
  "Linked refs are references only.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "CI pass is not authority.",
  "Skipped checks are review context, not failure by themselves.",
  "Known warnings are review context, not automatic rejection.",
  "Expected/observed delta is reconciliation context, not approval or rejection.",
  "`release_readiness_matrix_post_868_non_ui_v0_1`",
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
  /\bexecFile\b|\bspawn\b|\bexecSync\b/,
  /\broute_now:\s*true/,
  /\bui_now:\s*true/,
  /\bbroad_all_route_instrumentation_now:\s*true/,
  /\bglobal_db_config_now:\s*true/,
  /\blocal_file_write_now:\s*true/,
  /\blocal_file_read_now:\s*true/,
  /\bimport_apply_now:\s*true/,
  /\bprovider_openai_call_now:\s*true/,
  /\bsource_fetch_now:\s*true/,
  /\bretrieval_execution_now:\s*true/,
  /\bproof_or_evidence_record_now:\s*true/,
  /\breview_memory_write_now:\s*true/,
  /\bpromotion_execution_now:\s*true/,
  /\bformation_receipt_write_now:\s*true/,
  /\bdurable_state_apply_now:\s*true/,
  /\bproduct_write_now:\s*true/,
  /\bgithub_api_call_now:\s*true/,
  /\bgit_write_now:\s*true/,
  /\brelease_deploy_publish_now:\s*true/,
];

for (const requiredPath of [
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  docsPath,
  packagePath,
  indexPath,
  gitLedgerSmokePath,
  manifestSmokePath,
  proposalSmokePath,
  handoffSmokePath,
  packetSmokePath,
  codexBindingSmokePath,
  dogfoodingSmokePath,
  privacyGuardPath,
  reconciliationDocsPath,
  gitLedgerDocsPath,
  localExportDocsPath,
  reviewProposalDocsPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const fixture = JSON.parse(read(fixturePath));
const helperText = read(helperPath);
const typeText = read(typePath);
const docsText = read(docsPath);
const indexText = read(indexPath);
const packageJson = JSON.parse(read(packagePath));
const gitLedgerSmokeText = read(gitLedgerSmokePath);
const manifestSmokeText = read(manifestSmokePath);
const proposalSmokeText = read(proposalSmokePath);
const handoffSmokeText = read(handoffSmokePath);
const packetSmokeText = read(packetSmokePath);
const codexBindingSmokeText = read(codexBindingSmokePath);
const dogfoodingSmokeText = read(dogfoodingSmokePath);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);

assertFixtureAndStaticCoverage();
const built = assertValidBuild();
assertCreateListRead(built);
assertSchemaMissing();
assertDuplicateAndConflict();
assertRepresentedBlockedEventKinds();
assertUnsafeMarkerBlocking();
assertReferenceOnlyMarkerHandling();
assertForbiddenAuthorityBlocking();
assertAllowedNegatedBoundaryText();
assertReadListBoundaries();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "selected-runtime-audit-event-store-v0-1",
      final_status: "pass",
      selected_slice: selectedSlice,
      next_recommended_slice: nextSlice,
      audit_event_id: built.event.audit_event_id,
      event_fingerprint: built.event.event_fingerprint,
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
  assert.equal(fixture.event_version, eventVersion);
  assert.equal(fixture.store_version, storeVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.post_868_boundary.pr_868_is_frozen_web_baseline, true);
  assert.deepEqual(fixture.post_868_boundary.route_model_baseline, [
    "/",
    "/perspective",
    "/workbench",
  ]);
  assert.equal(fixture.post_868_boundary.ui_in_scope, false);
  assert.equal(fixture.post_868_boundary.route_changes_in_scope, false);
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
  for (const eventKind of [
    ...fixture.required_event_kinds,
    ...fixture.optional_event_kinds,
  ]) {
    assert.ok(typeText.includes(`"${eventKind}"`), `type must include ${eventKind}`);
  }
  for (const status of fixture.required_event_statuses) {
    assert.ok(typeText.includes(`"${status}"`), `type must include ${status}`);
  }
  for (const pattern of forbiddenHelperPatterns) {
    assert.ok(!pattern.test(helperText), `helper must not include ${pattern}`);
  }
  for (const pointer of newSliceFiles) {
    for (const smokeText of [
      gitLedgerSmokeText,
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
  for (const oldSmoke of [
    gitLedgerSmokeText,
    manifestSmokeText,
    proposalSmokeText,
    handoffSmokeText,
    packetSmokeText,
    codexBindingSmokeText,
    dogfoodingSmokeText,
  ]) {
    assert.doesNotMatch(
      oldSmoke,
      /selected-runtime-audit.*\*\*/i,
      "compatibility guards must not become broad future-slice allowlists",
    );
  }
}

function assertValidBuild() {
  const first = helper.buildSelectedRuntimeAuditEventV01(fixture.valid_event_input);
  const second = helper.buildRuntimeAuditEventFromSelectedSurfaceV01(
    fixture.valid_event_input,
  );
  assert.equal(first.ok, true);
  assert.equal(first.status, "recorded");
  assert.equal(first.error_code, null);
  assert.equal(first.event.audit_event_version, eventVersion);
  assert.equal(first.event.store_version, storeVersion);
  assert.equal(first.event.scope, scope);
  assert.equal(first.event.event_kind, "git_ledger_packet_candidate_created");
  assert.equal(first.event.event_status, "recorded");
  assert.equal(first.event.lifecycle_state, "candidate_only");
  assert.equal(first.event.public_safe_summary, fixture.valid_event_input.public_safe_summary);
  assert.ok(first.event.event_fingerprint.length >= 32);
  assert.deepEqual(second.event, first.event);
  assertNoExecutionFlags(first);
  assertAuthorityBoundary(first.authority_boundary, "build.authority_boundary");
  assertAuthorityBoundary(first.event.authority_boundary_snapshot, "event.authority_boundary");
  assert.equal(first.event.authority_boundary_snapshot.audit_event_is_proof, false);
  assert.equal(first.event.authority_boundary_snapshot.audit_event_is_approval, false);
  assert.equal(first.event.authority_boundary_snapshot.audit_event_fingerprint_is_proof, false);
  assert.equal(first.event.authority_boundary_snapshot.audit_event_fingerprint_is_approval, false);
  assert.equal(first.event.authority_boundary_snapshot.linked_refs_are_reference_only, true);
  assert.equal(first.event.authority_boundary_snapshot.validation_pass_is_approval, false);
  assert.equal(first.event.authority_boundary_snapshot.validation_failure_is_rejection, false);
  assert.equal(first.event.authority_boundary_snapshot.ci_pass_is_authority, false);
  assert.ok(first.event.reason_codes.includes("linked_refs_reference_only"));
  assert.ok(first.event.reason_codes.includes("validation_pass_not_approval"));
  assert.ok(first.event.reason_codes.includes("ci_pass_not_authority"));
  return first;
}

function assertCreateListRead(built) {
  const db = createDb();
  helper.ensureSelectedRuntimeAuditEventSchemaV01(db);
  assert.equal(helper.selectedRuntimeAuditEventSchemaExistsV01(db), true);
  const create = helper.createSelectedRuntimeAuditEventV01(
    fixture.valid_event_input,
    db,
  );
  assert.equal(create.ok, true);
  assert.equal(create.status, "recorded");
  assert.equal(create.event.audit_event_id, built.event.audit_event_id);
  assert.equal(create.event.event_fingerprint, built.event.event_fingerprint);
  assertNoExecutionFlags(create);

  const list = helper.listSelectedRuntimeAuditEventsV01({ limit: 10 }, db);
  assert.equal(list.ok, true);
  assert.equal(list.status, "listed");
  assert.equal(list.events.length, 1);
  assert.equal(list.events[0].audit_event_id, built.event.audit_event_id);
  assertNoExecutionFlags(list);

  const readResult = helper.readSelectedRuntimeAuditEventV01(
    built.event.audit_event_id,
    db,
  );
  assert.equal(readResult.ok, true);
  assert.equal(readResult.status, "read");
  assert.deepEqual(readResult.event, built.event);
  assertNoExecutionFlags(readResult);
}

function assertSchemaMissing() {
  const db = createDb();
  assert.equal(helper.selectedRuntimeAuditEventSchemaExistsV01(db), false);
  const create = helper.createSelectedRuntimeAuditEventV01(
    fixture.valid_event_input,
    db,
  );
  assert.equal(create.ok, false);
  assert.equal(create.status, "schema_missing");
  assert.equal(create.event, null);
  const readResult = helper.readSelectedRuntimeAuditEventV01(
    fixture.valid_event_input.audit_event_id,
    db,
  );
  assert.equal(readResult.ok, false);
  assert.equal(readResult.status, "schema_missing");
  const list = helper.listSelectedRuntimeAuditEventsV01({}, db);
  assert.equal(list.ok, false);
  assert.equal(list.status, "schema_missing");
}

function assertDuplicateAndConflict() {
  const db = createDb();
  helper.ensureSelectedRuntimeAuditEventSchemaV01(db);
  const first = helper.createSelectedRuntimeAuditEventV01(fixture.valid_event_input, db);
  const duplicate = helper.createSelectedRuntimeAuditEventV01(
    fixture.valid_event_input,
    db,
  );
  assert.equal(first.status, "recorded");
  assert.equal(duplicate.status, "duplicate_event");
  assert.equal(duplicate.event.audit_event_id, first.event.audit_event_id);
  assert.equal(duplicate.event.event_fingerprint, first.event.event_fingerprint);
  const conflicting = helper.createSelectedRuntimeAuditEventV01(
    {
      ...fixture.valid_event_input,
      public_safe_summary:
        "Changed bounded summary for the same selected audit event id.",
    },
    db,
  );
  assert.equal(conflicting.ok, false);
  assert.equal(conflicting.status, "conflicting_event");
  assert.equal(conflicting.event, null);
}

function assertRepresentedBlockedEventKinds() {
  const db = createDb();
  helper.ensureSelectedRuntimeAuditEventSchemaV01(db);
  for (const input of [
    fixture.product_write_attempt_blocked_input,
    fixture.forbidden_authority_claim_blocked_input,
    fixture.private_raw_payload_blocked_input,
  ]) {
    const result = helper.createSelectedRuntimeAuditEventV01(input, db);
    assert.equal(result.ok, true, `${input.event_kind} should record public-safe blocked context`);
    assert.equal(result.status, "recorded");
    assert.equal(result.event.event_kind, input.event_kind);
    assertNoExecutionFlags(result);
    assert.equal(result.event.authority_boundary_snapshot.product_write_now, false);
    assert.equal(result.event.authority_boundary_snapshot.audit_event_is_authority, false);
  }
}

function assertUnsafeMarkerBlocking() {
  for (const marker of fixture.blocked_private_marker_cases) {
    const result = helper.buildSelectedRuntimeAuditEventV01({
      ...fixture.valid_event_input,
      audit_event_id: `runtime-audit:selected:blocked-marker:${safeId(marker)}`,
      public_safe_summary: `Blocked marker ${marker}`,
    });
    assert.equal(result.ok, false, `${marker} must be blocked`);
    assert.equal(result.status, "blocked_private_or_raw_payload");
    assertNoExecutionFlags(result);
    assertNoUnsafeEcho(result, marker);
  }
}

function assertReferenceOnlyMarkerHandling() {
  for (const marker of fixture.reference_only_marker_cases) {
    const result = helper.buildSelectedRuntimeAuditEventV01({
      ...fixture.valid_event_input,
      audit_event_id: `runtime-audit:selected:reference-marker:${safeId(marker)}`,
      linked_record_refs: [marker],
    });
    assert.equal(result.ok, true, `${marker} should be retained as redacted reference-only context`);
    assert.equal(result.status, "recorded");
    assert.equal(result.event.privacy_report.status, "redacted_with_warnings");
    assert.doesNotMatch(JSON.stringify(result), new RegExp(marker));
    assertNoExecutionFlags(result);
  }
}

function assertForbiddenAuthorityBlocking() {
  const structured = helper.buildSelectedRuntimeAuditEventV01({
    ...fixture.valid_event_input,
    audit_event_id: "runtime-audit:selected:structured-authority-block:001",
    authority_boundary_snapshot: {
      product_write_now: true,
    },
  });
  assert.equal(structured.ok, false);
  assert.equal(structured.status, "blocked_forbidden_authority");
  assertNoExecutionFlags(structured);

  for (const testCase of fixture.blocked_forbidden_authority_claim_parts) {
    const claim = `${testCase.subject} is ${testCase.object}.`;
    const result = helper.buildSelectedRuntimeAuditEventV01({
      ...fixture.valid_event_input,
      audit_event_id: `runtime-audit:selected:authority-phrase:${safeId(
        `${testCase.subject}-${testCase.object}`,
      )}`,
      public_safe_summary: claim,
    });
    assert.equal(result.ok, false, `${claim} must be blocked`);
    assert.equal(result.status, "blocked_forbidden_authority");
    assertNoExecutionFlags(result);
    assertNoUnsafeEcho(result, claim);
  }
}

function assertAllowedNegatedBoundaryText() {
  for (const sentence of fixture.allowed_negated_boundary_examples) {
    const result = helper.buildSelectedRuntimeAuditEventV01({
      ...fixture.valid_event_input,
      audit_event_id: `runtime-audit:selected:allowed-negated:${safeId(sentence)}`,
      public_safe_summary: sentence,
    });
    assert.equal(result.ok, true, `${sentence} should be accepted`);
    assert.equal(result.status, "recorded");
    assertNoExecutionFlags(result);
  }
}

function assertReadListBoundaries() {
  const db = createDb();
  helper.ensureSelectedRuntimeAuditEventSchemaV01(db);
  helper.createSelectedRuntimeAuditEventV01(fixture.valid_event_input, db);
  const filtered = helper.listSelectedRuntimeAuditEventsV01(
    {
      event_kind: "git_ledger_packet_candidate_created",
      operator_actor_ref: "operator-ref:augnes-codex",
      selected_surface_ref:
        "runtime-surface:git-ledger-export-manifest-binding-v0-1",
      limit: 5,
    },
    db,
  );
  assert.equal(filtered.ok, true);
  assert.equal(filtered.status, "listed");
  assert.equal(filtered.events.length, 1);
  assert.equal(filtered.event.authority_boundary_snapshot.audit_event_is_truth, false);
  const invalidFilter = helper.listSelectedRuntimeAuditEventsV01(
    { event_kind: "route_request" },
    db,
  );
  assert.equal(invalidFilter.ok, false);
  assert.equal(invalidFilter.status, "rejected");
}

function assertNoExecutionFlags(result) {
  for (const field of fixture.required_false_execution_flags) {
    assert.equal(result[field], false, `result.${field} must be false`);
    if (result.event) {
      assert.notEqual(result.event[field], true, `event.${field} must not be true`);
    }
  }
}

function assertAuthorityBoundary(boundary, label) {
  for (const field of [
    "selected_runtime_audit_event_store_now",
    "caller_injected_local_test_db_only",
    "schema_sql_only",
    "selected_surface_only",
    "caller_provided_public_safe_summary_only",
    "audit_event_core_only",
    "linked_refs_are_reference_only",
  ]) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of [
    "route_now",
    "ui_now",
    "component_now",
    "broad_all_route_instrumentation_now",
    "global_db_config_now",
    "db_migration_now",
    "local_file_write_now",
    "local_file_read_now",
    "import_apply_now",
    "provider_openai_call_now",
    "source_fetch_now",
    "retrieval_execution_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "review_memory_write_now",
    "promotion_execution_now",
    "formation_receipt_write_now",
    "durable_state_apply_now",
    "product_write_now",
    "github_api_call_now",
    "git_write_now",
    "release_deploy_publish_now",
    "audit_event_is_truth",
    "audit_event_is_proof",
    "audit_event_is_approval",
    "audit_event_is_authority",
    "audit_event_is_product_readiness",
    "audit_event_is_release_readiness",
    "audit_event_fingerprint_is_proof",
    "audit_event_fingerprint_is_approval",
    "validation_pass_is_approval",
    "validation_failure_is_rejection",
    "ci_pass_is_authority",
    "skipped_checks_are_automatic_failure",
    "known_warnings_are_automatic_rejection",
    "not_done_items_are_automatic_task_creation",
    "expected_observed_delta_is_approval_or_rejection",
  ]) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertNoUnsafeEcho(value, marker) {
  const serialized = JSON.stringify(value);
  assert.ok(!serialized.includes(marker), `blocked output must not echo ${marker}`);
  assert.doesNotMatch(serialized, /SAFE_MARKER_RAW_/);
  assert.doesNotMatch(serialized, /SAFE_MARKER_HIDDEN_REASONING/);
  assert.doesNotMatch(serialized, /SAFE_MARKER_CREDENTIAL/);
  assert.doesNotMatch(serialized, /SAFE_MARKER_SECRET/);
}

function assertChangedFileScope() {
  const changedFiles = getChangedFiles();
  assert.ok(changedFiles.length > 0, "changed-file scope must inspect a non-empty delta");
  for (const filePath of changedFiles) {
    assert.ok(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.ok(!filePath.startsWith("components/"), `No component files allowed: ${filePath}`);
    assert.ok(!filePath.startsWith("app/"), `No route files allowed: ${filePath}`);
    assert.ok(!filePath.includes("/migrations/"), `No migration files allowed: ${filePath}`);
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
    for (const line of output.split(/\r?\n/)) {
      if (line.trim()) candidates.add(line.trim());
    }
  }
  return [...candidates].sort();
}

function createDb() {
  return new Database(":memory:");
}

function safeId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function includesNormalized(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}

function read(path) {
  return readFileSync(path, "utf8");
}
