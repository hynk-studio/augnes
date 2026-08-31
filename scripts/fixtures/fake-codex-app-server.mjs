#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import dns from "node:dns";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  rmSync,
  symlinkSync,
  watch,
  writeFileSync,
} from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import tls from "node:tls";

import { waitForBoundedFileSignal } from "../bounded-file-signal.mjs";

const root = process.cwd();
const canonicalTestRoot = process.env.AUGNES_CANONICAL_TEMP_ROOT ?? null;
const scenario =
  process.env.FAKE_CODEX_SCENARIO ??
  (process.env.AUGNES_CANONICAL_TEST_MODE === "1" && canonicalTestRoot
    ? "browser_two_sequential_approvals"
    : "command_approval");
const isolatedAuthScenario = scenario.startsWith("isolated_auth_");
const threadId =
  process.env.FAKE_CODEX_THREAD_ID ?? "01900000-0000-7000-8000-000000000001";
const sessionId =
  process.env.FAKE_CODEX_SESSION_ID ?? "01900000-0000-7000-8000-000000000002";
const turnId =
  process.env.FAKE_CODEX_TURN_ID ?? "01900000-0000-7000-8000-000000000003";
const approvalRequestId = "fake-server-approval-1";
const sequentialApprovalCount = 20;
// The full canonical browser lifecycle includes a server-rendered Project Home
// refresh before each approval control is used. A 10-second test barrier proved
// insufficient under the complete canonical load; keep this below the browser's
// 90-second durable approval bound while remaining independently fail-closed.
const browserReleaseTimeoutMs = 30_000;
const statePath = process.env.FAKE_CODEX_STATE_PATH ?? null;
const tracePath =
  process.env.FAKE_CODEX_TRACE_PATH ??
  (scenario === "browser_two_sequential_approvals" && canonicalTestRoot
    ? path.join(canonicalTestRoot, "browser-approval-barriers.jsonl")
    : null);
const cleanupMarkerPath = process.env.FAKE_CODEX_CLEANUP_MARKER_PATH ?? null;
const releasePath = process.env.FAKE_CODEX_RELEASE_PATH ?? null;
const approvalResolutionBarrierPath =
  process.env.FAKE_CODEX_APPROVAL_RESOLUTION_BARRIER_PATH ?? null;
const cancellationApprovalResolutionReleasePath =
  process.env.FAKE_CODEX_CANCELLATION_APPROVAL_RESOLUTION_RELEASE_PATH ?? null;
const browserSecondApprovalReleasePath =
  scenario === "browser_two_sequential_approvals" && canonicalTestRoot
    ? path.join(canonicalTestRoot, "browser-second-approval.release")
    : null;
const browserTerminalReleasePath =
  scenario === "browser_two_sequential_approvals" && canonicalTestRoot
    ? path.join(canonicalTestRoot, "browser-terminal.release")
    : null;
const networkCountPath = process.env.FAKE_CODEX_NETWORK_COUNT_PATH ?? null;
const authBoundaryPath = process.env.FAKE_CODEX_AUTH_BOUNDARY_PATH ?? null;
let externalNetworkAttempts = 0;
let initialized = false;
let turnActive = false;
const pendingApprovalRequestIds = new Set();
const approvalRequestParams = new Map();
let sequentialApprovalIndex = 0;
let completed = false;
let descendant = null;

installZeroNetworkGuard();
trace("fixture_started", { scenario });

if (process.argv.at(-2) !== "app-server" || process.argv.at(-1) !== "--stdio") {
  process.exit(2);
}

