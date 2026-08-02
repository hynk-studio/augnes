#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  extractOperatorExecutionChildStaticMetadata,
  extractOperatorExecutionLifecycleTimingStaticMetadata,
  hashStringInventory,
} from "./browser-verification-static-metadata.mjs";
import { loadOperatorExecutionOwnerContractV1 } from "./operator-execution-result-contract-v1.mjs";

const inventory = JSON.parse(
  readFileSync(
    new URL("./browser-verification-ownership-inventory.v1.json", import.meta.url),
    "utf8",
  ),
);
const equivalence = JSON.parse(
  readFileSync(
    new URL("./operator-execution-equivalence.v1.json", import.meta.url),
    "utf8",
  ),
);
const legacySource = readFileSync(
  new URL("./browser-validate-vnext-native-host-result-v0-1.mjs", import.meta.url),
  "utf8",
);
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const canonicalSuiteSource = readFileSync(
  new URL("./run-canonical-test-suite.mjs", import.meta.url),
  "utf8",
);
const operatorLifecycleSource = readFileSync(
  new URL("./operator-execution-browser-lifecycle-v1.mjs", import.meta.url),
  "utf8",
);
const operatorEffectLedgerSource = readFileSync(
  new URL("./operator-execution-effect-ledger-v1.mjs", import.meta.url),
  "utf8",
);
const operatorReviewControlSource = readFileSync(
  new URL("./browser-validate-operator-review-control-v1.mjs", import.meta.url),
  "utf8",
);
const operatorFixtureSource = readFileSync(
  new URL("./operator-execution-browser-fixture-v1.ts", import.meta.url),
  "utf8",
);
const operatorShard = inventory.future_shards.find(
  (entry) => entry.id === "operator_execution",
);
const implementation = inventory.implemented_shards.operator_execution;
assert(operatorShard);
assert(implementation);
assert.equal(operatorShard.implemented_in_vfy1c, true);
assert.equal(operatorShard.implemented_in_vfy1b, false);
assert.equal(implementation.planner_selected, false);
assert.equal(implementation.receipt_aggregated, false);
assert.equal(implementation.planner_receipt_semantics_changed, false);
assert.equal(implementation.legacy_core_shadow_retained, true);
assert.equal(implementation.legacy_continuity_multi_candidate_shadow_retained, true);
assert.equal(
  packageJson.scripts["test:e2e:operator-execution"],
  "node scripts/run-canonical-test-suite.mjs e2e-operator-execution",
);
assert.equal(implementation.child_timeout_ms, 360_000);
assert.equal(implementation.successful_inner_target_ms, 300_000);
assert.equal(implementation.reference_bound_ms, 480_000);
assert.equal(implementation.required_reference_headroom_ms, 180_000);
for (const forbiddenInspectorFabricationOwner of [
  "queuedInspectorResponse",
  "queueNextInspectorResponse",
  "assertNoQueuedInspectorResponse",
  "Fetch.fulfillRequest",
  'urlPattern: "*/api/vnext/operator/inspector*"',
]) {
  assert.equal(
    operatorLifecycleSource.includes(forbiddenInspectorFabricationOwner),
    false,
    `operator_inspector_fabrication_owner_present:${forbiddenInspectorFabricationOwner}`,
  );
  assert.equal(
    operatorReviewControlSource.includes(forbiddenInspectorFabricationOwner),
    false,
    `operator_review_inspector_fabrication_owner_present:${forbiddenInspectorFabricationOwner}`,
  );
}
for (const requiredProductionInspectorOwner of [
  "operator_execution_inspector_route_fixture.v1",
  "inspector_section_fixed_bound_exceeded",
  "pure_presentation_contract_only_no_production_failure_seam",
  "capability_coverage: Array.from({ length: 65 }",
]) {
  assert.equal(
    operatorFixtureSource.includes(requiredProductionInspectorOwner),
    true,
    `operator_production_inspector_fixture_missing:${requiredProductionInspectorOwner}`,
  );
}
for (const requiredInspectorAccountingOwner of [
  "expectedInspectorConsoleDeliveries",
  "consumedInspectorConsoleDeliveries",
  "expected_delivery_count: 1",
  "console_allowlist_finalize",
  "responses[0].request_id, requests[0].request_id",
  "responses[0].body_classification",
]) {
  assert.equal(
    operatorReviewControlSource.includes(requiredInspectorAccountingOwner),
    true,
    `operator_inspector_request_accounting_missing:${requiredInspectorAccountingOwner}`,
  );
}
for (const requestLifecycleAccountingOwner of [
  "const requestForId = (requestId)",
  "phase: request?.phase ?? currentPhase",
  "const request = requestForId(params.entry?.networkRequestId)",
  "const request = requestForId(params.requestId)",
]) {
  assert.equal(
    operatorLifecycleSource.includes(requestLifecycleAccountingOwner),
    true,
    `operator_request_initiation_phase_accounting_missing:${requestLifecycleAccountingOwner}`,
  );
}
for (const requiredExactEffectOwner of [
  "operator_execution_exact_effect_snapshot.v1",
  "operator_execution_exact_effect_diff.v1",
  "before_fingerprint",
  "after_fingerprint",
  "operator_effect_deletion_forbidden",
  "operator_effect_wrong_project",
  "operator_effect_memory_perspective_mutation_forbidden",
  "operator_effect_native_event_type_counts_mismatch",
]) {
  assert.equal(
    operatorEffectLedgerSource.includes(requiredExactEffectOwner),
    true,
    `operator_exact_effect_owner_missing:${requiredExactEffectOwner}`,
  );
}
assert.equal(
  canonicalSuiteSource.includes(
    'rootNode("scripts/test-operator-execution-effect-ledger-v1.mjs")',
  ),
  true,
  "operator_exact_effect_contract_not_registered_in_canonical_unit_owner",
);

