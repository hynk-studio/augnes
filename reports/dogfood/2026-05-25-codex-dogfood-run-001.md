# Codex Dogfood Run 001

Date: 2026-05-25
Local time: 2026-05-25 16:54:54 KST (+0900)
Repository: `Aurna-code/augnes`
Checkout: `/Users/hynk/Documents/augnes`
Branch: `codex/move-onboarding-doc`
Mode: independent Augnes execution-layer dogfood
Scope: reporting only, no application-code fixes

## Run Boundary

Allowed file outputs for this run:

- `reports/dogfood/2026-05-25-codex-dogfood-run-001.md`
- `reports/dogfood/2026-05-25-codex-dogfood-index.md`
- `backlog/augnes-friction-backlog.md`
- `backlog/augnes-improvement-proposals.md`

Runtime state writes were made only against temp DB `/tmp/augnes-dogfood-run-001.db` during local dogfood proof flows. No secrets, tokens, live GitHub posting, private tunnels, or external authority-expanding actions were used.

## Baseline

Raw anchors:

- `git status --short --branch` returned `## codex/move-onboarding-doc...origin/codex/move-onboarding-doc`.
- `git log --oneline -5` top commit: `1473cfc Move onboarding doc out of repo root`.
- `node --version`: `v25.9.0`.
- `npm --version`: `11.12.1`.
- `date '+%Y-%m-%d %H:%M:%S %Z (%z)'`: `2026-05-25 16:54:54 KST (+0900)`.

Facts:

- The initial provided cwd `/Users/hynk/Documents/discord_test` was an empty no-commit git repo, not the Augnes checkout.
- The actual checkout was discovered at `/Users/hynk/Documents/augnes`.
- Root and app `node_modules` were already present, so no dependency install was needed.

Assumptions:

- `/Users/hynk/Documents/augnes` is the intended local checkout for `Aurna-code/augnes`.
- The branch was intentionally left as found; no pull, rebase, branch switch, commit, push, or PR action was requested.

Review needed:

- Docs: entrypoint/cwd setup clarity for future dogfood prompts.

## Required Docs Read

Raw anchors:

- `README.md`
- `docs/DEVELOPMENT_ONBOARDING.md`
- `docs/AUTHORITY_MATRIX.md`
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`
- `docs/CODEX_HANDOFF_PACKET.md`
- `docs/EXPECTED_IMPACT_CHECK.md`
- `docs/COCKPIT_PERSPECTIVE_IA_V0_1.md`
- `.github/pull_request_template.md`
- `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md`
- Missing: `docs/AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md`
- Missing: `docs/RAW_EPISODE_CAPTURE_V0_1.md`
- Missing: `docs/DOGFOODING_EPISODE_LOG_V0_1.md`
- Missing: `docs/DOGFOODING_EVALUATION_CRITERIA_V0_1.md`

Facts:

- Four required dogfooding docs named in the goal are absent from this checkout.
- README quickstart includes `npm run db:migrate`; bridge runbook runtime start omits `npm run db:migrate`.
- README says the Cockpit provides a five-tab UI: Overview, Work, Perspective, Bridge, Operator.
- `docs/AUTHORITY_MATRIX.md` still mentions Cockpit MVP UI polish with Overview, Work, Ledger, Proof, Bridge, Operator as composition boundaries.
- `docs/COCKPIT_PERSPECTIVE_IA_V0_1.md` says the five-tab Perspective IA supersedes the previous six-tab IA.

Assumptions:

- The missing dogfooding docs may exist in another branch or were expected to be generated later.

Review needed:

- Docs and product judgment.

## Attempt 01: Repo Onboarding And Current-State Comprehension

Attempted task:

- Start from the requested repository, find the checkout, read required docs, and identify current branch/status.

Expected behavior:

- The provided cwd should be the Augnes repo or docs should explain where to run the goal.
- All required docs should exist.
- The branch/status should be easy to capture.

Exact commands run:

```bash
pwd && rg --files -g 'README.md' -g 'docs/*.md' -g '.github/pull_request_template.md' -g 'apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md'
git status --short --branch
ls -la
find /Users/hynk/Documents -maxdepth 4 -type d -name augnes 2>/dev/null
git status --short --branch
git log --oneline -5
```

Actual behavior:

- The requested cwd did not contain Augnes docs.
- The repo was found at `/Users/hynk/Documents/augnes`.
- Four required dogfooding docs were missing.

Checks:

- Passed: found Augnes checkout.
- Passed: captured branch and recent commits.
- Failed: required dogfooding docs were not present.
- Skipped: no remote sync, because the prompt did not ask to pull latest.

Issue:

- Missing dogfooding docs create an immediate onboarding gap for independent evaluators.

Review needed:

- Docs.

## Attempt 02: Local Runtime Quickstart

Attempted task:

- Run the local runtime quickstart against a temp SQLite DB.

Expected behavior:

- DB reset, migration, seed, and dev server should start without secrets.
- `OPENAI_API_KEY` should be optional for local demo.

Exact commands run:

```bash
env AUGNES_DB_PATH=/tmp/augnes-dogfood-run-001.db npm run db:reset
env AUGNES_DB_PATH=/tmp/augnes-dogfood-run-001.db npm run db:migrate
env AUGNES_DB_PATH=/tmp/augnes-dogfood-run-001.db npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-dogfood-run-001.db npm run dev -- --port 3000
```

Actual behavior:

- DB reset, migrate, and seed all passed.
- Next dev server started on `http://localhost:3000`.
- Runtime was ready in 228 ms.

