import { describe, it, expect } from 'vitest';
import { MockWhatsAppClient } from '@/content/whatsapp/mock-client';

describe('MockWhatsAppClient', () => {
  it('should report readiness and user profile', async () => {
    const client = new MockWhatsAppClient();
    const ready = await client.isReady();
    expect(ready).toBe(true);

    const user = await client.getCurrentUser();
    expect(user).toBeDefined();
    expect(user?.name).toBe('OpenMsg Demo Agent');
    expect(user?.isBusiness).toBe(true);
  });

  it('should list pre-seeded contacts and chats', async () => {
    const client = new MockWhatsAppClient();
    const contacts = await client.getContacts();
    expect(contacts.length).toBeGreaterThan(0);
    expect(contacts[0].name).toBe('John Doe');

    const chats = await client.getChats();
    expect(chats.length).toBeGreaterThan(0);
  });

  it('should send messages and update chat history', async () => {
    const client = new MockWhatsAppClient();
    const targetChat = '15551234567@c.us';

    const result = await client.sendText({
      chatId: targetChat,
      text: 'Hello from automated unit test!',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();

    const chats = await client.getChats();
    const chat = chats.find((c) => c.id === targetChat);
    expect(chat?.lastMessage?.body).toBe('Hello from automated unit test!');
    expect(chat?.lastMessage?.fromMe).toBe(true);
  });

  it('should dispatch incoming messages to registered listeners', async () => {
    const client = new MockWhatsAppClient();
    let receivedText = '';

    const unsub = client.onMessage((msg) => {
      receivedText = msg.body;
    });

    client.simulateIncomingMessage('15551234567@c.us', 'Incoming simulation payload');
    expect(receivedText).toBe('Incoming simulation payload');

    unsub();
  });
});
