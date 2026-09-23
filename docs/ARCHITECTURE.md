# OpenMsg — Architecture Documentation

This document describes the **actual runtime architecture**, execution contexts, and inter-process communications of OpenMsg.

---

## 1. Architectural Overview

OpenMsg is an unpacked **Chrome Extension Manifest V3** application that integrates a full CRM, automation suite, chatbot engine, and broadcast scheduler directly into WhatsApp Web (`https://web.whatsapp.com/`).

It runs entirely client-side inside the user's browser without requiring an external server or remote database.

```text
OpenMsg
│
├── Chrome Extension Layer (Manifest V3)
│   ├── Background Service Worker (src/background/sw.js)
│   ├── Content Script Loader (src/content/loader.js)
│   ├── Content Script Main (src/content/main.js)
│   ├── Main-World Script (src/bridge/main-bridge.js)
│   └── Permissions / Grant UI (pages/grant.html, pages/grant.js)
│
├── WhatsApp Integration Layer
│   ├── Vendor WPPConnect (vendor/wppconnect-wa.js)
│   ├── Main Bridge Context (src/bridge/main-bridge.js)
│   ├── Isolated Adapter Facade (src/core/wa.js)
│   └── Window Transport (window.postMessage protocol)
│
├── Workspace Relay Layer
│   ├── Tab Relay Provider (src/core/relay.js: relayTransport)
│   ├── Content Script Listener (src/core/relay.js: serveRelay)
│   └── Dedicated Workspace Page (pages/workspace.html, src/pages/workspace-main.js)
│
├── Storage Layer
│   ├── Store Coordinator & Cache (src/core/store.js: createStore)
│   ├── Chrome Storage Local Backend (src/core/store.js: chromeBackend)
│   ├── Memory Storage Backend (src/core/store.js: memoryBackend)
│   └── Multi-Context Change Sync (chrome.storage.onChanged)
│
├── Core Engines Layer
│   ├── App Lifecycle Coordinator (src/core/app.js)
│   ├── Event Bus (src/core/events.js)
│   ├── CRM Engine (src/core/crm.js)
│   ├── Automation Engine (src/core/automation.js)
│   ├── Visual Chatbot Engine (src/core/chatbot.js)
│   ├── Message Bots / Simple Workflows (src/core/workflows.js)
│   ├── Scheduler & Broadcast Engine (src/core/scheduler.js)
│   ├── Message Sender & Throttler (src/core/sender.js)
│   ├── AI Integration & Prompt Assistant (src/core/ai.js, src/core/assistant.js)
│   ├── Webhook Dispatcher (src/core/webhooks.js)
│   ├── Action Runner (src/core/actions.js)
│   ├── Reminders & Appointments (src/core/reminders.js)
│   ├── Chat Filters (src/core/filters.js)
│   └── Activity Logger (src/core/activity.js)
│
└── UI Presentation Layer
    ├── Host Element & Shadow DOM Root (#wacrm-host, src/ui/shell.js)
    ├── Reusable Component Kit (src/ui/kit.js)
    ├── DOM & SVG Primitives (src/ui/dom.js, src/ui/icons.js)
    ├── Scoped Stylesheet (src/styles/wacrm.css)
    ├── In-Page Workspace Shell (src/ui/shell.js)
    ├── Dedicated Tab Workspace Shell (src/ui/workspace.js)
    ├── Feature Modules (CRM Drawer, Composer Strap, Privacy Blur)
    └── 19 Workspace Panels (Kanban, Broadcasts, Chatbots, etc.)
```

---

## 2. Execution Contexts & Isolation

OpenMsg operates across four distinct JavaScript execution environments:

```
┌────────────────────────────────────────────────────────────────────────┐
│ BROWSER TAB: https://web.whatsapp.com/                                  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ MAIN WORLD (Page Context)                                         │  │
│  │  - vendor/wppconnect-wa.js (Exposes window.WPP)                  │  │
│  │  - src/bridge/main-bridge.js (Hooks WPP & WhatsApp Webpack)      │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
│                                    │ window.postMessage                │
│                                    │ (target: location.origin)         │
│  ┌─────────────────────────────────▼────────────────────────────────┐  │
│  │ ISOLATED WORLD (Content Script Context)                          │  │
│  │  - src/content/loader.js -> src/content/main.js                  │  │
│  │  - Shadow DOM (#wacrm-host): Sidebar, Topbar, Panels, Drawers    │  │
│  │  - Core Engines: CRM, Sender, Chatbots, Automation, Store        │  │
│  └──────────────────┬─────────────────────────────▲─────────────────┘  │
└─────────────────────┼─────────────────────────────┼────────────────────┘
                      │ chrome.runtime              │ chrome.tabs.sendMessage
                      │ sendMessage                 │ (type: 'wa-relay')
┌─────────────────────▼───────────────┐  ┌──────────┴────────────────────┐
│ BACKGROUND SERVICE WORKER (MV3)      │  │ DEDICATED TAB: workspace.html │
│  - src/background/sw.js             │  │  - pages/workspace.html       │
│  - chrome.alarms (wacrm:* alarms)   │  │  - src/pages/workspace-main.js│
│  - chrome.notifications             │  │  - Full-screen standalone     │
│  - fetch proxy (doHttp)             │  │    OpenMsg CRM workspace       │
│  - Optional Host Permissions check  │  │  - relayTransport via runtime │
└─────────────────────────────────────┘  └───────────────────────────────┘
```

