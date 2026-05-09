import {
  listMailboxMessages,
  type MailboxMessage,
  type MailboxMessageType,
} from "@/lib/mailbox";
import { normalizeScope } from "@/lib/work";

const DEFAULT_SUMMARY_LIMIT = 10;
const SUMMARY_SOURCE_LIMIT = 200;
const INACTIVE_STATUSES = ["superseded", "expired"] as const;
const PENDING_HANDOFF_STATUSES = ["ready", "delivered"] as const;
const NEEDS_REVIEW_TYPES = [
  "review_request",
  "result_report",
  "verification_needed",
] as const satisfies readonly MailboxMessageType[];
const NEEDS_REVIEW_HANDOFF_STATUSES = ["acknowledged", "reviewed"] as const;
const BLOCKED_OR_PARTIAL_RESULT_PATTERN = /\b(blocked|partial)\b/i;

export type MailboxSummaryItem = Pick<
  MailboxMessage,
  | "message_id"
  | "scope"
  | "work_id"
  | "from_agent"
  | "to_agent"
  | "message_type"
  | "summary"
  | "payload_ref"
  | "requires_ack"
  | "status"
  | "created_at"
  | "updated_at"
  | "acknowledged_at"
  | "supersedes_message_id"
> & {
  summary_reason: string;
};

export type MailboxSummary = {
  pending_handoffs: MailboxSummaryItem[];
  needs_review: MailboxSummaryItem[];
  approval_needed: MailboxSummaryItem[];
  blocked_or_partial: MailboxSummaryItem[];
  inactive: {
    superseded_count: number;
    expired_count: number;
  };
};

export type MailboxSummaryResponse = {
  scope: string;
  as_of: string;
  summary: MailboxSummary;
  boundaries: string[];
};

export function buildMailboxSummary({
  scope,
  limit = DEFAULT_SUMMARY_LIMIT,
}: {
  scope?: string | null;
  limit?: number;
}): MailboxSummaryResponse {
  const normalizedScope = normalizeScope(scope);
  const boundedLimit = normalizeSummaryLimit(limit);
  const messages = listMailboxMessages({
    scope: normalizedScope,
    limit: SUMMARY_SOURCE_LIMIT,
  });
  const activeMessages = messages.filter((message) => !isInactive(message));

  return {
    scope: normalizedScope,
    as_of: new Date().toISOString(),
    summary: {
      pending_handoffs: takeSummaryItems(
        activeMessages
          .filter(isPendingHandoff)
          .map((message) =>
            toSummaryItem(message, "handoff message is ready or delivered"),
          ),
        boundedLimit,
      ),
      needs_review: takeSummaryItems(
        activeMessages
          .filter(isNeedsReview)
          .map((message) =>
            toSummaryItem(message, needsReviewReason(message)),
          ),
        boundedLimit,
      ),
      approval_needed: takeSummaryItems(
        activeMessages
          .filter((message) => message.message_type === "approval_needed")
          .map((message) =>
            toSummaryItem(message, "message_type is approval_needed"),
          ),
        boundedLimit,
      ),
      blocked_or_partial: takeSummaryItems(
        activeMessages
          .filter(isBlockedOrPartial)
          .map((message) =>
            toSummaryItem(message, blockedOrPartialReason(message)),
          ),
        boundedLimit,
      ),
      inactive: {
        superseded_count: messages.filter(
          (message) => message.status === "superseded",
        ).length,
        expired_count: messages.filter((message) => message.status === "expired")
          .length,
      },
    },
    boundaries: [
      "Mailbox summaries are derived read-only views, not sources of truth.",
      "Summaries do not approve, reject, commit, execute Codex, publish, or record proof.",
      "Superseded and expired messages are excluded from active summary buckets.",
    ],
  };
}

function isPendingHandoff(message: MailboxMessage) {
  return (
    message.message_type === "handoff" &&
    PENDING_HANDOFF_STATUSES.includes(
      message.status as (typeof PENDING_HANDOFF_STATUSES)[number],
    )
  );
}

function isNeedsReview(message: MailboxMessage) {
  return (
    NEEDS_REVIEW_TYPES.includes(
      message.message_type as (typeof NEEDS_REVIEW_TYPES)[number],
    ) ||
    (message.message_type === "handoff" &&
      NEEDS_REVIEW_HANDOFF_STATUSES.includes(
        message.status as (typeof NEEDS_REVIEW_HANDOFF_STATUSES)[number],
      ))
  );
}

function isBlockedOrPartial(message: MailboxMessage) {
  return (
    message.message_type === "blocked_notice" ||
    (message.message_type === "result_report" &&
      BLOCKED_OR_PARTIAL_RESULT_PATTERN.test(message.summary))
  );
}

function isInactive(message: MailboxMessage) {
  return INACTIVE_STATUSES.includes(
    message.status as (typeof INACTIVE_STATUSES)[number],
  );
}

function needsReviewReason(message: MailboxMessage) {
  if (message.message_type === "handoff") {
    return `handoff status is ${message.status}`;
  }

  return `message_type is ${message.message_type}`;
}

function blockedOrPartialReason(message: MailboxMessage) {
  if (message.message_type === "blocked_notice") {
    return "message_type is blocked_notice";
  }

  return "result_report summary contains blocked or partial";
}

function toSummaryItem(
  message: MailboxMessage,
  summaryReason: string,
): MailboxSummaryItem {
  return {
    message_id: message.message_id,
    scope: message.scope,
    work_id: message.work_id,
    from_agent: message.from_agent,
    to_agent: message.to_agent,
    message_type: message.message_type,
    summary: message.summary,
    payload_ref: message.payload_ref,
    requires_ack: message.requires_ack,
    status: message.status,
    created_at: message.created_at,
    updated_at: message.updated_at,
    acknowledged_at: message.acknowledged_at,
    supersedes_message_id: message.supersedes_message_id,
    summary_reason: summaryReason,
  };
}

function takeSummaryItems(items: MailboxSummaryItem[], limit: number) {
  return items.slice(0, limit);
}

function normalizeSummaryLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_SUMMARY_LIMIT;
  }

  return Math.min(25, Math.max(1, Math.floor(limit)));
}
