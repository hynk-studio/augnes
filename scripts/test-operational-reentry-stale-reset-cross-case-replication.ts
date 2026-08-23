import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildOperationalReentryStaleResetCrossCaseProviderMaterialV01,
  buildOperationalReentryStaleResetCrossCaseRepresentativeMaterialsV01,
  OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_FINGERPRINT_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R1_COMMON_EVIDENCE_FINGERPRINT_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_FINGERPRINT_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
  OPERATIONAL_REENTRY_STALE_RESET_R2_COMMON_EVIDENCE_FINGERPRINT_V01,
  operationalReentryStaleResetR1CaseV01,
  operationalReentryStaleResetR2CaseV01,
  readOperationalReentryStaleResetCrossCaseV01,
} from "@/fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import {
  buildOperationalReentryMatchedCohortProviderContractV04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import {
  buildOperationalReentryStaleResetCrossCaseMaximalWireOutputV01,
  buildOperationalReentryStaleResetCrossCaseProviderContractV01,
  operationalReentryStaleResetCrossCaseResponseSchemaV01,
  parseOperationalReentryStaleResetCrossCaseOutputV01,
  validateOperationalReentryStaleResetCrossCaseProviderMaterialV01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_AGGREGATE_PARSER_CLOSURE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import {
  createOpenAIResponsesAdapterV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import { ModelGatewayInvocationErrorV01 } from "@/lib/vnext/model-gateway/contracts";
import {
  createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01,
  prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01,
  projectOperationalReentryStaleResetCrossCaseProviderRequestV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import {
  ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01,
  ACGC_E2R2P6H_CASE_FINGERPRINT_V01,
  ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01,
  ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";
import {
  buildOperationalReentryStaleResetCrossCaseAuthorizationContractV01,
  buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContractV01,
  buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01,
  buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01,
  buildOperationalReentryStaleResetCrossCaseCallTerminalV01,
  buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01,
  buildOperationalReentryStaleResetCrossCaseGateContractV01,
  buildOperationalReentryStaleResetCrossCaseGatedInvocationV01,
  buildOperationalReentryStaleResetCrossCaseInvocationV01,
  buildOperationalReentryStaleResetCrossCaseLayerBV01,
  buildOperationalReentryStaleResetCrossCasePlanV01,
  buildOperationalReentryStaleResetCrossCasePricingV01,
  buildOperationalReentryStaleResetReplicationAuthorizationV01,
  deriveOperationalReentryStaleResetCrossCaseDispositionV01,
  deriveOperationalReentryStaleResetReplicationCasePatternStatusV01,
  evaluateOperationalReentryStaleResetCrossCaseBlockV01,
  operationalReentryStaleResetCrossCaseStaticAuthorityV01,
  runOperationalReentryStaleResetCrossCaseCompatibilityV01,
  runOperationalReentryStaleResetCrossCaseReplicationV01,
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01,
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContextV01,
  validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01,
  validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationContextV01,
  type OperationalReentryStaleResetCrossCaseObservedArmV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import { validateCrossCaseLiveAdmissionBindingV01 } from "@/scripts/operational-reentry-stale-reset-cross-case-live-common";
import {
  buildOperationalReentryStaleResetCrossCaseReplicationArtifactFamilyContractV01,
  consumeOperationalReentryStaleResetCrossCaseAuthorizationV01,
  sealOperationalReentryStaleResetCrossCaseArtifactV01,
  validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication-artifact-store";
import {
  buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01,
  consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01,
  sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01,
  validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-compatibility-artifact-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  OperationalReentryStaleResetCrossCaseArmV01,
  OperationalReentryStaleResetCrossCaseIdV01,
  OperationalReentryStaleResetCrossCaseModelOutputV01,
  OperationalReentryStaleResetCrossCaseRouteV01,
} from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";
import type { ModelInvocationReceiptV02 } from "@/types/vnext/model-invocation-receipt";

async function main(): Promise<void> {
const assertions: string[] = [];
function check(label: string, condition: unknown): void {
  assert.equal(Boolean(condition), true, label);
  assertions.push(label);
}

const route = await prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01({
  adapter: createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-only-synthetic-credential" },
    transport: async () => {
      throw new Error("fake_transport_must_not_be_called");
    },
  }),
});
assert.ok(route);
if (!route) throw new Error("cross_case_test_route_unavailable");
const exactRoute = route;

const r1 = readOperationalReentryStaleResetCrossCaseV01(
  OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01,
);
const r2 = readOperationalReentryStaleResetCrossCaseV01(
  OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01,
);
const r1Plan = buildOperationalReentryStaleResetCrossCasePlanV01(
  r1.case_id,
  route,
);
const r2Plan = buildOperationalReentryStaleResetCrossCasePlanV01(
  r2.case_id,
  route,
);
const compatibilityPlan =
  buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01(route);
const admission = {
  workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
  project_id: "project:00000000-0000-4000-8000-000000000001",
  expected_active_selection_revision: 1,
  project_root: { path_flavor: "posix" as const, normalized_path: "/tmp/test" },
  gateway_authorization_project_is_lab_experiment_meaning: false as const,
};
const replicationPricing = buildPricing(route, admission, 16);
const compatibilityPricing = buildPricing(route, admission, 6);

// Contract and cases (1-11).
check("1 R1 deterministic", canonicalizeProtocolValueV01(r1) === canonicalizeProtocolValueV01(operationalReentryStaleResetR1CaseV01));
check("2 R2 deterministic", canonicalizeProtocolValueV01(r2) === canonicalizeProtocolValueV01(operationalReentryStaleResetR2CaseV01));
check("3 case fingerprints distinct", r1.integrity.fingerprint !== r2.integrity.fingerprint);
check("4 cases independent from historical P6I", [r1.integrity.fingerprint, r2.integrity.fingerprint].every((value) => value !== ACGC_E2R2P6H_CASE_FINGERPRINT_V01));
expectThrow("5 historical material rejected", () => validateOperationalReentryStaleResetCrossCaseProviderMaterialV01({ ...buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(r1.case_id, "A"), task: { goal: "historical", success_criteria: [], non_goals: [], required_check: "verify_portable_output", forbidden_external_action: "publish_external_without_authority" } }));
expectThrow("6 arbitrary similar material rejected", () => validateOperationalReentryStaleResetCrossCaseProviderMaterialV01({ task: {}, common_task_evidence: {}, continuation_context: [], stale_relation: null, allowed_output: {}, authority_notice: {} }));
expectThrow("7 unknown case rejected", () => readOperationalReentryStaleResetCrossCaseV01("unknown" as OperationalReentryStaleResetCrossCaseIdV01));
expectThrow("8 cross-case allowlists rejected", () => validateOperationalReentryStaleResetCrossCaseProviderMaterialV01({ ...buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(r1.case_id, "A"), allowed_output: r2.allowed_output }));
expectThrow("9 extra provider key rejected", () => validateOperationalReentryStaleResetCrossCaseProviderMaterialV01({ ...buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(r1.case_id, "A"), arm: "A" }));
check("10 new identities exact", buildOperationalReentryStaleResetCrossCaseProviderContractV01().route_purpose === "operational_reentry_stale_reset_cross_case_replication_v01");
check("11 historical identities exact", buildOperationalReentryMatchedCohortProviderContractV04().integrity.fingerprint === ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01);

// Material and gating (12-22).
for (const [index, item] of buildOperationalReentryStaleResetCrossCaseRepresentativeMaterialsV01().entries()) {
  check(`${12 + index} ${item.case_id} ${item.provider_shape} accepted`, canonicalizeProtocolValueV01(validateOperationalReentryStaleResetCrossCaseProviderMaterialV01(item.material)) === canonicalizeProtocolValueV01(item.material));
}
const r1Gate = buildOperationalReentryStaleResetCrossCaseGatedInvocationV01({ case_id: r1.case_id, cohort_ref: "ccr_test_r1", call_slot_id: "ccr_test_slot_r1", repeat_block: 0 });
const r2Gate = buildOperationalReentryStaleResetCrossCaseGatedInvocationV01({ case_id: r2.case_id, cohort_ref: "ccr_test_r2", call_slot_id: "ccr_test_slot_r2", repeat_block: 0 });
check("18 R1 G upstream exact C", r1Gate.upstream_c.provider_material.stale_relation?.relation_token === "reference_superseded_before_review_outcome");
check("19 R2 G upstream exact C", r2Gate.upstream_c.provider_material.stale_relation?.relation_token === "action_invalid_after_capability_regime_change");
check("20 R1 G exact B", canonicalizeProtocolValueV01(r1Gate.invocation.provider_material) === canonicalizeProtocolValueV01(buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(r1.case_id, "B")));
check("21 R2 G exact B", canonicalizeProtocolValueV01(r2Gate.invocation.provider_material) === canonicalizeProtocolValueV01(buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(r2.case_id, "B")));
expectThrow("22 non-target drift fails", () => buildOperationalReentryStaleResetCrossCaseGatedInvocationV01({ case_id: r1.case_id, cohort_ref: "ccr_test_drift", call_slot_id: "ccr_test_slot_drift", repeat_block: 0, declared_non_target_material_fingerprint: `sha256:${"0".repeat(64)}` }));
expectThrow("23 target fingerprint drift fails", () => buildOperationalReentryStaleResetCrossCaseGatedInvocationV01({ case_id: r1.case_id, cohort_ref: "ccr_test_target", call_slot_id: "ccr_test_slot_target", repeat_block: 0, declared_target_fingerprint: `sha256:${"1".repeat(64)}` }));
expectThrow("24 relation fingerprint drift fails", () => buildOperationalReentryStaleResetCrossCaseGatedInvocationV01({ case_id: r2.case_id, cohort_ref: "ccr_test_relation", call_slot_id: "ccr_test_slot_relation", repeat_block: 0, declared_stale_relation_fingerprint: `sha256:${"2".repeat(64)}` }));
expectThrow("25 G visible metadata fails", () => validateOperationalReentryStaleResetCrossCaseProviderMaterialV01({ ...r1Gate.invocation.provider_material, gate: "G" }));
check("26 local G provenance does not change body", projectOperationalReentryStaleResetCrossCaseProviderRequestV01(r1Gate.invocation).request_body === projectOperationalReentryStaleResetCrossCaseProviderRequestV01({ ...r1Gate.invocation, local_invocation_context: { ...r1Gate.invocation.local_invocation_context, cohort_ref: "ccr_changed_local_only" } }).request_body);

// B/G parity (27-36).
for (const [caseLabel, plan, start] of [["R1", r1Plan, 27], ["R2", r2Plan, 32]] as const) {
  check(`${start} ${caseLabel} four B/G material equal`, plan.bg_conformance_witnesses.every((witness) => witness.provider_material_equal));
  check(`${start + 1} ${caseLabel} four B/G request bytes equal`, plan.bg_conformance_witnesses.every((witness) => witness.canonical_openai_request_body_bytes_equal));
  check(`${start + 2} ${caseLabel} four B/G request fingerprints equal`, plan.bg_conformance_witnesses.every((witness) => witness.provider_visible_request_fingerprint_equal));
  check(`${start + 3} ${caseLabel} local identities distinct`, plan.bg_conformance_witnesses.every((witness) => witness.local_identity_distinct && witness.trace_id_distinct && witness.client_request_id_distinct));
  check(`${start + 4} ${caseLabel} correlation opaque`, plan.entries.every((entry) => !/(?:r1|r2|arm|gate|fresh|stale|reference|action|block|hypothesis)/iu.test(`${entry.request_family_trace_id}${entry.client_request_id}`)));
}

// Schema/parser/bounds (37-46).
check("37 six provider shapes", Object.keys(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01).length === 6);
check("38 per-shape closure finite", Object.values(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01).every((value) => Number.isSafeInteger(value) && value > 0));
let exhaustiveParsed = 0;
for (const shape of buildOperationalReentryStaleResetCrossCaseRepresentativeMaterialsV01()) {
  exhaustiveParsed += enumeratePermitted(shape.material);
}
check("39 every permitted output parses", exhaustiveParsed === OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_AGGREGATE_PARSER_CLOSURE_V01);
const sampleMaterial = buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(r1.case_id, "A");
const sampleWire = buildOperationalReentryStaleResetCrossCaseMaximalWireOutputV01(sampleMaterial);
expectThrow("40 forbidden outputs reject", () => parseOperationalReentryStaleResetCrossCaseOutputV01(JSON.stringify({ ...sampleWire, extra: false }), sampleMaterial));
check("41 maximal R1 response bound", OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01.shapes.filter((shape) => shape.case_id === r1.case_id).every((shape) => shape.canonical_utf8_bytes <= 1168));
check("42 maximal R2 response bound", OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01.shapes.filter((shape) => shape.case_id === r2.case_id).every((shape) => shape.canonical_utf8_bytes <= 1168));
check("43 maximal R1 request bound", r1Plan.entries.every((entry) => Buffer.byteLength(entry.canonical_request_body) <= 24576));
check("44 maximal R2 request bound", r2Plan.entries.every((entry) => Buffer.byteLength(entry.canonical_request_body) <= 24576));
check("45 store false exact", [...r1Plan.entries, ...r2Plan.entries].every((entry) => entry.store === false));
check("46 local derivations exact", parseOperationalReentryStaleResetCrossCaseOutputV01(JSON.stringify(buildValidWire(r1, "A", true)), sampleMaterial).common_task_evidence_fingerprint === r1.common_evidence_fingerprint);

// Layer B (47-57).
const r1Persistent = normalizedFor(r1.case_id, "C", true);
const r2Persistent = normalizedFor(r2.case_id, "C", true);
const r1Layer = buildOperationalReentryStaleResetCrossCaseLayerBV01(r1.case_id, r1Persistent);
const r2Layer = buildOperationalReentryStaleResetCrossCaseLayerBV01(r2.case_id, r2Persistent);
check("47 R1 reference exact", r1Layer.selected_or_referenced_target_identity === "present");
check("48 R1 action always absent", r1Layer.target_action_or_decision_preparation === "absent");
check("49 R1 limitation exact", limitationState(r1, "limitation_superseded_reference_selected") === "stale_persisted");
check("50 R1 neutral no persistence", limitationState(r1, "limitation_reference_non_authoritative") === "absent");
check("51 R2 reference exact", r2Layer.selected_or_referenced_target_identity === "present");
check("52 R2 action exact", r2Layer.target_action_or_decision_preparation === "present");
check("53 R2 limitation exact", limitationState(r2, "limitation_obsolete_action_persisted") === "stale_persisted");
check("54 R2 neutral no persistence", limitationState(r2, "limitation_preparation_non_authoritative") === "absent");
check("55 multiple limitations mixed", multipleLimitationsState(r1) === "mixed");
check("56 disposition contradiction invalid", buildOperationalReentryStaleResetCrossCaseLayerBV01(r1.case_id, { ...normalizedFor(r1.case_id, "C", false), target_disposition: "stale_persisted" }).state === "protocol_invalid");
check("57 no token-name inference", buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(r1.case_id).runtime_token_name_inference === false);

// Pair evaluation and case aggregation (58-83).
const r1SupportBlocks = buildBlocks(r1Plan, true);
const r2SupportBlocks = buildBlocks(r2Plan, true);
check("58 six direct pairs", r1SupportBlocks.every((block) => block.pair_evaluations.length === 6));
check("59 no transitive derivation", r1SupportBlocks.every((block) => block.pair_results_inferred_transitively === false));
const invalidObserved = observedForBlock(r1Plan, 0, true);
invalidObserved[0]!.layer_a = { ...buildLayerA(invalidObserved[0]!), status: "protocol_invalid" };
check("60 Layer A failure protocol invalid", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, invalidObserved).pair_evaluations.some((pair) => pair.target_persistence_relation === "protocol_invalid"));
const parityObserved = observedForBlock(r1Plan, 0, true);
parityObserved[0]!.entry = { ...parityObserved[0]!.entry, non_intervention_parity_fingerprint: `sha256:${"a".repeat(64)}` };
check("61 parity failure not comparable", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, parityObserved).pair_evaluations.some((pair) => pair.target_persistence_relation === "not_comparable"));
const asym = observedForBlock(r1Plan, 0, true);
asym[0]!.normalized_output = { ...asym[0]!.normalized_output!, required_check: { ...asym[0]!.normalized_output!.required_check, disposition: "failed" } };
check("62 one-sided compliance asymmetry", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, asym).pair_evaluations.some((pair) => pair.target_persistence_relation === "compliance_asymmetry"));
const bothInvalid = observedForBlock(r1Plan, 0, true);
for (const item of bothInvalid) item.normalized_output = { ...item.normalized_output!, required_check: { ...item.normalized_output!.required_check, disposition: "failed" } };
check("63 both invalid not comparable", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, bothInvalid).pair_evaluations.every((pair) => pair.comparison_status === "not_comparable"));
const unknown = observedForBlock(r1Plan, 0, true); unknown[0]!.normalized_output = null;
check("64 compliance unknown", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, unknown).pair_evaluations.some((pair) => pair.comparison_status === "unknown"));
check("65 all equal aggregates equal", buildBlocks(r1Plan, false)[0]!.pair_evaluations.every((pair) => pair.target_persistence_relation === "equal"));
check("66 left direction", r1SupportBlocks[0]!.pair_evaluations.find((pair) => pair.pair_id === "A-B")?.target_persistence_relation === "left_persists_more");
check("67 right direction", r1SupportBlocks[0]!.pair_evaluations.find((pair) => pair.pair_id === "B-C")?.target_persistence_relation === "right_persists_more");
const mixedOutput = normalizedFor(r2.case_id, "C", true);
const mixedLayer = buildOperationalReentryStaleResetCrossCaseLayerBV01(r2.case_id, mixedOutput);
check("68 three dimensions preserved", mixedLayer.independent_directional_observation_count === 3);
check("69 unknown blocks direction", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, unknown).pair_evaluations.some((pair) => pair.target_persistence_relation === "unknown"));
check("70 non-comparable blocks direction", evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, parityObserved).pair_evaluations.some((pair) => pair.target_persistence_relation === "not_comparable"));
check("71 no score rank winner", buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(r1.case_id).scalar_score === false && buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(r1.case_id).rank_or_winner === false);
check("72 exact 4/4 support", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(r1SupportBlocks).status === "supported_consistent");
const threeOfFour = [...r1SupportBlocks]; threeOfFour[3] = buildBlocks(r1Plan, false)[3]!;
check("73 3/4 heterogeneous", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(threeOfFour).status === "within_case_heterogeneous");
check("74 contradictory block heterogeneous", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(threeOfFour).status === "within_case_heterogeneous");
const nullBlocks = buildBlocks(r1Plan, false);
check("75 consistent null non-support", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(nullBlocks).status === "consistent_non_support");
const partialPattern = buildBlocks(r1Plan, { A: true, B: false, C: false, G: false });
check("76 consistent opposite/not-pattern non-support", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(partialPattern).status === "consistent_non_support");
check("77 missing block incomplete", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(r1SupportBlocks.slice(0, 3)).status === "incomplete");
const missingPair = [...r1SupportBlocks];
missingPair[0] = evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, observedForBlock(r1Plan, 0, true).slice(0, 3));
check("78 missing pair incomplete", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(missingPair).status === "incomplete");
check("79 non-comparable pair", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01([evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, parityObserved), ...r1SupportBlocks.slice(1)]).status === "not_comparable");
check("80 protocol invalid wins", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01([evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, invalidObserved), ...r1SupportBlocks.slice(1)]).status === "protocol_invalid");
check("81 diagnostics finite", r1SupportBlocks.every((block) => ["A-C", "A-G"].every((id) => block.pair_evaluations.find((pair) => pair.pair_id === id)?.comparison_status === "comparable")));
check("82 H5 all 24", r1SupportBlocks.flatMap((block) => block.pair_evaluations).every((pair) => pair.common_compliance_relation === "both_valid" && pair.bounded_outcome_relation === "equal"));
check("83 no majority", deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(threeOfFour).majority_vote === false);

