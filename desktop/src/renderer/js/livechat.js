/**
 * Live Chat & Inbox CRM Controller
 * Multi-account unified WhatsApp inbox for real-time messaging
 */

window.addEventListener('DOMContentLoaded', () => {
  // Elements
  const livechatPane = document.getElementById('pane-livechat');
  const accountFilter = document.getElementById('livechatAccountFilter');
  const searchInput = document.getElementById('livechatSearchInput');
  const btnSync = document.getElementById('btnSyncLiveChat');
  const threadsList = document.getElementById('livechatThreadsList');
  const threadCount = document.getElementById('livechatThreadCount');
  
  const filterBtnAll = document.getElementById('livechatFilterAll');
  const filterBtnUnread = document.getElementById('livechatFilterUnread');
  const filterBtnGroups = document.getElementById('livechatFilterGroups');

  const btnPickCanned = document.getElementById('btnLiveChatPickCanned');
  const cannedPopover = document.getElementById('livechatCannedPopover');
  const closeCannedPopover = document.getElementById('closeCannedPopover');
  const cannedPopoverList = document.getElementById('livechatCannedPopoverList');

  const emptyState = document.getElementById('livechatEmptyState');
  const activeChat = document.getElementById('livechatActiveChat');
  const activeAvatar = document.getElementById('livechatActiveAvatar');
  const activeName = document.getElementById('livechatActiveName');
  const activePhoneDisplay = document.getElementById('livechatActivePhone');
  const activeAccountBadge = document.getElementById('livechatActiveAccountBadge');
  const btnOpenWeb = document.getElementById('btnLiveChatOpenWeb');
  const btnDeleteThread = document.getElementById('btnLiveChatDeleteThread');
  
  const messagesContainer = document.getElementById('livechatMessagesContainer');
  const composerInput = document.getElementById('livechatComposerInput');
  const btnSend = document.getElementById('btnLiveChatSend');

  // State
  let currentThreads = [];
  let activePhone = null;
  let activeChatId = null;
  let activeContactName = null;
  let activeAccountId = null;
  let accountsMap = new Map();
  let activeCategoryFilter = 'all'; // 'all' | 'unread' | 'groups'

  // Helper: Avatar color palette generator based on phone string
  const AVATAR_COLORS = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #10b981, #047857)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #f59e0b, #b45309)',
    'linear-gradient(135deg, #06b6d4, #0e7490)',
    'linear-gradient(135deg, #6366f1, #4338ca)'
  ];

  function getAvatarGradient(str) {
    if (!str) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
  }

  function getInitials(name, phone) {
    if (name && name !== phone) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return phone ? phone.slice(-2) : 'WA';
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function formatDividerDate(timestamp) {
    if (!timestamp) return 'Today';
    const d = new Date(timestamp);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // Format message text and media chips for rich WhatsApp bubbles
  function formatMessageHtml(msg) {
    if (!msg) return '';
    const text = String(msg.body || '').trim();
    const type = String(msg.type || 'chat').toLowerCase();

    let chip = '';
    if (type === 'image' || text.startsWith('📷')) {
      chip = '<span class="livechat-media-chip photo">📷 Photo</span> ';
    } else if (type === 'video' || text.startsWith('🎥')) {
      chip = '<span class="livechat-media-chip video">🎥 Video</span> ';
    } else if (type === 'audio' || type === 'ptt' || text.startsWith('🎤')) {
      chip = '<span class="livechat-media-chip voice">🎤 Voice Note</span> ';
    } else if (type === 'document' || text.startsWith('📄')) {
      chip = '<span class="livechat-media-chip doc">📄 Document</span> ';
    } else if (type === 'location' || text.startsWith('📍')) {
      chip = '<span class="livechat-media-chip loc">📍 Location</span> ';
    } else if (type === 'sticker' || text.startsWith('👾')) {
      chip = '<span class="livechat-media-chip sticker">👾 Sticker</span> ';
    } else if (type === 'poll' || text.startsWith('📊')) {
      chip = '<span class="livechat-media-chip poll">📊 Poll</span> ';
    }

    if (!text && !chip) {
      return '<span style="font-style:italic; opacity:0.75;">(Media content)</span>';
    }

    let cleanText = text;
    if (chip) {
      cleanText = cleanText.replace(/^(📷 Photo|🎥 Video|🎤 Voice message|👾 Sticker|📄 Document:?|📍 Location:?|📊 Poll:?)\s*/i, '');
    }

    return chip + (cleanText ? escapeHtml(cleanText) : '');
  }

  // Load accounts for filter dropdown
  async function loadAccountsFilter() {
    try {
      const accounts = await window.api.getAccounts();
      accountsMap.clear();
      
      const prevVal = accountFilter.value;
      accountFilter.innerHTML = '<option value="">All Accounts</option>';
      
      accounts.forEach(acc => {
        accountsMap.set(acc.id, acc);
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = `${acc.name} (${acc.phone ? '+' + acc.phone : 'Unlinked'})`;
        if (opt.value === prevVal) opt.selected = true;
        accountFilter.appendChild(opt);
      });
    } catch (e) {
      console.warn('[LiveChat] Failed to load accounts filter:', e);
    }
  }

  // Load chat threads from database with auto-sync fallback
  async function loadThreads(autoSyncIfEmpty = true) {
    const selectedAcc = accountFilter ? accountFilter.value : null;
    try {
      const threads = await window.api.getChatThreads(selectedAcc || null);
      currentThreads = Array.isArray(threads) ? threads : [];
      renderThreads();

      // Auto-sync if no chats found yet to populate from active WhatsApp session
      if (currentThreads.length === 0 && autoSyncIfEmpty && window.api && window.api.syncRecentChats) {
        window.api.syncRecentChats(selectedAcc || null).then(synced => {
          if (Array.isArray(synced) && synced.length > 0) {
            currentThreads = synced;
            renderThreads();
          }
        }).catch(err => {
          console.warn('[LiveChat] Auto-sync notice:', err.message);
        });
      }
    } catch (err) {
      console.error('[LiveChat] Error loading threads:', err);
    }
  }

  function renderThreads() {
    if (!threadsList) return;
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filtered = currentThreads.filter(t => {
      // Category filter: All, Unread, Groups
      if (activeCategoryFilter === 'unread' && (!t.unreadCount || t.unreadCount <= 0)) {
        return false;
      }
      if (activeCategoryFilter === 'groups') {
        const isGrp = Boolean(t.isGroup || String(t.phone).includes('-') || String(t.id || '').includes('@g.us'));
        if (!isGrp) return false;
      }

      if (!query) return true;
      const name = (t.name || '').toLowerCase();
      const phone = (t.phone || '').toLowerCase();
      const lastMsg = (t.lastMessage || '').toLowerCase();
      return name.includes(query) || phone.includes(query) || lastMsg.includes(query);
    });

    if (threadCount) {
      threadCount.textContent = `${filtered.length} Conversation${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      threadsList.innerHTML = `
        <div class="text-center text-muted" style="padding:40px 16px; font-size:12px;">
          <div style="font-size:24px; margin-bottom:8px;">💬</div>
          ${query ? 'No conversations matching search' : (activeCategoryFilter !== 'all' ? 'No ' + activeCategoryFilter + ' chats found.' : 'No chat conversations yet.<br><small style="color:var(--text-dim);">Incoming messages or broadcasts will appear here automatically.</small>')}
        </div>
      `;
      return;
    }

    threadsList.innerHTML = '';
    filtered.forEach(thread => {
      const item = document.createElement('div');
      item.className = `livechat-thread-item ${activePhone === thread.phone ? 'active' : ''}`;
      item.setAttribute('data-phone', thread.phone);

      const unreadBadge = thread.unreadCount > 0 
        ? `<span class="livechat-unread-badge">${thread.unreadCount}</span>` 
        : '';

      const acc = thread.accountId ? accountsMap.get(thread.accountId) : null;
      const accTag = acc ? `<span class="livechat-thread-acc-tag">${acc.name}</span>` : '';

      const initials = getInitials(thread.name, thread.phone);
      const bgGrad = getAvatarGradient(thread.phone);

      item.innerHTML = `
        <div class="livechat-item-avatar" style="background:${bgGrad};">${initials}</div>
        <div class="livechat-item-content">
          <div class="livechat-item-top">
            <span class="livechat-item-name" title="${thread.name || thread.phone}">${thread.name || '+' + thread.phone}</span>
            <span class="livechat-item-time">${formatTime(thread.timestamp)}</span>
          </div>
          <div class="livechat-item-bottom">
            <span class="livechat-item-snippet" title="${escapeHtml(thread.lastMessage || '')}">
              ${escapeHtml(thread.lastMessage || 'No messages')}
            </span>
            <div style="display:flex; align-items:center; gap:4px;">
              ${accTag}
              ${unreadBadge}
            </div>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        selectConversation(thread.phone, thread.name || thread.phone, thread.accountId);
      });

      threadsList.appendChild(item);
    });
  }

  // Select a conversation
  async function selectConversation(phone, name, accountId) {
    if (!phone) return;
    activePhone = String(phone).replace(/\D+/g, '');
    activeContactName = name || activePhone;
    activeAccountId = accountId || (accountFilter ? accountFilter.value : null);

    // Update active UI classes
    document.querySelectorAll('.livechat-thread-item').forEach(el => {
      if (el.getAttribute('data-phone') === activePhone) {
        el.classList.add('active');
        const badge = el.querySelector('.livechat-unread-badge');
        if (badge) badge.remove();
      } else {
        el.classList.remove('active');
      }
    });

    // Mark as read in DB
    try {
      await window.api.markChatRead(activePhone);
      const found = currentThreads.find(t => t.phone === activePhone);
      if (found) found.unreadCount = 0;
    } catch(e) {}

    // Switch views
    if (emptyState) emptyState.style.display = 'none';
    if (activeChat) activeChat.style.display = 'flex';

    // Set header
    if (activeName) activeName.textContent = activeContactName;
    if (activePhoneDisplay) activePhoneDisplay.textContent = '+' + activePhone;
    if (activeAvatar) {
      activeAvatar.textContent = getInitials(activeContactName, activePhone);
      activeAvatar.style.background = getAvatarGradient(activePhone);
    }
    if (activeAccountBadge) {
      const acc = activeAccountId ? accountsMap.get(activeAccountId) : null;
      activeAccountBadge.textContent = acc ? acc.name : 'Active Line';
    }

    // Load messages
    await loadMessagesForActiveChat();

    // Focus composer
    if (composerInput) composerInput.focus();
  }

  // Load and render message history for active chat
  async function loadMessagesForActiveChat() {
    if (!activePhone || !messagesContainer) return;
    messagesContainer.innerHTML = `
      <div class="text-center text-muted" style="padding:40px 0; font-size:12px;">
        <div class="spinner" style="margin-bottom:8px;"></div>
        Loading message history...
      </div>
    `;

    try {
      const msgs = await window.api.getChatMessages(activePhone, activeAccountId);
      renderMessages(msgs || []);
    } catch (err) {
      console.error('[LiveChat] Error loading messages:', err);
      messagesContainer.innerHTML = `<div class="text-center text-muted" style="padding:20px;">Failed to load messages</div>`;
    }
  }

  function renderMessages(messages) {
    if (!messagesContainer) return;
    messagesContainer.innerHTML = '';

    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="livechat-empty-thread-note">
          <p>No previous messages in this conversation.</p>
          <span style="font-size:11px; color:var(--text-dim);">Type a reply below to start the conversation.</span>
        </div>
      `;
      return;
    }

    let lastDateStr = null;

    messages.forEach(msg => {
      const msgDateStr = formatDividerDate(msg.timestamp);
      if (msgDateStr !== lastDateStr) {
        lastDateStr = msgDateStr;
        const divider = document.createElement('div');
        divider.className = 'livechat-date-divider';
        divider.innerHTML = `<span>${msgDateStr}</span>`;
        messagesContainer.appendChild(divider);
      }

      const bubbleWrap = document.createElement('div');
      const isOutgoing = Boolean(msg.fromMe);
      bubbleWrap.className = `livechat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`;

      const timeStr = formatTime(msg.timestamp);
      const statusIcon = isOutgoing 
        ? `<span class="livechat-check-icon" title="Delivered">✓✓</span>` 
        : '';

      bubbleWrap.innerHTML = `
        <div class="livechat-bubble ${isOutgoing ? 'bubble-outgoing' : 'bubble-incoming'}">
          <div class="livechat-bubble-text">${formatMessageHtml(msg)}</div>
          <div class="livechat-bubble-meta">
            <span class="livechat-bubble-time">${timeStr}</span>
            ${statusIcon}
          </div>
        </div>
      `;

      messagesContainer.appendChild(bubbleWrap);
    });

    scrollToBottom();
  }

  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Send message from composer
  async function sendMessage() {
    if (!activePhone || !composerInput) return;
    const rawText = composerInput.value.trim();
    if (!rawText) return;

    // Resolve simple Spintax or contact dynamic tags
    let resolvedText = rawText
      .replace(/{([^{}]+)}/g, (match, choices) => {
        const arr = choices.split('|');
        return arr[Math.floor(Math.random() * arr.length)];
      })
      .replace(/{{name}}/gi, activeContactName || 'Friend')
      .replace(/{{phone}}/gi, activePhone)
      .replace(/{{time}}/gi, new Date().toLocaleTimeString([]));

    composerInput.value = '';
    composerInput.disabled = true;
    if (btnSend) btnSend.disabled = true;

    // Render optimistic message bubble
    const tempBubble = document.createElement('div');
    tempBubble.className = 'livechat-bubble-row outgoing';
    tempBubble.innerHTML = `
      <div class="livechat-bubble bubble-outgoing sending">
        <div class="livechat-bubble-text">${escapeHtml(resolvedText)}</div>
        <div class="livechat-bubble-meta">
          <span class="livechat-bubble-time">${formatTime(Date.now())}</span>
          <span class="livechat-check-icon">⏳</span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(tempBubble);
    scrollToBottom();

    try {
      await window.api.sendChatMessage(activePhone, resolvedText, activeAccountId);
      tempBubble.querySelector('.livechat-bubble').classList.remove('sending');
      tempBubble.querySelector('.livechat-check-icon').textContent = '✓✓';
      
      // Update thread in left list
      const thread = currentThreads.find(t => t.phone === activePhone);
      if (thread) {
        thread.lastMessage = resolvedText;
        thread.timestamp = Date.now();
        renderThreads();
      } else {
        await loadThreads();
      }
    } catch (err) {
      console.error('[LiveChat] Send error:', err);
      tempBubble.querySelector('.livechat-check-icon').textContent = '⚠️';
      tempBubble.querySelector('.livechat-check-icon').title = 'Failed: ' + err.message;
      window.showToast('Failed to send message: ' + err.message, 'error');
    } finally {
      composerInput.disabled = false;
      if (btnSend) btnSend.disabled = false;
      composerInput.focus();
    }
  }

  // Sync recent chats from WhatsApp Web
  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.innerHTML = `<span class="spinner" style="width:12px; height:12px; display:inline-block; border-width:2px; vertical-align:middle; margin-right:4px;"></span> Syncing...`;
      try {
        const updated = await window.api.syncRecentChats(accountFilter ? accountFilter.value : null);
        currentThreads = Array.isArray(updated) ? updated : [];
        renderThreads();
        window.showToast('Chats synchronized with WhatsApp Web', 'success');
      } catch (err) {
        window.showToast('Sync error: ' + err.message, 'error');
      } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Sync`;
      }
    });
  }

  // Open Web button in chat header
  if (btnOpenWeb) {
    btnOpenWeb.addEventListener('click', async () => {
      if (!activeAccountId && currentThreads.length > 0) {
        const t = currentThreads.find(x => x.phone === activePhone);
        if (t && t.accountId) activeAccountId = t.accountId;
      }
      try {
        await window.api.openAccountWindow(activeAccountId || null);
        window.showToast('Opened WhatsApp Web session window', 'info');
      } catch (e) {
        window.showToast('Failed to open web window', 'error');
      }
    });
  }

  // Delete thread button in chat header
  if (btnDeleteThread) {
    btnDeleteThread.addEventListener('click', async () => {
      if (!activePhone) return;
      if (confirm(`Remove chat thread for +${activePhone} from local view?`)) {
        await window.api.deleteChatThread(activePhone);
        activePhone = null;
        if (activeChat) activeChat.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        await loadThreads();
        window.showToast('Conversation removed', 'info');
      }
    });
  }

  // Spintax / Quick tags buttons
  document.querySelectorAll('.btn-chat-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-insert');
      if (!tag || !composerInput) return;
      const start = composerInput.selectionStart || 0;
      const end = composerInput.selectionEnd || 0;
      const val = composerInput.value;
      composerInput.value = val.substring(0, start) + tag + val.substring(end);
      composerInput.focus();
      composerInput.selectionStart = composerInput.selectionEnd = start + tag.length;
    });
  });

  // Composer enter to send
  if (composerInput) {
    composerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (btnSend) {
    btnSend.addEventListener('click', sendMessage);
  }

  // Filter pills (All, Unread, Groups)
  function setCategoryFilter(filter) {
    activeCategoryFilter = filter;
    if (filterBtnAll) filterBtnAll.classList.toggle('active', filter === 'all');
    if (filterBtnUnread) filterBtnUnread.classList.toggle('active', filter === 'unread');
    if (filterBtnGroups) filterBtnGroups.classList.toggle('active', filter === 'groups');
    renderThreads();
  }

  if (filterBtnAll) filterBtnAll.addEventListener('click', () => setCategoryFilter('all'));
  if (filterBtnUnread) filterBtnUnread.addEventListener('click', () => setCategoryFilter('unread'));
  if (filterBtnGroups) filterBtnGroups.addEventListener('click', () => setCategoryFilter('groups'));

  // Quick Replies popover picker
  if (btnPickCanned && cannedPopover) {
    btnPickCanned.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isVisible = cannedPopover.style.display !== 'none';
      if (isVisible) {
        cannedPopover.style.display = 'none';
        return;
      }

      if (cannedPopoverList) {
        cannedPopoverList.innerHTML = '<div style="font-size:12px; color:var(--text-muted); padding:8px;">Loading canned responses...</div>';
      }
      cannedPopover.style.display = 'block';

      try {
        const cannedList = (await window.api.getCannedResponses()) || [];
        if (!cannedPopoverList) return;
        if (cannedList.length === 0) {
          cannedPopoverList.innerHTML = `
            <div style="font-size:12px; color:var(--text-muted); padding:8px;">
              No canned responses found.<br>
              <a href="#" id="linkGoToCanned" style="color:var(--accent-primary); font-size:11px;">Create one in Quick Replies tab &rarr;</a>
            </div>
          `;
          const link = document.getElementById('linkGoToCanned');
          if (link) {
            link.addEventListener('click', (ev) => {
              ev.preventDefault();
              cannedPopover.style.display = 'none';
              const tab = document.querySelector('[data-tab="canned"]');
              if (tab) tab.click();
            });
          }
          return;
        }

        cannedPopoverList.innerHTML = '';
        cannedList.forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'padding:6px 8px; border-radius:4px; cursor:pointer; font-size:12px; border-bottom:1px solid rgba(255,255,255,0.04);';
          row.className = 'livechat-canned-item';
          row.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
              <span style="font-weight:600; color:var(--accent-primary); font-family:var(--font-mono);">${escapeHtml(item.shortcut || '')}</span>
              <span style="font-size:10px; color:var(--text-dim);">${escapeHtml(item.category || '')}</span>
            </div>
            <div style="font-weight:500; color:var(--text-main); font-size:12px; margin-bottom:2px;">${escapeHtml(item.title || '')}</div>
            <div style="color:var(--text-muted); font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.message || '')}</div>
          `;

          row.addEventListener('mouseenter', () => { row.style.background = 'rgba(255,255,255,0.06)'; });
          row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
          row.addEventListener('click', () => {
            if (composerInput) {
              const start = composerInput.selectionStart || 0;
              const end = composerInput.selectionEnd || 0;
              const val = composerInput.value;
              composerInput.value = val.substring(0, start) + item.message + val.substring(end);
              composerInput.focus();
            }
            cannedPopover.style.display = 'none';
          });

          cannedPopoverList.appendChild(row);
        });
      } catch (err) {
        if (cannedPopoverList) {
          cannedPopoverList.innerHTML = `<div style="font-size:12px; color:#f87171; padding:8px;">Failed to load quick replies</div>`;
        }
      }
    });

    if (closeCannedPopover) {
      closeCannedPopover.addEventListener('click', (e) => {
        e.stopPropagation();
        cannedPopover.style.display = 'none';
      });
    }

    document.addEventListener('click', (e) => {
      if (cannedPopover && cannedPopover.style.display !== 'none' && !cannedPopover.contains(e.target) && e.target !== btnPickCanned) {
        cannedPopover.style.display = 'none';
      }
    });
  }

  // Account filter change
  if (accountFilter) {
    accountFilter.addEventListener('change', () => {
      loadThreads(true);
    });
  }

  // Search input filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderThreads();
    });
  }

  // Real-time chat message listener (bidirectional)
  if (window.api && window.api.onChatMessage) {
    window.api.onChatMessage((msg) => {
      const cleanPhone = String(msg.phone || '').replace(/\D+/g, '');
      if (!cleanPhone) return;

      // 1. If message belongs to currently open active chat, append bubble!
      if (activePhone === cleanPhone && messagesContainer) {
        const isOutgoing = Boolean(msg.fromMe);
        const bubbleWrap = document.createElement('div');
        bubbleWrap.className = `livechat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`;
        bubbleWrap.innerHTML = `
          <div class="livechat-bubble ${isOutgoing ? 'bubble-outgoing' : 'bubble-incoming'}">
            <div class="livechat-bubble-text">${formatMessageHtml(msg)}</div>
            <div class="livechat-bubble-meta">
              <span class="livechat-bubble-time">${formatTime(msg.timestamp)}</span>
              ${isOutgoing ? '<span class="livechat-check-icon">✓✓</span>' : ''}
            </div>
          </div>
        `;
        messagesContainer.appendChild(bubbleWrap);
        scrollToBottom();
      }

      // 2. Update thread list
      const existing = currentThreads.find(t => t.phone === cleanPhone);
      if (existing) {
        existing.lastMessage = msg.body || '';
        existing.timestamp = msg.timestamp || Date.now();
        if (!msg.fromMe && activePhone !== cleanPhone) {
          existing.unreadCount = (existing.unreadCount || 0) + 1;
        }
        renderThreads();
      } else {
        // New thread
        loadThreads(false);
      }
    });
  }

  // When livechat tab is opened, refresh accounts & threads
  const liveChatNavBtn = document.querySelector('[data-tab="livechat"]');
  if (liveChatNavBtn) {
    liveChatNavBtn.addEventListener('click', async () => {
      await loadAccountsFilter();
      await loadThreads(true);
    });
  }

  // Also initial load
  loadAccountsFilter();
  loadThreads(true);
});
