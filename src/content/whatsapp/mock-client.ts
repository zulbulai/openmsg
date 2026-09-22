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
  MessageStatusUpdate,
} from '@/types/whatsapp';

export class MockWhatsAppClient implements WhatsAppClient {
  private connectionState: ConnectionState = 'READY';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<MessageStatusHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();

  private user: WhatsAppUser = {
    wid: '15550001122@c.us',
    name: 'OpenMsg Demo Agent',
    phone: '+1 555 000 1122',
    isBusiness: true,
  };

  private contacts: WhatsAppContact[] = [
    {
      id: '15551234567@c.us',
      name: 'John Doe',
      phone: '+1 555 123 4567',
      isGroup: false,
      isMyContact: true,
    },
    {
      id: '15559876543@c.us',
      name: 'Sarah Connor',
      phone: '+1 555 987 6543',
      isGroup: false,
      isMyContact: true,
    },
    {
      id: '442079460912@c.us',
      name: 'Alex Vance',
      phone: '+44 20 7946 0912',
      isGroup: false,
      isMyContact: false,
    },
    {
      id: '120363024812345@g.us',
      name: 'Acme Enterprise VIPs',
      phone: '',
      isGroup: true,
      isMyContact: false,
    },
  ];

  private chats: Map<string, WhatsAppChat> = new Map();
  private messages: Map<string, WhatsAppMessage[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  async initialize(): Promise<void> {
    this.connectionState = 'READY';
    this.notifyConnectionState();
  }

  private seedInitialData() {
    const now = Date.now();
    for (const c of this.contacts) {
      const msg: WhatsAppMessage = {
        id: `mock_msg_${c.id}_init`,
        chatId: c.id,
        fromMe: false,
        sender: c.id,
        body: c.isGroup
          ? 'Welcome to the Acme VIP group! Let us know if you need any assistance.'
          : `Hello! I would like to inquire about your product pricing and scheduling.`,
        timestamp: now - 3600000,
        type: 'text',
        ack: 3,
      };

      this.messages.set(c.id, [msg]);
      this.chats.set(c.id, {
        id: c.id,
        name: c.name,
        unreadCount: 1,
        isGroup: c.isGroup,
        pinned: c.isGroup,
        archived: false,
        lastMessage: msg,
      });
    }
  }

  async isReady(): Promise<boolean> {
    return this.connectionState === 'READY';
  }

  async getConnectionState(): Promise<ConnectionState> {
    return this.connectionState;
  }

  async getCurrentUser(): Promise<WhatsAppUser | null> {
    return this.user;
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    return [...this.contacts];
  }

  async getChats(options?: { count?: number }): Promise<WhatsAppChat[]> {
    const list = Array.from(this.chats.values());
    if (options?.count) {
      return list.slice(0, options.count);
    }
    return list;
  }

  async getChat(chatId: string): Promise<WhatsAppChat | null> {
    return this.chats.get(chatId) || null;
  }

  async getMessages(chatId: string, options?: MessageQuery): Promise<WhatsAppMessage[]> {
    const thread = this.messages.get(chatId) || [];
    if (options?.count) {
      return thread.slice(-options.count);
    }
    return [...thread];
  }

  async sendText(input: SendTextInput): Promise<SendResult> {
    const timestamp = Date.now();
    const msgId = `mock_out_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    const outMsg: WhatsAppMessage = {
      id: msgId,
      chatId: input.chatId,
      fromMe: true,
      sender: this.user.wid,
      body: input.text,
      timestamp,
      type: 'text',
      ack: 1, // Sent
      quotedMessageId: input.quotedId,
    };

    const thread = this.messages.get(input.chatId) || [];
    thread.push(outMsg);
    this.messages.set(input.chatId, thread);

    const chat = this.chats.get(input.chatId);
    if (chat) {
      chat.lastMessage = outMsg;
      this.chats.set(input.chatId, chat);
    }

    // Simulate ACK transitions (delivered -> read)
    setTimeout(() => {
      outMsg.ack = 2; // delivered
      this.notifyStatusUpdate({
        messageId: msgId,
        chatId: input.chatId,
        status: 'delivered',
        timestamp: Date.now(),
      });
    }, 800);

    setTimeout(() => {
      outMsg.ack = 3; // read
      this.notifyStatusUpdate({
        messageId: msgId,
        chatId: input.chatId,
        status: 'read',
        timestamp: Date.now(),
      });
      this.simulateIncomingReply(input.chatId, input.text);
    }, 1800);

    return {
      success: true,
      messageId: msgId,
      timestamp,
    };
  }

  async sendImage(input: SendMediaInput): Promise<SendResult> {
    return this.sendMediaMessage(input, 'image');
  }

  async sendVideo(input: SendMediaInput): Promise<SendResult> {
    return this.sendMediaMessage(input, 'video');
  }

  async sendAudio(input: SendMediaInput): Promise<SendResult> {
    return this.sendMediaMessage(input, 'audio');
  }

  async sendDocument(input: SendDocumentInput): Promise<SendResult> {
    return this.sendMediaMessage(
      {
        chatId: input.chatId,
        mediaDataUrl: input.fileDataUrl,
        filename: input.filename,
        caption: input.caption,
      },
      'document'
    );
  }

  private async sendMediaMessage(
    input: SendMediaInput,
    kind: WhatsAppMessage['type']
  ): Promise<SendResult> {
    const timestamp = Date.now();
    const msgId = `mock_media_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    const outMsg: WhatsAppMessage = {
      id: msgId,
      chatId: input.chatId,
      fromMe: true,
      sender: this.user.wid,
      body: input.caption || `[${kind.toUpperCase()}: ${input.filename || 'attachment'}]`,
      mediaUrl: input.mediaDataUrl,
      caption: input.caption,
      filename: input.filename,
      timestamp,
      type: kind,
      ack: 1,
    };

    const thread = this.messages.get(input.chatId) || [];
    thread.push(outMsg);
    this.messages.set(input.chatId, thread);

    const chat = this.chats.get(input.chatId);
    if (chat) {
      chat.lastMessage = outMsg;
      this.chats.set(input.chatId, chat);
    }

    return {
      success: true,
      messageId: msgId,
      timestamp,
    };
  }

  async markAsRead(chatId: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.unreadCount = 0;
      this.chats.set(chatId, chat);
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
    this.connectionHandlers.forEach((h) => h(this.connectionState));
  }

  private notifyStatusUpdate(update: MessageStatusUpdate) {
    this.statusHandlers.forEach((h) => h(update));
  }

  /**
   * Helper to simulate incoming messages for testing and automations
   */
  simulateIncomingMessage(chatId: string, text: string): WhatsAppMessage {
    const timestamp = Date.now();
    const msgId = `mock_in_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    const incoming: WhatsAppMessage = {
      id: msgId,
      chatId,
      fromMe: false,
      sender: chatId,
      body: text,
      timestamp,
      type: 'text',
      ack: 3,
    };

    const thread = this.messages.get(chatId) || [];
    thread.push(incoming);
    this.messages.set(chatId, thread);

    const chat = this.chats.get(chatId);
    if (chat) {
      chat.unreadCount += 1;
      chat.lastMessage = incoming;
      this.chats.set(chatId, chat);
    }

    // Broadcast to listeners
    this.messageHandlers.forEach((h) => {
      try {
        h(incoming);
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    });

    return incoming;
  }

  private simulateIncomingReply(chatId: string, sentText: string) {
    let reply = `Thanks for your message! Our team will get back to you. (Echo: "${sentText.substring(0, 30)}")`;
    if (sentText.toLowerCase().includes('price') || sentText.toLowerCase().includes('pricing')) {
      reply = 'Our pricing packages start at $0 (100% Free & Open-Source OpenMsg!). How can we help you get started?';
    } else if (sentText.toLowerCase().includes('demo')) {
      reply = 'This is a live mock demonstration of OpenMsg inside your browser!';
    }
    this.simulateIncomingMessage(chatId, reply);
  }
}
