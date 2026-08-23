# ACGC E2R2P6 Stale-Reset Isolation Design v0.2

## 1. Status and authority

```text
Status: zero-egress design freeze
Repository: hynk-studio/augnes-perspective-lab
Exact audited source: 9ff7edaff3dd09fc36ee3b74b8a241cac6c9e2f0
Exact audited tree: 19baea2d8f05854d8a5e381c75012654eb477001
Issue: #235
Design family: ACGC-E2R2P6F
P6H harness implementation authority: none
Live-provider authority: none
Policy authority: none
Stage 7 authority: none
```

This document resolves the historical v0.3 P6A design blocker against the
merged, compatibility-established v0.4 identity-separated provider contract.
It is subordinate to the canonical documentation owners and to the current
source owners cited below. Historical
`ACGC_E2R2P6_STALE_RESET_ISOLATION_DESIGN_V0_1.md` remains immutable v0.3
design truth: provider-visible `invocation_context` prevented exact distinct-call
B/G request equality at that version.

This phase creates no harness, provider call, authorization, candidate, live
cohort, compatibility probe, artifact, policy, or Stage 7 authority. It made
`real_provider_calls = 0`. Its verdict is design review material, not a
behavioral result or approval.

## 2. Exact v0.4 contract and bounded compatibility gate

