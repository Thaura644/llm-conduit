# LLM-Conduit — Consolidated Design

> **One-line:** A local, inspectable, role-based agent team IDE: think `llm-council` for *organizational governance* — agents with authority, tools, and auditable decisions.

> **Desktop Evolution:** Now packaged as a native lightweight application via **Tauri** (Rust), with a highly reliable **Docker** distribution for server/headless environments.

---

## 1 — Core Philosophy

**Everything is an event. Agents do not "chat" — they propose, justify, act, and get audited.**

Events are the single source of truth: append-only, serializable, replayable. UI = projection of event stream. CLI = NDJSON event stream. Tools and brains plug into this event fabric.

**The key idea**

**Users do not talk to agents.**
**Users issue commands to the organization.**

**Agents respond through decisions and actions, not conversation.**

Two-page mental model (very important)
Page 1 — Command Desk (User → Org)
Page 2 — Governance Console (Org → Reality)

They serve different purposes and should never be merged.

---

## 2 — Distribution & Shell Architecture

### Dual-Track Strategy: Tauri + Docker

The application prioritizes performance and reliability through two main distribution tracks:

#### Track A: Tauri (Native Desktop)
- **Rust Backend**: Replaces Node.js for the system shell, providing superior safety and minimal binary size (~10-20MB).
- **Static Frontend**: Next.js is configured for **Static Site Generation (SSG)**, allowing it to be bundled directly into the binary.
- **Sidecar Workflow**: The core Node.js orchestration engine runs as a managed **Sidecar process**, isolated from the shell.

#### Track B: Docker (Reliable Container)
- **Isolated Environment**: Packages the entire runtime (Node.js, SQLite binaries, Python) into a single container.
- **Zero-Setup**: Resolves "blank screen" or driver issues by running in the user's local browser via port `3000`.
- **Server-Ready**: Ideal for running LLM Conduit on remote servers or as a headless background service.

### File Structure

```
aos/
├── src-tauri/           # Tauri (Rust) backend, configuration, and build assets
├── app/                 # Next.js application (UI & API routes)
├── lib/aos/             # Core engine (The "Brain")
│   ├── engine.ts        # Event orchestration, agent lifecycle
│   ├── chairman.ts      # Governance arbitration
│   ├── agents.ts        # LLM agent wrappers
│   └── db.ts            # SQLite persistence layer
├── Dockerfile           # Multi-stage container build
├── docker-compose.yml   # Easy-launch orchestration
├── next.config.ts       # Configured for SSG/Export
└── README.md            # Track comparison and setup guide
```

### versioning Strategy

We follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- **PATCH** (`0.1.1`): Bug fixes, internal optimizations
- **MINOR** (`0.2.0`): New agent capabilities, UI enhancements
- **MAJOR** (`1.0.0`): Production stable release

---

## 3 — Organizational Intelligence Model

### The Non-Negotiable Rule

> **There is no "single agent run."
> Every meaningful action is a *team outcome*.**

If the council / org doesn't collaborate, this collapses back into a fancy wrapper.

### What "Work Together" Actually Means (Not Vibes)

Working together **does NOT mean**:
- Everyone speaks
- Sequential roleplay
- Simulated meetings

That's noise.

Working together **means**:

#### 1️⃣ Shared Objective, Shared State

- One `goal.submitted`
- One event log
- One causal chain

No agent has a private world.

#### 2️⃣ Division of Labor is Explicit and Visible

Agents don't "help". They **delegate**.

Example flow:
- PM emits `agent.proposed` → *task breakdown*
- CTO emits `agent.proposed` → *architecture*
- Dev emits `agent.proposed` → *implementation plan*
- CEO emits `decision.made` → *approval*

Each proposal:
- References prior proposals
- Advances the same goal
- Blocks or enables actions

That's collaboration.

#### 3️⃣ Agents Assign Work to Each Other

This is critical and most tools miss it.

Agents can emit:
> "I am not doing this — assign it."

Conceptually:
- CTO proposes: "Dev should implement X"
- That proposal creates a **pending responsibility**
- Dev cannot act until it exists
- CEO/CTO approval makes it executable

---

## 4 — Enhanced Features (Phase 5+)

### Autonomous Mode

The **Auto-Approve** toggle allows the council to self-execute high-confidence missions (consensus >80%) without manual oversight. This enables:
- Deadline adherence for low-risk operations
- Hands-free operation for trusted workflows
- Human-in-the-loop override at any time

### Real-Time Telemetry (Neural Trace)

The right panel streams every agent's thought process as it happens:
- "Analyzing Strategic Objectives..."
- "Weighing risk factors..."
- "Synchronizing proposal with team..."

No more silent loading states—every decision is visible.

### Rejection-Triggered Re-Strategizing

When a user clicks **Reject**, the engine:
1. Logs the rejection reason
2. Opens a new decision window with context: "User rejected X because Y"
3. Agents immediately re-propose improved strategies
4. Iteration continues until approval or mission cancellation

---

## 5 — Security & Privacy

### Secrets Management

All sensitive data is excluded from version control via `.gitignore`:
- `records/conduit.db` (SQLite database with API keys, event log)
- `.env*` files
- Build artifacts: `src-tauri/target`, `dist/`, `.next/`

### Persistence Layer

Data is persisted in the SQLite database (`conduit.db`):
- **Native (Tauri)**: Stored in the standard system app data directory (`~/.local/share/conduit` on Linux).
- **Container (Docker)**: Stored in a Docker volume (mapped to the `/app/data` directory).

Keys are **not encrypted** in the alpha version—future releases will add AES-256 encryption.

---

## 6 — Installation & Distribution

### For End Users

Download the latest installer or pull the image:
- **Track A (Native)**: Install the `.deb` or `.exe` from [GitHub Releases](https://github.com/Thaura644/llm-conduit/releases).
- **Track B (Docker)**: Run `docker-compose up --build -d` using the repository source.

### For Developers (Tauri Track)

```bash
git clone https://github.com/Thaura644/llm-conduit.git
cd llm-conduit
# Install Rust first!
npm install
npm run tauri dev
```

---

**Built for the era of sovereign agentic collaboration.**
