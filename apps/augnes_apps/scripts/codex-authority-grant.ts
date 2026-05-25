import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const AUTHORITY_GRANT_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_AUTHORITY_GRANT_JSON";
const AUTHORITY_GRANT_JSON_END_MARKER = "END_AUGNES_CODEX_AUTHORITY_GRANT_JSON";

const AUTHORITY_BOUNDARY =
  "This grant material does not execute the action itself. This helper does not grant or exercise authority by itself. Any actuation requires a separate gate and separate implementation. It is local dry-run/pre-actuation material only.";

const SUPPORTED_ACTIONS = [
  "prepare_pr_body",
  "request_human_review",
  "run_missing_checks",
  "inspect_read_only_refs",
  "record_more_evidence",
  "record_completion",
  "create_pr_comment",
  "create_pr_review",
  "approve_pr",
  "merge_pr",
  "publish_external",
  "mutate_augnes_state",
  "commit_or_reject_state",
  "call_provider",
  "call_github",
  "delegated_handoff",
] as const;

type OutputMode = "summary" | "json" | "both";
type SupportedAction = (typeof SUPPORTED_ACTIONS)[number];

type AuthorityGrantConfig = {
  outputMode: OutputMode;
  grantId: string | null;
  grantedBy: string;
  grantedTo: string;
  scope: string;
  workId: string | null;
  relatedPr: string | null;
  actions: string[];
  expiresAt: string | null;
  constraints: string[];
  forbiddenActions: string[];
  dryRunOnly: true;
};

type AuthorityGrant = {
  helper: "codex:authority-grant";
  version: 1;
  grant_id: string;
  granted_by: string;
  granted_to: string;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  actions: string[];
  expires_at: string | null;
  constraints: string[];
  forbidden_actions: string[];
  dry_run_only: true;
  authority_boundary: string;
};

class AuthorityGrantError extends Error {}

function readRequiredNonEmptyString(name: string, code: string): string {
  const raw = process.env[name];
  if (raw === undefined || !raw.trim()) throw new AuthorityGrantError(code);
  return raw.trim();
}

function readOptionalTrimmedString(name: string): string | null {
  const raw = process.env[name];
  if (raw === undefined) return null;
  const value = raw.trim();
  return value ? value : null;
}

function readScope(): string {
  const scope =
    readOptionalTrimmedString("CODEX_AUTHORITY_GRANT_SCOPE") ??
    readOptionalTrimmedString("CODEX_SCOPE") ??
    readOptionalTrimmedString("AUGNES_SCOPE");

  if (scope === null) throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_MISSING_SCOPE");
  return scope;
}

function readOutputMode(): OutputMode {
  const value = process.env.CODEX_AUTHORITY_GRANT_OUTPUT?.trim() || "both";
  if (value === "summary" || value === "json" || value === "both") return value;
  throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_INVALID_OUTPUT");
}

function readDryRunOnly(): true {
  const raw = process.env.CODEX_AUTHORITY_GRANT_DRY_RUN_ONLY;
  if (raw === undefined) return true;
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_NON_DRY_RUN_UNSUPPORTED");
  throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_INVALID_BOOLEAN CODEX_AUTHORITY_GRANT_DRY_RUN_ONLY");
}

function parseListEnv(name: string): string[] | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;

  const value = raw.trim();
  if (!value) return [];

  if (value.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new AuthorityGrantError(`CODEX_AUTHORITY_GRANT_INVALID_LIST_ENV ${name}`);
    }

    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new AuthorityGrantError(`CODEX_AUTHORITY_GRANT_INVALID_LIST_ENV ${name}`);
    }

    return parsed.map((item) => item.trim()).filter(Boolean);
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function readRequiredActions(): string[] {
  const actions = parseListEnv("CODEX_AUTHORITY_GRANT_ACTIONS");
  if (actions === undefined || actions.length === 0) {
    throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_MISSING_ACTIONS");
  }

  validateActionList(actions);
  return actions;
}

function isSupportedAction(action: string): action is SupportedAction {
  return SUPPORTED_ACTIONS.includes(action as SupportedAction);
}

function validateActionList(actions: string[]): void {
  const seen = new Set<string>();
  for (const action of actions) {
    if (!isSupportedAction(action)) throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_UNSUPPORTED_ACTION");
    if (seen.has(action)) throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_DUPLICATE_ACTION");
    seen.add(action);
  }
}

function readForbiddenActions(): string[] {
  const forbiddenActions = parseListEnv("CODEX_AUTHORITY_GRANT_FORBIDDEN_ACTIONS") ?? [];
  validateActionList(forbiddenActions);
  return forbiddenActions;
}

