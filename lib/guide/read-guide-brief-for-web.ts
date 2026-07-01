import {
  GUIDE_BRIEF_ROUTE_SCOPE,
  readGuideBriefForRoute,
} from "@/lib/guide/guide-brief-source";
import type { GuideBrief } from "@/types/guide-brief";

export function readGuideBriefForWeb(): GuideBrief {
  const guideBrief = readGuideBriefForRoute({ scope: GUIDE_BRIEF_ROUTE_SCOPE });

  return {
    ...guideBrief,
    next_phase_notes: [
      "Phase 6C adds read-only Web Guide panel skeleton rendering.",
      "Phase 6D ChatGPT App/MCP Guide tool remains deferred.",
      "Phase 6E Codex Guide alignment remains deferred.",
      "Phase 7 Handoff Capsule / Codex Launch Card remains deferred.",
    ],
  };
}
