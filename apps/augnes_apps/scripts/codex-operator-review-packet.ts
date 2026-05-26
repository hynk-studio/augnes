import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const INPUT_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON";
const INPUT_JSON_END_MARKER = "END_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON";
const OUTPUT_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";
const OUTPUT_JSON_END_MARKER = "END_AUGNES_CODEX_OPERATOR_REVIEW_PACKET_JSON";

const MATERIAL_KEYS = [
  "closeout_pipeline",
  "action_plan",
  "actuation_gate",
  "actuation_preview",
  "github_comment_readiness",
  "github_comment_command_preview",
] as const;

const AUTHORITY_BOUNDARY =
  "This helper renders a local operator review handoff packet only. It does not call GitHub, OpenAI, providers, or Augnes runtime routes. It does not post comments, create reviews, approve, merge, publish, create evidence, create proof, mutate Augnes, grade or rank work, or commit/reject state.";

type OutputMode = "summary" | "json" | "both";
type MaterialKey = (typeof MATERIAL_KEYS)[number];

type ReviewTask = {
  title: string;
  intent: string;
  scope: string;
};

type PullRequestSummary = {
  number: number;
  url: string;
  state: string;
  head_sha: string;
  merge_sha: string | null;
};

type MaterialsInput = Record<MaterialKey, unknown | null | undefined>;

type ReviewEvent = {
  event_type: string;
  summary: string;
  result: string;
  event_id?: string;
  resolves_event_id?: string | null;
};

type OperatorDecision = {
  decision: string;
  reason: string;
};

type OperatorReviewPacketInput = {
  task: ReviewTask;
  pr: PullRequestSummary;
  materials: MaterialsInput;
  review_events: ReviewEvent[];
  operator_decision: OperatorDecision;
};

type TimelineItem = ReviewEvent & {
  index: number;
};

type MaterialSummary = {
  present: MaterialKey[];
  missing_optional: MaterialKey[];
  notes: string[];
};

type OperatorReviewPacket = {
  helper: "codex:operator-review-packet";
  version: 1;
  operation_mode: "human_assisted";
  packet_kind: "review_handoff";
  task_summary: ReviewTask;
  pr_summary: PullRequestSummary;
  material_summary: MaterialSummary;
  boundary_summary: string[];
  timeline: TimelineItem[];
  perspective_observations: string[];
  operator_questions: string[];
  recommended_next_decision: OperatorDecision;
  warnings: string[];
  blockers: string[];
  dry_run_only: true;
  would_execute: false;
  authority_boundary: string;
};

class OperatorReviewPacketError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readInputText(): Promise<string> {
  const inline = process.env.CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON;
  if (inline !== undefined) {
    if (!inline.trim()) throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_MISSING_INPUT");
    return inline;
  }

  const filePath = process.env.CODEX_OPERATOR_REVIEW_PACKET_INPUT_JSON_FILE;
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_MISSING_INPUT");
    return content;
  }

  if (process.stdin.isTTY) {
    throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_MISSING_INPUT");
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_MISSING_INPUT");
  return stdin;
}

