# OpenMsg System Architecture

## 1. Architectural Philosophy

**OpenMsg** is designed around five core principles:
1. **Platform Dedication**: Exclusively focused on **Chrome Extension + WhatsApp Web**. No mobile ports, desktop wrappers, or cross-channel distractions.
2. **Local-First & Private**: Contacts, messages, workflows, and logs remain in local **IndexedDB (Dexie)** storage on the user's machine. Zero mandatory cloud backends.
3. **Strict Abstraction**: The core CRM, Workflow Engine, and UI never interact with WhatsApp Web DOM selectors or internal hooks directly. All platform interaction is mediated through the typed `WhatsAppClient` interface.
4. **Manifest V3 Resilience**: State is treated as ephemeral in service workers and UI panels. All background jobs, schedules, and active workflows are persisted and reconciled through `chrome.alarms` and persistent queues.
5. **Clean Separation of Concerns**: Complete decoupling among UI (React + Tailwind), Business Logic (Core Services), Data Layer (Dexie Repositories), and Messaging Adapter.

---

## 2. Context Separation & Boundary Model

```mermaid
graph TB
    subgraph "Chrome Extension Runtime"
        SW["Background Service Worker<br/>(alarms, proxy, coordinator)"]
        SP["Side Panel / Options<br/>(React UI + Zustand)"]
    end

    subgraph "WhatsApp Web Tab"
        CS["Content Script (Isolated World)<br/>(DOM injection, bridge proxy)"]
        INJ["Injected Script (Main World)<br/>(WhatsAppClient Webpack hooks)"]
    end

    subgraph "Storage & Data Layer"
        IDB[("IndexedDB (Dexie)<br/>Contacts, Workflows, Automations")]
        CS_STORE[("chrome.storage.local<br/>User Settings & Preferences")]
    end

    SP <-->|Typed Message Bus (chrome.runtime)| SW
    SW <-->|chrome.tabs.sendMessage| CS
    CS <-->|window.postMessage| INJ
    SP <-->|Dexie Direct / Shared Worker| IDB
    SW <-->|Dexie Direct| IDB
    SW <-->|Settings Sync| CS_STORE
```

### Context Breakdown:
1. **Background Service Worker (`src/background/`)**:
   - Manages recurring schedules and alarms via `chrome.alarms`.
   - Handles background wake-ups, workflow queue reconciliation, and browser notification dispatches.
   - Proxies external network requests (LLMs, outgoing webhooks) to avoid page-level CSP and CORS blocks.
2. **Content Script (`src/content/`)**:
   - Injected into `https://web.whatsapp.com/*` in the **ISOLATED** world.
   - Injects the `injected/whatsapp-bridge.js` script into the **MAIN** world.
   - Provides a secure bi-directional message proxy between the background worker and the injected script.
   - Optionally renders the side-drawer toggle and contextual UI overlay.
3. **Injected Bridge (`src/injected/`)**:
   - Injected into the **MAIN** world of WhatsApp Web.
   - Implements or connects to the `WhatsAppClient` adapter.
   - Listens to internal WhatsApp events and dispatches sanitized, typed updates to the isolated content script.
4. **Side Panel & Workspace (`src/sidepanel/`, `src/popup/`, `src/options/`)**:
   - Primary user interface built with React, Tailwind CSS, and Lucide icons.
   - Houses the CRM, Inbox, Visual Workflow Builder, Campaign Manager, and Settings.
   - Uses **Zustand** for transient UI state and Dexie repositories for persistent records.

---

## 3. Typed Internal Message Bus

Communication across Manifest V3 boundaries is strictly typed through `OpenMsgMessage`:

```ts
export type OpenMsgMessage =
  | { type: 'WHATSAPP_READY'; payload: { wid: string; pushName: string; isBusiness: boolean } }
  | { type: 'WHATSAPP_STATUS_REQUEST' }
  | { type: 'WHATSAPP_STATUS_RESPONSE'; payload: { ready: boolean; user?: { wid: string; name: string } } }
  | { type: 'SEND_MESSAGE'; payload: { chatId: string; text: string; correlationId: string } }
  | { type: 'SEND_MESSAGE_RESULT'; payload: { correlationId: string; success: boolean; messageId?: string; error?: string } }
  | { type: 'MESSAGE_RECEIVED'; payload: { message: InboundMessage } }
  | { type: 'TRIGGER_WORKFLOW'; payload: { workflowId: string; contactId: string; initialVariables?: Record<string, unknown> } }
  | { type: 'SCHEDULE_ALARM'; payload: { alarmId: string; triggerAt: number } }
  | { type: 'ALARM_FIRED'; payload: { alarmId: string } };
```

Every message passed between the Side Panel, Service Worker, and Content Script adheres to a unified request/response and pub/sub envelope.

---

## 4. Subsystem Layout

```text
src/
├── background/          # Manifest V3 service worker, alarms, proxy
├── content/             # Content script coordinator & bridge proxy
├── injected/            # Main-world WhatsApp Webhook / DOM adapter
├── sidepanel/           # Chrome sidepanel React application entry
├── popup/               # Quick status popup
├── options/             # Extension settings and configuration
├── ui/                  # Design system, shared components, layouts
├── features/            # Domain-specific feature modules
│   ├── crm/             # Contact profiles, tags, notes, pipeline
│   ├── inbox/           # Unified chat inbox and customer conversation view
│   ├── chatbot/         # Conversational bot runtime and templates
│   ├── workflows/       # React Flow visual builder & execution canvas
│   ├── automation/      # Trigger-rule-action execution machine
│   ├── broadcasts/      # Campaign wizard, recipient filters, rate limiter
│   ├── scheduler/       # Alarm reconciler and calendar bookings
│   ├── templates/       # Safe variable message templates
│   ├── webhooks/        # Inbound and outbound webhook manager
│   └── settings/        # Anti-ban throttling, LLM API keys, export/import
├── core/                # Cross-cutting concerns
│   ├── events/          # Internal pub/sub event bus
│   ├── permissions/     # Optional host permission manager
│   ├── logger/          # Scoped diagnostic logging
│   ├── errors/          # Custom error hierarchy
│   └── config/          # Extension constants and build defaults
├── storage/             # Dexie IndexedDB schemas and repositories
│   ├── db.ts            # Dexie database declaration & migration logic
│   └── repositories/    # Typed data access layer
├── workflow-engine/     # Standalone workflow runner & node executors
└── types/               # Global TypeScript definitions
```
