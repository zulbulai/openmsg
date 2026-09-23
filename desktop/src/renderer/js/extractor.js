/**
 * Group & Contact Extractor Controller — Phase 3/4 Enhanced
 * Features: Group Grabber, Recent Chats Extractor, WA Business Label Extractor
 * Export: CSV & Excel (XLSX), Send to Campaign, Save to Contacts
 */

window.addEventListener('DOMContentLoaded', () => {
  // ─── Element references ───────────────────────────────────────────────
  const btnFetchGroups        = document.getElementById('btnFetchGroups');
  const btnExportCsv          = document.getElementById('btnExportContacts');
  const btnExportXlsx         = document.getElementById('btnExportXlsx');
  const btnSendToCampaign     = document.getElementById('btnSendToCampaign');
  const btnSaveToContacts     = document.getElementById('btnSaveToContacts');
  const groupSearchInput      = document.getElementById('groupSearchInput');
  const groupsContainer       = document.getElementById('groupsContainer');
  const currentGroupName      = document.getElementById('currentGroupName');
  const participantCountBadge = document.getElementById('participantCountBadge');
  const participantsTableBody = document.getElementById('participantsTableBody');

  // Recent Chats tab
  const btnFetchRecentChats   = document.getElementById('btnFetchRecentChats');
  const recentChatsTableBody  = document.getElementById('recentChatsTableBody');
  const btnExportRecentCsv    = document.getElementById('btnExportRecentCsv');
  const btnExportRecentXlsx   = document.getElementById('btnExportRecentXlsx');
  const btnSendRecentToCamp   = document.getElementById('btnSendRecentToCampaign');

  // WA Business Labels tab
  const btnFetchLabels        = document.getElementById('btnFetchLabels');
  const labelsContainer       = document.getElementById('labelsContainer');
  const btnExportLabelXlsx    = document.getElementById('btnExportLabelXlsx');
  const btnSendLabelToCamp    = document.getElementById('btnSendLabelToCampaign');
  const labelContactsBody     = document.getElementById('labelContactsTableBody');

  // Tab switching
  const extractorTabs = document.querySelectorAll('.extractor-tab-btn');
  const extractorPanes = document.querySelectorAll('.extractor-tab-pane');

  extractorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      extractorTabs.forEach(t => t.classList.remove('active'));
      extractorPanes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('extractor-pane-' + tab.dataset.extractorTab);
      if (target) target.classList.add('active');
    });
  });

  // ─── State ───────────────────────────────────────────────────────────
  let allGroups = [];
  let currentGroup = null;
  let currentParticipants = [];
  let recentChats = [];
  let currentLabelContacts = [];
  let currentLabelName = '';

  // ─── GROUP GRABBER ────────────────────────────────────────────────────
  if (btnFetchGroups) {
    btnFetchGroups.addEventListener('click', async () => {
      btnFetchGroups.disabled = true;
      btnFetchGroups.textContent = 'Fetching Groups...';
      try {
        allGroups = await window.api.getGroups();
        renderGroups(allGroups);
        window.showToast(`Fetched ${allGroups.length} groups successfully`, 'success');
      } catch (err) {
        window.showToast('Failed to fetch groups: ' + err.message, 'error');
      } finally {
        btnFetchGroups.disabled = false;
        btnFetchGroups.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Fetch My Groups`;
      }
    });
  }

  function renderGroups(groups) {
    if (!groupsContainer) return;
    groupsContainer.innerHTML = '';
    if (groups.length === 0) {
      groupsContainer.innerHTML = '<div class="empty-state">No groups found. Make sure your WhatsApp account is connected.</div>';
      return;
    }
    groups.forEach(g => {
      const item = document.createElement('div');
      item.className = `group-item ${currentGroup && currentGroup.id === g.id ? 'active' : ''}`;
      item.innerHTML = `
        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
          <div style="font-weight:600; font-size:13px;">${g.name}</div>
          <div class="text-dim" style="font-size:11px;">${(g.id || '').split('@')[0]}</div>
        </div>
        <span class="badge">Open</span>
      `;
      item.addEventListener('click', () => selectGroup(g));
      groupsContainer.appendChild(item);
    });
  }

  if (groupSearchInput) {
    groupSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      renderGroups(allGroups.filter(g => g.name.toLowerCase().includes(q)));
    });
  }

  async function selectGroup(group) {
    currentGroup = group;
    if (currentGroupName) currentGroupName.textContent = group.name;
    if (participantCountBadge) participantCountBadge.textContent = 'Extracting...';
    if (participantsTableBody) participantsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
    renderGroups(allGroups);

    try {
      currentParticipants = await window.api.getGroupParticipants(group.id);
      if (participantCountBadge) participantCountBadge.textContent = `${currentParticipants.length} members`;
      renderParticipants(currentParticipants);
      if (btnExportCsv) btnExportCsv.disabled = false;
      if (btnExportXlsx) btnExportXlsx.disabled = false;
      if (btnSendToCampaign) btnSendToCampaign.disabled = false;
      if (btnSaveToContacts) btnSaveToContacts.disabled = false;
    } catch (err) {
      if (participantsTableBody) participantsTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${err.message}</td></tr>`;
      if (participantCountBadge) participantCountBadge.textContent = 'Failed';
    }
  }

  function renderParticipants(list) {
    if (!participantsTableBody) return;
    participantsTableBody.innerHTML = '';
    if (list.length === 0) {
      participantsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No participants found.</td></tr>';
      return;
    }
    list.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--text-dim);">${i + 1}</td>
        <td style="font-family:var(--font-mono); font-weight:600;">+${p.phone}</td>
        <td>${p.isAdmin ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge">Member</span>'}</td>
        <td><button class="btn btn-outline btn-xs btn-single-copy" data-phone="${p.phone}">Copy</button></td>
      `;
      participantsTableBody.appendChild(tr);
    });
    participantsTableBody.querySelectorAll('.btn-single-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText('+' + btn.dataset.phone);
        window.showToast('Copied!', 'info');
      });
    });
  }

  // Export CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      if (!currentParticipants.length) return;
      const csv = ['Phone,Role,Group']
        .concat(currentParticipants.map(p => `+${p.phone},${p.isAdmin ? 'Admin' : 'Member'},"${currentGroup?.name || 'Group'}"` ))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${(currentGroup?.name || 'group').replace(/[^\w]/g, '_')}_contacts.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.showToast('CSV Exported!', 'success');
    });
  }

  // Export XLSX (Phase 4.1)
  if (btnExportXlsx) {
    btnExportXlsx.addEventListener('click', async () => {
      if (!currentParticipants.length) return;
      btnExportXlsx.textContent = 'Exporting...';
      try {
        const buffer = await window.api.exportParticipantsXlsx(currentGroup.id, currentGroup.name);
        if (!buffer) { window.showToast('Export failed', 'error'); return; }
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `${(currentGroup?.name || 'group').replace(/[^\w]/g, '_')}_${Date.now()}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.showToast(`Exported ${currentParticipants.length} members to Excel!`, 'success');
      } catch (err) {
        window.showToast('Export failed: ' + err.message, 'error');
      } finally {
        btnExportXlsx.textContent = '📊 Export XLSX';
      }
    });
  }

  // Send to Campaign
  if (btnSendToCampaign) {
    btnSendToCampaign.addEventListener('click', () => {
      if (!currentParticipants.length) return;
      const formatted = currentParticipants.map(p => `${p.phone}, Member, ${currentGroup?.name || 'Group'}`).join('\n');
      const campTA = document.getElementById('campContactsText');
      if (campTA) { campTA.value = formatted; campTA.dispatchEvent(new Event('input')); }
      document.querySelector('[data-tab="campaigns"]')?.click();
      window.showToast(`Loaded ${currentParticipants.length} members into Campaign!`, 'success');
    });
  }

  // Save to Contacts Address Book
  if (btnSaveToContacts) {
    btnSaveToContacts.addEventListener('click', async () => {
      if (!currentParticipants.length) return;
      let saved = 0;
      for (const p of currentParticipants) {
        await window.api.addContact({ phone: p.phone, tags: `group:${currentGroup?.name || 'group'}` });
        saved++;
      }
      window.showToast(`Saved ${saved} contacts to Address Book!`, 'success');
    });
  }

  // ─── RECENT CHATS EXTRACTOR (Phase 3.5) ──────────────────────────────
  if (btnFetchRecentChats) {
    btnFetchRecentChats.addEventListener('click', async () => {
      btnFetchRecentChats.disabled = true;
      btnFetchRecentChats.textContent = 'Fetching Recent Chats...';
      try {
        recentChats = await window.api.getRecentChats();
        renderRecentChats(recentChats);
        window.showToast(`Found ${recentChats.length} recent individual chats`, 'success');
      } catch (err) {
        window.showToast('Failed: ' + err.message, 'error');
      } finally {
        btnFetchRecentChats.disabled = false;
        btnFetchRecentChats.textContent = '🔄 Fetch Recent Chats';
      }
    });
  }

  function renderRecentChats(chats) {
    if (!recentChatsTableBody) return;
    recentChatsTableBody.innerHTML = '';
    if (!chats || chats.length === 0) {
      recentChatsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recent individual chats found.</td></tr>';
      return;
    }
    chats.forEach((c, i) => {
      const tr = document.createElement('tr');
      const lastSeen = c.timestamp ? new Date(c.timestamp * 1000).toLocaleDateString() : '—';
      tr.innerHTML = `
        <td style="color:var(--text-dim)">${i + 1}</td>
        <td style="font-family:var(--font-mono); font-weight:600;">+${c.phone}</td>
        <td>${c.name || '<span class="text-dim">Unknown</span>'}</td>
        <td style="font-size:11px; color:var(--text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.lastMessage || '—'}</td>
        <td style="font-size:11px;">${lastSeen}</td>
      `;
      recentChatsTableBody.appendChild(tr);
    });
  }

  if (btnExportRecentCsv) {
    btnExportRecentCsv.addEventListener('click', () => {
      if (!recentChats.length) { window.showToast('No data to export', 'error'); return; }
      const csv = ['Phone,Name,Last Message'].concat(recentChats.map(c => `+${c.phone},"${c.name || ''}","${(c.lastMessage || '').replace(/"/g, "'")}"` )).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `recent_chats_${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.showToast(`Exported ${recentChats.length} chats to CSV!`, 'success');
    });
  }

  if (btnSendRecentToCamp) {
    btnSendRecentToCamp.addEventListener('click', () => {
      if (!recentChats.length) { window.showToast('No chats found', 'error'); return; }
      const formatted = recentChats.map(c => `${c.phone}, ${c.name || 'Contact'}`).join('\n');
      const campTA = document.getElementById('campContactsText');
      if (campTA) { campTA.value = formatted; campTA.dispatchEvent(new Event('input')); }
      document.querySelector('[data-tab="campaigns"]')?.click();
      window.showToast(`Loaded ${recentChats.length} contacts into Campaign!`, 'success');
    });
  }

  // ─── WA BUSINESS LABELS (Phase 4.4) ──────────────────────────────────
  if (btnFetchLabels) {
    btnFetchLabels.addEventListener('click', async () => {
      btnFetchLabels.disabled = true;
      btnFetchLabels.textContent = 'Loading Labels...';
      try {
        const labels = await window.api.getWaBizLabels();
        renderLabels(labels);
        if (labels.length === 0) window.showToast('No labels found. Make sure you are using a WhatsApp Business account.', 'info');
      } catch (err) {
        window.showToast('Failed to load labels: ' + err.message, 'error');
      } finally {
        btnFetchLabels.disabled = false;
        btnFetchLabels.textContent = '🏷️ Fetch Business Labels';
      }
    });
  }

  function renderLabels(labels) {
    if (!labelsContainer) return;
    labelsContainer.innerHTML = '';
    if (!labels || labels.length === 0) {
      labelsContainer.innerHTML = '<div class="empty-state">No WhatsApp Business labels found.</div>';
      return;
    }
    labels.forEach(label => {
      const chip = document.createElement('div');
      chip.className = 'label-chip';
      chip.style.cssText = `cursor:pointer; padding:8px 14px; border-radius:20px; background:var(--bg-card); border:1px solid var(--border); font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px; margin:4px;`;
      chip.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;background:#${(label.color || 0).toString(16).padStart(6,'0')}"></span>${label.name}`;
      chip.addEventListener('click', () => loadLabelContacts(label));
      labelsContainer.appendChild(chip);
    });
  }

  async function loadLabelContacts(label) {
    currentLabelName = label.name;
    if (labelContactsBody) labelContactsBody.innerHTML = '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
    try {
      currentLabelContacts = await window.api.getContactsByLabel(label.id);
      if (!labelContactsBody) return;
      labelContactsBody.innerHTML = '';
      if (!currentLabelContacts.length) {
        labelContactsBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No contacts in label "${label.name}"</td></tr>`;
        return;
      }
      currentLabelContacts.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--text-dim)">${i+1}</td>
          <td style="font-family:var(--font-mono); font-weight:600;">+${c.phone}</td>
          <td>${c.name || '—'}</td>
        `;
        labelContactsBody.appendChild(tr);
      });
      if (btnExportLabelXlsx) btnExportLabelXlsx.disabled = false;
      if (btnSendLabelToCamp) btnSendLabelToCamp.disabled = false;
      window.showToast(`Found ${currentLabelContacts.length} contacts in "${label.name}"`, 'success');
    } catch (err) {
      window.showToast('Failed to load label contacts: ' + err.message, 'error');
    }
  }

  if (btnSendLabelToCamp) {
    btnSendLabelToCamp.addEventListener('click', () => {
      if (!currentLabelContacts.length) return;
      const formatted = currentLabelContacts.map(c => `${c.phone}, ${c.name || 'Contact'}`).join('\n');
      const campTA = document.getElementById('campContactsText');
      if (campTA) { campTA.value = formatted; campTA.dispatchEvent(new Event('input')); }
      document.querySelector('[data-tab="campaigns"]')?.click();
      window.showToast(`Loaded ${currentLabelContacts.length} contacts into Campaign!`, 'success');
    });
  }
});
