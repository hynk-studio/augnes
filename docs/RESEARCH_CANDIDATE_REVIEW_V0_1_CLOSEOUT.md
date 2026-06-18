# Research Candidate Review v0.1 Closeout

## Purpose

This document closes the Research Candidate Review v0.1 preview milestone before
any runtime or durable storage lane.

This is a closeout summary, not a new source of authority. It summarizes the
existing preview chain, does not add runtime behavior or durable state, and
prepares the next implementation lane.

## Milestone Summary

- Research inputs stay candidate-only before durable perspective mutation.
- The preview chain covers the docs contract, type contract, canonical
  promotion gates, Cockpit static preview, manual parser, parser output
  preview, Candidate Constellation Overlay, AI Context Packet, and Formation
  Receipt preview.
- Every stage is read-only or preview-only.
- Current outputs are non-authoritative local static preview artifacts.
- Source provenance, review status, epistemic status, canonical gate reminders,
  candidate graph context, handoff packet summaries, and receipt contributions
  are inspectable without committing state.
- The chain is ready for a bounded runtime/manual input preview lane.

## Completed Preview Chain

1. Research Candidate Review Surface
   - `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`
   - `fixtures/research-candidate-review.sample.v0.1.json`
   - `scripts/smoke-research-candidate-review-surface-v0-1.mjs`
   - `npm run smoke:research-candidate-review-surface-v0-1`

2. Type-only Research Candidate Review contract
   - `types/research-candidate-review.ts`
   - `scripts/smoke-research-candidate-review-types-v0-1.mjs`
   - `npm run smoke:research-candidate-review-types-v0-1`

3. Canonical promotion gates
   - `docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md`
   - `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`
   - `scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs`
   - `npm run smoke:research-candidate-canonical-promotion-gates-v0-1`

4. Cockpit/Perspective static fixture preview
   - `components/augnes-cockpit.tsx`
   - `scripts/smoke-research-candidate-review-cockpit-preview-v0-1.mjs`
   - `npm run smoke:research-candidate-review-cockpit-preview-v0-1`

5. Manual pasted note parser preview
   - `lib/research-candidate-review/manual-note-parser.ts`
   - `fixtures/research-candidate-review.manual-note.sample.v0.1.txt`
   - `fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json`
   - `scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs`
   - `npm run smoke:research-candidate-review-manual-parser-v0-1`

6. Parser output Cockpit/Perspective static preview
   - `components/augnes-cockpit.tsx`
   - `scripts/smoke-research-candidate-review-parser-output-cockpit-preview-v0-1.mjs`
   - `npm run smoke:research-candidate-review-parser-output-cockpit-preview-v0-1`

7. Candidate Constellation Overlay preview
   - `types/research-candidate-constellation-overlay.ts`
   - `lib/research-candidate-review/constellation-overlay.ts`
   - `fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json`
   - `fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json`
   - `components/research-candidate-constellation-overlay-preview.tsx`
   - `scripts/smoke-research-candidate-review-constellation-overlay-v0-1.mjs`
   - `npm run smoke:research-candidate-review-constellation-overlay-v0-1`

8. Research Candidate AI Context Packet preview
   - `types/research-candidate-ai-context-packet.ts`
   - `lib/research-candidate-review/ai-context-packet.ts`
   - `fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json`
   - `fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json`
   - `components/research-candidate-ai-context-packet-preview.tsx`
   - `scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs`
   - `npm run smoke:research-candidate-review-ai-context-packet-v0-1`

9. Formation Receipt preview
   - `types/research-candidate-formation-receipt.ts`
   - `lib/research-candidate-review/formation-receipt.ts`
   - `fixtures/research-candidate-review.formation-receipt.sample.v0.1.json`
   - `fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json`
   - `components/research-candidate-formation-receipt-preview.tsx`
   - `scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs`
   - `npm run smoke:research-candidate-review-formation-receipt-v0-1`

## What v0.1 Enables

- Static candidate inspection in Cockpit/Perspective.
- Deterministic manual parser preview fixtures.
- Candidate-to-overlay mapping.
- Overlay-to-AI-context-packet mapping.
- Packet-to-formation-receipt mapping.
- Canonical promotion guardrails before runtime or storage.
- Future runtime/manual input preview lane reuse of the existing pure parser and
  preview structures.

## What v0.1 Does Not Implement

- no runtime manual input UX
- no live parser execution in Cockpit
- no runtime API route
- no durable candidate/review storage
- no durable receipt storage
- no event log
- no proof/evidence writes
- no provider/OpenAI calls
- no source fetching
- no retrieval/RAG
- no embeddings/vector search
- no graph DB
- no layout algorithm
- no perspective promotion
- no review/promote/reject/defer workflow
- no work item creation
- no Codex execution
- no external handoff sending

## Verification Chain

- `npm run smoke:research-candidate-review-surface-v0-1`
- `npm run smoke:research-candidate-review-types-v0-1`
- `npm run smoke:research-candidate-canonical-promotion-gates-v0-1`
- `npm run smoke:research-candidate-review-cockpit-preview-v0-1`
- `npm run smoke:research-candidate-review-manual-parser-v0-1`
- `npm run smoke:research-candidate-review-parser-output-cockpit-preview-v0-1`
- `npm run smoke:research-candidate-review-constellation-overlay-v0-1`
- `npm run smoke:research-candidate-review-ai-context-packet-v0-1`
- `npm run smoke:research-candidate-review-formation-receipt-v0-1`
- `npm run smoke:research-candidate-review-v0-1-closeout`
- `npm run typecheck`
- `git diff --check`

## Authority Boundary

These are preview boundaries, not permanent product bans. Future lanes may add
runtime input, preview routes, durable storage, retrieval, provider-assisted
extraction, or promotion, but each future lane must be introduced as a bounded
lane with explicit scope.

The v0.1 preview chain itself remains non-authoritative.

## Known Gaps And Caveats

- `components/augnes-cockpit.tsx` has grown large; future UI work should
  consider extracting Research Candidate preview panels if the Cockpit keeps
  growing.
- Current receipts are participation-style attribution, not precise causal
  durable audit logs.
- Current parser has limited deterministic prefix grammar.
- No live host/browser visual observation is required by this closeout PR unless
  the operator separately requests it.
- No runtime/user input path exists yet.

## Next Implementation Lane

Manual Research Candidate Preview Lane.

The intended next lane is a bounded manual input UI or route that lets the
operator paste a manual note, runs the existing deterministic parser in a
preview-only path, and renders the resulting preview read-only.

That lane must not store, promote, create work items, write proof/evidence, call
providers, retrieve, or execute Codex.

Conservative first next work item: add Cockpit manual pasted note preview UI
shell that uses the existing parser preview path read-only, without storage,
promotion, provider calls, retrieval, proof/evidence writes, work item creation,
or Codex execution.

## Stop Conditions For The Next Lane

Codex should stop and ask or report if the next lane would require:

- durable storage
- DB schema
- proof/evidence writes
- perspective promotion
- provider/OpenAI calls
- retrieval/RAG
- source fetching
- work item creation
- Codex execution
- external handoff sending
- new top-level state machine

## Recommended Next Work

Add Cockpit manual pasted note preview UI shell using existing deterministic
parser in a preview-only, read-only path.