Checks:

- Passed: local runtime started.
- Passed: no OpenAI key required.
- Skipped: package install, because root and app dependencies were already installed.

Review needed:

- None for runtime start.
- Docs for README/runbook command drift around `db:migrate`.

## Attempt 03: Baseline Typecheck And App Smoke

Attempted task:

- Run core static and app smoke checks before UI/API dogfood.

Expected behavior:

- Checks should pass from the clean checkout without requiring secrets.

Exact commands run:

```bash
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm --prefix apps/augnes_apps run smoke
npm --prefix apps/augnes_apps run invariants
```

Actual behavior:

- All checks passed.
- App smoke returned `Smoke checks passed.`
- Invariants returned `Invariant checks passed.`

Checks:

- Passed: root typecheck.
- Passed: app typecheck.
- Passed: app smoke.
- Passed: app invariants.

Review needed:

- None.

## Attempt 04: State Brief And Work Brief Flow

Attempted task:

- Read current state/work context through raw runtime APIs and the Codex helper.

Expected behavior:

- State brief should provide a clear current status and next action.
- Work brief should provide a concrete work anchor and handoff details.
- Copy-paste curl examples should work in the default shell.

Exact commands run:

```bash
curl -sS http://localhost:3000/api/state/brief?scope=project:augnes | jq '{runtime, scope}'
curl -sS http://localhost:3000/api/work/AG-001/brief?scope=project:augnes | jq '{work_id}'
curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq '{runtime, scope, active_state_count:(.active_state|length), pending_proposals_count:(.pending_proposals|length), recent_actions_count:(.recent_actions|length), open_tensions_count:(.open_tensions|length), has_agent_handoff:(.agent_handoff != null), current_status:.agent_handoff.current_status.summary, next_action:.agent_handoff.next_recommended_action.title, codex_work_id:.agent_handoff.codex_handoff.work_id}'
curl -sS 'http://localhost:3000/api/work/AG-001/brief?scope=project:augnes' | jq '{work_id, status, title, next_action, recent_events:(.recent_events|length), codex_handoff:.codex_handoff}'
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes npm run codex:read-brief
```

Actual behavior:

- Unquoted `?scope=...` curl commands failed in zsh with `no matches found`.
- Quoted curl commands succeeded.
- State brief had `runtime: augnes`, `scope: project:augnes`, 3 active state entries, 0 pending proposals, 1 open tension, and an agent handoff.
- State-level `agent_handoff.codex_handoff.work_id` was `null`.
- `AG-001` work brief returned a usable `codex_handoff`.
- `npm run codex:read-brief` printed state counts and agent instructions, but not the richer `agent_handoff` summary.

Checks:

- Passed: quoted state brief API.
- Passed: quoted work brief API.
- Passed: Codex read-brief helper.
- Failed: unquoted raw curl examples are fragile in zsh.
- Partial: state-level handoff exists but does not expose a concrete work ID.

Review needed:

- Docs, engineering, product judgment.

## Attempt 05: Cockpit Browser Dogfood

