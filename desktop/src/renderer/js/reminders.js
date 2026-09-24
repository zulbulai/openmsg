/**
 * Notes & Follow-up Reminders Controller for OpenMsg Desktop
 * Ported from Chrome Extension Manifest V3 CRM
 */

window.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('remindersList');
  const searchInput = document.getElementById('remindersSearchInput');
  const filterTabPending = document.getElementById('remindersFilterPending');
  const filterTabAll = document.getElementById('remindersFilterAll');
  const filterTabDone = document.getElementById('remindersFilterDone');
  const btnNewReminder = document.getElementById('btnNewReminder');
  const totalCountBadge = document.getElementById('remindersTotalCount');

  // Modal elements
  const modal = document.getElementById('modalReminder');
  const modalTitle = document.getElementById('reminderModalTitle');
  const inputId = document.getElementById('reminderId');
  const inputTitle = document.getElementById('reminderTitle');
  const inputPhone = document.getElementById('reminderPhone');
  const inputName = document.getElementById('reminderName');
  const inputDueDate = document.getElementById('reminderDueDate');
  const inputDueTime = document.getElementById('reminderDueTime');
  const inputNote = document.getElementById('reminderNote');
  const btnCancel = document.getElementById('btnCancelReminder');
  const btnSave = document.getElementById('btnSaveReminder');

  let remindersList = [];
  let currentFilter = 'pending'; // 'pending' | 'all' | 'completed'

  async function loadReminders() {
    try {
      if (window.api && window.api.getReminders) {
        remindersList = await window.api.getReminders();
        renderList();
      }
    } catch (err) {
      console.error('[Reminders] Load error:', err);
    }
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const now = Date.now();

    const filtered = remindersList.filter(r => {
      if (currentFilter === 'pending' && r.completed) return false;
      if (currentFilter === 'completed' && !r.completed) return false;
      if (!query) return true;
      const str = `${r.title || ''} ${r.phone || ''} ${r.name || ''} ${r.note || ''}`.toLowerCase();
      return str.includes(query);
    });

    if (totalCountBadge) {
      const pendingCount = remindersList.filter(r => !r.completed).length;
      totalCountBadge.textContent = `${pendingCount} Pending`;
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state-card';
      empty.innerHTML = `
        <div style="font-size:32px; margin-bottom:8px;">⏰</div>
        <div style="font-weight:600; font-size:14px; margin-bottom:4px;">No reminders found</div>
        <div style="font-size:12px; color:var(--text-dim);">Click "+ Add Reminder" above to set a new follow-up.</div>
      `;
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach(r => {
      const card = document.createElement('div');
      card.className = 'reminder-card' + (r.completed ? ' is-completed' : '');

      // Due status
      let dueClass = 'due-upcoming';
      let dueText = 'Upcoming';
      if (r.dueAt) {
        const diffHours = (r.dueAt - now) / (1000 * 60 * 60);
        if (diffHours < 0 && !r.completed) {
          dueClass = 'due-overdue';
          dueText = 'Overdue';
        } else if (diffHours <= 24 && !r.completed) {
          dueClass = 'due-today';
          dueText = 'Due Soon';
        }
      }

      const left = document.createElement('div');
      left.className = 'reminder-card-left';

      // Checkbox
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'reminder-checkbox';
      chk.checked = Boolean(r.completed);
      chk.addEventListener('change', async () => {
        await window.api.toggleReminder(r.id);
        await loadReminders();
      });
      left.appendChild(chk);

      const content = document.createElement('div');
      content.className = 'reminder-card-content';

      const topRow = document.createElement('div');
      topRow.className = 'reminder-card-top';

      const title = document.createElement('span');
      title.className = 'reminder-title';
      title.textContent = r.title || 'Follow-up Task';

      const badge = document.createElement('span');
      badge.className = `reminder-badge ${dueClass}`;
      badge.textContent = dueText;

      topRow.appendChild(title);
      topRow.appendChild(badge);
      content.appendChild(topRow);

      // Meta: Phone & Name
      const meta = document.createElement('div');
      meta.className = 'reminder-meta';
      const dueFormatted = r.dueAt ? new Date(r.dueAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'No due date';
      meta.innerHTML = `<span>👤 ${r.name || r.phone || 'Contact'}</span> &bull; <span>📱 ${r.phone || 'N/A'}</span> &bull; <span>📅 ${dueFormatted}</span>`;
      content.appendChild(meta);

      if (r.note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'reminder-note-text';
        noteEl.textContent = r.note;
        content.appendChild(noteEl);
      }

      left.appendChild(content);
      card.appendChild(left);

      // Actions right
      const actions = document.createElement('div');
      actions.className = 'reminder-actions';

      if (r.phone) {
        const chatBtn = document.createElement('button');
        chatBtn.type = 'button';
        chatBtn.className = 'btn btn-outline btn-sm';
        chatBtn.title = 'Open Live Chat';
        chatBtn.innerHTML = '💬 Chat';
        chatBtn.addEventListener('click', () => {
          const searchLive = document.getElementById('livechatSearchInput');
          if (searchLive) {
            searchLive.value = r.phone;
            searchLive.dispatchEvent(new Event('input'));
          }
          const nav = document.querySelector('[data-tab="livechat"]');
          if (nav) nav.click();
        });
        actions.appendChild(chatBtn);
      }

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-icon-sm';
      delBtn.title = 'Delete Reminder';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', async () => {
        if (confirm(`Delete reminder "${r.title}"?`)) {
          await window.api.deleteReminder(r.id);
          await loadReminders();
        }
      });
      actions.appendChild(delBtn);

      card.appendChild(actions);
      listEl.appendChild(card);
    });
  }

  function openModal() {
    if (!modal) return;
    if (inputId) inputId.value = '';
    if (inputTitle) inputTitle.value = '';
    if (inputPhone) inputPhone.value = '';
    if (inputName) inputName.value = '';
    if (inputNote) inputNote.value = '';

    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (inputDueDate) inputDueDate.value = tomorrow.toISOString().split('T')[0];
    if (inputDueTime) inputDueTime.value = '10:00';

    modal.style.display = 'flex';
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
  }

  if (btnNewReminder) btnNewReminder.addEventListener('click', openModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      const title = inputTitle ? inputTitle.value.trim() : '';
      const phone = inputPhone ? inputPhone.value.trim() : '';
      const name = inputName ? inputName.value.trim() : '';
      const note = inputNote ? inputNote.value.trim() : '';
      const dateVal = inputDueDate ? inputDueDate.value : '';
      const timeVal = inputDueTime ? inputDueTime.value : '09:00';

      if (!title) {
        alert('Please enter a reminder title.');
        return;
      }

      let dueAt = null;
      if (dateVal) {
        dueAt = new Date(`${dateVal}T${timeVal || '00:00'}:00`).getTime();
      }

      const reminder = {
        title,
        phone,
        name,
        note,
        dueAt
      };

      try {
        await window.api.saveReminder(reminder);
        closeModal();
        await loadReminders();
      } catch (err) {
        alert('Error saving reminder: ' + err.message);
      }
    });
  }

  if (filterTabPending) {
    filterTabPending.addEventListener('click', () => {
      currentFilter = 'pending';
      document.querySelectorAll('.reminder-filter-tab').forEach(t => t.classList.remove('active'));
      filterTabPending.classList.add('active');
      renderList();
    });
  }

  if (filterTabAll) {
    filterTabAll.addEventListener('click', () => {
      currentFilter = 'all';
      document.querySelectorAll('.reminder-filter-tab').forEach(t => t.classList.remove('active'));
      filterTabAll.classList.add('active');
      renderList();
    });
  }

  if (filterTabDone) {
    filterTabDone.addEventListener('click', () => {
      currentFilter = 'completed';
      document.querySelectorAll('.reminder-filter-tab').forEach(t => t.classList.remove('active'));
      filterTabDone.classList.add('active');
      renderList();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderList());
  }

  // Initial load
  loadReminders();
});
