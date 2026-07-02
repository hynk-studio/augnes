# Agent Workplane Legacy Cockpit Control Inventory v0.1

## Status And Scope

Status: Legacy Cockpit DOM/manual control inventory + proposal diff preflight
v0.1.

This slice follows Legacy Cockpit Local Control Classification v0.1 and the
Repeated Augnes-on-Augnes Dogfood / Metrics Baseline v0.2. It reduces the
generic unknown local UI control blocker only when server-rendered DOM/manual
evidence exists, and it adds a lightweight proposal diff readiness preflight.

This was not a Legacy Cockpit deletion PR and not an authority expansion. No
Legacy Cockpit functionality was deleted, hidden, disabled, or absorbed into
native Workplane. Legacy Cockpit Shrink v0.1 later moved the full Cockpit from
the `/workbench` compatibility island to the explicit `/cockpit` compatibility
route. Future native absorption of retained local-write/manual controls
requires a separate authority contract.

## Why This Exists

PR #933 classified 27 Legacy Cockpit local controls and deliberately left one
unknown/manual-review blocker:

- 14 native read/copy/preview candidates;
- 9 compatibility-only controls;
- 3 forbidden controls;
- 1 unknown/manual-review blocker.

PR #934 then ran repeated dogfood/metrics baselines and kept shrink gated. This
v0.1 inventory answers the next narrow question: does the currently
server-rendered compatibility island show enough DOM/manual evidence to reduce
the unknown bucket, and does Review / Memory proposal visibility have enough
read-only proposal diff detail to reduce review burden?

## What The Helper Does

`lib/workplane/legacy-cockpit-control-inventory.ts` builds a read-only report
from supplied inputs:

- server-rendered `/workbench` HTML;
- optional compatibility-island HTML;
- optional source text;
- optional manual DOM evidence;
- the previous #933 local-control classification;
- proposal diff source text.

The helper does not fetch `/workbench` by itself. It does not write files,
create routes, mutate product state, call providers, call GitHub, launch Codex,
execute runners, or use browser storage. It is pure and input-driven.

## Control Classes

The inventory collapses the #933 classification into the control classes needed
for this preflight:

- `read_only`
- `copy_only`
- `preview_only`
- `local_write`
- `forbidden`
- `unknown`

`local_draft` controls from #933 are treated as `local_write` for this
preflight because native absorption still requires a separate authority
contract.

## Evidence Model

Evidence can be:

- `server_rendered_html`: labels or markers observed in supplied `/workbench`
  HTML;
- `manual_dom_review`: human or DOM-capable browser review evidence supplied to
  the helper;
- `static_source`: source text hints;
- `classification_v0_1`: inherited #933 classification context.

Evidence statuses are:

- `observed`
- `inferred`
- `not_observed`
- `needs_manual_review`

Unknown reduction is allowed only when observed DOM/manual evidence exists. If
no evidence exists, the previous unknown/manual-review blocker remains.

## Unknown Bucket Before And After

Before this slice, #933 has one unknown/manual-review blocker:
`unknown_legacy_browser_manual_controls`.

With pre-shrink supplied server-rendered `/workbench` evidence showing the
Legacy Cockpit compatibility marker, compatibility copy, the six-tab Cockpit
shell, and Perspective controls such as Formation Basis and Manual Gravity,
the helper can reduce the inspected server-rendered unknown bucket from 1 to
0. After Legacy Cockpit Shrink v0.1, the six-tab Cockpit shell is expected at
`/cockpit`, not inside `/workbench`.

That reduction is deliberately narrow. It means no extra unclassified controls
were observed in the inspected server-rendered compatibility island. It does
not mean Legacy Cockpit shrink is ready, and it does not grant native
absorption authority.

If the evidence is absent or weaker than the helper requires, the unknown count
stays at 1 and shrink remains blocked by the unknown bucket.

## Proposal Diff Preflight

The proposal diff preflight is read-only. It looks for evidence that proposal
review exposes enough context to reduce review burden, such as:

- proposal diff marker;
- delta summaries;
- source refs;
- merge policy;
- non-goals;
- candidate detail;
- before/after detail;
- field-level change detail;
- impact detail.

If the source says richer proposal diff detail is missing, or if before/after,
field-level, or impact detail is absent, the preflight returns
`needs_richer_detail`. It does not implement apply, approve, reject, commit, or
proposal mutation.

## What This Does Not Do

- no Legacy Cockpit deletion;
- no full Legacy Cockpit source deletion;
- no hiding or disabling retained Cockpit compatibility;
- no compatibility path removal;
- no native absorption of local-write controls;
- no product UI behavior change;
- no product route beyond the explicit `/cockpit` compatibility route;
- no API write route;
- no server action;
- no chat composer;
- no execution, apply, approve, reject, or commit control;
- no provider/OpenAI call;
- no GitHub call or actuation;
- no Codex launch or execution;
- no runner execution, runner tick, runner recovery write, or scheduled runner
  behavior in product UI;
- no product DB write or persistence;
- no proof/evidence write;
- no durable memory apply;
- no Perspective apply;
- no delta auto-apply;
- no localStorage/sessionStorage durable view mode;
- no merge, publish, retry, replay, or deploy behavior.

## Authority Boundary

The report includes an authority boundary denying:

- product DB writes;
- Legacy Cockpit delete/shrink/hide;
- product UI behavior changes;
- product route, API write route, server action, and chat composer;
- provider/OpenAI/GitHub/Codex authority;
- runner execution/tick/recovery/scheduling in product UI;
- proof/evidence writes;
- durable memory, Perspective, and delta apply;
- merge/publish/retry/replay/deploy;
- native absorption of local-write controls without a separate contract;
- proposal approve/reject/commit.

## Shrink Readiness

Shrink remains gated unless every gate is green:

- compatibility path present;
- native replacement exists;
- stable panel/node/source refs exist;
- browser regression remains healthy;
- dogfood/metrics baselines show readiness;
- local control inventory has no unknown or local-write blockers;
- rollback remains available;
- human review approves a separate shrink candidate.

This inventory can reduce the inspected unknown bucket, but it is evidence, not
shrink authority. Local-write controls still block native absorption until a
separate authority contract exists. Proposal diff preflight may still require
richer read-only detail before review burden can be claimed as improved.

## How To Run

```bash
npm run smoke:legacy-cockpit-control-inventory-v0-1
```

Useful paired checks:

```bash
npm run smoke:augnes-dogfood-metrics-baseline-v0-2
npm run smoke:legacy-cockpit-local-control-classification-v0-1
npm run smoke:workplane-native-browser-regression-v0-1
```

For local HTML validation:

```bash
AUGNES_DB_PATH=/tmp/augnes-control-inventory-v0-1.db npm run dev -- --port 3000
```

Then verify `/workbench` returns 200 and contains
`data-workplane-panel-id="legacy_cockpit_compatibility"`.

## Recommended Next Phase

- If proposal diff preflight remains `needs_richer_detail`, add richer
  read-only proposal diff detail without apply/commit/reject authority.
- If local-write controls are to move natively, define a separate authority
  contract first.
- Consider a Legacy Cockpit shrink candidate only after all browser,
  dogfood/metrics, inventory, rollback, and human-review gates are green.
