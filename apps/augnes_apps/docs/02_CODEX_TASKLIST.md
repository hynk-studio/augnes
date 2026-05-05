# Codex tasklist

## Sprint 1 — make it real

### Task 1
Wire the mock adapter interface to real Augnes Core read endpoints.

Deliverables:
- `src/adapters/http-core.ts`
- typed endpoint contracts
- fixture-backed tests

### Task 2
Upgrade the widget from raw JSON rendering to panel-specific views.

Deliverables:
- casefile card
- rationale card
- boundary packet card
- continuity card
- repo navigation card
- audit card

### Task 3
Make the app robust in developer mode.

Deliverables:
- health check route
- ngrok / tunnel docs verified
- error states in widget
- connector refresh instructions in README

## Sprint 2 — make the value legible

### Task 4
Improve strategy rationale surface.

Requirements:
- show recommended action
- show why list
- show meta-wm summary
- show expected vs observed delta when present
- never imply that rationale equals evidence

### Task 5
Improve boundary packet surface.

Requirements:
- highlight carry-forward stage
- separate trace capsule candidates
- show revision operators
- show lineage notes

### Task 6
Improve continuity panel.

Requirements:
- baseline class
- identity goal
- hard invariants
- latest boundary
- canary status
- fail axis
- transition retention scenarios

## Sprint 3 — submission hardening

### Task 7
Add automated checks that fail if a public tool returns:
- session ids
- trace ids
- auth ids
- raw prompt text
- secrets / tokens
- narrator text promoted as evidence

### Task 8
Verify review-safe metadata.

Requirements:
- all tool hints set
- widget domain set
- CSP set
- no frameDomains unless truly necessary
- no writes in public profile

### Task 9
Prepare mobile-safe review run.

Requirements:
- test cases pass on web and mobile
- widget remains useful even if rich UI partially fails
- text output still stands on its own
