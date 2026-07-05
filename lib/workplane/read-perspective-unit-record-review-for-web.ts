import { buildPerspectiveUnitRecordReviewV01 } from "@/lib/workplane/perspective-unit-record-review";
import type { PerspectiveUnitRecordReview } from "@/types/perspective-unit-record-review";

export function readPerspectiveUnitRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): PerspectiveUnitRecordReview {
  return buildPerspectiveUnitRecordReviewV01({
    records: [],
    as_of,
    source_refs,
  });
}
