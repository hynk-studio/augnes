import type {
  PerspectiveIngestLocalPastedTextPreviewRequest,
  PerspectiveIngestSessionEpisode,
} from "@/types/perspective-ingest-constellation-preview";

const MANUAL_PASTED_TEXT_SOURCE_REF =
  "local-user-provided:manual-pasted-text";
const MANUAL_PASTED_TEXT_DEFAULT_SOURCE_LABEL =
  "Manual pasted text preview";
const MAX_SUMMARY_LENGTH = 300;
const MAX_ENTRY_LENGTH = 220;
const MAX_ENTRIES_PER_FIELD = 12;

type ManualPastedTextParsedFields = Pick<
  PerspectiveIngestSessionEpisode,
  | "user_intents"
  | "product_concepts"
  | "decisions"
  | "work_units"
  | "changed_files"
  | "validations"
  | "final_report_points"
  | "evidence_refs"
  | "unresolved_tensions"
  | "next_actions"
>;

type ManualPastedTextPrefix = keyof ManualPastedTextParsedFields;

const PREFIX_ALIASES: Record<string, ManualPastedTextPrefix> = {
  intent: "user_intents",
  goal: "user_intents",
  "의도": "user_intents",
  "목표": "user_intents",
  concept: "product_concepts",
  idea: "product_concepts",
  "개념": "product_concepts",
  "아이디어": "product_concepts",
  decision: "decisions",
  choice: "decisions",
  "결정": "decisions",
  "선택": "decisions",
  work: "work_units",
  "작업": "work_units",
  changed: "changed_files",
  "변경": "changed_files",
  validation: "validations",
  "검증": "validations",
  evidence: "evidence_refs",
  source: "evidence_refs",
  "근거": "evidence_refs",
  "증거": "evidence_refs",
  tension: "unresolved_tensions",
  risk: "unresolved_tensions",
  "긴장": "unresolved_tensions",
  "리스크": "unresolved_tensions",
  "위험": "unresolved_tensions",
  next: "next_actions",
  todo: "next_actions",
  "다음": "next_actions",
  "할일": "next_actions",
  report: "final_report_points",
  "보고": "final_report_points",
};

const DEFAULT_FIELDS: ManualPastedTextParsedFields = {
  user_intents: [
    "Review local user-provided pasted text as a Perspective ingest preview.",
  ],
  product_concepts: ["Manual local Perspective ingest preview."],
  decisions: [
    "Keep pasted text preview local-only, read-only, and non-persistent.",
  ],
  work_units: [],
  changed_files: [],
  validations: [],
  final_report_points: [],
  evidence_refs: [MANUAL_PASTED_TEXT_SOURCE_REF],
  unresolved_tensions: [
    "Manual pasted input can help form a perspective, but it must not imply raw private history persistence.",
  ],
  next_actions: [
    "Review the generated graph and copied packets before any future import slice.",
  ],
};

export function buildManualPastedTextSessionEpisode({
  generatedAt,
  request,
}: {
  request: PerspectiveIngestLocalPastedTextPreviewRequest;
  generatedAt: string;
}): PerspectiveIngestSessionEpisode {
  const normalizedInput = normalizeWhitespace(request.input_text);
  const parsedFields = parseManualPastedText(request.input_text);
  const sourceLabel =
    request.source_label ?? MANUAL_PASTED_TEXT_DEFAULT_SOURCE_LABEL;

  return {
    episode_id: `episode.manual_pasted_text.${stableHash(normalizedInput)}.v0_1`,
    source_kind: "manual_pasted_text",
    source_ref: MANUAL_PASTED_TEXT_SOURCE_REF,
    source_label: sourceLabel,
    title: sourceLabel,
    summary: boundText(normalizedInput, MAX_SUMMARY_LENGTH),
    synthetic_timestamp: generatedAt,
    actors: ["local_user", "augnes_cockpit"],
    public_safety: {
      synthetic: false,
      public_safe: true,
      sample_fixture_only: false,
      manual_local_preview: true,
      not_raw_private_history: true,
      no_credentials_or_secrets: true,
      no_proof_evidence_readiness_write: true,
      no_external_call: true,
      no_codex_execution_authority: true,
      boundary_notes: [
        "manual pasted text",
        "local-only preview",
        "redacted public-safe input expected",
        "bounded summary and extracted fields only",
        "not raw private history",
        "no credential/secrets",
        "no proof/evidence/readiness write",
        "no external call",
        "no Codex execution authority",
      ],
    },
    ...parsedFields,
  };
}

function parseManualPastedText(
  inputText: string,
): ManualPastedTextParsedFields {
  const parsed: ManualPastedTextParsedFields = {
    user_intents: [],
    product_concepts: [],
    decisions: [],
    work_units: [],
    changed_files: [],
    validations: [],
    final_report_points: [],
    evidence_refs: [],
    unresolved_tensions: [],
    next_actions: [],
  };
  let recognizedPrefixSeen = false;

  for (const rawLine of inputText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^([^:：]{1,32})[:：]\s*(.*)$/u);
    if (!match) continue;

    const field = getManualPastedTextPrefixField(match[1] ?? "");
    if (!field) continue;

    const value = boundText(normalizeWhitespace(match[2] ?? ""), MAX_ENTRY_LENGTH);
    if (!value) continue;

    recognizedPrefixSeen = true;
    appendBounded(parsed[field], value);
  }

  if (!recognizedPrefixSeen) {
    return cloneDefaultFields();
  }

  return {
    user_intents: ensureField(
      parsed.user_intents,
      DEFAULT_FIELDS.user_intents,
    ),
    product_concepts: ensureField(
      parsed.product_concepts,
      DEFAULT_FIELDS.product_concepts,
    ),
    decisions: ensureField(parsed.decisions, DEFAULT_FIELDS.decisions),
    work_units: parsed.work_units,
    changed_files: parsed.changed_files,
    validations: parsed.validations,
    final_report_points: parsed.final_report_points,
    evidence_refs: ensureField(parsed.evidence_refs, DEFAULT_FIELDS.evidence_refs),
    unresolved_tensions: ensureField(
      parsed.unresolved_tensions,
      DEFAULT_FIELDS.unresolved_tensions,
    ),
    next_actions: ensureField(parsed.next_actions, DEFAULT_FIELDS.next_actions),
  };
}

function getManualPastedTextPrefixField(
  rawPrefix: string,
): ManualPastedTextPrefix | null {
  const normalizedPrefix = rawPrefix.trim().toLowerCase();

  return PREFIX_ALIASES[normalizedPrefix] ?? null;
}

function appendBounded(items: string[], value: string) {
  if (items.length >= MAX_ENTRIES_PER_FIELD) return;

  items.push(value);
}

function ensureField(items: string[], defaults: string[]) {
  return items.length ? items : [...defaults];
}

function cloneDefaultFields(): ManualPastedTextParsedFields {
  return {
    user_intents: [...DEFAULT_FIELDS.user_intents],
    product_concepts: [...DEFAULT_FIELDS.product_concepts],
    decisions: [...DEFAULT_FIELDS.decisions],
    work_units: [],
    changed_files: [],
    validations: [],
    final_report_points: [],
    evidence_refs: [...DEFAULT_FIELDS.evidence_refs],
    unresolved_tensions: [...DEFAULT_FIELDS.unresolved_tensions],
    next_actions: [...DEFAULT_FIELDS.next_actions],
  };
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function boundText(value: string, maxLength: number) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(maxLength - 3, 0)).trim()}...`;
}

function stableHash(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}
