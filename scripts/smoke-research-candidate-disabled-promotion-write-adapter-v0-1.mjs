import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-disabled-promotion-write-adapter.ts";
const routePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/disabled-promotion-write-adapter-readiness/route.ts";
const componentPath =
  "components/research-candidate-disabled-promotion-write-adapter-readout.tsx";
const tempHarnessComponentPath =
  "components/research-candidate-disabled-adapter-temp-harness-readout.tsx";
const designPanelPath =
  "components/research-candidate-dry-run-candidate-review-design-panel.tsx";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-promotion-write-adapter-readiness.sample.v0.1.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  helperPath,
  routePath,
  componentPath,
  tempHarnessComponentPath,
  designPanelPath,
  fixturePath,
  docsIndexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const route = readFileSync(routePath, "utf8");
const component = readFileSync(componentPath, "utf8");
const tempHarnessComponent = readFileSync(tempHarnessComponentPath, "utf8");
const designPanel = readFileSync(designPanelPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertRouteContract();
assertComponentContract();
assertFixtureContract();
assertDocsAndPackagePointers();
assertNoSchemaMigrationDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-disabled-promotion-write-adapter-v0-1",
      helper_exists: true,
      route_exists_post_only: true,
      component_exists: true,
      fixture_exists_and_parses: true,
      package_script_checked: true,
      docs_pointer_checked: true,
      disabled_route_contract_checked: true,
      disabled_helper_contract_checked: true,
      disabled_ui_checked: true,
      no_write_patterns_checked: true,
      no_schema_migration_references: true,
      no_dependency_added: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_VERSION",
    "manual_note_disabled_promotion_write_adapter.v0.1",
    "MANUAL_NOTE_DISABLED_PROMOTION_WRITE_ADAPTER_READINESS_KIND",
    "manual_note_disabled_promotion_write_adapter_readiness",
    "buildManualNoteDisabledPromotionWriteAdapterReadiness",
    "buildManualNoteDisabledPromotionWriteAdapterBoundary",
    "buildManualNoteDisabledPromotionWriteAdapterAuthority",
    "buildManualNoteDisabledPromotionWriteAdapterMarkdown",
    "buildManualNoteDisabledPromotionWriteAdapterJson",
    "createManualNoteDisabledPromotionWriteAdapterFingerprint",
    "validateManualNoteAuthorityDesignPacketForDisabledAdapter",
    "adapter_status: \"disabled_by_default\"",
    "write_execution_status: \"not_executable\"",
    "Actual promotion write execution is intentionally disabled in this skeleton.",
    "actual_write_route_added: true",
    "actual_write_route_enabled: false",
    "write_adapter_implemented: \"disabled_skeleton_only\"",
    "write_execution_enabled: false",
    "normal_product_write_enabled: false",
    "proof_or_evidence_writes: false",
    "perspective_or_canonical_writes: false",
    "canonical_graph_write: false",
    "work_item_creation: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "external_handoff_sent: false",
    "adapter_readiness_persisted: false",
    "browser_persistence: false",
    "idempotency_key_generated_now: false",
    "idempotency_storage_added: false",
    "rollback_implemented_now: false",
    "rollback_storage_added: false",
    "audit_record_created_now: false",
    "approval_history_created_now: false",
    "local_clipboard_only: true",
    "packet_persisted: false",
    "promotion_authority_granted: false",
    "disabled_adapter_contract_review_and_temp_execution_harness",
    "0x811c9dc5",
    "0x01000193",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertRouteContract() {
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /export const dynamic = "force-dynamic"/);
  assert.match(route, /export async function POST\(/);
  for (const forbiddenHandler of ["GET", "PATCH", "PUT", "DELETE"]) {
    assert.doesNotMatch(
      route,
      new RegExp(`export\\s+async\\s+function\\s+${forbiddenHandler}\\s*\\(`),
      `route must not export ${forbiddenHandler}`,
    );
  }

  for (const requiredText of [
    "disabled-promotion-write-adapter-readiness",
    "PREVIEW_DRAFT_ID_PATTERN",
    "validatePreviewDraftId(previewDraftId)",
    "parseScope(url.searchParams.get(\"scope\"))",
    "scope must be project:augnes when provided.",
    "readBoundedJsonBody(request)",
    "MAX_MANUAL_NOTE_BODY_BYTES",
    "authority_design_packet is required.",
    "preview_draft_id must match the route preview_draft_id.",
    "candidate_review_packet_fingerprint",
    "operator_intent_label",
    "buildManualNoteDisabledPromotionWriteAdapterReadiness",
    "ManualNoteDisabledPromotionWriteAdapterValidationError",
    "NextResponse.json",
  ]) {
    assert.ok(route.includes(requiredText), `route must include ${requiredText}`);
  }
}

function assertComponentContract() {
  assert.ok(
    designPanel.includes("DisabledPromotionWriteAdapterReadout"),
    "dry-run candidate review/design panel must import/render disabled adapter readout",
  );
  assert.ok(
    normalizedIncludes(
      designPanel,
      "<DisabledPromotionWriteAdapterReadout previewDraftId={packet.source_candidate_review_packet.preview_draft_id} authorityDesignPacket={packet} />",
    ),
    "disabled adapter readout must render after authority design packet exists",
  );

  for (const requiredText of [
    "DisabledAdapterTempHarnessReadout",
    "<DisabledAdapterTempHarnessReadout readiness={currentReadiness} />",
    "Disabled adapter skeleton only.",
    "This does not perform actual promotion.",
    "Normal product writes are disabled.",
    "No proof/evidence, Perspective, canonical graph, or work item records are created.",
    "No provider, retrieval, source fetch, or external handoff is performed.",
    "Adapter readiness is not approval and not write authority.",
    "Check disabled adapter readiness",
    "Refresh disabled adapter readiness",
    "Copy disabled adapter Markdown",
    "Copy disabled adapter JSON",
    "adapter_status",
    "write_execution_status",
    "Validation summary",
    "Disabled write contract",
    "Write target mapping skeleton summary",
    "Idempotency skeleton",
    "Rollback skeleton",
    "Review audit skeleton",
    "Execution boundary",
    "Local copy boundary",
    "data-adapter-readiness-persisted=\"false\"",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must include ${requiredText}`,
    );
  }

  assertOrdered(component, [
    "useEffect(() => {",
    "setReadiness(null)",
    "setIsLoading(false)",
    "setError(null)",
    "setCopyState(EMPTY_COPY_STATE)",
    "}, [packetIdentity])",
  ]);

  for (const requiredText of [
    "copyState.previewDraftId === previewDraftId",
    "copyState.readinessFingerprint ===",
    "currentReadiness.local_copy_packet.fingerprint",
    "readinessFingerprint: currentReadiness.local_copy_packet.fingerprint",
    "currentCopyState?.message",
    "currentCopyState?.fallbackText",
    "value={currentCopyState.fallbackText}",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must key copy fallback by readiness fingerprint and preview draft with ${requiredText}`,
    );
  }

  for (const requiredText of [
    "Temp harness only.",
    "Review disabled adapter contract",
    "Build temp harness simulation",
    "Copy contract review Markdown",
    "Copy temp harness JSON",
    "data-temp-harness-persisted=\"false\"",
  ]) {
    assert.ok(
      normalizedIncludes(tempHarnessComponent, requiredText),
      `temp harness component must include ${requiredText}`,
    );
  }
}

function assertFixtureContract() {
  assert.equal(
    fixture.adapter_kind,
    "manual_note_disabled_promotion_write_adapter_readiness",
  );
  assert.equal(
    fixture.adapter_version,
    "manual_note_disabled_promotion_write_adapter.v0.1",
  );
  assert.equal(fixture.adapter_status, "disabled_by_default");
  assert.equal(fixture.write_execution_status, "not_executable");
  assert.equal(
    fixture.source_authority_design.packet_kind,
    "manual_note_authority_gated_promotion_design_packet",
  );
  assert.equal(
    fixture.next_recommended_slice,
    "disabled_adapter_contract_review_and_temp_execution_harness",
  );

  for (const key of [
    "design_packet_present",
    "preview_draft_id_matches_route",
    "proposed_write_contract_present",
    "execution_boundary_present",
    "all_required_false_write_flags_present",
    "blocking_requirements_present",
    "idempotency_design_present",
    "rollback_design_present",
    "review_audit_design_present",
    "source_evidence_authority_design_present",
  ]) {
    assert.equal(fixture.validation_summary[key], true, `${key} must be true`);
  }

  for (const [field, expectedValue] of Object.entries({
    actual_write_route_added: true,
    actual_write_route_enabled: false,
    write_adapter_implemented: "disabled_skeleton_only",
    write_execution_enabled: false,
    normal_product_write_enabled: false,
    requires_future_explicit_operator_decision: true,
    requires_future_source_verification_authority: true,
    requires_future_proof_evidence_write_authority: true,
    requires_future_canonical_perspective_write_authority: true,
    requires_future_idempotency_contract: true,
    requires_future_rollback_contract: true,
    requires_future_audit_record_contract: true,
  })) {
    assert.equal(
      fixture.disabled_write_contract[field],
      expectedValue,
      `disabled_write_contract.${field} must be ${expectedValue}`,
    );
  }

  assert.ok(
    fixture.write_target_mapping_skeleton.claim_write_targets.length >= 1,
  );
  assert.ok(
    fixture.write_target_mapping_skeleton.evidence_write_targets.length >= 1,
  );
  assert.ok(
    fixture.write_target_mapping_skeleton.perspective_write_targets.length >= 1,
  );
  assert.ok(
    fixture.write_target_mapping_skeleton.source_verification_targets.length >= 1,
  );
  assert.ok(fixture.write_target_mapping_skeleton.work_item_targets.length >= 1);
  assert.equal(fixture.idempotency_skeleton.idempotency_required, true);
  assert.equal(
    fixture.idempotency_skeleton.idempotency_key_generated_now,
    false,
  );
  assert.equal(fixture.idempotency_skeleton.idempotency_storage_added, false);
  assert.equal(fixture.rollback_skeleton.rollback_required, true);
  assert.equal(fixture.rollback_skeleton.rollback_implemented_now, false);
  assert.equal(fixture.rollback_skeleton.rollback_storage_added, false);
  assert.equal(fixture.review_audit_skeleton.audit_record_required, true);
  assert.equal(fixture.review_audit_skeleton.audit_record_created_now, false);
  assert.equal(
    fixture.review_audit_skeleton.approval_history_created_now,
    false,
  );

  for (const [field, expectedValue] of Object.entries({
    disabled_adapter_only: true,
    design_packet_read_only: true,
    normal_product_write_enabled: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    adapter_readiness_persisted: false,
    browser_persistence: false,
  })) {
    assert.equal(
      fixture.execution_boundary[field],
      expectedValue,
      `execution_boundary.${field} must be ${expectedValue}`,
    );
  }

  for (const [field, expectedValue] of Object.entries({
    local_clipboard_only: true,
    external_handoff_sent: false,
    packet_persisted: false,
    promotion_authority_granted: false,
    actual_promotion_allowed: false,
  })) {
    assert.equal(
      fixture.local_copy_packet[field],
      expectedValue,
      `local_copy_packet.${field} must be ${expectedValue}`,
    );
  }
  assert.match(fixture.local_copy_packet.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    fixture.local_copy_packet.fingerprint_algorithm,
    "fnv1a32_canonical_json",
  );

  assertNoRawOrExternalFixtureText(fixtureText);
  assertNoActualWriteIds(fixture, fixturePath);
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-disabled-promotion-write-adapter-v0-1"
    ],
    "node scripts/smoke-research-candidate-disabled-promotion-write-adapter-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note disabled-by-default actual promotion write adapter skeleton",
    helperPath,
    "POST /api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/disabled-promotion-write-adapter-readiness",
    componentPath,
    fixturePath,
    "npm run smoke:research-candidate-disabled-promotion-write-adapter-v0-1",
    "disabled readiness route",
    "operator-visible disabled adapter readiness readout",
    "disabled skeleton only",
    "no normal product write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no adapter readiness persistence",
    "no schema/migration code",
    "no dependency",
    "best available method",
    "not a Playwright-only assumption",
  ]) {
    assert.ok(
      normalizedIncludes(docsIndex, requiredText),
      `docs index must include ${requiredText}`,
    );
  }
}

