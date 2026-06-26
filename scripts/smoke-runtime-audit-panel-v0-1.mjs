#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const dogfoodingDocsPath = "docs/DOGFOODING_INGESTION_RUNTIME_V0_1.md";
const docsPath = "docs/RUNTIME_AUDIT_PANEL_V0_1.md";
const helperPath = "lib/runtime-audit/build-runtime-audit-model.ts";
const componentPath = "components/runtime-audit-panel.tsx";
const fixturePath = "fixtures/runtime-audit-panel.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const builderVersion = "runtime_audit_model_builder.v0.1";
const panelVersion = "runtime_audit_panel.v0.1";
const itemVersion = "runtime_audit_item.v0.1";
const sectionVersion = "runtime_audit_section.v0.1";
const fixtureVersion = "runtime_audit_panel.sample.v0.1";
const scope = "project:augnes";
const packageSmokeScriptName = "smoke:runtime-audit-panel-v0-1";
const packageSmokeScriptValue = "node scripts/smoke-runtime-audit-panel-v0-1.mjs";
const packageBrowserScriptName = "browser:runtime-audit-panel-v0-1";
const packageBrowserScriptValue =
  "node scripts/browser-validate-runtime-audit-panel-v0-1.mjs";

const sectionKinds = [
  "authority_boundary",
  "route_boundary",
  "store_boundary",
  "state_mutation_boundary",
  "product_write_boundary",
  "provider_retrieval_boundary",
  "dogfooding_boundary",
  "feedback_boundary",
  "perspective_state_boundary",
  "layout_boundary",
  "verification_boundary",
  "privacy_boundary",
  "unknown",
];

const severities = ["info", "warning", "blocked", "critical", "unknown"];

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Runtime Audit Panel is read-only.",
  "Runtime Audit Panel is a review surface, not source of truth.",
  "Audit is a review cue, not truth.",
  "Audit is not proof.",
  "Audit is not authority.",
  "Verification is not proof.",
  "Smoke pass is not truth.",
  "CI pass is not truth.",
  "Runtime Audit Panel does not write DB.",
  "Runtime Audit Panel does not call routes.",
  "Runtime Audit Panel does not fetch data.",
  "Runtime Audit Panel does not mutate durable Perspective state.",
  "Runtime Audit Panel does not write Formation Receipts.",
  "Runtime Audit Panel does not promote Perspective.",
  "Runtime Audit Panel does not create proof/evidence.",
  "Runtime Audit Panel does not write claim/evidence records.",
  "Runtime Audit Panel does not product-write.",
  "Dogfooding records are bounded review records.",
  "Feedback aggregation is advisory only.",
  "Manual anchors are display hints.",
  "Durable state apply is not product-write.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Unknown or extra input fields are also scanned for private/raw/secret-like markers.",
  "Unknown fields cannot be used to carry raw conversation, hidden reasoning, telemetry, secrets, private paths, or private URLs through the audit builder.",
  "Token-like secret markers are detected case-insensitively without treating ordinary words such as risk-reduction or task-level as secrets.",
  "Public-safe audit language must not be blocked merely because it contains the letters \"sk-\" inside a normal word.",
  "roadmap guide is not SSOT",
];

const fixtureForbiddenMarkers = [
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
  "raw provider output",
  "raw retrieval output",
  "raw dogfooding payload",
  "raw audit payload",
  "raw conversation",
  "hidden reasoning",
  "telemetry dump",
  "browser dump",
  "raw browser dump",
  "raw DB row",
  "raw_db_row",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
];

const allowedFixturePlaceholders = [
  "raw audit payload blocked by fixture",
  "raw conversation blocked by audit fixture",
  "hidden reasoning blocked by audit fixture",
  "telemetry dump blocked by audit fixture",
  "secret-like audit input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "runtime_audit_persistence_now: true",
  "audit_write_route_now: true",
  "audit_read_route_now: true",
  "db_query_or_write_now: true",
  "route_call_now: true",
  "fetch_now: true",
  "durable_state_write_now: true",
  "durable_state_apply_now: true",
  "formation_receipt_write_now: true",
  "promotion_execution_now: true",
  "promotion_decision_record_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "product_write_now: true",
  "product_id_allocation_now: true",
  "candidate_mutation_now: true",
  "candidate_deletion_now: true",
  "rule_mutation_now: true",
  "parser_mutation_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "browser_log_ingestion_now: true",
  "session_log_ingestion_now: true",
  "raw_conversation_ingestion_now: true",
  "telemetry_ingestion_now: true",
  "git_ledger_export_now: true",
  "github_automation_authority: true",
  "audit_is_truth: true",
  "audit_is_proof: true",
  "audit_is_authority: true",
  "verification_is_truth: true",
  "smoke_pass_is_truth: true",
  "ci_pass_is_truth: true",
];

