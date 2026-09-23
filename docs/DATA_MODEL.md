# OpenMsg — Data Model Documentation

This document describes all persistent entities, fields, relationships, and storage schemas in OpenMsg.

All persistent records are stored in browser local storage via `chrome.storage.local` with `unlimitedStorage` enabled. In-memory `Map` instances are maintained by `src/core/store.js` for synchronous access.

---

## 1. Storage Keys & Namespaces

- **Collections**: Keyed as `wacrm:col:<collection_name>`.
  - Stored structure: `{ __w: "<writer_uid>", items: { [id]: Entity } }`
- **Binary Blobs**: Keyed as `wacrm:blob:<blob_id>`.
  - Stored structure: `{ dataUrl: string, name: string, mime: string, size: number }`
- **Alarm Metadata**: Keyed as `wacrm:alarmInfo`.
- **License Cache**: Keyed as `openmsg_license`.

---

## 2. Entity Schemas

### 1. Settings (`settings`)
Single record with `id: "app"`.
- `id`: `"app"` (string, required)
- `automationPaused`: boolean (default `false`)
- `delayMin`: number in seconds (default `3`)
- `delayMax`: number in seconds (default `8`)
- `maxSendsPerHour`: number (default `250`)
- `showTyping`: boolean (default `true`)
- `signatureEnabled`: boolean (default `false`)
- `signatureText`: string (default `""`)
- `identifyAgent`: boolean (default `false`)
- `signTyped`: boolean (default `true`)
- `agentName`: string (default `""`)
- `deviceName`: string (default `"This browser"`)
- `theme`: `"auto"` | `"dark"` | `"light"` (default `"auto"`)
- `aiProvider`: `"openai"` | `"gemini"` | `"anthropic"` (default `"openai"`)
- `aiKeys`: `{ openai: string, gemini: string, anthropic: string }`
- `aiModels`: `{ openai: string, gemini: string, anthropic: string }`
- `aiStrapEnabled`: boolean (default `true`)
- `strapEnabled`: boolean (default `true`)
- `reminderNotify`: boolean (default `true`)
- `inboxCount`: number (default `30`)
- `boardMode`: `"stages"` | `"cards"` (default `"stages"`)
- `kanbanOpen`: `"tab"` | `"panel"` (default `"tab"`)
- `buttonsMode`: `"list"` | `"buttons"` (default `"list"`)
- `useLabelsForBusiness`: boolean (default `false`)
- `assistant`: Object containing AI auto-responder settings

### 2. Contact (`contacts`)
Keyed by WhatsApp Chat JID / phone ID (`id` = `chatId`).
- `id`: string (JID format, e.g., `"1234567890@c.us"`, required)
- `chatId`: string (same as `id`, required)
- `fullName`: string (optional, contact display name override)
- `phone`: string (numeric digits)
- `tagIds`: array of string tag IDs (`tags.id`)
- `attributes`: object mapping custom field keys to values (`{ [fieldKey]: value }`)
- `botPaused`: boolean (optional, stops bot replies for this chat)
- `aiOff`: boolean (optional, stops AI assistant for this chat)
- `humanAt`: number timestamp (last time human operator replied)
- `lastIncomingAt`: number timestamp
- `lastIncomingText`: string (up to 200 chars)
- `lastOutgoingAt`: number timestamp
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 3. Tag (`tags`)
- `id`: string (prefix `ta*`, required)
- `name`: string (unique, required)
- `color`: string hex color (e.g., `"#ff4d4f"`)
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 4. Custom Field (`fields`)
- `id`: string (prefix `fi*`, required)
- `label`: string (user-facing label, required)
- `key`: string (snake_case identifier, e.g., `"account_id"`, required)
- `type`: `"text"` | `"number"` | `"date"` | `"select"` | `"multiselect"`
- `options`: array of strings (for select/multiselect)
- `order`: number
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 5. Note (`notes`)
- `id`: string (prefix `no*`, required)
- `chatId`: string (contact JID, required)
- `title`: string (required)
- `text`: string (content, required)
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 6. Reminder (`reminders`)
- `id`: string (prefix `re*`, required)
- `chatId`: string (contact JID, required)
- `title`: string (required)
- `details`: string (optional)
- `at`: number timestamp (due date/time, required)
- `status`: `"pending"` | `"unread"` | `"done"` | `"missed"`
- `notified`: boolean
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 7. Appointment (`appointments`)
- `id`: string (prefix `ap*`, required)
- `customerName`: string (required)
- `customerPhone`: string (required)
- `customerEmail`: string (optional)
- `title`: string (required)
- `details`: string (optional)
- `start`: number timestamp (required)
- `end`: number timestamp (required)
- `status`: `"scheduled"` | `"completed"` | `"cancelled"` | `"no-show"`
- `reminderMinutes`: number (0, 15, 30, 60, 120, 1440)
- `reminded`: boolean
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 8. Chat Tab (`tabs`)
- `id`: string (prefix `ta*`, required)
- `title`: string (up to 30 chars, required)
- `details`: string (optional)
- `order`: number
- `visible`: boolean (default `true`)
- `members`: array of string chatIds
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 9. Kanban Dashboard (`kanbanDashboards`)
- `id`: string (e.g. `"dash_main"`, required)
- `name`: string (up to 30 chars, required)
- `order`: number
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 10. Kanban Stage (`kanbanStages`)
- `id`: string (prefix `ka*`, required)
- `dashboardId`: string (ref `kanbanDashboards.id`, required)
- `name`: string (up to 20 chars, required)
- `color`: string hex color
- `textColor`: string hex color
- `order`: number
- `collapsed`: boolean
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 11. Kanban Card (`kanbanCards`)
- `id`: string (prefix `ka*`, required)
- `chatId`: string (contact JID, required)
- `stageId`: string (ref `kanbanStages.id`, required)
- `name`: string
- `phone`: string
- `order`: number
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 12. Canned Response (`quickReplies`)
- `id`: string (prefix `qu*`, required)
- `title`: string (required)
- `shortcut`: string (e.g. `"pricing"`, used with `/pricing`)
- `pinned`: boolean
- `enabled`: boolean
- `messages`: array of Message objects
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 13. Template (`templates`)
- `id`: string (prefix `te*`, required)
- `name`: string (required)
- `messages`: array of Message objects
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 14. Message Bot Workflow (`workflows`)
- `id`: string (prefix `wo*`, required)
- `name`: string (required)
- `enabled`: boolean
- `target`: `"individual"` | `"group"`
- `allGroups`: boolean
- `groupIds`: array of string group JIDs
- `executeOn`: `"keyword"` | `"newChat"` | `"every"`
- `keywords`: array of strings
- `matchTypes`: array of `"contains"` | `"exact"` | `"starts"` | `"ends"`
- `caseSensitive`: boolean
- `days`: array of day numbers (0-6)
- `limitPerChat`: number (0 = unlimited)
- `reply`: `{ mode: 'messages'|'quick', messages: [], quickReplyId: string }`
- `options`: `{ showTyping: boolean, markRead: boolean, replyPrivately: boolean, delayMin: number, delayMax: number }`
- `post`: Action object
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 15. Chatbot Flow (`chatbots`)
- `id`: string (prefix `ch*`, required)
- `name`: string (required)
- `enabled`: boolean
- `trigger`: `{ type: 'keyword'|'all', keywords: [], match: 'contains'|'exact', caseSensitive: boolean }`
- `draft`: Graph object `{ nodes: [], edges: [], settings: {} }`
- `published`: Graph object (frozen copy when deployed)
- `publishedAt`: number timestamp
- `runs`: number
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 16. Chatbot Session (`chatSessions`)
- `id`: string (keyed as `chatId`, required)
- `chatId`: string (required)
- `flowId`: string (ref `chatbots.id`, required)
- `nodeId`: string (current active node in graph)
- `variables`: `{ [varName]: value }`
- `startedAt`: number timestamp
- `updatedAt`: number timestamp
- `expiresAt`: number timestamp
- `waitingForReply`: boolean
- `saveAs`: string
- `format`: string
- `timeoutAt`: number timestamp
- `retries`: number

