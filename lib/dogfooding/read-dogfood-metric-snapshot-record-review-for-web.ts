import { buildDogfoodMetricSnapshotRecordReviewV01 } from "@/lib/dogfooding/dogfood-metric-snapshot-record-review";
import type { DogfoodMetricSnapshotRecordReview } from "@/types/dogfood-metric-snapshot-record-review";

export function readDogfoodMetricSnapshotRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): DogfoodMetricSnapshotRecordReview {
  return buildDogfoodMetricSnapshotRecordReviewV01({
    records: [],
    as_of,
    source_refs: [
      "workbench:dogfood_metric_snapshot_record_review_no_db_default",
      ...(source_refs ?? []),
    ],
  });
}
