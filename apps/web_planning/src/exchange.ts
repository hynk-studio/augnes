import { boundedText, canonical, exact, fail, headBinding, reference, workRef, type Revision, type WorkRef } from "./contract";
import { fileManifest, type FileEntry } from "./files";

export const EXCHANGE_FORMAT = "web_planning_revision.v0.5";
export const EXCHANGE_COMPATIBILITY = "web-planning/5";
export const EXCHANGE_EXPORT = "web_planning_export.v0.5";

export interface ExchangeFile { file: FileEntry; media_type: string | null }
export interface Exchange {
  kind: "request" | "return";
  basis: WorkRef | null;
  message: string;
  next_action: string;
  artifacts: ExchangeFile[];
}

export function mediaType(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > 127 || !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(value)) fail("invalid_media_type");
  return value;
}

export function exchangeRecord(value: unknown): Exchange {
  exact(value, "kind,basis,message,next_action,artifacts");
  if (!["request", "return"].includes(value.kind)) fail("invalid_exchange");
  if (boundedText(value.message, true) !== value.message || boundedText(value.next_action, value.kind === "return") !== value.next_action) fail("invalid_exchange_text");
  if (!Array.isArray(value.artifacts) || !value.artifacts.length) fail("exchange_file_required");
  fileManifest(value.artifacts.map(item => {
    exact(item, "file,media_type");
    mediaType(item.media_type);
    return item.file;
  }));
  if (value.kind === "request") {
    if (value.basis !== null) fail("invalid_source_binding");
  } else workRef(value.basis);
  return value as Exchange;
}

export function validateExchange(value: unknown, prior: Revision[]): Exchange {
  const record = exchangeRecord(value);
  if (!prior.length) fail("invalid_exchange");
  if (record.basis) {
    const basis = record.basis;
    const source = prior[basis.revision - 1];
    if (source?.exchange?.kind !== "request" || canonical(reference(source)) !== canonical(basis)) fail("exchange_request_unavailable", 409);
    if (prior.some(r => r.exchange?.basis?.fingerprint === basis.fingerprint)) fail("exchange_already_answered", 409);
  }
  return record;
}

export function exchangeView(revision: Revision) {
  const { kind, basis, message, next_action, artifacts } = revision.exchange!;
  const ref = reference(revision);
  const files = artifacts.map(({ file, media_type }, i) => ({
    ...file, media_type,
    download: `/api/work/${ref.work_id}/exchange-files/${ref.revision}/${ref.fingerprint.slice(7)}/${i}`
  }));
  return { ref, request_key: revision.request_key, kind, basis, message, next_action, files };
}

export function exchangeList(chain: Revision[]) {
  const head = chain.at(-1);
  if (!head) fail("work_not_found", 404);
  const items = chain.filter(r => r.exchange).map(exchangeView);
  return { task: head.definition.goal, work_id: head.work_id, head: headBinding(head), items };
}
