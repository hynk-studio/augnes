# Augnes-on-Augnes Dogfood v0.1

## 1. Status and Scope

Status: Longer Augnes-on-Augnes Dogfood v0.1.

Scope: this slice adds a bounded local dogfood harness, JSON report, docs, and
smoke coverage for using Augnes to inspect Augnes. It uses existing Agent
Workplane, GuideBrief Workplane Debug Context, GuideBrief Intent Projection,
Runner / Workplane Metrics, local runner records, recovered DeltaBatch
readback, and Codex handoff candidate surfaces to evaluate whether the next
Augnes development session becomes easier.

dogfood is a local harness, not product execution authority.

## 2. Why Augnes-on-Augnes Dogfood Exists

Augnes has native Workplane panels, stable Workplane node IDs, recovered runner
DeltaBatch readback, GuideBrief debug context, GuideBrief intent projection,
and Runner / Workplane Metrics. The next question is whether those pieces make
the next development session clearer: faster resume, less irrelevant reading,
better recovered deltas, more useful handoff context, and visible stale or
fallback status.

The dogfood harness answers that with a repeatable local fixture and report.
It does not claim product readiness, approval, proof, evidence, deletion
authority, or auto-apply authority.

## 3. Why It Runs Before Legacy Cockpit Shrink

Legacy Cockpit still contains useful compatibility content. Shrink planning
should follow observed Workplane, GuideBrief, runner, and metrics signals, not
confidence in new panels alone.

The dogfood report recommends Legacy Cockpit Shrink Plan v0.1 only if dogfood
and metrics indicate readiness. Otherwise it recommends another dogfood or
metrics baseline PR.

## 4. What the Harness Does

`lib/dogfood/augnes-on-augnes-dogfood.ts` supports two modes:

- Pure build mode from supplied fixtures.
- Explicit local dogfood fixture mode with a supplied temp `dbPath`.

The explicit fixture mode:

- creates a deterministic local autonomy run in the supplied temp runner
  ledger path;
- ticks the deterministic run to completion through existing runner APIs;
- recovers a DeltaBatch through existing runner APIs;
- reads the recovered DeltaBatch through the Workplane runner DeltaBatch
  readback helper;
- builds Agent Workplane node context from the resulting read packet;
- builds GuideBrief Workplane Debug Context for
  `workplane_inspector / source_ref_bridge`,
  `delta_batch / runner_delta_batch`, and
  `projected_delta_batch / perspective_delta`;
- builds GuideBrief Intent Projection for:
  `Focus the Workplane on runner and DeltaBatch review.`
  and `Prepare this state for Codex handoff.`;
- builds Runner / Workplane Metrics from the same fixture and supplied
  Workplane / GuideBrief context;
- produces a JSON dogfood report with evaluation signals.

## 5. What the Harness Does Not Do

The harness does not add product authority. It does not add a new product UI
panel, product route, API write route, server action, chat composer,
persistent Workplane mode, UI action authority, product runner execution,
product runner tick, product runner recovery write, scheduled runner behavior,
external authority, product DB write, proof/evidence write, durable memory
apply, Perspective apply, delta auto-apply, or Legacy Cockpit shrink.

## 6. Agent Workplane

The harness uses Agent Workplane read context and node context as the local
inspection surface. It keeps the required DeltaBatch identities distinct:

- `delta_projection / perspective_delta` is the native Delta Projection panel.
- `projected_delta_batch / perspective_delta` is projected DeltaBatch preview
  context.
- `delta_batch / runner_delta_batch` is recovered runner DeltaBatch readback.

Product /workbench render remains read-only.

## 7. GuideBrief Workplane Debug Context

The dogfood report records whether GuideBrief explains why Workplane shows the
selected contexts. It preserves Observed, Inferred, Suggested, and Needs user
judgment separation.

GuideBrief debug creates preview-only context. No GuideBrief execution
authority is added.

## 8. GuideBrief Intent Projection

The harness builds reversible, dismissible view/draft intent projections for
runner and DeltaBatch review plus Codex handoff preparation. Candidate actions,
handoffs, runner configs, and Perspective updates remain draft packets only.

No executable projection is added. No chat composer is added. No
localStorage/sessionStorage durable view mode is added.

## 9. Runner / Workplane Metrics

The harness passes the temp runner fixture, Workplane context, node context,
GuideBrief debug context, and Intent Projection into Runner / Workplane
Metrics. Metrics remain signals, not execution authority or auto-apply
decisions.

The dogfood metrics distinguish projected vs recovered DeltaBatch signals by
checking `projected_vs_recovered_deltabatch_identity_signal` and recovered
DeltaBatch visibility separately.

## 10. Local Runner and Recovered DeltaBatch Fixture

Suggested deterministic run:

- scope: `project:augnes`
- run id: `autonomy_run.dogfood.augnes_on_augnes_v0_1`
- title: `Augnes-on-Augnes Dogfood v0.1`
- autonomy contract ref: `autonomy_contract.dogfood.augnes_on_augnes_v0_1`
- created at: `2026-07-02T00:00:00.000Z`
- source refs include this doc, workflow metrics, GuideBrief Intent
  Projection, GuideBrief Workplane Debug Context, and `hynk-studio/augnes`

The fixture uses existing default runner steps. Recovered deltas are review
candidates only.

## 11. Temp Fixture Writes vs Product Render Paths

