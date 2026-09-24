/**
 * Accounts View Controller
 * Multi-profile WhatsApp connection and QR code scanner
 * High-reliability dual-engine QR display (Direct base64 PNG + Canvas/Library fallback)
 */

window.addEventListener('DOMContentLoaded', () => {
  const accountsGrid = document.getElementById('accountsGrid');
  const btnAddNew = document.getElementById('btnAddNewAccount');
  const qrModal = document.getElementById('qrModal');
  const closeQrModal = document.getElementById('closeQrModal');
  const qrCanvas = document.getElementById('qrCanvas');
  const qrImage = document.getElementById('qrImage');
  const qrLoading = document.getElementById('qrLoading');
  const qrModalTitle = document.getElementById('qrModalTitle');
  const qrStatusText = document.getElementById('qrStatusText');
  const btnModalRefreshQr = document.getElementById('btnModalRefreshQr');
  const btnModalOpenWeb = document.getElementById('btnModalOpenWeb');

  // Add Account Modal Elements
  const addAccountModal = document.getElementById('addAccountModal');
  const closeAddAccountModal = document.getElementById('closeAddAccountModal');
  const btnCancelAddAccount = document.getElementById('btnCancelAddAccount');
  const btnConfirmAddAccount = document.getElementById('btnConfirmAddAccount');
  const newAccountNameInput = document.getElementById('newAccountNameInput');

  let currentQrAccountId = null;

  async function loadAccounts() {
    try {
      const accounts = await window.api.getAccounts();
      accountsGrid.innerHTML = '';

      if (accounts.length === 0) {
        accountsGrid.innerHTML = `
          <div class="card text-center" style="grid-column: 1/-1;">
            <p class="text-muted">No WhatsApp accounts linked yet. Click "Connect New Account" to link your first WhatsApp.</p>
          </div>
        `;
        return;
      }

      accounts.forEach(acc => {
        const card = document.createElement('div');
        card.className = `account-card ${acc.isActive ? 'active-session' : ''}`;

        const isOnline = acc.status === 'CONNECTED';
        const isWaitingQr = acc.status === 'WAITING_QR';

        card.innerHTML = `
          <div class="account-card-header">
            <div>
              <div class="account-card-title">${acc.name}</div>
              <span class="text-dim" style="font-size:11px;">Created ${new Date(acc.createdAt).toLocaleDateString()}</span>
            </div>
            <span class="status-dot ${isOnline ? 'online' : (isWaitingQr ? 'waiting' : 'offline')}"></span>
          </div>
          <div class="account-card-body">
            <div class="text-dim" style="font-size:11px; margin-bottom:4px;">PHONE NUMBER</div>
            <div class="account-phone-val">${acc.phone ? '+' + acc.phone : 'Not Linked'}</div>
            <div class="text-muted" style="margin-top:6px; font-size:12px;">Status: <strong>${acc.status}</strong></div>
          </div>
          <div class="account-card-footer">
            ${
              !isOnline
                ? `<button class="btn btn-primary btn-sm btn-scan-qr" data-id="${acc.id}">Scan QR</button>`
                : `<button class="btn btn-outline btn-sm btn-set-active" data-id="${acc.id}" ${acc.isActive ? 'disabled' : ''}>${acc.isActive ? 'Active' : 'Set Active'}</button>`
            }
            <button class="btn btn-outline btn-sm btn-open-wa" data-id="${acc.id}" title="Open native WhatsApp Web window">Open Web</button>
            <button class="btn btn-outline btn-sm btn-delete-acc" data-id="${acc.id}" style="color:#f87171;">Remove</button>
          </div>
        `;

        accountsGrid.appendChild(card);
      });

      // Bind buttons
      document.querySelectorAll('.btn-scan-qr').forEach(btn => {
        btn.addEventListener('click', () => openQrModal(btn.getAttribute('data-id')));
      });

      document.querySelectorAll('.btn-open-wa').forEach(btn => {
        btn.addEventListener('click', async () => {
          await window.api.openAccountWindow(btn.getAttribute('data-id'));
          window.showToast('Opened WhatsApp Web window', 'info');
        });
      });

      document.querySelectorAll('.btn-set-active').forEach(btn => {
        btn.addEventListener('click', async () => {
          await window.api.switchAccount(btn.getAttribute('data-id'));
          loadAccounts();
          window.showToast('Switched active account', 'success');
        });
      });

      document.querySelectorAll('.btn-delete-acc').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to remove this account? This will log out the WhatsApp session.')) {
            await window.api.deleteAccount(btn.getAttribute('data-id'));
            loadAccounts();
            window.showToast('Account removed', 'info');
          }
        });
      });
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }

  window.refreshAccountsList = loadAccounts;

  // Add New Account Modal Controls
  function openAddAccountDialog() {
    if (!addAccountModal) return;
    const cards = accountsGrid.querySelectorAll('.account-card');
    if (newAccountNameInput) {
      newAccountNameInput.value = `WhatsApp Line ${cards.length + 1}`;
    }
    addAccountModal.style.display = 'flex';
    setTimeout(() => {
      if (newAccountNameInput) {
        newAccountNameInput.focus();
        newAccountNameInput.select();
      }
    }, 60);
  }

  function closeAddAccountDialog() {
    if (addAccountModal) addAccountModal.style.display = 'none';
  }

  async function handleConfirmAddAccount() {
    const name = (newAccountNameInput ? newAccountNameInput.value : '').trim();
    if (!name) {
      window.showToast('Please enter an account name', 'error');
      return;
    }

    if (btnConfirmAddAccount) {
      btnConfirmAddAccount.disabled = true;
      btnConfirmAddAccount.textContent = 'Creating...';
    }

    try {
      const newAcc = await window.api.createAccount(name);
      closeAddAccountDialog();
      await loadAccounts();
      if (newAcc && newAcc.id) {
        openQrModal(newAcc.id);
      }
      window.showToast(`Account "${name}" created! Initializing session...`, 'success');
    } catch (err) {
      window.showToast('Failed to create account: ' + err.message, 'error');
    } finally {
      if (btnConfirmAddAccount) {
        btnConfirmAddAccount.disabled = false;
        btnConfirmAddAccount.textContent = 'Create & Scan QR →';
      }
    }
  }

  if (btnAddNew) btnAddNew.addEventListener('click', openAddAccountDialog);
  if (closeAddAccountModal) closeAddAccountModal.addEventListener('click', closeAddAccountDialog);
  if (btnCancelAddAccount) btnCancelAddAccount.addEventListener('click', closeAddAccountDialog);
  if (btnConfirmAddAccount) btnConfirmAddAccount.addEventListener('click', handleConfirmAddAccount);
  if (newAccountNameInput) {
    newAccountNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConfirmAddAccount();
      if (e.key === 'Escape') closeAddAccountDialog();
    });
  }

  // QR Modal Functions
  async function openQrModal(accountId) {
    currentQrAccountId = accountId;
    qrModal.style.display = 'flex';
    qrLoading.style.display = 'block';

    if (qrImage) {
      qrImage.style.display = 'none';
      qrImage.src = '';
    }
    if (qrCanvas) {
      qrCanvas.style.display = 'none';
    }
    const dynamicBox = document.getElementById('qrDynamicBox');
    if (dynamicBox) dynamicBox.innerHTML = '';

    if (qrStatusText) {
      qrStatusText.textContent = 'Connecting to WhatsApp servers...';
    }

    try {
      const accounts = await window.api.getAccounts();
      const acc = accounts.find(a => a.id === accountId);
      if (acc) {
        qrModalTitle.textContent = `Link WhatsApp: ${acc.name}`;
        if (acc.qrDataUrl || acc.qr) {
          renderQr(acc.qr, acc.qrDataUrl);
        }
      }

      // Immediately probe or trigger refresh for session
      if (window.api.refreshAccountQr) {
        const probe = await window.api.refreshAccountQr(accountId);
        if (probe && (probe.qr || probe.qrDataUrl)) {
          renderQr(probe.qr, probe.qrDataUrl);
        }
      }

      // Active polling while QR modal is open so QR is captured instantly
      if (window._qrPollTimer) clearInterval(window._qrPollTimer);
      window._qrPollTimer = setInterval(async () => {
        if (!currentQrAccountId || qrModal.style.display === 'none') {
          clearInterval(window._qrPollTimer);
          return;
        }
        try {
          if (window.api.getAccountStatus) {
            const statusObj = await window.api.getAccountStatus(currentQrAccountId);
            if (statusObj) {
              if (statusObj.status === 'CONNECTED') {
                clearInterval(window._qrPollTimer);
                qrModal.style.display = 'none';
                currentQrAccountId = null;
                window.showToast('WhatsApp account linked successfully!', 'success');
                loadAccounts();
                return;
              }
              if (statusObj.qrDataUrl || statusObj.qr) {
                renderQr(statusObj.qr, statusObj.qrDataUrl);
              }
            }
          }
        } catch (e) {}
      }, 1000);
    } catch (err) {
      console.error('Error fetching account for QR:', err);
    }
  }

  function renderQr(qrString, qrDataUrl) {
    if (!qrString && !qrDataUrl) return;

    qrLoading.style.display = 'none';
    if (qrStatusText) {
      qrStatusText.textContent = 'Ready! Scan with WhatsApp Linked Devices';
    }

    // Priority 1: Direct Base64 PNG image (100% reliable, zero rendering issues)
    if (qrDataUrl && qrImage) {
      qrImage.src = qrDataUrl;
      qrImage.style.display = 'block';
      if (qrCanvas) qrCanvas.style.display = 'none';
      const dynamicBox = document.getElementById('qrDynamicBox');
      if (dynamicBox) dynamicBox.style.display = 'none';
      return;
    }

    // Priority 2: Client-side QRCode generator fallback
    if (qrString) {
      if (typeof QRCode !== 'undefined') {
        const container = document.getElementById('qrContainer');
        let dynamicBox = document.getElementById('qrDynamicBox');
        if (!dynamicBox) {
          dynamicBox = document.createElement('div');
          dynamicBox.id = 'qrDynamicBox';
          dynamicBox.style.cssText = 'background:#fff; padding:8px; border-radius:10px; display:inline-block; box-shadow:0 8px 24px rgba(0,0,0,0.5);';
          container.appendChild(dynamicBox);
        }
        dynamicBox.style.display = 'block';
        dynamicBox.innerHTML = '';

        try {
          new QRCode(dynamicBox, {
            text: qrString,
            width: 224,
            height: 224,
            colorDark: '#000000',
            colorLight: '#ffffff'
          });
        } catch (e) {
          console.error('[Accounts] QRCode render failed:', e);
        }
      }
    }
  }

  closeQrModal.addEventListener('click', () => {
    qrModal.style.display = 'none';
    currentQrAccountId = null;
    if (window._qrPollTimer) clearInterval(window._qrPollTimer);
  });

  // Modal Refresh Button
  if (btnModalRefreshQr) {
    btnModalRefreshQr.addEventListener('click', async () => {
      if (!currentQrAccountId) return;
      qrLoading.style.display = 'block';
      if (qrImage) qrImage.style.display = 'none';
      if (qrCanvas) qrCanvas.style.display = 'none';
      const dynamicBox = document.getElementById('qrDynamicBox');
      if (dynamicBox) dynamicBox.style.display = 'none';

      if (qrStatusText) qrStatusText.textContent = 'Requesting fresh QR code...';
      try {
        await window.api.refreshAccountQr(currentQrAccountId);
        window.showToast('Refreshing session QR code...', 'info');
      } catch (err) {
        window.showToast('Refresh error: ' + err.message, 'error');
      }
    });
  }

  // Modal Open Native Web Window Button
  if (btnModalOpenWeb) {
    btnModalOpenWeb.addEventListener('click', async () => {
      if (!currentQrAccountId) return;
      try {
        await window.api.openAccountWindow(currentQrAccountId);
        window.showToast('Opened native WhatsApp Web window', 'info');
      } catch (err) {
        window.showToast('Failed to open window: ' + err.message, 'error');
      }
    });
  }

  // Listen for QR code updates from main process
  window.api.onQrCode((data) => {
    if (data.accountId === currentQrAccountId && (data.qr || data.qrDataUrl)) {
      renderQr(data.qr, data.qrDataUrl);
    }
  });

  // Listen for account status changes
  window.api.onAccountStatus((data) => {
    if (data.accountId === currentQrAccountId) {
      if (data.status === 'CONNECTED') {
        qrModal.style.display = 'none';
        currentQrAccountId = null;
        window.showToast('WhatsApp account linked successfully!', 'success');
        loadAccounts();
      } else if (data.status === 'WAITING_QR' && qrStatusText) {
        qrStatusText.textContent = 'Session ready! Scan QR code to connect.';
      }
    }
  });

  // Initial load
  loadAccounts();
});
