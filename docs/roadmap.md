# OpenMsg Development Roadmap

## Phase 1 — Foundation (Current Milestone)
- [x] Manifest V3 extension configuration with minimum required permissions.
- [x] TypeScript strict configuration and Vite build pipeline.
- [x] IndexedDB (Dexie) storage schemas and repositories.
- [x] Typed internal Message Bus across Extension contexts.
- [x] `WhatsAppClient` interface abstraction and `MockWhatsAppClient`.
- [x] Comprehensive architectural and technical documentation.
- [x] Automated test suites and CI pipeline configuration.

## Phase 2 — WhatsApp Integration
- [ ] Implement Main-world Injected Bridge (`injected/whatsapp-bridge.ts`).
- [ ] Connect bridge to internal WhatsApp Web module hooks.
- [ ] Chat and contact synchronization pipeline.
- [ ] Real-time inbound message listener and event relay.
- [ ] Anti-ban message dispatcher with simulated typing and randomized delay intervals.

## Phase 3 — Local CRM Foundation
- [ ] Contact management interface with stage pipeline (New, Contacted, In Progress, Won, Lost).
- [ ] Multi-tag taxonomy and color assignments.
- [ ] Contact notes, reminders, and custom field schema editor.
- [ ] Real-time contact search, fuzzy filtering, and contact history timeline.
- [ ] Inbox view with conversation view, chat filter tabs, and contact sidebar.

## Phase 4 — Automation Engine
- [ ] Trigger listener machine (Message Received, Keyword Match, Tag Added, Contact Created).
- [ ] Rule engine supporting condition evaluation (`contains`, `matches_regex`, `equals`).
- [ ] Action execution machine (Send Text, Add Tag, Remove Tag, Update Contact, Delay).
- [ ] Idempotency deduplication engine to prevent duplicate triggers from replayed events.
- [ ] Chrome Alarms integration for durable scheduled task execution.

## Phase 5 — Visual Workflow Builder
- [ ] Interactive React Flow visual canvas in Side Panel / Workspace.
- [ ] Implementation of core node library:
  - Triggers: `START`
  - Messages: `TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`
  - Interactive: `BUTTONS`, `LIST`
  - Logic: `CONDITION`, `DELAY`, `SET_VARIABLE`
  - Actions: `TAG_CONTACT`, `REMOVE_TAG`, `WEBHOOK`, `HTTP_REQUEST`
  - Flow: `START_WORKFLOW`, `END`
- [ ] Graph cycle detection, structural validation, and step debugger.
- [ ] Rehydration protocol for delayed workflow resumes across service worker suspensions.

## Phase 6 — Broadcast Campaigns
- [ ] Campaign creator with audience segmentation by tags and custom fields.
- [ ] Dynamic template interpolation (`{{name}}`, `{{phone}}`, custom variables).
- [ ] Campaign queue runner with randomized throttling and quota enforcement.
- [ ] Campaign progress monitor, failure retry handler, and exportable CSV audit report.

## Phase 7 — AI Integration & Webhooks
- [ ] Multi-provider AI abstraction (`OpenAI`, `Google Gemini`, `Anthropic Claude`).
- [ ] Contextual chat assistant with conversation turn buffer and business hours enforcement.
- [ ] Human handoff trigger detection (`[[HANDOFF]]`).
- [ ] Outbound webhooks on 11 lifecycle triggers with HMAC-SHA256 signatures.
- [ ] Inbound webhook listener for external CRM event synchronization.

## Phase 8 — Performance & Hardening
- [ ] Bundle size optimization and dynamic code splitting.
- [ ] Full accessibility (WCAG 2.1 AA) keyboard navigation and screen-reader support.
- [ ] Comprehensive security audit (SSRF protection, ReDoS audits, XSS checks).
- [ ] Automated end-to-end integration tests.
- [ ] Chrome Web Store publishing readiness and community release.
