import type {
  NativeHostAdapterV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";
import { CODEX_APP_SERVER_ADAPTER_VERSION_V01 } from "@/lib/vnext/native-host/codex-app-server-adapter";

export type NativeHostDeliveryScopeV01 =
  | "local_in_process"
  | "native_host_managed";

export interface NativeHostDeliveryAuthorityV01 {
  authority_version: "native_host_delivery_authority.v0.1";
  packet_presented_to_adapter: boolean;
  privacy_or_external_egress_occurred: boolean;
  provider_or_model_egress_occurred: boolean;
  delivery_scope: NativeHostDeliveryScopeV01;
  validated_packet_delivery_observed: boolean;
}

export class NativeHostDeliveryAuthorityErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostDeliveryAuthorityErrorV01";
  }
}

export function nativeHostDeliveryScopeV01(
  adapter: Pick<NativeHostAdapterV01, "execution_profile" | "provider_egress">,
): NativeHostDeliveryScopeV01 {
  if (adapter.execution_profile === "deterministic_zero_model" && adapter.provider_egress === "forbidden") {
    return "local_in_process";
  }
  if (adapter.execution_profile === "native_host_managed_model" && adapter.provider_egress === "native_host_managed") {
    return "native_host_managed";
  }
  throw new NativeHostDeliveryAuthorityErrorV01("native_host_delivery_contract_inconsistent");
}

/** Includes the legacy acknowledgement emitted by the configured App Server adapter. */
export function nativeHostPacketTransferReportedV01(
  adapter: Pick<NativeHostAdapterV01, "adapter_version">,
  result: NativeHostResultV01,
): boolean {
  return result.adapter_extension.bounded_metadata.packet_delivery_initiated === true ||
    (adapter.adapter_version === CODEX_APP_SERVER_ADAPTER_VERSION_V01 &&
      result.checks.some(check => check.check_id === "validated_packet_delivery" && check.status === "passed"));
}

/**
 * Derives delivery authority from the server-owned adapter contract and the
 * orchestration boundary. Adapter result metadata can report that a managed
 * boundary transfer began, but cannot broaden a local in-process contract
 * into privacy, provider, model, or network egress.
 */
export function deriveNativeHostDeliveryAuthorityV01(input: {
  adapter: Pick<
    NativeHostAdapterV01,
    "adapter_version" | "execution_profile" | "provider_egress"
  >;
  result: NativeHostResultV01;
  adapter_invocation_started: boolean;
}): NativeHostDeliveryAuthorityV01 {
  const deliveryScope = nativeHostDeliveryScopeV01(input.adapter);

  const managedBoundaryTransferReported = nativeHostPacketTransferReportedV01(input.adapter, input.result);
  if (managedBoundaryTransferReported && !input.adapter_invocation_started) {
    throw new NativeHostDeliveryAuthorityErrorV01(
      "native_host_delivery_without_invocation",
    );
  }

  const privacyOrExternalEgressOccurred =
    deliveryScope === "native_host_managed" && managedBoundaryTransferReported;
  const providerOrModelEgressOccurred =
    input.adapter.provider_egress === "native_host_managed" &&
    managedBoundaryTransferReported;

  return {
    authority_version: "native_host_delivery_authority.v0.1",
    packet_presented_to_adapter: input.adapter_invocation_started,
    privacy_or_external_egress_occurred:
      privacyOrExternalEgressOccurred,
    provider_or_model_egress_occurred: providerOrModelEgressOccurred,
    delivery_scope: deliveryScope,
    validated_packet_delivery_observed: deliveryScope === "local_in_process"
      ? input.adapter_invocation_started
      : privacyOrExternalEgressOccurred,
  };
}
