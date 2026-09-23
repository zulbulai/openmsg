/**
 * Desktop Application Local Storage Database
 * Atomic, zero-dependency, lightning-fast JSON persistence
 */

const fs = require('fs');
const path = require('path');
let app = null;
try {
  const electron = require('electron');
  app = electron.app;
} catch (e) {
  // Standalone node environment / testing
}

class LocalDatabase {
  constructor(dbPath) {
    this.dbPath = dbPath || (
      app && typeof app.getPath === 'function'
        ? path.join(app.getPath('userData'), 'openmsg_desktop_data.json')
        : path.join(__dirname, '../../openmsg_desktop_data.json')
    );
    this.data = {
      accounts: [],          // [{ id, name, phone, sessionPartition, createdAt, status }]
      campaigns: [],         // [{ id, title, template, status, total, sent, failed, createdAt, logs }]
      contacts: [],          // [{ id, phone, Name, Company, tags, createdAt }]
      scheduledCampaigns: [], // [{ id, campaignPayload, runAt, status, createdAt }]
      validationState: null, // { numbers, results, current } for resumable validation
      chatbotRules: [
        {
          id: 'rule_welcome',
          trigger: 'hello',
          matchType: 'contains',
          response: 'Hello! Thanks for reaching out. How can we help you today?',
          isActive: true
        },
        {
          id: 'rule_price',
          trigger: 'price',
          matchType: 'contains',
          response: 'Our current plans start from just $19/mo! Check out our catalog or reply 1 to speak with an agent.',
          isActive: true
        }
      ],
      chatbotLogs: [],        // [{ id, timestamp, accountId, senderPhone, incomingText, replySource, ruleId, replyText, status }]
      conversationHistory: {}, // { [phone]: [ { role: 'user' | 'assistant', text, timestamp } ] }
      aiConfig: {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-1.5-flash',
        systemPrompt: 'You are an intelligent, helpful WhatsApp customer support agent for our company. Keep your responses friendly, concise, and helpful.',
        enabled: false,
        temperature: 0.7,
        maxTokens: 300,
        fallbackMessage: 'Thank you for reaching out! A representative will connect with you shortly.',
        simulateTyping: true,
        typingDuration: 2,
        ignoreNumbers: ''
      },
      settings: {
        minDelay: 6,
        maxDelay: 18,
        batchSize: 20,
        batchPause: 90,
        simulateTyping: true,
        typingDuration: 3,
        autoStartOnBoot: false,
        validationDelayMs: 200
      },
      license: {
        key: '',
        activatedAt: null,
        plan: 'COMMUNITY_PRO_UNLIMITED',
        expiresAt: null
      }
    };

    this.init();
  }

