# Augnes Dogfood Metrics Baseline v0.2

Status: Repeated Augnes-on-Augnes Dogfood / Metrics Baseline v0.2.

Scope: local harness, aggregate report, docs, package scripts, and smoke only.
This is not a Legacy Cockpit deletion PR, not a shrink candidate PR, and not an
authority expansion PR.

No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled.
Compatibility path remains rendered through `LegacyCockpitCompatibilityPanel`
wrapping `AugnesCockpit`. Future deletion requires a separate PR.

Baseline reports are evidence/signals, not shrink authority. Browser
regression, metrics, dogfood, and classification are evidence/signals, not
shrink authority. Local-write controls require a separate authority contract
before native absorption.

## 1. Why Repeated Baseline Exists

The first Augnes-on-Augnes dogfood harness and Runner / Workplane Metrics pass
proved that deterministic local fixtures can expose recovered runner
DeltaBatch, GuideBrief debug packets, Intent Projection, and metrics signals.
One run is not enough to answer whether the native Agent Workplane actually
improves next-session readiness.

This v0.2 baseline repeats deterministic dogfood iterations and aggregates the
results so reviewers can ask:

- Is resume latency improving or still insufficient?
- Is review burden improving or still insufficient?
- Are recovered DeltaBatches useful or noisy?
- Are GuideBrief debug and Intent Projection useful after native detail
  hardening?
- Does browser regression stay structurally healthy across repeated baseline
  runs?
- Does local control classification reduce shrink uncertainty, or does
  unknown/manual review still block?
- Is Legacy Cockpit shrink still gated?

## 2. Why After Local Control Classification

Legacy Cockpit Local UI Control Classification v0.1 identified read/copy,
preview/local-draft, compatibility-only, forbidden, and unknown/manual-review
controls. That classification is a necessary input because native Workplane
readiness is not only about source coverage; it is also about which local
controls may be absorbed and which controls must remain compatibility-only.

The current classification still has an unknown/manual-review blocker, so
`local_control_classification_readiness` remains `needs_review` and shrink
remains gated.

## 3. Why Before Any Shrink Candidate

This baseline happens before any shrink candidate because shrink requires
sustained evidence that native panels preserve useful continuity without
absorbing forbidden or local-write authority. A future shrink candidate must
already have green baseline, browser, metrics, dogfood, local-control,
rollback, and human review gates.

This baseline does not satisfy those gates by itself. It records signals for
review.

## 4. What The Baseline Harness Does

The harness:

- creates a temp baseline output directory by default;
- runs two or more deterministic Augnes-on-Augnes dogfood fixture iterations,
  with three iterations as the default;
- uses temp runner ledger paths only;
- writes each v0.1 dogfood report under the temp/output directory;
- writes one aggregate JSON report under the temp/output directory;
- optionally parses supplied browser regression HTML or GETs an explicitly
  supplied dev-server `/workbench` URL;
- builds a default local-control classification read;
- aggregates status, trend, caveats, source refs, and recommended next reviews.

Product `/workbench` render remains read-only and must not create fixture runs.
The explicit dogfood baseline script/smoke may create temp runner ledger
fixtures using existing runner/dogfood helpers.

## 5. What The Baseline Harness Does Not Do

The baseline does not add product UI action authority.

- no Legacy Cockpit deletion
- no Legacy Cockpit shrink
- no hiding of Cockpit content
- no compatibility path removal
- no product route is added
- no API write route is added
- no server action is added
- no chat composer is added
- no provider/OpenAI/GitHub/Codex execution is added
- no Codex launch, branch creation, PR creation, merge, publish, retry, replay,
  or deploy is added
- no runner execution is added to product UI
- no runner tick is added to product UI
- no runner recovery write is added to product UI
- no scheduled runner behavior is added
- no product DB write or persistence is added
- no proof/evidence write is added
- no durable memory apply is added
- no Perspective apply is added
- no delta auto-apply is added
- no localStorage/sessionStorage durable view mode is added
- no product UI action authority is added
- no native absorption of local-write controls is added

