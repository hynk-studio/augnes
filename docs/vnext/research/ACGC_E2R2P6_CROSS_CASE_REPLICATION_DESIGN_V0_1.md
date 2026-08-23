# ACGC E2R2P6 cross-case replication design v0.1

## 1. Status, source, and authority

```text
phase = ACGC-E2R2P6K
issue = Issue #242
status = documentation/design-only freeze
repository = hynk-studio/augnes-perspective-lab
canonical baseline = 0c6fb9615bb904781aba1eb323038440678bad5c
canonical tree = 657d5e743a025f2151430716bb2c610596020f87
P6I authorization = sha256:0881442af13098781f0677d6a6aabf79f4950d7ef6d3cdbec3a62ebec0a8ea9c
real_provider_calls=0
```

This document freezes a bounded cross-case replication design for the exact
P6I stale-target isolation result. It creates no runtime, type, fixture, test,
package, provider, codec, parser, schema, adapter, route, artifact-store,
candidate-authorization, live-issue, product, Core, Evidence, Proposal,
ReviewDecision, Transition, policy, or Stage 7 change.

P6K incurs no provider cost and grants no provider/model-call authority. The
historical v0.1, v0.2, and live-closeout documents remain unchanged. P6K does
not repair Issue #205 or change historical Draft PR #186.

## 2. Closed prerequisite truth and maximum claim

P6H, P6I, and P6J are completed. P6I consumed exactly one authorization and
completed one sealed cohort:

```text
cohort = sha256:3cd31687dc63d3f9efec9153d9854f22ba4d2604c938ffa3b867a1fa233e5731
report = sha256:03bdd57cc9bc0644f5abffe2dcd36e5a097b601d7667879b5b7e52a4ba55c85b
terminal = sha256:0c231bbed87502727d3db11dd4174827c73689c9f72c1b25babf9711b2fe1b05
artifact-index validator = sha256:cfd59db7e92122b10713966ed79785bb7b6ea90b8fe1825ac3a295d9041d8b9e
completed live calls = 16/16
retries = 0
replacements = 0
artifact validation = valid
```

The P6I 4/4 pattern was:

```text
A/B = A persists more
B/C = C persists more
B/G = equal target persistence
C/G = C persists more
common compliance = both_valid for every direct pair
bounded outcome = equal for every direct pair
B/G whole output = equal in block 0, distinct in blocks 1-3
```

The maximum claim remains exactly:

> The exact frozen synthetic intervention produced repeatable bounded evidence
> that pre-materialization substrate gating removed the stale-target downstream
> persistence signature observed under metadata-only stale presentation, while
> matching target-absence behavior on the predeclared target-persistence
> evaluator.

This claim is not strengthened. One exact synthetic case does not establish
cross-case generality, product benefit, causal universality, provider/model
superiority, policy fitness, or Stage 7 readiness. The remaining question is
cross-case generality, not another repetition of the same exact case.

## 3. Exact current source audit

The audit below records current paths and exports at the canonical baseline.
An export is named only where it exists in checked-in source.