if (isolatedAuthScenario) {
  const authSnapshotPath = path.join(process.env.CODEX_HOME ?? "", "auth.json");
  let authSnapshotKind = null;
  if (existsSync(authSnapshotPath)) {
    const stored = JSON.parse(readFileSync(authSnapshotPath, "utf8"));
    if (
      stored?.auth_mode !== "agentIdentity" ||
      !(
        typeof stored.agent_identity === "string" ||
        (stored.agent_identity &&
          typeof stored.agent_identity === "object" &&
          !Array.isArray(stored.agent_identity))
      )
    )
      process.exit(5);
    authSnapshotKind =
      typeof stored.agent_identity === "string" ? "jwt" : "record";
  }
  const repositoryChildEnvironment = Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "LC_CTYPE", "TERM"]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]]),
  );
  const descendantProbe = spawnSync(
    process.execPath,
    [
      "-e",
      "process.stdout.write(process.env.CODEX_ACCESS_TOKEN ? 'present' : 'absent')",
    ],
    {
      env: repositoryChildEnvironment,
      encoding: "utf8",
      shell: false,
      windowsHide: true,
    },
  );
  if (authBoundaryPath) {
    writeFileSync(
      authBoundaryPath,
      `${JSON.stringify({
        app_server_material_present:
          authSnapshotKind !== null,
        environment_material_present:
          typeof process.env.CODEX_ACCESS_TOKEN === "string" &&
          process.env.CODEX_ACCESS_TOKEN.length > 0,
        auth_snapshot_kind: authSnapshotKind,
        repository_child_material_present: descendantProbe.stdout === "present",
        shared_home_canary_visible: existsSync(
          path.join(process.env.HOME ?? "", "foreign-config.toml"),
        ),
        shared_codex_home_history_visible: existsSync(
          path.join(process.env.CODEX_HOME ?? "", "foreign-history.jsonl"),
        ),
        owned_tmp_present:
          typeof process.env.TMPDIR === "string" &&
          path.basename(process.env.TMPDIR) === "tmp",
        shared_tmp_canary_visible: existsSync(
          path.join(process.env.TMPDIR ?? "", "foreign-temp-canary"),
        ),
        material_in_argv: process.argv.some((value) =>
          /(?:sk-(?:proj-)?|xoxb-|AKIA[A-Z0-9]|BEGIN PRIVATE KEY)/u.test(value),
        ),
        file_store_policy_present: process.argv.includes(
          'cli_auth_credentials_store="file"',
        ),
        shell_core_policy_present: process.argv.includes(
          'shell_environment_policy.inherit="core"',
        ),
        shell_sensitive_name_excludes_present: process.argv.includes(
          "shell_environment_policy.ignore_default_excludes=false",
        ),
      })}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  }
  if (scenario === "isolated_auth_tmp_substitution") {
    const ownedTmp = process.env.TMPDIR;
    if (ownedTmp) {
      rmSync(ownedTmp, { recursive: true, force: true });
      symlinkSync(process.cwd(), ownedTmp);
    }
  }
}

if (scenario === "descendant_cleanup") {
  descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
    windowsHide: true,
  });
  trace("descendant_started", { pid: descendant.pid ?? null });
}

if (scenario === "isolated_auth_ignore_sigterm") {
  setInterval(() => {}, 1_000);
  process.on("SIGTERM", () => {
    trace("sigterm_ignored_for_isolated_auth_rollback_test", {});
  });
  trace("sigterm_handler_ready_for_isolated_auth_rollback_test", {});
}

const lines = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});
lines.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    process.exitCode = 3;
    lines.close();
    return;
  }
  trace("received", minimized(message));
  void handle(message).catch((error) => {
    trace("handler_error", {
      code: error instanceof Error ? error.message : "unknown",
    });
    process.exitCode = 4;
    lines.close();
  });
});
lines.on("close", () => {
  void settleAndExit();
});
process.on("exit", persistNetworkCount);

async function handle(message) {
  if (Object.hasOwn(message, "method") && Object.hasOwn(message, "id")) {
    if (message.method === "initialize") {
      if (scenario === "unsupported_app_server") {
        respondError(message.id, -32601, "Method not found");
        return;
      }
      if (scenario === "init_failure") {
        respondError(message.id, -32000, "initialization failed");
        return;
      }
      if (scenario === "invalid_response_envelope") {
        send({
          id: message.id,
          result: { userAgent: "codex-cli/0.147.0" },
          error: { code: -32000, message: "conflicting response fields" },
        });
        return;
      }
      initialized = true;
      const fakeCodexUserAgent = fakeCodexUserAgentV01(
        scenario,
        message.params?.clientInfo,
      );
      respond(message.id, {
        userAgent: fakeCodexUserAgent,
        codexHome: process.env.CODEX_HOME ?? process.env.HOME ?? root,
        platformFamily: process.platform === "win32" ? "windows" : "unix",
        platformOs: process.platform,
      });
      if (scenario === "duplicate_response") {
        respond(message.id, {
          userAgent: fakeCodexUserAgent,
          codexHome: process.env.HOME ?? root,
          platformFamily: "unix",
          platformOs: process.platform,
        });
      }
      if (scenario === "conflicting_duplicate_response") {
        respond(message.id, {
          userAgent: "codex-cli/conflict",
          codexHome: process.env.HOME ?? root,
          platformFamily: "unix",
          platformOs: process.platform,
        });
      }
      if (scenario === "mismatched_response_id") {
        respond("not-the-request-id", {});
      }
      if (scenario === "malformed_json") process.stdout.write("{malformed\n");
      if (scenario === "oversized_jsonl") {
        process.stdout.write(`${"x".repeat(300 * 1024)}\n`);
      }
      return;
    }
    if (!initialized) {
      respondError(message.id, -32002, "Not initialized");
      return;
    }
    if (message.method === "account/read") {
      respond(
        message.id,
        scenario === "unauthenticated" ||
        scenario === "isolated_auth_unauthenticated"
          ? { account: null, requiresOpenaiAuth: true }
          : {
              account: {
                type: "chatgpt",
                email:
                  scenario === "isolated_auth_email_absent"
                    ? null
                    : scenario === "isolated_auth_account_mismatch"
                      ? "different-account@example.invalid"
                      : "not-returned-to-augnes@example.invalid",
                planType:
                  scenario === "isolated_auth_account_plan_drift"
                    ? "different-plan"
                    : "unknown",
              },
              requiresOpenaiAuth: true,
            },
      );
      return;
    }
    if (message.method === "getAuthStatus") {
      respond(
        message.id,
        isolatedAuthScenario && scenario !== "isolated_auth_mode_fallback"
          ? {
              authMethod: "agentIdentity",
              authToken: null,
              requiresOpenaiAuth: true,
            }
          : {
              authMethod: "chatgpt",
              authToken: null,
              requiresOpenaiAuth: true,
            },
      );
      return;
    }
    if (message.method === "config/read") {
      const provenance = isolatedAuthScenario
        ? isolatedAuthConfigReadProvenanceV01(scenario)
        : { origins: {}, layers: [], requirements: [] };
      const response = {
        config: {
          forced_login_method: isolatedAuthScenario ? "chatgpt" : null,
          cli_auth_credentials_store: isolatedAuthScenario ? "file" : null,
          model_provider: isolatedAuthScenario ? "openai" : null,
          model:
            scenario === "isolated_auth_model_configuration_drift"
              ? "foreign-model"
              : isolatedAuthScenario
                ? "fake-isolated-model"
                : null,
          model_reasoning_effort: isolatedAuthScenario ? "low" : null,
          model_providers:
            scenario === "isolated_auth_provider_route_drift"
              ? {
                  openai: {
                    base_url: "https://api.openai.com/v1",
                    wire_api: "responses",
                  },
                }
              : scenario === "isolated_auth_custom_provider_drift"
                ? {
                    openai: {
                      base_url: "https://example.invalid/v1",
                      wire_api: "responses",
                    },
                  }
                : scenario === "isolated_auth_provider_env_key_drift"
                  ? { openai: { env_key: "OPENAI_API_KEY" } }
                  : scenario === "isolated_auth_provider_bearer_drift"
                    ? { openai: { experimental_bearer_token: "configured" } }
                    : scenario === "isolated_auth_provider_auth_drift"
                      ? { openai: { auth: { command: "foreign-auth" } } }
                      : scenario === "isolated_auth_provider_aws_drift"
                        ? { openai: { aws: { region: "us-east-1" } } }
                      : scenario === "isolated_auth_provider_headers_drift"
                        ? {
                            openai: {
                              query_params: { source: "foreign" },
                              http_headers: { Authorization: "foreign" },
                              env_http_headers: {
                                Authorization: "FOREIGN_AUTH",
                              },
                            },
                          }
                        : null,
          web_search:
            isolatedAuthScenario && scenario !== "isolated_auth_config_mismatch"
              ? "disabled"
              : null,
          project_doc_max_bytes: isolatedAuthScenario ? 0 : 32_768,
          project_doc_fallback_filenames: isolatedAuthScenario ? [] : null,
          sqlite_home:
            isolatedAuthScenario &&
            scenario === "isolated_auth_sqlite_home_drift"
              ? "/codex-isolated-fixture/foreign-sqlite-home"
              : null,
          allow_login_shell: isolatedAuthScenario ? false : true,
          shell_environment_policy: isolatedAuthScenario
            ? { inherit: "core", ignore_default_excludes: false }
            : null,
          mcp_servers: isolatedAuthScenario ? {} : null,
          plugins:
            scenario === "isolated_auth_plugin_drift"
              ? { unexpected: { enabled: true } }
              : isolatedAuthScenario
                ? {}
                : null,
          skills: isolatedAuthScenario ? {} : null,
          apps: isolatedAuthScenario
            ? isolatedAuthInactiveAppsProjectionV01(scenario)
            : null,
          orchestrator: isolatedAuthScenario
            ? {
                skills: { enabled: false },
                mcp: { enabled: false },
              }
            : null,
          check_for_update_on_startup: isolatedAuthScenario ? false : true,
          features: isolatedAuthScenario
            ? isolatedAuthFeatureProjectionV01(scenario)
            : null,
        },
        ...provenance,
      };
      if (isolatedAuthScenario) {
        trace("isolated_auth_config_read_shape", {
          requirements_field_present: Object.hasOwn(response, "requirements"),
          layer_count: response.layers.length,
          origin_count: Object.keys(response.origins).length,
          session_flags_layer_count: response.layers.filter(
            (layer) => layer?.name?.type === "sessionFlags",
          ).length,
          sqlite_home_is_null: response.config.sqlite_home === null,
          sqlite_home_origin_present: Object.hasOwn(
            response.origins,
            "sqlite_home",
          ),
          apps_top_level_keys: Object.keys(response.config.apps).sort(),
          apps_per_app_count: Object.keys(response.config.apps).filter(
            (key) => key !== "_default",
          ).length,
        });
      }
      respond(message.id, response);
      return;
    }
    if (message.method === "mcpServerStatus/list") {
      if (scenario === "isolated_auth_runtime_drift") {
        respondAndRuntimeDriftInOneBatch(message.id);
        return;
      }
      respond(
        message.id,
        scenario === "isolated_auth_mcp_drift"
          ? { data: [{ name: "unexpected-network-tool" }], nextCursor: null }
          : { data: [], nextCursor: null },
      );
      return;
    }
    if (message.method === "thread/start") {
      if (scenario === "crash_before_thread_id") {
        process.exit(17);
      }
      if (
        scenario === "thread_bound_notification_before_response" ||
        scenario === "mismatched_thread_notification_before_response"
      ) {
        notify("mcpServer/startupStatus/updated", {
          threadId:
            scenario === "mismatched_thread_notification_before_response"
              ? "wrong-thread"
              : threadId,
          server: "bounded-fixture",
          status: "ready",
        });
      }
      if (scenario === "status_only_notifications") {
        notify("remoteControl/status/changed", { status: "disconnected" });
        notify("mcpServer/startupStatus/updated", {
          server: "bounded-fixture",
          status: "ready",
        });
      }
      respond(message.id, threadResponse());
      if (scenario === "crash_after_thread_id") {
        setImmediate(() => process.exit(18));
      }
      return;
    }
    if (message.method === "thread/read") {
      respond(message.id, {
        thread: thread({ includeTurns: true, turnStatus: "inProgress" }),
      });
      return;
    }
    if (message.method === "thread/resume") {
      if (scenario === "disconnect_resume_same_batch") {
        respondAndCompleteSuccessInOneBatch(message.id);
        return;
      }
      respond(
        message.id,
        threadResponse({ includeTurns: true, turnStatus: "inProgress" }),
      );
      if (scenario === "cw1_same_run_resume_repository_edit") {
        applyCw1MechanicalRepositoryEdit();
        emitObservedItems(path.join(root, "src", "route-token.mjs"));
        setImmediate(() => completeSuccess());
      } else if (scenario === "disconnect_resume") {
        setImmediate(() => completeSuccess());
      }
      return;
    }
    if (message.method === "turn/start") {
      turnActive = true;
      persistState({ threadId, sessionId, turnId, status: "inProgress" });
      if (scenario === "browser_two_sequential_approvals") {
        // Exercise the supported App Server ordering where a turn notification
        // and approval arrive before the matching turn/start response. The
        // adapter must preserve that first validated turn binding.
        notify("turn/started", { threadId, turn: turn("inProgress", []) });
        notify("thread/status/changed", {
          threadId,
          status: { type: "active", activeFlags: [] },
        });
        requestSequentialApproval();
        setTimeout(
          () => respond(message.id, { turn: turn("inProgress", []) }),
          25,
        );
        return;
      }
      respond(message.id, { turn: turn("inProgress", []) });
      setImmediate(() => {
        notify("turn/started", { threadId, turn: turn("inProgress", []) });
        notify("thread/status/changed", {
          threadId,
          status: { type: "active", activeFlags: [] },
        });
        if (scenario === "status_only_notifications") {
          notify("hook/started", {
            threadId,
            turnId,
            run: { status: "running" },
          });
          notify("hook/completed", {
            threadId,
            turnId,
            run: { status: "completed" },
          });
          notify("thread/name/updated", {
            threadId,
            threadName: "Bounded fixture name",
          });
        }
        if (scenario === "absolute_inside_root_file_change") {
          emitObservedItems(path.join(root, "src", "live-result.ts"));
          completeSuccess();
        } else if (scenario === "absolute_outside_root_file_change") {
          emitObservedItems(path.join(path.dirname(root), "outside-result.ts"));
          completeSuccess();
        } else if (
          scenario === "cw1_predecessor_repository_edit" ||
          scenario === "cw1_successor_repository_edit" ||
          scenario === "isolated_auth_cw1_live_training_repository_edit"
        ) {
          applyCw1MechanicalRepositoryEdit();
          emitObservedItems(path.join(root, cw1MechanicalChangedPath()));
          completeSuccess();
        } else if (
          scenario === "success" ||
          isolatedAuthScenario ||
          scenario === "thread_bound_notification_before_response" ||
          scenario === "status_only_notifications"
        )
          completeSuccess();
        else if (scenario === "turn_failure") completeFailure();
        else if (scenario === "structured_result_invalid")
          completeInvalidStructuredResult();
        else if (scenario === "structured_result_oversized")
          completeOversizedStructuredResult();
        else if (scenario === "structured_result_unsafe_path")
          completeUnsafePathStructuredResult();
        else if (scenario === "structured_result_private_path_text")
          completeUnsafeTextStructuredResult(
            "Completed under /Users/private/project/file.ts",
          );
        else if (scenario === "structured_result_credential_text")
          completeUnsafeTextStructuredResult(
            "OPENAI_API_KEY=sk-not-returned-to-augnes-1234567890",
          );
        else if (
          scenario === "disconnect_resume" ||
          scenario === "disconnect_resume_same_batch" ||
          scenario === "cw1_same_run_resume_repository_edit"
        ) {
          trace("intentional_disconnect", { exit_code: 19 });
          process.exit(19);
        } else if (
          scenario === "command_approval" ||
          scenario === "cancellation_terminal_before_approval_resolved" ||
          scenario === "delayed_cleanup" ||
          scenario === "ignored_interrupt" ||
          scenario === "descendant_cleanup"
        )
          requestCommandApproval();
        else if (scenario === "public_safe_command_approval")
          requestCommandApproval({
            command: String.raw`/usr/bin/env tool --client-secret super-secret-value --header "Authorization: Bearer header-secret-value" node /home/private/project/script.js`,
          });
        else if (isSequentialApprovalScenario()) requestSequentialApproval();
        else if (scenario === "concurrent_approval_overflow") {
          requestConcurrentApprovalOverflow();
        } else if (scenario === "active_duplicate_request") {
          const params = commandApprovalParams();
          requestCommandApprovalWithParams(approvalRequestId, params);
          requestCommandApprovalWithParams(approvalRequestId, params);
        } else if (scenario === "active_conflicting_request") {
          requestCommandApproval();
          requestCommandApproval(
            { command: "npm run conflicting-check" },
            approvalRequestId,
          );
        } else if (
          scenario === "resolved_duplicate_request" ||
          scenario === "resolved_conflicting_request"
        )
          requestCommandApproval();
        else if (scenario === "command_network_approval")
          requestCommandApproval({
            networkApprovalContext: {
              host: "api.example.invalid",
              protocol: "https",
            },
          });
        else if (scenario === "file_approval")
          requestFileApproval(path.join(root, "src"));
        else if (scenario === "file_approval_unsafe")
          requestFileApproval("C:\\outside\\file.ts");
        else if (scenario === "permission_approval")
          requestPermissionApproval(false);
        else if (
          scenario === "network_permission_approval" ||
          scenario === "network_permission_approval_ignored_interrupt"
        )
          requestPermissionApproval(true);
        else if (scenario === "mismatched_thread_approval")
          requestCommandApproval({ threadId: "wrong-thread" });
        else if (scenario === "mismatched_turn_approval")
          requestCommandApproval({ turnId: "wrong-turn" });
        else if (scenario === "unknown_approval_method")
          requestUnknownApproval();
        else if (scenario === "thread_status_unsupported") {
          notify("thread/status/changed", {
            threadId,
            status: { type: "notLoaded" },
          });
        } else if (scenario === "thread_system_error_failure") {
          notify("error", {
            threadId,
            turnId,
            error: {
              message: "bounded fake failure",
              codexErrorInfo: "internalServerError",
              additionalDetails: null,
            },
            willRetry: false,
          });
          notify("thread/status/changed", {
            threadId,
            status: { type: "systemError" },
          });
          completeFailure();
        } else if (scenario === "thread_system_error_retry") {
          notify("error", {
            threadId,
            turnId,
            error: {
              message: "bounded fake retry",
              codexErrorInfo: {
                responseStreamDisconnected: { httpStatusCode: null },
              },
              additionalDetails: null,
            },
            willRetry: true,
          });
          notify("thread/status/changed", {
            threadId,
            status: { type: "systemError" },
          });
          notify("thread/status/changed", {
            threadId,
            status: { type: "active", activeFlags: [] },
          });
          completeSuccess();
        } else if (scenario === "conflicting_completion")
          completeConflictingSuccess();
        else if (scenario === "duplicate_event") {
          notify("turn/started", { threadId, turn: turn("inProgress", []) });
          completeSuccess();
        } else completeSuccess();
      });
      return;
    }
    if (message.method === "turn/interrupt") {
      trace("interrupt", {
        threadId: message.params?.threadId,
        turnId: message.params?.turnId,
      });
      respond(message.id, {});
      if (
        scenario === "ignored_interrupt" ||
        scenario === "network_permission_approval_ignored_interrupt"
      )
        return;
      if (scenario === "cancellation_terminal_before_approval_resolved") {
        completeInterrupted();
        return;
      }
      const delayMs = scenario === "delayed_cleanup" ? 75 : 0;
      setTimeout(() => completeInterrupted(), delayMs);
      return;
    }
    respondError(message.id, -32601, "Method not found");
    return;
  }

  if (
    Object.hasOwn(message, "id") &&
    pendingApprovalRequestIds.has(String(message.id))
  ) {
    const resolvedRequestId = String(message.id);
    trace("approval_decision_received", {
      approval_index: sequentialApprovalIndex,
    });
    pendingApprovalRequestIds.delete(resolvedRequestId);
    const resolvedParams = approvalRequestParams.get(resolvedRequestId);
    const accepted =
      message.result?.decision === "accept" ||
      (message.result?.scope === "turn" &&
        message.result?.permissions &&
        Object.keys(message.result.permissions).length > 0);
    if (
      scenario === "cancellation_terminal_before_approval_resolved" &&
      message.result?.decision === "cancel"
    ) {
      trace("cancellation_approval_resolution_held", {
        request_id: resolvedRequestId,
      });
      await waitForCancellationApprovalResolutionRelease();
      if (!completed) {
        throw new Error(
          "cancellation_terminal_not_observed_before_approval_resolution",
        );
      }
      notify("serverRequest/resolved", {
        threadId,
        requestId: resolvedRequestId,
      });
      trace("cancellation_approval_resolution_released", {
        request_id: resolvedRequestId,
      });
      return;
    }
    notify("serverRequest/resolved", {
      threadId,
      requestId: resolvedRequestId,
    });
    if (isSequentialApprovalScenario() && accepted) {
      if (scenario === "sequential_approval_chain") {
        await waitForApprovalResolutionObservation(sequentialApprovalIndex);
      } else if (sequentialApprovalIndex === 1) {
        await waitForBrowserRelease(
          browserSecondApprovalReleasePath,
          "browser_second_approval",
        );
      } else {
        await waitForBrowserRelease(
          browserTerminalReleasePath,
          "browser_terminal",
        );
      }
      if (sequentialApprovalIndex < sequentialApprovalTargetCount()) {
        requestSequentialApproval();
      } else {
        emitObservedItems();
        completeSuccess();
      }
      return;
    }
    if (
      scenario === "resolved_duplicate_request" ||
      scenario === "resolved_conflicting_request"
    ) {
      await waitForApprovalResolutionObservation(1);
      requestCommandApprovalWithParams(
        resolvedRequestId,
        scenario === "resolved_conflicting_request"
          ? {
              ...resolvedParams,
              command: "npm run conflicting-after-resolution",
              commandActions: [
                {
                  type: "unknown",
                  command: "npm run conflicting-after-resolution",
                },
              ],
            }
          : resolvedParams,
      );
      return;
    }
    if (accepted) {
      emitObservedItems();
      completeSuccess();
    } else if (message.result?.decision === "cancel") {
      if (
        scenario === "ignored_interrupt" ||
        scenario === "network_permission_approval_ignored_interrupt"
      )
        return;
      completeInterrupted();
    } else if (scenario === "network_permission_approval_ignored_interrupt") {
      // This scenario models a host that resolves the permission request but
      // never confirms turn interruption. Core must pause for reconciliation
      // and admit no terminal receipt, independently of JSONL message order.
      return;
    } else {
      completeFailure();
    }
  }
}

function fakeCodexUserAgentV01(value, clientInfo) {
  if (!value.startsWith("isolated_auth_"))
    return "codex-cli/fake-0.143.0";
  const name =
    typeof clientInfo?.name === "string" ? clientInfo.name : "augnes";
  const version =
    typeof clientInfo?.version === "string"
      ? clientInfo.version
      : "codex_app_server_adapter.v0.1";
  const cliVersion =
    value === "isolated_auth_cli_version_mismatch" ? "0.147.0" : "0.150.1";
  const originator =
    value === "isolated_auth_user_agent_wrong_originator"
      ? "other-originator"
      : name;
  const suffixVersion =
    value === "isolated_auth_user_agent_wrong_client_version"
      ? "codex_app_server_adapter.v9.9"
      : version;
  if (value === "isolated_auth_user_agent_legacy_abbreviated")
    return "codex-cli/0.150.1";
  if (value === "isolated_auth_user_agent_missing_platform")
    return `${originator}/${cliVersion} fake-terminal/1.0 (${name}; ${suffixVersion})`;
  if (value === "isolated_auth_user_agent_malformed_platform")
    return `${originator}/${cliVersion} (Mac OS current; arm64) fake-terminal/1.0 (${name}; ${suffixVersion})`;
  if (value === "isolated_auth_user_agent_control_character")
    return `${originator}/${cliVersion} (Mac OS 15.7.1; arm64) fake\u0000terminal/1.0 (${name}; ${suffixVersion})`;
  if (value === "isolated_auth_user_agent_over_bound")
    return `${originator}/${cliVersion} (Mac OS 15.7.1; arm64) ${"x".repeat(480)} (${name}; ${suffixVersion})`;
  const full = `${originator}/${cliVersion} (Mac OS 15.7.1; arm64) fake-terminal/1.0 (${name}; ${suffixVersion})`;
  if (value === "isolated_auth_user_agent_duplicate_identity")
    return `${full} (${name}; ${suffixVersion})`;
  if (value === "isolated_auth_user_agent_unexpected_suffix")
    return `${full} unexpected`;
  return full;
}

function requestCommandApproval(overrides = {}, requestId = approvalRequestId) {
  requestCommandApprovalWithParams(requestId, commandApprovalParams(overrides));
}

function commandApprovalParams(overrides = {}) {
  const command = overrides.command ?? "npm test";
  return {
    threadId: overrides.threadId ?? threadId,
    turnId: overrides.turnId ?? turnId,
    itemId: overrides.itemId ?? "fake-command-item",
    startedAtMs: Date.now(),
    environmentId: null,
    reason: "Run one bounded verification command.",
    command,
    cwd: root,
    commandActions: [{ type: "unknown", command }],
    ...(overrides.networkApprovalContext
      ? { networkApprovalContext: overrides.networkApprovalContext }
      : {}),
  };
}

function requestCommandApprovalWithParams(requestId, params) {
  pendingApprovalRequestIds.add(requestId);
  approvalRequestParams.set(requestId, params);
  serverRequest(requestId, "item/commandExecution/requestApproval", params);
}

function requestSequentialApproval() {
  sequentialApprovalIndex += 1;
  trace("approval_emitted", { approval_index: sequentialApprovalIndex });
  requestCommandApproval(
    { itemId: `fake-sequential-command-item-${sequentialApprovalIndex}` },
    `fake-server-sequential-${sequentialApprovalIndex}`,
  );
}

function requestConcurrentApprovalOverflow() {
  const messages = [];
  for (let index = 1; index <= 9; index += 1) {
    const requestId = `fake-server-concurrent-${index}`;
    const params = commandApprovalParams({
      itemId: `fake-concurrent-command-item-${index}`,
    });
    pendingApprovalRequestIds.add(requestId);
    approvalRequestParams.set(requestId, params);
    const message = {
      id: requestId,
      method: "item/commandExecution/requestApproval",
      params,
    };
    trace("sent", minimized(message));
    messages.push(JSON.stringify(message));
  }
  // One bounded pipe write makes the overflow fixture independent of stdout
  // chunk scheduling. The adapter must observe all nine requests before any
  // asynchronous approval lifecycle handler can race the ninth-request bound.
  process.stdout.write(`${messages.join("\n")}\n`);
}

function isolatedAuthConfigReadProvenanceV01(activeScenario) {
  const entries = isolatedAuthRuntimeOverrideEntriesV01(
    process.argv.slice(2, -2),
  );
  const sessionConfig = isolatedAuthRuntimeOverrideProjectionV01(entries);
  const sessionLayer = fakeConfigLayerV01(
    { type: "sessionFlags" },
    sessionConfig,
  );
  const emptyConfig = {};
  let layers = [
    sessionLayer,
    fakeConfigLayerV01(
      {
        type: "user",
        file: "/codex-isolated-fixture/user/config.toml",
        profile: null,
      },
      emptyConfig,
    ),
    fakeConfigLayerV01(
      { type: "system", file: "/codex-isolated-fixture/system/config.toml" },
      emptyConfig,
    ),
  ];
  const origins = Object.fromEntries(
    isolatedAuthRuntimeOriginPathsV01(entries).map((originPath) => [
      originPath,
      {
        name: { type: "sessionFlags" },
        version: sessionLayer.version,
      },
    ]),
  );
  const activeConfig = { model_provider: "foreign" };
  switch (activeScenario) {
    case "isolated_auth_provenance_session_flags_missing":
      layers = layers.filter((layer) => layer.name.type !== "sessionFlags");
      break;
    case "isolated_auth_provenance_session_flags_duplicate":
      layers.splice(1, 0, structuredClone(sessionLayer));
      break;
    case "isolated_auth_provenance_non_empty_user_layer":
      layers[1] = fakeConfigLayerV01(layers[1].name, activeConfig);
      break;
    case "isolated_auth_provenance_non_empty_system_layer":
      layers[2] = fakeConfigLayerV01(layers[2].name, activeConfig);
      break;
    case "isolated_auth_provenance_non_empty_project_layer":
      layers.splice(
        1,
        0,
        fakeConfigLayerV01(
          {
            type: "project",
            dotCodexFolder: "/codex-isolated-fixture/project/.codex",
          },
          activeConfig,
        ),
      );
      break;
    case "isolated_auth_managed_layer_drift":
    case "isolated_auth_provenance_non_empty_mdm_layer":
      layers.push(
        fakeConfigLayerV01(
          { type: "mdm", domain: "com.openai.codex", key: "config" },
          activeConfig,
        ),
      );
      break;
    case "isolated_auth_provenance_non_empty_enterprise_layer":
      layers.splice(
        2,
        0,
        fakeConfigLayerV01(
          { type: "enterpriseManaged", id: "fixture", name: "Fixture" },
          activeConfig,
        ),
      );
      break;
    case "isolated_auth_provenance_expected_origin_missing":
      delete origins.forced_login_method;
      break;
    case "isolated_auth_sqlite_home_origin_drift":
      origins.sqlite_home = {
        name: { type: "sessionFlags" },
        version: sessionLayer.version,
      };
      break;
    case "isolated_auth_provenance_origin_user":
      origins.forced_login_method = {
        name: {
          type: "user",
          file: "/codex-isolated-fixture/user/config.toml",
          profile: null,
        },
        version: sessionLayer.version,
      };
      break;
    case "isolated_auth_provenance_origin_managed":
      origins.forced_login_method = {
        name: { type: "mdm", domain: "com.openai.codex", key: "config" },
        version: sessionLayer.version,
      };
      break;
    case "isolated_auth_provenance_unknown_active_origin":
      origins["foreign.active"] = {
        name: { type: "sessionFlags" },
        version: sessionLayer.version,
      };
      break;
    case "isolated_auth_provenance_packaged_defaults_surface":
      layers.push(
        fakeConfigLayerV01(
          {
            type: "packagedDefaults",
            file: "/codex-isolated-fixture/package/defaults.toml",
          },
          emptyConfig,
        ),
      );
      break;
    case "isolated_auth_provenance_malformed_layer_metadata":
      layers[0] = { ...layers[0], version: "not-a-sha256-version" };
      break;
  }
  return { origins, layers };
}

function isolatedAuthRuntimeOverrideEntriesV01(args) {
  if (
    args[0] !== "--strict-config" ||
    args.length < 3 ||
    (args.length - 1) % 2 !== 0
  )
    throw new Error("fake_isolated_auth_config_override_shape_invalid");
  const entries = [];
  const paths = new Set();
  for (let index = 1; index < args.length; index += 2) {
    if (args[index] !== "-c")
      throw new Error("fake_isolated_auth_config_override_shape_invalid");
    const expression = args[index + 1];
    const separator = expression.indexOf("=");
    const overridePath = expression.slice(0, separator);
    const rawValue = expression.slice(separator + 1);
    if (
      separator <= 0 ||
      !/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/u.test(overridePath) ||
      paths.has(overridePath)
    )
      throw new Error("fake_isolated_auth_config_override_shape_invalid");
    paths.add(overridePath);
    entries.push({
      path: overridePath,
      value: isolatedAuthRuntimeOverrideValueV01(rawValue),
    });
  }
  return entries;
}

function isolatedAuthRuntimeOverrideValueV01(value) {
  if (value === "false") return false;
  if (value === "true") return true;
  if (/^(?:0|[1-9][0-9]*)$/u.test(value)) return Number(value);
  if (value === "{}") return {};
  if (value === "[]") return [];
  const stringMatch = /^"([a-z][a-z0-9_-]*)"$/u.exec(value);
  if (stringMatch) return stringMatch[1];
  throw new Error("fake_isolated_auth_config_override_value_invalid");
}

function isolatedAuthRuntimeOverrideProjectionV01(entries) {
  const projection = {};
  for (const entry of entries) {
    const segments = entry.path.split(".");
    let target = projection;
    for (const [index, segment] of segments.entries()) {
      if (["__proto__", "prototype", "constructor"].includes(segment))
        throw new Error("fake_isolated_auth_config_override_path_invalid");
      if (index === segments.length - 1) {
        if (Object.hasOwn(target, segment))
          throw new Error("fake_isolated_auth_config_override_path_invalid");
        target[segment] = structuredClone(entry.value);
      } else {
        target[segment] ??= {};
        if (
          !target[segment] ||
          Array.isArray(target[segment]) ||
          typeof target[segment] !== "object"
        )
          throw new Error("fake_isolated_auth_config_override_path_invalid");
        target = target[segment];
      }
    }
  }
  return projection;
}

function isolatedAuthRuntimeOriginPathsV01(entries) {
  return [
    ...new Set(
      entries.flatMap((entry) => {
        if (
          Array.isArray(entry.value) ||
          (entry.value && typeof entry.value === "object")
        )
          return [];
        if (entry.path === "features.network_proxy")
          return [entry.path, `${entry.path}.enabled`];
        return [entry.path];
      }),
    ),
  ].sort();
}

function fakeConfigLayerV01(name, config) {
  return {
    name: structuredClone(name),
    version: fakeConfigLayerVersionV01(config),
    config: structuredClone(config),
  };
}

function fakeConfigLayerVersionV01(config) {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalJsonV01(config)))
    .digest("hex")}`;
}

function canonicalJsonV01(value) {
  if (Array.isArray(value)) return value.map(canonicalJsonV01);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalJsonV01(value[key])]),
    );
  return value;
}

