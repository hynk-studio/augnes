import { z } from "zod";

export const ProjectionClaimSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export const ProjectionEvidenceSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["evidence", "casefile", "boundary", "continuity", "repo", "doc"]).default("evidence"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export const ProjectionPointerSchema = z.object({
  id: z.string(),
  kind: z.enum(["casefile", "boundary", "continuity", "repo", "evidence", "doc"]),
  targetId: z.string(),
});

export const WorkingViewProjectionSchema = z.object({
  summary: z.string(),
  claimIds: z.array(z.string()),
  topEvidenceIds: z.array(z.string()),
  activePointers: z.array(z.string()),
});

export const ReadModelSnapshotSchema = z.object({
  snapshotId: z.string(),
  profile: z.enum(["public", "chrono_lab"]).default("public"),
  notes: z.array(z.string()).default([]),
  claims: z.array(ProjectionClaimSchema),
  evidence: z.array(ProjectionEvidenceSummarySchema),
  pointers: z.array(ProjectionPointerSchema),
  workingViewProjection: WorkingViewProjectionSchema,
});

export type ReadModelSnapshot = z.infer<typeof ReadModelSnapshotSchema>;
