# Cockpit MVP UI Polish Plan

This plan sequences the Cockpit MVP polish work after GitHub App/token
management v0.1 closeout. It keeps product UI polish separate from future
authority-expanding work.

## Step 1: Six-Tab Functional Map And Wireframe Spec

Status: complete in PR #142. Original scope label: This PR.

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

Status: complete in PR #143. Original scope label: This PR.

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

Status: complete in PR #144.

Tighten the implemented shell for demo readability and close the Cockpit MVP UI
polish line.

Completed scope:

- spacing, density, typography, and responsive polish
- screenshot verification for desktop and narrow widths
- demo script alignment
- review checklist closeout against the functional map
- evidence notes for any deferred visual reference details
- text-only `AUGNES` identity preserved
- no backend routes, DB schema, migrations, dependencies, C5 semantics,
  GitHub App/token behavior, ChatGPT App tools, or external control buttons
  added

Outcome:

- Cockpit MVP has a demo-ready six-tab shell:
  Overview -> Work -> Ledger -> Proof -> Bridge -> Operator.
- Future Cockpit work is now a separate productization phase, not a continuation
  of this visual polish line.

## Step 3.5: Visual Tone Refresh

Status: complete in PR #145.

Soften the completed six-tab shell without changing layout, authority, runtime
behavior, or controls.

Completed scope:

- subtle pale green page background
- white or near-white card surfaces with green-gray borders
- system font stack only, with no remote fonts or font files
- lighter typography where labels and helper text were visually loud
- before/after browser screenshot review across all six tabs
- smoke coverage for the visual tone contract

Out of scope:

- backend routes, DB schema, migrations, dependencies, and runtime behavior
- graphic logo artwork, SVG/image logo assets, or imported logo files
- publish, merge, retry, GitHub-token, live-exchange, backup, or Execute Codex
  controls
- C5 gate semantics, GitHub App/token behavior, ChatGPT App tools,
  RawEpisodeBundle runtime, or PerspectiveSnapshot runtime

## Step 4 Future: Core-Gated Write-Control Design

Separate productization phase.

This phase may design future write controls only after explicit user/PM
approval and Core-gated route review. It must not be bundled into the six-tab
shell implementation.

Possible future topics:

- approve/publish/retry control design
- live publish controls
- exact Core route ownership
- explicit target approval packets
- idempotency and replay UX
- audit and evidence presentation
- GitHub App provider integration

## Step 5 Future: RawEpisodeBundle Runtime

Separate research/runtime phase.

This phase must remain separate from Cockpit UI polish. It may explore future
runtime capture, persistence, and interpretation foundations only after a
dedicated scope decision.

## Future Work Not Included In The MVP Polish Line

The following remain explicitly out of scope for the completed Cockpit MVP UI
polish line:

- Core-gated write-control design
- live publish controls
- GitHub App provider integration
- RawEpisodeBundle runtime
- PerspectiveSnapshot runtime

None of these are included in the final visual polish/demo readiness closeout.