temp runner fixture writes are allowed only in the explicit script/smoke path.
product /workbench render remains read-only.
The script creates a temp directory under the OS temp directory by default and
uses a temp SQLite runner ledger. `AUGNES_DOGFOOD_DB_PATH` can explicitly
override that path.

Product render paths must not create fixture runs. No runner execution is
added to product UI. No runner tick is added to product UI. No runner recovery
write is added to product UI. No scheduled runner behavior is added.

Exact product boundary statements:

- no runner execution is added to product UI
- no runner tick is added to product UI
- no runner recovery write is added to product UI
- no scheduled runner behavior is added
- no GuideBrief execution authority is added
- no route is added
- no API write route is added
- no server action is added
- no chat composer is added
- no provider/OpenAI/GitHub/Codex execution is added
- no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy is added
- no product DB write or persistence is added
- no proof/evidence write is added
- no durable memory apply is added
- no Perspective apply is added
- no delta auto-apply is added
- no localStorage/sessionStorage durable view mode is added
- no legacy Cockpit functionality is deleted or shrunk

## 12. Evaluation Criteria

The report evaluates:

- Resume Latency: did the next session start faster or have clearer next
  action?
- DeltaBatch Quality: were recovered deltas useful or noisy?
- GuideBrief Debug Usefulness: did GuideBrief explain why Workplane showed
  what it showed?
- Intent Projection Usefulness: did user intent become a useful work mode?
- Review Burden: did the user need to read less irrelevant material?
- Autonomy Yield: how many meaningful deltas, artifacts, or next actions per
  run?
- Stale Context Visibility: did stale or fallback status become visible?
- Cockpit Shrink Readiness: is native absorption ready enough for shrink
  planning?

Each signal includes `signal_id`, `status`, `summary`, `evidence_refs`,
`metric_refs`, `caveats`, and `recommended_next_review`.

## 13. How to Run

```bash
npm run dogfood:augnes-on-augnes-v0-1
npm run smoke:augnes-on-augnes-dogfood-v0-1
```

The dogfood script prints a concise JSON summary with dogfood version, status,
temp DB path, report path, run id, recovered batch id, metrics status,
evaluation signal statuses, and authority boundary summary.

## 14. Output Report Shape

`AugnesDogfoodReport` includes:

- `report_version`
- `status`
- `scope`
- `created_at`
- `authority_boundary`
- `runner_fixture_summary`
- `workplane_snapshot`
- `guidebrief_snapshot`
- `intent_projection_snapshot`
- `metrics_snapshot`
- `evaluation`
- `artifacts`
- `caveats`
- `recommended_next_review`
- `validation_summary`

## 15. Authority Boundary

The boundary denies:

- `can_write_product_db_from_workbench`
- `can_call_provider_openai`
- `can_call_github`
- `can_actuate_github`
- `can_execute_codex`
- `can_create_branch_or_pr`
- `can_apply_project_perspective`
- `can_apply_durable_memory`
- `can_auto_apply_delta`
- `can_record_proof`
- `can_create_evidence`
- `can_send_handoff`
- `can_merge_publish_retry_replay_deploy`
- `can_delete_or_shrink_legacy_cockpit`
- `can_add_product_route`
- `can_add_server_action`
- `can_add_ui_execution_control`

The explicit local script/smoke fixture may allow:

- `can_create_temp_runner_fixture`
- `can_tick_temp_runner_fixture`
- `can_recover_temp_delta_batch_fixture`
- `can_write_temp_dogfood_artifact`

Those fixture permissions are not product permissions.

## 16. Empty and Insufficient-Data Behavior

Pure build mode can produce an empty report. Empty runner data records
`insufficient_data` instead of pretending that resume latency, review burden,
or shrink readiness passed.

The product `/workbench` render does not create fixture runs to make metrics
or Dogfood readiness look populated.

## 17. Browser Sanity Expectation

Because this PR adds a script/doc dogfood harness and does not change
`/workbench` UI, browser validation is useful but not mandatory. A sanity pass
should verify:

- `/workbench` renders;
- `data-workplane-metrics-panel="v0.1"` is present;
- `data-guide-workplane-debug-panel="v0.1"` is present;
- `data-guide-intent-projection-panel="v0.1"` is present;
- `data-workplane-intent-mode-panel="v0.1"` is present;
- `data-workplane-panel-id="delta_projection"` is present;
- `data-workplane-panel-id="projected_delta_batch"` is present;
- `data-workplane-panel-id="delta_batch"` is present.

## 18. What Is Not Implemented Yet

- no Legacy Cockpit shrink
- no deletion of Cockpit content
- no dogfood-driven auto decision
- no executable projection in product
- no Workplane persistent mode
- no user dogfood input UI
- no prompt/chat composer
- no execution button
- no apply/approve/reject control
- no route is added
- no API write route is added
- no server action is added
- no provider/OpenAI/GitHub/Codex execution is added
- no Codex launch, branch creation, PR creation, merge, publish, retry,
  replay, or deploy is added
- no product DB write or persistence is added
- no proof/evidence write is added
- no durable memory apply is added
- no Perspective apply is added
- no delta auto-apply is added
- no localStorage/sessionStorage durable view mode is added
- no legacy Cockpit functionality is deleted or shrunk

## 19. Recommended Next Phase

Recommended next phase: Legacy Cockpit Shrink Plan v0.1 if dogfood and metrics
indicate readiness. Otherwise run another dogfood or metrics baseline PR.