### Context Breakdown:

1. **Main World (`world: "MAIN"`)**:
   - Files: `vendor/wppconnect-wa.js`, `src/bridge/main-bridge.js`.
   - Access: Has access to WhatsApp Web's `window` object, Webpack internal modules, `ContactStore`, `ChatStore`, and socket connections.
   - Guard: Enforces `window.__WACRM_BRIDGE__` to prevent duplicate initialization.

2. **Isolated World (`world: "ISOLATED"`)**:
   - Files: `src/content/loader.js`, `src/content/main.js`, and all `src/core/*`, `src/ui/*`, `src/panels/*`, `src/features/*`.
   - Access: Has Chrome runtime APIs (`chrome.storage`, `chrome.runtime`, `chrome.permissions`).
   - DOM: Injects `#wacrm-host` with an open `ShadowRoot`. All extension UI renders inside this Shadow DOM, preventing any CSS bleed into or from WhatsApp Web.

3. **Background Service Worker**:
   - File: `src/background/sw.js` (`type: "module"`).
   - Lifecycle: Event-driven MV3 worker. Wakes on alarms, notifications, extension icon clicks, or messages.
   - Responsibilities:
     - Alarms management for reminders and scheduled broadcasts.
     - System notifications.
     - Outgoing HTTP proxy (`doHttp`) enforcing maximum body limits (2MB), timeouts, and permission boundaries.
     - Tab focusing and launching `pages/workspace.html`.

4. **Standalone Workspace Tab**:
   - Page: `pages/workspace.html` -> `src/pages/workspace-main.js`.
   - Purpose: Allows users to work in a dedicated browser tab (e.g., managing Kanban boards or building complex chatbot flows) rather than inside the WhatsApp Web sidebar.
   - Communication: Uses `relayTransport` (`src/core/relay.js`) to route WhatsApp queries through the open WhatsApp Web tab.

---

## 3. Storage Architecture

OpenMsg persists all data locally in the browser using `chrome.storage.local`.

- **Caching Layer**: `createStore` (`src/core/store.js`) maintains an in-memory `Map` per collection. All reads (`all`, `get`, `find`, `filter`) are instant synchronous memory lookups.
- **Debounced Flush**: Writes (`put`, `patch`, `remove`) immediately update the memory cache and schedule a debounced flush (100ms) to `chrome.storage.local`.
- **Blob Storage**: Large binary assets (images, voice notes, PDFs) are stored independently under `wacrm:blob:<id>` keys to avoid bloating collection JSON payloads.
- **Cross-Context Sync**: When data changes in one tab (e.g., WhatsApp Web tab), `chrome.storage.onChanged` fires in all other tabs (e.g., dedicated workspace tab), updating the in-memory cache and notifying UI subscribers.

---

## 4. Message Bus & Event Architecture

OpenMsg employs a decoupled publish/subscribe pattern via `createBus` (`src/core/events.js`):

- **Internal Bus (`app.bus`)**: Coordinates interactions between CRM, automation, scheduler, and webhooks without tight coupling.
- **Bridge Messages (`window.postMessage`)**: Uses structured request/response IDs (`uid('r')`) and typed events (`ready`, `chat.new_message`, `chat.active_chat`, `chat.msg_revoke`, etc.).
- **Chrome Runtime Messages**: Coordinates tab lifecycle and service worker notifications.

---

## 5. Security & Isolation Boundaries

1. **Style & DOM Isolation**: All UI CSS is applied strictly inside the Shadow Root (`#wacrm-host`). WhatsApp Web's stylesheet never alters OpenMsg components, and OpenMsg rules never leak into WhatsApp Web.
2. **DOM Safety**: Component generation strictly utilizes `h(...)` and `document.createTextNode`. String values are never passed to `.innerHTML` or `eval()`.
3. **Network Safety**: Outgoing network requests from webhooks or AI providers are proxied through `src/background/sw.js`, which verifies optional host permissions (`chrome.permissions.contains`) before executing the fetch. If permissions are missing, `pages/grant.html` is opened to obtain explicit user consent.
4. **Rate-Limiting Protection**: `src/core/sender.js` enforces hourly caps (`maxSendsPerHour`) and randomized human-like delays to protect user WhatsApp accounts from suspension.
