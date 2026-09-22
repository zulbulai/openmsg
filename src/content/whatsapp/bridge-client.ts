import {
  WhatsAppClient,
  WhatsAppUser,
  WhatsAppContact,
  WhatsAppChat,
  WhatsAppMessage,
  SendTextInput,
  SendMediaInput,
  SendDocumentInput,
  SendResult,
  MessageHandler,
  MessageStatusHandler,
  ConnectionHandler,
  ConnectionState,
  MessageQuery,
  Unsubscribe,
} from '@/types/whatsapp';

interface WacrmRpcResponse {
  source: 'wacrm-main';
  id?: string;
  ok?: boolean;
  result?: any;
  error?: string;
  event?: string;
  data?: any;
}

interface WacrmStatus {
  injected?: boolean;
  ready?: boolean;
  fullReady?: boolean;
  authenticated?: boolean;
  mainReady?: boolean;
  me?: string;
  isBusiness?: boolean;
  version?: string;
}

/**
 * BridgeWhatsAppClient runs in the Isolated World (Content Script).
 * It communicates with public/src/bridge/main-bridge.js (Main World)
 * via the standard wacrm-iso <-> wacrm-main window.postMessage protocol.
 */
export class BridgeWhatsAppClient implements WhatsAppClient {
  private connectionState: ConnectionState = 'CONNECTING';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<MessageStatusHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private pendingRequests: Map<
    string,
    { resolve: (res: unknown) => void; reject: (err: Error) => void; timer: ReturnType<typeof setTimeout> }
  > = new Map();

  private cachedChats: WhatsAppChat[] = [];
  private currentUserCache: WhatsAppUser | null = null;
  private watchTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupListeners();
    this.startWatchdog();
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', (event: MessageEvent<WacrmRpcResponse>) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.source !== 'wacrm-main') return;

      // 1. Handle asynchronous Bridge Events
      if (data.event) {
        this.handleBridgeEvent(data.event, data.data);
        return;
      }

