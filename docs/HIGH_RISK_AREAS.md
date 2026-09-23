# OpenMsg — High-Risk Areas & Fragility Audit

This document ranks and analyzes the highest-risk modules in OpenMsg, detailing why they are sensitive, what can break, and mandatory verification tests.

---

## 1. Risk Rankings Overview

```text
RANK 1: src/bridge/main-bridge.js (CRITICAL)
RANK 2: src/background/sw.js (CRITICAL)
RANK 3: src/core/store.js (CRITICAL)
RANK 4: src/core/sender.js (CRITICAL)
RANK 5: src/ui/shell.js (HIGH)
RANK 6: src/features/strap.js (HIGH)
RANK 7: src/core/chatbot.js (HIGH)
RANK 8: src/core/relay.js (HIGH)
```

---

## 2. High-Risk Module Analyses

### RANK 1: `src/bridge/main-bridge.js`
- **Why Risky**: Runs inside WhatsApp Web's own JavaScript context (`world: "MAIN"`). Intercepts internal Webpack modules and handles raw message sending.
- **Dependencies**: `vendor/wppconnect-wa.js`, WhatsApp Web internals (`ContactStore`, `ChatStore`).
- **What Can Break**:
  - Entire WhatsApp integration stops working.
  - User cannot read or send messages.
  - Text signature appending crashes WhatsApp's internal composer.
- **Required Tests Before Change**:
  - Read all postMessage consumers in `src/core/wa.js`.
  - Check WPPConnect API documentation for method signatures.
- **Required Tests After Change**:
  - `node --check src/bridge/main-bridge.js`.
  - Test live WhatsApp Web chat list loading, sending text, and receiving messages.

---

### RANK 2: `src/background/sw.js`
- **Why Risky**: Chrome Manifest V3 Service Worker. Chrome terminates it whenever idle. Manages all alarms, notifications, and network fetch proxies.
- **Dependencies**: `chrome.alarms`, `chrome.notifications`, `chrome.permissions`, `chrome.storage`.
- **What Can Break**:
  - Reminders fail to notify.
  - Scheduled broadcast campaigns fail to fire.
  - External webhooks and AI requests fail due to permission check crashes.
- **Required Tests Before Change**:
  - Verify that no critical state is held in module-level variables.
- **Required Tests After Change**:
  - `node --check src/background/sw.js`.
  - Verify alarm creation, notification clicks, and HTTP proxying via `doHttp`.

---

### RANK 3: `src/core/store.js`
- **Why Risky**: Core persistence and caching engine for the entire application. All CRM contacts, Kanban boards, chatbot flows, and settings reside here.
- **Dependencies**: `chrome.storage.local`, `src/core/events.js`.
- **What Can Break**:
  - Silent database corruption or deletion of user records.
  - Memory cache falling out of sync across tabs.
  - Broken backup exports or corrupted imports.
- **Required Tests Before Change**:
  - Check all 24 collection references across the entire codebase.
  - Verify debounced write timing and unload flush.
- **Required Tests After Change**:
  - `node --check src/core/store.js`.
  - Test `exportAll()` and `importAll()` roundtrip.
  - Verify multi-tab change synchronization.

---

### RANK 4: `src/core/sender.js`
- **Why Risky**: Controls message dispatching, typing delays, rate limiting, and signing.
- **Dependencies**: `src/core/wa.js`, `src/core/store.js`.
- **What Can Break**:
  - Breaching hourly caps (`maxSendsPerHour`), risking WhatsApp account suspension/bans.
  - Message dispatch queues freezing or firing duplicate messages.
- **Required Tests Before Change**:
  - Inspect throttle calculations and promise chain sequencing.
- **Required Tests After Change**:
  - `node --check src/core/sender.js`.
  - Verify that hourly cap throttling pauses outgoing queues as expected.

---

### RANK 5: `src/ui/shell.js`
- **Why Risky**: Manages topbar layout, Shadow DOM root creation, and WhatsApp Web `#app` container dimension calculations.
- **Dependencies**: `src/ui/dom.js`, `src/ui/kit.js`, `src/styles/wacrm.css`.
- **What Can Break**:
  - Half-page visual layout bugs in WhatsApp Web.
  - Topbar obscuring WhatsApp headers or controls.
  - Theme switching failures.
- **Required Tests Before Change**:
  - Check `TOPBAR_HEIGHT` (50px) and `bottomReserve` calculation logic.
- **Required Tests After Change**:
  - `node --check src/ui/shell.js`.
  - Verify full-window responsiveness and panel drawer opening.

---

### RANK 6: `src/features/strap.js`
- **Why Risky**: Injects quick actions directly into WhatsApp Web's message composer textbox (`footer div[contenteditable]`).
- **Dependencies**: WhatsApp Web composer DOM.
- **What Can Break**:
  - Composer input locking up or losing focus.
  - Misaligned positioning of the `/` quick reply menu.
- **Required Tests Before Change**:
  - Check fallback selectors in `COMPOSER_SELECTORS`.
- **Required Tests After Change**:
  - `node --check src/features/strap.js`.
  - Test typing text, `/` slash menu, and AI button clicks.

---

### RANK 7: `src/core/chatbot.js`
- **Why Risky**: Monolithic state machine (1,829 lines) executing interactive flowchart chatbots.
- **Dependencies**: `src/core/store.js`, `src/core/sender.js`, `src/core/crm.js`.
- **What Can Break**:
  - Active chat sessions freezing mid-flow.
  - Condition branch mis-evaluations.
  - Session timeout memory leaks.
- **Required Tests Before Change**:
  - Check graph validation rules in `validateGraph`.
- **Required Tests After Change**:
  - `node --check src/core/chatbot.js`.
  - Test session advancement and condition branching.

---

### RANK 8: `src/core/relay.js`
- **Why Risky**: Provides cross-tab RPC transport between standalone workspace tabs and the WhatsApp Web tab.
- **Dependencies**: `chrome.tabs`, `chrome.runtime`.
- **What Can Break**:
  - Standalone workspace tabs losing connection to WhatsApp.
  - Event listeners leaking across tab reloads.
- **Required Tests Before Change**:
  - Check `heartbeatMs` and `LISTEN_MS` timeout handling.
- **Required Tests After Change**:
  - `node --check src/core/relay.js`.
  - Test standalone tab opening and chat query relaying.
