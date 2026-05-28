# Augnes Browser / Computer-Use Verification Runbook v0.1

## Purpose

This is PR 8 in the canonical Codex Agent Harness roadmap. It standardizes
browser/computer-use verification for Augnes UI/operator surfaces.

This is a verification runbook, not an automation implementation. It does not
add runtime behavior, browser automation, screenshot capture code, app tools,
MCP config, hooks, plugin behavior, or authority.

Browser/computer-use verification is observation. It helps reviewers inspect
rendered UI, layout, missing-data states, boundary text, and visible controls.
It is not durable approval, not proof recording, and not evidence recording by
itself.

## When Verification Is Required

Run browser/computer-use verification for:

- ChatGPT App/widget UI changes.
- Cockpit/operator UI changes.
- Work Contract Card or future operator card changes.
- Publication, delivery, or gate-state visual surfaces.
- Any PR that claims visual layout or rendering behavior changed.

Use this runbook whether the inspection is manual browser use, computer-use
driven observation, ChatGPT Developer Mode inspection, MCP Inspector plus widget
rendering, or local Cockpit browser review.

## When Verification May Be Skipped

Browser/computer-use verification may be skipped for:

- Docs-only changes with no rendered UI.
- CLI-only helper changes with no UI.
- Plugin, hooks, or config docs with no UI.
- Runtime-only changes where existing API and smoke checks are enough.

Skipped checks must still be concrete. Do not write only `N/A`, `skipped`, or
`not needed`.

## Skipped Reason Examples

- `browser verification skipped: no browser runtime available`
- `browser verification skipped: no local Augnes runtime available`
- `browser verification skipped: no ChatGPT Developer Mode tunnel/session available`
- `browser verification skipped: docs-only change with no rendered UI`
- `browser verification skipped: CLI-only helper change with no UI surface`

## Local Startup

Start the Augnes runtime from the repository root:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Start the Augnes App / MCP bridge in a second terminal:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

Use only local endpoints unless a task explicitly scopes Developer Mode tunnel
verification. Do not commit tunnel URLs, credentials, local database files,
transient screenshots, or generated report artifacts unless a future task
explicitly asks for a bounded artifact path.

## Surfaces To Inspect

Inspect the surfaces relevant to the PR:

- Cockpit Overview, Work, Perspective, Bridge, and Operator.
- ChatGPT App widget/card surface when available.
- Work Contract Card for PR 7-style card changes.
- Publication decision card surfaces where relevant.
- Publication, delivery, and gate-state visual surfaces where relevant.
- Error, loading, missing-runtime, and missing-data states when those states
  are part of the change.

## Required Checks

Record each applicable check in the report:

- UI loads.
- Target view or card renders.
- Missing-data state renders without throwing.
- Boundary text is visible when relevant.
- No unauthorized write controls are visible.
- No `Run Codex` control is visible.
- No commit/reject control is visible unless a future Core-gated
  operator-control PR explicitly scopes it.
- No approve, publish, retry, replay, or externally-post controls are visible
  unless explicitly scoped.
- No merge or auto-merge controls are visible.
- No proof or evidence recording controls are visible unless explicitly scoped.
- Rendered view matches relevant API/tool output at a high level.
- Errors or unavailable runtime states show concrete status instead of
  fabricated data.

Unauthorized controls include buttons, forms, links, menus, cards, or other UI
affordances that imply Codex execution, Augnes state commit/reject, approval,
publication, retry, replay, external posting, merge, auto-merge, proof
recording, or evidence recording outside the task scope.

## Evidence And Reporting

Use `docs/templates/codex-browser-verification-report.md` when browser or
computer-use verification is performed or explicitly skipped.

The report should include:

- Environment.
- Commands run.
- URLs and views checked.
- Observations.
- Screenshot or artifact refs if available.
- Gaps and skipped checks with concrete reasons.
- Authority boundary confirmation.
- Whether no unauthorized controls were visible.
- Related PR, work ID, and handoff ID if known.

