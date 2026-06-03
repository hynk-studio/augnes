# Perspective Capsule Copyable Handoff Preview Browser Report

Date: 2026-06-03

## Setup

- Dev server command: `npm run dev -- --hostname 127.0.0.1 --port 3211`
- URL inspected: `http://127.0.0.1:3211/#perspective-constellation-preview`
- Surface: Cockpit > Perspective > Constellation preview
- Browser method: in-app Browser plugin was unavailable in this session
  (`agent.browsers.list()` returned no browser handles). Verification used an
  ephemeral Playwright 1.56.1 Chromium install outside the repo; no project
  dependency or lockfile was changed.

## Checks

- PASS: Cockpit loaded.
- PASS: Perspective surface loaded.
- PASS: Project Constellation preview was visible.
- PASS: Perspective Capsule / Handoff Capsule copyable handoff preview was
  visible.
- PASS: Readonly/selectable textarea was visible.
- PASS: Textarea was readonly.
- PASS: Handoff text included repo, base branch, task goal, required checks,
  and final report requirements.
- PASS: Evidence pointers and unresolved tensions were visible.
- PASS: Forbidden actions were visible.
- PASS: The handoff preview section had 0 buttons.
- PASS: No action controls were present for clipboard use, save snapshot,
  rollback, Codex execution, PR creation, proof/evidence recording, approval,
  publication, merge, retry, replay, or deployment.

## Skipped Items

- In-app Browser verification was skipped because no in-app Browser handles
  were exposed to the session. Headless Chromium verification was used instead.
- No screenshot artifact was committed. The validation was DOM/text based and
  this PR scope requires only the browser report file.

## Authority Boundary Confirmation

This check verified a read-only handoff preview only. The PR does not add graph
layout behavior, graph DB, persistence, runtime node creation, API routes,
MCP/App tools, plugin runtime actions, live Codex SDK calls, provider
implementation, proof/evidence/readiness writes, AG Resume writer/helper/route
behavior, or execution controls.