const expectedChildRegistrations = [
  {
    id: "operator-review-control",
    variable: "operatorReviewControlStep",
    source: "scripts/browser-validate-operator-review-control-v1.mjs",
  },
  {
    id: "operator-native-host-execution",
    variable: "operatorNativeHostExecutionStep",
    source: "scripts/browser-validate-operator-native-host-execution-v1.mjs",
  },
  {
    id: "operator-multi-candidate",
    variable: "operatorMultiCandidateStep",
    source: "scripts/browser-validate-operator-multi-candidate-v1.mjs",
  },
];
for (const child of expectedChildRegistrations) {
  const declarationStart = canonicalSuiteSource.indexOf(
    `const ${child.variable} = {`,
  );
  const declarationEnd = canonicalSuiteSource.indexOf("\n};", declarationStart);
  assert.notEqual(declarationStart, -1, `${child.id}:canonical_declaration_start`);
  assert.notEqual(declarationEnd, -1, `${child.id}:canonical_declaration_end`);
  const declaration = canonicalSuiteSource.slice(
    declarationStart,
    declarationEnd + "\n};".length,
  );
  assert.equal(declaration.includes(`id: "${child.id}"`), true);
  assert.equal(declaration.includes(`...rootNode("${child.source}")`), true);
  assert.equal(declaration.includes("timeoutMs: 360_000"), true);
  assert.equal(declaration.includes("requireNaturalExit: true"), true);
  assert.equal(
    countOccurrences(canonicalSuiteSource, `...rootNode("${child.source}")`),
    1,
    `${child.id}:executable_registration_count`,
  );
  assert.match(
    canonicalSuiteSource,
    new RegExp(`"e2e-${child.id}":`, "u"),
    `${child.id}:focused_suite_missing`,
  );
}
const ownerSuiteRegistration = [
  '"e2e-operator-execution": [',
  "    { ...operatorReviewControlStep },",
  "    { ...operatorNativeHostExecutionStep },",
  "    { ...operatorMultiCandidateStep },",
  "  ],",
].join("\n");
assert.equal(
  countOccurrences(canonicalSuiteSource, ownerSuiteRegistration),
  1,
  "operator_execution_suite_must_register_three_children_once_in_declared_sequence",
);
for (const requiredResource of inventory.resource_profiles.future_independent_shard
  .required_resources) {
  assert.equal(
    implementation.owned_mutable_resources.includes(requiredResource) ||
      operatorCanonicalRequirement(requiredResource) !== null,
    true,
    `operator_execution_resource_missing:${requiredResource}`,
  );
  const canonicalRequirement = operatorCanonicalRequirement(requiredResource);
  if (canonicalRequirement !== null) {
    assert.match(
      canonicalSuiteSource,
      new RegExp(`"${canonicalRequirement}"`, "u"),
      `operator_execution_canonical_requirement_missing:${canonicalRequirement}`,
    );
  }
}
for (const forbiddenResource of inventory.resource_profiles.future_independent_shard
  .forbidden_shared_mutable_resources) {
  const declaredForbiddenResource = new Map([
    ["live_database", "live_writable_database"],
    ["runtime", "runtime_process"],
    ["browser", "browser_process"],
  ]).get(forbiddenResource) ?? forbiddenResource;
  assert.equal(
    implementation.forbidden_shared_mutable_resources.some(
      (entry) =>
        entry === declaredForbiddenResource ||
        entry.includes(declaredForbiddenResource),
    ),
    true,
    `operator_execution_forbidden_shared_resource_missing:${forbiddenResource}`,
  );
}