function extractJsonText(input: string): string {
  const begin = input.indexOf(INPUT_JSON_BEGIN_MARKER);
  const end = input.indexOf(INPUT_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_INVALID_JSON");
    }

    return input.slice(begin + INPUT_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parseInputJson(input: string): unknown {
  try {
    return JSON.parse(extractJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof OperatorReviewPacketError) throw error;
    throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_INVALID_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_OPERATOR_REVIEW_PACKET_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_INVALID_OUTPUT");
}

function readRequiredString(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new OperatorReviewPacketError(code);
  return value.trim();
}

function readOptionalNullableString(value: unknown, code: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new OperatorReviewPacketError(code);
  return value.trim() || null;
}

function validateInput(value: unknown): OperatorReviewPacketInput {
  if (!isRecord(value)) throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_INVALID_INPUT_SHAPE");

  return {
    task: validateTask(value.task),
    pr: validatePullRequest(value.pr),
    materials: validateMaterials(value.materials),
    review_events: validateReviewEvents(value.review_events),
    operator_decision: validateOperatorDecision(value.operator_decision),
  };
}

function validateTask(value: unknown): ReviewTask {
  const code = "CODEX_OPERATOR_REVIEW_PACKET_INVALID_TASK_SHAPE";
  if (!isRecord(value)) throw new OperatorReviewPacketError(code);
  return {
    title: readRequiredString(value.title, code),
    intent: readRequiredString(value.intent, code),
    scope: readRequiredString(value.scope, code),
  };
}

function validatePullRequest(value: unknown): PullRequestSummary {
  const code = "CODEX_OPERATOR_REVIEW_PACKET_INVALID_PR_SHAPE";
  if (!isRecord(value)) throw new OperatorReviewPacketError(code);
  if (typeof value.number !== "number" || !Number.isSafeInteger(value.number) || value.number <= 0) {
    throw new OperatorReviewPacketError(code);
  }

  return {
    number: value.number,
    url: readRequiredString(value.url, code),
    state: readRequiredString(value.state, code),
    head_sha: readRequiredString(value.head_sha, code),
    merge_sha: readOptionalNullableString(value.merge_sha, code),
  };
}

function validateMaterials(value: unknown): MaterialsInput {
  const code = "CODEX_OPERATOR_REVIEW_PACKET_INVALID_MATERIALS_SHAPE";
  if (!isRecord(value)) throw new OperatorReviewPacketError(code);

  const materials = {} as MaterialsInput;
  for (const key of MATERIAL_KEYS) {
    materials[key] = value[key] ?? null;
  }

  return materials;
}

function validateReviewEvents(value: unknown): ReviewEvent[] {
  const code = "CODEX_OPERATOR_REVIEW_PACKET_INVALID_REVIEW_EVENTS_SHAPE";
  if (!Array.isArray(value)) throw new OperatorReviewPacketError(code);

  const events = value.map((item) => {
    if (!isRecord(item)) throw new OperatorReviewPacketError(code);
    const event: ReviewEvent = {
      event_type: readRequiredString(item.event_type, code),
      summary: readRequiredString(item.summary, code),
      result: readRequiredString(item.result, code),
    };

    const eventId = readOptionalEventId(item.event_id, "CODEX_OPERATOR_REVIEW_PACKET_INVALID_REVIEW_EVENT_LINK");
    if (eventId !== undefined) event.event_id = eventId;

    const resolvesEventId = readOptionalResolvesEventId(
      item.resolves_event_id,
      "CODEX_OPERATOR_REVIEW_PACKET_INVALID_REVIEW_EVENT_LINK",
    );
    if (resolvesEventId !== undefined) event.resolves_event_id = resolvesEventId;

    return event;
  });

  validateReviewEventLinks(events);
  return events;
}

function readOptionalEventId(value: unknown, code: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) throw new OperatorReviewPacketError(code);
  return value.trim();
}

function readOptionalResolvesEventId(value: unknown, code: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) throw new OperatorReviewPacketError(code);
  return value.trim();
}

function validateReviewEventLinks(events: ReviewEvent[]): void {
  const eventIdToIndex = new Map<string, number>();

  for (let index = 0; index < events.length; index += 1) {
    const eventId = events[index].event_id;
    if (eventId === undefined) continue;
    if (eventIdToIndex.has(eventId)) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_DUPLICATE_REVIEW_EVENT_ID");
    }
    eventIdToIndex.set(eventId, index);
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const resolvesEventId = event.resolves_event_id;
    if (resolvesEventId === undefined || resolvesEventId === null) continue;

    if (event.event_id !== undefined && event.event_id === resolvesEventId) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_FORWARD_RESOLUTION_LINK");
    }

    const targetIndex = eventIdToIndex.get(resolvesEventId);
    if (targetIndex === undefined) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_UNKNOWN_RESOLVED_EVENT");
    }
    if (targetIndex >= index) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_FORWARD_RESOLUTION_LINK");
    }

    const targetEvent = events[targetIndex];
    if (!isBlockingEvent(targetEvent)) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_NON_BLOCKING_RESOLUTION_TARGET");
    }
    if (!isResolvedLinkedEvent(event)) {
      throw new OperatorReviewPacketError("CODEX_OPERATOR_REVIEW_PACKET_UNRESOLVED_LINK_EVENT");
    }
  }
}