      // 2. Handle RPC Response
      if (data.id && this.pendingRequests.has(data.id)) {
        const entry = this.pendingRequests.get(data.id)!;
        this.pendingRequests.delete(data.id);
        clearTimeout(entry.timer);

        if (data.ok) {
          entry.resolve(data.result);
        } else {
          entry.reject(new Error(data.error || 'WhatsApp Bridge error'));
        }
      }
    });
  }

  private handleBridgeEvent(event: string, data: any): void {
    switch (event) {
      case 'ready': {
        const isReady = Boolean(data?.ready || data?.status?.ready || data?.status?.fullReady);
        this.setConnectionState(isReady ? 'READY' : 'CONNECTING');
        break;
      }

      case 'chat.new_message': {
        if (!data) break;
        const msg = this.mapToWhatsAppMessage(data);
        this.messageHandlers.forEach((h) => {
          try {
            h(msg);
          } catch (e) {
            console.error('[BridgeWhatsAppClient] Error in message handler:', e);
          }
        });
        break;
      }

      case 'chat.msg_revoke': {
        break;
      }

      case 'conn.logout': {
        this.setConnectionState('LOGIN_REQUIRED');
        break;
      }
    }
  }

  private startWatchdog(): void {
    // Periodically verify connection status with main bridge
    this.watchTimer = setInterval(async () => {
      try {
        const isDomReady = Boolean(document.getElementById('pane-side') || document.querySelector('[data-testid="chat-list"]'));
        if (this.connectionState !== 'READY' && isDomReady) {
          const ready = await this.isReady();
          if (ready) {
            this.setConnectionState('READY');
          }
        }
      } catch {
        // Suppress background poll errors
      }
    }, 2500);
  }

  private setConnectionState(newState: ConnectionState): void {
    if (this.connectionState === newState) return;
    this.connectionState = newState;
    this.notifyConnectionState();
  }

  public async rpc<TResult>(method: string, args: unknown[] = [], timeoutMs = 25000): Promise<TResult> {
    if (typeof window === 'undefined') {
      throw new Error('Window context not available');
    }

    const id = `rpc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`WhatsApp Bridge RPC timeout after ${timeoutMs}ms for method: ${method}`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (val) => resolve(val as TResult),
        reject,
        timer,
      });

      const origin = window.location.origin || '*';
      window.postMessage(
        {
          source: 'wacrm-iso',
          id,
          method,
          args,
        },
        origin
      );
    });
  }

  async initialize(): Promise<void> {
    this.setConnectionState('CONNECTING');

    try {
      const status = await this.rpc<WacrmStatus>('status', [], 5000);
      if (status && (status.ready || status.fullReady || status.mainReady)) {
        this.setConnectionState('READY');
      } else {
        // Check DOM fallback
        const pane = document.getElementById('pane-side');
        if (pane) {
          this.setConnectionState('READY');
        } else {
          this.setConnectionState('CONNECTING');
        }
      }
    } catch {
      const pane = document.getElementById('pane-side');
      if (pane) {
        this.setConnectionState('READY');
      } else {
        this.setConnectionState('CONNECTING');
      }
    }
  }

  async isReady(): Promise<boolean> {
    try {
      const status = await this.rpc<WacrmStatus>('status', [], 3000);
      if (status && (status.ready || status.fullReady || status.mainReady)) {
        return true;
      }
    } catch {
      // Ignore
    }

    // DOM fallback
    return Boolean(document.getElementById('pane-side') || document.querySelector('[data-testid="chat-list"]'));
  }

  async getConnectionState(): Promise<ConnectionState> {
    return this.connectionState;
  }

  async getCurrentUser(): Promise<WhatsAppUser | null> {
    if (this.currentUserCache) return this.currentUserCache;

    try {
      const status = await this.rpc<WacrmStatus>('status', [], 5000);
      if (status && status.me) {
        const rawPhone = String(status.me).replace(/@.*$/, '').replace(/\D+/g, '');
        this.currentUserCache = {
          wid: status.me,
          id: status.me,
          name: 'Me',
          phone: rawPhone,
          isBusiness: Boolean(status.isBusiness),
        };
        return this.currentUserCache;
      }
    } catch {
      // Fallback
    }

    try {
      const lastWid = localStorage.getItem('last-wid-md') || localStorage.getItem('last-wid');
      if (lastWid) {
        const cleanWid = lastWid.replace(/['"]+/g, '');
        const phone = cleanWid.replace(/@.*$/, '').replace(/\D+/g, '');
        this.currentUserCache = {
          wid: cleanWid,
          id: cleanWid,
          name: 'Me',
          phone,
          isBusiness: false,
        };
        return this.currentUserCache;
      }
    } catch {
      // Ignore
    }

    return null;
  }

  async getChats(options?: { count?: number }): Promise<WhatsAppChat[]> {
    try {
      const rawList = await this.rpc<any[]>('chat.list', [options || {}]);
      if (Array.isArray(rawList)) {
        const mapped: WhatsAppChat[] = rawList.map((c) => this.mapToWhatsAppChat(c));
        this.cachedChats = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn('[BridgeWhatsAppClient] chat.list failed:', err);
    }

    return this.cachedChats;
  }

  async getChat(chatId: string): Promise<WhatsAppChat | null> {
    const cached = this.cachedChats.find((c) => c.id === chatId);
    if (cached) return cached;

    try {
      const raw = await this.rpc<any>('chat.get', [chatId]);
      if (raw) {
        return this.mapToWhatsAppChat(raw);
      }
    } catch {
      // Ignore
    }
    return null;
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    const contactMap = new Map<string, WhatsAppContact>();

    // 1. Fetch from contact.list
    try {
      const rawContacts = await this.rpc<any[]>('contact.list', []);
      if (Array.isArray(rawContacts)) {
        for (const c of rawContacts) {
          if (!c.id) continue;
          const phone = c.phone || String(c.id).replace(/@.*$/, '').replace(/\D+/g, '');
          contactMap.set(c.id, {
            id: c.id,
            name: c.name || phone || c.id.split('@')[0],
            phone,
            isGroup: Boolean(c.id.endsWith('@g.us')),
            isMyContact: Boolean(c.isMyContact),
          });
        }
      }
    } catch (err) {
      console.warn('[BridgeWhatsAppClient] contact.list failed:', err);
    }

    // 2. Supplement with all active chats to guarantee zero missed contacts
    if (this.cachedChats.length === 0) {
      try {
        await this.getChats();
      } catch {}
    }

    for (const chat of this.cachedChats) {
      if (!contactMap.has(chat.id)) {
        const phone = String(chat.id).replace(/@.*$/, '').replace(/\D+/g, '');
        contactMap.set(chat.id, {
          id: chat.id,
          name: chat.name || phone || chat.id.split('@')[0],
          phone,
          isGroup: chat.isGroup,
          isMyContact: !chat.isGroup,
        });
      }
    }

    return Array.from(contactMap.values());
  }

  async getMessages(chatId: string, options?: MessageQuery): Promise<WhatsAppMessage[]> {
    try {
      const count = options?.count || 50;
      const rawMessages = await this.rpc<any[]>('chat.messages', [chatId, { count }]);
      if (Array.isArray(rawMessages)) {
        return rawMessages.map((m) => this.mapToWhatsAppMessage(m, chatId));
      }
    } catch (err) {
      console.warn('[BridgeWhatsAppClient] chat.messages failed for chat:', chatId, err);
    }
    return [];
  }

  async sendText(input: SendTextInput): Promise<SendResult> {
    try {
      const res = await this.rpc<{ id?: string; ack?: number }>('send.text', [
        input.chatId,
        input.text,
        { createChat: true, waitForAck: false },
      ]);
      return {
        success: true,
        messageId: res?.id || `msg_${Date.now()}`,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      console.error('[BridgeWhatsAppClient] sendText failed:', err);
      return {
        success: false,
        timestamp: Date.now(),
        error: err.message || 'Failed to send text message',
      };
    }
  }

  async sendImage(input: SendMediaInput): Promise<SendResult> {
    return this.sendFile(input.chatId, input.mediaDataUrl || input.media || '', input.caption, input.filename);
  }

  async sendVideo(input: SendMediaInput): Promise<SendResult> {
    return this.sendFile(input.chatId, input.mediaDataUrl || input.media || '', input.caption, input.filename);
  }

  async sendAudio(input: SendMediaInput): Promise<SendResult> {
    return this.sendFile(input.chatId, input.mediaDataUrl || input.media || '', input.caption, input.filename);
  }

  async sendDocument(input: SendDocumentInput): Promise<SendResult> {
    return this.sendFile(input.chatId, input.fileDataUrl || input.media || '', input.caption, input.filename);
  }

  private async sendFile(chatId: string, dataUrl: string, caption?: string, filename?: string): Promise<SendResult> {
    try {
      const res = await this.rpc<{ id?: string; ack?: number }>('send.file', [
        chatId,
        dataUrl,
        { createChat: true, caption: caption || '', filename: filename || 'file' },
      ]);
      return {
        success: true,
        messageId: res?.id || `msg_${Date.now()}`,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      console.error('[BridgeWhatsAppClient] send.file failed:', err);
      return {
        success: false,
        timestamp: Date.now(),
        error: err.message || 'Failed to send file',
      };
    }
  }

  async markAsRead(chatId: string): Promise<void> {
    try {
      await this.rpc<boolean>('chat.markRead', [chatId]);
    } catch {
      // Ignore
    }
  }

  onMessage(handler: MessageHandler): Unsubscribe {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onMessageStatus(handler: MessageStatusHandler): Unsubscribe {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): Unsubscribe {
    this.connectionHandlers.add(handler);
    handler(this.connectionState);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnectionState() {
    this.connectionHandlers.forEach((h) => {
      try {
        h(this.connectionState);
      } catch (e) {
        console.error('[BridgeWhatsAppClient] Connection handler error:', e);
      }
    });
  }

  private mapToWhatsAppChat(c: any): WhatsAppChat {
    const id = String(c.id || '');
    const phone = c.phone || id.replace(/@.*$/, '').replace(/\D+/g, '');
    const name = c.name || phone || (id ? id.split('@')[0] : 'Unknown');

    let lastMessage: WhatsAppMessage | undefined = undefined;
    if (c.lastBody || c.lastType) {
      const t = c.t ? (c.t > 1e11 ? c.t : c.t * 1000) : Date.now();
      lastMessage = {
        id: `last_${id}`,
        chatId: id,
        fromMe: Boolean(c.lastFromMe),
        sender: c.lastFromMe ? 'Me' : name,
        body: c.lastBody || (c.lastType ? `[${c.lastType}]` : ''),
        timestamp: t,
        type: (c.lastType as any) || 'chat',
        ack: 2,
        status: 'delivered',
      };
    }

    return {
      id,
      name,
      unreadCount: Number(c.unread || 0),
      isGroup: Boolean(c.isGroup || id.endsWith('@g.us')),
      pinned: Boolean(c.pinned),
      archived: Boolean(c.archived),
      lastMessage,
    };
  }

  private mapToWhatsAppMessage(m: any, defaultChatId = ''): WhatsAppMessage {
    const id = String(m.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const chatId = m.chatId || defaultChatId || m.from || '';
    const fromMe = Boolean(m.fromMe);
    const ack = typeof m.ack === 'number' ? m.ack : 0;
    const status = ack === 3 ? 'read' : ack === 2 ? 'delivered' : ack === 1 ? 'sent' : 'pending';
    const timestamp = m.t ? (m.t > 1e11 ? m.t : m.t * 1000) : Date.now();

    return {
      id,
      chatId,
      fromMe,
      sender: m.sender || m.from || (fromMe ? 'Me' : (m.name || 'Unknown')),
      body: m.body || '',
      timestamp,
      type: (m.type as any) || 'chat',
      ack,
      status,
      filename: m.filename,
      caption: m.body,
    };
  }

  destroy(): void {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
  }
}