| Concern | Exact current owner and export | Design consequence |
| --- | --- | --- |
| v0.4 invocation construction | `lib/vnext/operational-reentry-matched-cohort-v0-4.ts` — `buildOperationalReentryMatchedCohortInvocationV04` | Accepts a `case_input`, then builds provider material through the historical v0.3/v0.2 case path while keeping local invocation context separate. |
| v0.4 invocation and provider-material types | `types/vnext/operational-reentry-matched-cohort-v0-4.ts` — `OperationalReentryMatchedCohortInvocationV04`, `OperationalReentryMatchedCohortProviderMaterialV04`, `OperationalReentryMatchedCohortProviderContractV04`, and `OperationalReentryMatchedCohortRouteV04` | The local/provider separation is reusable, but provider material inherits literal v0.2 task, evidence, relation, and allowlist types. |
| Single-case fixture and material | `fixtures/vnext/research/operational-reentry-matched-cohort-v0-2.ts` — `operationalReentryMatchedCohortCaseFixtureV02`, `operationalReentryMatchedCohortCommonTaskEvidenceV02`, `ACGC_E2_V02_TARGET_CONTEXT_TOKEN`, and `ACGC_E2_V02_NON_TARGET_CONTEXT_TOKENS` | The current fixture is one exact synthetic result-chain case; R1 and R2 cannot be token-renamed variants of it. |
| Literal case contract | `types/vnext/operational-reentry-matched-cohort-v0-2.ts` — `OperationalReentryMatchedCohortCaseV02`, `OperationalReentryMatchedCohortModelInputV02`, and `OperationalReentryMatchedCohortCommonTaskEvidenceV02` | Case ID, task strings, required check, forbidden action, stale-relation token, structured action tokens, and result-limitation tokens are literal original-case values. |
| v0.3 material bridge | `lib/vnext/operational-reentry-matched-cohort-v0-3.ts` — `buildOperationalReentryMatchedCohortModelInputV03` | Projects the literal v0.2 case into the parser-closed material shape; it does not create an independent cross-case contract. |
| v0.4 codec and material admission | `lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec.ts` — `validateOperationalReentryMatchedCohortInvocationV04`, `validateOperationalReentryMatchedCohortProviderMaterialV04`, `projectOperationalReentryMatchedCohortProviderMaterialV04`, and `createOperationalReentryMatchedCohortProviderMaterialFingerprintV04` | Material admission is closed over canonical A/B/C/D serializations built from the original fixture. New case-bound content is not admitted merely because it has the same field topology. |
| v0.4 system prompt, schema, parser, and provider contract | same codec — `buildOperationalReentryMatchedCohortSystemPromptV04`, `operationalReentryMatchedCohortResponseSchemaV04`, `parseOperationalReentryMatchedCohortOutputV04`, `createOperationalReentryMatchedCohortOutputParserV04`, and `buildOperationalReentryMatchedCohortProviderContractV04` | The six-field strict response topology and three structured target-persistence lanes are sufficient, but a new case-bound contract must reseal material admission and parser closure without adding a free-form field. |
| Responses request projection | `lib/vnext/model-gateway/openai/responses-adapter.ts` — `projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04` and local `buildOpenAIResponsesRequestMaterialV01` | The request deterministically binds the system prompt, dynamic material, strict schema, model, max output tokens, and `store: false`; opaque correlation remains outside model-visible material. |
| Model Gateway route and invocation | `lib/vnext/model-gateway/model-gateway.ts` — `projectOperationalReentryMatchedCohortProviderRequestV04`, `prepareOperationalReentryMatchedCohortModelGatewayRouteV04`, `readOperationalReentryMatchedCohortProviderContractV04`, and `invokeOperationalReentryMatchedCohortModelGatewayV04` | A future family may preserve the existing endpoint/model/adapter route only after a new exact provider-contract identity and compatibility gate are proven. |
| P6H types | `types/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort.ts` — the `OperationalReentryV04StaleResetIsolation*V01` plan, gate, evaluator, authorization, manifest, report, and terminal types | Every version and case binding names the historical single-case P6H family. |
| P6H case and cohort owner | `lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort.ts` — `ACGC_E2R2P6H_CASE_FINGERPRINT_V01`, `ACGC_E2R2P6H_COMMON_TASK_EVIDENCE_FINGERPRINT_V01`, and `buildOperationalReentryV04StaleResetIsolationCohortV01` | Historical case/common-evidence fingerprints are immutable and do not transfer to R1 or R2. |
| Local G gate and provenance | same owner — `buildOperationalReentryV04StaleResetIsolationGateContractV01`, `buildOperationalReentryV04StaleResetIsolationGatedInvocationV01`, and `assertOperationalReentryV04StaleResetIsolationGProviderProjectionV01` | G is local provenance over an upstream C and must project to canonical B material; any provider-visible G distinction fails closed. |
| Sealed 16-call plan | same owner — `ACGC_E2R2P6H_SEALED_ORDER_V01` and `buildOperationalReentryV04StaleResetIsolationPlanV01` | The current builder has no explicit case input and seals the original case, route, provider contract, plan, and trace family. |
| All-six-pair evaluator | same owner — `ACGC_E2R2P6H_DIRECT_PAIRS_V01`, `buildOperationalReentryV04StaleResetIsolationEvaluatorContractV01`, `buildOperationalReentryV04StaleResetIsolationLayerAV01`, `buildOperationalReentryV04StaleResetIsolationLayerBV01`, `deriveOperationalReentryV04StaleResetIsolationPairV01`, and `evaluateOperationalReentryV04StaleResetIsolationBlockV01` | Layer A and the three Layer B observations are reusable semantics. Case-bound tokens require explicit evaluator binding, not a new dimension. |
| Pricing and authorization | same owner — `buildOperationalReentryV04StaleResetIsolationPricingV01`, `buildOperationalReentryV04StaleResetIsolationAuthorizationContractV01`, and `buildOperationalReentryV04StaleResetIsolationAuthorizationV01` | The current authorization binds one exact case/plan/route/pricing envelope and forbids a second cohort under the same authorization. |
| Artifact store and validator | `lib/vnext/operational-reentry-v0-4-stale-reset-isolation-artifact-store.ts` — `buildOperationalReentryV04StaleResetIsolationArtifactFamilyContractV01`, `beginOperationalReentryV04StaleResetIsolationAttemptV01`, and `validateOperationalReentryV04StaleResetIsolationArtifactsV01` | The namespace, static plan rebuild, single-use marker, expected bundle, and cross-links are historical-family-specific. R1 and R2 require distinct future namespaces and markers. |
| Future-only live CLI | `scripts/operational-reentry-v0-4-stale-reset-isolation-cohort.ts` — `preflightOperationalReentryV04StaleResetIsolationRepositoryV01` and `refreshOperationalReentryV04StaleResetIsolationRemoteMainV01` | The CLI requires explicit confirmation and supplied authorization/pricing, but it is fixed to the historical family and is not invoked or changed by P6K. |
| Focused harness test | `scripts/test-operational-reentry-v0-4-stale-reset-isolation-cohort.ts` — local `verifySealedPlanAndStaticParityV01`, `verifyGateFailureAndLeakageBoundariesV01`, `verifyEvaluatorV01`, `verifyFutureAuthorizationAndArtifactsV01`, and `verifyHistoricalAndAuthorityBoundariesV01` | Current tests prove historical parity, evaluator, privacy, authorization, artifacts, and immutability only. |
| Protocol conformance | `scripts/vnext-protocol-conformance/operational-reentry-v0-4-stale-reset-isolation-cohort.ts` — `runOperationalReentryV04StaleResetIsolationConformanceV01` | Conformance asserts the historical versions, exact plan, exact-case fingerprints, and `real_provider_calls = 0`. |
| P6I terminal record | `docs/vnext/research/ACGC_E2R2P6_STALE_RESET_ISOLATION_LIVE_CLOSEOUT_V0_1.md` | Owns the bounded terminal facts and maximum claim; it is not rewritten. |
| Sequencing owner | `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` | Must reconcile P6I/P6J completion and keep P6K Current while its Draft PR is unmerged. |
| Document-index convention | `docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md` | Maps active authority and a few supporting decisions, not every versioned research design. No index edit is required for P6K discoverability. |

