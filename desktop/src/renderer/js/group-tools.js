/**
 * Group Discovery & Auto-Joiner Controller — Phase 7C
 * Web crawling for public WhatsApp group links and automated anti-ban auto-joining.
 */

(function () {
  let discoveredLinks = [];
  let isFinding = false;
  let isJoining = false;

  function renderLinksTable() {
    const tbody = document.getElementById('groupLinksTableBody');
    const badge = document.getElementById('groupFoundCountBadge');

    if (!tbody) return;

    if (discoveredLinks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:40px 16px; color:var(--text-muted);">
            <div style="font-size:28px; margin-bottom:8px;">🔗</div>
            <div style="font-size:14px; font-weight:600; color:var(--text-main);">No group links discovered yet</div>
            <div style="font-size:12px; margin-top:4px;">Enter a topic keyword above and click <strong>Find Group Links</strong>.</div>
          </td>
        </tr>
      `;
      if (badge) badge.textContent = '0 Found';
      return;
    }

    if (badge) badge.textContent = `${discoveredLinks.length} Found`;

    tbody.innerHTML = discoveredLinks.map((item, idx) => `
      <tr>
        <td style="width:40px; color:var(--text-dim); font-size:11px;">#${idx + 1}</td>
        <td>
          <div style="font-weight:700; color:var(--text-main); font-size:13px;">${escapeHtml(item.title)}</div>
        </td>
        <td>
          <a href="${item.url}" target="_blank" style="color:var(--accent-wa); font-family:var(--font-mono); font-size:12px; text-decoration:none;">${item.url}</a>
        </td>
        <td>
          <span class="tool-badge badge-pro" style="font-size:9px;">${escapeHtml(item.source || 'Web')}</span>
        </td>
        <td style="text-align:right;">
          <button class="btn-xs btn-primary btn-queue-single-link" data-url="${item.url}" title="Send to Auto Joiner">
            🚀 Join
          </button>
        </td>
      </tr>
    `).join('');

    // Bind individual Join buttons
    tbody.querySelectorAll('.btn-queue-single-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        if (url) {
          switchToJoinerTab([url]);
        }
      });
    });
  }

  function switchToJoinerTab(linksToAppend = []) {
    const tabJoiner = document.getElementById('tabBtnGroupJoiner');
    if (tabJoiner) tabJoiner.click();

    const textarea = document.getElementById('joinerLinksText');
    if (textarea && linksToAppend.length > 0) {
      const existing = textarea.value.trim();
      const newUrls = linksToAppend.join('\n');
      textarea.value = existing ? `${existing}\n${newUrls}` : newUrls;
      textarea.focus();
    }
  }

  function appendJoinerLog(msg, type = 'info') {
    const logBox = document.getElementById('joinerLogStream');
    if (!logBox) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${msg}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function populateAccountsDropdown() {
    const select = document.getElementById('joinerAccountSelect');
    if (!select || !window.api || !window.api.getAccounts) return;

    try {
      const accounts = await window.api.getAccounts();
      select.innerHTML = '';
      if (accounts.length === 0) {
        select.innerHTML = '<option value="">No Accounts Linked - Scan QR First</option>';
        return;
      }
      accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = `${acc.name} (${acc.phone || 'Linked'}) - ${acc.status}`;
        if (acc.isActive || acc.status === 'CONNECTED') opt.selected = true;
        select.appendChild(opt);
      });
    } catch (e) {
      console.warn('Could not populate joiner accounts:', e);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    // 1. Sub-tab navigation
    const btnTabFinder = document.getElementById('tabBtnGroupFinder');
    const btnTabJoiner = document.getElementById('tabBtnGroupJoiner');
    const panelFinder = document.getElementById('panelGroupFinder');
    const panelJoiner = document.getElementById('panelGroupJoiner');

    if (btnTabFinder && btnTabJoiner && panelFinder && panelJoiner) {
      btnTabFinder.addEventListener('click', () => {
        btnTabFinder.classList.add('active');
        btnTabJoiner.classList.remove('active');
        panelFinder.style.display = 'block';
        panelJoiner.style.display = 'none';
      });

      btnTabJoiner.addEventListener('click', () => {
        btnTabJoiner.classList.add('active');
        btnTabFinder.classList.remove('active');
        panelFinder.style.display = 'none';
        panelJoiner.style.display = 'block';
        populateAccountsDropdown();
      });
    }

    // 2. Group Link Finder Controls
    const btnStartFinder = document.getElementById('btnStartGroupFinder');
    const btnStopFinder = document.getElementById('btnStopGroupFinder');
    const inputKeyword = document.getElementById('groupFinderKeyword');
    const selectPages = document.getElementById('groupFinderPages');
    const btnSendAll = document.getElementById('btnSendAllToJoiner');
    const btnClearLinks = document.getElementById('btnClearGroupLinks');
    const btnExportCsv = document.getElementById('btnGroupFinderExportCsv');

    if (btnStartFinder) {
      btnStartFinder.addEventListener('click', async () => {
        const keyword = inputKeyword?.value.trim();
        const pages = parseInt(selectPages?.value || '5', 10);

        if (!keyword) {
          window.showToast('Please enter a group topic or keyword.', 'error');
          return;
        }

        isFinding = true;
        btnStartFinder.style.display = 'none';
        if (btnStopFinder) btnStopFinder.style.display = 'inline-flex';
        window.showToast(`Searching web for "${keyword}" WhatsApp groups...`, 'info');

        try {
          await window.api.findGroupLinks(keyword, pages);
        } catch (err) {
          window.showToast('Search failed: ' + err.message, 'error');
          resetFinderButtons();
        }
      });
    }

    if (btnStopFinder) {
      btnStopFinder.addEventListener('click', async () => {
        try {
          await window.api.stopGroupFinder();
        } catch (e) {}
        resetFinderButtons();
        window.showToast('Group search stopped.', 'info');
      });
    }

    function resetFinderButtons() {
      isFinding = false;
      if (btnStartFinder) btnStartFinder.style.display = 'inline-flex';
      if (btnStopFinder) btnStopFinder.style.display = 'none';
    }

    // Streaming links found
    if (window.api && window.api.onGroupLinkFound) {
      window.api.onGroupLinkFound((item) => {
        const exists = discoveredLinks.some(l => l.url === item.url);
        if (!exists) {
          discoveredLinks.unshift(item);
          renderLinksTable();
        }
      });
    }

    if (window.api && window.api.onMapsDone) {
      // done event handled
    }

    // Send All to Auto Joiner
    if (btnSendAll) {
      btnSendAll.addEventListener('click', () => {
        if (discoveredLinks.length === 0) {
          window.showToast('No discovered group links to send.', 'error');
          return;
        }
        const urls = discoveredLinks.map(l => l.url);
        switchToJoinerTab(urls);
        window.showToast(`Transferred ${urls.length} group links to Auto Joiner!`, 'success');
      });
    }

    if (btnClearLinks) {
      btnClearLinks.addEventListener('click', () => {
        discoveredLinks = [];
        renderLinksTable();
        window.showToast('Group links cleared.', 'info');
      });
    }

    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        if (discoveredLinks.length === 0) {
          window.showToast('No links to export.', 'error');
          return;
        }
        const headers = ['Group Title', 'WhatsApp Invite URL', 'Source Engine', 'Discovered At'];
        const rows = discoveredLinks.map(l => [
          `"${(l.title || '').replace(/"/g, '""')}"`,
          `"${l.url}"`,
          `"${l.source || 'Web'}"`,
          `"${new Date(l.discoveredAt || Date.now()).toISOString()}"`
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whatsapp_group_links_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast(`Exported ${discoveredLinks.length} group links!`, 'success');
      });
    }

    // 3. Auto Group Joiner Controls
    const delaySlider = document.getElementById('joinerDelaySlider');
    const delayVal = document.getElementById('joinerDelayVal');
    const btnStartJoin = document.getElementById('btnStartGroupJoin');
    const btnStopJoin = document.getElementById('btnStopGroupJoin');
    const joinerLinksText = document.getElementById('joinerLinksText');
    const joinerSelectAcc = document.getElementById('joinerAccountSelect');
    const statJoined = document.getElementById('joinerStatJoined');
    const statFailed = document.getElementById('joinerStatFailed');
    const statRemaining = document.getElementById('joinerStatRemaining');
    const progressFill = document.getElementById('joinerProgressFill');
    const btnClearJoinLog = document.getElementById('btnClearJoinerLog');

    if (delaySlider && delayVal) {
      delaySlider.addEventListener('input', () => {
        delayVal.textContent = `${delaySlider.value}s`;
      });
    }

    if (btnStartJoin) {
      btnStartJoin.addEventListener('click', async () => {
        const rawLinks = joinerLinksText?.value.trim() || '';
        const lines = rawLinks.split('\n').map(l => l.trim()).filter(Boolean);

        if (lines.length === 0) {
          window.showToast('Please paste at least one group invite link.', 'error');
          return;
        }

        const accountId = joinerSelectAcc?.value;
        if (!accountId) {
          window.showToast('Please select a WhatsApp account to join with.', 'error');
          return;
        }

        const delay = parseInt(delaySlider?.value || '45', 10);

        isJoining = true;
        btnStartJoin.style.display = 'none';
        if (btnStopJoin) btnStopJoin.style.display = 'inline-flex';

        if (statJoined) statJoined.textContent = '0';
        if (statFailed) statFailed.textContent = '0';
        if (statRemaining) statRemaining.textContent = lines.length;
        if (progressFill) progressFill.style.width = '0%';

        appendJoinerLog(`Started auto-joining ${lines.length} groups with ${delay}s safety delay...`, 'info');
        window.showToast(`Starting auto-join for ${lines.length} groups...`, 'info');

        try {
          await window.api.startGroupJoin(accountId, lines, delay);
        } catch (err) {
          appendJoinerLog(`Failed: ${err.message}`, 'danger');
          resetJoinButtons();
        }
      });
    }

    if (btnStopJoin) {
      btnStopJoin.addEventListener('click', async () => {
        try {
          await window.api.stopGroupJoin();
        } catch (e) {}
        resetJoinButtons();
        appendJoinerLog('Auto-join stopped by user.', 'warning');
        window.showToast('Group joiner stopped.', 'info');
      });
    }

    function resetJoinButtons() {
      isJoining = false;
      if (btnStartJoin) btnStartJoin.style.display = 'inline-flex';
      if (btnStopJoin) btnStopJoin.style.display = 'none';
    }

    // Join progress subscription
    if (window.api && window.api.onGroupJoinProgress) {
      window.api.onGroupJoinProgress((data) => {
        if (statJoined && data.status === 'joined') {
          const cur = parseInt(statJoined.textContent || '0', 10);
          statJoined.textContent = cur + 1;
        }
        if (statFailed && data.status === 'failed') {
          const cur = parseInt(statFailed.textContent || '0', 10);
          statFailed.textContent = cur + 1;
        }
        if (statRemaining && data.remaining !== undefined) {
          statRemaining.textContent = data.remaining;
        }
        if (progressFill && data.total > 0 && data.index !== undefined) {
          const pct = Math.round((data.index / data.total) * 100);
          progressFill.style.width = `${pct}%`;
        }

        if (data.status === 'joined') {
          appendJoinerLog(`[${data.index}/${data.total}] Successfully joined: ${data.link}`, 'success');
        } else if (data.status === 'failed') {
          appendJoinerLog(`[${data.index}/${data.total}] Failed to join (${data.error || 'expired'}): ${data.link}`, 'danger');
        } else if (data.status === 'joining') {
          appendJoinerLog(`[${data.index}/${data.total}] Contacting group: ${data.link}...`, 'info');
        }
      });
    }

    if (btnClearJoinLog) {
      btnClearJoinLog.addEventListener('click', () => {
        const stream = document.getElementById('joinerLogStream');
        if (stream) stream.innerHTML = '';
      });
    }

    // Initial render
    renderLinksTable();
  });
})();
