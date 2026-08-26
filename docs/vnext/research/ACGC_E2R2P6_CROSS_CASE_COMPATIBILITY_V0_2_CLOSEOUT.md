# ACGC E2R2P6 cross-case compatibility v0.2 closeout

## Purpose and bounded scope

This document records the terminal provider-contract compatibility result from
ACGC-E2R2P6P [Issue #251](https://github.com/hynk-studio/augnes-perspective-lab/issues/251)
and the documentation-only ACGC-E2R2P6Q closeout in
[Issue #252](https://github.com/hynk-studio/augnes-perspective-lab/issues/252).

The P6Q closeout task makes no provider or model call. The historical Issue
#251 run made exactly six real provider calls. These counts are distinct:

```text
historical Issue #251 real_provider_calls = 6
P6Q closeout real_provider_calls = 0
```

This closeout records provider-contract compatibility for one exact sealed
synthetic probe. It does not execute, authorize, or evaluate either R1 or R2
behavioral replication.

## Canonical source

The compatible run and this closeout baseline are bound to:

```text
repository = hynk-studio/augnes-perspective-lab
source = 746b00c5baf90c39614b3878609cde5718a9d7c4
tree = 382ad2d0fb3e025d99a0abaa067b8929680be3d4
```

The source is the merge commit of P6O [PR
#250](https://github.com/hynk-studio/augnes-perspective-lab/pull/250).

## Exact v0.2 contract

The provider-boundary versions were:

```text
input = operational_reentry_stale_reset_cross_case_replication.v0.2
codec = operational_reentry_stale_reset_cross_case_replication_codec.v0.2
provider contract = operational_reentry_stale_reset_cross_case_replication_provider_contract.v0.2
response schema = operational_reentry_stale_reset_cross_case_replication_response_schema.v0.2
parser = operational_reentry_stale_reset_cross_case_replication_parser.v0.2
adapter = openai_responses_operational_reentry_stale_reset_cross_case_replication_adapter.v0.2
compatibility probe = operational_reentry_stale_reset_cross_case_compatibility_probe.v0.2
compatibility authorization = operational_reentry_stale_reset_cross_case_compatibility_probe_authorization.v0.2
provider = openai
model = gpt-4.1-mini-2025-04-14
```

The sealed contract identities were:

```text
route = sha256:a375bd9ef2d8c847e81d36eea9b829106ceba5a72e04528efde92b0e948f2bd7
provider contract = sha256:8f3ca3852ba92af1da46eab5dcf1d0bfb67a62c5fbaa4647ef00c2ef7b371394
adapter request route = sha256:1a9b3eee37310241f3e5c281bb20f6dce8a5a528b1ba1da54e188456a28fecd3
six-shape plan = sha256:b053fd22ceebb7c171b298a965df04b8eafb4b13162384abf6f036ab5f24b60c
semantic closure = sha256:c12bdf89837a01f12357e93b246b243003f2ab7867198c78f3c5b7c021b2ec16
request/response bounds = sha256:6dd47c59384797f2099d5bcf84d2354d839d93dc0372d9efc0aa2f02576874d2
compatibility authorization contract = sha256:d235ffc1141604a0a3b8226d1d2cd0b58d3bb3a84efa19b78ade391c19facbe2
compatibility artifact family = sha256:5d5f16243a6cbba98d99c7e6945c38285fd40181b6ec316dae40c75ce1ebc929
```

The underlying case and common-evidence identities remained:

```text
R1 case = sha256:34070d5b174f7d9f7847a5fae5d9df05b7a584ca336322a1bb3af55f80346281
R1 common evidence = sha256:aaa7cca07ac23e23571c4ca7d982708aea13706b28ace178b405f0569dcbceca
R2 case = sha256:7333d042334b833ac61976e3a39ad563bff4b55136e73e0b4b5a361a642186b7
R2 common evidence = sha256:95e08b828af3c966da9eecdd1954014b88cd70a69c2c415a45bf23ca1aefd351
```

The corrected zero-egress B/G witnesses were:

```text
R1 B/G witness = sha256:5a66772d8f3cedfc9d06cf225c9f42dc37d9a5bddc250ffef0a56a0fc6b0e1bf
R2 B/G witness = sha256:490c144148e8ecccbaaf916df414d1f05ea4bf51430ef9e7b1eab5a06622813b
```

## Consumed candidate

The single-use authorization and pricing were:

```text
authorization id = e2r2p6p-issue-251-d0927e88-7634-4ed9-bc81-a4fb593466ce
authorization protocol fingerprint = sha256:1c3176315578dbbbba88e229a025d046375e417cf52a9fb551f979cba911b1c0
authorization raw file SHA-256 = 8f6daa315c9ebd86a66887eacfea9025c3f63831df6418084116cfd46df8c2c3
pricing protocol fingerprint = sha256:5ca22473a225b75c3f991fc1d097fbf707e6584aadc1e1bfcf8ff498e9fe1b39
pricing authority fingerprint = sha256:a73f4edff0f5fa5d39cab8ce4046a3661a071d112cf1505c44be9c5826b9080f
pricing raw file SHA-256 = e15fd6ad7884e3f6f2b91d428a2b9a184ba6a044f5129375e07331373acdaa1b
authorization consumed = true
authorization reusable = false
```

The candidate, global consumption marker, run-local marker, and complete run
artifacts remain ignored local historical material. This closeout does not
copy their bodies into tracked documentation.

## Terminal execution

One Gate B CLI invocation completed with exit status `0`. The exact bounded
accounting is:

```text
compatibility result = compatible
artifact validation = valid
planned shapes = 6
attempted provider calls = 6
completed live = 6
unattempted = 0
retries = 0
replacements = 0
fresh provider calls = 6
```

The serial terminal history was:

| Order | Shape | Terminal category | Terminal stage | Egress | Provider calls | Failure | Rejected-output fingerprint |
| ---: | --- | --- | --- | --- | ---: | --- | --- |
| 0 | R1-A | `completed_live` | `completed_live` | true | 1 | `null` | `null` |
| 1 | R1-B | `completed_live` | `completed_live` | true | 1 | `null` | `null` |
| 2 | R1-C | `completed_live` | `completed_live` | true | 1 | `null` | `null` |
| 3 | R2-A | `completed_live` | `completed_live` | true | 1 | `null` | `null` |
| 4 | R2-B | `completed_live` | `completed_live` | true | 1 | `null` | `null` |
| 5 | R2-C | `completed_live` | `completed_live` | true | 1 | `null` | `null` |

No Issue #246 call or terminal record was reused. Every Issue #251 provider
call was fresh.

## Receipt and artifact identities

The six bounded receipt fingerprints were:

```text
R1-A = sha256:9ad37ca577d6b41d25582da5be12e03cb0fac22ae7059d5745ba64c840dcbbff
R1-B = sha256:9a8df3ce6bd8c6c5020f97b15543e33700fdcc4064bce994b8d967bccef5f5f1
R1-C = sha256:39e08c54d8624d4e21978bb9cc9a8f6d38dc28af9313abbdf61c1553a909710e
R2-A = sha256:af268e0afc9244fea07b45e03ddfbd3ec23deb1b86a99b3f5d416a030bf94b16
R2-B = sha256:bd2b671b59762665271b08f42ebd3fcda73b85f2064ec51fccaf7b7ba82e6661
R2-C = sha256:0f99169f3ac2c2060fb8f628fa31dff8d7b10d9e5f7f24aeb1c705801e36b11e
```

The complete artifact family identities were:

```text
consumption marker = sha256:0077a7d4bdb620ff590be08a0228a7d9f88b907853e8aba2e4e50f6b39c5407b
manifest = sha256:f32955edb035ccd4edc0b7c5cb6064e458fccaabe4820cee9248b9625c5cd167
report = sha256:cd857a319102b9bc647945dba037f149359f969709930df44f9b65d2f944330a
terminal = sha256:cc5f393217b9ad7eecab57a9cdd433bc02fd305ef31107182eb4d3d59fbb5f36
artifact index = sha256:439e0e7722444edcbac5c2acf49b85bdfa2a0cbf8cca84f84a6dce19b6b9e6c2
artifact validation = valid
```

The global and run-local consumption markers are present and equal. The six
shape records, report, terminal record, and artifact index are present and
accepted by the merged v0.2 artifact validator.

## Semantic closure and bounds

The exhaustive schema-to-parser-to-production-validator closure cardinalities
for the live shapes were:

```text
R1-A = 65536
R1-B = 4096
R1-C = 65536
R2-A = 65536
R2-B = 2048
R2-C = 65536
aggregate = 268288
```

The frozen request and response bounds were:

```text
maximum dynamic provider material = 3224 / 10240 bytes
maximum canonical request = 6499 / 24576 bytes
maximum canonical wire response = 698 / 1168 bytes
max output tokens = 1168
store = false
```

## Maximum compatibility claim

The corrected v0.2 cross-case provider contract is compatible with the pinned
OpenAI Responses route for the exact sealed six-shape synthetic compatibility
probe: all six fresh shapes completed live in one authorization-consumed serial
run with retry/replacement `0/0`, and the merged v0.2 artifact validator
accepted the complete terminal history.

This claim is provider-contract compatibility only.

## Privacy and authority ledger

The validated historical Issue #251 artifacts record:

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
```

The P6Q closeout changes documentation only. It makes no provider call, writes
no product/Core state, and does not alter the Issue #251 or historical Issue
#246 artifact families.

## Explicit non-claims

This closeout does not claim:

- R1 or R2 hypothesis support;
- stale reset or stale relinquishment;
- a target-persistence effect;
- B/G behavioral equivalence;
- cross-case replication;
- general memory or continuity benefit;
- causal benefit;
- provider or model superiority;
- product benefit or harm;
- Evidence promotion, Proposal acceptance, ReviewDecision, or Transition;
- policy fitness;
- a scalar score, rank, winner, or promotion; or
- Stage 7 readiness.

The compatible responses are provider-contract observations, not behavioral
evidence.

## Historical v0.1 separation

Historical Issue #246 remains a separate closed v0.1
protocol-invalid/incomplete contract/harness attempt. Its candidate,
authorization, pricing, consumption marker, partial run root, and four
completed calls remain immutable and are not repaired, reused, or
reinterpreted by this v0.2 result.

## Downstream sequence

The sequence remains strictly bounded:

```text
P6Q documentation-only closeout merge
-> only then a separately authorized R1 live-only issue may be created
-> R1 terminal review
-> only then may the owner decide whether R2 should be authorized
```

Successful v0.2 provider compatibility does not itself authorize R1 or R2.
No R1 or R2 live issue exists at this closeout, and no behavioral replication,
product transfer, policy activation, or Stage 7 work is authorized here.
