import { createApp } from '../core/app.js';
import { chromeBackend } from '../core/store.js';
import { relayTransport } from '../core/relay.js';
import { chromeLicenseStorage, openLicense } from '../core/activation.js';
import { browserDeviceInfo } from '../core/browser-info.js';
import { mountWorkspace } from '../ui/workspace.js';
import { brand } from '../core/brand.js';
async function boot() {
  const _0x280402 = (_0x578886) => chrome.runtime.sendMessage(_0x578886);
  const _0x29e30d = await createApp({
    backend: chromeBackend(),
    transport: relayTransport(chrome),
    send: _0x280402,
    licenseStorage: chromeLicenseStorage(),
    deviceInfo: browserDeviceInfo,
    license: window.__WACRM_LICENSE_OPEN__ ? openLicense() : undefined,
  });
  await _0x29e30d.startViewer();
  const _0x7a3ab6 =
    new URLSearchParams(location.search).get('panel') || 'kanban';
  const _0x582c50 = await mountWorkspace(_0x29e30d, {
    panel: _0x7a3ab6,
  });
  if (typeof window.__WACRM_DEBUG__ === 'function') {
    window.__WACRM_DEBUG__(_0x29e30d, _0x582c50);
  }
}
boot().catch((_0x4c8c22) => {
  console.error('[WACRM] the workspace could not start', _0x4c8c22);
  document.body.textContent =
    brand() +
    ' could not start: ' +
    ((_0x4c8c22 && _0x4c8c22.message) || _0x4c8c22);
});
