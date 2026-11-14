import type { Access } from './access';
import { escape } from './page';
export function continuationPage(s:Access,csrf:string,id:string,manage=false) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="csrf-token" content="${escape(csrf)}"><meta name="workspace" content="${s.workspace_id}"><meta name="project" content="${s.project_id}"><meta name="continuation-id" content="${id}"><meta name="continuation-mode" content="${manage?'manage':'continue'}"><title>${manage?'Delegate a work update':'Continue shared work'} · Augnes</title><link rel="stylesheet" href="/style.css"><script src="/continuation.js" defer></script></head><body>
  <header><a href="/projects">Your projects</a><a href="${escape(s.signout)}">Sign out</a></header><main id="continuation-view">
  <h1>${manage?'Let a successor continue this work.':'Pick up the thread.'}</h1>
  <p id="status" role="status" aria-live="polite"></p><button id="refresh">Read current work</button><p>Open each complete saved record to inspect its purpose and limits, source status, relationships, judgments and next actions. References to other work do not grant access to it.</p><section id="work-context"></section>
  ${manage?`<p>The selected admitted sign-in may read this work's complete history, attached files and reference metadata, and append attributed updates. It cannot change your purpose or selected material, erase work, grant access, or open other work. Other participants' recorded updates are part of this disclosure.</p>
  <form id="grant-form"><fieldset id="grant-fields"><label for="recipient">Admitted sign-in email</label><input type="email" id="recipient" required>
  <label for="obligation">Work to carry forward / unresolved obligation</label><textarea id="obligation" required maxlength="500"></textarea>
  <label for="expires">Access ends</label><input type="datetime-local" id="expires" required>
  <label for="max-updates">Maximum saved updates</label><input id="max-updates" type="number" min="1" max="20" value="3" required>
  <label><input id="disclosure" type="checkbox" required>I permit this sign-in to read this entire work history and its files.</label></fieldset><button id="grant-submit">Create bounded delegation</button></form>
  <button id="grant-reconcile" hidden>Check the pending delegation</button><div id="grants"></div><button id="grants-more" hidden>More delegations</button>`:
  `<p>Read the purpose, sources, earlier updates and unfinished obligations before recording your next step. Reports remain attributed claims. This role grants no model calls, external actions, subdelegation or new execution budget.</p>
  <p id="limits"></p><a id="setup" href="/api/continuation/${id}/setup">Download this continuation setup</a>
  <form id="update-form"><fieldset id="update-fields"><label for="report">What you found or did, with its basis and limits</label><textarea id="report" maxlength="500" required></textarea>
  <label for="next-action">Next meaningful action / remaining obligation</label><textarea id="next-action" maxlength="500" required></textarea></fieldset><button id="update-submit">Save attributed update</button></form>
  <button id="resolve" hidden>Check the pending save</button>`}
  </main></body></html>`;
}
