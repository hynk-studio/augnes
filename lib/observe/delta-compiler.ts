import type { StateEntry, StateValue } from "@/lib/db";
import {
  buildOpenAIOutboundPayloadV01,
  OpenAIOutboundPayloadBoundaryErrorV01,
  type OpenAIResponsesProviderPayloadV01,
} from "@/lib/model-egress/openai-outbound-payload-boundary-v0-1";

export const TEMPORAL_SCOPES = [
  "current_session",
  "current_task",
  "current_project",
  "until_deadline",
  "future_phase",
  "historical_note",
  "global_preference",
] as const;

export const STABILITIES = [
  "temporary",
  "tentative",
  "active",
  "stable",
  "deprecated",
  "completed",
] as const;

export const CHANGE_TYPES = [
  "new_state",
  "refinement",
  "override",
  "reversal",
  "completion",
  "deprecation",
  "future_intent",
] as const;

export const OPERATIONS = [
  "set",
  "update",
  "deprecate",
  "complete",
  "supersede",
] as const;

export type ObserveRequest = {
  scope: string;
  message: string;
  session_id?: string;
};

export type ValidatedProposal = {
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  operation: (typeof OPERATIONS)[number];
  temporal_scope: (typeof TEMPORAL_SCOPES)[number];
  valid_from: string | null;
  valid_until: string | null;
  stability: (typeof STABILITIES)[number];
  change_type: (typeof CHANGE_TYPES)[number];
  reason: string;
};

type UnknownRecord = Record<string, unknown>;

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_MESSAGE_LENGTH = 8_000;
const STATE_VALUE_TYPES = new Set(["string", "number", "boolean"]);

type ObserveOpenAITransportResultV01 = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type ObserveOpenAITransportV01 = (
  payload: OpenAIResponsesProviderPayloadV01,
) => Promise<ObserveOpenAITransportResultV01>;

export function validateObserveRequest(body: unknown): ObserveRequest {
  if (!isRecord(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  const rawMessage = body.message ?? body.user_message;
  if (typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
    throw new Error("message is required.");
  }

  const message = rawMessage.trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  const scope = body.scope === undefined ? DEFAULT_SCOPE : body.scope;
  if (typeof scope !== "string" || !isValidScope(scope)) {
    throw new Error("scope must be a string like project:augnes.");
  }

  const sessionId = body.session_id;
  if (
    sessionId !== undefined &&
    (typeof sessionId !== "string" || !isValidIdentifier(sessionId))
  ) {
    throw new Error("session_id must be a safe identifier string when provided.");
  }

  return {
    scope,
    message,
    session_id: sessionId,
  };
}

export async function compileTemporalDeltaProposals({
  message,
  scope,
  currentState,
}: {
  message: string;
  scope: string;
  currentState: StateEntry[];
}) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      compiler: "mock" as const,
      proposals: buildMockProposals(message, currentState),
    };
  }

  return {
    compiler: "openai" as const,
    proposals: await compileWithOpenAI({ message, scope, currentState }),
  };
}

export function validateCompilerOutput(output: unknown): ValidatedProposal[] {
  if (!isRecord(output) || !Array.isArray(output.proposals)) {
    throw new Error("Compiler output must include a proposals array.");
  }

  if (output.proposals.length > 8) {
    throw new Error("Compiler output must include no more than 8 proposals.");
  }

  return output.proposals.map(validateProposal);
}

function buildMockProposals(
  message: string,
  currentState: StateEntry[],
): ValidatedProposal[] {
  const canonicalProposals = buildCanonicalMockProposals(message, currentState);

  if (canonicalProposals.length > 0) {
    return canonicalProposals;
  }

  const stateKey = selectMockStateKey(message);

  return [
    buildMockProposal({
      stateKey,
      afterValue: message,
      temporalScope: selectMockTemporalScope(message),
      stability: "tentative",
      currentState,
      reason:
        "Deterministic mock proposal because OPENAI_API_KEY is not configured.",
    }),
  ];
}

function buildCanonicalMockProposals(
  message: string,
  currentState: StateEntry[],
) {
  const lower = message.toLowerCase();
  const proposals: ValidatedProposal[] = [];

  if (lower.includes("augnes")) {
    proposals.push(
      buildMockProposal({
        stateKey: "product.name",
        afterValue: "Augnes",
        temporalScope: "current_project",
        stability: "active",
        currentState,
        reason: "User named the product Augnes.",
      }),
    );
  }

  if (
    lower.includes("next.js") ||
    lower.includes("sqlite") ||
    lower.includes("openai api")
  ) {
    proposals.push(
      buildMockProposal({
        stateKey: "implementation.stack",
        afterValue: "Next.js + SQLite + OpenAI API",
        temporalScope: "current_project",
        stability: "active",
        currentState,
        reason: "User specified the implementation stack.",
      }),
    );
  }

  if (
    lower.includes("chatgpt app") ||
    (lower.includes("chatgpt") &&
      (lower.includes("later") || message.includes("나중")))
  ) {
    proposals.push(
      buildMockProposal({
        stateKey: "integration.chatgpt_app",
        afterValue: "planned_after_challenge",
        temporalScope: "future_phase",
        stability: "tentative",
        changeType: "future_intent",
        currentState,
        reason: "User deferred ChatGPT App integration to a later phase.",
      }),
    );
  }

  if (lower.includes("readme")) {
    proposals.push(
      buildMockProposal({
        stateKey: "submission.requires_readme",
        afterValue: true,
        temporalScope: "current_project",
        stability: "tentative",
        currentState,
        reason: "User identified README work as required before submission.",
      }),
    );
  }

  if (lower.includes("screenshots") || message.includes("스크린샷")) {
    proposals.push(
      buildMockProposal({
        stateKey: "submission.requires_screenshots",
        afterValue: true,
        temporalScope: "current_project",
        stability: "tentative",
        currentState,
        reason: "User identified screenshots as required before submission.",
      }),
    );
  }

  if (
    lower.includes("api key") ||
    lower.includes("api keys") ||
    lower.includes("secret") ||
    lower.includes("no api keys")
  ) {
    proposals.push(
      buildMockProposal({
        stateKey: "security.no_api_keys_in_repo",
        afterValue: true,
        temporalScope: "current_project",
        stability: "stable",
        currentState,
        reason: "User prioritized keeping API keys out of the repository.",
      }),
    );
  }

  return proposals;
}

