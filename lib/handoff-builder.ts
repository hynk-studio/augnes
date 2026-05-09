import {
  createHandoff,
  type HandoffInput,
  type HandoffRecord,
} from "@/lib/handoffs";
import { buildStateBrief } from "@/lib/state/brief";
import {
  buildWorkBrief,
  normalizeScope,
  normalizeWorkId,
  type WorkBrief,
} from "@/lib/work";

const DEFAULT_TARGET_AGENT = "codex";
const DEFAULT_CREATED_BY = "augnes_runtime";

const DEFAULT_EXPECTED_CHECKS = [
  "npm run typecheck",
  "npm run build",
  "npm --prefix apps/augnes_apps run typecheck",
  "npm --prefix apps/augnes_apps run smoke",
  "npm --prefix apps/augnes_apps run invariants",
];

const DEFAULT_EXECUTION_SURFACES = [
  "local_runtime",
  "browser",
  "chrome",
  "github",
  "chatgpt_developer_mode",
];

const BASE_SAFETY_BOUNDARIES = [
  "Treat committed Augnes state as source of truth.",
  "Treat pending proposals as suggestions only.",
  "Surface open tensions before depending on contested state.",
  "Do not commit API keys, local secrets, local DB files, screenshots, tunnel URLs, generated outputs, or local artifacts.",
  "Do not add direct Codex orchestration.",
  "Do not add autonomous Codex execution.",
  "Do not add ChatGPT App commit/reject tools.",
  "Do not add GitHub auto-merge.",
  "Do not add hosted auth or deployment semantics.",
  "Do not add mailbox, publisher, or Cockpit write controls unless a later PR explicitly scopes them.",
];

export type GeneratedHandoffInput = {
  scope?: string | null;
  work_id: string;
  target_agent?: string | null;
  created_by?: string | null;
};

export type GeneratedHandoffDraft = {
  handoff_input: HandoffInput;
  packet_text: string;
};

export type GeneratedHandoffRecord = {
  handoff: HandoffRecord;
  packet_text: string;
};

type StateBrief = ReturnType<typeof buildStateBrief>;

export class HandoffGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HandoffGenerationError";
  }
}

export function buildGeneratedHandoffDraft({
  scope,
  work_id,
  target_agent,
  created_by,
}: GeneratedHandoffInput): GeneratedHandoffDraft {
  const normalizedScope = normalizeScope(scope);
  const workId = normalizeWorkId(work_id);
  const workBrief = buildWorkBrief(workId, normalizedScope);

  if (!workBrief) {
    throw new HandoffGenerationError(
      `Unknown work_id ${workId} for scope ${normalizedScope}.`,
    );
  }

  const stateBrief = buildStateBrief(normalizedScope);
  const relatedStateKeys = collectRelatedStateKeys(stateBrief, workBrief);
  const expectedFiles = collectExpectedFiles(stateBrief, workBrief);
  const expectedChecks = collectExpectedChecks(stateBrief, workBrief);
  const safetyBoundaries = collectSafetyBoundaries(stateBrief, workBrief);
  const completionRecordFields = buildCompletionRecordFields({
    scope: normalizedScope,
    workBrief,
    relatedStateKeys,
  });
  const targetAgent =
    cleanOptionalString(target_agent) ?? DEFAULT_TARGET_AGENT;
  const createdBy = cleanOptionalString(created_by) ?? DEFAULT_CREATED_BY;
  const currentCommittedStateSummary = buildCommittedStateSummary(
    stateBrief,
    workBrief,
  );
  const taskBrief = buildTaskBrief(workBrief);
  const handoffInput: HandoffInput = {
    scope: normalizedScope,
    work_id: workBrief.work_id,
    source_state_brief_ref: `/api/state/brief?scope=${encodeURIComponent(
      normalizedScope,
    )}`,
    source_work_brief_ref: `/api/work/${encodeURIComponent(
      workBrief.work_id,
    )}/brief?scope=${encodeURIComponent(normalizedScope)}`,
    target_agent: targetAgent,
    status: "draft",
    current_committed_state_summary: currentCommittedStateSummary,
    task_brief: taskBrief,
    expected_files: expectedFiles,
    expected_state_keys: relatedStateKeys,
    expected_checks: expectedChecks,
    expected_execution_surfaces: DEFAULT_EXECUTION_SURFACES,
    safety_boundaries: safetyBoundaries,
    completion_record_fields: completionRecordFields,
    created_by: createdBy,
  };

  return {
    handoff_input: handoffInput,
    packet_text: buildPacketText(handoffInput),
  };
}

export function createGeneratedHandoff(
  input: GeneratedHandoffInput,
): GeneratedHandoffRecord {
  const draft = buildGeneratedHandoffDraft(input);

  return {
    handoff: createHandoff(draft.handoff_input),
    packet_text: draft.packet_text,
  };
}

function buildCommittedStateSummary(
  stateBrief: StateBrief,
  workBrief: WorkBrief,
) {
  return [
    `Committed state for ${stateBrief.scope}: ${stateBrief.active_state.length} active, ${stateBrief.future_state.length} future, ${stateBrief.completed_state.length} completed, and ${stateBrief.deprecated_state.length} deprecated state entries.`,
    `Work ${workBrief.work_id} is ${workBrief.work.status}: ${workBrief.work.summary}`,
    `Recent proof context: ${stateBrief.recent_actions.length} action record(s) in the state brief and ${workBrief.recent_events.length} work event(s) on this work item.`,
  ].join(" ");
}

