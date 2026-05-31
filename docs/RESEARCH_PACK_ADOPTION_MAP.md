# Research Pack Adoption Map v0.1

## Status

- repo-local planning / adoption map
- non-SSOT
- docs-only
- does not expand the Active set
- does not change runtime behavior
- does not change DB schema or migrations
- does not change API routes
- does not change MCP/App tool schemas
- does not create proof, evidence, readiness, publication, approval, retry, replay, merge, or auto-merge authority

## Purpose

This document maps the uploaded Augnes research document pack into the current `augnes-perpective-lab` repository without treating that pack as an immediate runtime contract.

The goal is to keep useful research and operational hardening ideas visible while preserving the current Augnes Core authority model: committed state, proof records, evidence rows, proposal decisions, publication gates, and delivery records remain owned by Augnes Core and its existing gated routes.

This map is the first implementation slice for the current adoption sequence. It is a sorting layer, not a feature implementation.

## Source context

### Uploaded research pack

- Docset version: `2026-05-06-queue-drain-p1`
- Schema contract version: `r20.1p4p40`
- Baseline: `r20.1p4p40 schema/doc pack, 2026-03-04`
- Overlays: `2026-04-07 editorial`, `2026-04-26 operational hardening`, `2026-05-06 queue drain`
- Stated boundary: queue drain and operational hardening do not add new A0 labels, fields, schema paths, enum contracts, or runtime default behavior.

### Current repo baseline

- `docs/00_INDEX_LATEST.md` currently identifies the repo-local upload pack as `r20.1p4p23`.
- `docs/AUTHORITY_MATRIX.md` defines Augnes Core as the committed-state / gate authority and keeps ChatGPT, Codex, GitHub, Cockpit, Browser, and MCP surfaces in separate authority lanes.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md` and the current Perspective implementation treat PerspectiveSnapshot as a derived-view-only read model.
- Current Sidecar-related Perspective diagnostics keep `sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, and `comp_index_hint` as structured placeholders, while `loopness_hint` is the only bounded computed log-only diagnostic object.

## Adoption labels

| Label | Meaning | Runtime effect |
| --- | --- | --- |
| `already_aligned` | Current repo already implements or documents the core idea. | None. Keep current implementation. |
| `adopt_docs_only` | Add or adjust repo-local documentation only. | None. No code/schema/API changes. |
| `candidate_smoke_mapping` | Useful as a map from research-pack gates to existing or future smoke checks. | None until a scoped smoke PR. |
| `candidate_log_only` | Candidate for future log-only diagnostic or read-model output. | None until a scoped runtime/read-model PR. |
| `candidate_prior_only` | Candidate for future weak prior path through existing clip / jerk-limit / cooldown rules. | Deferred; requires explicit scoped PR and regression evidence. |
| `deferred_runtime` | Potential runtime work, but not safe to implement directly now. | None. Requires design and approval first. |
| `external_reference_only` | Preserve as research background or historical rationale only. | None. |
| `reject_for_now` | Not suitable for current repo direction or authority boundaries. | None. |

## Adoption matrix

