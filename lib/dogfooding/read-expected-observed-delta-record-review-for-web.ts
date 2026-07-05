import { buildExpectedObservedDeltaRecordReviewV01 } from "@/lib/dogfooding/expected-observed-delta-record-review";
import type { ExpectedObservedDeltaRecordReview } from "@/types/expected-observed-delta-record-review";

export function readExpectedObservedDeltaRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): ExpectedObservedDeltaRecordReview {
  return buildExpectedObservedDeltaRecordReviewV01({
    records: [],
    scope: "project:augnes",
    as_of,
    source_refs: source_refs ?? ["workbench:expected_observed_delta_record_review_no_db"],
  });
}