const ownerContract = loadOperatorExecutionOwnerContractV1();
assert.equal(ownerContract.field_ids.length, 125);
assert.equal(ownerContract.marker_ids.length, 63);
assert.equal(
  ownerContract.field_union_fingerprint,
  implementation.detailed_field_union_sha256,
);
assert.equal(
  ownerContract.marker_union_fingerprint,
  implementation.semantic_marker_union_sha256,
);
assert.equal(equivalence.detailed_fields.length, 125);
assert.equal(equivalence.semantic_markers.length, 63);

const lifecycleTimingMetadata =
  extractOperatorExecutionLifecycleTimingStaticMetadata(
    operatorLifecycleSource,
  );
assert.equal(
  lifecycleTimingMetadata.grammar_version,
  implementation.lifecycle_timing_static_grammar_profile,
);
assert.deepEqual(
  new Set(lifecycleTimingMetadata.timing_kind_ids),
  new Set(implementation.timing_kind_ids),
);
assert.deepEqual(
  lifecycleTimingMetadata.timing_milestone_ids,
  implementation.timing_milestone_ids,
);
assert.deepEqual(lifecycleTimingMetadata.raw_call_counts, {
  start: 2,
  duration: 11,
  milestone: 2,
  record_wait: 2,
  summary: 1,
});
assert.equal(lifecycleTimingMetadata.forwarded_duration_count, 1);

const childMetadata = [];
for (const child of operatorShard.child_partitions) {
  const source = readFileSync(new URL(`../${child.executable_source}`, import.meta.url), "utf8");
  const metadata = extractOperatorExecutionChildStaticMetadata(source);
  childMetadata.push({ child, source, metadata });
  const contract = ownerContract.children.find(
    (entry) => entry.child_id === child.id,
  );
  assert(contract, child.id);
  assert.equal(metadata.grammar_version, implementation.static_grammar_profile);
  assert.deepEqual(metadata.scopes, [child.id]);
  assert.deepEqual(
    new Set(metadata.detailed_completion_ids),
    new Set(contract.field_ids),
  );
  assert.deepEqual(
    new Set(metadata.semantic_marker_ids),
    new Set(contract.marker_ids),
  );
  assert.equal(metadata.detailed_completion_ids.length, child.detailed_field_count);
  assert.equal(metadata.semantic_marker_ids.length, child.semantic_marker_count);
  assert.equal(hashStringInventory(metadata.detailed_completion_ids), child.detailed_field_set_sha256);
  assert.equal(hashStringInventory(metadata.semantic_marker_ids), child.semantic_marker_set_sha256);
  assert.equal(metadata.raw_call_counts.complete_detailed_field, child.detailed_field_count);
  assert.equal(metadata.raw_call_counts.record, child.semantic_marker_count);
  assert.equal(metadata.raw_call_counts.run_phase, metadata.phase_call_ids.length);
  assert.equal(metadata.result_assignment_fields.includes("ok"), false);
  assert.equal(
    contract.field_ids.every((field) => metadata.result_assignment_fields.includes(field)),
    true,
    `${child.id}:detailed_result_assignment_missing`,
  );
  assert.equal(
    new Set(metadata.detailed_completion_ids).size,
    metadata.detailed_completion_ids.length,
  );
  assert.equal(
    new Set(metadata.semantic_marker_ids).size,
    metadata.semantic_marker_ids.length,
  );
}