function isolatedAuthFeatureProjectionV01(activeScenario) {
  const features = {
    apps: false,
    auth_elicitation:
      activeScenario === "isolated_auth_feature_auth_elicitation_enabled",
    browser_use: false,
    browser_use_external: false,
    browser_use_full_cdp_access: false,
    computer_use: false,
    hooks: false,
    image_generation: false,
    in_app_browser: false,
    mcp_2026_07_28:
      activeScenario === "isolated_auth_feature_mcp_2026_07_28_enabled",
    memories: activeScenario === "isolated_auth_feature_memories_enabled",
    mentions_v2:
      activeScenario === "isolated_auth_feature_mentions_v2_enabled",
    multi_agent: false,
    network_proxy: false,
    plugins: false,
    recommended_plugins: false,
    remote_control:
      activeScenario === "isolated_auth_feature_remote_control_enabled",
    remote_plugin:
      activeScenario === "isolated_auth_feature_remote_plugin_enabled",
    request_permissions_tool:
      activeScenario === "isolated_auth_tool_policy_drift",
    standalone_web_search: false,
    tool_suggest:
      activeScenario === "isolated_auth_feature_tool_suggest_enabled",
    use_agent_identity: true,
    web_search_cached: false,
    web_search_request: false,
    ...(activeScenario === "isolated_auth_unknown_feature_drift"
      ? { unknown_network_tool: false }
      : {}),
  };
  if (activeScenario === "isolated_auth_feature_required_missing") {
    delete features.auth_elicitation;
  }
  return features;
}

