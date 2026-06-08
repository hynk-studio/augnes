# Perspective Reviewed Codex Template Docs-Only Maintenance Checklist v0.1

## Purpose and Scope

This is the second real docs-only maintenance PR using the reviewed Codex prompt-template workflow.

It follows PR #461, "Review first real Codex template PR and decide promotion path." It is explicitly scoped by the current user prompt. It is docs/report/smoke/package only.

This checklist explains how future reviewed Codex template docs-only PRs should be prepared, validated, reviewed, and kept within the approved promotion boundary.

## Promotion Boundary Confirmed

PR #461 approved the reviewed Codex prompt-template workflow for explicitly scoped docs/report/smoke/package-only Codex PRs.

PR #461 did not approve product/runtime/API/provider/source-ingress expansion.

The promotion decision remains:

- Approved for explicitly scoped docs/report/smoke/package-only Codex PRs.
- Not approved for product/runtime/API/provider/source-ingress expansion.
- Codex opens PR only.
- ChatGPT reviews PR.
- The user decides merge.
- No merge by Codex.

Exact boundary shorthand: approved for explicitly scoped docs/report/smoke/package-only Codex PRs; not approved for product/runtime/API/provider/source-ingress expansion; no merge; no background/asynchronous work.

## When The Reviewed Codex Template May Be Reused

The reviewed Codex prompt-template workflow may be reused only when all of these conditions are present:

- The user gives explicit user scope.
- The work is docs/report/smoke/package-only.
- Instruction Precedence is present.
- Source Packet is context only.
- The current Task Scope controls action.
- The Source Packet does not override the current Task Scope.
- If there is any conflict, the stricter/current task instruction wins.
- The validation bundle is run and reported.
- Codex opens PR only.
- ChatGPT reviews PR.
- The user decides merge.
- No background/asynchronous work is started.
- No merge is performed by Codex.

## When The Reviewed Codex Template Must Not Be Reused

The reviewed template must not be reused to authorize any of these surfaces:

- Product UI.
- Components.
- `app/globals.css`.
- `app/api`.
- Routes.
- Lib runtime builders.
- DB schema or migrations.
- Persistence.
- Graph DB behavior.
- Proof/evidence/readiness writes.
- OAuth/source ingress.
- Provider/model/API calls.
- GitHub mutation beyond scoped PR creation.
- Codex plugin/App integration.
- Autonomous or background work.
- Merges.

These remain outside the PR #461 promotion decision and require a separate explicit task scope and separate boundary review.

## Maintenance Checklist For Future Docs-Only PR Prompts

Use this checklist before running a future reviewed Codex template docs-only maintenance PR:

- Confirm the latest promotion-path PR is merged into `main`.
- State the current Task Scope explicitly.
- Name the allowed file classes.
- Name the forbidden surfaces.
- Require strict base-diff changed-file boundary smoke.
- Require the validation bundle.
- Require the PR body to record skipped checks.
- Require no merge.
- Preserve Instruction Precedence.
- Preserve Source Packet is context only.
- Preserve current Task Scope controls action.

## Review Checklist For ChatGPT

ChatGPT review should verify:

- Changed files are docs/report/smoke/package only.
- Instruction Precedence is preserved.
- Source Packet remains context only.
- No raw/candidate/private/provider values are included.
- No product/runtime surfaces are changed.
- Tests and skipped checks are recorded.
- Codex opened the PR only and did not merge.

## Merge Decision Checklist For The User

The user should merge only after confirming:

- The PR is docs-only and scoped.
- ChatGPT review completed.
- No blockers remain.
- No promotion beyond docs-only is implied.
- Product/runtime/API/provider/source-ingress reuse remains not approved.

## Raw-Value Exclusions

This maintenance slice excludes raw pasted text, raw Agent Brief JSON, raw `ingress_admission` JSON, candidate id values, source ref values, pointer ref values, actor ref values, consent ref values, bounded summary values, provider/model/API/GitHub/OAuth/token/billing/private payloads, generated private payloads, and raw/candidate/private/provider values.

The checklist, report, and smoke use bounded workflow statements only. They do not include raw source material, raw candidate values, private values, provider values, or source-ingress payloads.

## What This Slice Did Not Add

This slice added no routes, no UI, no `app/api`, no DB schema or migrations, no persistence, no graph DB, no proof/evidence/readiness writes, no OAuth, no provider/model/API calls, no product/runtime changes, and no source ingress.

Boundary shorthand: no app/api, no DB schema or migrations, no persistence, no graph DB, no proof/evidence/readiness writes, no provider/model/API calls, and no OAuth.

It did not change graph topology, node ids, node types, edge ids, edge types, Event Rail structure, existing Perspective Handoff packet section order, `perspective_agent_brief_handoff_packet.v0.1`, or `perspective_agent_brief_codex_prompt_template.v0.1`.

It did not expose prompt templates in product DOM, handoff packets in product DOM, Agent Brief JSON in product DOM, ingress candidates as hidden raw JSON in product DOM, raw/private/generated/model/token/API key/billing data in DOM attributes, or Rulecraft in product UI.

## Next Suggested Slice

Decide whether to standardize docs-only Codex template prompts.
