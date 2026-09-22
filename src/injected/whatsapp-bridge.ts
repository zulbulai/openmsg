import { OpenMsgBridgeEnvelope } from '@/types/messages';
import { WhatsAppUser, WhatsAppContact, WhatsAppChat, WhatsAppMessage } from '@/types/whatsapp';

/**
 * OpenMsg Main World Bridge Script
 * Injected into WhatsApp Web page context (world: MAIN).
 * Directly interfaces with WhatsApp Web global hooks (window.WPP or window.Store).
 */
(() => {
  console.log('[OpenMsg Bridge] Injected into Main World.');

  // Check availability of WhatsApp Web internal wrapper
  function getWPP(): any {
    return (window as any).WPP || null;
  }

  function getStore(): any {
    return (window as any).Store || (window as any).WPP?.whatsapp?.Store || null;
  }

  function isWhatsAppReady(): boolean {
    const wpp = getWPP();
    if (wpp && wpp.isReady) {
      return Boolean(typeof wpp.isReady === 'function' ? wpp.isReady() : wpp.isReady);
    }
    const store = getStore();
    return Boolean(store && store.Chat && store.Msg);
  }

  function getCurrentUser(): WhatsAppUser | null {
    const wpp = getWPP();
    const store = getStore();
    const me = wpp?.conn?.getMyUserId?.() || store?.Conn?.wid || null;

    if (!me) return null;
    const widStr = typeof me === 'object' ? me._serialized || me.user : String(me);
    const phone = widStr.replace(/\D/g, '');

    return {
      wid: widStr,
      name: wpp?.conn?.getMyPushName?.() || store?.Conn?.pushname || 'WhatsApp User',
      phone,
      isBusiness: Boolean(wpp?.conn?.isBusiness?.() || store?.Features?.isBusiness),
    };
  }

  // Subscribe to internal incoming message events
  function attachWhatsAppEventListeners(): void {
    const wpp = getWPP();
    if (wpp && wpp.on) {
      try {
        wpp.on('chat.new_message', (msg: any) => {
          if (!msg) return;
          const normalized: WhatsAppMessage = {
            id: msg.id?._serialized || String(msg.id),
            chatId: msg.chatId?._serialized || msg.from?._serialized || String(msg.chatId || msg.from),
            fromMe: Boolean(msg.fromMe || msg.id?.fromMe),
            sender: msg.sender?._serialized || String(msg.author || msg.from),
            body: msg.body || msg.caption || '',
            timestamp: msg.t ? msg.t * 1000 : Date.now(),
            type: msg.type || 'text',
            ack: msg.ack ?? 1,
            mediaUrl: msg.mediaUrl,
            caption: msg.caption,
            filename: msg.filename,
            quotedMessageId: msg.quotedMsg?.id?._serialized,
          };

          window.postMessage(
            {
              target: 'OPENMSG_BRIDGE_EVENT',
              action: 'MESSAGE_RECEIVED',
              payload: normalized,
            } as OpenMsgBridgeEnvelope,
            '*'
          );
        });

        wpp.on('chat.msg_ack_change', (ack: any) => {
          if (!ack || !ack.id) return;
          const ackNumber = ack.ack ?? 0;
          let statusStr: 'pending' | 'sent' | 'delivered' | 'read' = 'sent';
          if (ackNumber === 2) statusStr = 'delivered';
          if (ackNumber >= 3) statusStr = 'read';

          window.postMessage(
            {
              target: 'OPENMSG_BRIDGE_EVENT',
              action: 'MESSAGE_STATUS',
              payload: {
                messageId: ack.id?._serialized || String(ack.id),
                chatId: ack.chatId?._serialized || String(ack.chatId),
                status: statusStr,
                timestamp: Date.now(),
              },
            } as OpenMsgBridgeEnvelope,
            '*'
          );
        });

        console.log('[OpenMsg Bridge] Event listeners hooked successfully.');
      } catch (err) {
        console.warn('[OpenMsg Bridge] Failed to hook event listeners:', err);
      }
    }
  }

  // Listen for RPC requests from the Isolated World content script
  window.addEventListener('message', async (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as OpenMsgBridgeEnvelope;
    if (!data || data.target !== 'OPENMSG_BRIDGE_REQUEST') return;

    const { id, action, payload } = data;

    const reply = (resPayload?: unknown, error?: string) => {
      window.postMessage(
        {
          target: 'OPENMSG_BRIDGE_RESPONSE',
          id,
          action,
          payload: resPayload,
          error,
        } as OpenMsgBridgeEnvelope,
        '*'
      );
    };

    try {
      switch (action) {
        case 'INITIALIZE': {
          attachWhatsAppEventListeners();
          const ready = isWhatsAppReady();
          const user = getCurrentUser();
          reply({ ready, user });
          break;
        }

        case 'IS_READY': {
          reply({ ready: isWhatsAppReady() });
          break;
        }

        case 'GET_CURRENT_USER': {
          reply(getCurrentUser());
          break;
        }

        case 'GET_CONTACTS': {
          const wpp = getWPP();
          const store = getStore();
          let contactsList: WhatsAppContact[] = [];

          if (wpp?.contact?.list) {
            const raw = await wpp.contact.list();
            contactsList = raw.map((c: any) => ({
              id: c.id?._serialized || String(c.id),
              name: c.name || c.pushname || c.shortName || 'Unknown',
              phone: (c.id?._serialized || String(c.id)).replace(/\D/g, ''),
              isGroup: Boolean(c.isGroup),
              isMyContact: Boolean(c.isMyContact),
              profilePicUrl: c.profilePicThumbObj?.eurl,
            }));
          } else if (store?.Contact?.models) {
            contactsList = store.Contact.models.map((c: any) => ({
              id: c.id?._serialized || String(c.id),
              name: c.name || c.pushname || 'Unknown',
              phone: (c.id?._serialized || String(c.id)).replace(/\D/g, ''),
              isGroup: Boolean(c.isGroup),
              isMyContact: Boolean(c.isMyContact),
            }));
          }
          reply(contactsList);
          break;
        }

        case 'GET_CHATS': {
          const wpp = getWPP();
          const store = getStore();
          let chatsList: WhatsAppChat[] = [];

          if (wpp?.chat?.list) {
            const raw = await wpp.chat.list();
            chatsList = raw.map((c: any) => ({
              id: c.id?._serialized || String(c.id),
              name: c.name || c.formattedTitle || 'Chat',
              unreadCount: c.unreadCount || 0,
              isGroup: Boolean(c.isGroup),
              pinned: Boolean(c.pinned),
              archived: Boolean(c.archive),
            }));
          } else if (store?.Chat?.models) {
            chatsList = store.Chat.models.map((c: any) => ({
              id: c.id?._serialized || String(c.id),
              name: c.name || c.formattedTitle || 'Chat',
              unreadCount: c.unreadCount || 0,
              isGroup: Boolean(c.isGroup),
              pinned: Boolean(c.pinned),
              archived: Boolean(c.archive),
            }));
          }
          reply(chatsList);
          break;
        }

        case 'GET_CHAT': {
          const chatId = (payload as any)?.chatId;
          const wpp = getWPP();
          let chat: WhatsAppChat | null = null;
          if (wpp?.chat?.get) {
            const c = await wpp.chat.get(chatId);
            if (c) {
              chat = {
                id: c.id?._serialized || String(c.id),
                name: c.name || c.formattedTitle || 'Chat',
                unreadCount: c.unreadCount || 0,
                isGroup: Boolean(c.isGroup),
                pinned: Boolean(c.pinned),
                archived: Boolean(c.archive),
              };
            }
          }
          reply(chat);
          break;
        }

        case 'GET_MESSAGES': {
          const { chatId, count = 30 } = (payload as any) || {};
          const wpp = getWPP();
          let messagesList: WhatsAppMessage[] = [];

          if (wpp?.chat?.getMessages) {
            const raw = await wpp.chat.getMessages(chatId, { count });
            messagesList = raw.map((m: any) => ({
              id: m.id?._serialized || String(m.id),
              chatId,
              fromMe: Boolean(m.fromMe || m.id?.fromMe),
              sender: m.sender?._serialized || String(m.author || m.from),
              body: m.body || m.caption || '',
              timestamp: m.t ? m.t * 1000 : Date.now(),
              type: m.type || 'text',
              ack: m.ack ?? 1,
            }));
          }
          reply(messagesList);
          break;
        }

        case 'SEND_TEXT': {
          const { chatId, text, quotedId } = (payload as any) || {};
          const wpp = getWPP();

          if (wpp?.chat?.sendTextMessage) {
            const result = await wpp.chat.sendTextMessage(chatId, text, {
              quotedMsg: quotedId,
              createChat: true,
            });
            reply({
              success: true,
              messageId: result?.id?._serialized || String(result?.id),
              timestamp: Date.now(),
            });
          } else {
            throw new Error('WhatsApp sending capability not available on page.');
          }
          break;
        }

        case 'SEND_MEDIA': {
          const { chatId, mediaDataUrl, filename, caption } = (payload as any) || {};
          const wpp = getWPP();

          if (wpp?.chat?.sendFileMessage) {
            const result = await wpp.chat.sendFileMessage(chatId, mediaDataUrl, {
              filename: filename || 'file',
              caption,
              createChat: true,
            });
            reply({
              success: true,
              messageId: result?.id?._serialized || String(result?.id),
              timestamp: Date.now(),
            });
          } else {
            throw new Error('WhatsApp file sending capability not available on page.');
          }
          break;
        }

        case 'MARK_AS_READ': {
          const chatId = (payload as any)?.chatId;
          const wpp = getWPP();
          if (wpp?.chat?.markIsRead) {
            await wpp.chat.markIsRead(chatId);
          }
          reply({ success: true });
          break;
        }

        default:
          reply(null, `Unsupported bridge action: ${action}`);
      }
    } catch (err: any) {
      console.error('[OpenMsg Bridge] Error handling RPC:', action, err);
      reply(null, err?.message || String(err));
    }
  });

  // Announce bridge readiness
  window.postMessage(
    {
      target: 'OPENMSG_BRIDGE_EVENT',
      action: 'BRIDGE_MOUNTED',
      payload: { timestamp: Date.now() },
    } as OpenMsgBridgeEnvelope,
    '*'
  );
})();