function isolatedAuthInactiveAppsProjectionV01(activeScenario) {
  switch (activeScenario) {
    case "isolated_auth_apps_per_app_drift":
      return { _default: null, fixture_app: { enabled: false } };
    case "isolated_auth_apps_default_malformed":
      return { _default: "malformed" };
    case "isolated_auth_apps_default_active":
      return { _default: { enabled: true } };
    case "isolated_auth_apps_unknown_key":
      return { _default: null, _unknown: null };
    default:
      return { _default: null };
  }
}

function isSequentialApprovalScenario() {
  return [
    "sequential_approval_chain",
    "browser_two_sequential_approvals",
  ].includes(scenario);
}

function sequentialApprovalTargetCount() {
  return scenario === "browser_two_sequential_approvals"
    ? 2
    : sequentialApprovalCount;
}

function requestUnknownApproval() {
  pendingApprovalRequestIds.add(approvalRequestId);
  serverRequest(approvalRequestId, "item/unknown/requestApproval", {
    threadId,
    turnId,
    itemId: "fake-unknown-item",
  });
}

function requestFileApproval(grantRoot = root) {
  pendingApprovalRequestIds.add(approvalRequestId);
  serverRequest(approvalRequestId, "item/fileChange/requestApproval", {
    threadId,
    turnId,
    itemId: "fake-file-item",
    startedAtMs: Date.now(),
    reason: "Apply one project-scoped file change.",
    grantRoot,
  });
}

