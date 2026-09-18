import { detectPrivacyRedactionRuntimeGuardFindingsV01 } from "@/lib/privacy/redaction-guard";
import { canonicalizeProtocolValueV01, parseStrictIsoTimestampV01 } from "@/lib/vnext/protocol-primitives";
import { containsPublicTextLocalPathV01 } from "@/lib/vnext/repository-relative-path";

export const PUBLIC_FIRST_READ_SCHEMA_V01 = "augnes.public-first-read.v0.1";
export const PUBLIC_FIRST_READ_LIMITS_V01 = Object.freeze({
  bytes: 16_000, claims: 8, sources: 6, unresolved: 8, text: 2_000,
});
const STATES = ["confirmed", "unconfirmed", "rejected"] as const;
type ClaimState = (typeof STATES)[number];
const STATE_MEANINGS = {
  confirmed: "Supported within this fictional case's stated evidence and assumptions; citation presence or count alone never confirms a claim.",
  unconfirmed: "Not established by this review; this does not mean false.",
  rejected: "This review does not accept the stated claim; its source material remains available.",
} as const;
const BOUNDARY = "Non-authoritative public reading artifact. These are authored Augnes review labels for one fictional, disposable case, not canonical accepted state, approval, or semantic or execution authority. Reading or exporting changes no product state. Review is bounded to the reviewed-at timestamp; continuous freshness and real-world results are not established.";
const SOURCE_LABEL = "Fictional source material, not Augnes review state";

function refuse(): never { throw new Error("public_first_read_invalid"); }

function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))) refuse();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).length !== keys.length ||
    keys.some((key) => !descriptors[key] || !("value" in descriptors[key]))) refuse();
  return value as Record<string, unknown>;
}

function text(value: unknown, max: number = PUBLIC_FIRST_READ_LIMITS_V01.text): string {
  if (typeof value !== "string" || !value || value !== value.trim() || value.length > max ||
    /[\u0000-\u001f\u007f]/u.test(value) || containsPublicTextLocalPathV01(value) ||
    /\b(?:cookie|authorization|token|secret|account_id|session_id|OPENAI_API_KEY|GITHUB_TOKEN)\s*[:=]/iu.test(value) ||
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}/iu.test(value) ||
    detectPrivacyRedactionRuntimeGuardFindingsV01(value).some((finding) => finding.action !== "allowed")) refuse();
  return value;
}

function id(value: unknown): string {
  const result = text(value, 80);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(result)) refuse();
  return result;
}

function list<T>(value: unknown, max: number, parse: (item: unknown) => T, min = 1): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) refuse();
  return Array.from(value, parse);
}

function unique(values: string[]): void {
  if (new Set(values).size !== values.length) refuse();
}

/** Closed public DTO, never a serializer of retained work or a privacy classifier.
 * The only production caller supplies the committed fictional case. No DB,
 * session, environment, clock, filesystem, provider or transport input exists.
 * Lexical guards are defense in depth; arbitrary private prose is not publishable.
 */
function project(input: unknown) {
  const root = record(input, ["schema", "case_id", "title", "question", "reviewed_at", "summary", "claims", "sources", "unresolved"]);
  if (root.schema !== PUBLIC_FIRST_READ_SCHEMA_V01) refuse();
  const reviewedAt = text(root.reviewed_at, 24);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(reviewedAt) || parseStrictIsoTimestampV01(reviewedAt) === null) refuse();
  const sources = list(root.sources, PUBLIC_FIRST_READ_LIMITS_V01.sources, (item) => {
    const source = record(item, ["id", "title", "material"]);
    const sourceId = id(source.id);
    return { id: sourceId, ref: `#source-${sourceId}`, label: SOURCE_LABEL,
      title: text(source.title, 160), material: text(source.material) };
  });
  unique(sources.map((source) => source.id));
  const claims = list(root.claims, PUBLIC_FIRST_READ_LIMITS_V01.claims, (item) => {
    const claim = record(item, ["id", "statement", "state", "review_note", "source_ids"]);
    if (!STATES.includes(claim.state as ClaimState)) refuse();
    const sourceIds = list(claim.source_ids, PUBLIC_FIRST_READ_LIMITS_V01.sources, id, 0);
    unique(sourceIds);
    if (sourceIds.some((sourceId) => !sources.some((source) => source.id === sourceId))) refuse();
    return { id: id(claim.id), statement: text(claim.statement), state: claim.state as ClaimState,
      review_note: text(claim.review_note), source_ids: sourceIds };
  }, 2);
  unique(claims.map((claim) => claim.id));
  const result = {
    schema: PUBLIC_FIRST_READ_SCHEMA_V01,
    data_kind: "fictional_disposable" as const,
    case_id: id(root.case_id), title: text(root.title, 160), question: text(root.question),
    reviewed_at: reviewedAt, summary: text(root.summary),
    publication_boundary: BOUNDARY, state_meanings: { ...STATE_MEANINGS },
    claims, sources, unresolved: list(root.unresolved, PUBLIC_FIRST_READ_LIMITS_V01.unresolved, (item) => text(item)),
  };
  if (Buffer.byteLength(canonicalizeProtocolValueV01(result), "utf8") > PUBLIC_FIRST_READ_LIMITS_V01.bytes) refuse();
  return result;
}

