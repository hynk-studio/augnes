# Augnes Operator plugin install

## One ordinary local setup path

1. From this repository root, register the repo-local marketplace and install
   the reviewed plugin once:

   ```bash
   codex plugin marketplace add .
   codex plugin add augnes-operator@augnes-local
   ```

2. Start the existing supervised Augnes Companion from the Augnes checkout:

   ```bash
   npm install
   npm --prefix apps/augnes_apps install
   npm run augnes
   ```

3. From Codex in a registered local repository, ask:

   ```text
   Resume this repository with Augnes.
   ```

These commands match the locally verified Codex CLI `0.143.0` plugin surface;
that build uses `plugin add`, not a nonexistent `plugin install` command. The
plugin install is the one explicit setup step. No fixed bridge URL or copied
user-level MCP config is required. The plugin manifest points to `.mcp.json`,
which starts `mcp/companion-proxy.mjs` as a per-session stdio server. Current
Codex plugin/MCP support recognizes the reviewed `mcpServers` manifest pointer
and the standard `command`, `args`, and `cwd` server fields used here.

## What the proxy does

The proxy scans only application-owned Augnes runtime-manifest locations (or a
single explicit test manifest), then verifies:

- a regular bounded manifest and its separate generation-bound
  `companion-access.json` channel record;
- supervisor and child process liveness;
- runtime contract, generation, instance, and repository/application identity;
- public UI health outside recovery mode;
- bridge `mode=http` and `live_core_status=ready`.

Exactly one verified live Companion is required. Zero or multiple candidates,
stale/foreign identity, recovery mode, mock mode, or a changed port/owner fails
closed. For `augnes_resume_repository`, the proxy calls the strict UI/Core
repository-continuity route directly, validates its runtime identity headers
and exact response contract, and formats the MCP tool result. It does not act
as a partial HTTP MCP client. The supported supervisor
`AUGNES_RUNTIME_STATE_DIR` override is
forwarded as a path hint and receives the same verification. The proxy is not a
daemon, supervisor, database owner, or fallback data source.

The same verified Companion exposes the CDX2B2A tools
`augnes_prepare_repository_execution`,
`augnes_validate_repository_execution_attachment`,
`augnes_adopt_repository_execution_root`,
`augnes_preview_repository_execution_root_rebind`,
`augnes_rebind_repository_execution_root`, and
`augnes_preview_repository_execution_attachment_revocation`,
`augnes_revoke_repository_execution_attachment`. They persist only node-local
trust and attachment metadata. They never Start a host, create or consume a
managed run, run repository commands as product behavior, or write project
files. Legacy adoption, root rebind, and revocation require exact expected
state and a one-time grant produced by an explicit same-origin Augnes Browser
confirmation. The Browser uses a bootstrap-derived HttpOnly decision session
and an exact request-bound one-time nonce; the MCP proxy, runtime manifest, and
Companion access record do not expose either capability. Forged Browser-shaped
headers, a model-supplied literal, or a tool annotation cannot issue a grant.

CDX2B2B adds `augnes_request_repository_delegation`,
`augnes_start_repository_delegation`, and
`augnes_cancel_repository_delegation`. Request creates one exact start decision
but no run. The user confirms it in the same Browser-only decision session.
Start atomically consumes that grant and one prepared attachment into one
managed run, then rechecks physical root, worktree, database state, adapter,
capability, and execution envelope before the first worker invocation. Exact
replay returns the same run and launches nothing twice. Cancellation is bound
to the exact attachment/run and creates no semantic decision. Use
`augnes_resume_repository` for current status, result, receipt, and review
continuity.

The start decision permits bounded reversible local work inside the exact
repository root. It does not grant arbitrary command network access,
dependency downloads, push/GitHub, injected Browser/Companion/provider/
database/runtime/OS credentials, outside-root secret material,
release/deployment, publication, or semantic result acceptance. Files already
inside the repository remain in repository read scope; no content-based secret
unreadability is claimed. A later NativeHost operation
approval is separate from Start; ReviewDecision and Transition are separate
from both.

Cancellation uses the immutable consumed attachment/run binding rather than
current execution eligibility. It can still signal the exact owned controller
after packet, work, root, baseline, worktree, or Browser-selection drift. If
the controller is absent it reports disconnected reconciliation and does not
start or resume anything. Exact Start replay reports the run's actual state;
`worker_started` is true only when that specific request started the worker.

## Supported and unsupported surfaces

Supported: local Codex, local filesystem checkout, installed Augnes Operator,
and the existing local supervised Companion.

Not claimed: automatic plugin installation, remote Codex filesystem access,
ChatGPT/mobile repository attachment, remote nodes, current-session workers,
automatic resume after controller loss, continuous/multi-agent automation,
Linux product filesystem/runtime proof, Windows managed delegation, Windows 11
verification, or Windows packaging. PR #117 is
filesystem-verified on macOS; Linux has adapter contract coverage only.
CDX2B3A source-runtime attachment admission is verified on Windows 10 Pro 22H2
build 19045.6456 x64 local fixed NTFS. Windows 11 is supported by the version
gate but remains unverified. The current package builder refuses Windows, so
packaged Windows preparation remains fail-closed. CDX2B2B Start remains
explicitly macOS-only. A Codex
build without plugin `mcpServers` support
must be upgraded or use an explicitly configured direct test connection; the
product docs do not pretend that limitation is solved.

CDX2B2A's node-local baseline detects same-path directory replacement, and its
separate admission/attachment remain bound to repository A when Browser selects
B. The unchanged CDX2A projection still reports A inactive and closes its own
Start eligibility. The Windows candidate never turns a path-only or mocked
observation into readiness and does not expose volume serials or file IDs.
Windows managed Start remains a separate CDX2B3B phase.

## Security and authority

Do not add secrets to plugin files. The narrow proxy credential is generated by
the existing supervisor, is not a supervisor control or child-ownership token,
and is never returned by the tool. Results exclude database
paths, ownership tokens, credentials, cookies, provider configuration, private
controller material, and unrelated projects.

Continuity is read-only. Attachment preparation writes only canonical local
metadata. An explicitly Browser-confirmed CDX2B2B Start may create/control one
exact managed run and its envelope-bounded local repository effects. It cannot
change Browser selection, call GitHub, push, merge, release, deploy, publish,
create semantic approval/Decision/Transition, accept state, or close work.

## Verification

```bash
npm run test:codex-companion-discovery
npm run test:codex-repository-continuity
npm run test:windows-physical-root-identity
npm run test:repository-managed-delegation
npm run test:operability:supervisor
npm --prefix apps/augnes_apps run typecheck
```

`test:windows-physical-root-identity` is platform-neutral parser, native-source,
failure, migration, and privacy coverage; it explicitly is not deciding
Windows filesystem evidence. `test:codex-companion-discovery` is a synthetic
discovery/contract harness.
`test:operability:supervisor` is the real source-runtime test: it starts the
actual supervised UI/Core and bridge, invokes the actual stdio proxy with the
official MCP stdio client, registers disposable repositories through canonical
onboarding, defines and revises work through the production work owners, and
uses the real Browser session/challenge/grant routes. It proves the revised
binding refreshes, consumes one exact attachment, starts one managed
deterministic worker while Browser selects B, performs one bounded fixture edit
and check in A, records the RunReceipt and pending-review proposal, returns the
same run on exact replay, and cleans every owned process and port. Provider and
proxy request counts remain zero. Neither test is described as a genuine
model-mediated Codex conversation. The current
Codex CLI has no provider-free direct `tools/call` command, so automating that
final conversation would require a separately configured model/provider
invocation.
