---
name: openmsg-dev
description: Expert pair-programming guide, architectural guardrails, and coding conventions for the OpenMsg Chrome Extension Manifest V3 WhatsApp CRM codebase.
---

# OpenMsg Development Skill

This skill provides expert architecture guidelines, debugging procedures, and testing patterns for OpenMsg.

## Technology Stack Summary
- **Platform**: Chromium Extension Manifest V3 (Chrome, Brave, Edge v111+).
- **Language**: Vanilla JavaScript (ES2022+ Modules). No bundler, no transpiler.
- **UI Architecture**: Shadow DOM host element (`#wacrm-host`) attached to page root; styles scoped inside `src/styles/wacrm.css`.
- **Page Bridge**: Main-world content script (`src/bridge/main-bridge.js`) interfacing with WPPConnect (`vendor/wppconnect-wa.js`).
- **Data Persistence**: In-memory Map cache backed by `chrome.storage.local` with `unlimitedStorage`.
- **Relay System**: Dedicated workspace tab (`pages/workspace.html`) communicates with WhatsApp Web tab via `src/core/relay.js`.

## Critical Development Rules
1. **Never use bundler or build steps**: Code must be directly loadable via Chrome's native ES module loader.
2. **Never leak styles into WhatsApp**: All UI markup and styles must reside inside the Shadow Root.
3. **Always use DOM creation helpers**: Use `h(...)` and `svgEl(...)` from `src/ui/dom.js`. Never use `innerHTML` or `eval`.
4. **Preserve message sending safety**: All automated outbound messages must pass through `createSender` (`src/core/sender.js`) to enforce rate limits and avoid WhatsApp bans.
5. **Always test syntax**: Run `node --check <file>` before declaring any task complete.
