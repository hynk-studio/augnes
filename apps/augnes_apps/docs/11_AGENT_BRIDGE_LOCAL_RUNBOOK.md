# Agent Bridge Local Runbook

Use this runbook to run the local two-process Augnes Agent Bridge demo.

Augnes exists to reduce the human-message-bus burden between ChatGPT, Codex, and GitHub. ChatGPT can inspect and plan. Codex can implement and verify. GitHub stores the code. Augnes keeps the explicit temporal project state and records what changed.

This flow is intentionally local and explicitly bridge-gated. The public ChatGPT App profile remains directory-safe unless bridge mode is enabled.

## Handoff / Execution Boundary

The ChatGPT App can create a Codex Handoff Packet from Augnes state and work briefs. Codex executes that handoff using its own execution capabilities, such as GitHub, Browser/Chrome, local runtime commands, and ChatGPT Apps or Developer Mode verification when those surfaces are available.

Augnes records proof and trace notes after the work. It does not directly orchestrate Codex, launch autonomous Codex execution, approve durable state, merge GitHub PRs, or turn ChatGPT App into a commit/reject authority.

Use the root trace docs for PR work:

- `docs/AUTHORITY_MATRIX.md`
- `docs/CODEX_HANDOFF_PACKET.md`
- `docs/VERIFICATION_EVIDENCE_PACK.md`
- `docs/EXECUTION_SURFACE_RECORD.md`
- `docs/EXPECTED_IMPACT_CHECK.md`
- `docs/PHASE_2_HANDOFF_REVIEW_INTEGRATION_RUNBOOK.md`
- `.github/pull_request_template.md`

## Prerequisites

- Single `Aurna-code/augnes` checkout.
- Augnes runtime at the repository root.
- Augnes Apps MCP bridge under `apps/augnes_apps`.
- Node.js and npm installed.
- Optional `cloudflared` for ChatGPT Developer Mode.
- Optional ChatGPT Developer Mode access.
- Optional MCP Inspector.

## Start Augnes Runtime

Start the Augnes runtime from the repository root on port `3000`:

```bash
cd /path/to/augnes
npm install
npm run db:reset
npm run demo:seed
npm run dev -- --port 3000
```

In a second terminal, verify the runtime state brief:

```bash
curl "http://localhost:3000/api/state/brief?scope=project:augnes"
```

Expected:

- `runtime` should be `augnes`.
- `scope` should be `project:augnes`.
- Seeded state should appear.

## Start Augnes Apps MCP Bridge

Start the Augnes Apps MCP bridge from `apps/augnes_apps` on port `8787` with explicit bridge mode enabled:

```bash
cd /path/to/augnes/apps/augnes_apps
npm install
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run dev
```

Without `AUGNES_ENABLE_AGENT_BRIDGE=true`, the app remains public directory-safe and only exposes the original nine read-only Evidence & Continuity Console tools:

- `search`
- `fetch`
- `open_casefile`
- `get_working_view`
- `explain_strategy`
- `get_boundary_packet`
- `get_continuity_report`
- `navigate_repo`
- `get_governance_audit`

With `AUGNES_ENABLE_AGENT_BRIDGE=true`, the Augnes bridge tools are also registered:

- `augnes_get_state_brief`
- `augnes_observe`
- `augnes_plan`
- `augnes_record_action_result`
- `augnes_list_pending_proposals`
- `augnes_record_work_event`
- `augnes_generate_codex_handoff_draft`
- `augnes_review_codex_result_draft`
- `augnes_get_mailbox_summary`
- `augnes_get_publication_summary`

## Verify Bridge Health

Check that the MCP bridge server is running:

```bash
curl http://localhost:8787/healthz
```

`/healthz` only confirms that the MCP bridge server is up. It does not prove the Augnes runtime is reachable. Use the runtime state brief endpoint to verify the port `3000` process.

## Run MCP Inspector

Run MCP Inspector against the local bridge endpoint:

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true \
AUGNES_API_BASE_URL=http://localhost:3000 \
npm run inspect
```

The inspector targets:

```text
http://localhost:8787/mcp
```

Expected:

- The original nine public tools should appear.
- The bridge tools should appear only in bridge-enabled mode.

## Optional ChatGPT Developer Mode Tunnel

Local MCP Inspector works without an HTTPS tunnel. ChatGPT Developer Mode needs a reachable HTTPS endpoint.

Expose the local MCP bridge with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:8787
```

Register this endpoint in ChatGPT Developer Mode:

```text
https://<tunnel-host>/mcp
```

If the tunnel restarts, the URL changes unless you use a named tunnel.

## Codex Handoff Demo

Use this flow to demonstrate ChatGPT interpretation, Codex implementation, GitHub PR trace, and Augnes Temporal State Graph proof.