| Research pack item | Disposition | Current repo anchor | Next action |
| --- | --- | --- | --- |
| Release identity split: `docset_version` vs `schema_contract_version` | `adopt_docs_only` | `docs/00_INDEX_LATEST.md`; this file | Keep uploaded pack version visible here; do not relabel current repo docs as r20.1p4p40 without a separate doc-pack update PR. |
| Active set 9-file hygiene | `adopt_docs_only` | `docs/00_INDEX_LATEST.md` | Treat uploaded Active set as external pack shape. Do not force repo root/docs into that exact layout during this slice. |
| Queue Drain Mode / family-first paper absorption | `adopt_docs_only` | this file; future gate map | Use the disposition labels in this file as the repo-local queue drain surface. No new A0 labels in this slice. |
| Provider-neutral execution topology / lane matrix | `already_aligned` | `docs/AUTHORITY_MATRIX.md`; `lib/execution-lanes.ts` | Preserve lane registry. Future tool/route/script PRs should name the empowered actor and surface. |
| Gate-17 ontology/cardinality discipline | `candidate_smoke_mapping` | current smoke suite; future gate matrix doc | Map to existing state/perspective/authority smokes before adding any new CI requirement. |
| Gate-18 logging promotion / low-cardinality audit | `candidate_smoke_mapping` | current evidence/logging docs; future gate matrix doc | Use for future raw-first/extracted/tag promotion checks. No logging schema expansion in this slice. |
| Gate-19 external backend / split-brain safety | `already_aligned` + `candidate_smoke_mapping` | `docs/AUTHORITY_MATRIX.md`; `scripts/smoke-authority-invariants.mjs` | Keep external provider output as View unless normalized through Core evidence/proof routes. Add route-level HTTP enforcement only in a scoped future PR. |
| Gate-20 self-succession / continuity discipline | `adopt_docs_only` | current authority docs and perspective continuity docs | Keep as governance vocabulary only. No self-succession runtime state or identity authority change here. |
| Sidecar authority negative tests | `candidate_smoke_mapping` | `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`; `scripts/smoke:research-diagnostics-boundaries`; `scripts/smoke:sidecar-et-*` | Map to current placeholder assertions. Future PR may add explicit negative-test labels without computing Sidecar values. |
| A0 lifecycle board | `adopt_docs_only` | this file; future `docs/GATE_SMOKE_MATRIX.md` | Track lifecycle as documentation. Do not create new A0 implementation slots here. |
| RepoGraph / RPG Search->Fetch->Explore discipline | `candidate_log_only` | repo navigation / review / evidence workflows | Adopt the rule: Search/Explore are View; Fetch/tool output can become Evidence candidate. No RepoGraph derived store in this slice. |
| Sidecar `e_t` / QP / `z_t` full module spec | `deferred_runtime` | Perspective placeholder diagnostics | Keep current placeholders. Any runtime computation must go fixture-only -> offline helper -> log-only runtime, with no authority mutation. |
| `comp_index_hint`, `meta_wm_hint`, `bsl_hint` | `candidate_log_only` | PerspectiveSnapshot research diagnostics | Do not compute yet. Prefer improving existing `loopness_hint` first. |
| `loopness_hint` | `already_aligned` | PerspectiveSnapshot v0.1 | Candidate for first diagnostic-quality improvement slice after gate/smoke mapping. |
| Logging promotion thresholds | `candidate_smoke_mapping` | future gate matrix | Treat as audit criteria for extracted/tag/dashboard promotion. No new columns or tags here. |
| `SSOT_SCHEMA_BUNDLE.zip` r20.1p4p40 | `external_reference_only` | uploaded research pack | Do not treat as current repo DB/API schema. Any schema adoption must start with an explicit schema mapping PR. |
| GNWT/IIT Appendix and paper-motif queue | `external_reference_only` | research docs; this map | Preserve as rationale and disposition source. Do not turn paper titles, DOIs, or authors into state labels, task schema IDs, dashboard group keys, or tags. |
| OPCD / PM / MCR / offline adaptation plane | `deferred_runtime` | no current runtime implementation | Keep offline-only until artifact genealogy, rollback, holdout, and authority boundaries are separately scoped. |
| CTW / TGN / CCbeta / EffortGate / DSR / SGB and similar A0 modules | `candidate_log_only` or `candidate_prior_only` only | none by default | Default path is `off -> log_only -> prior_only`, never direct default behavior. |

## Current safe adoption order

1. Keep this file as the repo-local boundary between the uploaded research pack and current repo authority.
2. Add a gate/smoke matrix document that maps the uploaded Gate-17~20 concepts to existing repo smoke commands.
3. Improve existing PerspectiveSnapshot `loopness_hint` quality before computing new diagnostics.
4. Extend Codex handoff validation only as read-only/local validation unless a current-runtime work item and explicit Core-gated authority are supplied.
5. Treat Sidecar `e_t` runtime computation as deferred until fixture-only and offline-helper boundaries are proven.

## Forbidden in this adoption line

- Do not mark the uploaded research pack as the current repo runtime contract.
- Do not repack or replace `SSOT_SCHEMA_BUNDLE.zip` as part of this docs-only map.
- Do not create DB migrations or route behavior from this map.
- Do not add MCP/App tool schemas from this map.
- Do not compute real Sidecar `e_t`, QP output, `z_t` regime commits, Meta-WM, BSL, or CompIndex from this map.
- Do not use diagnostics as Gate/SRF input, Claim confidence, Evidence status, publication readiness, proposal scoring, commit/reject input, or Cockpit action input.
- Do not treat proof as approval, evidence as approval, or a PR as merge authority.

## Verification

This is a documentation-only adoption map. No local runtime, database, API route, MCP/App tool, package script, hook, plugin, secret handling, evidence/proof recording, browser verification, or smoke command was run for this file.

Recommended review checks for this slice:

- Confirm this file is docs-only.
- Confirm no existing runtime/schema/API/tool files changed.
- Confirm the map preserves current Augnes Core authority boundaries.
- Confirm future work remains split into separately scoped docs, smoke, read-model, and runtime PRs.
