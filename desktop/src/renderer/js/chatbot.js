/**
 * AI Assistant & Keyword Autoresponder Studio Controller
 * Handles Keyword Rules CRUD + Modal, Google Gemini & OpenAI configuration,
 * Live WhatsApp chat simulator with typing bubbles, and real-time activity event logs.
 */

window.addEventListener('DOMContentLoaded', async () => {
  // ─── Sub-tab navigation ───────────────────────────────────────────────────
  const subtabButtons = document.querySelectorAll('#pane-chatbot .extractor-tab-btn');
  const subtabPanes = document.querySelectorAll('#pane-chatbot .extractor-tab-pane');

  subtabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSubtab = btn.getAttribute('data-subtab');
      subtabButtons.forEach(b => b.classList.remove('active'));
      subtabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(targetSubtab);
      if (pane) pane.classList.add('active');

      if (targetSubtab === 'cb-tab-logs') {
        loadActivityLogs();
      }
    });
  });

  // ─── Preset System Prompts ────────────────────────────────────────────────
  const PRESET_PROMPTS = {
    support: `You are a courteous, professional customer support agent for our company.
- Answer user queries promptly and concisely.
- If you don't know the exact answer, politely ask them to leave their email or phone number for an agent follow-up.
- Keep responses friendly and under 80 words.`,
    
    ecommerce: `You are a helpful e-commerce sales and order assistant on WhatsApp.
- Help customers browse products, check order status, and answer shipping/return questions.
- Encourage purchases by highlighting current promotions and fast shipping.
- Maintain an energetic, helpful tone. Use emojis tastefully.`,

    realestate: `You are an elite real estate consultant assistant.
- Assist prospective buyers and renters with property inquiries, pricing, and location details.
- Collect client preferences: Budget, preferred locations, and number of bedrooms.
- Offer to schedule a site visit or consultation with our senior property manager.`,

    booking: `You are an appointment scheduling assistant.
- Inquire about the customer's desired service, preferred date, and time slot.
- Confirm available slots and remind them of our 24-hour cancellation policy.
- Keep answers structured with bullet points.`,

    restaurant: `You are a friendly dining & delivery host for our restaurant.
- Share today's special dishes, help customers view the menu, and take delivery orders.
- Answer questions regarding dietary requirements (vegan, gluten-free, halal, spicy level).
- Always include an estimate of 30-45 minutes for delivery.`
  };

  // ─── Keyword Rules Controller ─────────────────────────────────────────────
  const rulesTableBody = document.getElementById('rulesTableBody');
  const rulesCountBadge = document.getElementById('rulesCountBadge');
  const ruleSearchInput = document.getElementById('ruleSearchInput');
  const ruleTypeFilter = document.getElementById('ruleTypeFilter');
  const btnOpenAddRuleModal = document.getElementById('btnOpenAddRuleModal');

  // Modal elements
  const ruleModal = document.getElementById('ruleModal');
  const ruleModalTitle = document.getElementById('ruleModalTitle');
  const closeRuleModal = document.getElementById('closeRuleModal');
  const btnCancelRuleModal = document.getElementById('btnCancelRuleModal');
  const btnSaveRuleModal = document.getElementById('btnSaveRuleModal');
  const modalRuleId = document.getElementById('modalRuleId');
  const modalRuleTrigger = document.getElementById('modalRuleTrigger');
  const modalRuleMatchType = document.getElementById('modalRuleMatchType');
  const modalRuleResponse = document.getElementById('modalRuleResponse');
  const modalRuleIsActive = document.getElementById('modalRuleIsActive');
  const modalRuleTestInput = document.getElementById('modalRuleTestInput');
  const btnModalRuleTest = document.getElementById('btnModalRuleTest');
  const modalRuleTestResult = document.getElementById('modalRuleTestResult');

  let currentRules = [];

  async function loadRules() {
    try {
      currentRules = await window.api.getChatbotRules() || [];
      renderRulesTable();
    } catch (e) {
      console.warn('Failed to load chatbot rules:', e);
    }
  }

  function renderRulesTable() {
    rulesTableBody.innerHTML = '';

    const searchTerm = (ruleSearchInput.value || '').toLowerCase().trim();
    const typeFilter = ruleTypeFilter.value || '';

    const filtered = currentRules.filter(r => {
      const matchText = (r.trigger || '').toLowerCase().includes(searchTerm) ||
                        (r.response || '').toLowerCase().includes(searchTerm);
      const matchType = !typeFilter || r.matchType === typeFilter;
      return matchText && matchType;
    });

    const activeCount = currentRules.filter(r => r.isActive).length;
    rulesCountBadge.textContent = `${activeCount} Active / ${currentRules.length} Total Rules`;

    if (filtered.length === 0) {
      rulesTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted" style="padding: 32px 16px;">
            ${currentRules.length === 0 
              ? 'No automated rules configured. Click <strong>"+ Add Keyword Rule"</strong> to set up auto-replies.'
              : 'No rules match your search filter.'}
          </td>
        </tr>`;
      return;
    }

    filtered.forEach((rule) => {
      const originalIndex = currentRules.findIndex(r => r.id === rule.id);
      const tr = document.createElement('tr');

      const matchBadgeColors = {
        contains: 'background:rgba(56,189,248,0.15); color:#38bdf8;',
        exact: 'background:rgba(16,185,129,0.15); color:#10b981;',
        startswith: 'background:rgba(251,191,36,0.15); color:#fbbf24;',
        endswith: 'background:rgba(139,92,246,0.15); color:#a78bfa;',
        regex: 'background:rgba(236,72,153,0.15); color:#f472b6;'
      };

      const badgeStyle = matchBadgeColors[rule.matchType] || 'background:rgba(255,255,255,0.1); color:#fff;';

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700; color:#38bdf8;">
          ${escapeHtml(rule.trigger)}
        </td>
        <td>
          <span class="badge" style="${badgeStyle}">${escapeHtml(rule.matchType.toUpperCase())}</span>
        </td>
        <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-dim);" title="${escapeHtml(rule.response)}">
          ${escapeHtml(rule.response)}
        </td>
        <td style="text-align:center;">
          <label class="toggle-switch">
            <input type="checkbox" class="rule-active-toggle" data-id="${rule.id}" ${rule.isActive ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </td>
        <td style="text-align:right;">
          <div class="flex-gap" style="justify-content: flex-end;">
            <button class="btn btn-outline btn-xs btn-edit-rule" data-id="${rule.id}">✏️ Edit</button>
            <button class="btn btn-outline btn-xs btn-delete-rule" data-id="${rule.id}" style="color:#f87171;">🗑 Delete</button>
          </div>
        </td>
      `;
      rulesTableBody.appendChild(tr);
    });

    // Attach event listeners
    document.querySelectorAll('.rule-active-toggle').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = chk.getAttribute('data-id');
        const rule = currentRules.find(r => r.id === id);
        if (rule) {
          rule.isActive = chk.checked;
          await window.api.saveChatbotRules(currentRules);
          const active = currentRules.filter(r => r.isActive).length;
          rulesCountBadge.textContent = `${active} Active / ${currentRules.length} Total Rules`;
        }
      });
    });

    document.querySelectorAll('.btn-edit-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rule = currentRules.find(r => r.id === id);
        if (rule) openRuleModal(rule);
      });
    });

    document.querySelectorAll('.btn-delete-rule').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const rule = currentRules.find(r => r.id === id);
        if (!rule) return;

        if (confirm(`Are you sure you want to delete the rule for "${rule.trigger}"?`)) {
          currentRules = currentRules.filter(r => r.id !== id);
          await window.api.saveChatbotRules(currentRules);
          renderRulesTable();
          window.showToast('Rule deleted successfully', 'info');
        }
      });
    });
  }

  // Filter input listeners
  ruleSearchInput.addEventListener('input', renderRulesTable);
  ruleTypeFilter.addEventListener('change', renderRulesTable);

  // Open Modal (Add / Edit)
  function openRuleModal(rule = null) {
    if (rule) {
      ruleModalTitle.textContent = 'Edit Keyword Rule';
      modalRuleId.value = rule.id;
      modalRuleTrigger.value = rule.trigger || '';
      modalRuleMatchType.value = rule.matchType || 'contains';
      modalRuleResponse.value = rule.response || '';
      modalRuleIsActive.checked = rule.isActive ?? true;
    } else {
      ruleModalTitle.textContent = 'Add Keyword Rule';
      modalRuleId.value = '';
      modalRuleTrigger.value = '';
      modalRuleMatchType.value = 'contains';
      modalRuleResponse.value = '';
      modalRuleIsActive.checked = true;
    }
    modalRuleTestInput.value = '';
    modalRuleTestResult.style.display = 'none';
    ruleModal.style.display = 'flex';
  }

  function hideRuleModal() {
    ruleModal.style.display = 'none';
  }

  btnOpenAddRuleModal.addEventListener('click', () => openRuleModal());
  closeRuleModal.addEventListener('click', hideRuleModal);
  btnCancelRuleModal.addEventListener('click', hideRuleModal);

  // Close modal when clicking outside overlay
  ruleModal.addEventListener('click', (e) => {
    if (e.target === ruleModal) hideRuleModal();
  });

  // Tag insertion helper buttons in modal
  document.querySelectorAll('.btn-insert-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      const start = modalRuleResponse.selectionStart;
      const end = modalRuleResponse.selectionEnd;
      const text = modalRuleResponse.value;
      modalRuleResponse.value = text.substring(0, start) + tag + text.substring(end);
      modalRuleResponse.focus();
      modalRuleResponse.selectionStart = modalRuleResponse.selectionEnd = start + tag.length;
    });
  });

  // Dry-Run rule tester in modal
  btnModalRuleTest.addEventListener('click', () => {
    const testText = (modalRuleTestInput.value || '').trim();
    const trigger = (modalRuleTrigger.value || '').trim();
    const matchType = modalRuleMatchType.value;

    if (!testText || !trigger) {
      modalRuleTestResult.style.display = 'block';
      modalRuleTestResult.style.color = '#f87171';
      modalRuleTestResult.textContent = 'Please enter both a trigger and a sample test message.';
      return;
    }

    let matched = false;
    const testLower = testText.toLowerCase();
    const triggerLower = trigger.toLowerCase();

    switch (matchType) {
      case 'exact':
        matched = testLower === triggerLower;
        break;
      case 'contains':
        matched = testLower.includes(triggerLower);
        break;
      case 'startswith':
        matched = testLower.startsWith(triggerLower);
        break;
      case 'endswith':
        matched = testLower.endsWith(triggerLower);
        break;
      case 'regex':
        try {
          const rx = new RegExp(trigger, 'i');
          matched = rx.test(testText);
        } catch (e) {
          modalRuleTestResult.style.display = 'block';
          modalRuleTestResult.style.color = '#f87171';
          modalRuleTestResult.textContent = 'Invalid Regular Expression syntax: ' + e.message;
          return;
        }
        break;
    }

    modalRuleTestResult.style.display = 'block';
    if (matched) {
      modalRuleTestResult.style.color = '#34d399';
      modalRuleTestResult.innerHTML = `✅ <strong>Match Success!</strong> The message will trigger this rule.`;
    } else {
      modalRuleTestResult.style.color = '#f87171';
      modalRuleTestResult.innerHTML = `❌ <strong>No Match.</strong> Message does not satisfy the "${matchType}" condition.`;
    }
  });

  // Save Rule from Modal
  btnSaveRuleModal.addEventListener('click', async () => {
    const trigger = modalRuleTrigger.value.trim();
    const matchType = modalRuleMatchType.value;
    const response = modalRuleResponse.value.trim();
    const isActive = modalRuleIsActive.checked;
    const existingId = modalRuleId.value;

    if (!trigger) {
      window.showToast('Please enter a trigger keyword or regex pattern.', 'error');
      modalRuleTrigger.focus();
      return;
    }

    if (!response) {
      window.showToast('Please enter an automated reply message.', 'error');
      modalRuleResponse.focus();
      return;
    }

    if (matchType === 'regex') {
      try {
        new RegExp(trigger, 'i');
      } catch (e) {
        window.showToast('Invalid Regular Expression: ' + e.message, 'error');
        return;
      }
    }

    if (existingId) {
      const idx = currentRules.findIndex(r => r.id === existingId);
      if (idx !== -1) {
        currentRules[idx] = {
          ...currentRules[idx],
          trigger,
          matchType,
          response,
          isActive
        };
      }
      window.showToast('Rule updated successfully!', 'success');
    } else {
      currentRules.push({
        id: 'rule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        trigger,
        matchType,
        response,
        isActive
      });
      window.showToast('New keyword rule created!', 'success');
    }

    await window.api.saveChatbotRules(currentRules);
    renderRulesTable();
    hideRuleModal();
  });

  // ─── AI Intelligence Configuration Controller ────────────────────────────
  const aiEnabledToggle = document.getElementById('aiEnabledToggle');
  const cardProviderGemini = document.getElementById('cardProviderGemini');
  const cardProviderOpenAi = document.getElementById('cardProviderOpenAi');
  const aiProviderSelect = document.getElementById('aiProviderSelect');
  const aiModelSelect = document.getElementById('aiModelSelect');
  const aiTemperature = document.getElementById('aiTemperature');
  const tempValDisplay = document.getElementById('tempValDisplay');
  const aiApiKey = document.getElementById('aiApiKey');
  const btnToggleApiKeyVisibility = document.getElementById('btnToggleApiKeyVisibility');
  const apiKeyHelpLink = document.getElementById('apiKeyHelpLink');
  const aiTypingDuration = document.getElementById('aiTypingDuration');
  const aiMaxTokens = document.getElementById('aiMaxTokens');
  const aiIgnoreNumbers = document.getElementById('aiIgnoreNumbers');
  const aiSystemPrompt = document.getElementById('aiSystemPrompt');
  const aiFallbackMessage = document.getElementById('aiFallbackMessage');
  const btnSaveAiConfig = document.getElementById('btnSaveAiConfig');

  const MODEL_OPTIONS = {
    gemini: [
      { val: 'gemini-1.5-flash', label: 'gemini-1.5-flash (Fast & Free Tier Recommended)' },
      { val: 'gemini-1.5-pro', label: 'gemini-1.5-pro (High Intelligence & Reasoning)' },
      { val: 'gemini-2.0-flash-exp', label: 'gemini-2.0-flash-exp (Experimental Preview)' }
    ],
    openai: [
      { val: 'gpt-4o-mini', label: 'gpt-4o-mini (Fast, Efficient & Affordable)' },
      { val: 'gpt-4o', label: 'gpt-4o (State-of-the-Art Multimodal)' },
      { val: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo (Legacy Standard)' }
    ]
  };

  function updateProviderUI(provider) {
    aiProviderSelect.value = provider;
    if (provider === 'gemini') {
      cardProviderGemini.classList.add('active');
      cardProviderOpenAi.classList.remove('active');
      apiKeyHelpLink.textContent = 'Get Gemini API Key ↗';
      apiKeyHelpLink.href = 'https://aistudio.google.com/app/apikey';
    } else {
      cardProviderOpenAi.classList.add('active');
      cardProviderGemini.classList.remove('active');
      apiKeyHelpLink.textContent = 'Get OpenAI API Key ↗';
      apiKeyHelpLink.href = 'https://platform.openai.com/api-keys';
    }

    // Populate model options
    const currentVal = aiModelSelect.value;
    aiModelSelect.innerHTML = '';
    const models = MODEL_OPTIONS[provider] || [];
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.val;
      opt.textContent = m.label;
      aiModelSelect.appendChild(opt);
    });

    if (models.some(m => m.val === currentVal)) {
      aiModelSelect.value = currentVal;
    }
  }

  cardProviderGemini.addEventListener('click', () => updateProviderUI('gemini'));
  cardProviderOpenAi.addEventListener('click', () => updateProviderUI('openai'));

  // Temperature display
  aiTemperature.addEventListener('input', () => {
    tempValDisplay.textContent = aiTemperature.value;
  });

  // Toggle API Key visibility
  btnToggleApiKeyVisibility.addEventListener('click', () => {
    if (aiApiKey.type === 'password') {
      aiApiKey.type = 'text';
      btnToggleApiKeyVisibility.textContent = '🔒';
    } else {
      aiApiKey.type = 'password';
      btnToggleApiKeyVisibility.textContent = '👁';
    }
  });

  // Preset prompt chip insertion
  document.querySelectorAll('.preset-prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      if (PRESET_PROMPTS[presetKey]) {
        aiSystemPrompt.value = PRESET_PROMPTS[presetKey];
        window.showToast(`Applied ${btn.textContent.trim()} prompt template`, 'info');
      }
    });
  });

  // Load AI Config
  async function loadAiConfig() {
    try {
      const cfg = await window.api.getAiConfig() || {};
      aiEnabledToggle.checked = Boolean(cfg.enabled);
      const provider = cfg.provider || 'gemini';
      updateProviderUI(provider);

      if (cfg.model) aiModelSelect.value = cfg.model;
      aiApiKey.value = cfg.apiKey || '';
      aiTemperature.value = typeof cfg.temperature === 'number' ? cfg.temperature : 0.7;
      tempValDisplay.textContent = aiTemperature.value;
      aiTypingDuration.value = cfg.typingDuration || 2;
      aiMaxTokens.value = cfg.maxTokens || 300;
      aiIgnoreNumbers.value = cfg.ignoreNumbers || '';
      aiSystemPrompt.value = cfg.systemPrompt || '';
      aiFallbackMessage.value = cfg.fallbackMessage || '';
    } catch (e) {
      console.warn('Failed to load AI config:', e);
    }
  }

  // Save AI Config
  btnSaveAiConfig.addEventListener('click', async () => {
    const config = {
      enabled: aiEnabledToggle.checked,
      provider: aiProviderSelect.value,
      model: aiModelSelect.value,
      apiKey: aiApiKey.value.trim(),
      temperature: parseFloat(aiTemperature.value),
      typingDuration: parseInt(aiTypingDuration.value, 10),
      maxTokens: parseInt(aiMaxTokens.value, 10),
      ignoreNumbers: aiIgnoreNumbers.value.trim(),
      systemPrompt: aiSystemPrompt.value.trim(),
      fallbackMessage: aiFallbackMessage.value.trim()
    };

    btnSaveAiConfig.disabled = true;
    btnSaveAiConfig.textContent = 'Saving...';

    try {
      await window.api.saveAiConfig(config);
      window.showToast('AI configuration saved successfully!', 'success');
    } catch (e) {
      window.showToast('Failed to save AI config: ' + e.message, 'error');
    } finally {
      btnSaveAiConfig.disabled = false;
      btnSaveAiConfig.textContent = '💾 Save AI Configuration';
    }
  });

  // ─── Live WhatsApp Simulator Controller ──────────────────────────────────
  const simChatHistory = document.getElementById('simChatHistory');
  const simChatInput = document.getElementById('simChatInput');
  const btnSendSimulatorMsg = document.getElementById('btnSendSimulatorMsg');
  const btnResetSimulator = document.getElementById('btnResetSimulator');

  function appendSimBubble(text, isUser = false, meta = '') {
    const div = document.createElement('div');
    div.className = isUser ? 'sim-bubble-user' : 'sim-bubble-bot';

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const metaHtml = meta ? `<div class="sim-meta">${meta} &bull; ${now}</div>` : `<div class="sim-meta">${now}</div>`;

    div.innerHTML = `<div>${escapeHtml(text)}</div>${metaHtml}`;
    simChatHistory.appendChild(div);
    simChatHistory.scrollTop = simChatHistory.scrollHeight;
  }

  function showSimTyping() {
    const bubble = document.createElement('div');
    bubble.className = 'sim-typing-bubble';
    bubble.id = 'simTypingIndicator';
    bubble.innerHTML = `
      <div class="sim-typing-dot"></div>
      <div class="sim-typing-dot"></div>
      <div class="sim-typing-dot"></div>
    `;
    simChatHistory.appendChild(bubble);
    simChatHistory.scrollTop = simChatHistory.scrollHeight;
  }

  function hideSimTyping() {
    const indicator = document.getElementById('simTypingIndicator');
    if (indicator) indicator.remove();
  }

  async function handleSendSimulatorMessage() {
    const text = (simChatInput.value || '').trim();
    if (!text) return;

    simChatInput.value = '';
    appendSimBubble(text, true, 'Customer');

    showSimTyping();
    const startTime = Date.now();

    try {
      // 1. Test keyword rules first
      const ruleResult = await window.api.testChatbotRule(text, '12025550192');
      if (ruleResult && ruleResult.matched) {
        // Humanized simulated typing delay
        await new Promise(r => setTimeout(r, 700));
        hideSimTyping();
        const latency = Date.now() - startTime;
        appendSimBubble(
          ruleResult.renderedResponse,
          false,
          `<span style="color:#38bdf8;">Rule: "${ruleResult.trigger}" (${ruleResult.matchType}) &bull; ${latency}ms</span>`
        );
        return;
      }

      // 2. Fall back to AI if configured
      const aiConfig = await window.api.getAiConfig();
      if (aiConfig && aiConfig.enabled && aiConfig.apiKey) {
        const aiReply = await window.api.testAiResponse(text);
        hideSimTyping();
        const latency = Date.now() - startTime;
        if (aiReply) {
          appendSimBubble(
            aiReply,
            false,
            `<span style="color:#34d399;">AI: ${aiConfig.model || 'model'} &bull; ${latency}ms</span>`
          );
          return;
        }
      } else {
        hideSimTyping();
      }

      // 3. Fallback message or default
      if (aiConfig && aiConfig.fallbackMessage && aiConfig.fallbackMessage.trim()) {
        appendSimBubble(
          aiConfig.fallbackMessage,
          false,
          `<span style="color:#a78bfa;">Fallback Default</span>`
        );
      } else {
        appendSimBubble(
          "I didn't match any keyword rules and AI is currently disabled. Add a keyword rule in the Rules tab or enable Gemini/OpenAI!",
          false,
          `<span style="color:#f87171;">No Rule Match</span>`
        );
      }
    } catch (err) {
      hideSimTyping();
      appendSimBubble(
        `Error generating response: ${err.message}`,
        false,
        `<span style="color:#f87171;">Error</span>`
      );
    }
  }

  btnSendSimulatorMsg.addEventListener('click', handleSendSimulatorMessage);
  simChatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendSimulatorMessage();
  });

  btnResetSimulator.addEventListener('click', () => {
    simChatHistory.innerHTML = `
      <div class="sim-bubble-bot">
        <div>👋 Simulator reset! Send any customer message below to test your keyword rules or AI responses.</div>
        <div class="sim-meta">Simulator Bot &bull; Ready</div>
      </div>
    `;
    window.showToast('Simulator chat cleared', 'info');
  });

  // ─── Real-Time Activity Logs ──────────────────────────────────────────────
  const cbLogsTableBody = document.getElementById('cbLogsTableBody');
  const btnClearCbLogs = document.getElementById('btnClearCbLogs');
  const cbLogBadge = document.getElementById('cbLogBadge');
  let newLogCount = 0;

  async function loadActivityLogs() {
    newLogCount = 0;
    cbLogBadge.style.display = 'none';

    try {
      const logs = await window.api.getChatbotLogs() || [];
      renderActivityLogs(logs);
    } catch (e) {
      console.warn('Failed to load chatbot logs:', e);
    }
  }

  function renderActivityLogs(logs) {
    cbLogsTableBody.innerHTML = '';
    if (!logs || logs.length === 0) {
      cbLogsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No autoresponder activity recorded yet. Incoming messages will appear here live.</td></tr>';
      return;
    }

    logs.forEach(log => {
      const tr = document.createElement('tr');
      const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
      const isSuccess = log.status === 'sent';

      tr.innerHTML = `
        <td style="font-size:11px; color:var(--text-muted);">${timeStr}</td>
        <td style="font-family:var(--font-mono); font-weight:600; color:var(--text-main);">${escapeHtml(log.senderPhone || '')}</td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(log.incomingText || '')}">
          "${escapeHtml(log.incomingText || '')}"
        </td>
        <td>
          <span class="badge" style="background:rgba(56,189,248,0.15); color:#38bdf8;">${escapeHtml(log.replySource || 'Rule')}</span>
        </td>
        <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-dim);" title="${escapeHtml(log.replyText || '')}">
          ${escapeHtml(log.replyText || '')}
        </td>
        <td style="text-align:center;">
          <span class="status-badge-${isSuccess ? 'success' : 'running'}" style="font-size:10px;">
            ${isSuccess ? 'SENT' : 'FAILED'}
          </span>
        </td>
      `;
      cbLogsTableBody.appendChild(tr);
    });
  }

  btnClearCbLogs.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all autoresponder activity logs?')) {
      await window.api.clearChatbotLogs();
      loadActivityLogs();
      window.showToast('Activity logs cleared', 'info');
    }
  });

  // Listen for real-time incoming autoresponder events from Main process!
  window.api.onAutoresponderLog((log) => {
    newLogCount++;
    cbLogBadge.textContent = newLogCount;
    cbLogBadge.style.display = 'inline-block';

    // If on logs tab, prepend row immediately
    const activeTab = document.querySelector('#pane-chatbot .extractor-tab-btn.active');
    if (activeTab && activeTab.getAttribute('data-subtab') === 'cb-tab-logs') {
      const tr = document.createElement('tr');
      const timeStr = new Date(log.timestamp || Date.now()).toLocaleTimeString();
      const isSuccess = log.status === 'sent';

      tr.innerHTML = `
        <td style="font-size:11px; color:var(--text-muted);">${timeStr}</td>
        <td style="font-family:var(--font-mono); font-weight:600; color:var(--text-main);">${escapeHtml(log.senderPhone || '')}</td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(log.incomingText || '')}">
          "${escapeHtml(log.incomingText || '')}"
        </td>
        <td>
          <span class="badge" style="background:rgba(56,189,248,0.15); color:#38bdf8;">${escapeHtml(log.replySource || 'Rule')}</span>
        </td>
        <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-dim);" title="${escapeHtml(log.replyText || '')}">
          ${escapeHtml(log.replyText || '')}
        </td>
        <td style="text-align:center;">
          <span class="status-badge-${isSuccess ? 'success' : 'running'}" style="font-size:10px;">
            ${isSuccess ? 'SENT' : 'FAILED'}
          </span>
        </td>
      `;
      cbLogsTableBody.insertBefore(tr, cbLogsTableBody.firstChild);
    }
  });

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─── Initial Load ────────────────────────────────────────────────────────
  await loadRules();
  await loadAiConfig();
});
