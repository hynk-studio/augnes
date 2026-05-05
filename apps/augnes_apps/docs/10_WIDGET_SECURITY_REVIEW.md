# Widget Security Review

Sprint 4C hardens the Augnes Console widget for review without changing tool authority, adapter behavior, or product behavior.

## Widget Boundary

The widget is a read-only presentation shell. It renders tool results delivered by the host through `structuredContent`, `content`, and `_meta`.

The widget does not write canonical Augnes state. Its local state is UI-only:

- selected or last panel view
- expanded or collapsed sections
- last update display
- active presentation profile badge

The widget must not treat ChatGPT thread, session, workspace, run, or trace state as Augnes memory. Canonical memory and canonical writes stay inside Augnes Core.

## Network And Storage

The widget is self-contained HTML registered as `ui://widget/augnes-console.v2.html`.

Allowed behavior:

- receive host tool-result notifications
- render read-only structured payloads
- send UI initialization and initialized messages to the host bridge

Disallowed behavior:

- direct `fetch`, `XMLHttpRequest`, `WebSocket`, or `EventSource` calls
- analytics beacons
- external scripts
- external fonts
- `localStorage` or `sessionStorage` for canonical state
- `eval` or `new Function`

## CSP Metadata

Status: implemented in Sprint 4C.

The resource declares SDK-native CSP metadata:

```json
{
  "connectDomains": [],
  "resourceDomains": [],
  "frameDomains": [],
  "baseUriDomains": []
}
```

For ChatGPT compatibility, the resource also declares:

```json
{
  "openai/widgetCSP": {
    "connect_domains": [],
    "resource_domains": []
  }
}
```

The app also sets a stable widget domain from `AUGNES_RESOURCE_DOMAIN`.

## Developer Mode CSP Badge

Status: unresolved in ChatGPT Developer Mode.

Even with SDK-native CSP, `openai/widgetCSP`, and `openai/widgetDomain` metadata present, ChatGPT Developer Mode may still display `CSP off`.

Likely causes:

- Developer Mode or local tunnel handling does not fully apply sandbox metadata.
- The host may not honor the current CSP metadata shape for development apps.
- Cached app, tool, or resource metadata may survive widget URI and resource updates.

The widget also uses inline CSS and inline module JavaScript because the current server registers one self-contained HTML resource. The CSP domain metadata restricts external network and resource origins; it does not split the HTML into external JS/CSS files.

This must be rechecked after moving to a stable deployment URL and after refreshing the app registration or creating a new draft app.

## Profiles

`AUGNES_APP_PROFILE` changes presentation only:

- `public`: concise, directory-safe, user-facing
- `chrono_lab`: detailed, developer/lab-facing

Both profiles use the same nine read-only tools and the same adapter behavior.

## Review Checks

`npm run smoke` checks:

- widget URI remains the expected versioned URI
- profile badge remains present
- widget avoids `localStorage` and `sessionStorage`
- widget avoids `eval` and `new Function`
- widget avoids direct browser network APIs
- widget resource declares narrow SDK-native CSP
- widget resource declares OpenAI-compatible CSP metadata

The public tool list remains exactly nine tools, all read-only, non-destructive, and closed-world.

## Manual Verification Checklist

Use this checklist after widget URI changes, profile changes, or deployment changes:

- Create a fresh Developer Mode app or new draft after widget URI changes.
- Verify `/healthz` reports the intended `profile`.
- Verify the widget resource URI is `ui://widget/augnes-console.v2.html`.
- Verify the widget uses no external network APIs.
- Verify the widget header shows `profile: public` or `profile: chrono_lab`.
- Verify the Developer Mode CSP badge state.
- Recheck the CSP badge after stable deployment URL setup and app refresh/new draft.
