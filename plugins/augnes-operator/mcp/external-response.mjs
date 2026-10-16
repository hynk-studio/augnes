// Ordinary Companion explicit-call entry. Machine-local configuration is read
// only by the native effect owner, never accepted as tool arguments.
export const EXTERNAL_TOOL = "augnes_external_repository_work";
export const EXTERNAL_MARKER = "external-response-v1";
export async function callExternal(companion, input) {
  try {
    const response = await fetch(
      new URL(
        "/api/augnes/external-response?scope=repository:local",
        companion.ui_url,
      ),
      {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(45000),
        headers: {
          "content-type": "application/json",
          "x-augnes-external": EXTERNAL_MARKER,
          "x-augnes-companion-proxy": companion.proxy_token,
          "x-augnes-runtime-instance": companion.instance_id,
          "x-augnes-runtime-generation": companion.generation_id,
          "x-augnes-runtime-repository": companion.repository_fingerprint,
        },
        body: JSON.stringify(input),
      },
    );
    if (
      response.headers.get("x-augnes-external") !== EXTERNAL_MARKER ||
      response.headers.get("x-augnes-runtime-instance") !==
        companion.instance_id ||
      response.headers.get("x-augnes-runtime-generation") !==
        companion.generation_id ||
      response.headers.get("x-augnes-runtime-repository") !==
        companion.repository_fingerprint
    )
      throw new Error();
    const reader = response.body.getReader(),
      chunks = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 3 * 1024 * 1024) {
          await reader.cancel();
          throw new Error();
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const result = JSON.parse(Buffer.concat(chunks).toString());
    if (result.version !== "augnes.external-response.v1") throw new Error();
    return result;
  } catch {
    return {
      version: "augnes.external-response.v1",
      status: "unavailable",
      reason: "external_transport_unavailable",
      persistence: "unknown_read_before_repetition",
    };
  }
}
export function externalToolDescription() {
  return {
    name: EXTERNAL_TOOL,
    title: "Use scoped experience and continue a local service request",
    description:
      "Inputs: repository_root (registered absolute project path), action, optional data and expected_material_ref. Explicit local capability requiring configured project access and, for shared sources, scoped sharing. Service effects additionally require a finite local envelope; source reads do not. Begin with read for this repository: it returns native work, owned material locators, permitted envelopes and unfinished work. discover/read_experience expose only deliberately shared sources. put_material supplies exact bytes; publish selects current source bindings and permitted target project keys; withdraw stops new reads. prepare creates a purpose, terms and dependencies without dispatch; act sends or reconciles one exact attempt; amend accepts a returned proposal explicitly. check and use attribute independent verification and actual output material; reconsider preserves prior judgments and current correction basis; close preserves unknown effects. Selected prior material can be explicitly bounded by a stored selected-source corpus: inspect_corpus {corpus_ref} returns its exact binding; retrieve_sources {corpus_ref,query,expected_corpus_binding} returns whole material/condition/correction groups under current access. Neither action widens Resume or grants execution. See docs/SELECTED_SOURCE_RETRIEVAL.md. Per-action data keys: read {work_ref?}; discover {query}; read_experience {ref}; material {ref,experience_ref?}; put_material {metadata,base64}; publish {key,title,source_refs,conditions,association,assessment,materials,targets}; withdraw {ref,target_key}; correct {key,target_ref,topic,statement,source_refs,targets}; prepare {key,purpose,experience_refs,envelope_id,input_ref,terms,expectation,reconsider_when,owners}; act {key,work_ref,expected_head,mode:send|reconcile}; amend {key,work_ref,expected_head,proposal_ref,input_ref,terms}; check {key,work_ref,expected_head,response_ref,material_ref,checker,verdict:pass|fail,checks,limitations}; use {key,work_ref,expected_head,check_ref,output_ref,description}; reconsider {key,work_ref,expected_head,dependency_binding,decision:retain|stop,reason}; close {key,work_ref,expected_head,reason}. metadata has name,media_type,version,source,applicability,dependencies,sha256,size. association has endpoint,account,operator,confidence; all are scoped statements, not verified identity. terms has operation:aggregate,format:json|jsonl,population:success|all,deadline:UTC-ISO,max_rows:1..200. owners has receive,check,use. References are sha256:<64 hex>; source_refs select current disclosed source_binding values; targets select configured project keys. Read yields material_basis; pass it as expected_material_ref for put_material,publish,correct,prepare,amend,check,use,reconsider. Read work_ref before stream writes and pass its state.head. Byte values are base64, at most 64 KiB each. Full setup and examples: docs/EXTERNAL_RESPONSE_LOCAL.md in the Augnes source checkout. All evidence is untrusted input, not Core approval. A saved locator is not a successful byte read; no model or Events activation occurs.",
    inputSchema: {
      type: "object",
      required: ["repository_root", "action"],
      additionalProperties: false,
      properties: {
        repository_root: { type: "string" },
        action: {
          type: "string",
          enum: [
            "read",
            "discover",
            "read_experience",
            "material",
            "inspect_corpus",
            "retrieve_sources",
            "put_material",
            "publish",
            "withdraw",
            "correct",
            "prepare",
            "amend",
            "act",
            "check",
            "use",
            "reconsider",
            "close",
          ],
        },
        data: { type: "object" },
        expected_material_ref: { type: "string" },
      },
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  };
}