## 6. Iteration Model

Each iteration runs the existing Augnes-on-Augnes dogfood v0.1 fixture against a
separate temp runner ledger. The iteration records:

- dogfood status;
- recovered batch id;
- recovered delta count;
- metrics status;
- dogfood readiness;
- cockpit shrink readiness;
- browser regression status when supplied;
- evaluation signal statuses;
- caveats;
- source refs;
- report path.

The default is three deterministic fixture iterations. The minimum meaningful
baseline is two iterations.

## 7. Aggregate Report Model

The aggregate report records:

- baseline version;
- status;
- authority boundary;
- iteration model;
- iteration summaries;
- aggregate signal list;
- trends;
- recovered batch ids and delta counts;
- metrics, dogfood-readiness, and cockpit-shrink-readiness sequences;
- browser regression status and recommendation when supplied;
- local-control classification readiness and unknown count;
- caveats;
- source refs;
- recommended next reviews;
- validation summary naming `smoke:augnes-dogfood-metrics-baseline-v0-2`.

The aggregate keeps shrink gated even when repeated fixture iterations pass.

## 8. Trend Model

Trend values are:

- `improving`
- `steady`
- `degrading`
- `insufficient_data`
- `unknown`

If a signal has fewer than two meaningful datapoints, the trend is
`insufficient_data`. If the meaningful status sequence improves, the trend is
`improving`. If it stays stable, the trend is `steady`. If it worsens, the
trend is `degrading`. Mixed movement is `unknown`.

## 9. Signal Definitions

Signals:

- `resume_latency`
- `review_burden`
- `delta_batch_quality`
- `guidebrief_debug_usefulness`
- `intent_projection_usefulness`
- `autonomy_yield`
- `stale_context_visibility`
- `cockpit_shrink_readiness`
- `browser_regression_stability`
- `local_control_classification_readiness`

## 10. Resume Latency

Resume latency is evaluated from repeated next-session timing evidence or
explicit operator notes. Dogfood fixture completion alone is not enough.

The v0.2 aggregate keeps `resume_latency` as `insufficient_data` unless enough
repeated evidence is supplied.

## 11. Review Burden

Review burden is evaluated from repeated operator reading effort, proposal diff
detail, or other bounded review-cost evidence. Native source visibility alone
is not enough.

The v0.2 aggregate keeps `review_burden` as `insufficient_data` unless enough
repeated evidence is supplied.

## 12. DeltaBatch Quality

DeltaBatch quality checks whether repeated dogfood fixture runs recover
reviewable runner DeltaBatches with nonzero delta counts and no blocked
validation. Recovered deltas remain review candidates only. They are not
applied, approved, written to memory, or promoted into product state.

DeltaBatch identity separation remains documented and checked:

- `delta_projection` / `perspective_delta` is the native Delta Projection panel.
- `projected_delta_batch` / `perspective_delta` is the projected Delta Batch
  preview.
- `delta_batch` / `runner_delta_batch` is recovered runner DeltaBatch readback.

## 13. GuideBrief Debug Usefulness

GuideBrief debug usefulness checks whether repeated dogfood reports expose
explanatory debug packets for Workplane inspector, recovered runner DeltaBatch,
and projected DeltaBatch context. GuideBrief remains read-only explanatory
context and cannot launch Codex, send handoffs, write state, or grant action
authority.

## 14. Intent Projection Usefulness

Intent Projection usefulness checks whether repeated dogfood reports produce
reversible, non-executable focus context. It remains a view/draft signal and
does not add persistent Workplane mode, handoff sending, Codex launch, or
runner execution.

## 15. Autonomy Yield

Autonomy yield is local deterministic fixture yield: completed local fixture
steps and recovered reviewable deltas. It is not provider output, GitHub
output, Codex output, proof, or product execution.

## 16. Stale Context Visibility

Stale context visibility checks whether source gaps, fallback state, and stale
or empty runtime context remain visible in the repeated baseline. Hidden stale
context would increase next-session risk.

## 17. Browser Regression Stability

