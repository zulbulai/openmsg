# Reference Architecture Analysis: WAFlow (v0.2.0.2)

> **Disclaimer**: This analysis is conducted strictly for architectural reference, reverse-engineering methodology analysis, and feature taxonomy planning for the independent open-source **OpenMsg** project. No source code, proprietary algorithms, private keys, or branding from the reference artifact are reused in OpenMsg.

---

## 1. Extension Architecture

The reference extension uses Manifest V3 with a dual-execution-world injection pattern to interact with WhatsApp Web without triggering security violations or losing access to Chrome extension APIs.

```text
Chrome Runtime
  │
  ├── Background (Service Worker: src/background/sw.js)
  │     ├── chrome.alarms (Scheduled campaign ticks & reminders)
  │     ├── chrome.notifications (System notification banners)
  │     ├── chrome.permissions (Dynamic host permission granting)
  │     └── fetch proxy (CORS-free requests for LLMs and Webhooks)
  │
  ├── WhatsApp Web Tab (https://web.whatsapp.com/*)
  │     │
  │     ├── ISOLATED World (src/content/loader.js -> src/content/main.js)
  │     │     ├── Core Orchestrator (src/core/app.js)
  │     │     ├── Indexed Store (src/core/store.js - chrome.storage.local)
  │     │     ├── Window Transport Client (src/core/wa.js)
  │     │     ├── UI Shell & Panels (src/ui/shell.js, src/panels/*)
  │     │     └── Shadow DOM Container (:host with src/styles/wacrm.css)
  │     │
  │     └── MAIN World (Direct WhatsApp DOM Context)
  │           ├── WPPConnect Core (vendor/wppconnect-wa.js)
  │           └── Bridge Listener (src/bridge/main-bridge.js)
  │                 ├── Hooks window.WPP (internal Webpack module taps)
  │                 ├── Listens to window.postMessage from Isolated World
  │                 └── Dispatches WhatsApp lifecycle & incoming message events
  │
  └── Standalone Tab Workspace (pages/workspace.html)
        ├── Fullscreen CRM Dashboard (src/pages/workspace-main.js)
        └── Relay Transport (src/core/relay.js via chrome.tabs communication)
```

### Execution Flow
1. **Bootstrapping**: When `https://web.whatsapp.com` loads, Chrome injects `vendor/wppconnect-wa.js` and `src/bridge/main-bridge.js` into the `MAIN` world at `document_idle`. Concurrently, `src/content/loader.js` runs in the `ISOLATED` world and dynamically imports `src/content/main.js`.
2. **Bridge Handshake**: `src/bridge/main-bridge.js` verifies that `window.WPP` is present. `src/core/wa.js` (isolated world) sends a handshake message via `window.postMessage`. The bridge responds with readiness status, current user phone/ID, and business account status.
3. **Event Relay**: Inbound messages, ACK delivery ticks, presence changes, and connection states are captured by WPPConnect event listeners in the `MAIN` world and dispatched to `ISOLATED` world via `window.postMessage`.
4. **Action Execution**: When automation or UI triggers an action (e.g., `sendText`, `addTag`, `scheduleMessage`), `src/core/wa.js` packages a structured RPC request with a unique correlation ID and awaits the response from the bridge.
5. **UI Rendering**: The isolated world attaches a Shadow Root to `document.body` and mounts `src/ui/shell.js` containing the top menu, CRM drawer, AI composer strap, and modal popups.

---

## 2. Major UI Modules

The reference project structures its user interface into a top navigation bar, quick-action drawers, message composer extensions, and 25 distinct panel views:

| Category | UI Module | File Path | Architectural Responsibility |
| :--- | :--- | :--- | :--- |
| **Shell & Layout** | Topbar Shell | `src/ui/shell.js` | Mounts fixed navigation bar into WhatsApp Web, handles active panel swapping, notifications badge, search modal, and theme switching. |
| **Shell & Layout** | Shadow DOM Container | `src/ui/styles.js`, `src/styles/wacrm.css` | Encapsulates all 1,116 lines of styling within a shadow root so WhatsApp Web's CSS is neither affected nor leaks inside. |
| **Composer Tool** | AI Action Strap | `src/features/strap.js` | Injects an AI quick-action bar above the WhatsApp Web chat input (Spelling, Translate, Summarize, Formalize, Tone adjust). |
| **Chat Drawer** | Contact CRM Drawer | `src/features/crm-drawer.js` | Slide-over drawer on active conversation displaying stage, tags, notes, reminders, appointments, and custom field editors. |
| **Privacy Tool** | Privacy Blur Mode | `src/features/blur.js`, `src/panels/blur.js` | Toggles selective CSS filters to blur contact names, phone numbers, avatars, and message bubbles on screen. |
| **Direct Chat** | Quick Chat Modal | `src/features/chat-modal.js`, `src/panels/send-message.js` | Dialog to open or start a chat with any unsaved international phone number. |
| **Chat Filters** | Custom Filter Tabs | `src/panels/tabs.js` | Custom segmented filter tabs above chat list (Unread, Groups, Awaiting Reply, Custom Labels). |
| **Sales CRM** | Kanban Pipeline | `src/panels/kanban.js` | Multi-pipeline drag-and-drop board with stage columns, deal cards, and value summaries. |
| **Automation** | Chatbot Builder | `src/panels/chatbot-builder.js`, `src/panels/chatbot-inspector.js` | Visual node-and-edge graph builder for conversational flow branching, node configuration, and variable assignment. |
| **Automation** | Keyword Autoresponder | `src/panels/message-bot.js` | Rule-based keyword matching triggers with canned responses and conditional routing. |
| **Campaigns** | Broadcast Manager | `src/panels/broadcasts.js` | Bulk messaging campaign wizard with recipient filtering, random delay throttling, and CSV audit reports. |
| **Calendar** | Calendar & Appointments | `src/panels/calendar.js` | Monthly/weekly scheduling view with booking drawer, reminder alarms, and customer status tags. |
| **Settings** | CRM & App Settings | `src/panels/crm-settings.js`, `src/panels/settings.js` | Pipeline configuration, custom fields definition, anti-ban rate limits, LLM API keys, and license status. |
| **Utilities** | Export & Backup Tools | `src/panels/utilities.js` | Phone number validator, contact CSV/vCard exporter, complete database backup/restore, and wa.me link generator. |

---

## 3. Core Business Logic Modules

| Core Module | File Path | Responsibilities & Abstractions |
| :--- | :--- | :--- |
| **App Orchestrator** | `src/core/app.js` | Coordinates lifecycle: initializes store, event bus, transport bridge, periodic tick loops (5000ms), alarm synchronization, and diagnostics. |
| **Event Bus** | `src/core/events.js` | In-memory pub/sub emitter providing typed decouplings across CRM, automation, sender, and UI. |
| **Sender & Anti-Ban** | `src/core/sender.js` | Enforces message throttling (`maxSendsPerHour`, default 250), randomized delays (`delayMin` to `delayMax`, default 3–8s), simulated typing indicator, message signing, and template variable replacement. |
| **CRM State** | `src/core/crm.js` | Manages contacts, stage transitions, tagging, custom fields (`text`, `number`, `date`, `select`, `multiselect`), and activity logs. |
| **Automation Engine** | `src/core/automation.js` | Event-driven listener reacting to inbound messages, stage shifts, and tag mutations; evaluates rule trees and initiates chatbot flows or canned actions. |
| **Chatbot Engine** | `src/core/chatbot.js` | Node execution machine. Supports 18 node types: Start, Text, Image, Video, Audio, Document, List, Buttons, Condition, SetVariable, Delay, Jump, StartNewFlow, Tag, Action, Webhook, Human Handoff, End. |
| **AI Assistant** | `src/core/ai.js`, `src/core/assistant.js` | Multi-provider client abstraction supporting OpenAI, Google Gemini, and Anthropic Claude. Implements business-hours filtering, conversation history buffers (10 turns), and human handoff detection (`[[HANDOFF]]`). |
| **Scheduler** | `src/core/scheduler.js`, `src/core/timecalc.js` | Calculates next cron/relative run times, validates recipient lists, and handles campaign progression. |
| **Reminders** | `src/core/reminders.js` | Manages appointment statuses (`scheduled`, `completed`, `cancelled`, `no-show`) and timing offsets (15m, 30m, 1h, 2h, 1d before). |
| **Webhooks Engine** | `src/core/webhooks.js` | Outbound HTTP event dispatcher with signature payload generation for 11 lifecycle triggers. |
| **Variables Engine** | `src/core/variables.js` | Safe string template substitution supporting system tokens (`{{name}}`, `{{phone}}`, `{{date}}`, `{{time}}`, `{{agent}}`) and custom contact fields. |

---

## 4. WhatsApp Web Integration

The reference project integrates with WhatsApp Web through a layered architecture:

```text
ISOLATED World: src/core/wa.js
       │
       │  window.postMessage({ id, type, data })
       ▼
MAIN World: src/bridge/main-bridge.js
       │
       │  Direct function calls on hooked Webpack modules
       ▼
window.WPP (vendor/wppconnect-wa.js)
       │
       ▼
WhatsApp Web React Internals & WebSocket Connection
```

### Communication APIs Exposed by Bridge:
1. **Chat Operations**: `chat.list`, `chat.get`, `chat.active`, `chat.open`, `chat.setFilter`, `chat.markRead`, `chat.typing`, `chat.archive`, `chat.messages`, `chat.setInput`.
2. **Outbound Messaging**: `send.text`, `send.file`, `send.poll`, `send.vcard`, `send.list`.
3. **Contact & Group Management**: `contact.exists`, `contact.list`, `group.list`, `group.participants`, `group.add`, `group.remove`, `group.create`, `group.iAmAdmin`.
4. **WhatsApp Business Features**: `labels.list`, `labels.set`.
5. **Status / Stories**: `status.text`, `status.image`, `status.video`.
6. **Media Download**: `media.download` (converts internal WhatsApp blob/media tokens to Base64 data URLs).

