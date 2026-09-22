# WhatsApp Integration Architecture

## 1. The `WhatsAppClient` Abstraction

The central architectural constraint of **OpenMsg** is that the CRM, UI, Workflow Engine, and Automation subsystems **must never directly access WhatsApp Web internal variables or DOM elements**.

All capabilities are mediated through the clean, typed `WhatsAppClient` contract:

```ts
export interface WhatsAppUser {
  wid: string;
  name: string;
  phone: string;
  isBusiness: boolean;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  isGroup: boolean;
  isMyContact: boolean;
  profilePicUrl?: string;
}

export interface WhatsAppChat {
  id: string;
  name: string;
  unreadCount: number;
  isGroup: boolean;
  pinned: boolean;
  archived: boolean;
  lastMessage?: WhatsAppMessage;
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  fromMe: boolean;
  sender: string;
  body: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'poll' | 'list' | 'buttons';
  ack: number; // 0 = pending, 1 = sent, 2 = received, 3 = read
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  timestamp: number;
  error?: string;
}

export interface WhatsAppClient {
  /** Checks if WhatsApp Web has completed authentication and chat sync */
  isReady(): Promise<boolean>;

  /** Retrieves the authenticated user profile */
  getCurrentUser(): Promise<WhatsAppUser | null>;

  /** Retrieves all contacts synced with the web client */
  getContacts(): Promise<WhatsAppContact[]>;

  /** Retrieves active chat threads with pagination */
  getChats(options?: { count?: number }): Promise<WhatsAppChat[]>;

  /** Sends a text message with simulated typing and anti-ban delay */
  sendText(input: { chatId: string; text: string; quotedId?: string }): Promise<SendResult>;

  /** Sends an image or video with optional caption */
  sendMedia(input: { chatId: string; mediaDataUrl: string; filename?: string; caption?: string }): Promise<SendResult>;

  /** Sends a document (e.g. PDF, CSV) */
  sendDocument(input: { chatId: string; fileDataUrl: string; filename: string; caption?: string }): Promise<SendResult>;

  /** Marks a conversation as read */
  markAsRead(chatId: string): Promise<void>;

  /** Subscribes to inbound messages in real time */
  onMessage(handler: (message: WhatsAppMessage) => void): () => void;

  /** Subscribes to connection/readiness state changes */
  onConnectionChange(handler: (ready: boolean) => void): () => void;
}
```

---

## 2. Dual-World Bridge Mechanism

Because WhatsApp Web runs in a hostile JavaScript sandbox with Content Security Policy (CSP) headers, extension communication requires a two-step handshake:

```text
+-------------------------------------------------------------+
| Browser Tab: https://web.whatsapp.com                      |
|                                                             |
|  +-------------------------+      +-----------------------+ |
|  | Isolated World          |      | Main World            | |
|  | (Content Script)        |      | (Injected Script)     | |
|  |                         |      |                       | |
|  | WhatsAppBridgeAdapter   |      | InjectedBridge        | |
|  | (implements Client)     |      | (window.WPP Hook)     | |
|  |            ▲            |      |           ▲           | |
|  +------------|------------+      +-----------|-----------+ |
|               |  window.postMessage (RPC)     |             |
|               +-------------------------------+             |
+-------------------------------------------------------------+
```

1. **Injected Bridge (`src/injected/whatsapp-bridge.ts`)**:
   - Injected into `window` context (Main World) using Manifest V3 `world: "MAIN"` content script configuration.
   - Accesses internal Webpack module exports or established wrappers (`window.WPP`) to call native WhatsApp messaging functions.
   - Listens for messages with target `OPENMSG_BRIDGE_REQUEST` via `window.addEventListener('message')`.
   - Dispatches results and asynchronous events via `window.postMessage({ target: 'OPENMSG_BRIDGE_EVENT', ... })`.
2. **Content Script Adapter (`src/content/whatsapp/bridge-client.ts`)**:
   - Runs in the Isolated World.
   - Implements `WhatsAppClient`.
   - Converts method calls into serialized request promises with correlation IDs and timeout safeguards.
   - Relays events to the Background Service Worker and Side Panel via `chrome.runtime.sendMessage`.

---

## 3. Mock WhatsApp Client for Zero-Dependency Development

To allow seamless development, automated unit testing, and UI preview without requiring a live WhatsApp account, OpenMsg includes a fully functional **MockWhatsAppClient** (`src/content/whatsapp/mock-client.ts`):

- **Simulated Chats**: Pre-seeded with realistic sample conversations, contacts, group chats, and unread badges.
- **Simulated Inbound Traffic**: Emits realistic incoming messages with randomized replies and delay simulation.
- **Outbound Message Echo**: Simulates message delivery states (`sent` -> `received` -> `read` ACK transitions).
- **Zero WhatsApp Web Dependency**: Can run inside unit tests (Vitest) or inside the Side Panel in standalone development mode.

---

## 4. Event-Driven vs. Polling Philosophy

- **No Aggressive Polling**: Unlike naive extensions that run `setInterval(..., 1000)` to query the DOM, OpenMsg relies on **push events** from the injected bridge (`onMessage`, `onAck`, `onStateChange`).
- **Heartbeat Safety**: A low-frequency liveness check (every 30 seconds) monitors bridge responsiveness without degrading browser performance.
- **Anti-Ban Architecture**:
  - The `sendText` and `sendMedia` pipelines enforce randomized human-like delays (3,000ms–8,000ms).
  - Explicit rate limits (default cap of 250 automated messages per hour) protect user accounts from automated spam flags.
