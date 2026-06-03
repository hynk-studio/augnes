# Project Constellation User-Intent Validation Browser Report

Report file date: 2026-06-03
Inspection run date: 2026-06-04 Asia/Seoul

## Inspected URL or skipped reason

- Inspected URL: `http://127.0.0.1:3000/#perspective-constellation-preview`
- Skipped reason: not skipped; local Cockpit loaded and the Perspective tab
  was opened before inspection.

## Local runtime setup used or skipped reason

- Setup used: `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset`
- Setup used: `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate`
- Setup used: `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed`
- Dev server: `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --hostname 127.0.0.1 --port 3000`
- Local runtime skipped reason: not skipped.

## Browser/computer-use availability

- Browser/computer-use status: available.
- Browser surface: in-app Browser plugin against the local Next dev server.
- Method: read-only DOM inspection, one readonly textarea selection check, and
  one viewport screenshot capture.

## Scenario results

| Scenario | Status | Observation |
| --- | --- | --- |
| Scenario 1: first-entry orientation | PASS | The Perspective tab showed the Project Constellation preview, fixture path `fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`, `sample_fixture_only`, `read_only_non_authoritative`, `work_unit_constellation`, and source scope title Sidecar e_t Strategy C first slice. |
| Scenario 2: node and edge meaning | PASS | The preview showed the cluster thesis, node and edge sections, 8 static sample nodes, 6 typed static sample edges, evidence pointers, unresolved tensions, and next action candidates. |
| Scenario 3: evidence pointer comprehension | PASS | The preview included evidence-pointer-based-only language, evidence pointer rows, copyable handoff text saying all evidence references are pointers only, and no proof/evidence/readiness writes. |
| Scenario 4: unresolved tension visibility | PASS | Unresolved tensions appeared as a separate section from evidence pointers, support material, and next action candidates. |
| Scenario 5: boundary and next-action clarity | PASS | Next action material appeared under next action candidates and used candidate wording; the preview section had zero buttons and no action controls. |
| Scenario 6: Perspective Capsule / Handoff Capsule comprehension | PASS | The copyable handoff preview was visible as Perspective Capsule / Handoff Capsule material with `codex_handoff`, repo, base branch, thesis, selected nodes, selected edges, evidence pointers, required checks, and forbidden actions. The textarea was readonly and all 4,692 characters could be selected manually. |
| Scenario 7: authority-misread prevention | PASS | The preview showed no live SDK call, no provider implementation, no runtime execution, no graph DB, no persistence, no proof/evidence/readiness writes, and no AG Resume writer/helper/route behavior. The preview section had zero buttons. |
| Scenario 8: user question answerability | PASS | From visible text, a user can answer what preview is loaded, what fixture backs it, what the cluster thesis is, which elements are nodes/edges/evidence pointers/tensions/next candidates, what the capsule contains, and which authority boundaries apply. |

## Screenshots or visual references

- A viewport screenshot was captured in the in-app Browser session after the
  readonly handoff text was selected. No screenshot artifact was committed
  because this PR scope requires only the browser report file.

## Observed UX gaps

- Minor comprehension risk: the copyable handoff text is a static sample packet
  for the prior sample-fixture task, not this validation task. The surrounding
  fixture/status copy makes that bounded sample status visible, but a user who
  starts inside the textarea could initially read it as a current live task.
- Minor scanability risk: DOM-normalized text collapses count labels such as
  `nodes8` and `edges6`, though the rendered UI visually separates the label
  and count.
- No blocking UX gap was observed for v0.1 read-only comprehension.

## Authority clarity findings

- The preview section had zero buttons.
- The readonly handoff preview had no copy button and no clipboard integration.
- Observed boundary copy included no live SDK call.
- Observed boundary copy included no provider implementation.
- Observed boundary copy included no runtime execution.
- Observed boundary copy included no graph DB.
- Observed boundary copy included no persistence.
- Observed boundary copy included no proof/evidence/readiness writes.
- Observed boundary copy included no AG Resume writer/helper/route behavior.
- No preview control may execute Codex.
- No preview control may create branches.
- No preview control may open PRs.
- No preview control may merge.
- No preview control may publish.
- No preview control may approve.
- No preview control may retry.
- No preview control may replay.
- No preview control may deploy.
- No preview control may record proof.
- No preview control may record evidence.
- No preview control may save snapshots.
- No preview control may roll back state.
- No preview control may persist graphs.
- No preview control may create runtime nodes.

## User-facing comprehension findings

- Preview identity was clear: Project Constellation preview inside Perspective.
- Sample fixture status was clear: `sample_fixture_only` and
  `read_only_non_authoritative`.
- Cluster thesis was visible and tied to Sidecar e_t Strategy C first slice.
- Node and edge meanings were inspectable through typed labels and ids.
- Evidence pointers were visible and pointer-only language was present.
- Unresolved tensions remained separate from evidence pointers.
- Next action candidates were visible as candidate material.
- The Perspective Capsule / Handoff Capsule material was bounded and inspectable
  as copyable handoff text.

## False-affordance findings

- No false affordance for Codex execution was observed.
- No false affordance for branch creation was observed.
- No false affordance for PR creation was observed.
- No false affordance for proof/evidence writes was observed.
- No false affordance for graph persistence was observed.
- No false affordance for snapshot save was observed.
- No false affordance for rollback was observed.
- No false affordance for runtime node creation was observed.
- No false affordance for merge authority was observed.
- No false affordance for publish authority was observed.
- No false affordance for approval authority was observed.
- No false affordance for retry authority was observed.
- No false affordance for replay authority was observed.
- No false affordance for deploy authority was observed.

## Recommended next UI/API/doc action

- Next UI action: consider a future copy-only wording refinement that labels
  the textarea contents as a static sample packet at the top of the textarea
  itself. This is advisory and does not require UI implementation in this PR.
- Next API action: none; no API route implementation is recommended from this
  validation pass.
- Next doc action: preserve this report as the v0.1 user-intent baseline and
  revisit after any future UI implementation change.

## Skipped checks with concrete reasons

- No scenario was skipped; all eight scenarios were inspected in the local
  browser workflow.
- External service checks were skipped because this task permits only local
  browser/computer-use inspection of the running app.
- Proof-only closeout was skipped because no runtime/work ID context exists
  for this docs/report/smoke validation PR, and this PR must not record
  proof/evidence writes.
- No screenshot artifact was committed because the requested changed-file scope
  is docs/report/smoke/package-pointer only.

## Proof-only closeout

- Skipped: no runtime/work ID context exists for this docs/report/smoke
  validation PR, and this PR must not record proof/evidence writes.
