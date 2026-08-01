#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { extractBrowserVerificationStaticMetadata } from "./browser-verification-static-metadata.mjs";

const source = readFileSync(
  new URL("./browser-validate-vnext-native-host-result-v0-1.mjs", import.meta.url),
  "utf8",
);
const inventory = JSON.parse(
  readFileSync(
    new URL("./browser-verification-ownership-inventory.v1.json", import.meta.url),
    "utf8",
  ),
);
const metadata = extractBrowserVerificationStaticMetadata(source);

assert.equal(
  inventory.schema,
  "augnes.browser-verification-ownership-inventory.v1",
);
assert.equal(inventory.inventory_version, 1);
assert.equal(inventory.governing_issue, 103);
assert.match(inventory.authorized_baseline, /^[0-9a-f]{40}$/u);

assert.equal(inventory.source_contract.file, "scripts/browser-validate-vnext-native-host-result-v0-1.mjs");
assert.equal(inventory.source_contract.sha256, metadata.source_sha256);
assert.equal(
  inventory.source_contract.assertion_call_count,
  metadata.assertion_call_count,
);
assert.equal(
  inventory.source_contract.declared_result_field_count,
  metadata.declared_result_fields.length,
);
assert.equal(
  inventory.source_contract.output_result_field_count,
  metadata.output_result_fields.length,
);
assert.deepEqual(
  inventory.source_contract.dynamic_result_fields,
  metadata.dynamically_declared_result_fields,
);
assert.deepEqual(inventory.source_contract.validation_scopes, metadata.scopes);
assert.deepEqual(inventory.source_contract.stable_phase_ids, metadata.phase_ids);
assert.deepEqual(inventory.source_contract.timing_kinds, metadata.timing_kinds);
assert.deepEqual(
  inventory.source_contract.timing_milestones,
  metadata.timing_milestones,
);
assert.equal(metadata.declared_result_fields.length, 204);
assert.equal(metadata.dynamically_declared_result_fields.length, 17);
assert.equal(metadata.output_result_fields.length, 221);
assert.equal(metadata.phase_ids.length, 11);
assert.equal(metadata.record_markers.length, 99);
assert.equal(metadata.timing_kinds.length, 14);
assert.equal(metadata.timing_milestones.length, 17);
assert.equal(metadata.assertion_call_count, 1070);
assert.equal(metadata.record_markers.length, new Set(metadata.record_markers).size);

const allowedOwners = new Set([
  "project_experience",
  "operator_execution",
  "continuity",
  "cross_boundary_golden",
  "per_shard_invariant",
  "shared_fixture_infrastructure",
]);
const primaryBehaviorOwners = new Set([
  "project_experience",
  "operator_execution",
  "continuity",
  "cross_boundary_golden",
]);
const taxonomyIds = inventory.owner_taxonomy.map((entry) => entry.id);
assert.deepEqual(new Set(taxonomyIds), allowedOwners);
assert.equal(taxonomyIds.length, allowedOwners.size);
for (const entry of inventory.owner_taxonomy) {
  assert.match(entry.definition, /\S/u);
  assert.match(entry.kind, /^(?:primary_detailed_owner|primary_composition_owner|invariant_owner|infrastructure_owner)$/u);
}

const allowedClassifications = new Set([
  "behavioral_assertion",
  "identity",
  "counter",
  "timing_diagnostic",
  "cleanup_invariant",
  "failure_material",
  "collection_result_array",
]);
assert.deepEqual(
  new Set(inventory.result_field_classifications),
  allowedClassifications,
);
assert.equal(
  inventory.result_field_classifications.length,
  allowedClassifications.size,
);

const scopeIds = inventory.current_scopes.map((entry) => entry.id);
assert.deepEqual(new Set(scopeIds), new Set(metadata.scopes));
assert.equal(scopeIds.length, metadata.scopes.length);
for (const scope of inventory.current_scopes) {
  assert.match(scope.command, /\S/u);
  assert.match(scope.selector, /\S/u);
  assert.match(scope.membership, /\S/u);
}