function validateOperatorDecision(value: unknown): OperatorDecision {
  const code = "CODEX_OPERATOR_REVIEW_PACKET_INVALID_OPERATOR_DECISION_SHAPE";
  if (!isRecord(value)) throw new OperatorReviewPacketError(code);
  return {
    decision: readRequiredString(value.decision, code),
    reason: readRequiredString(value.reason, code),
  };
}

function renderMaterialSummary(materials: MaterialsInput): MaterialSummary {
  const present: MaterialKey[] = [];
  const missing_optional: MaterialKey[] = [];

  for (const key of MATERIAL_KEYS) {
    if (materials[key] === null || materials[key] === undefined) {
      missing_optional.push(key);
    } else {
      present.push(key);
    }
  }

  return {
    present,
    missing_optional,
    notes: [
      "Material contents are summarized by presence only.",
      "Missing optional materials are warnings for operator review, not blockers.",
    ],
  };
}

function containsAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function eventText(event: ReviewEvent): string {
  return `${event.event_type} ${event.summary} ${event.result}`;
}

function isBlockingEvent(event: ReviewEvent): boolean {
  return containsAny(eventText(event), [/\bblocking\b/i, /\bblocked\b/i, /\bblocker\b/i, /\bneeds\s+changes\b/i]);
}

function isFollowUpLike(event: ReviewEvent): boolean {
  return containsAny(`${event.event_type} ${event.summary}`, [/\bfollow[-_\s]?up\b/i, /\bfollowup\b/i]);
}

function hasResolutionSignal(event: ReviewEvent): boolean {
  return containsAny(eventText(event), [
    /\bresolved\b/i,
    /\bresolving\b/i,
    /\bfixed\b/i,
    /\baddressed\b/i,
    /\bblocker[-_\s]?resolved\b/i,
    /\bblocking[-_\s]?resolved\b/i,
    /\bfollow[-_\s]?up[-_\s]?resolved\b/i,
  ]);
}

function hasUnresolvedSignal(event: ReviewEvent): boolean {
  return containsAny(eventText(event), [
    /\bnot\s+resolved\b/i,
    /\bnot[-_]resolved\b/i,
    /\bnot\s+fixed\b/i,
    /\bnot[-_]fixed\b/i,
    /\bnot\s+addressed\b/i,
    /\bnot[-_]addressed\b/i,
    /\bnot\s+resolving\b/i,
    /\bnot[-_]resolving\b/i,
    /\bnot\s+solved\b/i,
    /\bnot[-_]solved\b/i,
    /\bnot\s+corrected\b/i,
    /\bnot[-_]corrected\b/i,
    /\bunresolved\b/i,
    /\bstill\s+broken\b/i,
    /\bstill\s+failing\b/i,
    /\bstill\s+required\b/i,
    /\bneeds[-_\s]+review\b/i,
    /\bfollow[-_\s]?up[-_\s]?required\b/i,
    /\bfollow[-_\s]?up[-_\s]?needed\b/i,
  ]);
}

function hasResolutionResult(event: ReviewEvent): boolean {
  return containsAny(event.result, [
    /^resolved$/i,
    /^fixed$/i,
    /^addressed$/i,
    /^blocker[-_\s]?resolved$/i,
    /^blocking[-_\s]?resolved$/i,
    /^follow[-_\s]?up[-_\s]?resolved$/i,
  ]);
}

function isResolvedFollowUpEvent(event: ReviewEvent): boolean {
  return hasResolutionSignal(event) && !hasUnresolvedSignal(event) && (isFollowUpLike(event) || hasResolutionResult(event));
}

function isResolvedLinkedEvent(event: ReviewEvent): boolean {
  return hasResolutionSignal(event) && !hasUnresolvedSignal(event);
}

function hasStructuredResolutionLinks(events: ReviewEvent[]): boolean {
  return events.some((event) => event.resolves_event_id !== undefined && event.resolves_event_id !== null);
}

function eventReference(event: ReviewEvent, index: number): string {
  return event.event_id ?? String(index + 1);
}

