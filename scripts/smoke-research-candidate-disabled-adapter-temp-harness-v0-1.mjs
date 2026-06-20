import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-disabled-adapter-contract-review-and-temp-harness.ts";
const componentPath =
  "components/research-candidate-disabled-adapter-temp-harness-readout.tsx";
const disabledReadoutPath =
  "components/research-candidate-disabled-promotion-write-adapter-readout.tsx";
const contractFixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-adapter-contract-review.sample.v0.1.json";
const tempHarnessFixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-adapter-temp-harness.sample.v0.1.json";
const tempScriptPath =
  "scripts/run-research-candidate-disabled-adapter-temp-harness-v0-1.mjs";
const contractTestsHelperPath =
  "lib/research-candidate-review/manual-note-disabled-write-adapter-contract-tests.ts";
const contractTestsFixturePath =
  "fixtures/research-candidate-review.manual-note-disabled-write-adapter-contract-test-cases.v0.1.json";
const contractTestsSmokePath =
  "scripts/smoke-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs";
const contractTestsRunnerPath =
  "scripts/run-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  helperPath,
  componentPath,
  disabledReadoutPath,
  contractFixturePath,
  tempHarnessFixturePath,
  tempScriptPath,
  contractTestsHelperPath,
  contractTestsFixturePath,
  contractTestsSmokePath,
  contractTestsRunnerPath,
  docsIndexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const component = readFileSync(componentPath, "utf8");
const disabledReadout = readFileSync(disabledReadoutPath, "utf8");
const contractFixtureText = readFileSync(contractFixturePath, "utf8");
const tempHarnessFixtureText = readFileSync(tempHarnessFixturePath, "utf8");
const contractFixture = JSON.parse(contractFixtureText);
const tempHarnessFixture = JSON.parse(tempHarnessFixtureText);
const tempScript = readFileSync(tempScriptPath, "utf8");
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertComponentContract();
assertFixtureContract();
assertTempScriptContract();
assertDocsAndPackagePointers();
assertNoRouteSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-disabled-adapter-temp-harness-v0-1",
      helper_exists: true,
      component_exists: true,
      fixtures_exist_and_parse: true,
      temp_artifact_script_exists: true,
      package_scripts_checked: true,
      docs_pointer_checked: true,
      no_new_api_route_checked: true,
      no_schema_migration_references: true,
      no_dependency_added: true,
      no_write_patterns_checked: true,
      local_only_temp_harness_checked: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_DISABLED_ADAPTER_CONTRACT_REVIEW_VERSION",
    "manual_note_disabled_adapter_contract_review.v0.1",
    "MANUAL_NOTE_DISABLED_ADAPTER_TEMP_HARNESS_VERSION",
    "manual_note_disabled_adapter_temp_harness.v0.1",
    "buildManualNoteDisabledAdapterContractReview",
    "buildManualNoteDisabledAdapterTempHarness",
    "buildManualNoteDisabledAdapterContractReviewMarkdown",
    "buildManualNoteDisabledAdapterContractReviewJson",
    "buildManualNoteDisabledAdapterTempHarnessMarkdown",
    "buildManualNoteDisabledAdapterTempHarnessJson",
    "createManualNoteDisabledAdapterContractReviewFingerprint",
    "createManualNoteDisabledAdapterTempHarnessFingerprint",
    "review_kind: \"manual_note_disabled_adapter_contract_review\"",
    "harness_kind: \"manual_note_disabled_adapter_temp_harness\"",
    "contract_status",
    "ready_for_temp_harness",
    "blocked_by_contract_gap",
    "harness_status",
    "temp_harness_ready",
    "execution_mode: \"temp_non_product_simulation\"",
    "product_write_mode: \"disabled\"",
    "simulated_intent_id: `temp-intent:${string}`",
    "product_record_id: null",
    "canonical_id: null",
    "proof_id: null",
    "evidence_id: null",
    "work_item_id: null",
    "write_performed_now: false",
    "product_write_allowed: false",
    "temp_harness_only: true",
    "idempotency_key_generated_now: true",
    "idempotency_key_kind: \"temp_harness_only\"",
    "rollback_simulated: true",
    "audit_simulated: true",
    "product_db_write: false",
    "durable_persistence: false",
    "browser_persistence: false",
    "local_clipboard_only: true",
    "product_write_authority_granted: false",
    "fixture_only_disabled_write_adapter_contract_tests",
    "0x811c9dc5",
    "0x01000193",
    'key !== "generated_at" && key !== "selected_at"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertComponentContract() {
  assert.ok(
    disabledReadout.includes("DisabledAdapterTempHarnessReadout"),
    "disabled adapter readiness readout must import/render temp harness readout",
  );
  assert.ok(
    normalizedIncludes(
      disabledReadout,
      "<DisabledAdapterTempHarnessReadout readiness={currentReadiness} />",
    ),
    "temp harness readout must render only after currentReadiness exists",
  );

  for (const requiredText of [
    "Disabled adapter contract review and temp harness",
    "Temp harness only.",
    "This does not perform normal product writes.",
    "This does not perform actual promotion.",
    "Simulated write intents are not proof/evidence, Perspective, canonical graph, or work item records.",
    "No provider, retrieval, source fetch, or external handoff is performed.",
    "No durable persistence is added.",
    "Review disabled adapter contract",
    "Build temp harness simulation",
    "Copy contract review Markdown",
    "Copy contract review JSON",
    "Copy temp harness Markdown",
    "Copy temp harness JSON",
    "contract_status",
    "Required contract checks",
    "Contract gaps",
    "Preserved boundaries",
    "harness_status",
    "execution_mode",
    "product_write_mode",
    "Simulated write intent counts",
    "Idempotency temp harness",
    "Rollback temp harness",
    "Review audit temp harness",
    "Temp harness boundary",
    "Local copy boundary",
    "next_recommended_slice",
    "data-contract-review-persisted=\"false\"",
    "data-temp-harness-persisted=\"false\"",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must include ${requiredText}`,
    );
  }

  assertOrdered(component, [
    "useEffect(() => {",
    "setContractReview(null)",
    "setTempHarness(null)",
    "setCopyState(EMPTY_COPY_STATE)",
    "}, [readinessIdentity])",
  ]);

  for (const requiredText of [
    "copyState.packetKind === \"manual_note_disabled_adapter_contract_review\"",
    "copyState.packetKind === \"manual_note_disabled_adapter_temp_harness\"",
    "copyState.previewDraftId === previewDraftId",
    "copyState.fingerprint === contractReview?.review_fingerprint",
    "copyState.fingerprint === tempHarness?.harness_fingerprint",
    "currentCopyState?.message",
    "currentCopyState?.fallbackText",
    "value={currentCopyState.fallbackText}",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component copy fallback must be keyed with ${requiredText}`,
    );
  }
}