// Cross-case disposition (84-91).
const r1Supported = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(r1SupportBlocks);
const r2Supported = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(r2SupportBlocks);
const r1Null = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(nullBlocks);
const r2Null = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(buildBlocks(r2Plan, false));
const heterogeneous = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(threeOfFour);
check("84 both supported replicated", deriveOperationalReentryStaleResetCrossCaseDispositionV01(r1Supported, r2Supported).disposition === "cross_case_pattern_replicated");
check("85 one heterogeneous", deriveOperationalReentryStaleResetCrossCaseDispositionV01(heterogeneous, r2Supported).disposition === "case_heterogeneous");
check("86 support/non-support", deriveOperationalReentryStaleResetCrossCaseDispositionV01(r1Supported, r2Null).disposition === "case_heterogeneous");
const r2Different = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(buildBlocks(r2Plan, { A: true, B: false, C: false, G: false }));
check("87 different non-support", deriveOperationalReentryStaleResetCrossCaseDispositionV01(r1Null, r2Different).disposition === "case_heterogeneous");
check("88 same non-support null", deriveOperationalReentryStaleResetCrossCaseDispositionV01(r1Null, r2Null).disposition === "null_or_no_pattern");
const incomplete = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01([]);
check("89 incomplete cross-case", deriveOperationalReentryStaleResetCrossCaseDispositionV01(incomplete, r2Supported).disposition === "incomplete");
const invalidStatus = deriveOperationalReentryStaleResetReplicationCasePatternStatusV01([evaluateOperationalReentryStaleResetCrossCaseBlockV01(0, invalidObserved), ...r1SupportBlocks.slice(1)]);
check("90 invalid cross-case", deriveOperationalReentryStaleResetCrossCaseDispositionV01(invalidStatus, r2Supported).disposition === "protocol_invalid");
check("91 P6I anchor only", deriveOperationalReentryStaleResetCrossCaseDispositionV01(r1Supported, r2Supported).p6i_vote_or_substitute === false);