1. Read the Augnes state brief with `augnes_get_state_brief`.

```json
{
  "scope": "project:augnes"
}
```

When the Augnes runtime includes `agent_handoff` in `/api/state/brief`, `augnes_get_state_brief` preserves it under `structuredContent.brief.agent_handoff`. The packet is intended for current status, next action, blockers or open tensions, verification commands, and the action record template. It remains bridge-gated and does not add public default write tools.

2. Ask for a state-grounded plan with `augnes_plan`.

```json
{
  "scope": "project:augnes",
  "message": "What should Codex do next for the Augnes bridge demo?"
}
```

3. Generate or copy a Codex Handoff Packet.

Use `docs/CODEX_HANDOFF_PACKET.md` as the format. The handoff should name the `AG-xxx` work ID, related state keys, expected files, verification commands, expected surfaces, and safety boundaries. The handoff is a packet for the user or Codex to execute; it is not a ChatGPT App command to run Codex.

Bridge-enabled mode can create a durable draft packet through
`augnes_generate_codex_handoff_draft`:

```json
{
  "scope": "project:augnes",
  "workId": "AG-006",
  "targetAgent": "codex",
  "createdBy": "chatgpt"
}
```

Answer from the returned `structuredContent`:

- Explain the current state or work context briefly.
- Say this is a Codex handoff draft and guidance packet.
- Show or offer to copy `packet_text`.
- Remind the user that Codex execution happens outside this tool.
- Remind the user that durable approval remains in Augnes Core or Runtime Cockpit.

The tool creates a draft handoff record only. It does not call Codex, mark the
handoff ready or delivered, commit or reject Augnes state, publish externally,
post to GitHub or Discord, or create mailbox behavior.

4. Let Codex perform a small repo task using its own capabilities, for example:

- Update a docs file.
- Add a PR trace template.
- Verify a README section.
- Use GitHub to inspect or open a PR.
- Use Browser/Chrome only for UI verification when a local runtime exists.

5. Review the Codex result and prepare record drafts.

Bridge-enabled mode can compare the reported Codex result against the handoff
without recording proof through `augnes_review_codex_result_draft`:

```json
{
  "scope": "project:augnes",
  "handoffId": "handoff:...",
  "actualFilesChanged": ["lib/handoff-review.ts"],
  "actualStateKeys": ["coordination.handoff_registry"],
  "actualChecks": ["npm run typecheck"],
  "actualExecutionSurfaces": ["local_runtime", "github"],
  "resultStatus": "partial",
  "resultKind": "implementation",
  "resultSummary": "Implemented the result-review helper and route; Developer Mode checks were skipped.",
  "skippedChecks": [
    {
      "check": "ChatGPT Developer Mode",
      "reason": "No tunnel or Developer Mode session was available."
    }
  ]
}
```

Answer from the returned `structuredContent`:

- Identify the handoff being reviewed.
- Summarize expected vs actual files, state keys, checks, and execution surfaces.
- Show recommended result status and kind.
- Show `action_record_draft` and `work_event_draft`.
- Remind the user that proof recording and durable approval are separate steps.

The review tool is draft-only. It does not execute Codex, record proof, commit
or reject Augnes state, mark handoffs reviewed, post to GitHub or Discord,
publish externally, or create mailbox behavior. The runtime may append a
`result_review_created` coordination event with `interpretation_only`
authority so the review attempt is visible on the event spine.

### Mailbox Summary View

Bridge-enabled mode can read bounded mailbox summary buckets through
`augnes_get_mailbox_summary`:

```json
{
  "scope": "project:augnes"
}
```

Answer from the returned `structuredContent.mailbox_summary`:

- Summarize pending handoffs and needs-review items first.
- Include approval-needed and blocked/partial notices when present.
- Treat superseded and expired counts as inactive context only.
- Say the summary is a derived read-only view, not a source of truth.

The mailbox summary tool does not acknowledge messages, update handoff status,
approve or reject Augnes state, execute Codex, record proof, publish externally,
post to GitHub or Discord, or create free-form agent chat behavior.

### Mailbox Active View and Reopen Policy

Active mailbox views exclude terminal messages with `superseded` or `expired`
status. The runtime list API exposes the same read-only composed view with:

```bash
curl "http://localhost:3000/api/mailbox?scope=project:augnes&active=true"
```

The summary buckets also exclude `superseded` and `expired` messages and report
those statuses only under inactive counts. Terminal mailbox states block
reactivation to `ready`, `delivered`, `acknowledged`, or `reviewed` unless a
future explicit reopen design is implemented. Do not create a new active mailbox
row from a terminal row as a workaround.

### Mailbox Summary Verification Checklist

