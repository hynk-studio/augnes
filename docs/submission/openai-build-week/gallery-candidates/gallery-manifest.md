# OpenAI Build Week gallery candidates

These 15 candidates were captured from Augnes at base commit
`3fb95642ee169ce4b78c5147d47ee936fe04bd6e` using the repository's
deterministic vNext operator browser fixture. Every candidate is a 1500 × 1000
PNG captured from the same disposable local project at a 1500 × 1000 viewport.
Browser chrome and the Next.js development badge are excluded.

The demo database was built with
`scripts/build-vnext-operator-browser-fixture-v0-1.ts`, then the fixture project
was made active through the existing project-lifecycle helper. The capture used
an authenticated local operator session, the Next UI only, the deterministic
native-host adapter, no provider calls, no MCP bridge, and no external network
access. Candidate 15 additionally records the existing project automation
control as enabled inside that disposable database.

## Candidate manifest

| No. | Filename | Screen or route | Main claim communicated | Proposed Devpost caption | Capture mode | Priority | Caveat or dependency |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 01 | `01-project-home.png` | Project Home, `/projects/[projectId]` | One screen coordinates the current project, active work, attention, decision debt, and next action. | Project Home shows the current project, pending decisions, and the next useful action. | deterministic | essential | The project name is the repository fixture's public-safe name. |
| 02 | `02-project-perspective.png` | Project Home, accepted state disclosure | Accepted state, recent activity, and the selected working projection remain visibly distinct. | Accepted project state stays separate from the selected working projection and recent activity. | deterministic | optional | The fixture truthfully has no selected project Perspective, so the projection appears as unavailable. |
| 03 | `03-task-context-packet.png` | Shared Inspector, `target=task_context_packet` | The next task receives exact project-scoped context with accepted state, gaps, and lineage. | The next task receives selected project context through an exact TaskContextPacket. | deterministic | strong | Compact record identities remain inside collapsed read-only details. |
| 04 | `04-native-host-run.png` | Project Home, run and attention area | A bounded native-host round trip returns a recent immutable result and a clear follow-up action. | A bounded native-host run returns to Project Home with its result and next review action. | deterministic | strong | This is a completed deterministic adapter run, not an in-progress live Codex session. |
| 05 | `05-run-receipt.png` | Run result review, `/workbench/results/[receiptId]` | A completed run returns as a structured RunReceipt with execution, verification, trust, and criterion status. | Each completed run returns as a structured RunReceipt. | deterministic | essential | The captured run has partial verification by design. |
| 06 | `06-execution-vs-task-success.png` | Run result review, criterion summary | Host completion and task success are shown as separate outcomes. | This run completed, while task success remains unknown until its unresolved criterion is supported. | deterministic | essential | One required check is skipped, so the criterion result remains unknown. |
| 07 | `07-criterion-verification.png` | Semantic Workbench, expanded criterion assessment | Supported criteria and an unresolved project-isolation criterion keep their exact basis and uncertainty visible. | Augnes checks each success criterion against available observations, checks, and gaps. | deterministic | essential | The expanded unresolved criterion is intentionally dense because its insufficiency reasons are preserved. |
| 08 | `08-semantic-workbench.png` | Semantic Workbench, `/workbench/semantic-review/[proposalId]` | Intent, selected context, execution residue, criteria, uncertainty, and the proposed change share one review surface. | Semantic Workbench brings the goal, result, uncertainty, and proposed change into one review surface. | deterministic | essential | Reasoning sections are shown in their compact collapsed overview state. |
| 09 | `09-evidence-claim-reconciliation.png` | Semantic Workbench, expanded Evidence and Claim reconciliation | Evidence records, Claim families, relation types, and acceptance status remain source-linked and reviewable. | Evidence, Claims, and their relations stay source-linked without treating relation count as proof. | deterministic | strong | All shown relations are pending; Claim truth is explicitly not established. |
| 10 | `10-proposal-consequence.png` | Semantic Workbench, proposal candidate | The candidate's intended effect, uncertainty, limitations, and transition blockers are visible before a decision. | A proposal shows its expected effect, uncertainty, and limitations before project state can change. | deterministic | essential | The unresolved criterion prevents an accept path for this exact candidate. |
| 11 | `11-review-decision.png` | Semantic Workbench, candidate decision area | ReviewDecision history and the current human decision form are explicit and candidate-scoped. | The user reviews one exact candidate and its decision history before any durable application. | deterministic | essential | The proposal contains another candidate that still awaits review. |
| 12 | `12-authorized-transition.png` | Semantic Workbench, authorized Transition area | An accepted candidate is visibly bound to an applied Transition and later-context follow-up. | An accepted candidate changes project state only through its authorized Transition. | deterministic | essential | The same proposal still contains a second pending candidate; recording order does not select current state. |
| 13 | `13-later-project-context.png` | Semantic Workbench, later ContextUseReview area | Actual later-context use returns for explicit usefulness and impact feedback. | Later context use returns for an explicit assessment of usefulness, impact, and unexpected consequences. | deterministic | strong | No context-use review has been recorded yet; the form is the truthful pending state. |
| 14 | `14-inspector-lineage.png` | Shared Inspector, `target=episode_delta_proposal` | Inspector traces selected context, run, criteria, Evidence/Claims, proposal, decision, Transition, and later context. | Inspector traces an accepted change through its sources, run, decision, Transition, and later context. | deterministic | essential | Exact identifiers and fingerprints stay collapsed unless the operator opens a detail. |
| 15 | `15-bounded-automation.png` | Project Home, project controls disclosure | Automation is bounded by one work item, one active run, review requirements, and denied model/network access. | Project controls make the automation budget, review boundary, and denied capabilities visible. | deterministic | optional | This prepared fixture has no eligible queued work, so it does not show the stronger `review_needed` terminal state. |

## Preliminary top 8

This is Codex's preliminary recommendation for gallery selection, not a final
product or submission decision:

1. `01-project-home.png`
2. `03-task-context-packet.png`
3. `05-run-receipt.png`
4. `06-execution-vs-task-success.png`
5. `08-semantic-workbench.png`
6. `11-review-decision.png`
7. `12-authorized-transition.png`
8. `14-inspector-lineage.png`

## Truthful capture gaps

- No visually stable live or in-progress Codex run was captured; the current
  deterministic native-host completion is used instead.
- The prepared project has no selected project Perspective, so candidate 02
  preserves the product's explicit unavailable state.
- The current prepared automation state has no eligible queued work. Candidate
  15 documents its bounded controls but does not claim a `review_needed` stop.
- No provider result, external identity, GitHub action, MCP tool call, or
  external application appears in the set.
