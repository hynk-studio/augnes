# Perspective Ingress Admission Observatory Summary v0.1

## Purpose and Scope

This PR displays compact ingress admission metadata in Perspective Observatory
details. It applies to manual pasted-text previews that include
`ingress_admission` from the local manual ingress admission preview route.

The summary is human-readable status metadata. It is not a raw JSON dump, not
raw pasted text, not Formation authority, not proof/evidence/readiness
authority, and not execution authority.

## Why This Follows the Local Manual Ingress PR

PR #451 made local manual pasted-text preview responses attach bounded
`ingress_admission` metadata. This slice makes that metadata understandable to a
human without asking the default Human Workbench or agent consumers to scrape a
large diagnostics surface.

## Where It Appears

The summary appears only inside the existing Observatory details section when
that details body is open and the active Perspective ingest preview has
`ingress_admission`.

It does not appear in the default Human Workbench first view. Sample fixture
previews that do not include `ingress_admission` simply omit the summary; they
do not show an error or warning.

## What Is Shown

The compact summary shows categorical and bounded status fields:

- status: admitted for preview
- source: manual pasted text
- trust: user provided local
- candidate state: episode candidate
- decision: accepted for preview
- readiness: preview ready
- boundary: local / read-only
- redaction: not applicable
- research archive: not accepted
- pointer count
- candidate id and source ref as visible text only

The summary also labels the metadata as candidate material, not Formation
authority, and repeats the local boundary: no persistence, no graph DB, no
Codex, and no GitHub.

## What Is Not Shown

The summary does not render raw `ingress_admission` JSON, hidden raw JSON dumps,
raw pasted text, rejected pasted text, packet textarea content, provider/model
payloads, OAuth details, tokens, API keys, billing data, generated/private
payloads, or prompt content.

The bounded summary is intentionally not shown in this UI slice so the details
surface stays compact and does not look like pasted source material.

## Data Attributes

The UI exposes categorical hooks only:

- `data-augnes-region="perspective-ingress-admission-summary"`
- `data-augnes-ingress-admission-version="perspective_ingress_admission_preview.v0.1"`
- `data-augnes-ingress-kind="manual_pasted_text"`
- `data-augnes-ingress-trust="user_provided_local"`
- `data-augnes-ingress-readiness="preview_ready"`
- `data-augnes-ingress-authority="local-read-only-candidate"`

Data attributes must not contain candidate id, source ref, pointer refs,
bounded summary, raw text, actor refs, consent refs, OAuth tokens, API keys,
provider/model details, billing data, generated/private payloads, or prompts.

## What Remains Unchanged

- Human Workbench default layout and density.
- Agent Brief read route behavior.
- Ingress admission model behavior.
- Local manual pasted-text preview response behavior.
- Graph topology, node ids, node types, edge ids, and edge types.
- Event Rail structure and reachability.
- Packet section order.
- FormationReceipt and Observatory details reachability.
- Manual Gravity, packet preview, Temporal details, and Advanced diagnostics.

## Intentionally Not Implemented

This PR does not add OAuth, external API ingress, provider/model calls, GitHub
calls or mutation, Codex execution, ChatGPT Apps integration, Codex plugin
integration, API routes, DB schema or migrations, persistence, graph DB
behavior, proof/evidence/readiness writes, UI redesign, or product DOM exposure
of raw/private/generated/prompt/model/token/API key/billing data.

Rulecraft remains unexposed in product UI.

## Next Suggested Slice

Add local manual ingress admission to Agent Brief context.
