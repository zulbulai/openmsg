/**
 * Phone Live Preview Controller — Phase 7E
 * Renders real-time WhatsApp dark-mode smartphone simulation with
 * Spintax resolution, interactive buttons, polls, and media attachments.
 */

(function () {
  let activeSlot = 1;

  // Simple Spintax resolver for preview
  function resolveSpintax(text) {
    if (!text) return '';
    const regex = /\{([^{}]+)\}/;
    let matches;
    let result = text;
    while ((matches = regex.exec(result)) !== null) {
      const choices = matches[1].split('|');
      const pick = choices[Math.floor(Math.random() * choices.length)];
      result = result.replace(matches[0], pick);
    }
    return result;
  }

  // Format sample contact data into preview text
  function formatPreviewText(rawText) {
    if (!rawText) return 'Type your message on the left to see live preview...';
    let text = rawText
      .replace(/{{Name}}/gi, 'John Doe')
      .replace(/{{Company}}/gi, 'Acme Global Corp')
      .replace(/{{Phone}}/gi, '+1 (555) 234-5678');
    return resolveSpintax(text);
  }

  function updatePreview() {
    const activeTextarea = document.getElementById(activeSlot === 1 ? 'campMessageText' : `campMessageText${activeSlot}`);
    const rawText = activeTextarea ? activeTextarea.value.trim() : '';
    
    // Update message text
    const msgEl = document.getElementById('phoneMsgText');
    if (msgEl) {
      msgEl.textContent = formatPreviewText(rawText);
    }

    // Update timestamp to current
    const timeEl = document.getElementById('phoneTimestamp');
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Update Interactive CTA Buttons or Polls
    const interactiveType = document.getElementById('campInteractiveType')?.value || 'none';
    const container = document.getElementById('phoneInteractiveButtons');
    if (!container) return;

    container.innerHTML = '';

    if (interactiveType === 'link') {
      const linkText = document.getElementById('btnLinkText')?.value || 'Visit Website';
      const chip = document.createElement('div');
      chip.className = 'wa-btn-chip';
      chip.innerHTML = `<span>🔗</span><span>${escapeHtml(linkText)}</span>`;
      container.appendChild(chip);
    } else if (interactiveType === 'call') {
      const callText = document.getElementById('btnCallText')?.value || 'Call Sales';
      const chip = document.createElement('div');
      chip.className = 'wa-btn-chip';
      chip.innerHTML = `<span>📞</span><span>${escapeHtml(callText)}</span>`;
      container.appendChild(chip);
    } else if (interactiveType === 'quickreply') {
      const r1 = document.getElementById('btnQuickReply1')?.value.trim();
      const r2 = document.getElementById('btnQuickReply2')?.value.trim();
      const r3 = document.getElementById('btnQuickReply3')?.value.trim();
      [r1, r2, r3].filter(Boolean).forEach(label => {
        const chip = document.createElement('div');
        chip.className = 'wa-btn-chip';
        chip.innerHTML = `<span>⚡</span><span>${escapeHtml(label)}</span>`;
        container.appendChild(chip);
      });
    } else if (interactiveType === 'poll') {
      const question = document.getElementById('pollQuestion')?.value || 'Quick Poll';
      const opts = [
        document.getElementById('pollOpt1')?.value.trim(),
        document.getElementById('pollOpt2')?.value.trim(),
        document.getElementById('pollOpt3')?.value.trim(),
        document.getElementById('pollOpt4')?.value.trim()
      ].filter(Boolean);

      const pollCard = document.createElement('div');
      pollCard.className = 'wa-poll-preview';
      let html = `<div class="wa-poll-title">📊 ${escapeHtml(question)}</div>`;
      opts.forEach(opt => {
        html += `<div class="wa-poll-opt"><span class="wa-poll-opt-radio"></span><span>${escapeHtml(opt)}</span></div>`;
      });
      pollCard.innerHTML = html;
      container.appendChild(pollCard);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Update sender account identity in header
  async function refreshPhoneHeader() {
    try {
      if (window.api && window.api.getAccounts) {
        const accounts = await window.api.getAccounts();
        const active = accounts.find(a => a.isActive) || accounts[0];
        if (active) {
          const nameEl = document.getElementById('phoneSenderName');
          const avatarEl = document.getElementById('phoneAvatar');
          if (nameEl) nameEl.textContent = active.name || 'Your Account';
          if (avatarEl) {
            const initials = (active.name || 'OM').substring(0, 2).toUpperCase();
            avatarEl.textContent = initials;
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    // 1. Hook up all textareas (slot 1 to 5)
    for (let slot = 1; slot <= 5; slot++) {
      const id = slot === 1 ? 'campMessageText' : `campMessageText${slot}`;
      const textarea = document.getElementById(id);
      if (textarea) {
        textarea.addEventListener('input', () => {
          updateSlotIndicators();
          updatePreview();
        });
      }
    }

    // 2. Hook up interactive controls
    const intSelect = document.getElementById('campInteractiveType');
    if (intSelect) {
      intSelect.addEventListener('change', () => {
        const type = intSelect.value;
        const linkPanel = document.getElementById('interactiveLinkPanel');
        const callPanel = document.getElementById('interactiveCallPanel');
        const qrPanel = document.getElementById('interactiveQuickReplyPanel');
        const pollPanel = document.getElementById('interactivePollPanel');

        if (linkPanel) linkPanel.style.display = type === 'link' ? 'block' : 'none';
        if (callPanel) callPanel.style.display = type === 'call' ? 'block' : 'none';
        if (qrPanel) qrPanel.style.display = type === 'quickreply' ? 'block' : 'none';
        if (pollPanel) pollPanel.style.display = type === 'poll' ? 'block' : 'none';

        updatePreview();
      });
    }

    // Listen to all subpanel input changes
    const subpanelInputs = [
      'btnLinkText', 'btnLinkUrl', 'btnCallText', 'btnCallPhone',
      'btnQuickReply1', 'btnQuickReply2', 'btnQuickReply3',
      'pollQuestion', 'pollOpt1', 'pollOpt2', 'pollOpt3', 'pollOpt4'
    ];
    subpanelInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updatePreview);
    });

    // 3. Reroll Spintax button inside phone mockup
    const btnReroll = document.getElementById('btnRerollPreview');
    if (btnReroll) {
      btnReroll.addEventListener('click', () => {
        updatePreview();
        const bubble = document.getElementById('phoneBubble');
        if (bubble) {
          bubble.style.transform = 'scale(0.98)';
          setTimeout(() => { bubble.style.transform = 'scale(1)'; }, 150);
        }
      });
    }

    // 4. View Switcher (Live Phone Mockup vs Dispatch Monitor)
    const tabBtnPreview = document.getElementById('tabBtnPhonePreview');
    const tabBtnMonitor = document.getElementById('tabBtnLiveMonitor');
    const panelPreview = document.getElementById('panelPhonePreview');
    const panelMonitor = document.getElementById('panelLiveMonitor');

    if (tabBtnPreview && tabBtnMonitor && panelPreview && panelMonitor) {
      tabBtnPreview.addEventListener('click', () => {
        tabBtnPreview.classList.add('active');
        tabBtnMonitor.classList.remove('active');
        panelPreview.style.display = 'flex';
        panelMonitor.style.display = 'none';
      });

      tabBtnMonitor.addEventListener('click', () => {
        tabBtnMonitor.classList.add('active');
        tabBtnPreview.classList.remove('active');
        panelPreview.style.display = 'none';
        panelMonitor.style.display = 'block';
      });
    }

    // Global helper so campaigns.js can switch to monitor when launch is clicked
    window.switchToDispatchMonitor = function () {
      if (tabBtnMonitor) tabBtnMonitor.click();
    };

    // Global helper to set active slot for rotation
    window.setPhonePreviewActiveSlot = function (slot) {
      activeSlot = slot;
      updatePreview();
    };

    function updateSlotIndicators() {
      let filledCount = 0;
      for (let s = 1; s <= 5; s++) {
        const id = s === 1 ? 'campMessageText' : `campMessageText${s}`;
        const el = document.getElementById(id);
        const dot = document.getElementById(`dotMsg${s}`);
        const isFilled = el && el.value.trim().length > 0;
        if (dot) {
          dot.textContent = isFilled ? '●' : '○';
          dot.className = isFilled ? 'tab-indicator filled' : 'tab-indicator';
        }
        if (isFilled) filledCount++;
      }
      const badge = document.getElementById('activeVariantsBadge');
      if (badge) {
        badge.textContent = `${filledCount} Variant${filledCount === 1 ? '' : 's'} Active`;
      }
    }

    // Attachment media preview toggle
    const attInput = document.getElementById('campAttachmentInput');
    const mediaPrev = document.getElementById('phoneMediaPreview');
    if (attInput && mediaPrev) {
      attInput.addEventListener('change', () => {
        if (attInput.files && attInput.files[0]) {
          mediaPrev.style.display = 'block';
          mediaPrev.querySelector('span').textContent = `📎 ${attInput.files[0].name}`;
        } else {
          mediaPrev.style.display = 'none';
        }
      });
    }

    const btnRemoveAtt = document.getElementById('btnRemoveAttachment');
    if (btnRemoveAtt && mediaPrev) {
      btnRemoveAtt.addEventListener('click', () => {
        mediaPrev.style.display = 'none';
      });
    }

    // Initial render
    refreshPhoneHeader();
    updateSlotIndicators();
    updatePreview();
  });
})();
