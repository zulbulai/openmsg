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

/**
 * ExtensionWhatsAppClient runs inside the Chrome Extension context (Sidepanel / Popup).
 * It communicates with the WhatsApp Web content script via chrome.tabs.sendMessage,
 * which relays RPC calls to the WhatsApp Web page context (WPPConnect).
 */
export class ExtensionWhatsAppClient implements WhatsAppClient {
  private connectionState: ConnectionState = 'CONNECTING';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<MessageStatusHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private cachedChats: WhatsAppChat[] = [];
  private currentUserCache: WhatsAppUser | null = null;
  private watchTimer: ReturnType<typeof setInterval> | null = null;
  private targetTabId: number | null = null;

  constructor() {
    this.setupRuntimeListener();
    this.startWatchdog();
  }

  private async getWhatsAppTabId(): Promise<number | null> {
    if (typeof chrome === 'undefined' || !chrome.tabs) return null;

    try {
      // First check if cached target tab is still open
      if (this.targetTabId !== null) {
        try {
          const tab = await chrome.tabs.get(this.targetTabId);
          if (tab && tab.url && tab.url.includes('web.whatsapp.com')) {
            return this.targetTabId;
          }
        } catch {
          this.targetTabId = null;
        }
      }

      // Query active or any tab with WhatsApp Web
      const tabs = await chrome.tabs.query({ url: '*://web.whatsapp.com/*' });
      if (tabs.length > 0 && tabs[0].id) {
        this.targetTabId = tabs[0].id;
        return tabs[0].id;
      }
    } catch (err) {
      console.warn('[ExtensionWhatsAppClient] Failed to query tabs:', err);
    }
    return null;
  }

  private setupRuntimeListener(): void {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) return;

    chrome.runtime.onMessage.addListener((msg: any) => {
      if (!msg || msg.type !== 'OPENMSG_BRIDGE_EVENT') return;

      const { event, data } = msg;
      this.handleBridgeEvent(event, data);
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
            console.error('[ExtensionWhatsAppClient] Error in message handler:', e);
          }
        });
        break;
      }

      case 'conn.logout': {
        this.setConnectionState('LOGIN_REQUIRED');
        break;
      }
    }
  }

  private startWatchdog(): void {
    this.watchTimer = setInterval(async () => {
      try {
        const ready = await this.isReady();
        this.setConnectionState(ready ? 'READY' : 'CONNECTING');
      } catch {
        this.setConnectionState('DISCONNECTED');
      }
    }, 4000);
  }

  private setConnectionState(newState: ConnectionState): void {
    if (this.connectionState === newState) return;
    this.connectionState = newState;
    this.notifyConnectionState();
  }

  private notifyConnectionState() {
    this.connectionHandlers.forEach((h) => {
      try {
        h(this.connectionState);
      } catch (e) {
        console.error('[ExtensionWhatsAppClient] Connection handler error:', e);
      }
    });
  }

  public async rpc<TResult>(method: string, args: unknown[] = [], timeoutMs = 25000): Promise<TResult> {
    const tabId = await this.getWhatsAppTabId();
    if (!tabId) {
      throw new Error('WhatsApp Web is not open. Please open WhatsApp Web tab.');
    }

    const id = `rpc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`RPC timeout (${timeoutMs}ms) for ${method}`));
      }, timeoutMs);

      chrome.tabs.sendMessage(
        tabId,
        {
          type: 'OPENMSG_RPC_FORWARD',
          id,
          method,
          args,
        },
        (response: any) => {
          clearTimeout(timer);
          const lastErr = chrome.runtime.lastError;
          if (lastErr) {
            reject(new Error(lastErr.message || `Failed to communicate with WhatsApp Web tab`));
            return;
          }

          if (!response) {
            reject(new Error(`No response from WhatsApp Web for ${method}`));
            return;
          }

          if (response.ok) {
            resolve(response.result as TResult);
          } else {
            reject(new Error(response.error || `Error from WhatsApp Web for ${method}`));
          }
        }
      );
    });
  }

  async initialize(): Promise<void> {
    this.setConnectionState('CONNECTING');
    try {
      const ready = await this.isReady();
      this.setConnectionState(ready ? 'READY' : 'CONNECTING');
    } catch {
      this.setConnectionState('CONNECTING');
    }
  }

  async isReady(): Promise<boolean> {
    try {
      const status = await this.rpc<any>('status', [], 4000);
      if (status && (status.ready || status.fullReady || status.mainReady)) {
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }

  async getConnectionState(): Promise<ConnectionState> {
    return this.connectionState;
  }

  async getCurrentUser(): Promise<WhatsAppUser | null> {
    if (this.currentUserCache) return this.currentUserCache;

    try {
      const status = await this.rpc<any>('status', [], 5000);
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
      // Ignore
    }

    return null;
  }

  async getChats(options?: { count?: number }): Promise<WhatsAppChat[]> {
    try {
      const rawList = await this.rpc<any[]>('chat.list', [options || {}], 15000);
      if (Array.isArray(rawList)) {
        const mapped: WhatsAppChat[] = rawList.map((c) => this.mapToWhatsAppChat(c));
        this.cachedChats = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn('[ExtensionWhatsAppClient] chat.list failed:', err);
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

    try {
      const rawContacts = await this.rpc<any[]>('contact.list', [], 15000);
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
      console.warn('[ExtensionWhatsAppClient] contact.list failed:', err);
    }

    // Supplement with cached chats
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
      const rawMessages = await this.rpc<any[]>('chat.messages', [chatId, { count }], 15000);
      if (Array.isArray(rawMessages)) {
        return rawMessages.map((m) => this.mapToWhatsAppMessage(m, chatId));
      }
    } catch (err) {
      console.warn('[ExtensionWhatsAppClient] chat.messages failed for chat:', chatId, err);
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
      console.error('[ExtensionWhatsAppClient] sendText failed:', err);
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
      console.error('[ExtensionWhatsAppClient] send.file failed:', err);
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
