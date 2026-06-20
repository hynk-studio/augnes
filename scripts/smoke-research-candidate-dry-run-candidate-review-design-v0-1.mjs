import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-dry-run-candidate-review-and-authority-design.ts";
const componentPath =
  "components/research-candidate-dry-run-candidate-review-design-panel.tsx";
const dryRunReadoutPath =
  "components/research-candidate-promotion-dry-run-plan-readout.tsx";
const candidateReviewFixturePath =
  "fixtures/research-candidate-review.manual-note-dry-run-candidate-review-packet.sample.v0.1.json";
const authorityDesignFixturePath =
  "fixtures/research-candidate-review.manual-note-authority-gated-promotion-design-packet.sample.v0.1.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  helperPath,
  componentPath,
  dryRunReadoutPath,
  candidateReviewFixturePath,
  authorityDesignFixturePath,
  docsIndexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const component = readFileSync(componentPath, "utf8");
const dryRunReadout = readFileSync(dryRunReadoutPath, "utf8");
const candidateReviewFixtureText = readFileSync(
  candidateReviewFixturePath,
  "utf8",
);
const authorityDesignFixtureText = readFileSync(
  authorityDesignFixturePath,
  "utf8",
);
const candidateReviewFixture = JSON.parse(candidateReviewFixtureText);
const authorityDesignFixture = JSON.parse(authorityDesignFixtureText);
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelperContract();
assertComponentContract();
assertFixtureContract();
assertDocsAndPackagePointers();
assertNoRouteSchemaDependencyExpansion();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-dry-run-candidate-review-design-v0-1",
      helper_exists: true,
      component_exists: true,
      fixtures_exist_and_parse: true,
      package_script_checked: true,
      docs_pointer_checked: true,
      no_api_route_added: true,
      no_schema_migration_references: true,
      no_dependency_added: true,
      local_only_selection_and_copy_checked: true,
      authority_false_flags_checked: true,
      forbidden_patterns_absent: true,
    },
    null,
    2,
  ),
);

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_DRY_RUN_CANDIDATE_REVIEW_PACKET_VERSION",
    "manual_note_dry_run_candidate_review_packet.v0.1",
    "MANUAL_NOTE_AUTHORITY_GATED_PROMOTION_DESIGN_PACKET_VERSION",
    "manual_note_authority_gated_promotion_design_packet.v0.1",
    "buildManualNoteDryRunCandidateSelectionDefault",
    "buildManualNoteDryRunCandidateReviewPacket",
    "buildManualNoteDryRunCandidateReviewMarkdown",
    "buildManualNoteDryRunCandidateReviewJson",
    "buildManualNoteAuthorityGatedPromotionDesignPacket",
    "buildManualNoteAuthorityGatedPromotionDesignMarkdown",
    "buildManualNoteAuthorityGatedPromotionDesignJson",
    "createManualNoteDryRunCandidateReviewFingerprint",
    "createManualNoteAuthorityGatedPromotionDesignFingerprint",
    "packet_kind: \"manual_note_dry_run_candidate_review_packet\"",
    "packet_kind: \"manual_note_authority_gated_promotion_design_packet\"",
    "selection_mode: \"local_operator_screen_state\"",
    "selection_persisted: false",
    "selection_is_not_approval: true",
    "selection_is_not_promotion_authority: true",
    "local_clipboard_only: true",
    "external_handoff_sent: false",
    "packet_persisted: false",
    "actual_promotion_allowed: false",
    "proof_or_evidence_writes: false",
    "perspective_or_canonical_writes: false",
    "canonical_graph_write: false",
    "work_item_creation: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "browser_persistence: false",
    "authority_gated_actual_promotion_design_packet",
    "disabled_by_default_actual_promotion_write_adapter_skeleton",
    "source_evidence_authority_lane",
    "idempotency_key_generated_now: false",
    "rollback_implemented_now: false",
    "audit_record_created_now: false",
    "approval_history_created_now: false",
    "source_fetching_performed_now: false",
    "source_verification_performed_now: false",
    "proof_evidence_records_created_now: false",
    "0x811c9dc5",
    "0x01000193",
    'key !== "generated_at" && key !== "selected_at"',
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertComponentContract() {
  assert.ok(
    dryRunReadout.includes("DryRunCandidateReviewDesignPanel"),
    "dry-run readout must import/render review/design panel",
  );
  assert.ok(
    dryRunReadout.includes("<DryRunCandidateReviewDesignPanel plan={currentPlan} />"),
    "dry-run readout must render review/design panel for current dry-run plan",
  );

  for (const requiredText of [
    "Dry-run candidate review and authority design",
    "Local review aid only.",
    "Selections are not approval.",
    "Selections are not persisted.",
    "Selections do not grant write authority.",
    "Authority design is not actual promotion.",
    "No proof/evidence, Perspective, canonical graph, work item, provider, retrieval, source fetch, or external handoff is performed.",
    "source reference targets",
    "claim targets",
    "evidence targets",
    "tension/gap targets",
    "perspective delta targets",
    "follow-up work targets",
    "Select all source references",
    "Clear source references",
    "Select all claims",
    "Clear claims",
    "Select all evidence",
    "Clear evidence",
    "Select all tensions and gaps",
    "Clear tensions and gaps",
    "Select all Perspective deltas",
    "Clear Perspective deltas",
    "Select all follow-up work",
    "Clear follow-up work",
    "Select all dry-run candidates",
    "Clear all dry-run candidate selections",
    "Build selected candidate review packet",
    "Build authority-gated design packet",
    "Copy selected review Markdown",
    "Copy selected review JSON",
    "Copy authority design Markdown",
    "Copy authority design JSON",
    "selected_total",
    "unselected_total",
    "selection_persisted",
    "write_authority_granted",
    "Proposed write contract",
    "Idempotency design",
    "Rollback design",
    "Review audit design",
    "Source evidence authority design",
    "Execution boundary",
    "Blocking requirements before any write",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must include ${requiredText}`,
    );
  }

  const resetEffect = functionBlock(component, "DryRunCandidateReviewDesignPanel");
  assertOrdered(resetEffect, [
    "useEffect(() => {",
    "setSelection(buildManualNoteDryRunCandidateSelectionDefault(plan))",
    "setCandidateReviewPacket(null)",
    "setAuthorityDesignPacket(null)",
    "setCopyState(EMPTY_COPY_STATE)",
    "}, [planIdentity, plan])",
  ]);

  for (const requiredText of [
    "copyState.packetKind ===",
    "copyState.previewDraftId === previewDraftId",
    "copyState.packetFingerprint ===",
    "currentCandidateReviewPacket?.packet_fingerprint",
    "currentAuthorityDesignPacket?.packet_fingerprint",
    "packetKind: packet.packet_kind",
    "previewDraftId: plan.preview_draft_id",
    "packetFingerprint: packet.packet_fingerprint",
    "currentCopyState?.message",
    "currentCopyState?.fallbackText",
    "value={currentCopyState.fallbackText}",
    "data-selection-persisted=\"false\"",
    "data-design-packet-persisted=\"false\"",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must keep local state/copy fallback scoped with ${requiredText}`,
    );
  }
}

