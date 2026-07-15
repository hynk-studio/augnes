import { NextResponse } from "next/server";

import {
  buildPlan,
  validatePlanRequest,
  type PlannerGatewayDependenciesV01,
} from "@/lib/planner/planner";
import { isModelGatewayInvocationErrorV01 } from "@/lib/vnext/model-gateway/contracts";

export interface PlannerRouteDependenciesV01 {
  gateway_dependencies?: PlannerGatewayDependenciesV01;
  create_uuid?: () => string;
}

export function createPlannerPostHandlerV01(
  dependencies: PlannerRouteDependenciesV01 = {},
) {
  return async function plannerPost(request: Request) {
    let planRequest;
    try {
      planRequest = validatePlanRequest(await request.json());
    } catch {
      return NextResponse.json(
        { error: "Invalid Planner request." },
        { status: 400 },
      );
    }

    try {
      return NextResponse.json(
        await buildPlan(planRequest, {
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
        { error: "Failed to build plan." },
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
