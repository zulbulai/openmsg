# OpenMsg — Sequence & Broadcast Scheduler Engine Documentation

This document describes the implementation of OpenMsg's **Broadcast Campaigns, Scheduled Sequences, and Batch Dispatcher** (`src/core/scheduler.js` & `src/core/sender.js`).

---

## 1. Architectural Role & Unification

In OpenMsg, **Broadcasts**, **Scheduled Messages**, and **Sequences** are unified under a single flexible execution engine: `src/core/scheduler.js`.

- Items are persisted in the `campaigns` collection.
- `kind: "broadcast"`: Bulk campaigns dispatched to lists of contacts/groups.
- `kind: "schedule"`: Targeted sequence messages scheduled for future execution.
- *Note on Duplication*: While `src/core/store.js` declares `'schedules'` in `COLLECTIONS`, the codebase actually unifies all scheduled items in `campaigns`, rendering the standalone `'schedules'` collection unused.

---

## 2. Target Audience Resolution

Campaigns support composite audience selection across CRM dimensions:

```text
Campaign Targets
├── Individuals (Specific contacts or raw phone numbers)
├── Groups (WhatsApp group JIDs)
├── Custom Tabs (Members of specific filter tabs)
├── Kanban Stages (Contacts currently in selected pipeline stages)
├── Tags (Contacts carrying specific CRM tags)
└── WhatsApp Labels (WhatsApp Business labels)
```

### De-duplication:
- If `targets.allowDuplicates` is `false` (default), contacts that match multiple criteria (e.g., both having a Tag and being in a Kanban Stage) are resolved into a `Set<chatId>`, ensuring each recipient receives the campaign exactly once.
- Raw phone numbers without `@c.us` are dynamically validated against WhatsApp using `wa.resolveTarget(phone)` to verify they exist on WhatsApp before inclusion.

---

## 3. Execution Lifecycle & State Machine

Campaigns progress through standard lifecycle states:

```text
COMPOSE (Draft)
  ↓
PENDING (Scheduled for execution at `schedule.startAt`)
  ↓
RUNNING (Active background sending loop)
  ├─ PAUSED (Temporarily stopped by user or hourly rate limit)
  ├─ DISCARDED (Cancelled due to contact reply or user deletion)
  ├─ COMPLETED (All valid recipients processed)
  └─ MISSED (Scheduled time passed while browser was closed)
```

### Execution Loop:
1. **Batch Iteration**: Iterates over resolved recipient list sequentially.
2. **Personalization**: Replaces `{{name}}`, `{{phone}}`, and custom field attributes per recipient via `crm.vars(chatId)`.
3. **Randomized Delay**: Waits for a random interval between `delay.min` and `delay.max` seconds (e.g., 5s to 12s) before dispatching the message.
4. **Pause Batches**: If `pause.enabled` is true, automatically pauses for `pause.seconds` (e.g., 60s) after every `pause.afterContacts` (e.g., 20) recipients.
5. **Rate-Limit Backpressure**: Before each send, `src/core/sender.js` checks the rolling hourly cap (`maxSendsPerHour`). If the cap is reached, dispatch pauses until the hourly window slides.
6. **Delivery Logging**: Tracks individual recipient outcomes (`sent`, `failed`, error message) in the `campaign.run.log` array.
7. **Post-Actions**: Upon completing the message send to each contact, executes configured `post` actions (tagging, advancing Kanban stage, webhook notification).

---

## 4. Stop-on-Reply Protection (`discardOnReply`)

For multi-message outreach sequences:
- When a campaign has `options.discardOnReply = true`, `scheduler.onIncoming(chatId)` listens to inbound WhatsApp messages via `app.bus.on('message:in')`.
- If an enrolled contact replies during campaign execution or before scheduled delivery, their pending sequence messages are automatically cancelled (`discarded`).
- This prevents automated sequence messages from continuing to fire after a prospect has already responded.

---

## 5. Offline Recovery & Chrome Alarms

Because Chrome Extension Service Workers are terminated when idle and users may close their browser:

1. **Alarm Registration (`syncAlarms`)**:
   - `scheduler.upcoming()` calculates the timestamps of all pending campaigns.
   - The service worker registers native Chrome Alarms (`chrome.alarms.create('wacrm:c:<id>', { when })`).
2. **Browser Startup Recovery (`resumeOnBoot`)**:
   - When WhatsApp Web reloads and reaches `ready`, `scheduler.resumeOnBoot()` runs.
   - Any campaign marked `options.resumeIfReload = true` that was interrupted mid-run resumes sending from the last uncompleted recipient.
   - If a scheduled campaign's trigger time was missed while offline:
     - If `options.autoSendIfMissed = true`: Executes immediately upon startup.
     - If `options.autoSendIfMissed = false`: Marks status as `missed` to prevent unintended stale messaging.
