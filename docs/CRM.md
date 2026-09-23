# OpenMsg — CRM Architecture & Feature Documentation

This document describes OpenMsg's built-in **Customer Relationship Management (CRM)** subsystem (`src/core/crm.js`, `src/features/crm-drawer.js`, `src/panels/kanban.js`, `src/panels/crm-settings.js`).

---

## 1. CRM Subsystem Overview

OpenMsg turns WhatsApp Web into a full CRM workspace:

```text
CRM Subsystem
├── Contacts Layer (`contacts` collection)
│   ├── WhatsApp JID Identity (e.g. 1234567890@c.us)
│   ├── Display Name Overrides & Phone Digits
│   ├── Custom Field Values (`attributes`)
│   └── Tags Attachment (`tagIds`)
│
├── Pipeline & Kanban Layer
│   ├── Multi-Dashboard Support (`kanbanDashboards`)
│   ├── Customizable Pipeline Stages (`kanbanStages`)
│   └── Stage Cards with Drag-and-Drop (`kanbanCards`)
│
├── Interaction Management
│   ├── Contact Notes (`notes` collection)
│   ├── Follow-Up Reminders (`reminders` collection)
│   ├── Scheduled Appointments (`appointments` collection)
│   └── Custom Chat Tabs (`tabs` collection)
│
└── Audit & Timeline Layer
    └── Rolling Activity Log (`activityLog` collection)
```

---

## 2. Contacts Management

- **Identifier**: Contacts are keyed by their WhatsApp JID (`chatId`, e.g. `1234567890@c.us`).
- **Name Resolution (`displayName`)**:
  - Checks contact record `fullName`.
  - Falls back to WhatsApp contact/chat name (`WPP.contact.name` or pushname).
  - Falls back to formatted phone number.
- **Custom Attributes**: Supports arbitrary custom fields (text, number, date, single choice, multiple choice) defined in `src/core/crm.js`.
- **Bot & AI Control**: Per-contact flags `botPaused` and `aiOff` allow human agents to take over chats without automated interference.

---

## 3. Pipelines, Stages & Multi-Dashboard Kanban

OpenMsg supports multiple independent pipelines (e.g. "Sales Pipeline", "Customer Support", "Partnerships"):

1. **Dashboards (`kanbanDashboards`)**:
   - Every stage belongs to a `dashboardId`.
   - Default dashboard: `dash_main` ("Main").
   - Users can create, rename, and delete dashboards.
2. **Stages (`kanbanStages`)**:
   - Default stages: `New lead` (#7dd3fc), `Contacted` (#ff4d4f), `Negotiation` (#c4b5fd), `Won` (#86efac).
   - Fully customizable names, hex colors, text colors, and visual order.
   - Can be collapsed horizontally to conserve screen real estate.
3. **Cards & Transitions (`kanbanCards`)**:
   - Each card links a contact (`chatId`) to a stage (`stageId`).
   - Dragging a card between columns updates its `order` and `stageId`.
   - Fires `app.bus.emit('crm:stage', { chatId, stage, previous })`, triggering automated webhooks (`stage_changed`).

---

## 4. Notes, Reminders & Follow-Ups

- **Notes (`notes`)**:
  - Saved per contact with title, formatted content, and creation timestamps.
  - Searchable and exportable.
- **Reminders (`reminders`)**:
  - Set for specific due dates/times with optional description.
  - Periodic background ticks (`reminders.tick()`) check due items.
  - Displays desktop notifications when due and updates status to `unread`.
  - Integrates with Chrome Alarms so reminders fire even if the tab was inactive.

---

## 5. Appointments & Calendar System

- **Appointments (`appointments`)**:
  - Tracks customer bookings with title, customer name, phone, email, start time, and end time.
  - **Overlap Detection**: `crm.overlap(start, end, id)` prevents double-booking conflicting time slots.
  - **Automated Customer Reminders**: Configurable pre-appointment reminders (15m, 30m, 1h, 2h, 1d before).
  - **Calendar View**: Visual week and day views in `src/panels/calendar.js`.

---

## 6. Contact Export & CSV Generation

- Implemented in `src/core/csv.js` and `src/panels/utilities.js`.
- Exports all contacts, phone numbers, assigned tags, pipeline stages, notes, and custom fields to standard RFC-4180 compliant CSV files for import into external tools (Excel, Google Sheets, HubSpot, Salesforce).
