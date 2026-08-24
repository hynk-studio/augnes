# ACGC E2R2P6 R1 reference-supersession live closeout

## Purpose and bounded scope

This document records the terminal R1 result from ACGC-E2R2P6R [Issue
#254](https://github.com/hynk-studio/augnes-perspective-lab/issues/254) and the
documentation-only ACGC-E2R2P6S closeout in [Issue
#255](https://github.com/hynk-studio/augnes-perspective-lab/issues/255).

The consumed R1 cohort ended `incomplete`. One complete block matched the
predeclared R1 relations, but the cohort terminated after call 5 and only one
of four frozen blocks completed. The run therefore establishes no R1 support
result.

The historical live run and this closeout have distinct provider-call counts:

```text
historical Issue #254 real_provider_calls = 6
P6S closeout real_provider_calls = 0
```

This closeout is documentation only. It does not rerun or replace R1, create
or execute R2, derive a completed cross-case result, or create product,
evidentiary, policy, or Stage 7 authority.

## Canonical source

The consumed cohort and this closeout baseline are bound to:

```text
repository = hynk-studio/augnes-perspective-lab
source = 0875125ce57f6999d05271872295ea684d85d20b
tree = f2f6b75ff8f1d810dd5eb623ebe16460358fc3e3
```

The source is the merge commit of P6Q [PR
#253](https://github.com/hynk-studio/augnes-perspective-lab/pull/253).

## Exact R1 contract and plan

The case and evaluator identities were:

```text
case id = operational-reentry-v04-stale-reset-replication-case:r1-reference-supersession-public-safe-01
case fingerprint = sha256:34070d5b174f7d9f7847a5fae5d9df05b7a584ca336322a1bb3af55f80346281
common evidence = sha256:aaa7cca07ac23e23571c4ca7d982708aea13706b28ace178b405f0569dcbceca
gate contract = sha256:7b14e199ac1ef71aaf4b3e9b2d3d611e60c0a780a21cc98df9b38295f8fd72b2
evaluator binding = sha256:813f0cf908f1f930ec75b6576d32ad390b8b4a81f11263d525a888d0aeb32f9a
```

The provider-boundary and replication identities were:

```text
route = sha256:a375bd9ef2d8c847e81d36eea9b829106ceba5a72e04528efde92b0e948f2bd7
provider contract = sha256:8f3ca3852ba92af1da46eab5dcf1d0bfb67a62c5fbaa4647ef00c2ef7b371394
adapter request route = sha256:1a9b3eee37310241f3e5c281bb20f6dce8a5a528b1ba1da54e188456a28fecd3
replication authorization contract = sha256:9ddc07d207e88fda14cd61f0ccaf5fc03f2801be5ecd79703cd9d5d2f5d26a3a
replication artifact family = sha256:263c5fa53e0acbc82942969a12c70c1a87b1b4f272dcb9112f47a006a9201a6f
```

The frozen plan was:

```text
plan version = operational_reentry_v04_stale_reset_replication_plan.v0.2
plan fingerprint = sha256:08958181c3084ced937a3de8c7ddd1a9743dbf03bde086dda9d678b51d79302a
call-slot namespace = ccr_namespace_86c86b9a1ca989dc0b769da70ec4dac5796197cb
block 0 = A B G C
block 1 = B C A G
block 2 = C G B A
block 3 = G A C B
parallel = 1
retries = 0
replacements = 0
adaptive stopping = false
```

The four plan-owned B/G witnesses were:

```text
block 0 = sha256:5a66772d8f3cedfc9d06cf225c9f42dc37d9a5bddc250ffef0a56a0fc6b0e1bf
block 1 = sha256:687468ecc007753004300e0e617868da8ff18cc08225ea3b93808db7ee3d9eec
block 2 = sha256:d1edb00185572e313c553db8dd36dbab137d24943225216f9876e784210daebe
block 3 = sha256:a57108e3eb1a104d95e8e30ca70edce293b30dca0609fdc434a862bea6c4d912
```

B/G provider equality is treatment integrity only. It is not behavioral
equivalence.

## Consumed candidate

The single-use authorization and pricing identities were:

```text
authorization id = e2r2p6r-issue-254-c38aecee-8f75-4cdc-83ed-8a5aa4d1d663
authorization protocol fingerprint = sha256:5e86f3cbb07c12c80322a63e35863c28916f7dda9c2b3cfae7f1e35a7534f449
authorization raw file SHA-256 = 4d08fb0eb7c818bf877659cd0843931cf86a3487db79c3bed41e82a51ec4f537
pricing protocol fingerprint = sha256:59eb51f0c8b5ec70f5e2bc64e87ac2901fa9acef4320bb7fab297d41e5edaf3e
pricing authority fingerprint = sha256:b40e86b9ac94025d56116f85601f71d2f5a6e6af30948e52e36c48de70d5897e
pricing raw file SHA-256 = 43e6888581dea9030edd1da59df5dd336fa2b8aa6a3985d957ef5b32cf278b7d
authorization consumed = true
authorization reusable = false
```

The derived cohort ID was:

```text
cross-case-replication-d9c6133a010e05a213784929e3ddfd76
```

The candidate, global and run-local consumption markers, cohort run, and
terminal artifacts remain ignored immutable historical material. This
closeout does not copy their bodies into tracked documentation.

## Terminal execution

One Gate B CLI invocation returned exit status `0`; the finite behavioral
result is nevertheless `incomplete`. The exact bounded accounting is:

```text
planned calls = 16
attempted provider calls = 6
completed live = 5
unattempted after hard stop = 10
retries = 0
replacements = 0
R1 case status = incomplete
artifact validation = valid
R2 result = none
cross-case disposition = incomplete
```

Calls 0 through 4 completed live. Their receipt fingerprints were:

```text
call 0 / block 0 / A = sha256:ae0d816c366fa9debc7518fc0e0ff8d6c43ba263f0a428048adedc62d0c3d9af
call 1 / block 0 / B = sha256:b6869140445bf6fa742a2d1e794680d42f908d0ff6e561bbb86f5d49b9469f5d
call 2 / block 0 / G = sha256:5441e94d742e0c23b549a5987412d3920cccf256611c0d9d86e12b90747f154d
call 3 / block 0 / C = sha256:74c421f2f7872f2d335acce9375f4e4fd6d1ebbf7702ba2d89d37e1131ed1352
call 4 / block 1 / B = sha256:945ff07972da86c2120eead2c7a96e8a37c52e7cd017a9990d613f3d6c4d8b9d
```

Call 5 terminated as:

```text
call order = 5
repeat block = 1
arm = C
terminal category = terminal_failure
terminal stage = gateway_invoke
egress attempted = true
provider calls used = 1
receipt fingerprint = sha256:4eba2d753d59a1acbc9dd8013138130d53b06b83190ba8dbda5ade3545446063
failure code = cross_case_replication_runtime_failure
rejected normalized output fingerprint = null
```

The persisted bounded artifact does not classify
`cross_case_replication_runtime_failure` more specifically. It is not
reinterpreted as provider rejection, provider incompatibility, model failure,
R1-C behavioral failure, or evidence against R1.

Calls 6 through 15 were not attempted after the hard stop:

```text
terminal category = not_attempted_after_hard_stop
terminal stage = hard_stop_suffix
egress attempted = false
provider calls used = 0
failure code = cross_case_replication_hard_stop
```

Their behavior is not reconstructed or imputed.

## Block observations

Block 0 completed all six direct comparisons:

| Pair | Target persistence | Common compliance | Bounded outcome |
| --- | --- | --- | --- |
| A-B | `left_persists_more` | `both_valid` | `equal` |
| A-C | `equal` | `both_valid` | `equal` |
| A-G | `left_persists_more` | `both_valid` | `equal` |
| B-C | `right_persists_more` | `both_valid` | `equal` |
| B-G | `equal` | `both_valid` | `equal` |
| C-G | `left_persists_more` | `both_valid` | `equal` |

The block-local predeclared matches were:

```text
R-H1 = true
R-H2 = true
R-H3 = true
R-H4 = true
R-H5 = true
```

Blocks 1, 2, and 3 are `incomplete`. Their R-H1 through R-H5 results are all
`not_comparable`. No block result is inferred from the partial calls in block
1, and there is no majority, scalar, dimension-counting, rank, or winner rule.

## Case interpretation

The exact finite case status is:

```text
case_status = incomplete
R1 support = not established
```

One complete block matched the predeclared R1 relations, but the cohort
terminated after call 5 and only one of four frozen blocks completed. The run
therefore establishes no R1 support result.

This statement is the maximum claim. It does not claim partial, probabilistic,
or majority support and does not predict the three missing blocks.

## Artifact identities

The immutable terminal artifact identities are:

```text
consumption marker = sha256:4416fa876fbcf09ab1099f6ad440d0f0bbe601c5a38aa296b9279e037a576793
manifest = sha256:58c1cdb93ee677954196c717b9a6ff29fdc70f313aea01c96166bf88120c6e8c
attempt = sha256:33ad09726529431cfb4c927467d7694d4d5988cc9c9233b923a2d8686e85844f
case status = sha256:6b55ccab86cc0058b594dd59a2d0a51d7878278c31faa010ebaac1501f5042e0
report = sha256:4a136b2c54ebb30e0f9e853e738e50b51eeccb093f5b049bd28c2590594e281e
terminal = sha256:6c312bed4882c6f8d43c9663f69c6946a2696ec4584678468cd315fadf479022
artifact index = sha256:13d51f1ecf6009eae598b975ca3334006d5f0d0e9dd53d569c6ceebccb13a379
artifact validation = valid
```

The global and run-local markers are equal, all sixteen call records and four
block records are present, and the merged replication artifact validator
accepts the truthful incomplete terminal family.

## Privacy and authority ledger

The validated historical Issue #254 artifacts record:

```text
raw prompts persisted = false
raw request bodies persisted = false
raw provider responses persisted = false
raw provider errors persisted = false
hidden reasoning persisted = false
credentials/full headers persisted = false
product/Core writes = 0
Evidence created = false
Proposal created = false
ReviewDecision created = false
Transition created = false
policy = false
scalar/rank/winner = false
Stage 7 = false
R2 created/executed = false
```

The P6S closeout makes no provider call and does not alter Issue #254, Issue
#251, or Issue #246 artifacts.

## Explicit non-claims

This closeout does not claim:

- `supported_consistent` or any partial, probabilistic, or majority R1 support;
- that the missing blocks would match block 0;
- a stale-reset, stale-relinquishment, or target-persistence effect;
- B/G behavioral equivalence;
- cross-case replication;
- general continuity or memory benefit;
- provider or model superiority;
- product benefit or harm;
- Evidence promotion, Proposal acceptance, ReviewDecision, or Transition;
- policy fitness;
- a scalar score, rank, winner, or promotion; or
- Stage 7 readiness.

## Downstream sequence

The terminal sequence is bounded:

```text
P6S documentation-only closeout merge
-> separate owner review of the incomplete R1 result
-> any R1 replacement or R2 issue requires new explicit authorization
```

No R1 replacement decision is made here. R2 remains uncreated and
unauthorized, its result is `none`, and the cross-case disposition remains
`incomplete`. This closeout creates no provider, replication, product,
Evidence, policy, Stage 7, publication, deployment, Ready, or merge authority.
