import { READONLY_LOCAL_HOSTS } from "@/lib/readonly-api/access-guard";

export type LocalPreviewPostAccessErrorCode =
  | "malformed_request"
  | "missing_scope"
  | "unauthorized_scope"
  | "local_authorization_required"
  | "missing_host_header"
  | "disallowed_forwarded_host"
  | "method_not_allowed";

export type LocalPreviewPostAccessErrorStatus = 400 | 403 | 405;

export type LocalPreviewPostAccessPolicy = {
  route_id: string;
  required_scope: string;
  required_marker_header: string;
  required_marker_value: string;
  allowed_hosts: readonly string[];
  route_family: string;
};

export type LocalPreviewPostAccessResult =
  | {
      ok: true;
      scope: string;
      route_id: string;
      route_family: string;
      local_authorized: true;
    }
  | {
      ok: false;
      code: LocalPreviewPostAccessErrorCode;
      status: LocalPreviewPostAccessErrorStatus;
      authority_boundary: string[];
    };

const LOCAL_PREVIEW_POST_GUARD_ERROR_BOUNDARY = [
  "POST-only local preview route access guard",
  "fail-closed local authority boundary",
  "required project scope only",
  "required local marker header only",
  "no payload echo in errors",
  "no consumer authority",
  "no proof/evidence/readiness writes",
];

export const LOCAL_PREVIEW_POST_LOCAL_HOSTS = READONLY_LOCAL_HOSTS;

export function validateLocalPreviewPostAccess(
  request: Request,
  policy: LocalPreviewPostAccessPolicy,
): LocalPreviewPostAccessResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return accessError("malformed_request", 400);
  }

  const method = typeof request.method === "string" ? request.method : "";
  if (method.toUpperCase() !== "POST") {
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
  if (!hostHeader) {
    return accessError("missing_host_header", 400);
  }

  if (!areAllowedLocalHosts(hostHeader, policy.allowed_hosts)) {
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
  code: LocalPreviewPostAccessErrorCode,
  status: LocalPreviewPostAccessErrorStatus,
): LocalPreviewPostAccessResult {
  return {
    ok: false,
    code,
    status,
    authority_boundary: LOCAL_PREVIEW_POST_GUARD_ERROR_BOUNDARY,
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

  return (
    hosts.length > 0 &&
    hosts.every((host) => isAllowedLocalHost(host, allowedHosts))
  );
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