const resourceProfiles = inventory.resource_profiles;
assert(resourceProfiles.current_monolith_shared);
assert(resourceProfiles.future_independent_shard);
assert.equal(resourceProfiles.current_monolith_shared.independent, false);
assert.equal(resourceProfiles.future_independent_shard.independent, true);
for (const requiredResource of [
  "writable_database",
  "runtime_supervisor",
  "application_listener_port",
  "bridge_debug_ports",
  "browser_process",
  "cdp_session",
  "browser_profile",
  "temporary_root",
  "local_session_action_credentials",
  "file_signal_barriers",
  "owned_process_tree",
  "stream_and_cleanup_settlement",
]) {
  assert.equal(
    resourceProfiles.future_independent_shard.required_resources.includes(
      requiredResource,
    ),
    true,
    requiredResource,
  );
}
for (const forbiddenSharedResource of [
  "live_database",
  "runtime",
  "browser",
  "cdp_session",
  "browser_profile",
  "operator_session",
]) {
  assert.equal(
    resourceProfiles.future_independent_shard.forbidden_shared_mutable_resources.includes(
      forbiddenSharedResource,
    ),
    true,
    forbiddenSharedResource,
  );
}

const phaseGroupIds = inventory.current_phase_groups.map((phase) => phase.id);
assert.equal(phaseGroupIds.length, new Set(phaseGroupIds).size);
const coveredSourcePhaseIds = new Set();
for (const phase of inventory.current_phase_groups) {
  assert.equal(allowedOwners.has(phase.proposed_primary_owner), true, phase.id);
  assert.match(phase.source_location, /\S/u, phase.id);
  assert.match(phase.behavioral_responsibility, /\S/u, phase.id);
  assert.match(phase.assignment_rationale, /\S/u, phase.id);
  assert.equal(Array.isArray(phase.coverage_family_ids), true, phase.id);
  assert.equal(phase.coverage_family_ids.length > 0, true, phase.id);
  assert.equal(Array.isArray(phase.required_fixture_inputs), true, phase.id);
  assert.equal(Array.isArray(phase.required_prior_mutable_state), true, phase.id);
  assert.equal(Array.isArray(phase.state_produced_for_later_phases), true, phase.id);
  assert.equal(Array.isArray(phase.routes_and_surfaces), true, phase.id);
  assert.match(phase.operator_session_requirements, /\S/u, phase.id);
  assert.equal(
    Array.isArray(phase.db_core_run_transition_requirements),
    true,
    phase.id,
  );
  assert.equal(
    phase.db_core_run_transition_requirements.length > 0,
    true,
    phase.id,
  );
  assert.equal(
    Array.isArray(phase.runtime_browser_cdp_requirements),
    true,
    phase.id,
  );
  assert.equal(
    phase.runtime_browser_cdp_requirements.length > 0,
    true,
    phase.id,
  );
  assert.equal(
    typeof phase.future_thin_golden_path,
    "boolean",
    phase.id,
  );
  assert.equal(
    phase.owned_resources.profile in resourceProfiles,
    true,
    phase.id,
  );
  for (const scope of phase.scopes) {
    assert.equal(metadata.scopes.includes(scope), true, `${phase.id}:${scope}`);
  }
  for (const sourcePhaseId of phase.source_phase_ids) {
    assert.equal(
      metadata.phase_ids.includes(sourcePhaseId),
      true,
      `${phase.id}:${sourcePhaseId}`,
    );
    coveredSourcePhaseIds.add(sourcePhaseId);
  }
}
assert.deepEqual(coveredSourcePhaseIds, new Set(metadata.phase_ids));

