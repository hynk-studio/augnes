import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build } from "esbuild";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import fixture from "../fixtures/public-first-read-tool-library.v0.1.json";

async function main() {
const root = mkdtempSync(path.join(tmpdir(), "augnes-public-read-"));
// Disposable byte guards; no retained product database is opened. The import
// closure below separately proves that no persistence/session owner is reachable.
for (const name of ["product.db", "canonical.db", "sessions.db"]) {
  writeFileSync(path.join(root, name), `disposable private guard: ${name}`);
}
const snapshot = () => readdirSync(root).sort().map((name) => [name,
  createHash("sha256").update(readFileSync(path.join(root, name))).digest("hex")]);
const before = snapshot();
const network = installZeroNetworkGuard();
try {
  const { renderPublicFirstReadV01: render } = await import("../lib/vnext/adapters/public-first-read");
  const route = await import("../app/public-cases/[artifact]/route");
  const result = render(fixture);
  assert.deepEqual(render(structuredClone(fixture)), result);
  assert.deepEqual(render(Object.fromEntries(Object.entries(fixture).reverse())), result,
    "input key order must not change output");
  assert.deepEqual(JSON.parse(result.json), result.content);
  assert.equal(result.content.claims.length, 4);
  assert.equal(result.content.sources.length, 3);
  assert.deepEqual([...new Set(result.content.claims.map((claim) => claim.state))].sort(),
    ["confirmed", "rejected", "unconfirmed"]);
  const moreCitations = structuredClone(fixture);
  moreCitations.claims[2].source_ids = [];
  assert.equal(render(moreCitations).content.claims[2].state, "unconfirmed");
  moreCitations.claims[0].source_ids = [];
  assert.equal(render(moreCitations).content.claims[0].state, "confirmed",
    "state is authored, never inferred from citation count");

  const decode = (value: string) => value.replaceAll("&lt;", "<").replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
  const body = result.html.match(/<body>([\s\S]*)<\/body>/u)![1];
  const visible = decode(body.replace(/<[^>]+>/gu, " "));
  const markdownText = decode(result.markdown.replace(/\\([\\`*_{}[\]()#+.!|>~-])/gu, "$1"));
  const strings = (value: unknown): string[] => typeof value === "string" ? [value]
    : value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];
  for (const value of strings(result.content)) {
    assert.ok(visible.includes(value), "every JSON semantic value is visible in the HTML body");
    assert.ok(markdownText.includes(value), "every JSON semantic value is readable in Markdown");
  }
  for (const claim of result.content.claims) {
    const section = body.match(new RegExp(`<section id="claim-${claim.id}">([\\s\\S]*?)</section>`))![1];
    assert.ok(section.includes(`Augnes review state: ${claim.state}`));
    for (const sourceId of claim.source_ids) assert.ok(section.includes(`href="#source-${sourceId}"`));
  }
  for (const source of result.content.sources) assert.ok(body.includes(`id="source-${source.id}"`));
  assert.doesNotMatch(result.html, /<script\b|<iframe\b|<form\b|\son\w+=|\ssrc=|display\s*:\s*none|visibility\s*:\s*hidden/iu);

  const responses = new Map<string, string>();
  for (const { artifact } of route.generateStaticParams()) {
    const request = new Request(`http://127.0.0.1/public-cases/${artifact}?project_id=private-guard`, {
      headers: { cookie: "private-session-guard", authorization: "Bearer disposable-guard" },
    });
    const response = await route.GET(request, { params: Promise.resolve({ artifact }) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.has("set-cookie"), false);
    assert.ok(response.headers.get("content-security-policy")?.includes("default-src 'none'"));
    const value = await response.text();
    assert.doesNotMatch(value, /private-guard|private-session-guard|disposable-guard/u);
    responses.set(artifact, value);
  }
  assert.deepEqual([...responses.values()], [result.html, result.markdown, result.json]);
  for (const artifact of ["other-project", "../canonical.db", "__proto__", "constructor", `${fixture.case_id}.xml`]) {
    const response = await route.GET(new Request("http://127.0.0.1/"), { params: Promise.resolve({ artifact }) });
    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Not found\n");
  }
  assert.equal(route.dynamic, "force-static");
  assert.equal(route.dynamicParams, false);

  let refusals = 0;
  const refused = (input: unknown) => {
    assert.throws(() => render(input), { message: "public_first_read_invalid" });
    refusals++;
  };
  const change = (mutate: (value: typeof fixture) => void) => {
    const candidate = structuredClone(fixture); mutate(candidate); refused(candidate);
  };
  for (const field of ["project_id", "workspace_id", "account_id", "local_path", "session", "token", "cookie",
    "private_notes", "selected_source_context", "research_history", "raw_prompt", "hidden_reasoning",
    "ReviewDecision", "Transition", "execution", "source_binding"]) {
    refused({ ...fixture, [field]: "disposable-private-material" });
    change((candidate) => Object.assign(candidate.claims[0], { [field]: "disposable-private-material" }));
    change((candidate) => Object.assign(candidate.sources[0], { [field]: "disposable-private-material" }));
  }
  for (const input of [null, [], {}, { private_notes: "disposable-private-material" }, Object.create(fixture)]) refused(input);
  const getter = structuredClone(fixture);
  Object.defineProperty(getter, "title", { get() { throw new Error("getter must not run"); } });
  refused(getter);
  change((candidate) => { candidate.schema = "unknown"; });
  change((candidate) => { candidate.reviewed_at = "2026-02-30T00:00:00.000Z"; });
  change((candidate) => { candidate.title = "x".repeat(161); });
  change((candidate) => { candidate.claims = Array(9).fill(candidate.claims[0]); });
  change((candidate) => { candidate.sources = Array(7).fill(candidate.sources[0]); });
  change((candidate) => { candidate.unresolved = Array(9).fill("Unknown"); });
  change((candidate) => { candidate.claims[0].state = "approved"; });
  change((candidate) => { candidate.claims[0].source_ids = ["missing"]; });
  change((candidate) => { candidate.claims[0].source_ids = ["arrival-counts", "arrival-counts"]; });
  change((candidate) => { candidate.claims[1].id = candidate.claims[0].id; });
  change((candidate) => { candidate.sources[1].id = candidate.sources[0].id; });
  change((candidate) => { candidate.sources[0].material = "x".repeat(2001); });
  change((candidate) => { candidate.summary = "界".repeat(2000); candidate.question = "界".repeat(2000); });
  for (const material of ["/Users/disposable/private.txt", "file:///private/example", "C:\\Users\\Disposable\\note",
    "token=disposable", "Cookie: disposable", "Authorization: Bearer disposable", "account_id=disposable",
    "reader@example.invalid", "sk-disposable000000000000000000", "https://internal.example/private"]) {
    change((candidate) => { candidate.summary = material; });
  }
  const hostile = structuredClone(fixture);
  hostile.claims[0].statement = '<img src="x" onerror="alert(1)"> & [click](javascript:alert(1))';
  const escaped = render(hostile);
  assert.doesNotMatch(escaped.html, /<img/u);
  assert.ok(escaped.markdown.includes("&lt;img"));
  assert.ok(escaped.markdown.includes("\\[click\\]\\(javascript:alert\\(1\\)\\)"));

  // Close the actual transitive production import graph. An added state owner,
  // file read, fetch implementation or secret/env loader requires a new audit.
  const bundle = await build({ entryPoints: ["app/public-cases/[artifact]/route.ts"], bundle: true,
    platform: "node", format: "esm", write: false, metafile: true, logLevel: "silent" });
  assert.deepEqual(Object.keys(bundle.metafile!.inputs).sort(), [
    "app/public-cases/[artifact]/route.ts", "fixtures/public-first-read-tool-library.v0.1.json",
    "lib/privacy/redaction-guard.ts", "lib/vnext/adapters/public-first-read.ts", "lib/vnext/protocol-primitives.ts",
    "lib/vnext/repository-relative-path.ts", "lib/vnext/strict-iso-timestamp.ts", "types/vnext/external-ref.ts",
  ].sort());
  assert.deepEqual([...new Set(Object.values(bundle.metafile!.outputs).flatMap((output) =>
    output.imports.map((item) => item.path)))].sort(), ["node:crypto", "node:path"]);
  assert.doesNotMatch(bundle.outputFiles[0].text, /process\.env|\bfetch\s*\(|\bDate\.now\s*\(/u);
  assert.deepEqual(snapshot(), before);
  assert.deepEqual(network.attempts, []);
  console.log(JSON.stringify({ public_first_read: "pass", no_js: "actual_GET_Response_body",
    representations: 3, claims: 4, sources: 3, semantic_parity: true, deterministic: true,
    malformed_private_budget_refusals: refusals, external_provider_model_attempts: 0,
    persistence_session_imports: 0, disposable_state_bytes_changed: 0 }));
} finally {
  network.restore();
  rmSync(root, { recursive: true, force: true });
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