function renderStructuredResolutionObservations(events: ReviewEvent[]): string[] {
  const eventIdToIndex = new Map<string, number>();
  for (let index = 0; index < events.length; index += 1) {
    const eventId = events[index].event_id;
    if (eventId !== undefined) eventIdToIndex.set(eventId, index);
  }

  const observations: string[] = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.resolves_event_id === undefined || event.resolves_event_id === null) continue;

    const targetIndex = eventIdToIndex.get(event.resolves_event_id);
    if (targetIndex === undefined) continue;
    const targetEvent = events[targetIndex];
    observations.push(
      `Review event ${eventReference(event, index)} resolved blocking event ${eventReference(
        targetEvent,
        targetIndex,
      )}: ${event.summary}`,
    );
  }

  return observations;
}

function hasActuationProceedSignal(decision: OperatorDecision): boolean {
  const text = `${decision.decision} ${decision.reason}`;
  return containsAny(text, [
    /\bapproved[-_\s]?actuation\b/i,
    /\bapproved\s+(?:a\s+)?separate\s+actuation\s+helper\b/i,
    /\bseparate\s+actuation\s+helper\s+approved\b/i,
    /\bproceed[-_\s]?to[-_\s]?actuation\b/i,
    /\bposting\s+approved\b/i,
    /\bexecute\b/i,
    /\bwould[-_\s]?execute\b/i,
    /\bimplement\s+actuation\b/i,
    /\bimplement\s+real\s+posting\s+helper\b/i,
    /\b(?:approve|approved|proceed(?:ing)?\s+to|implement)\s+real\s+posting\b/i,
    /\bauto[-_\s]?post\b/i,
    /\bpublish\b/i,
  ]);
}

function preservesManualHandoff(decision: OperatorDecision): boolean {
  const text = `${decision.decision} ${decision.reason}`;
  const explicitManualSignal = containsAny(text, [
    /\bmanual[-_\s]?handoff\b/i,
    /\bno[-_\s]?actuation\b/i,
    /\bhuman\s+review\s+only\b/i,
    /\boperator\s+review\s+only\b/i,
    /\breview\s+only\b/i,
    /\bno\s+real\s+posting\b/i,
    /\bdo\s+not\s+post\b/i,
    /\bdon't\s+post\b/i,
    /\bdo\s+not\s+actuate\b/i,
    /\bdon't\s+actuate\b/i,
    /\bkeep\s+actuation\s+manual\b/i,
  ]);

  return explicitManualSignal && !hasActuationProceedSignal(decision);
}

function renderPerspectiveObservations(input: OperatorReviewPacketInput): string[] {
  const observations: string[] = [];
  const events = input.review_events;

  if (hasStructuredResolutionLinks(events)) {
    observations.push(...renderStructuredResolutionObservations(events));
  } else {
    for (let index = 0; index < events.length; index += 1) {
      const blockingEvent = events[index];
      if (!isBlockingEvent(blockingEvent)) continue;

      const followUpIndex = events.findIndex(
        (candidate, candidateIndex) => candidateIndex > index && isResolvedFollowUpEvent(candidate),
      );
      if (followUpIndex !== -1) {
        observations.push(
          `Review event ${index + 1} was blocking, and later event ${followUpIndex + 1} recorded a resolved follow-up: ${events[followUpIndex].summary}`,
        );
      }
    }
  }

  if (preservesManualHandoff(input.operator_decision)) {
    observations.push(
      `Operator decision preserves manual handoff/no actuation: ${input.operator_decision.decision} - ${input.operator_decision.reason}`,
    );
  }

  if (observations.length === 0) {
    observations.push("No perspective observation was derived beyond the explicit review event order and operator decision.");
  }

  return observations;
}

function renderOperatorQuestions(input: OperatorReviewPacketInput, materialSummary: MaterialSummary): string[] {
  const questions = [
    `Should the operator accept the recommended next decision: ${input.operator_decision.decision}?`,
  ];

  if (materialSummary.missing_optional.length > 0) {
    questions.push(
      `Are the missing optional materials acceptable for this handoff: ${materialSummary.missing_optional.join(", ")}?`,
    );
  }

  if (input.review_events.length === 0) {
    questions.push("Is an empty review timeline acceptable for this operator handoff?");
  }

  return questions;
}