// Plans, authorization, artifacts (92-106).
check("92 R1 order", canonicalizeProtocolValueV01(r1Plan.sealed_order) === canonicalizeProtocolValueV01([["A","B","G","C"],["B","C","A","G"],["C","G","B","A"],["G","A","C","B"]]));
check("93 R2 order", canonicalizeProtocolValueV01(r2Plan.sealed_order) === canonicalizeProtocolValueV01(r1Plan.sealed_order));
check("94 four calls per arm", [r1Plan, r2Plan].every((plan) => ["A","B","C","G"].every((arm) => plan.entries.filter((entry) => entry.arm === arm).length === 4)));
check("95 each ordinal balanced", [r1Plan, r2Plan].every((plan) => [0,1,2,3].every((position) => new Set(plan.entries.filter((entry) => entry.position_in_block === position).map((entry) => entry.arm)).size === 4)));
check("96 plan fingerprints distinct", r1Plan.integrity.fingerprint !== r2Plan.integrity.fingerprint);
const r1Authorization = buildAuthorization(r1, r1Plan, route, replicationPricing);
check("97 R1 authorization valid", validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01(r1Authorization).case_id === r1.case_id);
expectThrow("98 R1 auth cannot validate R2", () => validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01({ ...r1Authorization, case_id: r2.case_id }));
assert.doesNotThrow(() => validateCrossCaseLiveAdmissionBindingV01(r1Authorization as unknown as Record<string, unknown>, admission));
assertions.push("98a admission-bound project-root fingerprint passes");
expectThrow("98b raw root hash is not admission fingerprint", () => validateCrossCaseLiveAdmissionBindingV01(reseal(r1Authorization, { project_root_fingerprint: hash(admission.project_root.normalized_path) }) as unknown as Record<string, unknown>, admission));
expectThrow("98c workspace drift fails", () => validateCrossCaseLiveAdmissionBindingV01(r1Authorization as unknown as Record<string, unknown>, { ...admission, workspace_id: "workspace:00000000-0000-4000-8000-000000000002" }));
expectThrow("98d project drift fails", () => validateCrossCaseLiveAdmissionBindingV01(r1Authorization as unknown as Record<string, unknown>, { ...admission, project_id: "project:00000000-0000-4000-8000-000000000002" }));
expectThrow("98e selection revision drift fails", () => validateCrossCaseLiveAdmissionBindingV01(r1Authorization as unknown as Record<string, unknown>, { ...admission, expected_active_selection_revision: 2 }));
expectThrow("98f admission root drift fails", () => validateCrossCaseLiveAdmissionBindingV01(r1Authorization as unknown as Record<string, unknown>, { ...admission, project_root: { ...admission.project_root, normalized_path: "/tmp/other" } }));
expectThrow("98g lab meaning drift fails", () => validateCrossCaseLiveAdmissionBindingV01(r1Authorization as unknown as Record<string, unknown>, { ...admission, gateway_authorization_project_is_lab_experiment_meaning: true as false }));
for (const [label, change] of [
  ["model", { model: "gpt-4.1-mini" }],
  ["codec", { codec_version: "cross-case-codec-drift" }],
  ["schema", { response_schema_version: "cross-case-schema-drift" }],
  ["parser", { parser_version: "cross-case-parser-drift" }],
  ["adapter", { adapter_version: "cross-case-adapter-drift" }],
  ["response bound", { response_bytes: 1167 }],
  ["request bound", { final_request_bytes: 24575 }],
  ["case fingerprint", { case_fingerprint: hash("case-drift") }],
  ["common evidence", { common_evidence_fingerprint: hash("common-drift") }],
  ["plan", { sealed_plan_fingerprint: hash("plan-drift") }],
  ["gate", { gate_contract_fingerprint: hash("gate-drift") }],
  ["evaluator", { evaluator_binding_fingerprint: hash("evaluator-drift") }],
  ["B/G witness", { bg_witness_fingerprint: hash("witness-drift") }],
  ["route", { route_fingerprint: hash("route-drift") }],
  ["provider contract", { provider_contract_fingerprint: hash("provider-drift") }],
  ["adapter route", { adapter_request_route_fingerprint: hash("adapter-route-drift") }],
  ["pricing identity", { pricing_snapshot_fingerprint: hash("pricing-drift") }],
  ["workspace", { workspace_id: "workspace:00000000-0000-4000-8000-000000000002" }],
  ["project", { project_id: "project:00000000-0000-4000-8000-000000000002" }],
  ["selection revision", { expected_active_selection_revision: 2 }],
  ["project-root", { project_root_fingerprint: hash("root-drift") }],
] as const) {
  expectThrow(`98 replication coherent reseal ${label} rejected`, () =>
    validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationContextV01(
      reseal(r1Authorization, change),
      { admission, route, pricing: replicationPricing },
    ),
  );
}
check("99 authorization builder creates no candidate", buildOperationalReentryStaleResetCrossCaseAuthorizationContractV01().creates_candidate === false);
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "augnes-cross-case-"));
const firstConsumption = await consumeOperationalReentryStaleResetCrossCaseAuthorizationV01({ lab_root: tempRoot, authorization: r1Authorization, cohort_id: "cohort-test-one", consumed_at: "2026-08-23T01:00:00.000Z" });
check("100 first consumption atomic temp", (await readFile(firstConsumption.global_marker_path, "utf8")).length > 0 && (await readFile(firstConsumption.local_marker_path, "utf8")).length > 0);
await expectReject("101 duplicate consumption fails", () => consumeOperationalReentryStaleResetCrossCaseAuthorizationV01({ lab_root: tempRoot, authorization: r1Authorization, cohort_id: "cohort-test-two", consumed_at: "2026-08-23T01:01:00.000Z" }));
const partialRoot = await mkdtemp(path.join(os.tmpdir(), "augnes-cross-case-partial-"));
const partialRun = path.join(partialRoot, "operational-reentry-v04-stale-reset-cross-case-replications", r1.case_id, "cohort-partial", `issue-${r1Authorization.future_live_issue_number}`);
await mkdir(partialRun, { recursive: true });
await expectReject("102 partial marker remains consumed", () => consumeOperationalReentryStaleResetCrossCaseAuthorizationV01({ lab_root: partialRoot, authorization: r1Authorization, cohort_id: "cohort-partial", consumed_at: "2026-08-23T01:02:00.000Z" }));
const partialMarkerPath = path.join(partialRoot, "operational-reentry-v04-stale-reset-cross-case-replications", "authorization-consumptions", `${r1Authorization.integrity.fingerprint.slice("sha256:".length)}.json`);
check("103 partial marker durable", (await readFile(partialMarkerPath, "utf8")).length > 0);
check("104 namespaces distinct", String(buildOperationalReentryStaleResetCrossCaseReplicationArtifactFamilyContractV01().namespace) !== String(buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01().namespace));
const bundle = buildReplicationBundle(r1Authorization, r1, r1Plan, replicationPricing);
check("105 replication bundle validates", validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01(bundle, { admission, route }).valid);
const driftBundle = structuredClone(bundle); driftBundle.manifest = sealOperationalReentryStaleResetCrossCaseArtifactV01("manifest", { ...withoutIntegrity(driftBundle.manifest), authorization_fingerprint: `sha256:${"f".repeat(64)}` });
expectThrow("106 coherent resealing drift rejected", () => validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01(driftBundle, { admission, route }));
const secretBundle = structuredClone(bundle) as any; secretBundle.report = sealOperationalReentryStaleResetCrossCaseArtifactV01("report", { ...withoutIntegrity(secretBundle.report), secret: "sk-forbidden-test-value" });
expectThrow("107 privacy rejects raw secret", () => validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01(secretBundle, { admission, route }));
const receiptDriftBundle = structuredClone(bundle) as any;
receiptDriftBundle.call_records[0] = sealOperationalReentryStaleResetCrossCaseArtifactV01("call-drift", { ...withoutIntegrity(receiptDriftBundle.call_records[0]), provider_calls_used: 0 });
expectThrow("107a coherent call egress reseal rejected", () => validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01(receiptDriftBundle, { admission, route }));
const blockDriftBundle = structuredClone(bundle) as any;
blockDriftBundle.block_records[0] = sealOperationalReentryStaleResetCrossCaseArtifactV01("block-drift", { ...withoutIntegrity(blockDriftBundle.block_records[0]), direct_pair_records: [...blockDriftBundle.block_records[0].direct_pair_records].reverse() });
expectThrow("107b coherent block reseal rejected", () => validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01(blockDriftBundle, { admission, route }));

