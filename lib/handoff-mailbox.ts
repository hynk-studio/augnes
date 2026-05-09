import {
  createMailboxMessage,
  listMailboxMessages,
  updateMailboxMessageStatus,
  type MailboxMessage,
  type MailboxStatus,
} from "@/lib/mailbox";
import type { HandoffRecord } from "@/lib/handoffs";
import { getWorkItem, normalizeScope, normalizeWorkId } from "@/lib/work";

const HANDOFF_MAILBOX_STATUSES = [
  "ready",
  "delivered",
  "acknowledged",
  "reviewed",
  "superseded",
  "expired",
] as const satisfies readonly MailboxStatus[];

type HandoffMailboxStatus = (typeof HANDOFF_MAILBOX_STATUSES)[number];

const TERMINAL_MAILBOX_STATUSES = ["superseded", "expired"] as const;
const ACTIVE_MAILBOX_STATUSES = [
  "ready",
  "delivered",
  "acknowledged",
  "reviewed",
] as const satisfies readonly MailboxStatus[];

export type HandoffMailboxSyncResult = {
  mailbox_message: MailboxMessage | null;
  action:
    | "created"
    | "updated"
    | "unchanged"
    | "skipped_draft";
};

export class HandoffMailboxSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HandoffMailboxSyncError";
  }
}

export function assertCanSyncMailboxForHandoffInput({
  handoffId,
  scope,
  workId,
  status,
}: {
  handoffId?: string | null;
  scope?: string | null;
  workId?: string | null;
  status: string;
}) {
  const normalizedScope = normalizeScope(scope);
  const normalizedWorkId = workId ? normalizeWorkId(workId) : null;
  const targetStatus = handoffStatusToMailboxStatus(status);
  if (!targetStatus) {
    return;
  }

  assertWorkIdCanSync({
    scope: normalizedScope,
    workId: normalizedWorkId,
  });

  const cleanHandoffId = cleanNullableString(handoffId);
  if (cleanHandoffId) {
    assertTerminalMailboxDoesNotBlockActiveStatus({
      handoffId: cleanHandoffId,
      scope: normalizedScope,
      targetStatus,
    });
  }
}

export function assertCanSyncMailboxForHandoffStatus(
  handoff: HandoffRecord,
  status: string,
) {
  const targetStatus = handoffStatusToMailboxStatus(status);
  if (!targetStatus) {
    return;
  }

  assertWorkIdCanSync({
    scope: handoff.scope,
    workId: handoff.work_id,
  });
  assertTerminalMailboxDoesNotBlockActiveStatus({
    handoffId: handoff.handoff_id,
    scope: handoff.scope,
    targetStatus,
  });
}

export function syncMailboxForHandoff(
  handoff: HandoffRecord,
): HandoffMailboxSyncResult {
  const targetStatus = handoffStatusToMailboxStatus(handoff.status);
  if (!targetStatus) {
    return { mailbox_message: null, action: "skipped_draft" };
  }
  assertCanSyncMailboxForHandoffStatus(handoff, targetStatus);

  const existingMessage = findMailboxMessageForHandoff(handoff);
  if (!existingMessage) {
    return {
      mailbox_message: createMailboxMessage({
        scope: handoff.scope,
        work_id: handoff.work_id,
        from_agent: handoff.created_by || "augnes_runtime",
        to_agent: handoff.target_agent,
        message_type: "handoff",
        summary: buildHandoffMailboxSummary(handoff),
        payload_ref: handoff.handoff_id,
        requires_ack: true,
        status: targetStatus,
      }),
      action: "created",
    };
  }

  if (existingMessage.status === targetStatus) {
    return {
      mailbox_message: existingMessage,
      action: "unchanged",
    };
  }

  return {
    mailbox_message: updateMailboxMessageStatus({
      messageId: existingMessage.message_id,
      scope: existingMessage.scope,
      status: targetStatus,
    }),
    action: "updated",
  };
}

function assertWorkIdCanSync({
  scope,
  workId,
}: {
  scope: string;
  workId: string | null;
}) {
  if (workId && !getWorkItem(workId, scope)) {
    throw new HandoffMailboxSyncError(
      `Cannot sync handoff mailbox message because work_id ${workId} is unknown for scope ${scope}.`,
    );
  }
}

function assertTerminalMailboxDoesNotBlockActiveStatus({
  handoffId,
  scope,
  targetStatus,
}: {
  handoffId: string;
  scope: string;
  targetStatus: HandoffMailboxStatus;
}) {
  if (!isActiveMailboxStatus(targetStatus)) {
    return;
  }

  const messages = listMailboxMessages({
    scope,
    messageType: "handoff",
    payloadRef: handoffId,
    limit: 10,
  });
  const terminalMessage = messages.find((message) =>
    isTerminalMailboxStatus(message.status),
  );
  if (terminalMessage) {
    throw new HandoffMailboxSyncError(
      `Cannot reactivate handoff ${handoffId} to ${targetStatus} because linked mailbox message ${terminalMessage.message_id} is ${terminalMessage.status}. Reopen behavior is not implemented.`,
    );
  }
}

function isActiveMailboxStatus(status: string) {
  return ACTIVE_MAILBOX_STATUSES.includes(
    status as (typeof ACTIVE_MAILBOX_STATUSES)[number],
  );
}

function findMailboxMessageForHandoff(handoff: HandoffRecord) {
  const messages = listMailboxMessages({
    scope: handoff.scope,
    messageType: "handoff",
    payloadRef: handoff.handoff_id,
    limit: 10,
  });

  return (
    messages.find((message) => !isTerminalMailboxStatus(message.status)) ??
    messages[0] ??
    null
  );
}

function handoffStatusToMailboxStatus(status: string) {
  return HANDOFF_MAILBOX_STATUSES.includes(status as HandoffMailboxStatus)
    ? (status as HandoffMailboxStatus)
    : null;
}

function isTerminalMailboxStatus(status: string) {
  return TERMINAL_MAILBOX_STATUSES.includes(
    status as (typeof TERMINAL_MAILBOX_STATUSES)[number],
  );
}

function buildHandoffMailboxSummary(handoff: HandoffRecord) {
  const taskBrief = handoff.task_brief.trim().replace(/\s+/g, " ");
  const conciseTask =
    taskBrief.length > 180 ? `${taskBrief.slice(0, 177).trim()}...` : taskBrief;

  return `${handoff.work_id ?? "Unscoped work"} handoff for ${
    handoff.target_agent
  }: ${conciseTask}`;
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
