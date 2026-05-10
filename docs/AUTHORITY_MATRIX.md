# Authority Matrix

Augnes is useful across ChatGPT, Codex, GitHub, Browser/Chrome, and MCP surfaces only when authority stays explicit. This matrix names who can observe, propose, record proof, and make durable decisions.

## Principles

- The user owns durable approval.
- Augnes Core owns committed state storage and the commit/reject gate implementation.
- Codex owns repo execution and verification.
- GitHub owns code history and PR review surfaces.
- ChatGPT App owns conversational interpretation and handoff, not execution control.
- Browser/Chrome and MCP Inspector are verification surfaces, not authorities.

## Surface Role Distinctions

- User decision surface: ChatGPT Apps should be the primary human-facing place
  to understand pending choices, approval implications, and external side
  effects. They may collect intent, but they do not own durable state,
  publication, proof, or commit/reject authority.
- Implementation control surface: Codex should show task scope, changed files,
  verification evidence, skipped checks, blockers, assumptions, and PR
  readiness. It can implement and open PRs, but it does not own durable
  approval, publication, proof, or merge authority.
- Observability surface: Cockpit should show event spine, mailbox, handoff,
  publication, delivery, proof, and gate state. It should not become hidden
  authority; any future write controls must be separately scoped and Core-gated.
- Source-of-truth authority: Augnes Core remains the durable authority runtime
  for committed state, proof records, event spine, mailbox, publication drafts,
  delivery ledger, and gate validation.
- Approve/publish controls must route through Augnes Core and explicit user
  approval. The workflow is documented in
  `docs/AUGNES_CORE_GATED_APPROVE_PUBLISH_WORKFLOW.md`; C3 implements a narrow
  Core-gated approve action route, but later dry-run, publish, retry, and
  surface-control behavior still require future explicit PRs.
- Core approval request records may durably represent that approval is being
  requested for a specific publication target. They are not approval grants and
  do not change publication status, create delivery rows, publish, retry, record
  proof, update mailbox status, or commit/reject state.
- Core approval decision records may durably grant approval for one stored
  approval request target and transition the linked publication from `draft` to
  `approved`. Approval grant is still not publication: it does not dry-run,
  publish, retry, create delivery rows, record proof, update mailbox status,
  commit/reject state, execute Codex, invoke GitHub, use `GITHUB_TOKEN`, post to
  GitHub, or post to Discord.
- Core dry-run readiness records may durably capture readiness evidence for one
  approved decision and stored publication target. Dry-run readiness is still
  not publication: it does not publish, retry, create delivery rows, record
  proof, update mailbox status, commit/reject state, execute Codex, invoke
  GitHub, use `GITHUB_TOKEN`, post to GitHub, or post to Discord.
- Approval gate-state summaries and Cockpit renderers are derived read-only
  views. They may show request readiness, target matching, delivery status, gate
  reasons, approval decision state, readiness check state, and safe next steps,
  but they are not sources of truth and do not add approve, publish, retry,
  proof, mailbox, state, GitHub, Discord, or Codex execution authority.

## Capability Matrix

| Actor or surface | Read Augnes state | Propose pending state | Record proof or trace | Commit/reject Augnes state | Edit repo | Use Browser/Chrome | Open PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User | Yes | Yes, through conversation or UI | Yes, by instructing tools or entering notes | Yes | Yes | Yes | Yes |
| Augnes Core runtime | Yes | Validates and stores pending proposals | Yes, action records and work events | Executes commit/reject only when explicit user action invokes the routes | No | No | No |
| ChatGPT App, public profile | Read-only app data | No | No | No | No | No | No |
| ChatGPT App, bridge enabled | Yes, through bridge tools | May request pending proposals through `augnes_observe`; commit/reject remains user-gated | Yes, bridge-gated action results and work events | No | No | No | No |
| Codex | Yes, through state/work briefs or handoff | No direct proposal authority; may relay user-approved context to Augnes observe routes only when explicitly instructed | Yes, through completion protocol or bridge-gated proof tools | No | Yes | Yes, for verification | Yes, through GitHub workflow |
| GitHub | Stores repo and PR history | No Augnes state proposals | PR history can be referenced as proof | No | Yes, via commits | No | Yes |
| Browser/Chrome | Reads rendered local or hosted surfaces | No | Evidence can be summarized by Codex or user | No | No | Yes | No |
| MCP Inspector | Reads MCP tool outputs | Only if bridge tool is intentionally called | Can validate and record bridge-gated proof | No | No | No | No |

## Non-Goals

This matrix intentionally does not grant:

- direct Codex orchestration from the ChatGPT App
- autonomous Codex execution
- ChatGPT App commit/reject authority
- GitHub auto-merge
- hosted auth or deployment semantics
- secret handling changes

## Review Rule

When adding a tool, route, script, or runbook, identify the actor and surface it empowers. If the change moves durable approval away from the user or committed state away from Augnes Core, it is out of scope unless the user explicitly approves a new architecture.
