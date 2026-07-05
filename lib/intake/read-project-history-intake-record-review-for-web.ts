import { buildProjectHistoryIntakeRecordReviewV01 } from "@/lib/intake/project-history-intake-record-review";
import type { ProjectHistoryIntakeRecordReview } from "@/types/project-history-intake-record-review";

export function readProjectHistoryIntakeRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): ProjectHistoryIntakeRecordReview {
  return buildProjectHistoryIntakeRecordReviewV01({
    records: [],
    scope: "project:augnes",
    as_of,
    source_refs: source_refs ?? ["workbench:project_history_intake_record_review_no_db"],
  });
}
