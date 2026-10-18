# Continuity disruption audit — 2026-10-18

## Finding and scope

The bounded disruption experiments passed. No product correction is justified by
these observations. This change adds regression coverage and this audit record;
it does not change runtime behavior, credentials, persistence, Core semantics,
execution authority or installed software.

After [#1457](https://github.com/hynk-studio/augnes/issues/1457) closed, the user
requested testing of other external continuity blockers and a Draft PR/report
for later audit. The working hypothesis was that a long absence, changed client
connection, or unavailable storage could lose saved work, silently discard a
pending draft, or cause a duplicate save. The resource boundary was synthetic
projects and credentials, disposable databases, local HTTP and fresh stdio
clients on the canonical Mac. No reboot, sleep, production Start, provider/model
call, managed work execution, deployment or adoption was performed.

The starting source was `8b4dd38b895825885558d454d18323337411c67b`.
The [new checks](../../scripts/companion-disruption-checks.ts) extend the existing
[HTTP envelope fixture](../../scripts/companion-work-revision-envelope-checks.ts),
which is already consumed by the Canonical current-work revision test. No test
selection, assertion, retry policy or deadline was relaxed.

## Observed boundaries

| Disruption | Experiment and observation | What it does not establish |
| --- | --- | --- |
| Long absence and expired Browser access | Advance the session owner's injected clock by 24 hours. The old credential authenticates before expiry and refuses afterward without a database change. Fresh bootstrap/admission works; the old credential stays refused. Companion Resume still reads the saved goal independently. | No actual 24-hour wait, OS sleep/logout, Browser unlock interaction or wall-clock change. |
| New runtime generation while a draft is pending | Rotate the fixture's generation and channel credential after preview. Real proxy/HTTP dispatch refuses the old seal with `preview_changed`, once, with the whole database unchanged. The caller's exact draft text remains available. A fresh stdio client discovers the new channel, reads the same snapshot, and obtains a different valid preview seal. | Discovery health/manifest and generation rotation are synthetic; this is not actual supervisor replacement or process suspension. |
| SQLite capacity exhausted | Limit the disposable writer connection to its existing page count. The production revision writer raises real `SQLITE_FULL`, leaves no transaction open, and preserves the entire serialized database. Restore the connection limit, then independently read back the previous snapshot and sources. | No host-volume exhaustion, filesystem `ENOSPC`, WAL-device failure or runtime/log/config write fault. |
| Read-only storage | Invoke the same production writer through a real read-only SQLite connection. It raises `SQLITE_READONLY`, leaves no transaction open, and preserves the entire database. | No macOS ACL, ownership, mount-mode or external-volume change; this is writer coverage, not the HTTP storage-error presentation. |
| Save response lost after commit | After explicit readback and a new preview, perform one save through the actual HTTP route and drop its response after the writer commits. The proxy returns `save_outcome_unknown`. A fresh stdio client recovers the exact new goal and unchanged selected sources; readback causes no write or replacement save. | No provider-side or other external action was dispatched. Their unknown-outcome reconciliation is separate. |
| Browser/client lost before Save | Source review confirms drafts live in their owning tab/client memory. Saved history remains separate. | No durable recovery of unsaved drafts is implemented or demonstrated; the test's retained variable is not crash persistence. |
| Installed/loaded software mismatch | Current service inspection compares its source fingerprint and pinned Node. The production Codex resolver selects an exact managed runtime rather than the global PATH binary. Existing lifecycle/runtime tests retain these boundaries. | No global update, plugin refresh, loaded Codex conversation restart or installed adoption occurred in this audit. |

Supporting owners are the [ordinary recovery guide](../../plugins/augnes-operator/INSTALL.md#ordinary-use-and-recovery),
[continuity contract](../CODEX_CURRENT_CONTINUITY_V0_1.md#ordinary-connection-recovery),
[checkout/lifecycle contract](../COMPANION_CHECKOUT_IDENTITY.md),
[service inspector](../../plugins/augnes-operator/mcp/companion-service-core.mjs),
and [managed execution resolver](../../lib/vnext/native-host/codex-production-runtime.ts).
The save test exercises local transport uncertainty, not a model/provider outage.

## Verification and preservation

The final focused development command was:

```sh
node --import tsx scripts/test-codex-repository-continuity.ts --work-revision-only
```

It ran with Node 24.18.0 through the repository's bounded child/resource owners in
an admitted isolated worktree, with private dependency copies, HOME, temporary
and database/runtime roots. It exited naturally with code 0 in **23.197 seconds**,
within the unchanged **30-second** bound. All existing assertions and the new
checks passed. Three added fresh protocol readers completed; the new checks
observed zero managed runs. Cleanup reported zero remaining owned processes and
released all task-owned resource, checkout and capacity owners.

An earlier development pass took 23.924 seconds. The later source added the
positive fresh-access control and verified that new admission does not revive
the expired credential. Both development results are retained; neither is a
Local Canonical receipt or physical sleep/reboot evidence.

Before/after supported preservation inspection remained coherent
`installed_stopped / exact / preservation_valid=true`, with identical state and
binding. Protected production database/sidecar, installed configuration/state,
recovery/LaunchAgent, Codex configuration, hooks and build-identifier snapshots
matched. Canonical tracked source remained clean. No production maintenance or
credential operation was needed.

Retained local development evidence identifiers, for audit correlation:

| Artifact | SHA-256 |
| --- | --- |
| New disruption check source | `ed10337a1e19bb3735e7b3e924d5027bfdddb0e57d81c4ad9842ed2a780109ba` |
| Extended envelope check source | `38cf8800ae05950e65fd1fd07f374bee433e3e5f619c1f68f0cc79809eefed47` |
| Final focused stdout | `0e4a8806af1efeea92fae97e3ff8ae8adc887f43eaacdec0f68a4fd56f745182` |
| Final focused result record | `835e7398be3d62ad78026a45f3aad6d5f4724d19d37dbfa76868f62e6c2ba67b` |

These hashes identify retained local records, not independent attestation.
Deciding verification must follow the unchanged planner for the exact committed
candidate under the [Local Canonical policy](../../.github/LOCAL_CANONICAL_VERIFICATION.md).
Its completed result and separately validated receipt belong in the PR audit
record; this report does not predeclare a deciding PASS or transfer older
receipts to this candidate.

## Next decision

Retain the current recovery behavior and this regression coverage. Successful
refusal is useful here: it preserves saved state and requires a fresh, explicit
decision instead of replaying uncertain work. There is no observed saved-work
loss or duplicate write in these cases, and no measured claim about long-term
reliability, latency or user burden.

Unsaved draft loss remains a product limitation. Durable draft recovery would
need a separate explicit retention/privacy design; silently persisting every
client draft is not proposed. The remaining operational observations are actual
sleep/wake or logout with a loaded client, real filesystem failure, and
post-update client reconciliation. They are **NOT_RUN**, with the reasons above.
Use a concrete incident or separately scoped acceptance trial to select the next
change. The existing #1457 closure is unaffected.
