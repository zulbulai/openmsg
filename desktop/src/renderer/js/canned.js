/**
 * Canned Responses (Quick Replies) Controller for OpenMsg Desktop
 * Ported from Chrome Extension Manifest V3 CRM
 */

window.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('cannedList');
  const searchInput = document.getElementById('cannedSearchInput');
  const categoryFilter = document.getElementById('cannedCategoryFilter');
  const btnNewCanned = document.getElementById('btnNewCanned');
  const totalBadge = document.getElementById('cannedTotalCount');

  // Modal elements
  const modal = document.getElementById('modalCanned');
  const modalTitle = document.getElementById('cannedModalTitle');
  const inputId = document.getElementById('cannedId');
  const inputShortcut = document.getElementById('cannedShortcut');
  const inputTitle = document.getElementById('cannedTitle');
  const inputCategory = document.getElementById('cannedCategory');
  const inputMessage = document.getElementById('cannedMessage');
  const btnCancel = document.getElementById('btnCancelCanned');
  const btnSave = document.getElementById('btnSaveCanned');

  let cannedResponses = [];

  async function loadCanned() {
    try {
      if (window.api && window.api.getCannedResponses) {
        cannedResponses = await window.api.getCannedResponses();
        renderList();
      }
    } catch (err) {
      console.error('[Canned] Load error:', err);
    }
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const selectedCat = (categoryFilter ? categoryFilter.value : 'all');

    const filtered = cannedResponses.filter(c => {
      const matchCat = (selectedCat === 'all' || (c.category || '').toLowerCase() === selectedCat.toLowerCase());
      if (!matchCat) return false;
      if (!query) return true;
      const str = `${c.shortcut || ''} ${c.title || ''} ${c.message || ''} ${c.category || ''}`.toLowerCase();
      return str.includes(query);
    });

    if (totalBadge) {
      totalBadge.textContent = `${filtered.length} Responses`;
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state-card';
      empty.innerHTML = `
        <div style="font-size:32px; margin-bottom:8px;">💬</div>
        <div style="font-weight:600; font-size:14px; margin-bottom:4px;">No canned responses found</div>
        <div style="font-size:12px; color:var(--text-dim);">Click "+ New Canned Response" above to create one.</div>
      `;
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'canned-card';

      const top = document.createElement('div');
      top.className = 'canned-card-top';

      const left = document.createElement('div');
      left.className = 'canned-card-left';

      const shortcut = document.createElement('span');
      shortcut.className = 'canned-shortcut-badge';
      shortcut.textContent = item.shortcut || '/quick';

      const title = document.createElement('span');
      title.className = 'canned-title';
      title.textContent = item.title || 'Untitled';

      left.appendChild(shortcut);
      left.appendChild(title);

      const catBadge = document.createElement('span');
      catBadge.className = 'canned-category-pill';
      catBadge.textContent = item.category || 'General';

      top.appendChild(left);
      top.appendChild(catBadge);
      card.appendChild(top);

      const msg = document.createElement('div');
      msg.className = 'canned-message-text';
      msg.textContent = item.message || '';
      card.appendChild(msg);

      const actions = document.createElement('div');
      actions.className = 'canned-card-actions';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn btn-outline btn-sm';
      copyBtn.innerHTML = '📋 Copy Text';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(item.message || '');
        copyBtn.innerHTML = '✅ Copied!';
        setTimeout(() => copyBtn.innerHTML = '📋 Copy Text', 2000);
      });

      const insertBtn = document.createElement('button');
      insertBtn.type = 'button';
      insertBtn.className = 'btn btn-primary btn-sm';
      insertBtn.innerHTML = '⚡ Insert in Chat';
      insertBtn.addEventListener('click', () => {
        const composer = document.getElementById('livechatComposerInput');
        if (composer) {
          composer.value = item.message || '';
          composer.focus();
          // Switch to Live Chat tab
          const livechatNav = document.querySelector('[data-tab="livechat"]');
          if (livechatNav) livechatNav.click();
        }
      });

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn-icon-sm';
      editBtn.title = 'Edit';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', () => openModal(item));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon-sm';
      delBtn.title = 'Delete';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', async () => {
        if (confirm(`Delete canned response "${item.shortcut}"?`)) {
          await window.api.deleteCannedResponse(item.id);
          await loadCanned();
        }
      });

      actions.appendChild(copyBtn);
      actions.appendChild(insertBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      card.appendChild(actions);

      listEl.appendChild(card);
    });
  }

  function openModal(item = null) {
    if (!modal) return;
    if (item) {
      if (modalTitle) modalTitle.textContent = 'Edit Canned Response';
      if (inputId) inputId.value = item.id;
      if (inputShortcut) inputShortcut.value = item.shortcut || '';
      if (inputTitle) inputTitle.value = item.title || '';
      if (inputCategory) inputCategory.value = item.category || 'General';
      if (inputMessage) inputMessage.value = item.message || '';
    } else {
      if (modalTitle) modalTitle.textContent = 'New Canned Response';
      if (inputId) inputId.value = '';
      if (inputShortcut) inputShortcut.value = '/';
      if (inputTitle) inputTitle.value = '';
      if (inputCategory) inputCategory.value = 'General';
      if (inputMessage) inputMessage.value = '';
    }
    modal.style.display = 'flex';
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
  }

  if (btnNewCanned) {
    btnNewCanned.addEventListener('click', () => openModal());
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      let shortcut = inputShortcut ? inputShortcut.value.trim() : '';
      if (!shortcut.startsWith('/')) shortcut = '/' + shortcut;
      const title = inputTitle ? inputTitle.value.trim() : '';
      const category = inputCategory ? inputCategory.value.trim() : 'General';
      const message = inputMessage ? inputMessage.value.trim() : '';

      if (!title || !message) {
        alert('Please fill in title and message text.');
        return;
      }

      const canned = {
        id: inputId ? inputId.value : '',
        shortcut,
        title,
        category,
        message
      };

      try {
        await window.api.saveCannedResponse(canned);
        closeModal();
        await loadCanned();
      } catch (err) {
        alert('Error saving canned response: ' + err.message);
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderList());
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => renderList());
  }

  // Load initially
  loadCanned();
});