// Compatibility harness and static authority (108-122).
check("108 six-shape order", canonicalizeProtocolValueV01(compatibilityPlan.canonical_order) === canonicalizeProtocolValueV01(["R1-A","R1-B","R1-C","R2-A","R2-B","R2-C"]));
check("109 maximum calls six", compatibilityPlan.maximum_provider_calls === 6);
check("110 no G live slot", compatibilityPlan.g_live_compatibility_slots === 0);
check("111 R1 witness valid", typeof compatibilityPlan.r1_bg_zero_egress_witness_fingerprint === "string");
check("112 R2 witness valid", typeof compatibilityPlan.r2_bg_zero_egress_witness_fingerprint === "string");
const compatibilityAuthorization = buildCompatibilityAuthorization(route, compatibilityPlan, compatibilityPricing);
check("113 compatibility auth distinct", String(compatibilityAuthorization.authorization_version) !== String(r1Authorization.authorization_version));
check("114 compatibility artifact distinct", String(buildOperationalReentryStaleResetCrossCaseCompatibilityArtifactFamilyContractV01().namespace) !== String(buildOperationalReentryStaleResetCrossCaseReplicationArtifactFamilyContractV01().namespace));
check("115 live compatibility none", compatibilityPlan.live_compatibility_result === "none");
check("116 compatibility authorization valid", validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(compatibilityAuthorization).maximum_calls === 6);
for (const [label, change] of [
  ["R1 case", { r1_case_fingerprint: hash("compat-r1-case-drift") }],
  ["R1 common", { r1_common_evidence_fingerprint: hash("compat-r1-common-drift") }],
  ["R2 case", { r2_case_fingerprint: hash("compat-r2-case-drift") }],
  ["R2 common", { r2_common_evidence_fingerprint: hash("compat-r2-common-drift") }],
  ["six-shape plan", { six_shape_plan_fingerprint: hash("compat-plan-drift") }],
  ["R1 witness", { r1_bg_witness_fingerprint: hash("compat-r1-witness-drift") }],
  ["R2 witness", { r2_bg_witness_fingerprint: hash("compat-r2-witness-drift") }],
  ["provider contract", { provider_contract_fingerprint: hash("compat-provider-drift") }],
  ["route", { route_fingerprint: hash("compat-route-drift") }],
  ["adapter route", { adapter_request_route_fingerprint: hash("compat-adapter-route-drift") }],
  ["parser closure", { parser_closure_fingerprint: hash("compat-parser-drift") }],
  ["request bounds", { request_response_bounds_fingerprint: hash("compat-bounds-drift") }],
  ["pricing", { pricing_fingerprint: hash("compat-pricing-drift") }],
  ["pricing authority", { pricing_authority_fingerprint: hash("compat-pricing-authority-drift") }],
  ["workspace", { workspace_id: "workspace:00000000-0000-4000-8000-000000000002" }],
  ["project", { project_id: "project:00000000-0000-4000-8000-000000000002" }],
  ["selection revision", { expected_active_selection_revision: 2 }],
  ["project-root", { project_root_fingerprint: hash("compat-root-drift") }],
] as const) {
  expectThrow(`116 compatibility coherent reseal ${label} rejected`, () =>
    validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationContextV01(
      reseal(compatibilityAuthorization, change),
      { admission, route, pricing: compatibilityPricing },
    ),
  );
}
const compatTemp = await mkdtemp(path.join(os.tmpdir(), "augnes-cross-case-compat-"));
const compatConsumption = await consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01({ lab_root: compatTemp, authorization: compatibilityAuthorization, probe_id: "cross-case-probe-test", consumed_at: "2026-08-23T01:05:00.000Z" });
check("117 compatibility marker temp only", compatConsumption.run_root.startsWith(compatTemp));
const compatibilityBundle = buildCompatibilityBundle(compatibilityAuthorization, compatibilityPlan, compatibilityPricing);
check("118 compatibility bundle validates", validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01(compatibilityBundle, { admission, route }).valid);
const compatibilityOrderDrift = structuredClone(compatibilityBundle) as any;
compatibilityOrderDrift.shape_records.reverse();
expectThrow("118a compatibility order tamper rejected", () => validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01(compatibilityOrderDrift, { admission, route }));
const compatibilityReportDrift = structuredClone(compatibilityBundle) as any;
compatibilityReportDrift.report = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-report-drift", { ...withoutIntegrity(compatibilityReportDrift.report), attempted_provider_calls: 0 });
expectThrow("118b compatibility report tamper rejected", () => validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01(compatibilityReportDrift, { admission, route }));
const compatibilityEgressDrift = structuredClone(compatibilityBundle) as any;
compatibilityEgressDrift.shape_records[0] = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-shape-egress-drift", { ...withoutIntegrity(compatibilityEgressDrift.shape_records[0]), egress_attempted: false });
expectThrow("118c compatibility receipt egress tamper rejected", () => validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01(compatibilityEgressDrift, { admission, route }));
const compatibilityStoppedBundle = buildStoppedCompatibilityBundle(compatibilityBundle, compatibilityPlan, compatibilityPricing);
check("118d compatibility stop-after-first bundle reconstructs", validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01(compatibilityStoppedBundle, { admission, route }).attempted_provider_calls === 1);
check("119 historical route fingerprint preserved", ACGC_E2R2P6H_ROUTE_FINGERPRINT_V01 === "sha256:1d53d6d1b8ae9480542284718e662cb164cfb49284d6be20230b233c5d1d625f");
check("120 historical provider fingerprint preserved", ACGC_E2R2P6H_PROVIDER_CONTRACT_FINGERPRINT_V01 === "sha256:1ca7da7cf3870de67fdbe36f1a6bf9d67a3a50accbd8f7daf147e424901eda52");
check("121 historical adapter fingerprint preserved", ACGC_E2R2P6H_ADAPTER_REQUEST_ROUTE_FINGERPRINT_V01 === "sha256:7418f3ace51f53a8089c33392dc00d697f21ab383a4c4442fc4ffdc39efea0fa");
check("122 authority remains zero", operationalReentryStaleResetCrossCaseStaticAuthorityV01.real_provider_calls === 0 && operationalReentryStaleResetCrossCaseStaticAuthorityV01.replication_live_GO === false && operationalReentryStaleResetCrossCaseStaticAuthorityV01.product_transfer_GO === false && operationalReentryStaleResetCrossCaseStaticAuthorityV01.policy_GO === false && operationalReentryStaleResetCrossCaseStaticAuthorityV01.stage_7_GO === false);

