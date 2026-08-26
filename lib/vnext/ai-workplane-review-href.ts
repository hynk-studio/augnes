const RUN_RECEIPT_ID_V01 = /^run-receipt:[a-f0-9]{24}$/u;
const PROPOSAL_ID_V01 = /^episode-delta-proposal:[a-f0-9]{24}$/u;

export function createRunResultReviewHrefV01(receiptId: string): string {
  return RUN_RECEIPT_ID_V01.test(receiptId)
    ? `/workbench/results/${receiptId.replace(":", "~")}`
    : "/workbench/semantic-review";
}

export function createSuggestedChangeReviewHrefV01(
  proposalId: string,
): string {
  return PROPOSAL_ID_V01.test(proposalId)
    ? `/workbench/semantic-review/${proposalId.replace(":", "~")}`
    : "/workbench/semantic-review";
}
