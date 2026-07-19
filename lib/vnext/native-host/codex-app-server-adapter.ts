import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import path from "node:path";

import {
  NativeHostContractErrorV01,
  NativeHostReconciliationRequiredErrorV01,
  assertNativeHostPublicTextV01,
} from "@/lib/vnext/native-host/native-host-contract";
import {
  listOwnedDescendantProcessIdsV01,
  stopOwnedProcessTreeV01,
} from "@/lib/vnext/native-host/owned-process-tree";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { canonicalizeRepositoryRelativePathV01 } from "@/lib/vnext/repository-relative-path";
import {
  NATIVE_HOST_APPROVAL_VERSION_V01,
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostApprovalDecisionV01,
  type NativeHostApprovalRequestV01,
  type NativeHostArtifactV01,
  type NativeHostChangedFileV01,
  type NativeHostInvocationControlV01,
  type NativeHostInvocationV01,
  type NativeHostLifecycleEventV01,
  type NativeHostObservedCheckV01,
  type NativeHostObservedCommandV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostSkippedCheckV01,
  type NativeHostStopRequestV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const CODEX_APP_SERVER_ADAPTER_VERSION_V01 =
  "codex_app_server_adapter.v0.1" as const;
export const CODEX_APP_SERVER_CAPABILITY_VERSION_V01 =
  "codex_app_server_stable_stdio.v0.1" as const;
export const CODEX_HOST_STRUCTURED_RESULT_VERSION_V01 =
  "codex_host_structured_result.v0.1" as const;

const MAX_JSONL_LINE_BYTES = 256 * 1024;
const MAX_JSONL_BUFFER_BYTES = 512 * 1024;
const MAX_PENDING_REQUESTS = 32;
const MAX_RECENT_RESPONSES = 64;
const MAX_SERVER_REQUESTS = 8;
const MAX_RECENT_RESOLVED_SERVER_REQUESTS = 16;
const MAX_PROMPT_BYTES = 512 * 1024;
const RPC_TIMEOUT_MS = 10_000;
const APPROVAL_TTL_MS = 5 * 60 * 1_000;
const GRACEFUL_PROCESS_STOP_MS = 1_000;
const FORCED_PROCESS_STOP_MS = 2_000;

const KNOWN_IGNORED_NOTIFICATIONS = new Set([
  "account/rateLimits/updated",
  "account/updated",
  "configWarning",
  "deprecationNotice",
  "error",
  "guardianWarning",
  "item/agentMessage/delta",
  "item/autoApprovalReview/completed",
  "item/autoApprovalReview/started",
  "item/commandExecution/outputDelta",
  "item/commandExecution/terminalInteraction",
  "item/fileChange/outputDelta",
  "item/fileChange/patchUpdated",
  "item/plan/delta",
  "item/reasoning/summaryPartAdded",
  "item/reasoning/summaryTextDelta",
  "item/reasoning/textDelta",
  "model/rerouted",
  "model/safetyBuffering/updated",
  "model/verification",
  "thread/tokenUsage/updated",
  "turn/diff/updated",
  "turn/moderationMetadata",
  "turn/plan/updated",
  "warning",
]);

export interface CodexAppServerLaunchV01 {
  command: string;
  prefix_args?: string[];
  environment?: NodeJS.ProcessEnv;
}

export interface CodexAppServerAdapterObservationV01 {
  kind:
    | "invocation_created"
    | "spawned"
    | "initialized"
    | "account_available"
    | "thread_started"
    | "thread_resumed"
    | "turn_started"
    | "approval_requested"
    | "approval_resolved"
    | "server_request_state_cleared"
    | "interrupt_requested"
    | "settlement_failed"
    | "settled";
  run_id: string;
  process_id: number | null;
  thread_id: string | null;
  turn_id: string | null;
  timeout_ms: number;
  stop_settle_timeout_ms: number;
  observed_at_ms: number;
  active_server_request_count: number;
  recent_resolved_server_request_count: number;
  public_reason?: string;
}

export interface CodexAppServerAdapterOptionsV01 {
  launch?: CodexAppServerLaunchV01;
  now?: () => string;
  observe?: (observation: CodexAppServerAdapterObservationV01) => void;
}

export function createCodexAppServerAdapterV01(
  options: CodexAppServerAdapterOptionsV01 = {},
): NativeHostAdapterV01 {
  return {
    adapter_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
    capability_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
    execution_profile: "native_host_managed_model",
    provider_egress: "native_host_managed",
    invoke(request, control) {
      return new CodexAppServerInvocationV01(request, control, options).public;
    },
  };
}

export function resolveDefaultCodexAppServerLaunchV01(
  environment: NodeJS.ProcessEnv = process.env,
): CodexAppServerLaunchV01 {
  if (environment.AUGNES_CANONICAL_TEST_MODE === "1") {
    return {
      command: process.execPath,
      prefix_args: [
        path.join(process.cwd(), "scripts", "fixtures", "fake-codex-app-server.mjs"),
      ],
      environment: boundedCodexChildEnvironmentV01(environment, true),
    };
  }
  return {
    command: "codex",
    prefix_args: [],
    environment: boundedCodexChildEnvironmentV01(environment, false),
  };
}

class CodexAppServerInvocationV01 {
  readonly public: NativeHostInvocationV01;
  private readonly resultDeferred = deferredV01<NativeHostResultV01>();
  private readonly settledDeferred = deferredV01<void>();
  private readonly terminalDeferred = deferredV01<CodexTurnTerminalV01>();
  private readonly stopSignal = deferredV01<void>();
  private readonly now: () => string;
  private readonly startedAt: string;
  private transport: CodexStdioJsonRpcTransportV01 | null = null;
  private stopPromise: Promise<void> | null = null;
  private stopRequest: NativeHostStopRequestV01 | null = null;
  private threadId: string | null = null;
  private sessionId: string | null = null;
  private turnId: string | null = null;
  private connectionRef: ExternalRefV01 | null = null;
  private threadRef: ExternalRefV01 | null = null;
  private sessionRef: ExternalRefV01 | null = null;
  private turnRef: ExternalRefV01 | null = null;
  private cliVersion = "unknown";
  private threadStartSent = false;
  private turnStartSent = false;
  private packetDeliveryInitiated = false;
  private terminalObserved: CodexTurnTerminalV01 | null = null;
  private cleanupSettled = false;
  private fatalError: Error | null = null;
  private readonly observedCommands: NativeHostObservedCommandV01[] = [];
  private readonly observedChangedFiles: NativeHostChangedFileV01[] = [];
  private readonly observedActions: string[] = [];
  private readonly completedMessageFingerprints = new Map<string, string>();
  private readonly activeServerRequests = new Map<
    string,
    ActiveCodexServerRequestV01
  >();
  private readonly recentResolvedServerRequests = new Map<
    string,
    ResolvedCodexServerRequestV01
  >();

  constructor(
    private readonly request: NativeHostRequestV01,
    private readonly control: NativeHostInvocationControlV01,
    private readonly options: CodexAppServerAdapterOptionsV01,
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.startedAt = this.now();
    this.public = {
      result: this.resultDeferred.promise,
      settled: this.settledDeferred.promise,
      request_stop: (stopRequest) => this.requestStop(stopRequest),
    };
    this.observe("invocation_created");
    void this.execute().catch((error: unknown) => {
      this.resultDeferred.reject(asErrorV01(error));
      this.settledDeferred.reject(asErrorV01(error));
    });
  }

  private async execute(): Promise<void> {
    let cleanupError: Error | null = null;
    try {
      await this.startTransport();
      await this.initializeAndCheckAccount();
      if (this.control.resume_binding) await this.resumeKnownTurn();
      else await this.startNewThreadAndTurn();

      const terminalOrDisconnect = await Promise.race([
        this.terminalDeferred.promise.then((terminal) => ({
          kind: "terminal" as const,
          terminal,
        })),
        this.transport!.closed.then((closed) => ({
          kind: "disconnect" as const,
          closed,
        })),
      ]);
      // JSONL dispatch deliberately avoids blocking the stdout reader. Let
      // notification/server-request rejection handlers run before accepting a
      // terminal message that may have been followed by conflicting material
      // in the same chunk.
      await Promise.resolve();
      if (this.transport!.failure) throw this.transport!.failure;
      if (terminalOrDisconnect.kind === "disconnect") {
        if (this.terminalObserved) {
          await this.finishFromTerminal(this.terminalObserved);
          return;
        }
        throw this.reconciliationError("codex_transport_disconnected");
      }
      this.terminalObserved = terminalOrDisconnect.terminal;
      await this.finishFromTerminal(terminalOrDisconnect.terminal);
    } catch (error) {
      const normalized = asErrorV01(error);
      this.fatalError = normalized;
      if (normalized instanceof NativeHostReconciliationRequiredErrorV01) {
        await this.reportLifecycle({
          event_kind: "reconciliation_required",
          state: "paused",
          coverage: "observed",
          host_refs: this.currentHostRefs(),
          bounded_metadata: { reason: normalized.code },
        }).catch(() => undefined);
        this.resultDeferred.reject(normalized);
      } else if (isCapabilityUnavailableV01(normalized) && !this.threadStartSent) {
        this.resultDeferred.resolve(
          this.buildBoundaryResult("unavailable", publicErrorCodeV01(normalized)),
        );
      } else if (this.terminalObserved) {
        // The host turn is definitely terminal. A malformed or missing bounded
        // result is a truthful failed completion, not an indeterminate live run.
        this.resultDeferred.resolve(
          this.buildBoundaryResult("failed", publicErrorCodeV01(normalized)),
        );
      } else if (this.threadStartSent || this.turnStartSent) {
        const reconciliation = this.reconciliationError(
          publicErrorCodeV01(normalized),
        );
        await this.reportLifecycle({
          event_kind: "reconciliation_required",
          state: "paused",
          coverage: "observed",
          host_refs: this.currentHostRefs(),
          bounded_metadata: { reason: reconciliation.code },
        }).catch(() => undefined);
        this.resultDeferred.reject(reconciliation);
      } else {
        this.resultDeferred.resolve(
          this.buildBoundaryResult("failed", publicErrorCodeV01(normalized)),
        );
      }
    } finally {
      try {
        await this.cleanupTransport();
      } catch (error) {
        cleanupError = asErrorV01(error);
        this.observe(
          "settlement_failed",
          publicCleanupDiagnosticCodeV01(cleanupError),
        );
      }
      this.cleanupSettled = cleanupError === null;
      this.observe("settled");
      if (cleanupError) this.settledDeferred.reject(cleanupError);
      else this.settledDeferred.resolve();
    }
  }

  private async startTransport(): Promise<void> {
    const launch = this.options.launch ?? resolveDefaultCodexAppServerLaunchV01();
    this.transport = new CodexStdioJsonRpcTransportV01({
      command: launch.command,
      args: [...(launch.prefix_args ?? []), "app-server", "--stdio"],
      cwd: this.request.root_scope.canonical_root,
      environment:
        launch.environment ?? boundedCodexChildEnvironmentV01(process.env, false),
      onNotification: (method, params) => this.onNotification(method, params),
      onServerRequest: (id, method, params) =>
        this.onServerRequest(id, method, params),
    });
    await this.transport.started;
    const observedAt = this.now();
    this.connectionRef = externalRefV01(
      "host_connection",
      `connection:${randomUUID()}`,
      observedAt,
      "direct_local_observation",
    );
    await this.reportLifecycle({
      event_kind: "process_started",
      state: "starting",
      coverage: "observed",
      host_refs: [this.connectionRef],
      bounded_metadata: { transport: "stdio_jsonl", experimental_api: false },
    });
    this.observe("spawned");
  }

  private async initializeAndCheckAccount(): Promise<void> {
    const initialized = objectV01(
      await this.transport!.request("initialize", {
        clientInfo: {
          name: "augnes",
          title: "Augnes",
          version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
        },
        capabilities: null,
      }),
      "codex_initialize_response_invalid",
    );
    this.cliVersion = publicCliVersionV01(initialized.userAgent);
    this.transport!.notify("initialized", {});
    this.observe("initialized");

    const account = objectV01(
      await this.transport!.request("account/read", { refreshToken: false }),
      "codex_account_response_invalid",
    );
    if (account.account === null && account.requiresOpenaiAuth === true) {
      throw new CodexCapabilityErrorV01("codex_not_authenticated");
    }
    if (account.account === null || typeof account.account !== "object") {
      throw new CodexCapabilityErrorV01("codex_account_state_unsupported");
    }
    await this.reportLifecycle({
      event_kind: "capability_confirmed",
      state: "starting",
      coverage: "observed",
      host_refs: this.connectionRef ? [this.connectionRef] : [],
      bounded_metadata: {
        adapter_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
        capability_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
        cli_version: this.cliVersion,
      },
    });
    this.observe("account_available");
  }

  private async startNewThreadAndTurn(): Promise<void> {
    this.threadStartSent = true;
    const response = objectV01(
      await this.transport!.request("thread/start", {
        cwd: this.request.root_scope.canonical_root,
        approvalPolicy: "on-request",
        approvalsReviewer: "user",
        sandbox: "workspace-write",
        ephemeral: false,
      }),
      "codex_thread_start_response_invalid",
    );
    await this.bindThreadResponse(response, "thread_started");
    this.observe("thread_started");
    await this.startTurn();
  }

  private async resumeKnownTurn(): Promise<void> {
    const resume = this.control.resume_binding!;
    this.threadId = resume.host_thread_ref.external_id;
    this.turnId = resume.host_turn_ref.external_id;
    this.sessionId = resume.host_session_ref?.external_id ?? null;
    this.threadRef = resume.host_thread_ref;
    this.sessionRef = resume.host_session_ref;
    this.turnRef = resume.host_turn_ref;
    const read = objectV01(
      await this.transport!.request("thread/read", {
        threadId: this.threadId,
        includeTurns: true,
      }),
      "codex_thread_read_response_invalid",
    );
    const readTurn = this.assertKnownTurnSet(
      this.assertKnownThread(read.thread, true),
    );
    const readStatus = stringV01(readTurn.status);
    if (["completed", "failed", "interrupted"].includes(readStatus ?? "")) {
      await this.reportLifecycle({
        event_kind: "thread_bound",
        state: "starting",
        coverage: "observed",
        host_refs: this.currentHostRefs(),
        bounded_metadata: { resumed: true, terminal_read: true },
      });
      this.resolveTerminalFromTurn(readTurn);
      this.observe("thread_resumed");
      return;
    }
    if (readStatus !== "inProgress") {
      throw this.reconciliationError("codex_resume_turn_state_unsupported");
    }
    const response = objectV01(
      await this.transport!.request("thread/resume", {
        threadId: this.threadId,
        cwd: this.request.root_scope.canonical_root,
        approvalPolicy: "on-request",
        approvalsReviewer: "user",
        sandbox: "workspace-write",
      }),
      "codex_thread_resume_response_invalid",
    );
    await this.bindThreadResponse(response, "thread_resumed", true);
    const thread = objectV01(response.thread, "codex_thread_resume_binding_invalid");
    const matchingTurn = this.assertKnownTurnSet(thread);
    const status = stringV01(matchingTurn.status);
    if (["completed", "failed", "interrupted"].includes(status ?? "")) {
      this.resolveTerminalFromTurn(matchingTurn);
    } else if (status !== "inProgress") {
      throw this.reconciliationError("codex_resume_turn_state_unsupported");
    } else {
      await this.reportLifecycle({
        event_kind: "turn_started",
        state: "running",
        coverage: "observed",
        host_refs: this.currentHostRefs(),
        bounded_metadata: { resumed: true },
      });
    }
    this.observe("thread_resumed");
  }

  private async bindThreadResponse(
    response: Record<string, unknown>,
    source: "thread_started" | "thread_resumed",
    existing = false,
  ): Promise<void> {
    const thread = this.assertKnownThread(response.thread, existing);
    const cwd = stringV01(response.cwd) ?? stringV01(thread.cwd);
    if (!cwd || !sameCanonicalRootV01(this.request.root_scope.canonical_root, cwd)) {
      throw this.reconciliationError("codex_thread_root_mismatch");
    }
    const threadId = requiredOpaqueIdV01(thread.id, "codex_thread_id_invalid");
    const sessionId = requiredOpaqueIdV01(
      thread.sessionId,
      "codex_session_id_invalid",
    );
    if (
      existing &&
      (threadId !== this.threadId ||
        (this.sessionId !== null && sessionId !== this.sessionId))
    ) {
      throw this.reconciliationError("codex_thread_resume_identity_mismatch");
    }
    this.threadId = threadId;
    this.sessionId = sessionId;
    const observedAt = this.now();
    this.threadRef = externalRefV01(
      "host_thread",
      threadId,
      observedAt,
      "direct_local_observation",
    );
    this.sessionRef = externalRefV01(
      "host_session",
      sessionId,
      observedAt,
      "direct_local_observation",
    );
    await this.reportLifecycle({
      event_kind: "thread_bound",
      state: "starting",
      coverage: "observed",
      host_refs: this.currentHostRefs(),
      bounded_metadata: { resumed: source === "thread_resumed" },
    });
  }

  private assertKnownThread(value: unknown, existing: boolean): Record<string, unknown> {
    const thread = objectV01(value, "codex_thread_binding_invalid");
    const threadId = requiredOpaqueIdV01(thread.id, "codex_thread_id_invalid");
    if (existing && this.threadId && threadId !== this.threadId) {
      throw this.reconciliationError("codex_thread_identity_mismatch");
    }
    if (existing && this.sessionId) {
      const sessionId = requiredOpaqueIdV01(
        thread.sessionId,
        "codex_session_id_invalid",
      );
      if (sessionId !== this.sessionId) {
        throw this.reconciliationError("codex_session_identity_mismatch");
      }
    }
    const cwd = stringV01(thread.cwd);
    if (cwd && !sameCanonicalRootV01(this.request.root_scope.canonical_root, cwd)) {
      throw this.reconciliationError("codex_thread_root_mismatch");
    }
    return thread;
  }

  private assertKnownTurnSet(
    thread: Record<string, unknown>,
  ): Record<string, unknown> {
    const turns = Array.isArray(thread.turns) ? thread.turns : [];
    const matching = turns.filter(
      (turn) => isObjectV01(turn) && turn.id === this.turnId,
    );
    if (matching.length !== 1) {
      throw this.reconciliationError("codex_resume_turn_missing_or_duplicate");
    }
    const conflictingActive = turns.some(
      (turn) =>
        isObjectV01(turn) &&
        turn.id !== this.turnId &&
        turn.status === "inProgress",
    );
    if (conflictingActive) {
      throw this.reconciliationError("codex_resume_conflicting_active_turn");
    }
    return matching[0] as Record<string, unknown>;
  }

  private async startTurn(): Promise<void> {
    const renderedPacket = renderPacketV01(this.request);
    this.packetDeliveryInitiated = true;
    this.turnStartSent = true;
    const response = objectV01(
      await this.transport!.request("turn/start", {
        threadId: this.threadId,
        clientUserMessageId: this.request.request_id,
        input: [{ type: "text", text: renderedPacket, text_elements: [] }],
        cwd: this.request.root_scope.canonical_root,
        approvalPolicy: "on-request",
        approvalsReviewer: "user",
        sandboxPolicy: {
          type: "workspaceWrite",
          writableRoots: [this.request.root_scope.canonical_root],
          networkAccess: false,
          excludeTmpdirEnvVar: true,
          excludeSlashTmp: true,
        },
        outputSchema: CODEX_HOST_STRUCTURED_RESULT_SCHEMA_V01,
      }),
      "codex_turn_start_response_invalid",
    );
    const turn = objectV01(response.turn, "codex_turn_start_binding_invalid");
    const turnId = requiredOpaqueIdV01(turn.id, "codex_turn_id_invalid");
    if (this.turnId && this.turnId !== turnId) {
      throw this.reconciliationError("codex_turn_identity_mismatch");
    }
    if (!this.turnId) {
      this.turnId = turnId;
      this.turnRef = externalRefV01(
        "host_turn",
        turnId,
        this.now(),
        "direct_local_observation",
      );
    }
    await this.reportLifecycle({
      event_kind: "turn_started",
      state: "running",
      coverage: "observed",
      host_refs: this.currentHostRefs(),
      bounded_metadata: {
        packet_delivery_initiated: true,
        structured_output_required: true,
      },
    });
    this.observe("turn_started");
  }

  private async onNotification(method: string, params: unknown): Promise<void> {
    const value = objectV01(params, "codex_notification_params_invalid");
    this.assertNotificationBinding(value);
    if (method === "turn/started") {
      const turn = objectV01(value.turn, "codex_turn_started_invalid");
      this.assertTurnIdentity(turn.id);
      await this.reportLifecycle({
        event_kind: "turn_started",
        state: "running",
        coverage: "observed",
        host_refs: this.currentHostRefs(),
        bounded_metadata: { host_notification: true },
      });
      return;
    }
    if (method === "turn/completed") {
      this.resolveTerminalFromTurn(value.turn);
      return;
    }
    if (method === "thread/status/changed") {
      const status = objectV01(
        value.status,
        "codex_thread_status_invalid",
      );
      const statusType = requiredStringV01(
        status.type,
        "codex_thread_status_invalid",
      );
      const state = ["active", "idle"].includes(statusType)
        ? "running"
        : "paused";
      await this.reportLifecycle({
        event_kind:
          state === "paused"
            ? "reconciliation_required"
            : "thread_status_changed",
        state,
        coverage: "host_attested",
        host_refs: this.currentHostRefs(),
        bounded_metadata: {
          thread_status: publicTextV01(statusType, 64),
          ...(state === "paused"
            ? { reason: "codex_thread_status_unsupported" }
            : {}),
        },
      });
      if (state === "paused") {
        throw this.reconciliationError("codex_thread_status_unsupported");
      }
      return;
    }
    if (method === "thread/started") {
      return;
    }
    if (method === "item/started" || method === "item/completed") {
      this.observeItem(value.item, method === "item/completed", value);
      return;
    }
    if (method === "serverRequest/resolved") {
      const requestId = requestIdStringV01(value.requestId);
      if (!requestId) {
        throw this.reconciliationError("codex_server_request_resolution_mismatch");
      }
      const resolutionFingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01({ method, params: value }),
      );
      const resolved = this.recentResolvedServerRequests.get(requestId);
      if (resolved) {
        throw this.reconciliationError(
          resolved.resolution_fingerprint === resolutionFingerprint
            ? "codex_server_request_resolution_duplicate"
            : "codex_server_request_resolution_conflict",
        );
      }
      const active = this.activeServerRequests.get(requestId);
      if (
        !active ||
        !active.decision_fingerprint ||
        active.run_id !== this.request.run_id ||
        active.thread_id !== this.threadId ||
        active.turn_id !== this.turnId
      ) {
        throw this.reconciliationError("codex_server_request_resolution_mismatch");
      }
      await this.reportLifecycle({
        event_kind: "approval_resolved",
        state: "running",
        coverage: "observed",
        host_refs: this.currentHostRefs(),
        bounded_metadata: {
          approval_id: active.approval_id,
          approval_fingerprint: active.approval_fingerprint,
        },
      });
      this.activeServerRequests.delete(requestId);
      this.recentResolvedServerRequests.set(requestId, {
        request_fingerprint: active.request_fingerprint,
        resolution_fingerprint: resolutionFingerprint,
        approval_id: active.approval_id,
        approval_fingerprint: active.approval_fingerprint,
        decision_fingerprint: active.decision_fingerprint,
      });
      while (
        this.recentResolvedServerRequests.size >
        MAX_RECENT_RESOLVED_SERVER_REQUESTS
      ) {
        this.recentResolvedServerRequests.delete(
          this.recentResolvedServerRequests.keys().next().value!,
        );
      }
      this.observe("approval_resolved");
      return;
    }
    if (KNOWN_IGNORED_NOTIFICATIONS.has(method)) return;
    throw new CodexProtocolErrorV01("codex_notification_method_unsupported");
  }

  private async onServerRequest(
    id: string | number,
    method: string,
    params: unknown,
  ): Promise<unknown> {
    if (
      ![
        "item/commandExecution/requestApproval",
        "item/fileChange/requestApproval",
        "item/permissions/requestApproval",
      ].includes(method)
    ) {
      throw new CodexProtocolErrorV01("codex_server_request_method_unsupported");
    }
    const requestId = requestIdStringV01(id);
    if (!requestId) throw new CodexProtocolErrorV01("codex_server_request_id_invalid");
    const fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({ method, params }),
    );
    const resolved = this.recentResolvedServerRequests.get(requestId);
    if (resolved) {
      throw new CodexProtocolErrorV01(
        resolved.request_fingerprint === fingerprint
          ? "codex_server_request_duplicate_resolved"
          : "codex_server_request_resolved_conflict",
      );
    }
    const existing = this.activeServerRequests.get(requestId);
    if (existing && existing.request_fingerprint !== fingerprint) {
      throw new CodexProtocolErrorV01("codex_server_request_conflict");
    }
    if (existing?.request_fingerprint === fingerprint) {
      throw new CodexProtocolErrorV01("codex_server_request_duplicate_active");
    }
    if (this.activeServerRequests.size >= MAX_SERVER_REQUESTS) {
      throw new CodexProtocolErrorV01("codex_server_request_bound_exceeded");
    }
    const approval = this.normalizeApproval(method, requestId, params);
    const active: ActiveCodexServerRequestV01 = {
      request_fingerprint: fingerprint,
      approval_id: approval.approval_id,
      approval_fingerprint: approval.idempotency_fingerprint,
      decision_fingerprint: null,
      run_id: this.request.run_id,
      thread_id: this.threadId!,
      turn_id: this.turnId!,
    };
    this.activeServerRequests.set(requestId, active);
    // A server request can arrive in the same stdout chunk as turn/start's
    // response, before that response continuation has projected the turn into
    // the durable ledger. Admit the already adapter-validated turn binding
    // first so Core never accepts an approval against an unbound turn.
    await this.reportLifecycle({
      event_kind: "turn_started",
      state: "running",
      coverage: "observed",
      host_refs: this.currentHostRefs(),
      bounded_metadata: { approval_gate_observed: true },
    });
    this.observe("approval_requested");
    const decision = await this.awaitApprovalDecision(approval);
    active.decision_fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        approval_id: decision.approval_id,
        idempotency_fingerprint: decision.idempotency_fingerprint,
        decision: decision.decision,
        decision_source: decision.decision_source,
        control_revision: decision.control_revision,
      }),
    );
    if (method === "item/permissions/requestApproval") {
      if (
        decision.decision === "approve_once" &&
        approval.available_decisions.includes("approve_once")
      ) {
        const source = objectV01(params, "codex_permission_request_invalid");
        return {
          permissions: normalizeGrantedPermissionsV01(
            this.request,
            source.permissions,
          ),
          scope: "turn",
          strictAutoReview: false,
        };
      }
      return { permissions: {}, scope: "turn", strictAutoReview: false };
    }
    return {
      decision:
        decision.decision === "approve_once"
          ? "accept"
          : decision.decision === "decline"
            ? "decline"
            : "cancel",
    };
  }

  private normalizeApproval(
    method: string,
    requestId: string,
    params: unknown,
  ): NativeHostApprovalRequestV01 {
    const source = objectV01(params, "codex_approval_request_invalid");
    this.assertThreadIdentity(source.threadId);
    this.assertTurnIdentity(source.turnId);
    const itemId = requiredOpaqueIdV01(source.itemId, "codex_approval_item_invalid");
    const observedAt = this.now();
    const itemRef = externalRefV01(
      "host_item",
      itemId,
      observedAt,
      "direct_local_observation",
    );
    const requestRef = externalRefV01(
      "host_approval_request",
      requestId,
      observedAt,
      "direct_local_observation",
    );
    let operation: NativeHostApprovalRequestV01["operation_class"];
    let paths: string[] = [];
    let resources: string[] = [];
    let commandSummary: string | null = null;
    let commandFingerprint: string | null = null;
    let resourceSummary: string;
    let available: NativeHostApprovalRequestV01["available_decisions"] = [
      "approve_once",
      "decline",
      "cancel_run",
    ];

    if (method === "item/commandExecution/requestApproval") {
      const cwd = stringV01(source.cwd);
      if (cwd) paths = relativeScopeForHostPathV01(this.request, cwd);
      const command = stringV01(source.command);
      commandSummary = command ? publicSafeCommandSummaryV01(command) : null;
      commandFingerprint = command
        ? createProtocolSha256V01(command)
        : null;
      const network = isObjectV01(source.networkApprovalContext)
        ? source.networkApprovalContext
        : null;
      if (network) {
        const host = canonicalNetworkHostV01(network.host);
        const protocol = canonicalNetworkProtocolV01(network.protocol);
        resources = [`${protocol}://${host}`];
        operation = "network_permission";
        resourceSummary = `Network access to ${resources[0]}.`;
      } else {
        operation = "command_execution";
        resourceSummary = paths.length
          ? `Command scoped to ${paths.join(", ")}.`
          : "Command scoped to the selected project root.";
      }
    } else if (method === "item/fileChange/requestApproval") {
      operation = "file_change";
      const grantRoot = stringV01(source.grantRoot);
      if (grantRoot) paths = relativeScopeForHostPathV01(this.request, grantRoot);
      resourceSummary = paths.length
        ? `File change under ${paths.join(", ")}.`
        : "File change under the selected project root.";
    } else {
      const cwd = stringV01(source.cwd);
      if (!cwd) throw new CodexProtocolErrorV01("codex_permission_cwd_missing");
      paths = relativeScopeForHostPathV01(this.request, cwd);
      const permissions = objectV01(
        source.permissions,
        "codex_permission_profile_invalid",
      );
      const network = isObjectV01(permissions.network)
        ? permissions.network
        : null;
      if (network?.enabled === true) {
        operation = "network_permission";
        resourceSummary =
          "Network permission requested without an exact destination in the stable payload.";
        available = ["decline", "cancel_run"];
      } else {
        operation = "filesystem_permission";
        paths = uniqueSortedV01([
          ...paths,
          ...repositoryPathsFromPermissionProfileV01(this.request, permissions),
        ]);
        resourceSummary = paths.length
          ? `Filesystem permission for ${paths.join(", ")}.`
          : "Filesystem permission for the selected project root.";
      }
    }

    const reason = publicTextV01(
      stringV01(source.reason) ?? "The native host requested permission to continue.",
      512,
    );
    const material = {
      workspace_id: this.request.workspace_id,
      project_id: this.request.project_id,
      run_id: this.request.run_id,
      packet_id: this.request.packet.packet_id,
      packet_fingerprint: this.request.packet.integrity.fingerprint,
      thread_id: this.threadId,
      turn_id: this.turnId,
      item_id: itemId,
      request_id: requestId,
      operation,
      paths,
      resources,
      command_fingerprint: commandFingerprint,
      public_reason: reason,
      resource_summary: resourceSummary,
    };
    const idempotencyFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    );
    const approval: NativeHostApprovalRequestV01 = {
      approval_version: NATIVE_HOST_APPROVAL_VERSION_V01,
      approval_id: `native-host-approval:${idempotencyFingerprint.slice(-24)}`,
      idempotency_fingerprint: idempotencyFingerprint,
      workspace_id: this.request.workspace_id,
      project_id: this.request.project_id,
      run_id: this.request.run_id,
      packet_id: this.request.packet.packet_id,
      packet_fingerprint: this.request.packet.integrity.fingerprint,
      host_thread_ref: this.threadRef!,
      host_turn_ref: this.turnRef!,
      host_item_ref: itemRef,
      host_request_ref: requestRef,
      operation_class: operation,
      repository_relative_paths: paths,
      network_resources: resources,
      command_summary: commandSummary,
      command_fingerprint: commandFingerprint,
      resource_summary: publicTextV01(resourceSummary, 512),
      public_reason: reason,
      public_risk_summary: riskSummaryV01(operation),
      budget_impact: null,
      available_decisions: available,
      issued_at: observedAt,
      expires_at: new Date(Date.parse(observedAt) + APPROVAL_TTL_MS).toISOString(),
      coverage: "observed",
    };
    return approval;
  }

  private async awaitApprovalDecision(
    approval: NativeHostApprovalRequestV01,
  ): Promise<NativeHostApprovalDecisionV01> {
    const sink = this.control.lifecycle_sink;
    if (!sink) {
      return {
        approval_id: approval.approval_id,
        idempotency_fingerprint: approval.idempotency_fingerprint,
        decision: "decline",
        decision_source: "run_cancellation",
        decided_at: this.now(),
        control_revision: 0,
      };
    }
    const cancelled = this.stopSignal.promise.then(
      (): NativeHostApprovalDecisionV01 => ({
        approval_id: approval.approval_id,
        idempotency_fingerprint: approval.idempotency_fingerprint,
        decision: "cancel_run",
        decision_source: "run_cancellation",
        decided_at: this.now(),
        control_revision: 0,
      }),
    );
    const decision = await Promise.race([
      sink.request_approval(approval),
      cancelled,
    ]);
    if (
      decision.approval_id !== approval.approval_id ||
      decision.idempotency_fingerprint !== approval.idempotency_fingerprint ||
      !approval.available_decisions.includes(decision.decision)
    ) {
      throw new CodexProtocolErrorV01("codex_approval_decision_invalid");
    }
    return decision;
  }

  private observeItem(
    itemValue: unknown,
    completed: boolean,
    envelope: Record<string, unknown>,
  ): void {
    const item = objectV01(itemValue, "codex_item_invalid");
    const itemId = requiredOpaqueIdV01(item.id, "codex_item_id_invalid");
    const fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(minimizedItemFingerprintMaterialV01(item)),
    );
    const key = `${completed ? "completed" : "started"}:${itemId}`;
    const existing = this.completedMessageFingerprints.get(key);
    if (existing && existing !== fingerprint) {
      throw this.reconciliationError("codex_item_event_conflict");
    }
    if (existing === fingerprint) return;
    this.completedMessageFingerprints.set(key, fingerprint);
    if (!completed) return;

    if (item.type === "commandExecution") {
      const command = stringV01(item.command) ?? "";
      const cwd = stringV01(item.cwd);
      if (cwd) relativeScopeForHostPathV01(this.request, cwd);
      this.observedCommands.push({
        command_id: itemId,
        summary: publicSafeCommandSummaryV01(command),
        command_fingerprint: createProtocolSha256V01(command),
        started_at: millisTimestampV01(envelope.startedAtMs),
        finished_at: millisTimestampV01(envelope.completedAtMs) ?? this.now(),
        exit_code: Number.isSafeInteger(item.exitCode) ? Number(item.exitCode) : null,
        status:
          item.status === "completed"
            ? "completed"
            : item.status === "failed"
              ? "failed"
              : item.status === "declined"
                ? "blocked"
                : "unknown",
      });
      this.observedActions.push("host_command_item_completed");
    }
    if (item.type === "fileChange" && Array.isArray(item.changes)) {
      for (const change of item.changes.slice(0, this.request.policy.max_changed_files)) {
        if (!isObjectV01(change)) continue;
        const relative = canonicalizeRepositoryRelativePathV01(
          requiredStringV01(change.path, "codex_file_change_path_invalid"),
        );
        this.observedChangedFiles.push({
          repository_relative_path: relative,
          change_kind: changeKindV01(change.kind),
          before_hash: null,
          after_hash: null,
        });
      }
      this.observedActions.push("host_file_change_item_completed");
    }
  }

  private resolveTerminalFromTurn(value: unknown): void {
    const turn = objectV01(value, "codex_turn_completed_invalid");
    this.assertTurnIdentity(turn.id);
    const status = stringV01(turn.status);
    if (!status || !["completed", "failed", "interrupted"].includes(status)) {
      throw this.reconciliationError("codex_turn_terminal_status_invalid");
    }
    const fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(minimizedTurnTerminalMaterialV01(turn)),
    );
    if (this.terminalObserved) {
      if (this.terminalObserved.fingerprint !== fingerprint) {
        throw this.reconciliationError("codex_turn_completion_conflict");
      }
      return;
    }
    const terminal = { turn, status, fingerprint } as CodexTurnTerminalV01;
    this.terminalObserved = terminal;
    this.terminalDeferred.resolve(terminal);
  }

  private async finishFromTerminal(terminal: CodexTurnTerminalV01): Promise<void> {
    if (terminal.status === "completed") {
      const payload = parseStructuredResultFromTurnV01(
        terminal.turn,
        this.request.result_return.max_result_bytes,
      );
      this.resultDeferred.resolve(this.buildCompletedResult(payload));
      return;
    }
    if (terminal.status === "interrupted") {
      this.resultDeferred.resolve(
        this.buildBoundaryResult(
          "cancelled",
          this.stopRequest?.reason === "timeout"
            ? "native_host_timeout"
            : "native_host_cancelled",
        ),
      );
      return;
    }
    this.resultDeferred.resolve(
      this.buildBoundaryResult("failed", "codex_turn_failed"),
    );
  }

  private buildCompletedResult(
    payload: CodexHostStructuredResultV01,
  ): NativeHostResultV01 {
    const finishedAt = this.now();
    const changedFiles = uniqueChangedFilesV01([
      ...this.observedChangedFiles,
      ...payload.changed_files,
    ]).slice(0, this.request.policy.max_changed_files);
    const checks = uniqueChecksV01([
      {
        check_id: "validated_packet_delivery",
        required: true,
        status: "passed",
        summary:
          "The exact admitted packet was delivered through the bounded App Server turn input.",
      },
      ...payload.checks,
    ]).slice(0, this.request.policy.max_checks);
    const returnedCheckIds = new Set([
      ...checks.map((check) => check.check_id),
      ...payload.skipped_checks.map((check) => check.check_id),
    ]);
    const skippedChecks = [
      ...payload.skipped_checks,
      ...this.request.packet.constraints.required_checks
        .filter((checkId) => !returnedCheckIds.has(checkId))
        .map((checkId) => ({
          check_id: checkId,
          required: true,
          reason:
            "The native host did not return a bounded status for this required check.",
        })),
    ].slice(0, this.request.policy.max_checks);
    return {
      result_version: NATIVE_HOST_RESULT_VERSION_V01,
      request_id: this.request.request_id,
      run_id: this.request.run_id,
      outcome: "completed",
      public_stop_reason: null,
      started_at: this.startedAt,
      finished_at: finishedAt,
      host_refs: this.currentHostRefs(),
      adapter_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
      capability_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
      changed_files: changedFiles,
      artifacts: payload.artifacts,
      observed_actions: uniqueSortedV01([
        "validated_packet_delivered_to_native_host",
        "structured_app_server_turn_completed",
        ...this.observedActions,
        ...payload.observed_actions,
      ]).slice(0, 64),
      commands: mergeCommandsV01(this.observedCommands, payload.commands).slice(
        0,
        this.request.policy.max_commands,
      ),
      checks,
      skipped_checks: skippedChecks,
      model_invocation_receipt_refs: [],
      summary: payload.summary,
      uncertainty: payload.uncertainty,
      gaps: payload.gaps,
      proposed_next_steps: payload.proposed_next_steps,
      capability_coverage: [
        {
          capability: "validated_packet_delivery",
          coverage: "observed",
          source_ref: this.request.task_context_packet_ref,
          notes: [
            "Augnes rendered and delivered the exact admitted packet to the configured native host.",
          ],
        },
        {
          capability: "codex_thread_turn_lifecycle",
          coverage: "observed",
          source_ref: this.turnRef,
          notes: ["Stable App Server thread and turn identifiers were observed."],
        },
        {
          capability: "repository_actions_and_checks",
          coverage: "host_attested",
          source_ref: this.turnRef,
          notes: [
            "Commands, changes, and checks are host-attested unless independently observed by Augnes.",
          ],
        },
        {
          capability: "native_host_internal_model_activity",
          coverage: "unsupported",
          source_ref: null,
          notes: [
            "Native-host-internal model activity is outside Augnes-owned R4 Model Gateway coverage.",
          ],
        },
      ],
      adapter_extension: {
        extension_version: "codex_app_server_result_extension.v0.1",
        adapter_kind: "codex_app_server",
        bounded_metadata: {
          execution_kind: "live_local_app_server",
          live_host_invoked: true,
          packet_delivery_initiated: this.packetDeliveryInitiated,
          app_server_transport: "stdio_jsonl",
          experimental_api: false,
          cli_version: this.cliVersion,
          raw_provider_payload_included: false,
        },
      },
    };
  }

  private buildBoundaryResult(
    outcome: "failed" | "cancelled" | "unavailable",
    reason: string,
  ): NativeHostResultV01 {
    const finishedAt = this.now();
    return {
      result_version: NATIVE_HOST_RESULT_VERSION_V01,
      request_id: this.request.request_id,
      run_id: this.request.run_id,
      outcome,
      public_stop_reason: reason,
      started_at: this.startedAt,
      finished_at: finishedAt,
      host_refs: this.currentHostRefs(),
      adapter_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
      capability_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
      changed_files: [],
      artifacts: [],
      observed_actions: ["codex_app_server_boundary_result"],
      commands: this.observedCommands.slice(0, this.request.policy.max_commands),
      checks: this.packetDeliveryInitiated
        ? [
            {
              check_id: "validated_packet_delivery",
              required: true,
              status: "passed",
              summary:
                "The exact admitted packet was delivered before the bounded terminal failure.",
            },
          ]
        : [],
      skipped_checks: [
        ...(!this.packetDeliveryInitiated
          ? [
              {
                check_id: "validated_packet_delivery",
                required: true,
                reason: `Packet delivery did not complete because ${reason}.`,
              },
            ]
          : []),
        ...this.request.packet.constraints.required_checks.map((checkId) => ({
          check_id: checkId,
          required: true,
          reason: `Check was not completed because ${reason}.`,
        })),
      ],
      model_invocation_receipt_refs: [],
      summary:
        outcome === "unavailable"
          ? "The optional local Codex App Server capability was unavailable."
          : "The local Codex App Server run did not complete successfully.",
      uncertainty: [],
      gaps: ["No successful structured Codex result was admitted."],
      proposed_next_steps: ["Review the public status before retrying."],
      capability_coverage: [
        {
          capability: "codex_app_server_lifecycle",
          coverage: "observed",
          source_ref: this.connectionRef,
          notes: [`Public-safe terminal reason: ${reason}.`],
        },
      ],
      adapter_extension: {
        extension_version: "codex_app_server_result_extension.v0.1",
        adapter_kind: "codex_app_server",
        bounded_metadata: {
          execution_kind: "live_local_app_server",
          live_host_invoked: this.transport !== null,
          packet_delivery_initiated: this.packetDeliveryInitiated,
          app_server_transport: "stdio_jsonl",
          experimental_api: false,
          cli_version: this.cliVersion,
          raw_provider_payload_included: false,
        },
      },
    };
  }

  private requestStop(request: NativeHostStopRequestV01): Promise<void> {
    if (this.stopPromise) return this.stopPromise;
    this.stopRequest = request;
    this.stopSignal.resolve();
    this.stopPromise = this.stopInvocation(request);
    return this.stopPromise;
  }

  private async stopInvocation(request: NativeHostStopRequestV01): Promise<void> {
    await this.reportLifecycle({
      event_kind: "stop_requested",
      state: "cancelling",
      coverage: "enforced",
      host_refs: this.currentHostRefs(),
      bounded_metadata: { reason: request.reason },
    }).catch(() => undefined);
    if (!this.transport || !this.threadId || !this.turnId) {
      await this.cleanupTransport();
      if (this.threadStartSent || this.turnStartSent) {
        throw this.reconciliationError("codex_interrupt_identity_unavailable");
      }
      return;
    }
    if (this.terminalObserved) {
      await this.cleanupTransport();
      return;
    }
    this.observe("interrupt_requested", request.reason);
    try {
      await this.transport.request(
        "turn/interrupt",
        { threadId: this.threadId, turnId: this.turnId },
        Math.max(100, Math.floor(this.control.stop_settle_timeout_ms / 3)),
      );
    } catch {
      await this.cleanupTransport();
      throw this.reconciliationError("codex_turn_interrupt_unconfirmed");
    }
    const terminal = await withinV01(
      this.terminalDeferred.promise,
      Math.max(100, Math.floor(this.control.stop_settle_timeout_ms / 3)),
    );
    if (!terminal || terminal.status !== "interrupted") {
      await this.cleanupTransport();
      throw this.reconciliationError("codex_turn_interrupt_unconfirmed");
    }
    this.terminalObserved = terminal;
    await this.cleanupTransport();
  }

  private async cleanupTransport(): Promise<void> {
    if (this.cleanupSettled) return;
    // Abandon any adapter-owned approval wait before transport teardown so a
    // disconnect cannot leave shutdown waiting forever on a server request.
    this.stopSignal.resolve();
    try {
      if (!this.transport) {
        this.cleanupSettled = true;
        return;
      }
      const settled = await this.transport.shutdown();
      if (!settled) {
        throw new CodexProtocolErrorV01("codex_process_tree_unsettled");
      }
      this.cleanupSettled = true;
    } finally {
      this.activeServerRequests.clear();
      this.recentResolvedServerRequests.clear();
      this.observe("server_request_state_cleared");
    }
  }

  private assertNotificationBinding(value: Record<string, unknown>): void {
    if (value.threadId !== undefined) this.assertThreadIdentity(value.threadId);
    if (value.turnId !== undefined) this.assertTurnIdentity(value.turnId);
  }

  private assertThreadIdentity(value: unknown): void {
    const observed = requiredOpaqueIdV01(value, "codex_thread_id_invalid");
    if (!this.threadId || observed !== this.threadId) {
      throw this.reconciliationError("codex_thread_identity_mismatch");
    }
  }

  private assertTurnIdentity(value: unknown): void {
    const observed = requiredOpaqueIdV01(value, "codex_turn_id_invalid");
    // App Server may emit turn/started before the turn/start response is read.
    // Bind that first observed ID only after the exact turn/start request was
    // sent, and still reject every later mismatch.
    if (!this.turnId && this.turnStartSent) {
      this.turnId = observed;
      this.turnRef = externalRefV01(
        "host_turn",
        observed,
        this.now(),
        "direct_local_observation",
      );
      return;
    }
    if (!this.turnId || observed !== this.turnId) {
      throw this.reconciliationError("codex_turn_identity_mismatch");
    }
  }

  private async reportLifecycle(
    input: Omit<NativeHostLifecycleEventV01, "event_id" | "run_id" | "observed_at">,
  ): Promise<void> {
    if (!this.control.lifecycle_sink) return;
    const observedAt = this.now();
    const eventMaterial = {
      run_id: this.request.run_id,
      event_kind: input.event_kind,
      state: input.state,
      host_refs: input.host_refs,
      bounded_metadata: input.bounded_metadata,
    };
    await this.control.lifecycle_sink.report_event({
      event_id: `native-host-event:${createHash("sha256")
        .update(canonicalizeProtocolValueV01(eventMaterial))
        .digest("hex")
        .slice(0, 24)}`,
      run_id: this.request.run_id,
      observed_at: observedAt,
      ...input,
    });
  }

  private currentHostRefs(): ExternalRefV01[] {
    return [
      this.connectionRef,
      this.threadRef,
      this.sessionRef,
      this.turnRef,
    ].filter((value): value is ExternalRefV01 => value !== null);
  }

  private reconciliationError(code: string): NativeHostReconciliationRequiredErrorV01 {
    return new NativeHostReconciliationRequiredErrorV01(code);
  }

  private observe(
    kind: CodexAppServerAdapterObservationV01["kind"],
    publicReason?: string,
  ): void {
    this.options.observe?.({
      kind,
      run_id: this.request.run_id,
      process_id: this.transport?.processId ?? null,
      thread_id: this.threadId,
      turn_id: this.turnId,
      timeout_ms: this.control.timeout_ms,
      stop_settle_timeout_ms: this.control.stop_settle_timeout_ms,
      observed_at_ms: Date.now(),
      active_server_request_count: this.activeServerRequests.size,
      recent_resolved_server_request_count:
        this.recentResolvedServerRequests.size,
      ...(publicReason ? { public_reason: publicReason } : {}),
    });
  }
}