The audited provider contract is fixed as follows:

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
responseBytes = 1168
maxOutputTokens = 1168
final request bytes = 24576
parser closure = 172032
```

Exact fixed identities are:

```text
case = sha256:d702283dae6d9cfe586a3b7fd91893aee2720a3f136a027c321c3ecfa9d7fa4b
common evidence = sha256:455cb74df26f63eccd15952a98433cba7f410a9e8b312afe5d35d4ceb235f38d
route = sha256:1d53d6d1b8ae9480542284718e662cb164cfb49284d6be20230b233c5d1d625f
provider contract = sha256:1ca7da7cf3870de67fdbe36f1a6bf9d67a3a50accbd8f7daf147e424901eda52
adapter request route = sha256:7418f3ace51f53a8089c33392dc00d697f21ab383a4c4442fc4ffdc39efea0fa
```

The canonical separation is:

```text
local invocation identity
!= model-visible experimental material
!= opaque transport correlation
```

Issue #232 established provider-contract compatibility for this exact contract
only. Its one consumed authorization ended `accepted_all_shapes` in canonical
order A -> B -> C -> D, with planned / attempted / accepted-normalized calls
`4 / 4 / 4` and retry / replacement `0 / 0`:

```text
authorization = sha256:551ef92612c1e0a1faaaac8aabd3d51b14931991a8858e99cae1de26413fff26
probe = sha256:a061e29744933d1e6cf3bc38cc3175b8176a12b2972806c44d8c890f36dedee0
report = sha256:f0f3f14dcc4b435a9943644e7add5eed25700fed0e2a013bf620683a62616e28
artifact index = sha256:46e527f262f2d6839ed0183cabafa1a1f8b9b9a1b9be808eeb8f8706c478cfca
```

Those normalized outputs are compatibility evidence only. They are not reused
as behavioral data or Evidence and establish no conditioning, reset, stale
relinquishment, benefit, causal contribution, rank, winner, policy fitness, or
Stage 7 readiness.

## 3. Exact current source owners

| Concern | Current path and exact export | Design implication |
|---|---|---|
| v0.4 invocation construction | `lib/vnext/operational-reentry-matched-cohort-v0-4.ts` — `buildOperationalReentryMatchedCohortInvocationV04` | A/B/C/D provider material is built separately from local cohort, call-slot, and block identity. |
| v0.4 invocation and provider-material types | `types/vnext/operational-reentry-matched-cohort-v0-4.ts` — `OperationalReentryMatchedCohortInvocationV04` and `OperationalReentryMatchedCohortProviderMaterialV04` | Local invocation identity and provider material are structurally separate. |
| Provider-material validation and projection | `lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec.ts` — `validateOperationalReentryMatchedCohortProviderMaterialV04` and `projectOperationalReentryMatchedCohortProviderMaterialV04` | Only exact A/B/C/D material is admitted; G must not be a fifth wire shape. |
| Invocation validation and identity fingerprints | same codec — `validateOperationalReentryMatchedCohortInvocationV04`, `createOperationalReentryMatchedCohortLocalInvocationIdentityFingerprintV04`, and `createOperationalReentryMatchedCohortProviderMaterialFingerprintV04` | Local and provider identities can be checked independently. |
| Response schema | same codec — `operationalReentryMatchedCohortResponseSchemaV04` | The current strict structured-output dimensions remain unchanged. |
| Parser | same codec — `parseOperationalReentryMatchedCohortOutputV04` and `createOperationalReentryMatchedCohortOutputParserV04` | Normalization and local target-disposition derivation remain unchanged. |
| Provider contract | same codec — `buildOperationalReentryMatchedCohortProviderContractV04` | Privacy, parser closure, and exact v0.4 contract bounds remain fixed. |
| Shared Responses adapter | `lib/vnext/model-gateway/openai/responses-adapter.ts` — `projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04` and local `buildOpenAIResponsesRequestMaterialV01` | The JSON body is a deterministic projection of provider material, model, system prompt, schema, max tokens, and `store: false`; local IDs are absent. |
| Model Gateway route | `lib/vnext/model-gateway/model-gateway.ts` — `projectOperationalReentryMatchedCohortProviderRequestV04`, `prepareOperationalReentryMatchedCohortModelGatewayRouteV04`, and `invokeOperationalReentryMatchedCohortModelGatewayV04` | The existing exact route can carry a G call only as canonical B provider material. |
| P6C identity-separation witness | `lib/vnext/operational-reentry-v0-4-provider-compatibility-probe.ts` — `buildOperationalReentryV04ProviderCompatibilityProbeRepresentativeShapePlanV01` | Its twin-B witness proves distinct local invocation, trace, and client IDs with equal provider material, JSON request body, and request fingerprint. |
| P6D compatibility lineage | same P6C owner — `validateOperationalReentryV04ProviderCompatibilityProbeExecutionResultV01`; `lib/vnext/operational-reentry-v0-4-provider-compatibility-probe-artifact-store.ts` — `validateOperationalReentryV04ProviderCompatibilityProbeArtifactsV01` | Issue #232 is a bounded compatibility gate for exact v0.4 shapes, not behavioral evidence. |
| P5 sealed plan | `lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts` — `buildOperationalReentryParserClosedCleanControlCohortPlanV01` | The balanced 16-call, sequential, no-retry/no-replacement envelope is reusable as a design pattern, not as an authorization or identity. |
| P5 evaluator bridge | same owner — `buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01` and `projectOperationalReentryParserClosedCleanControlEvaluatorInputV01` | Current structured v0.3 outputs bridge to the canonical v0.2 evaluator, but the fixed A/B/C/D family cannot be relabeled as A/B/C/G. |
| E1 conditioning/reset | `lib/vnext/operational-reentry-perturbation.ts` — `buildOperationalReentryEvaluationV01`; `types/vnext/operational-reentry-perturbation.ts` — `OperationalReentryDownstreamVectorV01` | Existing finite identity, reference, check, operation, limitation, and response fields support bounded conditioning/reset relations. |
| Common-compliance evaluator | `lib/vnext/operational-reentry-matched-cohort-v0-2.ts` — `evaluateOperationalReentryMatchedCohortArmV02` | Five hard gates remain independent of target persistence. |
| Bounded-outcome evaluator | same owner — `evaluateOperationalReentryMatchedCohortArmV02` | `bounded_result_review_action` remains a separate, non-general outcome dimension. |
| Pairwise comparison owner | same owner — `deriveOperationalReentryMatchedCohortPairwiseComparisonV02` and `evaluateOperationalReentryMatchedCohortBlockV02` | Relation semantics are reusable, but P6H needs a new explicit all-six-pair owner. |
| Request-family trace and client-request IDs | `lib/vnext/model-gateway/provider-rejection-observation.ts` — `MODEL_PROVIDER_REQUEST_FAMILY_KINDS_V01`, `createDeterministicModelProviderRequestTraceV01`, and `createDeterministicModelClientRequestIdV01` | Correlation IDs are opaque and non-semantic; a future P6H request-family kind must be added by a separately authorized harness phase. |
| Authorization and first-egress execution boundary | `lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts` — `buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01` and `runOperationalReentryParserClosedCleanControlCohortV01` | A future P6H family needs a new exact authorization; first egress must consume it before transport. |
| Family-global single-use consumption | `lib/vnext/operational-reentry-parser-closed-clean-control-cohort-artifact-store.ts` — `beginOperationalReentryParserClosedCleanControlCohortAttemptV01` and `assertOperationalReentryParserClosedCleanControlCohortAuthorizationNotConsumedV01` | The global marker is written before the run-local marker and reuse fails closed. |
| Artifact validation and privacy | same P5 artifact owner — `validateOperationalReentryParserClosedCleanControlCohortArtifactsV01` and `assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01`; v0.4 compatibility owner — `assertOperationalReentryV04ProviderCompatibilityProbeArtifactPayloadSafeV01` | Future behavioral artifacts need a distinct ignored family while preserving no raw request/prompt/response/error, hidden reasoning, credential, or private-path persistence. |
| Cost authority | `lib/vnext/model-gateway/cost-authority.ts` — `buildModelGatewayCostAuthorityV01`, `buildModelGatewayCostBudgetV01`, and `assertModelGatewayCostBudgetCurrentV01` | Any future live issue must bind fresh, current pricing and treat missing exact usage or cost as unknown. |

The index does not make supporting research documents normative owners. This
v0.2 design therefore requires no architecture, protocol, evaluation, or
document-index ownership change.

## 4. Frozen A/B/C/G semantics

| Arm | Upstream source | Local pre-materialization action | Provider-visible representation |
|---|---|---|---|
| A | Exact fresh target plus shared non-target continuation | No gate | Exact current v0.4 A material. |
| B | Target absent at source; shared non-target continuation remains | No gate | Exact current v0.4 B material. |
| C | Exact stale target plus exact explicit stale relation and shared non-target continuation | No exclusion; stale material is presented | Exact current v0.4 C material. |
| G | The same exact stale target and stale relation as C exist upstream | Exact source-bound local gate excludes both before provider materialization | Exact current v0.4 B material. |

G is a local experimental arm, not a fifth provider arm. A future G projection
must validate the frozen upstream target and relation, record the exact local
gate decision, and then call the current v0.4 invocation builder with provider
shape B. The separate local G record must include source, target, stale-relation,
gate-rule, decision, and resulting provider-material fingerprints. It remains
outside `OperationalReentryMatchedCohortInvocationV04` and outside the
Responses request body.

The following are invariants, not hypotheses:

- G and C have the same exact upstream stale target and stale relation.
- G excludes both before provider materialization and preserves all non-target
  material.
- No G token, gate notice, provenance field, arm label, or gate semantics enters
  provider material, provider-visible IDs, the system prompt, or the schema.
- G provider material equals exact B provider material.
- G and B OpenAI JSON request bodies and request fingerprints are exactly equal.
- G/B model, system prompt, schema, max tokens, and `store: false` are equal.
- Distinct local invocation identities and distinct opaque trace/client-request
  IDs are allowed and remain non-semantic.
- Local G provenance is complete, public-safe, provider-invisible, and checked
  before any future transport can be admitted.

Any G-specific provider-visible material invalidates these invariants and
requires `new_provider_contract_required`.

## 5. Provider-contract verdict and parity proof

```text
provider_contract_verdict = reuse_v04_exact
```

The verdict is supported by current source rather than by redefining parity:

1. A/B/C are exact current v0.4 provider shapes.
2. G is built from C-equivalent upstream source but projects to exact B
   provider material after its local gate succeeds.
3. The v0.4 codec projects only `provider_material`; local invocation identity
   is not serialized into dynamic model material.
4. The Responses adapter builds the body deterministically from the same model,
   system prompt, B user material, strict schema, max tokens, and `store: false`.
5. The P6C twin-B witness already asserts equal B provider-material
   fingerprints, equal request bodies, equal request fingerprints, equal
   system/user/schema material, and equal route/contract/adapter/budget facts
   while local, trace, and client-request identities remain distinct.
6. Route, provider contract, codec, schema, parser, adapter, model, request
   bound, response bound, and parser closure are unchanged.
7. Issue #232 therefore remains applicable to G's exact B wire shape.

The local G gate/provenance and all-six-pair evaluator are new future harness
semantics outside the provider contract. They do not create a new provider
shape and do not reinterpret v0.3 history.

## 6. Arm A decision

```text
arm_A_decision = retain_as_positive_control
```

A remains because the historical P5 cohort showed repeatable fresh-target
conditioning for its exact frozen synthetic case. In a future P6H cohort, A
tests whether the target-sensitive path remains active while B/C/G isolate
stale-target absence, presentation, and substrate gating. Without A, a null
B/C/G pattern could not distinguish successful stale-reset isolation from a
cohort in which the target-sensitive path was inactive. This is an explicit
control decision, not retention by inertia and not a new behavioral claim.

## 7. Sealed future call plan

```text
block 0: A B G C
block 1: B C A G
block 2: C G B A
block 3: G A C B

