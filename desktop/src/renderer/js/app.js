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

  // Initial load
  await refreshHeaderAccounts();
  await refreshHeaderLicense();
});