const indexForbiddenImplications = [
  "audit persistence was added",
  "routes were added",
  "DB write was added",
  "fetch was added",
  "state mutation was added",
  "proof/evidence writes were added",
  "product-write was added",
  "Git Ledger export was added",
  "provider calls were added",
  "retrieval/RAG was added",
  "source fetch was added",
  "browser log ingestion was added",
  "session log ingestion was added",
  "raw conversation ingestion was added",
  "telemetry ingestion was added",
  "GitHub automation was added",
];

const roadmapText = readText(roadmapPath);
const dogfoodingDocsText = readText(dogfoodingDocsPath);
const docsText = readText(docsPath);
const helperText = readText(helperPath);
const componentText = readText(componentPath);
const fixtureText = readText(fixturePath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const fixture = JSON.parse(fixtureText);

const helper = await import(pathToFileURL(`${process.cwd()}/${helperPath}`).href);

assertIncludes(roadmapText, "runtime_audit_panel_v0_1", "roadmap contains runtime audit slice");
assertIncludes(
  dogfoodingDocsText,
  "Dogfooding Ingestion Runtime ingests bounded summaries only.",
  dogfoodingDocsPath,
);

assertFixtureVersions();
assertStaticFiles();
assertHelperBehavior();
assertComponentStaticChecks();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();
assertNoOutputStoresRawMarkers();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "runtime-audit-panel-v0-1",
      builder_version: builderVersion,
      sections: fixture.expected_model.sections.length,
      items: fixture.expected_model.all_items.length,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.builder_version, builderVersion);
  assert.equal(fixture.panel_version, panelVersion);
  assert.equal(fixture.item_version, itemVersion);
  assert.equal(fixture.section_version, sectionVersion);
  assert.equal(fixture.scope, scope);
  assert.deepEqual(fixture.source_fixture_refs, [
    "fixtures/dogfooding-ingestion-runtime.sample.v0.1.json",
    "fixtures/dogfooding-record-runtime-contract.sample.v0.1.json",
    "fixtures/feedback-influenced-surfacing-preview.sample.v0.1.json",
    "fixtures/durable-perspective-state-apply.sample.v0.1.json",
  ]);
}

