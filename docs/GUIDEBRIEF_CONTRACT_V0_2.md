# GuideBrief Contract v0.2

Status: current-project active contract. This change implements C3; C3 becomes
complete only after review and merge.

GuideBrief v0.2 is Augnes's bounded, project-scoped interpretation View. It
connects Blank State, AI Workplane, ChatGPT/MCP and a newly started native Codex
task to the same current-project coordinate. It is embedded guidance, not a
page, execution protocol, durable record or source of truth.

## Active sources

The canonical builder consumes `BlankStateSourceV01` and its current
`ProjectHomeProjectionV01` when available. Those read models resolve the
workspace, current or explicitly viewed project, root availability, task goal,
current run, latest result, verification summary, attention and recent change.
Missing historical Current Working Perspective or Delta Projection material
does not block the current-project guide.

The builder is deterministic and read-only. It creates no table, migration,
record, decision, approval, Transition or execution grant. It makes no model,
provider, GitHub or external-network call and does not read raw transcripts,
provider output or hidden reasoning.

## Contract and epistemic separation

`guide_brief.v0.2` contains:

- request, workspace/project identity, current/viewed context, root resolution,
  source status and bounded gaps;
- a current coordinate: human focus, goal, meaningful work status, result and
  verification availability, material uncertainty, unresolved judgment and
  recent meaningful change;
- separate bounded `observed`, `inferred`, `suggested` and
  `needs_user_judgment` arrays;
- one primary guidance item selected only from existing actions;
- bounded, deduplicated source refs;
- Blank State, AI Workplane, ChatGPT and Codex projections;
- an explicit all-false authority boundary and public-safety statement.

Observed statements are backed by current read-model refs. Inferences cite
observations and include confidence and caveats. Suggestions execute nothing.
User judgments remain unresolved and state why they matter and what they block.

The current bounds are eight observations, four inferences, three suggestions,
three user judgments, sixteen source refs, three recent changes, 1,024 bytes per
public text field and 64 KiB for the serialized packet. Selection, ordering,
deduplication and stable IDs are deterministic; no model ranks the material.

## Surface projections

- **Blank State:** owns the heading, situation, material note, exactly one
  primary action, compact current work, additional attention and recent change.
  `BlankStateViewV01` is now a thin Browser projection of this packet.
- **AI Workplane:** embeds a compact rail with project, goal/coordinate,
  work/result status, material blocker or judgment and review focus. It adds no
  mutation and does not perform the C4 Workplane reprojection.
- **ChatGPT/MCP:** returns a public-safe project summary with the four epistemic
  sections, primary guidance, source status/refs and authority boundary through
  the existing `augnes_get_guide_brief` tool.
- **Codex:** prints bounded guide sections through `codex:read-brief`. A new
  native Codex turn receives a separate guide section before the exact packet.

The projections must not contradict one another about project, goal, work
status, result availability, material blocker, unresolved judgment, recommended
action or authority.

## GuideBrief and TaskContextPacket

GuideBrief explains where the project is, what is happening, what is uncertain,
why attention matters and what user judgment remains. `TaskContextPacket`
specifies the exact task, selected context, constraints, success criteria,
required checks and execution boundary.

For a new native Codex task, Augnes renders two explicit sections:

1. GuideBrief — non-authoritative task-start guidance;
2. TaskContextPacket — exact bounded execution contract.

The guide is bound in memory to the same workspace, project, packet ID and
packet fingerprint. It is outside the packet integrity calculation and cannot
rewrite, broaden or override the packet. If guide construction fails, Codex
receives a bounded explicit unavailable statement and the unchanged exact
packet when existing Core behavior permits. Resume does not create a new turn
or inject a second guide.

## Local route and MCP contract

`GET /api/augnes/read/guide-brief` remains local-only, marker-gated, GET-only,
read-only and `no-store`.

- scope: `project:augnes` (compatibility request scope);
- marker: `x-augnes-local-readonly: guide-brief-v0.2`;
- default: current project, or truthful project-choice guide when none exists;
- optional: one validated `project_id`, read without changing active project;
- unknown or duplicate query keys, invalid IDs, non-local hosts and failed
  strict local authentication fail closed;
- no synthetic fixture fallback is returned as active project state.

The MCP tool name remains `augnes_get_guide_brief`. Its optional compact form
retains project/source status, material risk, unresolved judgment and the
authority boundary.

## Source safety and authority

Surface-safe text excludes private absolute paths, credentials, raw provider
output, hidden reasoning, raw conversations, transcripts, retrieval dumps and
unbounded logs. Source refs are bounded record or route references, not raw
local filesystem locations.

Every authority field is false. GuideBrief cannot establish truth, accept or
reject state, record proof, create Evidence, update work or memory, apply a
Perspective, approve, transition, publish, merge, retry, call GitHub or a
provider, execute Codex, create a branch/PR, send a handoff, launch autonomy,
write the database, create a UI action or grant host permission. Suggestions
are not instructions, and the packet is neither proof nor Evidence.

## v0.1 disposition

`guide_brief.v0.1`, its fixture, old Human Surface panels and its
CurrentWorkingPerspective/Delta Projection builder remain historical or
compatibility-only pending C9. They are not the active route, Blank State, AI
Workplane, MCP, `codex:read-brief` or native task-start interpretation path.
Historical documentation remains accurate to that contract and must not be
read as current-project runtime authority.

C3 adds no persistence, schema, protocol authority, top-level destination,
chatbot or autonomous behavior. C4 remains blocked until C3 is reviewed and
merged.