Use this checklist when validating the mailbox summary bridge before Publisher
or Delivery Ledger work:

- Confirm `GET /api/mailbox/summary?scope=project:augnes` returns a derived
  read-only view and does not mutate mailbox messages.
- Confirm public/default ChatGPT App mode does not expose
  `augnes_get_mailbox_summary`.
- Confirm bridge mode exposes `augnes_get_mailbox_summary` with
  `readOnlyHint: true` and `destructiveHint: false`.
- Confirm bridge output includes `structuredContent.mailbox_summary` and
  boundary flags or text for derived view only, no mailbox status update, no
  state commit/reject, no Codex execution, no external publication, and no proof
  recording.
- Confirm Cockpit Mailbox Summary has no mailbox write buttons, no
  approve/reject controls, no commit/reject controls, no Codex execution
  controls, no publisher controls, and no proof-recording controls.
- Confirm repeated summary reads create no `action_records`, no `work_events`,
  no pending proposals, no committed state transitions, and no mailbox status
  changes.

### Publication Summary View

Bridge-enabled mode can read bounded publication preview and delivery status
buckets through `augnes_get_publication_summary`:

```json
{
  "scope": "project:augnes"
}
```

Answer from the returned `structuredContent.publication_summary`:

- Summarize pending/approved publication drafts and recent delivery status.
- Treat publication preview and delivery status as derived read-only views.
- Include failed delivery status/error context only as bounded review context.
- Say actual GitHub posting remains separately approval-gated for a specific
  target.

The publication summary tool does not approve publications, publish to GitHub,
retry deliveries, record proof, commit or reject Augnes state, execute Codex,
mutate PR labels/titles/bodies/reviews, post to Discord/webhooks, or create
free-form agent chat behavior.

Public/default mode must not expose `augnes_get_publication_summary`, and it
must not expose publication approval, publish, retry, proof-recording,
state-commit, or Codex-execution tools.

Developer Mode verification for `augnes_get_publication_summary` is complete
via PR #66. Treat that as evidence that the bridge-gated summary read works in
Developer Mode, not as publish authority. ChatGPT App still does not expose
publish, approve, or retry tools. Live GitHub posting is a backend adapter flow
only and is not initiated from the ChatGPT App.

### Publication Summary Developer Mode Verification Checklist

Use this checklist only when re-validating Developer Mode behavior after a
relevant bridge or registration change:

- Start the Augnes runtime from the repo root.
- Start the bridge with `AUGNES_ENABLE_AGENT_BRIDGE=true` and
  `AUGNES_API_BASE_URL=http://localhost:3000`.
- Expose the bridge with `cloudflared tunnel --url http://localhost:8787`.
- Register only the redacted Developer Mode endpoint shape:
  `https://<redacted-tunnel-host>/mcp`.
- Invoke `augnes_get_publication_summary`.
- Compare the result with
  `GET /api/publications/summary?scope=project:augnes`.
- Confirm public/default mode does not expose
  `augnes_get_publication_summary`.
- Confirm no approve/publish/retry/proof/state commit/Codex execution authority
  exists on the ChatGPT App surface.

Do not paste tunnel hostnames, secrets, screenshots, local DB files, generated
outputs, or local artifacts into git.

6. Record the result with `augnes_record_action_result` or the Codex completion helper only after the user explicitly wants proof recorded.

```json
{
  "scope": "project:augnes",
  "sourceAgentId": "agent:codex",
  "actionName": "update_agent_bridge_runbook",
  "resultSummary": "Updated the local bridge demo runbook and verified typecheck.",
  "filesChanged": ["apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md", "README.md"],
  "resultStatus": "completed",
  "resultKind": "documentation"
}
```

`resultStatus` and `resultKind` are optional. If omitted, the runtime defaults still apply: `completed` and `other`.

7. Confirm the Augnes runtime received the external action:

- Refresh `http://localhost:3000`.
- Or call:

```bash
curl "http://localhost:3000/api/state/brief?scope=project:augnes"
```

The Temporal State Graph should show the external action record after the runtime receives `augnes_record_action_result`.

8. For PR work, include the PR Trace Template fields, Verification Evidence Pack, Execution Surface Record, and Expected Impact vs Actual Result Check. If the local runtime, Browser/Chrome, ChatGPT Developer Mode, or MCP Inspector is unavailable, record the exact skipped reason.

## Using the ChatGPT App as the human-facing Augnes assistant

The ChatGPT App is the primary human-facing UX for Augnes state. Augnes Core remains the state authority, Runtime Cockpit remains the operator/audit/proof UI, and Codex remains responsible for repo work, verification, and action result reporting.

