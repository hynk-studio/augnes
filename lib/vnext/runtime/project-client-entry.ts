import type Database from "better-sqlite3";

import { openDatabase } from "@/lib/db";
import { readDefaultWorkspaceIdentityV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { readProjectSelectionStateV02 } from "@/lib/vnext/persistence/project-lifecycle-registry";

/** Pin a navigation default without constructing a project projection or changing
 * selection. This selector grants no authority; protected APIs verify scope. */
export function resolveProjectClientEntryProjectV01(
  projectId: string | undefined,
  dependencies: { open_database?: () => Database.Database } = {},
): string | null {
  if (projectId !== undefined) return projectId;
  const db = (dependencies.open_database ?? openDatabase)();
  try {
    const workspace = readDefaultWorkspaceIdentityV01(db);
    return workspace
      ? readProjectSelectionStateV02(db, workspace.workspace_id)?.project_id ?? null
      : null;
  } finally {
    db.close();
  }
}
