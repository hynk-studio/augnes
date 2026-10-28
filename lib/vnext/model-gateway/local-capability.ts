import { readOpenAILocalCapabilityDiagnosticV01 } from "@/lib/vnext/model-gateway/openai/local-configuration";

export interface ModelGatewayLocalCapabilityDiagnosticV01 {
  status:
    | "available"
    | "action_required"
    | "misconfigured"
    | "unavailable";
  summary: string;
  verification: "trusted_local_status";
}

/** Local readiness only; loading this entry does not load invocation or codecs. */
export function readDefaultModelGatewayLocalCapabilityV01(): ModelGatewayLocalCapabilityDiagnosticV01 {
  return readOpenAILocalCapabilityDiagnosticV01();
}
