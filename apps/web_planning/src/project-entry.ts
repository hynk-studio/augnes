import type { Access } from './access';
import { escape } from './page';

export function projectEntryPage(csrf:string,a:Access){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="csrf-token" content="${escape(csrf)}"><title>Your private projects · Augnes</title><link rel="stylesheet" href="/style.css"><script src="/projects.js" defer></script></head><body>
  <header><a href="/projects" class="wordmark">augnes<span> / your projects</span></a><a href="${escape(a.signout)}">Sign out</a></header>
  ${a.local?'<p class="local-banner">Disposable controlled identities · not hosted independent-user adoption</p>':''}
  <main id="project-entry"><h1>Continue your own work.</h1><p>Your projects are private to this admitted sign-in. Contributing to another request neither creates nor controls them. Each project retains its own stable author attribution across sessions.</p>
  <p id="project-status" role="status" aria-live="polite"></p><ul id="projects"></ul><button id="projects-more" hidden>More projects</button><button id="projects-refresh">Refresh projects</button>
  <details><summary>Create a continuing project</summary><p>This starts ordinary authored work, not accepted truth or execution authority. You can also keep standalone tasks inside any selected project.</p>
  <form id="project-create"><fieldset id="project-fields">
  <label for="project-name">Project name</label><input id="project-name" required maxlength="120">
  <label for="project-purpose">Continuing purpose</label><textarea id="project-purpose" required maxlength="2000"></textarea>
  <label for="project-judgment">Current judgment (your interpretation)</label><textarea id="project-judgment" required maxlength="2000"></textarea>
  <label for="project-source">Source / attribution for that judgment</label><input id="project-source" required maxlength="256">
  <label for="project-unfinished">Unfinished work or open question</label><textarea id="project-unfinished" required maxlength="500"></textarea>
  <label for="project-next">Next meaningful action</label><textarea id="project-next" required maxlength="500"></textarea><p class="hint">The initial work uses this next action as its first success criterion. You can revise its criteria and notes through the ordinary editor.</p>
  </fieldset><button type="submit" id="project-submit">Create private project</button></form></details>
  </main></body></html>`;
}