function buildConstraints(): string[] {
  const constraints = parseListEnv("CODEX_AUTHORITY_GRANT_CONSTRAINTS") ?? [];
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const constraint of ["dry_run_only", ...constraints]) {
    if (seen.has(constraint)) continue;
    seen.add(constraint);
    deduped.push(constraint);
  }

  return deduped;
}

function assertNoConflictingActions(actions: string[], forbiddenActions: string[]): void {
  const forbidden = new Set(forbiddenActions);
  for (const action of actions) {
    if (forbidden.has(action)) throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_CONFLICTING_ACTION");
  }
}

function readExplicitGrantId(): string | null {
  const raw = process.env.CODEX_AUTHORITY_GRANT_ID;
  if (raw === undefined) return null;
  const value = raw.trim();
  if (!value) throw new AuthorityGrantError("CODEX_AUTHORITY_GRANT_INVALID_GRANT_ID");
  return value;
}

function generatedGrantId(config: AuthorityGrantConfig): string {
  const material = {
    granted_by: config.grantedBy,
    granted_to: config.grantedTo,
    scope: config.scope,
    work_id: config.workId,
    related_pr: config.relatedPr,
    actions: config.actions,
    constraints: config.constraints,
    forbidden_actions: config.forbiddenActions,
    expires_at: config.expiresAt,
  };
  const digest = createHash("sha256").update(JSON.stringify(material)).digest("hex").slice(0, 12);
  return `grant-${digest}`;
}

function readConfig(): AuthorityGrantConfig {
  const dryRunOnly = readDryRunOnly();
  const actions = readRequiredActions();
  const forbiddenActions = readForbiddenActions();
  assertNoConflictingActions(actions, forbiddenActions);

  return {
    outputMode: readOutputMode(),
    grantId: readExplicitGrantId(),
    grantedBy: readRequiredNonEmptyString(
      "CODEX_AUTHORITY_GRANT_GRANTED_BY",
      "CODEX_AUTHORITY_GRANT_MISSING_GRANTED_BY",
    ),
    grantedTo: readRequiredNonEmptyString(
      "CODEX_AUTHORITY_GRANT_GRANTED_TO",
      "CODEX_AUTHORITY_GRANT_MISSING_GRANTED_TO",
    ),
    scope: readScope(),
    workId: readOptionalTrimmedString("CODEX_WORK_ID"),
    relatedPr: readOptionalTrimmedString("CODEX_RELATED_PR"),
    actions,
    expiresAt: readOptionalTrimmedString("CODEX_AUTHORITY_GRANT_EXPIRES_AT"),
    constraints: buildConstraints(),
    forbiddenActions,
    dryRunOnly,
  };
}

function buildGrant(config: AuthorityGrantConfig): AuthorityGrant {
  return {
    helper: "codex:authority-grant",
    version: 1,
    grant_id: config.grantId ?? generatedGrantId(config),
    granted_by: config.grantedBy,
    granted_to: config.grantedTo,
    scope: config.scope,
    work_id: config.workId,
    related_pr: config.relatedPr,
    actions: config.actions,
    expires_at: config.expiresAt,
    constraints: config.constraints,
    forbidden_actions: config.forbiddenActions,
    dry_run_only: true,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function renderSummary(grant: AuthorityGrant): string {
  return [
    "Codex authority grant",
    `grant_id: ${grant.grant_id}`,
    `granted_by: ${grant.granted_by}`,
    `granted_to: ${grant.granted_to}`,
    `scope: ${grant.scope}`,
    `work_id: ${grant.work_id ?? "Not provided."}`,
    `related_pr: ${grant.related_pr ?? "Not provided."}`,
    `actions count: ${grant.actions.length}`,
    `forbidden_actions count: ${grant.forbidden_actions.length}`,
    `constraints count: ${grant.constraints.length}`,
    `dry_run_only: ${grant.dry_run_only}`,
    `expires_at: ${grant.expires_at ?? "Not provided."}`,
    `authority boundary: ${grant.authority_boundary}`,
  ].join("\n");
}

function printGrant(grant: AuthorityGrant, outputMode: OutputMode): void {
  if (outputMode === "summary") {
    console.log(renderSummary(grant));
    return;
  }

  if (outputMode === "json") {
    console.log(JSON.stringify(grant, null, 2));
    return;
  }

  console.log(renderSummary(grant));
  console.log(AUTHORITY_GRANT_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(grant, null, 2));
  console.log(AUTHORITY_GRANT_JSON_END_MARKER);
}

function main(): void {
  const config = readConfig();
  const grant = buildGrant(config);
  printGrant(grant, config.outputMode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "CODEX_AUTHORITY_GRANT_FAILED";
    console.error(message);
    process.exitCode = 1;
  }
}
