/**
 * Bulk Campaign Controller — Phase 3 Enhanced
 * Features: CSV/Excel import, Spintax, attachments, anti-ban, campaign scheduler, history
 */

window.addEventListener('DOMContentLoaded', () => {
  const campTitle = document.getElementById('campTitle');
  const campContactsText = document.getElementById('campContactsText');
  const campCsvFile = document.getElementById('campCsvFile');
  const campXlsxFile = document.getElementById('campXlsxFile');
  const contactCountBadge = document.getElementById('contactCountBadge');
  const tabPasteContacts = document.getElementById('tabPasteContacts');
  const tabUploadCsv = document.getElementById('tabUploadCsv');
  const tabUploadXlsx = document.getElementById('tabUploadXlsx');
  const campMessageText = document.getElementById('campMessageText');

  const campMinDelay = document.getElementById('campMinDelay');
  const campMaxDelay = document.getElementById('campMaxDelay');
  const campBatchSize = document.getElementById('campBatchSize');
  const campBatchPause = document.getElementById('campBatchPause');

  const btnStartCampaign = document.getElementById('btnStartCampaign');
  const btnPauseCampaign = document.getElementById('btnPauseCampaign');
  const btnResumeCampaign = document.getElementById('btnResumeCampaign');
  const btnStopCampaign = document.getElementById('btnStopCampaign');
  const campaignControls = document.getElementById('campaignControls');

  const statTotal = document.getElementById('statTotal');
  const statSent = document.getElementById('statSent');
  const statFailed = document.getElementById('statFailed');
  const statPending = document.getElementById('statPending');
  const campaignProgressFill = document.getElementById('campaignProgressFill');
  const campaignStatusBanner = document.getElementById('campaignStatusBanner');
  const campaignBannerText = document.getElementById('campaignBannerText');
  const campaignLogStream = document.getElementById('campaignLogStream');
  const btnClearLog = document.getElementById('btnClearLog');

  // Spintax Preview Modal
  const btnPreviewSpintax = document.getElementById('btnPreviewSpintax');
  const spintaxModal = document.getElementById('spintaxModal');
  const closeSpintaxModal = document.getElementById('closeSpintaxModal');
  const spintaxSamplesContainer = document.getElementById('spintaxSamplesContainer');

  // Parse Contacts from textarea or CSV
  function parseContactsList() {
    const raw = campContactsText.value.trim();
    if (!raw) return [];

    const lines = raw.split('\n');
    const contacts = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parts = trimmed.split(/[,;\t]/).map(p => p.trim());
      const phone = parts[0].replace(/\D+/g, '');
      if (!phone) return;

      contacts.push({
        id: `c_${index}`,
        phone: phone,
        Name: parts[1] || 'Valued Customer',
        Company: parts[2] || 'Your Organization',
        rawLine: line
      });
    });

    return contacts;
  }

  function updateContactCount() {
    const list = parseContactsList();
    contactCountBadge.textContent = `${list.length} contact${list.length === 1 ? '' : 's'} loaded`;
  }

  campContactsText.addEventListener('input', updateContactCount);

  // Tab: Upload CSV
  if (tabUploadCsv) {
    tabUploadCsv.addEventListener('click', () => {
      if (campCsvFile) campCsvFile.click();
    });
  }

  // Tab: Upload Excel (Phase 3.3)
  if (tabUploadXlsx) {
    tabUploadXlsx.addEventListener('click', () => {
      if (campXlsxFile) campXlsxFile.click();
    });
  }

  // Excel file import handler
  if (campXlsxFile) {
    campXlsxFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target.result;
          const imported = await window.api.importContactsFromBuffer(buffer, file.name);
          window.showToast(`Imported ${imported} new contacts from ${file.name}!`, 'success');
          const contacts = await window.api.getContacts();
          const recent = contacts.slice(0, imported);
          if (campContactsText && recent.length) {
            campContactsText.value = recent.map(c => `${c.phone}, ${c.Name || 'Customer'}, ${c.Company || ''}`).join('\n');
            campContactsText.dispatchEvent(new Event('input'));
          }
        } catch (err) {
          window.showToast('Excel import failed: ' + err.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
      campXlsxFile.value = '';
    });
  }


  tabPasteContacts.addEventListener('click', () => {
    tabPasteContacts.classList.add('active');
    tabUploadCsv.classList.remove('active');
  });

  campCsvFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      campContactsText.value = event.target.result;
      tabUploadCsv.classList.add('active');
      tabPasteContacts.classList.remove('active');
      updateContactCount();
      window.showToast(`Loaded ${file.name} successfully`, 'success');
    };
    reader.readAsText(file);
  });

  // Pre-built Templates
  const campTemplatePreset = document.getElementById('campTemplatePreset');
  const PRESET_TEMPLATES = {
    promo: `{Hello|Hi|Greetings} {{Name}},

We have an exclusive special promotion for {{Company}} today! {Get 25% off on your next order|Unlock premium features at half price}.

Reply YES to claim your coupon or INFO to learn more.`,
    followup: `{Hi|Hello} {{Name}},

Just following up on our recent conversation regarding our business solutions for {{Company}}. {Would you have 5 minutes for a quick chat tomorrow?|Are you still looking to optimize your workflow?}

Looking forward to hearing from you!`,
    reminder: `⏰ Reminder for {{Name}}:

{This is a gentle reminder regarding your upcoming appointment|We look forward to seeing you at our scheduled session} with {{Company}}.

Please reply 1 to confirm, or 2 to reschedule.`,
    feedback: `{Hello|Hi} {{Name}},

Thank you for choosing our services at {{Company}}! {How was your recent experience with our team?|Could you take 30 seconds to rate us?}

Your feedback helps us serve you better. Thank you!`
  };

  if (campTemplatePreset) {
    campTemplatePreset.addEventListener('change', (e) => {
      const key = e.target.value;
      if (PRESET_TEMPLATES[key]) {
        campMessageText.value = PRESET_TEMPLATES[key];
        window.showToast('Template loaded', 'info');
      }
    });
  }

  // Media Attachment Handling
  let currentAttachment = null;
  const btnPickAttachment = document.getElementById('btnPickAttachment');
  const campAttachmentInput = document.getElementById('campAttachmentInput');
  const attachmentNameBadge = document.getElementById('attachmentNameBadge');
  const btnRemoveAttachment = document.getElementById('btnRemoveAttachment');

  if (btnPickAttachment && campAttachmentInput) {
    btnPickAttachment.addEventListener('click', () => {
      campAttachmentInput.click();
    });

    campAttachmentInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        currentAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: event.target.result
        };
        attachmentNameBadge.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        attachmentNameBadge.style.color = '#34d399';
        btnRemoveAttachment.style.display = 'inline-block';
        window.showToast('File attached: ' + file.name, 'success');
      };
      reader.readAsDataURL(file);
    });

    btnRemoveAttachment.addEventListener('click', () => {
      currentAttachment = null;
      campAttachmentInput.value = '';
      attachmentNameBadge.textContent = 'No file attached';
      attachmentNameBadge.style.color = '';
      btnRemoveAttachment.style.display = 'none';
      window.showToast('Attachment removed', 'info');
    });
  }

  // 5 Message Rotation Tabs Switcher (Phase 7E)
  const rotationTabs = document.querySelectorAll('.rotation-tab');
  const rotationBoxes = document.querySelectorAll('.rotation-msg-box');

  rotationTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const slot = parseInt(tab.getAttribute('data-msg-slot'), 10);
      rotationTabs.forEach(t => t.classList.remove('active'));
      rotationBoxes.forEach(b => {
        b.style.display = 'none';
        b.classList.remove('active');
      });

      tab.classList.add('active');
      const targetBox = document.querySelector(`.rotation-msg-box[data-slot="${slot}"]`);
      if (targetBox) {
        targetBox.style.display = 'block';
        targetBox.classList.add('active');
        targetBox.focus();
      }

      if (window.setPhonePreviewActiveSlot) {
        window.setPhonePreviewActiveSlot(slot);
      }
    });
  });

  // Variable chip insertion into currently active variant textarea
  document.querySelectorAll('.chip-var').forEach(chip => {
    chip.addEventListener('click', () => {
      const variable = chip.getAttribute('data-var');
      const activeTextarea = document.querySelector('.rotation-msg-box.active') || campMessageText;
      const start = activeTextarea.selectionStart;
      const end = activeTextarea.selectionEnd;
      const text = activeTextarea.value;
      activeTextarea.value = text.substring(0, start) + variable + text.substring(end);
      activeTextarea.focus();
      activeTextarea.selectionStart = activeTextarea.selectionEnd = start + variable.length;
      activeTextarea.dispatchEvent(new Event('input'));
    });
  });

  // Spintax Preview
  function spin(text) {
    const regex = /\{([^{}]+)\}/;
    let matches;
    while ((matches = regex.exec(text)) !== null) {
      const choices = matches[1].split('|');
      const pick = choices[Math.floor(Math.random() * choices.length)];
      text = text.replace(matches[0], pick);
    }
    return text;
  }

  btnPreviewSpintax.addEventListener('click', () => {
    const activeTextarea = document.querySelector('.rotation-msg-box.active') || campMessageText;
    const template = activeTextarea.value;
    spintaxSamplesContainer.innerHTML = '';

    for (let i = 1; i <= 3; i++) {
      const mockContact = { Name: 'Rahul Sharma', Company: 'Apex Global', Phone: '+919876543210' };
      let filled = template
        .replace(/{{Name}}/gi, mockContact.Name)
        .replace(/{{Company}}/gi, mockContact.Company)
        .replace(/{{Phone}}/gi, mockContact.Phone);
      const spun = spin(filled);

      const box = document.createElement('div');
      box.style.background = 'rgba(0,0,0,0.3)';
      box.style.border = '1px solid rgba(255,255,255,0.08)';
      box.style.padding = '12px';
      box.style.borderRadius = '8px';
      box.style.marginBottom = '10px';
      box.style.whiteSpace = 'pre-wrap';
      box.style.fontSize = '12px';
      box.innerHTML = `<strong>Variation #${i}:</strong>\n${spun}`;
      spintaxSamplesContainer.appendChild(box);
    }

    spintaxModal.style.display = 'flex';
  });

  closeSpintaxModal.addEventListener('click', () => {
    spintaxModal.style.display = 'none';
  });

  // Logging utility
  function appendLog(text, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${text}`;
    campaignLogStream.appendChild(entry);
    campaignLogStream.scrollTop = campaignLogStream.scrollHeight;
  }

  btnClearLog.addEventListener('click', () => {
    campaignLogStream.innerHTML = '';
  });

  // Launch Campaign
  btnStartCampaign.addEventListener('click', async () => {
    const contacts = parseContactsList();
    if (contacts.length === 0) {
      window.showToast('Please enter at least one recipient phone number.', 'error');
      return;
    }

    // Collect all message variants (Phase 7E)
    const allMessages = [];
    for (let s = 1; s <= 5; s++) {
      const id = s === 1 ? 'campMessageText' : `campMessageText${s}`;
      const val = document.getElementById(id)?.value.trim();
      if (val) allMessages.push(val);
    }

    if (allMessages.length === 0) {
      window.showToast('Please enter at least one message template.', 'error');
      return;
    }

    // Interactive buttons & poll payload
    const interactiveType = document.getElementById('campInteractiveType')?.value || 'none';
    let buttons = null;
    if (interactiveType === 'link') {
      buttons = {
        type: 'link',
        text: document.getElementById('btnLinkText')?.value.trim() || 'Visit Website',
        url: document.getElementById('btnLinkUrl')?.value.trim() || ''
      };
    } else if (interactiveType === 'call') {
      buttons = {
        type: 'call',
        text: document.getElementById('btnCallText')?.value.trim() || 'Call Support',
        phone: document.getElementById('btnCallPhone')?.value.trim() || ''
      };
    } else if (interactiveType === 'quickreply') {
      buttons = {
        type: 'quickreply',
        options: [
          document.getElementById('btnQuickReply1')?.value.trim(),
          document.getElementById('btnQuickReply2')?.value.trim(),
          document.getElementById('btnQuickReply3')?.value.trim()
        ].filter(Boolean)
      };
    } else if (interactiveType === 'poll') {
      buttons = {
        type: 'poll',
        question: document.getElementById('pollQuestion')?.value.trim() || 'Quick Poll',
        options: [
          document.getElementById('pollOpt1')?.value.trim(),
          document.getElementById('pollOpt2')?.value.trim(),
          document.getElementById('pollOpt3')?.value.trim(),
          document.getElementById('pollOpt4')?.value.trim()
        ].filter(Boolean),
        multiSelect: !!document.getElementById('pollMultiSelect')?.checked
      };
    }

    const rotationMode = document.getElementById('campRotationMode')?.value || 'random';

    // Verify an active account is connected
    const accounts = await window.api.getAccounts();
    const activeAcc = accounts.find(a => a.isActive);
    if (!activeAcc || activeAcc.status !== 'CONNECTED') {
      window.showToast('Active WhatsApp account is not connected! Please link/scan QR first.', 'error');
      return;
    }

    btnStartCampaign.disabled = true;
    campaignControls.style.display = 'flex';
    btnPauseCampaign.style.display = 'inline-block';
    btnResumeCampaign.style.display = 'none';

    // Switch right view to Dispatch Monitor so user sees progress
    if (window.switchToDispatchMonitor) window.switchToDispatchMonitor();

    campaignBannerText.textContent = `Dispatching campaign to ${contacts.length} recipients...`;
    campaignStatusBanner.style.background = 'rgba(16, 185, 129, 0.15)';
    campaignStatusBanner.style.color = '#34d399';

    appendLog(`Starting campaign "${campTitle.value}" (${contacts.length} recipients, ${allMessages.length} message variants)...`, 'info');

    try {
      await window.api.startCampaign({
        title: campTitle.value,
        template: allMessages[0],
        messages: allMessages,
        buttons: buttons,
        rotationMode: rotationMode,
        contacts: contacts,
        attachments: currentAttachment ? [currentAttachment] : [],
        options: {
          minDelay: parseInt(campMinDelay.value, 10) || 5,
          maxDelay: parseInt(campMaxDelay.value, 10) || 15,
          batchSize: parseInt(campBatchSize.value, 10) || 20,
          batchPause: parseInt(campBatchPause.value, 10) || 90,
          simulateTyping: true,
          typingDuration: 2
        }
      });
    } catch (err) {
      appendLog('Failed to start campaign: ' + err.message, 'danger');
      btnStartCampaign.disabled = false;
      campaignControls.style.display = 'none';
    }
  });

  // Campaign Pause / Resume / Stop
  btnPauseCampaign.addEventListener('click', async () => {
    await window.api.pauseCampaign();
    btnPauseCampaign.style.display = 'none';
    btnResumeCampaign.style.display = 'inline-block';
    campaignBannerText.textContent = 'Campaign paused.';
    appendLog('Campaign paused by user.', 'warning');
  });

  btnResumeCampaign.addEventListener('click', async () => {
    await window.api.resumeCampaign();
    btnResumeCampaign.style.display = 'none';
    btnPauseCampaign.style.display = 'inline-block';
    campaignBannerText.textContent = 'Campaign resumed.';
    appendLog('Campaign resumed.', 'info');
  });

  btnStopCampaign.addEventListener('click', async () => {
    if (confirm('Are you sure you want to abort the current campaign?')) {
      await window.api.stopCampaign();
      campaignControls.style.display = 'none';
      btnStartCampaign.disabled = false;
      campaignBannerText.textContent = 'Campaign aborted.';
      appendLog('Campaign stopped.', 'danger');
    }
  });

  // ─── Campaign Scheduler (Phase 3.1) ──────────────────────────────────
  const btnScheduleCampaign = document.getElementById('btnScheduleCampaign');
  const scheduleToggle      = document.getElementById('scheduleToggle');
  const scheduleDatePanel   = document.getElementById('scheduleDatePanel');
  const scheduleDateInput   = document.getElementById('scheduleDateInput');

  if (scheduleToggle && scheduleDatePanel) {
    scheduleToggle.addEventListener('change', () => {
      scheduleDatePanel.style.display = scheduleToggle.checked ? 'flex' : 'none';
    });
  }

  if (btnScheduleCampaign) {
    btnScheduleCampaign.addEventListener('click', async () => {
      const contacts = parseContactsList();
      if (contacts.length === 0) { window.showToast('No contacts loaded.', 'error'); return; }
      if (!scheduleDateInput || !scheduleDateInput.value) { window.showToast('Please set a schedule date & time.', 'error'); return; }
      const runAt = new Date(scheduleDateInput.value).getTime();
      if (runAt <= Date.now()) { window.showToast('Schedule time must be in the future!', 'error'); return; }
      const payload = {
        title: campTitle?.value || 'Scheduled Campaign',
        template: campMessageText?.value || '',
        contacts,
        options: {
          minDelay: parseInt(campMinDelay?.value || 6),
          maxDelay: parseInt(campMaxDelay?.value || 18),
          batchSize: parseInt(campBatchSize?.value || 20),
          batchPause: parseInt(campBatchPause?.value || 90)
        }
      };
      await window.api.scheduleCampaign(payload, runAt);
      window.showToast(`Campaign scheduled for ${new Date(runAt).toLocaleString()}! (${contacts.length} recipients)`, 'success');
      appendLog(`📅 Scheduled for: ${new Date(runAt).toLocaleString()} — ${contacts.length} recipients`, 'info');
    });
  }

  // Auto-trigger notification from scheduler
  if (window.api.onScheduleTriggered) {
    window.api.onScheduleTriggered((data) => {
      window.showToast(`🔔 Scheduled campaign "${data.campaign?.title}" is now running!`, 'success');
      appendLog(`Auto-started scheduled campaign: ${data.campaign?.title}`, 'success');
    });
  }

  // Listen to live campaign events from main process
  window.api.onCampaignProgress((data) => {
    const { event, stats, item, delayMs, pauseMs, sentCount } = data;

    if (stats) {
      statTotal.textContent = stats.total;
      statSent.textContent = stats.sent;
      statFailed.textContent = stats.failed;
      statPending.textContent = stats.pending;
      const pct = stats.total > 0 ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) : 0;
      campaignProgressFill.style.width = `${pct}%`;
    }

    switch (event) {
      case 'item_sending':
        appendLog(`Sending message to +${item.phone}...`, 'info');
        break;
      case 'item_sent':
        appendLog(`✓ Delivered to +${item.phone}`, 'success');
        break;
      case 'item_failed':
        appendLog(`✗ Failed for +${item.phone}: ${item.error || 'Unknown error'}`, 'danger');
        break;
      case 'delay_started':
        appendLog(`Anti-ban pause: waiting ${(delayMs / 1000).toFixed(1)}s...`, 'info');
        break;
      case 'batch_pause':
        appendLog(`Batch pause: Sent ${sentCount} messages. Sleeping ${(pauseMs / 1000)}s...`, 'warning');
        break;
      case 'completed':
        appendLog('🎉 Campaign completed successfully!', 'success');
        campaignBannerText.textContent = 'Campaign execution completed.';
        btnStartCampaign.disabled = false;
        campaignControls.style.display = 'none';
        window.showToast('Bulk campaign dispatch completed!', 'success');
        break;
    }
  });

  // Initialize count
  updateContactCount();
});
