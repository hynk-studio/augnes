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

The plugin install is the one explicit setup step. No fixed bridge URL or copied
user-level MCP config is required. The plugin manifest points to `.mcp.json`,
which starts `mcp/companion-proxy.mjs` as a per-session stdio server. Current
Codex plugin/MCP support recognizes the reviewed `mcpServers` manifest pointer
and the standard `command`, `args`, and `cwd` server fields used here.

## What the proxy does

The proxy scans only application-owned Augnes runtime-manifest locations (or a
single explicit test manifest), then verifies:

- regular bounded manifest and ownership files;
- supervisor and child process liveness;
- runtime contract, generation, instance, and repository/application identity;
- private UI and bridge ownership health;
- public UI health outside recovery mode;
- bridge `mode=http` and `live_core_status=ready`.

Exactly one verified live Companion is required. Zero or multiple candidates,
stale/foreign identity, recovery mode, mock mode, or a changed port/owner fails
closed. The proxy then forwards only `augnes_resume_repository` to the current
bridge port. The supported supervisor `AUGNES_RUNTIME_STATE_DIR` override is
forwarded as a path hint and receives the same verification. The proxy is not a
daemon, supervisor, database owner, or fallback data source.

## Supported and unsupported surfaces

Supported: local Codex, local filesystem checkout, installed Augnes Operator,
and the existing local supervised Companion.

Not claimed: automatic plugin installation, remote Codex filesystem access,
ChatGPT/mobile repository attachment, remote nodes, managed delegation, Start,
or broad Windows packaging. A Codex build without plugin `mcpServers` support
must be upgraded or use an explicitly configured direct test connection; the
product docs do not pretend that limitation is solved.

## Security and authority

Do not add secrets to plugin files. Runtime ownership material is used only for
local verification and is never returned by the tool. Results exclude database
paths, ownership tokens, credentials, cookies, provider configuration, private
controller material, and unrelated projects.

The tool is read-only. It cannot register or rename a project, change Browser
selection, define/revise work, create/start/control a run, approve, write
proof/evidence, call providers or GitHub, merge, release, or deploy.

## Verification

```bash
npm run test:codex-companion-discovery
npm run test:codex-repository-continuity
npm run test:operability:supervisor
npm --prefix apps/augnes_apps run typecheck
```