function buildPacket(input: OperatorReviewPacketInput): OperatorReviewPacket {
  const materialSummary = renderMaterialSummary(input.materials);
  const warnings = materialSummary.missing_optional.map((key) => `Missing optional material: ${key}`);

  return {
    helper: "codex:operator-review-packet",
    version: 1,
    operation_mode: "human_assisted",
    packet_kind: "review_handoff",
    task_summary: input.task,
    pr_summary: input.pr,
    material_summary: materialSummary,
    boundary_summary: [
      "local_operator_handoff_only",
      "no_actuation",
      "no_runtime_mutation",
      "no_quality_claims",
      "no_ui_change",
    ],
    timeline: input.review_events.map((event, index) => ({ index: index + 1, ...event })),
    perspective_observations: renderPerspectiveObservations(input),
    operator_questions: renderOperatorQuestions(input, materialSummary),
    recommended_next_decision: input.operator_decision,
    warnings,
    blockers: [],
    dry_run_only: true,
    would_execute: false,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderTimelineLinkLabel(event: TimelineItem): string {
  const labels: string[] = [];
  if (event.event_id !== undefined) labels.push(`event_id=${event.event_id}`);
  if (event.resolves_event_id !== undefined && event.resolves_event_id !== null) {
    labels.push(`resolves_event_id=${event.resolves_event_id}`);
  }

  return labels.length > 0 ? ` [${labels.join(" ")}]` : "";
}

function renderSummary(packet: OperatorReviewPacket): string {
  const lines = [
    "Codex operator review packet",
    `Helper: ${packet.helper} v${packet.version}`,
    `Mode: ${packet.operation_mode}`,
    `Task: ${packet.task_summary.title}`,
    `Intent: ${packet.task_summary.intent}`,
    `Scope: ${packet.task_summary.scope}`,
    `PR: #${packet.pr_summary.number} ${packet.pr_summary.state} ${packet.pr_summary.url}`,
    `Head SHA: ${packet.pr_summary.head_sha}`,
    `Merge SHA: ${packet.pr_summary.merge_sha ?? "none"}`,
    `Materials present: ${packet.material_summary.present.length > 0 ? packet.material_summary.present.join(", ") : "none"}`,
    `Missing optional materials: ${
      packet.material_summary.missing_optional.length > 0 ? packet.material_summary.missing_optional.join(", ") : "none"
    }`,
    "Timeline:",
    ...packet.timeline.map(
      (event) => `- ${event.index}. ${event.event_type}${renderTimelineLinkLabel(event)}: ${event.summary} (${event.result})`,
    ),
    "Perspective observations:",
    ...packet.perspective_observations.map((observation) => `- ${observation}`),
    "Operator questions:",
    ...packet.operator_questions.map((question) => `- ${question}`),
    `Recommended next decision: ${packet.recommended_next_decision.decision}`,
    `Decision reason: ${packet.recommended_next_decision.reason}`,
    `Warnings: ${packet.warnings.length > 0 ? packet.warnings.join("; ") : "none"}`,
    `Blockers: ${packet.blockers.length > 0 ? packet.blockers.join("; ") : "none"}`,
    `Dry run only: ${packet.dry_run_only}`,
    `Would execute: ${packet.would_execute}`,
    `Authority boundary: ${packet.authority_boundary}`,
  ];

  return `${lines.join("\n")}\n`;
}

function renderJson(packet: OperatorReviewPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

async function main(): Promise<void> {
  const outputMode = readOutputMode();
  const inputText = await readInputText();
  const input = validateInput(parseInputJson(inputText));
  const packet = buildPacket(input);

  if (outputMode === "summary") {
    process.stdout.write(renderSummary(packet));
    return;
  }

  if (outputMode === "json") {
    process.stdout.write(renderJson(packet));
    return;
  }

  process.stdout.write(renderSummary(packet));
  process.stdout.write(`${OUTPUT_JSON_BEGIN_MARKER}\n`);
  process.stdout.write(renderJson(packet));
  process.stdout.write(`${OUTPUT_JSON_END_MARKER}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_OPERATOR_REVIEW_PACKET_UNKNOWN_ERROR";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