const extractedFields = childMetadata.flatMap(
  (entry) => entry.metadata.detailed_completion_ids,
);
const extractedMarkers = childMetadata.flatMap(
  (entry) => entry.metadata.semantic_marker_ids,
);
assertExactOwnerUnion(extractedFields, ownerContract.field_ids, "field");
assertExactOwnerUnion(extractedMarkers, ownerContract.marker_ids, "marker");

const projectExperienceIds = new Set(
  inventory.coverage_equivalence
    .filter((entry) => entry.primary_owner === "project_experience")
    .flatMap((entry) => Object.keys(entry.result_fields)),
);
const continuityIds = new Set(
  inventory.coverage_equivalence
    .filter((entry) => entry.primary_owner === "continuity")
    .flatMap((entry) => Object.keys(entry.result_fields)),
);
assert.equal(extractedFields.some((entry) => projectExperienceIds.has(entry)), false);
assert.equal(extractedFields.some((entry) => continuityIds.has(entry)), false);

for (const entry of equivalence.detailed_fields) {
  assert.equal(ownerContract.field_ids.includes(entry.detailed_field_id), true);
  assert.equal(countOccurrences(legacySource, entry.legacy_source_anchor) >= 1, true);
  const child = childMetadata.find((candidate) => candidate.child.id === entry.child_id);
  assert(child, entry.child_id);
  assert.equal(countOccurrences(child.source, entry.new_child_source_anchor), 1);
  assert.equal(
    entry.new_child_phase,
    phaseBeforeAnchor(child.source, entry.new_child_source_anchor, true),
    `${entry.detailed_field_id}:new_child_phase`,
  );
  assert.equal(Number.isSafeInteger(entry.legacy_source_range.line_start), true);
  assert.equal(Number.isSafeInteger(entry.legacy_source_range.line_end), true);
  assert.equal(
    entry.legacy_source_range.line_end >= entry.legacy_source_range.line_start,
    true,
  );
  const legacyRangeMaterial = legacyRangeSource(
    legacySource,
    entry.legacy_source_range,
  );
  assert.equal(
    countOccurrences(legacyRangeMaterial, entry.legacy_source_anchor),
    1,
    `${entry.detailed_field_id}:bounded_legacy_anchor`,
  );
  assert.equal(
    new Set([
      "folder_onboarding",
      "synthetic_session_bootstrap",
      "strategic_proposal_review",
      "direct_host_round_trip",
      "multi_candidate_transition_scope",
      "final_r8_portability_reconciliation",
      "result_initialization",
      "global_finalization",
    ]).has(entry.legacy_source_phase),
    true,
    `${entry.detailed_field_id}:legacy_source_phase`,
  );
  if (
    !["result_initialization", "global_finalization"].includes(
      entry.legacy_source_phase,
    ) &&
    ![
      "selected_work_timeline_first",
      "selected_work_timeline_state_coverage",
    ].includes(entry.detailed_field_id)
  ) {
    assert.equal(
      entry.legacy_source_phase,
      phaseBeforeLine(
        legacySource,
        entry.legacy_source_range.line_start,
        false,
      ),
      `${entry.detailed_field_id}:legacy_phase_range_binding`,
    );
  }
  assert.equal(
    hashLegacyRange(legacySource, entry.legacy_source_range),
    entry.legacy_source_range.sha256,
  );
  assert.match(entry.externally_observable_invariant, /\S/u);
  assert.match(entry.fixture_differences, /\S/u);
  assert.match(entry.changed_mechanism_justification, /\S/u);
  assert.equal(["exact", "deliberately_stronger"].includes(entry.equivalence), true);
  assert.match(entry.runtime_value_contract.kind, /\S/u);
}
for (const entry of equivalence.semantic_markers) {
  assert.equal(ownerContract.marker_ids.includes(entry.marker_id), true);
  assert.equal(countOccurrences(legacySource, entry.legacy_source_anchor), 1);
  const child = childMetadata.find((candidate) => candidate.child.id === entry.child_id);
  assert(child, entry.child_id);
  assert.equal(countOccurrences(child.source, entry.new_child_source_anchor), 1);
  assert.equal(
    entry.new_child_phase,
    phaseBeforeAnchor(child.source, entry.new_child_source_anchor, true),
    `${entry.marker_id}:new_child_phase`,
  );
  assert.equal(
    new Set([
      "folder_onboarding",
      "synthetic_session_bootstrap",
      "strategic_proposal_review",
      "direct_host_round_trip",
      "multi_candidate_transition_scope",
      "final_r8_portability_reconciliation",
      "global_finalization",
    ]).has(entry.legacy_source_phase),
    true,
    `${entry.marker_id}:legacy_source_phase`,
  );
  if (entry.legacy_source_phase !== "global_finalization") {
    assert.equal(
      entry.legacy_source_phase,
      phaseBeforeAnchor(legacySource, entry.legacy_source_anchor, false),
      `${entry.marker_id}:legacy_phase_anchor_binding`,
    );
  }
  assert.match(entry.semantic_event, /\S/u);
  assert.match(entry.fixture_state_prerequisite, /\S/u);
}

