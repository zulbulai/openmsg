# OpenMsg — Codebase Map

This document maps all directories and key files in the OpenMsg repository, outlining their responsibilities, dependencies, consumers, and risk ratings.

---

## Directory Overview

```text
OPENMSG
├── manifest.json              # Extension Manifest V3 configuration
├── build.json                 # Build metadata and version info
├── package.json               # NPM metadata and basic test runner script
├── pages/                     # Extension HTML entry points
├── icons/                     # Extension icons (16px to 512px)
├── vendor/                    # Third-party vendor dependencies
└── src/
    ├── background/            # MV3 background service worker
    ├── bridge/                # Main-world content script interfacing with WhatsApp
    ├── content/               # Isolated-world bootstrap scripts
    ├── core/                  # Pure business logic engines and data persistence
    ├── features/              # In-page overlay features (CRM drawer, composer strap, blur)
    ├── panels/                # Workspace panels and UI screens (Kanban, Broadcasts, etc.)
    ├── styles/                # Shadow DOM CSS stylesheets
    └── ui/                    # UI primitives, component kit, and workspace shells
```

---

## Detailed File Directory Breakdown

### 1. Root & Extension Entry Points

#### `manifest.json`
- **Purpose**: Chrome Extension Manifest V3 definition.
- **Responsibility**: Declares permissions (`storage`, `unlimitedStorage`, `alarms`, `notifications`), host permissions, background worker, content scripts, and web-accessible resources.
- **Risk Level**: **CRITICAL**. Any malformed key causes extension failure to load in Chrome.

#### `pages/workspace.html` & `src/pages/workspace-main.js`
- **Purpose**: Dedicated standalone tab workspace.
- **Responsibility**: Boots OpenMsg outside WhatsApp Web in a full browser tab, connecting via `relayTransport`.
- **Dependencies**: `src/core/app.js`, `src/core/store.js`, `src/core/relay.js`, `src/ui/workspace.js`.
- **Risk Level**: **MEDIUM**.

#### `pages/grant.html` & `pages/grant.js`
- **Purpose**: Chrome permission request popup.
- **Responsibility**: Requests optional host permissions (`chrome.permissions.request`) when webhooks or AI APIs connect to external domains.
- **Risk Level**: **LOW**.

---

### 2. Extension Scripts

#### `src/background/sw.js`
- **Purpose**: Background service worker (MV3).
- **Responsibility**: Alarms scheduling, desktop notifications, HTTP proxying (`doHttp`) with origin checks, tab query and focus.
- **Exports**: None (Service worker script).
- **Consumers**: Content scripts and workspace tabs via `chrome.runtime.sendMessage`.
- **Risk Level**: **CRITICAL**. Terminated by Chrome when idle; state must not rely on global memory.

#### `src/bridge/main-bridge.js`
- **Purpose**: Main-world WhatsApp Web integration bridge.
- **Responsibility**: Interacts with `window.WPP`, queries `ChatStore` and `ContactStore`, overrides text sending to append signatures, emits real-time WhatsApp events.
- **Dependencies**: `vendor/wppconnect-wa.js`.
- **Consumers**: `src/core/wa.js` via `window.postMessage`.
- **Risk Level**: **CRITICAL**. Directly touches WhatsApp Web internal JavaScript runtime.

#### `src/content/loader.js`
- **Purpose**: Guarded dynamic importer.
- **Responsibility**: Dynamically imports `src/content/main.js` to catch bootstrap errors.
- **Risk Level**: **LOW**.

#### `src/content/main.js`
- **Purpose**: Isolated-world application entry point.
- **Responsibility**: Boots the core app, connects `windowTransport`, serves the relay for standalone tabs, mounts the Shadow DOM shell.
- **Dependencies**: `src/core/app.js`, `src/ui/shell.js`, `src/core/relay.js`.
- **Risk Level**: **HIGH**. Primary entry point for in-page WhatsApp injection.

---

### 3. Core Engine Layer (`src/core/`)

#### `src/core/app.js`
- **Purpose**: Core application coordinator and lifecycle manager.
- **Responsibility**: Instantiates and wires together store, bus, wa, crm, activity, http, webhooks, sender, ai, chatbots, assistant, automation, scheduler, and reminders.
- **Exports**: `createApp`.
- **Consumers**: `src/content/main.js`, `src/pages/workspace-main.js`.
- **Risk Level**: **CRITICAL**. Central wiring point for all services.

