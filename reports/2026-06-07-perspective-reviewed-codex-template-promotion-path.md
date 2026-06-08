# Perspective Reviewed Codex Template Promotion Path

Date: 2026-06-08

## Branch

`codex/perspective-reviewed-codex-template-promotion-path-v0-1`

## Commit

Pending final commit in this PR branch; final SHA is recorded in the PR body and closeout.

## Preflight Result

PASS. PR #460, "Run reviewed Codex prompt template on first real docs-only Codex PR", is merged into `main` and `main` contains the first-real-docs doc, report, smoke, package registration, and strict base-diff collection follow-up.

## Files Changed

- `docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_PROMOTION_PATH_V0_1.md`
- `reports/2026-06-07-perspective-reviewed-codex-template-promotion-path.md`
- `scripts/smoke-perspective-reviewed-codex-template-promotion-path.mjs`
- `package.json`
- Existing Perspective smoke allowlists updated narrowly if required by boundary smokes.

## Evidence Reviewed

- Reviewed template builder exists: PASS
- Mock PR evaluation passed: PASS
- Instruction Precedence was added: PASS
- First real docs-only PR passed: PASS
- Base-diff boundary smoke fixed: PASS

## Promotion Decision

Promotion decision: approved for explicitly scoped docs/report/smoke/package-only Codex PRs. Not approved for product/runtime/API/provider/source-ingress expansion.

The reviewed Codex template is approved only for docs/report/smoke/package-only PRs with explicit user scope. This PR decides a promotion path, not a product change. No product/runtime authority was added.

This PR is docs/report/smoke/package only.

## Promotion Status Table

| Category | Check | Result |
| --- | --- | --- |
| Evidence | mock PR evaluation passed | PASS |
| Evidence | first real docs-only PR passed | PASS |
| Evidence | base-diff boundary smoke fixed | PASS |
| Promotion | docs/report/smoke/package reuse approved | PASS |
| Promotion | product/runtime reuse not approved | PASS |
| Promotion | route/API/provider expansion not approved | PASS |
| Workflow | Codex opens PR only | PASS |
| Workflow | ChatGPT review required | PASS |
| Workflow | user merge decision required | PASS |
| Boundary | Instruction Precedence preserved | PASS |
| Boundary | Source Packet context-only | PASS |
| Boundary | raw/candidate/private/provider values excluded | PASS |

## Conditions For Reuse

- Explicit user scope.
- Instruction Precedence present.
- Source Packet is context only.
- Current Task Scope controls action.
- No merge.
- No background/asynchronous work.
- No raw/candidate/private/provider values in artifacts.
- Validation bundle run and reported.

## What Remains Not Promoted

- Product UI changes.
- `app/api` routes.
- Runtime builder changes.
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

## What Codex Did

- Verified PR #460 was merged into `main`.
- Fast-forwarded local `main`.
- Created the requested branch from the #460 merge.
- Added docs/report/smoke/package changes only.
- Ran the required validation bundle.
- Opened the scoped PR.

## What Codex Did Not Do

- Did not merge.
- Did not modify product UI, components, `app/globals.css`, or `app/api`.
- Did not add routes.
- Did not modify runtime builders, prompt template code, packet builder code, Agent Brief read route behavior, or local manual preview route behavior.
- Did not add DB schema, migrations, persistence, graph DB behavior, or proof/evidence/readiness writes.
- Did not call provider/model/API services.
- Did not implement OAuth, ChatGPT Apps integration, or Codex plugin integration.
- Did not change graph topology, node ids/types, edge ids/types, Event Rail, or existing Perspective packet section order.
- Did not include raw pasted text, raw candidate values, raw Agent Brief JSON, candidate/source/pointer/actor/consent values, bounded summary values, or private/provider/token payloads.

## PR-Centered Workflow Confirmation

- Codex codes/tests/opens PR when the user explicitly scopes that task: PASS
- ChatGPT reviews PR: PASS
- User decides merge: PASS
- No merge by Codex: PASS

## Tests Run

- `npm run typecheck`: PASS
- `npm run smoke:perspective-reviewed-codex-template-promotion-path`: PASS
- `npm run smoke:perspective-reviewed-codex-template-first-real-docs-pr`: PASS
- `npm run smoke:perspective-reviewed-codex-template-copy-refine`: PASS
- `npm run smoke:perspective-reviewed-codex-template-mock-pr-eval`: PASS
- `npm run smoke:perspective-reviewed-manual-agent-brief-codex-template`: PASS
- `npm run smoke:perspective-agent-brief-handoff-copy-refine`: PASS
- `npm run smoke:perspective-manual-agent-brief-codex-review-loop-eval`: PASS
- `npm run smoke:perspective-manual-agent-brief-handoff-dogfood`: PASS
- `npm run smoke:perspective-agent-brief-manual-ingress-context`: PASS
- `npm run smoke:perspective-agent-brief-read-surface`: PASS
- `npm run smoke:perspective-local-manual-ingress-admission-preview`: PASS
- `npm run smoke:perspective-ingress-admission-model`: PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders`: PASS
- `npm run smoke:cockpit-perspective-workbench-temporal-underlay`: PASS
- `npm run smoke:perspective-ingest-constellation-preview`: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS
- `npm run build`: PASS

## Skipped Checks

Browser validation skipped because this is a docs/report/smoke/package-only decision slice with no UI or route changes.

`npm run lint` skipped because `package.json` does not define a lint script.

`npm test` skipped because `package.json` does not define a test script.

## Blockers / Risks

No blockers. Main risk is over-promotion; this report explicitly limits promotion to docs/report/smoke/package-only PRs with explicit user scope.

## Recommended Next Implementation PR

Use reviewed Codex template for second docs-only maintenance PR.
