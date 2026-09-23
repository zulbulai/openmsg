/**
 * Multi-Account WhatsApp Session Manager
 * Orchestrates isolated partitions for multiple WhatsApp accounts
 */

const { BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const { EventEmitter } = require('events');

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

class SessionManager extends EventEmitter {
  constructor(database) {
    super();
    this.db = database;
    this.sessions = new Map(); // accountId -> { window, status, qr, account }
    this.activeAccountId = null;
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

    ipcMain.on('wa:qr-code', (event, data) => {
      const accountId = this._getAccountIdByWebContents(event.sender);
      if (!accountId) return;

      const sessionObj = this.sessions.get(accountId);
      if (sessionObj) {
        sessionObj.qr = data.qr;
      }
      this.emit('qr-code', { accountId, qr: data.qr });
    });

    ipcMain.on('wa:incoming-msg', (event, msg) => {
      const accountId = this._getAccountIdByWebContents(event.sender);
      this.emit('incoming-msg', { accountId, msg });
    });
  }

  _getAccountIdByWebContents(senderWebContents) {
    for (const [id, s] of this.sessions.entries()) {
      if (s.window && s.window.webContents.id === senderWebContents.id) {
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

    // Create a hidden browser window for this WhatsApp Web instance
    const win = new BrowserWindow({
      show: false,
      width: 1000,
      height: 800,
      title: `WhatsApp - ${account.name}`,
      webPreferences: {
        session: ses,
        preload: path.join(__dirname, '../preload/preload-wa.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    const sessionObj = {
      accountId,
      account,
      window: win,
      status: 'LOADING',
      qr: null
    };

    this.sessions.set(accountId, sessionObj);

    if (!this.activeAccountId) {
      this.activeAccountId = accountId;
    }

    win.loadURL('https://web.whatsapp.com', {
      userAgent: CHROME_USER_AGENT
    });

    win.on('closed', () => {
      this.sessions.delete(accountId);
    });

    return sessionObj;
  }

  showAccountWindow(accountId) {
    const s = this.sessions.get(accountId);
    if (s && s.window) {
      s.window.show();
      s.window.focus();
    }
  }

  async removeAccount(accountId) {
    const s = this.sessions.get(accountId);
    if (s && s.window) {
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

  execute(action, payload, accountId = null) {
    const targetId = accountId || this.activeAccountId;
    const s = this.sessions.get(targetId);
    if (!s || !s.window) {
      return Promise.reject(new Error(`Account ${targetId} is not running`));
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

module.exports = { SessionManager };
