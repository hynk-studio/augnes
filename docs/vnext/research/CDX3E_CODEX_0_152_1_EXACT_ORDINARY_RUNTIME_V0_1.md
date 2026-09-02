# CDX3E Codex 0.152.1 exact ordinary runtime v0.1

## Scope and verdict

This record covers the ordinary ChatGPT-auth LiveNativeHost runtime boundary
authorized by [Issue #1197](https://github.com/hynk-studio/augnes/issues/1197).
It does not reopen the production selection completed by merged
[PR #1194](https://github.com/hynk-studio/augnes/pull/1194), and it does not
alter the strict Agent Identity isolated-auth result recorded separately by
Draft [PR #1196](https://github.com/hynk-studio/augnes/pull/1196).

```text
verdict = PATH_RUNTIME_MISMATCH
base SHA = 3347d5bdf67a79d6e15dba72a2fe2a6080b27d66
base tree = cecdcfc0a47b594a80c78c15b63ec71ff005f43e
branch = codex/1197-cdx3e-exact-ordinary-runtime
production selection = rust-v0.152.1, unchanged
effective PATH Codex = 0.151.0 standalone native binary through symlinks
effective native SHA-256 =
  98491713ffb196061003ee148636e743997cc31d76144ba7c53462269896891d
app-server children = 0
provider/model invocations = 0
```

The current PATH installation is not changed, skipped, or replaced. The new
production boundary refuses it before app-server spawn. Therefore the one
authorized real synthetic provider turn is not attempted.

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

## Observed effective PATH shape

Normal executable lookup chooses the first user-local `codex` entry. Local
filesystem inspection proved this bounded shape:

```text
first PATH codex
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

## Runtime and semantic accounting

The real host was rechecked through the new default production resolver. It
returned `codex_production_runtime_identity_mismatch` before a transport or
child was created. The exact authorized live-proof sequence therefore stopped
before all app-server and provider methods.

| Surface | Actual result |
| --- | --- |
| Exact selected executable admitted | no |
| Actual spawn target | none; stopped before spawn |
| `initialize` / `initialized` | not exercised live |
| `account/read` | not exercised live |
| `thread/start` / `turn/start` | not exercised live |
| Terminal turn | none |
| Provider/model invocations | 0 |
| Approval / tool / effect counts | 0 / 0 / 0 |
| Live-proof repository mutations | 0 |
| Second invocation count | 0 |
| Proposal / `ReviewDecision` / `Transition` counts | 0 / 0 / 0 |
| Durable semantic memory/adoption | 0 |

No raw model transcript exists. No ordinary credential content was read,
copied, printed, or persisted by the resolver. The ordinary path would retain
the current `account/read` ChatGPT-auth behavior only after exact executable
and protocol admission.

## Separate strict Agent Identity lane

The strict isolated-auth implementation, credential broker, bootstrap owner,
and Draft PR #1196 record are unchanged:

```text
ordinary ChatGPT-auth path = fail-closed PATH_RUNTIME_MISMATCH on this host
strict Agent Identity isolated path = HOLD / NOT_QUALIFIED on upstream HTTP 403
```

Neither result implies the other. This change does not generate Agent Identity
material or route ordinary auth through the strict broker.

## Focused verification

Exact Node `v24.18.0` was used for repository checks.

- `npm run test:codex-production-runtime` passes direct native, symlink,
  stale/new version, wrong bytes, wrong-first PATH, unknown wrapper, exact
  official wrapper, identity drift, absent runtime, Canonical fake-route, and
  post-spawn user-agent cases.
- `node --import tsx scripts/test-codex-isolated-auth-projection.ts --contracts`
  passes with zero real keychain, provider, and external-network activity.
- `node --import tsx scripts/smoke-vnext-operator-pilot-v0-1.ts` passes all 178
  positive and 132 negative cases with zero external-network calls.
- `npm run test:canonical-contract` passes with the new focused resolver child
  uniquely registered.
- `npm run typecheck` passes.
- `git diff --check` passes.

The real provider turn and authenticated runtime methods are skipped because
the first PATH candidate failed exact executable admission. Running the turn
would violate Issue #1197's required `PATH_RUNTIME_MISMATCH` stop.

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
Companion state affected = no
PR #1191 / PR #1192 / PR #1196 affected = no
production version changed = no
```

The remaining practical runtime blocker is the host's first PATH Codex native
identity: installed `0.151.0` bytes do not match selected `0.152.1`. This record
grants no installation mutation, PATH reordering, later-entry substitution, or
provider retry.
