import { WorkingViewSchema } from "../lib/schemas.js";
import type { WorkingView } from "../lib/types.js";
import type { ReadModelSnapshot } from "./schemas.js";

export function projectWorkingView(snapshot: ReadModelSnapshot): WorkingView {
  const projection = snapshot.workingViewProjection;
  const claimIds = new Set(snapshot.claims.map((claim) => claim.id));
  const evidenceIds = new Set(snapshot.evidence.map((evidence) => evidence.id));
  const pointerIds = new Set(snapshot.pointers.map((pointer) => pointer.id));

  const missingClaims = projection.claimIds.filter((id) => !claimIds.has(id));
  const missingEvidence = projection.topEvidenceIds.filter((id) => !evidenceIds.has(id));
  const missingPointers = projection.activePointers.filter((id) => !pointerIds.has(id));

  if (missingClaims.length || missingEvidence.length || missingPointers.length) {
    throw new Error(
      [
        missingClaims.length ? `missing claims: ${missingClaims.join(", ")}` : "",
        missingEvidence.length ? `missing evidence: ${missingEvidence.join(", ")}` : "",
        missingPointers.length ? `missing pointers: ${missingPointers.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("; ")
    );
  }

  return WorkingViewSchema.parse({
    summary: projection.summary,
    claimIds: projection.claimIds,
    topEvidenceIds: projection.topEvidenceIds,
    activePointers: projection.activePointers,
  });
}
