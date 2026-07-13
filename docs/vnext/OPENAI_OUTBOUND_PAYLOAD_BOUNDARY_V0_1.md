# OpenAI Outbound Payload Boundary v0.1

> **Document status:** active security-remediation contract
> **Version:** `openai_outbound_payload_boundary.v0.1`
> **Classification:** Adapter / security remediation; Workstream D prerequisite
> **Maturity claim:** none

## 1. Question and scope

This boundary answers one question: can the dynamic material for an existing
OpenAI Responses request be proven to fit a reviewed, purpose-specific shape and
UTF-8 byte budget before the transport is called?

It protects exactly three existing production sinks:

- `lib/observe/delta-compiler.ts`
- `lib/planner/planner.ts`
- `lib/temporal-interpretation/openai.ts`

The source audit found unbounded eligible outbound collections or caller
context at those sinks. No live leak, secret value, or provider call was
observed during discovery or remediation. This slice does not enumerate the
repository's full direct-call inventory.

## 2. Boundary contract

`openai_outbound_payload_boundary.v0.1` is a pure pre-transport validator and
request builder. It supports only these purposes:

| Purpose | Allowed dynamic material |
| --- | --- |
| `observe_delta_compile` | scope, observe message, and the exact scalar committed-state projection required by the delta compiler |
| `planner_plan` | request message plus bounded active, future, completed, and deprecated state; open tensions; and pending proposals |
| `temporal_interpretation` | the single strict `TemporalPreviewContext` shape already used by the temporal preview |

The module owns the fixed system instructions, response-format schemas, role
ordering, and provider-request layout. Dynamic input cannot add a system
message, model or endpoint override, tool, function, response format, or other
provider parameter.

The result is either:

- `ready`: a bounded provider payload plus public-safe byte/count measurements;
- `blocked`: bounded reason codes and measurements, with no provider payload
  and no permission to call the transport.

The result is not Evidence, a RunReceipt, approval, semantic state, or a
persisted audit record.

## 3. Reviewed v0.1 limits

All sizes are measured with UTF-8 bytes using `Buffer.byteLength`. Character or
token estimates are not security boundaries.

Common structural limits:

| Limit | Maximum |
| --- | ---: |
| object depth | 8 |
| keys in one object | 40 |
| total keys | 1,024 |
| total visited nodes | 2,048 |
| one source item | 4,096 bytes |
| public-safe issues | 32 |

Purpose limits:

| Purpose | Text limit | Collection limits | Dynamic bytes | Final request bytes |
| --- | ---: | --- | ---: | ---: |
| observe | message 32,768 bytes | 64 state items | 65,536 | 98,304 |
| planner | message 8,192 bytes | 64 state items total, at most 32 per state bucket, 16 tensions, 16 proposals | 65,536 | 98,304 |
| temporal | 4,096 bytes per string | strict per-array limits detailed below | 32,768 | 65,536 |

Observe state scalar strings are limited to 4,096 bytes. Planner state values,
tension descriptions, and proposal material are limited to 4,096 bytes per
string; identifiers and other narrow fields use stricter 128, 256, 512, or
1,024-byte limits.

Temporal arrays are capped according to the existing context builder: 8
evidence anchors; 2 summary references and user preferences; 3
counterexamples, suppressed alternatives, and allowed-now actions; 4 residual
tensions, admission rationales, blocked-now actions, interpretive drivers, and
axis pressures; 10 admission decisions; 8 committed-state authority refs; and
memory-lifecycle lists of 5 active, 3 retrieved, 2 summary, and 5 deferred refs.
Per-decision reference lists are limited to 1 evidence, 3 counterexample, and 1
residual-tension ref. Every temporal array is also subject to the common
per-collection ceiling of 32 items.

The final serialized request is measured separately from the dynamic
projection. A request blocks if either budget is exceeded. Test-only limit
overrides may lower a v0.1 limit but cannot widen it. No environment variable or
caller option can widen production limits.

These limits preserve the repository's representative supported fixtures while
remaining materially below provider context capacity. Provider capacity is not
treated as a privacy budget.

## 4. Safe material and no truncation

The boundary rejects unsupported runtime values, accessors, proxy traps,
cycles, non-finite
numbers, excessive structure, unknown fields, conflicting duplicate semantic
IDs, unsafe field names, credential-shaped values, private-key material,
session or cookie assignments, private paths and file references, private
network locations, raw prompt or transcript fields, hidden-reasoning material,
terminal or environment dumps, and provider-parameter injection.