let fakeReplicationCalls = 0;
let fakeReplicationConsumptions = 0;
const fakeInvoke = (async (envelope: any) => {
  fakeReplicationCalls += 1;
  const spec = readOperationalReentryStaleResetCrossCaseV01(envelope.input.local_invocation_context.case_id);
  const arm = inferArm(envelope.input.provider_material, spec);
  const output = parseOperationalReentryStaleResetCrossCaseOutputV01(
    JSON.stringify(buildValidWire(spec, arm, false)),
    envelope.input.provider_material,
  );
  return {
    generator: "openai" as const,
    output,
    model_invocation_receipt: buildReceipt(
      envelope.input,
      output,
      replicationPricing.gateway_cost_budget,
      "live_success",
    ),
  };
}) as any;
const fakeReplication = await runOperationalReentryStaleResetCrossCaseReplicationV01(
  { authorization: r1Authorization, admission, route, pricing: replicationPricing },
  { invoke_gateway: fakeInvoke, assert_execution_state() {}, consume_authorization() { fakeReplicationConsumptions += 1; } },
);
check("123 fake replication executes sealed 16 calls", fakeReplicationCalls === 16 && fakeReplication.calls.length === 16);
check("124 replication consumes once", fakeReplicationConsumptions === 1 && fakeReplication.authorization_consumed);
check("125 fake consistent null is non-support", fakeReplication.case_status.status === "consistent_non_support");
check("125a replication attempted calls aggregate from receipts", fakeReplication.attempted_provider_calls === 16);

const receiptEntry = r1Plan.entries[0]!;
const receiptOutput = normalizedFor(r1.case_id, receiptEntry.arm, false);
const successReceipt = buildReceipt(
  receiptEntry.invocation,
  receiptOutput,
  replicationPricing.gateway_cost_budget,
  "live_success",
);
const successTerminal = buildOperationalReentryStaleResetCrossCaseCallTerminalV01(
  receiptEntry,
  "completed_live",
  receiptOutput,
  successReceipt,
  null,
);
check("125b completed live receipt counts one egress", successTerminal.egress_attempted && successTerminal.provider_calls_used === 1);
check("125c receipt fingerprint deterministic", successTerminal.receipt_fingerprint === buildOperationalReentryStaleResetCrossCaseCallTerminalV01(receiptEntry, "completed_live", receiptOutput, structuredClone(successReceipt), null).receipt_fingerprint);
for (const outcome of [
  "provider_rejected",
  "provider_response_invalid",
  "transport_failed",
  "timeout",
  "cancelled",
] as const) {
  const receipt = buildReceipt(
    receiptEntry.invocation,
    null,
    replicationPricing.gateway_cost_budget,
    outcome,
  );
  const terminal = buildOperationalReentryStaleResetCrossCaseCallTerminalV01(
    receiptEntry,
    "terminal_failure",
    null,
    receipt,
    String(receipt.failure_code),
  );
  check(`125 receipt ${outcome} counts one egress`, terminal.egress_attempted && terminal.provider_calls_used === 1);
}
const refusalReceipt = buildReceipt(
  receiptEntry.invocation,
  null,
  replicationPricing.gateway_cost_budget,
  "pre_egress_refusal",
);
const refusalTerminal = buildOperationalReentryStaleResetCrossCaseCallTerminalV01(
  receiptEntry,
  "terminal_failure",
  null,
  refusalReceipt,
  String(refusalReceipt.failure_code),
);
check("125d pre-egress refusal counts zero", !refusalTerminal.egress_attempted && refusalTerminal.provider_calls_used === 0);
const hardStopTerminal = buildOperationalReentryStaleResetCrossCaseCallTerminalV01(
  receiptEntry,
  "not_attempted_after_hard_stop",
  null,
  null,
  "cross_case_replication_hard_stop",
);
check("125e hard-stop unattempted has null receipt", !hardStopTerminal.egress_attempted && hardStopTerminal.provider_calls_used === 0 && hardStopTerminal.receipt_fingerprint === null && hardStopTerminal.model_invocation_receipt === null);

let fakeCompatibilityCalls = 0;
let fakeCompatibilityConsumptions = 0;
const fakeCompatibility = await runOperationalReentryStaleResetCrossCaseCompatibilityV01(
  { authorization: compatibilityAuthorization, admission, route, pricing: compatibilityPricing },
  {
    invoke_gateway: (async (envelope: any) => {
      fakeCompatibilityCalls += 1;
      const spec = readOperationalReentryStaleResetCrossCaseV01(envelope.input.local_invocation_context.case_id);
      const arm = inferArm(envelope.input.provider_material, spec);
      const output = parseOperationalReentryStaleResetCrossCaseOutputV01(
        JSON.stringify(buildValidWire(spec, arm, false)),
        envelope.input.provider_material,
      );
      return {
        generator: "openai" as const,
        output,
        model_invocation_receipt: buildReceipt(
          envelope.input,
          output,
          compatibilityPricing.gateway_cost_budget,
          "live_success",
        ),
      };
    }) as any,
    assert_execution_state() {},
    consume_authorization() { fakeCompatibilityConsumptions += 1; },
  },
);
check("126 fake compatibility executes six shapes", fakeCompatibilityCalls === 6 && fakeCompatibility.calls.length === 6);
check("127 compatibility consumes once", fakeCompatibilityConsumptions === 1 && fakeCompatibility.authorization_consumed);
check("127a compatibility attempted calls aggregate from receipts", fakeCompatibility.attempted_provider_calls === 6);
const failedReplication = await runOperationalReentryStaleResetCrossCaseReplicationV01(
  { authorization: r1Authorization, admission, route, pricing: replicationPricing },
  {
    invoke_gateway: (async (envelope: any) => {
      throw new ModelGatewayInvocationErrorV01(
        "model_gateway_provider_rejected",
        buildReceipt(
          envelope.input,
          null,
          replicationPricing.gateway_cost_budget,
          "provider_rejected",
        ),
      );
    }) as any,
    assert_execution_state() {},
    consume_authorization() {},
  },
);
check("127b replication failure aggregation uses receipt budget", failedReplication.attempted_provider_calls === 1 && failedReplication.calls.slice(1).every((call) => call.provider_calls_used === 0));
const failedCompatibility = await runOperationalReentryStaleResetCrossCaseCompatibilityV01(
  { authorization: compatibilityAuthorization, admission, route, pricing: compatibilityPricing },
  {
    invoke_gateway: (async (envelope: any) => {
      throw new ModelGatewayInvocationErrorV01(
        "model_gateway_transport_failed",
        buildReceipt(
          envelope.input,
          null,
          compatibilityPricing.gateway_cost_budget,
          "transport_failed",
        ),
      );
    }) as any,
    assert_execution_state() {},
    consume_authorization() {},
  },
);
check("127c compatibility failure aggregation uses receipt budget", failedCompatibility.attempted_provider_calls === 1 && failedCompatibility.calls.slice(1).every((call) => call.provider_calls_used === 0));

console.log(JSON.stringify({
  status: "operational_reentry_stale_reset_cross_case_replication_test_passed",
  assertions: assertions.length,
  parser_outputs_exhaustively_parsed: exhaustiveParsed,
  r1_case_fingerprint: OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_FINGERPRINT_V01,
  r1_common_evidence_fingerprint: OPERATIONAL_REENTRY_STALE_RESET_R1_COMMON_EVIDENCE_FINGERPRINT_V01,
  r2_case_fingerprint: OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_FINGERPRINT_V01,
  r2_common_evidence_fingerprint: OPERATIONAL_REENTRY_STALE_RESET_R2_COMMON_EVIDENCE_FINGERPRINT_V01,
  r1_plan_fingerprint: r1Plan.integrity.fingerprint,
  r2_plan_fingerprint: r2Plan.integrity.fingerprint,
  compatibility_plan_fingerprint: compatibilityPlan.integrity.fingerprint,
  fake_replication_transport_calls: fakeReplicationCalls,
  fake_compatibility_transport_calls: fakeCompatibilityCalls,
  real_provider_calls: 0,
}, null, 2));

