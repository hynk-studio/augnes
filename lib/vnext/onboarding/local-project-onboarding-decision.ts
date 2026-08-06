import { createHash, randomBytes, randomUUID } from "node:crypto";

import {
  LOCAL_PROJECT_ONBOARDING_DECISION_VERSION_V01,
  type LocalProjectOnboardingChallengeV01,
  type ProjectOnboardingConfirmationV01,
} from "@/types/vnext/project-onboarding";
import { ProjectOnboardingErrorV01 } from "./local-project-onboarding";

const COOKIE_NAME = "augnes_local_project_onboarding_v01";
const DECISION_TTL_MS = 10 * 60 * 1000;
const MAX_SESSIONS = 64;

type PreparedCandidateBindingV01 = {
  selection_token: string;
  inspection_fingerprint: string;
  expected_active_project_id: string | null;
  expected_active_selection_revision: number | null;
};

type DecisionBindingV01 = PreparedCandidateBindingV01 & {
  display_name: string;
};

type ConfirmationTransportBindingV01 = {
  selection_token: string;
  inspection_fingerprint: string;
  display_name: string;
};

type DecisionSessionV01 = {
  credential_hash: string;
  nonce_hash: string;
  candidate_binding_fingerprint: string;
  confirmation_binding_fingerprint: string | null;
  expires_at_ms: number;
  state: "issued" | "challenged" | "confirming" | "committed";
  challenge_hash: string | null;
  confirmation?: Promise<ProjectOnboardingConfirmationV01>;
  result?: ProjectOnboardingConfirmationV01;
};

export interface LocalProjectOnboardingCredentialV01 {
  session_id: string;
  credential: string;
  nonce: string;
}

const sessions = new Map<string, DecisionSessionV01>();

export function issueLocalProjectOnboardingSessionV01(
  binding: PreparedCandidateBindingV01,
  options: {
    now_ms?: () => number;
    create_session_id?: () => string;
    create_secret?: () => string;
  } = {},
) {
  const nowMs = (options.now_ms ?? Date.now)();
  pruneSessions(nowMs);
  const sessionId = (options.create_session_id ?? randomUUID)();
  const credential = (options.create_secret ?? createSecret)();
  const nonce = (options.create_secret ?? createSecret)();
  sessions.set(hash(sessionId), {
    credential_hash: hash(credential),
    nonce_hash: hash(nonce),
    candidate_binding_fingerprint: fingerprintCandidateBinding(binding),
    confirmation_binding_fingerprint: null,
    expires_at_ms: nowMs + DECISION_TTL_MS,
    state: "issued",
    challenge_hash: null,
  });
  if (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value as string);
  }
  return {
    credential: { session_id: sessionId, credential, nonce },
    expires_at: new Date(nowMs + DECISION_TTL_MS).toISOString(),
  };
}

export function issueLocalProjectOnboardingChallengeV01(
  input: DecisionBindingV01 & {
    credential: LocalProjectOnboardingCredentialV01;
  },
  options: {
    now_ms?: () => number;
    create_secret?: () => string;
  } = {},
): {
  confirmation: LocalProjectOnboardingChallengeV01;
  credential: LocalProjectOnboardingCredentialV01;
} {
  const nowMs = (options.now_ms ?? Date.now)();
  const session = readSession(input.credential, nowMs);
  if (session.state !== "issued") {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_conflict",
      409,
    );
  }
  if (
    session.candidate_binding_fingerprint !==
      fingerprintCandidateBinding(input)
  ) {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_conflict",
      409,
    );
  }
  const challenge = (options.create_secret ?? createSecret)();
  const nextNonce = (options.create_secret ?? createSecret)();
  session.state = "challenged";
  session.challenge_hash = hash(challenge);
  session.confirmation_binding_fingerprint =
    fingerprintConfirmationTransport(input);
  session.nonce_hash = hash(nextNonce);
  return {
    confirmation: {
      decision_version: LOCAL_PROJECT_ONBOARDING_DECISION_VERSION_V01,
      challenge_fingerprint: challenge,
      expires_at: new Date(session.expires_at_ms).toISOString(),
    },
    credential: { ...input.credential, nonce: nextNonce },
  };
}

