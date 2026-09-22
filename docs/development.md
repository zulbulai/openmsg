# OpenMsg Development Guide

## 1. Prerequisites

- **Node.js**: `v20.0.0` or higher (`node -v`)
- **Package Manager**: `pnpm` (`v9.0.0` or higher) or `npm` (`v10.0.0` or higher)
- **Browser**: Google Chrome, Microsoft Edge, or Brave (supporting Manifest V3)

---

## 2. Quickstart Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Run test suite
pnpm test

# 3. Type check
pnpm typecheck

# 4. Code quality lint
pnpm lint

# 5. Format check
pnpm format:check

# 6. Start Vite development watcher
pnpm dev

# 7. Production build
pnpm build
```

---

## 3. Loading the Unpacked Extension in Chrome

1. Run the build or development watcher:
   ```bash
   pnpm build
   ```
   This generates the production bundle in `openmsg/dist/`.
2. Open Google Chrome (or Edge/Brave) and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the `dist/` directory inside `openmsg/`.
6. Open [web.whatsapp.com](https://web.whatsapp.com) or click the OpenMsg extension icon in the toolbar to launch the Side Panel.

---

## 4. Development Workflow Without a Live WhatsApp Account

To iterate on UI components, CRM pipelines, workflow builder graphs, and automation logic without scanning QR codes on a live WhatsApp account:

1. Enable **Mock Client Mode** in `src/content/whatsapp/index.ts`:
   ```ts
   import { MockWhatsAppClient } from './mock-client';
   export const client = new MockWhatsAppClient();
   ```
2. The mock client simulates:
   - Initialized and connected WhatsApp user state.
   - Pre-seeded contacts and chat threads.
   - Inbound message generation on key intervals.
   - Message ACK transitions (pending -> sent -> delivered -> read).

---

## 5. Directory Structure Overview

```text
openmsg/
├── src/
│   ├── background/        # Manifest V3 service worker (alarms, proxy)
│   ├── content/           # Content scripts & WhatsApp bridge proxy
│   ├── injected/          # Main-world bridge script
│   ├── sidepanel/         # React application entry for Chrome Side Panel
│   ├── popup/             # Extension toolbar popup
│   ├── options/           # Extension options page
│   ├── ui/                # Reusable UI component kit (buttons, dialogs, inputs)
│   ├── features/          # Feature domains (CRM, inbox, chatbot, workflows)
│   ├── core/              # Global events, logger, config
│   ├── storage/           # Dexie IndexedDB schemas and repositories
│   └── workflow-engine/   # Graph executor & node runner machine
├── docs/                  # Architectural and technical documentation
└── tests/                 # Vitest automated test suites
```
