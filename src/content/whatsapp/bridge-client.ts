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
import { OpenMsgBridgeEnvelope } from '@/types/messages';
import { MessageBus } from '@/core/events/message-bus';

/**
 * BridgeWhatsAppClient runs in the Isolated World (Content Script).
 * It communicates with src/injected/whatsapp-bridge.ts (Main World)
 * via secure window.postMessage correlation IDs.
 */
export class BridgeWhatsAppClient implements WhatsAppClient {
  private connectionState: ConnectionState = 'DISCONNECTED';
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<MessageStatusHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private pendingRequests: Map<string, { resolve: (res: unknown) => void; reject: (err: Error) => void }> = new Map();

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    MessageBus.onWindowBridge('OPENMSG_BRIDGE_RESPONSE', (envelope: OpenMsgBridgeEnvelope) => {
      if (!envelope.id) return;
      const pending = this.pendingRequests.get(envelope.id);
      if (pending) {
        this.pendingRequests.delete(envelope.id);
        if (envelope.error) {
          pending.reject(new Error(envelope.error));
        } else {
          pending.resolve(envelope.payload);
        }
      }
    });

    MessageBus.onWindowBridge('OPENMSG_BRIDGE_EVENT', (envelope: OpenMsgBridgeEnvelope) => {
      switch (envelope.action) {
        case 'MESSAGE_RECEIVED': {
          const msg = envelope.payload as WhatsAppMessage;
          if (msg) {
            this.messageHandlers.forEach((h) => h(msg));
          }
          break;
        }

        case 'MESSAGE_STATUS': {
          const update = envelope.payload as MessageStatusUpdate;
          if (update) {
            this.statusHandlers.forEach((h) => h(update));
          }
          break;
        }

        case 'CONNECTION_CHANGED': {
          const state = envelope.payload as ConnectionState;
          if (state) {
            this.connectionState = state;
            this.connectionHandlers.forEach((h) => h(state));
          }
          break;
        }
      }
    });
  }

  private async rpc<TResponse>(action: string, payload?: unknown, timeoutMs = 15000): Promise<TResponse> {
    const id = `rpc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Bridge RPC timeout after ${timeoutMs}ms for action: ${action}`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val as TResponse);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      MessageBus.postToWindow({
        target: 'OPENMSG_BRIDGE_REQUEST',
        id,
        action,
        payload,
      });
    });
  }

  async initialize(): Promise<void> {
    this.connectionState = 'CONNECTING';
    this.notifyConnectionState();

    try {
      const res = await this.rpc<{ ready: boolean; user?: WhatsAppUser }>('INITIALIZE');
      if (res && res.ready) {
        this.connectionState = 'READY';
      } else {
        this.connectionState = 'CONNECTED';
      }
    } catch (err) {
      console.warn('[BridgeWhatsAppClient] Initialization waiting for WhatsApp Web sync:', err);
      this.connectionState = 'CONNECTING';
    }
    this.notifyConnectionState();
  }

  async isReady(): Promise<boolean> {
    try {
      const res = await this.rpc<{ ready: boolean }>('IS_READY', null, 3000);
      return Boolean(res?.ready);
    } catch {
      return false;
    }
  }

  async getConnectionState(): Promise<ConnectionState> {
    return this.connectionState;
  }

  async getCurrentUser(): Promise<WhatsAppUser | null> {
    return this.rpc<WhatsAppUser | null>('GET_CURRENT_USER');
  }

  async getContacts(): Promise<WhatsAppContact[]> {
    return this.rpc<WhatsAppContact[]>('GET_CONTACTS');
  }

  async getChats(options?: { count?: number }): Promise<WhatsAppChat[]> {
    return this.rpc<WhatsAppChat[]>('GET_CHATS', options);
  }

  async getChat(chatId: string): Promise<WhatsAppChat | null> {
    return this.rpc<WhatsAppChat | null>('GET_CHAT', { chatId });
  }

  async getMessages(chatId: string, options?: MessageQuery): Promise<WhatsAppMessage[]> {
    return this.rpc<WhatsAppMessage[]>('GET_MESSAGES', { chatId, ...options });
  }

  async sendText(input: SendTextInput): Promise<SendResult> {
    return this.rpc<SendResult>('SEND_TEXT', input);
  }

  async sendImage(input: SendMediaInput): Promise<SendResult> {
    return this.rpc<SendResult>('SEND_MEDIA', { ...input, type: 'image' });
  }

  async sendVideo(input: SendMediaInput): Promise<SendResult> {
    return this.rpc<SendResult>('SEND_MEDIA', { ...input, type: 'video' });
  }

  async sendAudio(input: SendMediaInput): Promise<SendResult> {
    return this.rpc<SendResult>('SEND_MEDIA', { ...input, type: 'audio' });
  }

  async sendDocument(input: SendDocumentInput): Promise<SendResult> {
    return this.rpc<SendResult>('SEND_DOCUMENT', input);
  }

  async markAsRead(chatId: string): Promise<void> {
    await this.rpc<void>('MARK_AS_READ', { chatId });
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
}
