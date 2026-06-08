# Perspective Manual Agent Brief Handoff Dogfood v0.1

## Purpose and Scope

This PR dogfoods copy-ready handoff packet generation from a local manual
pasted-text preview Agent Brief that includes `ingress_context`. It follows PR
#453, which made local manual ingress admission available to the Agent Brief as
compact machine-readable context.

The packet is generated from the Agent Brief, not from raw manual input. It is a
consumption artifact for human-reviewed follow-up, not execution authority, not
Formation authority, not persistence, and not an ingress provider.

## Dogfood Flow

The local dogfood chain is:

1. manual pasted text
2. local preview response with `ingress_admission`
3. Agent Brief with `ingress_context`
4. compact handoff packet for human-reviewed agent or Codex follow-up

The builder is pure/local/read-only. It adds no route, UI, persistence, provider
call, GitHub call, Codex execution, graph DB behavior, or proof/evidence/
readiness write.

## Packet Shape

The packet uses `packet_version:
perspective_agent_brief_handoff_packet.v0.1` and supports these audiences:

- `chatgpt_review`
- `codex_handoff`
- `agent_context`

The packet section order is:

1. Purpose
2. Selected Material
3. Spatial Context
4. Temporal Context
5. Ingress Context
6. Tensions
7. Next Actions
8. Handoff Constraints
9. Authority
10. Exclusions

This is a new dogfood Agent Brief handoff packet. It does not alter the
existing Perspective Handoff packet section order.

## Ingress Context Summary

When the Agent Brief includes `ingress_context`, the packet summarizes:

- ingress kind
- trust level
- admission state
- redaction state
- decision target and allowed flag
- preview readiness
- research archive eligibility
- local/read-only authority
- pointer count only
- source ref availability as a boolean
- candidate id availability as a boolean

When `ingress_context` is absent, the packet says: "No ingress context present."

## Intentionally Excluded

The packet intentionally excludes:

- raw pasted text
- raw `ingress_admission` JSON
- raw Agent Brief JSON dumps
- candidate id value
- source ref value
- pointer refs values
- actor refs values
- consent ref
- bounded summary
- packet textarea content
- packet text bodies from existing preview packets
- FormationReceipt body
- provider/model/API/GitHub/Codex/OAuth/token/billing/private/generated/prompt
  payloads

The packet may say that a candidate id or source ref is available, but it must
not include the values.

## Route and UI Behavior

This PR does not change the Human Workbench UI, Observatory details UI, the
Agent Brief read route behavior, or local manual preview route behavior. It does
not add manual Agent Brief route support and does not add a POST Agent Brief
route.

This PR does not change the Agent Brief read route behavior.

No Agent Brief JSON, handoff packet, ingress candidate, or hidden raw JSON dump
is exposed in product DOM.

## Preserved Contracts

This PR preserves graph topology, node ids, node types, edge ids, edge types,
Event Rail structure, authority behavior, and existing Perspective packet
section order. Rulecraft remains unexposed in product UI.

## Out of Scope

This PR does not implement OAuth, external API/provider/model calls, GitHub
calls or mutation, Codex execution, ChatGPT Apps integration, Codex plugin
integration, DB schema or migrations, persistence, graph DB behavior,
proof/evidence/readiness writes, Human Workbench redesign, Observatory details
changes, new routes, or product DOM exposure of raw/private/generated/prompt/
model/token/API key/billing data.

## Next Suggested Slice

Evaluate manual Agent Brief handoff packet in Codex review loop.
