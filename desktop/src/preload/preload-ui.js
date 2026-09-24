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
  refreshAccountQr:  (id) => ipcRenderer.invoke('accounts:refresh-qr', { id }),
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

  // ─── Dashboard Stats (Phase 7A) ─────────────────────────
  getDashboardStats: () => ipcRenderer.invoke('dashboard:get-stats'),

  // ─── Google Maps Scraper (Phase 7B) ──────────────────────
  startMapsScraper: (keyword, city, maxResults) => ipcRenderer.invoke('maps:start', { keyword, city, maxResults }),
  stopMapsScraper:  () => ipcRenderer.invoke('maps:stop'),
  getMapLeads:      () => ipcRenderer.invoke('maps:get-leads'),
  clearMapLeads:    () => ipcRenderer.invoke('maps:clear-leads'),

  // ─── Group Link Finder & Auto Joiner (Phase 7C) ──────────
  findGroupLinks: (keyword, maxPages) => ipcRenderer.invoke('groups:find-links', { keyword, maxPages }),
  stopGroupFinder: () => ipcRenderer.invoke('groups:stop-find'),
  startGroupJoin: (accountId, links, delaySeconds) => ipcRenderer.invoke('groups:start-join', { accountId, links, delaySeconds }),
  stopGroupJoin:  () => ipcRenderer.invoke('groups:stop-join'),

  // ─── Account Warmer (Phase 7D) ───────────────────────────
  startWarmer:       (config) => ipcRenderer.invoke('warmer:start', { config }),
  stopWarmer:        () => ipcRenderer.invoke('warmer:stop'),
  pauseWarmer:       () => ipcRenderer.invoke('warmer:pause'),
  resumeWarmer:      () => ipcRenderer.invoke('warmer:resume'),
  getWarmerStatus:   () => ipcRenderer.invoke('warmer:status'),
  getWarmerConfig:   () => ipcRenderer.invoke('warmer:get-config'),
  saveWarmerConfig:  (config) => ipcRenderer.invoke('warmer:save-config', { config }),
  getWarmerStats:    () => ipcRenderer.invoke('warmer:get-stats'),
  resetWarmerStats:  () => ipcRenderer.invoke('warmer:reset-stats'),
  clearWarmerLogs:   () => ipcRenderer.invoke('warmer:clear-logs'),
  getWarmerTemplates: () => ipcRenderer.invoke('warmer:get-templates'),

  // ─── Licensing (Community Edition — always unlocked) ───
  getHwid:          () => ipcRenderer.invoke('licensing:get-hwid'),
  getLicenseStatus: () => ipcRenderer.invoke('licensing:status'),
  activateLicense:  (key) => ipcRenderer.invoke('licensing:activate', { key }),

  // ─── Live Chat & Inbox CRM ───────────────────────────────
  getChatThreads:   (accountId) => ipcRenderer.invoke('chats:threads', { accountId }),
  getChatMessages:  (phone, accountId) => ipcRenderer.invoke('chats:messages', { phone, accountId }),
  sendChatMessage:  (phone, message, accountId) => ipcRenderer.invoke('chats:send', { phone, message, accountId }),
  markChatRead:     (phone) => ipcRenderer.invoke('chats:mark-read', { phone }),
  deleteChatThread: (phone) => ipcRenderer.invoke('chats:delete-thread', { phone }),
  syncRecentChats:  (accountId) => ipcRenderer.invoke('chats:sync', { accountId }),

  // ─── Kanban Pipeline CRM (Extension Port) ───────────────
  getKanbanData:    () => ipcRenderer.invoke('kanban:get-data'),
  saveKanbanStage:  (stage) => ipcRenderer.invoke('kanban:save-stage', { stage }),
  deleteKanbanStage:(stageId) => ipcRenderer.invoke('kanban:delete-stage', { stageId }),
  saveKanbanCard:   (card) => ipcRenderer.invoke('kanban:save-card', { card }),
  moveKanbanCard:   (cardId, newStageId) => ipcRenderer.invoke('kanban:move-card', { cardId, newStageId }),
  deleteKanbanCard: (cardId) => ipcRenderer.invoke('kanban:delete-card', { cardId }),

  // ─── Canned Responses (Extension Port) ───────────────────
  getCannedResponses: () => ipcRenderer.invoke('canned:list'),
  saveCannedResponse: (canned) => ipcRenderer.invoke('canned:save', { canned }),
  deleteCannedResponse: (id) => ipcRenderer.invoke('canned:delete', { id }),

  // ─── Notes & Reminders (Extension Port) ──────────────────
  getReminders:     () => ipcRenderer.invoke('reminders:list'),
  saveReminder:     (reminder) => ipcRenderer.invoke('reminders:save', { reminder }),
  toggleReminder:   (id) => ipcRenderer.invoke('reminders:toggle', { id }),
  deleteReminder:   (id) => ipcRenderer.invoke('reminders:delete', { id }),

  // ─── Webhooks & Automations (Extension Port) ─────────────
  getWebhooks:      () => ipcRenderer.invoke('webhooks:list'),
  saveWebhook:      (webhook) => ipcRenderer.invoke('webhooks:save', { webhook }),
  deleteWebhook:    (id) => ipcRenderer.invoke('webhooks:delete', { id }),
  testWebhook:      (url, payload) => ipcRenderer.invoke('webhooks:test', { url, payload }),

  // ─── Visual Flow Builder & Chatbots ─────────────────────
  getFlows:         () => ipcRenderer.invoke('flows:list'),
  getFlow:          (id) => ipcRenderer.invoke('flows:get', { id }),
  saveFlow:         (flow) => ipcRenderer.invoke('flows:save', { flow }),
  deleteFlow:       (id) => ipcRenderer.invoke('flows:delete', { id }),
  toggleFlow:       (id, enabled) => ipcRenderer.invoke('flows:toggle', { id, enabled }),
  duplicateFlow:    (id) => ipcRenderer.invoke('flows:duplicate', { id }),
  testFlowStep:     (data) => ipcRenderer.invoke('flows:test-step', data),

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
  },
  onMapsResult: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:maps-result', h);
    return () => ipcRenderer.removeListener('event:maps-result', h);
  },
  onMapsDone: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:maps-done', h);
    return () => ipcRenderer.removeListener('event:maps-done', h);
  },
  onGroupLinkFound: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:groups-link-found', h);
    return () => ipcRenderer.removeListener('event:groups-link-found', h);
  },
  onGroupJoinProgress: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:groups-join-progress', h);
    return () => ipcRenderer.removeListener('event:groups-join-progress', h);
  },
  onWarmerProgress: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:warmer-progress', h);
    return () => ipcRenderer.removeListener('event:warmer-progress', h);
  },
  onChatMessage: (cb) => {
    const h = (e, d) => cb(d);
    ipcRenderer.on('event:chat-message', h);
    return () => ipcRenderer.removeListener('event:chat-message', h);
  }
});
