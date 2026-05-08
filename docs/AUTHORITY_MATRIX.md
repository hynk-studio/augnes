# Authority Matrix

Augnes is useful across ChatGPT, Codex, GitHub, Browser/Chrome, and MCP surfaces only when authority stays explicit. This matrix names who can observe, propose, record proof, and make durable decisions.

## Principles

- The user owns durable approval.
- Augnes Core owns committed state and the commit/reject gate.
- Codex owns repo execution and verification.
- GitHub owns code history and PR review surfaces.
- ChatGPT App owns conversational interpretation and handoff, not execution control.
- Browser/Chrome and MCP Inspector are verification surfaces, not authorities.

## Capability Matrix

| Actor or surface | Read Augnes state | Propose pending state | Record proof or trace | Commit/reject Augnes state | Edit repo | Use Browser/Chrome | Open PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| User | Yes | Yes, through conversation or UI | Yes, by instructing tools or entering notes | Yes | Yes | Yes | Yes |
| Augnes Core runtime | Yes | Validates and stores pending proposals | Yes, action records and work events | Yes, only through explicit commit/reject routes | No | No | No |
| ChatGPT App, public profile | Read-only app data | No | No | No | No | No | No |
| ChatGPT App, bridge enabled | Yes, through bridge tools | Yes, pending proposals through `augnes_observe` | Yes, bridge-gated action results and work events | No | No | No | No |
| Codex | Yes, through state/work briefs or handoff | Yes, by asking Augnes to observe user-approved context | Yes, through completion protocol or bridge-gated proof tools | No | Yes | Yes, for verification | Yes, through GitHub workflow |
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
