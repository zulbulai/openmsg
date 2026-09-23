# OPENMSG — AI CODING RULES & WORKFLOW GUIDELINES

This document is the **authoritative rulebook and operational guide** for AI coding assistants and developers working on the **OpenMsg** codebase.

OpenMsg is an open-source WhatsApp Web CRM and automation workspace implemented as a **Chrome Extension Manifest V3 (MV3)** using **Vanilla ES Modules (ES2022+)** and **Shadow DOM UI isolation**.

---

## 🚨 CORE PRINCIPLES & RULES

### RULE 1 — READ BEFORE MODIFYING
Before modifying any file, inspect:
1. The target file itself in full.
2. All imports and where they originate.
3. All consumers/callers of its functions, classes, or exports across the entire codebase.
4. Storage dependencies (which `chrome.storage.local` collections or blobs are touched).
5. Message bus dependencies (`events.js`, `main-bridge.js`, `sw.js`, `relay.js`).

*Never modify code blindly or assume existing behavior from previous prompts.*

### RULE 2 — ROOT CAUSE FIRST
Never patch symptoms with workarounds. Before fixing any bug:
1. **Reproduce** the issue or trace the exact execution path.
2. **Identify the root cause** at the system or data layer.
3. **Map all affected modules** and consumers.
4. **Propose a minimal, precise fix** that solves the root cause.
5. **Implement and test** the fix.
6. **Perform regression verification** on adjacent features.

### RULE 3 — NO UNNECESSARY REWRITES
- Never rewrite an entire file or subsystem when a surgical 5-line change achieves the goal.
- Never replace working architecture without explicit user authorization and concrete empirical evidence.
- Preserve existing comments, docstrings, variable semantics, and code style.

### RULE 4 — NO DUPLICATE SYSTEMS
Before creating new services or utilities, search the codebase:
- **Storage**: Use `src/core/store.js` (`app.store`). Do NOT create ad-hoc databases or alternate storage keys.
- **WhatsApp Bridge**: Use `src/core/wa.js` (`app.wa`). Do NOT inject independent script bridges or query DOM directly for WhatsApp internal data.
- **Event Bus**: Use `src/core/events.js` (`app.bus`). Do NOT instantiate uncoordinated global event targets.
- **Message Dispatch**: Use `src/core/sender.js` (`app.sender`). Do NOT bypass rate limiting or queuing by calling raw send APIs directly.
- **HTTP Requests**: Use `src/core/http.js` (`app.http`). It routes through the background service worker with permission checks.
- **UI Components**: Use `src/ui/kit.js` and `src/ui/dom.js`. Do NOT write custom modal or button implementations.

### RULE 5 — NO FAKE IMPLEMENTATION
Never leave:
- `TODO`, `FIXME`, or "Coming soon" stubs pretending to be functional.
- Mock results in production paths.
- `setTimeout` pretending to execute operations.
- Hardcoded fake contacts, mock messages, or synthetic stats.

If a feature is incomplete, mark it accurately as `IN_PROGRESS` or `NOT_STARTED`.

### RULE 6 — CODE & TYPE SAFETY
- Validate function parameters and incoming message payloads at boundaries.
- Avoid loose coercions or unhandled `null`/`undefined` properties.
- Guard against missing properties on external WhatsApp objects (`WPP`, `ContactStore`, `ChatStore`).
- Always handle rejected Promises; never let async rejections go unhandled.

### RULE 7 — DOM & SHADOW DOM SAFETY
- All OpenMsg UI elements MUST be appended to the Shadow DOM root in `#wacrm-host` (`src/ui/shell.js`). Never append extension UI directly into WhatsApp Web's `#app` or global `document.body` (except `#wacrm-host` itself).
- Clean up all listeners and timers on panel/screen unmount (`disposers`, `onDispose`, `clearInterval`).
- Avoid memory leaks: remove all `MutationObserver` instances, intervals, and event listeners when dialogs or panels close.
- Construct DOM using `h(...)` and `document.createTextNode` from `src/ui/dom.js` to eliminate XSS risks. Avoid `innerHTML`.

### RULE 8 — CHROME EXTENSION MANIFEST V3 SAFETY
- Respect the ephemeral lifecycle of the background Service Worker (`src/background/sw.js`). MV3 service workers can be terminated by Chrome at any time when idle.
- Never store persistent state solely in Service Worker memory.
- Use `chrome.alarms` for future execution, not long-running in-memory `setTimeout` in the service worker.
- Keep content-script communications resilient to tab reload and service worker restarts.