class CodexStdioJsonRpcTransportV01 {
  readonly started: Promise<void>;
  readonly closed: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
  readonly processId: number | null;
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly startedDeferred = deferredV01<void>();
  private readonly closedDeferred = deferredV01<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>();
  private readonly pending = new Map<string, PendingRpcV01>();
  private readonly recentResponses = new Map<string, string>();
  private readonly serverTasks = new Set<Promise<void>>();
  // This is a transport-task guard. The invocation's activeServerRequests map
  // remains authoritative for the longer approval lifecycle through the
  // matching serverRequest/resolved notification.
  private inFlightServerRequestHandlerCount = 0;
  private stdoutBuffer = Buffer.alloc(0);
  private closing = false;
  private shutdownPromise: Promise<boolean> | null = null;
  private protocolFailure: Error | null = null;
  private readonly knownOwnedProcessIds = new Set<number>();
  private readonly processTreeObserver: ReturnType<typeof setInterval> | null;

  get failure(): Error | null {
    return this.protocolFailure;
  }

  constructor(
    input: {
      command: string;
      args: string[];
      cwd: string;
      environment: NodeJS.ProcessEnv;
      onNotification(method: string, params: unknown): Promise<void>;
      onServerRequest(
        id: string | number,
        method: string,
        params: unknown,
      ): Promise<unknown>;
    },
  ) {
    this.child = spawn(input.command, input.args, {
      cwd: input.cwd,
      env: input.environment,
      detached: false,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.processId = this.child.pid ?? null;
    if (this.processId) this.knownOwnedProcessIds.add(this.processId);
    this.processTreeObserver = this.processId
      ? setInterval(() => this.captureOwnedProcessTree(), 250)
      : null;
    this.processTreeObserver?.unref();
    this.started = this.startedDeferred.promise;
    this.closed = this.closedDeferred.promise;
    this.child.once("spawn", () => this.startedDeferred.resolve());
    this.child.once("error", (error) => {
      const normalized =
        (error as NodeJS.ErrnoException).code === "ENOENT"
          ? new CodexCapabilityErrorV01("codex_executable_absent")
          : new CodexCapabilityErrorV01("codex_app_server_spawn_failed");
      this.startedDeferred.reject(normalized);
      this.fail(normalized);
    });
    this.child.once("close", (code, signal) => {
      this.captureOwnedProcessTree();
      this.closedDeferred.resolve({ code, signal });
      if (!this.closing && !this.protocolFailure) {
        this.rejectPending(
          new CodexProtocolErrorV01("codex_app_server_exited_unexpectedly"),
        );
      }
    });
    this.child.stdout.on("data", (chunk: Buffer) => this.onStdout(chunk, input));
    this.child.stdout.on("error", () => {
      if (!this.closing) {
        this.fail(new CodexProtocolErrorV01("codex_transport_read_failed"));
      }
    });
    this.child.stdin.on("error", () => {
      if (this.closing) return;
      this.fail(new CodexProtocolErrorV01("codex_transport_write_failed"));
    });
    this.child.stderr.setEncoding("utf8");
    // Drain diagnostics so the child cannot block, but retain or expose none
    // of the provider-owned stderr material.
    this.child.stderr.on("data", () => undefined);
    this.child.stderr.on("error", () => {
      if (!this.closing) {
        this.fail(new CodexProtocolErrorV01("codex_transport_diagnostic_read_failed"));
      }
    });
  }

  request(method: string, params: unknown, timeoutMs = RPC_TIMEOUT_MS): Promise<unknown> {
    if (this.closing || this.protocolFailure) {
      return Promise.reject(
        this.protocolFailure ?? new CodexProtocolErrorV01("codex_transport_closed"),
      );
    }
    if (this.pending.size >= MAX_PENDING_REQUESTS) {
      return Promise.reject(
        new CodexProtocolErrorV01("codex_pending_request_bound_exceeded"),
      );
    }
    const id = `augnes:${randomUUID()}`;
    const deferred = deferredV01<unknown>();
    const timer = setTimeout(() => {
      if (!this.pending.delete(id)) return;
      deferred.reject(new CodexProtocolErrorV01("codex_rpc_timeout"));
    }, timeoutMs);
    this.pending.set(id, { method, deferred, timer });
    try {
      this.write({ id, method, params });
    } catch (error) {
      clearTimeout(timer);
      this.pending.delete(id);
      deferred.reject(asErrorV01(error));
    }
    return deferred.promise;
  }

  notify(method: string, params: unknown): void {
    this.write({ method, params });
  }

  shutdown(): Promise<boolean> {
    this.shutdownPromise ??= this.performShutdown();
    return this.shutdownPromise;
  }

  private onStdout(
    chunk: Buffer,
    handlers: {
      onNotification(method: string, params: unknown): Promise<void>;
      onServerRequest(
        id: string | number,
        method: string,
        params: unknown,
      ): Promise<unknown>;
    },
  ): void {
    if (this.protocolFailure) return;
    this.stdoutBuffer = Buffer.concat([this.stdoutBuffer, chunk]);
    if (this.stdoutBuffer.byteLength > MAX_JSONL_BUFFER_BYTES) {
      this.fail(new CodexProtocolErrorV01("codex_jsonl_buffer_bound_exceeded"));
      return;
    }
    while (true) {
      const newline = this.stdoutBuffer.indexOf(0x0a);
      if (newline < 0) break;
      const line = this.stdoutBuffer.subarray(0, newline);
      this.stdoutBuffer = this.stdoutBuffer.subarray(newline + 1);
      if (line.byteLength === 0) continue;
      if (line.byteLength > MAX_JSONL_LINE_BYTES) {
        this.fail(new CodexProtocolErrorV01("codex_jsonl_line_bound_exceeded"));
        return;
      }
      let message: unknown;
      try {
        message = JSON.parse(line.toString("utf8"));
      } catch {
        this.fail(new CodexProtocolErrorV01("codex_jsonl_malformed"));
        return;
      }
      try {
        this.dispatch(message, handlers);
      } catch (error) {
        this.fail(asErrorV01(error));
        return;
      }
    }
  }

  private dispatch(
    value: unknown,
    handlers: {
      onNotification(method: string, params: unknown): Promise<void>;
      onServerRequest(
        id: string | number,
        method: string,
        params: unknown,
      ): Promise<unknown>;
    },
  ): void {
    const message = objectV01(value, "codex_rpc_envelope_invalid");
    const hasId = typeof message.id === "string" || typeof message.id === "number";
    const method = stringV01(message.method);
    if (hasId && (Object.hasOwn(message, "result") || Object.hasOwn(message, "error"))) {
      if (method) throw new CodexProtocolErrorV01("codex_rpc_response_invalid");
      this.handleResponse(message);
      return;
    }
    if (!method || !Object.hasOwn(message, "params")) {
      throw new CodexProtocolErrorV01("codex_rpc_envelope_invalid");
    }
    if (hasId) {
      if (this.inFlightServerRequestHandlerCount >= MAX_SERVER_REQUESTS) {
        throw new CodexProtocolErrorV01("codex_server_request_bound_exceeded");
      }
      this.inFlightServerRequestHandlerCount += 1;
      const task = handlers
        .onServerRequest(message.id as string | number, method, message.params)
        .then(
          (result) => this.writeServerResponseSafely({ id: message.id, result }),
          (error) => {
            this.writeServerResponseSafely({
              id: message.id,
              error: {
                code: -32000,
                message: publicErrorCodeV01(asErrorV01(error)),
              },
            });
            this.fail(asErrorV01(error));
          },
        )
        .finally(() => {
          this.inFlightServerRequestHandlerCount -= 1;
          this.serverTasks.delete(task);
        });
      this.serverTasks.add(task);
      return;
    }
    const task = handlers
      .onNotification(method, message.params)
      .catch((error) => this.fail(asErrorV01(error)))
      .finally(() => this.serverTasks.delete(task));
    this.serverTasks.add(task);
  }

  private handleResponse(message: Record<string, unknown>): void {
    const id = requestIdStringV01(message.id);
    if (!id) throw new CodexProtocolErrorV01("codex_rpc_response_id_invalid");
    const hasResult = Object.hasOwn(message, "result");
    const hasError = Object.hasOwn(message, "error");
    if (hasResult === hasError) {
      throw new CodexProtocolErrorV01("codex_rpc_response_invalid");
    }
    const fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(message),
    );
    const pending = this.pending.get(id);
    if (!pending) {
      const prior = this.recentResponses.get(id);
      if (prior === fingerprint) return;
      throw new CodexProtocolErrorV01(
        prior ? "codex_rpc_response_conflict" : "codex_rpc_response_unknown_id",
      );
    }
    this.pending.delete(id);
    clearTimeout(pending.timer);
    this.recentResponses.set(id, fingerprint);
    while (this.recentResponses.size > MAX_RECENT_RESPONSES) {
      this.recentResponses.delete(this.recentResponses.keys().next().value!);
    }
    if (hasError) {
      const error = isObjectV01(message.error) ? message.error : {};
      const code = Number.isFinite(error.code) ? Number(error.code) : null;
      pending.deferred.reject(
        new CodexRpcErrorV01(
          code === -32601 ? "codex_required_method_unavailable" : "codex_rpc_failed",
          pending.method,
        ),
      );
      return;
    }
    pending.deferred.resolve(message.result);
  }

  private write(value: unknown): void {
    if (this.closing || this.protocolFailure) {
      throw this.protocolFailure ?? new CodexProtocolErrorV01("codex_transport_closed");
    }
    const line = `${JSON.stringify(value)}\n`;
    if (Buffer.byteLength(line, "utf8") > MAX_JSONL_LINE_BYTES) {
      throw new CodexProtocolErrorV01("codex_client_jsonl_line_bound_exceeded");
    }
    if (!this.child.stdin.write(line, "utf8")) {
      // Backpressure is bounded by the small pending-request map. Node resumes
      // writes itself; no unbounded user payload queue is retained here.
    }
  }

  private writeServerResponseSafely(value: unknown): void {
    if (this.closing || this.protocolFailure) return;
    try {
      this.write(value);
    } catch (error) {
      this.fail(asErrorV01(error));
    }
  }

  private fail(error: Error): void {
    if (this.protocolFailure) return;
    this.protocolFailure = error;
    this.rejectPending(error);
    void this.shutdown();
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.deferred.reject(error);
    }
    this.pending.clear();
  }

