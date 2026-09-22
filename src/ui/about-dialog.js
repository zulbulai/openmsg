import { h, icon, logo, clear } from './dom.js';
import * as _0x1c9736 from './kit.js';
import { brand } from '../core/brand.js';
import { BUILD_PROVIDER } from '../core/license-config.js';
const text = (_0x3e0764, _0x5d5332 = 300) =>
  typeof _0x3e0764 === 'string' ? _0x3e0764.trim().slice(0, _0x5d5332) : '';
export function appVersion() {
  try {
    return chrome.runtime.getManifest().version || '0.2.0';
  } catch (_0x51d137) {
    return '0.2.0';
  }
}
export function webAddress(_0x2dcb40) {
  try {
    const _0x2d3867 = new URL(text(_0x2dcb40, 190));
    if (_0x2d3867.protocol === 'https:' || _0x2d3867.protocol === 'http:') {
      return _0x2d3867;
    } else {
      return null;
    }
  } catch (_0x345132) {
    return null;
  }
}
const emailAddress = (_0x28fada) => {
  const _0x357cee = text(_0x28fada, 190);
  if (/^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(_0x357cee)) {
    return _0x357cee;
  } else {
    return '';
  }
};
const phoneLink = (_0x42176d) => {
  const _0x14037e = text(_0x42176d, 40);
  const _0x2d141d = _0x14037e.replace(/\D+/g, '');
  if (_0x2d141d.length >= 5) {
    return 'tel:' + (_0x14037e.startsWith('+') ? '+' : '') + _0x2d141d;
  } else {
    return '';
  }
};
export function providerView(_0xdad2d6) {
  if (!_0xdad2d6 || typeof _0xdad2d6 !== 'object') {
    return null;
  }
  const _0x2251c0 = text(_0xdad2d6.name, 120);
  const _0x1e132a = text(_0xdad2d6.legal_name, 160);
  const _0x44d8a8 = [];
  const _0x42521e = emailAddress(_0xdad2d6.support_email);
  const _0x3304ad = emailAddress(_0xdad2d6.email);
  if (_0x42521e) {
    _0x44d8a8.push({
      icon: 'life-buoy',
      label: 'Support',
      text: _0x42521e,
      href: 'mailto:' + _0x42521e,
    });
  }
  if (_0x3304ad && _0x3304ad !== _0x42521e) {
    _0x44d8a8.push({
      icon: 'mail',
      label: 'Email',
      text: _0x3304ad,
      href: 'mailto:' + _0x3304ad,
    });
  }
  const _0xf1b2d3 = text(_0xdad2d6.phone, 40);
  if (_0xf1b2d3) {
    _0x44d8a8.push({
      icon: 'phone',
      label: 'Phone',
      text: _0xf1b2d3,
      href: phoneLink(_0xf1b2d3),
    });
  }
  const _0x424ae0 = webAddress(_0xdad2d6.website);
  if (_0x424ae0) {
    _0x44d8a8.push({
      icon: 'globe',
      label: 'Website',
      text:
        _0x424ae0.host +
        (_0x424ae0.pathname.length > 1
          ? _0x424ae0.pathname.replace(/\/$/, '')
          : ''),
      href: _0x424ae0.href,
    });
  }
  const _0x4007ba = [
    text(_0xdad2d6.address, 300),
    text(_0xdad2d6.city, 80),
    text(_0xdad2d6.country, 80),
  ]
    .filter(Boolean)
    .join(', ');
  if (_0x4007ba) {
    _0x44d8a8.push({
      icon: 'map-pin',
      label: 'Address',
      text: _0x4007ba,
      href: '',
    });
  }
  const _0x18d671 = text(_0xdad2d6.tax_id, 60);
  if (_0x18d671) {
    _0x44d8a8.push({
      icon: 'hash',
      label: 'Tax or registration number',
      text: _0x18d671,
      href: '',
    });
  }
  if (!_0x2251c0 && !_0x1e132a && !_0x44d8a8.length) {
    return null;
  }
  return {
    name: _0x2251c0 || _0x1e132a,
    legalName:
      _0x2251c0 && _0x1e132a && _0x1e132a !== _0x2251c0 ? _0x1e132a : '',
    rows: _0x44d8a8,
  };
}
export function currentProvider(_0x4e7ee0, _0x4b7be1 = BUILD_PROVIDER) {
  const _0x474880 = _0x4e7ee0.license.snapshot();
  const _0x253a4b =
    _0x474880.active && _0x474880.license
      ? providerView(_0x474880.license.provider)
      : null;
  return _0x253a4b || providerView(_0x4b7be1);
}
export function contactRows(_0x457359) {
  if (_0x457359) {
    return _0x457359.rows.filter((_0x4b4467) => _0x4b4467.href);
  } else {
    return [];
  }
}
export function contactBlock(_0x59957e) {
  const _0x140bac = contactRows(_0x59957e);
  if (!_0x59957e || !_0x140bac.length) {
    return null;
  }
  return h(
    'div',
    {
      class: 'wc-contact',
    },
    h(
      'span',
      {
        class: 'wc-contact-title',
      },
      _0x59957e.name
        ? 'Need a license? Contact ' + _0x59957e.name
        : 'Need a license? Get in touch.',
    ),
    h(
      'div',
      {
        class: 'wc-contact-links',
      },
      _0x140bac.map((_0x231a6b) =>
        h(
          'a',
          {
            href: _0x231a6b.href,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: _0x231a6b.label,
          },
          icon(_0x231a6b.icon, 13),
          _0x231a6b.text,
        ),
      ),
    ),
  );
}
function providerCard(_0x34a4d4) {
  const _0xd60964 = _0x34a4d4.rows.map((_0x11b7d3) =>
    h(
      'li',
      {
        class: 'wc-about-row',
      },
      icon(_0x11b7d3.icon, 15),
      h(
        'div',
        {
          class: 'wc-about-rowtext',
        },
        h('small', null, _0x11b7d3.label),
        _0x11b7d3.href
          ? h(
              'a',
              {
                href: _0x11b7d3.href,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              _0x11b7d3.text,
            )
          : h('span', null, _0x11b7d3.text),
      ),
    ),
  );
  return h(
    'section',
    {
      class: 'wc-about-provider',
      'aria-label': 'Provided by',
    },
    h(
      'span',
      {
        class: 'wc-about-label',
      },
      'Provided by',
    ),
    h(
      'div',
      {
        class: 'wc-about-name',
      },
      h('strong', null, _0x34a4d4.name),
      _0x34a4d4.legalName ? h('span', null, _0x34a4d4.legalName) : null,
    ),
    _0xd60964.length
      ? h(
          'ul',
          {
            class: 'wc-about-rows',
          },
          _0xd60964,
        )
      : null,
  );
}
export function openAboutDialog(_0x30f940, _0x56adb2) {
  if (_0x56adb2 && _0x56adb2.__aboutModal) {
    return _0x56adb2.__aboutModal;
  }
  const _0x54ccb4 = h('div', {
    class: 'wc-about-slot',
  });
  function _0x2cd105() {
    clear(_0x54ccb4);
    const _0x11b84f = currentProvider(_0x30f940);
    if (_0x11b84f) {
      _0x54ccb4.appendChild(providerCard(_0x11b84f));
    }
  }
  const _0x643dae = h(
    'div',
    {
      class: 'wc-about',
    },
    h(
      'div',
      {
        class: 'wc-about-head',
      },
      logo(40),
      h(
        'div',
        {
          class: 'wc-about-headtext',
        },
        h('strong', null, brand()),
        h('span', null, 'Version ' + appVersion()),
      ),
    ),
    h(
      'p',
      {
        class: 'wc-about-text',
      },
      'A CRM inside WhatsApp Web. Your data stays in this browser.',
    ),
    _0x54ccb4,
  );
  const _0x1ffb22 = _0x30f940.license.on(_0x2cd105);
  const _0x87a6b = _0x1c9736.openModal({
    title: 'About ' + brand(),
    width: 440,
    body: _0x643dae,
    footer: h(
      'div',
      {
        class: 'wc-about-foot',
      },
      _0x1c9736.button('Close', {
        variant: 'dark',
        onClick: () => _0x87a6b.close(),
      }),
    ),
    onClose: () => {
      _0x1ffb22();
      if (_0x56adb2) {
        _0x56adb2.__aboutModal = null;
      }
    },
  });
  if (_0x56adb2) {
    _0x56adb2.__aboutModal = _0x87a6b;
  }
  _0x2cd105();
  return _0x87a6b;
}