#### `src/core/store.js`
- **Purpose**: Local data persistence and caching engine.
- **Responsibility**: Maintains synchronous in-memory Maps per collection; flushes debounced mutations to `chrome.storage.local`; handles cross-context sync via `chrome.storage.onChanged`; handles blob storage and JSON backup/restore.
- **Exports**: `COLLECTIONS`, `DEFAULT_SETTINGS`, `memoryBackend`, `chromeBackend`, `createStore`.
- **Consumers**: Almost all core engines and UI panels.
- **Risk Level**: **CRITICAL**. Core database engine. Schema or sync bugs cause data loss.

#### `src/core/wa.js`
- **Purpose**: WhatsApp bridge client facade and communication adapter.
- **Responsibility**: Translates application requests into `windowTransport` postMessages to `main-bridge.js`; caches chats; provides high-level WhatsApp operations.
- **Exports**: `windowTransport`, `createWa`.
- **Consumers**: `src/core/app.js`, `src/features/*`, `src/panels/*`.
- **Risk Level**: **CRITICAL**. Bridge between isolated world and main world.

#### `src/core/crm.js`
- **Purpose**: CRM business logic.
- **Responsibility**: Manages contacts, tags, custom fields, notes, reminders, appointments, tabs, and multi-dashboard Kanban pipelines (`kanbanDashboards`, `kanbanStages`, `kanbanCards`).
- **Exports**: `DEFAULT_STAGES`, `DEFAULT_TAGS`, `TAG_COLORS`, `FIELD_TYPES`, `MAIN_DASHBOARD_ID`, `createCrm`.
- **Consumers**: `src/core/app.js`, `src/features/crm-drawer.js`, `src/panels/kanban.js`, `src/panels/crm-settings.js`.
- **Risk Level**: **HIGH**. Manages all CRM entities and Kanban state.

#### `src/core/automation.js`
- **Purpose**: Inbound message traffic controller.
- **Responsibility**: Filters ignored chats (broadcasts/newsletters); tracks first-seen chats; routes messages to active chatbot sessions, trigger checks, keyword message bots, and AI assistant; tracks human replies to pause bots.
- **Exports**: `createAutomation`.
- **Consumers**: `src/core/app.js`.
- **Risk Level**: **HIGH**. Orchestrates all automated reply systems.

#### `src/core/chatbot.js`
- **Purpose**: Visual flowchart chatbot engine.
- **Responsibility**: Graph schema validation, 18 node types, condition evaluation (12 operators), session persistence (`chatSessions`), timeout alarms, execution loop.
- **Exports**: `NODE_TYPES`, `OPERATORS`, `FORMATS`, `newGraph`, `newFlow`, `validateGraph`, `createChatbotEngine`.
- **Consumers**: `src/core/app.js`, `src/panels/chatbots.js`, `src/panels/chatbot-builder.js`.
- **Risk Level**: **HIGH**. Complex state machine executing automated flows.

#### `src/core/workflows.js`
- **Purpose**: Message bots (simple keyword/event trigger auto-responders).
- **Responsibility**: Validates workflows, matches keyword/newChat rules, formats canned or custom replies.
- **Exports**: `newWorkflow`, `validateWorkflow`, `workflowMatches`, `replyMessages`.
- **Consumers**: `src/core/automation.js`, `src/panels/message-bot.js`.
- **Risk Level**: **MEDIUM**.

#### `src/core/scheduler.js`
- **Purpose**: Broadcast campaigns, scheduled messages, and sequence runner.
- **Responsibility**: Resolves multi-target audiences (individuals, groups, tabs, stages, tags, labels); runs throttled sending loops with randomized delays and pauses; supports cancel/stop-on-reply; integrates with Chrome alarms.
- **Exports**: `CAMPAIGN_STATUS`, `isScheduled`, `reachesChat`, `newCampaign`, `validateCampaign`, `createScheduler`.
- **Consumers**: `src/core/app.js`, `src/panels/broadcasts.js`, `src/panels/schedules.js`.
- **Risk Level**: **HIGH**. Handles bulk message dispatch.