### 17. Chat Memory (`chatMemory`)
- `id`: string (keyed as `chatId`, required)
- `seen`: boolean
- `firstSeen`: number timestamp
- `optOut`: boolean
- `runs`: `{ [flowId]: number }`

### 18. Campaign / Broadcast (`campaigns`)
- `id`: string (prefix `ca*`, required)
- `kind`: `"broadcast"` | `"schedule"`
- `name`: string (required)
- `targets`: `{ individuals: [], groupIds: [], tabIds: [], stageIds: [], tagIds: [], labelIds: [], allowDuplicates: boolean }`
- `messages`: array of Message objects
- `sendRandom`: boolean
- `delay`: `{ min: number, max: number }`
- `pause`: `{ enabled: boolean, afterContacts: number, seconds: number }`
- `schedule`: `{ mode: 'once'|'repeat', startAt: number, repeat?: string }`
- `startMode`: `"schedule"` | `"immediate"`
- `status`: `"compose"` | `"pending"` | `"running"` | `"paused"` | `"completed"` | `"discarded"` | `"missed"`
- `nextRunAt`: number timestamp
- `runCount`: number
- `run`: `{ total: number, sent: number, failed: number, startedAt: number, completedAt: number, log: [] }`
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 19. WhatsApp Status Story (`statusPosts`)
- `id`: string (prefix `st*`, required)
- `kind`: `"text"` | `"image"` | `"video"`
- `text`: string
- `backgroundColor`: string hex color
- `font`: number
- `blobId`: string (ref `wacrm:blob:*`)
- `caption`: string
- `scheduleAt`: number timestamp
- `status`: `"pending"` | `"published"` | `"failed"`
- `error`: string
- `publishedAt`: number timestamp
- `createdAt`: number timestamp

### 20. Webhook (`webhooks`)
- `id`: string (prefix `we*`, required)
- `name`: string (required)
- `url`: string (required)
- `method`: `"POST"` | `"GET"`
- `secret`: string (HMAC signing secret)
- `enabled`: boolean
- `events`: array of string event IDs
- `headers`: array of `{ name: string, value: string }`
- `lastAt`: number timestamp
- `lastOk`: boolean
- `lastStatus`: number
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 21. Webhook Log (`webhookLog`)
- `id`: string (prefix `wl*`, required)
- `webhookId`: string
- `webhookName`: string
- `event`: string
- `ok`: boolean
- `status`: number
- `error`: string
- `ms`: number (response time in ms)
- `payload`: object
- `createdAt`: number timestamp

### 22. Activity Log (`activityLog`)
- `id`: string (prefix `ac*`, required)
- `type`: string
- `chatId`: string
- `text`: string
- `at`: number timestamp

### 23. Counter (`counters`)
- `id`: string (e.g. `"wf:<workflowId>:<chatId>"`, required)
- `n`: number count
- `createdAt`: number timestamp
- `updatedAt`: number timestamp

### 24. Binary Blobs (`wacrm:blob:<blobId>`)
- `dataUrl`: base64 data URL string (e.g. `data:image/png;base64,...`)
- `name`: string original filename
- `mime`: string MIME type
- `size`: number file size in bytes
