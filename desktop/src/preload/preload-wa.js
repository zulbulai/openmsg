/**
 * WhatsApp Web Preload Bridge
 * Injects WPPConnect into WhatsApp Web and handles IPC bidirectional messaging
 * Includes robust Dual-Engine QR Code extraction (DOM Canvas + WPPConnect AuthCode)
 */

const { ipcRenderer, webFrame } = require('electron');
const fs = require('fs');
const path = require('path');

// Read bundled wppconnect-wa.js
const wppJsPath = path.join(__dirname, '../shared/vendor/wppconnect-wa.js');
let wppScriptContent = '';
try {
  wppScriptContent = fs.readFileSync(wppJsPath, 'utf8');
} catch (e) {
  console.error('[Preload WA] Could not read wppconnect-wa.js:', e);
}

// Injected bridge script that runs directly in WhatsApp Web page context
const pageBridgeScript = `
(function() {
  console.log('[OpenMsg Bridge] Initializing WhatsApp Web Hook & QR Engine...');

  let isInitialized = false;
  let lastQrRef = null;
  let lastCanvasData = null;
  let currentStatus = 'LOADING';

  // ─── DOM QR & Status Scanner (Runs continuously & independently of WPP) ─────
  function checkStatusAndQr() {
    try {
      // 1. Check if logged in via DOM elements
      const isChatListVisible = !!(
        document.querySelector('#pane-side') ||
        document.querySelector('[data-testid="chat-list"]') ||
        document.querySelector('div[aria-label="Chat list"]')
      );

      const isWppConnected = Boolean(
        window.WPP &&
        window.WPP.conn &&
        typeof window.WPP.conn.isAuthenticated === 'function' &&
        window.WPP.conn.isAuthenticated()
      );

      if (isChatListVisible || isWppConnected) {
        if (currentStatus !== 'CONNECTED') {
          currentStatus = 'CONNECTED';
          let myNumber = '';
          let pushname = '';
          try {
            if (window.WPP && window.WPP.conn) {
              myNumber = window.WPP.conn.getMyUserId() ? window.WPP.conn.getMyUserId().user : '';
              pushname = window.WPP.conn.getPushname ? window.WPP.conn.getPushname() : '';
            }
          } catch (e) {}

          window.postMessage({
            type: 'WA_STATUS_UPDATE',
            status: 'CONNECTED',
            phone: myNumber,
            pushname: pushname
          }, '*');
        }
        return;
      }

      // 2. Check for QR code in DOM
      const qrContainer = document.querySelector('[data-ref]');
      const ref = qrContainer ? qrContainer.getAttribute('data-ref') : null;

      let canvas = null;
      if (qrContainer) {
        canvas = qrContainer.querySelector('canvas') || qrContainer;
      }
      if (!canvas || canvas.tagName !== 'CANVAS') {
        canvas = document.querySelector('canvas[aria-label*="QR" i]') ||
                 document.querySelector('canvas[aria-label*="Scan" i]') ||
                 document.querySelector('div[data-testid="qrcode"] canvas') ||
                 document.querySelector('canvas');
      }

      let canvasData = null;
      if (canvas && canvas.tagName === 'CANVAS') {
        try {
          canvasData = canvas.toDataURL('image/png');
        } catch (e) {}
      }

      if (ref || canvasData) {
        if (currentStatus !== 'WAITING_QR') {
          currentStatus = 'WAITING_QR';
          window.postMessage({ type: 'WA_STATUS_UPDATE', status: 'WAITING_QR' }, '*');
        }

        if (ref !== lastQrRef || (canvasData && canvasData !== lastCanvasData)) {
          lastQrRef = ref;
          lastCanvasData = canvasData;
          window.postMessage({
            type: 'WA_QR_CODE',
            qr: ref,
            qrDataUrl: canvasData
          }, '*');
        }
      }
    } catch (err) {
      console.warn('[OpenMsg Bridge] Scanner error:', err);
    }
  }

  // Run DOM check every 750ms
  setInterval(checkStatusAndQr, 750);
  checkStatusAndQr();

  // Comprehensive extractor for all WhatsApp message types (Media, Voice, Stickers, Documents, Reactions)
  function extractMessageContent(m) {
    if (!m) return '';
    if (typeof m === 'string') return m;
    if (m.body && typeof m.body === 'string' && m.body.trim()) return m.body;
    if (m.caption && typeof m.caption === 'string' && m.caption.trim()) return m.caption;

    var type = String(m.type || '').toLowerCase();
    switch (type) {
      case 'image':
        return m.caption ? ('📷 ' + m.caption) : '📷 Photo';
      case 'video':
        return m.caption ? ('🎥 ' + m.caption) : '🎥 Video';
      case 'ptt':
      case 'audio':
        return '🎤 Voice message';
      case 'sticker':
        return '👾 Sticker';
      case 'document':
        return '📄 Document: ' + (m.filename || m.caption || 'File');
      case 'location':
      case 'live_location':
        return '📍 Location: ' + (m.loc || m.address || 'Shared location');
      case 'vcard':
      case 'contact':
      case 'contact_array':
        return '👤 Contact: ' + (m.displayName || m.vcard || 'Card');
      case 'poll_creation':
      case 'poll':
        return '📊 Poll: ' + (m.pollName || 'Poll');
      case 'reaction':
        return '❤️ Reaction' + (m.reactionText ? (': ' + m.reactionText) : '');
      case 'revoked':
        return '🚫 This message was deleted';
      case 'interactive':
      case 'template_button_reply':
      case 'buttons_response':
        return '🔘 ' + (m.selectedDisplayText || m.title || m.selectedButtonId || 'Interactive reply');
      case 'list_response':
        return '📋 ' + (m.selectedRowId || m.title || 'Selected option');
      default:
        if (m.text && typeof m.text === 'string') return m.text;
        if (m.content && typeof m.content === 'string') return m.content;
        return m.type ? ('[' + m.type + ']') : 'Message';
    }
  }

  // ─── WPPConnect Webpack Hook ───────────────────────────────────────────────
  function initWPP() {
    if (typeof WPP === 'undefined') {
      setTimeout(initWPP, 400);
      return;
    }

    if (isInitialized) return;
    isInitialized = true;
    console.log('[OpenMsg Bridge] WPP is available, hooking events...');

    // Real WPPConnect QR code change event
    try {
      if (WPP.on) {
        WPP.on('conn.auth_code_change', function(authCode) {
          if (authCode) {
            const qrStr = typeof authCode === 'string'
              ? authCode
              : ((authCode.fullCode || authCode.code || authCode.data) || '');
            lastQrRef = qrStr;
            window.postMessage({
              type: 'WA_QR_CODE',
              qr: qrStr,
              qrDataUrl: null
            }, '*');
          }
        });

        const notifyConnected = function() {
          let myNumber = '';
          try {
            if (WPP.conn && WPP.conn.getMyUserId()) {
              myNumber = WPP.conn.getMyUserId().user || '';
            }
          } catch(e) {}
          currentStatus = 'CONNECTED';
          window.postMessage({
            type: 'WA_STATUS_UPDATE',
            status: 'CONNECTED',
            phone: myNumber,
            pushname: WPP.conn && WPP.conn.getPushname ? WPP.conn.getPushname() : ''
          }, '*');
        };

        WPP.on('conn.authenticated', notifyConnected);
        WPP.on('conn.main_ready', notifyConnected);

        WPP.on('conn.logout', function() {
          currentStatus = 'DISCONNECTED';
          window.postMessage({ type: 'WA_STATUS_UPDATE', status: 'DISCONNECTED' }, '*');
        });

        // Listen for incoming and outgoing messages (chat.new_message is the real WA-JS event)
        function handleMsg(msg) {
          if (!msg) return;
          const isFromMe = Boolean(msg.fromMe || (msg.id && msg.id.fromMe));
          const remote = (msg.id && msg.id.remote)
            ? (msg.id.remote._serialized || msg.id.remote)
            : (msg.from ? (msg.from._serialized || msg.from) : (msg.to ? (msg.to._serialized || msg.to) : ''));
          const phone = String(remote || '').replace(/@.*$/, '').replace(/\D+/g, '');
          if (!phone) return;
          const contactName = msg.sender ? (msg.sender.name || msg.sender.pushname || msg.sender.formattedTitle || '') : '';
          const bodyText = extractMessageContent(msg);
          const rawTime = (msg.t || msg.timestamp);
          const time = rawTime ? (rawTime < 1e11 ? rawTime * 1000 : rawTime) : Date.now();
          const msgType = String(msg.type || 'chat').toLowerCase();
          const isGroup = Boolean(msg.isGroupMsg || (remote && String(remote).includes('@g.us')));
          window.postMessage({
            type: 'WA_INCOMING_MSG',
            msg: {
              id: msg.id ? (msg.id._serialized || msg.id) : ('msg_' + Date.now()),
              from: msg.from ? (msg.from._serialized || msg.from) : '',
              to: msg.to ? (msg.to._serialized || msg.to) : '',
              fromMe: isFromMe,
              name: contactName || phone,
              senderPhone: phone,
              body: bodyText,
              type: msgType,
              caption: msg.caption || '',
              filename: msg.filename || '',
              mediaUrl: msg.clientUrl || msg.deprecatedMms3Url || '',
              isGroup: isGroup,
              timestamp: time
            }
          }, '*');
        }

        WPP.on('chat.new_message', handleMsg);
        WPP.on('chat.msg', handleMsg);
      }
    } catch (e) {
      console.warn('[OpenMsg Bridge] WPP event hook error:', e);
    }

    if (WPP.webpack && typeof WPP.webpack.onReady === 'function') {
      WPP.webpack.onReady(function() {
        console.log('[OpenMsg Bridge] WhatsApp Web webpack ready!');
        window.postMessage({ type: 'WA_BRIDGE_READY' }, '*');

        // Check auth status
        if (WPP.conn && typeof WPP.conn.isRegistered === 'function' && WPP.conn.isRegistered()) {
          const myNumber = WPP.conn.getMyUserId() ? WPP.conn.getMyUserId().user : '';
          currentStatus = 'CONNECTED';
          window.postMessage({
            type: 'WA_STATUS_UPDATE',
            status: 'CONNECTED',
            phone: myNumber,
            pushname: WPP.conn.getPushname ? WPP.conn.getPushname() : ''
          }, '*');
        } else {
          // If auth code is already available
          if (WPP.conn && typeof WPP.conn.getAuthCode === 'function') {
            WPP.conn.getAuthCode().then(code => {
              if (code) {
                lastQrRef = code;
                window.postMessage({ type: 'WA_QR_CODE', qr: code }, '*');
              }
            }).catch(() => {});
          }
        }
      });
    }
  }

  // ─── Handle commands sent from preload ──────────────────────────────────────
  window.addEventListener('message', async function(ev) {
    if (!ev.data || ev.data.source !== 'openmsg-desktop-preload') return;
    const { action, id, payload } = ev.data;

    const reply = (success, data, error) => {
      window.postMessage({
        source: 'openmsg-desktop-page',
        id,
        success,
        data,
        error: error ? (error.message || String(error)) : null
      }, '*');
    };

    try {
      if (action === 'REFRESH_QR') {
        const reloadBtn = document.querySelector('button[aria-label*="reload" i]') ||
                          document.querySelector('span[data-icon="refresh"]') ||
                          document.querySelector('[data-ref] button') ||
                          document.querySelector('[data-ref]');
        if (reloadBtn) {
          reloadBtn.click();
        }
        if (typeof WPP !== 'undefined' && WPP.conn && typeof WPP.conn.refreshQR === 'function') {
          try { await WPP.conn.refreshQR(); } catch(e) {}
        }
        reply(true, { reloaded: true });
        return;
      }

      if (action === 'GET_STATUS') {
        const isConn = (typeof WPP !== 'undefined' && WPP.conn && typeof WPP.conn.isRegistered === 'function')
          ? WPP.conn.isRegistered()
          : Boolean(document.querySelector('#pane-side') || document.querySelector('[data-testid="chat-list"]'));
        const phone = isConn && typeof WPP !== 'undefined' && WPP.conn && WPP.conn.getMyUserId()
          ? WPP.conn.getMyUserId().user
          : '';
        reply(true, {
          connected: Boolean(isConn),
          phone: phone || ''
        });
        return;
      }

      function resolveTargetJid(raw) {
        if (!raw) return '';
        var target = String(raw).trim();
        if (target.includes('@')) return target;
        if (target.startsWith('120363') || target.includes('-')) {
          return target + '@g.us';
        }
        // Check if this user has a LID entry in lidPnCache
        try {
          if (typeof WPP !== 'undefined' && WPP.whatsapp) {
            const ws = WPP.whatsapp;
            if (ws.ChatStore) {
              const cidLid = target + '@lid';
              if (ws.ChatStore.get && ws.ChatStore.get(cidLid)) {
                return cidLid;
              }
            }
            // Check lidPnCache for @c.us -> @lid mapping
            if (ws.lidPnCache && typeof ws.lidPnCache.getCurrentLid === 'function') {
              const pnWid = { user: target, server: 'c.us', _serialized: target + '@c.us', isLid: () => false };
              const lid = ws.lidPnCache.getCurrentLid(pnWid);
              if (lid && lid._serialized) {
                return lid._serialized;
              }
            }
          }
        } catch(e) {}
        return target.replace(/\D+/g, '') + '@c.us';
      }

      if (typeof WPP === 'undefined') {
        throw new Error('WPPConnect not ready yet');
      }

      switch (action) {
        case 'SEND_MESSAGE': {
          let to = resolveTargetJid(payload.phone || payload.chatId || '');

          if (payload.simulateTyping && WPP.chat && typeof WPP.chat.markIsComposing === 'function') {
            try {
              await WPP.chat.markIsComposing(to, payload.typingDurationMs || 2000);
            } catch (e) {}
          }

          let sendRes = null;

          // Check if our own account's LID is available (needed by wa-js prepareRawMessage)
          function isMyLidAvailable() {
            try {
              if (WPP.whatsapp && WPP.whatsapp.UserPrefs) {
                const myLid = (typeof WPP.whatsapp.UserPrefs.getMaybeMeLidUser === 'function')
                  ? WPP.whatsapp.UserPrefs.getMaybeMeLidUser()
                  : null;
                return Boolean(myLid);
              }
            } catch(e) {}
            return false;
          }

          // Helper to send with automatic LID discovery and fallback
          const doSend = async (targetId) => {
            let resolvedTarget = targetId;

            // 1. For @c.us contacts: call queryExists to force LID cache population on server
            //    IMPORTANT: Only use @lid as target if our OWN LID is loaded (needed by prepareRawMessage)
            //    If our LID is not loaded, keep @c.us — wa-js will use getMyUserWid() which works
            if (targetId.includes('@c.us') && WPP.contact && typeof WPP.contact.queryExists === 'function') {
              try {
                const info = await WPP.contact.queryExists(targetId);
                if (info) {
                  const myLidLoaded = isMyLidAvailable();
                  if (info.lid && info.lid._serialized && myLidLoaded) {
                    // Both recipient has LID AND our sender LID is loaded → safe to use LID
                    resolvedTarget = info.lid._serialized;
                  } else if (info.wid && info.wid._serialized) {
                    // Fallback: use @c.us WID (getMyUserWid() will be used, doesn't need our LID)
                    resolvedTarget = info.wid._serialized;
                  }
                }
              } catch (qe) {
                console.warn('[OpenMsg Bridge] queryExists warning:', qe && qe.message ? qe.message : qe);
              }
            }

            if (payload.attachments && payload.attachments.length > 0) {
              const att = payload.attachments[0];
              return await WPP.chat.sendFileMessage(resolvedTarget, att.dataUrl, {
                caption: payload.message || '',
                createChat: true,
                filename: att.name
              });
            }

            // 2. Primary attempt with sendTextMessage
            try {
              return await WPP.chat.sendTextMessage(resolvedTarget, payload.message, {
                createChat: true,
                waitForAck: false
              });
            } catch (err1) {
              const errMsg = (err1 && err1.message) ? err1.message : String(err1);
              console.warn('[OpenMsg Bridge] sendTextMessage primary failed:', errMsg);

              // 3. If "No LID for user" — our sender LID isn't loaded. Retry with @c.us target.
              //    wa-js prepareRawMessage uses getMyUserWid() for @c.us targets (doesn't need LID)
              const isLidError = /no lid/i.test(errMsg) || /lid.*user/i.test(errMsg);
              if (isLidError && resolvedTarget !== targetId) {
                console.log('[OpenMsg Bridge] LID error, retrying with original @c.us target:', targetId);
                try {
                  return await WPP.chat.sendTextMessage(targetId, payload.message, {
                    createChat: true,
                    waitForAck: false
                  });
                } catch (lidFallbackErr) {
                  console.warn('[OpenMsg Bridge] @c.us fallback also failed:', lidFallbackErr && lidFallbackErr.message);
                }
              }

              // 4. Fallback A: Force WhatsApp Web to navigate to chat (populates LID Store)
              try {
                if (WPP.chat && typeof WPP.chat.openChatBottom === 'function') {
                  await WPP.chat.openChatBottom(resolvedTarget !== targetId ? targetId : resolvedTarget);
                  await new Promise(r => setTimeout(r, 500));
                  return await WPP.chat.sendTextMessage(resolvedTarget !== targetId ? targetId : resolvedTarget, payload.message, {
                    createChat: false,
                    waitForAck: false
                  });
                }
              } catch (openErr) {
                console.warn('[OpenMsg Bridge] openChatBottom fallback failed:', openErr && openErr.message ? openErr.message : openErr);
              }

              // 5. Fallback B: try without createChat flag
              try {
                return await WPP.chat.sendTextMessage(targetId, payload.message, {
                  createChat: false,
                  waitForAck: false
                });
              } catch (err2) {
                console.warn('[OpenMsg Bridge] sendTextMessage fallback B failed:', (err2 && err2.message) ? err2.message : err2);
                throw new Error((err2 && err2.message) ? err2.message : 'Message send failed. Check WhatsApp connection.');
              }
            }
          };

          sendRes = await doSend(to);
          const msgId = sendRes ? (sendRes.id ? (sendRes.id._serialized || sendRes.id) : sendRes) : null;
          reply(true, { messageId: msgId });
          break;
        }

        case 'CHECK_NUMBER': {
          let phone = payload.phone.replace(/\\D+/g, '');
          if (!phone.includes('@')) {
            phone = phone + '@c.us';
          }
          const exists = await WPP.contact.queryExists(phone);
          reply(true, {
            phone: payload.phone,
            exists: Boolean(exists),
            data: exists
          });
          break;
        }

        case 'GET_GROUPS': {
          const chats = await WPP.chat.list({ onlyGroups: true });
          const groups = (chats || []).map(g => ({
            id: g.id ? g.id._serialized : '',
            name: g.name || g.formattedTitle || 'Group',
            unreadCount: g.unreadCount || 0
          }));
          reply(true, groups);
          break;
        }

        case 'GET_GROUP_PARTICIPANTS': {
          const participants = await WPP.group.getParticipants(payload.groupId);
          const list = (participants || []).map(p => ({
            id: p.id ? p.id._serialized : '',
            phone: p.id ? p.id.user : '',
            isAdmin: Boolean(p.isAdmin || p.isSuperAdmin)
          }));
          reply(true, list);
          break;
        }

        case 'GET_RECENT_CHATS': {
          let recentChats = [];
          try {
            if (typeof WPP !== 'undefined' && WPP.chat && typeof WPP.chat.list === 'function') {
              recentChats = (await WPP.chat.list({ onlyContacts: false })) || [];
            }
          } catch (err) {
            console.warn('[OpenMsg Bridge] chat.list error:', err);
          }

          // Fallback 1: WPP.whatsapp.ChatStore models
          if ((!recentChats || recentChats.length === 0) && typeof WPP !== 'undefined' && WPP.whatsapp && WPP.whatsapp.ChatStore) {
            try {
              if (typeof WPP.whatsapp.ChatStore.getModelsArray === 'function') {
                recentChats = WPP.whatsapp.ChatStore.getModelsArray();
              }
            } catch (err) {
              console.warn('[OpenMsg Bridge] ChatStore fallback error:', err);
            }
          }

          let list = (recentChats || [])
            .filter(c => c && (c.id && (c.id._serialized || typeof c.id === 'string')))
            .slice(0, 300)
            .map(c => {
              const rawId = (c.id && c.id._serialized) ? c.id._serialized : String(c.id || '');
              const phone = (c.id && c.id.user) ? c.id.user : rawId.replace(/@.*$/, '');
              const name = c.name || c.formattedTitle || (c.contact && (c.contact.name || c.contact.pushname)) || phone || 'Chat';
              const lastMsgObj = c.lastMessage || (c.msgs && c.msgs.length ? (c.msgs.last ? c.msgs.last() : c.msgs[c.msgs.length - 1]) : null);
              const lastMsgText = extractMessageContent(lastMsgObj);
              const rawTime = (lastMsgObj && (lastMsgObj.t || lastMsgObj.timestamp)) || c.t || c.lastMessageTime || c.timestamp || 0;
              const time = rawTime ? (rawTime < 1e11 ? rawTime * 1000 : rawTime) : Date.now();
              return {
                id: rawId,
                phone: phone,
                name: name,
                isGroup: Boolean(c.isGroup || rawId.includes('@g.us')),
                unreadCount: c.unreadCount || 0,
                lastMessage: lastMsgText || '',
                timestamp: time
              };
            });

          // Fallback 2: Direct DOM Extraction from WhatsApp Web left pane (#pane-side)
          if (list.length === 0) {
            try {
              const rows = document.querySelectorAll('#pane-side [role="row"], #pane-side div[data-testid="cell-frame-container"]');
              const domList = [];
              rows.forEach((row, idx) => {
                try {
                  const titleEl = row.querySelector('span[title], div[title]');
                  const title = titleEl ? (titleEl.getAttribute('title') || titleEl.textContent) : '';
                  const snippetEl = row.querySelector('span[dir="auto"], span[title]');
                  const snippet = snippetEl ? snippetEl.textContent : '';
                  const badgeEl = row.querySelector('span[aria-label*="unread" i], span[aria-label*="nachricht" i]');
                  const unread = badgeEl ? parseInt(badgeEl.textContent || '1', 10) : 0;
                  if (title && !title.toLowerCase().includes('search')) {
                    const clean = title.replace(/\D+/g, '') || ('chat_' + idx);
                    domList.push({
                      id: clean + '@c.us',
                      phone: clean,
                      name: title,
                      isGroup: false,
                      unreadCount: unread,
                      lastMessage: snippet || '',
                      timestamp: Date.now() - idx * 60000
                    });
                  }
                } catch(e) {}
              });
              if (domList.length > 0) list = domList;
            } catch(e) {}
          }

          reply(true, list);
          break;
        }

        case 'GET_CHAT_MESSAGES': {
          let to = resolveTargetJid(payload.phone || payload.chatId || '');
          let msgs = [];
          try {
            if (typeof WPP !== 'undefined' && WPP.chat && typeof WPP.chat.getMessages === 'function') {
              msgs = await WPP.chat.getMessages(to, { count: payload.count || 60 });
            }
          } catch(e) {
            console.warn('[OpenMsg Bridge] GET_CHAT_MESSAGES error:', e);
          }

          // Fallback 1: ChatStore msgs model array
          if ((!msgs || msgs.length === 0) && typeof WPP !== 'undefined' && WPP.whatsapp && WPP.whatsapp.ChatStore) {
            try {
              const chat = WPP.whatsapp.ChatStore.get(to);
              if (chat && chat.msgs && typeof chat.msgs.getModelsArray === 'function') {
                msgs = chat.msgs.getModelsArray().slice(-(payload.count || 60));
              }
            } catch(e) {}
          }

          const list = (msgs || []).map(m => {
            const fromMe = Boolean(m.fromMe || (m.id && m.id.fromMe));
            const textContent = extractMessageContent(m);
            const msgType = String(m.type || 'chat').toLowerCase();
            const rawTime = (m.t || m.timestamp);
            const time = rawTime ? (rawTime < 1e11 ? rawTime * 1000 : rawTime) : Date.now();
            return {
              id: m.id ? (m.id._serialized || m.id) : ('msg_' + Math.random().toString(36).substring(2)),
              fromMe: fromMe,
              body: textContent,
              type: msgType,
              caption: m.caption || '',
              mediaUrl: m.clientUrl || m.deprecatedMms3Url || '',
              filename: m.filename || '',
              timestamp: time,
              status: m.ack === 3 ? 'read' : (m.ack === 2 ? 'delivered' : 'sent')
            };
          });
          reply(true, list);
          break;
        }

        case 'MARK_CHAT_READ': {
          let to = resolveTargetJid(payload.phone || payload.chatId || '');
          try {
            if (typeof WPP !== 'undefined' && WPP.chat && typeof WPP.chat.markIsRead === 'function') {
              await WPP.chat.markIsRead(to);
            }
          } catch(e) {}
          reply(true, { marked: true });
          break;
        }

        case 'GET_WA_LABELS': {
          try {
            const labels = await WPP.labels.getList();
            const labelList = (labels || []).map(l => ({
              id: l.id || l.ID,
              name: l.name || l.Name || l.defaultName,
              color: l.color || l.colorIndex
            }));
            reply(true, labelList);
          } catch (e) {
            reply(true, []);
          }
          break;
        }

        case 'GET_CONTACTS_BY_LABEL': {
          try {
            const labelContacts = await WPP.labels.getContacts(payload.labelId);
            const list = (labelContacts || []).map(c => ({
              phone: c.id ? c.id.user : '',
              name: c.name || c.pushname || ''
            }));
            reply(true, list);
          } catch (e) {
            reply(true, []);
          }
          break;
        }

        default:
          reply(false, null, 'Unknown action: ' + action);
      }
    } catch (err) {
      reply(false, null, err);
    }
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initWPP();
  } else {
    document.addEventListener('DOMContentLoaded', initWPP);
  }
})();
`;

