# Dogfood AI Surface Episode Capture v0.1

## Purpose

This is PR 9 in the canonical Codex Agent Harness roadmap. It adds capture
infrastructure for ChatGPT -> Codex -> PR -> ChatGPT review -> user merge
workflows.

Dogfood episode capture preserves raw anchors before summaries so later review
can inspect the actual request, handoff, Codex prompt, PR, command output,
checks, skipped reasons, review findings, and user decision context.

Dogfood notes are research and evaluation material unless Augnes Core
separately records a durable decision. They are not committed state, approval,
proof, evidence, proposal scoring, Gate/SRF input, or merge authority.

This PR does not run an actual dogfood episode. It creates the template,
helper, smoke test, and documentation needed to capture future episodes.

## Files

- `docs/templates/dogfood-ai-surface-episode.md`
- `scripts/create-dogfood-episode.mjs`
- `scripts/smoke-dogfood-episode-template.mjs`
- `docs/DOGFOOD_AI_SURFACE_EPISODE_CAPTURE_V0_1.md`
- `package.json`

Generated episode files live under:

```text
reports/dogfood/
```

No generated episode file is committed by this PR.

## Raw Anchors Before Summaries

Raw anchors are exact excerpts or stable references to what happened before the
episode is summarized. Preserve them first, then write review summaries.

Paste exact excerpts when available for:

- original user task request
- ChatGPT planning prompt or handoff prompt
- Codex prompt
- PR title, body, and link
- commands run and command output
- failed checks, partial checks, and skipped checks
- ChatGPT review findings
- user merge or approval decision

Summaries are review aids, not replacements for raw anchors. Missing anchors
must be recorded as gaps with concrete reasons instead of being reconstructed.

## Helper Usage

Run a dry run first:

```bash
npm run dogfood:create-episode -- --dry-run --run-id pr9-smoke --title "PR 9 dogfood capture" --pr 266 --outcome skipped
```

Create an episode file:

```bash
npm run dogfood:create-episode -- --run-id pr9-review --title "PR 9 dogfood capture" --pr 266 --outcome completed
```

The helper writes:

```text
reports/dogfood/YYYY-MM-DD-<slug>.md
```

It creates `reports/dogfood/` when needed, uses
`docs/templates/dogfood-ai-surface-episode.md` as the source, fills basic
metadata fields, prints a JSON result, and refuses path-like run IDs.

## Environment Variables

The helper accepts:

- `DOGFOOD_RUN_ID`
- `DOGFOOD_TITLE`
- `DOGFOOD_WORK_ID`
- `DOGFOOD_HANDOFF_ID`
- `DOGFOOD_SESSION_ID`
- `DOGFOOD_PR`
- `DOGFOOD_OUTCOME`

Example:

```bash
DOGFOOD_RUN_ID=pr9-review \
DOGFOOD_TITLE="PR 9 dogfood capture" \
DOGFOOD_PR=266 \
DOGFOOD_OUTCOME=completed \
npm run dogfood:create-episode
```

## CLI Arguments

The helper accepts:

- `--run-id`
- `--title`
- `--work-id`
- `--handoff-id`
- `--session-id`
- `--pr`
- `--outcome`
- `--dry-run`
- `--help`

CLI arguments override environment variables.

## What To Paste Into Raw Anchor Sections

Use the template raw-anchor sections for exact source material:

- `User Request Raw Anchor`: paste the exact task request.
- `ChatGPT Planning Prompt Raw Anchor`: paste the planning, handoff, or review
  prompt ChatGPT used.
- `Codex Prompt Raw Anchor`: paste the exact Codex task prompt or handoff.
- `Commands Run`: paste exact command output excerpts, especially failures and
  closeout preflight output.
- `PR Link`: paste the PR link plus exact title/body excerpts when relevant.

Do not paste secrets, tokens, private keys, local `.env` values, tunnel
credentials, or hidden provider/debug identifiers.

## Skipped Checks And Gaps

Skipped checks must include a check name and concrete reason, for example:

- `browser verification skipped: docs-only change with no rendered UI`
- `proof recording skipped: missing CODEX_WORK_ID`
- `evidence recording skipped: local runtime unavailable`
- `ChatGPT review skipped: no review prompt available`
- `user merge decision unknown: PR not merged at capture time`

Gaps should explain what is missing, why it matters if known, and whether the
gap affected handoff, review, or next-goal selection.

## PRs And IDs

Reference PRs, evidence IDs, action IDs, work events, and session IDs only when
they exist. Do not fabricate IDs.

