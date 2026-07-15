import { NextResponse } from "next/server";

import {
  buildTemporalInterpretationPreview,
  validateTemporalPreviewRequest,
  type TemporalGatewayDependenciesV01,
} from "@/lib/temporal-interpretation/preview";
import { isModelGatewayInvocationErrorV01 } from "@/lib/vnext/model-gateway/contracts";

export interface TemporalPreviewRouteDependenciesV01 {
  gateway_dependencies?: TemporalGatewayDependenciesV01;
  create_uuid?: () => string;
}

export function createTemporalPreviewPostHandlerV01(
  dependencies: TemporalPreviewRouteDependenciesV01 = {},
) {
  return async function temporalPreviewPost(request: Request) {
    let previewRequest;
    try {
      const text = await request.text();
      const body = text.trim().length ? JSON.parse(text) : null;
      previewRequest = validateTemporalPreviewRequest(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid temporal interpretation request." },
        { status: 400 },
      );
    }

    try {
      return NextResponse.json(
        await buildTemporalInterpretationPreview(previewRequest, {
          cancellation_signal: request.signal,
          gateway_dependencies: dependencies.gateway_dependencies,
          create_uuid: dependencies.create_uuid,
        }),
      );
    } catch (error) {
      if (isModelGatewayInvocationErrorV01(error)) {
        return NextResponse.json(
          {
            error: "Model gateway invocation failed.",
            error_code: error.code,
            ...(error.receipt
              ? { model_invocation_receipt: error.receipt }
              : {}),
          },
          { status: modelGatewayHttpStatus(error.code) },
        );
      }
      return NextResponse.json(
        { error: "Failed to build temporal interpretation preview." },
        { status: 500 },
      );
    }
  };
}

function modelGatewayHttpStatus(code: string) {
  if (code === "model_gateway_scope_refused") return 409;
  if (code === "model_gateway_policy_refused") return 403;
  if (code === "model_gateway_timeout") return 504;
  if (code === "model_gateway_cancelled") return 408;
  if (code === "model_gateway_deterministic_failed") return 500;
  if (
    code === "model_gateway_invalid_envelope" ||
    code === "model_gateway_budget_refused" ||
    code === "model_gateway_egress_refused"
  ) {
    return 400;
  }
  return 502;
}
