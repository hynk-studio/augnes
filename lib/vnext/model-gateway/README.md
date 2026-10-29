# Model invocation and method ownership

The public `model-gateway.ts` and `openai/responses-adapter.ts` entry points
retain their existing exports and synchronous projection/validation contracts.
Production composition is closed: there is no registration API, module loader,
additional Gateway, or additional execution authority.

| Owner | Responsibility |
| --- | --- |
| `invocation-core.ts` and `invocation-guards.ts` | Canonical project and current-selection admission, policy authorization, shared privacy and budget checks, cost-route/currentness checks, cancellation/deadline lifecycle, single egress accounting, failure classification, receipt construction and validation. |
| `method-bindings.ts` | Purpose-specific input validation, provider-control-field exceptions, declared limits, fallback availability, deterministic identity, method-envelope restrictions and receipt identity/output selection. |
| `method-routes.ts` | Existing synchronous validation/projection/contract exports, prepared method routes, version/fingerprint bindings and their equality checks. |
| `model-gateway.ts` | Existing typed invocation/result facades and closed composition of the shared core with method bindings and prepared-route checks. |
| `openai/responses-transport.ts` | Bounded Responses request serialization, strict-schema validation, transport, bounded response reads, usage normalization and transport/error observations. It consumes a typed method binding and imports no purpose codec. |
| `openai/responses-method-binding.ts` | Internal typed contract between a Responses method and its transport. |
| `openai/responses-method-bindings.ts` and existing `*-codec.ts` files | Closed purpose selection, model/reasoning routing, material projection, prompts, schemas, parser selection, parser diagnostics and adapter/version identity. |
| `local-capability.ts`, `openai/local-configuration.ts` and `planner-execution-configuration.ts` | Existing non-invocable capability/configuration reads; these do not import invocation, transport, or method implementations. |

The core receives a method resolver and adapter from the compatibility facade.
The transport receives a method resolver from its compatibility facade. Their
internal seams do not make methods caller-selectable through a new public API.
Changing a method's parser, prompt, schema, material projection or version binding
does not require editing shared authority/lifecycle/receipt enforcement or
Responses HTTP handling. A new public purpose would still require explicit
contract, composition, authority, caller and verification work.

Immediate method-route consumers import `method-routes.ts`; existing callers may
continue using the compatibility exports. Invocation callers retain the public
Gateway entry points. Stateless review keeps lazy route and invocation loading,
and capability readers keep the dependency-inert path introduced by #1550.

Existing codec source, schema/version identifiers, material and identity
fingerprints remain unchanged. Receipt validation remains the final shared
integrity owner. In particular, cross-case prepared-route mismatch keeps its
existing receipt-less refusal, while other prepared-route mismatches retain
their bounded refusal receipt; refactoring does not normalize historical behavior.

Verification uses deterministic transports with the same baseline/candidate
fixture bytes through public requests, parsing, results, receipts and refusals.
The Gateway and R4 boundary suites retain product-call, authority, lifecycle,
privacy, project-isolation and capability controls. Test-only bindings exercise
the internal seam without adding a production purpose. Such evidence establishes
compatibility and dependency separation, not model quality, speed, cost savings,
ordinary-use benefit, installed adoption or merge approval.
