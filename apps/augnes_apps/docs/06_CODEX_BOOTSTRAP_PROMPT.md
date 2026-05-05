# Codex bootstrap prompt

You are implementing `augnes-console-starter`.

Read, in order:
1. `AGENTS.md`
2. `docs/00_DIRECTOR_BRIEF.md`
3. `docs/01_EXECUTION_PLAN.md`
4. `docs/02_CODEX_TASKLIST.md`
5. `docs/05_PRIVACY_AND_REVIEW_CHECKLIST.md`

Your first milestone is **not** polish. It is this:
- make the MCP server run
- make the widget render in ChatGPT developer mode
- replace mock adapter calls with real Augnes Core read endpoints
- keep the public app strictly read-only

Implementation constraints:
- preserve search/fetch exact result shapes
- do not add write tools
- do not let narrator text become evidence
- do not leak session/thread/workspace IDs or auth/internal identifiers
- keep RepoGraph search/explore view-only and fetch as the only evidence candidate path

Deliverables for milestone 1:
- working MCP app server
- real adapter implementation
- panel rendering for casefile / strategy / boundary / continuity
- passing local typecheck
- short implementation notes in README
