import {
  createMailboxMessage,
  listMailboxMessages,
  updateMailboxMessageStatus,
  type MailboxMessage,
  type MailboxStatus,
} from "@/lib/mailbox";
import type { HandoffRecord } from "@/lib/handoffs";

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

export type HandoffMailboxSyncResult = {
  mailbox_message: MailboxMessage | null;
  action:
    | "created"
    | "updated"
    | "unchanged"
    | "skipped_draft"
    | "skipped_terminal";
};

export function syncMailboxForHandoff(
  handoff: HandoffRecord,
): HandoffMailboxSyncResult {
  const targetStatus = handoffStatusToMailboxStatus(handoff.status);
  if (!targetStatus) {
    return { mailbox_message: null, action: "skipped_draft" };
  }

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

  if (
    targetStatus === "ready" &&
    isTerminalMailboxStatus(existingMessage.status)
  ) {
    return {
      mailbox_message: existingMessage,
      action: "skipped_terminal",
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