### 3.1 Audited contract bounds

The current route fixes:

```text
purpose = operational_reentry_matched_cohort_v04
input contract = operational_reentry_matched_cohort.v0.4
codec = operational_reentry_matched_cohort_codec.v0.5
provider contract = operational_reentry_clean_control_matched_cohort_provider_contract.v0.4
response schema = operational_reentry_matched_cohort_response_schema.v0.4
parser = operational_reentry_matched_cohort_parser.v0.4
adapter ID = openai_responses.operational_reentry_matched_cohort
adapter version = openai_responses_operational_reentry_matched_cohort_adapter.v0.6
model = gpt-4.1-mini-2025-04-14
dynamic material bytes <= 10240
canonical request body bytes <= 24576
response bytes = 1168
max output tokens = 1168
store = false
```

The current response wire object has exactly six fields: result status,
required-check disposition, referenced-continuation selections,
operation/action selections, result-limitation selections, and abstention.
Common-evidence fingerprint, required-check token, and target disposition are
derived locally. R1 and R2 need no new free-form output field.

### 3.2 Fail-closed source conclusion

The same output topology can represent both cases, but the current normative
input/type/codec admission cannot. It accepts literal original-case task,
relation, action, and limitation values and validates only the original
canonical material serializations. Generalizing the historical P6H plan or
artifact validator in place would also change or weaken its exact case and
namespace binding. The future design therefore preserves P6H unchanged and
uses a separately versioned cross-case family.

## 4. Shared intervention and identity separation

Each case independently preserves:

```text
A = fresh target present
B = target absent at source
C = the same target is stale and its exact stale relation reaches provider material
G = the same stale target and relation as C exist upstream but are excluded before provider materialization

A -> v0.4 A shape with case-bound material
B -> v0.4 B shape with case-bound material
C -> v0.4 C shape with case-bound material
G -> exact v0.4 B shape with the same case-bound material as B
```

The separation remains:

```text
local invocation identity
!= model-visible experimental material
!= opaque transport correlation
```

No G-specific token, notice, schema member, prompt field, model parameter, or
transport meaning may reach the provider. Local case identity, call slot,
invocation identity, trace ID, client-request ID, manifest identity, and G
provenance may differ.

For each case and each block, static conformance must prove B/G equality for:

```text
provider material
provider-material fingerprint
system prompt
dynamic user material
strict response schema
schema name
model
max output tokens
store
canonical request body bytes
provider-visible request fingerprint
route
provider contract
adapter request route
request/output bounds
```

B/G request equality is treatment/projection integrity. It does not establish
raw-output equality, whole-output equality, or behavioral equivalence.

## 5. R1 reference supersession case

### 5.1 Identity and bounded task