function buildValidWire(
  spec: typeof r1 | typeof r2,
  arm: OperationalReentryStaleResetCrossCaseArmV01,
  persist: boolean,
) {
  const material = buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(spec.case_id, arm);
  const targetVisible = material.allowed_output.referenced_continuation_tokens.includes(spec.target.context_token);
  const selectedReferences = new Set(material.continuation_context.filter((item) => item.role === "non_target").map((item) => item.context_token));
  if (persist && targetVisible) selectedReferences.add(spec.target.context_token);
  const selectedActions = new Set<string>([
    spec.case_id === r1.case_id ? "bounded_reference_review" : "bounded_archive_readiness_review",
    spec.case_id === r1.case_id ? "no_external_reference_update" : "retain_signed_bundle_review_only",
  ]);
  if (persist && spec.evaluator_binding.target_action_token) selectedActions.add(spec.evaluator_binding.target_action_token);
  return {
    result_status: "review_ready" as const,
    required_check_disposition: "passed" as const,
    referenced_continuation_selections: Object.fromEntries(material.allowed_output.referenced_continuation_tokens.map((token) => [token, selectedReferences.has(token)])),
    operation_action_class_selections: Object.fromEntries(material.allowed_output.operation_action_class_tokens.map((token) => [token, selectedActions.has(token)])),
    result_limitation_selections: Object.fromEntries(material.allowed_output.result_limitation_tokens.map((token) => [token, token === spec.evaluator_binding.target_neutral_limitation])),
    abstention: false,
  };
}

function inferArm(material: ReturnType<typeof buildOperationalReentryStaleResetCrossCaseProviderMaterialV01>, spec: typeof r1 | typeof r2): OperationalReentryStaleResetCrossCaseArmV01 {
  if (material.stale_relation) return "C";
  return material.continuation_context.some((item) => item.context_token === spec.target.context_token) ? "A" : "B";
}

function normalizedFor(caseId: OperationalReentryStaleResetCrossCaseIdV01, arm: OperationalReentryStaleResetCrossCaseArmV01, persist: boolean) {
  const spec = readOperationalReentryStaleResetCrossCaseV01(caseId);
  const material = buildOperationalReentryStaleResetCrossCaseProviderMaterialV01(caseId, arm);
  return parseOperationalReentryStaleResetCrossCaseOutputV01(JSON.stringify(buildValidWire(spec, arm, persist)), material);
}

function observedForBlock(plan: typeof r1Plan, block: 0 | 1 | 2 | 3, support: boolean | Record<OperationalReentryStaleResetCrossCaseArmV01, boolean>): OperationalReentryStaleResetCrossCaseObservedArmV01[] {
  return plan.entries.filter((entry) => entry.repeat_block === block).map((entry) => ({
    entry,
    normalized_output: normalizedFor(entry.case_id, entry.arm, typeof support === "boolean" ? support && ["A","C"].includes(entry.arm) : support[entry.arm]),
  }));
}

function buildBlocks(plan: typeof r1Plan, support: boolean | Record<OperationalReentryStaleResetCrossCaseArmV01, boolean>) {
  return ([0,1,2,3] as const).map((block) => evaluateOperationalReentryStaleResetCrossCaseBlockV01(block, observedForBlock(plan, block, support)));
}

function buildLayerA(item: OperationalReentryStaleResetCrossCaseObservedArmV01) {
  const plan = item.entry.case_id === r1.case_id ? r1Plan : r2Plan;
  return evaluateOperationalReentryStaleResetCrossCaseBlockV01(item.entry.repeat_block, observedForBlock(plan as typeof r1Plan, item.entry.repeat_block, true)).protocol_invalid
    ? ({ status: "protocol_invalid" } as any)
    : ({ ...((item.layer_a ?? {}) as any), status: "valid_target_present" } as any);
}

function limitationState(spec: typeof r1 | typeof r2, token: string) {
  const base = normalizedFor(spec.case_id, "C", false);
  const output = { ...base, result_limitation_tokens: [token], target_disposition: token.includes("selected") || token.includes("persisted") ? "stale_persisted" as const : "withheld_stale" as const };
  return buildOperationalReentryStaleResetCrossCaseLayerBV01(spec.case_id, output).target_specific_result_limitation;
}

function multipleLimitationsState(spec: typeof r1) {
  const base = normalizedFor(spec.case_id, "C", false);
  const tokens = Object.keys(spec.evaluator_binding.target_specific_limitations).slice(0, 2);
  return buildOperationalReentryStaleResetCrossCaseLayerBV01(spec.case_id, { ...base, result_limitation_tokens: tokens }).target_specific_result_limitation;
}

function enumeratePermitted(material: ReturnType<typeof buildOperationalReentryStaleResetCrossCaseProviderMaterialV01>): number {
  let count = 0;
  for (const result of material.allowed_output.result_statuses) {
    for (const checkDisposition of material.allowed_output.required_check_dispositions) {
      for (let references = 0; references < 2 ** material.allowed_output.referenced_continuation_tokens.length; references += 1) {
        for (let actions = 0; actions < 2 ** material.allowed_output.operation_action_class_tokens.length; actions += 1) {
          for (let limitations = 0; limitations < 2 ** material.allowed_output.result_limitation_tokens.length; limitations += 1) {
            for (const abstention of [false, true]) {
              const wire = {
                result_status: result,
                required_check_disposition: checkDisposition,
                referenced_continuation_selections: mask(material.allowed_output.referenced_continuation_tokens, references),
                operation_action_class_selections: mask(material.allowed_output.operation_action_class_tokens, actions),
                result_limitation_selections: mask(material.allowed_output.result_limitation_tokens, limitations),
                abstention,
              };
              parseOperationalReentryStaleResetCrossCaseOutputV01(JSON.stringify(wire), material);
              count += 1;
            }
          }
        }
      }
    }
  }
  return count;
}

function mask(tokens: readonly string[], value: number) {
  return Object.fromEntries(tokens.map((token, index) => [token, (value & (1 << index)) !== 0]));
}

function buildReceipt(
  invocation: Parameters<
    typeof createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01
  >[0],
  output: OperationalReentryStaleResetCrossCaseModelOutputV01 | null,
  costBudget: ReturnType<typeof buildPricing>["gateway_cost_budget"],
  outcome:
    | "live_success"
    | "provider_rejected"
    | "provider_response_invalid"
    | "transport_failed"
    | "timeout"
    | "cancelled"
    | "pre_egress_refusal",
): ModelInvocationReceiptV02 {
  const egressAttempted = outcome !== "pre_egress_refusal";
  const failureCode = outcome === "live_success"
    ? null
    : outcome === "provider_rejected"
      ? "model_gateway_provider_rejected"
      : outcome === "provider_response_invalid"
        ? "model_gateway_provider_response_invalid"
        : outcome === "transport_failed"
          ? "model_gateway_transport_failed"
          : outcome === "timeout"
            ? "model_gateway_timeout"
            : outcome === "cancelled"
              ? "model_gateway_cancelled"
              : "model_gateway_egress_refused";
  const status = outcome === "live_success"
    ? "completed"
    : outcome === "timeout"
      ? "timed_out"
      : outcome === "cancelled"
        ? "cancelled"
        : outcome === "pre_egress_refusal"
          ? "blocked"
          : "failed";
  const receiptOutcome = outcome === "live_success"
    ? "live_success"
    : outcome === "timeout"
      ? "timeout"
      : outcome === "cancelled"
        ? "cancelled"
        : outcome === "pre_egress_refusal"
          ? "refused"
          : "provider_failure";
  return {
    receipt_version: "model_invocation_receipt.v0.2",
    gateway_version: "model_gateway.v0.1",
    invocation_id: invocation.local_invocation_context.call_slot_id,
    workspace_id: admission.workspace_id,
    project_id: admission.project_id,
    work_id: null,
    run_id: null,
    purpose: "operational_reentry_stale_reset_cross_case_replication_v01",
    local_invocation_identity_fingerprint:
      createOperationalReentryStaleResetCrossCaseLocalInvocationIdentityFingerprintV01(
        invocation,
      ),
    invocation_origin: "interactive",
    attempted_implementation_id:
      "openai_responses.operational_reentry_stale_reset_cross_case_replication",
    attempted_implementation_version:
      "openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.1",
    attempted_provider_ref: egressAttempted ? exactRoute.provider_ref : null,
    attempted_model_ref: egressAttempted ? exactRoute.model_ref : null,
    final_implementation_id:
      "openai_responses.operational_reentry_stale_reset_cross_case_replication",
    final_implementation_version:
      "openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.1",
    requested_mode: "live",
    execution_mode: "live",
    selection_reason: "requested_live",
    started_at: "2026-08-24T00:00:00.000Z",
    finished_at: "2026-08-24T00:00:00.001Z",
    latency_ms: 1,
    status,
    outcome: receiptOutcome,
    egress_attempted: egressAttempted,
    egress_status: egressAttempted ? "occurred" : "blocked",
    egress_policy_version: "model_gateway_egress_policy.v0.1",
    usage: null,
    cost: {
      basis: "unavailable",
      amount: null,
      currency: null,
      source: "provider_cost_not_reported",
    },
    budget: {
      decision: egressAttempted ? "within_budget" : "refused",
      input_bytes_limit: 24576,
      input_bytes_used: egressAttempted ? 1 : null,
      output_tokens_limit: 1168,
      output_tokens_used: null,
      provider_call_limit: 1,
      provider_calls_used: egressAttempted ? 1 : 0,
      timeout_limit_ms: 30000,
      timeout_disposition: outcome === "timeout"
        ? "timed_out"
        : outcome === "cancelled"
          ? "cancelled"
          : "completed_within_deadline",
      cost_budget: costBudget,
    },
    cancellation_disposition: outcome === "cancelled" ? "cancelled" : "not_cancelled",
    failure_code: failureCode,
    data_classification: "public_safe",
    retention_class: "none",
    privacy_decision: egressAttempted
      ? "provider_egress_approved"
      : "provider_egress_blocked",
    provenance_refs: [hash({ case_id: invocation.local_invocation_context.case_id })],
    grant_lineage_ref: null,
    automation_control_lineage_ref: null,
    fallback_used: false,
    coverage_class: "enforced",
    trust_class: outcome === "live_success" ? "provider_report" : "direct_local_observation",
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    receipt_is_semantic_authority: false,
    ...(output === null ? {} : { normalized_output_fingerprint: hash(output) }),
  };
}