For plain user questions such as "Where are we?", "What should I do next?", "What should Codex do?", "What needs my approval?", or "What is risky or blocked?", call `augnes_get_state_brief` first:

```json
{
  "scope": "project:augnes"
}
```

When available, answer from `structuredContent.brief.agent_handoff` before reading raw state blocks. The handoff packet is the user-facing interpretation layer for:

- Current project status.
- Next recommended action.
- Codex handoff brief.
- Blockers and tensions.
- Pending proposal review guidance.
- Recent action summary.

Expected answer shape:

```text
Current status
- Plain-language summary from agent_handoff.current_status.summary.

Next step
- Use agent_handoff.next_recommended_action.title.
- Explain the rationale from agent_handoff.next_recommended_action.rationale.

Why
- Mention related state keys only secondarily, as grounding.

Codex handoff
- If the user asks what Codex should do, use agent_handoff.codex_handoff.task_brief.
- Include listed constraints and verification commands.
- Format longer handoffs with docs/CODEX_HANDOFF_PACKET.md.

Recent actions
- Summarize recent work from brief.recent_actions.
- Use any handoff-provided action summary only if such a field exists in a future runtime version.

Needs your decision / blockers
- If pending proposals exist, explain that the user must explicitly commit or reject durable state in Augnes Core or Runtime Cockpit.
- If blockers_or_tensions exist, explain them before suggesting risky work.
```

Keep raw state mechanics secondary. Prefer:

```text
The repo is guarded against committing API keys, and the README checklist has been completed.

Reference: security.no_api_keys_in_repo, submission.readme_checklist_created
```

Avoid leading with raw keys as the answer:

```text
security.no_api_keys_in_repo = true
submission.readme_checklist_created = true
```

Example prompts:

- What is the current Augnes project state?
- What should I ask Codex to do next?
- What is blocked or risky?
- Generate a Codex handoff brief from Augnes state.
- What needs my approval before the state becomes durable?

Example answer:

```text
Current status
The project is in a review-ready bridge state: the app can read Augnes state, preserve the agent handoff packet, and report action results without making ChatGPT the state authority.

Next step
Ask Codex to make the smallest scoped repo change described in the handoff and run the listed verification commands.

Why
The recommended action is grounded in the handoff's next action and related state keys. Reference: bridge.agent_handoff_preserved, governance.public_surface_read_only

Codex handoff
Task: update the relevant docs or helper text so ChatGPT answers from agent_handoff instead of raw state lists.
Constraints: do not add direct commit/reject tools; keep bridge tools gated behind AUGNES_ENABLE_AGENT_BRIDGE=true; keep public default behavior read-only.
Verification: npm run typecheck; npm run smoke

Needs your decision / blockers
There are pending proposals, so durable state changes still need an explicit user commit/reject decision in Augnes Core or Runtime Cockpit. The main tension is that ChatGPT can explain state and prepare Codex handoffs, but it must not become a write authority or start autonomous Codex execution.
```

Do not:

- Add direct commit or reject tools to the ChatGPT App.
- Add auth, OAuth, multi-user hosting, deployment semantics, or autonomous Codex execution in this app.
- Treat ChatGPT thread text as canonical Augnes memory.
- Dump `agent_handoff` wholesale into tool text; keep `structuredContent.brief.agent_handoff` as the source of truth.
- Lead with raw state keys when a plain-language handoff summary is available.
- Use the ChatGPT App to directly run Codex or merge GitHub PRs.

## Troubleshooting

Bridge tools are not visible:

- Confirm `AUGNES_ENABLE_AGENT_BRIDGE=true`.
- The public default app remains read-only and should only expose the original nine public tools.
- Restart `augnes_apps`.
- Rerun MCP Inspector.

Runtime is unavailable:

- Confirm `augnes` is running on port `3000`.
- Check `AUGNES_API_BASE_URL=http://localhost:3000`.
- Call `/api/state/brief` directly.

Port conflict:

- Use port `3000` for the Augnes runtime.
- Use port `8787` for the MCP bridge.

ChatGPT Developer Mode cannot connect:

- Use the HTTPS tunnel URL, not `localhost`.
- Confirm the endpoint path is `/mcp`.
- Restart the tunnel if the URL changed.

No external action node appears:

- Confirm `augnes_record_action_result` was called.
- Confirm it pointed at the correct scope.
- Refresh the Temporal State Graph.
- Inspect `/api/state/brief`.

## Verification

Run local verification before opening the PR:

```bash
npm run typecheck
npm run smoke
```

These checks are still useful for docs-only changes because they confirm the app scaffold and local smoke path remain healthy.

For PRs that involve Codex, GitHub, Browser/Chrome, or ChatGPT Developer Mode surfaces, also follow the root PR template and record skipped checks explicitly when a surface is unavailable.
