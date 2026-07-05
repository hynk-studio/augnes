import { buildSelectedSessionDigestIngestRecordReviewV01 } from "@/lib/intake/selected-session-digest-ingest-record-review";
import type { SelectedSessionDigestIngestRecordReview } from "@/types/selected-session-digest-ingest-record-review";
import { SELECTED_SESSION_DIGEST_INGEST_SCOPE } from "@/types/selected-session-digest-ingest-write";

export const SELECTED_SESSION_DIGEST_INGEST_RECORD_REVIEW_FOR_WEB_REF =
  "selected_session_digest_ingest_record_review_for_web.v0.1" as const;

export interface SelectedSessionDigestIngestRecordReviewForWebInput {
  as_of?: string;
  source_refs?: string[];
}

export function readSelectedSessionDigestIngestRecordReviewForWebV01(
  input: SelectedSessionDigestIngestRecordReviewForWebInput = {},
): SelectedSessionDigestIngestRecordReview {
  return buildSelectedSessionDigestIngestRecordReviewV01({
    scope: SELECTED_SESSION_DIGEST_INGEST_SCOPE,
    as_of: input.as_of,
    records: [],
    source_refs: [
      SELECTED_SESSION_DIGEST_INGEST_RECORD_REVIEW_FOR_WEB_REF,
      "workbench:selected_session_digest_ingest_record_review_no_db_read",
      ...(input.source_refs ?? []),
    ],
  });
}
