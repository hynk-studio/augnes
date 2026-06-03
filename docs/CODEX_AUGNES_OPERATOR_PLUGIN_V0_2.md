# Codex Augnes Operator Plugin v0.2

## Purpose

This document aligns the local `augnes-operator` Codex plugin scaffold to v0.2.
The alignment is docs/metadata/skill/smoke/package-pointer only.

The v0.2 direction treats ChatGPT Apps and Codex Plugins as adjacent OpenAI
extension surfaces, not a single confirmed product surface. The shared-substrate
framing is strategic positioning for Augnes planning and review; it is not repo
authority, not an Active-set expansion, and not implementation approval.

## External References

These links are external OpenAI references for orientation only. They are not
Augnes repo authority and do not override `AGENTS.md`, `AUTHORITY_MATRIX.md`,
or Augnes Core gates.

- Apps SDK: <https://developers.openai.com/apps-sdk>
- Codex Plugins: <https://developers.openai.com/codex/plugins>
- Codex Skills: <https://developers.openai.com/codex/skills>
- Codex Remote Connections: <https://developers.openai.com/codex/remote-connections>
- Codex Sites: <https://developers.openai.com/codex/sites>
- Codex Prompting: <https://developers.openai.com/codex/prompting>

## What Changed

- `plugins/augnes-operator/.codex-plugin/plugin.json` now reflects v0.2
  alignment in local scaffold metadata.
- `plugins/augnes-operator/skills/augnes-codex-surface-ops/SKILL.md` adds an
  instruction-only surface-ops skill.
- `scripts/smoke-augnes-operator-plugin-v2.mjs` adds a static boundary smoke.
- `package.json` exposes `npm run smoke:augnes-operator-plugin-v2`.
- `docs/00_INDEX_LATEST.md` points to this v0.2 alignment document.

This PR does not change `AGENTS.md`.

## Why Both Surfaces Matter

Augnes should expose both adjacent surfaces because they serve different users
and review loops:

- ChatGPT App / MCP user-facing review and Project Constellation surface:
  supports human-facing review, perspective formation, handoff preview, and
  bounded operator interaction.
- Codex Plugin / Skills repo-facing workflow guidance surface: supports local
  repository work, PR scoping, verification, skipped-reason discipline,
  authority audit, and closeout reporting.

The common exchange unit should be the Perspective Capsule / Handoff Capsule.
That capsule can carry perspective frame, evidence pointers, tensions, boundary
notes, validation results, skipped reasons, and next-move candidates across
surfaces without granting execution, write, proof, publication, or merge
authority.

## v0.2 Surface-Ops Skill

The `augnes-codex-surface-ops` skill is instruction-only guidance for:

- Queue
- Steer
- `/side`
- Remote/SSH
- Sites
- diff/review
- mobile/lock/security
- skipped reason policy
- final report requirements

Queue is after-completion follow-up, verification, closeout, or next-task
handling. Steer is bounded correction inside the current scoped task. `/side`
is investigation, scope review, error diagnosis, explanation, or status recap,
not main task mutation.

Remote/SSH work must preserve execution host provenance, approval context,
skipped reason, and verification path. Mobile or remote control inherits the
connected host files, tools, credentials, permissions, plugins, browser setup,
and Computer Use configuration, so reports must keep host provenance visible.

Sites saved versions may be demo or review artifact pointers. Sites deployment
URLs are production deployment and are not Augnes readiness, proof,
publication, approval, or merge authority. This PR does not implement Sites
deployment behavior.

## PR-Centered Workflow

The preserved workflow is:

1. Codex codes, verifies, reports, and opens PRs.
2. ChatGPT reviews PRs and review feedback.
3. The user decides whether and when to merge.

Codex may prepare bounded implementation work, static docs, smoke guards,
verification summaries, and PR body language. Codex does not commit/reject
Augnes state, record proof/evidence in this slice, approve, publish, retry,
replay, externally post, merge, enable auto-merge, or claim merge authority.

## Authority Boundaries

This v0.2 alignment remains local scaffold metadata and Markdown skill
packaging. It does not add:

- runtime behavior
- network calls
- GitHub calls
- OpenAI calls
- Augnes runtime calls
- hooks
- MCP config
- app mappings
- MCP/App tool changes or writes
- Sites deployment behavior
- proof/evidence writes
- merge, publish, retry, replay, approval, or commit/reject authority
- Project Constellation UI/runtime behavior

`AGENTS.md` remains the root Codex operating contract. Plugin metadata, skills,
smokes, PR bodies, ChatGPT review, Sites URLs, and external OpenAI references
do not override Augnes Core gates.

## Validation

Validation for this docs/metadata/skill/smoke/package-pointer PR should include:

```text
npm run typecheck
npm run smoke:augnes-operator-plugin-scaffold
npm run smoke:augnes-operator-plugin-v2
git diff --check
git diff --cached --check
```

Supplemental Project Constellation content guard:

- The exact `npm run smoke:project-constellation-ia-boundaries` command is not
  a required check for this plugin PR because that smoke currently includes a
  PR #359-specific changed-file allowlist.
- `AUGNES_CHANGED_FILES_BASE_REF=HEAD npm run smoke:project-constellation-ia-boundaries`
  may be used as a supplemental content-only diagnostic to confirm Project
  Constellation IA content remains intact, but it is not a substitute for
  generalizing that smoke's changed-file mode.
- Future work may add a cross-PR regression mode for boundary smokes.

Browser/computer-use may be skipped because this PR is
docs/metadata/skill/smoke/package-pointer only and does not touch UI, runtime,
API, schema, MCP/App tools, routes, browser-facing files, or external calls.

Proof-only closeout may be skipped for this PR when no runtime/work ID context
is available. That skip must be reported explicitly. Skipping proof-only
closeout does not create proof, readiness, approval, or merge authority.

## Non-Goals

This v0.2 alignment does not:

- merge ChatGPT Apps and Codex Plugins into one confirmed product surface
- add runtime code
- add UI components
- add API routes
- add DB schema or migrations
- add MCP/App tools
- add plugin hooks
- add MCP config
- add app mappings
- add external calls
- add GitHub/OpenAI/Augnes runtime calls
- add proof/evidence/readiness writes
- implement Project Constellation UI/runtime behavior
- create approve, publish, retry, replay, external-posting, commit/reject, or
  merge authority
