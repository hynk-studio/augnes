import { sharedHomeEnabled, type Access } from './access';
import { escape } from './page';
export function continuationPage(s:Access,csrf:string,id:string,mode:'manage'|'continue'|'read-only') {
  const manage=mode==='manage',readOnly=mode==='read-only';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="csrf-token" content="${escape(csrf)}"><meta name="workspace" content="${s.workspace_id}"><meta name="project" content="${s.project_id}"><meta name="continuation-id" content="${id}"><meta name="continuation-mode" content="${mode}"><title>${manage?'Share work':readOnly?'Read shared work':'Continue shared work'} · Augnes</title><link rel="stylesheet" href="/style.css"><script src="/continuation.js" defer></script></head><body>
  <header><a href="/projects">${!manage && sharedHomeEnabled(s.env)?'Shared work':'Your projects'}</a><a href="${escape(s.signout)}">Sign out</a></header><main id="continuation-view"${manage?'':' class="recipient-work"'}>
  ${manage?'<h1>Share this work</h1>':''}
  <p id="status" role="status" aria-live="polite"></p>
  ${manage?'<button id="refresh">Read current work</button><p>Open each complete saved record to inspect its purpose and limits, source status, relationships, judgments and next actions. References to other work do not grant access to it.</p>':''}
  <section id="work-context">${manage?'':'<h1>Shared work</h1>'}</section>
  ${manage?`<p>Both permissions include this work’s complete history, attached files and reference metadata. You choose whether the recipient can also append attributed updates. The recipient cannot change your purpose or selected material, erase work, grant access, or open other work. Other participants' recorded updates are part of this disclosure.</p>
  ${sharedHomeEnabled(s.env)?'<p>The recipient can sign in with this email and find the work on their home page.</p>':''}
  <form id="grant-form"><fieldset id="grant-fields"><label for="recipient">${sharedHomeEnabled(s.env)?'Recipient email':'Admitted sign-in email'}</label><input type="email" id="recipient" required>
  <label for="obligation">Purpose of sharing or work to carry forward</label><textarea id="obligation" required maxlength="500"></textarea>
  <label for="expires">Access ends</label><input type="datetime-local" id="expires" required>
  <label for="grant-permission">Permission</label><select id="grant-permission"><option value="continue">Read and add updates</option><option value="read-only">Read only</option></select>
  <div id="update-allowance"><label for="max-updates">Maximum saved updates</label><input id="max-updates" type="number" min="1" max="20" value="3" required></div>
  <label><input id="disclosure" type="checkbox" required>I permit this sign-in to read this entire work history and its files.</label></fieldset><button id="grant-submit">Share work</button></form>
  <button id="grant-reconcile" hidden>Check the pending delegation</button><div id="grants"></div><button id="grants-more" hidden>More delegations</button>`:
  `${readOnly?'':`<form id="update-form"><h2>Record an update</h2><p>Your report is attributed to your sign-in. This permission grants no model calls, external actions, subdelegation or new execution budget.</p>
  <fieldset id="update-fields" disabled><label for="report">What you found or did, with its basis and limits</label><textarea id="report" maxlength="500" required></textarea>
  <label for="next-action">Next meaningful action / remaining obligation</label><textarea id="next-action" maxlength="500" required></textarea></fieldset><button id="update-submit" disabled>Save attributed update</button></form>
  <button id="resolve" hidden>Check the pending save</button>`}
  <button id="refresh">Read current work</button> <a id="setup" href="/api/continuation/${id}/setup">Download this continuation setup</a>`}
  </main></body></html>`;
}
