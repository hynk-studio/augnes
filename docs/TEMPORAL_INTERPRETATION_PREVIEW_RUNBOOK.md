# Temporal Interpretation Preview v0.1.1 Runbook

## What This Is

Temporal Interpretation Preview v0.1.1 is a read-only demo slice that generates a PerspectiveSnapshot-like interpretation from current Augnes project context. It preserves evidence anchors, summary refs, source authority profile, counterexamples, residual tensions, transition relation, active context admission rationale, suppressed alternatives, temporal hierarchy, memory lifecycle, interpretive drivers, a safe next step, and an explicit non-authority boundary.

v0.1.1 adds qualitative research-model fields for reviewer-visible structure:

- active context admission rationale
- suppressed alternatives
- temporal hierarchy
- memory lifecycle
- interpretive drivers
- qualitative axis pressures

These fields are not DB schema, numeric scoring, rule-vector formula runtime, automatic memory admission, durable authority, or governance runtime. This is not full P4 PerspectiveSnapshot implementation. It adds no database table, migration, durable snapshot authority, runtime write behavior, rule runtime, approval authority, publication authority, or automatic promotion.

## API Route

```bash
curl -s -X POST "http://localhost:3000/api/temporal-interpretation/preview" \
  -H "Content-Type: application/json" \
  -d '{"scope":"project:augnes"}' | jq .
```

The route returns:

- `generator`: `mock`, `openai`, or `mock_fallback`
- `preview`: the temporal interpretation preview fields
- `guardrails`: deterministic local guardrail result
- `boundaries`: read-only/non-authority boundaries

## OpenAI Use

When `OPENAI_API_KEY` is set, the route calls the OpenAI Responses API with `fetch` and requests strict JSON output. `OPENAI_MODEL` is honored when set; otherwise the route uses the same default model family as the existing planner, `gpt-4.1-mini`.

The Cockpit panel does not call this route automatically on page load. OpenAI usage from the UI is explicit and button-triggered: the user clicks `Generate Preview` or `Refresh Preview` to request the read-only preview.

OpenAI is used because this preview is interpretive: it must relate current state, prior context, counterexamples, residual tensions, and authority boundaries in natural language while preserving structured anchors. The runtime still validates the returned structure and runs deterministic guardrails locally.

If OpenAI fails, the route returns a deterministic mock fallback with a warning. Local demos do not require network access.

## Run Without OpenAI

```bash
cd ~/code/augnes
npm install
npm run db:reset
npm run demo:seed
npm run dev -- --port 3000
```

Then open `http://localhost:3000`, inspect the `Temporal Interpretation Preview` panel, and click `Generate Preview`, or call the route with curl. With no `OPENAI_API_KEY`, `generator` is `mock`.

## Run With OpenAI

Set environment variables in your shell or `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Then run the app:

```bash
npm run dev -- --port 3000
```

Never commit `.env.local`, API keys, local secrets, generated SQLite files, screenshots, or unrelated generated outputs.

## Guardrails

The route runs deterministic guardrails that check:

- `non_authority_boundary` is present.
- `active_context_admission_rationale` is present and non-empty.
- Summary-only support is not used as an evidence anchor.
- `blocked_now` actions are not listed as `allowed_now`.
- User preference is not treated as factual readiness or implementation approval.
- Counterexamples from context are preserved.
- Residual tensions from context are preserved.
- `transition_relation` is one of `continuity`, `revision`, `drift`, `branch`, `reversal`, `suspension`.
- `interpretive_drivers` use only the fixed Axis Bank: `factuality`, `continuity`, `user_context`, `boundary`, `exploration`, `implementation`, `stability`, `revision`.
- `suppressed_alternatives` are not treated as false claims or permanent rejections.
- `axis_pressures` use qualitative labels only and do not include numeric values.
- The preview does not claim full P4 implementation readiness by default.

Route smoke check:

```bash
npm run smoke:temporal-preview
```

This smoke command expects the Next dev server to already be running at `http://localhost:3000` unless `AUGNES_API_BASE_URL` is set.

## Cockpit Panel

The Runtime Cockpit includes a read-only `Temporal Interpretation Preview` panel. It starts as not generated and only requests preview output after the user clicks `Generate Preview` or `Refresh Preview`. It shows:

- current interpretation
- active prior context
- active context admission rationale
- suppressed alternatives
- temporal hierarchy
- memory lifecycle
- interpretive drivers
- qualitative axis pressures
- evidence anchors
- summary refs
- source authority profile
- counterexamples
- residual tensions
- transition relation
- safe next step
- non-authority boundary
- guardrail warnings

The panel has only explicit generate/refresh controls. It does not commit, reject, approve, publish, retry, record proof, mutate mailbox state, or promote rules.

## Intentionally Not Implemented

- Durable PerspectiveSnapshot persistence.
- DB schema or migrations.
- Runtime write behavior.
- State/proof/publication/mailbox mutation.
- Approval, publish, retry, proof, or rule authority.
- RuleCandidate runtime.
- PromotedRule runtime.
- Automatic rule promotion.
- Automatic scoring thresholds.
- ChatGPT App tool surface.
- Control Packet contract change.
- Production deployment assumptions.
