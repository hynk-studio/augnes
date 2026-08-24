# ACGC E2R2P6U R1 replacement preflight closeout v0.1

Status: documentation-only terminal closeout of the Issue #257 pre-consumption source-attestation failure. This record creates no behavioral result or successor live authority.

## 1. Purpose and bounded scope

Issue #258 closes out the one-shot Gate B event authorized for Issue #257. The event stopped in live source attestation before authorization consumption, cohort creation, provider transport, or behavioral evaluation. This document preserves that terminal truth without changing the live-preflight implementation, the candidate, historical evidence, product/Core state, policy, or Stage 7.

The canonical source was commit `60cb7b5e6e80b5e7c34bd614d361153ff55c60a1` with tree `03a8d1503b9fda7a62d4bddfef3ed663c55b79a5` in `hynk-studio/augnes-perspective-lab`.

## 2. Exact P6T candidate

The read-only candidate identities were:

- authorization ID: `e2r2p6t-issue-257-3a30a88a-27c7-4a5f-a665-e9c85367a341`
- authorization protocol fingerprint: `sha256:8782031cff3440f15c7a4ed87353808c3acbe25283e92f9b2b8c66961bc536c4`
- authorization raw file SHA-256: `7aa912be66fe11de45ee3fdac42060f4265fccf3733f68828527966a17b77fbe`
- pricing protocol fingerprint: `sha256:c4a9ee6d1b17b3ebbf5b59e3d3834ead5e17b8aff2d75f7d6eef0710c920f289`
- pricing raw file SHA-256: `ffe879c8ad7cade66574310e3118d2be99e59cc5c5c55fa38ab1d58d8b4fda8e`
- pricing-authority fingerprint: `sha256:e4fe3b1924f25ecde69cc4501909b4dc412aee644f7ad85b0244f566cb84ec83`
- pricing-authority expiry: `2026-08-24T11:37:35.996Z`

The authorization object remained unconsumed. That fact does not renew live authority: the owner's one-shot Gate B CLI authority was exercised exactly once and the candidate must not be reused for another live invocation.

## 3. Frozen semantic and provider bindings

The candidate was bound to:

- R1 case: `sha256:34070d5b174f7d9f7847a5fae5d9df05b7a584ca336322a1bb3af55f80346281`
- common evidence: `sha256:aaa7cca07ac23e23571c4ca7d982708aea13706b28ace178b405f0569dcbceca`
- gate: `sha256:7b14e199ac1ef71aaf4b3e9b2d3d611e60c0a780a21cc98df9b38295f8fd72b2`
- evaluator: `sha256:813f0cf908f1f930ec75b6576d32ad390b8b4a81f11263d525a888d0aeb32f9a`
- plan version: `operational_reentry_v04_stale_reset_replication_plan.v0.2`
- plan: `sha256:08958181c3084ced937a3de8c7ddd1a9743dbf03bde086dda9d678b51d79302a`
- call-slot namespace: `ccr_namespace_86c86b9a1ca989dc0b769da70ec4dac5796197cb`
- plan order: `ABGC / BCAG / CGBA / GACB`
- route: `sha256:a375bd9ef2d8c847e81d36eea9b829106ceba5a72e04528efde92b0e948f2bd7`
- provider contract: `sha256:8f3ca3852ba92af1da46eab5dcf1d0bfb67a62c5fbaa4647ef00c2ef7b371394`
- adapter route: `sha256:1a9b3eee37310241f3e5c281bb20f6dce8a5a528b1ba1da54e188456a28fecd3`
- replication authorization contract: `sha256:9ddc07d207e88fda14cd61f0ccaf5fc03f2801be5ecd79703cd9d5d2f5d26a3a`
- replication artifact family: `sha256:263c5fa53e0acbc82942969a12c70c1a87b1b4f272dcb9112f47a006a9201a6f`
- planned cohort ID: `cross-case-replication-cc68fba8f9c1130a948445a62c679c25`

The four plan-owned B/G witnesses were:

- block 0: `sha256:5a66772d8f3cedfc9d06cf225c9f42dc37d9a5bddc250ffef0a56a0fc6b0e1bf`
- block 1: `sha256:687468ecc007753004300e0e617868da8ff18cc08225ea3b93808db7ee3d9eec`
- block 2: `sha256:d1edb00185572e313c553db8dd36dbab137d24943225216f9876e784210daebe`
- block 3: `sha256:a57108e3eb1a104d95e8e30ca70edce293b30dca0609fdc434a862bea6c4d912`

