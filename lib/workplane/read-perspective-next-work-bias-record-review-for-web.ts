import { buildPerspectiveNextWorkBiasRecordReviewV01 } from "@/lib/workplane/perspective-next-work-bias-record-review";
import type { PerspectiveNextWorkBiasRecordReview } from "@/types/perspective-next-work-bias-record-review";

export function readPerspectiveNextWorkBiasRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): PerspectiveNextWorkBiasRecordReview {
  return buildPerspectiveNextWorkBiasRecordReviewV01({
    records: [],
    as_of,
    source_refs,
  });
}
