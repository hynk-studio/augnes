# Perspective Manual Agent Brief Codex Review Loop Packet Dogfood

This is a dogfood artifact generated from Agent Brief, not raw manual input.
It is intended for human-reviewed copy/paste into a Codex review loop.

## Whole Constellation codex_handoff Packet

# Perspective Agent Brief Handoff

Audience: codex_handoff
Generated: 2026-06-08T00:00:00.000Z

## Purpose
Local read-only Agent Brief handoff for a user-approved Codex PR workflow. Codex may code, test, and open a PR only when the surrounding prompt explicitly scopes that task. This packet does not grant merge, deploy, provider, persistence, Formation, or unscoped execution authority.

## Selected Material
- Scope: whole_constellation / Whole Constellation
- Selected: Whole Constellation
- Type: constellation
- Summary: omitted for manual ingress packet.

## Spatial Context
- Node count: 9
- Edge count: 12
- Related node count: 9
- Related edge count: 12

## Temporal Context
- Primary spine: session -> decision -> handoff -> current_view -> next_perspective
- Satellites: handoff -> pr -> review -> closeout
- Related temporal nodes: session -> decision -> current_view -> closeout -> review -> next_perspective -> handoff -> pr
- Current temporal node: next_perspective
- Next temporal node: none
- Related Cockpit surfaces: overview -> perspective -> work -> bridge -> operator

## Ingress Context
- Ingress kind: manual_pasted_text
- Trust level: user_provided_local
- Admission state: episode_candidate
- Redaction state: not_applicable
- Decision: accepted_for_preview / allowed yes
- Readiness: preview ready
- Research archive: no
- Boundary: local/read-only
- Pointer count: 1
- Source ref available: yes
- Candidate id available: yes

## Tensions
- Manual pasted input can help form a perspective, but it must not imply raw private history persistence.

## Next Actions
- Review the generated graph and copied packets before any future import slice.

## Handoff Constraints
- Use only inside a human-reviewed workflow.
- For Codex: code, test, and open a PR only if the user's surrounding prompt explicitly asks for that scoped task.
- Do not merge, deploy, publish, or approve.
- Do not mutate GitHub except opening the scoped PR when explicitly requested.
- Do not call providers/models/APIs.
- Do not infer raw source content.
- Do not treat this packet as Formation authority.
- ChatGPT reviews the PR.
- User decides whether to merge.
- Ask the user before expanding scope.

## Authority
- Mode: advisory_local_preview
- Packet authority: context only.
- User-approved PR workflow required for Codex code/test/open-PR work.
- Packet does not grant Codex execution authority by itself.
- No GitHub mutation outside explicitly scoped PR creation.
- No merge/deploy/publish authority.
- No external provider/model/API calls.
- No persistence.
- No graph DB.
- No proof/evidence/readiness writes.
- No raw source inference.
- No Formation authority.

## Exclusions
- raw pasted text omitted
- raw ingress_admission JSON omitted
- raw Agent Brief JSON omitted
- candidate/source/pointer/actor/consent values omitted
- bounded summary omitted from ingress_context
- existing packet bodies omitted
- FormationReceipt body omitted
- external/private/provider/model/GitHub/Codex/OAuth/token/billing/prompt payloads omitted
- packet text does not grant authority

## Selected Node codex_handoff Packet

# Perspective Agent Brief Handoff

Audience: codex_handoff
Generated: 2026-06-08T00:00:00.000Z

## Purpose
Local read-only Agent Brief handoff for a user-approved Codex PR workflow. Codex may code, test, and open a PR only when the surrounding prompt explicitly scopes that task. This packet does not grant merge, deploy, provider, persistence, Formation, or unscoped execution authority.

## Selected Material
- Scope: selected_node / Selected node
- Selected: Review / Codex packets
- Type: packet
- Summary: omitted for manual ingress packet.

## Spatial Context
- Node count: 9
- Edge count: 12
- Related node count: 1
- Related edge count: 3

## Temporal Context
- Primary spine: session -> decision -> handoff -> current_view -> next_perspective
- Satellites: handoff -> pr -> review -> closeout
- Related temporal nodes: handoff -> review -> pr
- Current temporal node: handoff
- Next temporal node: current_view
- Related Cockpit surfaces: bridge -> perspective -> work

## Ingress Context
- Ingress kind: manual_pasted_text
- Trust level: user_provided_local
- Admission state: episode_candidate
- Redaction state: not_applicable
- Decision: accepted_for_preview / allowed yes
- Readiness: preview ready
- Research archive: no
- Boundary: local/read-only
- Pointer count: 1
- Source ref available: yes
- Candidate id available: yes

## Tensions
- No tensions in brief.

## Next Actions
- Review the generated graph and copied packets before any future import slice.

## Handoff Constraints
- Use only inside a human-reviewed workflow.
- For Codex: code, test, and open a PR only if the user's surrounding prompt explicitly asks for that scoped task.
- Do not merge, deploy, publish, or approve.
- Do not mutate GitHub except opening the scoped PR when explicitly requested.
- Do not call providers/models/APIs.
- Do not infer raw source content.
- Do not treat this packet as Formation authority.
- ChatGPT reviews the PR.
- User decides whether to merge.
- Ask the user before expanding scope.

## Authority
- Mode: advisory_local_preview
- Packet authority: context only.
- User-approved PR workflow required for Codex code/test/open-PR work.
- Packet does not grant Codex execution authority by itself.
- No GitHub mutation outside explicitly scoped PR creation.
- No merge/deploy/publish authority.
- No external provider/model/API calls.
- No persistence.
- No graph DB.
- No proof/evidence/readiness writes.
- No raw source inference.
- No Formation authority.

## Exclusions
- raw pasted text omitted
- raw ingress_admission JSON omitted
- raw Agent Brief JSON omitted
- candidate/source/pointer/actor/consent values omitted
- bounded summary omitted from ingress_context
- existing packet bodies omitted
- FormationReceipt body omitted
- external/private/provider/model/GitHub/Codex/OAuth/token/billing/prompt payloads omitted
- packet text does not grant authority

## Review-loop Usage Note

- human should review before copying into Codex.
- Codex should open a PR, not merge.
- ChatGPT reviews PR after Codex opens it.
- User decides whether to merge.
- Packet does not grant authority by itself.

## Safety Note

- raw manual input omitted.
- raw ingress_admission JSON omitted.
- raw Agent Brief JSON omitted.
- candidate/source/pointer/actor/consent values omitted.
- provider/model/GitHub/Codex/OAuth/token/billing/private/generated/prompt payloads omitted.
