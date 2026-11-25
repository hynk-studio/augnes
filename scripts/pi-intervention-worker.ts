import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { piOfflineSandboxPrefix } from "../lib/vnext/native-host/pi-offline-sandbox";
import { preparePinnedPiExecutableV01 } from "../lib/vnext/native-host/pi-rpc-lifecycle-adapter";
import { readIdlePiSessionV01, readPiRpcRecordsV01 } from "../lib/vnext/native-host/pi-rpc-lifecycle";
import { NativeHostReconciliationRequiredErrorV01 } from "../lib/vnext/native-host/native-host-contract";
import { registerOwnedChild, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";

export type InterventionCase = "baseline" | "finish" | "cancel";
const prompt = "Inspect answer.txt.";
const steering = "Re-read answer.txt before finishing this work.";
const followUp = "After this work, summarize the checked result.";
const firstSample = "first sample", secondSample = "revised sample";
type RpcRecord = Record<string, unknown>;
function object(value: unknown): RpcRecord {
  assert(value && typeof value === "object" && !Array.isArray(value));
  return value as RpcRecord;
}
function textContent(value: unknown): string {
  if (typeof value === "string") return value;
  assert(Array.isArray(value));
  return value.filter(part => part.type === "text").map(part => part.text).join("");
}

export async function exercisePiIntervention(executable: string, scenario: InterventionCase,
  cancellation: AbortSignal, requestCancellation: () => void) {
  assert(process.platform === "linux" && process.arch === "x64", "the isolated Pi intervention requires Linux x64");
  const root = await mkdtemp(path.join(tmpdir(), "augnes-pi-intervention-"));
  const deadline = AbortSignal.timeout(20_000);
  let cleanupConfirmed = true;
  try {
    assert(await preparePinnedPiExecutableV01(executable, path.join(root, "pi"), deadline), "Pi release pin mismatch");
    await copyFile(path.join(__dirname, "fixtures/pi-intervention-provider.mjs"), path.join(root, "provider.mjs"));
    const sample = path.join(root, "answer.txt");
    await writeFile(sample, firstSample + "\n", { flag: "wx" });
    await writeFile(path.join(root, "check.sh"), "", { flag: "wx" });
    const child = spawn("/usr/bin/prlimit", [...piOfflineSandboxPrefix(root),
      "--ro-bind", path.join(root, "provider.mjs"), "/fixture/provider.mjs",
      "--remount-ro", "/", "--chdir", "/workspace", "--", "/bin/pi", "--mode", "rpc", "--offline", "--no-session", "--no-extensions",
      "--no-mcp", "--no-skills", "--no-prompt-templates", "--no-themes", "--no-context-files",
      "--tools", "read", "--extension", "/fixture/provider.mjs", "--model", "augnes-fixture/intervention"],
    { cwd: root, env: { NODE_ENV: "test" }, detached: true, stdio: ["pipe", "pipe", "pipe"] });
    const owned = registerOwnedChild(new Set(), child, { label: "pi-intervention" });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => { stderr = (stderr + chunk.toString("utf8")).slice(-2048); });
    const failure = Promise.withResolvers<never>();
    const stopped = Promise.withResolvers<void>();
    let expectingCancellation = false;
    const onDeadline = () => failure.reject(new Error("Pi intervention deadline expired"));
    const onCancel = () => {
      if (expectingCancellation) stopped.resolve();
      else failure.reject(new Error("Pi intervention interrupted before the cancellation checkpoint"));
    };
    child.stdin.on("error", error => failure.reject(error));
    deadline.addEventListener("abort", onDeadline, { once: true });
    cancellation.addEventListener("abort", onCancel, { once: true });

    const gates = new Map(["initial read", "reread complete"].map(name => [name, Promise.withResolvers<string>()]));
    const seenGates = new Set<string>();
    const settled = Promise.withResolvers<boolean>();
    const responses = new Map<string, { type: string; resolve: (data: unknown) => void }>();
    const trace: string[] = [];
    let turn = 0, checkedTurn: number | undefined, summaryTurn: number | undefined, checkedTurnEnded = false;
    let sequence = 0, settleCount = 0, closing = false;
    function send(record: RpcRecord) {
      child.stdin.write(JSON.stringify(record) + "\n", error => { if (error) failure.reject(error); });
    }
    function call(type: string, fields: RpcRecord = {}): Promise<unknown> {
      const id = String(++sequence);
      const response = Promise.withResolvers<unknown>();
      responses.set(id, { type, resolve: response.resolve });
      send({ type, id, ...fields });
      return response.promise;
    }
    async function consume() {
      for await (const event of readPiRpcRecordsV01(child.stdout)) {
        if (event.type === "response") {
          const id = String(event.id), waiter = responses.get(id);
          assert(waiter && waiter.type === event.command && event.success === true, "invalid Pi reply: " + String(event.command));
          responses.delete(id);
          waiter.resolve(event.data);
        } else if (event.type === "extension_ui_request" && event.method === "confirm") {
          const name = String(event.title), gate = gates.get(name);
          assert(gate && !seenGates.has(name) && typeof event.id === "string", "unexpected provider checkpoint");
          seenGates.add(name);
          gate.resolve(event.id);
        } else if (event.type === "turn_start") {
          turn++;
        } else if (event.type === "turn_end" && turn === checkedTurn) {
          assert(textContent(object(event.message).content).startsWith("Checked: "));
          checkedTurnEnded = true;
        } else if (event.type === "tool_execution_end") {
          assert.equal(event.toolName, "read");
          assert.equal(event.isError, false);
          const content = textContent(object(event.result).content).trim();
          assert((event.toolCallId === "inspect_file" && content === firstSample) ||
            (event.toolCallId === "reread_file" && content === secondSample), "read result did not match the file at that turn");
          trace.push(String(event.toolCallId));
        } else if (event.type === "message_end") {
          const message = object(event.message);
          if (message.role === "user") {
            const text = textContent(message.content);
            assert([prompt, steering, followUp].includes(text));
            if (text === followUp) assert(checkedTurnEnded, "follow-up was consumed before the current check's turn ended");
            trace.push(text === prompt ? "prompt" : text === steering ? "steer" : "follow_up");
          } else if (message.role === "assistant" && message.stopReason === "stop") {
            const text = textContent(message.content);
            assert(text === "Checked: " + (scenario === "baseline" ? firstSample : secondSample) ||
              text === "Summary: " + secondSample, "unexpected check or summary");
            if (text.startsWith("Checked:")) {
              assert(turn > 0);
              checkedTurn = turn;
              trace.push("checked");
            } else {
              assert(checkedTurnEnded && checkedTurn !== undefined && turn > checkedTurn, "summary must complete in a later turn");
              summaryTurn = turn;
              trace.push("summarized");
            }
          } else if (message.role === "assistant") {
            assert(message.stopReason === "toolUse" || (scenario === "cancel" && message.stopReason === "aborted"),
              "unexpected assistant termination: " + String(message.stopReason));
          }
        } else if (event.type === "agent_settled") {
          assert.equal(++settleCount, 1);
          assert.equal(typeof event.aborted, "boolean");
          settled.resolve(event.aborted as boolean);
        }
      }
      assert(closing, "Pi closed early: " + stderr);
    }
    const pump = consume();
    pump.catch(failure.reject);
    async function exchange() {
      const session = readIdlePiSessionV01(await call("get_state"), 0);
      assert.equal(object(await call("prompt", { message: prompt })).disposition, "started");
      const firstGate = await gates.get("initial read")!.promise;
      // The first read has run. A second real read must see different bytes.
      await writeFile(sample, secondSample + "\n", { flag: "r+" });
      if (scenario !== "baseline") {
        // Put the later job in first: FIFO consumption would fail this case.
        assert.equal(object(await call("follow_up", { message: followUp })).disposition, "queued");
        assert.equal(object(await call("steer", { message: steering })).disposition, "queued");
        const active = object(await call("get_state"));
        assert.equal(active.sessionId, session);
        assert.equal(active.isStreaming, true);
        assert.equal(active.pendingMessageCount, 2);
      }
      send({ type: "extension_ui_response", id: firstGate, confirmed: true });
      if (scenario !== "baseline") {
        const secondGate = await gates.get("reread complete")!.promise;
        assert.deepEqual(trace, ["prompt", "inspect_file", "steer", "reread_file"]);
        if (scenario === "cancel") {
          expectingCancellation = true;
          requestCancellation();
          await stopped.promise;
          assert.deepEqual(await call("clear_queue"), { steering: [], followUp: [followUp] });
          trace.push("follow_up_recovered");
          await call("abort");
        } else {
          send({ type: "extension_ui_response", id: secondGate, confirmed: true });
        }
      }
      assert.equal(await settled.promise, scenario === "cancel");
      const final = object(await call("get_state"));
      assert.equal(final.sessionId, session);
      assert.equal(final.pendingMessageCount, 0);
      assert.equal(final.isStreaming, false);
      assert.equal(final.isCompacting, false);
      closing = true;
      child.stdin.end();
      await pump;
      assert.deepEqual(await owned.closePromise, { code: 0, signal: null }, stderr);
      const expected = scenario === "baseline" ? ["prompt", "inspect_file", "checked"] :
        ["prompt", "inspect_file", "steer", "reread_file", ...(scenario === "cancel"
          ? ["follow_up_recovered"] : ["checked", "follow_up", "summarized"])];
      assert.deepEqual(trace, expected);
      assert.equal(await readFile(sample, "utf8"), secondSample + "\n");
      return { session, trace, checkedTurn, summaryTurn };
    }
    try {
      if (deadline.aborted) onDeadline();
      if (cancellation.aborted) onCancel();
      return await Promise.race([failure.promise, exchange()]);
    } finally {
      deadline.removeEventListener("abort", onDeadline);
      cancellation.removeEventListener("abort", onCancel);
      closing = true;
      child.stdin.end();
      try {
        if (!owned.closed) await Promise.race([owned.closePromise, delay(250, undefined, { ref: false })]);
        await terminateOwnedProcessTree(owned);
      } catch {
        cleanupConfirmed = false;
        throw new NativeHostReconciliationRequiredErrorV01("pi_intervention_cleanup_unconfirmed");
      }
    }
  } finally {
    if (cleanupConfirmed) await rm(root, { recursive: true, force: true });
  }
}