  private async performShutdown(): Promise<boolean> {
    this.closing = true;
    try {
      this.rejectPending(
        this.protocolFailure ?? new CodexProtocolErrorV01("codex_transport_closed"),
      );
      this.captureOwnedProcessTree();
      this.child.stdin.end();
      const alreadyClosed = await withinV01(
        this.closed,
        GRACEFUL_PROCESS_STOP_MS,
      );
      this.captureOwnedProcessTree();
      const stopped = await stopOwnedProcessTreeV01(this.child, {
        graceful_timeout_ms: alreadyClosed ? 100 : GRACEFUL_PROCESS_STOP_MS,
        forced_timeout_ms: FORCED_PROCESS_STOP_MS,
        additional_owned_pids: this.knownOwnedProcessIds,
      });
      if (!alreadyClosed) await withinV01(this.closed, FORCED_PROCESS_STOP_MS);
      await Promise.allSettled([...this.serverTasks]);
      return stopped.settled;
    } finally {
      if (this.processTreeObserver) clearInterval(this.processTreeObserver);
      this.child.stdout.removeAllListeners();
      this.child.stderr.removeAllListeners();
      this.child.stdin.removeAllListeners();
      this.stdoutBuffer = Buffer.alloc(0);
      this.pending.clear();
      this.recentResponses.clear();
      this.serverTasks.clear();
      this.inFlightServerRequestHandlerCount = 0;
    }
  }