## 4. Gate B terminal truth

Exactly one Gate B CLI invocation occurred. It exited `1` with `cross_case_live_origin_main_refresh_failed`.

The bounded terminal ledger is:

```text
Gate B CLI invocation count = 1
CLI exit = 1
authorization consumed = false
global consumption marker = absent
run-local consumption marker = absent
run root = absent
provider transport attempts = 0
real_provider_calls = 0
behavioral call records = 0
behavioral block records = 0
case-status artifact = absent
report = absent
terminal artifact = absent
artifact index = absent
second CLI invocation = false
retry = false
replacement = false
P6T behavioral result = none
P6T case status = none
R1 support = not established
R2 = none
cross-case disposition = incomplete
```

No P6T behavioral cohort began. `none` is therefore the exact P6T case-status classification; this event is neither an `incomplete` nor a `protocol_invalid` P6T behavioral case.

## 5. Merged source-attestation implementation truth

At the canonical source, `scripts/operational-reentry-stale-reset-cross-case-live-common.ts` performs live preflight in this semantic order:

```text
repository identity validation
-> observed origin validation
-> refreshOriginMain
-> HEAD / refs/remotes/origin/main source equality
-> worktree checks
-> admission, pricing, and live-context validation
```

`refreshOriginMain` executes the equivalent of:

```text
git -C <repository-root> fetch --no-tags --no-recurse-submodules --no-write-fetch-head origin +refs/heads/main:refs/remotes/origin/main
```

The merged owner catches a fetch failure at that step and emits `cross_case_live_origin_main_refresh_failed`. P6U records this implementation truth and does not weaken or modify it.

## 6. Bounded diagnosis

P6T was blocked before cohort creation because the live source-attestation preflight could not refresh the private repository's `origin/main` through the local Git transport credential context. Authorization remained unconsumed, no run root or artifact family was created, and no provider or R1 behavioral call occurred.

This bounded diagnosis does not establish source drift, a GitHub outage, provider incompatibility, provider or model failure, R1-C failure, behavioral support or non-support, or product benefit or harm.

## 7. Behavioral and instrument axes

Behavioral axis:

```text
P6T behavioral cohort started = false
P6T behavioral result = none
P6T case status = none
R1 support = not established
```

Instrument axis:

```text
source-attestation preflight succeeded = false
failure stage = origin/main refresh before consumption
provider transport reached = false
research-instrument reliability blocker = source-attestation transport capability
```

The source-attestation transport capability is the next program-level bottleneck. P6U does not implement its repair.

## 8. Future reliability integrity constraint

A successor reliability phase must not remove fresh `origin/main` verification, trust stale local refs as equivalent fresh truth, skip source-drift protection, or weaken authorization/source binding merely to make live execution pass.

That phase should evaluate rather than preselect:

- Gate-A source-attestation capability validation;
- explicit bounded private-Git authentication availability;
- repository-owned authenticated refresh transport with secret non-persistence;
- an equivalent fresh remote-main attestation mechanism;
- a more precise safe bounded refresh-failure taxonomy.

The long-term objective is to make source-attestation capability explicit and testable before live authority is granted.

## 9. Historical independence and privacy ledger

Issue #254 remains immutable with historical evidence digest `882194efd6d5e63d5e4aa910b669fd7b963e22a7028d40e727f7d92782d47892`. Issue #251 and Issue #246 evidence also remain unchanged. No historical call or completed block was reused.

P6U persisted no credentials, Git helper configuration, raw Git authentication error, raw prompt, provider request or response body, provider error, hidden reasoning, or private artifact body. It created no provider/model call, behavioral artifact, Product/Core write, Evidence, Proposal, ReviewDecision, Transition, policy, scalar/rank/winner state, Stage 7 state, publication, or deployment.

## 10. Downstream sequence

P6S / Issue #255 / PR #256 completed at merge `60cb7b5e6e80b5e7c34bd614d361153ff55c60a1`. P6T / Issue #257 ended at the pre-consumption source-attestation boundary described here. P6U / Issue #258 is the documentation-only closeout and remains current while its Draft PR is open.

After P6U merges, the next candidate is a separately authorized source-attestation reliability and hardening phase. No fresh R1 successor live issue and no R2 live issue have been created. Cross-case disposition remains `incomplete`; `product_transfer_GO`, `policy_GO`, and `stage_7_GO` remain `false`, and no scalar, rank, or winner exists. Issue #205 remains separate/open, and PR #186 remains historical Draft HOLD.
