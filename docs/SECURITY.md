# OpenMsg — Security Architecture & Vulnerability Audit

This document provides a security review of the OpenMsg codebase, examining injection vectors, cross-context messaging, network boundaries, token persistence, and Chrome permissions.

---

## 1. Executive Summary

| Category | Finding Count | Overall Risk Assessment |
| :--- | :--- | :--- |
| **DOM Injection / XSS** | 0 Critical | **SECURE** — Zero `innerHTML`, zero `eval`, strict `h()` DOM builder |
| **Cross-Context Messaging** | 1 Medium | **GUARDED** — Origin checked, but main-world listener lacks strict sender auth |
| **Network & SSRF** | 1 Medium | **PROTECTED** — Background proxy with Chrome optional permissions gate |
| **API Key Storage** | 1 Low | **LOCAL STORAGE** — Unencrypted in `chrome.storage.local` on user device |
| **Chrome Permissions** | 0 High | **MINIMAL** — Standard MV3 permissions with optional host grants |

---

## 2. Detailed Findings by Category

### A. DOM Injection & Cross-Site Scripting (XSS)
- **Status**: **PASSED (SECURE)**
- **Audit Results**:
  - `eval()`: **0 occurrences**.
  - `new Function()`: **0 occurrences**.
  - `.innerHTML`: **0 occurrences**.
  - `.outerHTML`: **0 occurrences**.
  - `document.write()`: **0 occurrences**.
- **Defense-in-Depth**:
  - All DOM nodes in OpenMsg are generated via `h(tag, props, ...children)` in `src/ui/dom.js`.
  - Non-node children are converted strictly via `document.createTextNode(String(child))`.
  - Content injected into UI elements (such as message bodies, contact names, note contents) cannot execute arbitrary HTML/JS.

---

### B. Cross-Context Messaging (`window.postMessage`)
- **Severity**: **MEDIUM**
- **Location**: `src/bridge/main-bridge.js` & `src/core/wa.js`
- **Analysis**:
  - `src/core/wa.js` posts to `location.origin` with `{ source: 'wacrm-iso', method, args }`.
  - In `src/bridge/main-bridge.js`:
    ```javascript
    window.addEventListener('message', function (event) {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'wacrm-iso') return;
      ...
    });
    ```
- **Risk**:
  - If a script in the main world on `web.whatsapp.com` is compromised (e.g. through an XSS flaw in WhatsApp Web itself), it could forge a `postMessage` with `source: 'wacrm-iso'` to trigger OpenMsg bridge methods (like sending text or listing chats).
- **Recommendation**:
  - Implement a dynamic session token or shared nonce generated at bootstrap between `main.js` and `main-bridge.js` to cryptographically sign inter-world messages.

---

### C. Network Boundaries & SSRF Protection
- **Severity**: **LOW**
- **Location**: `src/background/sw.js:doHttp` & `src/core/http.js`
- **Analysis**:
  - Outgoing HTTP calls for AI providers (OpenAI, Gemini, Anthropic) and user-configured webhooks cannot be called directly from content scripts due to browser CSP.
  - They are routed through `src/background/sw.js:doHttp`.
  - Before making any `fetch()` call, the service worker verifies:
    ```javascript
    const hasPermission = await chrome.permissions.contains({
      origins: [targetOrigin + '/*']
    });
    ```
  - If not permitted, the request is blocked and returns `{ needsPermission: true, origin }`.
  - `pages/grant.html` is opened as a popup, displaying the exact origin and requiring explicit user authorization via `chrome.permissions.request()`.
- **Mitigations in place**:
  - Maximum body size capped at 2MB (`MAX_BODY = 2097152`).
  - Strict protocol enforcement: Only `https:` and `http:` allowed (blocks `file:`, `javascript:`, `chrome:`).
  - Credentials omitted (`credentials: 'omit'`).
  - Timeout capped at 120 seconds.

---

### D. API Key & Token Storage
- **Severity**: **LOW / INFO**
- **Location**: `src/core/store.js` (`settings.aiKeys`)
- **Analysis**:
  - User API keys for OpenAI, Google Gemini, and Anthropic Claude are stored in `chrome.storage.local`.
  - `chrome.storage.local` is accessible only to the OpenMsg extension context on the user's machine and is NOT synced to Google servers (unlike `chrome.storage.sync`).
- **Risk**:
  - Anyone with physical/root access to the local user profile can read the unencrypted values in Chrome's LevelDB.
- **Recommendation**:
  - Standard for browser extensions; document that keys are stored locally and users should use restricted-scope API keys.

---

### E. Webhook HMAC Signatures
- **Severity**: **PASSED (SECURE)**
- **Location**: `src/core/webhooks.js:sign`
- **Analysis**:
  - When dispatching webhook events, OpenMsg generates an HMAC-SHA256 signature using the Web Crypto API (`crypto.subtle.sign`) using the user's configured webhook secret.
  - The signature is delivered in the `X-WACRM-Signature` header (`sha256=<hex>`), allowing receiving servers (n8n, Zapier, custom backends) to authenticate that the payload originated from the user's browser.

---

### F. Chrome Manifest V3 Permissions Audit
- **Permissions Declared**:
  - `"storage"`: Required for local database persistence.
  - `"unlimitedStorage"`: Eliminates the 10MB quota for media attachments and large contact databases.
  - `"alarms"`: Required for background follow-up reminders and scheduled sequences.
  - `"notifications"`: Required for desktop reminder alerts.
- **Host Permissions**:
  - `"https://web.whatsapp.com/*"`: Required for content script injection and bridge operations.
- **Optional Host Permissions**:
  - `"https://*/*"`, `"http://*/*"`: Declared as **optional** host permissions, requested on-demand only for user-approved webhook endpoints and AI provider APIs.