planned_calls = 16
repeat_blocks = 4
calls_per_arm = 4
each arm once per ordinal position = true
parallel = 1
retries = 0
replacements = 0
adaptive_stopping = false
fresh_stateless_invocation = true
conversation_reuse = false
thread_reuse = false
previous_response_reuse = false
```

This order is design only. It creates no runtime plan, call slot, trace,
candidate, authorization, or execution right.

## 8. Complete six-pair matrix

Every complete future block evaluates all six pairs directly:

| Pair | Primary ownership | Direct question |
|---|---|---|
| A↔B | fresh-target positive control | Does fresh target presence change the declared target-sensitive structure relative to target absence? |
| A↔C | fresh vs metadata-only stale | How does fresh target presentation differ from presentation of the stale target and relation? |
| A↔G | fresh vs gated stale upstream source | How does fresh target presentation differ from a C-equivalent upstream target excluded locally? |
| B↔C | metadata-only stale persistence vs absence | Does presented stale material retain target-specific persistence relative to source absence? |
| B↔G | substrate-gated equivalence vs absence | After valid local gating, is target-specific persistence equivalent to direct absence? |
| C↔G | substrate gating vs metadata-only stale presentation | Does excluding the exact stale target/relation change target-specific persistence relative to presenting them? |

Direct C↔B and G↔B are mandatory. No relation is inferred transitively, and
whole-output, target-persistence, compliance, and bounded-outcome relations are
reported independently for every pair.

## 9. Finite target-persistence evaluator

The future evaluator must consume only structured current fields. It must not
use raw-string equality, free-form semantic scoring, a model judge, a scalar,
rank, or winner.

### 9.1 Local intervention provenance

Before evaluating outputs, the future harness validates a separate local
vector:

| Dimension | Finite values |
|---|---|
| `upstream_target_identity` | exact frozen target, absent, unknown, protocol_invalid |
| `upstream_stale_relation_identity` | exact frozen relation, absent, unknown, protocol_invalid |
| `substrate_gate_disposition` | not_applicable, excluded_before_materialization, not_excluded, unknown, protocol_invalid |
| `source_gate_lineage` | exact fingerprint, unknown, protocol_invalid |
| `provider_projection_shape` | exact_A, exact_B, exact_C, unknown, protocol_invalid |
| `local_provenance_provider_visibility` | absent, present_protocol_invalid, unknown |

B and G intentionally differ in upstream provenance. B has no source target or
gate; G has the exact C source target/relation and a successful exclusion gate.
That difference proves the intervention and is excluded from the G/B
post-materialization equivalence calculation.

### 9.2 Post-materialization target-persistence vector

| Dimension | Exact current structured source | Finite values |
|---|---|---|
| `provider_target_material` | `provider_material.continuation_context` target role | present, absent, unknown, protocol_invalid |
| `provider_stale_relation` | `provider_material.stale_relation` | present, absent, unknown, protocol_invalid |
| `selected_or_referenced_target_identity` | parsed `referenced_continuation_tokens` from `referenced_continuation_selections` | present, absent, unknown, protocol_invalid |
| `continuation_packet_target_material` | E1 `referenced_source_ids` bridge from the structured target token | present, absent, unknown, not_comparable, protocol_invalid |
| `target_operation_action_class` | `target_linked_verification_preparation` selection | present, absent, unknown, protocol_invalid |
| `target_decision_preparation_structure` | the same explicit structured action token, reported separately as decision-preparation presence | present, absent, unknown, protocol_invalid |
| `target_disposition` | locally derived v0.4 disposition | not_available, not_referenced, reference_only, applied_to_structure, withheld_stale, stale_persisted, unknown, protocol_invalid |
| `target_specific_required_check_relation` | no dedicated current target-specific field | not_available_under_v04, unknown, protocol_invalid |
| `target_specific_result_limitation` | `limitation_target_not_available`, `limitation_stale_target_withheld`, and `limitation_stale_target_persisted` selections | absent, target_not_available, stale_withheld, stale_persisted, mixed, unknown, protocol_invalid |
| `target_abstention_relation` | structured `abstention`, result status, target availability, and disposition | consistent, inconsistent, not_available, unknown, protocol_invalid |

The common `required_check` is not a target-specific check and must never fill
that unavailable dimension.

For each arm and pair, the finite aggregate target-persistence state is exactly
one of:

```text
valid_target_absent_or_gated
bounded_target_persistence_observed
no_target_persistence_observed
unknown
not_comparable
protocol_invalid
compliance_asymmetry
```

`protocol_invalid` covers invalid source/gate/body/schema/parser facts.
`compliance_asymmetry` prevents comparison when common-compliance validity
differs. Missing or incomplete material remains `unknown` or `not_comparable`;
it is never coerced into absence, persistence, equivalence, or reset.

### 9.3 Independent relation layers

Each pair reports these independently:

1. `whole_output_behavioral_relation` — equal, distinct, unknown, or
   not_comparable over the predeclared normalized structured projection;
2. `target_persistence_relation` — equal, left_persists_more,
   right_persists_more, mixed, unknown, or not_comparable over the vector above;
3. `common_compliance_relation` — both_valid, protocol_invalid,
   compliance_asymmetry, unknown, or incomplete; and
4. `bounded_outcome_relation` — the existing declared bounded relation, never
   generalized to benefit or harm.

```text
whole-output distinctness != target persistence
target persistence != bounded outcome
compliance validity != behavioral relation
local provenance difference != provider-visible treatment difference
```

## 10. Stochastic B/G interpretation

B and G are separate fresh stateless invocations. Identical provider requests
do not imply identical sampled outputs, so stochastic whole-output difference
does not automatically falsify H3. H3 is judged only by the predeclared
target-persistence vector after both calls pass independent common-compliance
and bounded-outcome gates. Raw-string equality is neither necessary nor
sufficient for gate equivalence.

## 11. Frozen hypotheses

```text
H1: A vs B reproduces fresh-target positive-control conditioning.