function requestPermissionApproval(network) {
  pendingApprovalRequestIds.add(approvalRequestId);
  serverRequest(approvalRequestId, "item/permissions/requestApproval", {
    threadId,
    turnId,
    itemId: network ? "fake-network-item" : "fake-permission-item",
    environmentId: null,
    startedAtMs: Date.now(),
    cwd: root,
    reason: network
      ? "Request network access without a stable exact destination."
      : "Request project-scoped filesystem access.",
    permissions: network
      ? { network: { enabled: true }, fileSystem: null }
      : {
          network: null,
          fileSystem: { read: [root], write: [root], entries: [] },
        },
  });
}

function emitObservedItems(filePath = "src/live-result.ts") {
  const command = {
    type: "commandExecution",
    id: "fake-command-item",
    command: "npm test",
    cwd: root,
    processId: null,
    source: "unifiedExecStartup",
    status: "completed",
    commandActions: [{ type: "unknown", command: "npm test" }],
    aggregatedOutput: "raw output must never be persisted",
    exitCode: 0,
    durationMs: 1,
  };
  notify("item/started", {
    item: command,
    threadId,
    turnId,
    startedAtMs: Date.now(),
  });
  notify("item/completed", {
    item: command,
    threadId,
    turnId,
    completedAtMs: Date.now(),
  });
  const file = {
    type: "fileChange",
    id: "fake-file-item",
    changes: [
      {
        path: filePath,
        kind: "update",
        diff: "raw diff must never be persisted",
      },
    ],
    status: "completed",
  };
  notify("item/completed", {
    item: file,
    threadId,
    turnId,
    completedAtMs: Date.now(),
  });
}

