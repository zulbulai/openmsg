# OpenMsg — AI Development Skills Configuration

This document records the evaluation, installation, and usage instructions for AI skills supporting OpenMsg development.

---

## 1. Installed & Configured Skills

### A. `openmsg-dev` (Workspace Skill)
- **Location**: `.agents/skills/openmsg-dev/SKILL.md`
- **Status**: **INSTALLED & CONFIGURED**
- **Purpose**: Provides core architectural guardrails, coding conventions, and debugging procedures specialized for the OpenMsg codebase.
- **Why OpenMsg Needs It**: Ensures any AI coding assistant understands that OpenMsg uses Vanilla ES Modules, Manifest V3, and Shadow DOM UI without introducing unwanted frameworks (like React/Vite) or rewriting working code.
- **How It Should Be Used**: Automatically discovered and activated by Antigravity agents during pair programming on OpenMsg.

### B. `agy-customizations` (Built-in Skill)
- **Location**: `~/.gemini/antigravity-ide/builtin/skills/agy-customizations/SKILL.md`
- **Status**: **AVAILABLE**
- **Purpose**: Reference guide for configuring rules, skills, plugins, and hooks in the Antigravity agent system.
- **Why OpenMsg Needs It**: Guides proper configuration of workspace rules (`CLAUDE.md`, `.agents/skills/`).

### C. `antigravity_guide` (Built-in Skill)
- **Location**: `~/.gemini/antigravity-ide/builtin/skills/antigravity_guide/SKILL.md`
- **Status**: **AVAILABLE**
- **Purpose**: Comprehensive reference for the Antigravity CLI, IDE features, and SDK commands.
- **Why OpenMsg Needs It**: Assists with developer tooling and environment interactions.

---

## 2. Evaluation of External / Specialized Skills

During our audit, we inspected the relevance of external skill domains specified in user requirements:

| Skill Domain | Relevance to OpenMsg | Evaluation Status | Recommendation |
| :--- | :--- | :--- | :--- |
| **Chrome Extension Manifest V3** | **CRITICAL** | Handled natively by `openmsg-dev` & `CLAUDE.md`. | Rules strictly enforce MV3 service worker lifecycles and permission checks. |
| **JavaScript / ES2022+** | **CRITICAL** | Native Node.js & browser standards. | `node --check` and ES module syntax rules enforced. |
| **Shadow DOM & Vanilla CSS** | **HIGH** | Configured in `openmsg-dev`. | Enforces UI encapsulation inside `#wacrm-host`. |
| **React / TypeScript** | **NOT APPLICABLE** | Codebase is pure Vanilla JS. | *Do not install*. Adding React or TypeScript would conflict with the zero-build philosophy. |
| **IndexedDB / Dexie** | **NOT APPLICABLE** | Codebase uses `chrome.storage.local`. | OpenMsg uses an in-memory Map layer over `chrome.storage.local`, not Dexie. |
| **Playwright / Vitest** | **RECOMMENDED FOR FUTURE** | Currently unconfigured (0 npm dependencies). | Node's built-in `node:test` runner is recommended over heavy test dependencies. |
| **Chrome DevTools Protocol (MCP)** | **AVAILABLE** | Pre-configured in IDE as `chrome-devtools-mcp`. | Can be utilized for live browser inspection and DOM verification. |

---

## 3. How to Use Skills in Future Tasks

1. **Developing Features**:
   - The agent reads `CLAUDE.md` and `.agents/skills/openmsg-dev/SKILL.md` to follow the mandatory Change Impact Rule and 12 Coding Principles.
2. **Auditing Changes**:
   - Run syntax verification (`node --check`) before committing.
   - Verify that all DOM elements use `h(...)` and remain inside the Shadow Root.