#### `src/core/sender.js`
- **Purpose**: Outbound message queue and anti-ban throttler.
- **Responsibility**: Sequentially queues outbound messages; enforces hourly sending limits (`maxSendsPerHour`); simulates typing delays; attaches signatures; formats list/button messages with plain-text fallback.
- **Exports**: `signHeader`, `signMessage`, `typedPrefix`, `createSender`.
- **Consumers**: `src/core/app.js`, `src/core/automation.js`, `src/core/chatbot.js`, `src/core/scheduler.js`.
- **Risk Level**: **CRITICAL**. Controls delivery to WhatsApp; bugs risk account bans.

#### `src/core/ai.js` & `src/core/assistant.js`
- **Purpose**: AI integration layer (OpenAI, Gemini, Anthropic) and automated chat assistant.
- **Responsibility**: Manages AI providers, model endpoints, and prompt templates; runs the automated assistant with business hours checks and human handoff detection.
- **Exports**: `AI_PROVIDERS`, `STRAP_ACTIONS`, `HANDOFF_TOKEN`, `createAi`, `DEFAULT_ASSISTANT`, `createAssistant`.
- **Consumers**: `src/core/app.js`, `src/features/strap.js`, `src/panels/ai-assistant.js`.
- **Risk Level**: **MEDIUM**.

#### `src/core/relay.js`
- **Purpose**: Tab-to-tab RPC transport.
- **Responsibility**: Enables standalone tabs (`pages/workspace.html`) to invoke WhatsApp operations through the active WhatsApp Web tab.
- **Exports**: `relayTransport`, `serveRelay`.
- **Consumers**: `src/content/main.js`, `src/pages/workspace-main.js`.
- **Risk Level**: **HIGH**. Foundation for multi-tab workspace functionality.

#### `src/core/webhooks.js`
- **Purpose**: Outgoing HTTP webhook dispatcher.
- **Responsibility**: Dispatches event notifications to external URLs with HMAC-SHA256 signatures, retry logic, and delivery logging (`webhookLog`).
- **Exports**: `WEBHOOK_EVENTS`, `createWebhooks`.
- **Consumers**: `src/core/app.js`, `src/core/actions.js`, `src/panels/webhooks.js`.
- **Risk Level**: **LOW**.

#### `src/core/actions.js`
- **Purpose**: Reusable action sequence runner.
- **Responsibility**: Executes post-actions (tag add/remove, tab add/remove, Kanban stage assignment, label assignment, archive, block, webhook trigger).
- **Exports**: `emptyActions`, `hasActions`, `createActions`.
- **Consumers**: `src/core/app.js`, `src/core/automation.js`, `src/core/chatbot.js`, `src/core/scheduler.js`.
- **Risk Level**: **MEDIUM**.

#### `src/core/reminders.js`
- **Purpose**: Per-contact reminders and appointment scheduler.
- **Responsibility**: Manages reminder dues, appointment booking with overlap prevention, desktop notifications, and upcoming alarm syncing.
- **Exports**: `APPOINTMENT_STATUS`, `REMINDER_OPTIONS`, `createReminders`.
- **Consumers**: `src/core/app.js`, `src/panels/calendar.js`, `src/features/crm-drawer.js`.
- **Risk Level**: **MEDIUM**.

#### `src/core/filters.js`
- **Purpose**: WhatsApp Web chat list filter tabs.
- **Responsibility**: Applies system filters (Unread, Favorites, One-to-One, Groups, Unsaved, Business, Awaiting reply), custom tabs, and label filters to WhatsApp's UI.
- **Exports**: `SYSTEM_FILTERS`, `createFilters`.
- **Consumers**: `src/core/app.js`, `src/features/strap.js`, `src/panels/tabs.js`.
- **Risk Level**: **MEDIUM**.

#### `src/core/events.js`
- **Purpose**: Pub/sub event bus.
- **Responsibility**: In-memory event dispatching with wildcard and unsubscribe support.
- **Exports**: `createBus`.
- **Consumers**: `src/core/app.js`, `src/core/store.js`, `src/core/wa.js`.
- **Risk Level**: **LOW**.

#### `src/core/util.js`
- **Purpose**: Shared utility library.
- **Responsibility**: ID generation, sleep, math clamping, deep clone, formatting (dates, phone numbers), debounce, throttle, DOM download, object path access.
- **Exports**: `uid`, `sleep`, `rand`, `clamp`, `clone`, `debounce`, `fmtDateTime`, `truncate`, etc.
- **Consumers**: Entire codebase.
- **Risk Level**: **HIGH**. Widely consumed utility foundation.

---

### 4. UI Layer (`src/ui/`)

