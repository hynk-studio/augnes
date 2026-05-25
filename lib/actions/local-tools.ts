import {
  commitStateUpdate,
  ensureAgent,
  insertActionRecord,
  type ActionRecord,
  type StateTransition,
} from "@/lib/db";
import { appendCoordinationEvent } from "@/lib/coordination-events";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const TOOL_NAMES = [
  "create_readme_checklist",
  "create_security_checklist",
  "create_demo_script",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const ACTION_RESULT_STATUSES = [
  "completed",
  "failed",
  "blocked",
  "partial",
  "needs_review",
] as const;

export const ACTION_RESULT_KINDS = [
  "implementation",
  "verification",
  "documentation",
  "screenshot",
  "handoff",
  "review",
  "other",
] as const;

export type ActionResultStatus = (typeof ACTION_RESULT_STATUSES)[number];
export type ActionResultKind = (typeof ACTION_RESULT_KINDS)[number];

type ToolResult = {
  tool_name: ToolName;
  output_path: string;
  action_record: ActionRecord;
  transition: StateTransition;
};

const TOOL_CONFIG: Record<
  ToolName,
  {
    outputFile: string;
    title: string;
    stateKey: string;
    summary: string;
    contents: string;
  }
> = {
  create_readme_checklist: {
    outputFile: "readme_checklist.md",
    title: "Create README checklist",
    stateKey: "submission.readme_checklist_created",
    summary: "Created README submission checklist.",
    contents: [
      "# README Checklist",
      "",
      "- [ ] Confirm setup commands are accurate.",
      "- [ ] Document database reset and demo seed flow.",
      "- [ ] Describe observe, proposal, commit, reject, planner, tools, and state brief APIs.",
      "- [ ] Confirm no API keys or local SQLite files are committed.",
      "- [ ] Include final demo sequence.",
      "",
    ].join("\n"),
  },
  create_security_checklist: {
    outputFile: "security_checklist.md",
    title: "Create security checklist",
    stateKey: "security.checklist_created",
    summary: "Created security checklist for demo readiness.",
    contents: [
      "# Security Checklist",
      "",
      "- [ ] Keep `.env.local` untracked.",
      "- [ ] Keep `data/*.db` untracked.",
      "- [ ] Verify no API keys appear in committed files.",
      "- [ ] Use mock planner and observe fallbacks when no key is configured.",
      "",
    ].join("\n"),
  },
  create_demo_script: {
    outputFile: "demo_script.md",
    title: "Create demo script",
    stateKey: "demo.script_created",
    summary: "Created final demo script.",
    contents: [
      "# Demo Script",
      "",
      "1. Reset and seed the local runtime.",
      "2. Submit the canonical observe message.",
      "3. Commit and reject temporal delta proposals.",
      "4. Run a state-grounded tool.",
      "5. Show snapshot, trajectory, tensions, and state brief.",
      "",
    ].join("\n"),
  },
};

export function validateToolName(value: unknown): ToolName {
  if (typeof value === "string" && TOOL_NAMES.includes(value as ToolName)) {
    return value as ToolName;
  }

  throw new Error("tool_name must be one of the local Augnes tools.");
}

export function runLocalTool({
  scope,
  toolName,
  sourceAgentId = "agent:augnes-runtime",
}: {
  scope: string;
  toolName: ToolName;
  sourceAgentId?: string;
}): ToolResult {
  const config = TOOL_CONFIG[toolName];
  const outputPath = path.join("outputs", config.outputFile);
  const absolutePath = path.join(process.cwd(), "outputs", config.outputFile);
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, config.contents, "utf8");
  ensureAgent({
    id: sourceAgentId,
    name: "Augnes Runtime",
    kind: "runtime",
  });

  const actionRecord = insertActionRecord({
    scope,
    state_key: config.stateKey,
    title: config.title,
    description: JSON.stringify({
      result_summary: config.summary,
      files_changed: [outputPath],
      result_status: "completed",
      result_kind: "implementation",
    }),
    status: "completed",
    source_agent_id: sourceAgentId,
  });
  const { transition } = commitStateUpdate({
    scope,
    state_key: config.stateKey,
    before_value: false,
    after_value: true,
    temporal_scope: "current_project",
    stability: "completed",
    change_type: "completion",
    source_agent_id: sourceAgentId,
    source_session_id: null,
    reason: config.summary,
  });
  appendCoordinationEvent({
    event_id: `event:${actionRecord.id}`,
    event_type: "action_result_recorded",
    scope,
    work_id: null,
    actor: sourceAgentId,
    source_surface: "local_runtime",
    authority_level: "action_proof",
    state_keys: [config.stateKey],
    payload_ref: actionRecord.id,
    result_status: "completed",
    created_at: actionRecord.created_at,
  });

  return {
    tool_name: toolName,
    output_path: outputPath,
    action_record: actionRecord,
    transition,
  };
}