function assertFixtureContract() {
  assert.equal(
    contractFixture.review_kind,
    "manual_note_disabled_adapter_contract_review",
  );
  assert.equal(
    contractFixture.review_version,
    "manual_note_disabled_adapter_contract_review.v0.1",
  );
  assert.match(contractFixture.review_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(contractFixture.contract_status, "ready_for_temp_harness");
  assert.deepEqual(contractFixture.contract_gaps, []);
  assert.ok(
    Object.values(contractFixture.required_contract_checks).every(Boolean),
    "all required contract checks must pass in fixture",
  );
  assert.equal(
    contractFixture.next_recommended_slice,
    "temp_harness_review_and_fixture_only_write_adapter_contract",
  );

  assert.equal(
    tempHarnessFixture.harness_kind,
    "manual_note_disabled_adapter_temp_harness",
  );
  assert.equal(
    tempHarnessFixture.harness_version,
    "manual_note_disabled_adapter_temp_harness.v0.1",
  );
  assert.match(tempHarnessFixture.harness_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(tempHarnessFixture.harness_status, "temp_harness_ready");
  assert.equal(
    tempHarnessFixture.execution_mode,
    "temp_non_product_simulation",
  );
  assert.equal(tempHarnessFixture.product_write_mode, "disabled");
  assert.equal(
    tempHarnessFixture.next_recommended_slice,
    "fixture_only_disabled_write_adapter_contract_tests",
  );

  const intentGroups = Object.values(tempHarnessFixture.simulated_write_intents);
  assert.ok(intentGroups.every((group) => Array.isArray(group) && group.length >= 1));
  for (const intent of intentGroups.flat()) {
    assert.match(intent.simulated_intent_id, /^temp-intent:/);
    assert.equal(intent.product_record_id, null);
    assert.equal(intent.canonical_id, null);
    assert.equal(intent.proof_id, null);
    assert.equal(intent.evidence_id, null);
    assert.equal(intent.work_item_id, null);
    assert.equal(intent.write_performed_now, false);
    assert.equal(intent.product_write_allowed, false);
    assert.equal(intent.temp_harness_only, true);
  }

  for (const [field, expectedValue] of Object.entries({
    temp_harness_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  })) {
    assert.equal(
      tempHarnessFixture.temp_harness_boundary[field],
      expectedValue,
      `temp_harness_boundary.${field} must be ${expectedValue}`,
    );
  }

  for (const [field, expectedValue] of Object.entries({
    local_clipboard_only: true,
    external_handoff_sent: false,
    packet_persisted: false,
    product_write_authority_granted: false,
    actual_promotion_allowed: false,
  })) {
    assert.equal(
      tempHarnessFixture.local_copy_packet[field],
      expectedValue,
      `local_copy_packet.${field} must be ${expectedValue}`,
    );
  }

  assertNoRawOrExternalFixtureText(contractFixtureText);
  assertNoRawOrExternalFixtureText(tempHarnessFixtureText);
  assertNoActualProductIds(contractFixture, contractFixturePath);
  assertNoActualProductIds(tempHarnessFixture, tempHarnessFixturePath);
}

function assertTempScriptContract() {
  assert.ok(
    tempScript.includes(
      'const ARTIFACT_DIR = "/tmp/augnes-disabled-adapter-temp-harness-v0-1"',
    ),
    "temp script must write under /tmp harness artifact dir",
  );
  for (const requiredText of [
    "READINESS_FIXTURE_PATH",
    "report.json",
    "contract-review.json",
    "temp-harness.json",
    "writeFile(CONTRACT_REVIEW_PATH",
    "writeFile(TEMP_HARNESS_PATH",
    "writeFile(REPORT_PATH",
    "final_status",
    "product_db_write: false",
  ]) {
    assert.ok(tempScript.includes(requiredText), `temp script must include ${requiredText}`);
  }
  assert.doesNotMatch(tempScript, /\bfetch\s*\(/, "temp script must not fetch");
  assert.doesNotMatch(
    tempScript,
    /\b(openDatabase|better-sqlite3|sqlite3|Database)\b/,
    "temp script must not read or write DB",
  );
  assert.doesNotMatch(
    tempScript,
    /writeFile\((?!CONTRACT_REVIEW_PATH|TEMP_HARNESS_PATH|REPORT_PATH)/,
    "temp script writes must target only /tmp artifact paths",
  );
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-disabled-adapter-temp-harness-v0-1"
    ],
    "node scripts/smoke-research-candidate-disabled-adapter-temp-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts?.[
      "harness:research-candidate-disabled-adapter-temp-harness-v0-1"
    ],
    "node scripts/run-research-candidate-disabled-adapter-temp-harness-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-disabled-write-adapter-contract-tests-v0-1"
    ],
    "node scripts/smoke-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs",
  );
  assert.equal(
    packageJson.scripts?.[
      "contracts:research-candidate-disabled-write-adapter-contract-tests-v0-1"
    ],
    "node scripts/run-research-candidate-disabled-write-adapter-contract-tests-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note disabled adapter contract review and temp harness",
    "Manual note fixture-only disabled write adapter contract tests",
    helperPath,
    componentPath,
    contractFixturePath,
    tempHarnessFixturePath,
    contractTestsHelperPath,
    contractTestsFixturePath,
    "npm run smoke:research-candidate-disabled-adapter-temp-harness-v0-1",
    "npm run harness:research-candidate-disabled-adapter-temp-harness-v0-1",
    "npm run smoke:research-candidate-disabled-write-adapter-contract-tests-v0-1",
    "npm run contracts:research-candidate-disabled-write-adapter-contract-tests-v0-1",
    "disabled adapter contract review",
    "temp/non-product execution harness",
    "fixture-only validation",
    "negative mutation matrix",
    "operator-visible temp harness readout",
    "local clipboard only",
    "/tmp/augnes-disabled-adapter-temp-harness-v0-1",
    "no new route",
    "no normal product write",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no durable persistence",
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

function assertNoRouteSchemaDependencyExpansion() {
  for (const filePath of listFiles("app/api")) {
    const text = readFileSync(filePath, "utf8");
    assert.ok(
      !/disabled-adapter-temp-harness|manual_note_disabled_adapter_temp_harness|manual_note_disabled_adapter_contract_review|contract-review|temp-harness/i.test(
        `${filePath}\n${text}`,
      ),
      `no API route may be added or wired for this temp harness slice: ${filePath}`,
    );
  }

  for (const filePath of listFiles(".")) {
    if (!/(migration|migrations|schema)/i.test(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    assert.ok(
      !/manual_note_disabled_adapter_contract_review|manual_note_disabled_adapter_temp_harness|disabled_adapter_temp_harness/i.test(
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
    [componentPath, component],
    [tempScriptPath, tempScript],
    [disabledReadoutPath, disabledReadout],
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
        `${filePath} must not import forbidden provider/write modules: ${importLine}`,
      );
    }
  }

  for (const [filePath, text] of [
    [helperPath, helper],
    [tempScriptPath, tempScript],
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

  assert.doesNotMatch(component, /\bfetch\s*\(/, "component must not fetch");
}

function assertNoRawOrExternalFixtureText(fixtureText) {
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
    assert.ok(
      !fixtureText.includes(forbiddenText),
      `fixture must not include ${forbiddenText}`,
    );
  }
}

function assertNoActualProductIds(value, sourcePath, keyPath = []) {
  if (value === null || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoActualProductIds(item, sourcePath, [...keyPath, String(index)]),
    );
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...keyPath, key];
    if (
      [
        "product_record_id",
        "canonical_id",
        "canonical_claim_id",
        "canonical_graph_edge_id",
        "proof_id",
        "evidence_id",
        "perspective_id",
        "work_item_id",
      ].includes(key)
    ) {
      assert.equal(
        child,
        null,
        `${sourcePath} ${nextPath.join(".")} must stay null`,
      );
    }
    assertNoActualProductIds(child, sourcePath, nextPath);
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
