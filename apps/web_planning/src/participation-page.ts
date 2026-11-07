import type { Access } from './access';
export function participantPage(csrf:string,id:string,a:Access) {
  const root='/api/participation/'+id;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="csrf-token" content="${csrf}"><meta name="participation" content="${id}"><title>Augnes · File request</title><link rel="stylesheet" href="${root}/style.css"><script src="${root}/client.js" defer></script></head><body>
<header><span class="wordmark">augnes / file request</span><a id="signout" href="${a.signout}">Sign out</a></header>
${a.local?'<p class="local-banner">Disposable local fixture · simulated separate email principal</p>':''}
<main id="main"><h1>Contribute to this request</h1><p id="status" role="status">Reading the permitted request…</p>
<section id="request"><h2>Selected originals and brief</h2><p id="brief"></p><p id="conditions"></p><p id="identity"></p><div id="files"></div></section>
<details><summary>Use a local or agent client</summary><p>Use your own existing Cloudflare Access login for this origin. This setup grants no access by itself and contains no credential.</p><a href="${root}/setup" download>Download participant setup</a></details>
<form id="return"><fieldset id="fields"><legend>Send your return</legend><p>One answer is allowed. The owner checks it and decides how to use it.</p>
<label for="message">What did you change or learn?<textarea id="message" required maxlength="500"></textarea></label>
<label for="upload">Returned files<input id="upload" type="file" multiple></label><p>Up to 8 files, 6 MiB each and 7 MiB together.</p>
<label for="review">Or write a review as review.md<textarea id="review" rows="5"></textarea></label>
<fieldset id="edit" hidden><legend>Replace one passage in the selected original</legend><p id="edit-name"></p><label for="find">Exact original passage<textarea id="find"></textarea></label><label for="replacement">Replacement<textarea id="replacement"></textarea></label><button id="cancel-edit" type="button">Use files or a review instead</button></fieldset>
<label for="next">Suggested next action<input id="next" required maxlength="500"></label><p>A private recovery copy of your return is kept in this browser until the save is confirmed. Keep a downloaded copy before closing if access may end.</p><button id="send" type="submit">Send return</button></fieldset></form>
<section id="recovery" hidden><h2>Pending returns in this browser</h2><p>Each return has its own recovery copy. Select and check its outcome before another submission.</p><label for="pending-choice">Pending return<select id="pending-choice"></select></label><pre id="pending-summary"></pre><button id="check">Check this save</button><button id="retry" hidden>Retry this exact save</button><button id="recover">Download recovery copy</button><button id="release" hidden>Keep recovery copy and release stale draft</button></section>
<section><h2>Your saved return</h2><div id="returned"></div></section><section><h2>Feedback shared by the owner</h2><p>Only committed decisions with deliberately shared feedback appear here. No feedback does not mean rejection.</p><div id="feedback"></div><button id="more" hidden>More shared feedback</button></section><button id="refresh">Refresh request and feedback</button>
</main></body></html>`;
}

// No server material or save action: only this recipient's existing local draft.
export function participantRecoveryPage(id:string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="participation" content="${id}"><title>Augnes · Recover your pending return</title><script src="/api/participation/${id}/recovery.js" defer></script></head><body><main><h1>Request access is unavailable</h1><p>The request, originals and feedback cannot be read. A save acknowledgement cannot be checked here; do not assume the pending return was saved or rejected.</p><p id="recovery-status">Checking this browser for your pending return…</p><label for="pending-choice" hidden>Pending return<select id="pending-choice"></select></label><pre id="pending-summary"></pre><button id="recover" hidden>Download local recovery copy</button><p>This copy contains your pending return from this browser only. Keep it private. It does not restore access or replace a submission. Ask the owner to check the original request key before submitting a replacement.</p></main></body></html>`;
}
