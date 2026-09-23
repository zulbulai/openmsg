# OpenMsg — Feature Inventory & Implementation Matrix

This document provides a feature matrix of OpenMsg. Status definitions:
- **`IMPLEMENTED`**: Feature logic is written in the codebase.
- **`TESTED`**: Feature has automated syntax/unit checks.
- **`VERIFIED`**: Confirmed functional in a live WhatsApp Web session.
- **`IN_PROGRESS`**: Incomplete or partially implemented.
- **`BROKEN`**: Has known runtime regressions or bugs.
- **`NOT_STARTED`**: Planned or non-existent in current codebase.

---

## 1. Feature Matrix

| Feature | Location / Module | Main Files | Implementation Status | Test Status | Dependencies | Known Issues / Risks | Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WhatsApp Integration** | Bridge & Adapter | `src/bridge/main-bridge.js`, `src/core/wa.js`, `vendor/wppconnect-wa.js` | **IMPLEMENTED** | Syntax Verified | WPPConnect, WhatsApp Webpack | Fragile to major WhatsApp Web UI updates | **CRITICAL** |
| **Workspace Topbar & Shell** | UI Layer | `src/ui/shell.js`, `src/styles/wacrm.css` | **IMPLEMENTED** | Syntax Verified | Shadow DOM, DOM helpers | Needs exact 50px top offset on WhatsApp `#app` | **HIGH** |
| **Standalone Workspace Tab** | Tab & Relay | `pages/workspace.html`, `src/pages/workspace-main.js`, `src/core/relay.js` | **IMPLEMENTED** | Syntax Verified | Chrome runtime messaging, active WA tab | Requires WhatsApp Web tab to stay open | **MEDIUM** |
| **CRM Contacts** | CRM Core & UI | `src/core/crm.js`, `src/features/crm-drawer.js` | **IMPLEMENTED** | Syntax Verified | `contacts` collection, store | None | **MEDIUM** |
| **CRM Tags** | CRM Core & UI | `src/core/crm.js`, `src/panels/crm-settings.js` | **IMPLEMENTED** | Syntax Verified | `tags` collection | Tag removal cascades to contacts | **LOW** |
| **CRM Notes** | CRM Core & Drawer | `src/core/crm.js`, `src/features/crm-drawer.js`, `src/panels/notes-reminders.js` | **IMPLEMENTED** | Syntax Verified | `notes` collection | None | **LOW** |
| **CRM Custom Fields** | CRM Core & Settings | `src/core/crm.js`, `src/panels/crm-settings.js` | **IMPLEMENTED** | Syntax Verified | `fields` collection | Key regex enforced `^[a-z][a-z0-9_]*$` | **LOW** |
| **CRM Pipelines & Stages** | CRM Core & Settings | `src/core/crm.js`, `src/panels/crm-settings.js` | **IMPLEMENTED** | Syntax Verified | `kanbanDashboards`, `kanbanStages` | At least 1 dashboard must exist | **MEDIUM** |
| **CRM Kanban Board** | Panels | `src/panels/kanban.js`, `src/core/crm.js` | **IMPLEMENTED** | Syntax Verified | `kanbanCards`, drag-drop | Drag-and-drop requires pointer events | **MEDIUM** |
| **Reminders (Follow-ups)** | Core & Drawer | `src/core/reminders.js`, `src/features/crm-drawer.js`, `src/panels/notes-reminders.js` | **IMPLEMENTED** | Syntax Verified | `reminders`, alarms, notifications | Relies on Chrome alarms for missed ticks | **MEDIUM** |
| **Appointments & Calendar** | Core & Panels | `src/core/reminders.js`, `src/panels/calendar.js` | **IMPLEMENTED** | Syntax Verified | `appointments`, store | Enforces overlap conflict checks | **MEDIUM** |
| **Message Bots (Workflows)** | Core & Panels | `src/core/workflows.js`, `src/panels/message-bot.js` | **IMPLEMENTED** | Syntax Verified | `workflows`, matcher, sender | Duplicates keyword logic of Chatbots | **MEDIUM** |
| **Visual Chatbot Builder** | Core & Panels | `src/core/chatbot.js`, `src/panels/chatbot-builder.js` | **IMPLEMENTED** | Syntax Verified | Canvas graph renderer, kit | SVG edge routing on canvas zoom/pan | **HIGH** |
| **Chatbot Execution Engine** | Core Engine | `src/core/chatbot.js`, `src/core/automation.js` | **IMPLEMENTED** | Syntax Verified | `chatSessions`, store, sender | Multi-step sessions timeout after TTL | **HIGH** |
| **Inbound Automation Router** | Core Engine | `src/core/automation.js` | **IMPLEMENTED** | Syntax Verified | `chatMemory`, sender, CRM | LRU dedup (2000 msgs) avoids reply loops | **HIGH** |
| **Broadcast Campaigns** | Core & Panels | `src/core/scheduler.js`, `src/panels/broadcasts.js` | **IMPLEMENTED** | Syntax Verified | `campaigns`, sender | Rate limits and pauses protect account | **HIGH** |
| **Scheduled Messages** | Core & Panels | `src/core/scheduler.js`, `src/panels/schedules.js` | **IMPLEMENTED** | Syntax Verified | `campaigns` (kind: 'schedule') | Stored in `campaigns`, not `schedules` col | **MEDIUM** |
| **Message Sequences** | Core & Scheduler | `src/core/scheduler.js`, `src/core/sender.js` | **IMPLEMENTED** | Syntax Verified | Delay min/max, pause intervals | Stop-on-reply supported via `onIncoming` | **MEDIUM** |
| **Canned Responses** | Features & Panels | `src/features/canned.js`, `src/panels/canned.js`, `src/features/strap.js` | **IMPLEMENTED** | Syntax Verified | `quickReplies`, composer strap | `/` trigger in WhatsApp composer box | **LOW** |
| **Composer Strap** | Features | `src/features/strap.js` | **IMPLEMENTED** | Syntax Verified | WhatsApp composer DOM | Relies on `footer div[contenteditable]` | **HIGH** |
| **Templates with Variables** | Core & Panels | `src/core/variables.js`, `src/panels/templates.js` | **IMPLEMENTED** | Syntax Verified | `templates`, CRM contact fields | Resolves `{{name}}`, `{{phone}}`, custom | **LOW** |
| **Media Attachments & Blobs** | Store & Sender | `src/core/store.js`, `src/core/sender.js` | **IMPLEMENTED** | Syntax Verified | `wacrm:blob:*` in storage | 16MB file limit enforced | **MEDIUM** |
| **Outgoing Webhooks** | Core & Panels | `src/core/webhooks.js`, `src/panels/webhooks.js` | **IMPLEMENTED** | Syntax Verified | `webhooks`, `webhookLog`, crypto | HMAC-SHA256 signature attached | **LOW** |
| **HTTP Fetch Proxy** | Core & Background | `src/core/http.js`, `src/background/sw.js` | **IMPLEMENTED** | Syntax Verified | `chrome.permissions` check | Opens `pages/grant.html` if unpermitted | **MEDIUM** |
| **AI Assistant (Auto-Reply)** | Core & Panels | `src/core/ai.js`, `src/core/assistant.js`, `src/panels/ai-assistant.js` | **IMPLEMENTED** | Syntax Verified | OpenAI, Gemini, Anthropic APIs | Requires user API key + domain permission | **MEDIUM** |
| **AI Composer Toolbar** | Features | `src/core/ai.js`, `src/features/strap.js` | **IMPLEMENTED** | Syntax Verified | AI providers, composer strap | Prompt rewrites (Friendly, Formal, etc.) | **LOW** |
| **Activity Logging** | Core & UI | `src/core/activity.js` | **IMPLEMENTED** | Syntax Verified | `activityLog` collection | Rolling buffer capped at 300 entries | **LOW** |
| **Desktop Notifications** | Core & Background | `src/background/sw.js`, `src/core/reminders.js` | **IMPLEMENTED** | Syntax Verified | `chrome.notifications` API | Clicking notification focuses WhatsApp | **LOW** |
| **Import / Export / Backup** | Core & Panels | `src/core/store.js`, `src/panels/utilities.js` | **IMPLEMENTED** | Syntax Verified | JSON serializer with blob encoding | Full merge and replace restore modes | **LOW** |
| **Contact Exporter** | Panels & Utilities | `src/core/csv.js`, `src/panels/utilities.js` | **IMPLEMENTED** | Syntax Verified | CSV builder, DOM download | Exports contacts, tags, custom fields | **LOW** |
| **WhatsApp Number Validator** | Core & Panels | `src/core/wa.js`, `src/panels/utilities.js` | **IMPLEMENTED** | Syntax Verified | `contact.exists` bridge method | Queries WhatsApp backend for registered wids | **LOW** |
| **WhatsApp Status Stories** | Core & Panels | `src/core/scheduler.js`, `src/panels/status-posts.js` | **IMPLEMENTED** | Syntax Verified | `statusPosts`, WPP status APIs | Text, Image, Video status publishing | **MEDIUM** |
| **Privacy Blur Mode** | Features & Panels | `src/features/blur.js`, `src/panels/blur.js` | **IMPLEMENTED** | Syntax Verified | CSS filter injection | Obscures names, numbers, photos | **LOW** |
| **Chat Filter Tabs** | Core & Panels | `src/core/filters.js`, `src/panels/tabs.js` | **IMPLEMENTED** | Syntax Verified | `tabs`, WPP `chat.setFilter` | WhatsApp Web custom list filter | **MEDIUM** |
| **Theme System (Dark/Light)** | UI & CSS | `src/ui/shell.js`, `src/styles/wacrm.css` | **IMPLEMENTED** | Syntax Verified | CSS variables, data-theme | Auto-syncs with WhatsApp Web theme | **LOW** |
| **Open-Source Activation** | Core | `src/core/activation.js`, `src/ui/about-dialog.js` | **IMPLEMENTED** | Syntax Verified | Open license stub | Always active; no license server calls | **LOW** |
| **About Dialog & Version** | UI | `src/ui/about-dialog.js`, `src/ui/settings-menu.js` | **IMPLEMENTED** | Syntax Verified | Manifest version | Fixed missing export in audit | **LOW** |
| **Diagnostics System** | Core | `src/core/app.js:diagnostics` | **IMPLEMENTED** | Syntax Verified | WPP status, store counts | Snapshot of active sessions & counts | **LOW** |

---

## 2. Feature Gaps & Inconsistencies

1. **`schedules` vs `campaigns` Collection**:
   - `schedules.js` panel displays items from `campaigns` with `kind: 'schedule'`. The `'schedules'` collection declared in `src/core/store.js:COLLECTIONS` is unused.
2. **Duplication between Message Bots and Chatbots**:
   - `src/core/workflows.js` (Message Bots) and `src/core/chatbot.js` (Chatbots) both perform keyword matching on incoming chats. `automation.js` handles chatbots first, then message bots.
3. **No Standalone Unit Test Suite**:
   - `package.json` contains only a placeholder `echo` test command. While individual modules are pure and testable, no automated test runner (such as Node Test Runner or Vitest) is installed.