function assertFixtureContract() {
  assert.equal(
    candidateReviewFixture.packet_kind,
    "manual_note_dry_run_candidate_review_packet",
  );
  assert.equal(
    candidateReviewFixture.packet_version,
    "manual_note_dry_run_candidate_review_packet.v0.1",
  );
  assert.match(candidateReviewFixture.packet_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.match(
    candidateReviewFixture.source_plan.plan_fingerprint,
    /^fnv1a32:[0-9a-f]{8}$/,
  );
  assert.equal(candidateReviewFixture.selection_state.selection_persisted, false);
  assert.equal(
    candidateReviewFixture.selection_state.selection_is_not_approval,
    true,
  );
  assert.equal(
    candidateReviewFixture.selection_state.selection_is_not_promotion_authority,
    true,
  );
  assert.equal(candidateReviewFixture.selected_counts.source_reference_targets, 1);
  assert.equal(candidateReviewFixture.selected_counts.claim_targets, 1);
  assert.equal(candidateReviewFixture.selected_counts.evidence_targets, 1);
  assert.equal(candidateReviewFixture.selected_counts.tension_gap_targets, 1);
  assert.equal(candidateReviewFixture.selected_counts.perspective_delta_targets, 1);
  assert.equal(candidateReviewFixture.selected_counts.follow_up_work_targets, 1);
  assert.equal(candidateReviewFixture.unselected_counts.tension_gap_targets, 1);
  assert.ok(candidateReviewFixture.selected_source_reference_targets.length >= 1);
  assert.ok(candidateReviewFixture.selected_claim_targets.length >= 1);
  assert.ok(candidateReviewFixture.selected_evidence_targets.length >= 1);
  assert.ok(candidateReviewFixture.selected_tension_gap_targets.length >= 1);
  assert.ok(candidateReviewFixture.selected_perspective_delta_targets.length >= 1);
  assert.ok(candidateReviewFixture.selected_follow_up_work_targets.length >= 1);
  assert.equal(
    candidateReviewFixture.selected_follow_up_work_targets[0].target_status,
    "not_work_item",
  );
  assert.equal(candidateReviewFixture.next_recommended_slice, "authority_gated_actual_promotion_design_packet");

  for (const [field, expectedValue] of Object.entries({
    actual_promotion_allowed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    packet_persisted: false,
    browser_persistence: false,
  })) {
    assert.equal(
      candidateReviewFixture.authority[field],
      expectedValue,
      `candidate review authority.${field} must be ${expectedValue}`,
    );
  }

  for (const [field, expectedValue] of Object.entries({
    local_clipboard_only: true,
    external_handoff_sent: false,
    packet_persisted: false,
    selection_persisted: false,
    approval_created: false,
    promotion_authority_granted: false,
    actual_promotion_allowed: false,
  })) {
    assert.equal(
      candidateReviewFixture.local_copy_boundary[field],
      expectedValue,
      `candidate review local_copy_boundary.${field} must be ${expectedValue}`,
    );
  }

  assert.equal(
    authorityDesignFixture.packet_kind,
    "manual_note_authority_gated_promotion_design_packet",
  );
  assert.equal(
    authorityDesignFixture.packet_version,
    "manual_note_authority_gated_promotion_design_packet.v0.1",
  );
  assert.match(authorityDesignFixture.packet_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(
    authorityDesignFixture.design_status,
    "ready_for_human_authority_review",
  );
  assert.equal(
    authorityDesignFixture.next_recommended_slice,
    "disabled_by_default_actual_promotion_write_adapter_skeleton",
  );

  for (const [field, expectedValue] of Object.entries({
    actual_write_route_added: false,
    write_adapter_implemented: false,
    write_execution_enabled: false,
    selected_preview_draft_required: true,
    selected_candidates_required: true,
    operator_promotion_decision_required: true,
    durable_write_contract_required: true,
    source_evidence_authority_required: true,
    proof_evidence_write_authority_required: true,
    canonical_perspective_write_authority_required: true,
    idempotency_and_rollback_required: true,
    review_audit_record_required: true,
  })) {
    assert.equal(
      authorityDesignFixture.proposed_write_contract[field],
      expectedValue,
      `design proposed_write_contract.${field} must be ${expectedValue}`,
    );
  }

  assert.ok(
    authorityDesignFixture.canonical_target_mapping_design.selected_claim_targets
      .length >= 1,
  );
  assert.ok(
    authorityDesignFixture.canonical_target_mapping_design.selected_evidence_targets
      .length >= 1,
  );
  assert.ok(
    authorityDesignFixture.canonical_target_mapping_design
      .selected_perspective_delta_targets.length >= 1,
  );
  assert.ok(
    authorityDesignFixture.canonical_target_mapping_design
      .selected_source_reference_targets.length >= 1,
  );
  assert.ok(
    authorityDesignFixture.canonical_target_mapping_design
      .selected_follow_up_work_targets.length >= 1,
  );
  assert.equal(authorityDesignFixture.idempotency_design.required, true);
  assert.equal(
    authorityDesignFixture.idempotency_design.idempotency_key_generated_now,
    false,
  );
  assert.equal(authorityDesignFixture.rollback_design.required, true);
  assert.equal(
    authorityDesignFixture.rollback_design.rollback_implemented_now,
    false,
  );
  assert.equal(authorityDesignFixture.review_audit_design.required, true);
  assert.equal(
    authorityDesignFixture.review_audit_design.audit_record_created_now,
    false,
  );
  assert.equal(
    authorityDesignFixture.review_audit_design.approval_history_created_now,
    false,
  );
  assert.equal(
    authorityDesignFixture.source_evidence_authority_design
      .source_fetching_performed_now,
    false,
  );
  assert.equal(
    authorityDesignFixture.source_evidence_authority_design
      .source_verification_performed_now,
    false,
  );
  assert.equal(
    authorityDesignFixture.source_evidence_authority_design
      .proof_evidence_records_created_now,
    false,
  );
  assert.deepEqual(
    authorityDesignFixture.blocking_requirements_before_any_write,
    [
      "explicit_operator_promotion_decision",
      "source_verification_authority",
      "proof_evidence_write_authority",
      "canonical_perspective_write_authority",
      "idempotency_contract",
      "rollback_contract",
      "audit_record_contract",
      "disabled_by_default_write_adapter_review",
    ],
  );

  for (const [field, expectedValue] of Object.entries({
    design_only: true,
    actual_promotion_allowed: false,
    write_authority_granted: false,
    actual_write_route_added: false,
    write_adapter_implemented: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    design_packet_persisted: false,
    browser_persistence: false,
  })) {
    assert.equal(
      authorityDesignFixture.execution_boundary[field],
      expectedValue,
      `design execution_boundary.${field} must be ${expectedValue}`,
    );
  }

  assertNoRawOrExternalFixtureText(candidateReviewFixtureText);
  assertNoRawOrExternalFixtureText(authorityDesignFixtureText);
  assertNoActualWriteIds(candidateReviewFixture, candidateReviewFixturePath);
  assertNoActualWriteIds(authorityDesignFixture, authorityDesignFixturePath);
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-dry-run-candidate-review-design-v0-1"
    ],
    "node scripts/smoke-research-candidate-dry-run-candidate-review-design-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note dry-run candidate review and authority design packets",
    helperPath,
    componentPath,
    candidateReviewFixturePath,
    authorityDesignFixturePath,
    "npm run smoke:research-candidate-dry-run-candidate-review-design-v0-1",
    "local-only dry-run candidate review",
    "authority-gated actual promotion design packet",
    "operator-visible selections",
    "local clipboard only",
    "no route",
    "no write authority",
    "no persistence",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no schema/migration code",
    "no dependency",
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
      !/manual-note-dry-run-candidate-review|authority-gated-promotion-design|dry_run_candidate_review_packet|authority_gated_promotion_design_packet/i.test(
        `${filePath}\n${text}`,
      ),
      `no API route may be added or wired for this slice: ${filePath}`,
    );
  }

  for (const filePath of listFiles(".")) {
    if (!/(migration|migrations|schema)/i.test(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    assert.ok(
      !/manual_note_dry_run_candidate_review|authority_gated_promotion_design|dry_run_candidate_review/i.test(
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
    [dryRunReadoutPath, dryRunReadout],
  ];

  for (const [filePath, text] of inspected) {
    for (const forbiddenActionLabel of [
      "Promote",
      "Approve",
      "Reject",
      "Defer",
      "Create proof",
      "Create evidence",
      "Create work item",
      "Send handoff",
      "Fetch source",
      "Run provider",
      "Execute Codex",
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

  for (const [filePath, text] of [[helperPath, helper]]) {
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
        "canonical_record_id",
        "canonical_claim_id",
        "proof_id_created_now",
        "evidence_id_created_now",
        "perspective_id_created_now",
        "work_item_id_created_now",
        "canonical_graph_edge_id_created_now",
        "canonical_claim_id_created_now",
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

function functionBlock(source, name) {
  let start = source.indexOf(`function ${name}(`);
  if (start === -1) {
    start = source.indexOf(`async function ${name}(`);
  }
  if (start === -1) {
    start = source.indexOf(`export function ${name}(`);
  }
  assert.notEqual(start, -1, `function ${name} must exist`);
  const signatureStart = source.indexOf("(", start);
  assert.notEqual(signatureStart, -1, `function ${name} must have parameters`);
  let parameterDepth = 0;
  let signatureEnd = -1;
  for (let index = signatureStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") parameterDepth += 1;
    if (char === ")") {
      parameterDepth -= 1;
      if (parameterDepth === 0) {
        signatureEnd = index;
        break;
      }
    }
  }
  assert.notEqual(signatureEnd, -1, `function ${name} parameter list must close`);

  const bodyStart = source.indexOf("{", signatureEnd);
  assert.notEqual(bodyStart, -1, `function ${name} must have a body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`function ${name} body was not closed`);
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
