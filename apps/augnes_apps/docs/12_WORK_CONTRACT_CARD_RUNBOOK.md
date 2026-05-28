# Work Contract Card Runbook

## Purpose

The Work Contract Card is the first ChatGPT App operator card for Augnes work
context. It gives a human operator a compact read-only view of the contract a
Codex worker is expected to honor before implementation and closeout.

The card is decision support only. It does not create authority, record proof,
record evidence, mutate runtime state, or dispatch execution.

## Data Source

The card is rendered from existing `augnes_get_work_brief` structured content.
The tool still returns the original `structuredContent.brief` payload, and the
server adds a derived `structuredContent.work_contract_card` object plus widget
panel metadata.

No new bridge write tool is added. No new API route, database schema, MCP
configuration, hook, plugin behavior, dependency, secret handling, or external
service call is added for this card.

## Card Fields

When available, the card displays:

- `scope`
- `work_id`
- work title
- work status
- priority
- current or next step
- expected files
- expected checks
- related state keys
- recent events count
- linked proof/action ID count
- linked PR and doc reference counts
- proof/evidence expectation summary
- skipped-check expectation summary
- authority boundary text

Expected checks are derived from work brief Codex handoff fields such as
`suggested_verification` when present. Expected files are displayed only when
the work brief or future compatible handoff shape includes them.

## Missing Data Behavior

Optional fields render explicit fallback text instead of throwing or inventing
context.

Fallback examples:

- No expected files are listed in the work brief.
- No expected checks are listed in the work brief.
- No related state keys are listed in the work brief.
- No proof/evidence expectation is listed in the work brief; proof and evidence
  remain separate from approval.
- Skipped checks must be reported with concrete reasons; no per-check skipped
  expectation is listed in the work brief.

The card does not reconstruct missing Augnes runtime output, fabricate IDs, or
turn absent handoff fields into implied project facts.

## Authority Boundaries

The visible card boundary text includes:

- Work ID is a trace anchor, not committed state authority.
- This card is read-only.
- This card cannot execute Codex.
- This card cannot commit or reject Augnes state.
- This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge.
- Proof is not approval.
- A PR is not merge authority.
- Durable approval remains user/Core gated.

The widget renderer adds no form, button, or action affordance for execution,
approval, publication, retry, replay, external posting, state commit/reject,
proof recording, evidence recording, merge, or auto-merge.

## ChatGPT App Bridge Tools

The card is attached to `augnes_get_work_brief`, which remains a read-only work
read tool. Its annotations stay read-only, non-destructive, and open-world
because it reads the local Augnes runtime through the existing bridge adapter.

The card does not change existing bridge write tools:

- `augnes_observe`
- `augnes_record_action_result`
- `augnes_record_work_event`
- `augnes_generate_codex_handoff_draft`
- `augnes_review_codex_result_draft`

Those tools keep their existing boundaries. The Work Contract Card does not use
them and does not broaden them.

## Codex Handoff And Review

The card is a human-facing summary of the work contract. It can help a user or
reviewer see the work ID, expected checks, related state keys, proof links, and
authority limits before handing work to Codex or reviewing a Codex result.

It is not a handoff delivery mechanism and is not a result-review record. Codex
still performs repo work in its own session, reports changed files and checks,
and opens PRs through normal GitHub workflow without gaining merge authority.

## Closeout Preflight And Plugin Hooks

The card complements the closeout preflight helper and local plugin hooks by
making expectations visible earlier:

- `npm run codex:closeout-preflight` remains the deterministic PR closeout
  packet check.
- Plugin hooks remain local guardrails and do not become runtime authority.
- The card does not call closeout helpers, record proof, record evidence, or
  change hook behavior.

## How To Test

Run:

```bash
npm run typecheck
npm run smoke:chatgpt-work-contract-card
npm run smoke:augnes-operator-plugin-scaffold
npm run smoke:augnes-operator-plugin-hooks
npm run smoke:codex-mcp-augnes-bridge-docs
```

When a cheap app-level regression is appropriate, also run:

```bash
npm --prefix apps/augnes_apps run smoke
```

Run closeout preflight in advisory mode with PR-specific `CODEX_*` fields:

```bash
npm run codex:closeout-preflight
```

## PR 8 Boundary

Browser and computer-use verification remains PR 8. This runbook does not add a
browser/computer-use validation implementation, screenshot capture flow, report
template, or UI automation helper.

## Non-Goals And Forbidden Changes

This card does not add:

- direct Codex execution controls
- commit/reject controls
- approval, publication, retry, replay, external-posting, merge, or auto-merge
  controls
- runtime state mutation
- database/schema changes
- API route changes
- MCP/App tool schema authority expansion
- bridge write authority
- hooks
- MCP config
- plugin changes
- browser/computer-use runbook implementation
- dogfood episode helper implementation
- secret handling changes
- dependencies
- OpenAI calls
- GitHub calls from the widget or card code
- proof or evidence recording
- external publishing
- committed-state mutation
