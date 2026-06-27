#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";

const docsPath = "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const libPath = "lib/git-ledger/build-export-packet.ts";
const fixturePath = "fixtures/git-ledger-export-builder.sample.v0.1.json";
const smokePath = "scripts/smoke-git-ledger-export-builder-v0-1.mjs";
const contractDocsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const contractTypesPath = "types/git-ledger-export-contract.ts";
const contractSmokePath = "scripts/smoke-git-ledger-export-contract-v0-1.mjs";
const privacyDocsPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const fixtureVersion = "git_ledger_export_builder.sample.v0.1";
const builderVersion = "git_ledger_export_builder.v0.1";
const contractVersion = "git_ledger_export_contract.v0.1";
const packetVersion = "git_ledger_packet.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:git-ledger-export-builder-v0-1";
const packageScriptValue = "node scripts/smoke-git-ledger-export-builder-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  libPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const requiredExports = [
  "buildGitLedgerExportPacketV01",
  "validateGitLedgerExportPacketV01",
  "validateGitLedgerExportBuilderInputV01",
  "createGitLedgerExportPacketHashV01",
  "createGitLedgerExportIdempotencyKeyV01",
  "renderGitLedgerExportSummaryMarkdownV01",
  "renderSuggestedGitLedgerCommitMessageV01",
  "createGitLedgerExportBuilderAuthorityBoundaryV01",
];

const authorityAllowedTrueFields = [
  "git_ledger_export_builder_now",
  "deterministic_packet_builder_now",
  "caller_provided_input_only",
  "public_safe_packet_candidate_only",
  "summary_markdown_render_now",
  "suggested_commit_message_render_now",
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
  "local_file_export_now",
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
  "ledger_packet_is_commit",
  "ledger_packet_is_truth",
  "ledger_packet_is_proof",
  "ledger_packet_is_accepted_evidence",
  "ledger_packet_is_product_write",
  "suggested_commit_message_is_approval",
  "packet_hash_is_truth",
  "idempotency_key_is_authority",
  "git_ref_is_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredReasonCodes = [
  "roadmap_file_present",
  "contract_ref_present",
  "builder_input_validated",
  "packet_candidate_created",
  "deterministic_packet_hash_created",
  "deterministic_idempotency_key_created",
  "summary_markdown_rendered",
  "suggested_commit_message_rendered",
  "lineage_ref_present",
  "lineage_ref_missing",
  "source_ref_present",
  "candidate_ref_present",
  "evidence_ref_present",
  "formation_receipt_ref_present",
  "promotion_decision_ref_present",
  "state_transition_ref_present",
  "privacy_guard_required",
  "public_safe_summary_only",
  "raw_private_payload_blocked",
  "raw_source_body_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "provider_thread_run_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "raw_diff_blocked",
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
  "export_import_runtime_not_executed",
  "codex_not_executed",
  "product_write_denied",
  "product_write_not_executed",
  "product_id_allocation_not_executed",
  "ledger_packet_is_not_commit",
  "ledger_packet_is_not_truth",
  "ledger_packet_is_not_proof",
  "ledger_packet_is_not_accepted_evidence",
  "ledger_packet_is_not_product_write",
  "git_ref_not_authority",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Git Ledger Export Contract v0.1",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Local Data Export/Import Policy",
  "## Relationship to Authority Boundary Regression CI",
  "## Relationship to Codex Result Report Ingestion and Temporal Handoff Usefulness Experiment Plan",
  "## Input Contract",
  "## Packet Shape",
  "## Deterministic Hash Policy",
  "## Idempotency Key Policy",
  "## Markdown Summary Policy",
  "## Suggested Commit Message Policy",
  "## Privacy/Redaction Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const requiredDocsPhrases = [
  "This slice builds packet candidates only.",
  "This slice renders markdown and suggested commit message text only.",
  "Suggested commit message is not approval.",
  "Packet hash is not truth.",
  "Idempotency key is not authority.",
  "Git ref is not authority.",
  "Git Ledger export packet is not commit, not proof, not accepted evidence, not durable state, not promotion, and not product-write.",
  "This slice does not execute Git.",
  "This slice does not execute Git Ledger export.",
  "This slice does not create commits, branches, tags, PRs, or merges.",
  "This slice does not call GitHub.",
  "This slice does not write repository files.",
  "This slice does not export files locally.",
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
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
  "Privacy Redaction Runtime Guard v0.1 remains required before any future Git Ledger export runtime.",
  "Local Data Export/Import Policy v0.1 remains policy-only and contract-only.",
  "Authority Boundary Regression CI v0.1",
  "Codex Result Report Ingestion v0.1",
  "Temporal Handoff Usefulness Experiment Plan v0.1",
];

