#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const docsPath = "docs/GIT_LEDGER_EXPORT_READONLY_PREVIEW_V0_1.md";
const componentPath = "components/git-ledger-export-readonly-preview-panel.tsx";
const fixturePath = "fixtures/git-ledger-export-readonly-preview.sample.v0.1.json";
const smokePath = "scripts/smoke-git-ledger-export-readonly-preview-v0-1.mjs";
const contractDocsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const contractTypesPath = "types/git-ledger-export-contract.ts";
const contractSmokePath = "scripts/smoke-git-ledger-export-contract-v0-1.mjs";
const builderDocsPath = "docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md";
const builderPath = "lib/git-ledger/build-export-packet.ts";
const builderFixturePath = "fixtures/git-ledger-export-builder.sample.v0.1.json";
const builderSmokePath = "scripts/smoke-git-ledger-export-builder-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const fixtureVersion = "git_ledger_export_readonly_preview.sample.v0.1";
const previewVersion = "git_ledger_export_readonly_preview.v0.1";
const builderVersion = "git_ledger_export_builder.v0.1";
const contractVersion = "git_ledger_export_contract.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:git-ledger-export-readonly-preview-v0-1";
const packageScriptValue =
  "node scripts/smoke-git-ledger-export-readonly-preview-v0-1.mjs";

const expectedSliceFiles = [
  docsPath,
  componentPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
];

const authorityAllowedTrueFields = [
  "git_ledger_export_readonly_preview_now",
  "readonly_preview_only",
  "caller_provided_packet_only",
  "public_safe_render_only",
  "suggested_commit_message_text_render_now",
  "summary_markdown_render_now",
];

