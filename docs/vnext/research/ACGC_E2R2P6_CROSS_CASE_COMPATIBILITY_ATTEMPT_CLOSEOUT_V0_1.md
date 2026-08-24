# ACGC E2R2P6 cross-case compatibility attempt closeout v0.1

## Role and scope

This document is the terminal historical record for ACGC-E2R2P6M
[Issue #246](https://github.com/hynk-studio/augnes-perspective-lab/issues/246)
and the documentation-only ACGC-E2R2P6O closeout in
[Issue #249](https://github.com/hynk-studio/augnes-perspective-lab/issues/249).
It records the single consumed v0.1 compatibility attempt without repairing,
replaying, completing, resealing, or reinterpreting its ignored local
artifacts.

The P6O closeout task makes zero provider/model calls. The historical Issue
#246 attempt made exactly `5` real provider calls. Those counts are separate:

```text
P6O closeout real_provider_calls = 0
historical Issue #246 real_provider_calls = 5
```

This document is compatibility/history material. It does not become product,
Core, protocol, sequencing, evaluation, Evidence, policy, or execution
authority.

## Exact P6O baseline and historical source

P6O begins from the exact P6N merge:

```text
repository = hynk-studio/augnes-perspective-lab
P6O canonical main = a88a1ee4b969f20b150b10eab5556ada6769e4c3
P6O canonical tree = 1c7942af5afa6b93bb5f377135a1ee250983151c
reviewed P6N head = f1863c18e2afad4ff2f960fe5266b9925c35cd2f
P6N issue = Issue #247
P6N pull request = PR #248
```

The consumed Issue #246 attempt ran only against this immutable historical
v0.1 source:

```text
historical source = 13011ea65e1b0b7a743fa2be61985b52dc5cf9c3
historical tree = 2cdf4f0adb425c369e5154d0361b86f42127ac6f
```

## Historical v0.1 contract identities

These are the identities used by Issue #246. They are not replaced by current
v0.2 identities:

```text
input = operational_reentry_stale_reset_cross_case_replication.v0.1
codec = operational_reentry_stale_reset_cross_case_replication_codec.v0.1
provider contract = operational_reentry_stale_reset_cross_case_replication_provider_contract.v0.1
response schema = operational_reentry_stale_reset_cross_case_replication_response_schema.v0.1
parser = operational_reentry_stale_reset_cross_case_replication_parser.v0.1
adapter = openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.1

route = sha256:e4accb480b586cc222a26a745fd9849873340ed1afe8c2e278776ce81f0305f0
provider contract fingerprint = sha256:0e52b84f5501f1cc16d8ffa495c2002aee6687831a0052adbb959870785b5606
adapter request route = sha256:4846007edc51781b915e90dfd7c971b911f885fb6dd79bccf91366cbb8b02f71
six-shape plan = sha256:a3069de56eb49e0238e62c30042d2620a0b9018f0639afa79fd322fa1bf3a4c0
parser closure = sha256:cb028c99a0131df150d1bb34736a99d15dc8d19c07d7fd664f971ed569f1921e
request/response bounds = sha256:15cf7971a71f2ec2d2c081e1cae2b595c17dba96e8e1e4f681106cc1a6110f52
R1 B/G witness = sha256:331817745e4c6aeba3d53bde640d9ec9ab0daf606c5aef2332c4a7db8d2382df
R2 B/G witness = sha256:dbc99ab9d74573c8a08092edcf1cade8d251f36dac7569631dfdb3389c930564
```

## Consumed authorization and pricing

```text
authorization ID = e2r2p6m-issue-246-d7b53a8c-b64a-4735-843a-3db1bb3c06ef
authorization protocol fingerprint = sha256:8ad47ca2d0327e305b876eb7d2bb95a93559b20d59b2c167296defab9366b854
authorization raw file SHA-256 = 63f59ca73c265bc927f1d9bbd4eaf80edd602a8bf407ad7e660646cb3c21cb5f
pricing protocol fingerprint = sha256:46e55ee78b9d036523acbcc9897f8c3ed2cd4d3c8c665b75fba8aeaaf1200567
pricing raw file SHA-256 = b55f993af86951b8df27d0970213d4e3d6491dd00e57359bbc254c52f1d0e043
pricing authority fingerprint = sha256:ceeae672fd4bcea4db6d22c3d8819a35b15778407b0db6d3c3c1bc40442ea02c
```

The authorization was consumed exactly once and is permanently non-reusable.
Neither the candidate pair nor any successful call is authority or input for a
replacement attempt.

## Exact bounded execution observations

```text
Gate B CLI invocation count = 1
CLI exit status = 1
planned shapes = 6
attempted provider calls = 5
completed live = 4
unattempted = 1
retries = 0
replacements = 0
compatibility result = not_compatible_or_incomplete
```

| Slot | Shape | Bounded terminal observation |
| --- | --- | --- |
| 0 | R1-A | `completed_live`; provider egress attempted; provider calls used `1` |
| 1 | R1-B | `completed_live`; provider egress attempted; provider calls used `1` |
| 2 | R1-C | `completed_live`; provider egress attempted; provider calls used `1` |
| 3 | R2-A | `completed_live`; provider egress attempted; provider calls used `1` |
| 4 | R2-B | Provider egress occurred and used `1` call; local post-invoke acceptance failed with `cross_case_replication_normalized_output_invalid` |
| 5 | R2-C | Not attempted after the terminal failure |

R2-B was not a provider rejection. The absence of its terminal shape file is a
harness failure, not permission to infer a provider outcome or reconstruct a
record.

## Immutable partial-artifact inventory

Only repository-relative ignored namespaces are named here. Their contents
remain local and untracked:

```text
candidate = .augnes-lab/operational-reentry-stale-reset-cross-case-compatibility-probes/candidate-authorizations/issue-246/
global marker = .augnes-lab/operational-reentry-stale-reset-cross-case-compatibility-probes/authorization-consumptions/8ad47ca2d0327e305b876eb7d2bb95a93559b20d59b2c167296defab9366b854.json
run root = .augnes-lab/operational-reentry-stale-reset-cross-case-compatibility-probes/cross-case-compatibility-8ad47ca2d0327e305b876eb7d2bb95a9/issue-246/
```

The global and run-local consumption markers are byte-identical and single
use. The bounded seals are:

```text
consumption marker fingerprint = sha256:f5e12f1612b02e151f5cb99a5a700d7a6e98bc51efac288e755e9a722291fbe0
manifest fingerprint = sha256:e5c654f89f6a8beb8defa171ff6bd71a9951b5eadbe60c233d978a7093d22bac
```

The four existing completed-live records are:

| Shape | Shape-record fingerprint | Receipt fingerprint |
| --- | --- | --- |
| R1-A | `sha256:f86ab9b9d116b201eba882548c04aeaf8d0cd548a203480f217bb5b6110556e5` | `sha256:7c9b88a5ba82a1004d7661ba46091fe2e79191be6f9133fa77021392ae39475e` |
| R1-B | `sha256:8c95a60a90528f6a604f5457990f81a290b29bd93e8ca746a053e1cc8d1bf9dc` | `sha256:cd92b05b58ea50fe7f6166170dd097d8a4612d069e3b1c7393ed3ae9b590b980` |
| R1-C | `sha256:a46acf4130c99840931e65acf761a76dc8026122325ec63a8f6ade7938754d75` | `sha256:c85bcc78bf86eee6ccaa1ef6d98e58925855cdffe804d28b8556b64b2f583b45` |
| R2-A | `sha256:87176aefce66bf262168ca252bd8c35c3a7358ba618e1a4c36fc4fb3b3bd5e39` | `sha256:26a02b448474c1b83fab208eb7cb8e669e9306a8963495862299f76f69e1ca6f` |

The historical family is structurally incomplete and invalid. These files do
not exist:

```text
shape-4.json
shape-5.json
report.json
terminal.json
artifact-index.json
```

Therefore:

```text
artifact validation = invalid / structurally incomplete
report fingerprint = unavailable
terminal fingerprint = unavailable
artifact-index fingerprint = unavailable
```

Those unavailable fingerprints are not zero, unknown substitutes, or values
to reconstruct. Existing bounded seals and privacy checks do not make the
overall bundle valid.

## Root-cause classification

The exact bounded classification is:

> protocol-invalid/incomplete live compatibility attempt exposing a
> contract/harness defect

The attempt exposed three linked v0.1 defects:

1. B/G provider schemas removed the target reference but retained
   target-specific action and limitation choices.
2. Exhaustive closure ended at wire parsing instead of requiring every parsed
   result to pass the production normalized-output validator.
3. The post-invoke local normalized-output rejection escaped before failed and
   hard-stop shape records, report, terminal, and artifact index could be
   persisted.

This classification explains why the attempt is incomplete. It is not
evidence of provider incompatibility.

## Maximum claim

The strongest claim carried by this closeout is:

> The single consumed v0.1 six-shape compatibility attempt was
> protocol-invalid and incomplete because the provider-visible B-shape
> contract admitted a locally contradictory normalized output and the runner
> failed to terminalize the post-invoke rejection. Four shapes completed live
> and a fifth reached provider egress, but the attempt establishes neither
> complete provider-contract compatibility nor provider incompatibility. P6N
> corrected the contract and terminalization prospectively in v0.2; a fresh
> replacement probe remains separately unauthorized.

## Corrected v0.2 lineage — prospective successor only

P6N merged the corrected zero-egress implementation at
`a88a1ee4b969f20b150b10eab5556ada6769e4c3`. The current identities are:

```text
input = operational_reentry_stale_reset_cross_case_replication.v0.2
codec = operational_reentry_stale_reset_cross_case_replication_codec.v0.2
provider contract = operational_reentry_stale_reset_cross_case_replication_provider_contract.v0.2
response schema = operational_reentry_stale_reset_cross_case_replication_response_schema.v0.2
parser = operational_reentry_stale_reset_cross_case_replication_parser.v0.2
adapter = openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.2

route = sha256:a375bd9ef2d8c847e81d36eea9b829106ceba5a72e04528efde92b0e948f2bd7
provider contract fingerprint = sha256:8f3ca3852ba92af1da46eab5dcf1d0bfb67a62c5fbaa4647ef00c2ef7b371394
adapter request route = sha256:1a9b3eee37310241f3e5c281bb20f6dce8a5a528b1ba1da54e188456a28fecd3
six-shape plan = sha256:b053fd22ceebb7c171b298a965df04b8eafb4b13162384abf6f036ab5f24b60c
parser/semantic closure = sha256:c12bdf89837a01f12357e93b246b243003f2ab7867198c78f3c5b7c021b2ec16
request/response bounds = sha256:6dd47c59384797f2099d5bcf84d2354d839d93dc0372d9efc0aa2f02576874d2
R1 B/G witness = sha256:5a66772d8f3cedfc9d06cf225c9f42dc37d9a5bddc250ffef0a56a0fc6b0e1bf
R2 B/G witness = sha256:490c144148e8ecccbaaf916df414d1f05ea4bf51430ef9e7b1eab5a06622813b
compatibility authorization contract = sha256:d235ffc1141604a0a3b8226d1d2cd0b58d3bb3a84efa19b78ade391c19facbe2
compatibility artifact family = sha256:5d5f16243a6cbba98d99c7e6945c38285fd40181b6ec316dae40c75ce1ebc929
```

The complete corrected semantic-closure cardinalities are:

```text
R1-A = 65536
R1-B = 4096
R1-C = 65536
R2-A = 65536
R2-B = 2048
R2-C = 65536
aggregate = 268288
```

P6N made `0` real provider calls. It establishes corrected implementation and
deciding zero-egress verification only. It does not establish v0.2 live
compatibility and does not authorize a replacement probe.

## Privacy and authority ledger

The historical manifest records
`raw_or_private_material_persisted = false`. Every existing shape record
records these flags as `false`:

```text
raw_prompt_persisted
raw_request_body_persisted
raw_provider_response_persisted
raw_provider_error_persisted
hidden_reasoning_persisted
```

This closeout reproduces no normalized output, prompt, request, provider
response or error, hidden reasoning, credential, header, cookie, private
absolute path, or private artifact body. It creates no product/Core or
TaskContextPacket write, Evidence, Proposal, ReviewDecision, Transition,
policy, scalar, rank, winner, promotion, or Stage 7 state.

## Explicit non-claims

This closeout does not claim:

- v0.1 compatibility or v0.1 provider incompatibility;
- R2-B provider rejection, model failure, or provider/model quality;
- R1 or R2 target persistence;
- stale-reset evidence or B/G behavioral equivalence;
- cross-case replication;
- general memory, continuation, product benefit, or product harm;
- Evidence promotion or policy fitness;
- scalar fitness, rank, winner, or promotion;
- Stage 7 readiness.

Four completed live calls and one additional egress observation are historical
execution facts only. They are not behavioral evidence and may not be reused.

## Downstream sequence

The only current sequence is:

```text
P6O docs-only closeout merge
-> separately decide whether to create a v0.2 replacement compatibility issue
-> fresh Gate A candidate
-> exact candidate review
-> fresh Gate B
-> terminal review
-> v0.2 compatibility closeout
-> only then consider an R1 live behavioral issue
```

No replacement compatibility, R1, or R2 issue exists at this closeout. Any
replacement probe must make all six provider calls fresh under a new issue,
candidate, authorization, pricing authority, consumption marker, and run root.
R1 does not authorize R2, and no downstream step follows automatically from
this document or its eventual merge.

Replication live, product transfer, policy, and Stage 7 remain false. Issue
#205 remains separate/open, and PR #186 remains historical Draft HOLD. Proof is
review material, not approval or merge authority.
