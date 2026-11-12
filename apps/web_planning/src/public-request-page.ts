import type { Access } from './access';
import type { PublicRequestView } from './public-requests';
import { escape } from './page';

const publicHeaders = {
  'Cache-Control':'no-store', 'Content-Type':'text/html; charset=utf-8',
  'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
  'X-Frame-Options':'DENY', 'X-Robots-Tag':'noindex, nofollow',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};
const summaryLabels = {
  project:'Project', title:'Request', purpose:'Project purpose', need:'What is needed',
  reason:'Why this is needed', evidence:'Selected evidence and uncertainty',
  expected_return:'Expected return / permitted contribution', checking_use:'Who checks the return and decides its use',
};
function publicPage(value:PublicRequestView):string {
  const details=value.available?value:null;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(details?details.summary.title:'Request unavailable')} · Augnes</title>
  <style>body{font:18px/1.6 system-ui,sans-serif;max-width:48rem;margin:3rem auto;padding:0 1.3rem;color:#1c3035;background:#f5f7f6;overflow-wrap:anywhere}a{color:#075d65}h1{line-height:1.2}dt{font-weight:650;margin-top:1.2rem}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}aside{padding:1rem;border-left:3px solid #527b7b}footer{margin:2rem 0}</style>
  </head><body><header>augnes / project request</header><main>
  <h1>${escape(details?details.summary.title:'This request is not currently available.')}</h1>
  <p><strong>Status: ${escape(value.status)}</strong></p>
  ${details?`<dl>${Object.entries(summaryLabels).map(([key,label])=>`<dt>${label}</dt><dd>${escape(details.summary[key as keyof typeof summaryLabels])}</dd>`).join('')}</dl>
  <h2>Attribution and exact source</h2><p>Project-authorized issuer: <code>${escape(details.issuer.author_ref)}</code></p>
  <p>${escape(details.issuer.authentication)}</p><p>${escape(details.issuer.boundary)}</p>
  <p>Source work <code>${escape(details.source.request.work_id)}</code>, revision ${details.source.request.revision}, fingerprint <code>${escape(details.source.request.fingerprint)}</code>.</p>
  <p>Published <time>${escape(details.source.published_at)}</time>. Public material fingerprint: <code>${escape(details.source.publication_fingerprint)}</code>.</p>
  <p>Publication ends <time>${escape(new Date(details.expires).toISOString())}</time>. Status observed <time>${escape(details.observed_at)}</time>.</p>
  <h2>Where to return it</h2><p>${escape(details.reply.requirements)}</p>
  <p>${details.reply.can_submit?'The designated participant may currently submit under the existing grant.':'New submission is not currently available; this is a historical request.'}</p>
  <p><a href="${escape(details.reply.url)}">Open the authenticated response route</a></p>
  <aside>${escape(details.boundary)}</aside>`:
  '<p>The publication has ended or its source or response authority is unavailable. No selected material is served here. Contact the project through an independently known route; possession of this URL grants no access.</p>'}
  </main><footer><a href="/public-requests/${escape(value.id)}.json">Read the same public record as JSON</a>
  <p>Withdrawal stops this service from serving selected material. It cannot recall copies already shared.</p></footer></body></html>`;
}
export function publicRequestResponse(value:PublicRequestView|{error:string},machine:boolean,status=200):Response {
  return new Response(machine||'error' in value?JSON.stringify(value):publicPage(value),{
    status,headers:{...publicHeaders,...(machine||'error' in value?{'Content-Type':'application/json; charset=utf-8'}:{})},
  });
}

export function publicationPage(s:Access,csrf:string,workId:string):string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="csrf-token" content="${escape(csrf)}"><meta name="workspace" content="${s.workspace_id}"><meta name="project" content="${s.project_id}">
  <meta name="publication-work" content="${workId}"><title>Publish a selected request · Augnes</title><link rel="stylesheet" href="/style.css"><script src="/publications.js" defer></script>
  <meta name="public-response-enabled" content="${s.env.PARTICIPATION_MODE==='verified-recipient-v1'?'true':'false'}">
  </head><body><header><a href="/?project=${s.project_id}">Private project</a><a href="${escape(s.signout)}">Sign out</a></header>
  <main id="publication-view"><h1>Make a project's request understandable outside it.</h1>
  <p>This deliberately publishes only the text you write below and the exact request reference. Project history, files and recipient identity are not automatically copied.
  Anyone with the public URL can read that selected material. Only the already designated participant can submit through the linked response route.</p>
  <p id="status" role="status" aria-live="polite"></p><button id="refresh">Read current requests and publications</button>
  <section id="source-context" aria-label="Private source selection"></section>
  <form id="publication-form"><fieldset id="publication-fields"><legend>Select and review the public material</legend>
  <label for="grant">Existing participant request</label><select id="grant" required><option value="">Choose a request with an active participant grant</option></select>
  <button id="grants-more" type="button" hidden>More participant grants</button>
  <p id="grant-context"></p>
  ${Object.entries(summaryLabels).map(([key,label])=>`<label for="summary-${key}">${label} — public text</label><textarea id="summary-${key}" maxlength="500" required rows="2"></textarea>`).join('')}
  <label for="expires">Public availability ends (no later than the selected response grant)</label><input id="expires" type="datetime-local" required>
  <p>Authorship is attributed to this project's stored principal. Publication does not independently verify the need, the evidence, a human/model identity, or permission to spend or execute.
  Source changes never replace this public text. To change it, withdraw it and explicitly publish a new selection.</p>
  <button id="preview" type="button">Review the exact selected public text</button><pre id="public-preview"></pre>
  <label><input id="confirm-publication" type="checkbox" required>I authorize public reading of this selected text and request reference; I understand that external copies cannot be recalled.</label>
  </fieldset><button id="publication-submit" type="submit">Publish this selected request</button></form>
  <button id="publication-resolve" hidden>Check the pending publication</button>
  <h2>Existing publications</h2><div id="publications"></div><button id="publications-more" hidden>More publications</button>
  </main></body></html>`;
}
