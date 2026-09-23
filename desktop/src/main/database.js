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
      mapLeads: [],          // [{ id, name, phone, address, rating, website, keyword, city, scrapedAt }]
      warmerStats: {},       // { [accountId]: { sentToday, lastSentAt, totalAllTime, lastResetDate, history7Days } }
      warmerConfig: {        // Config for automated account warmer (Phase 7D)
        dailyTarget: 30,
        minDelay: 45,
        maxDelay: 180,
        enabledCategories: ['casual', 'greetings', 'followups', 'emoji'],
        customTemplates: [],
        selectedAccounts: [],
        simulateTyping: true
      },
      warmerLogs: [],        // [{ id, timestamp, fromAccountId, toAccountId, fromPhone, toPhone, message, status }]
      warmerHistory7Days: {},// { [YYYY-MM-DD]: count }
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

  // Dashboard Aggregated Metrics
  getDashboardStats() {
    const today = new Date().toISOString().slice(0, 10);
    const accounts = this.data.accounts || [];
    const connectedAccounts = accounts.filter(a => a.status === 'CONNECTED').length;
    const campaigns = this.data.campaigns || [];
    
    // Calculate messages sent today across all campaigns
    let messagesSentToday = 0;
    campaigns.forEach(c => {
      const cDate = c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '';
      if (cDate === today) {
        messagesSentToday += (c.sent || 0);
      }
    });

    // Also include warmer messages sent today
    const warmerStats = this.data.warmerStats || {};
    Object.values(warmerStats).forEach(s => {
      if (s.lastResetDate === today) {
        messagesSentToday += (s.sentToday || 0);
      }
    });

    const activeRules = (this.data.chatbotRules || []).filter(r => r.isActive).length;
    const totalContacts = (this.data.contacts || []).length;
    const totalMapLeads = (this.data.mapLeads || []).length;

    return {
      totalAccounts: accounts.length,
      connectedAccounts,
      messagesSentToday,
      totalCampaigns: campaigns.length,
      totalContacts,
      totalMapLeads,
      activeRules,
      aiEnabled: !!(this.data.aiConfig && this.data.aiConfig.enabled)
    };
  }

  // Google Maps Leads
  getMapLeads() {
    return this.data.mapLeads || [];
  }

  addMapLeads(leads) {
    if (!Array.isArray(leads)) leads = [leads];
    this.data.mapLeads = this.data.mapLeads || [];
    let added = 0;
    leads.forEach(l => {
      if (!l.phone) return;
      const cleanPhone = String(l.phone).replace(/\D+/g, '');
      const exists = this.data.mapLeads.find(m => String(m.phone).replace(/\D+/g, '') === cleanPhone);
      if (!exists) {
        this.data.mapLeads.unshift({
          id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: l.name || 'Unknown Business',
          phone: cleanPhone,
          address: l.address || '',
          rating: l.rating || '',
          website: l.website || '',
          city: l.city || '',
          keyword: l.keyword || '',
          scrapedAt: Date.now()
        });
        added++;
      }
    });
    this.saveSync();
    return { added, total: this.data.mapLeads.length };
  }

  clearMapLeads() {
    this.data.mapLeads = [];
    this.saveSync();
    return true;
  }

  // ─── WhatsApp Account Warmer (Phase 7D) ───────────────────────────
  getWarmerConfig() {
    return {
      dailyTarget: 30,
      minDelay: 45,
      maxDelay: 180,
      enabledCategories: ['casual', 'greetings', 'followups', 'emoji'],
      customTemplates: [],
      selectedAccounts: [],
      simulateTyping: true,
      ...(this.data.warmerConfig || {})
    };
  }

  saveWarmerConfig(config) {
    this.data.warmerConfig = { ...this.getWarmerConfig(), ...config };
    this.saveSync();
    return this.data.warmerConfig;
  }

  getWarmerStats() {
    const today = new Date().toISOString().slice(0, 10);
    this.data.warmerStats = this.data.warmerStats || {};
    this.data.warmerHistory7Days = this.data.warmerHistory7Days || {};
    this.data.warmerLogs = this.data.warmerLogs || [];

    // Reset daily counters if day has changed
    let totalSentToday = 0;
    let totalAllTime = 0;
    let activeAccountsCount = 0;

    Object.keys(this.data.warmerStats).forEach(accId => {
      const stat = this.data.warmerStats[accId];
      if (stat) {
        if (stat.lastResetDate !== today) {
          stat.sentToday = 0;
          stat.lastResetDate = today;
        }
        totalSentToday += (stat.sentToday || 0);
        totalAllTime += (stat.totalAllTime || 0);
        if ((stat.sentToday || 0) > 0 || (stat.totalAllTime || 0) > 0) {
          activeAccountsCount++;
        }
      }
    });

    // Compute last 7 days activity breakdown
    const sevenDaysActivity = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const label = `${dayNames[d.getDay()]} ${d.getDate()}`;
      
      // Aggregate counts from warmerHistory7Days or account historical records
      let count = this.data.warmerHistory7Days[isoDate] || 0;
      if (!count) {
        Object.values(this.data.warmerStats).forEach(s => {
          if (s && s.history7Days && s.history7Days[isoDate]) {
            count += s.history7Days[isoDate];
          }
        });
      }

      sevenDaysActivity.push({
        date: isoDate,
        label,
        count: count || 0,
        isToday: isoDate === today
      });
    }

    return {
      accounts: this.data.warmerStats,
      totalSentToday,
      totalAllTime,
      activeAccountsCount,
      sevenDaysActivity,
      recentLogs: this.data.warmerLogs.slice(0, 50)
    };
  }

  recordWarmerMessage(payload) {
    const today = new Date().toISOString().slice(0, 10);
    this.data.warmerStats = this.data.warmerStats || {};
    this.data.warmerHistory7Days = this.data.warmerHistory7Days || {};
    this.data.warmerLogs = this.data.warmerLogs || [];

    const fromAccountId = typeof payload === 'string' ? payload : (payload.fromAccountId || payload.accountId);
    const toAccountId = typeof payload === 'object' ? payload.toAccountId : null;
    const fromPhone = typeof payload === 'object' ? payload.fromPhone : '';
    const toPhone = typeof payload === 'object' ? payload.toPhone : '';
    const message = typeof payload === 'object' ? payload.message : '';
    const status = (typeof payload === 'object' && payload.status) || 'sent';
    const error = (typeof payload === 'object' && payload.error) || null;

    if (fromAccountId) {
      if (!this.data.warmerStats[fromAccountId]) {
        this.data.warmerStats[fromAccountId] = {
          sentToday: 0,
          totalAllTime: 0,
          lastSentAt: null,
          lastResetDate: today,
          history7Days: {}
        };
      }
      const stat = this.data.warmerStats[fromAccountId];
      stat.history7Days = stat.history7Days || {};

      if (stat.lastResetDate !== today) {
        stat.sentToday = 0;
        stat.lastResetDate = today;
      }

      if (status === 'sent') {
        stat.sentToday = (stat.sentToday || 0) + 1;
        stat.totalAllTime = (stat.totalAllTime || 0) + 1;
        stat.history7Days[today] = (stat.history7Days[today] || 0) + 1;
        this.data.warmerHistory7Days[today] = (this.data.warmerHistory7Days[today] || 0) + 1;
      }
      stat.lastSentAt = Date.now();
    }

    // Append to persistent warming logs ring buffer
    const logEntry = {
      id: 'wlog_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      fromAccountId,
      toAccountId,
      fromPhone,
      toPhone,
      message: message ? message.slice(0, 200) : '',
      status,
      error
    };
    this.data.warmerLogs.unshift(logEntry);
    if (this.data.warmerLogs.length > 150) {
      this.data.warmerLogs.length = 150;
    }

    this.saveSync();
    return logEntry;
  }

  resetWarmerStats() {
    this.data.warmerStats = {};
    this.data.warmerHistory7Days = {};
    this.data.warmerLogs = [];
    this.saveSync();
    return this.getWarmerStats();
  }

  clearWarmerLogs() {
    this.data.warmerLogs = [];
    this.saveSync();
    return true;
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