Do not include secrets in screenshots or reports. Do not include raw tokens,
private keys, tunnel auth details, local `.env` values, local database contents,
session secrets, or hidden provider/debug identifiers.

Do not treat a screenshot as durable approval. A screenshot may support an
observation, but durable approval remains user/Core gated and proof/evidence
records exist only when their helpers or routes actually return recorded IDs.

## Authority Boundaries

Browser/computer-use verification is observation. It does not:

- approve
- publish
- retry
- replay
- externally post
- merge
- enable auto-merge
- commit or reject Augnes state
- record proof
- record evidence
- execute Codex
- mutate runtime state

Proof is not approval. A PR is not merge authority. Durable approval remains
user/Core gated.

## Relationship To Work Contract Card

The Work Contract Card is a read-only ChatGPT App/operator surface derived from
existing work brief structured content. Browser/computer-use verification for
Work Contract Card changes should confirm the card renders, fallback text is
visible when optional fields are missing, authority boundary text is visible,
and no execution, approval, publication, commit/reject, proof/evidence, merge,
or auto-merge controls appear.

This runbook does not add a new card or modify PR 7 card behavior.

## Relationship To ChatGPT App Bridge

The ChatGPT App bridge can expose read tools and separately scoped
bridge-gated draft/proof/trace tools. Browser verification may inspect the
widget or Developer Mode output when available, but it does not add bridge
tools, broaden tool schemas, call the Augnes runtime from tests, record proof,
or turn ChatGPT into a Codex execution surface.

If Developer Mode or a tunnel is unavailable, report:

```text
browser verification skipped: no ChatGPT Developer Mode tunnel/session available
```

## Relationship To Cockpit

Cockpit is an observability surface for state, work, perspective, bridge, and
operator views. Browser verification should confirm the relevant Cockpit view
renders, keeps authority boundaries visible where relevant, and does not expose
hidden write controls outside the scoped PR.

Visual inspection of Cockpit does not approve, publish, retry, replay,
commit/reject state, record proof, record evidence, merge, or enable
auto-merge.

## Relationship To Codex Closeout Preflight

`npm run codex:closeout-preflight` remains the deterministic closeout packet
check. It can confirm that browser verification was reported or skipped with a
concrete reason. It does not perform browser verification, record proof, record
evidence, approve, publish, merge, or call the Augnes runtime.

## Relationship To Augnes Operator Hooks

The Augnes operator hooks are local guardrails for Codex sessions. They may
remind Codex to report verification and skipped checks, but they do not run
browser automation, capture screenshots, record evidence, approve, publish,
merge, or create authority.

## Relationship To Codex MCP Bridge Docs

`docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md` documents safe MCP bridge usage.
This runbook complements those docs by standardizing how rendered UI and
operator surfaces are visually inspected. It does not add active MCP config,
plugin MCP config, app mappings, bridge write tools, or Developer Mode
automation.

## Relationship To Canonical Roadmap

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` defines this as PR 8: Browser /
Computer-Use Verification Runbook. PR 9 remains dogfood episode capture. This
slice adds documentation and a deterministic smoke test only.

## Relationship To Authority Matrix

`docs/AUTHORITY_MATRIX.md` defines Browser/Chrome and MCP Inspector as
observability surfaces. This runbook follows that boundary: browser and
computer-use verification may observe rendered state and report findings, but
they do not own durable approval, proof, publication, merge, or Augnes
commit/reject authority.

## Non-Goals And Forbidden Changes

This PR 8 runbook does not add:

- browser automation implementation
- screenshots generated by this PR
- screenshot capture implementation
- runtime behavior changes
- database or schema changes
- API route changes
- app tool changes
- MCP/App tool schema changes
- active MCP config
- plugin MCP config
- app mappings
- hooks
- ChatGPT App UI/operator card implementation
- dogfood episode helper implementation
- secret handling changes
- dependencies
- OpenAI calls
- GitHub calls
- Augnes runtime calls from tests
- evidence recording
- proof recording
- external posting
- committed-state mutation
- merge or auto-merge behavior
