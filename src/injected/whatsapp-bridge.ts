import { OpenMsgBridgeEnvelope } from '@/types/messages';
import { WhatsAppUser, WhatsAppContact, WhatsAppChat, WhatsAppMessage } from '@/types/whatsapp';

/**
 * OpenMsg Main World Bridge Script
 * Injected into WhatsApp Web page context (world: MAIN).
 * Interfaces with WPPConnect/WA-JS (window.WPP) and internal WhatsApp Web Webpack Store,
 * with resilient DOM fallbacks.
 */
(() => {
  console.log('[OpenMsg Bridge] Initializing in Main World...');

  function getWPP(): any {
    return (window as any).WPP || null;
  }

  function getStore(): any {
    return (window as any).Store || (window as any).WPP?.whatsapp?.Store || null;
  }

  function isWhatsAppReady(): boolean {
    const wpp = getWPP();
    if (wpp) {
      if (typeof wpp.conn?.isMainReady === 'function') {
        const ready = wpp.conn.isMainReady();
        if (ready) return true;
      }
      if (typeof wpp.conn?.isAuthenticated === 'function') {
        const authed = wpp.conn.isAuthenticated();
        if (authed) return true;
      }
      if (typeof wpp.isReady === 'function') {
        return Boolean(wpp.isReady());
      }
      if (typeof wpp.isReady === 'boolean') {
        return wpp.isReady;
      }
      if (wpp.loader?.isReady) {
        return true;
      }
    }

    const store = getStore();
    if (store && store.Chat && store.Msg) {
      return true;
    }

    // DOM check for authenticated WhatsApp Web interface
    const sidePane = document.getElementById('pane-side') || document.querySelector('div[aria-label="Chat list"]');
    if (sidePane) {
      return true;
    }

    return false;
  }

  function getCurrentUser(): WhatsAppUser | null {
    const wpp = getWPP();
    const store = getStore();
    const me = wpp?.conn?.getMyUserId?.() || store?.Conn?.wid || null;

    let widStr = '';
    if (me) {
      widStr = typeof me === 'object' ? me._serialized || me.user : String(me);
    } else {
      // Try reading wid from localStorage
      try {
        const lastWid = localStorage.getItem('last-wid-md') || localStorage.getItem('last-wid');
        if (lastWid) {
          widStr = lastWid.replace(/['"]+/g, '');
        }
      } catch {}
    }

    if (!widStr) {
      // Check if user is logged in via side-pane existence
      const sidePane = document.getElementById('pane-side');
      if (!sidePane) return null;
      widStr = 'user@c.us';
    }

    const phone = widStr.replace(/\D/g, '') || '910000000000';
    let name = 'WhatsApp User';
    try {
      name =
        wpp?.profile?.getMyProfileName?.() ||
        wpp?.conn?.getMyPushName?.() ||
        store?.Conn?.pushname ||
        phone;
    } catch {}

    return {
      wid: widStr,
      name: String(name),
      phone,
      isBusiness: Boolean(wpp?.profile?.isBusiness?.() || store?.Features?.isBusiness),
    };
  }

  function broadcastEvent(action: string, payload: unknown): void {
    window.postMessage(
      {
        target: 'OPENMSG_BRIDGE_EVENT',
        action,
        payload,
      } as OpenMsgBridgeEnvelope,
      '*'
    );
  }

  let isListenersAttached = false;
  function attachWhatsAppEventListeners(): void {
    if (isListenersAttached) return;
    const wpp = getWPP();

    if (wpp && wpp.on) {
      isListenersAttached = true;
      try {
        // Message listener
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

          broadcastEvent('MESSAGE_RECEIVED', normalized);
        });

        // Ack listener
        wpp.on('chat.msg_ack_change', (ack: any) => {
          if (!ack || !ack.id) return;
          const ackNumber = ack.ack ?? 0;
          let statusStr: 'pending' | 'sent' | 'delivered' | 'read' = 'sent';
          if (ackNumber === 2) statusStr = 'delivered';
          if (ackNumber >= 3) statusStr = 'read';

          broadcastEvent('MESSAGE_STATUS', {
            messageId: ack.id?._serialized || String(ack.id),
            chatId: ack.chatId?._serialized || String(ack.chatId),
            status: statusStr,
            timestamp: Date.now(),
          });
        });

        // Connection lifecycle events
        wpp.on('conn.authenticated', () => {
          console.log('[OpenMsg Bridge] WhatsApp authenticated.');
          broadcastEvent('CONNECTION_CHANGED', 'CONNECTED');
        });

        wpp.on('conn.main_ready', () => {
          console.log('[OpenMsg Bridge] WhatsApp main interface ready.');
          broadcastEvent('CONNECTION_CHANGED', 'READY');
        });

        wpp.on('conn.logout', () => {
          console.log('[OpenMsg Bridge] WhatsApp logged out.');
          broadcastEvent('CONNECTION_CHANGED', 'DISCONNECTED');
        });

        console.log('[OpenMsg Bridge] WA-JS event listeners registered.');
      } catch (err) {
        console.warn('[OpenMsg Bridge] Failed to hook WA-JS event listeners:', err);
      }
    }
  }

  // Hook WA-JS loader readiness
  function hookWPPReadiness(): void {
    const wpp = getWPP();
    if (!wpp) {
      setTimeout(hookWPPReadiness, 500);
      return;
    }

    attachWhatsAppEventListeners();

    if (wpp.loader?.onReady) {
      wpp.loader.onReady(() => {
        console.log('[OpenMsg Bridge] WPP.loader onReady triggered.');
        attachWhatsAppEventListeners();
        broadcastEvent('CONNECTION_CHANGED', 'READY');
      });
    }

    if (wpp.webpack?.onReady) {
      wpp.webpack.onReady(() => {
        console.log('[OpenMsg Bridge] WPP.webpack onReady triggered.');
        attachWhatsAppEventListeners();
        broadcastEvent('CONNECTION_CHANGED', 'READY');
      });
    }

    if (isWhatsAppReady()) {
      broadcastEvent('CONNECTION_CHANGED', 'READY');
    }
  }

  hookWPPReadiness();

  // DOM Fallbacks for chats and contacts
  function extractChatsFromDOM(): WhatsAppChat[] {
    const list: WhatsAppChat[] = [];
    const elements = document.querySelectorAll(
      '#pane-side div[role="listitem"], #pane-side div[role="row"], #pane-side div._ak72, #pane-side div._ak73'
    );

    elements.forEach((el, idx) => {
      const titleEl = el.querySelector('span[title]');
      const title = titleEl?.getAttribute('title') || titleEl?.textContent || `WhatsApp Chat ${idx + 1}`;
      const unreadEl = el.querySelector('span[aria-label*="unread"], span[aria-label*="Unread"]');
      const unreadCount = unreadEl ? parseInt(unreadEl.textContent || '1', 10) || 1 : 0;

      list.push({
        id: `chat_${idx}_${title.replace(/\W+/g, '_')}`,
        name: title,
        unreadCount,
        isGroup: false,
        pinned: false,
        archived: false,
      });
    });

    return list;
  }

  async function sendTextViaDOM(text: string): Promise<boolean> {
    const composer = (document.querySelector('footer div[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][data-tab="10"]')) as HTMLElement | null;

    if (!composer) return false;
    composer.focus();
    document.execCommand('insertText', false, text);
    composer.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((r) => setTimeout(r, 150));

    const sendBtn = (document.querySelector('footer button span[data-icon="send"]') ||
      document.querySelector('footer button[aria-label="Send"]') ||
      document.querySelector('footer button span[data-icon="wds-ic-send-solid"]')) as HTMLElement | null;

    const btn = sendBtn?.closest('button') || sendBtn;
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  // Listen for RPC requests from Isolated World content script
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
      const wpp = getWPP();
      const store = getStore();

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
          let contactsList: WhatsAppContact[] = [];

          if (wpp?.contact?.list) {
            try {
              const raw = await wpp.contact.list();
              contactsList = raw.map((c: any) => ({
                id: c.id?._serialized || String(c.id),
                name: c.name || c.pushname || c.shortName || (c.id?._serialized || String(c.id)).replace(/\D/g, '') || 'Unknown',
                phone: (c.id?._serialized || String(c.id)).replace(/\D/g, ''),
                isGroup: Boolean(c.isGroup),
                isMyContact: Boolean(c.isMyContact),
                profilePicUrl: c.profilePicThumbObj?.eurl,
              }));
            } catch (e) {
              console.warn('[OpenMsg Bridge] WPP contact list error:', e);
            }
          }

          if (contactsList.length === 0 && store?.Contact?.models) {
            contactsList = store.Contact.models.map((c: any) => ({
              id: c.id?._serialized || String(c.id),
              name: c.name || c.pushname || (c.id?._serialized || String(c.id)).replace(/\D/g, '') || 'Unknown',
              phone: (c.id?._serialized || String(c.id)).replace(/\D/g, ''),
              isGroup: Boolean(c.isGroup),
              isMyContact: Boolean(c.isMyContact),
            }));
          }

          // Fallback to DOM if list is still empty
          if (contactsList.length === 0) {
            const domChats = extractChatsFromDOM();
            contactsList = domChats.map((c) => ({
              id: c.id,
              name: c.name,
              phone: c.name.replace(/\D/g, '') || '1234567890',
              isGroup: c.isGroup,
              isMyContact: true,
            }));
          }

          reply(contactsList);
          break;
        }

        case 'GET_CHATS': {
          let chatsList: WhatsAppChat[] = [];

          if (wpp?.chat?.list) {
            try {
              const raw = await wpp.chat.list();
              chatsList = raw.map((c: any) => ({
                id: c.id?._serialized || String(c.id),
                name: c.name || c.formattedTitle || (c.id?._serialized || String(c.id)).replace(/\D/g, '') || 'Chat',
                unreadCount: c.unreadCount || 0,
                isGroup: Boolean(c.isGroup),
                pinned: Boolean(c.pinned),
                archived: Boolean(c.archive),
              }));
            } catch (e) {
              console.warn('[OpenMsg Bridge] WPP chat list error:', e);
            }
          }

          if (chatsList.length === 0 && store?.Chat?.models) {
            chatsList = store.Chat.models.map((c: any) => ({
              id: c.id?._serialized || String(c.id),
              name: c.name || c.formattedTitle || (c.id?._serialized || String(c.id)).replace(/\D/g, '') || 'Chat',
              unreadCount: c.unreadCount || 0,
              isGroup: Boolean(c.isGroup),
              pinned: Boolean(c.pinned),
              archived: Boolean(c.archive),
            }));
          }

          // Fallback to DOM if list is still empty
          if (chatsList.length === 0) {
            chatsList = extractChatsFromDOM();
          }

          reply(chatsList);
          break;
        }

        case 'GET_CHAT': {
          const chatId = (payload as any)?.chatId;
          let chat: WhatsAppChat | null = null;
          if (wpp?.chat?.get) {
            try {
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
            } catch {}
          }
          reply(chat);
          break;
        }

        case 'GET_MESSAGES': {
          const { chatId, count = 50 } = (payload as any) || {};
          let messagesList: WhatsAppMessage[] = [];

          if (wpp?.chat?.getMessages) {
            try {
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
            } catch (e) {
              console.warn('[OpenMsg Bridge] WPP getMessages error:', e);
            }
          }
          reply(messagesList);
          break;
        }

        case 'SEND_TEXT': {
          const { chatId, text, quotedId } = (payload as any) || {};
          let success = false;
          let messageId = `msg_${Date.now()}`;

          if (wpp?.chat?.sendTextMessage) {
            try {
              const result = await wpp.chat.sendTextMessage(chatId, text, {
                quotedMsg: quotedId,
                createChat: true,
              });
              success = true;
              messageId = result?.id?._serialized || String(result?.id || messageId);
            } catch (err) {
              console.warn('[OpenMsg Bridge] WPP sendTextMessage failed, trying DOM fallback:', err);
            }
          }

          if (!success) {
            // DOM fallback send
            success = await sendTextViaDOM(text);
          }

          if (success) {
            reply({
              success: true,
              messageId,
              timestamp: Date.now(),
            });
          } else {
            throw new Error('Failed to send WhatsApp message via both WPP and DOM.');
          }
          break;
        }

        case 'SEND_MEDIA': {
          const { chatId, mediaDataUrl, filename, caption } = (payload as any) || {};
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
            throw new Error('WhatsApp media sending capability not available.');
          }
          break;
        }

        case 'MARK_AS_READ': {
          const chatId = (payload as any)?.chatId;
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
      console.error('[OpenMsg Bridge] Error handling RPC action:', action, err);
      reply(null, err?.message || String(err));
    }
  });

  // Announce bridge readiness immediately
  broadcastEvent('BRIDGE_MOUNTED', { timestamp: Date.now() });
})();