function completeSuccess() {
  if (completed) return;
  completed = true;
  turnActive = false;
  persistState({ threadId, sessionId, turnId, status: "completed" });
  trace("terminal_state_emitted", {});
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(structuredResult())]),
  });
  notify("thread/status/changed", { threadId, status: { type: "idle" } });
}

function applyCw1MechanicalRepositoryEdit() {
  const relativePath = cw1MechanicalChangedPath();
  const target = path.resolve(root, relativePath);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  if (!target.startsWith(rootPrefix) || relativePath.includes("..")) {
    throw new Error("fake_live_training_repository_path_invalid");
  }
  const liveTrainingScenario =
    scenario === "isolated_auth_cw1_live_training_repository_edit";
  const content = liveTrainingScenario
    ? Buffer.from(
        process.env.FAKE_CODEX_CW1_OUTPUT_CONTENT_BASE64 ?? "",
        "base64",
      ).toString("utf8")
    : scenario === "cw1_predecessor_repository_edit"
      ? "export function routeToken(key, id) { return `${key}:${id}`; }\n"
      : 'import { separator } from "./channel.mjs";\nexport function routeToken(key, id) { return `${key}${separator}${id}`; }\n';
  if (content.length === 0 || content.length > 32_768) {
    throw new Error("fake_live_training_repository_content_invalid");
  }
  writeFileSync(target, content, { encoding: "utf8", mode: 0o600 });
}

function cw1MechanicalChangedPath() {
  if (scenario === "isolated_auth_cw1_live_training_repository_edit") {
    const relativePath = process.env.FAKE_CODEX_CW1_OUTPUT_RELATIVE_PATH ?? "";
    if (!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u.test(relativePath)) {
      throw new Error("fake_live_training_repository_path_invalid");
    }
    return relativePath;
  }
  return "src/route-token.mjs";
}

function respondAndCompleteSuccessInOneBatch(id) {
  if (completed) return;
  completed = true;
  turnActive = false;
  persistState({ threadId, sessionId, turnId, status: "completed" });
  const messages = [
    {
      id,
      result: threadResponse({ includeTurns: true, turnStatus: "inProgress" }),
    },
    {
      method: "turn/completed",
      params: {
        threadId,
        turn: turn("completed", [agentMessage(structuredResult())]),
      },
    },
    {
      method: "thread/status/changed",
      params: { threadId, status: { type: "idle" } },
    },
  ];
  trace("terminal_state_emitted", {});
  messages.forEach((message) => trace("sent", minimized(message)));
  trace("same_batch_emitted", {
    record_count: messages.length,
    thread_id: threadId,
    turn_id: turnId,
    methods: [
      "thread/resume:response",
      "turn/completed",
      "thread/status/changed",
    ],
  });
  // One pipe write forces the response and both notifications into the same
  // transport data batch instead of relying on probabilistic stdout chunking.
  process.stdout.write(
    `${messages.map((message) => JSON.stringify(message)).join("\n")}\n`,
  );
}

