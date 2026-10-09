import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type { WorkComposerDraft } from "./work-composer-draft";

type Scope = { workspace_id: string; project_id: string; operator_id: string };
export const workExpectationScopeKey = (scope: Scope) => JSON.stringify([scope.workspace_id, scope.project_id, scope.operator_id]);
export const workExpectationBindingKey = (work: ProjectWorkInitializationV01) => JSON.stringify([
  work.workspace_id, work.project_id, work.project_work_binding ?? null,
  work.current_packet?.packet_id ?? null, work.current_packet?.packet_fingerprint ?? null,
]);

/** Mounted-editor memory only. A fresh matching session may recover its draft;
 * another project/operator never receives that memory. */
export function readWorkExpectationDraft(drafts: Map<string, WorkComposerDraft>, work: ProjectWorkInitializationV01, session: Scope | null) {
  if (!session || session.workspace_id !== work.workspace_id || session.project_id !== work.project_id) return undefined;
  const key = workExpectationScopeKey(session);
  let draft = drafts.get(key);
  if (!draft) { draft = new Map(); drafts.set(key, draft); }
  return draft;
}
