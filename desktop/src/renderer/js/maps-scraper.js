/**
 * Google Maps B2B Lead Extractor Frontend Controller — Phase 7B
 * Handles scraping controls, live streaming results table, bulk actions,
 * contact import, campaign launcher, and Excel export.
 */

(function () {
  let leadsCache = [];
  let isScraping = false;

  function renderLeadsTable() {
    const tbody = document.getElementById('mapsResultsBody');
    const totalEl = document.getElementById('mapsStatTotal');
    const phoneEl = document.getElementById('mapsStatWithPhone');
    const webEl = document.getElementById('mapsStatWithWebsite');
    const selectedEl = document.getElementById('mapsSelectedCount');

    if (!tbody) return;

    if (leadsCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:48px 16px; color:var(--text-muted);">
            <div style="font-size:32px; margin-bottom:12px;">🗺️</div>
            <div style="font-size:15px; font-weight:600; color:var(--text-main);">No leads extracted yet</div>
            <div style="font-size:12px; margin-top:4px;">Enter a keyword and city above, then click <strong>Start Scraping</strong>.</div>
          </td>
        </tr>
      `;
      if (totalEl) totalEl.textContent = '0';
      if (phoneEl) phoneEl.textContent = '0';
      if (webEl) webEl.textContent = '0';
      if (selectedEl) selectedEl.textContent = '0';
      return;
    }

    let withPhone = 0;
    let withWeb = 0;
    let selectedCount = 0;

    tbody.innerHTML = leadsCache.map((lead, idx) => {
      const hasPhone = !!lead.phone;
      const hasWeb = !!lead.website;
      if (hasPhone) withPhone++;
      if (hasWeb) withWeb++;
      if (lead.selected !== false) selectedCount++;

      const cleanPhone = lead.phone ? (lead.phone.startsWith('+') ? lead.phone : '+' + lead.phone) : '';
      const webDisplay = lead.website ? `<a href="${lead.website}" target="_blank" style="color:var(--accent-cyan); text-decoration:none; max-width:140px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${lead.website.replace(/^https?:\/\//, '')}</a>` : '<span style="color:var(--text-dim);">-</span>';

      return `
        <tr data-lead-id="${lead.id || idx}">
          <td style="width:40px;">
            <input type="checkbox" class="lead-checkbox" data-idx="${idx}" ${lead.selected !== false ? 'checked' : ''} style="width:16px; height:16px;">
          </td>
          <td>
            <div style="font-weight:700; color:var(--text-main);">${escapeHtml(lead.name)}</div>
            <div style="font-size:11px; color:var(--text-dim);">${escapeHtml(lead.address)}</div>
          </td>
          <td>
            ${cleanPhone ? `<span style="font-family:var(--font-mono); font-weight:600; color:#34d399;">${cleanPhone}</span>` : '<span style="color:#ef4444; font-size:11px;">No Phone</span>'}
          </td>
          <td>
            <span style="color:#fbbf24; font-weight:700;">★ ${lead.rating || '4.5'}</span>
          </td>
          <td style="font-size:12px; color:var(--text-muted); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHtml(lead.address)}
          </td>
          <td>${webDisplay}</td>
          <td>
            <span class="tool-badge badge-pro" style="font-size:9px;">${escapeHtml(lead.keyword || '')} &bull; ${escapeHtml(lead.city || '')}</span>
          </td>
          <td style="text-align:right;">
            <div class="flex-gap" style="justify-content:flex-end;">
              <button class="btn-xs btn-outline btn-import-single" data-idx="${idx}" title="Import to Contacts">📥</button>
              <button class="btn-xs btn-primary btn-campaign-single" data-idx="${idx}" title="Launch Campaign">⚡</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = leadsCache.length.toLocaleString();
    if (phoneEl) phoneEl.textContent = withPhone.toLocaleString();
    if (webEl) webEl.textContent = withWeb.toLocaleString();
    if (selectedEl) selectedEl.textContent = selectedCount.toLocaleString();

    // Bind row checkboxes
    tbody.querySelectorAll('.lead-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const i = parseInt(e.target.getAttribute('data-idx'), 10);
        if (leadsCache[i]) leadsCache[i].selected = e.target.checked;
        updateSelectedCount();
      });
    });

    // Bind single row action buttons
    tbody.querySelectorAll('.btn-import-single').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const i = parseInt(btn.getAttribute('data-idx'), 10);
        const l = leadsCache[i];
        if (l && l.phone) {
          await window.api.addContact({
            Name: l.name,
            phone: l.phone,
            Company: l.name,
            tags: `${l.keyword || 'Lead'}, ${l.city || 'Maps'}`
          });
          window.showToast(`Imported "${l.name}" to Contacts!`, 'success');
        } else {
          window.showToast('Lead has no phone number to import.', 'error');
        }
      });
    });

    tbody.querySelectorAll('.btn-campaign-single').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(btn.getAttribute('data-idx'), 10);
        const l = leadsCache[i];
        if (l && l.phone) {
          window.switchTab('campaigns');
          const campText = document.getElementById('campContactsText');
          if (campText) {
            campText.value = `${l.phone}, ${l.name}, ${l.city || 'Lead'}`;
            campText.dispatchEvent(new Event('input'));
          }
          window.showToast(`1 lead loaded into Bulk Campaign!`, 'success');
        }
      });
    });
  }

  function updateSelectedCount() {
    const selectedCount = leadsCache.filter(l => l.selected !== false).length;
    const selectedEl = document.getElementById('mapsSelectedCount');
    if (selectedEl) selectedEl.textContent = selectedCount.toLocaleString();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.addEventListener('DOMContentLoaded', async () => {
    const btnStart = document.getElementById('btnStartMapsScraper');
    const btnStop = document.getElementById('btnStopMapsScraper');
    const inputKeyword = document.getElementById('mapsKeyword');
    const inputCity = document.getElementById('mapsCity');
    const selectMax = document.getElementById('mapsMaxResults');
    const statusText = document.getElementById('mapsStatusText');
    const selectAllCb = document.getElementById('mapsSelectAll');
    const btnImport = document.getElementById('btnMapsImportContacts');
    const btnCampaign = document.getElementById('btnMapsSendCampaign');
    const btnClear = document.getElementById('btnClearMapsLeads');
    const btnExport = document.getElementById('btnMapsExportXlsx');

    // 1. Initial Load of existing leads from DB
    try {
      if (window.api && window.api.getMapLeads) {
        const existing = await window.api.getMapLeads();
        if (Array.isArray(existing) && existing.length > 0) {
          leadsCache = existing.map(l => ({ ...l, selected: true }));
          renderLeadsTable();
        }
      }
    } catch (e) {
      console.warn('Could not load saved map leads:', e);
    }

    // 2. Start Scraping
    if (btnStart) {
      btnStart.addEventListener('click', async () => {
        const keyword = inputKeyword?.value.trim();
        const city = inputCity?.value.trim();
        const maxResults = parseInt(selectMax?.value || '50', 10);

        if (!keyword) {
          window.showToast('Please enter a business keyword (e.g. Dentists).', 'error');
          return;
        }

        isScraping = true;
        btnStart.style.display = 'none';
        if (btnStop) btnStop.style.display = 'inline-flex';
        if (statusText) {
          statusText.textContent = `Scraping ${keyword} in ${city || 'Location'}...`;
          statusText.style.color = '#38bdf8';
        }

        window.showToast(`Launched Google Maps Scraper for "${keyword}"!`, 'info');

        try {
          await window.api.startMapsScraper(keyword, city, maxResults);
        } catch (err) {
          window.showToast('Failed to start scraper: ' + err.message, 'error');
          resetButtons();
        }
      });
    }

    // 3. Stop Scraping
    if (btnStop) {
      btnStop.addEventListener('click', async () => {
        try {
          await window.api.stopMapsScraper();
        } catch (e) {}
        resetButtons();
        window.showToast('Maps scraper stopped.', 'info');
      });
    }

    function resetButtons() {
      isScraping = false;
      if (btnStart) btnStart.style.display = 'inline-flex';
      if (btnStop) btnStop.style.display = 'none';
      if (statusText) {
        statusText.textContent = `Completed (${leadsCache.length} leads)`;
        statusText.style.color = '#10b981';
      }
    }

    // 4. Listen to streaming leads from backend
    if (window.api && window.api.onMapsResult) {
      window.api.onMapsResult((lead) => {
        // Add to cache if not already present
        const exists = leadsCache.some(l => l.phone && l.phone === lead.phone);
        if (!exists) {
          leadsCache.unshift({ ...lead, selected: true });
          renderLeadsTable();
        }
      });
    }

    if (window.api && window.api.onMapsDone) {
      window.api.onMapsDone((info) => {
        resetButtons();
        window.showToast(`Maps Scraper completed! ${info.total || leadsCache.length} leads ready.`, 'success');
      });
    }

    // 5. Select All Checkbox
    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => {
        const checked = e.target.checked;
        leadsCache.forEach(l => { l.selected = checked; });
        renderLeadsTable();
      });
    }

    // 6. Bulk Import Selected to Contacts
    if (btnImport) {
      btnImport.addEventListener('click', async () => {
        const selected = leadsCache.filter(l => l.selected !== false && l.phone);
        if (selected.length === 0) {
          window.showToast('No selected leads with valid phone numbers to import.', 'error');
          return;
        }

        let imported = 0;
        for (const lead of selected) {
          await window.api.addContact({
            Name: lead.name,
            phone: lead.phone,
            Company: lead.name,
            tags: `${lead.keyword || 'Lead'}, ${lead.city || 'GoogleMaps'}`
          });
          imported++;
        }

        window.showToast(`Successfully imported ${imported} leads to Contact Address Book!`, 'success');
      });
    }

    // 7. Bulk Send Campaign to Selected
    if (btnCampaign) {
      btnCampaign.addEventListener('click', () => {
        const selected = leadsCache.filter(l => l.selected !== false && l.phone);
        if (selected.length === 0) {
          window.showToast('No selected leads with phone numbers to message.', 'error');
          return;
        }

        const lines = selected.map(l => `${l.phone}, ${l.name}, ${l.name}`);
        window.switchTab('campaigns');

        const campContactsText = document.getElementById('campContactsText');
        if (campContactsText) {
          campContactsText.value = lines.join('\n');
          campContactsText.dispatchEvent(new Event('input'));
        }

        window.showToast(`Imported ${selected.length} targeted leads into Campaign Sender!`, 'success');
      });
    }

    // 8. Clear Leads
    if (btnClear) {
      btnClear.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all extracted Google Maps leads?')) {
          leadsCache = [];
          if (window.api && window.api.clearMapLeads) {
            await window.api.clearMapLeads();
          }
          renderLeadsTable();
          window.showToast('Maps leads cleared.', 'info');
        }
      });
    }

    // 9. Export to XLSX / CSV
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (leadsCache.length === 0) {
          window.showToast('No leads available to export.', 'error');
          return;
        }

        const headers = ['Business Name', 'Phone', 'Rating', 'Address', 'Website', 'Niche Keyword', 'City', 'Scraped At'];
        const rows = leadsCache.map(l => [
          `"${(l.name || '').replace(/"/g, '""')}"`,
          `"${(l.phone || '').replace(/"/g, '""')}"`,
          `"${l.rating || ''}"`,
          `"${(l.address || '').replace(/"/g, '""')}"`,
          `"${(l.website || '').replace(/"/g, '""')}"`,
          `"${(l.keyword || '').replace(/"/g, '""')}"`,
          `"${(l.city || '').replace(/"/g, '""')}"`,
          `"${new Date(l.scrapedAt || Date.now()).toISOString()}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `google_maps_leads_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast(`Exported ${leadsCache.length} leads to CSV/Excel!`, 'success');
      });
    }
  });
})();
