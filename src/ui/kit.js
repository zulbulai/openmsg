import { h, icon, clear } from './dom.js';
import {
  hashString,
  debounce,
  toLocalInput,
  fromLocalInput,
} from '../core/util.js';
export const layers = {
  root: null,
  modal: null,
  pop: null,
  toast: null,
};
export function button(_0x384ca1, _0x349599 = {}) {
  const _0x24caaa = [];
  if (_0x349599.icon) {
    _0x24caaa.push(icon(_0x349599.icon, _0x349599.iconSize || 16));
  }
  if (_0x384ca1) {
    _0x24caaa.push(h('span', null, _0x384ca1));
  }
  return h(
    'button',
    {
      class:
        'wc-btn wc-btn-' +
        (_0x349599.variant || 'default') +
        (_0x349599.size ? ' wc-btn-' + _0x349599.size : '') +
        (_0x349599.iconOnly ? ' wc-btn-icon' : '') +
        (_0x349599.block ? ' wc-btn-block' : ''),
      type: _0x349599.type || 'button',
      title: _0x349599.title,
      'aria-label': _0x349599.title || _0x384ca1,
      onClick: _0x349599.onClick,
      disabled: _0x349599.disabled,
    },
    _0x24caaa,
  );
}
export function iconButton(_0x452733, _0x14fb43, _0x39aa67, _0x329f77) {
  return h(
    'button',
    {
      class: 'wc-iconbtn' + (_0x329f77 ? ' ' + _0x329f77 : ''),
      type: 'button',
      title: _0x14fb43,
      'aria-label': _0x14fb43,
      onClick: _0x39aa67,
    },
    icon(_0x452733, 16),
  );
}
export function chip(_0x363694, _0x57b5d3 = 'neutral', _0x276fbf) {
  return h(
    'span',
    {
      class: 'wc-chip wc-chip-' + _0x57b5d3,
      style:
        _0x276fbf && _0x276fbf.color
          ? {
              background: _0x276fbf.color,
              color: _0x276fbf.textColor || '#1a1400',
            }
          : undefined,
    },
    _0x363694,
  );
}
const AVATAR_TONES = [
  '#ffc72c',
  '#7dd3fc',
  '#f9a8d4',
  '#86efac',
  '#c4b5fd',
  '#fdba74',
  '#fca5a5',
  '#5eead4',
];
export function avatar(_0x1e4e69, _0x4c413f = 34) {
  const _0x4d5ed2 = String(_0x1e4e69 || '?');
  const _0x51a820 =
    _0x4d5ed2
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((_0x47b3d6) => _0x47b3d6[0].toUpperCase())
      .join('') || '?';
  return h(
    'span',
    {
      class: 'wc-avatar',
      style: {
        width: _0x4c413f + 'px',
        height: _0x4c413f + 'px',
        background: AVATAR_TONES[hashString(_0x4d5ed2) % AVATAR_TONES.length],
        fontSize: Math.round(_0x4c413f * 0.38) + 'px',
      },
    },
    _0x51a820,
  );
}
export function toggle(_0x2a1a5c, _0x47ed53, _0x480d2c) {
  const _0x8c244d = h('input', {
    type: 'checkbox',
    class: 'wc-switch-input',
    'aria-label': _0x480d2c || 'Toggle',
  });
  _0x8c244d.checked = !!_0x2a1a5c;
  if (_0x47ed53) {
    _0x8c244d.addEventListener('change', () => _0x47ed53(_0x8c244d.checked));
  }
  const _0x325780 = h(
    'label',
    {
      class: 'wc-switch',
    },
    _0x8c244d,
    h('span', {
      class: 'wc-switch-track',
    }),
  );
  _0x325780.input = _0x8c244d;
  return _0x325780;
}
export function checkbox(_0x14b57d, _0x11ac25, _0x5e44dd) {
  const _0x160ad1 = h('input', {
    type: 'checkbox',
    class: 'wc-check-input',
  });
  _0x160ad1.checked = !!_0x14b57d;
  if (_0x11ac25) {
    _0x160ad1.addEventListener('change', () => _0x11ac25(_0x160ad1.checked));
  }
  const _0x175dec = h(
    'label',
    {
      class: 'wc-checkbox',
    },
    _0x160ad1,
    _0x5e44dd ? h('span', null, _0x5e44dd) : null,
  );
  _0x175dec.input = _0x160ad1;
  return _0x175dec;
}
export function radioCards(_0xe7e81f, _0x32587e, _0xe36b33, _0x543c06) {
  const _0x3ab1de = h('div', {
    class: 'wc-radio-group',
  });
  for (const _0x24c319 of _0x32587e) {
    const _0x24c01a = h('input', {
      type: 'radio',
      name: _0xe7e81f,
      class: 'wc-radio-input',
    });
    _0x24c01a.checked = _0x24c319.value === _0xe36b33;
    _0x24c01a.addEventListener('change', () => {
      if (_0x24c01a.checked) {
        _0x543c06(_0x24c319.value);
      }
    });
    _0x3ab1de.appendChild(
      h(
        'label',
        {
          class: 'wc-radio-card',
        },
        _0x24c01a,
        h(
          'span',
          {
            class: 'wc-radio-body',
          },
          h('strong', null, _0x24c319.label),
          _0x24c319.hint ? h('span', null, _0x24c319.hint) : null,
        ),
      ),
    );
  }
  return _0x3ab1de;
}
export function emptyState(_0x3eb06a, _0x3aa42a, _0x21ec3e, _0x220249) {
  return h(
    'div',
    {
      class: 'wc-empty',
    },
    h(
      'div',
      {
        class: 'wc-empty-icon',
      },
      icon(_0x3eb06a, 26),
    ),
    h(
      'div',
      {
        class: 'wc-empty-title',
      },
      _0x3aa42a,
    ),
    _0x21ec3e
      ? h(
          'div',
          {
            class: 'wc-empty-text',
          },
          _0x21ec3e,
        )
      : null,
    _0x220249 || null,
  );
}
export function banner(_0x572d59, _0x2e9045 = 'info', _0x3730fd) {
  return h(
    'div',
    {
      class: 'wc-callout wc-callout-' + _0x2e9045,
    },
    icon(
      _0x3730fd ||
        (_0x2e9045 === 'warn'
          ? 'triangle-alert'
          : _0x2e9045 === 'danger'
            ? 'circle-alert'
            : 'info'),
      16,
    ),
    h('span', null, _0x572d59),
  );
}
export function section(_0x53b0de, _0x2ec665, _0x3dfe51 = {}) {
  return h(
    'section',
    {
      class: 'wc-section' + (_0x3dfe51.card ? ' wc-card' : ''),
    },
    _0x53b0de
      ? h(
          'div',
          {
            class: 'wc-section-head',
          },
          h(
            'h3',
            {
              class: 'wc-section-title2',
            },
            _0x53b0de,
          ),
          _0x3dfe51.hint
            ? h(
                'p',
                {
                  class: 'wc-section-hint',
                },
                _0x3dfe51.hint,
              )
            : null,
          _0x3dfe51.aside || null,
        )
      : null,
    _0x2ec665,
  );
}
export function progress(_0xfb4d66) {
  return h(
    'div',
    {
      class: 'wc-progress',
      role: 'progressbar',
      'aria-valuenow': _0xfb4d66,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
    },
    h('div', {
      class: 'wc-progress-bar',
      style: {
        width: Math.max(0, Math.min(100, _0xfb4d66)) + '%',
      },
    }),
  );
}
export function input(_0x34fcdf = {}) {
  const _0x517078 = h('input', {
    class: 'wc-input',
    type: _0x34fcdf.type || 'text',
    placeholder: _0x34fcdf.placeholder,
    maxlength: _0x34fcdf.maxLength,
    min: _0x34fcdf.min,
    max: _0x34fcdf.max,
    step: _0x34fcdf.step,
    disabled: _0x34fcdf.disabled,
    'aria-label': _0x34fcdf.label,
  });
  _0x517078.value =
    _0x34fcdf.value === undefined || _0x34fcdf.value === null
      ? ''
      : _0x34fcdf.value;
  if (_0x34fcdf.onInput) {
    _0x517078.addEventListener('input', () =>
      _0x34fcdf.onInput(
        _0x34fcdf.type === 'number'
          ? _0x517078.value === ''
            ? ''
            : Number(_0x517078.value)
          : _0x517078.value,
      ),
    );
  }
  if (_0x34fcdf.onEnter) {
    _0x517078.addEventListener('keydown', (_0x5688bc) => {
      if (_0x5688bc.key === 'Enter') {
        _0x5688bc.preventDefault();
        _0x34fcdf.onEnter(_0x517078.value);
      }
    });
  }
  return _0x517078;
}
export function textarea(_0x1cd97c = {}) {
  const _0xb009f7 = h('textarea', {
    class: 'wc-textarea',
    rows: _0x1cd97c.rows || 4,
    placeholder: _0x1cd97c.placeholder,
    maxlength: _0x1cd97c.maxLength,
    'aria-label': _0x1cd97c.label,
  });
  _0xb009f7.value = _0x1cd97c.value || '';
  if (_0x1cd97c.onInput) {
    _0xb009f7.addEventListener('input', () =>
      _0x1cd97c.onInput(_0xb009f7.value),
    );
  }
  return _0xb009f7;
}
export function select(_0x54d252, _0x30bbdc, _0x3781a2, _0x8a349e = {}) {
  const _0x15d5e1 = h(
    'select',
    {
      class: 'wc-select',
      'aria-label': _0x8a349e.label,
      disabled: _0x8a349e.disabled,
    },
    _0x54d252.map((_0x4302ea) => {
      const _0x45bf93 =
        typeof _0x4302ea === 'object' ? _0x4302ea.value : _0x4302ea;
      const _0x36e400 =
        typeof _0x4302ea === 'object' ? _0x4302ea.label : _0x4302ea;
      return h(
        'option',
        {
          value: _0x45bf93,
        },
        _0x36e400,
      );
    }),
  );
  _0x15d5e1.value =
    _0x30bbdc === undefined || _0x30bbdc === null ? '' : _0x30bbdc;
  if (_0x3781a2) {
    _0x15d5e1.addEventListener('change', () => _0x3781a2(_0x15d5e1.value));
  }
  return _0x15d5e1;
}
export function datetimeInput(_0x40db77, _0x3e7410, _0x112f7e = {}) {
  const _0x20fd8d = h('input', {
    class: 'wc-input',
    type: _0x112f7e.type || 'datetime-local',
    min: _0x112f7e.min ? toLocalInput(_0x112f7e.min) : undefined,
  });
  _0x20fd8d.value = _0x40db77 ? toLocalInput(_0x40db77) : '';
  if (_0x3e7410) {
    _0x20fd8d.addEventListener('input', () =>
      _0x3e7410(fromLocalInput(_0x20fd8d.value)),
    );
  }
  return _0x20fd8d;
}
export function field(_0x555261, _0x575c85, _0x431400 = {}) {
  const _0x3bce17 = h(
    'div',
    {
      class: 'wc-field' + (_0x431400.inline ? ' wc-field-inline' : ''),
    },
    _0x555261
      ? h(
          'span',
          {
            class: 'wc-field-label',
          },
          _0x555261,
          _0x431400.required
            ? h(
                'span',
                {
                  class: 'wc-req',
                },
                ' *',
              )
            : null,
        )
      : null,
    _0x575c85,
    _0x431400.hint
      ? h(
          'span',
          {
            class: 'wc-field-hint',
          },
          _0x431400.hint,
        )
      : null,
  );
  _0x3bce17.setError = (_0x6db1bf) => {
    const _0x28a212 = _0x3bce17.querySelector('.wc-field-error');
    if (_0x28a212) {
      _0x28a212.remove();
    }
    _0x3bce17.classList.toggle('has-error', !!_0x6db1bf);
    if (_0x6db1bf) {
      _0x3bce17.appendChild(
        h(
          'span',
          {
            class: 'wc-field-error',
          },
          _0x6db1bf,
        ),
      );
    }
  };
  return _0x3bce17;
}
export function row(..._0x424702) {
  return h(
    'div',
    {
      class: 'wc-form-row',
    },
    _0x424702,
  );
}
export function searchInput(_0x109585, _0x303436) {
  const _0x2d56c1 = h('input', {
    type: 'text',
    placeholder: _0x109585 || 'Search',
    class: 'wc-search-input',
    'aria-label': _0x109585 || 'Search',
  });
  if (_0x303436) {
    _0x2d56c1.addEventListener(
      'input',
      debounce(() => _0x303436(_0x2d56c1.value), 120),
    );
  }
  const _0x312481 = h(
    'label',
    {
      class: 'wc-search',
    },
    icon('search', 15),
    _0x2d56c1,
  );
  _0x312481.input = _0x2d56c1;
  return _0x312481;
}
export function tagInput(_0x16b0d5 = {}) {
  let _0x5107ae = (_0x16b0d5.value || []).slice();
  const _0x29d6e0 = h('div', {
    class: 'wc-taginput',
  });
  const _0x9f9da5 = h('input', {
    type: 'text',
    class: 'wc-taginput-input',
    placeholder: _0x16b0d5.placeholder || 'Type and press Enter',
  });
  function _0x541c82() {
    clear(_0x29d6e0);
    _0x5107ae.forEach((_0x1162f3, _0x40d360) =>
      _0x29d6e0.appendChild(
        h(
          'span',
          {
            class: 'wc-tagchip',
          },
          _0x1162f3,
          h(
            'button',
            {
              type: 'button',
              'aria-label': 'Remove ' + _0x1162f3,
              onClick: () => {
                _0x5107ae.splice(_0x40d360, 1);
                _0x541c82();
                if (_0x16b0d5.onChange) {
                  _0x16b0d5.onChange(_0x5107ae.slice());
                }
              },
            },
            icon('x', 12),
          ),
        ),
      ),
    );
    _0x29d6e0.appendChild(_0x9f9da5);
  }
  function _0x39c5c7() {
    const _0x1f6879 = _0x9f9da5.value
      .split(',')
      .map((_0x4268eb) => _0x4268eb.trim())
      .filter(Boolean);
    _0x9f9da5.value = '';
    let _0x4e7047 = false;
    for (const _0x41b5f7 of _0x1f6879) {
      if (
        !_0x5107ae.some(
          (_0x4393de) => _0x4393de.toLowerCase() === _0x41b5f7.toLowerCase(),
        ) &&
        (!_0x16b0d5.validate || _0x16b0d5.validate(_0x41b5f7))
      ) {
        _0x5107ae.push(_0x41b5f7);
        _0x4e7047 = true;
      }
    }
    if (_0x4e7047) {
      _0x541c82();
      if (_0x16b0d5.onChange) {
        _0x16b0d5.onChange(_0x5107ae.slice());
      }
      _0x9f9da5.focus();
    }
  }
  _0x9f9da5.addEventListener('keydown', (_0x12d745) => {
    if (_0x12d745.key === 'Enter' || _0x12d745.key === ',') {
      _0x12d745.preventDefault();
      _0x39c5c7();
    } else if (
      _0x12d745.key === 'Backspace' &&
      !_0x9f9da5.value &&
      _0x5107ae.length
    ) {
      _0x5107ae.pop();
      _0x541c82();
      if (_0x16b0d5.onChange) {
        _0x16b0d5.onChange(_0x5107ae.slice());
      }
    }
  });
  _0x9f9da5.addEventListener('blur', () => {
    if (_0x9f9da5.value.trim()) {
      _0x39c5c7();
    }
  });
  _0x29d6e0.addEventListener('click', () => _0x9f9da5.focus());
  _0x541c82();
  _0x29d6e0.getValue = () => _0x5107ae.slice();
  return _0x29d6e0;
}
export function colorSwatches(_0x4efc3d, _0x5b4aa7, _0x59da59) {
  const _0x4585c5 = h('div', {
    class: 'wc-swatches',
  });
  function _0x4db603(_0x270721) {
    clear(_0x4585c5);
    for (const _0x14010a of _0x4efc3d) {
      _0x4585c5.appendChild(
        h('button', {
          type: 'button',
          class:
            'wc-swatch' +
            (_0x14010a.toLowerCase() === String(_0x270721).toLowerCase()
              ? ' is-active'
              : ''),
          style: {
            background: _0x14010a,
          },
          'aria-label': _0x14010a,
          onClick: () => {
            _0x4db603(_0x14010a);
            _0x59da59(_0x14010a);
          },
        }),
      );
    }
    _0x4585c5.appendChild(
      h(
        'label',
        {
          class: 'wc-swatch wc-swatch-custom',
          title: 'Custom color',
        },
        icon('palette', 12),
        h('input', {
          type: 'color',
          value: /^#[0-9a-f]{6}$/i.test(_0x270721) ? _0x270721 : '#ffc72c',
          onInput: (_0x2553d4) => {
            _0x4db603(_0x2553d4.target.value);
            _0x59da59(_0x2553d4.target.value);
          },
        }),
      ),
    );
  }
  _0x4db603(_0x5b4aa7);
  return _0x4585c5;
}
let activePopover = null;
export function closePopover() {
  if (activePopover) {
    activePopover.close();
  }
}
export function openPopover(_0x428c77, _0x46503e, _0x552555 = {}) {
  closePopover();
  const _0x23834f = _0x428c77.getBoundingClientRect();
  const _0x4be3c3 = h(
    'div',
    {
      class: 'wc-popover',
    },
    _0x46503e,
  );
  const _0x55c794 = _0x552555.matchWidth ? _0x23834f.width : _0x552555.width;
  if (_0x55c794) {
    _0x4be3c3.style.width = _0x55c794 + 'px';
  }
  if (_0x552555.maxHeight) {
    _0x4be3c3.style.maxHeight = _0x552555.maxHeight;
  }
  layers.pop.appendChild(_0x4be3c3);
  const _0x434168 = {
    width: _0x4be3c3.offsetWidth,
    height: _0x4be3c3.offsetHeight,
  };
  let _0x1ed5e3 =
    _0x552555.align === 'end'
      ? _0x23834f.right - _0x434168.width
      : _0x23834f.left;
  _0x1ed5e3 = Math.max(
    8,
    Math.min(_0x1ed5e3, window.innerWidth - _0x434168.width - 8),
  );
  let _0x2a4d46 = _0x23834f.bottom + 6;
  if (
    _0x2a4d46 + _0x434168.height > window.innerHeight - 8 &&
    _0x23834f.top - _0x434168.height - 6 > 8
  ) {
    _0x2a4d46 = _0x23834f.top - _0x434168.height - 6;
  }
  _0x2a4d46 = Math.max(
    8,
    Math.min(_0x2a4d46, window.innerHeight - _0x434168.height - 8),
  );
  _0x4be3c3.style.left = _0x1ed5e3 + 'px';
  _0x4be3c3.style.top = _0x2a4d46 + 'px';
  function _0x1383c9(_0x356e2c) {
    const _0x1f5373 = _0x356e2c.composedPath();
    if (!_0x1f5373.includes(_0x4be3c3) && !_0x1f5373.includes(_0x428c77)) {
      _0x2987e5();
    }
  }
  function _0x9ccf14(_0x156551) {
    if (_0x156551.key === 'Escape') {
      _0x156551.stopPropagation();
      _0x2987e5();
    }
  }
  function _0x2987e5() {
    document.removeEventListener('mousedown', _0x1383c9, true);
    document.removeEventListener('keydown', _0x9ccf14, true);
    _0x4be3c3.remove();
    if (activePopover === _0x1a78cd) {
      activePopover = null;
    }
    if (_0x552555.onClose) {
      _0x552555.onClose();
    }
  }
  document.addEventListener('mousedown', _0x1383c9, true);
  document.addEventListener('keydown', _0x9ccf14, true);
  const _0x1a78cd = {
    close: _0x2987e5,
    el: _0x4be3c3,
  };
  activePopover = _0x1a78cd;
  return _0x1a78cd;
}
export function openMenu(_0x51af2e, _0x59d271, _0x1ec6b1 = {}) {
  const _0x1e3db4 = h('div', {
    class: 'wc-menu',
    role: 'menu',
  });
  let _0x2a3a18;
  for (const _0x2491d0 of _0x59d271) {
    if (_0x2491d0.divider) {
      _0x1e3db4.appendChild(
        h('div', {
          class: 'wc-menu-sep',
        }),
      );
      continue;
    }
    if (_0x2491d0.header) {
      _0x1e3db4.appendChild(_0x2491d0.header);
      continue;
    }
    _0x1e3db4.appendChild(
      h(
        'button',
        {
          class:
            'wc-menu-item' +
            (_0x2491d0.danger ? ' is-danger' : '') +
            (_0x2491d0.active ? ' is-active' : ''),
          type: 'button',
          role: 'menuitem',
          disabled: _0x2491d0.disabled,
          onClick: () => {
            _0x2a3a18.close();
            if (_0x2491d0.onClick) {
              _0x2491d0.onClick();
            }
          },
        },
        _0x2491d0.icon ? icon(_0x2491d0.icon, 16) : null,
        h(
          'span',
          {
            class: 'wc-menu-label',
          },
          _0x2491d0.label,
        ),
        _0x2491d0.meta
          ? h(
              'span',
              {
                class: 'wc-menu-meta',
              },
              _0x2491d0.meta,
            )
          : null,
      ),
    );
  }
  _0x2a3a18 = openPopover(_0x51af2e, _0x1e3db4, {
    align: _0x1ec6b1.align || 'end',
    width: _0x1ec6b1.width || 260,
    maxHeight: 'calc(100vh - 24px)',
  });
  return _0x2a3a18;
}
export function multiSelect(_0x367576) {
  let _0x375544 = _0x367576.single
    ? _0x367576.value === undefined
      ? ''
      : _0x367576.value
    : (_0x367576.value || []).slice();
  let _0x4de7ac = _0x367576.options || [];
  const _0x54e31d = h('button', {
    type: 'button',
    class: 'wc-multiselect',
    'aria-haspopup': 'listbox',
  });
  const _0xc860a2 = (_0x75d3eb) => {
    const _0x1f7c43 = _0x4de7ac.find(
      (_0x562ceb) => _0x562ceb.value === _0x75d3eb,
    );
    if (_0x1f7c43) {
      return _0x1f7c43.label;
    } else {
      return String(_0x75d3eb);
    }
  };
  function _0x586457() {
    clear(_0x54e31d);
    const _0x51773e = _0x367576.single
      ? _0x375544 === ''
        ? []
        : [_0x375544]
      : _0x375544;
    if (!_0x51773e.length) {
      _0x54e31d.appendChild(
        h(
          'span',
          {
            class: 'wc-multiselect-placeholder',
          },
          _0x367576.placeholder || 'Select',
        ),
      );
    } else if (_0x367576.single) {
      _0x54e31d.appendChild(h('span', null, _0xc860a2(_0x375544)));
    } else {
      const _0x4ffa8b = _0x51773e.slice(0, _0x367576.maxChips || 4);
      for (const _0x47d666 of _0x4ffa8b) {
        const _0xb83adc = _0x4de7ac.find(
          (_0x32e41c) => _0x32e41c.value === _0x47d666,
        );
        _0x54e31d.appendChild(
          h(
            'span',
            {
              class: 'wc-tagchip',
              style:
                _0xb83adc && _0xb83adc.color
                  ? {
                      background: _0xb83adc.color,
                      color: '#1a1400',
                    }
                  : undefined,
            },
            _0xc860a2(_0x47d666),
          ),
        );
      }
      if (_0x51773e.length > _0x4ffa8b.length) {
        _0x54e31d.appendChild(
          h(
            'span',
            {
              class: 'wc-tagchip',
            },
            '+' + (_0x51773e.length - _0x4ffa8b.length),
          ),
        );
      }
    }
    _0x54e31d.appendChild(icon('chevron-down', 14, 'wc-multiselect-caret'));
  }
  function _0x529ab8() {
    const _0x27454e = h('div', {
      class: 'wc-msel',
    });
    const _0x124efc = h('div', {
      class: 'wc-msel-list',
      role: 'listbox',
    });
    const _0x552953 = h('input', {
      type: 'text',
      class: 'wc-msel-search',
      placeholder: 'Search',
    });
    function _0x3ef7ed() {
      clear(_0x124efc);
      const _0x2a9e05 = _0x552953.value.trim().toLowerCase();
      const _0x4035e8 = _0x4de7ac.filter(
        (_0x5c94c0) =>
          !_0x2a9e05 ||
          String(_0x5c94c0.label).toLowerCase().includes(_0x2a9e05) ||
          String(_0x5c94c0.hint || '')
            .toLowerCase()
            .includes(_0x2a9e05),
      );
      if (!_0x4035e8.length) {
        _0x124efc.appendChild(
          h(
            'div',
            {
              class: 'wc-msel-empty',
            },
            _0x367576.emptyText || 'No options',
          ),
        );
      }
      for (const _0x2b3601 of _0x4035e8) {
        const _0x33051b = _0x367576.single
          ? _0x375544 === _0x2b3601.value
          : _0x375544.includes(_0x2b3601.value);
        _0x124efc.appendChild(
          h(
            'button',
            {
              type: 'button',
              role: 'option',
              class: 'wc-msel-item' + (_0x33051b ? ' is-on' : ''),
              onClick: () => {
                if (_0x367576.single) {
                  _0x375544 = _0x2b3601.value;
                  _0x586457();
                  if (_0x367576.onChange) {
                    _0x367576.onChange(_0x375544);
                  }
                  _0x1715bf.close();
                  return;
                }
                _0x375544 = _0x33051b
                  ? _0x375544.filter(
                      (_0x3c531b) => _0x3c531b !== _0x2b3601.value,
                    )
                  : _0x375544.concat([_0x2b3601.value]);
                _0x586457();
                if (_0x367576.onChange) {
                  _0x367576.onChange(_0x375544.slice());
                }
                _0x3ef7ed();
              },
            },
            _0x367576.single
              ? null
              : h(
                  'span',
                  {
                    class: 'wc-msel-box',
                  },
                  _0x33051b ? icon('check', 12) : null,
                ),
            _0x2b3601.color
              ? h('span', {
                  class: 'wc-dot',
                  style: {
                    background: _0x2b3601.color,
                  },
                })
              : null,
            h(
              'span',
              {
                class: 'wc-msel-text',
              },
              h('span', null, _0x2b3601.label),
              _0x2b3601.hint ? h('small', null, _0x2b3601.hint) : null,
            ),
          ),
        );
      }
    }
    _0x552953.addEventListener('input', _0x3ef7ed);
    if (_0x367576.searchable !== false && _0x4de7ac.length > 6) {
      _0x27454e.appendChild(_0x552953);
    }
    _0x27454e.appendChild(_0x124efc);
    if (!_0x367576.single && _0x4de7ac.length > 1) {
      _0x27454e.appendChild(
        h(
          'div',
          {
            class: 'wc-msel-foot',
          },
          h(
            'button',
            {
              type: 'button',
              class: 'wc-link',
              onClick: () => {
                _0x375544 = _0x4de7ac.map((_0x6acd6f) => _0x6acd6f.value);
                _0x586457();
                if (_0x367576.onChange) {
                  _0x367576.onChange(_0x375544.slice());
                }
                _0x3ef7ed();
              },
            },
            'Select all',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'wc-link',
              onClick: () => {
                _0x375544 = [];
                _0x586457();
                if (_0x367576.onChange) {
                  _0x367576.onChange([]);
                }
                _0x3ef7ed();
              },
            },
            'Clear',
          ),
        ),
      );
    }
    _0x3ef7ed();
    const _0x1715bf = openPopover(_0x54e31d, _0x27454e, {
      matchWidth: true,
      width: Math.max(240, _0x54e31d.getBoundingClientRect().width),
    });
    _0x552953.focus();
  }
  _0x54e31d.addEventListener('click', _0x529ab8);
  _0x54e31d.setValue = (_0xe6f903) => {
    _0x375544 = _0x367576.single ? _0xe6f903 : (_0xe6f903 || []).slice();
    _0x586457();
  };
  _0x54e31d.setOptions = (_0x51150a) => {
    _0x4de7ac = _0x51150a;
    _0x586457();
  };
  _0x54e31d.getValue = () => (_0x367576.single ? _0x375544 : _0x375544.slice());
  _0x586457();
  return _0x54e31d;
}
const modalStack = [];
let keyHandlerBound = false;
function bindEscape() {
  if (keyHandlerBound) {
    return;
  }
  keyHandlerBound = true;
  document.addEventListener(
    'keydown',
    (_0x6f5ff5) => {
      if (_0x6f5ff5.key !== 'Escape' || !modalStack.length) {
        return;
      }
      const _0x291002 = modalStack[modalStack.length - 1];
      if (_0x291002.dismissable === false) {
        return;
      }
      _0x6f5ff5.stopPropagation();
      _0x6f5ff5.preventDefault();
      _0x291002.close();
    },
    true,
  );
}
export function openModal(_0x5d841f) {
  bindEscape();
  const _0x4cba39 = document.activeElement;
  let _0x2e6505 = false;
  const _0x26d5ef = iconButton(
    'x',
    'Close',
    () => _0x3f0dc1.close(),
    'wc-modal-x',
  );
  const _0x3a2ee6 = h(
    'div',
    {
      class: 'wc-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': _0x5d841f.title,
      tabindex: '-1',
      style: {
        maxWidth: (_0x5d841f.width || 480) + 'px',
      },
    },
    h(
      'div',
      {
        class: 'wc-modal-head',
      },
      h(
        'div',
        null,
        h(
          'h2',
          {
            class: 'wc-modal-title',
          },
          _0x5d841f.title,
        ),
        _0x5d841f.subtitle
          ? h(
              'p',
              {
                class: 'wc-modal-sub',
              },
              _0x5d841f.subtitle,
            )
          : null,
      ),
      _0x5d841f.dismissable === false ? null : _0x26d5ef,
    ),
    h(
      'div',
      {
        class: 'wc-modal-body',
      },
      _0x5d841f.body,
    ),
    _0x5d841f.footer
      ? h(
          'div',
          {
            class: 'wc-modal-foot',
          },
          _0x5d841f.footer,
        )
      : null,
  );
  const _0x196e3d = h(
    'div',
    {
      class: 'wc-backdrop',
      onMousedown: (_0x5b11b9) => {
        if (_0x5b11b9.target === _0x196e3d && _0x5d841f.dismissable !== false) {
          _0x3f0dc1.close();
        }
      },
    },
    _0x3a2ee6,
  );
  const _0x3f0dc1 = {
    el: _0x3a2ee6,
    body: _0x3a2ee6.querySelector('.wc-modal-body'),
    dismissable: _0x5d841f.dismissable,
    close() {
      if (_0x2e6505) {
        return;
      }
      _0x2e6505 = true;
      closePopover();
      const _0x563d8e = modalStack.indexOf(_0x3f0dc1);
      if (_0x563d8e >= 0) {
        modalStack.splice(_0x563d8e, 1);
      }
      _0x196e3d.remove();
      layers.modal.classList.toggle(
        'has-modal',
        layers.modal.children.length > 0,
      );
      if (_0x5d841f.onClose) {
        _0x5d841f.onClose();
      }
      if (_0x4cba39 && _0x4cba39.focus) {
        try {
          _0x4cba39.focus();
        } catch (_0x44e1b5) {}
      }
    },
  };
  modalStack.push(_0x3f0dc1);
  layers.modal.appendChild(_0x196e3d);
  layers.modal.classList.add('has-modal');
  _0x3a2ee6.focus();
  return _0x3f0dc1;
}
export function openDrawer(_0x2b1be4) {
  bindEscape();
  let _0x57e9ef = false;
  const _0x351e09 = h(
    'aside',
    {
      class: 'wc-sheet',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': _0x2b1be4.title,
      tabindex: '-1',
      style: {
        width: Math.min(_0x2b1be4.width || 520, window.innerWidth) + 'px',
      },
    },
    h(
      'div',
      {
        class: 'wc-sheet-head',
      },
      h(
        'div',
        null,
        h(
          'h2',
          {
            class: 'wc-modal-title',
          },
          _0x2b1be4.title,
        ),
        _0x2b1be4.subtitle
          ? h(
              'p',
              {
                class: 'wc-modal-sub',
              },
              _0x2b1be4.subtitle,
            )
          : null,
      ),
      iconButton('x', 'Close', () => _0x8fd473.close(), 'wc-modal-x'),
    ),
    h(
      'div',
      {
        class: 'wc-sheet-body',
      },
      _0x2b1be4.body,
    ),
    _0x2b1be4.footer
      ? h(
          'div',
          {
            class: 'wc-sheet-foot',
          },
          _0x2b1be4.footer,
        )
      : null,
  );
  const _0x5b4523 = h(
    'div',
    {
      class: 'wc-backdrop wc-backdrop-side',
      onMousedown: (_0x3dec78) => {
        if (_0x3dec78.target === _0x5b4523) {
          _0x8fd473.close();
        }
      },
    },
    _0x351e09,
  );
  const _0x8fd473 = {
    el: _0x351e09,
    body: _0x351e09.querySelector('.wc-sheet-body'),
    close() {
      if (_0x57e9ef) {
        return;
      }
      _0x57e9ef = true;
      closePopover();
      const _0x3714ad = modalStack.indexOf(_0x8fd473);
      if (_0x3714ad >= 0) {
        modalStack.splice(_0x3714ad, 1);
      }
      _0x5b4523.remove();
      layers.modal.classList.toggle(
        'has-modal',
        layers.modal.children.length > 0,
      );
      if (_0x2b1be4.onClose) {
        _0x2b1be4.onClose();
      }
    },
  };
  modalStack.push(_0x8fd473);
  layers.modal.appendChild(_0x5b4523);
  layers.modal.classList.add('has-modal');
  _0x351e09.focus();
  return _0x8fd473;
}
export function closeAllModals() {
  for (const _0x258159 of modalStack.slice().reverse()) {
    _0x258159.close();
  }
}
export function hasOpenModal() {
  return modalStack.length > 0;
}
export function confirmDialog(_0x3bb3c6, _0x24df53 = {}) {
  return new Promise((_0x19538f) => {
    let _0xf25035 = false;
    const _0x506d44 = (_0x1d6814) => {
      if (_0xf25035) {
        return;
      }
      _0xf25035 = true;
      _0x19538f(_0x1d6814);
      _0x4c308c.close();
    };
    const _0x4c308c = openModal({
      title: _0x24df53.title || 'Are you sure?',
      width: 420,
      onClose: () => {
        if (!_0xf25035) {
          _0xf25035 = true;
          _0x19538f(false);
        }
      },
      body: h(
        'p',
        {
          class: 'wc-confirm-text',
        },
        _0x3bb3c6,
      ),
      footer: h(
        'div',
        {
          class: 'wc-modal-actions',
        },
        button(_0x24df53.cancelLabel || 'Cancel', {
          variant: 'dark',
          onClick: () => _0x506d44(false),
        }),
        button(_0x24df53.confirmLabel || 'Confirm', {
          variant: _0x24df53.danger ? 'danger' : 'primary',
          onClick: () => _0x506d44(true),
        }),
      ),
    });
  });
}
export function toast(_0xdec7e2, _0x3f1e2b = 'info', _0x51ecc5 = {}) {
  if (!layers.toast) {
    return;
  }
  const _0x4c7b22 =
    _0x3f1e2b === 'success'
      ? 'circle-check'
      : _0x3f1e2b === 'error'
        ? 'triangle-alert'
        : 'info';
  const _0x5bb608 = h(
    'div',
    {
      class: 'wc-toast wc-toast-' + _0x3f1e2b,
      role: 'status',
    },
    icon(_0x4c7b22, 18),
    h(
      'span',
      {
        class: 'wc-toast-text',
      },
      _0xdec7e2,
    ),
    _0x51ecc5.action
      ? h(
          'button',
          {
            type: 'button',
            class: 'wc-link',
            onClick: () => {
              _0x51ecc5.action.onClick();
              _0x5bb608.remove();
            },
          },
          _0x51ecc5.action.label,
        )
      : null,
  );
  layers.toast.appendChild(_0x5bb608);
  const _0x3e3b59 = _0x51ecc5.ttl || (_0x3f1e2b === 'error' ? 6000 : 3800);
  setTimeout(() => _0x5bb608.classList.add('is-leaving'), _0x3e3b59);
  setTimeout(() => _0x5bb608.remove(), _0x3e3b59 + 400);
  return _0x5bb608;
}
export function table(_0x237166, _0x3876e0, _0x99bba3 = {}) {
  if (!_0x3876e0.length && _0x99bba3.empty) {
    return _0x99bba3.empty;
  }
  return h(
    'div',
    {
      class: 'wc-table-wrap',
    },
    h(
      'table',
      {
        class: 'wc-table',
      },
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          _0x237166.map((_0x220acc) => h('th', null, _0x220acc)),
        ),
      ),
      h(
        'tbody',
        null,
        _0x3876e0.map((_0x5e0fae) =>
          h(
            'tr',
            null,
            _0x5e0fae.map((_0x56368f) => h('td', null, _0x56368f)),
          ),
        ),
      ),
    ),
  );
}
export function tabs(_0x5ef2c8, _0x3ca365, _0x23107e, _0x322b1a) {
  const _0x34b669 = h('div', {
    class: 'wc-tabs' + (_0x322b1a ? ' ' + _0x322b1a : ''),
    role: 'tablist',
  });
  let _0xe3a71c = _0x3ca365;
  function _0x4d23d3() {
    for (const _0x371f03 of _0x34b669.children) {
      _0x371f03.classList.toggle(
        'is-active',
        _0x371f03.dataset.id === _0xe3a71c,
      );
    }
  }
  for (const _0x49e6b6 of _0x5ef2c8) {
    _0x34b669.appendChild(
      h(
        'button',
        {
          class: 'wc-tab',
          type: 'button',
          role: 'tab',
          title: _0x49e6b6.label,
          dataset: {
            id: _0x49e6b6.id,
          },
          onClick: () => {
            _0xe3a71c = _0x49e6b6.id;
            _0x4d23d3();
            if (_0x23107e) {
              _0x23107e(_0x49e6b6.id);
            }
          },
        },
        _0x49e6b6.icon ? icon(_0x49e6b6.icon, 15) : null,
        h(
          'span',
          {
            class: 'wc-tab-label',
          },
          _0x49e6b6.label,
        ),
        _0x49e6b6.count !== undefined && _0x49e6b6.count !== null
          ? h(
              'span',
              {
                class: 'wc-tab-count',
              },
              String(_0x49e6b6.count),
            )
          : null,
      ),
    );
  }
  _0x4d23d3();
  return {
    el: _0x34b669,
    setActive: (_0x23d2da) => {
      _0xe3a71c = _0x23d2da;
      _0x4d23d3();
    },
  };
}
export function pager({
  page: _0x52e7d6,
  pageSize: _0x2d0745,
  total: _0x2fa22a,
  onPage: _0x296812,
  onSize: _0x2e0e66,
}) {
  const _0x419e56 = Math.max(1, Math.ceil(_0x2fa22a / _0x2d0745));
  const _0x2ee8ad = _0x2fa22a ? _0x52e7d6 * _0x2d0745 + 1 : 0;
  const _0x1b8f26 = Math.min(_0x2fa22a, (_0x52e7d6 + 1) * _0x2d0745);
  return h(
    'div',
    {
      class: 'wc-pager',
    },
    h(
      'span',
      {
        class: 'wc-muted',
      },
      'Rows per page',
    ),
    select(
      [10, 25, 50],
      _0x2d0745,
      (_0x4069df) => _0x2e0e66 && _0x2e0e66(Number(_0x4069df)),
    ),
    h(
      'span',
      {
        class: 'wc-muted',
      },
      _0x2ee8ad + '-' + _0x1b8f26 + ' of ' + _0x2fa22a,
    ),
    iconButton(
      'chevron-left',
      'Previous page',
      () => _0x52e7d6 > 0 && _0x296812(_0x52e7d6 - 1),
    ),
    iconButton(
      'chevron-right',
      'Next page',
      () => _0x52e7d6 < _0x419e56 - 1 && _0x296812(_0x52e7d6 + 1),
    ),
  );
}
export function bulkBar(_0x2672f1, _0x16acdc) {
  if (!_0x2672f1) {
    return document.createDocumentFragment();
  }
  return h(
    'div',
    {
      class: 'wc-bulkbar',
    },
    h('strong', null, _0x2672f1 + ' selected'),
    _0x16acdc,
  );
}
export function makeSortable(_0x2d094f, _0x588a80) {
  let _0x32b7d2 = null;
  const _0x94e47e = () =>
    Array.from(_0x2d094f.querySelectorAll(_0x588a80.itemSelector));
  function _0xfdd508(_0x2da8de) {
    const _0x453921 = _0x588a80.handleSelector
      ? _0x2da8de.querySelector(_0x588a80.handleSelector)
      : _0x2da8de;
    if (!_0x453921) {
      return;
    }
    _0x453921.addEventListener('mousedown', () => {
      _0x2da8de.draggable = true;
    });
    _0x453921.addEventListener('mouseup', () => {
      _0x2da8de.draggable = false;
    });
    _0x2da8de.addEventListener('dragstart', (_0x26b359) => {
      if (_0x26b359.target !== _0x2da8de) {
        return;
      }
      _0x32b7d2 = _0x2da8de;
      _0x2da8de.classList.add('is-dragging');
      _0x26b359.dataTransfer.effectAllowed = 'move';
      try {
        _0x26b359.dataTransfer.setData(
          'text/plain',
          _0x2da8de.dataset.id || '',
        );
      } catch (_0x18b221) {}
    });
    _0x2da8de.addEventListener('dragend', (_0x59513a) => {
      if (_0x59513a.target !== _0x2da8de) {
        return;
      }
      _0x2da8de.classList.remove('is-dragging');
      _0x2da8de.draggable = false;
      _0x32b7d2 = null;
      _0x94e47e().forEach((_0x14da74) =>
        _0x14da74.classList.remove('drop-before', 'drop-after'),
      );
    });
    _0x2da8de.addEventListener('dragover', (_0x17da5a) => {
      if (!_0x32b7d2 || _0x32b7d2 === _0x2da8de) {
        return;
      }
      _0x17da5a.preventDefault();
      const _0x4a2aec = _0x2da8de.getBoundingClientRect();
      const _0x3e3803 = _0x588a80.horizontal
        ? _0x17da5a.clientX > _0x4a2aec.left + _0x4a2aec.width / 2
        : _0x17da5a.clientY > _0x4a2aec.top + _0x4a2aec.height / 2;
      _0x94e47e().forEach((_0x302d64) =>
        _0x302d64.classList.remove('drop-before', 'drop-after'),
      );
      _0x2da8de.classList.add(_0x3e3803 ? 'drop-after' : 'drop-before');
    });
    _0x2da8de.addEventListener('drop', (_0x4f2d83) => {
      if (!_0x32b7d2 || _0x32b7d2 === _0x2da8de) {
        return;
      }
      _0x4f2d83.preventDefault();
      const _0x2953fe = _0x2da8de.getBoundingClientRect();
      const _0x5a0ba8 = _0x588a80.horizontal
        ? _0x4f2d83.clientX > _0x2953fe.left + _0x2953fe.width / 2
        : _0x4f2d83.clientY > _0x2953fe.top + _0x2953fe.height / 2;
      if (_0x5a0ba8) {
        _0x2da8de.after(_0x32b7d2);
      } else {
        _0x2da8de.before(_0x32b7d2);
      }
      _0x588a80.onReorder(_0x94e47e().map((_0x976b4) => _0x976b4.dataset.id));
    });
  }
  _0x94e47e().forEach(_0xfdd508);
  return {
    rewire: () => _0x94e47e().forEach(_0xfdd508),
  };
}
export function fileInput(_0x1bb919, _0x33f6ac, _0x44fa75) {
  const _0x580130 = h('input', {
    type: 'file',
    accept: _0x1bb919 || undefined,
    multiple: _0x33f6ac || undefined,
    class: 'wc-hidden-file',
  });
  _0x580130.addEventListener('change', () => {
    if (_0x580130.files && _0x580130.files.length) {
      _0x44fa75(Array.from(_0x580130.files));
    }
    _0x580130.value = '';
  });
  return _0x580130;
}
export function pickFiles(_0x865d39, _0x4c3e63) {
  return new Promise((_0x17ce23) => {
    const _0x3af485 = fileInput(_0x865d39, _0x4c3e63, (_0x4c1a56) => {
      _0x17ce23(_0x4c1a56);
      _0x3af485.remove();
    });
    _0x3af485.addEventListener('cancel', () => {
      _0x17ce23([]);
      _0x3af485.remove();
    });
    layers.root.appendChild(_0x3af485);
    _0x3af485.click();
  });
}
export function live(_0x34938c, _0xf66f83, _0x4674ee, _0x3cdd39) {
  const _0x295ea5 = h('div', {
    class: 'wc-live',
  });
  const _0x3f534f = () => {
    clear(_0x295ea5);
    const _0x65ee5c = _0x3cdd39();
    if (_0x65ee5c) {
      _0x295ea5.appendChild(_0x65ee5c);
    }
  };
  _0x3f534f();
  const _0x4bb366 = debounce(_0x3f534f, 40);
  const _0x4c2819 = _0x4674ee.map((_0x11185b) =>
    _0xf66f83.store.on(_0x11185b, _0x4bb366),
  );
  if (_0x34938c && _0x34938c.onDispose) {
    _0x34938c.onDispose(() => _0x4c2819.forEach((_0x119948) => _0x119948()));
  }
  _0x295ea5.repaint = _0x3f534f;
  return _0x295ea5;
}
