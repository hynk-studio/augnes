# Post-#868 Development Posture

## Status

- short posture / guardrail note
- not a roadmap
- not SSOT
- not PR sequencing authority

## Baseline

PR #868 is the web baseline.

The fixed web route model is:

```text
/ = public Augnes surface
/perspective = Perspective detail
/workbench = cockpit/workbench
```

Web UI / public surface work is frozen unless explicitly reopened by the
operator.

## Current Posture

Current posture is Core first, Handoff first, Conversation first, Web last.

The old v0.2.1 FULL roadmap is historical / compatibility reference only.

This posture doc is not a roadmap, not SSOT, and not PR sequencing authority.

New slices must come from explicit operator task prompts, not from mining old
or new roadmap docs.

Codex must not infer new work from roadmap tables.

Codex must not start UI, route, DB, provider, retrieval, product-write, GitHub
actuation, or release work unless the operator explicitly asks for that slice.

## Boundary

This note does not authorize UI changes, route changes, API changes, DB changes,
provider/OpenAI calls, retrieval changes, proof/evidence writes, promotion
execution, Formation Receipt writes, durable Perspective state apply,
product-write, GitHub actuation, release, or publish work.
