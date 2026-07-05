import { buildPerspectiveRelayUpdateDecisionRecordReviewV01 } from "@/lib/workplane/perspective-relay-update-decision-record-review";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "@/types/perspective-relay-update-decision-record-review";

export function readPerspectiveRelayUpdateDecisionRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): PerspectiveRelayUpdateDecisionRecordReview {
  return buildPerspectiveRelayUpdateDecisionRecordReviewV01({
    records: [],
    as_of,
    source_refs,
  });
}