const coverageIds = inventory.coverage_equivalence.map((family) => family.id);
assert.equal(coverageIds.length, new Set(coverageIds).size);
const coverageIdSet = new Set(coverageIds);
const ownedResultFields = [];
const ownedRecordMarkers = [];
const classificationCounts = Object.fromEntries(
  [...allowedClassifications].map((classification) => [classification, 0]),
);
const ownerCounts = Object.fromEntries(
  [...allowedOwners].map((owner) => [owner, 0]),
);
for (const family of inventory.coverage_equivalence) {
  assert.equal(allowedOwners.has(family.primary_owner), true, family.id);
  if (family.behavioral) {
    assert.equal(
      primaryBehaviorOwners.has(family.primary_owner),
      true,
      family.id,
    );
  } else {
    assert.equal(
      ["per_shard_invariant", "shared_fixture_infrastructure"].includes(
        family.primary_owner,
      ),
      true,
      family.id,
    );
  }
  assert.match(family.responsibility, /\S/u, family.id);
  assert.match(family.future_disposition, /\S/u, family.id);
  assert.match(family.fixture_setup_change_required, /\S/u, family.id);
  assert.match(family.potential_redundancy, /\S/u, family.id);
  assert.match(family.hidden_dependency, /\S/u, family.id);
  for (const phaseGroupId of family.current_phase_group_ids) {
    assert.equal(phaseGroupIds.includes(phaseGroupId), true, `${family.id}:${phaseGroupId}`);
  }
  for (const scope of family.current_scopes) {
    assert.equal(metadata.scopes.includes(scope), true, `${family.id}:${scope}`);
  }
  for (const [field, classification] of Object.entries(family.result_fields)) {
    assert.equal(allowedClassifications.has(classification), true, field);
    ownedResultFields.push(field);
    classificationCounts[classification] += 1;
    ownerCounts[family.primary_owner] += 1;
  }
  for (const marker of family.record_markers) {
    ownedRecordMarkers.push(marker);
  }
  if (family.thin_golden_path) {
    assert.match(family.golden_duplication_justification, /\S/u, family.id);
  }
}
assert.equal(ownedResultFields.length, new Set(ownedResultFields).size);
assert.equal(ownedRecordMarkers.length, new Set(ownedRecordMarkers).size);
assert.deepEqual(
  new Set(ownedResultFields),
  new Set(metadata.output_result_fields),
);
assert.deepEqual(
  new Set(ownedRecordMarkers),
  new Set(metadata.record_markers),
);
for (const phase of inventory.current_phase_groups) {
  for (const familyId of phase.coverage_family_ids) {
    assert.equal(coverageIdSet.has(familyId), true, `${phase.id}:${familyId}`);
  }
}

const behavioralFamilies = inventory.coverage_equivalence.filter(
  (family) => family.behavioral,
);
const detailedShardIds = new Set([
  "project_experience",
  "operator_execution",
  "continuity",
]);
const futureShardIds = inventory.future_shards.map((shard) => shard.id);
assert.deepEqual(
  new Set(futureShardIds),
  new Set([...detailedShardIds, "cross_boundary_golden"]),
);
assert.equal(futureShardIds.length, 4);
const shardOwnedFamilies = [];
for (const shard of inventory.future_shards) {
  assert.equal(allowedOwners.has(shard.id), true, shard.id);
  assert.match(shard.proposed_command, /^npm run test:e2e:/u, shard.id);
  assert.equal(shard.implemented_in_vfy1a, false, shard.id);
  assert.match(shard.primary_question, /\?$/u, shard.id);
  assert.equal(
    shard.resource_ownership_profile in resourceProfiles,
    true,
    shard.id,
  );
  if (detailedShardIds.has(shard.id)) {
    assert.equal(shard.detailed_family_ids.length > 0, true, shard.id);
    for (const familyId of shard.detailed_family_ids) {
      const family = inventory.coverage_equivalence.find(
        (candidate) => candidate.id === familyId,
      );
      assert(family, `${shard.id}:${familyId}`);
      assert.equal(family.behavioral, true, `${shard.id}:${familyId}`);
      assert.equal(family.primary_owner, shard.id, `${shard.id}:${familyId}`);
      shardOwnedFamilies.push(familyId);
    }
  } else {
    assert.deepEqual(shard.detailed_family_ids, []);
  }
}
assert.equal(shardOwnedFamilies.length, new Set(shardOwnedFamilies).size);
assert.deepEqual(
  new Set(shardOwnedFamilies),
  new Set(behavioralFamilies.map((family) => family.id)),
);

assert.equal(inventory.thin_golden_path.owner, "cross_boundary_golden");
assert.equal(inventory.thin_golden_path.implemented_in_vfy1a, false);
assert.deepEqual(inventory.thin_golden_path.steps, [
  "project connection",
  "first-work definition",
  "explicit Codex start",
  "one result receipt",
  "proposal visible for review",
]);
assert.equal(inventory.thin_golden_path.duplicates_detailed_matrix, false);
assert.match(inventory.thin_golden_path.duplication_justification, /\S/u);
assert.equal(inventory.thin_golden_path.detailed_assertion_refs.length > 0, true);
for (const familyId of inventory.thin_golden_path.detailed_assertion_refs) {
  assert.equal(coverageIdSet.has(familyId), true, familyId);
}
for (const requiredExclusion of [
  "full onboarding matrix",
  "full approval/cancel/resume matrix",
  "full proposal/decision/Transition matrix",
  "full portability/restart matrix",
  "all responsive viewports",
  "all failure-state combinations",
]) {
  assert.equal(
    inventory.thin_golden_path.explicit_exclusions.includes(requiredExclusion),
    true,
    requiredExclusion,
  );
}