H2: C vs B directly measures metadata-only stale persistence.

H3: G vs B tests target-specific equivalence after valid substrate gating.

H4: G vs C tests a bounded gating-associated target-persistence difference.

H5: Common compliance and bounded outcome remain independent gates.
```

These are hypotheses, not results. They create no general causal, benefit,
provider-superiority, policy, or Stage 7 claim.

## 12. Recommended future family

Because the provider-contract verdict is `reuse_v04_exact`, a separately
authorized zero-egress harness should use new local family identities:

```text
cohort = operational_reentry_v04_stale_reset_isolation_cohort.v0.1
plan = operational_reentry_v04_stale_reset_isolation_plan.v0.1
evaluator = operational_reentry_v04_stale_reset_isolation_evaluator.v0.1
authorization = operational_reentry_v04_stale_reset_isolation_authorization.v0.1
manifest = operational_reentry_v04_stale_reset_isolation_manifest.v0.1
report = operational_reentry_v04_stale_reset_isolation_report.v0.1
artifact index = operational_reentry_v04_stale_reset_isolation_artifact_index.v0.1
request family = operational_reentry_v04_stale_reset_isolation_cohort
call slot namespace = e2r2p6h-call-*
```

None of these owners is implemented by P6F. A future harness phase must add
the request-family kind and all family-specific types, builders, validators,
conformance tests, and zero-egress witnesses without changing the exact v0.4
provider contract.

## 13. Future artifact, privacy, single-use, and cost design

The future ignored namespace is:

```text
.augnes-lab/operational-reentry-v04-stale-reset-isolation-cohorts/
  authorization-consumptions/<authorization-fingerprint>.json
  <cohort-id>/issue-<future-live-issue>/
