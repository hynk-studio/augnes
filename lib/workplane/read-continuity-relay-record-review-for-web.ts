import { buildContinuityRelayRecordReviewV01 } from "@/lib/workplane/continuity-relay-record-review";
import type { ContinuityRelayRecordReview } from "@/types/continuity-relay-record-review";

export function readContinuityRelayRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): ContinuityRelayRecordReview {
  return buildContinuityRelayRecordReviewV01({
    records: [],
    as_of,
    source_refs,
  });
}
