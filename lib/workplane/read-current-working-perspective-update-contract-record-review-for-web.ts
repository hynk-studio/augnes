import { buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01 } from "@/lib/workplane/current-working-perspective-update-contract-record-review";
import type { CurrentWorkingPerspectiveUpdateContractRecordReview } from "@/types/current-working-perspective-update-contract-record-review";

export function readCurrentWorkingPerspectiveUpdateContractRecordReviewForWebV01(
  input: {
    as_of?: string;
    source_refs?: string[];
  } = {},
): CurrentWorkingPerspectiveUpdateContractRecordReview {
  return buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    scope: "project:augnes",
    as_of: input.as_of,
    source_refs: input.source_refs ?? [],
  });
}
