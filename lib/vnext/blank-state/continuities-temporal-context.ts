import { publicGuideBriefTextV02 } from "@/lib/vnext/guide-brief/public-guide-text";
import {
  CONTINUITIES_TEMPORAL_CONTEXT_VERSION_V01,
  type BlankStateSourceV01,
  type BlankStateViewV01,
  type ContinuitiesTemporalContextV01,
  type ContinuitiesTemporalNextItemV01,
  type ContinuitiesTemporalRecentItemV01,
} from "@/types/vnext/blank-state";

const MAX_NEXT_ITEMS = 2;
const MAX_RECENT_ITEMS = 3;

/**
 * A bounded presentation projection over current Project Home sources.
 *
 * NEXT has no asserted time. NOW is a presentation anchor. RECENT retains
 * only timestamps already present on source records. This builder creates no
 * event, selection, action owner, or semantic authority.
 */
export function buildContinuitiesTemporalContextV01({
  source,
  view,
}: {
  source: BlankStateSourceV01;
  view: BlankStateViewV01;
}): ContinuitiesTemporalContextV01 {
  const projection = source.projection;
  const nextItems = projection
    ? projection.next_moves.slice(0, MAX_NEXT_ITEMS).map((move) => ({
        item_id: `next:${move.move_id}`,
        label: publicGuideBriefTextV02(move.label),
        reason: publicGuideBriefTextV02(move.reason),
        href: move.href,
      }))
    : fallbackNextItemsV01(view);
  const recentItems = projection
    ? deduplicateRecentItemsV01(
        projection.recent_activity.items.map((activity) => ({
          item_id: [
            "recent",
            activity.activity_kind,
            activity.occurred_at,
            activity.summary,
          ].join(":"),
          summary: publicGuideBriefTextV02(activity.summary),
          occurred_at: activity.occurred_at,
          href: activity.workbench_entry?.href ?? null,
        })),
      ).slice(0, MAX_RECENT_ITEMS)
    : [];

  return {
    temporal_context_version: CONTINUITIES_TEMPORAL_CONTEXT_VERSION_V01,
    current: {
      label: view.project_name ?? "Local workspace",
      summary: publicGuideBriefTextV02(view.situation),
    },
    next_items: nextItems,
    recent_items: recentItems,
    projection_only: true,
    semantic_authority_granted: false,
  };
}

function fallbackNextItemsV01(
  view: BlankStateViewV01,
): ContinuitiesTemporalNextItemV01[] {
  const action = view.highlighted_item.next_action;
  if (!action) return [];
  return [{
    item_id: `next:${view.highlighted_item.item_id}`,
    label: publicGuideBriefTextV02(action.label),
    reason: publicGuideBriefTextV02(view.highlighted_item.meaningful_state),
    href: action.kind === "link" ? action.href : null,
  }];
}

function deduplicateRecentItemsV01(
  items: ContinuitiesTemporalRecentItemV01[],
): ContinuitiesTemporalRecentItemV01[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const identity = [
      item.summary,
      item.occurred_at,
      item.href ?? "no-destination",
    ].join("\u0000");
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}
