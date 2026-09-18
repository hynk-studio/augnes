import fictionalCase from "@/fixtures/public-first-read-tool-library.v0.1.json";
import { renderPublicFirstReadV01 } from "@/lib/vnext/adapters/public-first-read";

// Exactly one committed case. There is no user-data input or project lookup.
export const dynamic = "force-static";
export const dynamicParams = false;
const rendered = renderPublicFirstReadV01(fictionalCase);
const artifacts = new Map([
  [rendered.content.case_id, { body: rendered.html, type: "text/html" }],
  [`${rendered.content.case_id}.md`, { body: rendered.markdown, type: "text/markdown" }],
  [`${rendered.content.case_id}.json`, { body: rendered.json, type: "application/json" }],
]);

export function generateStaticParams() {
  return [...artifacts.keys()].map((artifact) => ({ artifact }));
}

export async function GET(_request: Request, context: { params: Promise<{ artifact: string }> }) {
  const artifact = artifacts.get((await context.params).artifact);
  return new Response(artifact?.body ?? "Not found\n", {
    status: artifact ? 200 : 404,
    headers: {
      "Content-Type": `${artifact?.type ?? "text/plain"}; charset=utf-8`,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
