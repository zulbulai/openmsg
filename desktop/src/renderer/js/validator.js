/**
 * WhatsApp Number Filter & Validator Controller — Phase 4 Enhanced
 * Features: Bulk Validation with Speed Control, Resumable State,
 *           XLSX Export (All / Valid-Only), Save to Contacts, Live Status Counter
 */

window.addEventListener('DOMContentLoaded', async () => {
  // ─── Element references ───────────────────────────────────────────────
  const validatorInput        = document.getElementById('validatorInput');
  const btnStartValidation    = document.getElementById('btnStartValidation');
  const btnResumeValidation   = document.getElementById('btnResumeValidation');
  const btnClearValidation    = document.getElementById('btnClearValidation');
  const btnExportCsv          = document.getElementById('btnExportValidNumbers');
  const btnExportXlsx         = document.getElementById('btnExportValidXlsx');
  const btnExportAllXlsx      = document.getElementById('btnExportAllXlsx');
  const btnSendValidToCampaign = document.getElementById('btnSendValidToCampaign');
  const btnSaveValidToContacts = document.getElementById('btnSaveValidToContacts');

  const valStatTotal   = document.getElementById('valStatTotal');
  const valStatValid   = document.getElementById('valStatValid');
  const valStatInvalid = document.getElementById('valStatInvalid');
  const valStatPct     = document.getElementById('valStatPct');
  const valProgressBar = document.getElementById('valProgressBar');
  const validatorTableBody = document.getElementById('validatorTableBody');

  // Speed control (Phase 4.5)
  const validationSpeedSlider = document.getElementById('validationSpeedSlider');
  const validationSpeedLabel  = document.getElementById('validationSpeedLabel');

  let validatedList = [];
  let isValidating = false;

  // ─── Check for resumable state on load ───────────────────────────────
  const savedState = await window.api.getValidationState();
  if (savedState && savedState.current > 0 && savedState.numbers && savedState.numbers.length > savedState.current) {
    if (btnResumeValidation) {
      btnResumeValidation.style.display = 'flex';
      btnResumeValidation.textContent = `▶ Resume (${savedState.current}/${savedState.numbers.length} done)`;
    }
  }

  // ─── Speed slider ─────────────────────────────────────────────────────
  if (validationSpeedSlider) {
    validationSpeedSlider.addEventListener('input', () => {
      const ms = parseInt(validationSpeedSlider.value, 10);
      if (validationSpeedLabel) {
        validationSpeedLabel.textContent = ms < 500 ? `${ms}ms (Fast)` : ms < 1000 ? `${ms}ms (Normal)` : `${ms}ms (Safe)`;
      }
    });
  }

  // ─── Validation logic ─────────────────────────────────────────────────
  if (btnStartValidation) {
    btnStartValidation.addEventListener('click', async () => {
      const raw = validatorInput ? validatorInput.value.trim() : '';
      if (!raw) {
        window.showToast('Please enter phone numbers to validate.', 'error');
        return;
      }

      const numbers = raw.split(/[\n,;]/).map(l => l.trim().replace(/\D+/g, '')).filter(n => n && n.length >= 7);
      if (numbers.length === 0) {
        window.showToast('No valid numeric phone numbers detected.', 'error');
        return;
      }

      const accounts = await window.api.getAccounts();
      const activeAcc = accounts.find(a => a.isActive);
      if (!activeAcc || activeAcc.status !== 'CONNECTED') {
        window.showToast('Active WhatsApp account is not connected! Please link/scan QR first.', 'error');
        return;
      }

      isValidating = true;
      validatedList = [];
      if (validatorTableBody) validatorTableBody.innerHTML = '';
      updateStats();

      btnStartValidation.disabled = true;
      btnStartValidation.textContent = `Validating 0 / ${numbers.length}...`;
      if (btnResumeValidation) btnResumeValidation.style.display = 'none';

      const speedMs = validationSpeedSlider ? parseInt(validationSpeedSlider.value, 10) : 200;

      try {
        await window.api.validateNumbers(numbers, { delayMs: speedMs });
        // Results will be accumulated via onValidatorProgress
        const validCount = validatedList.filter(r => r.valid).length;
        window.showToast(`Validation complete! ${validCount} active WhatsApp numbers found out of ${numbers.length}.`, 'success');
        enableExportButtons();
      } catch (err) {
        window.showToast('Validation failed: ' + err.message, 'error');
      } finally {
        isValidating = false;
        btnStartValidation.disabled = false;
        btnStartValidation.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Validate Numbers`;
      }
    });
  }

  // Resume validation
  if (btnResumeValidation) {
    btnResumeValidation.addEventListener('click', async () => {
      btnResumeValidation.disabled = true;
      btnResumeValidation.textContent = 'Resuming...';
      try {
        const result = await window.api.resumeValidation();
        if (result.resumed && result.results) {
          validatedList = result.results;
          if (validatorTableBody) {
            validatorTableBody.innerHTML = '';
            validatedList.forEach((r, i) => appendRow(r, i + 1));
          }
          updateStats();
          enableExportButtons();
          window.showToast(`Resumed! ${validatedList.filter(r => r.valid).length} valid found.`, 'success');
        }
      } catch (err) {
        window.showToast('Resume failed: ' + err.message, 'error');
      } finally {
        btnResumeValidation.style.display = 'none';
        btnResumeValidation.disabled = false;
      }
    });
  }

  // Clear validation state
  if (btnClearValidation) {
    btnClearValidation.addEventListener('click', async () => {
      await window.api.clearValidationState();
      validatedList = [];
      if (validatorTableBody) validatorTableBody.innerHTML = '';
      updateStats();
      if (btnResumeValidation) btnResumeValidation.style.display = 'none';
      window.showToast('Validation cleared', 'info');
    });
  }

  // ─── Live progress listener ───────────────────────────────────────────
  window.api.onValidatorProgress((data) => {
    const { current, total, lastResult } = data;
    if (btnStartValidation && isValidating) {
      btnStartValidation.textContent = `Validating ${current} / ${total}...`;
    }
    if (valProgressBar) {
      valProgressBar.style.width = `${Math.round((current / total) * 100)}%`;
    }
    if (lastResult) {
      validatedList.push(lastResult);
      appendRow(lastResult, validatedList.length);
      updateStats(total);
    }
  });

  function appendRow(item, index) {
    if (!validatorTableBody) return;
    const tr = document.createElement('tr');
    const isBiz = item.details && item.details.isBusiness;
    tr.innerHTML = `
      <td style="color:var(--text-dim)">${index}</td>
      <td style="font-family:var(--font-mono); font-weight:600;">+${item.phone}</td>
      <td>
        ${item.valid
          ? `<span class="status-badge" style="background:rgba(16,185,129,0.15);color:#34d399;padding:3px 10px;border-radius:4px;font-weight:600;">✓ Active${isBiz ? ' (Business)' : ''}</span>`
          : `<span class="status-badge" style="background:rgba(239,68,68,0.15);color:#f87171;padding:3px 10px;border-radius:4px;font-weight:600;">✕ Not Registered</span>`
        }
      </td>
      <td style="font-size:11px;color:var(--text-dim)">${isBiz ? '🏢 Business' : item.valid ? '👤 Personal' : '—'}</td>
    `;
    validatorTableBody.appendChild(tr);
    tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function updateStats(total) {
    const validCount = validatedList.filter(r => r.valid).length;
    const invalidCount = validatedList.length - validCount;
    const pct = total ? Math.round((validatedList.length / total) * 100) : (validatedList.length > 0 ? 100 : 0);

    if (valStatTotal)   valStatTotal.textContent   = validatedList.length;
    if (valStatValid)   valStatValid.textContent   = validCount;
    if (valStatInvalid) valStatInvalid.textContent = invalidCount;
    if (valStatPct)     valStatPct.textContent     = `${validCount > 0 ? Math.round((validCount / Math.max(1, validatedList.length)) * 100) : 0}% valid`;
  }

  function enableExportButtons() {
    const hasValid = validatedList.some(r => r.valid);
    if (btnExportCsv)        btnExportCsv.disabled        = !hasValid;
    if (btnExportXlsx)       btnExportXlsx.disabled       = !hasValid;
    if (btnExportAllXlsx)    btnExportAllXlsx.disabled    = validatedList.length === 0;
    if (btnSendValidToCampaign) btnSendValidToCampaign.disabled = !hasValid;
    if (btnSaveValidToContacts) btnSaveValidToContacts.disabled = !hasValid;
  }

  // ─── Export CSV (valid only) ──────────────────────────────────────────
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const validOnly = validatedList.filter(r => r.valid);
      if (!validOnly.length) return;
      const csv = ['PhoneNumber,WhatsApp Status,Type']
        .concat(validOnly.map(r => `+${r.phone},Active on WhatsApp,${r.details?.isBusiness ? 'Business' : 'Personal'}`))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `valid_whatsapp_numbers_${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.showToast(`Exported ${validOnly.length} valid numbers to CSV!`, 'success');
    });
  }

  // ─── Export XLSX (valid only) — Phase 4.2 ────────────────────────────
  if (btnExportXlsx) {
    btnExportXlsx.addEventListener('click', async () => {
      const validOnly = validatedList.filter(r => r.valid);
      if (!validOnly.length) return;
      btnExportXlsx.textContent = 'Exporting...';
      try {
        const buffer = await window.api.exportValidationXlsx(validOnly);
        if (!buffer) { window.showToast('Export failed', 'error'); return; }
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `valid_whatsapp_${Date.now()}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.showToast(`Exported ${validOnly.length} valid numbers to Excel!`, 'success');
      } catch (err) {
        window.showToast('Export failed: ' + err.message, 'error');
      } finally {
        btnExportXlsx.textContent = '📊 Export Valid (XLSX)';
      }
    });
  }

  // ─── Export XLSX (all results) ────────────────────────────────────────
  if (btnExportAllXlsx) {
    btnExportAllXlsx.addEventListener('click', async () => {
      if (!validatedList.length) return;
      btnExportAllXlsx.textContent = 'Exporting...';
      try {
        const buffer = await window.api.exportValidationXlsx(validatedList);
        if (!buffer) { window.showToast('Export failed', 'error'); return; }
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `all_validation_results_${Date.now()}.xlsx`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.showToast(`Exported all ${validatedList.length} results to Excel!`, 'success');
      } catch (err) {
        window.showToast('Export failed: ' + err.message, 'error');
      } finally {
        btnExportAllXlsx.textContent = '📥 Export All (XLSX)';
      }
    });
  }

  // ─── Send to Campaign ─────────────────────────────────────────────────
  if (btnSendValidToCampaign) {
    btnSendValidToCampaign.addEventListener('click', () => {
      const validOnly = validatedList.filter(r => r.valid);
      if (!validOnly.length) return;
      const formatted = validOnly.map(r => `${r.phone}, Customer, Filtered Lead`).join('\n');
      const campTA = document.getElementById('campContactsText');
      if (campTA) { campTA.value = formatted; campTA.dispatchEvent(new Event('input')); }
      document.querySelector('[data-tab="campaigns"]')?.click();
      window.showToast(`Loaded ${validOnly.length} validated contacts into Campaign!`, 'success');
    });
  }

  // ─── Save Valid Contacts to Address Book ─────────────────────────────
  if (btnSaveValidToContacts) {
    btnSaveValidToContacts.addEventListener('click', async () => {
      const validOnly = validatedList.filter(r => r.valid);
      if (!validOnly.length) return;
      btnSaveValidToContacts.disabled = true;
      for (const r of validOnly) {
        await window.api.addContact({
          phone: r.phone,
          tags: r.details?.isBusiness ? 'wa-business,validated' : 'validated'
        });
      }
      btnSaveValidToContacts.disabled = false;
      window.showToast(`Saved ${validOnly.length} validated contacts to Address Book!`, 'success');
    });
  }
});
