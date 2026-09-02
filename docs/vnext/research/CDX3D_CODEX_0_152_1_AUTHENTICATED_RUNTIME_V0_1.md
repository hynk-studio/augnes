# CDX3D Codex 0.152.1 authenticated runtime qualification v0.1

## Scope and verdict

This record closes the bounded authenticated-runtime attempt authorized by
[Issue #1195](https://github.com/hynk-studio/augnes/issues/1195). It does not
reopen the production selection completed by merged
[PR #1194](https://github.com/hynk-studio/augnes/pull/1194).

```text
verdict = HOLD / NOT_QUALIFIED
base SHA = 3347d5bdf67a79d6e15dba72a2fe2a6080b27d66
base tree = cecdcfc0a47b594a80c78c15b63ec71ff005f43e
branch = codex/1195-cdx3d-authenticated-0-152-1-runtime
production selection = rust-v0.152.1, unchanged
official bootstrap result = HTTP 403 from Agent Identity registration
authenticated app-server children = 0
provider/model invocations = 0
repository tasks / executions = 0 / 0
```

The exact stopping boundary is the official Codex Agent Identity service. It
is not an interactive login or consent prompt, and no current source establishes
a user action that would make the non-retryable 403 succeed. Augnes does not
mint substitute identity material, weaken isolation, or consume provider
authority past this stop.

The CDX3A ownership boundary remains unchanged:

```text
official Codex auth state != Augnes semantic state
host-local operational continuity
!=
Augnes canonical semantic / epistemic / authority continuity
```

## Re-resolved identity

Current `origin/main`, the merged CDX3C record, the exact 0.152.1 source tag,
and current production source were re-read before the attempt.

| Identity | Exact value | Result |
| --- | --- | --- |
| Repository | `hynk-studio/augnes` at `/Users/hynk/code/augnes` | Exact |
| Current base | `3347d5bdf67a79d6e15dba72a2fe2a6080b27d66` | Exact merged PR #1194 commit |
| Base tree | `cecdcfc0a47b594a80c78c15b63ec71ff005f43e` | Exact |
| Production tag | `rust-v0.152.1` | Selected, unchanged |
| Upstream peeled commit | [`5adb68a49933ae446bf11935662c83dba55a0804`](https://github.com/openai/codex/commit/5adb68a49933ae446bf11935662c83dba55a0804) | Exact tag resolution |
| macOS arm64 executable SHA-256 | `8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf` | Current production selection; no child launched |
| production semantic-profile SHA-256 | `795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529` | Current source exact |

The current user-agent contract, strict config projection, private-state
policy, and negative admission remain the CDX3C-selected owners. The selected
profile still disables memories, Persistent reasoning, goal/queue
continuation, apps, plugins, skills, MCP, web, browser/computer use, remote
surfaces, `sleep_tool`, and `content_item_kinds`. No executable, version,
source, profile, or test-emulation admission rule changed in this closeout.

## Exact prerequisite from upstream source

The exact `rust-v0.152.1` source establishes this sequence:

1. `AuthManager::agent_identity_auth(AgentIdentityAuthPolicy::ChatGptAuth, …)`
   accepts existing managed ChatGPT auth and serializes bootstrap through its
   Agent Identity lock.
2. Reuse requires an official record whose `account_id` and
   `chatgpt_user_id` match the current ChatGPT source and whose private key can
   derive its public key. A missing or mismatched record is not reused.
3. `register_managed_chatgpt_agent_identity` asks the official
   `codex-agent-identity` component to generate the key material and POST an
   ABOM, public key, and `responsesapi` capability to
   `https://auth.openai.com/api/accounts/v1/agent/register` with the managed
   ChatGPT access token.
4. After a successful identity registration, the same official component POSTs
   a signed task-registration request to
   `/v1/agent/{agent_runtime_id}/task/register`.
5. Only after both steps succeed does `AuthManager` persist the returned
   `AgentIdentityAuthRecord`, including its task binding, through the configured
   official auth storage.

Primary exact source anchors are the upstream
[`AuthManager`](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/login/src/auth/manager.rs),
[`AgentIdentityAuth` bootstrap](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/login/src/auth/agent_identity.rs),
[`codex-agent-identity` registration client](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/agent-identity/src/lib.rs),
and [official auth storage](https://github.com/openai/codex/blob/5adb68a49933ae446bf11935662c83dba55a0804/codex-rs/login/src/auth/storage.rs).

The source found here was ordinary managed ChatGPT file auth. That is proven by
the official manager passing its `CodexAuth::Chatgpt` gate and reaching the
registration endpoint. The exact absent state was an official record with a
matching account/user binding and completed task registration. It was not a
missing API key, synthetic JWT, or unsupported alternate auth source.

In file-store mode, a successful record would be durable user-owned official
Codex auth state in `$CODEX_HOME/auth.json` with private file permissions. The
reusable agent identity remains official Codex state; it is not copied into
Augnes canonical state. The task registration is created by the official
component and remains part of that official record. No current app-server
account/login method exposes a separate Agent Identity bootstrap RPC; the
source-owned non-interactive entry point is `AuthManager::agent_identity_auth`.

## Official bootstrap execution and stop

The verified upstream workspace at the exact peeled commit was used to build a
temporary output-redacted invocation shim. The shim called only the public
official `AuthManager` method with `ChatGptAuth`, file storage, the user-owned
official Codex home, and `SessionSource::Exec`. It did not receive a token in
argv, read or construct identity fields itself, or serialize upstream errors.
All key generation, registration request construction, account binding, task
registration, and persistence remained inside the exact official components.

The first two redacted invocations established failure and continued absence
of the official record. A final status-classified invocation established the
deciding public-safe failure class:

```text
official bootstrap invocations = 3
identity-registration HTTP result = 403
task-registration requests = 0
browser / device / consent / user-presence requests = 0
official Agent Identity records created = 0
official task bindings created = 0
auth.json modification = none observed; mode remained 0600
post-attempt broker state = agent_identity_bootstrap_required
```

HTTP 403 is non-retryable under the upstream registration classifier. No raw
access token, JWT, private key, runtime id, task id, account id, user id, email,
response body, or credential-bearing error was printed, logged, committed, or
placed in evidence. The official source auth file remained in place and was
not copied or deleted.

There is no truthful `USER_ACTION_REQUIRED` disposition: upstream requested no
interaction, and current source does not prove that login repetition, browser
confirmation, or consent would resolve this service refusal. Inventing such an
action would overstate the evidence.

## Runtime and authority accounting

The current [credential broker](../../../lib/vnext/native-host/codex-credential-broker.ts)
was used for public-safe readiness classification before and after the official
attempt. Because the record remained absent, the existing fail-closed broker
boundary stopped before attestation, private snapshot creation, child launch,
authenticated preflight, or external execution authorization.

| Surface | Actual result |
| --- | --- |
| Augnes broker source reads | 2, both read-only readiness classifications |
| Official bootstrap auth loads | 3, ordinary managed ChatGPT file auth |
| Credentials supplied to official bootstrap | yes, opaquely by official `AuthManager` |
| Credentials supplied to app-server child | no |
| Credential or identity copies into Augnes/shared state | 0 |
| Public credential/JWT/private-key/token/transcript exposures | 0 |
| Authenticated methods exercised | none |
| `initialize` / `initialized` | not exercised authenticated |
| `account/read` / `getAuthStatus` | not exercised |
| `config/read(includeLayers=true)` / `mcpServerStatus/list` | not exercised authenticated |
| `thread/start` / `turn/start` | not exercised |
| Provider/model invocations | 0 |
| Approval / tool / effect counts | 0 / 0 / 0 |
| Repository task / execution counts | 0 / 0 |
| Proposal / `ReviewDecision` / `Transition` counts | 0 / 0 / 0 |
| Durable Augnes memory/adoption count | 0 |

Bootstrap alone did not grant provider authority. Preflight did not occur and
therefore did not grant provider authority. No production rollout execution
authorization was created or consumed. The current test-only one-turn grant
remains test-emulated and cannot masquerade as production. No auth-recovery
notification, unknown notification, server request, experimental turn update,
or setting update was reached.

The required single real synthetic turn was deliberately not attempted. A
provider call before the official record, exact account/user binding,
authenticated preflight, and explicit single-use rollout authorization would
violate Issue #1195 rather than qualify the runtime.

## RW1B accounting

Merged PR #1194 established the production-selection boundary at
`3347d5bdf67a79d6e15dba72a2fe2a6080b27d66` on 2026-09-02 at 19:01:01 UTC.
Issue #1130 and its current comments were read after the stopped bootstrap.
They contain the CDX3C boundary note and no authentic RW1B observation after
that merge.

```text
authentic RW1B observations between selection and this closeout = 0
slot impact = none
schedule impact = none
metric / assignment impact = none
historical evidence rewrite = none
runtime rollout counted as an episode = no
```

The intermediate operational condition remains truthfully recorded as
“0.152.1 selected / authenticated runtime not qualified.” No Issue #1130
comment is added by this Draft closeout because no runtime-availability change
occurred and the existing boundary note is already current.

## Cleanup and non-impacts

The temporary upstream clone, output-redacted shim, Rust toolchain, registry,
and build cache were permanently removed after the public-safe 403
classification. No app-server child or listener was created, no private
execution root was created, and no rollout temp state remains.

```text
child count after settlement = 0
listener residue = 0
private app-server temp-state residue = 0
official user auth record deleted = no
Companion state affected = no
PR #1191 / PR #1192 affected = no
Core / schema / migration affected = no
production version changed = no
Persistent mode / Issue #1149 / managed Resume changed = no
```

The remaining blocker is the official Agent Identity registration endpoint's
non-retryable HTTP 403 for the current managed ChatGPT credential source. A
future attempt requires new evidence that the official service/account boundary
has changed; this record grants no blind retry, alternate identity, workaround,
or provider turn.
