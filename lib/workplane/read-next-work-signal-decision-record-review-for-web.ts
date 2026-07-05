import { buildNextWorkSignalDecisionRecordReviewV01 } from "@/lib/workplane/next-work-signal-decision-record-review";
import type { NextWorkSignalDecisionRecordReview } from "@/types/next-work-signal-decision-record-review";

export function readNextWorkSignalDecisionRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): NextWorkSignalDecisionRecordReview {
  return buildNextWorkSignalDecisionRecordReviewV01({
    records: [],
    as_of,
    source_refs,
  });
}
