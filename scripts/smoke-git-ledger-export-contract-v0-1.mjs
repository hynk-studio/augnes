#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const runtimeAuditDocsPath = "docs/RUNTIME_AUDIT_PANEL_V0_1.md";
const docsPath = "docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md";
const typePath = "types/git-ledger-export-contract.ts";
const fixturePath = "fixtures/git-ledger-export-contract.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const contractVersion = "git_ledger_export_contract.v0.1";
const lineageRefVersion = "git_ledger_lineage_ref.v0.1";
const packetVersion = "git_ledger_packet.v0.1";
const entryVersion = "git_ledger_entry.v0.1";
const bundleVersion = "git_ledger_export_bundle.v0.1";
const fixtureVersion = "git_ledger_export_contract.sample.v0.1";
const scope = "project:augnes";
const status = "contract_only";
const roadmapRef = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const packageScriptName = "smoke:git-ledger-export-contract-v0-1";
const packageScriptValue = "node scripts/smoke-git-ledger-export-contract-v0-1.mjs";

const entryKinds = [
  "perspective_state_apply",
  "formation_receipt",
  "promotion_decision",
  "dogfooding_record",
  "feedback_aggregate",
  "runtime_audit",
  "manual_anchor",
  "surfacing_preview",
  "trajectory",
  "source_intake",
  "provider_extraction",
  "retrieval_index",
  "unknown",
];

const exportStatuses = [
  "contract_only",
  "candidate_only",
  "ready_for_future_operator_export",
  "blocked_private_or_raw_payload",
  "blocked_missing_lineage",
  "blocked_forbidden_authority",
  "rejected",
];

const lineageRefKinds = [
  "durable_state_apply",
  "formation_receipt",
  "promotion_decision",
  "dogfooding_record",
  "dogfooding_review_cue",
  "feedback_aggregate",
  "surfacing_preview",
  "runtime_audit",
  "manual_anchor",
  "perspective_trajectory",
  "source_ref",
  "review_record",
  "provider_extraction",
  "retrieval_index",
  "unknown",
];

const privacyClasses = [
  "public_safe_summary",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
];

const redactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_raw_payload",
  "blocked_secret_like_pattern",
  "blocked_private_location",
];

const reasonCodes = [
  "roadmap_file_present",
  "runtime_audit_ref_present",
  "runtime_audit_ref_missing",
  "ledger_packet_present",
  "ledger_packet_missing",
  "ledger_entry_present",
  "ledger_entry_missing",
  "lineage_ref_present",
  "lineage_ref_missing",
  "bounded_summary_present",
  "bounded_summary_missing",
  "explicit_operator_export_required",
  "git_export_runtime_not_implemented",
  "git_write_not_executed",
  "git_commit_not_created",
  "git_branch_not_created",
  "git_tag_not_created",
  "github_api_not_called",
  "pull_request_not_created",
  "repository_file_not_written",
  "db_write_not_executed",
  "product_write_denied",
  "product_write_not_executed",
  "ledger_packet_is_not_commit",
  "ledger_packet_is_not_truth",
  "ledger_packet_is_not_proof",
  "ledger_packet_is_not_accepted_evidence",
  "ledger_packet_is_not_product_write",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
];

const authorityFalseFields = [
  "git_ledger_export_runtime_now",
  "git_write_now",
  "git_commit_now",
  "git_branch_now",
  "git_tag_now",
  "github_api_call_now",
  "pull_request_creation_now",
  "repository_file_write_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "browser_log_ingestion_now",
  "session_log_ingestion_now",
  "raw_conversation_ingestion_now",
  "telemetry_ingestion_now",
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
  "rule_mutation_now",
  "parser_mutation_now",
  "work_mutation_now",
  "embedding_created_now",
  "vector_search_now",
  "codex_execution_authority",
  "github_automation_authority",
  "ledger_packet_is_commit",
  "ledger_packet_is_truth",
  "ledger_packet_is_proof",
  "ledger_packet_is_accepted_evidence",
  "ledger_packet_is_product_write",
  "product_write_authority",
];