### RULE 9 — WHATSAPP WEB SAFETY
- WhatsApp Web is an external, evolving SPA. Never assume DOM class names or minified selectors are permanent.
- Centralize all WhatsApp-specific interaction in `src/bridge/main-bridge.js` and `src/core/wa.js`.
- Never scatter ad-hoc selectors across UI panels.
- Do not overload WhatsApp Web with synchronous CPU-intensive tasks that cause UI stutter or audio/video lag.

### RULE 10 — STORAGE & DATA SAFETY
- Never change collection names in `COLLECTIONS` (`src/core/store.js`) without an explicit migration path.
- Never silently delete or overwrite user data.
- Ensure all entity updates update `updatedAt` and preserve `createdAt` and `id`.
- Always verify that entity structure changes work with `exportAll()` and `importAll()`.

### RULE 11 — TEST BEFORE CLAIMING COMPLETE
Never declare a feature complete simply because the code compiles. Use strict verification states:
- `IMPLEMENTED`: Code is written.
- `TESTED`: Code executed in tests or simulated runtime.
- `VERIFIED`: Confirmed working end-to-end in the actual environment.

### RULE 12 — FINAL VERIFICATION CHECK
After any code modification, run:
```bash
node --check <modified_files>
npm test
```
Verify that:
1. No syntax errors exist (`node --check`).
2. No broken imports or missing exports exist.
3. The extension loads as unpacked in Chrome without manifest or runtime errors.

---

## 🔄 AI CODING WORKFLOW

AI agents must strictly follow this lifecycle for every task:

```text
REQUEST
  ↓
READ RELEVANT CODE (Inspect file, imports, consumers)
  ↓
SEARCH EXISTING IMPLEMENTATION (Find existing patterns, avoid duplication)
  ↓
IDENTIFY ROOT CAUSE / ARCHITECTURAL FIT
  ↓
CHECK DEPENDENCIES (Bus, storage, bridge, UI)
  ↓
PLAN MINIMAL CHANGE (Smallest possible blast radius)
  ↓
IMPLEMENT (Clean, safe ES module code)
  ↓
SYNTAX CHECK (`node --check`)
  ↓
UNIT / INTEGRATION VERIFICATION
  ↓
REGRESSION CHECK (Ensure existing flows remain intact)
  ↓
REPORT RESULTS (Exact diffs, test evidence, remaining risks)
```

---

## 🛡️ "DO NOT TOUCH" & HIGH-SENSITIVITY AREAS

The following core modules are foundational to OpenMsg. Any change to them requires extreme care, comprehensive consumer inspection, and regression testing:

| File / Module | Why Critical | Risk If Broken |
| :--- | :--- | :--- |
| `src/bridge/main-bridge.js` | Runs in WhatsApp Web's MAIN world; bridges WPPConnect. | WhatsApp integration completely fails; messages cannot be read or sent. |
| `src/background/sw.js` | MV3 Service Worker managing alarms, notifications, and HTTP. | Scheduled broadcasts stop; notifications fail; external HTTP calls block. |
| `src/core/store.js` | Persistence caching layer over `chrome.storage.local`. | Data loss, schema corruption, broken export/import, sync failure across tabs. |
| `src/core/app.js` | Central coordinator wiring all core engines. | Entire extension fails to boot; missing dependencies in panels. |
| `src/core/relay.js` | Tab-to-tab RPC bridge connecting dedicated workspace tab. | Dedicated workspace pages (`pages/workspace.html`) lose connectivity. |
| `src/core/sender.js` | Outgoing message queue, rate limiting, and signing. | WhatsApp number banned due to rate-limit breaches; message sending loops. |
| `src/core/chatbot.js` | Visual chatbot execution engine and graph evaluation. | Active chatbot sessions freeze or crash on incoming messages. |
| `src/ui/shell.js` | Mounts Shadow DOM host, manages topbar and WhatsApp layout. | WhatsApp UI jumping, half-page rendering bugs, or hidden panels. |

---

## ❓ CHANGE IMPACT ANALYSIS CHECKLIST

Before committing any edit, answer these mandatory questions:

```text
1. What files import or consume this symbol/function/class?
2. What persistent database collections does this touch?
3. What event bus messages does this emit or listen to?
4. Does this alter the postMessage contract between ISOLATED and MAIN worlds?
5. Could this impact rate limiting or message sending safety?
6. Does this affect both the in-page sidebar AND the dedicated workspace tab?
7. Is any newly created DOM properly scoped inside the Shadow DOM?
```
