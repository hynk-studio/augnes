# Phase A continuation result

Refs #1412; Draft PR #1413. **Producer ready for review; Phase B NOT RUN.**
This result follows the single additional invocation authorized by
[director review 5436420931](https://github.com/hynk-studio/augnes/pull/1413#pullrequestreview-5436420931)
and the user's continuation instruction. The original two blocked attempts and
standalone calculation remain unchanged at their original paths, with their
inventory bound to `fc81b4af8fb94db03125714eb8cdfe329e8e804b`. No original
failure was relabeled as success and no additional live retry was run.

## Actual producer sequence

The new invocation used prepared helper commit
`5668649dbed8288fec4a7a000f6e83886eb90dde`, tree
`547ec0aa28c66eaf65efbd7b0ff8e0ca4dc40520`. Exact helper bytes/hashes and
command are retained in `attempt-3/execution-helper.json`, separately from the
later artifact-retention commit. The executed helper files remain unchanged.

```sh
node scripts/executable-reuse/cloud-reuse-pilot-01/run-producer.mjs scripts/executable-reuse/cloud-reuse-pilot-01/continuation-01/attempt-3 --allow-unsandboxed-synthetic-pilot
```

The existing local Worker/D1 and browser owners created a fresh disposable
fixture/profile. After normal synthetic login, readiness positively observed
the correct scoped authenticated document, loaded client, idle controls and
completed list read, including HTTP 200 for client.js and the list. No fixed
sleep or suppressed evaluation exception substituted for readiness.

Two ordinary editor saves created work
`47b083cb-833d-49e3-9652-fa6c8d814730`, goal `cloud-reuse-pilot-01`:

| Revision | Exact fingerprint | File selection |
| --- | --- | --- |
| 1 | `sha256:616c6503c0ae6bb6b3f69ddeb4993c2e491ab492b5a3d2a8c5663706a51c4983` | Exact workflow_cost.py and exact_linear.py; 7,215 bytes |
| 2 | `sha256:95c62c2f728db3ddad3239e5bdc1be1d4b6c35512b3518b85477d3236ffddb51` | Same source descriptors plus new actual stdout; 7,738 bytes |

The exact checked-in source bytes, commit/hashes, Python/dependency attribution
and qualified conditions were saved with revision 1. After the new calculation,
revision 2 retained both required sources and added the actual result/limits.
A fresh tab in the same producer fixture read revision 2 exactly and opened
Saved context. Its complete export contains the unchanged revision 1 and exact
revision 2; all three body bytes match their selected identities. This tab is
producer readback, not another Cloud task, restored consumer or Phase B.

## New calculation and exact oracle

This invocation executed a **new** calculation after revision 1:

```sh
python3 -E -s -B scripts/executable-reuse/workflow_cost.py --help
python3 -E -s -B scripts/executable-reuse/workflow_cost.py --attempt 9 --verification 3 --repair 4 --direct-success 2/5 --inspection 1 --inspected-success 2/3
python3 -E -s -B scripts/executable-reuse/cloud-reuse-pilot-01/oracle.py scripts/executable-reuse/cloud-reuse-pilot-01/continuation-01/attempt-3/producer-stdout.json
```

Help exited 0 in 40 ms; calculation exited 0 in 34 ms; independent oracle exited
0 in 24 ms. All had empty stderr and completed process cleanup. Output inputs
exactly matched the six commissioned strings. Actual results were direct `36`,
inspected `43/2`, difference `-29/2`, `inspection_reduces_work`. The oracle
imports only json/sys/fractions and independently evaluates
`(attempt + verification + inspection + (1-p)*repair)/p`, with direct inspection
zero. It does not call the retained solver. Actual stdout is 523 bytes, SHA-256
`37869ecc10f665461d7e3f1e53085329b0454bb8c2acda554ed64cae399a37cb`;
it happens to match the original standalone bytes, but the new command/lifecycle
and its revision-bound result are separately recorded in `attempt-3/execution.json`.

Inputs are stipulated, not empirical or causal estimates. Mandatory verification
remains mandatory on every attempt. Optional inspection is per attempt. Qualified
stationary finite-state limits, non-completing exclusions, required dependencies,
and history-dependent-probability non-applicability remain in saved context.
No independent-task transfer, general usefulness, comparative burden reduction,
live hosting or integration approval is established by this result.

## Actual byte-bearing export

`attempt-3/planning-work.json` is the exact browser download from the supported
export route, copied without reserialization or checksummed-content edits:

- Format: `web_planning_export.v0.3` / `web-planning/3`.
- Bytes: **25,632**.
- Whole-file SHA-256: `2634ccd6ec63ae50b4f05a8ff89e9fd8e723242f75f5cdeb512c81af4cc7d219`.
- Package fingerprint: `sha256:08185dbce8ec730da690bd845685a02cdfaa13e386a678ca495837c87682b6f0`.
- Separate manifest: `attempt-3/manifest.json`; source baseline/tree, scope/work,
  head/revision fingerprints and selected-file byte/digest identities are retained.
- Source digests: workflow_cost.py (4,973 bytes)
  `sha256:7a0fabc8a0672f97d4c5a81b5eef9e61f5c7fca6447d50ae1bf09bc2be149c11`;
  exact_linear.py (2,242 bytes)
  `sha256:7cdd11476badfed7b206a84ed5195209e38465dd74cc5e265a7d9ced203a804a`.

Validation is pure; no receiving store was created or reconstructed. Artifact
retention commit/path are supplied by the final PR/report, avoiding a
self-referential commit hash in this record. `retention-inventory.json` inventories
the continuation separately and does not silently refresh the original inventory.

## Checks, failures, cleanup and limits

The sole continuation invocation exited 0 in **3,839 ms**, with no timeout,
closed streams, completed cleanup and zero remaining owned processes. Two saves,
zero uncertain-outcome resolutions, zero write retries, zero Worker external
requests and zero intercepted external browser requests were observed. There
were no browser exceptions/refusals/unexpected failures in this invocation.
Both original failures remain intact. The separate additional retained-artifact
audit initially encountered `spawnSync git EPERM` in the default shell sandbox;
that failure is retained in `post-retention-check-failure.json`. A subprocess-free
file/hash audit then passed without a producer/browser rerun or permission change.

Focused preparation and retention checks:

- Node syntax on the parent/child, preparation controls and retained auditor.
- `node scripts/executable-reuse/cloud-reuse-pilot-01/test-preparation.mjs`:
  15 pure readiness states plus exception propagation, explicit opt-in and
  commissioned-input controls passed; retained output in `preparation-controls.json`.
- Python oracle AST/import inspection: passed; no solver dependency.
- Producer's full export-chain/body comparison against actual saved revisions:
  passed; revision 1 unchanged and revision 2 readback equal.
- `node --import tsx scripts/executable-reuse/cloud-reuse-pilot-01/continuation-01/verify-retained.mjs`:
  passed; exact package/body/helper hashes, commissioned inputs, original-history
  identity and cleanup checks; output in `retained-verification.json`.
- Synthetic-content/attribution/qualification and credential-content review,
  decoded-body digest/size checks, original-commit inventory and unchanged-history
  checks, exact diff review and `git diff --check`: passed before retention.

No credentials, auth headers/cookies/CSRF/seals, DB copies, private production or
historical #1366 packages, broad logs, full conversations or hidden reasoning are
retained. The existing local login/session adapter is synthetic authentication,
not live Cloudflare Access verification. Unsandboxed Chromium required the
explicit pilot-only flag; sandbox isolation is not claimed. Current HTTP-policy
status is reported as enforced, but complete VM/network enforcement is not
attested. All fixture application traffic remained loopback.

The pinned application baseline remains
`b73e5012c699f85a9e3b643b6cba82f8f195d3ce`, tree
`5443ce03a9d193c03274379938fa1b391512ad25`. No product/Core/solver/auth/storage/
verification-policy change occurred. The real planner runs for the final retention
head and is reported in the PR. Any Mac deciding verification is NOT RUN /
integration pending; Linux Cloud checks do not satisfy macOS arm64 / Node 24.18.0
Canonical. Full bootstrap/Canonical suites are not repeated, and no receipt is
fabricated. Total task/human time and CPU/memory/network/platform usage remain
unmeasured; observed child durations and request counts are retained.

Both listeners and all owned browser/Worker processes were stopped and disposable
DB/profile/temp roots removed. Prepared dependencies and unrelated resources were
preserved. There were **three producer invocations total** in this task: two
original failures plus this one authorized continuation; no further live retry.
No merge, Ready, auto-merge, deployment, environment publication, account/connection
change, provider/model expenditure or Phase B occurred. Stop for director review;
the overall pilot is not complete.