function respondAndRuntimeDriftInOneBatch(id) {
  const messages = [
    { id, result: { data: [], nextCursor: null } },
    {
      method: "account/updated",
      params: { authMode: "personalAccessToken", planType: null },
    },
  ];
  messages.forEach((message) => trace("sent", minimized(message)));
  process.stdout.write(
    `${messages.map((message) => JSON.stringify(message)).join("\n")}\n`,
  );
}

function completeConflictingSuccess() {
  if (completed) return;
  completed = true;
  const first = JSON.parse(structuredResult());
  const second = { ...first, summary: "Conflicting terminal material." };
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(first))]),
  });
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(second))]),
  });
}

function completeFailure() {
  if (completed) return;
  completed = true;
  turnActive = false;
  persistState({ threadId, sessionId, turnId, status: "failed" });
  notify("turn/completed", {
    threadId,
    turn: {
      ...turn("failed", []),
      error: {
        message: "bounded fake failure",
        codexErrorInfo: null,
        additionalDetails: null,
      },
    },
  });
}

function completeInterrupted() {
  if (completed) return;
  completed = true;
  turnActive = false;
  if (scenario !== "cancellation_terminal_before_approval_resolved") {
    pendingApprovalRequestIds.clear();
  }
  persistState({ threadId, sessionId, turnId, status: "interrupted" });
  trace("terminal_state_emitted", { status: "interrupted" });
  notify("turn/completed", { threadId, turn: turn("interrupted", []) });
}

async function settleAndExit() {
  if (scenario === "isolated_auth_ignore_sigterm") {
    trace("stdin_close_ignored_for_isolated_auth_rollback_test", {});
    return;
  }
  if (scenario === "delayed_cleanup" && releasePath) {
    await waitForRelease();
  }
  descendant?.kill("SIGTERM");
  if (cleanupMarkerPath) {
    writeFileSync(cleanupMarkerPath, "settled\n", { mode: 0o600 });
  }
  trace("stdin_closed", {});
  persistNetworkCount();
  process.exit(process.exitCode ?? 0);
}

function completeInvalidStructuredResult() {
  if (completed) return;
  completed = true;
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage("not-json")]),
  });
}

function completeOversizedStructuredResult() {
  if (completed) return;
  completed = true;
  notify("turn/completed", {
    threadId,
    // Larger than Augnes' 128 KiB structured-result bound while remaining
    // inside the 256 KiB transport-line bound, so terminal identity is known.
    turn: turn("completed", [agentMessage("x".repeat(140 * 1024))]),
  });
}

function completeUnsafePathStructuredResult() {
  if (completed) return;
  completed = true;
  const value = JSON.parse(structuredResult());
  value.changed_files[0].repository_relative_path = "C:\\private\\outside.ts";
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(value))]),
  });
}

function completeUnsafeTextStructuredResult(summary) {
  if (completed) return;
  completed = true;
  const value = JSON.parse(structuredResult());
  value.summary = summary;
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(value))]),
  });
}

function structuredResult() {
  const changedPath =
    scenario === "cw1_predecessor_repository_edit" ||
    scenario === "cw1_successor_repository_edit" ||
    scenario === "cw1_same_run_resume_repository_edit" ||
    scenario === "isolated_auth_cw1_live_training_repository_edit"
      ? cw1MechanicalChangedPath()
      : "src/live-result.ts";
  return JSON.stringify({
    result_version: "codex_host_structured_result.v0.1",
    summary:
      "The deterministic fake App Server completed the bounded live lifecycle.",
    changed_files: [
      {
        repository_relative_path: changedPath,
        change_kind: "modified",
        before_hash: null,
        after_hash: null,
      },
    ],
    artifacts: [
      {
        artifact_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "repository_relative_artifact",
          external_id: "reports/../reports/live-result.json",
          observed_at: new Date().toISOString(),
          trust_class: "host_attestation",
        },
        summary: "Bounded fake result artifact.",
      },
    ],
    observed_actions: ["fake_app_server_turn_completed"],
    commands: [],
    checks: [
      {
        check_id: "fake-live-check",
        required: true,
        status: "passed",
        summary: "The fake App Server exercised the stable lifecycle subset.",
      },
    ],
    skipped_checks: [],
    uncertainty: [],
    gaps: ["No live provider was called by the deterministic fixture."],
    proposed_next_steps: [
      "Review the operational receipt before semantic action.",
    ],
  });
}

function threadResponse(options = {}) {
  const isolated = isolatedAuthScenario;
  return {
    thread: thread({ ...options, ephemeral: isolated }),
    model: "configured-default",
    modelProvider:
      isolated && scenario !== "isolated_auth_provider_mismatch"
        ? "openai"
        : "fake",
    serviceTier: null,
    cwd: root,
    instructionSources:
      scenario === "isolated_auth_instruction_source_drift"
        ? ["file:///foreign-instruction-source"]
        : [],
    approvalPolicy: "on-request",
    approvalsReviewer: "user",
    sandbox: {
      type: "workspaceWrite",
      writableRoots: [root],
      networkAccess: false,
      excludeTmpdirEnvVar: true,
      excludeSlashTmp: true,
    },
    reasoningEffort: null,
  };
}

function thread(options = {}) {
  const includeTurns = options.includeTurns === true;
  const turnStatus = options.turnStatus ?? "inProgress";
  const ephemeral = options.ephemeral === true;
  return {
    id: threadId,
    sessionId,
    forkedFromId: null,
    parentThreadId: null,
    preview: "bounded fake thread",
    ephemeral,
    modelProvider: ephemeral ? "openai" : "fake",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    recencyAt: Math.floor(Date.now() / 1000),
    status: turnActive ? { type: "active", activeFlags: [] } : { type: "idle" },
    path: null,
    cwd: root,
    cliVersion: isolatedAuthScenario ? "0.150.1" : "0.147.0",
    source: "appServer",
    threadSource: null,
    agentNickname: null,
    agentRole: null,
    gitInfo: null,
    name: null,
    turns: includeTurns
      ? [
          turn(
            turnStatus,
            turnStatus === "completed"
              ? [agentMessage(structuredResult())]
              : [],
          ),
        ]
      : [],
  };
}

function turn(status, items) {
  return {
    id: turnId,
    items,
    itemsView: { type: "full" },
    status,
    error: null,
    startedAt: Math.floor(Date.now() / 1000),
    completedAt: status === "inProgress" ? null : Math.floor(Date.now() / 1000),
    durationMs: status === "inProgress" ? null : 1,
  };
}

function agentMessage(text) {
  return {
    type: "agentMessage",
    id: "fake-agent-message",
    text,
    phase: "final_answer",
    memoryCitation: null,
  };
}

function respond(id, result) {
  send({ id, result });
}

function respondError(id, code, message) {
  send({ id, error: { code, message } });
}

function notify(method, params) {
  send({ method, params });
}

function serverRequest(id, method, params) {
  send({ id, method, params });
}

