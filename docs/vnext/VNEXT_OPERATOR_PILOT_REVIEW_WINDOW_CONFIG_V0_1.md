# vNext Operator Pilot Review Window Configuration v0.1

## Purpose

The local operator pilot deliberately separates preview, gate confirmation,
and durable transition into distinct human-reviewed actions. The legacy
15-minute preview window and 10-minute gate TTL remain safe defaults, but they
are too short for an asynchronous owner-operated review. This compatibility
contract permits a bounded local runtime configuration without granting any
semantic or external authority.

Contract identity:

`vnext_operator_pilot_review_window_config.v0.1`

## Environment contract

| Setting | Default | Minimum | Maximum |
| --- | ---: | ---: | ---: |
| `AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS` | 900000 ms | 900000 ms | 28800000 ms |
| `AUGNES_VNEXT_OPERATOR_GATE_TTL_MS` | 600000 ms | 600000 ms | 7200000 ms |

The gate TTL must not exceed the preview maximum age. A value is accepted only
as a canonical unsigned base-10 integer string. Empty or whitespace-padded
values, signs, decimals, exponent notation, suffixes, zero, negative values,
unsafe integers, values outside the bounds, and inconsistent pairs fail closed.
An explicitly invalid value never falls back to the default.

The runtime reports each effective validated number and whether it came from
the default or from `explicit_environment`. It does not report unvalidated
environment content.

## Binding and lifecycle

The server derives both values. Browser requests cannot submit timing,
timestamps, expiry, state observations, intended effects, or the authorized
applier.

- The effective preview maximum age binds the preview cookie lifetime, binding
  validation, stale-preview rejection, and confirmation admission.
- The effective gate TTL binds the preview, confirmation digest, gate
  evaluation, `expires_at`, and commit-time expiry enforcement.
- Explicit timing configuration contributes a deterministic confirmation
  context fingerprint. A preview cannot be confirmed, or a gate committed,
  under a different effective configuration.
- With both variables omitted, the legacy preview and gate identities remain
  unchanged.

Persisted previews are not records. Persisted gates retain their original
digest, TTL, and expiry as immutable historical material. Expired previews and
gates are never extended, rewritten, deleted, or replayed as authority. A retry
requires a fresh preview and a newly confirmed gate. No schema migration,
backfill, or historical-record rewrite is required.

## Owner-operated M3 recommendation

For the owner-selected asynchronous M3 pilot window:

```bash
export AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS=7200000
export AUGNES_VNEXT_OPERATOR_GATE_TTL_MS=3600000
```

The loopback runtime must inherit both variables. They configure a two-hour
preview maximum age and a one-hour gate TTL.

## Authority boundary

Longer review windows do not grant semantic, transition, provider, GitHub,
execution, scheduling, deployment, publication, or external-actuation
authority. The pilot remains one-target, explicit accept, create-only, and
absent-current-state. Preview remains zero-write; confirmation remains
gate-only; commit remains a separate authenticated action.
