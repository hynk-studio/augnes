# CDX3E Codex 0.152.1 exact ordinary runtime v0.1

## Scope and verdict

This record covers the ordinary ChatGPT-auth LiveNativeHost runtime boundary
authorized by [Issue #1197](https://github.com/hynk-studio/augnes/issues/1197).
It does not reopen the production selection completed by merged
[PR #1194](https://github.com/hynk-studio/augnes/pull/1194), and it does not
alter the strict Agent Identity isolated-auth result recorded separately by
Draft [PR #1196](https://github.com/hynk-studio/augnes/pull/1196).

```text
verdict = ORDINARY_RUNTIME_QUALIFIED
base SHA = 3347d5bdf67a79d6e15dba72a2fe2a6080b27d66
base tree = cecdcfc0a47b594a80c78c15b63ec71ff005f43e
branch = codex/1197-cdx3e-exact-ordinary-runtime
production selection = rust-v0.152.1, unchanged
initial effective PATH Codex = 0.151.0 standalone native binary through symlinks
qualified effective PATH Codex = 0.152.1 standalone native binary through symlinks
effective native SHA-256 =
  8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf
qualification source head = bd89bdb527acb6b07a426943cea1636db8be365f
provider/model invocations on qualification head = 1
approvals / tools / effects / repository writes = 0 / 0 / 0 / 0
app-server children after settlement = 0
```

The resolver first refused the actual 0.151.0 first-PATH runtime before spawn.
After separate explicit user authority, the official OpenAI standalone
installer updated its own installation to exact 0.152.1 without changing PATH
ordering or user auth. The first real 0.152.1 turn then exposed one transient
project-trust write caused by the adapter's unconditional workspace-write
projection, so that source head remained `HOLD / NOT_QUALIFIED`. A new
least-privilege source head projected a non-mutating request to read-only and
completed exactly one newly authorized turn without ever creating the trust
entry or another external effect.

## Re-resolved production identity

Current `origin/main`, the CDX3C record, and current checked-in constants were
re-read before implementation.

| Identity | Exact value | Result |
| --- | --- | --- |
| Production tag | `rust-v0.152.1` | unchanged |
| Selected source | `5adb68a49933ae446bf11935662c83dba55a0804` | unchanged |
| macOS arm64 native executable SHA-256 | `8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf` | unchanged |
| production semantic-profile SHA-256 | `795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529` | unchanged |
| expected runtime CLI | `0.152.1` | unchanged |

The source commit remains a checked-in selection fact. The release binary
does not independently disclose that commit; runtime admission proves the
selected executable bytes and reported CLI/user-agent version instead.

## Observed effective PATH chronology

Normal executable lookup chooses the first user-local `codex` entry. Local
filesystem inspection proved this bounded shape:

```text
first PATH codex, initial observation
  -> standalone current symlink
  -> standalone 0.151.0 macOS arm64 release directory
  -> regular executable native Mach-O arm64 binary
```

The selected candidate is not an npm launcher or arbitrary script. Local
`codex --version` reported `codex-cli 0.151.0`, and the canonical native bytes
hashed to
`98491713ffb196061003ee148636e743997cc31d76144ba7c53462269896891d`.
That does not equal the selected production fingerprint. Later PATH entries
were not substituted for the first candidate.

The separately installed official npm launcher was inspected only to establish
the bounded supported wrapper shape. Its launcher bytes match exact upstream
`rust-v0.152.1` `codex-cli/bin/codex.js` source with SHA-256
`134063e133f0b4244fa3b251acf973d4fe4b4aeeacbdc135211bf480f59f1477`.
It was not the effective PATH candidate and was not launched.

Immediately before the authorized environment update, the official OpenAI
latest stable release remained `rust-v0.152.1`. The official standalone
installer entry point updated only its installer-owned package and links:

```text
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Fresh normal PATH resolution after the update proved:

```text
first PATH codex
  -> installer-owned user-local symlink
  -> standalone/current
  -> 0.152.1-aarch64-apple-darwin
  -> canonical regular native macOS arm64 executable
```

The post-update CLI was `codex-cli 0.152.1`; the native SHA-256 was
`8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf`.
No PATH ordering, shell startup, npm installation, auth, config, history, or
memory state was intentionally changed by the environment update.

## Exact ordinary executable owner

The new production resolver performs these steps synchronously before an
ordinary app-server transport is created:

1. read PATH in order and bind the first executable `codex` candidate;
2. canonicalize and classify only direct native, symlink-to-native, or the
   exact official OpenAI Node launcher/package layout;
3. require a regular executable macOS arm64 native target;
4. require its SHA-256 to equal the selected production fingerprint;
5. require the native `--version` result to be exact `0.152.1`;
6. bind the checked-in tag, source, and semantic-profile selection facts;
7. recheck the PATH candidate, launcher when applicable, target file identity,
   canonical target, and native bytes after admission;
8. return the canonical absolute native target for launch.

The ordinary adapter rechecks that identity immediately before spawn and
launches the canonical absolute native executable with `app-server --stdio`.
It does not return to PATH after admission. The existing post-spawn
`initialize` user-agent check now requires the exact Augnes client contract and
Codex CLI `0.152.1` before `initialized` and `account/read` may continue.

The bounded public failure classes distinguish:

```text
codex_production_runtime_not_found
codex_production_runtime_identity_mismatch
codex_production_runtime_launch_shape_unsupported
codex_production_runtime_identity_changed
codex_production_runtime_protocol_drift
```

The official launcher support is not a generic script parser. It requires the
exact upstream launcher fingerprint, `@openai/codex` package name and selected
version, exact `bin/codex.js` declaration, a bounded macOS arm64 vendor layout,
and the selected native target fingerprint. Unknown wrappers and unverifiable
indirection fail closed.

`AUGNES_CANONICAL_TEST_MODE=1` remains the earlier deterministic branch and
continues to launch the repository-owned fake app server through the active
Node executable. It does not inspect or require an installed Codex binary.

## Least-privilege sandbox correction

Exact upstream `rust-v0.152.1` source at
`5adb68a49933ae446bf11935662c83dba55a0804` establishes the trust behavior.
During `thread/start`, a supplied cwd with undecided project trust is persisted
as trusted only when the effective permission profile can write that cwd. The
upstream suite includes
`thread_start_with_read_only_sandbox_does_not_persist_project_trust`, which
proves that the read-only path leaves `config.toml` without a project-trust
entry.

The old adapter projected every new ordinary thread, resumed thread, and turn
to workspace-write. The correction derives one immutable per-invocation
sandbox projection from the admitted `NativeHostRequest`:

```text
no exact admitted write-capable operation, or changed-file budget = 0
  -> thread sandbox read-only
  -> turn sandbox policy readOnly, network disabled

exact admitted project-scoped write operation
or exact repository-write operation plus repository-delegation binding
  -> thread sandbox workspace-write
  -> turn sandbox policy workspaceWrite for the exact canonical root only
```

Exact negative operation categories and packet capability denials dominate the
corresponding positive category. Packet grants cannot add an operation omitted
from the request. Prompt text, model intent, and runtime requests are absent
from the projection and cannot widen it. No branch can produce
danger-full-access. The strict Agent Identity owner retains its separate
existing private projection and was not modified.

## Runtime and semantic accounting

CDX3E preserves four distinct phases:

1. Head `b2f3536f9711573d7b1b11b4d43ff0e7f3847dea` correctly refused the
   first-PATH 0.151.0 runtime as `PATH_RUNTIME_MISMATCH` before spawn.
2. The user explicitly authorized the official standalone update; first-PATH
   then resolved to the exact selected 0.152.1 bytes.
3. The first real 0.152.1 ordinary turn completed and returned the expected
   token, but unconditional workspace-write caused one temporary-root trust
   entry. Cleanup restored the original config bytes, but an effect that was
   created and removed is not effect zero, so the verdict remained
   `HOLD / NOT_QUALIFIED` and no second turn ran on that head.
4. Head `bd89bdb527acb6b07a426943cea1636db8be365f` added the source-owned
   least-privilege projection. After all focused local checks passed, exactly
   one newly authorized ordinary turn used read-only and reached terminal
   completion without ever creating a trust entry.

| Surface | Actual result |
| --- | --- |
| Exact selected executable admitted | yes; first-PATH symlink to exact native 0.152.1 |
| Actual spawn target | admitted canonical absolute native executable |
| `initialize` / `initialized` | exercised once |
| `account/read` | exercised once; ordinary ChatGPT auth accepted |
| `thread/start` / `turn/start` | exercised once each |
| Non-mutating sandbox | thread `read-only`; turn `readOnly` with network disabled |
| Terminal turn | `completed` |
| Expected / observed public token | `AUGNES_CODEX_01521_RUNTIME_OK` / exact match |
| Provider/model invocations | 1 |
| Approval requests / grants | 0 / 0 |
| Tool / command / artifact counts | 0 / 0 / 0 |
| External effects | 0 |
| Live-proof repository executions / writes | 0 / 0 |
| Second invocation count | 0 |
| Proposal / `ReviewDecision` / `Transition` counts | 0 / 0 / 0 |
| Durable semantic memory/adoption | 0 |

The user's `config.toml` SHA-256 was
`33f28b1fe28291efa8c72fda032b961fdd231311dd2a857135039a0d435505d4`
before invocation, at thread binding, at turn start, at terminal observation,
and after settlement. The disposable root was absent at every checkpoint, so
no trust entry was created or removed. Auth content and file identity, history
content, and memory-directory metadata were unchanged. No raw credential or
model transcript was persisted as Augnes evidence.

## Separate strict Agent Identity lane

The strict isolated-auth implementation, credential broker, bootstrap owner,
and Draft PR #1196 record are unchanged:

```text
ordinary ChatGPT-auth Codex 0.152.1 runtime = QUALIFIED
strict Agent Identity isolated path = HOLD / NOT_QUALIFIED on upstream HTTP 403
```

The strict lane remains unavailable, but it is not a blocker for ordinary
Augnes-to-Codex production use. Neither result implies the other. This change
does not generate Agent Identity material or route ordinary auth through the
strict broker.

## Focused verification

Exact Node `v24.18.0` was used for repository checks.

- `npm run test:codex-production-runtime` passes direct native, symlink,
  stale/new version, wrong bytes, wrong-first PATH, unknown wrapper, exact
  official wrapper, identity drift, absent runtime, Canonical fake-route, and
  post-spawn user-agent cases, plus pure least-privilege sandbox cases.
- `npm run test:codex-sandbox-projection` passes a fake app-server round trip
  with `thread/start` read-only, `turn/start` readOnly, zero network, and exact
  child cleanup.
- `node --import tsx scripts/test-codex-isolated-auth-projection.ts --contracts`
  passes with zero real keychain, provider, and external-network activity.
- `node --import tsx scripts/test-codex-isolated-auth-projection.ts --rollback-lifecycle`
  passes with zero real keychain, provider, and external-network activity.
- `node --import tsx scripts/test-repository-managed-delegation.ts` passes the
  existing exact repository execution envelope, replay, cancellation, and
  semantic non-authority regressions.
- `node --import tsx scripts/smoke-vnext-operator-pilot-v0-1.ts` passes all 178
  positive and 132 negative cases, retains workspace-write for the admitted
  write-capable ordinary path, and records zero external-network calls.
- `npm run test:canonical-contract` passes with the focused resolver and
  sandbox-projection children uniquely registered.
- `npm run typecheck` passes.
- `git diff --check` passes.

The one real provider turn ran only after the correction head existed and all
focused checks passed. It was not a retry on the earlier source head.

## RW1B and cleanup

Issue #1130 and its current comment were read without mutation. No authentic
RW1B observation occurred after the merged #1194 boundary. This rollout is not
an episode and consumes or changes no slot, schedule, assignment, metric, or
historical evidence.

```text
owned app-server children after settlement = 0
listener residue = 0
live-proof temporary roots = 0
credential state affected = no
config trust residue = 0; no entry was created in the qualified run
Companion state affected = no
PR #1191 / PR #1192 / PR #1196 affected = no
production version changed = no
```

Ordinary Codex 0.152.1 runtime is practically closed for the current production
contract. The strict Agent Identity HTTP 403 and future-version flexibility are
separate follow-up concerns. This record grants no PATH reordering,
later-entry substitution, automatic upgrade, provider retry, Ready, merge, or
release authority.
