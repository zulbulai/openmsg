# OpenMsg — Debugging Guide

This guide details debugging techniques for each execution context of OpenMsg.

---

## 1. Context Overview & DevTools Access

| Context | How to Open DevTools | What to Inspect |
| :--- | :--- | :--- |
| **Service Worker** | In `chrome://extensions`, click **"service worker"** link on OpenMsg card. | Network requests (`doHttp`), alarms, notification click events, runtime errors. |
| **WhatsApp Page & Content Script** | Press `F12` or `Ctrl+Shift+I` on the `https://web.whatsapp.com/` tab. | WhatsApp DOM, OpenMsg Shadow DOM (`#wacrm-host`), bridge postMessages, CRM state. |
| **Standalone Workspace** | Press `F12` on `chrome-extension://<id>/pages/workspace.html`. | Panel rendering, full-screen Kanban, relay transport errors. |
| **Permission Grant Popup** | Right-click inside `pages/grant.html` → **Inspect**. | `chrome.permissions.request` flow. |

---

## 2. Debugging WhatsApp Web Integration & Bridge

### Inspecting `window.WPP` (Main World)
1. Open DevTools on `https://web.whatsapp.com/`.
2. In the Console prompt, switch the execution context dropdown from `top` (or OpenMsg isolated world) to **`top` (Page Context)**.
3. Check readiness and connection:
   ```javascript
   window.WPP.isFullReady;          // Should be true
   window.WPP.conn.isAuthenticated(); // Should be true
   window.WPP.chat.getActiveChat(); // Inspect active chat object
   ```

### Debugging Bridge Messages
To monitor all RPC traffic passing between the isolated content script and main world:
```javascript
window.addEventListener('message', (e) => {
  if (e.data?.source?.startsWith('wacrm-')) {
    console.log('[BRIDGE MSG]', e.data.source, e.data);
  }
});
```

---

## 3. Debugging In-Page Shadow DOM UI

OpenMsg renders inside `#wacrm-host`:
1. In the DevTools **Elements** panel, expand:
   `div#wacrm-host` ➔ `#shadow-root (open)`.
2. Inspect CSS variables applied to `.wc-root`:
   - `--bg`, `--surface`, `--accent`, `--text`, `--bar-bg`.
3. Check theme state:
   - `<div class="wc-root" data-theme="dark">` or `data-theme="light"`.

---

## 4. Debugging Storage & Database State

To inspect or query the in-memory store directly from the Console (ensure context is set to the OpenMsg content script):

```javascript
// Dump all stored contacts:
chrome.storage.local.get('wacrm:col:contacts', console.log);

// Dump all Kanban stages:
chrome.storage.local.get('wacrm:col:kanbanStages', console.log);

// Check all stored keys:
chrome.storage.local.get(null, (all) => console.log(Object.keys(all)));
```

---

## 5. Debugging Background Alarms & Scheduling

1. Open DevTools for the Service Worker (`chrome://extensions` → "service worker").
2. Check active alarms:
   ```javascript
   chrome.alarms.getAll((alarms) => {
     console.table(alarms.map(a => ({
       name: a.name,
       scheduledTime: new Date(a.scheduledTime).toLocaleTimeString()
     })));
   });
   ```
3. Check alarm metadata stored in local storage:
   ```javascript
   chrome.storage.local.get('wacrm:alarmInfo', console.log);
   ```

---

## 6. Debugging Standalone Tab Relay (`relayTransport`)

If `pages/workspace.html` shows "WhatsApp Web is not open":
1. Confirm WhatsApp Web is open in at least one tab in the same browser window.
2. In the Service Worker console, run:
   ```javascript
   chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, console.log);
   ```
3. If the tab exists, verify that `serveRelay` is active by sending a ping:
   ```javascript
   chrome.tabs.sendMessage(waTabId, { type: 'wa-listen' }, console.log);
   ```
