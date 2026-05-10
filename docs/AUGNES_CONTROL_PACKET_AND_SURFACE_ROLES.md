# Augnes Control Packet and Surface Roles

This document defines the cross-surface control packet and surface role model.
The first read-only runtime API slice is now implemented as:

```text
GET /api/control/brief?scope=project:augnes
```

That API is a generated, derived, unstored view. It does not add approval flow,
publisher behavior, Cockpit write controls, ChatGPT App tools, proof recording,
or durable state authority.

## Motivation

Augnes now has several surfaces that can help a user or agent understand work:

- ChatGPT Apps
- Codex
- Cockpit
- GitHub
- Browser, ChatGPT Developer Mode, and MCP Inspector

Those surfaces need shared temporal continuity. A user should not have to
rebuild the project timeline from memory each time they move between ChatGPT,
Codex, Cockpit, GitHub, and verification tools.

The risk is that each surface could start keeping its own local truth. That
would make timelines conflict, blur approval boundaries, and turn previews or
summaries into accidental authority. Augnes should solve the continuity problem
without duplicating state authority.

The design principle is:

```text
Augnes Core is the source of truth and authority runtime.
Surfaces render bounded, derived views over Core state.
Control can appear across surfaces, but authority remains centralized and gated.
```

## Control Packet Concept

An Augnes Control Packet is a derived, bounded, source-of-truth-backed packet
that can be rendered differently by each surface.

The first implemented API version is `control_packet.v1`. It composes existing
runtime reads such as state brief, work items, coordination events, mailbox
summary, and publication summary. It must not create a second durable store,
event ledger, mailbox, publication ledger, proof record, or approval state.

A future packet could include fields such as:

```text
scope
as_of
current_phase
current_work_items
recent_completed_prs
active_open_loops
pending_user_decisions
active_risks
allowed_actions
forbidden_actions
required_verification
relevant_publication_state
relevant_delivery_state
relevant_mailbox_state
related_event_refs
authority_boundaries
next_suggested_goal
surface_rendering_hints
```

The packet should be bounded to the requested `scope` and `as_of` time. It
should point back to durable event, mailbox, publication, delivery, proof, or
work references when possible. It should not become a second event store,
publication ledger, mailbox, proof record, or commit/reject state.

Different surfaces can render the same packet differently:

- ChatGPT Apps can turn it into user-facing summaries and decision cards.
- Codex can turn it into task scope, verification, risk, and PR readiness
  context.
- Cockpit can turn it into timeline, gate, mailbox, publication, and delivery
  observability.
- Verification surfaces can use it as a checklist against observed behavior.

The important constraint is that every rendering remains a derived view over
Augnes Core state.

## Surface Roles

### ChatGPT Apps

ChatGPT Apps are the primary user-facing decision and control surface.

They are optimized for:

```text
What do I need to understand or decide?
```

They should present:

- natural-language summaries
- decision cards
- approval implications
- external side effects
- safe choices
- pending user decisions
- consequences of approving, delaying, or declining an action

ChatGPT Apps may collect user intent. Durable approval, publish, and state
authority are still validated and recorded by Augnes Core.

ChatGPT Apps must not silently publish, approve, commit or reject state,
execute Codex, record proof, merge GitHub PRs, mutate PR title/body/labels, or
turn a preview into an external side effect.

### Codex

Codex is the implementation and work-execution control surface.

It is optimized for:

```text
What changed, what passed, what is risky, and what is blocked?
```

It should expose:

- task scope
- changed files
- expected versus actual impact
- test matrix
- skipped checks and exact reasons
- authority-boundary checks
- blockers
- assumptions
- next suggested goal
- PR readiness evidence

Codex may implement, test, open a PR, and update a PR body through the normal
PR-centered workflow.

Codex must not merge, enable auto-merge, publish externally, record proof
without explicit instruction, commit or reject Augnes state, or override user
approval.

### Cockpit

Cockpit is the observability and agent coordination surface.

It is optimized for:

