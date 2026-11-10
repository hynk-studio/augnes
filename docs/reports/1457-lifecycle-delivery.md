# #1457 lifecycle implementation and recovery delivery

2026-10-16 KST. **Implemented; focused development evidence passes; Draft/HOLD
for deciding qualification and production application.** This is the single
cohesive delivery for the [authorized assignment](https://github.com/hynk-studio/augnes/issues/1457#issuecomment-6204281716),
continuing the [original operational diagnosis](https://github.com/hynk-studio/augnes/issues/1457#issuecomment-6204147979).
The incident's historical trigger and attribution to either development lane
remain **UNKNOWN**.

## Actual loss and correction

The old manager collapsed an unavailable/conflicting process-birth read into a
false boolean match, then cleared its child handle, birth, attempt and runtime
ownership. Its startup snapshot did not contain the later-spawned supervisor,
so a subsequent healthy authenticated runtime became `foreign_runtime_conflict`.
The inspector's refusal was correct.

The original disposable reproducer was run against unchanged installed source
`79a62198d0c0fedc683984299262eca5dc561a7b` (core file SHA-256
`8f9e9abb68ed25879c0de7b722b0e7137a2acbd6c4ecb86ff0452adaa144ea46`).
One unavailable read, held unavailability and conflicting-then-original identity
each reproduced the loss: one supervisor, unchanged original/current birth,
null retained ownership, false restart count 1, and no return to live. All three
regression expectations failed; the real-exit control passed with two spawns.
The runner exited 1 as expected and settled every disposable resource. These
injected observations do not identify the historical probe failure.

The supplied 34-line private proposal was the starting hypothesis. The final
implementation moves the observation gate ahead of desired-state/maintenance
effects, handles retained adopted supervisors and initially unidentified children,
retains unsettled evidence on failed shutdown, and distinguishes confirmed
absence from an observed child exit. Original birth, handle, attempt and runtime
evidence remain available while status is unverified; retention grants no live
ownership. Reverification permits normal management; true exit preserves restart
and backoff. Group settlement and lock cleanup now require confirmed absence,
not a failed identity read. Unverified observations cannot authorize signaling,
replacement, PID reuse/adoption, cleanup or a competing supervisor.

Ordinary Start is explicitly unavailable/refused when the authenticated runtime
has no verified manager relationship. Public live/preservation acceptance remains
unchanged. The additive private observation/absence diagnostic and new narrow
recovery CLI are documented in the [lifecycle manual](../COMPANION_CHECKOUT_IDENTITY.md#retained-supervisor-identity-and-explicit-ownership-retirement).
Configuration/public MCP schema versions remain unchanged; the four-file service
fingerprint changes. Operator label `0.5.0` is not byte parity or source adoption.

## Explicit recovery of the already-erased state

The selected transition is **verified retirement to stopped**, with no live
adoption or replacement. The same lifecycle module exports inspect, prepare and
apply; it reuses its lifecycle lock, exact process-group owner, bounded material
cleanup and installed-identity checks. No second daemon or general recovery
framework was added.

Entry requires the erased manager record plus current, corroborated installation
and enrollment/source/Node, exact launchd job and manager lock/birth, supervisor
birth/command/direct parent, runtime lock/generation/instance, and authenticated
UI/bridge ownership and exact process groups. PID, PPID, path, health or old
receipts alone cannot establish it. Decisions bind the executing recovery source
separately from installed source, expire in five minutes and are rechecked with
the lifecycle owner at effect admission and before each signal.

Apply records the operation before bootout, proves manager/job settlement,
persists stopped intent, retires only recorded groups, proves their absence and
then removes exact residual runtime material. Configuration, enrollment, data,
LaunchAgent definition and recovery evidence remain. Unknown acknowledgements
require inspection; an incomplete remainder needs a newly reviewed decision.
Settled replay verifies settlement and causes no second effect. Stale, foreign,
unavailable or changed witnesses refuse. New lifecycle entry refuses an incomplete
record. Old installed clients cannot understand it, so a separately coordinated
exclusive operator window is necessary.

The disposable fixture enters the real exported manager with erased references
and a pre-existing supervisor. Real loopback listeners require the child
credential. Its installed source deliberately differs from executing recovery
source, proving that prior installation of the candidate is unnecessary. Its
data sentinel and configuration/LaunchAgent hashes remain unchanged.

| Disposable recovery scenario | Observed result |
| --- | --- |
| Lost state, retirement, settled replay | Stopped and settled; zero remaining processes; one bootout total |
| Later attempt's exit diagnostic while original supervisor survives | Same safe retirement; diagnostic retained as history |
| Expired decision and maintenance introduced at effect boundary | Refused; zero bootouts; no operation record |
| Foreign runtime lock or changed configuration | Refused; zero bootouts; configuration restored by fixture cleanup |
| Lost bootout acknowledgement | Inspect incomplete; Start refused; fresh decision settles original remainder |
| Unavailable birth and simulated PID reuse | Refused without recovery effects or an operation record |
| Interruption after supervisor retirement | Inspect reports two remaining children; fresh decision settles them |
| Changed generation at effect boundary | Refused; zero bootouts; no operation record |

The launchctl adapter controls only disposable processes and exact job output;
there was no new native service installation. Manager/recovery code, process
birth/group checks, authenticated loopback exchange and filesystem effects are
real. These tests do not prove native launchd recovery of production or hostile
same-user resistance. The ordinary cooperative lifecycle race limits remain.

## Verification and cleanup

[Machine-readable permitted evidence](1457-lifecycle-evidence.json) contains
source hashes, observed scenario results, commands, finite runner outcomes and
ownership release. Protected logs/credentials/transcripts are not published.
Root and Apps dependencies were installed only in the admitted lifecycle worktree.
All checks ran under the existing bounded child/resource and checkout/capacity
owners with Node **24.18.0**, npm **11.16.0**. They are development evidence, not
stitched deciding phases or a Local Canonical receipt.

| Command (pinned `node`) | Final result | Duration |
| --- | --- | ---: |
| `scripts/test-companion-manager-recovery.mjs` | PASS 10 scenarios | 20,968 ms |
| `scripts/test-companion-ownership-retirement.mjs` | PASS 8 scenarios | 37,227 ms |
| `scripts/test-companion-service-contract.mjs` | PASS; unchanged 30 s deadline | 26,400 ms |
| `scripts/test-companion-checkout-identity.mjs` | PASS 99 cases | 13,331 ms |
| `scripts/test-augnes-operator-plugin-setup.mjs` | PASS | 1,227 ms |
| `scripts/test-codex-companion-discovery.mjs` | PASS | 1,158 ms |
| `scripts/test-local-canonical-receipt.mjs` | PASS | 161 ms |
| `scripts/test-local-canonical-executor.mjs` | PASS | 597 ms |

Manager coverage includes one/repeated unavailable observations, conflicting then
original identity, observed exit, permanent conflict/PID-reuse simulation,
desired Stop, maintenance and shutdown interruption, initial identification and
adopted-child handling. Unknown states preserve the original witness without
false live/exit history, signals or duplicate spawns. Shutdown refusal retains
its lock until the disposable fixture owner settles its children and removes
only that fixture. Both regression files are registered in the normal Darwin
unit suite with finite 60 s deadlines and required natural exit.

Every final child exited naturally with closed streams, successful cleanup and
zero owned processes. Checkout and capacity were released at
`2026-10-15T23:54:32.535Z`. Intentional evidence/dependency trees remain in the
task-owned worktree. All earlier development failures are retained privately:
unreaped-child settlement exposed the boolean-absence problem; public refusal
compatibility and a duplicate local identifier were corrected; missing root/Apps
dependencies were installed locally. Root npm installation exited 0 but its
development runner recorded descendant cleanup rather than natural exit; it is
not a verification pass. No failed deciding run was retried.

The final exact-base/head planner is run after commit and recorded in the delivery
envelope. This shared lifecycle/runner change requires **Full Canonical**. It is
**NOT_RUN** while the installed service is preservation-invalid; no new deciding
attempt or receipt is manufactured. Full type/build/browser/remaining integration
phases therefore remain unrun. Runtime proof recording is skipped: missing
`CODEX_WORK_ID` and no verified managed Companion entry. No proof IDs are claimed.

## Source and installed observations

Development root: `/Users/hynk/.codex/worktrees/1457-manager-recovery/augnes`, branch
`codex/1457-manager-ownership-recovery`, origin `hynk-studio/augnes`, base/current
main `5c5c2cc89e2871b7cd2379927610275cae9cc1c0`. The exact final commit and tree are
bound in the PR/#1457 delivery envelope. Recovery's four-file fingerprint is
`fa187e1fdff9c57ef28bc83d111d59b06cb9aaa7f6790f89629337d056033030`.

Read-only installed observations at **08:44:42 and 08:53:30 KST** agree:

- Installed checkout remains clean at `79a62198d0c0fedc683984299262eca5dc561a7b`;
  configured and actual source both
  `fbedd513f310a6cd58f4ad0b3bd701824d38308433eca6c995bc4923db3c1cd9`.
- Manager PID 49940, birth
  `249e265eeb286464cbae1d3d489f839308435abed751e6797b269f5c5075b3a6`;
  supervisor PID 49951, parent 49940, birth
  `af29273096180876a587d714b3046250fd35c8d71c4f3e2775c08dcec83e9e0f`.
- Runtime generation `8fdd0c16-a173-4420-85f2-83dd7732ff75`, instance
  `118bc63d-9886-487b-9b68-8308649f232d`; all four health/ownership probes pass.
- Manager still reports foreign-runtime conflict with erased references;
  supported preservation says `recovery_required/exact`, coherent true,
  `companion_service_manager_ownership_unverifiable`, preservation false.
  Binding is `7fa0205e024f5937c4d59a96c7f931724ad0bb84f4f8c25b24dca5f2876b6b26`.
- Latest attempt provenance says exit status 0 but contains no child identity.
  It cannot establish exit of this still-present supervisor or explain the
  historical incident. Recovery uses current corroboration, not this diagnostic.

Installed configuration/desired/plist hashes and process/source identities are
unchanged between observations; maintenance and lifecycle locks are absent.
All **714 protected historical files** match their original hashes. Installed,
marketplace, B, #1465 and #1466 worktrees are unchanged and clean. #1465 remains
at `68852a8938cae45b64b6a16b8aa578c25d7f8365`, #1466 at
`d53ed48e8974795c617fae770fd1a7373a352c3d`. No production database was opened;
data preservation evidence here is scoped no-access plus the disposable sentinel,
not a new byte audit of production databases.

## Concrete unexecuted recovery/adoption handoff

**None of these production effects is authorized or executed by this delivery.**
After review, separately authorize the exact candidate/hash, installation and
exclusive lifecycle window. Run the reviewed candidate CLI directly from
`/Users/hynk/.codex/worktrees/1457-manager-recovery/augnes`, targeting the unchanged
`/Users/hynk/code/augnes` with `--repository-root`. Use
`/Users/hynk/code/augnes/.augnes-toolchains/node-v24.18.0-darwin-arm64/bin/node`
(binary SHA-256 `ee6fb0e015284d83a91e8ec5213f43a157f8a392b58555301682892ba928c04a`).
No copy into the installed checkout or preliminary reinstall is required.

Follow the [exact inspect/prepare/apply commands and decision-file procedure](../COMPANION_CHECKOUT_IDENTITY.md#non-circular-post-review-operational-handoff).
Re-resolve every current witness; today's PIDs/hashes are observations, not future
authority. Inspect and prepare are read-only. Review matching observation and
decision bindings and both source fingerprints before separately authorizing
apply. If any required witness is missing, stop with the exact recovery refusal;
do not use standalone supervisor commands or edit records to pass.

Apply may retire only the proved manager/runtime, persist stopped intent and
clean exact residual runtime material after settlement. It preserves installation,
enrollment, LaunchAgent, database/project data and the recovery record. Inspect
unknown outcomes before any new preparation; never delete the record to retry.
Require independently verified `settled`, zero remaining owned processes,
stopped exact service and unchanged protected material before the next decision.
Retirement cannot be reversed by restoring stale files; Start would create a new
generation and needs separate authority.

A validly stopped old installation can then permit the unchanged candidate's own
planner-selected isolated Full Canonical run. This resolves the qualification
dependency without prior candidate installation. The final exact target must
still satisfy current-main and all other admission checks. Source adoption is a
subsequent separately reviewed operation through the supported install/update
owner while preserving stopped intent, with another fresh status/source readback.
No merge, Start, source adoption or qualification of #1465/#1466 is automatic.

#1465's accepted checker correction, four original revalidations and SIMPLIFY
decision remain intact; #1466's corrected creative flow and original evidence
remain intact. Neither consumer study nor #1465 qualification was rerun. Both
retain their separate operational and exact-source requirements. The broader
issues stay open; this task stops after implementation/evidence coordination.
