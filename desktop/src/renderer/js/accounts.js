/**
 * Accounts View Controller
 * Multi-profile WhatsApp connection and QR code scanner
 */

window.addEventListener('DOMContentLoaded', () => {
  const accountsGrid = document.getElementById('accountsGrid');
  const btnAddNew = document.getElementById('btnAddNewAccount');
  const qrModal = document.getElementById('qrModal');
  const closeQrModal = document.getElementById('closeQrModal');
  const qrCanvas = document.getElementById('qrCanvas');
  const qrLoading = document.getElementById('qrLoading');
  const qrModalTitle = document.getElementById('qrModalTitle');

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

  // Add New Account
  btnAddNew.addEventListener('click', async () => {
    const name = prompt('Enter a label for this WhatsApp account (e.g. Sales Account, Support #2):');
    if (!name) return;

    try {
      const newAcc = await window.api.createAccount(name);
      await loadAccounts();
      openQrModal(newAcc.id);
    } catch (err) {
      window.showToast('Failed to create account: ' + err.message, 'error');
    }
  });

  // QR Modal Functions
  async function openQrModal(accountId) {
    currentQrAccountId = accountId;
    qrModal.style.display = 'flex';
    qrLoading.style.display = 'block';
    qrCanvas.style.display = 'none';

    const accounts = await window.api.getAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (acc) {
      qrModalTitle.textContent = `Link WhatsApp: ${acc.name}`;
      if (acc.qr) {
        renderQr(acc.qr);
      }
    }
  }

  function renderQr(qrString) {
    if (!qrString || typeof QRCode === 'undefined') return;
    qrLoading.style.display = 'none';
    qrCanvas.style.display = 'block';
    QRCode.toCanvas(qrCanvas, qrString, { width: 220, margin: 1 }, (err) => {
      if (err) console.error('QR Render error:', err);
    });
  }

  closeQrModal.addEventListener('click', () => {
    qrModal.style.display = 'none';
    currentQrAccountId = null;
  });

  // Listen for QR code updates from main process
  window.api.onQrCode((data) => {
    if (data.accountId === currentQrAccountId && data.qr) {
      renderQr(data.qr);
    }
  });

  // Listen for account status changes
  window.api.onAccountStatus((data) => {
    if (data.accountId === currentQrAccountId && data.status === 'CONNECTED') {
      qrModal.style.display = 'none';
      currentQrAccountId = null;
      window.showToast('WhatsApp account linked successfully!', 'success');
    }
  });

  // Initial load
  loadAccounts();
});
