# CDX3C Codex 0.152.1 production cutover v0.1

## Scope and status

This record supports the production-selection change authorized by
[Issue #1193](https://github.com/hynk-studio/augnes/issues/1193). The change is
effective only if its pull request is merged. Until then, `main` remains the
authority for the active production target.

```text
base SHA = 9094374bb4d37dd60032dd5d2971ff1900a16c8b
branch = codex/1193-cdx3c-codex-0-152-1-cutover
production selection in this change = rust-v0.152.1
authenticated rollout = blocked before child launch by the existing
  agent_identity_bootstrap_required prerequisite
provider/model invocations = 0
repository tasks = 0
repository executions = 0
```

The CDX3A boundary remains unchanged:

```text
host-local operational continuity
!=
Augnes canonical semantic / epistemic / authority continuity
```

This change does not redesign continuity, Core, managed Resume,
`resume_capability`, Issue #1149, persistent mode, or RW1B.

## Exact target and production selection

Both released tags were re-resolved from official `openai/codex` refs on
2026-09-03.

| Role | Official tag | Peeled source commit | Executable SHA-256 | Semantic-profile SHA-256 |
| --- | --- | --- | --- | --- |
| Historical production | `rust-v0.150.1` | `90854393966b21e9ebfd21b122334eb09a20c93d` | `a14f9a907c12c8812878b70e6b7d65f81c39ed795513e46a55817d7428c0ca6b` | `0c2275335eb069ccd251dade36df03b6f4f0842deedc1d8d12191dadfa917058` |
| Selected by this change | `rust-v0.152.1` | `5adb68a49933ae446bf11935662c83dba55a0804` | `8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf` | `795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529` |

The exact 0.152.1 official macOS arm64 release archive remains:

```text
asset = codex-aarch64-apple-darwin.tar.gz
archive SHA-256 =
  8ddde1fcf5c9842e9baa09c7c108088bb22a39feb86e4344e45dc0986764b9d7
CDX3B candidate semantic-profile SHA-256 =
  222fa6bb809ef302f30e1f12de6b7475a3e736afc41db72d87e395d7fbecf0a4
```

The current selection is a composite binding of the exact public CLI version,
tag and source commit, executable content fingerprint, user-agent contract,
config/tool feature projection, consumed app-server method profile, provider
route, auth storage contract, private-state policy, and a separately pinned
production semantic-profile fingerprint. A stale profile cannot become
production merely by recomputing its own integrity field.

The 0.150.1 profile remains frozen and legible as
`exact_qualified_historical_non_selected`. CDX3B remains candidate-only
historical evidence with `production_selected=false` and its original profile
fingerprints. Rollback requires no schema migration and rewrites no semantic
history.

## Preserved runtime and authority boundaries

The selected 0.152.1 config adds only the two CDX3B-qualified explicit
overrides needed to preserve the old bounded surface:

```text
features.sleep_tool=false
features.content_item_kinds=false
```

The source-observed false
`background_paginated_rollout_migration` projection remains checked. Memories,
apps, plugins, skills, MCP, browser/computer use, remote surfaces, goal/queue
behavior, and Persistent reasoning remain disabled or unselected exactly as
before. Isolated authenticated execution remains ephemeral-thread-only and
non-resumable.

The merged CDX3B dispositions for
`modelProvider/authRecoveryStarted` and
`modelProvider/authRecoveryCompleted` are reused unchanged. They are bounded
provider-recovery progress observations, not grants, approval, semantic state,
verified success, `ReviewDecision`, or `Transition`. Their appearance in the
forced-OpenAI isolated path remains profile drift. Unrelated unknown
notifications and unknown authority-bearing server requests remain fail-closed.

Managed repository Resume, Browser confirmation, invocation markers,
controller generation, replay refusal, and ambiguous-effect reconciliation are
unchanged.

## Exact runtime evidence

The official asset was downloaded again from the GitHub release, its archive
and executable hashes were checked before execution, and the candidate
qualification was rerun credential-free. It remained `QUALIFIED_EXACT` with:

```text
CLI = 0.152.1
app-server CLI = 0.152.1
runtime methods = initialize, initialized, config/read
candidate profile SHA-256 =
  222fa6bb809ef302f30e1f12de6b7475a3e736afc41db72d87e395d7fbecf0a4
provider/model calls = 0
repository executions = 0
cleanup = complete
```

The newly selected production profile then passed exact credential-free
admission against the same executable:

```text
state = compatible_exact
runtime methods = initialize, initialized, config/read
production profile SHA-256 =
  795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529
exact private profile = observed
memory and remote features enabled = false
cleanup = complete
```

The authorized credential-broker preflight then read the current source through
the production read-only broker and stopped before credential attestation or
child launch:

```text
state = authenticated_prerequisite_blocked
reason = codex_isolated_auth_agent_identity_bootstrap_required
authenticated runtime methods = none
credentials read through broker = yes
credentials supplied to private app-server child = no
credentials copied to shared state = no
credentials exposed in public evidence = no
provider/model invocations = 0
repository task/execution count = 0/0
cleanup = complete
remaining owned processes = 0
```

This is an existing credential-readiness prerequisite, not contradictory Codex
0.152.1 compatibility evidence. Current source deliberately refuses to mint or
register Agent Identity material. No broader bootstrap path was added merely to
make the rollout pass.

Because no authenticated child was launched, `account/read`, `getAuthStatus`,
and `mcpServerStatus/list` remain source-compatible but runtime-unqualified in
this rollout. `thread/start`, `thread/read`, `thread/resume`, and `turn/start`
also remain runtime-unqualified. No synthetic provider turn was attempted:
the current source owns only test-emulated one-turn authorization, not a safe
production rollout authorization, and the authenticated prerequisite had not
passed.

## RW1B condition boundary

The current Issue #1130 artifacts were read without mutation. Their bounded
state is:

| Family | Latest consumed slot | Next unused slot | Latest actual observation |
| --- | --- | --- | --- |
| Resume | none | slot 1 / B0 | none |
| Verify | slot 1 / B0 | slot 2 / C1 | immediate observation exists; the pre-action overlap classification is `confounded` |
| Decide | none | slot 1 / B0 | none |

This cutover is not an RW1B observation, consumes no slot, resets no schedule,
changes no assignment or metric, and rewrites no frozen artifact. All already
collected evidence remains pre-cutover historical evidence. The effective
condition boundary is the future merge of the CDX3C pull request, not its Draft
head. Subsequent naturally occurring observations are post-0.152.1 condition;
pre- and post-boundary observations must not be pooled as one frozen ambient
condition. No benefit or effect conclusion follows from the version change.

The prospective boundary is also recorded on Issue #1130 with the Draft pull
request and head identity once those exist. No merge SHA is invented.

## Evidence accounting and non-impacts

```text
provider/model invocation count = 0
repository task count = 0
repository execution count = 0
credential source read = yes, through the read-only broker
credential supplied to app-server child = no
credential copied to ordinary or shared state = no
credential exposed in source, logs, committed files, or public evidence = no
semantic proposals created = 0
ReviewDecisions created = 0
Transitions created = 0
RW1B protocol/slots/schedule/history = unchanged
Core/schema/migrations = unchanged
managed Resume/resume_capability = unchanged
PR #1191 and PR #1192 = untouched
```

Canonical continuation remains provider-neutral. A stateless, local,
alternate-provider, or ephemeral model can still re-enter from reviewed Augnes
state and a bounded `TaskContextPacket`, produce a `RunReceipt`, undergo
verification, and proceed through the normal proposal, `ReviewDecision`, and
`Transition` separation. Native Codex persistence changes operational
efficiency, not canonical meaning or authority.

The remaining pre-merge rollout blocker is the source-owned Agent Identity
bootstrap prerequisite. Review may keep the pull request Draft until a current
credential source contains an already initialized and task-registered record,
then rerun only the narrow authenticated preflight; this record does not
authorize credential mutation or a new bootstrap framework.