function buildMockProposal({
  stateKey,
  afterValue,
  temporalScope,
  stability,
  currentState,
  reason,
  changeType,
}: {
  stateKey: string;
  afterValue: StateValue;
  temporalScope: ValidatedProposal["temporal_scope"];
  stability: ValidatedProposal["stability"];
  currentState: StateEntry[];
  reason: string;
  changeType?: ValidatedProposal["change_type"];
}): ValidatedProposal {
  const currentEntry = currentState.find((entry) => entry.state_key === stateKey);

  return {
    state_key: stateKey,
    before_value: currentEntry?.value ?? "unknown",
    after_value: afterValue,
    operation: currentEntry ? "update" : "set",
    temporal_scope: temporalScope,
    valid_from: null,
    valid_until: null,
    stability,
    change_type: changeType ?? (currentEntry ? "refinement" : "new_state"),
    reason,
  };
}

async function compileWithOpenAI(
  {
    message,
    scope,
    currentState,
  }: {
    message: string;
    scope: string;
    currentState: StateEntry[];
  },
  transport: ObserveOpenAITransportV01 = sendObserveOpenAIRequest,
) {
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const boundary = buildOpenAIOutboundPayloadV01({
    purpose: "observe_delta_compile",
    model,
    scope,
    message,
    current_state: currentState,
  });
  if (boundary.status === "blocked") {
    throw new OpenAIOutboundPayloadBoundaryErrorV01(boundary);
  }

  const response = await transport(boundary.provider_payload);

  if (!response.ok) {
    throw new Error(`OpenAI API request failed: ${response.status}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);

  if (!text) {
    throw new Error("OpenAI response did not include output text.");
  }

  return validateCompilerOutput(JSON.parse(text));
}

export function compileTemporalDeltaProposalsWithOpenAIForTestV01(
  input: {
    message: string;
    scope: string;
    currentState: StateEntry[];
  },
  transport: ObserveOpenAITransportV01,
) {
  return compileWithOpenAI(input, transport);
}

async function sendObserveOpenAIRequest(
  payload: OpenAIResponsesProviderPayloadV01,
): Promise<ObserveOpenAITransportResultV01> {
  return fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function validateProposal(value: unknown): ValidatedProposal {
  if (!isRecord(value)) {
    throw new Error("Each proposal must be an object.");
  }

  const proposal = {
    state_key: requireString(value, "state_key"),
    before_value: requireStateValue(value, "before_value"),
    after_value: requireStateValue(value, "after_value"),
    operation: requireEnum(value, "operation", OPERATIONS),
    temporal_scope: requireEnum(value, "temporal_scope", TEMPORAL_SCOPES),
    valid_from: requireNullableIsoDate(value, "valid_from"),
    valid_until: requireNullableIsoDate(value, "valid_until"),
    stability: requireEnum(value, "stability", STABILITIES),
    change_type: requireEnum(value, "change_type", CHANGE_TYPES),
    reason: requireString(value, "reason"),
  };

  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)+$/.test(proposal.state_key)) {
    throw new Error(`Invalid state_key: ${proposal.state_key}`);
  }

  if (proposal.reason.length > 1_000) {
    throw new Error("reason must be 1000 characters or fewer.");
  }

  return proposal;
}

function extractOutputText(payload: unknown) {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) {
    return null;
  }

  for (const output of payload.output) {
    if (!isRecord(output) || !Array.isArray(output.content)) {
      continue;
    }

    for (const content of output.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function selectMockStateKey(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("secret")) {
    return "security.no_api_keys_in_repo";
  }

  if (lower.includes("deadline")) {
    return "timeline.deadline_note";
  }

  if (lower.includes("stack") || lower.includes("sqlite")) {
    return "implementation.stack";
  }

  return "observations.latest_user_message";
}

function selectMockTemporalScope(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("later") || lower.includes("future")) {
    return "future_phase";
  }

  if (lower.includes("session")) {
    return "current_session";
  }

  return "current_task";
}

function requireString(record: UnknownRecord, key: string) {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string.`);
  }

  return value.trim();
}

function requireStateValue(record: UnknownRecord, key: string): StateValue {
  const value = record[key];

  if (value === null || STATE_VALUE_TYPES.has(typeof value)) {
    return value as StateValue;
  }

  throw new Error(`${key} must be a JSON string, number, boolean, or null.`);
}

function requireEnum<T extends readonly string[]>(
  record: UnknownRecord,
  key: string,
  allowed: T,
) {
  const value = record[key];

  if (typeof value === "string" && allowed.includes(value)) {
    return value as T[number];
  }

  throw new Error(`${key} must be one of: ${allowed.join(", ")}.`);
}

function requireNullableIsoDate(record: UnknownRecord, key: string) {
  const value = record[key];

  if (value === null) {
    return null;
  }

  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  throw new Error(`${key} must be an ISO date string or null.`);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidScope(value: string) {
  return /^[a-z][a-z0-9_-]*:[A-Za-z0-9._-]+$/.test(value);
}

function isValidIdentifier(value: string) {
  return /^[A-Za-z0-9:._-]{1,160}$/.test(value);
}
