# CDX3B Codex 0.152.1 exact qualification v0.1

## Role, boundary, and verdict

This record closes the bounded compatibility work requested by
[Issue #1189](https://github.com/hynk-studio/augnes/issues/1189). It qualifies
one exact released Codex executable against the current Augnes app-server and
isolated-auth contract. It is not a production cutover.

```text
verdict = QUALIFIED_EXACT
qualification scope = exact released darwin/arm64 executable plus the bounded
  no-provider app-server/config profile and source-compatible consumed methods
production selection = rust-v0.150.1, unchanged
production cutover authority = none
provider/model calls = 0
repository task executions = 0
Codex/OpenAI credential material supplied, read, copied, or exposed = 0
```

The merged CDX3A boundary remains controlling:

```text
host-local operational continuity
!=
Augnes canonical semantic / epistemic / authority continuity
```

Nothing observed here reopens Core, managed Resume, `resume_capability`, Issue
#1149, RW1B, or persistent-mode architecture.

## Repository and exact target identity

```text
repository = hynk-studio/augnes
canonical root = /Users/hynk/code/augnes
base branch = main
base SHA at branch creation = 0a039f07ffb106c53a767fa21c0a96ad07a5728e
qualification branch = codex/1189-cdx3b-codex-0-152-1-qualification
qualification date = 2026-09-02
platform = darwin
architecture = arm64
```

Both source identities were independently re-resolved from official
`openai/codex` refs:

| Role | Official tag | Peeled source commit | Disposition |
| --- | --- | --- | --- |
| Current production-qualified target | `rust-v0.150.1` | [`90854393966b21e9ebfd21b122334eb09a20c93d`](https://github.com/openai/codex/commit/90854393966b21e9ebfd21b122334eb09a20c93d) | Remains selected and unchanged |
| Qualification candidate | [`rust-v0.152.1`](https://github.com/openai/codex/releases/tag/rust-v0.152.1) | [`5adb68a49933ae446bf11935662c83dba55a0804`](https://github.com/openai/codex/commit/5adb68a49933ae446bf11935662c83dba55a0804) | Additive qualification profile only |

The candidate was the official release asset, not the ambient executable and
not an approximate build:

```text
asset = codex-aarch64-apple-darwin.tar.gz
release publication = 2026-09-01T22:33:02Z
release archive SHA-256 =
  8ddde1fcf5c9842e9baa09c7c108088bb22a39feb86e4344e45dc0986764b9d7
GitHub release digest match = yes
archive member = codex-aarch64-apple-darwin
executable format = Mach-O 64-bit executable arm64
executable SHA-256 =
  8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf
CLI report = codex-cli 0.152.1
app-server user agent report = 0.152.1
source workspace version = 0.152.1
provenance = downloaded from the official GitHub release asset and checked
  against the release API digest before extraction and execution
```

## Current-owner reuse

| Current owner | Reused contract |
| --- | --- |
| [CDX3A qualification](./CDX3A_CODEX_CONTINUITY_QUALIFICATION_V0_1.md) | Operational/semantic ownership split, unchanged Core and managed Resume decisions, narrow capability contract, and RW1B sequencing boundary |
| [Architecture and protocol](../02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md) | Provider-neutral identity, evidence, lineage, replay, review, Transition, and authority meaning |
| [Transition roadmap](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md) | Current production target and active implementation/qualification sequencing |
| [Evaluation and maturity](../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md) | API presence is not product benefit or production maturity |
| [Isolated-auth projection](../../../lib/vnext/native-host/codex-isolated-auth-projection.ts) | Exact source/version/executable, auth/config/provider/method composite profile, private state, and no-fallback policy |
| [Credential broker](../../../lib/vnext/native-host/codex-credential-broker.ts) | Opaque credential access, child binding, private launch capability, and cleanup ownership; not exercised with real material here |
| [App-server adapter](../../../lib/vnext/native-host/codex-app-server-adapter.ts) | Consumed RPC methods, explicit notification set, approval refusal/admission, ephemeral isolated execution, and bounded results |

## Additive profile and composite delta

The existing production profile remains byte-for-byte identified by:

```text
semantic profile = codex_isolated_auth_semantic_profile.rust-v0.150.1
semantic profile SHA-256 =
  0c2275335eb069ccd251dade36df03b6f4f0842deedc1d8d12191dadfa917058
production executable SHA-256 =
  a14f9a907c12c8812878b70e6b7d65f81c39ed795513e46a55817d7428c0ca6b
```

The candidate is a separate non-production profile:

```text
semantic profile = codex_isolated_auth_semantic_profile.rust-v0.152.1-qualification
semantic profile SHA-256 =
  222fa6bb809ef302f30e1f12de6b7475a3e736afc41db72d87e395d7fbecf0a4
production_selection = false
production_cutover_authorized = false
```

| Composite component | Exact 0.150.1 -> 0.152.1 source result | Runtime result | Qualification disposition |
| --- | --- | --- | --- |
| `initialize`, `initialized`, capabilities, and response | Protocol and processor source unchanged | Exact initialize passed with no experimental capability | Compatible exact |
| App-server user agent | Construction and client suffix binding unchanged; CLI version necessarily changes | Exact originator, platform/arch shape, client suffix, and `0.152.1` observed | Additive versioned fingerprint |
| Agent Identity claim/bootstrap | Current claim/default-client/storage owners unchanged; only separate Bedrock API-key source changed | No credential or identity material used | Source-compatible, credential runtime unqualified |
| Auth storage and keyring | File/keyring/default-client and bootstrap keyring owners unchanged | Private empty auth state; no keyring access | Source-compatible, credential runtime unqualified |
| Effective OpenAI provider route | Existing OpenAI provider values unchanged; one additive route-classification helper appears | Exact forced `model_provider=openai` projection observed; no provider request | Compatible exact for configuration, provider runtime unqualified |
| Config API and layering | Public config types unchanged; effective feature projection changes | Exact SessionFlags-only active layer and exact origins observed; empty lower layers only | Compatible through a versioned profile |
| Tool/feature schema | `sleep_tool` is new stable/default-on; `content_item_kinds` becomes stable/default-on; `background_paginated_rollout_migration=false` is newly projected; `tools.update_plan.enabled` defaults off | Candidate explicitly forces `sleep_tool=false` and `content_item_kinds=false`; background migration observed false | Preserves the current bounded surface without certifying unused APIs |
| Private state | `HOME`, `CODEX_HOME`, `CODEX_SQLITE_HOME`, and `TMPDIR` resolution remains available | Four separate mode-0700 roots created under one empty private parent | Compatible exact |
| Plugins/apps/skills/MCP/web/remote | No authority to enable any newly available surface | Exact config observed empty/disabled current-profile projections; no thread was started | Compatible for config; thread-time discovery remains runtime unqualified |
| Method profile | No consumed method removed; several existing fields stabilize and one unconsumed experimental request is added | Only initialize/initialized/config-read exercised | Mixed exact runtime and source-compatible statuses below |
| Cleanup | No relevant contract weakening | App-server stopped, owned root removed, and private parent read back empty | Compatible exact |

An unchanged source file is not treated as proof that the full composite stayed
unchanged. The candidate profile fingerprints the unchanged components and the
effective config/method deltas separately.

Primary official source anchors are:

- the unchanged 0.152.1
  [`initialize` processor](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server/src/request_processors/initialize_processor.rs)
  and [v1 initialize types](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/v1.rs);
- the 0.152.1
  [method/notification registry](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/common.rs),
  [auth-recovery payload](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/v2/notification.rs),
  and [stable-delivery transport test](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server/src/transport_tests.rs);
- the exact 0.150.1
  [method registry](https://github.com/openai/codex/blob/90854393966b21e9ebfd21b122334eb09a20c93d/codex-rs/app-server-protocol/src/protocol/common.rs)
  used for the complete added/removed method-name comparison;
- the 0.152.1
  [feature stages/defaults](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/features/src/lib.rs)
  and [config implementation](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/core/src/config/mod.rs);
- the unchanged
  [auth storage](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/login/src/auth/storage.rs),
  [default client/Agent Identity routing](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/login/src/auth/default_client.rs),
  and [keyring adapter](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/keyring-store/src/lib.rs);
- the 0.152.1
  [OpenAI provider construction](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/model-provider-info/src/lib.rs)
  and consumed [thread](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/v2/thread.rs),
  [turn](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/v2/turn.rs),
  and [account](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/app-server-protocol/src/protocol/v2/account.rs)
  protocol shapes.

## Consumed app-server contract

| Method or shape | Public status at 0.152.1 | Qualification level | Result |
| --- | --- | --- | --- |
| `initialize` | Stable public | Exact executable runtime | Passed |
| `initialized` | Stable client notification | Exact executable runtime | Passed |
| `config/read` with layers | Stable public | Exact executable runtime | Passed exact private projection |
| `account/read` | Stable public | Exact released source only | Source-compatible, runtime unqualified without credentials |
| `getAuthStatus` | Legacy consumed read | Exact released source only | Source-compatible, runtime unqualified without credentials |
| `mcpServerStatus/list` | Consumed preflight read | Exact released source only | Source-compatible, runtime unqualified without credentials |
| Agent Identity/auth observations | Consumed only by authenticated preflight | Exact released source only | Source-compatible; deliberately not exercised with sensitive material |
| `thread/start` | Stable public | Exact released source only | Source-compatible; no thread created |
| `thread/read` | Stable public | Exact released source only | Source-compatible; no user history read |
| `thread/resume` | Stable public | Exact released source only | Source-compatible; no user or managed work resumed |
| `turn/start` | Stable public | Exact released source only | Source-compatible; no provider/model turn started |
| Terminal statuses consumed by Augnes | Stable returned shape | Exact released source comparison | No consumed status removed |
| Three approval server requests | Stable public | Exact released source comparison plus existing fake-server conformance | No authority widening; unknown requests still fail closed |

“Source-compatible” does not claim successful runtime behavior or product
benefit. The no-provider boundary makes a successful model turn, authenticated
account read, thread resume, and repository effect intentionally unqualified.

## Full relevant method and notification delta

The complete method-name set comparison in the exact app-server registry found
no removed method and exactly three additions:

| Added name | Kind/status | Current consumer | Disposition |
| --- | --- | --- | --- |
| `modelProvider/authRecoveryStarted` | Stable, un-gated server notification | Adapter lifecycle | Explicit bounded observation |
| `modelProvider/authRecoveryCompleted` | Stable, un-gated server notification | Adapter lifecycle | Explicit bounded observation |
| `turn/settings/update` | Experimental client request | None | Not qualified and not enabled |

The exact auth-recovery payload requires four strings: `threadId`, `turnId`,
`provider`, and `message`. Released transport tests expressly deliver both
notifications without experimental capability. Source connects them to
provider-owned authentication recovery during the current turn; the released
implementation currently uses this path for Amazon Bedrock. It is therefore
not correct to call the events arbitrary ignorable noise.

The qualified treatment is intentionally narrow:

- classify each as stable public provider-recovery progress and an
  execution-state observation;
- require exact active thread and turn binding plus bounded public-safe
  `provider` and `message` payloads;
- surface only a fixed recovery-started/completed observation, never the raw
  recovery message;
- create no approval, grant, semantic state, task success, or verified result;
- fail closed if either event appears inside the forced-OpenAI isolated-auth
  execution profile, where it signals runtime-profile drift;
- fail closed on malformed payloads, every unrelated unknown notification, and
  every unknown authority-bearing server request.

No broad permissive notification fallback was added. Existing explicitly
ignored methods remain explicit, and all other notification names remain
unsupported.

## Isolation and thread invariants

The exact runtime qualification began from an empty mode-0700 parent and used
separate private values for all four state roots. It copied no ordinary config,
history, memory, skill/plugin/app/MCP state, or credential material. The only
configuration was the exact synthesized candidate SessionFlags profile.

The qualification sent only:

```text
initialize
initialized
config/read(includeLayers=true)
```

The qualification result records those as `runtime_exercised_methods` only
after each method is actually exercised. Early identity or profile refusal
therefore records an empty list. Notification compatibility is separately
named `source_and_fixture_qualified_notification_methods`: the exact released
source plus focused adapter fixtures qualify those two notification shapes,
but the credential-free candidate run did not claim to observe them at runtime.

It sent no account, thread, turn, tool, approval, or provider request. No
repository instruction or repository command was presented to a model, and no
model existed in the run. The parent was empty after owned process settlement
and recursive owned-root cleanup.

Current isolated authenticated execution remains unchanged and is still:

- ephemeral-thread-only;
- explicitly non-resumable;
- memory-disabled;
- plugin/app/skill/MCP/web/remote-disabled by the current profile;
- unable to fall back to shared state or inherit repository-command auth
  material;
- bounded by `project_doc_max_bytes=0` and an empty fallback-instruction list;
- required to settle and remove its exact private root.

Focused fake-server conformance additionally proves that an auth-recovery event
on that forced-OpenAI path fails as `codex_isolated_auth_runtime_policy_drift`.
No native continuity feature is enabled by this qualification.

## Negative admission results

| Substitution or stale state | Expected result | Observed result |
| --- | --- | --- |
| Wrong executable content fingerprint | Reject before launch | `executable_mismatch`; HOLD |
| Wrong CLI/user-agent version | Reject | `version_mismatch`; HOLD |
| Wrong official tag | Reject | `release_identity_mismatch`; HOLD |
| Wrong peeled source commit | Reject | `release_identity_mismatch`; HOLD |
| Wrong release archive fingerprint | Reject before launch | `release_identity_mismatch`; HOLD |
| Wrong/stale semantic-profile fingerprint | Reject before launch | `semantic_profile_mismatch`; HOLD |
| Test-emulated otherwise-compatible profile | Never claim exact | `compatible_emulated`; HOLD |
| 0.152.1 presented to 0.150.1 production admission | Reject | `executable_mismatch` |
| Exact 0.150.1 production executable/profile | Preserve prior admission | `compatible_exact` |
| Any failed/HOLD candidate | Never production compatible or selected | `not_qualified`, `production_selected=false`, `production_cutover_authorized=false` |

## Explicit non-impacts and later cutover boundary

This qualification changes no Core meaning, schema, migration, production
executable fingerprint, production version pin, managed Resume behavior,
`resume_capability`, Issue #1149 runtime, or persistent-mode setting.

RW1B impact is exactly none:

```text
active Codex version = unchanged
memory eligibility = unchanged
persistent mode = unchanged
goal/queue behavior = unchanged
continuity treatment = unchanged
schedule and consumed slots = unchanged
metrics and interpretation = unchanged
```

`QUALIFIED_EXACT` means the named official executable satisfies this bounded
candidate profile. It does not select that profile for production. A later
cutover still requires separate authority, an explicit production-selection
change, authenticated rollout evidence that does not expose credentials, and
sequencing that cannot confound RW1B. This issue creates no follow-up issue and
starts no experiment.

Canonical continuation still must work without Codex persistence:

```text
reviewed Augnes state
-> current TaskContextPacket or equivalent bounded context
-> new stateless, local, alternate-provider, or ephemeral model instance
-> bounded execution
-> RunReceipt and independent verification
-> normal proposal / ReviewDecision / Transition flow
```

Native persistence may improve host-local efficiency. It cannot change
canonical identity, evidence, authority, or meaning.
