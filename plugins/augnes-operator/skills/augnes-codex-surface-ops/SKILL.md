---
name: augnes-codex-surface-ops
description: Guide Augnes Codex surface operations across Queue, Steer, /side, Remote/SSH, Sites, diff/review, mobile/security, skipped reasons, and final PR reports without adding runtime authority.
---

# Augnes Codex Surface Ops

## Purpose

Use this skill when Augnes work needs repo-facing Codex workflow guidance across
Codex surface operations while preserving Augnes authority boundaries.

This skill is instruction-only. It does not run commands, call Augnes runtime,
call GitHub, call OpenAI, call network resources, add hooks, add MCP config, add
app mappings, record evidence, record proof, publish, retry, replay, merge, or
implement UI/runtime behavior.

## Operating Contract

`AGENTS.md` remains the root Codex operating contract. This skill adds
surface-operation guidance for Codex use inside a PR-centered workflow:

- Codex codes, verifies, reports, and opens PRs.
- ChatGPT reviews PRs and surfaces review feedback.
- The user decides whether and when to merge.

Do not treat a Codex surface, plugin, skill, hook, ChatGPT App, MCP bridge,
Sites saved version, Sites deployment URL, or remote connection as Augnes
readiness, proof, publication, approval, commit/reject, or merge authority.

## Queue

Queue is for after-completion follow-up, verification, closeout, or next-task
handling. Use Queue when the current scoped task should finish first and the
new instruction belongs to the next turn or a future PR.

For Augnes work, queued items should preserve:

- the current PR or branch context
- the requested follow-up
- any skipped reason that should carry forward
- the verification path expected after the current task completes

Do not use Queue to mutate the current task after scope has been closed. If a
queued item would change the current PR scope, report it as a follow-up or ask
for separate approval.

## Steer

Steer is bounded correction inside the current scoped task. Use it when the
user corrects an assumption, tightens allowed files, clarifies test commands,
or asks for a small in-scope change while Codex is still working.

When steering Augnes work:

- apply the newest user instruction first
- keep the original forbidden-file and authority boundaries active
- name any previous assumption that changed
- rerun affected checks or report why a check is skipped

Steer must not broaden a docs-only task into runtime, API, schema, MCP/App,
hook, publication, proof/evidence, Sites deployment, or Project Constellation
implementation behavior.

## /side

`/side` is for investigation, scope review, error diagnosis, explanation, or
status recap. It is not main task mutation.

Use `/side` to inspect a question without disturbing the main task transcript
or file scope. If the side result implies a change to the main task, bring it
back as a reviewed recommendation and confirm it fits the active scope before
editing.

## Remote / SSH

Remote and SSH work must preserve execution provenance. For every remote or
SSH-assisted Augnes task, report:

- execution host or remote project identity when available
- whether commands ran on local, remote, or SSH-backed filesystem/shell
- approval context used for remote actions
- skipped reason for unavailable remote context
- verification path used on that host

Do not expose app-server transports directly on a public network. Do not copy
secrets into prompts, docs, config, plugin metadata, or committed files.

## Sites

Sites saved versions may be demo or review artifact pointers. Sites deployment
URLs are production deployment and are not Augnes readiness, proof, publication,
approval, or merge authority.

For Augnes:

- saved versions can be referenced as review candidates when a Sites task is
  explicitly scoped
- deployment requires explicit user intent and any required product approval
- deployment URLs must never be treated as evidence/proof/readiness writes
- this skill does not implement Sites deployment behavior

## Diff / Review

Use diff/review surfaces to inspect changes before commit, PR creation, or
handoff. Review findings are advisory until a user or reviewer decides what to
accept.

For PR-centered workflow:

- keep changed files within the allowed set
- verify exact commands requested by the task
- preserve unrelated worktree changes
- report review findings, skipped checks, and authority risks clearly

Do not claim that review output approves the PR or grants merge authority.

## Mobile, Lock, And Security

Mobile or remote control can send prompts, approvals, and follow-up messages to
a connected Codex host. The connected host supplies files, commands, tools,
plugins, permissions, and credentials.

For Augnes:

- keep host provenance visible in reports
- avoid secret reads and secret transcription
- preserve sandbox and approval context
- lock or disconnect unattended hosts when work is complete or paused
- do not widen access, permissions, or remote host exposure as part of an
  Augnes docs/skill PR

## Skipped Reason Policy

Every skipped check or skipped surface must include a concrete reason. Do not
write only `N/A`, `skipped`, or `not needed`.

Preferred examples:

- `browser/computer-use skipped: docs/metadata/skill/smoke/package-pointer only`
- `proof-only closeout skipped: no runtime/work ID context for this PR`
- `remote verification skipped: no SSH host in scope`
- `Sites skipped: no Sites task or deployment scope`
- `MCP/App skipped: no MCP/App tool change in scope`

## Final Report Requirements

For Augnes PR work, final reports and PR bodies should include:

- summary
- files changed
- authority boundary statement
- verification commands and results
- browser/computer-use skipped reason when skipped
- proof-only closeout status or skipped reason
- blockers and risks
- assumptions
- questions requiring user or PM judgment
- next suggested goal

Never report a check as passed unless it actually ran. Never claim merge
authority. ChatGPT reviews; the user decides merge.

## Non-Goals

This skill does not add:

- runtime behavior
- network calls
- GitHub calls
- OpenAI calls
- Augnes runtime calls
- hooks
- MCP config
- app mappings
- Sites deployment behavior
- proof or evidence writes
- merge, publish, retry, replay, approval, or commit/reject authority
- Project Constellation UI/runtime behavior