const supported = syntheticOwnerChildSource();
const supportedMetadata = extractOperatorExecutionChildStaticMetadata(supported);
assert.deepEqual(supportedMetadata.scopes, ["operator-review-control"]);
assert.deepEqual(supportedMetadata.detailed_completion_ids, ["owned_field"]);
assert.deepEqual(supportedMetadata.semantic_marker_ids, ["owned_marker"]);
assert.deepEqual(supportedMetadata.phase_call_ids, ["owned_phase"]);
assert.deepEqual(supportedMetadata.result_assignment_fields, ["owned_field"]);

const lexicalNegativeFixtures = [
  [
    "computed detailed completion",
    supported.replace('completeDetailedField("owned_field");', 'completeDetailedField(fieldId);'),
    "browser_verification_complete_detailed_field_argument_unsupported",
  ],
  [
    "duplicate detailed completion",
    supported.replace('record("owned_marker");', 'completeDetailedField("owned_field");\nrecord("owned_marker");'),
    "browser_verification_detailed_completion_duplicate",
  ],
  [
    "aliased detailed completion",
    supported.replace('completeDetailedField("owned_field");', 'const done = completeDetailedField;\ndone("owned_field");'),
    "browser_verification_detailed_completion_reference_unsupported",
  ],
  [
    "single-quoted detailed completion",
    supported.replace(
      'completeDetailedField("owned_field");',
      "completeDetailedField('owned_field');",
    ),
    "browser_verification_complete_detailed_field_argument_unsupported",
  ],
  [
    "template detailed completion",
    supported.replace(
      'completeDetailedField("owned_field");',
      "completeDetailedField(`owned_field`);",
    ),
    "browser_verification_complete_detailed_field_argument_unsupported",
  ],
  [
    "indirect detailed completion",
    supported.replace(
      'completeDetailedField("owned_field");',
      'completeDetailedField.call(null, "owned_field");',
    ),
    "browser_verification_detailed_completion_reference_unsupported",
  ],
  [
    "computed marker",
    supported.replace('record("owned_marker");', 'record(markerId);'),
    "browser_verification_record_argument_unsupported",
  ],
  [
    "aliased marker",
    supported.replace('record("owned_marker");', 'const emit = record;\nemit("owned_marker");'),
    "browser_verification_owner_function_reference_unsupported",
  ],
  [
    "single-quoted marker",
    supported.replace('record("owned_marker");', "record('owned_marker');"),
    "browser_verification_record_argument_unsupported",
  ],
  [
    "indirect marker",
    supported.replace(
      'record("owned_marker");',
      'record.call(null, "owned_marker");',
    ),
    "browser_verification_owner_function_reference_unsupported",
  ],
  [
    "computed phase",
    supported.replace('lifecycle.runPhase("owned_phase",', 'lifecycle.runPhase(phaseId,'),
    "browser_verification_owner_member_call_unsupported",
  ],
  [
    "indirect result mutation",
    supported.replace('result.owned_field = true;', 'Object.assign(result, { owned_field: true });'),
    "browser_verification_result_mutation_unsupported",
  ],
  [
    "unsupported authority effect completion",
    supported.replace('result.owned_field = true;', 'Reflect.set(result, "owned_field", true);'),
    "browser_verification_result_mutation_unsupported",
  ],
];
for (const [label, source, code] of lexicalNegativeFixtures) {
  assert.throws(
    () => extractOperatorExecutionChildStaticMetadata(source),
    (error) => error?.code === code,
    label,
  );
}

