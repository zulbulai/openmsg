# OpenMsg — WhatsApp Web Integration & Bridge Architecture

This document describes the technical integration between OpenMsg and WhatsApp Web (`https://web.whatsapp.com/`).

---

## 1. High-Level Integration Mechanism

OpenMsg operates inside WhatsApp Web using a two-tier content-script architecture:

1. **MAIN World Script (`vendor/wppconnect-wa.js` + `src/bridge/main-bridge.js`)**:
   - Executes in the same execution context as WhatsApp Web's own frontend React/Webpack bundles.
   - Leverages `window.WPP` (WPPConnect / WA-JS), which locates WhatsApp's internal Webpack modules and stores.
2. **ISOLATED World Content Script (`src/content/main.js` + `src/core/wa.js`)**:
   - Executes in Chrome Extension isolated context.
   - Controls OpenMsg UI inside `#wacrm-host` Shadow DOM.
   - Communicates with the main world via `window.postMessage`.

---

## 2. Readiness & Connection Lifecycle

```text
PAGE LOAD
  ↓
vendor/wppconnect-wa.js executes → registers window.WPP
  ↓
src/bridge/main-bridge.js boots → attaches postMessage listener
  ↓
Polling interval (700ms) checks:
  WPP.isFullReady === true && WPP.conn.isAuthenticated()
  ↓
When FullReady transitions:
  Emits 'ready' event via postMessage to Isolated World
  ↓
src/core/wa.js catches 'ready' → resolves app.wa.whenReady()
  ↓
app.start() resumes scheduled campaigns and sets outbound signatures
```

### Readiness States:
- `injected`: `window.WPP !== undefined`.
- `authenticated`: `WPP.conn.isAuthenticated()` returns true (user scanned QR code and session is valid).
- `mainReady`: `WPP.conn.isMainReady()` returns true.
- `fullReady`: Both UI and socket connection are synchronized.

---

## 3. DOM Integration & Element Targeting

OpenMsg minimizes direct WhatsApp DOM manipulation to reduce fragility across WhatsApp updates.

| DOM Target | Selector / Method | Used By | Stability Rating |
| :--- | :--- | :--- | :--- |
| **Host Mount Point** | `document.body.appendChild(#wacrm-host)` | `src/ui/shell.js` | **STABLE** |
| **WhatsApp Main App Layout** | `document.getElementById('app')` | `src/ui/shell.js` (adds 50px top offset) | **STABLE** |
| **Chat Side Pane** | `document.querySelector('#pane-side')` | `src/ui/shell.js` (calculates panel left offset) | **STABLE** |
| **Active Chat Main View** | `document.getElementById('main')` | `src/features/strap.js` (adjusts bottom padding) | **STABLE** |
| **Composer Textbox** | `footer div[contenteditable="true"][role="textbox"]` | `src/features/strap.js` (positions quick action strap) | **FRAGILE** |
| **Theme Detection** | `localStorage.getItem('theme')`, `body.dark` | `src/ui/shell.js` (syncs light/dark mode) | **STABLE** |

---

## 4. Stability Classification

### A. STABLE Components
- **WPPConnect WA-JS Module Search**: WA-JS dynamically scans Webpack module exports by module shapes rather than fixed minified chunk IDs.
- **Shadow DOM Isolation**: OpenMsg CSS cannot break WhatsApp Web UI, and WhatsApp Web CSS cannot break OpenMsg.
- **Message Sending & Reading via WPP**: `WPP.chat.sendTextMessage`, `sendFileMessage`, `sendCreatePollMessage`, `sendListMessage`.
- **Contact & Chat Metadata**: Querying `ContactStore` and `ChatStore` via WPP.
- **Relay System**: Communication between standalone tabs and WhatsApp Web tab via `chrome.tabs.sendMessage`.

### B. FRAGILE Components (Requires Monitoring)
- **Composer Strap Selector (`footer div[contenteditable]`)**:
  - If WhatsApp Web renames or redesigns its composer DOM footer, the quick-reply strap may fail to position itself accurately.
  - *Defensive Measure*: OpenMsg uses multiple selector fallbacks and safely hides the strap if the composer is missing without throwing errors.
- **Outbound Text Hook (`sendTextMsgToChat`)**:
  - `src/bridge/main-bridge.js` intercepts `sendTextMsgToChat` via Webpack search to prepend signatures.
  - If WhatsApp renames `sendTextMsgToChat`, manual typed signatures will silently fail to append (though automated messages via `sender.js` remain unaffected).
- **Custom Chat List Filters (`WPP.chat.setFilter`)**:
  - Injects custom chat IDs into WhatsApp Web's native filter bar.
  - If WhatsApp changes internal filter stores, custom tab filtering falls back to standard chat list display.

### C. UNKNOWN / Platform Risks
- **WhatsApp Web Multi-Device Changes**: WhatsApp Web updates silently in the background without browser extension store updates.
- **Rate-Limiting Penalties**: High-volume unsolicited messaging can trigger Meta anti-spam bans regardless of extension safety.

---

## 5. Reconnection & Lifecycle Handling

1. **SPA Tab Reload**:
   - `chrome.runtime.onInstalled`: Reloads all matching `https://web.whatsapp.com/*` tabs upon extension update or installation.
2. **User Logout**:
   - `WPP.on('conn.logout')`: Emits `logout` event to isolated world.
   - `src/core/wa.js` resets readiness state (`state.ready = false`).
   - Automation stops sending automated replies while logged out.
3. **Session Reconnection**:
   - A background heartbeat interval in `src/bridge/main-bridge.js` (700ms) and `src/core/wa.js` (3000ms) continuously checks status. Once WhatsApp reconnects and reaches `fullReady`, `ready` is re-emitted and automated services resume.