Attempted task:

- Open the local Cockpit in the in-app browser and inspect major tabs and read-only controls.

Expected behavior:

- Cockpit should load, show expected tabs, expose clear boundaries, and provide read-only evidence/session/temporal inspection without adding authority.

Exact commands run:

```text
In-app browser opened http://localhost:3000.
Browser DOM snapshot captured for Overview.
Clicked Work, Perspective, Bridge, and Operator tabs.
Clicked Load Temporal Interpretation Preview.
Clicked Load Evidence Pack.
Clicked Load Session Trace.
```

Actual behavior:

- Overview loaded and showed tabs: Overview, Work, Perspective, Bridge, Operator.
- Runtime status showed `Runtime: Local / Local SQLite`, `Read-first Bridge`, and Work ID `AG-001`.
- Work tab showed Work Focus / Trace Spine and work items.
- Perspective tab showed an explicit read-only boundary and loaded mock Temporal Interpretation Preview.
- Bridge tab clearly stated read/draft/proof gates and blocked commit/Codex/GitHub mutation.
- Operator tab had safe local buttons and no obvious publish/merge/retry controls.
- Operator loaded Evidence Pack and Session Trace panels.

Checks:

- Passed: browser page loaded.
- Passed: five top-level tabs present.
- Passed: boundary copy visible in Perspective, Bridge, and Operator.
- Passed: Temporal Preview loaded in mock mode without OpenAI key.
- Passed: Evidence Pack and Session Trace loaded from Operator.
- Skipped: screenshot artifact commit, because the prompt prohibited generated/local artifact churn and no screenshot file was required.

Issue:

- The Operator DOM includes the word `external` in boundary copy, which made simple error-string heuristics noisy during automation. Not a product bug by itself.

Review needed:

- Design for testability and UI affordance clarity.

## Attempt 06: Cockpit Smoke Compatibility

Attempted task:

- Run Cockpit smoke scripts that cover current Perspective IA and old six-tab compatibility naming.

Expected behavior:

- Smokes should pass and confirm current IA.

Exact commands run:

```bash
npm run smoke:cockpit-perspective-ia
npm run smoke:cockpit-six-tab-shell
```

Actual behavior:

- Both passed.
- Both reported top-level tabs: Overview, Work, Perspective, Bridge, Operator.
- Both reported `old_six_tab_top_level_ia_superseded: true`.
- Both reported no app/API/lib/lockfile/dependency changes and no forbidden controls.

Checks:

- Passed: current Cockpit IA smoke.
- Passed: compatibility smoke.

Issue:

- Script name `smoke:cockpit-six-tab-shell` now validates five-tab Perspective IA, which may confuse evaluators.

Review needed:

- Docs and engineering naming cleanup.

## Attempt 07: MCP Bridge Read-Only Flow

Attempted task:

- Start the bridge and verify local bridge health/read-only surfaces without Developer Mode tunnel.

Expected behavior:

- Bridge should start with `AUGNES_ENABLE_AGENT_BRIDGE=true`.
- Health should make mode/profile understandable.
- Runtime reachability should be separately verifiable.

Exact commands run:

```bash
env AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
curl -sS http://localhost:8787/healthz
curl -sS 'http://localhost:3000/api/evidence/records?scope=project:augnes&work_id=AG-001' | jq '{scope, count:(.records|length)}'
curl -sS 'http://localhost:3000/api/control/brief?scope=project:augnes' | jq '{keys:keys, scope:(.scope // null), decision_card:(.decision_card // null), publication_summary:(.publication_summary // null), errors:(.errors // null)}'
```

Actual behavior:

- Bridge started: `Augnes MCP server listening on http://localhost:8787/mcp`.
- `/healthz` returned `{"ok":true,"name":"augnes-console","version":"0.1.0","mode":"mock","readOnly":true,"profile":"public"}`.
- Health did not visibly confirm bridge-enabled mode even though bridge env was set.
- Control brief endpoint returned a control packet shape, not a `decision_card` or `publication_summary` key.

Checks:

- Passed: bridge process started.
- Passed: health endpoint reachable.
- Passed: runtime API reachable.
- Skipped: MCP Inspector, because this run avoided interactive external clients and Developer Mode tunnel.
- Skipped: ChatGPT Developer Mode, concrete reason: no HTTPS tunnel or ChatGPT Developer Mode session was available.

