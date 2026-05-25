# Augnes Friction Backlog

Last updated: 2026-05-25
Source: `reports/dogfood/2026-05-25-codex-dogfood-run-001.md`

## High Priority

1. Missing required dogfooding docs
   - Review: docs, product judgment
   - Evidence: `docs/AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md`, `docs/RAW_EPISODE_CAPTURE_V0_1.md`, `docs/DOGFOODING_EPISODE_LOG_V0_1.md`, and `docs/DOGFOODING_EVALUATION_CRITERIA_V0_1.md` were absent.
   - Impact: independent evaluator cannot follow the requested dogfood rubric from repo alone.

2. Shell-fragile curl examples
   - Review: docs
   - Evidence: unquoted `curl -sS http://localhost:3000/api/state/brief?scope=project:augnes` failed in zsh with `no matches found`.
   - Impact: default macOS shell copy-paste fails.

3. Proof helpers blur proof and committed state
   - Review: product judgment, security, engineering
   - Evidence: `codex:record-completion` created `external.dogfood_independent_execution_layer_test_recorded = needs_review`; app-prefix `codex:handoff-check` created `external.codex_handoff_check_recorded`.
   - Impact: "proof-only" language may be read as stronger than runtime behavior.

4. Missing root `codex:handoff-check`
   - Review: docs, engineering
   - Evidence: root `npm run codex:handoff-check` failed with `Missing script`, while app-prefix command passed.
   - Impact: documented workflow is not copy-pasteable from repo root.

5. Bridge health ambiguity
   - Review: product judgment, engineering, design
   - Evidence: `/healthz` returned `profile:"public"` with bridge env enabled.
   - Impact: operator cannot confirm bridge-enabled registration from health alone.

## Medium Priority

6. Five-tab/six-tab stale naming
   - Review: docs, design
   - Evidence: current UI has five tabs, Authority Matrix still references six-tab shell boundaries, smoke script name says six-tab.
   - Impact: reviewers may look for Ledger/Proof top-level tabs that have moved into Perspective.

7. State handoff lacks concrete current work ID
   - Review: product judgment
   - Evidence: state brief `agent_handoff.codex_handoff.work_id` was null; `AG-001` work brief had usable handoff context.
   - Impact: handoff flow needs extra operator inference.

8. Terse Core-gated publish validation error
   - Review: engineering, security
   - Evidence: invalid readiness publish request returned `body is not accepted by the Core-gated GitHub PR comment publish route.`
   - Impact: negative test passes, but remediation is unclear.

9. Review-artifact validation error precedence
   - Review: engineering, security
   - Evidence: malformed capture with bad route and forbidden-ish verdict failed first on `manual_review must be an object`.
   - Impact: security-relevant rejected fields may be hidden by shape errors.

10. Control brief vs decision-card naming drift
    - Review: docs, product
    - Evidence: direct `/api/control/brief` response had no `decision_card` field while runbook describes `structuredContent.decision_card` through bridge tool.
    - Impact: runtime route and bridge tool abstractions are easy to conflate.

## Low Priority

11. Initial workspace mismatch
    - Review: docs
    - Evidence: provided cwd was `/Users/hynk/Documents/discord_test`, but Augnes checkout was `/Users/hynk/Documents/augnes`.
    - Impact: extra orientation step for future runs.

12. Work event field naming
    - Review: docs, product design
    - Evidence: Work brief exposes `recent_events`; evaluator initially queried `trace_events`.
    - Impact: trace-spine wording and API field naming are not obvious.
