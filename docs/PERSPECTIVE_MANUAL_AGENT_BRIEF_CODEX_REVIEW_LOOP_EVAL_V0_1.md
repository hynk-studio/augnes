# Perspective Manual Agent Brief Codex Review Loop Eval v0.1

## Purpose and scope

This PR evaluates the manual Agent Brief handoff packet in a Codex review loop. It follows PR #454, which added `buildPerspectiveAgentBriefHandoffPacket` for copy-ready Agent Brief handoff packets.

This is report/dogfood only. It adds a deterministic local dogfood script, a generated packet artifact, an evaluation report, and smoke coverage for the artifact and report.

## What this PR does not do

This PR does not execute Codex, call GitHub, add routes, add UI, persist anything, write DB state, add graph DB behavior, add proof/evidence/readiness writes, add source ingress, call providers or models, implement OAuth, implement ChatGPT Apps integration, or implement Codex plugin integration.

## Evaluated flow

The dogfood script evaluates this local chain:

1. manual pasted text
2. local preview response with `ingress_admission`
3. Agent Brief with `ingress_context`
4. `codex_handoff` packet from `buildPerspectiveAgentBriefHandoffPacket`
5. human-reviewed Codex task prompt / PR review loop

The generated packet artifacts are meant for human-reviewed copy/paste. They are consumption artifacts, not execution authority.

## Preserved review loop

The evaluation preserves the ChatGPT-GitHub-Codex workflow:

1. Codex codes, tests, and opens a PR.
2. ChatGPT reviews the PR.
3. The user decides whether to merge.

The packet is evaluated for whether it helps Codex understand scope and constraints while avoiding any instruction to merge, execute, call providers, mutate GitHub, persist state, or treat the packet as Formation authority.

## Evaluation criteria

The report checks:

- Scope clarity: audience, selected scope, selected material, spatial context, temporal context, ingress context, tensions, and next actions.
- Authority clarity: review/planning only, not Formation authority, no Codex execution, no GitHub mutation, no persistence, no graph DB, and no provider/model/API call.
- Raw-value exclusion: no raw manual input, raw admission object, raw Agent Brief object, candidate id value, source ref value, pointer ref values, actor ref values, consent ref, bounded summary value, existing packet bodies, or provider/token markers.
- Codex review-loop usefulness: copy-ready, concise enough for a prompt, no merge instruction, no provider-call instruction, enough context for a scoped PR, and user review remains required.
- Recommended changes: what to keep, change, and defer.

## Exclusions

The generated dogfood packet artifact intentionally excludes raw pasted text, raw `ingress_admission` JSON, raw Agent Brief JSON, candidate/source/pointer/actor/consent values, bounded summary values, packet textarea content, FormationReceipt body, existing Perspective Handoff Packet body, provider/model/GitHub/Codex/OAuth/token/billing/private/generated/prompt payloads, and hidden product-DOM dumps.

## Next suggested slice

Recommended next implementation PR title:

`Add reviewed manual Agent Brief packet template for Codex prompts`
