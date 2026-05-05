# Quick Tunnel Developer Mode Validation

Status: passed with known CSP badge issue  
Date: 2026-04-28  
Scope: Augnes Evidence & Continuity Console, file-backed public profile

This note records the Quick Tunnel validation run before moving to a stable deployment URL.

## Runtime

Local app server:

```bash
npm run start:file
```

Tunnel:

```bash
cloudflared tunnel --url http://localhost:8787
```

Developer Mode MCP URL shape:

```text
https://<trycloudflare-host>/mcp
```

Observed profile:

```text
profile: public
```

Observed tool mode:

```text
file-backed / read-backed
```

## Result Summary

| Check | Result |
|---|---|
| ChatGPT Developer Mode connection | pass |
| Widget render | pass |
| Text fallback | pass |
| Header profile badge | pass: `profile: public` |
| Working View | pass |
| Governance Audit | pass |
| Continuity Report | pass |
| Boundary Packet | pass |
| Strategy Rationale | pass |
| Search `read-only` | pass |
| Fetch `evidence-readonly-public-surface` | pass |
| Repo Navigation `file adapter` | pass |
| Fetch `repo:src/adapters/file-core.ts` | pass |
| CSP badge | known issue: `CSP off` still visible |

## Evidence From Manual Run

Working View rendered as the public profile widget with fixture-backed counts:

- claims: 2
- top evidence: 2
- active pointers: 3
- visible pointer examples:
  - `casefile:casefile-augnes-console-public-app`
  - `boundary:read-first-v1`
  - `repo:src/adapters/file-core.ts`

Governance Audit rendered as the public summary profile:

- read-only tools: 9
- Gate-18: pass
- Gate-19: pass
- Gate-20: warn
- detail collapsed with the expected `Detailed audit is available in Chrono Lab` notice

Repo Navigation for `file adapter` rendered:

- search hits: 1
- explore hits: 0
- fetchable search hits: 1
- node: `repo:src/adapters/file-core.ts`
- guidance preserved:
  - Search/Explore are view-only.
  - Fetch source text before using a node as evidence.
  - Repo navigation does not write canonical state.

Fetch for `repo:src/adapters/file-core.ts` returned the expected file-backed repo pointer:

- id: `repo:src/adapters/file-core.ts`
- title: `File-backed adapter source pointer`
- profile: `public`
- kind: `repo`
- tags: `repo`, `adapter`, `file-core`
- text confirms that repo search/explore remain view-only and fetchable records are still read-only evidence candidates.

## Decision

Quick Tunnel validation is sufficient to mark the file-backed public Developer Mode path as working.

Do not spend more time trying to clear the `CSP off` badge on Quick Tunnel. Record it as unresolved and recheck on a stable deployment URL or fresh stable draft app.

## Next Step

Move to Sprint 4D stable URL validation:

1. create a Cloudflare named tunnel or equivalent stable HTTPS deployment,
2. register a fresh Developer Mode app using `https://<stable-host>/mcp`,
3. rerun the same validation prompts,
4. record whether `CSP off` persists on the stable URL.

After stable URL validation, proceed to Sprint 4E first slice:

```http
GET /working-view
```

The first Core HTTP goal remains: run the app with `AUGNES_CORE_MODE=http`, call `get_working_view`, validate the response against `WorkingViewSchema`, and keep Core outage as a sanitized runtime error rather than a startup failure.