const docsExactPhrases = [
  "Product-write remains parked by #686.",
  "Git Ledger Export Contract is contract-only.",
  "Ledger packets are review/export candidates.",
  "Ledger packets are not commits.",
  "Ledger packets are not truth.",
  "Ledger packets are not proof.",
  "Ledger packets are not accepted evidence.",
  "Ledger packets are not product-write.",
  "Git Ledger export requires future explicit operator action.",
  "This PR does not implement Git Ledger export runtime.",
  "This PR does not execute Git.",
  "This PR does not create commits.",
  "This PR does not create branches.",
  "This PR does not create tags.",
  "This PR does not call GitHub.",
  "This PR does not create pull requests.",
  "This PR does not write repository files.",
  "This PR does not write DB.",
  "This PR does not mutate durable Perspective state.",
  "This PR does not write Formation Receipts.",
  "This PR does not promote Perspective.",
  "This PR does not create proof/evidence.",
  "This PR does not write claim/evidence records.",
  "This PR does not product-write.",
  "Runtime audit refs are review context, not truth.",
  "Smoke/CI pass is not truth.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
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
  "raw ledger payload",
  "raw audit payload",
  "raw dogfooding payload",
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
  "raw ledger payload blocked by contract fixture",
  "raw conversation blocked by ledger fixture",
  "hidden reasoning blocked by ledger fixture",
  "telemetry dump blocked by ledger fixture",
  "secret-like ledger input blocked by fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "git_ledger_export_runtime_now: true",
  "git_write_now: true",
  "git_commit_now: true",
  "git_branch_now: true",
  "git_tag_now: true",
  "github_api_call_now: true",
  "pull_request_creation_now: true",
  "repository_file_write_now: true",
  "db_query_or_write_now: true",
  "route_now: true",
  "ui_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "retrieval_execution_now: true",
  "rag_answer_generation_now: true",
  "source_fetch_now: true",
  "local_file_read_now: true",
  "repository_file_read_now: true",
  "uploaded_file_read_now: true",
  "browser_log_ingestion_now: true",
  "session_log_ingestion_now: true",
  "raw_conversation_ingestion_now: true",
  "telemetry_ingestion_now: true",
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
  "rule_mutation_now: true",
  "parser_mutation_now: true",
  "codex_execution_authority: true",
  "github_automation_authority: true",
  "ledger_packet_is_commit: true",
  "ledger_packet_is_truth: true",
  "ledger_packet_is_proof: true",
  "ledger_packet_is_accepted_evidence: true",
  "ledger_packet_is_product_write: true",
];

const indexForbiddenImplications = [
  "Git export runtime was added",
  "Git write was added",
  "commits were created",
  "branches were created",
  "tags were created",
  "GitHub API was called",
  "PR creation was added",
  "repo file write was added",
  "DB write was added",
  "route was added",
  "UI was added",
  "state mutation was added",
  "proof/evidence writes were added",
  "product-write was added",
  "provider calls were added",
  "retrieval/RAG was added",
  "source fetch was added",
  "raw log ingestion was added",
];

