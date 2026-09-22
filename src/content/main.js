import { createApp } from '../core/app.js';
import { chromeBackend } from '../core/store.js';
import { windowTransport } from '../core/wa.js';
import { serveRelay } from '../core/relay.js';
import { mountShell } from '../ui/shell.js';
import { chromeLicenseStorage, openLicense } from '../core/activation.js';
import { browserDeviceInfo } from '../core/browser-info.js';
if (!window.__WACRM_BOOTED__) {
  window.__WACRM_BOOTED__ = true;
  boot().catch((_0x30f068) => console.error('[WACRM] boot failed', _0x30f068));
}
async function boot() {
  const _0x2456d8 = (_0x237038) => chrome.runtime.sendMessage(_0x237038);
  const _0x4ce7a2 = windowTransport(window);
  const _0x2c04c0 = await createApp({
    backend: chromeBackend(),
    transport: _0x4ce7a2,
    send: _0x2456d8,
    licenseStorage: chromeLicenseStorage(),
    deviceInfo: browserDeviceInfo,
    license: window.__WACRM_LICENSE_OPEN__ ? openLicense() : undefined,
    notify: (_0x29ee51) =>
      _0x2456d8(
        Object.assign(
          {
            type: 'notify',
          },
          _0x29ee51,
        ),
      ).catch(() => {}),
    setAlarms: (_0x13e845) =>
      _0x2456d8({
        type: 'set-alarms',
        items: _0x13e845,
      }).catch(() => {}),
  });
  await _0x2c04c0.start();
  serveRelay(_0x4ce7a2);
  const _0x3b6ba8 = await mountShell(_0x2c04c0);
  if (typeof window.__WACRM_DEBUG__ === 'function') {
    window.__WACRM_DEBUG__(_0x2c04c0, _0x3b6ba8);
  }
  chrome.runtime.onMessage.addListener((_0x15cade) => {
    if (!_0x15cade) {
      return;
    }
    if (_0x15cade.type === 'alarm') {
      _0x2c04c0.tick();
    }
    if (_0x15cade.type === 'notification-click') {
      _0x3b6ba8.handleNotificationClick(_0x15cade.data);
    }
  });
  window.addEventListener('beforeunload', () => {
    _0x2c04c0.store.flush();
  });
}