function buildPricing(
  routeValue: OperationalReentryStaleResetCrossCaseRouteV01,
  admissionValue: typeof admission,
  plannedCalls: 6 | 16,
) {
  const authority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: admissionValue.workspace_id,
    project_id: admissionValue.project_id,
    purpose: "operational_reentry_stale_reset_cross_case_replication_v01",
    provider_ref: routeValue.provider_ref,
    model_ref: routeValue.model_ref,
    cost_unit: "nano_usd",
    input_rate: { unit: "utf8_byte", cost_per_unit: 1 },
    output_rate: { unit: "token", cost_per_unit: 1 },
    pricing_source_version: "test-pricing-v01",
    pricing_effective_at: "2026-08-23T00:00:00.000Z",
    pricing_expires_at: "2030-08-23T00:00:00.000Z",
    project_model_policy_fingerprint: routeValue.integrity_fingerprint,
  });
  const budget = buildModelGatewayCostBudgetV01({
    authority,
    workspace_id: admissionValue.workspace_id,
    project_id: admissionValue.project_id,
    purpose: "operational_reentry_stale_reset_cross_case_replication_v01",
    provider_ref: routeValue.provider_ref,
    model_ref: routeValue.model_ref,
    maximum_input_units: 24576,
    maximum_output_units: 1168,
    timeout_ms: 30000,
    maximum_permitted_cost: 250000000,
    evaluated_at: "2026-08-24T00:00:00.000Z",
  });
  return buildOperationalReentryStaleResetCrossCasePricingV01({
    gateway_cost_budget: budget,
    planned_calls: plannedCalls,
    maximum_total_ceiling_nano_usd: 250000000,
  });
}

function buildAuthorization(
  spec: typeof r1,
  plan: typeof r1Plan,
  routeValue: OperationalReentryStaleResetCrossCaseRouteV01,
  pricing: ReturnType<typeof buildPricing>,
) {
  return buildOperationalReentryStaleResetReplicationAuthorizationV01({
    authorization_id: "p6l-test-authorization",
    future_live_issue_number: 999001,
    exact_merged_source_head: "1".repeat(40),
    repository_slug: "hynk-studio/augnes-perspective-lab",
    authorized_origin: "https://github.com/hynk-studio/augnes-perspective-lab.git",
    workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
    project_id: "project:00000000-0000-4000-8000-000000000001",
    expected_active_selection_revision: 1,
    project_root_fingerprint: hash(admission.project_root),
    gateway_authorization_project_is_lab_experiment_meaning: false,
    case_id: spec.case_id,
    case_fingerprint: spec.integrity.fingerprint,
    common_evidence_fingerprint: spec.common_evidence_fingerprint,
    construction_cutoff: spec.construction_cutoff,
    observation_cutoff: spec.observation_cutoff,
    gate_contract_fingerprint: plan.gate_contract_fingerprint,
    evaluator_binding_fingerprint: plan.evaluator_binding_fingerprint,
    sealed_plan_fingerprint: plan.integrity.fingerprint,
    bg_witness_fingerprint: plan.bg_conformance_witnesses[0]!.integrity.fingerprint,
    route_fingerprint: routeValue.integrity_fingerprint,
    provider_contract_fingerprint: plan.provider_contract_fingerprint,
    adapter_request_route_fingerprint: plan.entries[0]!.adapter_request_route_fingerprint,
    adapter_version: "openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.1",
    pricing_snapshot_fingerprint: pricing.integrity.fingerprint,
    pricing_authority_fingerprint: pricing.pricing_authority_fingerprint,
    pricing_authority_expires_at: pricing.pricing_authority_expires_at,
    aggregate_worst_case_cost_nano_usd: pricing.aggregate_worst_case_cost_nano_usd,
    maximum_total_ceiling_nano_usd: 250000000,
    gateway_cost_budget: pricing.gateway_cost_budget,
  });
}

function buildCompatibilityAuthorization(
  routeValue: OperationalReentryStaleResetCrossCaseRouteV01,
  plan: typeof compatibilityPlan,
  pricing: ReturnType<typeof buildPricing>,
) {
  return buildOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01({
    authorization_id: "p6l-test-compatibility-authorization",
    future_compatibility_issue_number: 999002,
    exact_merged_source_head: "2".repeat(40),
    repository_slug: "hynk-studio/augnes-perspective-lab",
    authorized_origin: "https://github.com/hynk-studio/augnes-perspective-lab.git",
    workspace_id: "workspace:00000000-0000-4000-8000-000000000001",
    project_id: "project:00000000-0000-4000-8000-000000000001",
    expected_active_selection_revision: 1,
    project_root_fingerprint: hash(admission.project_root),
    provider_contract_fingerprint: readProviderContractFingerprint(),
    route_fingerprint: routeValue.integrity_fingerprint,
    adapter_request_route_fingerprint: plan.entries[0]!.adapter_request_route_fingerprint,
    r1_case_fingerprint: r1.integrity.fingerprint,
    r1_common_evidence_fingerprint: r1.common_evidence_fingerprint,
    r2_case_fingerprint: r2.integrity.fingerprint,
    r2_common_evidence_fingerprint: r2.common_evidence_fingerprint,
    six_shape_plan_fingerprint: plan.integrity.fingerprint,
    r1_bg_witness_fingerprint: plan.r1_bg_zero_egress_witness_fingerprint,
    r2_bg_witness_fingerprint: plan.r2_bg_zero_egress_witness_fingerprint,
    parser_closure_fingerprint: hash(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_PER_SHAPE_PARSER_CLOSURE_V01),
    request_response_bounds_fingerprint: hash(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_WIRE_BUDGET_PROOF_V01),
    pricing_fingerprint: pricing.integrity.fingerprint,
    pricing_authority_fingerprint: pricing.pricing_authority_fingerprint,
    pricing_authority_expires_at: pricing.pricing_authority_expires_at,
    maximum_total_ceiling_nano_usd: 250000000,
    gateway_cost_budget: pricing.gateway_cost_budget,
  });
}

