# Perspective Node Copy Humanization v0.1

This PR humanizes visible Perspective node labels and summaries. It changes copy only, not graph topology or authority.

## Stable Contracts

Node ids, node types, edge ids, and edge types remain stable. The generated ChatGPT fixture still uses ids such as `node.sample_chatgpt.source`, `node.sample_chatgpt.user_intent`, `node.sample_chatgpt.product_concept`, `node.sample_chatgpt.decision`, `node.sample_chatgpt.unresolved_tension`, `node.sample_chatgpt.next_move`, and `node.sample_chatgpt.packet`.

The handoff packet structure remains stable:

- Purpose
- Selected Perspective Material
- Evidence
- Unresolved Tensions
- Next Action Candidates
- Suggested Use
- Compact Authority
- Base Packet Text

## Copy Changes

ChatGPT fixture node labels and summaries now read as user-facing explanations instead of internal taxonomy. The active labels are `Sample ChatGPT record`, `What the user wants`, `Preview concept`, `Safe fixture decision`, `Known limitation`, `Suggested next step`, and `Review / Codex packets`.

Codex fixture node labels and summaries now read as reviewer-facing explanations. The active labels include `Sample Codex record`, `Implementation work`, `Changed files`, `Validation results`, `Blockers / risks`, `Final report`, and `Suggested next step`.

Manual pasted text generic labels may be improved without storing raw text. The local pasted text path continues to use bounded summaries and extracted fields only.

## Authority Boundaries

The compact authority capsule from PR #444 remains unchanged.

The Event Rail node-edge model from PR #445 remains unchanged. This PR does not alter `data-augnes-event-rail-view="node-edge"`, Event Rail node ids, Event Rail edge ids, or the passive PR reference node.

This PR adds no API routes, DB schema, migrations, persistence, graph DB behavior, provider/model/API calls, GitHub mutation, Codex execution, proof/evidence/readiness writes, Auto Proposal behavior, historical snapshot persistence, or delta engine.
