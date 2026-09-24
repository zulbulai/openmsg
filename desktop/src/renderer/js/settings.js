/**
 * Settings & Licensing Controller
 * Displays HWID machine lock, handles license verification, and saves anti-ban preferences
 */

window.addEventListener('DOMContentLoaded', async () => {
  const hwidDisplay = document.getElementById('hwidDisplay');
  const btnCopyHwid = document.getElementById('btnCopyHwid');
  const licenseKeyInput = document.getElementById('licenseKeyInput');
  const btnActivateLicense = document.getElementById('btnActivateLicense');
  const licenseBadgeDetailed = document.getElementById('licenseBadgeDetailed');
  const licenseDetailText = document.getElementById('licenseDetailText');

  const setDefMinDelay = document.getElementById('setDefMinDelay');
  const setDefMaxDelay = document.getElementById('setDefMaxDelay');
  const setDefTyping = document.getElementById('setDefTyping');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // Load HWID & License Status
  async function loadLicenseInfo() {
    try {
      const hwid = await window.api.getHwid();
      hwidDisplay.value = hwid;

      const lic = await window.api.getLicenseStatus();
      if (lic.isActivated) {
        licenseBadgeDetailed.textContent = `${lic.plan} (ACTIVE)`;
        licenseBadgeDetailed.style.background = 'rgba(16, 185, 129, 0.15)';
        licenseBadgeDetailed.style.color = '#34d399';
        licenseBadgeDetailed.style.border = '1px solid rgba(16, 185, 129, 0.3)';

        licenseDetailText.innerHTML = `
          Registered to: <strong>${lic.customer || 'Licensed Client'}</strong><br>
          Type: <strong>${lic.isLifetime ? 'Lifetime Access' : 'Subscription'}</strong><br>
          Expires: <strong>${lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : 'Never'}</strong>
        `;
      } else {
        licenseBadgeDetailed.textContent = 'FREE TRIAL / INACTIVE';
        licenseBadgeDetailed.style.background = 'rgba(239, 68, 68, 0.15)';
        licenseBadgeDetailed.style.color = '#f87171';
        licenseBadgeDetailed.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        licenseDetailText.textContent = lic.message || 'Please enter your license key to unlock unlimited campaigns.';
      }
    } catch (e) {
      console.warn('Failed to load license info:', e);
    }
  }

  // Copy HWID
  if (btnCopyHwid && hwidDisplay) {
    btnCopyHwid.addEventListener('click', () => {
      navigator.clipboard.writeText(hwidDisplay.value);
      window.showToast('Hardware ID copied to clipboard!', 'success');
    });
  }

  // Activate License
  if (btnActivateLicense && licenseKeyInput) {
    btnActivateLicense.addEventListener('click', async () => {
      const key = licenseKeyInput.value.trim();
      if (!key) {
        window.showToast('Please enter a license key.', 'error');
        return;
      }

      btnActivateLicense.disabled = true;
      btnActivateLicense.textContent = 'Verifying...';

      try {
        const res = await window.api.activateLicense(key);
        if (res.success) {
          window.showToast('License successfully activated! Thank you for purchasing OpenMsg Pro.', 'success');
          await loadLicenseInfo();
        } else {
          window.showToast('Activation failed: ' + res.reason, 'error');
        }
      } catch (err) {
        window.showToast('Error during activation: ' + err.message, 'error');
      } finally {
        btnActivateLicense.disabled = false;
        btnActivateLicense.textContent = 'Activate License';
      }
    });
  }

  const setValidationDelay = document.getElementById('setValidationDelay');
  const setValidationDelayLabel = document.getElementById('setValidationDelayLabel');

  if (setValidationDelay && setValidationDelayLabel) {
    setValidationDelay.addEventListener('input', () => {
      const ms = parseInt(setValidationDelay.value, 10);
      setValidationDelayLabel.textContent = `${ms}ms (${ms <= 300 ? 'Fast' : ms <= 1000 ? 'Normal' : 'Safe'})`;
    });
  }

  // Load and save settings
  async function loadSettings() {
    try {
      const s = await window.api.getSettings();
      if (s.minDelay) setDefMinDelay.value = s.minDelay;
      if (s.maxDelay) setDefMaxDelay.value = s.maxDelay;
      if (s.simulateTyping !== undefined) setDefTyping.checked = s.simulateTyping;
      if (s.validationDelayMs && setValidationDelay && setValidationDelayLabel) {
        setValidationDelay.value = s.validationDelayMs;
        setValidationDelayLabel.textContent = `${s.validationDelayMs}ms (${s.validationDelayMs <= 300 ? 'Fast' : s.validationDelayMs <= 1000 ? 'Normal' : 'Safe'})`;
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', async () => {
      const newSettings = {
        minDelay: setDefMinDelay ? (parseInt(setDefMinDelay.value, 10) || 5) : 5,
        maxDelay: setDefMaxDelay ? (parseInt(setDefMaxDelay.value, 10) || 15) : 15,
        simulateTyping: setDefTyping ? setDefTyping.checked : true,
        validationDelayMs: setValidationDelay ? parseInt(setValidationDelay.value, 10) : 200
      };

      await window.api.saveSettings(newSettings);
      window.showToast('Preferences saved successfully!', 'success');
    });
  }

  // Initial load
  await loadLicenseInfo();
  await loadSettings();
});
