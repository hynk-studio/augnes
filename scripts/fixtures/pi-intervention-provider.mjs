// Deterministic responses for the isolated Pi integration case. Pi owns the
// agent loop, the read tool, queue selection and cancellation. No network I/O.
import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";

const file = "answer.txt";
const inspect = "Inspect answer.txt.";
const steer = "Re-read answer.txt before finishing this work.";
const followUp = "After this work, summarize the checked result.";

function textOf(content) {
  return typeof content === "string" ? content :
    content.filter(part => part.type === "text").map(part => part.text).join("");
}

export default function interventionFixture(pi) {
  let ui;
  pi.on("session_start", (_event, context) => { ui = context.ui; });
  pi.on("tool_result", async (event, context) => {
    if (event.toolCallId === "inspect_file") {
      await context.ui.confirm("initial read", "Release the first file read.");
    }
  });

  pi.registerProvider("augnes-fixture", {
    baseUrl: "http://127.0.0.1", apiKey: "offline-fixture", api: "augnes-scripted",
    models: [{ id: "intervention", name: "Offline intervention fixture", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 256 }],
    streamSimple(model, context, options) {
      const stream = createAssistantMessageEventStream();
      const message = { role: "assistant", content: [], provider: model.provider, api: model.api, model: model.id,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
        timestamp: Date.now(), stopReason: "stop" };
      async function respond() {
        const messages = context.messages.filter(item => item.role !== "system");
        const last = messages.at(-1);
        const prompt = last?.role === "user" ? textOf(last.content) : null;
        if (prompt === inspect || prompt === steer) {
          message.stopReason = "toolUse";
          message.content.push({ type: "toolCall", id: prompt === inspect ? "inspect_file" : "reread_file",
            name: "read", arguments: { path: file } });
        } else if (last?.role === "toolResult" && !last.isError) {
          if (last.toolCallId === "reread_file") {
            await ui.confirm("reread complete", "Release the checked result.", { signal: options?.signal });
            options?.signal?.throwIfAborted();
          }
          message.content.push({ type: "text", text: "Checked: " + textOf(last.content).trim() });
        } else if (prompt === followUp) {
          const prior = messages.findLast(item => item.role === "assistant" && textOf(item.content).startsWith("Checked: "));
          if (!prior) throw new Error("No completed check to summarize");
          message.content.push({ type: "text", text: "Summary: " + textOf(prior.content).slice("Checked: ".length) });
        } else {
          throw new Error("Unexpected intervention fixture input");
        }
        stream.push({ type: "done", reason: message.stopReason, message });
      }
      respond().catch(error => {
        message.stopReason = options?.signal?.aborted ? "aborted" : "error";
        message.errorMessage = String(error);
        stream.push({ type: "error", reason: message.stopReason, error: message });
      }).finally(() => stream.end());
      return stream;
    },
  });
}