// Helper: inject script content into Main Page World using DOM <script> element
function injectScriptToMainWorld(content) {
  try {
    const script = document.createElement('script');
    script.textContent = content;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (err) {
    console.error('[Preload WA] Script tag injection error:', err);
  }
}

// Inject WPP and pageBridge into page world
function injectEngine() {
  try {
    if (wppScriptContent) {
      injectScriptToMainWorld(wppScriptContent);
      try { webFrame.executeJavaScript(wppScriptContent); } catch(e) {}
    }
    injectScriptToMainWorld(pageBridgeScript);
    try { webFrame.executeJavaScript(pageBridgeScript); } catch(e) {}
    console.log('[Preload WA] Injected WPPConnect & Page Bridge into Main World');
  } catch (err) {
    console.error('[Preload WA] Failed to inject engine:', err);
  }
}

// Pending request callbacks map
const pendingCalls = new Map();

window.addEventListener('message', (ev) => {
  if (!ev.data) return;

  // Handle messages from page context back to preload
  if (ev.data.source === 'openmsg-desktop-page') {
    const { id, success, data, error } = ev.data;
    if (pendingCalls.has(id)) {
      const cb = pendingCalls.get(id);
      pendingCalls.delete(id);
      if (success) {
        cb.resolve(data);
      } else {
        cb.reject(new Error(error));
      }
    }
    return;
  }

  // Handle events emitted by page bridge
  if (ev.data.type === 'WA_STATUS_UPDATE') {
    ipcRenderer.send('wa:status-update', ev.data);
  } else if (ev.data.type === 'WA_QR_CODE') {
    ipcRenderer.send('wa:qr-code', {
      qr: ev.data.qr,
      qrDataUrl: ev.data.qrDataUrl || null
    });
  } else if (ev.data.type === 'WA_INCOMING_MSG') {
    ipcRenderer.send('wa:incoming-msg', ev.data.msg);
  }
});

function callPage(action, payload) {
  return new Promise((resolve, reject) => {
    const id = 'call_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    pendingCalls.set(id, { resolve, reject });

    window.postMessage({
      source: 'openmsg-desktop-preload',
      id,
      action,
      payload
    }, '*');

    // 45s timeout
    setTimeout(() => {
      if (pendingCalls.has(id)) {
        pendingCalls.delete(id);
        reject(new Error(`Call ${action} timed out after 45s`));
      }
    }, 45000);
  });
}

// Listen for IPC commands from Main process and dispatch to WhatsApp Web
ipcRenderer.on('wa:exec', async (event, { action, payload, correlationId }) => {
  try {
    const result = await callPage(action, payload);
    ipcRenderer.send(`wa:exec-response:${correlationId}`, { success: true, result });
  } catch (err) {
    ipcRenderer.send(`wa:exec-response:${correlationId}`, {
      success: false,
      error: err.message || String(err)
    });
  }
});

// Run injection on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectEngine);
} else {
  injectEngine();
}

