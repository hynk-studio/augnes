# Perspective Overlay Focus and Agent Semantics v0.1

Status: implementation-hardening slice for Perspective Observatory only.

This slice hardens the existing Formation Basis switch overlay and adds stable, safe semantic hooks to the existing Perspective Observatory. It is not a feature expansion, not a capability launch, and not a new persistent surface.

## Purpose

Make the existing Perspective Formation Basis switch overlay safer for keyboard users, screen readers, browser automation, and AI/computer-use agents while preserving the current starmap-first visual layout.

The overlay remains temporary. The rest of the Observatory remains visually unchanged: Perspective Observatory, Current Perspective Starmap, Observatory Controls, Formation Basis, Lens, Scope, Source, Event Rail, and the Event Rail entry card keep their existing reading order and product meaning.

## Keyboard and Focus Behavior

- Opening a Formation Basis overlay moves focus into the dialog, starting on Cancel or Close.
- Escape closes the open overlay.
- Tab and Shift+Tab stay contained inside the overlay while it is open.
- Closing the overlay returns focus to the Formation Basis control that opened it.
- Apply View remains available only for local switch overlays.
- Cancel, Close, and Apply View keep their existing product behavior.
- Cached local acknowledgement behavior remains metadata-only and still works for repeat Current or Manual Selection switches.

## Human and Screen Reader Semantics

The overlay keeps `role="dialog"` and `aria-modal="true"`.

The overlay now has stable title and description relationships through:

- `aria-labelledby="perspective-formation-switch-overlay-title"`
- `aria-describedby="perspective-formation-switch-overlay-description"`
- `aria-label="Formation Basis switch overlay"` for local switches
- `aria-label="Formation Basis future explanation"` for future-only explanations

The dialog description includes screen-reader-only authority language that says the surface is local-only, free, and does not call APIs, persist data, bill usage, or execute Codex. This adds accessibility context without adding visible UI clutter.

## AI and Computer-Use Semantics

The Perspective Observatory exposes stable `data-augnes-*` hooks for safe landmarking:

- `data-augnes-surface="perspective-observatory"`
- `data-augnes-region="formation-identity"`
- `data-augnes-region="observatory-controls"`
- `data-augnes-region="formation-basis-controls"`
- `data-augnes-region="lens-controls"`
- `data-augnes-region="scope-controls"`
- `data-augnes-region="source-summary"`
- `data-augnes-region="starmap"`
- `data-augnes-region="inspector"`
- `data-augnes-region="event-rail"`
- `data-augnes-region="temporal-entry-card"`
- `data-augnes-region="formation-switch-overlay"`

Controls expose safe categorical identifiers only:

- `data-augnes-control="formation-basis"`
- `data-augnes-basis`
- `data-augnes-control="lens"`
- `data-augnes-lens`
- `data-augnes-control="scope"`
- `data-augnes-scope`

These attributes are for navigation, QA, and agent-readable semantics. They are not authority grants and are not a data export mechanism.

## Authority Boundaries

The Observatory and Formation Basis overlay expose explicit authority attributes:

- `data-augnes-authority="read-only local-only preview-only"`
- `data-augnes-external-calls="false"`
- `data-augnes-api-billable="false"`
- `data-augnes-persistence="false"`
- `data-augnes-codex-execution="false"`

This slice adds no API route, no DB schema, no migration, no graph DB, no persistence, no proof/evidence/readiness write, no Codex execution, no GitHub mutation, no provider or model selection, no API billing path, no Auto Proposal execution, no Rulecraft exposure, no historical snapshot persistence, and no delta engine.

## Forbidden Attribute Content

The semantic hooks must remain safe identifiers only.

They must not include:

- Raw graph data
- Raw source text
- Pasted text
- Packet text
- Prompt text
- Model output
- Private history
- Generated hidden JSON
- Formation receipts or evidence payloads
- Provider, model, token, or API key material

No raw graph/source/prompt/model/private/generated content is stored in attributes, localStorage, hidden fields, or hidden JSON dumps by this slice.

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
- `git diff --check`

Browser validation should use a temp SQLite DB and check default Observatory rendering, overlay open and close behavior, Escape, Cancel, Apply View, Close, Tab and Shift+Tab focus containment, focus return, cached acknowledgement behavior, safe DOM attributes, console cleanliness, local-only traffic, and 390px mobile overflow.