export type PublicFirstReadV01 = ReturnType<typeof project>;

// All prose is literal. No raw HTML, Markdown, URL or executable content input.
function html(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function markdown(value: string): string {
  return value.replace(/[\\`*_{}[\]()#+.!|>~-]/gu, "\\$&").replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

export function renderPublicFirstReadV01(input: unknown) {
  const content = project(input);
  const p = (value: string) => `<p>${html(value)}</p>`;
  const sourceLinks = (ids: string[]) => ids.map((sourceId) => {
    const source = content.sources.find((candidate) => candidate.id === sourceId)!;
    return `<a href="${source.ref}">${html(source.id)}: ${html(source.title)}</a>`;
  }).join("; ") || "None";
  const body = `<main><article>
<header><p>Augnes public reading case · Fictional and disposable</p><h1>${html(content.title)}</h1>
${p(`Case: ${content.case_id}`)}${p(`Format: ${content.schema}`)}${p(`Data kind: ${content.data_kind}`)}
<p>Reviewed at: <time datetime="${content.reviewed_at}">${content.reviewed_at}</time></p></header>
<section><h2>Question</h2>${p(content.question)}</section>
<section><h2>Current summary</h2>${p(content.summary)}</section>
<section><h2>Publication boundary</h2>${p(content.publication_boundary)}</section>
<section><h2>Augnes review state</h2><dl>${STATES.map((state) => `<dt>${state}</dt><dd>${html(content.state_meanings[state])}</dd>`).join("")}</dl></section>
<section><h2>Claims and findings</h2>${content.claims.map((claim) => `<section id="claim-${claim.id}"><h3>${html(claim.statement)}</h3>${p(`Claim: ${claim.id}`)}${p(`Augnes review state: ${claim.state}`)}${p(claim.review_note)}<p>Source references: ${sourceLinks(claim.source_ids)}</p></section>`).join("\n")}</section>
<section><h2>Source material</h2>${content.sources.map((source) => `<section id="source-${source.id}"><h3>${html(source.title)}</h3>${p(`Source: ${source.id}`)}${p(`Reference: ${source.ref}`)}${p(source.label)}${p(source.material)}</section>`).join("\n")}</section>
<section><h2>Unresolved and unknown</h2><ul>${content.unresolved.map((item) => `<li>${html(item)}</li>`).join("")}</ul></section>
<footer><p>Equivalent formats: <a href="${content.case_id}.md">Markdown</a> · <a href="${content.case_id}.json">JSON</a></p></footer>
</article></main>`;
  const document = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${html(content.title)}</title><meta name="description" content="${html(content.summary)}">
<style>body{margin:0;background:#f7f6f1;color:#202923;font:18px/1.65 system-ui,sans-serif}main{max-width:760px;margin:auto;padding:48px 24px}h1{font-size:2.1rem;line-height:1.2}h2{margin-top:2.4rem}h3{font-size:1.2rem}a{color:#175c48}dt{font-weight:700}dd{margin:0 0 1rem}section section{border-top:1px solid #ccd4cd;padding-top:1rem}footer{margin-top:3rem}p,li,dd{overflow-wrap:anywhere}</style>
</head><body>${body}</body></html>\n`;
  const lines = [
    `# ${markdown(content.title)}`, `Case: ${content.case_id}`, `Format: ${content.schema}`,
    `Data kind: ${content.data_kind}`, `Reviewed at: ${content.reviewed_at}`,
    "## Question", markdown(content.question), "## Current summary", markdown(content.summary),
    "## Publication boundary", markdown(content.publication_boundary), "## Augnes review state",
    ...STATES.map((state) => `- **${state}**: ${markdown(content.state_meanings[state])}`),
    "## Claims and findings",
    ...content.claims.flatMap((claim) => [
      `### ${markdown(claim.statement)}`, `Claim: ${claim.id}`, `Augnes review state: **${claim.state}**`,
      markdown(claim.review_note), `Source references: ${claim.source_ids.map((sourceId) => {
        const source = content.sources.find((candidate) => candidate.id === sourceId)!;
        return `[${source.id}: ${markdown(source.title)}](${source.ref})`;
      }).join("; ") || "None"}`,
    ]),
    "## Source material",
    ...content.sources.flatMap((source) => [
      `<a id="source-${source.id}"></a>`, `### ${markdown(source.title)}`, `Source: ${source.id}`,
      `Reference: ${source.ref}`, markdown(source.label), markdown(source.material),
    ]),
    "## Unresolved and unknown", ...content.unresolved.map((item) => `- ${markdown(item)}`),
  ];
  return { content, html: document, markdown: `${lines.join("\n\n")}\n`,
    json: `${canonicalizeProtocolValueV01(content)}\n` };
}
