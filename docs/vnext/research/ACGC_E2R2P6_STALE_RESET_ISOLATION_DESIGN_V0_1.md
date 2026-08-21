# ACGC E2R2P6 Stale-Reset Isolation Design v0.1

## 1. Status and authority

```text
Status: zero-egress design audit
Repository: hynk-studio/augnes-perspective-lab
Exact audited source: e62606704edf1103390f3c067401a2cb853741b5
Issue: #225
Design family: ACGC-E2R2P6A
Implementation authority: none
Live-provider authority: none
Policy authority: none
Stage 7 authority: none
```

This document audits whether a future A/B/C/G stale-reset isolation harness can
exclude stale target material before provider materialization while reusing the
merged parser-closed v0.3 provider contract exactly. It is subordinate to the
canonical document owners `docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md`
through `docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`, the checked-in
runtime owners cited below, and the sequencing authority in
`docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`.

This audit creates no harness, provider call, compatibility probe,
authorization, candidate, artifact namespace, live cohort, policy, or Stage 7
authority. A positive design verdict is review material only.

## 2. Audited historical result and question

The finalized E2R2P5 cohort is immutable historical input to this audit. Its
bounded report records:

```text
planned / attempted / completed-live calls = 16 / 16 / 16
complete blocks = 4
common_compliance_valid_blocks = 4
compliance_asymmetry_count = 0
conditioning = structured_delta_observed in 4/4 blocks
reset = stale_persistence_candidate in 4/4 blocks
bounded pairwise relations = 20 comparable:distinct:equal
relation_repeatability = repeatable
scalar score / rank / winner created = false / false / false
```

The E2R2P5 pair set was A↔B, C↔A, A↔D, B↔D, and C↔D. It did not contain a
direct C↔B comparison. Its result establishes fresh-target bounded conditioning
only for that exact frozen synthetic cohort. It does not establish stale reset,
benefit, harm, a general causal mechanism, provider/model superiority, policy
fitness, or Stage 7 readiness.

E2R2P6 asks a narrower intervention question:

> When the exact stale target and stale relation exist in bounded upstream
> source material, does excluding them at a local substrate gate yield the same
> provider material as target absence, while metadata-only stale presentation
> retains a distinguishable target-persistence path?

## 3. Exact current owners

The design conclusion is grounded in these source owners at audited source
`e62606704edf1103390f3c067401a2cb853741b5`:

| Concern | Current owner and exact export | Audited implication |
|---|---|---|
| Canonical A/B/C/D construction | `lib/vnext/operational-reentry-matched-cohort-v0-2.ts` — `buildOperationalReentryMatchedCohortModelInputV02` | A adds the fresh target, B omits a target, C adds the stale target and stale relation, and D removes all continuation context. |
| Parser-closed model construction | `lib/vnext/operational-reentry-matched-cohort-v0-3.ts` — `buildOperationalReentryMatchedCohortModelInputV03` | v0.3 wraps the canonical v0.2 semantics without adding a fifth arm or gate field. |
| Input validation and material projection | `lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec.ts` — `validateOperationalReentryMatchedCohortModelInputV03` and `projectOperationalReentryMatchedCohortModelMaterialV03` | Only exact A/B/C/D provider-visible shapes pass. G-specific wire material would be rejected. |
| Strict schema and parser | same file — `operationalReentryMatchedCohortResponseSchemaV04` and `parseOperationalReentryMatchedCohortOutputV03` | The strict boolean-selection schema and locally derived target disposition can remain unchanged if G reaches the route as exact B material. |
| Provider contract | same file — `buildOperationalReentryMatchedCohortProviderContractV03` | The contract is parser-closed and forbids persistence of raw prompt, raw provider response/error, and hidden reasoning. |
| OpenAI Responses request | `lib/vnext/model-gateway/openai/responses-adapter.ts` — `projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03` | Canonical request-body equality can be proved without transport. Opaque per-call correlation remains transport identity, not experimental material. |
| Model Gateway route | `lib/vnext/model-gateway/model-gateway.ts` — `projectOperationalReentryMatchedCohortProviderRequestV03` and `prepareOperationalReentryMatchedCohortModelGatewayRouteV03` | A future harness can invoke the unchanged v0.3 route only after local G/B conformance succeeds. |
| E2R2P5 plan and bridge | `lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts` — `buildOperationalReentryParserClosedCleanControlCohortPlanV01`, `buildOperationalReentryParserClosedCleanControlEvaluatorBridgeV01`, and `projectOperationalReentryParserClosedCleanControlEvaluatorInputV01` | The current plan is fixed to A/B/C/D, and its v0.3→canonical-v0.2 bridge cannot represent G as a new semantic wire arm. |
| Common compliance, bounded outcome, and pairwise comparison | `lib/vnext/operational-reentry-matched-cohort-v0-2.ts` — `evaluateOperationalReentryMatchedCohortArmV02`, `deriveOperationalReentryMatchedCohortPairwiseComparisonV02`, and `evaluateOperationalReentryMatchedCohortBlockV02` | Their dimension semantics are reusable locally, but the fixed five-pair A/B/C/D matrix is not sufficient for A/B/C/G. |
| E1 conditioning and reset | `lib/vnext/operational-reentry-perturbation.ts` — `buildOperationalReentryEvaluationV01` with local `deriveConditioningV01` and `deriveResetV01` | Current reset detects bounded target persistence in target/packet identity, references, and target-shaped action structure. It does not itself model a gated G arm. |
| Request-family identities | `lib/vnext/model-gateway/provider-rejection-observation.ts` — `createDeterministicModelProviderRequestTraceV01` and `createDeterministicModelClientRequestIdV01` | A future family needs a new request-family kind and independent local call identities; none may be inherited from Issue #221 or #222. |
| Authorization and execution | `lib/vnext/operational-reentry-parser-closed-clean-control-cohort.ts` — `buildOperationalReentryParserClosedCleanControlCohortAuthorizationCandidateV01` and `runOperationalReentryParserClosedCleanControlCohortV01` | Current authorization is family-specific and cannot authorize E2R2P6. First egress is the consumption boundary. |
| Single-use persistence, artifacts, privacy | `lib/vnext/operational-reentry-parser-closed-clean-control-cohort-artifact-store.ts` — `beginOperationalReentryParserClosedCleanControlCohortAttemptV01`, `assertOperationalReentryParserClosedCleanControlCohortAuthorizationConsumptionHistoryCompleteV01`, `validateOperationalReentryParserClosedCleanControlCohortArtifactsV01`, and `assertOperationalReentryParserClosedCleanControlCohortArtifactPayloadSafeV01` | A future family needs distinct append-only owners and namespaces while retaining global-first consumption and forbidden-material scanning. |
| Historical preservation | `scripts/test-operational-reentry-parser-closed-clean-control-cohort.ts` — `verifyHistoricalIssue216PreservedV01` and `verifyStaticPrivacyAndAuthorityBoundaryV01`; `scripts/vnext-protocol-conformance/operational-reentry-parser-closed-clean-control-cohort.ts` — `runOperationalReentryParserClosedCleanControlCohortConformanceV01` | Future work must preserve historical compatibility artifacts and keep raw/provider material and authority expansion absent. |

The exact merged provider identities audited here are:

```text
provider contract = operational_reentry_clean_control_matched_cohort_provider_contract.v0.3
codec = operational_reentry_matched_cohort_codec.v0.4
response schema = operational_reentry_matched_cohort_response_schema.v0.4
parser = operational_reentry_matched_cohort_parser.v0.3
adapter = openai_responses_operational_reentry_matched_cohort_adapter.v0.5
route fingerprint = sha256:4d286f56405ff66236a19d1e0f4529510faa8c53a80e6bba4ecac9c4845930e0
provider-contract fingerprint = sha256:682905683f083ee67002dc4cf2577ec3ae4302e90fc85e27f43019b8b7978bbb
adapter-request-route fingerprint = sha256:182e0be9c2b4a53baca61c01d9b83f67fbd6855d1e3b8c9cbd182abeff4831e9
response_bytes = 1168
max_output_tokens = 1168
```

Historical E2R2P5 identities remain:

```text
case fingerprint = sha256:d702283dae6d9cfe586a3b7fd91893aee2720a3f136a027c321c3ecfa9d7fa4b
common-task-evidence fingerprint = sha256:455cb74df26f63eccd15952a98433cba7f410a9e8b312afe5d35d4ceb235f38d
plan fingerprint = sha256:c5d11a023b3d442bebbc68231e47a3025ba76741a985718dfd7896f46ede0bcb
evaluator-bridge fingerprint = sha256:c36707f62d37881cbaf8a94382c478efee7d5061aa8a75b23b2720887277b4b8
```

Those historical plan and bridge fingerprints identify E2R2P5 only. A future
E2R2P6 plan, evaluator, and artifact family must receive new fingerprints.

## 4. Frozen conceptual arms

| Arm | Upstream bounded source | Local pre-materialization action | Provider-visible shape |
|---|---|---|---|
| A | Exact fresh target plus shared non-target material | No gate exclusion | Exact current v0.3 A |
| B | Target absent at source; shared non-target material remains | No gate exclusion | Exact current v0.3 B |
| C | Exact stale target and exact explicit stale relation plus shared non-target material | Metadata-only stale presentation remains materialized | Exact current v0.3 C |
| G | The same exact stale target and stale relation as C exist upstream | A local source-bound gate excludes both before provider materialization | Exact current v0.3 B |

G is not a fifth provider shape. Its experimental identity exists only in the
local plan, source projection, gate record, evaluator input, and bounded
artifacts. Adding `arm: G`, a gate notice, a stale-relation tombstone, or any
G-only token to model material would violate this design and require a new
provider-contract verdict.

## 5. Shared parity and fail-closed rules

Every comparison must bind canonical equality for all non-intervention
dimensions:

- task goal, success criteria, non-goals, and data classification;
- common task evidence and its exact fingerprint;
- non-target continuation material and its canonical fingerprint;
- required checks and expected dispositions;
- forbidden actions and authority notice;
- repository, exact head, construction/observation cutoff, platform, provider,
  and model identities;
- provider route, contract, codec, schema, parser, adapter, response limit, and
  input limit;
- budget, maximum call count, parallelism, retry/replacement/adaptive bounds;
- evaluator-visible non-target material and common-compliance rubric; and
- source and gate provenance rules for the pair being evaluated.

Per-call slot, trace, and client-request identities remain unique local or
transport correlation identities. They must not encode the arm or gate result
in provider-visible experimental material. The future conformance owner must
construct a same-block B/G provider-material parity basis and prove that the
projected v0.3 request bodies, strict schemas, system prompts, budgets, and
route identities are canonical-equal. Any opaque correlation header is outside
the experimental material and must carry no G label or G-only fact.

An unequal or unproved non-intervention dimension yields `not_comparable`. An
invalid source, gate record, route, schema, or canonical request proof yields
`protocol_invalid`. Common-compliance disagreement yields
`compliance_asymmetry`. None may be coerced into a directional behavioral
result.

## 6. G pre-materialization boundary

The current owners permit G only through a dedicated local projection. A
future implementation should own a pure function conceptually equivalent to:

```text
bounded upstream C-shaped source
+ exact target/stale-relation fingerprints
+ local gate rule/version/decision
+ same-block B/G provider-material parity identity
→ local G provenance record
+ buildOperationalReentryMatchedCohortModelInputV03({ arm: "B", ... })
→ projectOperationalReentryMatchedCohortProviderRequestV03(...)
```

The dedicated projection is preferred over calling the B builder directly at
the plan site because it can fail closed on all of these facts before the B
shape is built:

1. the upstream source contains the exact C target and stale relation;
2. the target and relation match the frozen case identities;
3. the gate rule is the exact declared exclusion rule;
4. both target material and stale relation are excluded;
5. shared non-target material remains unchanged;
6. the locally recorded source/gate provenance is complete; and
7. the resulting v0.3 model material and provider request equal the paired B
   projection under the declared provider-material parity identity.

The gate record must remain local and public-safe. It may contain bounded
fingerprints, gate version, disposition, and exact source lineage. It must not
contain raw prompt, raw provider request/response, hidden reasoning,
credentials, private paths, or target text that the provider projection is
supposed to exclude.