const requiredDependencyKinds = new Set([
  "immutable_fixture_input",
  "mutable_database_state",
  "active_project_selection",
  "operator_session_bootstrap_state",
  "current_packet_and_lineage",
  "run_result_proposal_state",
  "review_decision_and_transition_state",
  "imported_restarted_state",
  "browser_navigation_session_state",
  "server_runtime_ownership",
  "file_signal_and_approval_barriers",
  "temporary_path_and_port_ownership",
]);
const dependencyKinds = new Set();
for (const dependency of inventory.dependency_graph) {
  dependencyKinds.add(dependency.kind);
  assert.match(dependency.producer_phase, /\S/u, dependency.id);
  assert.equal(dependency.consumer_phases.length > 0, true, dependency.id);
  assert.equal(typeof dependency.remain_shared_in_future, "boolean", dependency.id);
  assert.equal(typeof dependency.become_shard_fixture_input, "boolean", dependency.id);
  assert.equal(typeof dependency.hidden_coupling_to_remove, "boolean", dependency.id);
  assert.match(dependency.stable_transfer_contract, /\S/u, dependency.id);
}
assert.deepEqual(dependencyKinds, requiredDependencyKinds);

assert.equal(inventory.planner_receipt_design.implemented_in_vfy1a, false);
for (const requiredReceiptRule of [
  "exact base/head binding",
  "planner-selected required owner list",
  "one result per selected shard",
  "natural child exit",
  "exit code 0",
  "closed streams",
  "cleanup complete",
  "zero owned-process residue",
  "zero listener, DB, profile, and temporary-root residue",
  "no retry",
  "no automatic timeout widening",
]) {
  assert.equal(
    inventory.planner_receipt_design.selected_shard_result_requirements.includes(
      requiredReceiptRule,
    ),
    true,
    requiredReceiptRule,
  );
}
assert.match(
  inventory.planner_receipt_design.aggregation_rule,
  /missing, skipped, failed, timed-out, stale, or cleanup-incomplete required shard makes the receipt non-deciding/u,
);
assert.match(inventory.planner_receipt_design.focused_vs_deciding, /not the aggregated deciding receipt/u);
assert.match(inventory.planner_receipt_design.timing_attribution, /per owner/u);

assert.equal(inventory.timing_headroom_policy.implemented_in_vfy1a, false);
assert.equal(inventory.timing_headroom_policy.current_limits_changed, false);
for (const forbiddenTimingChange of [
  "Do not split by equal elapsed halves.",
  "Do not add pass-chasing retries, arbitrary sleeps, assertion weakening, or automatic timeout widening.",
]) {
  assert.equal(
    inventory.timing_headroom_policy.rules.includes(forbiddenTimingChange),
    true,
    forbiddenTimingChange,
  );
}

assert.deepEqual(
  inventory.sequencing.map((entry) => entry.id),
  ["VFY1-A", "VFY1-B", "VFY1-C", "VFY1-D"],
);
assert.equal(inventory.sequencing[0].status, "this_inventory_only");
assert.equal(
  inventory.sequencing.slice(1).every(
    (entry) => entry.status === "deferred_separate_authorization",
  ),
  true,
);
assert.equal(inventory.non_goals.length >= 6, true);

process.stdout.write(
  `${JSON.stringify({
    test: "browser-verification-ownership-inventory",
    status: "pass",
    scopes: metadata.scopes.length,
    source_phase_ids: metadata.phase_ids.length,
    coherent_phase_groups: inventory.current_phase_groups.length,
    assertion_calls: metadata.assertion_call_count,
    declared_result_fields: metadata.declared_result_fields.length,
    dynamic_result_fields: metadata.dynamically_declared_result_fields.length,
    output_result_fields: metadata.output_result_fields.length,
    record_markers: metadata.record_markers.length,
    timing_kinds: metadata.timing_kinds.length,
    timing_milestones: metadata.timing_milestones.length,
    coverage_families: inventory.coverage_equivalence.length,
    dependency_edges: inventory.dependency_graph.length,
    classification_counts: classificationCounts,
    owner_field_counts: ownerCounts,
    future_commands_documented_only: inventory.future_shards.map(
      (shard) => shard.proposed_command,
    ),
  })}\n`,
);
