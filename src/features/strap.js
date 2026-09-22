import { h, icon, clear } from '../ui/dom.js';
import * as _0x9febf7 from '../ui/kit.js';
import { sendCanned } from './canned.js';
import { STRAP_ACTIONS, STRAP_LANGUAGES } from '../core/ai.js';
const COMPOSER_SELECTORS = [
  'footer div[contenteditable="true"][role="textbox"]',
  'footer div[contenteditable="true"]',
];
export function installStrap(_0x2970c5, _0x48baf2) {
  const _0x32866a = _0x48baf2.elements.strap;
  const _0xeeeb4a = h('div', {
    class: 'wc-strap',
    hidden: true,
  });
  const _0x23a3d4 = h('div', {
    class: 'wc-slash',
    hidden: true,
    role: 'listbox',
  });
  _0x32866a.appendChild(_0xeeeb4a);
  _0x32866a.appendChild(_0x23a3d4);
  const _0x351837 = {
    composer: null,
    aiOpen: false,
    lang: 'English',
    busy: false,
    matches: [],
    index: 0,
    lastKey: '',
  };
  const _0x58a1f5 = () => {
    for (const _0xd59716 of COMPOSER_SELECTORS) {
      const _0x224318 = document.querySelector(_0xd59716);
      if (_0x224318) {
        return _0x224318;
      }
    }
    return null;
  };
  const _0xfa925a = () =>
    (_0x2970c5.wa.state.activeChat && _0x2970c5.wa.state.activeChat.id) || null;
  const _0x40da94 = () =>
    (_0x351837.composer ? _0x351837.composer.innerText || '' : '')
      .replace(/[​﻿]/g, '')
      .replace(/\n+$/, '');
  const _0x49e33a = () =>
    _0x2970c5.store
      .all('quickReplies')
      .filter((_0x351f1f) => _0x351f1f.pinned && _0x351f1f.enabled !== false);
  const _0xfcb1f4 = () =>
    _0x351837.composer
      ? _0x351837.composer.closest('footer') || _0x351837.composer
      : null;
  const _0x541809 = ['pane', 'page', 'above'];
  const _0x2956ad = {
    mode: 'pane',
    px: 0,
    pagePx: 0,
    misses: 0,
    main: null,
    prev: null,
  };
  function _0x344dc2() {
    const _0x430518 = _0x2956ad.main;
    if (!_0x430518) {
      return;
    }
    const _0x10fe16 = (_0x56fe93, _0x5cfd87) =>
      _0x5cfd87
        ? _0x430518.style.setProperty(_0x56fe93, _0x5cfd87)
        : _0x430518.style.removeProperty(_0x56fe93);
    _0x10fe16('padding-bottom', _0x2956ad.prev.padding);
    _0x10fe16('box-sizing', _0x2956ad.prev.box);
    _0x2956ad.main = null;
    _0x2956ad.prev = null;
  }
  function _0x156500() {
    _0x344dc2();
    if (_0x2956ad.pagePx) {
      _0x2956ad.pagePx = 0;
      _0x48baf2.reserveBottom(0);
    }
    _0x2956ad.px = 0;
    _0x2956ad.misses = 0;
  }
  function _0x20c5fd(_0x1b3083) {
    if (_0x2956ad.mode === 'pane') {
      if (_0x2956ad.pagePx) {
        _0x2956ad.pagePx = 0;
        _0x48baf2.reserveBottom(0);
      }
      const _0x368fdd = document.getElementById('main');
      if (!_0x368fdd) {
        return;
      }
      if (_0x2956ad.main !== _0x368fdd) {
        _0x344dc2();
        _0x2956ad.main = _0x368fdd;
        _0x2956ad.prev = {
          padding: _0x368fdd.style.getPropertyValue('padding-bottom'),
          box: _0x368fdd.style.getPropertyValue('box-sizing'),
        };
      }
      if (
        _0x368fdd.style.getPropertyValue('padding-bottom') !==
        _0x1b3083 + 'px'
      ) {
        _0x368fdd.style.setProperty(
          'padding-bottom',
          _0x1b3083 + 'px',
          'important',
        );
      }
      if (_0x368fdd.style.getPropertyValue('box-sizing') !== 'border-box') {
        _0x368fdd.style.setProperty('box-sizing', 'border-box', 'important');
      }
    } else if (_0x2956ad.mode === 'page') {
      _0x344dc2();
      if (_0x2956ad.pagePx !== _0x1b3083) {
        _0x2956ad.pagePx = _0x1b3083;
        _0x48baf2.reserveBottom(_0x1b3083);
      }
    } else {
      _0x344dc2();
      if (_0x2956ad.pagePx) {
        _0x2956ad.pagePx = 0;
        _0x48baf2.reserveBottom(0);
      }
    }
    _0x2956ad.px = _0x1b3083;
  }
  function _0x3a4e5f() {
    const _0x2e4dd7 = _0xfcb1f4();
    const _0x33f374 = _0x2e4dd7 ? _0x2e4dd7.getBoundingClientRect() : null;
    if (!_0x33f374 || !_0x33f374.width) {
      return false;
    }
    _0xeeeb4a.style.left = Math.max(0, _0x33f374.left + 8) + 'px';
    _0xeeeb4a.style.bottom =
      (_0x2956ad.mode === 'above'
        ? Math.round(window.innerHeight - _0x33f374.top + 8)
        : 6) + 'px';
    _0x23a3d4.style.left = Math.max(0, _0x33f374.left + 8) + 'px';
    _0x23a3d4.style.bottom =
      Math.round(window.innerHeight - _0x33f374.top + 8) + 'px';
    _0xeeeb4a.style.maxWidth = Math.max(240, _0x33f374.width - 16) + 'px';
    _0x23a3d4.style.width =
      Math.min(380, Math.max(260, _0x33f374.width - 16)) + 'px';
    return true;
  }
  function _0x379a46() {
    const _0x36646a = _0xfcb1f4();
    if (!_0x36646a) {
      return false;
    }
    const _0x3619d9 = _0x36646a.getBoundingClientRect();
    const _0x2b5b99 = _0xeeeb4a.getBoundingClientRect();
    return (
      _0x3619d9.bottom > _0x2b5b99.top + 2 ||
      _0x2b5b99.bottom > window.innerHeight + 1
    );
  }
  function _0x175ee3() {
    if (_0xeeeb4a.hidden) {
      return;
    }
    const _0x4d6fd7 = Math.round(_0xeeeb4a.offsetHeight) + 12;
    _0x20c5fd(_0x4d6fd7);
    _0x3a4e5f();
    if (_0x2956ad.mode === 'above') {
      return;
    }
    if (_0x379a46()) {
      if (++_0x2956ad.misses >= 2) {
        _0x2956ad.mode = _0x541809[_0x541809.indexOf(_0x2956ad.mode) + 1];
        _0x2956ad.misses = 0;
        _0x20c5fd(_0x4d6fd7);
        _0x3a4e5f();
      }
    } else {
      _0x2956ad.misses = 0;
    }
  }
  async function _0x2758e2(_0x41a35a) {
    const _0x2c2484 = _0xfa925a();
    const _0x302345 = _0x40da94();
    if (!_0x2c2484 || _0x351837.busy) {
      return;
    }
    if (!_0x302345.trim()) {
      _0x9febf7.toast('Type your message first, then pick an action.', 'info');
      return;
    }
    if (!_0x2970c5.ai.isConfigured()) {
      _0x9febf7.toast('Add your AI key first.', 'info', {
        action: {
          label: 'Open AI settings',
          onClick: () => _0x48baf2.openPanel('ai'),
        },
      });
      return;
    }
    _0x351837.busy = true;
    _0x25778d();
    try {
      const _0x5f46fd = await _0x2970c5.ai.rewrite(
        _0x41a35a,
        _0x302345,
        _0x351837.lang,
      );
      await _0x2970c5.wa.setInput(_0x5f46fd, _0x2c2484);
    } catch (_0x3e859f) {
      if (_0x3e859f && _0x3e859f.name === 'PermissionError') {
        _0x9febf7.toast(_0x3e859f.message, 'error', {
          action: {
            label: 'Allow',
            onClick: () => _0x2970c5.http.grant(_0x3e859f.origin),
          },
        });
      } else {
        _0x9febf7.toast(
          _0x3e859f.message || 'Could not get an AI answer.',
          'error',
        );
      }
    } finally {
      _0x351837.busy = false;
      _0x25778d();
    }
  }
  function _0x25778d() {
    clear(_0xeeeb4a);
    const _0x4f8da8 = _0x49e33a();
    _0xeeeb4a.appendChild(
      h(
        'div',
        {
          class: 'wc-strap-row',
        },
        h(
          'span',
          {
            class: 'wc-strap-label',
          },
          icon('message-square-text', 14),
        ),
        h(
          'div',
          {
            class: 'wc-strap-chips',
          },
          _0x4f8da8.length
            ? _0x4f8da8.map((_0xe6b1e5) =>
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'wc-strapchip',
                    title:
                      'Send "' +
                      _0xe6b1e5.title +
                      '" (Shift-click to insert into the message box)',
                    onClick: (_0x28beed) =>
                      sendCanned(_0x2970c5, _0xe6b1e5, _0xfa925a(), {
                        insertOnly: _0x28beed.shiftKey,
                      }).catch((_0x5c6bd6) =>
                        _0x9febf7.toast(_0x5c6bd6.message, 'error'),
                      ),
                  },
                  _0xe6b1e5.title,
                ),
              )
            : h(
                'span',
                {
                  class: 'wc-muted',
                },
                'Pin canned responses to show them here',
              ),
        ),
        _0x9febf7.iconButton('plus', 'Add a canned response', () =>
          _0x48baf2.openPanel('canned', {
            create: true,
          }),
        ),
        _0x9febf7.iconButton('list', 'Open canned responses', () =>
          _0x48baf2.openPanel('canned'),
        ),
        _0x2970c5.store.setting('aiStrapEnabled') !== false
          ? h(
              'button',
              {
                type: 'button',
                class: 'wc-strapbtn' + (_0x351837.aiOpen ? ' is-on' : ''),
                title: 'AI writing help',
                onClick: () => {
                  _0x351837.aiOpen = !_0x351837.aiOpen;
                  _0x25778d();
                },
              },
              icon('sparkles', 14),
              'AI',
            )
          : null,
      ),
    );
    if (
      _0x351837.aiOpen &&
      _0x2970c5.store.setting('aiStrapEnabled') !== false
    ) {
      _0xeeeb4a.appendChild(
        h(
          'div',
          {
            class: 'wc-strap-row wc-strap-ai',
          },
          STRAP_ACTIONS.map((_0x4de927) =>
            h(
              'button',
              {
                type: 'button',
                class: 'wc-strapchip',
                disabled: _0x351837.busy,
                onClick: () => _0x2758e2(_0x4de927.id),
              },
              icon(_0x4de927.icon, 13),
              _0x4de927.label,
            ),
          ),
          _0x9febf7.select(
            STRAP_LANGUAGES,
            _0x351837.lang,
            (_0x1c83a5) => {
              _0x351837.lang = _0x1c83a5;
            },
            {
              label: 'Translate language',
            },
          ),
          _0x351837.busy
            ? h(
                'span',
                {
                  class: 'wc-muted',
                },
                'Thinking...',
              )
            : null,
        ),
      );
    }
    _0x175ee3();
  }
  function _0x1ff70b() {
    _0x23a3d4.hidden = true;
    _0x351837.matches = [];
  }
  function _0x44be1d(_0x188540) {
    const _0x2f8504 = _0x188540.toLowerCase();
    const _0x61e1ff = _0x2970c5.store
      .all('quickReplies')
      .filter((_0x30d380) => _0x30d380.enabled !== false);
    const _0x5036f9 = _0x61e1ff
      .map((_0x288ba5) => {
        const _0x93fe65 = String(_0x288ba5.shortcut || '').toLowerCase();
        const _0xd0cd37 = String(_0x288ba5.title || '').toLowerCase();
        let _0x2aaab3 = -1;
        if (!_0x2f8504) {
          _0x2aaab3 = _0x93fe65 ? 2 : 1;
        } else if (_0x93fe65.startsWith(_0x2f8504)) {
          _0x2aaab3 = 4;
        } else if (_0xd0cd37.startsWith(_0x2f8504)) {
          _0x2aaab3 = 3;
        } else if (
          _0x93fe65.includes(_0x2f8504) ||
          _0xd0cd37.includes(_0x2f8504)
        ) {
          _0x2aaab3 = 2;
        }
        return {
          r: _0x288ba5,
          score: _0x2aaab3,
        };
      })
      .filter((_0x3a062) => _0x3a062.score >= 0)
      .sort((_0x474eed, _0x698539) => _0x698539.score - _0x474eed.score)
      .slice(0, 8)
      .map((_0x5ebed1) => _0x5ebed1.r);
    _0x351837.matches = _0x5036f9;
    if (_0x351837.index >= _0x5036f9.length) {
      _0x351837.index = 0;
    }
    clear(_0x23a3d4);
    if (!_0x5036f9.length) {
      _0x23a3d4.appendChild(
        h(
          'div',
          {
            class: 'wc-slash-empty',
          },
          'No canned response found',
        ),
      );
      _0x23a3d4.hidden = false;
      _0x3a4e5f();
      return;
    }
    _0x5036f9.forEach((_0xb310cc, _0x40c230) =>
      _0x23a3d4.appendChild(
        h(
          'button',
          {
            type: 'button',
            role: 'option',
            class:
              'wc-slash-item' + (_0x40c230 === _0x351837.index ? ' is-on' : ''),
            onMousedown: (_0x58dff0) => {
              _0x58dff0.preventDefault();
              _0x1b55b4(_0xb310cc);
            },
          },
          h(
            'strong',
            null,
            _0xb310cc.shortcut ? '/' + _0xb310cc.shortcut : _0xb310cc.title,
          ),
          h('span', null, _0xb310cc.title),
          _0xb310cc.messages.length > 1
            ? _0x9febf7.chip('Funnel', 'accent')
            : null,
        ),
      ),
    );
    _0x23a3d4.hidden = false;
    _0x3a4e5f();
  }
  async function _0x1b55b4(_0x37e6c8) {
    const _0x5893c1 = _0xfa925a();
    _0x1ff70b();
    if (!_0x5893c1) {
      return;
    }
    try {
      await _0x2970c5.wa.setInput('', _0x5893c1);
      await sendCanned(_0x2970c5, _0x37e6c8, _0x5893c1);
    } catch (_0x464a75) {
      _0x9febf7.toast(_0x464a75.message, 'error');
    }
  }
  function _0x22be77(_0x4aeb54) {
    if (
      !_0x351837.composer ||
      (_0x4aeb54.target !== _0x351837.composer &&
        !_0x351837.composer.contains(_0x4aeb54.target))
    ) {
      return;
    }
    const _0x459f96 = /^\/([^\s]*)$/.exec(_0x40da94());
    if (!_0x459f96 || _0x2970c5.store.setting('strapEnabled') === false) {
      _0x1ff70b();
      return;
    }
    _0x351837.index = 0;
    _0x44be1d(_0x459f96[1]);
  }
  function _0x54566b(_0x3b027b) {
    if (_0x23a3d4.hidden || !_0x351837.matches.length) {
      return;
    }
    if (
      !_0x351837.composer ||
      (_0x3b027b.target !== _0x351837.composer &&
        !_0x351837.composer.contains(_0x3b027b.target))
    ) {
      return;
    }
    const _0x5942a8 = () => {
      _0x3b027b.preventDefault();
      _0x3b027b.stopPropagation();
      _0x3b027b.stopImmediatePropagation();
    };
    if (_0x3b027b.key === 'ArrowDown') {
      _0x5942a8();
      _0x351837.index = (_0x351837.index + 1) % _0x351837.matches.length;
      _0x44be1d(_0x40da94().slice(1));
    } else if (_0x3b027b.key === 'ArrowUp') {
      _0x5942a8();
      _0x351837.index =
        (_0x351837.index - 1 + _0x351837.matches.length) %
        _0x351837.matches.length;
      _0x44be1d(_0x40da94().slice(1));
    } else if (_0x3b027b.key === 'Enter' || _0x3b027b.key === 'Tab') {
      _0x5942a8();
      _0x1b55b4(_0x351837.matches[_0x351837.index]);
    } else if (_0x3b027b.key === 'Escape') {
      _0x5942a8();
      _0x1ff70b();
    }
  }
  document.addEventListener('input', _0x22be77, true);
  document.addEventListener('keydown', _0x54566b, true);
  function _0x12f275() {
    _0x351837.composer = _0x58a1f5();
    const _0x48fa42 =
      !!_0x351837.composer &&
      !!_0xfa925a() &&
      !_0x48baf2.panelOpen() &&
      _0x2970c5.store.setting('strapEnabled') !== false &&
      _0x2970c5.license.isActive();
    if (!_0x48fa42) {
      _0xeeeb4a.hidden = true;
      _0x1ff70b();
      _0x156500();
      return;
    }
    const _0x38cc86 =
      _0x49e33a()
        .map((_0x41e356) => _0x41e356.id + _0x41e356.title)
        .join('|') +
      '|' +
      _0x351837.aiOpen +
      '|' +
      _0x351837.busy +
      '|' +
      _0x2970c5.store.setting('aiStrapEnabled');
    if (_0x38cc86 !== _0x351837.lastKey) {
      _0x351837.lastKey = _0x38cc86;
      _0x25778d();
    }
    _0xeeeb4a.hidden = false;
    _0x175ee3();
  }
  const _0x5b2aec = setInterval(_0x12f275, 500);
  window.addEventListener('resize', _0x175ee3);
  _0x2970c5.store.on('quickReplies', () => {
    _0x351837.lastKey = '';
  });
  _0x2970c5.wa.on('active_chat', () => {
    _0x1ff70b();
    _0x12f275();
  });
  _0x12f275();
  return {
    tick: _0x12f275,
    destroy() {
      clearInterval(_0x5b2aec);
      document.removeEventListener('input', _0x22be77, true);
      document.removeEventListener('keydown', _0x54566b, true);
      _0xeeeb4a.remove();
      _0x23a3d4.remove();
      _0x156500();
    },
    mode: () => _0x2956ad.mode,
  };
}
