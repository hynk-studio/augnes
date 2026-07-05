import { buildCodexResultReportIntakeRecordReviewV01 } from "@/lib/intake/codex-result-report-intake-record-review";
import type { CodexResultReportIntakeRecordReview } from "@/types/codex-result-report-intake-record-review";

export function readCodexResultReportIntakeRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): CodexResultReportIntakeRecordReview {
  return buildCodexResultReportIntakeRecordReviewV01({
    records: [],
    scope: "project:augnes",
    as_of,
    source_refs: source_refs ?? ["workbench:codex_result_report_intake_record_review_no_db"],
  });
}