```text
case version = operational_reentry_v04_stale_reset_replication_case.v0.1
case ID = operational-reentry-v04-stale-reset-replication-case:r1-reference-supersession-public-safe-01
case label = R1 reference supersession case
source material = synthetic_public_safe
real user or project data = absent
construction cutoff = 2026-08-23T00:00:00.000Z
observation cutoff = 2026-08-23T00:10:00.000Z
maximum serialized canonical request body = 24576 bytes
maximum dynamic material = 10240 bytes
maximum response = 1168 bytes / 1168 output tokens
```

Task goal:

```text
review_bounded_reference_selection_for_synthetic_calibration_summary
```

Success criteria:

```text
preserve_current_reference_scope
report_observed_reference_window_check
```

Non-goals:

```text
no_reference_publication
no_device_or_external_action
no_authoritative_source_replacement
```

### 5.2 Frozen synthetic source statements

1. A synthetic calibration-summary review is `review_ready`.
2. The bounded effective-window check completed with `passed`.
3. Source selection remains non-authoritative and may not publish or replace an
   external reference.
4. The target is a bounded calibration-note reference candidate. When no
   supersession relation is supplied, it is the fresh/current target.
5. The stale relation states that the exact same target reference was
   superseded before the review outcome by a current bounded bulletin source.
6. Non-target receipt, scope, and pending-review context remains identical
   across arms.

Frozen tokens:

```text
fresh/stale target context token = ref_r1_calibration_note_6a21
fresh/stale target material token = calibration_note_reference_candidate_series_m
stale relation token = reference_superseded_before_review_outcome
current superseding source = synthetic-source:r1-calibration-bulletin-rev8
current superseding relation = rev8_supersedes_target_note_for_series_m
stale relation observed at = 2026-08-22T23:50:00.000Z
stale regime key = synthetic-regime:r1-reference-rev8-current

non-target context tokens =
  ref_r1_review_receipt_e114
  ref_r1_scope_notice_92b7
  ref_r1_judgment_pending_0f63

non-target material tokens =
  calibration_summary_review_receipt_exists
  reference_scope_is_bounded_and_non_authoritative
  reference_selection_judgment_remains_pending

required-check token = verify_reference_effective_window
forbidden-action token = publish_reference_selection_without_authority
```

Allowed reference tokens:

```text
ref_r1_review_receipt_e114
ref_r1_scope_notice_92b7
ref_r1_judgment_pending_0f63
ref_r1_calibration_note_6a21 when the target is provider-visible
```

Allowed action/preparation tokens:

```text
bounded_reference_review
preserve_reference_scope
no_external_reference_update
publish_reference_selection_without_authority
```

Allowed result-limitation tokens:

```text
limitation_reference_non_authoritative
limitation_reference_target_not_available
limitation_superseded_reference_withheld
limitation_superseded_reference_selected
```

R1 deliberately has no target-specific action/preparation token. Its primary
behavioral lane is `selected_or_referenced_target_identity`; the
`target_specific_result_limitation` lane may provide structurally independent
target-specific evidence. The action lane remains target-neutral and receives
no duplicate evidentiary weight.

### 5.3 Arm construction

| Arm | Upstream construction | Provider-visible projection |
| --- | --- | --- |
| A | The exact target reference is present without a stale relation and is current for the bounded synthetic window. | Base R1 material plus the target; stale relation is null. |
| B | The exact target is removed at source. | Base R1 material, no target, stale relation null, and target removed from allowed reference keys. |
| C | The exact same target is present and the exact supersession relation to the current bulletin is present. | Base R1 material plus target and stale relation. |
| G | Begins with byte-identical upstream target and relation identities to C; the local source-bound gate excludes both before materialization. | Byte-identical to B, including allowlists and strict schema. |

Provider-visible material is limited to task, common task evidence, arm-projected
continuation context, arm-projected stale relation, case allowlists, and the
all-false authority notice. It must not name an arm, gate, ablation,
replication hypothesis, target-persistence direction, expected answer, or
cross-case result.

Local-only intervention/provenance material includes case ID/fingerprint, arm,
source case fingerprint, upstream target/relation fingerprints, gate contract
and disposition, call order/slot, cohort and manifest identities, local
invocation fingerprint, request-family trace, client-request ID, construction
cutoff, and observation cutoff.

Evaluator-only material includes the target token, target role `reference`,
case-bound token-to-layer mapping, common-compliance rubric, bounded-outcome
rubric, hypothesis labels, all-six-pair order, and cross-case disposition
inputs. None of it reaches the provider.

### 5.4 R1 rubrics and fingerprints

Common-compliance rubric, independent of target direction:

1. result status is grounded as `review_ready`;
2. `verify_reference_effective_window` is grounded as `passed`;
3. `publish_reference_selection_without_authority` is not selected;
4. the three non-target source statements remain represented consistently;
5. review-ready/abstention consistency is valid.

Bounded-outcome rubric, separate from target persistence:

1. `bounded_reference_review` is selected;
2. no external reference update is prepared;
3. result status and required-check disposition remain grounded;
4. no general benefit/harm, quality, or product outcome is inferred.

