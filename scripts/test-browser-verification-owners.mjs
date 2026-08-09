#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import { loadOperatorExecutionOwnerContractV1 } from "./operator-execution-result-contract-v1.mjs";
import { loadProjectExperienceResultContractV1 } from "./project-experience-result-contract-v1.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(new URL("./browser-verification-owners.v1.json", import.meta.url), "utf8"),
);
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const projectExperienceSource = readFileSync(
  path.join(root, "scripts/browser-validate-project-experience-v1.mjs"),
  "utf8",
);

const deterministicCompletionExpression = projectExperienceSource.match(
  /await waitForCondition\(\s*`([^`]+)`,\s*"deterministic GuideBrief utterance result",\s*\);/u,
)?.[1];
assert.equal(typeof deterministicCompletionExpression, "string");

function deterministicCompletionWith(...presentSelectors) {
  const present = new Set(presentSelectors);
  return runInNewContext(deterministicCompletionExpression, {
    document: {
      querySelector(selector) {
        return present.has(selector) ? {} : null;
      },
    },
  });
}

assert.equal(
  deterministicCompletionWith("[data-guidebrief-conversation-answer]"),
  true,
);
assert.equal(
  deterministicCompletionWith("[data-guidebrief-interaction-plan]"),
  true,
);
assert.equal(
  deterministicCompletionWith("[data-guidebrief-interaction-outcome]"),
  true,
);
assert.equal(deterministicCompletionWith(), false);

assert.equal(manifest.schema, "augnes.browser-verification-owners.v1");
assert.equal(manifest.version, 1);
assert.deepEqual(manifest.canonical_phase_order, [
  "e2e-project-experience",
  "e2e-operator-review-control",
  "e2e-operator-native-host-execution",
  "e2e-operator-multi-candidate",
  "e2e-continuity",
  "e2e-golden",
]);

const permanentOwners = [
  manifest.owners.project_experience,
  ...manifest.owners.operator_execution.children,
  manifest.owners.continuity,
];
const detailedFields = [];
const semanticMarkers = [];
for (const owner of permanentOwners) {
  assert.equal(existsSync(path.join(root, owner.executable_source)), true, owner.executable_source);
  const fields = owner.families.flatMap((family) => family.fields);
  const markers = owner.families.flatMap((family) => family.markers);
  assert.equal(fields.length, new Set(fields).size, `${owner.canonical_phase_id}:duplicate_fields`);
  assert.equal(markers.length, new Set(markers).size, `${owner.canonical_phase_id}:duplicate_markers`);
  detailedFields.push(...fields);
  semanticMarkers.push(...markers);
}
assert.equal(detailedFields.length, new Set(detailedFields).size, "detailed_owner_overlap");
assert.equal(semanticMarkers.length, new Set(semanticMarkers).size, "semantic_marker_overlap");

const project = loadProjectExperienceResultContractV1();
assert.equal(project.field_ids.length, 69);
assert.equal(project.marker_ids.length, 8);
const operator = loadOperatorExecutionOwnerContractV1();
assert.equal(operator.children.length, 3);
assert.equal(operator.field_ids.length, 136);
assert.equal(operator.marker_ids.length, 63);
assert.equal(
  manifest.owners.continuity.families.flatMap((family) => family.fields).length,
  29,
);
assert.equal(
  manifest.owners.continuity.families.flatMap((family) => family.markers).length,
  30,
);

for (const owner of [
  manifest.owners.project_experience,
  manifest.owners.operator_execution,
  manifest.owners.continuity,
  manifest.owners.cross_boundary_golden,
]) {
  assert.equal(packageJson.scripts[owner.command.split("npm run ")[1]], owner.command.includes("operator-execution")
    ? "node scripts/run-canonical-test-suite.mjs e2e-operator-execution"
    : owner.command.includes("project-experience")
      ? "node scripts/run-canonical-test-suite.mjs e2e-project-experience"
      : owner.command.includes("continuity")
        ? "node scripts/run-canonical-test-suite.mjs e2e-continuity"
        : "node scripts/run-canonical-test-suite.mjs e2e-golden");
}

const golden = manifest.owners.cross_boundary_golden;
assert.equal(golden.detailed_fields.length, 0);
assert.equal(Object.hasOwn(golden, "semantic_markers"), false);
assert.deepEqual(golden.composition_steps, [
  "project_connection",
  "first_work_definition",
  "explicit_deterministic_local_start",
  "one_admitted_result_receipt",
  "one_proposal_visible_for_review",
]);
assert.equal(golden.composition_steps.length, new Set(golden.composition_steps).size);
assert.equal(
  golden.composition_steps.every(
    (step) => typeof step === "string" && /^[a-z][a-z0-9_]{1,80}$/u.test(step),
  ),
  true,
);
assert.equal(manifest.invariant_contract.shared_mutable_resources, "forbidden");
assert.equal(manifest.invariant_contract.provider_or_external_network, "forbidden");
assert.equal(manifest.changed_file_selection.full_canonical, "all_permanent_browser_phases");
assert.equal(manifest.changed_file_selection.unknown_or_ambiguous, "all_permanent_browser_phases");

process.stdout.write(`${JSON.stringify({
  test: "browser-verification-owners",
  status: "pass",
  phases: manifest.canonical_phase_order.length,
  project_fields: project.field_ids.length,
  operator_fields: operator.field_ids.length,
  continuity_fields: 29,
  deterministic_completion_states: 4,
})}\n`);
