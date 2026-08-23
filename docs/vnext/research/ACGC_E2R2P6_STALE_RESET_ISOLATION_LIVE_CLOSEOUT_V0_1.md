# ACGC E2R2P6 stale-reset isolation live closeout v0.1

## Role and scope

This document is the terminal documentation record for ACGC-E2R2P6I
[Issue #239](https://github.com/hynk-studio/augnes-perspective-lab/issues/239)
and the docs-only ACGC-E2R2P6J closeout in
[Issue #240](https://github.com/hynk-studio/augnes-perspective-lab/issues/240).
It records one already completed bounded synthetic experiment. It is later
evidence under the historical v0.1 and v0.2 designs; it does not rewrite those
designs or create product, Core, policy, replication, or Stage 7 authority.

No provider/model call was made by this closeout task. The historical Gate B
cohort made exactly `16` real provider calls under its consumed single-use
authorization.

## Exact source and authorization

The cohort ran from the exact merged P6H source:

```text
repository = hynk-studio/augnes-perspective-lab
main = 858e06d210d4be7de6f0300adad15fd4d9e9015d
tree = ba61956af10195abd01127ec514afb5cf9e3fe04
reviewed P6H implementation head = 51bad6695c6780732dfc3b954878041880427891
```

The exact consumed authorization and pricing identities are:

```text
authorization id = e2r2p6i-issue-239-471e932a-fa45-43ef-9b93-efeee644fb3c
authorization fingerprint = sha256:0881442af13098781f0677d6a6aabf79f4950d7ef6d3cdbec3a62ebec0a8ea9c
authorization expiry = 2026-08-23T10:18:13.034Z
pricing fingerprint = sha256:9162068642e95756d2f3c9268403031ff63616287fcf1b9f322db6eb8b5f3a49
pricing authority fingerprint = sha256:5c3483d004403340dbeb75b5a4ddbbc3ff8dbf2255290dbca08e231f1818df16
```

The authorization was consumed exactly once and remains permanently spent.
It is not authority for a retry, replacement, replication, or second cohort.

## Exact execution envelope and terminal result

The frozen serial order was:

```text
block 0 = A B G C
block 1 = B C A G
block 2 = C G B A
block 3 = G A C B
```

The terminal execution truth is:

```text
Gate B invocation count = 1
live CLI exit status = 0
completion status = complete
planned calls = 16
attempted provider calls = 16
completed live calls = 16
unattempted after hard stop = 0
hard stop = none
maximum parallel provider calls = 1
retries = 0
replacements = 0
adaptive stopping = false
fresh stateless invocation per call = true
conversation reuse = false
thread reuse = false
previous-response reuse = false
artifact validation = valid
```

## Terminal artifact identities

Only stable relative identities and fingerprints are recorded here. Ignored
artifact contents and normalized model outputs remain local and untracked.

```text
cohort id = operational-reentry-v04-stale-reset-isolation_60676aab8c3ee098784b436eac75a16e
cohort fingerprint = sha256:3cd31687dc63d3f9efec9153d9854f22ba4d2604c938ffa3b867a1fa233e5731
report fingerprint = sha256:03bdd57cc9bc0644f5abffe2dcd36e5a097b601d7667879b5b7e52a4ba55c85b
terminal fingerprint = sha256:0c231bbed87502727d3db11dd4174827c73689c9f72c1b25babf9711b2fe1b05
artifact-index validator fingerprint = sha256:cfd59db7e92122b10713966ed79785bb7b6ea90b8fe1825ac3a295d9041d8b9e
artifact-index embedded integrity = sha256:fe72e4ea14ed1e8fdedcc43bd7b4ae65b25982a00cb75ea02491bc1d77c7da0a
artifact count = 29
consumption-marker validation = valid
```

The repository-relative run root is
`.augnes-lab/operational-reentry-v04-stale-reset-isolation-cohorts/operational-reentry-v04-stale-reset-isolation_60676aab8c3ee098784b436eac75a16e/issue-239`.
The permanent global marker is
`.augnes-lab/operational-reentry-v04-stale-reset-isolation-cohorts/authorization-consumptions/sha256_0881442af13098781f0677d6a6aabf79f4950d7ef6d3cdbec3a62ebec0a8ea9c.json`.

## Direct-pair matrix

All four blocks were complete. Every block evaluated all six pairs directly;
no pair relation was inferred transitively. The compact matrix below is
lossless across blocks `0 / 1 / 2 / 3`.

| Pair | Target persistence, blocks 0 / 1 / 2 / 3 | Common compliance | Bounded outcome | Whole output, blocks 0 / 1 / 2 / 3 |
| --- | --- | --- | --- | --- |
| A-B | `left_persists_more` / `left_persists_more` / `left_persists_more` / `left_persists_more` | `both_valid` in 4/4 | `equal` in 4/4 | `distinct` / `distinct` / `distinct` / `distinct` |
| A-C | `left_persists_more` / `left_persists_more` / `left_persists_more` / `left_persists_more` | `both_valid` in 4/4 | `equal` in 4/4 | `distinct` / `distinct` / `distinct` / `distinct` |
| A-G | `left_persists_more` / `left_persists_more` / `left_persists_more` / `left_persists_more` | `both_valid` in 4/4 | `equal` in 4/4 | `distinct` / `distinct` / `distinct` / `distinct` |
| B-C | `right_persists_more` / `right_persists_more` / `right_persists_more` / `right_persists_more` | `both_valid` in 4/4 | `equal` in 4/4 | `distinct` / `distinct` / `distinct` / `distinct` |
| B-G | `equal` / `equal` / `equal` / `equal` | `both_valid` in 4/4 | `equal` in 4/4 | `equal` / `distinct` / `distinct` / `distinct` |
| C-G | `left_persists_more` / `left_persists_more` / `left_persists_more` / `left_persists_more` | `both_valid` in 4/4 | `equal` in 4/4 | `distinct` / `distinct` / `distinct` / `distinct` |

The pair orientation is literal: `left_persists_more` means the left arm in
the pair persisted more, and `right_persists_more` means the right arm did.

The predeclared directional summaries are:

```text
A/B fresh positive-control direction = A persists more, 4/4
B/C metadata-only stale persistence direction = C persists more, 4/4
B/G target-persistence equality = equal, 4/4
C/G substrate-gating-associated direction = C persists more, 4/4
B/G whole-output relation = 1 equal / 3 distinct
```

## Bounded interpretation

### H1 — fresh-target positive control

H1 is supported in this exact synthetic intervention. All four A/B records
show A persisting more than B, while common compliance is `both_valid` and the
bounded outcome relation is `equal`.

### H2 — metadata-only stale-target downstream persistence

H2 is supported in this exact synthetic intervention. All four B/C records
show C persisting more than B. This is based on post-provider structured
observations. Mere C provider-input presence is not treated as behavioral
persistence.

### H3 — gated target-specific equivalence to absence

H3 is supported only at the predeclared target-persistence evaluator level in
this exact intervention. All four B/G records show equal target persistence.
Whole-output behavior was equal in one block and distinct in three, so B and G
are not claimed to be globally or semantically identical.

The required distinctions are:

```text
provider-request equality != raw-output equality
target-persistence equality != whole-output equality
```

### H4 — bounded substrate-gating-associated difference

H4 is supported in this exact synthetic intervention. All four C/G records
show C persisting more than G. C and G share the frozen stale upstream target
and relation, while G alone excludes both before provider materialization.
This is bounded intervention-associated evidence for the declared
substrate-gating contrast, not evidence of a universal causal mechanism.

### H5 — independent compliance and outcome gates

H5 remains preserved as designed. All 24 direct pairs report common
compliance `both_valid` and bounded outcome `equal`. Those gates remain
analytically independent from target-persistence direction.

## Maximum claim

The strongest claim carried by this closeout is:

> The exact frozen synthetic intervention produced repeatable bounded evidence
> that pre-materialization substrate gating removed the stale-target downstream
> persistence signature observed under metadata-only stale presentation, while
> matching target-absence behavior on the predeclared target-persistence
> evaluator.

Equivalently, the result is a bounded substrate-gating-associated
target-persistence difference in this exact synthetic intervention.

## Cost

```text
exact total cost = 10041600 nano-USD
authorized conservative worst case = 187187200 nano-USD
authorization ceiling = 250000000 nano-USD
```

Every attempted call had numeric persisted exact cost, so the total is an
exact sum rather than an unknown or zero substitute.

## Privacy and authority ledger

The validated terminal index records every prohibited persistence flag as
`false`:

```text
raw_prompt_persisted
raw_request_body_persisted
raw_provider_response_persisted
raw_provider_error_persisted
hidden_reasoning_persisted
credentials_or_full_headers_persisted
private_absolute_paths_persisted
product_database_rows_persisted
core_records_persisted
task_context_packet_variants_persisted
proposals_decisions_transitions_or_policy_persisted
scalar_rank_winner_persisted
tracked_repository_files_written
```

No raw prompt, request body, provider response/error, normalized output,
hidden reasoning, credential, header, cookie, or private ignored artifact
content is reproduced in this document.

## Explicit non-claims

This closeout does not claim general memory improvement or harm, general
continuation benefit, a universal causal mechanism, product-history actual
use, support validation, product outcome association, causal contribution in
product history, provider/model superiority, policy or actor fitness, scalar
fitness, rank, winner, automatic strategy acceptance, or Stage 7 readiness.

The result creates no Evidence promotion, Proposal, ReviewDecision,
Transition, product/Core mutation, policy activation, publication, deployment,
Ready, merge, or auto-merge authority.

## Terminal lifecycle

- E2R2P6F / Issue #235 / PR #236 is Completed.
- E2R2P6H / Issue #237 / PR #238 is Completed at merge
  `858e06d210d4be7de6f0300adad15fd4d9e9015d`.
- E2R2P6I / Issue #239 is terminal-complete after one consumed authorization
  and one validated cohort; it remains open pending the reviewed closeout PR.
- E2R2P6J / Issue #240 is Current while its closeout PR remains Draft.

Replication is unauthorized. Policy is unauthorized. Stage 7 is
unauthorized. No automatic successor research issue exists. Any replication,
extension, or downstream use requires a new separately reviewed issue and
explicit authority.