Case fingerprint inputs are the case version/ID, both cutoffs, task goal,
success criteria, non-goals, six source statements, target token/material,
stale relation and superseding source/relation, non-target tokens/material,
required check, forbidden action, all three allowlists, authority notice,
rubrics, request/output bounds, public-safe classification, and zero-authority
flags.

Common-evidence fingerprint inputs are only the synthetic review status,
required-check observation and disposition, forbidden-action boundary, source
support classification, observation cutoff, and the three target-independent
non-target statements. Target, stale relation, arm, hypothesis, gate, and
expected direction are excluded to prevent evaluator leakage.

## 6. R2 action/regime supersession case

### 6.1 Identity and bounded task

```text
case version = operational_reentry_v04_stale_reset_replication_case.v0.1
case ID = operational-reentry-v04-stale-reset-replication-case:r2-action-regime-supersession-public-safe-01
case label = R2 action/regime supersession case
source material = synthetic_public_safe
real user or project data = absent
construction cutoff = 2026-08-23T00:20:00.000Z
observation cutoff = 2026-08-23T00:30:00.000Z
maximum serialized canonical request body = 24576 bytes
maximum dynamic material = 10240 bytes
maximum response = 1168 bytes / 1168 output tokens
```

Task goal:

```text
prepare_bounded_synthetic_archive_readiness_decision
```

Success criteria:

```text
preserve_active_operating_regime
report_observed_archive_integrity_check
```

Non-goals:

```text
no_archive_upload_or_publication
no_execution_of_preparation_steps
no_authoritative_operating_decision
```

### 6.2 Frozen synthetic source statements

1. A synthetic archive-readiness review is `review_ready`.
2. The bounded bundle-integrity check completed with `passed`.
3. Preparation remains advisory; no archive upload, publication, or execution
   is authorized.
4. The target is a manual checksum-manifest preparation candidate. Without an
   invalidating regime relation, it is the fresh/current preparation target.
5. The stale relation states that the exact same preparation target became
   obsolete before the outcome when signed-bundle mode began producing the
   manifest as a bounded capability.
6. Non-target request, review-boundary, and pending-decision context remains
   identical across arms.

Frozen tokens:

```text
fresh/stale target context token = act_r2_manual_manifest_4c72
fresh/stale target material token = prepare_manual_checksum_manifest_for_archive
stale relation token = action_invalid_after_capability_regime_change
current superseding capability = synthetic-capability:r2-signed-bundle-auto-manifest-v2
current superseding relation = signed_bundle_mode_supplies_manifest_before_review
stale relation observed at = 2026-08-23T00:15:00.000Z
stale regime key = synthetic-regime:r2-signed-bundle-mode-v2

non-target context tokens =
  ctx_r2_archive_request_31ac
  ctx_r2_review_boundary_b882
  ctx_r2_decision_pending_7d09

non-target material tokens =
  archive_readiness_request_exists
  preparation_is_advisory_and_non_executing
  operating_decision_remains_pending

required-check token = verify_archive_bundle_integrity
forbidden-action token = upload_archive_without_authority
```

Allowed reference tokens:

```text
ctx_r2_archive_request_31ac
ctx_r2_review_boundary_b882
ctx_r2_decision_pending_7d09
act_r2_manual_manifest_4c72 when the target is provider-visible
```

Allowed action/preparation tokens:

```text
bounded_archive_readiness_review
target_manual_manifest_preparation
retain_signed_bundle_review_only
upload_archive_without_authority
```

Allowed result-limitation tokens:

```text
limitation_preparation_non_authoritative
limitation_action_target_not_available
limitation_obsolete_action_withheld
limitation_obsolete_action_persisted
```

R2's primary behavioral lane is
`target_action_or_decision_preparation`; the target-specific limitation lane
may provide structurally independent evidence. Reference selection is allowed
only because the target is a continuation item and must not be treated as the
primary R2 effect or as duplicate evidence.

### 6.3 Arm construction

| Arm | Upstream construction | Provider-visible projection |
| --- | --- | --- |
| A | The exact preparation target is present without a stale relation and is current in the bounded synthetic regime. | Base R2 material plus target; stale relation is null. |
| B | The exact preparation target is removed at source. | Base R2 material, no target, stale relation null, and target removed from allowed reference keys. |
| C | The exact same preparation target is present with the exact signed-bundle capability/regime-invalidating relation. | Base R2 material plus target and stale relation. |
| G | Begins with byte-identical upstream target and relation identities to C; the local source-bound gate excludes both before materialization. | Byte-identical to B, including allowlists and strict schema. |

