import { assertCodexScopedAdapterV01, createCodexAppServerAdapterV01 } from "./codex-app-server-adapter";
import { assertCodexScopedExecutionV01, releaseCodexScopedTaskV01, type CodexScopedAttemptV01 } from "./codex-scoped-task";
import { LiveNativeHostRunServiceErrorV01 } from "@/lib/vnext/runtime/live-native-host-run-error";
import type {
  NativeHostExecutionAttemptV01,
  NativeHostExecutionCompositionOptionsV01,
  NativeHostExecutionCompositionV01,
  NativeHostExecutionTimeoutsV01,
} from "./native-host-execution-composition";

/** Concrete Codex restrictions stay inseparable from source-owned scope/window
 * authenticity. No caller-provided binding or callback can replace these checks. */
export function composeCodexScopedLiveExecutionV01(
  options: NativeHostExecutionCompositionOptionsV01,
  defaults: NativeHostExecutionTimeoutsV01,
): NativeHostExecutionCompositionV01 {
  const scoped = options.scoped_task!;
  assertCodexScopedExecutionV01(scoped);
  const attempts = new WeakMap<NativeHostExecutionAttemptV01, CodexScopedAttemptV01>();
  const requireAttempt = (attempt?: NativeHostExecutionAttemptV01) => {
    const owned = attempt && attempts.get(attempt);
    if (!owned) throw new LiveNativeHostRunServiceErrorV01("live_host_scoped_start_owner_required", 403);
    return owned;
  };
  const createAdapter = (scope: typeof scoped.scope) => {
    const adapter = options.adapter_factory?.(scope) ?? createCodexAppServerAdapterV01({ scoped_task: scope });
    assertCodexScopedAdapterV01(adapter, scope);
    return adapter;
  };
  return {
    timeouts: () => ({
      timeout_ms: Math.min(options.timeout_ms ?? defaults.timeout_ms, 180_000),
      stop_settle_timeout_ms: Math.min(options.stop_settle_timeout_ms ?? defaults.stop_settle_timeout_ms, 10_000),
    }),
    begin(mode) {
      assertCodexScopedExecutionV01(scoped);
      const owned = scoped.window.begin(scoped.scope,
        options.timeout_ms ?? defaults.timeout_ms,
        options.stop_settle_timeout_ms ?? defaults.stop_settle_timeout_ms);
      if (mode !== "interactive") {
        owned.finish(false);
        throw new LiveNativeHostRunServiceErrorV01("live_host_scoped_mode_refused", 403);
      }
      const attempt = Object.freeze<NativeHostExecutionAttemptV01>({
        timeout_ms: owned.timeout_ms,
        stop_settle_timeout_ms: owned.stop_settle_timeout_ms,
        before_invoke: (request) => owned.before_invoke(request),
        schedule: (scheduler) => owned.schedule(scheduler),
        finish: (completed) => owned.finish(completed),
      });
      attempts.set(attempt, owned);
      return attempt;
    },
    assertReplayAllowed(attempt) {
      if (attempt) throw new LiveNativeHostRunServiceErrorV01("live_host_scoped_replay_refused", 409);
    },
    assertResumeAllowed() {
      throw new LiveNativeHostRunServiceErrorV01("live_host_scoped_resume_refused", 403);
    },
    createAdapter: (attempt) => createAdapter(requireAttempt(attempt).scope),
    currentAdapter() {
      assertCodexScopedExecutionV01(scoped);
      return createAdapter(scoped.scope);
    },
    roundTripDependencies: (attempt) => ({ scoped_task: requireAttempt(attempt).scope }),
    release: () => releaseCodexScopedTaskV01(scoped.scope),
  };
}