Issue:

- Bridge health is ambiguous for operators because it still says `profile: public` with bridge env enabled.
- Runbook names `augnes_get_publication_decision_card`, but direct runtime control brief does not expose a field named `decision_card`.

Review needed:

- Product judgment, docs, engineering.

## Attempt 08: Codex Closeout Helper Chain

Attempted task:

- Record structured evidence and completion proof against temp runtime state.

Expected behavior:

- Evidence helper should return real evidence IDs.
- Completion helper should return action/work event IDs and not claim more authority than proof/trace recording.

Exact commands run:

```bash
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-001 CODEX_EVIDENCE_KIND=check_skipped CODEX_EVIDENCE_STATUS=skipped CODEX_EVIDENCE_LABEL='ChatGPT Developer Mode check' CODEX_RESULT_SUMMARY='ChatGPT Developer Mode check was not run during local dogfood.' CODEX_SKIPPED_REASON='No HTTPS tunnel or ChatGPT Developer Mode session was available.' npm run codex:record-evidence
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-001 CODEX_EVIDENCE_KIND=command_run CODEX_EVIDENCE_STATUS=passed CODEX_EVIDENCE_LABEL='Root typecheck' CODEX_COMMAND='npm run typecheck' CODEX_RESULT_SUMMARY='npm run typecheck passed during dogfood run.' npm run codex:record-evidence
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-001 CODEX_SOURCE_AGENT_ID=agent:codex CODEX_ACTION_NAME=dogfood_independent_execution_layer_test CODEX_RESULT_SUMMARY='Independent dogfood report run captured friction findings without modifying application code.' CODEX_FILES_CHANGED='reports/dogfood/2026-05-25-codex-dogfood-run-001.md,reports/dogfood/2026-05-25-codex-dogfood-index.md,backlog/augnes-friction-backlog.md,backlog/augnes-improvement-proposals.md' CODEX_RESULT_STATUS=needs_review CODEX_RESULT_KIND=verification CODEX_RELATED_STATE_KEYS='coordination.session_binding,verification.evidence_records,governance.authority_boundaries' npm run codex:record-completion
curl -sS 'http://localhost:3000/api/evidence/records?scope=project:augnes&work_id=AG-001' | jq '{count:(.records|length), ids:[.records[] | {evidence_id,evidence_kind,status,label,skipped_reason}]}'
curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq '{recent_actions:[.recent_actions[] | {id,title,status}], active_external:[.active_state[] | select(.state_key|startswith("external.")) | {state_key,value}]}'
```

Actual behavior:

- Evidence IDs returned:
  - `evidence:f66fbc46-5735-4afb-ad48-9a19ede1a745` for skipped Developer Mode check.
  - `evidence:fa153949-6b9a-47af-ae05-8db4eb1499b3` for root typecheck command.
- Completion action returned:
  - `action:ff453676-50bd-405c-bc91-d67f8be06bc4`.
  - `work-event:9bcc86c3-1dd9-4915-a034-fbba39a2dc17`.
- Completion helper also created active state key `external.dogfood_independent_execution_layer_test_recorded = needs_review`.

Checks:

- Passed: structured evidence records created.
- Passed: completion action/work event created.
- Passed: helper explicitly stated it does not commit/reject proposals.
- Product concern: completion proof creates committed `external.*` state, which can read like a durable state transition rather than proof-only recording.

Review needed:

- Product judgment and authority-boundary review.

## Attempt 09: Evidence Pack, Session Trace, Completion Proof Flow

Attempted task:

- Inspect Evidence Pack, Session Trace, and Work brief after recording proof.

Expected behavior:

- Evidence Pack should show command and skipped evidence rows.
- Session Trace should preserve gaps.
- Work brief should show recent work events in a discoverable field.

Exact commands run:

```bash
curl -sS 'http://localhost:3000/api/evidence-pack?scope=project:augnes&work_id=AG-001' | jq '{commands_run:.verification_trace.commands_run, skipped_checks:.verification_trace.skipped_checks, action_refs:.action_refs, gaps:.gaps}'
curl -sS 'http://localhost:3000/api/sessions/trace?scope=project:augnes' | jq '{scope, count:(.sessions|length), sessions:[.sessions[] | {session_id, surface, related_work_id, gaps}]}'
curl -sS 'http://localhost:3000/api/work/AG-001/brief?scope=project:augnes' | jq 'keys'
curl -sS 'http://localhost:3000/api/work/AG-001/brief?scope=project:augnes' | jq '.work_trace // .trace_events // .events // .recent_events // .work_events // empty'
```

