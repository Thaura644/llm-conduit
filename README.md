# LLM Conduit

**LLM Conduit is ...your local multi-model AI Execution Board.**

**A sovereign, event-driven orchestration engine for autonomous agent collaboration.**

Built on Next.js with Electron, it provides a high-fidelity command center for managing organizational AI intelligence across multiple models and providers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](https://github.com/Thaura644/llm-conduit/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/Thaura644/llm-conduit/releases)

## ✨ Key Features

- **⚡ Multi-Provider Key Vault**: Direct API integration with OpenAI, Anthropic, Google (Gemini), xAI (Grok), NVIDIA, and more ..via openrouter as well
- **👔 Chairman Governance**: Automated arbitration between conflicting proposals with organizational rule enforcement
- **🔄 Autonomous Mode**: Enable the council to self-approve high-confidence missions without manual oversight
- **🎯 Real-Time Telemetry**: Live "Neural Trace" streaming every agent's thought process as it happens
- **📊 Persistent Memory**: SQLite-backed knowledge hub for unlimited context grounding
- **🖥️ Native Desktop**: Cross-platform Electron app with secure IPC for file system and database access

## 📦 Installation

### Prerequisites
- **Node.js** >= 18.x
- **Git**

### Option 1: Download Pre-Built Installer (Recommended)

Download the latest installer for your platform from the [Releases](https://github.com/Thaura644/llm-conduit/releases) page:

- **Windows**: `Conduit-Setup-{version}.exe`
- **macOS**: `Conduit-{version}.dmg`
- **Linux**: `Conduit-{version}.AppImage`

### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/Thaura644/llm-conduit.git
cd aos

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## 🚀 Quick Start

### 1. Launch the Application

**Development Mode:**
```bash
npm run electron:serve
```

**Production Build:**
```bash
npm run build
npm run dist
```

### 2. Configure Your Team

1. Navigate to the **Organization** tab
2. Define team roles (e.g., CEO, CTO, PM, Developer)
3. Assign LLM models to each role from the roster (Grok 3, Gemini 2.0 Pro, Claude 3.5 Sonnet, etc.)

### 3. Provision API Keys

1. Open the **Key Vault** tab
2. Add direct API keys for your chosen providers
3. Test connectivity using the built-in health check

### 4. Issue Your First Mission

```plaintext
Navigate to Operations > New Mission
Enter: "Create a simple Hello World app in Go"
Press Enter to Transmit
```

The council will:
- Analyze the objective
- Propose execution strategies
- Await your approval or auto-execute (if Autonomous Mode is enabled)
- Stream all decision-making telemetry in real-time

## 🔀 Versioning & Updates

This project follows **[Semantic Versioning (SemVer)](https://semver.org/)**. Given a version number `MAJOR.MINOR.PATCH`, we increment the:

- **MAJOR** version when we make incompatible API changes
- **MINOR** version when we add functionality in a backward-compatible manner
- **PATCH** version when we make backward-compatible bug fixes

### What This Means for You

- ✅ **PATCH updates** (`~0.1.4`): Safe bug fixes — update freely
- ✅ **MINOR updates** (`^0.1.0`): New features, backward-compatible — low risk
- ⚠️ **MAJOR updates** (`1.0.0`): May contain breaking changes — review changelog

### Auto-Updates

Conduit uses `electron-builder`'s built-in auto-update mechanism. When a new version is released:
1. You'll be notified in the app
2. The update will download in the background
3. Restart the app to apply

## 🗺️ Roadmap

- **v0.2.0** - Enhanced rejection-triggered re-strategizing
- **v0.3.0** - Multi-session parallel missions
- **v1.0.0** - Stable API, custom agent plugin system

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Electron Shell (main.js)         │
│  ┌───────────────────────────────────┐  │
│  │   Next.js Standalone Server       │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  React UI (Command Center)  │  │  │
│  │  │  - Operations Dashboard     │  │  │
│  │  │  - Organization Manager     │  │  │
│  │  │  - Knowledge Hub            │  │  │
│  │  │  - Key Vault                │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Conduit Engine (Node.js)   │  │  │
│  │  │  - Event Loop               │  │  │
│  │  │  - Agent Orchestration      │  │  │
│  │  │  - Chairman Arbitration     │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  SQLite Database            │  │  │
│  │  │  - Event Log                │  │  │
│  │  │  - Team Roles               │  │  │
│  │  │  - Knowledge Records        │  │  │
│  │  │  - API Keys (encrypted)     │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 👥 Contributing

We welcome contributions! LLM Conduit is a community-driven project. To get started:

1. **🌟 Star the project** to show your support and stay updated!
2. **🔍 Find an Issue**: Browse our [GitHub Issues](https://github.com/Thaura644/llm-conduit/issues) to find something to work on.
3. **🙋 Request Permission**: If you find an issue you'd like to tackle, please comment on it to request permission/assignment so we avoid duplicate work.
4. **📝 Report Bugs**: Found a bug? Open a new issue with detailed reproduction steps.
5. **💡 Propose Features**: Have an idea? Start a discussion or open a feature request.

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Run Next.js dev server + Electron
npm run electron:serve

# Build for production
npm run build

# Package for your current OS
npm run dist
```

### Code Style

- Follow existing TypeScript/React patterns
- Keep functions pure and testable
- Document complex logic with comments
- Use descriptive variable names

## 🛠️ Building & Packaging

### Build for Current Platform

```bash
npm run dist
```

Outputs will be in the `dist/` directory.

### Cross-Platform Builds

To build for all platforms, you'll need to run the build on the respective OS or use a CI/CD pipeline (see `.github/workflows/release.yml`).

### Creating a Release

1. Update `version` in `package.json`
2. Commit changes: `git commit -am "chore: bump version to x.y.z"`
3. Create and push a tag: `git tag vx.y.z && git push origin vx.y.z`
4. GitHub Actions will automatically build and attach installers to the release

## ❓ Support

- **Questions?** Open a [GitHub Discussion](https://github.com/Thaura644/llm-conduit/discussions)
- **Bugs?** Report via [GitHub Issues](https://github.com/Thaura644/llm-conduit/issues)
- **Security?** Email security concerns to [my Email](mailto:jamesthaura51@gmail.com)

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built on Next.js, React, and Electron
- Powered by OpenAI, Anthropic, Google, xAI, NVIDIA, and other leading AI providers
- Inspired by the vision of sovereign agentic collaboration and **Andrej Karpathy's (@karpathy) [llm-council](https://github.com/karpathy/llm-council)** project.

---

**Built for the era of autonomous intelligence governance.**
