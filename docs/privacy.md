# OpenMsg Privacy Architecture & Policy

## 1. Local-First Philosophy

OpenMsg operates on a **strict local-first paradigm**. All CRM data, customer contacts, conversation histories, workflow definitions, automation logs, and schedules remain exclusively on your device within the browser sandbox.

There are **no default tracking servers, no phone-home license checks, no centralized user databases, and no remote telemetry**.

---

## 2. What Data Is Stored Locally?

Data persisted on your device via **IndexedDB (Dexie)** and **`chrome.storage.local`**:
- **Contacts & Customer Data**: Phone numbers, display names, profile avatars, assigned tags, custom field values, and internal notes.
- **Conversation Records**: Locally cached chat threads, message IDs, timestamps, and delivery statuses necessary for CRM timeline views.
- **Workflow & Automation Definitions**: Visual graph structures, condition rules, node configurations, and execution logs.
- **Scheduled Tasks & Reminders**: Appointment reminders, scheduled messages, and broadcast queue status.
- **Configuration & Keys**: API keys for external services (OpenAI, Gemini, Anthropic), user interface theme preferences, and anti-ban throttling settings.

---

## 3. What Data Leaves Your Browser?

Data **only** leaves your browser under explicit, user-configured actions:

### A. WhatsApp Web Communication
- When you send messages, mark chats as read, or fetch contact lists, communication occurs directly between your browser and WhatsApp's official servers (`*.whatsapp.net`, `web.whatsapp.com`) using your active WhatsApp Web session. OpenMsg does not proxy, intercept, or reroute your native WhatsApp traffic.

### B. Optional AI Assistant Queries
- If you configure an AI Provider (e.g., OpenAI, Google Gemini, Anthropic) and enable automated replies or composer tools:
  - The message content and recent conversation context (up to 10 turns) are transmitted directly from your browser to the designated provider's API endpoint (`api.openai.com`, `generativelanguage.googleapis.com`, or `api.anthropic.com`).
  - Transmission uses your personal API key.
  - No OpenMsg intermediary servers are involved.

### C. Outbound Webhooks & HTTP Nodes
- If you create custom Webhooks or HTTP Request workflow nodes:
  - Event payloads (such as `contact_created` or `message_received`) are transmitted directly from your browser to the destination URL specified in your configuration.
  - Payloads may include contact names, phone numbers, and message bodies.

---

## 4. Telemetry & Analytics

- **Telemetry Status**: **Disabled (None)**.
- OpenMsg includes **zero** tracking libraries, zero Google Analytics, zero Sentry / bug-tracker beacons, and zero telemetry collection.
- Any future diagnostic telemetry must be strictly opt-in, explicitly documented, and disabled by default.

---

## 5. Data Deletion & Portability

Because your data is stored locally:
- **Exporting Data**: You can download a complete JSON export of your CRM, workflows, and templates via **Settings -> Export Backup**.
- **Deleting Data**: You can purge all stored data at any time via **Settings -> Clear Local Database** or by uninstalling the extension from your browser.
