# Cockpit Local-Only Constellation Route Preview Browser Report

Date: 2026-06-04

## Inspected Cockpit URL

`http://127.0.0.1:3000/#perspective-constellation-route-preview`

The Browser inspection selected the Perspective tab, scoped findings to
`#perspective-constellation-route-preview`, and inspected the visible DOM for
the Cockpit local-only route preview section.

## Local runtime setup used

Runtime setup:

- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed`
- `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --hostname 127.0.0.1 --port 3000`

The dev server was inspected at `http://127.0.0.1:3000`.

## Local route manual check result

Authorized route check:

```text
"readonly_api_route_response.v0.1"
"project:augnes"
"project_constellation.sample.sidecar_strategy_c.v0_1"
```

Fail-closed marker-only check:

```text
HTTP/1.1 403 Forbidden
{"response_version":"readonly_api_route_response.v0.1","error":{"code":"missing_identity","status":403},...}
```

The fail-closed response did not include Project Constellation payload fields.

## Visible local-only copy

Observed in the scoped Cockpit section:

- local-only
- route-only read preview
- no execution/write authority
- no public unauthenticated endpoint

## Visible not-production-authenticated copy

Observed in the scoped Cockpit section:

- not production-authenticated
- Candidate D is local-only and not production auth

## Visible not-hosted-auth/session/workspace-membership copy

Observed in the scoped Cockpit section:

- not hosted auth
- not session identity
- not workspace membership
- real hosted/session/workspace auth does not exist yet
- local operator declaration cannot prove hosted identity
- local operator declaration cannot prove workspace/project membership

## Route-only read preview placement

The route preview appears in the Perspective tab as a separate diagnostic
section with stable id `perspective-constellation-route-preview`, before the
existing static fixture section `perspective-constellation-preview`.

## Displayed response fields

Observed displayed field families:

- `response_version`
- `meta.project_scope`
- `project_constellation.constellation_id`
- bounded node, edge, and cluster counts
- bounded route thesis
- bounded nodes
- bounded edges
- bounded clusters
- evidence pointers as pointer-only
- unresolved tensions
- next action candidates as advisory
- `authority_boundary`
- `forbidden_fields_removed`

## Omitted forbidden fields

The scoped section did not display default `perspective_capsule_preview`,
`copyable_handoff_preview`, full auth decision payload, secrets/env values,
Codex SDK handles, branch/PR handles, mutation handles, or proof/evidence write
handles.

`raw DB rows`, `mutation URLs`, `merge/publish/approve controls`, and similar
phrases appeared only inside the `forbidden_fields_removed` safety summary or
denied authority boundary text. They were not displayed as payload values,
links, handles, or controls.

## False-affordance findings

Scoped section findings:

- no buttons visible
- no links visible
- no execution/write controls are visible
- no merge/publish/approve controls are visible
- no proof/evidence write controls are visible
- no Codex launch controls are visible
- no branch/PR creation controls are visible
- no retry/replay/deploy controls are visible
- no graph persistence or snapshot/rollback controls are visible

The denied authority-boundary text contains words such as merge, publish,
retry, replay, and deploy only to state that those authorities are absent.

## Authority clarity findings

The section visibly states that route-provided text and local operator labels
grant no authority. It also states that response data is display data, not tool
instructions.

## Privacy/prompt-injection display-data findings

The section treats route text as display-only data. It does not show raw private
text, raw DB rows, credentials, secrets, provider credentials, hidden reasoning,
or instruction-taking affordances.

## Skipped checks

- Screenshots were not committed because this PR must not commit screenshots.
- ChatGPT App/MCP consumer checks were skipped because this PR does not connect
  ChatGPT App, MCP, or plugin tools.
- Hosted auth/session/workspace checks were skipped because this PR is
  Cockpit-local only and does not implement hosted auth, session identity, or
  workspace membership.
