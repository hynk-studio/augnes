# Perspective Formation Switch Overlay v0.1

This is a Formation Basis switch overlay UX slice for the Perspective Observatory. It defines how local Formation Basis clicks ask for confirmation, when a recent cached-local acknowledgement may skip OK, and why future bases remain explanation-only.

## Local Switch Candidates

Current and Manual Selection are local/free switch candidates.

- Current returns the starmap to the current local PerspectiveUnitPreview / FormationReceiptV0 basis.
- Manual Selection reframes the local preview around selected graph material when a selected node is available through existing PerspectiveUnitPreview mechanics.

Both switches remain local preview behavior. They make no API call, cost nothing, create no persistence, create no graph DB writes, and do not grant execution authority.

## Future Bases

Historical Snapshot / Auto Proposal / Experimental remain future/explanation-only.

- Historical Snapshot is future archive behavior only. Event Rail archive cards are available, but no frozen snapshot persistence or delta view is implemented.
- Auto Proposal is future behavior only. No provider, model, API call, API billing, proposal generation, graph rearrangement, or persistence occurs.
- Experimental internals remain unexposed. No public experimental basis, rearrangement, API call, or persistence occurs.

Future bases use explanation-only overlay copy and do not show Apply View.

## Cached-local acknowledgement policy

The browser-local acknowledgement key is:

`augnes.perspective.formationSwitchAcknowledgement.v0_1`

The acknowledgement stores metadata only:

- basis
- basisVersion
- sourceQuery
- constellationId
- formationId
- contextFingerprint
- costTier: free_local
- externalCalls: false
- apiBillable: false
- persistence: false
- acknowledgedAt
- expiresAt

The acknowledgement TTL is 24 hours. A cached acknowledgement is valid only when basis, basis version, source query, constellation id, formation id, context fingerprint, free/local cost tier, false external-call flag, false billable flag, false persistence flag, and unexpired expiresAt all match.

The context fingerprint is a deterministic safe metadata string built from Formation Basis label, basis version, target basis, target scope, source query, constellation id, generated_at, node count, edge count, and selected node id where relevant.

## What Must Never Be Stored

- No raw graph.
- No raw pasted text.
- No source text.
- No packet text.
- No prompt text.
- No model output.
- No private history.
- No source payloads or generated content.

Manual Gravity local draft storage remains separate. Manual Gravity preview marks are local preview metadata and are not durable FormationReceiptV0 authority.

## Authority Boundaries

- No API route.
- No DB schema change.
- No persistence beyond safe browser-local acknowledgement metadata.
- No graph DB.
- No proof/evidence/readiness writes.
- No provider/model/API call.
- No API billing.
- No GitHub mutation.
- No Codex execution.
- No Auto Proposal generation.
- No Rulecraft exposure.
- No historical snapshot persistence.
- No delta engine.

Formation Basis, Lens, and Scope remain conceptually separate. Formation Basis explains how the local preview basis is formed; Lens controls inspection; Scope controls selected graph material.

## Validation

- `npm run typecheck`
- `npm run smoke:perspective-ingest-constellation-preview`
- `npm run smoke:perspective-capsule-contract`
- `npm run smoke:cockpit-perspective-ia`
- `npm run smoke:cockpit-perspective-evidence-handoff-snapshot`
- `npm run smoke:cockpit-perspective-observatory-layout`
- `npm run smoke:cockpit-perspective-event-rail-entry-cards`
- `npm run smoke:cockpit-perspective-formation-switch-overlay`
- `git diff --check`
