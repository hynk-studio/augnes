# Perspective Event Rail Node-Edge v0.1

This slice refactors the Perspective Event Rail into a node-edge temporal view. It keeps the existing temporal entry ids, preserves the compact authority copy from PR #444, and does not change Event Rail authority.

## Model

Stable node ids:

- `session`
- `decision`
- `handoff`
- `pr`
- `review`
- `closeout`
- `current_view`
- `next_perspective`

Temporal roles:

- Archive nodes are reference-only past context.
- Present nodes are active local preview context.
- Future nodes are advisory candidate context.

Expected graph:

- `session_to_decision` uses `informs`
- `decision_to_handoff` uses `packages`
- `handoff_to_review` uses `reviews`
- `handoff_to_pr_ref` uses `refs`
- `review_to_closeout` uses `closes`
- `closeout_to_current` uses `forms`
- `current_to_next` uses `suggests`

The archive flow is Session -> Decision -> Handoff -> Review -> Closeout. The PR node is a side/reference node connected from Handoff. Current View is the present node formed from the archive flow. Next Perspective is the future node suggested by Current View.

## Stable Hooks

- `data-augnes-region="event-rail"`
- `data-augnes-event-rail-view="node-edge"`
- `data-augnes-rail-node-id`
- `data-augnes-rail-node-role`
- `data-augnes-rail-edge-id`
- `data-augnes-rail-edge-type`
- `data-augnes-rail-authority`

## Scope Boundary

This PR is Event Rail node-edge only. It does not humanize Product node labels, add API routes, edit DB or migrations, add persistence, add graph DB behavior, call providers/models/APIs, call GitHub, execute Codex, write proof/evidence/readiness state, create Auto Proposal behavior, add historical snapshot persistence, or add a delta engine.

Details remain disclosure-gated. The compact authority capsule from PR #444 remains the primary repeated-authority-copy cleanup.

## Validation

Run:

```bash
npm run smoke:cockpit-perspective-event-rail-node-edge
```