function buildReplicationBundle(
  authorization: ReturnType<typeof buildAuthorization>,
  spec: typeof r1,
  plan: typeof r1Plan,
  pricing: ReturnType<typeof buildPricing>,
) {
  const gate = buildOperationalReentryStaleResetCrossCaseGateContractV01(spec.case_id);
  const evaluator = buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(spec.case_id);
  const cohortId = "cross-case-replication-test-cohort";
  const manifest = sealOperationalReentryStaleResetCrossCaseArtifactV01("manifest", {
    manifest_version: "operational_reentry_v04_stale_reset_replication_manifest.v0.1",
    cohort_id: cohortId,
    case_id: spec.case_id,
    future_live_issue_number: authorization.future_live_issue_number,
    source_repository_head_sha: authorization.exact_merged_source_head,
    authorization_fingerprint: authorization.integrity.fingerprint,
    case_fingerprint: spec.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
    gate_contract_fingerprint: gate.integrity.fingerprint,
    evaluator_binding_fingerprint: evaluator.integrity.fingerprint,
    pricing_fingerprint: pricing.integrity.fingerprint,
    route_fingerprint: exactRoute.integrity_fingerprint,
    provider_contract_fingerprint: exactRoute.provider_contract_fingerprint,
    route: structuredClone(exactRoute),
    request_family: plan.request_family_kind,
    public_safe: true,
    raw_or_private_material_persisted: false,
  });
  const attempt = sealOperationalReentryStaleResetCrossCaseArtifactV01("attempt", {
    manifest_fingerprint: manifest.integrity.fingerprint,
    retries: 0,
    replacements: 0,
    maximum_parallel_provider_calls: 1,
  });
  const calls = plan.entries.map((entry) => {
    const output = normalizedFor(entry.case_id, entry.arm, false);
    const receipt = buildReceipt(
      entry.invocation,
      output,
      pricing.gateway_cost_budget,
      "live_success",
    );
    const terminalValue =
      buildOperationalReentryStaleResetCrossCaseCallTerminalV01(
        entry,
        "completed_live",
        output,
        receipt,
        null,
      );
    return sealOperationalReentryStaleResetCrossCaseArtifactV01(
      `call-${entry.call_order}`,
      {
        ...withoutIntegrity(terminalValue),
        manifest_fingerprint: manifest.integrity.fingerprint,
      },
    );
  });
  const reconstructedBlocks = ([0, 1, 2, 3] as const).map((repeatBlock) =>
    evaluateOperationalReentryStaleResetCrossCaseBlockV01(
      repeatBlock,
      calls
        .filter((call) => call.repeat_block === repeatBlock)
        .map((call) => ({
          entry: plan.entries[call.call_order]!,
          normalized_output: call.normalized_output,
        })),
    ),
  );
  const blocks = reconstructedBlocks.map((block) =>
    sealOperationalReentryStaleResetCrossCaseArtifactV01(
      `block-${block.repeat_block}`,
      {
        ...withoutIntegrity(block),
        case_id: spec.case_id,
        direct_pair_records: block.pair_evaluations,
      },
    ),
  );
  const caseStatus =
    deriveOperationalReentryStaleResetReplicationCasePatternStatusV01(
      reconstructedBlocks,
    );
  const report = sealOperationalReentryStaleResetCrossCaseArtifactV01("report", {
    report_version: "operational_reentry_v04_stale_reset_replication_report.v0.1",
    manifest_fingerprint: manifest.integrity.fingerprint,
    case_status_fingerprint: caseStatus.integrity.fingerprint,
    case_status: caseStatus.status,
    planned_calls: 16,
    terminal_call_records: calls.length,
    complete_blocks: 4,
    direct_pair_records: 24,
    attempted_provider_calls: 16,
    retries: 0,
    replacements: 0,
    product_or_core_writes: 0,
    policy: false,
    stage_7: false,
  });
  const terminal = sealOperationalReentryStaleResetCrossCaseArtifactV01("terminal", { report_fingerprint: report.integrity.fingerprint, terminal: true });
  const index = sealOperationalReentryStaleResetCrossCaseArtifactV01("index", { artifact_index_version: "operational_reentry_v04_stale_reset_replication_artifact_index.v0.1", report_fingerprint: report.integrity.fingerprint, terminal_fingerprint: terminal.integrity.fingerprint, call_record_count: 16, block_record_count: 4 });
  const marker = sealOperationalReentryStaleResetCrossCaseArtifactV01("marker", {
    marker_version: "operational_reentry_v04_stale_reset_replication_consumption.v0.1",
    authorization_fingerprint: authorization.integrity.fingerprint,
    authorization_id: authorization.authorization_id,
    case_id: authorization.case_id,
    case_fingerprint: authorization.case_fingerprint,
    cohort_id: cohortId,
    future_live_issue_number: authorization.future_live_issue_number,
    consumed_at: "2026-08-24T00:00:00.000Z",
    single_use: true,
  });
  return { authorization, case_specification: spec, plan, gate_contract: gate, evaluator_binding: evaluator, pricing, manifest, attempt, call_records: calls, block_records: blocks, case_status: caseStatus, report, terminal, artifact_index: index, global_consumption_marker: marker, run_local_consumption_marker: structuredClone(marker) };
}

function buildCompatibilityBundle(
  authorization: ReturnType<typeof buildCompatibilityAuthorization>,
  plan: typeof compatibilityPlan,
  pricing: ReturnType<typeof buildPricing>,
) {
  const probeId = "cross-case-compatibility-test-probe";
  const manifest = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-manifest", {
    compatibility_version: "operational_reentry_stale_reset_cross_case_compatibility_probe.v0.1",
    probe_id: probeId,
    future_compatibility_issue_number: authorization.future_compatibility_issue_number,
    source_repository_head_sha: authorization.exact_merged_source_head,
    authorization_fingerprint: authorization.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
    provider_contract_fingerprint: exactRoute.provider_contract_fingerprint,
    route_fingerprint: exactRoute.integrity_fingerprint,
    route: structuredClone(exactRoute),
    pricing_fingerprint: pricing.integrity.fingerprint,
    behavioral_replication: false,
    raw_or_private_material_persisted: false,
  });
  const shapes = plan.entries.map((entry) => {
    const output = normalizedFor(entry.case_id, entry.provider_shape, false);
    const receipt = buildReceipt(
      entry.invocation,
      output,
      pricing.gateway_cost_budget,
      "live_success",
    );
    return sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(
      `shape-${entry.call_order}`,
      {
        call_order: entry.call_order,
        repeat_block: 0,
        arm: entry.provider_shape,
        case_id: entry.case_id,
        call_id: entry.invocation.local_invocation_context.call_slot_id,
        terminal_category: "completed_live",
        normalized_output: output,
        model_invocation_receipt: receipt,
        receipt_fingerprint: hash(receipt),
        egress_attempted: true,
        provider_calls_used: 1,
        failure_code: null,
        raw_prompt_persisted: false,
        raw_request_body_persisted: false,
        raw_provider_response_persisted: false,
        raw_provider_error_persisted: false,
        hidden_reasoning_persisted: false,
        shape_label: `${entry.case_id.includes(":r1-") ? "R1" : "R2"}-${entry.provider_shape}`,
        manifest_fingerprint: manifest.integrity.fingerprint,
      },
    );
  });
  const report = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-report", {
    manifest_fingerprint: manifest.integrity.fingerprint,
    completion_status: "compatible",
    planned_shapes: 6,
    terminal_shape_records: 6,
    attempted_provider_calls: 6,
    retries: 0,
    replacements: 0,
    behavioral_replication: false,
  });
  const terminal = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-terminal", { report_fingerprint: report.integrity.fingerprint, terminal: true });
  const index = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-index", { report_fingerprint: report.integrity.fingerprint, terminal_fingerprint: terminal.integrity.fingerprint, shape_record_count: 6 });
  const marker = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("compat-marker", {
    marker_version: "operational_reentry_stale_reset_cross_case_compatibility_consumption.v0.1",
    authorization_fingerprint: authorization.integrity.fingerprint,
    probe_id: probeId,
    future_compatibility_issue_number: authorization.future_compatibility_issue_number,
    consumed_at: "2026-08-24T00:00:00.000Z",
    single_use: true,
  });
  return { authorization, plan, pricing, manifest, shape_records: shapes, report, terminal, artifact_index: index, global_consumption_marker: marker, run_local_consumption_marker: structuredClone(marker) };
}

function buildStoppedCompatibilityBundle(
  source: ReturnType<typeof buildCompatibilityBundle>,
  plan: typeof compatibilityPlan,
  pricing: ReturnType<typeof buildPricing>,
) {
  const bundle = structuredClone(source) as any;
  bundle.shape_records = plan.entries.map((entry, index) => {
    const prior = withoutIntegrity(source.shape_records[index]);
    if (index === 0) {
      const receipt = buildReceipt(
        entry.invocation,
        null,
        pricing.gateway_cost_budget,
        "provider_rejected",
      );
      return sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(
        `stopped-shape-${index}`,
        {
          ...prior,
          terminal_category: "terminal_failure",
          normalized_output: null,
          model_invocation_receipt: receipt,
          receipt_fingerprint: hash(receipt),
          egress_attempted: true,
          provider_calls_used: 1,
          failure_code: "model_gateway_provider_rejected",
        },
      );
    }
    return sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(
      `stopped-shape-${index}`,
      {
        ...prior,
        terminal_category: "not_attempted_after_hard_stop",
        normalized_output: null,
        model_invocation_receipt: null,
        receipt_fingerprint: null,
        egress_attempted: false,
        provider_calls_used: 0,
        failure_code: "cross_case_compatibility_hard_stop",
      },
    );
  });
  bundle.report = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(
    "stopped-report",
    {
      ...withoutIntegrity(source.report),
      completion_status: "not_compatible_or_incomplete",
      attempted_provider_calls: 1,
    },
  );
  bundle.terminal = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(
    "stopped-terminal",
    { report_fingerprint: bundle.report.integrity.fingerprint, terminal: true },
  );
  bundle.artifact_index =
    sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01(
      "stopped-index",
      {
        report_fingerprint: bundle.report.integrity.fingerprint,
        terminal_fingerprint: bundle.terminal.integrity.fingerprint,
        shape_record_count: 6,
      },
    );
  return bundle;
}

function withoutIntegrity(value: any) { const { integrity: _ignored, ...rest } = value; return rest; }
function reseal<T extends { integrity: { fingerprint: string } }>(value: T, changes: Record<string, unknown>): T {
  const payload = { ...withoutIntegrity(value), ...changes };
  return {
    ...payload,
    integrity: { ...value.integrity, fingerprint: hash(payload) },
  } as T;
}
function hash(value: unknown) { return createProtocolSha256V01(canonicalizeProtocolValueV01(value)); }
function readProviderContractFingerprint() { return buildOperationalReentryStaleResetCrossCaseProviderContractV01().integrity.fingerprint; }
function expectThrow(label: string, action: () => unknown) { assert.throws(action); assertions.push(label); }
async function expectReject(label: string, action: () => Promise<unknown>) { await assert.rejects(action); assertions.push(label); }
}

void main();
