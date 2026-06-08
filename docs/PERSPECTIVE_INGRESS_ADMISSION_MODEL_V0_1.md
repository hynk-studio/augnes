# Perspective Ingress Admission Model v0.1

## Purpose and Scope

This PR adds a design/type/model slice for Perspective ingress admission. It defines how future external, OAuth, import, browser, and agent-submitted artifacts can enter Augnes as bounded candidates without becoming authoritative constellation, Event Rail, research, proof/evidence, readiness, or agent state by default.

This PR does not implement runtime ingestion. It adds type definitions, pure local helper functions, documentation, a smoke test, and a validation report.

## Why This Follows the Agent Brief Read Surface

The Agent Brief read surface established a consumption path: agents can read already-formed Perspective context without scraping the Human Workbench DOM.

This ingress model defines the opposite boundary: future external and agent-provided material can enter Augnes only as candidates. The candidate must pass admission, redaction, summarization, and formation boundaries before it can affect Perspective state.

## Three-Surface Distinction

| Surface | Role | Authority |
| --- | --- | --- |
| External ingress providers | Future OAuth, API, import, browser, and agent-submitted sources | Candidate input only |
| Agent consumption surfaces | Agent Brief, future ChatGPT Apps, Codex plugins, and handoff readers | Read or consume formed context |
| Augnes Formation surface | Internal Augnes formation, projection, and research substrate | Builds constellation, Event Rail, temporal placement, tensions, next actions, and research perspective |

Ingress is not Formation.

Agent consumption is not Ingress.

Augnes Formation is the authority boundary between raw/source material and temporal-spatial Perspective state.

Augnes internal formation remains responsible for constellation construction, Event Rail structure, temporal placement, research perspective, and projection generation.

## Ingress Kinds

| Kind | Meaning |
| --- | --- |
| `fixture` | Public-safe sample fixture material |
| `manual_pasted_text` | Local user-provided pasted material |
| `chatgpt_export` | Future imported ChatGPT conversation/export material |
| `codex_session_log` | Future imported Codex session or closeout log material |
| `oauth_document` | Future OAuth-authorized document pointer or bounded artifact |
| `oauth_calendar` | Future OAuth-authorized calendar pointer or bounded artifact |
| `oauth_email` | Future OAuth-authorized email pointer or bounded artifact |
| `browser_capture` | Future local browser capture candidate |
| `agent_submitted_artifact` | Future artifact submitted by an agent or plugin |
| `external_pointer` | Pointer-only external reference |

## Trust Levels

| Trust level | Meaning |
| --- | --- |
| `fixture_public_safe` | Synthetic or public-safe fixture material |
| `user_provided_local` | User-provided local material that still requires admission |
| `oauth_user_authorized` | OAuth-authorized source candidate, not trusted formation state |
| `agent_submitted_untrusted` | Agent-submitted material, untrusted by default |
| `external_pointer_only` | Pointer-only source with no adapted preview authority |

## Admission States

| State | Meaning |
| --- | --- |
| `raw_quarantined` | Candidate is present only as quarantined source material |
| `redacted_candidate` | Candidate has passed or does not need redaction |
| `episode_candidate` | Candidate can be considered as a bounded episode source |
| `accepted_for_preview` | Candidate can feed a local preview after admission checks |
| `accepted_for_research_archive` | Candidate is explicitly accepted for a research archive path |
| `rejected` | Candidate is rejected |
| `superseded` | Candidate was replaced by another candidate |

## Redaction States

| Redaction state | Meaning |
| --- | --- |
| `not_applicable` | No redaction is required for this candidate |
| `pending` | Redaction review has not completed |
| `redacted` | Candidate has a bounded redacted summary/pointer form |
| `blocked_sensitive` | Candidate is blocked due to sensitive content |
| `failed` | Redaction failed |

## Artifact Classes

