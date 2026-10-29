import type { CodexFeasibilityWindowV01, CodexScopedTaskV01 } from "./codex-scoped-task";
import type { NativeHostAdapterV01, NativeHostRequestV01, NativeHostRunModeV01 } from "@/types/vnext/native-host-adapter";
import type { DirectNativeHostRoundTripDependenciesV01, NativeHostTimeoutSchedulerV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";

/** Compatibility input owned by this static host composition, never an HTTP,
 * persisted or environment-selectable execution extension. */
export interface NativeHostExecutionCompositionOptionsV01 {
  adapter_factory?: (scope?: CodexScopedTaskV01) => NativeHostAdapterV01;
  scoped_task?: Readonly<{ scope: CodexScopedTaskV01; window: CodexFeasibilityWindowV01 }>;
  timeout_ms?: number;
  stop_settle_timeout_ms?: number;
}

export interface NativeHostExecutionTimeoutsV01 {
  timeout_ms: number;
  stop_settle_timeout_ms: number;
}

/** Only the composition can associate an attempt with concrete host material.
 * The lifecycle sees bounded scheduling and settlement responsibilities. */
export interface NativeHostExecutionAttemptV01 extends NativeHostExecutionTimeoutsV01 {
  before_invoke(request: NativeHostRequestV01): Promise<void>;
  schedule(scheduler: NativeHostTimeoutSchedulerV01): NativeHostTimeoutSchedulerV01;
  finish(completed: boolean): void;
}

export interface NativeHostExecutionCompositionV01 {
  timeouts(): NativeHostExecutionTimeoutsV01;
  begin(mode: NativeHostRunModeV01): NativeHostExecutionAttemptV01 | undefined;
  assertReplayAllowed(attempt: NativeHostExecutionAttemptV01 | undefined): void;
  assertResumeAllowed(): void;
  createAdapter(attempt?: NativeHostExecutionAttemptV01): NativeHostAdapterV01;
  currentAdapter(): NativeHostAdapterV01;
  roundTripDependencies(attempt?: NativeHostExecutionAttemptV01): Pick<DirectNativeHostRoundTripDependenciesV01, "scoped_task">;
  release(): Promise<void>;
}

/** Fixed trusted composition: an explicit unscoped adapter never resolves the
 * concrete Codex constructor through this boundary. Keep synchronous readers
 * synchronous; these literal requires are lazy, not a module/plugin registry. */
export function composeNativeHostExecutionV01<T extends NativeHostExecutionCompositionOptionsV01>(
  input: T,
  defaults: NativeHostExecutionTimeoutsV01,
): { options: T; execution: NativeHostExecutionCompositionV01 } {
  if (input.scoped_task) {
    const options = Object.freeze({ ...input, scoped_task: Object.freeze({ ...input.scoped_task }) });
    const { composeCodexScopedLiveExecutionV01 } = require("./codex-live-host-composition") as typeof import("./codex-live-host-composition");
    return { options, execution: composeCodexScopedLiveExecutionV01(options, defaults) };
  }
  const createAdapter = () => {
    const injected = input.adapter_factory?.(undefined);
    if (injected != null) return injected;
    const { createCodexAppServerAdapterV01 } = require("./codex-app-server-adapter") as typeof import("./codex-app-server-adapter");
    return createCodexAppServerAdapterV01({ scoped_task: undefined });
  };
  return {
    options: input,
    execution: {
      timeouts: () => ({
        timeout_ms: input.timeout_ms ?? defaults.timeout_ms,
        stop_settle_timeout_ms: input.stop_settle_timeout_ms ?? defaults.stop_settle_timeout_ms,
      }),
      begin: () => undefined,
      assertReplayAllowed: () => {},
      assertResumeAllowed: () => {},
      createAdapter,
      currentAdapter: createAdapter,
      roundTripDependencies: () => ({}),
      release: async () => {},
    },
  };
}

/** Compatibility scope enters only this fixed host-owned binding. The common
 * round trip cannot accept replacement validators from its callers. */
export function bindNativeHostRoundTripExecutionV01(scope?: CodexScopedTaskV01):
  ReturnType<typeof import("./codex-native-host-round-trip-binding").createCodexNativeHostRoundTripBindingV01> | null {
  if (!scope) return null;
  const { createCodexNativeHostRoundTripBindingV01 } = require("./codex-native-host-round-trip-binding") as typeof import("./codex-native-host-round-trip-binding");
  return createCodexNativeHostRoundTripBindingV01(scope);
}
