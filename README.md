# OpenMsg

> **Open-source WhatsApp Automation & CRM**  
> An independent, local-first Chrome Extension for customer management, automation, visual chatbots, and message scheduling directly inside WhatsApp Web.

[![CI](https://github.com/openmsg-dev/openmsg/actions/workflows/ci.yml/badge.svg)](https://github.com/openmsg-dev/openmsg/actions)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-success)](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

> **Important Disclaimer**:  
> **OpenMsg is an independent open-source project and is not affiliated with, sponsored by, or endorsed by WhatsApp or Meta Platforms, Inc.** WhatsApp is a registered trademark of Meta Platforms, Inc.

---

## Overview

Commercial WhatsApp automation tools often lock customer records, visual bots, and message histories into proprietary closed platforms and expensive node-locked licenses. **OpenMsg** provides a transparent, genuine open-source alternative built with modern web standards:

- **100% Local-First**: Your contacts, conversations, pipelines, and workflows stay on your computer in IndexedDB. No mandatory remote servers.
- **Visual Workflow & Chatbot Builder**: Node-based canvas powered by React Flow for automated multi-step branching, custom variables, and conditional routing.
- **Embedded CRM**: Lead stages, custom fields, tags, contact notes, and follow-up appointment tracking.
- **Anti-Ban Architecture**: Randomized delays (3s–8s), simulated typing status, and hourly quotas protect accounts from automated spam flags.
- **Durable Scheduling**: Leverages Chrome Alarms to persist scheduled messages across Manifest V3 service worker sleeps.
- **Extensible AI**: Bring your own API keys for OpenAI, Google Gemini, or Anthropic Claude with strict privacy boundaries.

---

## Architecture at a Glance

```text
                   OPENMSG
                Chrome Extension
                       │
          ┌────────────┴────────────┐
          │                         │
       React UI               Extension Core
          │                         │
          │              ┌──────────┼──────────┐
          │              │          │          │
          │             CRM      Automation   Scheduler
          │              │          │          │
          └──────────────┴──────────┼──────────┘
                                    │
                              WhatsApp Bridge
                                    │
                              WhatsApp Web
```

For comprehensive deep-dives, see:
- [System Architecture](docs/architecture.md)
- [WhatsApp Integration](docs/whatsapp-integration.md)
- [Storage & Entity Model](docs/storage.md)
- [Workflow Engine Machine](docs/workflow-engine.md)
- [Reference Project Analysis](docs/reference-analysis.md)

---

## Installation & Setup

### Prerequisites
- Node.js 20+
- pnpm (v9+) or npm (v10+)

### Building from Source

```bash
# Clone the repository
git clone https://github.com/openmsg-dev/openmsg.git
cd openmsg

# Install dependencies
pnpm install

# Run automated tests
pnpm test

# Build production extension bundle
pnpm build
```

The compiled extension is output to `openmsg/dist/`.

---

## Loading the Extension in Your Browser

1. Open Chrome (or Brave / Edge) and browse to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** via the top-right toggle switch.
3. Click **Load unpacked** in the upper left.
4. Select the `openmsg/dist` folder.
5. Open [web.whatsapp.com](https://web.whatsapp.com) or click the OpenMsg toolbar icon to launch the Side Panel.

---

## Documentation

- [System Architecture](docs/architecture.md)
- [WhatsApp Integration & Bridge](docs/whatsapp-integration.md)
- [Storage Architecture (Dexie)](docs/storage.md)
- [Workflow Engine & Node Specs](docs/workflow-engine.md)
- [Security Policy & Threat Model](docs/security.md)
- [Privacy Policy](docs/privacy.md)
- [Development Guide](docs/development.md)
- [Project Roadmap](docs/roadmap.md)
- [Open-Source Licensing Rationale](docs/licensing.md)
- [Reference Project Analysis](docs/reference-analysis.md)

---

## Roadmap

OpenMsg is being developed in structured phases:
- **Phase 1 (Current)**: Foundation — Manifest V3, Storage, Message Bus, Mock WhatsApp Client, Documentation.
- **Phase 2**: Real WhatsApp Webhook & Bridge Ingestion.
- **Phase 3**: CRM Pipelines, Contacts, Notes, and Tagging.
- **Phase 4**: Automation Rules & Anti-Ban Rate Limiter.
- **Phase 5**: Visual Workflow Canvas with React Flow.
- **Phase 6**: Broadcast Campaigns & Recipient Filtering.
- **Phase 7**: Bring-Your-Own-Key AI Providers & Webhook Gateways.
- **Phase 8**: Production Polish & Chrome Web Store Release.

---

## Contributing

We welcome community contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

---

## Security & Vulnerability Reporting

Security is paramount. Please report security issues privately by following the instructions in our [Security Policy](SECURITY.md).

---

## License

OpenMsg is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).
