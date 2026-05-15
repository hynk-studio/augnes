# Cockpit MVP UI Polish Plan

This plan sequences the Cockpit MVP polish work after GitHub App/token
management v0.1 closeout. It keeps product UI polish separate from future
authority-expanding work.

## Step 1: Six-Tab Functional Map And Wireframe Spec

This PR.

Deliverable:

- `docs/COCKPIT_SIX_TAB_MVP_FUNCTIONAL_MAP.md`
- smoke coverage for the six-tab documentation contract
- no runtime UI implementation
- no backend routes
- no DB schema or migrations
- no dependency changes

Outcome:

- Codex can implement the future six-tab Cockpit shell from a stable repo
  contract.
- The current Cockpit components have an explicit future tab placement.
- Visual references are treated as visual direction, not backend authority.

## Step 2: Six-Tab Cockpit Shell Implementation From References

This PR.

Implement the Cockpit shell from the six reference images and the functional
map.

Expected scope:

- top shell with text-only `AUGNES` identity
- six-tab navigation in the approved order
- Overview, Work, Ledger, Proof, Bridge, and Operator views
- existing components moved or compacted according to the functional map
- existing safe controls preserved only in approved tabs
- screenshot/demo readability pass

Out of scope:

- new backend routes
- DB schema or migrations
- publish, merge, retry, token, live-exchange, or execute-Codex controls
- C5 gate changes
- GitHub App/token behavior changes
- new ChatGPT App tools

## Step 3: Fine Visual Polish / Screenshot / Demo Readiness Closeout

Tighten the implemented shell for demo readability.

Expected scope:

- spacing, density, typography, and responsive polish
- screenshot verification for desktop and narrow widths
- demo script alignment
- review checklist closeout against the functional map
- evidence notes for any deferred visual reference details

## Step 4 Future: Core-Gated Write-Control Design

Separate productization phase.

This phase may design future write controls only after explicit user/PM
approval and Core-gated route review. It must not be bundled into the six-tab
shell implementation.

Possible future topics:

- approve/publish/retry control design
- exact Core route ownership
- explicit target approval packets
- idempotency and replay UX
- audit and evidence presentation

## Step 5 Future: RawEpisodeBundle Runtime

Separate research/runtime phase.

This phase must remain separate from Cockpit UI polish. It may explore future
runtime capture, persistence, and interpretation foundations only after a
dedicated scope decision.