```text
Is the internal timeline, state, and event spine coherent?
```

It should show:

- event spine
- mailbox state
- handoff state
- publication state
- delivery state
- proof state
- gate state
- open loops and blocked work

Cockpit should remain legible to users, but it should not become the primary
user-facing decision surface when ChatGPT Apps can present the decision in
plain language.

Cockpit must not become hidden authority. Any future write controls must be
separately scoped, explicit, auditable, and Core-gated.

### Augnes Core

Augnes Core is the source of truth and durable authority runtime.

It owns:

- committed state
- proof records
- event spine
- mailbox
- publication drafts
- delivery ledger
- gate validation

Augnes Core validates all side-effectful actions, records durable outcomes, and
provides derived read-only packets for surfaces.

### GitHub

GitHub is the code history and external publication target.

It is not Augnes state authority. GitHub PRs, comments, commits, and reviews can
be referenced as evidence, but they do not replace Core state, proof, event, or
gate records.

GitHub comments are external side effects. They must be explicit, idempotent,
target-specific, and auditable.

### Developer Mode, MCP Inspector, and Browser

ChatGPT Developer Mode, MCP Inspector, Browser, and Chrome are verification
surfaces.

They are useful for validating ChatGPT App, Cockpit, bridge, widget, and local
runtime behavior. They are not authority surfaces and should not be treated as
Core state, proof, publication approval, or durable user decisions.

## Cross-Session Continuity

Each surface amplifies cross-session continuity in a different way:

- ChatGPT Apps restore user-facing decision context.
- Codex restores implementation, task, branch, check, and PR context.
- Cockpit restores system, event, mailbox, ledger, proof, and gate context.
- GitHub restores code history and PR discussion context.
- Browser, Developer Mode, and MCP Inspector restore verification context.

All of these surfaces should use the same Augnes Core state and event timeline.
No surface should invent its own durable source of truth.

## Control Versus Authority

Control can be surfaced in multiple places. Authority must remain centralized
and gated.

Use these principles when designing new controls:

- Preview is not approval.
- Approval is not publication.
- Dry-run is not publication.
- Publication is a single explicit external side effect.
- Replay must not create a second side effect.
- Summary views are not source of truth.
- User remains durable approval authority.
- Augnes Core remains durable state and gate authority.
- Read and summary access can be broad.
- Write access and external side effects must stay narrow and explicitly gated.

## Publication Workflow Example

The current GitHub PR comment adapter is the clearest example.

ChatGPT Apps should show user-friendly decision state and consequences:

- what would be published
- where it would be published
- whether approval is still pending
- what external side effect would occur
- what is safe to do next

Codex should show implementation, test, and PR evidence:

- files changed
- expected versus actual impact
- typecheck and app check results
- skipped checks and reasons
- idempotency proof when a live publish test is explicitly approved
- authority-boundary confirmations

Cockpit should show publication, delivery, and event timeline state:

- publication draft status
- delivery ledger status
- related event refs
- failure or success context
- open gates and pending decisions

Augnes Core should validate an approved publication before the external side
effect happens:

- approved publication status
- `dry_run=false`
- stored `target_ref`
- required `idempotency_key`
- fresh delivery row
- token availability
- explicit target approval

No surface should turn the PR #67 live test into general automatic posting
permission. PR #67 proved one approved, target-specific live GitHub PR comment
adapter test and an idempotent replay. It did not authorize future automatic
posting.

## Future Implementation Path

These are proposed future slices. PR A is implemented; later slices remain
future work unless separately approved:

- PR A: implement a read-only control packet API,
  `GET /api/control/brief?scope=project:augnes`. Status: implemented as
  `control_packet.v1`.
- PR B: add a ChatGPT App decision card for publication control, read-only
  first.
- PR C: add a Codex task-control packet or PR-readiness packet.
- PR D: refine Cockpit observability for gates and open loops.
- PR E: only then consider Core-gated approve/publish actions.

The recommended next product decision is whether to proceed to a user-facing
ChatGPT Apps decision-card design for publication control.
