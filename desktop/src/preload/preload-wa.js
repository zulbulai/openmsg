/**
 * WhatsApp Web Preload Bridge
 * Injects WPPConnect into WhatsApp Web and handles IPC bidirectional messaging
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
  console.log('[OpenMsg Bridge] Initializing WhatsApp Web Hook...');

  let isInitialized = false;

  function initWPP() {
    if (typeof WPP === 'undefined') {
      setTimeout(initWPP, 500);
      return;
    }

    if (isInitialized) return;
    isInitialized = true;
    console.log('[OpenMsg Bridge] WPP is available, waiting for WhatsApp Web ready...');

    WPP.webpack.onReady(function() {
      console.log('[OpenMsg Bridge] WhatsApp Web webpack ready!');
      window.postMessage({ type: 'WA_BRIDGE_READY' }, '*');

      // Check auth status
      if (WPP.conn.isRegistered()) {
        const myNumber = WPP.conn.getMyUserId() ? WPP.conn.getMyUserId().user : '';
        window.postMessage({
          type: 'WA_STATUS_UPDATE',
          status: 'CONNECTED',
          phone: myNumber,
          pushname: WPP.conn.getPushname ? WPP.conn.getPushname() : ''
        }, '*');
      } else {
        window.postMessage({ type: 'WA_STATUS_UPDATE', status: 'WAITING_QR' }, '*');
      }

      // Listen for auth changes
      WPP.on('conn.authenticated', function() {
        const myNumber = WPP.conn.getMyUserId() ? WPP.conn.getMyUserId().user : '';
        window.postMessage({
          type: 'WA_STATUS_UPDATE',
          status: 'CONNECTED',
          phone: myNumber,
          pushname: WPP.conn.getPushname ? WPP.conn.getPushname() : ''
        }, '*');
      });

      WPP.on('conn.logout', function() {
        window.postMessage({ type: 'WA_STATUS_UPDATE', status: 'DISCONNECTED' }, '*');
      });

      WPP.on('conn.qrcode_counter', function(data) {
        window.postMessage({
          type: 'WA_QR_CODE',
          qr: data ? data.qr : null
        }, '*');
      });

      // Listen for incoming messages
      WPP.on('chat.msg', function(msg) {
        if (!msg || msg.fromMe) return;
        window.postMessage({
          type: 'WA_INCOMING_MSG',
          msg: {
            id: msg.id ? msg.id._serialized : '',
            from: msg.from ? msg.from._serialized : '',
            senderPhone: msg.from ? msg.from.user : '',
            body: msg.body || '',
            isGroup: msg.isGroupMsg || false,
            timestamp: msg.t || Date.now()
          }
        }, '*');
      });
    });
  }

  // Handle commands sent from preload
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
      if (typeof WPP === 'undefined') {
        throw new Error('WPPConnect not ready yet');
      }

      switch (action) {
        case 'SEND_MESSAGE': {
          let to = payload.phone.replace(/\\D+/g, '');
          if (!to.includes('@')) {
            to = to + '@c.us';
          }
          if (payload.simulateTyping) {
            try {
              await WPP.chat.markIsComposing(to, payload.typingDurationMs || 2000);
            } catch(e) {}
          }
          let sendRes;
          if (payload.attachments && payload.attachments.length > 0) {
            const att = payload.attachments[0];
            sendRes = await WPP.chat.sendFileMessage(to, att.dataUrl, {
              caption: payload.message,
              createChat: true,
              filename: att.name
            });
          } else {
            sendRes = await WPP.chat.sendTextMessage(to, payload.message, {
              createChat: true
            });
          }
          reply(true, { messageId: sendRes ? sendRes.id : null });
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

        case 'GET_STATUS': {
          const isConn = WPP.conn.isRegistered();
          reply(true, {
            connected: isConn,
            phone: isConn && WPP.conn.getMyUserId() ? WPP.conn.getMyUserId().user : ''
          });
          break;
        }

        case 'GET_RECENT_CHATS': {
          // Get individual (non-group) recent chats for Recent Chats Extractor
          const recentChats = await WPP.chat.list({ onlyContacts: false });
          const individuals = (recentChats || [])
            .filter(c => c.id && !c.isGroup && c.id._serialized && c.id._serialized.endsWith('@c.us'))
            .slice(0, 200)
            .map(c => ({
              phone: c.id ? c.id.user : '',
              name: c.name || c.formattedTitle || '',
              lastMessage: c.lastMessage ? (c.lastMessage.body || '') : '',
              timestamp: c.t || c.lastMessageTime || 0
            }));
          reply(true, individuals);
          break;
        }

        case 'GET_WA_LABELS': {
          // WhatsApp Business Labels (WA Business accounts only)
          try {
            const labels = await WPP.labels.getList();
            const labelList = (labels || []).map(l => ({
              id: l.id || l.ID,
              name: l.name || l.Name || l.defaultName,
              color: l.color || l.colorIndex
            }));
            reply(true, labelList);
          } catch (e) {
            reply(true, []); // Not a WA Business account
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

// Inject WPP and pageBridge into page world
function injectEngine() {
  try {
    if (wppScriptContent) {
      webFrame.executeJavaScript(wppScriptContent);
    }
    webFrame.executeJavaScript(pageBridgeScript);
    console.log('[Preload WA] Injected WPPConnect & Page Bridge');
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
    ipcRenderer.send('wa:qr-code', ev.data);
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