export function recordExternalAction({
  scope,
  sourceAgentId,
  actionName,
  resultSummary,
  filesChanged,
  resultStatus = "completed",
  resultKind = "other",
  workId = null,
}: {
  scope: string;
  sourceAgentId: string;
  actionName: string;
  resultSummary: string;
  filesChanged: string[];
  resultStatus?: ActionResultStatus;
  resultKind?: ActionResultKind;
  workId?: string | null;
}) {
  ensureAgent({
    id: sourceAgentId,
    name: sourceAgentId,
    kind: "external",
  });

  const stateKey = `external.${sanitizeStateSegment(actionName)}_recorded`;
  const transition = transitionForResultStatus(resultStatus);
  const actionRecord = insertActionRecord({
    scope,
    state_key: stateKey,
    title: actionName,
    description: JSON.stringify({
      result_summary: resultSummary,
      files_changed: filesChanged,
      result_status: resultStatus,
      result_kind: resultKind,
    }),
    status: resultStatus,
    source_agent_id: sourceAgentId,
  });
  const { transition: stateTransition } = commitStateUpdate({
    scope,
    state_key: stateKey,
    before_value: transition.beforeValue,
    after_value: transition.afterValue,
    temporal_scope: "current_project",
    stability: transition.stability,
    change_type: transition.changeType,
    source_agent_id: sourceAgentId,
    source_session_id: null,
    reason: resultSummary,
  });
  appendCoordinationEvent({
    event_id: `event:${actionRecord.id}`,
    event_type: "action_result_recorded",
    scope,
    work_id: workId,
    actor: sourceAgentId,
    source_surface: "local_runtime",
    authority_level: "action_proof",
    state_keys: actionRecord.state_key ? [actionRecord.state_key] : [],
    payload_ref: actionRecord.id,
    result_status: resultStatus,
    created_at: actionRecord.created_at,
  });

  return {
    action_record: actionRecord,
    transition: stateTransition,
  };
}

export function recordActionProof({
  scope,
  sourceAgentId,
  actionName,
  resultSummary,
  filesChanged,
  resultStatus = "completed",
  resultKind = "other",
  workId = null,
  relatedStateKeys = [],
}: {
  scope: string;
  sourceAgentId: string;
  actionName: string;
  resultSummary: string;
  filesChanged: string[];
  resultStatus?: ActionResultStatus;
  resultKind?: ActionResultKind;
  workId?: string | null;
  relatedStateKeys?: string[];
}) {
  ensureAgent({
    id: sourceAgentId,
    name: sourceAgentId,
    kind: "external",
  });

  const actionRecord = insertActionRecord({
    scope,
    state_key: null,
    title: actionName,
    description: JSON.stringify({
      result_summary: resultSummary,
      files_changed: filesChanged,
      result_status: resultStatus,
      result_kind: resultKind,
      related_state_keys: relatedStateKeys,
    }),
    status: resultStatus,
    source_agent_id: sourceAgentId,
  });
  appendCoordinationEvent({
    event_id: `event:${actionRecord.id}`,
    event_type: "action_result_recorded",
    scope,
    work_id: workId,
    actor: sourceAgentId,
    source_surface: "local_runtime",
    authority_level: "action_proof",
    state_keys: relatedStateKeys,
    payload_ref: actionRecord.id,
    result_status: resultStatus,
    created_at: actionRecord.created_at,
  });

  return {
    action_record: actionRecord,
  };
}

function transitionForResultStatus(status: ActionResultStatus): {
  beforeValue: boolean | string;
  afterValue: boolean | string;
  stability: string;
  changeType: string;
} {
  if (status === "completed") {
    return {
      beforeValue: false,
      afterValue: true,
      stability: "completed",
      changeType: "completion",
    };
  }

  if (status === "failed" || status === "blocked") {
    return {
      beforeValue: "pending",
      afterValue: status,
      stability: "active",
      changeType: "refinement",
    };
  }

  return {
    beforeValue: "pending",
    afterValue: status,
    stability: "tentative",
    changeType: "refinement",
  };
}

function sanitizeStateSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}
