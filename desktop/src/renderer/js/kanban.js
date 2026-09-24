/**
 * Kanban Pipeline CRM Module for OpenMsg Desktop
 * Ported from Chrome Extension Manifest V3 CRM
 */

window.addEventListener('DOMContentLoaded', () => {
  // Elements
  const pane = document.getElementById('pane-kanban');
  const boardEl = document.getElementById('kanbanBoard');
  const searchInput = document.getElementById('kanbanSearchInput');
  const btnAddLead = document.getElementById('btnKanbanAddLead');
  const btnAddStage = document.getElementById('btnKanbanAddStage');
  const totalLeadsBadge = document.getElementById('kanbanTotalLeads');

  // Modals
  const modalLead = document.getElementById('modalKanbanLead');
  const btnCloseModalLead = document.getElementById('btnCancelKanbanLead');
  const btnSaveModalLead = document.getElementById('btnSaveKanbanLead');
  const leadModalTitle = document.getElementById('kanbanLeadModalTitle');
  const inputLeadId = document.getElementById('kanbanLeadId');
  const inputLeadName = document.getElementById('kanbanLeadName');
  const inputLeadPhone = document.getElementById('kanbanLeadPhone');
  const inputLeadStage = document.getElementById('kanbanLeadStage');
  const inputLeadValue = document.getElementById('kanbanLeadValue');
  const inputLeadTags = document.getElementById('kanbanLeadTags');
  const inputLeadNotes = document.getElementById('kanbanLeadNotes');

  const modalStage = document.getElementById('modalKanbanStage');
  const btnCloseModalStage = document.getElementById('btnCancelKanbanStage');
  const btnSaveModalStage = document.getElementById('btnSaveKanbanStage');
  const inputStageName = document.getElementById('kanbanStageName');
  const inputStageColor = document.getElementById('kanbanStageColor');

  let kanbanData = { stages: [], cards: [] };
  let draggedCardId = null;

  async function loadData() {
    try {
      if (window.api && window.api.getKanbanData) {
        kanbanData = await window.api.getKanbanData();
        renderBoard();
      }
    } catch (err) {
      console.error('[Kanban] Failed to load data:', err);
    }
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const filteredCards = (kanbanData.cards || []).filter(c => {
      if (!query) return true;
      const str = `${c.name || ''} ${c.phone || ''} ${c.notes || ''} ${(c.tags || []).join(' ')}`.toLowerCase();
      return str.includes(query);
    });

    if (totalLeadsBadge) {
      totalLeadsBadge.textContent = `${filteredCards.length} Leads`;
    }

    // Populate stage selector in Lead modal
    if (inputLeadStage) {
      inputLeadStage.innerHTML = '';
      (kanbanData.stages || []).forEach(stage => {
        const opt = document.createElement('option');
        opt.value = stage.id;
        opt.textContent = stage.name;
        inputLeadStage.appendChild(opt);
      });
    }

    (kanbanData.stages || []).forEach(stage => {
      const stageCards = filteredCards.filter(c => c.stageId === stage.id);
      
      const col = document.createElement('div');
      col.className = 'kanban-column';
      col.dataset.stageId = stage.id;

      // Header
      const header = document.createElement('div');
      header.className = 'kanban-column-header';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'kanban-column-title-wrap';

      const dot = document.createElement('span');
      dot.className = 'kanban-stage-dot';
      dot.style.backgroundColor = stage.color || '#ffc72c';

      const title = document.createElement('span');
      title.className = 'kanban-stage-title';
      title.textContent = stage.name;

      const badge = document.createElement('span');
      badge.className = 'kanban-stage-count';
      badge.textContent = stageCards.length;

      titleWrap.appendChild(dot);
      titleWrap.appendChild(title);
      titleWrap.appendChild(badge);

      const addCardBtn = document.createElement('button');
      addCardBtn.type = 'button';
      addCardBtn.className = 'kanban-btn-add-card';
      addCardBtn.title = 'Add Lead to ' + stage.name;
      addCardBtn.innerHTML = '+';
      addCardBtn.addEventListener('click', () => openLeadModal(null, stage.id));

      header.appendChild(titleWrap);
      header.appendChild(addCardBtn);
      col.appendChild(header);

      // Card list container (Drop target)
      const list = document.createElement('div');
      list.className = 'kanban-card-list';
      list.dataset.stageId = stage.id;

      // Drag and Drop listeners
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        list.classList.add('drag-over');
      });

      list.addEventListener('dragleave', () => {
        list.classList.remove('drag-over');
      });

      list.addEventListener('drop', async (e) => {
        e.preventDefault();
        list.classList.remove('drag-over');
        if (draggedCardId) {
          try {
            await window.api.moveKanbanCard(draggedCardId, stage.id);
            await loadData();
          } catch (err) {
            console.error('[Kanban] Move card error:', err);
          }
          draggedCardId = null;
        }
      });

      if (stageCards.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'kanban-empty-column';
        empty.textContent = 'No leads in this stage';
        list.appendChild(empty);
      } else {
        stageCards.forEach(card => {
          const cardEl = createCardElement(card, stage);
          list.appendChild(cardEl);
        });
      }

      col.appendChild(list);
      boardEl.appendChild(col);
    });
  }

  function createCardElement(card, currentStage) {
    const el = document.createElement('div');
    el.className = 'kanban-card';
    el.draggable = true;
    el.dataset.cardId = card.id;

    el.addEventListener('dragstart', (e) => {
      draggedCardId = card.id;
      el.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', card.id);
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('is-dragging');
      draggedCardId = null;
    });

    // Top: Contact name & value
    const top = document.createElement('div');
    top.className = 'kanban-card-top';

    const name = document.createElement('span');
    name.className = 'kanban-card-name';
    name.textContent = card.name || 'Unnamed Contact';

    top.appendChild(name);

    if (card.value) {
      const val = document.createElement('span');
      val.className = 'kanban-card-value';
      val.textContent = card.value.startsWith('$') ? card.value : '$' + card.value;
      top.appendChild(val);
    }
    el.appendChild(top);

    // Phone with quick action link
    const phoneWrap = document.createElement('div');
    phoneWrap.className = 'kanban-card-phone';
    phoneWrap.innerHTML = `<span>📱</span> <span class="code-font">${card.phone || ''}</span>`;
    el.appendChild(phoneWrap);

    // Notes snippet
    if (card.notes) {
      const notes = document.createElement('div');
      notes.className = 'kanban-card-notes';
      notes.textContent = card.notes;
      el.appendChild(notes);
    }

    // Tags
    if (card.tags && card.tags.length > 0) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'kanban-card-tags';
      card.tags.forEach(t => {
        const tag = document.createElement('span');
        tag.className = 'kanban-card-tag';
        tag.textContent = t;
        tagsWrap.appendChild(tag);
      });
      el.appendChild(tagsWrap);
    }

    // Actions footer
    const footer = document.createElement('div');
    footer.className = 'kanban-card-footer';

    // Move to stage dropdown
    const moveSelect = document.createElement('select');
    moveSelect.className = 'kanban-move-select';
    moveSelect.title = 'Move to Stage';
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Move to...';
    moveSelect.appendChild(defaultOpt);

    (kanbanData.stages || []).forEach(s => {
      if (s.id !== currentStage.id) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        moveSelect.appendChild(opt);
      }
    });

    moveSelect.addEventListener('change', async () => {
      if (moveSelect.value) {
        try {
          await window.api.moveKanbanCard(card.id, moveSelect.value);
          await loadData();
        } catch (err) {
          console.error('[Kanban] Move error:', err);
        }
      }
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon-xs';
    editBtn.title = 'Edit Lead';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLeadModal(card);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon-xs';
    deleteBtn.title = 'Delete Lead';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Remove ${card.name || card.phone} from pipeline?`)) {
        await window.api.deleteKanbanCard(card.id);
        await loadData();
      }
    });

    footer.appendChild(moveSelect);
    footer.appendChild(editBtn);
    footer.appendChild(deleteBtn);
    el.appendChild(footer);

    return el;
  }

  function openLeadModal(card = null, defaultStageId = null) {
    if (!modalLead) return;
    if (card) {
      if (leadModalTitle) leadModalTitle.textContent = 'Edit Pipeline Lead';
      if (inputLeadId) inputLeadId.value = card.id;
      if (inputLeadName) inputLeadName.value = card.name || '';
      if (inputLeadPhone) inputLeadPhone.value = card.phone || '';
      if (inputLeadStage) inputLeadStage.value = card.stageId || '';
      if (inputLeadValue) inputLeadValue.value = card.value || '';
      if (inputLeadTags) inputLeadTags.value = (card.tags || []).join(', ');
      if (inputLeadNotes) inputLeadNotes.value = card.notes || '';
    } else {
      if (leadModalTitle) leadModalTitle.textContent = 'Add New Pipeline Lead';
      if (inputLeadId) inputLeadId.value = '';
      if (inputLeadName) inputLeadName.value = '';
      if (inputLeadPhone) inputLeadPhone.value = '';
      if (inputLeadStage) inputLeadStage.value = defaultStageId || (kanbanData.stages[0] ? kanbanData.stages[0].id : '');
      if (inputLeadValue) inputLeadValue.value = '';
      if (inputLeadTags) inputLeadTags.value = '';
      if (inputLeadNotes) inputLeadNotes.value = '';
    }
    modalLead.style.display = 'flex';
  }

  function closeLeadModal() {
    if (modalLead) modalLead.style.display = 'none';
  }

  if (btnCloseModalLead) {
    btnCloseModalLead.addEventListener('click', closeLeadModal);
  }

  if (btnSaveModalLead) {
    btnSaveModalLead.addEventListener('click', async () => {
      const phone = (inputLeadPhone ? inputLeadPhone.value.trim() : '');
      const name = (inputLeadName ? inputLeadName.value.trim() : '');
      if (!phone && !name) {
        alert('Please enter a phone number or name for this lead.');
        return;
      }

      const card = {
        id: inputLeadId ? inputLeadId.value : '',
        name,
        phone,
        stageId: inputLeadStage ? inputLeadStage.value : (kanbanData.stages[0] ? kanbanData.stages[0].id : ''),
        value: inputLeadValue ? inputLeadValue.value.trim() : '',
        tags: inputLeadTags ? inputLeadTags.value.split(',').map(t => t.trim()).filter(Boolean) : [],
        notes: inputLeadNotes ? inputLeadNotes.value.trim() : ''
      };

      try {
        await window.api.saveKanbanCard(card);
        closeLeadModal();
        await loadData();
      } catch (err) {
        alert('Error saving lead: ' + err.message);
      }
    });
  }

  if (btnAddLead) {
    btnAddLead.addEventListener('click', () => openLeadModal());
  }

  if (btnAddStage) {
    btnAddStage.addEventListener('click', () => {
      if (inputStageName) inputStageName.value = '';
      if (inputStageColor) inputStageColor.value = '#ffc72c';
      if (modalStage) modalStage.style.display = 'flex';
    });
  }

  if (btnCloseModalStage) {
    btnCloseModalStage.addEventListener('click', () => {
      if (modalStage) modalStage.style.display = 'none';
    });
  }

  if (btnSaveModalStage) {
    btnSaveModalStage.addEventListener('click', async () => {
      const name = inputStageName ? inputStageName.value.trim() : '';
      if (!name) {
        alert('Please enter a stage name.');
        return;
      }
      const color = inputStageColor ? inputStageColor.value : '#ffc72c';
      try {
        await window.api.saveKanbanStage({ name, color });
        if (modalStage) modalStage.style.display = 'none';
        await loadData();
      } catch (err) {
        alert('Error saving stage: ' + err.message);
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderBoard());
  }

  // Load initial data
  loadData();
});
