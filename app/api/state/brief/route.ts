import {
  buildEmptyRuntimeStartupFallbackMetadata,
  getMissingEmptyRuntimeOptionalTables,
} from "@/lib/empty-runtime-startup-fallback";
import { buildStateBrief } from "@/lib/state/brief";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "project:augnes";

  try {
    return NextResponse.json(buildStateBrief(scope));
  } catch (error) {
    const missingTables = getMissingEmptyRuntimeOptionalTables(error);

    if (missingTables.length === 0) {
      throw error;
    }

    return NextResponse.json(
      buildEmptyStateBriefFallback({
        scope,
        missingTables,
      }),
    );
  }
}

function buildEmptyStateBriefFallback({
  scope,
  missingTables,
}: {
  scope: string;
  missingTables: ReturnType<typeof getMissingEmptyRuntimeOptionalTables>;
}) {
  const asOf = new Date().toISOString();
  const fallback = buildEmptyRuntimeStartupFallbackMetadata({
    route: "GET /api/state/brief",
    scope,
    missingTables,
  });
  const stateCounts = {
    active: 0,
    future: 0,
    completed: 0,
    deprecated: 0,
    pending_proposals: 0,
    open_tensions: 0,
    recent_actions: 0,
  };

  return {
    runtime: "augnes",
    scope,
    as_of: asOf,
    generated_at: asOf,
    active_state: [],
    future_state: [],
    completed_state: [],
    deprecated_state: [],
    open_tensions: [],
    pending_proposals: [],
    recent_actions: [],
    recent_action_visibility: {
      proof_only_action_ids: [],
      committed_state_marker_action_ids: [],
      note:
        "Empty-runtime fallback: no action records were read because an optional runtime table is missing.",
    },
    agent_instructions: [
      "This is a controlled empty-runtime fallback for missing optional local runtime tables.",
      "Do not treat empty fallback output as committed project state.",
      "Run the local runtime setup or migrations before relying on state/work summaries.",
    ],
    agent_handoff: {
      current_status: {
        summary:
          "The local runtime database is empty or not initialized for state/work summary tables. The route returned a controlled empty envelope instead of an uncontrolled startup error.",
        state_counts: stateCounts,
        notable_state_keys: [],
      },
      next_recommended_action: {
        title: "Initialize local runtime tables before relying on state brief",
        rationale:
          "The state brief could not read optional runtime table(s), so no committed state, proposals, tensions, or recent actions were inferred.",
        suggested_actor: "augnes_runtime",
        priority: "later",
        related_state_keys: [],
      },
      blockers_or_tensions: [],
      codex_handoff: {
        task_brief:
          "Empty-runtime fallback only: initialize or migrate the local Augnes DB before using this state brief as work context.",
        constraints: [
          "Do not treat fallback emptiness as committed state.",
          "Do not create placeholder seed rows from this read route.",
        ],
        likely_files: [],
        verification_commands: ["npm run augnes:doctor"],
        expected_report_fields: [
          "Fallback reason",
          "Missing optional runtime tables",
          "Verification",
        ],
        action_record_template: {
          scope,
          source_agent_id: "codex",
          action_name: "empty_runtime_startup_fallback_observed",
          result_summary:
            "Controlled empty-runtime fallback observed for state brief.",
          files_changed: [],
          result_status: "blocked",
          result_kind: "verification",
        },
      },
    },
    ...fallback,
  };
}