  private captureOwnedProcessTree(): void {
    for (const pid of [...this.knownOwnedProcessIds]) {
      for (const descendant of listOwnedDescendantProcessIdsV01(pid)) {
        this.knownOwnedProcessIds.add(descendant);
      }
    }
  }

}

interface PendingRpcV01 {
  method: string;
  deferred: DeferredV01<unknown>;
  timer: ReturnType<typeof setTimeout>;
}

interface ActiveCodexServerRequestV01 {
  request_fingerprint: string;
  approval_id: string;
  approval_fingerprint: string;
  decision_fingerprint: string | null;
  run_id: string;
  thread_id: string;
  turn_id: string;
}

interface ResolvedCodexServerRequestV01 {
  request_fingerprint: string;
  resolution_fingerprint: string;
  approval_id: string;
  approval_fingerprint: string;
  decision_fingerprint: string;
}

interface DeferredV01<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

interface CodexTurnTerminalV01 {
  turn: Record<string, unknown>;
  status: "completed" | "failed" | "interrupted";
  fingerprint: string;
}

interface CodexHostStructuredResultV01 {
  result_version: typeof CODEX_HOST_STRUCTURED_RESULT_VERSION_V01;
  summary: string;
  changed_files: NativeHostChangedFileV01[];
  artifacts: NativeHostArtifactV01[];
  observed_actions: string[];
  commands: NativeHostObservedCommandV01[];
  checks: NativeHostObservedCheckV01[];
  skipped_checks: NativeHostSkippedCheckV01[];
  uncertainty: string[];
  gaps: string[];
  proposed_next_steps: string[];
}

class CodexCapabilityErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexCapabilityErrorV01";
  }
}

class CodexProtocolErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexProtocolErrorV01";
  }
}

class CodexRpcErrorV01 extends Error {
  constructor(readonly code: string, readonly method: string) {
    super(code);
    this.name = "CodexRpcErrorV01";
  }
}

const CODEX_HOST_STRUCTURED_RESULT_SCHEMA_V01 = {
  type: "object",
  additionalProperties: false,
  required: [
    "result_version",
    "summary",
    "changed_files",
    "artifacts",
    "observed_actions",
    "commands",
    "checks",
    "skipped_checks",
    "uncertainty",
    "gaps",
    "proposed_next_steps",
  ],
  properties: {
    result_version: { const: CODEX_HOST_STRUCTURED_RESULT_VERSION_V01 },
    summary: { type: "string", maxLength: 4096 },
    changed_files: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "repository_relative_path",
          "change_kind",
          "before_hash",
          "after_hash",
        ],
        properties: {
          repository_relative_path: { type: "string", minLength: 1, maxLength: 4096 },
          change_kind: {
            enum: ["added", "modified", "deleted", "renamed", "unknown"],
          },
          before_hash: {
            anyOf: [
              { type: "null" },
              { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
            ],
          },
          after_hash: {
            anyOf: [
              { type: "null" },
              { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
            ],
          },
        },
      },
    },
    artifacts: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["artifact_ref", "summary"],
        properties: {
          artifact_ref: {
            type: "object",
            additionalProperties: false,
            required: [
              "ref_version",
              "ref_type",
              "external_id",
              "observed_at",
              "trust_class",
            ],
            properties: {
              ref_version: { const: "external_ref.v0.1" },
              ref_type: { type: "string", minLength: 1, maxLength: 512 },
              external_id: { type: "string", minLength: 1, maxLength: 4096 },
              observed_at: { type: "string", minLength: 1, maxLength: 64 },
              trust_class: { const: "host_attestation" },
            },
          },
          summary: { type: "string", minLength: 1, maxLength: 1024 },
        },
      },
    },
    observed_actions: {
      type: "array",
      maxItems: 64,
      items: { type: "string", minLength: 1, maxLength: 512 },
    },
    commands: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "command_id",
          "summary",
          "command_fingerprint",
          "started_at",
          "finished_at",
          "exit_code",
          "status",
        ],
        properties: {
          command_id: { type: "string", minLength: 1, maxLength: 512 },
          summary: { type: "string", minLength: 1, maxLength: 1024 },
          command_fingerprint: {
            anyOf: [
              { type: "null" },
              { type: "string", pattern: "^sha256:[a-f0-9]{64}$" },
            ],
          },
          started_at: {
            anyOf: [{ type: "null" }, { type: "string", maxLength: 64 }],
          },
          finished_at: {
            anyOf: [{ type: "null" }, { type: "string", maxLength: 64 }],
          },
          exit_code: { anyOf: [{ type: "null" }, { type: "integer" }] },
          status: { enum: ["completed", "failed", "blocked", "unknown"] },
        },
      },
    },
    checks: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["check_id", "required", "status", "summary"],
        properties: {
          check_id: { type: "string", minLength: 1, maxLength: 512 },
          required: { type: "boolean" },
          status: { enum: ["passed", "failed", "blocked", "unknown"] },
          summary: { type: "string", minLength: 1, maxLength: 1024 },
        },
      },
    },
    skipped_checks: {
      type: "array",
      maxItems: 128,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["check_id", "required", "reason"],
        properties: {
          check_id: { type: "string", minLength: 1, maxLength: 512 },
          required: { type: "boolean" },
          reason: { type: "string", minLength: 1, maxLength: 1024 },
        },
      },
    },
    uncertainty: {
      type: "array",
      maxItems: 64,
      items: { type: "string", minLength: 1, maxLength: 1024 },
    },
    gaps: {
      type: "array",
      maxItems: 64,
      items: { type: "string", minLength: 1, maxLength: 1024 },
    },
    proposed_next_steps: {
      type: "array",
      maxItems: 64,
      items: { type: "string", minLength: 1, maxLength: 1024 },
    },
  },
} as const;

