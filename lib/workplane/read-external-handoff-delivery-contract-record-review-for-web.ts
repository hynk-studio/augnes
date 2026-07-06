import {
  buildExternalHandoffDeliveryContractRecordReviewV01,
} from "@/lib/workplane/external-handoff-delivery-contract-record-review";
import type {
  ExternalHandoffDeliveryContractRecordReview,
  ExternalHandoffDeliveryContractRecordReviewInput,
} from "@/types/external-handoff-delivery-contract";

export function readExternalHandoffDeliveryContractRecordReviewForWebV01(
  input: ExternalHandoffDeliveryContractRecordReviewInput = {},
): ExternalHandoffDeliveryContractRecordReview {
  return buildExternalHandoffDeliveryContractRecordReviewV01({
    ...input,
    source_refs:
      input.source_refs ??
      ["workbench:external_handoff_delivery_contract_record_review"],
  });
}