Browser regression stability is optional inside the baseline runner and can be
supplied by server-rendered HTML or an explicitly provided dev-server URL. It
checks structural `/workbench` health and marker reachability, but browser
regression is evidence, not shrink authority.

When browser regression returns `browser_regression_passed_shrink_gated`, the
native structure may be healthy while shrink remains gated by metrics,
dogfood, local-control, rollback, and human review.

## 18. Local Control Classification Readiness

Local control classification readiness uses the Legacy Cockpit Local UI Control
Classification v0.1 read. Unknown/manual-review controls keep readiness at
`needs_review`. Local-write controls remain compatibility-only until a
separate authority contract exists.

## 19. Why Shrink Remains Gated

Shrink remains gated because:

- baseline reports are evidence/signals, not shrink authority;
- browser regression is evidence, not shrink authority;
- metrics are signals, not shrink authority;
- dogfood reports are evidence, not shrink authority;
- classification is evidence/signaling, not shrink authority;
- local-write controls require a separate authority contract before native
  absorption;
- unknown/manual-review controls still block shrink;
- rollback and human review gates are not satisfied by this harness.

## 20. How To Run

Run the repeated baseline:

```bash
npm run dogfood:augnes-metrics-baseline-v0-2
```

Run the smoke:

```bash
npm run smoke:augnes-dogfood-metrics-baseline-v0-2
```

Optional environment variables:

- `AUGNES_BASELINE_ITERATIONS`
- `AUGNES_BASELINE_OUTPUT_DIR`
- `AUGNES_BASELINE_BROWSER_REGRESSION_URL`
- `AUGNES_BASELINE_SKIP_BROWSER_REGRESSION`

The runner does not start a dev server by default.

## 21. Output Report Shape

The aggregate JSON contains:

- `report_version`
- `status`
- `scope`
- `created_at`
- `iteration_model`
- `authority_boundary`
- `iterations`
- `aggregate`
- `recommended_next_reviews`
- `caveats`
- `source_refs`
- `validation_summary`

Each iteration includes `dogfood_status`, `recovered_batch_id`,
`recovered_delta_count`, `metrics_status`, `dogfood_readiness_status`,
`cockpit_shrink_readiness_status`, `browser_regression_status`,
`evaluation_signal_statuses`, caveats, source refs, and the temp report path.

## 22. Authority Boundary

The baseline authority boundary denies:

- `can_write_product_db`
- `can_delete_legacy_cockpit`
- `can_shrink_legacy_cockpit`
- `can_hide_legacy_cockpit`
- `can_change_product_ui_behavior`
- `can_add_product_route`
- `can_add_api_write_route`
- `can_add_server_action`
- `can_call_provider_openai`
- `can_call_github`
- `can_actuate_github`
- `can_execute_codex`
- `can_execute_runner_in_product`
- `can_tick_runner_in_product`
- `can_recover_delta_batch_in_product`
- `can_schedule_runner_in_product`
- `can_record_proof`
- `can_create_evidence`
- `can_apply_durable_memory`
- `can_apply_perspective`
- `can_auto_apply_delta`
- `can_merge_publish_retry_replay_deploy`
- `can_absorb_local_write_control_without_contract`

Only the explicit local baseline harness may allow:

- `can_create_temp_runner_fixture: true`
- `can_tick_temp_runner_fixture: true`
- `can_recover_temp_delta_batch_fixture: true`
- `can_write_temp_baseline_artifact: true`

Product code must not use those fixture permissions.

## 23. What Remains Blocked

- resume latency improvement claim;
- review burden improvement claim;
- local-write native absorption;
- unknown/manual Legacy Cockpit control clearance;
- Legacy Cockpit shrink;
- Legacy Cockpit deletion;
- any external authority or product write path.

## 24. Recommended Next Phase

Recommended next phase is:

- DOM/manual legacy-control inventory if the unknown blocker remains;
- richer proposal diff detail if review burden remains high or
  `insufficient_data`;
- repeated baseline with browser regression attached;
- Legacy Cockpit Shrink Candidate only if all gates are green, which is
  unlikely for v0.2.
