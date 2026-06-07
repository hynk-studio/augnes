# Perspective Handoff Packet Copy-to-Agent Dogfood v0.1

Status: dogfood/report slice for the existing Perspective Handoff Packet.

This slice evaluates whether copied Perspective Handoff Packets are useful for humans and AI agents. It does not add a new capability, authority model, execution path, or UI panel.

## Purpose

Dogfood the existing copy-to-agent flow from the Perspective Observatory and check whether the packet is clear enough to hand to ChatGPT, Codex, or a future AI worker as reviewed local context.

The dogfood checks:

- packet clarity
- stable section order
- Evidence / Tensions / Next separation
- target-specific Purpose and Suggested Use
- Compact Authority appearing once
- Base Packet Text length and duplication risk
- human readability
- AI-agent readability
- anti-bureaucracy behavior

## Scope

The evaluated surface is the existing `Preview Handoff Packet` details disclosure in the Perspective Observatory.

Inspected packet variants:

- Whole Constellation / ChatGPT Review
- Whole Constellation / Codex Handoff
- Manual Selection / ChatGPT Review
- Manual Selection / Codex Handoff
- Cluster / ChatGPT Review
- Cluster / Codex Handoff

The sample source is `sample:chatgpt`.

## Boundaries

No external AI calls are made. The dogfood pass copies or inspects local packet text only.

This slice adds:

- dogfood report
- browser validation report
- smoke coverage
- package script registration

This slice adds no new API route, DB schema, migration, persistence, graph DB, proof/evidence/readiness write, Codex execution, GitHub mutation, provider/model/API call, API billing path, Auto Proposal generation, Rulecraft exposure, historical snapshot persistence, delta engine, visible Observatory panel, always-visible packet panel, hidden JSON dump, or raw graph/source/prompt/model/private payload.

## Dogfood Result

Verdict: Good as-is.

The copied packet shape is useful without adding new visible warnings. The top-level sections are stable, the target-specific Purpose and Suggested Use are clear, Evidence/Tensions/Next remain separate, and Compact Authority appears once. Base Packet Text adds length and repeats some older boundary material, but it sits after the compact wrapper and does not bury the usable packet brief.

Recommendation: no code change in this slice. Revisit Base Packet Text only if future packet sources grow large enough to obscure the first seven sections.

## Validation

Required checks:

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-capsule-contract`
- `npm run smoke:cockpit-perspective-ia`
- `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- `npm run smoke:cockpit-perspective-observatory-layout`
- `npm run smoke:cockpit-perspective-event-rail-entry-cards`
- `npm run smoke:cockpit-perspective-formation-switch-overlay`
- `npm run smoke:cockpit-perspective-scope-handler-cleanup`
- `npm run smoke:cockpit-perspective-overlay-focus-agent-semantics`
- `npm run smoke:perspective-handoff-packet-structure-review`
- `npm run smoke:perspective-handoff-packet-copy-to-agent-dogfood`
- `git diff --check`
