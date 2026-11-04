import { binding, boundedText, exact, fail, headBinding, makeRevision, sameBinding, UUID, type Payload } from "./contract";
import { exchangeView, mediaType, validateExchange, type Exchange } from "./exchange";
import { FILE_COUNT, historyFiles, selectedFiles } from "./files";
import { append, downloadFile, readWork, requestRevision, type Store } from "./store";

// Both operations use the same caller-held request and the same D1 CAS as an ordinary save.
export async function writeExchange(store: Store, workId: string, input: Record<string, unknown>, resolve: boolean) {
  exact(input, "workspace_id,project_id,expected,request_key,kind,basis,message,next_action,files");
  const expected = binding(input.expected);
  if (typeof input.request_key !== "string" || !UUID.test(input.request_key)) fail("invalid_request_key");
  if (!Array.isArray(input.files) || !input.files.length || input.files.length > FILE_COUNT) fail("exchange_file_count");
  const incoming = input.files;
  const types: (string | null)[] = [];
  const uploads = incoming.map(item => {
    exact(item, "name,media_type,bytes,digest,data");
    types.push(mediaType(item.media_type));
    return { name: item.name, role: input.kind === "return" ? "results" : "source", data: item.data };
  });
  const chain = await readWork(store, workId);
  const base = chain[expected.revision - 1];
  if (!base || !sameBinding(headBinding(base), expected)) fail("refresh_required", 409);
  const { payload: selection, bodies } = selectedFiles({ definition: base.definition, sources: [] }, uploads, undefined, true);
  if (selection.files!.some((file, i) => file.bytes !== incoming[i].bytes || file.digest !== incoming[i].digest))
    fail("exchange_upload_integrity", 422);
  const event: Exchange = validateExchange({
    kind: input.kind, basis: input.basis, message: boundedText(input.message, true), next_action: boundedText(input.next_action),
    artifacts: selection.files!.map((file, i) => ({ file, media_type: types[i] }))
  }, chain.slice(0, expected.revision));
  const payload: Payload = { definition: base.definition, sources: base.sources, files: base.files ?? [], exchange: event };
  if (base.relations) payload.relations = base.relations;
  const next = makeRevision(store, workId, expected, input.request_key, payload, new Date().toISOString());
  const recorded = await requestRevision(store, input.request_key);
  if (recorded && (recorded.work_id !== workId || recorded.request_fingerprint !== next.request_fingerprint)) fail("altered_replay", 409);
  if (!recorded && !resolve) {
    if (!sameBinding(expected, headBinding(chain.at(-1)))) fail("refresh_required", 409);
    historyFiles([...chain, next]);
    await append(store, chain, next, undefined, bodies);
  }
  const observed = await readWork(store, workId);
  const saved = observed.find(r => r.request_key === input.request_key);
  if (!saved) {
    if (!resolve) fail("conflict", 409);
    return { outcome: "unknown", head: headBinding(observed.at(-1)) };
  }
  if (saved.request_fingerprint !== next.request_fingerprint || !saved.exchange) fail("altered_replay", 409);
  for (let i = 0; i < saved.exchange!.artifacts.length; i++) await downloadFile(store, saved, i, true);
  return { outcome: "saved", item: exchangeView(saved), head: headBinding(observed.at(-1)) };
}
