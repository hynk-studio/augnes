import type { DelegatedWorkProjectionV01 } from "@/types/vnext/delegated-work";
import type { OperatorSessionViewV01 } from "./operator-session-panel";

type ProjectScope = { workspace_id: string; project_id: string };
type ReadBinding = { sessionKey: string; generation: number };

function sessionKey(session: OperatorSessionViewV01 | null): string | null {
  return session
    ? JSON.stringify([
        session.session_id,
        session.workspace_id,
        session.project_id,
        session.operator_id,
      ])
    : null;
}

export function sameScopeExecutionObservedV01(
  session: OperatorSessionViewV01 | null,
  projection: DelegatedWorkProjectionV01 | null,
): boolean {
  return Boolean(
    session && projection &&
      session.workspace_id === projection.workspace_id &&
      session.project_id === projection.project_id &&
      projection.run_ref &&
      projection.source_status !== "unavailable" &&
      projection.stage !== "not_started" &&
      projection.stage !== "unavailable",
  );
}

// Execution is negative evidence for zero-history preparation, never a grant.
// Latch it for this authenticated scope and supersede reads begun before it.
// Only the authoritative revision reader/writer can establish eligibility.
export class SemanticReviewReadGuardV01 {
  private session: OperatorSessionViewV01 | null = null;
  private generation = 0;
  private executionObserved = false;

  setSession(session: OperatorSessionViewV01 | null): void {
    if (sessionKey(session) !== sessionKey(this.session)) {
      this.generation += 1;
      this.executionObserved = false;
    }
    this.session = session;
  }

  beginRead(): ReadBinding | null {
    const key = sessionKey(this.session);
    return key ? { sessionKey: key, generation: ++this.generation } : null;
  }

  isCurrentRead(read: ReadBinding): boolean {
    return read.sessionKey === sessionKey(this.session) &&
      read.generation === this.generation;
  }

  matchesProject(project: ProjectScope): boolean {
    return this.session?.workspace_id === project.workspace_id &&
      this.session?.project_id === project.project_id;
  }

  observeExecution(projection: DelegatedWorkProjectionV01 | null): boolean {
    if (this.executionObserved || !sameScopeExecutionObservedV01(this.session, projection)) {
      return false;
    }
    this.executionObserved = true;
    this.generation += 1;
    return true;
  }

  preparationInvalidated(
    session: OperatorSessionViewV01 | null,
    projection: DelegatedWorkProjectionV01 | null,
  ): boolean {
    return sameScopeExecutionObservedV01(session, projection) ||
      (session !== null && sessionKey(session) === sessionKey(this.session) &&
        this.executionObserved);
  }
}