---

## 5. Storage Architecture

The reference project persists its data using **Chrome Extension Storage**:

- **Primary Storage**: `chrome.storage.local`
  - Stores all 24 database collections as serialized JSON structures under individual collection keys.
  - Collections: `settings`, `contacts`, `tags`, `fields`, `notes`, `reminders`, `appointments`, `tabs`, `kanbanDashboards`, `kanbanStages`, `kanbanCards`, `quickReplies`, `templates`, `workflows`, `chatbots`, `chatSessions`, `chatMemory`, `schedules`, `campaigns`, `statusPosts`, `webhooks`, `webhookLog`, `activityLog`, `counters`.
- **Transient State**: `chrome.storage.session`
  - Tracks open workspace tab IDs (`workspaceTabs`) and transient notification routing.
- **Alarm Cache**: `chrome.storage.local['wacrm:alarms:info']`
  - Maps active `chrome.alarms` identifiers to reminder and appointment metadata for background worker wake-up.

### Architectural Limitations of Reference Storage:
- Storing high-volume entities (thousands of contacts, messages, and audit logs) inside `chrome.storage.local` results in large JSON string serialization overhead and lacks transactional ACID query indexing.
- **OpenMsg Improvement**: OpenMsg will use **IndexedDB via Dexie** for heavy relational/indexed entities (Contacts, Conversations, Workflows, Audit Logs) and reserve `chrome.storage.local` strictly for lightweight user settings.

---

## 6. External Communication & Network Calls

All external HTTP calls in the reference project are routed through the background service worker via `doHttp` to avoid browser CORS restrictions on WhatsApp Web:

| External Domain | Source File | Purpose | HTTP Method | Data Exchanged |
| :--- | :--- | :--- | :--- | :--- |
| `https://getwaflow.in` | `src/core/license.js`, `src/core/license-config.js` | License validation, entitlement refresh, and telemetry | `POST /api/license/check` | License key, device browser fingerprint, WhatsApp phone number, extension build ID (`PVL4JGriJ09CHPQt9LsEZb5FDBgMZLrS`). Receives RSA-signed entitlement JSON. |
| `https://api.openai.com` | `src/core/ai.js` | AI Assistant replies & AI composer strap actions | `POST /v1/chat/completions` | System prompt, conversation history (10 turns), user message, temperature, model (`gpt-4o-mini`, `gpt-4o`). |
| `https://generativelanguage.googleapis.com` | `src/core/ai.js` | Google Gemini AI fallback / alternate provider | `POST /v1beta/models/{model}:generateContent` | Content parts, system instruction, API key via query parameter. |
| `https://api.anthropic.com` | `src/core/ai.js` | Anthropic Claude AI provider | `POST /v1/messages` | Messages array, model (`claude-haiku`, `claude-sonnet`), system prompt. |
| User-Configured Webhook URLs | `src/core/webhooks.js` | Outbound webhook events | `POST` | Event name (`message_received`, `stage_changed`, etc.), contact details, timestamp, payload JSON. |
| User-Configured API Endpoints | `src/core/chatbot.js` | Chatbot HTTP request nodes | `GET`, `POST`, `PUT`, `DELETE` | Headers, query params, body variables; parses response JSON back into chatbot memory. |
| `https://technoved.in` | `src/core/license-config.js` | Provider branding / support link | Hyperlink only | Static link in About dialog. |
| `https://web.whatsapp.com` | `manifest.json`, `src/background/sw.js` | Core host domain | WebSocket / HTTP | Native WhatsApp Web messaging traffic. |

---

## 7. License System Architecture

The reference project enforces a commercial node-locked licensing model:

1. **Server Configuration**: Hardcoded license server `https://getwaflow.in` and 2048-bit RSA Public Key in `src/core/license-config.js`.
2. **Build Identification**: Hardcoded `BUILD_ID` and reseller metadata (`BUILD_PROVIDER`).
3. **Verification Process**:
   - Background worker or content script periodically submits license key, device fingerprint, and current WhatsApp phone number to `https://getwaflow.in/api/license/check`.
   - The response includes a base64-encoded digital signature.
   - `src/core/license.js` validates the signature using the browser `crypto.subtle.verify` Web Crypto API against `LICENSE_PUBLIC_KEY`.
4. **Offline Grace Period**: Allows 72 hours of offline operation before disabling automated message sending and chatbot execution.
5. **Bypass Flag**: Internally checks `window.__WACRM_LICENSE_OPEN__` / `openLicense()` (used in development builds).

### OpenMsg Architecture Decision:
OpenMsg is **100% genuine open-source software** (no phone-home licensing, no remote activation servers, no vendor lock-in). OpenMsg will feature **zero license checks** and **zero proprietary tracking**.
