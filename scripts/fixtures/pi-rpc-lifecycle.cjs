// Launched only by the scripted transport checks, never by the pinned adapter.
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { createInterface } = require("node:readline");
const scenario = fs.readFileSync("scenario", "utf8");
fs.writeFileSync("leader", String(process.pid));
const lines = createInterface({ input: process.stdin });
const sessionId = "10000000-0000-4000-8000-000000000001";
const queue = [];
if (scenario === "cancel") {
  const child = spawn(process.execPath, ["-e", "process.stdin.resume()"], { stdio: ["pipe", "ignore", "ignore"] });
  fs.writeFileSync("descendant", String(child.pid));
  lines.once("close", () => child.stdin.end());
}
function send(record) { process.stdout.write(JSON.stringify(record) + "\n"); }
lines.on("line", line => {
  const { type, id, message } = JSON.parse(line);
  fs.appendFileSync("commands", type + "\n");
  let data;
  switch (type) {
    case "get_state":
      data = { sessionId, pendingMessageCount: queue.length, isStreaming: false, isCompacting: false, messageCount: 0 };
      break;
    case "follow_up":
      if (scenario !== "handled") queue.push(message);
      if (scenario === "unexpected-run") send({ type: "agent_end", messages: [] });
      data = { disposition: scenario === "handled" ? "handled" : "queued" };
      break;
    case "clear_queue":
      if (scenario === "lost-reply") { process.exit(0); }
      if (scenario === "stalled-stop") return;
      data = { steering: [], followUp: scenario === "wrong-queue" ? [] : queue.splice(0) };
      break;
    case "abort": break;
    default: process.exitCode = 2; return;
  }
  send({ type: "response", id: scenario === "wrong-id" ? "foreign" : id, command: type, success: true, data });
});
