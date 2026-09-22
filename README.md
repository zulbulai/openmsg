<p align="center">
  <img src="icons/icon-128.png" alt="OpenMsg Logo" width="120"/>
</p>

<h1 align="center">OpenMsg</h1>

<p align="center">
  <strong>Free & Open-Source WhatsApp Web CRM & Automation Workspace</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.1-blue.svg" alt="Version"/>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"/>
  <img src="https://img.shields.io/badge/manifest-v3-orange.svg" alt="Manifest V3"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"/>
  <img src="https://img.shields.io/badge/platform-Chrome%20%7C%20Brave%20%7C%20Edge-lightgrey.svg" alt="Platform"/>
</p>

---

## ✨ Why OpenMsg?

**OpenMsg** is a free, open-source WhatsApp Web CRM and automation workspace that lives entirely inside your browser — no server, no registration, no hidden paywalls.

It injects a full-featured sidebar directly into [WhatsApp Web](https://web.whatsapp.com/) using a **Chrome Manifest V3 extension**, keeping all your data local in the browser's IndexedDB.

|                                  |                                                                            |
|----------------------------------|----------------------------------------------------------------------------|
| 🔓 **100% Open Source**          | MIT licensed — no keys, no activation, no feature locks                    |
| 🗂️ **CRM & Kanban Board**        | Manage contacts, leads, and deals with a drag-and-drop pipeline             |
| 🤖 **Chatbot Builder**           | Build auto-reply flows with keyword triggers, menus, and conditions         |
| 📢 **Broadcast Campaigns**       | Send bulk messages with rate-limiting and `{{variable}}` personalization    |
| ⚡ **Canned Responses**          | Save and insert frequent messages in one click or via keyboard shortcut     |
| 🧠 **AI Assistant**              | Connect an AI model to auto-answer incoming queries                         |
| 📅 **Scheduler & Reminders**     | Schedule messages and set per-contact follow-up reminders                   |
| 🔗 **Webhooks & Integrations**   | Send/receive HTTP events to Zapier, Make, n8n, or your own backend          |
| 🔒 **Privacy / Blur Mode**       | Blur names, numbers, and messages for screen sharing                        |
| 🎨 **Dark & Light Theme**        | Full CSS variable theming system with live toggle                           |

---

## ⚠️ Important Notice

OpenMsg is an **unofficial** browser extension. It enhances WhatsApp Web by running alongside it in your browser.

- This is **not** an official WhatsApp or Meta product.
- Use a **dedicated number** for automation — not your primary personal number.
- Sending large volumes of unsolicited messages can result in your WhatsApp account being restricted.
- Always get consent before messaging contacts through automated flows.

---

## 🚀 Installation

OpenMsg is a **Chrome unpacked extension** — no Chrome Web Store listing, no build step required.

### Requirements

- Google Chrome, Brave, Microsoft Edge, or any Chromium-based browser (v111+)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/zulbulai/openmsg.git
```

**2. Open your browser's extensions page**

| Browser | URL                    |
|---------|------------------------|
| Chrome  | `chrome://extensions`  |
| Brave   | `brave://extensions`   |
| Edge    | `edge://extensions`    |

**3. Enable Developer Mode**

Toggle **Developer mode** in the top-right corner of the extensions page.

**4. Load the extension**

Click **Load unpacked** → select the cloned `openmsg/` folder (the one containing `manifest.json`).

**5. Open WhatsApp Web**

Go to [https://web.whatsapp.com](https://web.whatsapp.com) and refresh the page.

The **OpenMsg workspace sidebar** will appear automatically on the right side of WhatsApp Web.

> **No sign-up, no license key, no server required.**

---

## 📂 Project Structure

```
openmsg/
├── manifest.json              # Chrome Extension Manifest V3
├── build.json                 # Build metadata
├── package.json               # Project metadata
├── LICENSE                    # MIT License
├── README.md                  # This file
├── CONTRIBUTING.md            # Contribution guidelines
├── CHANGELOG.md               # Version history
├── INSTALL.txt                # Quick-start guide
│
├── icons/                     # Extension icons (16px – 512px)
├── pages/                     # Extension HTML pages (workspace entry)
│
├── vendor/                    # Bundled third-party libraries
│   ├── wppconnect-wa.js       # WPPConnect WhatsApp bridge
│   └── qrcode.mjs             # QR code generator
│
└── src/
    ├── background/            # Service Worker (MV3)
    │   └── sw.js              # Alarms, notifications, tab management
    │
    ├── bridge/                # Main-world injection bridge
    │   └── main-bridge.js     # Talks to WhatsApp Web's internal JS context
    │
    ├── content/               # Isolated-world content scripts
    │   ├── loader.js          # Extension bootstrap / guard
    │   └── main.js            # App entry point — wires all modules together
    │
    ├── core/                  # Pure business-logic engines (no DOM)
    │   ├── app.js             # App lifecycle coordinator
    │   ├── automation.js      # Chatbot / automation engine
    │   ├── crm.js             # CRM data model and operations
    │   ├── scheduler.js       # Broadcast scheduling and campaign runner
    │   ├── sender.js          # Message sending queue and rate limiter
    │   ├── ai.js              # AI assistant integration layer
    │   ├── webhooks.js        # Webhook dispatch (outgoing HTTP events)
    │   ├── store.js           # IndexedDB persistence layer
    │   ├── events.js          # Internal pub/sub event bus
    │   ├── activation.js      # Open-source stub — always returns active
    │   ├── app-config.js      # Project build metadata (no server, no keys)
    │   └── browser-info.js    # Browser / device information helper
    │
    ├── features/              # Self-contained feature modules
    │   ├── blur.js            # Privacy blur overlay
    │   ├── canned.js          # Canned response quick-insert
    │   ├── chat-modal.js      # Contact detail modal
    │   ├── crm-drawer.js      # CRM side-drawer for open chats
    │   └── strap.js           # WhatsApp Web toolbar integration
    │
    ├── panels/                # UI panel components (workspace screens)
    │   ├── kanban.js          # CRM Kanban pipeline board
    │   ├── chatbots.js        # Chatbot list & status panel
    │   ├── chatbot-builder.js # Visual chatbot flow editor
    │   ├── broadcasts.js      # Broadcast campaign manager
    │   ├── calendar.js        # Scheduler and reminders panel
    │   ├── canned-responses.js# Canned response manager
    │   ├── status-posts.js    # WhatsApp Status publisher
    │   ├── webhooks.js        # Webhook configuration panel
    │   ├── settings.js        # Extension settings panel
    │   └── tools.js           # Utility tools (QR, wa.me links)
    │
    ├── styles/
    │   └── wacrm.css          # All extension styles (Shadow DOM scoped)
    │
    └── ui/                    # Shared UI primitives and workspace shell
        ├── shell.js           # Top-bar, sidebar, and host element
        ├── workspace.js       # Panel routing and workspace layout
        ├── dom.js             # DOM helpers and icon rendering
        ├── icons.js           # SVG icon library
        ├── components.js      # Reusable UI components
        ├── modals.js          # Modal and dialog manager
        ├── about-dialog.js    # About / version info dialog
        └── styles.js          # Stylesheet injection into Shadow DOM
```

---

## 🏗️ Architecture

OpenMsg uses the standard **Chrome MV3 Extension** pattern with three isolated JavaScript execution contexts that communicate by message-passing:

```
┌──────────────────────────────────────────────────────────────┐
│  Browser Tab  (https://web.whatsapp.com)                      │
│                                                               │
│  ┌─────────────────────────────────┐                         │
│  │  Main World  (page JS context)  │  ← src/bridge/          │
│  │  WhatsApp Web's own JavaScript  │    main-bridge.js        │
│  └───────────────┬─────────────────┘                         │
│                  │  window.postMessage                        │
│  ┌───────────────▼─────────────────┐                         │
│  │  Isolated World (content script)│  ← src/content/main.js  │
│  │  OpenMsg app logic              │  ← src/core/*            │
│  │  UI panels & workspace shell    │  ← src/panels/*          │
│  │                                 │  ← src/ui/*              │
│  └───────────────┬─────────────────┘                         │
│                  │  chrome.runtime.sendMessage                │
└──────────────────┼───────────────────────────────────────────┘
                   │
   ┌───────────────▼──────────────────┐
   │  Service Worker                  │  ← src/background/sw.js
   │  Alarms · Notifications · Tabs   │
   └──────────────────────────────────┘
```

### Key Design Decisions

| Decision | Reason |
|---|---|
| **Shadow DOM isolation** | Extension styles never bleed into WhatsApp Web's CSS |
| **No remote calls at runtime** | No license server, no analytics — only user-configured webhooks leave the browser |
| **Local IndexedDB storage** | All CRM data, chatbots, and settings are stored on the user's machine |
| **ES Modules throughout** | Clean `import`/`export` — no bundler required to develop or load the extension |
| **Manifest V3** | Chrome's current and future-supported extension platform |

---

## 🛠️ Configuration

No environment variables or build tools are required. Load the source folder directly.

### `build.json`

```json
{
  "version": "0.0.1",
  "type": "free",
  "source": "local"
}
```

### `src/core/app-config.js`

Project metadata shown in the About screen. Update `name` and `website` if you fork the project.

```js
export const BUILD_PROVIDER = {
  name: 'OpenMsg Project',
  website: 'https://github.com/zulbulai/openmsg',
};
```

### Activation System

OpenMsg has **no activation system**. `src/core/activation.js` is a no-op stub that always returns `active: true`. No keys, no servers, no checks needed.

---

## 🤝 Contributing

Contributions are very welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

### Quick Start

```bash
git clone https://github.com/zulbulai/openmsg.git
cd openmsg
# Load as unpacked in chrome://extensions — no build step needed
```

### Guidelines

- One feature or bug fix per pull request
- Use ES Modules — no CommonJS `require()`
- Do **not** add activation checks, remote telemetry, or license gates
- Test on the latest version of WhatsApp Web before submitting

### Reporting Issues

[Open an issue on GitHub](https://github.com/zulbulai/openmsg/issues) with:
- Browser name and version
- Steps to reproduce
- Expected vs. actual behavior
- Console errors (F12 → Console tab)

---

## 📄 License

[MIT](LICENSE) — Copyright © 2024 OpenMsg Contributors

---

<p align="center">
  Made with ❤️ for the open-source community
</p>
