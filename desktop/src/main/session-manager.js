/**
 * Multi-Account WhatsApp Session Manager
 * Orchestrates isolated partitions for multiple WhatsApp accounts
 * Features automatic Node.js QR code generation, background throttling protection,
 * direct DOM canvas probing, window persistence, and auto-refresh
 */

const { BrowserWindow, session, ipcMain, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');
const QRCode = require('qrcode');

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

class SessionManager extends EventEmitter {
  constructor(database) {
    super();
    this.db = database;
    this.sessions = new Map(); // accountId -> { window, status, qr, qrDataUrl, account }
    this.activeAccountId = null;
    this.isQuitting = false;
    this._setupIpcRelay();
  }

  _setupIpcRelay() {
    // Listen for events sent from preload-wa
    ipcMain.on('wa:status-update', (event, data) => {
      const accountId = this._getAccountIdByWebContents(event.sender);
      if (!accountId) return;

      const sessionObj = this.sessions.get(accountId);
      if (sessionObj) {
        sessionObj.status = data.status;
        if (data.status === 'CONNECTED') {
          sessionObj.qr = null;
          sessionObj.qrDataUrl = null;
        }
        if (data.phone) {
          sessionObj.account.phone = data.phone;
          sessionObj.account.pushname = data.pushname || '';
          this.db.updateAccount(accountId, {
            phone: data.phone,
            pushname: data.pushname || '',
            status: data.status
          });
        }
      }

      this.emit('account-status', { accountId, ...data });
    });

    ipcMain.on('wa:qr-code', async (event, data) => {
      const accountId = this._getAccountIdByWebContents(event.sender);
      if (!accountId) return;

      const sessionObj = this.sessions.get(accountId);
      let qrDataUrl = data.qrDataUrl || null;
      let rawQr = data.qr || null;

      // Extract string if rawQr is an object from WPP authCode
      if (rawQr && typeof rawQr === 'object') {
        rawQr = rawQr.fullCode || rawQr.code || rawQr.data || '';
      }

      // If we got raw QR string but no dataUrl, render it via node qrcode safely
      if (!qrDataUrl && rawQr && typeof rawQr === 'string' && rawQr.trim().length > 10) {
        try {
          qrDataUrl = await QRCode.toDataURL(rawQr.trim(), { width: 280, margin: 1 });
        } catch (e) {
          console.error('[SessionManager] Failed to create QR data URL:', e);
        }
      }

      if (sessionObj) {
        sessionObj.qr = rawQr;
        sessionObj.qrDataUrl = qrDataUrl;
        sessionObj.status = 'WAITING_QR';
      }

      this.emit('qr-code', {
        accountId,
        qr: rawQr,
        qrDataUrl
      });
    });

    ipcMain.on('wa:incoming-msg', (event, msg) => {
      const accountId = this._getAccountIdByWebContents(event.sender);
      if (this.db && msg && msg.senderPhone) {
        try {
          this.db.saveChatMessage({
            accountId,
            phone: msg.senderPhone,
            name: msg.name || msg.senderPhone,
            fromMe: Boolean(msg.fromMe),
            body: msg.body || '',
            type: msg.type || 'chat',
            mediaUrl: msg.mediaUrl || '',
            filename: msg.filename || '',
            timestamp: msg.timestamp || Date.now()
          });
        } catch (e) {
          console.warn('[SessionManager] Error saving incoming chat message:', e);
        }
      }
      this.emit('incoming-msg', { accountId, msg });
    });
  }

  _getAccountIdByWebContents(senderWebContents) {
    for (const [id, s] of this.sessions.entries()) {
      if (s.window && !s.window.isDestroyed() && s.window.webContents.id === senderWebContents.id) {
        return id;
      }
    }
    return null;
  }

  async initAllAccounts() {
    const accounts = this.db.getAccounts();
    if (accounts.length === 0) {
      // Create a default primary account
      const defaultAcc = {
        id: 'acc_primary',
        name: 'Primary WhatsApp',
        phone: '',
        sessionPartition: 'persist:wa_primary',
        createdAt: Date.now(),
        status: 'INITIALIZING'
      };
      this.db.addAccount(defaultAcc);
      await this.startAccount(defaultAcc.id);
    } else {
      for (const acc of accounts) {
        await this.startAccount(acc.id);
      }
    }
  }

  async startAccount(accountId) {
    const account = this.db.getAccounts().find(a => a.id === accountId);
    if (!account) throw new Error('Account not found');

    if (this.sessions.has(accountId)) {
      return this.sessions.get(accountId);
    }

    const partition = account.sessionPartition || `persist:wa_${accountId}`;
    const ses = session.fromPartition(partition);

    // Set User-Agent to avoid WhatsApp unsupported browser warning
    ses.setUserAgent(CHROME_USER_AGENT);

    // CRITICAL REVERSE-ENGINEERING: Strip Content-Security-Policy headers
    // so WPPConnect, Webpack chunk hooks, and WebSocket RPC can run cleanly in WhatsApp Web
    ses.webRequest.onHeadersReceived({ urls: ['https://web.whatsapp.com/*'] }, (details, callback) => {
      const responseHeaders = Object.assign({}, details.responseHeaders);
      delete responseHeaders['content-security-policy'];
      delete responseHeaders['content-security-policy-report-only'];
      delete responseHeaders['Content-Security-Policy'];
      delete responseHeaders['Content-Security-Policy-Report-Only'];
      callback({ cancel: false, responseHeaders });
    });

    // Create a hidden browser window with backgroundThrottling: false so timers & canvases never sleep
    const win = new BrowserWindow({
      show: false,
      width: 1040,
      height: 820,
      title: `WhatsApp Web — ${account.name}`,
      webPreferences: {
        session: ses,
        preload: path.join(__dirname, '../preload/preload-wa.js'),
        sandbox: false,
        contextIsolation: true,
        backgroundThrottling: false, // Critical: keeps timers & WebGL/canvas active when hidden
        nodeIntegration: false
      }
    });

    // Intercept close: hide window instead of destroying background session
    win.on('close', (e) => {
      if (!this.isQuitting) {
        e.preventDefault();
        win.hide();
      }
    });

    win.on('closed', () => {
      if (this.isQuitting) {
        this.sessions.delete(accountId);
      }
    });

    const sessionObj = {
      accountId,
      account,
      window: win,
      status: 'LOADING',
      qr: null,
      qrDataUrl: null
    };

    this.sessions.set(accountId, sessionObj);

    if (!this.activeAccountId) {
      this.activeAccountId = accountId;
    }

    // Direct Main-World WPPConnect injector & DOM probe once page finishes loading
    win.webContents.on('did-finish-load', async () => {
      try {
        const wppJsPath = path.join(__dirname, '../shared/vendor/wppconnect-wa.js');
        if (fs.existsSync(wppJsPath)) {
          const wppContent = fs.readFileSync(wppJsPath, 'utf8');
          await win.webContents.executeJavaScript(`
            if (typeof window.WPP === 'undefined') {
              try {
                ${wppContent}
                console.log('[OpenMsg Bridge] WPPConnect successfully mounted in Main World!');
              } catch(e) {
                console.error('[OpenMsg Bridge] Main World mounting error:', e);
              }
            }

            // WhatsApp Web LID Safety Hotfix — namespace scan (version-agnostic)
            try {
              function _omPatch(obj) {
                if (!obj || obj.__omLidP || typeof obj.getMeLidUserOrThrow !== 'function') return;
                obj.__omLidP = true;
                const _orig = obj.getMeLidUserOrThrow;
                obj.getMeLidUserOrThrow = function() {
                  try { const r = _orig.apply(this, arguments); if (r) return r; } catch(e) {}
                  const up2 = window.WPP && window.WPP.whatsapp && window.WPP.whatsapp.UserPrefs;
                  try { const r = up2 && typeof up2.getMaybeMeLidUser === 'function' && up2.getMaybeMeLidUser(); if (r) return r; } catch(e) {}
                  try { const r = up2 && typeof up2.getMaybeMePnUser === 'function' && up2.getMaybeMePnUser(); if (r) return r; } catch(e) {}
                  try { const r = typeof obj.getMaybeMePnUser === 'function' && obj.getMaybeMePnUser(); if (r) return r; } catch(e) {}
                  try { return window.WPP && window.WPP.conn && window.WPP.conn.getMyUserId && window.WPP.conn.getMyUserId(); } catch(e) {}
                  return null;
                };
              }
              if (window.WPP && window.WPP.whatsapp) {
                _omPatch(window.WPP.whatsapp.UserPrefs);
                try {
                  const keys = Object.keys(window.WPP.whatsapp);
                  for (let i = 0; i < keys.length; i++) {
                    try {
                      const m = window.WPP.whatsapp[keys[i]];
                      if (m && typeof m === 'object') {
                        if (typeof m.getMeLidUserOrThrow === 'function') _omPatch(m);
                        if (m.UserPrefs && typeof m.UserPrefs === 'object') _omPatch(m.UserPrefs);
                      }
                    } catch(e) {}
                  }
                } catch(e) {}
              }
            } catch(e) {}
          `);
        }
      } catch (err) {
        console.warn(`[SessionManager] WPPConnect mount notice for ${accountId}:`, err.message);
      }

      this._pollPageQrDirect(accountId);
    });

    win.loadURL('https://web.whatsapp.com', {
      userAgent: CHROME_USER_AGENT,
      httpReferrer: 'https://web.whatsapp.com/'
    });

    return sessionObj;
  }

  showAccountWindow(accountId) {
    const s = this.sessions.get(accountId);
    if (s && s.window && !s.window.isDestroyed()) {
      s.window.show();
      s.window.focus();
    }
  }

  async wakeAccountQr(accountId) {
    return await this._probeDomQrOnce(accountId);
  }

  async _probeDomQrOnce(accountId) {
    const s = this.sessions.get(accountId);
    if (!s || !s.window || s.window.isDestroyed() || s.status === 'CONNECTED') return null;

    try {
      const res = await s.window.webContents.executeJavaScript(`
        (function() {
          try {
            const isLogged = Boolean(
              document.querySelector('#pane-side') ||
              document.querySelector('[data-testid="chat-list"]') ||
              (window.WPP && window.WPP.conn && window.WPP.conn.isAuthenticated && window.WPP.conn.isAuthenticated())
            );
            if (isLogged) {
              let phone = '';
              try {
                phone = (window.WPP && window.WPP.conn && window.WPP.conn.getMyUserId()) ? window.WPP.conn.getMyUserId().user : '';
              } catch(e) {}
              return { isLogged: true, phone };
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
            const dataUrl = (canvas && canvas.tagName === 'CANVAS') ? canvas.toDataURL('image/png') : null;
            return { isLogged: false, ref, dataUrl };
          } catch(e) {
            return { error: e.message };
          }
        })()
      `);

      if (res) {
        if (res.isLogged) {
          s.status = 'CONNECTED';
          s.qr = null;
          s.qrDataUrl = null;
          if (res.phone) {
            s.account.phone = res.phone;
            this.db.updateAccount(accountId, { phone: res.phone, status: 'CONNECTED' });
          }
          this.emit('account-status', { accountId, status: 'CONNECTED', phone: res.phone });
          return { isLogged: true };
        }

        if (res.ref || res.dataUrl) {
          let finalDataUrl = res.dataUrl;
          if (!finalDataUrl && res.ref) {
            try {
              finalDataUrl = await QRCode.toDataURL(res.ref, { width: 280, margin: 1 });
            } catch(e) {}
          }

          s.qr = res.ref || s.qr;
          s.qrDataUrl = finalDataUrl || s.qrDataUrl;
          s.status = 'WAITING_QR';
          this.emit('qr-code', { accountId, qr: s.qr, qrDataUrl: s.qrDataUrl });
          return { qr: s.qr, qrDataUrl: s.qrDataUrl };
        }
      }
    } catch (err) {
      // Ignored during page navigation
    }
    return null;
  }

  _pollPageQrDirect(accountId) {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const s = this.sessions.get(accountId);
      if (!s || !s.window || s.window.isDestroyed() || s.status === 'CONNECTED' || attempts > 60) {
        clearInterval(interval);
        return;
      }
      const r = await this._probeDomQrOnce(accountId);
      if (r && r.isLogged) {
        clearInterval(interval);
      }
    }, 1200);
  }

  async refreshAccountQr(accountId) {
    const s = this.sessions.get(accountId);
    if (!s || !s.window || s.window.isDestroyed()) {
      return { success: false, error: 'Account session not active' };
    }

    try {
      await this.execute('REFRESH_QR', {}, accountId);
    } catch (e) {
      try {
        s.window.webContents.reload();
      } catch (err) {}
    }
    const probed = await this._probeDomQrOnce(accountId);
    return {
      success: true,
      qr: (probed && probed.qr) || s.qr,
      qrDataUrl: (probed && probed.qrDataUrl) || s.qrDataUrl,
      status: s.status
    };
  }

  async removeAccount(accountId) {
    const s = this.sessions.get(accountId);
    if (s && s.window && !s.window.isDestroyed()) {
      s.window.destroy();
    }
    this.sessions.delete(accountId);
    this.db.deleteAccount(accountId);

    // Clear session partition data
    try {
      const ses = session.fromPartition(`persist:wa_${accountId}`);
      await ses.clearStorageData();
    } catch (e) {
      console.warn('Error clearing session partition:', e);
    }

    if (this.activeAccountId === accountId) {
      const remaining = Array.from(this.sessions.keys());
      this.activeAccountId = remaining.length > 0 ? remaining[0] : null;
    }
  }

  getActiveAccount() {
    if (!this.activeAccountId && this.sessions.size > 0) {
      this.activeAccountId = Array.from(this.sessions.keys())[0];
    }
    return this.sessions.get(this.activeAccountId);
  }

  setActiveAccount(accountId) {
    if (this.sessions.has(accountId)) {
      this.activeAccountId = accountId;
      return true;
    }
    return false;
  }

  destroyAll() {
    this.isQuitting = true;
    for (const [id, s] of this.sessions.entries()) {
      if (s.window && !s.window.isDestroyed()) {
        try {
          s.window.destroy();
        } catch (e) {}
      }
    }
    this.sessions.clear();
  }

  execute(action, payload, accountId = null) {
    let targetId = accountId || this.activeAccountId;
    let targetSession = targetId ? this.sessions.get(targetId) : null;
    const isTargetConnected = targetSession && targetSession.window && !targetSession.window.isDestroyed() && targetSession.status === 'CONNECTED';

    // If target session is missing, destroyed, or not connected, prefer an active CONNECTED session
    if (!isTargetConnected) {
      for (const [id, s] of this.sessions.entries()) {
        if (s.window && !s.window.isDestroyed() && s.status === 'CONNECTED') {
          targetId = id;
          targetSession = s;
          break;
        }
      }
      // If none explicitly CONNECTED, pick any running window
      if (!targetSession || !targetSession.window || targetSession.window.isDestroyed()) {
        for (const [id, s] of this.sessions.entries()) {
          if (s.window && !s.window.isDestroyed()) {
            targetId = id;
            targetSession = s;
            break;
          }
        }
      }
    }

    const s = targetSession;
    if (!s || !s.window || s.window.isDestroyed()) {
      return Promise.reject(new Error(`No active WhatsApp session is running. Please link your WhatsApp in Accounts tab first.`));
    }

    return new Promise((resolve, reject) => {
      const correlationId = 'cmd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

      const timeout = setTimeout(() => {
        ipcMain.removeAllListeners(`wa:exec-response:${correlationId}`);
        reject(new Error(`Command ${action} timed out after 30s`));
      }, 30000);

      ipcMain.once(`wa:exec-response:${correlationId}`, (event, res) => {
        clearTimeout(timeout);
        if (res.success) {
          resolve(res.result);
        } else {
          reject(new Error(res.error || 'Execution failed'));
        }
      });

      s.window.webContents.send('wa:exec', { action, payload, correlationId });
    });
  }
}

module.exports = { SessionManager, CHROME_USER_AGENT };
