# Personal Perspective Semantic Casebook v0.1

## Deterministic synthetic semantics for Workstream K Stage 1

> **Document status:** bounded Lab / R&D implementation contract
> **Document version:** v0.1
> **Date:** 2026-07-13 KST
> **Casebook contract:** `personal_perspective_semantic_casebook.v0.1`
> **Semantic definition:** `personal_perspective_semantics.v0.1`
> **Deterministic method:** `personal_perspective_casebook_deterministic_method.v0.1`
> **Defined at:** `2026-07-13T00:00:00.000Z`
> **Classification:** Workstream K Stage 1; offline; synthetic-only;
> non-authoritative; non-persistent; provider-neutral
> **Maturity boundary:** Level 1 Validated Contract only when the complete
> machine-checkable validation command passes for the repository revision;
> never a Level 2 claim

## 1. Parent authority and decision

This casebook is subordinate to:

- [`01_AUGNES_VNEXT_MASTERPLAN.md`](../01_AUGNES_VNEXT_MASTERPLAN.md)
- [`02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](../02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md)
- [`03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md)
- [`04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)
- [`05_AUGNES_VNEXT_LAB_CHARTER.md`](../05_AUGNES_VNEXT_LAB_CHARTER.md)
- [`AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md`](./AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md)

The implementation is one Lab-only semantic casebook envelope, one pure
normalizer/validator, committed synthetic fixtures, and one bounded validation
entrypoint. It gives deterministic meaning to candidate self-and-world
continuity material without creating a Personal Perspective product feature.

The casebook is not Core canonical state, a production protocol record, a
Product Surface, a Projection, an Inspector, a ReviewDecision, a
StateTransitionReceipt, Evidence, accepted memory, accepted Personal
Perspective, task-context selection authority, a user identity contract, an
authentication contract, a psychological profile, a diagnostic system, a
Personal Vault, or a real user pilot.

## 2. Research question and hypothesis

### Question

Can one bounded, replayable semantic contract distinguish descriptive
self-understanding, aspiration, values, roles, recurring-pattern
interpretations, world-model candidates, relationships, tensions,
counterexamples, exceptions, revisions, refusals, retraction, and deletion
without reducing Personal Perspective to preferences, rules, labels, scores,
behavior-only inference, or a fixed essence?

### Hypothesis

A deterministic casebook can preserve semantic kind, epistemic origin, scope,
source relation, counterexample status, candidate status, review expectation,
reuse refusal, limitations, non-authority, privacy, and integrity as separate
machine-checkable dimensions. A fail-closed validator should admit the
synthetic positive matrix and reject malformed, unsafe, authority-escalating,
scope-conflicting, or semantically invalid material even after an attacker
recomputes every deterministic identity and fingerprint.

This hypothesis is falsified for v0.1 if any required positive case is absent,
any required negative fixture is admitted, a re-signed semantic attack passes,
normalization is not deterministic, input is mutated, unsafe caller material is
echoed, or any prohibited authority meaning can be true in otherwise valid
material.

## 3. Experiment method

| Method field | v0.1 definition |
| --- | --- |
| Experiment ID | `lab:personal-perspective-semantic-casebook:v0.1` |
| Question | Can a bounded synthetic casebook distinguish revisable Personal Perspective candidates, exceptions, counterexamples, correction, and refusal without granting authority? |
| Hypothesis | Deterministic source, origin, scope, status, counterexample, reuse, privacy, and non-authority rules can reject identity and context overreach before any persistence or product integration. |
| Inputs | Committed synthetic source catalog; committed synthetic candidate, refusal, and tombstone cases; fixed semantic definitions and validation bounds |
| Excluded inputs | `personal_material_is_out_of_scope`; `prompt_and_transcript_material_are_out_of_scope`; private files or environment data; provider or model output; production Core records |
| Method | `deterministic_offline_casebook_validation`; pure TypeScript normalization, structural validation, reference validation, semantic validation, and integrity validation; CLI I/O remains outside the pure library |
| Method version | `personal_perspective_casebook_deterministic_method.v0.1` |
| Baseline | Level 0 intent in the active Personal Perspective R&D program without a machine-checkable Stage 1 casebook |
| Counterexample method | Use only semantically necessary fictional counterexample sources and reject fabricated coverage or contradictory status/ref combinations |
| Expected signal | All required positive semantic rows validate; all malformed, unsafe, authority-escalating, and adversarial fixtures fail closed; re-signed semantic attacks remain rejected for semantic reasons |
| Failure criteria | Any invalid fixture admits a candidate; any prohibited authority meaning validates as true; normalization or validation depends on clock, environment, machine path, locale, network, provider, or random input; deleted synthetic content remains reusable |
| Authority boundary | Lab output remains non-authoritative; no ReviewDecision or semantic transition is created; no persistence, task-context inclusion, cross-project sharing, publication, or merge is authorized |
| Retention | Only committed fictional synthetic fixture material is retained; no real-data deletion enforcement is claimed |
| Reproduction | Install dependencies from the committed lockfile; run the command in Section 18; compare the bounded JSON summary and fixed anchors |
| Productization gate | Separate human review of this Level 1 Lab contract; separate deterministic task-gap baseline slice; future architecture decision before any Personal Vault persistence or context inclusion |
| Limitations | Synthetic semantics do not establish real user endorsement or usability; the casebook does not implement task-gap discovery, review replay, context selection, persistence, or product integration; integrity fingerprints establish deterministic equality, not authenticity |
| Fixed defined time | `2026-07-13T00:00:00.000Z`; normalization never reads the current clock |

Project identity appears only in a genuinely project-scoped synthetic case.
Such a scope uses an unmistakably fictional bounded reference such as
`synthetic-project-scope:fictional-a`. The contract does not invent a personal, global,
or user project identity and does not define a production principal.

## 4. Contract envelope

The envelope binds these sections under strict root and nested allowed-key
sets:

```text
casebook_version
semantic_definition_version
deterministic_method_version
casebook_id
defined_at
classification
experiment
semantic_definitions
sources
cases
coverage_matrix
privacy_boundary
retention_boundary
authority_boundary
integrity
```

`classification` fixes `architecture_class = lab_r_and_d`, `workstream = K`,
`stage = 1`, `synthetic_only = true`, `non_authoritative = true`,
`non_persistent = true`, `provider_neutral = true`, and `maturity_claim` =
`level_1_validated_contract`. This field is valid only as part of the complete
passing aggregate and does not claim Level 2. `experiment` carries the method
fields listed above. `sources` and `cases` are conflict-sensitive collections.
`integrity` binds the normalized
aggregate; it never establishes source authenticity or user endorsement.

The case collection is a discriminated union:

- `candidate` represents bounded review-required semantic material.
- `refusal` preserves why a false premise, over-globalization, insufficient
  source, scope conflict, deleted reuse, or retracted reuse did not become an
  admitted identity candidate.
- `tombstone` represents deleted synthetic material with minimal identity and
  non-reuse semantics and no reusable personal proposition.

An **admitted case** is any union member that passes the whole aggregate's
structure, safety, reference, semantic, and integrity checks. An **admitted
candidate** is only an admitted member with discriminant `candidate`;
`refusal` and `tombstone` members never increment the admitted-candidate count.
Every member carries deterministic identity/integrity, a bounded title and
non-sensitive summary, explicit scope, source relations, counterexample
semantics, candidate status, limitations, future review expectations, reuse
posture, and the non-authority boundary. Every member has an epistemic origin;
for refusal or tombstone members it describes only the synthetic basis for the
refusal or deletion marker and cannot create candidate meaning. A candidate
proposition is never synthesized for refusal or tombstone members. A tombstone
source may state only that a synthetic deletion marker exists; it cannot
preserve or point to the deleted proposition.

The semantic kind must agree with the discriminant: ordinary semantic kinds
belong to `candidate`, `refusal_material` belongs to `refusal`, and
`deletion_tombstone` belongs to `tombstone`. No second production refusal
contract is created. Every valid union member is synthetic and
non-authoritative.

## 5. Source catalog semantics

Every source is deterministic, bounded, synthetic, and classified as exactly
one of:

| Source kind | Meaning |
| --- | --- |
| `synthetic_user_declaration` | A fictional explicit declaration; scoped and revisable, not authenticated identity |
| `synthetic_behavior_observation` | A fictional observed action; it does not contain personality meaning by itself |
| `synthetic_joint_interpretation` | Fictional jointly interpreted material; review remains required |
| `synthetic_model_inference` | Fictional model-derived material; always candidate-only and never user identity |
| `synthetic_contextual_fact` | Fictional bounded task, role, situation, time, relationship, or project context |
| `synthetic_counterexample` | A fictional counterexample that is required by the case's semantics rather than invented to improve coverage |
| `synthetic_scope_constraint` | A fictional explicit boundary or narrowing condition |
| `synthetic_retraction_instruction` | A fictional instruction that establishes only retraction/refusal semantics |
| `synthetic_deletion_instruction` | A content-free fictional deletion marker that establishes only tombstone/refusal semantics |
| `synthetic_false_premise` | A fictional false premise retained only so admission refusal is testable |

A source reference is neither authenticity proof nor an ExternalRef identity.
It is not user identity, Evidence, a ReviewDecision, accepted memory, or a
semantic transition, and grants no authority. Source IDs live only in the
Lab-specific namespace described in Section 14.

Every admitted candidate has at least one exact valid supporting source ref.
Ref resolution occurs before semantic relation evaluation. Unknown, malformed,
duplicate, conflicting, unsafe, or privacy-bearing sources fail closed.

Case-to-source relations use exactly this bounded set:

| Source relation | Meaning |
| --- | --- |
| `supports` | Supplies bounded synthetic support without establishing truth |
| `contextualizes` | Supplies bounded context without establishing candidate meaning by itself |
| `derived_from` | Identifies synthetic material from which an interpretation was derived |
| `observes` | Connects a behavior-observation case to the exact observation source |
| `counterexample` | Connects a case to an exact `synthetic_counterexample` source |
| `constrains_scope` | Connects a case to an exact synthetic scope boundary |

All union members retain at least one non-content-bearing or content-appropriate
source relation. For a refusal, the relation documents only the refusal basis.
For a deletion tombstone, it can resolve only to a content-free synthetic
deletion marker and cannot resolve to the deleted statement.

## 6. Semantic kinds

The contract keeps candidate meaning separate from origin, scope, status, and
reuse. It does not force all material into one generic label.

| Semantic kind | Deterministic meaning |
| --- | --- |
| `descriptive_self_understanding` | A current, scoped, revisable description rather than global truth |
| `aspirational_identity` | A future-oriented self-description that does not assert current behavior |
| `stable_value_or_commitment` | A scoped value or commitment that can coexist in tension and does not guarantee behavior |
| `decision_principle` | A revisable consideration, never an automatic mandatory policy |
| `contextual_role` | Role-bounded meaning with no workspace-global rewrite |
| `recurring_disposition_candidate` | A candidate interpretation of recurrence, not a permanent trait |
| `behavior_observation` | A fictional observation of behavior with no direct personality promotion |
| `behavioral_pattern_interpretation` | Candidate meaning derived from behavior, distinct from the observation itself |
| `world_model_candidate` | A source-backed, scope-limited candidate about the world |
| `relationship_model_candidate` | Meaning limited to one explicitly declared fictional relationship scope |
| `persistent_tension` | Two or more unresolved sides preserved without forced resolution |
| `contested_interpretation` | Disagreement preserved without truth promotion |
| `known_exception` | A lower-scope exception related to a broader candidate without erasing it |
| `scope_narrowing` | A narrower candidate that preserves the broader candidate's lineage |
| `revision_candidate` | A proposed reinterpretation linked to prior material; it is not automatically applied |
| `deletion_tombstone` | Minimal deleted-item identity and reuse refusal with no reusable proposition |
| `refusal_material` | Bounded correction/refusal basis that never becomes an identity candidate |

Retraction is a status. Deletion and refusal have exact union-specific semantic
kinds so the validator cannot silently normalize them into ordinary candidates.
False premises are refused rather than normalized into a candidate.

## 7. Epistemic-origin semantics

Every admitted candidate has exactly one epistemic origin:

| Epistemic origin | Required posture |
| --- | --- |
| `explicit_synthetic_user_declaration` | May be a source; remains scoped and revisable |
| `jointly_interpreted_synthetic_candidate` | Uses multiple appropriate synthetic sources and remains review-required |
| `model_inferred_synthetic_candidate` | Explicitly derived, always candidate, never accepted user identity, and never task-context authority |
| `observed_synthetic_behavior` | Describes behavior only; personality meaning requires a separate candidate interpretation |
| `derived_interpretation` | Rule- or relation-derived candidate meaning; integrity and repetition do not verify it |

The validator enforces these rules independently from integrity:

1. Model inference cannot be accepted identity.
2. Observation cannot be promoted directly to personality truth.
3. One task choice cannot establish global identity.
4. Repetition cannot upgrade trust, status, authority, or endorsement.
5. Fields or labels such as observed, verified, helpful, stable, or accepted do
   not create authority.
6. Model agreement and confidence do not create verification.
7. Integrity does not establish authenticity.
8. Synthetic material cannot become actual user endorsement.

## 8. Scope and relation semantics

Scope is an independent structured dimension. The supported scope kinds are:

| Scope kind | Boundary |
| --- | --- |
| `workspace_conceptual` | Conceptual personal continuity candidate only; not persisted workspace state |
| `project_specific` | One explicitly fictional project scope; it cannot rewrite workspace-level meaning |
| `role_specific` | One fictional role; it cannot become global identity |
| `relationship_specific` | One explicitly in-scope fictional relationship; it cannot be shared outside that scope |
| `task_specific` | One fictional task; it cannot establish stable identity |
| `situational` | One bounded situation |
| `time_bounded` | One explicit fixed interval; no implicit clock is used |
| `exception` | A lower-scope exception linked to a broader case |

Every scope contains `kind`, bounded `qualifiers`, nullable
`project_scope_ref`, nullable strict `valid_from`/`valid_until`, and the exact
flags `ambiguous = false` and `sharing_outside_scope_authorized = false`.
`project_scope_ref` is non-null only for `project_specific` and must use the
explicit `synthetic-project-scope:<fictional-slug>` form defined by the
validator.

This v0.1 chooses the fail-closed branch for ambiguous or contradictory scope:
it is refused rather than silently generalized or normalized into a candidate.
The contract recognizes only these Lab-local case-to-case relations:

```text
narrows
exception_to
contests
revises
counterexample_to
interprets
```

Relations resolve exact case IDs before semantic validation. They never create
a production ontology. A lower-scope relation may narrow, challenge, or add an
exception to higher-scope material but never silently replaces or rewrites it.
Cross-project personal-context leakage and fake personal project identifiers
are invalid. `interprets` is the only relation that may connect a
`behavioral_pattern_interpretation` to a separate `behavior_observation`; the
observation does not inherit the interpretation. Every case relation requires
`target_effect = preserves_target`; any replacement or rewrite-shaped target
effect fails closed.

## 9. Counterexample semantics

Every admitted case declares exactly one program-authorized status. In v0.1,
`not_applicable` is admitted only for a refusal, content-free tombstone, or
literal `behavior_observation`, and always requires a bounded explanation:

| Status | Deterministic meaning and validation |
| --- | --- |
| `known_present` | At least one exact, resolved, related synthetic counterexample ref is required; the case cannot claim to be exception-free |
| `none_found` | A bounded documented search/review found none; known refs are forbidden and impossibility/completeness claims are invalid |
| `not_searched` | No search was performed; it is weaker than `none_found` and cannot claim completed search or completeness |
| `not_applicable` | Requires a bounded case-specific justification and is permitted only where counterexample meaning genuinely does not apply |

`counterexample.source_refs` always resolve in the source-ID namespace, never the
case-ID namespace. Each ref must resolve to a `synthetic_counterexample` source
and the same case must contain a matching source relation with relation
`counterexample`. A case-to-case `counterexample_to` relation can preserve how
an exception, contest, or revision challenges an earlier case, but it does not
substitute for the exact source relation required by `known_present`. This
one-way rule avoids cyclic case identity derivation.

`not_applicable` cannot evade review for ordinary identity, disposition, value,
world-model, or behavior-interpretation candidates. Aggregate validation checks
status completeness, known-ref coverage, contradictory status/ref pairs,
missing refs, unrelated refs, and duplicate conflicting refs. A fixture never
fabricates a counterexample merely to satisfy coverage.

## 10. Candidate status, reuse, and correction semantics

The bounded statuses are:

| Status | Reuse meaning |
| --- | --- |
| `candidate` | Review remains required; no context-selection authority exists |
| `contested` | Disagreement and limitations remain visible; it cannot be presented as settled truth |
| `stale` | Silent reuse is prohibited; future use requires re-evaluation |
| `retracted` | Bounded synthetic lineage may remain, but accepted-context reuse and automatic revival are prohibited |
| `deleted` | Only a minimal tombstone/refusal may remain; rehydration, inference, reuse, and task-context selection are prohibited |

The `candidate_status` field is always explicit. A `candidate` member must use
`candidate`, `contested`, `stale`, or `retracted`; `deleted` is invalid for that
discriminant. A `tombstone` member must use `deleted`. A `refusal` member must
use `null` because the refused premise is not an admitted candidate; its
discriminant and reuse refusal prevent implicit candidate creation.

Reuse eligibility is a separate exact enum:

```text
review_required
re_evaluation_required
prohibited
```

Every case additionally requires persistence, task-context selection,
cross-project sharing, automatic revival, and rehydration authorization to be
false. `synthetic_content_retained` is permitted only for non-deleted fictional
material; a deletion tombstone requires it to be false.

No status represents actual user acceptance or endorsement. No status authorizes
persistence, task-context inclusion, cross-project sharing, Personal
Perspective transition, memory promotion, review action, publication, or any
external effect.

The exact refusal kinds are:

```text
false_premise
over_globalization
deleted_item_reuse
retracted_item_reuse
insufficient_source
scope_conflict
task_choice_globalization
```

A correction can preserve a narrower valid candidate while refusing the broad
claim. Refusal identity and lineage do not silently create a valid identity
candidate.

## 11. Future review expectations

A candidate may list interface expectations for a future separately authorized
review surface:

```text
endorse
correct
narrow_scope
add_exception
add_counterexample
defer
reject
retract
delete
inspect_source_and_revision_lineage
control_project_sharing
control_task_context_inclusion
```

These values describe expected interface capabilities only. They do not record
a completed decision, implement review replay, authenticate a user, persist
state, apply a transition, or select context. Any hypothetical outcome remains
explicitly synthetic and expected, never completed for a real user.

## 12. Non-authority boundary

Every admitted case is bound to the exact aggregate boundary below and includes
a bounded local non-authority summary. Every field is required to be `false`:

```text
actual_user_identity_established
personality_truth_assigned
user_endorsement_recorded
accepted_personal_perspective_created
personal_perspective_persisted
personal_vault_implemented
review_decision_created
semantic_transition_applied
evidence_created
accepted_memory_created
task_context_inclusion_authorized
hidden_context_injection_performed
cross_project_sharing_authorized
provider_or_model_called
external_actuation_authorized
work_closed
publication_authorized
github_merge_authorized
m3_pilot_executed
m3_completion_established
reviewed_reuse_established
outcome_improvement_established
candidate_is_review_decision
candidate_is_semantic_transition
candidate_is_evidence
candidate_is_accepted_memory
candidate_is_accepted_personal_perspective
persistence_authorized
automatic_personal_perspective_application
automatic_review_decision
semantic_state_commit_authorized
provider_execution_authorized
automatic_perspective_actor_promotion
evolutionary_fitness_selection_authorized
```

Unknown authority-shaped fields fail closed. A valid-looking payload that sets
one prohibited field to `true` remains invalid even when every identity and
fingerprint is correctly recomputed.

Every case also carries exact semantic assertion flags, all required to be
`false`:

```text
premise_admitted_as_candidate
over_globalized_claim_accepted
aspiration_treated_as_current_truth
tension_automatically_resolved
exception_proves_global_falsehood
model_agreement_treated_as_verification
repeated_observation_treated_as_endorsement
confidence_score_grants_authority
psychological_diagnosis_assigned
integrity_establishes_authenticity
observed_behavior_establishes_personality_truth
task_choice_establishes_global_identity
lower_scope_rewrites_higher_scope
counterexample_fabricated_for_coverage
contested_as_settled_truth
```

The preserved invariants are:

```text
Candidate != Decision
Decision != Transition
Context != Truth
Lab Diagnostic != Evidence
Model Inference != User Identity
Observed Behavior != Personality Truth
Task Choice != Global Identity Update
Personal Perspective != Project Truth
Lower-Scope Exception != Higher-Scope Rewrite
Arena Output != Personal Perspective Mutation
Synthetic Fixture != User Endorsement
Valid Contract != Persistence Authority
Casebook Inclusion != Task-Context Inclusion
```

## 13. Privacy, material, and retention boundary

The aggregate requires these exact meanings:

```text
all_content_synthetic = true
actual_personal_material_ingested = false
raw_transcript_collected = false
provider_received_personal_material = false
database_persistence_occurred = false
cross_project_reuse_occurred = false
task_context_injection_occurred = false
hidden_profile_created = false
real_data_deletion_enforcement_claimed = false
```

The validator blocks raw prompts, transcripts, hidden reasoning, terminal or
environment dumps, credential- or secret-shaped material, private key material,
private path shapes, home-directory references, file URIs, private URLs,
opaque secret-bearing values, and actual-personal-data markers. Validation
issues never echo unsafe caller-controlled values.

Only abstract fictional labels and minimal non-sensitive propositions appear in
committed fixtures. No owner biography, actual preference, actual value,
relationship, identity, health, affect, protected attribute, or psychological
claim is used.

Committed synthetic fixtures may be retained with repository history as
replayable Lab artifacts. This is not a claim that deletion of real user data
has been implemented or enforced. A deleted synthetic item retains only its
deterministic tombstone identity, deletion status, content-free tombstone
source, and non-reuse refusal. It has no content-bearing source or case ref and
the deleted proposition is absent everywhere in the valid normalized
aggregate. Any ref, summary, relation, or source catalog entry capable of
rehydrating the deleted proposition makes the aggregate invalid. Negative
fixtures may carry such forbidden content only as input that must be rejected;
it is never returned as valid normalized material.

The only admitted `synthetic_deletion_instruction` summary is the fixed
content-free statement: “A fictional deletion instruction requires non-reuse
of one abstract synthetic item; no deleted proposition is retained.” A
tombstone may reference only this source kind and may have no case relations.

The normalized retention boundary is exact:

```text
retention_class = committed_synthetic_fixture
real_user_data_retained = false
reusable_deleted_content_retained = false
deletion_semantics_scope = fictional_fixture_refusal_only
```

## 14. Normalization, identity, integrity, and bounds

Normalization is pure, versioned, idempotent, code-unit ordered, and independent
of locale, host paths, environment, current time, and random values.

| Collection class | v0.1 rule |
| --- | --- |
| Reproduction or method steps | Ordered; caller order is semantically meaningful |
| Source and case seeds | Semantically unordered but conflict-sensitive by `source_key` or `case_key`; exact duplicate seeds deduplicate deterministically, while same-key conflicting content fails closed |
| Normalized source and case envelopes | Built in code-unit `source_id` or `case_id` order after deterministic derivation; duplicate derived IDs in validation input are invalid even when an attacker repeats otherwise equal content |
| Source relations, case relations, scope qualifiers, counterexample refs, limitations, future review actions | Semantically unordered sets; exact duplicates are deduplicated, then code-unit or canonical-value sorted |
| Coverage matrix | Ordered by the fixed P01-P25 requirement list; each row's case refs are code-unit sorted and deduplicated |
| Conflicting duplicate refs or records | Fail closed; no last-write-wins behavior |
| Object keys | Canonical JSON ordering from the repository protocol primitive |

Strings are validated before semantic access. Normalization never truncates
caller material into validity and never drops an unknown field. Exact-boundary
positive fixtures and over-bound negative fixtures cover the limits below.

| Material | Maximum |
| --- | ---: |
| Title | 96 code units |
| Case summary or proposition | 512 code units |
| Rationale or semantic explanation | 768 code units |
| Scope qualifier | 320 code units |
| Source summary | 320 code units |
| Counterexample summary or justification | 320 code units |
| Limitation | 320 code units |
| Fixed experiment-list item text | 121 code units (the longest fixed v0.1 item) |
| Scope qualifiers per case | 8 |
| Limitations per case | 8 |
| Source relations per case | 16 |
| Case relations per case | 16 |
| Counterexample refs per case | 16 |
| Future review actions per case | 12 |
| Items in each experiment metadata list | 5 (the largest fixed v0.1 list; lists are not caller-extensible) |
| Total sources | 128 |
| Total cases | 64 |
| Coverage entries | 25 |
| Validation issues returned | 128 |

The Lab identity namespace is separate from Core record kinds:

```text
source ID:   ppscb-source-v0-1:<24 lowercase hexadecimal characters>
case ID:     ppscb-case-v0-1:<24 lowercase hexadecimal characters>
casebook ID: ppscb-v0-1:<24 lowercase hexadecimal characters>
fingerprint: sha256:<64 lowercase hexadecimal characters>
integrity algorithm: sha256_canonical_json_v0.1
```

Each ID suffix is the first 24 hexadecimal characters of a canonical SHA-256
digest under the versioned Lab namespace, with a type-specific prefix and
derivation payload. These prefixes and derivation payloads are casebook-specific;
they do not reuse the
TaskContextPacket namespace or make a new Core record kind.

Every stored integrity object also binds method version
`personal_perspective_casebook_deterministic_method.v0.1`, a bounded
human-readable fingerprint scope, and an omitted-fields list containing only
`integrity.fingerprint`.

Source ID derivation covers the casebook-version namespace, normalized
`source_key`, source kind, summary, and complete normalized scope. It omits its
own `source_id`, source relations, array position, authority boundary, and
integrity. The source fingerprint separately covers the complete normalized
source, including the derived ID, scope, synthetic/authenticity flags and
authority boundary, while replacing only its own stored fingerprint value with
the canonical omission marker.

Case ID derivation covers the casebook-version namespace, normalized
`case_key`, discriminant, semantic kind, epistemic origin, complete normalized
scope, proposition, tombstone ref, and refusal kind. It omits its own `case_id`,
title, summary, source/case relations, counterexample semantics, candidate
status, rationale, limitations, future review actions, reuse fields, semantic
assertions, non-authority summary, authority boundary, and integrity. Those
omitted fields remain integrity-bound by the case fingerprint.

Case fingerprint derivation covers the complete normalized case, including the
derived `case_id`, title, limitations, future review expectations, reuse
posture, and local non-authority summary, while omitting only its own stored
fingerprint value by replacing it with the canonical omission marker. This
binds review-relevant material without making it part of stable logical case
identity.

Casebook ID derivation covers the casebook-version namespace, semantic-definition
version, deterministic-method version, complete normalized experiment metadata,
ordered source IDs, ordered case IDs including refusals and tombstones, and the
aggregate authority boundary. It omits its own `casebook_id`, root
`defined_at` as an independent field, classification, semantic-definition
payload, coverage matrix, source/case
content beyond their IDs, privacy/retention boundaries, every stored
fingerprint value, and bounded validation output. Those omissions remain bound
by the aggregate fingerprint. The root `defined_at` is not a separate ID input,
but the same exact fixed value participates through the complete experiment
metadata.

The aggregate fingerprint covers the complete normalized envelope, including
the derived `casebook_id`, normalized Lab metadata, full normalized source
catalog, full normalized cases and case fingerprints, aggregate authority,
privacy, retention, and integrity algorithm/scope metadata. It omits only its
own stored aggregate fingerprint value by replacing it with the canonical
omission marker; bounded validation output is not part of the envelope.

No implicit timestamp participates. An explicit fixed fixture timestamp
participates only where the contract field is defined as semantic experiment
metadata. Array input order is omitted wherever the collection is declared
semantically unordered. All three IDs and the source, case, and aggregate
fingerprints are idempotent over normalized equivalent input.

Integrity is tamper evidence, not authenticity, identity, Evidence, review, or
authority. The validation suite pins a representative case ID/fingerprint, the
aggregate fingerprint, semantic version, valid count, and negative count as
regression anchors. Any intentional semantic or canonicalization change
requires a new reviewed contract version or an explicit anchor review.

## 15. Validator behavior and purity

The pure validator accepts `unknown` and returns a bounded structured result. It
does not throw for expected malformed input. It validates scalar types before
semantic access; strict allowed keys before normalization; unsafe material;
structure and bounds; IDs and references; semantics; and integrity as separate
layers.

Issues use deterministic codes, safe fixed messages, bounded counts, known
schema paths, and deterministic code-unit ordering. Structure, semantic,
unsafe-material, reference, and integrity failures remain distinguishable.
Semantic checks execute independently from fingerprint checks so a re-signed
invalid payload cannot pass and an invalid fixture is not rejected only because
its old fingerprint no longer matches.

An invalid aggregate returns no normalized admitted candidate result and reports
`admitted_candidate_count: 0`. The caller's input remains byte-equivalent to a deep
copy made before validation. Programming defects are not hidden behind a broad
catch-all; only expected malformed input is represented as validation issues.

Pure-library side effects and semantic dependencies are fixed at zero:

```text
database calls: 0
filesystem writes: 0
network, fetch, DNS, or socket calls: 0
provider or model calls: 0
child-process calls: 0
environment reads affecting semantics: 0
implicit clock reads: 0
random reads: 0
external actuation: 0
```

The CLI may load committed fixtures and print one bounded JSON summary. It does
not write generated fixtures, open a database, contact a provider, or persist
validation output.

## 16. Positive semantic inventory

The deterministic coverage matrix must map every row below to at least one
valid fixture. A single case may cover more than one row, but no row may be
unmapped.

| # | Required coverage |
| ---: | --- |
| 1 | Explicit synthetic descriptive self-understanding, bounded and review-required |
| 2 | Aspirational identity kept distinct from current descriptive behavior |
| 3 | Stable value or commitment with scope, possible tension, and no behavior guarantee |
| 4 | Scoped, revisable decision principle that is not an automatic policy |
| 5 | Jointly interpreted candidate with multiple sources and review required |
| 6 | Model-inferred candidate that never becomes accepted identity or task-context authority |
| 7 | Observed behavior separated from its candidate personality interpretation |
| 8 | Source-backed, scope-limited world-model candidate with explicit counterexample status |
| 9 | Contextual role with no workspace-global rewrite |
| 10 | Explicitly scoped relationship candidate with no sharing outside that scope |
| 11 | Persistent tension preserving both sides without forced resolution |
| 12 | Project-specific narrowing that preserves the broader candidate |
| 13 | Known exception with an exact relation and no higher-scope rewrite |
| 14 | `known_present` with an exact synthetic counterexample ref |
| 15 | `none_found` with bounded-search meaning and no impossibility claim |
| 16 | `not_searched` marked explicitly incomplete |
| 17 | Semantically valid and justified `not_applicable` |
| 18 | Contested interpretation preserving disagreement and no truth promotion |
| 19 | Stale candidate with lineage and reuse prohibited pending review |
| 20 | Retracted candidate with bounded lineage and reuse refused |
| 21 | Deleted-item tombstone with no reusable content and rehydration refused |
| 22 | False-premise refusal that creates no identity candidate |
| 23 | Over-globalization correction that refuses the broad claim and preserves a scoped candidate |
| 24 | One task choice represented only as task-specific observation while global inference is refused |
| 25 | Counterexample-driven revision candidate with traceable original and no automatic application |

The positive set also includes exact-boundary text and collection cases. All
names and situations are fictional and intentionally minimal.

## 17. Negative and adversarial inventory

The machine-checkable suite includes fail-closed fixtures for these categories:

- Contract and structure: non-object input, unsupported version, missing or
  unknown root/nested fields, malformed enums/timestamps/collections, oversized
  text/collections, duplicate or conflicting IDs, malformed IDs, mismatched
  source, case, or aggregate fingerprints, reorder equivalence, and input
  mutation.
- Source and privacy: missing/unresolved/malformed/conflicting source refs;
  prohibited raw prompt, transcript, hidden-reasoning, terminal/environment,
  credential/secret, key, private-path, home-reference, file-URI, private-URL,
  opaque-secret, and actual-personal-data material.
- Authority escalation: accepted-identity inference, behavior-to-personality
  promotion, task-choice globalization, integrity-as-authenticity,
  candidate-as-decision/transition/Evidence/memory/Perspective, persistence,
  Personal Vault, context injection, cross-project reuse, automatic application
  or decision, semantic commit, work close, publication, provider execution,
  external actuation, merge, automatic actor promotion, and fitness selection.
- Scope: fake personal project identity, lower-scope rewrite, role or task
  globalization, relationship leakage, contradictory/unknown parent scope,
  missing relation target, silent override, and cross-project personal leakage.
- Counterexample: missing, unresolved, unrelated, contradictory, incomplete,
  falsely complete, invalid `not_applicable`, unknown/missing status, and
  fabricated-coverage claims.
- Status and reuse: contested-as-settled, stale silent reuse, retracted selection
  or revival, deleted content retention/rehydration/context selection, and
  status loss during normalization.
- Semantic attacks: false-premise admission, unreviewed over-globalization,
  aspiration-as-current-truth, forced tension resolution, exception-as-global
  disproof, agreement-as-verification, repetition-as-endorsement,
  confidence-as-authority, mandatory provider fields, and psychological
  diagnosis presented as Personal Perspective truth.

Representative attacks recompute every deterministic ID and fingerprint after
mutation for:

1. model inference promoted to accepted identity;
2. deleted-item reuse;
3. hidden context injection;
4. fake personal project identity;
5. `known_present` without a valid counterexample relation;
6. task-specific observation promoted globally;
7. false-premise admission;
8. persistence authority; and
9. cross-project sharing authority.

Each re-signed fixture must fail for at least one intended non-integrity issue.
Every invalid fixture must report zero admitted candidates.

## 18. Reproduction and bounded output

Run:

```bash
npm run validate:vnext-personal-perspective-semantic-casebook-v0-1
```

The command exits nonzero if any assertion fails and otherwise prints bounded
machine-readable JSON containing:

```text
contract version
semantic definition version
Lab classification and synthetic-only status
positive and negative/adversarial counts
required coverage matrix result and deterministic requirement-to-case-key rows
invalid fixtures producing admitted candidates (required: 0)
representative case identity and fingerprint
aggregate fingerprint
determinism and collection-order equivalence
input immutability and issue ordering
re-signed semantic attack result
authority, privacy, and purity results
maturity claim boundary
```

Two consecutive invocations on unchanged source must produce byte-identical
stdout. Reordering semantically unordered input must normalize to the same bytes,
identities, fingerprints, and coverage summary when the input is otherwise
valid and semantically equivalent. Invalid-input issues remain deterministically
ordered for the exact malformed input; v0.1 does not claim index-independent
issue paths across arbitrary reorderings of different malformed inputs. The
command never prints unsafe fixture values.

## 19. Maturity interpretation and limitations

The full passing set supports exactly this move:

```text
before: Level 0 Intent
after: Level 1 Validated Contract
```

No individual type, JSON/TypeScript fixture, validator, passing case, command,
document, commit, or Draft PR establishes Level 1 on its own. The claim exists
only while the complete bounded suite passes together.

This slice does not implement or claim:

- deterministic Personal Perspective task-gap baseline completion;
- Personal Perspective review replay;
- bounded relevance or context-selection experiment completion;
- Personal Vault persistence architecture;
- structured multi-perspective review trials;
- Perspective Arena or Arena actors;
- candidate-to-gap-to-review replay;
- production integration, user endorsement, observed use, reviewed reuse, or
  outcome improvement.

Accordingly, Level 2 is not claimed. The casebook proves only that a fixed
synthetic semantic contract and its refusal boundaries are deterministic and
machine-checkable. It does not show that a user understands the model, that
future review UX is usable, that context selection is relevant, that deletion
works on real data, or that downstream outcomes improve.

Known v0.1 limitations include a deliberately small fixed ontology, abstract
English-language fixtures, no authenticated subject identity, no actual-user
material, no persistence or retention enforcement, no provider/model
interpretation, no UI, no runtime integration, no task-context consumer, and no
cross-project experiment. These limits prevent the contract from being treated
as a production profile or Personal Vault design.

## 20. Rollback, productization, and next gate

Rollback is deletion or revert of the Lab module, fixtures, validator command,
and this document. There is no data migration, durable state repair, DB cleanup,
user-data deletion, route compatibility action, or runtime rollback because the
slice creates none of those things.

Productization requires a separate reviewed architecture decision and later
program evidence. This casebook alone grants no implementation authority for a
Personal Vault, persistence, selective sharing, task-context fields, review
replay, UI, provider inference, or external use.

The one recommended next separately reviewed slice is:

> **Deterministic Personal Perspective Task-Gap Baseline v0.1**

That recommendation is not authorization and is not implemented here. Human
review of this bounded Level 1 claim comes first. Any real user-owned M3 pilot,
Personal Perspective pilot, or later reuse evaluation remains separate and
pending.
