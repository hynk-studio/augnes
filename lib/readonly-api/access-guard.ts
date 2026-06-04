export const READONLY_LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"] as const;

export type ReadonlyApiAccessErrorCode =
  | "malformed_request"
  | "missing_scope"
  | "unauthorized_scope"
  | "local_authorization_required"
  | "disallowed_forwarded_host"
  | "method_not_allowed";

export type ReadonlyApiAccessErrorStatus = 400 | 403 | 405;

export type ReadonlyApiAccessPolicy = {
  route_id: string;
  required_scope: string;
  required_marker_header: string;
  required_marker_value: string;
  allowed_hosts: readonly string[];
  route_family: string;
};

export type ReadonlyApiAccessResult =
  | {
      ok: true;
      scope: string;
      route_id: string;
      route_family: string;
      local_authorized: true;
    }
  | {
      ok: false;
      code: ReadonlyApiAccessErrorCode;
      status: ReadonlyApiAccessErrorStatus;
      authority_boundary: string[];
    };

const ACCESS_GUARD_ERROR_BOUNDARY = [
  "local read-only route access guard",
  "fail-closed local validation boundary",
  "not production auth",
  "no route-provided text grants authority",
  "no consumer authority",
  "no proof/evidence/readiness writes",
];

export function validateReadonlyApiLocalAccess(
  request: Request,
  policy: ReadonlyApiAccessPolicy,
): ReadonlyApiAccessResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return accessError("malformed_request", 400);
  }

  const method = typeof request.method === "string" ? request.method : "";
  if (method && method.toUpperCase() !== "GET") {
    return accessError("method_not_allowed", 405);
  }

  const scope = url.searchParams.get("scope");
  if (!scope) {
    return accessError("missing_scope", 400);
  }

  if (!isAllowedLocalHost(url.host, policy.allowed_hosts)) {
    return accessError("local_authorization_required", 403);
  }

  const hostHeader = request.headers.get("host");
  if (hostHeader && !areAllowedLocalHosts(hostHeader, policy.allowed_hosts)) {
    return accessError("local_authorization_required", 403);
  }

  const forwardedHostHeader = request.headers.get("x-forwarded-host");
  if (
    forwardedHostHeader &&
    !areAllowedLocalHosts(forwardedHostHeader, policy.allowed_hosts)
  ) {
    return accessError("disallowed_forwarded_host", 403);
  }

  if (
    request.headers.get(policy.required_marker_header) !==
    policy.required_marker_value
  ) {
    return accessError("local_authorization_required", 403);
  }

  if (scope !== policy.required_scope) {
    return accessError("unauthorized_scope", 403);
  }

  return {
    ok: true,
    scope,
    route_id: policy.route_id,
    route_family: policy.route_family,
    local_authorized: true,
  };
}

function accessError(
  code: ReadonlyApiAccessErrorCode,
  status: ReadonlyApiAccessErrorStatus,
): ReadonlyApiAccessResult {
  return {
    ok: false,
    code,
    status,
    authority_boundary: ACCESS_GUARD_ERROR_BOUNDARY,
  };
}

function areAllowedLocalHosts(
  hostHeaderValue: string,
  allowedHosts: readonly string[],
): boolean {
  const hosts = hostHeaderValue
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  return hosts.length > 0 && hosts.every((host) => isAllowedLocalHost(host, allowedHosts));
}

function isAllowedLocalHost(
  hostWithOptionalPort: string,
  allowedHosts: readonly string[],
): boolean {
  const normalized = normalizeHost(hostWithOptionalPort);

  return allowedHosts.includes(normalized);
}

function normalizeHost(hostWithOptionalPort: string): string {
  const host = hostWithOptionalPort.trim().toLowerCase();

  if (host === "::1") {
    return host;
  }

  if (host.startsWith("[") && host.includes("]")) {
    return host.slice(1, host.indexOf("]"));
  }

  const colonIndex = host.indexOf(":");
  if (colonIndex === -1) {
    return host;
  }

  return host.slice(0, colonIndex);
}
