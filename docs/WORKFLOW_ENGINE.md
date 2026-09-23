# OpenMsg — Chatbot & Workflow Engine Documentation

This document describes the design, execution lifecycle, and node specifications of OpenMsg's automation engines: the **Visual Chatbot Flow Engine** (`src/core/chatbot.js`) and the **Message Bot Rule Engine** (`src/core/workflows.js`).

---

## 1. Dual-Engine Architecture

OpenMsg provides two complementary automation systems:

1. **Visual Chatbots (`src/core/chatbot.js`)**:
   - Multi-step, conversational state machines modeled as directed graphs (`nodes` and `edges`).
   - Supports user input capture, conditions, branching, variable memory, API webhooks, and human handoff.
   - Sessions are persistent across messages (`chatSessions` collection).
2. **Message Bots (`src/core/workflows.js`)**:
   - Single-step keyword or event-driven triggers.
   - Lightweight auto-reply rules for individual or group chats with frequency limits and post-actions.

---

## 2. Visual Chatbot Execution Model

### Session Lifecycle (`chatSessions`)
When an incoming message arrives from a direct contact:
```text
INCOMING MESSAGE
  ↓
Check active session in `chatSessions` for chatId?
  ├─ YES:
  │    Check session expiration (TTL)
  │    Is node waiting for reply?
  │      ├─ Validate input format (text, number, email, phone, date)
  │      ├─ Match button/list option selection
  │      └─ Save captured value into session.variables[saveAs]
  │    Advance to connected edge
  └─ NO:
       Evaluate triggers of all enabled chatbots (`chatbots.findTrigger`)
       If trigger matched:
         Start new session at `start` node
         Execute sequence of non-blocking nodes until a wait/delay/end is reached
```

### Session State Schema:
- `id`: Contact `chatId` (one active session per contact).
- `flowId`: Chatbot ID being executed.
- `nodeId`: Current graph node pointer.
- `variables`: Key-value dictionary storing captured inputs and runtime state.
- `waitingForReply`: Boolean flag indicating execution is blocked awaiting contact response.
- `timeoutAt`: Timestamp when no-reply timeout branch triggers.
- `retries`: Number of failed input validation attempts before fallback.

---

## 3. Node Type Registry

OpenMsg implements 18 node types organized into 6 palette groups:

### Group 1: Messages (`messages`)
- **`start`**:
  - *Purpose*: Starting point of the conversation.
  - *Inputs*: Trigger activation.
  - *Outputs*: Single `"next"` handle.
- **`text`**:
  - *Purpose*: Sends a plain text message.
  - *Inputs*: Previous node.
  - *Data*: `{ text, typingDelay, wait, saveAs, format, timeoutEnabled, timeoutValue, timeoutUnit }`.
  - *Outputs*: `"next"` (immediate or after reply), optional `"timeout"`.
- **`image`**:
  - *Purpose*: Sends photo attachment with optional caption.
  - *Data*: `{ files: [blobId], caption, typingDelay, wait, saveAs, ... }`.
- **`video`**:
  - *Purpose*: Sends video attachment with caption.
  - *Data*: `{ files: [blobId], caption, typingDelay, wait, saveAs, ... }`.
- **`audio`**:
  - *Purpose*: Sends audio file or simulated voice note.
  - *Data*: `{ files: [blobId], typingDelay, wait, saveAs, ... }`.
- **`document`**:
  - *Purpose*: Sends document (PDF, spreadsheet, etc.) with caption.
  - *Data*: `{ files: [blobId], caption, typingDelay, wait, saveAs, ... }`.

### Group 2: Interactive (`interactive`)
- **`list`**:
  - *Purpose*: Sends native WhatsApp interactive list menu (falls back to formatted text if unsupported).
  - *Data*: `{ title, description, buttonText, footer, sections: [{ title, rows: [{ title, description }] }], saveAs, timeoutEnabled, ... }`.
  - *Outputs*: Distinct handles for each row (`"option:0"`, `"option:1"`), `"default"` (unrecognized reply), and `"timeout"`.
