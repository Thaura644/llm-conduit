# LLM-Conduit — Consolidated Design

> **One-line:** A local, inspectable, role-based agent team IDE: think `llm-council` for *organizational governance* — agents with authority, tools, and auditable decisions.

> **Desktop Evolution:** Now packaged as a native cross-platform application with automated release pipeline via Electron.

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

## 2 — Desktop Application Architecture

### Hybrid Stack: Next.js + Electron

The application runs as a **standalone Next.js server** embedded within an **Electron shell**, providing:

- **Native Desktop Experience**: Window management, system tray, notifications
- **Secure IPC Bridge**: Contextual isolation with preload scripts for file system and database access
- **Portable Deployment**: Single executable with all dependencies bundled
- **Auto-Updates**: GitHub-based release distribution with automatic update checks

### File Structure

```
aos/
├── electron/
│   ├── main.js          # Application entry point, window management, Next.js server lifecycle
│   └── preload.js       # Secure IPC bridge for renderer→main communication
├── app/                 # Next.js application (UI & API routes)
│   ├── page.tsx         # Operations Command Center
│   ├── api/             # Server-side endpoints
│   └── ...
├── lib/aos/             # Core engine
│   ├── engine.ts        # Event orchestration, agent lifecycle
│   ├── chairman.ts      # Governance arbitration
│   ├── agents.ts        # LLM agent wrappers
│   └── db.ts            # SQLite persistence layer
├── .next/standalone/    # Built Next.js server (generated on build)
├── electron-builder.json # Cross-platform packaging config
└── .github/workflows/release.yml # Automated CI/CD pipeline
```

### Build & Release Pipeline

1. **`npm run build`**: Compiles Next.js to a standalone server bundle
2. **`npm run dist`**: Uses `electron-builder` to package the app for the current OS
3. **GitHub Actions**: On version tag push (`v*`), automatically builds installers for:
   - Windows: `.exe` (NSIS installer)
   - macOS: `.dmg` (disk image)
   - Linux: `.AppImage` (portable executable)

### Versioning Strategy

We follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

- **PATCH** (`0.1.1`): Bug fixes, performance improvements
- **MINOR** (`0.2.0`): New features, backward-compatible changes
- **MAJOR** (`1.0.0`): Breaking API changes, architecture overhauls

**Release Workflow:**
1. Update `version` in `package.json`
2. Commit: `git commit -am "chore: bump to vX.Y.Z"`
3. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. GitHub Actions builds and attaches installers to the release

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
- Electron build artifacts (`.exe`, `.dmg`, `.AppImage`)

### API Key Storage

Keys are stored in the SQLite database (`conduit.db`) within the user's `userData` directory:
- **Windows**: `%APPDATA%/conduit`
- **macOS**: `~/Library/Application Support/conduit`
- **Linux**: `~/.config/conduit`

Keys are **not encrypted** in this version—future releases will add AES-256 encryption.

### Network Security

- All LLM API calls use HTTPS
- No telemetry or analytics sent to external servers
- The application operates entirely locally, with no cloud dependencies

---

## 6 — Installation & Distribution

### For End Users

Download the latest installer from [GitHub Releases](https://github.com/Thaura644/llm-conduit/releases):
- **Windows**: `Conduit-Setup-{version}.exe`
- **macOS**: `Conduit-{version}.dmg`
- **Linux**: `Conduit-{version}.AppImage`

### For Developers

```bash
git clone https://github.com/Thaura644/llm-conduit.git
cd aos
npm install
npm run electron:serve
```

---

**Built for the era of sovereign agentic collaboration.**
