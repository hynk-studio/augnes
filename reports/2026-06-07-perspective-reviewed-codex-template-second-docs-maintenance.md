# Perspective Reviewed Codex Template Second Docs Maintenance

Date: 2026-06-08

## Branch

`codex/perspective-reviewed-codex-template-second-docs-maintenance-v0-1`

## Commit

Final commit SHA is recorded in the PR body and final closeout after validation.

## Preflight Result

PASS. PR #461, "Review first real Codex template PR and decide promotion path", is merged into `main`. `main` contains the promotion-path doc, report, smoke, and package registration.

## Files Changed

- `docs/PERSPECTIVE_REVIEWED_CODEX_TEMPLATE_DOCS_ONLY_MAINTENANCE_CHECKLIST_V0_1.md`
- `reports/2026-06-07-perspective-reviewed-codex-template-second-docs-maintenance.md`
- `scripts/smoke-perspective-reviewed-codex-template-second-docs-maintenance.mjs`
- `package.json`
- Existing Perspective smoke allowlists updated narrowly for the new docs-only maintenance doc/report/smoke files.

## Second Docs-Only Maintenance Run Summary

This was the second real docs-only PR under the reviewed Codex template promotion path.

The current user prompt explicitly scoped Codex to docs/report/smoke/package changes, validation, branch push, and scoped PR creation. Codex opened a PR and did not merge. ChatGPT review remains required. User merge decision remains required.

No product/runtime authority was added. The promotion remains limited to docs/report/smoke/package-only PRs with explicit user scope.

## Why This Was Allowed Under PR #461

PR #461 approved reuse of the reviewed Codex prompt-template workflow only for explicitly scoped docs/report/smoke/package-only Codex PRs.

This task satisfies that condition because it is docs/report/smoke/package only, explicitly scoped by the current user prompt, includes Instruction Precedence, treats the Source Packet as context only, runs and reports validation, and keeps the workflow PR-centered.

The promotion remains limited. Product/runtime/API/provider/source-ingress reuse remains not approved.

## What Codex Did

- Verified PR #461 was merged into `main`.
- Fast-forwarded local `main`.
- Created the requested branch from `main`.
- Added the docs-only maintenance checklist.
- Added this validation report.
- Added the second-docs-maintenance smoke.
- Registered the new smoke in `package.json`.
- Updated existing Perspective smoke allowlists narrowly so the required strict base-diff smokes accept this docs/report/smoke/package-only branch.
- Ran the required validation bundle.
- Pushed the branch and opened the scoped PR.

## What Codex Did Not Do

- Did not merge.
- Did not modify product UI, components, `app/globals.css`, or `app/api`.
- Did not add routes.
- Did not modify lib runtime builders, prompt template code, packet builder code, Agent Brief read route behavior, or local manual preview route behavior.
- Did not add DB schema, migrations, persistence, graph DB behavior, or proof/evidence/readiness writes.
- Did not call provider/model/API services.
- Did not implement OAuth, ChatGPT Apps integration, or Codex plugin integration.
- Did not change graph topology, node ids/types, edge ids/types, Event Rail, or existing Perspective packet section order.
- Did not change `perspective_agent_brief_handoff_packet.v0.1`.
- Did not change `perspective_agent_brief_codex_prompt_template.v0.1`.
- Did not include raw pasted text, raw candidate values, raw Agent Brief JSON, candidate/source/pointer/actor/consent values, bounded summary values, or private/provider/token payloads.

## Reuse Checklist Result

| Category | Check | Result |
| --- | --- | --- |
| Scope | docs/report/smoke/package only | PASS |
| Scope | no product UI or route changes | PASS |
| Workflow | Codex opened PR only | PASS |
| Workflow | no merge | PASS |
| Workflow | ChatGPT review required | PASS |
| Workflow | user merge decision required | PASS |
| Promotion | docs-only reuse remains constrained | PASS |
| Promotion | product/runtime reuse remains not approved | PASS |
| Boundary | Instruction Precedence preserved | PASS |
| Boundary | Source Packet context-only | PASS |
| Boundary | strict base-diff smoke present | PASS |
| Raw values | no raw pasted text or raw admission values | PASS |

## PR-Centered Workflow Confirmation

- Codex codes/tests/opens PR when the current user prompt explicitly scopes that task: PASS
- ChatGPT reviews the PR: PASS
- User decides whether to merge: PASS
- Codex did not merge: PASS

## Tests Run

- `npm run typecheck`: PASS
- `npm run smoke:perspective-reviewed-codex-template-second-docs-maintenance`: PASS
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

`npm run lint` skipped because `package.json` does not define a lint script.

`npm test` skipped because `package.json` does not define a test script.

Browser validation skipped because this is a docs/report/smoke/package-only maintenance slice with no UI or route changes.

## Blockers / Risks

No blockers identified at authoring time.

Main risk: over-promotion. This report explicitly limits promotion to docs/report/smoke/package-only PRs with explicit user scope and states that product/runtime/API/provider/source-ingress reuse remains not approved.

## Recommended Next Implementation PR

Decide whether to standardize docs-only Codex template prompts.