function renderPacketV01(request: NativeHostRequestV01): string {
  const rendered = [
    "Augnes native-host task. Treat this TaskContextPacket as selected working context, not project truth.",
    "Stay inside the supplied cwd and sandbox. Ask through the host approval protocol when required.",
    "Return only JSON matching the supplied output schema. Do not return a transcript, hidden reasoning, credentials, environment data, or raw command output.",
    `Request binding: ${request.request_id}`,
    `Packet fingerprint: ${request.packet.integrity.fingerprint}`,
    canonicalizeProtocolValueV01(request.packet),
  ].join("\n\n");
  if (Buffer.byteLength(rendered, "utf8") > MAX_PROMPT_BYTES) {
    throw new NativeHostContractErrorV01("codex_rendered_packet_bound_exceeded");
  }
  return rendered;
}

function parseStructuredResultFromTurnV01(
  turn: Record<string, unknown>,
  maxBytes: number,
): CodexHostStructuredResultV01 {
  const items = Array.isArray(turn.items) ? turn.items : [];
  const messages = items.filter(
    (item) => isObjectV01(item) && item.type === "agentMessage",
  ) as Record<string, unknown>[];
  const text = stringV01(messages.at(-1)?.text);
  if (!text || Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new NativeHostContractErrorV01("codex_structured_result_missing_or_oversized");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new NativeHostContractErrorV01("codex_structured_result_malformed");
  }
  const value = objectV01(parsed, "codex_structured_result_invalid");
  const required = new Set([
    "result_version",
    "summary",
    "changed_files",
    "artifacts",
    "observed_actions",
    "commands",
    "checks",
    "skipped_checks",
    "uncertainty",
    "gaps",
    "proposed_next_steps",
  ]);
  if (
    Object.keys(value).length !== required.size ||
    Object.keys(value).some((key) => !required.has(key)) ||
    value.result_version !== CODEX_HOST_STRUCTURED_RESULT_VERSION_V01
  ) {
    throw new NativeHostContractErrorV01("codex_structured_result_shape_invalid");
  }
  return {
    result_version: CODEX_HOST_STRUCTURED_RESULT_VERSION_V01,
    summary: publicTextV01(requiredStringV01(value.summary, "codex_result_summary_invalid"), 4096),
    changed_files: arrayV01(value.changed_files, 128).map((item) => {
      const changed = exactObjectV01(
        item,
        "codex_result_changed_file_invalid",
        [
          "repository_relative_path",
          "change_kind",
          "before_hash",
          "after_hash",
        ],
      );
      return {
        repository_relative_path: canonicalizeRepositoryRelativePathV01(
          requiredStringV01(
            changed.repository_relative_path,
            "codex_result_changed_file_path_invalid",
          ),
        ),
        change_kind: changeKindV01(changed.change_kind),
        before_hash: nullableHashV01(changed.before_hash),
        after_hash: nullableHashV01(changed.after_hash),
      };
    }),
    artifacts: arrayV01(value.artifacts, 128).map(normalizeArtifactV01),
    observed_actions: stringArrayV01(value.observed_actions, 64, 512),
    commands: arrayV01(value.commands, 128).map(normalizeCommandV01),
    checks: arrayV01(value.checks, 128).map(normalizeCheckV01),
    skipped_checks: arrayV01(value.skipped_checks, 128).map(normalizeSkippedCheckV01),
    uncertainty: stringArrayV01(value.uncertainty, 64, 1024),
    gaps: stringArrayV01(value.gaps, 64, 1024),
    proposed_next_steps: stringArrayV01(value.proposed_next_steps, 64, 1024),
  };
}

function normalizeArtifactV01(value: unknown): NativeHostArtifactV01 {
  const artifact = exactObjectV01(value, "codex_result_artifact_invalid", [
    "artifact_ref",
    "summary",
  ]);
  const ref = exactObjectV01(
    artifact.artifact_ref,
    "codex_result_artifact_ref_invalid",
    ["ref_version", "ref_type", "external_id", "observed_at", "trust_class"],
  );
  if (
    ref.ref_version !== "external_ref.v0.1" ||
    ref.trust_class !== "host_attestation"
  ) {
    throw new NativeHostContractErrorV01("codex_result_artifact_ref_invalid");
  }
  const refType = requiredStringV01(ref.ref_type, "codex_result_artifact_ref_invalid");
  let externalId = requiredStringV01(
    ref.external_id,
    "codex_result_artifact_ref_invalid",
  );
  if (refType === "repository_relative_artifact") {
    externalId = canonicalizeRepositoryRelativePathV01(externalId);
  }
  return {
    artifact_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: refType,
      external_id: externalId,
      observed_at: requiredStringV01(
        ref.observed_at,
        "codex_result_artifact_ref_invalid",
      ),
      trust_class: "host_attestation",
      provider: "codex",
      host: "app_server",
      compatibility_namespace: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
    },
    summary: publicTextV01(
      requiredStringV01(artifact.summary, "codex_result_artifact_summary_invalid"),
      1024,
    ),
  };
}

