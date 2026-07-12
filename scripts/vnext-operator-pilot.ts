#!/usr/bin/env node

import { readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

import {
  VNextLocalOperatorSessionErrorV01,
  issueVNextLocalOperatorBootstrapV01,
  listVNextLocalOperatorSessionStatusV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorPilotConfigV01,
  revokeVNextLocalOperatorSessionByIdV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  VNextOperatorPilotReviewErrorV01,
  prepareVNextOperatorPilotReviewMaterialV01,
} from "../lib/vnext/runtime/operator-pilot-review-material";

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
      } else if (options.command === "prepare-review") {
        const mapperInput = readStructuredMapperInput(options.inputPath!);
        const priorPacket = options.priorPacketPath
          ? readStructuredJsonFile(options.priorPacketPath, "prior_packet")
          : undefined;
        const result = prepareVNextOperatorPilotReviewMaterialV01(db, {
          config,
          mapper_input: mapperInput,
          prior_packet: priorPacket,
        });
        const output = {
          ok: true,
          cli_version: CLI_VERSION,
          status: "review_material_prepared",
          workspace_id: result.workspace_id,
          project_id: result.project_id,
          run_receipt: {
            receipt_id: result.run_receipt.receipt_id,
            fingerprint: result.run_receipt.integrity.fingerprint,
            write_status: result.run_receipt_write_status,
          },
          proposal: {
            proposal_id: result.proposal.proposal_id,
            fingerprint: result.proposal.integrity.fingerprint,
            candidate_count: result.proposal.proposed_deltas.length,
            write_status: result.proposal_write_status,
          },
          prior_packet: result.prior_packet
            ? {
                packet_id: result.prior_packet.packet_id,
                fingerprint: result.prior_packet.integrity.fingerprint,
                write_status: result.prior_packet_write_status,
              }
            : null,
          decision_created: false,
          transition_created: false,
          credential_material_included: false,
          semantic_authority_granted: false,
        };
        if (options.json) {
          process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
        } else {
          process.stdout.write(
            [
              "Prepared bounded vNext semantic review material.",
              `RunReceipt: ${output.run_receipt.receipt_id} (${output.run_receipt.write_status})`,
              `EpisodeDeltaProposal: ${output.proposal.proposal_id} (${output.proposal.write_status})`,
              `Candidates: ${output.proposal.candidate_count}`,
              `Prior TaskContextPacket: ${output.prior_packet?.packet_id ?? "not supplied"}`,
              "ReviewDecision created: no",
              "Transition created: no",
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
      : error instanceof VNextOperatorPilotReviewErrorV01
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
  command: "issue-session" | "status" | "revoke" | "prepare-review";
  json: boolean;
  sessionId: string | null;
  inputPath: string | null;
  priorPacketPath: string | null;
  help: boolean;
}

function parseArgs(args: string[]): CliOptionsV01 {
  if (args.includes("--help") || args.includes("-h")) {
    if (args.length !== 1) throw new Error("help_must_be_used_alone");
    return {
      command: "status",
      json: false,
      sessionId: null,
      inputPath: null,
      priorPacketPath: null,
      help: true,
    };
  }
  const command = args[0];
  if (!(["issue-session", "status", "revoke", "prepare-review"] as const).includes(
    command as CliOptionsV01["command"],
  )) {
    throw new Error("command_required");
  }
  let json = false;
  let sessionId: string | null = null;
  let inputPath: string | null = null;
  let priorPacketPath: string | null = null;
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
    if (arg === "--input") {
      const value = args[index + 1];
      if (!value || value.startsWith("--") || inputPath !== null) {
        throw new Error("input_path_required");
      }
      inputPath = value;
      index += 1;
      continue;
    }
    if (arg === "--prior-packet") {
      const value = args[index + 1];
      if (!value || value.startsWith("--") || priorPacketPath !== null) {
        throw new Error("prior_packet_path_required");
      }
      priorPacketPath = value;
      index += 1;
      continue;
    }
    throw new Error("unsupported_argument");
  }
  if (
    command === "issue-session" &&
    (json || sessionId || inputPath || priorPacketPath)
  ) {
    throw new Error("issue_session_prints_token_once_in_human_mode_only");
  }
  if (command === "status" && (sessionId || inputPath || priorPacketPath)) {
    throw new Error("status_does_not_accept_session_id");
  }
  if (command === "revoke" && (!sessionId || inputPath || priorPacketPath)) {
    throw new Error("revoke_requires_session_id");
  }
  if (command === "prepare-review" && (!inputPath || sessionId)) {
    throw new Error("prepare_review_requires_input");
  }
  return {
    command: command as CliOptionsV01["command"],
    json,
    sessionId,
    inputPath,
    priorPacketPath,
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
      "  npm run vnext:operator-pilot -- prepare-review --input <structured-mapper.json> [--prior-packet <packet.json>] [--json]",
      "",
      "The bootstrap token is printed once. Status and revoke output never include credential hashes or secrets.",
      "This local possession check is not external or legal identity authentication.",
    ].join("\n") + "\n",
  );
}

function readStructuredMapperInput(inputPath: string): unknown {
  return readStructuredJsonFile(inputPath, "prepare_review_input");
}

function readStructuredJsonFile(inputPath: string, field: string): unknown {
  const resolved = resolve(inputPath);
  if (extname(resolved).toLowerCase() !== ".json") {
    throw new Error(`${field}_must_be_json`);
  }
  const stat = statSync(resolved);
  if (!stat.isFile() || stat.size <= 0 || stat.size > 1024 * 1024) {
    throw new Error(`${field}_file_invalid`);
  }
  const text = readFileSync(resolved, "utf8");
  const value = JSON.parse(text) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field}_invalid`);
  }
  return value;
}