function buildTaskBrief(workBrief: WorkBrief) {
  return workBrief.codex_handoff.task_brief;
}

function collectRelatedStateKeys(
  stateBrief: StateBrief,
  workBrief: WorkBrief,
) {
  return uniqueStrings([
    ...workBrief.related_state_keys,
    ...workBrief.recent_events.flatMap((event) => event.related_state_keys),
    ...stateBrief.agent_handoff.current_status.notable_state_keys,
    ...stateBrief.agent_handoff.next_recommended_action.related_state_keys,
  ]);
}

function collectExpectedFiles(stateBrief: StateBrief, workBrief: WorkBrief) {
  return uniqueStrings([
    ...workBrief.related_proof.docs,
    ...stateBrief.agent_handoff.codex_handoff.likely_files,
  ]);
}

function collectExpectedChecks(stateBrief: StateBrief, workBrief: WorkBrief) {
  return uniqueStrings([
    ...DEFAULT_EXPECTED_CHECKS,
    ...workBrief.codex_handoff.suggested_verification,
    ...stateBrief.agent_handoff.codex_handoff.verification_commands,
  ]);
}

function collectSafetyBoundaries(
  stateBrief: StateBrief,
  workBrief: WorkBrief,
) {
  const pendingWarnings = stateBrief.pending_proposals
    .slice(0, 5)
    .map(
      (proposal) =>
        `Pending proposal warning only: ${proposal.state_key} remains ${proposal.status}; do not treat it as committed state.`,
    );
  const tensionWarnings = stateBrief.open_tensions.slice(0, 5).map((tension) =>
    [
      "Open tension warning:",
      tension.state_key ? `${tension.state_key} -` : "",
      tension.title,
      `(${tension.severity}).`,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return uniqueStrings([
    ...BASE_SAFETY_BOUNDARIES,
    ...stateBrief.agent_instructions,
    ...workBrief.codex_handoff.constraints,
    ...pendingWarnings,
    ...tensionWarnings,
  ]);
}

function buildCompletionRecordFields({
  scope,
  workBrief,
  relatedStateKeys,
}: {
  scope: string;
  workBrief: WorkBrief;
  relatedStateKeys: string[];
}) {
  return {
    CODEX_WORK_ID: workBrief.work_id,
    CODEX_SCOPE: scope,
    CODEX_ACTION_NAME: normalizeActionName(workBrief.work.title),
    CODEX_RESULT_SUMMARY: "Summarize implementation and verification results.",
    CODEX_FILES_CHANGED: "",
    CODEX_RESULT_STATUS: "completed",
    CODEX_RESULT_KIND: "implementation",
    CODEX_RELATED_PR: "https://github.com/Aurna-code/augnes/pull/___",
    CODEX_RELATED_STATE_KEYS: relatedStateKeys.join(","),
  };
}

function buildPacketText(input: HandoffInput) {
  const completionFields = input.completion_record_fields ?? {};

  return [
    "Codex Handoff Packet",
    "",
    "Augnes Work ID:",
    input.work_id ?? "",
    "",
    "Scope:",
    input.scope ?? "project:augnes",
    "",
    "Current committed state summary:",
    `- ${input.current_committed_state_summary}`,
    "",
    "Related state keys:",
    formatBullets(input.expected_state_keys ?? []),
    "",
    "Task for Codex:",
    `- ${input.task_brief}`,
    "",
    "Expected impact:",
    "- Files expected to change:",
    formatBullets(input.expected_files ?? [], "  "),
    "- State keys expected to be referenced or recorded:",
    formatBullets(input.expected_state_keys ?? [], "  "),
    "- Execution surfaces expected:",
    formatBullets(input.expected_execution_surfaces ?? [], "  "),
    "- Checks expected:",
    formatBullets(input.expected_checks ?? [], "  "),
    "",
    "Constraints and safety boundaries:",
    formatBullets(input.safety_boundaries ?? []),
    "",
    "Verification commands:",
    formatBullets(input.expected_checks ?? []),
    "",
    "Browser/Chrome checks:",
    "- Open the relevant local runtime surface when available and verify the changed UI or API behavior.",
    "",
    "ChatGPT App / Developer Mode checks:",
    "- Run only when a Developer Mode endpoint is available; otherwise report the skipped reason.",
    "",
    "Completion record fields:",
    formatCompletionFields(completionFields),
  ].join("\n");
}

function formatBullets(values: string[], indent = "") {
  if (values.length === 0) {
    return `${indent}-`;
  }

  return values.map((value) => `${indent}- ${value}`).join("\n");
}

function formatCompletionFields(fields: Record<string, unknown>) {
  return [
    "CODEX_WORK_ID",
    "CODEX_SCOPE",
    "CODEX_ACTION_NAME",
    "CODEX_RESULT_SUMMARY",
    "CODEX_FILES_CHANGED",
    "CODEX_RESULT_STATUS",
    "CODEX_RESULT_KIND",
    "CODEX_RELATED_PR",
    "CODEX_RELATED_STATE_KEYS",
  ]
    .map((key) => `${key}=${stringField(fields[key])}`)
    .join("\n");
}

function normalizeActionName(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function cleanOptionalString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : "";
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
