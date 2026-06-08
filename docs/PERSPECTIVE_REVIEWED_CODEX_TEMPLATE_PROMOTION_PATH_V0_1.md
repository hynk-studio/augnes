# Perspective Reviewed Codex Template Promotion Path v0.1

## Purpose and Scope

This PR reviews the first real docs-only Codex template PR and decides a promotion path.

It follows PR #460, which validated the first real docs-only Codex PR using the reviewed Codex prompt-template workflow and fixed the first-real-docs boundary smoke so missing base diffs fail loudly.

This is a docs/report/smoke/package-only decision slice. It does not promote product/runtime work, add routes, change UI, change runtime builders, call providers, call GitHub beyond opening this scoped PR, execute background work, add persistence, add graph DB behavior, write proof/evidence/readiness state, implement OAuth, or add source ingress.

## Evidence Considered

- The reviewed template builder exists.
- The mock PR evaluation passed.
- Instruction Precedence was added.
- The first real docs-only PR passed.
- The boundary smoke was fixed to fail loudly on missing base diff.

## Promotion Decision

Promotion decision: approved for explicitly scoped docs/report/smoke/package-only Codex PRs. Not approved for product/runtime/API/provider/source-ingress expansion.

The reviewed Codex prompt-template workflow is approved only when the user explicitly scopes a docs/report/smoke/package-only PR. It is not approved for autonomous work, background work, product UI changes, route or API changes, runtime builder changes, DB/migration work, persistence, graph DB behavior, proof/evidence/readiness writes, OAuth/source ingress, provider/model/API calls, GitHub mutation beyond scoped PR creation, Codex plugin/App integration, or merges.

Decision summary: approved for explicitly scoped docs/report/smoke/package-only Codex PRs; not approved for product/runtime/API/provider/source-ingress expansion.

## Required Workflow

- Codex codes/tests/opens PR.
- ChatGPT reviews PR.
- User decides merge.

Codex must not merge.

## Required Conditions For Promoted Docs-Only Use

- Explicit user scope.
- Instruction Precedence present.
- Source Packet is context only.
- Current Task Scope controls action.
- No merge.
- No background/asynchronous work.
- No raw/candidate/private/provider values in artifacts.
- Validation bundle run and reported.

## Promotion Status

| Surface | Status | Decision |
| --- | --- | --- |
| dogfood artifacts | complete | usable as evidence |
| mock PR evaluation | complete | usable as evidence |
| first real docs-only PR | complete | usable as evidence |
| docs-only reuse | approved with constraints | explicit user scope required |
| product/runtime reuse | not approved | requires separate promotion decision |
| route/API reuse | not approved | requires separate promotion decision |
| provider/GitHub/Codex execution expansion | not approved | scoped PR creation only |
| OAuth/source ingress | not approved | requires separate boundary review |

## Required Next Gate For Product Or Runtime PRs

Product/runtime PRs require:

- Separate explicit user approval.
- Stronger smoke/browser/API validation.
- No hidden DOM exposure.
- No raw-value leakage.
- No route or persistence expansion without dedicated boundary review.

The reviewed template may provide context, but it must not be treated as authority to modify product/runtime surfaces.

## What Changed

- Added this promotion-path documentation.
- Added a promotion-path validation report.
- Added a smoke test for the promotion decision, boundaries, and strict base-diff collection.
- Registered the smoke in `package.json`.

## What Intentionally Did Not Change

- No routes.
- No `app/api`.
- No product UI.
- No components.
- No `app/globals.css`.
- No runtime builders.
- No prompt template code.
- No packet builder code.
- No Agent Brief read route behavior.
- No local manual preview route behavior.
- No DB schema or migrations.
- No persistence.
- No graph DB behavior.
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

This slice excludes raw pasted text, raw Agent Brief JSON, raw `ingress_admission` JSON, candidate id values, source ref values, pointer ref values, actor ref values, consent ref values, bounded summary values, provider/model/API/GitHub/OAuth/token/billing/private payloads, and generated private payloads.

## Recommended Next Implementation PR

Use reviewed Codex template for second docs-only maintenance PR.
