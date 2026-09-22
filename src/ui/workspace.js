import { h, icon, logo, clear } from './dom.js';
import * as _0x3f9fb9 from './kit.js';
import { loadStyles } from './styles.js';
import { PANELS } from '../panels/index.js';
import { createCrmDrawer } from '../features/crm-drawer.js';
import { openAppointmentDrawer } from '../panels/calendar.js';
import { brand } from '../core/brand.js';
import {
  openLicenseDialog,
  licenseChip,
  licenseNotice,
} from './license-dialog.js';
function screenHost(_0x58fa85, _0x52f8b4, { closable: _0x5d826f }) {
  const _0xce4f8f = h('section', {
    class: 'wc-panel',
    hidden: true,
  });
  const _0x549d1a = h('span', {
    class: 'wc-panel-icon',
  });
  const _0x4c5485 = h('h1', {
    class: 'wc-panel-title',
  });
  const _0x6151a2 = h('p', {
    class: 'wc-panel-sub',
  });
  const _0x3c407f = h('div', {
    class: 'wc-panel-actions',
  });
  const _0x536c29 = h('div', {
    class: 'wc-panel-body',
  });
  let _0x4868b5 = [];
  let _0x14a0a8 = null;
  _0xce4f8f.appendChild(
    h(
      'header',
      {
        class: 'wc-panel-head',
      },
      _0x549d1a,
      h(
        'div',
        {
          class: 'wc-panel-heading',
        },
        _0x4c5485,
        _0x6151a2,
      ),
      _0x3c407f,
      _0x5d826f
        ? _0x3f9fb9.iconButton('x', 'Close', () => _0x38e740.close())
        : null,
    ),
  );
  _0xce4f8f.appendChild(_0x536c29);
  const _0x3caf95 = () => {
    for (const _0x3c7b94 of _0x4868b5.splice(0)) {
      try {
        _0x3c7b94();
      } catch (_0x16776e) {
        console.error(_0x16776e);
      }
    }
  };
  const _0x38e740 = {
    el: _0xce4f8f,
    body: _0x536c29,
    id: () => _0x14a0a8,
    setBleed(_0x4380c3) {
      _0x536c29.classList.toggle('is-bleed', !!_0x4380c3);
      _0xce4f8f.classList.toggle('is-bleed', !!_0x4380c3);
    },
    open(_0x1b14e5, _0x3ce8c8 = {}) {
      const _0x4e089d = PANELS[_0x1b14e5];
      if (!_0x4e089d) {
        return;
      }
      if (!_0x58fa85.license.isActive()) {
        _0x3caf95();
        _0x14a0a8 = _0x1b14e5;
        _0x38e740.setBleed(false);
        _0x3f9fb9.closeAllModals();
        _0x549d1a.textContent = '';
        _0x549d1a.appendChild(icon('lock', 20));
        _0x4c5485.textContent = _0x4e089d.title;
        _0x6151a2.textContent = '';
        clear(_0x3c407f);
        clear(_0x536c29);
        _0xce4f8f.hidden = false;
        _0x536c29.appendChild(
          licenseNotice(_0x58fa85, _0x52f8b4, (_0x16b9d1) =>
            _0x4868b5.push(_0x16b9d1),
          ),
        );
        return;
      }
      _0x3caf95();
      _0x14a0a8 = _0x1b14e5;
      _0x38e740.setBleed(false);
      _0x3f9fb9.closeAllModals();
      _0x549d1a.textContent = '';
      _0x549d1a.appendChild(icon(_0x4e089d.icon, 20));
      _0x4c5485.textContent = _0x4e089d.title;
      _0x6151a2.textContent = _0x4e089d.subtitle;
      clear(_0x3c407f);
      clear(_0x536c29);
      const _0x512f42 = {
        app: _0x58fa85,
        shell: _0x52f8b4,
        params: _0x3ce8c8,
        builderOpen: false,
        onDispose: (_0x4c16c3) => _0x4868b5.push(_0x4c16c3),
        setActions: (_0x1774ae) => {
          clear(_0x3c407f);
          (_0x1774ae || [])
            .filter(Boolean)
            .forEach((_0x4c4317) => _0x3c407f.appendChild(_0x4c4317));
        },
        setSubtitle: (_0x527c1b) => {
          _0x6151a2.textContent = _0x527c1b;
        },
        setTitle: (_0x2ac2fd) => {
          _0x4c5485.textContent = _0x2ac2fd;
        },
      };
      _0xce4f8f.hidden = false;
      try {
        _0x536c29.appendChild(_0x4e089d.render(_0x512f42));
      } catch (_0x28b3dc) {
        console.error('[WACRM] screen failed', _0x1b14e5, _0x28b3dc);
        _0x536c29.appendChild(
          _0x3f9fb9.banner(
            'This screen could not be opened: ' + _0x28b3dc.message,
            'danger',
          ),
        );
      }
      _0x536c29.scrollTop = 0;
    },
    close() {
      _0x3caf95();
      _0x14a0a8 = null;
      _0xce4f8f.hidden = true;
      _0x38e740.setBleed(false);
    },
  };
  return _0x38e740;
}
export async function mountWorkspace(
  _0x209e91,
  { panel = 'kanban', params = {} } = {},
) {
  const _0x3118f3 = PANELS[panel] ? panel : 'kanban';
  const _0x5da0d9 = document.createElement('div');
  _0x5da0d9.id = 'wacrm-host';
  _0x5da0d9.style.cssText = 'position:fixed;inset:0;';
  const _0x2fd5a4 = _0x5da0d9.attachShadow({
    mode: 'open',
  });
  const _0x6a38ef = h('div', {
    class: 'wc-root wc-workspace',
    'data-theme': 'dark',
    translate: 'no',
  });
  const _0x38b6c0 = h('aside', {
    class: 'wc-drawer',
    hidden: true,
    'aria-label': 'Contact details',
  });
  const _0x103607 = h('div', {
    class: 'wc-pop-layer',
  });
  const _0x428ea3 = h('div', {
    class: 'wc-modal-layer',
  });
  const _0x1bb51f = h('div', {
    class: 'wc-toast-layer',
    'aria-live': 'polite',
  });
  _0x3f9fb9.layers.root = _0x6a38ef;
  _0x3f9fb9.layers.modal = _0x428ea3;
  _0x3f9fb9.layers.pop = _0x103607;
  _0x3f9fb9.layers.toast = _0x1bb51f;
  const _0x3c5b05 = {
    themePref: _0x209e91.store.setting('theme') || 'auto',
  };
  const _0x1b4246 = {
    isWorkspace: true,
    elements: {
      root: _0x6a38ef,
      crm: _0x38b6c0,
      pop: _0x103607,
      modal: _0x428ea3,
      toast: _0x1bb51f,
    },
  };
  const _0x200eaa = screenHost(_0x209e91, _0x1b4246, {
    closable: false,
  });
  const _0xdac27e = screenHost(_0x209e91, _0x1b4246, {
    closable: true,
  });
  _0xdac27e.el.classList.add('is-sheet');
  _0x1b4246.elements.panel = _0xdac27e.el;
  const _0x8feaff = window.matchMedia('(prefers-color-scheme: dark)');
  function _0x41e4b5() {
    _0x3c5b05.themePref = _0x209e91.store.setting('theme') || 'auto';
    _0x6a38ef.setAttribute(
      'data-theme',
      _0x3c5b05.themePref === 'auto'
        ? _0x8feaff.matches
          ? 'dark'
          : 'light'
        : _0x3c5b05.themePref,
    );
  }
  _0x8feaff.addEventListener('change', _0x41e4b5);
  _0x209e91.store.on('settings', _0x41e4b5);
  _0x1b4246.openPanel = (_0x1ae921, _0x3081f9 = {}) => {
    if (_0x1ae921 === _0x3118f3) {
      _0x200eaa.open(_0x1ae921, _0x3081f9);
    } else {
      _0xdac27e.open(_0x1ae921, _0x3081f9);
    }
  };
  _0x1b4246.closePanel = () => _0xdac27e.close();
  _0x1b4246.panelOpen = () => !_0xdac27e.el.hidden;
  _0x1b4246.currentPanel = () => _0xdac27e.id() || _0x200eaa.id();
  _0x1b4246.setBleed = (_0x1545ac) =>
    (_0xdac27e.el.hidden ? _0x200eaa : _0xdac27e).setBleed(_0x1545ac);
  _0x1b4246.crmChanged = () => {};
  const _0x24c31e = createCrmDrawer(_0x209e91, _0x1b4246);
  _0x1b4246.openLicense = () => openLicenseDialog(_0x209e91, _0x1b4246);
  _0x1b4246.openCrm = async (_0x15d787, _0x263d5c) => {
    if (!_0x209e91.license.isActive()) {
      openLicenseDialog(_0x209e91, _0x1b4246);
      return;
    }
    if (!_0x15d787) {
      _0x3f9fb9.toast('Pick a card first.', 'info');
      return;
    }
    _0x24c31e.open(_0x15d787, _0x263d5c);
  };
  _0x1b4246.openAppointment = (_0x5939e5) =>
    openAppointmentDrawer(
      _0x209e91,
      _0x1b4246,
      _0x5939e5 &&
        _0x5939e5.id &&
        _0x209e91.store.get('appointments', _0x5939e5.id)
        ? _0x209e91.store.get('appointments', _0x5939e5.id)
        : _0x5939e5 || {},
    );
  _0x1b4246.handleNotificationClick = () => {};
  const _0x43595c = () =>
    chrome.runtime
      .sendMessage({
        type: 'open-whatsapp',
      })
      .catch(() => {});
  const _0x52a985 = h('span', {
    class: 'wc-conn',
  });
  function _0x1bbc21() {
    const _0x4d7f1f = _0x209e91.wa.state.status;
    let _0x576a8a;
    let _0x3caa49;
    if (_0x4d7f1f && _0x4d7f1f.injected && _0x4d7f1f.authenticated === false) {
      _0x576a8a = 'Sign in to WhatsApp Web';
      _0x3caa49 = 'warn';
    } else if (_0x209e91.wa.isReady()) {
      _0x576a8a = 'WhatsApp connected';
      _0x3caa49 = 'ok';
    } else if (_0x4d7f1f && _0x4d7f1f.injected) {
      _0x576a8a = 'WhatsApp is loading...';
      _0x3caa49 = 'warn';
    } else {
      _0x576a8a = 'WhatsApp Web is not connected';
      _0x3caa49 = 'danger';
    }
    clear(_0x52a985);
    _0x52a985.className = 'wc-conn is-' + _0x3caa49;
    _0x52a985.appendChild(
      h('span', {
        class: 'wc-conn-dot',
      }),
    );
    _0x52a985.appendChild(document.createTextNode(_0x576a8a));
  }
  _0x1bbc21();
  _0x209e91.wa.on('ready', _0x1bbc21);
  const _0x27f70c = h(
    'header',
    {
      class: 'wc-topbar wc-workspace-bar',
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
    h(
      'span',
      {
        class: 'wc-workspace-title',
      },
      PANELS[_0x3118f3].title,
    ),
    h('span', {
      class: 'wc-spacer',
    }),
    _0x52a985,
    licenseChip(_0x209e91, () => openLicenseDialog(_0x209e91, _0x1b4246)),
    _0x3f9fb9.button('Open WhatsApp', {
      icon: 'message-circle',
      onClick: _0x43595c,
    }),
  );
  const _0x1cff55 = h(
    'div',
    {
      class: 'wc-cutoff',
      hidden: true,
      role: 'alert',
    },
    icon('triangle-alert', 16),
    h(
      'span',
      null,
      brand() + ' was updated or reloaded. Reload this page to keep working.',
    ),
    _0x3f9fb9.button('Reload page', {
      size: 'sm',
      variant: 'primary',
      onClick: () => location.reload(),
    }),
  );
  const _0x46b948 = () => {
    try {
      return !chrome || !chrome.runtime || !chrome.runtime.id;
    } catch (_0x540db6) {
      return true;
    }
  };
  _0x6a38ef.appendChild(_0x200eaa.el);
  _0x6a38ef.appendChild(_0xdac27e.el);
  _0x6a38ef.appendChild(_0x38b6c0);
  _0x6a38ef.appendChild(_0x27f70c);
  _0x6a38ef.appendChild(_0x1cff55);
  _0x6a38ef.appendChild(_0x103607);
  _0x6a38ef.appendChild(_0x428ea3);
  _0x6a38ef.appendChild(_0x1bb51f);
  _0x2fd5a4.appendChild(_0x6a38ef);
  document.addEventListener('keydown', (_0x1e575e) => {
    if (_0x1e575e.key !== 'Escape' || _0x3f9fb9.hasOpenModal()) {
      return;
    }
    if (_0x24c31e.isOpen()) {
      _0x24c31e.close();
    } else if (!_0xdac27e.el.hidden) {
      _0xdac27e.close();
    }
  });
  window.addEventListener('beforeunload', () => {
    _0x209e91.store.flush();
  });
  await loadStyles(_0x2fd5a4, _0x6a38ef);
  _0x41e4b5();
  document.body.appendChild(_0x5da0d9);
  document.title = PANELS[_0x3118f3].title + ' - ' + brand();
  _0x200eaa.open(_0x3118f3, params);
  let _0x37f003 = _0x209e91.license.isActive();
  _0x209e91.license.on((_0x32bbbe) => {
    if (_0x32bbbe.active === _0x37f003) {
      return;
    }
    _0x37f003 = _0x32bbbe.active;
    if (_0x200eaa.id()) {
      _0x200eaa.open(_0x200eaa.id(), params);
    }
    if (_0xdac27e.id()) {
      _0xdac27e.open(_0xdac27e.id());
    }
  });
  setInterval(() => {
    _0x1bbc21();
    _0x1cff55.hidden = !_0x46b948();
  }, 1500);
  return _0x1b4246;
}