This separation is possible with current owners because the frozen v0.2 case
already contains the candidate fresh target, stale target, stale relation, and
shared non-target material before `buildOperationalReentryMatchedCohortModelInputV02`
selects a provider-visible arm. The v0.3 builder can then receive the exact B
selection after local proof. Conversely, the v0.3 codec proves that a
provider-visible G extension is not allowed: `matchesOneExactShapeV03` accepts
only A/B/C/D material.

## 7. Provider-contract verdict

```text
provider_contract_verdict = reuse_parser_closed_v03_exact
```

Reuse is valid only while all of the following remain true:

- A, B, and C are the exact current v0.3 shapes;
- G enters provider materialization as the exact B shape;
- no target bytes, target token, stale relation, gate notice, G label, or
  G-only metadata reaches the provider;
- the local same-block conformance proof establishes canonical equality of G
  and B provider request bodies and schemas;
- provider contract, codec, strict response schema, parser, adapter, route,
  model, input bytes, response bytes, and output-token limits remain unchanged;
  and
- transport correlation carries no experimental arm/gate semantics.

If any provider-visible experimental material changes, the verdict becomes
`new_provider_contract_required`. The required future sequence would then be:

```text
new versioned provider contract
→ parser-closure verification
→ zero-egress compatibility harness
→ separately authorized compatibility live issue
→ separately authorized behavioral harness/live work
```

This audit implements and authorizes none of that sequence.

## 8. Sealed future call plan

The audited balanced order is adopted:

```text
block 0 = A B G C
block 1 = B C A G
block 2 = C G B A
block 3 = G A C B
```

Each arm occurs once in every position and once per block.

```text
planned_calls = 16
repeat_blocks = 4
calls_per_arm = 4
maximum_parallel_provider_calls = 1
retries = 0
replacement_calls = 0
adaptive_stopping = false
fresh_stateless_invocation_per_call = true
conversation_reuse = false
thread_reuse = false
previous_response_reuse = false
```

This document predeclares design order only. It does not create call slots,
traces, client-request IDs, a sealed runtime plan, or permission to execute.

## 9. Complete comparison matrix

Every complete block evaluates all six pairs independently:

| Pair | Bounded question | Primary relation |
|---|---|---|
| A↔B | Does fresh target presence change the bounded target-sensitive structure relative to target absence? | fresh conditioning |
| A↔C | How does fresh target presentation differ from metadata-only stale presentation? | fresh versus metadata-stale |
| A↔G | How does fresh target presentation differ from locally gated stale material? | fresh versus gated stale |
| B↔C | Does metadata-only stale presentation retain target-specific persistence relative to direct absence? | metadata-only stale persistence |
| B↔G | After the source-bound gate, is target-specific persistence equivalent to direct absence? | gate equivalence to absence |
| C↔G | Does local exclusion change target-specific persistence relative to presenting the exact stale target/relation? | gate intervention contrast |

Direct C↔B coverage is mandatory. No pair inherits evidence or meaning from
another pair. Whole-output, target-persistence, common-compliance, and bounded
outcome relations are reported separately for every pair.

## 10. Target-specific evaluator design

The recommended future evaluator identity is
`operational_reentry_parser_closed_stale_reset_isolation_evaluator.v0.1`.
It is a new local evaluator, not a new model judge and not a provider-contract
field.

### 10.1 Reused bounded semantics

The evaluator may reuse these exact current semantic owners:

- the five hard-gated common-compliance dimensions from
  `evaluateOperationalReentryMatchedCohortArmV02`:
  `result_status_grounding`, `required_check_disposition`,
  `forbidden_action_integrity`, `common_source_support_alignment`, and
  `result_abstention_consistency`;
- the `bounded_result_review_action` outcome dimension; and
- the existing whole-output behavioral projection fields: referenced
  continuation tokens, target disposition, target-linked action presence, and
  stale-target persistence limitation presence.

