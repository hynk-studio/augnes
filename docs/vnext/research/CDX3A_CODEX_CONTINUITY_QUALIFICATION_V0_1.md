# CDX3A Codex continuity qualification v0.1

## Role and scope

This document is the source-first ownership and compatibility qualification for
[Issue #1187](https://github.com/hynk-studio/augnes/issues/1187). It answers
which continuity responsibilities belong to native Codex and which remain
canonical Augnes responsibilities.

The governing distinction is:

```text
host-local operational continuity
!=
Augnes canonical semantic / epistemic / authority continuity
```

This is a compatibility/audit record. It is not a new product, Core, protocol,
execution, provider, or GitHub authority owner. It does not implement
[Issue #1149](https://github.com/hynk-studio/augnes/issues/1149), change the
Codex production pin, or begin a persistent-mode experiment.

## Decisions

1. **Core semantics: keep.** Current Core identity, lineage, evidence,
   uncertainty, review, decision, Transition, replay, and authority semantics
   remain necessary and unchanged.
2. **Managed Resume: keep.** Native `thread/resume` reopens or rejoins a Codex
   thread; it does not replace repository resume eligibility, Browser decision,
   durable admission, exact run/checkpoint binding, invocation marking,
   ambiguous-effect reconciliation, or second-invocation prevention.
3. **`resume_capability`: keep the narrow v0.1 contract.** No qualified current
   consumer needs distinctions beyond `native_host_resume_binding.v0.1` plus
   `resumable_after_detach`.
4. **Production Codex: keep `0.150.1`.** Recommend a separate exact `0.152.1`
   cutover/qualification issue; this audit does not authorize or perform it.
5. **Issue #1149: `narrow`.** Preserve portable checkpoint identity,
   observation, terminality, integrity, stale/replay, and authority
   non-inheritance; exclude host wake, queue, scheduler, and backoff microstate
   from canonical ownership.
6. **Later native persistent-continuation experiment: conditionally justified.**
   It may measure host-local efficiency only after an exact released-version
   qualification and outside RW1B. It is not justified as an Augnes semantic
   dependency and is not started here.
7. **Non-Codex invariant: retain semantic reentry.** Reviewed Augnes state must
   remain sufficient to construct bounded current context for a new stateless,
   local, alternate-provider, or ephemeral model instance and return through
   normal receipt, verification, and review flow.
8. **Dependence classification:** stable released thread lifecycle/read/resume/
   fork/compact and goals shapes may be treated as host capabilities only at an
   exactly qualified version. Queue, memory controls, realtime, project APIs,
   most settings mutation, and several history fields remain experimental;
   internal implementations and upstream main are not production contracts.
9. **Overlap classification:** host transcript persistence, reconnection,
   compaction, queueing, goal turns, and memory eligibility are genuine
   operational ownership that Augnes should not duplicate. Similar names such
   as project, goal, resume, memory, evidence, and authorization refer to
   different semantic layers where Augnes ownership remains necessary.

## Exact audit baseline and Codex source identities

```text
repository = hynk-studio/augnes
canonical root = verified current repository root
base branch = main
base HEAD = 42857e5f32778e64409ffde937d385cec372416a
audit branch = codex/1187-cdx3a-continuity-qualification
audit date = 2026-09-02
```

The following identities were independently resolved from official
`https://github.com/openai/codex.git` refs and checked against each source
tree's workspace version:

| Target | Official ref | Peeled source commit | Source version | Authority here |
| --- | --- | --- | --- | --- |
| Current qualified Augnes target | `rust-v0.150.1` | [`90854393966b21e9ebfd21b122334eb09a20c93d`](https://github.com/openai/codex/commit/90854393966b21e9ebfd21b122334eb09a20c93d) | `0.150.1` | Current exact production qualification target |
| Released comparison target | `rust-v0.152.1` | [`5adb68a49933ae446bf11935662c83dba55a0804`](https://github.com/openai/codex/commit/5adb68a49933ae446bf11935662c83dba55a0804) | `0.152.1` | Released comparison evidence only |
| Upstream main snapshot | `main` | [`eb10d91e48ccbd0930427461fb392337addb1ac0`](https://github.com/openai/codex/commit/eb10d91e48ccbd0930427461fb392337addb1ac0) | moving | Forward-looking evidence only |

The local ambient `codex --version` during the audit was `codex-cli 0.151.0`.
It was not substituted for either exact target and was not used for a provider
or repository run.

## Current-owner reuse map

| Current owner | Reused meaning |
| --- | --- |
| [Masterplan](../01_AUGNES_VNEXT_MASTERPLAN.md) | Continuity of meaning across native surfaces; native hosts own their interaction and execution grammar. |
| [Architecture and protocol](../02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md) | Canonical Augnes identities, `ExternalRef`, TaskContext currentness, source/temporal lineage, Evidence/Claim/uncertainty, authority separation, RunReceipt, proposal, review, and Transition semantics. |
| [Transition roadmap](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) | Current managed Resume implementation, current/later sequencing, #1149 re-audit requirement, and RW1B ambient freeze. |
| [Evaluation and maturity](../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) | API existence is not product benefit; operational convenience cannot be promoted to semantic correctness without outcome evidence. |
| [`NativeHostAdapterV01`](../../../types/vnext/native-host-adapter.ts) | Host references and the current narrow resume capability. |
| [Repository resume eligibility](../../../lib/vnext/repository-execution/repository-run-resume.ts) | Exact, non-mutating resume eligibility and reconciliation boundaries. |
| [Managed Resume](../../../lib/vnext/repository-execution/repository-managed-resume.ts) | Browser decision, durable attempt/claim, invocation marker, replay, controller generation, and no-second-invocation behavior. |
| [Isolated-auth semantic profile](../../../lib/vnext/native-host/codex-isolated-auth-projection.ts) | Exact executable/version/source/auth/config/provider/method qualification and isolated state. |
| [Codex app-server adapter](../../../lib/vnext/native-host/codex-app-server-adapter.ts) | Exact consumed methods, conservative notifications, isolated ephemeral threads, cleanup, and host-attested result limits. |

## Evidence classification

- **Stable public** means an un-gated app-server method or field in that exact
  released source. It does not claim user benefit or cross-version stability.
- **Experimental public** means source explicitly gates the method or field as
  experimental, unstable, or under development.
- **Internal semantic implementation** means checked-in behavior exists but is
  not a public compatibility contract.
- **Absent** means the inspected exact source did not contain the primitive.
- **Unknown** means source inspected here does not prove the behavior.

At `0.150.1`, `thread/start`, `thread/resume`, `thread/fork`,
`thread/unsubscribe`, goals, `thread/compact/start`, and `thread/read` were
already un-gated methods. Queue, thread settings mutation, memory mode,
projects, realtime, and timeline were explicitly experimental in the
[method registry](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server-protocol/src/protocol/common.rs#L510-L665).
The same split remains visible in the
[`0.152.1` registry](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/common.rs#L510-L665).

## Continuity ownership matrix: source status

| Primitive | Current Augnes ownership | Codex `0.150.1` | Codex `0.152.1` | Upstream-main-only delta | Classification |
| --- | --- | --- | --- | --- | --- |
| Thread persistence | Host thread ID is an `ExternalRef`; Augnes owns bounded canonical work/run state, not a transcript store. | Durable non-ephemeral threads and rollout-backed metadata/history exist. `ephemeral` explicitly prevents disk materialization. | Same ownership; the returned `Thread.historyMode` field is stabilized while selecting `thread/start.historyMode` remains experimental. | Thread metadata adds current/persisted model and reasoning effort. | Stable public thread identity/persistence; history-mode selection remains experimental. |
| `thread/read` | Augnes may read host state as an observation; it does not accept it as canonical truth. | Stable public metadata read with optional persisted turns. | Stable; full-history hydration is deprecated in favor of paginated reads. | Additive model/effort metadata only. | Stable public method. |
| `thread/resume` | Codex ref plus current managed binding; semantic currentness remains Augnes-owned. | Stable public resume by thread ID. History/path and several response optimizations are experimental. Running-thread resume rejoins; cold resume restores persisted state. | Same core method; `excludeTurns` and backward cursors are stabilized, and pagination guidance is strengthened. | No relevant method delta. | Stable public method with experimental fields and internal restoration behavior. |
| `thread/fork` | Fork ID and host ancestry are external references; Augnes source/run lineage remains canonical. | Stable public fork with `lastTurnId`; path, before-turn, pagination, and deferred goal continuation fields are experimental. | Core method unchanged; `excludeTurns` is stabilized. | No relevant method delta. | Stable public method with experimental fields. |
| Persisted history | Augnes persists canonical records and bounded source refs, never a second broad conversation history. | Legacy and paginated rollout history exist; paginated history selection and list methods are experimental. | The returned `Thread.historyMode`, `thread/turns/list`, and `thread/items/list` are stabilized; start-time history-mode selection remains experimental. | Only additive thread metadata observed. | Mixed stable public and experimental public at 0.150.1; more stable public at 0.152.1. |
| Compaction | TaskContext currentness and semantic lineage must survive independently of host context shape. | Stable `thread/compact/start`; durable compaction item/history behavior exists. `thread/compacted` is a deprecated notification. | Same public method; internal compaction implementation changes do not alter Augnes ownership. | Internal changes only. | Stable public method plus internal implementation. |
| Thread-owned settings and cwd restoration | Augnes binds exact repository root/worktree and grants separately; it does not own Codex UI preferences. | Start/resume expose cwd and policy fields; cold resume restores persisted model/provider/approval settings, and runtime replacement restores loaded thread settings. `thread/settings/update` is experimental. | Same; adds experimental per-turn settings mutation. | Thread metadata exposes model/effort. | Stable public start/resume fields; experimental mutation; internal restore logic. |
| Persisted goal lifecycle | Codex goal ID/status is host-local. Augnes Work, outcomes, proposals, and Decisions remain canonical. | Goal set/get/clear and notifications are stable, enabled by a stable default-on feature, state-backed, and restored after resume. | Same lifecycle with additional accounting/failure hardening. | Internal goal mutation handling changes only. | Stable public host capability plus internal implementation. |
| Automatic goal continuation | No current Augnes owner; host continuation cannot decide semantic success. | Already present: thread resume restores the goal runtime, and idle lifecycle can start another goal turn. Fork may defer initial goal continuation. | Adds goal turn attribution, descendant usage accounting, repeated execution-failure handling, and stronger no-progress/wait guidance. | Internal changes; no new released method. | Internal host semantic implementation behind stable goals capability; benefit unqualified. |
| Queue / idle submission | None. This is host input scheduling, not canonical Augnes sequencing. | Queue methods/notification are experimental; Core has internal start-if-idle admission. | Same public status with implementation hardening. | No relevant public delta. | Experimental public queue plus internal idle admission. |
| Memory eligibility | Reviewed Perspective adoption and provenance remain Augnes-owned. | Thread memory-mode and reset methods are experimental. The memory feature is stable but default-off; eligibility is not reviewed adoption. | Same. | No qualifying public delta. | Experimental public controls plus internal memory implementation. |
| Realtime timeline / durable realtime facts | Augnes Evidence/Claim/uncertainty remains canonical; a transcript is not accepted evidence. | Realtime and timeline APIs are experimental. Live state is intentionally transient while completed history is served from the rollout index. | Same relevant semantics. | Realtime history implementation moves toward Core after the released target. | Experimental public and internal implementation. |
| Project/thread assignment | Augnes Workspace/Project/Work identities remain canonical; Codex project/thread IDs are external host refs. | Project APIs, thread project assignment, and project notifications are experimental, despite app-server calling its own project assignment canonical. | Same. | Additive thread model/effort metadata only. | Experimental public host namespace. |
| Reconnect / recovery | Managed repository Resume owns exact safe continuation; generic UI reconnection is not canonical state. | Stable resume can reopen or rejoin; resume auto-attaches a listener. General process/network recovery benefit is not proven. | Same core behavior. | No relevant public delta. | Stable public resume; broader reconnect semantics unknown. |
| Guardian / host authorization continuity | Augnes execution grants, external-effect authority, and semantic authority remain separate and exact. | Guardian approval is stable/default-on. Internal authorization version was coupled to history rewrite generation plus user-message count. | Internal authorization revision is explicitly preserved across compaction/internal context and also accounts for successful host-produced user-input answers. | Further internal Guardian work only. | Stable host feature; authorization version is internal semantic implementation. |
| Event/subscription lifecycle | Augnes records bounded lifecycle observations but does not own app-server subscriptions. | Resume auto-subscribes; `thread/unsubscribe` is stable. Notifications are a stable/experimental mix. | Same, plus two new un-gated auth-recovery notifications. | No relevant method addition. | Stable public lifecycle methods with version-sensitive notifications. |
| Persistent-mode follow-up | None currently; it cannot become Augnes semantic continuity. | `persistent` reasoning effort and its world-state instructions are absent. Goals already continue automatically without it. | Adds released `persistent` reasoning effort plus internal replace/remove-aware developer context. No source-only proof of benefit. | Ongoing internal changes only. | Released enum shape plus internal semantic implementation; product maturity unknown. |
| Sleep / context-reset continuation | Augnes owns semantic reentry after host loss, not OS power management. | Prevent-idle-sleep is experimental. Compaction and resumed goals exist; no general host wake scheduler is shown. | Same relevant split. | No qualifying public delta. | Experimental sleep prevention; stable compaction/resume; arbitrary wake behavior absent/unknown. |
| Lineage across automatic continuation | Augnes owns source/temporal lineage and exact run/result binding. | Thread, session, fork, parent, goal, and turn identities exist, but automatic goal continuation has no Augnes work/run/source binding. | Adds a host-local `turnTrigger = goal` attribution and internal lineage hardening. | No public Augnes-equivalent lineage. | Stable/internal host lineage only; canonical semantic lineage absent. |
| Authorization/history-generation separation | Augnes already keeps authority distinct from history and execution completion. | Guardian's internal authorization version uses history generation, so compaction/history rewrites can change it. | Concrete strengthening: a user-message/reset revision is preserved across compaction and internal context. | Further internal work only. | Internal semantic implementation, not an Augnes authority contract. |

Primary official source anchors for the table are:

- [`0.150.1` thread start/resume/fork fields](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server-protocol/src/protocol/v2/thread.rs#L62-L610)
- [`0.150.1` thread identity, history mode, persistence, project, cwd, and turns](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs#L70-L272)
- [`0.150.1` persisted read implementation](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server/src/request_processors/thread_processor.rs#L2738-L2814)
- [`0.150.1` resume response, goal restoration, listener attachment, and persisted settings](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server/src/request_processors/thread_processor.rs#L3814-L4022)
- [`0.150.1` goal resume and idle hooks](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/ext/goal/src/extension.rs#L133-L158) and [automatic continuation](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/ext/goal/src/runtime.rs#L338-L425)
- [`0.150.1` feature stages](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/features/src/lib.rs#L1415-L1545)
- [`0.150.1` realtime live-versus-durable split](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server/src/realtime_history.rs#L88-L98)
- [`0.152.1` persistent effort](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/protocol/src/openai_models.rs#L47-L79) and [persistent-mode world-state implementation](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/core/src/context/world_state/persistent_mode.rs#L1-L124)
- Guardian authorization version at [`0.150.1`](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/core/src/codex_thread.rs#L173-L200) and [`0.152.1`](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/core/src/codex_thread.rs#L179-L204)
- [Upstream-main additive thread metadata](https://github.com/openai/codex/blob/eb10d91e48ccbd0930427461fb392337addb1ac0/codex-rs/app-server-protocol/src/protocol/v2/thread_data.rs#L215-L270)

## Continuity ownership matrix: recommendation and risk

| Primitive | Recommended owner | Adapter treatment | Authority meaning | Compatibility risk |
| --- | --- | --- | --- | --- |
| Thread persistence | Native Codex | Keep only exact external refs and bounded observations; do not mirror transcripts. | Persistence grants no semantic or execution authority. | Host deletion, ephemeral mode, and version skew cannot erase required Augnes state. |
| `thread/read` | Native Codex | Continue exact read parsing for the current consumer; treat unknown/ambiguous status conservatively. | Read state is an observation, not verified success. | Pagination changes and additive fields require exact-version tests. |
| `thread/resume` | Native Codex for reopening; Augnes for safe managed continuation | Keep the current exact binding and managed gate around the native call. | Reopening a thread grants no new run, effect, or review authority. | Running/cold semantics, notifications, and partially observed effects can diverge. |
| `thread/fork` | Native Codex | No new adapter capability until a concrete consumer exists. | Fork ancestry is not canonical source/run lineage. | Experimental fork fields and goal inheritance may change. |
| Persisted history | Native Codex | Do not create another history store; consume only bounded required history. | Conversation history is not accepted truth or Evidence. | Full-history hydration is already being deprecated. |
| Compaction | Native Codex | Accept bounded lifecycle/item observations only. | Compaction never changes authority or semantic currentness. | Host context loss may omit facts not stored canonically by Augnes. |
| Settings/cwd | Native Codex, with Augnes exact repository binding | Pass and validate the exact repository cwd/policy required by the invocation; never inherit grants from settings. | Host approval/sandbox settings are not Augnes execution grants. | Restored settings can differ from current repository/worktree requirements. |
| Goal lifecycle | Native Codex | Do not map to Augnes Work status or broaden `resume_capability`. | Goal complete/blocked is host operational state, not verified task success. | Feature behavior and accounting can strengthen without protocol replacement. |
| Automatic goal continuation | Native Codex | Candidate for later measurement only; no current adapter contract. | Automatic turns cannot acquire semantic/external-effect authority. | Runaway/no-progress behavior and provider cost require bounded experiments. |
| Queue / idle | Native Codex | No scheduler or queue mirror in Augnes. | Queued input is not execution authorization. | Experimental API and app-local scheduling semantics. |
| Memory eligibility | Native Codex for host memory; Augnes for reviewed Perspective | Keep isolated-auth memory disabled and state isolated; no capability expansion. | Eligibility is not review, acceptance, or Perspective adoption. | Cross-attempt contamination and unreviewed semantic influence. |
| Realtime timeline | Native Codex | No current consumer; do not treat transcript facts as evidence automatically. | Realtime completion is not verified outcome. | Experimental methods and evolving durable projection. |
| Project/thread assignment | Native Codex for UI organization; Augnes for canonical identity | Store only namespace-qualified external refs. | Host assignment grants no project/work authority in Augnes. | Same nouns can cause accidental identity conflation. |
| Reconnect/recovery | Native Codex operationally; Augnes semantically | Preserve managed Resume and stateless reentry paths. | Reconnection does not reauthorize effects. | Unknown recovery after process crash, machine sleep, or partial external effects. |
| Guardian | Native Codex for host authorization | Observe bounded approvals only where consumed; never translate them into Augnes grants. | Guardian approval is host-local and non-inheritable. | Internal semantics changed between the two releases. |
| Events/subscriptions | Native Codex | Continue fail-closed unknown notification handling; add methods only in a separate exact qualification. | Event delivery is evidence of host observation, not semantic truth. | New stable notifications can currently terminate the adapter. |
| Persistent mode | Native Codex | No dependency now; a later versioned experiment may measure efficiency. | Persistence cannot carry Augnes authority across turns. | Released shape, internal semantics, and product benefit have different maturity. |
| Sleep/context reset | Native host for awake/runtime behavior; Augnes for reentry | No scheduler; reconstruct bounded current context after loss. | Waking or continuing does not authorize action. | Sleep prevention is experimental and not a wake/recovery guarantee. |
| Automatic-continuation lineage | Native Codex for thread/goal attribution; Augnes for source/run lineage | Keep Codex IDs as external refs bound inside Augnes records. | Parent/goal/turn IDs do not prove current source or effect authority. | Host lineage lacks exact Augnes source/checkpoint binding. |
| Authorization/history separation | Each layer retains its own owner | Do not consume internal Guardian generations as Augnes authority versions. | Authority remains explicit, source-bound, and non-inheritable. | Internal Codex changes are not public contracts. |

## What changed from 0.150.1 to 0.152.1

The released comparison does **not** show that continuity arrived in 0.152.1.
The following meaningful primitives already existed in 0.150.1:

- durable thread persistence and rollout history;
- stable `thread/read`, `thread/resume`, and `thread/fork` methods;
- compaction;
- persisted and restored thread settings;
- stable persisted thread goals;
- automatic goal continuation on idle and restoration after resume;
- experimental queue, memory, realtime/timeline, and project capabilities;
- stable Guardian approval and experimental sleep prevention.

The source-backed 0.152.1 strengthenings relevant to this audit are narrower:

1. `thread/turns/list`, `thread/items/list`, the returned
   `Thread.historyMode`, `excludeTurns`, and backward cursor fields move from
   experimental to stable, while start-time history-mode selection remains
   experimental and full-history hydration is explicitly deprecated for
   paginated threads.
2. Goal execution accounts for descendant tokens, detects repeated execution
   failure, adds explicit `turnTrigger = goal`, and strengthens no-progress and
   verified-wait instructions. These are host operational semantics, not
   Augnes success or authority semantics.
3. `persistent` is added as a reasoning-effort value with internal world-state
   instructions that replace or retire prior persistent-mode context.
4. Guardian authorization revision is separated from ordinary compaction and
   internal context generation. This is a real internal semantic strengthening,
   but not an exported Augnes authority contract.
5. Two new un-gated notifications appear:
   `modelProvider/authRecoveryStarted` and
   `modelProvider/authRecoveryCompleted`.
6. Auth/Agent Identity storage source is unchanged across the two tags, but
   configuration, feature, provider-recovery, and app-server surfaces changed.
   Therefore the 0.150.1 exact semantic profile cannot be assumed portable.

Upstream main at `eb10d91e...` adds model and reasoning-effort metadata to the
thread view and continues internal changes. No upstream-only observation in
this audit is production authority or a reason to bypass an exact released
qualification.

## Managed Resume comparison

### Native Codex `thread/resume`

Native resume can:

- load a non-running thread from disk by ID;
- optionally use unstable history/path sources;
- rejoin a running thread;
- restore or override host settings such as model, cwd, approval, and sandbox;
- expose persisted turns and goal state;
- attach the current app-server connection to thread events.

### Current Augnes managed Resume

Current source additionally owns all of the following:

| Responsibility | Current Augnes owner | Native `thread/resume` equivalent? |
| --- | --- | --- |
| Exact repository resume eligibility | `readRepositoryRunResumeEligibilityV01` | No |
| Binding to exact work, run, attachment, checkpoint, root, worktree, revisions, lifecycle event, step, and effect high-water | Repository checkpoint/eligibility | No |
| Pending-operation approval refusal | Repository eligibility | No |
| Browser-issued one-time Resume decision | Managed Resume preparation/admission | No |
| Durable resume attempt and mutable runtime claim | Managed Resume | No |
| Controller generation transition | Managed Resume | No |
| Durable provider invocation marker written before native resume | Managed Resume | No |
| Marker-without-controller/result reconciliation | Managed Resume | No |
| Exact replay of the admitted attempt | Managed Resume | No |
| Prevention of a second provider invocation after marker/ambiguity/settlement | Managed Resume | No |
| Result-to-run/checkpoint binding and normal receipt/review flow | Repository execution owners | No |

**Answer:** current managed Resume still owns material responsibilities that
Codex `thread/resume` does not. It must not be weakened or removed merely
because Codex can reopen a thread.

## Capability-contract disposition

The current adapter exposes:

```text
native_host_resume_binding.v0.1
+
resumable_after_detach
```

That binary capability is sufficient for the only qualified current consumer:
repository managed Resume needs to know that the adapter can reattach and then
bind exact native thread/session/turn references. All finer distinctions are
already checked by repository eligibility and managed-attempt state, not by a
generic host capability ontology.

Goals, queue, memory, project assignment, persistent mode, realtime history,
and Guardian continuity have no concrete current `resume_capability` consumer.
Adding them would pre-design a broad capability framework without demonstrated
need. The contract remains unchanged. A future consumer must justify an
additive, versioned capability with its exact decision and compatibility need.

## Bounded 0.152.1 qualification

### Result

```text
source identity = PASS
workspace version identity = PASS
initialize request/response shape = PASS (unchanged in source)
consumed method presence = PASS (thread/start, thread/read, thread/resume retained)
consumed stable field removal = NONE OBSERVED
notification compatibility = HOLD
exact executable qualification = NOT PERFORMED
isolated-auth semantic profile qualification = NOT PERFORMED
production compatibility = NOT QUALIFIED
provider/model calls = 0
managed/native repository executions = 0
Codex/OpenAI credential material accessed or exposed = 0
production pin changes = 0
shared-state contamination = 0 observed
```

| Qualification surface | Bounded observation |
| --- | --- |
| Version/source identity | Both release refs peel to the requested commits and each workspace declares the matching version. |
| Executable/profile identity | Current production admission requires the exact 0.150.1 fingerprint, CLI version, source tag/commit, and semantic-profile fingerprint. No exact 0.152.1 executable/profile was admitted. |
| Initialize capabilities | `InitializeParams`, `InitializeCapabilities`, and `InitializeResponse` are unchanged between the tags. The ordinary adapter opts out of experimental API; the credential-free preflight sends no capabilities. |
| Method shape | Stable `thread/start`, `thread/read`, and `thread/resume` remain. The profile names initialize/account/auth/config/MCP/start methods, but the credential-free preflight itself invokes only initialize and `config/read`; it does not exercise read/resume, and isolated authenticated execution explicitly refuses resume. Source presence is not runtime qualification. |
| Notifications | The adapter recognizes lifecycle notifications, ignores an explicit bounded set, and fails closed on every other method. 0.152.1 adds two un-gated auth-recovery notifications outside that set. |
| Auth/storage/provider | Agent Identity and auth-storage source files are unchanged between the tags. Provider recovery, config, feature, and app-server surfaces changed, so the exact composite profile still requires a new version. |
| Isolated state | Current controls require private home, Codex home, SQLite home, and temp roots; prohibit shared fallback; require ephemeral isolated-auth threads; and remove the private root during cleanup. |
| Residue | No app-server qualification process was launched and no Codex runtime/home/SQLite state was created. The disposable source clone is audit-only and is removed after source inspection. |

The current credential-free preflight is safe but intentionally exact: it
admits only the pinned production executable fingerprint, requires CLI
`0.150.1`, binds the `rust-v0.150.1` semantic profile, uses private
`HOME`/`CODEX_HOME`/`CODEX_SQLITE_HOME`/`TMPDIR`, reads `initialize` and
`config/read`, refuses server requests, and cleans its private root. It cannot
qualify a 0.152.1 executable without first adding a new exact executable
fingerprint and versioned auth/config/provider/method profile. The installed
local CLI was 0.151.0, not an exact comparison binary.

The source comparison found one concrete adapter incompatibility risk. The
adapter ignores only an explicit known notification set and otherwise raises
`codex_notification_method_unsupported`. The two new 0.152.1 un-gated auth
recovery notifications are not in that set. A credential-free initialization
might never emit them, so such a smoke would not prove provider-path
compatibility. Handling or explicitly suppressing them requires a separate
source change and exact tests.

The current isolated-auth path also requires an ephemeral thread, prohibits
resume, disables memory/plugins/apps/skills/hooks/MCP/web/remote features,
forbids shared state fallback, and checks exact config provenance and provider
route material. Those controls remain appropriate, but their exact 0.152.1
projection is unqualified.

Building an alternate broad harness in this issue would violate the requested
smallest-artifact boundary. Therefore the truthful result is a source-shape
partial pass and an exact compatibility gap, with the production pin retained.

### Separate cutover qualification requirements

A future exact 0.152.1 cutover issue should, without provider/model calls:

1. bind an official exact 0.152.1 executable fingerprint and source identity;
2. add a versioned semantic profile rather than overwrite the 0.150.1 profile;
3. re-read exact auth storage, Agent Identity, provider route, config provenance,
   feature keys, and app-server method shapes;
4. classify the two auth-recovery notifications and any other notification
   delta in fail-closed tests;
5. exercise credential-free method shapes only in private isolated homes,
   while preserving ephemeral-only isolated-auth execution and its explicit
   resume refusal;
6. prove process, thread, SQLite, temp-file, and directory cleanup;
7. avoid changing RW1B ambient conditions until that lane's frozen collection
   and interpretation boundary permits a separately reviewed cutover.

Passing those checks would still not by itself authorize changing the
production pin.

## Issue #1149 disposition: `narrow`

The useful provider-neutral checkpoint question is:

> What exactly can a successor safely continue from?

It is not:

> When should this host wake up and run again?

Retain these provider-neutral fields or meanings:

- exact workspace/project/work/run/source identity;
- last verified observation and its source/time;
- terminal/non-terminal/unknown state without fabricated closure;
- continuation generation/revision;
- authority non-inheritance;
- source-bound integrity/fingerprint;
- stale/replay refusal and exact successor binding;
- bounded uncertainty and explicit stop conditions.

Scheduling-like fields require this narrower treatment:

| Field | Classification | Narrow treatment |
| --- | --- | --- |
| `not_before` | Portable non-authoritative observation hint only | May say that observation before a source-backed instant is not useful/safe. Must not schedule or authorize a wake/run. |
| `observation_window` | Portable non-authoritative observation hint | May bound the freshness window for a named observation. Must not become a polling loop or host timer. |
| `backoff_class` | Duplicate host scheduler/runtime microstate | Remove from canonical checkpoint ownership. An adapter may keep private operational retry state. |
| `next_safe_action` | Portable non-authoritative hint when exact and revalidated | May name the next review/observation step against exact source. Must not be an executable command, queue item, or inherited grant. |

No #1149 runtime, schema, or API work belongs in this branch. Its future
implementation must reuse current owners rather than revive historical CW1
mechanisms or duplicate Codex goals/queues.

## RW1B boundary

[Issue #1130](https://github.com/hynk-studio/augnes/issues/1130) remains an
active authentic real-work collection lane. This PR has no RW1B impact:

```text
Codex version = unchanged
memory eligibility = unchanged
persistent mode = unchanged
goal and queue behavior = unchanged
continuity treatment = unchanged
schedule = unchanged
consumed slots = unchanged
metrics = unchanged
interpretation = unchanged
```

A future 0.152.1 cutover could confound RW1B. That is a sequencing finding
only, not authority to alter, reset, reinterpret, or delay the current lane.

## Reconfirmed Augnes canonical responsibilities

Current implementation and active owners, not doctrine alone, confirm that
Augnes must continue to own:

- Workspace, Project, Work, and Run identity;
- TaskContextPacket construction, currentness, and bounded source refs;
- source and temporal lineage;
- exact run/result/attachment/checkpoint binding;
- fresh, stale, ambiguous, and reconciliation-required interpretation;
- Evidence, Claim, uncertainty, assessment, and observation distinctions;
- execution grants and external-effect authority;
- result -> proposal -> ReviewDecision -> separately authorized Transition;
- reviewed memory/Perspective adoption;
- cross-model and cross-provider succession;
- zero-model continuity;
- stateless-host and ephemeral-host semantic reentry;
- exact replay and stale-state refusal;
- semantic authority boundaries.

Codex thread, project, goal, turn, session, connection, and rollout identifiers
remain namespace-qualified external host references unless a future active
Augnes owner explicitly changes that rule.

## Non-Codex/stateless fallback invariant

The following path must remain valid even when native Codex persistence is
unavailable:

```text
reviewed Augnes canonical state
-> current TaskContextPacket or equivalent bounded context
-> new stateless, local, alternate-provider, or ephemeral model instance
-> bounded native execution
-> RunReceipt and independent verification
-> assessment / proposal
-> ReviewDecision
-> separately authorized Transition
```

Host thread history may make this path cheaper or more fluent. It may not
change the identity, meaning, evidence standard, authority, or review required
at any step.

## Real duplication versus similar naming

| Apparent overlap | Classification | Reason |
| --- | --- | --- |
| Second transcript/history store | Real duplication to avoid | Codex already persists operational conversation history; Augnes needs bounded canonical records, not a mirror. |
| Augnes scheduler/queue/backoff actor | Real duplication to avoid | Codex owns host-local goals, queue, idle submission, and persistent follow-up; other hosts may own different operational mechanisms. |
| New unreviewed memory platform | Real duplication to avoid | Host memory eligibility is operational/personal context; reviewed Perspective adoption has different semantics. |
| Codex Project vs Augnes Project | Similar name, different layer | Codex project organizes host threads; Augnes Project is canonical product identity. |
| Codex ThreadGoal vs Augnes Work/Decision | Similar name, different layer | A host objective can drive turns but cannot decide verified success or apply semantic state. |
| `thread/resume` vs managed Resume | Similar name with partial operational overlap | Native resume reopens a thread; managed Resume owns exact repository admission, replay, and effect ambiguity. |
| Codex compaction/history vs TaskContextPacket | Similar continuity purpose, different truth boundary | Host context preserves conversational utility; TaskContextPacket asserts bounded current source context. |
| Guardian approval vs Augnes grants | Similar authorization vocabulary, different authority | Host tool review does not create execution grants, external-effect authority, or semantic authority in Augnes. |
| Turn/goal completion vs RunReceipt verification | Similar terminal vocabulary, different evidence | Host completion records execution state; Augnes separately verifies outcome and reviewability. |

## Artifact and verification boundary

This issue intentionally produces one documentation artifact. It makes no
runtime, Core, schema, migration, provider, executable, managed Resume,
capability-contract, #1149 runtime, or RW1B change. Source comparison used
official immutable Codex commits in a disposable local clone. No provider/model
call, credential access, production repository execution, or persistent-mode
experiment occurred.
