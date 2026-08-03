# Codex MCP / Augnes Companion usage v0.1

## Current local product path

The supported CDX2B1 path is:

```text
fresh local Codex
→ installed augnes-operator plugin
→ plugin stdio discovery proxy
→ verified existing supervised Augnes bridge identity
→ strict supervised UI/Core repository route
→ canonical Augnes database
→ exact repository-scoped continuity
```

Start the sole Companion lifecycle owner from the Augnes checkout:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes
```

The supervisor owns database preparation, UI, bridge, runtime generation and
instance identity, dynamic port selection, package compatibility, recovery,
reconciliation, and cleanup. Do not start a second UI, bridge, database owner,
or supervisor for normal Codex use.

Install the reviewed repo-local plugin once from the repository root:

```bash
codex plugin marketplace add .
codex plugin add augnes-operator@augnes-local
```

The plugin's reviewed `.mcp.json` starts a
per-Codex-session stdio proxy. That proxy is not a daemon and owns no Augnes
state. It locates supervisor manifests in the application-owned runtime area,
verifies the adjacent generation-bound Companion access record plus UI and
bridge identity, then calls the strict UI/Core route directly instead of
partially forwarding MCP JSON. The plugin forwards the supervisor's existing
`AUGNES_RUNTIME_STATE_DIR` path hint when configured; the pointed manifest
still receives the same liveness and identity checks.

The supervisor may move the bridge away from port `8787` after a collision.
Therefore `http://localhost:8787/mcp` is not the ordinary product setup. A
direct URL remains useful only for an explicitly managed test/demo profile
whose exact port is already known.

## Repository resume tool

Users do not need to memorize the tool name. The Augnes Operator discovery
layer maps requests such as these to `augnes_resume_repository`:

- Resume this repository with Augnes.
- What was I working on here?
- Continue from the current Augnes context.
- Show the current Augnes project state.

The tool accepts only `repositoryRoot`. A successful result contains:

- verified live Companion status and an opaque runtime binding;
- repository resolution status;
- the unchanged nested `codex_current_continuity.v0.1` projection;
- ordinary-language current situation;
- one next meaningful action;
- a Browser project deep link when the supervised UI can truthfully provide
  one.

Resolution compares the supplied physical local root with existing canonical
project/root registrations. It does not use display name, branch, GitHub URL,
caller project ID, docs, or Browser selection. It never registers, renames,
rebinds, selects, defines, revises, starts, or writes anything.

The current canonical root binding stores the normalized local path but no
registration-time device/inode/realpath baseline. Therefore CDX2B1 does not
claim to detect a different directory later created at the exact same path;
`root_identity_changed` is not a public outcome. Adding a versioned durable
physical-root baseline, including migration/backup/restore/portability rules,
is a prerequisite before CDX2B2 may claim same-path replacement refusal.

Repository resolution remains attached to project A when Browser selects B,
but the nested unchanged CDX2A projection intentionally retains active-project
semantics: project status becomes inactive, selection revision and snapshot
binding change, fresh work remains fresh, Start eligibility becomes false, and
the next action asks to make A active. Fully selection-independent eligibility
is therefore also an explicit CDX2B2 prerequisite.

## Live and fail-closed requirements

The supervised bridge runs in `AUGNES_CORE_MODE=http` and binds to the exact UI
URL selected by the same supervisor. UI, bridge, manifest, and the narrow
Companion access record must agree on runtime instance, runtime generation, and
repository/application fingerprint. Bridge readiness additionally proves
`live_core_status=ready`.

Recovery mode has no healthy repository continuity surface. Missing, stale,
foreign, ambiguous, mock, identity-mismatched, or ownership-unverified runtime
state returns `companion_unavailable`; it is never converted into apparently
healthy continuity.

No successful response may use example JSON, fixture, mock adapter, seed,
repository-source reconstruction, GuideBrief, Work Brief, docs, or a second
database. Browser need not be open for the happy path because Core owns the
projection.

The `companion_repository_readonly` bridge endpoint has no wildcard CORS,
accepts only its exact `127.0.0.1:<supervised-port>` Host, rejects Origin,
browser fetch metadata and forwarding headers, and requires the narrow
generation-bound proxy credential. Explicit historical public/demo profiles
retain their deliberately configured public CORS behavior.

## Authority and limits

CDX2B1 is read-only because Start and mutation are outside this slice. Every
authority flag remains false. It grants no project mutation, Start, execution,
approval, proof/evidence write, proposal, Decision, Transition, provider,
GitHub, merge, release, deployment, retry, replay, scheduler, or background
authority.

This is local Codex against a local checkout. Remote Codex, ChatGPT/mobile
filesystem access, current-session continuous control, managed delegation,
remote nodes, and broader cross-platform package support remain later work.

## Verification

Focused owners are:

```bash
npm run test:codex-current-continuity
npm run test:codex-repository-continuity
npm run test:codex-companion-discovery
npm run test:operability:supervisor
npm run test:operability:package
npm --prefix apps/augnes_apps run typecheck
```

The supervisor and package tests prove matching live UI/bridge identity,
dynamic port fallback, no mock contribution, read-only database behavior, and
complete owned-process cleanup.

`test:codex-companion-discovery` is a synthetic discovery and contract harness.
The supervisor owner is the actual source-runtime end-to-end path: it starts
the real UI/Core and bridge and calls the stdio proxy through the official MCP
client. These tests are not described as a model-mediated Codex conversation;
the locally verified Codex CLI `0.143.0` has no provider-free direct
`tools/call` command.
