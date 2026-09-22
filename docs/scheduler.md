# OpenMsg Persistent Scheduler

## Overview

The OpenMsg Scheduler coordinates time-delayed actions, recurring follow-ups, and scheduled campaign broadcasts. Because Chrome Manifest V3 service workers can terminate after 30 seconds of inactivity, OpenMsg relies on persistent storage in IndexedDB combined with `chrome.alarms` to survive worker restarts, browser relaunches, and system reboots.

---

## Architecture

```text
User UI / Workflow Action
         │
         ▼
  [db.scheduledMessages] (IndexedDB)
         │
         ▼
  [AlarmManager.schedule]
         │
         ▼
  chrome.alarms.create(alarmId, { when: triggerAt })
         │
    (Time Elapses / Browser Dormant)
         │
         ▼
  Service Worker Wakeup: chrome.alarms.onAlarm
         │
         ▼
  AlarmManager.onAlarm(alarm)
         │
         ├── Fetch task from db.scheduledMessages
         ├── Validate task status === 'pending'
         ├── Enqueue payload in MessageQueue (anti-ban rate limiter)
         ├── Update status to 'sent'
         └── If recurring (daily/weekly/custom): compute next trigger & re-arm alarm
```

---

## Recurrence Modes

1. **`once`**: Executes at a specific future ISO date & time (`when: timestamp`).
2. **`daily`**: Fires every day at a user-defined time of day (e.g. `09:00 AM`).
3. **`weekly`**: Fires on designated days of the week (e.g. Every Monday and Thursday at `10:00 AM`).
4. **`custom`**: Selectable weekday mask + start date + end date.

---

## Anti-Ban Protection During Dispatches

When scheduled tasks fire, messages are not blasted simultaneously into the WhatsApp Web DOM. Instead:
- Outgoing messages pass through `messageQueue.enqueue()`.
- The anti-ban throttle injects 3s–8s randomized jitter delays between consecutive dispatches.
- Hourly caps (`maxPerHour`, default 250) prevent triggering automated abuse thresholds.
