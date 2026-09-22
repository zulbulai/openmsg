import { h, icon, logo, clear } from './dom.js';
import * as _0x1bc8d2 from './kit.js';
import { PANELS, TOPBAR } from '../panels/index.js';
import { openSettingsMenu } from './settings-menu.js';
import { createCrmDrawer } from '../features/crm-drawer.js';
import { installStrap } from '../features/strap.js';
import { installBlur } from '../features/blur.js';
import { openAppointmentDrawer } from '../panels/calendar.js';
import { openProgress } from '../panels/broadcasts.js';
import { debounce } from '../core/util.js';
import { loadStyles } from './styles.js';
import { brand } from '../core/brand.js';
import { openLicenseDialog, licenseChip } from './license-dialog.js';
const TOPBAR_HEIGHT = 50;
const PARENT = {
  notes: 'tools',
  reminders: 'tools',
  'crm-settings': 'tools',
  validator: 'tools',
  'export-contacts': 'tools',
  'import-export': 'tools',
  'group-tools': 'tools',
  'link-generator': 'tools',
  'status-posts': 'tools',
  blur: 'tools',
  settings: 'tools',
};
export async function mountShell(_0x3ba2c4) {
  const _0x529dfb = document.createElement('div');
  _0x529dfb.id = 'wacrm-host';
  _0x529dfb.style.cssText =
    'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
  const _0x2e034c = _0x529dfb.attachShadow({
    mode: 'open',
  });
  const _0x183596 = h('div', {
    class: 'wc-root',
    'data-theme': 'dark',
    translate: 'no',
  });
  const _0x1446db = h('section', {
    class: 'wc-panel',
    hidden: true,
    'aria-label': brand() + ' workspace',
  });
  const _0x4682f3 = h('aside', {
    class: 'wc-drawer',
    hidden: true,
    'aria-label': 'Contact details',
  });
  const _0x5ac24c = h('div', {
    class: 'wc-strap-layer',
  });
  const _0x4d819d = h('div', {
    class: 'wc-pop-layer',
  });
  const _0x17f19a = h('div', {
    class: 'wc-modal-layer',
  });
  const _0x1f0cb4 = h('div', {
    class: 'wc-toast-layer',
    'aria-live': 'polite',
  });
  _0x1bc8d2.layers.root = _0x183596;
  _0x1bc8d2.layers.modal = _0x17f19a;
  _0x1bc8d2.layers.pop = _0x4d819d;
  _0x1bc8d2.layers.toast = _0x1f0cb4;
  const _0x47bb98 = {
    panel: null,
    disposers: [],
    themePref: _0x3ba2c4.store.setting('theme') || 'auto',
    bottomReserve: 0,
  };
  const _0x32423a = {
    elements: {
      root: _0x183596,
      panel: _0x1446db,
      crm: _0x4682f3,
      strap: _0x5ac24c,
      pop: _0x4d819d,
      modal: _0x17f19a,
      toast: _0x1f0cb4,
    },
  };
  function _0x29e691() {
    try {
      const _0x25d93a = (window.localStorage.getItem('theme') || '')
        .replace(/"/g, '')
        .toLowerCase();
      if (_0x25d93a === 'dark' || _0x25d93a === 'light') {
        return _0x25d93a;
      }
      if (_0x25d93a.indexOf('system') !== -1) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        } else {
          return 'light';
        }
      }
    } catch (_0x1db5e2) {}
    if (
      document.body.classList.contains('dark') ||
      document.body.getAttribute('data-theme') === 'dark'
    ) {
      return 'dark';
    } else {
      return 'light';
    }
  }
  function _0x29be73() {
    _0x183596.setAttribute(
      'data-theme',
      _0x47bb98.themePref === 'auto' ? _0x29e691() : _0x47bb98.themePref,
    );
  }
  _0x32423a.themePreference = () => _0x47bb98.themePref;
  _0x32423a.setTheme = (_0xc47e2) => {
    _0x47bb98.themePref = _0xc47e2;
    _0x29be73();
    _0x3ba2c4.store.setSetting('theme', _0xc47e2);
  };
  let _0x53ba6b = '';
  function _0x4a4874() {
    const _0x4cfd91 = document.getElementById('app');
    if (!_0x4cfd91) {
      return;
    }
    const _0x1ddb0b =
      'calc(100vh - ' + (TOPBAR_HEIGHT + _0x47bb98.bottomReserve) + 'px)';
    if (
      _0x4cfd91.style.getPropertyValue('top') !== TOPBAR_HEIGHT + 'px' ||
      _0x53ba6b !== _0x1ddb0b
    ) {
      _0x4cfd91.style.setProperty('top', TOPBAR_HEIGHT + 'px', 'important');
      _0x4cfd91.style.setProperty('height', _0x1ddb0b, 'important');
      _0x53ba6b = _0x1ddb0b;
    }
  }
  _0x32423a.reserveBottom = (_0x500590) => {
    _0x47bb98.bottomReserve = Math.max(0, Math.round(_0x500590));
    _0x4a4874();
  };
  function _0x5a412d() {
    const _0x4833fc = document.querySelector('#pane-side');
    let _0xcd2b11 = 0;
    if (_0x4833fc) {
      const _0x5f0914 = _0x4833fc.getBoundingClientRect();
      if (_0x5f0914.width > 0) {
        _0xcd2b11 = Math.round(_0x5f0914.right);
      }
    }
    _0x183596.style.setProperty('--wc-panel-left', _0xcd2b11 + 'px');
  }
  const _0x52a465 = h('span', {
    class: 'wc-panel-icon',
  });
  const _0x2fe0bc = h('h1', {
    class: 'wc-panel-title',
  });
  const _0x57847b = h('p', {
    class: 'wc-panel-sub',
  });
  const _0x3c7bbd = h('div', {
    class: 'wc-panel-actions',
  });
  const _0x157522 = h('div', {
    class: 'wc-panel-body',
  });
  _0x1446db.appendChild(
    h(
      'header',
      {
        class: 'wc-panel-head',
      },
      _0x52a465,
      h(
        'div',
        {
          class: 'wc-panel-heading',
        },
        _0x2fe0bc,
        _0x57847b,
      ),
      _0x3c7bbd,
      _0x1bc8d2.iconButton('x', 'Close panel', () => _0x32423a.closePanel()),
    ),
  );
  _0x1446db.appendChild(_0x157522);
  function _0x8545a7() {
    for (const _0x55ce30 of _0x47bb98.disposers.splice(0)) {
      try {
        _0x55ce30();
      } catch (_0x284a78) {
        console.error(_0x284a78);
      }
    }
  }
  _0x32423a.setBleed = (_0x540f72) => {
    _0x157522.classList.toggle('is-bleed', !!_0x540f72);
    _0x1446db.classList.toggle('is-bleed', !!_0x540f72);
  };
  _0x32423a.panelOpen = () => !_0x1446db.hidden;
  _0x32423a.currentPanel = () => _0x47bb98.panel;
  const _0x1482b2 = () => {
    if (_0x3ba2c4.license.isActive()) {
      return false;
    }
    openLicenseDialog(_0x3ba2c4, _0x32423a);
    return true;
  };
  _0x32423a.openLicense = () => openLicenseDialog(_0x3ba2c4, _0x32423a);
  _0x32423a.openPanel = (_0x2042d5, _0x3f03e4 = {}) => {
    const _0x5ce330 = PANELS[_0x2042d5];
    if (!_0x5ce330) {
      return;
    }
    if (_0x1482b2()) {
      return;
    }
    _0x8545a7();
    _0x47bb98.panel = _0x2042d5;
    _0x32423a.setBleed(false);
    _0x1bc8d2.closeAllModals();
    _0x52a465.textContent = '';
    _0x52a465.appendChild(icon(_0x5ce330.icon, 20));
    _0x2fe0bc.textContent = _0x5ce330.title;
    _0x57847b.textContent = _0x5ce330.subtitle;
    clear(_0x3c7bbd);
    clear(_0x157522);
    const _0x1447ec = {
      app: _0x3ba2c4,
      shell: _0x32423a,
      params: _0x3f03e4,
      builderOpen: false,
      onDispose: (_0x4b18cc) => _0x47bb98.disposers.push(_0x4b18cc),
      setActions: (_0x2e3119) => {
        clear(_0x3c7bbd);
        (_0x2e3119 || [])
          .filter(Boolean)
          .forEach((_0x210823) => _0x3c7bbd.appendChild(_0x210823));
      },
      setSubtitle: (_0x1bbe1f) => {
        _0x57847b.textContent = _0x1bbe1f;
      },
      setTitle: (_0xd9186d) => {
        _0x2fe0bc.textContent = _0xd9186d;
      },
    };
    _0x1446db.hidden = false;
    _0x5a412d();
    try {
      _0x157522.appendChild(_0x5ce330.render(_0x1447ec));
    } catch (_0x1c4c19) {
      console.error('[WACRM] panel failed', _0x2042d5, _0x1c4c19);
      _0x157522.appendChild(
        _0x1bc8d2.banner(
          'This screen could not be opened: ' + _0x1c4c19.message,
          'danger',
        ),
      );
    }
    _0x1d1bbd();
    _0x157522.scrollTop = 0;
  };
  _0x32423a.closePanel = () => {
    _0x8545a7();
    _0x47bb98.panel = null;
    _0x1446db.hidden = true;
    _0x32423a.setBleed(false);
    _0x1d1bbd();
  };
  const _0x25d436 = createCrmDrawer(_0x3ba2c4, _0x32423a);
  _0x32423a.crmChanged = () => _0x1d1bbd();
  _0x32423a.openCrm = async (_0x4e0812, _0x3e3faf) => {
    if (_0x1482b2()) {
      return;
    }
    let _0x149d07 = _0x4e0812;
    if (!_0x149d07) {
      const _0x57789b =
        _0x3ba2c4.wa.state.activeChat ||
        (await _0x3ba2c4.wa.activeChat().catch(() => null));
      _0x149d07 = _0x57789b && _0x57789b.id;
    }
    if (!_0x149d07) {
      _0x1bc8d2.toast('Open a chat in WhatsApp first.', 'info');
      return;
    }
    _0x25d436.open(_0x149d07, _0x3e3faf);
  };
  _0x32423a.openAppointment = (_0x59a9ad) =>
    openAppointmentDrawer(
      _0x3ba2c4,
      _0x32423a,
      _0x59a9ad &&
        _0x59a9ad.id &&
        _0x3ba2c4.store.get('appointments', _0x59a9ad.id)
        ? _0x3ba2c4.store.get('appointments', _0x59a9ad.id)
        : _0x59a9ad || {},
    );
  _0x32423a.handleNotificationClick = (_0x9b1b5c) => {
    if (!_0x9b1b5c) {
      return;
    }
    if (_0x9b1b5c.kind === 'reminder' && _0x9b1b5c.chatId) {
      _0x3ba2c4.wa.openChat(_0x9b1b5c.chatId).catch(() => {});
      _0x32423a.openCrm(_0x9b1b5c.chatId, 'reminders');
    }
    if (_0x9b1b5c.kind === 'appointment') {
      _0x32423a.openPanel('appointments');
    }
  };
  _0x3ba2c4.bus.on('notify', (_0x4f124e) =>
    _0x1bc8d2.toast(
      _0x4f124e.title + (_0x4f124e.message ? ': ' + _0x4f124e.message : ''),
      'info',
      {
        ttl: 9000,
        action: _0x4f124e.data
          ? {
              label: 'Open',
              onClick: () => _0x32423a.handleNotificationClick(_0x4f124e.data),
            }
          : undefined,
      },
    ),
  );
  _0x3ba2c4.bus.on('campaign:done', (_0x1c57c3) => {
    const _0x261852 = _0x1c57c3 && _0x1c57c3.run;
    if (!_0x261852) {
      return;
    }
    _0x1bc8d2.toast(
      '"' +
        _0x1c57c3.name +
        '" finished: ' +
        _0x261852.sent +
        ' sent' +
        (_0x261852.failed ? ', ' + _0x261852.failed + ' failed' : '') +
        '.',
      _0x261852.failed ? 'info' : 'success',
      {
        ttl: 9000,
        action: {
          label: 'View report',
          onClick: () => openProgress(_0x3ba2c4, _0x1c57c3.id),
        },
      },
    );
  });
  _0x3ba2c4.bus.on('handoff', (_0xf00545) =>
    _0x1bc8d2.toast(
      _0x3ba2c4.crm.displayName(_0xf00545.chatId) +
        ' needs a person to take over.',
      'info',
      {
        ttl: 9000,
        action: {
          label: 'Open chat',
          onClick: () =>
            _0x3ba2c4.wa.openChat(_0xf00545.chatId).catch(() => {}),
        },
      },
    ),
  );
  const _0x3c2935 = h('div', {
    class: 'wc-pills',
    role: 'tablist',
    'aria-label': 'Chat filters',
  });
  let _0x4f96cb = {};
  function _0x5dda22() {
    clear(_0x3c2935);
    const _0x474ce8 = _0x3ba2c4.filters.current();
    for (const _0x5bb9f6 of _0x3ba2c4.filters.pills()) {
      const _0x287b60 =
        _0x474ce8.kind === _0x5bb9f6.kind && _0x474ce8.id === _0x5bb9f6.id;
      const _0x10de02 =
        _0x5bb9f6.kind === 'system' ? _0x4f96cb[_0x5bb9f6.id] : undefined;
      _0x3c2935.appendChild(
        h(
          'button',
          {
            type: 'button',
            role: 'tab',
            class:
              'wc-pill-tab' +
              (_0x287b60 ? ' is-active' : '') +
              (_0x5bb9f6.kind === 'tab' ? ' is-custom' : ''),
            'aria-selected': _0x287b60,
            onClick: async () => {
              if (_0x1482b2()) {
                return;
              }
              try {
                await _0x3ba2c4.filters.apply(_0x5bb9f6);
                _0x5dda22();
              } catch (_0x2cd922) {
                _0x1bc8d2.toast(
                  'Could not filter the chat list: ' + _0x2cd922.message,
                  'error',
                );
              }
            },
          },
          _0x5bb9f6.kind === 'tab' ? icon('folders', 13) : null,
          _0x5bb9f6.label,
          _0x10de02
            ? h(
                'span',
                {
                  class: 'wc-tab-count',
                },
                String(_0x10de02),
              )
            : null,
        ),
      );
    }
    _0x3c2935.appendChild(
      _0x1bc8d2.iconButton(
        'plus',
        'Add a custom tab',
        () => _0x32423a.openPanel('tabs', {}),
        'wc-tab-add',
      ),
    );
  }
  const _0x95a323 = debounce(async () => {
    _0x4f96cb = await _0x3ba2c4.filters.counts();
    _0x5dda22();
  }, 800);
  _0x3ba2c4.store.on('tabs', _0x5dda22);
  function _0x8372f8(_0x62f037, _0x10abf2, _0x94926e, _0x187b4e) {
    return h(
      'button',
      Object.assign(
        {
          class: 'wc-topbtn',
          type: 'button',
          'data-tip': _0x10abf2,
          'aria-label': _0x10abf2,
          onClick: _0x94926e,
        },
        _0x187b4e || {},
      ),
      icon(_0x62f037, 19),
    );
  }
  _0x32423a.openWorkspace = (_0x1cba3f = 'kanban') =>
    chrome.runtime
      .sendMessage({
        type: 'open-page',
        panel: _0x1cba3f,
      })
      .catch(() =>
        _0x1bc8d2.toast('Could not open the full-screen page.', 'error'),
      );
  const _0x525502 = (_0x301c1a) =>
    _0x301c1a === 'kanban' && _0x3ba2c4.store.setting('kanbanOpen') !== 'panel';
  const _0x561b51 = TOPBAR.map((_0x1ccf10) => {
    const _0x596b5a = PANELS[_0x1ccf10];
    const _0x2d310f = _0x8372f8(_0x596b5a.icon, _0x596b5a.title, () => {
      if (_0x525502(_0x1ccf10)) {
        _0x32423a.openWorkspace(_0x1ccf10);
      } else if (_0x47bb98.panel === _0x1ccf10) {
        _0x32423a.closePanel();
      } else {
        _0x32423a.openPanel(_0x1ccf10);
      }
    });
    _0x2d310f.dataset.panel = _0x1ccf10;
    return _0x2d310f;
  });
  const _0x173466 = _0x8372f8('contact-round', 'Contact details (CRM)', () =>
    _0x25d436.isOpen() ? _0x25d436.close() : _0x32423a.openCrm(),
  );
  const _0x33d5f9 = _0x8372f8('settings', 'Settings', () =>
    openSettingsMenu(_0x3ba2c4, _0x32423a, _0x33d5f9),
  );
  _0x33d5f9.classList.add('wc-settings-btn');
  const _0x2db14b = licenseChip(_0x3ba2c4, () =>
    openLicenseDialog(_0x3ba2c4, _0x32423a),
  );
  const _0x396b83 = h(
    'button',
    {
      type: 'button',
      class: 'wc-pausedchip',
      hidden: true,
      title: 'Automations are paused. Click to resume.',
      onClick: () => _0x3ba2c4.store.setSetting('automationPaused', false),
    },
    icon('pause', 13),
    'Paused',
  );
  function _0x1d1bbd() {
    const _0x4c6543 = PARENT[_0x47bb98.panel] || _0x47bb98.panel;
    for (const _0x16607f of _0x561b51) {
      _0x16607f.classList.toggle(
        'is-active',
        !_0x1446db.hidden && _0x16607f.dataset.panel === _0x4c6543,
      );
      if (_0x16607f.dataset.panel === 'ai') {
        _0x16607f.classList.toggle(
          'is-ai-on',
          !!_0x3ba2c4.assistant.config().enabled,
        );
      }
    }
    _0x173466.classList.toggle('is-active', _0x25d436.isOpen());
    _0x396b83.hidden = !_0x3ba2c4.store.setting('automationPaused');
  }
  _0x3ba2c4.store.on('settings', _0x1d1bbd);
  const _0x3657b9 = () =>
    _0x63e68.classList.toggle('is-locked', !_0x3ba2c4.license.isActive());
  let _0x28e5bd = false;
  _0x3ba2c4.license.on((_0x27f927) => {
    _0x3657b9();
    if (_0x27f927.active) {
      _0x28e5bd = false;
      _0x95a323();
      _0x5dda22();
      return;
    }
    if (_0x47bb98.panel) {
      _0x32423a.closePanel();
    }
    if (_0x25d436.isOpen()) {
      _0x25d436.close();
    }
    if (
      !_0x28e5bd &&
      (_0x27f927.status === 'not_applied' ||
        _0x27f927.status === 'denied' ||
        _0x27f927.status === 'offline')
    ) {
      _0x28e5bd = true;
      openLicenseDialog(_0x3ba2c4, _0x32423a);
    }
  });
  const _0x95e2ea = h(
    'nav',
    {
      class: 'wc-chat-tabs',
    },
    _0x3c2935,
  );
  _0x95e2ea.addEventListener(
    'wheel',
    (_0x362436) => {
      if (
        Math.abs(_0x362436.deltaY) > Math.abs(_0x362436.deltaX) &&
        _0x95e2ea.scrollWidth > _0x95e2ea.clientWidth
      ) {
        _0x95e2ea.scrollLeft += _0x362436.deltaY;
        _0x362436.preventDefault();
      }
    },
    {
      passive: false,
    },
  );
  const _0x63e68 = h(
    'header',
    {
      class: 'wc-topbar',
    },
    h(
      'div',
      {
        class: 'wc-brand',
        title: brand(),
      },
      logo(28),
      h(
        'span',
        {
          class: 'wc-brand-name',
        },
        brand(),
      ),
    ),
    _0x95e2ea,
    _0x396b83,
    h(
      'div',
      {
        class: 'wc-actions',
      },
      _0x561b51,
      h('span', {
        class: 'wc-vsep',
      }),
      _0x173466,
      _0x33d5f9,
    ),
  );
  _0x183596.appendChild(_0x1446db);
  _0x183596.appendChild(_0x4682f3);
  _0x183596.appendChild(_0x5ac24c);
  _0x183596.appendChild(_0x63e68);
  _0x183596.appendChild(_0x4d819d);
  _0x183596.appendChild(_0x17f19a);
  _0x183596.appendChild(_0x1f0cb4);
  _0x2e034c.appendChild(_0x183596);
  ['keydown', 'keyup', 'keypress'].forEach((_0x3e710a) =>
    _0x529dfb.addEventListener(_0x3e710a, (_0xa099f6) =>
      _0xa099f6.stopPropagation(),
    ),
  );
  document.addEventListener('keydown', (_0x3b98fb) => {
    if (_0x3b98fb.key !== 'Escape' || _0x1bc8d2.hasOpenModal()) {
      return;
    }
    const _0x5dbefb = _0x3b98fb.composedPath ? _0x3b98fb.composedPath() : [];
    if (_0x5dbefb.indexOf(_0x529dfb) === -1) {
      return;
    }
    if (_0x25d436.isOpen()) {
      _0x25d436.close();
    } else if (_0x47bb98.panel) {
      _0x32423a.closePanel();
    }
  });
  await loadStyles(_0x2e034c, _0x183596);
  _0x29be73();
  document.body.appendChild(_0x529dfb);
  _0x4a4874();
  _0x5a412d();
  _0x5dda22();
  _0x1d1bbd();
  _0x3657b9();
  new MutationObserver(_0x29be73).observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
  window.addEventListener('storage', _0x29be73);
  window.addEventListener('resize', () => {
    _0x4a4874();
    _0x5a412d();
  });
  _0x3ba2c4.wa.on('unread', _0x95a323);
  _0x3ba2c4.wa.on('message', _0x95a323);
  _0x3ba2c4.wa.on('message', (_0xe8a66c) => {
    _0x3ba2c4.filters.onMessage(_0xe8a66c).catch(() => {});
  });
  _0x3ba2c4.wa.on('ready', () => {
    _0x95a323();
    _0x5dda22();
  });
  _0x3ba2c4.wa.on('active_chat', (_0x462911) => {
    if (
      _0x25d436.isOpen() &&
      _0x462911 &&
      _0x462911.id !== _0x25d436.chatId()
    ) {
      _0x25d436.open(_0x462911.id);
    }
  });
  setInterval(() => {
    if (!_0x529dfb.isConnected) {
      document.body.appendChild(_0x529dfb);
    }
    _0x4a4874();
    if (_0x47bb98.panel) {
      _0x5a412d();
    }
  }, 1000);
  setInterval(_0x95a323, 30000);
  _0x95a323();
  _0x32423a.strap = installStrap(_0x3ba2c4, _0x32423a);
  _0x32423a.blur = installBlur(_0x3ba2c4);
  return _0x32423a;
}
