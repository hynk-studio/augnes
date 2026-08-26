# Codex MCP / Augnes Companion usage v0.1

## Repository execution attachment tools

The supervised Companion keeps `augnes_resume_repository` as the
selection-coupled, read-only CDX2B1 continuity tool and adds a separate
selection-independent CDX2B2A family:

- `augnes_prepare_repository_execution` prepares or returns one exact
  project-scoped attachment;
- `augnes_validate_repository_execution_attachment` rechecks current root,
  work, managed-run, freshness, and bounded worktree state;
- `augnes_adopt_repository_execution_root` is the explicit legacy baseline
  decision;
- `augnes_preview_repository_execution_root_rebind` performs the bounded
  new-root observation and creates the expected-state decision request without
  changing the project root;
- `augnes_rebind_repository_execution_root` is the explicit moved-root
  decision;
- `augnes_preview_repository_execution_attachment_revocation` creates the
  exact revocation decision request without revoking;
- `augnes_revoke_repository_execution_attachment` explicitly revokes one
  prepared attachment.

Normal preparation requires no confirmation and ordinary text contains no
filesystem identifiers. Adoption, rebind, and revocation first create an
expiring expected-state decision request. The user confirms it once in the
same-origin Augnes Browser project-settings surface; only the resulting exact
grant can complete the mutation. MCP literals, destructive annotations,
assistant prose, and tool prose are not approval. These local metadata tools do
not create or consume a managed run,
Start Codex/NativeHost, run project commands, write project files, call a
provider or GitHub, or create external effects.

CDX2B3A adds a platform-discriminated Windows identity owner beneath these
same tools; it does not add another MCP surface. Windows 10 Pro 22H2 build
19045 or newer and Windows 11 build 22000 or newer on x64 local fixed NTFS are
the intended Windows targets. Windows versions below build 19045, ARM64,
ReFS/Dev Drive, FAT/exFAT, UNC/network, WSL, removable, virtual/projected, and
unclassified reparse roots fail closed, and there is no path-only fallback.
The source-runtime path has exact Windows 10 Pro 22H2 build 19045.6456 proof at
checkpoint `374a582b766a10616667633eb911d3df2d49b85e` and exact Windows 11 Home
25H2 build 26200.8875 proof at pre-integration checkpoint
`567c9bbbad5d35e6803ad740adfac1b881983912`, both x64 local fixed NTFS. A later
integrated head is not Windows 10 exact-head verified without a fresh run
there. Packaged Windows remains unsupported. The package builder's
`package_build_runtime_unsupported` result preserves fail-closed packaged
admission. No simulated or another-platform run can provide deciding Windows
filesystem or source-runtime evidence. Ordinary source-runtime Windows
attachment preparation is available only on the verified supported lane;
packaged Windows preparation remains unavailable. No MCP result exposes the
native component path, volume serial, file ID, or canonical private path.

## Current local product path

The supported CDX2B1 path is:

```text
fresh local Codex
→ installed augnes-operator plugin
→ plugin stdio discovery proxy
→ bounded checkout service lifecycle status
→ optional one start of the already-installed exact service
→ verified supervised Augnes bridge identity
→ strict supervised UI/Core repository route
→ canonical Augnes database
→ exact repository-scoped continuity
```

Start the sole Companion lifecycle owner from the Augnes checkout:

```bash
npm install
npm --prefix apps/augnes_apps install
npm run augnes:service:install
```

The user LaunchAgent is an explicit, checkout-bound macOS installation. It
pins one Node 24 binary and survives terminal/Codex exit, login, and unexpected
supervisor failure. It grants no repository execution, managed Resume,
provider, semantic, publication, or merge authority. Explicit stop/uninstall
remain available. Stop persists across a later login or LaunchAgent reload;
only explicit Start or Install returns that exact service to running. One
production Companion service is allowed per local user session, and a
different checkout refuses without mutating the existing service. Linux and
Windows service installation are unsupported.

The supervisor owns database preparation, UI, bridge, runtime generation and
instance identity, dynamic port selection, package compatibility, recovery,
reconciliation, and cleanup. Do not start a second UI, bridge, database owner,
or supervisor for normal Codex use.

Install the reviewed repo-local plugin once from the repository root:

```bash
npm run augnes:plugin:install
```

The plugin's reviewed `.mcp.json` starts a
per-Codex-session stdio proxy. That proxy is not a daemon and owns no Augnes
state. Even with no live Companion it exposes bounded lifecycle status and an
already-installed exact service start. It never installs or rewrites service
configuration. After live verification it locates supervisor manifests in the application-owned runtime area,
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

Users do not need to memorize tool names. The Augnes Operator maps fresh
continuation to `augnes_companion_lifecycle_status`, at most one
`augnes_start_companion_service`, and then at most one read-only
`augnes_resume_repository` call:

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

The CDX2B1 continuity contract still resolves the canonical normalized root and
does not add a physical-identity outcome. CDX2B2A's separate execution owner
uses its versioned node-local baseline to refuse same-path replacement; this
does not redefine the read-only CDX2B1 response.

Repository resolution remains attached to project A when Browser selects B,
but the nested unchanged CDX2A projection intentionally retains active-project
semantics: project status becomes inactive, selection revision and snapshot
binding change, fresh work remains fresh, Start eligibility becomes false, and
the next action asks to make A active. The separate CDX2B2A admission and
attachment are selection-independent; the nested CDX2A continuity contract
deliberately remains selection-coupled.

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
filesystem access, current-session continuous control, remote nodes, and
broader cross-platform package support remain later work. CDX2B2B managed
delegation and CDX2B4B Resume also run through the verified Windows 11 x64
source-runtime lane added by CDX2B3B. The existing Apps MCP, Operator,
Companion, strict route, attachment, envelope, run, checkpoint, provider,
cancellation, and result owners are unchanged. Windows 10 and packaged Windows
Start/Resume remain unavailable, and Resume is never automatic.

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
client. Its disposable positive path registers repository A through canonical
onboarding, defines initial work through the production owner, observes an
exact binding, revises that work through the production owner, observes a new
binding, then selects disposable repository B and proves repository A remains
the target with the documented inactive/Start-ineligible projection. Each MCP
read leaves the canonical database and project files unchanged, and no Browser
process is required. These tests are not described as a model-mediated Codex
conversation; the locally verified Codex CLI `0.143.0` has no provider-free
direct `tools/call` command.