#### `src/ui/shell.js`
- **Purpose**: In-page workspace shell inside WhatsApp Web.
- **Responsibility**: Creates `#wacrm-host` Shadow DOM root; injects topbar; adjusts WhatsApp Web layout (`#app` top and height); routes panels; mounts CRM drawer, strap, and blur features.
- **Exports**: `mountShell`.
- **Consumers**: `src/content/main.js`.
- **Risk Level**: **CRITICAL**. Incorrect DOM or layout calculations break WhatsApp Web rendering.

#### `src/ui/workspace.js`
- **Purpose**: Standalone workspace shell for `pages/workspace.html`.
- **Responsibility**: Mounts full-screen workspace with panel routing in dedicated browser tabs.
- **Exports**: `mountWorkspace`.
- **Consumers**: `src/pages/workspace-main.js`.
- **Risk Level**: **MEDIUM**.

#### `src/ui/kit.js`
- **Purpose**: Reusable component kit.
- **Responsibility**: Buttons, icon buttons, chips, avatars, inputs, toggles, form fields, modals, menus, toasts, segmented controls, drag-and-drop.
- **Exports**: `button`, `iconButton`, `chip`, `avatar`, `input`, `textarea`, `openModal`, `toast`, etc.
- **Consumers**: All panels and feature drawers.
- **Risk Level**: **HIGH**. Shared UI toolkit.

#### `src/ui/dom.js` & `src/ui/icons.js`
- **Purpose**: Pure DOM builder and SVG icon library.
- **Responsibility**: XSS-safe DOM node creation (`h`), SVG creation (`svgEl`), Lucide icon rendering (`icon`), logo rendering.
- **Exports**: `h`, `clear`, `replaceChildren`, `svgEl`, `icon`, `logo`, `ICON_DATA`.
- **Consumers**: All UI files.
- **Risk Level**: **HIGH**. Prevents XSS vulnerabilities across all rendered views.

#### `src/ui/about-dialog.js`
- **Purpose**: Version and project info dialog.
- **Responsibility**: Displays OpenMsg version, open-source metadata, and GitHub link.
- **Exports**: `appVersion`, `openAboutDialog`, `openLicenseDialog`, `licenseChip`, `licenseNotice`.
- **Consumers**: `src/ui/settings-menu.js`, `src/ui/shell.js`.
- **Risk Level**: **LOW**.

---

### 5. Feature Modules (`src/features/`)

#### `src/features/crm-drawer.js`
- **Purpose**: Contact side-drawer for open WhatsApp chats.
- **Responsibility**: Displays contact profile, pipeline stage, tags, notes, reminders, custom fields, and bot pause toggles for the currently active chat.
- **Risk Level**: **MEDIUM**.

#### `src/features/strap.js`
- **Purpose**: Message composer toolbar and slash commands.
- **Responsibility**: Injects quick action buttons (canned responses, AI actions, templates) above the WhatsApp message input box; handles `/` slash command popup.
- **Risk Level**: **HIGH**. Hooks WhatsApp Web composer DOM directly.

#### `src/features/blur.js`
- **Purpose**: Privacy blur overlay for screen sharing.
- **Responsibility**: Injects CSS blur rules to obscure contact names, phone numbers, avatars, and message previews.
- **Risk Level**: **LOW**.

---

### 6. Workspace Panels (`src/panels/`)

All panels export a panel definition object `{ id, title, subtitle, icon, render(ctx) }`:
- `kanban.js`: Visual drag-and-drop CRM pipeline board with stages and cards.
- `chatbots.js` & `chatbot-builder.js`: Chatbot list and visual graph node editor.
- `broadcasts.js` & `schedules.js`: Broadcast campaign and scheduled message managers.
- `calendar.js`: Calendar and appointment management views.
- `canned.js`: Canned quick-reply manager with keyboard shortcuts.
- `message-bot.js`: Simple keyword trigger bot list and editor.
- `ai-assistant.js`: AI assistant configuration and prompt testing.
- `webhooks.js`: Outgoing webhook management and delivery logs.
- `crm-settings.js`: Pipelines, stages, tags, and custom fields management.
- `utilities.js`: Number validator, contact exporter, backup/restore, wa.me generator.
- `status-posts.js`: WhatsApp Status story publisher and scheduler.
- `settings.js`: Core settings, hourly send limits, signatures, and theme selection.
