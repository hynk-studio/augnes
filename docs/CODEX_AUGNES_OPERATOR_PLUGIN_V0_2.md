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
- `plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md` adds an
  instruction-only Perspective Capsule / Handoff Capsule consumption skill.
- `scripts/smoke-augnes-operator-plugin-v2.mjs` adds a static boundary smoke.
- `scripts/smoke-augnes-capsule-handoff-skill.mjs` adds a static guard for
  the capsule handoff skill.
- `package.json` exposes `npm run smoke:augnes-operator-plugin-v2`.
- `package.json` exposes `npm run smoke:augnes-capsule-handoff-skill`.
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

The shared Perspective Capsule / Handoff Capsule contract is defined in
`docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`. That contract is docs-only,
non-SSOT, contract/design-only, read-only, and non-authoritative. This v0.2
plugin alignment remains docs/metadata/skill/smoke/package-pointer only and
does not modify plugin skill semantics.

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

## v0.2 Capsule Handoff Skill

The `augnes-capsule-handoff` skill is instruction-only guidance for consuming
Perspective Capsule / Handoff Capsule material from Augnes, Project
Constellation, Cockpit Perspective, ChatGPT review, or manually copied handoff
text.

The skill tells Codex to preserve repo, base branch, working branch suggestion,
expected PR title, task goal, context anchors, selected nodes and edges,
expected changed files, forbidden changed files, hard constraints, required
checks, skipped check policy, evidence pointers, unresolved tensions,
browser/computer-use expectation, proof-only closeout expectation, PR body
requirements, final report requirements, blockers, repo/task mismatches, scope
risks, assumptions, questions requiring user/PM judgment, and next suggested
goal.

Dogfood-derived v0.1 wording refinement adds a short checklist example for
mapping capsule material into PR body requirements, final report requirements,
validation list, skipped check policy, blockers/risks, assumptions, questions
requiring user/PM judgment, and next suggested goal. It also adds concrete
skipped-reason examples and explicit empty-field reporting guidance such as
`Blockers: none.`, `Repo/task mismatches: none.`, and `Questions requiring
user/PM judgment: none.` This remains instruction-only guidance and does not
add runtime behavior or authority.

The skill can guide Codex during a user-scoped task, but it does not create
execution authority. It does not call GitHub, does not call OpenAI, does not
call Augnes runtime, does not call network resources, does not call MCP/App
tools, does not record proof/evidence, does not create branches, does not open
PRs, does not merge, does not publish, does not approve, does not retry, does
not replay, does not deploy, does not post externally, does not execute Codex
SDK calls, and does not implement providers.

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
npm run smoke:augnes-capsule-handoff-skill
git diff --check
git diff --cached --check
```

`npm run smoke:augnes-operator-plugin-v2` runs in strict scoped changed-file
mode by default. For unrelated PRs that only need to confirm v0.2 plugin
content and boundary wording still hold, use the explicit supplemental
content-only mode:

```text
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:augnes-operator-plugin-v2
```

Content-only mode is supplemental for unrelated PRs. It skips the changed-file
allowlist by explicit opt-in while preserving content, pointer, package-script,
and boundary checks. It is not a replacement for scoped changed-file validation
when this plugin alignment doc, smoke, package pointer, or plugin metadata are
directly edited.

Legacy `AUGNES_CHANGED_FILES_BASE_REF=HEAD` diagnostics are superseded by
`AUGNES_BOUNDARY_SMOKE_MODE=content-only` for cross-PR content checks.

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
- add branch or PR creation authority by itself
- implement Project Constellation UI/runtime behavior
- implement Perspective Capsule runtime behavior
- implement Codex SDK execution
- create approve, publish, retry, replay, external-posting, commit/reject, or
  merge authority