for (const filePath of [
  roadmapPath,
  runtimeAuditDocsPath,
  docsPath,
  typePath,
  fixturePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmapText = readText(roadmapPath);
const runtimeAuditDocsText = readText(runtimeAuditDocsPath);
const docsText = readText(docsPath);
const typeText = readText(typePath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);

assertIncludes(
  roadmapText,
  "git_ledger_export_contract_v0_1",
  "roadmap contains Git Ledger contract slice",
);
assertIncludes(
  runtimeAuditDocsText,
  "Runtime Audit Panel is read-only.",
  runtimeAuditDocsPath,
);

assertFixtureVersions();
assertTypeCoverage();
assertFixtureCoverage();
assertAuthorityBoundaries();
assertReadyAndBlockedPacketConsistency();
assertProductWriteDeniedCoverage();
assertFingerprints();
assertDocsCoverage();
assertIndexCoverage();
assertFixturePrivacy();

console.log(
  JSON.stringify(
    {
      ok: true,
      smoke: "git-ledger-export-contract-v0-1",
      contract_version: contractVersion,
      packets: fixture.expected_bundle.packets.length,
      entries: fixture.expected_bundle.packets.reduce(
        (total, packet) => total + packet.entries.length,
        0,
      ),
      lineage_refs: fixture.expected_bundle.packets.reduce(
        (total, packet) =>
          total +
          packet.entries.reduce(
            (entryTotal, entry) => entryTotal + entry.lineage_refs.length,
            0,
          ),
        0,
      ),
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, fixtureVersion);
  assert.equal(fixture.contract_version, contractVersion);
  assert.equal(fixture.lineage_ref_version, lineageRefVersion);
  assert.equal(fixture.packet_version, packetVersion);
  assert.equal(fixture.entry_version, entryVersion);
  assert.equal(fixture.bundle_version, bundleVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(fixture.status, status);
  assert.equal(fixture.roadmap_ref, roadmapRef);
  assert.deepEqual(fixture.source_fixture_refs, [
    "fixtures/runtime-audit-panel.sample.v0.1.json",
    "fixtures/dogfooding-ingestion-runtime.sample.v0.1.json",
    "fixtures/durable-perspective-state-apply.sample.v0.1.json",
  ]);
  assert.equal(fixture.expected_bundle.status, status);
  assert.ok(fixture.expected_bundle.packets.length > 0, "expected_bundle.packets");
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
}

function assertTypeCoverage() {
  for (const text of [
    "GitLedgerExportContractVersion",
    "GitLedgerLineageRefVersion",
    "GitLedgerPacketVersion",
    "GitLedgerEntryVersion",
    "GitLedgerExportBundleVersion",
    "GitLedgerExportRuntimeScope",
    "GitLedgerExportRuntimeStatus",
    "export interface GitLedgerLineageRef",
    "export interface GitLedgerEntry",
    "export interface GitLedgerPacket",
    "export interface GitLedgerExportBundle",
    "export interface GitLedgerExportValidationResult",
  ]) {
    assertIncludes(typeText, text, `type export ${text}`);
  }
  for (const value of [
    ...entryKinds,
    ...exportStatuses,
    ...lineageRefKinds,
    ...privacyClasses,
    ...redactionStatuses,
    ...reasonCodes,
  ]) {
    assertIncludes(typeText, `"${value}"`, `type union coverage ${value}`);
  }
}

function assertFixtureCoverage() {
  assertDeepSetEqual(fixture.coverage.entry_kinds, entryKinds, "coverage.entry_kinds");
  assertDeepSetEqual(
    fixture.coverage.export_statuses,
    exportStatuses,
    "coverage.export_statuses",
  );
  assertDeepSetEqual(
    fixture.coverage.lineage_ref_kinds,
    lineageRefKinds,
    "coverage.lineage_ref_kinds",
  );
  assertDeepSetEqual(
    fixture.coverage.privacy_classes,
    privacyClasses,
    "coverage.privacy_classes",
  );
  assertDeepSetEqual(
    fixture.coverage.redaction_statuses,
    redactionStatuses,
    "coverage.redaction_statuses",
  );
  assertDeepSetEqual(fixture.coverage.reason_codes, reasonCodes, "coverage.reason_codes");

  const packets = fixture.expected_bundle.packets;
  const entries = packets.flatMap((packet) => packet.entries);
  const refs = entries.flatMap((entry) => entry.lineage_refs);

  assertDeepSetEqual(
    entries.map((entry) => entry.entry_kind),
    entryKinds,
    "parsed entry kind coverage",
  );
  assertDeepSetEqual(
    packets.map((packet) => packet.status),
    exportStatuses,
    "parsed export status coverage",
  );
  assertDeepSetEqual(
    refs.map((ref) => ref.lineage_ref_kind),
    lineageRefKinds,
    "parsed lineage ref kind coverage",
  );
  assertDeepSetEqual(
    [
      ...packets.map((packet) => packet.privacy_class),
      ...entries.map((entry) => entry.privacy_class),
      ...refs.map((ref) => ref.privacy_class),
    ],
    privacyClasses,
    "parsed privacy class coverage",
  );
  assertDeepSetEqual(
    [
      ...packets.map((packet) => packet.redaction_status),
      ...entries.map((entry) => entry.redaction_status),
      ...refs.map((ref) => ref.redaction_status),
    ],
    redactionStatuses,
    "parsed redaction status coverage",
  );
  assertDeepSetEqual(
    collectReasonCodes(fixture.expected_bundle),
    reasonCodes,
    "parsed reason code coverage",
  );

  assertCountMap(
    fixture.expected_bundle.entry_kind_counts,
    entries.map((entry) => entry.entry_kind),
    entryKinds,
    "entry_kind_counts",
  );
  assertCountMap(
    fixture.expected_bundle.lineage_ref_kind_counts,
    refs.map((ref) => ref.lineage_ref_kind),
    lineageRefKinds,
    "lineage_ref_kind_counts",
  );
  assertCountMap(
    fixture.expected_bundle.export_status_counts,
    packets.map((packet) => packet.status),
    exportStatuses,
    "export_status_counts",
  );
}

function assertAuthorityBoundaries() {
  assertAuthorityBoundary(fixture.expected_bundle.authority_boundary, "bundle");
  for (const packet of fixture.expected_bundle.packets) {
    assertAuthorityBoundary(packet.authority_boundary, packet.packet_id);
    for (const entry of packet.entries) {
      assertAuthorityBoundary(entry.authority_boundary, entry.entry_id);
      for (const ref of entry.lineage_refs) {
        assertAuthorityBoundary(ref.authority_boundary, ref.lineage_ref_id);
      }
    }
  }
  for (const source of [docsText, indexText]) {
    for (const forbidden of forbiddenPositiveAuthorityGrants) {
      assertNotIncludes(source, forbidden, `forbidden positive authority ${forbidden}`);
    }
  }
}

function assertReadyAndBlockedPacketConsistency() {
  const readyPacket = fixture.expected_bundle.packets.find(
    (packet) => packet.status === "ready_for_future_operator_export",
  );
  assert.ok(readyPacket, "ready_for_future_operator_export packet must exist");
  assert.equal(readyPacket.public_safe, true, "ready packet public_safe");
  assert.ok(!readyPacket.privacy_class.startsWith("blocked_"), "ready packet privacy");
  assert.ok(!readyPacket.redaction_status.startsWith("blocked_"), "ready packet redaction");
  for (const code of [
    "private_or_raw_payload_blocked",
    "secret_like_pattern_blocked",
    "local_path_blocked",
    "private_url_blocked",
    "raw_conversation_blocked",
    "hidden_reasoning_blocked",
    "telemetry_dump_blocked",
  ]) {
    assert.ok(!readyPacket.reason_codes.includes(code), `ready packet must not include ${code}`);
  }

  for (const packet of fixture.expected_bundle.packets) {
    if (packet.status.startsWith("blocked_")) {
      assert.notEqual(packet.status, "ready_for_future_operator_export");
      assert.ok(
        packet.reason_codes.some((code) =>
          [
            "private_or_raw_payload_blocked",
            "lineage_ref_missing",
            "git_write_not_executed",
            "repository_file_not_written",
          ].includes(code),
        ),
        `${packet.packet_id} blocked reason code`,
      );
    }
  }
}

function assertProductWriteDeniedCoverage() {
  assert.ok(
    collectReasonCodes(fixture.expected_bundle).includes("product_write_denied"),
    "product_write_denied coverage",
  );
  assert.ok(
    collectReasonCodes(fixture.expected_bundle).includes("product_write_not_executed"),
    "product_write_not_executed coverage",
  );
  for (const packet of fixture.expected_bundle.packets) {
    assert.equal(packet.authority_boundary.product_write_now, false, packet.packet_id);
    assert.equal(packet.authority_boundary.product_write_authority, false, packet.packet_id);
  }
}

function assertFingerprints() {
  for (const packet of fixture.expected_bundle.packets) {
    const { packet_fingerprint: packetFingerprint, ...packetWithoutFingerprint } = packet;
    assert.equal(
      packetFingerprint,
      fingerprint(packetWithoutFingerprint),
      `${packet.packet_id}.packet_fingerprint`,
    );
  }
  const { bundle_fingerprint: bundleFingerprint, ...bundleWithoutFingerprint } =
    fixture.expected_bundle;
  assert.equal(bundleFingerprint, fingerprint(bundleWithoutFingerprint), "bundle_fingerprint");
}

function assertDocsCoverage() {
  for (const phrase of docsExactPhrases) {
    assertIncludes(docsText, phrase, `docs phrase ${phrase}`);
  }
}

function assertIndexCoverage() {
  for (const path of [docsPath, typePath, fixturePath, "scripts/smoke-git-ledger-export-contract-v0-1.mjs"]) {
    assertIncludes(indexText, path, `index pointer ${path}`);
  }
  assertIncludes(indexText, "contract-only", "index contract-only");
  assertIncludes(indexText, "ledger packets are not commits", "index not commits");
  assertIncludes(indexText, "Product-write remains parked by #686.", "index product write parked");
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
    assert.ok(
      !sanitized.toLowerCase().includes(marker.toLowerCase()),
      `${fixturePath} must not include forbidden marker ${marker}`,
    );
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.contract_only, true, `${label}.contract_only`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field}`);
  }
}

function collectReasonCodes(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectReasonCodes(item, found);
  } else if (value && typeof value === "object") {
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "reason_codes" && Array.isArray(nestedValue)) {
        for (const code of nestedValue) found.add(code);
      } else {
        collectReasonCodes(nestedValue, found);
      }
    }
  }
  return [...found].sort();
}

function assertCountMap(actual, observedValues, allowedValues, label) {
  for (const value of allowedValues) {
    assert.equal(
      actual[value],
      observedValues.filter((observed) => observed === value).length,
      `${label}.${value}`,
    );
  }
}

function assertDeepSetEqual(actual, expected, label) {
  assert.deepEqual([...new Set(actual)].sort(), [...expected].sort(), label);
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
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
