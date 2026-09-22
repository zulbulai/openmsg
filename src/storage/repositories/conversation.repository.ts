import { db } from '../db';
import { Conversation, MessageRecord } from '../schemas';

export class ConversationRepository {
  static async getById(id: string): Promise<Conversation | undefined> {
    return db.conversations.get(id);
  }

  static async listRecent(limit = 50): Promise<Conversation[]> {
    return db.conversations
      .orderBy('lastMessageTimestamp')
      .reverse()
      .limit(limit)
      .toArray();
  }

  static async upsert(chat: Partial<Conversation> & { id: string; contactId: string }): Promise<Conversation> {
    const existing = await db.conversations.get(chat.id);
    const conversation: Conversation = {
      id: chat.id,
      contactId: chat.contactId,
      unreadCount: chat.unreadCount ?? existing?.unreadCount ?? 0,
      pinned: chat.pinned ?? existing?.pinned ?? false,
      archived: chat.archived ?? existing?.archived ?? false,
      lastMessageText: chat.lastMessageText ?? existing?.lastMessageText,
      lastMessageTimestamp: chat.lastMessageTimestamp ?? existing?.lastMessageTimestamp ?? Date.now(),
    };

    await db.conversations.put(conversation);
    return conversation;
  }

  static async saveMessage(message: MessageRecord): Promise<void> {
    await db.transaction('rw', db.messages, db.conversations, async () => {
      await db.messages.put(message);
      const conv = await db.conversations.get(message.chatId);
      if (conv) {
        conv.lastMessageText = message.body;
        conv.lastMessageTimestamp = message.timestamp;
        if (!message.fromMe) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        await db.conversations.put(conv);
      }
    });
  }

  static async getMessages(chatId: string, limit = 50): Promise<MessageRecord[]> {
    return db.messages
      .where('chatId')
      .equals(chatId)
      .reverse()
      .sortBy('timestamp')
      .then((msgs) => msgs.slice(0, limit).reverse());
  }

  static async markRead(chatId: string): Promise<void> {
    const conv = await db.conversations.get(chatId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      await db.conversations.put(conv);
    }
  }
}