- PR refs identify GitHub review artifacts. A PR is not merge authority.
- Evidence IDs exist only when an evidence helper or route returns an ID.
- Proof/action IDs exist only when proof/action recording succeeds.
- Work event IDs exist only when work-event recording succeeds.
- Session IDs are trace anchors and not durable approval.

Dogfood notes may link or mention those refs, but the notes do not create them
or convert them into committed Augnes state.

## Relationship To AGENTS.md

`AGENTS.md` is the root Codex operating contract. This capture workflow follows
its rules: read task-relevant docs, keep changes scoped, report skipped checks,
prefer proof-only closeout only when prerequisites exist, and never claim
approval, publication, merge, or commit/reject authority.

## Relationship To ChatGPT / Codex / Augnes Review Protocol

`docs/CHATGPT_CODEX_AUGNES_REVIEW_PROTOCOL_V0_1.md` defines the loop that this
template captures: ChatGPT drafts or reviews, Augnes keeps state/proof/evidence
lanes distinct, Codex implements and opens a PR, ChatGPT reviews the PR result,
and the user decides whether to merge or make Core-gated durable approvals.

The episode template records expected-vs-actual scope, checks, skipped reasons,
Codex result summary, ChatGPT review findings, and user merge/approval
decision without turning any of those notes into durable state.

## Relationship To Codex Closeout Preflight

`npm run codex:closeout-preflight` is a deterministic closeout packet check.
Episode captures should paste or summarize its output in the `Tests And
Verification` section when it is run.

Closeout preflight is a review aid. It does not call the Augnes runtime, record
proof, record evidence, approve, publish, merge, or mutate state.

## Relationship To Browser / Computer-Use Verification Runbook

`docs/AUGNES_BROWSER_COMPUTER_USE_VERIFICATION_RUNBOOK_V0_1.md` defines how to
inspect UI/operator surfaces. Episode captures should include browser report
refs when browser/computer-use verification is relevant, or a concrete skipped
reason when it is not.

Browser/computer-use verification is observation only. It is not durable
approval, proof recording, evidence recording, publication, merge, or
commit/reject authority.

## Relationship To Augnes Operator Plugin And Hooks

The `augnes-operator` plugin and hooks provide local Codex workflow guardrails.
This PR does not change plugin metadata, plugin MCP config, app mappings, or
hooks. The episode helper is a separate local file-creation helper for future
research notes.

## Relationship To Authority Matrix

`docs/AUTHORITY_MATRIX.md` defines the authority model this capture preserves:

- ChatGPT can draft and review, but does not execute Codex.
- Codex can edit files and open PRs, but does not merge or commit/reject
  Augnes state.
- GitHub PRs are code review artifacts, not durable Augnes approval.
- Browser/computer-use inspection is observation, not authority.
- Durable approval remains user/Core gated.

Proof is not approval. A PR is not merge authority.

## Relationship To Augnes Dogfooding Research Direction

`docs/AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md` says dogfooding records
should include successful, negative, partial, and failed cases and should
preserve raw episode anchors before summaries. This PR9 template and helper are
Track B capture infrastructure for that research direction.

The resulting notes remain research/evaluation material, not proof, readiness
evidence, proposal scores, Gate/SRF inputs, or commit/reject inputs.

## Authority Boundaries

Dogfood episode capture does not:

- create committed Augnes state
- create pending proposals
- create evidence rows
- create proof/action records
- create work events
- create session records
- approve, publish, retry, replay, externally post, merge, or enable
  auto-merge
- commit or reject Augnes state
- execute Codex from ChatGPT
- call OpenAI
- call GitHub
- call the Augnes runtime
- call network resources

Dogfood notes are evaluation material, not committed state. Proof is not
approval. PR is not merge authority. Durable approval remains user/Core gated.
No ChatGPT direct Codex execution authority is created. No Codex commit/reject
or merge authority is created.

## Non-Goals And Forbidden Changes

This PR does not add:

- runtime behavior changes
- database or schema changes
- API route changes
- MCP/App tool schema changes
- active MCP config
- plugin MCP config
- app mappings
- hooks
- ChatGPT App UI/operator card implementation
- browser automation implementation
- screenshot capture implementation
- screenshot artifacts
- secret handling changes
- dependencies
- OpenAI calls
- GitHub calls
- Augnes runtime calls
- evidence recording
- proof recording
- external publishing
- committed-state mutation
- auto-merge
- merge authority changes

The helper creates local Markdown files only when explicitly run. This PR does
not commit any generated dogfood episode file.