function assertStaticFiles() {
  for (const text of [
    "RuntimeAuditInputItem",
    "RuntimeAuditInput",
    "RuntimeAuditItem",
    "RuntimeAuditSection",
    "RuntimeAuditModel",
    "RuntimeAuditValidationResult",
    "buildRuntimeAuditModelV01",
    "validateRuntimeAuditInputV01",
    "validateRuntimeAuditInputItemV01",
    "createRuntimeAuditAuthorityBoundaryV01",
    "createRuntimeAuditFingerprintV01",
  ]) {
    assertIncludes(helperText, text, `helper export ${text}`);
  }
  assertIncludes(helperText, "const normalizedValue = value.toLowerCase()", "case-insensitive values");
  assertIncludes(helperText, "marker.toLowerCase()", "case-insensitive markers");
  assertIncludes(helperText, "const tokenLikePatterns", "token-like marker patterns");
  assertIncludes(helperText, "\\bsk-", "token-like sk marker pattern");
  assertIncludes(helperText, "\\bghp_", "token-like ghp marker pattern");
  assertIncludes(helperText, "function includesPlainMarker", "plain marker helper");
  assertIncludes(helperText, "function includesTokenLikeMarker", "token-like marker helper");
  assertIncludes(helperText, "function collectUnsafeObjectFailures", "recursive unsafe object scan");
  assertIncludes(
    helperText,
    "collectUnsafeObjectFailures(input, \"input\")",
    "top-level recursive unsafe scan",
  );
  assertIncludes(
    helperText,
    "collectUnsafeObjectFailures(item, \"input_item\")",
    "item-level recursive unsafe scan",
  );
  const plainMarkerBlock = helperText.match(
    /const privateOrRawMarkers = \[([\s\S]*?)\] as const;/,
  );
  assert.ok(plainMarkerBlock, "plain marker block must be parseable");
  assertNotIncludes(plainMarkerBlock[1], "\"sk-\"", "plain markers must not include sk-");
  assertNotIncludes(plainMarkerBlock[1], "\"ghp_\"", "plain markers must not include ghp_");
  for (const forbidden of [
    "from \"node:fs\"",
    "from 'node:fs'",
    "from \"next/server\"",
    "from 'next/server'",
    "from \"better-sqlite3\"",
    "from 'better-sqlite3'",
    "from \"openai\"",
    "from 'openai'",
    "from \"@octokit",
    "from '@octokit",
    "Database",
    "NextResponse",
    "OpenAI",
    "fetch(",
    "GitHub automation",
    "route.ts",
  ]) {
    assertNotIncludes(helperText, forbidden, `${helperPath} forbidden helper import ${forbidden}`);
  }
  assert.doesNotMatch(
    helperText,
    /from ["'][^"']*provider[^"']*["']/,
    `${helperPath} must not import provider modules`,
  );
  assert.equal(packageJson.scripts[packageSmokeScriptName], packageSmokeScriptValue);
  assert.equal(packageJson.scripts[packageBrowserScriptName], packageBrowserScriptValue);
}

function assertHelperBehavior() {
  const validation = helper.validateRuntimeAuditInputV01(fixture.expected_valid_input);
  assert.equal(validation.passed, true, "valid audit input should validate");

  const result = helper.buildRuntimeAuditModelV01(fixture.expected_valid_input);
  assert.deepEqual(result, fixture.expected_model);
  assert.deepEqual(helper.buildRuntimeAuditModelV01(fixture.expected_valid_input), result);
  assert.equal(result.status, "built");
  assert.equal(result.all_items.length, 13);
  assert.equal(result.sections.length, 13);
  assert.equal(
    helper.buildRuntimeAuditModelV01(fixture.expected_valid_input).audit_fingerprint,
    result.audit_fingerprint,
    "repeated build produces same audit_fingerprint",
  );

  const empty = helper.buildRuntimeAuditModelV01(fixture.expected_empty_input);
  assert.deepEqual(empty, fixture.expected_empty_model);
  assert.equal(empty.status, "empty");
  assert.equal(empty.all_items.length, 0);
  assert.equal(empty.sections.length, 0);

  assert.deepEqual(
    result.sections.map((section) => section.section_kind),
    sectionKinds,
    "all section kinds covered and sorted",
  );
  for (const severity of severities) {
    assert.ok(
      result.all_items.some((item) => item.severity === severity),
      `severity covered ${severity}`,
    );
  }

  for (const [key, invalidInput] of Object.entries(fixture.invalid_inputs)) {
    const rejection = helper.buildRuntimeAuditModelV01(invalidInput);
    assert.deepEqual(rejection, fixture.expected_rejection_results[key], `${key} rejection`);
    assert.equal(rejection.all_items.length, 0, `${key} must not build items`);
    assert.equal(rejection.sections.length, 0, `${key} must not build sections`);
    assert.equal(rejection.authority_boundary.product_write_now, false, `${key} product write`);
    assert.equal(rejection.authority_boundary.durable_state_write_now, false, `${key} state write`);
    assert.equal(rejection.authority_boundary.proof_or_evidence_record_now, false, `${key} proof`);
  }
  for (const { label, reasonCode, unsafeValue, apply } of unknownUnsafeCases()) {
    const unsafeInput = cloneJson(fixture.expected_valid_input);
    unsafeInput.audit_id = `runtime-audit:dynamic:${label}`;
    apply(unsafeInput, unsafeValue);
    const rejection = helper.buildRuntimeAuditModelV01(unsafeInput);
    assert.equal(rejection.status, "blocked_private_or_raw_payload", `${label} status`);
    assert.equal(rejection.all_items.length, 0, `${label} must not build items`);
    assert.equal(rejection.sections.length, 0, `${label} must not build sections`);
    assert.ok(rejection.reason_codes.includes(reasonCode), `${label} reason ${reasonCode}`);
    assert.ok(
      !JSON.stringify(rejection).includes(unsafeValue),
      `${label} blocked output must not echo unsafe value`,
    );
    assert.equal(rejection.authority_boundary.product_write_now, false, `${label} product write`);
    assert.equal(rejection.authority_boundary.durable_state_write_now, false, `${label} state`);
    assert.equal(
      rejection.authority_boundary.proof_or_evidence_record_now,
      false,
      `${label} proof`,
    );
  }
  for (const { label, summary } of publicSafeTokenPrefixWordCases()) {
    const safeInput = cloneJson(fixture.expected_valid_input);
    safeInput.audit_id = `runtime-audit:dynamic:${label}`;
    safeInput.input_items[0].bounded_summary = summary;
    const built = helper.buildRuntimeAuditModelV01(safeInput);
    assert.equal(built.status, "built", `${label} must remain public-safe`);
    assert.equal(built.blocked_item_refs.length, 0, `${label} blocked refs`);
    assert.ok(
      built.all_items.some((item) => item.bounded_summary === summary),
      `${label} summary present`,
    );
    assertAuthorityBoundary(built.authority_boundary, label);
  }
  for (const { label, unsafeValue, apply } of tokenLikeUnsafeCases()) {
    const unsafeInput = cloneJson(fixture.expected_valid_input);
    unsafeInput.audit_id = `runtime-audit:dynamic:${label}`;
    apply(unsafeInput, unsafeValue);
    const rejection = helper.buildRuntimeAuditModelV01(unsafeInput);
    assert.equal(rejection.status, "blocked_private_or_raw_payload", `${label} status`);
    assert.equal(rejection.all_items.length, 0, `${label} must not build items`);
    assert.equal(rejection.sections.length, 0, `${label} must not build sections`);
    assert.ok(
      rejection.reason_codes.includes("private_or_raw_payload_blocked"),
      `${label} private marker reason`,
    );
    assert.ok(
      !JSON.stringify(rejection).includes(unsafeValue),
      `${label} blocked output must not echo token-like value`,
    );
    assert.equal(rejection.authority_boundary.product_write_now, false, `${label} product write`);
    assert.equal(rejection.authority_boundary.fetch_now, false, `${label} fetch`);
    assert.equal(rejection.authority_boundary.db_query_or_write_now, false, `${label} db`);
  }
  assert.equal(
    fixture.expected_rejection_results.private_raw_payload.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.raw_conversation_marker.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.hidden_reasoning_marker.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.telemetry_marker.status,
    "blocked_private_or_raw_payload",
  );
  assert.equal(
    fixture.expected_rejection_results.public_safe_false_item.status,
    "blocked_invalid_input",
  );
  assert.equal(
    fixture.expected_rejection_results.forbidden_authority.status,
    "blocked_invalid_input",
  );
  for (const [key, reasonCode] of Object.entries({
    unknown_top_level_raw_conversation: "raw_conversation_blocked",
    unknown_top_level_secret: "secret_like_pattern_blocked",
    unknown_item_hidden_reasoning: "hidden_reasoning_blocked",
    unknown_item_nested_telemetry: "telemetry_dump_blocked",
    unknown_item_nested_array_secret: "secret_like_pattern_blocked",
    unknown_authority_boundary_private_key: "secret_like_pattern_blocked",
  })) {
    const rejection = fixture.expected_rejection_results[key];
    assert.equal(rejection.status, "blocked_private_or_raw_payload", `${key} status`);
    assert.equal(rejection.sections.length, 0, `${key} sections`);
    assert.equal(rejection.all_items.length, 0, `${key} all_items`);
    assert.ok(rejection.reason_codes.includes(reasonCode), `${key} reason ${reasonCode}`);
    assert.equal(rejection.authority_boundary.product_write_now, false, `${key} product write`);
    assert.equal(rejection.authority_boundary.fetch_now, false, `${key} fetch`);
    assert.equal(rejection.authority_boundary.db_query_or_write_now, false, `${key} db`);
  }

  assert.ok(
    fixture.expected_rejection_results.raw_conversation_marker.reason_codes.includes(
      "raw_conversation_blocked",
    ),
    "raw conversation marker reason",
  );
  assert.ok(
    fixture.expected_rejection_results.hidden_reasoning_marker.reason_codes.includes(
      "hidden_reasoning_blocked",
    ),
    "hidden reasoning marker reason",
  );
  assert.ok(
    fixture.expected_rejection_results.telemetry_marker.reason_codes.includes(
      "telemetry_dump_blocked",
    ),
    "telemetry marker reason",
  );

  for (const item of result.all_items) {
    assert.equal(item.public_safe, true, `${item.item_id}.public_safe`);
    assertAuthorityBoundary(item.authority_boundary, item.item_id);
  }
  assertAuthorityBoundary(result.authority_boundary, "model");
}

function assertComponentStaticChecks() {
  for (const label of [
    "Runtime Audit Panel is read-only",
    "Audit is a review cue, not truth",
    "Verification is not proof",
    "No state mutation",
    "No product write",
    "Product-write remains parked",
  ]) {
    assertIncludes(componentText, label, `${componentPath} label ${label}`);
  }
  for (const forbidden of [
    "fetch(",
    "/api/",
    "POST",
    "localStorage",
    "sessionStorage",
    "NextResponse",
    "Database",
    "OpenAI",
    "provider",
    "<button",
    "Save",
    "Apply",
    "Promote",
    "Delete",
    "Product write executed",
    "product_write_now: true",
  ]) {
    assertNotIncludes(componentText, forbidden, `${componentPath} forbidden marker ${forbidden}`);
  }
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) {
    assertIncludes(docsText, phrase, `docs exact phrase ${phrase}`);
  }
  for (const source of [docsText, indexText, componentText]) {
    for (const forbidden of forbiddenPositiveAuthorityGrants) {
      assertNotIncludes(source, forbidden, `forbidden grant ${forbidden}`);
    }
  }
}