Known source-record metadata that is omitted from the provider projection is
still structurally and materially validated. It never appears in the provider
payload.

Ordinary words such as `token`, `session`, `secret`, or `API key` are not
blocked by themselves. Rejection requires an unsafe field role or a
credential/dump-shaped value.

Project-semantic material is never silently truncated, ranked, or reordered to
fit. If every supported item cannot fit, the request blocks before transport.
Object keys that are semantically unordered are canonicalized with stable
code-unit ordering; semantic arrays retain their supplied order.

## 5. Blocked behavior

Public-safe blocked reasons use only these categories:

- `model_egress_payload_oversize`
- `model_egress_payload_unsafe`
- `model_egress_payload_malformed`
- `model_egress_payload_schema_mismatch`

Issues may report the purpose, a fixed section label, a bounded index, and a
measured count or byte length with its maximum. They never contain the rejected
value, source snippet, request body, path, private location, prompt, transcript,
or credential material.

The invariant is:

```text
blocked boundary result -> provider transport call count 0
```

## 6. Behavior by sink

### Observe delta compiler

Safe material retains the existing model, endpoint, roles, fixed instruction,
response schema, parsing, and proposal shape. Only the state fields used by the
existing prompt are projected, and state values must be scalar or null.

Missing credentials retain the existing deterministic mock compiler. An egress
block raises a public-safe refusal before provider transport and before any
proposal result is created. It is not converted into a mock provider result.

### Planner

Safe material retains the existing model, endpoint, roles, fixed instruction,
response schema, parsing, and plan shape. The previous wholesale state brief is
replaced by a strict state/tension/proposal projection. No collection is
silently reduced.

Missing credentials retain the existing deterministic mock planner. An egress
block raises a public-safe refusal before transport; it does not fabricate or
return an empty successful plan.

### Temporal interpretation

Safe material must match the one existing `TemporalPreviewContext` contract.
Unknown or arbitrary context records no longer reach serialization or the
provider transport.

Missing credentials retain the existing mock preview. Provider failures after
a ready boundary retain the existing `mock_fallback` behavior. A boundary
refusal is rethrown instead of copying rejected context through that fallback.

## 7. Credential, transport, and logging boundary

The pure boundary receives no credential and performs no network, database,
filesystem, clock, random, or persistence operation. Production credentials
remain in the existing transport headers and are never included in the bounded
payload or audit measurements.

Focused tests use an injected fake Responses transport. Safe requests call the
fake once; blocked requests call it zero times. Provider error messages expose
status only and do not echo a response body. No rejected dynamic material is
logged or included in errors, summaries, or committed fixtures.

## 8. Verification strategy

The focused smoke covers safe requests, exact lower test limits, multibyte
UTF-8 accounting, stable output, immutable inputs, strict shapes, cycles,
unsupported values, structural limits, unsafe-material categories,
provider-parameter injection, duplicate semantic IDs, final-request overhead,
provider-call counts, and public-safe errors.

Existing no-credential and authority smokes remain regression coverage. Live
OpenAI validation is intentionally excluded because this remediation must not
make a provider call.

## 9. Compatibility, limitations, and rollback

Safe inputs within the documented projected contract preserve the existing
model selection, endpoint, role order, fixed instructions, response schema,
parsing, return shape, and missing-credential behavior. The planner now sends
only state, tension, and proposal material; recent-action, instruction, and
handoff sections from the larger state brief are deliberately excluded under
the least-data contract, so provider wording or recommendation choice is not
claimed to be byte-for-byte identical.
Malformed, unsupported, unsafe, cyclic, or oversized material now refuses
before egress; previously unbounded arbitrary material was not a supported
contract.

This boundary covers only the three named OpenAI Responses sinks. It does not
classify all repository provider references, enforce provider retention, create
usage/cost receipts, standardize timeouts, or prevent every future bypass. The
separate direct-call inventory and later Model Gateway slices remain required.

Rollback is code-only removal of this module, its three sink integrations, the
focused smoke, and this document. There is no data or schema migration.

## 10. Exact non-claims and next gate

This work does not implement a Model Gateway, consolidate providers, complete
data classification or privacy policy, enforce retention or cost policy,
generate usage receipts, standardize timeouts, redesign provider retry or
fallback behavior, complete Workstream D or M2, change semantic authority, run
an M3 pilot, or complete M3.

The next gate is human security review of the Draft PR. Merge remains a
user/operator decision. After merge, Model Gateway Direct-Call Inventory v0.1
can restart from then-current main as a separately reviewed slice.
