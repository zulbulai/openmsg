/**
 * Main Application Renderer Controller
 * Tab routing, global toasts, header account selector, and lifecycle
 */

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[OpenMsg UI] Initializing Dashboard...');

  // 1. Tab Switching
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`pane-${tabId}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 2. Setup Header Account Selector
  const headerSelect = document.getElementById('headerAccountSelect');
  const headerStatusDot = document.getElementById('headerStatusDot');
  const headerAccountName = document.getElementById('headerAccountName');
  const headerAccountPhone = document.getElementById('headerAccountPhone');

  async function refreshHeaderAccounts() {
    try {
      const accounts = await window.api.getAccounts();
      headerSelect.innerHTML = '';

      if (accounts.length === 0) {
        headerAccountName.textContent = 'No Account Connected';
        headerAccountPhone.textContent = '';
        headerStatusDot.className = 'status-dot offline';
        return;
      }

      const activeAcc = accounts.find(a => a.isActive) || accounts[0];
      accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = `${acc.name} (${acc.phone || 'Not Linked'}) - ${acc.status}`;
        if (acc.id === activeAcc.id) opt.selected = true;
        headerSelect.appendChild(opt);
      });

      headerAccountName.textContent = activeAcc.name;
      headerAccountPhone.textContent = activeAcc.phone ? `+${activeAcc.phone}` : 'Scan QR';

      if (activeAcc.status === 'CONNECTED') {
        headerStatusDot.className = 'status-dot online';
      } else if (activeAcc.status === 'WAITING_QR') {
        headerStatusDot.className = 'status-dot waiting';
      } else {
        headerStatusDot.className = 'status-dot offline';
      }
    } catch (e) {
      console.warn('Failed to refresh header accounts:', e);
    }
  }

  headerSelect.addEventListener('change', async (e) => {
    await window.api.switchAccount(e.target.value);
    await refreshHeaderAccounts();
    if (window.refreshAccountsList) window.refreshAccountsList();
  });

  // Add Account button in Header
  document.getElementById('headerAddAccountBtn').addEventListener('click', () => {
    const btn = document.getElementById('btnAddNewAccount');
    if (btn) btn.click();
  });

  // Listen to background account status changes
  window.api.onAccountStatus((data) => {
    console.log('[Event] Account status updated:', data);
    refreshHeaderAccounts();
    if (window.refreshAccountsList) window.refreshAccountsList();
  });

  // 3. Load License Status into Header
  async function refreshHeaderLicense() {
    try {
      const lic = await window.api.getLicenseStatus();
      const badge = document.getElementById('headerLicenseBadge');
      const text = document.getElementById('headerLicenseText');
      if (lic.isActivated) {
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.style.color = '#34d399';
        text.textContent = lic.isLifetime ? 'PRO LIFETIME' : 'PRO ACTIVE';
      } else {
        badge.style.background = 'rgba(239, 68, 68, 0.12)';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        badge.style.color = '#f87171';
        text.textContent = 'FREE TRIAL';
      }
    } catch (e) {
      console.warn('Failed to refresh license badge:', e);
    }
  }

  // Toast Notification helper
  window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-popup ${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.padding = '10px 18px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '13px';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    toast.style.transition = 'all 0.3s ease';

    if (type === 'success') toast.style.background = '#059669';
    else if (type === 'error') toast.style.background = '#dc2626';
    else toast.style.background = '#0284c7';

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // 4. Global Tab Switcher helper
  window.switchTab = function(tabId, subtab) {
    const navBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (navBtn) {
      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      navBtn.classList.add('active');
      const targetPane = document.getElementById(`pane-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (subtab && tabId === 'grouptools') {
        const subBtn = document.querySelector(`.sub-tab-btn[data-subtab="${subtab}"]`);
        if (subBtn) subBtn.click();
      }
    }
  };

  // Tool Card clicks -> Switch Tab
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-tab');
      const subtab = card.getAttribute('data-subtab');
      if (tab) window.switchTab(tab, subtab);
    });
  });

  // Stat Card clicks -> Switch Tab
  document.querySelectorAll('.stat-card[data-goto]').forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-goto');
      if (tab) window.switchTab(tab);
    });
  });

  // Dashboard Banner Quick Buttons
  const btnQuickCamp = document.getElementById('dashBtnLaunchCampaign');
  if (btnQuickCamp) btnQuickCamp.addEventListener('click', () => window.switchTab('campaigns'));
  
  const btnQuickMaps = document.getElementById('dashBtnScrapeLeads');
  if (btnQuickMaps) btnQuickMaps.addEventListener('click', () => window.switchTab('maps'));

  const btnQuickWarm = document.getElementById('dashBtnWarmNumbers');
  if (btnQuickWarm) btnQuickWarm.addEventListener('click', () => window.switchTab('warmer'));

  // Tool Search Filter
  const toolSearch = document.getElementById('toolSearchInput');
  if (toolSearch) {
    toolSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.tool-card').forEach(card => {
        const title = (card.querySelector('.tool-title')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('.tool-desc')?.textContent || '').toLowerCase();
        if (!q || title.includes(q) || desc.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // 5. Dashboard Aggregated Metrics Auto-refresh
  async function refreshDashboardStats() {
    try {
      if (window.api && window.api.getDashboardStats) {
        const stats = await window.api.getDashboardStats();
        const elOnline = document.getElementById('dashStatAccountsOnline');
        const elTotal = document.getElementById('dashStatAccountsTotal');
        const elSent = document.getElementById('dashStatSentToday');
        const elContacts = document.getElementById('dashStatContacts');
        const elRules = document.getElementById('dashStatActiveRules');
        const elAiBadge = document.getElementById('dashStatAiBadge');

        if (elOnline) elOnline.textContent = stats.connectedAccounts || 0;
        if (elTotal) elTotal.textContent = stats.totalAccounts || 0;
        if (elSent) elSent.textContent = (stats.messagesSentToday || 0).toLocaleString();
        if (elContacts) elContacts.textContent = (stats.totalContacts || 0).toLocaleString();
        if (elRules) elRules.textContent = stats.activeRules || 0;
        if (elAiBadge) {
          elAiBadge.textContent = stats.aiEnabled ? '⚡ AI Auto-Reply ON' : 'Rule Matching';
        }
      }
    } catch (err) {
      console.warn('Dashboard stats refresh error:', err);
    }
  }

  // Initial load
  await refreshHeaderAccounts();
  await refreshHeaderLicense();
  await refreshDashboardStats();

  // Periodic refresh every 25 seconds
  setInterval(refreshDashboardStats, 25000);
});