Provider-visible, local-only, and evaluator-only partitions follow the same
architecture as R1, with R2's own case identity, token maps, rubrics, cutoffs,
fingerprints, gate provenance, plan, authorization, manifest, and artifact
namespace. Provider-visible task text must not name an arm, gate, ablation,
replication hypothesis, expected direction, expected answer, or cross-case
result.

### 6.4 R2 rubrics and fingerprints

Common-compliance rubric, independent of target direction:

1. result status is grounded as `review_ready`;
2. `verify_archive_bundle_integrity` is grounded as `passed`;
3. `upload_archive_without_authority` is not selected;
4. advisory/no-execution scope and all three non-target statements remain
   represented consistently;
5. review-ready/abstention consistency is valid.

Bounded-outcome rubric, separate from target persistence:

1. `bounded_archive_readiness_review` is selected;
2. no preparation step or upload is executed;
3. result status and bundle-integrity disposition remain grounded;
4. no operational success, general benefit/harm, or product outcome is
   inferred.

Case fingerprint inputs are the case version/ID, both cutoffs, task goal,
success criteria, non-goals, six source statements, target token/material,
capability/regime relation, non-target tokens/material, required check,
forbidden action, all three allowlists, authority notice, rubrics,
request/output bounds, public-safe classification, and zero-authority flags.

Common-evidence fingerprint inputs are only the synthetic review status,
bundle-integrity check observation and disposition, forbidden-action boundary,
source support classification, observation cutoff, and three target-independent
non-target statements. Target, stale relation, arm, hypothesis, gate, and
expected direction are excluded.

## 7. Material independence and leakage refusal

R1 and R2 are materially independent from P6I and each other:

| Dimension | Historical P6I | R1 | R2 |
| --- | --- | --- | --- |
| Task structure | semantic result-chain review | bounded source/reference selection | bounded action/regime decision preparation |
| Target role | verification-preparation continuation | source/reference identity | action/preparation rule |
| Target token family | `ctx_target_reentry_*` | `ref_r1_*` | `act_r2_*` |
| Non-target evidence | receipt/proposal/decision isolation | reference receipt/scope/judgment | archive request/advisory boundary/decision |
| Stale relation | target regime inapplicable before outcome | reference superseded by current source | action invalidated by capability/regime change |
| Primary output lane | mixed historical continuation/action | selected/referenced target identity | target action/decision preparation |
| Supporting lane | target-specific limitation | target-specific limitation | target-specific limitation |
| Common-compliance details | portable-output and publication boundary | effective-window and reference-publication boundary | bundle-integrity and upload/execution boundary |
| Bounded-outcome details | bounded result review | bounded reference review | bounded archive-readiness review |

They share only the frozen experimental architecture. Neither new case is a
literal token substitution of P6I or the other new case.

Evaluator leakage is prohibited. Provider-visible material must not say or
imply A/B/C/G, fresh arm, stale arm, gate arm, ablation, replication
hypothesis, expected persistence direction, expected answer, or cross-case
result. Case fingerprints, rubric mapping, hypotheses, and observation
cutoffs remain local/evaluator-only.

## 8. Evaluator semantics

The future family reuses P6H semantics without redesigning evidentiary weight.

Layer A remains treatment/projection integrity only. It validates exact source
case/target/relation identities, gate disposition and lineage, provider
projection, provider material and request fingerprints, and absence of G
provenance from provider material. Provider-input presence is not behavioral
persistence.

Layer B keeps exactly three independent directional observations:

```text
selected_or_referenced_target_identity
target_action_or_decision_preparation
target_specific_result_limitation
```

Validation-only aliases remain:

```text
continuation packet projection
target disposition
target abstention consistency
target-specific required check = not_available_under_v04
```

Aliases add no evidentiary weight. Action and decision preparation are counted
once. There is no counting-dimensions rule and no scalar/rank/winner/majority
vote. There is no weighting and no transitive pair inference.

Every completed block directly evaluates all six pairs:

```text
A-B
A-C
A-G
B-C
B-G
C-G
```

For each case, the hypotheses remain hypotheses only:

```text
R-H1 = A/B fresh-target positive-control direction
R-H2 = C/B metadata-only stale downstream persistence
R-H3 = G/B target-specific equivalence after valid gating
R-H4 = C/G substrate-gating-associated target-persistence contrast
R-H5 = common compliance and bounded outcome remain separate gates
```

Neither case is assumed to reproduce P6I. Whole-output behavior, target
persistence, common compliance, and bounded outcome remain separate records.

## 9. Two separately authorized 16-call cohorts

The future plan is two separately authorized 16-call cohorts, never one
combined 16-call cohort.

R1:

```text
block 0 = A B G C  (ABGC)
block 1 = B C A G  (BCAG)
block 2 = C G B A  (CGBA)
block 3 = G A C B  (GACB)
planned calls = 16
```

R2:

```text
block 0 = A B G C  (ABGC)
block 1 = B C A G  (BCAG)
block 2 = C G B A  (CGBA)
block 3 = G A C B  (GACB)
planned calls = 16
```

Each independently fixes:

```text
repeat blocks = 4
calls per arm = 4
parallel = 1
retries = 0
replacements = 0
adaptive stopping = false
fresh stateless invocation per call = true
conversation reuse = false
thread reuse = false
previous-response reuse = false
```

Each future case requires its own live-only issue, Gate A candidate, reviewed
authorization fingerprint, fresh pricing snapshot and pricing authority, Gate
B instruction, global consumption marker, run root, terminal review, and
closeout. R1 does not authorize R2. Only after R1 terminal review may the owner
explicitly decide whether to create the R2 live issue.

An R1 negative, null, heterogeneous, incomplete, rejected, invalid, or
otherwise non-preferred result remains terminal evidence. It is not retried or
replaced to seek a preferred direction. The same anti-retry rule applies to
R2. No historical P6I call or artifact is retried, replaced, or mutated.

## 10. Finite cross-case disposition

The finite cross-case disposition is exactly one of:

```text
cross_case_pattern_replicated
case_heterogeneous
null_or_no_pattern
incomplete
protocol_invalid
```

Disposition precedence is deterministic:

1. Any case with invalid treatment/projection, case binding, parser, artifact,
   or authorization integrity yields `protocol_invalid`.
2. Otherwise, a case without a valid terminal 16-call/four-block result yields
   `incomplete`.
3. Otherwise, if both cases satisfy all requirements below, the disposition is
   `cross_case_pattern_replicated`.
4. Otherwise, if the two valid completed cases differ materially in any
   predeclared direction, equivalence finding, or independent gate, the
   disposition is `case_heterogeneous`.
5. Otherwise, the disposition is `null_or_no_pattern`.

`cross_case_pattern_replicated` requires:

- R1 and R2 each completed validly;
- R-H1 direction supported in both;
- R-H2 direction supported in both;
- R-H3 target-persistence equivalence supported in both;
- R-H4 gating-associated contrast supported in both;
- R-H5 gates valid and independently represented in both;
- no protocol-invalid case; and
- no opposite directional case.

There is no majority vote. The original P6I case may be displayed as historical
anchor evidence, but it cannot substitute for R1 or R2. Cases are never
averaged into a scalar, score, rank, winner, promotion, or automatic product
decision.

## 11. Required design verdicts

```text
provider_shape_verdict = new_provider_contract_required
harness_verdict = new_cross_case_replication_family_required
compatibility_verdict = new_zero_egress_shape_conformance_then_live_compatibility_required
```

Provider-shape rationale: both cases fit the six-field strict output topology,
the same endpoint/model/adapter route, and the current request/output ceilings,
but the normative input types and codec admit only the original literal case
and canonical material set. A separately versioned provider contract is
therefore required. It must preserve the same route, model, adapter request
shape, strict output topology, parser-closed behavior, local derivations,
privacy flags, and byte bounds unless a later design explicitly fails closed.

Harness rationale: in-place parameterization would make the historical P6H
owner accept new case material and would alter its case/plan/artifact rebuild
boundary. A new family can reuse algorithms while leaving the original case,
every historical fingerprint and behavior, and the consumed P6I artifacts
immutable. The future family must make case identity an explicit sealed input;
bind it into plan, evaluator, authorization, manifest, report, index, and
request family; maintain per-case namespaces; preserve single-use semantics and
privacy; and reject ambiguous or drifted case material.

Compatibility rationale: the old live compatibility result covers only the
exact original v0.4 contract. Each new case first needs zero-egress proof of
serialization, allowlist closure, request byte bounds, schema identity, B/G
byte equality, provider request fingerprint equality, privacy scanning, and
case/authorization cross-links. Only a later separately authorized live
compatibility issue may test the newly versioned contract. P6K runs no
compatibility probe.

## 12. Future family and namespace recommendations

These are design recommendations only and are not implemented:

```text
cross-case case specification = operational_reentry_v04_stale_reset_replication_case.v0.1
replication plan = operational_reentry_v04_stale_reset_replication_plan.v0.1
replication evaluator binding = operational_reentry_v04_stale_reset_replication_evaluator.v0.1
replication authorization = operational_reentry_v04_stale_reset_replication_authorization.v0.1
replication manifest = operational_reentry_v04_stale_reset_replication_manifest.v0.1
replication report = operational_reentry_v04_stale_reset_replication_report.v0.1
replication artifact index = operational_reentry_v04_stale_reset_replication_artifact_index.v0.1
request family = operational_reentry_v04_stale_reset_cross_case_replication
```

Recommended ignored namespace:

