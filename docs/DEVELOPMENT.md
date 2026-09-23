# OpenMsg — Developer Guide

This document describes how to set up, develop, and test OpenMsg locally.

---

## 1. Prerequisites

- **Browser**: Google Chrome, Brave, Microsoft Edge, or any Chromium-based browser version **111+**.
- **Node.js**: Node.js **v18+** (v20+ or v22+ recommended) for running syntax checks and test scripts.
- **Git**: Installed for version control.

---

## 2. Installation & Setup

OpenMsg requires **no build step, no npm install, and no transpilation**. All source code is written in standard ES modules directly executable by Chromium browsers.

### Step 1: Clone Repository
```bash
git clone git@github.com:zulbulai/openmsg.git
cd openmsg
```

### Step 2: Load Unpacked Extension into Chrome
1. Open your browser and navigate to `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
2. In the top-right corner, turn on **Developer mode**.
3. Click the **Load unpacked** button.
4. Select the repository root directory (the folder containing `manifest.json`).
5. OpenMsg will now appear in your extensions list.

---

## 3. Development Workflow

Because OpenMsg uses pure native ES modules:
1. **Edit Code**: Make changes directly to files in `src/`, `pages/`, or `icons/`.
2. **Reload Extension**:
   - Go to `chrome://extensions` and click the 🔄 **Reload** icon on the OpenMsg card.
3. **Refresh WhatsApp Web**:
   - Switch to your `https://web.whatsapp.com/` tab and press `F5` / `Ctrl+R`.
   - The updated extension code runs immediately.

---

## 4. Verification Commands

Before creating a commit or PR, run the local verification suite:

```bash
# 1. Run syntax verification on all JavaScript source files:
for f in $(find src pages -name "*.js"); do node --check "$f" || echo "Error in $f"; done

# 2. Run existing project test command:
npm test
```

---

## 5. Troubleshooting Common Issues

### Issue: "Extension failed to load / manifest errors"
- **Cause**: Syntax error in `manifest.json`.
- **Fix**: Validate `manifest.json` using `python3 -m json.tool manifest.json` or `jq . manifest.json`.

### Issue: "OpenMsg topbar does not appear on WhatsApp Web"
- **Cause**: WhatsApp Web is still loading or WPPConnect failed to hook webpack chunks.
- **Fix**: Check DevTools Console (`F12`). Look for `[WACRM]` logs. Confirm `vendor/wppconnect-wa.js` loaded. Refresh the tab.

### Issue: "External API calls fail (AI or Webhooks)"
- **Cause**: Missing Chrome host origin permission.
- **Fix**: Click "Allow" on the permission prompt dialog (`pages/grant.html`). Verify the domain in `chrome://extensions` → Details → Permissions.