function assertIndexCoverage() {
  for (const path of [
    docsPath,
    helperPath,
    componentPath,
    fixturePath,
    "scripts/smoke-runtime-audit-panel-v0-1.mjs",
    "scripts/browser-validate-runtime-audit-panel-v0-1.mjs",
  ]) {
    assertIncludes(indexText, path, `index pointer ${path}`);
  }
  assertIncludes(indexText, "read-only audit panel", "index read-only audit panel");
  assertIncludes(indexText, "review cue not truth", "index review cue not truth");
  assertIncludes(indexText, "Product-write remains parked by #686.", "index product-write parked");
  for (const forbidden of indexForbiddenImplications) {
    assertNotIncludes(indexText, forbidden, indexPath);
  }
}

function assertFixturePrivacy() {
  let sanitized = fixtureText;
  for (const allowed of allowedFixturePlaceholders) {
    sanitized = sanitized.split(allowed).join("");
  }
  for (const marker of fixtureForbiddenMarkers) {
    assertNotIncludes(sanitized, marker, `fixture privacy marker ${marker}`);
  }
}

function assertNoOutputStoresRawMarkers() {
  const outputText = JSON.stringify({
    expected_model: fixture.expected_model,
    expected_empty_model: fixture.expected_empty_model,
    expected_rejection_results: fixture.expected_rejection_results,
  });
  for (const marker of fixtureForbiddenMarkers) {
    assertNotIncludes(outputText, marker, `output privacy marker ${marker}`);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.runtime_audit_panel_now, true, `${label}.runtime_audit_panel_now`);
  assert.equal(boundary.read_only_audit_view_now, true, `${label}.read_only_audit_view_now`);
  for (const field of [
    "runtime_audit_persistence_now",
    "audit_write_route_now",
    "audit_read_route_now",
    "db_query_or_write_now",
    "route_call_now",
    "fetch_now",
    "durable_state_write_now",
    "durable_state_apply_now",
    "formation_receipt_write_now",
    "promotion_execution_now",
    "promotion_decision_record_write_now",
    "proof_or_evidence_record_now",
    "claim_or_evidence_write_now",
    "product_write_now",
    "product_id_allocation_now",
    "candidate_mutation_now",
    "candidate_deletion_now",
    "rule_mutation_now",
    "parser_mutation_now",
    "provider_openai_call_now",
    "prompt_sent_now",
    "retrieval_execution_now",
    "rag_answer_generation_now",
    "browser_log_ingestion_now",
    "session_log_ingestion_now",
    "raw_conversation_ingestion_now",
    "telemetry_ingestion_now",
    "git_ledger_export_now",
    "github_automation_authority",
    "audit_is_truth",
    "audit_is_proof",
    "audit_is_authority",
    "verification_is_truth",
    "smoke_pass_is_truth",
    "ci_pass_is_truth",
    "product_write_authority",
  ]) {
    assert.equal(boundary[field], false, `${label}.${field}`);
  }
}

