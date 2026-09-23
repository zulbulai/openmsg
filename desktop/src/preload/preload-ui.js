/**
 * Renderer UI Preload Bridge
 * Secure ContextBridge exposing safe IPC methods to the Dashboard UI
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ─── Accounts ───────────────────────────────────────────
  getAccounts:       () => ipcRenderer.invoke('accounts:list'),
  createAccount:     (name) => ipcRenderer.invoke('accounts:create', { name }),
  deleteAccount:     (id) => ipcRenderer.invoke('accounts:delete', { id }),
  switchAccount:     (id) => ipcRenderer.invoke('accounts:switch', { id }),
  getAccountStatus:  (id) => ipcRenderer.invoke('accounts:get-status', { id }),
  openAccountWindow: (id) => ipcRenderer.invoke('accounts:show-window', { id }),
  getRecentChats:    (id) => ipcRenderer.invoke('extractor:recent-chats', { id }),

  // ─── Bulk Campaigns ─────────────────────────────────────
  startCampaign:    (data) => ipcRenderer.invoke('campaigns:start', data),
  pauseCampaign:    () => ipcRenderer.invoke('campaigns:pause'),
  resumeCampaign:   () => ipcRenderer.invoke('campaigns:resume'),
  stopCampaign:     () => ipcRenderer.invoke('campaigns:stop'),
  getCampaigns:     () => ipcRenderer.invoke('campaigns:list'),
  deleteCampaignHistory: (id) => ipcRenderer.invoke('campaigns:delete-history', { id }),
  exportCampaignReport: (id) => ipcRenderer.invoke('campaigns:export-report', { id }),

  // ─── Campaign Scheduler ─────────────────────────────────
  scheduleCampaign:      (data, runAt) => ipcRenderer.invoke('scheduler:create', { data, runAt }),
  getScheduledCampaigns: () => ipcRenderer.invoke('scheduler:list'),
  cancelSchedule:        (id) => ipcRenderer.invoke('scheduler:cancel', { id }),

  // ─── Group Extractor ────────────────────────────────────
  getGroups:              (accountId) => ipcRenderer.invoke('extractor:groups', { accountId }),
  getGroupParticipants:   (groupId)   => ipcRenderer.invoke('extractor:participants', { groupId }),
  exportParticipantsXlsx: (groupId, groupName) => ipcRenderer.invoke('extractor:export-xlsx', { groupId, groupName }),
  exportParticipantsCsv:  (groupId)   => ipcRenderer.invoke('extractor:export-csv', { groupId }),
  getWaBizLabels:         (accountId) => ipcRenderer.invoke('extractor:wa-labels', { accountId }),
  getContactsByLabel:     (labelId)   => ipcRenderer.invoke('extractor:contacts-by-label', { labelId }),

  // ─── Number Filter & Validator ──────────────────────────
  validateNumbers:           (numbers, options) => ipcRenderer.invoke('validator:check-numbers', { numbers, options }),
  getValidationState:        () => ipcRenderer.invoke('validator:get-state'),
  resumeValidation:          () => ipcRenderer.invoke('validator:resume'),
  clearValidationState:      () => ipcRenderer.invoke('validator:clear-state'),
  exportValidationXlsx:      (results) => ipcRenderer.invoke('validator:export-xlsx', { results }),
  exportValidationValidOnly: (results) => ipcRenderer.invoke('validator:export-xlsx-valid-only', { results }),

  // ─── Contacts Address Book ──────────────────────────────
  getContacts:             () => ipcRenderer.invoke('contacts:list'),
  addContact:              (c) => ipcRenderer.invoke('contacts:add', { contact: c }),
  updateContact:           (id, updates) => ipcRenderer.invoke('contacts:update', { id, updates }),
  deleteContact:           (id) => ipcRenderer.invoke('contacts:delete', { id }),
  importContactsFromBuffer: (buf, filename) => ipcRenderer.invoke('contacts:import-excel', { buf: Array.from(new Uint8Array(buf)), filename }),
  exportContactsToXlsx:    () => ipcRenderer.invoke('contacts:export-xlsx'),

  // ─── Chatbot & AI ───────────────────────────────────────
  getChatbotRules:          () => ipcRenderer.invoke('chatbot:get-rules'),
  saveChatbotRules:         (rules) => ipcRenderer.invoke('chatbot:save-rules', { rules }),
  getAiConfig:              () => ipcRenderer.invoke('chatbot:get-ai-config'),
  saveAiConfig:             (config) => ipcRenderer.invoke('chatbot:save-ai-config', { config }),
  testChatbotRule:          (text, phone) => ipcRenderer.invoke('chatbot:test-rule', { text, phone }),
  testAiResponse:           (text, customConfig) => ipcRenderer.invoke('chatbot:test-ai', { text, customConfig }),
  getChatbotLogs:           () => ipcRenderer.invoke('chatbot:get-logs'),
  clearChatbotLogs:         () => ipcRenderer.invoke('chatbot:clear-logs'),
  getConversationHistory:   (phone) => ipcRenderer.invoke('chatbot:get-history', { phone }),
  clearConversationHistory: (phone) => ipcRenderer.invoke('chatbot:clear-history', { phone }),

  // ─── Settings & DB ──────────────────────────────────────
  getSettings:   () => ipcRenderer.invoke('settings:get'),
  saveSettings:  (settings) => ipcRenderer.invoke('settings:save', { settings }),

  // ─── Licensing (Community Edition — always unlocked) ───
  getHwid:          () => ipcRenderer.invoke('licensing:get-hwid'),
  getLicenseStatus: () => ipcRenderer.invoke('licensing:status'),
  activateLicense:  (key) => ipcRenderer.invoke('licensing:activate', { key }),

  // ─── Event Subscriptions ────────────────────────────────
  onAccountStatus: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:account-status', h);
    return () => ipcRenderer.removeListener('event:account-status', h);
  },
  onQrCode: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:qr-code', h);
    return () => ipcRenderer.removeListener('event:qr-code', h);
  },
  onCampaignProgress: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:campaign-progress', h);
    return () => ipcRenderer.removeListener('event:campaign-progress', h);
  },
  onValidatorProgress: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:validator-progress', h);
    return () => ipcRenderer.removeListener('event:validator-progress', h);
  },
  onScheduleTriggered: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:schedule-triggered', h);
    return () => ipcRenderer.removeListener('event:schedule-triggered', h);
  },
  onAutoresponderLog: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:autoresponder-log', h);
    return () => ipcRenderer.removeListener('event:autoresponder-log', h);
  }
});