for (const [label, source, code] of [
  [
    "computed operator timing kind",
    operatorLifecycleSource.replace(
      'timing.duration("global_cleanup", "operator global cleanup", duration);',
      'timing.duration(cleanupKind, "operator global cleanup", duration);',
    ),
    "browser_verification_operator_timing_duration_argument_unsupported",
  ],
  [
    "computed operator timing milestone",
    operatorLifecycleSource.replace(
      'timing.milestone("operator child startup");',
      "timing.milestone(startupMilestone);",
    ),
    "browser_verification_timing_milestone_argument_unsupported",
  ],
  [
    "aliased operator timing object",
    operatorLifecycleSource.replace(
      'timing.milestone("operator child startup");',
      'const timingAlias = timing;\ntimingAlias.milestone("operator child startup");',
    ),
    "browser_verification_operator_timing_reference_unsupported",
  ],
  [
    "extracted operator timing method",
    operatorLifecycleSource.replace(
      'timing.milestone("operator child startup");',
      'const emitMilestone = timing.milestone;\nemitMilestone("operator child startup");',
    ),
    "browser_verification_timing_reference_unsupported",
  ],
  [
    "computed operator wait kind",
    operatorLifecycleSource.replace(
      'recordWait("wait_for_condition", label, started);',
      "recordWait(waitKind, label, started);",
    ),
    "browser_verification_record_wait_argument_unsupported",
  ],
]) {
  assert.throws(
    () => extractOperatorExecutionLifecycleTimingStaticMetadata(source),
    (error) => error?.code === code,
    label,
  );
}

assert.throws(
  () => assertExactOwnerUnion(["owned_field", "owned_field"], ["owned_field"], "field"),
  /operator_field_overlap/u,
);
assert.throws(
  () =>
    assertExactOwnerUnion(
      ["owned_marker", "owned_marker"],
      ["owned_marker"],
      "marker",
    ),
  /operator_marker_overlap/u,
);
assert.throws(
  () => assertExactOwnerUnion([], ["owned_field"], "field"),
  /operator_field_union_mismatch/u,
);
assert.throws(
  () => assertExactOwnerUnion(["foreign_field"], ["owned_field"], "field"),
  /operator_field_union_mismatch/u,
);
assert.throws(
  () => assertChildOwnership(["foreign_marker"], ["owned_marker"], "marker"),
  /operator_foreign_marker/u,
);
assert.throws(
  () => {
    const metadata = extractOperatorExecutionChildStaticMetadata(
      supported.replace(
        'completeDetailedField("owned_field");',
        'completeDetailedField("foreign_field");',
      ),
    );
    assertChildOwnership(metadata.detailed_completion_ids, ["owned_field"], "field");
  },
  /operator_foreign_field/u,
  "foreign completion",
);
assert.throws(
  () => {
    const metadata = extractOperatorExecutionChildStaticMetadata(
      supported.replace('record("owned_marker");', 'record("wrong_child_marker");'),
    );
    assertChildOwnership(metadata.semantic_marker_ids, ["owned_marker"], "marker");
  },
  /operator_foreign_marker/u,
  "marker assigned to wrong child",
);
for (const foreignField of [
  "foreign_field",
  "project_experience_field",
  "continuity_field",
]) {
  assert.throws(
    () => assertChildOwnership([foreignField], ["owned_field"], "field"),
    /operator_foreign_field/u,
  );
}

