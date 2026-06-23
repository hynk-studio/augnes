import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/salience-governor-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.salience-governor-contract.sample.v0.1.json";
const smokePath = "scripts/smoke-salience-governor-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.recent-rehearsal-buffer-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName = "smoke:salience-governor-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-salience-governor-contract-v0-1.mjs";
const implementationBuilderPath =
  "lib/research-candidate-review/salience-governor.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-salience-governor-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:salience-governor-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-salience-governor-implementation-v0-1.mjs";
const implementationVersion = "salience_governor_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_salience_governor_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "salience_governor_browser_validation_v0_1";
const contractKind = "salience_governor_contract";
const contractVersion = "salience_governor_contract.v0.1";
const priorityViewVersion = "salience_governor_priority_view.v0.1";
const recommendationStatus =
  "ready_for_salience_governor_implementation_v0_1";
const nextRecommendedSlice = "salience_governor_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const expectedChangedFiles = [
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  sourceValidationSmokePath,
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

const implementationChangedFiles = [
  implementationBuilderPath,
  implementationFixturePath,
  implementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  sourceValidationSmokePath,
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

for (const filePath of [
  typePath,
  smokePath,
  sourceValidationFixturePath,
  sourceValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const typeSource = readFile(typePath);
const sourceValidationFixture = readJson(sourceValidationFixturePath);
const sourceValidationSmoke = readFile(sourceValidationSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const rebuiltFixture = buildContractFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertSalienceScope(fixture.salience_scope);
assertSalienceInputs(fixture.salience_inputs);
assertSalienceComponents(fixture.salience_components);
assertInhibitionComponents(fixture.inhibition_components);
assertActionHintPolicy(fixture.action_hint_policy);
assertPriorityViewContract(fixture.priority_view_contract);
assertNonAuthorityPolicy(fixture.non_authority_policy);
assertSamplePriorityView(fixture.sample_salience_priority_view);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Salience Governor contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "salience-governor-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_recent_rehearsal_buffer_validation_ref:
        fixture.source_recent_rehearsal_buffer_validation_ref,
      action_hint_count:
        fixture.action_hint_policy.allowed_hint_kinds.length,
      salience_component_count: fixture.salience_components.length,
      inhibition_component_count: fixture.inhibition_components.length,
      runtime_salience_scoring_implemented_now:
        fixture.authority_boundary.runtime_salience_scoring_implemented_now,
      salience_score_used_as_authority_now:
        fixture.authority_boundary.salience_score_used_as_authority_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const sourceValidationRef =
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#717`;
  const sourceRecentRehearsalRef = {
    ref_id: "source_ref_recent_rehearsal_buffer_browser_validation_717",
    ref_kind: "recent_rehearsal_buffer_validation_ref",
    ref: sourceValidationRef,
    public_safe: true,
  };
  const candidateRefs = [
    {
      ref_id: "candidate_ref_resume_context_boundary",
      ref_kind: "candidate_ref",
      ref: "research_candidate:resume_context_boundary",
      public_safe: true,
    },
    {
      ref_id: "candidate_ref_priority_hint_review",
      ref_kind: "candidate_ref",
      ref: "research_candidate:priority_hint_review",
      public_safe: true,
    },
  ];
  const openTensionRefs = [
    {
      ref_id: "open_tension_ref_salience_not_authority",
      ref_kind: "open_tension_ref",
      ref: "open_tension:salience_score_not_authority",
      public_safe: true,
    },
  ];
  const failedCheckRefs = [
    {
      ref_id: "failed_check_ref_runtime_scoring_not_implemented",
      ref_kind: "failed_check_ref",
      ref: "failed_check:runtime_salience_scoring_not_implemented",
      public_safe: true,
    },
  ];
  const userDecisionRefs = [
    {
      ref_id: "user_decision_ref_continue_to_salience_contract",
      ref_kind: "user_decision_ref",
      ref: "user_decision:continue_to_salience_governor_contract",
      public_safe: true,
    },
  ];
  const feedbackEventSummaryRefs = [
    {
      ref_id: "feedback_event_summary_ref_candidate_overload",
      ref_kind: "feedback_event_summary_ref",
      ref: "feedback_summary:candidate_overload_reduction",
      public_safe: true,
    },
  ];
  const formationReceiptRefs = [
    {
      ref_id: "formation_receipt_ref_recent_context_provenance",
      ref_kind: "formation_receipt_ref",
      ref: "formation_receipt:recent_context_provenance",
      public_safe: true,
    },
  ];
  const recentContextRefs = [
    {
      ref_id: "recent_context_ref_open_tensions",
      ref_kind: "recent_context_ref",
      ref: "recent_context:open_tensions",
      public_safe: true,
    },
    {
      ref_id: "recent_context_ref_failed_checks",
      ref_kind: "recent_context_ref",
      ref: "recent_context:failed_checks",
      public_safe: true,
    },
  ];
  const manualPinRefs = [
    {
      ref_id: "manual_pin_ref_operator_focus",
      ref_kind: "manual_pin_ref",
      ref: "manual_pin:operator_focus",
      public_safe: true,
    },
  ];
  const manualWatchRefs = [
    {
      ref_id: "manual_watch_ref_possible_reactivation",
      ref_kind: "manual_watch_ref",
      ref: "manual_watch:possible_reactivation",
      public_safe: true,
    },
  ];
  const manualDeferRefs = [
    {
      ref_id: "manual_defer_ref_product_write",
      ref_kind: "manual_defer_ref",
      ref: "manual_defer:product_write_parked_686",
      public_safe: true,
    },
  ];
  const suppressedContextRefs = [
    {
      ref_id: "suppressed_context_ref_repeated_noise",
      ref_kind: "suppressed_context_ref",
      ref: "suppressed_context:repeated_unresolved_noise",
      public_safe: true,
    },
  ];
  const inputs = {
    source_recent_rehearsal_buffer_ref: sourceRecentRehearsalRef,
    candidate_refs: candidateRefs,
    open_tension_refs: openTensionRefs,
    failed_check_refs: failedCheckRefs,
    user_decision_refs: userDecisionRefs,
    feedback_event_summary_refs: feedbackEventSummaryRefs,
    formation_receipt_refs: formationReceiptRefs,
    recent_context_refs: recentContextRefs,
    manual_pin_refs: manualPinRefs,
    manual_watch_refs: manualWatchRefs,
    manual_defer_refs: manualDeferRefs,
    suppressed_context_refs: suppressedContextRefs,
  };
  const actionHintPolicy = buildActionHintPolicy();
  const priorityViewContract = buildPriorityViewContract();
  const nonAuthorityPolicy = buildNonAuthorityPolicy();
  const authorityBoundary = buildAuthorityBoundary();
  const validationPolicy = buildValidationPolicy();
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_recent_rehearsal_buffer_validation_ref: sourceValidationRef,
    salience_scope: {
      working_set_priority_adapter: true,
      candidate_overload_reduction: true,
      display_priority_only: true,
      reuse_priority_only: true,
      contract_only_now: true,
      runtime_salience_scoring_implemented_now: false,
      durable_salience_write_implemented_now: false,
      db_schema_implemented_now: false,
      route_implemented_now: false,
      ui_implemented_now: false,
    },
    salience_inputs: inputs,
    salience_components: buildSalienceComponents(),
    inhibition_components: buildInhibitionComponents(),
    action_hint_policy: actionHintPolicy,
    priority_view_contract: priorityViewContract,
    non_authority_policy: nonAuthorityPolicy,
    sample_salience_priority_view: {
      priority_view_id: "salience_governor_contract_sample_v0_1_001",
      priority_view_version: priorityViewVersion,
      generated_at: "2026-06-23T00:00:00.000Z",
      scope: "research_candidate_review:salience_governor_contract_sample",
      source_refs: [sourceRecentRehearsalRef],
      top_k: priorityViewContract.default_top_k,
      candidate_priority_preview: [
        {
          candidate_ref_id: "candidate_ref_resume_context_boundary",
          salience_score_preview: 0.82,
          action_hint_kinds: ["pin", "inspect", "keep_visible"],
          why_now:
            "Recently active context has unresolved tension and explicit operator focus.",
          component_refs: [
            "source_recency",
            "user_mark",
            "open_tension_count",
            "manual_gravity",
          ],
          inhibition_refs: ["insufficient_evidence"],
          display_only: true,
          not_authority: true,
        },
        {
          candidate_ref_id: "candidate_ref_priority_hint_review",
          salience_score_preview: 0.46,
          action_hint_kinds: ["watch", "cool_down"],
          why_now:
            "Candidate may be useful later but has repeated unresolved noise.",
          component_refs: ["reuse_frequency", "work_relevance"],
          inhibition_refs: [
            "repeated_unresolved_noise",
            "stale_without_reactivation",
          ],
          display_only: true,
          not_authority: true,
        },
      ],
      action_hint_policy_ref: "salience_governor_action_hint_policy.v0.1",
      priority_view_contract_ref: "salience_governor_priority_view_contract.v0.1",
      non_authority_policy_ref: "salience_governor_non_authority_policy.v0.1",
      authority_boundary: authorityBoundary,
      validation: validationPolicy,
    },
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  contract.contract_fingerprint = createFingerprint(contract);
  return contract;
}

function buildSalienceComponents() {
  return [
    component("source_recency", "Recent source context", 0.18),
    component("user_mark", "Manual user mark", 0.14),
    component("open_tension_count", "Open tension count", 0.13),
    component("evidence_strength", "Evidence strength label", 0.11),
    component("reuse_frequency", "Reuse frequency label", 0.1),
    component("conflict_severity", "Conflict severity label", 0.1),
    component("work_relevance", "Work relevance label", 0.1),
    component("promotion_readiness", "Promotion readiness label", 0.08),
    component("manual_gravity", "Manual gravity label", 0.06),
  ];
}

function buildInhibitionComponents() {
  return [
    inhibition("low_provenance", "Low provenance", 0.2),
    inhibition("repeated_unresolved_noise", "Repeated unresolved noise", 0.16),
    inhibition("superseded_by_newer_candidate", "Superseded by newer candidate", 0.15),
    inhibition("user_deferred", "User deferred", 0.14),
    inhibition("insufficient_evidence", "Insufficient evidence", 0.13),
    inhibition("scope_mismatch", "Scope mismatch", 0.12),
    inhibition("stale_without_reactivation", "Stale without reactivation", 0.1),
  ];
}

function component(componentKind, previewLabel, previewWeight) {
  return {
    component_kind: componentKind,
    preview_label: previewLabel,
    preview_weight: previewWeight,
    display_only: true,
    not_authority: true,
  };
}

function inhibition(inhibitionKind, previewLabel, previewWeight) {
  return {
    inhibition_kind: inhibitionKind,
    preview_label: previewLabel,
    preview_weight: previewWeight,
    display_only: true,
    not_authority: true,
  };
}

function buildActionHintPolicy() {
  const allowedHintKinds = [
    "pin",
    "watch",
    "defer",
    "boost",
    "suppress",
    "reactivate",
    "inspect",
    "keep_visible",
    "cool_down",
  ];
  return {
    allowed_hint_kinds: allowedHintKinds,
    hint_policy_by_kind: Object.fromEntries(
      allowedHintKinds.map((hintKind) => [
        hintKind,
        {
          hint_kind: hintKind,
          hint_only: true,
          no_mutation_now: true,
          requires_later_user_action: true,
          not_execution_authority: true,
          not_promotion_authority: true,
          not_product_write: true,
        },
      ]),
    ),
  };
}

function buildPriorityViewContract() {
  return {
    salience_score_preview_allowed: true,
    score_range: "0_to_1",
    deterministic_fixture_only_now: true,
    runtime_score_computation_now: false,
    top_k_preview_allowed: true,
    default_top_k: 10,
    priority_view_is_display_only: true,
    priority_view_does_not_delete_or_hide_records: true,
    suppression_is_display_hint_only: true,
    reactivation_is_display_hint_only: true,
  };
}

function buildNonAuthorityPolicy() {
  return {
    not_promotion_basis: true,
    not_source_of_truth: true,
    not_proof_or_evidence: true,
    not_perspective_state: true,
    not_work_status: true,
    not_retrieval_rag_result: true,
    not_product_write: true,
    salience_score_not_authority: true,
    salience_score_not_promotion_readiness: true,
    salience_score_not_durable_approval: true,
    salience_score_not_evidence_strength: true,
    may_help_resume_work: true,
    may_help_display_priority: true,
    may_help_agent_brief_later: true,
    durable_write_requires_later_contract: true,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_only: true,
    salience_governor_contract_defined_now: true,
    runtime_salience_scoring_implemented_now: false,
    durable_salience_write_implemented_now: false,
    salience_score_used_as_authority_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    production_db_used_now: false,
    durable_memory_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    formation_receipt_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    candidate_mutation_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildValidationPolicy() {
  return {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    runtime_salience_scoring_now: false,
  };
}

function assertTypeContract() {
  for (const exportName of [
    "SalienceGovernorContract",
    "SalienceGovernorScope",
    "SalienceGovernorInputs",
    "SalienceComponentPreview",
    "SalienceInhibitionPreview",
    "SalienceActionHintPolicy",
    "SaliencePriorityViewContract",
    "SalienceNonAuthorityPolicy",
    "SalienceAuthorityBoundary",
    "SalienceValidationPolicy",
    "SaliencePriorityViewShape",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(type|interface)\\s+${escapeRegExp(exportName)}\\b`),
      `${typePath} must export ${exportName}`,
    );
  }
  for (const requiredText of [
    contractKind,
    contractVersion,
    "source_recent_rehearsal_buffer_validation_ref",
    "salience_scope",
    "salience_inputs",
    "salience_components",
    "inhibition_components",
    "action_hint_policy",
    "priority_view_contract",
    "non_authority_policy",
    "sample_salience_priority_view",
    "authority_boundary",
    "validation_policy",
    recommendationStatus,
    nextRecommendedSlice,
    "contract_fingerprint",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
  if (salienceGovernorImplementationSliceActive()) {
    assertSalienceGovernorImplementationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  assert.deepEqual(
    addedScripts,
    [packageScriptName],
    "package.json must add only the Salience Governor contract smoke script",
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (salienceGovernorImplementationSliceActive()) {
    assertSalienceGovernorImplementationChangedFiles(changedFiles);
    return;
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor contract slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor contract slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser fetch", regex: /\bfetch\s*\(/ },
      { label: "localStorage", regex: /\blocalStorage\b/ },
      { label: "sessionStorage", regex: /\bsessionStorage\b/ },
      { label: "indexedDB", regex: /\bindexedDB\b/ },
      { label: "document.cookie", regex: /document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime SQL", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/ },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bruntimeDbWrite\b|\bproductionDbWrite\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "recent rehearsal buffer write", regex: /\bwriteRecentRehearsalBuffer\b|\binsertRecentRehearsalBuffer\b|\bpersistRecentRehearsalBuffer\b/i },
      { label: "formation receipt write", regex: /\bwriteFormationReceipt\b|\binsertFormationReceipt\b|\bpersistFormationReceipt\b/i },
      { label: "feedback write", regex: /\bwriteFeedbackEvent\b|\binsertFeedbackEvent\b|\bmutateFeedbackEvent\b/ },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "proof write", regex: /\bcreateProof\b|\binsertProof\b/ },
      { label: "evidence write", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b/ },
      { label: "Perspective durable state write", regex: /\bwritePerspective\b|\bupsertPerspective\b/ },
      { label: "promotion decision", regex: /\bcreatePromotionDecision\b|\brecordPromotionDecision\b/ },
      { label: "work mutation", regex: /\bcreateWork\b|\bmutateWork\b|\bupdateWork\b/ },
      { label: "runtime salience scoring", regex: /\bcomputeSalienceScore\b|\brunSalienceScoring\b|\bruntimeSalienceScoring\b/i },
      { label: "salience authority true flag", regex: /\bsalience_authority:\s*true\b/ },
      { label: "salience score authority", regex: /\bsalience_score_used_as_authority_now:\s*true\b/ },
      { label: "product write", regex: /\bexecuteProductWrite\b|\bproductDbWrite\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_recent_rehearsal_buffer_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#717`,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.match(value.contract_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
}

function assertSalienceScope(value) {
  assert.deepEqual(value, {
    working_set_priority_adapter: true,
    candidate_overload_reduction: true,
    display_priority_only: true,
    reuse_priority_only: true,
    contract_only_now: true,
    runtime_salience_scoring_implemented_now: false,
    durable_salience_write_implemented_now: false,
    db_schema_implemented_now: false,
    route_implemented_now: false,
    ui_implemented_now: false,
  });
}

function assertSalienceInputs(value) {
  for (const field of [
    "source_recent_rehearsal_buffer_ref",
    "candidate_refs",
    "open_tension_refs",
    "failed_check_refs",
    "user_decision_refs",
    "feedback_event_summary_refs",
    "formation_receipt_refs",
    "recent_context_refs",
    "manual_pin_refs",
    "manual_watch_refs",
    "manual_defer_refs",
    "suppressed_context_refs",
  ]) {
    assert.ok(Object.hasOwn(value, field), `salience inputs must include ${field}`);
  }
  assert.ok(value.candidate_refs.length > 0);
  assert.ok(value.open_tension_refs.length > 0);
  assert.ok(value.failed_check_refs.length > 0);
  assert.ok(value.feedback_event_summary_refs.length > 0);
  assert.ok(value.recent_context_refs.length > 0);
}

function assertSalienceComponents(value) {
  assert.deepEqual(
    value.map((componentValue) => componentValue.component_kind),
    [
      "source_recency",
      "user_mark",
      "open_tension_count",
      "evidence_strength",
      "reuse_frequency",
      "conflict_severity",
      "work_relevance",
      "promotion_readiness",
      "manual_gravity",
    ],
  );
  for (const componentValue of value) {
    assert.equal(componentValue.display_only, true);
    assert.equal(componentValue.not_authority, true);
    assert.equal(typeof componentValue.preview_label, "string");
    assert.equal(typeof componentValue.preview_weight, "number");
  }
}

function assertInhibitionComponents(value) {
  assert.deepEqual(
    value.map((componentValue) => componentValue.inhibition_kind),
    [
      "low_provenance",
      "repeated_unresolved_noise",
      "superseded_by_newer_candidate",
      "user_deferred",
      "insufficient_evidence",
      "scope_mismatch",
      "stale_without_reactivation",
    ],
  );
  for (const componentValue of value) {
    assert.equal(componentValue.display_only, true);
    assert.equal(componentValue.not_authority, true);
    assert.equal(typeof componentValue.preview_label, "string");
    assert.equal(typeof componentValue.preview_weight, "number");
  }
}

function assertActionHintPolicy(value) {
  assert.deepEqual(value.allowed_hint_kinds, [
    "pin",
    "watch",
    "defer",
    "boost",
    "suppress",
    "reactivate",
    "inspect",
    "keep_visible",
    "cool_down",
  ]);
  for (const hintKind of value.allowed_hint_kinds) {
    assert.deepEqual(value.hint_policy_by_kind[hintKind], {
      hint_kind: hintKind,
      hint_only: true,
      no_mutation_now: true,
      requires_later_user_action: true,
      not_execution_authority: true,
      not_promotion_authority: true,
      not_product_write: true,
    });
  }
}

function assertPriorityViewContract(value) {
  assert.equal(value.salience_score_preview_allowed, true);
  assert.equal(value.score_range, "0_to_1");
  assert.equal(value.deterministic_fixture_only_now, true);
  assert.equal(value.runtime_score_computation_now, false);
  assert.equal(value.top_k_preview_allowed, true);
  assert.equal(value.default_top_k, 10);
  assert.equal(value.priority_view_is_display_only, true);
  assert.equal(value.priority_view_does_not_delete_or_hide_records, true);
  assert.equal(value.suppression_is_display_hint_only, true);
  assert.equal(value.reactivation_is_display_hint_only, true);
}

function assertNonAuthorityPolicy(value) {
  assert.equal(value.not_promotion_basis, true);
  assert.equal(value.not_source_of_truth, true);
  assert.equal(value.not_proof_or_evidence, true);
  assert.equal(value.not_perspective_state, true);
  assert.equal(value.not_work_status, true);
  assert.equal(value.not_retrieval_rag_result, true);
  assert.equal(value.not_product_write, true);
  assert.equal(value.salience_score_not_authority, true);
  assert.equal(value.salience_score_not_promotion_readiness, true);
  assert.equal(value.salience_score_not_durable_approval, true);
  assert.equal(value.salience_score_not_evidence_strength, true);
  assert.equal(value.may_help_resume_work, true);
  assert.equal(value.may_help_display_priority, true);
  assert.equal(value.may_help_agent_brief_later, true);
  assert.equal(value.durable_write_requires_later_contract, true);
}

function assertSamplePriorityView(value) {
  assert.equal(value.priority_view_version, priorityViewVersion);
  assert.equal(value.top_k, 10);
  assert.ok(Array.isArray(value.source_refs) && value.source_refs.length > 0);
  assert.ok(Array.isArray(value.candidate_priority_preview));
  assert.ok(value.candidate_priority_preview.length > 0);
  for (const candidate of value.candidate_priority_preview) {
    assert.equal(typeof candidate.why_now, "string");
    assert.ok(candidate.why_now.length > 0);
    assert.equal(typeof candidate.salience_score_preview, "number");
    assert.ok(candidate.salience_score_preview >= 0);
    assert.ok(candidate.salience_score_preview <= 1);
    assert.equal(candidate.display_only, true);
    assert.equal(candidate.not_authority, true);
    assert.ok(candidate.action_hint_kinds.length > 0);
  }
  assert.deepEqual(value.authority_boundary, fixture.authority_boundary);
  assert.deepEqual(value.validation, fixture.validation_policy);
}

function assertAuthorityBoundary(value) {
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "contract_only" ||
      key === "salience_governor_contract_defined_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    runtime_salience_scoring_now: false,
  });
}

function assertDocsPointers() {
  for (const requiredText of [
    "Salience Governor contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    packageScriptName,
    "contract-only display/reuse priority adapter",
    "candidate overload reduction",
    "salience components",
    "inhibition components",
    "hint-only pin/watch/defer/boost/suppress/reactivate/inspect/keep_visible/cool_down",
    "no runtime salience scoring",
    "no salience score authority",
    "no runtime persistence",
    "no durable memory write",
    "no runtime DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no proof/evidence/Perspective promotion/work mutation",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Salience Governor contract v0\.1/i);
    assert.match(doc, /display\/reuse priority/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /not Perspective state|durable Perspective promotion/i);
    assert.match(doc, /not work status|work mutation/i);
    assert.match(doc, /not promotion authority|promotion/i);
    assert.match(doc, /not salience authority|salience score/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /product write/i);
    assert.match(doc, /runtime DB|no runtime DB/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertSourceValidationDownstreamPointer() {
  for (const requiredText of [
    contractVersion,
    typePath,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "candidate overload reduction",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      `#717 Recent Rehearsal Buffer browser validation smoke must allow Salience Governor downstream pointer: ${requiredText}`,
    );
  }
}

function assertPortableMergeBaseFallback() {
  for (const requiredText of [
    "gitRefExists",
    "tryGitOutput",
    "origin/main",
    "main",
    "HEAD^",
    "Unable to determine a base ref for static changed-file validation",
  ]) {
    assert.ok(smokeSource().includes(requiredText), `smoke must include portable mergeBaseRef text: ${requiredText}`);
  }
}

function createFingerprint(value) {
  const normalized = JSON.parse(JSON.stringify(value));
  delete normalized.contract_fingerprint;
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function smokeSource() {
  return readFile(smokePath);
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]));
}

function readChangedFiles() {
  const changed = [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["diff", "--cached", "--name-only"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(changed)].sort();
}

function stripValidationText(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) {
    return cachedMergeBaseRef;
  }
  for (const ref of ["origin/main", "main"]) {
    if (!gitRefExists(ref)) {
      continue;
    }
    const mergeBase = tryGitOutput(["merge-base", "HEAD", ref])?.trim();
    if (mergeBase) {
      cachedMergeBaseRef = mergeBase;
      return cachedMergeBaseRef;
    }
  }
  const parentRef = tryGitOutput(["rev-parse", "--verify", "HEAD^"])?.trim();
  if (parentRef) {
    cachedMergeBaseRef = parentRef;
    return cachedMergeBaseRef;
  }
  throw new Error(
    "Unable to determine a base ref for static changed-file validation. " +
      "Expected origin/main, local main, or HEAD^ to resolve.",
  );
}

function gitRefExists(ref) {
  return tryGitOutput(["rev-parse", "--verify", ref]) !== null;
}

function tryGitOutput(args) {
  try {
    return readGitOutput(args);
  } catch {
    return null;
  }
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function salienceGovernorImplementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function assertSalienceGovernorImplementationPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts[implementationPackageScriptName],
    implementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [implementationPackageScriptName],
    "package.json must add only the Salience Governor implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertSalienceGovernorImplementationChangedFiles(changedFiles) {
  for (const expectedFile of implementationChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  assert.ok(
    !changedFiles.includes("lib/research-candidate-review/recent-rehearsal-buffer.ts"),
    "Salience Governor implementation slice must not change the Recent Rehearsal Buffer builder",
  );
  assert.ok(
    !changedFiles.includes(
      "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    ),
    "Salience Governor implementation slice must not change the Recent Rehearsal Buffer implementation fixture",
  );
  for (const changedFile of changedFiles) {
    assert.ok(
      implementationChangedFiles.includes(changedFile),
      `unexpected changed file in Salience Governor implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    implementationVersion,
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
    "generated display/reuse priority view",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource().includes(requiredText),
      `Salience Governor contract smoke must allow implementation downstream pointer: ${requiredText}`,
    );
  }
}
