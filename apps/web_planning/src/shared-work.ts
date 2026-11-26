import { login, requireSharedHomeSchema, type SharedHomeAccess } from './access';
import { fail, hash, UUID } from './contract';
import { escape } from './page';

type SharedItem = {grant_id:string; work_id:string; goal:string; obligation:string};
type SharedPage = {items:SharedItem[]; next:string|null};

export async function receivedWork(home:SharedHomeAccess,cursor:string):Promise<SharedPage> {
  if(cursor && !UUID.test(cursor))fail('invalid_cursor');
  const {DB,env}=home;
  await requireSharedHomeSchema(DB);
  const {results}=await DB.prepare(`SELECT g.grant_id,g.work_id,g.obligation,json_extract(r.envelope,'$.definition.goal') AS goal
    FROM web_planning_continuation g INDEXED BY web_planning_continuation_recipient
    JOIN web_planning_workspace w ON w.workspace_id=g.workspace_id AND w.project_id=g.project_id AND w.owner_login_hash=g.issuer_hash
    JOIN web_planning_revision r ON r.workspace_id=g.workspace_id AND r.project_id=g.project_id AND r.work_id=g.work_id
      AND r.revision=(SELECT MAX(v.revision) FROM web_planning_revision v
        WHERE v.workspace_id=g.workspace_id AND v.project_id=g.project_id AND v.work_id=g.work_id)
    WHERE g.workspace_id=? AND g.recipient_hash=? AND g.grant_id>? AND g.revoked_at IS NULL AND g.expires>?
      AND (w.singleton<>1 OR (w.project_id=? AND w.author_ref=? AND w.owner_login_hash=?))
      AND NOT EXISTS (SELECT 1 FROM web_planning_erased e
        WHERE e.workspace_id=g.workspace_id AND e.project_id=g.project_id AND e.work_id=g.work_id)
    ORDER BY g.grant_id LIMIT 21`)
    .bind(env.WORKSPACE_ID,home.principalHash,cursor,Date.now(),env.PROJECT_ID,env.AUTHOR_REF,hash(login(env.OWNER_EMAIL)!))
    .all<SharedItem>();
  return {items:results.slice(0,20),next:results.length>20?results[19].grant_id:null};
}

export function sharedSection(page:SharedPage,continued:boolean) {
  const items=page.items.map(item=>`<li><a href="/continue/${escape(item.grant_id)}">${escape(item.goal)}</a>
    <p>${escape(item.obligation)}</p><small>Work <code>${escape(item.work_id)}</code></small></li>`).join('');
  const empty=continued?'No more shared work on this page.':'No work has been shared with this email yet.';
  return `<section id="shared-work" aria-labelledby="shared-heading"><h2 id="shared-heading">Shared with you</h2>
    ${items?`<ul>${items}</ul>`:`<p>${empty}</p>`}
    ${page.next?`<a href="/shared-work?cursor=${escape(page.next)}">More shared work</a>`:''}
    <a href="/">${continued?'Back to home':'Refresh home'}</a></section>`;
}

export function sharedHomePage(section:string,signout:string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Your work · Augnes</title><link rel="stylesheet" href="/style.css"></head><body>
    <header><a href="/" class="wordmark">augnes</a><a href="${escape(signout)}">Sign out</a></header>
    <main id="project-entry"><h1>Your work</h1>${section}</main></body></html>`;
}
