# OpenMsg — Internal Message Bus & RPC Documentation

This document specifies the messaging channels, protocols, and event contracts used in OpenMsg.

---

## 1. Overview of Communication Channels

OpenMsg utilizes four distinct messaging channels:

```text
1. Bridge Channel (window.postMessage)
   ISOLATED WORLD (wa.js) ⟷ MAIN WORLD (main-bridge.js)

2. Runtime Channel (chrome.runtime.sendMessage)
   CONTENT SCRIPT / WORKSPACE TAB ⟷ SERVICE WORKER (sw.js)

3. Relay Channel (chrome.tabs.sendMessage)
   DEDICATED WORKSPACE TAB ⟷ CONTENT SCRIPT (relay.js)

4. Internal Event Bus (in-memory createBus)
   CORE SERVICES ⟷ UI PANELS ⟷ AUTOMATION
```

---

## 2. Bridge Channel Protocol (`window.postMessage`)

Inter-world communication between the isolated content script and the main page context running alongside WhatsApp Web.

- **Sender / Receiver**: `src/core/wa.js` (isolated) ⟷ `src/bridge/main-bridge.js` (main).
- **Target Origin**: Enforced as `window.location.origin` (`https://web.whatsapp.com`).
- **Validation**: Incoming messages must verify `event.source === window` and matching `data.source`.

### A. Request / Response RPC
```javascript
// Request from Isolated World to Main World:
{
  source: 'wacrm-iso',
  id: 'r_abc123',
  method: 'chat.list',
  args: [{ onlyUsers: true }]
}

// Response from Main World:
{
  source: 'wacrm-main',
  id: 'r_abc123',
  ok: true,
  result: [ ... ] // or { ok: false, error: 'string' }
}
```

#### Available RPC Methods:
- `ping`: Health check.
- `status`: Returns `{ injected, ready, fullReady, authenticated, mainReady, me, isBusiness, version }`.
- `chat.list`: Returns serialized array of WhatsApp chat summaries.
- `chat.get`: Looks up single chat by JID.
- `chat.active`: Returns currently active open chat.
- `chat.open`: Opens a chat in WhatsApp Web view.
- `chat.setFilter`: Injects custom filter IDs into WhatsApp chat list.
- `chat.markRead`: Marks a chat as read.
- `chat.typing`: Sets typing/paused presence indicator.
- `chat.archive`: Archives/unarchives chat.
- `chat.messages`: Fetches chat history.
- `chat.setInput`: Sets WhatsApp composer text.
- `sign.set`: Appends agent signature to outbound texts via WhatsApp webpack hook.
- `sign.status`: Returns signature hook status.
- `send.text`: Sends raw WhatsApp text message.
- `send.file`: Sends media/document with base64 data URL.
- `send.poll`: Sends interactive poll.
- `send.vcard`: Sends vCard contact card.
- `send.list`: Sends interactive list message.
- `status.text`, `status.image`, `status.video`: Publishes WhatsApp status stories.
- `contact.exists`: Checks if phone number is registered on WhatsApp.
- `contact.list`: Fetches all contacts.
- `group.list`, `group.participants`, `group.add`, `group.remove`, `group.create`, `group.iAmAdmin`.
- `labels.list`, `labels.set`: WhatsApp Business labels.
- `media.download`: Downloads media blob as base64 data URL.

### B. Unsolicited WhatsApp Events (Main ➔ Isolated)
```javascript
{
  source: 'wacrm-main',
  event: 'chat.new_message',
  data: { id, chatId, fromMe, body, type, sender, name, isGroup, t, ... }
}
```
- `ready`: WhatsApp WPP full readiness toggled.
- `chat.new_message`: Incoming/outgoing message detected.
- `chat.msg_revoke`: Message recalled/deleted.
- `chat.active_chat`: Active chat changed by user click.
- `chat.new_chat`: New chat created.
- `chat.unread_count_changed`: Unread count modified.
- `conn.logout`: User logged out of WhatsApp Web.

---

## 3. Chrome Runtime Channel (`chrome.runtime.sendMessage`)

Used by content scripts and standalone pages to request privileged operations from the MV3 Service Worker (`src/background/sw.js`).

### Supported Messages:
1. `{ type: 'http', url, method, headers, body, timeoutMs }`: Proxies HTTP requests, verifying host origin permissions.
2. `{ type: 'has-access', url }`: Checks `chrome.permissions.contains({ origins: [origin + '/*'] })`.
3. `{ type: 'grant', origins: [] }`: Opens popup window `pages/grant.html` to prompt user for permissions.
4. `{ type: 'notify', id, title, message, data }`: Displays system desktop notification.
5. `{ type: 'set-alarms', items: [{ key, at, title, message }] }`: Registers Chrome alarms (`wacrm:*`).
6. `{ type: 'open-whatsapp' }`: Focuses or creates a WhatsApp Web tab.
7. `{ type: 'open-page', panel }`: Focuses or opens `pages/workspace.html?panel=<panel>`.

---

## 4. Relay Channel (`src/core/relay.js`)

Connects the dedicated workspace tab (`pages/workspace.html`) with the WhatsApp Web tab.

1. **Standalone Tab (Client)**:
   - `relayTransport.request(method, args, timeoutMs)`:
     - Queries `chrome.tabs.query({ url: 'https://web.whatsapp.com/*' })`.
     - Sends `{ type: 'wa-relay', method, args, timeoutMs }` via `chrome.tabs.sendMessage`.
   - Sends heartbeat `{ type: 'wa-listen' }` every 20s to ensure the WhatsApp tab sends events.
2. **WhatsApp Web Content Script (Server)**:
   - `serveRelay`: Listens for `{ type: 'wa-relay' }` and calls `windowTransport.request(method, args)`.
   - Forwards bridge events via `chrome.runtime.sendMessage({ type: 'wa-event', name, data })`.

---

## 5. Core In-Memory Event Bus (`src/core/events.js`)

Created via `createBus()` and exposed on `app.bus`:

- `crm:contact`: Contact updated (`{ chatId, contact }`).
- `crm:stage`: Kanban stage changed (`{ chatId, stage, previous }`).
- `crm:tag_added`: Tag attached to contact (`{ chatId, tag }`).
- `crm:note`: Note saved (`{ note }`).
- `message:in`: Incoming WhatsApp message processed by automation.
- `sender:sent`: Outgoing message delivered (`{ chatId, message }`).
- `sender:throttled`: Outbound messages paused due to hourly limit.
- `reminder:due`: Reminder reached due time.
- `appointment:due`: Appointment reminder reached due time.
- `notify`: Notification triggered.
- `*`: Wildcard event listener.
