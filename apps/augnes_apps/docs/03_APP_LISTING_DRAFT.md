# App listing draft

## Name
Augnes

## Short description
Evidence-backed casefiles, rationale, boundary packets, and continuity status for ongoing work inside ChatGPT.

## Overview
Augnes turns ongoing work into an evidence and continuity console inside ChatGPT.
Use it to inspect what work is active, what evidence supports or contradicts the current view, why Augnes is recommending verification or retrieval, what survives an episode boundary, and whether continuity is holding.

## Example prompts
- What are we actually doing right now?
- Open the casefile for the auth connector rollout.
- Why are we choosing VERIFY instead of PROCEED?
- Show the latest boundary packet.
- Are we still on the same self or a branch?
- Navigate the repo graph for the healthcheck metric.

## What it can access
- evidence-backed casefiles
- working view summaries
- strategy rationale records
- boundary packets
- continuity reports
- repo navigation results and fetched source documents

## Not indexed
- secrets, tokens, passwords
- raw provider thread/session/workspace identifiers
- internal debug payloads not required for the user request
- unsupported binary blobs

## Permissions
Read-only

## Known limitations
- Public v1 does not write, commit, or automate external actions.
- Freshness depends on Augnes ingestion cadence.
- Some repo navigation results are view-only and require fetch before they can be treated as evidence.
- Rich widget UI is additive; text output should still be usable without it.
