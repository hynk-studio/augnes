import { buildReuseOutcomeBridgeLedgerRecordReviewV01 } from "@/lib/dogfooding/reuse-outcome-bridge-ledger-record-review";
import type { ReuseOutcomeBridgeLedgerRecordReview } from "@/types/reuse-outcome-bridge-ledger-record-review";

export function readReuseOutcomeBridgeLedgerRecordReviewForWebV01({
  as_of,
  source_refs,
}: {
  as_of?: string;
  source_refs?: string[];
} = {}): ReuseOutcomeBridgeLedgerRecordReview {
  return buildReuseOutcomeBridgeLedgerRecordReviewV01({
    records: [],
    as_of,
    source_refs: [
      "workbench:reuse_outcome_bridge_ledger_record_review_no_db_default",
      ...(source_refs ?? []),
    ],
  });
}
