/**
 * Contact Manager (Address Book) UI Controller
 * Full CRUD for contacts: add, edit, delete, search, tag, import, export, send to campaign
 */

window.addEventListener('DOMContentLoaded', async () => {
  // Tab is injected dynamically — wait for element to be available
  const waitForElement = (id, ms = 5000) => new Promise((resolve, reject) => {
    const el = document.getElementById(id);
    if (el) return resolve(el);
    const t = setTimeout(() => reject(new Error(`Element #${id} not found`)), ms);
    const obs = new MutationObserver(() => {
      const found = document.getElementById(id);
      if (found) { clearTimeout(t); obs.disconnect(); resolve(found); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });

  // Scope to contacts pane
  const pane = document.getElementById('pane-contacts');
  if (!pane) return;

  const searchInput = document.getElementById('contactSearchInput');
  const tableBody = document.getElementById('contactsTableBody');
  const btnAddContact = document.getElementById('btnAddContact');
  const btnImportContacts = document.getElementById('btnImportContacts');
  const contactImportFile = document.getElementById('contactImportFile');
  const btnExportContacts = document.getElementById('btnExportContactsXlsx');
  const btnSendContactsToCampaign = document.getElementById('btnSendContactsToCampaign');
  const contactCountBadge = document.getElementById('contactsTotalBadge');
  const activeTagFilter = document.getElementById('contactTagFilter');

  let allContacts = [];
  let filteredContacts = [];

  async function loadContacts() {
    allContacts = await window.api.getContacts();
    applyFilter();
    renderTagFilter();
  }

  function applyFilter() {
    const q = (searchInput ? searchInput.value : '').toLowerCase();
    const tag = activeTagFilter ? activeTagFilter.value : '';

    filteredContacts = allContacts.filter(c => {
      const matchText = !q ||
        (c.phone || '').includes(q) ||
        (c.Name || '').toLowerCase().includes(q) ||
        (c.Company || '').toLowerCase().includes(q) ||
        (c.tags || '').toLowerCase().includes(q);

      const matchTag = !tag || (c.tags || '').toLowerCase().includes(tag.toLowerCase());
      return matchText && matchTag;
    });

    renderTable(filteredContacts);
    if (contactCountBadge) contactCountBadge.textContent = `${allContacts.length} contacts (${filteredContacts.length} shown)`;
  }

  function renderTagFilter() {
    if (!activeTagFilter) return;
    const allTags = new Set();
    allContacts.forEach(c => {
      if (c.tags) {
        String(c.tags).split(',').map(t => t.trim()).filter(Boolean).forEach(t => allTags.add(t));
      }
    });
    const current = activeTagFilter.value;
    activeTagFilter.innerHTML = '<option value="">All Tags</option>';
    allTags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag; opt.textContent = tag;
      if (tag === current) opt.selected = true;
      activeTagFilter.appendChild(opt);
    });
  }

  function renderTable(contacts) {
    tableBody.innerHTML = '';
    if (contacts.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No contacts found. Click "Add Contact" or import from Excel/CSV.</td></tr>';
      return;
    }

    contacts.forEach((c, idx) => {
      const tr = document.createElement('tr');
      const tags = c.tags ? String(c.tags).split(',').map(t =>
        `<span class="tag-chip">${t.trim()}</span>`
      ).join('') : '';

      tr.innerHTML = `
        <td style="color:var(--text-dim); font-size:11px;">${idx + 1}</td>
        <td style="font-family:var(--font-mono); font-weight:700;">+${c.phone}</td>
        <td>${c.Name || '<span class="text-dim">—</span>'}</td>
        <td>${c.Company || '<span class="text-dim">—</span>'}</td>
        <td>${tags || '<span class="text-dim">—</span>'}</td>
        <td>
          <div class="flex-gap">
            <button class="btn btn-outline btn-xs btn-edit-contact" data-id="${c.id}">Edit</button>
            <button class="btn btn-outline btn-xs btn-delete-contact" data-id="${c.id}" style="color:#f87171;">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Edit contact
    tableBody.querySelectorAll('.btn-edit-contact').forEach(btn => {
      btn.addEventListener('click', async () => {
        const contact = allContacts.find(c => c.id === btn.getAttribute('data-id'));
        if (!contact) return;

        const newName = prompt('Full Name:', contact.Name || '');
        if (newName === null) return;
        const newCompany = prompt('Company:', contact.Company || '');
        const newTags = prompt('Tags (comma-separated):', contact.tags || '');

        await window.api.updateContact(contact.id, {
          Name: newName,
          Company: newCompany,
          tags: newTags
        });
        await loadContacts();
        window.showToast('Contact updated!', 'success');
      });
    });

    // Delete contact
    tableBody.querySelectorAll('.btn-delete-contact').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this contact?')) return;
        await window.api.deleteContact(btn.getAttribute('data-id'));
        await loadContacts();
        window.showToast('Contact deleted', 'info');
      });
    });
  }

  // Search & filter
  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (activeTagFilter) activeTagFilter.addEventListener('change', applyFilter);

  // Add Contact manually
  if (btnAddContact) {
    btnAddContact.addEventListener('click', async () => {
      const phone = prompt('Phone Number with Country Code (e.g. 919876543210):');
      if (!phone) return;
      const clean = phone.replace(/\D+/g, '');
      if (!clean || clean.length < 7) { window.showToast('Invalid phone number', 'error'); return; }

      const name = prompt('Full Name (optional):') || '';
      const company = prompt('Company (optional):') || '';
      const tags = prompt('Tags (comma-separated, optional):') || '';

      await window.api.addContact({ phone: clean, Name: name, Company: company, tags });
      await loadContacts();
      window.showToast('Contact added!', 'success');
    });
  }

  // Import from CSV/Excel
  if (btnImportContacts) {
    btnImportContacts.addEventListener('click', () => {
      if (contactImportFile) contactImportFile.click();
    });
  }

  if (contactImportFile) {
    contactImportFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target.result;
          const added = await window.api.importContactsFromBuffer(buffer, file.name);
          await loadContacts();
          window.showToast(`Imported ${added} new contacts from ${file.name}!`, 'success');
        } catch (err) {
          window.showToast('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsArrayBuffer(file);
      contactImportFile.value = '';
    });
  }

  // Export to XLSX
  if (btnExportContacts) {
    btnExportContacts.addEventListener('click', async () => {
      if (allContacts.length === 0) { window.showToast('No contacts to export', 'error'); return; }
      const buffer = await window.api.exportContactsToXlsx();
      if (!buffer) { window.showToast('Export failed', 'error'); return; }
      const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openmsg_contacts_${Date.now()}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.showToast(`Exported ${allContacts.length} contacts to Excel!`, 'success');
    });
  }

  // Send selected/all contacts to Campaign
  if (btnSendContactsToCampaign) {
    btnSendContactsToCampaign.addEventListener('click', () => {
      const source = filteredContacts.length > 0 ? filteredContacts : allContacts;
      if (source.length === 0) { window.showToast('No contacts to send', 'error'); return; }

      const formatted = source.map(c =>
        `${c.phone}, ${c.Name || 'Customer'}, ${c.Company || 'Company'}`
      ).join('\n');

      const campTA = document.getElementById('campContactsText');
      if (campTA) { campTA.value = formatted; campTA.dispatchEvent(new Event('input')); }

      const campBtn = document.querySelector('[data-tab="campaigns"]');
      if (campBtn) campBtn.click();

      window.showToast(`Loaded ${source.length} contacts into Bulk Campaign!`, 'success');
    });
  }

  // Initial load
  await loadContacts();
});
