/**
 * WhatsApp Core Types & Client Contract
 */

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'READY' | 'ERROR';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppUser {
  wid: string;
  id?: string;
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

export type WhatsAppMessageKind =
  | 'text'
  | 'chat'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'poll'
  | 'list'
  | 'buttons';

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  fromMe: boolean;
  sender: string;
  body: string;
  timestamp: number;
  type: WhatsAppMessageKind;
  ack: number; // 0 = pending, 1 = sent, 2 = received, 3 = read
  status?: MessageStatus;
  mediaUrl?: string;
  caption?: string;
  filename?: string;
  quotedMessageId?: string;
}

export interface MessageQuery {
  count?: number;
  before?: string;
}

export interface SendTextInput {
  chatId: string;
  text: string;
  quotedId?: string;
}

export interface SendMediaInput {
  chatId: string;
  mediaDataUrl?: string;
  media?: string;
  filename?: string;
  caption?: string;
}

export interface SendDocumentInput {
  chatId: string;
  fileDataUrl?: string;
  media?: string;
  filename: string;
  caption?: string;
  mimetype?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  timestamp: number;
  error?: string;
}

export interface MessageStatusUpdate {
  messageId: string;
  chatId: string;
  status: MessageStatus;
  timestamp: number;
}

export type MessageHandler = (message: WhatsAppMessage) => void;
export type MessageStatusHandler = (update: MessageStatusUpdate) => void;
export type ConnectionHandler = (state: ConnectionState) => void;
export type Unsubscribe = () => void;

/**
 * WhatsAppClient is the strict boundary contract between OpenMsg and WhatsApp Web.
 * Core CRM, Automations, and UI must ONLY communicate through this interface.
 */
export interface WhatsAppClient {
  initialize(): Promise<void>;
  isReady(): Promise<boolean>;
  getCurrentUser(): Promise<WhatsAppUser | null>;
  getContacts(): Promise<WhatsAppContact[]>;
  getChats(): Promise<WhatsAppChat[]>;
  getChat(chatId: string): Promise<WhatsAppChat | null>;
  getMessages(chatId: string, options?: MessageQuery): Promise<WhatsAppMessage[]>;
  sendText(input: SendTextInput): Promise<SendResult>;
  sendImage(input: SendMediaInput): Promise<SendResult>;
  sendVideo(input: SendMediaInput): Promise<SendResult>;
  sendAudio(input: SendMediaInput): Promise<SendResult>;
  sendDocument(input: SendDocumentInput): Promise<SendResult>;
  markAsRead(chatId: string): Promise<void>;
  getConnectionState(): Promise<ConnectionState>;
  onMessage(handler: MessageHandler): Unsubscribe;
  onMessageStatus(handler: MessageStatusHandler): Unsubscribe;
  onConnectionChange(handler: ConnectionHandler): Unsubscribe;
}