| Artifact class | Meaning |
| --- | --- |
| `conversation_export` | Conversation or chat export |
| `implementation_log` | Implementation or session log |
| `document` | Document artifact |
| `calendar_event` | Calendar event artifact |
| `email_thread` | Email thread artifact |
| `browser_page` | Browser page capture candidate |
| `manual_note` | Manual note or pasted note |
| `agent_report` | Agent-produced report |
| `pointer_only` | Pointer without adapted source body |

## Admission Transitions

| From | Allowed next states |
| --- | --- |
| `raw_quarantined` | `redacted_candidate`, `rejected` |
| `redacted_candidate` | `episode_candidate`, `rejected` |
| `episode_candidate` | `accepted_for_preview`, `accepted_for_research_archive`, `rejected` |
| `accepted_for_preview` | `accepted_for_research_archive`, `superseded` |
| `accepted_for_research_archive` | `superseded` |
| `rejected` | `superseded` only when documenting replacement |
| `superseded` | none |

## Candidate Shape Summary

Ingress candidates carry:

- candidate id
- ingress kind
- artifact class
- source provider
- trust level
- admission state
- redaction state
- created timestamp or local placeholder
- source label and source ref
- provenance note
- bounded summary
- pointer refs
- actor refs
- requested-by and optional consent ref
- retention hint
- authority boundary
- eligibility flags for episode candidate, preview, and research archive

Ingress candidates do not carry raw content, OAuth tokens, credentials, private generated prompts, provider payloads, model outputs, API keys, billing data, execution handles, or proof/evidence/readiness write handles.

## Authority Boundary

Every candidate includes an authority boundary with explicit fields:

- `local_only`
- `read_only`
- `external_calls_performed`
- `persistence_performed`
- `graph_db_write_performed`
- `proof_evidence_readiness_write_performed`
- `codex_execution_performed`
- `github_mutation_performed`
- `oauth_token_stored`
- `raw_private_content_stored`

Default model helpers keep external calls, persistence, graph DB writes, proof/evidence/readiness writes, Codex execution, GitHub mutation, OAuth token storage, and raw private content storage false.

Preview and episode-candidate readiness requires `local_only=true` and `read_only=true` in addition to no external calls, no persistence, no graph DB writes, no proof/evidence/readiness writes, no Codex execution, no GitHub mutation, no OAuth token storage, and no raw private content storage.

## OAuth Rules

OAuth sources are future ingress providers. This PR does not implement OAuth.

OAuth tokens must not be stored in candidates.

OAuth raw content must not be stored by this model.

OAuth artifacts must begin `raw_quarantined` or `redacted_candidate`. They cannot directly form Perspective state and are not accepted for preview by default.

## Agent-Submitted Artifact Rules

Agent artifacts are untrusted by default.

Agent artifacts may become candidates, but they are not authoritative formation records.

Codex and ChatGPT outputs must re-enter Augnes through admission if reused as source material. Agent consumption remains a read path; it does not become an ingress or formation authority path.

## Relationship to Existing Perspective Agent Brief

The existing Perspective Agent Brief is consumption/read-only. It summarizes already-formed local Perspective preview state.

The ingress model is future input/admission. It prepares a path for source candidates before they become formation inputs.

The two are intentionally independent.

## Relationship to Human Workbench

The Human Workbench remains unchanged.

Ingress admission may later feed previews after Augnes admission, redaction, and summarization.

## Out of Scope

This PR adds no:

- API routes
- OAuth implementation
- provider/model/API calls
- GitHub calls or mutation
- Codex execution
- ChatGPT Apps integration
- Codex plugin integration
- browser connector ingestion
- runtime source fetching
- DB schema or migrations
- persistence
- graph DB behavior
- proof/evidence/readiness writes
- UI redesign
- Human Workbench changes
- Agent Brief route behavior changes
- packet section changes
- hidden raw JSON dumps
- product DOM exposure for ingress candidates

## Next Suggested Slice

Recommended next implementation PR:

`Prototype local manual ingress admission preview`