function unknownUnsafeCases() {
  return [
    {
      label: "unknown-top-level-raw-conversation",
      unsafeValue: "Raw Conversation copied into audit input",
      reasonCode: "raw_conversation_blocked",
      apply(input, unsafeValue) {
        input.extra_raw_payload = unsafeValue;
      },
    },
    {
      label: "unknown-top-level-secret",
      unsafeValue: "Password: copied into audit input",
      reasonCode: "secret_like_pattern_blocked",
      apply(input, unsafeValue) {
        input.extra_secret = unsafeValue;
      },
    },
    {
      label: "unknown-item-hidden-reasoning",
      unsafeValue: "Hidden Reasoning copied into audit item",
      reasonCode: "hidden_reasoning_blocked",
      apply(input, unsafeValue) {
        input.input_items[0].extra_hidden_reasoning = unsafeValue;
      },
    },
    {
      label: "unknown-item-nested-telemetry",
      unsafeValue: "Telemetry Dump copied into audit item",
      reasonCode: "telemetry_dump_blocked",
      apply(input, unsafeValue) {
        input.input_items[0].extra_nested = { telemetry: unsafeValue };
      },
    },
    {
      label: "unknown-item-nested-array-secret",
      unsafeValue: "Secret: copied into audit item",
      reasonCode: "secret_like_pattern_blocked",
      apply(input, unsafeValue) {
        input.input_items[0].extra_array = [unsafeValue];
      },
    },
    {
      label: "unknown-authority-boundary-private-key",
      unsafeValue: "Private Key copied into audit boundary",
      reasonCode: "secret_like_pattern_blocked",
      apply(input, unsafeValue) {
        input.authority_boundary = { nested: { secret: unsafeValue } };
      },
    },
  ];
}

