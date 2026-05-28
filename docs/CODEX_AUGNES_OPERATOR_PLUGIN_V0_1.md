# Codex Augnes Operator Plugin v0.1

## Purpose

The local `augnes-operator` Codex plugin scaffold packages the approved Augnes
workflow skills into one repo-scoped plugin. It makes the Codex harness easier
to install and inspect without adding runtime authority.

This scaffold is local metadata and Markdown skill packaging only. It does not
call the Augnes runtime, GitHub, OpenAI, or network resources.

## Files Added

- `plugins/augnes-operator/.codex-plugin/plugin.json`
- `plugins/augnes-operator/skills/augnes-read-brief/SKILL.md`
- `plugins/augnes-operator/skills/augnes-implementation-slice/SKILL.md`
- `plugins/augnes-operator/skills/augnes-record-evidence/SKILL.md`
- `plugins/augnes-operator/skills/augnes-closeout-proof/SKILL.md`
- `plugins/augnes-operator/skills/augnes-authority-audit/SKILL.md`
- `.agents/plugins/marketplace.json`
- `scripts/smoke-augnes-operator-plugin-scaffold.mjs`

## Relationship To AGENTS.md

`AGENTS.md` remains the root Codex operating contract for this repository. The
plugin does not replace that file and does not override its authority rules. It
packages the same workflow expectations into reusable skills:

- read repo instructions and task-relevant docs before editing
- keep implementation bounded
- record concrete skipped reasons
- prefer proof-only closeout when runtime and work ID are available
- never commit/reject Augnes state
- never merge PRs, enable auto-merge, or claim merge authority

## Relationship To Repo-Local Skills

The plugin skills are copied or lightly adapted from `.agents/skills/`:

- `augnes-read-brief`
- `augnes-implementation-slice`
- `augnes-record-evidence`
- `augnes-closeout-proof`
- `augnes-authority-audit`

The plugin copies preserve the same skill names, purpose, procedures, skipped
reason handling, proof-only closeout preference, and forbidden actions. Any
future behavioral change to these skills should keep the repo-local and plugin
copies aligned.

## Relationship To Closeout Preflight

`docs/CODEX_CLOSEOUT_PREFLIGHT_V0_1.md` documents the deterministic local
closeout preflight helper from PR 3. This plugin does not replace or execute
that helper. It packages the skills that tell Codex when to prepare evidence,
proof-only closeout, and authority-audit material that the helper can inspect.

The helper output is review aid only. Proof is not approval. A PR is not merge
authority.

## Canonical Roadmap Placement

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` defines this as PR 4: local
`augnes-operator` Codex plugin scaffold. The slice packages approved skills and
local metadata only.

PR 5 may add plugin hooks later. PR 6 may document Codex MCP / Augnes bridge
usage later. Those are intentionally not included here.

## Intentionally Not Included

This scaffold does not include:

- hooks
- MCP config
- app mappings
- runtime routes
- database or schema changes
- package dependencies
- secret handling
- browser/computer-use runbooks
- dogfood episode helpers
- ChatGPT App UI/operator cards

## Authority Boundaries

The plugin scaffold is non-authoritative. It does not:

- execute Codex from ChatGPT
- commit or reject Augnes state
- approve, publish, retry, replay, or externally post
- merge PRs, enable auto-merge, or claim merge authority
- record evidence
- record proof
- call the Augnes runtime
- call GitHub
- call OpenAI
- mutate committed state
- store secrets or token placeholders

Durable approval remains user/Core gated. External publication remains
explicit, preview-first, and Core-gated.

## Non-Goals

- autonomous Codex execution
- ChatGPT direct Codex execution
- Codex Augnes commit/reject authority
- Codex approval, publication, retry, replay, merge, or external-posting
  authority
- runtime enforcement
- hook implementation
- MCP/App tool schema changes
- replacing Augnes Core gates with plugin metadata

## Forbidden Changes

This PR 4 slice forbids:

- runtime behavior changes
- database/schema changes
- API route changes
- MCP/App tool schema changes
- hook implementation
- MCP config
- ChatGPT App UI/operator card implementation
- browser/computer-use runbook implementation
- dogfood episode helper implementation
- secret handling changes
- OpenAI, GitHub, Augnes runtime, or network calls
- evidence recording
- proof recording
- committed-state mutation
- package dependency changes

## Future PRs

PR 5 may add `SessionStart`, `PreToolUse`, `PostToolUse`, and `Stop` hooks after
the scaffold exists. Those hooks must be local, deterministic, and
non-authoritative.

PR 6 may document safe local MCP / Augnes bridge usage for Codex and ChatGPT
Developer Mode. It must not commit secrets or expand authority.
