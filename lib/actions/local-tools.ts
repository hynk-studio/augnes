import {
  commitStateUpdate,
  ensureAgent,
  insertActionRecord,
  type ActionRecord,
  type StateTransition,
} from "@/lib/db";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const TOOL_NAMES = [
  "create_readme_checklist",
  "create_security_checklist",
  "create_demo_script",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

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
}: {
  scope: string;
  sourceAgentId: string;
  actionName: string;
  resultSummary: string;
  filesChanged: string[];
}) {
  ensureAgent({
    id: sourceAgentId,
    name: sourceAgentId,
    kind: "external",
  });

  const actionRecord = insertActionRecord({
    scope,
    state_key: `external.${sanitizeStateSegment(actionName)}_recorded`,
    title: actionName,
    description: JSON.stringify({
      result_summary: resultSummary,
      files_changed: filesChanged,
    }),
    status: "completed",
    source_agent_id: sourceAgentId,
  });
  const { transition } = commitStateUpdate({
    scope,
    state_key: `external.${sanitizeStateSegment(actionName)}_recorded`,
    before_value: false,
    after_value: true,
    temporal_scope: "current_project",
    stability: "completed",
    change_type: "completion",
    source_agent_id: sourceAgentId,
    source_session_id: null,
    reason: resultSummary,
  });

  return {
    action_record: actionRecord,
    transition,
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