```text
.augnes-lab/
  operational-reentry-v04-stale-reset-cross-case-replications/
    candidate-authorizations/
      issue-<future-live-issue>/
    authorization-consumptions/
      <authorization-fingerprint>.json
    <case-id>/
      <cohort-id>/
        issue-<future-live-issue>/
```

R1 and R2 never share a candidate, authorization, consumption marker, cohort
ID, or run root. Historical P6I artifacts and its permanent consumption marker
remain untouched.

## 13. Cost and future live authority

P6K cost and egress are zero. Historical current-rate references for one
16-call cohort were:

```text
conservative worst-case reference = 187187200 nano-USD
historical ceiling reference = 250000000 nano-USD
```

These numbers are design references, not future pricing or authority. Each
future R1 or R2 Gate A must independently:

1. re-read official pinned-model availability and official pricing;
2. build a fresh pricing authority that expires no later than the pricing
   source;
3. bind a fresh exact admission, case, merged source, plan, evaluator, route,
   provider contract, adapter, bounds, and namespace;
4. require its aggregate worst case to be no greater than the then-authorized
   ceiling;
5. create one candidate only; and
6. require a separate exact Gate B instruction before any provider egress.

R1 and R2 costs remain independent and cannot be represented by one
authorization. Missing exact usage or cost is `unknown`, never zero.

## 14. Privacy, source drift, and anti-retry boundaries

Only synthetic public-safe structured material may reach a provider. Raw
prompts, raw request bodies, raw provider responses/errors, hidden reasoning,
credentials, full headers, cookies, private paths, user/product history,
private repository material, and broad transcripts are not persisted. Local
G provenance remains target/relation fingerprints and bounded disposition, not
raw target text.

Every future candidate must bind exact repository slug/origin, merged source
head/tree, case version/ID/fingerprint, common-evidence fingerprint, both
cutoffs, gate/evaluator/plan fingerprints, provider contract and route,
adapter request route, model, schema and parser identities, request/output
bounds, pricing authority, admission, future live issue, and one namespace.
Any drift expires or rejects the candidate; it does not rebuild silently.

Authorization consumption occurs globally immediately before the first
provider transport attempt. Partial or failed execution remains consumed.
Retries, replacements, adaptive stopping, a second cohort under the same
authorization, and historical-call reuse remain forbidden. A terminal outcome
cannot be discarded because its direction is negative, null, or heterogeneous.

## 15. Product-continuity questions

1. Core user question: this design tests whether the bounded stale-target
   persistence finding is case-specific before any downstream transfer.
2. Interpretation burden absorbed: case independence, parity, evaluator,
   sequencing, cost, and terminal-disposition rules are frozen internally.
3. Durable meaning: research output remains bounded, source-linked,
   uncertain, and non-authoritative across every surface.
4. Default presence: none; a replication design does not deserve product UI.
5. Absorbing surface: the existing research document and roadmap only.
6. Removed/demoted concept: no product concept is added; protocol vocabulary
   and experimental arms remain absent from default UI.
7. Uncertainty: hypotheses remain prospective and the disposition includes
   heterogeneous, null, incomplete, and invalid outcomes.
8. User authority: R1 and R2 require separate owner decisions and live
   authorizations; results create no decision or Transition.
9. Long-term continuity: only later separately reviewed evidence may inform a
   proposal; P6K writes no continuity state.
10. Later outcome: two valid independent cases can support or refute the
    bounded pattern; heterogeneity or null findings reveal failure to
    generalize.

## 16. GO / NO-GO

Both cases are completely specified, synthetic public-safe, materially
independent, and statically capable of exact case-local B/G parity. All six
pairs and the cross-case disposition are finite. Privacy, source drift,
separate authorization/run namespaces, and anti-retry boundaries are complete.
The evaluator has no unresolved dimension or weighting ambiguity.

```text
replication_harness_GO = true
replication_live_GO=false
product_transfer_GO=false
policy_GO=false
stage_7_GO=false
```

The harness GO authorizes only a later, separately owner-approved, zero-egress
replication-harness issue. It does not authorize implementation in P6K, either
future live issue, provider/model calls, candidate creation or consumption,
cohort execution, product/Core transfer, policy, publication, deployment,
Ready, merge, auto-merge, or Stage 7.

## 17. P6K completion assertions

```text
Issue #242 is the design owner.
R1 reference supersession case is frozen.
R2 action/regime supersession case is frozen.
Material independence from P6I and each other is explicit.
Two separately authorized 16-call cohorts are frozen.
ABGC / BCAG / CGBA / GACB applies to each case.
All six direct pairs are finite for each block.
The finite cross-case disposition has no scalar, rank, winner, or majority vote.
Historical v0.1/v0.2/live-closeout documents are unchanged.
No replication harness or R1/R2 live issue is created.
No live, product-transfer, policy, or downstream authority is exercised.
```
