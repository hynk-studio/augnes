import {
  compileTemporalDeltaProposals,
  validateObserveRequest,
} from "@/lib/observe/delta-compiler";
import {
  ensureAgent,
  ensureSession,
  insertMessage,
  insertPendingStateDeltaProposals,
  listStateEntries,
  type PendingStateDeltaProposalInput,
} from "@/lib/db";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPILER_AGENT_ID = "agent:temporal-delta-compiler";

export async function POST(request: Request) {
  let observeRequest;

  try {
    observeRequest = validateObserveRequest(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request body." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const sessionId =
    observeRequest.session_id ?? `session:observe:${randomUUID()}`;
  const messageId = `message:observe:${randomUUID()}`;

  try {
    ensureAgent({
      id: COMPILER_AGENT_ID,
      name: "Temporal Delta Compiler",
      kind: "compiler",
    });

    ensureSession({
      id: sessionId,
      agent_id: COMPILER_AGENT_ID,
      scope: observeRequest.scope,
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

    const currentState = listStateEntries(observeRequest.scope);
    const compiled = await compileTemporalDeltaProposals({
      message: observeRequest.message,
      scope: observeRequest.scope,
      currentState,
    });

    const pendingInputs: PendingStateDeltaProposalInput[] =
      compiled.proposals.map((proposal) => ({
        id: `proposal:observe:${randomUUID()}`,
        scope: observeRequest.scope,
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

    const savedProposals =
      insertPendingStateDeltaProposals(pendingInputs);

    return NextResponse.json(
      {
        scope: observeRequest.scope,
        session_id: sessionId,
        message_id: messageId,
        compiler: compiled.compiler,
        proposals: savedProposals,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to compile temporal delta proposals.",
      },
      { status: 500 },
    );
  }
}