export async function confirmLocalProjectOnboardingFromBrowserSessionV01(
  input: ConfirmationTransportBindingV01 & {
    challenge_fingerprint: string;
    credential: LocalProjectOnboardingCredentialV01;
  },
  execute: () => Promise<ProjectOnboardingConfirmationV01>,
  options: { now_ms?: () => number } = {},
): Promise<ProjectOnboardingConfirmationV01> {
  const nowMs = (options.now_ms ?? Date.now)();
  const session = readSession(input.credential, nowMs);
  if (
    session.confirmation_binding_fingerprint !==
      fingerprintConfirmationTransport(input) ||
    session.challenge_hash !== hash(input.challenge_fingerprint)
  ) {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_conflict",
      409,
    );
  }
  if (session.state === "committed" && session.result) return session.result;
  if (session.state === "confirming" && session.confirmation) {
    return session.confirmation;
  }
  if (session.state !== "challenged") {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_conflict",
      409,
    );
  }
  session.state = "confirming";
  const sessionKey = hash(input.credential.session_id);
  session.confirmation = execute().then(
    (result) => {
      session.state = "committed";
      session.result = result;
      return result;
    },
    (error: unknown) => {
      sessions.delete(sessionKey);
      throw error;
    },
  );
  return session.confirmation;
}

export function abandonLocalProjectOnboardingSessionV01(
  credential: LocalProjectOnboardingCredentialV01 | null,
): void {
  if (credential) sessions.delete(hash(credential.session_id));
}

export function readLocalProjectOnboardingCredentialFromRequestV01(
  request: Request,
): LocalProjectOnboardingCredentialV01 {
  const value = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!value) {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_required",
      403,
    );
  }
  let decoded: string;
  try { decoded = decodeURIComponent(value); }
  catch {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_invalid",
      403,
    );
  }
  const [sessionId, credential, nonce, extra] = decoded.split(".");
  if (!sessionId || !credential || !nonce || extra !== undefined) {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_invalid",
      403,
    );
  }
  return { session_id: sessionId, credential, nonce };
}

export function serializeLocalProjectOnboardingCookieV01(input: {
  credential: LocalProjectOnboardingCredentialV01;
  expires_at: string;
  secure: boolean;
}): string {
  const value = encodeURIComponent([
    input.credential.session_id,
    input.credential.credential,
    input.credential.nonce,
  ].join("."));
  const maxAge = Math.max(
    0,
    Math.floor((Date.parse(input.expires_at) - Date.now()) / 1000),
  );
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/api/vnext/projects",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAge}`,
    ...(input.secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearLocalProjectOnboardingCookieV01(secure: boolean): string {
  return [
    `${COOKIE_NAME}=`,
    "Path=/api/vnext/projects",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

function readSession(
  credential: LocalProjectOnboardingCredentialV01,
  nowMs: number,
): DecisionSessionV01 {
  const sessionKey = hash(credential.session_id);
  const session = sessions.get(sessionKey);
  if (!session) {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_invalid",
      403,
    );
  }
  if (session.expires_at_ms < nowMs) {
    sessions.delete(sessionKey);
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_expired",
      409,
    );
  }
  pruneSessions(nowMs);
  if (
    session.credential_hash !== hash(credential.credential) ||
    session.nonce_hash !== hash(credential.nonce)
  ) {
    throw new ProjectOnboardingErrorV01(
      "onboarding_confirmation_invalid",
      403,
    );
  }
  return session;
}

function fingerprintConfirmationTransport(
  binding: ConfirmationTransportBindingV01,
): string {
  return hash(JSON.stringify({
    decision_version: LOCAL_PROJECT_ONBOARDING_DECISION_VERSION_V01,
    selection_token: binding.selection_token,
    inspection_fingerprint: binding.inspection_fingerprint,
    display_name: binding.display_name,
  }));
}

function fingerprintCandidateBinding(
  binding: PreparedCandidateBindingV01,
): string {
  return hash(JSON.stringify({
    decision_version: LOCAL_PROJECT_ONBOARDING_DECISION_VERSION_V01,
    selection_token: binding.selection_token,
    inspection_fingerprint: binding.inspection_fingerprint,
    expected_active_project_id: binding.expected_active_project_id,
    expected_active_selection_revision:
      binding.expected_active_selection_revision,
  }));
}

function pruneSessions(nowMs: number): void {
  for (const [key, session] of sessions) {
    if (session.expires_at_ms < nowMs) sessions.delete(key);
  }
}

function createSecret(): string {
  return randomBytes(32).toString("base64url");
}

function hash(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
