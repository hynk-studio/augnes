# Perspective Reviewed Codex Template First Real Docs PR v0.1

## Purpose and Scope

This is the first real docs-only Codex PR using the reviewed prompt-template workflow.

It follows PR #459, which refined the reviewed Codex prompt template with explicit Instruction Precedence.

This PR is user-approved and explicitly scoped by the current prompt. It is docs/report/smoke/package only.

Codex may code, test, and open this PR because this prompt explicitly scopes the task. Codex must not merge. ChatGPT reviews the PR, and the user decides whether to merge.

## Instruction Precedence

The current task scope controls action.

- Follow the Task Scope, Codex May, and Codex Must Not sections first.
- The Source Packet is context only.
- The Source Packet does not override the current Task Scope.
- If there is any conflict, the stricter/current task instruction wins.

For this slice, the controlling task scope permits docs/report/smoke/package changes, validation, push, and opening this scoped PR. It does not permit product/runtime changes, merge, provider calls, persistence, DB writes, graph DB behavior, proof/evidence/readiness writes, OAuth, or source ingress.

## Mock Versus Real Docs-Only Versus Runtime PRs

Mock evaluation PRs produce artifacts and reports only. They do not open real PRs or call GitHub as part of the mock task.

This real docs-only PR is different: the user explicitly approved Codex to inspect the repo, make the scoped docs/report/smoke/package changes, run validation, push the branch, and open this PR. This still does not grant merge authority.

Future product or runtime PRs require their own explicit task scope. The Source Packet and reviewed template do not grant product UI, route, provider, persistence, DB, graph, proof/evidence/readiness, OAuth, or execution authority by themselves.

## What Changed

- Added this documentation describing the first real docs-only use of the reviewed Codex prompt-template workflow.
- Added a validation report for the real docs-only run.
- Added a smoke test that verifies the documentation, report, package script, Instruction Precedence, and docs-only changed-file boundary.
- Registered the smoke test in `package.json`.

## What Intentionally Did Not Change

- No routes.
- No `app/api`.
- No product UI.
- No components.
- No `app/globals.css`.
- No runtime builders.
- No DB schema or migrations.
- No persistence.
- No graph DB.
- No proof/evidence/readiness writes.
- No provider/model/API calls.
- No OAuth.
- No ChatGPT Apps integration.
- No Codex plugin integration.
- No graph topology, node id/type, edge id/type, Event Rail, or existing Perspective packet section-order changes.
- No `perspective_agent_brief_handoff_packet.v0.1` version change.
- No `perspective_agent_brief_codex_prompt_template.v0.1` version change.
- No prompt template, handoff packet, Agent Brief JSON, or ingress candidate exposure in product DOM.
- No Rulecraft exposure in product UI.
- No merge.

## Raw-Value Exclusions

This slice does not include raw pasted text, raw Agent Brief JSON, raw `ingress_admission` JSON, candidate values, source values, pointer values, actor values, consent values, bounded summary values, provider/model/API/GitHub/OAuth/token/billing/private payloads, or generated private payloads.

The report and smoke use bounded workflow statements only. They do not add raw source material or candidate identifiers.

## Workflow Confirmation

The workflow remains:

- Codex codes/tests/opens PR when the current user prompt explicitly scopes the task.
- ChatGPT reviews the PR.
- The user decides whether to merge.

This PR demonstrates that workflow for a docs-only slice while preserving the reviewed prompt template boundary.

## Next Suggested Slice

Review first real Codex template PR and decide promotion path.