The future evaluator must own an A/B/C/G type and all-six-pair matrix. It may
project G to canonical B semantics for current common-compliance evaluation,
but it must retain G's local source/gate provenance in its own bounded record.
The fixed E2R2P5 bridge and five-pair comparator cannot be relabeled as an
A/B/C/G evaluator.

### 10.2 Finite target-persistence vector

Each completed arm record should contain a finite vector with explicit
availability:

| Dimension | Current source | Future bounded value |
|---|---|---|
| `upstream_target_identity_present` | local frozen source and target fingerprint | `present`, `absent`, `unknown`, or `protocol_invalid` |
| `upstream_stale_relation_present` | local stale relation and source-bound fingerprint | `present`, `absent`, `unknown`, or `protocol_invalid` |
| `substrate_gate_disposition` | local gate record | `not_applicable`, `excluded`, `not_excluded`, `unknown`, or `protocol_invalid` |
| `provider_target_continuation_present` | projected model input | `present`, `absent`, `unknown`, or `protocol_invalid` |
| `provider_stale_relation_present` | projected model input | `present`, `absent`, `unknown`, or `protocol_invalid` |
| `selected_or_referenced_target_identity` | normalized `referenced_continuation_tokens` | `present`, `absent`, or `unknown` |
| `target_packet_or_continuation_material` | local source plus projected continuation | `upstream_only`, `provider_visible`, `absent`, `unknown`, or `protocol_invalid` |
| `target_operation_action_class` | normalized operation/action tokens | `present`, `absent`, or `unknown` |
| `target_decision_preparation_structure` | `target_linked_verification_preparation` | `present`, `absent`, or `unknown` |
| `target_disposition` | locally derived current v0.3 target disposition | current finite disposition, `unknown`, or `not_available` |
| `target_specific_required_check_disposition` | no dedicated current v0.3 field | `not_available_under_v03` or `unknown`; never inferred from the common required check |
| `target_specific_limitation` | normalized `limitation_stale_target_persisted` selection | `present`, `absent`, or `unknown` |
| `target_abstention_relation` | normalized abstention plus target availability/disposition | `consistent`, `inconsistent`, `unknown`, or `not_available` |

The current provider contract exposes only the common required-check
disposition. It does not expose a target-specific required-check disposition.
That dimension therefore remains explicitly unavailable under exact v0.3
reuse. This is not silently filled from the common check and is not a blocker
to the narrower target-persistence hypotheses below. If a future design makes a
directional target-specific required-check result mandatory, it must select
`new_provider_contract_required`.

### 10.3 Separate relation layers

For every pair, the evaluator reports four independent layers:

1. `whole_output_behavioral_relation` — `equal`, `distinct`, `unknown`, or
   `not_comparable` over the predeclared normalized behavioral projection;
2. `target_persistence_relation` — `equal`, `left_persists_more`,
   `right_persists_more`, `mixed`, `unknown`, or `not_comparable` over the
   finite target vector;
3. `common_compliance_relation` — both valid, protocol invalid,
   compliance-asymmetric, unknown, or incomplete; and
4. `bounded_outcome_relation` — the current declared bounded-outcome relation,
   never generalized into benefit or harm.

Required interpretation boundaries are structural:

```text
whole-output distinctness ≠ target persistence
G/B provider-request equality ≠ raw-output equality
bounded target reset ≠ general benefit
intervention-associated difference ≠ general causal mechanism
stale recognition ≠ stale constraint preservation
```

The evaluator admits `unknown`, `not_comparable`, `protocol_invalid`, and
`compliance_asymmetry`. Missing, invalid, or asymmetric material cannot be
forced into equivalence, persistence, reset, or effect.

## 11. Stochastic G/B handling

If G and B have canonically equal provider-visible request bodies, stochastic
differences between their independent calls do not by themselves falsify the
substrate gate or prove a G/B effect. The gate claim concerns exclusion before
provider materialization. G/B behavioral review concerns only the predeclared
target-persistence, common-compliance, and bounded-outcome dimensions.

Raw output string equality is neither required nor sufficient. A G/B
target-persistence relation can be `equal` while whole-output behavior is
`distinct`; conversely, a protocol or parity failure makes the pair
`not_comparable` even if raw strings happen to match.

