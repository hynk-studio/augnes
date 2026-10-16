import { SCENE_FILE, type SceneNotebook } from "./scene-contract";
import { type Revision } from "./contract";
import { decodeFile, verifiedBodies } from "./files";
import { escape } from "./page";

// A reading copy, never an import or a new authority/record. Complete recovery
// uses the fingerprinted work export or the bounded two-direction closure.
export function readableExport(chain: Revision[], bodies: unknown): string {
  const files = verifiedBodies(chain, bodies);
  const list = (values: string[]) => `<ul>${values.map(v => `<li>${escape(v)}</li>`).join("")}</ul>`;
  const contents = files.map(file => {
    const names = [...new Set(chain.flatMap(r => r.files?.filter(f => f.digest === file.digest).map(f => f.name) ?? []))];
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(decodeFile(file.data));
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) throw new Error("binary");
      if(names.includes(SCENE_FILE)){
        const book=JSON.parse(text) as SceneNotebook;
        const scenes=[...(book.inheritance?.scenes??[]),...book.scenes].map(s=>`<article><h3>${escape(s.title)}</h3>${book.inheritance?.scenes.includes(s)?`<p>Inherited from ${escape(book.inheritance.source.work_id)} at revision ${book.inheritance.source.revision}; original review attribution, not a new branch adoption.</p>`:""}<p>Viewpoint: ${escape(s.viewpoint)} · fictional event ${s.event_time} · reveal ${s.reveal_order}. Original source basis: revision ${s.basis.revision}, <code>${s.basis.fingerprint}</code>.</p><h4>Exact scene draft — prose, not adoption</h4><pre>${escape(s.draft)}</pre><h4>Consequential proposals and dispositions</h4><ul>${s.proposals.map((p,i)=>`<li><strong>${s.review?.dispositions[i]??"undecided"}</strong> · ${p.kind} · ${escape(p.subject)} · fictional event ${p.event_time} / reveal ${p.reveal_order}<pre>${escape(p.text)}</pre>${p.revises?.length?`<p>Explicit retroactive reinterpretation at the same fictional positions:</p><pre>${escape(JSON.stringify(p.revises))}</pre>`:""}${p.requires?.length?`<p>Required context:</p><pre>${escape(JSON.stringify(p.requires))}</pre>`:""}</li>`).join("")}</ul>${s.review?`<p>Review reason: ${escape(s.review.reason)}<br>Author attribution: ${s.review.author_ref}<br>Reviewed revision ${s.review.basis.revision}: <code>${s.review.basis.fingerprint}</code></p>`:"<p>Unreviewed draft. No proposals adopted.</p>"}</article>`).join("");
        text=scenes+(book.adoptions??[]).map(a=>`<article><h3>Explicit selection into this scope</h3><p>${escape(a.reason)} · author ${escape(a.author_ref)} · target basis ${a.target.revision}; source ${escape(a.source.work_id)} revision ${a.source.revision}</p>${a.units.map((u,i)=>`<p>${a.dispositions[i]} here · ${u.disposition} in source · ${escape(u.proposal.kind)}</p><pre>${escape(u.proposal.text)}</pre>`).join("")}<p>Source prose was not adopted.</p></article>`).join("")+`<details><summary>Exact scene notebook bytes as text</summary><pre>${escape(text)}</pre></details>`;
      }else text = `<pre>${escape(text)}</pre>`;
    } catch {
      text = "<p>Binary or non-UTF-8 material. Exact bytes are included in the separate complete recovery file.</p>";
    }
    return `<section id="${file.digest.slice(7)}"><h2>${escape(names.join(" · "))}</h2><p>${file.bytes} bytes · <code>${file.digest}</code></p>${text}</section>`;
  });
  const revisions = chain.map(r => `<section><h2>Revision ${r.revision} · ${escape(r.definition.goal)}</h2>
    <p>${escape(r.recorded_at)} · author attribution: ${escape(r.author_ref)}</p>
    <p>Revision identity: <code>${r.fingerprint}</code><br>Previous: <code>${r.predecessor ?? "First revision"}</code></p>
    <h3>Success criteria</h3>${list(r.definition.success_criteria)}<h3>Non-goals</h3>${list(r.definition.non_goals)}
    <h3>Selected context</h3>${r.sources.map(s => `<h4>${escape(s.why_included)}</h4><pre>${escape(s.bounded_summary)}</pre><p>${escape(s.compatibility_source_ref?.external_id)} · ${escape(s.trust_class)} · ${escape(s.external_ref?.observed_at ?? "Observation time unknown")}</p>`).join("") || "<p>No notes selected.</p>"}
    <h3>Authored files in this revision</h3>${list((r.files ?? []).map(f => `${f.name} · ${f.role} · ${f.bytes} bytes · ${f.digest}`))}
    ${(r.files ?? []).map(f => `<p><a href="#${f.digest.slice(7)}">Read ${escape(f.name)} at this exact content identity</a></p>`).join("")}
    ${r.relations ? `<details><summary>Recorded source relationships</summary><pre>${escape(JSON.stringify(r.relations, null, 2))}</pre></details>` : ""}</section>`);
  const head = chain.at(-1)!;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(head.definition.goal)} — reading copy</title><style>body{max-width:850px;margin:3rem auto;padding:0 1rem;font:17px/1.6 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}code{overflow-wrap:anywhere}section{border-top:1px solid #ccc;margin-top:2rem}a{color:#235d48}</style></head><body><h1>${escape(head.definition.goal)}</h1><p>Readable copy of all ${chain.length} saved revisions and their exact file contents. Repeated bytes appear once below, linked from each revision. Keep the complete JSON recovery file alongside this reading copy. A direction with external lineage requires Export both story directions; this one-work reading copy does not contain the other work’s full history.</p><p>Authored material and supplied narrative distinctions remain attributed. Fiction, announcements, character beliefs and undecided intentions are not empirical evidence or automatic canon adoption. This reading copy grants no access, execution or publication authority.</p><details><summary>Project identity</summary><pre>${escape(JSON.stringify({workspace_id:head.workspace_id,project_id:head.project_id,work_id:head.work_id}, null, 2))}</pre></details>${revisions.join("")}${contents.join("")}</body></html>`;
}
