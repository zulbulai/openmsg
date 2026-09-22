import { h, icon, clear } from '../ui/dom.js';
import * as _0x5aee5a from '../ui/kit.js';
import { formattedTextarea, mediaPicker } from '../ui/message-editor.js';
import { postActionsEditor } from '../ui/pickers.js';
import { NODE_TYPES, OPERATORS, FORMATS } from '../core/chatbot.js';
import { renderTemplate } from '../core/variables.js';
export function nodeLabel(_0xa46a81) {
  return _0xa46a81.title || NODE_TYPES[_0xa46a81.type].label;
}
export function variableNames(_0x48f820) {
  const _0x4b1607 = new Set();
  for (const _0x3c6c5b of _0x48f820.nodes) {
    const _0x2d67f1 = _0x3c6c5b.data || {};
    if (_0x2d67f1.saveAs) {
      _0x4b1607.add(_0x2d67f1.saveAs);
    }
    for (const _0x2136ef of _0x2d67f1.entries || []) {
      if (_0x2136ef.name) {
        _0x4b1607.add(_0x2136ef.name);
      }
    }
    for (const _0x3d1d8d of _0x2d67f1.mapping || []) {
      if (_0x3d1d8d.variable) {
        _0x4b1607.add(_0x3d1d8d.variable);
      }
    }
  }
  return Array.from(_0x4b1607).sort();
}
let listId = 0;
function varInput(_0x39f00b, _0x190b9d, _0x6fae64, _0x1b1037) {
  const _0x12d492 = 'wc-vars-' + ++listId;
  const _0x10e9e8 = _0x5aee5a.input({
    value: _0x190b9d,
    placeholder: _0x1b1037 || 'variable',
    onInput: _0x6fae64,
  });
  _0x10e9e8.setAttribute('list', _0x12d492);
  const _0x27994e = h(
    'datalist',
    {
      id: _0x12d492,
    },
    variableNames(_0x39f00b)
      .concat([
        'firstname',
        'name',
        'phone',
        'mob_no',
        'email',
        'last_message',
        'last_choice',
      ])
      .map((_0x49917b) =>
        h('option', {
          value: _0x49917b,
        }),
      ),
  );
  return h(
    'div',
    {
      class: 'wc-varinput',
    },
    _0x10e9e8,
    _0x27994e,
  );
}
function kvList(
  _0x7c6dc6,
  _0x447155,
  {
    namePlaceholder: _0x5befa2,
    valuePlaceholder: _0x8657d4,
    addLabel: _0x525528,
  },
) {
  const _0x2ea81f = h('div', {
    class: 'wc-stack',
  });
  function _0x38edf9() {
    clear(_0x2ea81f);
    _0x7c6dc6.forEach((_0xc16720, _0x3262b2) =>
      _0x2ea81f.appendChild(
        h(
          'div',
          {
            class: 'wc-form-row wc-row-remove',
          },
          _0x5aee5a.input({
            value: _0xc16720.name,
            placeholder: _0x5befa2 || 'Name',
            onInput: (_0x3eb1bc) => {
              _0xc16720.name = _0x3eb1bc;
              _0x447155();
            },
          }),
          _0x5aee5a.input({
            value: _0xc16720.value,
            placeholder: _0x8657d4 || 'Value',
            onInput: (_0x37514f) => {
              _0xc16720.value = _0x37514f;
              _0x447155();
            },
          }),
          _0x5aee5a.iconButton(
            'trash-2',
            'Remove',
            () => {
              _0x7c6dc6.splice(_0x3262b2, 1);
              _0x38edf9();
              _0x447155();
            },
            'is-danger',
          ),
        ),
      ),
    );
    _0x2ea81f.appendChild(
      _0x5aee5a.button(_0x525528 || 'Add', {
        icon: 'plus',
        size: 'sm',
        onClick: () => {
          _0x7c6dc6.push({
            name: '',
            value: '',
          });
          _0x38edf9();
          _0x447155();
        },
      }),
    );
  }
  _0x38edf9();
  return _0x2ea81f;
}
function typingField(_0x36095f, _0x112817) {
  return _0x5aee5a.field(
    'Show "typing..." first (seconds)',
    _0x5aee5a.input({
      type: 'number',
      min: 0,
      max: 10,
      value: _0x36095f.typingDelay ?? 1,
      onInput: (_0x489636) => {
        _0x36095f.typingDelay = Number(_0x489636) || 0;
        _0x112817();
      },
    }),
    {
      hint: '0 sends it straight away.',
    },
  );
}
function timeoutFields(_0x5c21d7, _0x153459, _0x144097) {
  const _0x423e89 = h('div', {
    class: 'wc-stack',
  });
  _0x423e89.appendChild(
    _0x5aee5a.checkbox(
      !!_0x5c21d7.timeoutEnabled,
      (_0x197f41) => {
        _0x5c21d7.timeoutEnabled = _0x197f41;
        _0x153459();
        _0x144097();
      },
      'Give up after a while and take the "no answer" path',
    ),
  );
  if (_0x5c21d7.timeoutEnabled) {
    _0x423e89.appendChild(
      _0x5aee5a.row(
        _0x5aee5a.field(
          'Waiting time',
          _0x5aee5a.input({
            type: 'number',
            min: 1,
            value: _0x5c21d7.timeoutValue,
            onInput: (_0x248d24) => {
              _0x5c21d7.timeoutValue = Math.max(1, Number(_0x248d24) || 1);
              _0x153459();
            },
          }),
        ),
        _0x5aee5a.field(
          'Unit',
          _0x5aee5a.select(
            ['seconds', 'minutes', 'hours'],
            _0x5c21d7.timeoutUnit,
            (_0x88f2e6) => {
              _0x5c21d7.timeoutUnit = _0x88f2e6;
              _0x153459();
            },
          ),
        ),
      ),
    );
  }
  return _0x423e89;
}
function captureSection(_0x251e7b, _0x350082, _0xb59a66, _0x3b5aeb) {
  const _0x3990cd = h('div', {
    class: 'wc-subcard wc-stack',
  });
  _0x3990cd.appendChild(
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'After sending',
    ),
  );
  _0x3990cd.appendChild(
    _0x5aee5a.checkbox(
      !!_0x350082.wait,
      (_0x4e1c1a) => {
        _0x350082.wait = _0x4e1c1a;
        _0xb59a66();
        _0x3b5aeb();
      },
      'Wait for a reply (the bot stops here until the customer writes back)',
    ),
  );
  if (_0x350082.wait) {
    _0x3990cd.appendChild(
      _0x5aee5a.field(
        'Remember their answer as',
        varInput(
          _0x251e7b,
          _0x350082.saveAs,
          (_0x5e6618) => {
            _0x350082.saveAs = _0x5e6618.trim();
            _0xb59a66();
          },
          'e.g. email',
        ),
        {
          hint: 'Use it later as {{name}} in messages and conditions.',
        },
      ),
    );
    _0x3990cd.appendChild(
      _0x5aee5a.field(
        'Answer format',
        _0x5aee5a.select(
          FORMATS.map((_0x9d0778) => ({
            value: _0x9d0778.id,
            label: _0x9d0778.label,
          })),
          _0x350082.format || 'any',
          (_0x48be90) => {
            _0x350082.format = _0x48be90;
            _0xb59a66();
          },
        ),
        {
          hint: 'If the reply does not match, the bot asks again.',
        },
      ),
    );
    _0x3990cd.appendChild(timeoutFields(_0x350082, _0xb59a66, _0x3b5aeb));
  }
  return _0x3990cd;
}
function optionsRows(_0x13182c, _0x3bebd1, _0x537758, _0x256c9e) {
  const _0x547415 = h('div', {
    class: 'wc-stack',
  });
  _0x13182c.forEach((_0xc44789, _0xf36924) =>
    _0x547415.appendChild(
      h(
        'div',
        {
          class: 'wc-form-row wc-row-remove',
        },
        _0x5aee5a.input({
          value:
            _0xc44789.title !== undefined ? _0xc44789.title : _0xc44789.text,
          placeholder: _0x256c9e,
          onInput: (_0x3ffc4a) => {
            if (_0xc44789.title !== undefined) {
              _0xc44789.title = _0x3ffc4a;
            } else {
              _0xc44789.text = _0x3ffc4a;
            }
            _0x3bebd1();
          },
        }),
        _0x13182c.length > 1
          ? _0x5aee5a.iconButton(
              'trash-2',
              'Remove',
              () => {
                _0x13182c.splice(_0xf36924, 1);
                _0x3bebd1();
                _0x537758();
              },
              'is-danger',
            )
          : h('span'),
      ),
    ),
  );
  return _0x547415;
}
function flattenPaths(
  _0x42965a,
  _0x132c9e = '',
  _0x15cb35 = 0,
  _0xada65b = [],
) {
  if (
    _0xada65b.length > 60 ||
    _0x15cb35 > 4 ||
    _0x42965a === null ||
    _0x42965a === undefined
  ) {
    return _0xada65b;
  }
  if (Array.isArray(_0x42965a)) {
    if (_0x42965a.length) {
      flattenPaths(
        _0x42965a[0],
        _0x132c9e + (_0x132c9e ? '.' : '') + '0',
        _0x15cb35 + 1,
        _0xada65b,
      );
    }
    return _0xada65b;
  }
  if (typeof _0x42965a === 'object') {
    for (const _0x4eb9ae of Object.keys(_0x42965a)) {
      flattenPaths(
        _0x42965a[_0x4eb9ae],
        _0x132c9e ? _0x132c9e + '.' + _0x4eb9ae : _0x4eb9ae,
        _0x15cb35 + 1,
        _0xada65b,
      );
    }
    return _0xada65b;
  }
  _0xada65b.push({
    path: _0x132c9e,
    sample: String(_0x42965a).slice(0, 40),
  });
  return _0xada65b;
}
function webhookForm(_0x5e1314, _0xb2c4db, _0x488178, _0x4f6b4f, _0x33886c) {
  const _0x43d69f = h('div', {
    class: 'wc-stack',
  });
  const _0x188b8a = h('div', {
    class: 'wc-stack',
  });
  const _0x5c0873 = h('div', {
    class: 'wc-stack',
  });
  function _0x80430c() {
    clear(_0x5c0873);
    if (['GET', 'DELETE', 'HEAD'].includes(_0x488178.method)) {
      _0x5c0873.appendChild(
        h(
          'p',
          {
            class: 'wc-muted',
          },
          'GET and DELETE requests send no body.',
        ),
      );
      return;
    }
    _0x5c0873.appendChild(
      _0x5aee5a.tabs(
        [
          {
            id: 'fields',
            label: 'Fields',
          },
          {
            id: 'raw',
            label: 'JSON text',
          },
        ],
        _0x488178.bodyMode,
        (_0x33d4cb) => {
          _0x488178.bodyMode = _0x33d4cb;
          _0x4f6b4f();
          _0x80430c();
        },
      ).el,
    );
    if (_0x488178.bodyMode === 'raw') {
      _0x5c0873.appendChild(
        _0x5aee5a.textarea({
          value: _0x488178.bodyRaw,
          rows: 6,
          placeholder: '{"phone": "{{mob_no}}"}',
          onInput: (_0x489d6a) => {
            _0x488178.bodyRaw = _0x489d6a;
            _0x4f6b4f();
          },
        }),
      );
    } else {
      _0x5c0873.appendChild(
        kvList(_0x488178.bodyFields, _0x4f6b4f, {
          namePlaceholder: 'Field name',
          valuePlaceholder: 'Value, e.g. {{email}}',
          addLabel: 'Add field',
        }),
      );
    }
  }
  const _0x1a7a6c = h('div', {
    class: 'wc-stack',
  });
  function _0x349dae() {
    clear(_0x1a7a6c);
    _0x488178.mapping.forEach((_0x15bab2, _0x2705f8) =>
      _0x1a7a6c.appendChild(
        h(
          'div',
          {
            class: 'wc-form-row wc-row-remove',
          },
          _0x5aee5a.input({
            value: _0x15bab2.path,
            placeholder: 'Field in the reply, e.g. data.status',
            onInput: (_0x2308ea) => {
              _0x15bab2.path = _0x2308ea;
              _0x4f6b4f();
            },
          }),
          varInput(
            _0xb2c4db,
            _0x15bab2.variable,
            (_0x16e53c) => {
              _0x15bab2.variable = _0x16e53c.trim();
              _0x4f6b4f();
            },
            'Save as variable',
          ),
          _0x5aee5a.iconButton(
            'trash-2',
            'Remove',
            () => {
              _0x488178.mapping.splice(_0x2705f8, 1);
              _0x349dae();
              _0x4f6b4f();
            },
            'is-danger',
          ),
        ),
      ),
    );
    _0x1a7a6c.appendChild(
      _0x5aee5a.button('Add field', {
        icon: 'plus',
        size: 'sm',
        onClick: () => {
          _0x488178.mapping.push({
            path: '',
            variable: '',
          });
          _0x349dae();
          _0x4f6b4f();
        },
      }),
    );
  }
  async function _0x29f471() {
    clear(_0x188b8a);
    _0x188b8a.appendChild(
      h(
        'span',
        {
          class: 'wc-muted',
        },
        'Trying...',
      ),
    );
    try {
      const _0x105780 = _0x5e1314.wa.state.activeChat;
      const _0x29d5f4 = _0x5e1314.crm.vars(
        _0x105780 ? _0x105780.id : 'test@c.us',
      );
      const _0x1cbfa1 = new URL(renderTemplate(_0x488178.url, _0x29d5f4));
      for (const _0x4d2d2a of _0x488178.params) {
        if (_0x4d2d2a.name) {
          _0x1cbfa1.searchParams.set(
            _0x4d2d2a.name,
            renderTemplate(_0x4d2d2a.value, _0x29d5f4),
          );
        }
      }
      const _0x547d0b = {};
      for (const _0x167ac0 of _0x488178.headers) {
        if (_0x167ac0.name) {
          _0x547d0b[_0x167ac0.name] = renderTemplate(
            _0x167ac0.value,
            _0x29d5f4,
          );
        }
      }
      const _0x5d215d = {
        url: _0x1cbfa1.toString(),
        method: _0x488178.method,
        headers: _0x547d0b,
        timeoutMs: (Number(_0x488178.timeoutSec) || 15) * 1000,
      };
      if (!['GET', 'DELETE', 'HEAD'].includes(_0x488178.method)) {
        if (_0x488178.bodyMode === 'raw') {
          _0x5d215d.body = renderTemplate(_0x488178.bodyRaw, _0x29d5f4);
          _0x547d0b['Content-Type'] =
            _0x547d0b['Content-Type'] || 'application/json';
        } else {
          const _0xc44661 = {};
          for (const _0x49cb14 of _0x488178.bodyFields) {
            if (_0x49cb14.name) {
              _0xc44661[_0x49cb14.name] = renderTemplate(
                _0x49cb14.value,
                _0x29d5f4,
              );
            }
          }
          _0x5d215d.json = _0xc44661;
        }
      }
      const _0x189356 = await _0x5e1314.http.request(_0x5d215d);
      const _0x2ea1b8 = _0x189356.json();
      clear(_0x188b8a);
      _0x188b8a.appendChild(
        h(
          'div',
          {
            class: 'wc-inline',
          },
          _0x5aee5a.chip(
            'Status ' + _0x189356.status,
            _0x189356.ok ? 'ok' : 'danger',
          ),
          h(
            'span',
            {
              class: 'wc-muted',
            },
            'What the API sent back:',
          ),
        ),
      );
      _0x188b8a.appendChild(
        h(
          'pre',
          {
            class: 'wc-pre',
          },
          _0x2ea1b8
            ? JSON.stringify(_0x2ea1b8, null, 2).slice(0, 2500)
            : _0x189356.text.slice(0, 1500),
        ),
      );
      if (_0x2ea1b8) {
        const _0x1ff804 = flattenPaths(_0x2ea1b8);
        if (_0x1ff804.length) {
          _0x188b8a.appendChild(
            h(
              'div',
              {
                class: 'wc-stack',
              },
              h(
                'span',
                {
                  class: 'wc-field-label',
                },
                'Click a field to save it as a variable',
              ),
              h(
                'div',
                {
                  class: 'wc-chip-row',
                },
                _0x1ff804.slice(0, 40).map((_0x346140) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'wc-pill',
                      title: 'Example: ' + _0x346140.sample,
                      onClick: () => {
                        _0x488178.mapping.push({
                          path: _0x346140.path,
                          variable: _0x346140.path
                            .split('.')
                            .pop()
                            .replace(/\W+/g, '_'),
                        });
                        _0x349dae();
                        _0x4f6b4f();
                      },
                    },
                    _0x346140.path,
                  ),
                ),
              ),
            ),
          );
        }
      }
    } catch (_0x5875fc) {
      clear(_0x188b8a);
      _0x188b8a.appendChild(
        _0x5aee5a.banner(_0x5875fc.message || 'The request failed.', 'danger'),
      );
      if (_0x5875fc && _0x5875fc.name === 'PermissionError') {
        _0x188b8a.appendChild(
          _0x5aee5a.button('Allow access to ' + _0x5875fc.origin, {
            variant: 'primary',
            onClick: () => _0x5e1314.http.grant(_0x5875fc.origin),
          }),
        );
      }
    }
  }
  _0x43d69f.appendChild(
    _0x5aee5a.row(
      _0x5aee5a.field(
        'Method',
        _0x5aee5a.select(
          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          _0x488178.method,
          (_0x56e653) => {
            _0x488178.method = _0x56e653;
            _0x4f6b4f();
            _0x80430c();
          },
        ),
      ),
      _0x5aee5a.field(
        'Give up after (seconds)',
        _0x5aee5a.input({
          type: 'number',
          min: 1,
          max: 60,
          value: _0x488178.timeoutSec,
          onInput: (_0x457b23) => {
            _0x488178.timeoutSec = Number(_0x457b23) || 15;
            _0x4f6b4f();
          },
        }),
      ),
    ),
  );
  _0x43d69f.appendChild(
    _0x5aee5a.field(
      'Address',
      _0x5aee5a.input({
        value: _0x488178.url,
        placeholder: 'https://api.example.com/orders/{{order}}',
        onInput: (_0x45ca01) => {
          _0x488178.url = _0x45ca01;
          _0x4f6b4f();
        },
      }),
      {
        hint: 'Put {{ }} around a variable to drop its value into the address.',
      },
    ),
  );
  _0x43d69f.appendChild(
    _0x5aee5a.field(
      'Headers',
      kvList(_0x488178.headers, _0x4f6b4f, {
        namePlaceholder: 'Header name',
        addLabel: 'Add header',
      }),
    ),
  );
  _0x43d69f.appendChild(
    _0x5aee5a.field(
      'Query parameters',
      kvList(_0x488178.params, _0x4f6b4f, {
        namePlaceholder: 'Parameter name',
        addLabel: 'Add parameter',
      }),
    ),
  );
  _0x43d69f.appendChild(_0x5aee5a.field('What to send', _0x5c0873));
  _0x80430c();
  _0x43d69f.appendChild(
    _0x5aee5a.checkbox(
      !!_0x488178.retry,
      (_0x2be054) => {
        _0x488178.retry = _0x2be054;
        _0x4f6b4f();
      },
      'Try once more if it fails to connect',
    ),
  );
  _0x43d69f.appendChild(
    _0x5aee5a.field(
      'Routes by status code',
      _0x5aee5a.tagInput({
        value: (_0x488178.statusRoutes || []).map(String),
        placeholder: 'e.g. 404 then Enter',
        validate: (_0x3ceae3) => /^\d{3}$/.test(_0x3ceae3),
        onChange: (_0x4b5ffb) => {
          _0x488178.statusRoutes = _0x4b5ffb.map(Number);
          _0x4f6b4f();
          _0x33886c();
        },
      }),
      {
        hint: 'A code you add here gets its own way out of this block. Every other failure takes "Fallback".',
      },
    ),
  );
  _0x43d69f.appendChild(
    _0x5aee5a.field('Save fields from the reply', _0x1a7a6c),
  );
  _0x349dae();
  _0x43d69f.appendChild(
    h(
      'div',
      {
        class: 'wc-subcard wc-stack',
      },
      h(
        'div',
        {
          class: 'wc-inline',
        },
        _0x5aee5a.button('Try it now', {
          icon: 'play',
          onClick: _0x29f471,
        }),
        h(
          'span',
          {
            class: 'wc-muted',
          },
          'Calls the API right now and shows what it sends back.',
        ),
      ),
      _0x188b8a,
    ),
  );
  return _0x43d69f;
}
export function nodeInspector({
  app: _0x280a57,
  graph: _0x48c610,
  node: _0x47c51f,
  flows: _0x2cde30,
  onChange: _0x4615d2,
  refresh: _0x5d0db0,
}) {
  const _0x16df51 = _0x47c51f.data;
  const _0x244c86 = NODE_TYPES[_0x47c51f.type];
  const _0x9bfb0e = h('div', {
    class: 'wc-stack wc-inspector',
  });
  const _0x1eb18f = variableNames(_0x48c610);
  _0x9bfb0e.appendChild(
    _0x5aee5a.field(
      'Block name',
      _0x5aee5a.input({
        value: _0x47c51f.title,
        placeholder: 'e.g. Ask for name',
        onInput: (_0x3142b4) => {
          _0x47c51f.title = _0x3142b4;
          _0x4615d2();
        },
      }),
      {
        hint: 'Only you see this, on the canvas.',
      },
    ),
  );
  switch (_0x47c51f.type) {
    case 'start':
      _0x9bfb0e.appendChild(
        _0x5aee5a.banner(
          'This is where every conversation begins. Connect it to your first block.',
          'info',
        ),
      );
      break;
    case 'text':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Message',
          formattedTextarea({
            value: _0x16df51.text,
            extraVariables: _0x1eb18f,
            placeholder: 'Hi {{firstname}}',
            onInput: (_0x31334b) => {
              _0x16df51.text = _0x31334b;
              _0x4615d2();
            },
          }),
        ),
      );
      _0x9bfb0e.appendChild(typingField(_0x16df51, _0x4615d2));
      _0x9bfb0e.appendChild(
        captureSection(_0x48c610, _0x16df51, _0x4615d2, _0x5d0db0),
      );
      break;
    case 'image':
    case 'video':
    case 'audio':
    case 'document':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'File',
          mediaPicker(_0x280a57, {
            kind: _0x47c51f.type,
            files: _0x16df51.files,
            onChange: (_0x325ce0) => {
              _0x16df51.files = _0x325ce0;
              _0x4615d2();
            },
          }),
        ),
      );
      if (_0x47c51f.type !== 'audio') {
        _0x9bfb0e.appendChild(
          _0x5aee5a.field(
            'Caption',
            formattedTextarea({
              value: _0x16df51.caption,
              extraVariables: _0x1eb18f,
              rows: 3,
              onInput: (_0x12aa4e) => {
                _0x16df51.caption = _0x12aa4e;
                _0x4615d2();
              },
            }),
          ),
        );
      }
      _0x9bfb0e.appendChild(typingField(_0x16df51, _0x4615d2));
      _0x9bfb0e.appendChild(
        captureSection(_0x48c610, _0x16df51, _0x4615d2, _0x5d0db0),
      );
      break;
    case 'buttons':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Message',
          formattedTextarea({
            value: _0x16df51.text,
            extraVariables: _0x1eb18f,
            placeholder: 'Would you like to book a slot?',
            onInput: (_0x180980) => {
              _0x16df51.text = _0x180980;
              _0x4615d2();
            },
          }),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Buttons',
          h(
            'div',
            {
              class: 'wc-stack',
            },
            optionsRows(
              _0x16df51.buttons,
              _0x4615d2,
              _0x5d0db0,
              'e.g. Yes, please',
            ),
            _0x5aee5a.button('Add button', {
              icon: 'plus',
              size: 'sm',
              onClick: () => {
                _0x16df51.buttons.push({
                  text: '',
                });
                _0x4615d2();
                _0x5d0db0();
              },
            }),
          ),
          {
            hint: 'Shown as a numbered menu. Customers reply with the number or the text.',
          },
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Footer (optional)',
          _0x5aee5a.input({
            value: _0x16df51.footer,
            placeholder: 'Reply with 1 or 2',
            onInput: (_0x1a64b6) => {
              _0x16df51.footer = _0x1a64b6;
              _0x4615d2();
            },
          }),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Remember their choice as',
          varInput(
            _0x48c610,
            _0x16df51.saveAs,
            (_0x41c352) => {
              _0x16df51.saveAs = _0x41c352.trim();
              _0x4615d2();
            },
            'e.g. topic',
          ),
        ),
      );
      _0x9bfb0e.appendChild(timeoutFields(_0x16df51, _0x4615d2, _0x5d0db0));
      break;
    case 'list':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Message',
          formattedTextarea({
            value: _0x16df51.text,
            extraVariables: _0x1eb18f,
            rows: 3,
            onInput: (_0x124908) => {
              _0x16df51.text = _0x124908;
              _0x4615d2();
            },
          }),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Footer (optional)',
          _0x5aee5a.input({
            value: _0x16df51.footer,
            onInput: (_0x4a2064) => {
              _0x16df51.footer = _0x4a2064;
              _0x4615d2();
            },
          }),
        ),
      );
      _0x16df51.sections.forEach((_0x559184, _0x229103) =>
        _0x9bfb0e.appendChild(
          h(
            'div',
            {
              class: 'wc-subcard wc-stack',
            },
            h(
              'div',
              {
                class: 'wc-form-row wc-row-remove',
              },
              _0x5aee5a.input({
                value: _0x559184.title,
                placeholder: 'Section name',
                onInput: (_0x4a1b80) => {
                  _0x559184.title = _0x4a1b80;
                  _0x4615d2();
                },
              }),
              _0x16df51.sections.length > 1
                ? _0x5aee5a.iconButton(
                    'trash-2',
                    'Remove section',
                    () => {
                      _0x16df51.sections.splice(_0x229103, 1);
                      _0x4615d2();
                      _0x5d0db0();
                    },
                    'is-danger',
                  )
                : h('span'),
            ),
            optionsRows(_0x559184.rows, _0x4615d2, _0x5d0db0, 'Row title'),
            _0x5aee5a.button('Add row', {
              icon: 'plus',
              size: 'sm',
              onClick: () => {
                _0x559184.rows.push({
                  title: '',
                  description: '',
                });
                _0x4615d2();
                _0x5d0db0();
              },
            }),
          ),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.button('Add section', {
          icon: 'plus',
          size: 'sm',
          onClick: () => {
            _0x16df51.sections.push({
              title: '',
              rows: [
                {
                  title: '',
                  description: '',
                },
              ],
            });
            _0x4615d2();
            _0x5d0db0();
          },
        }),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Remember their choice as',
          varInput(
            _0x48c610,
            _0x16df51.saveAs,
            (_0x4ce2f6) => {
              _0x16df51.saveAs = _0x4ce2f6.trim();
              _0x4615d2();
            },
            'e.g. service',
          ),
        ),
      );
      _0x9bfb0e.appendChild(timeoutFields(_0x16df51, _0x4615d2, _0x5d0db0));
      break;
    case 'condition': {
      _0x9bfb0e.appendChild(
        _0x5aee5a.banner(
          'The first condition whose rules match is the route the bot takes. If none match, it takes "Otherwise".',
          'info',
        ),
      );
      _0x16df51.branches.forEach((_0x132b1d, _0x155e41) =>
        _0x9bfb0e.appendChild(
          h(
            'div',
            {
              class: 'wc-subcard wc-stack',
            },
            h(
              'div',
              {
                class: 'wc-inline wc-between',
              },
              h('strong', null, 'Condition ' + (_0x155e41 + 1)),
              h(
                'div',
                {
                  class: 'wc-inline',
                },
                _0x5aee5a.select(
                  [
                    {
                      value: 'and',
                      label: 'All rules match',
                    },
                    {
                      value: 'or',
                      label: 'Any rule matches',
                    },
                  ],
                  _0x132b1d.join,
                  (_0x506d07) => {
                    _0x132b1d.join = _0x506d07;
                    _0x4615d2();
                  },
                ),
                _0x16df51.branches.length > 1
                  ? _0x5aee5a.iconButton(
                      'trash-2',
                      'Remove condition',
                      () => {
                        _0x16df51.branches.splice(_0x155e41, 1);
                        _0x4615d2();
                        _0x5d0db0();
                      },
                      'is-danger',
                    )
                  : null,
              ),
            ),
            _0x132b1d.rules.map((_0x4d5da1, _0x43312f) =>
              h(
                'div',
                {
                  class: 'wc-rule',
                },
                varInput(
                  _0x48c610,
                  _0x4d5da1.variable,
                  (_0x4d885c) => {
                    _0x4d5da1.variable = _0x4d885c.trim();
                    _0x4615d2();
                  },
                  'variable',
                ),
                _0x5aee5a.select(
                  OPERATORS.map((_0x4efc9e) => ({
                    value: _0x4efc9e.id,
                    label: _0x4efc9e.label,
                  })),
                  _0x4d5da1.operator,
                  (_0x795f8d) => {
                    _0x4d5da1.operator = _0x795f8d;
                    _0x4615d2();
                    _0x5d0db0();
                  },
                ),
                OPERATORS.find(
                  (_0x110b42) => _0x110b42.id === _0x4d5da1.operator,
                ).needsValue
                  ? _0x5aee5a.input({
                      value: _0x4d5da1.value,
                      placeholder: 'value',
                      onInput: (_0x3c3934) => {
                        _0x4d5da1.value = _0x3c3934;
                        _0x4615d2();
                      },
                    })
                  : h('span'),
                _0x132b1d.rules.length > 1
                  ? _0x5aee5a.iconButton('x', 'Remove rule', () => {
                      _0x132b1d.rules.splice(_0x43312f, 1);
                      _0x4615d2();
                      _0x5d0db0();
                    })
                  : h('span'),
              ),
            ),
            _0x5aee5a.button('Add rule', {
              icon: 'plus',
              size: 'sm',
              onClick: () => {
                _0x132b1d.rules.push({
                  variable: '',
                  operator: 'equals',
                  value: '',
                });
                _0x4615d2();
                _0x5d0db0();
              },
            }),
          ),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.button('Add condition', {
          icon: 'plus',
          size: 'sm',
          onClick: () => {
            _0x16df51.branches.push({
              join: 'and',
              rules: [
                {
                  variable: '',
                  operator: 'equals',
                  value: '',
                },
              ],
            });
            _0x4615d2();
            _0x5d0db0();
          },
        }),
      );
      break;
    }
    case 'setVariable':
      _0x9bfb0e.appendChild(
        h(
          'div',
          {
            class: 'wc-stack',
          },
          _0x16df51.entries.map((_0x4b65f6, _0x11fe96) =>
            h(
              'div',
              {
                class: 'wc-subcard wc-stack',
              },
              h(
                'div',
                {
                  class: 'wc-form-row wc-row-remove',
                },
                varInput(
                  _0x48c610,
                  _0x4b65f6.name,
                  (_0x22d419) => {
                    _0x4b65f6.name = _0x22d419.trim();
                    _0x4615d2();
                  },
                  'Variable name',
                ),
                _0x16df51.entries.length > 1
                  ? _0x5aee5a.iconButton(
                      'trash-2',
                      'Remove',
                      () => {
                        _0x16df51.entries.splice(_0x11fe96, 1);
                        _0x4615d2();
                        _0x5d0db0();
                      },
                      'is-danger',
                    )
                  : h('span'),
              ),
              _0x5aee5a.field(
                'Remember it as',
                _0x5aee5a.select(
                  [
                    {
                      value: 'chatbot',
                      label: 'Chatbot variable (only during this chat)',
                    },
                    {
                      value: 'contact',
                      label: 'Contact attribute (saved on the contact)',
                    },
                  ],
                  _0x4b65f6.scope,
                  (_0x396719) => {
                    _0x4b65f6.scope = _0x396719;
                    _0x4615d2();
                  },
                ),
              ),
              _0x5aee5a.field(
                'Value',
                _0x5aee5a.input({
                  value: _0x4b65f6.value,
                  placeholder: 'e.g. gold, or @firstname',
                  onInput: (_0x5b729b) => {
                    _0x4b65f6.value = _0x5b729b;
                    _0x4615d2();
                  },
                }),
                {
                  hint: 'Type @ and a variable name to copy another value.',
                },
              ),
            ),
          ),
          _0x5aee5a.button('Add another', {
            icon: 'plus',
            size: 'sm',
            onClick: () => {
              _0x16df51.entries.push({
                name: '',
                scope: 'chatbot',
                value: '',
              });
              _0x4615d2();
              _0x5d0db0();
            },
          }),
        ),
      );
      break;
    case 'delay':
      _0x9bfb0e.appendChild(
        _0x5aee5a.row(
          _0x5aee5a.field(
            'Wait for',
            _0x5aee5a.input({
              type: 'number',
              min: 1,
              value: _0x16df51.value,
              onInput: (_0x1fb20a) => {
                _0x16df51.value = Number(_0x1fb20a) || 0;
                _0x4615d2();
              },
            }),
          ),
          _0x5aee5a.field(
            'Unit',
            _0x5aee5a.select(
              ['seconds', 'minutes', 'hours'],
              _0x16df51.unit,
              (_0x1c41c4) => {
                _0x16df51.unit = _0x1c41c4;
                _0x4615d2();
              },
            ),
          ),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.banner(
          'The flow pauses here, then carries on by itself.',
          'info',
        ),
      );
      break;
    case 'jump':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Go to this block',
          _0x5aee5a.select(
            [
              {
                value: '',
                label: 'Pick a block',
              },
            ].concat(
              _0x48c610.nodes
                .filter(
                  (_0x1161fc) =>
                    _0x1161fc.id !== _0x47c51f.id && _0x1161fc.type !== 'start',
                )
                .map((_0x478888) => ({
                  value: _0x478888.id,
                  label: nodeLabel(_0x478888),
                })),
            ),
            _0x16df51.targetId,
            (_0x4a673f) => {
              _0x16df51.targetId = _0x4a673f;
              _0x4615d2();
            },
          ),
          {
            hint: 'The flow carries on from there. You do not need to draw a line to it.',
          },
        ),
      );
      break;
    case 'startNewFlow':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Hand over to this chatbot',
          _0x5aee5a.select(
            [
              {
                value: '',
                label: 'Pick a chatbot',
              },
            ].concat(
              _0x2cde30.map((_0x369abc) => ({
                value: _0x369abc.id,
                label: _0x369abc.name,
              })),
            ),
            _0x16df51.flowId,
            (_0x7df411) => {
              _0x16df51.flowId = _0x7df411;
              _0x4615d2();
            },
          ),
          {
            hint: 'This flow ends here, and the one you pick starts from its beginning.',
          },
        ),
      );
      if (!_0x2cde30.length) {
        _0x9bfb0e.appendChild(
          _0x5aee5a.banner(
            'You only have this one chatbot. Create another to hand the chat over to it.',
            'warn',
          ),
        );
      }
      break;
    case 'tag': {
      const _0x32701f = _0x280a57.crm.tags().map((_0x28f182) => ({
        value: _0x28f182.id,
        label: _0x28f182.name,
        color: _0x28f182.color,
      }));
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Add tags',
          _0x5aee5a.multiSelect({
            options: _0x32701f,
            value: _0x16df51.add,
            placeholder: 'Select tags',
            onChange: (_0x51ca19) => {
              _0x16df51.add = _0x51ca19;
              _0x4615d2();
            },
          }),
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Remove tags from the contact',
          _0x5aee5a.multiSelect({
            options: _0x32701f,
            value: _0x16df51.remove,
            placeholder: 'Select tags to remove',
            onChange: (_0xa91c08) => {
              _0x16df51.remove = _0xa91c08;
              _0x4615d2();
            },
          }),
        ),
      );
      if (!_0x32701f.length) {
        _0x9bfb0e.appendChild(
          _0x5aee5a.banner('No tags yet. Create some in CRM settings.', 'warn'),
        );
      }
      break;
    }
    case 'action':
      _0x9bfb0e.appendChild(
        postActionsEditor(_0x280a57, _0x16df51.actions, {
          onChange: (_0x5dff7e) => {
            _0x16df51.actions = _0x5dff7e;
            _0x4615d2();
          },
        }),
      );
      break;
    case 'webhook':
      _0x9bfb0e.appendChild(
        webhookForm(_0x280a57, _0x48c610, _0x16df51, _0x4615d2, _0x5d0db0),
      );
      break;
    case 'handoff':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Message for the customer',
          _0x5aee5a.textarea({
            value: _0x16df51.customerMessage,
            rows: 2,
            placeholder: 'One moment, a colleague is joining you now.',
            onInput: (_0x253b25) => {
              _0x16df51.customerMessage = _0x253b25;
              _0x4615d2();
            },
          }),
          {
            hint: 'One last line from the bot before a person takes over.',
          },
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Notify a teammate on WhatsApp (optional)',
          _0x5aee5a.input({
            value: _0x16df51.agentPhone,
            placeholder: '+1 555 010 0999',
            onInput: (_0x4e997b) => {
              _0x16df51.agentPhone = _0x4e997b;
              _0x4615d2();
            },
          }),
          {
            hint: 'Their number, with country code.',
          },
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Message to the teammate',
          _0x5aee5a.textarea({
            value: _0x16df51.agentMessage,
            rows: 2,
            onInput: (_0x126304) => {
              _0x16df51.agentMessage = _0x126304;
              _0x4615d2();
            },
          }),
          {
            hint: "Use {{mob_no}} to insert the customer's number.",
          },
        ),
      );
      _0x9bfb0e.appendChild(
        _0x5aee5a.banner(
          'After a hand-off the bots stay quiet in this chat until you resume them from the CRM drawer.',
          'info',
        ),
      );
      break;
    case 'end':
      _0x9bfb0e.appendChild(
        _0x5aee5a.field(
          'Ending message',
          _0x5aee5a.textarea({
            value: _0x16df51.message,
            rows: 2,
            placeholder:
              'Thanks for chatting! We are here whenever you need us.',
            onInput: (_0x3859f8) => {
              _0x16df51.message = _0x3859f8;
              _0x4615d2();
            },
          }),
          {
            hint: 'Leave it empty to end without saying anything.',
          },
        ),
      );
      break;
    default:
      break;
  }
  return _0x9bfb0e;
}
export function flowInspector({
  app: _0x549e26,
  flow: _0x3888e7,
  graph: _0x4349d1,
  onChange: _0x400804,
  onEditTrigger: _0x183660,
}) {
  const _0x22911c = _0x4349d1.settings;
  const _0x180d2a = h('div', {
    class: 'wc-stack wc-inspector',
  });
  const _0x403a3c = _0x3888e7.trigger || {};
  _0x180d2a.appendChild(
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'Flow overview',
    ),
  );
  _0x180d2a.appendChild(
    h(
      'div',
      {
        class: 'wc-kv',
      },
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
          'Blocks',
        ),
        h(
          'span',
          {
            class: 'wc-kv-v',
          },
          String(_0x4349d1.nodes.length),
        ),
      ),
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
          'Connections',
        ),
        h(
          'span',
          {
            class: 'wc-kv-v',
          },
          String(_0x4349d1.edges.length),
        ),
      ),
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
          'Variables',
        ),
        h(
          'span',
          {
            class: 'wc-kv-v',
          },
          variableNames(_0x4349d1).join(', ') || 'None yet',
        ),
      ),
    ),
  );
  _0x180d2a.appendChild(
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'Trigger',
    ),
  );
  _0x180d2a.appendChild(
    h(
      'div',
      {
        class: 'wc-callout',
      },
      icon('flag', 16),
      h(
        'span',
        null,
        _0x403a3c.type === 'keyword'
          ? 'Keywords: ' + ((_0x403a3c.keywords || []).join(', ') || 'none yet')
          : _0x403a3c.type === 'any_message'
            ? 'Every new chat'
            : 'Started manually',
      ),
    ),
  );
  _0x180d2a.appendChild(
    _0x5aee5a.button('Edit trigger and name', {
      icon: 'settings-2',
      size: 'sm',
      onClick: _0x183660,
    }),
  );
  _0x180d2a.appendChild(
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'When nothing matches',
    ),
  );
  _0x180d2a.appendChild(
    _0x5aee5a.field(
      'Reply with',
      _0x5aee5a.input({
        value: _0x22911c.fallbackMessage,
        placeholder: "Sorry, I didn't understand that.",
        onInput: (_0x3e8013) => {
          _0x22911c.fallbackMessage = _0x3e8013;
          _0x400804();
        },
      }),
      {
        hint: 'Sent every time an answer is not understood.',
      },
    ),
  );
  _0x180d2a.appendChild(
    _0x5aee5a.field(
      'Retries before giving up',
      _0x5aee5a.input({
        type: 'number',
        min: 0,
        max: 5,
        value: _0x22911c.maxRetries ?? 2,
        onInput: (_0x28ab83) => {
          _0x22911c.maxRetries = Math.max(0, Number(_0x28ab83) || 0);
          _0x400804();
        },
      }),
    ),
  );
  _0x180d2a.appendChild(
    h(
      'div',
      {
        class: 'wc-section-title',
      },
      'Rules for the whole flow',
    ),
  );
  _0x180d2a.appendChild(
    _0x5aee5a.field(
      'Opt-out words',
      _0x5aee5a.tagInput({
        value: _0x22911c.optOutKeywords || [],
        placeholder: 'e.g. stop',
        onChange: (_0x5857d9) => {
          _0x22911c.optOutKeywords = _0x5857d9;
          _0x400804();
        },
      }),
      {
        hint: 'A customer who sends one of these ends the chat and is not contacted by chatbots again.',
      },
    ),
  );
  _0x180d2a.appendChild(
    _0x5aee5a.field(
      'Message after opt-out',
      _0x5aee5a.input({
        value: _0x22911c.optOutMessage || '',
        onInput: (_0x5a98da) => {
          _0x22911c.optOutMessage = _0x5a98da;
          _0x400804();
        },
      }),
    ),
  );
  const _0x2c2d33 = (_0x22911c.interruptKeywords ||= []);
  const _0x32f784 = h('div', {
    class: 'wc-stack',
  });
  function _0x4653e1() {
    clear(_0x32f784);
    _0x2c2d33.forEach((_0x59dbff, _0xe37727) =>
      _0x32f784.appendChild(
        h(
          'div',
          {
            class: 'wc-form-row wc-row-remove',
          },
          _0x5aee5a.input({
            value: _0x59dbff.keyword,
            placeholder: 'Keyword, e.g. menu',
            onInput: (_0x173180) => {
              _0x59dbff.keyword = _0x173180;
              _0x400804();
            },
          }),
          _0x5aee5a.select(
            [
              {
                value: '',
                label: 'Jump to...',
              },
            ].concat(
              _0x4349d1.nodes
                .filter((_0x8e674d) => _0x8e674d.type !== 'start')
                .map((_0x1e5acc) => ({
                  value: _0x1e5acc.id,
                  label: nodeLabel(_0x1e5acc),
                })),
            ),
            _0x59dbff.targetNodeId,
            (_0x269bf1) => {
              _0x59dbff.targetNodeId = _0x269bf1;
              _0x400804();
            },
          ),
          _0x5aee5a.iconButton(
            'trash-2',
            'Remove',
            () => {
              _0x2c2d33.splice(_0xe37727, 1);
              _0x4653e1();
              _0x400804();
            },
            'is-danger',
          ),
        ),
      ),
    );
    _0x32f784.appendChild(
      _0x5aee5a.button('Add jump word', {
        icon: 'plus',
        size: 'sm',
        onClick: () => {
          _0x2c2d33.push({
            keyword: '',
            targetNodeId: '',
          });
          _0x4653e1();
          _0x400804();
        },
      }),
    );
  }
  _0x4653e1();
  _0x180d2a.appendChild(
    _0x5aee5a.field('Words that jump to a block from anywhere', _0x32f784, {
      hint: 'For example "menu" can always take the customer back to the main menu.',
    }),
  );
  _0x180d2a.appendChild(
    _0x5aee5a.field(
      'Forget idle chats after (hours)',
      _0x5aee5a.input({
        type: 'number',
        min: 1,
        value: _0x22911c.sessionTtlHours || 24,
        onInput: (_0x8b4578) => {
          _0x22911c.sessionTtlHours = Math.max(1, Number(_0x8b4578) || 24);
          _0x400804();
        },
      }),
    ),
  );
  return _0x180d2a;
}