function send(message) {
  trace("sent", minimized(message));
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function trace(kind, value) {
  if (!tracePath) return;
  appendFileSync(
    tracePath,
    `${JSON.stringify({ kind, value, at: new Date().toISOString() })}\n`,
    { mode: 0o600 },
  );
}

function minimized(message) {
  const summary = {
    id: message?.id ?? null,
    method: message?.method ?? null,
    has_result: Object.hasOwn(message ?? {}, "result"),
    has_error: Object.hasOwn(message ?? {}, "error"),
  };
  if (message?.method === "initialize") {
    summary.fixture_scenario = scenario;
    summary.capabilities = message.params?.capabilities ?? null;
  }
  if (message?.error && typeof message.error === "object") {
    summary.error_code = Number.isSafeInteger(message.error.code)
      ? message.error.code
      : null;
    summary.error_reason =
      typeof message.error.message === "string" &&
      /^[a-z0-9_]{1,160}$/u.test(message.error.message)
        ? message.error.message
        : "bounded_protocol_error";
  }
  if (
    message?.method === "thread/start" ||
    message?.method === "thread/resume"
  ) {
    if (isolatedAuthScenario) {
      summary.cwd_fingerprint =
        typeof message.params?.cwd === "string"
          ? `sha256:${createHash("sha256").update(message.params.cwd).digest("hex")}`
          : null;
    } else {
      summary.cwd = message.params?.cwd ?? null;
    }
    summary.approval_policy = message.params?.approvalPolicy ?? null;
    summary.sandbox = message.params?.sandbox ?? null;
  }
  if (message?.method === "turn/start") {
    const rendered = message.params?.input?.[0]?.text;
    const guideHeading =
      "## GuideBrief — non-authoritative task-start guidance";
    const packetHeading =
      "## TaskContextPacket — exact bounded execution contract";
    const guideIndex =
      typeof rendered === "string" ? rendered.indexOf(guideHeading) : -1;
    const packetIndex =
      typeof rendered === "string" ? rendered.indexOf(packetHeading) : -1;
    const packetText =
      typeof rendered === "string" ? (rendered.split("\n\n").at(-1) ?? "") : "";
    const packetFingerprint =
      typeof rendered === "string"
        ? (rendered.match(/Packet fingerprint: (sha256:[a-f0-9]{64})/u)?.[1] ??
          null)
        : null;
    summary.thread_id = message.params?.threadId ?? null;
    if (isolatedAuthScenario) {
      summary.cwd_fingerprint =
        typeof message.params?.cwd === "string"
          ? `sha256:${createHash("sha256").update(message.params.cwd).digest("hex")}`
          : null;
    } else {
      summary.cwd = message.params?.cwd ?? null;
    }
    summary.approval_policy = message.params?.approvalPolicy ?? null;
    if (isolatedAuthScenario) {
      const sandboxPolicy = message.params?.sandboxPolicy;
      summary.sandbox_policy_type = sandboxPolicy?.type ?? null;
      summary.sandbox_writable_root_fingerprints = Array.isArray(
        sandboxPolicy?.writableRoots,
      )
        ? sandboxPolicy.writableRoots.map((writableRoot) =>
            typeof writableRoot === "string"
              ? `sha256:${createHash("sha256").update(writableRoot).digest("hex")}`
              : null,
          )
        : [];
    } else {
      summary.sandbox_policy = message.params?.sandboxPolicy ?? null;
    }
    summary.output_schema = Boolean(message.params?.outputSchema);
    summary.rendered_input_bytes =
      typeof rendered === "string" ? Buffer.byteLength(rendered, "utf8") : 0;
    summary.rendered_input_sha256 =
      typeof rendered === "string"
        ? `sha256:${createHash("sha256").update(rendered).digest("hex")}`
        : null;
    summary.guide_brief_section = guideIndex >= 0;
    summary.guide_brief_version_v0_2 =
      typeof rendered === "string" && rendered.includes("guide_brief.v0.2");
    summary.task_context_packet_section = packetIndex >= 0;
    summary.guide_before_task_context_packet =
      guideIndex >= 0 && packetIndex > guideIndex;
    summary.guide_non_authority_statement =
      typeof rendered === "string" &&
      rendered.includes(
        "It is not the execution contract and does not override the TaskContextPacket",
      );
    summary.unresolved_judgment_remains_unresolved =
      typeof rendered === "string" &&
      rendered.includes("Unresolved judgment remains unresolved");
    summary.suggestions_are_not_commands =
      typeof rendered === "string" &&
      rendered.includes("suggestions are not commands");
    summary.repository_validation_discovery_statement =
      typeof rendered === "string" &&
      rendered.includes(
        "Run relevant repository-provided validation when present; do not replace it with an ad hoc substitute.",
      ) &&
      rendered.includes(
        "An empty required_checks list does not waive this discovery step or authorize inventing a check.",
      );
    summary.guide_grants_approval =
      typeof rendered === "string" && /"can_approve":true/u.test(rendered);
    summary.packet_fingerprint = packetFingerprint;
    summary.packet_payload_sha256 = packetText
      ? `sha256:${createHash("sha256").update(packetText).digest("hex")}`
      : null;
  }
  return summary;
}

function waitForRelease() {
  trace("release_wait_enter", {
    configured: Boolean(releasePath),
    already_released: Boolean(releasePath && existsSync(releasePath)),
  });
  if (!releasePath || existsSync(releasePath)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      watcher.close();
      if (error) {
        trace("release_wait_timeout", {});
        reject(error);
      } else {
        trace("release_wait_released", {});
        resolve();
      }
    };
    const timeout = setTimeout(() => {
      finish(new Error("release_barrier_timeout"));
    }, 10_000);
    const watcher = watch(path.dirname(releasePath), () => {
      if (!existsSync(releasePath)) return;
      finish();
    });
    trace("release_wait_registered", {});
    // Close the gap between the first existence check and watcher
    // registration so a fast controller release cannot be missed.
    if (existsSync(releasePath)) finish();
  });
}

function waitForApprovalResolutionObservation(expectedCount) {
  if (!approvalResolutionBarrierPath) {
    return Promise.reject(new Error("approval_resolution_barrier_missing"));
  }
  if (readBarrierCount() >= expectedCount) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    let poll = null;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (poll !== null) clearInterval(poll);
      if (error) reject(error);
      else resolve();
    };
    const timeout = setTimeout(() => {
      finish(new Error("approval_resolution_barrier_timeout"));
    }, 10_000);
    poll = setInterval(() => {
      if (readBarrierCount() >= expectedCount) finish();
    }, 10);
    if (readBarrierCount() >= expectedCount) finish();
  });

  function readBarrierCount() {
    if (!existsSync(approvalResolutionBarrierPath)) return 0;
    const value = Number(
      readFileSync(approvalResolutionBarrierPath, "utf8").trim(),
    );
    return Number.isSafeInteger(value) ? value : 0;
  }
}

async function waitForBrowserRelease(releaseFile, label) {
  if (!releaseFile) {
    throw new Error(`${label}_barrier_missing`);
  }
  trace("browser_release_requested", { label });
  try {
    const observed = await waitForBoundedFileSignal(releaseFile, {
      timeoutMs: browserReleaseTimeoutMs,
    });
    trace("browser_release_observed", {
      label,
      observation: observed.observation,
    });
  } catch {
    throw new Error(`${label}_barrier_timeout`);
  }
}

async function waitForCancellationApprovalResolutionRelease() {
  if (!cancellationApprovalResolutionReleasePath) {
    throw new Error("cancellation_approval_resolution_barrier_missing");
  }
  try {
    const observed = await waitForBoundedFileSignal(
      cancellationApprovalResolutionReleasePath,
      { timeoutMs: 10_000 },
    );
    trace("cancellation_approval_resolution_release_observed", {
      observation: observed.observation,
    });
  } catch {
    throw new Error("cancellation_approval_resolution_barrier_timeout");
  }
}

function installZeroNetworkGuard() {
  const refuse = () => {
    externalNetworkAttempts += 1;
    throw new Error("fake_codex_external_network_forbidden");
  };
  globalThis.fetch = refuse;
  net.connect = refuse;
  net.createConnection = refuse;
  tls.connect = refuse;
  dns.lookup = refuse;
  dns.resolve = refuse;
}

function persistNetworkCount() {
  if (!networkCountPath) return;
  writeFileSync(networkCountPath, `${externalNetworkAttempts}\n`, {
    mode: 0o600,
  });
}

function persistState(value) {
  if (!statePath) return;
  writeFileSync(statePath, JSON.stringify(value), { mode: 0o600 });
}