Actual behavior:

- Evidence Pack showed both structured evidence rows.
- Evidence Pack preserved gaps for replay, duplicate-block, publication, approval, readiness, and delivery traces.
- Session Trace showed one seeded session with gaps: `unbound_session`, `missing_related_work_id`, `no_verification_evidence_records_linked`.
- Work brief keys include `recent_events`, not `trace_events`.
- Querying `trace_events` would silently return null, making it easy for an evaluator to miss work events.

Checks:

- Passed: Evidence Pack consumed evidence rows.
- Passed: Session Trace preserved gaps.
- Passed: Work brief includes recent events.
- Partial: event field naming is not obvious to users following "trace spine" wording.

Review needed:

- Docs and product/design.

## Attempt 10: Temporal Interpretation And Review-Artifact Flow

Attempted task:

- Exercise read-only Temporal Preview and review artifact boundaries.

Expected behavior:

- Temporal Preview should work without OpenAI key via mock fallback.
- Review artifact capture should reject malformed or authority-confusing input.
- Smoke tests should verify idempotency and forbidden persistence.

Exact commands run:

```bash
curl -sS -X POST 'http://localhost:3000/api/temporal-interpretation/preview' -H 'content-type: application/json' -d '{"scope":"project:augnes"}' | jq '{mode, preview_kind:(.preview.preview_kind // .preview.kind // null), evidence_anchor_count:(.preview.evidence_anchors|length), summary_ref_count:(.preview.summary_refs|length), current_interpretation:(.preview.current_interpretation // null), warnings:(.warnings // [])}'
curl -sS -i -X POST 'http://localhost:3000/api/temporal-interpretation/review-artifacts/capture' -H 'content-type: application/json' -d '{"scope":"project:augnes","work_id":"AG-TEMPORAL-INTERPRETATION","reviewer_verdict":"approved","guardrail_passed":true,"source_route":"https://example.com/not-local-api","summary":"invalid route dogfood"}' | sed -n '1,80p'
npm run smoke:temporal-preview
npm run smoke:temporal-route-review-report
npm run smoke:temporal-capture-route
```

Actual behavior:

- Temporal Preview returned 6 evidence anchors and 2 summary refs.
- Preview response exposed `current_interpretation`, but queried `mode` and `preview_kind` were null at the top-level paths used.
- Malformed review-artifact capture failed with `manual_review must be an object`, before reaching the intentionally bad route/verdict fields.
- Temporal smokes passed and confirmed guardrails, idempotency, conflict behavior, payload bounds, no raw idempotency key storage, no OpenAI/GitHub calls, and no protected authority row mutation.

Checks:

- Passed: Temporal Preview works without OpenAI key.
- Passed: route rejects malformed review artifact capture.
- Passed: temporal smokes.
- Partial: error precedence hid the more security-relevant invalid fields in the test payload.

Review needed:

- Engineering and security review for validation error prioritization.

## Attempt 11: Authority-Boundary Negative Tests

Attempted task:

- Probe routes that could otherwise pressure approval, publish, Codex execution, session creation, or local tool authority.

Expected behavior:

- Requests should fail closed with clear errors and no external side effects.

Exact commands run:

```bash
curl -sS -i -X POST 'http://localhost:3000/api/publications/pub-dogfood-missing/publish/github-pr-comment' -H 'content-type: application/json' -d '{}' | sed -n '1,40p'
curl -sS -i -X POST 'http://localhost:3000/api/publication-readiness-checks/readiness-dogfood-missing/publish/github-pr-comment' -H 'content-type: application/json' -d '{"dry_run":false,"idempotency_key":"dogfood-boundary-test","target":{"surface":"github_pr_comment","owner":"Aurna-code","repo":"augnes","pr_number":1},"body":"dogfood boundary test"}' | sed -n '1,80p'
curl -sS -i -X POST 'http://localhost:3000/api/publication-approval-requests/approval-request-dogfood-missing/approve' -H 'content-type: application/json' -d '{"decided_by":"codex","decision_reason":"negative boundary test","post_to_github":true}' | sed -n '1,80p'
curl -sS -i -X POST 'http://localhost:3000/api/sessions/bind' -H 'content-type: application/json' -d '{"session_id":"session:dogfood-missing","scope":"project:augnes","surface":"codex","related_work_id":"AG-001"}' | sed -n '1,80p'
curl -sS -i -X POST 'http://localhost:3000/api/actions/run' -H 'content-type: application/json' -d '{"scope":"project:augnes","tool_name":"publish_to_github"}' | sed -n '1,80p'
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_SESSION_ID=session:dogfood-missing CODEX_SESSION_SURFACE=codex CODEX_WORK_ID=AG-001 npm run codex:bind-session
```

Actual behavior:

- Legacy publication-id GitHub publish route returned `410 Gone` with clear boundaries.
- Readiness publish route returned `400 Bad Request` with `body is not accepted by the Core-gated GitHub PR comment publish route.`
- Approve route rejected `post_to_github` with a clear message.
- Session bind rejected unknown session with `404`.
- Invalid local tool rejected with `tool_name must be one of the local Augnes tools.`
- Codex bind-session helper failed closed with the runtime's 404 body.

Checks:

- Passed: disabled legacy publish route.
- Passed: approval override rejected.
- Passed: unknown session failed closed.
- Passed: invalid local tool rejected.
- Partial: readiness publish route error was terse and did not say which request field was invalid.

Review needed:

- Security, engineering, docs.

## Attempt 12: Codex Handoff Helper Chain

Attempted task:

- Run the handoff check described by the workflow docs.

Expected behavior:

- Root package scripts should expose documented Codex helper commands or docs should specify the app package path.

Exact commands run:

```bash
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-001 npm run codex:handoff-check
env AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes CODEX_WORK_ID=AG-001 npm --prefix apps/augnes_apps run codex:handoff-check
```

Actual behavior:

- Root command failed: `npm error Missing script: "codex:handoff-check"`.
- App-prefix command passed and recorded `action:49913eaa-e6a0-4a45-a85a-c117a7280e9f`.
- The handoff check created state key `external.codex_handoff_check_recorded`.

Checks:

- Failed: root script advertised by workflow as an existing component is missing.
- Passed: app package helper works.
- Product concern: a "check" command writes action/state proof in the runtime, which may surprise users expecting a read-only validation.

Review needed:

- Docs, product judgment, authority-boundary review.

## Attempt 13: Report Quality And Next-Goal Generation

Attempted task:

- Turn raw findings into reviewable reports and backlog/proposal files without app-code edits.

Expected behavior:

- At least 12 attempts should be documented.
- Report should preserve raw anchors, facts, assumptions, proposals, skipped reasons, top friction, fixes, questions, next goals, and PR recommendations.

Exact commands run:

```bash
mkdir -p reports/dogfood backlog
git status --short
```

Actual behavior:

- Report/backlog files were prepared in allowed paths only.
- `git status --short` before report creation was clean.

Checks:

- Passed: report has 13 attempts.
- Passed: no application-code files modified by this report writing.

Review needed:

- Product, docs, design, engineering, security.

## Top 10 Friction Points

1. Missing required dogfooding docs: four required docs do not exist in this checkout.
2. Initial cwd was not the Augnes checkout, requiring manual discovery.
3. zsh breaks unquoted `?scope=...` curl examples with `no matches found`.
4. README and bridge runbook diverge on whether `db:migrate` is part of runtime quickstart.
5. Five-tab vs six-tab language is spread across docs and script names.
6. State-level `agent_handoff.codex_handoff.work_id` is null while work-specific handoff is useful.
7. Bridge `/healthz` says `profile: public` even when bridge mode is enabled, making operator verification ambiguous.
8. Root `npm run codex:handoff-check` is missing although workflow docs list `npm run codex:handoff-check`.
9. Completion and handoff "proof/check" helpers create `external.*` state transitions, which may blur proof vs committed project state.
10. Some validation errors are terse or ordered in a way that hides the most authority-relevant rejected field.

## Top 5 Immediate Fixes

