# Augnes Improvement Proposals

Last updated: 2026-05-25
Source: `reports/dogfood/2026-05-25-codex-dogfood-run-001.md`

## Proposal 01: Dogfood Docs Recovery PR

Type: no-code cleanup
Review needed: docs, product judgment

Change:

- Add or restore the missing dogfood docs requested by the dogfood goal.
- If the docs were superseded, add replacement files or an index that maps old names to current canonical docs.
- Include a short "how to run a dogfood report" section with allowed output paths.

Acceptance checks:

- `rg --files docs | rg 'AUGNES_DOGFOODING|RAW_EPISODE_CAPTURE|DOGFOODING_EPISODE_LOG|DOGFOODING_EVALUATION_CRITERIA'` finds the required docs or explicit replacements.
- A new evaluator can start from README plus docs index and identify the dogfood rubric without external memory.

## Proposal 02: Shell-Safe Docs Sweep

Type: no-code cleanup
Review needed: docs

Change:

- Quote every documented URL with query strings.
- Prefer examples like:

```bash
curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq .
```

Acceptance checks:

- Commands copy-paste under zsh and bash.
- README, runbook, handoff packet, and helper output examples are covered.

## Proposal 03: Codex Helper Script Consistency

Type: small implementation PR
Review needed: engineering, docs

Change:

- Add root script alias for `codex:handoff-check`, or change workflow docs to app-prefix command.
- Add smoke coverage that all root helper names mentioned in `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` exist in root `package.json`.

Acceptance checks:

- `npm run codex:handoff-check` behavior is either available or no longer documented.
- `npm run smoke:codex-session-adapter-v2` catches helper/docs mismatch.

## Proposal 04: Proof-vs-State Boundary Review

Type: product/design decision before implementation
Review needed: product judgment, security, engineering

Question:

- Should `codex:record-completion` and `codex:handoff-check` create committed `external.*` state keys, or should proof remain in action/work/evidence records only?

Potential outcomes:

- Keep current behavior and update docs to say proof recording also creates an external state transition.
- Move proof-only closeout to action/work/evidence records and reserve committed state for user/runtime state changes.
- Rename helpers so commands that write state are visibly not "check only."

Acceptance checks:

- Authority Matrix and Session Adapter docs match actual helper behavior.
- Evidence Pack continues to show proof and gaps without implying approval/readiness.

## Proposal 05: Bridge Health And Cockpit Bridge Status

Type: small implementation PR
Review needed: product judgment, design, engineering, security

Change:

- Extend `/healthz` or add a read-only status endpoint with:
  - public profile status
  - bridge env enabled/disabled
  - bridge tools registered yes/no
  - Augnes runtime reachable yes/no
  - no secrets or token-derived details

Acceptance checks:

- With `AUGNES_ENABLE_AGENT_BRIDGE=true`, operator can confirm bridge mode without MCP Inspector.
- With bridge env unset, public directory-safe mode remains clear.
- No write authority is added.

## Proposal 06: Authority Negative Regression Suite

Type: browser/API regression suite
Review needed: security, engineering

Change:

- Add local tests for:
  - disabled legacy publish route returns 410 with boundaries
  - approval route rejects publish/retry/proof override fields
  - unknown session bind returns 404 and creates no session
  - invalid local tool names are rejected
  - no publish/merge/retry controls appear in Cockpit Bridge/Perspective/Operator

Acceptance checks:

- Suite runs without secrets, GitHub tokens, OpenAI key, or tunnel.
- Suite asserts protected rows are not mutated for rejected negative tests.

## Proposal 07: Browser Cockpit Regression Suite

Type: browser/computer-use regression suite
Review needed: design, engineering

Change:

- Automate local browser checks for:
  - Overview page loads
  - five tabs present
  - Work Focus shows trace spine and current work ID
  - Perspective loads Temporal Interpretation Preview
  - Operator loads Evidence Pack
  - Operator loads Session Trace
  - Bridge shows blocked commit/Codex/GitHub mutation authority
  - no publish/merge/retry controls appear outside future explicitly scoped write-control work

Acceptance checks:

- Runs against temp DB.
- Does not commit screenshots by default.
- Captures textual DOM anchors for review.
