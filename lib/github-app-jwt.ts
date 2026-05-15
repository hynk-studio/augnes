import { createSign } from "node:crypto";

export type GitHubAppJwtInput = {
  issuer: string;
  privateKeyPem: string;
  now?: Date | string | number;
  issuedAtSkewSeconds?: number;
  expiresInSeconds?: number;
};

export type GitHubAppJwtClaims = {
  iat: number;
  exp: number;
  iss: string;
};

export type GitHubAppJwtResult = {
  jwt: string;
  header: {
    alg: "RS256";
    typ: "JWT";
  };
  claims: GitHubAppJwtClaims;
  expires_at: string;
  public_safe: {
    issuer_kind: "client_id_or_app_id";
    issued_at: string;
    expires_at: string;
    expires_in_seconds: number;
    algorithm: "RS256";
    jwt_present: boolean;
  };
  boundaries: string[];
};

export type PublicGitHubAppJwtResult = GitHubAppJwtResult["public_safe"] & {
  boundaries: string[];
};

export const GITHUB_APP_JWT_BOUNDARIES = [
  "GitHub App JWT creation is not token resolution.",
  "GitHub App JWT creation is not approval.",
  "GitHub App JWT creation is not readiness.",
  "GitHub App JWT creation is not publication.",
  "GitHub App JWT creation does not call GitHub.",
  "GitHub App JWT creation does not create installation tokens.",
  "GitHub App JWT creation does not alter C5 gates.",
  "GitHub App JWT creation must not read runtime env or files.",
  "Raw JWTs and private keys must not be logged, persisted, returned in API responses, written to evidence records, included in PR bodies, screenshots, or docs.",
];

const DEFAULT_ISSUED_AT_SKEW_SECONDS = 60;
const DEFAULT_EXPIRES_IN_SECONDS = 600;
const MAX_EXPIRES_IN_SECONDS = 600;

export function createGitHubAppJwt(input: GitHubAppJwtInput): GitHubAppJwtResult {
  const issuer = cleanRequiredString(input.issuer, "issuer");
  const privateKeyPem = cleanRequiredString(input.privateKeyPem, "privateKeyPem");
  const now = normalizeNow(input.now);
  const issuedAtSkewSeconds = normalizeNonNegativeInteger(
    input.issuedAtSkewSeconds ?? DEFAULT_ISSUED_AT_SKEW_SECONDS,
    "issuedAtSkewSeconds",
  );
  const expiresInSeconds = normalizeExpiresInSeconds(
    input.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS,
  );

  const nowSeconds = Math.floor(now.getTime() / 1000);
  const issuedAtSeconds = nowSeconds - issuedAtSkewSeconds;
  const expiresAtSeconds = issuedAtSeconds + expiresInSeconds;
  if (expiresAtSeconds > nowSeconds + MAX_EXPIRES_IN_SECONDS) {
    throw new Error("GitHub App JWT exp must be no more than 10 minutes in the future.");
  }

  const header = {
    alg: "RS256" as const,
    typ: "JWT" as const,
  };
  const claims: GitHubAppJwtClaims = {
    iat: issuedAtSeconds,
    exp: expiresAtSeconds,
    iss: issuer,
  };
  validateGitHubAppJwtClaims(claims, nowSeconds);

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const signature = signRs256(signingInput, privateKeyPem);
  const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();

  return {
    jwt: `${signingInput}.${signature}`,
    header,
    claims,
    expires_at: expiresAt,
    public_safe: {
      issuer_kind: "client_id_or_app_id",
      issued_at: new Date(issuedAtSeconds * 1000).toISOString(),
      expires_at: expiresAt,
      expires_in_seconds: expiresInSeconds,
      algorithm: "RS256",
      jwt_present: true,
    },
    boundaries: GITHUB_APP_JWT_BOUNDARIES,
  };
}

export function redactGitHubAppJwtForResponse(
  result: GitHubAppJwtResult,
): PublicGitHubAppJwtResult {
  return {
    ...result.public_safe,
    boundaries: result.boundaries,
  };
}

function validateGitHubAppJwtClaims(
  claims: GitHubAppJwtClaims,
  nowSeconds: number,
) {
  if (!Number.isInteger(claims.iat)) {
    throw new Error("GitHub App JWT iat must be an integer timestamp.");
  }
  if (!Number.isInteger(claims.exp)) {
    throw new Error("GitHub App JWT exp must be an integer timestamp.");
  }
  if (!claims.iss.trim()) {
    throw new Error("GitHub App JWT iss is required.");
  }
  if (claims.exp <= claims.iat) {
    throw new Error("GitHub App JWT exp must be after iat.");
  }
  if (claims.exp > nowSeconds + MAX_EXPIRES_IN_SECONDS) {
    throw new Error("GitHub App JWT exp must be no more than 10 minutes in the future.");
  }
}

function signRs256(signingInput: string, privateKeyPem: string) {
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();
    return signer.sign(privateKeyPem).toString("base64url");
  } catch {
    throw new Error("GitHub App JWT signing failed.");
  }
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function normalizeNow(value: Date | string | number | undefined) {
  const date = value === undefined ? new Date() : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("GitHub App JWT now must be a valid date/time.");
  }

  return date;
}

function normalizeExpiresInSeconds(value: number) {
  const normalized = normalizePositiveInteger(value, "expiresInSeconds");
  if (normalized > MAX_EXPIRES_IN_SECONDS) {
    throw new Error("GitHub App JWT expiresInSeconds must be 600 seconds or less.");
  }

  return normalized;
}

function normalizePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`GitHub App JWT ${label} must be a positive integer.`);
  }

  return value;
}

function normalizeNonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`GitHub App JWT ${label} must be a non-negative integer.`);
  }

  return value;
}

function cleanRequiredString(value: string, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`GitHub App JWT ${label} is required.`);
  }

  return value.trim();
}
