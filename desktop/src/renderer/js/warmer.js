/**
 * WhatsApp Account Warmer Frontend Controller — Phase 7D
 * Coordinates peer-to-peer number warming, daily message quotas,
 * interactive progress cards, dialogue templates, and real-time activity stream.
 */

(function () {
  let isWarming = false;
  let activeAccounts = [];
  let warmerTemplates = [];
  let currentStats = {};

  async function loadAccountsList() {
    const container = document.getElementById('warmerAccountsList');
    if (!container || !window.api || !window.api.getAccounts) return;

    try {
      const accounts = await window.api.getAccounts();
      activeAccounts = accounts;

      if (accounts.length === 0) {
        container.innerHTML = `
          <div style="font-size:12px; color:var(--text-muted); padding:10px; background:rgba(0,0,0,0.2); border-radius:6px;">
            ⚠️ No accounts connected. Go to the <strong>Accounts</strong> tab and scan QR codes for at least 2 numbers.
          </div>
        `;
        return;
      }

      container.innerHTML = accounts.map(acc => {
        const isConnected = acc.status === 'CONNECTED';
        return `
          <label style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--bg-input); border:1px solid ${isConnected ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}; border-radius:6px; cursor:${isConnected ? 'pointer' : 'not-allowed'};">
            <div style="display:flex; align-items:center; gap:10px;">
              <input type="checkbox" class="warmer-acc-cb" value="${acc.id}" ${isConnected ? 'checked' : 'disabled'} style="width:16px; height:16px;">
              <div>
                <span style="font-weight:700; color:var(--text-main); font-size:13px;">${escapeHtml(acc.name)}</span>
                <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim); margin-left:6px;">${acc.phone ? '+' + acc.phone : 'Unlinked'}</span>
              </div>
            </div>
            <span class="tool-badge ${isConnected ? 'badge-popular' : 'badge-new'}" style="font-size:9px;">
              ${acc.status}
            </span>
          </label>
        `;
      }).join('');

      renderStatusCards();
    } catch (e) {
      console.warn('Failed to load warmer accounts:', e);
    }
  }

  async function loadTemplates() {
    const list = document.getElementById('warmerTemplatesList');
    const badge = document.getElementById('warmerTemplateCountBadge');
    if (!list) return;

    try {
      if (window.api && window.api.invoke) {
        // If IPC is available
      }
      // Fallback pre-populated realistic templates
      warmerTemplates = [
        { id: '1', starter: 'Good morning! Hope you have a productive day ahead ☕', reply: 'Morning! Thanks, same to you 😊' },
        { id: '2', starter: 'Hey, how is everything going on your end?', reply: 'All good here, thanks for asking! Going well.' },
        { id: '3', starter: 'Happy Friday! Any exciting plans for the weekend? 🎉', reply: 'Mostly relaxing and catching up on sleep! You?' },
        { id: '4', starter: 'Did you get a chance to check out that document?', reply: 'Yes, looking over it now. Will update you in a bit 👍' },
        { id: '5', starter: 'Thanks for the quick help earlier, appreciate it!', reply: 'Anytime! Glad it worked out 🙌' },
        { id: '6', starter: 'Weather is really pleasant today outside 🌤️', reply: 'Totally agree, nice break from the heat!' }
      ];

      if (badge) badge.textContent = `${warmerTemplates.length} Dialogues`;

      list.innerHTML = warmerTemplates.map((t, idx) => `
        <div style="padding:6px 8px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:11px; display:flex; justify-content:space-between; align-items:center;">
          <div style="color:var(--text-muted); max-width:85%;">
            <strong style="color:#34d399;">A:</strong> ${escapeHtml(t.starter)}<br>
            <strong style="color:#38bdf8;">B:</strong> ${escapeHtml(t.reply)}
          </div>
          <button type="button" class="btn-text-sm btn-del-template" data-idx="${idx}" style="color:#f87171; font-size:11px;">&times;</button>
        </div>
      `).join('');

      list.querySelectorAll('.btn-del-template').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-idx'), 10);
          warmerTemplates.splice(i, 1);
          loadTemplates();
        });
      });
    } catch (e) {
      console.warn('Failed to load warmer templates:', e);
    }
  }

  function renderStatusCards() {
    const grid = document.getElementById('warmerStatusGrid');
    if (!grid) return;

    if (activeAccounts.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-muted); font-size:12px; grid-column:span 4;">No connected accounts available.</div>';
      return;
    }

    const targetVal = parseInt(document.getElementById('warmerDailyTarget')?.value || '30', 10);

    grid.innerHTML = activeAccounts.map(acc => {
      const stat = currentStats[acc.id] || { sentToday: 0, totalAllTime: 0, lastSentAt: null };
      const sent = stat.sentToday || 0;
      const pct = Math.min(100, Math.round((sent / targetVal) * 100));
      const initials = (acc.name || 'WA').substring(0, 2).toUpperCase();

      return `
        <div class="account-card" style="padding:16px;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div class="phone-wa-avatar" style="width:40px; height:40px; font-size:14px;">${initials}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:700; color:var(--text-main); font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(acc.name)}</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-dim);">${acc.phone ? '+' + acc.phone : 'Linked'}</div>
            </div>
            <span class="tool-badge ${isWarming ? 'badge-popular' : 'badge-pro'}" style="font-size:9px;">
              ${isWarming ? 'WARMING' : 'IDLE'}
            </span>
          </div>

          <div style="margin-bottom:8px;">
            <div class="flex-between" style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">
              <span>Daily Target Quota</span>
              <strong style="color:var(--text-main);">${sent} / ${targetVal} msgs</strong>
            </div>
            <div class="campaign-progress-bar" style="height:6px; background:rgba(0,0,0,0.3);">
              <div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, #10b981, #06b6d4);"></div>
            </div>
          </div>

          <div class="flex-between" style="font-size:10px; color:var(--text-dim); border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
            <span>All-time: ${stat.totalAllTime || 0} msgs</span>
            <span>${stat.lastSentAt ? 'Last: ' + new Date(stat.lastSentAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'Never'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function appendWarmerLog(senderName, receiverName, text, type = 'info') {
    const stream = document.getElementById('warmerLogStream');
    if (!stream) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `[${time}] <strong style="color:#34d399;">${escapeHtml(senderName)}</strong> &rarr; <strong style="color:#38bdf8;">${escapeHtml(receiverName)}</strong>: "${escapeHtml(text)}"`;
    stream.appendChild(entry);
    stream.scrollTop = stream.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.addEventListener('DOMContentLoaded', async () => {
    const btnStart = document.getElementById('btnStartWarmer');
    const btnStop = document.getElementById('btnStopWarmer');
    const dailyTargetSelect = document.getElementById('warmerDailyTarget');
    const minDelayInput = document.getElementById('warmerMinDelay');
    const maxDelayInput = document.getElementById('warmerMaxDelay');
    const btnAddTpl = document.getElementById('btnAddWarmerTemplate');
    const inputCustomTpl = document.getElementById('customWarmerTemplateInput');
    const btnClearLog = document.getElementById('btnClearWarmerLog');

    // 1. Initial Loads
    await loadAccountsList();
    await loadTemplates();

    if (window.api && window.api.getWarmerStats) {
      try {
        currentStats = await window.api.getWarmerStats() || {};
        renderStatusCards();
      } catch (e) {}
    }

    if (dailyTargetSelect) {
      dailyTargetSelect.addEventListener('change', renderStatusCards);
    }

    // 2. Add Custom Template
    if (btnAddTpl && inputCustomTpl) {
      btnAddTpl.addEventListener('click', () => {
        const text = inputCustomTpl.value.trim();
        if (!text) return;
        warmerTemplates.push({
          id: 'custom_' + Date.now(),
          starter: text,
          reply: 'Understood, thanks for letting me know! 👍'
        });
        inputCustomTpl.value = '';
        loadTemplates();
        window.showToast('Custom warming dialogue added!', 'success');
      });
    }

    // 3. Start Warmer
    if (btnStart) {
      btnStart.addEventListener('click', async () => {
        const selectedCbs = document.querySelectorAll('.warmer-acc-cb:checked');
        const selectedIds = Array.from(selectedCbs).map(cb => cb.value);

        if (selectedIds.length < 2) {
          window.showToast('Please select at least 2 connected WhatsApp accounts to warm.', 'error');
          return;
        }

        const dailyTarget = parseInt(dailyTargetSelect?.value || '30', 10);
        const minDelay = parseInt(minDelayInput?.value || '45', 10);
        const maxDelay = parseInt(maxDelayInput?.value || '120', 10);

        isWarming = true;
        btnStart.style.display = 'none';
        if (btnStop) btnStop.style.display = 'inline-flex';

        renderStatusCards();
        window.showToast(`Account Warmer started across ${selectedIds.length} lines!`, 'success');

        const stream = document.getElementById('warmerLogStream');
        if (stream) {
          const entry = document.createElement('div');
          entry.className = 'log-entry info';
          entry.textContent = `[${new Date().toLocaleTimeString()}] Warmer started. Daily target: ${dailyTarget} msgs/account. Delay: ${minDelay}-${maxDelay}s.`;
          stream.appendChild(entry);
        }

        try {
          await window.api.startWarmer({
            selectedAccounts: selectedIds,
            dailyTarget,
            minDelay,
            maxDelay,
            templates: warmerTemplates
          });
        } catch (err) {
          window.showToast('Failed to start warmer: ' + err.message, 'error');
          resetWarmerButtons();
        }
      });
    }

    // 4. Stop Warmer
    if (btnStop) {
      btnStop.addEventListener('click', async () => {
        try {
          await window.api.stopWarmer();
        } catch (e) {}
        resetWarmerButtons();
        window.showToast('Account Warmer stopped.', 'info');
      });
    }

    function resetWarmerButtons() {
      isWarming = false;
      if (btnStart) btnStart.style.display = 'inline-flex';
      if (btnStop) btnStop.style.display = 'none';
      renderStatusCards();
    }

    // 5. Listen to Live Warmer Progress Events
    if (window.api && window.api.onWarmerProgress) {
      window.api.onWarmerProgress((data) => {
        if (data.sender && data.receiver && data.message) {
          appendWarmerLog(data.sender.name || 'Account A', data.receiver.name || 'Account B', data.message, 'success');
        }

        if (data.stats) {
          currentStats = data.stats;
          renderStatusCards();
        }
      });
    }

    if (btnClearLog) {
      btnClearLog.addEventListener('click', () => {
        const stream = document.getElementById('warmerLogStream');
        if (stream) stream.innerHTML = '';
      });
    }
  });
})();