## 12. Frozen hypotheses

```text
H1: A vs B preserves the fresh-target conditioning positive control.

H2: C vs B directly tests metadata-only stale persistence.

H3: G vs B tests target-specific equivalence after substrate gating.

H4: G vs C tests a bounded substrate-gating-associated target-persistence
    difference.

H5: Common compliance and bounded outcome remain independent from H1–H4.
```

These are hypotheses, not results. No hypothesis requires or predicts raw
output equality, general benefit, harm, or a general causal mechanism.

## 13. Recommended future family and namespaces

If separately authorized, the future zero-egress harness should use:

```text
family = operational_reentry_parser_closed_stale_reset_isolation_cohort.v0.1
plan = operational_reentry_parser_closed_stale_reset_isolation_plan.v0.1
evaluator = operational_reentry_parser_closed_stale_reset_isolation_evaluator.v0.1
request family = parser_closed_stale_reset_isolation_cohort
call slots = e2r2p6h-call-*
```

It must define distinct versioned identities for authorization, manifest,
report, and artifact index, plus distinct family-global consumption,
run-root, candidate, and artifact namespaces. It must not reuse the Issue #221
or #222 authorization IDs/fingerprints, cohort ID, plan, call slots, request
family, consumption marker, candidate namespace, run root, or artifact index.

The recommended G implementation is the dedicated local pre-materialization
projection described in section 6. After exact gate proof, it calls the
existing B model-input builder and proves canonical request-body equality with
the same-block B parity projection before either request can reach the
unchanged v0.3 route.

## 14. Future live boundary

This section is design-only. Any future live issue must independently bind:

```text
maximum provider calls = 16
maximum parallel provider calls = 1
retries = 0
replacement calls = 0
adaptive changes = 0
fresh stateless invocations = true
conversation reuse = false
thread reuse = false
previous-response reuse = false
first egress consumes authorization globally before transport = true
second transport under the same authorization = false
missing exact usage or cost = unknown, never zero
```

Current pricing is not timeless authority. A future live issue must re-read
official pricing and create a fresh repository-owned pricing authority and
snapshot. Harness implementation, a candidate, Gate A, and Gate B each require
their own explicit authority as applicable.

## 15. Epistemic and product boundary

A future successful experiment could establish at most:

> a bounded substrate-gating-associated target-persistence difference in this
> exact frozen synthetic intervention.

It would not automatically establish general continuation benefit or harm, a
general causal mechanism, product-history actual use, support validation,
outcome association, causal contribution in product history, provider/model
superiority, policy fitness, actor fitness, winner/promotional fitness, or
Stage 7 readiness.

Issue #205 remains separate and open. PR #186 remains open, Draft, unmerged,
and historical HOLD. The ACGC6B no-live-policy remains accepted. C9, policy,
Stage 7, persistent actors, winner/rank/population work, deployment,
publication, Ready, merge, and auto-merge remain unauthorized.

## 16. Go / no-go conclusions

```text
provider_contract_verdict = reuse_parser_closed_v03_exact
P6H_harness_go = true
compatibility_probe_required_before_P6H_live = false
unresolved_design_blockers = none
```

`P6H_harness_go = true` means only that a separately authorized zero-egress
implementation can proceed without a known design blocker if it satisfies all
of these merge gates:

- dedicated local G source/gate provenance and exact exclusion proof;
- all shared-parity checks fail closed;
- exact same-block G/B v0.3 request-body and schema equality conformance;
- no G-specific provider-visible material;
- unchanged provider contract, codec, schema, parser, adapter, route, model,
  and byte/token bounds;
- the balanced 16-slot A/B/C/G plan and all six direct comparisons;
- a new local target-persistence evaluator with explicit unavailable/unknown
  handling;
- independent common-compliance and bounded-outcome reporting;
- distinct authorization, consumption, artifact, and request-family owners;
- privacy and historical-preservation tests; and
- zero provider egress during harness implementation and verification.

Failure of G/B canonical request conformance, or any need to expose a
target-specific required-check field or other G material to the provider,
invalidates the reuse verdict. No P6H implementation or live work is authorized
by this audit, even though the design go value is true.
