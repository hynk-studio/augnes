import { readFile } from "node:fs/promises";
import { ReadModelSnapshotSchema, type ReadModelSnapshot } from "./schemas.js";

export async function loadReadModelSnapshot(filePath: string): Promise<ReadModelSnapshot> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown file error";
    throw new Error(`Unable to read App Read Projection snapshot (${filePath}): ${message}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`App Read Projection snapshot (${filePath}) is not valid JSON.`);
  }

  const parsed = ReadModelSnapshotSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`App Read Projection snapshot (${filePath}) does not match the projection schema.`);
  }

  return parsed.data;
}
