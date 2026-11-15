# Connect a llama.cpp host to Augnes

This is an **experimental, opt-in source-checkout connection path**, reviewed
against llama.cpp `v1.0.0`. It prepares existing interfaces; it does not install
Augnes or a model, authenticate, start a service, run inference, register a
project, grant permissions or prove a successful connection. Real-model and
installed-host qualification are separate observations.

The goal is to let an agent in an existing host read its permitted work, perform
an authorized task and return to the same work later. Augnes remains the
continuity/evidence/review surface; llama.cpp supplies the host and model.

## Choose the route

| Route | Existing interface | Prerequisites and scope |
| --- | --- | --- |
| Local | Companion stdio proxy through a text-result compatibility adapter | A supported installed Companion, the same user's runtime environment and an already registered project folder. Reads and existing authorized work operations retain their current server-side checks. |
| Hosted Web | Private file-review stdio adapter | A downloaded owner-task or recipient-participation setup, the independently selected HTTPS origin, Apps dependencies and that executor's own permitted Cloudflare Access session. Limited file review/return, not every Web operation. |

The hosted route does **not** route through the project owner's Mac. The
participant may run its own llama.cpp/Node executor against a separately hosted
Augnes deployment. This does not make the deployment public or remove login;
setup files identify a scope but contain no login or grant authority.

Both routes need an approved Augnes source checkout and the repository's
supported Node runtime. Use the installed application's checkout for the local
route. Keep that checkout distinct from the project folder whose work is being
resumed. A prepared configuration uses the Node executable running the helper,
not whichever `node` another process later finds on `PATH`.

## Prepare a local connection

First follow the existing [Companion installation and project setup](../plugins/augnes-operator/INSTALL.md).
Preparation itself never installs or starts it.

From the selected Augnes checkout:

```text
node scripts/prepare-llama-connection.mjs --mode local --project-root "/absolute/project-folder" --output "/absolute/private/augnes-llama-local"
```

Use a new output directory. The helper writes a private `mcp.json` and a short
connection guide, without overwriting an existing connection. The project
folder must exist; finding it does not prove that it is registered in Augnes.
Owner-only POSIX modes are requested for the output; on platforms where those
modes do not enforce access, choose a parent already private under the host's
ACLs. This configuration is not a sandbox for the host or its child process.
The child inherits the eventual llama-server process environment. In particular,
retain the same user and any deliberate `AUGNES_RUNTIME_STATE_DIR` or XDG runtime
settings used by the installed Companion; do not copy its private credential
files into the configuration.

The opt-in `scripts/llama-companion-stdio.mjs` adapter calls the existing proxy
once per request and appends its already-returned `structuredContent` as JSON
text. It does not discover new information, bypass validation, alter arguments,
retry, start an execution or change the default Operator plugin. This matters
because llama.cpp v1's stdio bridge forwards only text content to the model;
the ordinary proxy's short text alone omits exact snapshot/preview bindings and
selected source bodies that later calls need.

## Prepare a hosted Web connection

Use an existing authorized deployment. Download either its private owner-task
setup (`augnes_web_file_task.v1`) or the recipient's participation setup
(`augnes_web_participation.v1`). The separate continuation setup format is not
supported by this file-review adapter. Keep the original setup in a private,
writeable directory: participant return recovery journals are stored beside it.