function publicSafeTokenPrefixWordCases() {
  return [
    {
      label: "public-safe-risk-reduction",
      summary: "Public-safe risk-reduction audit summary.",
    },
    {
      label: "public-safe-task-level",
      summary: "Public-safe task-level audit summary.",
    },
    {
      label: "public-safe-ask-followup",
      summary: "Public-safe ask-followup audit summary.",
    },
    {
      label: "public-safe-disk-cache",
      summary: "Public-safe disk-cache audit summary.",
    },
  ];
}

function tokenLikeUnsafeCases() {
  return [
    {
      label: "token-like-sk-lowercase",
      unsafeValue: "sk-test-token-like-000000",
      apply(input, unsafeValue) {
        input.extra_secret_token = unsafeValue;
      },
    },
    {
      label: "token-like-sk-uppercase",
      unsafeValue: "SK-TEST-TOKEN-LIKE-000000",
      apply(input, unsafeValue) {
        input.extra_secret_token = unsafeValue;
      },
    },
    {
      label: "token-like-ghp-lowercase",
      unsafeValue: "ghp_exampleTokenLikeValue000000",
      apply(input, unsafeValue) {
        input.extra_github_token = unsafeValue;
      },
    },
    {
      label: "token-like-ghp-uppercase",
      unsafeValue: "GHP_exampleTokenLikeValue000000",
      apply(input, unsafeValue) {
        input.extra_github_token = unsafeValue;
      },
    },
  ];
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), `${label} must include ${needle}`);
}

function assertNotIncludes(text, needle, label) {
  assert.ok(!text.includes(needle), `${label} must not include ${needle}`);
}