```

It must not reuse the v0.3 behavioral cohort or v0.4 compatibility-probe
families. The future family freezes these semantics:

```text
maximum provider calls = 16
parallel = 1
retry = 0
replacement = 0
adaptive changes = 0
first egress consumes authorization globally before transport = true
authorization reaches a second transport = false
missing exact usage or cost = unknown
```

Consumption must use a family-global exclusive marker before the run-local
marker. Any later journal failure leaves reuse blocked. Artifacts remain
append-only, bounded, ignored, and public-safe, with raw prompts, request
bodies, provider responses/errors, hidden reasoning, credentials/full headers,
private absolute paths, product rows, and Core records absent. Any future live
issue must refresh official pricing and build an exact current cost authority;
this design is not pricing authority.

## 14. Go / no-go conclusion

All design gates are satisfied:

- the selected provider-contract verdict reuses exact v0.4;
- exact B/G provider JSON body and request-fingerprint equality are statically
  provable from the current projection plus the twin-B witness;
- G provenance is exact, finite, and provider-invisible;
- A is explicitly retained as the positive control;
- all six comparisons, including direct C↔B and G↔B, are finite and directly
  owned;
- the target-persistence vector is finite and fail-closed; and
- no unresolved privacy, authority, or namespace blocker remains at design
  level.

```text
P6H GO = true for separate zero-egress harness authorization only
P6H live GO = false
compatibility_probe_required_before_P6H_live = false_for_unchanged_exact_v04_provider_contract
unresolved_design_blockers = none
```

This GO does not authorize implementation. P6H remains a future separately
authorized zero-egress harness candidate. Harness implementation, candidate
generation, authorization creation or consumption, provider egress,
behavioral execution, replication, policy, Stage 7, publication, deployment,
Ready, merge, and auto-merge remain unauthorized.

Issue #205 remains separate and open. PR #186 remains open, Draft, unmerged,
and historical HOLD. A future result could establish at most a bounded
gating-associated target-persistence relation in the exact frozen synthetic
cohort; it could not by itself establish product-history use, support,
outcome association, causal contribution, general benefit or harm,
provider/model superiority, scalar fitness, rank, winner, policy fitness, or
Stage 7 readiness.
