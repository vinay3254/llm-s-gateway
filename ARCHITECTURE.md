# llm-gateway — Frontend / Backend Architecture

## Backend (Node.js / TypeScript)

**Role:** the actual gateway. Everything downstream (dashboard, IDEs, agents) talks to this.

### Components

- **REST API server** (`src/server.ts`)
  - `POST /v1/chat/completions` — OpenAI-compatible completion endpoint, routes to a provider
  - `GET /v1/models` — lists configured models
  - `GET /v1/logs` *(planned)* — recent request/response history for the dashboard
  - `GET /v1/health` *(planned)* — provider status, key validity

- **Router** (`src/router.ts`)
  - Matches requested `model` against `config.yaml`
  - Dispatches to the matching provider adapter

- **Provider adapters** (`src/providers/`)
  - `anthropic.ts`, `openai.ts` — translate OpenAI-format requests into each provider's native API and back
  - New providers = new file implementing the `Provider` interface

- **MCP server** (`src/mcp/server.ts`)
  - Runs as a separate process, exposed over stdio (standard for IDE-registered MCP servers)
  - Exposes a `review_code` tool: an agent (Antigravity, Claude Code, etc.) calls this tool directly, passing code/diff/context
  - Internally calls the router against `default_reviewer` (or a caller-specified model) and returns structured feedback as the tool result
  - This is the "agent can drive it and get a review" piece, same shape as OmniRoute's agent-protocol surface

- **Config loader** (`src/config.ts`)
  - Reads `config.yaml` (model list, provider keys, default reviewer, port)
  - Single source of truth for both the REST server and the MCP server

### Data flow for a review

```
Antigravity (IDE agent)
   │  calls MCP tool "review_code"
   ▼
MCP server (stdio)
   │  builds a review prompt, calls Router.route()
   ▼
Router → Provider adapter (e.g. Anthropic)
   │
   ▼
Reviewer model response
   │  formatted as MCP tool result
   ▼
Back to Antigravity, in-IDE
```

---

## Frontend (planned — not built yet)

**Role:** visibility and control over the backend. Not required for the gateway or MCP tool to work — purely operational.

**Stack:** React + Vite (matches your existing preference for a static, no-animation UI; no Next.js SSR complexity needed for a local-only dashboard)

### Pages / views

- **Models** — table of configured models from `GET /v1/models`, provider, status (key present/missing)
- **Logs** — recent requests: timestamp, model used, latency, token usage, success/error (from `GET /v1/logs`)
- **Reviews** — history of `review_code` calls: what was submitted, which model reviewed it, the feedback returned
- **Config** — read-only view of `config.yaml` to start; editable form later (add/remove models, change default reviewer)

### Communication

- Frontend talks to the backend REST API only (`/v1/models`, `/v1/logs`, `/v1/health`) — it never talks to providers directly and never touches the MCP stdio channel (that's IDE-to-backend only)
- Runs on its own port (e.g. `5173` dev / static build served separately), backend stays on `20128`

### Why it's separate from the MCP piece

The MCP tool is for **agents** (Antigravity, Claude Code) to call review programmatically, in-IDE, with no human in the loop needed. The frontend is for **you** to see what the gateway has been doing — separate consumer, separate concern, no dependency between the two.

---

## Build order

1. Backend REST gateway — done
2. MCP `review_code` tool on top of the backend — in progress
3. `GET /v1/logs` and `GET /v1/health` endpoints — needed before the frontend has anything to show
4. Frontend dashboard — last, once there's data worth displaying
