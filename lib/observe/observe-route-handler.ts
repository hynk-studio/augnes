import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  ensureAgent,
  ensureSession,
  insertMessage,
  insertPendingStateDeltaProposals,
  listStateEntries,
  type PendingStateDeltaProposalInput,
} from "@/lib/db";
import {
  compileTemporalDeltaProposals,
  validateObserveRequest,
} from "@/lib/observe/delta-compiler";
import type { ObserveModelGatewayDependenciesV01 } from "@/lib/vnext/model-gateway/model-gateway";
import { isModelGatewayInvocationErrorV01 } from "@/lib/vnext/model-gateway/contracts";

const COMPILER_AGENT_ID = "agent:temporal-delta-compiler";

export interface ObserveRouteDependenciesV01 {
  create_uuid?: () => string;
  now?: () => Date;
  gateway_dependencies?: Omit<
    ObserveModelGatewayDependenciesV01,
    "deterministic_execute"
  >;
}

export function createObservePostHandlerV01(
  dependencies: ObserveRouteDependenciesV01 = {},
) {
  return async function observePost(request: Request) {
    let observeRequest;
    try {
      observeRequest = validateObserveRequest(await request.json());
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const createUuid = dependencies.create_uuid ?? randomUUID;
    const now = (dependencies.now ?? (() => new Date()))().toISOString();
    const sessionId =
      observeRequest.session_id ?? `session:observe:${createUuid()}`;
    const messageId = `message:observe:${createUuid()}`;
    const invocationId = `model-invocation:${createUuid()}`;

    try {
      const currentState = listStateEntries(observeRequest.project_id);
      const compiled = await compileTemporalDeltaProposals({
        invocationId,
        workspaceId: observeRequest.workspace_id,
        projectId: observeRequest.project_id,
        expectedActiveProjectId: observeRequest.expected_active_project_id,
        expectedActiveSelectionRevision:
          observeRequest.expected_active_selection_revision,
        message: observeRequest.message,
        currentState,
        provenanceRefs: [
          `sha256:${createHash("sha256")
            .update(observeRequest.message, "utf8")
            .digest("hex")}`,
        ],
        projectRoot: observeRequest.project_root,
        executionMode: observeRequest.execution_mode,
        cancellationSignal: request.signal,
        gatewayDependencies: dependencies.gateway_dependencies,
      });

      ensureAgent({
        id: COMPILER_AGENT_ID,
        name: "Temporal Delta Compiler",
        kind: "compiler",
      });
      ensureSession({
        id: sessionId,
        agent_id: COMPILER_AGENT_ID,
        scope: observeRequest.project_id,
        title: "Observe user message",
      });
      insertMessage({
        id: messageId,
        session_id: sessionId,
        agent_id: null,
        role: "user",
        content: observeRequest.message,
        created_at: now,
      });

      const pendingInputs: PendingStateDeltaProposalInput[] =
        compiled.proposals.map((proposal) => ({
          id: `proposal:observe:${createUuid()}`,
          scope: observeRequest.project_id,
          state_key: proposal.state_key,
          before_value: proposal.before_value,
          after_value: proposal.after_value,
          operation: proposal.operation,
          temporal_scope: proposal.temporal_scope,
          valid_from: proposal.valid_from,
          valid_until: proposal.valid_until,
          stability: proposal.stability,
          change_type: proposal.change_type,
          source_agent_id: COMPILER_AGENT_ID,
          source_session_id: sessionId,
          reason: proposal.reason,
          proposed_at: now,
        }));
      const savedProposals = insertPendingStateDeltaProposals(pendingInputs, {
        currentState,
        now,
      });

      return NextResponse.json(
        {
          workspace_id: observeRequest.workspace_id,
          project_id: observeRequest.project_id,
          scope: observeRequest.project_id,
          session_id: sessionId,
          message_id: messageId,
          compiler: compiled.compiler,
          proposals: savedProposals,
          model_invocation_receipt: compiled.model_invocation_receipt,
        },
        { status: 201 },
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
        { error: "Failed to compile temporal delta proposals." },
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
  if (
    code === "model_gateway_invalid_envelope" ||
    code === "model_gateway_budget_refused" ||
    code === "model_gateway_egress_refused"
  ) {
    return 400;
  }
  return 502;
}
