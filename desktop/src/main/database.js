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
      },
      kanbanStages: [
        { id: 'stage_lead', name: 'New Leads', color: '#7dd3fc', textColor: '#14110a', order: 0 },
        { id: 'stage_contacted', name: 'Contacted', color: '#fde047', textColor: '#14110a', order: 1 },
        { id: 'stage_qualified', name: 'Qualified', color: '#86efac', textColor: '#14110a', order: 2 },
        { id: 'stage_proposal', name: 'Proposal Sent', color: '#fdba74', textColor: '#14110a', order: 3 },
        { id: 'stage_won', name: 'Won / Closed', color: '#5eead4', textColor: '#14110a', order: 4 },
        { id: 'stage_lost', name: 'Lost', color: '#fca5a5', textColor: '#14110a', order: 5 }
      ],
      kanbanCards: [],
      cannedResponses: [
        {
          id: 'canned_intro',
          shortcut: '/intro',
          title: 'Welcome Introduction',
          category: 'Sales',
          message: 'Hello! Thank you for connecting with us. How can we help your business grow today?',
          createdAt: Date.now()
        },
        {
          id: 'canned_pricing',
          shortcut: '/pricing',
          title: 'Pricing & Plans',
          category: 'Sales',
          message: 'Our plans start from $29/mo with unlimited messaging, CRM integration, and AI bot capabilities. Would you like a 10-minute demo?',
          createdAt: Date.now()
        },
        {
          id: 'canned_support',
          shortcut: '/support',
          title: 'Customer Support',
          category: 'Support',
          message: 'Thank you for reaching out. Our support team is reviewing your inquiry and will update you shortly.',
          createdAt: Date.now()
        },
        {
          id: 'canned_thanks',
          shortcut: '/thanks',
          title: 'Closing Thank You',
          category: 'General',
          message: 'Thank you for choosing OpenMsg! Let us know if you need anything else.',
          createdAt: Date.now()
        }
      ],
      reminders: [],
      webhooks: [],
      flows: [
        {
          id: 'flow_welcome_lead',
          name: 'Welcome & Lead Qualification Flow',
          description: 'Engages new contacts, asks for their business needs, and auto-qualifies them into CRM.',
          trigger: {
            type: 'keyword',
            keywords: ['hi', 'hello', 'start', 'demo', 'info'],
            match: 'contains',
            caseSensitive: false
          },
          enabled: true,
          createdAt: Date.now(),
          nodes: [
            {
              id: 'node_start',
              type: 'start',
              title: 'Start Conversation',
              x: 80,
              y: 120,
              data: {}
            },
            {
              id: 'node_welcome',
              type: 'text',
              title: 'Welcome Message',
              x: 360,
              y: 120,
              data: {
                text: '{Hello|Hi|Greetings}! Welcome to our official WhatsApp assistant.\nHow can our team help your business today?',
                typingDelay: 1,
                wait: false
              }
            },
            {
              id: 'node_menu',
              type: 'buttons',
              title: 'Service Options',
              x: 680,
              y: 120,
              data: {
                text: 'Please select one of the options below to get started:',
                buttons: [
                  { id: 'btn_1', text: '💼 View Services' },
                  { id: 'btn_2', text: '💰 Pricing & Plans' },
                  { id: 'btn_3', text: '👨‍💼 Speak to Agent' }
                ],
                saveAs: 'selected_service'
              }
            },
            {
              id: 'node_services_info',
              type: 'text',
              title: 'Services Info',
              x: 1040,
              y: 40,
              data: {
                text: '🚀 *Our Core Services:*\n1. Automated WhatsApp CRM & Live Chat\n2. Google Maps B2B Lead Scraper\n3. High-Speed Bulk Campaign Dispatcher\n4. AI Autoresponders & Interactive Flow Builder\n\nWould you like a demo or quotation?',
                wait: false
              }
            },
            {
              id: 'node_pricing_info',
              type: 'text',
              title: 'Pricing Info',
              x: 1040,
              y: 200,
              data: {
                text: '💎 *OpenMsg Community Edition is 100% FREE & UNLOCKED!*\nAll Pro features, unlimited numbers, and anti-ban safeguards are permanently active.\n\nType *hi* anytime to see the menu again.',
                wait: false
              }
            },
            {
              id: 'node_agent_handoff',
              type: 'handoff',
              title: 'Human Agent Handoff',
              x: 1040,
              y: 380,
              data: {
                customerMessage: 'Connecting you to our senior support executive now. Please hold on for a moment! 🔔',
                agentMessage: 'Customer {{phone}} requested live agent assistance.'
              }
            }
          ],
          edges: [
            { id: 'e1', from: 'node_start', handle: 'next', to: 'node_welcome' },
            { id: 'e2', from: 'node_welcome', handle: 'next', to: 'node_menu' },
            { id: 'e3', from: 'node_menu', handle: 'option:0', to: 'node_services_info' },
            { id: 'e4', from: 'node_menu', handle: 'option:1', to: 'node_pricing_info' },
            { id: 'e5', from: 'node_menu', handle: 'option:2', to: 'node_agent_handoff' }
          ]
        }
      ],
      flowSessions: {}
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

  // ═══════════════════════════════════════════════════════
  //  LIVE CHAT / INBOX PERSISTENCE
  // ═══════════════════════════════════════════════════════
  getChatThreads(accountId = null) {
    this.data.chatThreads = this.data.chatThreads || {};
    const threads = Object.values(this.data.chatThreads);
    const filtered = accountId ? threads.filter(t => !t.accountId || t.accountId === accountId) : threads;
    return filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  getChatMessages(phone) {
    if (!phone) return [];
    const rawId = String(phone).trim();
    const cleanDigits = rawId.includes('@') ? rawId.replace(/@.*$/, '').replace(/\D+/g, '') : rawId.replace(/\D+/g, '');
    const cleanPhone = cleanDigits || rawId;
    this.data.chatMessages = this.data.chatMessages || {};
    return this.data.chatMessages[cleanPhone] || this.data.chatMessages[rawId] || [];
  }

  upsertChatThread({ accountId, phone, chatId, isGroup, name, lastMessage, timestamp, unreadCount }) {
    if (!phone && !chatId) return null;
    const rawId = String(chatId || phone || '').trim();
    const cleanDigits = rawId.includes('@') ? rawId.replace(/@.*$/, '').replace(/\D+/g, '') : rawId.replace(/\D+/g, '');
    const key = cleanDigits || rawId;
    const resolvedChatId = rawId.includes('@') ? rawId : (key.startsWith('120363') ? (key + '@g.us') : (key + '@c.us'));
    const isGrp = typeof isGroup === 'boolean' ? isGroup : Boolean(resolvedChatId.includes('@g.us') || key.startsWith('120363'));

    const ts = timestamp ? (timestamp < 1e11 ? timestamp * 1000 : timestamp) : Date.now();

    this.data.chatThreads = this.data.chatThreads || {};
    const existing = this.data.chatThreads[key] || {
      phone: key,
      chatId: resolvedChatId,
      isGroup: isGrp,
      name: name || key,
      unreadCount: 0,
      accountId
    };

    existing.chatId = resolvedChatId;
    existing.isGroup = isGrp;
    if (name && name !== key) existing.name = name;
    if (accountId) existing.accountId = accountId;
    if (lastMessage) existing.lastMessage = lastMessage;
    if (ts > (existing.timestamp || 0)) existing.timestamp = ts;
    if (typeof unreadCount === 'number') existing.unreadCount = unreadCount;

    this.data.chatThreads[key] = existing;
    this.saveSync();
    return existing;
  }

  saveChatMessage({ accountId, phone, chatId, name, fromMe, body, timestamp, type, mediaUrl, filename, skipUnread }) {
    if (!phone && !chatId) return null;
    const rawId = String(chatId || phone || '').trim();
    const cleanDigits = rawId.includes('@') ? rawId.replace(/@.*$/, '').replace(/\D+/g, '') : rawId.replace(/\D+/g, '');
    const cleanPhone = cleanDigits || rawId;
    const resolvedChatId = rawId.includes('@') ? rawId : (cleanPhone.startsWith('120363') ? (cleanPhone + '@g.us') : (cleanPhone + '@c.us'));
    const isGrp = Boolean(resolvedChatId.includes('@g.us') || cleanPhone.startsWith('120363'));

    const ts = timestamp || Date.now();

    this.data.chatThreads = this.data.chatThreads || {};
    this.data.chatMessages = this.data.chatMessages || {};

    const existingThread = this.data.chatThreads[cleanPhone] || {
      phone: cleanPhone,
      chatId: resolvedChatId,
      isGroup: isGrp,
      name: name || cleanPhone,
      unreadCount: 0,
      accountId
    };

    existingThread.chatId = resolvedChatId;
    existingThread.isGroup = isGrp;
    existingThread.lastMessage = body || '';
    existingThread.timestamp = ts;
    if (name && name !== cleanPhone) existingThread.name = name;
    if (accountId) existingThread.accountId = accountId;
    if (!fromMe && !skipUnread) existingThread.unreadCount = (existingThread.unreadCount || 0) + 1;

    this.data.chatThreads[cleanPhone] = existingThread;

    const msgEntry = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      fromMe: Boolean(fromMe),
      body: body || '',
      type: type || 'chat',
      mediaUrl: mediaUrl || '',
      filename: filename || '',
      chatId: resolvedChatId,
      timestamp: ts,
      status: fromMe ? 'sent' : 'received'
    };

    if (!this.data.chatMessages[cleanPhone]) {
      this.data.chatMessages[cleanPhone] = [];
    }
    this.data.chatMessages[cleanPhone].push(msgEntry);

    // Keep last 200 messages per contact
    if (this.data.chatMessages[cleanPhone].length > 200) {
      this.data.chatMessages[cleanPhone].shift();
    }

    this.saveSync();
    return { thread: existingThread, message: msgEntry };
  }

  markChatRead(phone) {
    if (!phone) return false;
    const rawId = String(phone).trim();
    const cleanDigits = rawId.includes('@') ? rawId.replace(/@.*$/, '').replace(/\D+/g, '') : rawId.replace(/\D+/g, '');
    const cleanPhone = cleanDigits || rawId;
    this.data.chatThreads = this.data.chatThreads || {};
    if (this.data.chatThreads[cleanPhone]) {
      this.data.chatThreads[cleanPhone].unreadCount = 0;
      this.saveSync();
      return true;
    }
    return false;
  }

  deleteChatThread(phone) {
    if (!phone) return false;
    const rawId = String(phone).trim();
    const cleanDigits = rawId.includes('@') ? rawId.replace(/@.*$/, '').replace(/\D+/g, '') : rawId.replace(/\D+/g, '');
    const cleanPhone = cleanDigits || rawId;
    this.data.chatThreads = this.data.chatThreads || {};
    this.data.chatMessages = this.data.chatMessages || {};
    delete this.data.chatThreads[cleanPhone];
    delete this.data.chatMessages[cleanPhone];
    this.saveSync();
    return true;
  }

  // ═══════════════════════════════════════════════════════
  //  KANBAN PIPELINE CRM (Chrome Extension Port)
  // ═══════════════════════════════════════════════════════
  getKanbanData() {
    this.data.kanbanStages = this.data.kanbanStages || [];
    this.data.kanbanCards = this.data.kanbanCards || [];
    if (!this.data.kanbanStages.length) {
      this.data.kanbanStages = [
        { id: 'stage_lead', name: 'New Leads', color: '#7dd3fc', textColor: '#14110a', order: 0 },
        { id: 'stage_contacted', name: 'Contacted', color: '#fde047', textColor: '#14110a', order: 1 },
        { id: 'stage_qualified', name: 'Qualified', color: '#86efac', textColor: '#14110a', order: 2 },
        { id: 'stage_proposal', name: 'Proposal Sent', color: '#fdba74', textColor: '#14110a', order: 3 },
        { id: 'stage_won', name: 'Won / Closed', color: '#5eead4', textColor: '#14110a', order: 4 },
        { id: 'stage_lost', name: 'Lost', color: '#fca5a5', textColor: '#14110a', order: 5 }
      ];
      this.saveSync();
    }
    return {
      stages: [...this.data.kanbanStages].sort((a, b) => (a.order || 0) - (b.order || 0)),
      cards: this.data.kanbanCards
    };
  }

  saveKanbanStage(stage) {
    this.data.kanbanStages = this.data.kanbanStages || [];
    if (!stage.id) {
      stage.id = 'stage_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      stage.order = this.data.kanbanStages.length;
      this.data.kanbanStages.push(stage);
    } else {
      const idx = this.data.kanbanStages.findIndex(s => s.id === stage.id);
      if (idx >= 0) {
        this.data.kanbanStages[idx] = { ...this.data.kanbanStages[idx], ...stage };
      } else {
        this.data.kanbanStages.push(stage);
      }
    }
    this.saveSync();
    return this.getKanbanData();
  }

  deleteKanbanStage(stageId) {
    this.data.kanbanStages = (this.data.kanbanStages || []).filter(s => s.id !== stageId);
    const fallbackStage = this.data.kanbanStages[0] ? this.data.kanbanStages[0].id : '';
    (this.data.kanbanCards || []).forEach(c => {
      if (c.stageId === stageId) c.stageId = fallbackStage;
    });
    this.saveSync();
    return this.getKanbanData();
  }

  saveKanbanCard(card) {
    this.data.kanbanCards = this.data.kanbanCards || [];
    if (!card.id) {
      card.id = 'kcard_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      card.createdAt = Date.now();
      card.updatedAt = Date.now();
      this.data.kanbanCards.push(card);
    } else {
      const idx = this.data.kanbanCards.findIndex(c => c.id === card.id);
      if (idx >= 0) {
        this.data.kanbanCards[idx] = { ...this.data.kanbanCards[idx], ...card, updatedAt: Date.now() };
      } else {
        card.updatedAt = Date.now();
        this.data.kanbanCards.push(card);
      }
    }
    this.saveSync();
    return this.getKanbanData();
  }

  moveKanbanCard(cardId, newStageId) {
    this.data.kanbanCards = this.data.kanbanCards || [];
    const card = this.data.kanbanCards.find(c => c.id === cardId);
    if (card) {
      card.stageId = newStageId;
      card.updatedAt = Date.now();
      this.saveSync();
      return true;
    }
    return false;
  }

  deleteKanbanCard(cardId) {
    this.data.kanbanCards = (this.data.kanbanCards || []).filter(c => c.id !== cardId);
    this.saveSync();
    return this.getKanbanData();
  }

  // ═══════════════════════════════════════════════════════
  //  CANNED RESPONSES (Chrome Extension Port)
  // ═══════════════════════════════════════════════════════
  getCannedResponses() {
    this.data.cannedResponses = this.data.cannedResponses || [];
    return this.data.cannedResponses;
  }

  saveCannedResponse(canned) {
    this.data.cannedResponses = this.data.cannedResponses || [];
    if (!canned.id) {
      canned.id = 'canned_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      canned.createdAt = Date.now();
      this.data.cannedResponses.unshift(canned);
    } else {
      const idx = this.data.cannedResponses.findIndex(c => c.id === canned.id);
      if (idx >= 0) {
        this.data.cannedResponses[idx] = { ...this.data.cannedResponses[idx], ...canned, updatedAt: Date.now() };
      } else {
        this.data.cannedResponses.unshift(canned);
      }
    }
    this.saveSync();
    return this.data.cannedResponses;
  }

  deleteCannedResponse(id) {
    this.data.cannedResponses = (this.data.cannedResponses || []).filter(c => c.id !== id);
    this.saveSync();
    return this.data.cannedResponses;
  }

  // ═══════════════════════════════════════════════════════
  //  NOTES & REMINDERS (Chrome Extension Port)
  // ═══════════════════════════════════════════════════════
  getReminders() {
    this.data.reminders = this.data.reminders || [];
    return [...this.data.reminders].sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
  }

  saveReminder(reminder) {
    this.data.reminders = this.data.reminders || [];
    if (!reminder.id) {
      reminder.id = 'rem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      reminder.createdAt = Date.now();
      reminder.completed = false;
      this.data.reminders.unshift(reminder);
    } else {
      const idx = this.data.reminders.findIndex(r => r.id === reminder.id);
      if (idx >= 0) {
        this.data.reminders[idx] = { ...this.data.reminders[idx], ...reminder };
      } else {
        this.data.reminders.unshift(reminder);
      }
    }
    this.saveSync();
    return this.getReminders();
  }

  toggleReminder(id) {
    this.data.reminders = this.data.reminders || [];
    const r = this.data.reminders.find(rem => rem.id === id);
    if (r) {
      r.completed = !r.completed;
      this.saveSync();
      return true;
    }
    return false;
  }

  deleteReminder(id) {
    this.data.reminders = (this.data.reminders || []).filter(r => r.id !== id);
    this.saveSync();
    return this.getReminders();
  }

  // ═══════════════════════════════════════════════════════
  //  WEBHOOKS & AUTOMATIONS (Chrome Extension Port)
  // ═══════════════════════════════════════════════════════
  getWebhooks() {
    this.data.webhooks = this.data.webhooks || [];
    return this.data.webhooks;
  }

  saveWebhook(wh) {
    this.data.webhooks = this.data.webhooks || [];
    if (!wh.id) {
      wh.id = 'wh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      wh.createdAt = Date.now();
      wh.enabled = wh.enabled !== false;
      this.data.webhooks.unshift(wh);
    } else {
      const idx = this.data.webhooks.findIndex(w => w.id === wh.id);
      if (idx >= 0) {
        this.data.webhooks[idx] = { ...this.data.webhooks[idx], ...wh };
      } else {
        this.data.webhooks.unshift(wh);
      }
    }
    this.saveSync();
    return this.data.webhooks;
  }

  deleteWebhook(id) {
    this.data.webhooks = (this.data.webhooks || []).filter(w => w.id !== id);
    this.saveSync();
    return this.data.webhooks;
  }

  // ═══════════════════════════════════════════════════════
  //  VISUAL FLOW BUILDER & CHATBOT ENGINE
  // ═══════════════════════════════════════════════════════
  getFlows() {
    this.data.flows = this.data.flows || [];
    return this.data.flows;
  }

  getFlow(id) {
    return (this.data.flows || []).find(f => f.id === id) || null;
  }

  saveFlow(flow) {
    this.data.flows = this.data.flows || [];
    if (!flow.id) {
      flow.id = 'flow_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      flow.createdAt = Date.now();
      flow.updatedAt = Date.now();
      flow.enabled = flow.enabled !== false;
      this.data.flows.unshift(flow);
    } else {
      const idx = this.data.flows.findIndex(f => f.id === flow.id);
      flow.updatedAt = Date.now();
      if (idx >= 0) {
        this.data.flows[idx] = { ...this.data.flows[idx], ...flow };
      } else {
        this.data.flows.unshift(flow);
      }
    }
    this.saveSync();
    return flow;
  }

  deleteFlow(id) {
    this.data.flows = (this.data.flows || []).filter(f => f.id !== id);
    this.saveSync();
    return true;
  }

  toggleFlow(id, enabled) {
    const f = (this.data.flows || []).find(flow => flow.id === id);
    if (f) {
      f.enabled = typeof enabled === 'boolean' ? enabled : !f.enabled;
      f.updatedAt = Date.now();
      this.saveSync();
      return f;
    }
    return null;
  }

  duplicateFlow(id) {
    const orig = this.getFlow(id);
    if (!orig) return null;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = 'flow_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    copy.name = `${orig.name} (Copy)`;
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    if (copy.trigger && copy.trigger.keywords) {
      copy.trigger.keywords = copy.trigger.keywords.map(k => `${k}_copy`);
    }
    this.data.flows.unshift(copy);
    this.saveSync();
    return copy;
  }

  getFlowSession(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).replace(/\D+/g, '');
    this.data.flowSessions = this.data.flowSessions || {};
    return this.data.flowSessions[cleanPhone] || null;
  }

  saveFlowSession(phone, session) {
    if (!phone) return null;
    const cleanPhone = String(phone).replace(/\D+/g, '');
    this.data.flowSessions = this.data.flowSessions || {};
    if (!session) {
      delete this.data.flowSessions[cleanPhone];
    } else {
      this.data.flowSessions[cleanPhone] = { ...session, updatedAt: Date.now() };
    }
    this.saveSync();
    return this.data.flowSessions[cleanPhone];
  }

  clearFlowSession(phone) {
    if (!phone) return false;
    const cleanPhone = String(phone).replace(/\D+/g, '');
    this.data.flowSessions = this.data.flowSessions || {};
    delete this.data.flowSessions[cleanPhone];
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