const authorityFalseFields = [
  "git_ledger_export_runtime_now",
  "git_ledger_export_builder_mutation_now",
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
  "suggested_commit_message_is_approval",
  "packet_hash_is_truth",
  "idempotency_key_is_authority",
  "git_ref_is_authority",
  "ledger_packet_is_commit",
  "ledger_packet_is_truth",
  "ledger_packet_is_proof",
  "ledger_packet_is_accepted_evidence",
  "ledger_packet_is_durable_state",
  "ledger_packet_is_promotion",
  "ledger_packet_is_product_write",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const reasonCodes = [
  "roadmap_file_present",
  "contract_ref_present",
  "builder_ref_present",
  "readonly_preview_only",
  "packet_candidate_previewed",
  "suggested_commit_message_text_only",
  "summary_markdown_text_only",
  "privacy_report_visible",
  "validation_report_visible",
  "authority_boundary_visible",
  "packet_hash_visible_not_truth",
  "idempotency_key_visible_not_authority",
  "git_ref_not_authority",
  "suggested_commit_message_not_approval",
  "ledger_packet_is_not_commit",
  "ledger_packet_is_not_truth",
  "ledger_packet_is_not_proof",
  "ledger_packet_is_not_accepted_evidence",
  "ledger_packet_is_not_durable_state",
  "ledger_packet_is_not_promotion",
  "ledger_packet_is_not_product_write",
  "product_write_denied",
  "product_write_not_executed",
  "product_id_allocation_not_executed",
  "no_action_controls_present",
  "no_git_execution",
  "no_github_call",
  "no_file_export",
  "no_file_import",
  "no_db_write",
  "no_provider_call",
  "no_retrieval_execution",
  "no_codex_execution",
  "no_proof_created",
  "no_evidence_created",
  "no_promotion_executed",
  "no_durable_state_mutation",
  "no_formation_receipt_write",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
];

const requiredDocsSections = [
  "## Purpose",
  "## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md",
  "## Relationship to Git Ledger Export Contract v0.1",
  "## Relationship to Git Ledger Export Deterministic Builder v0.1",
  "## Relationship to Privacy Redaction Runtime Guard",
  "## Relationship to Local Data Export/Import Policy",
  "## Relationship to Authority Boundary Regression CI",
  "## Relationship to Codex Result Report Ingestion and Temporal Handoff Usefulness Experiment Plan",
  "## Preview Model",
  "## Component Boundary",
  "## Suggested Commit Message Display Policy",
  "## Markdown Summary Display Policy",
  "## Privacy/Validation Display Policy",
  "## Authority Boundary",
  "## Fixture Policy",
  "## Verification Expectations",
  "## Deferred Work",
];

const requiredDocsPhrases = [
  "This slice is read-only preview only.",
  "This slice renders packet candidates only.",
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
  "This slice does not add routes.",
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
  "There are no create branch, commit, PR, merge, publish, deploy, product-write, proof/evidence, promotion, or state-apply controls.",
];

const requiredComponentPhrases = [
  "GitLedgerExportReadonlyPreviewPanel",
  "Packet Status",
  "packet id",
  "generated_by",
  "generated_at",
  "Change Summary",
  "Reason Summary",
  "Lineage Refs",
  "Privacy Report",
  "Validation Report",
  "packet hash",
  "idempotency key",
  "Markdown Summary",
  "Suggested Commit Message Text",
  "Authority Boundary Highlights",
  "Authority Boundary",
  "Product-write remains parked by #686.",
  "Suggested commit message is not approval.",
  "Packet hash is not truth.",
  "Idempotency key is not authority.",
  "Git ref is not authority.",
  "Git Ledger export packet is not commit/proof/accepted evidence/durable state/promotion/product-write.",
];

const forbiddenComponentPatterns = [
  /<button\b/i,
  /<form\b/i,
  /type=["']submit["']/i,
  /\bonClick\b/,
  /\bonSubmit\b/,
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bnavigator\.clipboard\b/,
  /\bwindow\.open\b/,
  /\blocation\.href\s*=/,
  /\bCreate branch\b/i,
  /\bCreate PR\b/i,
  /\bMerge PR\b/i,
  /\bCommit packet\b/i,
  /\bPublish\b/i,
  /\bDeploy\b/i,
  /\bRun product-write\b/i,
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
  builderFixturePath,
  builderSmokePath,
  roadmapPath,
]) {
  assert.ok(existsSync(requiredPath), `required path must exist: ${requiredPath}`);
}

const docs = read(docsPath);
const component = read(componentPath);
const fixtureText = read(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(read(packagePath));
const index = read(indexPath);
const roadmap = read(roadmapPath);
const builderDocs = read(builderDocsPath);
const builderSource = read(builderPath);

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.preview_version, previewVersion);
assert.equal(fixture.builder_version, builderVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, scope);
assert.ok(
  roadmap.includes("git_ledger_export_readonly_preview_v0_1"),
  "roadmap must contain git_ledger_export_readonly_preview_v0_1",
);
assert.ok(
  builderDocs.includes("Git Ledger Export Deterministic Builder v0.1"),
  "builder dependency docs must exist",
);
assert.ok(
  builderSource.includes("buildGitLedgerExportPacketV01"),
  "builder dependency must expose packet builder",
);
assert.equal(
  packageJson.scripts?.[packageScriptName],
  packageScriptValue,
  "package.json must register the Git Ledger export readonly preview smoke",
);
assert.equal(
  packageJson.scripts?.["smoke:authority-boundary-regression-v0-1"],
  "node scripts/smoke-authority-boundary-regression-v0-1.mjs",
  "authority boundary regression smoke package script must not be weakened",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-builder-v0-1"],
  "node scripts/smoke-git-ledger-export-builder-v0-1.mjs",
  "builder smoke package script must remain runnable",
);
assert.equal(
  packageJson.scripts?.["smoke:git-ledger-export-contract-v0-1"],
  "node scripts/smoke-git-ledger-export-contract-v0-1.mjs",
  "contract smoke package script must remain runnable",
);

for (const pointer of [docsPath, componentPath, fixturePath, smokePath]) {
  assert.ok(index.includes(pointer), `latest index must point to ${pointer}`);
}
assert.ok(index.includes("Product-write remains parked by #686."));

for (const section of requiredDocsSections) {
  assert.ok(docs.includes(section), `docs must include section ${section}`);
}
for (const phrase of requiredDocsPhrases) {
  assert.ok(includesNormalized(docs, phrase), `docs must include phrase: ${phrase}`);
}
assert.ok(
  docs.includes("Privacy Redaction Runtime Guard v0.1 remains required"),
  "privacy guard dependency must be explicit",
);
assert.ok(
  docs.includes("Git Ledger Export Deterministic Builder v0.1"),
  "builder dependency must be explicit",
);

assertComponentBoundary();
assertFixtureShape();
assertAuthorityBoundary(fixture.authority_boundary_sample, "authority_boundary_sample");
assertAuthorityBoundary(
  fixture.packet_preview_example.authority_boundary,
  "packet_preview_example.authority_boundary",
);
assertSafeMarkerUse();
assertNoLiveLookingPrivateExamples();
assertNarrowSliceFileScope();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "git-ledger-export-readonly-preview-v0-1",
      preview_version: previewVersion,
      packet_id: fixture.packet_preview_example.packet_id,
      sections: fixture.read_only_panel_sections.length,
      lineage_refs: fixture.packet_preview_example.lineage_refs.length,
    },
    null,
    2,
  ),
);

function assertComponentBoundary() {
  assert.ok(
    component.includes("export function GitLedgerExportReadonlyPreviewPanel"),
    "component must export GitLedgerExportReadonlyPreviewPanel",
  );
  for (const phrase of requiredComponentPhrases) {
    assert.ok(
      includesNormalized(component, phrase),
      `component must render label/section: ${phrase}`,
    );
  }
  for (const pattern of forbiddenComponentPatterns) {
    assert.ok(!pattern.test(component), `component must not include ${pattern}`);
  }
  const textareaMatches = component.match(/<textarea\b[\s\S]*?\/>/g) ?? [];
  assert.ok(textareaMatches.length >= 2, "component must render readonly textareas");
  for (const textarea of textareaMatches) {
    assert.ok(/\breadOnly\b/.test(textarea), "each textarea must include readOnly");
  }
}