1. Add or restore the four dogfooding docs, or update the goal docs index to name their replacement files.
2. Quote every URL containing `?` or `&` in README/runbook/handoff examples.
3. Add root `codex:handoff-check` script or update `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` to use `npm --prefix apps/augnes_apps run codex:handoff-check`.
4. Make `/healthz` expose explicit bridge registration status such as `bridgeEnabled: true` and runtime reachability status.
5. Rename or alias old six-tab smoke scripts so the command name does not imply obsolete IA.

## Top 5 Product / Design Questions

1. Should proof helpers commit `external.*` state entries, or should proof live only in action/work/evidence records?
2. Should state-level `agent_handoff` always include a recommended `work_id` when a current work focus exists?
3. Should "check" helpers be read-only by default, with proof recording behind a separate explicit command?
4. Should Cockpit expose a visible "bridge mode enabled" indicator distinct from public profile/directory-safe mode?
5. Should validation responses prioritize authority/security boundary violations over general shape errors?

## Suggested Next Codex /goal Prompts

```text
/goal Fix Augnes dogfood documentation drift only. Add or update the missing dogfooding docs/index references, quote shell-fragile curl URLs, and do not modify runtime behavior.
```

```text
/goal Make Augnes Codex helper scripts and docs consistent. Add a root codex:handoff-check alias or update docs to use the app-prefix command, then run the codex closeout smoke checks.
```

```text
/goal Review Augnes proof-vs-state authority boundaries. Audit record-completion and handoff-check behavior, decide whether external.* state transitions are intended, and propose the smallest implementation or docs-only correction.
```

```text
/goal Build a local Augnes browser regression suite for Cockpit tabs, Perspective preview loading, Operator Evidence Pack, Operator Session Trace, and Bridge boundary copy without writing screenshots to git.
```

```text
/goal Improve Augnes bridge operator observability. Make bridge health distinguish public profile, bridge-enabled tool registration, and runtime reachability without exposing secrets or adding authority.
```

## Recommended PRs

Recommended small implementation PR:

- Add root script alias `"codex:handoff-check": "npm --prefix apps/augnes_apps run codex:handoff-check"` or equivalent, and add a smoke assertion that the root package exposes every helper named by `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`.

Recommended no-code cleanup PR:

- Restore/create dogfooding docs and fix docs drift: quote curl URLs, align quickstart DB migration steps, clarify five-tab Perspective IA vs historical six-tab wording, and document that some helper checks record proof.

Recommended browser/computer-use regression suite:

- Automated local Cockpit suite covering page load, five top-level tabs, Perspective preview load/refresh, Operator Evidence Pack load, Operator Session Trace load, Bridge boundary copy, absence of publish/merge/retry controls, and mobile viewport tab/header sanity. Keep screenshots ephemeral unless a reviewer explicitly asks for committed visual evidence.

## Facts

- No dependency install was required.
- Local runtime started successfully with `OPENAI_API_KEY` unset.
- Root/app typechecks and app smoke/invariants passed.
- Browser Cockpit dogfood passed for main navigation and read-only panels.
- MCP bridge started locally.
- Developer Mode and tunnel checks were skipped with concrete reason: no HTTPS tunnel or ChatGPT Developer Mode session was available.
- Evidence IDs created in temp runtime:
  - `evidence:f66fbc46-5735-4afb-ad48-9a19ede1a745`
  - `evidence:fa153949-6b9a-47af-ae05-8db4eb1499b3`
- Action IDs created in temp runtime:
  - `action:ff453676-50bd-405c-bc91-d67f8be06bc4`
  - `action:49913eaa-e6a0-4a45-a85a-c117a7280e9f`

## Assumptions

- Temp DB proof writes are acceptable for dogfood because application code and default repo DB files were not modified.
- Missing dogfooding docs are unintentional unless another branch or external context owns them.
- Browser DOM snapshots are sufficient evidence for this report because the prompt did not require committed screenshots.

## Improvement Proposals

- Treat every shell-visible command in docs as copy-paste tested under zsh and bash.
- Add a dogfood-specific "read first" index that names current canonical files and superseded files.
- Split "record proof" commands from "check only" commands in naming and docs.
- Add structured bridge health fields for public profile, bridge env, registered bridge tools, and runtime reachability.
- Add regression checks that assert no authority-bearing controls appear in Perspective, Bridge, or Operator outside explicitly scoped future PRs.
