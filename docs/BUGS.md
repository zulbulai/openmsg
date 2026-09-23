# OpenMsg — Bug Database

This document tracks all discovered bugs, severity ratings, reproduction steps, root causes, and verification records.

---

## BUG-001

**Title**: Missing `openAboutDialog` and `appVersion` exports in `src/ui/about-dialog.js` breaks Settings Menu

**Severity**: P1 (High)

**Status**: FIXED

**Location**: `src/ui/about-dialog.js` and `src/ui/settings-menu.js:5`

**Reproduction**:
1. Load OpenMsg in Chrome.
2. Click the Settings icon in the topbar to trigger `openSettingsMenu`.
3. In `settings-menu.js:96`, `meta: 'v' + appVersion()` is evaluated.
4. Console throws: `TypeError: appVersion is not a function`.

**Root Cause**:
During commit `8549cb3`, `src/ui/about-dialog.js` was replaced with a minimal stub that only exported `openLicenseDialog`, `licenseChip`, and `licenseNotice`. However, `src/ui/settings-menu.js` was still importing `openAboutDialog` and `appVersion`, which were undefined.

**Impact**:
Prevented the Settings menu from opening or crashed the menu click handler when navigating about options.

**Fix**:
Implemented `appVersion()` (retrieving version from `chrome.runtime.getManifest().version` with fallback) and restored `openAboutDialog(app, shell)` displaying open-source metadata, version, and repository links cleanly inside the Shadow DOM modal.

**Regression Test**:
Import audit verification confirmed 0 missing exports. Evaluated syntax via `node --check src/ui/about-dialog.js`.

**Verified**: YES

---

## BUG-002

**Title**: Dead collection `'schedules'` declared in `src/core/store.js:COLLECTIONS`

**Severity**: P3 (Low)

**Status**: DOCUMENTED / OPEN

**Location**: `src/core/store.js:22`

**Reproduction**:
Inspect `COLLECTIONS` array in `src/core/store.js`. Search codebase for queries against `schedules`.

**Root Cause**:
Historically, scheduled messages and campaigns were planned as separate collections. Later, all scheduled items were unified under `campaigns` with `kind: 'schedule'`. However, `'schedules'` was left in the `COLLECTIONS` initialization list.

**Impact**:
Initializes an empty Map in memory and checks for storage keys on boot, consuming negligible memory with no functional impact.

**Fix**:
Deprecate `'schedules'` in `COLLECTIONS` during next scheduled storage schema migration.

**Regression Test**:
Verify `exportAll` and `importAll` compatibility.

**Verified**: NO (Pending schema migration)

---

## BUG-003

**Title**: Main-world postMessage listener lacks token-based authentication

**Severity**: P2 (Medium)

**Status**: DOCUMENTED / OPEN

**Location**: `src/bridge/main-bridge.js:586`

**Reproduction**:
Open DevTools Console on `web.whatsapp.com` in page context. Execute:
```javascript
window.postMessage({ source: 'wacrm-iso', method: 'ping', id: 'test' }, window.location.origin);
```
Main bridge processes the message without verifying caller identity.

**Root Cause**:
The bridge relies on `event.source === window` and `data.source === 'wacrm-iso'`. Any script executing in the main page world (e.g. if WhatsApp Web experienced an XSS flaw) can send messages with that source string.

**Impact**:
Potential privilege escalation if WhatsApp Web's own page scripts are compromised.

**Fix**:
Generate a cryptographically random session secret during content script bootstrap and validate it in all `wacrm-iso` requests.

**Regression Test**:
Verify bridge communication still succeeds with token validation.

**Verified**: NO (Architectural recommendation)

---

## BUG-004

**Title**: Host permission rejection leaves external fetch requests pending until timeout

**Severity**: P2 (Medium)

**Status**: DOCUMENTED / OPEN

**Location**: `src/background/sw.js:doHttp` and `src/core/http.js`

**Reproduction**:
1. Configure an outgoing webhook to a new origin (e.g. `https://api.mycompany.com`).
2. Trigger the webhook.
3. Extension opens `pages/grant.html` popup.
4. User clicks "Not now" or closes the popup.
5. In `src/core/http.js`, the caller catches `PermissionError`, but background queue does not immediately fail child callers.

**Root Cause**:
`grant.html` does not broadcast rejection back to waiting background promises; callers wait for timeout (15s).

**Impact**:
Delayed failure feedback in UI when user denies permission grant.

**Fix**:
Have `pages/grant.js` send an explicit rejection message via `chrome.runtime.sendMessage({ type: 'grant-rejected', origin })` so waiting requests abort immediately.

**Regression Test**:
Trigger grant popup, close popup, verify immediate rejection handling.

**Verified**: NO (Pending enhancement)
