# WACRM — WhatsApp Web CRM & Automation Workspace (Open Source)

> **100% Free & Open Source | No License Restrictions | All Features Unlocked**  
> **Contact / WhatsApp Support:** [+91 6306356544](https://wa.me/916306356544)

---

## 🌟 Overview

**WACRM** is a complete, powerful CRM and automation suite built directly into WhatsApp Web. It enhances WhatsApp with workflow automation, CRM tools, chatbot builders, and productivity features.

All source code has been deobfuscated, formatted, and converted to clean modern JavaScript (ES Modules). The proprietary licensing checks have been removed, making all features permanently free and open source.

---

## ✨ Key Features

1. **📊 CRM & Kanban Board**
   - Manage leads, prospects, and customers right inside WhatsApp Web.
   - Drag-and-drop cards between customizable sales pipelines and stages.

2. **🤖 Chatbot & Automation Builder**
   - Create interactive automated flows with keyword triggers, menu buttons, and list options.
   - Condition-based routing and automated follow-ups.

3. **⚡ Canned Responses & Quick Replies**
   - Save frequently used messages, templates, and media.
   - Insert responses in one click or with keyboard shortcuts.

4. **📢 Broadcast Campaigns**
   - Send targeted bulk messages safely with configurable pacing and rate-limiting safeguards.
   - Support for variables (e.g., `{{name}}`) for personalization.

5. **🧠 AI Assistant Integration**
   - Connect AI models to answer customer queries automatically.
   - Context-aware responses with customizable prompts and safety thresholds.

6. **📅 Calendar, Schedules & Reminders**
   - Schedule messages for future dates and times.
   - Set contact-specific reminders and follow-up alerts with browser notifications.

7. **🔒 Privacy & Blur Tools**
   - Blur contact names, phone numbers, profile pictures, and chat messages for screen sharing and privacy.

8. **🔗 Webhooks & Integrations**
   - Send and receive HTTP webhook events to connect WhatsApp to Zapier, Make, n8n, or your custom CRM/backend.

---

## 🚀 Installation Guide

### Chrome / Brave / Edge / Opera

1. Download or clone this directory.
2. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (लोड अनपैक्ड).
5. Select the folder containing `manifest.json`.
6. Open [WhatsApp Web](https://web.whatsapp.com/) and refresh the page.
7. WACRM workspace will load automatically on your WhatsApp Web interface.

---

## 📂 Project Structure

```
wacrm/
├── manifest.json            # Chrome Extension Manifest V3 configuration
├── build.json               # Build metadata (free / local)
├── LICENSE                  # MIT Open Source License
├── README.md                # Documentation and guide
├── INSTALL.txt              # Quick installation steps
├── icons/                   # Extension icons (16, 32, 48, 128)
├── pages/                   # Permission and utility pages
├── vendor/                  # Vendor dependencies (WPPConnect, QRCode)
└── src/
    ├── background/          # Manifest V3 service worker (alarms, notifications, tabs)
    ├── bridge/              # Main world injection bridge for WhatsApp Web
    ├── content/             # Isolated world content scripts
    ├── core/                # Core engines (crm, sender, chatbot, ai, scheduler, store)
    ├── features/            # Feature modules (blur, canned, strap, chat-modal)
    ├── panels/              # UI panels (kanban, chatbots, broadcasts, settings, etc.)
    ├── styles/              # Vanilla CSS stylesheets (wacrm.css)
    └── ui/                  # UI components, modals, dialogs, and workspace shell
```

---

## 🔓 Open Source Changes

- **Deobfuscated Source Code**: All 75 source files have been completely deobfuscated and formatted with Prettier into clean, readable ES Modules.
- **License System Bypassed**: All remote server validations and restrictions have been completely removed.
- **Unlimited License Status**: The internal license state permanently reports `ACTIVE` with unlimited usage.
- **WhatsApp Support Link**: Direct WhatsApp contact button configured for `+91 6306356544`.

---

## 📞 Support & Inquiries

For questions, customization, or support:
- **WhatsApp**: [+91 6306356544](https://wa.me/916306356544)
- **Email**: support@wacrm.org
