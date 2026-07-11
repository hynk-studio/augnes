#!/usr/bin/env node

import {
  VNextLocalOperatorSessionErrorV01,
  issueVNextLocalOperatorBootstrapV01,
  listVNextLocalOperatorSessionStatusV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorPilotConfigV01,
  revokeVNextLocalOperatorSessionByIdV01,
} from "../lib/vnext/runtime/local-operator-session";

const CLI_VERSION = "vnext_operator_pilot_cli.v0.1" as const;

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
  } else {
    const config = readVNextLocalOperatorPilotConfigV01();
    const db = openVNextLocalOperatorDatabaseV01(config);
    try {
      if (options.command === "issue-session") {
        const result = issueVNextLocalOperatorBootstrapV01(db, { config });
        process.stdout.write(
          [
            "Augnes vNext local operator bootstrap token (shown once):",
            result.bootstrap_token,
            `Session: ${result.session.session_id}`,
            `Bootstrap expires: ${result.session.expires_at}`,
            "This proves possession of a local secret only, not external identity.",
          ].join("\n") + "\n",
        );
      } else if (options.command === "status") {
        const sessions = listVNextLocalOperatorSessionStatusV01(db, config);
        const output = {
          ok: true,
          cli_version: CLI_VERSION,
          pilot_enabled: true,
          configured_scope: {
            workspace_id: config.workspace_id,
            project_id: config.project_id,
            operator_id: config.operator_id,
          },
          session_count: sessions.length,
          sessions,
          credential_material_included: false,
          external_identity_authenticated: false,
          semantic_authority_granted: false,
        };
        if (options.json) {
          process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
        } else {
          process.stdout.write(
            [
              "Augnes vNext local operator pilot status",
              `Configured scope: ${config.workspace_id} / ${config.project_id}`,
              `Configured operator: ${config.operator_id}`,
              `Sessions: ${sessions.length}`,
              "Credential material included: no",
              "External identity authenticated: no",
            ].join("\n") + "\n",
          );
        }
      } else {
        const session = revokeVNextLocalOperatorSessionByIdV01(db, {
          config,
          session_id: options.sessionId!,
        });
        const output = {
          ok: true,
          cli_version: CLI_VERSION,
          status: "revoked",
          session,
          credential_material_included: false,
          semantic_authority_granted: false,
        };
        if (options.json) {
          process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
        } else {
          process.stdout.write(
            `Revoked local operator session ${session.session_id}.\n`,
          );
        }
      }
    } finally {
      db.close();
    }
  }
} catch (error) {
  const code =
    error instanceof VNextLocalOperatorSessionErrorV01
      ? error.code
      : "operator_pilot_request_invalid";
  process.stderr.write(
    `${JSON.stringify({
      ok: false,
      cli_version: CLI_VERSION,
      error_code: code,
      credential_material_included: false,
      semantic_authority_granted: false,
    })}\n`,
  );
  process.exitCode = 1;
}

interface CliOptionsV01 {
  command: "issue-session" | "status" | "revoke";
  json: boolean;
  sessionId: string | null;
  help: boolean;
}

function parseArgs(args: string[]): CliOptionsV01 {
  if (args.includes("--help") || args.includes("-h")) {
    if (args.length !== 1) throw new Error("help_must_be_used_alone");
    return {
      command: "status",
      json: false,
      sessionId: null,
      help: true,
    };
  }
  const command = args[0];
  if (!(["issue-session", "status", "revoke"] as const).includes(
    command as "issue-session" | "status" | "revoke",
  )) {
    throw new Error("command_required");
  }
  let json = false;
  let sessionId: string | null = null;
  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      if (json) throw new Error("duplicate_json_flag");
      json = true;
      continue;
    }
    if (arg === "--session-id") {
      const value = args[index + 1];
      if (!value || value.startsWith("--") || sessionId !== null) {
        throw new Error("session_id_required");
      }
      sessionId = value;
      index += 1;
      continue;
    }
    throw new Error("unsupported_argument");
  }
  if (command === "issue-session" && (json || sessionId)) {
    throw new Error("issue_session_prints_token_once_in_human_mode_only");
  }
  if (command === "status" && sessionId) {
    throw new Error("status_does_not_accept_session_id");
  }
  if (command === "revoke" && !sessionId) {
    throw new Error("revoke_requires_session_id");
  }
  return {
    command: command as CliOptionsV01["command"],
    json,
    sessionId,
    help: false,
  };
}

function printUsage(): void {
  process.stdout.write(
    [
      "Augnes vNext opt-in local operator pilot",
      "",
      "Required environment:",
      "  AUGNES_VNEXT_OPERATOR_PILOT_ENABLED=1",
      "  AUGNES_VNEXT_OPERATOR_WORKSPACE_ID=<workspace>",
      "  AUGNES_VNEXT_OPERATOR_PROJECT_ID=<project>",
      "  AUGNES_VNEXT_OPERATOR_ID=<local operator id>",
      "  AUGNES_DB_PATH=<explicit absolute migrated .db or .sqlite file>",
      "",
      "Commands:",
      "  npm run vnext:operator-pilot -- issue-session",
      "  npm run vnext:operator-pilot -- status [--json]",
      "  npm run vnext:operator-pilot -- revoke --session-id <id> [--json]",
      "",
      "The bootstrap token is printed once. Status and revoke output never include credential hashes or secrets.",
      "This local possession check is not external or legal identity authentication.",
    ].join("\n") + "\n",
  );
}