function normalizeCommandV01(value: unknown): NativeHostObservedCommandV01 {
  const command = exactObjectV01(value, "codex_result_command_invalid", [
    "command_id",
    "summary",
    "command_fingerprint",
    "started_at",
    "finished_at",
    "exit_code",
    "status",
  ]);
  const status = stringV01(command.status);
  if (!status || !["completed", "failed", "blocked", "unknown"].includes(status)) {
    throw new NativeHostContractErrorV01("codex_result_command_status_invalid");
  }
  return {
    command_id: requiredOpaqueIdV01(command.command_id, "codex_result_command_id_invalid"),
    summary: publicTextV01(
      requiredStringV01(command.summary, "codex_result_command_summary_invalid"),
      1024,
    ),
    command_fingerprint: nullableHashV01(command.command_fingerprint),
    started_at: nullableStringV01(command.started_at),
    finished_at: nullableStringV01(command.finished_at),
    exit_code: Number.isSafeInteger(command.exit_code) ? Number(command.exit_code) : null,
    status: status as NativeHostObservedCommandV01["status"],
  };
}

function normalizeCheckV01(value: unknown): NativeHostObservedCheckV01 {
  const check = exactObjectV01(value, "codex_result_check_invalid", [
    "check_id",
    "required",
    "status",
    "summary",
  ]);
  const status = stringV01(check.status);
  if (!status || !["passed", "failed", "blocked", "unknown"].includes(status)) {
    throw new NativeHostContractErrorV01("codex_result_check_status_invalid");
  }
  return {
    check_id: requiredOpaqueIdV01(check.check_id, "codex_result_check_id_invalid"),
    required: check.required === true,
    status: status as NativeHostObservedCheckV01["status"],
    summary: publicTextV01(
      requiredStringV01(check.summary, "codex_result_check_summary_invalid"),
      1024,
    ),
  };
}

function normalizeSkippedCheckV01(value: unknown): NativeHostSkippedCheckV01 {
  const check = exactObjectV01(value, "codex_result_skipped_check_invalid", [
    "check_id",
    "required",
    "reason",
  ]);
  return {
    check_id: requiredOpaqueIdV01(
      check.check_id,
      "codex_result_skipped_check_id_invalid",
    ),
    required: check.required === true,
    reason: publicTextV01(
      requiredStringV01(check.reason, "codex_result_skipped_check_reason_invalid"),
      1024,
    ),
  };
}

function repositoryPathsFromPermissionProfileV01(
  request: NativeHostRequestV01,
  permissions: Record<string, unknown>,
): string[] {
  if (!isObjectV01(permissions.fileSystem)) return [];
  const fileSystem = permissions.fileSystem;
  const values = [
    ...(Array.isArray(fileSystem.read) ? fileSystem.read : []),
    ...(Array.isArray(fileSystem.write) ? fileSystem.write : []),
  ];
  if (Array.isArray(fileSystem.entries)) {
    for (const entry of fileSystem.entries) {
      if (!isObjectV01(entry)) continue;
      if (typeof entry.path === "string") values.push(entry.path);
      else if (isObjectV01(entry.path) && typeof entry.path.path === "string") {
        values.push(entry.path.path);
      }
    }
  }
  return uniqueSortedV01(
    values.flatMap((value) =>
      typeof value === "string" ? relativeScopeForHostPathV01(request, value) : [],
    ),
  );
}

function normalizeGrantedPermissionsV01(
  request: NativeHostRequestV01,
  value: unknown,
): Record<string, unknown> {
  if (!isObjectV01(value)) return {};
  const result: Record<string, unknown> = {};
  if (isObjectV01(value.network) && value.network.enabled === false) {
    result.network = { enabled: false };
  }
  if (isObjectV01(value.fileSystem)) {
    const fileSystem: Record<string, string[]> = {};
    for (const key of ["read", "write"] as const) {
      const paths = value.fileSystem[key];
      if (!Array.isArray(paths) || paths.length > 128) continue;
      const accepted = paths.map((candidate) => {
        const pathValue = requiredStringV01(
          candidate,
          "codex_permission_path_invalid",
        );
        relativeScopeForHostPathV01(request, pathValue);
        return pathValue;
      });
      if (accepted.length > 0) fileSystem[key] = accepted;
    }
    if (Object.keys(fileSystem).length > 0) result.fileSystem = fileSystem;
  }
  return result;
}

function relativeScopeForHostPathV01(
  request: NativeHostRequestV01,
  candidate: string,
): string[] {
  if (!candidate || candidate.includes("\0")) {
    throw new CodexProtocolErrorV01("codex_approval_path_invalid");
  }
  const root = request.root_scope.canonical_root;
  if (sameCanonicalRootV01(root, candidate)) return [];
  if (request.root_scope.path_flavor === "posix") {
    if (/^[a-zA-Z]:/u.test(candidate) || candidate.startsWith("\\")) {
      throw new CodexProtocolErrorV01("codex_approval_path_outside_root");
    }
    const absolute = path.posix.isAbsolute(candidate)
      ? path.posix.resolve(candidate)
      : path.posix.resolve(root, candidate);
    const relative = path.posix.relative(
      physicalizePosixPathV01(root),
      physicalizePosixPathV01(absolute),
    );
    if (
      relative === "" ||
      (!relative.startsWith("..") && !path.posix.isAbsolute(relative))
    ) {
      return relative === ""
        ? []
        : [canonicalizeRepositoryRelativePathV01(relative)];
    }
    throw new CodexProtocolErrorV01("codex_approval_path_outside_root");
  }
  if (
    path.posix.isAbsolute(candidate) ||
    (/^[a-zA-Z]:/u.test(candidate) && !path.win32.isAbsolute(candidate))
  ) {
    throw new CodexProtocolErrorV01("codex_approval_path_outside_root");
  }
  const absolute = path.win32.isAbsolute(candidate)
    ? path.win32.resolve(candidate)
    : path.win32.resolve(root, candidate);
  const relative = path.win32.relative(path.win32.resolve(root), absolute);
  if (
    relative === "" ||
    (!relative.startsWith("..") && !path.win32.isAbsolute(relative))
  ) {
    return relative === ""
      ? []
      : [canonicalizeRepositoryRelativePathV01(relative.replaceAll("\\", "/"))];
  }
  throw new CodexProtocolErrorV01("codex_approval_path_outside_root");
}

function physicalizePosixPathV01(candidate: string): string {
  let existing = path.posix.resolve(candidate);
  const suffix: string[] = [];
  while (true) {
    try {
      return path.posix.join(realpathSync.native(existing), ...suffix);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
      const parent = path.posix.dirname(existing);
      if (parent === existing) return path.posix.resolve(candidate);
      suffix.unshift(path.posix.basename(existing));
      existing = parent;
    }
  }
}

function sameCanonicalRootV01(left: string, right: string): boolean {
  if (left.includes("\0") || right.includes("\0")) return false;
  if (path.posix.isAbsolute(left)) {
    if (
      !path.posix.isAbsolute(right) ||
      /^[a-zA-Z]:/u.test(right) ||
      right.startsWith("\\")
    ) {
      return false;
    }
    if (path.posix.resolve(left) === path.posix.resolve(right)) return true;
    return samePhysicalRootV01(left, right, false);
  }
  if (path.win32.isAbsolute(left)) {
    if (!path.win32.isAbsolute(right) || path.posix.isAbsolute(right)) {
      return false;
    }
    if (
      path.win32.resolve(left).toLowerCase() ===
      path.win32.resolve(right).toLowerCase()
    ) {
      return true;
    }
    return samePhysicalRootV01(left, right, true);
  }
  return false;
}

function samePhysicalRootV01(
  left: string,
  right: string,
  caseInsensitive: boolean,
): boolean {
  try {
    const physicalLeft = realpathSync.native(left);
    const physicalRight = realpathSync.native(right);
    return caseInsensitive
      ? physicalLeft.toLowerCase() === physicalRight.toLowerCase()
      : physicalLeft === physicalRight;
  } catch {
    return false;
  }
}

