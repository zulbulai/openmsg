/**
 * Electron Main IPC Handlers
 * Routes UI requests to Sessions, SenderQueue, AiEngine, and LocalDatabase
 * Phase 3 & 4: Campaign Scheduler, Contact Manager, XLSX Export, Resumable Validation,
 *              Label Extractor, Recent Chats Extractor, Campaign History, Speed Control
 */

const { ipcMain } = require('electron');
const { SenderQueue } = require('../shared/utils/sender-queue');
const { getHardwareId } = require('../shared/utils/hwid');
const {
  parseExcelBuffer,
  exportGroupParticipantsToXlsx,
  exportValidationResultsToXlsx,
  exportContactsToXlsx,
  exportCampaignReportToXlsx
} = require('../shared/utils/excel');
const { CampaignScheduler } = require('./campaign-scheduler');

function registerIpcHandlers({ sessionManager, db, aiEngine, getMainWindow }) {
  let activeCampaignQueue = null;
  const scheduler = new CampaignScheduler(db);

  // ─── Forward session manager events to Main Window ─────────────────────
  sessionManager.on('account-status', (data) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('event:account-status', data);
  });

  sessionManager.on('qr-code', (data) => {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) win.webContents.send('event:qr-code', data);
  });

  // ─── Scheduler trigger → auto-start campaign ───────────────────────────
  scheduler.on('schedule-triggered', async (schedule) => {
    const win = getMainWindow();
    console.log('[IPC] Scheduler triggered campaign:', schedule.id);
    if (win && !win.isDestroyed()) {
      win.webContents.send('event:schedule-triggered', { scheduleId: schedule.id, campaign: schedule.campaignPayload });
    }
    // Auto-start the campaign
    try {
      await _startCampaignInternal(schedule.campaignPayload);
    } catch (err) {
      console.error('[Scheduler] Failed to auto-start campaign:', err);
    }
  });

  // ─── Autoresponder / AI Chatbot ────────────────────────────────────────
  sessionManager.on('incoming-msg', async ({ accountId, msg }) => {
    if (!msg || !msg.body || msg.isGroup) return;

    const senderPhone = (msg.senderPhone || '').replace(/\D+/g, '');
    if (!senderPhone) return;

    const aiConfig = db.getAiConfig() || {};

    // Check blacklist / ignored numbers
    if (aiConfig.ignoreNumbers) {
      const ignoredList = aiConfig.ignoreNumbers.split(',').map(s => s.trim().replace(/\D+/g, '')).filter(Boolean);
      if (ignoredList.some(ig => senderPhone.includes(ig) || ig.includes(senderPhone))) {
        console.log(`[Autoresponder] Ignored number ${senderPhone}`);
        return;
      }
    }

    const win = getMainWindow();
    const emitLog = (logEntry) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('event:autoresponder-log', logEntry);
      }
    };

    const simulateTyping = aiConfig.simulateTyping ?? true;
    const typingDurationMs = (aiConfig.typingDuration || 2) * 1000;

    // Record incoming message in conversation history
    db.appendConversationHistory(senderPhone, { role: 'user', text: msg.body });

    // 1. Evaluate Keyword Rules first (Exact, Contains, StartsWith, EndsWith, Regex)
    const matchedRule = aiEngine.evaluateRules(msg.body, { senderPhone, phone: senderPhone });
    if (matchedRule) {
      console.log(`[Autoresponder] Matched rule "${matchedRule.trigger}" (${matchedRule.matchType}) for ${senderPhone}`);
      try {
        await sessionManager.execute('SEND_MESSAGE', {
          phone: senderPhone,
          message: matchedRule.response,
          simulateTyping,
          typingDurationMs
        }, accountId);

        db.appendConversationHistory(senderPhone, { role: 'assistant', text: matchedRule.response });

        const logEntry = db.addChatbotLog({
          accountId,
          senderPhone,
          incomingText: msg.body,
          replySource: `Rule: ${matchedRule.trigger}`,
          ruleId: matchedRule.ruleId,
          replyText: matchedRule.response,
          status: 'sent'
        });
        emitLog(logEntry);
      } catch (err) {
        console.error('[Autoresponder] Failed to send rule reply:', err);
        const logEntry = db.addChatbotLog({
          accountId,
          senderPhone,
          incomingText: msg.body,
          replySource: `Rule: ${matchedRule.trigger}`,
          ruleId: matchedRule.ruleId,
          replyText: matchedRule.response,
          status: 'failed',
          error: err.message
        });
        emitLog(logEntry);
      }
      return;
    }

    // 2. AI Intelligence Fallback (Google Gemini or OpenAI)
    if (aiConfig.enabled && aiConfig.apiKey) {
      try {
        const history = db.getConversationHistory(senderPhone, 6);
        // Exclude the last incoming user message since it's passed as prompt
        const priorHistory = history.slice(0, -1);

        const aiReply = await aiEngine.getAiResponse(msg.body, priorHistory);
        if (aiReply) {
          await sessionManager.execute('SEND_MESSAGE', {
            phone: senderPhone,
            message: aiReply,
            simulateTyping,
            typingDurationMs: Math.min(typingDurationMs + 1000, 4000)
          }, accountId);

          db.appendConversationHistory(senderPhone, { role: 'assistant', text: aiReply });

          const logEntry = db.addChatbotLog({
            accountId,
            senderPhone,
            incomingText: msg.body,
            replySource: `AI: ${aiConfig.provider === 'openai' ? 'OpenAI' : 'Gemini'}`,
            ruleId: null,
            replyText: aiReply,
            status: 'sent'
          });
          emitLog(logEntry);
          return;
        }
      } catch (err) {
        console.error('[AI Engine] Failed to get/send AI reply:', err);
      }
    }

    // 3. Fallback Default Message (if configured)
    if (aiConfig.fallbackMessage && aiConfig.fallbackMessage.trim()) {
      try {
        const fallbackText = aiEngine.renderResponse(aiConfig.fallbackMessage, { senderPhone, phone: senderPhone });
        await sessionManager.execute('SEND_MESSAGE', {
          phone: senderPhone,
          message: fallbackText,
          simulateTyping,
          typingDurationMs
        }, accountId);

        db.appendConversationHistory(senderPhone, { role: 'assistant', text: fallbackText });

        const logEntry = db.addChatbotLog({
          accountId,
          senderPhone,
          incomingText: msg.body,
          replySource: 'Fallback Default',
          ruleId: null,
          replyText: fallbackText,
          status: 'sent'
        });
        emitLog(logEntry);
      } catch (err) {
        console.error('[Autoresponder] Failed to send fallback reply:', err);
      }
    }
  });

  // ─── Internal campaign start helper ────────────────────────────────────
  async function _startCampaignInternal(campaignData) {
    const { title, template, contacts, attachments, options } = campaignData;
    const settings = db.getSettings();

    const queueOptions = {
      minDelayMs: (options?.minDelay || settings.minDelay || 5) * 1000,
      maxDelayMs: (options?.maxDelay || settings.maxDelay || 15) * 1000,
      batchSize: options?.batchSize || settings.batchSize || 25,
      batchPauseMs: (options?.batchPause || settings.batchPause || 90) * 1000,
      simulateTyping: options?.simulateTyping ?? settings.simulateTyping ?? true,
      typingDurationMs: (options?.typingDuration || settings.typingDuration || 2) * 1000
    };

    activeCampaignQueue = new SenderQueue(queueOptions);
    activeCampaignQueue.setItems(contacts, template, attachments);

    const win = getMainWindow();
    const emitProgress = (eventLabel, payload) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('event:campaign-progress', { event: eventLabel, ...payload });
      }
    };

    const campaignLogs = [];
    const campaignId = 'camp_' + Date.now();

    activeCampaignQueue.on('started', () => emitProgress('started', activeCampaignQueue.getStats()));
    activeCampaignQueue.on('item_sending', (item) => emitProgress('item_sending', { item, stats: activeCampaignQueue.getStats() }));
    activeCampaignQueue.on('item_sent', (item) => {
      campaignLogs.push({ phone: item.phone, Name: item.Name, status: 'sent', timestamp: Date.now() });
      emitProgress('item_sent', { item, stats: activeCampaignQueue.getStats() });
    });
    activeCampaignQueue.on('item_failed', (item) => {
      campaignLogs.push({ phone: item.phone, Name: item.Name, status: 'failed', error: item.error, timestamp: Date.now() });
      emitProgress('item_failed', { item, stats: activeCampaignQueue.getStats() });
    });
    activeCampaignQueue.on('delay_started', (d) => emitProgress('delay_started', { ...d, stats: activeCampaignQueue.getStats() }));
    activeCampaignQueue.on('batch_pause', (b) => emitProgress('batch_pause', { ...b, stats: activeCampaignQueue.getStats() }));
    activeCampaignQueue.on('paused', (s) => emitProgress('paused', s));
    activeCampaignQueue.on('resumed', (s) => emitProgress('resumed', s));
    activeCampaignQueue.on('completed', (stats) => {
      emitProgress('completed', stats);
      db.saveCampaign({
        id: campaignId,
        title: title || 'Bulk Campaign',
        template,
        total: stats.total,
        sent: stats.sent,
        failed: stats.failed,
        status: 'COMPLETED',
        logs: campaignLogs,
        createdAt: Date.now()
      });
    });

    activeCampaignQueue.start(async (item) => {
      return await sessionManager.execute('SEND_MESSAGE', {
        phone: item.phone,
        message: item.message,
        attachments: item.attachments || [],
        simulateTyping: item.simulateTyping,
        typingDurationMs: item.typingDurationMs
      });
    });

    return { success: true, stats: activeCampaignQueue.getStats() };
  }

  // ═══════════════════════════════════════════════════════
  //  ACCOUNTS
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('accounts:list', () => {
    const list = db.getAccounts();
    return list.map(acc => {
      const s = sessionManager.sessions.get(acc.id);
      return {
        ...acc,
        status: s ? s.status : 'OFFLINE',
        hasQr: Boolean(s && s.qr),
        qr: s ? s.qr : null,
        isActive: sessionManager.activeAccountId === acc.id
      };
    });
  });

  ipcMain.handle('accounts:create', async (event, { name }) => {
    const id = 'acc_' + Date.now();
    const newAcc = {
      id,
      name: name || `Account ${db.getAccounts().length + 1}`,
      phone: '',
      sessionPartition: `persist:wa_${id}`,
      createdAt: Date.now(),
      status: 'INITIALIZING'
    };
    db.addAccount(newAcc);
    await sessionManager.startAccount(id);
    return newAcc;
  });

  ipcMain.handle('accounts:delete', async (event, { id }) => {
    await sessionManager.removeAccount(id);
    return { success: true };
  });

  ipcMain.handle('accounts:switch', (event, { id }) => {
    sessionManager.setActiveAccount(id);
    return { success: true, activeId: id };
  });

  ipcMain.handle('accounts:get-status', (event, { id }) => {
    const s = sessionManager.sessions.get(id);
    return { id, status: s ? s.status : 'OFFLINE', qr: s ? s.qr : null };
  });

  ipcMain.handle('accounts:show-window', (event, { id }) => {
    sessionManager.showAccountWindow(id);
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════
  //  BULK CAMPAIGNS
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('campaigns:start', async (event, campaignData) => {
    return await _startCampaignInternal(campaignData);
  });

  ipcMain.handle('campaigns:pause', () => {
    if (activeCampaignQueue) { activeCampaignQueue.pause(); return { success: true }; }
    return { success: false };
  });

  ipcMain.handle('campaigns:resume', () => {
    if (activeCampaignQueue) { activeCampaignQueue.resume(); return { success: true }; }
    return { success: false };
  });

  ipcMain.handle('campaigns:stop', () => {
    if (activeCampaignQueue) { activeCampaignQueue.stop(); activeCampaignQueue = null; return { success: true }; }
    return { success: false };
  });

  ipcMain.handle('campaigns:list', () => db.getCampaigns());

  ipcMain.handle('campaigns:delete-history', (event, { id }) => {
    const all = db.getCampaigns().filter(c => c.id !== id);
    db.set('campaigns', all);
    return { success: true };
  });

  ipcMain.handle('campaigns:export-report', (event, { id }) => {
    const camp = db.getCampaigns().find(c => c.id === id);
    if (!camp) return null;
    try {
      const buf = exportCampaignReportToXlsx(camp);
      return Array.from(buf); // Send as array to renderer
    } catch (err) {
      console.error('[Export] Campaign report export failed:', err);
      return null;
    }
  });

  // ═══════════════════════════════════════════════════════
  //  CAMPAIGN SCHEDULER
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('scheduler:create', (event, { data, runAt }) => {
    const schedule = scheduler.schedule(data, runAt);
    return { success: true, schedule };
  });

  ipcMain.handle('scheduler:list', () => scheduler.getAll());

  ipcMain.handle('scheduler:cancel', (event, { id }) => {
    return { success: scheduler.cancel(id) };
  });

  // ═══════════════════════════════════════════════════════
  //  GROUP EXTRACTOR + RECENT CHATS + LABELS
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('extractor:groups', async (event, { accountId } = {}) => {
    return await sessionManager.execute('GET_GROUPS', {}, accountId);
  });

  ipcMain.handle('extractor:participants', async (event, { groupId }) => {
    return await sessionManager.execute('GET_GROUP_PARTICIPANTS', { groupId });
  });

  ipcMain.handle('extractor:export-xlsx', async (event, { groupId, groupName }) => {
    const participants = await sessionManager.execute('GET_GROUP_PARTICIPANTS', { groupId });
    if (!participants || participants.length === 0) return null;
    try {
      const buf = exportGroupParticipantsToXlsx(participants, groupName);
      return Array.from(buf);
    } catch (err) {
      console.error('[Export] Participants XLSX export failed:', err);
      return null;
    }
  });

  ipcMain.handle('extractor:export-csv', async (event, { groupId }) => {
    const participants = await sessionManager.execute('GET_GROUP_PARTICIPANTS', { groupId });
    if (!participants) return null;
    const csv = ['Phone Number,Role']
      .concat(participants.map(p => `+${p.phone},${p.isAdmin ? 'Admin' : 'Member'}`))
      .join('\n');
    return csv;
  });

  ipcMain.handle('extractor:recent-chats', async (event, { id } = {}) => {
    try {
      return await sessionManager.execute('GET_RECENT_CHATS', {}, id);
    } catch (err) {
      console.warn('[Extractor] Recent chats not available:', err.message);
      return [];
    }
  });

  ipcMain.handle('extractor:wa-labels', async (event, { accountId } = {}) => {
    try {
      return await sessionManager.execute('GET_WA_LABELS', {}, accountId);
    } catch (err) {
      console.warn('[Extractor] WA labels not available:', err.message);
      return [];
    }
  });

  ipcMain.handle('extractor:contacts-by-label', async (event, { labelId }) => {
    try {
      return await sessionManager.execute('GET_CONTACTS_BY_LABEL', { labelId });
    } catch (err) {
      console.warn('[Extractor] Contacts by label not available:', err.message);
      return [];
    }
  });

  // ═══════════════════════════════════════════════════════
  //  NUMBER FILTER & VALIDATOR (with resumable state + speed control)
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('validator:check-numbers', async (event, { numbers, options = {} }) => {
    const settings = db.getSettings();
    const delayMs = options.delayMs || settings.validationDelayMs || 200;
    const results = [];
    const win = getMainWindow();

    // Save state for resumability
    db.saveValidationState({ numbers, results: [], current: 0 });

    for (let i = 0; i < numbers.length; i++) {
      const phone = numbers[i];
      try {
        const res = await sessionManager.execute('CHECK_NUMBER', { phone });
        results.push({ phone, valid: res.exists, details: res.data || null });
      } catch (err) {
        results.push({ phone, valid: false, error: err.message });
      }

      // Update resumable state every 10 records
      if (i % 10 === 0) {
        db.saveValidationState({ numbers, results: [...results], current: i + 1 });
      }

      if (win && !win.isDestroyed()) {
        win.webContents.send('event:validator-progress', {
          current: i + 1,
          total: numbers.length,
          lastResult: results[results.length - 1]
        });
      }

      await new Promise(r => setTimeout(r, delayMs));
    }

    db.clearValidationState();
    return results;
  });

  ipcMain.handle('validator:get-state', () => db.getValidationState());

  ipcMain.handle('validator:resume', async (event) => {
    const state = db.getValidationState();
    if (!state) return { resumed: false };

    const { numbers, results: existingResults, current } = state;
    const remaining = numbers.slice(current);

    if (remaining.length === 0) {
      db.clearValidationState();
      return { resumed: false };
    }

    console.log(`[Validator] Resuming from ${current}/${numbers.length}`);

    const settings = db.getSettings();
    const results = [...existingResults];
    const win = getMainWindow();

    for (let i = 0; i < remaining.length; i++) {
      const phone = remaining[i];
      const absoluteIdx = current + i;
      try {
        const res = await sessionManager.execute('CHECK_NUMBER', { phone });
        results.push({ phone, valid: res.exists, details: res.data || null });
      } catch (err) {
        results.push({ phone, valid: false, error: err.message });
      }

      if (i % 10 === 0) {
        db.saveValidationState({ numbers, results: [...results], current: absoluteIdx + 1 });
      }

      if (win && !win.isDestroyed()) {
        win.webContents.send('event:validator-progress', {
          current: absoluteIdx + 1,
          total: numbers.length,
          lastResult: results[results.length - 1]
        });
      }

      await new Promise(r => setTimeout(r, settings.validationDelayMs || 200));
    }

    db.clearValidationState();
    return { resumed: true, results };
  });

  ipcMain.handle('validator:clear-state', () => {
    db.clearValidationState();
    return { success: true };
  });

  ipcMain.handle('validator:export-xlsx', (event, { results }) => {
    try {
      const buf = exportValidationResultsToXlsx(results, false);
      return Array.from(buf);
    } catch (err) {
      console.error('[Export] Validation XLSX export failed:', err);
      return null;
    }
  });

  ipcMain.handle('validator:export-xlsx-valid-only', (event, { results }) => {
    try {
      const buf = exportValidationResultsToXlsx(results, true);
      return Array.from(buf);
    } catch (err) {
      console.error('[Export] Validation (valid-only) XLSX export failed:', err);
      return null;
    }
  });

  // ═══════════════════════════════════════════════════════
  //  CONTACT MANAGER (Address Book)
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('contacts:list', () => db.getContacts());

  ipcMain.handle('contacts:add', (event, { contact }) => {
    return db.addContact(contact);
  });

  ipcMain.handle('contacts:update', (event, { id, updates }) => {
    return db.updateContact(id, updates);
  });

  ipcMain.handle('contacts:delete', (event, { id }) => {
    return db.deleteContact(id);
  });

  ipcMain.handle('contacts:import-excel', (event, { buf, filename }) => {
    try {
      const buffer = Buffer.from(buf);
      let contacts;

      if (filename && filename.toLowerCase().endsWith('.csv')) {
        // Simple CSV parse
        const lines = buffer.toString('utf8').split('\n').filter(Boolean);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        contacts = lines.slice(1).map((line, idx) => {
          const cols = line.split(',');
          const obj = { id: `csv_${idx}` };
          headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
          const phone = (obj.phone || obj.mobile || obj.number || '').replace(/\D+/g, '');
          if (!phone || phone.length < 7) return null;
          return {
            phone,
            Name: obj.name || obj.fullname || '',
            Company: obj.company || obj.org || '',
            tags: obj.tags || obj.tag || ''
          };
        }).filter(Boolean);
      } else {
        contacts = parseExcelBuffer(buffer);
      }

      return db.addContacts(contacts);
    } catch (err) {
      console.error('[Contacts] Import failed:', err);
      throw err;
    }
  });

  ipcMain.handle('contacts:export-xlsx', () => {
    try {
      const contacts = db.getContacts();
      const buf = exportContactsToXlsx(contacts);
      return Array.from(buf);
    } catch (err) {
      console.error('[Export] Contacts XLSX export failed:', err);
      return null;
    }
  });

  // ═══════════════════════════════════════════════════════
  //  CHATBOT & AI
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('chatbot:get-rules', () => db.getRules());
  ipcMain.handle('chatbot:save-rules', (e, { rules }) => db.saveRules(rules));
  ipcMain.handle('chatbot:get-ai-config', () => db.getAiConfig());
  ipcMain.handle('chatbot:save-ai-config', (e, { config }) => db.saveAiConfig(config));
  ipcMain.handle('chatbot:test-rule', (e, { text, phone }) => {
    return aiEngine.testRuleMatch(text, { senderPhone: phone, phone });
  });
  ipcMain.handle('chatbot:test-ai', async (e, { text, customConfig }) => {
    return await aiEngine.getAiResponse(text, [], customConfig);
  });
  ipcMain.handle('chatbot:get-logs', () => db.getChatbotLogs(100));
  ipcMain.handle('chatbot:clear-logs', () => db.clearChatbotLogs());
  ipcMain.handle('chatbot:get-history', (e, { phone }) => db.getConversationHistory(phone));
  ipcMain.handle('chatbot:clear-history', (e, { phone }) => db.clearConversationHistory(phone));

  // ═══════════════════════════════════════════════════════
  //  SETTINGS
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('settings:get', () => db.getSettings());
  ipcMain.handle('settings:save', (e, { settings }) => db.saveSettings(settings));

  // ═══════════════════════════════════════════════════════
  //  LICENSING (Community Edition — ALL FEATURES UNLOCKED)
  // ═══════════════════════════════════════════════════════
  ipcMain.handle('licensing:get-hwid', () => getHardwareId());

  ipcMain.handle('licensing:status', () => ({
    isActivated: true,
    hwid: getHardwareId(),
    plan: 'COMMUNITY_PRO_UNLIMITED',
    customer: 'Open Source Community Edition',
    expiresAt: null,
    isLifetime: true,
    message: '100% Free & Open Source — All Pro Features Fully Unlocked'
  }));

  ipcMain.handle('licensing:activate', () => ({
    success: true,
    valid: true,
    plan: 'COMMUNITY_PRO_UNLIMITED',
    customer: 'Open Source Community Edition',
    isLifetime: true
  }));
}

module.exports = { registerIpcHandlers };
