# OpenMsg

**OpenMsg** is a free and open-source WhatsApp Web CRM and automation workspace. It runs as a Chrome Manifest V3 extension and adds a full-featured sidebar directly inside [WhatsApp Web](https://web.whatsapp.com/).

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](manifest.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/zulbulai/openmsg/pulls)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **CRM & Kanban** | Manage contacts, leads, and deals with a drag-and-drop pipeline board |
| **Chatbot Builder** | Build automated conversation flows with keyword triggers, menus, and conditions |
| **Broadcast Campaigns** | Send bulk messages with configurable pacing and personalization variables |
| **Canned Responses** | Save and instantly insert frequently used messages or media |
| **AI Integration** | Connect an AI model to auto-reply to customer queries |
| **Scheduler & Calendar** | Schedule messages for future delivery; set contact reminders |
| **Webhooks** | Send/receive HTTP events to integrate with Zapier, Make, n8n, or any backend |
| **Privacy / Blur Mode** | Blur contact names, numbers, and chat content for screen sharing |
| **Status Posts** | Broadcast WhatsApp Status updates from within the workspace |
| **Dark / Light Theme** | Built-in theme switcher with full CSS variable system |

---

## Installation

OpenMsg is a Chrome unpacked extension — no Chrome Web Store listing is required.

### Requirements

- **Browser**: Google Chrome, Brave, Microsoft Edge, or any Chromium-based browser
- **No build step required** — load the source directory directly

### Steps

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/zulbulai/openmsg.git
   ```

2. Open your browser's extensions page:

   | Browser | URL |
   |---|---|
   | Chrome | `chrome://extensions` |
   | Brave  | `brave://extensions`  |
   | Edge   | `edge://extensions`   |

3. Enable **Developer mode** (top-right toggle).

4. Click **Load unpacked** and select the cloned `openmsg/` directory (the folder containing `manifest.json`).

