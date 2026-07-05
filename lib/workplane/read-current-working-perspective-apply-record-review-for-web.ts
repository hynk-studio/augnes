import { buildCurrentWorkingPerspectiveApplyRecordReviewV01 } from "@/lib/workplane/current-working-perspective-apply-record-review";
import type { CurrentWorkingPerspectiveApplyRecordReview } from "@/types/current-working-perspective-apply-record-review";

export function readCurrentWorkingPerspectiveApplyRecordReviewForWebV01(
  input: {
    as_of?: string;
    source_refs?: string[];
  } = {},
): CurrentWorkingPerspectiveApplyRecordReview {
  return buildCurrentWorkingPerspectiveApplyRecordReviewV01({
    scope: "project:augnes",
    as_of: input.as_of,
    source_refs: input.source_refs ?? [],
  });
}
