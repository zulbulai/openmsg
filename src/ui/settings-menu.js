import { h, icon } from './dom.js';
import * as _0x4dfce1 from './kit.js';
import { brand } from '../core/brand.js';
import { openLicenseDialog } from './license-dialog.js';
import { openAboutDialog, appVersion } from './about-dialog.js';
function themeSwitcher(_0x1a8364, _0x6ce862) {
  const _0x12fe62 = [
    {
      id: 'auto',
      label: 'Auto',
      icon: 'monitor',
    },
    {
      id: 'light',
      label: 'Light',
      icon: 'sun',
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: 'moon',
    },
  ];
  const _0x40305b = h('div', {
    class: 'wc-segmented',
    role: 'radiogroup',
    'aria-label': 'Appearance',
  });
  const _0x58a5e1 = () => {
    for (const _0x5ed45b of _0x40305b.children) {
      _0x5ed45b.classList.toggle(
        'is-active',
        _0x5ed45b.dataset.id === _0x6ce862.themePreference(),
      );
    }
  };
  for (const _0x33ec36 of _0x12fe62) {
    _0x40305b.appendChild(
      h(
        'button',
        {
          class: 'wc-segmented-item',
          type: 'button',
          role: 'radio',
          dataset: {
            id: _0x33ec36.id,
          },
          onClick: () => {
            _0x6ce862.setTheme(_0x33ec36.id);
            _0x58a5e1();
          },
        },
        icon(_0x33ec36.icon, 14),
        _0x33ec36.label,
      ),
    );
  }
  _0x58a5e1();
  return h(
    'div',
    {
      class: 'wc-menu-appearance',
    },
    h(
      'span',
      {
        class: 'wc-menu-appearance-label',
      },
      icon('palette', 16),
      'Appearance',
    ),
    _0x40305b,
  );
}
export function openSettingsMenu(_0x290721, _0xe1c6d8, _0x73b031) {
  const _0x24fcee = _0x290721.store.setting('agentName') || 'Your workspace';
  const _0x3fd146 = !!_0x290721.store.setting('automationPaused');
  const _0x4a2c6b = _0xe1c6d8.blur.config().enabled;
  const _0x307cb1 = _0x290721.license.isActive();
  const _0x1d5c75 = {
    label: 'License',
    icon: 'badge-check',
    meta: _0x307cb1
      ? 'Active'
      : _0x290721.license.snapshot().status === 'checking'
        ? 'Checking'
        : 'Not applied',
    onClick: () => openLicenseDialog(_0x290721, _0xe1c6d8),
  };
  const _0x4e5049 = {
    header: themeSwitcher(_0x290721, _0xe1c6d8),
  };
  const _0x3d3f31 = {
    label: 'About ' + brand(),
    icon: 'info',
    meta: 'v' + appVersion(),
    onClick: () => openAboutDialog(_0x290721, _0xe1c6d8),
  };
  if (!_0x307cb1) {
    _0x4dfce1.openMenu(
      _0x73b031,
      [
        _0x1d5c75,
        {
          divider: true,
        },
        _0x4e5049,
        {
          divider: true,
        },
        _0x3d3f31,
      ],
      {
        width: 300,
      },
    );
    return;
  }
  const _0x4fff9a = h(
    'div',
    {
      class: 'wc-menu-head',
    },
    _0x4dfce1.avatar(_0x24fcee, 38),
    h(
      'div',
      {
        class: 'wc-menu-head-text',
      },
      h('strong', null, _0x24fcee),
      h('span', null, _0x290721.store.setting('deviceName') || 'This browser'),
    ),
    _0x4dfce1.chip(_0x3fd146 ? 'Paused' : 'Running', _0x3fd146 ? 'warn' : 'ok'),
  );
  _0x4dfce1.openMenu(
    _0x73b031,
    [
      {
        header: _0x4fff9a,
      },
      {
        divider: true,
      },
      {
        label: _0x3fd146 ? 'Resume all automations' : 'Pause all automations',
        icon: _0x3fd146 ? 'play' : 'pause',
        onClick: async () => {
          await _0x290721.store.setSetting('automationPaused', !_0x3fd146);
          _0x4dfce1.toast(
            !_0x3fd146
              ? 'All automations are paused.'
              : 'Automations are running again.',
            'info',
          );
        },
      },
      {
        label: _0x4a2c6b ? 'Turn blur off' : 'Turn blur on',
        icon: 'eye-off',
        onClick: async () => {
          const _0x55962c = await _0xe1c6d8.blur.toggle();
          _0x4dfce1.toast(_0x55962c ? 'Blur is on.' : 'Blur is off.', 'info');
        },
      },
      _0x1d5c75,
      {
        label: 'Module settings',
        icon: 'settings',
        onClick: () => _0xe1c6d8.openPanel('settings'),
      },
      {
        label: 'AI Assistant settings',
        icon: 'sparkles',
        onClick: () => _0xe1c6d8.openPanel('ai'),
      },
      {
        label: 'Backup and restore',
        icon: 'file-spreadsheet',
        onClick: () => _0xe1c6d8.openPanel('import-export'),
      },
      {
        divider: true,
      },
      _0x4e5049,
      {
        divider: true,
      },
      _0x3d3f31,
    ],
    {
      width: 300,
    },
  );
}