  init() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } else {
        this.saveSync();
      }
    } catch (err) {
      console.error('[Database] Failed to initialize DB:', err);
    }
  }

  saveSync() {
    try {
      const tmpPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.dbPath);
    } catch (err) {
      console.error('[Database] Failed to save sync:', err);
    }
  }

  // Collection getters & setters
  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this.saveSync();
    return val;
  }

  // Account helpers
  getAccounts() {
    return this.data.accounts || [];
  }

  addAccount(account) {
    this.data.accounts = this.data.accounts || [];
    const existing = this.data.accounts.find(a => a.id === account.id);
    if (existing) {
      Object.assign(existing, account);
    } else {
      this.data.accounts.push(account);
    }
    this.saveSync();
    return account;
  }

  updateAccount(id, updates) {
    const acc = (this.data.accounts || []).find(a => a.id === id);
    if (acc) {
      Object.assign(acc, updates);
      this.saveSync();
    }
    return acc;
  }

  deleteAccount(id) {
    this.data.accounts = (this.data.accounts || []).filter(a => a.id !== id);
    this.saveSync();
    return true;
  }

  // Campaign helpers
  getCampaigns() {
    return this.data.campaigns || [];
  }

  saveCampaign(campaign) {
    this.data.campaigns = this.data.campaigns || [];
    const idx = this.data.campaigns.findIndex(c => c.id === campaign.id);
    if (idx >= 0) {
      this.data.campaigns[idx] = campaign;
    } else {
      this.data.campaigns.unshift(campaign);
    }
    this.saveSync();
    return campaign;
  }

  // Chatbot rules
  getRules() {
    return this.data.chatbotRules || [];
  }

  saveRules(rules) {
    this.data.chatbotRules = rules;
    this.saveSync();
    return rules;
  }

  // AI Config
  getAiConfig() {
    return this.data.aiConfig || {};
  }

  saveAiConfig(config) {
    this.data.aiConfig = { ...this.data.aiConfig, ...config };
    this.saveSync();
    return this.data.aiConfig;
  }

  // Chatbot Activity Logs
  getChatbotLogs(limit = 100) {
    const logs = this.data.chatbotLogs || [];
    return logs.slice(0, limit);
  }

  addChatbotLog(log) {
    this.data.chatbotLogs = this.data.chatbotLogs || [];
    const entry = {
      id: 'cblog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      ...log
    };
    this.data.chatbotLogs.unshift(entry);
    if (this.data.chatbotLogs.length > 200) {
      this.data.chatbotLogs = this.data.chatbotLogs.slice(0, 200);
    }
    this.saveSync();
    return entry;
  }

  clearChatbotLogs() {
    this.data.chatbotLogs = [];
    this.saveSync();
    return true;
  }

  // Conversation history for multi-turn AI context
  getConversationHistory(phone, limit = 6) {
    if (!phone) return [];
    this.data.conversationHistory = this.data.conversationHistory || {};
    const list = this.data.conversationHistory[phone] || [];
    return list.slice(-limit);
  }

  appendConversationHistory(phone, message) {
    if (!phone || !message) return;
    this.data.conversationHistory = this.data.conversationHistory || {};
    if (!this.data.conversationHistory[phone]) {
      this.data.conversationHistory[phone] = [];
    }
    this.data.conversationHistory[phone].push({
      role: message.role || 'user',
      text: message.text || '',
      timestamp: Date.now()
    });
    if (this.data.conversationHistory[phone].length > 12) {
      this.data.conversationHistory[phone] = this.data.conversationHistory[phone].slice(-12);
    }
    this.saveSync();
  }

  clearConversationHistory(phone) {
    this.data.conversationHistory = this.data.conversationHistory || {};
    if (phone) {
      delete this.data.conversationHistory[phone];
    } else {
      this.data.conversationHistory = {};
    }
    this.saveSync();
    return true;
  }

  // Settings
  getSettings() {
    return this.data.settings || {};
  }

  saveSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveSync();
    return this.data.settings;
  }

  // License
  getLicense() {
    return this.data.license || {};
  }

  saveLicense(license) {
    this.data.license = { ...this.data.license, ...license };
    this.saveSync();
    return this.data.license;
  }
  // Contacts Address Book
  getContacts() {
    return this.data.contacts || [];
  }

  addContact(contact) {
    this.data.contacts = this.data.contacts || [];
    const existing = this.data.contacts.find(c => c.id === contact.id || c.phone === contact.phone);
    if (existing) {
      Object.assign(existing, contact, { updatedAt: Date.now() });
    } else {
      this.data.contacts.unshift({ ...contact, id: contact.id || ('ct_' + Date.now()), createdAt: Date.now() });
    }
    this.saveSync();
    return contact;
  }

  addContacts(contacts) {
    let added = 0;
    for (const c of contacts) {
      const exists = (this.data.contacts || []).find(e => e.phone === c.phone);
      if (!exists) {
        this.data.contacts.unshift({ ...c, id: c.id || ('ct_' + Date.now() + '_' + added), createdAt: Date.now() });
        added++;
      }
    }
    this.saveSync();
    return added;
  }

  updateContact(id, updates) {
    const c = (this.data.contacts || []).find(c => c.id === id);
    if (c) {
      Object.assign(c, updates, { updatedAt: Date.now() });
      this.saveSync();
    }
    return c;
  }

  deleteContact(id) {
    this.data.contacts = (this.data.contacts || []).filter(c => c.id !== id);
    this.saveSync();
    return true;
  }

  // Validation State (for resumable validation)
  getValidationState() {
    return this.data.validationState || null;
  }

  saveValidationState(state) {
    this.data.validationState = state;
    this.saveSync();
  }

  clearValidationState() {
    this.data.validationState = null;
    this.saveSync();
  }
}

let dbInstance = null;
function getDatabase(dbPath) {
  if (!dbInstance) {
    dbInstance = new LocalDatabase(dbPath);
  }
  return dbInstance;
}

module.exports = {
  LocalDatabase,
  getDatabase
};