process.stdout.write(
  `${JSON.stringify({
    test: "operator-execution-browser-contract-v1",
    status: "pass",
    children: childMetadata.map((entry) => ({
      id: entry.child.id,
      fields: entry.metadata.detailed_completion_ids.length,
      markers: entry.metadata.semantic_marker_ids.length,
      phases: entry.metadata.phase_call_ids.length,
    })),
    owner_field_count: extractedFields.length,
    owner_marker_count: extractedMarkers.length,
    lexical_negatives: lexicalNegativeFixtures.length,
    owner_union_negatives: 7,
    lifecycle_timing_negatives: 5,
    lifecycle_timing_kinds: lifecycleTimingMetadata.timing_kind_ids.length,
    lifecycle_timing_milestones:
      lifecycleTimingMetadata.timing_milestone_ids.length,
    canonical_children_registered: expectedChildRegistrations.length,
  })}\n`,
);

function syntheticOwnerChildSource() {
  return [
    'const VALIDATION_SCOPE = "operator-review-control";',
    'assert(["operator-review-control"].includes(VALIDATION_SCOPE));',
    'async function execute({ lifecycle, result, detailed_field_owner, semantic_marker_owner }) {',
    '  function completeDetailedField(id) { return detailed_field_owner(id); }',
    '  function record(id) { return semantic_marker_owner(id); }',
    '  await lifecycle.runPhase("owned_phase", async () => {',
    '    result.owned_field = true;',
    '    completeDetailedField("owned_field");',
    '    record("owned_marker");',
    '  });',
    '}',
  ].join("\n");
}

function assertExactOwnerUnion(actual, expected, kind) {
  assert.equal(actual.length, new Set(actual).size, `operator_${kind}_overlap`);
  assert.deepEqual(new Set(actual), new Set(expected), `operator_${kind}_union_mismatch`);
}

function assertChildOwnership(actual, expected, kind) {
  const owned = new Set(expected);
  assert.equal(
    actual.every((entry) => owned.has(entry)),
    true,
    `operator_foreign_${kind}`,
  );
}

function countOccurrences(source, value) {
  return source.split(value).length - 1;
}

function hashLegacyRange(source, range) {
  const material = legacyRangeSource(source, range);
  return createHash("sha256").update(material).digest("hex");
}

function legacyRangeSource(source, range) {
  return source
    .split("\n")
    .slice(range.line_start - 1, range.line_end)
    .join("\n");
}

function phaseBeforeAnchor(source, anchor, lifecycleQualified) {
  const offset = source.indexOf(anchor);
  assert.notEqual(offset, -1, anchor);
  return phaseBeforeOffset(source, offset, lifecycleQualified);
}

function phaseBeforeLine(source, line, lifecycleQualified) {
  const offset = source
    .split("\n")
    .slice(0, line - 1)
    .join("\n").length;
  return phaseBeforeOffset(source, offset, lifecycleQualified);
}

function phaseBeforeOffset(source, offset, lifecycleQualified) {
  const prefix = source.slice(0, offset);
  const pattern = lifecycleQualified
    ? /lifecycle\.runPhase\(\s*"([a-z0-9_]+)"/gu
    : /runPhase\(\s*"([a-z0-9_]+)"/gu;
  let phase = null;
  let match;
  while ((match = pattern.exec(prefix))) phase = match[1];
  return phase;
}

function operatorCanonicalRequirement(resource) {
  return new Map([
    ["writable_database", "database"],
    ["runtime_supervisor", "process-owning"],
    ["application_listener_port", "listener-port-owning"],
    ["bridge_debug_ports", "listener-port-owning"],
    ["browser_process", "process-owning"],
    ["cdp_session", "cdp-session-owning"],
    ["browser_profile", "browser-profile-owning"],
    ["temporary_root", "filesystem"],
    ["local_session_action_credentials", "operator-session-owning"],
    ["file_signal_barriers", "filesystem"],
    ["owned_process_tree", "process-owning"],
    ["stream_and_cleanup_settlement", "process-owning"],
  ]).get(resource) ?? null;
}