5. Open [https://web.whatsapp.com](https://web.whatsapp.com) and refresh the page.

6. The OpenMsg workspace sidebar will load automatically.

---

## Project Structure

```
openmsg/
├── manifest.json              # Chrome Extension Manifest V3
├── build.json                 # Build metadata
├── package.json               # Project metadata
├── LICENSE                    # MIT License
├── README.md                  # This file
├── INSTALL.txt                # Quick-start guide
│
├── icons/                     # Extension icons (16px – 512px)
├── pages/                     # Extension pages (workspace popup)
│
├── vendor/                    # Bundled third-party libraries
│   ├── wppconnect/            # WPPConnect WhatsApp bridge
│   └── qrcode/                # QR code generator
│
└── src/
    ├── background/            # Service Worker (MV3)
    │   └── sw.js              # Alarm handling, notifications, tab management
    │
    ├── bridge/                # Main-world injection bridge
    │   └── main-bridge.js     # Communicates with WhatsApp's internal JS context
    │
    ├── content/               # Isolated-world content scripts
    │   ├── loader.js          # Extension bootstrap
    │   └── main.js            # App entry point; wires all modules
    │
    ├── core/                  # Pure business-logic engines
    │   ├── app.js             # App lifecycle coordinator
    │   ├── automation.js      # Chatbot/automation engine
    │   ├── crm.js             # CRM data model and operations
    │   ├── scheduler.js       # Broadcast scheduling and campaign runner
    │   ├── sender.js          # Message sending queue and rate limiter
    │   ├── ai.js              # AI assistant integration layer
    │   ├── webhooks.js        # Webhook dispatch (outgoing HTTP events)
    │   ├── store.js           # IndexedDB persistence layer
    │   ├── events.js          # Internal event bus
    │   ├── license.js         # Open-source stub (always active, no checks)
    │   └── license-config.js  # Project build metadata (no server, no keys)
    │
    ├── features/              # Self-contained feature modules
    │   ├── blur.js            # Privacy blur overlay
    │   ├── canned.js          # Canned response picker
    │   ├── chat-modal.js      # Contact detail modal
    │   └── crm-drawer.js      # CRM side-drawer for open chats
    │
    ├── panels/                # UI panel components (each is a workspace screen)
    │   ├── kanban.js          # CRM Kanban board
    │   ├── chatbots.js        # Chatbot list panel
    │   ├── chatbot-builder.js # Visual chatbot flow editor
    │   ├── broadcasts.js      # Broadcast campaign manager
    │   ├── calendar.js        # Scheduler and reminders panel
    │   ├── canned-responses.js# Canned response manager
    │   ├── status-posts.js    # WhatsApp Status publisher
    │   ├── webhooks.js        # Webhook configuration panel
    │   ├── settings.js        # Extension settings panel
    │   └── tools.js           # Utility tools panel
    │
    ├── styles/
    │   └── wacrm.css          # All extension styles (Shadow DOM scoped)
    │
    └── ui/                    # Shared UI primitives and workspace shell
        ├── shell.js           # Top-bar, sidebar, and host element setup
        ├── workspace.js       # Panel routing and workspace layout
        ├── dom.js             # DOM helpers and icon rendering
        ├── icons.js           # SVG icon library
        ├── components.js      # Reusable UI components (buttons, inputs, cards)
        ├── modals.js          # Modal and dialog management
        ├── license-dialog.js  # About / version dialog (no license gate)
        └── styles.js          # Stylesheet injection utility
```

---

## Architecture

OpenMsg follows the standard **Chrome MV3 Extension** pattern with three isolated execution contexts:

```
┌─────────────────────────────────────────────────────────┐
│  Browser Tab (WhatsApp Web — web.whatsapp.com)          │
│                                                          │
│  ┌──────────────────────────────┐                       │
│  │  Main World (page context)   │  ← bridge/main-bridge │
│  │  WhatsApp Web JavaScript     │                       │
│  └──────────────┬───────────────┘                       │
│                 │ postMessage                           │
│  ┌──────────────▼───────────────┐                       │
│  │  Isolated World              │  ← content/main.js    │
│  │  Content Script              │  ← all core/* modules │
│  │  (OpenMsg app logic)         │  ← all panels/*       │
│  └──────────────┬───────────────┘                       │
│                 │ chrome.runtime.sendMessage             │
└─────────────────┼────────────────────────────────────── ┘
                  │
  ┌───────────────▼──────────────┐
  │  Service Worker              │  ← background/sw.js
  │  (alarms, notifications)     │
  └──────────────────────────────┘
```

### Key Design Points

- **Shadow DOM isolation**: All extension UI is mounted inside a `<div id="openmsg-host">` element with a closed Shadow DOM so extension styles never leak into WhatsApp Web's own CSS.
- **No remote dependencies at runtime**: The extension makes no requests to any remote license server or analytics endpoint. The only external HTTP calls are user-configured webhooks.
- **IndexedDB storage**: All CRM data, chatbots, broadcasts, and settings are stored locally in the browser's IndexedDB via `src/core/store.js`.

---

## Configuration

There are no required environment variables or build steps. The extension loads directly from source.

### `manifest.json`

The Chrome extension manifest. Key fields:

| Field | Value |
|---|---|
| `manifest_version` | `3` |
| `name` | `OpenMsg` |
| `version` | `0.0.1` |
| `host_permissions` | `https://web.whatsapp.com/*` |

### `build.json`

Lightweight build metadata file read at runtime:

```json
{
  "version": "0.0.1",
  "type": "free",
  "source": "local"
}
```

### License System

OpenMsg has **no license system**. The `src/core/license.js` module exposes a stub implementation that always returns `active: true`. No keys, no servers, no checks. All features work without any registration.

---

## Contributing

Contributions are welcome. Please open an issue or pull request on GitHub.

### Getting Started

```bash
git clone https://github.com/zulbulai/openmsg.git
cd openmsg
# Load as unpacked extension in Chrome — no build step required
```

### Guidelines

- Keep changes scoped — one feature or fix per pull request.
- Do not introduce remote license or activation checks.
- Test against the latest version of WhatsApp Web before submitting.
- Use ES Modules (`import`/`export`) consistent with the existing codebase.

### Reporting Issues

Open a GitHub issue at: [https://github.com/zulbulai/openmsg/issues](https://github.com/zulbulai/openmsg/issues)

Please include:
- Browser name and version
- WhatsApp Web URL and any console errors
- Steps to reproduce

---

## License

MIT License — see [LICENSE](LICENSE) for details.

> Copyright (c) 2024 OpenMsg Contributors