- **`buttons`**:
  - *Purpose*: Sends quick reply buttons (falls back to numeric text menu if unsupported).
  - *Data*: `{ text, footer, buttons: [{ text }], saveAs, timeoutEnabled, ... }`.
  - *Outputs*: Distinct handles for each button (`"option:0"`, `"option:1"`), `"default"`, and `"timeout"`.

### Group 3: Logic (`logic`)
- **`condition`**:
  - *Purpose*: Branches execution by evaluating stored variables.
  - *Data*: `{ branches: [{ join: 'and'|'or', rules: [{ variable, operator, value }] }] }`.
  - *Operators*: `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `gt`, `gte`, `lt`, `lte`, `is_empty`, `is_not_empty`.
  - *Outputs*: Handles for each branch (`"cond:0"`, `"cond:1"`), plus `"otherwise"`.
- **`setVariable`**:
  - *Purpose*: Sets or updates session or contact variables.
  - *Data*: `{ entries: [{ name, scope: 'chatbot'|'contact', value }] }`.
  - *Outputs*: Single `"next"` handle.

### Group 4: Flow Control (`flow`)
- **`delay`**:
  - *Purpose*: Pauses execution for a configured duration before proceeding.
  - *Data*: `{ value, unit: 'seconds'|'minutes'|'hours' }`.
  - *Outputs*: `"next"` handle.
- **`jump`**:
  - *Purpose*: Directs execution to another arbitrary node in the graph.
  - *Data*: `{ targetId }`.
- **`startNewFlow`**:
  - *Purpose*: Transfers the conversation session to a separate chatbot flow.
  - *Data*: `{ flowId }`.

### Group 5: Actions (`actions`)
- **`tag`**:
  - *Purpose*: Adds or removes CRM tags for the contact.
  - *Data*: `{ add: [tagId], remove: [tagId] }`.
  - *Outputs*: `"next"`.
- **`action`**:
  - *Purpose*: Performs CRM operations (assign to Kanban stage, archive chat, block contact, add to tab).
  - *Data*: Standard action structure (`emptyActions()`).
  - *Outputs*: `"next"`.
- **`webhook`**:
  - *Purpose*: Makes an external HTTP API request (GET, POST, etc.) and maps response JSON fields back into chatbot variables.
  - *Data*: `{ method, url, headers, params, bodyMode, bodyFields, bodyRaw, timeoutSec, retry, statusRoutes, mapping }`.
  - *Outputs*: `"next"` (success), `"status:<code>"` routes, and `"fallback"`.

### Group 6: Escalate & End (`escalate`)
- **`handoff`**:
  - *Purpose*: Escalates chat to a human agent, pauses bot for the contact, and optionally notifies the agent via WhatsApp message.
  - *Data*: `{ customerMessage, agentPhone, agentMessage }`.
  - *Outputs*: None (terminates bot session).
- **`end`**:
  - *Purpose*: Sends an optional closing message and terminates the session.
  - *Data*: `{ message }`.
  - *Outputs*: None.

---

## 4. Message Bot Rule Specifications (`src/core/workflows.js`)

Message Bots are lightweight rule definitions evaluated sequentially when incoming messages are not consumed by active chatbot sessions:

- **Targeting**: Individual chats or Group chats (`target: 'group'` with specific `groupIds` or `allGroups`).
- **Trigger Modes**:
  - `keyword`: Matches keywords using `contains`, `exact`, `starts`, or `ends` (case-sensitive or insensitive).
  - `newChat`: Fires only on the very first incoming message from a new contact.
  - `every`: Fires on every incoming message.
- **Operating Days**: Restricts activation to specific days of the week (`days: [1, 2, 3, 4, 5]`).
- **Frequency Limits**: `limitPerChat` caps total executions per contact using persistent counters (`counters` collection).
- **Responses**: Sends custom multi-messages or triggers pre-configured Canned Responses (`quickReplyId`).
- **Post-Actions**: Executes `actions.run(...)` (tags, stage assignment, webhooks) upon successful reply.