function assertNoSchemaMigrationDependencyExpansion() {
  for (const filePath of listFiles(".")) {
    if (!/(migration|migrations|schema)/i.test(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    assert.ok(
      !/disabled_promotion_write_adapter|disabled-promotion-write-adapter-readiness|adapter_readiness/i.test(
        text,
      ),
      `schema/migration file must not reference this slice: ${filePath}`,
    );
  }

  for (const dependencyName of [
    "playwright",
    "@playwright/test",
    "openai",
    "@openai/agents",
  ]) {
    assert.ok(
      !Object.hasOwn(packageJson.dependencies ?? {}, dependencyName) &&
        !Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName),
      `package must not add dependency ${dependencyName}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  const inspected = [
    [helperPath, helper],
    [routePath, route],
    [componentPath, component],
    [tempHarnessComponentPath, tempHarnessComponent],
    [designPanelPath, designPanel],
  ];

  for (const [filePath, text] of inspected) {
    for (const forbiddenActionLabel of [
      "Promote",
      "Approve",
      "Reject",
      "Defer",
      "Execute write",
      "Create proof",
      "Create evidence",
      "Create work item",
      "Send handoff",
      "Fetch source",
      "Run provider",
      "Publish",
      "Fix all",
    ]) {
      assert.ok(
        !text.includes(forbiddenActionLabel),
        `${filePath} must not include forbidden action label ${forbiddenActionLabel}`,
      );
    }

    for (const storagePattern of [
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bindexedDB\b/,
      /\bdocument\.cookie\b/,
    ]) {
      assert.doesNotMatch(
        text,
        storagePattern,
        `${filePath} must not use browser persistence`,
      );
    }

    const importLines = text.match(/^import .*$/gm) ?? [];
    for (const importLine of importLines) {
      assert.doesNotMatch(
        importLine,
        /provider|openai|retrieval|rag|source-fetch|source_fetch|proof\/write|evidence\/write|work-item|perspective.*write/i,
        `${filePath} must not import forbidden write/provider modules: ${importLine}`,
      );
    }
  }

  for (const [filePath, text] of [
    [helperPath, helper],
    [routePath, route],
  ]) {
    for (const [label, pattern] of [
      ["fetch call", /\bfetch\s*\(/],
      ["openDatabase call", /\bopenDatabase\s*\(/],
      ["INSERT statement", /\bINSERT\b/i],
      ["UPDATE statement", /\bUPDATE\b/i],
      ["DELETE statement", /\bDELETE\b/i],
      ["CREATE TABLE statement", /\bCREATE\s+TABLE\b/i],
      ["ALTER TABLE statement", /\bALTER\s+TABLE\b/i],
      ["DROP TABLE statement", /\bDROP\s+TABLE\b/i],
    ]) {
      assert.ok(!pattern.test(text), `${filePath} must not include ${label}`);
    }
  }

  assert.match(
    component,
    /fetch\s*\(\s*\n\s*buildDisabledAdapterReadinessRoute\(previewDraftId\)/,
    "component may fetch only the same-origin disabled readiness route builder",
  );
  assert.doesNotMatch(
    component,
    /https?:\/\//,
    "component must not introduce external URLs",
  );
}

function assertNoRawOrExternalFixtureText(text) {
  for (const forbiddenText of [
    "Research Question:",
    "Operator Intent:",
    "Source Title:",
    "manual_note_text:",
    "raw_manual_note",
    "AUGNES_DB_PATH",
    "http://",
    "https://",
  ]) {
    assert.ok(!text.includes(forbiddenText), `fixture must not include ${forbiddenText}`);
  }
}

function assertNoActualWriteIds(value, sourcePath, keyPath = []) {
  if (value === null || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoActualWriteIds(item, sourcePath, [...keyPath, String(index)]),
    );
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...keyPath, key];
    if (
      [
        "proof_id",
        "evidence_id",
        "perspective_id",
        "work_item_id",
        "canonical_graph_edge_id",
        "canonical_claim_id",
      ].includes(key)
    ) {
      assert.equal(
        child,
        null,
        `${sourcePath} ${nextPath.join(".")} must stay null`,
      );
    }
    assertNoActualWriteIds(child, sourcePath, nextPath);
  }
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root)) {
    if (entry === ".git" || entry === "node_modules" || entry === ".next") {
      continue;
    }
    const filePath = path.join(root, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      results.push(...listFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

function assertOrdered(source, snippets) {
  let cursor = -1;
  for (const snippet of snippets) {
    const index = source.indexOf(snippet, cursor + 1);
    assert.notEqual(
      index,
      -1,
      `expected ${snippet} after offset ${cursor} in:\n${source}`,
    );
    cursor = index;
  }
}

function normalizedIncludes(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}