Install the checked-in Apps package dependencies as described in its
[private file-review instructions](../apps/augnes_apps/README.md#private-web-file-review).
`cloudflared` must be available on the executor's `PATH`. Establish the existing
Cloudflare Access login separately, using the correct recipient/owner account.
Neither this helper nor the adapter initiates login, copies a browser session
or provisions a service-token identity.

```text
node scripts/prepare-llama-connection.mjs --mode web --setup "/absolute/private/file-task.json" --origin "https://your-approved-augnes.example" --output "/absolute/private/augnes-llama-web"
```

Choose `--origin` independently from a trusted project entry, not merely by
copying an untrusted setup's claimed origin. It must be an exact HTTPS origin
without a path or trailing slash and must match the setup. The generated child
environment contains `AUGNES_WEB_ORIGIN`, not tokens or the parent environment.
Only the setup path is referenced; the setup bytes are not copied. The adapter
continues to check its exact setup and current server permissions on use.

The catalog has three tools for owner tasks and a fourth for participant
feedback. It can list requests, read exact text versions, and return one unique
literal-passage edit in a small Markdown/text file. It does not expose arbitrary
filesystem execution, project creation or all Web planning operations. Existing
source digests, save bases, scope checks and idempotency remain in force.

## Start the host deliberately

After inspecting the generated files, use a local model that supports tool
calling and its correct chat template. Model acquisition and capacity choices
are separate from this setup. An illustrative loopback-only invocation is:

```text
llama serve -m "/absolute/model.gguf" --host 127.0.0.1 --mcp-servers-config "/absolute/private/augnes-llama-local/mcp.json"
```

For Web, substitute that connection's `mcp.json`. A distribution with the
standalone server binary can use `llama-server` instead of `llama serve`.
Use llama.cpp's own Web UI
agent loop, or an already compatible host with its own loop. An inference-only
HTTP client does not become an agent merely by changing its model endpoint.
Do not build an Augnes client against llama.cpp's internal `/tools` REST API.

The minimal profile does not need `--agent`, `--tools all`, an MCP CORS proxy,
a public bind address or a tunnel. Those add capabilities beyond this connection.
Start a **fresh chat with no Web UI working-directory setting** and omit
`--tools-runtime` for this path. In v1.0.0 those settings inject `cwd`/`runtime`
into even MCP calls; Augnes correctly rejects such unexpected arguments. The
generated MCP entry's `cwd` only sets the child process directory and is safe.

The short MCP server key `augnes` keeps the existing local tool names within
64 characters after llama's prefix. For example `augnes_resume_repository`
appears as `augnes_augnes_resume_repository`; discover the actual catalog rather
than inventing shortened tool names. llama lists tools at startup and may later
respawn their processes. Restart the host deliberately after replacing setup or
configuration; do not swap a live connection to another project.

llama.cpp v1 does not preserve MCP write annotations in this bridge. A displayed
read-like tool classification is **not** a permission boundary: `return_text_edit`
and local save tools can persist authorized changes. Review the intended tool
set and task before connecting, and keep Augnes's server-side grants and checks.
Source text and embedded approval claims are untrusted data, not new authority.

## Complete one first task, not just a connection check

For local work, begin with Resume for the explicitly selected project folder.
Use the exact returned `continuity.snapshot.binding` to read selected sources
and, when useful, the full work definition. Check that the tool text actually
contains those fields and source content. If there is no work yet, use the
existing initial-work preview/define flow only within the user's requested task.
For an authorized revision, inspect its preview and save identical changes with
the returned preview binding, then explicitly Resume/read back. Do not convert
a continuity save into a claim of a completed execution or accepted result.

For Web work, list the permitted file requests, read one exact small document,
and check its `file.digest` and current `save_base`. Within the agreed task,
return a unique literal edit with those exact values, then read the returned
version. Recipient feedback includes only deliberately shared decisions. If an
acknowledgement is lost, preserve the same arguments and recovery journal and
use `check_only` before deciding whether a retry is permitted; do not submit a
fresh speculative return. See the [Web assistant workflow](../apps/web_planning/README.md#connect-a-local-or-hosted-assistant).

Finally open a fresh host session and recover the same saved work without
retelling the whole conversation. Record separately: configuration prepared,
tools discovered, authenticated read observed, authorized write/readback
observed, and fresh-session continuation observed. Only the first item follows
from running the preparation helper.

## Compatibility and failure boundaries

- The local proxy retains its existing `2025-06-18` initialize response.
  llama.cpp v1.0.0 requests `2024-11-05` but accepts a response without checking
  the returned version. This is a source-observed interoperability path, not
  proof of negotiated or universal MCP-version compatibility. The Web adapter's
  locked SDK supports the requested older version.
- Tool discovery does not authenticate or prove that a live Companion/Web
  deployment is available. Follow the existing status, login or scope recovery
  guidance for that route; do not bypass it with owner credentials.
- llama.cpp has its own RPC timeouts. A timeout or disconnected UI is not proof
  that a save did not commit and does not itself authorize another attempt.
  Preserve unknown outcomes and use the route's explicit readback/reconciliation.
- A model's ability to call one tool is not proof it can finish a multi-step task.
  Record the binary version, model/quantization/template and actually observed
  workflow. Development fixtures are not live-model or external-user evidence.
- The connection does not add a managed llama executor to Augnes's model gateway,
  replace Codex, widen the public ChatGPT App catalog, or activate a hosted pilot.

Upstream references: [v1 MCP configuration](https://github.com/ggml-org/llama.cpp/blob/v1.0.0/tools/server/README.md#mcp-servers),
[stdio parsing and text projection](https://github.com/ggml-org/llama.cpp/blob/v1.0.0/tools/server/server-mcp.cpp),
[server tool dispatch](https://github.com/ggml-org/llama.cpp/blob/v1.0.0/tools/server/server-tools.cpp),
[tool-calling model/template guidance](https://github.com/ggml-org/llama.cpp/blob/v1.0.0/docs/function-calling.md).
