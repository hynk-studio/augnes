import {
  PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";

export const PERSPECTIVE_MEMORY_REUSE_PACKET_VERSION =
  "perspective_memory_reuse_packet.v0.1";
export const PERSPECTIVE_MEMORY_REUSE_WORKSPACE_VERSION =
  "perspective_memory_reuse_workspace.v0.1";
export const PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE =
  "/cockpit/perspective/memory-items/reuse";
export const PERSPECTIVE_MEMORY_REUSE_TARGET_MODE = "codex";

const REUSE_TEXT_LIMIT = 900;
const REUSE_TITLE_LIMIT = 180;
const REUSE_TAG_LIMIT = 40;
const REUSE_BOUNDARY_LIMIT = 700;
const REUSE_ARRAY_LIMIT = 80;

export type PerspectiveMemoryReuseSelectionInput = {
  memory_item_id: string;
  why_selected?: string | null;
  reuse_boundary?: string | null;
};

export type PerspectiveMemoryReusePacketInput = {
  items: PerspectiveMemoryItemV0[];
  selected_memory_items: PerspectiveMemoryReuseSelectionInput[];
  task_title: string;
  task_description: string;
  nowIso: string;
  packetId?: string | null;
};

export type PerspectiveMemoryReusePacketV01 = {
  packet_type: typeof PERSPECTIVE_MEMORY_REUSE_PACKET_VERSION;
  packet_id: string;
  created_at: string;
  task: {
    title: string;
    description: string;
  };
  target_mode: typeof PERSPECTIVE_MEMORY_REUSE_TARGET_MODE;
  selected_memory_items: Array<{
    memory_item_id: string;
    title: string;
    summary: string;
    derived_tags: string[];
    source_ref: string;
    why_selected: string;
    reuse_boundary: string;
  }>;
  missing_memory_item_ids: string[];
  reuse_instructions: string[];
  known_boundaries: string[];
  return_expectations: string[];
  authority_boundary: {
    deterministic_local_builder: true;
    memory_items_read: true;
    reuse_packet_created: true;
    codex_memory_brief_created: true;
    memory_item_created: false;
    memory_item_mutated: false;
    perspective_memory_persistence_write_created: false;
    reuse_packet_persisted: false;
    db_schema_changed: false;
    product_boundary_record_created: false;
    proof_evidence_written: false;
    augnes_state_commit_reject_created: false;
    provider_model_call_created: false;
    openai_api_call_created: false;
    codex_sdk_execution_created: false;
    mcp_tool_call_created: false;
    github_mutation_created: false;
    runtime_started: false;
    mcp_bridge_started: false;
    hidden_background_daemon_created: false;
    automatic_synthesis_created: false;
  };
};

export type PerspectiveMemoryReusePacketResultV01 = {
  packet: PerspectiveMemoryReusePacketV01;
  codex_memory_brief: string;
};

type NormalizedPerspectiveMemoryReuseSelection = {
  memory_item_id: string;
  why_selected: string;
  reuse_boundary: string;
};

export function buildPerspectiveMemoryReusePacket(
  input: PerspectiveMemoryReusePacketInput,
): PerspectiveMemoryReusePacketResultV01 {
  const selectedInputs = normalizeSelectedInputs(input.selected_memory_items).slice(
    0,
    PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  );
  const itemsById = new Map(input.items.map((item) => [item.item_id, item]));
  const selectedItems = selectedInputs
    .map((selection) => {
      const item = itemsById.get(selection.memory_item_id);
      return item ? { item, selection } : null;
    })
    .filter(
      (
        entry,
      ): entry is {
        item: PerspectiveMemoryItemV0;
        selection: NormalizedPerspectiveMemoryReuseSelection;
      } => entry != null,
    );
  const selectedItemIds = new Set(
    selectedItems.map(({ item }) => item.item_id),
  );
  const missingMemoryItemIds = selectedInputs
    .map((selection) => selection.memory_item_id)
    .filter((itemId) => !selectedItemIds.has(itemId));

  const taskTitle = boundText(input.task_title, REUSE_TITLE_LIMIT);
  const taskDescription = boundText(input.task_description, REUSE_TEXT_LIMIT);
  const packet: PerspectiveMemoryReusePacketV01 = {
    packet_type: PERSPECTIVE_MEMORY_REUSE_PACKET_VERSION,
    packet_id: boundText(
      input.packetId || buildDefaultPacketId(input.nowIso, taskTitle),
      220,
    ),
    created_at: input.nowIso,
    task: {
      title: taskTitle,
      description: taskDescription,
    },
    target_mode: PERSPECTIVE_MEMORY_REUSE_TARGET_MODE,
    selected_memory_items: selectedItems.map(({ item, selection }) => ({
      memory_item_id: item.item_id,
      title: boundText(item.content.title, REUSE_TITLE_LIMIT),
      summary: boundText(item.content.summary, REUSE_TEXT_LIMIT),
      derived_tags: deriveTagsFromMemoryItem(item),
      source_ref: buildSourceRef(item),
      why_selected: boundText(selection.why_selected, REUSE_BOUNDARY_LIMIT),
      reuse_boundary: boundText(selection.reuse_boundary, REUSE_BOUNDARY_LIMIT),
    })),
    missing_memory_item_ids: missingMemoryItemIds,
    reuse_instructions: [
      "Use these memories to avoid repeating closed work.",
      "Use these memories to preserve Augnes direction.",
      "Use these memories to identify the next implementation slice.",
      "Report back changed files, verification, skipped checks, and remaining friction.",
    ],
    known_boundaries: [
      "Deterministic local builder only.",
      "No automatic synthesis.",
      "No automatic memory creation.",
      "No perspective-memory persistence writes.",
      "No DB schema or migration.",
      "No reuse packet persistence table.",
      "No product boundary record creation.",
      "No proof/evidence writes.",
      "No Augnes state commit/reject.",
      "No runtime startup.",
      "No MCP bridge startup.",
      "No MCP tool calls.",
      "No provider/model calls.",
      "No OpenAI API calls.",
      "No Codex SDK execution.",
      "No GitHub API mutation from scripts.",
      "No hidden background daemon.",
    ],
    return_expectations: [
      "Changed files",
      "Verification",
      "Skipped checks with concrete reasons",
      "Remaining friction",
    ],
    authority_boundary: buildAuthorityBoundary(),
  };

  return {
    packet,
    codex_memory_brief: buildCodexMemoryBrief(packet),
  };
}

export function buildCodexMemoryBrief(
  packet: PerspectiveMemoryReusePacketV01,
): string {
  const lines: string[] = [
    "# Codex Memory Brief",
    "",
    "## Task",
    `Title: ${packet.task.title || "Untitled Codex task"}`,
    "",
    packet.task.description || "No task description provided.",
    "",
    "## Relevant Augnes Perspective Memory",
  ];

  if (packet.selected_memory_items.length === 0) {
    lines.push("- No persisted perspective-memory items selected.");
  } else {
    packet.selected_memory_items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.title}`,
        `   - memory_item_id: ${item.memory_item_id}`,
        `   - source_ref: ${item.source_ref}`,
        `   - summary: ${item.summary}`,
        `   - derived_tags: ${item.derived_tags.join(", ") || "none"}`,
        `   - why relevant: ${item.why_selected || "not provided"}`,
        `   - boundary: ${item.reuse_boundary || "not provided"}`,
      );
    });
  }

  lines.push(
    "",
    "## Reuse Instructions",
    "- Use these memories to avoid repeating closed work, preserve Augnes direction, identify next implementation slice, and report back changed files, verification, skipped checks, and remaining friction.",
    "- Do not create memory items, mutate Augnes state, run provider/model calls, call MCP tools, use Codex SDK, or perform GitHub mutation.",
    "",
    "## Return Expectations",
    "- Changed files",
    "- Verification",
    "- Skipped checks with concrete reasons",
    "- Remaining friction",
    "",
    "## Authority Boundary",
  );

  for (const boundary of packet.known_boundaries) {
    lines.push(`- ${boundary}`);
  }

  if (packet.missing_memory_item_ids.length > 0) {
    lines.push("", "## Missing Memory Item IDs");
    for (const itemId of packet.missing_memory_item_ids) {
      lines.push(`- ${itemId}`);
    }
  }

  return lines.join("\n");
}

function normalizeSelectedInputs(
  selectedItems: PerspectiveMemoryReuseSelectionInput[],
): NormalizedPerspectiveMemoryReuseSelection[] {
  const seen = new Set<string>();
  const result: NormalizedPerspectiveMemoryReuseSelection[] = [];
  for (const selection of selectedItems) {
    const memoryItemId = boundText(selection.memory_item_id, 220);
    const normalized = normalizeText(memoryItemId);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push({
      memory_item_id: memoryItemId,
      why_selected: boundText(selection.why_selected ?? "", REUSE_BOUNDARY_LIMIT),
      reuse_boundary: boundText(
        selection.reuse_boundary ?? "",
        REUSE_BOUNDARY_LIMIT,
      ),
    });
  }
  return result;
}

function deriveTagsFromMemoryItem(item: PerspectiveMemoryItemV0) {
  const tags = [
    `status:${item.item_status}`,
    `kind:${item.memory_kind}`,
    `validation:${item.source_validation_result_state}`,
    item.source_boundary_record_id
      ? `source_boundary:${item.source_boundary_record_id}`
      : "",
    item.source_candidate_draft_id
      ? `candidate:${item.source_candidate_draft_id}`
      : "",
    ...item.content.source_refs.map((ref) => `source_ref:${ref}`),
    ...item.content.risk_notes.map((note) => `risk:${note}`),
    ...item.content.carry_forward_questions.map((question) => `question:${question}`),
  ];
  return uniqueBoundedStrings(tags, REUSE_TAG_LIMIT, 240);
}

function buildSourceRef(item: PerspectiveMemoryItemV0) {
  const refs = [
    item.source_input_ref,
    ...item.content.source_refs,
    item.source_boundary_record_id,
  ].filter(Boolean);
  return boundText(refs[0] ?? item.item_id, 240);
}

function buildAuthorityBoundary(): PerspectiveMemoryReusePacketV01["authority_boundary"] {
  return {
    deterministic_local_builder: true,
    memory_items_read: true,
    reuse_packet_created: true,
    codex_memory_brief_created: true,
    memory_item_created: false,
    memory_item_mutated: false,
    perspective_memory_persistence_write_created: false,
    reuse_packet_persisted: false,
    db_schema_changed: false,
    product_boundary_record_created: false,
    proof_evidence_written: false,
    augnes_state_commit_reject_created: false,
    provider_model_call_created: false,
    openai_api_call_created: false,
    codex_sdk_execution_created: false,
    mcp_tool_call_created: false,
    github_mutation_created: false,
    runtime_started: false,
    mcp_bridge_started: false,
    hidden_background_daemon_created: false,
    automatic_synthesis_created: false,
  };
}

function buildDefaultPacketId(nowIso: string, taskTitle: string) {
  const normalizedTitle = normalizeText(taskTitle).replace(/[^a-z0-9]+/g, "-");
  const suffix = normalizedTitle.length > 0 ? normalizedTitle.slice(0, 60) : "untitled";
  return `perspective-memory-reuse-packet:${nowIso}:${suffix}`;
}

function uniqueBoundedStrings(
  values: string[],
  limit: number,
  maxLength: number,
) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const bounded = boundText(value, maxLength);
    const normalized = normalizeText(bounded);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(bounded);
    if (result.length >= limit) break;
  }
  return result;
}

function boundText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
