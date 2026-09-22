import { h, icon, clear, svgEl } from '../ui/dom.js';
import * as _0x636070 from '../ui/kit.js';
import {
  NODE_TYPES,
  PALETTE_GROUPS,
  handlesOf,
  newNode,
  validateGraph,
  createSimulator,
  choiceOptions,
  OPERATORS,
} from '../core/chatbot.js';
import { createStore, memoryBackend } from '../core/store.js';
import { createCrm } from '../core/crm.js';
import { uid, debounce, clone, truncate } from '../core/util.js';
import {
  nodeInspector,
  flowInspector,
  nodeLabel,
} from './chatbot-inspector.js';
import { openFlowWizard } from './chatbots.js';
const NODE_W = 264;
const GRID = 10;
const snap = (_0x2ababd) => Math.round(_0x2ababd / GRID) * GRID;
function summaryLines(_0x159e52, _0x2f8af2, _0x1c3891, _0x44f6f5) {
  const _0x145540 = _0x1c3891.data || {};
  const _0x30bb5f = (_0xa3b4f9) =>
    h(
      'div',
      {
        class: 'wc-nline',
      },
      _0xa3b4f9,
    );
  switch (_0x1c3891.type) {
    case 'start':
      return [_0x30bb5f('Conversation begins here')];
    case 'text':
      return [
        _0x30bb5f(truncate(_0x145540.text || 'Empty message', 90)),
      ].concat(
        _0x145540.wait
          ? [
              h(
                'div',
                {
                  class: 'wc-nchips',
                },
                _0x636070.chip('Waits for reply', 'accent'),
              ),
            ]
          : [],
      );
    case 'image':
    case 'video':
    case 'audio':
    case 'document':
      return [
        _0x30bb5f(
          (_0x145540.files || []).length
            ? _0x145540.files.length +
                ' file' +
                (_0x145540.files.length === 1 ? '' : 's') +
                ': ' +
                _0x145540.files[0].name
            : 'No file yet',
        ),
      ].concat(
        _0x145540.caption ? [_0x30bb5f(truncate(_0x145540.caption, 60))] : [],
      );
    case 'buttons':
    case 'list':
      return [
        _0x30bb5f(truncate(_0x145540.text || 'Empty message', 80)),
        h(
          'div',
          {
            class: 'wc-nchips',
          },
          choiceOptions(_0x1c3891)
            .slice(0, 4)
            .map((_0x4c2a99) =>
              _0x636070.chip(truncate(_0x4c2a99, 16), 'neutral'),
            ),
        ),
      ];
    case 'condition':
      return (_0x145540.branches || []).map((_0x50c845, _0xf0efa) =>
        _0x30bb5f(
          _0xf0efa +
            1 +
            '. ' +
            _0x50c845.rules
              .map(
                (_0xcdbaaf) =>
                  (_0xcdbaaf.variable || '?') +
                  ' ' +
                  ((
                    OPERATORS.find(
                      (_0x4f730c) => _0x4f730c.id === _0xcdbaaf.operator,
                    ) || {}
                  ).label || _0xcdbaaf.operator) +
                  ' ' +
                  (_0xcdbaaf.value || ''),
              )
              .join(_0x50c845.join === 'or' ? ' or ' : ' and '),
        ),
      );
    case 'setVariable':
      return (_0x145540.entries || []).map((_0x19d4bb) =>
        _0x30bb5f(
          (_0x19d4bb.name || '?') + ' = ' + (_0x19d4bb.value || 'empty'),
        ),
      );
    case 'delay':
      return [_0x30bb5f('Wait ' + _0x145540.value + ' ' + _0x145540.unit)];
    case 'jump': {
      const _0x25a86e = _0x2f8af2.nodes.find(
        (_0x1e2c9b) => _0x1e2c9b.id === _0x145540.targetId,
      );
      return [
        _0x30bb5f(
          _0x25a86e ? 'Go to: ' + nodeLabel(_0x25a86e) : 'Pick a block',
        ),
      ];
    }
    case 'startNewFlow': {
      const _0x5e9de9 = _0x44f6f5.find(
        (_0x43b0e1) => _0x43b0e1.id === _0x145540.flowId,
      );
      return [
        _0x30bb5f(
          _0x5e9de9 ? 'Hand over to: ' + _0x5e9de9.name : 'Pick a chatbot',
        ),
      ];
    }
    case 'tag':
      return [
        h(
          'div',
          {
            class: 'wc-nchips',
          },
          (_0x145540.add || [])
            .map((_0x23fdd9) => {
              const _0x50d68c = _0x159e52.crm.tagById(_0x23fdd9);
              if (_0x50d68c) {
                return _0x636070.chip('+ ' + _0x50d68c.name, 'accent');
              } else {
                return null;
              }
            })
            .concat(
              (_0x145540.remove || []).map((_0x4797a5) => {
                const _0x7beb16 = _0x159e52.crm.tagById(_0x4797a5);
                if (_0x7beb16) {
                  return _0x636070.chip('- ' + _0x7beb16.name, 'neutral');
                } else {
                  return null;
                }
              }),
            ),
        ),
      ];
    case 'action':
      return [
        _0x30bb5f(
          Object.keys(_0x145540.actions || {}).filter((_0x15f0a9) => {
            const _0x2d8c2e = _0x145540.actions[_0x15f0a9];
            if (Array.isArray(_0x2d8c2e)) {
              return _0x2d8c2e.length;
            } else {
              return !!_0x2d8c2e;
            }
          }).length
            ? 'Runs actions on the chat'
            : 'No actions yet',
        ),
      ];
    case 'webhook':
      return [
        _0x30bb5f(
          _0x145540.method +
            ' ' +
            truncate(_0x145540.url || 'no address yet', 46),
        ),
      ];
    case 'handoff':
      return [
        _0x30bb5f(
          truncate(
            _0x145540.customerMessage || 'Passes the chat to a person',
            80,
          ),
        ),
      ];
    case 'end':
      return [
        _0x30bb5f(
          _0x145540.message
            ? truncate(_0x145540.message, 80)
            : 'Ends the conversation',
        ),
      ];
    default:
      return [];
  }
}
export function renderBuilder(_0xaff779, _0x2ff6a2, { onBack: _0x407211 }) {
  const { app: _0x2668f2, shell: _0x2fc295 } = _0xaff779;
  const _0x59e90d = _0x2668f2.store.get('chatbots', _0x2ff6a2);
  if (!_0x59e90d) {
    _0x407211();
    return h('div');
  }
  const _0x11e175 = _0x59e90d.draft;
  const _0x357010 = {
    x: 40,
    y: 20,
    z: 1,
  };
  const _0x4838f9 = {
    node: null,
    edge: null,
  };
  let _0xc7385b = [];
  let _0x39e426 = true;
  let _0x115b40 = false;
  const _0x1c512d = {
    stack: [JSON.stringify(_0x11e175)],
    at: 0,
  };
  const _0x56398f = h('div', {
    class: 'wc-builder',
    tabindex: '-1',
  });
  const _0x2c27c2 = new Map();
  const _0x549f89 = h('div', {
    class: 'wc-world',
  });
  const _0x44b054 = svgEl('svg', {
    class: 'wc-edges',
    width: 1,
    height: 1,
  });
  _0x44b054.setAttribute('class', 'wc-edges');
  const _0x5181bf = h(
    'div',
    {
      class: 'wc-canvas',
    },
    _0x549f89,
  );
  _0x549f89.appendChild(_0x44b054);
  const _0x4be31b = h('div', {
    class: 'wc-minimap',
    title: 'Flow overview. Click to move around.',
  });
  const _0x30d2a2 = h(
    'span',
    {
      class: 'wc-saving',
    },
    'Saved',
  );
  const _0x4f8186 = h('aside', {
    class: 'wc-rightpane',
  });
  const _0xdc02a5 = h('div', {
    class: 'wc-canvas-tools',
  });
  _0x5181bf.appendChild(_0xdc02a5);
  _0x5181bf.appendChild(_0x4be31b);
  const _0x5d0cd9 = debounce(async () => {
    await _0x2668f2.store.patch('chatbots', _0x59e90d.id, {
      draft: _0x11e175,
    });
    _0x30d2a2.textContent = 'Saved';
    _0x529cce();
  }, 500);
  function _0x3962b4(_0x388b4a) {
    _0x30d2a2.textContent = 'Saving...';
    _0x5d0cd9();
    if (_0x388b4a) {
      _0x1e870e();
    } else {
      _0x2da5a7();
    }
    _0x26355f();
  }
  function _0x1e870e() {
    const _0x25cda0 = JSON.stringify(_0x11e175);
    if (_0x25cda0 === _0x1c512d.stack[_0x1c512d.at]) {
      return;
    }
    _0x1c512d.stack = _0x1c512d.stack.slice(0, _0x1c512d.at + 1);
    _0x1c512d.stack.push(_0x25cda0);
    if (_0x1c512d.stack.length > 80) {
      _0x1c512d.stack.shift();
    }
    _0x1c512d.at = _0x1c512d.stack.length - 1;
    _0x536b73();
  }
  const _0x2da5a7 = debounce(_0x1e870e, 500);
  function _0x43d0e5(_0xd00abb) {
    const _0x1ee155 = JSON.parse(_0xd00abb);
    _0x11e175.nodes = _0x1ee155.nodes;
    _0x11e175.edges = _0x1ee155.edges;
    _0x11e175.settings = _0x1ee155.settings;
    _0x4838f9.node = _0x4838f9.edge = null;
    _0x4c12ef();
    _0x5d0cd9();
    _0x26355f();
    _0x536b73();
  }
  const _0x29fb94 = () => {
    _0x1e870e();
    if (_0x1c512d.at > 0) {
      _0x1c512d.at--;
      _0x43d0e5(_0x1c512d.stack[_0x1c512d.at]);
    }
  };
  const _0x408d90 = () => {
    if (_0x1c512d.at < _0x1c512d.stack.length - 1) {
      _0x1c512d.at++;
      _0x43d0e5(_0x1c512d.stack[_0x1c512d.at]);
    }
  };
  function _0x26355f() {
    _0xc7385b = validateGraph(_0x11e175);
    for (const _0xf0634 of _0x11e175.nodes) {
      const _0x12abbb = _0x2c27c2.get(_0xf0634.id);
      if (_0x12abbb) {
        const _0x309334 = _0xc7385b.filter(
          (_0x449dd9) => _0x449dd9.nodeId === _0xf0634.id,
        );
        _0x12abbb.classList.toggle('has-problem', _0x309334.length > 0);
        const _0x259107 = _0x12abbb.querySelector('.wc-nproblem');
        if (_0x259107) {
          _0x259107.title = _0x309334
            .map((_0xc794c5) => _0xc794c5.message)
            .join('\n');
        }
      }
    }
    _0x529cce();
  }
  const _0x5c7f0b = () =>
    _0x2668f2.store
      .all('chatbots')
      .filter((_0x223fa9) => _0x223fa9.id !== _0x59e90d.id);
  function _0x46e70b(_0x252cef) {
    const _0x590544 = NODE_TYPES[_0x252cef.type];
    const _0x2c6a9c = handlesOf(_0x252cef);
    const _0x4ea93d = h(
      'div',
      {
        class:
          'wc-node wc-ntype-' +
          _0x252cef.type +
          (_0x4838f9.node === _0x252cef.id ? ' is-selected' : ''),
        dataset: {
          node: _0x252cef.id,
        },
        style: {
          left: _0x252cef.x + 'px',
          top: _0x252cef.y + 'px',
          width: NODE_W + 'px',
          '--nc': _0x590544.color,
        },
      },
      _0x252cef.type === 'start'
        ? null
        : h('span', {
            class: 'wc-inport',
            title: 'Connect a line here',
          }),
      h(
        'div',
        {
          class: 'wc-nhead',
        },
        h(
          'span',
          {
            class: 'wc-nicon',
          },
          icon(_0x590544.icon, 15),
        ),
        h(
          'span',
          {
            class: 'wc-ntitle',
          },
          nodeLabel(_0x252cef),
        ),
        h(
          'span',
          {
            class: 'wc-nproblem',
            title: '',
          },
          icon('triangle-alert', 14),
        ),
        _0x252cef.type === 'start'
          ? null
          : _0x636070.iconButton('ellipsis', 'Block options', (_0x19530d) => {
              _0x19530d.stopPropagation();
              _0x636070.openMenu(_0x19530d.currentTarget, [
                {
                  label: 'Edit',
                  icon: 'pencil',
                  onClick: () => _0x3a8101(_0x252cef.id),
                },
                {
                  label: 'Duplicate',
                  icon: 'copy',
                  onClick: () => _0xf5156c(_0x252cef.id),
                },
                {
                  divider: true,
                },
                {
                  label: 'Delete',
                  icon: 'trash-2',
                  danger: true,
                  onClick: () => _0xe28bfe(_0x252cef.id),
                },
              ]);
            }),
      ),
      h(
        'div',
        {
          class: 'wc-nbody',
        },
        summaryLines(_0x2668f2, _0x11e175, _0x252cef, _0x5c7f0b()),
      ),
      h(
        'div',
        {
          class: 'wc-nhandles',
        },
        _0x2c6a9c.map((_0x4d5f7d) =>
          h(
            'div',
            {
              class: 'wc-nhandle',
            },
            h('span', null, _0x4d5f7d.label),
            h('button', {
              type: 'button',
              class:
                'wc-port' +
                (_0x11e175.edges.some(
                  (_0x30cde8) =>
                    _0x30cde8.from === _0x252cef.id &&
                    _0x30cde8.handle === _0x4d5f7d.id,
                )
                  ? ' is-linked'
                  : ''),
              dataset: {
                handle: _0x4d5f7d.id,
              },
              title: 'Drag to connect',
              'aria-label': 'Connect ' + _0x4d5f7d.label,
            }),
          ),
        ),
      ),
    );
    return _0x4ea93d;
  }
  function _0x2d10a7(_0x4ed6de) {
    const _0x3b7793 = _0x2c27c2.get(_0x4ed6de.id);
    const _0x45466a = _0x46e70b(_0x4ed6de);
    if (_0x3b7793) {
      _0x3b7793.replaceWith(_0x45466a);
    } else {
      _0x549f89.appendChild(_0x45466a);
    }
    _0x2c27c2.set(_0x4ed6de.id, _0x45466a);
    _0x518770();
    _0x26355f();
    requestAnimationFrame(_0x2188b8);
  }
  function _0x4c12ef() {
    for (const _0x1e9346 of _0x2c27c2.values()) {
      _0x1e9346.remove();
    }
    _0x2c27c2.clear();
    for (const _0x35e522 of _0x11e175.nodes) {
      const _0x222c4d = _0x46e70b(_0x35e522);
      _0x2c27c2.set(_0x35e522.id, _0x222c4d);
      _0x549f89.appendChild(_0x222c4d);
    }
    _0x13f38a();
    _0x518770();
    _0x26355f();
    requestAnimationFrame(() => {
      _0x2188b8();
      _0x19c00d();
    });
    _0x51ba4a();
  }
  function _0x518770() {
    const _0x5b5b3f = _0x11e175.edges.length;
    _0x11e175.edges = _0x11e175.edges.filter((_0x5b2cd5) => {
      const _0x3021df = _0x11e175.nodes.find(
        (_0x2dcaf7) => _0x2dcaf7.id === _0x5b2cd5.from,
      );
      const _0x4414e3 = _0x11e175.nodes.find(
        (_0x229299) => _0x229299.id === _0x5b2cd5.to,
      );
      return (
        _0x3021df &&
        _0x4414e3 &&
        _0x4414e3.type !== 'start' &&
        handlesOf(_0x3021df).some(
          (_0x43eb76) => _0x43eb76.id === _0x5b2cd5.handle,
        )
      );
    });
    return _0x5b5b3f !== _0x11e175.edges.length;
  }
  function _0x3a8101(_0x233f68, _0x46d197) {
    _0x4838f9.node = _0x233f68 || null;
    _0x4838f9.edge = _0x46d197 || null;
    for (const [_0x56a2da, _0x326006] of _0x2c27c2) {
      _0x326006.classList.toggle('is-selected', _0x56a2da === _0x4838f9.node);
    }
    _0x2188b8();
    _0x51ba4a();
    if (_0x233f68) {
      _0x39e426 = true;
      _0x115b40 = false;
      _0x3c8614();
    }
  }
  function _0xa36f4d(_0x5f1689, _0x260fbc, _0x356398, _0x2bb971) {
    const _0x5b0bb7 = newNode(_0x5f1689, snap(_0x260fbc), snap(_0x356398));
    _0x11e175.nodes.push(_0x5b0bb7);
    if (_0x2bb971) {
      _0x1481d6(_0x2bb971.node, _0x2bb971.handle, _0x5b0bb7.id);
    }
    const _0x1b4d2d = _0x46e70b(_0x5b0bb7);
    _0x2c27c2.set(_0x5b0bb7.id, _0x1b4d2d);
    _0x549f89.appendChild(_0x1b4d2d);
    _0x3962b4(true);
    _0x3a8101(_0x5b0bb7.id);
    requestAnimationFrame(() => {
      _0x2188b8();
      _0x19c00d();
    });
    return _0x5b0bb7;
  }
  function _0xf5156c(_0x81f862) {
    const _0x1e81d4 = _0x11e175.nodes.find(
      (_0x5b17de) => _0x5b17de.id === _0x81f862,
    );
    if (!_0x1e81d4 || _0x1e81d4.type === 'start') {
      return;
    }
    const _0x2763d2 = Object.assign(clone(_0x1e81d4), {
      id: uid('n'),
      x: snap(_0x1e81d4.x + 40),
      y: snap(_0x1e81d4.y + 40),
    });
    _0x11e175.nodes.push(_0x2763d2);
    const _0x641ac4 = _0x46e70b(_0x2763d2);
    _0x2c27c2.set(_0x2763d2.id, _0x641ac4);
    _0x549f89.appendChild(_0x641ac4);
    _0x3962b4(true);
    _0x3a8101(_0x2763d2.id);
    requestAnimationFrame(() => {
      _0x2188b8();
      _0x19c00d();
    });
  }
  function _0xe28bfe(_0x471700) {
    const _0x8fe93c = _0x11e175.nodes.find(
      (_0x33a64e) => _0x33a64e.id === _0x471700,
    );
    if (!_0x8fe93c || _0x8fe93c.type === 'start') {
      return;
    }
    _0x11e175.nodes = _0x11e175.nodes.filter(
      (_0x532e68) => _0x532e68.id !== _0x471700,
    );
    _0x11e175.edges = _0x11e175.edges.filter(
      (_0xc7c6f0) => _0xc7c6f0.from !== _0x471700 && _0xc7c6f0.to !== _0x471700,
    );
    const _0x56600c = _0x2c27c2.get(_0x471700);
    if (_0x56600c) {
      _0x56600c.remove();
    }
    _0x2c27c2.delete(_0x471700);
    for (const _0x4934a4 of _0x11e175.nodes) {
      if (_0x4934a4.type === 'jump' && _0x4934a4.data.targetId === _0x471700) {
        _0x4934a4.data.targetId = '';
      }
    }
    for (const _0x1f8765 of Object.values(
      _0x11e175.settings.interruptKeywords || [],
    )) {
      if (_0x1f8765.targetNodeId === _0x471700) {
        _0x1f8765.targetNodeId = '';
      }
    }
    _0x4838f9.node = null;
    _0x3962b4(true);
    _0x4c12ef();
  }
  function _0x1481d6(_0x8b3310, _0x1af1be, _0x4c8b10) {
    if (_0x8b3310 === _0x4c8b10) {
      return;
    }
    _0x11e175.edges = _0x11e175.edges.filter(
      (_0x2bfb0a) =>
        _0x2bfb0a.from !== _0x8b3310 || _0x2bfb0a.handle !== _0x1af1be,
    );
    _0x11e175.edges.push({
      id: uid('e'),
      from: _0x8b3310,
      handle: _0x1af1be,
      to: _0x4c8b10,
    });
    const _0x567bb2 = _0x2c27c2.get(_0x8b3310);
    const _0x215c9f = _0x11e175.nodes.find(
      (_0x446caf) => _0x446caf.id === _0x8b3310,
    );
    if (_0x567bb2 && _0x215c9f) {
      _0x20be36(_0x215c9f);
    }
  }
  function _0x20be36(_0xbae2d2) {
    const _0x9f3965 = _0x2c27c2.get(_0xbae2d2.id);
    const _0x437e62 = _0x46e70b(_0xbae2d2);
    _0x9f3965.replaceWith(_0x437e62);
    _0x2c27c2.set(_0xbae2d2.id, _0x437e62);
  }
  function _0x34dcbe(_0x52a6a4) {
    const _0x305bb2 = _0x549f89.getBoundingClientRect();
    const _0x3a4f91 = _0x52a6a4.getBoundingClientRect();
    return {
      x: (_0x3a4f91.left + _0x3a4f91.width / 2 - _0x305bb2.left) / _0x357010.z,
      y: (_0x3a4f91.top + _0x3a4f91.height / 2 - _0x305bb2.top) / _0x357010.z,
    };
  }
  function _0x57aa41(_0xdd06cf, _0x4a6f48) {
    const _0x5daf44 = Math.max(50, Math.abs(_0x4a6f48.x - _0xdd06cf.x) / 2);
    return (
      'M ' +
      _0xdd06cf.x +
      ' ' +
      _0xdd06cf.y +
      ' C ' +
      (_0xdd06cf.x + _0x5daf44) +
      ' ' +
      _0xdd06cf.y +
      ', ' +
      (_0x4a6f48.x - _0x5daf44) +
      ' ' +
      _0x4a6f48.y +
      ', ' +
      _0x4a6f48.x +
      ' ' +
      _0x4a6f48.y
    );
  }
  function _0x2188b8() {
    clear(_0x44b054);
    const _0x1de245 = svgEl('defs');
    const _0x5f369a = svgEl('marker', {
      id: 'wc-arrow',
      viewBox: '0 0 10 10',
      refX: 9,
      refY: 5,
      markerWidth: 7,
      markerHeight: 7,
      orient: 'auto-start-reverse',
    });
    _0x5f369a.appendChild(
      svgEl('path', {
        d: 'M 0 0 L 10 5 L 0 10 z',
        class: 'wc-arrowhead',
      }),
    );
    _0x1de245.appendChild(_0x5f369a);
    _0x44b054.appendChild(_0x1de245);
    for (const _0x210880 of _0x11e175.edges) {
      const _0x3d89c8 = _0x2c27c2.get(_0x210880.from);
      const _0x31c8a0 = _0x2c27c2.get(_0x210880.to);
      if (!_0x3d89c8 || !_0x31c8a0) {
        continue;
      }
      const _0x142d5b = _0x3d89c8.querySelector(
        '.wc-port[data-handle="' + _0x210880.handle + '"]',
      );
      const _0x7d3a79 = _0x31c8a0.querySelector('.wc-inport');
      if (!_0x142d5b || !_0x7d3a79) {
        continue;
      }
      const _0x2f4138 = _0x34dcbe(_0x142d5b);
      const _0x50c98e = _0x34dcbe(_0x7d3a79);
      const _0x3b47bb = _0x57aa41(_0x2f4138, _0x50c98e);
      const _0xdff305 = svgEl('g', {
        class:
          'wc-edge' + (_0x4838f9.edge === _0x210880.id ? ' is-selected' : ''),
      });
      _0xdff305.appendChild(
        svgEl('path', {
          d: _0x3b47bb,
          class: 'wc-edge-line',
          'marker-end': 'url(#wc-arrow)',
        }),
      );
      const _0x591dbf = svgEl('path', {
        d: _0x3b47bb,
        class: 'wc-edge-hit',
      });
      _0x591dbf.addEventListener('mousedown', (_0x7fae60) => {
        _0x7fae60.stopPropagation();
        _0x3a8101(null, _0x210880.id);
      });
      _0xdff305.appendChild(_0x591dbf);
      if (_0x4838f9.edge === _0x210880.id) {
        const _0x319689 = {
          x: (_0x2f4138.x + _0x50c98e.x) / 2,
          y: (_0x2f4138.y + _0x50c98e.y) / 2,
        };
        const _0x3f2a65 = svgEl('g', {
          class: 'wc-edge-x',
          transform: 'translate(' + _0x319689.x + ' ' + _0x319689.y + ')',
        });
        _0x3f2a65.appendChild(
          svgEl('circle', {
            r: 11,
          }),
        );
        _0x3f2a65.appendChild(
          svgEl('path', {
            d: 'M -4 -4 L 4 4 M 4 -4 L -4 4',
            class: 'wc-edge-cross',
          }),
        );
        _0x3f2a65.addEventListener('mousedown', (_0x5d78d6) => {
          _0x5d78d6.stopPropagation();
          _0x11e175.edges = _0x11e175.edges.filter(
            (_0x5793d9) => _0x5793d9.id !== _0x210880.id,
          );
          _0x4838f9.edge = null;
          _0x3962b4(true);
          _0x4c12ef();
        });
        _0xdff305.appendChild(_0x3f2a65);
      }
      _0x44b054.appendChild(_0xdff305);
    }
  }
  function _0x13f38a() {
    _0x549f89.style.transform =
      'translate(' +
      _0x357010.x +
      'px, ' +
      _0x357010.y +
      'px) scale(' +
      _0x357010.z +
      ')';
    _0x5181bf.style.backgroundPosition =
      _0x357010.x + 'px ' + _0x357010.y + 'px';
    _0x5181bf.style.backgroundSize =
      GRID * 2.4 * _0x357010.z + 'px ' + GRID * 2.4 * _0x357010.z + 'px';
  }
  let _0xd008ac = true;
  function _0x432950(_0x5559fb, _0x4251a5, _0xcada85) {
    _0xd008ac = false;
    const _0x303f39 = _0x5181bf.getBoundingClientRect();
    const _0x26e011 = _0x5559fb - _0x303f39.left;
    const _0x474731 = _0x4251a5 - _0x303f39.top;
    const _0x858ad0 = Math.max(0.3, Math.min(1.6, _0x357010.z * _0xcada85));
    _0x357010.x =
      _0x26e011 - (_0x26e011 - _0x357010.x) * (_0x858ad0 / _0x357010.z);
    _0x357010.y =
      _0x474731 - (_0x474731 - _0x357010.y) * (_0x858ad0 / _0x357010.z);
    _0x357010.z = _0x858ad0;
    _0x13f38a();
    _0x19c00d();
    _0x536b73();
  }
  function _0x417362(_0x50cd33) {
    _0xd008ac = false;
    const _0x188323 = _0x5181bf.getBoundingClientRect();
    _0x357010.x =
      _0x188323.width / 2 - (_0x50cd33.x + NODE_W / 2) * _0x357010.z;
    _0x357010.y = _0x188323.height / 2 - (_0x50cd33.y + 40) * _0x357010.z;
    _0x13f38a();
    _0x19c00d();
  }
  function _0x2a431d(_0xbf0094) {
    if (!_0x11e175.nodes.length) {
      return;
    }
    const _0x2ee875 = _0x5181bf.getBoundingClientRect();
    const _0x191320 = Math.min(
      ..._0x11e175.nodes.map((_0x3a5af5) => _0x3a5af5.x),
    );
    const _0x3d0663 = Math.max(
      ..._0x11e175.nodes.map((_0x59864a) => _0x59864a.x + NODE_W),
    );
    const _0x2a1fef = Math.min(
      ..._0x11e175.nodes.map((_0x3243b7) => _0x3243b7.y),
    );
    const _0x4ecd9c = Math.max(
      ..._0x11e175.nodes.map((_0x9ef139) => _0x9ef139.y + 200),
    );
    const _0x4b73b3 = _0xbf0094 === true ? 0.3 : 0.55;
    const _0x12dc89 = Math.max(
      _0x4b73b3,
      Math.min(
        1,
        Math.min(
          (_0x2ee875.width - 80) / (_0x3d0663 - _0x191320),
          (_0x2ee875.height - 80) / (_0x4ecd9c - _0x2a1fef),
        ),
      ),
    );
    _0x357010.z = _0x12dc89;
    _0x357010.x =
      Math.max(
        40,
        (_0x2ee875.width - (_0x3d0663 - _0x191320) * _0x12dc89) / 2,
      ) -
      _0x191320 * _0x12dc89;
    _0x357010.y =
      Math.max(
        40,
        (_0x2ee875.height - (_0x4ecd9c - _0x2a1fef) * _0x12dc89) / 2,
      ) -
      _0x2a1fef * _0x12dc89;
    _0xd008ac = _0xbf0094 === true ? 'all' : true;
    _0x13f38a();
    _0x19c00d();
    _0x536b73();
  }
  _0x5181bf.addEventListener(
    'wheel',
    (_0x1fa39a) => {
      _0x1fa39a.preventDefault();
      if (_0x1fa39a.ctrlKey || _0x1fa39a.metaKey) {
        _0x432950(
          _0x1fa39a.clientX,
          _0x1fa39a.clientY,
          _0x1fa39a.deltaY < 0 ? 1.1 : 1 / 1.1,
        );
      } else {
        _0xd008ac = false;
        _0x357010.x -= _0x1fa39a.deltaX;
        _0x357010.y -= _0x1fa39a.deltaY;
        _0x13f38a();
        _0x19c00d();
        requestAnimationFrame(_0x2188b8);
      }
    },
    {
      passive: false,
    },
  );
  let _0x2d544b = null;
  _0x5181bf.addEventListener('mousedown', (_0x180b34) => {
    if (_0x180b34.button !== 0) {
      return;
    }
    const _0x5a493d =
      _0x180b34.target.closest && _0x180b34.target.closest('.wc-port');
    const _0x570614 =
      _0x180b34.target.closest && _0x180b34.target.closest('.wc-nhead');
    const _0x1acd8c =
      _0x180b34.target.closest && _0x180b34.target.closest('.wc-node');
    if (
      _0x180b34.target.closest('.wc-canvas-tools, .wc-minimap, .wc-iconbtn')
    ) {
      return;
    }
    if (_0x5a493d && _0x1acd8c) {
      _0x180b34.preventDefault();
      _0x180b34.stopPropagation();
      const _0x352078 = {
        node: _0x1acd8c.dataset.node,
        handle: _0x5a493d.dataset.handle,
      };
      const _0x860d2a = _0x34dcbe(_0x5a493d);
      const _0x454fba = svgEl('path', {
        class: 'wc-edge-line is-temp',
        d: _0x57aa41(_0x860d2a, _0x860d2a),
      });
      _0x44b054.appendChild(_0x454fba);
      _0x2d544b = {
        kind: 'connect',
        from: _0x352078,
        start: _0x860d2a,
        line: _0x454fba,
      };
      return;
    }
    if (_0x570614 && _0x1acd8c) {
      const _0x40385b = _0x11e175.nodes.find(
        (_0x472829) => _0x472829.id === _0x1acd8c.dataset.node,
      );
      _0x3a8101(_0x40385b.id);
      _0x2d544b = {
        kind: 'node',
        node: _0x40385b,
        el: _0x1acd8c,
        sx: _0x180b34.clientX,
        sy: _0x180b34.clientY,
        ox: _0x40385b.x,
        oy: _0x40385b.y,
        moved: false,
      };
      return;
    }
    if (_0x1acd8c) {
      _0x3a8101(_0x1acd8c.dataset.node);
      return;
    }
    _0x3a8101(null);
    _0xd008ac = false;
    _0x2d544b = {
      kind: 'pan',
      sx: _0x180b34.clientX,
      sy: _0x180b34.clientY,
      ox: _0x357010.x,
      oy: _0x357010.y,
    };
    _0x5181bf.classList.add('is-panning');
  });
  function _0x232219(_0x54e139) {
    if (!_0x2d544b) {
      return;
    }
    if (_0x2d544b.kind === 'pan') {
      _0x357010.x = _0x2d544b.ox + _0x54e139.clientX - _0x2d544b.sx;
      _0x357010.y = _0x2d544b.oy + _0x54e139.clientY - _0x2d544b.sy;
      _0x13f38a();
      _0x19c00d();
    } else if (_0x2d544b.kind === 'node') {
      _0x2d544b.moved = true;
      _0x2d544b.node.x = snap(
        _0x2d544b.ox + (_0x54e139.clientX - _0x2d544b.sx) / _0x357010.z,
      );
      _0x2d544b.node.y = snap(
        _0x2d544b.oy + (_0x54e139.clientY - _0x2d544b.sy) / _0x357010.z,
      );
      _0x2d544b.el.style.left = _0x2d544b.node.x + 'px';
      _0x2d544b.el.style.top = _0x2d544b.node.y + 'px';
      _0x2188b8();
      _0x19c00d();
    } else if (_0x2d544b.kind === 'connect') {
      const _0xd7f15f = _0x549f89.getBoundingClientRect();
      const _0x56f5e1 = {
        x: (_0x54e139.clientX - _0xd7f15f.left) / _0x357010.z,
        y: (_0x54e139.clientY - _0xd7f15f.top) / _0x357010.z,
      };
      _0x2d544b.line.setAttribute('d', _0x57aa41(_0x2d544b.start, _0x56f5e1));
    }
  }
  function _0x4e6dbe(_0x4fd3ec) {
    if (!_0x2d544b) {
      return;
    }
    const _0x5b941f = _0x2d544b;
    _0x2d544b = null;
    _0x5181bf.classList.remove('is-panning');
    if (_0x5b941f.kind === 'node' && _0x5b941f.moved) {
      _0x3962b4(true);
    }
    if (_0x5b941f.kind === 'connect') {
      _0x5b941f.line.remove();
      const _0x589291 = _0x56398f
        .getRootNode()
        .elementFromPoint(_0x4fd3ec.clientX, _0x4fd3ec.clientY);
      const _0x36627f =
        _0x589291 && _0x589291.closest && _0x589291.closest('.wc-node');
      if (
        _0x36627f &&
        _0x36627f.dataset.node !== _0x5b941f.from.node &&
        _0x11e175.nodes.find(
          (_0x3b7200) => _0x3b7200.id === _0x36627f.dataset.node,
        ).type !== 'start'
      ) {
        _0x1481d6(
          _0x5b941f.from.node,
          _0x5b941f.from.handle,
          _0x36627f.dataset.node,
        );
        _0x3962b4(true);
        requestAnimationFrame(_0x2188b8);
      } else if (!_0x36627f && _0x5181bf.contains(_0x589291)) {
        _0x39fbc3(_0x4fd3ec.clientX, _0x4fd3ec.clientY, _0x5b941f.from);
      } else {
        _0x2188b8();
      }
    }
  }
  document.addEventListener('mousemove', _0x232219);
  document.addEventListener('mouseup', _0x4e6dbe);
  function _0x39fbc3(_0x27adcd, _0x20341c, _0x20dc2b) {
    const _0x3a8770 = _0x549f89.getBoundingClientRect();
    const _0x178109 = (_0x27adcd - _0x3a8770.left) / _0x357010.z;
    const _0x4b9a9b = (_0x20341c - _0x3a8770.top) / _0x357010.z;
    const _0x227f43 = h('div', {
      style: {
        position: 'fixed',
        left: _0x27adcd + 'px',
        top: _0x20341c + 'px',
        width: '1px',
        height: '1px',
      },
    });
    _0x636070.layers.pop.appendChild(_0x227f43);
    const _0x1a78c4 = [];
    for (const _0x1ff5ed of PALETTE_GROUPS) {
      _0x1a78c4.push({
        header: h(
          'div',
          {
            class: 'wc-menu-group',
          },
          _0x1ff5ed.label,
        ),
      });
      Object.entries(NODE_TYPES)
        .filter(([, _0x5f5553]) => _0x5f5553.group === _0x1ff5ed.id)
        .forEach(([_0x272ba2, _0x48fd32]) =>
          _0x1a78c4.push({
            label: _0x48fd32.label,
            icon: _0x48fd32.icon,
            onClick: () =>
              _0xa36f4d(_0x272ba2, _0x178109, _0x4b9a9b - 20, _0x20dc2b),
          }),
        );
    }
    const _0xc4e911 = _0x636070.openMenu(_0x227f43, _0x1a78c4, {
      align: 'start',
      width: 240,
    });
    setTimeout(() => _0x227f43.remove(), 0);
    return _0xc4e911;
  }
  _0x5181bf.addEventListener('dragover', (_0x285bce) => {
    if (_0x285bce.dataTransfer.types.includes('text/wacrm-node')) {
      _0x285bce.preventDefault();
    }
  });
  _0x5181bf.addEventListener('drop', (_0x24e15a) => {
    const _0x1ab3e1 = _0x24e15a.dataTransfer.getData('text/wacrm-node');
    if (!_0x1ab3e1) {
      return;
    }
    _0x24e15a.preventDefault();
    const _0x1b2ca6 = _0x549f89.getBoundingClientRect();
    _0xa36f4d(
      _0x1ab3e1,
      (_0x24e15a.clientX - _0x1b2ca6.left) / _0x357010.z - NODE_W / 2,
      (_0x24e15a.clientY - _0x1b2ca6.top) / _0x357010.z - 20,
    );
  });
  function _0x19090d(_0x525bd8) {
    if (!_0x56398f.isConnected) {
      return;
    }
    const _0x58fa40 = _0x56398f.getRootNode().activeElement;
    const _0x4c9972 =
      _0x58fa40 && /INPUT|TEXTAREA|SELECT/.test(_0x58fa40.tagName);
    if (
      (_0x525bd8.ctrlKey || _0x525bd8.metaKey) &&
      _0x525bd8.key.toLowerCase() === 'z'
    ) {
      if (_0x4c9972) {
        return;
      }
      _0x525bd8.preventDefault();
      if (_0x525bd8.shiftKey) {
        _0x408d90();
      } else {
        _0x29fb94();
      }
    } else if (
      (_0x525bd8.ctrlKey || _0x525bd8.metaKey) &&
      _0x525bd8.key.toLowerCase() === 'y'
    ) {
      if (_0x4c9972) {
        return;
      }
      _0x525bd8.preventDefault();
      _0x408d90();
    } else if (
      (_0x525bd8.ctrlKey || _0x525bd8.metaKey) &&
      _0x525bd8.key.toLowerCase() === 'd' &&
      _0x4838f9.node
    ) {
      if (_0x4c9972) {
        return;
      }
      _0x525bd8.preventDefault();
      _0xf5156c(_0x4838f9.node);
    } else if (
      (_0x525bd8.key === 'Delete' || _0x525bd8.key === 'Backspace') &&
      !_0x4c9972 &&
      !_0x636070.hasOpenModal()
    ) {
      if (_0x4838f9.node) {
        _0xe28bfe(_0x4838f9.node);
      } else if (_0x4838f9.edge) {
        _0x11e175.edges = _0x11e175.edges.filter(
          (_0x19bdc7) => _0x19bdc7.id !== _0x4838f9.edge,
        );
        _0x4838f9.edge = null;
        _0x3962b4(true);
        _0x4c12ef();
      }
    }
  }
  document.addEventListener('keydown', _0x19090d);
  const _0x1a3878 = h('aside', {
    class: 'wc-palette',
  });
  function _0x105766() {
    clear(_0x1a3878);
    const _0x63084 = _0x636070.searchInput('Search blocks...', (_0x412cd4) => {
      _0x235939 = _0x412cd4.toLowerCase();
      _0x105766();
    });
    _0x1a3878.appendChild(
      h(
        'div',
        {
          class: 'wc-palette-head',
        },
        h('strong', null, 'Add blocks'),
        h(
          'span',
          {
            class: 'wc-muted',
          },
          'Drag a block onto the canvas',
        ),
      ),
    );
    _0x1a3878.appendChild(_0x63084);
    let _0x3c0b63 = false;
    for (const _0x1d9148 of PALETTE_GROUPS) {
      const _0x59afd7 = Object.entries(NODE_TYPES).filter(
        ([, _0x1e48a5]) =>
          _0x1e48a5.group === _0x1d9148.id &&
          (!_0x235939 ||
            (_0x1e48a5.label + ' ' + _0x1e48a5.hint)
              .toLowerCase()
              .includes(_0x235939)),
      );
      if (!_0x59afd7.length) {
        continue;
      }
      _0x3c0b63 = true;
      _0x1a3878.appendChild(
        h(
          'div',
          {
            class: 'wc-palette-group',
          },
          _0x1d9148.label,
        ),
      );
      _0x59afd7.forEach(([_0x4cfb88, _0x5b01a3]) =>
        _0x1a3878.appendChild(
          h(
            'button',
            {
              type: 'button',
              class: 'wc-pitem',
              draggable: 'true',
              style: {
                '--nc': _0x5b01a3.color,
              },
              onDragstart: (_0x5b59cc) => {
                _0x5b59cc.dataTransfer.setData('text/wacrm-node', _0x4cfb88);
                _0x5b59cc.dataTransfer.effectAllowed = 'copy';
              },
              onClick: () => {
                const _0x3a85d2 = _0x5181bf.getBoundingClientRect();
                _0xa36f4d(
                  _0x4cfb88,
                  (_0x3a85d2.width / 2 - _0x357010.x) / _0x357010.z -
                    NODE_W / 2 +
                    (_0x11e175.nodes.length % 5) * 18,
                  (_0x3a85d2.height / 2 - _0x357010.y) / _0x357010.z -
                    60 +
                    (_0x11e175.nodes.length % 5) * 18,
                );
              },
            },
            h(
              'span',
              {
                class: 'wc-nicon',
              },
              icon(_0x5b01a3.icon, 15),
            ),
            h(
              'span',
              {
                class: 'wc-pmain',
              },
              h('strong', null, _0x5b01a3.label),
              h('small', null, _0x5b01a3.hint),
            ),
          ),
        ),
      );
    }
    if (!_0x3c0b63) {
      _0x1a3878.appendChild(
        h(
          'div',
          {
            class: 'wc-muted wc-pad',
          },
          'No blocks match your search.',
        ),
      );
    }
  }
  let _0x235939 = '';
  function _0x19c00d() {
    clear(_0x4be31b);
    if (!_0x11e175.nodes.length) {
      return;
    }
    const _0x3c2795 =
      Math.min(..._0x11e175.nodes.map((_0x4a33ea) => _0x4a33ea.x)) - 60;
    const _0x29e365 =
      Math.max(..._0x11e175.nodes.map((_0x56832a) => _0x56832a.x + NODE_W)) +
      60;
    const _0x9e76f5 =
      Math.min(..._0x11e175.nodes.map((_0x3b0446) => _0x3b0446.y)) - 60;
    const _0x4cc8e0 =
      Math.max(..._0x11e175.nodes.map((_0x21a7ae) => _0x21a7ae.y + 160)) + 60;
    const _0x48af0d = 168;
    const _0x3f843e = 104;
    const _0x5e1bd7 = Math.min(
      _0x48af0d / (_0x29e365 - _0x3c2795),
      _0x3f843e / (_0x4cc8e0 - _0x9e76f5),
    );
    _0x4be31b._map = {
      minX: _0x3c2795,
      minY: _0x9e76f5,
      s: _0x5e1bd7,
    };
    for (const _0x4ea2e8 of _0x11e175.nodes) {
      _0x4be31b.appendChild(
        h('span', {
          class: 'wc-mm-node',
          style: {
            left: (_0x4ea2e8.x - _0x3c2795) * _0x5e1bd7 + 'px',
            top: (_0x4ea2e8.y - _0x9e76f5) * _0x5e1bd7 + 'px',
            width: NODE_W * _0x5e1bd7 + 'px',
            height: _0x5e1bd7 * 110 + 'px',
            background: NODE_TYPES[_0x4ea2e8.type].color,
          },
        }),
      );
    }
    const _0x10444c = _0x5181bf.getBoundingClientRect();
    _0x4be31b.appendChild(
      h('span', {
        class: 'wc-mm-view',
        style: {
          left: (-_0x357010.x / _0x357010.z - _0x3c2795) * _0x5e1bd7 + 'px',
          top: (-_0x357010.y / _0x357010.z - _0x9e76f5) * _0x5e1bd7 + 'px',
          width: (_0x10444c.width / _0x357010.z) * _0x5e1bd7 + 'px',
          height: (_0x10444c.height / _0x357010.z) * _0x5e1bd7 + 'px',
        },
      }),
    );
  }
  _0x4be31b.addEventListener('mousedown', (_0x2464cc) => {
    const _0x36d4f9 = _0x4be31b._map;
    if (!_0x36d4f9) {
      return;
    }
    const _0x1f48c5 = (_0x54edb1) => {
      const _0x52f8de = _0x4be31b.getBoundingClientRect();
      const _0x38b613 =
        (_0x54edb1.clientX - _0x52f8de.left) / _0x36d4f9.s + _0x36d4f9.minX;
      const _0x2ea2a1 =
        (_0x54edb1.clientY - _0x52f8de.top) / _0x36d4f9.s + _0x36d4f9.minY;
      const _0xff535f = _0x5181bf.getBoundingClientRect();
      _0x357010.x = _0xff535f.width / 2 - _0x38b613 * _0x357010.z;
      _0x357010.y = _0xff535f.height / 2 - _0x2ea2a1 * _0x357010.z;
      _0x13f38a();
      _0x19c00d();
      requestAnimationFrame(_0x2188b8);
    };
    _0x1f48c5(_0x2464cc);
    const _0x1e779a = (_0x5e12fc) => _0x1f48c5(_0x5e12fc);
    const _0x144761 = () => {
      document.removeEventListener('mousemove', _0x1e779a);
      document.removeEventListener('mouseup', _0x144761);
    };
    document.addEventListener('mousemove', _0x1e779a);
    document.addEventListener('mouseup', _0x144761);
  });
  function _0x536b73() {
    clear(_0xdc02a5);
    _0xdc02a5.appendChild(
      _0x636070.iconButton('zoom-in', 'Zoom in', () => {
        const _0x15dbe1 = _0x5181bf.getBoundingClientRect();
        _0x432950(
          _0x15dbe1.left + _0x15dbe1.width / 2,
          _0x15dbe1.top + _0x15dbe1.height / 2,
          1.15,
        );
      }),
    );
    _0xdc02a5.appendChild(
      h(
        'span',
        {
          class: 'wc-zoomlabel',
        },
        Math.round(_0x357010.z * 100) + '%',
      ),
    );
    _0xdc02a5.appendChild(
      _0x636070.iconButton('zoom-out', 'Zoom out', () => {
        const _0x3ad8f9 = _0x5181bf.getBoundingClientRect();
        _0x432950(
          _0x3ad8f9.left + _0x3ad8f9.width / 2,
          _0x3ad8f9.top + _0x3ad8f9.height / 2,
          1 / 1.15,
        );
      }),
    );
    _0xdc02a5.appendChild(
      _0x636070.iconButton('locate-fixed', 'Fit to screen', () =>
        _0x2a431d(true),
      ),
    );
  }
  const _0x84809b = h('span', {
    class: 'wc-badgeslot',
  });
  function _0x529cce() {
    clear(_0x84809b);
    const _0x5a8905 = _0x2668f2.store.get('chatbots', _0x59e90d.id);
    const _0x23ecee =
      _0x5a8905.published &&
      JSON.stringify(_0x5a8905.published) !== JSON.stringify(_0x11e175);
    _0x84809b.appendChild(
      _0x5a8905.published
        ? _0x636070.chip(
            _0x23ecee ? 'Unpublished changes' : 'Published',
            _0x23ecee ? 'warn' : 'ok',
          )
        : _0x636070.chip('Draft', 'neutral'),
    );
    if (_0xc7385b.length) {
      _0x84809b.appendChild(
        _0x636070.chip(
          _0xc7385b.length +
            (_0xc7385b.length === 1 ? ' problem' : ' problems'),
          'danger',
        ),
      );
    }
  }
  const _0x38f1da = _0x636070.input({
    value: _0x59e90d.name,
    maxLength: 60,
    label: 'Chatbot name',
    onInput: debounce((_0x51ffc2) => {
      if (_0x51ffc2.trim()) {
        _0x2668f2.store.patch('chatbots', _0x59e90d.id, {
          name: _0x51ffc2.trim(),
        });
      }
    }, 400),
  });
  _0x38f1da.classList.add('wc-builder-name');
  function _0x27340a(_0x3606d4) {
    const _0x4b0948 = h('div', {
      class: 'wc-msel',
    });
    const _0x42cc09 = h('div', {
      class: 'wc-msel-list',
    });
    const _0x3443da = h('input', {
      type: 'text',
      class: 'wc-msel-search',
      placeholder: 'Go to block...',
    });
    const _0x2247f3 = () => {
      clear(_0x42cc09);
      const _0x9fb9fb = _0x3443da.value.toLowerCase();
      const _0x2c0b49 = _0x11e175.nodes.filter(
        (_0x37510b) =>
          !_0x9fb9fb || nodeLabel(_0x37510b).toLowerCase().includes(_0x9fb9fb),
      );
      if (!_0x2c0b49.length) {
        _0x42cc09.appendChild(
          h(
            'div',
            {
              class: 'wc-msel-empty',
            },
            'No matching block',
          ),
        );
      }
      _0x2c0b49.forEach((_0x52486d) =>
        _0x42cc09.appendChild(
          h(
            'button',
            {
              type: 'button',
              class: 'wc-msel-item',
              onClick: () => {
                _0x11a3c0.close();
                _0x3a8101(_0x52486d.id);
                _0x417362(_0x52486d);
              },
            },
            icon(NODE_TYPES[_0x52486d.type].icon, 14),
            h(
              'span',
              {
                class: 'wc-msel-text',
              },
              h('span', null, nodeLabel(_0x52486d)),
              h('small', null, NODE_TYPES[_0x52486d.type].label),
            ),
          ),
        ),
      );
    };
    _0x3443da.addEventListener('input', _0x2247f3);
    _0x4b0948.appendChild(_0x3443da);
    _0x4b0948.appendChild(_0x42cc09);
    _0x2247f3();
    const _0x11a3c0 = _0x636070.openPopover(_0x3606d4, _0x4b0948, {
      width: 300,
    });
    _0x3443da.focus();
  }
  async function _0x13625f() {
    _0x1e870e();
    await _0x2668f2.store.patch('chatbots', _0x59e90d.id, {
      draft: _0x11e175,
    });
    try {
      await _0x2668f2.chatbots.publish(_0x59e90d.id);
      _0x636070.toast('Flow published.', 'success');
      _0x26355f();
    } catch (_0x22e66b) {
      if (_0x22e66b.problems) {
        _0xc7385b = _0x22e66b.problems;
        _0x26355f();
        _0x636070.toast(_0x22e66b.message, 'error');
        const _0x2fca65 = _0x22e66b.problems.find(
          (_0x172c87) => _0x172c87.nodeId,
        );
        if (_0x2fca65) {
          const _0x53a26b = _0x11e175.nodes.find(
            (_0xb6c9ee) => _0xb6c9ee.id === _0x2fca65.nodeId,
          );
          if (_0x53a26b) {
            _0x3a8101(_0x53a26b.id);
            _0x417362(_0x53a26b);
          }
        }
      } else {
        _0x636070.toast(_0x22e66b.message, 'error');
      }
    }
  }
  const _0x324b86 = h(
    'div',
    {
      class: 'wc-builder-bar',
    },
    _0x636070.button('Back to list', {
      icon: 'chevron-left',
      size: 'sm',
      variant: 'ghost',
      onClick: async () => {
        _0x5d0cd9.flush();
        await _0x2668f2.store.patch('chatbots', _0x59e90d.id, {
          draft: _0x11e175,
        });
        _0x407211();
      },
    }),
    _0x38f1da,
    _0x84809b,
    _0x30d2a2,
    h('span', {
      class: 'wc-spacer',
    }),
    _0x636070.iconButton('undo-2', 'Undo', _0x29fb94),
    _0x636070.iconButton('redo-2', 'Redo', _0x408d90),
    _0x636070.button('Go to block', {
      icon: 'search',
      size: 'sm',
      onClick: (_0x1a7bde) => _0x27340a(_0x1a7bde.currentTarget),
    }),
    _0x636070.button('Simulator', {
      icon: 'play',
      size: 'sm',
      onClick: () => {
        _0x115b40 = !_0x115b40;
        _0x39e426 = !_0x115b40;
        _0x3c8614();
        if (_0x115b40) {
          _0x21e615();
        }
      },
    }),
    _0x636070.button('Flow settings', {
      icon: 'settings-2',
      size: 'sm',
      onClick: () => {
        _0x3a8101(null);
        _0x39e426 = true;
        _0x115b40 = false;
        _0x3c8614();
      },
    }),
    _0x636070.button('Publish', {
      icon: 'rocket',
      variant: 'primary',
      size: 'sm',
      onClick: _0x13625f,
    }),
  );
  function _0x3c8614() {
    _0x4f8186.hidden = !_0x39e426 && !_0x115b40;
    if (_0x115b40) {
      _0x3ff7e8();
    } else {
      _0x51ba4a();
    }
  }
  function _0x51ba4a() {
    if (_0x115b40) {
      return;
    }
    clear(_0x4f8186);
    if (!_0x39e426) {
      return;
    }
    const _0x3927f5 =
      _0x4838f9.node &&
      _0x11e175.nodes.find((_0x52e095) => _0x52e095.id === _0x4838f9.node);
    _0x4f8186.appendChild(
      h(
        'div',
        {
          class: 'wc-rp-head',
        },
        h(
          'strong',
          null,
          _0x3927f5
            ? 'Edit ' + NODE_TYPES[_0x3927f5.type].label
            : 'Flow overview',
        ),
        _0x636070.iconButton('x', 'Hide panel', () => {
          _0x39e426 = false;
          _0x3c8614();
        }),
      ),
    );
    const _0x389a7d = h('div', {
      class: 'wc-rp-body',
    });
    if (_0x3927f5) {
      const _0x576e4a = () => {
        const _0x5bcc92 = _0x389a7d.scrollTop;
        clear(_0x389a7d);
        _0x413bff();
        _0x389a7d.scrollTop = _0x5bcc92;
      };
      const _0x413bff = () =>
        _0x389a7d.appendChild(
          nodeInspector({
            app: _0x2668f2,
            graph: _0x11e175,
            node: _0x3927f5,
            flows: _0x5c7f0b(),
            onChange: () => {
              _0x454054(_0x3927f5);
              _0x3962b4(false);
            },
            refresh: () => {
              _0x2d10a7(_0x3927f5);
              _0x576e4a();
              _0x3962b4(true);
            },
          }),
        );
      _0x413bff();
      _0x389a7d.appendChild(
        h(
          'div',
          {
            class: 'wc-rp-foot',
          },
          _0x636070.button('Delete block', {
            variant: 'danger',
            size: 'sm',
            icon: 'trash-2',
            disabled: _0x3927f5.type === 'start',
            onClick: () => _0xe28bfe(_0x3927f5.id),
          }),
        ),
      );
    } else {
      _0x389a7d.appendChild(
        flowInspector({
          app: _0x2668f2,
          flow: _0x2668f2.store.get('chatbots', _0x59e90d.id),
          graph: _0x11e175,
          onChange: () => _0x3962b4(false),
          onEditTrigger: () =>
            openFlowWizard(_0x2668f2, {
              flow: _0x2668f2.store.get('chatbots', _0x59e90d.id),
            }),
        }),
      );
    }
    _0x4f8186.appendChild(_0x389a7d);
  }
  const _0x454054 = debounce((_0x37b373) => {
    const _0x3d9f66 = _0x2c27c2.get(_0x37b373.id);
    if (!_0x3d9f66) {
      return;
    }
    const _0x4c1c95 = _0x46e70b(_0x37b373);
    _0x3d9f66.replaceWith(_0x4c1c95);
    _0x2c27c2.set(_0x37b373.id, _0x4c1c95);
    _0x518770();
    _0x26355f();
    requestAnimationFrame(_0x2188b8);
  }, 120);
  const _0x40f36d = {
    api: null,
    bubbles: [],
    callApis: false,
    store: null,
  };
  async function _0x21e615() {
    const _0x226bef = await createStore(memoryBackend(), {
      writeDelay: 0,
    }).init();
    _0x40f36d.bubbles = [];
    _0x40f36d.api = await createSimulator({
      graph: clone(_0x11e175),
      flow: clone(_0x2668f2.store.get('chatbots', _0x59e90d.id)),
      chatbots: _0x2668f2.store
        .all('chatbots')
        .filter((_0x27c412) => _0x27c412.id !== _0x59e90d.id)
        .map(clone),
      store: _0x226bef,
      crmFactory: (_0x538a73) =>
        createCrm({
          store: _0x538a73,
          wa: null,
        }),
      http: _0x2668f2.http,
      callApis: _0x40f36d.callApis,
      onSay: (_0x9f0e77) => {
        _0x40f36d.bubbles.push({
          from: 'bot',
          text:
            _0x9f0e77.kind &&
            _0x9f0e77.kind !== 'none' &&
            _0x9f0e77.kind !== 'media' &&
            _0x9f0e77.kind !== 'audio' &&
            _0x9f0e77.kind !== 'document'
              ? '[' + _0x9f0e77.kind + '] ' + (_0x9f0e77.text || '')
              : (_0x9f0e77.files && _0x9f0e77.files.length
                  ? '[' + _0x9f0e77.files.length + ' file(s)] '
                  : '') + (_0x9f0e77.text || ''),
        });
        _0x3ff7e8();
      },
    });
    await _0x40f36d.api.begin();
    _0x3ff7e8();
  }
  function _0x3ff7e8() {
    if (!_0x115b40) {
      return;
    }
    const _0x51f5aa = _0x4f8186.querySelector('.wc-chatlog');
    clear(_0x4f8186);
    const _0x394e2f = h(
      'div',
      {
        class: 'wc-chatlog wc-chatlog-sim',
      },
      _0x40f36d.bubbles.map((_0x4c801f) =>
        h(
          'div',
          {
            class:
              'wc-bubble-row ' +
              (_0x4c801f.from === 'me' ? 'is-me' : 'is-them'),
          },
          h(
            'div',
            {
              class: 'wc-msgbubble',
            },
            h(
              'span',
              {
                class: 'wc-prewrap',
              },
              _0x4c801f.text,
            ),
          ),
        ),
      ),
    );
    if (!_0x40f36d.bubbles.length) {
      _0x394e2f.appendChild(
        h(
          'div',
          {
            class: 'wc-muted wc-pad',
          },
          'Starting...',
        ),
      );
    }
    const _0x5d6ded = _0x636070.input({
      placeholder: 'Type a reply as the customer',
      onEnter: async (_0x23ce62) => {
        if (!_0x23ce62.trim() || !_0x40f36d.api) {
          return;
        }
        _0x40f36d.bubbles.push({
          from: 'me',
          text: _0x23ce62,
        });
        _0x5d6ded.value = '';
        _0x3ff7e8();
        await _0x40f36d.api.reply(_0x23ce62);
        if (!_0x40f36d.api.session()) {
          _0x40f36d.bubbles.push({
            from: 'sys',
            text: 'The conversation has ended.',
          });
        }
        _0x3ff7e8();
      },
    });
    const _0x11ef26 = _0x40f36d.api ? _0x40f36d.api.vars() : {};
    _0x4f8186.appendChild(
      h(
        'div',
        {
          class: 'wc-rp-head',
        },
        h('strong', null, 'Simulator'),
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x636070.button('Restart', {
            icon: 'rotate-ccw',
            size: 'sm',
            onClick: _0x21e615,
          }),
          _0x636070.iconButton('x', 'Close simulator', () => {
            _0x115b40 = false;
            _0x39e426 = true;
            _0x3c8614();
          }),
        ),
      ),
    );
    _0x4f8186.appendChild(
      h(
        'div',
        {
          class: 'wc-rp-body wc-sim',
        },
        _0x636070.banner(
          'Nothing is sent to WhatsApp. This is how the chat would look.',
          'info',
        ),
        _0x394e2f,
        _0x5d6ded,
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x636070.button('Skip 1 minute', {
            size: 'sm',
            onClick: async () => {
              await _0x40f36d.api.advance(60000);
              _0x3ff7e8();
            },
          }),
          _0x636070.button('Skip 1 hour', {
            size: 'sm',
            onClick: async () => {
              await _0x40f36d.api.advance(3600000);
              _0x3ff7e8();
            },
          }),
        ),
        _0x636070.checkbox(
          _0x40f36d.callApis,
          (_0x3fb831) => {
            _0x40f36d.callApis = _0x3fb831;
            _0x21e615();
          },
          'Call real APIs from API request blocks',
        ),
        h(
          'div',
          {
            class: 'wc-kv',
          },
          Object.keys(_0x11ef26).length
            ? Object.keys(_0x11ef26).map((_0x127244) =>
                h(
                  'div',
                  {
                    class: 'wc-kv-row',
                  },
                  h(
                    'span',
                    {
                      class: 'wc-kv-k',
                    },
                    _0x127244,
                  ),
                  h(
                    'span',
                    {
                      class: 'wc-kv-v',
                    },
                    String(_0x11ef26[_0x127244]),
                  ),
                ),
              )
            : h(
                'div',
                {
                  class: 'wc-kv-row',
                },
                h(
                  'span',
                  {
                    class: 'wc-kv-k',
                  },
                  'Variables',
                ),
                h(
                  'span',
                  {
                    class: 'wc-kv-v',
                  },
                  'None yet',
                ),
              ),
        ),
      ),
    );
    const _0x3eaf9d = _0x4f8186.querySelector('.wc-chatlog');
    if (_0x3eaf9d) {
      _0x3eaf9d.scrollTop = _0x3eaf9d.scrollHeight;
    }
  }
  _0x56398f.appendChild(_0x324b86);
  _0x56398f.appendChild(
    h(
      'div',
      {
        class: 'wc-builder-main',
      },
      _0x1a3878,
      _0x5181bf,
      _0x4f8186,
    ),
  );
  _0x105766();
  _0x536b73();
  _0x3c8614();
  _0xaff779.setSubtitle(
    'Design the conversation. Nothing runs until you publish.',
  );
  _0xaff779.setActions([]);
  _0xaff779.onDispose(() => {
    document.removeEventListener('mousemove', _0x232219);
    document.removeEventListener('mouseup', _0x4e6dbe);
    document.removeEventListener('keydown', _0x19090d);
    _0x5d0cd9.flush();
    _0x2da5a7.cancel();
  });
  requestAnimationFrame(() => {
    _0x4c12ef();
    _0x2a431d();
    _0x529cce();
  });
  const _0x5ac37b = new ResizeObserver(() => {
    if (_0xd008ac && _0x5181bf.clientWidth > 0) {
      _0x2a431d(_0xd008ac === 'all');
    }
  });
  _0x5ac37b.observe(_0x5181bf);
  _0xaff779.onDispose(() => _0x5ac37b.disconnect());
  _0x4c12ef();
  return _0x56398f;
}