export function publicSafeCommandSummaryV01(value: string): string {
  let summary = value
    .replace(/[\u0000-\u001f\u007f]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  summary = summary.replace(
    /(^|[\s;])((?:set\s+|\$env:|env\s+)?)([A-Za-z_][A-Za-z0-9_.-]*)(\s*=\s*)(?:"[^"]*"|'[^']*'|[^\s;]+)/giu,
    (match, boundary: string, prefix: string, key: string) =>
      isSensitiveCommandNameV01(key)
        ? `${boundary}${prefix}${key}=[redacted]`
        : match,
  );
  summary = summary.replace(
    /(^|\s)((?:--?|\/)[A-Za-z][A-Za-z0-9_-]*)(\s*=\s*|\s+)(?:"[^"]*"|'[^']*'|[^\s]+)/giu,
    (match, boundary: string, option: string, separator: string) =>
      isSensitiveCommandNameV01(option)
        ? `${boundary}${option}${separator.trim() === "=" ? "=" : " "}[redacted]`
        : match,
  );
  summary = summary.replace(
    /(^|\s)(-H|--header)(\s+)(["'])([^"']*)\4/giu,
    (
      match,
      boundary: string,
      option: string,
      whitespace: string,
      _quote: string,
      header: string,
    ) => {
      const parsed = /^\s*([A-Za-z][A-Za-z0-9-]*)\s*:\s*(.*)$/u.exec(header);
      if (!parsed || !isSensitiveHeaderNameV01(parsed[1]!)) return match;
      const scheme = /^(bearer|basic)\b/iu.exec(parsed[2] ?? "")?.[1];
      return `${boundary}${option}${whitespace}${parsed[1]}: ${
        scheme ? `${scheme} ` : ""
      }[redacted]`;
    },
  );
  summary = summary.replace(
    /\b(Authorization|Proxy-Authorization|X-Api-Key|API-Key|X-Auth-Token|Cookie|Set-Cookie)(\s*:\s*)(?:(Bearer|Basic)\s+)?[^\s"'`]+/giu,
    (_match, name: string, separator: string, scheme?: string) =>
      `${name}${separator}${scheme ? `${scheme} ` : ""}[redacted]`,
  );
  summary = summary.replace(
    /([A-Za-z][A-Za-z0-9+.-]*:\/\/)([^@\s/"']+)@/gu,
    "$1[redacted]@",
  );
  summary = summary.replace(
    /([?;&])([A-Za-z][A-Za-z0-9_.-]*)(=)([^&#\s"'`]+)/giu,
    (match, separator: string, key: string) =>
      isSensitiveCommandNameV01(key)
        ? `${separator}${key}=[redacted]`
        : match,
  );

  summary = summary.replace(
    /(["'])([^"']+)\1/gu,
    (match, _quote: string, candidate: string) =>
      isAbsoluteCommandPathV01(candidate) ? "[absolute-path]" : match,
  );
  summary = summary.replace(
    /(^|[\s=])([^\s"'`]+)/gu,
    (match, boundary: string, candidate: string) =>
      isAbsoluteCommandPathV01(candidate)
        ? `${boundary}[absolute-path]`
        : match,
  );

  summary = summary.replace(/\s+/gu, " ").trim();
  const bounded =
    summary.length <= 512
      ? summary
      : `${summary.slice(0, 509).trimEnd()}...`;
  return publicTextV01(bounded || "Command details unavailable.", 512);
}

function isSensitiveCommandNameV01(value: string): boolean {
  const compact = value.toLowerCase().replace(/[^a-z0-9]/gu, "");
  return [
    "token",
    "secret",
    "password",
    "passphrase",
    "apikey",
    "accesskey",
    "credential",
    "authorization",
  ].some((marker) => compact.includes(marker));
}

function isSensitiveHeaderNameV01(value: string): boolean {
  return new Set([
    "authorization",
    "proxy-authorization",
    "x-api-key",
    "api-key",
    "x-auth-token",
    "cookie",
    "set-cookie",
  ]).has(value.toLowerCase());
}

function isAbsoluteCommandPathV01(value: string): boolean {
  const candidate = value.replace(/[),;]+$/gu, "");
  return (
    /^file:\/\//iu.test(candidate) ||
    path.posix.isAbsolute(candidate) ||
    path.win32.isAbsolute(candidate) ||
    /^[A-Za-z]:[\\/]/u.test(candidate) ||
    /^\\\\/u.test(candidate) ||
    /^\\(?!\\)/u.test(candidate)
  );
}

function canonicalNetworkHostV01(value: unknown): string {
  const host = requiredStringV01(value, "codex_network_host_invalid")
    .trim()
    .toLowerCase();
  if (
    host.length > 253 ||
    !/^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])$/u.test(host)
  ) {
    throw new CodexProtocolErrorV01("codex_network_host_invalid");
  }
  return host;
}

function canonicalNetworkProtocolV01(value: unknown): string {
  const protocol = requiredStringV01(value, "codex_network_protocol_invalid");
  if (!new Set(["http", "https"]).has(protocol)) {
    throw new CodexProtocolErrorV01("codex_network_protocol_invalid");
  }
  return protocol;
}

function riskSummaryV01(
  operation: NativeHostApprovalRequestV01["operation_class"],
): string {
  if (operation === "network_permission") {
    return "The native host could send project-derived data to the listed destination.";
  }
  if (operation === "command_execution") {
    return "The command may read or modify files inside the selected project root.";
  }
  if (operation === "file_change") {
    return "The native host proposes a filesystem change inside the selected project root.";
  }
  return "The native host requests additional filesystem access inside the selected project root.";
}

function externalRefV01(
  refType: string,
  externalId: string,
  observedAt: string,
  trustClass: ExternalRefV01["trust_class"],
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    provider: "codex",
    host: "app_server",
    observed_at: observedAt,
    trust_class: trustClass,
    compatibility_namespace: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
  };
}

function boundedCodexChildEnvironmentV01(
  source: NodeJS.ProcessEnv,
  canonicalTest: boolean,
): NodeJS.ProcessEnv {
  const allowed = [
    "PATH",
    "Path",
    "HOME",
    "USERPROFILE",
    "TMPDIR",
    "TMP",
    "TEMP",
    "SystemRoot",
    "WINDIR",
    "COMSPEC",
    "PATHEXT",
    "LANG",
    "LANGUAGE",
    "LC_ALL",
    "LC_CTYPE",
    "TZ",
    "TERM",
    "NO_COLOR",
    "CODEX_HOME",
    "CODEX_SQLITE_HOME",
  ];
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: source.NODE_ENV ?? "production",
  };
  for (const key of allowed) {
    if (typeof source[key] === "string" && source[key]!.length > 0) {
      environment[key] = source[key];
    }
  }
  if (canonicalTest) {
    environment.AUGNES_CANONICAL_TEST_MODE = "1";
    if (source.AUGNES_CANONICAL_TEMP_ROOT) {
      environment.AUGNES_CANONICAL_TEMP_ROOT = source.AUGNES_CANONICAL_TEMP_ROOT;
    }
  }
  return environment;
}

function minimizedItemFingerprintMaterialV01(
  item: Record<string, unknown>,
): Record<string, unknown> {
  if (item.type === "commandExecution") {
    return {
      type: item.type,
      id: item.id,
      command_fingerprint:
        typeof item.command === "string"
          ? createProtocolSha256V01(item.command)
          : null,
      cwd: item.cwd,
      status: item.status,
      exitCode: item.exitCode,
    };
  }
  if (item.type === "fileChange") {
    return {
      type: item.type,
      id: item.id,
      status: item.status,
      changes: Array.isArray(item.changes)
        ? item.changes.map((change) =>
            isObjectV01(change)
              ? { path: change.path, kind: change.kind }
              : null,
          )
        : [],
    };
  }
  return { type: item.type, id: item.id };
}

function minimizedTurnTerminalMaterialV01(
  turn: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: turn.id,
    status: turn.status,
    error_code: isObjectV01(turn.error)
      ? stringV01(turn.error.codexErrorInfo) ?? "host_error"
      : null,
    agent_message_fingerprints: Array.isArray(turn.items)
      ? turn.items
          .filter((item) => isObjectV01(item) && item.type === "agentMessage")
          .map((item) =>
            createProtocolSha256V01(
              typeof item.text === "string" ? item.text : "",
            ),
          )
      : [],
  };
}

function uniqueChangedFilesV01(
  values: NativeHostChangedFileV01[],
): NativeHostChangedFileV01[] {
  const found = new Map<string, NativeHostChangedFileV01>();
  for (const value of values) {
    const normalized = canonicalizeRepositoryRelativePathV01(
      value.repository_relative_path,
    );
    const candidate = { ...value, repository_relative_path: normalized };
    const prior = found.get(normalized);
    if (!prior) {
      found.set(normalized, candidate);
      continue;
    }
    const changeKind = mergeCompatibleValueV01(
      prior.change_kind,
      candidate.change_kind,
      "unknown",
      "codex_changed_file_conflict",
    );
    const beforeHash = mergeCompatibleValueV01(
      prior.before_hash,
      candidate.before_hash,
      null,
      "codex_changed_file_conflict",
    );
    const afterHash = mergeCompatibleValueV01(
      prior.after_hash,
      candidate.after_hash,
      null,
      "codex_changed_file_conflict",
    );
    found.set(normalized, {
      repository_relative_path: normalized,
      change_kind: changeKind,
      before_hash: beforeHash,
      after_hash: afterHash,
    });
  }
  return [...found.values()].sort((left, right) =>
    left.repository_relative_path.localeCompare(right.repository_relative_path),
  );
}

function mergeCommandsV01(
  observed: NativeHostObservedCommandV01[],
  attested: NativeHostObservedCommandV01[],
): NativeHostObservedCommandV01[] {
  const values = new Map<string, NativeHostObservedCommandV01>();
  for (const command of [...attested, ...observed]) {
    const prior = values.get(command.command_id);
    if (!prior) {
      values.set(command.command_id, command);
      continue;
    }
    if (
      prior.summary !== command.summary ||
      prior.command_fingerprint !== command.command_fingerprint ||
      prior.status !== command.status
    ) {
      throw new CodexProtocolErrorV01("codex_command_item_conflict");
    }
    values.set(command.command_id, {
      ...prior,
      started_at: mergeCompatibleValueV01(
        prior.started_at,
        command.started_at,
        null,
        "codex_command_item_conflict",
      ),
      finished_at: mergeCompatibleValueV01(
        prior.finished_at,
        command.finished_at,
        null,
        "codex_command_item_conflict",
      ),
      exit_code: mergeCompatibleValueV01(
        prior.exit_code,
        command.exit_code,
        null,
        "codex_command_item_conflict",
      ),
    });
  }
  return [...values.values()].sort((left, right) =>
    left.command_id.localeCompare(right.command_id),
  );
}

function uniqueChecksV01(
  values: NativeHostObservedCheckV01[],
): NativeHostObservedCheckV01[] {
  const found = new Map<string, NativeHostObservedCheckV01>();
  for (const value of values) {
    const prior = found.get(value.check_id);
    if (
      prior &&
      canonicalizeProtocolValueV01(prior) !==
        canonicalizeProtocolValueV01(value)
    ) {
      throw new CodexProtocolErrorV01("codex_check_result_conflict");
    }
    if (!prior) found.set(value.check_id, value);
  }
  return [...found.values()].sort((left, right) =>
    left.check_id.localeCompare(right.check_id),
  );
}

function mergeCompatibleValueV01<T>(
  left: T,
  right: T,
  missing: T,
  conflictCode: string,
): T {
  if (left === missing) return right;
  if (right === missing || left === right) return left;
  throw new CodexProtocolErrorV01(conflictCode);
}

function changeKindV01(value: unknown): NativeHostChangedFileV01["change_kind"] {
  if (
    typeof value === "string" &&
    ["added", "modified", "deleted", "renamed", "unknown"].includes(value)
  ) {
    return value as NativeHostChangedFileV01["change_kind"];
  }
  if (value === "add") return "added";
  if (value === "delete") return "deleted";
  if (value === "update") return "modified";
  return "unknown";
}

function nullableHashV01(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = requiredStringV01(value, "codex_result_hash_invalid");
  if (!/^sha256:[a-f0-9]{64}$/u.test(text)) {
    throw new NativeHostContractErrorV01("codex_result_hash_invalid");
  }
  return text;
}

function nullableStringV01(value: unknown): string | null {
  return value === null || value === undefined ? null : requiredStringV01(value, "codex_result_string_invalid");
}

function millisTimestampV01(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value).toISOString()
    : null;
}

function stringArrayV01(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] {
  return arrayV01(value, maxItems).map((entry) =>
    publicTextV01(requiredStringV01(entry, "codex_result_text_invalid"), maxLength),
  );
}

function arrayV01(value: unknown, maxItems: number): unknown[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new NativeHostContractErrorV01("codex_structured_result_bound_exceeded");
  }
  return value;
}

function publicTextV01(value: string, maxLength: number): string {
  const normalized = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/gu, " ").trim();
  if (!normalized || normalized.length > maxLength) {
    throw new NativeHostContractErrorV01("codex_public_text_invalid");
  }
  assertNativeHostPublicTextV01(normalized);
  return normalized;
}

function boundedTextV01(value: unknown, maxLength: number, fallback: string): string {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, maxLength)
    : fallback;
}

function publicCliVersionV01(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 160 ||
    !/^[a-zA-Z0-9._+ /-]+$/u.test(value) ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    /(?:^|\s)\//u.test(value) ||
    value.includes("//")
  ) {
    return "unknown";
  }
  return value.trim() || "unknown";
}

function requiredOpaqueIdV01(value: unknown, code: string): string {
  const id = requiredStringV01(value, code);
  if (id.length > 512 || /[\u0000-\u001f]/u.test(id)) {
    throw new CodexProtocolErrorV01(code);
  }
  return id;
}

function requiredStringV01(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new CodexProtocolErrorV01(code);
  }
  return value;
}

function stringV01(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function objectV01(value: unknown, code: string): Record<string, unknown> {
  if (!isObjectV01(value)) throw new CodexProtocolErrorV01(code);
  return value;
}

function exactObjectV01(
  value: unknown,
  code: string,
  keys: readonly string[],
): Record<string, unknown> {
  const object = objectV01(value, code);
  const expected = new Set(keys);
  if (
    Object.keys(object).length !== expected.size ||
    Object.keys(object).some((key) => !expected.has(key))
  ) {
    throw new NativeHostContractErrorV01(code);
  }
  return object;
}

function isObjectV01(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requestIdStringV01(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0 && value.length <= 512) return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return null;
}

function uniqueSortedV01(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function isCapabilityUnavailableV01(error: Error): boolean {
  return (
    error instanceof CodexCapabilityErrorV01 ||
    (error instanceof CodexRpcErrorV01 &&
      error.code === "codex_required_method_unavailable")
  );
}

function publicErrorCodeV01(error: Error): string {
  if (
    error instanceof CodexRpcErrorV01 &&
    error.code === "codex_rpc_failed" &&
    error.method === "initialize"
  ) {
    return "codex_initialization_failed";
  }
  if (
    error instanceof CodexCapabilityErrorV01 ||
    error instanceof CodexProtocolErrorV01 ||
    error instanceof CodexRpcErrorV01 ||
    error instanceof NativeHostContractErrorV01 ||
    error instanceof NativeHostReconciliationRequiredErrorV01
  ) {
    return error.code;
  }
  return "codex_app_server_failed";
}

function publicCleanupDiagnosticCodeV01(error: Error): string {
  const publicCode = publicErrorCodeV01(error);
  const nodeCode = (error as NodeJS.ErrnoException).code;
  const safeName = /^[A-Za-z][A-Za-z0-9]*$/u.test(error.name)
    ? error.name
    : "Error";
  const safeNodeCode =
    typeof nodeCode === "string" && /^[A-Z0-9_]+$/u.test(nodeCode)
      ? nodeCode.toLowerCase()
      : "none";
  return `${publicCode}:${safeName}:${safeNodeCode}`;
}

function asErrorV01(error: unknown): Error {
  return error instanceof Error ? error : new Error("codex_app_server_failed");
}

function deferredV01<T>(): DeferredV01<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function withinV01<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