// ─── Preload-Level Redundant DOM Observer ──────────────────────────────────
// Serves as an additional guarantee to catch the QR canvas and data-ref
let lastPreloadQrRef = null;
let lastPreloadCanvasData = null;

function preloadScanQr() {
  try {
    const isChatListVisible = !!(
      document.querySelector('#pane-side') ||
      document.querySelector('[data-testid="chat-list"]')
    );
    if (isChatListVisible) {
      return;
    }

    const qrContainer = document.querySelector('[data-ref]');
    const ref = qrContainer ? qrContainer.getAttribute('data-ref') : null;

    let canvas = qrContainer ? (qrContainer.querySelector('canvas') || qrContainer) : null;
    if (!canvas || canvas.tagName !== 'CANVAS') {
      canvas = document.querySelector('canvas[aria-label*="QR" i]') ||
               document.querySelector('canvas[aria-label*="Scan" i]') ||
               document.querySelector('div[data-testid="qrcode"] canvas') ||
               document.querySelector('canvas');
    }

    let canvasData = null;
    if (canvas && canvas.tagName === 'CANVAS') {
      try {
        canvasData = canvas.toDataURL('image/png');
      } catch (e) {}
    }

    if (ref || canvasData) {
      if (ref !== lastPreloadQrRef || (canvasData && canvasData !== lastPreloadCanvasData)) {
        lastPreloadQrRef = ref;
        lastPreloadCanvasData = canvasData;
        ipcRenderer.send('wa:qr-code', {
          qr: ref,
          qrDataUrl: canvasData
        });
      }
    }
  } catch (e) {}
}

setInterval(preloadScanQr, 1000);
setTimeout(preloadScanQr, 500);
