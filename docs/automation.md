# OpenMsg Automation Engine

## Overview

The OpenMsg Automation Engine evaluates incoming WhatsApp messages, contact events, and state mutations to execute automated responses, tag assignments, webhook dispatches, and workflow triggers.

---

## Architectural Lifecycle

```text
Inbound Event (MESSAGE_RECEIVED, TAG_ADDED, etc.)
                   │
                   ▼
     [eventDeduplication Cache] ──(Duplicate Event)──> [Drop]
                   │
                   ▼ (Unique Event)
      Query Enabled Rules (db.automationRules)
                   │
                   ▼
       Condition Evaluation
       (field: body, text, tag)
       (operators: exact, contains, starts_with, regex)
                   │
         ┌─────────┴─────────┐
         │ (Matched)         │ (No Match)
         ▼                   ▼
    Execute Actions        [Ignore]
    ├── SEND_MESSAGE
    ├── ADD_TAG
    ├── REMOVE_TAG
    ├── START_WORKFLOW
    └── DISPATCH_WEBHOOK
```

---

## Deduplication & Idempotency

Chrome Manifest V3 service workers and WhatsApp Web bridge listeners may deliver duplicate message event dispatches during network retries or tab reloads. OpenMsg enforces strict idempotency:

- **Cache**: In-memory ring buffer tracking event IDs with a 15-minute expiration time-to-live (`TTL`).
- **Check**: `eventDeduplication.isDuplicate(event.id)`.
- **Result**: Identical event IDs within the TTL window are dropped immediately without triggering duplicate auto-replies or actions.

---

## Supported Rule Conditions

| Operator | Behavior | Case Sensitivity |
| :--- | :--- | :--- |
| `exact` | Matches the entire text string exactly (`trim().toLowerCase()`) | Case-insensitive |
| `contains` | Matches if substring exists anywhere in message text | Case-insensitive |
| `starts_with` | Matches if the message begins with the prefix | Case-insensitive |
| `regex` | Safely evaluates regular expression pattern against input | Case-insensitive |

---

## Supported Actions

1. **`SEND_MESSAGE`**:
   - Dispatches a text reply through the anti-ban message queue.
   - Interpolates dynamic template tokens (e.g. `{{contact.name}}`, `{{contact.phone}}`).
2. **`ADD_TAG`**:
   - Associates a CRM tag with the customer in `db.contactTags`.
3. **`REMOVE_TAG`**:
   - Removes a tag from the contact.
4. **`START_WORKFLOW`**:
   - Initializes a new visual workflow execution for the contact (`WorkflowEngine.startExecution`).
5. **`WEBHOOK`**:
   - Triggers an outbound HTTP webhook notification.
