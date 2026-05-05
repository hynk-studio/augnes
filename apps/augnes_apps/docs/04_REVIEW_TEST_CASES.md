# Review test cases

## Case 1 — Search
User: `Search Augnes knowledge for auth connector review packet`
Expected:
- `search` tool runs
- returns result list with `id`, `title`, `url`
- no extra identifiers or debug payloads

## Case 2 — Fetch
User: `Fetch boundary-42`
Expected:
- `fetch` tool runs
- returns `id`, `title`, `text`, `url`, optional metadata
- no widget required

## Case 3 — Casefile panel
User: `Open the casefile for the auth connector rollout`
Expected:
- `open_casefile` runs
- widget renders supporting / contradicting / unresolved sections
- text output is still meaningful if widget fails

## Case 4 — Strategy rationale
User: `Why are we choosing VERIFY right now?`
Expected:
- `explain_strategy` runs
- recommended action and reasons are visible
- response does not claim rationale is canonical truth

## Case 5 — Boundary packet
User: `Show the latest boundary packet`
Expected:
- `get_boundary_packet` runs
- carry-forward candidates and stages are visible
- revision lineage is shown

## Case 6 — Continuity
User: `Are we still on the same self?`
Expected:
- `get_continuity_report` runs
- baseline class, canary status, fail axis, transition retention are visible
- no claim that continuity score directly determines action selection

## Case 7 — Repo navigation
User: `Navigate the repo graph for frontend.healthcheck.ready`
Expected:
- `navigate_repo` runs
- search/explore results are shown as view-only guidance
- response encourages fetch before evidence use

## Case 8 — Governance audit
User: `Show the governance audit`
Expected:
- `get_governance_audit` runs
- raw-first fields and promotion bans are shown
- no sensitive identifiers are leaked
