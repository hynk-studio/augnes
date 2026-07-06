import {
  buildProviderSpecificDeliveryIntentContractRecordReviewV01,
} from "@/lib/workplane/provider-specific-delivery-intent-contract-record-review";
import type {
  ProviderSpecificDeliveryIntentContractRecordReview,
  ProviderSpecificDeliveryIntentContractRecordReviewInput,
} from "@/types/provider-specific-delivery-intent-contract";

export function readProviderSpecificDeliveryIntentContractRecordReviewForWebV01(
  input: ProviderSpecificDeliveryIntentContractRecordReviewInput = {},
): ProviderSpecificDeliveryIntentContractRecordReview {
  return buildProviderSpecificDeliveryIntentContractRecordReviewV01({
    ...input,
    source_refs:
      input.source_refs ??
      ["workbench:provider_specific_delivery_intent_contract_record_review"],
  });
}