function assertFixtureShape() {
  const preview = fixture.packet_preview_example;
  assert.equal(preview.status, "packet_candidate_previewed");
  assert.equal(preview.packet_status, "packet_candidate_created");
  for (const field of [
    "packet_title",
    "packet_id",
    "generated_by",
    "generated_at",
    "change_summary",
    "reason_summary",
    "privacy_report_summary",
    "validation_report_summary",
    "packet_hash",
    "idempotency_key",
    "summary_markdown",
    "suggested_commit_message",
  ]) {
    assert.equal(typeof preview[field], "string", `${field} must be a string`);
    assert.ok(preview[field].length > 0, `${field} must be non-empty`);
  }
  assert.ok(Array.isArray(preview.lineage_refs), "lineage_refs must be an array");
  assert.ok(preview.lineage_refs.length > 0, "lineage refs must be present");
  for (const lineageRef of preview.lineage_refs) {
    for (const field of [
      "lineage_ref_id",
      "lineage_ref_kind",
      "ref",
      "public_safe_summary",
    ]) {
      assert.equal(typeof lineageRef[field], "string", `lineage ${field}`);
      assert.ok(lineageRef[field].length > 0, `lineage ${field} non-empty`);
    }
  }
  assert.deepEqual(
    [...fixture.read_only_panel_sections].sort(),
    [
      "Packet Status",
      "Change Summary",
      "Reason Summary",
      "Lineage Refs",
      "Privacy Report",
      "Validation Report",
      "Markdown Summary",
      "Suggested Commit Message Text",
      "Authority Boundary Highlights",
      "Authority Boundary",
      "Reason Codes",
    ].sort(),
  );
  assert.equal(fixture.privacy_report_preview.status, "passed");
  assert.equal(fixture.validation_report_preview.status, "passed");
  assert.equal(fixture.rendered_markdown_preview, preview.summary_markdown);
  assert.equal(
    fixture.suggested_commit_message_preview,
    preview.suggested_commit_message,
  );
  assert.equal(
    fixture.blocked_private_or_raw_preview_example.status,
    "blocked_private_or_raw_payload_preview",
  );
  assert.equal(
    fixture.blocked_forbidden_authority_preview_example.status,
    "blocked_forbidden_authority_preview",
  );
  assert.ok(Array.isArray(fixture.no_action_controls_expected));
  assert.ok(
    fixture.no_action_controls_expected.includes("branch_creation_control_absent"),
  );
  for (const reasonCode of reasonCodes) {
    assert.ok(
      fixture.reason_codes.includes(reasonCode),
      `fixture reason_codes must include ${reasonCode}`,
    );
    assert.ok(
      preview.reason_codes.includes(reasonCode),
      `preview reason_codes must include ${reasonCode}`,
    );
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.ok(boundary && typeof boundary === "object", `${label} must be object`);
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${label}.${field} must be true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertSafeMarkerUse() {
  collectStringPaths(fixture, "$", (value, pathLabel) => {
    const matches = value.match(/\bSAFE_MARKER_[A-Z0-9_]+\b/g) ?? [];
    for (const marker of matches) {
      assert.ok(
        safeFixtureMarkers.includes(marker),
        `fixture marker ${marker} must be allowed`,
      );
      assert.ok(
        pathLabel.startsWith(
          "$.blocked_private_or_raw_preview_example.blocked_fixture_markers",
        ),
        `safe marker ${marker} must appear only inside blocked private/raw preview markers`,
      );
    }
    if (/(?:_ref|_refs|\.ref|\[ref\])(?:\]|\.)?$/.test(pathLabel)) {
      assert.ok(!value.startsWith("/"), `symbolic ref must not be path: ${pathLabel}`);
      assert.ok(!/\s{2,}/.test(value), `symbolic ref should stay compact: ${pathLabel}`);
    }
  });
}

function assertNoLiveLookingPrivateExamples() {
  const sources = [
    [docsPath, docs],
    [componentPath, component],
    [fixturePath, fixtureText],
    [smokePath, read(smokePath)],
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
      /git[-_]ledger[-_]export[-_]readonly[-_]preview/i.test(normalized) &&
      !expectedSliceFiles.includes(normalized)
    ) {
      unexpected.push(normalized);
    }
    assert.ok(
      !/(^|\/)app\/api\/.*git[-_]ledger[-_]export[-_]readonly[-_]preview/i.test(
        normalized,
      ),
      `slice must not add route file ${normalized}`,
    );
    assert.ok(
      !/(^|\/)(?:db|migrations)\/.*git[-_]ledger[-_]export[-_]readonly[-_]preview/i.test(
        normalized,
      ),
      `slice must not add DB file ${normalized}`,
    );
    assert.ok(
      !/(provider|retrieval|github|git-ledger-runtime|codex-execution|product-write|product-id).*git[-_]ledger[-_]export[-_]readonly[-_]preview/i.test(
        normalized,
      ),
      `slice must not add runtime capability file ${normalized}`,
    );
  }
  assert.deepEqual(
    unexpected.sort(),
    [],
    "Git Ledger export readonly preview files must stay in expected file set",
  );
}

function collectStringPaths(value, pathLabel, visitor) {
  if (typeof value === "string") {
    visitor(value, pathLabel);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStringPaths(item, `${pathLabel}[${index}]`, visitor),
    );
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
