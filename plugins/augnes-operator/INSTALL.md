# Augnes Operator Plugin Install Guide

This guide explains how to review and install the repo-local `augnes-operator`
plugin scaffold for Codex. The plugin packages Augnes operating instructions,
skills, and optional hook guardrails. It does not grant Codex runtime authority,
state commit/reject authority, merge authority, provider authority, or GitHub
mutation authority.

## Local Scaffold

- Plugin root: `plugins/augnes-operator`
- Plugin manifest: `plugins/augnes-operator/.codex-plugin/plugin.json`
- Local marketplace entry: `.agents/plugins/marketplace.json`
- Skills directory: `plugins/augnes-operator/skills/`
- Optional hooks directory: `plugins/augnes-operator/hooks/`

The marketplace entry points at this repo-local plugin path. Review the manifest
and skill files before enabling the plugin in a local Codex installation.

## Install Modes

### Repo-native use

Codex can work from the repository without installing the plugin by reading
`AGENTS.md`, `README.md`, and the relevant npm scripts. This is the safest
default for ordinary PR work.

### Local plugin use

Install the plugin through the local Codex plugin flow or local marketplace
mechanism supported by your Codex build. Use the repo-local path:

```text
plugins/augnes-operator
```

Do not add secrets to plugin files. Do not add MCP server config or app mappings
inside this plugin unless a future PR explicitly scopes that work.

### Optional hook use

The hook scaffold under `plugins/augnes-operator/hooks/` is a guardrail layer,
not an authority layer. Review `docs/CODEX_AUGNES_OPERATOR_HOOKS_V0_1.md` before
enabling hooks in a local Codex installation.

Hooks can remind Codex about Augnes boundaries, but they do not approve work,
merge pull requests, write Augnes state, create proof/evidence records, call
providers, or call GitHub.

## Verification

Run these checks after editing the plugin scaffold, skills, or hooks:

```bash
npm run smoke:augnes-operator-plugin-scaffold
npm run smoke:augnes-operator-plugin-hooks
```

The scaffold smoke verifies that the plugin remains local, contains no MCP
server config, contains no app mappings, preserves proof/evidence boundaries,
and avoids active external call configuration.

## Boundary

This install guide is documentation only. It does not write user-level Codex
configuration, read secrets, install packages, start a bridge, call providers,
call GitHub, mutate the Augnes DB, create proof/evidence rows, approve or reject
Augnes state, merge, publish, retry, replay, enable auto-merge, or launch hidden
background work.