const unsafeFixtureMarkers = [
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

const forbiddenAuthorityTextValues = [
  {
    label: "git commit push request",
    value: "Please git commit and push this packet.",
  },
  {
    label: "github pr creation request",
    value: "Call GitHub and create PR for this packet.",
  },
  {
    label: "merge pull request request",
    value: "Merge pull request after packet build.",
  },
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

const forbiddenLibPatterns = [
  /from\s+["']node:fs["']/,
  /from\s+["']fs["']/,
  /from\s+["']next\/server["']/,
  /from\s+["']openai["']/i,
  /from\s+["']node:child_process["']/,
  /from\s+["']child_process["']/,
  /\bfetch\s*\(/,
  /NextResponse/,
  /Database\s*\(/,
  /better-sqlite3/,
  /\bexecFile\b|\bspawn\b|\bexecSync\b/,
];

for (const requiredPath of [
  ...expectedSliceFiles,
  contractDocsPath,
  contractTypesPath,
  contractSmokePath,
  privacyDocsPath,
  roadmapPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docs = read(docsPath);
const libSource = read(libPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const smokeSource = read(smokePath);
const contractDocs = read(contractDocsPath);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.builder_version, builderVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.packet_version, packetVersion);
assert.equal(fixture.scope, scope);
assert.ok(
  roadmap.includes("git_ledger_export_deterministic_builder_v0_1"),
  "roadmap must contain git_ledger_export_deterministic_builder_v0_1",
);
assert.ok(contractDocs.includes("Git Ledger Export Contract is contract-only."));
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the Git Ledger export builder smoke",
);
assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
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

for (const exportedName of requiredExports) {
  assert.ok(
    libSource.includes(`export function ${exportedName}`),
    `library must export ${exportedName}`,
  );
}
for (const reasonCode of requiredReasonCodes) {
  assert.ok(libSource.includes(`"${reasonCode}"`), `library must include ${reasonCode}`);
}
for (const pattern of forbiddenLibPatterns) {
  assert.ok(!pattern.test(libSource), `library must not include runtime IO pattern ${pattern}`);
}

assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture.authority_boundary_sample");
assertAuthorityBoundary(
  fixture.safe_builder_input_example.authority_boundary,
  "safe_builder_input_example.authority_boundary",
);
assertAuthorityBoundary(
  fixture.safe_packet_candidate_example.authority_boundary,
  "safe_packet_candidate_example.authority_boundary",
);

const helper = await importBuilderHelper();
for (const exportedName of requiredExports) {
  assert.equal(typeof helper[exportedName], "function", `${exportedName} must be callable`);
}

const safePacket = helper.buildGitLedgerExportPacketV01(fixture.safe_builder_input_example);
assert.equal(safePacket.status, "packet_candidate_created");
assert.deepEqual(safePacket, fixture.safe_packet_candidate_example);
assert.deepEqual(safePacket.validation, fixture.validation_report_example);
assert.equal(safePacket.summary_markdown, fixture.rendered_markdown_example);
assert.equal(safePacket.suggested_commit_message, fixture.suggested_commit_message_example);
assert.equal(
  helper.validateGitLedgerExportBuilderInputV01(fixture.safe_builder_input_example).passed,
  true,
);
assert.equal(helper.validateGitLedgerExportPacketV01(safePacket).passed, true);

const repeatedPacket = helper.buildGitLedgerExportPacketV01(
  fixture.safe_builder_input_example,
);
assert.equal(repeatedPacket.packet_hash, safePacket.packet_hash);
assert.equal(repeatedPacket.idempotency_key, safePacket.idempotency_key);
assert.equal(
  repeatedPacket.packet_hash,
  fixture.deterministic_hash_repeatability_example.repeated_packet_hash,
);
assert.equal(
  repeatedPacket.idempotency_key,
  fixture.deterministic_hash_repeatability_example.repeated_idempotency_key,
);

const changedSummaryPacket = helper.buildGitLedgerExportPacketV01({
  ...fixture.safe_builder_input_example,
  change_summary:
    "Adds a bounded public-safe change summary variant for repeatability checks.",
});
assert.notEqual(changedSummaryPacket.packet_hash, safePacket.packet_hash);
assert.equal(
  changedSummaryPacket.packet_hash,
  fixture.deterministic_hash_repeatability_example.changed_change_summary_packet_hash,
);

assert.equal(
  helper.createGitLedgerExportPacketHashV01(safePacket),
  safePacket.packet_hash,
  "packet hash helper must match packet hash",
);
assert.equal(
  helper.createGitLedgerExportIdempotencyKeyV01(fixture.safe_builder_input_example),
  safePacket.idempotency_key,
  "idempotency helper must match packet key",
);
assert.equal(
  helper.renderGitLedgerExportSummaryMarkdownV01(safePacket),
  safePacket.summary_markdown,
);
assert.equal(
  helper.renderSuggestedGitLedgerCommitMessageV01(safePacket),
  safePacket.suggested_commit_message,
);

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
assertBlockedExample(
  helper,
  fixture.blocked_forbidden_authority_text_example,
  "blocked_forbidden_authority",
);
assertBlockedExample(
  helper,
  fixture.blocked_missing_lineage_example,
  "blocked_missing_lineage",
);

assertForbiddenAuthorityTextRedacted(helper);
assertNoUnsafeEcho(helper);
assertSafeMarkerUse();
assertNoLiveLookingPrivateExamples();
assertNarrowSliceFileScope();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "git-ledger-export-builder-v0-1",
      builder_version: builderVersion,
      packet_hash: safePacket.packet_hash,
      idempotency_key: safePacket.idempotency_key,
      lineage_refs: safePacket.lineage_refs.length,
    },
    null,
    2,
  ),
);

function assertBlockedExample(helperModule, example, expectedStatus) {
  const validation = helperModule.validateGitLedgerExportBuilderInputV01(example.input);
  const packet = helperModule.buildGitLedgerExportPacketV01(example.input);
  assert.equal(example.expected_status, expectedStatus);
  assert.equal(validation.status, expectedStatus);
  assert.equal(packet.status, expectedStatus);
  assert.equal(validation.passed, false);
  assert.equal(packet.validation.status, expectedStatus);
  assert.equal(packet.validation.passed, false);
  assert.ok(packet.validation.findings.length > 0, `${expectedStatus} must have findings`);
  assertAuthorityBoundary(packet.authority_boundary, `${expectedStatus}.packet.authority`);
}

function assertNoUnsafeEcho(helperModule) {
  const markerValues = collectSafeMarkers(fixture);
  assert.ok(markerValues.length >= 2, "blocked fixture must include safe markers");
  const outputs = [
    safePacket,
    helperModule.buildGitLedgerExportPacketV01(
      fixture.blocked_private_or_raw_payload_example.input,
    ),
    helperModule.buildGitLedgerExportPacketV01(
      fixture.blocked_forbidden_authority_example.input,
    ),
    helperModule.buildGitLedgerExportPacketV01(
      fixture.blocked_forbidden_authority_text_example.input,
    ),
    helperModule.buildGitLedgerExportPacketV01(
      fixture.blocked_missing_lineage_example.input,
    ),
  ];
  for (const output of outputs) {
    const serialized = JSON.stringify(output);
    for (const markerValue of markerValues) {
      assert.ok(!serialized.includes(markerValue), `output must not echo ${markerValue}`);
    }
    assert.ok(
      !output.summary_markdown.includes("SAFE_MARKER_"),
      "markdown summary must not echo unsafe markers",
    );
    assert.ok(
      !output.suggested_commit_message.includes("SAFE_MARKER_"),
      "suggested commit message must not echo unsafe markers",
    );
  }
}

function assertForbiddenAuthorityTextRedacted(helperModule) {
  const validation = helperModule.validateGitLedgerExportBuilderInputV01(
    fixture.blocked_forbidden_authority_text_example.input,
  );
  const packet = helperModule.buildGitLedgerExportPacketV01(
    fixture.blocked_forbidden_authority_text_example.input,
  );
  assert.equal(validation.status, "blocked_forbidden_authority");
  assert.equal(validation.passed, false);
  assert.equal(packet.status, "blocked_forbidden_authority");
  assert.equal(packet.validation.status, "blocked_forbidden_authority");
  assertAuthorityBoundary(
    packet.authority_boundary,
    "blocked_forbidden_authority_text.packet.authority",
  );

  const serializedPacket = JSON.stringify(packet);
  const serializedValidation = JSON.stringify(packet.validation);
  for (const { label, value } of forbiddenAuthorityTextValues) {
    assert.ok(!serializedPacket.includes(value), `${label} must not appear in packet`);
    assert.ok(!serializedValidation.includes(value), `${label} must not appear in validation`);
    assert.ok(
      !packet.summary_markdown.includes(value),
      `${label} must not appear in markdown`,
    );
    assert.ok(
      !packet.suggested_commit_message.includes(value),
      `${label} must not appear in suggested commit message`,
    );
  }
}

function assertSafeMarkerUse() {
  const strings = [];
  collectStringPaths(fixture, "$", (value, pathLabel) => {
    strings.push({ value, pathLabel });
  });
  for (const { value, pathLabel } of strings) {
    const matches = value.match(/\bSAFE_MARKER_[A-Z0-9_]+\b/g) ?? [];
    for (const match of matches) {
      assert.ok(
        unsafeFixtureMarkers.includes(match),
        `fixture marker ${match} must be an allowed safe placeholder`,
      );
      assert.ok(
        pathLabel.startsWith("$.blocked_private_or_raw_payload_example.input."),
        `safe marker ${match} must appear only inside blocked private/raw fixture input`,
      );
    }
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must be an object`);
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
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
    if (
      /git[-_]ledger[-_]export[-_]builder|build[-_]export[-_]packet/i.test(
        normalized,
      ) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
    assert.ok(
      !/(^|\/)app\/api\/.*git[-_]ledger[-_]export[-_]builder/i.test(normalized),
      `slice must not add route file ${normalized}`,
    );
    assert.ok(
      !/(^|\/)components\/.*git[-_]ledger[-_]export[-_]builder/i.test(normalized),
      `slice must not add UI component ${normalized}`,
    );
    assert.ok(
      !/(^|\/)(?:db|migrations)\/.*git[-_]ledger[-_]export[-_]builder/i.test(
        normalized,
      ),
      `slice must not add DB file ${normalized}`,
    );
    assert.ok(
      !/(provider|retrieval|github|git-ledger-runtime|codex-execution|product-write|product-id).*git[-_]ledger[-_]export[-_]builder/i.test(
        normalized,
      ),
      `slice must not add runtime capability file ${normalized}`,
    );
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "Git Ledger export builder files must stay in expected file set",
  );
}

async function importBuilderHelper() {
  const source = read(libPath);
  const js = stripTypeScriptTypes(source, { mode: "strip" });
  return import(`data:text/javascript,${encodeURIComponent(js)}`);
}

function collectSafeMarkers(value) {
  const markers = [];
  collectStringPaths(value, "$", (stringValue) => {
    for (const marker of unsafeFixtureMarkers) {
      if (stringValue.includes(marker)) {
        markers.push(marker);
      }
    }
  });
  return [...new Set(markers)].sort();
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
      /(^|\/)(node_modules|\.next|\.git|dist|build|coverage|out|\.turbo)$/.test(
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
