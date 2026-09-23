# OpenMsg — Storage Architecture & Persistence Documentation

This document describes how data is stored, cached, synchronized, and backed up in OpenMsg.

---

## 1. Storage Backend Architecture

OpenMsg persists all CRM, workflow, and configuration data locally in the browser.

```text
┌────────────────────────────────────────────────────────┐
│ UI Panels & Core Engines (Synchronous Access)           │
│  app.store.all('contacts')                             │
│  app.store.get('notes', id)                            │
│  app.store.put('contacts', entity)                     │
└───────────────────────────┬────────────────────────────┘
                            │ In-Memory Map Lookups (0ms latency)
┌───────────────────────────▼────────────────────────────┐
│ IN-MEMORY CACHE (src/core/store.js: createStore)       │
│  Map<collectionName, Map<id, entity>>                  │
└─────────────┬────────────────────────────▲─────────────┘
              │ Debounced (100ms)          │ chrome.storage
              │ batch write                │ .onChanged
┌─────────────▼────────────────────────────┴─────────────┐
│ STORAGE DRIVER (src/core/store.js: chromeBackend)      │
│  chrome.storage.local                                  │
│  (Permission: "unlimitedStorage")                      │
└────────────────────────────────────────────────────────┘
```

### Why This Design?
1. **Synchronous Speed**: Rendering complex UI like a Kanban board with hundreds of contacts requires synchronous access. In-memory Maps guarantee zero UI blocking.
2. **Reduced Storage IO**: Debouncing writes (100ms default) consolidates rapid sequential mutations into a single `chrome.storage.local.set` call.
3. **Cross-Tab Synchronization**: Any modification saved to `chrome.storage.local` by the WhatsApp Web tab triggers `chrome.storage.onChanged` in standalone workspace tabs (`pages/workspace.html`), keeping all open tabs in sync without custom socket servers.

---

## 2. Collection Layout

Collections are persisted under key names prefixed with `wacrm:col:<collection_name>`.

```json
{
  "wacrm:col:contacts": {
    "__w": "w_m19k2a4x",
    "items": {
      "1234567890@c.us": {
        "id": "1234567890@c.us",
        "chatId": "1234567890@c.us",
        "fullName": "Jane Doe",
        "phone": "1234567890",
        "tagIds": ["ta_vip"],
        "attributes": {},
        "createdAt": 1727000000000,
        "updatedAt": 1727000000000
      }
    }
  }
}
```

The `__w` field stores the unique writer ID (`uid('w')`) of the tab that wrote the batch. When `chrome.storage.onChanged` fires, tabs ignore changes originating from their own `__w` to prevent redundant cache invalidation loops.

---

## 3. Binary Blob Storage

Large binary attachments (images, voice recordings, PDFs) are NOT stored directly in collection JSON structures. Storing base64 media inside collections would degrade query performance.

Instead, blobs are stored under dedicated keys:
- **Key**: `wacrm:blob:<blobId>`
- **Schema**:
  ```json
  {
    "dataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "name": "invoice_1042.pdf",
    "mime": "application/pdf",
    "size": 41295
  }
  ```
- **Referencing**: Campaigns and messages reference blobs by their ID (`"b_..."`), resolving them on-demand via `app.store.getBlob(blobId)`.

---

## 4. Backup, Restore, Export & Import

OpenMsg includes full JSON backup and restore capabilities:

### Export (`app.store.exportAll(includeBlobs)`)
Produces a structured JSON archive:
```json
{
  "app": "WACRM",
  "version": 1,
  "exportedAt": 1727000000000,
  "collections": {
    "settings": [ ... ],
    "contacts": [ ... ],
    "kanbanStages": [ ... ],
    "kanbanCards": [ ... ]
  },
  "blobs": {
    "b_12345": { "dataUrl": "...", "name": "...", "mime": "...", "size": 123 }
  }
}
```

### Import Modes (`app.store.importAll(backup, mode)`)
1. **Merge Mode (`mode = 'merge'`)**:
   - Preserves existing data.
   - Overwrites entities sharing the same `id`.
   - Appends new records.
2. **Replace Mode (`mode = 'replace'`)**:
   - Clears existing collections and replaces them entirely with imported records.
   - Settings are only replaced if explicitly chosen.

---

## 5. Data Integrity & Safety Guidelines

1. **Unload Flush**: On window `beforeunload`, `src/content/main.js` calls `app.store.flush()` to ensure any pending debounced writes are committed before the page closes.
2. **Automatic Defaults**: On first launch, `app.crm.ensureDefaults()` seeds initial Kanban stages (New lead, Contacted, Negotiation, Won) and default tags (Lead, Customer, VIP, Follow up).
3. **No Destructive Cascades Without Confirmation**:
   - Deleting a Kanban dashboard moves or requires deleting stages first.
   - Deleting a tag cleanly removes the tag ID from all contact `tagIds` arrays without corrupting contacts.
