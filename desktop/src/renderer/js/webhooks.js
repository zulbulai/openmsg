/**
 * Webhooks & Integrations Controller for OpenMsg Desktop
 * Ported from Chrome Extension Manifest V3 CRM
 */

window.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('webhooksList');
  const btnNewWebhook = document.getElementById('btnNewWebhook');
  const totalCountBadge = document.getElementById('webhooksTotalCount');

  // Modal elements
  const modal = document.getElementById('modalWebhook');
  const modalTitle = document.getElementById('webhookModalTitle');
  const inputId = document.getElementById('webhookId');
  const inputName = document.getElementById('webhookName');
  const inputUrl = document.getElementById('webhookUrl');
  const chkEvMsg = document.getElementById('webhookEvMsg');
  const chkEvCamp = document.getElementById('webhookEvCamp');
  const btnCancel = document.getElementById('btnCancelWebhook');
  const btnSave = document.getElementById('btnSaveWebhook');

  let webhooksList = [];

  async function loadWebhooks() {
    try {
      if (window.api && window.api.getWebhooks) {
        webhooksList = await window.api.getWebhooks();
        renderList();
      }
    } catch (err) {
      console.error('[Webhooks] Load error:', err);
    }
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';

    if (totalCountBadge) {
      totalCountBadge.textContent = `${webhooksList.length} Webhooks`;
    }

    if (webhooksList.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state-card';
      empty.innerHTML = `
        <div style="font-size:32px; margin-bottom:8px;">🔗</div>
        <div style="font-weight:600; font-size:14px; margin-bottom:4px;">No Webhooks Configured</div>
        <div style="font-size:12px; color:var(--text-dim); max-width:400px; margin:0 auto;">
          Connect OpenMsg to Zapier, Make, n8n, or your custom CRM server to automatically forward incoming WhatsApp messages.
        </div>
      `;
      listEl.appendChild(empty);
      return;
    }

    webhooksList.forEach(wh => {
      const card = document.createElement('div');
      card.className = 'webhook-card' + (!wh.enabled ? ' is-disabled' : '');

      const top = document.createElement('div');
      top.className = 'webhook-card-top';

      const left = document.createElement('div');
      left.className = 'webhook-card-left';

      const name = document.createElement('span');
      name.className = 'webhook-title';
      name.textContent = wh.name || 'Webhook Endpoint';

      const statusBadge = document.createElement('span');
      statusBadge.className = `webhook-status-badge ${wh.enabled ? 'active' : 'inactive'}`;
      statusBadge.textContent = wh.enabled ? '● Active' : '○ Paused';

      left.appendChild(name);
      left.appendChild(statusBadge);
      top.appendChild(left);

      // Toggle switch
      const switchWrap = document.createElement('label');
      switchWrap.className = 'switch-sm';
      const switchInput = document.createElement('input');
      switchInput.type = 'checkbox';
      switchInput.checked = Boolean(wh.enabled);
      switchInput.addEventListener('change', async () => {
        wh.enabled = switchInput.checked;
        await window.api.saveWebhook(wh);
        await loadWebhooks();
      });
      const slider = document.createElement('span');
      slider.className = 'slider-sm';
      switchWrap.appendChild(switchInput);
      switchWrap.appendChild(slider);
      top.appendChild(switchWrap);

      card.appendChild(top);

      // URL display
      const urlBox = document.createElement('div');
      urlBox.className = 'webhook-url-box code-font';
      urlBox.textContent = wh.url;
      card.appendChild(urlBox);

      // Events subscribed
      const evWrap = document.createElement('div');
      evWrap.className = 'webhook-events-wrap';
      (wh.events || []).forEach(ev => {
        const evChip = document.createElement('span');
        evChip.className = 'webhook-event-chip';
        evChip.textContent = `⚡ ${ev}`;
        evWrap.appendChild(evChip);
      });
      card.appendChild(evWrap);

      // Actions bottom
      const actions = document.createElement('div');
      actions.className = 'webhook-actions';

      const testBtn = document.createElement('button');
      testBtn.type = 'button';
      testBtn.className = 'btn btn-outline btn-sm';
      testBtn.innerHTML = '🧪 Test Ping';
      
      const testResult = document.createElement('span');
      testResult.className = 'webhook-test-result';
      testResult.style.fontSize = '11px';

      testBtn.addEventListener('click', async () => {
        testBtn.disabled = true;
        testBtn.innerHTML = '⏳ Testing...';
        testResult.textContent = '';
        try {
          const res = await window.api.testWebhook(wh.url);
          if (res.success) {
            testResult.style.color = '#34d399';
            testResult.textContent = `✅ HTTP ${res.statusCode || 200} Success`;
          } else {
            testResult.style.color = '#f87171';
            testResult.textContent = `❌ Failed: ${res.error || 'Connection error'}`;
          }
        } catch (err) {
          testResult.style.color = '#f87171';
          testResult.textContent = `❌ ${err.message}`;
        } finally {
          testBtn.disabled = false;
          testBtn.innerHTML = '🧪 Test Ping';
        }
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon-sm';
      delBtn.title = 'Delete Webhook';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', async () => {
        if (confirm(`Delete webhook "${wh.name}"?`)) {
          await window.api.deleteWebhook(wh.id);
          await loadWebhooks();
        }
      });

      actions.appendChild(testBtn);
      actions.appendChild(testResult);
      actions.appendChild(delBtn);
      card.appendChild(actions);

      listEl.appendChild(card);
    });
  }

  function openModal() {
    if (!modal) return;
    if (inputId) inputId.value = '';
    if (inputName) inputName.value = '';
    if (inputUrl) inputUrl.value = 'https://';
    if (chkEvMsg) chkEvMsg.checked = true;
    if (chkEvCamp) chkEvCamp.checked = true;
    modal.style.display = 'flex';
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
  }

  if (btnNewWebhook) btnNewWebhook.addEventListener('click', openModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const name = inputName ? inputName.value.trim() : '';
      const url = inputUrl ? inputUrl.value.trim() : '';
      if (!name || !url || !url.startsWith('http')) {
        alert('Please provide a valid name and HTTP/HTTPS endpoint URL.');
        return;
      }

      const events = [];
      if (chkEvMsg && chkEvMsg.checked) events.push('message_received');
      if (chkEvCamp && chkEvCamp.checked) events.push('campaign_done');

      const webhook = {
        name,
        url,
        events,
        enabled: true
      };

      try {
        await window.api.saveWebhook(webhook);
        closeModal();
        await loadWebhooks();
      } catch (err) {
        alert('Error saving webhook: ' + err.message);
      }
    });
  }

  // Initial load
  loadWebhooks();
});
